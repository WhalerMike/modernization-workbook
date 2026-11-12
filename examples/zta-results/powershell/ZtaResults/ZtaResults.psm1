#Requires -Version 7.1
<#
    ZtaResults: read a Zero Trust Assessment export, normalize every result to Book 11, Chapter 10's
    taxonomy, write the closure register, compare two runs, and record each step as hashed, chained
    evidence. Read-only: nothing here connects to a tenant or calls a Microsoft API. It reads the JSON
    the tool writes to <Path>/zt-export/ZeroTrustAssessmentReport.json and the kit's config files.
#>

$script:KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script:ConfigRoot = Join-Path $script:KitRoot 'config'
$script:Utf8 = [Text.UTF8Encoding]::new($false)

#region Files and hashes

function Read-ZtaJson {
    <#
    .SYNOPSIS
        Reads a JSON file as ordered hashtables, keeping date-like strings as the text in the file.
    .EXAMPLE
        Read-ZtaJson -Path config/taxonomy.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "File not found: $Path" }
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path)
    # Keep timestamps as text: ConvertFrom-Json would turn ISO strings into local DateTime values.
    $text = [regex]::Replace($text, '"(\d{4}-\d{2}-\d{2}T[^"]*)"', '"`$1"')
    ConvertFrom-ZtaPlain (ConvertFrom-Json -InputObject $text -AsHashtable -Depth 64)
}

function ConvertFrom-ZtaPlain {
    param($Value)
    if ($Value -is [string]) { if ($Value.StartsWith([char]0x60)) { return $Value.Substring(1) } return $Value }
    if ($Value -is [System.Collections.IDictionary]) {
        $o = [ordered]@{}
        foreach ($k in $Value.Keys) { $o[$k] = ConvertFrom-ZtaPlain $Value[$k] }
        return $o
    }
    if ($Value -is [System.Collections.IList]) { return , @(foreach ($x in $Value) { ConvertFrom-ZtaPlain $x }) }
    $Value
}

function Write-ZtaJson {
    <#
    .SYNOPSIS
        Writes a value as indented JSON, UTF-8 without a byte order mark, LF line endings.
    .EXAMPLE
        Write-ZtaJson -Path out/x.json -Value @{ a = 1 }
    #>
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)]$Value)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = (ConvertTo-Json -InputObject $Value -Depth 32) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Path, $json + "`n", $script:Utf8)
}

function Write-ZtaText {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), $script:Utf8)
}

function Get-ZtaFileHash {
    <#
    .SYNOPSIS
        Returns a file's SHA-256 as lowercase hex.
    .EXAMPLE
        Get-ZtaFileHash -Path tests/fixtures/run-2026-10-27/zt-export/ZeroTrustAssessmentReport.json
    #>
    param([Parameter(Mandatory)][string]$Path)
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function ConvertTo-ZtaCsv {
    param([Parameter(Mandatory)][string[]]$Columns, [object[]]$Rows = @())
    $q = { param($v) '"' + ("$v" -replace '"', '""') + '"' }
    $lines = @(($Columns | ForEach-Object { & $q $_ }) -join ',')
    foreach ($r in $Rows) { $lines += (($Columns | ForEach-Object { & $q $r[$_] }) -join ',') }
    ($lines -join "`n") + "`n"
}

function ConvertTo-ZtaUtc {
    <#
    .SYNOPSIS
        Converts a timestamp with an offset (as the tool writes ExecutedAt) to UTC ISO 8601 with a Z.
    .EXAMPLE
        ConvertTo-ZtaUtc '2026-10-27T14:05:31.4471023-04:00'
    #>
    param([Parameter(Mandatory)]$Value)
    $d = if ($Value -is [datetime]) { [datetimeoffset]$Value } else { [datetimeoffset]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture) }
    $d.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ", [Globalization.CultureInfo]::InvariantCulture)
}

function Write-ZtaManifest {
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][System.Collections.IDictionary]$Info)
    $files = [ordered]@{}
    foreach ($f in (Get-ChildItem -LiteralPath $OutputPath -Recurse -File | Where-Object Name -NE 'manifest.json' | Sort-Object FullName)) {
        $rel = [IO.Path]::GetRelativePath((Resolve-Path -LiteralPath $OutputPath).Path, $f.FullName).Replace('\', '/')
        $files[$rel] = Get-ZtaFileHash -Path $f.FullName
    }
    $m = [ordered]@{ schema = 'fmp-zta-manifest/1' }
    foreach ($k in $Info.Keys) { $m[$k] = $Info[$k] }
    $m.files = $files
    Write-ZtaJson -Path (Join-Path $OutputPath 'manifest.json') -Value $m
    $m
}

#endregion

#region Configuration

function Get-ZtaConfig {
    <#
    .SYNOPSIS
        Reads one of the kit's config files: taxonomy, finding-families or requirements.
    .EXAMPLE
        (Get-ZtaConfig -Name taxonomy).toolVersion
    #>
    param([Parameter(Mandatory)][ValidateSet('taxonomy', 'finding-families', 'requirements')][string]$Name)
    Read-ZtaJson -Path (Join-Path $script:ConfigRoot "$Name.json")
}

#endregion

#region Read the export

