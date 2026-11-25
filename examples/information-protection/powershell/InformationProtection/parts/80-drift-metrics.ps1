# Chapter 08 (Book 20, Chapter 12): drift between two exports, explained or not by a change ticket, and the metrics.

function Compare-IpItem {
    <#
    .SYNOPSIS
        Differences between two lists of exported items, matched by name: added, removed, and each listed
        property whose value changed. Lists compare as sorted, joined text.
    .EXAMPLE
        Compare-IpItem -Old $a.labels -New $b.labels -Properties EncryptionEnabled, EncryptionRightsDefinitions
    #>
    param([AllowNull()][object[]]$Old, [AllowNull()][object[]]$New, [Parameter(Mandatory)][string[]]$Properties, [string]$Key = 'Name')
    $text = { param($v) if ($v -is [Collections.IList] -and $v -isnot [string]) { (@($v | ForEach-Object { if ($_ -is [string]) { $_ } else { "$(Get-IpV $_ 'Name', 'DisplayName')" } }) | Sort-Object) -join '; ' } else { "$v" } }
    # A tenant-wide setting (one object, no name; its key in config/drift.json is "_") is the item "(tenant)".
    $name = { param($i) $v = "$(Get-IpV $i $Key)"; if ($v) { $v } else { '(tenant)' } }
    $o = @{}; foreach ($i in @($Old | Where-Object { $_ })) { $o[(& $name $i)] = $i }
    $n = @{}; foreach ($i in @($New | Where-Object { $_ })) { $n[(& $name $i)] = $i }
    foreach ($k in (@($o.Keys) + @($n.Keys) | Sort-Object -Unique)) {
        if (-not $n.Contains($k)) { [pscustomobject]@{ Item = $k; Property = '(item)'; Old = 'present'; New = 'removed' }; continue }
        if (-not $o.Contains($k)) { [pscustomobject]@{ Item = $k; Property = '(item)'; Old = 'absent'; New = 'added' }; continue }
        foreach ($p in $Properties) {
            $a = & $text (Get-IpV $o[$k] $p); $b = & $text (Get-IpV $n[$k] $p)
            if ($a -cne $b) { [pscustomobject]@{ Item = $k; Property = $p; Old = $a; New = $b } }
        }
    }
}

function Invoke-IpDrift {
    <#
    .SYNOPSIS
        Compares today's export with the last approved one and classifies every difference with Book 20,
        Chapter 12's drift signals (config/drift.json): a policy out of enforcement, label rights widened or
        encryption off, a label or scope removed from a policy, the super user feature on, audit off, a Copilot
        policy changed. A difference a change ticket explains (inputs.changes: the file, the item, approved
        between the two exports) passes; one that none explains fails. Writes results.csv and drift.csv.
    .EXAMPLE
        Invoke-IpDrift -Settings $s -BaselinePath tests/fixtures/snapshots/2026-10-24 -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/drift -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$BaselinePath, [Parameter(Mandatory)][string]$SnapshotPath,
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $cfg = Read-IpJson -Path (Join-Path $script:ConfigRoot 'drift.json')
    $plan = Get-IpPlan -Settings $Settings
    $copilot = @($plan.copilotPolicies | Where-Object { $_ })
    $a = Read-IpSnapshot -Path $BaselinePath; $b = Read-IpSnapshot -Path $SnapshotPath
    $from = Get-IpDate (Read-IpJson -Path (Join-Path $BaselinePath 'manifest.json')).asOf
    $to = Get-IpDate (Read-IpJson -Path (Join-Path $SnapshotPath 'manifest.json')).asOf
    $changes = @(Read-IpCsv -Path (Get-IpInput -Settings $Settings -Name changes))
    $all = [Collections.Generic.List[object]]::new()
    foreach ($w in @($cfg.watch)) {
        foreach ($d in @(Compare-IpItem -Old @($a[$w.read]) -New @($b[$w.read]) -Properties @($w.properties) -Key $(if ($w.Contains('key')) { $w.key } else { 'Name' }))) {
            $signal = $w.signal; $sev = $w.severity
            if ($w.Contains('raiseWhen')) { foreach ($r in @($w.raiseWhen)) { if ($d.Property -eq $r.property -and $d.New -match $r.newMatches -and (-not $r.Contains('oldMatches') -or $d.Old -match $r.oldMatches)) { $signal = $r.signal; $sev = $r.severity } } }
            if ($w.read -in 'dlpPolicies', 'dlpRules' -and ($d.Item -in $copilot -or (@($b[$w.read] | Where-Object { $_ -and "$(Get-IpV $_ 'Name')" -eq $d.Item -and "$(Get-IpV $_ 'ParentPolicyName', 'Policy')" -in $copilot }).Count))) { $signal = 'copilot'; $sev = 'P2' }
            $file = (Get-IpCall -Id $w.read).file
            $t = ($changes | Where-Object { $_.file -eq $file -and $_.item -eq $d.Item -and (Get-IpDate $_.approved) -ge $from -and (Get-IpDate $_.approved) -le $to } | Select-Object -First 1)
            $all.Add([pscustomobject]@{ File = $file; Item = $d.Item; Property = $d.Property; Old = $d.Old; New = $d.New; Signal = $signal; Severity = $sev; Ticket = $(if ($t) { $t.id } else { '' }) })
        }
    }
    $rows = [Collections.Generic.List[object]]::new()
    $n = 0
    foreach ($x in $all) {
        $n++
        $sig = $cfg.signals[$x.Signal]
        $st = if ($x.Ticket) { 'Pass' } elseif ($x.Severity -eq 'info') { 'Info' } else { 'Fail' }
        $rows.Add((New-IpCheck -Id ('DRIFT-{0:d2}' -f $n) -Status $st -Subject "$($x.File): $($x.Item)" -Detail ("$($x.Property): '$($x.Old)' -> '$($x.New)'; $($sig.title) ($($x.Severity))" + $(if ($x.Ticket) { "; explained by $($x.Ticket)" } elseif ($st -eq 'Fail') { "; no change ticket: $($sig.action)" } else { '' }))))
    }
    if (-not $all.Count) { $rows.Add((New-IpCheck -Id 'DRIFT-00' -Status Pass -Subject 'Drift' -Detail 'no differences between the two exports')) }
    Write-IpCsv -Path (Join-Path $out 'drift.csv') -Rows $all.ToArray() -Columns File, Item, Property, Old, New, Signal, Severity, Ticket
    $run = Complete-IpRun -Task drift -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
    $run
}

