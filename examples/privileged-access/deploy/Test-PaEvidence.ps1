#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: the evidence half of the go/no-go. For every step the stage requires in
    deploy/requirements.json, checks that its latest evidence record is present and passing,
    that the records' hash chain is unbroken, and that every file a record hashed is unchanged.
    Prints one row per step with its controls and FedRAMP 20x indicators, writes
    evidence/coverage.csv, and exits 1 unless every row holds. Reads files only.
.EXAMPLE
    # The fictional test stage's evidence after the fixture runs.
    ./deploy/Test-PaEvidence.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PaDeploy.psm1') -Force

$s = Read-PaDeploySettings -Path $SettingsPath
$rows = @(Test-PaEvidenceComplete -Settings $s)
$dir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath((Join-Path $s.outputRoot 'evidence'))
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$csv = @($rows | Select-Object Step, Status, Ok, Controls, Other, Ksi, Record, Reason | ConvertTo-Csv -NoTypeInformation)
[IO.File]::WriteAllText((Join-Path $dir 'coverage.csv'), ($csv -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
foreach ($r in $rows) { Write-Output ("  {0} {1} [{2}] {3}; KSI {4}: {5}" -f $(if ($r.Ok) { 'OK  ' } else { 'MISS' }), $r.Step.PadRight(18), $r.Status, $r.Controls, $r.Ksi, $r.Reason) }
$ok = @($rows | Where-Object Ok).Count
Write-Output ("Evidence for {0} ({1}): {2} of {3} required steps present and passing" -f $s.environment, $s.changeRecord, $ok, $rows.Count)
if ($ok -eq $rows.Count) { Write-Output 'GO on evidence: every requirement row has its evidence file, passing and unchanged.' }
else { Write-Output 'NO-GO on evidence: every required step needs a passing, unchanged record.' }
Write-Output "Written to $($s.outputRoot)/evidence/coverage.csv"
exit $(if ($ok -eq $rows.Count) { 0 } else { 1 })
