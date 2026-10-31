#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 03: Learn's service account decision tables, run as published (pinned in
# examples/third_party/entra-service-account-choice-pages), then the migration path matrix as code
# over Chapters 01 and 02's runs: the proposal (N2.1), the disposition (D-N3), the waves (N2.2),
# the Workload ID Premium scope (D-N4) and Gate 2, against the fictional estate served by the fakes.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiMatrix/NpiMatrix.psm1') -Force
    . (Join-Path $PSScriptRoot 'NpiMatrixSampleHarness.ps1')
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Skus = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch03/subscribed-skus.json')).Path
    $script:In = Join-Path $PSScriptRoot 'fixtures/ch03/inputs'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-mat-{0}" -f [guid]::NewGuid())
    $script:InvRun = Join-Path $script:Tmp 'inventory'
    $script:OwnRun = Join-Path $script:Tmp 'ownership'
    $null = & (Join-Path $script:Root 'Invoke-NpiInventory.ps1') -Cloud gcc -FixturePath $script:Fixture -OutputPath $script:InvRun
    $null = & (Join-Path $script:Root 'Invoke-NpiOwnership.ps1') -Cloud gcc -RegisterRun $script:InvRun -FixturePath $script:Fixture -InputPath (Join-Path $PSScriptRoot 'fixtures/inputs') -OutputPath $script:OwnRun
    $script:Register = Import-NpiRegister -RunPath $script:InvRun
    $script:Ownership = Import-NpiOwnershipRun -RunPath $script:OwnRun -RegisterSha256 $script:Register.Sha256
    $script:Config = Import-NpiMatrixConfig
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Dates = Import-NpiMatrixJson (Join-Path $script:In 'program-dates.json')
    $script:Dn4 = Import-NpiMatrixJson (Join-Path $script:In 'workload-id-premium.json')

    function New-TestReader { $fake = New-NpiMatrixFixtureInvoker -Path $script:Fixture -SkuPath $script:Skus; [pscustomobject]@{ Fake = $fake; Reader = (New-NpiMatrixReader -Cloud gcc -Invoke $fake.Invoke) } }
    function Get-In([string]$Name) { @(Import-NpiInput (Join-Path $script:In $Name)) }
    function Get-TestProposal([object[]]$Workloads = (Get-In 'workloads.csv')) { Get-NpiMatrixProposal -Rows $script:Register.Rows -Ownership $script:Ownership -Config $script:Config -Workloads $Workloads }
    function Get-TestDecision([object[]]$Dispositions = (Get-In 'dispositions.csv'), [object[]]$Waves = (Get-In 'waves.csv'), $Dates = $script:Dates, [object[]]$Proposals = (Get-TestProposal)) {
        $t = New-TestReader
        Test-NpiMigrationDecision -Reader $t.Reader -Proposals $Proposals -Config $script:Config -AsOf $script:AsOf -Dispositions $Dispositions -Waves $Waves -ProgramDates $Dates
    }
    function Get-TestScope($Decision = $script:Dn4, [object[]]$Decisions = $script:Decision.Decisions) {
        $t = New-TestReader
        Get-NpiWorkloadIdScope -Reader $t.Reader -Rows $script:Register.Rows -Decisions $Decisions -Config $script:Config -Decision $Decision
    }
    function Set-Row([object[]]$Rows, [string]$Id, [hashtable]$Values) {
        @($Rows | ForEach-Object { $r = $_.PSObject.Copy(); if ($r.IdentityId -eq $Id) { foreach ($k in $Values.Keys) { $r.$k = $Values[$k] } }; $r })
    }
    $script:Proposals = Get-TestProposal
    $script:Decision = Get-TestDecision
    $script:Scope = Get-TestScope
    function Get-P([string]$Name) { @($script:Proposals | Where-Object Name -EQ $Name | Where-Object Type -NE 'ServicePrincipal')[0] }
    function Get-F([string]$Rule, $From = $script:Decision.Findings) { @($From | Where-Object Rule -EQ $Rule) }
    $script:Id = @{ hrsync = 'ad:ad000000-0000-4000-8000-000000000001'; webfront = 'ad:ad000000-0000-4000-8000-000000000009'; msa = 'ad:ad000000-0000-4000-8000-000000000021'; intranet = 'ad:ad000000-0000-4000-8000-000000000012'; payroll = 'app:1a000000-0000-4000-8000-000000000001'; mail = 'app:1a000000-0000-4000-8000-000000000006'; deploy = 'app:1a000000-0000-4000-8000-000000000007' }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'Chapter 03: Learn''s "Securing on-premises service accounts" table, run as published' {
    It 'chooses a gMSA for a single-server app on Windows Server 2012: the model for the Kerberos rows' {
        (Invoke-LearnOnPremisesChoice -Servers 1 -WindowsServer 2012).Choice | Should -Be 'gMSA'
        (Invoke-LearnOnPremisesChoice -Servers 3 -LoadBalancer).Choice | Should -Be 'gMSA'
    }
    It 'has no dMSA column, so a Windows Server 2025 domain''s best target never comes out of it' {
        (Get-LearnChoiceTable -Page OnPremises).Columns | Should -Be @('Criterion', 'gMSA', 'sMSA', 'Computer account', 'User account')
        @($script:Config.rows | Where-Object target -EQ 'dMSA').id | Should -Be 'M06'
        (Get-P 'svc-hrsync').Proposed | Should -Be 'dMSA'
    }
    It 'admits a user account in every situation, so it never says to move off one' {
        foreach ($c in (Invoke-LearnOnPremisesChoice -Servers 1), (Invoke-LearnOnPremisesChoice -Servers 3 -LoadBalancer), (Invoke-LearnOnPremisesChoice -Servers 1 -WindowsServer '2008 R2')) { $c.Admissible | Should -Contain 'User account' }
        @($script:Config.rows | Where-Object { $_.target -in 'Traditional', 'KeepKerberos' }).Count | Should -Be 0
        $script:Config.keepKerberosTypes | Should -Be @('Traditional', 'UnknownServiceAccount')
    }
    It 'has no retire outcome and no criterion for an owner or for use' {
        $t = Get-LearnChoiceTable -Page OnPremises
        ($t.Rows.Criterion -join ' ') | Should -Not -Match 'owner|used|unused|stale'
        $t.Columns | Should -Not -Contain 'Retire'
        (Get-P 'svc-backup').Proposed | Should -Be 'Retire'
    }
    It 'decides by servers, load balancer and Windows version, not by the account''s type or risk, and names only 2008 R2 and 2012' {
        @((Get-LearnChoiceTable -Page OnPremises).Rows.Criterion | Where-Object { $_ -match 'Windows Server' }) | Should -Be @('App runs on Windows Server 2008 R2', 'App runs on Windows Server 2012')
        (Invoke-LearnOnPremisesChoice -Servers 1 -WindowsServer '2008 R2').Choice | Should -Be 'sMSA'
        (Get-P 'msa-print01$').Proposed | Should -Be 'gMSA'
    }
}

