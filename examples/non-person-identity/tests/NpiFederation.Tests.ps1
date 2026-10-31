#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 05: federated credentials and managed identities as code, the pre-cutover checks, the token
# exchange test against the fake endpoint, the 30-day parallel run, and the separate write path, against
# the fictional tenant in tests/fixtures/ch05.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiFederation/NpiFederation.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Dir = Join-Path $PSScriptRoot 'fixtures/ch05'
    $script:Tenant = (Resolve-Path (Join-Path $script:Dir 'tenant.json')).Path
    $script:ConvPath = (Resolve-Path (Join-Path $script:Dir 'conversions.json')).Path
    $script:CutPath = (Resolve-Path (Join-Path $script:Dir 'cutover-log.csv')).Path
    $script:TenantId = 'c0ffee00-0000-4000-8000-000000000001'
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-wif-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Path $script:Tmp | Out-Null

    function New-ReadClient([int]$PageSize = 2) {
        $fake = New-NpiWifFake -Path $script:Tenant -PageSize $PageSize
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId $script:TenantId -AsOf $script:AsOf
        [pscustomobject]@{ Fake = $fake; Client = (New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep) }
    }
    function New-WriteClient {
        $fake = New-NpiWifFake -Path $script:Tenant -AllowWrite
        [pscustomobject]@{ Fake = $fake; Client = (New-NpiWifClient -Cloud gcc -Task federation-apply -TenantId $script:TenantId -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke) }
    }
    function Get-Conv { Import-NpiWifConversions -Path $script:ConvPath }
    function Get-Cut { Import-NpiWifCutoverLog -Path $script:CutPath }
    function Get-TestPlan($Conversions = (Get-Conv), $Cutover = (Get-Cut), [int]$PageSize = 2) {
        $t = New-ReadClient -PageSize $PageSize
        New-NpiWifPlan -Client $t.Client -Conversions $Conversions -CutoverLog $Cutover -AsOf $script:AsOf
    }
    function Save-Plan($Plan) {
        $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid())
        Write-NpiJson -Path $p -Value $Plan
        [pscustomobject]@{ Path = $p; Sha = Get-NpiFileHash -Path $p }
    }
    function New-Cutover([hashtable]$Rows) {
        $map = @{}; foreach ($k in $Rows.Keys) { $map[$k] = [pscustomobject]$Rows[$k] }
        [pscustomobject]@{ Rows = $map; Sha256 = ('0' * 64) }
    }
    function Get-OneConversion([string]$Id) { $c = Get-Conv; [pscustomobject]@{ Data = $c.Data; Conversions = @($c.Conversions | Where-Object { $_.id -eq $Id }); Sha256 = $c.Sha256 } }
    $script:Run = Get-TestPlan
    function Get-Act([string]$Conv, [string]$Action) { @($script:Run.Plan.actions | Where-Object { $_.ConversionId -eq $Conv -and (-not $Action -or $_.Action -eq $Action) }) }
    function Get-Rec([string]$Conv) { @($script:Run.Records | Where-Object ConversionId -EQ $Conv)[0] }
}

AfterAll { Remove-Item -LiteralPath $script:Tmp -Recurse -Force -ErrorAction SilentlyContinue }

