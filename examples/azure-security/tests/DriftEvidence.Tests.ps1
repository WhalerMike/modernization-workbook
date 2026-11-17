#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    $script:Out = Join-Path $TestDrive 'out'
    foreach ($w in @(@('week1', '2026-11-09T12:00:00Z'), @('week2', '2026-11-16T12:00:00Z'))) {
        $inv = New-AzsFixtureInvoker -Path (Join-Path $script:Fixtures $w[0])
        foreach ($a in 'baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy') {
            $null = Invoke-AzsCheck -Area $a -Settings $script:Settings -Invoker $inv -AsOf $w[1] -OutputPath (Join-Path $script:Out "$($w[0])/$a")
        }
    }
}

Describe 'Run folders' {
    It 'writes the rows, findings, summary, raw responses and a manifest whose hashes match' {
        $p = Join-Path $script:Out 'week1/exposure'
        foreach ($f in 'exposure.json', 'findings.json', 'findings.csv', 'summary.json', 'register.json', 'register.csv', 'manifest.json', 'raw/arg-public-ips.json') { Join-Path $p $f | Should -Exist }
        (Test-AzsRunFolder -Path $p).Ok | Should -BeTrue
        $m = Read-AzsJson -Path (Join-Path $p 'manifest.json')
        $m.mode | Should -Be 'Fixture'; $m.area | Should -Be 'exposure'
        @($m.calls | ForEach-Object role | Sort-Object -Unique) | Should -Be @('Reader')
    }
    It 'notices a file changed after its manifest' {
        $p = Join-Path $TestDrive 'copy'
        Copy-Item -Recurse (Join-Path $script:Out 'week1/waf') $p
        Add-Content -Path (Join-Path $p 'findings.csv') -Value 'tampered'
        (Test-AzsRunFolder -Path $p).Detail | Should -Be 'findings.csv changed since its manifest'
    }
    It 'writes plans only where a check has commands, and never runs them' {
        Join-Path $script:Out 'week1/waf/plan-prevention.txt' | Should -Exist
        Join-Path $script:Out 'week1/firewall/plan-deny.txt' | Should -Exist
        Join-Path $script:Out 'week2/firewall/plan-deny.txt' | Should -Not -Exist
        (Get-Content (Join-Path $script:Out 'week1/waf/plan-prevention.txt') -First 1) | Should -Match 'did NOT run'
    }
}

Describe 'Drift' {
    It 'compares two runs by fingerprint: new, fixed and still open' {
        $r = Compare-AzsRun -Before (Join-Path $script:Out 'week1') -After (Join-Path $script:Out 'week2') -OutputPath (Join-Path $TestDrive 'drift') -AsOf 2026-11-16T12:00:00Z
        @($r.Areas.firewall.fixed | ForEach-Object rule | Sort-Object) | Should -Be @('AZS-FW-01', 'AZS-FW-02', 'AZS-FW-03', 'AZS-FW-05')
        @($r.Areas.ddos.new | ForEach-Object name) | Should -Be @('pip-new-api')
        $r.Areas.Keys.Count | Should -Be 8
        Join-Path $TestDrive 'drift/drift.md' | Should -Exist
    }
}

Describe 'Metrics' {
    It 'computes the guide''s metrics the kit can, and marks the others' {
        $m = @(Get-AzsMetric -RunPath (Join-Path $script:Out 'week2'))
        $m.Count | Should -Be 12
        ($m | Where-Object metric -EQ 'DDoS coverage').value | Should -Be '57.1%'
        ($m | Where-Object metric -EQ 'Egress inspection').value | Should -Be '60%'
        ($m | Where-Object metric -EQ 'Exercise currency').value | Should -Be 'from the exercise records'
    }
}

Describe 'Evidence' {
    It 'records runs as a chain with the step''s controls and KSIs' {
        $ev = Join-Path $TestDrive 'evidence'
        $e1 = Write-AzsEvidence -EvidencePath $ev -RunPath (Join-Path $script:Out 'week1/ddos') -AsOf 2026-11-09T12:00:00Z
        $e2 = Write-AzsEvidence -EvidencePath $ev -RunPath (Join-Path $script:Out 'week1/private') -AsOf 2026-11-09T12:00:00Z
        $e1.Steps | Should -Be @('DDOS', 'EVIDENCE')
        $e1.Controls | Should -Contain 'SC-5'
        $e1.Ksis | Should -Contain 'KSI-CNA-RVP'
        $e2.Steps | Should -Be @('PL', 'KV', 'EVIDENCE')
        $r2 = Read-AzsJson -Path $e2.Record
        $r2.previousRecordSha256 | Should -Be (Get-AzsFileHash -Path $e1.Record)
        $r2.claim | Should -Match '^Supports the controls listed'
        @(Test-AzsEvidence -EvidencePath $ev | Where-Object Status -EQ 'Fail').Count | Should -Be 0
    }
    It 'fails the check when evidence changes, and never lets fixture records pass a stage' {
        $ev = Join-Path $TestDrive 'evidence2'
        $null = Write-AzsEvidence -EvidencePath $ev -RunPath (Join-Path $script:Out 'week1/baseline') -AsOf 2026-11-09T12:00:00Z
        $stage = Test-AzsEvidence -EvidencePath $ev -Stage test
        ($stage | Where-Object Check -EQ 'STEP-BL').Status | Should -Be 'Fail'
        Add-Content -Path (Join-Path $ev 'records.csv') -Value 'x'
        ((Test-AzsEvidence -EvidencePath $ev) | Where-Object Check -EQ 'SUMS').Status | Should -Be 'Fail'
    }
    It 'maps every requirement step to controls and KSIs the file declares' {
        $req = Get-AzsRequirements
        foreach ($s in $req.steps.Keys) {
            @($req.steps[$s].controls).Count | Should -BeGreaterThan 0
            foreach ($c in $req.steps[$s].controls) { $req.controls.Contains($c) | Should -BeTrue }
            foreach ($k in $req.steps[$s].ksis) { $k | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' }
        }
        foreach ($st in $req.stages.Keys) { foreach ($s in $req.stages[$st]) { $req.steps.Contains($s) | Should -BeTrue } }
    }
}
