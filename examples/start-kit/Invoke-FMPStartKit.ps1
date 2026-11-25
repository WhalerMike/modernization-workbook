#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the Start Kit: a read-only assessment of the forest, the SQL Server estate and the
    RADIUS and NPS estate, a one-page summary, and a provenance manifest, all under one run
    folder.

.DESCRIPTION
    Creates <OutputPath>\<run-id>, where the run identifier is Book 01 Chapter 10's
    YYYY-MM-DD-HHmm-<host>-tier<A|B> in UTC, then:
      1. Test-FMPReadAccess          what this account can read; the draft delegation request
      2. Invoke-FMPADAssessment      the twelve domains plus DHCP, the SPN map and LDAP binds
      3. Invoke-FMPSqlEstateDiscovery  the SQL Server count and inventory (unless -SkipSql)
      4. Invoke-FMPNpsInventory      NPS servers, RADIUS clients and policies (unless -SkipNps)
      5. Invoke-FMPTransactionProfile  transaction profiles and the separation gate, from
                                     -TransactionCatalog; without one, a catalog template
      6. Get-FMPAttributeSurvey      fill rate and value quality of the migration's
                                     attributes, through the Global Catalog (unless
                                     -SkipAttributeSurvey)
      7. Get-FMPWaveList             migration waves from those attributes: from -WavePlan,
                                     or one per organization code
      8. Get-FMPStartKitSummary      Summary\StartKitSummary.md and .json
      9. AssessmentManifest.json     who, when, where, module versions, SHA-256 of every file

    Nothing here writes to Active Directory, DNS, DHCP, AD CS, NPS or SQL Server. Every file
    goes under the run folder. Tier B adds the collectors that need the narrow delegations
    (DHCP, LDAP binding events); a Tier A run still records which reads were denied. The
    NPS step always lists the servers; reading their configuration needs local
    administrator rights on each one, and a denied read is recorded, not fatal.

    Large directories: every directory read is paged (-PageSize), split by domain and by the
    OUs and containers under each domain head, retried with backoff on ADWS and LDAP timeouts
    and busy servers (-MaxRetries), and streamed to disk. The run writes RunLog.txt (every
    step, heartbeat and retry) and RunState.json (each step's outcome); -Resume picks up the
    newest unfinished run under -OutputPath, skips the steps that completed and, within the
    user, computer and group reads, the partitions that completed. Each long step shows
    Write-Progress with a count, a percentage and an estimate of the time left, writes a
    heartbeat line every 30 seconds or 10,000 objects, and ends with a summary line. -Quiet
    keeps the console to the first and last lines for unattended runs; the log is complete.

    Before anything is read, the pre-flight checks stop the run with a clear message when the
    host isn't Windows, the ActiveDirectory module is missing, the kit's files are blocked
    by the execution policy, the forest or its Active Directory Web Services can't be
    reached, the output folder can't be written, or this account can't read user objects.

    Illustrative: unit-tested against fixtures, not proven against a live estate.

.EXAMPLE
    .\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment

    Tier A: directory, DNS zones, PKI configuration, the SPN and directory SQL signals.

.EXAMPLE
    .\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment -Tier B -ProbeNetwork -QueryInstances

    Tier B, with the SQL Browser probe and the read-only T-SQL pass on every instance found.

.EXAMPLE
    .\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment -Resume -Quiet

    Carries on the newest unfinished run under D:\Assessment, unattended.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OutputPath,
    [string[]]$Domain,
    # Defaults to the forest this host is joined to.
    [string]$Forest,
    [ValidateSet('A', 'B')][string]$Tier = 'A',
    [int]$StaleThresholdDays = 90,
    [switch]$SkipAD,
    [switch]$SkipSql,
    [string[]]$TargetServers = @(),
    [switch]$ProbeNetwork,
    [switch]$ProbeAllServers,
    [switch]$UseDbatools,
    [switch]$QueryInstances,
    [switch]$TrustServerCertificate,
    [int]$ZombieThresholdDays = 400,
    [switch]$SkipNps,
    # NPS servers outside the RAS and IAS Servers groups, and configuration exports on disk.
    [string[]]$NpsServers = @(),
    [string[]]$NpsConfigPath = @(),
    [switch]$SkipTransactionProfiles,
    # The team's transaction catalog, and folders of measurements taken before the run.
    [string]$TransactionCatalog,
    [string[]]$TransactionMeasurementPath = @(),
    [switch]$SkipAttributeSurvey,
    # A pattern every enterprise person key matches, the code lists, the tenant's routable UPN suffixes.
    [string]$KeyPattern,
    [string]$CodeListPath,
    [string[]]$UpnSuffix = @(),
    # wave-plan.csv (WaveId, Attribute, Value) and asset-ownership.csv for the wave lists.
    [string]$WavePlan,
    [string]$AssetOwnership,
    # Large directories: carry on an unfinished run, page size, retries, console output.
    [switch]$Resume,
    [switch]$Quiet,
    [ValidateRange(1, 5000)][int]$PageSize = 256,
    [ValidateRange(0, 20)][int]$MaxRetries = 4,
    [ValidateRange(0, 600)][double]$RetryBaseSeconds = 5,
    [ValidateRange(1, 3600)][int]$HeartbeatSeconds = 30,
    # Resolve each computer's IPv4 address in DNS (slow: one lookup per computer).
    [switch]$ResolveIPv4,
    # Run the checks and stop: nothing is read beyond what the checks need.
    [switch]$PreflightOnly
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------- pre-flight
# Checked before any module loads, so a blocked download or a missing RSAT module stops the
# run here with what to do, not halfway through with a raw error.
$preflight = [System.Collections.Generic.List[object]]::new()
function Get-PreflightRow([string]$Check, [string]$Status, [string]$Detail, [string]$Fix) {
    [pscustomobject][ordered]@{ Check = $Check; Status = $Status; Detail = $Detail; Fix = $Fix }
}
$onWindows = [Environment]::OSVersion.Platform -eq 'Win32NT'
$preflight.Add((Get-PreflightRow 'Operating system' $(if ($onWindows) { 'PASS' } else { 'INFO' }) ([Environment]::OSVersion.VersionString) 'Run the kit on a domain-joined Windows host with RSAT; elsewhere the ActiveDirectory module check below fails.'))
$edition = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"
$preflight.Add((Get-PreflightRow 'PowerShell' $(if ($PSVersionTable.PSEdition -eq 'Desktop') { 'PASS' } else { 'INFO' }) $edition 'The kit declares Windows PowerShell 5.1 and is tested on 5.1 and 7; the workbook''s captures come from 5.1.'))
$culture = "$([System.Globalization.CultureInfo]::CurrentUICulture.Name)"
$preflight.Add((Get-PreflightRow 'Display language' 'INFO' $culture 'Privileged groups are found by well-known SID and retries by error type, so any language works.'))
$adModule = Get-Module -ListAvailable -Name ActiveDirectory | Sort-Object Version -Descending | Select-Object -First 1
$preflight.Add((Get-PreflightRow 'ActiveDirectory module' $(if ($adModule) { 'PASS' } else { 'FAIL' }) $(if ($adModule) { "Version $($adModule.Version)" } else { 'Not installed' }) 'Windows Server: Install-WindowsFeature RSAT-AD-PowerShell. Windows 10 or 11: Add-WindowsCapability -Online -Name Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0'))
$policy = "$(Get-ExecutionPolicy)"
$blocked = @()
if ($onWindows) {
    $blocked = @(Get-ChildItem -LiteralPath $PSScriptRoot -Recurse -File -Include *.ps1, *.psm1, *.psd1 |
            Where-Object { Get-Item -LiteralPath $_.FullName -Stream Zone.Identifier -ErrorAction SilentlyContinue })
}
$policyBlocks = $policy -in 'Restricted', 'AllSigned' -or ($policy -eq 'RemoteSigned' -and $blocked.Count -gt 0)
$preflight.Add((Get-PreflightRow 'Execution policy' $(if ($policyBlocks) { 'FAIL' } else { 'PASS' }) "$policy; $($blocked.Count) kit file(s) marked as downloaded from the internet" `
            "Unblock the kit once after unzipping: Get-ChildItem -Recurse '$PSScriptRoot' | Unblock-File. Or sign the modules, as the README asks, for AllSigned."))
$failedChecks = @($preflight | Where-Object Status -eq 'FAIL')
if ($failedChecks.Count -gt 0) {
    $preflight | Format-Table Check, Status, Detail -AutoSize | Out-String | Write-Host
    $msg = ($failedChecks | ForEach-Object { "$($_.Check): $($_.Detail). $($_.Fix)" }) -join "`n"
    throw "Start Kit pre-flight failed; nothing was read.`n$msg"
}

# Imported once; a session that already loaded them (the tests, or a signed copy) keeps its own.
foreach ($m in 'FMPADAssessment', 'FMPSqlEstate', 'FMPNpsInventory', 'FMPTransactionProfile', 'FMPAttributeSurvey') {
    if (-not (Get-Module -Name $m)) { Import-Module (Join-Path (Join-Path $PSScriptRoot 'powershell') $m) }
}
# The run script uses the shared helpers directly for the run folder and the manifest.
. (Join-Path (Join-Path $PSScriptRoot 'powershell') 'StartKit.Common.ps1')

$start = Get-Date
$base = Resolve-FMPOutputRoot -OutputPath $OutputPath
$runId = $null
if ($Resume) {
    # The newest run under -OutputPath that has a RunState.json but no manifest: it stopped.
    $open = @(Get-ChildItem -LiteralPath $base -Directory | Where-Object {
            $_.Name -match '^\d{4}-\d{2}-\d{2}-\d{4}-.+-tier[AB]$' -and $_.Name -like "*-tier$Tier" -and
            (Test-Path -LiteralPath (Join-Path $_.FullName 'RunState.json')) -and -not (Test-Path -LiteralPath (Join-Path $_.FullName 'AssessmentManifest.json'))
        } | Sort-Object Name -Descending)
    if ($open.Count -gt 0) { $runId = $open[0].Name }
    else { Write-Warning "-Resume: no unfinished tier $Tier run under $base; starting a new run." }
}
if (-not $runId) { $runId = ConvertTo-FMPRunId -AsOf $start -HostName ([Environment]::MachineName) -Tier $Tier }
$runPath = Resolve-FMPOutputRoot -OutputPath (Join-Path $base $runId)

# The last finished run's counts, for the progress bar's percentage and time left.
$estimates = @{}
$previous = @(Get-ChildItem -LiteralPath $base -Directory | Where-Object { $_.Name -ne $runId -and (Test-Path -LiteralPath (Join-Path $_.FullName 'AssessmentManifest.json')) } | Sort-Object Name -Descending | Select-Object -First 1)
foreach ($prev in $previous) {
    foreach ($dd in @(Get-ChildItem -LiteralPath $prev.FullName -Directory)) {
        foreach ($pair in @(@('Users', 'UserCounts.json', 'Users'), @('Computers', 'ComputerCounts.json', 'Computers'), @('Groups', 'GroupCounts.json', 'Groups'))) {
            $f = Join-Path (Join-Path $dd.FullName 'Objects') $pair[1]
            if (Test-Path -LiteralPath $f) { $c = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json; $estimates["$($dd.Name)|$($pair[0])"] = [long]$c.($pair[2]) }
        }
    }
}
$null = Initialize-FMPRunContext -RunPath $runPath -Quiet:$Quiet -PageSize $PageSize -MaxRetries $MaxRetries -RetryBaseSeconds $RetryBaseSeconds `
    -HeartbeatSeconds $HeartbeatSeconds -Resume:$Resume -Estimates $estimates
Write-Host ("Start Kit run {0} (read-only{1}). Output: {2}" -f $runId, $(if ($Resume -and (Test-Path -LiteralPath (Join-Path $runPath 'RunState.json'))) { ', resumed' } else { '' }), $runPath)
Write-FMPLog -Message "Start Kit $runId on $([Environment]::MachineName) as $(Get-FMPExecutor); PowerShell $edition; page size $PageSize, retries $MaxRetries"

# Preflight.json is written first as the write test, and again with every check below.
try { Write-FMPJson -InputObject @($preflight) -Path (Join-Path $runPath 'Preflight.json'); $preflight.Add((Get-PreflightRow 'Output folder' 'PASS' $runPath '')) }
catch { $preflight.Add((Get-PreflightRow 'Output folder' 'FAIL' "$runPath`: $($_.Exception.Message)" 'Choose an -OutputPath this account can write to.')) }
try {
    $adForest = if ($Forest) { Get-ADForest -Server $Forest -ErrorAction Stop } else { Get-ADForest -ErrorAction Stop }
    $preflight.Add((Get-PreflightRow 'Forest' 'PASS' "$($adForest.Name): $(@($adForest.Domains).Count) domain(s)" ''))
} catch {
    $adForest = $null
    $preflight.Add((Get-PreflightRow 'Forest' 'FAIL' $_.Exception.Message 'Check that this host is joined to the forest (or pass -Forest), resolves its domain controllers in DNS, and reaches Active Directory Web Services on TCP 9389.'))
}
if (-not $Domain -and $adForest) { $Domain = @($adForest.Domains) }
$servedBy = @{}
foreach ($d in @($Domain)) {
    try {
        $servedBy[$d] = (Get-ADDomainController -DomainName $d -Discover -Service ADWS -ErrorAction Stop).HostName | Select-Object -First 1
        $preflight.Add((Get-PreflightRow "Active Directory Web Services ($d)" 'PASS' "$($servedBy[$d])" ''))
    } catch {
        $servedBy[$d] = $null
        $preflight.Add((Get-PreflightRow "Active Directory Web Services ($d)" 'FAIL' $_.Exception.Message "No domain controller with ADWS found for $d. Check DNS and TCP 9389, or leave the domain out with -Domain."))
    }
}
Write-FMPJson -InputObject @($preflight) -Path (Join-Path $runPath 'Preflight.json')
foreach ($row in $preflight) { Write-FMPLog -Level $(if ($row.Status -eq 'FAIL') { 'ERROR' } else { 'INFO' }) -Message "Pre-flight $($row.Check): $($row.Status). $($row.Detail)" }
$failedChecks = @($preflight | Where-Object Status -eq 'FAIL')
if ($failedChecks.Count -gt 0) {
    throw ("Start Kit pre-flight failed; see $(Join-Path $runPath 'Preflight.json').`n" + (($failedChecks | ForEach-Object { "$($_.Check): $($_.Detail). $($_.Fix)" }) -join "`n"))
}

$steps = @()
$readAccess = @()
$steps += Invoke-FMPStep 'Read-access pre-flight' { $script:readAccess = @(Test-FMPReadAccess -OutputPath $runPath -Domain $adForest.RootDomain); [pscustomobject]@{ ObjectCount = $script:readAccess.Count } }
$userRead = @($readAccess | Where-Object { $_.Area -eq 'Objects' })
if ($userRead.Count -gt 0 -and $userRead[0].Status -ne 'Readable') {
    throw "Start Kit pre-flight: this account can't read user objects in $($adForest.RootDomain) ($($userRead[0].Detail)). It needs Read on the domain naming context; see $(Join-Path (Join-Path $runPath 'Preflight') 'DelegationRequest.md')."
}
if ($PreflightOnly) {
    Write-Host "Pre-flight passed; -PreflightOnly, so nothing else was read. See $(Join-Path $runPath 'Preflight.json')."
    return
}
if (-not $SkipAD) {
    $steps += Invoke-FMPADAssessment -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -Tier $Tier -StaleThresholdDays $StaleThresholdDays -AsOf $start -ResolveIPv4:$ResolveIPv4
}
if (-not $SkipSql) {
    $steps += Invoke-FMPStep 'SQL Server estate' {
        Invoke-FMPSqlEstateDiscovery -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -TargetServers $TargetServers `
            -ProbeNetwork:$ProbeNetwork -ProbeAllServers:$ProbeAllServers -UseDbatools:$UseDbatools `
            -QueryInstances:$QueryInstances -TrustServerCertificate:$TrustServerCertificate `
            -ZombieThresholdDays $ZombieThresholdDays -AsOf $start
    }
}
if (-not $SkipNps) {
    $steps += Invoke-FMPStep 'RADIUS and NPS' {
        Invoke-FMPNpsInventory -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -NpsServers $NpsServers -ConfigPath $NpsConfigPath -AsOf $start
    }
}
if (-not $SkipTransactionProfiles) {
    $steps += Invoke-FMPStep 'Transaction profiles' {
        Invoke-FMPTransactionProfile -OutputPath $runPath -CatalogPath $TransactionCatalog -MeasurementPath $TransactionMeasurementPath -AsOf $start
    }
}
if (-not $SkipAttributeSurvey) {
    $steps += Invoke-FMPStep 'Attribute survey' {
        Get-FMPAttributeSurvey -OutputPath $runPath -Forest $adForest.Name -Domain $Domain -KeyPattern $KeyPattern `
            -CodeListPath $CodeListPath -UpnSuffix $UpnSuffix -AsOf $start
    }
    $steps += Invoke-FMPStep 'Wave lists' {
        Get-FMPWaveList -OutputPath $runPath -WavePlanPath $WavePlan -OwnershipPath $AssetOwnership -AsOf $start
    }
}
$steps += Invoke-FMPStep 'Summary' { Get-FMPStartKitSummary -RunPath $runPath }

$parameters = @{
    Tier = $Tier; StaleThresholdDays = $StaleThresholdDays; SkipAD = [bool]$SkipAD; SkipSql = [bool]$SkipSql
    TargetServerCount = @($TargetServers).Count; ProbeNetwork = [bool]$ProbeNetwork; ProbeAllServers = [bool]$ProbeAllServers
    UseDbatools = [bool]$UseDbatools; QueryInstances = [bool]$QueryInstances; ZombieThresholdDays = $ZombieThresholdDays
    SkipNps = [bool]$SkipNps; NpsServerCount = @($NpsServers).Count; NpsConfigFileCount = @($NpsConfigPath).Count
    SkipTransactionProfiles = [bool]$SkipTransactionProfiles; TransactionCatalog = [bool]$TransactionCatalog
    TransactionMeasurementPathCount = @($TransactionMeasurementPath).Count
    SkipAttributeSurvey = [bool]$SkipAttributeSurvey; KeyPattern = [bool]$KeyPattern; CodeList = [bool]$CodeListPath
    UpnSuffixCount = @($UpnSuffix).Count; WavePlan = [bool]$WavePlan; AssetOwnership = [bool]$AssetOwnership
    Resume = [bool]$Resume; Quiet = [bool]$Quiet; PageSize = $PageSize; MaxRetries = $MaxRetries; ResolveIPv4 = [bool]$ResolveIPv4
}
# The last log line comes before the manifest, which hashes the log with everything else.
$failedSteps = @($steps | Where-Object Status -eq 'Failed')
Write-FMPLog -Level STEP -Message ("Run {0}: {1} steps, {2} failed, {3:hh\:mm\:ss}" -f $runId, $steps.Count, $failedSteps.Count, ((Get-Date) - $start))
$manifest = Write-FMPManifest -RunPath $runPath -RunId $runId -StartTime $start -Tier $Tier -Forest $adForest.Name `
    -Domains $Domain -ServedBy $servedBy -Steps $steps -Parameters $parameters

$failed = @($steps | Where-Object Status -eq 'Failed')
Write-Host ("Done: {0} files, {1} steps, {2} failed. Summary: {3}" -f $manifest.FileCount, $steps.Count, $failed.Count, (Join-Path (Join-Path $runPath 'Summary') 'StartKitSummary.md'))
foreach ($f in $failed) { Write-Warning "$($f.Step): $($f.Error)" }
