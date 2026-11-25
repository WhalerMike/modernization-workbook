#Requires -Version 7.1
<#
.SYNOPSIS
    Compares labels, label policies and container labels with the protection plan; writes results.csv and labels.csv. Reads a baseline export folder (Export-IpBaseline.ps1); changes nothing. Workbook Ch 04.
.EXAMPLE
    ./Invoke-IpLabels.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/labels -AsOf 2026-11-24T12:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$OutputPath = 'out/labels',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
Invoke-IpLabels -Settings $s -SnapshotPath $SnapshotPath -OutputPath $OutputPath -AsOf $AsOf | Show-IpResult
