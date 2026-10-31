#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 06's separate, reviewed write path: apply a Kerberos plan that a reviewer approved by its
    SHA-256. A dry run unless -Apply. A live run is a person's session against a read-write domain
    controller, never a scheduled job or a service account, and never deletes, uninstalls, undoes or
    resets anything.
.EXAMPLE
    # Lab 1: a dry run, then -Apply, against the fake (nothing leaves the machine).
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 <sha256> -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PlanPath,
    [Parameter(Mandatory)][string]$ApprovedSha256,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$KerberosFixturePath,
    [string]$Server,
    [datetime]$AsOf,
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
    if ($me -match '\$$' -or $me -match '^NT AUTHORITY\\') { throw "kerberos-apply runs as a person, not as $me." }
    $ad = New-NpiKrbLiveAdInvoker -Server $Server -Task kerberos-apply; $mode = 'Live'
}
$writer = New-NpiKrbWriter -TenantId $plan.tenantId -Domain $plan.domain -AdInvoke $ad
$run = Invoke-NpiKrbPlan -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -Writer $writer -AsOf $AsOf -Apply:$Apply
$null = Export-NpiKrbRun -OutputPath $OutputPath -Task kerberos-apply -Cloud $plan.cloud -Mode "$mode-$($run.Mode)" -TenantId $plan.tenantId -Domain $plan.domain -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $run.Evidence -Extra @{ planSha256 = $run.PlanSha256 } -Files @{ 'results.json' = @($run.Results) }

Write-Output ("{0}: {1}" -f $run.Mode, ((@($run.Results) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($r in $run.Results) { Write-Output ("  {0,-9} {1,-21} {2,-15} {3}" -f $r.Outcome, $r.Action, $r.Account, $r.Cmdlet) }
