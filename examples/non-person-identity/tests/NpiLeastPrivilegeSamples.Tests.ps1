#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 07's baseline: Learn's "Review permissions granted to enterprise applications", pinned
# unmodified in examples/third_party/entra-review-app-permissions-page and run offline
# (tests/LeastPrivilegeSampleHarness.ps1). Each test pins one thing the sample does or leaves out,
# so a new upstream version that changes it fails here first. Chapter 07's gap table cites these.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1') -Force
    . (Join-Path $PSScriptRoot 'LeastPrivilegeSampleHarness.ps1')
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch07/estate-ch07.json')).Path
    $script:Page = Get-Content $script:LpPage -Raw
    $script:Mail = '5b000000-0000-4000-8000-000000000006'   # Mail Automation
    $script:Run = Invoke-LpLearnGraphPsScript -Fixture $script:Fixture -TargetId $script:Mail
}

Describe 'Chapter 07: "Review permissions granted to enterprise applications" (Learn), run as published' {
    It 'lists an app''s grants with GET appRoleAssignments and oauth2PermissionGrants, and removes one through the resource: the model for the calls' {
        $req = @(Get-LpLearnHttpRequest)
        $paths = @($req | ForEach-Object { "$($_.Method) " + ($_.Uri -replace '^https://graph\.microsoft\.com/v1\.0', '' -replace '\{[^}]+\}', '{}') })
        $paths | Should -Contain 'GET /servicePrincipals/{}/appRoleAssignments'
        $paths | Should -Contain 'GET /servicePrincipals/{}/oauth2PermissionGrants'
        $paths | Should -Contain 'DELETE /servicePrincipals/{}/appRoleAssignedTo/{}'
        $ours = @(Get-NpiLpCall | ForEach-Object { "$($_.method) " + ($_.path -replace '\{[^}]+\}', '{}') })
        foreach ($p in 'GET /servicePrincipals/{}/appRoleAssignments', 'GET /servicePrincipals/{}/oauth2PermissionGrants', 'DELETE /servicePrincipals/{}/appRoleAssignedTo/{}') { $ours | Should -Contain $p }
        ($req | Where-Object Method -EQ 'DELETE' | Where-Object Uri -Match 'appRoleAssignedTo').Uri | Should -Match '\{resource-servicePrincipal-id\}'
    }
    It 'removes every delegated grant the app holds, with no list of what to keep and no dry run' {
        $script:Run.Calls.Cmdlet | Should -Contain 'Remove-MgOauth2PermissionGrant'
        @($script:Run.Estate.graph.oauth2PermissionGrants | Where-Object clientId -EQ $script:Mail).Count | Should -Be 0
        # og-03 was User.Read for one person: not broad, removed all the same.
        @($script:Run.Calls | Where-Object Cmdlet -EQ 'Remove-MgOauth2PermissionGrant').Id | Should -Be 'og-03'
    }
    It 'tries to remove every application permission, the excepted Mail.Send included' {
        @($script:Run.Calls | Where-Object Cmdlet -EQ 'Remove-MgServicePrincipalAppRoleAssignedTo').AssignmentId | Sort-Object | Should -Be @('ar-01', 'ar-02', 'ar-07')
    }
    It 'reads every delegated grant in the tenant to find one app''s' {
        $c = @($script:Run.Calls | Where-Object Cmdlet -EQ 'Get-MgOauth2PermissionGrant')
        $c.Count | Should -Be 1
        $c[0].Bound | Should -Be @('All')
    }
    It 'passes the app''s own ID where Learn''s API names the resource''s, so no application permission is removed' {
        foreach ($c in @($script:Run.Calls | Where-Object Cmdlet -EQ 'Remove-MgServicePrincipalAppRoleAssignedTo')) { $c.Id | Should -Be $script:Mail }
        @($script:Run.Errors | Where-Object { $_.FullyQualifiedErrorId -like 'Request_ResourceNotFound*' }).Count | Should -Be 3
        @($script:Run.Estate.graph.appRoleAssignments | Where-Object principalId -EQ $script:Mail).id | Sort-Object | Should -Be @('ar-01', 'ar-02', 'ar-07')
    }
    It 'has an example line that isn''t a command: run as a script it fails, and the script carries on' {
        (Get-LpLearnGraphPsScript) | Should -Match '(?m)^Example: Get-MgServicePrincipal'
        @($script:Run.Errors | Where-Object { $_.FullyQualifiedErrorId -eq 'CommandNotFoundException' }).Count | Should -Be 1
        $script:Run.Calls.Cmdlet | Should -Contain 'Get-MgServicePrincipalAppRoleAssignment'
    }
    It 'signs in with Directory.ReadWrite.All and three other write permissions; the reads need Application.Read.All and Directory.Read.All' {
        $script:Run.Scopes | Should -Be @('Application.ReadWrite.All', 'Directory.ReadWrite.All', 'DelegatedPermissionGrant.ReadWrite.All', 'AppRoleAssignment.ReadWrite.All')
        $reads = @(Get-NpiLpCall -Task least-privilege | Where-Object { $_.id -in 'graph-lp-app-role-assignments', 'graph-lp-oauth2-grants' } | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        $reads | Should -Be @('Application.Read.All', 'Directory.Read.All')
    }
    It 'names Cloud Application Administrator, where Delete appRoleAssignedTo names Privileged Role Administrator for Microsoft Graph app roles' {
        $script:Page | Should -Match 'Microsoft Graph PowerShell script to revoke all permissions granted to an application\. You need to sign in as at least a \[Cloud Application Administrator\]'
        (Get-NpiLpTask -Task least-privilege-apply).delegatedRole | Should -Be 'Privileged Role Administrator'
    }
    It 'hard-codes graph.microsoft.com in every request' {
        foreach ($r in @(Get-LpLearnHttpRequest)) { $r.Uri | Should -Match '^https://graph\.microsoft\.com/v1\.0/' }
    }
    It 'reads no directory roles and no Azure role assignments; Exchange RBAC is named only as text' {
        $script:Page | Should -Match 'Exchange RBAC'
        $script:Page | Should -Not -Match 'roleManagement|Microsoft\.Authorization|/roleAssignments'
    }
}
