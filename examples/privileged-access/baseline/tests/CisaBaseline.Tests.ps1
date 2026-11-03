#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# CISA's Microsoft Entra ID baseline: the checks for MS.AAD.7.1v1 (the Global Administrator floor,
# in Chapter 01's PA-INV-04) and MS.AAD.7.7v1 and MS.AAD.7.8v1 (the PIM alerts, Chapter 04's
# PA-PIM-10 and PA-PIM-11, and PA-PIM-12 and PA-PIM-13 for the PIM for Groups groups that hold those
# roles), against fictional tenants served by the fakes. A separate suite from
# tests/, so the chapters' test counts don't change. No module, tenant or network is needed.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path $PSScriptRoot '../..')
    Import-Module (Join-Path $script:Kit 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
    Import-Module (Join-Path $script:Kit 'powershell/PimEntraRoles/PimEntraRoles.psm1') -Force
    $script:Fixtures = Join-Path $PSScriptRoot 'fixtures'
    $script:GA = '62e90394-69f5-4237-9190-012177145e10'
    function Get-InventoryFinding([string]$Path) {
        $reader = New-PaReader -Cloud gcc -Task inventory -Invoke (New-PaFixtureInvoker -Path $Path).Invoke
        @(Test-PaInventory -Inventory (Get-PaPrivilegedInventory -Reader $reader))
    }
    function Get-AlertFinding([string]$Path, [string]$Cloud = 'gcc') {
        $fake = New-PaPimFixtureInvoker -Path $Path -Cloud $Cloud
        $client = New-PaPimClient -Cloud $Cloud -Task pim-alerts -Invoke $fake.Invoke
        $ids = (Get-PaPimHighlyPrivilegedRole).RoleTemplateId
        $policies = Get-PaPimRolePolicy -Client $client -RoleTemplateId $ids -ContinueOnRefusedRead
        $groups = @(Get-PaPimPrivilegedGroup -Client $client -RoleTemplateId $ids)
        $gp = Get-PaPimGroupPolicy -Client $client -GroupId @($groups | ForEach-Object GroupId)
        [pscustomobject]@{ Fake = $fake; Client = $client; Groups = $groups; Findings = @(Test-PaPimAlertSetting -Policies $policies) + @(Test-PaPimGroupAlertSetting -Groups $groups -Policies $gp) }
    }
    function New-GaRow([string]$Id, [string]$Type, [string]$Via = 'Direct') {
        [pscustomobject]@{ Plane = 'Entra'; RoleId = $script:GA; RoleName = 'Global Administrator'; Tier = 'T0'; Scope = '/'; State = 'Eligible'; EndDateTime = $null
            PrincipalId = $Id; PrincipalType = $Type; PrincipalName = $Id; UserPrincipalName = $null; Via = $Via; ViaGroupId = $null }
    }
}

Describe 'MS.AAD.7.1v1: at least two and at most eight Global Administrators (PA-INV-04)' {
    It 'one Global Administrator is a Finding: the floor is two' {
        $f = @(Get-InventoryFinding (Join-Path $script:Fixtures 'inventory-one-global-admin.json') | Where-Object Rule -EQ 'PA-INV-04')
        $f.Count | Should -Be 1
        $f[0].Severity | Should -Be 'Finding'
        $f[0].Issue | Should -Match '^1 user\(s\).*MS\.AAD\.7\.1v1 asks for at least 2$'
    }
    It 'two, the emergency accounts, pass both the floor and the ceiling' {
        @(Get-InventoryFinding (Join-Path $script:Fixtures 'inventory-two-global-admins.json') | Where-Object Rule -EQ 'PA-INV-04').Count | Should -Be 0
    }
    It 'the Chapter 01 tenant keeps its one PA-INV-04, the ceiling: five is over Learn''s fewer than five' {
        $f = @(Get-InventoryFinding (Join-Path $script:Kit 'tests/fixtures/tenant.json') | Where-Object Rule -EQ 'PA-INV-04')
        $f.Count | Should -Be 1
        $f[0].Issue | Should -Match '^5 principals'
    }
    It 'counts group members toward the floor, as the baseline does' {
        $inv = [pscustomobject]@{ Rows = @((New-GaRow 'u1' 'user'), (New-GaRow 'u2' 'user' 'Group'), (New-GaRow 'g1' 'group')); Unreadable = @() }
        @(Test-PaInventory -Inventory $inv | Where-Object Rule -EQ 'PA-INV-04').Count | Should -Be 0
    }
    It 'doesn''t count a service principal toward the floor: the baseline counts users' {
        $inv = [pscustomobject]@{ Rows = @((New-GaRow 'u1' 'user'), (New-GaRow 's1' 'servicePrincipal')); Unreadable = @() }
        (@(Test-PaInventory -Inventory $inv | Where-Object Rule -EQ 'PA-INV-04')).Issue | Should -Match '^1 user\(s\)'
    }
}

