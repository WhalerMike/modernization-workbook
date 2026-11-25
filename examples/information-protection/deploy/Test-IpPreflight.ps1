#Requires -Version 7.1
<#
.SYNOPSIS
    The runbook's preflight for test or production: PF-01 settings and inputs; PF-02 ExchangeOnlineManagement
    at a version this PowerShell can load; PF-03 AIPService when the Rights Management read is on; PF-04 the
    app-only certificate; PF-05 the output folder; PF-06 (production) the test stage's go/no-go. Exits 1 on a
    failure. Workbook Ch 09.
.EXAMPLE
    ./deploy/Test-IpPreflight.ps1 -SettingsPath <settings-file> -OutputPath out/preflight
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$OutputPath = 'out/preflight',
    [string]$TestEvidencePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
$p = @{ Settings = $s; OutputPath = $OutputPath; AsOf = $AsOf }
if ($TestEvidencePath) { $p.TestEvidencePath = $TestEvidencePath }
$r = Test-IpPreflight @p
$r | Show-IpResult
if ($r.Result -ne 'Pass') { exit 1 }
