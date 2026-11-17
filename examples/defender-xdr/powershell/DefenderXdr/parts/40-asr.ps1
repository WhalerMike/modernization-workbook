# Chapter 04 (guide G4): Attack Surface Reduction through audit, warn and block, ring by ring.

function Get-XdrAsrRules {
    <#
    .SYNOPSIS
        The program's ASR rules (config/asr-rules.json), with the stage lengths and Learn's mode codes.
    .EXAMPLE
        (Get-XdrAsrRules).rules | Where-Object { -not $_.supportsWarn } | ForEach-Object name
    #>
    param([string]$Path = (Join-Path $script:ConfigRoot 'asr-rules.json'))
    Read-XdrJson -Path $Path
}

function Read-XdrAsrExclusions {
    <#
    .SYNOPSIS
        Reads the ASR exclusion and decision register: Id, RuleId (a rule GUID, or * for a global ASR
        exclusion), Path, Decision (exclude, fix or accept), Owner, Approver, Expires. Adds Valid.
    .EXAMPLE
        Read-XdrAsrExclusions -Path tests/fixtures/inputs/asr-exclusions.csv -AsOf 2026-11-16T12:00:00Z
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$AsOf)
    $now = Get-XdrDate $AsOf
    foreach ($r in Read-XdrCsv -Path $Path) {
        $exp = if ("$($r.Expires)") { Get-XdrDate $r.Expires } else { $null }
        $r | Add-Member -NotePropertyName Valid -NotePropertyValue ([bool]("$($r.Approver)" -and $exp -and $exp -gt $now)) -Force -PassThru
    }
}