function Resolve-ZtaExportFile {
    <#
    .SYNOPSIS
        Finds ZeroTrustAssessmentReport.json from the report folder (-Path of Invoke-ZtAssessment), its
        zt-export folder, or the file itself.
    .EXAMPLE
        Resolve-ZtaExportFile -Path tests/fixtures/run-2026-10-27
    #>
    param([Parameter(Mandatory)][string]$Path)
    if (Test-Path -LiteralPath $Path -PathType Leaf) { return (Resolve-Path -LiteralPath $Path).Path }
    foreach ($c in @((Join-Path $Path 'zt-export/ZeroTrustAssessmentReport.json'), (Join-Path $Path 'ZeroTrustAssessmentReport.json'))) {
        if (Test-Path -LiteralPath $c -PathType Leaf) { return (Resolve-Path -LiteralPath $c).Path }
    }
    throw "No ZeroTrustAssessmentReport.json under $Path. Point -ExportPath at the folder Invoke-ZtAssessment -Path wrote, its zt-export folder, or the JSON file."
}

function Read-ZtaExport {
    <#
    .SYNOPSIS
        Reads a Zero Trust Assessment export and checks its shape: run metadata, a Tests array, and the
        EndOfJson marker the tool writes last (a missing marker means a truncated file).
    .EXAMPLE
        $e = Read-ZtaExport -Path tests/fixtures/run-2026-10-27; $e.CurrentVersion; $e.Tests.Count
    #>
    param([Parameter(Mandatory)][string]$Path)
    $file = Resolve-ZtaExportFile -Path $Path
    $j = Read-ZtaJson -Path $file
    foreach ($k in 'ExecutedAt', 'CurrentVersion', 'Tests') { if (-not $j.Contains($k)) { throw "$file isn't a Zero Trust Assessment export: no '$k'." } }
    if ("$($j['EndOfJson'])" -ne 'EndOfJson') { throw "$file has no EndOfJson marker; the export is incomplete. Re-run, or use -Resume to regenerate the report data." }
    $ids = @{}
    foreach ($t in @($j.Tests)) {
        if (-not $t.Contains('TestId') -or -not $t.Contains('TestStatus')) { throw "$file has a test without TestId or TestStatus." }
        if ($ids.Contains("$($t.TestId)")) { throw "$file lists test $($t.TestId) twice." }
        $ids["$($t.TestId)"] = $true
    }
    $j['_file'] = $file
    $j
}

#endregion

#region Normalize

function Get-ZtaPillars {
    param($Value)
    @(@($Value) | Where-Object { "$_" } | ForEach-Object { "$_" })
}

function ConvertTo-ZtaResult {
    <#
    .SYNOPSIS
        Normalizes one test from the export to Book 11, Chapter 10's taxonomy: keeps the tool's own status
        and skip reason, and adds the normalized result, its reason, and flags for Investigate, a boundary
        reason, a reason to review, and a value the taxonomy doesn't list.
    .EXAMPLE
        ConvertTo-ZtaResult -Test @{ TestId = '21816'; TestStatus = 'Skipped'; TestSkipped = 'NotLicensedEntraIDP2' }
    #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Test, [System.Collections.IDictionary]$Taxonomy = (Get-ZtaConfig -Name taxonomy),
        $Review)
    $status = "$($Test['TestStatus'])"
    $skip = "$($Test['TestSkipped'])"
    $norm = $null; $reason = ''; $investigate = $false; $unmapped = $false
    if ($Taxonomy.statuses.Contains($status)) {
        $rule = $Taxonomy.statuses[$status]
        $norm = $rule.normalized
        if ($rule.Contains('investigate')) { $investigate = [bool]$rule.investigate }
        if ($rule.Contains('note')) { $reason = $rule.note }
    }
    else { $norm = 'Unable-to-Evaluate'; $unmapped = $true; $reason = "The tool's status '$status' isn't in the kit's taxonomy for $($Taxonomy.toolVersion); review the mapping" }
    if ($norm -eq 'by-reason') {
        if ($skip -and $Taxonomy.skipReasons.Contains($skip)) { $norm = $Taxonomy.skipReasons[$skip]; $reason = "$($Test['SkippedReason'])".Trim() }
        else { $norm = 'Unable-to-Evaluate'; $unmapped = $true; $reason = $(if ($skip) { "Skip reason '$skip' isn't in the kit's taxonomy for $($Taxonomy.toolVersion); review the mapping" } else { 'Skipped with no reason' }) }
    }
    elseif ($status -eq 'Planned') { $reason = 'Under construction in the tool' }
    if (-not $reason -and $skip) { $reason = $skip }
    $reviewNote = ''
    if ($investigate -and $Review) {
        switch ("$($Review.decision)") {
            'confirmed' { $reviewNote = "Investigate confirmed as a finding by $($Review.reviewer) on $($Review.reviewedOn)" }
            'dismissed' { $norm = 'Pass'; $reviewNote = "Investigate dismissed by $($Review.reviewer) on $($Review.reviewedOn): $($Review.note)" }
            default { throw "Review for test $($Test.TestId) has decision '$($Review.decision)'; use confirmed or dismissed." }
        }
    }
    $pillars = @(Get-ZtaPillars $Test['TestPillar'])
    [ordered]@{
        testId = "$($Test['TestId'])"
        title = "$($Test['TestTitle'])"
        pillars = $pillars
        pillar = $(if ($pillars.Count) { $pillars[0] } else { '' })
        cisaPillar = $(if ($pillars.Count -and $Taxonomy.cisaPillars.Contains($pillars[0])) { $Taxonomy.cisaPillars[$pillars[0]] } else { '' })
        category = "$($Test['TestCategory'])"
        risk = "$($Test['TestRisk'])"
        implementationCost = "$($Test['TestImplementationCost'])"
        userImpact = "$($Test['TestImpact'])"
        minimumLicense = @(@($Test['TestMinimumLicense']) | Where-Object { "$_" } | ForEach-Object { "$_" })
        raw = [ordered]@{ status = $status; skippedBecause = $skip }
        normalized = $norm
        reason = $reason
        investigate = $investigate
        review = $reviewNote
        boundary = [bool]($skip -and @($Taxonomy.boundaryReasons) -contains $skip)
        reviewReason = $(if ($skip -and $Taxonomy.reviewReasons.Contains($skip)) { $Taxonomy.reviewReasons[$skip] } else { '' })
        unmapped = $unmapped
    }
}

