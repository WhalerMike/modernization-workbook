#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 05: PIM for Groups and the PRV groups. The first block runs Microsoft's own request
# samples, pinned in examples/third_party/graph-pim-for-groups-pages, unmodified against the fake;
# each test pins one row of the chapter's gap table. The second block tests the PimGroups module
# against the fictional tenant contoso.example.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PimGroups/PimGroups.psm1') -Force
    . (Join-Path $PSScriptRoot 'PimForGroupsSampleHarness.ps1')
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/ch05/tenant.json'
    $script:DesiredPath = Join-Path $PSScriptRoot 'fixtures/ch05/inputs/prv-groups.json'
    $script:AsOf = [datetime]'2026-10-30T00:00:00Z'
    $script:Policy = Get-PaPgPolicySetting
    $script:Entry = Join-Path $PSScriptRoot '../Invoke-PaPimGroups.ps1'

    function Get-Run([scriptblock]$Change, [scriptblock]$ChangeConfig, [string]$Cloud = 'gcc', [int]$PageSize = 2) {
        $fake = New-PaPgFixtureInvoker -Path $script:Fixture -Cloud $Cloud -PageSize $PageSize -Now $script:AsOf
        if ($Change) { & $Change $fake.Tenant }
        $cfg = Read-PaPrvGroupConfig -Path $script:DesiredPath
        if ($ChangeConfig) { & $ChangeConfig $cfg }
        $client = New-PaPgClient -Cloud $Cloud -Task 'pim-groups-read' -Invoke $fake.Invoke
        $state = Get-PaPgTenantState -Client $client -Config $cfg
        [pscustomobject]@{
            Fake = $fake; Config = $cfg; Client = $client; State = $state
            Findings = @(Test-PaPgTenant -State $state -Config $cfg -PolicySetting $script:Policy)
            ConfigFindings = @(Test-PaPrvGroupConfig -Config $cfg -PolicySetting $script:Policy -AsOf $script:AsOf)
            Plan = New-PaPimGroupPlan -State $state -Config $cfg -PolicySetting $script:Policy -Cloud $Cloud -AsOf $script:AsOf
        }
    }
    function New-Writer($Cloud = 'gcc') {
        $fake = New-PaPgFixtureInvoker -Path $script:Fixture -Cloud $Cloud -Now $script:AsOf
        [pscustomobject]@{ Fake = $fake; Client = (New-PaPgClient -Cloud $Cloud -Task 'pim-groups-apply' -Invoke $fake.Invoke) }
    }
}

