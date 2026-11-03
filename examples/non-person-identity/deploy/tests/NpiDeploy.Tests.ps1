#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 11: deploying to a live test environment, then production. The settings file, the call
# list, the preflight, the smoke test and the rollback, against the fictional test and production
# tenants and forests served by NpiDeploy's fake. Nothing leaves the machine.
# Kept beside the deploy scripts, not in tests/, so the chapters' Lab 1 test count (Invoke-Pester -Path
# tests) doesn't change; tests/test_deploy.py runs this file in the kit's pytest suite.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../NpiDeploy.psm1') -Force
    $script:Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
    $script:Fx = Join-Path $script:Root 'tests/fixtures/deploy'
    $script:TestSettings = Join-Path $script:Fx 'settings.test.json'
    $script:ProdSettings = Join-Path $script:Fx 'settings.production.json'
    $script:TestTenant = Join-Path $script:Fx 'tenant-test.json'
    $script:ProdTenant = Join-Path $script:Fx 'tenant-production.json'
    $script:Baseline = Join-Path $script:Fx 'vk-baseline.json'
    $script:Register = Join-Path $script:Fx 'register-run'
    $script:AsOf = [datetime]::Parse('2026-11-02T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-deploy-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $script:Tmp | Out-Null

    function Get-Settings([string]$Path = $script:TestSettings, [string]$Stage = 'test') { Read-NpiDeploySettings -Path $Path -Stage $Stage }
    function Get-Raw([string]$Path = $script:TestSettings) { Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20 }
    function New-Client([string]$Task, $Fake) { New-NpiDeployClient -Cloud gcc -Task $Task -Invoke $Fake.Invoke -AdInvoke $Fake.AdInvoke }
    function Get-Status($Results, [string]$Id) { @($Results | Where-Object Id -EQ $Id | ForEach-Object Status) }
    function Save-Json($Value, [string]$Name) { $p = Join-Path $script:Tmp $Name; Write-NpiJson -Path $p -Value $Value; $p }
}

AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The call list (config/calls-ch11.json)' {
    It 'declares each task as exactly the union of its calls' {
        $list = Get-NpiDeployCallList
        foreach ($t in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $t })
            $graph = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
            $ad = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
            (@($list.tasks[$t].graphPermissions | Sort-Object) -join ',') | Should -Be ($graph -join ',') -Because $t
            (@($list.tasks[$t].adRights | Sort-Object) -join ',') | Should -Be ($ad -join ',') -Because $t
        }
    }
    It 'never declares a DELETE, and the preflight only reads' {
        $list = Get-NpiDeployCallList
        @($list.calls | Where-Object method -EQ 'DELETE').Count | Should -Be 0
        @($list.calls | Where-Object { $_.tasks -contains 'deploy-preflight' -and $_.method -notin 'GET', 'READ' }).Count | Should -Be 0
        $list.tasks['deploy-preflight'].mode | Should -Be 'read'
    }
    It 'names a Learn page for every call' {
        foreach ($c in (Get-NpiDeployCallList).calls) { $c.learn | Should -Match '^https://learn\.microsoft\.com/' -Because $c.id }
    }
    It 'refuses a write from a read task' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $client = New-Client 'deploy-preflight' $fake
        { Invoke-NpiDeployWrite -Client $client -CallId 'deploy-app-addpassword' -Bind @{ id = 'x' } -Body @{} } | Should -Throw '*reads only*'
    }
    It 'refuses an undeclared call' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $client = New-Client 'deploy-smoke' $fake
        { Invoke-NpiDeployWrite -Client $client -CallId 'deploy-ca-policy-update' -Bind @{ id = 'x' } -Body @{} } | Should -Throw '*Undeclared*'
    }
}

