#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 12: the managed service account standard. Checks approved requests exported from
    SailPoint (reached through the agency's system access management tool) and writes Chapter 06's
    reviewed inputs for the ones that pass; reconciles SailPoint's aggregated AD accounts with an
    Active Directory read of every gMSA and dMSA; lists certifications due by risk tier and turns
    each REVOKE into a typed ServiceNow finding; compares Defender for Identity's service account
    list with the register; and lists disabled accounts by the 90-day retirement window. Writes a
    run folder with findings, the generated files, evidence.json and manifest.json. Read only:
    nothing is written to AD, SailPoint, ServiceNow or Defender for Identity, and nothing is deleted.
.EXAMPLE
    # Lab 1: the fixtures, no domain.
    ./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/ch12/inputs -StandardPath tests/fixtures/ch12/standard.json -OutputPath out/msa-standard -AsOf 2026-11-20
.EXAMPLE
    # Lab 2: the agency's exports, with a live read of the gMSAs and dMSAs instead of a saved one.
    ./Invoke-NpiGmsaStandard.ps1 -InputPath exports/2026-11 -StandardPath config/standard.json -OutputPath out/msa-standard -Server dc01.corp.contoso.example
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$StandardPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$Server,
    [datetime]$AsOf = [datetime]::UtcNow.Date
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiGmsaStandard/NpiGmsaStandard.psm1') -Force

$std = Import-NpiStdStandard -Path $StandardPath
$evidence = @(); $mode = 'Files'; $adPath = $null
if ($Server) {
    $read = Export-NpiStdAdManagedAccount -AdInvoke (New-NpiStdLiveAdInvoker -Server $Server) -Path (Join-Path $OutputPath 'inputs/ad-managed-accounts.json')
    $evidence = $read.Evidence; $adPath = $read.Path; $mode = 'LiveAdRead'
}
$in = Import-NpiStdInput -InputPath $InputPath -AdManagedAccountsPath $adPath
$r = Invoke-NpiStdRun -Inputs $in -Standard $std -AsOf $AsOf
$manifest = Export-NpiStdRun -Run $r -Inputs $in -Standard $std -OutputPath $OutputPath -Mode $mode -Evidence $evidence

$fs = @($r.Findings)
$count = { param($sev) @($fs | Where-Object Severity -EQ $sev).Count }
Write-Output ("As of {0}; {1} request(s), {2} AD managed account(s), {3} register row(s)" -f $r.AsOf.ToString('yyyy-MM-dd'), @($in.Requests).Count, @($in.Ad).Count, @($in.Register).Count)
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f (& $count 'Finding'), (& $count 'Warn'), (& $count 'Info'))
Write-Output ("Requests: {0} passed ({1}); {2} held" -f @($r.Requests.Results | Where-Object Passed).Count, ((@($r.Requests.Results | Where-Object Passed) | ForEach-Object RequestId) -join ', '), @($r.Requests.Results | Where-Object { -not $_.Passed }).Count)
Write-Output ("Chapter 06 inputs: {0} kerberos-replatform.csv row(s), {1} password-retrievers.json gMSA(s)" -f @($r.Requests.Replatform).Count, @($r.Requests.Retrievers.Keys).Count)
Write-Output ("Certification: {0}; {1} ServiceNow finding(s)" -f ((@($r.Certification.Rows) | Group-Object Status | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '), @($r.Certification.ServiceNow).Count)
Write-Output ("Retirement: {0}; nothing deleted" -f ((@($r.Retirement.Rows) | Group-Object Status | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
$fs | Group-Object Rule | Sort-Object Name | ForEach-Object { Write-Output ("  {0}  {1}" -f $_.Name, (($_.Group | ForEach-Object ObjectKey) -join ', ')) }
Write-Output "Manifest SHA-256: $(Get-NpiFileHash -Path $manifest.FullName)"
