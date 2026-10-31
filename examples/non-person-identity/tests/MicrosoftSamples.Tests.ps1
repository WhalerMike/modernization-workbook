#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Baseline: Microsoft Learn's own samples, pinned unmodified in examples/third_party and run offline
# (tests/LearnSampleHarness.ps1). Each test pins one thing a sample does or leaves out, so a new
# upstream version that changes it fails here first. The chapters' gap tables cite these.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiCore/NpiCore.psm1') -Force
    . (Join-Path $PSScriptRoot 'LearnSampleHarness.ps1')
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Estate = Get-Content $script:Fixture -Raw | ConvertFrom-Json -AsHashtable
    $script:Users = @($script:Estate.ad.objects | Where-Object { $_.ObjectClass -eq 'user' })
}

Describe 'Chapter 01: "Secure user-based service accounts" (Learn), run as published' {
    It 'finds user accounts with service principal names: the model for the SPN criterion' {
        $run = Invoke-LearnAdSample -Name Spn -Fixture $script:Fixture
        $expected = @($script:Users | Where-Object { @($_.ServicePrincipalName).Count } | ForEach-Object SamAccountName | Sort-Object)
        (@($run.Output.SamAccountName) | Sort-Object) | Should -Be $expected
    }
    It 'reads every user in the domain with -Filter * and filters on the client' {
        foreach ($n in 'Spn', 'PasswordNeverExpires') {
            $run = Invoke-LearnAdSample -Name $n -Fixture $script:Fixture
            $run.Calls[0].Filter | Should -Be '*'
        }
    }
    It 'runs three separate queries, so one account lands in several lists and no list is a register' {
        $spn = (Invoke-LearnAdSample -Name Spn -Fixture $script:Fixture).Output.SamAccountName
        $pne = (Invoke-LearnAdSample -Name PasswordNeverExpires -Fixture $script:Fixture).Output.SamAccountName
        $spn | Should -Contain 'svc-hrsync'
        $pne | Should -Contain 'svc-hrsync'
    }
    It 'returns a person with a password that never expires, with nothing to tell them apart' {
        $run = Invoke-LearnAdSample -Name PasswordNeverExpires -Fixture $script:Fixture
        $run.Output.SamAccountName | Should -Contain 'jdoe'
    }
    It 'returns computer accounts from the delegation query' {
        $run = Invoke-LearnAdSample -Name Delegation -Fixture $script:Fixture
        ($run.Output | Where-Object ObjectClass -EQ 'computer').samAccountName | Should -Be 'SRV-APP01$'
        ($run.Output | Where-Object samAccountName -EQ 'svc-webfront').DelegationStatus | Should -Be 'AllServices'
    }
    It 'reads no last logon, password age or group membership, though the page says to assess them' {
        foreach ($n in 'Spn', 'PasswordNeverExpires') {
            $props = (Invoke-LearnAdSample -Name $n -Fixture $script:Fixture).Calls[0].Properties
            $props | Should -Not -Contain 'LastLogonDate'
            $props | Should -Not -Contain 'PasswordLastSet'
            $props | Should -Not -Contain 'MemberOf'
        }
        (Get-Content $script:UserPage -Raw) | Should -Match 'Accounts with membership in privileged groups'
    }
}

Describe 'Chapter 01: "Secure group managed service accounts" (Learn), run as published' {
    It 'lists every managed service account, then the gMSAs: the model for the MSA and gMSA read' {
        $run = Invoke-LearnAdSample -Name ServiceAccounts -Fixture $script:Fixture
        @($run.Output).Count | Should -Be (@($script:Estate.ad.serviceAccounts).Count + @($script:Estate.ad.serviceAccounts | Where-Object ObjectClass -EQ 'msDS-GroupManagedServiceAccount').Count)
    }
    It 'runs as published, en dash before -Filter included' {
        Get-LearnAdSample -Name ServiceAccounts | Should -Match ([char]0x2013 + 'Filter')
        { Invoke-LearnAdSample -Name ServiceAccounts -Fixture $script:Fixture } | Should -Not -Throw
    }
    It 'names two object classes; a dMSA comes back unlabeled and the gMSA filter drops it' {
        $code = Get-LearnAdSample -Name ServiceAccounts
        $code | Should -Not -Match 'msDS-DelegatedManagedServiceAccount'
        $run = Invoke-LearnAdSample -Name ServiceAccounts -Fixture $script:Fixture
        @($run.Output | Where-Object ObjectClass -EQ 'msDS-DelegatedManagedServiceAccount').Count | Should -Be 1
    }
    It 'reads no PrincipalsAllowedToRetrieveManagedPassword or group membership' {
        $run = Invoke-LearnAdSample -Name ServiceAccounts -Fixture $script:Fixture
        foreach ($c in $run.Calls) { $c.Properties | Should -BeNullOrEmpty }
    }
}

