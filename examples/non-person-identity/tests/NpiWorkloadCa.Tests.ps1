#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 08: Conditional Access for workload identities. Learn's Graph JSON sample, pinned in
# examples/third_party/entra-workload-identity-ca-page, run as published; then the call list, the
# pre-merge check, the tenant check, the plan and its writes, enforcement ring by ring, the
# sign-in reader and the alert definition, against the fictional tenant served by the fake.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiWorkloadCa/NpiWorkloadCa.psm1') -Force
    $script:Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Page = (Resolve-Path (Join-Path $PSScriptRoot '../../third_party/entra-workload-identity-ca-page/workload-identity.md')).Path
    $script:ScopePath = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch08/scope.json')).Path
    $script:TenantPath = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch08/tenant.json')).Path
    $script:Repo = Read-NpiWcaRepository
    $script:Scope = Read-NpiWcaScope -Path $script:ScopePath
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:From = [datetime]::SpecifyKind([datetime]'2026-10-12T00:00:00', 'Utc')
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-wca-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $script:Tmp | Out-Null
    $script:Ids = @{ Payroll = '5b000000-0000-4000-8000-000000000001'; HR = '5b000000-0000-4000-8000-000000000002'; LegacyReports = '5b000000-0000-4000-8000-000000000003'; Vendor = '5b000000-0000-4000-8000-000000000005'; Mail = '5b000000-0000-4000-8000-000000000006'; DeployBot = '5b000000-0000-4000-8000-000000000007'; VmBatch = '5b000000-0000-4000-8000-000000000013' }

    function Copy-Scope([hashtable]$S = $script:Scope) { $c = $S | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable -Depth 30; $c }
    function New-Fake([string]$Path = $script:TenantPath) { New-NpiWcaFixtureInvoker -Path $Path -Cloud gcc }
    function Get-Rules($Findings, [string]$Severity = 'Finding') { @($Findings | Where-Object Severity -EQ $Severity | ForEach-Object Rule | Sort-Object -Unique) }
    function Get-TestPlan($Fake, [hashtable]$S = $script:Scope, [switch]$AllowEnforce, [string]$SummaryPath, [string]$Task = 'wca-read') {
        $client = New-NpiWcaClient -Cloud gcc -Task $Task -Invoke $Fake.Invoke
        $enf = Get-NpiWcaEnforcement -Scope $S -AllowEnforce:$AllowEnforce -SignInSummaryPath $SummaryPath
        $plan = @(Get-NpiWcaPlan -Repository $script:Repo -Scope $S -Tenant (Get-NpiWcaTenant -Client $client) -Enforcement $enf -AsOf $script:AsOf)
        [pscustomobject]@{ Client = $client; Plan = $plan; Enforcement = $enf }
    }
    function Invoke-TestApply($Fake, [hashtable]$S = $script:Scope, [switch]$AllowEnforce, [string]$SummaryPath) {
        $t = Get-TestPlan -Fake $Fake -S $S -AllowEnforce:$AllowEnforce -SummaryPath $SummaryPath -Task 'wca-apply'
        $find = @(Test-NpiWcaRepository -Repository $script:Repo -Scope $S -AsOf $script:AsOf)
        @(Invoke-NpiWcaPlan -Client $t.Client -Plan $t.Plan -Findings $find | Where-Object Sent)
    }
    function Get-Row($Plan, [string]$Name) { @($Plan | Where-Object Name -EQ $Name)[0] }
    function Save-Summary([hashtable]$S = $script:Scope, [datetime]$From = $script:From, [string]$TenantPath = $script:TenantPath) {
        $fake = New-Fake $TenantPath
        $client = New-NpiWcaClient -Cloud gcc -Task 'wca-signins' -Invoke $fake.Invoke
        $rows = Get-NpiWcaSignIn -Client $client -From $From -To $script:AsOf
        $sum = Get-NpiWcaSignInSummary -SignIns $rows -Scope $S -Repository $script:Repo -From $From -To $script:AsOf
        $p = Join-Path $script:Tmp ("summary-{0}.json" -f [guid]::NewGuid())
        Write-NpiJson -Path $p -Value $sum
        [pscustomobject]@{ Path = $p; Sha = (Get-NpiFileHash -Path $p); Summary = $sum; Client = $client; Fake = $fake }
    }
    function New-EnforcedScope([string]$Sha, [string[]]$Rings = @('Ring1')) {
        $s = Copy-Scope
        $s['enforcement'] = @{
            decision   = @{ id = 'D-N5'; outcome = 'Enforce'; decidedBy = 'CISO'; decidedOn = '2026-10-30' }
            rings      = @($Rings | ForEach-Object { @{ ring = $_; enforce = $true; signInReview = $Sha; reviewedBy = 'ISSO'; reviewedOn = '2026-10-30' } })
            exclusions = @()
        }
        $s
    }
}

