<#
.SYNOPSIS
    Shared helpers for the Start Kit modules: the output guard, the writers and the
    provenance manifest. Dot-sourced by each of the five FMP modules and by
    Invoke-FMPStartKit.ps1, so each gets its own copy in its own scope.

.DESCRIPTION
    Every file the kit writes goes through Write-FMPJson, Write-FMPCsv, Write-FMPText or
    Write-FMPBytes. Each one refuses a path that isn't under an output root registered with
    Resolve-FMPOutputRoot, which every public collector calls on its -OutputPath first. These
    are the only functions in the kit allowed to touch the file system; the safety tests
    (tests/powershell/Safety.Tests.ps1) fail if any other function does.

    Windows PowerShell 5.1 and PowerShell 7: no PowerShell 7-only syntax here.

.EXAMPLE
    . (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

    How each module loads the helpers from its own folder. Invoke-FMPStartKit.ps1 dot-sources
    the same file for the run folder and the manifest.
#>

$script:FMPKitVersion = '1.6.0'
$script:FMPAllowedRoots = [System.Collections.Generic.List[string]]::new()
$script:FMPUtf8 = [System.Text.UTF8Encoding]::new($false)

function ConvertTo-FMPFullPath {
    # Resolves a relative path against PowerShell's current location, not the process
    # directory that [IO.Path]::GetFullPath alone would use.
    param([Parameter(Mandatory)][string]$Path)
    [System.IO.Path]::GetFullPath($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path))
}

function Resolve-FMPOutputRoot {
    # Creates the output root if needed, registers it as writable, and returns its full path.
    param([Parameter(Mandatory)][string]$OutputPath)
    $full = (ConvertTo-FMPFullPath -Path $OutputPath).TrimEnd('\', '/')
    [void][System.IO.Directory]::CreateDirectory($full)
    if (-not $script:FMPAllowedRoots.Contains($full)) { $script:FMPAllowedRoots.Add($full) }
    $full
}

function Assert-FMPWritePath {
    # Throws unless $Path is inside a registered output root.
    param([Parameter(Mandatory)][string]$Path)
    $full = ConvertTo-FMPFullPath -Path $Path
    foreach ($root in $script:FMPAllowedRoots) {
        if ($full.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or
            $full.Equals($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $full
        }
    }
    throw "Refusing to write outside -OutputPath: $full"
}

function Initialize-FMPPath {
    param([Parameter(Mandatory)][string]$Path)
    $full = Assert-FMPWritePath -Path $Path
    [void][System.IO.Directory]::CreateDirectory($full)
    $full
}

function Get-FMPDomainPath {
    # Returns <OutputPath>\<domain>\<Area>, creating it if needed.
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][string]$Area
    )
    Initialize-FMPPath -Path (Join-Path (Join-Path $OutputPath $Domain) $Area)
}

function Write-FMPJson {
    param(
        [Parameter(Mandatory)][AllowNull()][AllowEmptyCollection()]$InputObject,
        [Parameter(Mandatory)][string]$Path,
        [int]$Depth = 8
    )
    $full = Assert-FMPWritePath -Path $Path
    $json = ConvertTo-Json -InputObject $InputObject -Depth $Depth
    if ($null -eq $json) { $json = 'null' }
    [System.IO.File]::WriteAllText($full, $json, $script:FMPUtf8)
}

function Write-FMPCsv {
    param(
        [Parameter(Mandatory)][AllowNull()][AllowEmptyCollection()]$InputObject,
        [Parameter(Mandatory)][string]$Path
    )
    $full = Assert-FMPWritePath -Path $Path
    $rows = @($InputObject | Where-Object { $null -ne $_ })
    [string[]]$lines = @()
    if ($rows.Count -gt 0) { $lines = @($rows | ConvertTo-Csv -NoTypeInformation) }
    [System.IO.File]::WriteAllLines($full, $lines, $script:FMPUtf8)
}

function Write-FMPText {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][AllowEmptyCollection()]$Value,
        [Parameter(Mandatory)][string]$Path
    )
    $full = Assert-FMPWritePath -Path $Path
    [System.IO.File]::WriteAllText($full, (@($Value) -join "`n"), $script:FMPUtf8)
}

function Write-FMPBytes {
    param(
        [Parameter(Mandatory)][byte[]]$Bytes,
        [Parameter(Mandatory)][string]$Path
    )
    $full = Assert-FMPWritePath -Path $Path
    [System.IO.File]::WriteAllBytes($full, $Bytes)
}

function Test-FMPCommand {
    # True when a command is available: how collectors detect a missing RSAT module.
    param([Parameter(Mandatory)][string]$Name)
    [bool](Get-Command -Name $Name -ErrorAction SilentlyContinue)
}

function Assert-FMPCommand {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Module
    )
    if (-not (Test-FMPCommand -Name $Name)) {
        throw "$Name isn't available. Install the $Module module (RSAT) on the assessment host."
    }
}

