#Requires -Version 7.1
# Pester 5: clouds, settings, the declared calls, the invokers and the hunting reader.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/DefenderXdr/DefenderXdr.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:SettingsPath = Join-Path $Kit 'tests/fixtures/settings.lab.json'
    $script:Graph = Join-Path $Kit 'tests/fixtures/graph'
    function script:NewSettings([string]$Json) { $p = Join-Path $TestDrive ("s{0}.json" -f [guid]::NewGuid()); Set-Content -LiteralPath $p -Value $Json; $p }
}

Describe 'Clouds' {
    It 'gives GCC the worldwide Graph endpoint and the Global environment' {
        (Get-XdrCloud -Cloud gcc).Graph | Should -Be 'https://graph.microsoft.com'
        (Get-XdrCloud -Cloud gcc).GraphEnvironment | Should -Be 'Global'
    }
    It 'refuses an unknown cloud name, and has no default' {
        { Get-XdrCloud -Cloud 'GCC' } | Should -Throw '*Unknown cloud*'
        { Get-XdrCloud -Cloud 'usgov' } | Should -Throw
    }
}

Describe 'Settings' {
    It 'reads the lab settings and resolves inputs against the settings folder' {
        $s = Read-XdrSettings -Path $SettingsPath
        $s.cloud | Should -Be 'gcc'
        Test-Path -LiteralPath $s.inputs.inventory | Should -BeTrue
        Test-Path -LiteralPath $s.inputs.deviceStates | Should -BeTrue
    }
    It 'refuses a secret-like value' {
        $p = NewSettings '{ "environment": "test", "cloud": "gcc", "tenantId": "x", "clientSecret": "abc" }'
        { Read-XdrSettings -Path $p } | Should -Throw '*secret*'
    }
    It 'refuses a placeholder in tenantId' {
        $p = NewSettings '{ "environment": "test", "cloud": "gcc", "tenantId": "<tenant-id>" }'
        { Read-XdrSettings -Path $p } | Should -Throw '*placeholder*'
    }
    It 'refuses a missing or unknown cloud' {
        { Read-XdrSettings -Path (NewSettings '{ "environment": "test", "tenantId": "x" }') } | Should -Throw "*'cloud'*"
        { Read-XdrSettings -Path (NewSettings '{ "environment": "test", "cloud": "commercial", "tenantId": "x" }') } | Should -Throw '*Unknown cloud*'
    }
    It 'says which input is missing' {
        $s = Read-XdrSettings -Path (NewSettings '{ "environment": "test", "cloud": "gcc", "tenantId": "x", "inputs": { "inventory": "<cm-8-inventory.csv>" } }')
        { Get-XdrInput -Settings $s -Name inventory } | Should -Throw '*inputs.inventory*'
    }
}

Describe 'Declared calls' {
    It 'declares every call with a least-privileged permission and a Learn page' {
        foreach ($c in Get-XdrCall) {
            $c.permission | Should -Not -BeNullOrEmpty
            $c.doc | Should -Match '^https://learn\.microsoft\.com/'
            $c.path | Should -Match '^/security/'
        }
    }
    It 'uses the read permissions Learn names for the reads' {
        (Get-XdrCall -Id incidents-list).permission | Should -Be 'SecurityIncident.Read.All'
        (Get-XdrCall -Id hunting-query).permission | Should -Be 'ThreatHunting.Read.All'
        (Get-XdrCall -Id detection-rules-list).permission | Should -Be 'CustomDetection.Read.All'
    }
    It 'marks only the two detection rule calls as writes' {
        @(Get-XdrCall | Where-Object writes | ForEach-Object id) | Should -Be @('detection-rule-create', 'detection-rule-update')
        @(Get-XdrCall | Where-Object writes | ForEach-Object permission | Sort-Object -Unique) | Should -Be @('CustomDetection.ReadWrite.All')
    }
    It 'lists one task''s permissions' {
        @(Get-XdrRequiredPermission -Task coverage | ForEach-Object Permission) | Should -Be @('ThreatHunting.Read.All')
    }
}