AfterAll { Remove-Item -LiteralPath $script:Tmp -Recurse -Force -ErrorAction SilentlyContinue }

Describe 'Chapter 08: "Conditional Access for workload identities" (Learn), run as published' {
    BeforeAll { $script:Sample = Read-NpiWcaLearnSample -Path $script:Page }
    It 'has one Graph JSON sample that targets service principals through clientApplications: the model for CA015' {
        $script:Sample['conditions']['applications']['includeApplications'] | Should -Be @('All')
        $script:Sample['conditions']['locations']['includeLocations'] | Should -Be @('All')
        $script:Sample['conditions'].Contains('clientApplications') | Should -BeTrue
        $script:Sample['conditions'].Contains('users') | Should -BeFalse
        $script:Sample['grantControls']['builtInControls'] | Should -Be @('block')
    }
    It 'labels the sample for the Graph beta endpoint, though v1.0 has the conditions; the code writes v1.0' {
        (Get-Content $script:Page -Raw) | Should -Match 'using the Microsoft Graph beta endpoint'
        $all = Get-NpiWcaCall
        foreach ($id in 'wca-policy-create', 'wca-policy-update') { @($all | Where-Object id -EQ $id)[0].version | Should -Be 'v1.0' }
    }
    It 'holds display text where Graph wants a state and IDs, so the fake Graph refuses it as published' {
        $script:Sample['state'] | Should -Be 'enabled OR disabled OR enabledForReportingButNotEnforced'
        $fake = New-Fake
        { & $fake.Invoke 'POST' 'https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies' $script:Sample $null } | Should -Throw '*400*'
    }
    It 'offers ServicePrincipalsInMyTenant and bracketed text for the service principals: NPI-WCA-01' {
        $script:Sample['conditions']['clientApplications']['includeServicePrincipals'][0] | Should -Match 'ServicePrincipalsInMyTenant'
        $f = Test-NpiWcaPolicyBody -Body $script:Sample -EgressName 'NL-WorkloadEgress' -Name 'learn-sample'
        @($f | Where-Object Rule -EQ 'NPI-WCA-01').Count | Should -Be 2
    }
    It 'offers AllTrusted for the allowed locations, which would trust the user networks too: NPI-WCA-08' {
        $script:Sample['conditions']['locations']['excludeLocations'][0] | Should -Match 'AllTrusted'
        Get-Rules (Test-NpiWcaPolicyBody -Body $script:Sample -EgressName 'NL-WorkloadEgress' -Name 'learn-sample') | Should -Contain 'NPI-WCA-08'
    }
    It 'has no clientAppTypes, which v1.0 marks required, and no fixed state: NPI-WCA-07' {
        $script:Sample['conditions'].Contains('clientAppTypes') | Should -BeFalse
        @(Test-NpiWcaPolicyBody -Body $script:Sample -EgressName 'NL-WorkloadEgress' -Name 'learn-sample' | Where-Object Rule -EQ 'NPI-WCA-07').Count | Should -Be 2
    }
    It 'gives the risk-based policy as admin center steps only, with no JSON: CA037 is the program''s file' {
        $text = Get-Content $script:Page -Raw
        $text | Should -Match 'Service principal risk'
        ([regex]::Matches($text, '```json')).Count | Should -Be 1
        $script:Repo.Policies.Name | Should -Contain 'CA037-WorkloadIdentities-HighRisk-Block'
    }
    It 'reads report-only results in the admin center only: no Graph read of service principal sign-ins' {
        $text = Get-Content $script:Page -Raw
        $text | Should -Match 'Service principal sign-ins'
        $text | Should -Not -Match 'auditLogs'
    }
    It 'states the limits the scope rules follow: Premium to create, single tenant, no managed identities, no group assignment' {
        $text = Get-Content $script:Page -Raw
        $text | Should -Match 'Workload Identities Premium licenses are required to create or modify'
        $text | Should -Match 'Managed identities aren''t covered by policy'
        $text | Should -Match 'assigned to a group that contains a service principal are not enforced'
        $text | Should -Match 'Object ID in Microsoft Entra App registrations can.t be used'
    }
}