function Read-ZtaReviews {
    param([string]$Path)
    $r = @{}
    if (-not $Path) { return $r }
    foreach ($row in (Import-Csv -LiteralPath $Path)) { $r["$($row.testId)"] = $row }
    $r
}

function Invoke-ZtaNormalization {
    <#
    .SYNOPSIS
        Normalizes every result in a Zero Trust Assessment export and writes results.json and results.csv
        (one row per test, the tool's value and the normalized one), summary.json and summary.md (counts
        by normalized result and by pillar), dispositions.csv (every result that is neither a pass nor a
        finding, with what to do about it) and manifest.json (the source file's SHA-256 and every output's).
        The outputs carry test IDs and titles, never the tool's result text, which can name tenant objects.
    .EXAMPLE
        Invoke-ZtaNormalization -ExportPath tests/fixtures/run-2026-10-27 -OutputPath out/run1
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$ExportPath, [Parameter(Mandatory)][string]$OutputPath, [string]$ReviewsPath)
    $tax = Get-ZtaConfig -Name taxonomy
    $e = Read-ZtaExport -Path $ExportPath
    $reviews = Read-ZtaReviews -Path $ReviewsPath
    $executed = ConvertTo-ZtaUtc $e.ExecutedAt
    $results = @(foreach ($t in @($e.Tests)) { ConvertTo-ZtaResult -Test $t -Taxonomy $tax -Review $reviews["$($t.TestId)"] }) | Sort-Object { [long]($_.testId -replace '\D', '0') }, { $_.testId }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $versionReviewed = ("$($e.CurrentVersion)" -eq "$($tax.toolVersion)")
    $counts = [ordered]@{}; foreach ($n in $tax.results) { $counts[$n] = @($results | Where-Object normalized -EQ $n).Count }
    $byPillar = [ordered]@{}
    foreach ($p in @($results | ForEach-Object { $_.pillars } | Sort-Object -Unique)) {
        $row = [ordered]@{}; foreach ($n in $tax.results) { $row[$n] = @($results | Where-Object { $_.pillars -contains $p -and $_.normalized -eq $n }).Count }
        $byPillar[$p] = $row
    }
    $findings = @($results | Where-Object normalized -EQ 'Fail')
    $byRisk = [ordered]@{}; foreach ($r in 'Critical', 'High', 'Medium', 'Low', 'Unranked') { $byRisk[$r] = @($findings | Where-Object risk -EQ $r).Count }
    $summary = [ordered]@{
        schema = 'fmp-zta-summary/1'
        tool = [ordered]@{ name = 'Zero Trust Assessment'; version = "$($e.CurrentVersion)"; latestVersion = "$($e.LatestVersion)"; taxonomyVersion = "$($tax.toolVersion)"; taxonomyReviewedForThisVersion = $versionReviewed }
        run = [ordered]@{ executedAt = $executed; runDate = $executed.Substring(0, 10); sourceFile = 'ZeroTrustAssessmentReport.json'; sourceSha256 = (Get-ZtaFileHash -Path $e._file) }
        tests = $results.Count
        counts = $counts
        findings = $findings.Count
        investigate = @($results | Where-Object investigate).Count
        findingsByRisk = $byRisk
        byPillar = $byPillar
        boundary = @($results | Where-Object boundary | ForEach-Object testId)
        toReview = @($results | Where-Object { $_.reviewReason } | ForEach-Object testId)
        unmapped = @($results | Where-Object unmapped | ForEach-Object testId)
        note = 'Planned, the three Skipped results and Unable-to-Evaluate are neither passes nor failures; they are counted in their own columns (Book 11, Chapter 10). A pass rate is not a maturity score.'
    }
    Write-ZtaJson -Path (Join-Path $OutputPath 'results.json') -Value ([ordered]@{ schema = 'fmp-zta-results/1'; tool = $summary.tool; run = $summary.run; results = $results })
    $cols = 'testId', 'title', 'pillar', 'cisaPillar', 'category', 'risk', 'implementationCost', 'userImpact', 'rawStatus', 'skippedBecause', 'normalized', 'reason', 'investigate', 'review', 'boundary', 'unmapped'
    $rows = foreach ($r in $results) {
        $h = [ordered]@{}; foreach ($c in $cols) { $h[$c] = $r[$c] }
        $h.pillar = ($r.pillars -join ' '); $h.rawStatus = $r.raw.status; $h.skippedBecause = $r.raw.skippedBecause
        $h.investigate = "$($r.investigate)".ToLowerInvariant(); $h.boundary = "$($r.boundary)".ToLowerInvariant(); $h.unmapped = "$($r.unmapped)".ToLowerInvariant()
        $h
    }
    Write-ZtaText -Path (Join-Path $OutputPath 'results.csv') -Text (ConvertTo-ZtaCsv -Columns $cols -Rows @($rows))
    $disp = foreach ($r in @($results | Where-Object { $_.normalized -notin 'Pass', 'Fail' })) {
        [ordered]@{ testId = $r.testId; title = $r.title; pillar = ($r.pillars -join ' '); normalized = $r.normalized; rawStatus = $r.raw.status; skippedBecause = $r.raw.skippedBecause; reason = $r.reason
            action = $tax.dispositions[$r.normalized] + $(if ($r.boundary) { ' Boundary finding.' } else { '' }) + $(if ($r.reviewReason) { " $($r.reviewReason)." } else { '' }) }
    }
    Write-ZtaText -Path (Join-Path $OutputPath 'dispositions.csv') -Text (ConvertTo-ZtaCsv -Columns 'testId', 'title', 'pillar', 'normalized', 'rawStatus', 'skippedBecause', 'reason', 'action' -Rows @($disp))
    Write-ZtaJson -Path (Join-Path $OutputPath 'summary.json') -Value $summary
    $md = [Collections.Generic.List[string]]::new()
    $md.Add("# Zero Trust Assessment results, $($summary.run.runDate)"); $md.Add('')
    $md.Add("Tool version $($e.CurrentVersion); taxonomy pinned to $($tax.toolVersion)" + $(if ($versionReviewed) { '.' } else { '. **The taxonomy hasn''t been reviewed for this version: check the status values and skip reasons before relying on the counts.**' }))
    $md.Add("Run at $executed. Source SHA-256 ``$($summary.run.sourceSha256)``."); $md.Add('')
    $md.Add('| Normalized result | Tests |'); $md.Add('|---|---|')
    foreach ($n in $tax.results) { $md.Add("| $n | $($counts[$n]) |") }
    $md.Add(''); $md.Add("Findings: $($findings.Count), of which $($summary.investigate) need a manual review (Investigate). By risk: " + (($byRisk.Keys | Where-Object { $byRisk[$_] } | ForEach-Object { "$_ $($byRisk[$_])" }) -join ', ') + '.'); $md.Add('')
    $md.Add('| Pillar | ' + ($tax.results -join ' | ') + ' |'); $md.Add('|---' * ($tax.results.Count + 1) + '|')
    foreach ($p in $byPillar.Keys) { $md.Add("| $p | " + (($tax.results | ForEach-Object { $byPillar[$p][$_] }) -join ' | ') + ' |') }
    $md.Add(''); $md.Add($summary.note)
    if ($summary.unmapped.Count) { $md.Add(''); $md.Add("Unmapped values (Unable-to-Evaluate until the taxonomy is reviewed): $($summary.unmapped -join ', ').") }
    if ($summary.toReview.Count) { $md.Add(''); $md.Add("Skips to review: $($summary.toReview -join ', ').") }
    Write-ZtaText -Path (Join-Path $OutputPath 'summary.md') -Text (($md -join "`n") + "`n")
    $null = Write-ZtaManifest -OutputPath $OutputPath -Info ([ordered]@{ task = 'normalize'; toolVersion = "$($e.CurrentVersion)"; runDate = $summary.run.runDate; executedAt = $executed; source = [ordered]@{ file = 'ZeroTrustAssessmentReport.json'; sha256 = $summary.run.sourceSha256 }; reviews = $(if ($ReviewsPath) { [ordered]@{ file = (Split-Path -Leaf $ReviewsPath); sha256 = (Get-ZtaFileHash -Path $ReviewsPath) } } else { $null }) })
    [pscustomobject]@{ Tests = $results.Count; Counts = $counts; Findings = $findings.Count; Investigate = $summary.investigate; Version = "$($e.CurrentVersion)"; TaxonomyReviewed = $versionReviewed; Unmapped = $summary.unmapped; OutputPath = $OutputPath }
}

