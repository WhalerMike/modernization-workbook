#Requires -Version 7.1
<#
.SYNOPSIS
    Checks the audit floor: unified audit ingestion on, the planned retention policies, and, with
    -SyntheticPath, each synthetic event found within the planned time. Reads a baseline export folder; changes
    nothing. Workbook Ch 07.
.EXAMPLE
    ./Invoke-IpAudit.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -SyntheticPath tests/fixtures/synthetic/2026-11-24.json -OutputPath out/audit -AsOf 2026-11-24T15:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$SyntheticPath,
    [string]$OutputPath = 'out/audit',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
$p = @{ Settings = $s; SnapshotPath = $SnapshotPath; OutputPath = $OutputPath; AsOf = $AsOf }
if ($SyntheticPath) { $p.SyntheticPath = $SyntheticPath }
Invoke-IpAudit @p | Show-IpResult