Describe 'The call list (Chapter 08)' {
    It 'every task''s declared permissions are exactly the union of its calls' {
        $list = Get-NpiWcaCallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            @($list.tasks[$task].graphPermissions | Sort-Object) | Should -Be @($calls | ForEach-Object { $_.permissions } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].azureRoles).Count | Should -Be 0
            @($list.tasks[$task].adRights).Count | Should -Be 0
        }
    }
    It 'read tasks hold only GETs and nothing ending in ReadWrite; no call is a DELETE' {
        $list = Get-NpiWcaCallList
        foreach ($c in $list.calls) { $c.method | Should -Not -Be 'DELETE' }
        foreach ($task in @($list.tasks.Keys | Where-Object { $list.tasks[$_].mode -eq 'read' })) {
            foreach ($c in @($list.calls | Where-Object { $_.tasks -contains $task })) {
                $c.method | Should -Be 'GET'
                foreach ($p in @($c.permissions)) { $p | Should -Not -Match 'ReadWrite' }
            }
        }
    }
    It 'each task needs exactly these permissions' {
        (Get-NpiWcaRequiredPermission -Task wca-read).GraphPermissions | Should -Be @('Application.Read.All', 'Policy.Read.All')
        (Get-NpiWcaRequiredPermission -Task wca-signins).GraphPermissions | Should -Be @('AuditLog.Read.All', 'Policy.Read.ConditionalAccess')
        (Get-NpiWcaRequiredPermission -Task wca-apply).GraphPermissions | Should -Be @('Application.Read.All', 'Policy.Read.All', 'Policy.ReadWrite.ConditionalAccess')
    }
    It 'the sign-in read is the one beta call; every call names a Learn page and a stage' {
        $all = Get-NpiWcaCall
        @($all | Where-Object version -EQ 'beta').id | Should -Be @('wca-signins')
        foreach ($c in (Get-NpiWcaCall)) { $c.learn | Should -Match '^https://learn\.microsoft\.com/'; $c.stage | Should -Not -BeNullOrEmpty }
    }
    It 'a read client refuses a write, and nothing binds a value that isn''t an object ID' {
        $c = New-NpiWcaClient -Cloud gcc -Task wca-read -Invoke {}
        { Resolve-NpiWcaRequest -Client $c -CallId 'wca-policy-create' } | Should -Throw '*Undeclared*'
        $w = New-NpiWcaClient -Cloud gcc -Task wca-apply -Invoke {}
        { Resolve-NpiWcaRequest -Client $w -CallId 'wca-policy-update' -Bind @{ id = 'CA015' } } | Should -Throw '*isn''t an object ID*'
        $r = New-NpiWcaClient -Cloud gcc -Task wca-signins -Invoke {}
        $r.Apply | Should -BeFalse
    }
}

Describe 'Clouds and hosts (Chapter 08)' {
    It 'GCC uses the worldwide Graph host; GCC High and DoD their own; any other name throws' {
        (New-NpiWcaClient -Cloud gcc -Task wca-read -Invoke {}).Cloud.Graph | Should -Be 'https://graph.microsoft.com'
        (New-NpiWcaClient -Cloud gcchigh -Task wca-read -Invoke {}).Cloud.Graph | Should -Be 'https://graph.microsoft.us'
        (New-NpiWcaClient -Cloud dod -Task wca-read -Invoke {}).Cloud.Graph | Should -Be 'https://dod-graph.microsoft.us'
        { New-NpiWcaClient -Cloud 'GCC' -Task wca-read -Invoke {} } | Should -Throw '*Unknown cloud*'
    }
    It 'refuses a next link on another host' {
        $c = New-NpiWcaClient -Cloud gcc -Task wca-read -Invoke { param($m, $u) @{ value = @(); '@odata.nextLink' = 'https://graph.example.net/v1.0/identity/conditionalAccess/policies?$skiptoken=2' } }
        { Invoke-NpiWcaGet -Client $c -CallId 'wca-policies' } | Should -Throw '*Refusing to send the token*'
    }
}

