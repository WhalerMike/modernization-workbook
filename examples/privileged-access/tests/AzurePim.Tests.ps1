#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 06: PIM for Azure resources. Microsoft's pinned REST examples replayed through the code,
# then the read, the desired state, the plan, the dry run and the apply against the fictional
# estate served by the fake. No module, tenant or network is needed.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PaAzurePim/PaAzurePim.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Estate = Join-Path $PSScriptRoot 'fixtures/ch06/estate.json'
    $script:DesiredPath = Join-Path $PSScriptRoot 'fixtures/ch06/desired.json'
    $script:Examples = Join-Path $PSScriptRoot '../../third_party/azure-pim-rest-examples/examples'
    $script:Caller = 'c3000000-0000-4000-8000-000000000003'
    $script:MG = '/providers/Microsoft.Management/managementGroups/contoso-root'
    $script:WL = '/subscriptions/11111111-1111-4111-8111-111111111111'
    $script:CP = '/subscriptions/22222222-2222-4222-8222-222222222222'
    $script:RG = "$script:WL/resourceGroups/rg-payroll"
    $script:Owner = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635'
    $script:Contributor = 'b24988ac-6180-42a0-ab88-20f7382dd24c'
    $script:UAA = '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9'

    function Get-Example([string]$Name) { Get-Content -LiteralPath (Join-Path $script:Examples "$Name.json") -Raw | ConvertFrom-Json -AsHashtable -Depth 50 }
    function New-Run([int]$PageSize = 2, [string]$DesiredPath = $script:DesiredPath, [string]$Task = 'azure-pim-apply', [string]$RunId = 'test') {
        $d = Read-PaAzDesiredState -Path $DesiredPath
        $map = Get-PaAzTierMap -Desired $d
        $fake = New-PaAzFixtureInvoker -Path $script:Estate -PageSize $PageSize
        $client = New-PaAzClient -Cloud gcc -Task $Task -Invoke $fake.Invoke
        $state = Get-PaAzPimState -Client $client -Scope $d.scopes -RoleId $d.governedRoles -TierMap $map
        $plan = New-PaAzPlan -State $state -Desired $d -CallerPrincipalId $script:Caller -RunId $RunId -TierMap $map
        [pscustomobject]@{ Desired = $d; Map = $map; Fake = $fake; Client = $client; State = $state; Plan = $plan }
    }
    function Save-Desired([scriptblock]$Change) {
        $d = Get-Content -LiteralPath $script:DesiredPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
        & $Change $d
        $p = Join-Path ([IO.Path]::GetTempPath()) ("pa-ch06-{0}.json" -f [guid]::NewGuid())
        [IO.File]::WriteAllText($p, (ConvertTo-Json $d -Depth 30))
        $p
    }
    # A fake that answers each call with the body of Microsoft's pinned example for that operation.
    function New-ExampleInvoker {
        $bodies = @{
            roleEligibilitySchedules = (Get-Example 'GetRoleEligibilitySchedulesByScope').responses['200'].body
            roleAssignmentSchedules  = (Get-Example 'GetRoleAssignmentSchedulesByScope').responses['200'].body
            roleManagementPolicies   = (Get-Example 'GetRoleManagementPolicyByScope').responses['200'].body
        }
        { param($Method, $Uri, $Body) if ($Uri -match '/providers/Microsoft\.Authorization/(\w+)\?') { $bodies[$Matches[1]] } else { throw "no example for $Uri" } }.GetNewClosure()
    }
    $script:Run = New-Run
}

