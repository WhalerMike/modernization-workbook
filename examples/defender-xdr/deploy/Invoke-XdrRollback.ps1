#Requires -Version 7.1
<#
.SYNOPSIS
    Plans a stage's rollback (disable each custom detection the stage's publish runs created or enabled; each
    ASR ring's OMA-URI value as it was before the change), or, with -PlanPath, applies a reviewed plan's
    detection actions: a dry run without -Apply, and with -Apply only when -ApprovedSha256 is the plan's
    SHA-256. The ASR values stay for a person to put in the Intune policy. Writes a run folder with a manifest.
.EXAMPLE
    ./deploy/Invoke-XdrRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -PublishPath out/test/publish -AsrRunPath out/test/2026-11/asr -OutputPath out/test/rollback-plan -AsOf 2026-11-16T12:00:00Z
.EXAMPLE
    ./deploy/Invoke-XdrRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -PlanPath out/test/rollback-plan/plan.json -OutputPath out/test/rollback -EnvironmentFixture deploy/tests/fixtures/environment-test.json -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding(DefaultParameterSetName = 'Plan')]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [Parameter(ParameterSetName = 'Plan')][string[]]$PublishPath = @(),
    [Parameter(ParameterSetName = 'Plan')][string]$AsrRunPath,
    [Parameter(Mandatory, ParameterSetName = 'Apply')][string]$PlanPath,
    [Parameter(ParameterSetName = 'Apply')][switch]$Apply,
    [Parameter(ParameterSetName = 'Apply')][string]$ApprovedSha256,
    [Parameter(ParameterSetName = 'Apply')][string]$EnvironmentFixture,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'XdrDeploy.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
if ($PSCmdlet.ParameterSetName -eq 'Plan') {
    $p = New-XdrRollbackPlan -Settings $s -PublishPath $PublishPath -AsrRunPath $AsrRunPath -OutputPath $OutputPath -AsOf $AsOf
    @($p.Plan.actions) | ForEach-Object { [pscustomobject]@{ Rule = $_.ruleId; Action = $_.action; Request = "$($_.method) $($_.path)" } } | Format-Table -AutoSize | Out-Host
    Write-Host ("Rollback plan {0}: {1} detection(s) to disable; ASR values as they were for {2}." -f $p.PlanSha256, @($p.Plan.actions).Count, (@($p.Plan.asrRings) -join ', '))
    Write-Host "Written to ${OutputPath}: plan.json, plan.sha256, oma-uri/"
    return
}
$inv = if ($EnvironmentFixture) { Use-XdrDeployFixture -Path $EnvironmentFixture } else { New-XdrLiveInvoker -Settings $s }
$cr = if ($s.Contains('changeRecord')) { "$($s.changeRecord)" } else { '' }
$r = Invoke-XdrRollback -Settings $s -Invoker $inv -PlanPath $PlanPath -OutputPath $OutputPath -AsOf $AsOf -Apply:$Apply -ApprovedSha256 $ApprovedSha256 -ChangeRecord $cr
$r.Results | ForEach-Object { [pscustomobject]@{ Rule = $_.ruleId; Action = $_.action; Status = $_.status } } | Format-Table -AutoSize | Out-Host
Write-Host ("Rollback {0}: {1}. Written to {2}: results.json, plan.json, oma-uri/, manifest.json" -f $r.PlanSha256, $(if ($r.Applied) { 'applied' } else { 'dry run, nothing sent' }), $OutputPath)