Describe 'Invokers' {
    It 'reads a fixture and records the call' {
        $inv = New-XdrFixtureInvoker -Path $Graph
        $r = Invoke-XdrCall -Invoker $inv -CallId incidents-list
        @($r.value).Count | Should -Be 7
        $inv.Calls | Should -Contain 'incidents-list'
    }
    It 'refuses an undeclared call' {
        { Invoke-XdrCall -Invoker (New-XdrFixtureInvoker -Path $Graph) -CallId 'devices-list' } | Should -Throw '*isn''t declared*'
    }
    It 'refuses a write through the read path' {
        { Invoke-XdrCall -Invoker (New-XdrFixtureInvoker -Path $Graph) -CallId detection-rule-create } | Should -Throw '*writes*'
    }
    It 'refuses a live run with no Graph session, or one in another tenant' {
        $s = Read-XdrSettings -Path $SettingsPath
        $old = Set-XdrRunner -GraphContext { $null }
        try { { New-XdrLiveInvoker -Settings $s } | Should -Throw '*No Microsoft Graph session*' } finally { $null = Set-XdrRunner -GraphContext $old.GraphContext }
        $old = Set-XdrRunner -GraphContext { @{ Environment = 'Global'; TenantId = '11111111-1111-1111-1111-111111111111' } }
        try { { New-XdrLiveInvoker -Settings $s } | Should -Throw '*tenant*' } finally { $null = Set-XdrRunner -GraphContext $old.GraphContext }
    }
    It 'sends a live read to graph.microsoft.com v1.0 and follows nextLink' {
        $s = Read-XdrSettings -Path $SettingsPath
        $script:Seen = [Collections.Generic.List[string]]::new()
        $old = Set-XdrRunner -GraphContext { @{ Environment = 'Global'; TenantId = '00000000-0000-0000-0000-00000000c0de' } } -Graph {
            param($Method, $Uri, $Body)
            $script:Seen.Add("$Method $Uri")
            if ($Uri -like '*skip*') { return @{ value = @(@{ id = '2' }) } }
            @{ value = @(@{ id = '1' }); '@odata.nextLink' = 'https://graph.microsoft.com/v1.0/security/incidents?$skip=1' }
        }
        try {
            $r = Invoke-XdrCall -Invoker (New-XdrLiveInvoker -Settings $s) -CallId incidents-list -Arguments @{ top = 5 }
            @($r.value).Count | Should -Be 2
            $Seen[0] | Should -Be 'GET https://graph.microsoft.com/v1.0/security/incidents?$top=5'
        }
        finally { $null = Set-XdrRunner -Graph $old.Graph -GraphContext $old.GraphContext }
    }
    It 'refuses a nextLink on another host' {
        $s = Read-XdrSettings -Path $SettingsPath
        $old = Set-XdrRunner -GraphContext { @{ Environment = 'Global'; TenantId = '00000000-0000-0000-0000-00000000c0de' } } -Graph { param($Method, $Uri, $Body) @{ value = @(); '@odata.nextLink' = 'https://example.invalid/next' } }
        try { { Invoke-XdrCall -Invoker (New-XdrLiveInvoker -Settings $s) -CallId incidents-list } | Should -Throw '*isn''t on*' }
        finally { $null = Set-XdrRunner -Graph $old.Graph -GraphContext $old.GraphContext }
    }
    It 'posts a hunting query with its timespan' {
        $s = Read-XdrSettings -Path $SettingsPath
        $script:Body = $null
        $old = Set-XdrRunner -GraphContext { @{ Environment = 'Global'; TenantId = '00000000-0000-0000-0000-00000000c0de' } } -Graph { param($Method, $Uri, $Body) $script:Body = $Body; $script:Uri = "$Method $Uri"; @{ schema = @(@{ name = 'A'; type = 'String' }); results = @(@{ A = 1 }) } }
        try {
            $rows = @(Invoke-XdrHunting -Invoker (New-XdrLiveInvoker -Settings $s) -Name t -Query 'DeviceInfo | take 1' -Timespan 'P7D')
            $rows.Count | Should -Be 1
            $Uri | Should -Be 'POST https://graph.microsoft.com/v1.0/security/runHuntingQuery'
            $Body.Query | Should -Be 'DeviceInfo | take 1'
            $Body.Timespan | Should -Be 'P7D'
        }
        finally { $null = Set-XdrRunner -Graph $old.Graph -GraphContext $old.GraphContext }
    }
    It 'records a write in fixture mode and sends nothing' {
        $inv = New-XdrFixtureInvoker -Path $Graph
        $r = Invoke-XdrWrite -Invoker $inv -CallId detection-rule-update -Arguments @{ id = 'x' } -Body @{ status = 'disabled' }
        $r.fixture | Should -BeTrue
        $r.path | Should -Be '/security/rules/detectionRules/x'
    }
}

Describe 'Hunting results' {
    It 'reads columns whatever their case (Learn shows both)' {
        Get-XdrV @{ deviceName = 'a' } 'DeviceName' | Should -Be 'a'
        Get-XdrV ([pscustomobject]@{ DeviceName = 'b' }) 'devicename' | Should -Be 'b'
    }
    It 'fails when the response lacks a column the kit reads, rather than reading it as empty' {
        $inv = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[string]]::new(); Script = { param($id, $a) @{ schema = @(@{ name = 'DeviceName'; type = 'String' }); results = @() } } }
        { Invoke-XdrHunting -Invoker $inv -Name coverage-devices } | Should -Throw '*returned no column*'
    }
    It 'keeps the guide''s queries word for word' {
        (Get-XdrQuery -Name coverage-summary).kql | Should -Be 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId | where OSPlatform startswith "Windows" | summarize Devices = count() by OnboardingStatus, SensorHealthState'
        (Get-XdrQuery -Name asr-events).kql | Should -Be 'DeviceEvents | where Timestamp > ago(30d) | where ActionType startswith "Asr" | summarize EventCount=count() by ActionType'
    }
    It 'saves the raw response in the run folder' {
        $o = Join-Path $TestDrive 'raw-test'
        $null = Invoke-XdrHunting -Invoker (New-XdrFixtureInvoker -Path $Graph) -Name prevention-events -OutputPath $o
        Test-Path (Join-Path $o 'raw/prevention-events.json') | Should -BeTrue
    }
}
