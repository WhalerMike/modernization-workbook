#Requires -Version 7.1
<#
.SYNOPSIS
    The smoke test after a stage, and its go/no-go: runs every area's checks on a fresh collection and the ring exit
    criteria for the settings' ring. Go only if no check fails and every exit criterion passes. Writes findings.json,
    ring-exit.json, verdict.json and a manifest. Reads files only. Exit code 1 on No-go.
.EXAMPLE
    ./deploy/Invoke-GsaSmokeTest.ps1 -SettingsPath tests/fixtures/settings.test.json -CollectionPath out/deploy-test/collect -InputsPath tests/fixtures/ring1/inputs -OutputPath out/deploy-test/smoke -AsOf 2026-11-30T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$CollectionPath,
    [Parameter(Mandatory)][string]$InputsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$areas = @('decision', 'baseline', 'client', 'traffic', 'compliant-network', 'tenant-restrictions', 'private-access', 'internet-access', 'tls', 'telemetry')
$tmp = Join-Path $OutputPath 'checks'
$f = @(Invoke-GsaChecks -Area $areas -CollectionPath $CollectionPath -InputsPath $InputsPath -Settings $s -OutputPath $tmp -AsOf $AsOf)
$c = Read-GsaCollection -Path $CollectionPath
$i = Read-GsaInputs -Path $InputsPath
$x = @(Test-GsaRingExit -Collection $c -Inputs $i -Settings $s -AsOf $AsOf)
$failed = @($f | Where-Object Status -EQ 'Fail')
$xf = @($x | Where-Object Status -EQ 'Fail')
$go = -not $failed.Count -and -not $xf.Count
Write-GsaJson -Path (Join-Path $OutputPath 'ring-exit.json') -Value $x
Write-GsaJson -Path (Join-Path $OutputPath 'verdict.json') -Value ([ordered]@{ ring = $s.ring; verdict = $(if ($go) { 'Go' } else { 'No-go' }); failedChecks = @($failed | ForEach-Object { "$($_.Id) $($_.Object)" }); failedCriteria = @($xf | ForEach-Object Criterion) })
$null = Write-GsaManifest -OutputPath $OutputPath -Task smoke -AsOf $AsOf -Mode 'Files' -Settings $s -Extra @{ failed = ($failed.Count + $xf.Count) }
Write-Host ("Checks: {0} run, {1} fail" -f $f.Count, $failed.Count)
foreach ($y in $failed) { Write-Host ('  {0,-11} {1}: {2}' -f $y.Id, $y.Object, $y.Detail) }
foreach ($y in $x) { Write-Host ('{0,-46} {1,-4}  {2}' -f $y.Criterion, $y.Status, $y.Detail) }
Write-Host ''
Write-Host ("Ring {0}: {1}. Written to {2}" -f $s.ring, $(if ($go) { 'Go' } else { 'No-go' }), $OutputPath)
if (-not $go) { exit 1 }
