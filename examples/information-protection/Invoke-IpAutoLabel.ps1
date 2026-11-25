#Requires -Version 7.1
<#
.SYNOPSIS
    Checks each auto-labeling policy's mode against its planned stage and the custom sensitive information types; writes results.csv. Reads a baseline export folder (Export-IpBaseline.ps1); changes nothing. Workbook Ch 06.
.EXAMPLE
    ./Invoke-IpAutoLabel.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/autolabel -AsOf 2026-11-24T12:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$OutputPath = 'out/autolabel',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
Invoke-IpAutoLabel -Settings $s -SnapshotPath $SnapshotPath -OutputPath $OutputPath -AsOf $AsOf | Show-IpResult
