#Requires -Version 7.1
<#
.SYNOPSIS
    Checks the snapshot's tenant and cloud against the settings, and every Purview role group in the role register against the export; writes results.csv, role-groups.csv and permissions.csv (each read's cmdlet, shell, role and Learn page). Reads a baseline export folder (Export-IpBaseline.ps1); changes nothing. Workbook Ch 01.
.EXAMPLE
    ./Invoke-IpAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/access -AsOf 2026-11-24T12:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$OutputPath = 'out/access',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
Invoke-IpAccess -Settings $s -SnapshotPath $SnapshotPath -OutputPath $OutputPath -AsOf $AsOf | Show-IpResult