function ConvertTo-FMPRunId {
    # Book 01 Chapter 10's run identifier: YYYY-MM-DD-HHmm-<host>-<tier>, in UTC.
    param(
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$HostName,
        [Parameter(Mandatory)][ValidateSet('A', 'B')][string]$Tier
    )
    $safeHost = ($HostName -replace '[^A-Za-z0-9\-]', '').ToLowerInvariant()
    '{0}-{1}-tier{2}' -f $AsOf.ToUniversalTime().ToString('yyyy-MM-dd-HHmm'), $safeHost, $Tier
}

function Get-FMPFileManifest {
    # Relative path, size and SHA-256 of every file under $Root, sorted, excluding $Exclude.
    param(
        [Parameter(Mandatory)][string]$Root,
        [string[]]$Exclude = @()
    )
    $base = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
    @(Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
            $rel = $_.FullName.Substring($base.Length).TrimStart('\', '/') -replace '\\', '/'
            if ($Exclude -notcontains $rel) {
                [pscustomobject]@{
                    RelativePath = $rel
                    SizeBytes    = $_.Length
                    SHA256       = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
                }
            }
        } | Sort-Object RelativePath)
}

function Get-FMPModuleVersions {
    # Versions of the modules the kit relies on, as installed on this host (null when absent).
    $names = 'ActiveDirectory', 'GroupPolicy', 'DnsServer', 'DhcpServer', 'dbatools', 'FMPADAssessment', 'FMPSqlEstate', 'FMPNpsInventory', 'FMPTransactionProfile', 'FMPServerService'
    $o = [ordered]@{}
    foreach ($n in $names) {
        $m = Get-Module -Name $n | Select-Object -First 1
        if (-not $m) { $m = Get-Module -ListAvailable -Name $n | Sort-Object Version -Descending | Select-Object -First 1 }
        $o[$n] = if ($m) { "$($m.Version)" } else { $null }
    }
    [pscustomobject]$o
}

function Get-FMPExecutor {
    # Who ran it: the Windows identity where there is one.
    try { [System.Security.Principal.WindowsIdentity]::GetCurrent().Name }
    catch { "$env:USERDOMAIN\$env:USERNAME" }
}

function Write-FMPManifest {
    <#
    .SYNOPSIS
        Writes AssessmentManifest.json at the run root: who, when, where, with what, and a
        SHA-256 hash of every other file in the run. Book 01 Chapter 10's provenance fields.
    #>
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][string]$RunId,
        [Parameter(Mandatory)][datetime]$StartTime,
        [Parameter(Mandatory)][string]$Tier,
        [string]$Forest,
        [string[]]$Domains = @(),
        [hashtable]$ServedBy = @{},
        [object[]]$Steps = @(),
        [hashtable]$Parameters = @{}
    )
    $end = (Get-Date).ToUniversalTime()
    $files = @(Get-FMPFileManifest -Root $RunPath -Exclude 'AssessmentManifest.json')
    $manifest = [ordered]@{
        Schema         = 'fmp-start-kit/assessment-manifest/1'
        RunId          = $RunId
        KitVersion     = $script:FMPKitVersion
        ReadOnly       = $true
        Tier           = $Tier
        ExecutedBy     = Get-FMPExecutor
        ComputerName   = [Environment]::MachineName
        StartTimeUtc   = $StartTime.ToUniversalTime().ToString('o')
        EndTimeUtc     = $end.ToString('o')
        Forest         = $Forest
        Domains        = @($Domains)
        ServedBy       = $ServedBy
        PowerShell     = [ordered]@{ Version = "$($PSVersionTable.PSVersion)"; Edition = "$($PSVersionTable.PSEdition)" }
        OSVersion      = [Environment]::OSVersion.VersionString
        ModuleVersions = Get-FMPModuleVersions
        Parameters     = $Parameters
        Steps          = @($Steps)
        FileCount      = $files.Count
        Files          = $files
    }
    Write-FMPJson -InputObject $manifest -Path (Join-Path $RunPath 'AssessmentManifest.json') -Depth 6
    [pscustomobject]$manifest
}

function Read-FMPRunState {
    # The steps an earlier attempt at this run finished (RunState.json at the run root).
    $ctx = Get-FMPRunContext
    $state = @{}
    if ($ctx.StatePath -and [System.IO.File]::Exists($ctx.StatePath)) {
        foreach ($s in @((Get-Content -LiteralPath $ctx.StatePath -Raw | ConvertFrom-Json).Steps)) { if ($s) { $state["$($s.Step)"] = $s } }
    }
    $state
}

function Write-FMPRunState {
    param([Parameter(Mandatory)]$Record)
    $ctx = Get-FMPRunContext
    if (-not $ctx.StatePath) { return }
    $state = Read-FMPRunState
    $state["$($Record.Step)"] = $Record
    Write-FMPJson -InputObject ([ordered]@{ UpdatedUtc = (Get-Date).ToUniversalTime().ToString('o'); Steps = @($state.Values | Sort-Object Step) }) -Path $ctx.StatePath -Depth 4
}