Describe 'Chapter 03: Learn''s "Securing cloud-based service accounts" table, run as published' {
    It 'chooses a managed identity in Azure and a service principal outside it: the model for the Entra rows' {
        (Invoke-LearnCloudChoice -Hosting Azure).Choice | Should -Be 'Managed identity'
        (Invoke-LearnCloudChoice -Hosting NotAzure).Choice | Should -Be 'Service principal'
        (Get-P 'Payroll Export').Proposed | Should -Be 'ManagedIdentity'
    }
    It 'leaves "if the service supports a managed identity" to you' {
        (Invoke-LearnCloudChoice -Hosting Azure).Cell | Should -Match 'if the service supports a Managed Identity'
        $w = @(Get-In 'workloads.csv' | ForEach-Object { if ($_.IdentityId -eq $script:Id.payroll) { $_.MiSupported = '' }; $_ })
        (@(Get-TestProposal -Workloads $w | Where-Object IdentityId -EQ $script:Id.payroll)[0]).Why | Should -Match 'MiSupported'
        $w2 = @(Get-In 'workloads.csv' | ForEach-Object { if ($_.IdentityId -eq $script:Id.payroll) { $_.MiSupported = 'No' }; $_ })
        (@(Get-TestProposal -Workloads $w2 | Where-Object IdentityId -EQ $script:Id.payroll)[0]).Proposed | Should -Be 'AppRegistrationFederated'
    }
    It 'offers a service principal only certificates and secrets: no federated credential' {
        $page = Get-Content -LiteralPath $script:ChoicePages.Cloud -Raw
        $page | Should -Match 'two mechanisms for authentication using service principals'
        $page | Should -Not -Match '(?i)federat'
        (Get-P 'Mail Automation').Proposed | Should -Be 'AppRegistrationFederated'
    }
    It 'recommends a service principal for a multitenant service, without saying Conditional Access can''t cover it' {
        (Invoke-LearnCloudChoice -Hosting MultiTenant).Choice | Should -Be 'Service principal'
        (Get-Content -LiteralPath $script:ChoicePages.Cloud -Raw) | Should -Not -Match 'Conditional Access'
        (Get-F 'NPI-MAT-09' $script:Scope.Findings | Where-Object Object -Like 'Vendor Portal*').Severity | Should -Be 'Finding'
    }
}

