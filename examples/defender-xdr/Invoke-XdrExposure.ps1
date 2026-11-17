#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 5: high and critical vulnerabilities, exposed and internet-facing devices matched to owners, and the Security Exposure Management disposition for the tenant's cloud. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrExposure.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/exposure -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$OwnersPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrExposureCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf -OwnersPath $OwnersPath
Show-XdrResult -Task exposure -Result $r -OutputPath $OutputPath
