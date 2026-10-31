#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 01: the reader (clouds, the call list, refusals, paging, hosts) and the non-person
# identity register against the fictional estate served by the fakes. No module, tenant, domain or
# network is needed.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiInventory/NpiInventory.psm1') -Force
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Estate = Get-Content $script:Fixture -Raw | ConvertFrom-Json -AsHashtable
    $script:Tenant = $script:Estate.tenantId
    $script:AsOf = [datetime]::Parse($script:Estate.asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    function New-TestRegister([int]$PageSize = 2, [switch]$SkipAd, [switch]$SkipAzure) {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -PageSize $PageSize
        $ad = New-NpiFixtureAdInvoker -Path $script:Fixture
        $reader = New-NpiReader -Cloud gcc -Task inventory -Invoke $fake.Invoke -AdInvoke $ad.Invoke
        [pscustomobject]@{ Fake = $fake; Ad = $ad; Register = (Get-NpiRegister -Reader $reader -TenantId $script:Tenant -AsOf $script:AsOf -SkipAd:$SkipAd -SkipAzure:$SkipAzure) }
    }
    $script:Run = New-TestRegister
    $script:Rows = @($script:Run.Register.Rows)
    $script:Findings = @(Test-NpiRegister -Register $script:Run.Register)
    function Get-Row([string]$Name, [string]$Type) { @($script:Rows | Where-Object { $_.Name -eq $Name -and (-not $Type -or $_.Type -eq $Type) })[0] }
    function Get-Rule([string]$Rule) { @($script:Findings | Where-Object Rule -EQ $Rule) }
}

Describe 'Clouds' {
    It 'GCC uses the worldwide Graph, sign-in and Resource Manager hosts' {
        $c = Get-NpiCloud gcc
        $c.Graph | Should -Be 'https://graph.microsoft.com'
        $c.Login | Should -Be 'https://login.microsoftonline.com'
        $c.Arm | Should -Be 'https://management.azure.com'
    }
    It 'GCC High and DoD use their own Graph hosts and Azure Government' {
        (Get-NpiCloud gcchigh).Graph | Should -Be 'https://graph.microsoft.us'
        (Get-NpiCloud dod).Graph | Should -Be 'https://dod-graph.microsoft.us'
        (Get-NpiCloud dod).Arm | Should -Be 'https://management.usgovcloudapi.net'
    }
    It 'refuses a cloud name it doesn''t know: there is no default' {
        { Get-NpiCloud 'GCC' } | Should -Throw '*Unknown cloud*'
    }
}

Describe 'The call list' {
    It 'every task''s declared permissions, roles and rights are exactly the union of its calls' {
        $list = Get-NpiCallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            $graph = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
            $azure = @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
            $ad = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
            @($list.tasks[$task].graphPermissions | Sort-Object) | Should -Be $graph -Because "task $task"
            @($list.tasks[$task].azureRoles | Sort-Object) | Should -Be $azure -Because "task $task"
            @($list.tasks[$task].adRights | Sort-Object) | Should -Be $ad -Because "task $task"
        }
    }
    It 'read tasks hold only GETs and Get-AD* reads, and nothing ending in ReadWrite' {
        $list = Get-NpiCallList
        foreach ($task in @($list.tasks.Keys | Where-Object { $list.tasks[$_].mode -eq 'read' })) {
            foreach ($c in @($list.calls | Where-Object { $_.tasks -contains $task })) {
                if ($c.api -eq 'ad') { $c.cmdlet | Should -Match '^Get-AD' } else { $c.method | Should -Be 'GET' }
                foreach ($p in @($c.permissions)) { $p | Should -Not -Match 'ReadWrite' }
            }
        }
    }
    It 'the inventory needs exactly these Graph permissions and Reader' {
        $p = Get-NpiRequiredPermission -Task inventory
        $p.GraphPermissions | Should -Be @('Application.Read.All', 'Directory.Read.All')
        $p.AzureRoles | Should -Be @('Reader')
        $p.Methods | Should -Be @('GET', 'READ')
    }
    It 'every call names a Learn page and a stage' {
        foreach ($c in (Get-NpiCall)) {
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
            $c.stage | Should -Not -BeNullOrEmpty
        }
    }
    It 'a write task can''t have a reader' {
        { New-NpiReader -Cloud gcc -Task orphan-apply -Invoke { } } | Should -Throw '*New-NpiWriter*'
    }
}

