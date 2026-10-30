# The live path, with Microsoft Graph, Resource Graph and AD mocked: paging, throttling and
# retry, the host check, GET as the only method, the one read-only beta POST, and a check run
# end to end in live mode.

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    $script:Live = Get-VkRunContext -AsOf '2026-10-29T00:00:00Z' -Cloud gcc
}

Describe 'Microsoft Graph reads' {
    BeforeEach { Mock -ModuleName ValidationKit Wait-VkRetry { } }

    It 'follows @odata.nextLink and sends only GET, with low throttle priority' {
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest {
            if ($Uri -like '*skiptoken=2*') { return [pscustomobject]@{ value = @([pscustomobject]@{ id = 'c' }) } }
            [pscustomobject]@{ value = @([pscustomobject]@{ id = 'a' }, [pscustomobject]@{ id = 'b' }); '@odata.nextLink' = 'https://graph.microsoft.com/v1.0/users?$skiptoken=2' }
        }
        $items = & (Get-Module ValidationKit) { Invoke-VkGraphGet -Uri '/v1.0/users' -GraphHost 'https://graph.microsoft.com' }
        @($items.id) | Should -Be @('a', 'b', 'c')
        Should -Invoke -ModuleName ValidationKit Invoke-MgGraphRequest -Times 2 -Exactly -ParameterFilter { $Method -eq 'GET' -and $Headers['x-ms-throttle-priority'] -eq 'Low' }
        Should -Invoke -ModuleName ValidationKit Invoke-MgGraphRequest -Times 0 -Exactly -ParameterFilter { $Method -ne 'GET' }
    }
    It 'refuses a nextLink on another host, so the token never leaves the cloud''s Graph endpoint' {
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { [pscustomobject]@{ value = @(); '@odata.nextLink' = 'https://evil.example/v1.0/users?page=2' } }
        { & (Get-Module ValidationKit) { Invoke-VkGraphGet -Uri '/v1.0/users' -GraphHost 'https://graph.microsoft.com' } } | Should -Throw '*Refusing to call a URL outside*'
    }
    It 'retries 429 and 503 after a wait, then succeeds' {
        $script:calls = 0
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest {
            $script:calls++
            if ($script:calls -eq 1) { throw 'Response status code does not indicate success: 429 (TooManyRequests).' }
            if ($script:calls -eq 2) { throw 'Response status code does not indicate success: 503 (ServiceUnavailable).' }
            [pscustomobject]@{ value = @([pscustomobject]@{ id = 'ok' }) }
        }
        $items = & (Get-Module ValidationKit) { Invoke-VkGraphGet -Uri '/v1.0/users' -GraphHost 'https://graph.microsoft.com' }
        @($items.id) | Should -Be @('ok')
        Should -Invoke -ModuleName ValidationKit Wait-VkRetry -Times 2 -Exactly
    }
    It 'gives up after the retry limit, and never retries a 403' {
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { throw 'Response status code does not indicate success: 429 (TooManyRequests).' }
        { & (Get-Module ValidationKit) { Invoke-VkGraphRequest -Uri '/v1.0/users' -MaxRetries 2 } } | Should -Throw '*429*'
        Should -Invoke -ModuleName ValidationKit Invoke-MgGraphRequest -Times 3 -Exactly
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { throw 'Response status code does not indicate success: 403 (Forbidden).' }
        { & (Get-Module ValidationKit) { Invoke-VkGraphRequest -Uri '/v1.0/users' } } | Should -Throw '*403*'
        Should -Invoke -ModuleName ValidationKit Wait-VkRetry -Times 2 -Exactly
    }
    It 'reads a $count as an integer with the advanced-query header' {
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { '42' }
        (& (Get-Module ValidationKit) { Get-VkGraphCount -Uri '/v1.0/groups/x/transitiveMembers/$count' -GraphHost 'https://graph.microsoft.com' }) | Should -Be 42
        Should -Invoke -ModuleName ValidationKit Invoke-MgGraphRequest -ParameterFilter { $Headers['ConsistencyLevel'] -eq 'eventual' }
    }
    It 'maps GCC to the worldwide Graph endpoint' {
        $Live.GraphHost | Should -Be 'https://graph.microsoft.com'
        (Get-VkRunContext -Cloud gcchigh).GraphHost | Should -Be 'https://graph.microsoft.us'
    }
}

