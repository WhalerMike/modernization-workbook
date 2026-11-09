#Requires -Version 7.1
# Pester 5: the weekly digest, and the evidence records with their controls, KSIs, hashes and chain.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/ProviderNotices/ProviderNotices.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Routing = Join-Path $Kit 'config/routing.json'
    $s = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    $script:State = Join-Path $TestDrive 'state.json'
    foreach ($d in @(@('day1', '2026-11-09T12:00:00Z'), @('day2', '2026-11-16T12:00:00Z'))) {
        $null = Invoke-PnCollection -Settings $s -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit "tests/fixtures/$($d[0])")) -OutputPath (Join-Path $TestDrive $d[0]) -AsOf $d[1]
        $null = Invoke-PnRouting -NoticesPath (Join-Path $TestDrive "$($d[0])/notices.json") -RoutingPath $Routing -StatePath $State -OutputPath (Join-Path $TestDrive "$($d[0])-route") -AsOf $d[1]
    }
    $script:Dg = New-PnDigest -NoticesPath (Join-Path $TestDrive 'day2/notices.json') -StatePath $State -OutputPath (Join-Path $TestDrive 'digest') -AsOf '2026-11-16T12:00:00Z'
    $script:Md = Get-Content -Raw (Join-Path $TestDrive 'digest/digest.md')
    $script:Ev = Join-Path $TestDrive 'evidence'
    $script:E1 = Write-PnEvidence -EvidencePath $Ev -RunPath (Join-Path $TestDrive 'day2') -AsOf '2026-11-16T12:00:00Z' -Command './Invoke-PnCollect.ps1 ...' -ChangeRecord 'LAB-0001'
    $script:E2 = Write-PnEvidence -EvidencePath $Ev -RunPath (Join-Path $TestDrive 'day2-route') -AsOf '2026-11-16T12:01:00Z'
    $script:E3 = Write-PnEvidence -EvidencePath $Ev -RunPath (Join-Path $TestDrive 'digest') -AsOf '2026-11-16T12:02:00Z'
}

Describe 'The weekly digest' {
    It 'counts what is open, needs action, starts soon, is new and closed' {
        $Dg.Open | Should -Be 16; $Dg.ActionRequired | Should -Be 8; $Dg.Upcoming | Should -Be 5; $Dg.New | Should -Be 2; $Dg.Closed | Should -Be 4
    }
    It 'has its five sections' {
        foreach ($h in '## Open notices by provider', '## Action required', '## Maintenance and changes starting in the next 30 days', '## New in the last 7 days', '## Closed or no longer listed in the last 7 days') { $Md | Should -Match ([regex]::Escape($h)) }
    }
    It 'lists action required soonest first, with the owner the routing named' {
        $rows = @($Md -split "`n" | Where-Object { $_ -match '^\| \d{4}-\d{2}-\d{2} \|' })
        $rows[0] | Should -Match '^\| 2026-12-01 \| AWS \| retirement \| EC2: Instance retirement scheduled \| Cloud Platform Engineering \(example\)'
        ($rows | ForEach-Object { $_.Substring(2, 10) }) -join ',' | Should -Be (($rows | ForEach-Object { $_.Substring(2, 10) } | Sort-Object) -join ',')
    }
    It 'shows a provider''s notice that is no longer listed' { $Md | Should -Match 'Virtual Machines - East US - Connectivity issues, no longer listed by the provider' }
    It 'shows the rescheduled maintenance window, not the old one' {
        $Md | Should -Match '2026-11-29T04:00:00Z \| 2026-11-29T08:00:00Z \| Oracle Cloud Infrastructure'
        $Md | Should -Not -Match '2026-11-22T04:00:00Z'
    }
    It 'writes a CSV row per notice with its route and owner' {
        $csv = Import-Csv (Join-Path $TestDrive 'digest/digest.csv')
        $csv.Count | Should -Be 23
        @($csv | Where-Object noticeId -EQ 'azure:RT5J-6KL')[0].assignmentGroup | Should -Be 'Cloud Platform Engineering (example)'
        @($csv | Where-Object noticeId -EQ 'azure:RT5J-6KL')[0].firstSeen | Should -Be '2026-11-09T12:00:00Z'
    }
    It 'writes a manifest' { (Test-PnRunFolder -Path (Join-Path $TestDrive 'digest')).Ok | Should -BeTrue }
}

