#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 02: the emergency access check, the alert query and the alert rule template, against
# the fictional tenant served by the fake and fictional exported log rows.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/tenant.json'
    $script:ConfigPath = Join-Path $PSScriptRoot 'fixtures/inputs/emergency-access.json'
    $script:Validations = @(Import-Csv (Join-Path $PSScriptRoot 'fixtures/inputs/emergency-validations.csv'))
    $script:Rows = @((Get-Content (Join-Path $PSScriptRoot 'fixtures/signin-export.json') -Raw | ConvertFrom-Json).rows)
    $script:Ea01 = '0e000000-0000-4000-8000-000000000001'
    $script:Ea02 = '0e000000-0000-4000-8000-000000000002'
    $script:Group = '9e000000-0000-4000-8000-000000000001'
    $script:Ws = '/subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/Microsoft.OperationalInsights/workspaces/law-identity'
    $script:Ag = '/subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/Microsoft.Insights/actionGroups/ag-soc'

    # Run the check against the fixture, optionally changed in memory first.
    function Invoke-Check([scriptblock]$Change, [hashtable]$Config, [object[]]$Validations = $script:Validations) {
        $fake = New-PaFixtureInvoker -Path $script:Fixture
        if ($Change) { & $Change $fake.Tenant }
        $cfg = if ($Config) { $Config } else { Read-PaEmergencyConfig $script:ConfigPath }
        $r = New-PaReader -Cloud gcc -Task emergency-access -Invoke $fake.Invoke
        [pscustomobject]@{ Fake = $fake; Findings = @(Test-PaEmergencyAccess -Reader $r -Config $cfg -Validations $Validations -AsOf ([datetime]'2026-10-30')) }
    }
    # The fixture with ea02 brought up to the standard and the extra group member removed.
    $script:Fix = {
        param($t)
        $t.users[$script:Ea02].userPrincipalName = 'ea02@contosoexample.onmicrosoft.com'
        $i = $t.roleAssignmentScheduleInstances | Where-Object principalId -EQ $script:Ea02
        $i.endDateTime = $null; $i.startDateTime = $null
        $t.authMethods[$script:Ea02] = @($t.authMethods[$script:Ea02] | Where-Object { $_['@odata.type'] -ne '#microsoft.graph.phoneAuthenticationMethod' })
        $t.groupMembers[$script:Group] = @(
            @{ '@odata.type' = '#microsoft.graph.user'; id = $script:Ea01; displayName = 'Emergency Access 01'; userPrincipalName = 'ea01@contosoexample.onmicrosoft.com' },
            @{ '@odata.type' = '#microsoft.graph.user'; id = $script:Ea02; displayName = 'Emergency Access 02'; userPrincipalName = 'ea02@contosoexample.onmicrosoft.com' })
        ($t.conditionalAccessPolicies | Where-Object displayName -Like 'CA004*').conditions.users.excludeGroups = @($script:Group)
    }
    $script:Recent = @(
        [pscustomobject]@{ AccountId = $script:Ea01; Date = '2026-09-15'; Result = 'Pass'; Ticket = 'CHG-1042' },
        [pscustomobject]@{ AccountId = $script:Ea02; Date = '2026-10-20'; Result = 'Pass'; Ticket = 'CHG-1101' })
    $script:Run = Invoke-Check
    function Get-Rule($run, $id, $sev) { @($run.Findings | Where-Object { $_.Rule -eq $id -and (-not $sev -or $_.Severity -eq $sev) }) }
}

Describe 'Read-PaEmergencyConfig' {
    It 'reads the fixture configuration with its defaults' {
        $c = Read-PaEmergencyConfig $script:ConfigPath
        @($c.accounts).Count | Should -Be 2
        $c.maxValidationAgeDays | Should -Be 90
    }
    It 'refuses an account named by UPN instead of object ID' {
        $p = Join-Path ([IO.Path]::GetTempPath()) "pa-ea-$([guid]::NewGuid().Guid.Substring(0,8)).json"
        '{ "accounts": [ { "id": "ea01@contosoexample.onmicrosoft.com" } ], "exclusionGroupId": "9e000000-0000-4000-8000-000000000001" }' | Set-Content $p
        try { { Read-PaEmergencyConfig $p } | Should -Throw '*object ID*' } finally { Remove-Item $p }
    }
}

