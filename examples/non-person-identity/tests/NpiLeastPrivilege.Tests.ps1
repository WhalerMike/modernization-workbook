#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 07: the permission sweep over Chapter 01's register, the reviewed list and its
# exceptions, the hand-off to the Privileged Access plan, the quarterly owner review, the plan,
# and the separate write path, against the fictional estate served by the fakes.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Estate01 = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch07/estate-ch07.json')).Path
    $script:Inputs = Join-Path $PSScriptRoot 'fixtures/ch07/inputs'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-lp-{0}" -f [guid]::NewGuid())
    $script:InvRun = Join-Path $script:Tmp 'inventory'
    $null = & (Join-Path $script:Root 'Invoke-NpiInventory.ps1') -Cloud gcc -FixturePath $script:Estate01 -OutputPath $script:InvRun
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1') -Force
    $script:Register = Import-NpiLpRegister -RunPath $script:InvRun
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:TenantId = $script:Register.Manifest.tenantId
    $script:Scopes = @(Import-NpiLpInput (Join-Path $script:Inputs 'azure-scopes.csv') | ForEach-Object Scope)
    $script:Exceptions = Import-NpiLpInput (Join-Path $script:Inputs 'permission-exceptions.csv')
    $script:Decisions = Import-NpiLpInput (Join-Path $script:Inputs 'owner-decisions.csv')
    function New-TestSweep([int]$PageSize = 2) {
        $fake = New-NpiLpFixtureInvoker -Path $script:Fixture -PageSize $PageSize
        $reader = New-NpiLpReader -Cloud gcc -Invoke $fake.Invoke
        [pscustomobject]@{ Fake = $fake; Sweep = (Get-NpiLpSweep -Reader $reader -Rows $script:Register.Rows -AzureScopes $script:Scopes) }
    }
    function Get-TestAll([object[]]$Exceptions = $script:Exceptions, [object[]]$Decisions = $script:Decisions) {
        $sw = (New-TestSweep).Sweep
        $check = Test-NpiLeastPrivilege -Sweep $sw -Exceptions $Exceptions -AsOf $script:AsOf
        $review = New-NpiLpOwnerReview -Check $check -Sweep $sw -Decisions $Decisions -AsOf $script:AsOf
        $plan = New-NpiLpPlan -Check $check -Review $review -AsOf $script:AsOf -Cloud gcc -TenantId $script:TenantId -RegisterSha256 $script:Register.Sha256
        [pscustomobject]@{ Sweep = $sw; Check = $check; Review = $review; Plan = $plan }
    }
    function Save-TestPlan($Plan) {
        $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid())
        New-Item -ItemType Directory -Force -Path $script:Tmp | Out-Null
        Write-NpiJson -Path $p -Value $Plan
        [pscustomobject]@{ Path = $p; Sha = Get-NpiFileHash -Path $p }
    }
    function New-TestWriter {
        $fake = New-NpiLpFixtureInvoker -Path $script:Fixture -AllowWrite
        [pscustomobject]@{ Fake = $fake; Writer = (New-NpiLpWriter -Cloud gcc -TenantId $script:TenantId -Invoke $fake.Invoke) }
    }
    $script:All = Get-TestAll
    function Get-Lp([string]$Rule) { @($script:All.Check.Findings | Where-Object Rule -EQ $Rule) }
    function Get-Act([string]$Action) { @($script:All.Plan.actions | Where-Object Action -EQ $Action) }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The call list (calls-ch07.json)' {
    It 'every task''s declared permissions and roles are exactly the union of its calls' {
        $list = Get-NpiLpCallList
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
    It 'the sweep holds only GETs and nothing ending in ReadWrite: Application.Read.All, Directory.Read.All, RoleManagement.Read.Directory and Reader' {
        foreach ($c in (Get-NpiLpCall -Task least-privilege)) {
            $c.method | Should -Be 'GET'
            foreach ($p in @($c.permissions)) { $p | Should -Not -Match 'ReadWrite' }
        }
        $p = Get-NpiLpRequiredPermission -Task least-privilege
        $p.GraphPermissions | Should -Be @('Application.Read.All', 'Directory.Read.All', 'RoleManagement.Read.Directory')
        $p.AzureRoles | Should -Be @('Reader')
    }
    It 'the write task is delegated only, Privileged Role Administrator, with one DELETE and one PATCH; every call names a Learn page and a stage' {
        $t = Get-NpiLpTask -Task least-privilege-apply
        $t.mode | Should -Be 'write'; $t.delegatedOnly | Should -BeTrue; $t.delegatedRole | Should -Be 'Privileged Role Administrator'
        (Get-NpiLpRequiredPermission -Task least-privilege-apply).Methods | Should -Be @('DELETE', 'GET', 'PATCH')
        @(Get-NpiLpCall | Where-Object { $_.method -eq 'DELETE' }).path | Should -Be '/servicePrincipals/{resourceId}/appRoleAssignedTo/{appRoleAssignmentId}'
        foreach ($c in (Get-NpiLpCall)) { $c.learn | Should -Match '^https://learn\.microsoft\.com/'; $c.stage | Should -Not -BeNullOrEmpty }
    }
}