#endregion

#region Register

function Get-ZtaFamily {
    <#
    .SYNOPSIS
        Routes a normalized result to its finding family (config/finding-families.json): by test ID, then
        by the tool's category, else unrouted.
    .EXAMPLE
        (Get-ZtaFamily -Result @{ testId = '21816'; category = '' }).family
    #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Result, [System.Collections.IDictionary]$Families = (Get-ZtaConfig -Name finding-families))
    $id = "$($Result.testId)"
    if ($Families.tests.Contains($id)) { return [ordered]@{ family = $Families.tests[$id]; matchedBy = 'test' } }
    if ($Result.category -and $Families.categories.Contains("$($Result.category)")) { return [ordered]@{ family = $Families.categories["$($Result.category)"]; matchedBy = 'category' } }
    [ordered]@{ family = 'unrouted'; matchedBy = 'none' }
}

function Get-ZtaPriority {
    <#
    .SYNOPSIS
        The kit's default severity (0 to 100), priority and bucket for a finding (config/taxonomy.json
        'scoring'; Book 11, Chapter 10's method): severity is the risk weight times the status factor,
        priority is severity divided by effort.
    .EXAMPLE
        Get-ZtaPriority -Risk High -Status Failed -ImplementationCost Low
    #>
    param([string]$Risk, [string]$Status, [string]$ImplementationCost, [System.Collections.IDictionary]$Taxonomy = (Get-ZtaConfig -Name taxonomy))
    $s = $Taxonomy.scoring
    $w = if ($s.risk.Contains($Risk)) { $s.risk[$Risk] } else { $s.risk.Unranked }
    $f = if ($s.status.Contains($Status)) { $s.status[$Status] } else { 1.0 }
    $effort = if ($s.effort.Contains($ImplementationCost)) { $s.effort[$ImplementationCost] } else { 2 }
    $sev = [math]::Round($w * $f, 1)
    $pri = [math]::Round($sev / $effort, 1)
    $bucket = ($s.buckets | Where-Object { $pri -ge $_.min } | Select-Object -First 1).bucket
    [ordered]@{ severity = $sev; effort = $effort; priority = $pri; bucket = "$bucket" }
}

function Read-ZtaExceptions {
    param([string]$Path)
    $r = @{}
    if (-not $Path) { return $r }
    foreach ($row in (Import-Csv -LiteralPath $Path)) { $r["$($row.testId)"] = $row }
    $r
}

