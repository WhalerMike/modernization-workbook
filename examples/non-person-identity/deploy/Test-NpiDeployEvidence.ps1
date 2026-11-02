#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 11: the go/no-go's evidence check. For every requirement row the stage must cover
    (config/requirements-ch11.json, "stages"), an evidence record for this environment and tenant
    whose result is Pass or Warn; and SHA256SUMS present, with every file unchanged and listed.
    Prints one row per step with its controls and KSIs, and exits 1 when any row is missing or failing.
    Reads only the evidence folder.
.EXAMPLE
    ./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -EvidencePath out/deploy-test/evidence
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$EvidencePath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'NpiDeploy.psm1') -Force

$s = Read-NpiDeploySettings -Path $SettingsPath -Stage $Stage
$rows = @(Test-NpiDeployEvidence -EvidencePath $EvidencePath -Settings $s -Stage $Stage)
$gaps = @($rows | Where-Object Status -NE 'Present')
Write-Output ("Evidence for the {0} stage ({1}): {2} of {3} requirement rows present and passing" -f $Stage, $s.changeRecord, ($rows.Count - $gaps.Count), $rows.Count)
foreach ($r in $rows) { Write-Output ('  {0,-9} {1,-16} {2,-6} {3}' -f $r.Step, $r.Status, $r.Result, $r.Ksis) }
if ($gaps.Count) {
    foreach ($g in $gaps) { Write-Output ("  Gap: {0}: {1}" -f $g.Step, $g.Detail) }
    Write-Output 'Result: NO-GO on evidence.'; exit 1
}
Write-Output 'Result: every requirement row has its evidence, and every hash matches.'