Describe 'Test-PaEmergencyAccess on the fixture' {
    It 'needs exactly these Graph permissions, all read-only' {
        (Get-PaRequiredPermission -Task emergency-access).GraphPermissions | Should -Be @('GroupMember.ReadBasic.All', 'Policy.Read.All', 'RoleAssignmentSchedule.Read.Directory', 'User.Read.All', 'User.ReadBasic.All', 'UserAuthenticationMethod.Read.All')
    }
    It 'makes only GET calls, all to graph.microsoft.com' {
        foreach ($c in $script:Run.Fake.Calls) { $c.Method | Should -Be 'GET'; $c.Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/*' }
    }
    It 'passes ea01, which meets the standard' {
        @($script:Run.Findings | Where-Object { $_.ObjectId -eq $script:Ea01 -and $_.Severity -eq 'Finding' }).Count | Should -Be 0
    }
    It 'PA-EA-02: an account off the onmicrosoft.com domain' { (Get-Rule $script:Run 'PA-EA-02').ObjectId | Should -Be @($script:Ea02) }
    It 'PA-EA-05: Global Administrator active but time-bound' { (Get-Rule $script:Run 'PA-EA-05').Issue | Should -Match 'time-bound' }
    It 'PA-EA-06: a phone method is a Finding' { (Get-Rule $script:Run 'PA-EA-06' 'Finding').Issue | Should -Match 'phoneAuthenticationMethod' }
    It 'PA-EA-07: not in the exclusion group' { (Get-Rule $script:Run 'PA-EA-07').ObjectId | Should -Be @($script:Ea02) }
    It 'PA-EA-08: enforced policies that miss an account; report-only is Info; disabled is ignored' {
        (Get-Rule $script:Run 'PA-EA-08' 'Finding').Object | Should -Be @('CA001-All-Block-legacy-authentication', 'CA004-Admins-Require-compliant-device', 'PIM-Activation-c1')
        (Get-Rule $script:Run 'PA-EA-08' 'Info').Object | Should -Be @('CA090-Emergency-accounts-Report-sign-ins')
        (Get-Rule $script:Run 'PA-EA-08').Object | Should -Not -Contain 'CA099-Retired-Pilot'
    }
    It 'PA-EA-09: a validation older than 90 days' { (Get-Rule $script:Run 'PA-EA-09').Issue | Should -Match '2026-05-01' }
    It 'PA-EA-10: another member of the exclusion group' { (Get-Rule $script:Run 'PA-EA-10').Object | Should -Be @('carl.ops@contoso.example') }
    It 'the whole fixture: 9 Findings, no Warn, 1 Info' {
        @($script:Run.Findings | Where-Object Severity -EQ 'Finding').Count | Should -Be 9
        @($script:Run.Findings | Where-Object Severity -EQ 'Warn').Count | Should -Be 0
        @($script:Run.Findings | Where-Object Severity -EQ 'Info').Count | Should -Be 1
    }
}

Describe 'Test-PaEmergencyAccess, each rule on its own' {
    It 'a tenant brought up to the standard has no Finding' {
        $run = Invoke-Check -Change $script:Fix -Validations $script:Recent
        @($run.Findings | Where-Object Severity -EQ 'Finding') | Should -BeNullOrEmpty
    }
    It 'PA-EA-01: one account is not enough' {
        $c = Read-PaEmergencyConfig $script:ConfigPath; $c.accounts = @($c.accounts[0])
        (Get-Rule (Invoke-Check -Change $script:Fix -Config $c -Validations $script:Recent) 'PA-EA-01').Count | Should -Be 1
    }
    It 'PA-EA-03: a synchronized account' {
        $run = Invoke-Check -Change { param($t) & $script:Fix $t; $t.users[$script:Ea01].onPremisesSyncEnabled = $true } -Validations $script:Recent
        (Get-Rule $run 'PA-EA-03').ObjectId | Should -Be @($script:Ea01)
    }
    It 'PA-EA-04: a disabled account' {
        $run = Invoke-Check -Change { param($t) & $script:Fix $t; $t.users[$script:Ea01].accountEnabled = $false } -Validations $script:Recent
        (Get-Rule $run 'PA-EA-04').ObjectId | Should -Be @($script:Ea01)
    }
    It 'PA-EA-05: eligible only, with no active assignment' {
        $run = Invoke-Check -Change { param($t) & $script:Fix $t; $t.roleAssignmentScheduleInstances = @($t.roleAssignmentScheduleInstances | Where-Object principalId -NE $script:Ea01) } -Validations $script:Recent
        (Get-Rule $run 'PA-EA-05').Issue | Should -Match 'eligible only, or none'
    }
    It 'PA-EA-06: no passkey is a Warn, to confirm certificate-based authentication' {
        $run = Invoke-Check -Change { param($t) & $script:Fix $t; $t.authMethods[$script:Ea01] = @($t.authMethods[$script:Ea01] | Where-Object { $_['@odata.type'] -ne '#microsoft.graph.fido2AuthenticationMethod' }) } -Validations $script:Recent
        (Get-Rule $run 'PA-EA-06' 'Warn').ObjectId | Should -Be @($script:Ea01)
    }
    It 'PA-EA-08: an account excluded directly, not through the group, still passes' {
        $run = Invoke-Check -Change { param($t) & $script:Fix $t; $p = $t.conditionalAccessPolicies | Where-Object displayName -Like 'CA004*'; $p.conditions.users.excludeGroups = @(); $p.conditions.users.excludeUsers = @($script:Ea01, $script:Ea02) } -Validations $script:Recent
        (Get-Rule $run 'PA-EA-08' 'Finding') | Should -BeNullOrEmpty
    }
    It 'PA-EA-09: no validation at all is a Finding' {
        (Get-Rule (Invoke-Check -Change $script:Fix -Validations @()) 'PA-EA-09').Count | Should -Be 2
    }
}

Describe 'The alert query and rule' {
    It 'covers interactive, non-interactive and audit events, by object ID' {
        $q = Get-PaEmergencyQuery -AccountId $script:Ea01, $script:Ea02
        foreach ($t in 'SigninLogs', 'AADNonInteractiveUserSignInLogs', 'AuditLogs') { $q | Should -Match "\($t\b" }
        $q | Should -Match $script:Ea01
        $q | Should -Match 'TargetResources'
        $q | Should -Not -Match 'UserPrincipalName'
    }
    It 'does not use isfuzzy, so a missing table fails the query instead of hiding' {
        Get-PaEmergencyQuery -AccountId $script:Ea01 | Should -Not -Match 'isfuzzy'
    }
    It 'refuses a UPN, and Learn''s placeholder IDs' {
        { Get-PaEmergencyQuery -AccountId 'ea01@contosoexample.onmicrosoft.com' } | Should -Throw '*object ID*'
        { Get-PaEmergencyQuery -AccountId '00aa00aa-bb11-cc22-dd33-44ee44ee44ee' } | Should -Throw '*placeholder*'
    }
    It 'offline, matches all five emergency events in the export and not the ordinary user' {
        $hits = @(Find-PaEmergencyActivity -Rows $script:Rows -AccountId $script:Ea01, $script:Ea02)
        $hits.Count | Should -Be 5
        ($hits.Source | Sort-Object -Unique) | Should -Be @('AADNonInteractiveUserSignInLogs', 'AuditLogs', 'SigninLogs')
        $hits.AccountId | Should -Not -Contain 'a0000000-0000-4000-8000-000000000003'
    }
    It 'the template is a scheduledQueryRules 2023-12-01 log alert: severity 0, any row fires, every 5 minutes' {
        $t = New-PaEmergencyAlertRule -AccountId $script:Ea01, $script:Ea02 -WorkspaceResourceId $script:Ws -ActionGroupResourceId $script:Ag -Location eastus
        $r = $t.resources[0]
        $r.type | Should -Be 'Microsoft.Insights/scheduledQueryRules'
        $r.apiVersion | Should -Be '2023-12-01'
        $r.kind | Should -Be 'LogAlert'
        $r.properties.severity | Should -Be 0
        $r.properties.enabled | Should -BeTrue
        $r.properties.evaluationFrequency | Should -Be 'PT5M'
        $r.properties.scopes | Should -Be @($script:Ws)
        $c = $r.properties.criteria.allOf[0]
        $c.operator | Should -Be 'GreaterThan'; $c.threshold | Should -Be 0; $c.timeAggregation | Should -Be 'Count'
        $r.properties.actions.actionGroups | Should -Be @($script:Ag)
    }
    It 'refuses a scope that is not a Log Analytics workspace, and an action group that is not one' {
        { New-PaEmergencyAlertRule -AccountId $script:Ea01 -WorkspaceResourceId ($script:Ws -replace 'Microsoft.OperationalInsights/workspaces', 'Microsoft.Storage/storageAccounts') -ActionGroupResourceId $script:Ag -Location eastus } | Should -Throw '*workspace*'
        { New-PaEmergencyAlertRule -AccountId $script:Ea01 -WorkspaceResourceId $script:Ws -ActionGroupResourceId $script:Ws -Location eastus } | Should -Throw '*action group*'
    }
    It 'the template has no host in it, so the same file deploys in any Azure cloud' {
        $json = New-PaEmergencyAlertRule -AccountId $script:Ea01 -WorkspaceResourceId $script:Ws -ActionGroupResourceId $script:Ag -Location eastus | ConvertTo-Json -Depth 20
        $json | Should -Not -Match 'management\.(azure\.com|usgovcloudapi\.net)/subscriptions'
    }
}

Describe 'Invoke-PaEmergencyCheck.ps1' {
    It 'writes the findings, the alert template and a manifest whose hashes match' {
        $out = Join-Path ([IO.Path]::GetTempPath()) ('pa-ea-' + [guid]::NewGuid().Guid.Substring(0, 8))
        try {
            $text = & (Join-Path $PSScriptRoot '../Invoke-PaEmergencyCheck.ps1') -FixturePath $script:Fixture -ConfigPath $script:ConfigPath -ValidationsPath (Join-Path $PSScriptRoot 'fixtures/inputs/emergency-validations.csv') -AsOf '2026-10-30' -OutputPath $out -WorkspaceResourceId $script:Ws -ActionGroupResourceId $script:Ag -Location eastus
            ($text -join "`n") | Should -Match 'Emergency access: 9 Finding, 0 Warn, 1 Info'
            $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
            @($m.files.PSObject.Properties.Name) | Should -Be @('emergency-alert.json', 'findings.json')
            foreach ($p in $m.files.PSObject.Properties) { (Get-FileHash (Join-Path $out $p.Name) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $p.Value }
        } finally { Remove-Item $out -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
