<#
.SYNOPSIS
    Step 3: build the hub tier. Plan, and with -Apply make, the pull distribution points at each hub,
    one distribution point group per hub, and the content distributed to each group. Dry run by default.
.DESCRIPTION
    For each hub in the hub design CSV: create the site system server (New-CMSiteSystemServer), add the
    distribution point role as a pull DP sourcing from the data center DPs in rank order
    (Add-CMDistributionPoint -EnablePullDP -SourceDistributionPoint -SourceDPRank), create the hub's
    distribution point group (New-CMDistributionPointGroup), add the hub DPs to it
    (Add-CMDistributionPointToGroup), and distribute every deployed application and package to the
    group (Start-CMContentDistribution).

    Without -Apply nothing is changed: the script writes plan.csv with the exact command for every
    change and its rollback. With -Apply it runs them in that order and stops at the first failure;
    -WhatIf with -Apply shows each change without making it.

    The role is added with a self-signed certificate (the cmdlet's default parameter set). For HTTPS
    with a PKI certificate, add the role in the console or with -CertificatePath, as Learn describes.
.EXAMPLE
    # Dry run on the Lab 1 inventory.
    ./New-DpcHubTier.ps1 -InventoryPath out/inventory -HubDesignCsv config/hub-design.example.csv -SiteCode LAB -OutputPath out/hub-plan
.EXAMPLE
    # Stage 1 (test hierarchy), Windows PowerShell 5.1 on a console machine.
    .\New-DpcHubTier.ps1 -InventoryPath .\out\inventory -HubDesignCsv .\config\hub-design.csv -SiteCode LAB -ProviderMachineName cm01.lab.example -Apply -OutputPath .\out\hub-apply
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$InventoryPath,
    [Parameter(Mandatory)][string]$HubDesignCsv,
    [Parameter(Mandatory)][string]$SiteCode,
    [string]$ProviderMachineName,
    [string]$OutputPath,
    [datetime]$CertificateExpirationTimeUtc = (Get-Date).ToUniversalTime().AddYears(2).Date,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$hubs = @(Import-Csv $HubDesignCsv)
$apps = @(Read-DpcRows -RunPath $InventoryPath -Name 'applications' | Where-Object { [int]$_.Deployments -gt 0 } | ForEach-Object Application)
$pkgs = @(Read-DpcRows -RunPath $InventoryPath -Name 'packages' | Where-Object { [int]$_.Deployments -gt 0 } | ForEach-Object PackageID)
$cert = $CertificateExpirationTimeUtc.ToString('yyyy-MM-dd')

$plan = New-Object System.Collections.ArrayList
foreach ($h in $hubs) {
    $group = "DPG-$($h.Hub)"
    $sources = @($h.SourceDPs -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim() })
    $ranks = @(1..$sources.Count)
    foreach ($dp in @($h.HubDPs -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim() })) {
        $null = $plan.Add((New-DpcPlanItem -Step '3.1 site system server' -Target $dp -Cmdlet 'New-CMSiteSystemServer' `
            -Parameters @{ SiteSystemServerName = $dp; SiteCode = $SiteCode } -Rollback "Remove-CMSiteSystemServer -SiteSystemServerName '$dp' -SiteCode '$SiteCode' -Force"))
        $null = $plan.Add((New-DpcPlanItem -Step '3.2 pull distribution point' -Target $dp -Cmdlet 'Add-CMDistributionPoint' `
            -Parameters @{ SiteSystemServerName = $dp; SiteCode = $SiteCode; CertificateExpirationTimeUtc = $cert; EnablePullDP = [switch]::Present; SourceDistributionPoint = $sources; SourceDPRank = $ranks } `
            -Rollback "Remove-CMDistributionPoint -SiteSystemServerName '$dp' -SiteCode '$SiteCode' -Force"))
    }
    $null = $plan.Add((New-DpcPlanItem -Step '3.3 distribution point group' -Target $group -Cmdlet 'New-CMDistributionPointGroup' `
        -Parameters @{ Name = $group; Description = "Hub tier: $($h.Region)" } -Rollback "Remove-CMDistributionPointGroup -Name '$group' -Force"))
    foreach ($dp in @($h.HubDPs -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim() })) {
        $null = $plan.Add((New-DpcPlanItem -Step '3.3 add to group' -Target $dp -Cmdlet 'Add-CMDistributionPointToGroup' `
            -Parameters @{ DistributionPointName = $dp; DistributionPointGroupName = $group } -Rollback "Remove $dp from $group in the console"))
    }
    if ($apps.Count) {
        $null = $plan.Add((New-DpcPlanItem -Step '3.4 distribute applications' -Target $group -Cmdlet 'Start-CMContentDistribution' `
            -Parameters @{ ApplicationName = $apps; DistributionPointGroupName = $group } -Rollback "Remove-CMContentDistribution -ApplicationName <names> -DistributionPointGroupName '$group' -Force"))
    }
    if ($pkgs.Count) {
        $null = $plan.Add((New-DpcPlanItem -Step '3.4 distribute packages' -Target $group -Cmdlet 'Start-CMContentDistribution' `
            -Parameters @{ PackageId = $pkgs; DistributionPointGroupName = $group } -Rollback "Remove-CMContentDistribution -PackageId <ids> -DistributionPointGroupName '$group' -Force"))
    }
}

$mode = if ($Apply) { 'Apply' } else { 'DryRun' }
$run = New-DpcRun -Task hub-tier -Mode $mode -OutputPath $OutputPath -SiteCode $SiteCode
$here = Get-Location
try {
    if ($Apply) {
        if (-not $ProviderMachineName) { throw '-Apply needs -ProviderMachineName.' }
        Connect-DpcSite -SiteCode $SiteCode -ProviderMachineName $ProviderMachineName
    }
    $rows = Invoke-DpcPlan -Plan @($plan) -Run $run -Apply:$Apply -Caller $PSCmdlet
} finally { Set-Location $here }
$null = Complete-DpcRun -Run $run -Summary @{ hubs = $hubs.Count; changes = $plan.Count }
Write-Output ("{0}: {1} changes for {2} hubs ({3})" -f $mode, $plan.Count, $hubs.Count, (($rows | Group-Object Status | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
$rows | Select-Object -First 3 | ForEach-Object { Write-Output "  $($_.Command)" }
Write-Output "Plan with rollbacks: $(Join-Path $run.Output 'plan.csv')"
