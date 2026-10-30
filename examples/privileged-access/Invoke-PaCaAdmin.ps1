#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 03: Conditional Access for administrators and the PIM activation gate, from the reviewed
    files in ca-policies/. Runs the pre-merge check, compares the files with the tenant, and writes
    the plan. A dry run unless -Apply is given; a new policy is always created report-only, and
    enforcing one also needs -AllowEnforce. Nothing is deleted.
.EXAMPLE
    # The pre-merge check alone: files only, no tenant.
    ./Invoke-PaCaAdmin.ps1 -CheckOnly -MapPath tests/fixtures/ch03/tenant-map.json
.EXAMPLE
    # Lab 1: the plan against the fictional tenant, no sign-in, nothing sent.
    ./Invoke-PaCaAdmin.ps1 -Cloud gcc -MapPath tests/fixtures/ch03/tenant-map.json -FixturePath tests/fixtures/ch03/tenant.json -OutputPath out/ca
#>
[CmdletBinding()]
param(
    [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$MapPath,
    [string]$PolicyPath = (Join-Path $PSScriptRoot 'ca-policies'),
    [string]$OutputPath,
    [string]$FixturePath,
    [string]$TenantId,
    [switch]$CheckOnly,
    [switch]$Apply,
    [switch]$AllowEnforce
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PaConditionalAccess/PaConditionalAccess.psm1') -Force

$repo = Read-PaCaRepository -Path $PolicyPath -MapPath $MapPath
$findings = @(Test-PaCaRepository -Repository $repo)
$count = { param($s) @($findings | Where-Object Severity -EQ $s).Count }
Write-Output ('Pre-merge check: {0} Finding, {1} Warn, {2} Info' -f (& $count 'Finding'), (& $count 'Warn'), (& $count 'Info'))
if ($CheckOnly) {
    $findings | Where-Object Severity -EQ 'Finding' | ForEach-Object { Write-Output "  $($_.Rule) $($_.File): $($_.Message)" }
    if ((& $count 'Finding') -gt 0) { exit 1 }
    return
}
if (-not $Cloud) { throw 'Name the cloud with -Cloud (global, gcc, gcchigh or dod). There is no default.' }
if (-not $OutputPath) { throw 'Name an -OutputPath for the plan and its manifest.' }

if ($FixturePath) { $invoke = (New-PaCaFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-PaCaLiveInvoker -Cloud $Cloud -AllowWrite:$Apply; $mode = 'Live' }
$client = New-PaCaClient -Cloud $Cloud -Invoke $invoke -Apply:$Apply
$tenant = Get-PaCaTenant -Client $client
$plan = @(Get-PaCaPlan -Repository $repo -Tenant $tenant -AllowEnforce:$AllowEnforce)
$requests = @(Invoke-PaCaPlan -Client $client -Plan $plan -Findings $findings -EmergencyGroupId $repo.EmergencyGroupId -ReportOnlyInstrument $repo.ReportOnlyInstruments)

$null = Export-PaCaRun -OutputPath $OutputPath -Cloud $Cloud -Task $client.Task -Mode $(if ($Apply) { "$mode-Apply" } else { "$mode-DryRun" }) -TenantId $TenantId -Evidence $client.Evidence `
    -Files @{ 'findings.json' = $findings; 'plan.json' = @($plan | Select-Object Kind, Name, Action, Changes, Note); 'requests.json' = $requests }

$summary = ($plan | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '
Write-Output "Plan: $summary"
if ($Apply) { Write-Output "Applied: $(@($requests | Where-Object Sent).Count) request(s) sent" }
else { Write-Output "Dry run: $($requests.Count) request(s) written to requests.json, none sent; rerun with -Apply to send them" }
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
