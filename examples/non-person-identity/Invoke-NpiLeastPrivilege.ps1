#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 07: the permission sweep over Chapter 01's register. Reads every service principal's
    application permissions and delegated grants, its directory roles, and each managed identity's
    Azure role assignments; checks broad permissions against the reviewed list and its exceptions;
    hands privileged service principals to the Privileged Access plan; writes the quarterly owner
    review packet and, from the owners' decisions, a dry-run plan with its SHA-256. Read only: the
    plan is applied, after review, by Invoke-NpiLeastPrivilegeAction.ps1.
.EXAMPLE
    # Lab 1: Chapter 01's fixture run, then this one, no sign-in.
    ./Invoke-NpiLeastPrivilege.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch07/estate-ch07.json -InputPath tests/fixtures/ch07/inputs -OutputPath out/least-privilege
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [switch]$SkipAzure,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1') -Force

$register = Import-NpiLpRegister -RunPath $RegisterRun
$tenantId = $register.Manifest.tenantId
if ($register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($register.Manifest.cloud)', not '$Cloud'." }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($register.Manifest.asOf) { [datetime]::Parse($register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }

if ($FixturePath) { $invoke = (New-NpiLpFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-NpiLiveInvoker -Cloud $Cloud -TenantId $tenantId -SkipAzure:$SkipAzure; $mode = 'Live' }
$reader = New-NpiLpReader -Cloud $Cloud -Invoke $invoke

$inputs = [ordered]@{
    exceptions = Join-Path $InputPath 'permission-exceptions.csv'
    decisions  = Join-Path $InputPath 'owner-decisions.csv'
    scopes     = Join-Path $InputPath 'azure-scopes.csv'
}
$scopes = @(Import-NpiLpInput $inputs.scopes | ForEach-Object { $_.Scope })
$sweep = Get-NpiLpSweep -Reader $reader -Rows $register.Rows -AzureScopes $scopes -SkipAzure:$SkipAzure
$check = Test-NpiLeastPrivilege -Sweep $sweep -Exceptions (Import-NpiLpInput $inputs.exceptions) -AsOf $AsOf
$review = New-NpiLpOwnerReview -Check $check -Sweep $sweep -Decisions (Import-NpiLpInput $inputs.decisions) -AsOf $AsOf
$plan = New-NpiLpPlan -Check $check -Review $review -AsOf $AsOf -Cloud $Cloud -TenantId $tenantId -RegisterSha256 $register.Sha256

$inputHashes = [ordered]@{}; foreach ($k in $inputs.Keys) { if (Test-Path -LiteralPath $inputs[$k]) { $inputHashes[(Split-Path $inputs[$k] -Leaf)] = Get-NpiFileHash -Path $inputs[$k] } }
$null = Export-NpiLpRun -OutputPath $OutputPath -Task least-privilege -Cloud $Cloud -Mode $mode -TenantId $tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $reader.Evidence -Extra @{ registerSha256 = $register.Sha256; inputs = $inputHashes; azureScopes = $scopes } -Files @{
    'sweep.json'          = @($check.Grants)
    'identities.json'     = @($sweep.Identities)
    'skipped.json'        = @($sweep.Skipped)
    'findings.json'       = @($check.Findings)
    'pa-handoff.json'     = @($check.Handoff)
    'owner-review.csv'    = @($review.Rows)
    'review-status.json'  = $review.Status
    'lp-plan.json'        = $plan
}
$planHash = Get-NpiFileHash -Path (Join-Path $OutputPath 'lp-plan.json')
$writes = @($plan.actions | Where-Object Write)
$fs = @($check.Findings)
$kinds = @($check.Grants | Group-Object Kind | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '

Write-Output ("Sweep: {0} service principals, {1} grants ({2}); {3} skipped; {4} handed to the Privileged Access plan" -f @($sweep.Identities).Count, @($check.Grants).Count, $kinds, @($sweep.Skipped).Count, @($check.Handoff).Count)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count)
Write-Output ("Owner review {0}: {1} rows, {2} decided, {3} open, {4} changes pending; closed: {5}" -f $review.Status.Quarter, $review.Status.Rows, $review.Status.Decided, $review.Status.Open, $review.Status.ChangesPending, $review.Status.Closed)
Write-Output ("Plan: {0} actions, {1} of them writes ({2}); nothing sent" -f @($plan.actions).Count, $writes.Count, (($writes | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output "Plan SHA-256: $planHash"
