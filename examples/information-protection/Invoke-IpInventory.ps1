#Requires -Version 7.1
<#
.SYNOPSIS
    Checks the class register against the tenant's sensitive information types and reports how much content each class's types find; writes results.csv and inventory.csv. Reads a baseline export folder (Export-IpBaseline.ps1); changes nothing. Workbook Ch 03.
.EXAMPLE
    ./Invoke-IpInventory.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/inventory -AsOf 2026-11-24T12:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$OutputPath = 'out/inventory',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
Invoke-IpInventory -Settings $s -SnapshotPath $SnapshotPath -OutputPath $OutputPath -AsOf $AsOf | Show-IpResult
