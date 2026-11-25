# Chapter 08: the evidence chain and the monthly run.

function Test-IpRunFolder {
    <#
    .SYNOPSIS
        Checks that a run folder's files match its manifest.
    .EXAMPLE
        Test-IpRunFolder -Path out/labels
    #>
    param([Parameter(Mandatory)][string]$Path)
    $mp = Join-Path $Path 'manifest.json'
    if (-not (Test-Path -LiteralPath $mp)) { return @{ Ok = $false; Detail = "no manifest.json in $Path"; Manifest = $null } }
    $m = Read-IpJson -Path $mp
    $bad = @()
    foreach ($f in $m.files.Keys) {
        $fp = Join-Path $Path $f
        if (-not (Test-Path -LiteralPath $fp)) { $bad += "$f missing" } elseif ((Get-IpFileHash -Path $fp) -ne $m.files[$f]) { $bad += "$f changed since its manifest" }
    }
    @{ Ok = (-not $bad.Count); Detail = $(if ($bad.Count) { $bad -join '; ' } else { "$($m.files.Count) files match the manifest" }); Manifest = $m }
}

function Update-IpEvidenceSums {
    <#
    .SYNOPSIS
        Rewrites SHA256SUMS in an evidence folder, one "sha256  path" line per file, so the ISSO can check it
        with sha256sum -c SHA256SUMS.
    .EXAMPLE
        Update-IpEvidenceSums -EvidencePath out/evidence
    #>
    param([Parameter(Mandatory)][string]$EvidencePath)
    $root = (Resolve-Path -LiteralPath $EvidencePath).Path.TrimEnd('\', '/')
    $lines = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object Name -NE 'SHA256SUMS' |
            Sort-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
            ForEach-Object { '{0}  {1}' -f (Get-IpFileHash -Path $_.FullName), $_.FullName.Substring($root.Length + 1).Replace('\', '/') })
    Write-IpText -Path (Join-Path $root 'SHA256SUMS') -Text (($lines -join "`n") + "`n")
    $lines.Count
}

function Write-IpEvidence {
    <#
    .SYNOPSIS
        Records one run folder as evidence: checks it against its manifest, copies it under runs/, and writes
        a record with the time, environment, change record, the integrity result, the run's own check result,
        the step it covers with its NIST SP 800-53 Rev 5 controls and KSIs (config/requirements.json), every
        file's SHA-256 and the SHA-256 of the record before it. Appends records.csv; rewrites SHA256SUMS.
    .EXAMPLE
        Write-IpEvidence -EvidencePath out/evidence -RunPath out/labels -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EvidencePath, [Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$ChangeRecord = '', [string]$Command = '')
    $AsOf = ConvertTo-IpUtc $AsOf
    $req = Get-IpRequirements
    $t = Test-IpRunFolder -Path $RunPath
    if (-not $t.Manifest) { throw $t.Detail }
    $step = "$($t.Manifest.task)".ToUpperInvariant() -replace '-', ''
    if (-not $req.steps.Contains($step)) { throw "No evidence step for task '$($t.Manifest.task)' in config/requirements.json." }
    $steps = @($step, 'EVIDENCE')
    New-Item -ItemType Directory -Force -Path (Join-Path $EvidencePath 'records') | Out-Null
    $prior = @(Get-ChildItem -LiteralPath (Join-Path $EvidencePath 'records') -Filter '*.json' -File | Sort-Object Name)
    $seq = $prior.Count + 1
    $prev = if ($prior.Count) { Get-IpFileHash -Path $prior[-1].FullName } else { $null }
    $name = '{0:d4}-{1}' -f $seq, $t.Manifest.task
    $dest = Join-Path $EvidencePath "runs/$name"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path (Join-Path $RunPath '*') -Destination $dest -Recurse -Force
    $files = @(foreach ($k in $t.Manifest.files.Keys) { [ordered]@{ path = "runs/$name/$k"; sha256 = $t.Manifest.files[$k] } }) + @([ordered]@{ path = "runs/$name/manifest.json"; sha256 = (Get-IpFileHash -Path (Join-Path $RunPath 'manifest.json')) })
    $controls = @($steps | ForEach-Object { $req.steps[$_].controls } | Sort-Object -Unique)
    $ksis = @($steps | ForEach-Object { $req.steps[$_].ksis } | Sort-Object -Unique)
    $check = if ($t.Manifest.Contains('result')) { "$($t.Manifest.result)" } else { 'Pass' }
    $rec = [ordered]@{
        schema = 'fmp-ip-evidence/1'; sequence = $seq; recordedAt = $AsOf; task = $t.Manifest.task; environment = "$($t.Manifest.environment)"; cloud = "$($t.Manifest.cloud)"
        mode = "$($t.Manifest.mode)"; changeRecord = $ChangeRecord; command = $Command.Trim(); result = $(if ($t.Ok) { 'Pass' } else { 'Fail' }); detail = $t.Detail; checkResult = $check
        steps = @($steps | ForEach-Object { [ordered]@{ id = $_; title = $req.steps[$_].title; controls = @($req.steps[$_].controls); ksis = @($req.steps[$_].ksis) } })
        controls = @($controls | ForEach-Object { [ordered]@{ id = $_; title = $req.controls[$_].title } }); ksis = $ksis
        claim = 'Supports the controls listed; the agency''s assessor decides whether a control is satisfied. KSIs are FedRAMP''s indicators for cloud service providers; this record lines the agency''s evidence up with them.'
        files = $files; previousRecordSha256 = $prev
    }
    $recPath = Join-Path $EvidencePath "records/$name.json"
    Write-IpJson -Path $recPath -Value $rec
    $csv = Join-Path $EvidencePath 'records.csv'
    if (-not (Test-Path -LiteralPath $csv)) { Write-IpText -Path $csv -Text "sequence,recordedAt,task,environment,result,checkResult,controls,ksis,recordSha256,previousRecordSha256`n" }
    $line = (@($seq, $AsOf, $t.Manifest.task, "$($t.Manifest.environment)", $rec.result, $check, ($controls -join ' '), ($ksis -join ' '), (Get-IpFileHash -Path $recPath), "$prev") | ForEach-Object { '"' + ("$_" -replace '"', '""') + '"' }) -join ','
    [IO.File]::AppendAllText($csv, $line + "`n", [Text.UTF8Encoding]::new($false))
    $null = Update-IpEvidenceSums -EvidencePath $EvidencePath
    [pscustomobject]@{ Record = $recPath; Sequence = $seq; Result = $rec.result; CheckResult = $check; Steps = $steps; Controls = $controls; Ksis = $ksis }
}

function Test-IpEvidence {
    <#
    .SYNOPSIS
        Checks an evidence folder: every file in SHA256SUMS unchanged and every file listed; each record's
        files match; the chain unbroken; and, with -Stage, every step the stage needs has a record whose files
        are intact and whose run's own check passed. One row per check.
    .EXAMPLE
        Test-IpEvidence -EvidencePath out/evidence -Stage test
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
        if (-not $listed.Contains($rel)) { $bad += "$rel not listed" } elseif ($listed[$rel] -ne (Get-IpFileHash -Path $f.FullName)) { $bad += "$rel changed" }
    }
    foreach ($k in $listed.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $root $k))) { $bad += "$k missing" } }
    & $add 'SUMS' (-not $bad.Count) $(if ($bad.Count) { $bad -join '; ' } else { "$($listed.Count) files match SHA256SUMS" })
    $recs = @(Get-ChildItem -LiteralPath (Join-Path $root 'records') -Filter '*.json' -File -ErrorAction SilentlyContinue | Sort-Object Name)
    $prev = $null; $chain = @(); $passed = @{}; $seen = @{}
    foreach ($r in $recs) {
        $j = Read-IpJson -Path $r.FullName
        if ("$($j.previousRecordSha256)" -ne "$prev") { $chain += "$($r.Name) doesn't follow the record before it" }
        foreach ($f in @($j.files)) { $fp = Join-Path $root $f.path; if (-not (Test-Path -LiteralPath $fp) -or (Get-IpFileHash -Path $fp) -ne $f.sha256) { $chain += "$($f.path) doesn't match $($r.Name)" } }
        foreach ($s in @($j.steps)) { $seen[$s.id] = $true; if ($j.result -eq 'Pass' -and "$($j.checkResult)" -ne 'Fail') { $passed[$s.id] = $true } }
        $prev = Get-IpFileHash -Path $r.FullName
    }
    & $add 'CHAIN' ($recs.Count -and -not $chain.Count) $(if (-not $recs.Count) { 'no records' } elseif ($chain.Count) { $chain -join '; ' } else { "$($recs.Count) records, chain unbroken" })
    if ($Stage) {
        foreach ($s in (Get-IpRequirements).stages[$Stage]) {
            $d = if ($passed.Contains($s)) { 'a passing record covers it' } elseif ($seen.Contains($s)) { 'recorded, but the run''s own check failed: close its findings and run it again' } else { 'no record' }
            & $add "STEP-$s" $passed.Contains($s) $d
        }
    }
    $rows.ToArray()
}

