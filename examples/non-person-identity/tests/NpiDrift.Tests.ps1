#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 10: Microsoft's Sentinel rule for added credentials, run as published; the drift task's
# call list; the audit and sign-in reads; the register drift findings against an approved baseline;
# the contract with Chapters 03 to 09; the review cycle; the vintage comparison; and the run folder
# examples/drift-pipeline/python/npi_evidence.py packages. Fixtures and fakes only.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiDrift/NpiDrift.psm1') -Force
    . (Join-Path $PSScriptRoot 'SentinelRuleHarness.ps1')
    $script:Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Ch10 = Join-Path $PSScriptRoot 'fixtures/ch10'
    $script:Tenant = 'c0ffee00-0000-4000-8000-000000000001'
    $script:Audit = Join-Path $script:Ch10 'audit.json'
    $script:SignIn = Join-Path $script:Ch10 'signin-activity.json'
    $script:Contract = Join-Path $script:Ch10 'contract'
    $script:Pipeline = Join-Path $script:Ch10 'inputs/pipeline-identities.csv'
    $script:Policy = Get-NpiDriftPolicy
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-drift-{0}" -f [guid]::NewGuid())
    $script:Lab = @{ Cloud = 'gcc'; TenantId = $script:Tenant; InputPath = (Join-Path $PSScriptRoot 'fixtures/inputs'); AuditFixturePath = $script:Audit
        SignInFixturePath = $script:SignIn; ContractPath = $script:Contract; PipelineIdentitiesPath = $script:Pipeline }
    $runs = Join-Path $script:Tmp 'runs'
    $null = & (Join-Path $script:Root 'Invoke-NpiDriftRun.ps1') @script:Lab -OutputPath $runs -FixturePath (Join-Path $script:Ch10 'estate-day1.json') -AsOf ([datetime]'2026-10-29T06:00:00Z')
    $script:Day1 = Join-Path $runs '2026-10-29T0600Z-fixture'
    $script:BasePath = Join-Path $script:Day1 'drift/baseline-candidate.json'
    $script:BaseSha = Get-NpiFileHash -Path $script:BasePath
    $null = & (Join-Path $script:Root 'Invoke-NpiDriftRun.ps1') @script:Lab -OutputPath $runs -FixturePath (Join-Path $script:Ch10 'estate-day2.json') -AsOf ([datetime]'2026-10-30T06:00:00Z') -BaselinePath $script:BasePath -ApprovedBaselineSha256 $script:BaseSha
    $script:Day2 = Join-Path $runs '2026-10-30T0600Z-fixture'
    function Read-RunJson([string]$Run, [string]$Rel) { Get-Content -LiteralPath (Join-Path $Run $Rel) -Raw | ConvertFrom-Json }
    $script:F1 = @(Read-RunJson $script:Day1 'drift/findings.json')
    $script:F2 = @(Read-RunJson $script:Day2 'drift/findings.json')
    function Get-F([string]$Rule, [object[]]$From = $script:F2) { @($From | Where-Object Rule -EQ $Rule) }
    $script:Rows2 = @(Read-RunJson $script:Day2 'inventory/register.json')
    $script:AuditRows = @((Get-Content $script:Audit -Raw | ConvertFrom-Json -AsHashtable -Depth 50).directoryAudits)
    function Invoke-Rule([object[]]$Items = $script:AuditRows) { Invoke-SentinelRule -Rows @($Items | ForEach-Object { ConvertTo-AuditLogsRow $_ }) }
    function Copy-Item2($Item) { $Item | ConvertTo-Json -Depth 20 | ConvertFrom-Json -AsHashtable -Depth 20 }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'Chapter 10: the Sentinel rule Learn links for added credentials, run as published' {
    It 'is the pinned, unmodified copy' {
        $snap = Get-Content (Join-Path $script:Root '../third_party/sentinel-app-credential-rule/snapshot.json') -Raw | ConvertFrom-Json -AsHashtable
        foreach ($f in $snap.files.Keys) {
            (Get-FileHash (Join-Path $script:Root "../third_party/sentinel-app-credential-rule/$f") -Algorithm SHA256).Hash.ToLower() | Should -Be $snap.files[$f].sha256
        }
    }
    It 'has 20 stages, each one the harness recognizes; a changed stage throws' {
        (Get-SentinelRuleStage).Count | Should -Be 20
        { Invoke-SentinelRule -Rows @() -Query ((Get-SentinelRuleQuery) -replace '=~ "success"', '=~ "failure"') } | Should -Throw '*doesn''t recognize*'
    }
    It 'finds the secret a person added to an app that already had a credential: the model for NPI-DRF-07' {
        $out = @((Invoke-Rule).Output)
        $out.Count | Should -Be 1
        $out[0].targetDisplayName | Should -Be 'HR Connector'
        $out[0].keyType | Should -Be 'Password'
        $out[0].keyIdentifier | Should -Be '9c000000-0000-4000-8000-000000000031'
    }
    It 'names the activity with a hyphen, as Learn''s activity list does and the code reads it' {
        (Get-SentinelRuleQuery) | Should -Match 'Update application - Certificates and secrets management'
        $script:Policy.activities.Keys | Should -Contain 'Update application - Certificates and secrets management'
        ConvertTo-NpiActivityName "Update application $([char]0x2013) Certificates and secrets management" | Should -Be 'Update application - Certificates and secrets management'
    }
    It 'misses a credential added by an app, whatever the app is: the initiator must carry an "@"' {
        $ids = @((Invoke-Rule).Output | ForEach-Object keyIdentifier)
        $ids | Should -Not -Contain '9c000000-0000-4000-8000-000000000033'   # by Mail Automation, to Payroll Export's service principal
        $ids | Should -Not -Contain '9c000000-0000-4000-8000-000000000032'   # by the rotation pipeline
    }
    It 'misses the first credential on an app that had none: old_value_set must not be "[]"' {
        @((Invoke-Rule).Output | ForEach-Object keyIdentifier) | Should -Not -Contain '9c000000-0000-4000-8000-000000000034'
    }
    It 'drops service principal targets even when a person adds the credential' {
        $sp = Copy-Item2 ($script:AuditRows | Where-Object id -EQ 'Directory_aud-03')
        $sp.initiatedBy = @{ user = @{ id = '5a000000-0000-4000-8000-000000000003'; userPrincipalName = 'carol@contoso.example'; ipAddress = '192.0.2.10' }; app = $null }
        $sp.targetResources[0].modifiedProperties = @(@{ displayName = 'KeyDescription'; oldValue = '["[KeyIdentifier=k0,KeyType=Password,KeyUsage=Verify,DisplayName=a]"]'; newValue = '["[KeyIdentifier=k0,KeyType=Password,KeyUsage=Verify,DisplayName=a]","[KeyIdentifier=k1,KeyType=Password,KeyUsage=Verify,DisplayName=b]"]' })
        @((Invoke-Rule @($sp)).Output).Count | Should -Be 0
    }
    It 'alerts on the pipeline''s own rotation when a person runs it: it knows no pipeline and no change record' {
        $p = Copy-Item2 ($script:AuditRows | Where-Object id -EQ 'Directory_aud-02')
        $p.initiatedBy = @{ user = @{ id = '5a000000-0000-4000-8000-000000000008'; userPrincipalName = 'harry@contoso.example'; ipAddress = '192.0.2.11' }; app = $null }
        @((Invoke-Rule @($p)).Output).Count | Should -Be 1
    }
    It 'reads only the first of two credentials added in one event' {
        $two = Copy-Item2 ($script:AuditRows | Where-Object id -EQ 'Directory_aud-01')
        $two.targetResources[0].modifiedProperties[0].newValue = '["[KeyIdentifier=9c000000-0000-4000-8000-000000000002,KeyType=AsymmetricX509Cert,KeyUsage=Verify,DisplayName=CN=hr-connector]","[KeyIdentifier=n1,KeyType=Password,KeyUsage=Verify,DisplayName=a]","[KeyIdentifier=n2,KeyType=Password,KeyUsage=Verify,DisplayName=b]"]'
        $out = @((Invoke-Rule @($two)).Output)
        $out.Count | Should -Be 1
        $out[0].keyIdentifier | Should -Be 'n1'
    }
    It 'carries the initiator''s user principal name, split into Name and UPNSuffix' {
        $out = @((Invoke-Rule).Output)[0]
        $out.InitiatingUserPrincipalName | Should -Be 'carol@contoso.example'
        $out.Name | Should -Be 'carol'
    }
    It 'looks back one hour, with no link to the register, the owners or the expiry of the credential' {
        Get-SentinelRuleField 'queryFrequency' | Should -Be '1h'
        Get-SentinelRuleField 'queryPeriod' | Should -Be '1h'
        (Get-SentinelRuleQuery) | Should -Not -Match 'endDateTime|owner'
    }
}

