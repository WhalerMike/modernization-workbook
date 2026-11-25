#Requires -Version 7.1
<#
.SYNOPSIS
    The scheduled monthly run for test or production: preflight, the live baseline export, every check with
    drift against the last approved export, the metrics, each run recorded as evidence with the change record.
    Reads only. Workbook Ch 09.
.EXAMPLE
    ./deploy/Invoke-IpScheduledRun.ps1 -SettingsPath <settings-file> -RunRoot <run-folder> -EvidencePath <evidence-folder> -ChangeRecord <change-record>
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$RunRoot,
    [Parameter(Mandatory)][string]$EvidencePath,
    [Parameter(Mandatory)][string]$ChangeRecord,
    [string]$TestEvidencePath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
$o = @{}; if ($TestEvidencePath) { $o.TestEvidencePath = $TestEvidencePath }
$r = Invoke-IpScheduledRun -Settings $s -Runner (New-IpLiveRunner -Settings $s) -RunRoot $RunRoot -EvidencePath $EvidencePath -ChangeRecord $ChangeRecord -PreflightOverrides $o
Write-Host ("{0}: {1}. {2}" -f $r.Task, $r.Result, $r.Detail)
if ($r.Result -ne 'Pass') { exit 1 }
