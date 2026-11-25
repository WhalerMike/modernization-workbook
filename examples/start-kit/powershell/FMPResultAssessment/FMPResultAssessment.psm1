#Requires -Version 5.1
<#
.SYNOPSIS
    Federal Modernization Workbook Start Kit: assess a finished run's results.

.DESCRIPTION
    Reads the files a Start Kit run wrote (and, when given, a Non-Person Identity kit run's
    register, findings and ownership), and writes one assessment: findings by severity, the
    top risks, the duplicate and orphan SPN counts by reason, service accounts with no host
    and with no owner, and, against an earlier run, what changed. Markdown for people, CSV for
    the tracker, JSON for the next tool.

    Reads files only: no directory, no server, no network. Writes only under -OutputPath,
    through the guarded writers, never into the run it reads (whose manifest hashes it).

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

$script:FMPSeverityOrder = @{ High = 0; Medium = 1; Low = 2; Info = 3 }

# Every rule: its severity, what it means, and the requirements and KSIs the evidence supports.
$script:FMPAssessmentRules = [ordered]@{
    'RUN-INCOMPLETE'      = @{ Severity = 'High';   Category = 'Run';        Title = 'A collector failed: the run is partial';                          Controls = 'CA-7'; Ksi = 'KSI-MLA-EVC' }
    'RUN-INPUT-CHANGED'   = @{ Severity = 'Medium'; Category = 'Run';        Title = 'An input file changed while the run read it';                     Controls = 'CA-7, CM-3'; Ksi = 'KSI-MLA-EVC' }
    'SPN-DUPLICATE'       = @{ Severity = 'High';   Category = 'Kerberos';   Title = 'Duplicate SPN: Kerberos fails and clients fall back to NTLM';      Controls = 'IA-2, IA-5, CM-8'; Ksi = 'KSI-IAM-SNU' }
    'SPN-ORPHAN-HOST'     = @{ Severity = 'Medium'; Category = 'Kerberos';   Title = 'SPN on a host with no computer object and no DNS record';          Controls = 'CM-8, AC-2'; Ksi = 'KSI-PIY-GIV' }
    'SPN-ORPHAN-ACCOUNT'  = @{ Severity = 'Low';    Category = 'Kerberos';   Title = 'SPN on a disabled account or one with no recent logon';           Controls = 'AC-2(3), CM-8'; Ksi = 'KSI-IAM-SNU' }
    'DELEG-UNCONSTRAINED-HOST'    = @{ Severity = 'High'; Category = 'Delegation'; Title = 'Computer (not a domain controller) trusted for unconstrained delegation'; Controls = 'AC-6, IA-2'; Ksi = 'KSI-IAM-ELP' }
    'DELEG-UNCONSTRAINED-ACCOUNT' = @{ Severity = 'High'; Category = 'Delegation'; Title = 'User or service account trusted for unconstrained delegation'; Controls = 'AC-6, IA-2'; Ksi = 'KSI-IAM-ELP' }
    'PRIV-DELEGABLE'      = @{ Severity = 'High';   Category = 'Privilege';  Title = 'Privileged user whose credentials can be delegated';              Controls = 'AC-6(5), IA-2'; Ksi = 'KSI-IAM-JIT' }
    'PRIV-ADMINCOUNT-ORPHAN' = @{ Severity = 'Medium'; Category = 'Privilege'; Title = 'adminCount=1 with no privileged group: stale protection';      Controls = 'AC-2, AC-6'; Ksi = 'KSI-IAM-ELP' }
    'SVC-NO-HOST'         = @{ Severity = 'Medium'; Category = 'Service accounts'; Title = 'Service account that no server read runs a service as';       Controls = 'CM-8, AC-2'; Ksi = 'KSI-PIY-GIV' }
    'SVC-NO-OWNER'        = @{ Severity = 'Medium'; Category = 'Service accounts'; Title = 'Service account with no valid human owner';                    Controls = 'AC-2, IA-4'; Ksi = 'KSI-IAM-SNU' }
    'SVC-SERVER-UNREACHABLE' = @{ Severity = 'Info'; Category = 'Service accounts'; Title = 'Server whose services could not be read';                    Controls = 'CM-8'; Ksi = 'KSI-PIY-GIV' }
    'PKI-ESCALATION'      = @{ Severity = 'High';   Category = 'PKI';        Title = 'Certificate template or CA escalation path (ESC)';               Controls = 'SC-17, AC-6'; Ksi = 'KSI-SVC-ASM' }
    'COMPUTER-STALE'      = @{ Severity = 'Low';    Category = 'Hygiene';    Title = 'Stale computer object';                                           Controls = 'CM-8'; Ksi = 'KSI-PIY-GIV' }
    'GROUP-CIRCULAR'      = @{ Severity = 'Low';    Category = 'Hygiene';    Title = 'Group nested in itself';                                          Controls = 'AC-2'; Ksi = 'KSI-IAM-ELP' }
    'NPI-FINDING'         = @{ Severity = 'High';   Category = 'Non-person identity'; Title = 'Non-person identity kit finding';                            Controls = 'AC-2, IA-4, IA-5, CM-8'; Ksi = 'KSI-IAM-SNU' }
    'NPI-WARN'            = @{ Severity = 'Medium'; Category = 'Non-person identity'; Title = 'Non-person identity kit warning';                            Controls = 'AC-2, IA-4, IA-5, CM-8'; Ksi = 'KSI-IAM-SNU' }
    'NPI-INFO'            = @{ Severity = 'Info';   Category = 'Non-person identity'; Title = 'Non-person identity kit note';                               Controls = 'CM-8'; Ksi = 'KSI-PIY-GIV' }
}

