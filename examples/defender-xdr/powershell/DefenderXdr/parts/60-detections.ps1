# Chapter 06 (guide G7): custom detections kept in a repository, validated, tested against their validation
# windows with runHuntingQuery, and planned for deployment through the Microsoft Graph detectionRules API.

$script:RuleProps = @('displayName', 'description', 'status', 'queryCondition', 'schedule', 'detectionAction')

function ConvertTo-XdrCanonical {
    <#
    .SYNOPSIS
        A value with every dictionary's keys sorted, so two rules compare by content.
    .EXAMPLE
        ConvertTo-XdrCanonical @{ b = 1; a = 2 }
    #>
    # A value with every dictionary's keys sorted, so two rules compare by content, not key order.
    param([AllowNull()]$Value)
    if ($Value -is [Collections.IDictionary]) {
        $o = [ordered]@{}
        foreach ($k in ($Value.Keys | Sort-Object)) { $o["$k"] = ConvertTo-XdrCanonical $Value[$k] }
        return $o
    }
    if ($Value -is [Collections.IList] -and $Value -isnot [string]) { return , @($Value | ForEach-Object { ConvertTo-XdrCanonical $_ }) }
    $Value
}

function Get-XdrCanonicalJson {
    <#
    .SYNOPSIS
        Compact JSON of a value with its keys sorted.
    .EXAMPLE
        Get-XdrCanonicalJson @{ b = 1; a = 2 }
    #>
    param([AllowNull()]$Value)
    ConvertTo-Json -InputObject (ConvertTo-XdrCanonical $Value) -Depth 50 -Compress
}

function Read-XdrRuleRepository {
    <#
    .SYNOPSIS
        Reads a detection repository folder: each <id>.json is a rule body for Graph's detectionRules API, and
        each <id>.test.json its validation dataset (the tables it reads, a known-bad window that must return
        rows and a known-good window that must stay under a threshold).
    .EXAMPLE
        Read-XdrRuleRepository -Path tests/fixtures/rules
    #>
    param([Parameter(Mandatory)][string]$Path)
    foreach ($f in (Get-ChildItem -LiteralPath $Path -Filter '*.json' -File | Where-Object { $_.Name -notlike '*.test.json' -and $_.Name -ne 'manifest.json' } | Sort-Object Name)) {
        $testFile = Join-Path $f.DirectoryName ($f.BaseName + '.test.json')
        [pscustomobject]@{
            File = $f.Name; FileId = $f.BaseName; Rule = (Read-XdrJson -Path $f.FullName); FileSha256 = (Get-XdrFileHash -Path $f.FullName)
            Test = $(if (Test-Path -LiteralPath $testFile) { Read-XdrJson -Path $testFile } else { $null })
        }
    }
}