Describe 'Chapter 10: the call list (config/calls-ch10.json)' {
    It 'each task''s declared permissions, roles and rights are exactly the union of its calls' {
        $list = Get-NpiDriftCallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            @($list.tasks[$task].graphPermissions | Sort-Object) | Should -Be @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].azureRoles | Sort-Object) | Should -Be @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].adRights | Sort-Object) | Should -Be @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].delegatedRoles | Sort-Object) | Should -Be @($calls | ForEach-Object { $_.delegatedRoles } | Sort-Object -Unique) -Because "task $task"
        }
    }
    It 'holds only GETs, nothing ending in ReadWrite, and a Learn page and stage for every call' {
        foreach ($c in (Get-NpiDriftCallList).calls) {
            $c.method | Should -Be 'GET'
            @($c.permissions | Where-Object { $_ -match 'ReadWrite' }).Count | Should -Be 0
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
            $c.stage | Should -Not -BeNullOrEmpty
        }
    }
    It 'marks the sign-in activity report beta and global only' {
        $c = @((Get-NpiDriftCallList).calls | Where-Object id -EQ 'sp-signin-activities')[0]
        $c.stage | Should -Be 'beta'; $c.version | Should -Be 'beta'
        $c.clouds | Should -Not -Contain 'gcchigh'; $c.clouds | Should -Not -Contain 'dod'
    }
    It 'the drift run needs four Graph permissions, none a write, and Reader' {
        $p = Get-NpiDriftPermission -Task drift-run
        $p.GraphPermissions | Should -Be @('Application.Read.All', 'AuditLog.Read.All', 'Directory.Read.All', 'User.Read.All')
        $p.AzureRoles | Should -Be @('Reader')
        (Get-NpiDriftPermission -Task drift).GraphPermissions | Should -Be @('AuditLog.Read.All')
    }
    It 'the drift reader refuses a call it doesn''t declare' {
        $fake = New-NpiDriftFixtureInvoker -AuditPath $script:Audit -SignInPath $script:SignIn
        $r = New-NpiDriftReader -Cloud gcc -Invoke $fake.Invoke
        { Invoke-NpiList -Reader $r -CallId 'graph-applications' } | Should -Throw '*Undeclared call*'
    }
}