Describe 'The call list (config/calls-ch05.json)' {
    It 'every task''s declared permissions, roles and rights are exactly the union of its calls' {
        $list = Get-NpiWifCallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            @($list.tasks[$task].graphPermissions | Sort-Object) | Should -Be @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].azureRoles | Sort-Object) | Should -Be @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].adRights | Sort-Object) | Should -Be @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique) -Because "task $task"
        }
    }
    It 'the read task holds only GETs, Get-AD* reads and the fixture-only exchange test, and nothing ending in ReadWrite' {
        $list = Get-NpiWifCallList
        foreach ($c in @($list.calls | Where-Object { $_.tasks -contains 'federation' })) {
            $ok = $c.method -eq 'GET' -or ($c.api -eq 'ad' -and $c.cmdlet -match '^Get-AD') -or ($c.ContainsKey('fixtureOnly') -and $c.fixtureOnly)
            $ok | Should -BeTrue -Because $c.id
            @($c['permissions']) -join ',' | Should -Not -Match 'ReadWrite'
        }
        (Get-NpiWifRequiredPermission -Task federation).GraphPermissions | Should -Be @('Application.Read.All', 'AuditLog.Read.All')
    }
    It 'the write task is delegated only, and no call deletes' {
        $list = Get-NpiWifCallList
        $list.tasks['federation-apply'].delegatedOnly | Should -BeTrue
        $list.tasks['federation-apply'].delegatedRole | Should -Be 'Cloud Application Administrator'
        @($list.calls | Where-Object { $_.method -eq 'DELETE' -or "$($_['cmdlet'])" -match '^Remove-' }) | Should -BeNullOrEmpty
        (Get-NpiWifRequiredPermission -Task federation-apply).AzureRoles | Should -Contain 'Managed Identity Contributor'
    }
    It 'every call has a unique ch05- ID, a Learn page and a stage' {
        $calls = @((Get-NpiWifCallList).calls)
        @($calls.id | Sort-Object -Unique).Count | Should -Be $calls.Count
        foreach ($c in $calls) { $c.id | Should -Match '^ch05-'; $c.learn | Should -Match '^https://learn\.microsoft\.com/'; $c.stage | Should -Not -BeNullOrEmpty }
    }
}

