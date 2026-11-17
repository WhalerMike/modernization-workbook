#Requires -Version 7.1
<#
.SYNOPSIS
    The preflight before a stage, read only: the settings name this stage with every placeholder filled; the
    collection matches its manifest and this tenant; the emergency access group is excluded from every NET-
    Conditional Access policy; the network diagnostic setting exists; every function the desired state enables
    has an approved decision; and, in production, the test stage's evidence passes. Writes results.json and a
    manifest. Exit code 1 on any Fail.
.EXAMPLE
    ./deploy/Test-GsaPreflight.ps1 -SettingsPath tests/fixtures/settings.test.json -Stage test -CollectionPath out/deploy-test/collect -InputsPath tests/fixtures/ring1/inputs -DesiredPath config/desired.lab.json -OutputPath out/deploy-test/preflight -AsOf 2026-11-30T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$CollectionPath,
    [Parameter(Mandatory)][string]$InputsPath,
    [Parameter(Mandatory)][string]$DesiredPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$TestEvidencePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$r = @(Invoke-GsaPreflight -Settings $s -Stage $Stage -CollectionPath $CollectionPath -InputsPath $InputsPath -DesiredPath $DesiredPath -TestEvidencePath $TestEvidencePath)
if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
Write-GsaJson -Path (Join-Path $OutputPath 'results.json') -Value $r
$fail = @($r | Where-Object Status -EQ 'Fail').Count
$null = Write-GsaManifest -OutputPath $OutputPath -Task preflight -AsOf $AsOf -Mode 'Files' -Settings $s -Extra @{ stage = $Stage; failed = $fail }
foreach ($x in $r) { Write-Host ('{0,-6} {1,-4}  {2}' -f $x.Id, $x.Status, $x.Detail) }
Write-Host ''
Write-Host ("Preflight ({0}): {1} checks, {2} failed. Written to {3}" -f $Stage, $r.Count, $fail, $OutputPath)
if ($fail) { exit 1 }