Describe 'The settings file' {
    It 'reads the fixture test and production files, each for its own stage' {
        (Get-Settings).environment | Should -Be 'test'
        (Get-Settings $script:ProdSettings 'production').environment | Should -Be 'production'
        { Get-Settings $script:ProdSettings 'test' } | Should -Throw "*for 'production', not 'test'*"
    }
    It 'refuses the template until every placeholder is replaced, and accepts it with -AllowPlaceholders' {
        $tpl = Join-Path $script:Root 'deploy/settings.template.json'
        { Read-NpiDeploySettings -Path $tpl } | Should -Throw '*placeholder <tenant-id> not replaced*'
        { Read-NpiDeploySettings -Path $tpl -AllowPlaceholders } | Should -Not -Throw
    }
    It 'accepts the synthetic IDs empty until the Prepare step, and the preflight fails PF-07 until then' {
        $s = Get-Raw; $s.smoke.appObjectId = ''; $s.appManagementPolicy.pilotPolicyId = ''
        @(Test-NpiDeploySettings -Settings $s -Stage test).Count | Should -Be 0
        $s.smoke.appObjectId = 'not-a-guid'
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match 'leave it empty until the Prepare step'
        $s = Get-Settings; $s.smoke.appObjectId = ''
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings $s -BaselinePath $script:Baseline
        @($r.Results | Where-Object { $_.Id -eq 'PF-07' -and $_.Status -eq 'Fail' }).Actual | Should -Match 'run the Prepare step'
    }
    It 'refuses a secret by its name' {
        $s = Get-Raw; $s.deployIdentity.clientSecret = 'anything'
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match 'deployIdentity.clientSecret: a settings file holds no secret'
    }
    It 'refuses a value that looks like a client secret or a key' {
        $s = Get-Raw; $s.azure.location = 'abc8Q~' + ('x' * 34)
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match 'azure.location: looks like a key or a client secret'
        $s = Get-Raw; $s.azure.location = '-----BEGIN PRIVATE KEY-----'
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match 'looks like a key'
    }
    It 'refuses a deployment identity that signs in with a secret' {
        $s = Get-Raw; $s.deployIdentity.credential = 'clientSecret'
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match 'use certificate or federated'
    }
    It 'refuses a federated deployment identity with no subject, and a cloud it does not know' {
        $s = Get-Raw; $s.deployIdentity.credential = 'federated'
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match 'federatedSubject: missing'
        $s = Get-Raw; $s.cloud = 'GCC'
        @(Test-NpiDeploySettings -Settings $s -Stage test) -join ';' | Should -Match "cloud: 'GCC'"
    }
    It 'records the file''s SHA-256' {
        (Get-Settings)._sha256 | Should -Be (Get-NpiFileHash -Path $script:TestSettings)
    }
}