function Invoke-IpMetrics {
    <#
    .SYNOPSIS
        The Book 20, Chapter 12 metrics a month's run folders can give: plan conformance by check, M8
        synthetic events found in time, M11 unexplained drift and M12 expired exceptions. Every other metric is
        listed with where its data comes from, as "not computed by the kit", never as zero. Writes metrics.json
        and metrics.md.
    .EXAMPLE
        Invoke-IpMetrics -Settings $s -RunRoot out/month -OutputPath out/month/metrics -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$RunRoot, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $res = { param($task) $f = Join-Path $RunRoot "$task/results.csv"; if (Test-Path -LiteralPath $f) { , @(Import-Csv -LiteralPath $f) } else { $null } }
    $m = [Collections.Generic.List[object]]::new()
    foreach ($t in 'access', 'inventory', 'labels', 'protection', 'dlp', 'autolabel', 'audit') {
        $r = & $res $t
        $v = if ($null -eq $r) { 'not run' } else { $p = @($r | Where-Object Status -EQ 'Pass').Count; $f = @($r | Where-Object Status -EQ 'Fail').Count; "$p of $($p + $f) checks pass" }
        $m.Add([pscustomobject][ordered]@{ Metric = "Plan conformance: $t"; Value = $v; Source = "$t/results.csv" })
    }
    $au = & $res 'audit'
    $syn = @($au | Where-Object { $_.Id -like 'SYN-*' -and $_.Id -ne 'SYN-00' })
    $m.Add([pscustomobject][ordered]@{ Metric = 'M8 Audit-search success for synthetic events'; Value = $(if ($null -eq $au) { 'not run' } elseif (-not $syn.Count) { 'no synthetic search this run' } else { "$(@($syn | Where-Object Status -EQ 'Pass').Count) of $($syn.Count)" }); Source = 'audit/results.csv' })
    $dr = & $res 'drift'
    $m.Add([pscustomobject][ordered]@{ Metric = 'M11 Unexplained drift'; Value = $(if ($null -eq $dr) { 'not run' } else { "$(@($dr | Where-Object Status -EQ 'Fail').Count)" }); Source = 'drift/results.csv' })
    $now = Get-IpDate $AsOf
    $reg = @(Read-IpCsv -Path (Get-IpInput -Settings $Settings -Name exceptions))
    $m.Add([pscustomobject][ordered]@{ Metric = 'M12 Expired exceptions'; Value = "$(@($reg | Where-Object { $_.expires -and (Get-IpDate $_.expires) -lt $now }).Count) of $($reg.Count)"; Source = 'the exception register' })
    foreach ($x in @(
            @('M1 Container label coverage of CUI-bearing sites', 'the SharePoint site list with labels (guide G4), joined to the inventory'),
            @('M2 Labeled share of sensitive content', 'content explorer by label and by type (Book 20, Chapter 09)'),
            @('M3 Encrypted share of CUI', 'content explorer by label, with the label definitions'),
            @('M4 DLP true-positive rate after tuning', 'DLP alert dispositions'),
            @('M5 Override rate', 'activity explorer DLP events'),
            @('M6 Mean time to triage', 'the alert queue''s timestamps'),
            @('M7 Decryption-recovery test pass', 'the quarterly test records (guide G5)'),
            @('M9 Encrypted-mail test pass', 'the quarterly test records (guide G6)'),
            @('M10 Oversharing trend', 'DSPM data risk assessment exports'))) {
        $m.Add([pscustomobject][ordered]@{ Metric = $x[0]; Value = 'not computed by the kit'; Source = $x[1] })
    }
    Write-IpJson -Path (Join-Path $out 'metrics.json') -Value ([ordered]@{ asOf = (ConvertTo-IpUtc $AsOf); environment = "$($Settings.environment)"; metrics = @($m | ForEach-Object { [ordered]@{ Metric = $_.Metric; Value = $_.Value; Source = $_.Source } }) })
    $md = @("# Information protection metrics, $((ConvertTo-IpUtc $AsOf).Substring(0, 10)) ($($Settings.environment))", '', '| Metric | Value | Source |', '|---|---|---|')
    $md += @($m | ForEach-Object { "| $($_.Metric) | $($_.Value) | $($_.Source) |" })
    $md += @('', 'Metrics follow Book 20, Chapter 12. A metric the kit cannot compute is reported as such, never as zero.')
    Write-IpText -Path (Join-Path $out 'metrics.md') -Text (($md -join "`n") + "`n")
    $null = Write-IpManifest -OutputPath $out -Task metrics -AsOf $AsOf -Settings $Settings
    [pscustomobject]@{ Task = 'metrics'; Result = 'Pass'; Rows = @(); Metrics = $m.ToArray(); OutputPath = $out }
}
