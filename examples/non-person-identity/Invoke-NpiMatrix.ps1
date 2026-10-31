#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 03: the migration path matrix as code. Reads Chapter 01's register and Chapter 02's
    ownership run (both checked against their manifests), proposes a target for every identity from
    config/migration-matrix.json (N2.1), checks the application owners' dispositions (D-N3),
    sequences the waves with HIGH-risk accounts first and a rollback per wave (N2.2), checks the
    Workload ID Premium scope decision (D-N4) against the tenant's subscriptions, and reports
    Gate 2. Read only: two declared GETs (config/calls-ch03.json); nothing is written to the tenant.
.EXAMPLE
    # Lab 1: Chapters 01 and 02 against the fixtures, then this one, no sign-in.
    ./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -InputPath tests/fixtures/ch03/inputs -FixturePath tests/fixtures/estate.json -SkuFixturePath tests/fixtures/ch03/subscribed-skus.json -OutputPath out/matrix
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$OwnershipRun,
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$SkuFixturePath,
    [string]$MatrixPath,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiMatrix/NpiMatrix.psm1') -Force

$register = Import-NpiRegister -RunPath $RegisterRun
$tenantId = $register.Manifest.tenantId
if ($register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($register.Manifest.cloud)', not '$Cloud'." }
$ownership = Import-NpiOwnershipRun -RunPath $OwnershipRun -RegisterSha256 $register.Sha256
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($register.Manifest.asOf) { [datetime]::Parse($register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }
$config = if ($MatrixPath) { Import-NpiMatrixConfig -Path $MatrixPath } else { Import-NpiMatrixConfig }

if ($FixturePath) {
    if (-not $SkuFixturePath) { throw 'A fixture run needs -SkuFixturePath for the fake GET /subscribedSkus.' }
    $invoke = (New-NpiMatrixFixtureInvoker -Path $FixturePath -SkuPath $SkuFixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture'
} else { $invoke = New-NpiLiveInvoker -Cloud $Cloud -TenantId $tenantId -SkipAzure; $mode = 'Live' }
$reader = New-NpiMatrixReader -Cloud $Cloud -Invoke $invoke

$inputs = [ordered]@{
    workloads    = Join-Path $InputPath 'workloads.csv'
    dispositions = Join-Path $InputPath 'dispositions.csv'
    waves        = Join-Path $InputPath 'waves.csv'
    program      = Join-Path $InputPath 'program-dates.json'
    dn4          = Join-Path $InputPath 'workload-id-premium.json'
}
$proposals = Get-NpiMatrixProposal -Rows $register.Rows -Ownership $ownership -Config $config -Workloads (Import-NpiInput $inputs.workloads)
$decision = Test-NpiMigrationDecision -Reader $reader -Proposals $proposals -Config $config -AsOf $AsOf -Dispositions (Import-NpiInput $inputs.dispositions) -Waves (Import-NpiInput $inputs.waves) -ProgramDates (Import-NpiMatrixJson $inputs.program)
$wid = Get-NpiWorkloadIdScope -Reader $reader -Rows $register.Rows -Decisions $decision.Decisions -Config $config -Decision (Import-NpiMatrixJson $inputs.dn4)
$findings = @($decision.Findings) + @($wid.Findings)
$gate = Test-NpiGate2 -Findings $findings -Decisions $decision.Decisions

$inputHashes = [ordered]@{}; foreach ($k in $inputs.Keys) { if (Test-Path -LiteralPath $inputs[$k]) { $inputHashes[(Split-Path $inputs[$k] -Leaf)] = Get-NpiFileHash -Path $inputs[$k] } }
$null = Export-NpiMatrixRun -OutputPath $OutputPath -Cloud $Cloud -Mode $mode -TenantId $tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Evidence $reader.Evidence `
    -Extra @{ registerSha256 = $register.Sha256; ownership = $ownership.Sha256; matrixSha256 = $config.sha256; inputs = $inputHashes } -Files @{
    'proposals.json'           = @($proposals)
    'decisions.json'           = @($decision.Decisions)
    'waves.json'               = @($decision.Waves)
    'workload-id-premium.json' = $wid.Scope
    'findings.json'            = $findings
    'gate2.json'               = $gate
}

$inScope = @($proposals | Where-Object Scope -EQ 'Matrix')
$fs = @($findings)
Write-Output ("Matrix: {0} identities in scope, {1} proposed ({2}); {3} handed off, {4} to confirm first, {5} out of scope" -f $inScope.Count, @($inScope | Where-Object Proposed).Count, (($inScope | Where-Object Proposed | Group-Object Proposed | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '), @($proposals | Where-Object Scope -EQ 'HandedOff').Count, @($proposals | Where-Object Scope -EQ 'ConfirmFirst').Count, @($proposals | Where-Object Scope -EQ 'OutOfScope').Count)
Write-Output ("Dispositions: {0} decided of {1}; waves {2}" -f $gate.decided, $gate.inScope, ((@($decision.Waves) | ForEach-Object { "$($_.Wave) ($(@($_.Members).Count), $($_.High) HIGH)" }) -join ', '))
Write-Output ("Workload ID Premium (D-N4): {0}, {1} in scope; tenant holds {2} enabled units" -f $(if ($wid.Scope.decision) { $wid.Scope.decision } else { 'undecided' }), @($wid.Scope.scope).Count, $wid.Scope.tenant.enabledUnits)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count)
Write-Output ("Gate 2: {0}" -f $(if ($gate.met) { 'met' } else { 'not met (' + ((@($gate.criteria) | Where-Object { -not $_.met } | ForEach-Object { "$($_.criterion): $($_.open)" }) -join '; ') + ')' }))