Describe 'The preflight' {
    It 'passes the fixture test tenant, with a Warn for a standing Conditional Access Administrator' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings) -BaselinePath $script:Baseline
        @($r.Results | Where-Object Status -EQ 'Fail').Count | Should -Be 0
        @($r.Results | Where-Object Status -EQ 'Warn').Check | Should -Match 'Conditional Access administrator'
        @($fake.Calls | Where-Object Method -NE 'GET' | Where-Object Method -NE 'AD').Count | Should -Be 0
    }
    It 'snapshots the tenant default app management policy and each workload policy''s state' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings) -BaselinePath $script:Baseline
        $r.Snapshot.tenantAppManagementPolicy.isEnabled | Should -BeFalse
        @($r.Snapshot.conditionalAccess).Count | Should -Be 2
    }
    It 'fails PF-02 when the deployment identity holds a client secret' {
        $raw = Get-Raw $script:TestTenant
        $k = @($raw.graph.Keys | Where-Object { $_ -like "GET /v1.0/applications(appId=*" })[0]
        $app = $raw.graph[$k]; $app.passwordCredentials = @(@{ keyId = 'k' })
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ $k = $app }
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings) -BaselinePath $script:Baseline
        Get-Status $r.Results 'PF-02' | Should -Be 'Fail'
    }
    It 'fails PF-02 when the settings thumbprint is not on the deployment app' {
        $s = Get-Settings; $s.deployIdentity.certificateThumbprint = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings $s -BaselinePath $script:Baseline
        (@($r.Results | Where-Object Id -EQ 'PF-02').Actual) | Should -Match 'isn''t on the app'
    }
    It 'fails PF-03 without an enabled Workload ID Premium plan' {
        $raw = Get-Raw $script:TestTenant
        $skus = $raw.graph['GET /v1.0/subscribedSkus']; $skus.value = @($skus.value | Where-Object { $_.skuPartNumber -ne 'Workload_Identities_P2' })
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ 'GET /v1.0/subscribedSkus' = $skus }
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings) -BaselinePath $script:Baseline
        Get-Status $r.Results 'PF-03' | Should -Be 'Fail'
    }
    It 'fails PF-05 when the reader holds a ReadWrite application permission' {
        $raw = Get-Raw $script:TestTenant
        $k = @($raw.graph.Keys | Where-Object { $_ -like '*appRoleAssignments' })[0]
        $v = $raw.graph[$k]; $v.value += @{ resourceId = '5b000000-0000-4000-8000-00000000ff00'; appRoleId = 'a7000000-0000-4000-8000-000000000006' }
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ $k = $v }
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings) -BaselinePath $script:Baseline
        Get-Status $r.Results 'PF-05' | Should -Be 'Fail'
    }
    It 'fails PF-06 when an operator holds neither an eligible nor an active role' {
        $s = Get-Settings; $s.operators[0].roles = @('Cloud Application Administrator', 'Application Administrator')
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings $s -BaselinePath $script:Baseline
        @($r.Results | Where-Object { $_.Id -eq 'PF-06' -and $_.Status -eq 'Fail' }).Actual | Should -Match 'missing Application Administrator'
    }
    It 'fails PF-09 without a baseline, and on a baseline with an Error' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings)
        Get-Status $r.Results 'PF-09' | Should -Be 'Fail'
        $vk = @(Get-Content $script:Baseline -Raw | ConvertFrom-Json); $vk[0].Status = 'Error'
        $p = Save-Json $vk 'vk-error.json'
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings (Get-Settings) -BaselinePath $p
        Get-Status $r.Results 'PF-09' | Should -Be 'Fail'
    }
    It 'fails PF-10 when the gMSA test host is missing, and skips it with -SkipAd' {
        $s = Get-Settings; $s.ad.gmsaTestHost = 'NO-SUCH-HOST'
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings $s -BaselinePath $script:Baseline
        Get-Status $r.Results 'PF-10' | Should -Be 'Fail'
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings $s -BaselinePath $script:Baseline -SkipAd
        Get-Status $r.Results 'PF-10' | Should -Be 'NotRun'
    }
    It 'warns PF-08 when no workload policy is recorded yet' {
        $s = Get-Settings; $s.conditionalAccess.policies = @()
        $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings $s -BaselinePath $script:Baseline
        Get-Status $r.Results 'PF-08' | Should -Be 'Warn'
    }
    Context 'production' {
        BeforeAll {
            $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
            $client = New-Client 'deploy-smoke' $fake
            $smoke = Invoke-NpiDeploySmokeTest -Client $client -Settings (Get-Settings) -RegisterRun $script:Register -AsOf $script:AsOf
            $script:Evidence = Join-Path $script:Tmp 'test-smoke'
            $null = Export-NpiDeployRun -OutputPath $script:Evidence -Task deploy-smoke -Settings (Get-Settings) -Files @{ 'results.json' = @($smoke.Results) }
        }
        It 'fails PF-11 without the test stage''s evidence' {
            $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:ProdTenant)) -Settings (Get-Settings $script:ProdSettings 'production') -BaselinePath $script:Baseline
            Get-Status $r.Results 'PF-11' | Should -Be 'Fail'
        }
        It 'passes PF-11 with a clean test smoke test from another tenant' {
            $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:ProdTenant)) -Settings (Get-Settings $script:ProdSettings 'production') -BaselinePath $script:Baseline -PromotionEvidencePath $script:Evidence
            Get-Status $r.Results 'PF-11' | Should -Be 'Pass'
            @($r.Results | Where-Object Status -EQ 'Fail').Count | Should -Be 0
        }
        It 'fails PF-11 when the evidence is from the production tenant itself' {
            $s = Get-Settings $script:ProdSettings 'production'
            $m = Get-Content (Join-Path $script:Evidence 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
            $m.tenantId = $s.tenantId
            $copy = Join-Path $script:Tmp 'same-tenant'; Copy-Item -Recurse $script:Evidence $copy
            Write-NpiJson -Path (Join-Path $copy 'manifest.json') -Value $m
            $r = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' (New-NpiDeployFixtureInvoker -Path $script:ProdTenant)) -Settings $s -BaselinePath $script:Baseline -PromotionEvidencePath $copy
            Get-Status $r.Results 'PF-11' | Should -Be 'Fail'
        }
    }
}

