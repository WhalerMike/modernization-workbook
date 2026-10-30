#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 08: one scheduled evidence run. Runs Chapter 01's inventory and Chapter 02's emergency
    access check, reads the PIM audit evidence for the window, and writes one run folder with
    run.json. Read-only. examples/drift-pipeline/python/pa_evidence.py compares and packages it.
.DESCRIPTION
    The cloud and the tenant ID are required: there is no default cloud, and a run that doesn't say
    which tenant it read can't be compared with another. In a live run the tenant ID must match the
    Graph session's. A task that fails is recorded as Error in run.json and leaves no folder; the
    others still run. The audit window runs from -Since (default: -WindowHours before -AsOf) to
    -AsOf, and can't start more than 30 days before -AsOf.
.EXAMPLE
    # Lab 1: the fictional tenant, no sign-in.
    ./Invoke-PaEvidenceRun.ps1 -Cloud gcc -TenantId 11111111-1111-4111-8111-111111111111 -AsOf 2026-10-29T06:00:00Z `
        -FixturePath tests/fixtures/tenant.json -AuditFixturePath tests/fixtures/ch08/audit.json -OutputPath out/runs `
        -EmergencyConfigPath tests/fixtures/inputs/emergency-access.json -ValidationsPath tests/fixtures/inputs/emergency-validations.csv `
        -ExceptionsPath tests/fixtures/inputs/exceptions.csv
.EXAMPLE
    # Live, GCC with commercial Azure: sign in first (Graph with the evidence-run permissions, Azure with Reader).
    ./Invoke-PaEvidenceRun.ps1 -Cloud gcc -TenantId <tenant-id> -OutputPath runs -AzureScope /subscriptions/<id> `
        -EmergencyConfigPath emergency-access.json -ValidationsPath emergency-validations.csv -ExceptionsPath exceptions.csv
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')][string]$TenantId,
    [Parameter(Mandatory)][string]$OutputPath,
    [Parameter(Mandatory)][string]$EmergencyConfigPath,
    [datetime]$AsOf = [datetime]::UtcNow,
    [datetime]$Since,
    [ValidateRange(1, 720)][int]$WindowHours = 24,
    [string]$FixturePath,
    [string]$AuditFixturePath,
    [string[]]$AzureScope = @(),
    [string]$ExceptionsPath,
    [string]$ValidationsPath,
    [string[]]$ControlPlaneSubscriptionId = @(),
    [string]$TierMapPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PaEvidence/PaEvidence.psm1') -Force

$asOfUtc = $AsOf.ToUniversalTime()
$sinceUtc = if ($PSBoundParameters.ContainsKey('Since')) { $Since.ToUniversalTime() } else { $asOfUtc.AddHours(-$WindowHours) }
if ($FixturePath -and -not $AuditFixturePath) { throw 'A fixture run needs -AuditFixturePath as well as -FixturePath.' }
$mode = if ($FixturePath) { 'Fixture' } else { 'Live' }
if ($mode -eq 'Live') {
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ([string]$mg.TenantId -ne $TenantId) { throw "The Graph session is signed in to tenant $($mg.TenantId), not $TenantId." }
}

$runId = Get-PaRunId -AsOf $asOfUtc -Mode $mode
$runPath = Join-Path $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath) $runId
if (Test-Path -LiteralPath $runPath) { throw "$runPath already exists; a run is written once." }
New-Item -ItemType Directory -Force -Path $runPath | Out-Null

$tasks = [ordered]@{}
function Invoke-PaTask([string]$Name, [string]$Folder, [scriptblock]$Body) {
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

$common = @{ Cloud = $Cloud; TenantId = $TenantId }
if ($FixturePath) { $common.FixturePath = $FixturePath }

Invoke-PaTask 'inventory' 'inventory' {
    param($dir)
    $a = @{ OutputPath = $dir; AzureScope = $AzureScope } + $common
    if ($ExceptionsPath) { $a.ExceptionsPath = $ExceptionsPath }
    if ($ControlPlaneSubscriptionId) { $a.ControlPlaneSubscriptionId = $ControlPlaneSubscriptionId }
    if ($TierMapPath) { $a.TierMapPath = $TierMapPath }
    & (Join-Path $PSScriptRoot 'Invoke-PaInventory.ps1') @a
}
Invoke-PaTask 'emergency-access' 'emergency' {
    param($dir)
    $a = @{ OutputPath = $dir; ConfigPath = $EmergencyConfigPath; AsOf = $asOfUtc } + $common
    if ($ValidationsPath) { $a.ValidationsPath = $ValidationsPath }
    & (Join-Path $PSScriptRoot 'Invoke-PaEmergencyCheck.ps1') @a
}
Invoke-PaTask 'pim-audit' 'pim-audit' {
    param($dir)
    $invoke = if ($FixturePath) { (New-PaEvidenceFixtureInvoker -Path $FixturePath -AuditPath $AuditFixturePath -Cloud $Cloud).Invoke } else { New-PaLiveInvoker -Cloud $Cloud -SkipAzure }
    $reader = New-PaAuditReader -Cloud $Cloud -Invoke $invoke
    $map = if ($TierMapPath) { Get-PaTierMap -Path $TierMapPath } else { Get-PaTierMap }
    $events = Get-PaPimAuditEvent -Reader $reader -Since $sinceUtc -Until $asOfUtc -AsOf $asOfUtc
    $audit = Test-PaPimAudit -Events $events -Since $sinceUtc -Until $asOfUtc -TierMap $map
    Export-PaAuditRun -OutputPath $dir -Events $events -Audit $audit -Cloud $Cloud -TenantId $TenantId -Evidence $reader.Evidence -Mode $mode
}

$index = Write-PaRunIndex -RunPath $runPath -RunId $runId -AsOf $asOfUtc -Cloud $Cloud -TenantId $TenantId -Mode $mode -Since $sinceUtc -Until $asOfUtc -Tasks $tasks
$status = ($index.tasks.GetEnumerator() | ForEach-Object { "$($_.Key) $($_.Value.status)" }) -join ', '
Write-Output "Run $runId ($mode, $Cloud): $status"
Write-Output "Audit window $($index.auditWindow.since) to $($index.auditWindow.until)"
Write-Output "Written to $runPath (run.json lists each task's manifest hash)"