Describe 'Chapter 10: the audit and sign-in reads' {
    BeforeAll {
        $script:Fake = New-NpiDriftFixtureInvoker -AuditPath $script:Audit -SignInPath $script:SignIn
        $script:Reader = New-NpiDriftReader -Cloud gcc -Invoke $script:Fake.Invoke
        $script:Events = @(Get-NpiAuditEvent -Reader $script:Reader -Since ([datetime]'2026-10-29T06:00:00Z') -Until ([datetime]'2026-10-30T06:00:00Z'))
    }
    It 'sends one filtered GET per activity name, to the cloud''s Graph host, and follows every page' {
        $first = @($script:Fake.Calls | Where-Object { $_.Uri -notmatch 'skiptoken' })
        $first.Count | Should -Be 6
        @($script:Fake.Calls | Where-Object { $_.Method -ne 'GET' -or $_.Uri -notlike 'https://graph.microsoft.com/v1.0/auditLogs/directoryAudits*' }).Count | Should -Be 0
        @($script:Fake.Calls | Where-Object { $_.Uri -match 'skiptoken' }).Count | Should -BeGreaterThan 0
    }
    It 'reads the window''s eight events, not the older one, and keeps the failure without acting on it' {
        $script:Events.Count | Should -Be 8
        $script:Events.Id | Should -Not -Contain 'Directory_aud-00'
        ($script:Events | Where-Object Id -EQ 'Directory_aud-08').Result | Should -Be 'failure'
        $script:Events.Id | Should -Not -Contain 'Directory_aud-07'   # Add service principal isn't a credential or consent activity
    }
    It 'keeps IDs and key IDs, never a name or a key''s display name' {
        $json = $script:Events | ConvertTo-Json -Depth 10
        $json | Should -Not -Match '@contoso\.example|#EXT#|CN=|DisplayName'
        ($script:Events | Where-Object Id -EQ 'Directory_aud-01').KeysAdded.KeyId | Should -Be '9c000000-0000-4000-8000-000000000031'
    }
    It 'refuses a window older than the 30 days the audit log keeps, or one that ends before it starts' {
        { Get-NpiAuditEvent -Reader $script:Reader -Since ([datetime]'2026-09-01T00:00:00Z') -Until ([datetime]'2026-10-30T06:00:00Z') } | Should -Throw '*keeps 30 days*'
        { Get-NpiAuditEvent -Reader $script:Reader -Since ([datetime]'2026-10-30T06:00:00Z') -Until ([datetime]'2026-10-29T06:00:00Z') } | Should -Throw '*before it starts*'
    }
    It 'reads the sign-in activity report on beta in GCC, and doesn''t send it in GCC High' {
        $s = Get-NpiSignInActivity -Reader $script:Reader
        $s.Status | Should -Be 'Read'
        $s.ByAppId['1a000000-0000-4000-8000-000000000003'] | Should -Be '2026-05-01T08:00:00Z'
        @($script:Fake.Calls | Where-Object { $_.Uri -like 'https://graph.microsoft.com/beta/reports/servicePrincipalSignInActivities*' }).Count | Should -BeGreaterThan 0
        $hi = New-NpiDriftFixtureInvoker -AuditPath $script:Audit -SignInPath $script:SignIn -Cloud gcchigh
        (Get-NpiSignInActivity -Reader (New-NpiDriftReader -Cloud gcchigh -Invoke $hi.Invoke)).Status | Should -Be 'NotAvailable'
        $hi.Calls.Count | Should -Be 0
    }
}

