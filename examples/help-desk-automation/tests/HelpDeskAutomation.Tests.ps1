#Requires -Version 7.1
# The help desk automation pack on its fictional tenant: the typed change plans, refuses and applies
# only with the approved hash; the consent review flags old and broad requests; every Graph call is declared.
BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/HelpDeskAutomation/HelpDeskAutomation.psm1') -Force
    $script:Fx = Join-Path $script:Kit 'tests/fixtures'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("hda-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force $script:Tmp | Out-Null
    function Copy-Fixtures { $d = Join-Path $script:Tmp ([guid]::NewGuid()); Copy-Item $script:Fx $d -Recurse; $d }
    $script:AsOf = [datetime]'2026-11-27T12:00:00Z'
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'Typed change: planning' {
    It 'plans a valid change with the value before and after, and its SHA-256' {
        $out = Join-Path $script:Tmp 'plan1'
        $r = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath $out -FixturePath $script:Fx -AsOf $script:AsOf
        $r.Ready | Should -BeTrue
        $plan = Get-Content $r.PlanPath -Raw | ConvertFrom-Json
        $plan.before | Should -Be ''
        $plan.after | Should -Be 'RetainAll'
        $plan.extension | Should -Be 'extensionAttribute10'
        $r.PlanSha256 | Should -Be (Get-HtSha256 $r.PlanPath)
        $plan.controls | Should -Contain 'CM-3'
    }
    It '<Rule>: <Why>' -TestCases @(
        @{ Rule = 'HT-01'; Why = 'a change that is not in the list'; User = 'avery.lane@contoso.example'; Change = 'set-mail'; Value = 'x' }
        @{ Rule = 'HT-02'; Why = 'a user synchronized from on-premises'; User = 'blake.ortiz@contoso.example'; Change = 'set-department'; Value = 'Audit' }
        @{ Rule = 'HT-03'; Why = 'a value the change does not accept'; User = 'avery.lane@contoso.example'; Change = 'set-employee-type'; Value = 'Vendor' }
        @{ Rule = 'HT-04'; Why = 'a disabled user'; User = 'casey.diaz@contoso.example'; Change = 'set-department'; Value = 'Audit' }
        @{ Rule = 'HT-04'; Why = 'a user who does not exist'; User = 'nobody@contoso.example'; Change = 'set-department'; Value = 'Audit' }
        @{ Rule = 'HT-05'; Why = 'nothing to change'; User = 'devon.park@contoso.example'; Change = 'set-records-flag'; Value = 'RetainAll' }
    ) {
        $out = Join-Path $script:Tmp ([guid]::NewGuid())
        $r = New-HtTypedChangePlan -RequestId REQ-2026-0502 -User $User -ChangeId $Change -Value $Value -OutputPath $out -FixturePath $script:Fx -WarningAction SilentlyContinue
        $r.Ready | Should -BeFalse
        (Get-Content (Join-Path $out 'REQ-2026-0502/findings.json') -Raw | ConvertFrom-Json).Rule | Should -Contain $Rule
        Join-Path $out 'REQ-2026-0502/plan.json' | Should -Not -Exist
    }
    It 'HT-06: a request id that is not a ticket number' {
        $out = Join-Path $script:Tmp ([guid]::NewGuid())
        $r = New-HtTypedChangePlan -RequestId 'please run this' -User avery.lane@contoso.example -ChangeId set-department -Value Audit -OutputPath $out -FixturePath $script:Fx -WarningAction SilentlyContinue
        $r.Ready | Should -BeFalse
    }
}

Describe 'Typed change: applying' {
    BeforeEach {
        $script:Store = Copy-Fixtures
        $script:Plan = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-department -Value 'Records' -OutputPath (Join-Path $script:Tmp ([guid]::NewGuid())) -FixturePath $script:Store -AsOf $script:AsOf
    }
    It 'a dry run changes nothing and records the dry run' {
        $r = Invoke-HtTypedChange -PlanPath $script:Plan.PlanPath -ApprovedPlanSha256 $script:Plan.PlanSha256 -OutputPath (Join-Path $script:Tmp 'dry') -FixturePath $script:Store
        $r.Mode | Should -Be 'dry-run'
        $r.After | Should -Be 'Field Operations'
        $r.Verified | Should -BeFalse
    }
    It 'refuses a hash that is not the approved one (HT-08)' {
        { Invoke-HtTypedChange -PlanPath $script:Plan.PlanPath -ApprovedPlanSha256 ('0' * 64) -OutputPath (Join-Path $script:Tmp 'bad') -FixturePath $script:Store -Apply } | Should -Throw '*HT-08*'
    }
    It 'refuses an edited plan (HT-08)' {
        (Get-Content $script:Plan.PlanPath -Raw) -replace 'Records', 'Finance' | Set-Content $script:Plan.PlanPath -NoNewline
        { Invoke-HtTypedChange -PlanPath $script:Plan.PlanPath -ApprovedPlanSha256 $script:Plan.PlanSha256 -OutputPath (Join-Path $script:Tmp 'edit') -FixturePath $script:Store -Apply } | Should -Throw '*HT-08*'
    }
    It 'with -Apply sends the change, re-reads the user and records before and after' {
        $store = New-HtFixtureStore -Path $script:Store
        Mock -ModuleName HelpDeskAutomation New-HtFixtureStore { $store }
        $r = Invoke-HtTypedChange -PlanPath $script:Plan.PlanPath -ApprovedPlanSha256 $script:Plan.PlanSha256 -OutputPath (Join-Path $script:Tmp 'apply') -FixturePath $script:Store -Apply
        $r.Mode | Should -Be 'apply'
        $r.Before | Should -Be 'Field Operations'
        $r.After | Should -Be 'Records'
        $r.Verified | Should -BeTrue
        $ev = Get-Content (Join-Path $script:Tmp 'apply/REQ-2026-0501/evidence.json') -Raw | ConvertFrom-Json
        $ev.planSha256 | Should -Be $script:Plan.PlanSha256
        $ev.ksis | Should -Contain 'KSI-IAM-JIT'
    }
    It 'refuses when the value changed since the plan (HT-07)' {
        $store = New-HtFixtureStore -Path $script:Store
        $store.Users['a1000000-0000-4000-8000-000000000101'].department = 'Someone else changed it'
        Mock -ModuleName HelpDeskAutomation New-HtFixtureStore { $store }
        { Invoke-HtTypedChange -PlanPath $script:Plan.PlanPath -ApprovedPlanSha256 $script:Plan.PlanSha256 -OutputPath (Join-Path $script:Tmp 'stale') -FixturePath $script:Store -Apply } | Should -Throw '*HT-07*'
    }
}

Describe 'Pending admin consent requests' {
    BeforeAll {
        $script:Out = Join-Path $script:Tmp 'consent'
        $script:R = Get-HtPendingConsentRequest -OutputPath $script:Out -FixturePath $script:Fx -AsOf $script:AsOf
        $script:Findings = @(Get-Content (Join-Path $script:Out 'findings.json') -Raw | ConvertFrom-Json)
    }
    It 'lists only applications with a request still in progress' {
        $script:R.Pending | Should -Be 2
        (Get-Content (Join-Path $script:Out 'register.json') -Raw | ConvertFrom-Json).Application | Should -Not -Contain 'Northwind Survey (fictional)'
    }
    It 'HT-CR-01: a request waiting longer than the limit' {
        ($script:Findings | Where-Object Rule -eq 'HT-CR-01').AppId | Should -Be 'f3000000-0000-4000-8000-000000000302'
    }
    It 'HT-CR-02: broad permissions go to the identity governance approver' {
        ($script:Findings | Where-Object Rule -eq 'HT-CR-02').Issue | Should -Match 'Files.ReadWrite.All'
        $script:R.Warnings | Should -Be 1
    }
    It 'counts requesters and the oldest request' {
        $row = (Get-Content (Join-Path $script:Out 'register.json') -Raw | ConvertFrom-Json) | Where-Object AppId -eq 'f3000000-0000-4000-8000-000000000302'
        $row.Requesters | Should -Be 2
        $row.AgeDays | Should -Be 15
    }
    It 'writes a manifest with each file''s SHA-256, the controls and the KSIs' {
        $m = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json
        $m.files.path | Should -Be @('register.json', 'register.csv', 'findings.json')
        $m.ksis | Should -Contain 'KSI-IAM-ELP'
    }
}

Describe 'Declared calls only' {
    It 'every Graph call the module makes is declared for its task' {
        $calls = (Get-HtConfig calls).calls.id
        $src = Get-Content (Join-Path $script:Kit 'powershell/HelpDeskAutomation/HelpDeskAutomation.psm1') -Raw
        $used = [regex]::Matches($src, "-CallId ([a-z-]+)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        foreach ($u in $used) { $calls | Should -Contain $u }
    }
    It 'an undeclared call is refused before anything is sent' {
        InModuleScope HelpDeskAutomation { { Invoke-HtGraph -Task consent-requests -CallId user-update -Method PATCH -Uri '/users/x' -Body @{} } | Should -Throw '*declared*' }
    }
    It 'the read tasks hold no write permission' {
        foreach ($t in 'typed-change-plan', 'consent-requests') { (Get-HtRequiredPermission -Task $t).GraphPermissions | Should -Not -Match 'Write|Update' }
    }
}