function Invoke-IpRunAll {
    <#
    .SYNOPSIS
        The monthly run: every check against one export, drift against the last approved export when one is
        given, the audit check with a synthetic search when one is given, then the metrics; each run folder
        recorded as evidence when -EvidencePath is given. A check that throws is recorded as an error and the
        run goes on.
    .EXAMPLE
        Invoke-IpRunAll -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -RunRoot out/month -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$RunRoot,
        [Parameter(Mandatory)][string]$AsOf, [string]$BaselinePath, [string]$SyntheticPath, [string]$EvidencePath, [string]$ChangeRecord = '',
        [string[]]$Tasks = @('access', 'inventory', 'labels', 'protection', 'dlp', 'autolabel', 'audit', 'drift', 'metrics'))
    if (Test-Path -LiteralPath $RunRoot) { Remove-Item -Recurse -Force -LiteralPath $RunRoot }
    New-Item -ItemType Directory -Force -Path $RunRoot | Out-Null
    $common = @{ Settings = $Settings; AsOf = $AsOf }
    foreach ($task in $Tasks) {
        $o = Join-Path $RunRoot $task
        $res = $null; $err = ''
        try {
            $res = switch ($task) {
                'access' { Invoke-IpAccess @common -SnapshotPath $SnapshotPath -OutputPath $o }
                'inventory' { Invoke-IpInventory @common -SnapshotPath $SnapshotPath -OutputPath $o }
                'labels' { Invoke-IpLabels @common -SnapshotPath $SnapshotPath -OutputPath $o }
                'protection' { Invoke-IpProtection @common -SnapshotPath $SnapshotPath -OutputPath $o }
                'dlp' { Invoke-IpDlp @common -SnapshotPath $SnapshotPath -OutputPath $o }
                'autolabel' { Invoke-IpAutoLabel @common -SnapshotPath $SnapshotPath -OutputPath $o }
                'audit' { if ($SyntheticPath) { Invoke-IpAudit @common -SnapshotPath $SnapshotPath -OutputPath $o -SyntheticPath $SyntheticPath } else { Invoke-IpAudit @common -SnapshotPath $SnapshotPath -OutputPath $o } }
                'drift' { if ($BaselinePath) { Invoke-IpDrift @common -BaselinePath $BaselinePath -SnapshotPath $SnapshotPath -OutputPath $o } }
                'metrics' { Invoke-IpMetrics @common -RunRoot $RunRoot -OutputPath $o }
                default { throw "Unknown task '$task'." }
            }
        } catch { $err = $_.Exception.Message }
        if (-not $res -and -not $err) { continue }
        $rec = ''
        if ($res -and $EvidencePath) { $rec = '{0:d4}' -f (Write-IpEvidence -EvidencePath $EvidencePath -RunPath $res.OutputPath -AsOf $AsOf -ChangeRecord $ChangeRecord -Command "monthly run: $task").Sequence }
        [pscustomobject]@{
            Task = $task; Result = $(if ($err) { 'Error' } else { $res.Result })
            Fails = $(if ($res) { @($res.Rows | Where-Object Status -EQ 'Fail').Count } else { 0 }); Record = $rec; Detail = $err
        }
    }
}

function Show-IpResult {
    <#
    .SYNOPSIS
        Prints a check's rows as a table and a one-line summary.
    .EXAMPLE
        Invoke-IpLabels @p | Show-IpResult
    #>
    param([Parameter(Mandatory, ValueFromPipeline)]$Run)
    process {
        foreach ($r in @($Run.Rows)) { Write-Host ('{0,-10} {1,-4}  {2}: {3}' -f $r.Id, $r.Status, $r.Subject, $r.Detail) }
        $c = @($Run.Rows); Write-Host ('{0}: {1} ({2} pass, {3} fail, {4} other). Written to {5}' -f $Run.Task, $Run.Result, @($c | Where-Object Status -EQ 'Pass').Count, @($c | Where-Object Status -EQ 'Fail').Count, @($c | Where-Object { $_.Status -notin 'Pass', 'Fail' }).Count, (Resolve-Path -Relative -LiteralPath $Run.OutputPath).Replace('\', '/'))
    }
}
