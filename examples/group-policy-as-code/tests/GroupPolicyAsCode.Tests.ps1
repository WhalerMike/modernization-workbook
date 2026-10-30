#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Fixture tests for examples/group-policy-as-code. No tenant, no network, no Graph module: every
# Graph call goes to the fake in New-GpcFixtureInvoke, which serves tests/fixtures/tenant.json.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/GroupPolicyAsCode.psm1') -Force
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/tenant.json'
    $script:LibraryPath = Join-Path $PSScriptRoot '../policies'
    $script:P = 'device_vendor_msft_policy_config_'
    function New-Graph([int]$PageSize = 50) { New-GpcFixtureInvoke -Path $script:Fixture -PageSize $PageSize }
    function Get-Library { @(Read-GpcLibrary -Path $script:LibraryPath) }
    # A copy of the shipped library in a temporary folder, changed by -Change { param($files) ... }.
    function New-TempLibrary([scriptblock]$Change) {
        $dir = Join-Path ([IO.Path]::GetTempPath()) ('gpc-lib-' + [guid]::NewGuid().Guid.Substring(0, 8))
        New-Item -ItemType Directory -Path $dir | Out-Null
        $files = [ordered]@{}
        foreach ($f in Get-ChildItem $script:LibraryPath -Filter *.json) { $files[$f.Name] = Get-Content $f.FullName -Raw | ConvertFrom-Json -AsHashtable -Depth 100 }
        if ($Change) { & $Change $files }
        foreach ($k in $files.Keys) { [IO.File]::WriteAllText((Join-Path $dir $k), ($files[$k] | ConvertTo-Json -Depth 100)) }
        $dir
    }
    function Get-Rules($Findings, [string]$Severity) { @($Findings | Where-Object Severity -EQ $Severity | ForEach-Object Rule | Sort-Object -Unique) }
}

Describe 'Clouds and permissions' {
    It 'uses the worldwide Graph for GCC and the separate hosts for GCC High and DoD' {
        (Get-GpcCloud gcc).GraphHost | Should -Be 'https://graph.microsoft.com'
        (Get-GpcCloud global).Environment | Should -Be 'Global'
        (Get-GpcCloud gcchigh).GraphHost | Should -Be 'https://graph.microsoft.us'
        (Get-GpcCloud gcchigh).Environment | Should -Be 'USGov'
        (Get-GpcCloud dod).GraphHost | Should -Be 'https://dod-graph.microsoft.us'
        (Get-GpcCloud dod).Environment | Should -Be 'USGovDoD'
    }
    It 'refuses a cloud name it does not know instead of falling back to worldwide' {
        { Get-GpcCloud 'usgovhigh' } | Should -Throw '*Unknown cloud*'
    }
    It 'asks for Read.All for the plan and the dry run, and ReadWrite.All only to apply' {
        Get-GpcRequiredScope Plan | Should -Be 'DeviceManagementConfiguration.Read.All'
        Get-GpcRequiredScope DryRun | Should -Be 'DeviceManagementConfiguration.Read.All'
        Get-GpcRequiredScope Apply | Should -Be 'DeviceManagementConfiguration.ReadWrite.All'
    }
}