function Get-FMPAssessmentRule {
    <#
    .SYNOPSIS
        The assessment's rules: ID, severity, category, title, and the NIST SP 800-53 controls
        and FedRAMP 20x KSI each one's evidence supports.
    .EXAMPLE
        Get-FMPAssessmentRule | Format-Table Rule, Severity, Title, Controls, Ksi
    #>
    foreach ($k in $script:FMPAssessmentRules.Keys) {
        $r = $script:FMPAssessmentRules[$k]
        [pscustomobject][ordered]@{ Rule = $k; Severity = $r.Severity; Category = $r.Category; Title = $r.Title; Controls = $r.Controls; Ksi = $r.Ksi }
    }
}

function Format-FMPAssessmentFinding {
    # One finding, with a stable ID (rule:object) so a later run's comparison can match it.
    param([string]$Rule, [string]$Object, [string]$Detail, [string]$Source, [string]$Severity)
    $r = $script:FMPAssessmentRules[$Rule]
    [pscustomobject][ordered]@{
        Id = "${Rule}:$Object"; Rule = $Rule; Severity = $(if ($Severity) { $Severity } else { $r.Severity }); Category = $r.Category
        Object = $Object; Title = $r.Title; Detail = $Detail; Source = $Source; Controls = $r.Controls; Ksi = $r.Ksi
    }
}

function Read-FMPRunCsv {
    # Every row of one CSV name across the run's domain folders, with the domain added.
    param([string]$RunPath, [string]$Relative)
    foreach ($d in @(Get-ChildItem -LiteralPath $RunPath -Directory)) {
        $p = Join-Path $d.FullName $Relative
        if (Test-Path -LiteralPath $p) {
            $dn = $d.Name
            Import-Csv -LiteralPath $p | Select-Object *, @{ N = '_Domain'; E = { $dn } }
        }
    }
}