Describe 'The pre-merge check' {
    It 'passes the repository and the fixture scope with no Finding or Warn' {
        @(Test-NpiWcaRepository -Repository $script:Repo -Scope $script:Scope -AsOf $script:AsOf).Count | Should -Be 0
    }
    It 'NPI-WCA-01: a template that targets users or a keyword instead of the ring''s object IDs' {
        $b = $script:Repo.Policies[0].Text | ConvertFrom-Json -AsHashtable
        $b['conditions']['users'] = @{ includeGroups = @('{group:CA-Workloads}') }
        $b['conditions']['clientApplications']['includeServicePrincipals'] = @('ServicePrincipalsInMyTenant')
        @(Test-NpiWcaPolicyBody -Body $b -EgressName 'NL-WorkloadEgress' | Where-Object Rule -EQ 'NPI-WCA-01').Count | Should -Be 2
    }
    It 'NPI-WCA-02 and -03: a managed identity or a multitenant app in scope' {
        $s = Copy-Scope
        $s['inScope'][0]['servicePrincipalType'] = 'ManagedIdentity'
        $s['inScope'][1]['signInAudience'] = 'AzureADMultipleOrgs'
        $r = Get-Rules (Test-NpiWcaRepository -Repository $script:Repo -Scope $s -AsOf $script:AsOf)
        $r | Should -Contain 'NPI-WCA-02'
        $r | Should -Contain 'NPI-WCA-03'
    }
    It 'NPI-WCA-05: no D-N4 record, a principal that isn''t Tier 1, an unknown ring, a duplicate' {
        $s = Copy-Scope
        $s['licensing'] = $null
        $s['inScope'][0]['tier'] = 'Tier2'
        $s['inScope'][1]['ring'] = 'Ring9'
        $s['inScope'] += (Copy-Scope)['inScope'][2]
        @(Test-NpiWcaRepository -Repository $script:Repo -Scope $s -AsOf $script:AsOf | Where-Object Rule -EQ 'NPI-WCA-05').Count | Should -Be 4
    }
    It 'NPI-WCA-06: an out-of-scope identity with no compensating control' {
        $s = Copy-Scope
        $s['outOfScope'][0]['control'] = ''
        Get-Rules (Test-NpiWcaRepository -Repository $script:Repo -Scope $s -AsOf $script:AsOf) | Should -Be @('NPI-WCA-06')
    }
    It 'NPI-WCA-07: a policy file that isn''t report-only, or grants anything but block' {
        $b = $script:Repo.Policies[1].Text | ConvertFrom-Json -AsHashtable
        $b['state'] = 'enabled'
        $b['grantControls']['builtInControls'] = @('mfa')
        @(Test-NpiWcaPolicyBody -Body $b -EgressName 'NL-WorkloadEgress' | Where-Object Rule -EQ 'NPI-WCA-07').Count | Should -Be 2
    }
    It 'NPI-WCA-08: a range that isn''t CIDR or is too broad is a Finding; a trusted named location a Warn' {
        $s = Copy-Scope
        $s['egress']['ranges'] = @('192.0.2.0/28', '10.0.0.0/8', 'office')
        @(Test-NpiWcaRepository -Repository $script:Repo -Scope $s -AsOf $script:AsOf | Where-Object Rule -EQ 'NPI-WCA-08').Count | Should -Be 2
        $repo = Read-NpiWcaRepository
        $repo.Locations[0].Body['isTrusted'] = $true
        @(Test-NpiWcaRepository -Repository $repo -Scope $script:Scope -AsOf $script:AsOf).Severity | Should -Be @('Warn')
    }
    It 'NPI-WCA-09: enforcement without D-N5, out of ring order, or with an exclusion that has no end date or has ended' {
        $s = New-EnforcedScope -Sha ('a' * 64) -Rings 'Ring2'
        $s['enforcement']['decision'] = $null
        $s['enforcement']['exclusions'] = @(@{ objectId = $script:Ids.DeployBot; ring = 'Ring2'; owner = 'App owner'; reason = 'Moves to new egress Nov 15' }, @{ objectId = $script:Ids.HR; ring = 'Ring2'; owner = 'App owner'; reason = 'x'; ends = '2026-10-01' })
        $m = @(Test-NpiWcaRepository -Repository $script:Repo -Scope $s -AsOf $script:AsOf | Where-Object Rule -EQ 'NPI-WCA-09').Message
        $m.Count | Should -Be 4
        ($m -join ' ') | Should -Match 'no D-N5 record'
        ($m -join ' ') | Should -Match 'Enforced before Ring1'
        ($m -join ' ') | Should -Match 'owner, a reason and an end date'
        ($m -join ' ') | Should -Match 'Ended 2026-10-01'
    }
    It 'the entry script exits 1 on a Finding and prints the rule' {
        $s = Copy-Scope; $s['inScope'][0]['servicePrincipalType'] = 'ManagedIdentity'; $s.Remove('_sha256')
        $p = Join-Path $script:Tmp 'scope-mi.json'; Write-NpiJson -Path $p -Value $s
        $out = & pwsh -NoProfile -File (Join-Path $script:Root 'Invoke-NpiWorkloadCa.ps1') -Mode Check -ScopePath $p
        $LASTEXITCODE | Should -Be 1
        ($out -join "`n") | Should -Match 'NPI-WCA-02 Finding Payroll Export'
    }
}