Describe 'Chapter 10: the approved baseline' {
    It 'is refused unless its SHA-256 is the approved one' {
        { Import-NpiDriftBaseline -Path $script:BasePath -ApprovedSha256 ('0' * 64) -TenantId $script:Tenant -Cloud gcc } | Should -Throw '*nobody approved*'
    }
    It 'is refused for another tenant or another cloud' {
        { Import-NpiDriftBaseline -Path $script:BasePath -ApprovedSha256 $script:BaseSha -TenantId '11111111-1111-4111-8111-111111111111' -Cloud gcc } | Should -Throw '*not 11111111*'
        { Import-NpiDriftBaseline -Path $script:BasePath -ApprovedSha256 $script:BaseSha -TenantId $script:Tenant -Cloud gcchigh } | Should -Throw '*not ''gcchigh''*'
    }
    It 'a run with no baseline compares with nothing and writes a candidate' {
        @(Get-F 'NPI-DRF-01' $script:F1).Count + @(Get-F 'NPI-DRF-02' $script:F1).Count | Should -Be 0
        (Read-RunJson $script:Day1 'run.json').baseline | Should -BeNullOrEmpty
        (Read-RunJson $script:Day2 'run.json').baseline.sha256 | Should -Be $script:BaseSha
    }
    It 'gives the same fingerprint to an unchanged row, and lists the columns that changed' {
        $b = Get-Content $script:BasePath -Raw | ConvertFrom-Json -AsHashtable
        $payroll = $script:Rows2 | Where-Object IdentityId -EQ 'app:1a000000-0000-4000-8000-000000000001'
        Get-NpiRowFingerprint $payroll | Should -Be $b.identities['app:1a000000-0000-4000-8000-000000000001'].fingerprint
        (Get-F 'NPI-DRF-02' | Where-Object ObjectKey -EQ 'app:1a000000-0000-4000-8000-000000000002').Issue | Should -Match 'Secrets, CredentialKind$'
        @(Get-F 'NPI-DRF-02').Count | Should -Be 6
    }
}