function Get-FMPRunAssessment {
    <#
    .SYNOPSIS
        Assesses one finished run: its findings and its counts, without writing anything.
    .DESCRIPTION
        -RunPath is a Start Kit run folder (<OutputPath>\<run-id>). -NpiPath, optional, is a
        Non-Person Identity kit inventory folder (register.json, findings.json), and
        -NpiOwnershipPath its ownership folder (ownership.json). A count whose source the run
        didn't collect is 'not collected', never zero.
    .EXAMPLE
        Get-FMPRunAssessment -RunPath D:\Assessment\2026-11-25-0200-host-tierB | Select-Object -ExpandProperty Counts
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [string]$NpiPath,
        [string]$NpiOwnershipPath
    )
    $run = (Resolve-Path -LiteralPath $RunPath).Path
    $nc = 'not collected'
    $f = [System.Collections.Generic.List[object]]::new()
    $manifestPath = Join-Path $run 'AssessmentManifest.json'
    $manifest = if (Test-Path -LiteralPath $manifestPath) { Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json } else { $null }
    foreach ($s in @($manifest.Steps | Where-Object { $_ -and $_.Status -eq 'Failed' })) { $f.Add((Format-FMPAssessmentFinding 'RUN-INCOMPLETE' $s.Step "$($s.Error)" 'AssessmentManifest.json')) }
    foreach ($c in @($manifest.InputsChanged | Where-Object { $_ })) { $f.Add((Format-FMPAssessmentFinding 'RUN-INPUT-CHANGED' $c.Path "$($c.Parameter): $($c.Before) -> $($c.After)" 'AssessmentManifest.json')) }

    $kerb = @(Get-ChildItem -LiteralPath $run -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'Kerberos') }) | Select-Object -First 1
    $dupes = $null; $orphans = $null
    if ($kerb) {
        $dupes = @(Import-Csv -LiteralPath (Join-Path $kerb.FullName 'Kerberos\SpnDuplicates.csv'))
        foreach ($d in $dupes) { $f.Add((Format-FMPAssessmentFinding 'SPN-DUPLICATE' $d.Spn "Held by $($d.Holders)" 'Kerberos\SpnDuplicates.csv')) }
        $orphans = @(Import-Csv -LiteralPath (Join-Path $kerb.FullName 'Kerberos\SpnOrphans.csv'))
        foreach ($g in ($orphans | Group-Object { "$($_.Domain)\$($_.Account)" })) {
            $reasons = @($g.Group | ForEach-Object { "$($_.Reason)" -split '; ' } | Where-Object { $_ } | Sort-Object -Unique)
            $spns = @($g.Group | ForEach-Object { $_.Spn }) -join '; '
            if ($reasons -contains 'HostNotFound') { $f.Add((Format-FMPAssessmentFinding 'SPN-ORPHAN-HOST' $g.Name "$spns ($($reasons -join ', '))" 'Kerberos\SpnOrphans.csv')) }
            else { $f.Add((Format-FMPAssessmentFinding 'SPN-ORPHAN-ACCOUNT' $g.Name "$spns ($($reasons -join ', '))" 'Kerberos\SpnOrphans.csv')) }
        }
    }

    $delegHosts = @(Read-FMPRunCsv $run 'Objects\DelegationReport.csv' | Where-Object { $_.DelegationType -eq 'Unconstrained' -and "$($_.IsDomainController)" -ne 'True' })
    foreach ($h in $delegHosts) { $f.Add((Format-FMPAssessmentFinding 'DELEG-UNCONSTRAINED-HOST' "$($h._Domain)\$($h.Name)" "$($h.OperatingSystem)" 'Objects\DelegationReport.csv')) }
    foreach ($a in @(Read-FMPRunCsv $run 'Objects\UserDelegationReport.csv' | Where-Object DelegationType -eq 'Unconstrained')) { $f.Add((Format-FMPAssessmentFinding 'DELEG-UNCONSTRAINED-ACCOUNT' "$($a._Domain)\$($a.SamAccountName)" "SPNs: $($a.SPNs)" 'Objects\UserDelegationReport.csv')) }
    foreach ($p in @(Read-FMPRunCsv $run 'Objects\PrivilegedDelegable.csv')) { $f.Add((Format-FMPAssessmentFinding 'PRIV-DELEGABLE' "$($p._Domain)\$($p.SamAccountName)" 'Neither sensitive nor in Protected Users' 'Objects\PrivilegedDelegable.csv')) }
    foreach ($p in @(Read-FMPRunCsv $run 'Objects\AdminCountReport.csv' | Where-Object { "$($_.OrphanedAdminCount)" -eq 'True' })) { $f.Add((Format-FMPAssessmentFinding 'PRIV-ADMINCOUNT-ORPHAN' "$($p._Domain)\$($p.SamAccountName)" "Enabled: $($p.Enabled)" 'Objects\AdminCountReport.csv')) }

    $stale = @(Read-FMPRunCsv $run 'Objects\StaleComputers.csv')
    foreach ($g in ($stale | Group-Object _Domain)) { $f.Add((Format-FMPAssessmentFinding 'COMPUTER-STALE' $g.Name "$($g.Count) stale computer object(s); see the file" 'Objects\StaleComputers.csv')) }
    foreach ($d in @(Get-ChildItem -LiteralPath $run -Directory)) {
        $cg = Join-Path $d.FullName 'Objects\CircularGroups.json'
        if (Test-Path -LiteralPath $cg) { foreach ($g in @(Read-FMPJsonArray -Path $cg)) { if ($g) { $f.Add((Format-FMPAssessmentFinding 'GROUP-CIRCULAR' "$($d.Name)\$($g.Group)" "$($g.DN)" 'Objects\CircularGroups.json')) } } }
        $pki = Join-Path $d.FullName 'PKI\PKISecurityReport.json'
        if (Test-Path -LiteralPath $pki) { foreach ($x in @(Read-FMPJsonArray -Path $pki)) { if ($x) { $f.Add((Format-FMPAssessmentFinding 'PKI-ESCALATION' "$($x.Finding):$($x.Template)" "$($x.Description)" 'PKI\PKISecurityReport.json')) } } }
    }

    # Service accounts: the users with SPNs and the managed accounts the run listed.
    $svcAccounts = @(Read-FMPRunCsv $run 'Objects\ServiceAccounts.csv')
    $hostsFile = Join-Path $run 'ServerServices\ServiceAccountHosts.csv'
    $noHost = $null
    if (Test-Path -LiteralPath $hostsFile) {
        $running = @{}
        foreach ($h in @(Import-Csv -LiteralPath $hostsFile)) { $running["$($h.SamAccountName)".ToLowerInvariant()] = $h }
        $noHost = @($svcAccounts | Where-Object { "$($_.Enabled)" -eq 'True' -and -not $running.ContainsKey("$($_.SamAccountName)".ToLowerInvariant()) })
        foreach ($s in $noHost) { $f.Add((Format-FMPAssessmentFinding 'SVC-NO-HOST' "$($s._Domain)\$($s.SamAccountName)" "$($s.Type); SPNs: $($s.SPNs)" 'ServerServices\ServiceAccountHosts.csv')) }
        foreach ($e in @(Import-Csv -LiteralPath (Join-Path $run 'ServerServices\ServerServiceErrors.csv'))) { $f.Add((Format-FMPAssessmentFinding 'SVC-SERVER-UNREACHABLE' $e.Server $e.Errors 'ServerServices\ServerServiceErrors.csv')) }
    }
    $noOwner = $null
    if ($NpiOwnershipPath) {
        $own = @(Read-FMPJsonArray -Path (Join-Path $NpiOwnershipPath 'ownership.json'))
        $noOwner = @($own | Where-Object { $_ -and [int]$_.ValidHumanOwners -eq 0 -and "$($_.Enabled)" -ne 'False' })
        foreach ($o in $noOwner) { $f.Add((Format-FMPAssessmentFinding 'SVC-NO-OWNER' "$($o.Name)" "$($o.Type); $($o.OwnerProblems)" 'ownership.json')) }
    }
    if ($NpiPath) {
        foreach ($x in @(Read-FMPJsonArray -Path (Join-Path $NpiPath 'findings.json'))) {
            if (-not $x) { continue }
            $rule = switch ("$($x.Severity)") { 'Finding' { 'NPI-FINDING' } 'Warn' { 'NPI-WARN' } default { 'NPI-INFO' } }
            $n = Format-FMPAssessmentFinding $rule "$($x.Rule):$($x.ObjectKey)" "$($x.Object): $($x.Issue)" 'findings.json'
            $n.Title = "$($x.Rule): $($n.Title)"
            $f.Add($n)
        }
    }

    $sorted = @($f | Sort-Object @{ E = { $script:FMPSeverityOrder[$_.Severity] } }, Rule, Object)
    $counts = [ordered]@{
        Findings = $sorted.Count
        High = @($sorted | Where-Object Severity -eq 'High').Count; Medium = @($sorted | Where-Object Severity -eq 'Medium').Count
        Low = @($sorted | Where-Object Severity -eq 'Low').Count; Info = @($sorted | Where-Object Severity -eq 'Info').Count
        DuplicateSpns = if ($null -ne $dupes) { $dupes.Count } else { $nc }
        OrphanSpns = if ($null -ne $orphans) { $orphans.Count } else { $nc }
        OrphanSpnsDisabled = if ($null -ne $orphans) { @($orphans | Where-Object { $_.Reason -match 'Disabled' }).Count } else { $nc }
        OrphanSpnsNoRecentLogon = if ($null -ne $orphans) { @($orphans | Where-Object { $_.Reason -match 'NoRecentLogon' }).Count } else { $nc }
        OrphanSpnsHostNotFound = if ($null -ne $orphans) { @($orphans | Where-Object { $_.Reason -match 'HostNotFound' }).Count } else { $nc }
        ServiceAccounts = if (@(Get-ChildItem -LiteralPath $run -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'Objects\ServiceAccounts.csv') }).Count) { $svcAccounts.Count } else { $nc }
        ServiceAccountsWithoutHost = if ($null -ne $noHost) { $noHost.Count } else { $nc }
        ServiceAccountsWithoutOwner = if ($null -ne $noOwner) { $noOwner.Count } else { $nc }
        UnconstrainedDelegationHosts = $delegHosts.Count
        StaleComputers = $stale.Count
    }
    [pscustomobject][ordered]@{
        RunPath = $run; RunId = if ($manifest) { $manifest.RunId } else { Split-Path -Leaf $run }
        RunStartUtc = if ($manifest) { $manifest.StartTimeUtc } else { $null }; Counts = $counts; Findings = $sorted
    }
}

