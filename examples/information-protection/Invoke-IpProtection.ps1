#Requires -Version 7.1
<#
.SYNOPSIS
    Checks Rights Management (super user feature off, no standing super users), the IRM and message encryption settings, the mail flow rules' stages and co-authoring; writes results.csv and mail-flow-rules.csv. Reads a baseline export folder (Export-IpBaseline.ps1); changes nothing. Workbook Ch 05.
.EXAMPLE
    ./Invoke-IpProtection.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/protection -AsOf 2026-11-24T12:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$OutputPath = 'out/protection',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
Invoke-IpProtection -Settings $s -SnapshotPath $SnapshotPath -OutputPath $OutputPath -AsOf $AsOf | Show-IpResult
