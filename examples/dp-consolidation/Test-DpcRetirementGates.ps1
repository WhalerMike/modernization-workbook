<#
.SYNOPSIS
    Step 9: judge the five retirement gates from an inventory run. Read-only. Exit code 0 when all five
    are closed, 2 when any is open.
.DESCRIPTION
    Gate 1, app content: ClientApps and OfficeClickToRun workloads at Intune, and no application or
    package deployment left in Configuration Manager.
    Gate 2, update content: WindowsUpdatePolicies and DeviceConfiguration at Intune, and the
    Configuration Manager software updates client setting Disabled.
    Gate 3, OS provisioning: no task sequence deployment and no PXE-enabled distribution point.
    Gate 4, caching role: no Connected Cache on distribution-point hardware.
    Gate 5, compliance evidence: no evidence source recorded as the Configuration Manager site database.
    Workload states and evidence sources come from the CSVs the inventory read (no cmdlet reads them).
.EXAMPLE
    ./Test-DpcRetirementGates.ps1 -InventoryPath out/inventory -OutputPath out/gates
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$InventoryPath,
    [string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$dps = Read-DpcRows -RunPath $InventoryPath -Name 'dp-inventory'
$apps = Read-DpcRows -RunPath $InventoryPath -Name 'applications'
$pkgs = Read-DpcRows -RunPath $InventoryPath -Name 'packages'
$work = Read-DpcRows -RunPath $InventoryPath -Name 'workloads'
$manifest = Get-Content -Raw (Join-Path $InventoryPath 'manifest.json') | ConvertFrom-Json
$state = @{}; foreach ($w in $work) { $state[$w.Setting] = $w.State }
function S($k) { if ($state.ContainsKey($k)) { $state[$k] } else { 'not recorded' } }

$appDeployments = 0; foreach ($a in $apps) { $appDeployments += [int]$a.Deployments }
$pkgDeployments = 0; foreach ($p in $pkgs) { $pkgDeployments += [int]$p.Deployments }
$pxe = @($dps | Where-Object { "$($_.IsPXE)" -eq 'True' } | ForEach-Object Server)
$mcc = @($dps | Where-Object { "$($_.ConnectedCache)" -eq 'True' } | ForEach-Object Server)
$tsDeployments = [int]$manifest.summary.taskSequenceDeployments
$siteDbEvidence = @($work | Where-Object { $_.Setting -like 'Evidence:*' -and $_.State -eq 'ConfigMgrSiteDatabase' } | ForEach-Object { $_.Setting.Substring(9) })

$gates = @(
    [pscustomobject]@{ Gate = '1. App content'; Closed = ((S 'ClientApps') -eq 'Intune' -and (S 'OfficeClickToRun') -eq 'Intune' -and $appDeployments -eq 0 -and $pkgDeployments -eq 0)
        Evidence = "ClientApps=$(S 'ClientApps'); OfficeClickToRun=$(S 'OfficeClickToRun'); application deployments=$appDeployments; package deployments=$pkgDeployments" }
    [pscustomobject]@{ Gate = '2. Update content'; Closed = ((S 'WindowsUpdatePolicies') -eq 'Intune' -and (S 'DeviceConfiguration') -eq 'Intune' -and (S 'SoftwareUpdatesClientSetting') -eq 'Disabled')
        Evidence = "WindowsUpdatePolicies=$(S 'WindowsUpdatePolicies'); DeviceConfiguration=$(S 'DeviceConfiguration'); SoftwareUpdatesClientSetting=$(S 'SoftwareUpdatesClientSetting')" }
    [pscustomobject]@{ Gate = '3. OS provisioning'; Closed = ($tsDeployments -eq 0 -and $pxe.Count -eq 0)
        Evidence = "task sequence deployments=$tsDeployments; PXE DPs=$($pxe.Count) $($pxe -join ', ')".Trim() }
    [pscustomobject]@{ Gate = '4. Caching role'; Closed = ($mcc.Count -eq 0 -and (S 'ConnectedCacheOnDP') -ne 'Yes')
        Evidence = "Connected Cache on DPs=$($mcc.Count) $($mcc -join ', '); recorded=$(S 'ConnectedCacheOnDP')".Trim() }
    [pscustomobject]@{ Gate = '5. Compliance evidence'; Closed = ($siteDbEvidence.Count -eq 0)
        Evidence = "controls still evidenced from the site database: $(if ($siteDbEvidence.Count) { $siteDbEvidence -join ', ' } else { 'none' })" }
)
$run = New-DpcRun -Task gates -Mode DryRun -OutputPath $OutputPath
Write-DpcEvidence -Run $run -Name 'gates' -Rows ($gates | Select-Object Gate, @{ n = 'Status'; e = { if ($_.Closed) { 'closed' } else { 'open' } } }, Evidence)
$open = @($gates | Where-Object { -not $_.Closed })
$null = Complete-DpcRun -Run $run -Summary @{ closed = 5 - $open.Count; open = $open.Count }
foreach ($g in $gates) { Write-Output ("  {0,-24} {1,-6}  {2}" -f $g.Gate, $(if ($g.Closed) { 'closed' } else { 'OPEN' }), $g.Evidence) }
Write-Output ("{0} of 5 gates closed. {1}" -f (5 - $open.Count), $(if ($open.Count) { 'Keep the hub tier.' } else { 'The last distribution point can retire (Step 9.3).' }))
Write-Output "Written to $($run.Output)"
if ($open.Count) { exit 2 } else { exit 0 }