Describe 'The client and the token exchange harness' {
    It 'refuses a call the task doesn''t declare, and a next link on another host' {
        $t = New-ReadClient
        { Invoke-NpiWifGet -Client $t.Client -CallId 'ch05-fic-create' -Bind @{ id = 'x' } } | Should -Throw '*Undeclared*'
        $bad = New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -Invoke { param($m, $u) @{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://evil.example/next' } }
        { Invoke-NpiWifGet -Client $bad -CallId 'ch05-application-fics' -Bind @{ id = '0a000000-0000-4000-8000-000000000004' } } | Should -Throw '*Refusing to send the token*'
    }
    It 'reads every page whatever the page size' {
        $a = Get-TestPlan -PageSize 1; $b = Get-TestPlan -PageSize 5
        ($a.Plan | ConvertTo-Json -Depth 20) | Should -Be ($b.Plan | ConvertTo-Json -Depth 20)
    }
    It 'sends the exchange test only to the fake token endpoint' {
        $c = New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -TokenEndpoint ([pscustomobject]@{ Invoke = { 'real' } })
        $p = [pscustomobject]@{ Issuer = 'https://contoso.example'; Subject = 's'; Audience = 'api://AzureADTokenExchange'; Note = $null }
        { Test-NpiWifTokenExchange -Client $c -ClientId 'x' -Presented $p -CredentialName 'n' -AsOf $script:AsOf } | Should -Throw '*only against the fake*'
    }
    It 'builds Learn''s client credentials request with a federated credential, on the cloud''s sign-in host' {
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcchigh -TenantId $script:TenantId -AsOf $script:AsOf -Credentials @([pscustomobject]@{ ClientId = 'c1'; Name = 'n'; Id = 'i'; Issuer = 'https://contoso.example'; Subject = 's'; Audiences = @('api://AzureADTokenExchange') })
        $c = New-NpiWifClient -Cloud gcchigh -Task federation -TenantId $script:TenantId -TokenEndpoint $ep
        $p = [pscustomobject]@{ Issuer = 'https://contoso.example'; Subject = 's'; Audience = 'api://AzureADTokenExchange'; Note = $null }
        (Test-NpiWifTokenExchange -Client $c -ClientId 'c1' -Presented $p -CredentialName 'n' -AsOf $script:AsOf).Passed | Should -BeTrue
        $ep.Calls[0].Uri | Should -Be "https://login.microsoftonline.us/$($script:TenantId)/oauth2/v2.0/token"
        @($ep.Calls[0].Keys) | Should -Be @('client_assertion', 'client_assertion_type', 'client_id', 'grant_type', 'scope')
        $c.Evidence[0].Target | Should -Not -Match 'eyJ'
    }
    It 'matches case-sensitively, blocks whitespace around the issuer, refuses an expired assertion, and fails when another credential matched' {
        $creds = @([pscustomobject]@{ ClientId = 'c1'; Name = 'a'; Id = '1'; Issuer = 'https://contoso.example'; Subject = 'Main'; Audiences = @('api://AzureADTokenExchange') })
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId $script:TenantId -AsOf $script:AsOf -Credentials $creds
        $c = New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -TokenEndpoint $ep
        $p = { param($i, $s) [pscustomobject]@{ Issuer = $i; Subject = $s; Audience = 'api://AzureADTokenExchange'; Note = $null } }
        (Test-NpiWifTokenExchange -Client $c -ClientId 'c1' -Presented (& $p 'https://contoso.example' 'main') -CredentialName 'a' -AsOf $script:AsOf).Error | Should -Match 'AADSTS70021'
        (Test-NpiWifTokenExchange -Client $c -ClientId 'c1' -Presented (& $p 'https://contoso.example ' 'Main') -CredentialName 'a' -AsOf $script:AsOf).Error | Should -Match 'whitespace'
        (Test-NpiWifTokenExchange -Client $c -ClientId 'c1' -Presented (& $p 'https://contoso.example' 'Main') -CredentialName 'a' -AsOf $script:AsOf.AddMinutes(-10)).Error | Should -Match 'expired'
        (Test-NpiWifTokenExchange -Client $c -ClientId 'c1' -Presented (& $p 'https://contoso.example' 'Main') -CredentialName 'b' -AsOf $script:AsOf).Error | Should -Match "Matched 'a'"
    }
}

Describe 'What the workload presents, and the credential checks' {
    It 'derives GitHub subjects in Learn''s formats, only for the name-based format' {
        $g = { param($e, $v, $f = 'name-based') (Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = 'contoso/build'; entity = $e; value = $v; subjectFormat = $f }) }
        (& $g 'environment' 'production').Subject | Should -BeExactly 'repo:contoso/build:environment:production'
        (& $g 'branch' 'main').Subject | Should -BeExactly 'repo:contoso/build:ref:refs/heads/main'
        (& $g 'tag' 'v2').Subject | Should -BeExactly 'repo:contoso/build:ref:refs/tags/v2'
        (& $g 'branch' 'main').Issuer | Should -BeExactly 'https://token.actions.githubusercontent.com'
        (& $g 'branch' 'main' 'immutable').Subject | Should -BeNullOrEmpty
        (& $g 'branch' 'main' 'immutable').Note | Should -Match 'row 43'
        (Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; capturedSubject = 'repo:contoso/build:pull_request' }).Source | Should -Be 'captured'
    }
    It 'derives a Kubernetes service account subject' {
        (Get-NpiWifPresentedClaims -Workload @{ platform = 'kubernetes'; issuer = 'https://oidc.example/'; namespace = 'web'; serviceAccount = 'front' }).Subject | Should -BeExactly 'system:serviceaccount:web:front'
    }
    It 'applies Learn''s rules: name, length, wildcards, one audience, the exact audience, and no preview flexible credentials' {
        $base = @{ name = 'ok-name'; issuer = 'https://contoso.example'; subject = 's'; audiences = @('api://AzureADTokenExchange') }
        @(Test-NpiWifCredential -Credential $base) | Should -BeNullOrEmpty
        $try = { param([hashtable]$x) $c = $base.Clone(); foreach ($k in $x.Keys) { $c[$k] = $x[$k] }; @(Test-NpiWifCredential -Credential $c).Rule }
        & $try @{ name = '-bad' } | Should -Contain 'NPI-WIF-05'
        & $try @{ name = 'ab' } | Should -Contain 'NPI-WIF-05'
        & $try @{ subject = ('x' * 601) } | Should -Contain 'NPI-WIF-05'
        & $try @{ subject = 'repo:contoso/*' } | Should -Contain 'NPI-WIF-05'
        & $try @{ audiences = @('api://AzureADTokenExchange', 'other') } | Should -Contain 'NPI-WIF-04'
        & $try @{ audiences = @('API://AzureADTokenExchange') } | Should -Contain 'NPI-WIF-04'
        & $try @{ claimsMatchingExpression = @{ value = "claims['sub'] eq 'x'"; languageVersion = 1 } } | Should -Contain 'NPI-WIF-05'
        & $try @{ issuer = ' https://contoso.example' } | Should -Contain 'NPI-WIF-03'
    }
    It 'checks the issuer and subject exactly against what the workload presents' {
        $p = [pscustomobject]@{ Issuer = 'https://token.actions.githubusercontent.com'; Subject = 'repo:contoso/payroll:environment:production'; Audience = 'api://AzureADTokenExchange'; Note = $null }
        $c = @{ name = 'n-one'; issuer = 'https://token.actions.githubusercontent.com/'; subject = 'repo:contoso/payroll:environment:Production'; audiences = @('api://AzureADTokenExchange') }
        @(Test-NpiWifCredential -Credential $c -Presented $p).Rule | Should -Be @('NPI-WIF-03', 'NPI-WIF-02')
        $none = [pscustomobject]@{ Issuer = 'https://token.actions.githubusercontent.com'; Subject = $null; Audience = 'api://AzureADTokenExchange'; Note = 'capture it' }
        @(Test-NpiWifCredential -Credential $c -Presented $none | Where-Object Rule -EQ 'NPI-WIF-02').Issue | Should -Match 'capture it'
    }
    It 'holds the plan''s order: managed identity, then federated credential, then certificate' {
        $o = { param($az, $oidc, $kind, $creds = @()) Test-NpiWifOrder -Conversion @{ host = @{ azureHosted = $az; oidcIssuer = $oidc }; target = @{ kind = $kind; credentials = $creds } } }
        & $o $true $false 'managedIdentity' | Should -BeNullOrEmpty
        & $o $true $false 'certificate' | Should -Match 'managedIdentity'
        & $o $true $true 'federatedCredential' | Should -Match 'managedIdentity'
        & $o $false $true 'federatedCredential' | Should -BeNullOrEmpty
        & $o $false $true 'certificate' | Should -Match 'federatedCredential'
        & $o $false $true 'managedIdentity' @(@{ name = 'x' }) | Should -BeNullOrEmpty
        & $o $false $false 'certificate' | Should -BeNullOrEmpty
    }
}

