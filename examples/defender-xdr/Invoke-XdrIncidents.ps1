#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 6: incidents from the last 30 days and every active one, with their alerts, read against the severity table. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrIncidents.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/incidents -AsOf 2026-11-16T12:00:00Z
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
$r = Invoke-XdrIncidentCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf
Show-XdrResult -Task incidents -Result $r -OutputPath $OutputPath