Describe 'Move plan from Group Policy analytics' {
    BeforeAll {
        $script:G = New-Graph -PageSize 2
        $script:Plan = @(Get-GpcMovePlan -Invoke $G.Invoke)
    }
    It 'has one row per imported setting across every report, following @odata.nextLink' {
        $Plan.Count | Should -Be 11
        @($G.Calls | Where-Object Uri -Match 'skiptoken').Count | Should -BeGreaterThan 0
    }
    It 'reads with GET only, from the beta Group Policy analytics endpoints' {
        @($G.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        $G.Calls[0].Uri | Should -Be 'https://graph.microsoft.com/beta/deviceManagement/groupPolicyMigrationReports'
        @($G.Calls | Where-Object Uri -Match '/gpr-1/groupPolicySettingMappings').Count | Should -BeGreaterThan 0
    }
    It 'gives each setting a disposition' {
        ($Plan | Where-Object Disposition -EQ 'Candidate').Setting | Should -Be @('Disable Windows Error Reporting', 'Allow crash dump', 'Allow live dump', 'Sign-in and lock last interactive user automatically after a restart', 'Prohibit access to Control Panel and PC settings')
        ($Plan | Where-Object Disposition -EQ 'EndpointSecurity').Setting | Should -Be 'Inbound rule: Contoso line-of-business app'
        @($Plan | Where-Object Disposition -EQ 'NotSupported').Count | Should -Be 2
        ($Plan | Where-Object Disposition -EQ 'Deprecated').Setting | Should -Be 'Turn off Internet Explorer 11 First Run'
    }
    It 'marks a setting two GPOs set to different values as a Conflict, with both values' {
        $c = @($Plan | Where-Object Disposition -EQ 'Conflict')
        $c.Count | Should -Be 2
        $c.DefinitionId | Sort-Object -Unique | Should -Be "${P}power_allowhibernate"
        $c[0].Note | Should -Be 'FMP-Workstation-Baseline=Disabled; Workstation-Power=Enabled'
    }
    It 'keeps the scope, so user settings can go to user groups' {
        ($Plan | Where-Object Setting -EQ 'Prohibit access to Control Panel and PC settings').Scope | Should -Be 'user'
    }
    It 'reads from the cloud it is given' {
        $g2 = New-Graph
        Get-GpcMovePlan -Invoke $g2.Invoke -Cloud gcchigh | Out-Null
        @($g2.Calls | Where-Object { $_.Uri -notlike 'https://graph.microsoft.us/*' }).Count | Should -Be 0
    }
}

Describe 'Library lint' {
    It 'passes the shipped library with no finding or warning' {
        $f = @(Test-GpcLibrary -Library (Get-Library))
        @($f | Where-Object Severity -In 'Finding', 'Warn').Count | Should -Be 0
    }
    It 'GPC-01: requires owner, configOwner, source GPOs, decisions and a complete policy body' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-201-error-reporting-and-dumps.json'].Remove('owner'); $f['fmp-sc-201-error-reporting-and-dumps.json'].sourceGpos = @() }
        $r = @(Test-GpcLibrary -Library (Read-GpcLibrary $dir) | Where-Object Rule -EQ 'GPC-01')
        $r.Issue | Should -Be 'Missing: owner, sourceGpos'
    }
    It 'GPC-02: refuses a setting another tool owns (config_owner)' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-202-sign-in-and-power.json'].configOwner = 'Ansible' }
        Get-Rules (Test-GpcLibrary -Library (Read-GpcLibrary $dir)) Finding | Should -Be 'GPC-02'
    }
    It 'GPC-03: refuses service-set properties instead of stripping them' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.id = 'abc'; $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.settingCount = 3 }
        (Test-GpcLibrary -Library (Read-GpcLibrary $dir) | Where-Object Rule -EQ 'GPC-03').Issue | Should -Match 'id, settingCount'
    }
    It 'GPC-04: refuses assignments in the body' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.assignments = @(@{ target = @{ '@odata.type' = '#microsoft.graph.allDevicesAssignmentTarget' } }) }
        Get-Rules (Test-GpcLibrary -Library (Read-GpcLibrary $dir)) Finding | Should -Be 'GPC-04'
    }
    It 'GPC-05: refuses two files with the same policy name' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-202-sign-in-and-power.json'].policy.name = 'FMP-SC-201-Error-reporting-and-dumps' }
        Get-Rules (Test-GpcLibrary -Library (Read-GpcLibrary $dir)) Finding | Should -Be 'GPC-05'
    }
    It 'GPC-06: refuses one setting in two policies' {
        $dir = New-TempLibrary {
            param($f)
            $copy = $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.settings[0] | ConvertTo-Json -Depth 50 | ConvertFrom-Json -AsHashtable
            $f['fmp-sc-202-sign-in-and-power.json'].policy.settings += $copy
            $f['fmp-sc-202-sign-in-and-power.json'].decisions["${P}errorreporting_disablewindowserrorreporting"] = 'DR-0101'
        }
        $r = @(Test-GpcLibrary -Library (Read-GpcLibrary $dir) | Where-Object Rule -EQ 'GPC-06')
        $r.Count | Should -Be 1
        $r.Issue | Should -Match 'errorreporting_disablewindowserrorreporting is also set by fmp-sc-201'
    }
    It 'GPC-07: refuses an @odata.type without the leading #' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.settings[1].settingInstance['@odata.type'] = 'microsoft.graph.deviceManagementConfigurationChoiceSettingInstance' }
        Get-Rules (Test-GpcLibrary -Library (Read-GpcLibrary $dir)) Finding | Should -Be 'GPC-07'
    }
    It 'GPC-08: traces settings to the move plan, warns on one not from a GPO, and shows a conflict' {
        $plan = @(Get-GpcMovePlan -Invoke (New-Graph).Invoke)
        $dir = New-TempLibrary {
            param($f)
            $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.settings += @{ '@odata.type' = '#microsoft.graph.deviceManagementConfigurationSetting'; settingInstance = @{ '@odata.type' = '#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance'; settingDefinitionId = "${P}start_hidepowerbutton"; choiceSettingValue = @{ '@odata.type' = '#microsoft.graph.deviceManagementConfigurationChoiceSettingValue'; value = "${P}start_hidepowerbutton_1"; children = @() } } }
            $f['fmp-sc-201-error-reporting-and-dumps.json'].decisions["${P}start_hidepowerbutton"] = 'DR-0199'
        }
        $r = @(Test-GpcLibrary -Library (Read-GpcLibrary $dir) -Plan $plan | Where-Object Rule -EQ 'GPC-08')
        ($r | Where-Object Severity -EQ 'Warn').Issue | Should -Match 'start_hidepowerbutton'
        ($r | Where-Object Severity -EQ 'Info').Issue | Should -Match 'power_allowhibernate has conflicting GPO values \(FMP-Workstation-Baseline=Disabled; Workstation-Power=Enabled\); decision DR-0105'
    }
    It 'GPC-09: requires a decision record for every setting' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-202-sign-in-and-power.json'].decisions.Remove("${P}power_allowhibernate") }
        (Test-GpcLibrary -Library (Read-GpcLibrary $dir) | Where-Object Rule -EQ 'GPC-09').Issue | Should -Be "Setting ${P}power_allowhibernate has no decision record"
    }
    It 'GPC-10: warns on a string value that may be a secret' {
        $dir = New-TempLibrary {
            param($f)
            $f['fmp-sc-201-error-reporting-and-dumps.json'].policy.settings += @{ settingInstance = @{ '@odata.type' = '#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance'; settingDefinitionId = 'vendor_example_wifi_presharedkey'; simpleSettingValue = @{ '@odata.type' = '#microsoft.graph.deviceManagementConfigurationStringSettingValue'; value = 'not-a-real-key' } } }
            $f['fmp-sc-201-error-reporting-and-dumps.json'].decisions['vendor_example_wifi_presharedkey'] = 'DR-0198'
        }
        Get-Rules (Test-GpcLibrary -Library (Read-GpcLibrary $dir)) Warn | Should -Be 'GPC-10'
    }
}