function Invoke-FMPStep {
    # Runs one collector; a failure is recorded, not fatal, so a partial run shows as partial.
    # Each step ends with a summary line in the console and the run log (status, objects,
    # duration), and is recorded in RunState.json; with -Resume, a step that completed in an
    # earlier attempt at the same run is skipped. The step scriptblock sees this function's
    # variables, so they carry an FMPStep prefix that no caller uses.
    param(
        [Parameter(Mandatory)][string]$FMPStepName,
        [Parameter(Mandatory)][scriptblock]$FMPStepBlock
    )
    $FMPStepCtx = Get-FMPRunContext
    if ($FMPStepCtx.Resume) {
        $FMPStepDone = (Read-FMPRunState)[$FMPStepName]
        if ($FMPStepDone -and $FMPStepDone.Status -eq 'Completed') {
            Write-FMPLog -Level STEP -Message "$FMPStepName`: completed in an earlier attempt, skipped (-Resume)"
            return [pscustomobject]@{ Step = $FMPStepName; Status = 'Completed'; Error = $null; Seconds = $FMPStepDone.Seconds; ObjectCount = $FMPStepDone.ObjectCount; Resumed = $true }
        }
    }
    Write-FMPLog -Level STEP -Message "$FMPStepName`: started"
    $FMPStepStarted = Get-Date
    try {
        $FMPStepOut = @(& $FMPStepBlock)
        $FMPStepCount = $null
        foreach ($FMPStepItem in $FMPStepOut) { if ($null -ne $FMPStepItem -and $FMPStepItem.PSObject.Properties['ObjectCount']) { $FMPStepCount = $FMPStepItem.ObjectCount } }
        $FMPStepRecord = [pscustomobject]@{ Step = $FMPStepName; Status = 'Completed'; Error = $null; Seconds = [math]::Round(((Get-Date) - $FMPStepStarted).TotalSeconds, 1); ObjectCount = $FMPStepCount; Resumed = $false }
    } catch {
        Write-FMPLog -Level WARN -Message "$FMPStepName failed: $($_.Exception.Message)"
        $FMPStepRecord = [pscustomobject]@{ Step = $FMPStepName; Status = 'Failed'; Error = $_.Exception.Message; Seconds = [math]::Round(((Get-Date) - $FMPStepStarted).TotalSeconds, 1); ObjectCount = $null; Resumed = $false }
    }
    $FMPStepObjects = if ($null -ne $FMPStepRecord.ObjectCount) { ', {0:N0} objects' -f [long]$FMPStepRecord.ObjectCount } else { '' }
    Write-FMPLog -Level STEP -Message ('{0}: {1}{2} in {3:hh\:mm\:ss}' -f $FMPStepName, $FMPStepRecord.Status, $FMPStepObjects, [TimeSpan]::FromSeconds($FMPStepRecord.Seconds))
    Write-FMPRunState -Record $FMPStepRecord
    $FMPStepRecord
}

# ----------------------------------------------------------------------------- run context
# Large directories: a run log, progress and heartbeats, paged and partitioned reads, retry
# with backoff, streamed output, and checkpoints that let -Resume carry on where a run stopped.
# Each module dot-sources this file into its own scope, so the settings that every copy needs
# (the log file, -Quiet, page size, retries) live in one global hashtable, set once by
# Invoke-FMPStartKit.ps1. Without it (a collector called on its own, or the tests), the
# defaults below apply and nothing is logged to a file.

function Get-FMPRunContext {
    # The run's shared settings, or the defaults when no run has set them.
    $c = Get-Variable -Name FMPRunContext -Scope Global -ValueOnly -ErrorAction SilentlyContinue
    if ($c -is [hashtable]) { return $c }
    @{ LogPath = $null; StatePath = $null; Quiet = $false; PageSize = 256; MaxRetries = 4; RetryBaseSeconds = 5
        HeartbeatSeconds = 30; HeartbeatObjects = 10000; Resume = $false; Estimates = @{} }
}

function Initialize-FMPRunContext {
    <#
    .SYNOPSIS
        Sets the run's shared settings: the run log, -Quiet, page size and retry policy.
    .EXAMPLE
        Initialize-FMPRunContext -RunPath D:\Assessment\2026-11-25-0200-host-tierA -Quiet
    #>
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [switch]$Quiet,
        [ValidateRange(1, 5000)][int]$PageSize = 256,
        [ValidateRange(0, 20)][int]$MaxRetries = 4,
        [ValidateRange(0, 600)][double]$RetryBaseSeconds = 5,
        [ValidateRange(1, 3600)][int]$HeartbeatSeconds = 30,
        [ValidateRange(1, 10000000)][int]$HeartbeatObjects = 10000,
        [switch]$Resume,
        [hashtable]$Estimates = @{}
    )
    $root = Resolve-FMPOutputRoot -OutputPath $RunPath
    $global:FMPRunContext = @{
        LogPath = Join-Path $root 'RunLog.txt'; StatePath = Join-Path $root 'RunState.json'; Quiet = [bool]$Quiet; PageSize = $PageSize; MaxRetries = $MaxRetries
        RetryBaseSeconds = $RetryBaseSeconds; HeartbeatSeconds = $HeartbeatSeconds; HeartbeatObjects = $HeartbeatObjects
        Resume = [bool]$Resume; Estimates = $Estimates
    }
    $global:FMPRunContext
}

