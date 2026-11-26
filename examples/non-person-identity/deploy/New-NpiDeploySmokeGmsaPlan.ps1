#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 11, Step 1.4: the smoke-test gMSA as a one-account Chapter 06 plan, not a hand-typed
    New-ADServiceAccount (WD-168). Reads the settings file and the forest's ad-standard.json (in
    ad.kerberosInputs), checks the name (gmsa-<app>, WD-159), the retriever group
    (DL-gMSA-<app>-Hosts, WD-160), the SailPoint request (ad.gmsaRequestId), the change record and the tags (ad.gmsaTags, WD-175),
    and writes kerberos-plan.json and a manifest. Writes nothing to Active Directory: a reviewer
    approves the plan's SHA-256, then Chapter 06's Invoke-NpiKerberosIslandAction.ps1 applies it
    -RunAs Pipeline (in Stage 1, before the pipeline exists, -RunAs Person -TestDomain).
.EXAMPLE
    # The test stage's plan from the fixture settings: nothing leaves the machine.
    ./deploy/New-NpiDeploySmokeGmsaPlan.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -OutputPath out/deploy-test/gmsa-plan -AsOf '2026-11-02T12:00:00Z'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AdStandardPath,
    [string]$OutboundOnlyReason = '',
    [datetime]$AsOf
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'NpiDeploy.psm1') -Force
Import-Module (Join-Path $PSScriptRoot '../powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force

$s = Read-NpiDeploySettings -Path $SettingsPath -Stage $Stage
if (-not $AdStandardPath) { $AdStandardPath = Join-Path $s.ad.kerberosInputs 'ad-standard.json' }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = [datetime]::UtcNow }
$t = $s.ad.gmsaTags
$tags = (@(foreach ($k in 'SystemId', 'Owner1', 'Owner2', 'Sponsor', 'Environment', 'Tier', 'EntraTarget') { "$k=$($t[$k])" }) + @("Request=$($s.ad.gmsaRequestId)", "Change=$($s.changeRecord)")) -join '; '
$plan = New-NpiKrbGmsaPlan -Name "$($s.ad.gmsaName)`$" -RetrieverGroupDn "CN=$($s.ad.gmsaRetrieverGroup),$($s.ad.gmsaRetrieverGroupPath)" -AdStandardPath $AdStandardPath `
    -RequestId "$($s.ad.gmsaRequestId)" -ChangeRecord "$($s.changeRecord)" -Tags $tags -TenantId $s.tenantId -Domain $s.ad.domain -Cloud $s.cloud -AsOf $AsOf `
    -Workload "the $($s.ad.gmsaService) service" -Hosts $s.ad.gmsaTestHost -OutboundOnlyReason $OutboundOnlyReason -InputHashes @{ 'settings.json' = $s._sha256 }
$null = Export-NpiKrbRun -OutputPath $OutputPath -Task kerberos-apply -Cloud $s.cloud -Mode 'Plan' -TenantId $s.tenantId -Domain $s.ad.domain -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Extra @{ environment = $s.environment; changeRecord = $s.changeRecord; settingsSha256 = $s._sha256 } -Files @{ 'kerberos-plan.json' = $plan }
$a = $plan.actions[0]
Write-Output ("Plan: {0} {1} in {2}, retriever {3}; runBy {4}; request {5}, change {6}" -f $a.Action, $a.Account, $a.Params.Path, @($a.Params.PrincipalsAllowedToRetrieveManagedPassword)[0], $a.RunBy, $a.RequestId, $a.ChangeRecord)
Write-Output ("Outbound-only: {0}" -f $(if ($a.Params.Contains('RestrictToOutboundAuthenticationOnly')) { 'yes' } else { "no ($OutboundOnlyReason)" }))
Write-Output "Plan SHA-256: $(Get-NpiFileHash -Path (Join-Path $OutputPath 'kerberos-plan.json'))"