Describe 'Chapter 10: the register drift findings' {
    It 'NPI-DRF-01: the new app registration since the baseline' {
        @(Get-F 'NPI-DRF-01').ObjectKey | Should -Contain 'app:1a000000-0000-4000-8000-000000000009'
    }
    It 'NPI-DRF-03: exactly Chapter 02''s orphan candidates' {
        $orphans = @(Read-RunJson $script:Day2 'ownership/ownership.json' | Where-Object OrphanCandidate | ForEach-Object IdentityId | Sort-Object)
        @(Get-F 'NPI-DRF-03' | ForEach-Object ObjectKey | Sort-Object) | Should -Be $orphans
        $orphans.Count | Should -Be 7
    }
    It 'NPI-DRF-04: unused for 90 days or never signed in, but not an app too new to judge' {
        @(Get-F 'NPI-DRF-04' | ForEach-Object ObjectKey | Sort-Object) | Should -Be @('app:1a000000-0000-4000-8000-000000000003', 'sp:5b000000-0000-4000-8000-000000000012')
    }
    It 'NPI-DRF-05: the certificate that expires within 30 days, gone once the pipeline rotates it' {
        (Get-F 'NPI-DRF-05' $script:F1).ObjectKey | Should -Be 'app:1a000000-0000-4000-8000-000000000005'
        @(Get-F 'NPI-DRF-05').Count | Should -Be 0
        @(Get-F 'NPI-DRF-07' | Where-Object ObjectKey -Like '*000000000036').Count | Should -Be 0
    }
    It 'NPI-DRF-06: every enabled AD account whose password never expires, but not the person found only that way' {
        @(Get-F 'NPI-DRF-06' | ForEach-Object ObjectKey | Sort-Object) | Should -Be @('ad:ad000000-0000-4000-8000-000000000001', 'ad:ad000000-0000-4000-8000-000000000002', 'ad:ad000000-0000-4000-8000-000000000004')
    }
    It 'NPI-DRF-07: the three credentials added outside the pipeline, not the pipeline''s logged rotation' {
        @(Get-F 'NPI-DRF-07' | ForEach-Object { ($_.ObjectKey -split '/key:')[1] } | Sort-Object) | Should -Be @('9c000000-0000-4000-8000-000000000031', '9c000000-0000-4000-8000-000000000033', '9c000000-0000-4000-8000-000000000034')
        (Get-F 'NPI-DRF-07' | Where-Object ObjectKey -Like '*000000000033').ObjectKey | Should -BeLike 'app:1a000000-0000-4000-8000-000000000001/*'
    }
    It 'NPI-DRF-07: the pipeline''s identity adding a key it didn''t log, or a person adding a logged key, is still outside' {
        $rows = $script:Rows2
        $ev = @(Get-NpiAuditEvent -Reader (New-NpiDriftReader -Cloud gcc -Invoke (New-NpiDriftFixtureInvoker -AuditPath $script:Audit).Invoke) -Since ([datetime]'2026-10-29T06:00:00Z') -Until ([datetime]'2026-10-30T06:00:00Z'))
        $pipe = @([pscustomobject]@{ ServicePrincipalId = '5b000000-0000-4000-8000-000000000020' })
        $none = @(Test-NpiRegisterDrift -Rows $rows -AsOf ([datetime]'2026-10-30T06:00:00Z') -Events $ev -PipelineIdentities $pipe -CredentialLog @() | Where-Object Rule -EQ 'NPI-DRF-07')
        ($none | Where-Object ObjectKey -Like '*000000000032').Issue | Should -Match 'not in its credential log'
        $log = @([pscustomobject]@{ ObjectId = '0a000000-0000-4000-8000-000000000002'; KeyId = '9c000000-0000-4000-8000-000000000031'; ChangeId = 'CHG-X' })
        $byUser = @(Test-NpiRegisterDrift -Rows $rows -AsOf ([datetime]'2026-10-30T06:00:00Z') -Events $ev -PipelineIdentities $pipe -CredentialLog $log | Where-Object Rule -EQ 'NPI-DRF-07')
        ($byUser | Where-Object ObjectKey -Like '*000000000031').Issue | Should -Match 'in the credential log but added by user'
    }
    It 'NPI-DRF-08: a grant for all users is a Finding, with the audit events behind it' {
        $f = @(Get-F 'NPI-DRF-08')
        $f.Count | Should -Be 1
        $f[0].ObjectKey | Should -Be 'app:1a000000-0000-4000-8000-000000000006'
        $f[0].Severity | Should -Be 'Finding'
        $f[0].Issue | Should -Match 'consented for all users.*Consent to application.*Add delegated permission grant'
    }
    It 'NPI-DRF-09: a contract file that fails its check is refused, and missing chapters are listed' {
        (Get-F 'NPI-DRF-09' | Where-Object Severity -EQ 'Warn').ObjectKey | Should -Be 'contract:ch05-findings.json'
        @(Get-F 'NPI-DRF-09' | Where-Object Severity -EQ 'Info' | ForEach-Object ObjectKey) | Should -Be @('contract:chapter-03', 'contract:chapter-04', 'contract:chapter-05', 'contract:chapter-06', 'contract:chapter-08')
    }
    It 'NPI-DRF-09: GCC High records the unused check as not read' {
        $f = @(Test-NpiRegisterDrift -Rows $script:Rows2 -AsOf ([datetime]'2026-10-30T06:00:00Z') -SignIn ([pscustomobject]@{ Status = 'NotAvailable'; ByAppId = @{} }) -Cloud gcchigh)
        @($f | Where-Object Rule -EQ 'NPI-DRF-04').Count | Should -Be 0
        ($f | Where-Object Rule -EQ 'NPI-DRF-09').ObjectKey | Should -Be 'signin-activity:gcchigh'
    }
    It 'a finding keeps its fingerprint from run to run, and the fingerprint is SHA-256(rule|key|) cut to 16' {
        $a = Get-F 'NPI-DRF-06' $script:F1 | Where-Object ObjectKey -EQ 'ad:ad000000-0000-4000-8000-000000000001'
        $b = Get-F 'NPI-DRF-06' | Where-Object ObjectKey -EQ 'ad:ad000000-0000-4000-8000-000000000001'
        $a.Fingerprint | Should -Be $b.Fingerprint
        $hash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes('NPI-DRF-06|ad:ad000000-0000-4000-8000-000000000001|'))).ToLower()
        $b.Fingerprint | Should -Be $hash.Substring(0, 16)
    }
    It 'nothing in the run sent anything but a GET or a Get-AD* read' {
        foreach ($t in 'inventory', 'ownership', 'drift') {
            @((Read-RunJson $script:Day2 "$t/manifest.json").requests | Where-Object { $_.method -notin 'GET', 'READ' }).Count | Should -Be 0 -Because $t
        }
    }
}