function Test-XdrDetectionRule {
    <#
    .SYNOPSIS
        Validates one repository rule: the Graph type, an id that matches its file name, a display name, a
        query, an ISO 8601 schedule, an alert template with a title and a severity Graph accepts, no
        automated actions (containment stays on the response ladder: isolate and investigate are a person's
        decision), a validation dataset, and a query that starts from a table the dataset declares. Returns
        one row per check.
    .EXAMPLE
        Test-XdrDetectionRule -Entry (Read-XdrRuleRepository -Path rules)[0]
    #>
    param([Parameter(Mandatory)]$Entry)
    $r = $Entry.Rule; $id = "$(Get-XdrV $r 'id')"
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($check, $ok, $detail) $rows.Add((New-XdrCheck -Id $check -Status $(if ($ok) { 'Pass' } else { 'Fail' }) -Subject $Entry.FileId -Detail $detail)) }
    & $add 'TYPE' ("$(Get-XdrV $r '@odata.type')" -eq '#microsoft.graph.security.detectionRule') '@odata.type is #microsoft.graph.security.detectionRule'
    & $add 'ID' ($id -match '^[a-z0-9][a-z0-9-]{2,63}$' -and $id -eq $Entry.FileId) "id '$id' is lower-case letters, digits and hyphens and matches the file name"
    & $add 'NAME' ([bool]"$(Get-XdrV $r 'displayName')") 'displayName is set'
    $q = "$(Get-XdrV (Get-XdrV $r 'queryCondition') 'queryText')"
    & $add 'QUERY' ([bool]$q.Trim()) 'queryCondition.queryText is set'
    $freq = "$(Get-XdrV (Get-XdrV $r 'schedule') 'frequency')"
    & $add 'SCHEDULE' ($freq -match '^P(T(\d+H)?(\d+M)?(\d+S)?|\d+D)$') "schedule.frequency '$freq' is an ISO 8601 duration"
    $tpl = Get-XdrV (Get-XdrV $r 'detectionAction') 'alertTemplate'
    $sev = "$(Get-XdrV $tpl 'severity')"
    & $add 'ALERT' ([bool]"$(Get-XdrV $tpl 'title')" -and $sev -in 'informational', 'low', 'medium', 'high') "alertTemplate has a title and a severity of informational, low, medium or high ('$sev')"
    $auto = Get-XdrV (Get-XdrV $r 'detectionAction') 'automatedActions'
    $hasAuto = $false
    if ($auto -is [Collections.IDictionary]) { foreach ($k in $auto.Keys) { if (@($auto[$k] | Where-Object { $null -ne $_ }).Count) { $hasAuto = $true } } }
    & $add 'NO-AUTOMATION' (-not $hasAuto) $(if ($hasAuto) { 'automatedActions set: containment stays on the response ladder (Gate 9); remove them' } else { 'no automated actions' })
    $st = "$(Get-XdrV $r 'status')"
    & $add 'STATUS' ($st -in 'enabled', 'disabled') "status '$st' is enabled or disabled"
    $t = $Entry.Test
    $hasTest = $null -ne $t -and $t.Contains('tables') -and $t.Contains('knownBad') -and $t.Contains('knownGood')
    & $add 'DATASET' $hasTest $(if ($hasTest) { "$($Entry.FileId).test.json names its tables and both windows" } else { "$($Entry.FileId).test.json is missing or lacks tables, knownBad or knownGood" })
    if ($hasTest) {
        $first = ($q -split '\|')[0].Trim()
        & $add 'TABLES' ($first -in @($t.tables)) "the query starts from '$first'; the dataset declares $(@($t.tables) -join ', ')"
    }
    $rows.ToArray()
}

function Test-XdrDetectionQuery {
    <#
    .SYNOPSIS
        Runs a rule's query through runHuntingQuery over its known-bad window (it must return at least
        minRows) and its known-good window (at most maxRows). Advanced hunting keeps 30 days, so a window
        older than that returns nothing. Returns one row per window.
    .EXAMPLE
        Test-XdrDetectionQuery -Invoker $inv -Entry $entry -OutputPath out/detections
    #>
    param([Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)]$Entry, [string]$OutputPath)
    $q = "$(Get-XdrV (Get-XdrV $Entry.Rule 'queryCondition') 'queryText')"
    foreach ($w in 'knownBad', 'knownGood') {
        $win = $Entry.Test[$w]
        $rows = @(Invoke-XdrHunting -Invoker $Invoker -Name "rule-$($Entry.FileId)-$w" -Query $q -Timespan "$($win.timespan)" -OutputPath $OutputPath)
        $ok = if ($w -eq 'knownBad') { $rows.Count -ge [int]$win.minRows } else { $rows.Count -le [int]$win.maxRows }
        [pscustomobject][ordered]@{ RuleId = $Entry.FileId; Window = $w; Timespan = "$($win.timespan)"; Rows = $rows.Count; Expected = $(if ($w -eq 'knownBad') { ">= $($win.minRows)" } else { "<= $($win.maxRows)" }); Status = $(if ($ok) { 'Pass' } else { 'Fail' }) }
    }
}

