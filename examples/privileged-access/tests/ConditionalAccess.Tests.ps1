#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 03: Conditional Access for administrators and the activation gate. Microsoft's template,
# as Learn publishes it (pinned in examples/third_party/conditional-access-template-page), then the
# pre-merge check, the plan and its dry run, against the fictional tenant served by a fake.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/PaConditionalAccess/PaConditionalAccess.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:PolicyPath = Join-Path $script:Root 'ca-policies'
    $script:MapPath = Join-Path $PSScriptRoot 'fixtures/ch03/tenant-map.json'
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/ch03/tenant.json'
    $script:Page = Join-Path $PSScriptRoot '../../third_party/conditional-access-template-page/conditionalaccesstemplate-get.md'
    $script:Ea = '9e000000-0000-4000-8000-000000000001'

    # Learn's example response, extracted unmodified from the pinned page.
    function Get-LearnTemplate { Read-PaCaTemplatePage -Path $script:Page }
    # One body checked as if it were a file in the repository.
    function Test-WithPolicy([System.Collections.IDictionary]$Body, [string]$Name = 'learn-template') { Test-PaCaPolicyBody -Body $Body -Repository (Get-Repo) -Name $Name }
    function Get-Repo { Read-PaCaRepository -Path $script:PolicyPath -MapPath $script:MapPath }
    function Get-Body($repo, $name) { ($repo.Objects | Where-Object Name -EQ $name).Body }
    function New-Run([switch]$Apply, $Fake) {
        if (-not $Fake) { $Fake = New-PaCaFixtureInvoker -Path $script:Fixture -Cloud gcc }
        [pscustomobject]@{ Fake = $Fake; Client = (New-PaCaClient -Cloud gcc -Invoke $Fake.Invoke -Apply:$Apply) }
    }
}

