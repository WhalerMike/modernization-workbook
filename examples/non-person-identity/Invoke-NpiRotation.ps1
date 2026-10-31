#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04: for every app registration in Chapter 01's register, read its credentials and its
    Key Vault certificate, and write the rotation plan (raise, approve, renew in Key Vault, attach,
    verify, overlap, remove the old one), the requests for owners and the findings, with the plan's
    SHA-256 for review. Read only: the plan is applied, after review, by Invoke-NpiCredentialAction.ps1.
.EXAMPLE
    ./Invoke-NpiRotation.ps1 -Cloud gcc -RegisterRun out/inventory -InputPath tests/fixtures/ch04/inputs -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$ConfigPath = (Join-Path $PSScriptRoot 'config/rotation.json'),
    [string]$PolicyPath = (Join-Path $PSScriptRoot 'config/app-management-policy.json'),
    [string]$FixturePath,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiCredentialPolicy/NpiCredentialPolicy.psm1') -Force

$register = Import-NpiCh04Register -RunPath $RegisterRun
$tenantId = $register.Manifest.tenantId
if ($register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($register.Manifest.cloud)', not '$Cloud'." }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($register.Manifest.asOf) { [datetime]::Parse($register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json -AsHashtable
$policy = Get-Content -LiteralPath $PolicyPath -Raw | ConvertFrom-Json -AsHashtable

if ($FixturePath) { $invoke = (New-NpiCh04FixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke; $mode = 'Fixture' }
else { $invoke = New-NpiCh04LiveInvoker -Cloud $Cloud -TenantId $tenantId; $mode = 'Live' }
$reader = New-NpiCh04Client -Cloud $Cloud -Task rotation -Invoke $invoke -TenantId $tenantId

$inputs = [ordered]@{
    'certificate-bindings.csv'   = Join-Path $InputPath 'certificate-bindings.csv'
    'rotation-approvals.csv'     = Join-Path $InputPath 'rotation-approvals.csv'
    'rotation-verifications.csv' = Join-Path $InputPath 'rotation-verifications.csv'
}
$inputHashes = @{}; foreach ($k in $inputs.Keys) { if (Test-Path -LiteralPath $inputs[$k]) { $inputHashes[$k] = Get-NpiFileHash -Path $inputs[$k] } }
$inputHashes['rotation.json'] = Get-NpiFileHash -Path $ConfigPath

$out = New-NpiRotationPlan -Client $reader -Rows $register.Rows -Bindings (Import-NpiCh04Input $inputs['certificate-bindings.csv']) -Approvals (Import-NpiCh04Input $inputs['rotation-approvals.csv']) `
    -Verifications (Import-NpiCh04Input $inputs['rotation-verifications.csv']) -Config $config -EffectiveDate (Format-NpiDate $policy.effectiveDate) -AsOf $AsOf -Cloud $Cloud -TenantId $tenantId `
    -RegisterSha256 $register.Sha256 -InputSha256 $inputHashes

$null = Export-NpiCh04Run -OutputPath $OutputPath -Task rotation -Cloud $Cloud -Mode $mode -TenantId $tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Evidence $reader.Evidence `
    -Extra @{ registerSha256 = $register.Sha256; inputs = $inputHashes } -Files @{
    'rotation-plan.json'     = $out.Plan
    'rotation-requests.json' = @($out.Requests)
    'rotation-findings.json' = @($out.Findings)
}
$planHash = Get-NpiFileHash -Path (Join-Path $OutputPath 'rotation-plan.json')
$writes = @($out.Plan.actions | Where-Object Write)
$fs = @($out.Findings)
Write-Output ("Rotation: {0} app registrations read; {1} steps" -f @($register.Rows | Where-Object Type -EQ 'AppRegistration').Count, @($out.Plan.actions).Count)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info; {3} requests for owners" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count, @($out.Requests).Count)
Write-Output ("Rotation plan: {0} writes ({1}); nothing sent" -f $writes.Count, (($writes | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output "Plan SHA-256: $planHash"