function Get-ZtaExceptionState {
    <#
    .SYNOPSIS
        Checks an accepted Zero Trust Assessment finding against Book 11, Chapter 10's approval rule: an
        exception with an expiry is the CISO's; one without is a standing risk acceptance for the authorizing
        official. Returns the disposition (governed-exception, lapsed-acceptance or wrong-approver).
    .EXAMPLE
        Get-ZtaExceptionState -Exception ([pscustomobject]@{ approverRole = 'CISO'; expires = '2027-01-31' }) -AsOf 2026-11-10
    #>
    param([Parameter(Mandatory)]$Exception, [Parameter(Mandatory)][string]$AsOf)
    $exp = "$($Exception.expires)".Trim(); $role = "$($Exception.approverRole)".Trim()
    if ($exp) {
        if ([datetime]::Parse($exp, [Globalization.CultureInfo]::InvariantCulture) -lt [datetime]::Parse($AsOf.Substring(0, 10), [Globalization.CultureInfo]::InvariantCulture)) { return [ordered]@{ disposition = 'lapsed-acceptance'; detail = "Expired $exp; renew or remediate" } }
        if ($role -notin 'CISO', 'authorizing official') { return [ordered]@{ disposition = 'wrong-approver'; detail = "An expiring exception is the CISO's decision; '$role' approved it" } }
        return [ordered]@{ disposition = 'governed-exception'; detail = "Approved by $role until $exp" }
    }
    if ($role -ne 'authorizing official') { return [ordered]@{ disposition = 'wrong-approver'; detail = "A standing exception, with no end date, is the authorizing official's decision; '$role' approved it" } }
    [ordered]@{ disposition = 'governed-exception'; detail = 'Standing risk acceptance by the authorizing official' }
}

