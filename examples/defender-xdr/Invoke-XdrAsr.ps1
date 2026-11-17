#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 4: the ASR rule-by-ring matrix, each rule's readiness for its next stage (audit, warn, block), the OMA-URI value for each ring now and next, expired exclusions, and what each device enforces. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrAsr.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/asr -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$PlanPath,
    [string]$ExclusionsPath,
    [string]$DeviceStatePath,
    [string]$InventoryPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrAsrCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf -PlanPath $PlanPath -ExclusionsPath $ExclusionsPath -DeviceStatePath $DeviceStatePath -InventoryPath $InventoryPath
Show-XdrResult -Task asr -Result $r -OutputPath $OutputPath