Describe 'Evidence records' {
    It 'maps a collection to each provider''s step and the normalizer' {
        $E1.Steps | Should -Be @('COL-AZURE', 'COL-M365', 'COL-OCI', 'COL-AWS', 'COL-GOOGLE', 'NORMALIZE', 'EVIDENCE')
        $E1.Controls | Should -Be @('AU-9', 'CA-7', 'SA-9', 'SI-5')
        $E1.Ksis | Should -Contain 'KSI-SCR-MON'
    }
    It 'adds the contingency step when a payload asks for a plan review' {
        $E2.Steps | Should -Contain 'CONTINGENCY'
        $E2.Controls | Should -Contain 'CP-2'
        $E2.Ksis | Should -Contain 'KSI-RPL-ARP'
    }
    It 'records time, change record, command, result, every file''s hash and the claim language' {
        $r = Read-PnJson $E1.Record
        $r.recordedAt | Should -Be '2026-11-16T12:00:00Z'
        $r.changeRecord | Should -Be 'LAB-0001'
        $r.result | Should -Be 'Pass'
        @($r.files | Where-Object { $_.path -like '*/notices.json' })[0].sha256 | Should -Be (Get-PnFileHash -Path (Join-Path $TestDrive 'day2/notices.json'))
        $r.claim | Should -Match '^Supports'
        $r.claim | Should -Not -Match '\b(satisfies|meets)\b'
        ($r.controls | Where-Object { $_.id -eq 'SI-5' }).title | Should -Be 'Security Alerts, Advisories, and Directives'
    }
    It 'chains each record to the one before' {
        (Read-PnJson $E1.Record).previousRecordSha256 | Should -BeNullOrEmpty
        (Read-PnJson $E2.Record).previousRecordSha256 | Should -Be (Get-PnFileHash -Path $E1.Record)
        (Read-PnJson $E3.Record).previousRecordSha256 | Should -Be (Get-PnFileHash -Path $E2.Record)
    }
    It 'writes records.csv and SHA256SUMS that check clean' {
        (Import-Csv (Join-Path $Ev 'records.csv')).Count | Should -Be 3
        @(Test-PnEvidence -EvidencePath $Ev | Where-Object Status -NE 'Pass') | Should -BeNullOrEmpty
    }
    It 'catches a file changed after it was recorded' {
        $copy = Join-Path $TestDrive 'ev-tampered'; Copy-Item -Recurse $Ev $copy
        Add-Content -Path (Join-Path $copy 'runs/0001-collect/notices.csv') -Value 'tampered'
        $rows = Test-PnEvidence -EvidencePath $copy
        ($rows | Where-Object Check -EQ 'SUMS').Status | Should -Be 'Fail'
        ($rows | Where-Object Check -EQ 'CHAIN').Status | Should -Be 'Fail'
    }
    It 'catches a record removed from the chain' {
        $copy = Join-Path $TestDrive 'ev-gap'; Copy-Item -Recurse $Ev $copy
        Remove-Item (Join-Path $copy 'records/0002-route.json')
        $null = Update-PnEvidenceSums -EvidencePath $copy
        ((Test-PnEvidence -EvidencePath $copy) | Where-Object Check -EQ 'CHAIN').Detail | Should -Match "doesn't follow"
    }
    It 'records a failed run as Fail when its files no longer match its manifest' {
        $run = Join-Path $TestDrive 'broken'; Copy-Item -Recurse (Join-Path $TestDrive 'digest') $run
        Add-Content -Path (Join-Path $run 'digest.md') -Value 'edited'
        (Write-PnEvidence -EvidencePath (Join-Path $TestDrive 'ev-broken') -RunPath $run -AsOf '2026-11-16T12:00:00Z').Result | Should -Be 'Fail'
    }
    It 'reports the steps a stage still lacks' {
        $rows = Test-PnEvidence -EvidencePath $Ev -Stage test
        ($rows | Where-Object Check -EQ 'STEP-ROUTE').Status | Should -Be 'Pass'
        ($rows | Where-Object Check -EQ 'STEP-PRE').Status | Should -Be 'Fail'
    }
}

Describe 'The requirements catalog' {
    BeforeAll { $script:Req = Get-PnRequirements }
    It 'gives every step a title, controls and KSIs, each defined in the catalog' {
        foreach ($k in $Req.steps.Keys) {
            $st = $Req.steps[$k]
            $st.title | Should -Not -BeNullOrEmpty
            @($st.controls).Count | Should -BeGreaterThan 0 -Because $k
            foreach ($c in $st.controls) { $Req.controls.Contains($c) | Should -BeTrue -Because "$k $c" }
            foreach ($x in $st.ksis) { $Req.ksis.Contains($x) | Should -BeTrue -Because "$k $x" }
        }
    }
    It 'maps SA-9, CM-3, CP-2 and SI-5 as the brief asks' {
        @($Req.steps.Values | ForEach-Object { $_.controls } | Sort-Object -Unique) | Should -Contain 'SA-9'
        foreach ($c in 'CM-3', 'CP-2', 'SI-5') { @($Req.steps.Values | ForEach-Object { $_.controls }) | Should -Contain $c }
    }
    It 'uses only KSI IDs of the form FedRAMP publishes' { foreach ($x in $Req.ksis.Keys) { $x | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' } }
    It 'lists stages whose steps exist' { foreach ($st in 'test', 'production') { foreach ($x in $Req.stages[$st]) { $Req.steps.Contains($x) | Should -BeTrue } } }
}
