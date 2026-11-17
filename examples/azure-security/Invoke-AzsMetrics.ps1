#Requires -Version 7.1
<#
.SYNOPSIS
    The Azure Security Engineering guide's metrics from one -Area all run: the ones the kit computes, with
    the numbers behind each, and the ones that come from exercise records or the workspace. Writes
    metrics.json, metrics.csv and a manifest.
.EXAMPLE
    ./Invoke-AzsMetrics.ps1 -RunPath out/week2 -OutputPath out/metrics -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')))
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/AzureSecurity/AzureSecurity.psm1') -Force
$rows = Get-AzsMetric -RunPath $RunPath -OutputPath $OutputPath -AsOf $AsOf
foreach ($m in $rows) { Write-Host ('{0,-24} {1,-26} target {2}' -f $m.metric, $m.value, $m.target) }
Write-Host "Written to ${OutputPath}: metrics.json, metrics.csv (with the numbers behind each)"
