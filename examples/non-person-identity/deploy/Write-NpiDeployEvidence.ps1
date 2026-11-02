#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 11: records one runbook step's evidence. Copies the step's run folders (the ones the
    earlier chapters' scripts wrote) into the evidence folder under runs/<step>/, re-hashes every file
    their manifests list, and writes <step>-<title>.json: when, the environment, tenant and change
    record, the command, the result, and the SP 800-53 controls, other requirements and FedRAMP 20x
    KSIs the step supports (config/requirements-ch11.json). Then rewrites SHA256SUMS. Reads nothing
    from a tenant. Exit code 1 when a run folder doesn't match its manifest.
.EXAMPLE
    ./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -Step S1.1 -RunPath out/inventory, out/ownership -Command './Invoke-NpiInventory.ps1 ...; ./Invoke-NpiOwnership.ps1 ...' -EvidencePath out/deploy-test/evidence
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$Step,
    [Parameter(Mandatory)][string[]]$RunPath,
    [Parameter(Mandatory)][string]$EvidencePath,
    [string]$Command = '',
    [string]$Note = ''
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'NpiDeploy.psm1') -Force

$s = Read-NpiDeploySettings -Path $SettingsPath -Stage $Stage
$e = Write-NpiDeployEvidence -EvidencePath $EvidencePath -Step $Step -Settings $s -Mode 'Recorded' -Command $Command -RunPaths $RunPath -Note $Note
$rec = Get-Content -LiteralPath $e.FullName -Raw | ConvertFrom-Json
Write-Output ("Evidence: {0} ({1})" -f $e.Name, $rec.result)
Write-Output ("  Controls: {0}" -f (@($rec.controls) -join ', '))
if (@($rec.other).Count) { Write-Output ("  Also: {0}" -f (@($rec.other) -join '; ')) }
Write-Output ("  KSIs: {0}" -f (@($rec.ksis) -join ', '))
foreach ($r in @($rec.runs)) { Write-Output ("  {0}: {1}" -f $r.path, $r.detail) }
if ($rec.result -ne 'Pass') { exit 1 }
