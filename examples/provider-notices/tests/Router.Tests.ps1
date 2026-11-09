#Requires -Version 7.1
# Pester 5: routing, the Ticket-to-Machine task payload, de-duplication across runs, and dry run.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/ProviderNotices/ProviderNotices.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Routing = Join-Path $Kit 'config/routing.json'
    $script:Settings = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    function script:Collect([string]$Day, [string]$AsOf) {
        $o = Join-Path $TestDrive $Day
        $null = Invoke-PnCollection -Settings $Settings -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit "tests/fixtures/$Day")) -OutputPath $o -AsOf $AsOf
        Join-Path $o 'notices.json'
    }
    $script:D1 = Collect day1 '2026-11-09T12:00:00Z'
    $script:D2 = Collect day2 '2026-11-16T12:00:00Z'
    $script:State = Join-Path $TestDrive 'state.json'
    $script:R1 = Invoke-PnRouting -NoticesPath $D1 -RoutingPath $Routing -StatePath $State -OutputPath (Join-Path $TestDrive 'r1') -AsOf '2026-11-09T12:00:00Z'
    $script:R1b = Invoke-PnRouting -NoticesPath $D1 -RoutingPath $Routing -StatePath $State -OutputPath (Join-Path $TestDrive 'r1b') -AsOf '2026-11-09T13:00:00Z'
    $script:R2 = Invoke-PnRouting -NoticesPath $D2 -RoutingPath $Routing -StatePath $State -OutputPath (Join-Path $TestDrive 'r2') -AsOf '2026-11-16T12:00:00Z'
    function script:Payload($r, $id) { @($r.Payloads | Where-Object { $_.origin.notice_id -eq $id })[0] }
}

Describe 'Day 1: every notice is new' {
    It 'routes 12 to a task, 9 to the digest and 1 to ignore' {
        $R1.Counts.new | Should -Be 22
        $R1.Counts.task | Should -Be 12; $R1.Counts.digest | Should -Be 9; $R1.Counts.ignore | Should -Be 1
        $R1.Counts.create | Should -Be 12
    }
    It 'takes the first matching rule' {
        (Payload $R1 'azure:SA7M-8NP').origin.rule_id | Should -Be 'R01'
        (Payload $R1 'azure:SA7M-8NP').severity | Should -Be 'P2'
        (Payload $R1 'azure:RT5J-6KL').origin.rule_id | Should -Be 'R02'
        (Payload $R1 'azure:PM3F-4GH').origin.rule_id | Should -Be 'R03'
        (Payload $R1 'azure:AB1C-2DE').origin.rule_id | Should -Be 'R04'
        (Payload $R1 'oci:chain-example-02').origin.rule_id | Should -Be 'R05'
    }
    It 'sends nothing to a task for digest-only and ignored notices' {
        Payload $R1 'm365:MC900002' | Should -BeNullOrEmpty
        Payload $R1 'm365:MC900004' | Should -BeNullOrEmpty
        @($R1.Rows | Where-Object { $_.noticeId -eq 'm365:MC900004' })[0].route | Should -Be 'ignore'
    }
    It 'flags retirements and maintenance for a contingency plan review (CP-2)' {
        (Payload $R1 'azure:RT5J-6KL').contingency_review | Should -BeTrue
        (Payload $R1 'azure:RT5J-6KL').controls | Should -Contain 'CP-2'
        (Payload $R1 'azure:RT5J-6KL').ksis | Should -Contain 'KSI-RPL-ARP'
        (Payload $R1 'azure:SA7M-8NP').contingency_review | Should -BeFalse
        (Payload $R1 'azure:SA7M-8NP').controls | Should -Not -Contain 'CP-2'
    }
    It 'writes one file per payload, tasks.json, routing.csv, the state and a manifest, as a dry run' {
        @(Get-ChildItem (Join-Path $TestDrive 'r1/tasks') -Filter *.json).Count | Should -Be 12
        (Read-PnJson (Join-Path $TestDrive 'r1/tasks.json')).dryRun | Should -BeTrue
        Test-Path (Join-Path $TestDrive 'r1/sent.json') | Should -BeFalse
        (Read-PnJson (Join-Path $TestDrive 'r1/manifest.json')).mode | Should -Be 'DryRun'
        (Test-PnRunFolder -Path (Join-Path $TestDrive 'r1')).Ok | Should -BeTrue
    }
}

