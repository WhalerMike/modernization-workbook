#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 09: AI agent identities. Learn's Agent ID samples run as published against the fake, the
# chapter's call list and its least-privilege test, each rule NPI-AI-01 to NPI-AI-23, the D-N6
# fallback, the agent Conditional Access plan and its separate write path.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiAgentId/NpiAgentId.psm1') -Force
    . (Join-Path $PSScriptRoot 'AgentIdSampleHarness.ps1')
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Estate01 = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Inputs02 = Join-Path $PSScriptRoot 'fixtures/inputs'
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch09/agent-estate.json')).Path
    $script:Inputs = Join-Path $PSScriptRoot 'fixtures/ch09/inputs'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-agent-{0}" -f [guid]::NewGuid())
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Tenant = 'c0ffee00-0000-4000-8000-000000000001'
    function New-Runs([string]$Cloud) {
        $inv = Join-Path $script:Tmp "inventory-$Cloud"; $own = Join-Path $script:Tmp "ownership-$Cloud"
        if (-not (Test-Path $own)) {
            $null = & (Join-Path $script:Root 'Invoke-NpiInventory.ps1') -Cloud $Cloud -FixturePath $script:Estate01 -OutputPath $inv
            $null = & (Join-Path $script:Root 'Invoke-NpiOwnership.ps1') -Cloud $Cloud -RegisterRun $inv -FixturePath $script:Estate01 -InputPath $script:Inputs02 -OutputPath $own
        }
        Import-NpiAgentRuns -RegisterRun $inv -OwnershipRun $own
    }
    function Get-TestInputs { Import-NpiAgentInputs -InputPath $script:Inputs }
    function Invoke-TestCheck {
        param([string]$Cloud = 'gcc', $Inputs = (Get-TestInputs), [scriptblock]$Mutate)
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture -Cloud $Cloud
        if ($Mutate) { & $Mutate $fake.Estate }
        $reader = New-NpiAgentReader -Cloud $Cloud -Invoke $fake.Invoke
        $cap = Get-NpiAgentCapability -Cloud $Cloud
        $estate = Read-NpiAgentEstate -Reader $reader -Capability $cap -AsOf $script:AsOf -Inventory $Inputs.Inventory
        $r = Test-NpiAgentId -Reader $reader -Estate $estate -Inputs $Inputs -Runs (New-Runs $Cloud) -Capability $cap -AsOf $script:AsOf
        [pscustomobject]@{ Result = $r; Fake = $fake; Estate = $estate; Reader = $reader }
    }
    New-Item -ItemType Directory -Force $script:Tmp | Out-Null
    $script:Run = Invoke-TestCheck
    function Get-F([string]$Rule, [string]$Like = '*', [string]$Severity) { @($script:Run.Result.Findings | Where-Object { $_.Rule -eq $Rule -and $_.Object -like $Like -and (-not $Severity -or $_.Severity -eq $Severity) }) }
    function Copy-Inputs { $d = Join-Path $script:Tmp ("in-{0}" -f [guid]::NewGuid()); Copy-Item -Recurse $script:Inputs $d; $d }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'Chapter 09: Learn''s Agent ID samples, run as published' {
    It 'List agentIdentityBlueprint and List agentIdentity: the model for the reads, one object type each' {
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture
        $bp = (Send-AgentIdLearnRequest -Request (Get-AgentIdLearnRequest 'agentidentityblueprint-list.md')[0] -Fake $fake).Response
        @($bp.value).Count | Should -Be 2
        $bp.ContainsKey('@odata.nextLink') | Should -BeTrue
        $ai = (Send-AgentIdLearnRequest -Request (Get-AgentIdLearnRequest 'agentidentity-list.md')[0] -Fake $fake).Response
        @($ai.value | ForEach-Object servicePrincipalType | Sort-Object -Unique) | Should -Be @('ServiceIdentity')
    }
    It 'the samples follow only the first page: an estate larger than one page needs the next link' {
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture
        $r = (Send-AgentIdLearnRequest -Request (Get-AgentIdLearnRequest 'agentidentity-list.md')[0] -Fake $fake).Response
        @($r.value).Count | Should -BeLessThan @($fake.Estate.agentIdentities).Count
        (Get-AgentIdPageText 'agentidentity-list.md') | Should -Match 'default and maximum page size is 100'
    }
    It 'hard-code graph.microsoft.com, which a GCC High or DoD tenant doesn''t answer' {
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture -Cloud gcchigh
        (Send-AgentIdLearnRequest -Request (Get-AgentIdLearnRequest 'agentidentity-list.md')[0] -Fake $fake).Status | Should -Match 'refuses host graph\.microsoft\.com'
    }
    It 'List agentIdentity sponsors returns directory objects with an id only, and names a write permission for the read' {
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture
        $r = (Send-AgentIdLearnRequest -Request (Get-AgentIdLearnRequest 'agentidentity-list-sponsors.md')[0] -Fake $fake -Replace @{ '{id}' = '5b000000-0000-4000-8000-000000000015' }).Response
        @($r.value)[0].Keys | Sort-Object | Should -Be @('@odata.type', 'id')
        (Get-AgentIdPageText 'agentidentity-list-sponsors.md') | Should -Match 'includes/permissions/agentidentity-list-sponsors-permissions\.md'
        $t = Get-AgentIdPageText 'includes/permissions/agentidentity-list-sponsors-permissions.md'
        $t | Should -Match '\|Application\|\s*AgentIdentity\.ReadWrite\.All\s*\|'
        $t | Should -Match '\|Delegated \(work or school account\)\|\s*Not supported\.'
    }
    It 'List agentIdentityBlueprint sponsors names Application.Read.All, not AgentIdentityBlueprint.Read.All' {
        (Get-AgentIdPageText 'includes/permissions/agentidentityblueprint-list-sponsors-permissions.md') | Should -Match '\|Application\|\s*Application\.Read\.All'
        (Get-AgentIdPageText 'includes/permissions/agentidentityblueprint-list-permissions.md') | Should -Match '\|Application\|\s*AgentIdentityBlueprint\.Read\.All'
        (Get-AgentIdPageText 'includes/permissions/agentidentity-list-permissions.md') | Should -Match '\|Application\|\s*AgentIdentity\.Read\.All'
    }
    It 'Create a blueprint makes one person both sponsor and owner, which the program''s rule forbids' {
        $req = Get-AgentIdLearnRequest 'create-blueprint.md'
        $create = $req | Where-Object { $_.Method -eq 'POST' -and $_.Uri -match '/applications/$' }
        $create.Body['sponsors@odata.bind'][0] | Should -Be $create.Body['owners@odata.bind'][0]
        $r = Invoke-TestCheck -Mutate { param($e) }
        $fake = $r.Fake; $fake.AllowWrite = $true
        $made = (Send-AgentIdLearnRequest -Request $create -Fake $fake -Replace @{ '<id>' = '5a000000-0000-4000-8000-000000000005' }).Response
        $made.id | Should -Match '^0a000000'
        $fake.AllowWrite = $false
        $cap = Get-NpiAgentCapability -Cloud gcc
        $est = Read-NpiAgentEstate -Reader (New-NpiAgentReader -Cloud gcc -Invoke $fake.Invoke) -Capability $cap -AsOf $script:AsOf -Inventory (Get-TestInputs).Inventory
        $res = Test-NpiAgentId -Reader (New-NpiAgentReader -Cloud gcc -Invoke $fake.Invoke) -Estate $est -Inputs (Get-TestInputs) -Runs (New-Runs gcc) -Capability $cap -AsOf $script:AsOf
        @($res.Findings | Where-Object { $_.Object -like 'My Agent Identity Blueprint*' } | ForEach-Object Rule | Sort-Object -Unique) | Should -Be @('NPI-AI-09', 'NPI-AI-22')
    }
    It 'the managed identity credential passes; the sample''s password makes a secret on a blueprint nothing marks as test' {
        $req = Get-AgentIdLearnRequest 'create-blueprint.md'
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture -AllowWrite
        $ph = @{ '<agent-blueprint-id>' = '1a000000-0000-4000-8000-000000000009'; '<your-tenant-id>' = $script:Tenant; '<managed-identity-principal-id>' = '7c000000-0000-4000-8000-000000000009' }
        (Send-AgentIdLearnRequest -Request ($req | Where-Object Uri -Match 'federatedIdentityCredentials$') -Fake $fake -Replace $ph).Status | Should -Be 'OK'
        $b = [pscustomobject]@{ Object = @($fake.Estate.blueprints | Where-Object appId -EQ '1a000000-0000-4000-8000-000000000009')[0]; Federated = @($fake.Estate.federatedIdentityCredentials['0a000000-0000-4000-8000-000000000009']) }
        (Get-NpiAgentCredentialKind -Blueprint $b -TenantId $script:Tenant -LoginHost 'https://login.microsoftonline.com')[0] | Should -Be 'ManagedIdentity'
        $add = $req | Where-Object Uri -Match 'addPassword$'
        ([datetime]$add.Body.passwordCredential.endDateTime).ToUniversalTime().ToString('yyyy-MM-dd') | Should -Be '2026-08-05'
        (Send-AgentIdLearnRequest -Request $add -Fake $fake -Replace $ph).Status | Should -Be 'OK'
        (Get-AgentIdPageText 'create-blueprint.md') | Should -Match 'not recommended for production'
    }
    It 'Configure inheritable permissions starts with allAllowed for scopes and roles, which the program never uses for roles' {
        $req = @(Get-AgentIdLearnRequest 'configure-inheritable-permissions-blueprints.md')
        $first = $req[0]
        $first.Body.inheritableRoles.kind | Should -Be 'allAllowed'
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture -AllowWrite
        $id = '0a000000-0000-4000-8000-00000000000a'
        (Send-AgentIdLearnRequest -Request $first -Fake $fake -Replace @{ 'bc057821-f236-49d6-9f2c-1ebf43e9437a' = $id }).Status | Should -Be 'OK'
        $fake.AllowWrite = $false
        $sent = @($fake.Estate.inheritablePermissions[$id])
        $r = Invoke-TestCheck -Mutate ({ param($e) $e.inheritablePermissions['0a000000-0000-4000-8000-00000000000a'] = $sent }.GetNewClosure())
        @($r.Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-13' -and $_.Object -like 'Pilot Sandbox*' } | ForEach-Object Severity | Sort-Object) | Should -Be @('Finding', 'Warn')
    }
    It 'puts the type cast before the ID, where the API reference puts it after; the fake accepts both, the code reads the reference''s form' {
        $req = @(Get-AgentIdLearnRequest 'configure-inheritable-permissions-blueprints.md')
        $req[0].Uri | Should -Match '/applications/microsoft\.graph\.agentIdentityBlueprint/[0-9a-f-]{36}/inheritablePermissions$'
        (Get-NpiAgentCall -Task agent-id | Where-Object id -EQ 'agid-blueprint-inheritable').path | Should -Be '/applications/{id}/microsoft.graph.agentIdentityBlueprint/inheritablePermissions'
        (Get-AgentIdPageText 'configure-inheritable-permissions-blueprints.md') | Should -Match 'Maximum of 50 resource apps'
    }
    It 'sends PATCH and DELETE, which this chapter''s writer never sends' {
        $req = @(Get-AgentIdLearnRequest 'configure-inheritable-permissions-blueprints.md')
        @($req.Method | Sort-Object -Unique) | Should -Be @('DELETE', 'PATCH', 'POST')
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture -AllowWrite
        (Send-AgentIdLearnRequest -Request ($req | Where-Object Method -EQ 'DELETE') -Fake $fake).Status | Should -Match 'never sends'
    }
    It 'Block agent identity authentication blocks every agent, approved or not; its body is beta and report-only' {
        $p1 = @(Get-AgentIdLearnRequest 'disable-agent-identities.md')[0]
        $p1.Uri | Should -Be 'https://graph.microsoft.com/beta/identity/conditionalAccess/policies'
        $p1.Body.state | Should -Be 'enabledForReportingButNotEnforced'
        $problems = Test-NpiAgentCaPolicyShape -Policy $p1.Body -Kind Unapproved -ApprovalRule (Get-NpiAgentConfig).Rules.approvalAttribute
        $problems | Should -Contain 'no exclusion for approved agents: every approved agent would be blocked when enforced'
        @($problems).Count | Should -Be 1
        $fake = New-NpiAgentFixtureInvoker -Path $script:Fixture -AllowWrite
        (Send-AgentIdLearnRequest -Request $p1 -Fake $fake).Response.state | Should -Be 'enabledForReportingButNotEnforced'
    }
    It 'the reviewed policies pass the same shape check the samples are held to' {
        $cfg = Get-NpiAgentConfig
        foreach ($rel in $cfg.Rules.desiredCaPolicies) {
            $kind = if ($rel -match 'high-risk') { 'HighRisk' } else { 'Unapproved' }
            @(Test-NpiAgentCaPolicyShape -Policy (Get-Content (Join-Path $cfg.Root $rel) -Raw | ConvertFrom-Json -AsHashtable) -Kind $kind -ApprovalRule $cfg.Rules.approvalAttribute).Count | Should -Be 0
        }
    }
}

Describe 'The Chapter 09 call list' {
    It 'every task''s declared permissions are exactly the union of its calls' {
        $list = (Get-NpiAgentConfig).Calls
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            @($list.tasks[$task].graphPermissions | Sort-Object) | Should -Be @($calls | ForEach-Object { $_.permissions } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].azureRoles).Count | Should -Be 0
            @($list.tasks[$task].adRights).Count | Should -Be 0
        }
    }
    It 'the read task holds only GETs and nothing ending in ReadWrite; writes belong to the delegated write task' {
        $list = (Get-NpiAgentConfig).Calls
        foreach ($c in @($list.calls | Where-Object { $_.tasks -contains 'agent-id' })) {
            $c.method | Should -Be 'GET'
            foreach ($p in $c.permissions) { $p | Should -Not -Match 'ReadWrite' }
        }
        @($list.calls | Where-Object method -NE 'GET' | ForEach-Object { $_.tasks } | Sort-Object -Unique) | Should -Be @('agent-ca-apply')
        $list.tasks['agent-ca-apply'].delegatedOnly | Should -BeTrue
        @($list.calls.method | Where-Object { $_ -in 'PATCH', 'PUT', 'DELETE' }).Count | Should -Be 0
    }
    It 'every call names a Learn page and a stage, and the agent Conditional Access calls are beta' {
        foreach ($c in (Get-NpiAgentCall)) { $c.learn | Should -Match '^https://learn\.microsoft\.com/'; $c.stage | Should -Not -BeNullOrEmpty }
        @(Get-NpiAgentCall | Where-Object { $_.path -like '/identity/conditionalAccess/*' } | ForEach-Object version | Sort-Object -Unique) | Should -Be @('beta')
    }
    It 'a run sends only declared GETs, on the cloud''s own host' {
        $declared = @(Get-NpiAgentCall -Task agent-id | ForEach-Object id)
        @($script:Run.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        @($script:Run.Reader.Evidence | Where-Object { $_.Call -notin $declared }).Count | Should -Be 0
        @($script:Run.Fake.Calls | Where-Object { $_.Uri -notlike 'https://graph.microsoft.com/*' }).Count | Should -Be 0
    }
    It 'the reader refuses an undeclared call and the write call' {
        { Invoke-NpiGetOne -Reader $script:Run.Reader -CallId 'graph-applications' } | Should -Throw '*Undeclared call*'
        { Invoke-NpiGetOne -Reader $script:Run.Reader -CallId 'agid-ca-create' } | Should -Throw '*Undeclared call*'
    }
}

