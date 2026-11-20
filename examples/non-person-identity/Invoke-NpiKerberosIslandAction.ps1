#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 06's separate, reviewed write path: apply a Kerberos plan that a reviewer approved by its
    SHA-256, after SailPoint approved each write's request and ServiceNow recorded its change. A dry
    run unless -Apply. -RunAs says who is running it (WD-163): Pipeline is the pipeline's own gMSA
    (gmsa-msapipe$, holding only the delegated rights on the service-account OUs), which sends the
    gMSA creations, retriever changes, disables and moves; Person is a person signed in with the
    call's right, who sends the dMSA steps, and a pipeline step only with -TestDomain. A write the
    other one sends is reported as Refused. A live run goes against a read-write domain controller,
    and never deletes, uninstalls, undoes or resets anything.
.EXAMPLE
    # Lab 1: a dry run as the pipeline, then -Apply, against the fake (nothing leaves the machine).
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 <sha256> -RunAs Pipeline -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PlanPath,
    [Parameter(Mandatory)][string]$ApprovedSha256,
    [Parameter(Mandatory)][string]$OutputPath,
    [Parameter(Mandatory)][ValidateSet('Pipeline', 'Person')][string]$RunAs,
    [string]$FixturePath,
    [string]$KerberosFixturePath,
    [string]$Server,
    [datetime]$AsOf,
    [switch]$TestDomain,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force

$plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($FixturePath) { [datetime]::Parse($plan.generated, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { [datetime]::UtcNow } }

if ($FixturePath) {
    $fake = New-NpiKrbFixtureAdInvoker -EstatePath $FixturePath -KerberosPath $KerberosFixturePath -AllowWrite
    $ad = $fake.Invoke; $mode = 'Fixture'
} else {
    if (-not $Server) { throw 'Pass -Server: a read-write domain controller (Learn: these cmdlets don''t work against a read-only one).' }
    $me = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $pipe = "$((Get-NpiKrbTask -Task kerberos-apply).pipelineIdentity)"
    # The pipeline runs only as its own gMSA; a person's run is never a computer, a managed account or a system identity.
    if ($RunAs -eq 'Pipeline' -and $me -notlike "*\$pipe") { throw "-RunAs Pipeline runs only as the pipeline's gMSA $pipe, not as $me." }
    if ($RunAs -eq 'Person' -and ($me -match '\$$' -or $me -match '^NT AUTHORITY\\')) { throw "-RunAs Person runs as a person, not as $me." }
    $ad = New-NpiKrbLiveAdInvoker -Server $Server -Task kerberos-apply; $mode = 'Live'
}
$writer = New-NpiKrbWriter -TenantId $plan.tenantId -Domain $plan.domain -AdInvoke $ad
$run = Invoke-NpiKrbPlan -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -Writer $writer -AsOf $AsOf -RunAs $RunAs -TestDomain:$TestDomain -Apply:$Apply
$null = Export-NpiKrbRun -OutputPath $OutputPath -Task kerberos-apply -Cloud $plan.cloud -Mode "$mode-$($run.Mode)" -TenantId $plan.tenantId -Domain $plan.domain -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $run.Evidence -Extra @{ planSha256 = $run.PlanSha256; runAs = $run.RunAs; testDomain = $run.TestDomain } -Files @{ 'results.json' = @($run.Results) }

Write-Output ("{0} as {1}: {2}" -f $run.Mode, $run.RunAs, ((@($run.Results) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($r in $run.Results) { Write-Output ("  {0,-10} {1,-8} {2,-21} {3,-15} {4}" -f $r.Outcome, $r.RunBy, $r.Action, $r.Account, $r.Cmdlet) }
