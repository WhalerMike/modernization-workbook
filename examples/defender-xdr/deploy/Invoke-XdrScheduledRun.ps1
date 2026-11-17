#Requires -Version 7.1
<#
.SYNOPSIS
    The stage's scheduled run: every check and the metrics under <outputRoot>/<RunName>, each run recorded in
    <outputRoot>/evidence with the settings' change record, and a scheduled-run record of its own. Reads only.
    Register it monthly in Task Scheduler or an Azure Automation schedule inside the boundary.
.EXAMPLE
    ./deploy/Invoke-XdrScheduledRun.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -RunName 2026-11 -EnvironmentFixture deploy/tests/fixtures/environment-test.json -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$RunName = ([DateTime]::UtcNow.ToString('yyyy-MM')),
    [string]$EnvironmentFixture,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'XdrDeploy.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$inv = if ($EnvironmentFixture) { Use-XdrDeployFixture -Path $EnvironmentFixture } else { New-XdrLiveInvoker -Settings $s }
$r = Invoke-XdrScheduledRun -Settings $s -Invoker $inv -RunName $RunName -AsOf $AsOf
$r.Rows | Format-Table Task, Result, Record, Detail -AutoSize -Wrap | Write-XdrTable
Write-Host ("Scheduled run {0}: {1} run(s) under outputRoot/{0}, recorded in outputRoot/evidence; the scheduled-run record is {2:d4}." -f $RunName, $r.Rows.Count, $r.Record)
