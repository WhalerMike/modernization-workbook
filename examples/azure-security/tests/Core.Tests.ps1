#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
BeforeAll { . (Join-Path $PSScriptRoot 'TestHelpers.ps1') }

Describe 'Core: the cloud, the settings and the call list' {
    It 'knows commercial Azure only, with no default and no other cloud' {
        (Get-AzsCloud -Cloud AzureCloud).Arm | Should -Be 'https://management.azure.com'
        { Get-AzsCloud -Cloud AzureChinaCloud } | Should -Throw '*commercial Azure only*'
        { Get-AzsCloud -Cloud azurecloud } | Should -Throw
    }
    It 'refuses a settings file with a placeholder, a missing key or another cloud' {
        $t = Join-Path $TestDrive 's.json'
        $s = Get-Content (Join-Path $script:Fixtures 'settings.lab.json') -Raw | ConvertFrom-Json -AsHashtable
        $s.hubVnetId = '<hub-vnet-id>'; $s | ConvertTo-Json -Depth 5 | Set-Content $t
        { Read-AzsSettings -Path $t } | Should -Throw '*placeholder*'
        $s.hubVnetId = 'x'; $s.Remove('workspaceId'); $s | ConvertTo-Json -Depth 5 | Set-Content $t
        { Read-AzsSettings -Path $t } | Should -Throw "*no 'workspaceId'*"
        $s.workspaceId = 'x'; $s.cloud = 'AzureChinaCloud'; $s | ConvertTo-Json -Depth 5 | Set-Content $t
        { Read-AzsSettings -Path $t } | Should -Throw '*AzureCloud*'
    }
    It 'declares every call as a read with a role, a Learn page and a fixture in both weeks' {
        $calls = Get-AzsCall
        $calls.Count | Should -BeGreaterThan 25
        foreach ($c in $calls) {
            $c.kind | Should -BeIn @('arg', 'rest')
            $c.role | Should -Match '^Reader'
            $c.doc | Should -Match '^https://learn\.microsoft\.com/'
            if (-not $c.verified) { "$($c.unverified)" | Should -Not -BeNullOrEmpty }
            foreach ($w in 'week1', 'week2') { Join-Path $script:Fixtures "$w/$($c.fixture)" | Should -Exist }
        }
    }
    It 'declares, for each area, exactly the calls its check makes' {
        foreach ($a in 'baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy') {
            $inv = New-AzsFixtureInvoker -Path (Join-Path $script:Fixtures 'week1')
            $null = Invoke-AzsCheck -Area $a -Settings $script:Settings -Invoker $inv -AsOf 2026-11-09T12:00:00Z -OutputPath (Join-Path $TestDrive $a)
            @($inv.Calls | ForEach-Object { $_.call } | Sort-Object -Unique) | Should -Be @(Get-AzsCall -Area $a | ForEach-Object id | Sort-Object) -Because $a
        }
    }
    It 'needs Reader and nothing more for any area' {
        @(Get-AzsRequiredRole | ForEach-Object Role | Sort-Object -Unique) | Should -Be @('Reader', 'Reader (tenant root group)')
        @(Get-AzsRequiredRole -Area ddos).Count | Should -Be 7
    }
}