Describe 'Chapter 03: "Get conditionalAccessTemplate" (Learn), as published' {
    BeforeAll {
        $script:Tpl = Get-LearnTemplate
        $script:TplFindings = Test-WithPolicy (ConvertFrom-PaCaTemplate -Template $script:Tpl)
    }
    It 'is Microsoft''s "Require multifactor authentication for admins" template, in a response Learn marks as shortened' {
        $script:Tpl.name | Should -Be 'Require multifactor authentication for admins'
        $script:Tpl.scenarios | Should -Match 'protectAdmins'
        Get-Content -LiteralPath $script:Page -Raw | Should -Match '"truncated": true'
    }
    It 'carries no state: nothing in it says to start in report-only' {
        $script:Tpl.ContainsKey('state') | Should -BeFalse
        $script:Tpl.details.ContainsKey('state') | Should -BeFalse
    }
    It 'excludes display text, "Current administrator will be excluded", where an object ID belongs (PA-CA-03)' {
        $script:Tpl.details.conditions.users.excludeUsers | Should -Be @('Current administrator will be excluded')
        @($script:TplFindings | Where-Object { $_.Rule -eq 'PA-CA-03' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
    }
    It 'doesn''t exclude the emergency access group (PA-CA-01)' {
        $script:Tpl.details.conditions.users.excludeGroups.Count | Should -Be 0
        @($script:TplFindings | Where-Object { $_.Rule -eq 'PA-CA-01' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
    }
    It 'targets 2 roles, not the 14 Learn recommends (PA-CA-07)' {
        $script:Tpl.details.conditions.users.includeRoles.Count | Should -Be 2
        ($script:TplFindings | Where-Object Rule -EQ 'PA-CA-07').Message | Should -Match 'leaves out 12 of the 14'
    }
    It 'grants plain MFA, with no authentication strength (PA-CA-06)' {
        $script:Tpl.details.grantControls.builtInControls | Should -Be @('mfa')
        $script:Tpl.details.grantControls.authenticationStrength | Should -BeNullOrEmpty
        @($script:TplFindings | Where-Object { $_.Rule -eq 'PA-CA-06' -and $_.Severity -eq 'Warn' }).Count | Should -Be 1
    }
    It 'targets no authentication context: the activation gate isn''t in it' {
        $script:Tpl.details.conditions.applications.includeAuthenticationContextClassReferences.Count | Should -Be 0
    }
}

Describe 'Calls and permissions' {
    It 'reads with three permissions, none of them a write' {
        (Get-PaCaRequiredPermission -Task ca-read).GraphPermissions | Should -Be @('AuthenticationContext.Read.All', 'Policy.Read.All', 'Policy.Read.AuthenticationMethod')
    }
    It 'adds Policy.ReadWrite.ConditionalAccess and AuthenticationContext.ReadWrite.All only for -Apply' {
        (Get-PaCaRequiredPermission -Task ca-apply).GraphPermissions | Should -Be @('AuthenticationContext.Read.All', 'AuthenticationContext.ReadWrite.All', 'Policy.Read.All', 'Policy.Read.AuthenticationMethod', 'Policy.ReadWrite.ConditionalAccess')
    }
    It 'declares GETs only for ca-read, v1.0 only, a Learn page for each, and no DELETE anywhere' {
        @(Get-PaCaCall -Task ca-read | Where-Object method -NE 'GET').Count | Should -Be 0
        foreach ($c in Get-PaCaCall) {
            $c.version | Should -Be 'v1.0'
            $c.learn | Should -Match '^https://learn\.microsoft\.com/'
            $c.method | Should -Not -Be 'DELETE'
        }
    }
    It 'has no default cloud and uses the cloud''s own Graph host' {
        { New-PaCaClient -Cloud GCCHigh -Invoke {} } | Should -Throw '*Unknown cloud*'
        (New-PaCaClient -Cloud gcchigh -Invoke {}).Cloud.Graph | Should -Be 'https://graph.microsoft.us'
        (New-PaCaClient -Cloud gcc -Invoke {}).Cloud.Graph | Should -Be 'https://graph.microsoft.com'
    }
    It 'refuses a write on a client made without -Apply' {
        $c = New-PaCaClient -Cloud gcc -Invoke {}
        { Invoke-PaCaList -Client $c -CallId 'ca-policy-create' } | Should -Throw '*Undeclared call*'
    }
    It 'refuses to follow a next link to another host' {
        $c = New-PaCaClient -Cloud gcc -Invoke { param($m, $u, $b) @{ value = @(); '@odata.nextLink' = 'https://attacker.example/v1.0/x' } }
        { Invoke-PaCaList -Client $c -CallId 'ca-policies' } | Should -Throw '*Refusing to send the token*'
    }
}

Describe 'Test-PaCaRepository: the pre-merge check' {
    It 'passes the repository: no Finding, five Warn' {
        $f = @(Test-PaCaRepository -Repository (Get-Repo))
        @($f | Where-Object Severity -EQ 'Finding').Count | Should -Be 0
        @($f | Where-Object { $_.Rule -eq 'PA-CA-04' }).Object | Should -Be @('PIM-Activation-c1', 'ProtectedActions-c2')
        @($f | Where-Object { $_.Rule -eq 'PA-CA-09' }).Count | Should -Be 3
        @($f).Count | Should -Be 5
    }
    It 'resolves every placeholder but the strength, which the plan resolves from the tenant' {
        $repo = Get-Repo
        $repo.EmergencyGroupId | Should -Be $script:Ea
        (Get-Body $repo 'CA005-Admins-BlockUntrustedLocations').conditions.locations.excludeLocations | Should -Be @('1c000000-0000-4000-8000-000000000001')
        (Get-Body $repo 'CA003-Admins-RequirePhishResistantMFA').grantControls.authenticationStrength.id | Should -Be '{strength:FMP-Privileged-SeparateDevice}'
    }
    It 'fails a report-only policy without the emergency exclusion (PA-CA-01): the file is what gets enforced later' {
        $b = Get-Body (Get-Repo) 'CA004-Admins-RequireCompliantDevice'
        $b.conditions.users.excludeGroups = @()
        @(Test-WithPolicy $b 'CA004-copy' | Where-Object { $_.Rule -eq 'PA-CA-01' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
    }
    It 'passes a disabled policy without the exclusion' {
        $b = Get-Body (Get-Repo) 'CA004-Admins-RequireCompliantDevice'
        $b.conditions.users.excludeGroups = @(); $b.state = 'disabled'
        @(Test-WithPolicy $b 'CA004-copy' | Where-Object Rule -EQ 'PA-CA-01').Count | Should -Be 0
    }
    It 'reports a named report-only instrument as Info, and fails it once enabled (PA-CA-02)' {
        $repo = Get-Repo
        $repo.ReportOnlyInstruments = @('CA090-AllUsers-ReportOnly-CoverageProbe')
        $text = '{ "displayName": "CA090-AllUsers-ReportOnly-CoverageProbe", "state": "enabledForReportingButNotEnforced", "conditions": { "users": { "includeUsers": ["All"] }, "applications": { "includeApplications": ["All"] }, "clientAppTypes": ["all"] }, "grantControls": { "operator": "OR", "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000004" } } }'
        $o = [pscustomobject]@{ Kind = 'policy'; Name = 'CA090-AllUsers-ReportOnly-CoverageProbe'; File = 'policies/CA090.json'; Text = $text; Body = ($text | ConvertFrom-Json -AsHashtable) }
        $repo.Objects = @($repo.Objects) + $o
        (Test-PaCaRepository -Repository $repo | Where-Object Rule -EQ 'PA-CA-01').Severity | Should -Be 'Info'
        $o.Body.state = 'enabled'
        @(Test-PaCaRepository -Repository $repo | Where-Object { $_.Rule -eq 'PA-CA-02' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
    }
    It 'fails an authentication context policy that also targets directory roles (PA-CA-05)' {
        $b = Get-Body (Get-Repo) 'PIM-Activation-c1'
        $b.conditions.users.includeRoles = @('62e90394-69f5-4237-9190-012177145e10')
        @(Test-WithPolicy $b 'PIM-copy' | Where-Object { $_.Rule -eq 'PA-CA-05' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
    }
    It 'fails MFA and an authentication strength in one policy (PA-CA-06)' {
        $b = Get-Body (Get-Repo) 'CA003-Admins-RequirePhishResistantMFA'
        $b.grantControls.builtInControls = @('mfa')
        @(Test-WithPolicy $b 'CA003-copy' | Where-Object { $_.Rule -eq 'PA-CA-06' -and $_.Severity -eq 'Finding' }).Count | Should -Be 1
    }
    It 'keeps CA003 on all 14 roles Learn recommends' {
        @(Test-PaCaRepository -Repository (Get-Repo) | Where-Object Rule -EQ 'PA-CA-07').Count | Should -Be 0
    }
    It 'fails a context outside c1 to c25, and a policy naming a context the repository doesn''t define (PA-CA-08)' {
        $repo = Get-Repo
        ($repo.Objects | Where-Object Name -EQ 'c2').Name = 'c30'
        $f = @(Test-PaCaRepository -Repository $repo | Where-Object Rule -EQ 'PA-CA-08')
        $f.Object | Should -Contain 'c30'
        $f.Object | Should -Contain 'ProtectedActions-c2'
    }
    It 'fails an unresolved placeholder (PA-CA-03)' {
        $map = Join-Path ([IO.Path]::GetTempPath()) "pa-ca-map-$([guid]::NewGuid().Guid.Substring(0,8)).json"
        $m = Get-Content $script:MapPath -Raw | ConvertFrom-Json -AsHashtable; $m.Remove('{location:NL-TrustedNetworks}')
        $m | ConvertTo-Json | Set-Content $map
        try {
            $f = @(Test-PaCaRepository -Repository (Read-PaCaRepository -Path $script:PolicyPath -MapPath $map) | Where-Object Rule -EQ 'PA-CA-03')
            $f.Object | Should -Be @('CA005-Admins-BlockUntrustedLocations')
        } finally { Remove-Item $map }
    }
}

Describe 'Get-PaCaPlan and Invoke-PaCaPlan against the fake' {
    It 'plans the fixture: contexts and the strength first, three policies blocked on them, CA001 reported, nothing deleted' {
        $r = New-Run
        $plan = @(Get-PaCaPlan -Repository (Get-Repo) -Tenant (Get-PaCaTenant -Client $r.Client))
        ($plan | Where-Object Name -EQ 'c1').Action | Should -Be 'Create'
        ($plan | Where-Object Name -EQ 'c2').Changes | Should -Be @('description')
        ($plan | Where-Object Kind -EQ 'strength').Action | Should -Be 'Create'
        @($plan | Where-Object Action -EQ 'Blocked').Name | Should -Be @('CA003-Admins-RequirePhishResistantMFA', 'PIM-Activation-c1', 'ProtectedActions-c2')
        ($plan | Where-Object Name -EQ 'CA004-Admins-RequireCompliantDevice').Action | Should -Be 'Update'
        ($plan | Where-Object Name -EQ 'CA005-Admins-BlockUntrustedLocations').Action | Should -Be 'NoChange'
        ($plan | Where-Object Name -EQ 'CA001-AllUsers-BlockLegacyAuth').Action | Should -Be 'NotInRepository'
    }
    It 'sends nothing on a dry run: five GETs, every page, and six requests written' {
        $r = New-Run
        $repo = Get-Repo
        $plan = @(Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $r.Client))
        $req = @(Invoke-PaCaPlan -Client $r.Client -Plan $plan -Findings @() -EmergencyGroupId $repo.EmergencyGroupId)
        $req.Count | Should -Be 6
        @($req | Where-Object Sent).Count | Should -Be 0
        @($r.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        @($r.Fake.Calls).Count | Should -Be 5
    }
    It 'patches only the changed top-level property of an existing policy' {
        $r = New-Run
        $plan = @(Get-PaCaPlan -Repository (Get-Repo) -Tenant (Get-PaCaTenant -Client $r.Client))
        @(($plan | Where-Object Name -EQ 'CA004-Admins-RequireCompliantDevice').Body.Keys) | Should -Be @('sessionControls')
    }
    It 'creates a policy report-only even when its file says enabled' {
        $r = New-Run; $repo = Get-Repo
        (Get-Body $repo 'CA025-Admins-BlockNonPAW').state = 'enabled'
        $row = Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $r.Client) | Where-Object Name -EQ 'CA025-Admins-BlockNonPAW'
        $row.Body.state | Should -Be 'enabledForReportingButNotEnforced'
        $row.Note | Should -Match 'enforce it in a later run with -AllowEnforce'
    }
    It 'holds an enforcement without -AllowEnforce, and sends it with' {
        $r = New-Run; $repo = Get-Repo
        (Get-Body $repo 'CA005-Admins-BlockUntrustedLocations').state = 'enabled'
        $t = Get-PaCaTenant -Client $r.Client
        (Get-PaCaPlan -Repository $repo -Tenant $t | Where-Object Name -EQ 'CA005-Admins-BlockUntrustedLocations').Action | Should -Be 'Held'
        $row = Get-PaCaPlan -Repository $repo -Tenant $t -AllowEnforce | Where-Object Name -EQ 'CA005-Admins-BlockUntrustedLocations'
        $row.Action | Should -Be 'Update'
        $row.Body.state | Should -Be 'enabled'
    }
    It 'applies in two runs: the strength and contexts first, then the policies that need them, then nothing' {
        $fake = New-PaCaFixtureInvoker -Path $script:Fixture -Cloud gcc
        $repo = Get-Repo; $findings = @(Test-PaCaRepository -Repository $repo)
        $sent = foreach ($pass in 1..3) {
            $c = New-PaCaClient -Cloud gcc -Invoke $fake.Invoke -Apply
            $plan = @(Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $c))
            @(Invoke-PaCaPlan -Client $c -Plan $plan -Findings $findings -EmergencyGroupId $repo.EmergencyGroupId | Where-Object Sent).Count
        }
        $sent | Should -Be @(6, 3, 0)
        $p = $fake.Tenant.policies | Where-Object displayName -EQ 'PIM-Activation-c1'
        $p.state | Should -Be 'enabledForReportingButNotEnforced'
        $p.grantControls.authenticationStrength.id | Should -Match '^a5000000-'
        @($fake.Calls | Where-Object Method -EQ 'DELETE').Count | Should -Be 0
        ($fake.Tenant.policies | Where-Object displayName -EQ 'CA001-AllUsers-BlockLegacyAuth').state | Should -Be 'enabled'
    }
    It 'refuses -Apply while the pre-merge check has a Finding' {
        $r = New-Run -Apply; $repo = Get-Repo
        $plan = @(Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $r.Client))
        $bad = [pscustomobject]@{ Rule = 'PA-CA-01'; Severity = 'Finding' }
        { Invoke-PaCaPlan -Client $r.Client -Plan $plan -Findings @($bad) -EmergencyGroupId $repo.EmergencyGroupId } | Should -Throw '*pre-merge check*'
        @($r.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
    }
    It 'refuses -Apply when a policy it would write leaves out the emergency group' {
        $r = New-Run -Apply
        $row = [pscustomobject]@{ Kind = 'policy'; Name = 'X'; Action = 'Create'; CallId = 'ca-policy-create'; Bind = @{}; Body = @{ state = 'enabledForReportingButNotEnforced'; conditions = @{ users = @{ includeUsers = @('All'); excludeGroups = @() } } } }
        { Invoke-PaCaPlan -Client $r.Client -Plan @($row) -Findings @() -EmergencyGroupId $script:Ea } | Should -Throw '*without the emergency access exclusion*'
    }
}

Describe 'Invoke-PaCaAdmin.ps1' {
    BeforeAll {
        $script:Out = Join-Path ([IO.Path]::GetTempPath()) "pa-ca-$([guid]::NewGuid().Guid.Substring(0,8))"
        $script:Lines = & (Join-Path $script:Root 'Invoke-PaCaAdmin.ps1') -Cloud gcc -MapPath $script:MapPath -FixturePath $script:Fixture -OutputPath $script:Out
    }
    AfterAll { Remove-Item -Recurse -Force $script:Out -ErrorAction SilentlyContinue }
    It 'prints the check, the plan and the dry run' {
        $script:Lines | Should -Contain 'Pre-merge check: 0 Finding, 5 Warn, 0 Info'
        $script:Lines | Should -Contain 'Plan: 3 Blocked, 4 Create, 1 NoChange, 1 NotInRepository, 2 Update'
        ($script:Lines -join "`n") | Should -Match 'Dry run: 6 request\(s\)'
    }
    It 'writes a manifest of GETs only, the read permissions and each file''s hash' {
        $m = Get-Content (Join-Path $script:Out 'manifest.json') -Raw | ConvertFrom-Json
        $m.mode | Should -Be 'Fixture-DryRun'
        $m.task | Should -Be 'ca-read'
        @($m.requests | Where-Object method -NE 'GET').Count | Should -Be 0
        $m.graphPermissions | Should -Not -Contain 'Policy.ReadWrite.ConditionalAccess'
        foreach ($p in $m.files.PSObject.Properties) { (Get-FileHash (Join-Path $script:Out $p.Name) -Algorithm SHA256).Hash.ToLowerInvariant() | Should -Be $p.Value }
    }
    It 'needs a cloud named outright' {
        { & (Join-Path $script:Root 'Invoke-PaCaAdmin.ps1') -MapPath $script:MapPath -FixturePath $script:Fixture -OutputPath $script:Out } | Should -Throw '*There is no default*'
    }
    It 'exits 1 from -CheckOnly when a file has a Finding' {
        $copy = Join-Path ([IO.Path]::GetTempPath()) "pa-ca-pol-$([guid]::NewGuid().Guid.Substring(0,8))"
        Copy-Item -Recurse $script:PolicyPath $copy
        $f = Join-Path $copy 'policies/CA004-Admins-RequireCompliantDevice.json'
        (Get-Content $f -Raw).Replace('"excludeGroups": ["{group:CA-Exclude-EmergencyAccess}"]', '"excludeGroups": []') | Set-Content $f
        try {
            $null = pwsh -NoProfile -File (Join-Path $script:Root 'Invoke-PaCaAdmin.ps1') -CheckOnly -MapPath $script:MapPath -PolicyPath $copy
            $LASTEXITCODE | Should -Be 1
        } finally { Remove-Item -Recurse -Force $copy }
    }
}
