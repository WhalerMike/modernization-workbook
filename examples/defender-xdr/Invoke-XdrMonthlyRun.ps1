#Requires -Version 7.1
<#
.SYNOPSIS
    The guide's monthly evidence run as one command: every check (access, coverage, prevention, ASR, exposure,
    incidents, detections, signals, automation) into a folder each under -RunRoot, the metrics, and, with
    -EvidencePath, every run folder recorded as hashed, chained evidence. Reads only.
.EXAMPLE
    ./Invoke-XdrMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$RunRoot,
    [string]$EvidencePath,
    [string]$FixturePath,
    [string]$ChangeRecord = '',
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$rows = Invoke-XdrRunAll -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -RunRoot $RunRoot -AsOf $AsOf -EvidencePath $EvidencePath -ChangeRecord $ChangeRecord
$rows | Format-Table Task, Result, Record, Detail -AutoSize -Wrap | Write-XdrTable
Write-Host ("Monthly run: {0} run folder(s) under {1}; {2} with findings, {3} error(s){4}." -f $rows.Count, $RunRoot, @($rows | Where-Object Result -EQ 'Fail').Count, @($rows | Where-Object Result -EQ 'Error').Count, $(if ($EvidencePath) { "; recorded in $EvidencePath" } else { '' }))
