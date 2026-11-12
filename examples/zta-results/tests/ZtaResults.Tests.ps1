#Requires -Version 7.1
# Pester 5: reading the export, the taxonomy, the register, the comparison and the evidence chain.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/ZtaResults/ZtaResults.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Run1 = Join-Path $Kit 'tests/fixtures/run-2026-10-27'
    $script:Run2 = Join-Path $Kit 'tests/fixtures/run-2026-11-10'
    $script:Reviews = Join-Path $Kit 'tests/fixtures/inputs/reviews.csv'
    $script:Exceptions = Join-Path $Kit 'tests/fixtures/inputs/exceptions.csv'
    $script:N1 = Invoke-ZtaNormalization -ExportPath $Run1 -OutputPath (Join-Path $TestDrive 'run1')
    $script:N2 = Invoke-ZtaNormalization -ExportPath $Run2 -OutputPath (Join-Path $TestDrive 'run2') -ReviewsPath $Reviews
    $script:R1 = Invoke-ZtaRegister -RunPath (Join-Path $TestDrive 'run1') -OutputPath (Join-Path $TestDrive 'run1-register')
    $script:R2 = Invoke-ZtaRegister -RunPath (Join-Path $TestDrive 'run2') -OutputPath (Join-Path $TestDrive 'run2-register') -ExceptionsPath $Exceptions
    $script:C = Compare-ZtaRun -PreviousPath (Join-Path $TestDrive 'run1') -CurrentPath (Join-Path $TestDrive 'run2') -OutputPath (Join-Path $TestDrive 'compare')
    $script:Reg2 = Read-ZtaJson -Path (Join-Path $TestDrive 'run2-register/register.json')
    $script:Res2 = Read-ZtaJson -Path (Join-Path $TestDrive 'run2/results.json')
    function script:Entry([string]$id) { @($Reg2.entries | Where-Object { $_.tool.test -eq $id })[0] }
    function script:Result([string]$id) { @($Res2.results | Where-Object { $_.testId -eq $id })[0] }
    function script:Copy-Export([string]$from, [scriptblock]$edit) {
        $j = Read-ZtaJson -Path (Join-Path $from 'zt-export/ZeroTrustAssessmentReport.json')
        & $edit $j
        $dir = Join-Path $TestDrive ("edit-" + [guid]::NewGuid().ToString('n').Substring(0, 8))
        Write-ZtaJson -Path (Join-Path $dir 'zt-export/ZeroTrustAssessmentReport.json') -Value $j
        $dir
    }
}

Describe 'Reading the export' {
    It 'finds the JSON from the report folder, the zt-export folder or the file' {
        $f = Resolve-ZtaExportFile -Path $Run1
        $f | Should -Match 'zt-export[\\/]ZeroTrustAssessmentReport\.json$'
        Resolve-ZtaExportFile -Path (Join-Path $Run1 'zt-export') | Should -Be $f
        Resolve-ZtaExportFile -Path $f | Should -Be $f
    }
    It 'reads the run metadata and every test' {
        $e = Read-ZtaExport -Path $Run1
        $e.CurrentVersion | Should -Be '3.1.0'
        @($e.Tests).Count | Should -Be 33
        ConvertTo-ZtaUtc $e.ExecutedAt | Should -Be '2026-10-27T18:05:31Z'
    }
    It 'refuses a file without the EndOfJson marker the tool writes last' {
        $d = Copy-Export $Run1 { param($j) $j.Remove('EndOfJson') }
        { Read-ZtaExport -Path $d } | Should -Throw '*EndOfJson*'
    }
    It 'refuses a test listed twice' {
        $d = Copy-Export $Run1 { param($j) $j.Tests = @($j.Tests) + @($j.Tests[0]) }
        { Read-ZtaExport -Path $d } | Should -Throw '*twice*'
    }
    It 'refuses a folder with no export' { { Read-ZtaExport -Path $TestDrive } | Should -Throw '*No ZeroTrustAssessmentReport.json*' }
}

