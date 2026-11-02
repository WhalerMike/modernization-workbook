#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 11: the rollback.
      -Mode Plan   write rollback-plan.json from the settings and the preflight's snapshot.json, and
                   print its SHA-256 for the reviewer. Sends nothing.
      -Mode Apply  check the plan's approved SHA-256, tenant and age, then dry-run it, or send it with
                   -Apply. Only PATCH, Enable-ADAccount and Disable-ADAccount: nothing is deleted. A
                   live run is a person, delegated.
    -FixturePath serves Graph and Active Directory from a file and sends nothing anywhere.
.EXAMPLE
    ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -SnapshotPath out/deploy-test/preflight/snapshot.json -To Disabled -IncludeSmokeCleanup -OutputPath out/deploy-test/rollback
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('Plan', 'Apply')][string]$Mode,
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$SnapshotPath,
    [ValidateSet('ReportOnly', 'Disabled')][string]$To,
    [string[]]$Wave,
    [switch]$IncludeSmokeCleanup,
    [string]$PlanPath,
    [string]$ApprovedSha256,
    [string]$FixturePath,
    [string]$Server,
    [datetime]$AsOf,
    [string]$EvidencePath,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'NpiDeploy.psm1') -Force

$s = Read-NpiDeploySettings -Path $SettingsPath -Stage $Stage
if ($FixturePath) { $fake = New-NpiDeployFixtureInvoker -Path $FixturePath }
if (-not $PSBoundParameters.ContainsKey('AsOf')) {
    $AsOf = if ($FixturePath) { [datetime]::Parse($fake.Fixture.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { [datetime]::UtcNow }
}

if ($Mode -eq 'Plan') {
    if (-not $SnapshotPath -or -not $To) { throw '-Mode Plan needs -SnapshotPath and -To.' }
    $plan = New-NpiDeployRollbackPlan -Settings $s -SnapshotPath $SnapshotPath -To $To -Wave $Wave -IncludeSmokeCleanup:$IncludeSmokeCleanup -AsOf $AsOf
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $p = Join-Path $OutputPath 'rollback-plan.json'
    Write-NpiJson -Path $p -Value $plan
    Write-Output ("Rollback plan ({0}, to {1}): {2} action(s)" -f $Stage, $To, @($plan.actions).Count)
    foreach ($a in @($plan.actions)) { Write-Output ('  {0} {1,-7} {2,-22} {3}' -f $a.id, $a.gate, $a.kind, $a.target) }
    Write-Output "Plan SHA-256 for the reviewer: $(Get-NpiFileHash -Path $p)"
    return
}

if (-not $PlanPath -or -not $ApprovedSha256) { throw '-Mode Apply needs -PlanPath and -ApprovedSha256.' }
if ($FixturePath) { $invoke = $fake.Invoke; $adInvoke = $fake.AdInvoke; $runMode = 'Fixture' }
else {
    $invoke = New-NpiDeployLiveInvoker -Cloud $s.cloud -TenantId $s.tenantId -Task deploy-rollback
    $adInvoke = New-NpiDeployLiveAdInvoker -Server $(if ($Server) { $Server } else { $s.ad.server }) -Task deploy-rollback
    $runMode = 'Live'
}
$client = New-NpiDeployClient -Cloud $s.cloud -Task deploy-rollback -Invoke $invoke -AdInvoke $adInvoke
$r = Invoke-NpiDeployRollbackPlan -Client $client -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -TenantId $s.tenantId -AsOf $AsOf -Apply:$Apply
$null = Export-NpiDeployRun -OutputPath $OutputPath -Task deploy-rollback -Settings $s -Mode $runMode -Evidence $client.Evidence.ToArray() -AsOf $AsOf.ToUniversalTime().ToString('o') `
    -Extra @{ planSha256 = $r.PlanSha256; applied = [bool]$Apply } -Files @{ 'results.json' = @($r.Results) }
Write-Output ("Rollback {0} ({1}, {2}): {3}" -f $(if ($Apply) { 'Apply' } else { 'DryRun' }), $runMode, $Stage, ((@($r.Results) | Group-Object Status | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($x in @($r.Results)) { Write-Output ('  {0} {1,-11} {2}' -f $x.ActionId, $x.Status, $x.Detail) }
if (-not $EvidencePath) { $EvidencePath = Join-Path (Split-Path -Parent $OutputPath) 'evidence' }
$e = Write-NpiDeployEvidence -EvidencePath $EvidencePath -Step ROLLBACK -Settings $s -Mode $runMode -Command $MyInvocation.Line -Results $r.Results -RunPaths $OutputPath
Write-Output ("Evidence: {0} ({1})" -f $e.Name, (Get-Content $e.FullName -Raw | ConvertFrom-Json).result)
if (@($r.Results | Where-Object Status -EQ 'Error').Count) { exit 1 }
