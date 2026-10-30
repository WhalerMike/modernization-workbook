#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 07: access reviews of privileged roles. First Learn's tutorial, run as published against
# the fake (each test pins one row of the chapter's gap table), then the example: the calls and
# their permissions, the reviewed JSON, the bodies, the rules, the plan, -Apply and the evidence.

BeforeAll {
    . (Join-Path $PSScriptRoot 'AccessReviewsSampleHarness.ps1')
    Import-Module (Join-Path $PSScriptRoot '../powershell/PaAccessReviews/PaAccessReviews.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/ch07/tenant.json'
    $script:ConfigPath = Join-Path $PSScriptRoot 'fixtures/ch07/access-reviews.json'
    $script:AsOf = [datetime]'2026-10-30'
    $script:GA = '62e90394-69f5-4237-9190-012177145e10'
    $script:Sub = '33333333-3333-4333-8333-333333333333'

    function New-Run([string]$Task = 'access-reviews-plan', [scriptblock]$Change, [string]$Path = $script:Fixture) {
        $fake = New-PaArFake -Path $Path
        if ($Change) { & $Change $fake.Tenant }
        [pscustomobject]@{ Fake = $fake; Client = (New-PaArClient -Cloud gcc -Task $Task -Invoke $fake.Invoke) }
    }
    function Get-Config([scriptblock]$Change) {
        $c = Read-PaArConfig $script:ConfigPath
        if ($Change) { & $Change $c }
        $c
    }
    function Get-Review($Config, [string]$Name) { @($Config.reviews | Where-Object { $_.name -eq $Name })[0] }
    function Get-Rules($Findings, [string]$Rule, [string]$Severity) { @($Findings | Where-Object { $_.Rule -eq $Rule -and (-not $Severity -or $_.Severity -eq $Severity) }) }
    function Get-Item1($Plan, [string]$Name) { @($Plan.Items | Where-Object Name -EQ $Name)[0] }
}

Describe 'Chapter 07: "Review access to administrative roles using access reviews APIs" (Learn), run as published' {
    BeforeAll {
        $script:Req = @(Get-ArTutorialRequests)
        $script:Create = Get-ArTutorialCreateRequest
    }
    It 'sends every request to a hard-coded https://graph.microsoft.com/v1.0' {
        $script:Req.Count | Should -BeGreaterThan 5
        foreach ($r in $script:Req) { $r.Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/*' }
    }
    It 'reviews one role, users and groups, active and eligible: the example keeps the shape and leaves groups to their own series' {
        $s = $script:Create.Body.scope
        $s['@odata.type'] | Should -Be '#microsoft.graph.principalResourceMembershipsScope'
        @($s.principalScopes.query) | Should -Be @('/users', '/groups')
        @($s.resourceScopes).Count | Should -Be 1
        $s.resourceScopes[0].query | Should -Match '^/roleManagement/directory/roleDefinitions/[0-9a-f-]{36}$'
        $mine = Get-PaArScope -Review @{ kind = 'entraRole'; name = 'x'; roleTemplateId = 'fe930be7-5e62-47db-91af-98c3a49a38b1'; assignments = 'activeAndEligible' }
        $usersOnly = $s | ConvertTo-Json -Depth 10 | ConvertFrom-Json -AsHashtable -Depth 10
        $usersOnly.principalScopes = @($usersOnly.principalScopes | Where-Object { $_.query -eq '/users' })
        ($mine | ConvertTo-Json -Depth 10 -Compress) | Should -Be ($usersOnly | ConvertTo-Json -Depth 10 -Compress)
    }
    It 'runs against the fake: the POST creates a series, and a second run creates a second one' {
        $fake = New-PaArFake
        & $fake.Invoke $script:Create.Method $script:Create.Uri $script:Create.Body | Out-Null
        & $fake.Invoke $script:Create.Method $script:Create.Uri $script:Create.Body | Out-Null
        @($fake.Tenant.graphDefinitions | Where-Object displayName -EQ $script:Create.Body.displayName).Count | Should -Be 2
        @($script:Req | Where-Object { $_.Method -eq 'GET' -and $_.Uri -match '/accessReviews/definitions$' }).Count | Should -Be 0
    }
    It 'names one user as the reviewer and no fallback reviewer' {
        @($script:Create.Body.reviewers).Count | Should -Be 1
        $script:Create.Body.reviewers[0].query | Should -Match '^/users/'
        $script:Create.Body.Contains('fallbackReviewers') | Should -BeFalse
    }
    It 'leaves silence and denials in place: no default decision, no auto-apply, applied by hand in Step 5' {
        $st = $script:Create.Body.settings
        $st.defaultDecisionEnabled | Should -BeFalse
        $st.Contains('autoApplyDecisionsEnabled') | Should -BeFalse
        @($script:Req | Where-Object { $_.Step -eq 'Step 5' -and $_.Method -eq 'POST' -and $_.Uri -like '*/applyDecisions' }).Count | Should -Be 1
    }
    It 'runs for one day every three months from a start date in the past' {
        $st = $script:Create.Body.settings
        $st.instanceDurationInDays | Should -Be 1
        $st.recurrence.pattern.type | Should -Be 'absoluteMonthly'
        $st.recurrence.pattern.interval | Should -Be 3
        [datetime]$st.recurrence.range.startDate | Should -BeLessThan $script:AsOf
    }
    It 'omits descriptionForReviewers; the example''s checks flag it with four other gaps' {
        $script:Create.Body.Contains('descriptionForReviewers') | Should -BeFalse
        $f = Test-PaArDefinition -Body $script:Create.Body -AsOf $script:AsOf
        @($f.Rule | Sort-Object -Unique) | Should -Be @('PA-AR-02', 'PA-AR-03', 'PA-AR-05', 'PA-AR-07', 'PA-AR-10')
        Get-Rules $f 'PA-AR-01' | Should -BeNullOrEmpty
    }
    It 'gathers evidence with POSTs and a download link that lasts 24 hours' {
        $s6 = @($script:Req | Where-Object Step -EQ 'Step 6')
        @($s6.Method | Sort-Object -Unique) | Should -Be @('POST')
        (Get-ArTutorialText) | Should -Match 'active for only 24 hours'
    }
    It 'filters the history report on roleAssignmentScheduleInstances, which its own Step 1 scope never names' {
        $hist = @($script:Req | Where-Object { $_.Step -eq 'Step 6' -and $_.Uri -like '*/historyDefinitions' })[0]
        $hist.Body.scopes[0].query | Should -Match "contains\(scope/query, 'roleAssignmentScheduleInstances'\)"
        $script:Create.BodyText | Should -Not -Match 'roleAssignmentScheduleInstances'
    }
    It 'covers no Azure role and no PIM for Groups group' {
        (Get-ArTutorialText) | Should -Not -Match 'management\.azure\.com|accessReviewScheduleDefinitions|transitiveMembers'
    }
    It 'asks for AccessReview.ReadWrite.All for every step, reads included' {
        (Get-ArTutorialText) | Should -Match 'Grant yourself the following delegated permissions: `AccessReview\.ReadWrite\.All`'
        (Get-ArTutorialText) | Should -Not -Match 'AccessReview\.Read\.All'
    }
}

Describe 'Calls and permissions (config/calls-ch07.json)' {
    It 'declares every call with a Learn page and a permission or Azure role; reads are GET, writes POST or PUT, nothing deletes' {
        $all = Get-PaArCall
        $all.Count | Should -Be 9
        foreach ($c in $all) {
            $c.learn | Should -BeLike 'https://learn.microsoft.com/*'
            if ($c.api -eq 'graph') { @($c.permissions).Count | Should -BeGreaterThan 0 } else { $c.azureRole | Should -Not -BeNullOrEmpty }
            $c.method | Should -BeIn @('GET', 'POST', 'PUT')
            if ($c.method -ne 'GET') { $c.tasks | Should -Be @('access-reviews-apply') }
        }
    }
    It 'gives each task its least-privileged permissions' {
        $p = Get-PaArRequiredPermission -Task access-reviews-plan
        $p.GraphPermissions | Should -Be @('AccessReview.Read.All'); $p.AzureRoles | Should -Be @('Reader')
        $p = Get-PaArRequiredPermission -Task access-reviews-evidence
        $p.GraphPermissions | Should -Be @('AccessReview.Read.All'); $p.AzureRoles | Should -Be @('Reader')
        $p = Get-PaArRequiredPermission -Task access-reviews-apply
        $p.GraphPermissions | Should -Be @('AccessReview.ReadWrite.All'); $p.AzureRoles | Should -Be @('User Access Administrator')
    }
    It 'uses every declared call of each task on the fixture, and no other: the permissions are the union of the calls made' {
        $plan = New-Run access-reviews-plan
        $null = Get-PaArPlan -Client $plan.Client -Config (Get-Config) -AsOf $script:AsOf
        $ev = New-Run access-reviews-evidence
        $null = Get-PaArEvidence -Client $ev.Client -Config (Get-Config) -AsOf $script:AsOf
        $ap = New-Run access-reviews-apply
        $null = Invoke-PaArApply -Client $ap.Client -Plan (Get-PaArPlan -Client $ap.Client -Config (Get-Config) -AsOf $script:AsOf) -Apply -IncludePreview
        foreach ($run in @(@{ R = $plan; T = 'access-reviews-plan' }, @{ R = $ev; T = 'access-reviews-evidence' }, @{ R = $ap; T = 'access-reviews-apply' })) {
            $used = @($run.R.Client.Evidence.Call | Sort-Object -Unique)
            $declared = @((Get-PaArCall -Task $run.T).id | Sort-Object -Unique)
            $used | Should -Be $declared
        }
    }
    It 'refuses a call the task does not declare' {
        $r = New-Run access-reviews-plan
        { Invoke-PaArList -Client $r.Client -CallId 'ar-instances-list' -Bind @{ definitionId = 'x' } } | Should -Throw '*Undeclared call*'
    }
    It 'refuses to follow a next link to another host' {
        $c = New-PaArClient -Cloud gcc -Task access-reviews-plan -Invoke { param($m, $u, $b) @{ value = @(); '@odata.nextLink' = 'https://graph.example.net/v1.0/identityGovernance/accessReviews/definitions?$skiptoken=2' } }
        { Invoke-PaArList -Client $c -CallId 'ar-definitions-list' } | Should -Throw '*Refusing to send the token*'
    }
    It 'sends GCC to the worldwide hosts and GCC High to its own, and knows no other cloud' {
        (New-PaArClient -Cloud gcc -Task access-reviews-plan -Invoke {}).Cloud.Graph | Should -Be 'https://graph.microsoft.com'
        (New-PaArClient -Cloud gcchigh -Task access-reviews-plan -Invoke {}).Cloud.Graph | Should -Be 'https://graph.microsoft.us'
        { New-PaArClient -Cloud GCCHigh -Task access-reviews-plan -Invoke {} } | Should -Throw '*Unknown cloud*'
    }
}

Describe 'The reviewed JSON and the bodies' {
    It 'reads the fixture: seven series, one per role or group' {
        @((Get-Config).reviews).Count | Should -Be 7
    }
    It 'refuses a reviewer named by UPN, a name without the prefix, and a name used twice' {
        $p = Join-Path ([IO.Path]::GetTempPath()) "pa-ar-$([guid]::NewGuid().Guid.Substring(0,8)).json"
        try {
            $c = Get-Content $script:ConfigPath -Raw | ConvertFrom-Json -AsHashtable -Depth 30
            $c.reviews[0].reviewers = @(@{ user = 'lee.moss@contoso.example' }); $c | ConvertTo-Json -Depth 30 | Set-Content $p
            { Read-PaArConfig $p } | Should -Throw '*object ID*'
            $c = Get-Content $script:ConfigPath -Raw | ConvertFrom-Json -AsHashtable -Depth 30
            $c.reviews[0].name = 'GA review'; $c | ConvertTo-Json -Depth 30 | Set-Content $p
            { Read-PaArConfig $p } | Should -Throw '*managed prefix*'
            $c = Get-Content $script:ConfigPath -Raw | ConvertFrom-Json -AsHashtable -Depth 30
            $c.reviews[1].name = $c.reviews[0].name; $c | ConvertTo-Json -Depth 30 | Set-Content $p
            { Read-PaArConfig $p } | Should -Throw '*used twice*'
        } finally { Remove-Item $p -ErrorAction SilentlyContinue }
    }
    It 'uses Learn''s Example 12.2 query for an eligible-only review (users only)' {
        $s = Get-PaArScope -Review @{ kind = 'entraRole'; name = 'x'; roleTemplateId = $script:GA; assignments = 'eligible' }
        $s.query | Should -Be "/roleManagement/directory/roleEligibilityScheduleInstances?`$expand=principal&`$filter=(isof(principal,'microsoft.graph.user') and roleDefinitionId eq '$($script:GA)')"
    }
    It 'reviews a PIM for Groups group as its transitive members, and a reviewer group as its transitive members' {
        $c = Get-Config
        $b = (New-PaArDefinitionBody -Review (Get-Review $c 'PAR-PRV-T0-GlobalAdmin-Monthly') -Config $c).Body
        $b.scope.query | Should -Be '/groups/9e000000-0000-4000-8000-000000000006/transitiveMembers'
        $b.reviewers[0].query | Should -Be '/groups/aa000000-0000-4000-8000-000000000011/transitiveMembers'
    }
    It 'sets the program''s cadence: Tier 0 monthly, Tier 1 quarterly, 14 days, Deny and auto-apply' {
        $c = Get-Config
        $t0 = (New-PaArDefinitionBody -Review (Get-Review $c 'PAR-T0-PrivilegedRoleAdministrator-Monthly') -Config $c).Body.settings
        $t1 = (New-PaArDefinitionBody -Review (Get-Review $c 'PAR-T1-ExchangeAdministrator-Quarterly') -Config $c).Body.settings
        $t0.recurrence.pattern.interval | Should -Be 1; $t1.recurrence.pattern.interval | Should -Be 3
        $t0.recurrence.pattern.dayOfMonth | Should -Be 1
        $t0.instanceDurationInDays | Should -Be 14
        $t0.defaultDecisionEnabled | Should -BeTrue; $t0.defaultDecision | Should -Be 'Deny'; $t0.autoApplyDecisionsEnabled | Should -BeTrue
    }
    It 'keeps silence from removing the emergency accounts: the Global Administrator series has no default decision' {
        $c = Get-Config
        $s = (New-PaArDefinitionBody -Review (Get-Review $c 'PAR-T0-GlobalAdministrator-Monthly') -Config $c).Body.settings
        $s.defaultDecisionEnabled | Should -BeFalse
        $s.autoApplyDecisionsEnabled | Should -BeTrue
    }
    It 'writes an Azure role series for Resource Manager: eligible Owner at the subscription, users as reviewers, a stable ID' {
        $c = Get-Config
        $b = New-PaArDefinitionBody -Review (Get-Review $c 'PAR-AZ-T0-Owner-Platform-Monthly') -Config $c
        $b.Api | Should -Be 'arm'
        $b.Body.scope.resourceId | Should -Be "/subscriptions/$($script:Sub)"
        $b.Body.scope.roleDefinitionId | Should -Be "/subscriptions/$($script:Sub)/providers/Microsoft.Authorization/roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635"
        $b.Body.scope.assignmentState | Should -Be 'eligible'
        $b.Body.reviewers[0].principalType | Should -Be 'user'
        $b.DefinitionId | Should -Be (Get-PaArStableId 'PAR-AZ-T0-Owner-Platform-Monthly')
        $b.DefinitionId | Should -Match '^[0-9a-f-]{36}$'
    }
}

Describe 'Test-PaArDefinition: the rules' {
    BeforeAll {
        $script:C = Get-Config
        function Body([string]$Name, [scriptblock]$Change) {
            $b = (New-PaArDefinitionBody -Review (Get-Review $script:C $Name) -Config $script:C).Body | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30
            if ($Change) { & $Change $b }
            $b
        }
        function Check($Body, [string]$Tier = 'T0', [string]$Api = 'graph') { Test-PaArDefinition -Body $Body -Api $Api -Tier $Tier -AsOf $script:AsOf }
    }
    It 'passes the fixture''s Tier 0 series with no Finding' {
        @(Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly') | Where-Object Severity -NE 'Info').Count | Should -Be 0
    }
    It 'PA-AR-01: no reviewers is a self-review' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.reviewers = @() })) 'PA-AR-01' 'Finding' | Should -HaveCount 1 }
    It 'PA-AR-02: no fallback reviewer' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.fallbackReviewers = @() })) 'PA-AR-02' 'Finding' | Should -HaveCount 1 }
    It 'PA-AR-03: a reviewer description over 256 characters' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.descriptionForReviewers = 'x' * 257 })) 'PA-AR-03' | Should -HaveCount 1 }
    It 'PA-AR-04: a monthly review longer than 27 days' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.settings.instanceDurationInDays = 28 })) 'PA-AR-04' | Should -HaveCount 1 }
    It 'PA-AR-05: auto-apply off' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.settings.autoApplyDecisionsEnabled = $false })) 'PA-AR-05' | Should -HaveCount 1 }
    It 'PA-AR-06: Deny on silence over active Global Administrator assignments is the lockout' {
        $f = Check (Body 'PAR-T0-GlobalAdministrator-Monthly' { param($b) $b.settings.defaultDecisionEnabled = $true; $b.settings.defaultDecision = 'Deny' })
        Get-Rules $f 'PA-AR-06' 'Finding' | Should -HaveCount 1
    }
    It 'PA-AR-06: Deny on silence is allowed for eligible-only Global Administrator assignments' {
        $b = Body 'PAR-T0-GlobalAdministrator-Monthly' { param($b) $b.settings.defaultDecisionEnabled = $true; $b.settings.defaultDecision = 'Deny' }
        $b.scope = Get-PaArScope -Review @{ kind = 'entraRole'; name = 'x'; roleTemplateId = $script:GA; assignments = 'eligible' }
        Get-Rules (Check $b) 'PA-AR-06' | Should -BeNullOrEmpty
    }
    It 'PA-AR-07: no-response default other than Deny is a Warn' { Get-Rules (Check (Body 'PAR-T1-ExchangeAdministrator-Quarterly' { param($b) $b.settings.defaultDecision = 'Approve' }) 'T1') 'PA-AR-07' 'Warn' | Should -HaveCount 1 }
    It 'PA-AR-08: justification not required' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.settings.justificationRequiredOnApproval = $false })) 'PA-AR-08' | Should -HaveCount 1 }
    It 'PA-AR-09: Tier 0 reviewed quarterly' { Get-Rules (Check (Body 'PAR-T1-ExchangeAdministrator-Quarterly') 'T0') 'PA-AR-09' | Should -HaveCount 1 }
    It 'PA-AR-10: a start date in the past' { Get-Rules (Check (Body 'PAR-T0-PrivilegedRoleAdministrator-Monthly' { param($b) $b.settings.recurrence.range.startDate = '2026-01-01' })) 'PA-AR-10' 'Warn' | Should -HaveCount 1 }
    It 'PA-AR-11: a group as reviewer of an Azure role series' {
        $b = Body 'PAR-AZ-T0-Owner-Platform-Monthly' { param($b) $b.reviewers = @(@{ principalId = 'aa000000-0000-4000-8000-000000000010'; principalType = 'group' }) }
        Get-Rules (Check $b 'T0' 'arm') 'PA-AR-11' | Should -HaveCount 1
    }
}

