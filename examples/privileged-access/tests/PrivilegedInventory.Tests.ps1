#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 01: the reader (clouds, declared calls, paging, hosts) and the privileged inventory,
# against the fictional tenant served by the fake. No module, tenant or network is needed.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/tenant.json'
    $script:Exceptions = Join-Path $PSScriptRoot 'fixtures/inputs/exceptions.csv'
    $script:Scopes = @('/subscriptions/11111111-1111-4111-8111-111111111111', '/providers/Microsoft.Management/managementGroups/contoso-root', '/subscriptions/22222222-2222-4222-8222-222222222222')
    function New-TestInventory([int]$PageSize = 2, [string[]]$Scope = $script:Scopes) {
        $fake = New-PaFixtureInvoker -Path $script:Fixture -PageSize $PageSize
        $reader = New-PaReader -Cloud gcc -Task inventory -Invoke $fake.Invoke
        $map = Get-PaTierMap; $map.azureControlPlaneSubscriptions.ids = @('22222222-2222-4222-8222-222222222222')
        [pscustomobject]@{ Fake = $fake; Inventory = (Get-PaPrivilegedInventory -Reader $reader -AzureScope $Scope -TierMap $map) }
    }
    $script:Run = New-TestInventory
    $script:Findings = @(Test-PaInventory -Inventory $script:Run.Inventory -Exceptions (Import-PaExceptions $script:Exceptions))
    function Get-Rule($id, $sev) { @($script:Findings | Where-Object { $_.Rule -eq $id -and (-not $sev -or $_.Severity -eq $sev) }) }
}

Describe 'Clouds and declared calls' {
    It 'GCC uses the worldwide Graph host and commercial Resource Manager' {
        $c = Get-PaCloud gcc
        $c.Graph | Should -Be 'https://graph.microsoft.com'
        $c.Arm | Should -Be 'https://management.azure.com'
        $c.AzureEnvironment | Should -Be 'AzureCloud'
    }
    It 'GCC High and DoD use their own Graph hosts and Azure Government' {
        (Get-PaCloud gcchigh).Graph | Should -Be 'https://graph.microsoft.us'
        (Get-PaCloud dod).Graph | Should -Be 'https://dod-graph.microsoft.us'
        (Get-PaCloud dod).Arm | Should -Be 'https://management.usgovcloudapi.net'
    }
    It 'refuses a cloud name it does not know' {
        { Get-PaCloud 'GCCHigh' } | Should -Throw '*Unknown cloud*'
    }
    It 'the inventory needs exactly these Graph permissions, all read-only' {
        $p = Get-PaRequiredPermission -Task inventory
        $p.GraphPermissions | Should -Be @('GroupMember.ReadBasic.All', 'RoleAssignmentSchedule.Read.Directory', 'RoleEligibilitySchedule.Read.Directory', 'RoleManagement.Read.Directory', 'User.ReadBasic.All')
        $p.AzureRoles | Should -Be @('Reader')
        foreach ($g in $p.GraphPermissions) { $g | Should -Not -Match 'ReadWrite' }
    }
    It 'every declared call is a GET with a permission or an Azure role and a Learn page' {
        foreach ($c in (Get-PaCall)) {
            $c.method | Should -Be 'GET'
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
            if ($c.api -eq 'graph') { @($c.permissions).Count | Should -BeGreaterThan 0 } else { $c.azureRole | Should -Be 'Reader' }
        }
    }
    It 'refuses a call the task does not declare, before anything is sent' {
        $fake = New-PaFixtureInvoker -Path $script:Fixture
        $r = New-PaReader -Cloud gcc -Task inventory -Invoke $fake.Invoke
        { Invoke-PaList -Reader $r -CallId 'ca-policies' } | Should -Throw '*Undeclared call*'
        $fake.Calls.Count | Should -Be 0
    }
    It 'refuses a next link on another host' {
        $evil = { param($m, $u) @{ value = @(@{ id = 'x' }); '@odata.nextLink' = 'https://graph.example.net/v1.0/next' } }
        $r = New-PaReader -Cloud gcc -Task inventory -Invoke $evil
        { Invoke-PaList -Reader $r -CallId 'entra-role-definitions' } | Should -Throw '*Refusing to send the token*'
    }
    It 'in GCC High, sends nothing to graph.microsoft.com' {
        $seen = [Collections.Generic.List[string]]::new()
        $rec = { param($m, $u) $seen.Add($u); @{ value = @() } }.GetNewClosure()
        $r = New-PaReader -Cloud gcchigh -Task inventory -Invoke $rec
        $null = Invoke-PaList -Reader $r -CallId 'entra-role-definitions'
        $seen[0] | Should -BeLike 'https://graph.microsoft.us/v1.0/*'
    }
    It 'the fake refuses anything but GET' {
        $fake = New-PaFixtureInvoker -Path $script:Fixture
        { & $fake.Invoke 'POST' 'https://graph.microsoft.com/v1.0/roleManagement/directory/roleDefinitions' } | Should -Throw '*refuses POST*'
    }
}

