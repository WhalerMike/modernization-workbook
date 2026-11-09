#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the rollback for an environment, in reverse order: unregister the scheduled task, delete the Service
    Health alert policy assignment, and list the resources the policy's remediation created for the change
    record to decide on. Keeps the kit's state, runs and evidence. Writes plan.json, results.json and a
    manifest. Runs the writes only with -Apply and -ApprovedSha256 equal to the plan's SHA-256.
.EXAMPLE
    ./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -OutputPath out/deploy-prod/rollback -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [switch]$Apply,
    [string]$ApprovedSha256,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PnDeploy.psm1') -Force

$s = Read-PnSettings -Path $SettingsPath
if ($Apply -and $s.azurePolicy.enabled) { Assert-PnLiveContext -Provider azure -Settings $s }
$null = New-PnRollbackPlan -Settings $s -OutputPath $OutputPath
$plan = Join-Path $OutputPath 'plan.json'
$results = @(Invoke-PnPlanSteps -PlanPath $plan -Apply:$Apply -ApprovedSha256 $ApprovedSha256)
Write-PnDeployRun -OutputPath $OutputPath -Task rollback -Results $results -Settings $s -Mode $(if ($Apply) { 'Apply' } else { 'DryRun' }) -AsOf $AsOf
foreach ($r in $results) { Write-Host ('{0,-6} {1,-10}  {2}' -f $r.Id, $r.Status, $r.Detail) }
Write-Host ''
Write-Host ("Plan SHA-256: {0}" -f (Get-PnFileHash -Path $plan))
if (-not $Apply) { Write-Host 'Dry run: nothing changed.' }
if (@($results | Where-Object Status -EQ 'Error').Count) { exit 1 }