function Compare-FMPRunAssessment {
    <#
    .SYNOPSIS
        What changed between two assessments: each count's delta, and the findings that are new,
        resolved or still open, matched by their stable IDs.
    .EXAMPLE
        Compare-FMPRunAssessment -Baseline (Get-FMPRunAssessment -RunPath D:\A\run1) -Current (Get-FMPRunAssessment -RunPath D:\A\run2)
    #>
    param([Parameter(Mandatory)]$Baseline, [Parameter(Mandatory)]$Current)
    $deltas = foreach ($k in $Current.Counts.Keys) {
        $b = $Baseline.Counts[$k]; $c = $Current.Counts[$k]
        $num = ($b -is [int] -or $b -is [long]) -and ($c -is [int] -or $c -is [long])
        [pscustomobject][ordered]@{ Measure = $k; Baseline = $b; Current = $c; Change = if ($num) { [long]$c - [long]$b } else { $null } }
    }
    $bIds = @{}; foreach ($x in $Baseline.Findings) { $bIds[$x.Id] = $x }
    $cIds = @{}; foreach ($x in $Current.Findings) { $cIds[$x.Id] = $x }
    $changes = @(
        foreach ($x in $Current.Findings) { if (-not $bIds.ContainsKey($x.Id)) { [pscustomobject][ordered]@{ Change = 'New'; Id = $x.Id; Severity = $x.Severity; Title = $x.Title; Detail = $x.Detail } } }
        foreach ($x in $Baseline.Findings) { if (-not $cIds.ContainsKey($x.Id)) { [pscustomobject][ordered]@{ Change = 'Resolved'; Id = $x.Id; Severity = $x.Severity; Title = $x.Title; Detail = $x.Detail } } }
    )
    [pscustomobject][ordered]@{
        BaselineRunId = $Baseline.RunId; CurrentRunId = $Current.RunId; Counts = @($deltas); Findings = $changes
        New = @($changes | Where-Object Change -eq 'New').Count; Resolved = @($changes | Where-Object Change -eq 'Resolved').Count
        StillOpen = @($Current.Findings | Where-Object { $bIds.ContainsKey($_.Id) }).Count
    }
}

