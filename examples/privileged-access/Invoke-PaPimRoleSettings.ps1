#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04: PIM role settings for Microsoft Entra roles as code, one rollout wave at a time.
    The default is a dry run: it reads the tenant, writes plan.json, diff.csv, findings.json,
    before.json (the rules as they are, for the back-out) and a manifest, and changes nothing.
    -Apply sends the rule updates and eligibility requests in the plan; -Apply -Convert sends only
    the confirmed removals of standing assignments; -Apply -RestoreFrom <run folder> puts back the
    rules that run's before.json recorded and removes the eligibility it created.
.EXAMPLE
    # Lab 1: the fictional tenant, no sign-in, dry run of wave 1 (the pilot class).
    ./Invoke-PaPimRoleSettings.ps1 -Cloud gcc -Wave 1 -FixturePath tests/fixtures/ch04/tenant.json `
        -BindingsPath tests/fixtures/ch04/inputs/pim-bindings.json -EmergencyConfigPath tests/fixtures/inputs/emergency-access.json `
        -ExceptionsPath tests/fixtures/inputs/exceptions.csv -ConfirmedPath tests/fixtures/ch04/inputs/confirmed-activations.csv `
        -AsOf 2026-10-30 -OutputPath out/pim-wave1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][int]$Wave,
    [Parameter(Mandatory)][string]$BindingsPath,
    [Parameter(Mandatory)][string]$EmergencyConfigPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$RolesPath = (Join-Path $PSScriptRoot 'config/pim-ch04/roles'),
    [string]$TiersPath = (Join-Path $PSScriptRoot 'config/pim-ch04/tiers.json'),
    [string]$ExceptionsPath,
    [string]$ConfirmedPath,
    [string]$FixturePath,
    [string]$TenantId,
    [datetime]$AsOf = [datetime]::UtcNow,
    [switch]$Apply,
    [switch]$Convert,
    [switch]$ActivationGateChecked,
    [string]$RestoreFrom
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'powershell/PimEntraRoles/PimEntraRoles.psm1') -Force
if ($Convert -and -not $Apply) { throw '-Convert sends removals; use it with -Apply, after a dry run' }
if ($RestoreFrom -and ($Convert -or -not $Apply)) { throw '-RestoreFrom sends the back-out; use it with -Apply and without -Convert' }

$settings = @(Read-PaPimRoleSetting -Path $RolesPath)
$tiers = Read-PaPimTierConfig -Path $TiersPath
$binding = Read-PaPimBinding -Path $BindingsPath
$emergency = Read-PaEmergencyConfig -Path $EmergencyConfigPath
$exceptions = @(Import-PaExceptions -Path $ExceptionsPath)
$confirmed = if ($ConfirmedPath) { @(Import-Csv -LiteralPath $ConfirmedPath) } else { @() }
$waveRoles = Get-PaPimWaveRole -Settings $settings -Tiers $tiers -Wave $Wave

if ($FixturePath) { $fake = New-PaPimFixtureInvoker -Path $FixturePath -Cloud $Cloud; $invoke = $fake.Invoke; $mode = 'Fixture' }
else { $invoke = New-PaPimLiveInvoker -Cloud $Cloud; $mode = 'Live' }

$task = if (-not $Apply) { 'pim-plan' } elseif ($Convert) { 'pim-convert' } else { 'pim-apply' }
$client = New-PaPimClient -Cloud $Cloud -Task $task -Invoke $invoke -AllowWrite:$Apply
$state = Get-PaPimTenantState -Client $client -Settings $settings

if ($RestoreFrom) {
    $before = @(Get-Content -LiteralPath (Join-Path $RestoreFrom 'before.json') -Raw | ConvertFrom-Json -AsHashtable)
    $applied = @((Get-Content -LiteralPath (Join-Path $RestoreFrom 'plan.json') -Raw | ConvertFrom-Json -AsHashtable).actions | ForEach-Object { [pscustomobject]$_ })
    $plan = New-PaPimRestorePlan -Before $before -AppliedActions $applied -Cloud $Cloud
} else {
    $plan = New-PaPimPlan -Settings $settings -Binding $binding -Tiers $tiers -State $state -Wave $Wave -Emergency $emergency `
        -Exceptions $exceptions -Confirmed $confirmed -AsOf $AsOf -Cloud $Cloud
}

$files = @{
    'plan.json'     = [ordered]@{ wave = $plan.Wave; roles = $plan.Roles; blocked = $plan.Blocked; needsActivationGate = $plan.NeedsActivationGate; actions = @($plan.Actions) }
    'findings.json' = @($plan.Findings)
    'diff.csv'      = @($plan.Changes)
    'before.json'   = @(Get-PaPimBefore -State $state -Roles $waveRoles)
}
$sent = @()
if ($Apply) {
    $sent = Invoke-PaPimPlan -Plan $plan -Client $client -Kind $(if ($Convert) { 'Convert' } else { 'Settings' }) -ActivationGateChecked:$ActivationGateChecked
    # Read back and compare: the run's evidence is the tenant after the change, not the request.
    $after = Get-PaPimTenantState -Client $client -Settings $settings
    $files['verify.csv'] = @(foreach ($s in $waveRoles) { Compare-PaPimPolicy -Setting $s -Binding $binding -Policy $after.Policies[$s.roleTemplateId] })
}
$null = Export-PaPimRun -OutputPath $OutputPath -Task $task -Cloud $Cloud -Mode $mode -TenantId $TenantId -Evidence $client.Evidence -Files $files -Wave $Wave -Applied ([bool]$Apply)

$count = { param($k) @($plan.Actions | Where-Object Kind -EQ $k).Count }
if ($RestoreFrom) {
    Write-Output ("Back-out from {0}: {1} rule restores, {2} eligibility removals" -f $RestoreFrom, (& $count 'PatchRule'), (& $count 'RemoveEligibility'))
} else {
    Write-Output ("Wave {0} ({1} roles): {2} Finding, {3} Warn, {4} Info" -f $Wave, @($plan.Roles).Count, @($plan.Findings | Where-Object Severity -EQ 'Finding').Count, @($plan.Findings | Where-Object Severity -EQ 'Warn').Count, @($plan.Findings | Where-Object Severity -EQ 'Info').Count)
    Write-Output ("Plan: {0} rule updates, {1} eligibility requests, {2} standing assignments to convert ({3} confirmed)" -f (& $count 'PatchRule'), (& $count 'AssignEligibility'), (& $count 'RemoveStanding'), @($plan.Actions | Where-Object { $_.Kind -eq 'RemoveStanding' -and $_.Status -eq 'Confirmed' }).Count)
}
if ($plan.Blocked) { Write-Output 'Blocked: fix every Finding before -Apply' }
if (-not $Apply) { Write-Output 'Dry run: nothing was sent' }
else { Write-Output ("Applied: {0} requests sent; {1} differences from the role files after reading back" -f @($sent).Count, @($files['verify.csv']).Count) }
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