Describe 'Comparing the library with the tenant' {
    It 'treats a setting as the same when Graph returns it without # in @odata.type, with nulls and an id' {
        $file = @{ '@odata.type' = '#a.b'; settingDefinitionId = 'x'; choiceSettingValue = @{ '@odata.type' = '#a.c'; value = 'x_1'; children = @() } }
        $tenant = @{ '@odata.type' = 'a.b'; id = '7'; settingDefinitionId = 'x'; settingInstanceTemplateReference = $null; choiceSettingValue = @{ value = 'x_1'; '@odata.type' = 'a.c'; settingValueTemplateReference = $null; children = @() } }
        ConvertTo-GpcCanonical $file | Should -BeExactly (ConvertTo-GpcCanonical $tenant)
    }
    It 'sees a changed value, an added setting, a removed setting and changed scope tags' {
        $lib = Get-Library
        $tenant = @(Get-GpcTenantPolicy -Invoke (New-Graph).Invoke -Name 'FMP-SC-202-Sign-in-and-power')
        $desired = $lib[1].Policy | ConvertTo-Json -Depth 50 | ConvertFrom-Json -AsHashtable
        $desired.settings[1].settingInstance.choiceSettingValue.value = "${P}power_allowhibernate_1"
        $desired.settings = @($desired.settings[1], $lib[0].Policy.settings[0])
        $desired.roleScopeTagIds = @('0', '7')
        $c = Compare-GpcPolicy -Desired $desired -Actual $tenant[0]
        $c.Changed | Should -Be "${P}power_allowhibernate"
        $c.Added | Should -Be "${P}errorreporting_disablewindowserrorreporting"
        $c.Removed | Should -Be "${P}windowslogon_allowautomaticrestartsignon"
        $c.Properties | Should -Be 'roleScopeTagIds'
        $c.Same | Should -BeFalse
    }
}

