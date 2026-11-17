#Requires -Version 7.1
<#
.SYNOPSIS
    Reads this Windows device's Defender state, read-only: the Sense service, the onboarding state and sensor
    version, Get-MpComputerStatus, Get-MpPreference (network protection, controlled folder access, the ASR
    rules) and the firewall profiles as enforced. Writes <device>.json into -OutputPath, the folder the
    prevention, ASR and automation checks read. Run it on each sampled device, elevated, under the change
    record; copy the files to the run's device-state folder. Windows only.
.EXAMPLE
    ./Get-XdrDeviceState.ps1 -OutputPath <device-state-folder>
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$state = Get-XdrDeviceState
$file = Join-Path $OutputPath ("{0}.json" -f (Get-XdrShortName $state.deviceName))
Write-XdrJson -Path $file -Value $state
Write-Host ("{0}: sense {1}, onboarding state {2}, sensor {3}, tamper {4}, network protection {5}, controlled folder access {6}, {7} ASR rule(s)" -f $state.deviceName, $state.sense.status, $state.onboardingState, $state.senseVersion, $state.computerStatus.IsTamperProtected, $state.preference.EnableNetworkProtection, $state.preference.EnableControlledFolderAccess, @($state.preference.AttackSurfaceReductionRules_Ids).Count)
Write-Host "Written to $file"
