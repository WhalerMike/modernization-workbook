#Requires -Version 7.1
<#
.SYNOPSIS
    The weekly run for one environment: collect every enabled provider, route (sending payloads only when the
    settings file's routing.send is true and -Send is given), write the digest, and record each step as
    evidence. Run folders go under <outputRoot>/runs/<time>; the routing state is <outputRoot>/state.json
    and the evidence <outputRoot>/evidence. Schedule it with the agency's own scheduler; the kit doesn't
    register one. -FixturePath reads a fixture folder and sends nothing.
.EXAMPLE
    ./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$FixturePath,
    [switch]$Send,
    [switch]$AllowUnverified,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PnDeploy.psm1') -Force
$kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$s = Read-PnSettings -Path $SettingsPath
$AsOf = ConvertTo-PnUtc $AsOf
$root = "$($s['outputRoot'])"
if (-not $root) { throw 'The settings file has no outputRoot.' }
$runs = Join-Path $root ('runs/' + ($AsOf -replace '[:-]', ''))
$evidence = Join-Path $root 'evidence'
$state = Join-Path $root 'state.json'
$routing = "$($s.routing.path)"
if (-not [IO.Path]::IsPathRooted($routing)) { $routing = Join-Path $kit $routing }
$inv = if ($FixturePath) { New-PnFixtureInvoker -Path $FixturePath } else { New-PnLiveInvoker -Settings $s -AllowUnverified:$AllowUnverified }
$send = $Send -and $s.routing.send -and -not $FixturePath
if ($Send -and -not $send) { Write-Host 'Not sending: the settings file''s routing.send is false, or this is fixture mode.' }
$results = [Collections.Generic.List[object]]::new()
$record = { param($folder, $what) $null = Write-PnEvidence -EvidencePath $evidence -RunPath (Join-Path $runs $folder) -AsOf $AsOf -Command "Invoke-PnScheduledRun.ps1 ($what)" -ChangeRecord "$($s['changeRecord'])" }

$c = Invoke-PnCollection -Settings $s -Invoker $inv -OutputPath (Join-Path $runs 'collect') -AsOf $AsOf
$results.Add([pscustomobject]@{ Id = 'RUN-COLLECT'; Status = 'Pass'; Detail = "$(@($c.Notices).Count) notices from $(@($c.Providers.Keys) -join ', ')" })
& $record 'collect' 'collect'

$rp = @{ NoticesPath = (Join-Path $runs 'collect/notices.json'); RoutingPath = $routing; StatePath = $state; OutputPath = (Join-Path $runs 'route'); AsOf = $AsOf }
if ($send) { $rp.Send = $true; $rp.Sender = New-PnServiceNowSender -Settings $s }
$r = Invoke-PnRouting @rp
$results.Add([pscustomobject]@{ Id = 'RUN-ROUTE'; Status = 'Pass'; Detail = ('{0} create, {1} update, {2} close; {3}' -f $r.Counts.create, $r.Counts.update, $r.Counts.close, $(if ($r.DryRun) { 'dry run' } else { 'sent' })) })
& $record 'route' 'route'

$d = New-PnDigest -NoticesPath (Join-Path $runs 'collect/notices.json') -StatePath $state -OutputPath (Join-Path $runs 'digest') -AsOf $AsOf -Days $s.digest.days -UpcomingDays $s.digest.upcomingDays
$results.Add([pscustomobject]@{ Id = 'RUN-DIGEST'; Status = 'Pass'; Detail = "$($d.Open) open, $($d.ActionRequired) need action" })
& $record 'digest' 'digest'

Write-PnDeployRun -OutputPath (Join-Path $runs 'scheduled-run') -Task scheduled-run -Results $results.ToArray() -Settings $s -Mode $inv.Mode -AsOf $AsOf -CallIds @($inv.Calls)
& $record 'scheduled-run' 'run'
foreach ($x in $results) { Write-Host ('{0,-12} {1,-4}  {2}' -f $x.Id, $x.Status, $x.Detail) }
Write-Host ("Runs: {0}. Evidence: {1}" -f $runs, $evidence)