function Invoke-ZtaRegister {
    <#
    .SYNOPSIS
        Writes the closure register from a normalized run: one entry per finding (normalized Fail), with
        Book 11, Chapter 10's closure-chain fields, the finding family and the workbook page that
        remediates it, the evidence that shows it is ready for closure, the default priority and the
        weighting inputs, and any exception with its approval state. register.json, register.csv and
        manifest.json. The fields a person decides (change, pilot, test, the weighting rationale) are
        left as placeholders; closure is never set ready.
    .EXAMPLE
        Invoke-ZtaRegister -RunPath out/run1 -OutputPath out/run1-register
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$OutputPath, [string]$ExceptionsPath)
    $tax = Get-ZtaConfig -Name taxonomy
    $fam = Get-ZtaConfig -Name finding-families
    $run = Read-ZtaJson -Path (Join-Path $RunPath 'results.json')
    $exceptions = Read-ZtaExceptions -Path $ExceptionsPath
    $runDate = $run.run.runDate
    $entries = foreach ($r in @($run.results | Where-Object { $_.normalized -eq 'Fail' })) {
        $route = Get-ZtaFamily -Result $r -Families $fam
        $f = if ($fam.families.Contains($route.family)) { $fam.families[$route.family] } else { $null }
        $p = Get-ZtaPriority -Risk $r.risk -Status $r.raw.status -ImplementationCost $r.implementationCost -Taxonomy $tax
        $ex = $exceptions[$r.testId]
        $exState = if ($ex) { Get-ZtaExceptionState -Exception $ex -AsOf $run.run.executedAt } else { $null }
        $disp = if ($exState) { $exState.disposition } else { 'actionable' }
        $hl = { param($v) switch ($v) { 'Critical' { 'H' } 'High' { 'H' } 'Medium' { 'M' } 'Low' { 'L' } default { '<H|M|L>' } } }
        [ordered]@{
            finding = "ZTA-$($r.testId)-$runDate"
            tool = [ordered]@{ name = 'Zero Trust Assessment'; version = $run.tool.version; test = $r.testId; title = $r.title }
            result = [ordered]@{ raw = $r.raw.status; normalized = $r.normalized; reason = $r.reason; investigate = $r.investigate; review = $r.review }
            family = [ordered]@{ id = $route.family; title = $(if ($f) { $f.title } else { 'Unrouted' }); matchedBy = $route.matchedBy }
            remediation = [ordered]@{ page = $(if ($f) { $f.page } else { 'docs/books/b11-zero-trust/08-close-before-you-assess.md#finding-families' }); alsoSee = $(if ($f) { @($f.alsoSee) } else { @() }) }
            readyForClosureEvidence = $(if ($f) { $f.ready } else { 'Assign a family first: the program lead routes an unrouted finding (Book 11, Chapter 07)' })
            controls = $(if ($f) { @($f.controls) } else { @() })
            attack_path = $(if ($f) { $f.attackPath } else { '<the attack the gap enables>' })
            pillar = [ordered]@{ microsoft = ($r.pillars -join ', '); cisa = $r.cisaPillar }
            owner = $(if ($f) { $f.owner } else { 'Zero Trust program lead, to route' })
            dependency = @($(if ($f) { @($f.dependsOn | ForEach-Object { "family:$_" }) } else { @() }))
            change = '<change record>'
            pilot = [ordered]@{ scope = '<group or ring>'; from = '<date>'; to = '<date>'; result = '<observed>' }
            enforcement = [ordered]@{ date = '<date>'; scope = '<scope>'; exclusions = '<exclusion register entry>' }
            test = [ordered]@{ expected = '<outcome>'; observed = '<outcome>'; date = '<date>'; tester = '<role>' }
            evidence = @('<configuration>', '<operational>', '<test>', '<exception>')
            residual_risk = [ordered]@{ statement = $(if ($ex) { "$($ex.rationale)" } else { '<what remains>' }); accepted_by = $(if ($ex) { "$($ex.approverRole)" } else { 'none' }); expires = $(if ($ex) { "$($ex.expires)" } else { '' }) }
            exception = $(if ($ex) { [ordered]@{ approverRole = "$($ex.approverRole)"; approvedOn = "$($ex.approvedOn)"; expires = "$($ex.expires)"; compensatingControl = "$($ex.compensatingControl)"; state = $exState.disposition; detail = $exState.detail } } else { $null })
            disposition = $disp
            reassessment = [ordered]@{ tool_version = '<x.y.z>'; date = '<date>'; normalized = '<result>' }
            priority = $p
            weighting = [ordered]@{ exploitability = (& $hl $r.risk); blast_radius = '<H|M|L>'; exposure = '<H|M|L>'; compensating = $(if ($ex -and "$($ex.compensatingControl)") { "$($ex.compensatingControl)" } else { '<control or none>' }); effort = (& $hl $r.implementationCost); rationale = '<why this place in the backlog>' }
            closure = [ordered]@{ ready = $false; decided_by = '<authorizing official | assessor>'; date = '<date>' }
        }
    }
    $entries = @($entries | Sort-Object @{ Expression = { $_.priority.priority }; Descending = $true }, @{ Expression = { $_.tool.test } })
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $unrouted = @($entries | Where-Object { $_.family.id -eq 'unrouted' } | ForEach-Object { $_.tool.test })
    $exceptionProblems = @($entries | Where-Object { $_.disposition -in 'lapsed-acceptance', 'wrong-approver' } | ForEach-Object { $_.tool.test })
    Write-ZtaJson -Path (Join-Path $OutputPath 'register.json') -Value ([ordered]@{
            schema = 'fmp-zta-register/1'; tool = $run.tool; run = $run.run; findings = $entries.Count; unrouted = $unrouted; exceptionProblems = $exceptionProblems
            note = 'A finding is ready for closure when every applicable field has evidence and a reassessment shows a Pass; the authorizing official or assessor decides (Book 11, Chapter 10).'
            entries = $entries })
    $cols = 'finding', 'testId', 'title', 'pillar', 'cisaPillar', 'risk', 'raw', 'investigate', 'family', 'matchedBy', 'remediationPage', 'owner', 'attackPath', 'severity', 'priority', 'bucket', 'disposition', 'exceptionApprover', 'exceptionExpires', 'readyForClosureEvidence', 'controls'
    $rows = foreach ($e in $entries) {
        $r = @($run.results | Where-Object testId -EQ $e.tool.test)[0]
        [ordered]@{ finding = $e.finding; testId = $e.tool.test; title = $e.tool.title; pillar = $e.pillar.microsoft; cisaPillar = $e.pillar.cisa; risk = $r.risk; raw = $e.result.raw
            investigate = "$($e.result.investigate)".ToLowerInvariant(); family = $e.family.id; matchedBy = $e.family.matchedBy; remediationPage = $e.remediation.page; owner = $e.owner; attackPath = $e.attack_path
            severity = $e.priority.severity; priority = $e.priority.priority; bucket = $e.priority.bucket; disposition = $e.disposition
            exceptionApprover = $(if ($e.exception) { $e.exception.approverRole } else { '' }); exceptionExpires = $(if ($e.exception) { $e.exception.expires } else { '' })
            readyForClosureEvidence = $e.readyForClosureEvidence; controls = ($e.controls -join ' ') }
    }
    Write-ZtaText -Path (Join-Path $OutputPath 'register.csv') -Text (ConvertTo-ZtaCsv -Columns $cols -Rows @($rows))
    $null = Write-ZtaManifest -OutputPath $OutputPath -Info ([ordered]@{ task = 'register'; toolVersion = $run.tool.version; runDate = $runDate; results = [ordered]@{ file = 'results.json'; sha256 = (Get-ZtaFileHash -Path (Join-Path $RunPath 'results.json')) }; exceptions = $(if ($ExceptionsPath) { [ordered]@{ file = (Split-Path -Leaf $ExceptionsPath); sha256 = (Get-ZtaFileHash -Path $ExceptionsPath) } } else { $null }) })
    $buckets = [ordered]@{}; foreach ($b in 'P1', 'P2', 'P3', 'P4') { $buckets[$b] = @($entries | Where-Object { $_.priority.bucket -eq $b }).Count }
    [pscustomobject]@{ Findings = $entries.Count; Buckets = $buckets; Unrouted = $unrouted; ExceptionProblems = $exceptionProblems; Governed = @($entries | Where-Object disposition -EQ 'governed-exception').Count; OutputPath = $OutputPath }
}

#endregion

#region Compare

