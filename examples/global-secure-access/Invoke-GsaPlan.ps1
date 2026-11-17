#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the changes one ring needs: compares a desired-state file with a collection and writes plan.json (the
    Graph requests, in a safe order, and the portal-only steps), then prints each step and the plan's SHA-256.
    Nothing changes unless it is run again with -Apply and -ApprovedSha256 equal to that hash, in a live delegated
    session; fixture mode never applies. A new Conditional Access policy is created report-only; enforcing one
    needs -AllowEnforce.
.EXAMPLE
    ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -DesiredPath config/desired.lab.json -OutputPath out/plan -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$CollectionPath,
    [Parameter(Mandatory)][string]$DesiredPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [switch]$AllowEnforce,
    [switch]$Apply,
    [string]$ApprovedSha256,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$cm = Get-Content -Raw (Join-Path $CollectionPath 'manifest.json') | ConvertFrom-Json
$plan = Join-Path $OutputPath 'plan.json'
if (-not $Apply) { $null = New-GsaPlan -CollectionPath $CollectionPath -DesiredPath $DesiredPath -Settings $s -OutputPath $OutputPath -AsOf $AsOf -AllowEnforce:$AllowEnforce }
$inv = if ($Apply -and $cm.mode -eq 'Live') { New-GsaLiveInvoker -Settings $s } else { $null }
$results = @(Invoke-GsaPlanSteps -PlanPath $plan -Invoker $inv -Apply:$Apply -ApprovedSha256 $ApprovedSha256)
Write-GsaJson -Path (Join-Path $OutputPath 'results.json') -Value $results
$null = Write-GsaManifest -OutputPath $OutputPath -Task plan -AsOf $AsOf -Mode $(if ($Apply) { 'Apply' } else { 'DryRun' }) -Settings $s -Extra @{ planSha256 = (Get-GsaFileHash -Path $plan) }
foreach ($r in $results) { Write-Host ('{0,-10} {1,-10}  {2}' -f $r.Id, $r.Status, $r.Detail) }
Write-Host ''
Write-Host ("Plan SHA-256: {0}" -f (Get-GsaFileHash -Path $plan))
if (-not $Apply) { Write-Host 'Dry run: nothing changed.' }
if (@($results | Where-Object Status -EQ 'Error').Count) { exit 1 }
