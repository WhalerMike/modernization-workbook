#Requires -Version 7.1
<#
.SYNOPSIS
    Routes a collection: compares each notice with the state from earlier runs (new, changed, unchanged,
    or absent when a provider stops listing an open notice), finds its rule in the routing file, and
    writes a Ticket-to-Machine typed task payload, ServiceNow-shaped, for each task-routed notice that is
    new, changed, closed or gone. A re-run with nothing new writes no payload. Dry run: payloads go to
    <OutputPath>/tasks and nothing is sent. deploy/Invoke-PnScheduledRun.ps1 sends them when the
    settings file allows it.
.EXAMPLE
    ./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$NoticesPath,
    [Parameter(Mandatory)][string]$RoutingPath,
    [Parameter(Mandatory)][string]$StatePath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ProviderNotices/ProviderNotices.psm1') -Force

$r = Invoke-PnRouting -NoticesPath $NoticesPath -RoutingPath $RoutingPath -StatePath $StatePath -OutputPath $OutputPath -AsOf $AsOf
$c = $r.Counts
Write-Host ("Notices: {0} new, {1} changed, {2} unchanged, {3} no longer listed" -f $c.new, $c.changed, $c.unchanged, $c.absent)
Write-Host ("Routes:  {0} task, {1} digest only, {2} ignored" -f $c.task, $c.digest, $c.ignore)
Write-Host ("Payloads: {0} create, {1} update, {2} close" -f $c.create, $c.update, $c.close)
Write-Host ''
foreach ($p in ($r.Payloads | Sort-Object { $_.dedupe_key })) {
    $id = $p.origin.notice_id
    if ($id.Length -gt 48) { $id = $id.Substring(0, $id.IndexOf(':') + 1) + '...' + $id.Substring($id.Length - 40) }
    Write-Host ('{0,-6} {1,-2} {2,-36} {3}' -f $p.action, $p.severity, $p.assignment_group, $id)
}
if (-not $r.Payloads.Count) { Write-Host 'No payloads: nothing new or changed needs a task.' }
Write-Host ''
Write-Host ("Dry run: {0} payloads written to {1}/tasks, nothing sent. State: {2}" -f $r.Payloads.Count, $OutputPath, $StatePath)