Describe 'MS.AAD.7.7v1 and MS.AAD.7.8v1: PIM alerts (PA-PIM-10, PA-PIM-11)' {
    It 'checks CISA''s eight highly privileged roles, each with a role file in Chapter 04' {
        $roles = @(Get-PaPimHighlyPrivilegedRole)
        $roles.Count | Should -Be 8
        $roles[0].Name | Should -Be 'Global Administrator'
        $files = @(Get-ChildItem (Join-Path $script:Kit 'config/pim-ch04/roles') -Filter *.json | ForEach-Object { (Get-Content $_.FullName -Raw | ConvertFrom-Json).roleTemplateId })
        foreach ($r in $roles) { $files | Should -Contain $r.RoleTemplateId }
    }
    It 'needs four read permissions, Learn''s narrowest for each call, and refuses to write' {
        $p = Get-PaPimRequiredPermission -Task pim-alerts
        $p.GraphPermissions | Should -Be @('RoleAssignmentSchedule.Read.Directory', 'RoleEligibilitySchedule.Read.Directory', 'RoleManagementPolicy.Read.AzureADGroup', 'RoleManagementPolicy.Read.Directory')
        $p.Write | Should -BeNullOrEmpty
        # Learn: reading a role-assignable group's PIM policies takes Privileged Role Administrator, not Global Reader.
        $p.DelegatedRole | Should -Be 'Privileged Role Administrator'
        $fake = New-PaPimFixtureInvoker -Path (Join-Path $script:Fixtures 'pim-alerts-set.json')
        { New-PaPimClient -Cloud gcc -Task pim-alerts -Invoke $fake.Invoke -AllowWrite } | Should -Throw '*only reads*'
        $c = New-PaPimClient -Cloud gcc -Task pim-alerts -Invoke $fake.Invoke
        { Invoke-PaPimRequest -Client $c -CallId pim-policy-rule-update -Bind @{ policyId = 'p'; ruleId = 'r' } -Body @{} } | Should -Throw '*Undeclared call*'
    }
    It 'PIM''s default notifications fail every check: eight PA-PIM-10 Findings, one PA-PIM-11, and a PA-PIM-12 per PRV group' {
        $r = Get-AlertFinding (Join-Path $script:Kit 'tests/fixtures/ch04/tenant.json')
        @($r.Findings | Where-Object { $_.Rule -eq 'PA-PIM-10' -and $_.Severity -eq 'Finding' }).Count | Should -Be 8
        @($r.Findings | Where-Object { $_.Rule -eq 'PA-PIM-12' -and $_.Severity -eq 'Finding' }).Object | Sort-Object | Should -Be @('PRV-T0-PrivRoleAdmin', 'PRV-T1-AppAdmin')
        @($r.Findings | Where-Object Rule -EQ 'PA-PIM-13').Count | Should -Be 0
        @($r.Findings | Where-Object { $_.Rule -eq 'PA-PIM-11' -and $_.Severity -eq 'Finding' }).Object | Should -Be 'Global Administrator'
        @($r.Findings | Where-Object Severity -EQ 'Info').Count | Should -Be 0
    }
    It 'passes when the security mailbox is on every assignment alert and the activation alert' {
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-set.json')
        @($r.Findings | Where-Object Severity -EQ 'Finding').Count | Should -Be 0
        @($r.Findings | Where-Object { $_.Rule -eq 'PA-PIM-10' -and $_.Severity -eq 'Info' }).Count | Should -Be 8
        (@($r.Findings | Where-Object Rule -EQ 'PA-PIM-11')).Issue | Should -Be 'Activation alerts go to secops-alerts@contoso.example'
    }
    It 'names the alert that''s missing: Exchange Administrator''s eligible assignments, Global Administrator''s activation' {
        $f = @((Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-partial.json')).Findings | Where-Object Severity -EQ 'Finding')
        $f.Count | Should -Be 2
        ($f | Where-Object Rule -EQ 'PA-PIM-10').Object | Should -Be 'Exchange Administrator'
        ($f | Where-Object Rule -EQ 'PA-PIM-10').Issue | Should -Match 'on eligible assignment:'
        ($f | Where-Object Rule -EQ 'PA-PIM-11').Object | Should -Be 'Global Administrator'
    }
    It 'treats a policy it couldn''t read as a Finding, not a pass' {
        $f = @(Test-PaPimAlertSetting -Policies @{})
        @($f | Where-Object Severity -EQ 'Finding').Count | Should -Be 9
        $f[0].Issue | Should -Match 'can''t be shown'
    }
    It 'turns a role policy read Graph refuses (403) into a Finding for that role and checks the rest' {
        $fake = New-PaPimFixtureInvoker -Path (Join-Path $script:Fixtures 'pim-alerts-set.json')
        $inner = $fake.Invoke
        # The fake, except that Graph refuses the read of Global Administrator's policy.
        $refusing = {
            param($Method, $Uri, $Body)
            if ([Uri]::UnescapeDataString($Uri) -match "scopeType eq 'DirectoryRole' and roleDefinitionId eq '62e90394-69f5-4237-9190-012177145e10'") { throw 'Response status code does not indicate success: Forbidden (403)' }
            & $inner $Method $Uri $Body
        }.GetNewClosure()
        $client = New-PaPimClient -Cloud gcc -Task pim-alerts -Invoke $refusing
        $ids = (Get-PaPimHighlyPrivilegedRole).RoleTemplateId
        $p = Get-PaPimRolePolicy -Client $client -RoleTemplateId $ids -ContinueOnRefusedRead
        $p[$script:GA].Error | Should -Match 'Forbidden \(403\)'
        $f = @(Test-PaPimAlertSetting -Policies $p)
        $bad = @($f | Where-Object Severity -EQ 'Finding')
        @($bad.Rule) | Should -Be @('PA-PIM-10', 'PA-PIM-11')
        @($bad.Object | Sort-Object -Unique) | Should -Be @('Global Administrator')
        $bad[0].Issue | Should -Match "policy couldn't be read \(Response status code does not indicate success: Forbidden \(403\)\), so its assignment alerts can't be shown"
        # The other seven roles are still read and still pass.
        @($f | Where-Object { $_.Rule -eq 'PA-PIM-10' -and $_.Severity -eq 'Info' }).Count | Should -Be 7
        @($client.Evidence | Where-Object Call -EQ 'pim-policy-assignment').Count | Should -Be 8
        # Without the switch, as the plan reads policies, the refused read still stops the run.
        { Get-PaPimRolePolicy -Client $client -RoleTemplateId $ids } | Should -Throw '*Forbidden (403)*'
    }
    It 'sends one GET per role, one each for the eligible and active assignments, and one per group, on the cloud''s own Graph host' {
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-groups-set.json') 'gcchigh'
        @($r.Fake.Calls).Count | Should -Be 12
        @($r.Fake.Calls | Where-Object { [Uri]::UnescapeDataString($_.Uri) -match "scopeType eq 'Group' and roleDefinitionId eq 'member'" }).Count | Should -Be 2
        foreach ($c in $r.Fake.Calls) {
            $c.Method | Should -Be 'GET'
            $c.Uri | Should -BeLike 'https://graph.microsoft.us/v1.0/*'
        }
    }
    It 'the entry script writes findings.json and a manifest that records only GETs' {
        $out = Join-Path $TestDrive 'pim-alerts'
        $text = & (Join-Path $script:Kit 'Invoke-PaPimAlertCheck.ps1') -Cloud gcc -FixturePath (Join-Path $script:Fixtures 'pim-alerts-partial.json') -OutputPath $out
        $text | Should -Contain '2 Finding, 7 Info'
        $text | Should -Contain 'Global Administrator activation alert (MS.AAD.7.8v1): not set'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'pim-alerts'
        $m.graphPermissions | Should -Contain 'RoleManagementPolicy.Read.AzureADGroup'
        @($m.requests | Where-Object method -NE 'GET').Count | Should -Be 0
        @(Get-Content (Join-Path $out 'findings.json') -Raw | ConvertFrom-Json).Count | Should -Be 9
    }
}

Describe 'MS.AAD.7.7v1 and MS.AAD.7.8v1 on PIM for Groups: the groups that hold the roles (PA-PIM-12, PA-PIM-13)' {
    It 'finds the groups holding one of the eight roles, eligible or active, and nothing else' {
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-groups-set.json')
        @($r.Groups.Name) | Should -Be @('PRV-T0-GlobalAdmin', 'PRV-T1-ExchangeAdmin')
        @($r.Groups[0].Holds) | Should -Be @('Global Administrator (eligible)')
        @($r.Groups[1].Holds) | Should -Be @('Exchange Administrator (active)')
        @($r.Findings | Where-Object Object -EQ 'Helpdesk-Tier2').Count | Should -Be 0
    }
    It 'passes when each group''s member policy sends the alerts to the security mailbox' {
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-groups-set.json')
        @($r.Findings | Where-Object Severity -EQ 'Finding').Count | Should -Be 0
        @($r.Findings | Where-Object { $_.Rule -eq 'PA-PIM-12' -and $_.Severity -eq 'Info' }).Count | Should -Be 2
        (@($r.Findings | Where-Object Rule -EQ 'PA-PIM-13')).Issue | Should -Be 'Holds Global Administrator; member activation alerts go to secops-alerts@contoso.example'
    }
    It 'names the group and the alert that''s missing' {
        $f = @((Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-groups-partial.json')).Findings | Where-Object Severity -EQ 'Finding')
        $f.Count | Should -Be 2
        ($f | Where-Object Rule -EQ 'PA-PIM-12').Object | Should -Be 'PRV-T1-ExchangeAdmin'
        ($f | Where-Object Rule -EQ 'PA-PIM-12').Issue | Should -Match 'on active assignment:'
        ($f | Where-Object Rule -EQ 'PA-PIM-13').Object | Should -Be 'PRV-T0-GlobalAdmin'
    }
    It 'asks for the activation alert only on a group that holds Global Administrator' {
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-groups-partial.json')
        @($r.Findings | Where-Object Rule -EQ 'PA-PIM-13').Object | Should -Be @('PRV-T0-GlobalAdmin')
    }
    It 'treats a group whose member policy it couldn''t read as a Finding, not a pass' {
        $g = [pscustomobject]@{ GroupId = 'g1'; Name = 'PRV-T0-GlobalAdmin'; RoleTemplateIds = @($script:GA); Holds = @('Global Administrator (eligible)') }
        $f = @(Test-PaPimGroupAlertSetting -Groups @($g) -Policies @{})
        @($f | Where-Object Severity -EQ 'Finding').Rule | Should -Be @('PA-PIM-12', 'PA-PIM-13')
        $f[0].Issue | Should -Match 'can''t be shown'
    }
    It 'turns a member policy read Graph refuses (403) into a Finding for that group and checks the rest' {
        $fake = New-PaPimFixtureInvoker -Path (Join-Path $script:Fixtures 'pim-alerts-groups-set.json')
        $inner = $fake.Invoke
        # The fake, except that Graph refuses the read of PRV-T0-GlobalAdmin's member policy, as it does without RoleManagementPolicy.Read.AzureADGroup.
        $refusing = {
            param($Method, $Uri, $Body)
            if ([Uri]::UnescapeDataString($Uri) -match "scopeId eq '9e000000-0000-4000-8000-000000000201' and scopeType eq 'Group'") { throw 'Response status code does not indicate success: Forbidden (403)' }
            & $inner $Method $Uri $Body
        }.GetNewClosure()
        $client = New-PaPimClient -Cloud gcc -Task pim-alerts -Invoke $refusing
        $ids = (Get-PaPimHighlyPrivilegedRole).RoleTemplateId
        $groups = @(Get-PaPimPrivilegedGroup -Client $client -RoleTemplateId $ids)
        $gp = Get-PaPimGroupPolicy -Client $client -GroupId @($groups | ForEach-Object GroupId)
        $gp['9e000000-0000-4000-8000-000000000201'].Error | Should -Match 'Forbidden \(403\)'
        $f = @(Test-PaPimGroupAlertSetting -Groups $groups -Policies $gp)
        $bad = @($f | Where-Object { $_.Object -eq 'PRV-T0-GlobalAdmin' })
        @($bad.Rule) | Should -Be @('PA-PIM-12', 'PA-PIM-13')
        @($bad.Severity | Sort-Object -Unique) | Should -Be @('Finding')
        $bad[0].Issue | Should -Match "member policy couldn't be read \(Response status code does not indicate success: Forbidden \(403\)\), so its assignment alerts can't be shown"
        # The other group is still read and still passes.
        @($f | Where-Object { $_.Object -eq 'PRV-T1-ExchangeAdmin' }).Severity | Should -Be @('Info')
        @($client.Evidence | Where-Object Call -EQ 'pim-group-policy-assignment').Count | Should -Be 2
    }
    It 'reads the member policy with Learn''s filter, under the PIM for Groups permission' {
        (Get-PaPimCall -Id pim-group-policy-assignment).permissions | Should -Be @('RoleManagementPolicy.Read.AzureADGroup')
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-groups-set.json')
        $u = @($r.Client.Evidence | Where-Object Call -EQ 'pim-group-policy-assignment')
        $u.Count | Should -Be 2
        [Uri]::UnescapeDataString($u[0].Uri) | Should -BeLike "https://graph.microsoft.com/v1.0/policies/roleManagementPolicyAssignments?`$filter=scopeId eq '9e000000-0000-4000-8000-000000000201' and scopeType eq 'Group' and roleDefinitionId eq 'member'&`$expand=policy(`$expand=rules)"
    }
    It 'the entry script reports the groups and writes them to findings.json' {
        $out = Join-Path $TestDrive 'pim-alerts-groups'
        $text = & (Join-Path $script:Kit 'Invoke-PaPimAlertCheck.ps1') -Cloud gcc -FixturePath (Join-Path $script:Fixtures 'pim-alerts-groups-partial.json') -OutputPath $out
        $text | Should -Contain 'PIM for Groups (MS.AAD.7.7v1, MS.AAD.7.8v1): 0 of 2 groups holding a highly privileged role send member alerts to an added recipient'
        $text | Should -Contain '2 Finding, 10 Info'
        @(Get-Content (Join-Path $out 'findings.json') -Raw | ConvertFrom-Json | Where-Object Rule -In 'PA-PIM-12', 'PA-PIM-13').Count | Should -Be 3
    }
}
