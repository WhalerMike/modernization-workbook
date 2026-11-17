#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 10: the guide's metrics from a month's run folders (coverage, prevention, asr, incidents, detections
    under -RunRoot), with synthetic-event success from the quarter's exercise record. Writes metrics.json,
    metrics.md and a manifest. Reads files only.
.EXAMPLE
    ./Invoke-XdrMetrics.ps1 -SettingsPath tests/fixtures/settings.lab.json -RunRoot out/month -OutputPath out/month/metrics -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$RunRoot,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$ExercisePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
if (-not $ExercisePath -and $s.inputs.Contains('exercise')) { $ExercisePath = $s.inputs.exercise }
$r = Invoke-XdrMetrics -Settings $s -RunRoot $RunRoot -OutputPath $OutputPath -AsOf $AsOf -ExercisePath $ExercisePath
$r.Metrics | Format-Table Metric, Value -AutoSize -Wrap | Write-XdrTable
Write-Host "Written to ${OutputPath}: metrics.md, metrics.json, manifest.json"
