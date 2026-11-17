#Requires -Version 7.1
<#
.SYNOPSIS
    Reads a tenant's Global Secure Access configuration, read only: every call config/calls.json declares for the
    areas named (all by default), from fixtures (-FixturePath, Lab 1) or live through Microsoft Graph PowerShell and
    the Azure CLI (Lab 2). Writes collection.json, raw/<call>.json and a manifest with each call's permission and the
    SHA-256 of every file. This is also Learn's configuration backup: run it weekly and before every change.
.EXAMPLE
    ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z
.EXAMPLE
    # Live, in a delegated Graph session (Connect-MgGraph -Environment Global ...) and az login
    ./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -OutputPath out/test -AllowUnverified
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [ValidateSet('decision', 'baseline', 'client', 'traffic', 'compliant-network', 'tenant-restrictions', 'private-access', 'internet-access', 'tls', 'telemetry')][string[]]$Area,
    [switch]$AllowUnverified,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$inv = if ($FixturePath) { New-GsaFixtureInvoker -Path $FixturePath } else { New-GsaLiveInvoker -Settings $s -AllowUnverified:$AllowUnverified }
$p = @{ Invoker = $inv; Settings = $s; OutputPath = $OutputPath; AsOf = $AsOf }
if ($Area) { $p.Area = $Area }
$r = Invoke-GsaCollection @p
$m = Read-GsaJson -Path (Join-Path $OutputPath "manifest.json")
Write-Host ("Collected as of {0} ({1} mode, environment {2}, cloud {3}, ring {4})" -f $m.asOf, $m.mode, $m.environment, $m.cloud, $m.ring)
Write-Host ''
Write-Host ('{0,-24} {1,-7} {2,-5} {3,-9} {4}' -f 'Call', 'Method', 'Beta', 'Verified', 'Least-privileged permission')
foreach ($c in $m.calls) { Write-Host ('{0,-24} {1,-7} {2,-5} {3,-9} {4}' -f $c.id, $c.method, $c.beta, $c.verified, ($c.permissions -join '; ')) }
Write-Host ''
Write-Host ("{0} calls sent ({1} reads in all). Written to {2}: collection.json, raw/, manifest.json ({3} files hashed)" -f $m.calls.Count, $inv.Calls.Count, $OutputPath, $m.files.Count)
