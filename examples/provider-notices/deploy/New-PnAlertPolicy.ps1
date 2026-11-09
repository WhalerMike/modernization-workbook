#Requires -Version 7.1
<#
.SYNOPSIS
    Azure Service Health alerts at scale with Azure Policy: plans the assignment of the built-in definition
    "Configure subscriptions to enable Service Health Monitoring Alert Rules" at the settings scope, and its
    remediation task, and writes plan.json, results.json and a manifest. Changes nothing unless -Apply with
    -ApprovedSha256 equal to the plan's SHA-256 (the hash the change record approved). Applying needs
    permission to create policy assignments and role assignments at the scope. Not run against a live
    tenant.
.EXAMPLE
    # Plan only, against the fixture.
    ./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/deploy-prod/alerts -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [switch]$Apply,
    [string]$ApprovedSha256,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PnDeploy.psm1') -Force

$s = Read-PnSettings -Path $SettingsPath
if ($FixturePath) {
    if ($Apply) { throw 'Fixture mode never applies.' }
    $null = Use-PnDeployFixture -Path $FixturePath
} else { Assert-PnLiveContext -Provider azure -Settings $s }
$null = New-PnAlertPlan -Settings $s -OutputPath $OutputPath
$plan = Join-Path $OutputPath 'plan.json'
$results = @(Invoke-PnPlanSteps -PlanPath $plan -Apply:$Apply -ApprovedSha256 $ApprovedSha256)
$mode = if ($Apply) { 'Apply' } elseif ($FixturePath) { 'Fixture' } else { 'DryRun' }
Write-PnDeployRun -OutputPath $OutputPath -Task alerts -Results $results -Settings $s -Mode $mode -AsOf $AsOf
foreach ($r in $results) { Write-Host ('{0,-6} {1,-10}  {2}' -f $r.Id, $r.Status, $r.Detail) }
Write-Host ''
Write-Host ("Plan SHA-256: {0}" -f (Get-PnFileHash -Path $plan))
if (-not $Apply) { Write-Host 'Dry run: nothing changed. To apply, add -Apply -ApprovedSha256 <the hash above> after the change record approves it.' }
if (@($results | Where-Object Status -EQ 'Error').Count) { exit 1 }