Describe 'Core: the live commands' {
    It 'scopes every Resource Graph query to the management group and pages by skip token' {
        $a = Get-AzsLiveCommand -CallId arg-public-ips -Settings $script:Settings -SkipToken 'tok'
        $a[0..1] -join ' ' | Should -Be 'graph query'
        $a | Should -Contain '--management-groups'
        $a[[array]::IndexOf($a, '--management-groups') + 1] | Should -Be 'contoso'
        $a[-2..-1] -join ' ' | Should -Be '--skip-token tok'
    }
    It 'builds REST GETs on management.azure.com with the declared API version' {
        $id = '/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-hub/providers/Microsoft.Network/azureFirewalls/afw-hub'
        $a = Get-AzsLiveCommand -CallId rest-diagnostic-settings -Settings $script:Settings -Key $id
        $a[0..2] -join ' ' | Should -Be 'rest --method get'
        $a[4] | Should -Be "https://management.azure.com$id/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview"
        (Get-AzsLiveCommand -CallId rest-hierarchy-settings -Settings $script:Settings -Key 'root')[4] | Should -Be 'https://management.azure.com/providers/Microsoft.Management/managementGroups/root/settings/default?api-version=2020-05-01'
    }
    It 'refuses a next link on another host, and a keyed call without its key' {
        { Get-AzsLiveCommand -CallId rest-afd-origins -Settings $script:Settings -NextLink 'https://management.contoso.example/x' } | Should -Throw '*Refusing*'
        { Get-AzsLiveCommand -CallId rest-afd-origins -Settings $script:Settings } | Should -Throw '*needs a key*'
    }
    It 'refuses a live run signed in to another cloud or tenant' {
        $old = Set-AzsRunner -Az { param($Arguments) if ($Arguments -contains 'cloud') { @{ ExitCode = 0; Output = 'AzureChinaCloud' } } else { @{ ExitCode = 0; Output = 'x' } } }
        try { { Assert-AzsLiveContext -Settings $script:Settings } | Should -Throw '*az cloud set --name AzureCloud*' }
        finally { $null = Set-AzsRunner -Az $old }
        $old = Set-AzsRunner -Az { param($Arguments) if ($Arguments -contains 'cloud') { @{ ExitCode = 0; Output = 'AzureCloud' } } else { @{ ExitCode = 0; Output = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } } }
        try { { Assert-AzsLiveContext -Settings $script:Settings } | Should -Throw '*not aaaaaaaa*' }
        finally { $null = Set-AzsRunner -Az $old }
    }
    It 'refuses an unverified call unless -AllowUnverified' {
        $inv = New-AzsLiveInvoker -Settings $script:Settings -SkipContextCheck
        { Invoke-AzsCall -Invoker $inv -CallId arg-vnets } | Should -Throw "*isn't verified on Microsoft Learn*"
    }
    It 'pages a live Resource Graph query and a REST list, sending only GETs' {
        $script:seen = [Collections.Generic.List[string]]::new()
        $old = Set-AzsRunner -Az {
            param($Arguments)
            $script:seen.Add(($Arguments -join ' '))
            if ($Arguments[0] -eq 'graph') {
                if ($Arguments -contains '--skip-token') { return @{ ExitCode = 0; Output = '{"data":[{"id":"b"}],"skip_token":null}' } }
                return @{ ExitCode = 0; Output = '{"data":[{"id":"a"}],"skip_token":"t1"}' }
            }
            if ($Arguments[4] -like '*page2*') { return @{ ExitCode = 0; Output = '{"value":[{"id":"y"}]}' } }
            @{ ExitCode = 0; Output = '{"value":[{"id":"x"}],"nextLink":"https://management.azure.com/page2"}' }
        }
        try {
            $inv = New-AzsLiveInvoker -Settings $script:Settings -SkipContextCheck
            @((Invoke-AzsCall -Invoker $inv -CallId arg-public-ips).data.id) | Should -Be @('a', 'b')
            @((Invoke-AzsCall -Invoker $inv -CallId rest-afd-origins -Key '/x/og').value.id) | Should -Be @('x', 'y')
        } finally { $null = Set-AzsRunner -Az $old }
        $script:seen.Count | Should -Be 4
        @($script:seen | Where-Object { $_ -like 'rest *' -and $_ -notlike 'rest --method get *' }).Count | Should -Be 0
    }
    It 'never starts az in fixture mode' {
        $old = Set-AzsRunner -Az { throw 'az was started' }
        try { $r = Invoke-AzsCheck -Area ddos -Settings $script:Settings -Invoker (New-AzsFixtureInvoker -Path (Join-Path $script:Fixtures 'week1')) -AsOf 2026-11-09T12:00:00Z -OutputPath (Join-Path $TestDrive 'ddos') }
        finally { $null = Set-AzsRunner -Az $old }
        $r.Calls | Should -Be 7
    }
}

Describe 'Core: findings and rules' {
    It 'gives every finding the rule''s severity, step and source, and a stable fingerprint' {
        $f = New-AzsFinding -Rule AZS-KV-02 -ResourceId '/subscriptions/X/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv' -Detail 'd'
        $f.severity | Should -Be 'Finding'; $f.step | Should -Be 8; $f.name | Should -Be 'kv'
        $f.fingerprint | Should -Be (New-AzsFinding -Rule AZS-KV-02 -ResourceId '/subscriptions/x/resourcegroups/RG/providers/microsoft.keyvault/vaults/KV').fingerprint
        { New-AzsFinding -Rule AZS-XX-01 -ResourceId x } | Should -Throw
    }
    It 'reports only rules that config/rules.json declares, and the module can report every declared rule' {
        $declared = @((Get-AzsRules).Keys | Sort-Object)
        $src = Get-Content (Join-Path $script:Kit 'powershell/AzureSecurity/AzureSecurity.psm1') -Raw
        $used = @([regex]::Matches($src, "-Rule (AZS-[A-Z]+-\d\d)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
        $used | Should -Be $declared
    }
    It 'counts a diagnostic setting only when it sends an enabled log to the platform workspace' {
        $ws = $script:Settings.workspaceId
        $d = @(@{ properties = @{ workspaceId = $ws.ToUpperInvariant(); logs = @(@{ category = 'AuditEvent'; enabled = $true }) } })
        Test-AzsDiag -Settings $d -WorkspaceId $ws -Categories AuditEvent | Should -BeTrue
        Test-AzsDiag -Settings $d -WorkspaceId $ws -Groups allLogs | Should -BeFalse
        Test-AzsDiag -Settings $d -WorkspaceId '/other' | Should -BeFalse
        $d[0].properties.logs[0].enabled = $false
        Test-AzsDiag -Settings $d -WorkspaceId $ws | Should -BeFalse
    }
}