function Write-FMPLog {
    <#
    .SYNOPSIS
        One line in the run log (RunLog.txt at the run root), and on the console unless -Quiet.
        Warnings and errors always reach the console.
    #>
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'HEARTBEAT', 'STEP')][string]$Level = 'INFO'
    )
    $ctx = Get-FMPRunContext
    $line = '{0} {1,-9} {2}' -f (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'), $Level, $Message
    if ($ctx.LogPath) {
        try {
            $full = Assert-FMPWritePath -Path $ctx.LogPath
            [System.IO.File]::AppendAllText($full, $line + "`n", $script:FMPUtf8)
        } catch { Write-Verbose "Run log not written: $($_.Exception.Message)" }
    }
    if ($Level -in 'WARN', 'ERROR') { Write-Warning $Message }
    elseif (-not $ctx.Quiet) { Write-Host $line }
}

function Initialize-FMPProgress {
    <#
    .SYNOPSIS
        A progress tracker for one long step: Write-Progress with a count, a percentage and an
        ETA, and a heartbeat line every HeartbeatSeconds or HeartbeatObjects.
    .DESCRIPTION
        The percentage and ETA come from -Total when it is known (an estimate from the last run
        under the same output folder), and otherwise from the share of partitions finished.
    #>
    param(
        [Parameter(Mandatory)][string]$Activity,
        [long]$Total = 0,
        [int]$PartitionCount = 0,
        [int]$Id = 1
    )
    $ctx = Get-FMPRunContext
    @{
        Activity = $Activity; Total = $Total; PartitionCount = $PartitionCount; PartitionsDone = 0; Partition = ''
        Count = [long]0; Id = $Id; Watch = [System.Diagnostics.Stopwatch]::StartNew()
        LastDraw = [double]-1; LastBeatSeconds = [double]0; LastBeatCount = [long]0
        Quiet = [bool]$ctx.Quiet; HeartbeatSeconds = $ctx.HeartbeatSeconds; HeartbeatObjects = $ctx.HeartbeatObjects
    }
}

function Get-FMPProgressText {
    # "12,345 objects, 410/s, partition 3 of 9, 34%, about 00:02:10 left"
    param([Parameter(Mandatory)][hashtable]$Tracker)
    $secs = $Tracker.Watch.Elapsed.TotalSeconds
    $rate = if ($secs -gt 0) { $Tracker.Count / $secs } else { 0 }
    $pct = -1
    if ($Tracker.Total -gt 0) { $pct = [math]::Min(99, [int](100 * $Tracker.Count / $Tracker.Total)) }
    elseif ($Tracker.PartitionCount -gt 0) { $pct = [math]::Min(99, [int](100 * $Tracker.PartitionsDone / $Tracker.PartitionCount)) }
    $eta = $null
    if ($pct -gt 0) { $eta = [TimeSpan]::FromSeconds([math]::Round($secs * (100 - $pct) / $pct)) }
    $parts = @(('{0:N0} objects' -f $Tracker.Count), ('{0:N0}/s' -f $rate))
    if ($Tracker.PartitionCount -gt 0) { $parts += ('partition {0} of {1}' -f [math]::Min($Tracker.PartitionsDone + 1, $Tracker.PartitionCount), $Tracker.PartitionCount) }
    if ($pct -ge 0) { $parts += "$pct%" }
    if ($eta) { $parts += ('about {0:hh\:mm\:ss} left' -f $eta) }
    [pscustomobject]@{ Text = ($parts -join ', '); Percent = $pct; SecondsLeft = if ($eta) { [int]$eta.TotalSeconds } else { -1 } }
}

