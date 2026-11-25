#Requires -Version 7.1
<#
.SYNOPSIS
    Records a run folder as evidence: checks its manifest, copies it under <EvidencePath>/runs, and writes a
    record with the step it covers, its NIST SP 800-53 Rev 5 controls and KSIs (config/requirements.json), the
    run's own check result, every file's SHA-256 and the hash of the record before it. With -Check, verifies
    the folder instead (and, with -Stage, that the stage's steps each have a passing record). Workbook Ch 08.
.EXAMPLE
    ./Invoke-IpEvidence.ps1 -EvidencePath out/evidence -RunPath out/labels -AsOf 2026-11-24T12:00:00Z
.EXAMPLE
    ./Invoke-IpEvidence.ps1 -EvidencePath out/evidence -Check
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
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
if ($Check) {
    $rows = if ($Stage) { Test-IpEvidence -EvidencePath $EvidencePath -Stage $Stage } else { Test-IpEvidence -EvidencePath $EvidencePath }
    foreach ($r in $rows) { Write-Host ('{0,-18} {1,-4}  {2}' -f $r.Check, $r.Status, $r.Detail) }
    if (@($rows | Where-Object Status -EQ 'Fail').Count) { exit 1 }
    return
}
$e = Write-IpEvidence -EvidencePath $EvidencePath -RunPath $RunPath -AsOf $AsOf -ChangeRecord $ChangeRecord
Write-Host ("Record {0}: files {1}, check {2} ({3})" -f $e.Sequence, $e.Result, $e.CheckResult, ($e.Steps -join ', '))
Write-Host ("Controls: {0}" -f ($e.Controls -join ', '))
Write-Host ("KSIs:     {0}" -f ($e.Ksis -join ', '))