Describe 'The plan over the fixture tenant' {
    It 'raises each finding where expected, with stable IDs' {
        $got = @($script:Run.Findings | ForEach-Object { $_.Id } | Sort-Object)
        $got | Should -Be @(
            'NPI-WIF-01:conv-06', 'NPI-WIF-02:conv-02/payroll-prod', 'NPI-WIF-03:conv-02/payroll-prod', 'NPI-WIF-04:conv-03/github-intranet-tag',
            'NPI-WIF-07:conv-02/payroll-test', 'NPI-WIF-08:conv-02/payroll-prod', 'NPI-WIF-08:conv-03/github-intranet-tag', 'NPI-WIF-09:conv-08')
        @($script:Run.Findings | Where-Object Severity -EQ 'Warn').Rule | Should -Be 'NPI-WIF-07'
    }
    It 'plans four writes, in order, and blocks every credential that fails a check or its exchange test' {
        @($script:Run.Plan.actions | Where-Object Write | ForEach-Object { "$($_.ConversionId):$($_.Action):$($_.Name)" }) | Should -Be @(
            'conv-01:DisableLegacy:svc-hrsync', 'conv-03:CreateCredential:github-intranet', 'conv-04:CreateIdentity:id-webfront', 'conv-04:CreateCredential:aks-webfront')
        (Get-Act 'conv-02' 'Blocked').Name | Should -Be 'payroll-prod'
        (Get-Act 'conv-03' 'Blocked').Name | Should -Be 'github-intranet-tag'
        (Get-Act 'conv-06' 'Blocked').Reason | Should -Match 'plan''s order'
        (Get-Act 'conv-03' 'NoChange').Name | Should -Be 'github-main'
    }
    It 'runs an exchange test for every federated credential and records the result' {
        @($script:Run.Tests).Count | Should -Be 6
        @($script:Run.Tests | Where-Object { -not $_.Passed } | ForEach-Object Credential | Sort-Object) | Should -Be @('github-intranet-tag', 'payroll-prod')
        (@($script:Run.Tests | Where-Object Credential -EQ 'aks-webfront')[0]).ClientId | Should -BeLike 'pending:*'
    }
    It 'reports a credential the reviewed file doesn''t hold, and never deletes it' {
        (Get-Act 'conv-02' 'Unmanaged').Name | Should -Be 'payroll-test'
        @($script:Run.Plan.actions | Where-Object { $_.Method -eq 'DELETE' }) | Should -BeNullOrEmpty
    }
    It 'creates a missing user-assigned identity, records an existing one with its role assignments, and hands certificates to Chapter 04' {
        (Get-Act 'conv-04' 'CreateIdentity').Body.location | Should -Be 'eastus'
        (Get-Rec 'conv-01').Identity.ClientId | Should -Be '1b000000-0000-4000-8000-000000000016'
        @((Get-Rec 'conv-01').RoleAssignments).Count | Should -Be 1
        (Get-Rec 'conv-07').Identity.Kind | Should -Be 'SystemAssignedManagedIdentity'
        @((Get-Rec 'conv-07').RoleAssignments)[0].RoleDefinitionId | Should -Be 'b24988ac-6180-42a0-ab88-20f7382dd24c'
        (Get-Act 'conv-05' 'HandOffChapter04') | Should -Not -BeNullOrEmpty
    }
    It 'gates cutover on the checks and the exchange test' {
        (Get-Rec 'conv-02').CutoverGate | Should -Be 'Blocked'
        (Get-Rec 'conv-04').CutoverGate | Should -Be 'NotReady'
        (Get-Rec 'conv-08').CutoverGate | Should -Be 'Ready'
    }
    It 'is the same plan, byte for byte, from the same inputs' {
        (Save-Plan (Get-TestPlan).Plan).Sha | Should -Be (Save-Plan $script:Run.Plan).Sha
    }
    It 'refuses more than 20 credentials on one parent, and a repeated issuer and subject' {
        $c = Get-OneConversion 'conv-03'
        $many = @(1..20 | ForEach-Object { @{ name = "fic-$_"; issuer = 'https://token.actions.githubusercontent.com'; subject = "repo:contoso/intranet:ref:refs/heads/b$_"; audiences = @('api://AzureADTokenExchange'); workload = @{ platform = 'github'; repository = 'contoso/intranet'; entity = 'branch'; value = "b$_"; subjectFormat = 'name-based' } } })
        $c.Conversions[0].target.credentials = $many
        $r = Get-TestPlan -Conversions $c -Cutover (New-Cutover @{})
        @($r.Findings | Where-Object Rule -EQ 'NPI-WIF-06').Issue | Should -Match 'limit is 20'
        @($r.Plan.actions | Where-Object Write) | Should -BeNullOrEmpty
        $c2 = Get-OneConversion 'conv-03'
        $dup = $c2.Conversions[0].target.credentials[1].Clone(); $dup.name = 'github-intranet-2'
        $c2.Conversions[0].target.credentials = @($c2.Conversions[0].target.credentials[1], $dup)
        (Get-TestPlan -Conversions $c2 -Cutover (New-Cutover @{})).Findings.Rule | Should -Contain 'NPI-WIF-06'
    }
}

