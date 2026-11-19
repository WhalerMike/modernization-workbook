#Requires -Version 7.1
<#
.SYNOPSIS
    Records a run folder (validate, preflight, plan, deploy, reachability or rollback) as evidence: checks its
    manifest, copies it under <EvidencePath>/runs, and writes a timestamped record with the steps it covers,
    their NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs (config/requirements.json), every file's SHA-256
    and the hash of the record before it. A render folder is refused. With -Check, verifies the folder instead
    (and, with -Stage, that the stage's steps have passing live records).
.EXAMPLE
    ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -RunPath out/validate -AsOf 2026-11-16T07:05:00Z
.EXAMPLE
    ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -Check
#>
[CmdletBinding(DefaultParameterSetName = 'Record')]
param(
    [Parameter(Mandatory)][string]$EvidencePath,
    [Parameter(Mandatory, ParameterSetName = 'Record')][string]$RunPath,
    [Parameter(ParameterSetName = 'Record')][string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [Parameter(ParameterSetName = 'Record')][string]$ChangeRecord = '',
    [Parameter(Mandatory, ParameterSetName = 'Check')][switch]$Check,
    [Parameter(ParameterSetName = 'Check')][ValidateSet('test', 'production')][string]$Stage
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DailyChecks/DailyChecks.psm1') -Force
if ($Check) {
    $rows = if ($Stage) { Test-DcEvidence -EvidencePath $EvidencePath -Stage $Stage } else { Test-DcEvidence -EvidencePath $EvidencePath }
    foreach ($r in $rows) { Write-Host ('{0,-14} {1,-4}  {2}' -f $r.Check, $r.Status, $r.Detail) }
    if (@($rows | Where-Object Status -EQ 'Fail').Count) { exit 1 }
    return
}
$e = Write-DcEvidence -EvidencePath $EvidencePath -RunPath $RunPath -AsOf $AsOf -ChangeRecord $ChangeRecord
Write-Host ("Record {0}: {1} {2} ({3})" -f $e.Sequence, $e.Task, $e.Result, ($e.Steps -join ', '))
Write-Host ("Controls: {0}" -f ($e.Controls -join ', '))
Write-Host ("KSIs:     {0}" -f ($e.Ksis -join ', '))
Write-Host ("Written to {0}: records/, runs/, records.csv, SHA256SUMS" -f $EvidencePath)