Describe 'The tenant check' {
    It 'confirms the fixture scope: no Finding, and two eligible apps left uncovered under D-N4 as Info' {
        $c = New-NpiWcaClient -Cloud gcc -Task wca-read -Invoke (New-Fake).Invoke
        $r = Test-NpiWcaTenantScope -Client $c -Scope $script:Scope
        @($r.Findings | Where-Object Severity -NE 'Info').Count | Should -Be 0
        @($r.Findings.Object | Sort-Object) | Should -Be @('Build Pipeline', 'Legacy Reports')
        $r.Classes[$script:Ids.VmBatch] | Should -Be 'ManagedIdentity'
        $r.Classes[$script:Ids.Vendor] | Should -Be 'Multitenant'
    }
    It 'catches an app registration''s object ID, a managed identity, a multitenant app, and an unrecorded managed identity' {
        $s = Copy-Scope
        $s['inScope'][0]['objectId'] = '0a000000-0000-4000-8000-000000000001'
        $s['inScope'][1]['objectId'] = $script:Ids.VmBatch; $s['inScope'][1]['appId'] = '1b000000-0000-4000-8000-000000000013'
        $s['inScope'][2]['objectId'] = $script:Ids.Vendor; $s['inScope'][2]['appId'] = '1a000000-0000-4000-8000-000000000005'
        $s['outOfScope'] = @($s['outOfScope'] | Where-Object { $_['objectId'] -notin $script:Ids.VmBatch, $script:Ids.Vendor, '5b000000-0000-4000-8000-000000000014' })
        $c = New-NpiWcaClient -Cloud gcc -Task wca-read -Invoke (New-Fake).Invoke
        $f = @((Test-NpiWcaTenantScope -Client $c -Scope $s).Findings | Where-Object Severity -EQ 'Finding')
        ($f | Where-Object Rule -EQ 'NPI-WCA-04').Object | Should -Be 'Payroll Export'
        ($f | Where-Object Rule -EQ 'NPI-WCA-02').Object | Should -Be 'Mail Automation'
        ($f | Where-Object Rule -EQ 'NPI-WCA-03').Object | Should -Be 'Deploy Bot'
        ($f | Where-Object Rule -EQ 'NPI-WCA-06').Object | Should -Be 'id-deploy'
    }
}

