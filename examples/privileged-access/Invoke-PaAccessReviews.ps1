#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 07: access reviews of privileged roles as code.

    -Mode Plan     reads the tenant (GET only), checks the reviewed JSON and writes the dry run:
                   plan.json, one body per series under bodies/, findings.json and a manifest.
                   With -Apply it then creates and updates the series the plan lists, and refuses
                   if the plan has any Finding. Azure role series (preview API) also need
                   -IncludePreview. Nothing is ever deleted.
    -Mode Evidence reads every configured series, its instances and decisions (GET only) and writes
                   decisions.csv, instances.json, findings.json and a manifest for the ISSO.

    -Cloud has no default: name global, gcc, gcchigh or dod.
.EXAMPLE
    # Lab 1: the fictional tenant, no sign-in.
    ./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Plan -ConfigPath tests/fixtures/ch07/access-reviews.json `
        -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-plan
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][ValidateSet('Plan', 'Evidence')][string]$Mode,
    [Parameter(Mandatory)][string]$ConfigPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [datetime]$AsOf = [datetime]::UtcNow,
    [switch]$Apply,
    [switch]$IncludePreview,
    [switch]$SkipAzure,
    [string]$TenantId
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PaAccessReviews/PaAccessReviews.psm1') -Force
if ($Apply -and $Mode -ne 'Plan') { throw '-Apply goes with -Mode Plan' }

$config = Read-PaArConfig -Path $ConfigPath
if ($SkipAzure) { $config.reviews = @($config.reviews | Where-Object { $_.kind -ne 'azureRole' }) }
$task = if ($Mode -eq 'Evidence') { 'access-reviews-evidence' } elseif ($Apply) { 'access-reviews-apply' } else { 'access-reviews-plan' }
if ($FixturePath) { $fake = New-PaArFake -Path $FixturePath -Cloud $Cloud; $invoke = $fake.Invoke; $runMode = 'Fixture' }
else { $invoke = New-PaArLiveInvoker -Cloud $Cloud -AllowWrite:$Apply -SkipAzure:$SkipAzure; $runMode = 'Live' }
$client = New-PaArClient -Cloud $Cloud -Task $task -Invoke $invoke

if ($Mode -eq 'Plan') {
    $plan = Get-PaArPlan -Client $client -Config $config -AsOf $AsOf
    $results = Invoke-PaArApply -Client $client -Plan $plan -Apply:$Apply -IncludePreview:$IncludePreview
    $files = @{
        'plan.json'     = @($plan.Items | ForEach-Object { [ordered]@{ name = $_.Name; api = $_.Api; action = $_.Action; id = $_.Id; changes = @($_.Changes) } })
        'findings.json' = @($plan.Findings)
        'results.json'  = @($results)
    }
    foreach ($i in $plan.Items | Where-Object Body) { $files["bodies/$($i.Name).json"] = $i.Body }
    $null = Export-PaArRun -OutputPath $OutputPath -Task $task -Cloud $Cloud -Mode $runMode -TenantId $TenantId -Evidence $client.Evidence -Files $files
    $count = { param($a) @($plan.Items | Where-Object Action -EQ $a).Count }
    Write-Output ("Plan: {0} Create, {1} Update, {2} Replace, {3} NoChange, {4} Unmanaged" -f (& $count 'Create'), (& $count 'Update'), (& $count 'Replace'), (& $count 'NoChange'), (& $count 'Unmanaged'))
    Write-Output ("Checks: {0} Finding, {1} Warn, {2} Info" -f @($plan.Findings | Where-Object Severity -EQ 'Finding').Count, @($plan.Findings | Where-Object Severity -EQ 'Warn').Count, @($plan.Findings | Where-Object Severity -EQ 'Info').Count)
    $sent = @($results | Where-Object Result -EQ 'Sent').Count
    if ($Apply) { Write-Output "Applied: $sent write(s) sent; Replace and Unmanaged series are left for a person" }
    else { Write-Output "Dry run: nothing sent ($(@($results | Where-Object Result -EQ 'DryRun').Count) write(s) would be sent with -Apply)" }
} else {
    $ev = Get-PaArEvidence -Client $client -Config $config -AsOf $AsOf
    $files = @{ 'decisions.csv' = @($ev.Rows); 'instances.json' = @($ev.Instances); 'findings.json' = @($ev.Findings) }
    $null = Export-PaArRun -OutputPath $OutputPath -Task $task -Cloud $Cloud -Mode $runMode -TenantId $TenantId -Evidence $client.Evidence -Files $files
    Write-Output ("Evidence: {0} decisions in {1} instances; {2} Finding, {3} Warn" -f $ev.Rows.Count, $ev.Instances.Count, @($ev.Findings | Where-Object Severity -EQ 'Finding').Count, @($ev.Findings | Where-Object Severity -EQ 'Warn').Count)
}
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
