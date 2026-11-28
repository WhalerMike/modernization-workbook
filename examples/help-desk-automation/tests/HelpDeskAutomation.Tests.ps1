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
        Get-Content $r.PlanPath -Raw | Should -Match '"plannedUtc": "2026-11-27T12:00:00Z"'
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
    It 'writes a relative output path under the PowerShell location, not the process directory' {
        $here = Join-Path $script:Tmp ([guid]::NewGuid())
        New-Item -ItemType Directory -Force $here | Out-Null
        Push-Location $here
        try {
            $r = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath $script:Fx -AsOf $script:AsOf
        } finally { Pop-Location }
        Join-Path $here 'out/plan/REQ-2026-0501/plan.json' | Should -Exist
        $r.PlanSha256 | Should -Be (Get-HtSha256 (Join-Path $here 'out/plan/REQ-2026-0501/plan.json'))
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

Describe 'Morning synchronization check' {
    BeforeAll {
        $script:SyncOut = Join-Path $script:Tmp 'sync'
        $script:Sync = Invoke-HtSyncCheck -OutputPath $script:SyncOut -FixturePath $script:Fx -PreviousPath (Join-Path $script:Fx 'previous-sync') -AsOf $script:AsOf
        $script:SyncFindings = @(Get-Content (Join-Path $script:SyncOut 'findings.json') -Raw | ConvertFrom-Json)
    }
    It 'a synchronization 18 minutes ago is on time' {
        $script:Sync.LastSyncAgeMinutes | Should -Be 18
        $script:SyncFindings.Rule | Should -Not -Contain 'HT-SY-01'
    }
    It 'HT-SY-02: each user with a provisioning error, by object id' {
        @($script:SyncFindings | Where-Object Rule -eq 'HT-SY-02').Object | Should -Be @('a1000000-0000-4000-8000-000000000105', 'a1000000-0000-4000-8000-000000000106')
    }
    It 'HT-SY-03: a service that is not operational' {
        ($script:SyncFindings | Where-Object Rule -eq 'HT-SY-03').Object | Should -Be 'Exchange Online'
    }
    It 'computes what changed since the last run, instead of bold text' {
        $script:Sync.Changed | Should -Be 3
        $r = Get-Content (Join-Path $script:SyncOut 'report.md') -Raw
        $r | Should -Match 'Provisioning errors: 1 -> 2'
        $r | Should -Match 'New error objects: a1000000-0000-4000-8000-000000000105'
        $r | Should -Match 'Exchange Online: serviceOperational -> serviceDegradation'
    }
    It 'HT-SY-01: no synchronization for longer than the limit' {
        $late = Join-Path $script:Tmp 'late'; Copy-Item $script:Fx $late -Recurse
        '{ "id": "c0ffee00-0000-4000-8000-000000000001", "onPremisesSyncEnabled": true, "onPremisesLastSyncDateTime": "2026-11-27T08:00:00Z" }' | Set-Content (Join-Path $late 'organization.json')
        $r = Invoke-HtSyncCheck -OutputPath (Join-Path $script:Tmp 'late-out') -FixturePath $late -AsOf $script:AsOf
        (Get-Content (Join-Path $script:Tmp 'late-out/findings.json') -Raw | ConvertFrom-Json).Rule | Should -Contain 'HT-SY-01'
    }
    It 'writes a manifest with the controls and KSIs' {
        $m = Get-Content (Join-Path $script:SyncOut 'manifest.json') -Raw | ConvertFrom-Json
        $m.controls | Should -Contain 'CP-9'
        $m.files.path | Should -Be @('findings.json', 'report.md', 'status.json')
    }
}

Describe 'Custom role review' {
    BeforeAll {
        $script:RoleOut = Join-Path $script:Tmp 'roles'
        $script:Roles = Invoke-HtRoleReview -OutputPath $script:RoleOut -FixturePath $script:Fx -AsOf $script:AsOf
        $script:RoleFindings = @(Get-Content (Join-Path $script:RoleOut 'findings.json') -Raw | ConvertFrom-Json)
    }
    It 'reads custom directory and Intune roles, not built-in ones' { $script:Roles.CustomRoles | Should -Be 3 }
    It 'HT-RR-01: a custom role that is not in the register' {
        ($script:RoleFindings | Where-Object Rule -eq 'HT-RR-01').Object | Should -Be 'd4000000-0000-4000-8000-000000000402'
    }
    It 'HT-RR-02: permissions added since the register (a device wipe)' {
        ($script:RoleFindings | Where-Object Rule -eq 'HT-RR-02').Issue | Should -Match 'Wipe'
    }
    It 'HT-RR-03: a review older than the cycle' {
        ($script:RoleFindings | Where-Object Rule -eq 'HT-RR-03').Object | Should -Be 'd4000000-0000-4000-8000-000000000401'
    }
    It 'HT-RR-04: a person holding a custom role directly is a warning' {
        $script:Roles.Warnings | Should -Be 1
    }
}

Describe 'Event-log forwarding check' {
    BeforeAll {
        $script:LogOut = Join-Path $script:Tmp 'logs'
        $script:Logs = Invoke-Command { Test-HtLogForwarding -OutputPath $script:LogOut -FixturePath $script:Fx -AsOf $script:AsOf }
        $script:LogFindings = @(Get-Content (Join-Path $script:LogOut 'findings.json') -Raw | ConvertFrom-Json)
    }
    It 'a server associated with the rule and heard from recently has no finding' { $script:LogFindings.Object | Should -Not -Contain 'SYNC01' }
    It 'HT-LF-02 and HT-LF-03: a server not associated, and silent for 16 hours' {
        @($script:LogFindings | Where-Object Object -eq 'SYNC02').Rule | Should -Be @('HT-LF-02', 'HT-LF-03')
    }
}

Describe 'The platform host jobs' {
    BeforeAll {
        $script:Run = Join-Path $script:Kit 'deploy/Invoke-HtScheduledRun.ps1'
        $script:Settings = Join-Path $script:Tmp 'settings.json'
        $s = Get-Content (Join-Path $script:Fx 'settings.fixture.json') -Raw | ConvertFrom-Json -AsHashtable
        $s.runsPath = Join-Path $script:Tmp 'runs'
        $s | ConvertTo-Json | Set-Content $script:Settings
    }
    It '<Job> runs into a dated folder and exits 2 on findings' -TestCases @(@{ Job = 'sync' }, @{ Job = 'consent' }, @{ Job = 'roles' }, @{ Job = 'logs' }) {
        & pwsh -NoProfile -File $script:Run -Job $Job -SettingsPath $script:Settings -FixturePath $script:Fx -AsOf '2026-11-27T12:00:00Z' | Out-Null
        $LASTEXITCODE | Should -Be 2
        Join-Path $script:Tmp "runs/$Job/2026-11-27T120000Z/manifest.json" | Should -Exist
    }
    It 'refuses a settings file with a secret-like key' {
        $bad = Join-Path $script:Tmp 'bad.json'
        '{ "clientSecret": "x", "runsPath": "out" }' | Set-Content $bad
        & pwsh -NoProfile -File $script:Run -Job sync -SettingsPath $bad -FixturePath $script:Fx 2>&1 | Out-Null
        $LASTEXITCODE | Should -Not -Be 0
    }
    It 'names the settings still to fill in, and not the template''s comment' {
        $msg = try { & $script:Run -Job sync -SettingsPath (Join-Path $script:Kit 'deploy/settings.template.json') } catch { $_.Exception.Message }
        $msg | Should -Match 'Fill in the settings first: clientId, runAs, subscriptionId, tenantId.'
        $msg | Should -Not -Match '_comment'
    }
    It 'registering is a dry run by default, under the gMSA' {
        $r = & (Join-Path $script:Kit 'deploy/Register-HtScheduledJobs.ps1') -SettingsPath $script:Settings
        $r.Count | Should -Be 4
        $r.Registered | Should -Not -Contain $true
        $r.RunAs | Sort-Object -Unique | Should -Be 'CONTOSO\gmsa-fmpassess$'
    }
    It 'refuses a run-as account that is not a gMSA' {
        $s = Get-Content $script:Settings -Raw | ConvertFrom-Json -AsHashtable; $s.runAs = 'CONTOSO\svc-helpdesk'
        $p = Join-Path $script:Tmp 'notgmsa.json'; $s | ConvertTo-Json | Set-Content $p
        { & (Join-Path $script:Kit 'deploy/Register-HtScheduledJobs.ps1') -SettingsPath $p } | Should -Throw '*gMSA*'
    }
    It 'the log forwarding template is one rule for Windows events and an association per Arc machine' {
        $t = Get-Content (Join-Path $script:Kit 'deploy/eventlog-dcr.json') -Raw | ConvertFrom-Json
        $dcr = $t.resources | Where-Object type -eq 'Microsoft.Insights/dataCollectionRules'
        $dcr.properties.dataSources.windowsEventLogs[0].streams | Should -Be 'Microsoft-Event'
        $t.parameters.xPathQueries.defaultValue | ForEach-Object { $_ | Should -Match '^(Security|System|Application)!\*\[' }
        ($t.resources | Where-Object type -eq 'Microsoft.Insights/dataCollectionRuleAssociations').scope | Should -Match 'Microsoft.HybridCompute/machines'
    }
}

Describe 'The approved-request pipeline (WD-182)' {
    BeforeAll {
        $script:QStore = New-HtFixtureStore -Path $script:Fx
        Mock -ModuleName HelpDeskAutomation New-HtFixtureStore { $script:QStore }
        $script:QOut = Join-Path $script:Tmp 'queue'
        $script:Q = @(Invoke-HtRequestQueue -OutputPath $script:QOut -FixturePath $script:Fx -Apply -AsOf $script:AsOf)
        function Get-Q($n) { $script:Q | Where-Object Number -eq $n }
    }
    It 'works only items marked ready with an access request id' {
        $script:Q.Number | Should -Not -Contain 'RITM0010010'
        $script:Q.Count | Should -Be 10
    }
    It 'an approval still pending in SailPoint leaves the item in the queue, untouched' {
        (Get-Q 'RITM0010011').State | Should -Be 'waiting'
        $script:QStore.Updates.uri | Should -Not -Match ('{0:x32}' -f 11)
    }
    It 'a typed change approved in SailPoint is planned, applied and verified' {
        (Get-Q 'RITM0010001').State | Should -Be 'done'
        $ev = Get-Content (Join-Path $script:QOut 'RITM0010001/evidence.json') -Raw | ConvertFrom-Json
        $ev.result.after | Should -Be 'Records'
        $ev.result.verified | Should -BeTrue
    }
    It 'a password reset forces a change at next sign-in and issues the secret only to the restricted field' {
        $r = Get-Q 'RITM0010002'
        $r.State | Should -Be 'done'; $r.SecretIssued | Should -BeTrue
        ($script:QStore.Actions | Where-Object call -eq 'user-password-reset').forceChange | Should -BeTrue
        $upd = $script:QStore.Updates | Where-Object { $_.uri -like '*/sc_req_item/*' -and $_.body.u_one_time_secret }
        @($upd).Count | Should -BeGreaterOrEqual 1
        Get-Content (Join-Path $script:QOut 'RITM0010002/evidence.json') -Raw | Should -Not -Match ([regex]::Escape(@($upd)[0].body.u_one_time_secret))
    }
    It 'HT-RQ-04: a user holding a directory role goes to a person' {
        (Get-Q 'RITM0010003').State | Should -Be 'manual'
        (Get-Q 'RITM0010003').Reason | Should -Match 'HT-RQ-04'
    }
    It 'an authenticator reset removes the app and phone methods, keeps the password, and issues a single-use pass' {
        (Get-Q 'RITM0010004').State | Should -Be 'done'
        @($script:QStore.Actions | Where-Object call -in 'authenticator-method-delete', 'phone-method-delete').Count | Should -Be 2
        $tap = $script:QStore.Actions | Where-Object call -eq 'tap-create'
        $tap.body.isUsableOnce | Should -BeTrue
        $tap.body.lifetimeInMinutes | Should -Be 60
    }
    It 'HT-RQ-01: a reset with no identity verification is refused' { (Get-Q 'RITM0010005').Reason | Should -Match 'HT-RQ-01' }
    It 'a cloud account is created from its profile, with its groups' {
        (Get-Q 'RITM0010006').State | Should -Be 'done'
        ($script:QStore.Actions | Where-Object call -eq 'user-create').body.usageLocation | Should -Be 'US'
        ($script:QStore.Actions | Where-Object call -eq 'group-member-add').uri | Should -Match '9a000000-0000-4000-8000-000000000901'
    }
    It 'HT-RQ-02: a request SailPoint rejected is not run' { (Get-Q 'RITM0010007').Reason | Should -Match 'HT-RQ-02.*REJECTED' }
    It 'HT-RQ-03: a request its own requester approved is not run' { (Get-Q 'RITM0010008').Reason | Should -Match 'HT-RQ-03' }
    It 'HT-RQ-05: an item that carries a command goes to a person' { (Get-Q 'RITM0010009').State | Should -Be 'manual' }
    It 'every item gets its state, work notes and evidence attached' {
        @($script:QStore.Updates | Where-Object { $_.uri -like '*/sc_req_item/*' }).Count | Should -Be 9
        @($script:QStore.Updates | Where-Object { $_.attachment }).Count | Should -Be 9
    }
    It 'the evidence keeps its KSIs as a list, even when the task has one' {
        Get-Content (Join-Path $script:QOut 'RITM0010002/evidence.json') -Raw | Should -Match '"ksis": \[\s*"KSI-IAM-JIT"\s*\]'
    }
    It 'a dry run changes nothing and writes nothing back' {
        $store = New-HtFixtureStore -Path $script:Fx
        Mock -ModuleName HelpDeskAutomation New-HtFixtureStore { $store }
        $d = @(Invoke-HtRequestQueue -OutputPath (Join-Path $script:Tmp 'dry-queue') -FixturePath $script:Fx -AsOf $script:AsOf)
        ($d | Where-Object Number -eq 'RITM0010002').State | Should -Be 'dry-run'
        $store.Actions.Count | Should -Be 0
        $store.Updates.Count | Should -Be 0
    }
    It 'the request worker''s calls are declared, and its reads hold no write permission' {
        (Get-HtRequiredPermission -Task request-queue).GraphPermissions | Should -Not -Match 'Write|Update|Create'
    }
}

Describe 'The request pipeline on the platform host' {
    BeforeAll {
        $script:RSettings = Join-Path $script:Tmp 'rsettings.json'
        $s = Get-Content (Join-Path $script:Fx 'requests-settings.fixture.json') -Raw | ConvertFrom-Json -AsHashtable
        $s.runsPath = Join-Path $script:Tmp 'request-runs'
        $s | ConvertTo-Json | Set-Content $script:RSettings
    }
    It 'a dry run works the queue into a dated folder and exits 2 when an item failed' {
        & pwsh -NoProfile -File (Join-Path $script:Kit 'deploy/Invoke-HtRequestPipeline.ps1') -SettingsPath $script:RSettings -FixturePath $script:Fx -DryRun -AsOf '2026-11-27T12:00:00Z' *>&1 | Out-Null
        $LASTEXITCODE | Should -Be 2
        Join-Path $script:Tmp 'request-runs/2026-11-27T120000Z/queue.json' | Should -Exist
    }
    It 'names the settings still to fill in before it signs in to anything' {
        $msg = try { & (Join-Path $script:Kit 'deploy/Invoke-HtRequestPipeline.ps1') -SettingsPath (Join-Path $script:Kit 'deploy/requests-settings.template.json') -DryRun } catch { $_.Exception.Message }
        $msg | Should -Be 'Fill in the settings first: clientId, credentialAdmins, iscApiUrl, iscClientId, runAs, serviceNowClientId, serviceNowUrl, tenantId.'
    }
    It 'registering is a dry run by default, under the pipeline''s own gMSA' {
        $r = & (Join-Path $script:Kit 'deploy/Register-HtRequestPipeline.ps1') -SettingsPath $script:RSettings
        $r.Registered | Should -BeFalse
        $r.RunAs | Should -Be 'CONTOSO\gmsa-fmphelpdesk$'
    }
    It 'refuses to run the pipeline as the assessment gMSA' {
        $s = Get-Content $script:RSettings -Raw | ConvertFrom-Json -AsHashtable; $s.runAs = 'CONTOSO\gmsa-fmpassess$'
        $p = Join-Path $script:Tmp 'assess.json'; $s | ConvertTo-Json | Set-Content $p
        { & (Join-Path $script:Kit 'deploy/Register-HtRequestPipeline.ps1') -SettingsPath $p } | Should -Throw '*never runs as the assessment gMSA*'
    }
    It 'the ServiceNow and SailPoint templates parse, and the access profiles use SailPoint''s approval scheme shape' {
        $ap = Get-Content (Join-Path $script:Kit 'sailpoint/access-profiles.json') -Raw | ConvertFrom-Json
        $ap.accessProfiles.Count | Should -Be 4
        $ap.accessProfiles.accessRequestConfig.approvalSchemes.approverType | ForEach-Object { $_ | Should -BeIn 'APP_OWNER', 'OWNER', 'SOURCE_OWNER', 'MANAGER', 'GOVERNANCE_GROUP', 'WORKFLOW' }
        $ci = Get-Content (Join-Path $script:Kit 'servicenow/catalog-items.json') -Raw | ConvertFrom-Json
        $items = (Get-HtConfig request-items).items.Keys
        $ci.items.name | Sort-Object | Should -Be ($items | Sort-Object)
        $ci.items.variables.name | Should -Not -Contain 'command'
    }
}

Describe 'The pipeline''s sign-in and secrets (WD-184)' {
    BeforeAll {
        $script:SignIn = @{ serviceNowUrl = 'https://sn.example.test'; serviceNowClientId = 'sn-client'; serviceNowSecretFile = 'creds/servicenow.secret'
            iscApiUrl = 'https://isc.example.test'; iscClientId = 'isc-client'; iscSecretFile = 'creds/sailpoint.secret'; iscCredential = 'api-client'; credentialAdmins = 'CONTOSO\Tier0-Admins' }
        function New-Forbidden { [Microsoft.PowerShell.Commands.HttpResponseException]::new('Forbidden', [Net.Http.HttpResponseMessage]::new([Net.HttpStatusCode]::Forbidden)) }
    }
    BeforeEach {
        Mock -ModuleName HelpDeskAutomation Read-HtSecretFile { if ($Path -like '*servicenow*') { 'sn-secret-from-file' } else { 'isc-secret-from-file' } }
        Mock -ModuleName HelpDeskAutomation Invoke-RestMethod { @{ access_token = 'token' } } -ParameterFilter { $Uri -like '*/oauth*' }
        Mock -ModuleName HelpDeskAutomation Invoke-RestMethod { @() } -ParameterFilter { $Uri -like '*/v3/access-request-status*' }
    }
    It 'only the run-as account, SYSTEM, Administrators and the credential administrators may read a secret file' {
        $rules = @(
            [pscustomobject]@{ Identity = 'CONTOSO\gmsa-fmphelpdesk$'; Rights = 'Read, Synchronize'; Type = 'Allow' }
            [pscustomobject]@{ Identity = 'NT AUTHORITY\SYSTEM'; Rights = 'FullControl'; Type = 'Allow' }
            [pscustomobject]@{ Identity = 'contoso\tier0-admins'; Rights = 'FullControl'; Type = 'Allow' }
            [pscustomobject]@{ Identity = 'BUILTIN\Users'; Rights = 'ReadAndExecute, Synchronize'; Type = 'Allow' }
            [pscustomobject]@{ Identity = 'CONTOSO\gmsa-fmpgitea$'; Rights = 'Read'; Type = 'Allow' }
            [pscustomobject]@{ Identity = 'Everyone'; Rights = 'Read'; Type = 'Deny' }
        )
        Test-HtSecretFileAccess -Rules $rules -Allowed 'CONTOSO\gmsa-fmphelpdesk$', 'CONTOSO\Tier0-Admins' | Should -Be @('BUILTIN\Users', 'CONTOSO\gmsa-fmpgitea$')
        Test-HtSecretFileAccess -Rules $rules[0..2] -Allowed 'CONTOSO\gmsa-fmphelpdesk$', 'CONTOSO\Tier0-Admins' | Should -BeNullOrEmpty
    }
    It 'signs in to ServiceNow and SailPoint with the secrets from their files, never an environment variable' {
        $r = Connect-HtRequestSystems -Settings $script:SignIn
        $r.StatusRead | Should -Be 'allowed'
        Should -Invoke -ModuleName HelpDeskAutomation Invoke-RestMethod -Times 1 -Exactly -ParameterFilter { $Uri -like '*/oauth_token.do' -and $Body.client_secret -eq 'sn-secret-from-file' -and $Body.grant_type -eq 'client_credentials' }
        Should -Invoke -ModuleName HelpDeskAutomation Invoke-RestMethod -Times 1 -Exactly -ParameterFilter { $Uri -like '*/oauth/token' -and $Body.client_secret -eq 'isc-secret-from-file' }
        Should -Invoke -ModuleName HelpDeskAutomation Read-HtSecretFile -Times 1 -Exactly -ParameterFilter { $Path -eq 'creds/sailpoint.secret' -and $Allowed -contains 'CONTOSO\Tier0-Admins' }
        $code = (Get-ChildItem (Join-Path $script:Kit 'deploy'), (Join-Path $script:Kit 'powershell') -Recurse -Include *.ps1, *.psm1 | Get-Content -Raw) -join "`n"
        $code | Should -Not -Match 'GetEnvironmentVariable|\$env:HDA_'
    }
    It 'proves the SailPoint token with one status read, the declared call' {
        Connect-HtRequestSystems -Settings $script:SignIn | Out-Null
        Should -Invoke -ModuleName HelpDeskAutomation Invoke-RestMethod -Times 1 -Exactly -ParameterFilter { $Method -eq 'GET' -and $Uri -eq 'https://isc.example.test/v3/access-request-status?limit=1' }
    }
    It 'a personal access token signs in the same way, with the client-credentials grant' {
        $s = $script:SignIn.Clone(); $s.iscCredential = 'personal-access-token'
        (Connect-HtRequestSystems -Settings $s).SailPoint | Should -Be 'personal-access-token'
        Should -Invoke -ModuleName HelpDeskAutomation Invoke-RestMethod -Times 1 -Exactly -ParameterFilter { $Uri -like '*/oauth/token' -and $Body.grant_type -eq 'client_credentials' }
    }
    It 'HT-RQ-06: a 403 to the API client''s token stops the run and names the personal access token' {
        Mock -ModuleName HelpDeskAutomation Invoke-RestMethod { throw (New-Forbidden) } -ParameterFilter { $Uri -like '*/v3/access-request-status*' }
        { Connect-HtRequestSystems -Settings $script:SignIn } | Should -Throw '*HT-RQ-06*personal access token*idn:access-request-status:read*'
        & (Get-Module HelpDeskAutomation) { $script:Systems.ContainsKey('isc') } | Should -BeFalse
    }
    It 'HT-RQ-06: a 403 to a personal access token names its scope and user level' {
        Mock -ModuleName HelpDeskAutomation Invoke-RestMethod { throw (New-Forbidden) } -ParameterFilter { $Uri -like '*/v3/access-request-status*' }
        $s = $script:SignIn.Clone(); $s.iscCredential = 'personal-access-token'
        { Connect-HtRequestSystems -Settings $s } | Should -Throw '*HT-RQ-06*ORG_ADMIN*'
    }
    It 'any other failure of the status read is not dressed up as a token problem' {
        Mock -ModuleName HelpDeskAutomation Invoke-RestMethod { throw 'connection refused' } -ParameterFilter { $Uri -like '*/v3/access-request-status*' }
        { Connect-HtRequestSystems -Settings $script:SignIn } | Should -Throw 'connection refused'
    }
    It 'refuses a SailPoint credential that is neither an API client nor a personal access token' {
        $s = $script:SignIn.Clone(); $s.iscCredential = 'password'
        { Connect-HtRequestSystems -Settings $s } | Should -Throw '*iscCredential must be*'
    }
    It 'protecting a secret is a dry run by default, for the pipeline''s gMSA, and refuses the assessment gMSA' {
        $r = & (Join-Path $script:Kit 'deploy/Protect-HtPipelineSecret.ps1') -SettingsPath (Join-Path $script:Fx 'requests-settings.fixture.json') -System sailpoint
        $r.Applied | Should -BeFalse
        $r.ProtectedFor | Should -Be 'CONTOSO\gmsa-fmphelpdesk$'
        $r.SecretFile | Should -Be 'unused/sailpoint.secret'
        $s = Get-Content (Join-Path $script:Fx 'requests-settings.fixture.json') -Raw | ConvertFrom-Json -AsHashtable; $s.runAs = 'CONTOSO\gmsa-fmpassess$'
        $p = Join-Path $script:Tmp 'protect-assess.json'; $s | ConvertTo-Json | Set-Content $p
        { & (Join-Path $script:Kit 'deploy/Protect-HtPipelineSecret.ps1') -SettingsPath $p -System servicenow } | Should -Throw '*never runs as the assessment gMSA*'
    }
    It 'the test stage can register the pipeline as a dry run, to prove the sign-ins as the gMSA first' {
        $r = & (Join-Path $script:Kit 'deploy/Register-HtRequestPipeline.ps1') -SettingsPath (Join-Path $script:Fx 'requests-settings.fixture.json') -PipelineDryRun
        $r.Runs | Should -Match ' -DryRun$'
        (& (Join-Path $script:Kit 'deploy/Register-HtRequestPipeline.ps1') -SettingsPath (Join-Path $script:Fx 'requests-settings.fixture.json')).Runs | Should -Not -Match 'DryRun'
    }
    It 'a failed sign-in leaves signin.json in the dated run folder and exits 3' {
        $s = Get-Content (Join-Path $script:Fx 'requests-settings.fixture.json') -Raw | ConvertFrom-Json -AsHashtable
        $s.runsPath = Join-Path $script:Tmp 'signin-runs'; $s.certificatePath = Join-Path $script:Tmp 'no-such-worker.pfx'
        $p = Join-Path $script:Tmp 'signin-settings.json'; $s | ConvertTo-Json | Set-Content $p
        & pwsh -NoProfile -File (Join-Path $script:Kit 'deploy/Invoke-HtRequestPipeline.ps1') -SettingsPath $p -DryRun -AsOf '2026-11-27T12:00:00Z' *>&1 | Out-Null
        $LASTEXITCODE | Should -Be 3
        $j = Get-Content (Join-Path $script:Tmp 'signin-runs/2026-11-27T120000Z/signin.json') -Raw | ConvertFrom-Json
        $j.state | Should -Be 'failed'; $j.step | Should -Be 'sign-in'
    }
}

Describe 'The pipeline''s secret files on Windows (WD-184)' {
    It 'a secret file round-trips only through DPAPI for the account that protected it' -Skip:(-not $IsWindows) {
        $p = Join-Path $script:Tmp 'creds/roundtrip.secret'
        $r = Protect-HtSecretFile -Path $p -Secret (ConvertTo-SecureString 'fixture-client-secret' -AsPlainText -Force)
        $r.Protection | Should -Be 'DPAPI, current user'
        [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($p)) | Should -Not -Match 'fixture-client-secret'
        & (Get-Module HelpDeskAutomation) { param($f) Read-HtSecretFile -Path $f } $p | Should -Be 'fixture-client-secret'
    }
    It 'a missing secret file is HT-RQ-06, with the script that writes it' -Skip:(-not $IsWindows) {
        { & (Get-Module HelpDeskAutomation) { Read-HtSecretFile -Path 'no/such.secret' } } | Should -Throw '*HT-RQ-06*Protect-HtPipelineSecret.ps1*'
    }
}
