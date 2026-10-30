#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 04: PIM role settings for Microsoft Entra roles as code. Learn's pinned samples run
# against the fake first (what they do and leave out), then the role files, the rules, the checks,
# the client, the plan, the apply and the entry script, against a fictional tenant.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
    Import-Module (Join-Path $PSScriptRoot '../powershell/PimEntraRoles/PimEntraRoles.psm1') -Force
    . (Join-Path $PSScriptRoot 'PimLearnSampleHarness.ps1')
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/ch04/tenant.json'
    $script:RolesPath = Join-Path $script:Root 'config/pim-ch04/roles'
    $script:Settings = @(Read-PaPimRoleSetting -Path $script:RolesPath)
    $script:Tiers = Read-PaPimTierConfig
    $script:Binding = Read-PaPimBinding -Path (Join-Path $PSScriptRoot 'fixtures/ch04/inputs/pim-bindings.json')
    $script:Emergency = Read-PaEmergencyConfig -Path (Join-Path $PSScriptRoot 'fixtures/inputs/emergency-access.json')
    $script:Exceptions = @(Import-PaExceptions -Path (Join-Path $PSScriptRoot 'fixtures/inputs/exceptions.csv'))
    $script:Confirmed = @(Import-Csv (Join-Path $PSScriptRoot 'fixtures/ch04/inputs/confirmed-activations.csv'))
    $script:AppAdmin = '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3'
    $script:UserAdmin = 'fe930be7-5e62-47db-91af-98c3a49a38b1'
    $script:Exchange = '29232cdf-9323-42fd-ade2-1d097af3e4de'

    function Get-Setting([string]$Name) { $script:Settings | Where-Object role -EQ $Name | ConvertTo-Json -Depth 10 | ConvertFrom-Json -AsHashtable }
    function New-Fake([scriptblock]$Change) { $f = New-PaPimFixtureInvoker -Path $script:Fixture; if ($Change) { & $Change $f.Tenant }; $f }
    function Get-Plan($Fake, [int]$Wave = 1, [object[]]$Confirmed = $script:Confirmed) {
        $c = New-PaPimClient -Cloud gcc -Task pim-plan -Invoke $Fake.Invoke
        $st = Get-PaPimTenantState -Client $c -Settings $script:Settings
        New-PaPimPlan -Settings $script:Settings -Binding $script:Binding -Tiers $script:Tiers -State $st -Wave $Wave -Emergency $script:Emergency `
            -Exceptions $script:Exceptions -Confirmed $Confirmed -AsOf ([datetime]'2026-10-30')
    }
    function Invoke-Wave($Fake, [int]$Wave = 1) {
        $plan = Get-Plan $Fake $Wave
        $w = New-PaPimClient -Cloud gcc -Task pim-apply -Invoke $Fake.Invoke -AllowWrite
        $null = Invoke-PaPimPlan -Plan $plan -Client $w -ActivationGateChecked
        $plan
    }
    function Get-FakePolicy($Fake, [string]$TemplateId) {
        $c = New-PaPimClient -Cloud gcc -Task pim-plan -Invoke $Fake.Invoke
        (Get-PaPimTenantState -Client $c -Settings @($script:Settings | Where-Object roleTemplateId -EQ $TemplateId)).Policies[$TemplateId]
    }
    function Rule($plan, $id, $sev) { @($plan.Findings | Where-Object { $_.Rule -eq $id -and (-not $sev -or $_.Severity -eq $sev) }) }
}

Describe 'Chapter 04: "Update rules in PIM by using Microsoft Graph" (Learn), run as published' {
    BeforeAll { $script:Reqs = @(Get-PimLearnRequest -Page $script:RulesPage) }
    It 'finds a role''s policy from its template ID: the model for the read' {
        $get = @($script:Reqs | Where-Object Method -EQ 'GET')
        $get.Count | Should -Be 1
        $fake = New-Fake
        $r = & $fake.Invoke 'GET' (ConvertTo-PimFakeUri $get[0].Uri) $null
        @($r.value).Count | Should -Be 1
        $r.value[0].roleDefinitionId | Should -Be $script:AppAdmin
    }
    It 'has six PATCH samples, each with its @odata.type, and none for the authentication context rule' {
        $p = @($script:Reqs | Where-Object Method -EQ 'PATCH')
        $p.Count | Should -Be 6
        foreach ($x in $p) { $x.Body['@odata.type'] | Should -Match '^#microsoft\.graph\.unifiedRoleManagementPolicy\w+Rule$' }
        ($p.Body.id | Sort-Object) | Should -Be (@('Approval_EndUser_Assignment', 'Enablement_Admin_Assignment', 'Enablement_EndUser_Assignment', 'Expiration_Admin_Assignment', 'Expiration_Admin_Eligibility', 'Expiration_EndUser_Assignment'))
    }
    It 'sent as published, every PATCH fails: the policy ID is hard-coded from another tenant' {
        $fake = New-Fake
        foreach ($x in @($script:Reqs | Where-Object Method -EQ 'PATCH')) { { & $fake.Invoke 'PATCH' $x.Uri $x.Body } | Should -Throw '404 policy*' }
    }
    It 'with the policy ID from the read, all six apply, and Application Administrator still differs from Appendix B' {
        $fake = New-Fake
        $pid_ = (Get-FakePolicy $fake $script:AppAdmin).PolicyId
        foreach ($x in @($script:Reqs | Where-Object Method -EQ 'PATCH')) {
            $u = $x.Uri -replace 'DirectoryRole_[0-9a-f-]+_[0-9a-f-]+', $pid_
            & $fake.Invoke 'PATCH' $u $x.Body | Should -BeNullOrEmpty
        }
        $d = @(Compare-PaPimPolicy -Setting (Get-Setting 'Application Administrator') -Binding $script:Binding -Policy (Get-FakePolicy $fake $script:AppAdmin))
        ($d.RuleId | Sort-Object -Unique) | Should -Be @('Approval_EndUser_Assignment', 'AuthenticationContext_EndUser_Assignment', 'Enablement_EndUser_Assignment', 'Expiration_Admin_Assignment', 'Expiration_Admin_Eligibility', 'Expiration_EndUser_Assignment')
        ($d | Where-Object RuleId -EQ 'Expiration_EndUser_Assignment').Tenant | Should -Be '01:45:00'
    }
    It 'names a single user as an approver beside a group' {
        $a = ($script:Reqs | Where-Object { $_.Body -and $_.Body.id -eq 'Approval_EndUser_Assignment' }).Body
        $a.setting.approvalStages[0].primaryApprovers.'@odata.type' | Should -Contain '#microsoft.graph.singleUser'
    }
    It 'requires MFA on activation rather than an authentication context' {
        ($script:Reqs | Where-Object { $_.Body -and $_.Body.id -eq 'Enablement_EndUser_Assignment' }).Body.enabledRules | Should -Contain 'MultiFactorAuthentication'
    }
    It 'documents 204 No Content and RoleManagementPolicy.ReadWrite.Directory, the call list''s write permission' {
        $page = Get-Content $script:RulesPage -Raw
        $page | Should -Match '204 No Content'
        $page | Should -Match 'RoleManagementPolicy\.ReadWrite\.Directory'
        (Get-PaPimCall -Id pim-policy-rule-update).permissions | Should -Be @('RoleManagementPolicy.ReadWrite.Directory')
    }
}

Describe 'Chapter 04: "Assign privileged roles using PIM for Microsoft Entra roles APIs" (Learn), run as published' {
    BeforeAll {
        $script:Tut = @(Get-PimLearnRequest -Page $script:TutorialPage)
        $script:Assign = ($script:Tut | Where-Object { $_.Body -and $_.Body.action -eq 'AdminAssign' }).Body
    }
    It 'makes a role-assignable group eligible through roleEligibilityScheduleRequests: the model for eligibility' {
        $fake = New-Fake
        $r = & $fake.Invoke 'POST' 'https://graph.microsoft.com/v1.0/roleManagement/directory/roleEligibilityScheduleRequests' $script:Assign
        $r.status | Should -Be 'Provisioned'
        $script:Assign.roleDefinitionId | Should -Be $script:UserAdmin
    }
    It 'asks for a year of User Administrator eligibility; the program''s cap is 180 days, and the code refuses it before sending' {
        $s = $script:Assign.scheduleInfo
        $start = [datetime]::Parse($s.startDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
        $end = [datetime]::Parse($s.expiration.endDateTime, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
        { New-PaPimEligibilityRequest -Setting (Get-Setting 'User Administrator') -PrincipalId $script:Assign.principalId -Start $start -End $end } | Should -Throw '*exceeds the maximum of P180D*'
    }
    It 'once the role''s policy caps eligibility at 180 days, PIM (the fake) rejects the same request' {
        $fake = New-Fake { param($t) (($t.policyAssignments | Where-Object roleDefinitionId -EQ $script:UserAdmin).policy.rules | Where-Object id -EQ 'Expiration_Admin_Eligibility') | ForEach-Object { $_.isExpirationRequired = $true; $_.maximumDuration = 'P180D' } }
        { & $fake.Invoke 'POST' 'https://graph.microsoft.com/v1.0/roleManagement/directory/roleEligibilityScheduleRequests' $script:Assign } | Should -Throw '400 ExpirationRule*'
    }
    It 'asks for RoleManagement.ReadWrite.Directory and Group.ReadWrite.All, broader than the call needs' {
        $page = Get-Content $script:TutorialPage -Raw
        $page | Should -Match 'RoleManagement\.ReadWrite\.Directory'
        $page | Should -Match 'Group\.ReadWrite\.All'
        (Get-PaPimCall -Id pim-eligibility-request).permissions | Should -Be @('RoleEligibilitySchedule.ReadWrite.Directory')
    }
    It 'its clean-up deletes a group by the test user''s ID, not the group''s' {
        $del = ($script:Tut | Where-Object Method -EQ 'DELETE').Uri
        $user = ($script:Tut | Where-Object { $_.Body -and $_.Body.action -eq 'SelfActivate' }).Body.principalId
        $del | Should -BeLike "*/groups/$user"
        $del | Should -Not -BeLike "*/groups/$($script:Assign.principalId)"
    }
    It 'reads no existing eligibility before assigning, and sets no role settings' {
        @($script:Tut | Where-Object { $_.Method -eq 'GET' -and $_.Uri -match 'roleEligibilitySchedule' }).Count | Should -Be 0
        @($script:Tut | Where-Object { $_.Uri -match 'roleManagementPolicies' }).Count | Should -Be 0
    }
}

Describe 'Read-PaPimRoleSetting and the role files' {
    It 'reads one file per Appendix B role, with the tier Chapter 01''s tier map gives it' {
        $script:Settings.Count | Should -Be 22
        $map = (Get-PaTierMap).entra
        foreach ($s in $script:Settings) { $map[$s.roleTemplateId].tier | Should -Be $s.tier -Because $s.role }
    }
    It 'holds Appendix B''s values: Tier 0 four hours, approval by PIM-Approvers-T0, 90 days' {
        $ga = Get-Setting 'Global Administrator'
        $ga.activation.maximumDuration | Should -Be 'PT4H'
        $ga.approval.approvers | Should -Be @('PIM-Approvers-T0')
        $ga.assignment.eligibleMaximumDuration | Should -Be 'P90D'
        $ga.assignment.allowPermanentActive | Should -BeTrue
        (Get-Setting 'Global Reader').activation.requireTicket | Should -BeFalse
        (Get-Setting 'User Administrator').approval.required | Should -BeFalse
    }
    It 'passes every check with no Finding: only the activation gate Warn' {
        $f = @(Test-PaPimSetting -Settings $script:Settings -Binding $script:Binding -Tiers $script:Tiers)
        @($f | Where-Object Severity -EQ 'Finding').Count | Should -Be 0
        ($f.Rule | Sort-Object -Unique) | Should -Be 'PA-PIM-05'
    }
    It 'refuses a malformed file: <Case>' -ForEach @(
        @{ Case = 'missing key'; Edit = { param($j) $j.Remove('approval') }; Err = "*'approval' is required*" }
        @{ Case = 'name for an ID'; Edit = { param($j) $j.roleTemplateId = 'Global Administrator' }; Err = '*template ID*' }
        @{ Case = 'bad duration'; Edit = { param($j) $j.activation.maximumDuration = '4 hours' }; Err = '*ISO 8601*' }
        @{ Case = 'unknown tier'; Edit = { param($j) $j.tier = 'T9' }; Err = '*unknown tier*' }
    ) {
        $dir = Join-Path ([IO.Path]::GetTempPath()) "pa-pim-$([guid]::NewGuid().Guid.Substring(0, 8))"
        New-Item -ItemType Directory $dir | Out-Null
        try {
            $j = Get-Content (Join-Path $script:RolesPath 'global-administrator.json') -Raw | ConvertFrom-Json -AsHashtable
            & $Edit $j
            $j | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $dir 'x.json')
            { Read-PaPimRoleSetting -Path $dir } | Should -Throw $Err
        } finally { Remove-Item $dir -Recurse -Force }
    }
    It 'refuses two files for the same role' {
        $dir = Join-Path ([IO.Path]::GetTempPath()) "pa-pim-$([guid]::NewGuid().Guid.Substring(0, 8))"
        New-Item -ItemType Directory $dir | Out-Null
        try {
            Copy-Item (Join-Path $script:RolesPath 'global-reader.json') (Join-Path $dir 'a.json')
            Copy-Item (Join-Path $script:RolesPath 'global-reader.json') (Join-Path $dir 'b.json')
            { Read-PaPimRoleSetting -Path $dir } | Should -Throw '*also defined*'
        } finally { Remove-Item $dir -Recurse -Force }
    }
}

Describe 'ConvertTo-PaPimRule' {
    It 'writes the seven managed rules in Learn''s shapes, each with its @odata.type, caller and level' {
        $r = ConvertTo-PaPimRule -Setting (Get-Setting 'Exchange Administrator') -Binding $script:Binding
        @($r.Keys).Count | Should -Be 7
        $r['AuthenticationContext_EndUser_Assignment']['@odata.type'] | Should -Be '#microsoft.graph.unifiedRoleManagementPolicyAuthenticationContextRule'
        $r['AuthenticationContext_EndUser_Assignment'].claimValue | Should -Be 'c1'
        $r['Expiration_Admin_Eligibility'].target.caller | Should -Be 'Admin'
        $r['Expiration_Admin_Eligibility'].target.level | Should -Be 'Eligibility'
        $r['Enablement_EndUser_Assignment'].enabledRules | Should -Be @('Justification', 'Ticketing')
        $r['Approval_EndUser_Assignment'].setting.approvalStages[0].primaryApprovers[0].groupId | Should -Be $script:Binding.approverGroups['PIM-Approvers-T1']
    }
    It 'refuses an approver alias the bindings don''t name' {
        $s = Get-Setting 'Global Administrator'; $s.approval.approvers = @('PIM-Approvers-Nobody')
        { ConvertTo-PaPimRule -Setting $s -Binding $script:Binding } | Should -Throw '*has no group*'
    }
    It 'allows permanent active for Global Administrator only' {
        (ConvertTo-PaPimRule -Setting (Get-Setting 'Global Administrator') -Binding $script:Binding)['Expiration_Admin_Assignment'].isExpirationRequired | Should -BeFalse
        (ConvertTo-PaPimRule -Setting (Get-Setting 'Security Administrator') -Binding $script:Binding)['Expiration_Admin_Assignment'].isExpirationRequired | Should -BeTrue
    }
}

Describe 'Test-PaPimSetting' {
    It '<Rule>: <Case>' -ForEach @(
        @{ Rule = 'PA-PIM-01'; Case = 'approval required, no approver (the documented lockout)'; Role = 'Privileged Role Administrator'; Edit = { param($s) $s.approval.approvers = @() } }
        @{ Rule = 'PA-PIM-03'; Case = 'the approver group is the eligible group'; Role = 'Exchange Administrator'; Edit = { param($s) $script:Binding.approverGroups['PIM-Approvers-X'] = ($script:Binding.eligibility | Where-Object role -EQ 'Exchange Administrator').groupId; $s.approval.approvers = @('PIM-Approvers-X') } }
        @{ Rule = 'PA-PIM-04'; Case = 'activation over Learn''s 8 hours'; Role = 'Global Reader'; Edit = { param($s) $s.activation.maximumDuration = 'PT9H' } }
        @{ Rule = 'PA-PIM-04'; Case = 'Tier 0 activation over its 4-hour cap'; Role = 'Security Administrator'; Edit = { param($s) $s.activation.maximumDuration = 'PT8H' } }
        @{ Rule = 'PA-PIM-04'; Case = 'Tier 1 eligibility over 180 days'; Role = 'Teams Administrator'; Edit = { param($s) $s.assignment.eligibleMaximumDuration = 'P365D' } }
        @{ Rule = 'PA-PIM-04'; Case = 'permanent active on a role that isn''t Global Administrator'; Role = 'Intune Administrator'; Edit = { param($s) $s.assignment.allowPermanentActive = $true } }
        @{ Rule = 'PA-PIM-04'; Case = 'Tier 1 without approval'; Role = 'Intune Administrator'; Edit = { param($s) $s.approval.required = $false } }
    ) {
        $s = Get-Setting $Role
        & $Edit $s
        $f = @(Test-PaPimSetting -Settings @($s) -Binding $script:Binding -Tiers $script:Tiers)
        @($f | Where-Object { $_.Rule -eq $Rule -and $_.Severity -eq 'Finding' }).Count | Should -BeGreaterThan 0
        $script:Binding.approverGroups.Remove('PIM-Approvers-X')
    }
}

Describe 'The client' {
    It 'keeps each task''s permissions equal to the union of its calls: reads, then writes' {
        (Get-PaPimRequiredPermission -Task pim-plan).GraphPermissions | Should -Be @('RoleAssignmentSchedule.Read.Directory', 'RoleEligibilitySchedule.Read.Directory', 'RoleManagementPolicy.Read.Directory')
        (Get-PaPimRequiredPermission -Task pim-apply).Write | Should -Be @('RoleEligibilitySchedule.ReadWrite.Directory', 'RoleManagementPolicy.ReadWrite.Directory')
        (Get-PaPimRequiredPermission -Task pim-convert).Write | Should -Be @('RoleAssignmentSchedule.ReadWrite.Directory')
        foreach ($t in 'pim-plan', 'pim-apply', 'pim-convert') {
            (Get-PaPimRequiredPermission -Task $t).GraphPermissions | Should -Be @(Get-PaPimCall -Task $t | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        }
        foreach ($c in Get-PaPimCall) { $c.learn | Should -Match '^https://learn\.microsoft\.com/' }
    }
    It 'refuses a write without -AllowWrite, even for the apply task' {
        $fake = New-Fake
        $c = New-PaPimClient -Cloud gcc -Task pim-apply -Invoke $fake.Invoke
        { Invoke-PaPimRequest -Client $c -CallId pim-policy-rule-update -Bind @{ policyId = 'x'; ruleId = 'y' } -Body @{} } | Should -Throw '*dry run*'
        { New-PaPimClient -Cloud gcc -Task pim-plan -Invoke $fake.Invoke -AllowWrite } | Should -Throw '*only reads*'
        @($fake.Calls).Count | Should -Be 0
    }
    It 'refuses a call the task doesn''t declare, and an unknown cloud' {
        $c = New-PaPimClient -Cloud gcc -Task pim-convert -Invoke (New-Fake).Invoke -AllowWrite
        { Invoke-PaPimRequest -Client $c -CallId pim-policy-rule-update -Bind @{ policyId = 'x'; ruleId = 'y' } -Body @{} } | Should -Throw '*Undeclared call*'
        { New-PaPimClient -Cloud GCCHigh -Task pim-plan -Invoke {} } | Should -Throw '*Unknown cloud*'
    }
    It 'follows every page, and refuses a next link on another host' {
        $fake = New-Fake
        $c = New-PaPimClient -Cloud gcc -Task pim-plan -Invoke $fake.Invoke
        @(Invoke-PaPimRequest -Client $c -CallId pim-active-instances).Count | Should -Be 6
        @($fake.Calls).Count | Should -Be 3
        $evil = { param($m, $u, $b) @{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://graph.contoso.example/v1.0/next' } }
        $c2 = New-PaPimClient -Cloud gcc -Task pim-plan -Invoke $evil
        { Invoke-PaPimRequest -Client $c2 -CallId pim-active-instances } | Should -Throw '*Refusing to send the token*'
    }
    It 'uses the cloud''s own Graph host: graph.microsoft.us for GCC High' {
        $seen = [Collections.Generic.List[string]]::new()
        $c = New-PaPimClient -Cloud gcchigh -Task pim-plan -Invoke { param($m, $u, $b) $seen.Add($u); @{ value = @() } }.GetNewClosure()
        $null = Invoke-PaPimRequest -Client $c -CallId pim-eligibility-schedules
        $seen[0] | Should -BeLike 'https://graph.microsoft.us/v1.0/*'
    }
}

Describe 'New-PaPimPlan on the fixture' {
    BeforeAll { $script:Fake1 = New-Fake; $script:P1 = Get-Plan $script:Fake1 1 }
    It 'plans wave 1, the pilot class, with no Finding and sends nothing' {
        $script:P1.Roles.Count | Should -Be 9
        $script:P1.Blocked | Should -BeFalse
        @($script:Fake1.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        @($script:P1.Actions | Where-Object Kind -EQ 'PatchRule').Count | Should -Be 43
        @($script:P1.Actions | Where-Object Kind -EQ 'AssignEligibility').Count | Should -Be 8
    }
    It 'diffs only what differs: Exchange Administrator''s eligibility expiry is already right' {
        $ex = @($script:P1.Changes | Where-Object Role -EQ 'Exchange Administrator')
        $ex.RuleId | Should -Not -Contain 'Expiration_Admin_Eligibility'
        $ex.RuleId | Should -Not -Contain 'Expiration_EndUser_Assignment'
        $ex.RuleId | Should -Contain 'Approval_EndUser_Assignment'
    }
    It 'requests eligibility for each missing PRV group for the role''s maximum, not more' {
        $e = @($script:P1.Actions | Where-Object { $_.Kind -eq 'AssignEligibility' -and $_.Role -eq 'Exchange Administrator' })[0]
        $e.Body.principalId | Should -Be ($script:Binding.eligibility | Where-Object role -EQ 'Exchange Administrator').groupId
        $e.Body.scheduleInfo.expiration.duration | Should -Be 'P180D'
        @($script:P1.Actions | Where-Object { $_.Kind -eq 'AssignEligibility' -and $_.Role -eq 'Application Administrator' }).Count | Should -Be 0
    }
    It 'reports eligibility outside the PRV group (PA-PIM-08) and standing assignments (PA-PIM-09)' {
        (Rule $script:P1 'PA-PIM-08').Issue | Should -BeLike 'Dana Reyes*'
        @(Rule $script:P1 'PA-PIM-09' 'Warn').Count | Should -Be 3
        $rm = @($script:P1.Actions | Where-Object Kind -EQ 'RemoveStanding')
        $rm.Count | Should -Be 2
        # Carl's PRV group isn't eligible yet; Erin's is, but her activation isn't confirmed.
        ($rm | Where-Object { $_.Body.principalId -eq 'a4000000-0000-4000-8000-000000000003' }).Status | Should -Be 'WaitingForEligibility'
        ($rm | Where-Object { $_.Body.principalId -eq 'a4000000-0000-4000-8000-000000000005' }).Status | Should -Be 'WaitingForConfirmedActivation'
        $rm.Body.principalId | Should -Not -Contain '5e000000-0000-4000-8000-000000000001'
    }
    It 'blocks every change when the emergency accounts don''t hold permanent Global Administrator (PA-PIM-02)' {
        $f = New-Fake { param($t) ($t.roleAssignmentScheduleInstances | Where-Object id -EQ 'rasi-ea02-ga').endDateTime = '2026-12-31T00:00:00Z' }
        $p = Get-Plan $f 1
        @(Rule $p 'PA-PIM-02' 'Finding').Count | Should -Be 1
        $p.Blocked | Should -BeTrue
    }
    It 'refuses wave 2 until wave 1 matches its files (PA-PIM-07), then plans it' {
        $f = New-Fake
        $p2 = Get-Plan $f 2
        @(Rule $p2 'PA-PIM-07').Count | Should -Be 9
        $p2.Blocked | Should -BeTrue
        $null = Invoke-Wave $f 1
        $p2b = Get-Plan $f 2
        @(Rule $p2b 'PA-PIM-07').Count | Should -Be 0
        $p2b.Blocked | Should -BeFalse
        @(Rule $p2b 'PA-PIM-09' 'Info').Count | Should -Be 2
    }
}

Describe 'Invoke-PaPimPlan' {
    It 'refuses a read-only client, a blocked plan, the wrong task and a missing gate confirmation, before any write' {
        $f = New-Fake
        $plan = Get-Plan $f 1
        $ro = New-PaPimClient -Cloud gcc -Task pim-apply -Invoke $f.Invoke
        { Invoke-PaPimPlan -Plan $plan -Client $ro } | Should -Throw '*read-only*'
        $w = New-PaPimClient -Cloud gcc -Task pim-apply -Invoke $f.Invoke -AllowWrite
        { Invoke-PaPimPlan -Plan $plan -Client $w } | Should -Throw '*-ActivationGateChecked*'
        { Invoke-PaPimPlan -Plan $plan -Client $w -Kind Convert } | Should -Throw '*pim-convert client*'
        $blocked = Get-Plan $f 2
        { Invoke-PaPimPlan -Plan $blocked -Client $w -ActivationGateChecked } | Should -Throw '*blocked*'
        @($f.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'applies wave 1: rules first, then eligibility, and the tenant then matches every file' {
        $f = New-Fake
        $null = Invoke-Wave $f 1
        $w = @($f.Calls | Where-Object Method -NE 'GET')
        $w.Count | Should -Be 51
        $lastPatch = [array]::LastIndexOf(@($w.Method), 'PATCH'); $firstPost = [array]::IndexOf(@($w.Method), 'POST')
        $lastPatch | Should -BeLessThan $firstPost
        $again = Get-Plan $f 1
        @($again.Changes).Count | Should -Be 0
        @($again.Actions | Where-Object Kind -NE 'RemoveStanding').Count | Should -Be 0
    }
    It 'converts only a confirmed standing assignment, after its PRV group is eligible' {
        $f = New-Fake
        $null = Invoke-Wave $f 1
        $plan = Get-Plan $f 1
        $rm = @($plan.Actions | Where-Object Kind -EQ 'RemoveStanding')
        ($rm | Where-Object { $_.Body.principalId -eq 'a4000000-0000-4000-8000-000000000003' }).Status | Should -Be 'Confirmed'
        ($rm | Where-Object { $_.Body.principalId -eq 'a4000000-0000-4000-8000-000000000005' }).Status | Should -Be 'WaitingForConfirmedActivation'
        $c = New-PaPimClient -Cloud gcc -Task pim-convert -Invoke $f.Invoke -AllowWrite
        $sent = Invoke-PaPimPlan -Plan $plan -Client $c -Kind Convert
        @($sent).Count | Should -Be 1
        $sent[0].Body.action | Should -Be 'adminRemove'
        @($f.Tenant.roleAssignmentScheduleInstances | Where-Object id -EQ 'rasi-carl-exchange').Count | Should -Be 0
        @($f.Tenant.roleAssignmentScheduleInstances | Where-Object id -EQ 'rasi-erin-appadmin').Count | Should -Be 1
    }
}

Describe 'The back-out' {
    It 'puts every managed rule back as before.json recorded it, and removes the eligibility the run created' {
        $f = New-Fake
        $c = New-PaPimClient -Cloud gcc -Task pim-plan -Invoke $f.Invoke
        $wave = Get-PaPimWaveRole -Settings $script:Settings -Tiers $script:Tiers -Wave 1
        $st = Get-PaPimTenantState -Client $c -Settings $wave
        $before = @(Get-PaPimBefore -State $st -Roles $wave)
        $before.Count | Should -Be 9
        $original = @{}; foreach ($b in $before) { foreach ($r in $b.rules) { $original["$($b.roleTemplateId)/$($r.id)"] = (Get-PaPimRuleView -RuleId $r.id -Rule $r | ConvertTo-Json -Compress) } }
        $schedules = @($f.Tenant.roleEligibilitySchedules).Count
        $plan = Invoke-Wave $f 1
        @($f.Tenant.roleEligibilitySchedules).Count | Should -Be ($schedules + 8)
        $restore = New-PaPimRestorePlan -Before $before -AppliedActions $plan.Actions
        $w = New-PaPimClient -Cloud gcc -Task pim-apply -Invoke $f.Invoke -AllowWrite
        @(Invoke-PaPimPlan -Plan $restore -Client $w).Count | Should -Be (63 + 8)
        $now = Get-PaPimTenantState -Client $c -Settings $wave
        foreach ($s in $wave) { foreach ($id in @($now.Policies[$s.roleTemplateId].Rules.Keys)) {
                $k = "$($s.roleTemplateId)/$id"
                if ($original.ContainsKey($k)) { (Get-PaPimRuleView -RuleId $id -Rule $now.Policies[$s.roleTemplateId].Rules[$id] | ConvertTo-Json -Compress) | Should -Be $original[$k] -Because $k }
            } }
        @($f.Tenant.roleEligibilitySchedules).Count | Should -Be $schedules
    }
}

Describe 'Invoke-PaPimRoleSettings.ps1' {
    BeforeAll {
        $script:Out = Join-Path ([IO.Path]::GetTempPath()) "pa-pim-run-$([guid]::NewGuid().Guid.Substring(0, 8))"
        $script:RunArgs = @{
            Cloud = 'gcc'; Wave = 1; FixturePath = $script:Fixture; BindingsPath = (Join-Path $PSScriptRoot 'fixtures/ch04/inputs/pim-bindings.json')
            EmergencyConfigPath = (Join-Path $PSScriptRoot 'fixtures/inputs/emergency-access.json'); ExceptionsPath = (Join-Path $PSScriptRoot 'fixtures/inputs/exceptions.csv')
            ConfirmedPath = (Join-Path $PSScriptRoot 'fixtures/ch04/inputs/confirmed-activations.csv'); AsOf = '2026-10-30'
        }
        $script:Entry = Join-Path $script:Root 'Invoke-PaPimRoleSettings.ps1'
    }
    AfterAll { Remove-Item $script:Out -Recurse -Force -ErrorAction SilentlyContinue }
    It 'dry-runs by default: plan, diff, findings and a manifest of GETs only' {
        $a = $script:RunArgs
        $o = & $script:Entry @a -OutputPath $script:Out
        $o | Should -Contain 'Dry run: nothing was sent'
        $m = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'pim-plan'
        ($m.requests.method | Sort-Object -Unique) | Should -Be 'GET'
        @($m.files.PSObject.Properties.Name) | Should -Be @('before.json', 'diff.csv', 'findings.json', 'plan.json')
        @(Get-Content (Join-Path $script:Out 'before.json') -Raw | ConvertFrom-Json).Count | Should -Be 9
        $m.graphPermissions | Should -Not -Contain 'RoleManagementPolicy.ReadWrite.Directory'
    }
    It 'applies against the fake and reads back no difference from the role files' {
        $a = $script:RunArgs
        $o = & $script:Entry @a -OutputPath "$($script:Out)-apply" -Apply -ActivationGateChecked
        $o | Should -Contain 'Applied: 51 requests sent; 0 differences from the role files after reading back'
        $m = Get-Content (Join-Path "$($script:Out)-apply" 'manifest.json') -Raw | ConvertFrom-Json
        @($m.requests | Where-Object method -NE 'GET' | Where-Object { -not $_.bodySha256 }).Count | Should -Be 0
        Remove-Item "$($script:Out)-apply" -Recurse -Force
    }
    It 'needs an explicit cloud, and -Convert or -RestoreFrom only with -Apply' {
        $a = $script:RunArgs
        { & $script:Entry @a -OutputPath $script:Out -RestoreFrom $script:Out } | Should -Throw '*-RestoreFrom*-Apply*'
        (Get-Command $script:Entry).Parameters['Cloud'].Attributes.Where({ $_ -is [System.Management.Automation.ParameterAttribute] }).Mandatory | Should -BeTrue
        $a = $script:RunArgs
        { & $script:Entry @a -OutputPath $script:Out -Convert } | Should -Throw '*-Convert*-Apply*'
    }
}