Describe 'The plan and the dry run' {
    It 'plans the location update, one unchanged policy, three creates and a portal policy it won''t touch' {
        $t = Get-TestPlan -Fake (New-Fake)
        ($t.Plan | ForEach-Object { "$($_.Action) $($_.Name)" }) | Should -Be @(
            'Update NL-WorkloadEgress'
            'NoChange CA015-ServiceAccounts-LocationRestriction-Ring1'
            'Create CA037-WorkloadIdentities-HighRisk-Block-Ring1'
            'Create CA015-ServiceAccounts-LocationRestriction-Ring2'
            'Create CA037-WorkloadIdentities-HighRisk-Block-Ring2'
            'NotInRepository Workloads - block outside office (made in the portal)')
        (Get-Row $t.Plan 'NL-WorkloadEgress').Changes | Should -Be @('ipRanges')
    }
    It 'creates every policy report-only, assigned by the ring''s object IDs, excluding the egress location by ID' {
        $t = Get-TestPlan -Fake (New-Fake)
        foreach ($row in @($t.Plan | Where-Object Action -EQ 'Create')) {
            $row.Body['state'] | Should -Be 'enabledForReportingButNotEnforced'
            @(Test-NpiWcaPolicyBody -Body $row.Body -EgressName 'NL-WorkloadEgress' -Rendered).Count | Should -Be 0
        }
        $r2 = (Get-Row $t.Plan 'CA015-ServiceAccounts-LocationRestriction-Ring2').Body
        $r2['conditions']['clientApplications']['includeServicePrincipals'] | Should -Be @($script:Ids.HR, $script:Ids.DeployBot)
        $r2['conditions']['locations']['excludeLocations'] | Should -Be @('10c00000-0000-4000-8000-000000000001')
    }
    It 'a dry run sends nothing: only GETs reach the fake, and every request says Sent false' {
        $fake = New-Fake
        $t = Get-TestPlan -Fake $fake
        $req = @(Invoke-NpiWcaPlan -Client $t.Client -Plan $t.Plan -Findings @())
        $req.Count | Should -Be 4
        @($req | Where-Object Sent).Count | Should -Be 0
        @($fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'blocks the location policies until the named location exists, and needs two runs then' {
        $tenant = Get-Content $script:TenantPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
        $tenant['namedLocations'] = @($tenant['namedLocations'] | Where-Object { $_['displayName'] -ne 'NL-WorkloadEgress' })
        $tenant['policies'] = @($tenant['policies'] | Where-Object { $_['displayName'] -notlike 'CA015*' })
        $p = Join-Path $script:Tmp 'tenant-noloc.json'; Write-NpiJson -Path $p -Value $tenant
        $fake = New-Fake $p
        $t = Get-TestPlan -Fake $fake
        @($t.Plan | Where-Object Action -EQ 'Blocked').Name | Should -Be @('CA015-ServiceAccounts-LocationRestriction-Ring1', 'CA015-ServiceAccounts-LocationRestriction-Ring2')
        (Invoke-TestApply -Fake $fake).Count | Should -Be 3
        (Invoke-TestApply -Fake $fake).Count | Should -Be 2
        (Invoke-TestApply -Fake $fake).Count | Should -Be 0
    }
    It 'applies once, then finds nothing to do; every policy it made is report-only and the portal policy is still there' {
        $fake = New-Fake
        (Invoke-TestApply -Fake $fake).Count | Should -Be 4
        (Invoke-TestApply -Fake $fake).Count | Should -Be 0
        @($fake.Tenant.policies | Where-Object { $_['displayName'] -like 'CA0*-Ring*' }).Count | Should -Be 4
        @($fake.Tenant.policies | Where-Object { $_['displayName'] -like 'CA0*-Ring*' -and $_['state'] -ne 'enabledForReportingButNotEnforced' }).Count | Should -Be 0
        @($fake.Tenant.policies | Where-Object { $_['displayName'] -like 'Workloads*' }).Count | Should -Be 1
        @($fake.Calls | Where-Object Method -EQ 'DELETE').Count | Should -Be 0
    }
    It 'refuses to apply while a check has a Finding' {
        $fake = New-Fake
        $t = Get-TestPlan -Fake $fake -Task wca-apply
        $bad = @([pscustomobject]@{ Rule = 'NPI-WCA-02'; Severity = 'Finding'; Object = 'x'; Message = 'm' })
        { Invoke-NpiWcaPlan -Client $t.Client -Plan $t.Plan -Findings $bad } | Should -Throw '*Finding*'
        @($fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'refuses a create that isn''t report-only, or a body that assigns a keyword' {
        $t = Get-TestPlan -Fake (New-Fake) -Task wca-apply
        $row = @($t.Plan | Where-Object Action -EQ 'Create')[0]
        $row.Body['state'] = 'enabled'
        { Invoke-NpiWcaPlan -Client $t.Client -Plan @($row) -Findings @() } | Should -Throw '*always report-only*'
        $row.Body['state'] = 'enabledForReportingButNotEnforced'
        $row.Body['conditions']['clientApplications']['includeServicePrincipals'] = @('ServicePrincipalsInMyTenant')
        { Invoke-NpiWcaPlan -Client $t.Client -Plan @($row) -Findings @() } | Should -Throw '*Refusing to create*'
    }
}

Describe 'Enforcement ring by ring' {
    BeforeAll { $script:Sum = Save-Summary }
    It 'holds a marked ring without -AllowEnforce, without D-N5, with a summary nobody reviewed, or that isn''t ready' {
        $s = New-EnforcedScope -Sha $script:Sum.Sha -Rings 'Ring1', 'Ring2'
        (Get-NpiWcaEnforcement -Scope $s -SignInSummaryPath $script:Sum.Path)['Ring1'].Note | Should -Match 'AllowEnforce'
        $e = Get-NpiWcaEnforcement -Scope $s -AllowEnforce -SignInSummaryPath $script:Sum.Path
        $e['Ring1'].Enforce | Should -BeTrue
        $e['Ring2'].Note | Should -Match 'doesn''t show this ring ready'
        $n = New-EnforcedScope -Sha $script:Sum.Sha; $n['enforcement']['decision']['outcome'] = 'ExtendReportOnly'
        (Get-NpiWcaEnforcement -Scope $n -AllowEnforce -SignInSummaryPath $script:Sum.Path)['Ring1'].Note | Should -Match 'no D-N5 record'
        $x = New-EnforcedScope -Sha ('0' * 64)
        (Get-NpiWcaEnforcement -Scope $x -AllowEnforce -SignInSummaryPath $script:Sum.Path)['Ring1'].Note | Should -Match 'not the reviewed'
        (Get-NpiWcaEnforcement -Scope (New-EnforcedScope -Sha $script:Sum.Sha) -AllowEnforce)['Ring1'].Note | Should -Match 'SignInSummaryPath'
    }
    It 'enforces Ring1 only: the existing policy turns on, the new one is created report-only and turns on next run' {
        $fake = New-Fake
        $s = New-EnforcedScope -Sha $script:Sum.Sha
        $t = Get-TestPlan -Fake $fake -S $s -AllowEnforce -SummaryPath $script:Sum.Path
        $r1 = Get-Row $t.Plan 'CA015-ServiceAccounts-LocationRestriction-Ring1'
        $r1.Action | Should -Be 'Update'
        $r1.Body['state'] | Should -Be 'enabled'
        (Get-Row $t.Plan 'CA037-WorkloadIdentities-HighRisk-Block-Ring1').Body['state'] | Should -Be 'enabledForReportingButNotEnforced'
        $null = Invoke-TestApply -Fake $fake -S $s -AllowEnforce -SummaryPath $script:Sum.Path
        $null = Invoke-TestApply -Fake $fake -S $s -AllowEnforce -SummaryPath $script:Sum.Path
        $state = @{}; foreach ($p in $fake.Tenant.policies) { $state[$p['displayName']] = $p['state'] }
        $state['CA015-ServiceAccounts-LocationRestriction-Ring1'] | Should -Be 'enabled'
        $state['CA037-WorkloadIdentities-HighRisk-Block-Ring1'] | Should -Be 'enabled'
        $state['CA015-ServiceAccounts-LocationRestriction-Ring2'] | Should -Be 'enabledForReportingButNotEnforced'
    }
    It 'shows a marked ring as Held without -AllowEnforce, and refuses an enable the plan didn''t allow' {
        $s = New-EnforcedScope -Sha $script:Sum.Sha
        $t = Get-TestPlan -Fake (New-Fake) -S $s -Task wca-apply
        (Get-Row $t.Plan 'CA015-ServiceAccounts-LocationRestriction-Ring1').Action | Should -Be 'Held'
        $forged = [pscustomobject]@{ Kind = 'policy'; Name = 'CA015-ServiceAccounts-LocationRestriction-Ring1'; Action = 'Update'; CallId = 'wca-policy-update'; Bind = @{ id = 'ca000000-0000-4000-8000-000000000015' }; Body = @{ state = 'enabled' }; Enforce = $false }
        { Invoke-NpiWcaPlan -Client $t.Client -Plan @($forged) -Findings @() } | Should -Throw '*didn''t allow*'
    }
    It 'rolls a ring back to report-only when its enforcement record is removed, never by deleting' {
        $fake = New-Fake
        $s = New-EnforcedScope -Sha $script:Sum.Sha
        $null = Invoke-TestApply -Fake $fake -S $s -AllowEnforce -SummaryPath $script:Sum.Path
        $t = Get-TestPlan -Fake $fake
        $row = Get-Row $t.Plan 'CA015-ServiceAccounts-LocationRestriction-Ring1'
        $row.Action | Should -Be 'Update'
        $row.Body['state'] | Should -Be 'enabledForReportingButNotEnforced'
    }
    It 'puts a dated exclusion (D-N5, enforce with named exclusions) in its ring''s policies until it ends' {
        $s = Copy-Scope
        $s['enforcement']['exclusions'] = @(@{ objectId = $script:Ids.DeployBot; ring = 'Ring2'; owner = 'App owner'; reason = 'Moves to the new egress range'; ends = '2026-11-15' })
        @(Test-NpiWcaRepository -Repository $script:Repo -Scope $s -AsOf $script:AsOf).Count | Should -Be 0
        $t = Get-TestPlan -Fake (New-Fake) -S $s
        (Get-Row $t.Plan 'CA015-ServiceAccounts-LocationRestriction-Ring2').Body['conditions']['clientApplications']['excludeServicePrincipals'] | Should -Be @($script:Ids.DeployBot)
    }
}

Describe 'The service principal sign-in reader' {
    It 'sends Learn''s service principal filter to the beta host with the Prefer header' {
        $sum = Save-Summary
        $call = @($sum.Fake.Calls)[0]
        $call.Uri | Should -BeLike 'https://graph.microsoft.com/beta/auditLogs/signIns?$filter=*'
        [Uri]::UnescapeDataString($call.Uri) | Should -Match "signInEventTypes/any\(t: t eq 'servicePrincipal'\)"
        $call.Headers['Prefer'] | Should -Be 'include-unknown-enum-members'
    }
    It 'refuses results that came back as unknownFutureValue, as they do without the Prefer header' {
        $fake = New-Fake
        $strip = $fake.Invoke
        $c = New-NpiWcaClient -Cloud gcc -Task wca-signins -Invoke { param($m, $u, $b, $h) & $strip $m $u $b $null }.GetNewClosure()
        { Get-NpiWcaSignIn -Client $c -From $script:From -To $script:AsOf } | Should -Throw '*Prefer*'
    }
    It 'summarizes per principal: Ring1 clear and ready; Deploy Bot outside the egress ranges; HR Connector unseen' {
        $s = (Save-Summary).Summary
        $s.days | Should -Be 18
        $r1 = $s.rings[0]; $r2 = $s.rings[1]
        $r1.ready | Should -BeTrue
        @($r1.principals | ForEach-Object { $_.status }) | Should -Be @('Clear', 'Clear')
        $r2.ready | Should -BeFalse
        ($r2.principals | Where-Object { $_.name -eq 'Deploy Bot' }).status | Should -Be 'WouldBlock'
        ($r2.principals | Where-Object { $_.name -eq 'Deploy Bot' }).outsideEgress | Should -Be @('203.0.113.7')
        ($r2.principals | Where-Object { $_.name -eq 'HR Connector' }).status | Should -Be 'NoSignIns'
        $s.otherServicePrincipalSignIns | Should -Be 1
    }
    It 'counts a report-only failure as would-block, and a window under 14 days as not ready' {
        $tenant = Get-Content $script:TenantPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
        $tenant['signIns'][3]['appliedConditionalAccessPolicies'][0]['result'] = 'reportOnlyFailure'
        $p = Join-Path $script:Tmp 'tenant-fail.json'; Write-NpiJson -Path $p -Value $tenant
        $s = (Save-Summary -TenantPath $p).Summary
        ($s.rings[0].principals | Where-Object { $_.name -eq 'Mail Automation' }).status | Should -Be 'WouldBlock'
        (Save-Summary -From ([datetime]::SpecifyKind([datetime]'2026-10-20T00:00:00', 'Utc'))).Summary.rings[0].ready | Should -BeFalse
    }
    It 'writes the same summary, byte for byte, from the same sign-ins' {
        (Save-Summary).Sha | Should -Be (Save-Summary).Sha
    }
    It 'matches addresses against IPv4 and IPv6 ranges' {
        Test-NpiWcaIpInRange -Ip '198.51.100.39' -Ranges '198.51.100.32/29' | Should -BeTrue
        Test-NpiWcaIpInRange -Ip '198.51.100.40' -Ranges '198.51.100.32/29' | Should -BeFalse
        Test-NpiWcaIpInRange -Ip '2001:db8:10:ffff::1' -Ranges '2001:db8:10::/48' | Should -BeTrue
        Test-NpiWcaIpInRange -Ip '2001:db8:11::1' -Ranges '2001:db8:10::/48' | Should -BeFalse
    }
}

Describe 'The block alert and the entry script' {
    It 'renders the alert for AADSTS53003 on every in-scope service principal, for a reviewed deployment' {
        $a = New-NpiWcaAlertRule -Repository $script:Repo -Scope $script:Scope
        $a['query'] | Should -Match 'tostring\(ResultType\) == "53003"'
        foreach ($e in $script:Scope['inScope']) { $a['query'] | Should -Match $e['objectId'] }
        $a['deployment'] | Should -Match "doesn't write to Azure Monitor"
    }
    It 'a dry run writes the plan, requests, findings, alert and a manifest with only GETs' {
        $out = Join-Path $script:Tmp 'run'
        $null = & (Join-Path $script:Root 'Invoke-NpiWorkloadCa.ps1') -Mode Plan -Cloud gcc -ScopePath $script:ScopePath -FixturePath $script:TenantPath -OutputPath $out
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'wca-read'
        $m.mode | Should -Be 'Fixture-DryRun'
        @($m.requests.method | Sort-Object -Unique) | Should -Be @('GET')
        @($m.files.PSObject.Properties.Name) | Should -Be @('alert-rule.json', 'findings.json', 'plan.json', 'requests.json')
        foreach ($f in $m.files.PSObject.Properties) { Get-NpiFileHash -Path (Join-Path $out $f.Name) | Should -Be $f.Value }
    }
    It 'refuses a scope written for another cloud' {
        { & (Join-Path $script:Root 'Invoke-NpiWorkloadCa.ps1') -Mode Plan -Cloud gcchigh -ScopePath $script:ScopePath -FixturePath $script:TenantPath -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw "*not 'gcchigh'*"
    }
}