function Step-FMPProgress {
    # Counts objects; redraws Write-Progress at most once a second and writes a heartbeat line.
    param([Parameter(Mandatory)][hashtable]$Tracker, [long]$By = 1)
    $Tracker.Count += $By
    $secs = $Tracker.Watch.Elapsed.TotalSeconds
    if (-not $Tracker.Quiet -and ($secs - $Tracker.LastDraw) -ge 1) {
        $Tracker.LastDraw = $secs
        $p = Get-FMPProgressText -Tracker $Tracker
        $status = if ($Tracker.Partition) { "$($p.Text) ($($Tracker.Partition))" } else { $p.Text }
        Write-Progress -Id $Tracker.Id -Activity $Tracker.Activity -Status $status -PercentComplete ([math]::Max(0, $p.Percent)) -SecondsRemaining $p.SecondsLeft
    }
    if (($secs - $Tracker.LastBeatSeconds) -ge $Tracker.HeartbeatSeconds -or ($Tracker.Count - $Tracker.LastBeatCount) -ge $Tracker.HeartbeatObjects) {
        $Tracker.LastBeatSeconds = $secs; $Tracker.LastBeatCount = $Tracker.Count
        Write-FMPLog -Level HEARTBEAT -Message "$($Tracker.Activity): $((Get-FMPProgressText -Tracker $Tracker).Text)"
    }
}

function Complete-FMPProgress {
    # Clears the progress bar and writes the step's summary line: count and duration.
    param([Parameter(Mandatory)][hashtable]$Tracker, [string]$Note)
    if (-not $Tracker.Quiet) { Write-Progress -Id $Tracker.Id -Activity $Tracker.Activity -Completed }
    $msg = '{0}: {1:N0} objects in {2:hh\:mm\:ss}' -f $Tracker.Activity, $Tracker.Count, $Tracker.Watch.Elapsed
    if ($Note) { $msg += " ($Note)" }
    Write-FMPLog -Level STEP -Message $msg
    $Tracker.Count
}

# ----------------------------------------------------------------------------- retry

function Test-FMPTransientError {
    <#
    .SYNOPSIS
        True for an error worth retrying: an ADWS or LDAP timeout, a busy or unavailable
        server, an expired enumeration context, a dropped connection.
    .DESCRIPTION
        Decided first by exception type and LDAP result code, which don't depend on the
        operating system's language, then by English message text as a fallback.
        LDAP result codes: 51 busy, 52 unavailable, 81 server down, 85 timeout.
    #>
    param([Parameter(Mandatory)]$ErrorRecord)
    $e = if ($ErrorRecord -is [System.Management.Automation.ErrorRecord]) { $ErrorRecord.Exception } else { $ErrorRecord }
    while ($e) {
        $type = $e.GetType().FullName
        if ($type -match 'ADServerDownException|TimeoutException|CommunicationException|EndpointNotFoundException|ServerTooBusyException|FaultException|SocketException|InvalidEnumerationContext') { return $true }
        $codeProp = $e.PSObject.Properties['ErrorCode']
        if ($codeProp -and $type -match 'ADException|LdapException|DirectoryServicesCOMException|DirectoryOperationException') {
            if ([int]$codeProp.Value -in 51, 52, 81, 85) { return $true }
        }
        $resultProp = $e.PSObject.Properties['ExtendedError']
        if ($resultProp -and [int]$resultProp.Value -in 51, 52, 81, 85) { return $true }
        if ($e.Message -match '(?i)time ?out|timed out|server is busy|busy|unavailable|unable to contact the server|invalid enumeration context|enumeration context|operation was aborted|connection was closed|server is not operational|server has returned the following error|try again|RPC server is unavailable') { return $true }
        $e = $e.InnerException
    }
    $false
}

function Invoke-FMPWithRetry {
    <#
    .SYNOPSIS
        Runs a read, and on a transient error waits and runs it again: base, 2x, 4x... seconds
        plus jitter, up to MaxRetries more attempts. Anything else is thrown at once.
    .EXAMPLE
        Invoke-FMPWithRetry -Activity 'Users (contoso.example) OU=Staff' -ScriptBlock { Get-ADUser -Filter * -ResultPageSize 256 }
    #>
    param(
        [Parameter(Mandatory)][string]$Activity,
        [Parameter(Mandatory)][scriptblock]$ScriptBlock,
        [int]$MaxRetries = -1,
        [double]$BaseSeconds = -1
    )
    $ctx = Get-FMPRunContext
    if ($MaxRetries -lt 0) { $MaxRetries = $ctx.MaxRetries }
    if ($BaseSeconds -lt 0) { $BaseSeconds = $ctx.RetryBaseSeconds }
    $attempt = 0
    while ($true) {
        $attempt++
        try { return & $ScriptBlock }
        catch {
            if ($attempt -gt $MaxRetries -or -not (Test-FMPTransientError -ErrorRecord $_)) { throw }
            $delay = [math]::Min(300, $BaseSeconds * [math]::Pow(2, $attempt - 1)) + (Get-Random -Minimum 0.0 -Maximum ([math]::Max(0.001, $BaseSeconds / 2)))
            Write-FMPLog -Level WARN -Message ("{0}: attempt {1} of {2} failed ({3}); retrying in {4:N0}s" -f $Activity, $attempt, ($MaxRetries + 1), $_.Exception.Message, $delay)
            [System.Threading.Thread]::Sleep([int]($delay * 1000))
        }
    }
}

# ----------------------------------------------------------------------------- partitions

