#Requires -Version 7.1
<#
.SYNOPSIS
    Read-only: asks the workspace, for every table a tab reads, for its newest record and count over three
    days (az monitor log-analytics query, which needs the log-analytics extension and Log Analytics Reader),
    and reports Delivering, Late (past its freshness limit) or Missing. Exits 1 if any table isn't
    Delivering. -FixturePath reads saved answers instead (the lab).
.EXAMPLE
    ./deploy/Test-DcReachability.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/reach
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [string]$FixturePath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/DailyChecks/DailyChecks.psm1') -Force
$p = @{ SettingsPath = $SettingsPath; OutputPath = $OutputPath; AsOf = $AsOf }
if ($FixturePath) { $p.FixturePath = $FixturePath }
$rows = @(Test-DcReachability @p)
$rows | Format-Table Table, State, AgeMinutes, LimitMinutes, Records, Detail -AutoSize | Out-String -Width 150 | Write-Host
Write-Host "Written to $OutputPath`: reach.json, manifest.json"
if (@($rows | Where-Object State -NE 'Delivering').Count) { exit 1 }
