#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
# Chapter 09: the deployment runbook's own scripts. Fixtures and a fake only; nothing signs in.

BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    Import-Module (Join-Path $script:Kit 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
    Import-Module (Join-Path $script:Kit 'deploy/PaDeploy.psm1') -Force
    $script:SettingsPath = Join-Path $script:Fx 'environment.test.json'

    function Get-TestSettings {
        param([string]$Root = (Join-Path $TestDrive 'deploy'))
        $s = Read-PaDeploySettings -Path $script:SettingsPath
        $s.outputRoot = $Root
        $s
    }
    function New-TestTenant {
        param([scriptblock]$Edit, [string]$From = 'tenant-ready.json')
        $t = Get-Content -LiteralPath (Join-Path $script:Fx $From) -Raw | ConvertFrom-Json -AsHashtable -Depth 50
        & $Edit $t
        $p = Join-Path $TestDrive ("tenant-{0}.json" -f [guid]::NewGuid())
        $t | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $p
        $p
    }
    function Invoke-TestPreflight {
        param([hashtable]$Settings, [string]$TenantPath)
        $inputs = Join-Path $Settings.outputRoot 'inputs'
        if (-not (Test-Path -LiteralPath $inputs)) { $null = New-PaDeployInputs -Settings $Settings -OutputPath $inputs }
        $fake = New-PaDeployFixtureInvoker -Path $TenantPath
        @(Test-PaDeployPreflight -Settings $Settings -InputsPath $inputs -Invoke $fake.Invoke -AsOf ([datetime]'2026-11-02'))
    }
}

Describe 'Chapter 09: calls and permissions' {
    It 'declares only GET calls, each with a permission and a Learn page' {
        $calls = Get-PaDeployCall
        @($calls).Count | Should -Be 6
        foreach ($c in $calls) {
            $c.method | Should -Be 'GET'
            @($c.permissions).Count | Should -BeGreaterThan 0
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
        }
    }
    It 'asks the pre-flight for the license read plus Chapter 02''s check, and nothing that writes' {
        $p = (Get-PaDeployRequiredPermission -Task preflight).GraphPermissions
        $p | Should -Contain 'LicenseAssignment.Read.All'
        foreach ($x in (Get-PaRequiredPermission -Task emergency-access).GraphPermissions) { $p | Should -Contain $x }
        ($p | Where-Object { $_ -match 'ReadWrite' }) | Should -BeNullOrEmpty
    }
    It 'asks the smoke test for read permissions only' {
        (Get-PaDeployRequiredPermission -Task smoke).GraphPermissions -join ',' | Should -Be 'AccessReview.Read.All,AuditLog.Read.All,RoleAssignmentSchedule.Read.Directory'
    }
}

Describe 'Chapter 09: the settings file' {
    It 'reports every placeholder in the template, and no secret' {
        $s = Read-PaDeploySettings -Path (Join-Path $script:Kit 'deploy/environment.template.json')
        $f = @(Test-PaDeploySettings -Settings $s)
        @($f | Where-Object Rule -EQ 'PA-DEP-02').Count | Should -BeGreaterThan 30
        @($f | Where-Object Rule -EQ 'PA-DEP-01') | Should -BeNullOrEmpty
    }
    It 'passes the filled fixture' {
        @(Test-PaDeploySettings -Settings (Get-TestSettings)) | Should -BeNullOrEmpty
    }
    It 'refuses a key that would hold a secret' {
        $s = Get-TestSettings; $s.identity['clientSecret'] = 'x'
        (Test-PaDeploySettings -Settings $s).Rule | Should -Contain 'PA-DEP-01'
    }
    It 'refuses key material in a value' {
        $s = Get-TestSettings; $s.monitoring.location = '-----BEGIN PRIVATE KEY-----'
        (Test-PaDeploySettings -Settings $s).Rule | Should -Contain 'PA-DEP-01'
    }
    It 'refuses an identity without a certificate or federated credential' {
        $s = Get-TestSettings; $s.identity.credential = 'secret'
        (Test-PaDeploySettings -Settings $s | Where-Object Object -EQ '$.identity.credential').Rule | Should -Be 'PA-DEP-01'
        $s = Get-TestSettings; $s.identity.certificateThumbprint = 'not-a-thumbprint'
        (Test-PaDeploySettings -Settings $s).Rule | Should -Contain 'PA-DEP-01'
    }
    It 'accepts a federated credential with no thumbprint' {
        $s = Get-TestSettings; $s.identity.credential = 'federated'; $s.identity.Remove('certificateThumbprint')
        @(Test-PaDeploySettings -Settings $s) | Should -BeNullOrEmpty
    }
    It 'needs a change record for production' {
        $s = Get-TestSettings; $s.environment = 'production'; $s.changeRecord = ''
        (Test-PaDeploySettings -Settings $s).Rule | Should -Contain 'PA-DEP-08'
    }
    It 'throws for an unknown cloud and for a missing section' {
        $p = Join-Path $TestDrive 'bad.json'
        (Get-Content $script:SettingsPath -Raw) -replace '"cloud": "gcc"', '"cloud": "GCC"' | Set-Content $p
        { Read-PaDeploySettings -Path $p } | Should -Throw '*Unknown cloud*'
        $j = Get-Content $script:SettingsPath -Raw | ConvertFrom-Json -AsHashtable; $j.Remove('smokeTest'); $j | ConvertTo-Json -Depth 30 | Set-Content $p
        { Read-PaDeploySettings -Path $p } | Should -Throw "*'smokeTest' is required*"
    }
}