Describe 'Chapter 06 calls and roles' {
    It 'declares every call on API version 2020-10-01 under {scope}/providers/Microsoft.Authorization, with a role and a Learn page' {
        $all = Get-PaAzCall
        foreach ($c in $all) {
            $c.apiVersion | Should -Be '2020-10-01'
            $c.path | Should -BeLike '{scope}/providers/Microsoft.Authorization/*'
            $c.azureRole | Should -Not -BeNullOrEmpty
            $c.learn | Should -BeLike 'https://learn.microsoft.com/*'
        }
    }
    It 'the read task is GET only and needs Reader' {
        $read = Get-PaAzCall -Task azure-pim-read
        @($read | Where-Object method -NE 'GET').Count | Should -Be 0
        $read.Count | Should -Be 3
        (Get-PaAzRequiredRole -Task azure-pim-read).AzureRoles | Should -Be @('Reader')
    }
    It 'the apply task adds two PUTs and a PATCH, and needs User Access Administrator, not Owner' {
        $r = Get-PaAzRequiredRole -Task azure-pim-apply
        $r.AzureRoles | Should -Be @('Reader', 'User Access Administrator')
        $r.Writes | Should -Be @('PUT azpim-eligibility-request', 'PUT azpim-assignment-request', 'PATCH azpim-policy-update')
    }
    It 'a GCC client uses commercial Resource Manager; GCC High and DoD use Azure Government' {
        (New-PaAzClient -Cloud gcc -Task azure-pim-read -Invoke {}).Cloud.Arm | Should -Be 'https://management.azure.com'
        (New-PaAzClient -Cloud gcchigh -Task azure-pim-read -Invoke {}).Cloud.Arm | Should -Be 'https://management.usgovcloudapi.net'
        { New-PaAzClient -Cloud 'GCCHigh' -Task azure-pim-read -Invoke {} } | Should -Throw '*Unknown cloud*'
    }
    It 'a read client refuses a write, and the paged reader refuses a write call' {
        $read = New-PaAzClient -Cloud gcc -Task azure-pim-read -Invoke {}
        { Invoke-PaAzWrite -Client $read -CallId azpim-eligibility-request -Bind @{ scope = $script:WL; name = [guid]::NewGuid() } -Body @{} -Apply } | Should -Throw "*Undeclared call 'azpim-eligibility-request'*"
        { Invoke-PaList -Reader $script:Run.Client -CallId azpim-policy-update -Bind @{ scope = $script:WL; name = 'x' } } | Should -Throw '*Refusing PATCH*'
    }
    It 'refuses a request name that is not a GUID, and the fake refuses another host' {
        { Invoke-PaAzWrite -Client $script:Run.Client -CallId azpim-eligibility-request -Bind @{ scope = $script:WL; name = 'my-request' } -Body @{} } | Should -Throw '*isn''t a GUID*'
        { & $script:Run.Fake.Invoke 'GET' 'https://management.usgovcloudapi.net/subscriptions/x/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version=2020-10-01' $null } | Should -Throw '*refuses host*'
    }
}

