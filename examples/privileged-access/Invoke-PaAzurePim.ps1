#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 06: PIM for Azure resources as code. Read the role assignment and eligibility schedules
    and the role management policies at each scope in the desired state, compare, find standing
    Owner, Contributor and User Access Administrator, and write the plan, its diff and its findings
    with a manifest. A dry run unless -Apply is given; with -Apply it sends the plan in order, reads
    the estate again and reports what is left to change.
.EXAMPLE
    # Lab 1: the fictional estate, no sign-in, nothing sent.
    ./Invoke-PaAzurePim.ps1 -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `
        -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06 -RunId lab
.EXAMPLE
    # Live, GCC with commercial Azure: dry run first, as an identity with Reader on every scope.
    Connect-AzAccount -Environment AzureCloud
    ./Invoke-PaAzurePim.ps1 -Cloud gcc -DesiredPath desired.json -CallerPrincipalId <object-id> -OutputPath out/ch06-dry
    # Then, after the plan is reviewed, as an identity with User Access Administrator on every scope:
    ./Invoke-PaAzurePim.ps1 -Cloud gcc -DesiredPath desired.json -CallerPrincipalId <object-id> -OutputPath out/ch06-apply -Apply
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$DesiredPath,
    [Parameter(Mandatory)][string]$CallerPrincipalId,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$RunId = ([DateTime]::UtcNow.ToString('yyyyMMdd')),
    [string]$TenantId,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PaAzurePim/PaAzurePim.psm1') -Force

$desired = Read-PaAzDesiredState -Path $DesiredPath
if ($desired.ContainsKey('cloud') -and $desired.cloud -ne $Cloud) { throw "The desired state is for '$($desired.cloud)', not '$Cloud'." }
$map = Get-PaAzTierMap -Desired $desired

if ($FixturePath) { $invoke = (New-PaAzFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-PaAzLiveInvoker -Cloud $Cloud; $mode = 'Live' }
$task = if ($Apply) { 'azure-pim-apply' } else { 'azure-pim-read' }
$client = New-PaAzClient -Cloud $Cloud -Task $task -Invoke $invoke

$state = Get-PaAzPimState -Client $client -Scope $desired.scopes -RoleId $desired.governedRoles -TierMap $map
$plan = New-PaAzPlan -State $state -Desired $desired -CallerPrincipalId $CallerPrincipalId -RunId $RunId -TierMap $map
$requests = @(Invoke-PaAzPlan -Plan $plan -Client $client -Apply:$Apply)

$files = @{
    'state.json'    = [ordered]@{ assignments = @($state.Assignments); eligibilities = @($state.Eligibilities); policies = @($state.Policies | ForEach-Object { [ordered]@{ scope = $_.Scope; roleId = $_.RoleId; name = $_.Name; rules = @($_.Rules) } }) }
    'plan.json'     = @($requests | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; uri = $_.Uri; body = $_.Body; sent = $_.Sent } })
    'diff.txt'      = @($plan.Diff)
    'findings.json' = @($plan.Findings)
}
$after = $null
if ($Apply) {
    $after = New-PaAzPlan -State (Get-PaAzPimState -Client $client -Scope $desired.scopes -RoleId $desired.governedRoles -TierMap $map) -Desired $desired -CallerPrincipalId $CallerPrincipalId -RunId $RunId -TierMap $map
    $files['diff-after.txt'] = @($after.Diff)
}
$null = Export-PaAzRun -OutputPath $OutputPath -Files $files -Client $client -Mode $mode -Applied:$Apply.IsPresent -TenantId $TenantId

$s = $plan.Summary
Write-Output ("Read: {0} assignment and {1} eligibility schedules, {2} policies at {3} scopes" -f @($state.Assignments).Count, @($state.Eligibilities).Count, @($state.Policies).Count, @($desired.scopes).Count)
Write-Output ("Plan: {0} policy updates, {1} eligible assignments to add, {2} standing assignments to remove" -f $s.PolicyUpdate, $s.EligibilityAdd, $s.ActiveRemove)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($plan.Findings | Where-Object Severity -EQ 'Finding').Count, @($plan.Findings | Where-Object Severity -EQ 'Warn').Count, @($plan.Findings | Where-Object Severity -EQ 'Info').Count)
if ($Apply) {
    Write-Output ("Applied: {0} requests sent; left to change after a fresh read: {1}" -f @($requests | Where-Object Sent).Count, @($after.Operations).Count)
} else {
    Write-Output ("Dry run: {0} requests written to plan.json, none sent. Review diff.txt, then rerun with -Apply." -f $requests.Count)
}
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
