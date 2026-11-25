#Requires -Version 7.1
# Pester 5: the monthly run, the metrics, the requirements and the evidence chain (Chapter 08).
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/InformationProtection/InformationProtection.psm1') -Force
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    $script:S = Read-IpSettings -Path (Join-Path $Fx 'settings.lab.json')
    $script:AsOf = '2026-11-24T15:00:00Z'
    $script:Month = Join-Path $TestDrive 'month'
    $script:Ev = Join-Path $TestDrive 'evidence'
    $script:Rows = @(Invoke-IpRunAll -Settings $S -SnapshotPath (Join-Path $Fx 'snapshots/2026-11-24') -BaselinePath (Join-Path $Fx 'snapshots/2026-10-24') -SyntheticPath (Join-Path $Fx 'synthetic/2026-11-24.json') -RunRoot $Month -EvidencePath $Ev -AsOf $AsOf -ChangeRecord 'CHG-LAB-0001')
    $script:Req = Get-IpRequirements
}

Describe 'The monthly run' -Tag ch08 {
    It 'runs every check, drift and the metrics, with no errors' {
        @($Rows | ForEach-Object Task) | Should -Be @('access', 'inventory', 'labels', 'protection', 'dlp', 'autolabel', 'audit', 'drift', 'metrics')
        @($Rows | Where-Object Result -EQ 'Error').Count | Should -Be 0
    }
    It 'records each run in order' { @($Rows | ForEach-Object Record) | Should -Be @('0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009') }
    It 'leaves drift out when no baseline is given' {
        $r = @(Invoke-IpRunAll -Settings $S -SnapshotPath (Join-Path $Fx 'snapshots/2026-11-24') -RunRoot (Join-Path $TestDrive 'm2') -AsOf $AsOf -Tasks labels, drift)
        @($r | ForEach-Object Task) | Should -Be @('labels')
    }
    It 'records a check that throws as an error and goes on' {
        $s2 = Read-IpSettings -Path (Join-Path $Fx 'settings.lab.json'); $s2.inputs.roleRegister = Join-Path $TestDrive 'missing.csv'
        $r = @(Invoke-IpRunAll -Settings $s2 -SnapshotPath (Join-Path $Fx 'snapshots/2026-11-24') -RunRoot (Join-Path $TestDrive 'm3') -AsOf $AsOf -Tasks access, labels)
        $r[0].Result | Should -Be 'Error'
        $r[1].Result | Should -Be 'Fail'
    }
}

Describe 'Metrics' -Tag ch08 {
    BeforeAll { $script:M = (Read-IpJson -Path (Join-Path $Month 'metrics/metrics.json')).metrics; function script:V($n) { @($M | Where-Object { $_.Metric -eq $n })[0].Value } }
    It 'counts unexplained drift' { V 'M11 Unexplained drift' | Should -Be '6' }
    It 'counts expired exceptions from the register' { V 'M12 Expired exceptions' | Should -Be '1 of 3' }
    It 'reads synthetic-event success from the audit run' { V 'M8 Audit-search success for synthetic events' | Should -Be '2 of 3' }
    It 'says plainly what it doesn''t compute' { V 'M4 DLP true-positive rate after tuning' | Should -Be 'not computed by the kit' }
}

Describe 'Requirements' -Tag ch08 {
    It 'gives every step controls and KSIs, and every control a title' {
        foreach ($k in $Req.steps.Keys) {
            @($Req.steps[$k].controls).Count | Should -BeGreaterThan 0
            foreach ($c in $Req.steps[$k].controls) { $Req.controls.Contains($c) | Should -BeTrue -Because "$k cites $c" }
            foreach ($q in $Req.steps[$k].ksis) { $q | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' }
        }
    }
    It 'keeps the guide''s pairs' {
        @($Req.steps.LABELS.controls) | Should -Be @('AC-16', 'MP-3', 'AC-3', 'AC-21')
        @($Req.steps.AUDIT.ksis) | Should -Be @('KSI-MLA-LET', 'KSI-MLA-OSM')
    }
    It 'names only steps that exist in each stage' { foreach ($st in 'test', 'production') { foreach ($x in $Req.stages[$st]) { $Req.steps.Contains($x) | Should -BeTrue } } }
}

Describe 'Evidence' -Tag ch08 {
    It 'writes records with the claim language, the controls and the check result' {
        $r = Read-IpJson -Path (Join-Path $Ev 'records/0003-labels.json')
        $r.claim | Should -Match 'assessor decides'
        $r.checkResult | Should -Be 'Fail'
        @($r.controls | ForEach-Object id) | Should -Contain 'AC-16'
        $r.changeRecord | Should -Be 'CHG-LAB-0001'
    }
    It 'chains the records and checks clean' {
        $t = Test-IpEvidence -EvidencePath $Ev
        @($t | Where-Object Status -EQ 'Fail').Count | Should -Be 0
    }
    It 'catches a changed file' {
        $copy = Join-Path $TestDrive 'ev2'; Copy-Item -Recurse $Ev $copy
        Add-Content -LiteralPath (Join-Path $copy 'runs/0003-labels/results.csv') -Value 'tampered'
        @(Test-IpEvidence -EvidencePath $copy | Where-Object Status -EQ 'Fail').Count | Should -BeGreaterThan 0
    }
    It 'holds the test stage until the failed checks pass' {
        $t = Test-IpEvidence -EvidencePath $Ev -Stage test
        @($t | Where-Object Check -EQ 'STEP-LABELS')[0].Detail | Should -Match 'own check failed'
    }
}