Describe 'Chapter 05: Learn''s PIM for Groups request samples, as published' {
    BeforeAll {
        $script:Elig = @(Get-PgLearnRequest -Page eligibility)
        $script:Asg = @(Get-PgLearnRequest -Page assignment)
        $script:Rules = @(Get-PgLearnRequest -Page rules)
    }
    It 'gives an adminAssign eligibility request whose fields the plan''s requests keep' {
        $script:Elig.Count | Should -Be 2
        $ours = (Get-Run).Plan.Operations | Where-Object Op -EQ 'assignment-adminAssign' | Select-Object -First 1
        foreach ($k in $script:Elig[0].Body.Keys) { $ours.Body.Contains($k) | Should -BeTrue -Because "Learn's request has $k" }
    }
    It 'titles Example 1 an ownership request but sends accessId member' {
        $script:Elig[0].Title | Should -Match 'ownership'
        $script:Elig[0].Body.accessId | Should -Be 'member'
    }
    It 'says the eligibility expires after two hours but sets an end about a day after its start' {
        $s = $script:Elig[0].Body.scheduleInfo
        ([datetime]$s.expiration.endDateTime - [datetime]$s.startDateTime).TotalHours | Should -BeGreaterThan 24
    }
    It 'fails today as published: its 2023 schedule has ended, so the fake refuses it' {
        (Invoke-PgLearnRequest -Request $script:Elig[0] -Fixture $script:Fixture -Policy).Status | Should -Match 'ended'
        (Invoke-PgLearnRequest -Request $script:Asg[0] -Fixture $script:Fixture -Policy).Status | Should -Match 'ended'
    }
    It 'sends action AdminAssign, not the documented adminAssign, and no ticketInfo' {
        $script:Elig[0].Body.action | Should -BeExactly 'AdminAssign'
        $script:Elig[0].Body.ContainsKey('ticketInfo') | Should -BeFalse
        $ours = (Get-Run).Plan.Operations | Where-Object Op -Like '*-adminAssign' | Select-Object -First 1
        $ours.Body.action | Should -BeExactly 'adminAssign'
        $ours.Body.ticketInfo.ticketNumber | Should -Be 'CHG-1005'
    }
    It 'reads nothing before it writes: neither request page holds a GET' {
        @($script:Elig + $script:Asg | Where-Object Method -EQ 'GET').Count | Should -Be 0
    }
    It 'hard-codes graph.microsoft.com, which the GCC High fake refuses' {
        foreach ($r in $script:Elig + $script:Asg + $script:Rules) { $r.Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/*' }
        (Invoke-PgLearnRequest -Request $script:Elig[0] -Fixture $script:Fixture -Cloud gcchigh).Status | Should -Match 'refuses host'
    }
    It 'includes a selfActivate request, which the plan''s guard refuses' {
        $script:Asg[1].Body.action | Should -Be 'selfActivate'
        $r = Get-Run
        $op = $r.Plan.Operations | Where-Object Op -Like '*-adminAssign' | Select-Object -First 1
        $op.Body.action = 'selfActivate'
        (Test-PaPgPlanGuard -Plan $r.Plan -Config $r.Config) -join ';' | Should -Match 'PA-PG-G7'
    }
    It 'updates rules only on DirectoryRole policies, and says PIM for Groups is beta only' {
        foreach ($r in $script:Rules) { $r.Uri | Should -Match '/roleManagementPolicies/DirectoryRole_' }
        Get-PgLearnPageText 'how-to-pim-update-rules.md' | Should -Match 'PIM for groups APIs are currently available on the `beta` endpoint only'
        $plan = (Get-Run).Plan
        foreach ($o in $plan.Operations | Where-Object Op -EQ 'policy-rule') { $o.Uri | Should -Match '^https://graph\.microsoft\.com/v1\.0/policies/roleManagementPolicies/Group_' }
    }
    It 'gives rule bodies whose shape the module keeps, and an approver that is a single user' {
        $ours = New-PaPgRuleSet -Setting $script:Policy.member.T0 -ApproverGroupId '5a000000-0000-4000-8000-0000000000a0'
        foreach ($l in $script:Rules) {
            $o = $ours | Where-Object { $_.id -eq $l.Body.id }
            if ($o) { (@($o.Keys) | Sort-Object) | Should -Be (@($l.Body.Keys) | Sort-Object) -Because $l.Body.id }
        }
        $approval = $script:Rules | Where-Object { $_.Body.id -eq 'Approval_EndUser_Assignment' }
        $approval.Body.setting.approvalStages[0].primaryApprovers.'@odata.type' | Should -Contain '#microsoft.graph.singleUser'
        ($ours | Where-Object id -EQ 'Approval_EndUser_Assignment').setting.approvalStages[0].primaryApprovers.'@odata.type' | Should -Be @('#microsoft.graph.groupMembers')
    }
}

Describe 'Chapter 05: PimGroups' {
    Context 'calls and permissions' {
        It 'declares every call with a least-privileged permission and a Learn page; reads are GET only' {
            foreach ($c in Get-PaPgCall) {
                $c.permissions.Count | Should -BeGreaterThan 0
                $c.learn | Should -BeLike 'https://learn.microsoft.com/*'
                if ($c.tasks -contains 'pim-groups-read') { $c.method | Should -Be 'GET' }
            }
        }
        It 'keeps each task''s permissions equal to the union of its calls' {
            foreach ($t in 'pim-groups-read', 'pim-groups-apply') {
                $union = @(Get-PaPgCall -Task $t | ForEach-Object { $_.permissions } | Sort-Object -Unique)
                (Get-PaPgRequiredPermission -Task $t).GraphPermissions | Should -Be $union
            }
            (Get-PaPgRequiredPermission -Task 'pim-groups-read').GraphPermissions | Should -Not -Match 'ReadWrite'
        }
        It 'refuses an undeclared call, an unknown cloud and a path value that isn''t an ID' {
            $c = New-PaPgClient -Cloud gcc -Task 'pim-groups-read' -Invoke { }
            { Invoke-PaPgList -Client $c -CallId 'group-members' } | Should -Throw '*Undeclared*'
            { New-PaPgClient -Cloud GCCHigh -Task 'pim-groups-read' -Invoke { } } | Should -Throw '*Unknown cloud*'
            $w = New-PaPgClient -Cloud gcc -Task 'pim-groups-apply' -Invoke { }
            { New-PaPimGroupPlan -State ([pscustomobject]@{ Groups = @{ x = [pscustomobject]@{ Group = @{ id = 'a/b' }; Eligibility = @(); Assignment = @(); Policies = @(@{ roleDefinitionId = 'member'; policyId = '../x'; policy = @{ rules = @() } }) } } }) -Config @{ approverGroups = @{ T0 = '5a000000-0000-4000-8000-0000000000a0' }; groups = @(@{ displayName = 'x'; id = 'a'; tier = 'T0'; holds = 'other'; member = @{ active = @(); eligible = @() }; owner = @{ active = @(); eligible = @() } }) } -PolicySetting $script:Policy -Cloud gcc } | Should -Throw '*only IDs*'
        }
        It 'refuses a next link to another host' {
            $c = New-PaPgClient -Cloud gcc -Task 'pim-groups-read' -Invoke { param($m, $u) @{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://graph.example/v1.0/groups?$skiptoken=2' } }
            { Invoke-PaPgList -Client $c -CallId 'groups-list' -Query '$filter=isAssignableToRole eq true' } | Should -Throw '*Refusing to send the token*'
        }
    }

    Context 'the desired state' {
        It 'reads the fixture file and finds nothing wrong in it' {
            (Get-Run).ConfigFindings.Count | Should -Be 0
        }
        It 'refuses a name where an object ID belongs, and an unknown tier' {
            $tmp = Join-Path $TestDrive 'bad.json'
            '{"groups":[{"displayName":"PRV-T0-X","tier":"T0","holds":"entraRole","member":{"active":[{"principalId":"ada@contoso.example"}]}}]}' | Set-Content $tmp
            { Read-PaPrvGroupConfig $tmp } | Should -Throw "*isn't an object ID*"
            '{"groups":[{"displayName":"PRV-T9-X","tier":"T9","holds":"entraRole"}]}' | Set-Content $tmp
            { Read-PaPrvGroupConfig $tmp } | Should -Throw '*tier*'
        }
        It 'flags a name without the tier, or with the wrong tier (PA-PG-01)' {
            $r = Get-Run -ChangeConfig { param($c) $c.groups[0].displayName = 'PRV-T1-PrivRoleAdmin'; $c.groups[1].displayName = 'ExchangeAdmins' }
            @($r.ConfigFindings | Where-Object Rule -EQ 'PA-PG-01').Count | Should -Be 2
        }
        It 'flags a group or an eligible service principal as a holder, and a permanent entry (PA-PG-05, PA-PG-06)' {
            $r = Get-Run -ChangeConfig { param($c)
                $c.groups[2].member.eligible += @{ principalId = '5a000000-0000-4000-8000-000000000005'; principalName = 'Helpdesk-Admins-Legacy'; principalType = 'group'; endDateTime = '2027-01-01T00:00:00Z'; ticket = 'CHG-1' }
                $c.groups[2].member.eligible += @{ principalId = '0c000000-0000-4000-8000-000000000001'; principalName = 'sp-deploy'; principalType = 'servicePrincipal'; endDateTime = '2027-01-01T00:00:00Z'; ticket = 'CHG-2' }
                $c.groups[3].member.active[0].endDateTime = $null }
            @($r.ConfigFindings | Where-Object Rule -EQ 'PA-PG-05').Count | Should -Be 2
            @($r.ConfigFindings | Where-Object { $_.Rule -eq 'PA-PG-06' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
        }
        It 'flags any owner of a T0 group, and eligible owners with no active owner (PA-PG-07)' {
            $r = Get-Run -ChangeConfig { param($c) $c.groups[0].owner.eligible = @(@{ principalId = '0b000000-0000-4000-8000-000000000003'; principalName = 'cara'; principalType = 'user'; endDateTime = '2027-01-01T00:00:00Z'; ticket = 'CHG-9' }) }
            @($r.ConfigFindings | Where-Object Rule -EQ 'PA-PG-07').Count | Should -Be 2
        }
        It 'flags a policy setting over eight hours, a missing approver group, and self-approval (PA-PG-08)' {
            $pol = Get-PaPgPolicySetting; $pol.member.T1.activationMaxDuration = 'PT10H'
            $cfg = Read-PaPrvGroupConfig $script:DesiredPath
            $cfg.approverGroups.Remove('T2'); $cfg.approverGroups.T0 = $cfg.groups[0].id
            $f = @(Test-PaPrvGroupConfig -Config $cfg -PolicySetting $pol -AsOf $script:AsOf | Where-Object Rule -EQ 'PA-PG-08')
            ($f.Issue -join ';') | Should -Match 'PT10H'
            ($f.Issue -join ';') | Should -Match 'no approver group is set for T2'
            ($f.Issue -join ';') | Should -Match 'approves its own'
        }
    }

    Context 'the tenant' {
        It 'reads every page of every collection, with page sizes of 1, 2 and 50' {
            foreach ($n in 1, 2, 50) {
                $r = Get-Run -PageSize $n
                @($r.State.RoleAssignable).Count | Should -Be 5
                @($r.State.Groups['PRV-T0-PrivRoleAdmin'].Policies).Count | Should -Be 2
                @($r.State.Groups['PRV-T1-AzureOwner-SubWorkload'].Eligibility).Count | Should -Be 2
            }
        }
        It 'sends only declared GETs, each filtered as Learn requires' {
            $r = Get-Run
            foreach ($c in $r.Fake.Calls) { $c.Method | Should -Be 'GET' }
            foreach ($c in $r.Fake.Calls | Where-Object Uri -Like '*privilegedAccess*') { [Uri]::UnescapeDataString($c.Uri) | Should -Match "groupId eq '" }
            foreach ($c in $r.Fake.Calls | Where-Object Uri -Like '*roleManagementPolicyAssignments*') { [Uri]::UnescapeDataString($c.Uri) | Should -Match "scopeType eq 'Group'" }
        }
        It 'reports the fixture''s findings: 9 Finding, 3 Warn' {
            $f = (Get-Run).Findings
            @($f | Where-Object Severity -EQ 'Finding').Count | Should -Be 9
            @($f | Where-Object Severity -EQ 'Warn').Count | Should -Be 3
        }
        It 'flags a group that holds an Entra role but isn''t role-assignable, and warns for one that doesn''t (PA-PG-02)' {
            $r = Get-Run -Change { param($t) ($t.groups | Where-Object id -EQ '5a000000-0000-4000-8000-000000000002').isAssignableToRole = $false }
            ($r.Findings | Where-Object { $_.Rule -eq 'PA-PG-02' -and $_.Object -eq 'PRV-T1-ExchangeAdmin' }).Severity | Should -Be 'Finding'
            ($r.Findings | Where-Object { $_.Rule -eq 'PA-PG-02' -and $_.Object -eq 'PRV-T1-AzureOwner-SubWorkload' }).Severity | Should -Be 'Warn'
        }
        It 'flags a dynamic or synchronized group (PA-PG-03)' {
            $r = Get-Run -Change { param($t) ($t.groups | Where-Object id -EQ '5a000000-0000-4000-8000-000000000004').groupTypes = @('DynamicMembership') }
            ($r.Findings | Where-Object Rule -EQ 'PA-PG-03').Object | Should -Be 'PRV-T2-HelpdeskAdmin-AU-Finance'
        }
        It 'warns near and flags at Learn''s 500 role-assignable groups (PA-PG-04)' {
            $r = Get-Run
            @(Test-PaPgTenant -State $r.State -Config $r.Config -PolicySetting $script:Policy -RoleAssignableWarnAt 5 | Where-Object Rule -EQ 'PA-PG-04').Severity | Should -Be 'Warn'
            $r.State.RoleAssignable = @(1..500 | ForEach-Object { @{ id = "x$_"; displayName = "g$_" } })
            (@(Test-PaPgTenant -State $r.State -Config $r.Config -PolicySetting $script:Policy) | Where-Object Rule -EQ 'PA-PG-04').Severity | Should -Be 'Finding'
        }
        It 'leaves activations out of the standing state' {
            $r = Get-Run
            ($r.Plan.Operations | Where-Object { $_.Group -eq 'PRV-T1-AzureOwner-SubWorkload' -and $_.Op -like 'assignment-*' }) | Should -BeNullOrEmpty
        }
        It 'flags an eligible owner with no active owner, and a group nested as an eligible member (PA-PG-07, PA-PG-05)' {
            $f = (Get-Run).Findings
            ($f | Where-Object Rule -EQ 'PA-PG-07').Object | Should -Be 'PRV-T0-PrivRoleAdmin'
            ($f | Where-Object Rule -EQ 'PA-PG-05').Issue | Should -Match 'Helpdesk-Admins-Legacy is a group'
        }
        It 'flags policy drift as a Finding on T0 and T1 (PA-PG-08)' {
            $f = @((Get-Run).Findings | Where-Object Rule -EQ 'PA-PG-08')
            $f.Count | Should -Be 3
            ($f | Where-Object Issue -Match 'Approval_EndUser_Assignment').Severity | Should -Be 'Finding'
        }
    }

    Context 'the plan, the guards and -Apply' {
        It 'plans 8 changes in order: policy rules, then grants and updates, then removals' {
            $ops = (Get-Run).Plan.Operations
            $ops.Count | Should -Be 8
            ($ops.Op -join ',') | Should -Be 'policy-rule,policy-rule,policy-rule,assignment-adminUpdate,assignment-adminAssign,assignment-adminRemove,eligibility-adminRemove,eligibility-adminRemove'
            foreach ($o in $ops) { $o.Permissions.Count | Should -BeGreaterThan 0; $o.Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/*' }
        }
        It 'plans nothing once the tenant matches the desired state' {
            $w = New-Writer
            $r = Get-Run
            $null = Invoke-PaPgPlan -Plan $r.Plan -Config $r.Config -Client $w.Client -Apply
            # Bring the fixture to the desired state in memory, then plan again.
            $r2 = Get-Run -Change { param($t)
                $t.eligibilitySchedules = @($t.eligibilitySchedules | Where-Object { $_.principalId -eq '0b000000-0000-4000-8000-000000000003' -and $_.accessId -eq 'member' })
                $t.assignmentSchedules = @($t.assignmentSchedules | Where-Object { $_.principalId -ne '0b000000-0000-4000-8000-000000000002' })
                ($t.assignmentSchedules | Where-Object principalId -EQ '0b000000-0000-4000-8000-000000000005').scheduleInfo.expiration.endDateTime = '2027-04-28T00:00:00Z'
                $b = $t.assignmentSchedules[0] | ConvertTo-Json -Depth 10 | ConvertFrom-Json -AsHashtable
                $b.groupId = '5a000000-0000-4000-8000-000000000002'; $b.principalId = '0b000000-0000-4000-8000-000000000002'; $b.scheduleInfo.expiration.endDateTime = '2027-04-28T00:00:00Z'
                $t.assignmentSchedules += $b
                foreach ($pa in $t.policyAssignments) {
                    foreach ($rule in $pa.policy.rules) {
                        if ($rule.id -eq 'Approval_EndUser_Assignment' -and $pa.scopeId -like '*0001' -and $pa.roleDefinitionId -eq 'member') { $rule.setting.isApprovalRequired = $true }
                        if ($rule.id -eq 'Expiration_EndUser_Assignment' -and $pa.scopeId -like '*0001' -and $pa.roleDefinitionId -eq 'member') { $rule.maximumDuration = 'PT4H' }
                        if ($rule.id -eq 'Expiration_Admin_Eligibility') { $rule.isExpirationRequired = $true }
                    }
                }
            }
            $r2.Plan.Operations.Count | Should -Be 0
        }
        It 'plans a role-assignable group for an entry with no ID' {
            $r = Get-Run -ChangeConfig { param($c) $c.groups += @{ displayName = 'PRV-T1-SharePointAdmin'; id = $null; tier = 'T1'; holds = 'entraRole'; member = @{ active = @(); eligible = @() }; owner = @{ active = @(); eligible = @() } } }
            $op = $r.Plan.Operations | Where-Object Op -EQ 'group-create'
            $op.Body.isAssignableToRole | Should -BeTrue
            $op.Body.securityEnabled | Should -BeTrue
            $op.Permissions | Should -Contain 'RoleManagement.ReadWrite.Directory'
        }
        It 'is a dry run by default: nothing is sent' {
            $w = New-Writer; $r = Get-Run
            $run = Invoke-PaPgPlan -Plan $r.Plan -Config $r.Config -Client $w.Client
            $run.Applied | Should -BeFalse
            @($run.Results | Where-Object Status -NE 'DryRun').Count | Should -Be 0
            $w.Fake.Calls.Count | Should -Be 0
        }
        It 'sends every operation with -Apply, through declared writes only, and the fake accepts each' {
            $w = New-Writer; $r = Get-Run
            $run = Invoke-PaPgPlan -Plan $r.Plan -Config $r.Config -Client $w.Client -Apply
            @($run.Results | Where-Object Status -EQ 'Sent').Count | Should -Be 8
            $w.Fake.Writes.Count | Should -Be 8
            ($w.Fake.Writes.Method | Sort-Object -Unique) -join ',' | Should -Be 'PATCH,POST'
        }
        It 'refuses -Apply with a read client, or a plan for another cloud' {
            $r = Get-Run
            { Invoke-PaPgPlan -Plan $r.Plan -Config $r.Config -Client $r.Client -Apply } | Should -Throw '*pim-groups-apply*'
            { Invoke-PaPgPlan -Plan $r.Plan -Config $r.Config -Client (New-Writer gcchigh).Client -Apply } | Should -Throw "*for 'gcc'*"
        }
        It 'refuses a plan that drops approval on a T0 policy (G1) or allows permanent grants (G2)' {
            $pol = Get-PaPgPolicySetting; $pol.member.T0.approvalRequired = $false
            $r = Get-Run
            $plan = New-PaPimGroupPlan -State $r.State -Config $r.Config -PolicySetting $pol -Cloud gcc -AsOf $script:AsOf
            $rule = ($r.State.Groups['PRV-T0-PrivRoleAdmin'].Policies | Where-Object roleDefinitionId -EQ 'member').policy.rules | Where-Object id -EQ 'Approval_EndUser_Assignment'
            $rule.setting.isApprovalRequired = $true
            $plan = New-PaPimGroupPlan -State $r.State -Config $r.Config -PolicySetting $pol -Cloud gcc -AsOf $script:AsOf
            (Test-PaPgPlanGuard -Plan $plan -Config $r.Config) -join ';' | Should -Match 'PA-PG-G1'
            $r2 = Get-Run -ChangeConfig { param($c) $c.groups[1].member.active[1].endDateTime = $null }
            $g = (Test-PaPgPlanGuard -Plan $r2.Plan -Config $r2.Config) -join ';'
            $g | Should -Match 'PA-PG-G2'
            { Invoke-PaPgPlan -Plan $r2.Plan -Config $r2.Config -Client (New-Writer).Client -Apply } | Should -Throw '*Refusing to apply*'
        }
        It 'refuses eligible owners with no active owner (G4), a group as a holder (G5), and too many removals (G6)' {
            $r = Get-Run -ChangeConfig { param($c)
                $c.groups[2].owner.eligible = @(@{ principalId = '0b000000-0000-4000-8000-000000000003'; principalName = 'cara'; principalType = 'user'; endDateTime = '2027-01-01T00:00:00Z'; ticket = 'CHG-9' })
                $c.groups[2].member.eligible += @{ principalId = '5a000000-0000-4000-8000-000000000005'; principalName = 'legacy'; principalType = 'group'; endDateTime = '2027-01-01T00:00:00Z'; ticket = 'CHG-8' } }
            $g = (Test-PaPgPlanGuard -Plan $r.Plan -Config $r.Config -MaxRemovals 1) -join ';'
            $g | Should -Match 'PA-PG-G4'
            $g | Should -Match 'PA-PG-G5'
            $g | Should -Match 'PA-PG-G6'
        }
        It 'stops at the first request the fake refuses' {
            $w = New-Writer; $r = Get-Run
            ($r.Plan.Operations | Where-Object Op -EQ 'assignment-adminAssign').Body.scheduleInfo.expiration.endDateTime = '2026-01-01T00:00:00Z'
            $run = Invoke-PaPgPlan -Plan $r.Plan -Config $r.Config -Client $w.Client -Apply
            ($run.Results | Select-Object -Last 1).Status | Should -Match 'Failed'
            @($run.Results).Count | Should -Be 5
        }
    }

    Context 'the entry script' {
        It 'writes findings, plan, diff and a manifest whose hashes match, in a dry run' {
            $out = Join-Path $TestDrive 'pg'
            $text = & $script:Entry -Cloud gcc -FixturePath $script:Fixture -DesiredPath $script:DesiredPath -AsOf $script:AsOf -OutputPath $out
            $text[0] | Should -Be 'PIM for Groups: 9 Finding, 3 Warn, 0 Info'
            $text | Should -Contain 'Dry run: nothing sent. Review diff.txt and plan.json, then rerun with -Apply'
            $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
            $m.task | Should -Be 'pim-groups-read'
            foreach ($p in $m.files.PSObject.Properties) { (Get-FileHash (Join-Path $out $p.Name) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $p.Value }
            @($m.requests | Where-Object method -NE 'GET').Count | Should -Be 0
        }
        It 'has no default cloud' {
            (Get-Command $script:Entry).Parameters['Cloud'].Attributes.Where({ $_ -is [System.Management.Automation.ParameterAttribute] }).Mandatory | Should -BeTrue
        }
    }
}
