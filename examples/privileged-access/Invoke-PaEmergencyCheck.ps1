#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 02: check the emergency access accounts against the standard, and write the alert rule
    for their use as an ARM template for review. Read-only: it deploys nothing.
.EXAMPLE
    # Lab 1: the fictional tenant, no sign-in.
    ./Invoke-PaEmergencyCheck.ps1 -FixturePath tests/fixtures/tenant.json -ConfigPath tests/fixtures/inputs/emergency-access.json `
        -ValidationsPath tests/fixtures/inputs/emergency-validations.csv -AsOf 2026-10-30 -OutputPath out/emergency `
        -WorkspaceResourceId /subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/Microsoft.OperationalInsights/workspaces/law-identity `
        -ActionGroupResourceId /subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/Microsoft.Insights/actionGroups/ag-soc -Location eastus
#>
[CmdletBinding()]
param(
    [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud = 'gcc',
    [Parameter(Mandatory)][string]$ConfigPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$ValidationsPath,
    [datetime]$AsOf = [datetime]::UtcNow,
    [string]$WorkspaceResourceId,
    [string]$ActionGroupResourceId,
    [string]$Location,
    [string]$TenantId
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force

$config = Read-PaEmergencyConfig -Path $ConfigPath
if ($FixturePath) { $invoke = (New-PaFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-PaLiveInvoker -Cloud $Cloud -SkipAzure; $mode = 'Live' }
$reader = New-PaReader -Cloud $Cloud -Task emergency-access -Invoke $invoke
$validations = if ($ValidationsPath) { @(Import-Csv -LiteralPath $ValidationsPath) } else { @() }
$findings = Test-PaEmergencyAccess -Reader $reader -Config $config -Validations $validations -AsOf $AsOf

$files = @{ 'findings.json' = @($findings) }
if ($WorkspaceResourceId) {
    $files['emergency-alert.json'] = New-PaEmergencyAlertRule -AccountId @($config.accounts | ForEach-Object { $_.id }) -WorkspaceResourceId $WorkspaceResourceId -ActionGroupResourceId $ActionGroupResourceId -Location $Location
}
$null = Export-PaRun -OutputPath $OutputPath -Task emergency-access -Cloud $Cloud -Mode $mode -TenantId $TenantId -Evidence $reader.Evidence -Files $files

Write-Output ("Emergency access: {0} Finding, {1} Warn, {2} Info" -f @($findings | Where-Object Severity -EQ 'Finding').Count, @($findings | Where-Object Severity -EQ 'Warn').Count, @($findings | Where-Object Severity -EQ 'Info').Count)
if ($WorkspaceResourceId) { Write-Output 'Alert rule written to emergency-alert.json for review; deploy it with your reviewed pipeline' }
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
