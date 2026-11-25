#Requires -Version 7.1
<#
.SYNOPSIS
    The monthly run: every check against one export, drift against the last approved export, the audit check
    with a synthetic search, the metrics, and each run recorded as evidence. Prints one line per check.
    Workbook Ch 08.
.EXAMPLE
    ./Invoke-IpMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -BaselinePath tests/fixtures/snapshots/2026-10-24 -SyntheticPath tests/fixtures/synthetic/2026-11-24.json -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-24T15:00:00Z
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$SnapshotPath,
    [string]$BaselinePath,
    [string]$SyntheticPath,
    [string]$RunRoot = 'out/month',
    [string]$EvidencePath,
    [string]$ChangeRecord = '',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
$p = @{ Settings = $s; SnapshotPath = $SnapshotPath; RunRoot = $RunRoot; AsOf = $AsOf; ChangeRecord = $ChangeRecord }
foreach ($k in 'BaselinePath', 'SyntheticPath', 'EvidencePath') { if ($PSBoundParameters.ContainsKey($k)) { $p[$k] = $PSBoundParameters[$k] } }
foreach ($r in Invoke-IpRunAll @p) { Write-Host ('{0,-11} {1,-5} {2,3} fail(s)  {3}{4}' -f $r.Task, $r.Result, $r.Fails, $(if ($r.Record) { "record $($r.Record)" } else { '' }), $(if ($r.Detail) { "  $($r.Detail)" } else { '' })) }