Describe 'Get-PaArPlan: the dry run' {
    BeforeAll {
        $script:Run = New-Run access-reviews-plan
        $script:Plan = Get-PaArPlan -Client $script:Run.Client -Config (Get-Config) -AsOf $script:AsOf
    }
    It 'says what -Apply would do for each series' {
        (Get-Item1 $script:Plan 'PAR-T0-GlobalAdministrator-Monthly').Action | Should -Be 'Update'
        (Get-Item1 $script:Plan 'PAR-T0-GlobalAdministrator-Monthly').Changes | Should -Be @('settings.instanceDurationInDays')
        (Get-Item1 $script:Plan 'PAR-T0-PrivilegedRoleAdministrator-Monthly').Action | Should -Be 'Create'
        (Get-Item1 $script:Plan 'PAR-T1-ExchangeAdministrator-Quarterly').Action | Should -Be 'Replace'
        (Get-Item1 $script:Plan 'PAR-PRV-T0-GlobalAdmin-Monthly').Action | Should -Be 'NoChange'
        (Get-Item1 $script:Plan 'PAR-PRV-T0-PrivRoleAdmin-Monthly').Action | Should -Be 'NoChange'
        (Get-Item1 $script:Plan 'PAR-PRV-T1-ExchangeAdmin-Quarterly').Action | Should -Be 'NoChange'
        (Get-Item1 $script:Plan 'PAR-AZ-T0-Owner-Platform-Monthly').Action | Should -Be 'Update'
        (Get-Item1 $script:Plan 'PAR-T0-SecurityAdministrator-Monthly').Action | Should -Be 'Unmanaged'
        @($script:Plan.Items.Name) | Should -Not -Contain 'Quarterly review - APP-PAYROLL-USERS-T1'
    }
    It 'reads only: every request is a GET' {
        @($script:Run.Fake.Calls.Method | Sort-Object -Unique) | Should -Be @('GET')
    }
    It 'reports 0 Finding, 1 Warn (the unmanaged series) and 1 Info (the emergency accounts kept on silence)' {
        @($script:Plan.Findings | Where-Object Severity -EQ 'Finding').Count | Should -Be 0
        (Get-Rules $script:Plan.Findings 'PA-AR-13' 'Warn').Object | Should -Be 'PAR-T0-SecurityAdministrator-Monthly'
        (Get-Rules $script:Plan.Findings 'PA-AR-07' 'Info').Object | Should -Be 'PAR-T0-GlobalAdministrator-Monthly'
    }
    It 'calls a scope change a Replace, and a change of user reviewers an Update' {
        $c = Get-Config { param($c) (Get-Review $c 'PAR-PRV-T0-GlobalAdmin-Monthly').groupId = '9e000000-0000-4000-8000-000000000002' }
        $p = Get-PaArPlan -Client (New-Run).Client -Config $c -AsOf $script:AsOf
        (Get-Item1 $p 'PAR-PRV-T0-GlobalAdmin-Monthly').Action | Should -Be 'Replace'
        $r = New-Run access-reviews-plan { param($t) $d = $t.graphDefinitions | Where-Object displayName -EQ 'PAR-PRV-T0-GlobalAdmin-Monthly'; $d.reviewers = @(@{ query = '/users/a0000000-0000-4000-8000-000000000013'; queryType = 'MicrosoftGraph' }) }
        (Get-Item1 (Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf) 'PAR-PRV-T0-GlobalAdmin-Monthly').Action | Should -Be 'Update'
    }
    It 'PA-AR-14: a group that holds a reviewed role but has no membership series of its own' {
        $c = Get-Config { param($c) $c.reviews = @($c.reviews | Where-Object { $_.name -ne 'PAR-PRV-T1-ExchangeAdmin-Quarterly' }) }
        $p = Get-PaArPlan -Client (New-Run).Client -Config $c -AsOf $script:AsOf
        $f = Get-Rules $p.Findings 'PA-AR-14' 'Finding'
        $f | Should -HaveCount 1
        $f[0].Object | Should -Be 'PAR-T1-ExchangeAdministrator-Quarterly'
    }
    It 'reviews users only in a role series: groups never appear as a principal scope' {
        $c = Get-Config
        foreach ($r in @($c.reviews | Where-Object kind -EQ 'entraRole')) {
            @((New-PaArDefinitionBody -Review $r -Config $c).Body.scope.principalScopes.query) | Should -Be @('/users')
        }
    }
    It 'reports a name used twice in the tenant as a Conflict (PA-AR-12)' {
        $r = New-Run access-reviews-plan { param($t) $d = $t.graphDefinitions | Where-Object displayName -EQ 'PAR-PRV-T0-GlobalAdmin-Monthly'; $t.graphDefinitions.Add(($d | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30)) }
        $p = Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf
        (Get-Item1 $p 'PAR-PRV-T0-GlobalAdmin-Monthly').Action | Should -Be 'Conflict'
        Get-Rules $p.Findings 'PA-AR-12' 'Finding' | Should -HaveCount 1
    }
}

