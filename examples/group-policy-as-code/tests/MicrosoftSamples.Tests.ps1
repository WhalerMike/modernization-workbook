#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Baseline: Microsoft's settings catalog samples (microsoft/mggraph-intune-samples, pinned in
# examples/third_party/mggraph-intune-samples), run unmodified against the fake Graph
# (tests/MicrosoftSampleHarness.ps1). Each test pins one thing the samples do, so a new upstream
# version that changes it fails here first. The chapter's gap table cites these tests.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/GroupPolicyAsCode.psm1') -Force
    . (Join-Path $PSScriptRoot 'MicrosoftSampleHarness.ps1')
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/tenant.json'
    $script:Library = Join-Path $PSScriptRoot '../policies/fmp-sc-201-error-reporting-and-dumps.json'
    function New-TempDir { $d = Join-Path ([IO.Path]::GetTempPath()) ('gpc-ms-' + [guid]::NewGuid().Guid.Substring(0, 8)); New-Item -ItemType Directory -Path $d | Out-Null; $d }
    # The library file's policy body, as a standalone file the import sample takes, changed by -Change.
    function New-ImportFile([scriptblock]$Change) {
        $body = (Get-Content $script:Library -Raw | ConvertFrom-Json -AsHashtable -Depth 100).policy
        if ($Change) { & $Change $body }
        $path = Join-Path (New-TempDir) 'policy.json'
        [IO.File]::WriteAllText($path, ($body | ConvertTo-Json -Depth 100))
        $path
    }
    function Get-Posts($Graph) { @($Graph.Calls | Where-Object Method -EQ 'POST') }
}

Describe 'SettingsCatalog_Import_FromJSON.ps1, run as published' {
    It 'creates the policy with one POST to configurationPolicies (beta), the model for the create call' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        Invoke-MicrosoftSample -Name Import -Graph $g -Answers @(New-ImportFile) | Out-Null
        (Get-Posts $g).Count | Should -Be 1
        (Get-Posts $g)[0].Uri | Should -BeLike '*/beta/deviceManagement/configurationPolicies'
        @($g.Policies | Where-Object { $_['name'] -eq 'FMP-SC-201-Error-reporting-and-dumps' }).Count | Should -Be 1
    }
    It 'sends it to graph.microsoft.com whatever cloud the session signed in to' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        Invoke-MicrosoftSample -Name Import -Graph $g -Answers @(New-ImportFile) | Out-Null
        (Get-Posts $g)[0].Uri | Should -Be 'https://graph.microsoft.com/beta/deviceManagement/configurationPolicies'
    }
    It 'does not sign in or choose a permission itself: it uses whatever session the caller has' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $run = Invoke-MicrosoftSample -Name Import -Graph $g -Answers @(New-ImportFile)
        $run.Connected | Should -BeNullOrEmpty
    }
    It 'asks only for the file and creates at once: no dry run and no confirmation' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $run = Invoke-MicrosoftSample -Name Import -Graph $g -Answers @(New-ImportFile)
        $run.Prompts.Count | Should -Be 1
        $run.Prompts[0] | Should -BeLike 'Please specify a path to a JSON file*'
        (Get-Posts $g).Count | Should -Be 1
    }
    It 'creates a second policy with the same name when run twice: it never reads what is there' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $file = New-ImportFile
        Invoke-MicrosoftSample -Name Import -Graph $g -Answers @($file) | Out-Null
        Invoke-MicrosoftSample -Name Import -Graph $g -Answers @($file) | Out-Null
        @($g.Policies | Where-Object { $_['name'] -eq 'FMP-SC-201-Error-reporting-and-dumps' }).Count | Should -Be 2
        @($g.Calls | Where-Object Method -EQ 'GET').Count | Should -Be 0
    }
    It 'silently changes the body: strips service-set properties and adds # to @odata.type' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $file = New-ImportFile { param($b) $b.id = 'from-another-tenant'; $b.settingCount = 3; $b.settings[0].settingInstance['@odata.type'] = 'microsoft.graph.deviceManagementConfigurationChoiceSettingInstance' }
        Invoke-MicrosoftSample -Name Import -Graph $g -Answers @($file) | Out-Null
        $sent = (Get-Posts $g)[0].Body | ConvertFrom-Json -AsHashtable -Depth 100
        $sent.Contains('id') | Should -BeFalse
        $sent.Contains('settingCount') | Should -BeFalse
        $sent.settings[0].settingInstance['@odata.type'] | Should -Be '#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance'
    }
    It 'drops assignments, so the policy is created unassigned' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $file = New-ImportFile { param($b) $b.assignments = @(@{ target = @{ '@odata.type' = '#microsoft.graph.allDevicesAssignmentTarget' } }) }
        Invoke-MicrosoftSample -Name Import -Graph $g -Answers @($file) | Out-Null
        ((Get-Posts $g)[0].Body | ConvertFrom-Json -AsHashtable).Contains('assignments') | Should -BeFalse
    }
    It 'records nothing about what it created, beyond the screen' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $file = New-ImportFile
        $before = @(Get-ChildItem (Split-Path $file)).Count
        $run = Invoke-MicrosoftSample -Name Import -Graph $g -Answers @($file)
        @(Get-ChildItem (Split-Path $file)).Count | Should -Be $before
        ($run.Output -join "`n") | Should -Match 'Policy created with id 00000000-0000-4000-9000-000000000001'
    }
}

