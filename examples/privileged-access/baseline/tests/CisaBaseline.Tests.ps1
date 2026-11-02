#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# CISA's Microsoft Entra ID baseline: the checks for MS.AAD.7.1v1 (the Global Administrator floor,
# in Chapter 01's PA-INV-04) and MS.AAD.7.7v1 and MS.AAD.7.8v1 (the PIM alerts, Chapter 04's
# PA-PIM-10 and PA-PIM-11), against fictional tenants served by the fakes. A separate suite from
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
        $policies = Get-PaPimRolePolicy -Client $client -RoleTemplateId (Get-PaPimHighlyPrivilegedRole).RoleTemplateId
        [pscustomobject]@{ Fake = $fake; Client = $client; Findings = @(Test-PaPimAlertSetting -Policies $policies) }
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
    It 'needs one read permission and refuses to write' {
        $p = Get-PaPimRequiredPermission -Task pim-alerts
        $p.GraphPermissions | Should -Be @('RoleManagementPolicy.Read.Directory')
        $p.Write | Should -BeNullOrEmpty
        $p.DelegatedRole | Should -Be 'Global Reader'
        $fake = New-PaPimFixtureInvoker -Path (Join-Path $script:Fixtures 'pim-alerts-set.json')
        { New-PaPimClient -Cloud gcc -Task pim-alerts -Invoke $fake.Invoke -AllowWrite } | Should -Throw '*only reads*'
        $c = New-PaPimClient -Cloud gcc -Task pim-alerts -Invoke $fake.Invoke
        { Invoke-PaPimRequest -Client $c -CallId pim-eligibility-schedules } | Should -Throw '*Undeclared call*'
    }
    It 'PIM''s default notifications fail both: eight PA-PIM-10 Findings and one PA-PIM-11' {
        $r = Get-AlertFinding (Join-Path $script:Kit 'tests/fixtures/ch04/tenant.json')
        @($r.Findings | Where-Object { $_.Rule -eq 'PA-PIM-10' -and $_.Severity -eq 'Finding' }).Count | Should -Be 8
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
    It 'sends one GET per role, on the cloud''s own Graph host' {
        $r = Get-AlertFinding (Join-Path $script:Fixtures 'pim-alerts-set.json') 'gcchigh'
        @($r.Fake.Calls).Count | Should -Be 8
        foreach ($c in $r.Fake.Calls) {
            $c.Method | Should -Be 'GET'
            $c.Uri | Should -BeLike 'https://graph.microsoft.us/v1.0/policies/roleManagementPolicyAssignments?*'
        }
    }
    It 'the entry script writes findings.json and a manifest that records only GETs' {
        $out = Join-Path $TestDrive 'pim-alerts'
        $text = & (Join-Path $script:Kit 'Invoke-PaPimAlertCheck.ps1') -Cloud gcc -FixturePath (Join-Path $script:Fixtures 'pim-alerts-partial.json') -OutputPath $out
        $text | Should -Contain '2 Finding, 7 Info'
        $text | Should -Contain 'Global Administrator activation alert (MS.AAD.7.8v1): not set'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'pim-alerts'
        $m.graphPermissions | Should -Be @('RoleManagementPolicy.Read.Directory')
        @($m.requests | Where-Object method -NE 'GET').Count | Should -Be 0
        @(Get-Content (Join-Path $out 'findings.json') -Raw | ConvertFrom-Json).Count | Should -Be 9
    }
}
