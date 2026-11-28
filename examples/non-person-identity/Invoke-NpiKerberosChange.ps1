#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 06: build the plan for one approved change to an existing gMSA or dMSA (a request pack
    row with RequestKind Change: AddHost, RemoveHost, AddSpn, RemoveSpn, Tier or EndDate). Reads
    only: the account, its retriever group and the hosts. Writes change-plan.json and a manifest.
    A reviewer approves the plan's SHA-256; Invoke-NpiKerberosIslandAction.ps1 applies it. Every
    change write is a person's (-RunAs Person) while WD-185 is a draft.
.EXAMPLE
    # Against the fixtures: add PAY03 to gmsa-payroll$'s retriever group.
    ./Invoke-NpiKerberosChange.ps1 -RequestPath tests/fixtures/ch06/change/requests/REQ-2026-0406.json -AdStandardPath tests/fixtures/ch06/inputs/ad-standard.json -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -Domain corp.contoso.example -FixturePath tests/fixtures/ch06/change/estate.json -KerberosFixturePath tests/fixtures/ch06/change/ad-kerberos.json -AsOf 2026-11-28T12:00:00Z -OutputPath out/change-0406
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$RequestPath,
    [Parameter(Mandatory)][string]$AdStandardPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [Parameter(Mandatory)][ValidateSet('global', 'gcc')][string]$Cloud,
    [Parameter(Mandatory)][string]$TenantId,
    [Parameter(Mandatory)][string]$Domain,
    [string]$ProgramDatesPath,
    [string]$FixturePath,
    [string]$KerberosFixturePath,
    [string]$Server,
    [datetime]$AsOf = [datetime]::UtcNow
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force

if ($FixturePath) { $ad = (New-NpiKrbFixtureAdInvoker -EstatePath $FixturePath -KerberosPath $KerberosFixturePath).Invoke; $mode = 'Fixture' }
else {
    if (-not $Server) { throw 'Pass -Server: a domain controller to read from.' }
    $ad = New-NpiKrbLiveAdInvoker -Server $Server -Task kerberos-island; $mode = 'Live'
}
$reader = New-NpiKrbReader -AdInvoke $ad
$plan = New-NpiKrbChangePlan -RequestPath $RequestPath -AdStandardPath $AdStandardPath -Reader $reader -TenantId $TenantId -Domain $Domain -Cloud $Cloud -AsOf $AsOf -ProgramDatesPath $ProgramDatesPath
$null = Export-NpiKrbRun -OutputPath $OutputPath -Task kerberos-island -Cloud $Cloud -Mode $mode -TenantId $TenantId -Domain $Domain -AsOf $AsOf.ToUniversalTime().ToString('yyyy-MM-dd') `
    -Evidence $reader.Evidence -Extra @{ change = $plan.change } -Files @{ 'change-plan.json' = $plan }

Write-Output ("{0} {1} on {2}: {3} write(s), SHA-256 {4}" -f $plan.change.requestId, $plan.change.changeType, $plan.change.account, @($plan.actions | Where-Object Write).Count, (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $OutputPath 'change-plan.json')).Hash.ToLowerInvariant())
foreach ($a in $plan.actions) { Write-Output ("  {0,-18} {1,-6} {2,-8} {3}" -f $a.Action, $(if ($a.Write) { 'write' } else { '' }), $a.RunBy, $a.Reason) }