Describe 'Get-PaPrivilegedInventory' {
    It 'follows every page: the same rows with a page size of 1 and of 50' {
        $a = (New-TestInventory -PageSize 1).Inventory.Rows.Count
        $b = (New-TestInventory -PageSize 50).Inventory.Rows.Count
        $a | Should -Be $b
        $a | Should -Be $script:Run.Inventory.Rows.Count
    }
    It 'reads eligible assignments, which the Learn sample misses' {
        @($script:Run.Inventory.Rows | Where-Object { $_.Plane -eq 'Entra' -and $_.State -like 'Eligible*' }).Count | Should -BeGreaterThan 0
        $frank = $script:Run.Inventory.Rows | Where-Object { $_.PrincipalId -eq 'a0000000-0000-4000-8000-000000000005' -and $_.RoleName -eq 'Global Administrator' }
        $frank.State | Should -Be 'EligiblePermanent'
    }
    It 'tells permanent, time-bound and activated assignments apart' {
        $rows = $script:Run.Inventory.Rows | Where-Object Plane -EQ 'Entra'
        ($rows | Where-Object PrincipalId -EQ '0e000000-0000-4000-8000-000000000001').State | Should -Be 'ActivePermanent'
        ($rows | Where-Object PrincipalId -EQ '0e000000-0000-4000-8000-000000000002').State | Should -Be 'ActiveTimeBound'
        @($rows | Where-Object { $_.PrincipalId -eq 'a0000000-0000-4000-8000-000000000006' }).State | Should -Contain 'Activated'
    }
    It 'expands role-holding groups to their members, marked Via Group' {
        $m = @($script:Run.Inventory.Rows | Where-Object { $_.Via -eq 'Group' -and $_.ViaGroupId -eq '9e000000-0000-4000-8000-000000000002' })
        $m.UserPrincipalName | Should -Be @('bo.chen@contoso.example', 'dana.ruiz@contoso.example')
        ($m | Select-Object -First 1).RoleName | Should -Be 'Privileged Role Administrator'
    }
    It 'reads each group''s members once' {
        $memberCalls = @($script:Run.Fake.Calls | Where-Object { $_.Uri -like '*/groups/9e000000-0000-4000-8000-000000000002/members*' -and $_.Uri -notlike '*skiptoken*' })
        $memberCalls.Count | Should -Be 1
    }
    It 'gives every row a tier, and Unclassified when the role is not in the map' {
        foreach ($r in $script:Run.Inventory.Rows) { $r.Tier | Should -BeIn @('T0', 'T1', 'T2', 'RO', 'Unclassified') }
        ($script:Run.Inventory.Rows | Where-Object RoleName -EQ 'Contoso Directory Writer').Tier | Should -Be 'Unclassified'
    }
    It 'places Azure assignments by role and scope' {
        $az = $script:Run.Inventory.Rows | Where-Object Plane -EQ 'Azure'
        ($az | Where-Object { $_.RoleName -eq 'User Access Administrator' -and $_.Scope -like '*managementGroups*' }).Tier | Should -Be 'T0'
        @($az | Where-Object { $_.RoleName -eq 'Owner' -and $_.Scope -eq '/subscriptions/11111111-1111-4111-8111-111111111111' }).Tier | Sort-Object -Unique | Should -Be 'T1'
        ($az | Where-Object { $_.RoleName -eq 'Contributor' -and $_.State -eq 'ActivePermanent' }).Tier | Should -Be 'T0'
        ($az | Where-Object Scope -Like '*resourceGroups/rg-app').Tier | Should -Be 'T2'
    }
    It 'de-duplicates Azure schedules returned at more than one scope' {
        @($script:Run.Inventory.Rows | Where-Object { $_.Plane -eq 'Azure' -and $_.PrincipalId -eq 'a0000000-0000-4000-8000-000000000010' }).Count | Should -Be 1
    }
    It 'reads Azure with api-version 2020-10-01 on management.azure.com only' {
        $arm = @($script:Run.Fake.Calls | Where-Object Uri -Like '*/providers/Microsoft.Authorization/*')
        $arm.Count | Should -BeGreaterThan 0
        foreach ($c in $arm) { $c.Uri | Should -BeLike 'https://management.azure.com/*api-version=2020-10-01*' }
    }
    It 'makes only GET calls' {
        foreach ($c in $script:Run.Fake.Calls) { $c.Method | Should -Be 'GET' }
    }
}