Describe 'Checks in live mode' {
    BeforeEach { Mock -ModuleName ValidationKit Wait-VkRetry { } }

    It 'runs VK-HR-04 against Graph and records the query it sent' {
        $users = Get-Content -Raw (Join-Path (Join-Path $global:VkTestFixtureRoot 'fail') 'users.json') | ConvertFrom-Json
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { [pscustomobject]@{ value = $users } }
        $ctx = Get-VkRunContext -AsOf '2026-10-29T00:00:00Z'
        $r = Invoke-VkCheck -CheckId 'VK-HR-04' -Context $ctx
        $r.Status | Should -Be 'Fail'
        $r.Count | Should -Be 1
        $r.Evidence.Mode | Should -Be 'Live'
        $r.Evidence.Queries[0].Source | Should -Be 'Graph'
        $r.Evidence.Queries[0].Query | Should -Match '^/v1.0/users\?\$select='
    }
    It 'gives Error, not Pass, when Graph refuses the read' {
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { throw 'Response status code does not indicate success: 403 (Forbidden).' }
        $r = Invoke-VkCheck -CheckId 'VK-HR-01' -Context (Get-VkRunContext -AsOf '2026-10-29T00:00:00Z')
        $r.Status | Should -Be 'Error'
        $r.Message | Should -Match '403'
    }
    It 'sends the beta rule validation as the only POST, to evaluateDynamicMembership' {
        $inputs = Join-Path $TestDrive 'inputs'
        $null = New-Item -ItemType Directory -Path $inputs
        Copy-Item (Join-Path (Join-Path $global:VkTestFixtureRoot 'pass') 'rule-tests.json') $inputs
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest { [pscustomobject]@{ membershipRuleEvaluationResult = ($Uri -match '00000000-0000-4000-8000-000000000100' -and $Body -match '000000000001') } }
        $r = Invoke-VkCheck -CheckId 'VK-DG-03' -Context (Get-VkRunContext -InputPath $inputs -AsOf '2026-10-29T00:00:00Z')
        $r.Status | Should -Be 'Pass'
        Should -Invoke -ModuleName ValidationKit Invoke-MgGraphRequest -Times 2 -Exactly -ParameterFilter { $Method -eq 'POST' -and $Uri -like '/beta/groups/*/evaluateDynamicMembership' }
    }
    It 'reads each pilot card holder''s binding with one GET, $select=authorizationInfo and the eventual-consistency header' {
        $inputs = Join-Path $TestDrive 'piv'
        $null = New-Item -ItemType Directory -Path $inputs
        Copy-Item (Join-Path (Join-Path $global:VkTestFixtureRoot 'pass') 'pilot-card-holders.csv') $inputs
        Mock -ModuleName ValidationKit Invoke-MgGraphRequest {
            [pscustomobject]@{ id = 'u1'; userPrincipalName = 'x@contoso.example'; onPremisesSyncEnabled = $false; authorizationInfo = [pscustomobject]@{ certificateUserIds = @('X509:<SKI>00A1') } }
        }
        $r = Invoke-VkCheck -CheckId 'VK-PIV-01' -Context (Get-VkRunContext -InputPath $inputs -AsOf '2026-10-29T00:00:00Z')
        $r.Status | Should -Be 'Pass'
        Should -Invoke -ModuleName ValidationKit Invoke-MgGraphRequest -Times 2 -Exactly -ParameterFilter {
            $Method -eq 'GET' -and $Uri -like '/v1.0/users/*%40contoso.example?$select=*authorizationInfo' -and $Headers['ConsistencyLevel'] -eq 'eventual'
        }
    }
    It 'pages Resource Graph with the skip token' {
        Mock -ModuleName ValidationKit Search-AzGraph {
            if ($SkipToken) { return [pscustomobject]@{ Data = @([pscustomobject]@{ id = 'm2' }); SkipToken = $null } }
            [pscustomobject]@{ Data = @([pscustomobject]@{ id = 'm1' }); SkipToken = 'next' }
        }
        $rows = & (Get-Module ValidationKit) { Invoke-VkResourceGraph -Query 'resources | take 2' }
        @($rows.id) | Should -Be @('m1', 'm2')
        Should -Invoke -ModuleName ValidationKit Search-AzGraph -Times 2 -Exactly
    }
    It 'skips the AD check with -SkipAD' {
        (Invoke-VkCheck -CheckId 'VK-NPI-06' -Context (Get-VkRunContext -SkipAD -AsOf '2026-10-29T00:00:00Z')).Status | Should -Be 'NotApplicable'
    }
    It 'reads AD service accounts with Get-ADUser and Get-ADServiceAccount only' {
        Mock -ModuleName ValidationKit Get-ADUser { @([pscustomobject]@{ SamAccountName = 'svc-web'; Enabled = $true; PasswordNeverExpires = $true; PasswordLastSet = [datetime]'2020-01-01'; servicePrincipalName = @('HTTP/web') }) }
        Mock -ModuleName ValidationKit Get-ADServiceAccount { @([pscustomobject]@{ SamAccountName = 'gmsa-web$'; Enabled = $true; objectClass = @('top', 'msDS-GroupManagedServiceAccount') }) }
        $r = Invoke-VkCheck -CheckId 'VK-NPI-06' -Context (Get-VkRunContext -AsOf '2026-10-29T00:00:00Z')
        $r.Status | Should -Be 'Fail'
        $r.Count | Should -Be 1
    }
}

Describe 'Sign-in' {
    It 'connects delegated with exactly the read scopes the selected checks need' {
        Mock -ModuleName ValidationKit Connect-MgGraph { }
        $checks = @(Get-VkCheckCatalog -Track HR)
        $global:VkWantScopes = @(Get-VkRequiredScope -Checks $checks)
        Connect-VkGraph -Cloud gcc -Scopes $global:VkWantScopes
        Should -Invoke -ModuleName ValidationKit Connect-MgGraph -Times 1 -Exactly -ParameterFilter { $Environment -eq 'Global' -and ($Scopes -join ' ') -eq ($global:VkWantScopes -join ' ') }
        $global:VkWantScopes | Should -Contain 'User.Read.All'
        $global:VkWantScopes | Should -Contain 'LifecycleWorkflows.Read.All'
    }
}