Describe 'Chapter 03: Learn''s Workload ID FAQ, read as published' {
    It 'lists the Premium-only capabilities: the model for what D-N4 buys' {
        @(Get-LearnWorkloadIdFeature | Where-Object { $_.Premium -and -not $_.Free }).Capability | Should -Be @('Access reviews for service provider-assigned privileged roles', 'App Health Recommendations', 'Conditional Access policies for workload identities', 'ID Protection for workload identities')
        @(Get-LearnWorkloadIdFeature | Where-Object Capability -In 'Managed identities', 'Workload identity federation', 'Application management policies').Free | Should -Be @($true, $true, $true)
    }
    It 'says both that one license unlocks every workload identity and that only eligible ones need licensing' {
        $faq = Get-Content -LiteralPath $script:ChoicePages.WorkloadIdFaq -Raw
        $faq | Should -Match 'One license in the tenant unlocks all features for all workload identities'
        $faq | Should -Match 'Only workload identities eligible for premium features require licensing'
        $faq | Should -Match 'All subscribers require a license'
        $script:Scope.Scope.options.Wide | Should -BeGreaterThan 0
    }
    It 'gives no list of which identities are eligible as data: the code computes it from the register' {
        $script:Scope.Scope.conditionalAccessEligibleNow | Should -Not -Contain 'app:1a000000-0000-4000-8000-000000000005'
        $script:Scope.Scope.conditionalAccessEligibleNow | Should -Not -Contain 'mi:5b000000-0000-4000-8000-000000000014'
        $script:Scope.Scope.idProtectionEligibleNow | Should -Contain 'app:1a000000-0000-4000-8000-000000000005'
    }
}

Describe 'The call list (config/calls-ch03.json)' {
    It 'declares exactly the union of its calls, reads only, nothing ReadWrite' {
        $list = Get-NpiMatrixCallList
        $p = Get-NpiMatrixRequiredPermission
        $decl = $list.tasks['migration-matrix']
        @($decl.graphPermissions | Sort-Object) | Should -Be @($p.GraphPermissions)
        @($decl.azureRoles).Count | Should -Be @($p.AzureRoles).Count
        @($decl.adRights).Count | Should -Be @($p.AdRights).Count
        $decl.mode | Should -Be 'read'
        $p.Methods | Should -Be @('GET')
        @($p.GraphPermissions | Where-Object { $_ -match 'ReadWrite' }).Count | Should -Be 0
        $p.GraphPermissions | Should -Be @('LicenseAssignment.Read.All', 'User.Read.All')
    }
    It 'every call names its Learn page, and no id or task collides with config/calls.json' {
        $mine = Get-NpiMatrixCallList
        foreach ($c in $mine.calls) { $c.learn | Should -Match '^https://learn\.microsoft\.com/' }
        $shared = Get-NpiCallList
        @($mine.calls.id | Where-Object { $_ -in @($shared.calls.id) }).Count | Should -Be 0
        $shared.tasks.ContainsKey('migration-matrix') | Should -BeFalse
    }
    It 'the reader refuses a call the task doesn''t declare, and the fake refuses anything but GET' {
        $t = New-TestReader
        { Invoke-NpiList -Reader $t.Reader -CallId 'graph-applications' } | Should -Throw '*Undeclared call*'
        { & $t.Fake.Invoke 'PATCH' 'https://graph.microsoft.com/v1.0/subscribedSkus' @{} $null } | Should -Throw '*refuses PATCH*'
    }
}