Describe 'Invoke-PaArApply: writes only with -Apply' {
    It 'sends nothing without -Apply' {
        $r = New-Run access-reviews-apply
        $res = Invoke-PaArApply -Client $r.Client -Plan (Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf)
        @($r.Fake.Calls.Method | Sort-Object -Unique) | Should -Be @('GET')
        @($res | Where-Object Result -EQ 'DryRun').Name | Should -Be @('PAR-T0-GlobalAdministrator-Monthly', 'PAR-T0-PrivilegedRoleAdministrator-Monthly')
    }
    It 'with -Apply POSTs the new series and PUTs the full changed one, and never deletes' {
        $r = New-Run access-reviews-apply
        $res = Invoke-PaArApply -Client $r.Client -Plan (Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf) -Apply
        $w = @($r.Fake.Calls | Where-Object Method -NE 'GET')
        @($w.Method) | Should -Be @('PUT', 'POST')
        $w[0].Uri | Should -Be 'https://graph.microsoft.com/v1.0/identityGovernance/accessReviews/definitions/7a000000-0000-4000-8000-000000000001'
        $w[0].Body.id | Should -Be '7a000000-0000-4000-8000-000000000001'
        $w[0].Body.Contains('scope') | Should -BeTrue
        (@($res | Where-Object Name -EQ 'PAR-T1-ExchangeAdministrator-Quarterly')[0]).Result | Should -Be 'Skipped'
        (@($res | Where-Object Name -EQ 'PAR-AZ-T0-Owner-Platform-Monthly')[0]).Note | Should -BeLike '*-IncludePreview*'
        @($res | Where-Object Result -EQ 'Sent').Note | Should -Be @('read back', 'read back')
    }
    It 'converges: after -Apply the plan shows NoChange for what it wrote' {
        $r = New-Run access-reviews-apply
        $null = Invoke-PaArApply -Client $r.Client -Plan (Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf) -Apply -IncludePreview
        $p = Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf
        foreach ($n in 'PAR-T0-GlobalAdministrator-Monthly', 'PAR-T0-PrivilegedRoleAdministrator-Monthly', 'PAR-AZ-T0-Owner-Platform-Monthly') { (Get-Item1 $p $n).Action | Should -Be 'NoChange' }
    }
    It 'with -IncludePreview PUTs the Azure series at its stable ID on the preview API version' {
        $r = New-Run access-reviews-apply
        $null = Invoke-PaArApply -Client $r.Client -Plan (Get-PaArPlan -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf) -Apply -IncludePreview
        $put = @($r.Fake.Calls | Where-Object { $_.Method -eq 'PUT' -and $_.Uri -like 'https://management.azure.com/*' })
        $put | Should -HaveCount 1
        $put[0].Uri | Should -Be "https://management.azure.com/subscriptions/$($script:Sub)/providers/Microsoft.Authorization/accessReviewScheduleDefinitions/$(Get-PaArStableId 'PAR-AZ-T0-Owner-Platform-Monthly')?api-version=2021-12-01-preview"
    }
    It 'refuses -Apply when the plan has a Finding, and with a read-only client' {
        $c = Get-Config { param($c) (Get-Review $c 'PAR-T0-PrivilegedRoleAdministrator-Monthly').fallbackReviewers = @() }
        $r = New-Run access-reviews-apply
        { Invoke-PaArApply -Client $r.Client -Plan (Get-PaArPlan -Client $r.Client -Config $c -AsOf $script:AsOf) -Apply } | Should -Throw '*PA-AR-02*'
        @($r.Fake.Calls | Where-Object Method -NE 'GET') | Should -BeNullOrEmpty
        $p = New-Run access-reviews-plan
        { Invoke-PaArApply -Client $p.Client -Plan (Get-PaArPlan -Client $p.Client -Config (Get-Config) -AsOf $script:AsOf) -Apply } | Should -Throw '*access-reviews-apply*'
    }
    It 'the live invoker refuses a write without -AllowWrite, and a session in another cloud' {
        function global:Get-MgContext { }
        Mock -ModuleName PaAccessReviews Get-MgContext { [pscustomobject]@{ Environment = 'Global' } }
        $inv = New-PaArLiveInvoker -Cloud gcc -SkipAzure
        { & $inv 'POST' 'https://graph.microsoft.com/v1.0/identityGovernance/accessReviews/definitions' @{} } | Should -Throw '*writes need -Apply*'
        { New-PaArLiveInvoker -Cloud gcchigh -SkipAzure } | Should -Throw "*not 'USGov'*"
        Remove-Item function:global:Get-MgContext
    }
}

