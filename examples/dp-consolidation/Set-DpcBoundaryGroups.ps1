<#
.SYNOPSIS
    Step 4: point office boundary groups at their hub. Plan, and with -Apply make, the boundary group
    changes for one wave of offices: hub DPs added as content sources, peer download options set,
    and fallback to the other hubs. Dry run by default.
.DESCRIPTION
    For each office in the wave (from waves.csv written by Get-DpcSizing.ps1):
      - Set-CMBoundaryGroup -AddSiteSystemServerName adds the office's hub DPs to the office's group.
      - Set-CMBoundaryGroup -AllowPeerDownload $true -SubnetPeerDownloadOnly $true -PreferDPOverPeer $false
        lets peer cache sources serve clients in the same subnet, ahead of the DPs.
      - New-CMBoundaryGroupRelationship adds each other hub's boundary group as a neighbor, with a
        distribution point fallback time in minutes.
    The office DP stays in the group until Step 6 drains it. Without -Apply the script writes plan.csv
    with every command and its rollback; -WhatIf with -Apply shows each change without making it.
.EXAMPLE
    ./Set-DpcBoundaryGroups.ps1 -SizingPath out/sizing -HubDesignCsv config/hub-design.example.csv -Wave Pilot -SiteCode LAB -OutputPath out/bg-pilot
.EXAMPLE
    .\Set-DpcBoundaryGroups.ps1 -SizingPath .\out\sizing -HubDesignCsv .\config\hub-design.csv -Wave Pilot -SiteCode LAB -ProviderMachineName cm01.lab.example -Apply -OutputPath .\out\bg-pilot-apply
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$SizingPath,
    [Parameter(Mandatory)][string]$HubDesignCsv,
    [Parameter(Mandatory)][string]$Wave,
    [Parameter(Mandatory)][string]$SiteCode,
    [string]$ProviderMachineName,
    [int]$FallbackDPMinutes = 120,
    [string]$OutputPath,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$hubs = @(Import-Csv $HubDesignCsv)
$offices = @(Read-DpcRows -RunPath $SizingPath -Name 'waves' | Where-Object Wave -EQ $Wave)
if ($offices.Count -eq 0) { throw "No offices in wave '$Wave' in $SizingPath\waves.json." }

$plan = New-Object System.Collections.ArrayList
foreach ($o in $offices) {
    $hub = $hubs | Where-Object Region -EQ $o.Region | Select-Object -First 1
    if (-not $hub) { throw "No hub for region $($o.Region) in $HubDesignCsv." }
    $hubDps = @($hub.HubDPs -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim() })
    $null = $plan.Add((New-DpcPlanItem -Step '4.1 hub DPs as content sources' -Target $o.BoundaryGroup -Cmdlet 'Set-CMBoundaryGroup' `
        -Parameters @{ Name = $o.BoundaryGroup; AddSiteSystemServerName = $hubDps } `
        -Rollback ("Set-CMBoundaryGroup -Name '{0}' -RemoveSiteSystemServerName {1}" -f $o.BoundaryGroup, (($hubDps | ForEach-Object { "'$_'" }) -join ','))))
    $null = $plan.Add((New-DpcPlanItem -Step '4.2 peer download options' -Target $o.BoundaryGroup -Cmdlet 'Set-CMBoundaryGroup' `
        -Parameters @{ Name = $o.BoundaryGroup; AllowPeerDownload = $true; SubnetPeerDownloadOnly = $true; PreferDPOverPeer = $false } `
        -Rollback ("Set-CMBoundaryGroup -Name '{0}' -SubnetPeerDownloadOnly `$false" -f $o.BoundaryGroup)))
    foreach ($other in @($hubs | Where-Object Region -NE $o.Region)) {
        $null = $plan.Add((New-DpcPlanItem -Step '4.3 fallback to another hub' -Target "$($o.BoundaryGroup) -> $($other.HubBoundaryGroup)" -Cmdlet 'New-CMBoundaryGroupRelationship' `
            -Parameters @{ SourceGroupName = $o.BoundaryGroup; DestinationGroupName = $other.HubBoundaryGroup; FallbackDPMinutes = $FallbackDPMinutes } `
            -Rollback ("Remove the relationship {0} -> {1} on the boundary group's Relationships tab" -f $o.BoundaryGroup, $other.HubBoundaryGroup)))
    }
}

$mode = if ($Apply) { 'Apply' } else { 'DryRun' }
$run = New-DpcRun -Task boundary-groups -Mode $mode -OutputPath $OutputPath -SiteCode $SiteCode
$here = Get-Location
try {
    if ($Apply) {
        if (-not $ProviderMachineName) { throw '-Apply needs -ProviderMachineName.' }
        Connect-DpcSite -SiteCode $SiteCode -ProviderMachineName $ProviderMachineName
    }
    $rows = Invoke-DpcPlan -Plan @($plan) -Run $run -Apply:$Apply -Caller $PSCmdlet
} finally { Set-Location $here }
$null = Complete-DpcRun -Run $run -Summary @{ wave = $Wave; offices = $offices.Count; changes = $plan.Count }
Write-Output ("{0}: {1} changes for wave {2} ({3} offices: {4})" -f $mode, $plan.Count, $Wave, $offices.Count, (($offices | ForEach-Object Office) -join ', '))
$rows | Select-Object -First 3 | ForEach-Object { Write-Output "  $($_.Command)" }
Write-Output "Plan with rollbacks: $(Join-Path $run.Output 'plan.csv')"
