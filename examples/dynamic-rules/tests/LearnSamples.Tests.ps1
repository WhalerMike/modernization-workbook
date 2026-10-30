#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Baseline: Learn's five dynamic membership processing samples, run unmodified from the pinned
# Learn source pages against a fake tenant (tests/LearnSampleHarness.ps1). Each test pins one
# thing the samples do, so a new upstream version that changes it fails here first.

BeforeAll {
    . (Join-Path $PSScriptRoot 'LearnSampleHarness.ps1')
    $script:Pages = Join-Path $PSScriptRoot '../../third_party/dynamic-membership-samples/scripts'
    function Get-Page([string]$Name) { Join-Path $script:Pages "powershell-$Name-dynamic-membership.md" }
    function New-Tenant {
        param([int]$Throttle = 0)
        New-FakeTenant -ThrottleCount $Throttle -Collections @(
            @{ id = '11111111-1111-1111-1111-111111111111'; displayName = 'FIN-LED all members'; kind = 'group'; state = 'On' }
            @{ id = '22222222-2222-2222-2222-222222222222'; displayName = 'Held for review'; kind = 'group'; state = 'Paused' }
            @{ id = '33333333-3333-3333-3333-333333333333'; displayName = 'Windows company devices'; kind = 'group'; state = 'On' }
            @{ id = '44444444-4444-4444-4444-444444444444'; displayName = 'AU Finance'; kind = 'au'; state = 'On' })
    }
    function Get-States($Tenant) { @($Tenant.Collections.Values | ForEach-Object { "$($_.displayName)=$($_.state)" }) }
    # Answers: run the flow, cloud, groups phase, AU phase, confirm the signed-in account.
    $script:Yes = @('yes', 'USGov', 'yes', 'yes', 'yes')
}

Describe 'Learn sample pages' {
    It 'every pinned page has one PowerShell sample script' {
        foreach ($n in 'pause-all', 'pause-specific', 'pause-all-except', 'resume-specific-critical', 'resume-noncritical') {
            (Get-LearnSampleScript -Page (Get-Page $n)).Length | Should -BeGreaterThan 5000
        }
    }
}

Describe 'Pause all' {
    It 'pauses every group and administrative unit that is On, and skips one already paused' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant (New-Tenant) -Answers $script:Yes
        Get-States $t | Should -Be @('FIN-LED all members=Paused', 'Held for review=Paused', 'Windows company devices=Paused', 'AU Finance=Paused')
        @($t.Calls | Where-Object Method -EQ 'PATCH').Count | Should -Be 3
    }
    It 'signs in to the cloud chosen, with only the scopes for the phases chosen' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant (New-Tenant) -Answers @('yes', 'USGov', 'yes', 'no', 'yes')
        $t.Connected.Environment | Should -Be 'USGov'
        $t.Connected.Scopes | Should -Be @('Group.ReadWrite.All')
        $t.Calls[0].Uri | Should -BeLike 'https://graph.microsoft.us/v1.0/groups*'
    }
    It 'falls back to the worldwide cloud for an answer it does not recognize, such as GCCHigh' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant (New-Tenant) -Answers @('yes', 'GCCHigh', 'yes', 'no', 'yes')
        $t.Connected.Environment | Should -Be 'Global'
        $t.Calls[0].Uri | Should -BeLike 'https://graph.microsoft.com/*'
    }
    It 'keeps no record of which collections it paused' {
        $before = @(Get-ChildItem -Path . -File).Count
        Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant (New-Tenant) -Answers $script:Yes | Out-Null
        @(Get-ChildItem -Path . -File).Count | Should -Be $before
    }
    It 'retries a throttled request once, then counts it as failed' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant (New-Tenant -Throttle 2) -Answers @('yes', 'Global', 'yes', 'no', 'yes')
        ($t.Output -join "`n") | Should -Match 'Failed to fetch'
        (Get-States $t) | Should -Contain 'FIN-LED all members=On'
    }
    It 'stops without the operator typing yes' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant (New-Tenant) -Answers @('no')
        $t.Calls.Count | Should -Be 0
    }
}

Describe 'Pause specific and pause all except' {
    It 'pauses only the IDs supplied' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-specific') -Tenant (New-Tenant) -Answers @('yes', 'Global', 'yes', 'no', 'yes', '11111111-1111-1111-1111-111111111111', 'yes')
        Get-States $t | Should -Contain 'FIN-LED all members=Paused'
        Get-States $t | Should -Contain 'Windows company devices=On'
    }
    It 'pauses everything that is On except the IDs supplied' {
        $t = Invoke-LearnSample -Page (Get-Page 'pause-all-except') -Tenant (New-Tenant) -Answers @('yes', 'Global', 'yes', 'no', 'yes', '33333333-3333-3333-3333-333333333333', 'yes')
        Get-States $t | Should -Contain 'FIN-LED all members=Paused'
        Get-States $t | Should -Contain 'Windows company devices=On'
    }
}

Describe 'Resume' {
    It 'resume noncritical turns on every paused group, including one paused before the incident' {
        $t = New-Tenant
        Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant $t -Answers $script:Yes | Out-Null
        $t.Connected = $null
        Invoke-LearnSample -Page (Get-Page 'resume-noncritical') -Tenant $t -Answers $script:Yes | Out-Null
        Get-States $t | Should -Contain 'Held for review=On'
    }
    It 'resume noncritical takes at most 100 of each kind per run' {
        $script:Script = Get-LearnSampleScript -Page (Get-Page 'resume-noncritical')
        $script:Script | Should -Match ([regex]::Escape('$top=100'))
    }
    It 'resume specific critical turns on only the IDs supplied' {
        $t = New-Tenant
        Invoke-LearnSample -Page (Get-Page 'pause-all') -Tenant $t -Answers $script:Yes | Out-Null
        $t.Connected = $null
        Invoke-LearnSample -Page (Get-Page 'resume-specific-critical') -Tenant $t -Answers @('yes', 'USGov', 'yes', 'no', 'yes', '11111111-1111-1111-1111-111111111111', 'yes') | Out-Null
        Get-States $t | Should -Contain 'FIN-LED all members=On'
        Get-States $t | Should -Contain 'Windows company devices=Paused'
    }
    It 'nothing in the resume samples enforces the wait Learn asks for' {
        foreach ($n in 'resume-noncritical', 'resume-specific-critical') {
            Get-LearnSampleScript -Page (Get-Page $n) | Should -Not -Match '(?i)AddHours|TimeSpan|Get-Date'
        }
    }
}