Describe 'Chapter 01: "Securing service principals" (Learn), run as published' {
    It 'lists every service principal with Get-MgServicePrincipal -All:$true: the model for the Entra read' {
        $run = Invoke-LearnSpSample -Name All -Fixture $script:Fixture
        @($run.Output).Count | Should -Be @($script:Estate.graph.servicePrincipals).Count
        $run.Calls[0].Bound | Should -Contain 'All'
    }
    It 'returns single-tenant apps from the filter it offers for finding multitenant apps' {
        $run = Invoke-LearnSpSample -Name Tagged -Fixture $script:Fixture
        ($run.Output | Where-Object SignInAudience -EQ 'AzureADMyOrg').DisplayName | Should -Contain 'Payroll Export'
        (Get-Content $script:SpPage -Raw) | Should -Match 'find multi-tenant apps'
    }
}

Describe 'Chapter 01: "Export secrets and certificates for app registrations" (Learn), run as published' {
    BeforeAll { $script:Export = Invoke-LearnExportScript -Fixture $script:Fixture }
    It 'lists every secret and certificate on every app registration: the model for the credential read' {
        $creds = @($script:Estate.graph.applications | ForEach-Object { @($_.passwordCredentials) + @($_.keyCredentials) } | Where-Object { $_ })
        @($script:Export.Output | Where-Object { $_.'Secret Name' -or $_.'Certificate Name' }).Count | Should -Be $creds.Count
    }
    It 'asks for the output path with Read-Host, so it can''t run unattended' {
        $script:Export.Prompts.Count | Should -Be 1
    }
    It 'reads each app again with Get-MgApplication, one call per app plus the list' {
        @($script:Export.Calls | Where-Object Cmdlet -EQ 'Get-MgApplication').Count | Should -Be (1 + @($script:Estate.graph.applications).Count)
    }
    It 'reads owners once per credential, without -All, and never for an app with no credential' {
        $ownerCalls = @($script:Export.Calls | Where-Object Cmdlet -EQ 'Get-MgApplicationOwner')
        $ownerCalls.Count | Should -Be @($script:Estate.graph.applications | ForEach-Object { @($_.passwordCredentials) + @($_.keyCredentials) } | Where-Object { $_ }).Count
        foreach ($c in $ownerCalls) { $c.Bound | Should -Not -Contain 'All' }
        $ownerCalls.ApplicationId | Should -Not -Contain '0a000000-0000-4000-8000-000000000004'
    }
    It 'reports a guest owner like any other and counts no owners' {
        ($script:Export.Output | Where-Object { $_.ApplicationName -eq 'Vendor Portal' -and $_.'Certificate Name' }).Owner | Should -Match '#EXT#'
        $script:Export.Output[0].PSObject.Properties.Name | Should -Not -Contain 'OwnerCount'
    }
    It 'reads no federated credentials, service principals or managed identities' {
        Get-LearnExportScript | Should -Not -Match 'FederatedIdentityCredential|Get-MgServicePrincipal'
    }
    It 'flags no expired credential, though the page''s explanation says it asks about expiry' {
        ($script:Export.Output | Where-Object { $_.'Secret Name' -eq 'old' }).'Secret End Date' | Should -Not -BeNullOrEmpty
        $script:Export.Output[0].PSObject.Properties.Name | Should -Not -Match 'Expired'
        (Get-Content $script:ExportPage -Raw) | Should -Match 'asked about the expiration date'
    }
    It 'signs in with Application.Read.All and no environment' {
        $script:Export.Connected.Scopes | Should -Be @('Application.Read.All')
        $script:Export.Connected.Bound | Should -Not -Contain 'Environment'
    }
}