Describe "Microsoft's examples, replayed (the gap table)" {
    BeforeAll {
        $script:ExClient = New-PaAzClient -Cloud gcc -Task azure-pim-read -Invoke (New-ExampleInvoker)
        $script:ExState = Get-PaAzPimState -Client $script:ExClient -Scope '/subscriptions/dfa2a084-766f-4003-8ae1-c4aeb893a99f' -RoleId $script:Owner
    }
    It 'keys an eligibility on properties.roleDefinitionId, not the expanded display name' {
        $ex = (Get-Example 'GetRoleEligibilitySchedulesByScope').responses['200'].body.value[0].properties
        ($ex.expandedProperties.roleDefinition.id -split '/')[-1] | Should -Not -Be (($ex.roleDefinitionId -split '/')[-1])
        $script:ExState.Eligibilities[0].RoleId | Should -Be $script:Contributor
        $script:ExState.Eligibilities[0].RoleName | Should -Be 'Contributor'
        $script:ExState.Eligibilities[0].State | Should -Be 'Eligible'
    }
    It 'treats an assignment linked to an eligibility as an activation, even when assignmentType says Assigned' {
        $ex = (Get-Example 'GetRoleAssignmentSchedulesByScope').responses['200'].body.value[0].properties
        $ex.assignmentType | Should -Be 'Assigned'
        $ex.linkedRoleEligibilityScheduleId | Should -Not -BeNullOrEmpty
        $script:ExState.Assignments[0].State | Should -Be 'Activated'
    }
    It "addresses scopes as Learn's walkthrough does, not as the examples' parameters do" {
        $ex = Get-Example 'PutRoleEligibilityScheduleRequest'
        $ex.parameters.scope | Should -BeLike 'providers/Microsoft.Subscription/subscriptions/*'
        $ex.responses['201'].body.properties.scope | Should -Be '/subscriptions/dfa2a084-766f-4003-8ae1-c4aeb893a99f'
        { ConvertTo-PaAzScope "/$($ex.parameters.scope)" } | Should -Throw
        ConvertTo-PaAzScope '/subscriptions/dfa2a084-766f-4003-8ae1-c4aeb893a99f/' | Should -Be $ex.responses['201'].body.properties.scope
    }
    It 'sends the properties the example sends for AdminAssign, plus a justification, without a condition, for the tier''s duration' {
        $ex = (Get-Example 'PutRoleEligibilityScheduleRequest').parameters.parameters.properties
        $ex.Contains('justification') | Should -BeFalse
        $ex.scheduleInfo.expiration.duration | Should -Be 'P365D'
        $op = @($script:Run.Plan.Operations | Where-Object Kind -EQ 'EligibilityAdd')[0]
        $p = $op.Body.properties
        foreach ($k in 'principalId', 'roleDefinitionId', 'requestType', 'scheduleInfo') { $p.Contains($k) | Should -BeTrue }
        $p.requestType | Should -Be $ex.requestType
        $p.scheduleInfo.expiration.type | Should -Be $ex.scheduleInfo.expiration.type
        $p.justification | Should -Not -BeNullOrEmpty
        $p.Contains('condition') | Should -BeFalse
        $p.scheduleInfo.expiration.duration | Should -BeIn @('P90D', 'P180D')
    }
    It 'reads the example policy and, for Tier 0, patches only the rules that differ, each keeping id, ruleType and target' {
        $pol = $script:ExState.Policies[0]
        (Get-PaAzRuleHave -Rule @($pol.Rules | Where-Object id -EQ 'Expiration_EndUser_Assignment')[0]).maximumDuration | Should -Be 'PT7H'
        $appr = Get-PaAzRuleHave -Rule @($pol.Rules | Where-Object id -EQ 'Approval_EndUser_Assignment')[0]
        $appr.isApprovalRequired | Should -BeTrue
        $appr.approvers.Count | Should -Be 2
        $d = Read-PaAzDesiredState -Path $script:DesiredPath
        $d.controlPlaneSubscriptionIds = @('dfa2a084-766f-4003-8ae1-c4aeb893a99f')
        $plan = New-PaAzPlan -State $script:ExState -Desired $d -CallerPrincipalId $script:Caller -RunId t -TierMap (Get-PaAzTierMap -Desired $d)
        $patch = @($plan.Operations | Where-Object Kind -EQ 'PolicyUpdate')
        $patch.Count | Should -Be 1
        $rules = @($patch[0].Body.properties.rules)
        $rules.Count | Should -BeLessThan @($pol.Rules).Count
        $rules.id | Should -Contain 'Expiration_EndUser_Assignment'
        $rules.id | Should -Not -Contain 'Expiration_Admin_Eligibility'   # already P90D in the example
        foreach ($r in $rules) { foreach ($k in 'id', 'ruleType', 'target') { $r.Contains($k) | Should -BeTrue } }
        $partial = (Get-Example 'PatchPartialRoleManagementPolicy').parameters.parameters.properties.rules
        foreach ($r in $partial) { foreach ($k in 'id', 'ruleType', 'target') { $r.Contains($k) | Should -BeTrue } }
    }
    It 'the examples are one page each; the reader follows nextLink, so page size changes nothing' {
        (Get-Example 'GetRoleEligibilitySchedulesByScope').responses['200'].body.Contains('nextLink') | Should -BeFalse
        $counts = foreach ($n in 1, 2, 50) { $r = New-Run -PageSize $n; '{0}/{1}/{2}' -f @($r.State.Assignments).Count, @($r.State.Eligibilities).Count, @($r.State.Policies).Count }
        $counts | Select-Object -Unique | Should -Be '9/2/12'
    }
}

