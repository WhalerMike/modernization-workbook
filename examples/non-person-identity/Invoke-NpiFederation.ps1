#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 05: workload identity federation and managed identities, wave by wave.
    Plan (the default): read the tenant for each reviewed conversion, check each federated
    credential against what the workload's issuer will present, run the token exchange test against
    the fake token endpoint, and write the plan, the findings, the conversion records and the
    parallel run status. Nothing is written to the tenant.
    Apply: the separate, delegated write path. A dry run unless -Apply; refuses a plan whose
    SHA-256 isn't the approved one.
.EXAMPLE
    # Lab 1: the plan against the fixture tenant (nothing leaves the machine).
    ./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation
.EXAMPLE
    # Lab 1: dry-run the reviewed plan, then apply it to the fake.
    ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 <sha256> -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-dryrun
#>
[CmdletBinding(DefaultParameterSetName = 'Plan')]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$OutputPath,
    [Parameter(Mandatory, ParameterSetName = 'Plan')][string]$ConversionsPath,
    [Parameter(Mandatory, ParameterSetName = 'Plan')][string]$CutoverLogPath,
    [Parameter(ParameterSetName = 'Plan')][string]$TenantId,
    [Parameter(Mandatory, ParameterSetName = 'Apply')][string]$PlanPath,
    [Parameter(Mandatory, ParameterSetName = 'Apply')][string]$ApprovedSha256,
    [Parameter(ParameterSetName = 'Apply')][switch]$Apply,
    [string]$FixturePath,
    [string]$Domain,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiFederation/NpiFederation.psm1') -Force
$utc = { param($s) [datetime]::Parse($s, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) }

if ($PSCmdlet.ParameterSetName -eq 'Plan') {
    $conv = Import-NpiWifConversions -Path $ConversionsPath
    $cut = Import-NpiWifCutoverLog -Path $CutoverLogPath
    if ($FixturePath) {
        $fake = New-NpiWifFake -Path $FixturePath -Cloud $Cloud
        if (-not $TenantId) { $TenantId = $fake.Estate.tenantId }
        if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = & $utc "$($fake.Estate.asOf)T12:00:00Z" }
        $invoke = $fake.Invoke; $adInvoke = $fake.AdInvoke; $mode = 'Fixture'
    } else {
        if (-not $TenantId) { throw 'A live run needs -TenantId.' }
        if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = [datetime]::UtcNow }
        $invoke = New-NpiWifLiveInvoker -Cloud $Cloud -TenantId $TenantId
        $needsAd = @($conv.Conversions | Where-Object { $_.legacy.kind -eq 'adAccount' }).Count -gt 0
        if ($needsAd -and -not $Domain) { throw 'The conversions name AD accounts; pass -Domain.' }
        $adInvoke = if ($needsAd) { New-NpiLiveAdInvoker -Server $Domain }
        $mode = 'Live'
    }
    if ($conv.Data.tenantId -and $conv.Data.tenantId -ne $TenantId) { throw "The conversion file is for tenant $($conv.Data.tenantId), not $TenantId." }
    $endpoint = New-NpiWifFakeTokenEndpoint -Cloud $Cloud -TenantId $TenantId -AsOf $AsOf
    $client = New-NpiWifClient -Cloud $Cloud -Task federation -TenantId $TenantId -Invoke $invoke -AdInvoke $adInvoke -TokenEndpoint $endpoint
    $r = New-NpiWifPlan -Client $client -Conversions $conv -CutoverLog $cut -AsOf $AsOf
    $null = Export-NpiWifRun -OutputPath $OutputPath -Task federation -Cloud $Cloud -TenantId $TenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Mode $mode -Evidence $client.Evidence.ToArray() `
        -Extra @{ conversionsSha256 = $conv.Sha256; cutoverLogSha256 = $cut.Sha256 } `
        -Files @{ 'plan.json' = $r.Plan; 'findings.json' = @($r.Findings); 'conversion-records.json' = @($r.Records); 'exchange-tests.json' = @($r.Tests) }
    $writes = @($r.Plan.actions | Where-Object Write)
    $sev = (@($r.Findings) | Group-Object Severity | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '
    Write-Output ("Conversions: {0} in {1} wave(s); token exchange tests: {2} passed, {3} failed" -f @($conv.Conversions).Count, @($conv.Conversions | ForEach-Object { $_.wave } | Sort-Object -Unique).Count, @($r.Tests | Where-Object Passed).Count, @($r.Tests | Where-Object { -not $_.Passed }).Count)
    Write-Output ("Findings: {0}" -f $(if ($sev) { $sev } else { 'none' }))
    Write-Output ("Plan: {0} actions, {1} of them writes ({2}); nothing sent" -f @($r.Plan.actions).Count, $writes.Count, ((@($writes) | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
    Write-Output ("Parallel runs: {0}" -f ((@($r.Records) | ForEach-Object { "$($_.ConversionId) $($_.ParallelRun.Status)" }) -join '; '))
    Write-Output ("Plan SHA-256: {0}" -f (Get-NpiFileHash -Path (Join-Path $OutputPath 'plan.json')))
    return
}

$plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($FixturePath) { ConvertTo-NpiWifDate (Format-NpiWifTime $plan.generated) } else { [datetime]::UtcNow } }
if ($FixturePath) {
    $fake = New-NpiWifFake -Path $FixturePath -Cloud $Cloud -AllowWrite
    $client = New-NpiWifClient -Cloud $Cloud -Task federation-apply -TenantId $plan.tenantId -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke
    $mode = 'Fixture'
} else {
    $mg = Get-MgContext
    if (-not $mg -or $mg.AuthType -ne 'Delegated') { throw 'federation-apply runs delegated only: sign in as a person with Cloud Application Administrator (or the application''s owner) and Managed Identity Contributor, not as an application.' }
    $needsAd = @($plan.actions | Where-Object { $_.Write -and $_.Call -eq 'ch05-ad-disable' }).Count -gt 0
    if ($needsAd -and -not $Domain) { throw 'The plan disables AD accounts; pass -Domain.' }
    $needsAzure = @($plan.actions | Where-Object { $_.Write -and $_.Call -like 'ch05-uami*' }).Count -gt 0
    $client = New-NpiWifClient -Cloud $Cloud -Task federation-apply -TenantId $plan.tenantId -Invoke (New-NpiWifLiveInvoker -Cloud $Cloud -TenantId $plan.tenantId -SkipAzure:(-not $needsAzure) -AllowWrite) `
        -AdInvoke $(if ($needsAd) { New-NpiLiveAdInvoker -Server $Domain -AllowWrite })
    $mode = 'Live'
}
$run = Invoke-NpiWifPlan -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -Client $client -AsOf $AsOf -Apply:$Apply
$null = Export-NpiWifRun -OutputPath $OutputPath -Task federation-apply -Cloud $Cloud -TenantId $plan.tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Mode "$mode-$($run.Mode)" `
    -Evidence $run.Evidence -Extra @{ planSha256 = $run.PlanSha256 } -Files @{ 'results.json' = @($run.Results) }
Write-Output ("{0}: {1}" -f $run.Mode, ((@($run.Results) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($x in $run.Results) { Write-Output ("  {0,-9} {1,-16} {2,-5} {3}" -f $x.Outcome, $x.Action, $x.Method, $x.Target) }
