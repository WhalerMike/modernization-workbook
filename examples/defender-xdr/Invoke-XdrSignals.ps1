#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 8: the guide's cross-source query as a priority list, with emergency access accounts flagged. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrSignals.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/signals -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrSignalsCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf
Show-XdrResult -Task signals -Result $r -OutputPath $OutputPath
