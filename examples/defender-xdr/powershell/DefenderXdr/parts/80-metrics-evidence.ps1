# Chapter 08 (guide G10): the guide's metrics computed from the month's run folders, and every run recorded as
# hashed, chained evidence with its controls and KSIs.

function Read-XdrRunSummary {
    <#
    .SYNOPSIS
        A run folder's summary.json under a month's run root, or nothing when that run is missing.
    .EXAMPLE
        Read-XdrRunSummary -RunRoot out/month -Task coverage
    #>
    param([Parameter(Mandatory)][string]$RunRoot, [Parameter(Mandatory)][string]$Task)
    $p = Join-Path $RunRoot "$Task/summary.json"
    if (Test-Path -LiteralPath $p) { Read-XdrJson -Path $p } else { $null }
}

function Invoke-XdrMetrics {
    <#
    .SYNOPSIS
        The guide's metrics, from the run folders under -RunRoot (coverage, prevention, asr, incidents,
        detections): protected coverage, enforcement depth, prevention effectiveness (blocks per 1,000
        onboarded devices per week), exception exposure, detection validity and synthetic-event success (from
        an exercise record, when one is given). Mean time to triage and to contain are reported as not
        computed: the Graph incident carries no time of first assignment or containment. A metric whose run
        is missing says so. Writes metrics.json, metrics.md and the manifest.
    .EXAMPLE
        Invoke-XdrMetrics -Settings $s -RunRoot out/month -OutputPath out/month/metrics -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$RunRoot, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [string]$ExercisePath)
    $cov = Read-XdrRunSummary $RunRoot coverage; $prev = Read-XdrRunSummary $RunRoot prevention; $asr = Read-XdrRunSummary $RunRoot asr
    $det = Read-XdrRunSummary $RunRoot detections
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $m = [Collections.Generic.List[object]]::new()
    $add = { param($name, $value, $formula, $basis) $m.Add([pscustomobject][ordered]@{ Metric = $name; Value = $value; Formula = $formula; Basis = $basis }) }
    $onboarded = 0
    if ($cov) {
        $onboarded = [int]$cov.protected + $(if ($cov.byStatus.Contains('NotActive')) { [int]$cov.byStatus.NotActive } else { 0 })
        & $add 'Protected coverage' ("{0}% ({1} of {2})" -f $cov.protectedCoveragePercent, $cov.protected, $cov.inScope) 'Onboarded devices with an active sensor / in-scope devices in the inventory' 'coverage/summary.json'
        & $add 'Exception exposure' ("{0} device(s) under an exception of {1} in scope" -f $cov.excepted, $cov.inScope) 'Devices under an active exception / in-scope devices; expired exceptions are tickets' 'coverage/summary.json'
    }
    else { & $add 'Protected coverage' 'not run' 'Onboarded devices with an active sensor / in-scope devices in the inventory' 'no coverage run' }
    if ($asr -and $onboarded) {
        $all = @($asr.devicesAllBlock).Count
        & $add 'Enforcement depth' ("{0} of {1} onboarded device(s) with every applicable ASR rule in block" -f $all, $onboarded) 'Devices with every ASR rule in block / onboarded devices' 'asr/summary.json, coverage/summary.json'
    }
    else { & $add 'Enforcement depth' 'not run' 'Devices with every ASR rule in block / onboarded devices' 'needs the asr and coverage runs' }
    if ($prev -and $onboarded) {
        $asrBlocks = 0
        $raw = Join-Path $RunRoot 'asr/raw/asr-events.json'
        if (Test-Path -LiteralPath $raw) { $asrBlocks = (@(Get-XdrV (Read-XdrJson -Path $raw) 'results') | Where-Object { "$(Get-XdrV $_ 'ActionType')" -like '*Blocked' } | ForEach-Object { [int](Get-XdrV $_ 'EventCount') } | Measure-Object -Sum).Sum; if ($null -eq $asrBlocks) { $asrBlocks = 0 } }
        $weekly = [double]$prev.blocked + ([double]$asrBlocks * 7 / 30)
        & $add 'Prevention effectiveness' ("{0:N1} blocks per 1,000 devices per week" -f (1000.0 * $weekly / $onboarded)) 'Blocks by ASR (30 days, scaled to a week), network protection and controlled folder access (7 days) per 1,000 onboarded devices' 'prevention/summary.json, asr/raw/asr-events.json'
    }
    else { & $add 'Prevention effectiveness' 'not run' 'Blocks per 1,000 devices per week' 'needs the prevention and coverage runs' }
    if ($asr) { & $add 'Expired ASR exclusions' "$($asr.expiredExclusions)" 'Exclusions past their expiry in the ASR register' 'asr/summary.json' }
    & $add 'Mean time to triage and to contain' 'not computed' 'Incident creation to first assignment, and to containment, by severity' 'the Graph incident carries no assignment or containment time; take it from the ticketing system or the Action center history'
    if ($det) { & $add 'Detection validity' ("{0} of {1} enabled detection(s) with a passing test this run" -f $det.enabledWithPassingTest, $det.enabled) 'Enabled custom detections with a passing known-bad test / enabled detections' 'detections/summary.json' }
    else { & $add 'Detection validity' 'not run' 'Enabled custom detections with a passing known-bad test / enabled detections' 'no detections run' }
    if ($ExercisePath) {
        $ex = @(Read-XdrCsv -Path $ExercisePath)
        $okEx = @($ex | Where-Object { "$($_.Observed)" -match '^(?i)(yes|true)$' }).Count
        & $add 'Synthetic-event success' ("{0} of {1}" -f $okEx, $ex.Count) 'Synthetic events that produced their expected alert or event / events run' (Split-Path -Leaf $ExercisePath)
    }
    else { & $add 'Synthetic-event success' 'no exercise record supplied' 'Synthetic events that produced their expected alert or event / events run' 'pass -ExercisePath with the quarter''s exercise record' }
    Write-XdrJson -Path (Join-Path $out 'metrics.json') -Value @{ asOf = (ConvertTo-XdrUtc $AsOf); environment = $Settings.environment; metrics = $m.ToArray() }
    $md = @('# Defender XDR metrics', '', "As of $(ConvertTo-XdrUtc $AsOf), environment $($Settings.environment).", '', '| Metric | Value | Formula | From |', '|---|---|---|---|')
    foreach ($r in $m) { $md += "| $($r.Metric) | $($r.Value) | $($r.Formula) | $($r.Basis) |" }
    Write-XdrText -Path (Join-Path $out 'metrics.md') -Text (($md -join "`n") + "`n")
    $null = Write-XdrManifest -OutputPath $out -Task metrics -AsOf $AsOf -Mode 'Files' -Environment $Settings.environment -Extra @{ result = 'Pass' }
    [pscustomobject]@{ Metrics = $m.ToArray(); OutputPath = $out }
}