Describe 'The taxonomy' {
    It 'maps every skip reason the 3.1.0 source declares' {
        # Add-ZtTestResultDetail.ps1's ValidateSet for -SkippedBecause at tag 3.1.0
        $declared = 'NotConnectedAzure', 'NotConnectedExchange', 'NotConnectedSecurityCompliance', 'NotConnectedToService', 'NotLicensedEntraIDP1',
        'NotLicensedEntraIDP2', 'NotLicensedEntraIDGovernance', 'NotLicensedEntraWorkloadID', 'NotSupported', 'UnderConstruction',
        'NotLicensedIntune', 'NoAzureAccess', 'NotApplicable', 'NotDotGovDomain', 'NoCompatibleLicenseFound', 'TimeoutReached'
        $t = Get-ZtaConfig -Name taxonomy
        foreach ($d in $declared) { $t.skipReasons.Contains($d) | Should -BeTrue -Because $d }
        @($t.skipReasons.Keys).Count | Should -Be $declared.Count
    }
    It 'maps every status Get-ZtTestStatus can return' {
        $t = Get-ZtaConfig -Name taxonomy
        foreach ($s in 'Passed', 'Failed', 'Investigate', 'Planned', 'Error', 'Skipped') { $t.statuses.Contains($s) | Should -BeTrue -Because $s }
    }
    It 'sorts skip reasons into the three Skipped classes and Unable-to-Evaluate' -ForEach @(
        @{ Reason = 'NotLicensedEntraIDP2'; Expected = 'Skipped-Licensing' }
        @{ Reason = 'NoCompatibleLicenseFound'; Expected = 'Skipped-Licensing' }
        @{ Reason = 'NotConnectedExchange'; Expected = 'Skipped-Disconnected' }
        @{ Reason = 'NoAzureAccess'; Expected = 'Skipped-Disconnected' }
        @{ Reason = 'NotApplicable'; Expected = 'Skipped-Not-Applicable' }
        @{ Reason = 'NotDotGovDomain'; Expected = 'Skipped-Not-Applicable' }
        @{ Reason = 'TimeoutReached'; Expected = 'Unable-to-Evaluate' }
    ) {
        (ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Skipped'; TestSkipped = $Reason }).normalized | Should -Be $Expected
    }
    It 'makes Planned a Planned result, not a skip' { (ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Planned'; TestSkipped = 'UnderConstruction' }).normalized | Should -Be 'Planned' }
    It 'counts Investigate as a finding and flags it for review' {
        $r = ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Investigate' }
        $r.normalized | Should -Be 'Fail'; $r.investigate | Should -BeTrue
    }
    It 'lets a recorded review dismiss an Investigate result, naming the reviewer' {
        $r = ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Investigate' } -Review ([pscustomobject]@{ decision = 'dismissed'; reviewer = 'Identity engineering'; reviewedOn = '2026-11-11'; note = 'Expected' })
        $r.normalized | Should -Be 'Pass'; $r.review | Should -Match 'dismissed by Identity engineering'
    }
    It 'refuses a review decision it does not know' {
        { ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Investigate' } -Review ([pscustomobject]@{ decision = 'maybe' }) } | Should -Throw '*confirmed or dismissed*'
    }
    It 'flags NotSupported as a boundary reason and NotDotGovDomain for review' {
        (ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Skipped'; TestSkipped = 'NotSupported' }).boundary | Should -BeTrue
        (ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Skipped'; TestSkipped = 'NotDotGovDomain' }).reviewReason | Should -Match '\.gov'
    }
    It 'never turns an unknown status or skip reason into a pass or a failure' {
        $a = ConvertTo-ZtaResult -Test @{ TestId = '1'; TestStatus = 'Deferred' }
        $b = ConvertTo-ZtaResult -Test @{ TestId = '2'; TestStatus = 'Skipped'; TestSkipped = 'NotLicensedSomethingNew' }
        $c = ConvertTo-ZtaResult -Test @{ TestId = '3'; TestStatus = 'Skipped' }
        foreach ($r in $a, $b, $c) { $r.normalized | Should -Be 'Unable-to-Evaluate'; $r.unmapped | Should -BeTrue }
    }
    It 'keeps a test with several pillars under each, and files it under the first for the CISA pillar' {
        $r = ConvertTo-ZtaResult -Test @{ TestId = '35003'; TestStatus = 'Failed'; TestPillar = @('Data', 'AI') }
        $r.pillars -join ',' | Should -Be 'Data,AI'; $r.cisaPillar | Should -Be 'Data'
    }
}

Describe 'Normalizing a run' {
    It 'counts the first run by normalized result' {
        $N1.Tests | Should -Be 33
        $N1.Counts.Pass | Should -Be 8; $N1.Counts.Fail | Should -Be 17; $N1.Counts.Planned | Should -Be 1
        $N1.Counts.'Skipped-Licensing' | Should -Be 2; $N1.Counts.'Skipped-Disconnected' | Should -Be 1
        $N1.Counts.'Skipped-Not-Applicable' | Should -Be 2; $N1.Counts.'Unable-to-Evaluate' | Should -Be 2
        $N1.Investigate | Should -Be 1
    }
    It 'counts the second run, with the Investigate result confirmed by review' {
        $N2.Tests | Should -Be 34; $N2.Findings | Should -Be 15; $N2.Counts.Pass | Should -Be 10; $N2.Counts.'Skipped-Disconnected' | Should -Be 3
        (Result '21837').review | Should -Match 'confirmed'
    }
    It 'adds every test to exactly one column' {
        ($N2.Counts.Values | Measure-Object -Sum).Sum | Should -Be $N2.Tests
    }
    It 'writes every output and a manifest with the source SHA-256' {
        foreach ($f in 'results.json', 'results.csv', 'summary.json', 'summary.md', 'dispositions.csv', 'manifest.json') { Join-Path $TestDrive "run2/$f" | Should -Exist }
        $m = Read-ZtaJson -Path (Join-Path $TestDrive 'run2/manifest.json')
        $m.source.sha256 | Should -Be (Get-ZtaFileHash -Path (Resolve-ZtaExportFile -Path $Run2))
        $m.task | Should -Be 'normalize'; $m.runDate | Should -Be '2026-11-10'
    }
    It 'never copies the tool''s result text, which can name tenant objects' {
        foreach ($f in 'results.json', 'results.csv', 'dispositions.csv', 'summary.md') { Get-Content -Raw (Join-Path $TestDrive "run2/$f") | Should -Not -Match 'Fictional fixture: ' }
    }
    It 'lists every result that is neither a pass nor a finding as a disposition' {
        $d = Import-Csv (Join-Path $TestDrive 'run2/dispositions.csv')
        $d.Count | Should -Be 9
        ($d | Where-Object testId -EQ '21883').action | Should -Match 'licensing decision'
        ($d | Where-Object testId -EQ '41032').action | Should -Match 'Fix the run'
    }
    It 'says the taxonomy has not been reviewed for another tool version' {
        $d = Copy-Export $Run2 { param($j) $j.CurrentVersion = '3.2.0' }
        $r = Invoke-ZtaNormalization -ExportPath $d -OutputPath (Join-Path $TestDrive 'v32')
        $r.TaxonomyReviewed | Should -BeFalse
        Get-Content -Raw (Join-Path $TestDrive 'v32/summary.md') | Should -Match "hasn't been reviewed"
    }
}

Describe 'The closure register' {
    It 'has one entry per finding' { $R1.Findings | Should -Be 17; $R2.Findings | Should -Be 15; @($Reg2.entries).Count | Should -Be 15 }
    It 'routes each finding to its family and remediation page' {
        (Entry '21816').family.id | Should -Be 'standing-privilege'
        (Entry '21816').remediation.page | Should -Be 'docs/books/b04-access/08-pim-self-request-with-approval.md#role-setting-export-and-exception-register'
        (Entry '25381').family.id | Should -Be 'network-access'
        (Entry '21861').family.id | Should -Be 'identity-risk-triage'
    }
    It 'routes by category when the test ID is not listed, and says so' {
        $f = Get-ZtaFamily -Result @{ testId = '99999'; category = 'Azure Network Security' }
        $f.family | Should -Be 'ddos-waf-exposure'; $f.matchedBy | Should -Be 'category'
    }
    It 'leaves a finding no family covers unrouted, for the program lead' {
        $R1.Unrouted | Should -Be @('41032')
        $u = @((Read-ZtaJson -Path (Join-Path $TestDrive 'run1-register/register.json')).entries | Where-Object { $_.tool.test -eq '41032' })[0]
        $u.owner | Should -Match 'program lead'
    }
    It 'carries every field of Book 11''s closure chain' {
        $e = Entry '21772'
        foreach ($k in 'finding', 'attack_path', 'owner', 'dependency', 'change', 'pilot', 'enforcement', 'test', 'evidence', 'residual_risk', 'reassessment', 'weighting', 'closure') { $e.Contains($k) | Should -BeTrue -Because $k }
        $e.finding | Should -Be 'ZTA-21772-2026-11-10'
        $e.result.normalized | Should -Be 'Fail'
        $e.dependency | Should -Be @('family:ownerless-apps')
    }
    It 'never marks a finding ready for closure' { @($Reg2.entries | Where-Object { $_.closure.ready }).Count | Should -Be 0 }
    It 'scores priority as severity divided by effort' {
        $p = Get-ZtaPriority -Risk High -Status Failed -ImplementationCost High
        $p.severity | Should -Be 80; $p.priority | Should -Be 26.7; $p.bucket | Should -Be 'P3'
        (Get-ZtaPriority -Risk High -Status Investigate -ImplementationCost Low).bucket | Should -Be 'P2'
        (Get-ZtaPriority -Risk Medium -Status Failed -ImplementationCost Low).bucket | Should -Be 'P1'
    }
    It 'sorts the register highest priority first' {
        $p = @($Reg2.entries | ForEach-Object { $_.priority.priority })
        ($p -join ',') | Should -Be (($p | Sort-Object -Descending) -join ',')
    }
    It 'applies the approval rule to exceptions' {
        (Entry '25533').disposition | Should -Be 'governed-exception'
        (Entry '25533').residual_risk.accepted_by | Should -Be 'CISO'
        (Entry '21885').disposition | Should -Be 'wrong-approver'
        $R2.ExceptionProblems | Should -Be @('21885')
        (Get-ZtaExceptionState -Exception ([pscustomobject]@{ approverRole = 'CISO'; expires = '2026-11-01' }) -AsOf '2026-11-10T00:00:00Z').disposition | Should -Be 'lapsed-acceptance'
        (Get-ZtaExceptionState -Exception ([pscustomobject]@{ approverRole = 'authorizing official'; expires = '' }) -AsOf '2026-11-10T00:00:00Z').disposition | Should -Be 'governed-exception'
    }
    It 'writes a CSV row per finding' {
        $csv = Import-Csv (Join-Path $TestDrive 'run2-register/register.csv')
        $csv.Count | Should -Be 15
        ($csv | Where-Object testId -EQ '21837').investigate | Should -Be 'true'
    }
}

Describe 'Comparing two runs' {
    It 'sorts every test into one kind of change' {
        $C.Counts.new | Should -Be 2; $C.Counts.regressed | Should -Be 1; $C.Counts.fixed | Should -Be 3
        $C.Counts.'still-open' | Should -Be 12; $C.Counts.'no-longer-evaluated' | Should -Be 2
        ($C.Counts.Values | Measure-Object -Sum).Sum | Should -Be 34
    }
    It 'does not count a finding the tool skipped this time as fixed' {
        $rows = (Read-ZtaJson -Path (Join-Path $TestDrive 'compare/comparison.json')).rows
        (@($rows | Where-Object { $_.testId -eq '21860' })[0]).change | Should -Be 'no-longer-evaluated'
        (@($rows | Where-Object { $_.testId -eq '41050' })[0]).change | Should -Be 'new'
        (@($rows | Where-Object { $_.testId -eq '21783' })[0]).change | Should -Be 'regressed'
    }
    It 'refuses runs from different tool versions unless a review is recorded' {
        $d = Copy-Export $Run2 { param($j) $j.CurrentVersion = '3.2.0' }
        $null = Invoke-ZtaNormalization -ExportPath $d -OutputPath (Join-Path $TestDrive 'v32b')
        { Compare-ZtaRun -PreviousPath (Join-Path $TestDrive 'run1') -CurrentPath (Join-Path $TestDrive 'v32b') -OutputPath (Join-Path $TestDrive 'cmp-v') } | Should -Throw '*different tool versions*'
        $r = Compare-ZtaRun -PreviousPath (Join-Path $TestDrive 'run1') -CurrentPath (Join-Path $TestDrive 'v32b') -OutputPath (Join-Path $TestDrive 'cmp-v') -AcceptVersionChange 'ISSO, 2026-11-11'
        $r.SameVersion | Should -BeFalse
    }
    It 'refuses runs in the wrong order' {
        { Compare-ZtaRun -PreviousPath (Join-Path $TestDrive 'run2') -CurrentPath (Join-Path $TestDrive 'run1') -OutputPath (Join-Path $TestDrive 'cmp-x') } | Should -Throw '*isn''t earlier*'
    }
}

Describe 'Evidence' {
    BeforeAll {
        $script:Ev = Join-Path $TestDrive 'evidence'
        $script:E1 = Write-ZtaEvidence -EvidencePath $Ev -RunPath (Join-Path $TestDrive 'run2') -AsOf '2026-11-10T20:00:00Z' -Command './Invoke-ZtaNormalize.ps1 ...'
        $script:E2 = Write-ZtaEvidence -EvidencePath $Ev -RunPath (Join-Path $TestDrive 'run2-register') -AsOf '2026-11-10T20:01:00Z'
        $script:E3 = Write-ZtaEvidence -EvidencePath $Ev -RunPath (Join-Path $TestDrive 'compare') -AsOf '2026-11-10T20:02:00Z'
    }
    It 'records each step with its controls and KSIs' {
        $E1.Steps | Should -Be @('NORMALIZE', 'EVIDENCE')
        $E1.Controls | Should -Contain 'CA-7'; $E1.Ksis | Should -Contain 'KSI-MLA-EVC'
        $E2.Controls | Should -Contain 'CA-5'; $E3.Steps | Should -Contain 'COMPARE'
    }
    It 'keeps the source export''s hash in the record, and claims support, not satisfaction' {
        $j = Read-ZtaJson -Path $E1.Record
        $j.source.sha256 | Should -Match '^[0-9a-f]{64}$'
        $j.claim | Should -Match '^Supports'
    }
    It 'passes the check for the re-run package' {
        $rows = Test-ZtaEvidence -EvidencePath $Ev -Package re-run -RunDate 2026-11-10
        @($rows | Where-Object Status -EQ 'Fail').Count | Should -Be 0
        @($rows).Count | Should -Be 5
    }
    It 'fails a package that misses a step for that run date' {
        $rows = Test-ZtaEvidence -EvidencePath $Ev -Package re-run -RunDate 2026-10-27
        @($rows | Where-Object { $_.Status -eq 'Fail' -and $_.Check -like 'STEP-*' }).Count | Should -Be 3
    }
    It 'catches an edited file and a broken chain' {
        $copy = Join-Path $TestDrive 'evidence-tampered'
        Copy-Item -Recurse $Ev $copy
        Add-Content -LiteralPath (Join-Path $copy 'runs/0002-register-2026-11-10/register.csv') -Value 'edited'
        $rows = Test-ZtaEvidence -EvidencePath $copy
        ($rows | Where-Object Check -EQ 'SUMS').Status | Should -Be 'Fail'
        ($rows | Where-Object Check -EQ 'CHAIN').Status | Should -Be 'Fail'
    }
    It 'writes SHA256SUMS that sha256sum can check (LF endings, two spaces)' {
        $raw = [IO.File]::ReadAllText((Join-Path $Ev 'SHA256SUMS'))
        $raw | Should -Not -Match "`r"
        ($raw -split "`n" | Where-Object { $_ })[0] | Should -Match '^[0-9a-f]{64}  \S'
    }
}

Describe 'The finding families' {
    It 'routes every family a test points to' {
        $f = Get-ZtaConfig -Name finding-families
        foreach ($k in $f.tests.Keys) { $f.families.Contains($f.tests[$k]) | Should -BeTrue -Because "test $k" }
        foreach ($k in $f.categories.Keys) { $f.families.Contains($f.categories[$k]) | Should -BeTrue -Because "category $k" }
    }
    It 'gives every family a page, an owner, the evidence for closure and controls' {
        $f = Get-ZtaConfig -Name finding-families
        foreach ($k in $f.families.Keys) {
            $x = $f.families[$k]
            foreach ($p in 'title', 'page', 'owner', 'attackPath', 'ready') { "$($x[$p])" | Should -Not -BeNullOrEmpty -Because "$k.$p" }
            @($x.controls).Count | Should -BeGreaterThan 0 -Because $k
            foreach ($d in @($x.dependsOn)) { $f.families.Contains($d) | Should -BeTrue -Because "$k depends on $d" }
        }
    }
    It 'points at pages that exist in the workbook' {
        $repo = Join-Path $Kit '../..'
        if (-not (Test-Path (Join-Path $repo 'docs/books'))) { Set-ItResult -Skipped -Because 'the kit runs outside the workbook repository'; return }
        $f = Get-ZtaConfig -Name finding-families
        foreach ($k in $f.families.Keys) {
            foreach ($p in @($f.families[$k].page) + @($f.families[$k].alsoSee)) {
                $file, $anchor = $p -split '#', 2
                $path = Join-Path $repo $file
                $path | Should -Exist -Because "$k -> $p"
                if ($anchor) {
                    $md = Get-Content -Raw $path
                    $slugs = [regex]::Matches($md, '(?m)^#{1,6} (.+?)\s*(\{#([\w-]+)\})?\s*$') | ForEach-Object {
                        if ($_.Groups[3].Success) { $_.Groups[3].Value } else { (($_.Groups[1].Value.ToLowerInvariant() -replace '[`*]', '') -replace '[^a-z0-9 _.-]', '' -replace '\s+', '-') }
                    }
                    $slugs | Should -Contain $anchor -Because "$k -> $p"
                }
            }
        }
    }
}