Describe 'Get-PaArEvidence: the results as evidence' {
    BeforeAll {
        $script:Ev = Get-PaArEvidence -Client (New-Run access-reviews-evidence).Client -Config (Get-Config) -AsOf $script:AsOf
    }
    It 'reads 18 decisions in 7 instances across Graph and Resource Manager' {
        $script:Ev.Rows.Count | Should -Be 18
        $script:Ev.Instances.Count | Should -Be 7
        @($script:Ev.Rows | Where-Object Api -EQ 'arm').Count | Should -Be 2
    }
    It 'reports each evidence rule on the fixture' {
        $f = $script:Ev.Findings
        (Get-Rules $f 'PA-AR-E01').Object | Should -Be 'PAR-T0-PrivilegedRoleAdministrator-Monthly'
        (Get-Rules $f 'PA-AR-E02').Object | Should -Be 'PAR-PRV-T0-GlobalAdmin-Monthly'
        (Get-Rules $f 'PA-AR-E03').Object | Should -Be 'PAR-T1-ExchangeAdministrator-Quarterly / Frank Ode'
        (Get-Rules $f 'PA-AR-E04' 'Finding').Object | Should -Be 'PAR-T0-GlobalAdministrator-Monthly / Frank Ode'
        (Get-Rules $f 'PA-AR-E04' 'Warn').Object | Should -Be 'PAR-T1-ExchangeAdministrator-Quarterly / Gina Lee'
        (Get-Rules $f 'PA-AR-E05').Object | Should -Be 'PAR-T1-ExchangeAdministrator-Quarterly / Carl Ops'
        (Get-Rules $f 'PA-AR-E06').Object | Should -Be 'PAR-PRV-T0-GlobalAdmin-Monthly / Bo Chen'
        (Get-Rules $f 'PA-AR-E07' 'Warn') | Should -HaveCount 1
        (Get-Rules $f 'PA-AR-E08').Object | Should -Be 'PAR-T0-GlobalAdministrator-Monthly / Emergency Access 02'
        @($f | Where-Object Severity -EQ 'Finding').Count | Should -Be 7
    }
    It 'reads decisions with $top=100 and follows the next link' {
        $r = New-Run access-reviews-evidence
        $null = Get-PaArEvidence -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf
        $d = @($r.Fake.Calls.Uri | Where-Object { $_ -like '*/instances/ga-2026-10/decisions*' })
        $d[0] | Should -BeLike '*$top=100'
        $d.Count | Should -Be 2
        $d[1] | Should -BeLike '*$skiptoken=2'
    }
    It 'pages with $skip when a full page comes back without a next link' {
        $seen = [Collections.Generic.List[string]]::new()
        $inv = { param($m, $u, $b) $seen.Add($u); if ($u -like '*$skip=100*') { @{ value = @(@{ id = 'last' }) } } else { @{ value = @(1..100 | ForEach-Object { @{ id = "d$_" } }) } } }.GetNewClosure()
        $c = New-PaArClient -Cloud gcc -Task access-reviews-evidence -Invoke $inv
        @(Invoke-PaArList -Client $c -CallId 'ar-decisions-list' -Bind @{ definitionId = 'a'; instanceId = 'b' } -Top 100).Count | Should -Be 101
        $seen[1] | Should -BeLike '*$top=100&$skip=100'
    }
    It 'reads only: every request is a GET' {
        $r = New-Run access-reviews-evidence
        $null = Get-PaArEvidence -Client $r.Client -Config (Get-Config) -AsOf $script:AsOf
        @($r.Fake.Calls.Method | Sort-Object -Unique) | Should -Be @('GET')
    }
}

