#Requires -Version 7.1
<#
.SYNOPSIS
    Preflight before a stage, PF-01 to PF-06: settings complete, no secret, output and evidence outside any
    repository, commercial Azure (with -Live, az signed in to the settings' tenant and subscription), the
    template validates, and in production the test stage's evidence passes. Exits 1 on any failure. With
    -OutputPath, writes results.json and a hashed manifest.json for the evidence record.
.EXAMPLE
    ./deploy/Test-DcPreflight.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/preflight -Live
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Live)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/DailyChecks/DailyChecks.psm1') -Force
$p = @{ SettingsPath = $SettingsPath; AsOf = $AsOf; Live = $Live }
if ($OutputPath) { $p.OutputPath = $OutputPath }
$rows = Test-DcPreflight @p
foreach ($r in $rows) { Write-Host ('{0}  {1,-4}  {2}' -f $r.Check, $r.Status, $r.Detail) }
if (@($rows | Where-Object Status -EQ 'Fail').Count) { exit 1 }
