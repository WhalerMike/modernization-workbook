#Requires -Version 7.1
<#
.SYNOPSIS
    The guide's coverage and effectiveness metrics for a collection and its inputs, and the ring exit criteria for
    the ring the settings name. Writes metrics.json, ring-exit.json and a manifest, and prints both tables with a
    verdict: the ring exits only if every criterion passes. Reads files only.
.EXAMPLE
    ./Invoke-GsaMetrics.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/metrics -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$CollectionPath,
    [Parameter(Mandatory)][string]$InputsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$c = Read-GsaCollection -Path $CollectionPath
$i = Read-GsaInputs -Path $InputsPath
$m = @(Get-GsaMetrics -Collection $c -Inputs $i -Settings $s -AsOf $AsOf)
$x = @(Test-GsaRingExit -Collection $c -Inputs $i -Settings $s -AsOf $AsOf)
if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
Write-GsaJson -Path (Join-Path $OutputPath 'metrics.json') -Value $m
Write-GsaJson -Path (Join-Path $OutputPath 'ring-exit.json') -Value $x
$go = -not @($x | Where-Object Status -EQ 'Fail').Count
$null = Write-GsaManifest -OutputPath $OutputPath -Task metrics -AsOf $AsOf -Mode 'Files' -Settings $s -Extra @{ verdict = $(if ($go) { 'Go' } else { 'No-go' }); failed = @($x | Where-Object Status -EQ 'Fail').Count }
foreach ($r in $m) { Write-Host ('{0,-32} {1,-4} {2}  (target {3})' -f $r.Metric, $(if ($r.Met) { 'Met' } else { 'Not' }), $r.Value, $r.Target) }
Write-Host ''
foreach ($r in $x) { Write-Host ('{0,-46} {1,-4}  {2}' -f $r.Criterion, $r.Status, $r.Detail) }
Write-Host ''
Write-Host ("Ring {0}: {1}. Written to {2}: metrics.json, ring-exit.json, manifest.json" -f $s.ring, $(if ($go) { 'Go, every exit criterion passes' } else { 'No-go' }), $OutputPath)