Describe 'The sweep' {
    It 'refuses a register that changed since Chapter 01 wrote it' {
        $copy = Join-Path $script:Tmp 'tampered'
        Copy-Item -Recurse $script:InvRun $copy
        Add-Content -LiteralPath (Join-Path $copy 'register.json') -Value ' '
        { Import-NpiLpRegister -RunPath $copy } | Should -Throw '*doesn''t match its manifest*'
    }
    It 'reads only GETs, follows every page, and filters role assignments on the identity' {
        $t = New-TestSweep -PageSize 1
        @($t.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        @($t.Fake.Calls | Where-Object Uri -Match 'skiptoken').Count | Should -BeGreaterThan 0
        @($t.Fake.Calls | Where-Object Uri -Match '^https://management\.azure\.com/.*roleAssignments\?' | Where-Object Uri -NotMatch 'assignedTo').Count | Should -Be 0
        @($t.Sweep.Grants).Count | Should -Be @($script:All.Sweep.Grants).Count
    }
    It 'reads every resource''s app roles, not only Microsoft Graph''s' {
        $v = @($script:All.Sweep.Grants | Where-Object Name -EQ 'Vendor Portal')
        $v.Resource | Should -Be 'Office 365 Exchange Online'
        $v.Permission | Should -Be 'full_access_as_app'
    }
    It 'sweeps app registrations through their service principal, and leaves AI agent identities to Chapter 09' {
        @($script:All.Sweep.Identities).Count | Should -Be 11
        @($script:All.Sweep.Identities | Where-Object Type -EQ 'ServicePrincipal').Count | Should -Be 0
        ($script:All.Sweep.Identities | Where-Object Name -EQ 'Mail Automation').ServicePrincipalId | Should -Be '5b000000-0000-4000-8000-000000000006'
        @($script:All.Sweep.Skipped).Type | Sort-Object | Should -Be @('AgentIdentity', 'AgentIdentityBlueprint')
    }
    It 'names Azure roles, reads each scope once per identity, and classifies the scope' {
        $az = @($script:All.Sweep.Grants | Where-Object Kind -EQ 'AzureRole')
        $az.Count | Should -Be 5
        ($az | Where-Object Key -EQ 'azure:ra000000-0000-4000-8000-000000000003').ScopeLevel | Should -Be 'ManagementGroup'
        ($az | Where-Object Key -EQ 'azure:ra000000-0000-4000-8000-000000000001').Permission | Should -Be 'Storage Blob Data Reader'
        Get-NpiLpScopeLevel -Scope '/subscriptions/1/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv' | Should -Be 'Resource'
        Get-NpiLpScopeLevel -Scope '/' | Should -Be 'Root'
    }
}

Describe 'The reviewed list and its exceptions' {
    It 'NPI-LP-01: a broad application permission with no exception' {
        (Get-Lp 'NPI-LP-01').ObjectKey | Sort-Object | Should -Be @('app:5b000000-0000-4000-8000-000000000006:ar-01', 'app:5b000000-0000-4000-8000-000000000006:ar-07')
    }
    It 'NPI-LP-02: an exception that ended, or that names no justification' {
        (Get-Lp 'NPI-LP-02').Issue | Should -Match 'ended 2026-09-30'
        $bad = @($script:Exceptions | ForEach-Object { $_.PSObject.Copy() }); $bad[0].Justification = ''
        $c = Test-NpiLeastPrivilege -Sweep $script:All.Sweep -Exceptions $bad -AsOf $script:AsOf
        @($c.Findings | Where-Object { $_.Rule -eq 'NPI-LP-02' -and $_.Issue -match 'no Justification' }).Count | Should -Be 1
    }
    It 'NPI-LP-03: a broad delegated scope consented for all users; a grant for one person isn''t' {
        (Get-Lp 'NPI-LP-03').ObjectKey | Should -Be 'grant:og-01'
        (Get-Lp 'NPI-LP-03').Issue | Should -Match 'Mail\.Read'
    }
    It 'NPI-LP-04: Exchange RBAC named as the control while the Microsoft Entra grant stays; NPI-LP-05: the legacy access policy' {
        (Get-Lp 'NPI-LP-04').ObjectKey | Should -Be 'app:5b000000-0000-4000-8000-000000000006:ar-02'
        (Get-Lp 'NPI-LP-05').ObjectKey | Should -Be 'app:5b000000-0000-4000-8000-000000000005:ar-12'
        (Get-Lp 'NPI-LP-05').Severity | Should -Be 'Warn'
    }
    It 'NPI-LP-06 and -07: a managed identity''s role at subscription or management group scope, then at resource group scope' {
        (Get-Lp 'NPI-LP-06').ObjectKey | Sort-Object | Should -Be @('azure:ra000000-0000-4000-8000-000000000001', 'azure:ra000000-0000-4000-8000-000000000003')
        (Get-Lp 'NPI-LP-07').ObjectKey | Should -Be 'azure:ra000000-0000-4000-8000-000000000002'
    }
    It 'NPI-LP-08: a directory role, a permission that grants itself more, or a privileged Azure role hands the identity to the Privileged Access plan' {
        @($script:All.Check.Handoff).Name | Sort-Object | Should -Be @('Build Pipeline', 'Deploy Bot', 'id-deploy')
        ($script:All.Check.Handoff | Where-Object Name -EQ 'Deploy Bot').Reasons | Should -Match 'Cloud Application Administrator'
        ($script:All.Check.Handoff | Where-Object Name -EQ 'id-deploy').Reasons | Should -Match 'Contributor at subscription scope'
        # Their grants aren't swept here: no NPI-LP-01 for Deploy Bot's Application.ReadWrite.All.
        @($script:All.Check.Findings | Where-Object { $_.Rule -ne 'NPI-LP-08' -and $_.ObjectKey -match '5b000000-0000-4000-8000-00000000000(4|7)|000000000014' }).Count | Should -Be 0
    }
    It 'NPI-LP-09: an app role the resource doesn''t publish' {
        (Get-Lp 'NPI-LP-09').ObjectKey | Should -Be 'app:5b000000-0000-4000-8000-000000000003:ar-13'
    }
    It 'proposes Learn''s narrower replacement for each class' {
        $g = $script:All.Check.Grants
        ($g | Where-Object Key -Like '*:ar-10').Proposal | Should -Match 'Sites\.Selected'
        ($g | Where-Object Key -Like '*:ar-07').Proposal | Should -Match 'RBAC for Applications'
        ($g | Where-Object Key -Like '*:ar-01').Proposal | Should -Match 'resource-specific'
    }
    It 'gives every finding a stable ID, the same on every run' {
        foreach ($x in $script:All.Check.Findings) { $x.Id | Should -Be "$($x.Rule):$($x.ObjectKey)" }
        (Get-TestAll).Check.Findings.Id | Should -Be $script:All.Check.Findings.Id
    }
}

Describe 'The quarterly owner review' {
    It 'lists every grant of every swept identity but the handed-off ones, with its owners' {
        @($script:All.Review.Rows).Count | Should -Be 15
        @($script:All.Review.Rows | Where-Object Name -In 'Build Pipeline', 'Deploy Bot', 'id-deploy').Count | Should -Be 0
        ($script:All.Review.Rows | Where-Object Name -EQ 'Partner CRM').Owners | Should -Match 'Chapter 02'
    }
    It 'counts only decisions made this quarter' {
        $r = $script:All.Review.Rows | Where-Object Key -Like '*:ar-04'
        $r.Decision | Should -BeNullOrEmpty
        $r.LastDecision | Should -Match 'earlier quarter'
        $s = $script:All.Review.Status
        "$($s.Quarter) $($s.Rows) $($s.Decided) $($s.Open) $($s.ChangesPending) $($s.Closed)" | Should -Be '2026-Q4 15 9 6 4 False'
    }
    It 'closes when every row is decided and no change is still pending' {
        $keep = @($script:All.Review.Rows | ForEach-Object { [pscustomobject]@{ Key = $_.Key; Decision = 'Keep'; NewScope = ''; Replacement = ''; DecidedBy = 'alice@contoso.example'; DecidedOn = '2026-10-29' } })
        (New-NpiLpOwnerReview -Check $script:All.Check -Sweep $script:All.Sweep -Decisions $keep -AsOf $script:AsOf).Status.Closed | Should -BeTrue
    }
}

Describe 'The plan' {
    It 'removes a broad app role through its resource service principal, and narrows a delegated grant' {
        (Get-Act 'RemoveAppRole').Target | Sort-Object | Should -Be @(
            'https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000010/appRoleAssignedTo/ar-01',
            'https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000010/appRoleAssignedTo/ar-10')
        (Get-Act 'NarrowGrant').Body.scope | Should -Be 'User.Read'
        (Get-Act 'NarrowGrant').Precheck.FromScope | Should -Be 'User.Read Mail.Read'
    }
    It 'writes nothing for the rest: hand-offs, kept grants, open decisions, Azure re-scoping' {
        @($script:All.Plan.actions | Where-Object Write).Count | Should -Be 3
        (Get-Act 'HandedOff').Count | Should -Be 3
        (Get-Act 'Kept').Count | Should -Be 2
        (Get-Act 'AwaitOwnerDecision').Key | Sort-Object | Should -Be @('app:5b000000-0000-4000-8000-000000000006:ar-07', 'azure:ra000000-0000-4000-8000-000000000003')
        (Get-Act 'RescopeByOwner').Key | Should -Be 'azure:ra000000-0000-4000-8000-000000000001'
    }
    It 'waits for the replacement before removing the broad permission' {
        $d = @($script:Decisions | ForEach-Object { $_.PSObject.Copy() }); ($d | Where-Object Key -Like '*:ar-10').Replacement = 'Lists.SelectedOperations.Selected'
        $p = (Get-TestAll -Decisions $d).Plan
        ($p.actions | Where-Object Key -Like '*:ar-10').Action | Should -Be 'AwaitReplacement'
    }
    It 'refuses a narrowing that adds a scope, a narrowing of an app role, and keeping a broad grant with no exception' {
        $d = @($script:Decisions | ForEach-Object { $_.PSObject.Copy() })
        ($d | Where-Object Key -EQ 'grant:og-01').NewScope = 'User.Read Files.Read'
        ($d | Where-Object Key -Like '*:ar-01').Decision = 'Narrow'
        $d += [pscustomobject]@{ Key = 'app:5b000000-0000-4000-8000-000000000006:ar-07'; Decision = 'Keep'; NewScope = ''; Replacement = ''; DecidedBy = 'alice@contoso.example'; DecidedOn = '2026-10-24' }
        $p = (Get-TestAll -Decisions $d).Plan
        ($p.actions | Where-Object Key -EQ 'grant:og-01').Reason | Should -Match 'Files\.Read isn''t granted'
        ($p.actions | Where-Object Key -Like '*:ar-01').Action | Should -Be 'DecisionRefused'
        ($p.actions | Where-Object Key -Like '*:ar-07').Action | Should -Be 'KeepNeedsException'
    }
    It 'is deterministic for the same inputs, so its SHA-256 can be approved' {
        (Save-TestPlan (Get-TestAll).Plan).Sha | Should -Be (Save-TestPlan $script:All.Plan).Sha
    }
}

Describe 'The separate write path' {
    BeforeAll { $script:Saved = Save-TestPlan $script:All.Plan }
    It 'refuses a plan nobody approved, for another tenant, or older than seven days' {
        $w = New-TestWriter
        { Invoke-NpiLpPlan -PlanPath $script:Saved.Path -ApprovedSha256 ('0' * 64) -Writer $w.Writer -AsOf $script:AsOf } | Should -Throw '*nobody reviewed*'
        $other = New-NpiLpWriter -Cloud gcc -TenantId '0e0e0e0e-0000-4000-8000-000000000099' -Invoke $w.Fake.Invoke
        { Invoke-NpiLpPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $other -AsOf $script:AsOf } | Should -Throw '*is for tenant*'
        { Invoke-NpiLpPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
    }
    It 'a dry run sends nothing but the prechecks' {
        $w = New-TestWriter
        $run = Invoke-NpiLpPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf
        $run.Results.Outcome | Sort-Object -Unique | Should -Be 'WouldSend'
        @($w.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It '-Apply sends exactly the planned writes; they land, and every service principal stays' {
        $w = New-TestWriter
        $before = @($w.Fake.Estate.graph.resourceServicePrincipals).Count
        $run = Invoke-NpiLpPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf -Apply
        @($run.Results | Where-Object Outcome -EQ 'Sent').Count | Should -Be 3
        @($w.Fake.Calls | Where-Object Method -NE 'GET').Method | Sort-Object | Should -Be @('DELETE', 'DELETE', 'PATCH')
        @($w.Fake.Estate.graph.appRoleAssignments | Where-Object id -In 'ar-01', 'ar-10').Count | Should -Be 0
        @($w.Fake.Estate.graph.appRoleAssignments | Where-Object id -EQ 'ar-11').Count | Should -Be 1
        ($w.Fake.Estate.graph.oauth2PermissionGrants | Where-Object id -EQ 'og-01').scope | Should -Be 'User.Read'
        @($w.Fake.Estate.graph.resourceServicePrincipals).Count | Should -Be $before
    }
    It 'skips a removal already made, one whose replacement went, and a grant that changed since review' {
        $w = New-TestWriter
        $g = $w.Fake.Estate.graph
        $g.appRoleAssignments = @($g.appRoleAssignments | Where-Object { $_.id -notin 'ar-01', 'ar-11' })
        ($g.oauth2PermissionGrants | Where-Object id -EQ 'og-01').scope = 'User.Read Mail.Read Files.Read'
        $run = Invoke-NpiLpPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf -Apply
        $run.Results.Outcome | Sort-Object -Unique | Should -Be 'Skipped'
        ($run.Results | Where-Object ActionId -Like '*:ar-10').Detail | Should -Match 'Sites\.Selected is no longer granted'
        @($w.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'refuses a write the call list doesn''t allow: deleting a service principal, removing through the client, another body, a wider scope' {
        $w = New-TestWriter
        $rm = (Get-Act 'RemoveAppRole')[0]; $nw = (Get-Act 'NarrowGrant')[0]
        $mk = { param($base, [hashtable]$o) $a = $base.PSObject.Copy(); foreach ($k in $o.Keys) { $a.$k = $o[$k] }; $a }
        { Assert-NpiLpPlannedWrite -Writer $w.Writer -Action (& $mk $rm @{ Target = 'https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000006' }) } | Should -Throw '*never a service principal*'
        { Assert-NpiLpPlannedWrite -Writer $w.Writer -Action (& $mk $rm @{ Target = 'https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000006/appRoleAssignedTo/ar-01' }) } | Should -Throw '*resource service principal*'
        { Assert-NpiLpPlannedWrite -Writer $w.Writer -Action (& $mk $nw @{ Body = [ordered]@{ scope = 'User.Read'; consentType = 'AllPrincipals' } }) } | Should -Throw '*only body allowed*'
        { Assert-NpiLpPlannedWrite -Writer $w.Writer -Action (& $mk $nw @{ Body = [ordered]@{ scope = 'User.Read Mail.Read Files.Read' } }) } | Should -Throw '*smaller subset*'
        { Assert-NpiLpPlannedWrite -Writer $w.Writer -Action (& $mk $rm @{ Call = 'graph-sp-delete' }) } | Should -Throw '*isn''t declared*'
    }
}

Describe 'The entry scripts' {
    BeforeAll {
        $script:LpOut = Join-Path $script:Tmp 'least-privilege'
        $script:Console = & (Join-Path $script:Root 'Invoke-NpiLeastPrivilege.ps1') -Cloud gcc -RegisterRun $script:InvRun -FixturePath $script:Fixture -InputPath $script:Inputs -OutputPath $script:LpOut
    }
    It 'prints the counts Lab 1 shows, and the plan''s SHA-256' {
        $script:Console[0] | Should -Be 'Sweep: 11 service principals, 20 grants (12 Application, 5 AzureRole, 3 Delegated); 2 skipped; 3 handed to the Privileged Access plan'
        $script:Console[1] | Should -Be 'Findings: 7 Finding, 3 Warn, 3 Info'
        $script:Console[2] | Should -Be 'Owner review 2026-Q4: 15 rows, 9 decided, 6 open, 4 changes pending; closed: False'
        $script:Console[3] | Should -Be 'Plan: 11 actions, 3 of them writes (1 NarrowGrant, 2 RemoveAppRole); nothing sent'
        $script:Console[4] | Should -Be "Plan SHA-256: $(Get-NpiFileHash -Path (Join-Path $script:LpOut 'lp-plan.json'))"
    }
    It 'the manifest records the register''s and the inputs'' SHA-256 and the permissions held' {
        $m = Get-Content (Join-Path $script:LpOut 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
        $m.registerSha256 | Should -Be $script:Register.Sha256
        @($m.inputs.Keys | Sort-Object) | Should -Be @('azure-scopes.csv', 'owner-decisions.csv', 'permission-exceptions.csv')
        $m.graphPermissions | Should -Be @('Application.Read.All', 'Directory.Read.All', 'RoleManagement.Read.Directory')
    }
    It 'the action script dry-runs, applies, and refuses a hash nobody approved' {
        $plan = Join-Path $script:LpOut 'lp-plan.json'; $sha = Get-NpiFileHash -Path $plan
        $dry = & (Join-Path $script:Root 'Invoke-NpiLeastPrivilegeAction.ps1') -Cloud gcc -PlanPath $plan -ApprovedSha256 $sha -FixturePath $script:Fixture -OutputPath (Join-Path $script:Tmp 'lp-dry')
        $dry[0] | Should -Be 'DryRun: 3 WouldSend'
        $app = & (Join-Path $script:Root 'Invoke-NpiLeastPrivilegeAction.ps1') -Cloud gcc -PlanPath $plan -ApprovedSha256 $sha -FixturePath $script:Fixture -OutputPath (Join-Path $script:Tmp 'lp-apply') -Apply
        $app[0] | Should -Be 'Apply: 3 Sent'
        { & (Join-Path $script:Root 'Invoke-NpiLeastPrivilegeAction.ps1') -Cloud gcc -PlanPath $plan -ApprovedSha256 ('0' * 64) -FixturePath $script:Fixture -OutputPath (Join-Path $script:Tmp 'lp-x') } | Should -Throw '*nobody reviewed*'
    }
    It 'refuses a register read in another cloud' {
        { & (Join-Path $script:Root 'Invoke-NpiLeastPrivilege.ps1') -Cloud gcchigh -RegisterRun $script:InvRun -FixturePath $script:Fixture -InputPath $script:Inputs -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw '*not ''gcchigh''*'
    }
}