Describe 'The payload' {
    BeforeAll { $script:p = Payload $R1 'azure:RT5J-6KL' }
    It 'is valid' { foreach ($x in $R1.Payloads + $R2.Payloads) { @(Test-PnTaskPayload -Payload $x) | Should -BeNullOrEmpty -Because $x.dedupe_key } }
    It 'carries the finding contract''s priority and response window for its severity' {
        $p.severity | Should -Be 'P3'; $p.priority | Should -Be '3'; $p.response_window_seconds | Should -Be 86400
        $p.response_due | Should -Be '2026-11-10T12:00:00Z'
    }
    It 'carries the provider''s action date separately from the response window' {
        $p.action_required | Should -BeTrue; $p.action_due | Should -Be '2027-09-30T00:00:00Z'
    }
    It 'de-duplicates on provider and provider ID' { $p.dedupe_key | Should -Be 'azure|RT5J-6KL' }
    It 'names the five clauses of the request chain, in the Human decision lane' {
        $p.ticket_to_machine.lane | Should -Be 'Human decision'
        foreach ($c in 'c1_origin', 'c2_approver_role', 'c3_action', 'c4_reread_check', 'c5_evidence_kept') { $p.ticket_to_machine[$c] | Should -Not -BeNullOrEmpty }
        $p.ticket_to_machine.c2_approver_role | Should -Be 'System owner'
    }
    It 'rejects a payload whose priority or window doesn''t match its severity' {
        $bad = [ordered]@{}; foreach ($k in $p.Keys) { $bad[$k] = $p[$k] }
        $bad.priority = '1'; (Test-PnTaskPayload -Payload $bad) | Should -Contain 'priority does not match severity'
        $bad.priority = '3'; $bad.response_window_seconds = 1; (Test-PnTaskPayload -Payload $bad) | Should -Contain 'response window does not match severity'
        $bad.severity = 'P9'; (Test-PnTaskPayload -Payload $bad) | Should -Contain 'severity must be P1, P2, P3 or P4'
    }
    It 'mirrors the Ticket-to-Machine finding contract''s priorities and windows' {
        $contract = Join-Path $Kit '../servicenow-sailpoint/clients/python/finding_contract.py'
        Test-Path $contract | Should -BeTrue -Because 'the kit zip carries servicenow-sailpoint/clients/python beside this kit'
        $py = Get-Content -Raw $contract
        $py | Should -Match 'PRIORITY = \{"P1": "1", "P2": "2", "P3": "3", "P4": "4"\}'
        $py | Should -Match 'WINDOW_SECONDS = \{"P1": 0, "P2": 3600, "P3": 86400, "P4": 259200\}'
        $m =InModuleScope ProviderNotices { @{ P = $script:Priority; W = $script:WindowSeconds } }
        ($m.P.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ',' | Should -Be 'P1=1,P2=2,P3=3,P4=4'
        ($m.W.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ',' | Should -Be 'P1=0,P2=3600,P3=86400,P4=259200'
    }
}

Describe 'De-duplication across runs' {
    It 'writes no payload when nothing changed' {
        $R1b.Counts.unchanged | Should -Be 22
        $R1b.Payloads.Count | Should -Be 0
    }
    It 'keeps each notice''s first-seen time' {
        $s = Read-PnJson $State
        $s.notices['azure:RT5J-6KL'].firstSeen | Should -Be '2026-11-09T12:00:00Z'
        $s.notices['m365:MC900005'].firstSeen | Should -Be '2026-11-16T12:00:00Z'
    }
    It 'on day 2: 2 new, 6 changed, 15 unchanged, 1 no longer listed' {
        $R2.Counts.new | Should -Be 2; $R2.Counts.changed | Should -Be 6; $R2.Counts.unchanged | Should -Be 15; $R2.Counts.absent | Should -Be 1
    }
    It 'updates the task of a notice the provider changed' {
        (Payload $R2 'azure:PM3F-4GH').action | Should -Be 'update'
        (Payload $R2 'oci:chain-example-01').action | Should -Be 'update'
        (Payload $R2 'm365:MC900003').action | Should -Be 'update'
    }
    It 'creates a task for a new notice that needs one' { (Payload $R2 'm365:MC900005').action | Should -Be 'create' }
    It 'asks for the re-read check before closing a task whose notice the provider closed' {
        $c = @($R2.Payloads | Where-Object { $_.action -eq 'close' })
        $c.Count | Should -Be 1
        $c[0].origin.notice_id | Should -BeLike 'aws:*AWS_IAM_SECURITY_NOTIFICATION_EXAMPLE04'
        $c[0].description | Should -Match 're-read check \(C4\)'
    }
    It 'updates the task of an open notice the provider no longer lists, and marks it absent' {
        (Payload $R2 'azure:AB1C-2DE').action | Should -Be 'update'
        (Payload $R2 'azure:AB1C-2DE').description | Should -Match 'No longer listed by the provider'
        (Read-PnJson $State).notices['azure:AB1C-2DE'].status | Should -Be 'absent'
    }
    It 'writes no task for a digest-only notice that closed' { Payload $R2 'm365:EX900101' | Should -BeNullOrEmpty }
    It 'doesn''t mark a provider''s notices absent when that provider wasn''t read' {
        $st = Join-Path $TestDrive 'state-oci.json'; Copy-Item $State $st
        $onlyOci = Join-Path $TestDrive 'oci-only'
        $null = Invoke-PnCollection -Settings $Settings -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/day2')) -OutputPath $onlyOci -AsOf '2026-11-16T12:00:00Z' -Provider oci
        $r = Invoke-PnRouting -NoticesPath (Join-Path $onlyOci 'notices.json') -RoutingPath $Routing -StatePath $st -OutputPath (Join-Path $TestDrive 'r-oci') -AsOf '2026-11-16T13:00:00Z'
        $r.Counts.absent | Should -Be 0
    }
}

Describe 'Sending' {
    It 'needs a sender' { { Invoke-PnRouting -NoticesPath $D1 -RoutingPath $Routing -StatePath (Join-Path $TestDrive 'sx.json') -OutputPath (Join-Path $TestDrive 'sx') -AsOf '2026-11-09T12:00:00Z' -Send } | Should -Throw '*-Sender*' }
    It 'hands each payload to the sender once, records it, and marks the state' {
        $got = [Collections.Generic.List[string]]::new()
        $st = Join-Path $TestDrive 'send-state.json'
        $r = Invoke-PnRouting -NoticesPath $D1 -RoutingPath $Routing -StatePath $st -OutputPath (Join-Path $TestDrive 'send') -AsOf '2026-11-09T12:00:00Z' -Send -Sender { param($p) $got.Add($p.dedupe_key); 'sys_id-example' }
        $got.Count | Should -Be 12
        $r.DryRun | Should -BeFalse
        (Read-PnJson (Join-Path $TestDrive 'send/sent.json')).Count | Should -Be 12
        (Read-PnJson $st).notices['azure:RT5J-6KL'].taskSent | Should -BeTrue
        (Read-PnJson (Join-Path $TestDrive 'send/manifest.json')).mode | Should -Be 'Send'
    }
}

Describe 'The routing file' {
    It 'checks that <Case>' -ForEach @(
        @{ Case = 'a task rule names a severity'; Json = '{"defaults":{"route":"digest"},"rules":[{"id":"X","match":{},"route":"task","assignmentGroup":"G"}]}'; Err = '*severity*' }
        @{ Case = 'a task rule names an assignment group'; Json = '{"defaults":{"route":"digest"},"rules":[{"id":"X","match":{},"route":"task","severity":"P2"}]}'; Err = '*assignment group*' }
        @{ Case = 'the route is known'; Json = '{"defaults":{"route":"email"},"rules":[]}'; Err = '*isn''t task, digest or ignore*' }
        @{ Case = 'match keys are known'; Json = '{"defaults":{"route":"digest"},"rules":[{"id":"X","match":{"colour":"red"},"route":"digest"}]}'; Err = '*unknown match key*' }
        @{ Case = 'no placeholder is left'; Json = '{"defaults":{"route":"digest"},"rules":[{"id":"X","match":{},"route":"task","severity":"P2","assignmentGroup":"<assignment-group>"}]}'; Err = '*placeholder*' }
    ) {
        $p = Join-Path $TestDrive 'routing-bad.json'; Set-Content -Path $p -Value $Json
        { Read-PnRouting -Path $p } | Should -Throw $Err
    }
    It 'takes the defaults when no rule matches' {
        $n = @{ provider = 'google'; kind = 'incident'; status = 'open'; actionRequired = $false; resources = @(); services = @('Cloud SQL'); regions = @() }
        (Resolve-PnRoute -Notice $n -Routing (Read-PnRouting -Path $Routing)).id | Should -Be 'default'
    }
    It 'matches services and regions by pattern' {
        $rt = @{ defaults = @{ route = 'digest' }; rules = @(@{ id = 'G'; match = @{ regionPattern = '^us-gov' }; route = 'ignore' }) }
        (Resolve-PnRoute -Notice @{ regions = @('us-gov-west-1'); services = @() } -Routing $rt).id | Should -Be 'G'
        (Resolve-PnRoute -Notice @{ regions = @('us-east-1'); services = @() } -Routing $rt).id | Should -Be 'default'
    }
    It 'accepts the routing template once its placeholders are filled' {
        $t = Get-Content -Raw (Join-Path $Kit 'templates/routing.template.json')
        { $p = Join-Path $TestDrive 't1.json'; Set-Content $p $t; Read-PnRouting -Path $p } | Should -Throw '*placeholder*'
        $filled = $t -replace '"<[a-z][^>"]*>"', '"Example team"'
        $p = Join-Path $TestDrive 't2.json'; Set-Content $p $filled
        (Read-PnRouting -Path $p).rules.Count | Should -BeGreaterThan 3
    }
}
