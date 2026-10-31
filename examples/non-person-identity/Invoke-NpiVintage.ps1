#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10: the annual AI use-case inventory vintage comparison (plan task N7.4, M-25-21).
    Compares this year's vintage with last year's by use case ID, joins both to Chapter 01's register
    through the use-case map and the service records, and writes the findings and changes with a
    manifest. Reads files only; nothing signs in.
.EXAMPLE
    ./Invoke-NpiVintage.ps1 -RegisterRun out/runs/2026-10-30T0600Z-fixture/inventory -Vintage 2026 `
        -CurrentPath tests/fixtures/ch10/vintage/ai-inventory-2026.csv -PriorPath tests/fixtures/ch10/vintage/ai-inventory-2025.csv `
        -UseCaseMapPath tests/fixtures/ch10/vintage/ai-use-cases.csv -ServiceRecordsPath tests/fixtures/inputs/service-records.csv -OutputPath out/vintage
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][ValidatePattern('^\d{4}$')][string]$Vintage,
    [Parameter(Mandatory)][string]$CurrentPath,
    [Parameter(Mandatory)][string]$PriorPath,
    [Parameter(Mandatory)][string]$UseCaseMapPath,
    [Parameter(Mandatory)][string]$ServiceRecordsPath,
    [Parameter(Mandatory)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiDrift/NpiDrift.psm1') -Force

$register = Import-NpiRegister -RunPath $RegisterRun
$dest = Join-Path $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath) "vintage-$Vintage"
if (Test-Path -LiteralPath $dest) { throw "$dest already exists; a vintage comparison is written once." }
# OMB's CSV is UTF-8 with a byte order mark; Import-Csv reads either.
$cmp = Compare-NpiAiVintage -Current @(Import-Csv -LiteralPath $CurrentPath) -Prior @(Import-Csv -LiteralPath $PriorPath) -UseCaseMap @(Import-Csv -LiteralPath $UseCaseMapPath) `
    -Rows @($register.Rows) -ServiceRecords @(Import-Csv -LiteralPath $ServiceRecordsPath) -Vintage $Vintage
$inputs = [ordered]@{}
foreach ($p in $CurrentPath, $PriorPath, $UseCaseMapPath, $ServiceRecordsPath) { $inputs[(Split-Path $p -Leaf)] = Get-NpiFileHash -Path $p }
$null = Export-NpiDriftTask -OutputPath $dest -Task vintage -Cloud $register.Manifest.cloud -TenantId $register.Manifest.tenantId -Mode $register.Manifest.mode -AsOf $register.Manifest.asOf `
    -Extra ([ordered]@{ vintage = $Vintage; registerSha256 = $register.Sha256; inputs = $inputs }) -Files ([ordered]@{ 'findings.json' = @($cmp.Findings); 'changes.json' = @($cmp.Changes) })
$fs = @($cmp.Findings)
Write-Output ("Vintage {0}: {1} changes ({2}); findings {3} Finding, {4} Warn, {5} Info" -f $Vintage, @($cmp.Changes).Count, ((@($cmp.Changes) | Group-Object Change | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '),
    @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count)
Write-Output "Written to $dest (manifest.json: tenant $($register.Manifest.tenantId), the register's and each input's SHA-256)"
