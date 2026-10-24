#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Shared-module tests: config, endpoints, retries, tokens, paging, hashing.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath '../..')
    Import-Module (Join-Path -Path $script:Kit -ChildPath 'clients/powershell/IdentityKit.psm1') -Force

    function Get-HttpError([int]$Status, [int]$RetryAfter = 0) {
        $msg = [System.Net.Http.HttpResponseMessage]::new([System.Net.HttpStatusCode]$Status)
        if ($RetryAfter -gt 0) {
            $msg.Headers.RetryAfter = [System.Net.Http.Headers.RetryConditionHeaderValue]::new([TimeSpan]::FromSeconds($RetryAfter))
        }
        return [Microsoft.PowerShell.Commands.HttpResponseException]::new("HTTP $Status", $msg)
    }
}

Describe 'Get-KitConfig' {
    It 'lets environment values override the file' {
        $path = Join-Path -Path $TestDrive -ChildPath 'cfg.json'
        '{"SAILPOINT_TENANT":"from-file","SN_INSTANCE":"contoso"}' | Set-Content -LiteralPath $path
        $cfg = Get-KitConfig -Path $path -Environment @{ SAILPOINT_TENANT = 'from-env' }
        $cfg.SAILPOINT_TENANT | Should -Be 'from-env'
        $cfg.SN_INSTANCE | Should -Be 'contoso'
        $cfg.SN_FINDING_TABLE | Should -Be 'u_identity_finding'
    }
    It 'refuses secrets in the file' {
        $path = Join-Path -Path $TestDrive -ChildPath 'bad.json'
        '{"SN_CLIENT_SECRET":"x"}' | Set-Content -LiteralPath $path
        { Get-KitConfig -Path $path -Environment @{} } | Should -Throw '*must not contain secrets*'
    }
    It 'loads the example config' {
        $cfg = Get-KitConfig -Path (Join-Path -Path $script:Kit -ChildPath 'config/config.example.json') -Environment @{}
        $cfg.SN_INSTANCE | Should -Be 'contoso'
    }
}

Describe 'Endpoints' {
    It 'maps <Cloud> to its national cloud endpoints' -TestCases @(
        @{ Cloud = 'Global'; Login = 'https://login.microsoftonline.com'; Graph = 'https://graph.microsoft.com' }
        @{ Cloud = 'USGov'; Login = 'https://login.microsoftonline.us'; Graph = 'https://graph.microsoft.us' }
        @{ Cloud = 'USGovDoD'; Login = 'https://login.microsoftonline.us'; Graph = 'https://dod-graph.microsoft.us' }
    ) {
        $e = Get-KitGraphEndpoint -Config @{ GRAPH_CLOUD = $Cloud }
        $e[0] | Should -Be $Login
        $e[1] | Should -Be $Graph
    }
    It 'rejects an unknown cloud' {
        { Get-KitGraphEndpoint -Config @{ GRAPH_CLOUD = 'GCC' } } | Should -Throw
    }
    It 'builds ISC and ServiceNow base URLs' {
        Get-KitIscBaseUrl -Config @{ SAILPOINT_TENANT = 'example' } | Should -Be 'https://example.api.identitynow.com'
        Get-KitSnBaseUrl -Config @{ SN_INSTANCE = 'contoso' } | Should -Be 'https://contoso.service-now.com'
    }
}

Describe 'Invoke-KitRequest retries' {
    BeforeEach { $script:calls = 0 }
    It 'waits Retry-After on 429 then succeeds' {
        Mock Start-Sleep -ModuleName IdentityKit {}
        Mock Invoke-RestMethod -ModuleName IdentityKit {
            $script:calls++
            if ($script:calls -eq 1) { throw (Get-HttpError 429 2) }
            return [pscustomobject]@{ ok = $true }
        }
        (Invoke-KitRequest -Method GET -Uri 'https://h/x').ok | Should -BeTrue
        Should -Invoke Start-Sleep -ModuleName IdentityKit -Times 1 -ParameterFilter { $Milliseconds -eq 2000 }
    }
    It 'gives up after MaxRetries' {
        Mock Start-Sleep -ModuleName IdentityKit {}
        Mock Invoke-RestMethod -ModuleName IdentityKit { $script:calls++; throw (Get-HttpError 429 1) }
        { Invoke-KitRequest -Method GET -Uri 'https://h/x' -MaxRetries 2 } | Should -Throw
        $script:calls | Should -Be 3
    }
    It 'does not retry a 404' {
        Mock Start-Sleep -ModuleName IdentityKit {}
        Mock Invoke-RestMethod -ModuleName IdentityKit { $script:calls++; throw (Get-HttpError 404) }
        { Invoke-KitRequest -Method GET -Uri 'https://h/x' } | Should -Throw
        $script:calls | Should -Be 1
    }
}

