#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04: read the tenant's app management policies and each app registration's app instance
    lock, compare them with the reviewed file (config/app-management-policy.json), and write the
    diff, the findings and the policy plan with its SHA-256 for review. Read only: the plan is
    applied, after review, by Invoke-NpiCredentialAction.ps1.
.EXAMPLE
    # Lab 1: Chapter 01's fixture run, then this one, no sign-in.
    ./Invoke-NpiCredentialPolicy.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$ConfigPath = (Join-Path $PSScriptRoot 'config/app-management-policy.json'),
    [string]$FixturePath,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiCredentialPolicy/NpiCredentialPolicy.psm1') -Force

$register = Import-NpiCh04Register -RunPath $RegisterRun
$tenantId = $register.Manifest.tenantId
if ($register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($register.Manifest.cloud)', not '$Cloud'." }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($register.Manifest.asOf) { [datetime]::Parse($register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json -AsHashtable
$configSha = Get-NpiFileHash -Path $ConfigPath

if ($FixturePath) { $invoke = (New-NpiCh04FixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-NpiCh04LiveInvoker -Cloud $Cloud -TenantId $tenantId -SkipAzure; $mode = 'Live' }
$reader = New-NpiCh04Client -Cloud $Cloud -Task app-policy -Invoke $invoke -TenantId $tenantId

$state = Get-NpiAppPolicyState -Client $reader -Rows $register.Rows
$out = New-NpiPolicyPlan -State $state -Config $config -AsOf $AsOf -Cloud $Cloud -TenantId $tenantId -RegisterSha256 $register.Sha256 -ConfigSha256 $configSha

$null = Export-NpiCh04Run -OutputPath $OutputPath -Task app-policy -Cloud $Cloud -Mode $mode -TenantId $tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Evidence $reader.Evidence `
    -Extra @{ registerSha256 = $register.Sha256; configSha256 = $configSha; defaultPolicySha256 = $state.Sha256 } -Files @{
    'default-policy-before.json' = $state.Default
    'policy-diff.json'     = @($out.Diff)
    'policy-findings.json' = @($out.Findings)
    'policy-plan.json'     = $out.Plan
}
$planHash = Get-NpiFileHash -Path (Join-Path $OutputPath 'policy-plan.json')
$writes = @($out.Plan.actions | Where-Object Write)
$fs = @($out.Findings)
Write-Output ("Policy: tenant default {0}; {1} app management policies; {2} app registrations" -f $(if ($state.Default['isEnabled']) { 'enabled' } else { 'disabled' }), @($state.Policies).Count, @($state.Apps).Count)
Write-Output ("Diff: " + ((@($out.Diff) | Group-Object Change | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count)
Write-Output ("Policy plan: {0} actions, {1} of them writes ({2}); nothing sent" -f @($out.Plan.actions).Count, $writes.Count, (($writes | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output "Plan SHA-256: $planHash"
