#Requires -Version 7.5
# Developer workbook Chapter 02: the client pattern for worldwide, GCC, GCC High and DoD, in
# PowerShell. The same rules as tests/python/test_graph_clients.py. Connect-MgGraph and
# Invoke-MgGraphRequest are replaced by mocks, so nothing signs in or touches the network.

BeforeAll {
    # Stand-ins so Pester can mock the Microsoft Graph PowerShell commands without the module.
    function global:Connect-MgGraph { param([string]$Environment, [string]$TenantId, [string]$ClientId, [string]$CertificateThumbprint, [switch]$Identity, [switch]$NoWelcome) }
    function global:Invoke-MgGraphRequest { param([string]$Method, [string]$Uri, $Headers, [string]$OutputType) }
    Import-Module (Join-Path $PSScriptRoot '..' '..' 'powershell' 'FmwGraph.psm1') -Force
    $fix = Join-Path $PSScriptRoot '..' 'fixtures'
    $expectedClouds = Get-Content -Raw (Join-Path $fix 'clouds.json') | ConvertFrom-Json -AsHashtable
    function New-TestJwt([string[]]$Roles) {
        $enc = { param($o) [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($o | ConvertTo-Json -Compress))).TrimEnd('=').Replace('+', '-').Replace('/', '_') }
        "$(& $enc @{ alg = 'none' }).$(& $enc @{ roles = $Roles }).sig"
    }
}

AfterAll {
    Remove-Module FmwGraph -ErrorAction SilentlyContinue
    Remove-Item function:global:Connect-MgGraph, function:global:Invoke-MgGraphRequest -ErrorAction SilentlyContinue
}

Describe 'The right cloud' {
    It 'matches the shared endpoint fixture for <_>' -ForEach @('global', 'gcc', 'gcchigh', 'dod') {
        $c = Get-FmwCloud $_
        $e = $expectedClouds[$_]
        @($c.Login, $c.Graph, $c.Arm, $c.Environment, $c.AzureEnvironment) | Should -Be @($e.login, $e.graph, $e.arm, $e.ps_env, $e.azure_env)
    }
    It 'treats GCC as the worldwide service with commercial Resource Manager' {
        $gcc = Get-FmwCloud gcc
        $gcc.Graph | Should -Be 'https://graph.microsoft.com'
        $gcc.Arm | Should -Be 'https://management.azure.com'
        $gcc.AzureEnvironment | Should -Be 'AzureCloud'
    }
    It 'refuses a cloud name it does not know' {
        { Get-FmwCloud GCCHigh2 } | Should -Throw
    }
    It 'signs in to the environment for the cloud' -ForEach @(
        @{ Cloud = 'gcc'; Env = 'Global' }, @{ Cloud = 'gcchigh'; Env = 'USGov' }, @{ Cloud = 'dod'; Env = 'USGovDoD' }
    ) {
        Mock Connect-MgGraph -ModuleName FmwGraph {}
        Connect-FmwGraph -Cloud $Cloud -Identity
        Should -Invoke Connect-MgGraph -ModuleName FmwGraph -Times 1 -Exactly -ParameterFilter { $Environment -eq $Env -and $Identity }
    }
}

