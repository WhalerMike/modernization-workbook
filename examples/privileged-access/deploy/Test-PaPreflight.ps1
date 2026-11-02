#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: the pre-flight checks before a stage writes anything: the settings file, licenses
    for PIM, Chapter 02's emergency access check, every Conditional Access policy in the tenant
    (in any state) and every policy file the stage deploys excluding the emergency accounts, and
    the synthetic administrator kept apart from them. Any Finding blocks the stage. Reads only;
    live, it refuses a Graph session signed in to another tenant.
.EXAMPLE
    # Fixture mode: the fictional test tenant, as of a fixed date.
    ./deploy/Test-PaPreflight.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -FixturePath deploy/tests/fixtures/tenant.json -AsOf 2026-11-02
.EXAMPLE
    # Live: sign in as the reader app first.
    Connect-MgGraph -Environment Global -TenantId <tenant-id> -ClientId <reader-app-id> -CertificateThumbprint <thumbprint>
    ./deploy/Test-PaPreflight.ps1 -SettingsPath environment.test.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$FixturePath,
    [datetime]$AsOf = [datetime]::UtcNow,
    [string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PaDeploy.psm1') -Force

$s = Read-PaDeploySettings -Path $SettingsPath
$inputs = "$($s.outputRoot)/inputs"
if (-not (Test-Path -LiteralPath (Join-Path $inputs 'manifest.json'))) { throw "No inputs in $inputs`: run ./deploy/New-PaDeployInputs.ps1 -SettingsPath $SettingsPath first" }
if (-not $OutputPath) { $OutputPath = "$($s.outputRoot)/preflight" }
if ($FixturePath) { $invoke = (New-PaDeployFixtureInvoker -Path $FixturePath -Cloud $s.cloud).Invoke; $mode = 'Fixture' }
else {
    $ctx = Get-MgContext
    if (-not $ctx -or $ctx.TenantId -ne $s.tenantId) { throw "The Graph session isn't signed in to tenant $($s.tenantId) from the settings file; refusing to read another tenant." }
    $invoke = New-PaDeployLiveInvoker -Cloud $s.cloud; $mode = 'Live'
}
$evidence = [Collections.Generic.List[object]]::new()
$findings = @(Test-PaDeployPreflight -Settings $s -InputsPath $inputs -Invoke $invoke -AsOf $AsOf -Evidence $evidence)
$null = Export-PaDeployRun -OutputPath $OutputPath -Step preflight -Settings $s -SettingsPath $SettingsPath -Mode $mode -Evidence $evidence -Files @{ 'findings.json' = @($findings) }

$block = @($findings | Where-Object Severity -EQ 'Finding')
Write-Output ("Pre-flight ({0}, {1}): {2} Finding, {3} Warn, {4} Info" -f $s.environment, $mode, $block.Count, @($findings | Where-Object Severity -EQ 'Warn').Count, @($findings | Where-Object Severity -EQ 'Info').Count)
foreach ($f in $findings) { Write-Output "  $($f.Severity.PadRight(7)) $($f.Rule) $($f.Object): $($f.Issue)" }
if ($block.Count) { Write-Output 'BLOCKED: fix every Finding, then run the pre-flight again. Nothing in this stage may run.' }
else { Write-Output 'PASS: the emergency access accounts are verified and excluded; the stage may start.' }
$cmd = Format-PaDeployCommand -Name $MyInvocation.MyCommand.Name -Parameters $PSBoundParameters
$e = Write-PaEvidenceRecord -Settings $s -Step preflight -Command $cmd -Result $(if ($block.Count) { 'Fail' } else { 'Pass' }) -Reason "$($block.Count) Finding" -RunPath $OutputPath -Mode $mode
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
Write-Output "Evidence: $($s.outputRoot)/evidence/$($e.Record) ($($e.Result), sha256 $($e.Sha256.Substring(0, 12)))"
exit $(if ($block.Count) { 1 } else { 0 })
