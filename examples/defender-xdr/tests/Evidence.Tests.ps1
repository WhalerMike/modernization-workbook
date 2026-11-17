#Requires -Version 7.1
# Pester 5: the monthly run, the metrics and the evidence chain (Chapter 08).
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/DefenderXdr/DefenderXdr.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:S = Read-XdrSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    $script:AsOf = '2026-11-16T12:00:00Z'
    $script:Month = Join-Path $TestDrive 'month'
    $script:Ev = Join-Path $TestDrive 'evidence'
    $script:Rows = Invoke-XdrRunAll -Settings $S -Invoker (New-XdrFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/graph')) -RunRoot $Month -AsOf $AsOf -EvidencePath $Ev -ChangeRecord 'CHG-LAB-0001'
    $script:Req = Get-XdrRequirements
}

Describe 'The monthly run' {
    It 'runs every check and the metrics, with no errors' {
        @($Rows | ForEach-Object Task) | Should -Be @('access', 'coverage', 'prevention', 'asr', 'exposure', 'incidents', 'detections', 'signals', 'automation', 'metrics')
        @($Rows | Where-Object Result -EQ 'Error').Count | Should -Be 0
    }
    It 'records each run in order' { @($Rows | ForEach-Object Record) | Should -Be @('0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010') }
    It 'records a check that throws as an error and goes on' {
        $s2 = Read-XdrSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $s2.inputs.owners = Join-Path $TestDrive 'missing.json'
        $r = Invoke-XdrRunAll -Settings $s2 -Invoker (New-XdrFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/graph')) -RunRoot (Join-Path $TestDrive 'm2') -AsOf $AsOf -Tasks exposure, signals
        @($r | Where-Object Task -EQ 'exposure')[0].Result | Should -Be 'Error'
        @($r | Where-Object Task -EQ 'signals')[0].Result | Should -Be 'Pass'
    }
}

Describe 'Metrics' {
    BeforeAll { $script:M = (Read-XdrJson -Path (Join-Path $Month 'metrics/metrics.json')).metrics; function script:V($n) { @($M | Where-Object { $_.Metric -eq $n })[0].Value } }
    It 'computes protected coverage from the coverage run' { V 'Protected coverage' | Should -Be '64.3% (9 of 14)' }
    It 'computes enforcement depth against onboarded devices' { V 'Enforcement depth' | Should -Be '2 of 11 onboarded device(s) with every applicable ASR rule in block' }
    It 'computes detection validity' { V 'Detection validity' | Should -Be '1 of 1 enabled detection(s) with a passing test this run' }
    It 'reads synthetic-event success from the exercise record' { V 'Synthetic-event success' | Should -Be '4 of 5' }
    It 'says plainly that mean time to triage is not computed from Graph' { V 'Mean time to triage and to contain' | Should -Be 'not computed' }
    It 'says a metric''s run is missing rather than inventing it' {
        $r = Invoke-XdrMetrics -Settings $S -RunRoot (Join-Path $TestDrive 'empty') -OutputPath (Join-Path $TestDrive 'empty-metrics') -AsOf $AsOf
        @($r.Metrics | Where-Object Metric -EQ 'Protected coverage')[0].Value | Should -Be 'not run'
    }
}

Describe 'Requirements' {
    It 'gives every step controls and KSIs, and every control a title' {
        foreach ($k in $Req.steps.Keys) {
            @($Req.steps[$k].controls).Count | Should -BeGreaterThan 0
            @($Req.steps[$k].ksis).Count | Should -BeGreaterThan 0
            foreach ($c in $Req.steps[$k].controls) { $Req.controls.Contains($c) | Should -BeTrue -Because "$k cites $c" }
            foreach ($q in $Req.steps[$k].ksis) { $q | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' }
        }
    }
    It 'keeps the guide''s pairs for the gates' {
        @($Req.steps.ASR.controls) | Should -Be @('CM-7', 'CM-6', 'SI-3')
        @($Req.steps.COVERAGE.ksis) | Should -Be @('KSI-PIY-GIV', 'KSI-MLA-OSM')
        @($Req.steps.INCIDENTS.controls) | Should -Be @('IR-4', 'IR-5', 'IR-6', 'AU-6')
    }
    It 'names only steps that exist in each stage' { foreach ($st in 'test', 'production') { foreach ($x in $Req.stages[$st]) { $Req.steps.Contains($x) | Should -BeTrue } } }
}

Describe 'Evidence' {
    It 'writes records with the claim language, the controls, the KSIs and the check result' {
        $r = Read-XdrJson -Path (Join-Path $Ev 'records/0004-asr.json')
        $r.claim | Should -Match '^Supports the controls listed; the agency''s assessor decides'
        $r.claim | Should -Not -Match 'satisf(ies|y) the'
        @($r.controls | ForEach-Object { $_.id }) | Should -Contain 'CM-7'
        $r.ksis | Should -Contain 'KSI-SVC-ACM'
        $r.checkResult | Should -Be 'Fail'
        $r.changeRecord | Should -Be 'CHG-LAB-0001'
    }
    It 'chains each record to the one before it' {
        $r2 = Read-XdrJson -Path (Join-Path $Ev 'records/0002-coverage.json')
        $r2.previousRecordSha256 | Should -Be (Get-XdrFileHash -Path (Join-Path $Ev 'records/0001-access.json'))
    }
    It 'passes the integrity check' { @(Test-XdrEvidence -EvidencePath $Ev | Where-Object Status -EQ 'Fail').Count | Should -Be 0 }
    It 'fails the go/no-go for a step whose run found something, and for a missing step' {
        $t = @(Test-XdrEvidence -EvidencePath $Ev -Stage test)
        @($t | Where-Object Check -EQ 'STEP-COVERAGE')[0].Detail | Should -Match 'own check failed'
        @($t | Where-Object Check -EQ 'STEP-PRE')[0].Detail | Should -Be 'no record'
        @($t | Where-Object Check -EQ 'STEP-SIGNALS').Count | Should -Be 0
        @(Test-XdrEvidence -EvidencePath $Ev -Stage production | Where-Object Check -EQ 'STEP-SIGNALS')[0].Status | Should -Be 'Pass'
    }
    It 'catches a changed file and names it' {
        $copy = Join-Path $TestDrive 'ev-copy'; Copy-Item -Recurse $Ev $copy
        Add-Content -LiteralPath (Join-Path $copy 'runs/0002-coverage/tickets.csv') -Value '"WKS-FAKE"'
        $t = @(Test-XdrEvidence -EvidencePath $copy)
        @($t | Where-Object Check -EQ 'SUMS')[0].Detail | Should -Match 'tickets.csv changed'
        @($t | Where-Object Check -EQ 'CHAIN')[0].Status | Should -Be 'Fail'
    }
    It 'catches a record removed from the middle' {
        $copy = Join-Path $TestDrive 'ev-copy2'; Copy-Item -Recurse $Ev $copy
        Remove-Item (Join-Path $copy 'records/0003-prevention.json')
        $null = Update-XdrEvidenceSums -EvidencePath $copy
        @(Test-XdrEvidence -EvidencePath $copy | Where-Object Check -EQ 'CHAIN')[0].Detail | Should -Match "doesn't follow"
    }
    It 'refuses a folder with no manifest' {
        $d = Join-Path $TestDrive 'nomanifest'; New-Item -ItemType Directory $d | Out-Null
        { Write-XdrEvidence -EvidencePath (Join-Path $TestDrive 'ev3') -RunPath $d -AsOf $AsOf } | Should -Throw '*no manifest*'
    }
    It 'writes SHA256SUMS in the form sha256sum -c reads' {
        (Get-Content (Join-Path $Ev 'SHA256SUMS'))[0] | Should -Match '^[0-9a-f]{64}  records\.csv$|^[0-9a-f]{64}  [a-z]'
    }
}
