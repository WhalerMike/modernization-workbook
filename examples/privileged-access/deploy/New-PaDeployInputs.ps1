#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: write every earlier chapter's input files for one environment from its settings
    file, into <outputRoot>/inputs, with a manifest of their SHA-256. Refuses a settings file that
    holds a secret or an unfilled placeholder. Reads no tenant.
.EXAMPLE
    # The fictional test tenant, from examples/privileged-access.
    ./deploy/New-PaDeployInputs.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PaDeploy.psm1') -Force

$s = Read-PaDeploySettings -Path $SettingsPath
$findings = @(Test-PaDeploySettings -Settings $s)
$block = @($findings | Where-Object Severity -EQ 'Finding')
Write-Output "Settings: environment $($s.environment), change $($s.changeRecord), tenant $($s.tenantId), cloud $($s.cloud)"
Write-Output ("Settings check: {0} Finding" -f $block.Count)
foreach ($f in $findings) { Write-Output "  $($f.Rule) $($f.Object): $($f.Issue)" }
$cmd = Format-PaDeployCommand -Name $MyInvocation.MyCommand.Name -Parameters $PSBoundParameters
if ($block.Count) {
    $e = Write-PaEvidenceRecord -Settings $s -Step settings -Command $cmd -Result Fail -Reason "$($block.Count) Finding in the settings file"
    Write-Output "Evidence: $($e.Record) (Fail)"
    Write-Output 'Not written: fix every Finding in the settings file first'; exit 1
}
$inputs = "$($s.outputRoot)/inputs"
$r = New-PaDeployInputs -Settings $s -OutputPath $inputs
Write-Output ("Inputs written to {0}: {1} files ({2} role file(s), {3} PRV group(s), {4} review series); manifest.json lists each SHA-256" -f $inputs, $r.Files, $r.RoleFiles, $r.Groups, $r.Reviews)
$e = Write-PaEvidenceRecord -Settings $s -Step settings -Command $cmd -Result Pass -Reason "0 Finding in the settings file; $($r.Files) input files" -RunPath $inputs
Write-Output "Evidence: $($s.outputRoot)/evidence/$($e.Record) (Pass, sha256 $($e.Sha256.Substring(0, 12)))"
