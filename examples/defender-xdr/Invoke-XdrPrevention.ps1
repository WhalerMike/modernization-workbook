#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 3: compares each device's state with the stage its ring is at for network protection and controlled folder access, with tamper and real-time protection, active mode and the firewall profiles; and reads the fleet's audit and block events. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrPrevention.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/prevention -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$DeviceStatePath,
    [string]$PlanPath,
    [string]$InventoryPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrPreventionCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf -DeviceStatePath $DeviceStatePath -PlanPath $PlanPath -InventoryPath $InventoryPath
Show-XdrResult -Task prevention -Result $r -OutputPath $OutputPath
