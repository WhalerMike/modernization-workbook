#Requires -Version 7.1
<#
.SYNOPSIS
    Records a run folder as evidence: checks its manifest, copies it under <EvidencePath>/runs, and writes a
    timestamped record with the steps it covers, their NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs
    (config/requirements.json), the run's own check result, every file's SHA-256 and the hash of the record
    before it. Appends records.csv and rewrites SHA256SUMS. With -Check, verifies the folder instead (and,
    with -Stage, that the stage's steps each have a passing record).
.EXAMPLE
    ./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -RunPath out/coverage -AsOf 2026-11-16T12:00:00Z
.EXAMPLE
    ./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -Check
#>
[CmdletBinding(DefaultParameterSetName = 'Record')]
param(
    [Parameter(Mandatory)][string]$EvidencePath,
    [Parameter(Mandatory, ParameterSetName = 'Record')][string]$RunPath,
    [Parameter(ParameterSetName = 'Record')][string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [Parameter(ParameterSetName = 'Record')][string]$Command = '',
    [Parameter(ParameterSetName = 'Record')][string]$ChangeRecord = '',
    [Parameter(Mandatory, ParameterSetName = 'Check')][switch]$Check,
    [Parameter(ParameterSetName = 'Check')][ValidateSet('test', 'production')][string]$Stage
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
if ($Check) {
    $rows = if ($Stage) { Test-XdrEvidence -EvidencePath $EvidencePath -Stage $Stage } else { Test-XdrEvidence -EvidencePath $EvidencePath }
    foreach ($r in $rows) { Write-Host ('{0,-18} {1,-4}  {2}' -f $r.Check, $r.Status, $r.Detail) }
    if (@($rows | Where-Object Status -EQ 'Fail').Count) { exit 1 }
    return
}
$e = Write-XdrEvidence -EvidencePath $EvidencePath -RunPath $RunPath -AsOf $AsOf -Command $Command -ChangeRecord $ChangeRecord
Write-Host ("Record {0}: files {1}, check {2} ({3})" -f $e.Sequence, $e.Result, $e.CheckResult, ($e.Steps -join ', '))
Write-Host ("Controls: {0}" -f ($e.Controls -join ', '))
Write-Host ("KSIs:     {0}" -f ($e.Ksis -join ', '))
