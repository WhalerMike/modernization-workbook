#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10: one scheduled drift run. Runs Chapter 01's inventory and Chapter 02's ownership check
    unchanged, reads the credential and consent events in the directory audit log for the window and
    the service principal sign-in activity report, compares the register with the approved baseline
    by fingerprint, reads the review records and findings Chapters 03 to 09 hand over, and writes one
    run folder with run.json. Read only. examples/drift-pipeline/python/npi_evidence.py packages it.
.DESCRIPTION
    The cloud and the tenant ID are required: there is no default cloud, and a run that doesn't say
    which tenant it read can't be packaged. In a live run the tenant ID must match the Graph
    session's. A task that fails is recorded as Error in run.json and leaves no folder; the drift
    task needs the inventory. Without -BaselinePath the run compares with nothing and writes
    drift/baseline-candidate.json; a reviewer approves it by passing its SHA-256 to the next run as
    -ApprovedBaselineSha256. The audit window runs from -Since (default: -WindowHours before -AsOf)
    to -AsOf and can't start more than 30 days before -AsOf.
.EXAMPLE
    # Lab 1: the fictional estate, no sign-in.
    ./Invoke-NpiDriftRun.ps1 -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf 2026-10-29T06:00:00Z `
        -FixturePath tests/fixtures/ch10/estate-day1.json -AuditFixturePath tests/fixtures/ch10/audit.json `
        -SignInFixturePath tests/fixtures/ch10/signin-activity.json -InputPath tests/fixtures/inputs -OutputPath out/runs
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')][string]$TenantId,
    [Parameter(Mandatory)][string]$OutputPath,
    [Parameter(Mandatory)][string]$InputPath,
    [datetime]$AsOf = [datetime]::UtcNow,
    [datetime]$Since,
    [ValidateRange(1, 720)][int]$WindowHours = 24,
    [string]$BaselinePath,
    [string]$ApprovedBaselineSha256,
    [string]$ContractPath,
    [string]$PipelineIdentitiesPath,
    [string]$FixturePath,
    [string]$AuditFixturePath,
    [string]$SignInFixturePath,
    [string]$Domain,
    [switch]$SkipAd,
    [switch]$SkipAzure
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiDrift/NpiDrift.psm1') -Force

$asOfUtc = $AsOf.ToUniversalTime()
$sinceUtc = if ($PSBoundParameters.ContainsKey('Since')) { $Since.ToUniversalTime() } else { $asOfUtc.AddHours(-$WindowHours) }
if ($FixturePath -and -not $AuditFixturePath) { throw 'A fixture run needs -AuditFixturePath as well as -FixturePath.' }
if ($BaselinePath -and -not $ApprovedBaselineSha256) { throw 'A baseline needs -ApprovedBaselineSha256: the run compares only with a baseline someone approved.' }
$mode = if ($FixturePath) { 'Fixture' } else { 'Live' }
if ($mode -eq 'Live') {
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ([string]$mg.TenantId -ne $TenantId) { throw "The Graph session is signed in to tenant $($mg.TenantId), not $TenantId." }
}
$baseline = if ($BaselinePath) { Import-NpiDriftBaseline -Path $BaselinePath -ApprovedSha256 $ApprovedBaselineSha256 -TenantId $TenantId -Cloud $Cloud } else { $null }

$runId = Get-NpiRunId -AsOf $asOfUtc -Mode $mode
$runPath = Join-Path $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath) $runId
if (Test-Path -LiteralPath $runPath) { throw "$runPath already exists; a run is written once." }
New-Item -ItemType Directory -Force -Path $runPath | Out-Null

$tasks = [ordered]@{}
function Invoke-NpiTask([string]$Name, [string]$Folder, [scriptblock]$Body) {
    $dir = Join-Path $runPath $Folder
    try {
        & $Body $dir | Out-Null
        $tasks[$Name] = @{ Folder = $Folder; Status = 'OK' }
    } catch {
        if (Test-Path -LiteralPath $dir) { Remove-Item -LiteralPath $dir -Recurse -Force }
        $tasks[$Name] = @{ Folder = $Folder; Status = 'Error'; Message = $_.Exception.Message }
        Write-Warning "$Name failed: $($_.Exception.Message)"
    }
}

