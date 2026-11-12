#Requires -Version 7.1
<#
.SYNOPSIS
    Normalizes a Zero Trust Assessment export to Book 11, Chapter 10's seven results (Pass, Fail, Planned,
    Skipped-Licensing, Skipped-Disconnected, Skipped-Not-Applicable, Unable-to-Evaluate) and writes
    results.json, results.csv, summary.json, summary.md, dispositions.csv and manifest.json. Read-only: it
    reads the JSON file the tool wrote and never connects to a tenant.
.PARAMETER ExportPath
    The folder Invoke-ZtAssessment -Path wrote, its zt-export folder, or ZeroTrustAssessmentReport.json.
.PARAMETER ReviewsPath
    Optional CSV (testId, decision, reviewer, reviewedOn, note) recording the manual review of each
    Investigate result: confirmed keeps it a finding, dismissed makes it a pass with the reviewer named.
.EXAMPLE
    ./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-10-27 -OutputPath out/run1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ExportPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$ReviewsPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ZtaResults/ZtaResults.psm1') -Force
$r = Invoke-ZtaNormalization -ExportPath $ExportPath -OutputPath $OutputPath -ReviewsPath $ReviewsPath
Write-Host ("Zero Trust Assessment {0}: {1} tests" -f $r.Version, $r.Tests)
foreach ($k in $r.Counts.Keys) { Write-Host ('  {0,-24} {1,4}' -f $k, $r.Counts[$k]) }
Write-Host ("Findings: {0} ({1} Investigate)" -f $r.Findings, $r.Investigate)
if (-not $r.TaxonomyReviewed) { Write-Warning "The kit's taxonomy is pinned to $((Get-ZtaConfig -Name taxonomy).toolVersion); review it for $($r.Version) before relying on the counts." }
if ($r.Unmapped.Count) { Write-Warning ("Unmapped status or skip reason, counted as Unable-to-Evaluate: {0}" -f ($r.Unmapped -join ', ')) }
Write-Host ("Written to {0}: results.json, results.csv, summary.json, summary.md, dispositions.csv, manifest.json" -f $OutputPath)
