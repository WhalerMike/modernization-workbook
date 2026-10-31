#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 02's separate, reviewed write path: apply an orphan plan that a reviewer approved by
    its SHA-256. A dry run unless -Apply. Live runs are delegated only: a person signed in with
    Cloud Application Administrator and the orphan-apply permissions, never an unattended app.
.EXAMPLE
    # Lab 1: a dry run, then -Apply, against the fake (nothing leaves the machine).
    ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership/orphan-plan.json -ApprovedSha256 <sha256> -FixturePath tests/fixtures/estate.json -OutputPath out/orphan-dryrun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$PlanPath,
    [Parameter(Mandatory)][string]$ApprovedSha256,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$Domain,
    [datetime]$AsOf,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiOwnership/NpiOwnership.psm1') -Force

$plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($FixturePath) { [datetime]::Parse($plan.generated, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { [datetime]::UtcNow } }

if ($FixturePath) {
    $fake = New-NpiFixtureInvoker -Path $FixturePath -Cloud $Cloud -AllowWrite
    $fakeAd = New-NpiFixtureAdInvoker -Path $FixturePath -AllowWrite
    $writer = New-NpiWriter -Cloud $Cloud -TenantId $plan.tenantId -Invoke $fake.Invoke -AdInvoke $fakeAd.Invoke
    $mode = 'Fixture'
} else {
    $mg = Get-MgContext
    if (-not $mg -or $mg.AuthType -ne 'Delegated') { throw 'orphan-apply runs delegated only: sign in as a person with Cloud Application Administrator, not as an application.' }
    $needsAd = @($plan.actions | Where-Object { $_.Write -and $_.Call -eq 'ad-disable-account' }).Count -gt 0
    if ($needsAd -and -not $Domain) { throw 'The plan disables AD accounts; pass -Domain.' }
    $writer = New-NpiWriter -Cloud $Cloud -TenantId $plan.tenantId -Invoke (New-NpiLiveInvoker -Cloud $Cloud -TenantId $plan.tenantId -SkipAzure -AllowWrite) `
        -AdInvoke $(if ($needsAd) { New-NpiLiveAdInvoker -Server $Domain -AllowWrite })
    $mode = 'Live'
}

$run = Invoke-NpiOrphanPlan -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -Writer $writer -AsOf $AsOf -Apply:$Apply
$null = Export-NpiRun -OutputPath $OutputPath -Task orphan-apply -Cloud $Cloud -Mode "$mode-$($run.Mode)" -TenantId $plan.tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $run.Evidence -Extra @{ planSha256 = $run.PlanSha256 } -Files @{ 'results.json' = @($run.Results) }

Write-Output ("{0}: {1}" -f $run.Mode, ((@($run.Results) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($r in $run.Results) { Write-Output ("  {0,-9} {1,-8} {2} {3}" -f $r.Outcome, $r.Action, $r.Method, $r.Target) }
