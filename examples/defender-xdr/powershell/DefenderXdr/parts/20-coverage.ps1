# Chapter 02 (guide G2): device state on the device, and onboarding coverage and sensor health against the
# inventory and the exception register.

# The device reader: replaced in tests. Live, the Windows cmdlets Learn names in the guide's Validate steps.
$script:DeviceReader = {
    $atp = 'HKLM:\SOFTWARE\Microsoft\Windows Advanced Threat Protection\Status'
    $svc = Get-Service -Name Sense -ErrorAction SilentlyContinue
    $reg = Get-ItemProperty -Path $atp -ErrorAction SilentlyContinue
    $cs = Get-MpComputerStatus
    $mp = Get-MpPreference
    $fw = @(Get-NetFirewallProfile -PolicyStore ActiveStore)
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    @{
        deviceName      = $env:COMPUTERNAME
        os              = "$($os.Caption)"
        isServer        = ("$($os.ProductType)" -ne '1')
        sense           = @{ status = $(if ($svc) { "$($svc.Status)" } else { 'NotInstalled' }) }
        onboardingState = $(if ($reg -and $reg.PSObject.Properties['OnboardingState']) { [int]$reg.OnboardingState } else { $null })
        senseVersion    = $(if ($reg -and $reg.PSObject.Properties['MsSenseDllVersion']) { "$($reg.MsSenseDllVersion)" } else { $null })
        computerStatus  = @{ IsTamperProtected = [bool]$cs.IsTamperProtected; RealTimeProtectionEnabled = [bool]$cs.RealTimeProtectionEnabled; AMRunningMode = "$($cs.AMRunningMode)"; AMProductVersion = "$($cs.AMProductVersion)" }
        preference      = @{
            EnableNetworkProtection            = [int]$mp.EnableNetworkProtection
            AllowNetworkProtectionOnWinServer  = [int]$mp.AllowNetworkProtectionOnWinServer
            AllowDatagramProcessingOnWinServer = [int]$mp.AllowDatagramProcessingOnWinServer
            EnableControlledFolderAccess       = [int]$mp.EnableControlledFolderAccess
            AttackSurfaceReductionRules_Ids     = @($mp.AttackSurfaceReductionRules_Ids | ForEach-Object { "$_".ToLowerInvariant() })
            AttackSurfaceReductionRules_Actions = @($mp.AttackSurfaceReductionRules_Actions | ForEach-Object { [int]$_ })
        }
        firewall        = @($fw | ForEach-Object { @{ Name = "$($_.Name)"; Enabled = "$($_.Enabled)"; DefaultInboundAction = "$($_.DefaultInboundAction)"; DefaultOutboundAction = "$($_.DefaultOutboundAction)" } })
    }
}

function Set-XdrDeviceReader {
    <#
    .SYNOPSIS
        Replaces the device reader (for tests). Returns the previous one.
    .EXAMPLE
        $old = Set-XdrDeviceReader -Reader { @{ deviceName = 'WKS-R0-01' } }
    #>
    param([Parameter(Mandatory)][scriptblock]$Reader)
    $old = $script:DeviceReader; $script:DeviceReader = $Reader; $old
}

function Get-XdrDeviceState {
    <#
    .SYNOPSIS
        Reads this device's Defender state, read-only: the Sense service (Learn's `sc query sense`), the
        onboarding state and sensor version in the registry, Get-MpComputerStatus, Get-MpPreference (network
        protection, controlled folder access, the ASR rules and their modes) and the firewall profiles as
        enforced. Windows only, live. Returns a hashtable the other checks read.
    .EXAMPLE
        Get-XdrDeviceState | ConvertTo-Json -Depth 5
    #>
    [CmdletBinding()]
    param()
    $s = & $script:DeviceReader
    $s.collectedAt = ConvertTo-XdrUtc ([DateTime]::UtcNow)
    $s
}

function Read-XdrDeviceStates {
    <#
    .SYNOPSIS
        Reads every device state file (*.json) in a folder, keyed by the short device name in capitals.
    .EXAMPLE
        Read-XdrDeviceStates -Path tests/fixtures/devices
    #>
    param([Parameter(Mandatory)][string]$Path)
    $h = [ordered]@{}
    foreach ($f in (Get-ChildItem -LiteralPath $Path -Filter '*.json' -File | Where-Object Name -NE 'manifest.json' | Sort-Object Name)) {
        $s = Read-XdrJson -Path $f.FullName
        $h[(Get-XdrShortName $s.deviceName)] = $s
    }
    $h
}