Describe 'The smoke test' {
    It 'passes every check on the fixture test tenant' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' $fake) -Settings (Get-Settings) -RegisterRun $script:Register -AsOf $script:AsOf
        @($r.Results | Where-Object Status -NE 'Pass').Count | Should -Be 0
        @($r.Results).Count | Should -Be 8
    }
    It 'sends the probe only to the synthetic app, and asks for the report-only results' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $s = Get-Settings
        $null = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' $fake) -Settings $s -RegisterRun $script:Register -AsOf $script:AsOf
        $posts = @($fake.Calls | Where-Object Method -EQ 'POST')
        $posts.Count | Should -Be 1
        $posts[0].Uri | Should -Be "https://graph.microsoft.com/v1.0/applications/$($s.smoke.appObjectId)/addPassword"
        @($fake.Calls | Where-Object { $_.Uri -like '*/beta/auditLogs/signIns*' })[0].Headers.Prefer | Should -Be 'include-unknown-enum-members'
    }
    It 'fails ST-03 when the secret gets through, removes it at once, and never keeps its value' {
        $s = Get-Settings
        $k = "POST /v1.0/applications/$($s.smoke.appObjectId)/addPassword"
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ $k = @{ keyId = '4c000000-0000-4000-8000-0000000000aa'; secretText = 'fixture-not-a-secret-value'; hint = 'fix' } }
        $client = New-Client 'deploy-smoke' $fake
        $r = Invoke-NpiDeploySmokeTest -Client $client -Settings $s -RegisterRun $script:Register -AsOf $script:AsOf
        Get-Status $r.Results 'ST-03' | Should -Be 'Fail'
        $remove = @($fake.Calls | Where-Object { $_.Uri -like '*/removePassword' })
        $remove.Count | Should -Be 1
        $remove[0].Body.keyId | Should -Be '4c000000-0000-4000-8000-0000000000aa'
        ($r.Results | ConvertTo-Json -Depth 5) | Should -Not -Match 'fixture-not-a-secret-value'
        ($client.Evidence | ConvertTo-Json -Depth 5) | Should -Not -Match 'fixture-not-a-secret-value'
    }
    It 'fails ST-03 when the probe is refused for lack of permission, not by the policy' {
        $s = Get-Settings
        $k = "POST /v1.0/applications/$($s.smoke.appObjectId)/addPassword"
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ $k = @{ __status = 403; error = @{ code = 'Authorization_RequestDenied'; message = 'Insufficient privileges' } } }
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' $fake) -Settings $s -RegisterRun $script:Register -AsOf $script:AsOf
        Get-Status $r.Results 'ST-03' | Should -Be 'Fail'
    }
    It 'fails ST-04 on a subject that differs only in case' {
        $s = Get-Settings
        $s.smoke.federatedSubject = $s.smoke.federatedSubject.ToUpperInvariant()
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings $s -RegisterRun $script:Register -AsOf $script:AsOf
        Get-Status $r.Results 'ST-04' | Should -Be 'Fail'
    }
    It 'fails ST-05 when the stage expects the policies on and they are report-only' {
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings (Get-Settings) -RegisterRun $script:Register -AsOf $script:AsOf -ExpectCaState Enabled
        @(Get-Status $r.Results 'ST-05') | Should -Be @('Fail', 'Fail')
        Get-Status $r.Results 'ST-06' | Should -Be 'Fail'
    }
    It 'passes an enforced production wave with -ExpectCaState Enabled -Wave Ring1' {
        $s = Get-Settings $script:ProdSettings 'production'
        $raw = Get-Raw $script:ProdTenant
        $over = @{}
        foreach ($p in $s.conditionalAccess.policies) { $k = "GET /v1.0/identity/conditionalAccess/policies/$($p.id)"; $v = $raw.graph[$k]; $v.state = 'enabled'; $over[$k] = $v }
        $si = $raw.graph['GET /beta/auditLogs/signIns']
        foreach ($x in $si.value) { foreach ($a in $x.appliedConditionalAccessPolicies) { $a.result = $a.result -replace '^reportOnlyFailure$', 'failure' -replace '^reportOnlyNotApplied$', 'notApplied' } }
        $over['GET /beta/auditLogs/signIns'] = $si
        $fake = New-NpiDeployFixtureInvoker -Path $script:ProdTenant -Override $over
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' $fake) -Settings $s -RegisterRun (Join-Path $script:Fx 'register-run-production') -AsOf $script:AsOf.AddDays(14) -ExpectCaState Enabled -Wave Ring1
        @($r.Results | Where-Object Status -NE 'Pass').Count | Should -Be 0
    }
    It 'fails ST-05 for a wave with no policy recorded' {
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings (Get-Settings) -RegisterRun $script:Register -AsOf $script:AsOf -Wave Ring2
        Get-Status $r.Results 'ST-05' | Should -Be 'Fail'
    }
    It 'warns ST-06 when the synthetic has no sign-ins in the window' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ 'GET /beta/auditLogs/signIns' = @{ value = @() } }
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' $fake) -Settings (Get-Settings) -RegisterRun $script:Register -AsOf $script:AsOf
        Get-Status $r.Results 'ST-06' | Should -Be 'Warn'
    }
    It 'refuses a register run from another tenant' {
        { Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' (New-NpiDeployFixtureInvoker -Path $script:ProdTenant)) -Settings (Get-Settings $script:ProdSettings 'production') -RegisterRun $script:Register -AsOf $script:AsOf } | Should -Throw '*register run is for tenant*'
    }
    It 'leaves ST-07 not run with -SkipAd' {
        $r = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings (Get-Settings) -RegisterRun $script:Register -AsOf $script:AsOf -SkipAd
        Get-Status $r.Results 'ST-07' | Should -Be 'NotRun'
    }
}