Describe 'Test-PaInventory' {
    It 'PA-INV-01: standing T0 or T1 outside the exceptions is a Finding' {
        (Get-Rule 'PA-INV-01' 'Finding').ObjectId | Should -Contain 'a0000000-0000-4000-8000-000000000001'
    }
    It 'PA-INV-01: an emergency account on the exceptions list is Info, not a Finding' {
        (Get-Rule 'PA-INV-01' 'Info').ObjectId | Should -Contain '0e000000-0000-4000-8000-000000000001'
        (Get-Rule 'PA-INV-01' 'Finding').ObjectId | Should -Not -Contain '0e000000-0000-4000-8000-000000000001'
    }
    It 'PA-INV-01: an exception with no owner does not count' {
        (Get-Rule 'PA-INV-01' 'Finding').ObjectId | Should -Contain '5e000000-0000-4000-8000-000000000001'
    }
    It 'PA-INV-02: a role assigned straight to a user is a Warn' {
        (Get-Rule 'PA-INV-02').ObjectId | Should -Contain 'a0000000-0000-4000-8000-000000000005'
    }
    It 'PA-INV-03: a role-holding group not named PRV-Tn- is a Warn; PRV groups pass' {
        (Get-Rule 'PA-INV-03').Object | Should -Be @('Helpdesk Team')
    }
    It 'PA-INV-04: five Global Administrators, counting group members, is a Finding' {
        (Get-Rule 'PA-INV-04').Issue | Should -Match '^5 principals'
    }
    It 'PA-INV-04: four is not' {
        $inv = $script:Run.Inventory.PSObject.Copy()
        $inv.Rows = @($script:Run.Inventory.Rows | Where-Object PrincipalId -NE 'a0000000-0000-4000-8000-000000000013')
        @(Test-PaInventory -Inventory $inv | Where-Object Rule -EQ 'PA-INV-04').Count | Should -Be 0
    }
    It 'PA-INV-05: an unclassified role is a Warn' {
        (Get-Rule 'PA-INV-05').Object | Should -Contain 'Contoso Directory Writer'
    }
    It 'PA-INV-06: eligibility with no end date is a Warn' {
        (Get-Rule 'PA-INV-06').ObjectId | Should -Be @('a0000000-0000-4000-8000-000000000005')
    }
    It 'PA-INV-07: User Access Administrator at root scope is a Finding' {
        (Get-Rule 'PA-INV-07').ObjectId | Should -Be @('a0000000-0000-4000-8000-000000000001')
    }
    It 'PA-INV-08: more than three subscription owners is a Finding' {
        (Get-Rule 'PA-INV-08').Issue | Should -Match '^5 Owner assignments'
    }
    It 'PA-INV-09: a member returned with id and type only is a Warn, never dropped' {
        (Get-Rule 'PA-INV-09').ObjectId | Should -Be @('a0000000-0000-4000-8000-000000000012')
        $script:Run.Inventory.Rows.PrincipalId | Should -Contain 'a0000000-0000-4000-8000-000000000012'
    }
    It 'the whole fixture: 10 Findings, 7 Warns, 1 Info' {
        @($script:Findings | Where-Object Severity -EQ 'Finding').Count | Should -Be 10
        @($script:Findings | Where-Object Severity -EQ 'Warn').Count | Should -Be 7
        @($script:Findings | Where-Object Severity -EQ 'Info').Count | Should -Be 1
    }
}

Describe 'Invoke-PaInventory.ps1 and the manifest' {
    It 'writes the inventory, the findings and a manifest whose hashes match the files' {
        $out = Join-Path ([IO.Path]::GetTempPath()) ('pa-inv-' + [guid]::NewGuid().Guid.Substring(0, 8))
        try {
            $text = & (Join-Path $PSScriptRoot '../Invoke-PaInventory.ps1') -FixturePath $script:Fixture -OutputPath $out -AzureScope $script:Scopes -ExceptionsPath $script:Exceptions -ControlPlaneSubscriptionId '22222222-2222-4222-8222-222222222222'
            ($text -join "`n") | Should -Match 'Findings: 10 Finding, 7 Warn, 1 Info'
            $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
            $m.cloud | Should -Be 'gcc'
            $m.mode | Should -Be 'Fixture'
            foreach ($p in $m.files.PSObject.Properties) {
                (Get-FileHash (Join-Path $out $p.Name) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $p.Value
            }
            @($m.requests).Count | Should -BeGreaterThan 0
            foreach ($q in $m.requests) { $q.method | Should -Be 'GET' }
        } finally { Remove-Item $out -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