Describe 'Chapter 02: "Manage Microsoft Entra applications using Microsoft Graph" (Learn), as published' {
    BeforeAll {
        $script:Ownerless = Get-LearnHttpSample -Name 'tutorial-application-basics-ownerless-serviceprincipals'
        $script:Tutorial = Get-Content $script:TutorialPage -Raw
    }
    It 'finds service principals with no owner or one owner: the model for the ownership read' {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -PageSize 100
        $resp = Send-LearnHttpSample -Sample $script:Ownerless -Fake $fake
        $o = $script:Estate.graph.servicePrincipalOwners
        $expected = @($script:Estate.graph.servicePrincipals | Where-Object { @($(if ($o.ContainsKey($_.id)) { $o[$_.id] })).Count -le 1 })
        $resp['@odata.count'] | Should -Be $expected.Count
    }
    It 'needs ConsistencyLevel: eventual, and fails without it' {
        $script:Ownerless.Headers['ConsistencyLevel'] | Should -Be 'eventual'
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -PageSize 100
        { Send-LearnHttpSample -Sample $script:Ownerless -Fake $fake -NoHeaders } | Should -Throw '*ConsistencyLevel*'
    }
    It 'returns managed identities, an external app and Microsoft Graph itself among the "ownerless"' {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -PageSize 100
        $names = (Send-LearnHttpSample -Sample $script:Ownerless -Fake $fake).value.displayName
        foreach ($n in 'vm-batch01', 'id-deploy', 'Partner CRM', 'Microsoft Graph') { $names | Should -Contain $n }
    }
    It 'reads service principal owners, so an app registration with one owner is missed' {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -PageSize 100
        $names = (Send-LearnHttpSample -Sample $script:Ownerless -Fake $fake).value.displayName
        @($script:Estate.graph.applicationOwners['0a000000-0000-4000-8000-000000000002']).Count | Should -Be 1
        $names | Should -Not -Contain 'HR Connector'
    }
    It 'counts a guest and a service principal as owners like any person' {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -PageSize 100
        $names = (Send-LearnHttpSample -Sample $script:Ownerless -Fake $fake).value.displayName
        $names | Should -Not -Contain 'Vendor Portal'
        $names | Should -Not -Contain 'Build Pipeline'
    }
    It 'labels this read with Application.ReadWrite.All, a write permission' {
        $script:Tutorial | Should -Match '### Identify ownerless service principals or those with only one owner\s+Least privileged delegated permission: `Application\.ReadWrite\.All`'
    }
    It 'adds any directory object as an owner, a service principal included' {
        $s = Get-LearnHttpSample -Name 'tutorial-application-basics-assign-app-owner'
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -AllowWrite
        $null = Send-LearnHttpSample -Sample $s -Fake $fake -Replace @{ '7b45cf6d-9083-4eb2-92c4-a7e090f1fc40' = '0a000000-0000-4000-8000-000000000003'; '8afc02cb-4d62-4dba-b536-9f6d73e9be26' = '5b000000-0000-4000-8000-000000000007' }
        $fake.Estate.graph.applicationOwners['0a000000-0000-4000-8000-000000000003'].'@odata.type' | Should -Be '#microsoft.graph.servicePrincipal'
    }
    It 'hard-codes graph.microsoft.com in every request' {
        foreach ($n in 'tutorial-application-basics-ownerless-serviceprincipals', 'tutorial-application-basics-assign-app-owner', 'tutorial-application-basics-assign-serviceprincipal-owner') {
            (Get-LearnHttpSample -Name $n).Uri | Should -Match '^https://graph\.microsoft\.com/v1\.0/'
        }
    }
    It 'sets serviceManagementReference to free text, not a record key' {
        $smr = (Get-LearnHttpSample -Name 'tutorial-application-basics-update-app').Body.serviceManagementReference
        $smr | Should -Match '^Owners aliases:'
        $smr | Should -Not -Match '^[A-Z]+-\d+$'
    }
    It 'has no step that disables an orphan: the orphan rule is left to you' {
        $script:Tutorial | Should -Not -Match 'accountEnabled'
    }
}