Describe 'Invoke-PaAccessReviews.ps1' {
    It 'has no default cloud' {
        $p = (Get-Command (Join-Path $script:Root 'Invoke-PaAccessReviews.ps1')).Parameters['Cloud']
        ($p.Attributes | Where-Object { $_ -is [Management.Automation.ParameterAttribute] }).Mandatory | Should -BeTrue
    }
    It 'writes the dry run and a manifest with the plan task''s permissions and a hash per file' {
        $out = Join-Path ([IO.Path]::GetTempPath()) "pa-ar-$([guid]::NewGuid().Guid.Substring(0,8))"
        try {
            $text = & (Join-Path $script:Root 'Invoke-PaAccessReviews.ps1') -Cloud gcc -Mode Plan -ConfigPath $script:ConfigPath -FixturePath $script:Fixture -AsOf $script:AsOf -OutputPath $out
            $text[0] | Should -Be 'Plan: 1 Create, 2 Update, 1 Replace, 3 NoChange, 1 Unmanaged'
            $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
            $m.task | Should -Be 'access-reviews-plan'
            @($m.graphPermissions) | Should -Be @('AccessReview.Read.All')
            @($m.requests.method | Sort-Object -Unique) | Should -Be @('GET')
            $m.files.'plan.json' | Should -Be (Get-FileHash (Join-Path $out 'plan.json') -Algorithm SHA256).Hash.ToLowerInvariant()
            Test-Path (Join-Path $out 'bodies/PAR-T0-PrivilegedRoleAdministrator-Monthly.json') | Should -BeTrue
        } finally { Remove-Item $out -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
