#Requires -Version 7.1
<#
.SYNOPSIS
    Collects provider notices (Azure Service Health, Microsoft 365, Oracle Cloud Infrastructure, AWS Health,
    Google Cloud Personalized Service Health), normalizes them into one record each, and writes the run:
    raw/<provider>.json, notices.json, notices.csv and manifest.json. Reads only.
    -FixturePath reads the provider folders under it and sends nothing (Lab 1). Without it, the live
    invoker calls az, Microsoft Graph PowerShell, oci, aws and gcloud with the clouds the settings file
    names (Lab 2), and refuses to run if a session is signed in to another cloud.
.EXAMPLE
    # Lab 1: every provider from the day-one fixtures; nothing leaves the machine.
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
.EXAMPLE
    # Lab 2: Azure and Microsoft 365 only, live, in a test tenant.
    ./Invoke-PnCollect.ps1 -SettingsPath deploy/settings.test.json -Provider azure, m365 -OutputPath out/live
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [ValidateSet('all', 'azure', 'm365', 'oci', 'aws', 'google')][string[]]$Provider = @('all'),
    [string]$FixturePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [switch]$AllowUnverified
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ProviderNotices/ProviderNotices.psm1') -Force

$settings = Read-PnSettings -Path $SettingsPath
$invoker = if ($FixturePath) { New-PnFixtureInvoker -Path $FixturePath } else { New-PnLiveInvoker -Settings $settings -AllowUnverified:$AllowUnverified }
$run = Invoke-PnCollection -Settings $settings -Invoker $invoker -OutputPath $OutputPath -AsOf $AsOf -Provider $Provider

Write-Host ("Collected as of {0} ({1} mode, environment {2})" -f $run.AsOf, $invoker.Mode, $settings.environment)
Write-Host ''
Write-Host ('{0,-8} {1,-11} {2,8} {3,6} {4,8}  {5}' -f 'Provider', 'Cloud', 'Notices', 'Open', 'Action', 'By kind')
foreach ($p in $run.Providers.Keys) {
    $kinds = @($run.Notices | Where-Object { $_.provider -eq $p } | Group-Object { $_.kind } | Sort-Object Name | ForEach-Object { "$($_.Name) $($_.Count)" }) -join ', '
    $s = $run.Providers[$p]
    Write-Host ('{0,-8} {1,-11} {2,8} {3,6} {4,8}  {5}' -f $p, $s.cloud, $s.notices, $s.open, $s.actionRequired, $kinds)
}
Write-Host ''
Write-Host ("{0} notices, each valid against schema/notice.schema.json. Written to {1}: notices.json, notices.csv, raw/, manifest.json" -f @($run.Notices).Count, $OutputPath)