# ----------------------------------------------------------------------------- evidence

function Get-XdrRequirements {
    <#
    .SYNOPSIS
        Reads config/requirements.json: each step's SP 800-53 controls and FedRAMP 20x KSIs, and the steps
        each stage's evidence must hold.
    .EXAMPLE
        (Get-XdrRequirements).steps.ASR.controls
    #>
    param([string]$Path = (Join-Path $script:ConfigRoot 'requirements.json'))
    Read-XdrJson -Path $Path
}

function Test-XdrRunFolder {
    <#
    .SYNOPSIS
        Re-hashes every file a run folder's manifest lists. Returns @{ Ok; Detail; Manifest }.
    .EXAMPLE
        Test-XdrRunFolder -Path out/coverage
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-XdrJson -Path $mp
    $bad = @()
    foreach ($f in $m.files.Keys) {
        $fp = Join-Path $Path $f
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$f missing" } elseif ((Get-XdrFileHash -Path $fp) -ne $m.files[$f]) { $bad += "$f changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) files match the manifest" }); Manifest = $m }
}

function Get-XdrStepsForRun {
    <#
    .SYNOPSIS
        The evidence steps a run folder's manifest covers, from its task.
    .EXAMPLE
        Get-XdrStepsForRun -Manifest (Read-XdrJson -Path out/coverage/manifest.json)
    #>
    param([Parameter(Mandatory)][Collections.IDictionary]$Manifest)
    switch ($Manifest.task) {
        'access' { @('ACCESS') } 'coverage' { @('COVERAGE') } 'device-state' { @('COVERAGE') } 'prevention' { @('PREVENTION') } 'asr' { @('ASR') }
        'exposure' { @('EXPOSURE') } 'incidents' { @('INCIDENTS') } 'detections' { @('DETECTIONS') } 'signals' { @('SIGNALS') }
        'automation' { @('AUTOMATION') } 'metrics' { @('METRICS') } 'preflight' { @('PRE') } 'scheduled-run' { @('RUN') }
        'publish' { @('PUBLISH') } 'rollback' { @('RB') }
        default { throw "No evidence step for task '$($Manifest.task)'." }
    }
}