function Read-XdrInventory {
    <#
    .SYNOPSIS
        Reads the CM-8 inventory: DeviceName, Ring, Kind (workstation or server), Role, Owner, InScope,
        DeviceGroup and ManagedBy. Keyed by the short device name in capitals.
    .EXAMPLE
        Read-XdrInventory -Path tests/fixtures/inputs/inventory.csv
    #>
    param([Parameter(Mandatory)][string]$Path)
    $h = [ordered]@{}
    foreach ($r in Read-XdrCsv -Path $Path) { $h[(Get-XdrShortName $r.DeviceName)] = $r }
    $h
}

function Read-XdrExceptions {
    <#
    .SYNOPSIS
        Reads the exception register: Id, Scope, Subject, Reason, CompensatingControl, Approver, Expires.
        Adds Valid (approved and not past its expiry at -AsOf).
    .EXAMPLE
        Read-XdrExceptions -Path tests/fixtures/inputs/exceptions.csv -AsOf 2026-11-16T12:00:00Z
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$AsOf)
    $now = Get-XdrDate $AsOf
    foreach ($r in Read-XdrCsv -Path $Path) {
        $exp = if ("$($r.Expires)") { Get-XdrDate $r.Expires } else { $null }
        $r | Add-Member -NotePropertyName Valid -NotePropertyValue ([bool]("$($r.Approver)" -and $exp -and $exp -gt $now)) -Force -PassThru
    }
}

function Get-XdrCoverage {
    <#
    .SYNOPSIS
        Joins the DeviceInfo rows with the inventory and the exception register. Each in-scope device is
        Protected (onboarded, sensor active), NotActive, NotOnboarded, Excepted (a valid exception) or
        ExceptionExpired; a device Defender reports that the inventory doesn't list is NotInInventory, a
        CM-8 finding. Every status but Protected, Excepted and OutOfScope is a ticket.
    .EXAMPLE
        Get-XdrCoverage -Devices $rows -Inventory $inv -Exceptions $exc
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Devices, [Parameter(Mandatory)][Collections.IDictionary]$Inventory,
        [AllowEmptyCollection()][object[]]$Exceptions = @(), [string]$ConfigPath = (Join-Path $script:ConfigRoot 'coverage.json'))
    $cfg = Read-XdrJson -Path $ConfigPath
    $seen = @{}
    foreach ($d in $Devices) { $seen[(Get-XdrShortName (Get-XdrV $d 'DeviceName'))] = $d }
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($k in $Inventory.Keys) {
        $i = $Inventory[$k]; $d = $seen[$k]
        $ob = if ($d) { "$(Get-XdrV $d 'OnboardingStatus')" } else { '' }
        $sh = if ($d) { "$(Get-XdrV $d 'SensorHealthState')" } else { '' }
        $exc = @($Exceptions | Where-Object { $_.Scope -eq 'Device' -and (Get-XdrShortName $_.Subject) -eq $k })
        $status = if ("$($i.InScope)" -notmatch '^(?i)(yes|true|1)$') { 'OutOfScope' }
        elseif ($ob -in $cfg.onboardedValues -and $sh -in $cfg.activeValues) { 'Protected' }
        elseif (@($exc | Where-Object Valid).Count) { 'Excepted' }
        elseif ($exc.Count) { 'ExceptionExpired' }
        elseif ($ob -in $cfg.onboardedValues) { 'NotActive' }
        else { 'NotOnboarded' }
        $note = @()
        if ($ob -and $ob -notin $cfg.knownOnboardingValues) { $note += "unrecognized OnboardingStatus '$ob'" }
        if ($sh -and $sh -notin $cfg.knownSensorValues) { $note += "unrecognized SensorHealthState '$sh'" }
        if ($exc.Count) { $note += "exception $($exc[0].Id) ($($exc[0].Reason); expires $($exc[0].Expires))" }
        if (-not $d -and $status -notin 'OutOfScope', 'Excepted') { $note += 'not reported by Defender' }
        $rows.Add([pscustomobject][ordered]@{
                DeviceName = $k; Ring = "$($i.Ring)"; Kind = "$($i.Kind)"; Owner = "$($i.Owner)"
                OnboardingStatus = $(if ($ob) { $ob } else { '(none)' }); SensorHealthState = $(if ($sh) { $sh } else { '(none)' })
                Status = $status; Ticket = ($status -notin 'Protected', 'Excepted', 'OutOfScope'); Note = ($note -join '; ')
            })
    }
    foreach ($k in $seen.Keys) {
        if ($Inventory.Contains($k)) { continue }
        $d = $seen[$k]
        $rows.Add([pscustomobject][ordered]@{
                DeviceName = $k; Ring = ''; Kind = ''; Owner = ''
                OnboardingStatus = "$(Get-XdrV $d 'OnboardingStatus')"; SensorHealthState = "$(Get-XdrV $d 'SensorHealthState')"
                Status = 'NotInInventory'; Ticket = $true; Note = 'Defender reports a device the CM-8 inventory does not list'
            })
    }
    $rows.ToArray()
}