# Object classes that hold no users, computers or groups below them: a child of the domain
# head of one of these classes is read by the head's one-level search, not as a partition.
$script:FMPLeafClasses = 'user', 'computer', 'group', 'contact', 'inetOrgPerson', 'foreignSecurityPrincipal',
    'msDS-ManagedServiceAccount', 'msDS-GroupManagedServiceAccount', 'msDS-DelegatedManagedServiceAccount',
    'printQueue', 'volume', 'domainPolicy', 'rIDManager', 'infrastructureUpdate', 'samServer', 'secret', 'trustedDomain', 'dnsNode'

function Get-FMPAdPartition {
    <#
    .SYNOPSIS
        Splits one domain into partitions for paged reads: the domain head, one level, and each
        OU or container directly under it, as a subtree.
    .DESCRIPTION
        Every object in the domain falls in exactly one partition. A smaller search finishes
        before ADWS's enumeration context expires, a failure retries one partition rather than
        the domain, and each partition is a checkpoint that -Resume can skip.
    .EXAMPLE
        Get-FMPAdPartition -Domain contoso.example | Format-Table Id, SearchBase, SearchScope
    #>
    param([Parameter(Mandatory)][string]$Domain)
    $dn = Invoke-FMPWithRetry -Activity "Partitions ($Domain)" -ScriptBlock { (Get-ADDomain -Server $Domain -ErrorAction Stop).DistinguishedName }
    $children = @(Invoke-FMPWithRetry -Activity "Partitions ($Domain)" -ScriptBlock {
            @(Get-ADObject -SearchBase $dn -SearchScope OneLevel -LDAPFilter '(objectClass=*)' -Server $Domain -ResultPageSize (Get-FMPRunContext).PageSize -ErrorAction Stop)
        })
    [pscustomobject]@{ Id = 'head'; Label = $dn; SearchBase = $dn; SearchScope = 'OneLevel' }
    foreach ($c in ($children | Sort-Object DistinguishedName)) {
        $class = "$(@($c.ObjectClass)[-1])"
        if ($script:FMPLeafClasses -contains $class) { continue }
        [pscustomobject]@{ Id = "$($c.ObjectGUID)"; Label = "$($c.DistinguishedName)"; SearchBase = "$($c.DistinguishedName)"; SearchScope = 'Subtree' }
    }
}

# ----------------------------------------------------------------------------- streams

function Open-FMPStream {
    # A UTF-8 text writer for a file under the output root, overwriting it. Close it with Close-FMPStream.
    param([Parameter(Mandatory)][string]$Path)
    $full = Assert-FMPWritePath -Path $Path
    [void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($full))
    $w = [System.IO.StreamWriter]::new($full, $false, $script:FMPUtf8, 1048576)
    $w.NewLine = "`n"
    $w
}

function Close-FMPStream {
    param($Writer)
    if ($Writer) { $Writer.Flush(); $Writer.Dispose() }
}

function ConvertTo-FMPJsonLine {
    # One object as one line of compact JSON, as a JSON array element.
    param([Parameter(Mandatory)]$InputObject, [int]$Depth = 4)
    ConvertTo-Json -InputObject $InputObject -Depth $Depth -Compress
}

function Get-FMPFastJson {
    <#
    .SYNOPSIS
        On Windows PowerShell 5.1, the JavaScriptSerializer that ConvertTo-Json itself uses,
        called directly: the same JSON (dates as \/Date(ms)\/) without the cmdlet's cost per
        object. Rows must be dictionaries ([ordered]@{}). On PowerShell 7, $null: callers use
        ConvertTo-Json -Compress, which is fast there.
    #>
    if ($PSVersionTable.PSEdition -ne 'Desktop') { return $null }
    try {
        $null = [System.Reflection.Assembly]::Load('System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35')
        $js = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
        $js.MaxJsonLength = [int]::MaxValue
        $js
    } catch { $null }
}

function Join-FMPJsonParts {
    <#
    .SYNOPSIS
        Joins part files of JSON lines (one object per line) into one JSON array, streaming,
        without parsing them. The result reads like any Write-FMPJson array.
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$PartPath)
    $w = Open-FMPStream -Path $Path
    try {
        $w.Write('[')
        $first = $true
        foreach ($p in $PartPath) {
            if (-not [System.IO.File]::Exists($p)) { continue }
            $r = [System.IO.StreamReader]::new($p, $script:FMPUtf8)
            try {
                while ($null -ne ($line = $r.ReadLine())) {
                    if ($line.Length -eq 0) { continue }
                    if (-not $first) { $w.Write(",`n") } else { $w.Write("`n") }
                    $w.Write($line); $first = $false
                }
            } finally { $r.Dispose() }
        }
        $w.Write("`n]")
    } finally { Close-FMPStream $w }
}

# ----------------------------------------------------------------------------- checkpoints

