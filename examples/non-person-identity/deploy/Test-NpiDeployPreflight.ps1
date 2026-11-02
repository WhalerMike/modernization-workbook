#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 11: the preflight before a stage. Reads only. Checks the settings file, the deployment
    identity's credential, the licenses, the reader's permissions, the operators' roles, the objects
    the runbook touches, the VK-NPI baseline and (production) the test stage's evidence, and writes
    results.json, snapshot.json (what the rollback restores) and a manifest. Exit code 1 on any Fail.
    -FixturePath serves Graph and Active Directory from a file and sends nothing anywhere.
.EXAMPLE
    # Dry run against the fixture: nothing leaves the machine.
    ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -BaselinePath tests/fixtures/deploy/vk-baseline.json -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/deploy-test/preflight
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$BaselinePath,
    [string]$PromotionEvidencePath,
    [string]$FixturePath,
    [string]$Server,
    [switch]$SkipAd
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'NpiDeploy.psm1') -Force

$s = Read-NpiDeploySettings -Path $SettingsPath -Stage $Stage
if ($FixturePath) {
    $fake = New-NpiDeployFixtureInvoker -Path $FixturePath
    $invoke = $fake.Invoke; $adInvoke = $fake.AdInvoke; $mode = 'Fixture'
} else {
    $invoke = New-NpiDeployLiveInvoker -Cloud $s.cloud -TenantId $s.tenantId -Task deploy-preflight
    $adInvoke = if ($SkipAd) { $null } else { New-NpiDeployLiveAdInvoker -Server $(if ($Server) { $Server } else { $s.ad.server }) -Task deploy-preflight }
    $mode = 'Live'
}
$client = New-NpiDeployClient -Cloud $s.cloud -Task deploy-preflight -Invoke $invoke -AdInvoke $adInvoke
$r = Invoke-NpiDeployPreflight -Client $client -Settings $s -BaselinePath $BaselinePath -PromotionEvidencePath $PromotionEvidencePath -SkipAd:$SkipAd
$r.Snapshot.takenAt = if ($FixturePath) { $fake.Fixture.asOf } else { [DateTime]::UtcNow.ToString('o') }
$null = Export-NpiDeployRun -OutputPath $OutputPath -Task deploy-preflight -Settings $s -Mode $mode -Evidence $client.Evidence.ToArray() -AsOf $r.Snapshot.takenAt `
    -Files @{ 'results.json' = @($r.Results); 'snapshot.json' = $r.Snapshot }
Write-NpiDeploySummary -Title "Preflight ($mode, $Stage, $($s.changeRecord))" -Results $r.Results
if (@($r.Results | Where-Object Status -EQ 'Fail').Count) { Write-Output 'Result: NO-GO. Fix every Fail before the stage starts.'; exit 1 }
Write-Output 'Result: GO for this stage. File results.json, snapshot.json and manifest.json with the change record.'
