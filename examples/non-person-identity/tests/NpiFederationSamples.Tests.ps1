#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 05 baseline: Microsoft's own samples for federated identity credentials and user-assigned managed
# identities, pinned unmodified in examples/third_party and run offline (tests/FederationSampleHarness.ps1).
# Each test pins one thing a sample does or leaves out, so a new upstream version that changes it fails here
# first. Chapter 05's gap table cites these.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiFederation/NpiFederation.psm1') -Force
    . (Join-Path $PSScriptRoot 'FederationSampleHarness.ps1')
    $script:Tenant = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch05/tenant.json')).Path
    $script:TenantId = 'c0ffee00-0000-4000-8000-000000000001'
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Sub = '11111111-1111-4111-8111-111111111111'
    function New-ExchangeClient([object[]]$Credentials) {
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId $script:TenantId -Credentials $Credentials -AsOf $script:AsOf
        New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -TokenEndpoint $ep
    }
    function Get-GitHubClaims([string]$Repo, [string]$Entity, [string]$Value) { Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = $Repo; entity = $Entity; value = $Value; subjectFormat = 'name-based' } }
}

Describe 'Chapter 05: Graph "Create federatedIdentityCredential" (Learn), sent as published' {
    It 'creates a credential with name, issuer, subject and the one audience: the model for the Graph write' {
        $s = Get-WifGraphSample
        $s.Method | Should -Be 'POST'
        @($s.Body.audiences) | Should -Be @('api://AzureADTokenExchange')
        $fake = New-NpiWifFake -Path $script:Tenant -AllowWrite
        $r = & $fake.Invoke $s.Method $s.Uri.Replace('bcd7c908-1c4d-4d48-93ee-ff38349a75c8', '0a000000-0000-4000-8000-000000000004') $s.Body $null
        $r.name | Should -Be 'testing02'
        $r.id | Should -Match '^[0-9a-f-]{36}$'
    }
    It 'hard-codes graph.microsoft.com and v1.0, and ends the URL with a slash' {
        $s = Get-WifGraphSample
        $s.Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/applications/*/federatedIdentityCredentials/'
    }
    It 'is accepted with any subject: a wrong one fails only at token exchange' {
        $s = Get-WifGraphSample
        $cred = [pscustomobject]@{ ClientId = 'app-under-test'; Name = $s.Body.name; Id = 'x'; Issuer = $s.Body.issuer; Subject = $s.Body.subject; Audiences = @($s.Body.audiences) }
        $c = New-ExchangeClient @($cred)
        $good = [pscustomobject]@{ Issuer = $s.Body.issuer; Subject = $s.Body.subject; Audience = 'api://AzureADTokenExchange'; Note = $null }
        $bad = [pscustomobject]@{ Issuer = $s.Body.issuer; Subject = '00000000-0000-4000-8000-000000000000'; Audience = 'api://AzureADTokenExchange'; Note = $null }
        (Test-NpiWifTokenExchange -Client $c -ClientId 'app-under-test' -Presented $good -CredentialName 'testing02' -AsOf $script:AsOf).Passed | Should -BeTrue
        $r = Test-NpiWifTokenExchange -Client $c -ClientId 'app-under-test' -Presented $bad -CredentialName 'testing02' -AsOf $script:AsOf
        $r.Passed | Should -BeFalse
        $r.Error | Should -Match 'AADSTS70021'
    }
}

Describe 'Chapter 05: "Configure an app to trust an external identity provider" (Learn), run as published' {
    It 'gives three credential.json bodies that pass the static checks' {
        $bodies = Get-WifCliCredentialJson
        @($bodies).Count | Should -Be 3
        foreach ($b in $bodies) { @(Test-NpiWifCredential -Credential $b) | Should -BeNullOrEmpty -Because $b.name }
    }
    It 'its GitHub body matches the environment subject Learn''s format gives' {
        $gh = @(Get-WifCliCredentialJson)[0]
        $p = Get-GitHubClaims 'octo-org/octo-repo' 'environment' 'Production'
        @(Test-NpiWifCredential -Credential $gh -Presented $p) | Should -BeNullOrEmpty
    }
    It 'its Kubernetes body ends the issuer with a slash, which is right when the cluster''s iss has one' {
        $k = @(Get-WifCliCredentialJson)[1]
        $p = Get-NpiWifPresentedClaims -Workload @{ platform = 'kubernetes'; issuer = $k.issuer; namespace = 'erp8asle'; serviceAccount = 'pod-identity-sa' }
        @(Test-NpiWifCredential -Credential $k -Presented $p) | Should -BeNullOrEmpty
    }
    It 'its Azure PowerShell GitHub sample adds a trailing slash to the issuer, so GitHub''s token doesn''t match' {
        $b = Invoke-WifAzPowerShellSample
        $b.Issuer | Should -Be 'https://token.actions.githubusercontent.com/'
        $cred = @{ name = $b.Name; issuer = $b.Issuer; subject = $b.Subject; audiences = $b.Audience }
        $p = Get-GitHubClaims 'octo-org/octo-repo' 'environment' 'Production'
        @(Test-NpiWifCredential -Credential $cred -Presented $p).Rule | Should -Contain 'NPI-WIF-03'
        $c = New-ExchangeClient @([pscustomobject]@{ ClientId = 'app'; Name = $b.Name; Id = 'x'; Issuer = $b.Issuer; Subject = $b.Subject; Audiences = $b.Audience })
        (Test-NpiWifTokenExchange -Client $c -ClientId 'app' -Presented $p -CredentialName $b.Name -AsOf $script:AsOf).Passed | Should -BeFalse
    }
    It 'its az rest samples leave out the Graph version segment' {
        foreach ($r in Get-WifAzRestSample) {
            $r.Uri | Should -Match '^https://graph\.microsoft\.com/applications/'
            $fake = New-NpiWifFake -Path $script:Tenant -AllowWrite
            { & $fake.Invoke $r.Method $r.Uri $r.Body $null } | Should -Throw '*v1.0 and /beta only*'
        }
    }
    It 'gives the pull request subject with :pull-request, so the code doesn''t derive it' {
        (Get-Content $script:AppTrustPage -Raw) | Should -Match ':pull-request`'
        $p = Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = 'contoso/build'; entity = 'pull-request'; subjectFormat = 'name-based' }
        $p.Subject | Should -BeNullOrEmpty
        $p.Note | Should -Match 'row 42'
    }
    It 'includes the shared considerations: a maximum of 20 credentials, and a wrong subject accepted without error' {
        (Get-Content $script:AppTrustPage -Raw) | Should -Match 'includes/federated-credential-configuration-considerations\.md'
        $page = Get-Content (Join-Path $script:WifThirdParty 'entra-wif-create-trust-pages/includes/federated-credential-configuration-considerations.md') -Raw
        $page | Should -Match 'maximum of 20 federated identity credentials'
        $page | Should -Match 'created successfully without error'
    }
}

Describe 'Chapter 05: "Configure a user-assigned managed identity to trust an external identity provider" (Learn), run as published' {
    It 'its ARM template''s default audience starts with a space, which the checks catch' {
        $aud = (Get-WifMiTemplate).parameters.federatedIdentityCredentialAudience.defaultValue
        $aud | Should -Be ' api://AzureADTokenExchange'
        $cred = @{ name = 'testCredential'; issuer = 'https://aks.azure.com/issuerGUID'; subject = 'system:serviceaccount:ns:svcaccount'; audiences = @($aud) }
        @(Test-NpiWifCredential -Credential $cred).Rule | Should -Contain 'NPI-WIF-04'
    }
    It 'its REST sample uses api-version 2022-01-31-preview, not the reference page''s 2024-11-30' {
        $s = Get-WifMiRestSample
        $s.Uri | Should -Match 'api-version=2022-01-31-preview$'
        $s.BodyText | ConvertFrom-Json | Should -Not -BeNullOrEmpty
        $fake = New-NpiWifFake -Path $script:Tenant -AllowWrite
        $u = $s.Uri.Replace('<SUBSCRIPTION ID>', $script:Sub).Replace('<RESOURCE GROUP>', 'rg-identity').Replace('<USER ASSIGNED IDENTITY NAME>', 'id-hrsync').Replace('<FEDERATED IDENTITY CREDENTIAL NAME>', 'fic01')
        { & $fake.Invoke 'PUT' $u ($s.BodyText | ConvertFrom-Json -AsHashtable) $null } | Should -Throw '*2024-11-30*'
    }
    It 'its curl sample''s payload isn''t valid JSON' {
        $s = Get-WifMiRestSample
        $s.CurlPayload | Should -Not -BeNullOrEmpty
        { $s.CurlPayload | ConvertFrom-Json } | Should -Throw
    }
    It 'says a system-assigned identity can''t hold a federated credential, which the checks enforce' {
        (Get-Content $script:MiTrustPage -Raw) | Should -Match 'system-assigned managed identity isn''t supported'
        $cred = @{ name = 'fic01'; issuer = 'https://contoso.example'; subject = 's'; audiences = @('api://AzureADTokenExchange') }
        @(Test-NpiWifCredential -Credential $cred -ParentKind systemAssigned).Rule | Should -Contain 'NPI-WIF-05'
    }
}

Describe 'Chapter 05: the Managed Identity REST examples (2024-11-30), sent as published' {
    It 'FederatedIdentityCredentialCreate: the fake answers with the example''s properties' {
        $fake = New-NpiWifFake -Path $script:Tenant -AllowWrite
        $r = Send-WifRestExample -Name FederatedIdentityCredentialCreate -Fake $fake -Subscription $script:Sub -ResourceGroup rg-identity -Identity id-hrsync
        $ex = (Get-WifRestExample -Name FederatedIdentityCredentialCreate).responses.'201'.body.properties
        $r.properties.issuer | Should -Be $ex.issuer
        $r.properties.subject | Should -Be $ex.subject
        @($r.properties.audiences) | Should -Be @($ex.audiences)
    }
    It 'IdentityCreate: a new identity gets a client ID and a principal ID; its body is location and tags, as the writer''s' {
        $fake = New-NpiWifFake -Path $script:Tenant -AllowWrite
        $r = Send-WifRestExample -Name IdentityCreate -Fake $fake -Subscription $script:Sub -ResourceGroup rg-identity -Identity id-new
        $r.properties.clientId | Should -Match '^[0-9a-f-]{36}$'
        $r.properties.principalId | Should -Match '^[0-9a-f-]{36}$'
        @((Get-WifRestExample -Name IdentityCreate).parameters.parameters.Keys | Sort-Object) | Should -Be @('location', 'tags')
    }
    It 'IdentityGet: the fake returns the example''s shape for an identity' {
        $fake = New-NpiWifFake -Path $script:Tenant
        $r = Send-WifRestExample -Name IdentityGet -Fake $fake -Subscription $script:Sub -ResourceGroup rg-identity -Identity id-hrsync
        $ex = (Get-WifRestExample -Name IdentityGet).responses.'200'.body
        foreach ($k in 'clientId', 'principalId', 'tenantId') { $ex.properties.ContainsKey($k) | Should -BeTrue; $r.properties[$k] | Should -Not -BeNullOrEmpty }
    }
}
