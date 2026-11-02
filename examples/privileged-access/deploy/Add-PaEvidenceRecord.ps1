#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: record the evidence for a runbook step that an earlier chapter's script ran
    (emergency-access, conditional-access, pim-roles, pim-groups, azure-roles, access-reviews,
    evidence, pim-convert or first-week). It judges the step's run folder as
    deploy/requirements.json says, then writes an evidence record to <outputRoot>/evidence with
    the result, the step's controls and FedRAMP 20x indicators, the SHA-256 of every file in the
    run folder, and the hash of the record before it. Reads files only.
.EXAMPLE
    # Record the fixture Azure apply as the azure-roles step of the fictional test stage.
    ./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -Step azure-roles -RunPath deploy/tests/fixtures/runs/azure-apply -Command './Invoke-PaAzurePim.ps1 ... -Apply'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('emergency-access', 'conditional-access', 'pim-roles', 'pim-groups', 'azure-roles', 'access-reviews', 'evidence', 'pim-convert', 'first-week')][string]$Step,
    [Parameter(Mandatory)][string]$RunPath,
    [Parameter(Mandatory)][string]$Command
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PaDeploy.psm1') -Force

$s = Read-PaDeploySettings -Path $SettingsPath
$check = Test-PaStepResult -Step $Step -RunPath $RunPath
$e = Write-PaEvidenceRecord -Settings $s -Step $Step -Command $Command -Result $check.Result -Reason $check.Reason -RunPath $RunPath
$req = Get-PaDeployRequirement -Step $Step
Write-Output ("{0} {1}: {2}" -f $check.Result.ToUpperInvariant(), $Step, $check.Reason)
Write-Output ("  Supports {0}; KSI {1}" -f ($req.controls -join ', '), ($req.ksi -join ', '))
Write-Output "Evidence: $($s.outputRoot)/evidence/$($e.Record) ($($e.Result), sha256 $($e.Sha256.Substring(0, 12)))"
exit $(if ($check.Result -eq 'Pass') { 0 } else { 1 })
