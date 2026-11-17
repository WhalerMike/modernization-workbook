#Requires -Version 7.1
<#
.SYNOPSIS
    The weekly run: every area's check, the register against last week's, the comparison, the metrics, and
    an evidence record, under the settings' outputRoot and evidencePath. Fixture mode with -FixturePath.
.EXAMPLE
    ./deploy/Invoke-AzsScheduledRun.ps1 -SettingsPath settings.test.json -AllowUnverified
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [string]$FixturePath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$AllowUnverified, [string]$DefenderExposurePath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'AzsDeploy.psm1') -Force
$r = Invoke-AzsScheduledRun -SettingsPath $SettingsPath -FixturePath $FixturePath -AsOf $AsOf -AllowUnverified:$AllowUnverified -DefenderExposurePath $DefenderExposurePath
Write-Host ("Run {0}: {1} Finding, {2} Warn, {3} Info" -f (Split-Path -Leaf $r.Run), $r.Counts.Finding, $r.Counts.Warn, $r.Counts.Info)
if ($r.Drift) { Write-Host ("Against {0}: new {1}, fixed {2}, still open {3}" -f (Split-Path -Leaf $r.Previous), $r.Drift.new, $r.Drift.fixed, $r.Drift.stillOpen) } else { Write-Host 'No earlier run: this run is the baseline' }
Write-Host ("Evidence record {0}: {1} ({2})" -f $r.Evidence.Sequence, $r.Evidence.Result, ($r.Evidence.Steps -join ', '))
