#Requires -Version 7.1
<#
.SYNOPSIS
    Records a kit output folder (normalize, register or compare) as evidence: checks its manifest, copies
    it under <EvidencePath>/runs, and writes a timestamped record with its NIST SP 800-53 Rev. 5 controls
    and FedRAMP 20x KSIs (config/requirements.json), every file's SHA-256, the source export's SHA-256, and
    the hash of the record before it. Appends records.csv and rewrites SHA256SUMS. With -Check, verifies
    the folder instead and, with -Package and -RunDate, that the package's steps are covered.
.EXAMPLE
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run1 -AsOf 2026-10-27T19:00:00Z
.EXAMPLE
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check -Package re-run -RunDate 2026-11-10
#>
[CmdletBinding(DefaultParameterSetName = 'Record')]
param(
    [Parameter(Mandatory)][string]$EvidencePath,
    [Parameter(Mandatory, ParameterSetName = 'Record')][string]$RunPath,
    [Parameter(ParameterSetName = 'Record')][string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [Parameter(ParameterSetName = 'Record')][string]$Command = '',
    [Parameter(ParameterSetName = 'Record')][string]$Operator = '',
    [Parameter(Mandatory, ParameterSetName = 'Check')][switch]$Check,
    [Parameter(ParameterSetName = 'Check')][ValidateSet('first-run', 're-run')][string]$Package,
    [Parameter(ParameterSetName = 'Check')][string]$RunDate
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ZtaResults/ZtaResults.psm1') -Force

if ($Check) {
    $p = @{ EvidencePath = $EvidencePath }
    if ($Package) { $p.Package = $Package }
    if ($RunDate) { $p.RunDate = $RunDate }
    $rows = Test-ZtaEvidence @p
    foreach ($r in $rows) { Write-Host ('{0,-16} {1,-4}  {2}' -f $r.Check, $r.Status, $r.Detail) }
    if (@($rows | Where-Object Status -EQ 'Fail').Count) { exit 1 }
    return
}
$e = Write-ZtaEvidence -EvidencePath $EvidencePath -RunPath $RunPath -AsOf $AsOf -Command $Command -Operator $Operator
Write-Host ("Record {0}: {1} ({2})" -f $e.Sequence, $e.Result, ($e.Steps -join ', '))
Write-Host ("Controls: {0}" -f ($e.Controls -join ', '))
Write-Host ("KSIs:     {0}" -f ($e.Ksis -join ', '))
Write-Host ("Written to {0}: records/, runs/, records.csv, SHA256SUMS" -f $EvidencePath)