Describe 'Reading the estate' {
    It 'reads schedules and one policy per scope and role, skipping the inherited row' {
        @($script:Run.State.Assignments).Count | Should -Be 9
        @($script:Run.State.Eligibilities).Count | Should -Be 2
        @($script:Run.State.Policies).Count | Should -Be 12
        @($script:Run.State.Assignments | Where-Object { $_.Scope -eq $script:WL -and $_.RoleId -eq $script:UAA }).Count | Should -Be 0
    }
    It 'finds each policy with Learn''s roleDefinitionId filter at the scope' {
        $get = @($script:Run.Fake.Calls | Where-Object { $_.Uri -like "*$script:RG/providers/Microsoft.Authorization/roleManagementPolicies*" })
        $get.Count | Should -Be 3
        [Uri]::UnescapeDataString($get[0].Uri) | Should -BeLike "*`$filter=roleDefinitionId eq '$script:RG/providers/Microsoft.Authorization/roleDefinitions/*'"
    }
    It 'labels activated, time-bound, permanent-eligible and root-scope rows' {
        $a = $script:Run.State.Assignments
        @($a | Where-Object State -EQ 'Activated').Count | Should -Be 1
        @($a | Where-Object State -EQ 'ActiveTimeBound').Count | Should -Be 1
        @($a | Where-Object Scope -EQ '/').RoleId | Should -Be $script:UAA
        @($script:Run.State.Eligibilities | Where-Object State -EQ 'EligiblePermanent').Count | Should -Be 1
    }
    It 'places rows in tiers with Chapter 01''s Get-PaAzureTier and the desired control-plane subscriptions' {
        $t = { param($scope, $role) @($script:Run.State.Assignments | Where-Object { $_.Scope -eq $scope -and $_.RoleId -eq $role })[0].Tier }
        & $t $script:MG $script:UAA | Should -Be 'T0'
        & $t $script:CP $script:Contributor | Should -Be 'T0'
        & $t $script:WL $script:Owner | Should -Be 'T1'
        & $t $script:RG $script:Contributor | Should -Be 'T1'
    }
}

Describe 'The desired state' {
    It 'refuses a service principal as an eligible holder' {
        $p = Save-Desired { param($d) $d.eligible[0].principalType = 'ServicePrincipal' }
        { Read-PaAzDesiredState -Path $p } | Should -Throw '*only users and groups can be eligible*'
    }
    It 'refuses an activation longer than 24 hours' {
        $p = Save-Desired { param($d) $d.settings.T1.maxActivation = 'PT25H' }
        { Read-PaAzDesiredState -Path $p } | Should -Throw '*1 to 24 hours*'
    }
    It 'refuses an authentication context until its Conditional Access policy is confirmed' {
        $p = Save-Desired { param($d) $d.authenticationContextPolicyConfirmed = $false }
        { Read-PaAzDesiredState -Path $p } | Should -Throw '*authenticationContextPolicyConfirmed*'
    }
    It 'refuses the root scope and approval without an approver group' {
        $p = Save-Desired { param($d) $d.scopes += '/' }
        { Read-PaAzDesiredState -Path $p } | Should -Throw '*root scope*'
        $p = Save-Desired { param($d) $d.settings.T0.Remove('approverGroupId') }
        { Read-PaAzDesiredState -Path $p } | Should -Throw '*approverGroupId*'
    }
    It 'drops an exception with no owner, so the standing assignment is a finding again' {
        $p = Save-Desired { param($d) $d.standingExceptions[0].owner = '' }
        $r = New-Run -DesiredPath $p
        @($r.Plan.Findings | Where-Object { $_.Rule -eq 'PA-AZ-02' -and $_.PrincipalId -eq 'c3000000-0000-4000-8000-000000000002' }).Count | Should -Be 1
    }
}

