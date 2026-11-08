<#
.SYNOPSIS
    Step 1: size the hub tier from the inventory against Microsoft's published limits, and order the
    offices into retirement waves by circuit readiness and renewal date. Read-only.
.DESCRIPTION
    Reads an inventory run (Invoke-DpcInventory.ps1) and a hub design CSV (config/hub-design.example.csv).
    For each hub: the clients its region's offices hold, the distribution points needed at the
    4,000-clients-per-DP limit, at the target utilization, and planned (never fewer than -MinPerHub).
    Checks the site limits (250 standard DPs per site, 2,000 more as pull DPs). Orders offices into a
    pilot wave and later waves: offices whose circuit is ready go first, by renewal date.
    Writes sizing.csv, waves.csv and a manifest. The numbers are planning inputs, not a design.
.EXAMPLE
    ./Get-DpcSizing.ps1 -InventoryPath out/inventory -HubDesignCsv config/hub-design.example.csv -OutputPath out/sizing
.EXAMPLE
    ./Get-DpcSizing.ps1 -InventoryPath out/inventory -HubDesignCsv config/hub-design.csv -TargetUtilization 0.7 -PilotOffices 3 -OutputPath out/sizing
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$InventoryPath,
    [Parameter(Mandatory)][string]$HubDesignCsv,
    [string]$OutputPath,
    [int]$ClientsPerDp = 4000,
    [ValidateRange(0.1, 1.0)][double]$TargetUtilization = 0.75,
    [int]$MinPerHub = 2,
    [int]$MinCircuitMbps = 100,
    [int]$MaxPeakUtilPct = 70,
    [int]$PilotOffices = 2,
    [int]$Waves = 3
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$dps = Read-DpcRows -RunPath $InventoryPath -Name 'dp-inventory'
$bgs = Read-DpcRows -RunPath $InventoryPath -Name 'boundary-groups'
$offices = Read-DpcRows -RunPath $InventoryPath -Name 'offices'
$hubs = @(Import-Csv $HubDesignCsv)
$clientsByBg = @{}; foreach ($g in $bgs) { $clientsByBg[$g.BoundaryGroup] = [int]$g.Clients }
$totalClients = 0; foreach ($g in $bgs) { $totalClients += [int]$g.Clients }

$run = New-DpcRun -Task sizing -Mode DryRun -OutputPath $OutputPath
$rows = foreach ($h in $hubs) {
    $regionOffices = @($offices | Where-Object Region -EQ $h.Region)
    $clients = 0; foreach ($o in $regionOffices) { $clients += [int]$clientsByBg[$o.BoundaryGroup] }
    $atLimit = [math]::Ceiling($clients / $ClientsPerDp)
    $atTarget = [math]::Ceiling($clients / ($ClientsPerDp * $TargetUtilization))
    $planned = [math]::Max($MinPerHub, $atTarget)
    [pscustomobject]@{
        Hub = $h.Hub; Region = $h.Region; Offices = $regionOffices.Count; Clients = $clients
        DPsAtLimit = $atLimit; DPsAtTarget = $atTarget; DPsPlanned = $planned
        ClientsPerPlannedDP = if ($planned) { [math]::Round($clients / $planned) } else { 0 }
        LoadPctOfLimit = if ($planned) { [math]::Round(100 * $clients / ($planned * $ClientsPerDp), 1) } else { 0 }
        HubDPs = $h.HubDPs; SourceDPs = $h.SourceDPs
    }
}
$hubDps = 0; foreach ($r in $rows) { $hubDps += $r.DPsPlanned }
$sourceDps = @($hubs | ForEach-Object { $_.SourceDPs -split ';' } | Where-Object { $_ } | ForEach-Object { $_.Trim().ToLowerInvariant() } | Sort-Object -Unique).Count
$officeDps = @($dps | Where-Object Tier -EQ 'office').Count
$fleetAtLimit = [math]::Ceiling($totalClients / $ClientsPerDp)
$fleetAtTarget = [math]::Ceiling($totalClients / ($ClientsPerDp * $TargetUtilization))
$rows += [pscustomobject]@{
    Hub = 'TOTAL'; Region = ''; Offices = @($offices).Count; Clients = $totalClients
    DPsAtLimit = $fleetAtLimit; DPsAtTarget = $fleetAtTarget; DPsPlanned = $hubDps + $sourceDps
    ClientsPerPlannedDP = ''; LoadPctOfLimit = [math]::Round(100 * $totalClients / (($hubDps + $sourceDps) * $ClientsPerDp), 1)
    HubDPs = "$hubDps pull DPs at hubs"; SourceDPs = "$sourceDps source DPs"
}