Describe 'Tokens' {
    It 'gets an ISC token by client credentials' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ access_token = 'isc-tok' } } -ParameterFilter { $Uri -eq 'https://example.api.identitynow.com/oauth/token' }
        $h = Get-KitIscHeader -Config @{ SAILPOINT_TENANT = 'example'; SAILPOINT_CLIENT_ID = 'cid' } -Environment @{ SAILPOINT_CLIENT_SECRET = 's' }
        $h.Authorization | Should -Be 'Bearer isc-tok'
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -Times 1 -ParameterFilter { $Body.grant_type -eq 'client_credentials' }
    }
    It 'uses a vault-fed ISC token without a request' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { throw 'should not be called' }
        (Get-KitIscHeader -Config @{} -Environment @{ SAILPOINT_ACCESS_TOKEN = 'vault' }).Authorization | Should -Be 'Bearer vault'
    }
    It 'gets a ServiceNow OAuth token, else basic, else throws' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ access_token = 'sn-tok' } } -ParameterFilter { $Uri -like '*/oauth_token.do' }
        (Get-KitSnHeader -Config @{ SN_INSTANCE = 'contoso'; SN_CLIENT_ID = 'cid' } -Environment @{ SN_CLIENT_SECRET = 's' }).Authorization | Should -Be 'Bearer sn-tok'
        (Get-KitSnHeader -Config @{ SN_INSTANCE = 'contoso'; SN_USERNAME = 'u' } -Environment @{ SN_PASSWORD = 'p' }).Authorization | Should -BeLike 'Basic *'
        { Get-KitSnHeader -Config @{ SN_INSTANCE = 'contoso' } -Environment @{} } | Should -Throw
    }
    It 'uses the national-cloud authority and scope for Graph' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ access_token = 'g' } }
        $cfg = @{ GRAPH_CLOUD = 'USGov'; GRAPH_TENANT_ID = 'tid'; GRAPH_CLIENT_ID = 'cid' }
        (Get-KitGraphHeader -Config $cfg -Environment @{ GRAPH_CLIENT_SECRET = 's' }).Authorization | Should -Be 'Bearer g'
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -Times 1 -ParameterFilter {
            $Uri -eq 'https://login.microsoftonline.us/tid/oauth2/v2.0/token' -and $Body.scope -eq 'https://graph.microsoft.us/.default'
        }
    }
    It 'builds a PS256 client assertion from a certificate' {
        $rsa = [System.Security.Cryptography.RSA]::Create(2048)
        $req = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=kit-test', $rsa,
            [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
        $cert = $req.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-5), [DateTimeOffset]::UtcNow.AddDays(1))
        $jwt = ConvertTo-KitClientAssertion -Certificate $cert -ClientId 'cid' -Audience 'https://login/x/token' -Now 1000
        $parts = $jwt.Split('.')
        $parts.Count | Should -Be 3
        $pad = { param($s) $s = $s.Replace('-', '+').Replace('_', '/'); $s + ('=' * ((4 - $s.Length % 4) % 4)) }
        $header = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((& $pad $parts[0]))) | ConvertFrom-Json
        $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((& $pad $parts[1]))) | ConvertFrom-Json
        $header.alg | Should -Be 'PS256'
        $header.'x5t#S256' | Should -Not -BeNullOrEmpty
        $claims.iss | Should -Be 'cid'
        $claims.exp | Should -Be 1600
    }
}

Describe 'Paging' {
    It 'follows @odata.nextLink' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://g/next' } } -ParameterFilter { $Uri -like '*users*' }
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ value = @(@{ id = 2 }) } } -ParameterFilter { $Uri -eq 'https://g/next' }
        @(Get-KitGraphPaged -Uri 'https://g/users').id | Should -Be @(1, 2)
    }
    It 'pages ISC search with searchAfter' {
        $script:bodies = @()
        Mock Invoke-RestMethod -ModuleName IdentityKit {
            $script:bodies += $Body
            if ($script:bodies.Count -eq 1) { return @([pscustomobject]@{ id = 'a' }, [pscustomobject]@{ id = 'b' }) }
            return @([pscustomobject]@{ id = 'c' })
        }
        @(Get-KitIscSearchPaged -BaseUrl 'https://t' -Body @{ indices = @('identities') } -PageSize 2).id | Should -Be @('a', 'b', 'c')
        ($script:bodies[1] | ConvertFrom-Json).searchAfter | Should -Be @('b')
        ($script:bodies[0] | ConvertFrom-Json).sort | Should -Be @('id')
    }
    It 'pages ISC lists and the ServiceNow table by offset' {
        $script:uris = @()
        Mock Invoke-RestMethod -ModuleName IdentityKit {
            $script:uris += ([uri]$Uri).AbsoluteUri
            if ($Uri -like '*offset=0*') { return @([pscustomobject]@{ id = 1 }, [pscustomobject]@{ id = 2 }) }
            return @()
        } -ParameterFilter { $Uri -like '*/v3/accounts*' }
        @(Get-KitIscListPaged -Uri 'https://t/v3/accounts' -Limit 2 -Filters 'uncorrelated eq true').Count | Should -Be 2
        $script:uris[1] | Should -BeLike '*offset=2*'
        $script:uris[0] | Should -BeLike '*filters=uncorrelated%20eq%20true*'

        Mock Invoke-RestMethod -ModuleName IdentityKit {
            if ($Uri -like '*sysparm_offset=0*') { return [pscustomobject]@{ result = @(@{ a = 1 }, @{ a = 2 }) } }
            return [pscustomobject]@{ result = @(@{ a = 3 }) }
        } -ParameterFilter { $Uri -like '*/api/now/table/*' }
        @(Get-KitSnTablePaged -BaseUrl 'https://sn' -Table 't' -Query 'active=true' -Fields 'a' -Limit 2).Count | Should -Be 3
    }
}

Describe 'Hashing' {
    It 'is key-order independent and matches the Python kit for simple values' {
        Get-KitSha256 ([ordered]@{ a = 1; b = 2 }) | Should -Be (Get-KitSha256 ([ordered]@{ b = 2; a = 1 }))
        # sha256 of the canonical JSON {"a":1,"b":[true,null,"x"]}, as Python's kit_common.sha256_hex computes it.
        $expected = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes('{"a":1,"b":[true,null,"x"]}'))).Replace('-', '').ToLowerInvariant()
        Get-KitSha256 ([ordered]@{ b = @($true, $null, 'x'); a = 1 }) | Should -Be $expected
    }
}