Describe 'Chapters 01 and 02 as inputs' {
    It 'refuses an ownership run whose files changed since its manifest' {
        $copy = Join-Path $script:Tmp 'own-tampered'
        Copy-Item -Recurse $script:OwnRun $copy
        Add-Content -LiteralPath (Join-Path $copy 'orphan-plan.json') -Value ' '
        { Import-NpiOwnershipRun -RunPath $copy -RegisterSha256 $script:Register.Sha256 } | Should -Throw '*doesn''t match its manifest*'
    }
    It 'refuses an ownership run made on a different register' {
        { Import-NpiOwnershipRun -RunPath $script:OwnRun -RegisterSha256 ('0' * 64) } | Should -Throw '*run Chapter 02 on this register*'
    }
}

Describe 'N2.1: a target proposed for every identity' {
    It 'puts every in-scope identity in the matrix, hands off SQL Server, holds jdoe, and leaves the rest out with a reason' {
        @($script:Proposals | Where-Object Scope -EQ 'Matrix').Count | Should -Be 21
        @($script:Proposals | Where-Object Scope -EQ 'HandedOff').Name | Sort-Object | Should -Be @('gmsa-sql$', 'svc-ldapbind', 'svc-sqlprod')
        @($script:Proposals | Where-Object Scope -EQ 'ConfirmFirst').Name | Should -Be 'jdoe'
        foreach ($p in @($script:Proposals | Where-Object Scope -EQ 'OutOfScope')) { $p.Why | Should -Not -BeNullOrEmpty }
        @($script:Proposals).Count | Should -Be @($script:Register.Rows).Count
    }
    It 'proposes Retire for an unowned or disabled identity, but not one under a dated exception' {
        foreach ($n in 'svc-backup', 'svc-oldftp', 'svc-reports', 'sa-printsvc', 'Legacy Reports', 'Old SAML Connector') { (Get-P $n).Proposed | Should -Be 'Retire' }
        (Get-P 'gmsa-ops$').OrphanState | Should -Be 'Exception'
        (Get-P 'gmsa-ops$').Proposed | Should -Be 'Keep'
        (Get-P 'svc-oldftp').Cautions | Should -Match 'Stale lead'
    }
    It 'follows Book 02''s rows: Kerberos to dMSA or gMSA, MSA to gMSA, gMSA and dMSA kept, secrets to managed identity or federation, managed identities kept' {
        (Get-P 'svc-hrsync').MatrixRow | Should -Be 'M06'
        (Get-P 'svc-intranet').Proposed | Should -Be 'gMSA'
        (Get-P 'gmsa-web$').Proposed | Should -Be 'Keep'
        (Get-P 'dmsa-hrsync$').Proposed | Should -Be 'Keep'
        (Get-P 'Build Pipeline').Proposed | Should -Be 'Keep'
        (Get-P 'vm-batch01').Proposed | Should -Be 'Keep'
        (Get-P 'id-deploy').MatrixRow | Should -Be 'M19'
    }
    It 'every matrix row names a known target and its source; every target has a rollback' {
        foreach ($r in $script:Config.rows) { $script:Config.targets.ContainsKey($r.target) | Should -BeTrue; $r.source | Should -Not -BeNullOrEmpty }
        foreach ($k in $script:Config.targets.Keys) { $script:Config.targets[$k].rollback | Should -Not -BeNullOrEmpty }
    }
    It 'warns that unconstrained delegation stops working under a dMSA, and that every host must support dMSA' {
        (Get-P 'svc-webfront').Cautions -join ' ' | Should -Match 'Unconstrained delegation stops working'
        (Get-P 'svc-hrsync').Cautions -join ' ' | Should -Match 'Every host'
    }
    It 'NPI-MAT-02: no workload facts, no proposal' {
        (Get-F 'NPI-MAT-02').Object | Should -Be 'HR Connector (AppRegistration)'
        (Get-P 'HR Connector').Proposed | Should -BeNullOrEmpty
    }
    It 'flags an Arc-enabled server''s shared identity and the Learn pages that differ on it' {
        $w = @(Get-In 'workloads.csv' | ForEach-Object { if ($_.IdentityId -eq $script:Id.intranet) { $_.Location = 'ArcServer' }; $_ })
        $p = @(Get-TestProposal -Workloads $w | Where-Object IdentityId -EQ $script:Id.intranet)[0]
        $p.Proposed | Should -Be 'ManagedIdentity'
        $p.Cautions -join ' ' | Should -Match 'row 23'
    }
}