Describe 'Sync: dry run, apply and its guards' {
    It 'dry run: lists Create and NoChange, sends GET only, exits 0' {
        $g = New-Graph
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke $g.Invoke
        ($r.Results | ForEach-Object { "$($_.Action) $($_.Name)" }) | Should -Be @('Create FMP-SC-201-Error-reporting-and-dumps', 'NoChange FMP-SC-202-Sign-in-and-power')
        @($g.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        $r.Mode | Should -Be 'DryRun'
        $r.Scopes | Should -Be 'DeviceManagementConfiguration.Read.All'
        $r.ExitCode | Should -Be 0
    }
    It 'apply: posts the reviewed body once, reads it back, and a second run changes nothing' {
        $g = New-Graph
        $lib = Get-Library
        $r = Invoke-GpcSync -Library $lib -Invoke $g.Invoke -Apply
        $posts = @($g.Calls | Where-Object Method -EQ 'POST')
        $posts.Count | Should -Be 1
        $posts[0].Uri | Should -Be 'https://graph.microsoft.com/beta/deviceManagement/configurationPolicies'
        ($posts[0].Body | ConvertFrom-Json -AsHashtable -Depth 100 | ConvertTo-Json -Depth 100 -Compress) | Should -BeExactly ($lib[0].Policy | ConvertTo-Json -Depth 100 -Compress)
        ($r.Results | Where-Object Name -EQ 'FMP-SC-201-Error-reporting-and-dumps').Action | Should -Be 'Created'
        $r.Created.Count | Should -Be 1
        $r.ExitCode | Should -Be 0
        $again = Invoke-GpcSync -Library $lib -Invoke $g.Invoke -Apply
        $again.Results.Action | Should -Be @('NoChange', 'NoChange')
        @($g.Calls | Where-Object Method -EQ 'POST').Count | Should -Be 1
    }
    It 'never sends PATCH or DELETE' {
        $g = New-Graph
        Invoke-GpcSync -Library (Get-Library) -Invoke $g.Invoke -Apply | Out-Null
        @($g.Calls | Where-Object Method -NotIn 'GET', 'POST').Count | Should -Be 0
    }
    It 'writes nothing when the lint has a finding' {
        $g = New-Graph
        $dir = New-TempLibrary { param($f) $f['fmp-sc-201-error-reporting-and-dumps.json'].configOwner = 'ConfigMgr' }
        $r = Invoke-GpcSync -Library (Read-GpcLibrary $dir) -Invoke $g.Invoke -Apply
        @($g.Calls | Where-Object Method -EQ 'POST').Count | Should -Be 0
        $r.ExitCode | Should -Be 2
    }
    It 'writes nothing when a tenant policy has drifted from Git, and names the setting' {
        $g = New-Graph
        $pol = $g.Policies | Where-Object { $_['name'] -eq 'FMP-SC-202-Sign-in-and-power' }
        $pol['settings'][1]['settingInstance']['choiceSettingValue']['value'] = "${P}power_allowhibernate_1"
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke $g.Invoke -Apply
        $d = $r.Results | Where-Object Name -EQ 'FMP-SC-202-Sign-in-and-power'
        $d.Action | Should -Be 'Drift'
        $d.Changed | Should -Be "${P}power_allowhibernate"
        @($g.Calls | Where-Object Method -EQ 'POST').Count | Should -Be 0
        $r.ExitCode | Should -Be 2
    }
    It 'reports two tenant policies with one library name as Duplicate and writes nothing' {
        $g = New-Graph
        $copy = $g.Policies[0] | ConvertTo-Json -Depth 50 | ConvertFrom-Json -AsHashtable
        $copy['id'] = '6f1c2b9e-0000-4000-8000-000000002299'
        $g.Policies.Add($copy)
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke $g.Invoke -Apply
        ($r.Results | Where-Object Name -EQ 'FMP-SC-202-Sign-in-and-power').Action | Should -Be 'Duplicate'
        @($g.Calls | Where-Object Method -EQ 'POST').Count | Should -Be 0
        $r.ExitCode | Should -Be 2
    }
    It 'creates in the cloud it is given' {
        $g = New-Graph
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke $g.Invoke -Cloud dod -Apply
        ($g.Calls | Where-Object Method -EQ 'POST').Uri | Should -Be 'https://dod-graph.microsoft.us/beta/deviceManagement/configurationPolicies'
        @($g.Calls | Where-Object { $_.Uri -notlike 'https://dod-graph.microsoft.us/*' }).Count | Should -Be 0
        $r.GraphHost | Should -Be 'https://dod-graph.microsoft.us'
    }
    It 'flags a created policy that reads back different from the file' {
        $g = New-Graph
        $lossy = { param($Method, $Uri, $Body, $Headers)
            if ($Method -eq 'POST') { $b = $Body | ConvertFrom-Json -AsHashtable -Depth 100; $b.settings = @($b.settings | Select-Object -First 1); $Body = $b | ConvertTo-Json -Depth 100 }
            & $g.Invoke $Method $Uri $Body $Headers }.GetNewClosure()
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke $lossy -Apply
        ($r.Results | Where-Object Name -EQ 'FMP-SC-201-Error-reporting-and-dumps').Action | Should -Be 'CreatedDiffers'
        $r.ExitCode | Should -Be 2
    }
    It 'exits 1 and records the error when a Graph call fails' {
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke { param($Method, $Uri) throw '403 Forbidden' }
        $r.ExitCode | Should -Be 1
        ($r.Findings | Where-Object Rule -EQ 'GPC-ERR').Issue | Should -Match '403'
    }
    It 'records each library file with its SHA-256' {
        $r = Invoke-GpcSync -Library (Get-Library) -Invoke (New-Graph).Invoke
        $r.Files.Count | Should -Be 2
        $r.Files[0].sha256 | Should -Match '^[0-9a-f]{64}$'
    }
}

Describe 'Invoke-GpcSync.ps1' {
    It 'exits 0 on the fixture tenant and writes sync-record.json' {
        $out = Join-Path ([IO.Path]::GetTempPath()) ('gpc-out-' + [guid]::NewGuid().Guid.Substring(0, 8))
        pwsh -NoProfile -File (Join-Path $PSScriptRoot '../powershell/Invoke-GpcSync.ps1') -FixturePath $script:Fixture -WithPlan -OutputPath $out | Out-Null
        $LASTEXITCODE | Should -Be 0
        (Get-Content (Join-Path $out 'sync-record.json') -Raw | ConvertFrom-Json).Schema | Should -Be 'fmp-gpc-sync/1'
    }
    It 'exits 2 when the library differs from the tenant' {
        $dir = New-TempLibrary { param($f) $f['fmp-sc-202-sign-in-and-power.json'].policy.settings[1].settingInstance.choiceSettingValue.value = "${P}power_allowhibernate_1" }
        $out = Join-Path ([IO.Path]::GetTempPath()) ('gpc-out-' + [guid]::NewGuid().Guid.Substring(0, 8))
        $text = pwsh -NoProfile -File (Join-Path $PSScriptRoot '../powershell/Invoke-GpcSync.ps1') -FixturePath $script:Fixture -LibraryPath $dir -OutputPath $out
        $LASTEXITCODE | Should -Be 2
        ($text -join "`n") | Should -Match "Drift\s+FMP-SC-202-Sign-in-and-power: changes ${P}power_allowhibernate"
    }
}
