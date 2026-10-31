#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 07's separate, reviewed write path: apply a least-privilege plan that a reviewer
    approved by its SHA-256. A dry run unless -Apply. It removes app role assignments (through the
    resource service principal) and narrows delegated grants; it never deletes a service principal
    or an application. Live runs are delegated only: a person signed in with Privileged Role
    Administrator, never an unattended app.
.EXAMPLE
    # Lab 1: a dry run, then -Apply, against the fake (nothing leaves the machine).
    ./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 <sha256> -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-dryrun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$PlanPath,
    [Parameter(Mandatory)][string]$ApprovedSha256,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [datetime]$AsOf,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1') -Force

$plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($FixturePath) { [datetime]::Parse($plan.generated, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { [datetime]::UtcNow } }

if ($FixturePath) {
    $fake = New-NpiLpFixtureInvoker -Path $FixturePath -Cloud $Cloud -AllowWrite
    $writer = New-NpiLpWriter -Cloud $Cloud -TenantId $plan.tenantId -Invoke $fake.Invoke
    $mode = 'Fixture'
} else {
    $mg = Get-MgContext
    if (-not $mg -or $mg.AuthType -ne 'Delegated') { throw 'least-privilege-apply runs delegated only: sign in as a person with Privileged Role Administrator, not as an application.' }
    $writer = New-NpiLpWriter -Cloud $Cloud -TenantId $plan.tenantId -Invoke (New-NpiLiveInvoker -Cloud $Cloud -TenantId $plan.tenantId -SkipAzure -AllowWrite)
    $mode = 'Live'
}

$run = Invoke-NpiLpPlan -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -Writer $writer -AsOf $AsOf -Apply:$Apply
$null = Export-NpiLpRun -OutputPath $OutputPath -Task least-privilege-apply -Cloud $Cloud -Mode "$mode-$($run.Mode)" -TenantId $plan.tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $run.Evidence -Extra @{ planSha256 = $run.PlanSha256 } -Files @{ 'results.json' = @($run.Results) }

Write-Output ("{0}: {1}" -f $run.Mode, ((@($run.Results) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($r in $run.Results) { Write-Output ("  {0,-9} {1,-13} {2,-6} {3}" -f $r.Outcome, $r.Action, $r.Method, $r.Target) }