function Get-XdrCoverageByRing {
    <#
    .SYNOPSIS
        Coverage rows counted by ring: in scope, protected, not active, not onboarded, excepted, and the protected share.
    .EXAMPLE
        Get-XdrCoverageByRing -Rows $rows
    #>
    param([Parameter(Mandatory)][object[]]$Rows)
    foreach ($g in ($Rows | Where-Object { $_.Status -notin 'OutOfScope', 'NotInInventory' } | Group-Object Ring | Sort-Object Name)) {
        $p = @($g.Group | Where-Object Status -EQ 'Protected').Count
        $x = @($g.Group | Where-Object Status -EQ 'Excepted').Count
        [pscustomobject][ordered]@{
            Ring = $g.Name; InScope = $g.Count; Protected = $p; NotActive = @($g.Group | Where-Object Status -EQ 'NotActive').Count
            NotOnboarded = @($g.Group | Where-Object Status -In 'NotOnboarded', 'ExceptionExpired').Count; Excepted = $x
            ProtectedPercent = [math]::Round(100.0 * $p / $g.Count, 1)
        }
    }
}

function Invoke-XdrCoverageCheck {
    <#
    .SYNOPSIS
        Gate 2's check: runs the guide's coverage query (filed as raw/coverage-summary.json) and its per-device
        form, joins the devices with the inventory and the exception register, and writes coverage.csv,
        by-ring.csv, tickets.csv, summary.json and the manifest. Reads only.
    .EXAMPLE
        Invoke-XdrCoverageCheck -Settings $s -Invoker $inv -OutputPath out/coverage -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$InventoryPath, [string]$ExceptionsPath)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $null = Invoke-XdrHunting -Invoker $Invoker -Name coverage-summary -OutputPath $out
    $devices = @(Invoke-XdrHunting -Invoker $Invoker -Name coverage-devices -OutputPath $out)
    $inv = Read-XdrInventory -Path (Get-XdrInput -Settings $Settings -Name inventory -Override $InventoryPath)
    $exc = @(Read-XdrExceptions -Path (Get-XdrInput -Settings $Settings -Name exceptions -Override $ExceptionsPath) -AsOf $AsOf)
    $rows = @(Get-XdrCoverage -Devices $devices -Inventory $inv -Exceptions $exc)
    $ring = @(Get-XdrCoverageByRing -Rows $rows)
    $cols = 'DeviceName', 'Ring', 'Kind', 'Owner', 'OnboardingStatus', 'SensorHealthState', 'Status', 'Ticket', 'Note'
    Write-XdrCsv -Path (Join-Path $out 'coverage.csv') -Rows $rows -Columns $cols
    Write-XdrCsv -Path (Join-Path $out 'tickets.csv') -Rows @($rows | Where-Object Ticket) -Columns $cols
    Write-XdrCsv -Path (Join-Path $out 'by-ring.csv') -Rows $ring -Columns Ring, InScope, Protected, NotActive, NotOnboarded, Excepted, ProtectedPercent
    $inScope = @($rows | Where-Object { $_.Status -notin 'OutOfScope', 'NotInInventory' })
    $prot = @($rows | Where-Object Status -EQ 'Protected').Count
    $sum = [ordered]@{
        asOf = (ConvertTo-XdrUtc $AsOf); inScope = $inScope.Count; protected = $prot; excepted = @($rows | Where-Object Status -EQ 'Excepted').Count
        tickets = @($rows | Where-Object Ticket).Count; notInInventory = @($rows | Where-Object Status -EQ 'NotInInventory').Count
        protectedCoveragePercent = $(if ($inScope.Count) { [math]::Round(100.0 * $prot / $inScope.Count, 1) } else { 0 })
        byStatus = [ordered]@{}
    }
    foreach ($g in ($rows | Group-Object Status | Sort-Object Name)) { $sum.byStatus[$g.Name] = $g.Count }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $null = Write-XdrManifest -OutputPath $out -Task coverage -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($sum.tickets) { 'Fail' } else { 'Pass' }); protectedCoveragePercent = $sum.protectedCoveragePercent }
    [pscustomobject]@{ Rows = $rows; ByRing = $ring; Summary = $sum; OutputPath = $out }
}
