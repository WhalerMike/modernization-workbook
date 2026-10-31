#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04's separate, reviewed write path: apply a policy plan or a rotation plan that a
    reviewer approved by its SHA-256. A dry run unless -Apply. Live runs are delegated only: a
    person signed in with Cloud Application Administrator (and, for a rotation, Key Vault
    Certificates Officer on the vault), never an unattended app.
.EXAMPLE
    ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 <sha256> -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-dryrun
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
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiCredentialPolicy/NpiCredentialPolicy.psm1') -Force

$plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if ($plan.task -notin 'policy-apply', 'rotation-apply') { throw "Not a Chapter 04 plan: task '$($plan.task)'." }
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($FixturePath) { [datetime]::Parse("$($plan.asOf)T00:00:00Z", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { [datetime]::UtcNow } }
$maxAge = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'config/rotation.json') -Raw | ConvertFrom-Json).maxPlanAgeDays

if ($FixturePath) {
    $invoke = (New-NpiCh04FixtureInvoker -Path $FixturePath -Cloud $Cloud -AllowWrite).Invoke; $mode = 'Fixture'
} else {
    $mg = Get-MgContext
    if (-not $mg -or $mg.AuthType -ne 'Delegated') { throw "$($plan.task) runs delegated only: sign in as a person with Cloud Application Administrator, not as an application." }
    $invoke = New-NpiCh04LiveInvoker -Cloud $Cloud -TenantId $plan.tenantId -AllowWrite -SkipAzure:($plan.task -eq 'policy-apply'); $mode = 'Live'
}
$writer = New-NpiCh04Client -Cloud $Cloud -Task $plan.task -Invoke $invoke -TenantId $plan.tenantId

$run = Invoke-NpiCredentialPlan -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -Writer $writer -AsOf $AsOf -MaxPlanAgeDays $maxAge -Apply:$Apply
$null = Export-NpiCh04Run -OutputPath $OutputPath -Task $plan.task -Cloud $Cloud -Mode "$mode-$($run.Mode)" -TenantId $plan.tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') `
    -Evidence $run.Evidence -Extra @{ planSha256 = $run.PlanSha256 } -Files @{ 'results.json' = @($run.Results) }

Write-Output ("{0}: {1}" -f $run.Mode, ((@($run.Results) | Group-Object Outcome | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($r in $run.Results) { Write-Output ("  {0,-9} {1,-20} {2,-5} {3}" -f $r.Outcome, $r.Action, $r.Method, $r.Target) }