Describe 'Chapter 10: the contract with Chapters 03 to 09' {
    BeforeAll {
        function Write-Contract($Obj) { $p = Join-Path $script:Tmp ("c-{0}.json" -f [guid]::NewGuid()); Write-NpiDriftJson -Path $p -Value $Obj; $p }
        $script:Ok = @{ schema = 'fmp-npi-findings/1'; chapter = '07'; tenantId = $script:Tenant; findings = @(@{ id = 'NPI-SAMPLE-01:app:x'; rule = 'NPI-SAMPLE-01'; severity = 'Warn'; chapter = '07'; objectKey = 'app:x'; fingerprint = (Get-NpiFingerprint 'NPI-SAMPLE-01' 'app:x') }) }
    }
    It 'accepts a findings file that meets the contract' {
        (Read-NpiContractFile -Path (Write-Contract $script:Ok) -TenantId $script:Tenant).Data.Fingerprint | Should -Be (Get-NpiFingerprint 'NPI-SAMPLE-01' 'app:x')
    }
    It 'refuses another tenant, an unknown schema, chapter 10 itself, a bad ID or a severity it doesn''t know' {
        $t = Copy-Item2 $script:Ok; $t.tenantId = '11111111-1111-4111-8111-111111111111'
        { Read-NpiContractFile -Path (Write-Contract $t) -TenantId $script:Tenant } | Should -Throw '*tenant*'
        $s = Copy-Item2 $script:Ok; $s.schema = 'fmp-npi-findings/2'
        { Read-NpiContractFile -Path (Write-Contract $s) -TenantId $script:Tenant } | Should -Throw '*unknown schema*'
        $c = Copy-Item2 $script:Ok; $c.chapter = '10'
        { Read-NpiContractFile -Path (Write-Contract $c) -TenantId $script:Tenant } | Should -Throw '*chapter ''10''*'
        $i = Copy-Item2 $script:Ok; $i.findings[0].id = 'x'
        { Read-NpiContractFile -Path (Write-Contract $i) -TenantId $script:Tenant } | Should -Throw '*<rule>:<objectKey>*'
        $v = Copy-Item2 $script:Ok; $v.findings[0].severity = 'High'
        { Read-NpiContractFile -Path (Write-Contract $v) -TenantId $script:Tenant } | Should -Throw '*severity*'
    }
    It 'carries Chapters 07 and 09''s findings into the run as they were written' {
        @(Read-RunJson $script:Day2 'drift/chapter-findings.json' | ForEach-Object Rule | Sort-Object) | Should -Be @('NPI-SAMPLE-01', 'NPI-SAMPLE-02')
    }
}