function New-XdrDetectionPlan {
    <#
    .SYNOPSIS
        Compares the repository with the deployed rules and plans the changes: create a rule that isn't
        deployed, update the properties that differ, nothing for a rule that matches. A rule that failed
        validation or its test is held back, and a rule whose file says enabled must have passed its test in
        this run. A deployed rule that isn't in the repository is an orphan: reported, never deleted. With
        deployVia 'portal' (the interim path while Learn doesn't state the API's GCC availability) the plan
        lists the same changes for a person to make in the Defender portal from the same file.
    .EXAMPLE
        New-XdrDetectionPlan -Entries $entries -Validation $v -Tests $t -Deployed $d -DeployVia graph
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Entries, [AllowEmptyCollection()][object[]]$Validation = @(), [AllowEmptyCollection()][object[]]$Tests = @(),
        [AllowEmptyCollection()][object[]]$Deployed = @(), [Parameter(Mandatory)][ValidateSet('graph', 'portal')][string]$DeployVia)
    $dep = @{}; foreach ($d in $Deployed) { $dep["$(Get-XdrV $d 'id')"] = $d }
    $actions = [Collections.Generic.List[object]]::new(); $held = [Collections.Generic.List[object]]::new()
    foreach ($e in $Entries) {
        $id = $e.FileId
        $vBad = @($Validation | Where-Object { $_.Subject -eq $id -and $_.Status -eq 'Fail' })
        $tRows = @($Tests | Where-Object RuleId -EQ $id)
        $tBad = @($tRows | Where-Object Status -EQ 'Fail')
        if ($vBad.Count) { $held.Add([ordered]@{ ruleId = $id; reason = "validation failed: $(($vBad | ForEach-Object Id) -join ', ')" }); continue }
        if ("$(Get-XdrV $e.Rule 'status')" -eq 'enabled' -and (-not $tRows.Count -or $tBad.Count)) { $held.Add([ordered]@{ ruleId = $id; reason = 'enabled in the file but its test did not pass in this run' }); continue }
        if ($tBad.Count) { $held.Add([ordered]@{ ruleId = $id; reason = "test failed: $(($tBad | ForEach-Object Window) -join ', ')" }); continue }
        if (-not $dep.Contains($id)) {
            $actions.Add([ordered]@{ ruleId = $id; action = 'create'; method = 'POST'; callId = 'detection-rule-create'; path = '/security/rules/detectionRules'; changed = @($script:RuleProps | Where-Object { $null -ne (Get-XdrV $e.Rule $_) }); body = $e.Rule; fileSha256 = $e.FileSha256 })
            continue
        }
        $changed = @($script:RuleProps | Where-Object { (Get-XdrCanonicalJson (Get-XdrV $e.Rule $_)) -ne (Get-XdrCanonicalJson (Get-XdrV $dep[$id] $_)) })
        if ($changed.Count) {
            $body = [ordered]@{}; foreach ($p in $changed) { $body[$p] = Get-XdrV $e.Rule $p }
            $actions.Add([ordered]@{ ruleId = $id; action = 'update'; method = 'PATCH'; callId = 'detection-rule-update'; path = "/security/rules/detectionRules/$id"; changed = $changed; body = $body; fileSha256 = $e.FileSha256 })
        }
    }
    $repoIds = @($Entries | ForEach-Object FileId)
    $orphans = @($dep.Keys | Where-Object { $_ -notin $repoIds } | Sort-Object | ForEach-Object { [ordered]@{ ruleId = $_; status = "$(Get-XdrV $dep[$_] 'status')"; reason = 'deployed but not in the repository: disable it from a repository file, or add it to the repository' } })
    [ordered]@{ deployVia = $DeployVia; actions = $actions.ToArray(); held = $held.ToArray(); orphans = $orphans; unchanged = @($repoIds | Where-Object { $dep.Contains($_) -and $_ -notin @($actions | ForEach-Object { $_.ruleId }) -and $_ -notin @($held | ForEach-Object { $_.ruleId }) }) }
}

