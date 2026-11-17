#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 9: the device groups export against the response ladder, the attack disruption exclusions (approved,
    reviewed, every emergency access account excluded), and each device's sensor version against the minimum
    Contain User needs. Reads the files the operator exports from the Defender portal; calls nothing. Writes a
    run folder with a manifest.
.EXAMPLE
    ./Invoke-XdrAutomation.ps1 -SettingsPath tests/fixtures/settings.lab.json -OutputPath out/automation -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$DeviceGroupsPath,
    [string]$ExclusionsPath,
    [string]$DeviceStatePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrAutomationCheck -Settings $s -OutputPath $OutputPath -AsOf $AsOf -DeviceGroupsPath $DeviceGroupsPath -ExclusionsPath $ExclusionsPath -DeviceStatePath $DeviceStatePath
Show-XdrResult -Task automation -Result $r -OutputPath $OutputPath
