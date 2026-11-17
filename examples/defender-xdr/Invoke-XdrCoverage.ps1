#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 2: runs the guide's coverage query and its per-device form, and joins the devices with the CM-8 inventory and the exception register. Every device not protected and not excepted is a ticket. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrCoverage.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/coverage -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$InventoryPath,
    [string]$ExceptionsPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrCoverageCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf -InventoryPath $InventoryPath -ExceptionsPath $ExceptionsPath
Show-XdrResult -Task coverage -Result $r -OutputPath $OutputPath