Describe 'Chapter 10: the review cycle, read from Chapters 07 and 09' {
    It 'NPI-REV-01: an app holding Graph permissions with no owners'' review in the quarter; a current review passes' {
        @(Get-F 'NPI-REV-01' | ForEach-Object ObjectKey | Sort-Object) | Should -Be @('app:1a000000-0000-4000-8000-000000000004', 'app:1a000000-0000-4000-8000-000000000006')
        ((Read-RunJson $script:Day2 'drift/review-cycle.json') | Where-Object IdentityId -EQ 'app:1a000000-0000-4000-8000-000000000001').OwnerReview | Should -Be '2026-09-15'
    }
    It 'NPI-REV-02: the agent identity with no sponsor attestation; the attested blueprint passes' {
        (Get-F 'NPI-REV-02').ObjectKey | Should -Be 'sp:5b000000-0000-4000-8000-000000000015'
    }
    It 'NPI-REV-03: an agent access assignment with no end date' {
        (Get-F 'NPI-REV-03').ObjectKey | Should -Be 'sp:5b000000-0000-4000-8000-000000000015/assignment:AP-02'
    }
    It 'NPI-REV-04: with no review records, the cycle is shown as not received, not as passed' {
        $r = Test-NpiReviewCycle -Rows $script:Rows2 -AsOf ([datetime]'2026-10-30T06:00:00Z')
        @($r.Findings | ForEach-Object Rule | Sort-Object -Unique) | Should -Be @('NPI-REV-04')
        @($r.Findings).Count | Should -Be 3
    }
}

