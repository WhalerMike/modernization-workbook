#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10. Preflight for one environment's login migration: the settings are complete, the cloud is
    AzureCloud, the instance is Arc-eligibility Category 1, the mapping resolves every login, a break-glass
    path is in the exception registry, and (for production) the test stage's sealed evidence is in the chain.
.DESCRIPTION
    PF-01 settings, PF-02 cloud, PF-03 Category 1, PF-04 mapping, PF-05 break-glass, PF-06 a sealed, non-rehearsal
    test stage for this instance (production only), PF-07 sa (a warning: R05 remediates sa on its own track).
    Read-only; it can't see the deployer's rights, which Chapter 10 checks by hand. Exits 1 when any check
    fails, so a pipeline stops.
.PARAMETER SettingsPath
    The environment's settings JSON.
.PARAMETER OutputPath
    The folder for preflight.csv, preflight.json and manifest.json.
.EXAMPLE
    ./deploy/Test-SqlPreflight.ps1 -SettingsPath deploy/settings.test.example.json -OutputPath out/test/preflight
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/SqlIdentity/SqlIdentity.psd1') -Force
$s = Read-SqlJson $SettingsPath
$rows = [System.Collections.Generic.List[object]]::new()
$check = { param($id, $what, $ok, $detail) $rows.Add([pscustomobject]@{ Check = $id; What = $what; Result = if ($ok) { 'pass' } else { 'FAIL' }; Detail = $detail }) }
$missing = @('environment', 'cloud', 'instance', 'server', 'auditPath', 'arcPath', 'exceptionsPath', 'mappingPath', 'chainPath', 'breakGlassLogin', 'approver' |
    Where-Object { -not $s.$_ -or "$($s.$_)" -match '^<' })
& $check 'PF-01' 'Settings complete' (-not $missing.Count) $(if ($missing.Count) { 'missing: ' + ($missing -join ', ') } else { "$($s.environment): $($s.instance) on $($s.server)" })
& $check 'PF-02' 'Cloud' ($s.cloud -eq 'AzureCloud') "$($s.cloud) (a GCC Moderate tenant's Arc resources are in AzureCloud, WD-028)"
$audit = Read-SqlJson $s.auditPath
$inst = @($audit.instances | Where-Object { $_.name -eq $s.instance })
$cat = if ($inst.Count) { @(Get-SqlArcCategory -Audit ([pscustomobject]@{ instances = $inst }) -Arc (Read-SqlJson $s.arcPath))[0] } else { $null }
& $check 'PF-03' 'Arc-eligibility Category 1' ($cat -and $cat.Category -eq 1) $(if ($cat) { "Category $($cat.Category): $($cat.Next)" } else { "no instance $($s.instance) in the audit" })
$plan = if ($inst.Count) { New-SqlLoginPlan -Instance $inst[0] -Mapping (Import-Csv -LiteralPath $s.mappingPath) } else { $null }
& $check 'PF-04' 'Mapping resolves every login' ($plan -and -not $plan.Unresolved.Count) $(if ($plan) { "$($plan.Mapped) mapped; unresolved: $(if ($plan.Unresolved.Count) { $plan.Unresolved -join ', ' } else { 'none' })" } else { 'no plan' })
$exc = @((Read-SqlJson $s.exceptionsPath).exceptions | Where-Object { $_.login -eq $s.breakGlassLogin })
& $check 'PF-05' 'Break-glass path recorded' ($exc.Count -gt 0) "$($s.breakGlassLogin) $(if ($exc.Count) { 'is' } else { 'is not' }) in the exception registry"
if ($s.environment -eq 'production') {
    $sealed = if (Test-Path -LiteralPath $s.chainPath) { @(Get-Content -LiteralPath $s.chainPath | Where-Object { $_ } | ForEach-Object { $_ | ConvertFrom-Json } | Where-Object { $_.stage -eq 'test' -and $_.instance -eq $s.instance -and -not $_.rehearsal }) } else { @() }
    & $check 'PF-06' 'Test stage sealed' ($sealed.Count -gt 0) $(if ($sealed.Count) { "test record $($sealed[-1].recordSha256.Substring(0, 16))" } else { "no sealed (non-rehearsal) test-stage record for $($s.instance) in $($s.chainPath)" })
}
$saLogin = if ($inst.Count) { @($inst[0].logins | Where-Object { $_.isSa })[0] } else { $null }
$saOk = $saLogin -and $saLogin.isDisabled -and $saLogin.name -ne 'sa'
$rows.Add([pscustomobject]@{ Check = 'PF-07'; What = 'sa disabled and renamed'; Result = if ($saOk) { 'pass' } else { 'warn' }
    Detail = if ($saOk) { "sa is '$($saLogin.name)', disabled" } else { 'sa is still enabled or named sa: remediate it on its own track (Runbook R05), after another sysadmin can sign in' } })
Complete-SqlRun -Rows @($rows) -Name preflight -Step PRE -OutputPath $OutputPath -AsOf $audit.asOf -Show Check, What, Result, Detail
$failed = @($rows | Where-Object Result -eq 'FAIL').Count
Write-Host $(if ($failed) { "Preflight: $failed check(s) failed. Stop here." } else { 'Preflight: every check passed.' })
if ($failed) { exit 1 }