function Test-XdrAsrHitCovered {
    <#
    .SYNOPSIS
        The valid exclusion or decision that covers an ASR audit hit (same rule or *, same file path or a containing folder ending in \), or nothing.
    .EXAMPLE
        Test-XdrAsrHitCovered -RuleId d4f940ab-401b-4efc-aadc-ad5f3c50688a -FolderPath 'C:\Tools.exe' -Register $reg
    #>
    # An audit hit is dispositioned when a valid register row names its rule (or *) and its path: the same
    # file path, or a folder path ending in \ that contains it. Case-insensitive, as Windows paths are.
    param([Parameter(Mandatory)][string]$RuleId, [AllowEmptyString()][string]$FolderPath, [AllowEmptyCollection()][object[]]$Register = @())
    foreach ($e in @($Register | Where-Object { $_.Valid -and ($_.RuleId -eq '*' -or $_.RuleId -ieq $RuleId) })) {
        $p = "$($e.Path)"
        if ($p -ieq $FolderPath) { return $e }
        if ($p.EndsWith('\') -and $FolderPath.StartsWith($p, [StringComparison]::OrdinalIgnoreCase)) { return $e }
    }
    $null
}

function Get-XdrAsrReadiness {
    <#
    .SYNOPSIS
        For each ring and rule in the agency's ASR plan: the current stage, days in it, audit hits on the
        ring's devices and how many have no exclusion or decision, and the next stage with whether the rule
        is ready for it. Audit needs the program's 30 days and no open hit; warn needs 14 days; a rule that
        doesn't support warn goes from audit to block. A plan that puts such a rule in warn is an error.
    .EXAMPLE
        Get-XdrAsrReadiness -Plan $plan -Events $events -Inventory $inv -Register $reg -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$Plan, [AllowEmptyCollection()][object[]]$Events = @(), [Parameter(Mandatory)][Collections.IDictionary]$Inventory,
        [AllowEmptyCollection()][object[]]$Register = @(), [Parameter(Mandatory)][string]$AsOf)
    $cat = Get-XdrAsrRules
    $now = Get-XdrDate $AsOf
    foreach ($ring in $Plan.rings.Keys) {
        $ringDevices = @($Inventory.Keys | Where-Object { "$($Inventory[$_].Ring)" -eq $ring })
        $cm = @($ringDevices | Where-Object { "$($Inventory[$_].ManagedBy)" -eq 'ConfigMgr' })
        $server = @($ringDevices | Where-Object { "$($Inventory[$_].Kind)" -eq 'server' }).Count -gt 0
        foreach ($rule in $cat.rules) {
            $p = $Plan.rings[$ring][$rule.id]
            $mode = if ($p) { "$($p.mode)" } else { 'notConfigured' }
            $since = if ($p -and $p.Contains('since') -and $p.since) { Get-XdrDate $p.since } else { $null }
            $days = if ($since) { [int][math]::Floor(($now - $since).TotalDays) } else { 0 }
            $hits = @($Events | Where-Object { "$(Get-XdrV $_ 'ActionType')" -eq $rule.audited -and (Get-XdrShortName (Get-XdrV $_ 'DeviceName')) -in $ringDevices })
            $open = @($hits | Where-Object { -not (Test-XdrAsrHitCovered -RuleId $rule.id -FolderPath "$(Get-XdrV $_ 'FolderPath')" -Register $Register) })
            $blocks = @($Events | Where-Object { "$(Get-XdrV $_ 'ActionType')" -eq $rule.blocked -and (Get-XdrShortName (Get-XdrV $_ 'DeviceName')) -in $ringDevices } | ForEach-Object { [int](Get-XdrV $_ 'Events') } | Measure-Object -Sum).Sum
            $notes = @()
            $next = $mode; $ready = $false; $status = 'Info'
            switch ($mode) {
                'notConfigured' { $next = 'audit'; $ready = $true; $notes += 'not started: begin in audit' }
                'off' { $next = 'audit'; $ready = $true; $notes += 'off: begin in audit' }
                'audit' {
                    $next = if ($rule.supportsWarn) { 'warn' } else { 'block' }
                    $ready = ($days -ge $cat.stageDays.audit -and -not $open.Count)
                    if ($days -lt $cat.stageDays.audit) { $notes += "$days of $($cat.stageDays.audit) audit days" }
                    if ($open.Count) { $notes += "$($open.Count) audit hit(s) with no exclusion or decision" }
                }
                'warn' {
                    if (-not $rule.supportsWarn) { $status = 'Fail'; $notes += 'this rule does not support warn: plan audit or block'; $next = 'block' }
                    else {
                        $next = 'block'; $ready = ($days -ge $cat.stageDays.warn -and -not $open.Count)
                        if ($days -lt $cat.stageDays.warn) { $notes += "$days of $($cat.stageDays.warn) warn days" }
                        if ($open.Count) { $notes += "$($open.Count) audit hit(s) with no exclusion or decision" }
                    }
                }
                'block' { $next = 'block'; $notes += 'in block' }
                default { $status = 'Fail'; $notes += "unknown mode '$mode'" }
            }
            if ($rule.id -eq 'd1e49aac-8f56-4280-b9ba-993a6d77406c' -and $cm.Count -and $mode -in 'audit', 'warn', 'block') { $status = 'Warn'; $notes += "Configuration Manager manages $($cm -join ', '): Microsoft says not to enable this rule there" }
            $allServers = $ringDevices.Count -and -not @($ringDevices | Where-Object { "$($Inventory[$_].Kind)" -ne 'server' }).Count
            if ($allServers -and -not $rule.windowsServer) { $status = 'NotApplicable'; $next = 'n/a'; $ready = $false; $notes = @('not supported on Windows Server') }
            elseif ($server -and -not $rule.windowsServer) { $notes += 'not supported on Windows Server: servers in this ring skip it' }
            if ($status -eq 'Info') { $status = if ($ready -and $mode -ne 'block') { 'Ready' } elseif ($mode -eq 'block') { 'Done' } else { 'Hold' } }
            [pscustomobject][ordered]@{
                Ring = $ring; RuleId = $rule.id; Rule = $rule.name; Mode = $mode; Days = $days; AuditHits = [int](@($hits | ForEach-Object { [int](Get-XdrV $_ 'Events') }) | Measure-Object -Sum).Sum
                OpenHits = $open.Count; Blocks = [int]$blocks; Next = $next; Status = $status; Note = ($notes -join '; ')
            }
        }
    }
}

function ConvertTo-XdrOmaUriValue {
    <#
    .SYNOPSIS
        The value of Learn's custom-profile OMA-URI ./Vendor/MSFT/Policy/Config/Defender/AttackSurfaceReductionRules
        for one ring: one '<rule GUID>=<mode code>' line per configured rule, as Intune takes it. Codes are
        Learn's: 0 off, 1 block, 2 audit, 6 warn. Rules not configured are left out.
    .EXAMPLE
        ConvertTo-XdrOmaUriValue -Modes @{ 'd4f940ab-401b-4efc-aadc-ad5f3c50688a' = 'warn' }
    #>
    param([Parameter(Mandatory)][Collections.IDictionary]$Modes)
    $codes = (Get-XdrAsrRules).modes
    $lines = foreach ($rule in (Get-XdrAsrRules).rules) {
        if (-not $Modes.Contains($rule.id)) { continue }
        $m = "$($Modes[$rule.id])"
        if ($m -eq 'notConfigured') { continue }
        if (-not $codes.Contains($m)) { throw "Unknown ASR mode '$m'." }
        '{0}={1}' -f $rule.id, $codes[$m]
    }
    (@($lines) -join "`n") + "`n"
}

function Get-XdrAsrDeviceFinding {
    <#
    .SYNOPSIS
        Compares what each device reports (Get-MpPreference's rule IDs and actions) with its ring's plan, for
        the rules that apply to it. Catches Learn's known Windows Server issue, where the compliance report
        shows a rule as applied that the device doesn't enforce, and a device configured outside Intune.
    .EXAMPLE
        Get-XdrAsrDeviceFinding -States $states -Inventory $inv -Plan $plan
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][Collections.IDictionary]$States, [Parameter(Mandatory)][Collections.IDictionary]$Inventory, [Parameter(Mandatory)][Collections.IDictionary]$Plan)
    $cat = Get-XdrAsrRules
    foreach ($k in $States.Keys) {
        if (-not $Inventory.Contains($k)) { continue }
        $ring = "$($Inventory[$k].Ring)"; $server = "$($Inventory[$k].Kind)" -eq 'server'
        if (-not $Plan.rings.Contains($ring)) { continue }
        $ids = @($States[$k].preference.AttackSurfaceReductionRules_Ids | ForEach-Object { "$_".ToLowerInvariant() })
        $acts = @($States[$k].preference.AttackSurfaceReductionRules_Actions)
        foreach ($rule in $cat.rules) {
            if ($server -and -not $rule.windowsServer) { continue }
            $p = $Plan.rings[$ring][$rule.id]
            $want = if ($p) { "$($p.mode)" } else { 'notConfigured' }
            $i = [array]::IndexOf($ids, $rule.id)
            $code = if ($i -ge 0 -and $i -lt $acts.Count) { [int]$acts[$i] } else { $null }
            $have = if ($null -eq $code) { 'notConfigured' } else { @($cat.modes.Keys | Where-Object { $cat.modes[$_] -eq $code })[0] }
            if ($want -eq 'notConfigured' -and $have -eq 'notConfigured') { continue }
            [pscustomobject][ordered]@{ DeviceName = $k; Ring = $ring; RuleId = $rule.id; Rule = $rule.name; Planned = $want; Device = $have; Status = $(if ($want -eq $have) { 'Pass' } else { 'Fail' }) }
        }
    }
}