Describe 'The token stays on the cloud''s Graph host' {
    It 'refuses an absolute URI on another host' {
        { Assert-FmwGraphCall -Method GET -Uri 'https://graph.microsoft.com/v1.0/users' -Cloud dod } | Should -Throw '*Refusing*'
        { Assert-FmwGraphCall -Method GET -Uri 'https://evil.example/v1.0/users' -Cloud gcc } | Should -Throw '*Refusing*'
    }
    It 'stops paging when a nextLink points at another host' {
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { @{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://evil.example/steal' } }
        { @(Get-FmwGraphCollection -Uri '/v1.0/users' -Cloud gcc) } | Should -Throw '*Refusing*'
        Should -Invoke Invoke-MgGraphRequest -ModuleName FmwGraph -Times 1 -Exactly
    }
    It 'needs a cloud before it reads anything' {
        InModuleScope FmwGraph { $script:ConnectedCloud = $null }
        { Get-FmwGraphCollection -Uri '/v1.0/users' } | Should -Throw '*Connect-FmwGraph*'
    }
}

Describe 'Least privilege per call' {
    It 'each Entra task''s permissions are the union of its calls' {
        $declared = InModuleScope FmwGraph { $script:Permissions }
        foreach ($task in $declared.Keys) {
            $fromCalls = Get-FmwCallPermission -Task $task
            $fromCalls | Should -Be @($declared[$task] | Sort-Object -CaseSensitive) -Because $task
        }
    }
    It 'each Intune task''s permissions are the union of its calls' {
        foreach ($task in 'noncompliant-devices', 'compliance-coverage', 'stale-checkin', 'device-posture', 'autopilot-profiles') {
            $fromCalls = Get-FmwCallPermission -Task $task
            $declared = Get-FmwIntunePermission -Task $task
            $fromCalls | Should -Be @($declared | Sort-Object -CaseSensitive) -Because $task
        }
    }
    It 'a task makes no call outside its list' {
        { Assert-FmwGraphCall -Method GET -Uri '/v1.0/users' -Cloud gcc -Task 'ca-export' } | Should -Throw '*Undeclared call*'
        (Assert-FmwGraphCall -Method GET -Uri '/v1.0/deviceManagement/deviceCompliancePolicies/cp1/assignments' -Cloud gcc -Task 'compliance-coverage')['id'] | Should -Be 'compliance-policy-assignments'
    }
    It 'the Entra task sends only its declared calls' {
        Mock Connect-MgGraph -ModuleName FmwGraph {}
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { @{ value = @() } }
        Connect-FmwGraph -Cloud gcc -Identity
        $null = Invoke-FmwEntraTask -Task 'pim-report'
        Should -Invoke Invoke-MgGraphRequest -ModuleName FmwGraph -Times 3 -Exactly
    }
    It 'reads the roles claim and reports missing and extra permissions' {
        $t = New-TestJwt -Roles 'Policy.Read.All', 'Directory.Read.All'
        $r = Test-FmwTokenRole -Token $t -Needed 'Policy.Read.All', 'AuditLog.Read.All'
        $r.Missing | Should -Be @('AuditLog.Read.All')
        $r.Extra | Should -Be @('Directory.Read.All')
        { Get-FmwTokenRole -Token 'not-a-jwt' } | Should -Throw
    }
}

Describe 'Paging' {
    It 'follows nextLink and sends the same headers on every page' {
        $script:pages = [System.Collections.Generic.Queue[object]]::new()
        $script:pages.Enqueue(@{ value = @(@{ id = 1 }); '@odata.nextLink' = 'https://graph.microsoft.com/v1.0/users?$skiptoken=A' })
        $script:pages.Enqueue(@{ value = @(@{ id = 2 }) })
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { $script:pages.Dequeue() }
        @(Get-FmwGraphCollection -Uri '/v1.0/users?$count=true' -Advanced -Cloud gcc | ForEach-Object { $_.id }) | Should -Be @(1, 2)
        Should -Invoke Invoke-MgGraphRequest -ModuleName FmwGraph -Times 2 -Exactly -ParameterFilter { $Headers['ConsistencyLevel'] -eq 'eventual' -and $Headers['x-ms-throttle-priority'] -eq 'Low' }
    }
}

Describe 'Beta without depending on it' {
    It 'refuses an undeclared beta call' {
        { Assert-FmwGraphCall -Method GET -Uri '/beta/users' -Cloud gcc } | Should -Throw '*Undeclared beta call*'
    }
    It 'makes no call where the feature is not offered' {
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { @{ value = @() } }
        $r = Get-FmwBetaCollection -Path '/deviceManagement/windowsAutopilotDeviceIdentities' -Task 'autopilot-profiles' -Cloud gcchigh
        $r.available | Should -BeFalse
        $r.reason | Should -BeLike "*isn't offered in gcchigh*"
        Should -Invoke Invoke-MgGraphRequest -ModuleName FmwGraph -Times 0 -Exactly
    }
    It 'reports not evaluated when beta answers 404, and throws on 403' {
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { throw 'Response status code does not indicate success: 404 (NotFound).' }
        (Get-FmwBetaCollection -Path '/deviceManagement/windowsAutopilotDeviceIdentities' -Task 'autopilot-profiles' -Cloud gcc).available | Should -BeFalse
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { throw 'Response status code does not indicate success: 403 (Forbidden).' }
        { Get-FmwBetaCollection -Path '/deviceManagement/windowsAutopilotDeviceIdentities' -Task 'autopilot-profiles' -Cloud gcc } | Should -Throw '*403*'
    }
    It 'the Autopilot task says not evaluated in GCC High' {
        Mock Connect-MgGraph -ModuleName FmwGraph {}
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { @{ value = @() } }
        Connect-FmwGraph -Cloud gcchigh -Identity
        $r = Invoke-FmwIntuneTask -Task 'autopilot-profiles'
        $r.stage | Should -Be 'beta'
        $r.evaluated | Should -BeFalse
        Should -Invoke Invoke-MgGraphRequest -ModuleName FmwGraph -Times 0 -Exactly
    }
    It 'the Autopilot task evaluates and labels the stage in GCC' {
        Mock Connect-MgGraph -ModuleName FmwGraph {}
        Mock Invoke-MgGraphRequest -ModuleName FmwGraph { @{ value = @(@{ id = 'ap1'; serialNumber = 'SN1'; deploymentProfileAssignmentStatus = 'assignedInSync' }) } }
        Connect-FmwGraph -Cloud gcc -Identity
        $r = Invoke-FmwIntuneTask -Task 'autopilot-profiles'
        @($r.stage, $r.evaluated, $r.total) | Should -Be @('beta', $true, 1)
    }
}
