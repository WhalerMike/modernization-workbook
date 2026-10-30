#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Baseline: Microsoft Learn's own samples, pinned unmodified in examples/third_party and run
# offline (tests/LearnSampleHarness.ps1). Each test pins one thing a sample does or leaves out, so
# a new upstream version that changes it fails here first. The chapters' gap tables cite these.

BeforeAll {
    . (Join-Path $PSScriptRoot 'LearnSampleHarness.ps1')
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/tenant.json'
    $script:Tenant = Get-Content $script:Fixture -Raw | ConvertFrom-Json
    $script:Rows = @((Get-Content (Join-Path $PSScriptRoot 'fixtures/signin-export.json') -Raw | ConvertFrom-Json).rows)
    $script:Ea01 = '0e000000-0000-4000-8000-000000000001'
    $script:Ea02 = '0e000000-0000-4000-8000-000000000002'
}

Describe 'Chapter 01: "List Microsoft Entra role assignments" (Learn), run as published' {
    It 'lists every active assignment across all roles: the model for the read' {
        $run = Invoke-LearnRoleSample -Name AllRoles -Fixture $script:Fixture
        @($run.Output).Count | Should -Be @($script:Tenant.roleAssignments).Count
        ($run.Output.Id | Sort-Object) | Should -Be ($script:Tenant.roleAssignments.id | Sort-Object)
    }
    It 'sees no eligible assignment: the eligible-only holders are missing' {
        $run = Invoke-LearnRoleSample -Name AllRoles -Fixture $script:Fixture
        $eligibleOnly = @($script:Tenant.roleEligibilitySchedules.principalId | Where-Object { $_ -notin $script:Tenant.roleAssignments.principalId } | Sort-Object -Unique)
        $eligibleOnly.Count | Should -BeGreaterThan 0
        foreach ($p in $eligibleOnly) { $run.Output.PrincipalId | Should -Not -Contain $p }
    }
    It 'makes one assignment call per role definition, plus one for the definitions' {
        $run = Invoke-LearnRoleSample -Name AllRoles -Fixture $script:Fixture
        @($run.Calls | Where-Object Cmdlet -EQ 'Get-MgRoleManagementDirectoryRoleDefinition').Count | Should -Be 1
        @($run.Calls | Where-Object Cmdlet -EQ 'Get-MgRoleManagementDirectoryRoleAssignment').Count | Should -Be @($script:Tenant.roleDefinitions).Count
    }
    It 'passes neither -All nor -PageSize to either cmdlet' {
        $run = Invoke-LearnRoleSample -Name AllRoles -Fixture $script:Fixture
        foreach ($c in $run.Calls) { $c.Bound | Should -Not -Contain 'All'; $c.Bound | Should -Not -Contain 'PageSize' }
    }
    It 'returns a role-assignable group as one principal and never reads its members' {
        $run = Invoke-LearnRoleSample -Name AllRoles -Fixture $script:Fixture
        $run.Output.PrincipalId | Should -Contain '9e000000-0000-4000-8000-000000000008'
        $run.Output.PrincipalId | Should -Not -Contain 'a0000000-0000-4000-8000-000000000002'
    }
    It 'resolves no names and assigns no tier: it prints role definition and principal IDs' {
        $code = Get-LearnRoleSample -Name AllRoles
        $code | Should -Not -Match 'DisplayName|tier|Tier'
    }
    It 'signs in with Connect-MgGraph and no environment or scopes' {
        $run = Invoke-LearnRoleSample -Name Connect -Fixture $script:Fixture
        $run.Connected.Bound | Should -Not -Contain 'Environment'
        $run.Connected.Bound | Should -Not -Contain 'Scopes'
    }
    It 'reads transitive assignments from beta, on a hard-coded graph.microsoft.com' {
        Get-LearnRoleSample -Name Transitive | Should -Match ([regex]::Escape('https://graph.microsoft.com/beta/roleManagement/directory/transitiveRoleAssignments'))
    }
    It 'reads no Azure role assignments: nothing on the page calls Resource Manager or Az' {
        $all = (Get-LearnBlock -Page $script:RolePage -Language 'powershell') -join "`n"
        $all | Should -Not -Match 'management\.azure\.com|Get-AzRole|Invoke-AzRestMethod'
    }
}

Describe 'Chapter 02: "Manage emergency access accounts" alert queries (Learn), as published' {
    It 'has three queries, all on SigninLogs' {
        $qs = Get-LearnEmergencyQuery
        $qs.Count | Should -Be 3
        foreach ($q in $qs) { (ConvertFrom-LearnKql $q).Table | Should -Be 'SigninLogs' }
    }
    It 'uses Learn''s placeholder IDs and domain, which must be replaced' {
        $qs = Get-LearnEmergencyQuery
        $qs[1] | Should -Match '00aa00aa-bb11-cc22-dd33-44ee44ee44ee'
        $qs[2] | Should -Match 'user@yourdomain\.onmicrosoft\.com'
    }
    It 'with real object IDs, catches interactive sign-ins: the model for the alert' {
        $q = (Get-LearnEmergencyQuery)[1] -replace '00aa00aa-bb11-cc22-dd33-44ee44ee44ee', $script:Ea01 -replace '11bb11bb-cc22-dd33-ee44-55ff55ff55ff', $script:Ea02
        $hits = @(Invoke-LearnKql -Parsed (ConvertFrom-LearnKql $q) -Rows $script:Rows)
        $hits.Count | Should -Be 2
        ($hits.Table | Sort-Object -Unique) | Should -Be 'SigninLogs'
    }
    It 'misses non-interactive sign-ins' {
        $q = (Get-LearnEmergencyQuery)[1] -replace '00aa00aa-bb11-cc22-dd33-44ee44ee44ee', $script:Ea01 -replace '11bb11bb-cc22-dd33-ee44-55ff55ff55ff', $script:Ea02
        $hits = @(Invoke-LearnKql -Parsed (ConvertFrom-LearnKql $q) -Rows $script:Rows)
        @($script:Rows | Where-Object Table -EQ 'AADNonInteractiveUserSignInLogs').Count | Should -Be 1
        $hits.Table | Should -Not -Contain 'AADNonInteractiveUserSignInLogs'
    }
    It 'misses audit events by or on the accounts, though the page says to monitor audit logs' {
        $q = (Get-LearnEmergencyQuery)[1] -replace '00aa00aa-bb11-cc22-dd33-44ee44ee44ee', $script:Ea01 -replace '11bb11bb-cc22-dd33-ee44-55ff55ff55ff', $script:Ea02
        $hits = @(Invoke-LearnKql -Parsed (ConvertFrom-LearnKql $q) -Rows $script:Rows)
        @($script:Rows | Where-Object Table -EQ 'AuditLogs').Count | Should -Be 2
        $hits.Table | Should -Not -Contain 'AuditLogs'
        (Get-Content $script:EmergencyPage -Raw) | Should -Match 'Monitor sign-in and audit logs'
    }
    It 'the UPN query misses the account once it is renamed' {
        $q = (Get-LearnEmergencyQuery)[2] -replace 'user@yourdomain\.onmicrosoft\.com', 'ea02@contoso.example'
        @(Invoke-LearnKql -Parsed (ConvertFrom-LearnKql $q) -Rows $script:Rows).Count | Should -Be 0
    }
    It 'has no alert rule as code: severity, threshold and action group are portal steps' {
        $page = Get-Content $script:EmergencyPage -Raw
        ([regex]::Matches($page, '(?m)^\s*```(\w+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique) | Should -Be 'kusto'
    }
}
