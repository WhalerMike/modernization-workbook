#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 05: check the PRV groups and their PIM for Groups schedules and policies against the
    reviewed desired state, and write the plan that would converge them. A dry run unless -Apply.
.DESCRIPTION
    Writes findings.json, plan.json, diff.txt and manifest.json to -OutputPath. Without -Apply
    nothing is sent to the tenant beyond the declared GETs. With -Apply, the plan's guards must all
    pass, and each request goes through a declared write call with its least-privileged permission.
.EXAMPLE
    # Lab 1: the fictional tenant, no sign-in, dry run.
    ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
        -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$DesiredPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$PolicyPath,
    [datetime]$AsOf = [datetime]::UtcNow,
    [int]$MaxRemovals = 5,
    [switch]$Apply,
    [string]$TenantId
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PimGroups/PimGroups.psm1') -Force

$task = if ($Apply) { 'pim-groups-apply' } else { 'pim-groups-read' }
$config = Read-PaPrvGroupConfig -Path $DesiredPath
$policy = if ($PolicyPath) { Get-PaPgPolicySetting -Path $PolicyPath } else { Get-PaPgPolicySetting }
if ($FixturePath) { $invoke = (New-PaPgFixtureInvoker -Path $FixturePath -Cloud $Cloud -Now $AsOf).Invoke; $mode = 'Fixture' }
else { $invoke = New-PaPgLiveInvoker -Cloud $Cloud; $mode = 'Live' }
$client = New-PaPgClient -Cloud $Cloud -Task $task -Invoke $invoke

$findings = @(Test-PaPrvGroupConfig -Config $config -PolicySetting $policy -AsOf $AsOf)
$state = Get-PaPgTenantState -Client $client -Config $config
$findings += @(Test-PaPgTenant -State $state -Config $config -PolicySetting $policy)
$plan = New-PaPimGroupPlan -State $state -Config $config -PolicySetting $policy -Cloud $Cloud -AsOf $AsOf

$applyClient = if ($Apply) { $client } else { New-PaPgClient -Cloud $Cloud -Task 'pim-groups-apply' -Invoke { throw 'A dry run sends nothing' } }
$run = Invoke-PaPgPlan -Plan $plan -Config $config -Client $applyClient -Apply:$Apply -MaxRemovals $MaxRemovals

$diff = @("# PIM for Groups plan, cloud $Cloud, $($plan.Operations.Count) change(s), $(if ($Apply) { 'applied' } else { 'dry run: nothing sent' })")
$diff += @($plan.Operations | ForEach-Object { $_.Diff })
$diff += @($run.Guards | ForEach-Object { "! guard $_" })
$files = @{ 'findings.json' = @($findings); 'plan.json' = $plan; 'diff.txt' = (($diff -join "`n") + "`n"); 'results.json' = @($run.Results) }
$null = Export-PaPgRun -OutputPath $OutputPath -Task $task -Cloud $Cloud -Mode $mode -TenantId $TenantId -Evidence $client.Evidence -Files $files

$count = { param($s) @($findings | Where-Object Severity -EQ $s).Count }
Write-Output ("PIM for Groups: {0} Finding, {1} Warn, {2} Info" -f (& $count 'Finding'), (& $count 'Warn'), (& $count 'Info'))
$byKind = $plan.Operations | Group-Object { $k = $_.Op.Split('-')[0]; if ($k -eq 'policy') { 'policy rule' } else { $k } } | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }
Write-Output ("Plan: {0} change(s){1}" -f $plan.Operations.Count, $(if ($byKind) { " ($($byKind -join ', '))" } else { '' }))
if ($run.Guards.Count) { Write-Output "Guards: $($run.Guards.Count) failed; -Apply would refuse (see diff.txt)" } else { Write-Output 'Guards: all passed' }
if ($Apply) { Write-Output ("Applied: {0} sent, {1} failed" -f @($run.Results | Where-Object Status -EQ 'Sent').Count, @($run.Results | Where-Object Status -Like 'Failed*').Count) }
else { Write-Output 'Dry run: nothing sent. Review diff.txt and plan.json, then rerun with -Apply' }
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
