#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 7: validates the detection repository, tests each rule against its validation windows, reads the deployed rules, and writes the deployment plan with its SHA-256 for deploy/Publish-XdrDetections.ps1. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrDetections.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/detections -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$RulesPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrDetectionCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf -RulesPath $RulesPath
Show-XdrResult -Task detections -Result $r -OutputPath $OutputPath