Describe 'SettingsCatalog_Export.ps1, run as published' {
    It 'exports every settings catalog policy, following @odata.nextLink, filtered to technologies has mdm' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture -PageSize 1
        $dir = New-TempDir
        Invoke-MicrosoftSample -Name Export -Graph $g -Answers @($dir) | Out-Null
        @(Get-ChildItem $dir -Filter *.json).Count | Should -Be 2
        $g.Calls[0].Uri | Should -Be "https://graph.microsoft.com/beta/deviceManagement/configurationPolicies?`$filter=technologies has 'mdm'"
    }
    It 'names each file with the time of the run, so the same policy exports to a new file each time' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $dir = New-TempDir
        Invoke-MicrosoftSample -Name Export -Graph $g -Answers @($dir) | Out-Null
        (Get-ChildItem $dir -Filter 'FMP-SC-202*').Name | Should -Match '^FMP-SC-202-Sign-in-and-power_\d{2}-\d{2}-\d{4}-\d{1,2}-\d{2}-\d{2}\.json$'
    }
    It 'keeps name, description, platforms, technologies and settings, and drops the scope tags' {
        $g = New-GpcFixtureInvoke -Path $script:Fixture
        $dir = New-TempDir
        Invoke-MicrosoftSample -Name Export -Graph $g -Answers @($dir) | Out-Null
        $e = Get-Content (Get-ChildItem $dir -Filter 'FMP-SC-202*').FullName -Raw | ConvertFrom-Json -AsHashtable -Depth 100
        @($e.Keys | Sort-Object) | Should -Be @('description', 'name', 'platforms', 'settings', 'technologies')
        $e.settings.Count | Should -Be 2
    }
    It 'round-trips: a policy exported from one tenant imports into another with the same settings' {
        $from = New-GpcFixtureInvoke -Path $script:Fixture
        $dir = New-TempDir
        Invoke-MicrosoftSample -Name Export -Graph $from -Answers @($dir) | Out-Null
        $to = New-GpcFixtureInvoke -Path $script:Fixture
        $to.Policies.Clear()
        Invoke-MicrosoftSample -Name Import -Graph $to -Answers @((Get-ChildItem $dir -Filter 'FMP-SC-202*').FullName) | Out-Null
        $a = @(Get-GpcTenantPolicy -Invoke $from.Invoke -Name 'FMP-SC-202-Sign-in-and-power')[0]
        $b = @(Get-GpcTenantPolicy -Invoke $to.Invoke -Name 'FMP-SC-202-Sign-in-and-power')[0]
        ($a.Settings | ForEach-Object { ConvertTo-GpcCanonical $_.settingInstance }) | Should -Be ($b.Settings | ForEach-Object { ConvertTo-GpcCanonical $_.settingInstance })
    }
}