Describe 'Decision D-N6 as data' {
    It 'gcc builds on agent identities; GCC High and DoD fall back to service principals and managed identities' {
        (Get-NpiAgentCapability -Cloud gcc).Mode | Should -Be 'AgentId'
        (Get-NpiAgentCapability -Cloud gcchigh).Mode | Should -Be 'Fallback'
        (Get-NpiAgentCapability -Cloud dod).Mode | Should -Be 'Fallback'
        (Get-NpiAgentCapability -Cloud gcc).Status | Should -Be 'Proposed'
        { Get-NpiAgentCapability -Cloud GCC } | Should -Throw '*Unknown cloud*'
    }
    It 'preview capabilities are watch items in every cloud' {
        foreach ($c in 'global', 'gcc', 'gcchigh', 'dod') { (Get-NpiAgentCapability -Cloud $c).AgentRisk.watch | Should -BeTrue }
    }
    It 'in the fallback no agent identity read is sent, and the same rules run on the service principal' {
        $r = Invoke-TestCheck -Cloud gcchigh
        @($r.Reader.Evidence.Call | Where-Object { $_ -match '^agid-(blueprint|identit)' }).Count | Should -Be 0
        (@($r.Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-03' -and $_.Object -like 'Correspondence*' })[0]).Severity | Should -Be 'Info'
        @($r.Result.Findings | Where-Object { $_.Object -like 'Correspondence*' } | ForEach-Object Rule | Sort-Object -Unique) | Should -Be @('NPI-AI-03', 'NPI-AI-10', 'NPI-AI-15')
        @($r.Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-03' -and $_.Severity -eq 'Finding' }).Count | Should -Be 3
    }
    It 'in the fallback the agent policies are not offered: the plan has no write' {
        $r = Invoke-TestCheck -Cloud gcchigh
        $plan = New-NpiAgentCaPlan -Estate $r.Estate -Cloud gcchigh -TenantId $script:Tenant -AsOf $script:AsOf
        @($plan.actions | Where-Object Write).Count | Should -Be 0
        @($plan.actions.Action | Sort-Object -Unique) | Should -Be @('NotAvailable')
    }
}

Describe 'The inputs: Chapters 01 and 02 and the records' {
    It 'Chapter 02''s sponsor fields are checked against their manifest' {
        $null = New-Runs gcc
        $copy = Join-Path $script:Tmp 'own-tampered'; Copy-Item -Recurse (Join-Path $script:Tmp 'ownership-gcc') $copy
        Add-Content -LiteralPath (Join-Path $copy 'ai-sponsor-fields.json') -Value ' '
        { Import-NpiAgentRuns -RegisterRun (Join-Path $script:Tmp 'inventory-gcc') -OwnershipRun $copy } | Should -Throw '*doesn''t match its manifest*'
    }
    It 'an ownership run made from another register is refused' {
        $null = New-Runs gcc
        $copy = Join-Path $script:Tmp 'own-other'; Copy-Item -Recurse (Join-Path $script:Tmp 'ownership-gcc') $copy
        $m = Get-Content (Join-Path $copy 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable; $m.registerSha256 = '0' * 64; Write-NpiJson -Path (Join-Path $copy 'manifest.json') -Value $m
        { Import-NpiAgentRuns -RegisterRun (Join-Path $script:Tmp 'inventory-gcc') -OwnershipRun $copy } | Should -Throw '*was made from register*'
    }
    It 'fills the sponsor fields Chapter 02 recorded for every AI identity it named' {
        $runs = New-Runs gcc
        foreach ($sf in $runs.SponsorFields) { $script:Run.Result.Identities.IdentityId | Should -Contain $sf.IdentityId }
        $a = @($script:Run.Result.Identities | Where-Object IdentityId -EQ 'sp:5b000000-0000-4000-8000-000000000015')[0]
        $a.FederalSponsor | Should -Be 'erin@contoso.example'
        $a.SponsoringGroup | Should -Be '6a000000-0000-4000-8000-000000000001'
        $a.TechnicalOwner | Should -Be 'alice@contoso.example'
        $a.InventoryRecord | Should -Be 'CMDB-4001'
    }
}

Describe 'N6.1: creation closed' {
    It 'passes with a recent reading of No and a closed app registration setting' {
        @(Get-F 'NPI-AI-01').Count + @(Get-F 'NPI-AI-02').Count | Should -Be 0
    }
    It 'NPI-AI-01: Yes, a reading over 90 days old, or no reading, is a finding' {
        foreach ($case in @(@{ value = 'Yes'; readOn = '2026-10-28'; want = '*Set to ''Yes''*' }, @{ value = 'No'; readOn = '2026-06-01'; want = '*read it again*' })) {
            $in = Get-TestInputs; $in.CreationSetting = [pscustomobject]@{ value = $case.value; readOn = $case.readOn }
            (@((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object Rule -EQ 'NPI-AI-01')[0]).Issue | Should -BeLike $case.want
        }
        $in = Get-TestInputs; $in.CreationSetting = $null
        (@((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object Rule -EQ 'NPI-AI-01')[0]).Issue | Should -BeLike '*No dated reading*'
    }
    It 'NPI-AI-02: users who can register apps, or consent beyond the low-risk policy' {
        $r = Invoke-TestCheck -Mutate { param($e) $e.authorizationPolicy.defaultUserRolePermissions.allowedToCreateApps = $true; $e.authorizationPolicy.defaultUserRolePermissions.permissionGrantPoliciesAssigned = @('ManagePermissionGrantsForSelf.microsoft-user-legacy') }
        @($r.Result.Findings | Where-Object Rule -EQ 'NPI-AI-02').Count | Should -Be 2
    }
    It 'NPI-AI-03: an agent on an ordinary service principal is routed to the blueprint path, unless a fallback reason is recorded' {
        (Get-F 'NPI-AI-03' 'Correspondence*').Severity | Should -Be 'Warn'
        $in = Get-TestInputs; ($in.Handshakes | Where-Object HandshakeId -EQ 'HS-004').FallbackReason = 'Vendor product supports service principals only (ticket CHG-0871)'
        @((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object Rule -EQ 'NPI-AI-03').Count | Should -Be 0
    }
}

Describe 'N6.2: the production handshake' {
    It 'an agent with a complete handshake, sponsors, owner and record passes every identity rule' {
        @($script:Run.Result.Findings | Where-Object { $_.Object -like 'Benefits Q&A Agent*' -or $_.Object -like 'Benefits Agent Blueprint*' }).Count | Should -Be 0
    }
    It 'NPI-AI-04: an agent identity with a record but no handshake' {
        $in = Get-TestInputs; $in.Handshakes = @($in.Handshakes | Where-Object HandshakeId -NE 'HS-001')
        (@((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object Rule -EQ 'NPI-AI-04')[0]).Object | Should -Be 'Benefits Q&A Agent (AgentIdentity)'
    }
    It 'NPI-AI-05: missing fields and a technical owner who is the sponsor' {
        (Get-F 'NPI-AI-05' 'Case Triage Agent*').Issue | Should -Be 'Handshake HS-002 incomplete: missing SponsoringGroupId, CaPolicies, AccessMode; the technical owner is the sponsor'
    }
    It 'NPI-AI-05: a handshake naming another blueprint or placement than the directory and the record' {
        $in = Get-TestInputs; $h = $in.Handshakes | Where-Object HandshakeId -EQ 'HS-001'; $h.BlueprintAppId = '1a000000-0000-4000-8000-000000000009'; $h.Placement = 'ORG-X'
        $i = (@((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-05' -and $_.Object -like 'Benefits Q&A*' })[0]).Issue
        $i | Should -Match 'names blueprint 1a000000-0000-4000-8000-000000000009'
        $i | Should -Match 'placement ORG-X differs'
    }
    It 'NPI-AI-06: an agent created before its handshake was reviewed' {
        (Get-F 'NPI-AI-06').Object | Should -Be 'Case Triage Agent (AgentIdentity)'
    }
}

Describe 'Sponsors, technical owners and the record (the fields Chapter 02 recorded)' {
    It 'NPI-AI-07: no accountable human when the only sponsor is a contractor, a guest or a leaver (P2)' {
        (Get-F 'NPI-AI-07' 'Sandbox Helper*' 'Finding').Issue | Should -Match 'employeeType ''Contractor'''
        (Get-F 'NPI-AI-07' 'Sandbox Helper*' 'Finding').Priority | Should -Be 'P2'
        $r = Invoke-TestCheck -Mutate { param($e) $e.agentSponsors['5b000000-0000-4000-8000-000000000015'] = @(@{ '@odata.type' = '#microsoft.graph.user'; id = '5a000000-0000-4000-8000-000000000004' }, @{ '@odata.type' = '#microsoft.graph.user'; id = '5a000000-0000-4000-8000-000000000002' }) }
        $i = (@($r.Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-07' -and $_.Severity -eq 'Finding' -and $_.Object -like 'Benefits Q&A*' })[0]).Issue
        $i | Should -Match 'is a guest'
        $i | Should -Match 'bob@contoso\.example is disabled'
    }
    It 'NPI-AI-07: a sponsoring group is required beside the person (Warn)' {
        (Get-F 'NPI-AI-07' 'Case Triage Agent*' 'Warn').Count | Should -Be 1
    }
    It 'NPI-AI-08: the record and the directory name different sponsors' {
        (Get-F 'NPI-AI-08').Issue | Should -Be 'The record (UC-2026-009) names sponsor bob@contoso.example; the directory has carol@contoso.example'
    }
    It 'NPI-AI-09: the sponsor is never the technical owner, on an agent or a blueprint' {
        @(Get-F 'NPI-AI-09' | ForEach-Object Object | Sort-Object) | Should -Be @('Case Triage Agent (AgentIdentity)', 'Case Triage Blueprint (AgentIdentityBlueprint)', 'Pilot Sandbox Blueprint (AgentIdentityBlueprint)', 'Sandbox Helper (AgentIdentity)')
    }
}

Describe 'N6.3 and N6.4: credentials and least privilege' {
    It 'NPI-AI-10: a secret on a production blueprint is a finding; on a blueprint tagged Development, Info' {
        (Get-F 'NPI-AI-10' 'Case Triage Blueprint*').Severity | Should -Be 'Finding'
        (Get-F 'NPI-AI-10' 'Pilot Sandbox*').Severity | Should -Be 'Info'
        (Get-F 'NPI-AI-10' 'Correspondence*').Issue | Should -Match 'Mail Automation'
    }
    It 'NPI-AI-11: a certificate alone where a managed identity would do (Warn)' {
        $r = Invoke-TestCheck -Mutate { param($e) $e.federatedIdentityCredentials.Remove('0a000000-0000-4000-8000-000000000008'); $e.blueprints[0].keyCredentials = @(@{ keyId = 'k1'; displayName = 'CN=benefits' }) }
        (@($r.Result.Findings | Where-Object Rule -EQ 'NPI-AI-11')[0]).Object | Should -Be 'Benefits Agent Blueprint (AgentIdentityBlueprint)'
    }
    It 'federation from another issuer is the second choice and passes' {
        $r = Invoke-TestCheck -Mutate { param($e) $e.federatedIdentityCredentials['0a000000-0000-4000-8000-000000000008'][0].issuer = 'https://token.actions.githubusercontent.com' }
        @($r.Result.Findings | Where-Object { $_.Rule -in 'NPI-AI-10', 'NPI-AI-11' -and $_.Object -like 'Benefits Agent*' }).Count | Should -Be 0
        ($r.Result.Identities | Where-Object Name -EQ 'Benefits Agent Blueprint').Governance | Should -Be 'Agent ID; credential Federation'
    }
    It 'NPI-AI-12: no access mode chosen before permissions' {
        (Get-F 'NPI-AI-12').Object | Should -Be 'Case Triage Agent (AgentIdentity)'
    }
    It 'NPI-AI-13: allAllowed for application roles is a finding; for delegated scopes, a warning' {
        @(Get-F 'NPI-AI-13' | ForEach-Object Severity | Sort-Object) | Should -Be @('Finding', 'Warn')
    }
    It 'NPI-AI-14: a standing directory role is a finding; a time-bound one recorded in the handshake is Info' {
        (Get-F 'NPI-AI-14' 'Case Triage Agent*').Issue | Should -Match 'Exchange Administrator .* no recorded end date'
        (Get-F 'NPI-AI-14' 'Records Search*').Severity | Should -Be 'Info'
        $in = Get-TestInputs; ($in.Handshakes | Where-Object HandshakeId -EQ 'HS-003').TimeBoundRoles[0].ExpiresOn = '2026-10-01'
        (@((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-14' -and $_.Object -like 'Records*' })[0]).Severity | Should -Be 'Finding'
    }
    It 'NPI-AI-15: an application permission outside the consent list; a high-privilege one on a fallback service principal' {
        (Get-F 'NPI-AI-15' 'Case Triage Agent*').Severity | Should -Be 'Warn'
        (Get-F 'NPI-AI-15' 'Correspondence*').Issue | Should -Match 'Directory\.ReadWrite\.All'
    }
}

Describe 'N6.5: sponsor movers and leavers, ten business days' {
    It 'counts business days, skipping weekends and federal holidays' {
        $h = (Get-NpiAgentConfig).Rules.federalHolidays
        $d = { param($s) [datetime]::Parse($s, [Globalization.CultureInfo]::InvariantCulture) }
        (Get-NpiBusinessDayDeadline -Start (& $d '2026-10-09') -Days 10 -Holidays $h).ToString('yyyy-MM-dd') | Should -Be '2026-10-26'
        (Get-NpiBusinessDayDeadline -Start (& $d '2026-11-05') -Days 10 -Holidays $h).ToString('yyyy-MM-dd') | Should -Be '2026-11-20'
    }
    It 'NPI-AI-16: an unconfirmed transfer after ten business days makes an orphaned agent, handed to Chapter 02' {
        (Get-F 'NPI-AI-16' 'Records Search*' 'Finding').Issue | Should -Match 'no confirmation by 2026-10-26'
        @($script:Run.Result.OrphanCandidates.IdentityId) | Should -Contain 'sp:5b000000-0000-4000-8000-000000000017'
        ($script:Run.Result.Identities | Where-Object Name -EQ 'Records Search Agent').SponsorState | Should -Be 'Orphaned'
    }
    It 'inside the window it is Info with the due date; a confirmation in time clears it' {
        (Get-F 'NPI-AI-16' 'Case Triage Agent*').Issue | Should -Match 'confirms by 2026-11-10'
        $in = Get-TestInputs; $in.Confirmations = @([pscustomobject]@{ AgentIdentityId = 'sp:5b000000-0000-4000-8000-000000000017'; EventSponsorUpn = 'bob@contoso.example'; ConfirmedBy = 'carol@contoso.example'; ConfirmedOn = '2026-10-20'; Decision = 'Confirm' })
        $r = Invoke-TestCheck -Inputs $in
        @($r.Result.Findings | Where-Object { $_.Rule -eq 'NPI-AI-16' -and $_.Severity -eq 'Finding' }).Count | Should -Be 0
    }
    It 'NPI-AI-17: the mover workflow lacks the transfer task' {
        (Get-F 'NPI-AI-17').Object | Should -Be 'Lifecycle Workflows (mover)'
        $r = Invoke-TestCheck -Mutate { param($e) $e.workflowTasks['wf000000-0000-4000-8000-000000000002'] = @($e.workflowTasks['wf000000-0000-4000-8000-000000000001']) }
        @($r.Result.Findings | Where-Object Rule -EQ 'NPI-AI-17').Count | Should -Be 0
    }
}

Describe 'N6.6: agent Conditional Access in report-only' {
    It 'NPI-AI-18: the block-unapproved policy in place and matching gives no finding; enforced, a warning; changed, a finding' {
        @(Get-F 'NPI-AI-18').Count | Should -Be 0
        (@((Invoke-TestCheck -Mutate { param($e) $e.conditionalAccessPolicies[0].state = 'enabled' }).Result.Findings | Where-Object Rule -EQ 'NPI-AI-18')[0]).Severity | Should -Be 'Warn'
        $r = Invoke-TestCheck -Mutate { param($e) $e.conditionalAccessPolicies[0].conditions.clientApplications.excludeAgentIdServicePrincipals = @('5b000000-0000-4000-8000-000000000018') }
        (@($r.Result.Findings | Where-Object Rule -EQ 'NPI-AI-18')[0]).Issue | Should -Match 'one by one, outside the handshake'
    }
    It 'NPI-AI-19: the high-risk block is missing (a preview watch item, Warn)' {
        (Get-F 'NPI-AI-19').Severity | Should -Be 'Warn'
        (Get-F 'NPI-AI-19').Issue | Should -Match 'preview watch item'
    }
    It 'NPI-AI-20: the approval attribute without a complete handshake lets an agent through the block' {
        (Get-F 'NPI-AI-20' -Severity Finding).Object | Should -Be 'Sandbox Helper (AgentIdentity)'
        $r = Invoke-TestCheck -Mutate { param($e) $e.customSecurityAttributes.Remove('5b000000-0000-4000-8000-000000000015') }
        (@($r.Result.Findings | Where-Object Rule -EQ 'NPI-AI-20' | Where-Object Object -Like 'Benefits*')[0]).Severity | Should -Be 'Warn'
    }
}

Describe 'N6.7: AI drift' {
    It 'NPI-AI-21: an agentic system with no governed identity (P1); a generative chatbot isn''t' {
        (Get-F 'NPI-AI-21').Object | Should -Be 'Claims Summarizer (use case)'
        (Get-F 'NPI-AI-21').Priority | Should -Be 'P1'
    }
    It 'NPI-AI-22: shadow AI identities, an agent and a blueprint nobody declared (P1)' {
        @(Get-F 'NPI-AI-22' | ForEach-Object Object | Sort-Object) | Should -Be @('Pilot Sandbox Blueprint (AgentIdentityBlueprint)', 'Sandbox Helper (AgentIdentity)')
    }
    It 'NPI-AI-23: a credential added outside the pipeline (P1); one inside a change window passes' {
        @(Get-F 'NPI-AI-23').Count | Should -Be 1
        (Get-F 'NPI-AI-23').Issue | Should -Match '2026-10-20T14:00:00Z by carol@contoso\.example'
        $in = Get-TestInputs; $in.Changes = @()
        @((Invoke-TestCheck -Inputs $in).Result.Findings | Where-Object Rule -EQ 'NPI-AI-23').Count | Should -Be 2
    }
    It 'finding IDs are stable: the rule and the object' {
        $again = Invoke-TestCheck
        ($again.Result.Findings.Id | Sort-Object) | Should -Be ($script:Run.Result.Findings.Id | Sort-Object)
        foreach ($f in $script:Run.Result.Findings) { $f.Id | Should -Be "$($f.Rule):$($f.ObjectKey)" }
    }
}

Describe 'The agent Conditional Access plan and its separate write path' {
    BeforeAll {
        $script:Plan = New-NpiAgentCaPlan -Estate $script:Run.Estate -Cloud gcc -TenantId $script:Tenant -AsOf $script:AsOf
        function Save-Plan($Plan) { $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid()); Write-NpiJson -Path $p -Value $Plan; [pscustomobject]@{ Path = $p; Sha = Get-NpiFileHash -Path $p } }
        function New-W([string]$Tenant = $script:Tenant) { $f = New-NpiAgentFixtureInvoker -Path $script:Fixture -AllowWrite; [pscustomobject]@{ Fake = $f; Writer = (New-NpiAgentCaWriter -Cloud gcc -TenantId $Tenant -Invoke $f.Invoke) } }
    }
    It 'creates only what is missing, report-only, and the same inputs give the same hash' {
        @($script:Plan.actions | ForEach-Object { "$($_.Kind) $($_.Action)" }) | Should -Be @('Unapproved InPlace', 'HighRisk Create')
        ($script:Plan.actions | Where-Object Write).Body.state | Should -Be 'enabledForReportingButNotEnforced'
        (Save-Plan $script:Plan).Sha | Should -Be (Save-Plan (New-NpiAgentCaPlan -Estate $script:Run.Estate -Cloud gcc -TenantId $script:Tenant -AsOf $script:AsOf)).Sha
    }
    It 'refuses a reviewed policy file that isn''t report-only Block' {
        Mock -ModuleName NpiAgentId Test-NpiAgentCaPolicyShape { @('state is ''enabled'', not report-only') }
        { New-NpiAgentCaPlan -Estate $script:Run.Estate -Cloud gcc -TenantId $script:Tenant -AsOf $script:AsOf } | Should -Throw '*doesn''t meet the design*'
    }
    It 'dry run reports WouldSend; -Apply sends one report-only POST; nothing else' {
        $s = Save-Plan $script:Plan; $w = New-W
        (Invoke-NpiAgentCaPlan -Writer $w.Writer -PlanPath $s.Path -ApprovedSha256 $s.Sha -AsOf $script:AsOf).Results.Status | Should -Be 'WouldSend'
        @($w.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        $r = Invoke-NpiAgentCaPlan -Writer $w.Writer -PlanPath $s.Path -ApprovedSha256 $s.Sha -AsOf $script:AsOf -Apply
        $r.Results.Status | Should -Be 'Sent'
        @($w.Fake.Calls | Where-Object Method -NE 'GET' | ForEach-Object { "$($_.Method) $($_.Uri)" }) | Should -Be @('POST https://graph.microsoft.com/beta/identity/conditionalAccess/policies')
        @($w.Fake.Estate.conditionalAccessPolicies | Where-Object displayName -Like 'NPI-AGENT-02*').state | Should -Be 'enabledForReportingButNotEnforced'
    }
    It 're-reads before the write and skips a policy that appeared since review' {
        $s = Save-Plan $script:Plan; $w = New-W
        $w.Fake.Estate.conditionalAccessPolicies = @($w.Fake.Estate.conditionalAccessPolicies) + @(@{ id = 'x'; displayName = 'NPI-AGENT-02 Block high-risk agent identities (report-only, watch item)'; state = 'enabledForReportingButNotEnforced' })
        (Invoke-NpiAgentCaPlan -Writer $w.Writer -PlanPath $s.Path -ApprovedSha256 $s.Sha -AsOf $script:AsOf -Apply).Results.Status | Should -Be 'Skipped'
    }
    It 'refuses a hash nobody approved, another tenant, an old plan, and a body that would enforce' {
        $s = Save-Plan $script:Plan
        { Invoke-NpiAgentCaPlan -Writer (New-W).Writer -PlanPath $s.Path -ApprovedSha256 ('0' * 64) -AsOf $script:AsOf } | Should -Throw '*nobody reviewed*'
        { Invoke-NpiAgentCaPlan -Writer (New-W 'c0ffee00-0000-4000-8000-000000000999').Writer -PlanPath $s.Path -ApprovedSha256 $s.Sha -AsOf $script:AsOf } | Should -Throw '*is for tenant*'
        { Invoke-NpiAgentCaPlan -Writer (New-W).Writer -PlanPath $s.Path -ApprovedSha256 $s.Sha -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
        $bad = $script:Plan | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable
        ($bad.actions | Where-Object { $_.Write }).Body.state = 'enabled'
        $sb = Save-Plan $bad
        { Invoke-NpiAgentCaPlan -Writer (New-W).Writer -PlanPath $sb.Path -ApprovedSha256 $sb.Sha -AsOf $script:AsOf -Apply } | Should -Throw '*isn''t report-only*'
    }
}

Describe 'The Chapter 09 entry scripts' {
    It 'Invoke-NpiAgentId.ps1 writes the findings, filled sponsor fields, orphan candidates and plan with a manifest' {
        $null = New-Runs gcc
        $out = Join-Path $script:Tmp 'agent-run'
        $lines = & (Join-Path $script:Root 'Invoke-NpiAgentId.ps1') -Cloud gcc -RegisterRun (Join-Path $script:Tmp 'inventory-gcc') -OwnershipRun (Join-Path $script:Tmp 'ownership-gcc') -FixturePath $script:Fixture -InputPath $script:Inputs -OutputPath $out
        $lines[1] | Should -Be 'AI identities: 8 checked (4 AgentIdentity, 3 AgentIdentityBlueprint, 1 ServicePrincipal); Chapter 02 sponsor fields filled: 2 of 2'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'agent-id'
        $m.decision.mode | Should -Be 'AgentId'
        @($m.files.PSObject.Properties.Name | Sort-Object) | Should -Be @('agent-ca-plan.json', 'ai-identities.json', 'findings.json', 'orphan-candidates.json')
        $m.graphPermissions | Should -Contain 'AgentIdentity.Read.All'
    }
    It 'Invoke-NpiAgentCaAction.ps1 refuses a run in a different cloud than the plan''s' {
        $out = Join-Path $script:Tmp 'agent-run'
        $plan = Join-Path $out 'agent-ca-plan.json'; $sha = Get-NpiFileHash -Path $plan
        { & (Join-Path $script:Root 'Invoke-NpiAgentCaAction.ps1') -Cloud global -PlanPath $plan -ApprovedSha256 $sha -FixturePath $script:Fixture -OutputPath (Join-Path $script:Tmp 'ca-x') } | Should -Throw '*is for cloud*'
    }
}
