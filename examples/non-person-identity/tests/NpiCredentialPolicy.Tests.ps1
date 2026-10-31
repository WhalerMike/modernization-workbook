#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 04: Microsoft's samples for app management policies and Key Vault certificates, run as
# published against fakes, then the policy as reviewed data with a diff, a plan and a write path,
# and certificate rotation through Key Vault with the owner's approval and an overlap.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiCredentialPolicy/NpiCredentialPolicy.psm1') -Force
    . (Join-Path $PSScriptRoot 'CredentialPolicySampleHarness.ps1')
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Estate = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Tenant = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch04/tenant.json')).Path
    $script:Inputs = Join-Path $PSScriptRoot 'fixtures/ch04/inputs'
    $script:PolicyConfig = Get-Content (Join-Path $script:Root 'config/app-management-policy.json') -Raw | ConvertFrom-Json -AsHashtable
    $script:RotConfig = Get-Content (Join-Path $script:Root 'config/rotation.json') -Raw | ConvertFrom-Json -AsHashtable
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-ch04-{0}" -f [guid]::NewGuid())
    $script:InvRun = Join-Path $script:Tmp 'inventory'
    $null = & (Join-Path $script:Root 'Invoke-NpiInventory.ps1') -Cloud gcc -FixturePath $script:Estate -OutputPath $script:InvRun
    $script:Register = Import-NpiCh04Register -RunPath $script:InvRun
    $script:TenantId = $script:Register.Manifest.tenantId
    $script:AsOf = [datetime]::Parse('2026-10-30T00:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:G = 'https://graph.microsoft.com'
    $script:Effective = Format-NpiDate $script:PolicyConfig.effectiveDate

    function New-TestFake([switch]$Write) { New-NpiCh04FixtureInvoker -Path $script:Tenant -AllowWrite:$Write }
    function Get-TestPolicyPlan($Fake = (New-TestFake), $Config = $script:PolicyConfig, [datetime]$AsOf = $script:AsOf) {
        $c = New-NpiCh04Client -Cloud gcc -Task app-policy -Invoke $Fake.Invoke -TenantId $script:TenantId
        $state = Get-NpiAppPolicyState -Client $c -Rows $script:Register.Rows
        New-NpiPolicyPlan -State $state -Config $Config -AsOf $AsOf -Cloud gcc -TenantId $script:TenantId -RegisterSha256 $script:Register.Sha256 -ConfigSha256 'test'
    }
    function Get-TestRotationPlan($Fake = (New-TestFake), [object[]]$Approvals = (Import-NpiCh04Input (Join-Path $script:Inputs 'rotation-approvals.csv')),
        [object[]]$Verifications = (Import-NpiCh04Input (Join-Path $script:Inputs 'rotation-verifications.csv')), [datetime]$AsOf = $script:AsOf, $Config = $script:RotConfig) {
        $c = New-NpiCh04Client -Cloud gcc -Task rotation -Invoke $Fake.Invoke -TenantId $script:TenantId
        New-NpiRotationPlan -Client $c -Rows $script:Register.Rows -Bindings (Import-NpiCh04Input (Join-Path $script:Inputs 'certificate-bindings.csv')) -Approvals $Approvals `
            -Verifications $Verifications -Config $Config -EffectiveDate $script:Effective -AsOf $AsOf -Cloud gcc -TenantId $script:TenantId -RegisterSha256 $script:Register.Sha256
    }
    function Save-TestPlan($Plan) {
        $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid())
        New-Item -ItemType Directory -Force -Path $script:Tmp | Out-Null
        Write-NpiSortedJson -Path $p -Value $Plan
        [pscustomobject]@{ Path = $p; Sha = Get-NpiFileHash -Path $p }
    }
    function New-TestWriter($Fake, [string]$Task) { New-NpiCh04Client -Cloud gcc -Task $Task -Invoke $Fake.Invoke -TenantId $script:TenantId }
    function Get-Act($Plan, [string]$Action) { @($Plan.actions | Where-Object Action -EQ $Action) }
    $script:Pol = Get-TestPolicyPlan
    $script:Rot = Get-TestRotationPlan
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'Chapter 04: Microsoft''s samples, as published' {
    BeforeAll {
        $script:Update = Get-Ch04HttpSample -Page $script:Ch04Pages.TenantUpdate -Name 'update_tenantAppManagementPolicy'
        $script:Create = Get-Ch04HttpSample -Page $script:Ch04Pages.PolicyPost -Name 'create_appManagementPolicy'
        $script:Assign = Get-Ch04HttpSample -Page $script:Ch04Pages.PolicyAssign -Name 'assign_appliesTo_ex1'
        $script:Configure = Get-Ch04HttpSamples -Page $script:Ch04Pages.Configure
    }
    It 'Update tenantAppManagementPolicy enables the default policy with secrets blocked and certificates capped: the model for the PATCH' {
        $fake = New-TestFake -Write
        $null = Send-Ch04HttpSample -Sample $script:Update -Fake $fake
        $d = $fake.Tenant.defaultAppManagementPolicy
        $d.isEnabled | Should -BeTrue
        @($d.applicationRestrictions.passwordCredentials.restrictionType) | Should -Contain 'passwordAddition'
        @($d.applicationRestrictions.keyCredentials)[0].restrictionType | Should -Be 'asymmetricKeyLifetime'
    }
    It 'its start dates (2015 to 2021) reach existing apps, so its 30-day cap then refuses a 180-day certificate on one' {
        $fake = New-TestFake -Write
        $null = Send-Ch04HttpSample -Sample $script:Update -Fake $fake
        $app = $fake.Tenant.applications['0a000000-0000-4000-8000-000000000007']
        $blob = New-NpiFakeCertBlob -Thumbprint ('AB' * 20) -Nbf ([datetime]'2026-10-30Z').ToUniversalTime() -Exp ([datetime]'2027-04-28Z').ToUniversalTime() -Subject 'CN=deploy-bot'
        $body = @{ keyCredentials = @(@($app.keyCredentials | ForEach-Object { @{ keyId = $_.keyId; type = $_.type; usage = $_.usage; key = $_.key } }) + @(@{ type = 'AsymmetricX509Cert'; usage = 'Verify'; key = $blob })) }
        { & $fake.Invoke 'PATCH' "$script:G/v1.0/applications/0a000000-0000-4000-8000-000000000007" $body $null } | Should -Throw '*exceeds the maximum*'
    }
    It 'sets no state on any restriction' {
        foreach ($r in @($script:Update.Body.applicationRestrictions.passwordCredentials) + @($script:Update.Body.applicationRestrictions.keyCredentials)) { $r.ContainsKey('state') | Should -BeFalse }
    }
    It 'isn''t strict JSON: a trailing comma that PowerShell forgives and a JSON library refuses' {
        $script:Update.BodyText | Should -Match '\},\s*\]'
        Test-Ch04StrictJson $script:Update.BodyText | Should -BeFalse
        $script:Update.Body | Should -Not -BeNullOrEmpty
    }
    It 'sets application restrictions only, though the admin center expects service principal restrictions in the same state' {
        $script:Update.Body.ContainsKey('servicePrincipalRestrictions') | Should -BeFalse
        (Get-Content $script:Ch04Pages.Configure -Raw) | Should -Match 'expects all four of the following restrictions to be in the same state'
    }
    It 'Learn''s procedure PATCH replaces the collection, so a restriction it doesn''t name is dropped' {
        $fake = New-TestFake -Write
        $script:Configure[1].Method | Should -Be 'PATCH'
        $null = Send-Ch04HttpSample -Sample $script:Configure[1] -Fake $fake
        @($fake.Tenant.defaultAppManagementPolicy.applicationRestrictions.passwordCredentials.restrictionType) | Should -Not -Contain 'customPasswordAddition'
        (Get-Content $script:Ch04Pages.Configure -Raw) | Should -Match 'include them in the request to avoid accidentally disabling them'
    }
    It 'Learn''s procedure sends every policy request to /beta' {
        foreach ($s in @($script:Configure | Where-Object { $_.Uri -match '/policies/|/appManagementPolicies/' })) { $s.Uri | Should -Match '^https://graph\.microsoft\.com/beta/' }
    }
    It 'Create appManagementPolicy makes a policy the fake accepts: the model for an exception' {
        $fake = New-TestFake -Write
        $resp = Send-Ch04HttpSample -Sample $script:Create -Fake $fake
        $resp.id | Should -Match '^7e000000-'
        @($fake.Tenant.appManagementPolicies).Count | Should -Be 2
    }
    It 'Assign appliesTo sends a literal {id}, and a second policy on the same app is refused' {
        $script:Assign.Uri | Should -Match '/applications/\{id\}/'
        $script:Assign.Body['@odata.id'] | Should -Match '/appManagementPolicies/\{id\}$'
        $fake = New-TestFake -Write
        $new = (Send-Ch04HttpSample -Sample $script:Create -Fake $fake).id
        { Send-Ch04HttpSample -Sample $script:Assign -Fake $fake } | Should -Throw '*appManagementPolicy*'
        { Send-Ch04HttpSample -Sample $script:Assign -Fake $fake -Replace @{ 'applications/{id}' = 'applications/0a000000-0000-4000-8000-000000000005'; 'appManagementPolicies/{id}' = "appManagementPolicies/$new" } } | Should -Throw '*already has an app management policy*'
    }
    It 'the Graph tutorial''s default policy sample uses certificateLifetime, which v1.0 refuses, and labels a PATCH with a read permission' {
        $s = Get-Ch04HttpSample -Page $script:Ch04Pages.Tutorial -Name 'tutorial-application-basics-update-appmanagementpolicy'
        $fake = New-TestFake -Write
        { Send-Ch04HttpSample -Sample $s -Fake $fake } | Should -Throw "*'certificateLifetime' isn't a keyCredentials restriction type in v1.0*"
        (Get-Content $script:Ch04Pages.Tutorial -Raw) | Should -Match 'Least privileged delegated permission: `Policy\.Read\.ApplicationConfiguration`'
    }
    It 'the Graph tutorial locks one app''s properties on /beta and reads nothing first: the model for the lock' {
        $s = Get-Ch04HttpSample -Page $script:Ch04Pages.Tutorial -Name 'tutorial-application-basics-serviceprincipallockconfig-all'
        $s.Uri | Should -Match '^https://graph\.microsoft\.com/beta/applications/'
        $s.Body.servicePrincipalLockConfiguration.allProperties | Should -BeTrue
        $fake = New-TestFake -Write
        $null = Send-Ch04HttpSample -Sample $s -Fake $fake -Replace @{ 'a0b7f39e-3139-48aa-9397-f46fb63102f7' = '0a000000-0000-4000-8000-000000000001' }
        $fake.Tenant.applications['0a000000-0000-4000-8000-000000000001'].servicePrincipalLockConfiguration.isEnabled | Should -BeTrue
    }
    It 'every Graph sample hard-codes graph.microsoft.com' {
        foreach ($s in @($script:Update, $script:Create, $script:Assign) + @($script:Configure) + @(Get-Ch04HttpSamples -Page $script:Ch04Pages.AddCert)) { $s.Uri | Should -Match '^https://graph\.microsoft\.com/' }
    }
    It 'Add a certificate''s first PATCH replaces every certificate the app had: the model for the attach, and its danger' {
        $s = @(Get-Ch04HttpSamples -Page $script:Ch04Pages.AddCert)[0]
        $s.Method | Should -Be 'PATCH'
        @($s.Body.keyCredentials).Count | Should -Be 1
        $fake = New-TestFake -Write
        $body = ConvertTo-NpiSortedNode $s.Body | ConvertTo-Json -Depth 10 | ConvertFrom-Json -AsHashtable
        $body.keyCredentials[0].key = New-NpiFakeCertBlob -Thumbprint ('CD' * 20) -Nbf ([datetime]'2023-01-12T15:31:26Z').ToUniversalTime() -Exp ([datetime]'2024-01-11T15:31:26Z').ToUniversalTime() -Subject 'CN=20230112'
        $null = & $fake.Invoke 'PATCH' ($s.Uri.Replace('bb77f42f-dacb-4ece-b3e6-285e63c24d52', '0a000000-0000-4000-8000-000000000002')) $body $null
        @($fake.Tenant.applications['0a000000-0000-4000-8000-000000000002'].keyCredentials).Count | Should -Be 1
        (Get-Content $script:Ch04Pages.AddCert -Raw) | Should -Match 'include both the current and new certificate details'
    }
    It 'its second PATCH keeps the old certificate by a thumbprint written as hex text, with no keyId' {
        $s = @(Get-Ch04HttpSamples -Page $script:Ch04Pages.AddCert)[1]
        $kept = @($s.Body.keyCredentials | Where-Object { $_.ContainsKey('customKeyIdentifier') })
        $kept.Count | Should -Be 1
        $kept[0].customKeyIdentifier | Should -Match '^[0-9A-F]{40}$'
        $kept[0].ContainsKey('keyId') | Should -BeFalse
    }
    It 'its certificate lasts 364 days, which the page allows and the program''s 180-day cap doesn''t' {
        $c = @(Get-Ch04HttpSamples -Page $script:Ch04Pages.AddCert)[0].Body.keyCredentials[0]
        $days = ([datetime]$c.endDateTime - [datetime]$c.startDateTime).TotalDays
        $days | Should -BeGreaterThan 363
        $days | Should -BeGreaterThan 180
        (Get-Content $script:Ch04Pages.AddCert -Raw) | Should -Match 'can be a maximum of one year'
    }
    It 'Add-AzKeyVaultCertificate''s example asks for 6 months, more than 180 days, as its own output shows' {
        $code = Get-Ch04AzExample -Page AzAdd
        $code | Should -Match '-ValidityInMonths 6'
        $nbf = [datetime]::Parse('2/8/2016 3:11:45 PM', [Globalization.CultureInfo]::InvariantCulture); $exp = [datetime]::Parse('8/8/2016 4:21:45 PM', [Globalization.CultureInfo]::InvariantCulture)
        $code | Should -Match ([regex]::Escape('2/8/2016 3:11:45 PM'))
        ($exp - $nbf).TotalDays | Should -BeGreaterThan 180
        $run = Invoke-Ch04AzAddExample -Fake (New-TestFake -Write)
        $last = $run.Outputs | Where-Object { $_.PSObject.Properties.Name -contains 'Expires' } | Select-Object -Last 1
        ($last.Expires - $last.NotBefore).TotalDays | Should -BeGreaterThan 180
    }
    It 'the example''s code and output share one block, so it can''t be run as published' {
        $code = Get-Ch04AzExample -Page AzAdd
        $code | Should -Match '(?m)^Status\s+: inProgress'
        { [scriptblock]::Create($code).Invoke() } | Should -Throw
    }
    It 'Set-AzKeyVaultCertificatePolicy''s example sets no lifetime action, so nothing renews and nobody is told' {
        $calls = Invoke-Ch04AzSetExample
        $calls.Count | Should -Be 1
        foreach ($p in 'RenewAtNumberOfDaysBeforeExpiry', 'RenewAtPercentageLifetime', 'EmailAtNumberOfDaysBeforeExpiry', 'EmailAtPercentageLifetime') { $calls[0].Bound | Should -Not -Contain $p }
    }
    It 'Key Vault renews the certificate; nothing in the samples puts it on the app registration, asks the owner or removes the old one' {
        foreach ($p in 'AzAdd', 'AzSet') { (Get-Content $script:Ch04Pages[$p] -Raw) | Should -Not -Match 'keyCredentials|graph\.microsoft\.com|Update-MgApplication' }
        (Get-Content $script:Ch04Pages.AddCert -Raw) | Should -Not -Match 'Key Vault|approv|overlap|removeKey'
    }
}

Describe 'The Chapter 04 call list' {
    It 'every task''s declared permissions and roles are exactly the union of its calls' {
        $list = Get-NpiCh04CallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            $graph = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
            $azure = @($calls | Where-Object { $_.api -in 'arm', 'keyvault' } | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
            $ad = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
            @($list.tasks[$task].graphPermissions | Sort-Object) | Should -Be $graph -Because "task $task"
            @($list.tasks[$task].azureRoles | Sort-Object) | Should -Be $azure -Because "task $task"
            @($list.tasks[$task].adRights | Sort-Object) | Should -Be $ad -Because "task $task"
        }
    }
    It 'read tasks hold only GETs and nothing that writes; write tasks are delegated only, to Cloud Application Administrator' {
        $list = Get-NpiCh04CallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            if ($list.tasks[$task].mode -eq 'read') {
                foreach ($c in $calls) { $c.method | Should -Be 'GET'; foreach ($p in @($c.permissions)) { $p | Should -Not -Match 'ReadWrite' }; if ($c.api -eq 'keyvault') { $c.azureRole | Should -Be 'Key Vault Reader' } }
            } else {
                $list.tasks[$task].delegatedOnly | Should -BeTrue
                $list.tasks[$task].delegatedRole | Should -Be 'Cloud Application Administrator'
                @($calls | Where-Object { $_.method -in 'DELETE', 'PUT' }).Count | Should -Be 0
            }
        }
    }
    It 'each task needs exactly these permissions and roles' {
        (Get-NpiCh04RequiredPermission app-policy).GraphPermissions | Should -Be @('Application.Read.All', 'Policy.Read.All')
        (Get-NpiCh04RequiredPermission policy-apply).GraphPermissions | Should -Be @('Application.Read.All', 'Application.ReadWrite.All', 'Policy.Read.All', 'Policy.ReadWrite.ApplicationConfiguration')
        (Get-NpiCh04RequiredPermission rotation).GraphPermissions | Should -Be @('Application.Read.All', 'User.Read.All')
        (Get-NpiCh04RequiredPermission rotation).AzureRoles | Should -Be @('Key Vault Reader')
        (Get-NpiCh04RequiredPermission rotation-apply).AzureRoles | Should -Be @('Key Vault Certificates Officer', 'Key Vault Reader')
    }
    It 'every call names a Learn page and a stage, and writes name the bodies they allow' {
        foreach ($c in (Get-NpiCh04Call)) {
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
            $c.stage | Should -Not -BeNullOrEmpty
            if ($c.method -ne 'GET') { $c.ContainsKey('allowedBody') | Should -BeTrue }
        }
    }
    It 'Key Vault uses the commercial host for GCC and the Azure Government host for GCC High; no default cloud' {
        Get-NpiVaultHost -Cloud gcc -Vault 'kv-npi-contoso' | Should -Be 'https://kv-npi-contoso.vault.azure.net'
        Get-NpiVaultHost -Cloud gcchigh -Vault 'kv-npi-contoso' | Should -Be 'https://kv-npi-contoso.vault.usgovcloudapi.net'
        { Get-NpiVaultHost -Cloud 'GCC' -Vault 'kv-npi-contoso' } | Should -Throw '*Unknown cloud*'
        { Get-NpiVaultHost -Cloud gcc -Vault 'evil.example/x' } | Should -Throw "*isn't a key vault name*"
    }
}

Describe 'The policy: read, compare, plan' {
    It 'the read sends only GETs to the policy and application routes' {
        $fake = New-TestFake
        $null = Get-TestPolicyPlan -Fake $fake
        @($fake.Calls | Where-Object { $_.Method -ne 'GET' }).Count | Should -Be 0
        @($fake.Calls | Where-Object { $_.Uri -notmatch '/v1\.0/(policies/|applications/)' }).Count | Should -Be 0
    }
    It 'the diff adds the program''s restrictions on both objects, enables the policy and keeps what the tenant already has' {
        $rows = @($script:Pol.Diff)
        @($rows | Where-Object Change -EQ 'Add').Count | Should -Be 6
        ($rows | Where-Object RestrictionType -EQ 'isEnabled').Change | Should -Be 'Change'
        ($rows | Where-Object Change -EQ 'KeepExisting').RestrictionType | Should -Be 'customPasswordAddition'
    }
    It 'the PATCH body carries every existing restriction, an explicit state, and the effective date' {
        $b = (Get-Act $script:Pol.Plan 'PatchDefaultPolicy')[0].Body
        foreach ($scope in 'applicationRestrictions', 'servicePrincipalRestrictions') {
            $b[$scope].keyCredentials[0].maxLifetime | Should -Be 'P180D'
            foreach ($r in @($b[$scope].passwordCredentials) + @($b[$scope].keyCredentials)) { $r.state | Should -Not -BeNullOrEmpty }
        }
        @($b.applicationRestrictions.passwordCredentials.restrictionType) | Should -Contain 'customPasswordAddition'
        ($b.applicationRestrictions.passwordCredentials | Where-Object { $_.restrictionType -eq 'passwordAddition' }).restrictForAppsCreatedAfterDateTime | Should -Be '2026-11-15T00:00:00Z'
    }
    It 'never loosens a stricter restriction the tenant already has' {
        $fake = New-TestFake
        $fake.Tenant.defaultAppManagementPolicy.applicationRestrictions.keyCredentials = @(@{ restrictionType = 'asymmetricKeyLifetime'; state = 'enabled'; maxLifetime = 'P90D'; restrictForAppsCreatedAfterDateTime = '2024-01-01T00:00:00Z' })
        $out = Get-TestPolicyPlan -Fake $fake
        ($out.Diff | Where-Object { $_.Scope -eq 'applicationRestrictions' -and $_.RestrictionType -eq 'asymmetricKeyLifetime' }).Change | Should -Be 'KeepStricter'
        (Get-Act $out.Plan 'PatchDefaultPolicy')[0].Body.applicationRestrictions.keyCredentials[0].maxLifetime | Should -Be 'P90D'
    }
    It 'NPI-POL-02: an app management policy nobody reviewed is reported, never changed' {
        $f = @($script:Pol.Findings | Where-Object Rule -EQ 'NPI-POL-02')
        $f.Object | Should -Be 'Vendor portal legacy exception'
        $f.Issue | Should -Match 'Vendor Portal'
        @($script:Pol.Plan.actions | Where-Object { $_.Write -and $_.Object -eq '7e000000-0000-4000-8000-000000000001' }).Count | Should -Be 0
    }
    It 'an exception in force is created and assigned; an expired one is a finding, never a write' {
        (Get-Act $script:Pol.Plan 'CreateAppPolicy')[0].Body.displayName | Should -Be 'NPI exception EXC-NPI-0001: Mail Automation'
        (Get-Act $script:Pol.Plan 'AssignAppPolicy')[0].Body['@odata.id'] | Should -Be '{created:NPI exception EXC-NPI-0001: Mail Automation}'
        $out = Get-TestPolicyPlan -AsOf ([datetime]'2027-02-15Z').ToUniversalTime()
        (Get-Act $out.Plan 'ExceptionExpired').Count | Should -Be 1
        @($out.Plan.actions | Where-Object { $_.Write -and $_.Action -in 'CreateAppPolicy', 'AssignAppPolicy' }).Count | Should -Be 0
    }
    It 'an exception for an app that already holds another policy is refused, because an app takes only one' {
        $cfg = ConvertTo-NpiSortedNode $script:PolicyConfig | ConvertTo-Json -Depth 20 | ConvertFrom-Json -AsHashtable
        $cfg.exceptions[0].application = '0a000000-0000-4000-8000-000000000005'
        $out = Get-TestPolicyPlan -Config $cfg
        (Get-Act $out.Plan 'ForeignPolicyAssigned').Count | Should -Be 1
        @($out.Findings | Where-Object Rule -EQ 'NPI-POL-04').Count | Should -Be 1
    }
    It 'NPI-POL-06: every app registration not fully locked gets the lock; a partial lock counts as not locked' {
        @(Get-Act $script:Pol.Plan 'LockApp').Name | Sort-Object | Should -Be @('Build Pipeline', 'Legacy Reports', 'Mail Automation', 'Payroll Export', 'Vendor Portal')
        @(Get-Act $script:Pol.Plan 'AlreadyLocked').Name | Sort-Object | Should -Be @('Deploy Bot', 'HR Connector')
        (Get-Act $script:Pol.Plan 'LockApp' | Where-Object Name -EQ 'Vendor Portal').Detail | Should -Be 'only some properties locked'
    }
    It 'the same inputs give the same plan, byte for byte' {
        (Save-TestPlan (Get-TestPolicyPlan).Plan).Sha | Should -Be (Save-TestPlan $script:Pol.Plan).Sha
    }
    It 'after the plan is applied, a new plan finds everything in place and has no writes' {
        $fake = New-TestFake -Write
        $s = Save-TestPlan (Get-TestPolicyPlan -Fake $fake).Plan
        $run = Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $fake 'policy-apply') -AsOf $script:AsOf -Apply
        @($run.Results | Where-Object Outcome -EQ 'Sent').Count | Should -Be 8
        $again = Get-TestPolicyPlan -Fake $fake
        @($again.Plan.actions | Where-Object Write).Count | Should -Be 0
        (Get-Act $again.Plan 'DefaultPolicyInPlace').Count | Should -Be 1
        (Get-Act $again.Plan 'AssignmentInPlace').Count | Should -Be 1
    }
}

Describe 'Rotation: the plan' {
    It 'gives each certificate one step, and each secret a replacement' {
        $a = $script:Rot.Plan.actions
        ($a | Where-Object Name -EQ 'Vendor Portal').Action | Should -Be 'RenewInKeyVault'
        ($a | Where-Object Name -EQ 'Deploy Bot').Action | Should -Be 'AttachNewCertificate'
        ($a | Where-Object Name -EQ 'HR Connector').Action | Should -Be 'RemoveOldCertificate'
        @($a | Where-Object Action -EQ 'ReplaceSecret').Name | Sort-Object | Should -Be @('Legacy Reports', 'Mail Automation', 'Payroll Export')
        (Get-Act $script:Rot.Plan 'NoKeyVaultBinding').Name | Should -Be 'Legacy Reports'
    }
    It 'the read sends only GETs, to Graph and the vault' {
        $fake = New-TestFake
        $null = Get-TestRotationPlan -Fake $fake
        @($fake.Calls | Where-Object { $_.Method -ne 'GET' }).Count | Should -Be 0
        @($fake.Calls | Where-Object { $_.Uri -match 'vault\.azure\.net' }).Count | Should -Be 3
    }
    It 'NPI-ROT-01: a certificate due with no approval waits for the owner, and a request is written for the owners' {
        $out = Get-TestRotationPlan -Approvals @()
        ($out.Plan.actions | Where-Object Name -EQ 'Vendor Portal').Action | Should -Be 'AwaitOwnerApproval'
        ($out.Requests | Where-Object Application -EQ 'Vendor Portal').RequestId | Should -Be 'ROT:0a000000-0000-4000-8000-000000000005:9c000000-0000-4000-8000-000000000005'
        @($out.Findings | Where-Object Rule -EQ 'NPI-ROT-01').Count | Should -Be 2
        @($out.Plan.actions | Where-Object { $_.Write -and $_.Name -in 'Vendor Portal', 'Deploy Bot' }).Count | Should -Be 0
    }
    It 'NPI-ROT-04: an approval from a guest, a non-owner or too long ago is refused' {
        $id = 'ROT:0a000000-0000-4000-8000-000000000005:9c000000-0000-4000-8000-000000000005'
        foreach ($case in @(
                @{ By = 'dave_partner.example#EXT#@contosoexample.onmicrosoft.com'; On = '2026-10-28'; Why = "isn't an enabled member" },
                @{ By = 'bob@contoso.example'; On = '2026-10-28'; Why = "isn't an owner" },
                @{ By = 'erin@contoso.example'; On = '2026-08-01'; Why = 'older than 30 days' })) {
            $out = Get-TestRotationPlan -Approvals @([pscustomobject]@{ RequestId = $id; ApprovedBy = $case.By; ApprovedOn = $case.On })
            $act = $out.Plan.actions | Where-Object Name -EQ 'Vendor Portal'
            $act.Action | Should -Be 'ApprovalRefused'
            $act.Detail | Should -Match ([regex]::Escape($case.Why))
        }
    }
    It 'the old certificate stays until the owner verifies and the overlap has passed' {
        $none = Get-TestRotationPlan -Verifications @()
        ($none.Plan.actions | Where-Object Name -EQ 'HR Connector').Action | Should -Be 'AwaitVerification'
        $early = Get-TestRotationPlan -AsOf ([datetime]'2026-10-25Z').ToUniversalTime()
        ($early.Plan.actions | Where-Object Name -EQ 'HR Connector').Action | Should -Be 'OverlapRunning'
    }
    It 'the removal keeps the new certificate and drops only the old one' {
        $a = (Get-Act $script:Rot.Plan 'RemoveOldCertificate')[0]
        @($a.Body.keyCredentials.keyId) | Should -Be @('9c000000-0000-4000-8000-000000000012')
        $a.Precheck.remove | Should -Be @('9c000000-0000-4000-8000-000000000002')
    }
    It 'NPI-ROT-05: a Key Vault policy or certificate longer than the cap is stopped before it reaches the app' {
        $fake = New-TestFake
        $fake.Tenant.applications['0a000000-0000-4000-8000-000000000005'].createdDateTime = '2026-12-01T00:00:00Z'
        $fake.Tenant.keyVaults['kv-npi-contoso'].certificates['vendor-portal'].policy.x509_props.validity_months = 6
        ((Get-TestRotationPlan -Fake $fake -AsOf ([datetime]'2026-11-20Z').ToUniversalTime()).Plan.actions | Where-Object Name -EQ 'Vendor Portal').Action | Should -Be 'KeyVaultPolicyOverCap'
        $fake2 = New-TestFake
        $fake2.Tenant.applications['0a000000-0000-4000-8000-000000000007'].createdDateTime = '2026-12-01T00:00:00Z'
        $fake2.Tenant.keyVaults['kv-npi-contoso'].certificates['deploy-bot'].versions[-1].exp = '2027-05-10T00:00:00Z'
        ((Get-TestRotationPlan -Fake $fake2).Plan.actions | Where-Object Name -EQ 'Deploy Bot').Action | Should -Be 'LifetimeOverCap'
        ($script:Rot.Findings | Where-Object { $_.Rule -eq 'NPI-ROT-05' }).Issue | Should -Match '730 days'
    }
    It 'the same inputs give the same plan, byte for byte' {
        (Save-TestPlan (Get-TestRotationPlan).Plan).Sha | Should -Be (Save-TestPlan $script:Rot.Plan).Sha
    }
    It 'runs a whole rotation in one tenant: renew, attach after approval, verify, wait out the overlap, remove' {
        $fake = New-TestFake -Write
        $app = '0a000000-0000-4000-8000-000000000005'; $req = "ROT:$app`:9c000000-0000-4000-8000-000000000005"
        $appr = @([pscustomobject]@{ RequestId = $req; ApprovedBy = 'erin@contoso.example'; ApprovedOn = '2026-10-28' })
        $step = {
            param($AsOf, $Verifications = @())
            $p = Get-TestRotationPlan -Fake $fake -Approvals $appr -Verifications $Verifications -AsOf $AsOf
            $s = Save-TestPlan $p.Plan
            $null = Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $fake 'rotation-apply') -AsOf $AsOf -Apply
            ($p.Plan.actions | Where-Object Name -EQ 'Vendor Portal').Action
        }
        & $step $script:AsOf | Should -Be 'RenewInKeyVault'
        & $step $script:AsOf | Should -Be 'AttachNewCertificate'
        @($fake.Tenant.applications[$app].keyCredentials).Count | Should -Be 2
        & $step $script:AsOf | Should -Be 'AwaitVerification'
        $thumb = ConvertFrom-NpiX5t (& $fake.Invoke 'GET' 'https://kv-npi-contoso.vault.azure.net/certificates/vendor-portal?api-version=2025-07-01' $null $null).x5t
        $ver = @([pscustomobject]@{ RequestId = $req; NewThumbprint = $thumb; VerifiedBy = 'erin@contoso.example'; VerifiedOn = '2026-10-31' })
        & $step ([datetime]'2026-11-02Z').ToUniversalTime() $ver | Should -Be 'OverlapRunning'
        & $step ([datetime]'2026-11-07Z').ToUniversalTime() $ver | Should -Be 'RemoveOldCertificate'
        $left = @($fake.Tenant.applications[$app].keyCredentials)
        $left.Count | Should -Be 1
        ConvertFrom-NpiCustomKeyIdentifier $left[0].customKeyIdentifier | Should -Be $thumb
    }
}