Invoke-NpiTask 'inventory' 'inventory' {
    param($dir)
    $a = @{ Cloud = $Cloud; TenantId = $TenantId; OutputPath = $dir; AsOf = $asOfUtc; SkipAd = $SkipAd; SkipAzure = $SkipAzure }
    if ($FixturePath) { $a.FixturePath = $FixturePath }
    if ($Domain) { $a.Domain = $Domain }
    & (Join-Path $PSScriptRoot 'Invoke-NpiInventory.ps1') @a
}
Invoke-NpiTask 'ownership' 'ownership' {
    param($dir)
    if ($tasks['inventory'].Status -ne 'OK') { throw 'The ownership check needs the inventory, which failed.' }
    $a = @{ Cloud = $Cloud; RegisterRun = (Join-Path $runPath 'inventory'); InputPath = $InputPath; OutputPath = $dir; AsOf = $asOfUtc }
    if ($FixturePath) { $a.FixturePath = $FixturePath }
    & (Join-Path $PSScriptRoot 'Invoke-NpiOwnership.ps1') @a
}
Invoke-NpiTask 'drift' 'drift' {
    param($dir)
    if ($tasks['inventory'].Status -ne 'OK') { throw 'The drift check needs the inventory, which failed.' }
    $policy = Get-NpiDriftPolicy
    $register = Import-NpiRegister -RunPath (Join-Path $runPath 'inventory')
    $rows = @($register.Rows)
    $ownership = if ($tasks['ownership'].Status -eq 'OK') { @(Get-Content -LiteralPath (Join-Path $runPath 'ownership/ownership.json') -Raw | ConvertFrom-Json) } else { @() }
    $invoke = if ($FixturePath) { (New-NpiDriftFixtureInvoker -AuditPath $AuditFixturePath -SignInPath $SignInFixturePath -Cloud $Cloud).Invoke } else { New-NpiLiveInvoker -Cloud $Cloud -TenantId $TenantId -SkipAzure }
    $reader = New-NpiDriftReader -Cloud $Cloud -Invoke $invoke
    $events = @(Get-NpiAuditEvent -Reader $reader -Since $sinceUtc -Until $asOfUtc -AsOf $asOfUtc -Policy $policy)
    $signIn = Get-NpiSignInActivity -Reader $reader
    $contract = Import-NpiContract -Path $ContractPath -TenantId $TenantId -Policy $policy
    $pipeline = if ($PipelineIdentitiesPath) { @(Import-Csv -LiteralPath $PipelineIdentitiesPath) } else { @() }
    $drift = @(Test-NpiRegisterDrift -Rows $rows -AsOf $asOfUtc -Ownership $ownership -Events $events -SignIn $signIn -Baseline $baseline `
            -CredentialLog $contract.CredentialLog -PipelineIdentities $pipeline -Cloud $Cloud -Policy $policy)
    $gaps = @(foreach ($r in $contract.Refused) { New-NpiDriftFinding 'NPI-DRF-09' 'Warn' "contract:$($r.File)" $r.File "Refused: $($r.Reason)" })
    $gaps += @(foreach ($ch in @($policy.chapterContract | Where-Object { $_ -notin $contract.Chapters })) { New-NpiDriftFinding 'NPI-DRF-09' 'Info' "contract:chapter-$ch" "Chapter $ch" "No findings file from Chapter $ch this run" })
    if ($ownership.Count -eq 0) { $gaps += New-NpiDriftFinding 'NPI-DRF-09' 'Warn' 'task:ownership' 'ownership' 'Chapter 02''s ownership check didn''t complete: ownerless identities weren''t checked' }
    $review = Test-NpiReviewCycle -Rows $rows -AsOf $asOfUtc -Reviews $contract.Reviews -Policy $policy
    $findings = @($drift) + @($gaps) + @($review.Findings)
    $candidate = New-NpiDriftBaseline -Rows $rows -TenantId $TenantId -Cloud $Cloud -RunId $runId -AsOf $asOfUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') -RegisterSha256 $register.Sha256
    $byRule = [ordered]@{}; foreach ($g in ($findings | Group-Object Rule | Sort-Object Name)) { $byRule[$g.Name] = [ordered]@{ Finding = @($g.Group | Where-Object Severity -EQ 'Finding').Count; Warn = @($g.Group | Where-Object Severity -EQ 'Warn').Count; Info = @($g.Group | Where-Object Severity -EQ 'Info').Count } }
    $summary = [ordered]@{
        window = [ordered]@{ since = $sinceUtc.ToString('yyyy-MM-ddTHH:mm:ssZ'); until = $asOfUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') }
        identities = $rows.Count; eventsRead = $events.Count
        credentialEvents = @($events | Where-Object Class -In 'CredentialChange', 'CredentialAdded').Count
        consentEvents = @($events | Where-Object Class -In 'Consent', 'DelegatedGrant', 'AppRoleGrant').Count
        signInActivity = $signIn.Status
        baseline = if ($baseline) { $baseline.runId } else { $null }
        chaptersReceived = @($contract.Chapters); reviewKindsReceived = @($contract.Reviews.Keys | Sort-Object); contractFilesRefused = @($contract.Refused).Count
        byRule = $byRule
    }
    # Sorted by app ID: a hashtable's key order changes from run to run, and the manifest hashes this file.
    $lastSignIn = [ordered]@{}
    foreach ($k in ($signIn.ByAppId.Keys | Sort-Object)) { $lastSignIn[$k] = $signIn.ByAppId[$k] }
    $inputs = [ordered]@{ policy = (Get-NpiFileHash -Path $policy['_path']) }
    if ($PipelineIdentitiesPath) { $inputs['pipeline-identities.csv'] = Get-NpiFileHash -Path $PipelineIdentitiesPath }
    foreach ($k in $contract.Files.Keys) { $inputs["contract/$k"] = $contract.Files[$k] }
    $null = Export-NpiDriftTask -OutputPath $dir -Task drift -Cloud $Cloud -TenantId $TenantId -Mode $mode -AsOf $asOfUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') -Evidence $reader.Evidence `
        -Extra ([ordered]@{ registerSha256 = $register.Sha256; baselineSha256 = $(if ($baseline) { $baseline['_sha256'] } else { $null }); inputs = $inputs }) -Files ([ordered]@{
            'events.json'             = $events
            'signin-activity.json'    = [ordered]@{ status = $signIn.Status; lastSignIn = $lastSignIn }
            'findings.json'           = $findings
            'chapter-findings.json'   = @($contract.Findings)
            'review-cycle.json'       = @($review.Record)
            'summary.json'            = $summary
            'baseline-candidate.json' = $candidate
        })
}

$index = Write-NpiRunIndex -RunPath $runPath -RunId $runId -AsOf $asOfUtc -Cloud $Cloud -TenantId $TenantId -Mode $mode -Since $sinceUtc -Until $asOfUtc -Tasks $tasks -Baseline $baseline
$status = ($index.tasks.GetEnumerator() | ForEach-Object { "$($_.Key) $($_.Value.status)" }) -join ', '
Write-Output "Run $runId ($mode, $Cloud): $status"
Write-Output "Audit window $($index.auditWindow.since) to $($index.auditWindow.until); baseline $(if ($baseline) { "$($baseline.runId) ($($baseline['_sha256'].Substring(0, 12))…)" } else { 'none: this run is a baseline candidate' })"
if ($tasks['drift'].Status -eq 'OK') {
    $fs = @(Get-Content -LiteralPath (Join-Path $runPath 'drift/findings.json') -Raw | ConvertFrom-Json)
    Write-Output ("Drift findings: {0} Finding, {1} Warn, {2} Info; baseline candidate SHA-256 {3}" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count, (Get-NpiFileHash -Path (Join-Path $runPath 'drift/baseline-candidate.json')))
}
Write-Output "Written to $runPath (run.json lists each task's manifest hash)"
