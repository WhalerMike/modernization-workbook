# Chapter 03 (guide G3): each device's prevention settings against the stage its ring is at, and the fleet's
# audit and block events.

function Get-XdrPreventionFinding {
    <#
    .SYNOPSIS
        Compares one device's state with its ring's stage (the agency's prevention plan): real-time and tamper
        protection on, Defender Antivirus in active mode, network protection and controlled folder access at
        the stage's mode, every firewall profile on with inbound blocked, and on Windows Server the network
        protection and datagram settings Learn names. Returns one row per check.
    .EXAMPLE
        Get-XdrPreventionFinding -State $state -Device $inventoryRow -Plan $plan
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$State, [Parameter(Mandatory)]$Device, [Parameter(Mandatory)][Collections.IDictionary]$Plan,
        [string]$ConfigPath = (Join-Path $script:ConfigRoot 'prevention.json'))
    $cfg = Read-XdrJson -Path $ConfigPath
    $ring = "$($Device.Ring)"
    if (-not $Plan.rings.Contains($ring)) { throw "The prevention plan has no stage for $ring." }
    $stage = $Plan.rings[$ring]
    $name = Get-XdrShortName $State.deviceName
    $server = ("$($Device.Kind)" -eq 'server')
    $cs = $State.computerStatus; $mp = $State.preference
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($check, $expected, $actual) $rows.Add([pscustomobject][ordered]@{ DeviceName = $name; Ring = $ring; Check = $check; Expected = "$expected"; Actual = "$actual"; Status = $(if ("$expected" -eq "$actual") { 'Pass' } else { 'Fail' }) }) }
    & $add 'RealTimeProtection' 'True' "$($cs.RealTimeProtectionEnabled)"
    & $add 'TamperProtection' 'True' "$($cs.IsTamperProtected)"
    & $add 'AntivirusMode' 'Normal' "$($cs.AMRunningMode)"
    & $add 'NetworkProtection' "$($cfg.networkProtection[$stage.networkProtection]) ($($stage.networkProtection))" "$($mp.EnableNetworkProtection) ($(@($cfg.networkProtection.Keys | Where-Object { $cfg.networkProtection[$_] -eq [int]$mp.EnableNetworkProtection })[0]))"
    & $add 'ControlledFolderAccess' "$($cfg.controlledFolderAccess[$stage.controlledFolderAccess]) ($($stage.controlledFolderAccess))" "$($mp.EnableControlledFolderAccess) ($(@($cfg.controlledFolderAccess.Keys | Where-Object { $cfg.controlledFolderAccess[$_] -eq [int]$mp.EnableControlledFolderAccess })[0]))"
    if ($server) {
        & $add 'NetworkProtectionOnServer' '1' "$($mp.AllowNetworkProtectionOnWinServer)"
        if ("$($Device.Role)" -in @($cfg.highUdpRoles)) { & $add "DatagramProcessing ($($Device.Role) role)" '0' "$($mp.AllowDatagramProcessingOnWinServer)" }
    }
    foreach ($p in @($State.firewall)) {
        & $add "Firewall $($p.Name)" 'True/Block' "$($p.Enabled)/$($p.DefaultInboundAction)"
    }
    $rows.ToArray()
}

function Invoke-XdrPreventionCheck {
    <#
    .SYNOPSIS
        Gate 3's check: every device state file against its ring's stage in the prevention plan, and the
        guide's audit and block event query. Writes device-checks.csv, drift.csv, events.csv, summary.json and
        the manifest. A device in the inventory with no state file is listed as missing. Reads only.
    .EXAMPLE
        Invoke-XdrPreventionCheck -Settings $s -Invoker $inv -OutputPath out/prevention -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$DeviceStatePath, [string]$PlanPath, [string]$InventoryPath)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $states = Read-XdrDeviceStates -Path (Get-XdrInput -Settings $Settings -Name deviceStates -Override $DeviceStatePath)
    $plan = Read-XdrJson -Path (Get-XdrInput -Settings $Settings -Name prevention -Override $PlanPath)
    $inv = Read-XdrInventory -Path (Get-XdrInput -Settings $Settings -Name inventory -Override $InventoryPath)
    $rows = [Collections.Generic.List[object]]::new(); $missing = @()
    foreach ($k in $inv.Keys) {
        if ("$($inv[$k].InScope)" -notmatch '^(?i)(yes|true|1)$') { continue }
        if (-not $states.Contains($k)) { $missing += $k; continue }
        foreach ($r in Get-XdrPreventionFinding -State $states[$k] -Device $inv[$k] -Plan $plan) { $rows.Add($r) }
    }
    $events = @(Invoke-XdrHunting -Invoker $Invoker -Name prevention-events -OutputPath $out)
    $ev = @($events | ForEach-Object { [pscustomobject][ordered]@{ ActionType = "$(Get-XdrV $_ 'ActionType')"; Events = [int](Get-XdrV $_ 'Events'); Devices = [int](Get-XdrV $_ 'Devices') } })
    $cols = 'DeviceName', 'Ring', 'Check', 'Expected', 'Actual', 'Status'
    Write-XdrCsv -Path (Join-Path $out 'device-checks.csv') -Rows $rows -Columns $cols
    $drift = @($rows | Where-Object Status -EQ 'Fail')
    Write-XdrCsv -Path (Join-Path $out 'drift.csv') -Rows $drift -Columns $cols
    Write-XdrCsv -Path (Join-Path $out 'events.csv') -Rows $ev -Columns ActionType, Events, Devices
    $sum = [ordered]@{
        asOf = (ConvertTo-XdrUtc $AsOf); devicesChecked = @($rows | Select-Object -ExpandProperty DeviceName -Unique).Count; checks = $rows.Count
        drift = $drift.Count; devicesWithDrift = @($drift | Select-Object -ExpandProperty DeviceName -Unique); noStateFile = $missing
        blocked = @($ev | Where-Object { $_.ActionType -like '*Blocked' } | Measure-Object Events -Sum).Sum
        audited = @($ev | Where-Object { $_.ActionType -like '*Audited' } | Measure-Object Events -Sum).Sum
        tamperingAttempts = @($ev | Where-Object ActionType -EQ 'TamperingAttempt' | Measure-Object Events -Sum).Sum
    }
    foreach ($k in 'blocked', 'audited', 'tamperingAttempts') { if ($null -eq $sum[$k]) { $sum[$k] = 0 } }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $null = Write-XdrManifest -OutputPath $out -Task prevention -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($drift.Count -or $missing.Count) { 'Fail' } else { 'Pass' }) }
    [pscustomobject]@{ Rows = $rows.ToArray(); Drift = $drift; Events = $ev; Summary = $sum; OutputPath = $out }
}
