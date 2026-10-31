#Requires -Version 7.2
<#
.SYNOPSIS
    Correlate an HCM extract with Active Directory and Entra ID on the person key: matched,
    unmatched both ways, duplicates and conflicting values, with a quarantine report.

.DESCRIPTION
    ILLUSTRATIVE: unit-tested against fixtures, not proven against live tenants.
    Read-only: reads the extract, the Start Kit's ad-user-export.csv and, optionally, an Entra ID
    users export (JSON), and writes correlation-report.json (keys, statuses, counts and conflict
    field names; no names or values) and correlation-quarantine.json (each record that needs a
    decision with the rows as read: personal data, so keep it in the access-controlled audit
    store). The same output as python/hcm_correlate.py for the same input.
    Exit codes: 0 nothing needs a decision, 1 error, 2 the quarantine has entries.

.EXAMPLE
    ./Invoke-HcmCorrelation.ps1 -Extract ../tests/fixtures/hcm_extract_sample.csv -Ad ../tests/fixtures/correlation/ad-user-export.csv -Entra ../tests/fixtures/correlation/entra-users.json -AsOf 2026-10-25 -Out ./out
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Extract,
    [Parameter(Mandatory)][string]$Ad,
    [string]$Entra,
    [string]$Mapping = (Join-Path $PSScriptRoot '../config/mapping.json'),
    [string]$Out = './out',
    [string]$AsOf = (Get-Date -Format 'yyyy-MM-dd')
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'HcmToScim.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'HcmCorrelation.psm1') -Force

try {
    $map = Get-HcmMapping -Path $Mapping
    $asOfDate = [datetime]::ParseExact($AsOf, 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture)
    $entraUsers = $null
    if ($Entra) { $entraUsers = @(Read-HcmEntraExport -Path $Entra) }
    $result = Invoke-HcmCorrelationJoin -HrRows @(Import-Csv -LiteralPath $Extract -Encoding utf8) -AdRows @(Import-Csv -LiteralPath $Ad -Encoding utf8) `
        -EntraUsers $entraUsers -Mapping $map
} catch {
    Write-Error "error: $($_.Exception.Message)" -ErrorAction Continue
    exit 1
}
$inputs = [ordered]@{
    extract_sha256 = Get-HcmFileSha256 $Extract
    ad_sha256      = Get-HcmFileSha256 $Ad
    entra_sha256   = $(if ($Entra) { Get-HcmFileSha256 $Entra } else { $null })
    mapping_sha256 = Get-HcmFileSha256 $Mapping
}
New-Item -ItemType Directory -Force -Path $Out | Out-Null
Get-HcmCorrelationReport -Result $result -AsOf $asOfDate -Inputs $inputs | ConvertTo-Json -Depth 10 |
    Set-Content -LiteralPath (Join-Path $Out 'correlation-report.json') -Encoding utf8NoBOM
ConvertTo-Json -InputObject @($result.quarantine) -Depth 12 | Set-Content -LiteralPath (Join-Path $Out 'correlation-quarantine.json') -Encoding utf8NoBOM
[ordered]@{ counts = $result.counts; rates = $result.rates } | ConvertTo-Json -Compress
if ($result.quarantine.Count) { exit 2 }
exit 0