Describe 'Chapter 10: the annual vintage comparison' {
    BeforeAll {
        $null = & (Join-Path $script:Root 'Invoke-NpiVintage.ps1') -RegisterRun (Join-Path $script:Day2 'inventory') -Vintage 2026 -CurrentPath (Join-Path $script:Ch10 'vintage/ai-inventory-2026.csv') `
            -PriorPath (Join-Path $script:Ch10 'vintage/ai-inventory-2025.csv') -UseCaseMapPath (Join-Path $script:Ch10 'vintage/ai-use-cases.csv') `
            -ServiceRecordsPath (Join-Path $PSScriptRoot 'fixtures/inputs/service-records.csv') -OutputPath (Join-Path $script:Tmp 'vintage')
        $script:V = @(Get-Content (Join-Path $script:Tmp 'vintage/vintage-2026/findings.json') -Raw | ConvertFrom-Json)
    }
    It 'finds Book 17''s four changes and the AI identity with no use case' {
        @($script:V | ForEach-Object { "$($_.Rule) $($_.Severity) $($_.ObjectKey)" } | Sort-Object) | Should -Be @(
            'NPI-VIN-01 Finding usecase:UC-005', 'NPI-VIN-01 Info usecase:UC-006', 'NPI-VIN-02 Finding usecase:UC-002',
            'NPI-VIN-03 Warn usecase:UC-003', 'NPI-VIN-04 Finding usecase:UC-004', 'NPI-VIN-05 Warn sp:5b000000-0000-4000-8000-000000000015')
    }
    It 'records the tenant and the SHA-256 of the register and every input' {
        $m = Get-Content (Join-Path $script:Tmp 'vintage/vintage-2026/manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'vintage'; $m.tenantId | Should -Be $script:Tenant
        @($m.inputs.PSObject.Properties.Name).Count | Should -Be 4
    }
    It 'matches the comparison examples/drift-pipeline keeps as a fixture' {
        foreach ($f in 'findings.json', 'changes.json') {
            Get-NpiFileHash -Path (Join-Path $script:Root "../drift-pipeline/tests/fixtures/npi-vintage/vintage-2026/$f") | Should -Be (Get-NpiFileHash -Path (Join-Path $script:Tmp "vintage/vintage-2026/$f")) -Because $f
        }
    }
}

Describe 'Chapter 10: the run folder' {
    It 'run.json names the tenant, the cloud, the window and each task''s manifest hash' {
        $i = Read-RunJson $script:Day2 'run.json'
        $i.schema | Should -Be 'fmp-npi-run/1'; $i.tenantId | Should -Be $script:Tenant; $i.readOnly | Should -BeTrue
        (ConvertTo-NpiUtc $i.auditWindow.since).ToString('yyyy-MM-ddTHH:mm:ssZ') | Should -Be '2026-10-29T06:00:00Z'
        foreach ($t in 'inventory', 'ownership', 'drift') {
            $i.tasks.$t.status | Should -Be 'OK'
            $i.tasks.$t.manifestSha256 | Should -Be (Get-NpiFileHash -Path (Join-Path $script:Day2 "$($i.tasks.$t.folder)/manifest.json"))
        }
    }
    It 'gives the same findings, byte for byte, from the same inputs' {
        $again = Join-Path $script:Tmp 'again'
        $null = & (Join-Path $script:Root 'Invoke-NpiDriftRun.ps1') @script:Lab -OutputPath $again -FixturePath (Join-Path $script:Ch10 'estate-day2.json') -AsOf ([datetime]'2026-10-30T06:00:00Z') -BaselinePath $script:BasePath -ApprovedBaselineSha256 $script:BaseSha
        foreach ($f in 'findings.json', 'events.json', 'baseline-candidate.json', 'review-cycle.json', 'summary.json') {
            Get-NpiFileHash -Path (Join-Path $again "2026-10-30T0600Z-fixture/drift/$f") | Should -Be (Get-NpiFileHash -Path (Join-Path $script:Day2 "drift/$f")) -Because $f
        }
    }
    It 'records a failed task as Error with no folder, and the drift task that needs it fails too' {
        $bad = Join-Path $script:Tmp 'bad'
        $null = & (Join-Path $script:Root 'Invoke-NpiDriftRun.ps1') @script:Lab -OutputPath $bad -FixturePath (Join-Path $script:Tmp 'missing.json') -AsOf ([datetime]'2026-10-30T06:00:00Z') 3>$null
        $i = Get-Content (Join-Path $bad '2026-10-30T0600Z-fixture/run.json') -Raw | ConvertFrom-Json
        $i.tasks.inventory.status | Should -Be 'Error'; $i.tasks.drift.status | Should -Be 'Error'
        Test-Path (Join-Path $bad '2026-10-30T0600Z-fixture/inventory') | Should -BeFalse
    }
    It 'matches the two runs examples/drift-pipeline keeps as fixtures, file for file' {
        # The kept runs were written on Windows, where Chapters 01 and 02 write CRLF; compare the JSON, not the line endings.
        $kept = Join-Path $script:Root '../drift-pipeline/tests/fixtures/npi-runs'
        $norm = { param($p) $t = [IO.File]::ReadAllText($p); if ($t.Trim()) { $t | ConvertFrom-Json -Depth 50 | ConvertTo-Json -Depth 50 -Compress } else { '' } }
        foreach ($day in '2026-10-29T0600Z-fixture', '2026-10-30T0600Z-fixture') {
            foreach ($f in 'drift/findings.json', 'drift/events.json', 'drift/chapter-findings.json', 'drift/review-cycle.json', 'drift/summary.json', 'inventory/register.json', 'inventory/findings.json', 'ownership/ownership.json', 'ownership/findings.json') {
                (& $norm (Join-Path $script:Tmp "runs/$day/$f")) | Should -Be (& $norm (Join-Path $kept "$day/$f")) -Because "$day/$f"
            }
        }
    }
}