Describe 'D-N3: the owner''s disposition' {
    It 'NPI-MAT-01: no disposition is a finding; an account to confirm first is Info' {
        (Get-F 'NPI-MAT-01' | Where-Object Severity -EQ 'Finding').Object | Should -Be 'svc-oldftp (Traditional)'
        (Get-F 'NPI-MAT-01' | Where-Object Severity -EQ 'Info').Object | Should -Be 'jdoe (Traditional)'
    }
    It 'NPI-MAT-03: an MSA or gMSA is never sent to a dMSA, and a dMSA needs the facts that allow one' {
        $d = Set-Row (Get-In 'dispositions.csv') $script:Id.msa @{ Target = 'dMSA' }
        (Get-F 'NPI-MAT-03' (Get-TestDecision -Dispositions $d).Findings | Where-Object Object -Like 'msa-print01*').Issue | Should -Match "can't migrate"
        $d2 = Set-Row (Get-In 'dispositions.csv') $script:Id.intranet @{ Disposition = 'Replatform'; Target = 'dMSA'; Wave = '2' }
        (Get-F 'NPI-MAT-03' (Get-TestDecision -Dispositions $d2).Findings | Where-Object Object -Like 'svc-intranet*').Issue | Should -Match 'Windows Server 2025'
    }
    It 'NPI-MAT-03: a target that doesn''t belong to the disposition is refused' {
        $d = Set-Row (Get-In 'dispositions.csv') $script:Id.payroll @{ Disposition = 'Retire'; Target = 'ManagedIdentity' }
        (Get-F 'NPI-MAT-03' (Get-TestDecision -Dispositions $d).Findings | Where-Object Object -Like 'Payroll*').Issue | Should -Match "isn't a Retire target"
    }
    It 'NPI-MAT-04: an owner may choose another target, with a reason on record' {
        (Get-F 'NPI-MAT-04').Object | Should -Be 'Deploy Bot (AppRegistration)'
        (Get-F 'NPI-MAT-04').Severity | Should -Be 'Warn'
        $d = Set-Row (Get-In 'dispositions.csv') $script:Id.deploy @{ Reason = '' }
        (Get-F 'NPI-MAT-04' (Get-TestDecision -Dispositions $d).Findings).Severity | Should -Be 'Finding'
    }
    It 'NPI-MAT-05: an account kept in AD ends by G5, one kept on Kerberos by D08 and with the authorizing official''s acceptance' {
        (Get-F 'NPI-MAT-05').Object | Should -Be 'dmsa-hrsync$ (dMSA)'
        $d = Set-Row (Get-In 'dispositions.csv') $script:Id.intranet @{ EndDate = '2027-07-31'; AoAcceptedBy = '' }
        $f = @(Get-F 'NPI-MAT-05' (Get-TestDecision -Dispositions $d).Findings | Where-Object Object -Like 'svc-intranet*')
        ($f.Issue -join ' ') | Should -Match 'D08'
        ($f.Issue -join ' ') | Should -Match 'authorizing official'
        $d2 = Set-Row (Get-In 'dispositions.csv') $script:Id.intranet @{ EndDate = '2026-10-01' }
        (Get-F 'NPI-MAT-05' (Get-TestDecision -Dispositions $d2).Findings | Where-Object Object -Like 'svc-intranet*').Issue | Should -Match 'has passed'
        (Get-F 'NPI-MAT-05' (Get-TestDecision -Dates $null).Findings | Where-Object Object -Like 'svc-intranet*').Severity | Should -Be 'Warn'
    }
    It 'NPI-MAT-06: every account kept on Kerberos has an SPN owner who is an enabled member' {
        (Get-F 'NPI-MAT-06').Object | Should -Be 'svc-webfront (Traditional)'
        $d = Set-Row (Get-In 'dispositions.csv') $script:Id.webfront @{ SpnOwnerUpn = 'dave_partner.example#EXT#@contosoexample.onmicrosoft.com' }
        (Get-F 'NPI-MAT-06' (Get-TestDecision -Dispositions $d).Findings).Issue | Should -Match 'a guest'
        $d2 = Set-Row (Get-In 'dispositions.csv') $script:Id.webfront @{ SpnOwnerUpn = 'erin@contoso.example' }
        (Get-F 'NPI-MAT-06' (Get-TestDecision -Dispositions $d2).Findings).Count | Should -Be 0
    }
    It 'reads people only through GET /users with User.Read.All, each once' {
        $t = New-TestReader
        $null = Test-NpiMigrationDecision -Reader $t.Reader -Proposals $script:Proposals -Config $script:Config -AsOf $script:AsOf -Dispositions (Get-In 'dispositions.csv') -Waves (Get-In 'waves.csv') -ProgramDates $script:Dates
        @($t.Fake.Calls | Where-Object { $_.Method -ne 'GET' -or $_.Uri -notmatch '^https://graph\.microsoft\.com/v1\.0/users/' }).Count | Should -Be 0
        @($t.Fake.Calls.Uri | Sort-Object -Unique).Count | Should -Be @($t.Fake.Calls).Count
    }
}

