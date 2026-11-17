#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the rollback in the guide's order from a collection: enforced NET- Conditional Access policies to
    report-only (Steps 10, 7, 6, 5), security profile links removed (portal), tagging disabled, the ring's groups
    off the profiles (portal), the VPN route restored (the agency's change), and signaling last, only with
    -DisableSignaling. Writes plan.json, results.json and a manifest and prints the plan's SHA-256. Changes nothing
    unless run with -Apply and -ApprovedSha256 equal to that hash, against a live collection, in a delegated session.
.EXAMPLE
    ./deploy/Invoke-GsaRollback.ps1 -SettingsPath tests/fixtures/settings.test.json -CollectionPath out/deploy-test/collect -OutputPath out/deploy-test/rollback -AsOf 2026-11-30T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$CollectionPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [switch]$DisableSignaling,
    [switch]$Apply,
    [string]$ApprovedSha256,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$plan = Join-Path $OutputPath 'plan.json'
if (-not $Apply) { $null = New-GsaRollbackPlan -CollectionPath $CollectionPath -Settings $s -OutputPath $OutputPath -AsOf $AsOf -DisableSignaling:$DisableSignaling }
$cm = Get-Content -Raw (Join-Path $CollectionPath 'manifest.json') | ConvertFrom-Json
$inv = if ($Apply -and $cm.mode -eq 'Live') { New-GsaLiveInvoker -Settings $s } else { $null }
$results = @(Invoke-GsaPlanSteps -PlanPath $plan -Invoker $inv -Apply:$Apply -ApprovedSha256 $ApprovedSha256)
Write-GsaJson -Path (Join-Path $OutputPath 'results.json') -Value $results
$null = Write-GsaManifest -OutputPath $OutputPath -Task rollback -AsOf $AsOf -Mode $(if ($Apply) { 'Apply' } else { 'DryRun' }) -Settings $s -Extra @{ planSha256 = (Get-GsaFileHash -Path $plan) }
foreach ($r in $results) { Write-Host ('{0,-10} {1,-10}  {2}' -f $r.Id, $r.Status, $r.Detail) }
Write-Host ''
Write-Host ("Plan SHA-256: {0}" -f (Get-GsaFileHash -Path $plan))
if (-not $Apply) { Write-Host 'Dry run: nothing changed.' }
if (@($results | Where-Object Status -EQ 'Error').Count) { exit 1 }
