#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: plan, and with -Apply carry out, the rollback of one stage from the run folders
    its commands wrote under the settings file's outputRoot. The order is the reverse of the
    deployment: access reviews, Azure resource roles, PIM for Groups, Microsoft Entra roles
    (standing assignments restored first), Conditional Access; the emergency access accounts are
    never rolled back. A dry run by default: it writes rollback-plan.json and sends nothing.
.EXAMPLE
    # Dry run over the fixture runs of the fictional test stage.
    ./deploy/Invoke-PaRollback.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -RunRoot deploy/tests/fixtures/runs
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$RunRoot,
    [string]$OutputPath,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PaDeploy.psm1') -Force

$s = Read-PaDeploySettings -Path $SettingsPath
if (-not $RunRoot) { $RunRoot = $s.outputRoot }
if (-not $OutputPath) { $OutputPath = "$($s.outputRoot)/rollback" }
$plan = New-PaRollbackPlan -Settings $s -RunRoot $RunRoot -OutputPath $OutputPath
foreach ($st in $plan.Steps) {
    Write-Output ("{0}. {1} [{2}] {3}" -f $st.Order, $st.Area, $st.Kind, $st.Summary)
    if ($st.Portal) { Write-Output "     Portal: $($st.Portal)" }
    if (@($st.Commands).Count) { Write-Output ("     {0} command(s) in rollback-plan.json" -f @($st.Commands).Count) }
}
$r = Invoke-PaRollbackPlan -Plan $plan -Apply:$Apply
Write-Output ("Rollback plan ({0}, {1}): {2} steps, {3} Automatic, {4} Manual, {5} Blocked" -f $s.environment, $s.changeRecord, $r.Steps, $r.Automatic, $r.Manual, $r.Blocked)
if ($Apply) { Write-Output "Applied: $($r.CommandsRun) command(s) run. Do the Manual steps, then run the pre-flight and Chapter 02's check again" }
else { Write-Output "Dry run: nothing was sent. Review $OutputPath/rollback-plan.json, then rerun with -Apply" }