function Invoke-XdrAsrCheck {
    <#
    .SYNOPSIS
        Gate 4's check: the rule-by-ring matrix, each rule's readiness for its next stage from the audit hits
        and the exclusion register, the OMA-URI value for each ring now and at its next stage, expired
        exclusions, and what each device actually enforces. Runs the guide's ASR query (filed as raw/) and its
        per-device form. Writes matrix.csv, readiness.csv, device-checks.csv, exclusions-expired.csv,
        oma-uri/, summary.json and the manifest. Reads only: the next-stage values are for a person to put in
        Intune under a change record.
    .EXAMPLE
        Invoke-XdrAsrCheck -Settings $s -Invoker $inv -OutputPath out/asr -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$PlanPath, [string]$ExclusionsPath, [string]$DeviceStatePath, [string]$InventoryPath)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $plan = Read-XdrJson -Path (Get-XdrInput -Settings $Settings -Name asrPlan -Override $PlanPath)
    $reg = @(Read-XdrAsrExclusions -Path (Get-XdrInput -Settings $Settings -Name asrExclusions -Override $ExclusionsPath) -AsOf $AsOf)
    $inv = Read-XdrInventory -Path (Get-XdrInput -Settings $Settings -Name inventory -Override $InventoryPath)
    $states = Read-XdrDeviceStates -Path (Get-XdrInput -Settings $Settings -Name deviceStates -Override $DeviceStatePath)
    $null = Invoke-XdrHunting -Invoker $Invoker -Name asr-events -OutputPath $out
    $events = @(Invoke-XdrHunting -Invoker $Invoker -Name asr-events-by-device -OutputPath $out)
    $ready = @(Get-XdrAsrReadiness -Plan $plan -Events $events -Inventory $inv -Register $reg -AsOf $AsOf)
    $dev = @(Get-XdrAsrDeviceFinding -States $states -Inventory $inv -Plan $plan)
    $cat = Get-XdrAsrRules
    $rings = @($plan.rings.Keys)
    $matrix = foreach ($rule in $cat.rules) {
        $row = [ordered]@{ RuleId = $rule.id; Rule = $rule.name; Warn = $(if ($rule.supportsWarn) { 'yes' } else { 'no' }) }
        foreach ($r in $rings) { $row[$r] = @($ready | Where-Object { $_.Ring -eq $r -and $_.RuleId -eq $rule.id })[0].Mode }
        [pscustomobject]$row
    }
    Write-XdrCsv -Path (Join-Path $out 'matrix.csv') -Rows @($matrix) -Columns (@('RuleId', 'Rule', 'Warn') + $rings)
    Write-XdrCsv -Path (Join-Path $out 'readiness.csv') -Rows $ready -Columns Ring, RuleId, Rule, Mode, Days, AuditHits, OpenHits, Blocks, Next, Status, Note
    Write-XdrCsv -Path (Join-Path $out 'device-checks.csv') -Rows $dev -Columns DeviceName, Ring, RuleId, Rule, Planned, Device, Status
    $expired = @($reg | Where-Object { -not $_.Valid })
    Write-XdrCsv -Path (Join-Path $out 'exclusions-expired.csv') -Rows $expired -Columns Id, RuleId, Path, Decision, Owner, Approver, Expires
    foreach ($r in $rings) {
        $now = [ordered]@{}; $nxt = [ordered]@{}
        foreach ($x in @($ready | Where-Object Ring -EQ $r)) { $now[$x.RuleId] = $x.Mode; $nxt[$x.RuleId] = $(if ($x.Status -eq 'Ready') { $x.Next } else { $x.Mode }) }
        Write-XdrText -Path (Join-Path $out "oma-uri/$r.txt") -Text (ConvertTo-XdrOmaUriValue -Modes $now)
        Write-XdrText -Path (Join-Path $out "oma-uri/$r-next.txt") -Text (ConvertTo-XdrOmaUriValue -Modes $nxt)
    }
    $sum = [ordered]@{
        asOf = (ConvertTo-XdrUtc $AsOf); rings = $rings; ready = @($ready | Where-Object Status -EQ 'Ready').Count; hold = @($ready | Where-Object Status -EQ 'Hold').Count
        done = @($ready | Where-Object Status -EQ 'Done').Count; planErrors = @($ready | Where-Object Status -EQ 'Fail').Count; warnings = @($ready | Where-Object Status -EQ 'Warn').Count
        deviceMismatches = @($dev | Where-Object Status -EQ 'Fail').Count; expiredExclusions = $expired.Count
        devicesAllBlock = @($dev | Group-Object DeviceName | Where-Object { -not @($_.Group | Where-Object Device -NE 'block').Count } | ForEach-Object Name)
    }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $bad = $sum.planErrors + $sum.deviceMismatches + $sum.expiredExclusions
    $null = Write-XdrManifest -OutputPath $out -Task asr -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($bad) { 'Fail' } else { 'Pass' }) }
    [pscustomobject]@{ Readiness = $ready; Devices = $dev; Matrix = @($matrix); Summary = $sum; OutputPath = $out }
}