Describe 'The 30-day parallel run' {
    It 'is ready to disable the legacy account after a clean 30 days with the owner''s approval' {
        $p = (Get-Rec 'conv-01').ParallelRun
        $p.Status | Should -Be 'ReadyToDisableLegacy'; $p.Day | Should -Be 40; $p.NewSignIns | Should -Be 2
        (Get-Act 'conv-01' 'DisableLegacy').Target | Should -Be 'Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000001'
    }
    It 'is still running inside the window, with the date it ends' {
        $p = (Get-Rec 'conv-07').ParallelRun
        $p.Status | Should -Be 'ParallelRunning'; $p.Day | Should -Be 15; $p.WindowEnds | Should -Be '2026-11-14'
    }
    It 'isn''t clean while the legacy secret still signs in, and the secret is the owner''s to remove' {
        (Get-Rec 'conv-08').ParallelRun.Status | Should -Be 'LegacyStillInUse'
        (Get-Rec 'conv-08').ParallelRun.LegacyDetail | Should -Match '2026-10-28T23:30:00Z'
        $cut = New-Cutover @{ 'conv-08' = @{ ConversionId = 'conv-08'; CutoverOn = '2026-10-29'; DisableApprovedBy = 'x'; DisabledOn = '' } }
        $r = Get-TestPlan -Conversions (Get-OneConversion 'conv-08') -Cutover $cut
        @($r.Plan.actions | Where-Object Write) | Should -BeNullOrEmpty
    }
    It 'flags a legacy AD logon after cutover, silence on the new credential, and a missing approval' {
        $one = { param($conv, [hashtable]$row) $row.ConversionId = $conv; (Get-TestPlan -Conversions (Get-OneConversion $conv) -Cutover (New-Cutover @{ $conv = $row })).Records[0].ParallelRun.Status }
        & $one 'conv-07' @{ CutoverOn = '2026-10-01'; DisableApprovedBy = ''; DisabledOn = '' } | Should -Be 'LegacyStillInUse'
        & $one 'conv-01' @{ CutoverOn = '2026-10-29T03:00:00Z'; DisableApprovedBy = ''; DisabledOn = '' } | Should -Be 'ParallelRunning'
        & $one 'conv-03' @{ CutoverOn = '2026-10-01'; DisableApprovedBy = ''; DisabledOn = '' } | Should -Be 'LegacyStillInUse'
        & $one 'conv-01' @{ CutoverOn = '2026-09-20'; DisableApprovedBy = ''; DisabledOn = '' } | Should -Be 'AwaitingOwnerApproval'
        & $one 'conv-01' @{ CutoverOn = '2026-09-20'; DisableApprovedBy = 'x'; DisabledOn = '2026-10-21' } | Should -Be 'Converted'
    }
    It 'reports no sign-ins on a new credential after a week' {
        $c = Get-OneConversion 'conv-01'
        $c.Conversions[0].legacy = @{ kind = 'appSecret'; name = 'n'; applicationObjectId = '0a000000-0000-4000-8000-000000000006'; keyId = 'k' }
        $cut = New-Cutover @{ 'conv-01' = @{ ConversionId = 'conv-01'; CutoverOn = '2026-10-29T03:00:00Z'; DisableApprovedBy = ''; DisabledOn = '' } }
        (Get-TestPlan -Conversions $c -Cutover $cut).Records[0].ParallelRun.Status | Should -Be 'ParallelRunning'
        $tenantCopy = Get-Content $script:Tenant -Raw | ConvertFrom-Json -AsHashtable -Depth 50
        $tenantCopy.graph.signIns = @(); $tp = Join-Path $script:Tmp 'quiet.json'; Write-NpiJson -Path $tp -Value $tenantCopy
        $fake = New-NpiWifFake -Path $tp; $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId $script:TenantId -AsOf $script:AsOf
        $cl = New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep
        $r = New-NpiWifPlan -Client $cl -Conversions (Get-OneConversion 'conv-07') -CutoverLog (Get-Cut) -AsOf $script:AsOf
        $r.Records[0].ParallelRun.Status | Should -Be 'NoSignInsOnNewCredential'
        $r.Findings.Rule | Should -Contain 'NPI-WIF-09'
    }
    It 'flags a cutover made while a credential fails its checks' {
        $cut = New-Cutover @{ 'conv-02' = @{ ConversionId = 'conv-02'; CutoverOn = '2026-10-20'; DisableApprovedBy = ''; DisabledOn = '' } }
        (Get-TestPlan -Conversions (Get-OneConversion 'conv-02') -Cutover $cut).Findings.Id | Should -Contain 'NPI-WIF-09:conv-02'
    }
}