function Read-FMPCheckpoint {
    # The partitions a collector finished in an earlier attempt, when -Resume is on.
    param([Parameter(Mandatory)][string]$Path)
    $done = @{}
    if ((Get-FMPRunContext).Resume -and [System.IO.File]::Exists($Path)) {
        $c = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
        foreach ($id in @($c.Completed)) { $done["$id"] = $true }
    }
    $done
}

function Write-FMPCheckpoint {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][hashtable]$Done, [string]$Collector)
    Write-FMPJson -InputObject ([ordered]@{ Collector = $Collector; UpdatedUtc = (Get-Date).ToUniversalTime().ToString('o'); Completed = @($Done.Keys | Sort-Object) }) -Path $Path
}

function Invoke-FMPPartitionedRead {
    <#
    .SYNOPSIS
        Reads one object class from a domain, one partition at a time: paged, retried, streamed
        to disk, and checkpointed.
    .DESCRIPTION
        For each partition, -Read runs the paged Get-AD* query (it receives the partition and
        the page size) and -Project turns each object into its inventory row, an [ordered]
        dictionary. Each row is written straight to a part file as one JSON line. -Project also
        receives the partition's accumulator, a hashtable written beside the part file, where it
        collects the small derived rows (stale, delegation, counts); -Derive can do the same
        from the row, at the cost of one more call per object.
        A failure retries the whole partition, overwriting its part file, so no object is
        counted twice. Finished partitions are recorded in <Name>.checkpoint.json; with -Resume
        they are skipped. Returns the part files and every partition's derived data.
    #>
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][string]$WorkPath,
        [Parameter(Mandatory)][scriptblock]$Read,
        [Parameter(Mandatory)][scriptblock]$Project,
        [scriptblock]$Derive,
        [object[]]$Partition
    )
    $ctx = Get-FMPRunContext
    $partsDir = Initialize-FMPPath -Path (Join-Path $WorkPath "_parts\$Name")
    $checkpoint = Join-Path $partsDir "$Name.checkpoint.json"
    if (-not $Partition) { $Partition = @(Get-FMPAdPartition -Domain $Domain) }
    $done = Read-FMPCheckpoint -Path $checkpoint
    $estimate = 0
    if ($ctx.Estimates -and $ctx.Estimates.ContainsKey("$Domain|$Name")) { $estimate = [long]$ctx.Estimates["$Domain|$Name"] }
    $tracker = Initialize-FMPProgress -Activity "$Name ($Domain)" -Total $estimate -PartitionCount $Partition.Count
    $resumed = 0
    $js = Get-FMPFastJson
    $result = [System.Collections.Generic.List[object]]::new()
    foreach ($p in $Partition) {
        $partFile = Join-Path $partsDir "$($p.Id).jsonl"
        $derivedFile = Join-Path $partsDir "$($p.Id).derived.json"
        if ($done.ContainsKey("$($p.Id)") -and [System.IO.File]::Exists($partFile)) {
            $resumed++
            $d = Get-Content -LiteralPath $derivedFile -Raw | ConvertFrom-Json
            if ($d -and $d.PSObject.Properties['Count']) { $tracker.Count += [long]$d.Count }
            $tracker.PartitionsDone++
            $result.Add([pscustomobject]@{ Partition = $p; PartFile = $partFile; Derived = $d })
            continue
        }
        $tracker.Partition = $p.Label
        $before = $tracker.Count
        $derived = Invoke-FMPWithRetry -Activity "$Name ($Domain) $($p.Label)" -ScriptBlock {
            $tracker.Count = $before
            $acc = @{ Count = [long]0 }
            $seen = @{ n = 0 }
            $w = Open-FMPStream -Path $partFile
            try {
                # The per-object path calls no kit function and uses a process block rather than
                # ForEach-Object: in Windows PowerShell 5.1 each costs a fraction of a
                # millisecond per object, which on 500,000 users is minutes.
                & $Read $p $ctx.PageSize | & { process {
                        $row = & $Project $_ $acc
                        if ($null -ne $row) {
                            if ($js -and $row -is [System.Collections.IDictionary]) { $w.WriteLine($js.Serialize($row)) } else { $w.WriteLine((ConvertTo-Json -InputObject $row -Depth 4 -Compress)) }
                            $acc.Count++
                            if ($Derive) { $null = & $Derive $row $acc }
                        }
                        if ((++$seen.n % 256) -eq 0) { Step-FMPProgress -Tracker $tracker -By 256 }
                    } }
            } finally { Close-FMPStream $w }
            if ($seen.n % 256) { Step-FMPProgress -Tracker $tracker -By ($seen.n % 256) }
            $acc
        }
        Write-FMPJson -InputObject $derived -Path $derivedFile -Depth 6
        $done["$($p.Id)"] = $true
        Write-FMPCheckpoint -Path $checkpoint -Done $done -Collector "$Name ($Domain)"
        $tracker.PartitionsDone++
        $result.Add([pscustomobject]@{ Partition = $p; PartFile = $partFile; Derived = (Get-Content -LiteralPath $derivedFile -Raw | ConvertFrom-Json) })
    }
    $note = if ($resumed) { "$resumed of $($Partition.Count) partitions from the checkpoint" } else { "$($Partition.Count) partitions" }
    $null = Complete-FMPProgress -Tracker $tracker -Note $note
    $result.ToArray()
}

