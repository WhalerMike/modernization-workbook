<#
.SYNOPSIS
    Step 5: plan, and with -Apply make, the client settings that keep content in the office: a peer
    cache source setting for chosen clients, and BranchCache, cache size and Delivery Optimization for
    every office client. Dry run by default.
.DESCRIPTION
    Creates two custom device client settings and deploys each to a collection:
      - "<Prefix> Peer Cache Sources": Set-CMClientSettingClientCache -EnableSuperPeer $true with the
        peer ports (UDP 8004 broadcast, TCP 8003 download) and a larger cache, deployed to the
        collection of chosen peer cache sources.
      - "<Prefix> Office Clients": Set-CMClientSettingClientCache -ConfigureBranchCache $true
        -EnableBranchCache $true, and Set-CMClientSettingDeliveryOptimization -Enable $true, deployed
        to the office clients collection.
    New-CMClientSetting creates each setting and New-CMClientSettingDeployment deploys it. Without
    -Apply the script writes plan.csv; -WhatIf with -Apply shows each change without making it.
.EXAMPLE
    ./Set-DpcPeerCache.ps1 -SiteCode LAB -PeerSourceCollection 'DPC Peer Cache Sources - Pilot' -OfficeClientCollection 'DPC Office Clients - Pilot' -OutputPath out/peer-plan
.EXAMPLE
    .\Set-DpcPeerCache.ps1 -SiteCode LAB -ProviderMachineName cm01.lab.example -PeerSourceCollection 'DPC Peer Cache Sources - Pilot' -OfficeClientCollection 'DPC Office Clients - Pilot' -Apply -OutputPath .\out\peer-apply
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$SiteCode,
    [Parameter(Mandatory)][string]$PeerSourceCollection,
    [Parameter(Mandatory)][string]$OfficeClientCollection,
    [string]$ProviderMachineName,
    [string]$Prefix = 'DPC',
    [int]$PeerSourceCacheMB = 51200,
    [string]$OutputPath,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$peer = "$Prefix Peer Cache Sources"
$office = "$Prefix Office Clients"
$plan = @(
    New-DpcPlanItem -Step '5.1 peer source setting' -Target $peer -Cmdlet 'New-CMClientSetting' -Parameters @{ Name = $peer; Type = 'Device' } -Rollback "Remove the client setting '$peer' (Administration > Client Settings)"
    New-DpcPlanItem -Step '5.1 peer source cache' -Target $peer -Cmdlet 'Set-CMClientSettingClientCache' `
        -Parameters @{ Name = $peer; EnableSuperPeer = $true; BroadcastPort = 8004; DownloadPort = 8003; ConfigureCacheSize = $true; MaxCacheSize = $PeerSourceCacheMB } `
        -Rollback "Set-CMClientSettingClientCache -Name '$peer' -EnableSuperPeer `$false"
    New-DpcPlanItem -Step '5.1 deploy to peer sources' -Target $PeerSourceCollection -Cmdlet 'New-CMClientSettingDeployment' -Parameters @{ Name = $peer; CollectionName = $PeerSourceCollection } -Rollback "Delete the deployment of '$peer' to '$PeerSourceCollection'"
    New-DpcPlanItem -Step '5.2 office client setting' -Target $office -Cmdlet 'New-CMClientSetting' -Parameters @{ Name = $office; Type = 'Device' } -Rollback "Remove the client setting '$office'"
    New-DpcPlanItem -Step '5.2 BranchCache' -Target $office -Cmdlet 'Set-CMClientSettingClientCache' -Parameters @{ Name = $office; ConfigureBranchCache = $true; EnableBranchCache = $true } -Rollback "Set-CMClientSettingClientCache -Name '$office' -EnableBranchCache `$false"
    New-DpcPlanItem -Step '5.2 Delivery Optimization' -Target $office -Cmdlet 'Set-CMClientSettingDeliveryOptimization' -Parameters @{ Name = $office; Enable = $true } -Rollback "Set-CMClientSettingDeliveryOptimization -Name '$office' -Enable `$false"
    New-DpcPlanItem -Step '5.2 deploy to office clients' -Target $OfficeClientCollection -Cmdlet 'New-CMClientSettingDeployment' -Parameters @{ Name = $office; CollectionName = $OfficeClientCollection } -Rollback "Delete the deployment of '$office' to '$OfficeClientCollection'"
)

$mode = if ($Apply) { 'Apply' } else { 'DryRun' }
$run = New-DpcRun -Task peer-cache -Mode $mode -OutputPath $OutputPath -SiteCode $SiteCode
$here = Get-Location
try {
    if ($Apply) {
        if (-not $ProviderMachineName) { throw '-Apply needs -ProviderMachineName.' }
        Connect-DpcSite -SiteCode $SiteCode -ProviderMachineName $ProviderMachineName
    }
    $rows = Invoke-DpcPlan -Plan $plan -Run $run -Apply:$Apply -Caller $PSCmdlet
} finally { Set-Location $here }
$null = Complete-DpcRun -Run $run -Summary @{ changes = $plan.Count }
Write-Output ("{0}: {1} changes ({2})" -f $mode, $plan.Count, (($rows | Group-Object Status | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
$rows | ForEach-Object { Write-Output "  $($_.Command)" }
Write-Output "Plan with rollbacks: $(Join-Path $run.Output 'plan.csv')"