function Update-XdrEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder: one "sha256  relative/path" line per file, LF endings, so
        the ISSO can check it with sha256sum -c SHA256SUMS. Returns the line count.
    .EXAMPLE
        Update-XdrEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
            ForEach-Object { '{0}  {1}' -f (Get-XdrFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    [IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS'), ($lines -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    $lines.Count
}

function Write-XdrEvidence {
    <#
    .SYNOPSIS
        Records one run folder as evidence: checks its manifest, copies it under runs/, and writes a record
        with the time, environment, change record, command, the integrity result (Pass only if every file
        matches its manifest), the run's own check result, the steps it covers with their SP 800-53 controls
        and FedRAMP 20x KSIs, every file's SHA-256 and the SHA-256 of the record before it. Appends
        records.csv and rewrites SHA256SUMS.
    .EXAMPLE
        Write-XdrEvidence -EvidencePath out/evidence -RunPath out/coverage -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$Command = '', [string]$ChangeRecord = '', [string]$Note = '')
    $AsOf = ConvertTo-XdrUtc $AsOf
    $req = Get-XdrRequirements
    $t = Test-XdrRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $steps = @(Get-XdrStepsForRun -Manifest $t.Manifest) + @('EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-XdrFileHash -Path $prior[-1].FullName } else { $null }
    $name = '{0:d4}-{1}' -f $seq, $t.Manifest.task
    $dest = Join-Path $EvidencePath "runs/$name"
    if (Test-Path -LiteralPath $dest) { Remove-Item -Recurse -Force -LiteralPath $dest }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in $t.Manifest.files.Keys) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-XdrFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @($steps | ForEach-Object { $req.steps[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req.steps[$_].ksis } | Sort-Object -Unique)
    $check = if ($t.Manifest.Contains('result')) { "$($t.Manifest.result)" } else { 'Pass' }
    $rec = [ordered]@{
        schema = 'fmp-xdr-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = $t.Manifest.task; environment = "$($t.Manifest.environment)"; mode = "$($t.Manifest.mode)"
        changeRecord = $ChangeRecord; command = $Command.Trim(); result = $(if ($t.Ok) { 'Pass' } else { 'Fail' }); detail = $t.Detail; checkResult = $check; note = $Note
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_].title } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-XdrJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-XdrText -Path $csv -Text "sequence,recordedAt,task,environment,result,checkResult,steps,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $AsOf, $t.Manifest.task, "$($t.Manifest.environment)", $rec.result, $check, ($steps -join ' '), ($controls -join ' '), ($ksis -join ' '), (Get-XdrFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", [Text.UTF8Encoding]::new($false))
    $null = Update-XdrEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $rec.result; CheckResult = $check; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-XdrEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: every file SHA256SUMS lists is unchanged and every file is listed; each
        record's files match their hashes; the chain is unbroken; and, with -Stage, every step the stage needs
        (config/requirements.json 'stages') has a record whose files are intact and whose run's own check
        passed. Returns one row per check.
    .EXAMPLE
        Test-XdrEvidence -EvidencePath out/evidence -Stage test
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [ValidateSet('test', 'production')][string]$Stage)
    $rows = [Collections.Generic.List[object]]::new()
    $add = { param($id, $ok, $detail) $rows.Add([pscustomobject][ordered]@{ Check = $id; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $detail }) }
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $sums = Join-Path $root 'SHA256SUMS'
    if (-not (Test-Path -LiteralPath $sums)) { & $add 'SUMS' $false 'no SHA256SUMS'; return $rows.ToArray() }
    $listed = @{}; $bad = @()
    foreach ($l in (Get-Content -LiteralPath $sums)) { if ($l -match '^([0-9a-f]{64})  (.+)$') { $listed[$Matches[2]] = $Matches[1] } }
    foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS')) {
        $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-XdrFileHash -Path $f.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { $bad -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}; $seen = @{}
    foreach ($r in $recs) {
        $j = Read-XdrJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($f in @($j.files)) { $fp = Join-Path $root $f.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-XdrFileHash -Path $fp) -ne $f.sha256) { $chain += "$($f.path) doesn't match $($r.Name)" } }
        foreach ($s in @($j.steps)) { $seen[$s.id] = "$($j.checkResult)"; if ($j.result -eq 'Pass' -and "$($j.checkResult)" -ne 'Fail') { $passed[$s.id] = $true } }
        $prev = Get-XdrFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Stage) {
        foreach ($s in (Get-XdrRequirements).stages[$Stage]) {
            $d = if ($passed.Contains($s)) { 'a passing record covers it' } elseif ($seen.Contains($s)) { 'recorded, but the run''s own check failed: close its findings and run it again' } else { 'no record' }
            & $add "STEP-$s" $passed.Contains($s) $d
        }
    }
    $rows.ToArray()
}
