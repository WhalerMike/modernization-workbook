#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 11: the smoke test with the synthetic service principal and service account. Reads the
    register run, then the tenant and the forest, and sends one write expected to fail: a new secret
    on the synthetic app, which the app management policy must refuse (if it isn't refused, the
    secret is removed at once and the check fails; its value is never kept). Writes results.json and a
    manifest. Exit code 1 on any Fail. A live run is a person, delegated; -FixturePath sends nothing.
.EXAMPLE
    ./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -RegisterRun tests/fixtures/deploy/register-run -ExpectCaState ReportOnly -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/deploy-test/smoke
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$OutputPath,
    [ValidateSet('ReportOnly', 'Enabled')][string]$ExpectCaState = 'ReportOnly',
    [string[]]$Wave,
    [int]$SignInHours = 24,
    [string]$FixturePath,
    [string]$Server,
    [datetime]$AsOf,
    [string]$EvidencePath,
    [switch]$SkipAd
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'NpiDeploy.psm1') -Force

$s = Read-NpiDeploySettings -Path $SettingsPath -Stage $Stage
if ($FixturePath) {
    $fake = New-NpiDeployFixtureInvoker -Path $FixturePath
    $invoke = $fake.Invoke; $adInvoke = $fake.AdInvoke; $mode = 'Fixture'
    if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = [datetime]::Parse($fake.Fixture.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) }
} else {
    $invoke = New-NpiDeployLiveInvoker -Cloud $s.cloud -TenantId $s.tenantId -Task deploy-smoke
    $adInvoke = if ($SkipAd) { $null } else { New-NpiDeployLiveAdInvoker -Server $(if ($Server) { $Server } else { $s.ad.server }) -Task deploy-smoke }
    $mode = 'Live'
    if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = [datetime]::UtcNow }
}
$client = New-NpiDeployClient -Cloud $s.cloud -Task deploy-smoke -Invoke $invoke -AdInvoke $adInvoke
$r = Invoke-NpiDeploySmokeTest -Client $client -Settings $s -RegisterRun $RegisterRun -ExpectCaState $ExpectCaState -Wave $Wave -AsOf $AsOf -SignInHours $SignInHours -SkipAd:$SkipAd
$null = Export-NpiDeployRun -OutputPath $OutputPath -Task deploy-smoke -Settings $s -Mode $mode -Evidence $client.Evidence.ToArray() -AsOf $AsOf.ToUniversalTime().ToString('o') `
    -Extra @{ expectCaState = $ExpectCaState; waves = @($Wave); registerRunManifestSha256 = (Get-NpiFileHash -Path (Join-Path $RegisterRun 'manifest.json')) } -Files @{ 'results.json' = @($r.Results) }
Write-NpiDeploySummary -Title "Smoke test ($mode, $Stage, Conditional Access expected $ExpectCaState$(if ($Wave) { " for $($Wave -join ', ')" }))" -Results $r.Results
if (-not $EvidencePath) { $EvidencePath = Join-Path (Split-Path -Parent $OutputPath) 'evidence' }
$e = Write-NpiDeployEvidence -EvidencePath $EvidencePath -Step SMOKE -Settings $s -Mode $mode -Command $MyInvocation.Line -Results $r.Results -RunPaths $OutputPath
Write-Output ("Evidence: {0} ({1})" -f $e.Name, (Get-Content $e.FullName -Raw | ConvertFrom-Json).result)
if (@($r.Results | Where-Object Status -EQ 'Fail').Count) { Write-Output 'Result: FAIL. Stop here and run the rollback.'; exit 1 }
Write-Output 'Result: PASS. File results.json and manifest.json with the change record.'
