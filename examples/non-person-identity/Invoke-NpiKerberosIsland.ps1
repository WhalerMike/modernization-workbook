#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 06: read the Kerberos accounts in Chapter 01's register and the domain (the KDS root key,
    read-only; the managed service accounts and their retrievers; dMSA migration state; domain
    controllers and hosts), check them against the reviewed dispositions, and write the findings,
    the plan (dry run, for review), the island list for the program's SPN retirement (P4.6) and the
    reconciliation with the provisional end state (D11). Read only: the plan is applied, after
    review, by Invoke-NpiKerberosIslandAction.ps1.
.EXAMPLE
    # Lab 1: Chapter 01's fixture run, then this one, no domain.
    ./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$RegisterRun,
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$KerberosFixturePath,
    [string]$Server,
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force

$register = Import-NpiKrbRegister -RunPath $RegisterRun
if ($register.Manifest.cloud -ne $Cloud) { throw "The register was read in cloud '$($register.Manifest.cloud)', not '$Cloud'." }
$domain = $register.Manifest.domain
if (-not $domain) { throw 'The register has no AD domain: run Chapter 01 with its Active Directory reads.' }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($register.Manifest.asOf) { [datetime]::Parse($register.Manifest.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }

if ($FixturePath) {
    if (-not $KerberosFixturePath) { throw 'Pass -KerberosFixturePath with -FixturePath.' }
    $ad = (New-NpiKrbFixtureAdInvoker -EstatePath $FixturePath -KerberosPath $KerberosFixturePath).Invoke; $mode = 'Fixture'
} else {
    if (-not $Server) { throw 'Pass -Server: a domain controller of the register''s domain.' }
    $ad = New-NpiKrbLiveAdInvoker -Server $Server -Task kerberos-island; $mode = 'Live'
}
$reader = New-NpiKrbReader -AdInvoke $ad
$inputs = Import-NpiKrbInput -InputPath $InputPath
$state = Read-NpiKrbDomain -Reader $reader -Rows $register.Rows -Dispositions $inputs.Dispositions -Domain $domain -AsOf $AsOf
$r = Test-NpiKerberosIsland -Rows $register.Rows -Domain $state -Inputs $inputs -AsOf $AsOf -DomainName $domain -Cloud $Cloud -TenantId $register.Manifest.tenantId -RegisterSha256 $register.Sha256

$null = Export-NpiKrbRun -OutputPath $OutputPath -Task kerberos-island -Cloud $Cloud -Mode $mode -TenantId $register.Manifest.tenantId -Domain $domain -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $reader.Evidence -Extra @{ registerSha256 = $register.Sha256; inputs = $inputs.Hashes; kds = $state.Kds.State; islandHandoffReady = $r.HandoffReady } -Files @{
    'findings.json'       = @($r.Findings)
    'kerberos-plan.json'  = $r.Plan
    'island-list.csv'     = @($r.IslandList)
    'reconciliation.json' = @($r.Reconciliation)
}
$planHash = Get-NpiFileHash -Path (Join-Path $OutputPath 'kerberos-plan.json')
$fs = @($r.Findings); $writes = @($r.Plan.actions | Where-Object Write)
Write-Output ("Kerberos accounts: {0} in scope; KDS root key {1}" -f @(Get-NpiKrbScope -Rows $register.Rows).Count, $state.Kds.State)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($fs | Where-Object Severity -EQ 'Finding').Count, @($fs | Where-Object Severity -EQ 'Warn').Count, @($fs | Where-Object Severity -EQ 'Info').Count)
Write-Output ("Plan: {0} actions, {1} of them writes ({2}); nothing sent" -f @($r.Plan.actions).Count, $writes.Count, (($writes | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output ("Island list: {0} accounts, {1} ready for P4.6; hand-off ready: {2}" -f @($r.IslandList).Count, @($r.IslandList | Where-Object ReadyForP46).Count, $r.HandoffReady)
Write-Output ("Reconciliation (D11 {0}): {1}" -f $inputs.EndState.d11.decision, ((@($r.Reconciliation) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
Write-Output "Plan SHA-256: $planHash"
