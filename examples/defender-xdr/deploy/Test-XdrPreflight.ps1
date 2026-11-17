#Requires -Version 7.1
<#
.SYNOPSIS
    The pre-flight before a stage (PF-01 to PF-07): settings and inputs, the Graph module, the Graph session's
    cloud and tenant, its granted scopes, a first read, the output root, and in production the test stage's
    go/no-go. Reads only. Writes results.json and a manifest that Invoke-XdrEvidence.ps1 records; exits 1 when
    any check fails.
.EXAMPLE
    ./deploy/Test-XdrPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -Stage test -EnvironmentFixture deploy/tests/fixtures/environment-test.json -OutputPath out/test/preflight -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$EnvironmentFixture,
    [string]$TestEvidencePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'XdrDeploy.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$inv = if ($EnvironmentFixture) { Use-XdrDeployFixture -Path $EnvironmentFixture } else { New-XdrLiveInvoker -Settings $s -SkipContextCheck }
$rows = Invoke-XdrPreflight -Settings $s -Stage $Stage -Invoker $inv -TestEvidencePath $TestEvidencePath
$out = New-Item -ItemType Directory -Force -Path $OutputPath
Remove-Item -Recurse -Force (Join-Path $out '*') -ErrorAction SilentlyContinue
Write-XdrJson -Path (Join-Path $OutputPath 'results.json') -Value @($rows)
$fail = @($rows | Where-Object Status -EQ 'Fail').Count
$null = Write-XdrManifest -OutputPath $OutputPath -Task preflight -AsOf $AsOf -Mode $inv.Mode -Environment $s.environment -CallIds @($inv.Calls) -Extra @{ result = $(if ($fail) { 'Fail' } else { 'Pass' }); stage = $Stage }
foreach ($r in $rows) { Write-Host ('{0,-6} {1,-4}  {2}' -f $r.Id, $r.Status, $r.Detail) }
if ($fail) { exit 1 }
