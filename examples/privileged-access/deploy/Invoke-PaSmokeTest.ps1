#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: read the evidence for one smoke-test phase (Activate, Approve, Expire or Review)
    of the synthetic administrator's pilot role, and compare it with the expected result. The
    activation, the approval and the review decision are made by people, as the runbook says;
    this script only reads. Live, it refuses a Graph session in another tenant.
.EXAMPLE
    # Fixture mode: the Approve phase in the fictional test tenant.
    ./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -Phase Approve -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T14:30:00Z -FixturePath deploy/tests/fixtures/smoke-approve.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('Activate', 'Approve', 'Expire', 'Review')][string]$Phase,
    [Parameter(Mandatory)][datetime]$Since,
    [datetime]$AsOf = [datetime]::UtcNow,
    [string]$FixturePath,
    [string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PaDeploy.psm1') -Force

$s = Read-PaDeploySettings -Path $SettingsPath
if (-not $OutputPath) { $OutputPath = "$($s.outputRoot)/smoke-$($Phase.ToLowerInvariant())" }
if ($FixturePath) { $invoke = (New-PaDeployFixtureInvoker -Path $FixturePath -Cloud $s.cloud).Invoke; $mode = 'Fixture' }
else {
    $ctx = Get-MgContext
    if (-not $ctx -or $ctx.TenantId -ne $s.tenantId) { throw "The Graph session isn't signed in to tenant $($s.tenantId) from the settings file; refusing to read another tenant." }
    $invoke = New-PaDeployLiveInvoker -Cloud $s.cloud; $mode = 'Live'
}
$reader = New-PaDeployReader -Cloud $s.cloud -Task smoke -Invoke $invoke
$rows = @(Get-PaSmokeResult -Settings $s -Phase $Phase -Reader $reader -Since $Since -AsOf $AsOf)
$null = Export-PaDeployRun -OutputPath $OutputPath -Step "smoke-$($Phase.ToLowerInvariant())" -Settings $s -SettingsPath $SettingsPath -Mode $mode -Evidence $reader.Evidence -Files @{ 'results.json' = @($rows) }

foreach ($r in $rows) { Write-Output ("  {0} {1}: expected {2}; observed {3}" -f $(if ($r.Pass) { 'PASS' } else { 'FAIL' }), $r.Check, $r.Expected, $r.Observed) }
$passed = @($rows | Where-Object Pass).Count
Write-Output ("Smoke test {0} ({1}, {2}): {3} of {4} checks passed" -f $Phase, $s.environment, $mode, $passed, $rows.Count)
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
if ($passed -ne $rows.Count) { exit 1 }