Describe 'The write path' {
    It 'refuses a plan whose SHA-256 nobody approved' {
        $s = Save-TestPlan $script:Pol.Plan
        { Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 ('0' * 64) -Writer (New-TestWriter (New-TestFake -Write) 'policy-apply') -AsOf $script:AsOf } | Should -Throw '*nobody reviewed*'
    }
    It 'refuses another task, tenant or cloud, an old plan, and a reader' {
        $s = Save-TestPlan $script:Pol.Plan; $f = New-TestFake -Write
        { Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'rotation-apply') -AsOf $script:AsOf } | Should -Throw "*task 'policy-apply'*"
        { Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-NpiCh04Client -Cloud gcc -Task policy-apply -Invoke $f.Invoke -TenantId 'other') -AsOf $script:AsOf } | Should -Throw '*is for tenant*'
        { Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'policy-apply') -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
        { Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'app-policy') -AsOf $script:AsOf } | Should -Throw "*doesn't write*"
    }
    It 'a dry run runs the prechecks and sends nothing' {
        $f = New-TestFake -Write
        $s = Save-TestPlan $script:Pol.Plan
        $run = Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'policy-apply') -AsOf $script:AsOf
        @($run.Results.Outcome | Sort-Object -Unique) | Should -Be @('WouldSend')
        @($f.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'refuses bodies the call list doesn''t allow: a lock turned off, a policy in a Key Vault create, a disabled default, a DELETE' {
        $w = New-TestWriter (New-TestFake -Write) 'policy-apply'
        $lock = (Get-Act $script:Pol.Plan 'LockApp')[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
        $lock.Body.servicePrincipalLockConfiguration.isEnabled = $false
        { Assert-NpiCh04PlannedWrite -Writer $w -Action $lock } | Should -Throw '*only lock body allowed*'
        $patch = (Get-Act $script:Pol.Plan 'PatchDefaultPolicy')[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
        $patch.Body.isEnabled = $false
        { Assert-NpiCh04PlannedWrite -Writer $w -Action $patch } | Should -Throw '*only ever enabled*'
        $patch.Method = 'DELETE'
        { Assert-NpiCh04PlannedWrite -Writer $w -Action $patch } | Should -Throw '*never sent*'
        $wr = New-TestWriter (New-TestFake -Write) 'rotation-apply'
        $renew = (Get-Act $script:Rot.Plan 'RenewInKeyVault')[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
        $renew.Body = [pscustomobject]@{ policy = @{ x509_props = @{ validity_months = 24 } } }
        { Assert-NpiCh04PlannedWrite -Writer $wr -Action $renew } | Should -Throw '*must be empty*'
        $rm = (Get-Act $script:Rot.Plan 'RemoveOldCertificate')[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
        $rm.Body.keyCredentials = @()
        { Assert-NpiCh04PlannedWrite -Writer $wr -Action $rm } | Should -Throw '*drops only the planned old certificates*'
    }
    It 'refuses an edited plan that would loosen a restriction, even with its new hash approved' {
        $f = New-TestFake -Write
        $f.Tenant.defaultAppManagementPolicy.applicationRestrictions.passwordCredentials = @(@{ restrictionType = 'customPasswordAddition'; state = 'enabled'; maxLifetime = $null; restrictForAppsCreatedAfterDateTime = '2024-01-01T00:00:00Z' }, @{ restrictionType = 'passwordLifetime'; state = 'enabled'; maxLifetime = 'P30D'; restrictForAppsCreatedAfterDateTime = '2024-01-01T00:00:00Z' })
        $plan = (Get-TestPolicyPlan -Fake $f).Plan | ConvertTo-Json -Depth 30 | ConvertFrom-Json
        $pc = $plan.actions[0].Body.applicationRestrictions.passwordCredentials | Where-Object restrictionType -EQ 'passwordLifetime'
        $pc.maxLifetime = 'P365D'
        $s = Save-TestPlan $plan
        { Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'policy-apply') -AsOf $script:AsOf -Apply } | Should -Throw '*loosen or drop applicationRestrictions.passwordLifetime*'
    }
    It 'skips a write whose precheck no longer holds: the default changed, the app was locked, the certificates changed' {
        $f = New-TestFake -Write
        $s = Save-TestPlan $script:Pol.Plan
        $f.Tenant.defaultAppManagementPolicy.isEnabled = $true
        $f.Tenant.applications['0a000000-0000-4000-8000-000000000001'].servicePrincipalLockConfiguration = @{ isEnabled = $true; allProperties = $true }
        $run = Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'policy-apply') -AsOf $script:AsOf -Apply
        ($run.Results | Where-Object Action -EQ 'PatchDefaultPolicy').Outcome | Should -Be 'Skipped'
        ($run.Results | Where-Object Name -EQ 'Payroll Export').Detail | Should -Be 'Already locked'
        $fr = New-TestFake -Write
        $sr = Save-TestPlan $script:Rot.Plan
        $fr.Tenant.applications['0a000000-0000-4000-8000-000000000002'].keyCredentials = @($fr.Tenant.applications['0a000000-0000-4000-8000-000000000002'].keyCredentials)[1]
        $run2 = Invoke-NpiCredentialPlan -PlanPath $sr.Path -ApprovedSha256 $sr.Sha -Writer (New-TestWriter $fr 'rotation-apply') -AsOf $script:AsOf -Apply
        ($run2.Results | Where-Object Action -EQ 'RemoveOldCertificate').Outcome | Should -Be 'Skipped'
    }
    It 'with -Apply sends the policy writes and records each in the evidence' {
        $f = New-TestFake -Write
        $s = Save-TestPlan $script:Pol.Plan
        $run = Invoke-NpiCredentialPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer (New-TestWriter $f 'policy-apply') -AsOf $script:AsOf -Apply
        $f.Tenant.defaultAppManagementPolicy.isEnabled | Should -BeTrue
        @($f.Tenant.appManagementPolicies | Where-Object { @($_.appliesTo) -contains '0a000000-0000-4000-8000-000000000006' }).displayName | Should -Be 'NPI exception EXC-NPI-0001: Mail Automation'
        @($run.Evidence | Where-Object Method -NE 'GET').Count | Should -Be 8
        @($f.Calls | Where-Object Method -EQ 'DELETE').Count | Should -Be 0
    }
}

Describe 'The entry scripts' {
    It 'write the plans, the findings and manifests with the permissions each task holds' {
        $pol = Join-Path $script:Tmp 'policy'; $rot = Join-Path $script:Tmp 'rotation'
        $o1 = & (Join-Path $script:Root 'Invoke-NpiCredentialPolicy.ps1') -Cloud gcc -RegisterRun $script:InvRun -FixturePath $script:Tenant -OutputPath $pol
        $o2 = & (Join-Path $script:Root 'Invoke-NpiRotation.ps1') -Cloud gcc -RegisterRun $script:InvRun -InputPath $script:Inputs -FixturePath $script:Tenant -OutputPath $rot
        ($o1 -join "`n") | Should -Match '8 of them writes'
        ($o2 -join "`n") | Should -Match '3 writes'
        $m = Get-Content (Join-Path $pol 'manifest.json') -Raw | ConvertFrom-Json
        $m.graphPermissions | Should -Be @('Application.Read.All', 'Policy.Read.All')
        $m.files.'policy-plan.json' | Should -Be (Get-NpiFileHash -Path (Join-Path $pol 'policy-plan.json'))
        (Get-Content (Join-Path $rot 'manifest.json') -Raw | ConvertFrom-Json).azureRoles | Should -Be @('Key Vault Reader')
        $sha = Get-NpiFileHash -Path (Join-Path $rot 'rotation-plan.json')
        $o3 = & (Join-Path $script:Root 'Invoke-NpiCredentialAction.ps1') -Cloud gcc -PlanPath (Join-Path $rot 'rotation-plan.json') -ApprovedSha256 $sha -FixturePath $script:Tenant -OutputPath (Join-Path $script:Tmp 'rot-dry')
        $o3[0] | Should -Be 'DryRun: 3 WouldSend'
    }
}