function Compare-ZtaRun {
    <#
    .SYNOPSIS
        Compares two normalized runs by test ID: new (a finding now that wasn't one, or wasn't evaluated,
        before), regressed (a pass that is now a finding), fixed (a finding that now passes), still open,
        and no longer evaluated (a finding that is now skipped, planned, unable to evaluate or absent:
        not fixed). Refuses runs from different tool versions unless -AcceptVersionChange records who
        reviewed what changed. Writes comparison.json, comparison.md and manifest.json.
    .EXAMPLE
        Compare-ZtaRun -PreviousPath out/run1 -CurrentPath out/run2 -OutputPath out/compare
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PreviousPath, [Parameter(Mandatory)][string]$CurrentPath, [Parameter(Mandatory)][string]$OutputPath,
        [string]$AcceptVersionChange)
    $a = Read-ZtaJson -Path (Join-Path $PreviousPath 'results.json')
    $b = Read-ZtaJson -Path (Join-Path $CurrentPath 'results.json')
    if ($a.run.executedAt -ge $b.run.executedAt) { throw "The previous run ($($a.run.executedAt)) isn't earlier than the current one ($($b.run.executedAt))." }
    $sameVersion = ($a.tool.version -eq $b.tool.version)
    if (-not $sameVersion -and -not $AcceptVersionChange) { throw "The runs are from different tool versions ($($a.tool.version), $($b.tool.version)). Review what changed between them, then pass -AcceptVersionChange '<reviewer and date>' (Book 11, Chapter 10)." }
    $prev = @{}; foreach ($r in $a.results) { $prev[$r.testId] = $r }
    $cur = @{}; foreach ($r in $b.results) { $cur[$r.testId] = $r }
    $rows = foreach ($id in @(@($prev.Keys) + @($cur.Keys) | Sort-Object -Unique { [long]($_ -replace '\D', '0') })) {
        $p = $prev[$id]; $c = $cur[$id]
        $pn = if ($p) { $p.normalized } else { 'absent' }; $cn = if ($c) { $c.normalized } else { 'absent' }
        $change = if ($cn -eq 'Fail') {
            if ($pn -eq 'Fail') { 'still-open' } elseif ($pn -eq 'Pass') { 'regressed' } else { 'new' }
        }
        elseif ($pn -eq 'Fail') { if ($cn -eq 'Pass') { 'fixed' } else { 'no-longer-evaluated' } }
        elseif ($pn -ne $cn) { 'changed' } else { 'unchanged' }
        $t = if ($c) { $c } else { $p }
        [ordered]@{ testId = $id; title = $t.title; pillar = ($t.pillars -join ' '); risk = $t.risk; change = $change; previous = $pn; current = $cn
            previousRaw = $(if ($p) { $p.raw.status } else { '' }); currentRaw = $(if ($c) { $c.raw.status } else { '' }); currentReason = $(if ($c) { $c.reason } else { 'Not in the current run' }) }
    }
    $rows = @($rows)
    $kinds = 'new', 'regressed', 'fixed', 'still-open', 'no-longer-evaluated', 'changed', 'unchanged'
    $counts = [ordered]@{}; foreach ($k in $kinds) { $counts[$k] = @($rows | Where-Object change -EQ $k).Count }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -Recurse -Force -LiteralPath $OutputPath }
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $doc = [ordered]@{ schema = 'fmp-zta-comparison/1'
        previous = [ordered]@{ runDate = $a.run.runDate; executedAt = $a.run.executedAt; version = $a.tool.version; sourceSha256 = $a.run.sourceSha256 }
        current = [ordered]@{ runDate = $b.run.runDate; executedAt = $b.run.executedAt; version = $b.tool.version; sourceSha256 = $b.run.sourceSha256 }
        sameVersion = $sameVersion; versionChangeReviewed = "$AcceptVersionChange"; counts = $counts
        note = 'A finding that is no longer evaluated is not fixed: the test was skipped, planned, unable to run or absent this time. Fix the run and re-run before counting it.'
        rows = $rows }
    Write-ZtaJson -Path (Join-Path $OutputPath 'comparison.json') -Value $doc
    $md = [Collections.Generic.List[string]]::new()
    $md.Add("# Zero Trust Assessment comparison, $($a.run.runDate) to $($b.run.runDate)"); $md.Add('')
    $md.Add("Tool $($a.tool.version) to $($b.tool.version)" + $(if ($sameVersion) { '.' } else { "; version change reviewed: $AcceptVersionChange." })); $md.Add('')
    $md.Add('| Change | Tests |'); $md.Add('|---|---|'); foreach ($k in $kinds) { $md.Add("| $k | $($counts[$k]) |") }
    foreach ($k in 'new', 'regressed', 'no-longer-evaluated', 'fixed', 'still-open') {
        $these = @($rows | Where-Object change -EQ $k); if (-not $these.Count) { continue }
        $md.Add(''); $md.Add("## $k"); $md.Add(''); $md.Add('| Test | Title | Risk | Before | Now |'); $md.Add('|---|---|---|---|---|')
        foreach ($r in $these) { $md.Add("| $($r.testId) | $($r.title) | $($r.risk) | $($r.previous) | $($r.current)$(if ($k -eq 'no-longer-evaluated') { " ($($r.currentReason))" }) |") }
    }
    $md.Add(''); $md.Add($doc.note)
    Write-ZtaText -Path (Join-Path $OutputPath 'comparison.md') -Text (($md -join "`n") + "`n")
    $null = Write-ZtaManifest -OutputPath $OutputPath -Info ([ordered]@{ task = 'compare'; toolVersion = $b.tool.version; runDate = $b.run.runDate; previous = [ordered]@{ runDate = $a.run.runDate; sha256 = (Get-ZtaFileHash -Path (Join-Path $PreviousPath 'results.json')) }; current = [ordered]@{ runDate = $b.run.runDate; sha256 = (Get-ZtaFileHash -Path (Join-Path $CurrentPath 'results.json')) } })
    [pscustomobject]@{ Counts = $counts; SameVersion = $sameVersion; OutputPath = $OutputPath }
}

#endregion

#region Evidence

function Get-ZtaRequirements {
    <#
    .SYNOPSIS
        Reads config/requirements.json: each step's SP 800-53 controls and FedRAMP 20x KSIs, and the steps
        each package must hold.
    .EXAMPLE
        (Get-ZtaRequirements).steps.REGISTER.controls
    #>
    Get-ZtaConfig -Name requirements
}