Describe 'The rollback' {
    BeforeAll {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $pre = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings (Get-Settings) -BaselinePath $script:Baseline
        $script:Snapshot = Save-Json $pre.Snapshot 'snapshot.json'
        $script:Plan = Save-Json (New-NpiDeployRollbackPlan -Settings (Get-Settings) -SnapshotPath $script:Snapshot -To Disabled -IncludeSmokeCleanup -AsOf $script:AsOf) 'rollback-plan.json'
        $script:Sha = Get-NpiFileHash -Path $script:Plan
        $s = Get-Settings
        $script:TenantId = $s.tenantId
    }
    It 'plans the workload policies off, the app policies restored and off, the legacy account on, and the synthetic disabled' {
        $p = Get-Content $script:Plan -Raw | ConvertFrom-Json
        @($p.actions.kind) | Should -Be @('ConditionalAccessState', 'ConditionalAccessState', 'TenantAppPolicyRestore', 'AppPolicyOff', 'AdEnable', 'SpDisable', 'AdDisable')
        $p.actions[0].body.state | Should -Be 'disabled'
    }
    It 'plans only report-only for one production wave' {
        $p = New-NpiDeployRollbackPlan -Settings (Get-Settings) -SnapshotPath $script:Snapshot -To ReportOnly -Wave Ring1 -AsOf $script:AsOf
        @($p.actions.kind | Sort-Object -Unique) | Should -Be @('ConditionalAccessState')
        $p.actions[0].body.state | Should -Be 'enabledForReportingButNotEnforced'
    }
    It 'refuses a plan whose SHA-256 nobody approved, sending nothing' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        { Invoke-NpiDeployRollbackPlan -Client (New-Client 'deploy-rollback' $fake) -PlanPath $script:Plan -ApprovedSha256 ('0' * 64) -TenantId $script:TenantId -AsOf $script:AsOf -Apply } | Should -Throw '*not the approved*'
        $fake.Calls.Count | Should -Be 0
    }
    It 'refuses a plan for another tenant, or older than seven days' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        { Invoke-NpiDeployRollbackPlan -Client (New-Client 'deploy-rollback' $fake) -PlanPath $script:Plan -ApprovedSha256 $script:Sha -TenantId 'c0ffee00-0000-4000-8000-0000000000f1' -AsOf $script:AsOf } | Should -Throw '*for tenant*'
        { Invoke-NpiDeployRollbackPlan -Client (New-Client 'deploy-rollback' $fake) -PlanPath $script:Plan -ApprovedSha256 $script:Sha -TenantId $script:TenantId -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
    }
    It 'dry-runs without a write' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployRollbackPlan -Client (New-Client 'deploy-rollback' $fake) -PlanPath $script:Plan -ApprovedSha256 $script:Sha -TenantId $script:TenantId -AsOf $script:AsOf
        @($r.Results.Status | Sort-Object -Unique) | Should -Be @('WouldApply')
        @($fake.Calls | Where-Object { $_.Method -ne 'GET' }).Count | Should -Be 0
    }
    It 'applies with PATCH, Enable-ADAccount and Disable-ADAccount only' {
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
        $r = Invoke-NpiDeployRollbackPlan -Client (New-Client 'deploy-rollback' $fake) -PlanPath $script:Plan -ApprovedSha256 $script:Sha -TenantId $script:TenantId -AsOf $script:AsOf -Apply
        @($r.Results.Status | Sort-Object -Unique) | Should -Be @('Applied')
        @($fake.Calls | Where-Object Method -EQ 'PATCH').Count | Should -Be 5
        @($fake.Calls | Where-Object Method -EQ 'AD' | ForEach-Object { ($_.Uri -split ' ')[0] }) | Should -Be @('Enable-ADAccount', 'Disable-ADAccount')
        @($fake.Calls | Where-Object { $_.Method -in 'DELETE', 'POST' }).Count | Should -Be 0
        $restore = @($fake.Calls | Where-Object { $_.Uri -like '*/policies/defaultAppManagementPolicy' -and $_.Method -eq 'PATCH' })[0]
        $restore.Body.isEnabled | Should -BeFalse
    }
    It 'skips a policy already in the target state' {
        $raw = Get-Raw $script:TestTenant
        $s = Get-Settings
        $k = "GET /v1.0/identity/conditionalAccess/policies/$($s.conditionalAccess.policies[0].id)"
        $pol = $raw.graph[$k]; $pol.state = 'disabled'
        $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant -Override @{ $k = $pol }
        $r = Invoke-NpiDeployRollbackPlan -Client (New-Client 'deploy-rollback' $fake) -PlanPath $script:Plan -ApprovedSha256 $script:Sha -TenantId $script:TenantId -AsOf $script:AsOf -Apply
        $r.Results[0].Status | Should -Be 'AlreadyDone'
    }
    It 'refuses a snapshot from another tenant' {
        { New-NpiDeployRollbackPlan -Settings (Get-Settings $script:ProdSettings 'production') -SnapshotPath $script:Snapshot -To ReportOnly -AsOf $script:AsOf } | Should -Throw '*snapshot is for tenant*'
    }
}

