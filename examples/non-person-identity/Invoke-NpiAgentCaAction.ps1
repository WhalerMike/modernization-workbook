#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09: the separate write path for the agent Conditional Access plan. Creates only the
    report-only Block policies the reviewed plan lists, and only when the plan's SHA-256 is the one
    a reviewer approved. Dry run unless -Apply. A live run is a person signed in with Conditional
    Access Administrator, never an unattended app.
.EXAMPLE
    $sha = (Get-FileHash out/agent-id/agent-ca-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiAgentCaAction.ps1 -Cloud gcc -PlanPath out/agent-id/agent-ca-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch09/agent-estate.json -OutputPath out/agent-ca-dryrun
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
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiAgentId/NpiAgentId.psm1') -Force

$plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if (-not $PSBoundParameters.ContainsKey('AsOf')) { $AsOf = if ($FixturePath) { [datetime]::Parse($plan.created, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) } else { [datetime]::UtcNow } }
if ($FixturePath) { $invoke = (New-NpiAgentFixtureInvoker -Path $FixturePath -Cloud $Cloud -AllowWrite).Invoke; $mode = 'Fixture' }
else {
    $ctx = Get-MgContext
    if (-not $ctx -or $ctx.AuthType -ne 'Delegated') { throw 'The agent Conditional Access write path runs only as a person, delegated; sign in with Connect-MgGraph as a Conditional Access Administrator.' }
    $invoke = New-NpiLiveInvoker -Cloud $Cloud -TenantId $plan.tenantId -SkipAzure -AllowWrite; $mode = 'Live'
}
$writer = New-NpiAgentCaWriter -Cloud $Cloud -TenantId $plan.tenantId -Invoke $invoke
$r = Invoke-NpiAgentCaPlan -Writer $writer -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -AsOf $AsOf -Apply:$Apply
$null = Export-NpiAgentRun -OutputPath $OutputPath -Task 'agent-ca-apply' -Cloud $Cloud -Mode $mode -TenantId $plan.tenantId -AsOf $AsOf.ToString('yyyy-MM-dd') -Evidence $r.Evidence `
    -Extra @{ planSha256 = $r.PlanSha256; applied = [bool]$Apply } -Files @{ 'results.json' = @($r.Results) }
Write-Output ("{0}: {1}" -f $(if ($Apply) { 'Apply' } else { 'DryRun' }), ((@($r.Results) | Group-Object Status | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
foreach ($x in @($r.Results)) { Write-Output ("  {0} {1} {2}" -f $x.Status, $x.ActionId, $x.Detail) }
