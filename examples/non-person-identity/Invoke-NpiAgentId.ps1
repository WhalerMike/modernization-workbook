#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: read the AI agent identities and blueprints (or, where decision D-N6 says agent
    identities aren't available, the service principals the agents run as), check them against the
    program's rules, fill in the sponsor fields Chapter 02 recorded, and write the findings, the
    orphan candidates for Chapter 02's orphan rule, and a dry-run plan for the two agent
    Conditional Access policies with its SHA-256. Read only: the plan is applied, after review, by
    Invoke-NpiAgentCaAction.ps1.
.EXAMPLE
    # Lab 1: Chapters 01 and 02 against their fixtures, then this one, no sign-in.
    ./Invoke-NpiAgentId.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -FixturePath tests/fixtures/ch09/agent-estate.json -InputPath tests/fixtures/ch09/inputs -OutputPath out/agent-id
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$OwnershipRun,
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiAgentId/NpiAgentId.psm1') -Force

$runs = Import-NpiAgentRuns -RegisterRun $RegisterRun -OwnershipRun $OwnershipRun
if ($runs.Register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($runs.Register.Manifest.cloud)', not '$Cloud'." }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($runs.Register.Manifest.asOf) { [datetime]::Parse($runs.Register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }
$cap = Get-NpiAgentCapability -Cloud $Cloud
$inputs = Import-NpiAgentInputs -InputPath $InputPath

if ($FixturePath) { $invoke = (New-NpiAgentFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-NpiLiveInvoker -Cloud $Cloud -TenantId $runs.TenantId -SkipAzure; $mode = 'Live' }
$reader = New-NpiAgentReader -Cloud $Cloud -Invoke $invoke

$rules = (Get-NpiAgentConfig).Rules
$estate = Read-NpiAgentEstate -Reader $reader -Capability $cap -AsOf $AsOf -Inventory $inputs.Inventory -AuditLookbackDays $rules.auditLookbackDays
$result = Test-NpiAgentId -Reader $reader -Estate $estate -Inputs $inputs -Runs $runs -Capability $cap -AsOf $AsOf
$plan = New-NpiAgentCaPlan -Estate $estate -Cloud $Cloud -TenantId $runs.TenantId -AsOf $AsOf

$filled = @($runs.SponsorFields | Where-Object { $_.IdentityId -in @($result.Identities.IdentityId) })
$null = Export-NpiAgentRun -OutputPath $OutputPath -Task 'agent-id' -Cloud $Cloud -Mode $mode -TenantId $runs.TenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Evidence $reader.Evidence `
    -Extra @{ registerSha256 = $runs.Register.Sha256; sponsorFieldsSha256 = $runs.OwnershipSha256; inputs = $inputs.Hashes; decision = [ordered]@{ id = $cap.Decision; status = $cap.Status; mode = $cap.Mode } } -Files @{
    'ai-identities.json'     = @($result.Identities)
    'findings.json'          = @($result.Findings)
    'orphan-candidates.json' = @($result.OrphanCandidates)
    'agent-ca-plan.json'     = $plan
}
$planHash = Get-NpiFileHash -Path (Join-Path $OutputPath 'agent-ca-plan.json')
$fs = @($result.Findings)
Write-Output ("D-N6 ({0}): {1} mode in cloud '{2}'; agent Conditional Access {3}; agent risk {4}" -f $cap.Status, $cap.Mode, $Cloud, $cap.AgentConditionalAccess.stage, $cap.AgentRisk.stage)
Write-Output ("AI identities: {0} checked ({1}); Chapter 02 sponsor fields filled: {2} of {3}" -f @($result.Identities).Count, ((@($result.Identities) | Group-Object Type | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '), $filled.Count, @($runs.SponsorFields).Count)
Write-Output ("Findings: {0} Finding ({1} P1, {2} P2), {3} Warn, {4} Info. Orphan candidates for Chapter 02: {5}" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Priority -EQ 'P1').Count, @($fs | Where-Object Priority -EQ 'P2').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count, @($result.OrphanCandidates).Count)
Write-Output ("Agent CA plan: {0}; nothing sent" -f ((@($plan.actions) | ForEach-Object { "$($_.Kind) $($_.Action)" }) -join ', '))
Write-Output "Plan SHA-256: $planHash"