Describe 'The separate write path' {
    BeforeAll { $script:Saved = Save-Plan $script:Run.Plan }
    It 'refuses a plan nobody approved, for another tenant or cloud, or too old' {
        $w = New-WriteClient
        { Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 ('0' * 64) -Client $w.Client -AsOf $script:AsOf } | Should -Throw '*nobody reviewed*'
        $other = New-NpiWifClient -Cloud gcc -Task federation-apply -TenantId 'c0ffee00-0000-4000-8000-000000000999' -Invoke $w.Fake.Invoke
        { Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $other -AsOf $script:AsOf } | Should -Throw '*is for tenant*'
        $high = New-NpiWifClient -Cloud gcchigh -Task federation-apply -TenantId $script:TenantId -Invoke $w.Fake.Invoke
        { Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $high -AsOf $script:AsOf } | Should -Throw '*is for cloud*'
        { Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $w.Client -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
        $r = New-ReadClient
        { Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $r.Client -AsOf $script:AsOf } | Should -Throw '*federation-apply*'
    }
    It 'refuses a write with another host, an extra property, DELETE, or a credential the checks would block' {
        $w = New-WriteClient
        $a = @($script:Run.Plan.actions | Where-Object { $_.Write -and $_.Call -eq 'ch05-fic-create' })[0] | ConvertTo-Json -Depth 10 | ConvertFrom-Json
        $x = $a | ConvertTo-Json -Depth 10 | ConvertFrom-Json; $x.Target = $x.Target.Replace('graph.microsoft.com', 'graph.contoso.example')
        { Assert-NpiWifPlannedWrite -Client $w.Client -Action $x } | Should -Throw '*Unexpected target*'
        $x = $a | ConvertTo-Json -Depth 10 | ConvertFrom-Json; $x.Body | Add-Member -NotePropertyName claimsMatchingExpression -NotePropertyValue 'x'
        { Assert-NpiWifPlannedWrite -Client $w.Client -Action $x } | Should -Throw '*not allowed*'
        $x = $a | ConvertTo-Json -Depth 10 | ConvertFrom-Json; $x.Method = 'DELETE'
        { Assert-NpiWifPlannedWrite -Client $w.Client -Action $x } | Should -Throw
        $x = $a | ConvertTo-Json -Depth 10 | ConvertFrom-Json; $x.Body.subject = 'repo:contoso/intranet:environment:Production'
        { Assert-NpiWifPlannedWrite -Client $w.Client -Action $x } | Should -Throw '*fails only at token exchange*'
        $x = $a | ConvertTo-Json -Depth 10 | ConvertFrom-Json; $x.Body.audiences = @(' api://AzureADTokenExchange')
        { Assert-NpiWifPlannedWrite -Client $w.Client -Action $x } | Should -Throw '*Audience*'
    }
    It 'dry-runs every write and sends none' {
        $w = New-WriteClient
        $r = Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $w.Client -AsOf $script:AsOf
        @($r.Results.Outcome | Sort-Object -Unique) | Should -Be 'WouldSend'
        @($w.Fake.Calls | Where-Object { $_.Method -notin 'GET', 'Get-ADUser' }) | Should -BeNullOrEmpty
    }
    It 'applies with -Apply: the identity before its credential, one at a time, and the AD account disabled, not deleted' {
        $w = New-WriteClient
        $r = Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $w.Client -AsOf $script:AsOf -Apply
        @($r.Results.Outcome | Sort-Object -Unique) | Should -Be 'Sent'
        $writes = @($w.Fake.Calls | Where-Object { $_.Method -notin 'GET', 'Get-ADUser' } | ForEach-Object { "$($_.Method) $(($_.Uri -split '\?')[0] -replace '^.*/(applications|userAssignedIdentities)/', '$1/')" })
        $writes | Should -Be @('Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000001', 'POST applications/0a000000-0000-4000-8000-000000000004/federatedIdentityCredentials', 'PUT userAssignedIdentities/id-webfront', 'PUT userAssignedIdentities/id-webfront/federatedIdentityCredentials/aks-webfront')
        @($w.Fake.Estate.ad.objects | Where-Object SamAccountName -EQ 'svc-hrsync')[0].Enabled | Should -BeFalse
        @($w.Fake.Estate.ad.objects | Where-Object SamAccountName -EQ 'svc-hrsync').Count | Should -Be 1
        @($w.Fake.Estate.graph.federatedIdentityCredentials['0a000000-0000-4000-8000-000000000004'].name) | Should -Contain 'github-intranet'
        ($r.Results | Where-Object Action -EQ 'DisableLegacy').Detail | Should -Match 'DisabledOn 2026-10-30'
    }
    It 'skips each write whose precheck no longer holds' {
        $w = New-WriteClient
        $null = Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $w.Client -AsOf $script:AsOf -Apply
        $again = New-NpiWifClient -Cloud gcc -Task federation-apply -TenantId $script:TenantId -Invoke $w.Fake.Invoke -AdInvoke $w.Fake.AdInvoke
        $r = Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $again -AsOf $script:AsOf -Apply
        @($r.Results.Outcome | Sort-Object -Unique) | Should -Be 'Skipped'
    }
    It 'a credential applied to the fake passes the exchange test that the plan predicted' {
        $w = New-WriteClient
        $null = Invoke-NpiWifPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Client $w.Client -AsOf $script:AsOf -Apply
        $made = @($w.Fake.Estate.graph.federatedIdentityCredentials['0a000000-0000-4000-8000-000000000004'] | Where-Object name -EQ 'github-intranet')[0]
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId $script:TenantId -AsOf $script:AsOf -Credentials @([pscustomobject]@{ ClientId = '1a000000-0000-4000-8000-000000000004'; Name = $made.name; Id = $made.id; Issuer = $made.issuer; Subject = $made.subject; Audiences = @($made.audiences) })
        $c = New-NpiWifClient -Cloud gcc -Task federation -TenantId $script:TenantId -TokenEndpoint $ep
        $p = Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = 'contoso/intranet'; entity = 'environment'; value = 'production'; subjectFormat = 'name-based' }
        (Test-NpiWifTokenExchange -Client $c -ClientId '1a000000-0000-4000-8000-000000000004' -Presented $p -CredentialName 'github-intranet' -AsOf $script:AsOf).Passed | Should -BeTrue
    }
}

