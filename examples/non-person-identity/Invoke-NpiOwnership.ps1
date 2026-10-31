#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 02: check every identity in Chapter 01's register against the ownership rule, report
    the findings, record the AI sponsor fields for Chapter 09, and write the orphan rule as a
    dry-run plan with its SHA-256 for review. Read only: the plan is applied, after review, by
    Invoke-NpiOrphanAction.ps1.
.EXAMPLE
    # Lab 1: Chapter 01's fixture run, then this one, no sign-in.
    ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiOwnership/NpiOwnership.psm1') -Force

$register = Import-NpiRegister -RunPath $RegisterRun
$tenantId = $register.Manifest.tenantId
if ($register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($register.Manifest.cloud)', not '$Cloud'." }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($register.Manifest.asOf) { [datetime]::Parse($register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }

if ($FixturePath) { $invoke = (New-NpiFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-NpiLiveInvoker -Cloud $Cloud -TenantId $tenantId -SkipAzure; $mode = 'Live' }
$reader = New-NpiReader -Cloud $Cloud -Task ownership -Invoke $invoke

$inputs = @{
    owners        = Join-Path $InputPath 'application-owners.csv'
    records       = Join-Path $InputPath 'service-records.csv'
    confirmations = Join-Path $InputPath 'igo-confirmations.csv'
    claims        = Join-Path $InputPath 'owner-claims.csv'
}
$own = Test-NpiOwnership -Reader $reader -Rows $register.Rows -ApplicationOwners (Import-NpiInput $inputs.owners) -ServiceRecords (Import-NpiInput $inputs.records)
$plan = New-NpiOrphanPlan -Reader $reader -Ownership $own -Rows $register.Rows -AsOf $AsOf -Cloud $Cloud -TenantId $tenantId -RegisterSha256 $register.Sha256 `
    -Confirmations (Import-NpiInput $inputs.confirmations) -Claims (Import-NpiInput $inputs.claims)

$inputHashes = [ordered]@{}; foreach ($k in ($inputs.Keys | Sort-Object)) { if (Test-Path -LiteralPath $inputs[$k]) { $inputHashes[(Split-Path $inputs[$k] -Leaf)] = Get-NpiFileHash -Path $inputs[$k] } }
$null = Export-NpiRun -OutputPath $OutputPath -Task ownership -Cloud $Cloud -Mode $mode -TenantId $tenantId -Domain $register.Manifest.domain -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $reader.Evidence -Extra @{ registerSha256 = $register.Sha256; inputs = $inputHashes } -Files @{
    'ownership.json'         = @($own.Identities)
    'findings.json'          = @($own.Findings)
    'ai-sponsor-fields.json' = @($own.AiSponsorFields)
    'orphan-plan.json'       = $plan
}
$planHash = Get-NpiFileHash -Path (Join-Path $OutputPath 'orphan-plan.json')
$writes = @($plan.actions | Where-Object Write)

$fs = @($own.Findings)
Write-Output ("Ownership: {0} identities checked; {1} orphan candidates" -f @($own.Identities).Count, @($own.Identities | Where-Object OrphanCandidate).Count)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info. AI sponsor fields recorded for Chapter 09: {3}" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count, @($own.AiSponsorFields).Count)
Write-Output ("Orphan plan: {0} actions, {1} of them writes ({2}); nothing sent" -f @($plan.actions).Count, $writes.Count, (($writes | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output "Plan SHA-256: $planHash"