Describe 'Chapter 09: the input files' {
    BeforeAll {
        $script:S = Get-TestSettings -Root (Join-Path $TestDrive 'inputs-run')
        $script:Out = Join-Path $script:S.outputRoot 'inputs'
        $script:R = New-PaDeployInputs -Settings $script:S -OutputPath $script:Out
    }
    It 'writes each chapter''s input file' {
        foreach ($f in 'emergency-access.json', 'emergency-validations.csv', 'exceptions.csv', 'ca-map.json', 'ca-policies/ca-config.json', 'pim-roles/teams-administrator.json', 'pim-bindings.json', 'confirmed-activations.csv', 'prv-groups.json', 'azure-desired.json', 'access-reviews.json', 'manifest.json') {
            Join-Path $script:Out $f | Should -Exist
        }
    }
    It 'records the SHA-256 of every file it wrote' {
        $m = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
        foreach ($k in $m.files.Keys) { (Get-FileHash (Join-Path $script:Out $k) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $m.files[$k] }
        $m.environment | Should -Be 'test'
    }
    It 'gives the earlier chapters files their own readers accept' {
        try {
            Import-Module (Join-Path $script:Kit 'powershell/PaAzurePim/PaAzurePim.psm1') -Force
            Import-Module (Join-Path $script:Kit 'powershell/PaAccessReviews/PaAccessReviews.psm1') -Force
            (Read-PaAzDesiredState -Path (Join-Path $script:Out 'azure-desired.json')).cloud | Should -Be 'gcc'
            @((Read-PaArConfig -Path (Join-Path $script:Out 'access-reviews.json')).reviews).Count | Should -Be 1
        } finally {
            Remove-Module PaAzurePim, PaAccessReviews -ErrorAction SilentlyContinue
            Import-Module (Join-Path $script:Kit 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
            Import-Module (Join-Path $script:Kit 'deploy/PaDeploy.psm1') -Force
        }
        (Read-PaEmergencyConfig -Path (Join-Path $script:Out 'emergency-access.json')).accounts.Count | Should -Be 2
        (Import-Csv (Join-Path $script:Out 'exceptions.csv')).Count | Should -Be 2
    }
    It 'takes every role file for production''s "*"' {
        $s = Get-TestSettings -Root (Join-Path $TestDrive 'prod'); $s.pimRoles.roleFiles = @('*')
        (New-PaDeployInputs -Settings $s -OutputPath (Join-Path $s.outputRoot 'inputs')).RoleFiles | Should -Be 22
    }
    It 'refuses the unfilled template and a role file that does not exist' {
        $t = Read-PaDeploySettings -Path (Join-Path $script:Kit 'deploy/environment.template.json')
        { New-PaDeployInputs -Settings $t -OutputPath (Join-Path $TestDrive 'tpl') } | Should -Throw '*PA-DEP-02*'
        $s = Get-TestSettings; $s.pimRoles.roleFiles = @('no-such-role.json')
        { New-PaDeployInputs -Settings $s -OutputPath (Join-Path $TestDrive 'x') } | Should -Throw '*no-such-role.json*'
    }
}

Describe 'Chapter 09: pre-flight' {
    It 'blocks on a disabled policy that Chapter 02 lets through' {
        $s = Get-TestSettings -Root (Join-Path $TestDrive 'pf1')
        $f = Invoke-TestPreflight -Settings $s -TenantPath (Join-Path $script:Fx 'tenant.json')
        @($f | Where-Object Severity -EQ 'Finding').Rule | Should -Be 'PA-DEP-05'
        ($f | Where-Object Severity -EQ 'Finding').Object | Should -Be 'CA099-Pilot-Block-Unknown-Platforms'
    }
    It 'passes the ready tenant and names the license' {
        $s = Get-TestSettings -Root (Join-Path $TestDrive 'pf2')
        $f = Invoke-TestPreflight -Settings $s -TenantPath (Join-Path $script:Fx 'tenant-ready.json')
        @($f | Where-Object Severity -EQ 'Finding') | Should -BeNullOrEmpty
        ($f | Where-Object Rule -EQ 'PA-DEP-03').Issue | Should -Match 'AAD_PREMIUM_P2'
    }
    It 'blocks a report-only policy without the exclusion (Chapter 02 reports it as Info)' {
        $p = New-TestTenant { param($t) $t.conditionalAccessPolicies[1].conditions.users.excludeGroups = @() }
        $f = Invoke-TestPreflight -Settings (Get-TestSettings -Root (Join-Path $TestDrive 'pf3')) -TenantPath $p
        ($f | Where-Object Rule -EQ 'PA-DEP-05').Object | Should -Be 'CA090-AllUsers-ReportOnly-CoverageProbe'
    }
    It 'blocks when no subscription licenses PIM, or the license is suspended' {
        $p = New-TestTenant { param($t) $t.subscribedSkus[0].servicePlans = @($t.subscribedSkus[0].servicePlans[0]) }
        (Invoke-TestPreflight -Settings (Get-TestSettings -Root (Join-Path $TestDrive 'pf4')) -TenantPath $p | Where-Object Severity -EQ 'Finding').Rule | Should -Be 'PA-DEP-03'
        $p = New-TestTenant { param($t) $t.subscribedSkus[0].capabilityStatus = 'Suspended' }
        (Invoke-TestPreflight -Settings (Get-TestSettings -Root (Join-Path $TestDrive 'pf4b')) -TenantPath $p | Where-Object Severity -EQ 'Finding').Rule | Should -Be 'PA-DEP-03'
    }
    It 'carries every Chapter 02 Finding, as PA-DEP-04' {
        $p = New-TestTenant { param($t) $t.authMethods['0e000000-0000-4000-8000-000000000002'] += @{ '@odata.type' = '#microsoft.graph.phoneAuthenticationMethod'; id = 'p1' } }
        $f = Invoke-TestPreflight -Settings (Get-TestSettings -Root (Join-Path $TestDrive 'pf5')) -TenantPath $p
        ($f | Where-Object Rule -EQ 'PA-DEP-04').Issue | Should -Match '^PA-EA-06'
    }
    It 'blocks an emergency account outside the exclusion group in every policy' {
        $p = New-TestTenant { param($t) $t.groupMembers['9e000000-0000-4000-8000-000000000001'] = @($t.groupMembers['9e000000-0000-4000-8000-000000000001'][0]) }
        $f = Invoke-TestPreflight -Settings (Get-TestSettings -Root (Join-Path $TestDrive 'pf6')) -TenantPath $p
        @($f | Where-Object Rule -EQ 'PA-DEP-05').Count | Should -Be 3
        ($f | Where-Object Rule -EQ 'PA-DEP-04').Issue | Should -Contain 'PA-EA-07: Not a member of the emergency access exclusion group'
    }
    It 'blocks a policy file the stage would deploy without the exclusion' {
        $s = Get-TestSettings -Root (Join-Path $TestDrive 'pf7')
        $inputs = Join-Path $s.outputRoot 'inputs'; $null = New-PaDeployInputs -Settings $s -OutputPath $inputs
        $pf = Join-Path $inputs 'ca-policies/policies/PIM-Activation-c1.json'
        (Get-Content $pf -Raw) -replace '"excludeGroups": \["\{group:CA-Exclude-EmergencyAccess\}"\]', '"excludeGroups": []' | Set-Content $pf
        ($f = Invoke-TestPreflight -Settings $s -TenantPath (Join-Path $script:Fx 'tenant-ready.json')) | Out-Null
        ($f | Where-Object Rule -EQ 'PA-DEP-06').Object | Should -Be 'PIM-Activation-c1.json'
    }
    It 'blocks a synthetic administrator who is an emergency account' {
        $s = Get-TestSettings -Root (Join-Path $TestDrive 'pf8'); $s.smokeTest.syntheticAdmin.id = '0e000000-0000-4000-8000-000000000001'
        (Invoke-TestPreflight -Settings $s -TenantPath (Join-Path $script:Fx 'tenant-ready.json')).Rule | Should -Contain 'PA-DEP-09'
    }
    It 'sends only GETs, and only declared calls' {
        $s = Get-TestSettings -Root (Join-Path $TestDrive 'pf9')
        $inputs = Join-Path $s.outputRoot 'inputs'; $null = New-PaDeployInputs -Settings $s -OutputPath $inputs
        $fake = New-PaDeployFixtureInvoker -Path (Join-Path $script:Fx 'tenant-ready.json')
        $null = Test-PaDeployPreflight -Settings $s -InputsPath $inputs -Invoke $fake.Invoke -AsOf ([datetime]'2026-11-02')
        @($fake.Calls | Where-Object Method -NE 'GET') | Should -BeNullOrEmpty
        @($fake.Calls | Where-Object { $_.Uri -like '*subscribedSkus*' }).Count | Should -Be 1
    }
    It 'exits 1 from the entry script when blocked, and writes a manifest with the settings hash' {
        $root = Join-Path $TestDrive 'pf10'
        $p = Join-Path $TestDrive 'env-pf10.json'
        $j = Get-Content $script:SettingsPath -Raw | ConvertFrom-Json -AsHashtable; $j.outputRoot = $root; $j | ConvertTo-Json -Depth 30 | Set-Content $p
        Push-Location $script:Kit
        try {
            $null = & ./deploy/New-PaDeployInputs.ps1 -SettingsPath $p
            $out = & ./deploy/Test-PaPreflight.ps1 -SettingsPath $p -FixturePath (Join-Path $script:Fx 'tenant.json') -AsOf 2026-11-02
            $LASTEXITCODE | Should -Be 1
            ($out -join "`n") | Should -Match 'BLOCKED'
            $m = Get-Content (Join-Path $root 'preflight/manifest.json') -Raw | ConvertFrom-Json
            $m.settingsSha256 | Should -Be (Get-FileHash $p -Algorithm SHA256).Hash.ToLowerInvariant()
            $m.mode | Should -Be 'Fixture'
        } finally { Pop-Location }
    }
}

Describe 'Chapter 09: smoke test' {
    BeforeAll {
        $script:SS = Get-TestSettings
        function Get-Smoke { param([string]$Phase, [string]$Fixture, [datetime]$AsOf, [datetime]$Since = '2026-11-02T14:00:00Z')
            $r = New-PaDeployReader -Cloud gcc -Task smoke -Invoke (New-PaDeployFixtureInvoker -Path $Fixture).Invoke
            @(Get-PaSmokeResult -Settings $script:SS -Phase $Phase -Reader $r -Since $Since -AsOf $AsOf)
        }
    }
    It 'passes each phase on its own fixture' {
        (Get-Smoke Activate (Join-Path $script:Fx 'smoke-activate.json') '2026-11-02T14:06:00Z').Pass | Should -Not -Contain $false
        (Get-Smoke Approve (Join-Path $script:Fx 'smoke-approve.json') '2026-11-02T14:30:00Z').Pass | Should -Not -Contain $false
        (Get-Smoke Expire (Join-Path $script:Fx 'smoke-expire.json') '2026-11-02T22:20:00Z').Pass | Should -Not -Contain $false
        (Get-Smoke Review (Join-Path $script:Fx 'smoke-review.json') '2026-11-10' '2026-11-09').Pass | Should -Not -Contain $false
    }
    It 'fails Activate when the role is already active: approval did not hold' {
        $r = Get-Smoke Activate (Join-Path $script:Fx 'smoke-approve.json') '2026-11-02T14:30:00Z'
        ($r | Where-Object Check -EQ 'Role not active before approval').Pass | Should -BeFalse
    }
    It 'fails Approve when the activation is longer than the role file allows' {
        $p = New-TestTenant -From 'smoke-approve.json' { param($t) $t.roleAssignmentScheduleInstances[0].endDateTime = '2026-11-03T02:12:40Z' }
        ((Get-Smoke Approve $p '2026-11-02T14:30:00Z') | Where-Object Check -EQ 'Activation within the role file').Pass | Should -BeFalse
    }
    It 'fails Expire while the role is still active' {
        ((Get-Smoke Expire (Join-Path $script:Fx 'smoke-approve.json') '2026-11-02T20:00:00Z') | Where-Object Check -EQ 'Role no longer active').Pass | Should -BeFalse
    }
    It 'fails Review without a decision, or with a decision and no justification' {
        $p = New-TestTenant -From 'smoke-review.json' { param($t) $t.accessReviewDecisions = @() }
        ((Get-Smoke Review $p '2026-11-10' '2026-11-09') | Where-Object Check -EQ 'Synthetic admin reviewed').Pass | Should -BeFalse
        $p = New-TestTenant -From 'smoke-review.json' { param($t) $t.accessReviewDecisions[0].justification = '' }
        ((Get-Smoke Review $p '2026-11-10' '2026-11-09') | Where-Object Check -EQ 'Synthetic admin reviewed').Pass | Should -BeFalse
    }
    It 'ignores audit events outside the window and for other people' {
        $p = New-TestTenant -From 'smoke-activate.json' { param($t) foreach ($a in $t.directoryAudits) { $a.initiatedBy.user.id = 'someone-else'; $a.targetResources = @($a.targetResources[0]) } }
        ((Get-Smoke Activate $p '2026-11-02T14:06:00Z') | Where-Object Check -EQ 'Activation request logged').Pass | Should -BeFalse
        ((Get-Smoke Activate (Join-Path $script:Fx 'smoke-activate.json') '2026-11-02T14:06:00Z' '2026-11-02T15:00:00Z') | Where-Object Check -EQ 'Activation request logged').Pass | Should -BeFalse
    }
    It 'refuses an undeclared call and another host' {
        $r = New-PaDeployReader -Cloud gcc -Task smoke -Invoke (New-PaDeployFixtureInvoker -Path (Join-Path $script:Fx 'smoke-review.json')).Invoke
        { Invoke-PaDeployList -Reader $r -CallId subscribed-skus } | Should -Throw '*Undeclared call*'
        $bad = New-PaDeployReader -Cloud gcc -Task smoke -Invoke { param($m, $u) @{ value = @(); '@odata.nextLink' = 'https://example.invalid/v1.0/next' } }
        { Invoke-PaDeployList -Reader $bad -CallId ar-definitions-list } | Should -Throw '*Refusing to send the token*'
    }
}

Describe 'Chapter 09: rollback' {
    BeforeAll {
        $script:RS = Get-TestSettings -Root (Join-Path $TestDrive 'rb')
        $null = New-PaDeployInputs -Settings $script:RS -OutputPath (Join-Path $script:RS.outputRoot 'inputs')
        $script:Plan = New-PaRollbackPlan -Settings $script:RS -RunRoot (Join-Path $script:Fx 'runs') -OutputPath (Join-Path $TestDrive 'rb-out')
    }
    It 'runs in the reverse of the deployment order, and keeps the emergency accounts' {
        ($script:Plan.Steps.Area | Select-Object -Unique) -join ',' | Should -Be 'access-reviews,azure,pim-groups,pim-roles,conditional-access,emergency-access'
        $script:Plan.Steps[-1].Kind | Should -Be 'Keep'
        @($script:Plan.Steps | Where-Object Kind -EQ 'Blocked') | Should -BeNullOrEmpty
    }
    It 'restores standing Entra assignments before putting the role rules back' {
        $pim = @($script:Plan.Steps | Where-Object Area -EQ 'pim-roles')
        $pim[0].Commands[1] | Should -Match "^New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest .*Action = 'adminAssign'.*a4000000-0000-4000-8000-000000000003.*afterDuration.*P14D"
        $pim[1].Commands[1] | Should -Match '-RestoreFrom .*pim-apply'
    }
    It 'restores Azure standing assignments first, then removes eligibility, then policies' {
        $az = ($script:Plan.Steps | Where-Object Area -EQ 'azure').Commands
        $kinds = @($az | Select-Object -Skip 1 | ForEach-Object { if ($_ -match 'AdminAssign') { 'restore' } elseif ($_ -match 'AdminRemove') { 'remove' } else { 'policy' } })
        ($kinds -join ',') | Should -Be ((@('restore') * 3 + @('remove') * 5 + @('policy') * 11) -join ',')
        $az[0] | Should -Match '^Connect-AzAccount -ServicePrincipal -Environment AzureCloud .*-CertificateThumbprint'
        $az[1] | Should -Match '"type":"AfterDuration","duration":"P14D"'
    }
    It 'turns off only what the stage created, never deletes, and keeps the emergency exclusion' {
        $ca = $script:Plan.Steps | Where-Object Area -EQ 'conditional-access'
        foreach ($k in $ca.Files.Keys) {
            $v = $ca.Files[$k]
            if ($k -match '[\\/]policies[\\/]') { $v.state | Should -Be 'disabled'; $v.conditions.users.excludeGroups | Should -Contain '{group:CA-Exclude-EmergencyAccess}' }
            else { $v.isAvailable | Should -BeFalse }
        }
        ($ca.Commands -join "`n") | Should -Not -Match 'Remove-|DELETE'
    }
    It 'empties the lab groups in test, and blocks production without the previous desired file' {
        ($script:Plan.Steps | Where-Object Area -EQ 'pim-groups').Kind | Should -Be 'Automatic'
        $p = Get-TestSettings -Root (Join-Path $TestDrive 'rb'); $p.environment = 'production'
        $pp = New-PaRollbackPlan -Settings $p -RunRoot (Join-Path $script:Fx 'runs') -OutputPath (Join-Path $TestDrive 'rb-prod')
        ($pp.Steps | Where-Object Area -EQ 'pim-groups').Kind | Should -Be 'Blocked'
        { Invoke-PaRollbackPlan -Plan $pp -Apply -Runner { param($c) throw 'must not run' } } | Should -Throw '*Rollback refused*'
    }
    It 'writes the plan and runs nothing in a dry run' {
        $script:ran = 0
        $r = Invoke-PaRollbackPlan -Plan $script:Plan -Runner { param($c) $script:ran++ }
        $script:ran | Should -Be 0
        $r.Path | Should -Exist
        Join-Path $TestDrive 'rb-out/prv-groups.previous.json' | Should -Exist
        (Get-Content (Join-Path $TestDrive 'rb-out/ca-policies/policies/PIM-Activation-c1.json') -Raw | ConvertFrom-Json).state | Should -Be 'disabled'
    }
    It 'with -Apply runs every Automatic command in order and no Manual step' {
        $script:log = [Collections.Generic.List[string]]::new()
        $r = Invoke-PaRollbackPlan -Plan $script:Plan -Apply -Runner { param($c) $script:log.Add($c) }
        $expected = @($script:Plan.Steps | Where-Object Kind -EQ 'Automatic' | ForEach-Object { $_.Commands })
        $script:log.ToArray() -join "`n" | Should -Be ($expected -join "`n")
        $r.CommandsRun | Should -Be $expected.Count
    }
    It 'blocks an updated review series without the previous reviewed file' {
        $runs = Join-Path $TestDrive 'runs-upd'; Copy-Item -Recurse (Join-Path $script:Fx 'runs') $runs
        '[{"Name":"PAR-T1-X","Api":"graph","Action":"Update","Result":"Sent","Note":"read back"}]' | Set-Content (Join-Path $runs 'reviews-apply/results.json')
        $pl = New-PaRollbackPlan -Settings $script:RS -RunRoot $runs -OutputPath (Join-Path $TestDrive 'rb-upd')
        ($pl.Steps | Where-Object Area -EQ 'access-reviews').Kind | Should -Be 'Blocked'
    }
}

Describe 'Chapter 09: requirements and evidence records' {
    BeforeAll {
        $script:Allowed = @('KSI-IAM-JIT', 'KSI-IAM-ELP', 'KSI-IAM-APM', 'KSI-IAM-SNU', 'KSI-CMT-LMC', 'KSI-CMT-RMV', 'KSI-CMT-VTD', 'KSI-MLA-EVC', 'KSI-MLA-OSM', 'KSI-MLA-LET', 'KSI-SVC-ACM', 'KSI-PIY-GIV', 'KSI-CED-RAT', 'KSI-INR-RIR')
        function New-EvSettings { param([string]$Name) Get-TestSettings -Root (Join-Path $TestDrive $Name) }
    }
    It 'maps every step to controls and to KSI IDs the repository already cites' {
        foreach ($r in Get-PaDeployRequirement) {
            @($r.controls).Count | Should -BeGreaterThan 0
            foreach ($k in $r.ksi) { $script:Allowed | Should -Contain $k }
            foreach ($c in $r.controls) { $c | Should -Match '^[A-Z]{2}-\d+(\(\d+\))?$' }
        }
        @(Get-PaDeployRequirement -Stage test).Count | Should -Be 14
        (Get-PaDeployRequirement -Stage production).step | Should -Contain 'first-week'
        (Get-PaDeployRequirement -Stage test).step | Should -Not -Contain 'pim-convert'
    }
    It "judges each earlier chapter's run folder" {
        (Test-PaStepResult -Step pim-roles -RunPath (Join-Path $script:Fx 'runs/pim-apply')).Result | Should -Be 'Pass'
        (Test-PaStepResult -Step pim-groups -RunPath (Join-Path $script:Fx 'runs/groups-apply')).Result | Should -Be 'Pass'
        (Test-PaStepResult -Step azure-roles -RunPath (Join-Path $script:Fx 'runs/azure-apply')).Result | Should -Be 'Pass'
        (Test-PaStepResult -Step access-reviews -RunPath (Join-Path $script:Fx 'runs/reviews-apply')).Result | Should -Be 'Pass'
        (Test-PaStepResult -Step pim-convert -RunPath (Join-Path $script:Fx 'runs/pim-convert-w1')).Result | Should -Be 'Pass'
        $ca = Test-PaStepResult -Step conditional-access -RunPath (Join-Path $script:Fx 'runs/ca-plan')
        $ca.Result | Should -Be 'Fail'; $ca.Reason | Should -Be '3 Blocked in plan.json'
        (Test-PaStepResult -Step pim-roles -RunPath (Join-Path $script:Fx 'runs/pim-convert-w1')).Reason | Should -Match 'verify.csv is missing'
        (Test-PaStepResult -Step evidence -RunPath (Join-Path $TestDrive 'nowhere')).Result | Should -Be 'Fail'
        { Test-PaStepResult -Step preflight -RunPath $script:Fx } | Should -Throw '*judged by its own script*'
    }
    It "writes a record with the step's controls and KSIs, file hashes, and a hash chain" {
        $s = New-EvSettings 'ev1'
        $a = Write-PaEvidenceRecord -Settings $s -Step pim-roles -Command 'cmd a' -Result Pass -Reason 'ok' -RunPath (Join-Path $script:Fx 'runs/pim-apply')
        $b = Write-PaEvidenceRecord -Settings $s -Step pim-groups -Command 'cmd b' -Result Pass -Reason 'ok' -RunPath (Join-Path $script:Fx 'runs/groups-apply')
        $ja = Get-Content $a.Path -Raw | ConvertFrom-Json -AsHashtable
        $jb = Get-Content $b.Path -Raw | ConvertFrom-Json -AsHashtable
        $ja.controls -join ',' | Should -Be 'AC-5,AC-6,CM-5'
        $ja.ksi | Should -Contain 'KSI-IAM-JIT'
        $ja.environment | Should -Be 'test'; $ja.changeRecord | Should -Be 'CHG-3001'
        $ja.files['before.json'] | Should -Be (Get-FileHash (Join-Path $script:Fx 'runs/pim-apply/before.json') -Algorithm SHA256).Hash.ToLowerInvariant()
        $ja.previousRecordSha256 | Should -BeNullOrEmpty
        $jb.previousRecordSha256 | Should -Be $a.Sha256
        $idx = @(Import-Csv (Join-Path $s.outputRoot 'evidence/records.csv'))
        $idx.Count | Should -Be 2; $idx[1].Sha256 | Should -Be $b.Sha256
    }
    It 'reports Missing, then OK, for a required step' {
        $s = New-EvSettings 'ev2'
        (Test-PaEvidenceComplete -Settings $s | Where-Object Step -EQ 'azure-roles').Status | Should -Be 'Missing'
        $null = Write-PaEvidenceRecord -Settings $s -Step azure-roles -Command 'c' -Result Pass -Reason 'ok' -RunPath (Join-Path $script:Fx 'runs/azure-apply')
        $row = Test-PaEvidenceComplete -Settings $s | Where-Object Step -EQ 'azure-roles'
        $row.Ok | Should -BeTrue; $row.Ksi | Should -Be 'KSI-IAM-JIT, KSI-IAM-ELP'
        @(Test-PaEvidenceComplete -Settings $s | Where-Object Ok).Count | Should -Be 1
    }
    It 'fails a step whose latest record failed, or was only planned' {
        $s = New-EvSettings 'ev3'
        $null = Write-PaEvidenceRecord -Settings $s -Step rollback -Command 'c' -Result Planned -Reason 'dry run'
        (Test-PaEvidenceComplete -Settings $s | Where-Object Step -EQ 'rollback').Ok | Should -BeFalse
        $null = Write-PaEvidenceRecord -Settings $s -Step rollback -Command 'c' -Result Pass -Reason 'applied'
        (Test-PaEvidenceComplete -Settings $s | Where-Object Step -EQ 'rollback').Ok | Should -BeTrue
    }
    It 'detects a changed run file, then an edited record' {
        $s = New-EvSettings 'ev4'
        $run = Join-Path $TestDrive 'ev4-run'; Copy-Item -Recurse (Join-Path $script:Fx 'runs/groups-apply') $run
        $a = Write-PaEvidenceRecord -Settings $s -Step pim-groups -Command 'c' -Result Pass -Reason 'ok' -RunPath $run
        'tampered' | Add-Content (Join-Path $run 'results.json')
        (Test-PaEvidenceComplete -Settings $s | Where-Object Step -EQ 'pim-groups').Status | Should -Be 'Changed'
        (Get-Content $a.Path -Raw) -replace '"reason": "ok"', '"reason": "edited"' | Set-Content $a.Path -NoNewline
        $row = Test-PaEvidenceComplete -Settings $s | Where-Object Step -EQ 'pim-groups'
        $row.Status | Should -Be 'Chain broken'; $row.Ok | Should -BeFalse
    }
    It "records each deploy script's own run, with the command and mode" {
        $root = Join-Path $TestDrive 'ev5'
        $p = Join-Path $TestDrive 'env-ev5.json'
        $j = Get-Content $script:SettingsPath -Raw | ConvertFrom-Json -AsHashtable; $j.outputRoot = $root; $j | ConvertTo-Json -Depth 30 | Set-Content $p
        Push-Location $script:Kit
        try {
            $null = & ./deploy/New-PaDeployInputs.ps1 -SettingsPath $p
            $null = & ./deploy/Test-PaPreflight.ps1 -SettingsPath $p -FixturePath (Join-Path $script:Fx 'tenant.json') -AsOf 2026-11-02
            $null = & ./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $p -Phase Expire -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T22:20:00Z -FixturePath (Join-Path $script:Fx 'smoke-expire.json')
            $null = & ./deploy/Invoke-PaRollback.ps1 -SettingsPath $p -RunRoot (Join-Path $script:Fx 'runs')
            $idx = @(Import-Csv (Join-Path $root 'evidence/records.csv'))
            ($idx.Step -join ',') | Should -Be 'settings,preflight,smoke-expire,rollback'
            ($idx.Result -join ',') | Should -Be 'Pass,Fail,Pass,Planned'
            $pf = Get-Content (Join-Path $root "evidence/$($idx[1].Record)") -Raw | ConvertFrom-Json
            $pf.mode | Should -Be 'Fixture'
            $pf.command | Should -Match '^\./deploy/Test-PaPreflight\.ps1 .*-AsOf 2026-11-02( |$)'
            $out = & ./deploy/Test-PaEvidence.ps1 -SettingsPath $p
            $LASTEXITCODE | Should -Be 1
            ($out -join "`n") | Should -Match 'NO-GO on evidence'
            Join-Path $root 'evidence/coverage.csv' | Should -Exist
        } finally { Pop-Location }
    }
    It 'renders dates in the command as given' {
        $c = Format-PaDeployCommand -Name 'X.ps1' -Parameters ([ordered]@{ AsOf = [datetime]'2026-11-02'; Since = [datetime]::new(2026, 11, 2, 14, 0, 0, [DateTimeKind]::Utc); Apply = [switch]$true; Path = 'a b' })
        $c | Should -Be './deploy/X.ps1 -AsOf 2026-11-02 -Since 2026-11-02T14:00:00Z -Apply -Path a b'
    }
}