Describe 'The live invoker' {
    BeforeAll { if (-not (Get-Command Get-MgContext -ErrorAction SilentlyContinue)) { function global:Get-MgContext { } } }
    It 'refuses a write task signed in app-only' {
        Mock -ModuleName NpiDeploy Get-MgContext { [pscustomobject]@{ Environment = 'Global'; TenantId = 'c0ffee00-0000-4000-8000-0000000000e1'; AuthType = 'AppOnly' } }
        { New-NpiDeployLiveInvoker -Cloud gcc -TenantId 'c0ffee00-0000-4000-8000-0000000000e1' -Task deploy-smoke } | Should -Throw '*only as a person, delegated*'
        { New-NpiDeployLiveInvoker -Cloud gcc -TenantId 'c0ffee00-0000-4000-8000-0000000000e1' -Task deploy-preflight } | Should -Not -Throw
    }
    It 'refuses a session in another tenant or cloud' {
        Mock -ModuleName NpiDeploy Get-MgContext { [pscustomobject]@{ Environment = 'USGov'; TenantId = 'c0ffee00-0000-4000-8000-0000000000e1'; AuthType = 'Delegated' } }
        { New-NpiDeployLiveInvoker -Cloud gcc -TenantId 'c0ffee00-0000-4000-8000-0000000000e1' -Task deploy-preflight } | Should -Throw "*'USGov'*"
        Mock -ModuleName NpiDeploy Get-MgContext { [pscustomobject]@{ Environment = 'Global'; TenantId = 'c0ffee00-0000-4000-8000-0000000000f1'; AuthType = 'Delegated' } }
        { New-NpiDeployLiveInvoker -Cloud gcc -TenantId 'c0ffee00-0000-4000-8000-0000000000e1' -Task deploy-preflight } | Should -Throw '*not ''c0ffee00-0000-4000-8000-0000000000e1''*'
    }
}

Describe 'The scripts, in fixture mode' {
    It 'run preflight, smoke test and rollback end to end, and exit 0' {
        # A script that succeeds without calling exit leaves $LASTEXITCODE as it was, so clear what an
        # earlier command in the same session (a lab step that exits 1, say) left behind.
        $global:LASTEXITCODE = 0
        $out = Join-Path $script:Tmp 'scripts'
        Push-Location $script:Root
        try {
            $null = & ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath $script:TestSettings -Stage test -BaselinePath $script:Baseline -FixturePath $script:TestTenant -OutputPath "$out/preflight"
            $LASTEXITCODE | Should -BeIn @(0, $null)
            $null = & ./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath $script:TestSettings -Stage test -RegisterRun $script:Register -FixturePath $script:TestTenant -OutputPath "$out/smoke"
            $null = & ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath $script:TestSettings -Stage test -SnapshotPath "$out/preflight/snapshot.json" -To Disabled -FixturePath $script:TestTenant -OutputPath "$out/rollback"
            $sha = Get-NpiFileHash -Path "$out/rollback/rollback-plan.json"
            $lines = & ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath $script:TestSettings -Stage test -PlanPath "$out/rollback/rollback-plan.json" -ApprovedSha256 $sha -FixturePath $script:TestTenant -OutputPath "$out/rollback-dry"
            ($lines -join "`n") | Should -Match 'Rollback DryRun \(Fixture, test\): 5 WouldApply'
            $m = Get-Content "$out/smoke/manifest.json" -Raw | ConvertFrom-Json
            $m.mode | Should -Be 'Fixture'; $m.environment | Should -Be 'test'; $m.settingsSha256 | Should -Be (Get-NpiFileHash -Path $script:TestSettings)
            (Get-NpiFileHash -Path "$out/smoke/results.json") | Should -Be $m.files.'results.json'
        } finally { Pop-Location }
    }
}