function Invoke-FMPResultAssessment {
    <#
    .SYNOPSIS
        Assesses a finished run and writes ResultAssessment.md, ResultFindings.csv and
        ResultAssessment.json; with -BaselineRunPath, also ResultDelta.csv and the comparison.
    .DESCRIPTION
        The report lists the counts, findings by severity, the top risks (-Top, 10: highest
        severity first, then the rules with the most findings), and every finding with the
        requirement and KSI its evidence supports. Everything goes under -OutputPath, never
        into either run.
    .EXAMPLE
        Invoke-FMPResultAssessment -RunPath D:\Assessment\2026-11-25-0200-host-tierB -OutputPath D:\Reviews\2026-11-25

    .EXAMPLE
        Invoke-FMPResultAssessment -RunPath D:\Assessment\run-nov -BaselineRunPath D:\Assessment\run-oct -NpiPath D:\Npi\inventory -NpiOwnershipPath D:\Npi\ownership -OutputPath D:\Reviews\nov
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RunPath,
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$BaselineRunPath,
        [string]$NpiPath,
        [string]$NpiOwnershipPath,
        [int]$Top = 10
    )
    $out = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $current = Get-FMPRunAssessment -RunPath $RunPath -NpiPath $NpiPath -NpiOwnershipPath $NpiOwnershipPath
    $runFull = $current.RunPath
    if ($out.StartsWith($runFull, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Write the assessment outside the run it reads: $out is inside $runFull, whose manifest hashes every file." }
    $compare = $null
    if ($BaselineRunPath) { $compare = Compare-FMPRunAssessment -Baseline (Get-FMPRunAssessment -RunPath $BaselineRunPath) -Current $current }

    $byRule = @($current.Findings | Group-Object Rule | ForEach-Object {
            [pscustomobject][ordered]@{ Rule = $_.Name; Severity = $_.Group[0].Severity; Title = $_.Group[0].Title; Count = $_.Count; Controls = $_.Group[0].Controls; Ksi = $_.Group[0].Ksi }
        } | Sort-Object @{ E = { $script:FMPSeverityOrder[$_.Severity] } }, @{ E = 'Count'; Descending = $true }, Rule)
    $topRisks = @($byRule | Where-Object { $_.Severity -ne 'Info' } | Select-Object -First $Top)

    Write-FMPCsv -InputObject @($current.Findings) -Path (Join-Path $out 'ResultFindings.csv')
    $doc = [ordered]@{
        Schema = 'fmp-start-kit/result-assessment/1'; GeneratedUtc = (Get-Date).ToUniversalTime().ToString('o')
        RunId = $current.RunId; RunStartUtc = $current.RunStartUtc; Counts = $current.Counts; TopRisks = $topRisks; ByRule = $byRule
        Findings = @($current.Findings); Comparison = $compare
    }
    Write-FMPJson -InputObject $doc -Path (Join-Path $out 'ResultAssessment.json') -Depth 6
    if ($compare) {
        Write-FMPCsv -InputObject @(@($compare.Counts | ForEach-Object { [pscustomobject][ordered]@{ Kind = 'Count'; Item = $_.Measure; Baseline = $_.Baseline; Current = $_.Current; Change = $_.Change } }) +
            @($compare.Findings | ForEach-Object { [pscustomobject][ordered]@{ Kind = "Finding $($_.Change)"; Item = $_.Id; Baseline = $null; Current = $_.Severity; Change = $_.Title } })) -Path (Join-Path $out 'ResultDelta.csv')
    }

    $md = @("# Result assessment: $($current.RunId)", '', "Generated $($doc.GeneratedUtc) from the run's own files. Read-only: nothing was queried.", '', '## Counts', '', '| Measure | Value |', '|---|---|')
    foreach ($k in $current.Counts.Keys) { $md += "| $k | $($current.Counts[$k]) |" }
    $md += @('', '## Top risks', '')
    if ($topRisks.Count -eq 0) { $md += 'None.' } else {
        $md += '| # | Severity | Rule | Findings | What it means | Requirements | KSI |'
        $md += '|---|---|---|---|---|---|---|'
        $i = 0; foreach ($r in $topRisks) { $i++; $md += "| $i | $($r.Severity) | $($r.Rule) | $($r.Count) | $($r.Title) | $($r.Controls) | $($r.Ksi) |" }
    }
    if ($compare) {
        $md += @('', "## Changes since $($compare.BaselineRunId)", '', "$($compare.New) new, $($compare.Resolved) resolved, $($compare.StillOpen) still open.", '', '| Measure | Before | Now | Change |', '|---|---|---|---|')
        foreach ($c in $compare.Counts) { $md += "| $($c.Measure) | $($c.Baseline) | $($c.Current) | $(if ($null -ne $c.Change) { '{0:+#;-#;0}' -f $c.Change } else { '' }) |" }
        if ($compare.Findings.Count) {
            $md += @('', '| Change | Severity | Finding |', '|---|---|---|')
            foreach ($c in $compare.Findings) { $md += "| $($c.Change) | $($c.Severity) | $($c.Id) |" }
        }
    }
    $md += @('', '## Findings by severity', '')
    foreach ($sev in 'High', 'Medium', 'Low', 'Info') {
        $rows = @($current.Findings | Where-Object Severity -eq $sev)
        $md += "### $sev ($($rows.Count))"
        $md += ''
        if ($rows.Count -eq 0) { $md += 'None.'; $md += ''; continue }
        $md += '| Rule | Object | Detail | Source |'
        $md += '|---|---|---|---|'
        foreach ($r in $rows) { $md += "| $($r.Rule) | $($r.Object) | $("$($r.Detail)" -replace '\|', '/') | $($r.Source) |" }
        $md += ''
    }
    Write-FMPText -Value $md -Path (Join-Path $out 'ResultAssessment.md')
    Write-FMPLog -Level STEP -Message ("Result assessment {0}: {1} findings ({2} High, {3} Medium, {4} Low, {5} Info){6}" -f $current.RunId, $current.Counts.Findings,
        $current.Counts.High, $current.Counts.Medium, $current.Counts.Low, $current.Counts.Info, $(if ($compare) { "; $($compare.New) new, $($compare.Resolved) resolved since $($compare.BaselineRunId)" } else { '' }))
    [pscustomobject]$doc
}

Export-ModuleMember -Function Get-FMPAssessmentRule, Get-FMPRunAssessment, Compare-FMPRunAssessment, Invoke-FMPResultAssessment