Describe 'N2.2: waves, HIGH-risk first, a rollback per wave' {
    It 'NPI-MAT-07: a HIGH-risk account re-platformed outside wave 1 is a finding; a kept HIGH one is a warning' {
        (Get-F 'NPI-MAT-07' | Where-Object Severity -EQ 'Finding').Object | Should -Be 'svc-hrsync (Traditional)'
        @(Get-F 'NPI-MAT-07' | Where-Object Severity -EQ 'Warn').Object | Sort-Object | Should -Be @('gmsa-ops$ (gMSA)', 'svc-webfront (Traditional)')
        (@($script:Decision.Waves | Where-Object Wave -EQ 1)[0]).Members.Name | Should -Be 'Mail Automation'
    }
    It 'proposes wave 1 for a HIGH-risk account the owner left unscheduled, and wave 2 otherwise' {
        $d = Set-Row (Get-In 'dispositions.csv') $script:Id.hrsync @{ Wave = '' }
        $r = Get-TestDecision -Dispositions $d
        $h = @($r.Decisions | Where-Object IdentityId -EQ $script:Id.hrsync)[0]
        $h.Wave | Should -Be 1
        $h.WaveSource | Should -Be 'Proposed'
        (Get-F 'NPI-MAT-07' $r.Findings | Where-Object Severity -EQ 'Finding').Count | Should -Be 0
    }
    It 'NPI-MAT-08: a wave with members needs a rollback owner, a review date and a 30-day parallel run' {
        (Get-F 'NPI-MAT-08').ObjectKey | Should -Be 'wave-2'
        $w = @(Get-In 'waves.csv' | ForEach-Object { if ($_.Wave -eq '1') { $_.ParallelRunDays = '14' }; $_ })
        (Get-F 'NPI-MAT-08' (Get-TestDecision -Waves $w).Findings | Where-Object ObjectKey -EQ 'wave-1').Issue | Should -Match 'parallel run under 30 days'
    }
    It 'records each wave''s rollback from its members'' targets' {
        $w2 = @($script:Decision.Waves | Where-Object Wave -EQ 2)[0]
        @($w2.Members.Name | Sort-Object) | Should -Be @('msa-print01$', 'Payroll Export', 'svc-hrsync')
        ($w2.Rollback -join ' ') | Should -Match 'Undo-ADServiceAccountMigration'
        ($w2.Rollback -join ' ') | Should -Match 'Re-enable the legacy account'
        $w2.High | Should -Be 1
    }
}