Describe 'The reader' {
    It 'refuses a call the task doesn''t declare, before anything is sent' {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture
        $r = New-NpiReader -Cloud gcc -Task inventory -Invoke $fake.Invoke
        { Invoke-NpiList -Reader $r -CallId 'graph-user' -Bind @{ id = 'x' } } | Should -Throw '*Undeclared call*'
        $fake.Calls.Count | Should -Be 0
    }
    It 'refuses an Active Directory cmdlet that isn''t a declared Get-AD* read' {
        $ad = New-NpiFixtureAdInvoker -Path $script:Fixture
        $r = New-NpiReader -Cloud gcc -Task inventory -AdInvoke $ad.Invoke
        { Invoke-NpiAdRead -Reader $r -CallId 'ad-disable-account' -Params @{ Identity = 'x' } } | Should -Throw '*Undeclared call*'
        $ad.Calls.Count | Should -Be 0
    }
    It 'refuses a next link on another host' {
        $evil = { param($m, $u, $b, $h) @{ value = @(@{ id = 'x' }); '@odata.nextLink' = 'https://graph.example.net/v1.0/next' } }
        $r = New-NpiReader -Cloud gcc -Task inventory -Invoke $evil
        { Invoke-NpiList -Reader $r -CallId 'graph-applications' } | Should -Throw '*Refusing to send the token*'
    }
    It 'the fakes refuse writes unless a writer asks for them' {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture
        { & $fake.Invoke 'PATCH' 'https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000003' @{ accountEnabled = $false } $null } | Should -Throw '*refuses PATCH*'
        $ad = New-NpiFixtureAdInvoker -Path $script:Fixture
        { & $ad.Invoke 'Disable-ADAccount' @{ Identity = 'svc-backup' } } | Should -Throw '*refuses*'
    }
    It 'reads every page whatever the page size' {
        foreach ($size in 1, 3, 50) {
            $run = New-TestRegister -PageSize $size
            @($run.Register.Rows).Count | Should -Be $script:Rows.Count -Because "page size $size"
        }
    }
    It 'sends only GETs, and runs only Get-ADUser and Get-ADServiceAccount' {
        @($script:Run.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        @($script:Run.Ad.Calls.Cmdlet | Sort-Object -Unique) | Should -Be @('Get-ADServiceAccount', 'Get-ADUser')
    }
    It 'reads AD with one LDAP query for user accounts, not -Filter * over every user' {
        $q = @($script:Run.Ad.Calls | Where-Object Cmdlet -EQ 'Get-ADUser')
        $q.Count | Should -Be 1
        $q[0].Params.LDAPFilter | Should -Match '^\(&\(objectCategory=person\)\(objectClass=user\)\(\|'
        $q[0].Params.Keys | Should -Not -Contain 'Filter'
    }
}

Describe 'The register' {
    It 'holds every AD candidate once, people with no service criterion left out' {
        $ad = @($script:Rows | Where-Object Source -EQ 'AD')
        @($ad.Name | Sort-Object -Unique).Count | Should -Be $ad.Count
        $ad.Name | Should -Not -Contain 'mmiller'
        $ad.Name | Should -Not -Contain 'SRV-APP01$'
    }
    It 'records how each account was found' {
        (Get-Row 'svc-hrsync').DetectedBy | Should -Be 'Spn; PasswordNeverExpires; Naming'
        (Get-Row 'svc-intranet').Delegation | Should -Be 'ProtocolTransition'
        (Get-Row 'svc-webfront').Delegation | Should -Be 'Unconstrained'
        (Get-Row 'svc-reports').Delegation | Should -Be 'Constrained'
    }
    It 'classifies MSAs, gMSAs and dMSAs by object class, and records who can retrieve a gMSA''s password' {
        (Get-Row 'msa-print01$').Type | Should -Be 'MSA'
        (Get-Row 'gmsa-web$').Type | Should -Be 'gMSA'
        (Get-Row 'dmsa-hrsync$').Type | Should -Be 'dMSA'
        (Get-Row 'gmsa-web$').Hosts | Should -Be 'WEB01; WEB02'
    }
    It 'computes password age and last logon from the as-of date' {
        (Get-Row 'svc-hrsync').PasswordAgeDays | Should -Be 2800
        (Get-Row 'svc-oldftp').LastLogon | Should -Be '2025-11-02'
    }
    It 'counts owners, secrets, certificates, expired credentials and federated credentials on app registrations' {
        $r = Get-Row 'Legacy Reports' 'AppRegistration'
        $r.OwnerCount | Should -Be 0
        $r.Secrets | Should -Be 1; $r.Certificates | Should -Be 1; $r.ExpiredCredentials | Should -Be 1
        $r.CredentialKind | Should -Be 'SecretAndCertificate'
        (Get-Row 'Build Pipeline' 'AppRegistration').CredentialKind | Should -Be 'Federated'
        (Get-Row 'Build Pipeline' 'AppRegistration').OwnerTypes | Should -Be 'user; servicePrincipal'
    }
    It 'types every service principal: own, external, legacy, managed identity, agent' {
        (Get-Row 'Partner CRM').Type | Should -Be 'ExternalServicePrincipal'
        (Get-Row 'Old SAML Connector').Type | Should -Be 'LegacyServicePrincipal'
        (Get-Row 'vm-batch01').Type | Should -Be 'ManagedIdentitySystemAssigned'
        (Get-Row 'id-deploy').Type | Should -Be 'ManagedIdentityUserAssigned'
        (Get-Row 'Benefits Q&A Agent').Type | Should -Be 'AgentIdentity'
        (Get-Row 'Benefits Agent Blueprint').Type | Should -Be 'AgentIdentityBlueprint'
        $script:Rows.Name | Should -Not -Contain 'Microsoft Graph'
    }
    It 'reads a user-assigned identity''s federated credentials from Resource Manager, and skips them with -SkipAzure' {
        (Get-Row 'id-deploy').FederatedSubjects | Should -Be 'https://token.actions.githubusercontent.com | repo:contoso/infra:environment:production'
        $skip = New-TestRegister -SkipAzure
        @($skip.Fake.Calls | Where-Object { $_.Uri -like 'https://management.azure.com/*' }).Count | Should -Be 0
        (@($skip.Register.Rows | Where-Object Name -EQ 'id-deploy')[0]).Note | Should -Match 'SkipAzure'
    }
    It 'names Graph application permissions and delegated grants, once per app' {
        (Get-Row 'Mail Automation' 'AppRegistration').GraphAppRoles | Should -Be 'Directory.ReadWrite.All; Mail.Send'
        (Get-Row 'Mail Automation' 'ServicePrincipal').GraphAppRoles | Should -Be ''
        (Get-Row 'Partner CRM').TenantWideConsent | Should -BeTrue
        (Get-Row 'Payroll Export' 'AppRegistration').DelegatedGrants | Should -Be 1
    }
}

Describe 'Risk, targets and the Data Platform hand-off' {
    It 'HIGH is a password that never expires or over-privilege, on an enabled identity' {
        (Get-Row 'svc-hrsync').Risk | Should -Be 'HIGH'
        (Get-Row 'svc-backup').RiskReasons | Should -Match 'Backup Operators'
        (Get-Row 'svc-webfront').RiskReasons | Should -Match 'unconstrained delegation'
        (Get-Row 'gmsa-ops$').RiskReasons | Should -Match 'Domain Admins'
        (Get-Row 'Mail Automation' 'AppRegistration').RiskReasons | Should -Match 'Directory\.ReadWrite\.All'
        (Get-Row 'svc-reports').Risk | Should -Be 'LOW'
    }
    It 'gives a candidate target from the migration path matrix' {
        (Get-Row 'svc-hrsync').CandidateTarget | Should -Match '^gMSA, or a dMSA'
        (Get-Row 'msa-print01$').CandidateTarget | Should -Match '^Upgrade to a gMSA'
        (Get-Row 'svc-oldftp').CandidateTarget | Should -Match 'Verify use first'
        (Get-Row 'Payroll Export' 'AppRegistration').CandidateTarget | Should -Match '^Replace the client secret'
        (Get-Row 'Old SAML Connector').CandidateTarget | Should -Match '^Replace with an app registration'
    }
    It 'tags SQL Server and LDAP-bind accounts for the Data Platform plan' {
        @($script:Rows | Where-Object Handoff -EQ 'DataPlatform').Name | Sort-Object | Should -Be @('gmsa-sql$', 'svc-ldapbind', 'svc-sqlprod')
        (Get-Row 'svc-sqlprod').CandidateTarget | Should -Match '^Data Platform plan \(SPN MSSQLSvc/'
    }
    It 'marks a stale account as a lead to confirm against sign-in logs, never retired' {
        $r = Get-Row 'svc-oldftp'
        $r.StaleLead | Should -BeTrue
        $r.StaleNote | Should -Match 'confirm against domain controller and Entra sign-in logs'
        (Get-Row 'svc-reports').StaleLead | Should -BeFalse
    }
}

Describe 'Findings' {
    It 'gives every finding a stable ID: the rule and the identity' {
        foreach ($f in $script:Findings) { $f.Id | Should -Be "$($f.Rule):$($f.ObjectKey)" }
        @($script:Findings.Id | Sort-Object -Unique).Count | Should -Be $script:Findings.Count
    }
    It 'NPI-INV-01 lists every HIGH identity' {
        @(Get-Rule 'NPI-INV-01').Count | Should -Be @($script:Rows | Where-Object Risk -EQ 'HIGH').Count
    }
    It 'NPI-INV-02 to NPI-INV-08 each fire on the fixture where expected' {
        (Get-Rule 'NPI-INV-02').Object | Should -Be 'svc-oldftp (Traditional)'
        @(Get-Rule 'NPI-INV-03').Object | Sort-Object | Should -Be @('HR Connector (AppRegistration)', 'Legacy Reports (AppRegistration)', 'Old SAML Connector (LegacyServicePrincipal)')
        @(Get-Rule 'NPI-INV-04').Count | Should -Be 4
        (Get-Rule 'NPI-INV-05').Object | Should -Be 'Legacy Reports (AppRegistration)'
        (Get-Rule 'NPI-INV-06').Object | Should -Be 'Partner CRM (ExternalServicePrincipal)'
        @(Get-Rule 'NPI-INV-07').Count | Should -Be 3
        (Get-Rule 'NPI-INV-08').Object | Should -Be 'jdoe (Traditional)'
    }
    It 'NPI-INV-09 flags an object class the register doesn''t know' {
        $odd = New-NpiRow @{ IdentityId = 'ad:x'; Source = 'AD'; Type = 'UnknownServiceAccount'; Name = 'odd$'; Enabled = $true; Note = 'Object class x' }
        (Test-NpiRegister -Register ([pscustomobject]@{ Rows = @($odd) })).Rule | Should -Contain 'NPI-INV-09'
    }
}

Describe 'The run and its manifest' {
    BeforeAll {
        $script:Out = Join-Path ([IO.Path]::GetTempPath()) ("npi-inv-{0}" -f [guid]::NewGuid())
        $script:Console = & (Join-Path $PSScriptRoot '../Invoke-NpiInventory.ps1') -Cloud gcc -FixturePath $script:Fixture -OutputPath $script:Out
        $script:Manifest = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
    }
    AfterAll { Remove-Item -Recurse -Force $script:Out -ErrorAction SilentlyContinue }
    It 'records the tenant ID, the domain, the cloud and the permissions' {
        $script:Manifest.tenantId | Should -Be $script:Tenant
        $script:Manifest.domain | Should -Be 'corp.contoso.example'
        $script:Manifest.cloud | Should -Be 'gcc'
        $script:Manifest.graphPermissions | Should -Be @('Application.Read.All', 'Directory.Read.All')
    }
    It 'records a SHA-256 for every file, and the hashes match' {
        foreach ($k in $script:Manifest.files.Keys) { (Get-FileHash (Join-Path $script:Out $k) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $script:Manifest.files[$k] }
        @($script:Manifest.files.Keys | Sort-Object) | Should -Be @('data-platform-handoff.csv', 'findings.json', 'register.csv', 'register.json')
    }
    It 'writes LF line endings on every platform, so the hashes match across platforms' {
        foreach ($k in @($script:Manifest.files.Keys) + 'manifest.json') { [IO.File]::ReadAllText((Join-Path $script:Out $k)).Contains("`r") | Should -BeFalse -Because $k }
    }
    It 'lists every request and AD read, every one a GET or a READ' {
        @($script:Manifest.requests | Where-Object { $_.method -notin 'GET', 'READ' }).Count | Should -Be 0
        @($script:Manifest.requests | Where-Object { $_.method -eq 'READ' }).Count | Should -Be 2
    }
    It 'prints the counts Lab 1 shows' {
        $script:Console[0] | Should -Be 'Register: 35 identities (AD 15, Entra 20); risk HIGH 8, LOW 19, MEDIUM 8'
        $script:Console[1] | Should -Be 'Findings: 8 Finding, 11 Warn, 3 Info; 3 handed to the Data Platform plan'
    }
    It 'refuses a live run with no tenant ID' {
        { & (Join-Path $PSScriptRoot '../Invoke-NpiInventory.ps1') -Cloud gcc -OutputPath $script:Out } | Should -Throw '*-TenantId*'
    }
}
