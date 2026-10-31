#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 01: read every non-person identity into one register (AD service accounts, MSAs, gMSAs,
    dMSAs, app registrations, service principals, managed identities, federated credentials,
    Graph application permissions and consent grants), classify it, report the findings, and write
    the run with a manifest. Read only.
.EXAMPLE
    # Lab 1: the fictional estate, no sign-in.
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
.EXAMPLE
    # Live, Microsoft 365 GCC with commercial Azure: sign in first with the task's permissions.
    Connect-MgGraph -Environment Global -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
    Connect-AzAccount -ServicePrincipal -Environment AzureCloud -Tenant <tenant-id> -ApplicationId <app-id> -CertificateThumbprint <thumbprint>
    ./Invoke-NpiInventory.ps1 -Cloud gcc -TenantId <tenant-id> -Domain corp.contoso.example -OutputPath out/inventory
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$TenantId,
    [string]$Domain,
    [datetime]$AsOf,
    [string]$ConfigPath,
    [switch]$SkipAd,
    [switch]$SkipAzure
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiInventory/NpiInventory.psm1') -Force

$config = if ($ConfigPath) { Get-NpiRegisterConfig -Path $ConfigPath } else { Get-NpiRegisterConfig }
if ($FixturePath) {
    $estate = Get-Content -LiteralPath $FixturePath -Raw | ConvertFrom-Json -AsHashtable
    if (-not $TenantId) { $TenantId = $estate.tenantId }
    if (-not $Domain) { $Domain = $estate.domain }
    if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = [datetime]::Parse($estate.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) }
    $invoke = (New-NpiFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke
    $adInvoke = (New-NpiFixtureAdInvoker -Path $FixturePath).Invoke
    $mode = 'Fixture'
} else {
    if (-not $TenantId) { throw 'A live run needs -TenantId; the manifest records it and the invoker checks the session against it.' }
    if (-not $SkipAd -and -not $Domain) { throw 'A live run needs -Domain for the AD reads, or -SkipAd.' }
    if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = [datetime]::UtcNow }
    $invoke = New-NpiLiveInvoker -Cloud $Cloud -TenantId $TenantId -SkipAzure:$SkipAzure
    $adInvoke = if ($SkipAd) { $null } else { New-NpiLiveAdInvoker -Server $Domain }
    $mode = 'Live'
}

$reader = New-NpiReader -Cloud $Cloud -Task inventory -Invoke $invoke -AdInvoke $adInvoke
$register = Get-NpiRegister -Reader $reader -TenantId $TenantId -AsOf $AsOf -Config $config -SkipAd:$SkipAd -SkipAzure:$SkipAzure
$findings = Test-NpiRegister -Register $register -Config $config
$rows = @($register.Rows)

$null = Export-NpiRun -OutputPath $OutputPath -Task inventory -Cloud $Cloud -Mode $mode -TenantId $TenantId -Domain $Domain -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $register.Evidence -Extra @{ configSha256 = (Get-NpiFileHash -Path $config['_path']); skipped = @($(if ($SkipAd) { 'ad' }) + $(if ($SkipAzure) { 'azure' }) | Where-Object { $_ }) } -Files @{
    'register.json'               = $rows
    'register.csv'                = $rows
    'findings.json'               = @($findings)
    'data-platform-handoff.csv'   = @($rows | Where-Object Handoff -EQ 'DataPlatform' | Select-Object IdentityId, Name, Type, Spns, Enabled, Risk, CandidateTarget)
}

$bySource = $rows | Group-Object Source | Sort-Object Name | ForEach-Object { "$($_.Name) $($_.Count)" }
$byRisk = $rows | Group-Object Risk | Sort-Object Name | ForEach-Object { "$($_.Name) $($_.Count)" }
Write-Output ("Register: {0} identities ({1}); risk {2}" -f $rows.Count, ($bySource -join ', '), ($byRisk -join ', '))
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info; {3} handed to the Data Platform plan" -f @($findings | Where-Object Severity -EQ 'Finding').Count, @($findings | Where-Object Severity -EQ 'Warn').Count, @($findings | Where-Object Severity -EQ 'Info').Count, @($rows | Where-Object Handoff -EQ 'DataPlatform').Count)
Write-Output "Written to $OutputPath (manifest.json: tenant $TenantId, every request, a SHA-256 per file)"