Describe 'D-N4: the Workload ID Premium scope' {
    It 'reads the tenant''s subscriptions with one GET and LicenseAssignment.Read.All, and finds the Workload ID plan by service plan ID' {
        $t = New-TestReader
        $s = Get-NpiWorkloadIdScope -Reader $t.Reader -Rows $script:Register.Rows -Decisions $script:Decision.Decisions -Config $script:Config -Decision $script:Dn4
        @($t.Fake.Calls).Count | Should -Be 1
        $t.Fake.Calls[0].Uri | Should -BeLike 'https://graph.microsoft.com/v1.0/subscribedSkus?$select=*'
        $s.Scope.tenant.workloadIdSkus.skuPartNumber | Should -Be 'Workload_Identities_P2'
        $s.Scope.tenant.enabledUnits | Should -Be 2
    }
    It 'NPI-MAT-09: a Tier 1 identity Conditional Access can''t cover is a finding; one leaving the scope by its decision is a warning' {
        $f = @(Get-F 'NPI-MAT-09' $script:Scope.Findings)
        ($f | Where-Object Object -Like 'Vendor Portal*').Severity | Should -Be 'Finding'
        ($f | Where-Object Object -Like 'Payroll Export*').Issue | Should -Match 'managed identities aren''t covered'
        @($script:Scope.Scope.scope) | Should -Be @('app:1a000000-0000-4000-8000-000000000006', 'app:1a000000-0000-4000-8000-000000000001')
    }
    It 'counts the Wide option after conversion: apps moving to managed identities leave, new app registrations join' {
        $script:Scope.Scope.leavingScopeAfterConversion | Should -Contain $script:Id.payroll
        $s = Get-TestScope -Decision @{ decision = 'Wide'; decidedBy = 'ciso@contoso.example'; decidedOn = '2026-10-28' }
        $s.Scope.options.Wide | Should -Be @($s.Scope.conditionalAccessEligibleAfter).Count
        (Get-F 'NPI-MAT-09' $s.Findings).Issue | Should -Match 'enabled units for'
    }
    It 'no decision file, or None without compensating controls, fails Gate 2' {
        (Get-F 'NPI-MAT-09' (Get-TestScope -Decision $null).Findings).Issue | Should -Match 'No D-N4 decision'
        (Get-F 'NPI-MAT-09' (Get-TestScope -Decision @{ decision = 'None'; decidedBy = 'ciso@contoso.example'; decidedOn = '2026-10-28'; compensatingControls = @() }).Findings | Where-Object Severity -EQ 'Finding').Issue | Should -Match 'compensating controls'
    }
}

Describe 'Gate 2 and the run' {
    It 'is not met while any finding is open, and is met with none' {
        $g = Test-NpiGate2 -Findings (@($script:Decision.Findings) + @($script:Scope.Findings)) -Decisions $script:Decision.Decisions
        $g.met | Should -BeFalse
        @($g.criteria | Where-Object { -not $_.met }).Count | Should -Be 5
        (Test-NpiGate2 -Findings @($script:Decision.Findings | Where-Object Severity -NE 'Finding') -Decisions $script:Decision.Decisions).met | Should -BeTrue
    }
    It 'finding IDs are stable' {
        $again = Get-TestDecision
        ($again.Findings.Id | Sort-Object) | Should -Be ($script:Decision.Findings.Id | Sort-Object)
        foreach ($f in $script:Decision.Findings) { $f.Id | Should -Be "$($f.Rule):$($f.ObjectKey)" }
    }
    It 'the entry script writes the files, a manifest with every request and hash, and the same decisions on every run' {
        $out = Join-Path $script:Tmp 'matrix'
        $lines = & (Join-Path $script:Root 'Invoke-NpiMatrix.ps1') -Cloud gcc -RegisterRun $script:InvRun -OwnershipRun $script:OwnRun -InputPath $script:In -FixturePath $script:Fixture -SkuFixturePath $script:Skus -OutputPath $out
        ($lines -join "`n") | Should -Match 'Gate 2: not met'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
        $m.task | Should -Be 'migration-matrix'
        $m.graphPermissions | Should -Be @('LicenseAssignment.Read.All', 'User.Read.All')
        $m.registerSha256 | Should -Be $script:Register.Sha256
        $m.matrixSha256 | Should -Be $script:Config.sha256
        @($m.requests | Where-Object method -NE 'GET').Count | Should -Be 0
        foreach ($k in $m.files.Keys) { Get-NpiFileHash -Path (Join-Path $out $k) | Should -Be $m.files[$k] }
        $out2 = Join-Path $script:Tmp 'matrix2'
        $null = & (Join-Path $script:Root 'Invoke-NpiMatrix.ps1') -Cloud gcc -RegisterRun $script:InvRun -OwnershipRun $script:OwnRun -InputPath $script:In -FixturePath $script:Fixture -SkuFixturePath $script:Skus -OutputPath $out2
        foreach ($f in 'decisions.json', 'waves.json', 'findings.json') { Get-NpiFileHash -Path (Join-Path $out2 $f) | Should -Be $m.files[$f] }
    }
    It 'refuses a register read in another cloud' {
        { & (Join-Path $script:Root 'Invoke-NpiMatrix.ps1') -Cloud gcchigh -RegisterRun $script:InvRun -OwnershipRun $script:OwnRun -InputPath $script:In -FixturePath $script:Fixture -SkuFixturePath $script:Skus -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw "*not 'gcchigh'*"
    }
}
