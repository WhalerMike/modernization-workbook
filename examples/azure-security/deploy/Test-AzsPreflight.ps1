#Requires -Version 7.1
<#
.SYNOPSIS
    Preflight before a stage (PF-01 to PF-07): settings, no secret, an output root outside any repository,
    Azure CLI's cloud and tenant and the reader's first query (with -Live), the unverified calls, and for
    production the test stage's evidence. Writes results.json and a manifest; exits 1 on any Fail.
.EXAMPLE
    ./deploy/Test-AzsPreflight.ps1 -SettingsPath settings.test.json -OutputPath <output-root>/preflight -Live -AllowUnverified
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Live, [switch]$AllowUnverified)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'AzsDeploy.psm1') -Force
$rows = Test-AzsPreflight -SettingsPath $SettingsPath -OutputPath $OutputPath -AsOf $AsOf -Live:$Live -AllowUnverified:$AllowUnverified
foreach ($r in $rows) { Write-Host ('{0,-6} {1,-7} {2}' -f $r.check, $r.status, $r.detail) }
Write-Host "Written to ${OutputPath}: results.json, manifest.json"
if (@($rows | Where-Object status -EQ 'Fail').Count) { exit 1 }
