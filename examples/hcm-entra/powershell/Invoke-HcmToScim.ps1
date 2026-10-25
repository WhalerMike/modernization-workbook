#Requires -Version 7.2
<#
.SYNOPSIS
    Dry-run-first wrapper: convert an HCM extract to SCIM bulk requests and, only with -Apply, POST them.

.DESCRIPTION
    ILLUSTRATIVE: unit-tested against fixtures, not proven against live tenants.
    Writes bulk-request-NNN.json, validation-report.json (person key and payload hash only) and
    quarantine.json (personal data: keep it in the access-controlled audit store).
    -Apply reads a bearer token from the HCM_ENTRA_BEARER_TOKEN environment variable; obtain it
    outside this script, preferably from a managed identity or a certificate credential.
    Exit codes: 0 all sent or ready, 1 error, 2 some records quarantined, 3 run held for confirmation.

.EXAMPLE
    ./Invoke-HcmToScim.ps1 -Extract ../tests/fixtures/hcm_extract_sample.csv -AsOf 2026-10-25 -Out ./out
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Extract,
    [string]$Mapping = (Join-Path $PSScriptRoot '../config/mapping.json'),
    [string]$Settings = (Join-Path $PSScriptRoot '../config/settings.example.json'),
    [string]$Out = './out',
    [string]$AsOf = (Get-Date -Format 'yyyy-MM-dd'),
    [switch]$Apply,
    [switch]$ConfirmLargeDelta
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'HcmToScim.psm1') -Force

try {
    $map = Get-HcmMapping -Path $Mapping
    $cfg = Get-HcmSettings -Path $Settings
    $rows = @(Import-Csv -LiteralPath $Extract -Encoding utf8)
    $asOfDate = [datetime]::ParseExact($AsOf, 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture)
    $result = Convert-HcmExtract -Rows $rows -Mapping $map -Settings $cfg -AsOf $asOfDate
} catch {
    Write-Error "error: $($_.Exception.Message)" -ErrorAction Continue
    exit 1
}

New-Item -ItemType Directory -Force -Path $Out | Out-Null
$i = 0
foreach ($b in $result.Batches) {
    $i++
    $b | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $Out ('bulk-request-{0:D3}.json' -f $i)) -Encoding utf8NoBOM
}
$report = Get-HcmReport -Result $result
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $Out 'validation-report.json') -Encoding utf8NoBOM
@(Get-HcmQuarantineEntry -Result $result) | ConvertTo-Json -Depth 12 -AsArray | Set-Content -LiteralPath (Join-Path $Out 'quarantine.json') -Encoding utf8NoBOM
[ordered]@{ counts = $report.counts; batches = $report.batches; disables = $report.disables; held = $report.held; hold_reason = $report.hold_reason } | ConvertTo-Json -Compress

if ($result.Held -and -not $ConfirmLargeDelta) { exit 3 }
if ($Apply) {
    $token = $env:HCM_ENTRA_BEARER_TOKEN
    if (-not $token) { Write-Error 'error: -Apply needs a bearer token in HCM_ENTRA_BEARER_TOKEN' -ErrorAction Continue; exit 1 }
    try {
        $sent = Invoke-HcmBulkUpload -Batches $result.Batches -Endpoint $cfg.endpoint -Token $token -Settings $cfg
    } catch {
        Write-Error "error: $($_.Exception.Message)" -ErrorAction Continue
        exit 1
    }
    $sent | ConvertTo-Json -Depth 4 -AsArray | Set-Content -LiteralPath (Join-Path $Out 'apply-results.json') -Encoding utf8NoBOM
    if (@($sent | Where-Object { $_.status -ne 202 }).Count -gt 0) { exit 1 }
}
if ($report.counts.Contains('quarantined')) { exit 2 }
exit 0
