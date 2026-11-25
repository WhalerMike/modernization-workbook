#Requires -Version 7.4
<#
.SYNOPSIS
    The one write path for Book 18, Appendix A's WP4 and WP5 and their rollback: runs a reviewed plan's
    Microsoft Graph commands, only with -Apply and the plan's approved SHA-256.
.DESCRIPTION
    Without -Apply it is a dry run: it prints the commands the plan would run and changes nothing.
    With -Apply it checks that the plan file's SHA-256 is the one the approver recorded in the change,
    that Microsoft Graph is signed in, and that the tenant holds the plan's application, then runs the
    commands in order and writes apply-<kind>.json beside the plan: each command, when it ran and
    whether it succeeded. It stops at the first failure.

    Sign in for the change window with the least role the plan needs (Cloud Application Administrator
    or Application Administrator, activated through PIM):
        Connect-MgGraph -Scopes 'Application.ReadWrite.All','AppRoleAssignment.ReadWrite.All' -NoWelcome
.EXAMPLE
    ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp4-redirect-plan.json
.EXAMPLE
    ./Invoke-AmIdentityApply.ps1 -PlanPath <plan> -ApprovedSha256 <sha256> -Apply
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PlanPath,
    [string]$ApprovedSha256,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/AppModernization/AppModernization.psm1') -Force

$plan = Read-AmJson -Path $PlanPath
$hash = Get-AmPlanHash -Path $PlanPath
$commands = @(Get-AmPlanCommand -PlanPath $PlanPath)

if (-not $Apply) {
    "Dry run of $($plan.kind) for $($plan.appId), change $($plan.changeId). Plan SHA-256 $hash."
    'Nothing was changed. The commands -Apply would run, in order:'
    $commands | ForEach-Object { "  $($_.Text)" }
    return
}

if (-not $ApprovedSha256) { throw 'AM-APPLY-01: -Apply needs -ApprovedSha256, the plan hash recorded in the change.' }
if ($ApprovedSha256.ToLowerInvariant() -ne $hash) { throw "AM-APPLY-02: the plan's SHA-256 is $hash, not the approved $ApprovedSha256. Review the plan again." }
if (-not (Get-Command Get-MgContext -ErrorAction SilentlyContinue) -or -not (Get-MgContext)) { throw 'AM-APPLY-03: not signed in to Microsoft Graph (Connect-MgGraph).' }
$sp = Get-MgServicePrincipal -Filter "appId eq '$($plan.appId)'"
if (-not $sp -or $sp.Id -ne $plan.servicePrincipalObjectId) { throw "AM-APPLY-04: this tenant's service principal for $($plan.appId) isn't the one in the plan." }

$log = foreach ($c in $commands) {
    $at = [DateTime]::UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
    try {
        $params = $c.Parameters
        & $c.Cmdlet @params | Out-Null
        [pscustomobject]@{ at = $at; command = $c.Text; ok = $true; error = $null }
    } catch {
        [pscustomobject]@{ at = $at; command = $c.Text; ok = $false; error = $_.Exception.Message }
        break
    }
}
$out = Join-Path (Split-Path -Parent $PlanPath) "apply-$($plan.kind).json"
[pscustomobject]@{ plan = (Split-Path -Leaf $PlanPath); planSha256 = $hash; changeId = $plan.changeId; steps = @($log) } |
    ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $out -Encoding utf8NoBOM
$log | Format-Table at, ok, command -Wrap
if (@($log | Where-Object { -not $_.ok }).Count) { throw "AM-APPLY-05: a command failed; see $out. Roll back from the before snapshot." }