function Invoke-XdrDetectionCheck {
    <#
    .SYNOPSIS
        Gate 7's check: validates every rule in the repository, tests each valid rule's query against its
        validation windows, reads the deployed rules, and writes the deployment plan (plan.json, with its
        SHA-256 in plan.sha256) that deploy/Publish-XdrDetections.ps1 applies. With deployVia 'portal' it also
        writes portal-sheet.md. Writes validation.csv, tests.csv, deployed-rules.json, plan.json,
        summary.json and the manifest. Reads only.
    .EXAMPLE
        Invoke-XdrDetectionCheck -Settings $s -Invoker $inv -OutputPath out/detections -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$RulesPath)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $entries = @(Read-XdrRuleRepository -Path (Get-XdrInput -Settings $Settings -Name rules -Override $RulesPath))
    $val = @($entries | ForEach-Object { Test-XdrDetectionRule -Entry $_ })
    $tests = @(foreach ($e in $entries) { if (-not @($val | Where-Object { $_.Subject -eq $e.FileId -and $_.Status -eq 'Fail' -and $_.Id -in 'QUERY', 'DATASET', 'TABLES' }).Count) { Test-XdrDetectionQuery -Invoker $Invoker -Entry $e -OutputPath $out } })
    $deployed = @(@(Get-XdrV (Invoke-XdrCall -Invoker $Invoker -CallId detection-rules-list) 'value') | Where-Object { $null -ne $_ })
    Write-XdrJson -Path (Join-Path $out 'deployed-rules.json') -Value @{ value = $deployed }
    $via = if ($Settings.Contains('detections') -and $Settings.detections.Contains('deployVia')) { "$($Settings.detections.deployVia)" } else { throw "The settings file has no detections.deployVia (graph or portal)." }
    $plan = New-XdrDetectionPlan -Entries $entries -Validation $val -Tests $tests -Deployed $deployed -DeployVia $via
    $p0 = $plan
    $plan = [ordered]@{ schema = 'fmp-xdr-detection-plan/1'; asOf = (ConvertTo-XdrUtc $AsOf); environment = $Settings.environment; tenantId = $Settings.tenantId }
    foreach ($k in $p0.Keys) { $plan[$k] = $p0[$k] }
    Write-XdrCsv -Path (Join-Path $out 'validation.csv') -Rows $val -Columns Subject, Id, Status, Detail
    Write-XdrCsv -Path (Join-Path $out 'tests.csv') -Rows $tests -Columns RuleId, Window, Timespan, Rows, Expected, Status
    Write-XdrJson -Path (Join-Path $out 'plan.json') -Value $plan
    $sha = Get-XdrFileHash -Path (Join-Path $out 'plan.json')
    Write-XdrText -Path (Join-Path $out 'plan.sha256') -Text "$sha  plan.json`n"
    if ($via -eq 'portal') {
        $md = @('# Custom detections to make in the Defender portal', '', "Plan $sha, $($plan.asOf). Hunting > Custom detection rules; enter each rule from its repository file, unchanged.", '')
        foreach ($a in $plan.actions) { $md += "- **$($a.action)** ``$($a.ruleId)``: $(@($a.changed) -join ', ') (file SHA-256 $($a.fileSha256))" }
        Write-XdrText -Path (Join-Path $out 'portal-sheet.md') -Text (($md -join "`n") + "`n")
    }
    $sum = [ordered]@{ asOf = $plan.asOf; rules = $entries.Count; validationFailures = @($val | Where-Object Status -EQ 'Fail').Count; testsPassed = @($tests | Where-Object Status -EQ 'Pass').Count; testsFailed = @($tests | Where-Object Status -EQ 'Fail').Count
        create = @($plan.actions | Where-Object { $_.action -eq 'create' }).Count; update = @($plan.actions | Where-Object { $_.action -eq 'update' }).Count; held = @($plan.held).Count; orphans = @($plan.orphans).Count; unchanged = @($plan.unchanged).Count; planSha256 = $sha; deployVia = $via
        enabledWithPassingTest = @(foreach ($e in $entries) { $tr = @($tests | Where-Object RuleId -EQ $e.FileId); if ("$(Get-XdrV $e.Rule 'status')" -eq 'enabled' -and $tr.Count -and -not @($tr | Where-Object Status -EQ 'Fail').Count) { $e.FileId } }).Count
        enabled = @($entries | Where-Object { "$(Get-XdrV $_.Rule 'status')" -eq 'enabled' }).Count }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $null = Write-XdrManifest -OutputPath $out -Task detections -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($sum.validationFailures -or $sum.testsFailed -or $sum.orphans) { 'Fail' } else { 'Pass' }); planSha256 = $sha }
    [pscustomobject]@{ Validation = $val; Tests = $tests; Plan = $plan; Summary = $sum; OutputPath = $out }
}
