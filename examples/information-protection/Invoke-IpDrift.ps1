#Requires -Version 7.1
<#
.SYNOPSIS
    Compares an export with the last approved one and classifies every difference with Book 20, Chapter 12's
    drift signals; a difference no change ticket explains fails. Writes results.csv and drift.csv. Workbook Ch 08.
.EXAMPLE
    ./Invoke-IpDrift.ps1 -SettingsPath tests/fixtures/settings.lab.json -BaselinePath tests/fixtures/snapshots/2026-10-24 -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/drift -AsOf 2026-11-24T12:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$BaselinePath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$OutputPath = 'out/drift',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
Invoke-IpDrift -Settings $s -BaselinePath $BaselinePath -SnapshotPath $SnapshotPath -OutputPath $OutputPath -AsOf $AsOf | Show-IpResult