Describe 'The plan' {
    It 'plans 11 policy updates, 5 eligible assignments and 3 removals, with 7 findings, 2 warnings and 1 info' {
        $s = $script:Run.Plan.Summary
        "$($s.PolicyUpdate)/$($s.EligibilityAdd)/$($s.ActiveRemove)" | Should -Be '11/5/3'
        $f = $script:Run.Plan.Findings
        '{0}/{1}/{2}' -f @($f | Where-Object Severity -EQ 'Finding').Count, @($f | Where-Object Severity -EQ 'Warn').Count, @($f | Where-Object Severity -EQ 'Info').Count | Should -Be '7/2/1'
    }
    It 'orders policies, then eligibility, then removals, and never removes a standing assignment without its eligible replacement' {
        $ops = @($script:Run.Plan.Operations)
        ($ops.Order -join '') | Should -Be (($ops.Order | Sort-Object) -join '')
        foreach ($rm in @($ops | Where-Object Kind -EQ 'ActiveRemove')) {
            $add = @($ops | Where-Object { $_.Kind -eq 'EligibilityAdd' -and $_.Scope -eq $rm.Scope -and $_.RoleId -eq $rm.RoleId -and $_.PrincipalId -eq $rm.PrincipalId })
            $add.Count | Should -Be 1
            [array]::IndexOf($ops, $add[0]) | Should -BeLessThan ([array]::IndexOf($ops, $rm))
        }
    }
    It 'leaves service principals, the caller, root elevation and owned exceptions alone, and says why' {
        $f = $script:Run.Plan.Findings
        @($f | Where-Object Rule -EQ 'PA-AZ-02').PrincipalId | Should -Be 'c3000000-0000-4000-8000-000000000001'
        @($f | Where-Object Rule -EQ 'PA-AZ-05').PrincipalId | Should -Be $script:Caller
        @($f | Where-Object Rule -EQ 'PA-AZ-03').Scope | Should -Be '/'
        @($f | Where-Object { $_.Rule -eq 'PA-AZ-01' -and $_.Severity -eq 'Info' }).PrincipalId | Should -Be 'c3000000-0000-4000-8000-000000000002'
        $touched = @($script:Run.Plan.Operations | Where-Object PrincipalId | ForEach-Object PrincipalId)
        foreach ($id in 'c3000000-0000-4000-8000-000000000001', $script:Caller, 'a1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000002') { $touched | Should -Not -Contain $id }
    }
    It 'with convertStanding off, reports standing assignments and plans no conversion' {
        $p = Save-Desired { param($d) $d.convertStanding = $false }
        $r = New-Run -DesiredPath $p
        "$($r.Plan.Summary.PolicyUpdate)/$($r.Plan.Summary.EligibilityAdd)/$($r.Plan.Summary.ActiveRemove)" | Should -Be '11/2/0'
        @($r.Plan.Findings | Where-Object { $_.Rule -eq 'PA-AZ-01' -and $_.Severity -eq 'Finding' }).Count | Should -Be 3
    }
    It 'skips a policy already at its tier''s settings, and patches only changed rules' {
        @($script:Run.Plan.Operations | Where-Object { $_.Kind -eq 'PolicyUpdate' -and $_.Scope -eq $script:CP -and $_.RoleId -eq $script:UAA }).Count | Should -Be 0
        $wl = @($script:Run.Plan.Operations | Where-Object { $_.Kind -eq 'PolicyUpdate' -and $_.Scope -eq $script:WL -and $_.RoleId -eq $script:Owner })[0]
        @($wl.Body.properties.rules).id | Should -Not -Contain 'Expiration_EndUser_Assignment'   # already PT8H, Tier 1's maximum
        $mg = @($script:Run.Plan.Operations | Where-Object { $_.Kind -eq 'PolicyUpdate' -and $_.Scope -eq $script:MG -and $_.RoleId -eq $script:Owner })[0]
        @($mg.Body.properties.rules | Where-Object id -EQ 'Expiration_EndUser_Assignment').maximumDuration | Should -Be 'PT4H'
    }
    It 'sets the resource group''s policies itself, because policies are not inherited' {
        @($script:Run.Plan.Operations | Where-Object { $_.Kind -eq 'PolicyUpdate' -and $_.Scope -eq $script:RG }).Count | Should -Be 3
    }
    It 'sets approval to the tier''s approver group, the authentication context, and MFA and justification on active assignment' {
        $mg = @($script:Run.Plan.Operations | Where-Object { $_.Kind -eq 'PolicyUpdate' -and $_.Scope -eq $script:MG -and $_.RoleId -eq $script:UAA })[0]
        $r = @{}; foreach ($x in $mg.Body.properties.rules) { $r[$x.id] = $x }
        $r['Approval_EndUser_Assignment'].setting.approvalStages[0].primaryApprovers[0].id | Should -Be 'e5000000-0000-4000-8000-000000000000'
        $r['AuthenticationContext_EndUser_Assignment'].claimValue | Should -Be 'c1'
        $r['Enablement_Admin_Assignment'].enabledRules | Should -Be @('MultiFactorAuthentication', 'Justification')
    }
    It 'flags a subscription that would have more than three Owners' {
        $f = @($script:Run.Plan.Findings | Where-Object Rule -EQ 'PA-AZ-06')
        $f.Scope | Should -Be $script:WL
        $f.Issue | Should -BeLike '4 Owners*'
    }
    It 'names each request with a GUID derived from the run id, the same for a dry run and its apply' {
        $a = (New-Run -RunId 'r1').Plan.Operations | Where-Object { $_.Bind.ContainsKey('name') -and $_.Kind -ne 'PolicyUpdate' } | ForEach-Object { $_.Bind.name }
        $b = (New-Run -RunId 'r1').Plan.Operations | Where-Object { $_.Bind.ContainsKey('name') -and $_.Kind -ne 'PolicyUpdate' } | ForEach-Object { $_.Bind.name }
        $c = (New-Run -RunId 'r2').Plan.Operations | Where-Object { $_.Bind.ContainsKey('name') -and $_.Kind -ne 'PolicyUpdate' } | ForEach-Object { $_.Bind.name }
        $a | Should -Be $b
        $a[0] | Should -Not -Be $c[0]
        foreach ($n in $a) { $n | Should -Match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
    It 'makes eligibility as long as the tier allows: 90 days for Tier 0, 180 for Tier 1' {
        $adds = @($script:Run.Plan.Operations | Where-Object Kind -EQ 'EligibilityAdd')
        @($adds | Where-Object Tier -EQ 'T0').Body.properties.scheduleInfo.expiration.duration | Should -Be 'P90D'
        @($adds | Where-Object Tier -EQ 'T1' | ForEach-Object { $_.Body.properties.scheduleInfo.expiration.duration } | Select-Object -Unique) | Should -Be 'P180D'
    }
}

Describe 'Dry run and apply' {
    It 'a dry run returns 19 requests and sends none' {
        $r = New-Run
        $req = @(Invoke-PaAzPlan -Plan $r.Plan -Client $r.Client)
        $req.Count | Should -Be 19
        @($req | Where-Object Sent).Count | Should -Be 0
        @($r.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'refuses to apply through a read client' {
        $r = New-Run -Task azure-pim-read
        { Invoke-PaAzPlan -Plan $r.Plan -Client $r.Client -Apply } | Should -Throw '*azure-pim-apply client*'
        @($r.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'applies in order and leaves nothing to change on a fresh read' {
        $r = New-Run
        $sent = @(Invoke-PaAzPlan -Plan $r.Plan -Client $r.Client -Apply)
        @($sent | Where-Object Sent).Count | Should -Be 19
        @($r.Fake.Calls | Where-Object Method -NE 'GET' | ForEach-Object Method) | Should -Be (@('PATCH') * 11 + @('PUT') * 8)
        $again = New-PaAzPlan -State (Get-PaAzPimState -Client $r.Client -Scope $r.Desired.scopes -RoleId $r.Desired.governedRoles -TierMap $r.Map) -Desired $r.Desired -CallerPrincipalId $script:Caller -TierMap $r.Map
        @($again.Operations).Count | Should -Be 0
        @($again.Findings | Where-Object { $_.Rule -eq 'PA-AZ-01' -and $_.Severity -eq 'Finding' }).Count | Should -Be 0
    }
    It 'the fake enforces the policy: eligibility longer than the maximum fails with ExpirationRule' {
        $r = New-Run
        $body = @{ properties = [ordered]@{ principalId = 'a1000000-0000-4000-8000-000000000005'; roleDefinitionId = "$script:CP/providers/Microsoft.Authorization/roleDefinitions/$script:UAA"; requestType = 'AdminAssign'; justification = 't'; scheduleInfo = @{ expiration = @{ type = 'AfterDuration'; duration = 'P180D' } } } }
        { Invoke-PaAzWrite -Client $r.Client -CallId azpim-eligibility-request -Bind @{ scope = $script:CP; name = [guid]::NewGuid().ToString() } -Body $body -Apply } | Should -Throw '*ExpirationRule*'
    }
    It 'the fake refuses an eligible assignment for a service principal' {
        $r = New-Run
        $body = @{ properties = [ordered]@{ principalId = 'c3000000-0000-4000-8000-000000000001'; roleDefinitionId = "$script:WL/providers/Microsoft.Authorization/roleDefinitions/$script:Contributor"; requestType = 'AdminAssign'; justification = 't'; scheduleInfo = @{ expiration = @{ type = 'AfterDuration'; duration = 'P30D' } } } }
        { Invoke-PaAzWrite -Client $r.Client -CallId azpim-eligibility-request -Bind @{ scope = $script:WL; name = [guid]::NewGuid().ToString() } -Body $body -Apply } | Should -Throw '*service principal*'
    }
    It 'the entry script writes a dry run whose manifest hashes match its files' {
        $out = Join-Path ([IO.Path]::GetTempPath()) ("pa-ch06-out-{0}" -f [guid]::NewGuid())
        $lines = & (Join-Path $script:Root 'Invoke-PaAzurePim.ps1') -Cloud gcc -FixturePath $script:Estate -DesiredPath $script:DesiredPath -CallerPrincipalId $script:Caller -OutputPath $out -RunId lab
        $lines[1] | Should -Be 'Plan: 11 policy updates, 5 eligible assignments to add, 3 standing assignments to remove'
        $lines[3] | Should -BeLike 'Dry run: 19 requests*none sent*'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
        $m.applied | Should -BeFalse
        @($m.requests | Where-Object { $_.method -ne 'GET' }).Count | Should -Be 0
        foreach ($k in $m.files.Keys) { (Get-FileHash (Join-Path $out $k) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $m.files[$k] }
        Remove-Item -Recurse -Force $out
    }
    It 'the entry script refuses a desired state written for another cloud' {
        $p = Save-Desired { param($d) $d.cloud = 'gcchigh' }
        { & (Join-Path $script:Root 'Invoke-PaAzurePim.ps1') -Cloud gcc -FixturePath $script:Estate -DesiredPath $p -CallerPrincipalId $script:Caller -OutputPath (Join-Path ([IO.Path]::GetTempPath()) 'pa-x') } | Should -Throw "*for 'gcchigh', not 'gcc'*"
    }
}