function Get-FMPDerivedRows {
    # Every partition's rows of one derived list, in partition order.
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Parts, [Parameter(Mandatory)][string]$Key)
    foreach ($p in $Parts) {
        if ($p.Derived -and $p.Derived.PSObject.Properties[$Key]) { foreach ($r in @($p.Derived.$Key)) { if ($null -ne $r) { $r } } }
    }
}

function Get-FMPDerivedSum {
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Parts, [Parameter(Mandatory)][string]$Key)
    $s = [long]0
    foreach ($p in $Parts) { if ($p.Derived -and $p.Derived.PSObject.Properties[$Key]) { $s += [long]$p.Derived.$Key } }
    $s
}

function Join-FMPDerived {
    # Adds one row to a derived list in a partition's accumulator.
    param([Parameter(Mandatory)][hashtable]$Acc, [Parameter(Mandatory)][string]$Key, [Parameter(Mandatory)]$Row)
    if (-not $Acc.ContainsKey($Key)) { $Acc[$Key] = [System.Collections.Generic.List[object]]::new() }
    $Acc[$Key].Add($Row)
}

function Measure-FMPDerived {
    # Adds -By to a named counter in a partition's accumulator; with -Bucket, to one key of a map.
    param([Parameter(Mandatory)][hashtable]$Acc, [Parameter(Mandatory)][string]$Key, [string]$Bucket, [long]$By = 1)
    if ($PSBoundParameters.ContainsKey('Bucket')) {
        if (-not $Acc.ContainsKey($Key)) { $Acc[$Key] = @{} }
        $b = if ($Bucket) { $Bucket } else { 'Unknown' }
        if (-not $Acc[$Key].ContainsKey($b)) { $Acc[$Key][$b] = [long]0 }
        $Acc[$Key][$b] += $By
    } else {
        if (-not $Acc.ContainsKey($Key)) { $Acc[$Key] = [long]0 }
        $Acc[$Key] += $By
    }
}

function Join-FMPJsonDocument {
    # Writes {header fields..., "<ArrayName>": <the JSON array in -ArrayPath>} without loading the array.
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)]$Header,
        [Parameter(Mandatory)][string]$ArrayName,
        [Parameter(Mandatory)][string]$ArrayPath,
        [int]$Depth = 5
    )
    $head = (ConvertTo-Json -InputObject $Header -Depth $Depth).TrimEnd()
    $head = $head.Substring(0, $head.Length - 1).TrimEnd()
    $w = Open-FMPStream -Path $Path
    try {
        $w.Write($head)
        $w.Write((",`n  `"{0}`": " -f $ArrayName))
        $r = [System.IO.StreamReader]::new($ArrayPath, $script:FMPUtf8)
        try {
            $buf = [char[]]::new(65536)
            while (($n = $r.Read($buf, 0, $buf.Length)) -gt 0) { $w.Write($buf, 0, $n) }
        } finally { $r.Dispose() }
        $w.Write("`n}")
    } finally { Close-FMPStream $w }
}

function Read-FMPJsonArray {
    <#
    .SYNOPSIS
        Reads a JSON array file one element at a time when it was written by Join-FMPJsonParts
        (one object per line), and whole otherwise. Lets the summary and the comparisons read
        inventories of any size without one giant string.
    #>
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    $r = [System.IO.StreamReader]::new((ConvertTo-FMPFullPath -Path $Path), $script:FMPUtf8)
    try {
        $first = $r.ReadLine()
        $second = if ($first -eq '[') { $r.ReadLine() } else { $null }
        # Join-FMPJsonParts writes '[' and then one compact object per line, at column 0.
        if ($first -ne '[' -or ($null -ne $second -and $second -ne ']' -and $second -notmatch '^\{.*\},?$')) {
            $rest = $r.ReadToEnd(); $r.Dispose(); $r = $null
            $text = (@($first, $second, $rest) | Where-Object { $null -ne $_ }) -join "`n"
            if ($text.Trim().Length -eq 0) { return }
            $all = ConvertFrom-Json -InputObject $text
            foreach ($o in @($all)) { $o }
            return
        }
        $line = $second
        while ($null -ne $line) {
            if ($line -eq ']' -or $line.Length -eq 0) { $line = $r.ReadLine(); continue }
            if ($line.EndsWith(',')) { $line = $line.Substring(0, $line.Length - 1) }
            ConvertFrom-Json -InputObject $line
            $line = $r.ReadLine()
        }
    } finally { if ($r) { $r.Dispose() } }
}
