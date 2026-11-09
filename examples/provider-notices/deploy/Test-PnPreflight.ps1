#Requires -Version 7.1
<#
.SYNOPSIS
    The preflight before a stage. Reads only: the settings and routing files, each enabled provider's tool,
    the signed-in cloud, the reader's first call (for AWS also the support plan), the named notice contacts,
    the output root and, in production, the test stage's evidence. Writes results.json and a manifest.
    Exit code 1 on any Fail. -FixturePath serves the tools, sessions and reads from a file; nothing is sent.
.EXAMPLE
    # Dry run against the fixture: nothing leaves the machine.
    ./deploy/Test-PnPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -Stage test -FixturePath deploy/tests/fixtures/environment-test.json -OutputPath out/deploy-test/preflight -AsOf 2026-11-09T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$TestEvidencePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PnDeploy.psm1') -Force

$s = Read-PnSettings -Path $SettingsPath
$inv = if ($FixturePath) { Use-PnDeployFixture -Path $FixturePath } else { New-PnLiveInvoker -Settings $s -SkipContextCheck }
$results = @(Invoke-PnPreflight -Settings $s -Stage $Stage -Invoker $inv -TestEvidencePath $TestEvidencePath)
Write-PnDeployRun -OutputPath $OutputPath -Task preflight -Results $results -Settings $s -Mode $inv.Mode -AsOf $AsOf -CallIds @($inv.Calls)
foreach ($r in $results) { Write-Host ('{0,-15} {1,-4}  {2}' -f $r.Id, $r.Status, $r.Detail) }
$fail = @($results | Where-Object Status -EQ 'Fail').Count
Write-Host ''
Write-Host ("Preflight ({0}): {1} checks, {2} failed. Written to {3}" -f $Stage, $results.Count, $fail, $OutputPath)
if ($fail) { exit 1 }
