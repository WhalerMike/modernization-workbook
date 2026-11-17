#Requires -Version 7.1
<#
.SYNOPSIS
    Publishes the custom detections a plan lists (Invoke-XdrDetections.ps1's plan.json) through the Microsoft
    Graph detectionRules API. Without -Apply, a dry run: it writes what it would send. With -Apply it needs
    -ApprovedSha256, the plan's SHA-256 as the reviewer approved it. Refuses a plan for another tenant or one
    made for the portal path. Writes results.json and a manifest.
.EXAMPLE
    ./deploy/Publish-XdrDetections.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -PlanPath out/test/2026-11/detections/plan.json -OutputPath out/test/publish -EnvironmentFixture deploy/tests/fixtures/environment-test.json -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$PlanPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [switch]$Apply,
    [string]$ApprovedSha256,
    [string]$EnvironmentFixture,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'XdrDeploy.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$inv = if ($EnvironmentFixture) { Use-XdrDeployFixture -Path $EnvironmentFixture } else { New-XdrLiveInvoker -Settings $s }
$cr = if ($s.Contains('changeRecord')) { "$($s.changeRecord)" } else { '' }
$r = Invoke-XdrPublish -Settings $s -Invoker $inv -PlanPath $PlanPath -OutputPath $OutputPath -AsOf $AsOf -Apply:$Apply -ApprovedSha256 $ApprovedSha256 -ChangeRecord $cr
$r.Results | ForEach-Object { [pscustomobject]@{ Rule = $_.ruleId; Action = $_.action; Method = $_.method; Status = $_.status } } | Format-Table -AutoSize | Write-XdrTable
Write-Host ("Plan {0}: {1}. Written to {2}: results.json, plan.json, manifest.json" -f $r.PlanSha256, $(if ($r.Applied) { 'applied' } else { 'dry run, nothing sent' }), $OutputPath)