Describe 'Requirements and evidence records' {
    BeforeAll {
        $script:Cat = Get-NpiDeployRequirements
        # The KSI IDs Books 02, 04, 13 and 14 cite, checked on fedramp.gov on November 2, 2026.
        $script:KnownKsis = @('KSI-CED-RAT', 'KSI-CMT-LMC', 'KSI-CMT-RMV', 'KSI-CMT-VTD', 'KSI-IAM-AAM', 'KSI-IAM-APM', 'KSI-IAM-ELP', 'KSI-IAM-JIT', 'KSI-IAM-SNU',
            'KSI-INR-RIR', 'KSI-MLA-EVC', 'KSI-MLA-LET', 'KSI-MLA-OSM', 'KSI-PIY-GIV', 'KSI-RPL-ABO', 'KSI-SVC-ACM')
        function New-RunFolder([string]$Name, [hashtable]$S) {
            $p = Join-Path $script:Tmp "runs-$Name"
            $null = Export-NpiDeployRun -OutputPath $p -Task deploy-preflight -Settings $S -Files @{ 'results.json' = @(@{ id = $Name }) }
            $p
        }
        function New-FullEvidence([string]$Name) {
            $ev = Join-Path $script:Tmp "evidence-$Name"
            $s = Get-Settings
            $fake = New-NpiDeployFixtureInvoker -Path $script:TestTenant
            $pre = Invoke-NpiDeployPreflight -Client (New-Client 'deploy-preflight' $fake) -Settings $s -BaselinePath $script:Baseline
            $null = Write-NpiDeployEvidence -EvidencePath $ev -Step PRE -Settings $s -Mode Fixture -Command 'preflight' -Results $pre.Results -RunPaths (New-RunFolder "$Name-pre" $s)
            $null = Write-NpiDeployEvidence -EvidencePath $ev -Step S0 -Settings $s -Mode Fixture -Command 'preflight' -RunPaths (New-RunFolder "$Name-s0" $s)
            foreach ($st in 'S1.1', 'S1.2', 'S1.3', 'S1.5') { $null = Write-NpiDeployEvidence -EvidencePath $ev -Step $st -Settings $s -Mode Fixture -Command $st -RunPaths (New-RunFolder "$Name-$st" $s) }
            $smoke = Invoke-NpiDeploySmokeTest -Client (New-Client 'deploy-smoke' (New-NpiDeployFixtureInvoker -Path $script:TestTenant)) -Settings $s -RegisterRun $script:Register -AsOf $script:AsOf
            $null = Write-NpiDeployEvidence -EvidencePath $ev -Step SMOKE -Settings $s -Mode Fixture -Command 'smoke' -Results $smoke.Results
            $null = Write-NpiDeployEvidence -EvidencePath $ev -Step ROLLBACK -Settings $s -Mode Fixture -Command 'rollback' -Results @([pscustomobject]@{ ActionId = 'RB-01'; Status = 'Applied'; Detail = 'x' })
            $ev
        }
    }
    It 'maps every preflight, smoke and rollback check, and names only KSIs the repository already cites' {
        foreach ($id in @(1..11 | ForEach-Object { 'PF-{0:00}' -f $_ }) + @(1..7 | ForEach-Object { 'ST-{0:00}' -f $_ }) + 'RB') { $script:Cat.checks.ContainsKey($id) | Should -BeTrue -Because $id }
        $all = @($script:Cat.checks.Values | ForEach-Object { $_.ksis }) + @($script:Cat.steps.Values | ForEach-Object { $_.ksis })
        foreach ($k in ($all | Sort-Object -Unique)) { $k | Should -BeIn $script:KnownKsis }
        foreach ($stage in 'test', 'production') { foreach ($st in $script:Cat.stages[$stage]) { $script:Cat.steps.ContainsKey($st) | Should -BeTrue -Because $st } }
    }
    It 'records a step with its timestamp, environment, command, result, controls and KSIs, and hashes the folder' {
        $ev = Join-Path $script:Tmp 'evidence-one'
        $s = Get-Settings
        $f = Write-NpiDeployEvidence -EvidencePath $ev -Step S1.1 -Settings $s -Mode Fixture -Command './Invoke-NpiInventory.ps1 ...' -RunPaths (New-RunFolder 'one' $s)
        $rec = Get-Content $f.FullName -Raw | ConvertFrom-Json
        $rec.result | Should -Be 'Pass'
        $rec.environment | Should -Be 'test'; $rec.tenantId | Should -Be $s.tenantId; $rec.command | Should -Be './Invoke-NpiInventory.ps1 ...'
        [datetime]::Parse($rec.recordedAt) | Should -BeOfType [datetime]
        @($rec.controls) | Should -Contain 'CM-8'; @($rec.ksis) | Should -Contain 'KSI-PIY-GIV'; @($rec.other) | Should -Contain 'OMB M-22-09 §III.A'
        $sums = Get-Content (Join-Path $ev 'SHA256SUMS')
        ($sums | Where-Object { $_ -like '*  S1.1-inventory-and-owners.json' }) | Should -Match ('^' + (Get-NpiFileHash -Path $f.FullName))
        ($sums | Where-Object { $_ -like '*runs/S1.1/runs-one/manifest.json' }).Count | Should -Be 1
    }
    It 'fails a step whose run folder no longer matches its manifest, or is for another tenant' {
        $s = Get-Settings
        $p = New-RunFolder 'tamper' $s
        Add-Content (Join-Path $p 'results.json') ' '
        $f = Write-NpiDeployEvidence -EvidencePath (Join-Path $script:Tmp 'evidence-tamper') -Step S1.1 -Settings $s -RunPaths $p
        (Get-Content $f.FullName -Raw | ConvertFrom-Json).result | Should -Be 'Fail'
        $p2 = New-RunFolder 'prod' (Get-Settings $script:ProdSettings 'production')
        $f = Write-NpiDeployEvidence -EvidencePath (Join-Path $script:Tmp 'evidence-prodrun') -Step S1.1 -Settings $s -RunPaths $p2
        (Get-Content $f.FullName -Raw | ConvertFrom-Json).runs[0].detail | Should -Match 'is for tenant'
    }
    It 'gives the preflight''s and smoke test''s records each check''s controls and KSIs' {
        $ev = New-FullEvidence 'checks'
        $pre = Get-Content (Join-Path $ev 'PRE-preflight.json') -Raw | ConvertFrom-Json
        ($pre.checks | Where-Object id -EQ 'PF-06')[0].ksis | Should -Contain 'KSI-IAM-JIT'
        $pre.result | Should -Be 'Warn'
        $sm = Get-Content (Join-Path $ev 'SMOKE-smoke-test.json') -Raw | ConvertFrom-Json
        ($sm.checks | Where-Object id -EQ 'ST-03')[0].other | Should -Contain 'SCuBA MS.AAD.5.5v1 (SHOULD)'
    }
    It 'passes the go/no-go evidence check when every test-stage row is present and every hash matches' {
        $ev = New-FullEvidence 'full'
        $rows = Test-NpiDeployEvidence -EvidencePath $ev -Settings (Get-Settings) -Stage test
        @($rows | Where-Object Status -NE 'Present').Count | Should -Be 0
        @($rows.Step) | Should -Contain 'EVIDENCE'
    }
    It 'fails the go/no-go evidence check on a missing row, a dry-run rollback, a changed file or the wrong environment' {
        $ev = New-FullEvidence 'gaps'
        Remove-Item (Join-Path $ev 'S1.3-*.json')
        $null = Write-NpiDeployEvidence -EvidencePath $ev -Step ROLLBACK -Settings (Get-Settings) -Results @([pscustomobject]@{ ActionId = 'RB-01'; Status = 'WouldApply'; Detail = 'x' })
        $rows = Test-NpiDeployEvidence -EvidencePath $ev -Settings (Get-Settings) -Stage test
        ($rows | Where-Object Step -EQ 'S1.3').Status | Should -Be 'Missing'
        ($rows | Where-Object Step -EQ 'ROLLBACK').Result | Should -Be 'DryRun'
        ($rows | Where-Object Step -EQ 'ROLLBACK').Status | Should -Be 'Failing'
        Add-Content (Join-Path $ev 'S0-change-record-approvals-and-settings-file.json') ' '
        ($rows = Test-NpiDeployEvidence -EvidencePath $ev -Settings (Get-Settings) -Stage test) | Out-Null
        ($rows | Where-Object Step -EQ 'EVIDENCE').Detail | Should -Match 'S0-change-record-approvals-and-settings-file.json changed'
        $rows = Test-NpiDeployEvidence -EvidencePath $ev -Settings (Get-Settings $script:ProdSettings 'production') -Stage production
        ($rows | Where-Object Step -EQ 'PRE').Status | Should -Be 'WrongEnvironment'
    }
    It 'has the scripts write their records next to their output, and the evidence script exit 1 on gaps' {
        $out = Join-Path $script:Tmp 'scripts-ev'
        Push-Location $script:Root
        try {
            $null = & ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath $script:TestSettings -Stage test -BaselinePath $script:Baseline -FixturePath $script:TestTenant -OutputPath "$out/preflight"
            $null = & ./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath $script:TestSettings -Stage test -RegisterRun $script:Register -FixturePath $script:TestTenant -OutputPath "$out/smoke"
            @(Get-ChildItem "$out/evidence" -Filter *.json).Name | Should -Be @('PRE-preflight.json', 'S0-change-record-approvals-and-settings-file.json', 'SMOKE-smoke-test.json')
            (Get-Content "$out/evidence/SMOKE-smoke-test.json" -Raw | ConvertFrom-Json).command | Should -Match 'Invoke-NpiDeploySmokeTest\.ps1'
            $lines = & ./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath $script:TestSettings -Stage test -EvidencePath "$out/evidence"
            $LASTEXITCODE | Should -Be 1
            ($lines -join "`n") | Should -Match 'Result: NO-GO on evidence'
            $lines = & ./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath $script:TestSettings -Stage test -Step S1.1 -RunPath "$out/preflight" -EvidencePath "$out/evidence" -Command 'x'
            ($lines -join "`n") | Should -Match 'S1.1-inventory-and-owners.json \(Pass\)'
        } finally { Pop-Location }
    }
}