# Office waves: ready circuits first, each group by renewal date.
$ordered = @($offices | ForEach-Object {
    $ready = ([int]$_.CircuitMbps -ge $MinCircuitMbps) -and ([int]$_.PeakUtilPct -le $MaxPeakUtilPct)
    [pscustomobject]@{ Office = $_.Office; Region = $_.Region; OfficeDP = $_.OfficeDP; BoundaryGroup = $_.BoundaryGroup
        Clients = [int]$clientsByBg[$_.BoundaryGroup]; CircuitMbps = [int]$_.CircuitMbps; PeakUtilPct = [int]$_.PeakUtilPct
        RenewalDate = $_.RenewalDate; CircuitReady = $ready }
} | Sort-Object @{ Expression = 'CircuitReady'; Descending = $true }, RenewalDate, Office)
$rest = [math]::Max(0, $ordered.Count - $PilotOffices)
$perWave = if ($Waves -gt 0) { [math]::Ceiling($rest / $Waves) } else { $rest }
$i = 0
$waveRows = foreach ($o in $ordered) {
    $wave = if ($i -lt $PilotOffices) { 'Pilot' } else { 'Wave ' + ([math]::Floor(($i - $PilotOffices) / [math]::Max(1, $perWave)) + 2) }
    $i++
    $o | Add-Member -NotePropertyName Wave -NotePropertyValue $wave -PassThru |
        Add-Member -NotePropertyName Note -NotePropertyValue $(if ($o.CircuitReady) { '' } else { "Circuit below $MinCircuitMbps Mbps or peak above $MaxPeakUtilPct%: upgrade first, or prove peers carry it" }) -PassThru
}

$checks = @(
    [pscustomobject]@{ Check = 'Standard DPs per site (limit 250)'; Value = $sourceDps; Pass = ($sourceDps -le 250) }
    [pscustomobject]@{ Check = 'Pull DPs per site (limit 2,000)'; Value = $hubDps; Pass = ($hubDps -le 2000) }
    [pscustomobject]@{ Check = 'Every hub under 80% of the per-DP limit'; Value = (($rows | Where-Object Hub -NE 'TOTAL' | Measure-Object LoadPctOfLimit -Maximum).Maximum); Pass = (@($rows | Where-Object { $_.Hub -ne 'TOTAL' -and $_.LoadPctOfLimit -gt 80 }).Count -eq 0) }
)
Write-DpcEvidence -Run $run -Name 'sizing' -Rows (@($rows) + @($checks | ForEach-Object { [pscustomobject]@{ Hub = 'CHECK'; Region = $_.Check; Offices = ''; Clients = ''; DPsAtLimit = ''; DPsAtTarget = ''; DPsPlanned = $_.Value; ClientsPerPlannedDP = ''; LoadPctOfLimit = ''; HubDPs = $(if ($_.Pass) { 'pass' } else { 'FAIL' }); SourceDPs = '' } }))
Write-DpcEvidence -Run $run -Name 'waves' -Rows $waveRows
$null = Complete-DpcRun -Run $run -Summary @{ clients = $totalClients; dpsAtLimit = $fleetAtLimit; dpsPlanned = $hubDps + $sourceDps; officeDpsToRetire = $officeDps }

Write-Output ("Clients: {0}. At {1} per DP: {2} DPs at the limit, {3} at {4:P0} utilization." -f $totalClients, $ClientsPerDp, $fleetAtLimit, $fleetAtTarget, $TargetUtilization)
foreach ($r in ($rows | Where-Object Hub -NE 'TOTAL')) { Write-Output ("  {0} ({1}): {2} offices, {3} clients, {4} pull DPs planned, {5}% of the limit per DP" -f $r.Hub, $r.Region, $r.Offices, $r.Clients, $r.DPsPlanned, $r.LoadPctOfLimit) }
Write-Output ("Planned tier: {0} pull DPs at hubs + {1} source DPs = {2}; office DPs to retire: {3}" -f $hubDps, $sourceDps, ($hubDps + $sourceDps), $officeDps)
foreach ($c in $checks) { Write-Output ("Check: {0}: {1} ({2})" -f $c.Check, $(if ($c.Pass) { 'pass' } else { 'FAIL' }), $c.Value) }
Write-Output ("Waves: " + (($waveRows | Group-Object Wave | ForEach-Object { "$($_.Name)=" + (($_.Group | ForEach-Object Office) -join ',') }) -join '; '))
Write-Output "Written to $($run.Output)"