Describe 'The entry script and its manifest' {
    BeforeAll {
        $script:Out = Join-Path $script:Tmp 'federation'
        $script:Lines = & (Join-Path $script:Root 'Invoke-NpiFederation.ps1') -Cloud gcc -ConversionsPath $script:ConvPath -CutoverLogPath $script:CutPath -FixturePath $script:Tenant -OutputPath $script:Out
        $script:Manifest = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json
    }
    It 'prints the counts Lab 1 shows' {
        $script:Lines[0] | Should -Be 'Conversions: 8 in 2 wave(s); token exchange tests: 4 passed, 2 failed'
        $script:Lines[1] | Should -Be 'Findings: 7 Finding, 1 Warn'
        $script:Lines[2] | Should -Be 'Plan: 20 actions, 4 of them writes (2 CreateCredential, 1 CreateIdentity, 1 DisableLegacy); nothing sent'
    }
    It 'records the tenant, the cloud, the permissions, the input hashes and a SHA-256 per file' {
        $script:Manifest.tenantId | Should -Be $script:TenantId
        $script:Manifest.cloud | Should -Be 'gcc'
        @($script:Manifest.graphPermissions) | Should -Be @('Application.Read.All', 'AuditLog.Read.All')
        $script:Manifest.conversionsSha256 | Should -Be (Get-NpiFileHash -Path $script:ConvPath)
        foreach ($p in $script:Manifest.files.PSObject.Properties) { Get-NpiFileHash -Path (Join-Path $script:Out $p.Name) | Should -Be $p.Value }
    }
    It 'lists every request; the reads are GETs and AD reads, and the only POST went to the fake token endpoint' {
        @($script:Manifest.requests.method | Sort-Object -Unique) | Should -Be @('GET', 'POST', 'READ')
        @($script:Manifest.requests | Where-Object method -EQ 'POST' | ForEach-Object call | Sort-Object -Unique) | Should -Be 'ch05-token-exchange-test'
    }
    It 'refuses a live plan with no tenant ID, and a conversion file for another tenant' {
        { & (Join-Path $script:Root 'Invoke-NpiFederation.ps1') -Cloud gcc -ConversionsPath $script:ConvPath -CutoverLogPath $script:CutPath -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw '*-TenantId*'
        { & (Join-Path $script:Root 'Invoke-NpiFederation.ps1') -Cloud gcc -ConversionsPath $script:ConvPath -CutoverLogPath $script:CutPath -FixturePath $script:Tenant -TenantId 'c0ffee00-0000-4000-8000-000000000999' -OutputPath (Join-Path $script:Tmp 'y') } | Should -Throw '*is for tenant*'
    }
}