function Test-ZtaRunFolder {
    <#
    .SYNOPSIS
        Re-hashes every file a run folder's manifest.json lists. Returns @{ Ok; Detail; Manifest }.
    .EXAMPLE
        Test-ZtaRunFolder -Path out/run1
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-ZtaJson -Path $mp
    $bad = @()
    foreach ($f in $m.files.Keys) {
        $fp = Join-Path $Path $f
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$f missing" } elseif ((Get-ZtaFileHash -Path $fp) -ne $m.files[$f]) { $bad += "$f changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) files match the manifest" }); Manifest = $m }
}

function Update-ZtaEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder, one "sha256  relative/path" line per file with LF
        endings, so the ISSO can check the folder with sha256sum -c SHA256SUMS.
    .EXAMPLE
        Update-ZtaEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } -Culture ([Globalization.CultureInfo]::InvariantCulture) |
            ForEach-Object { '{0}  {1}' -f (Get-ZtaFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", $script:Utf8)
    $lines.Count
}

function Write-ZtaEvidence {
    <#
    .SYNOPSIS
        Records one kit output folder (normalize, register or compare) as evidence: checks its manifest,
        copies it under runs/, and writes a timestamped record with the steps it covers, their SP 800-53
        controls and FedRAMP 20x KSIs, every file's SHA-256, the source export's SHA-256, and the SHA-256
        of the record before it, so the records form a chain. Appends records.csv; rewrites SHA256SUMS.
    .EXAMPLE
        Write-ZtaEvidence -EvidencePath out/evidence -RunPath out/run1 -AsOf 2026-10-27T19:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$Command = '', [string]$Operator = '', [string]$Note = '')
    $AsOf = ConvertTo-ZtaUtc $AsOf
    $req = Get-ZtaRequirements
    $t = Test-ZtaRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $step = switch ($t.Manifest.task) { 'normalize' { 'NORMALIZE' } 'register' { 'REGISTER' } 'compare' { 'COMPARE' } default { throw "No evidence step for task '$($t.Manifest.task)'." } }
    $steps = @($step, 'EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-ZtaFileHash -Path $prior[-1].FullName } else { $null }
    $name = '{0:d4}-{1}-{2}' -f $seq, $t.Manifest.task, $t.Manifest.runDate
    $dest = Join-Path $EvidencePath "runs/$name"
    if (Test-Path -LiteralPath $dest) { Remove-Item -Recurse -Force -LiteralPath $dest }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in $t.Manifest.files.Keys) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-ZtaFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @($steps | ForEach-Object { $req.steps[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req.steps[$_].ksis } | Sort-Object -Unique)
    $rec = [ordered]@{
        schema = 'fmp-zta-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = $t.Manifest.task; runDate = $t.Manifest.runDate; toolVersion = $t.Manifest.toolVersion
        source = $(if ($t.Manifest.Contains('source')) { $t.Manifest.source } else { $null })
        operator = $Operator; command = $Command.Trim(); result = $(if ($t.Ok) { 'Pass' } else { 'Fail' }); detail = $t.Detail; note = $Note
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_].title } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-ZtaJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-ZtaText -Path $csv -Text "sequence,recordedAt,task,runDate,toolVersion,result,steps,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $AsOf, $t.Manifest.task, $t.Manifest.runDate, $t.Manifest.toolVersion, $rec.result, ($steps -join ' '), ($controls -join ' '), ($ksis -join ' '), (Get-ZtaFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", $script:Utf8)
    $null = Update-ZtaEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $rec.result; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-ZtaEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: every file SHA256SUMS lists is unchanged and every file is listed; each
        record's files match their hashes; the chain is unbroken; and, with -Package, every step the package
        needs (config/requirements.json 'packages') has a passing record for -RunDate. One row per check.
    .EXAMPLE
        Test-ZtaEvidence -EvidencePath out/evidence -Package re-run -RunDate 2026-11-10
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [ValidateSet('first-run', 're-run')][string]$Package, [string]$RunDate)
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $sums = Join-Path $root 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) { & $add 'SUMS' $false 'no SHA256SUMS'; return $rows.ToArray() }
    $listed = @{}; $bad = @()
    foreach ($l in (Get-Content -LiteralPath $sums)) { if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] } }
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-ZtaFileHash -Path $f.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { ($bad | Sort-Object) -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}
    foreach ($r in $recs) {
        $j = Read-ZtaJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($f in @($j.files)) { $fp = Join-Path $root $f.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-ZtaFileHash -Path $fp) -ne $f.sha256) { $chain += "$($f.path) doesn't match $($r.Name)" } }
        if ($j.result -eq 'Pass' -and (-not $RunDate -or $j.runDate -eq $RunDate)) { foreach ($s in @($j.steps)) { $passed[$s.id] = $true } }
        $prev = Get-ZtaFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Package) {
        foreach ($s in (Get-ZtaRequirements).packages[$Package]) { & $add "STEP-$s" $passed.Contains($s) $(if ($passed.Contains($s)) { "a passing record covers it$(if ($RunDate) { " for $RunDate" })" } else { "no passing record$(if ($RunDate) { " for $RunDate" })" }) }
    }
    $rows.ToArray()
}

#endregion

Export-ModuleMember -Function Read-ZtaJson, Write-ZtaJson, Get-ZtaFileHash, ConvertTo-ZtaUtc, Get-ZtaConfig, Resolve-ZtaExportFile, Read-ZtaExport,
ConvertTo-ZtaResult, Invoke-ZtaNormalization, Get-ZtaFamily, Get-ZtaPriority, Get-ZtaExceptionState, Invoke-ZtaRegister, Compare-ZtaRun,
Get-ZtaRequirements, Test-ZtaRunFolder, Update-ZtaEvidenceSums, Write-ZtaEvidence, Test-ZtaEvidence
