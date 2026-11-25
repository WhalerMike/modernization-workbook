#Requires -Version 7.1
<#
.SYNOPSIS
    After the synthetic-event test (apply a label, remove it, ask Copilot something, as the test user), searches
    the audit log for the operations the plan names and writes them, with when the test started, as one JSON
    file for Invoke-IpAudit.ps1. Search-UnifiedAuditLog in Exchange Online PowerShell; reads only.
    -FixturePath reads a fixture tenant instead. Workbook Ch 07.
.EXAMPLE
    ./Search-IpSyntheticEvents.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/tenant -UserId test.user@contoso.example -StartedAt 2026-11-24T09:00:00Z -OutputPath out/synthetic.json -AsOf 2026-11-24T15:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$UserId,
    [Parameter(Mandatory)][string]$StartedAt,
    [string]$OutputPath = 'out/synthetic.json',
    [string]$FixturePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
$runner = if ($FixturePath) { New-IpFixtureRunner -Path $FixturePath } else { New-IpLiveRunner -Settings $s }
$r = Search-IpSyntheticEvent -Settings $s -Runner $runner -UserId $UserId -StartedAt $StartedAt -OutputPath $OutputPath -AsOf $AsOf
Write-Host ("{0} event(s) written to {1}" -f $r.Events, $OutputPath)
