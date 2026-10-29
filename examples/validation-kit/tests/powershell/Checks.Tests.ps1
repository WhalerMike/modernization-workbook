# Every check against the pass and fail fixtures (a fictional tenant, contoso.example): the
# status and the count each must give. The fail fixture plants each problem the check exists
# to find; the pass fixture has none.

BeforeDiscovery {
    $script:Cases = @(
        @{ Id = 'VK-HR-01'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-HR-02'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-HR-03'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-HR-04'; FailStatus = 'Fail'; FailCount = 1 }
        @{ Id = 'VK-HR-05'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-HR-06'; FailStatus = 'Fail'; FailCount = 1 }
        @{ Id = 'VK-DG-01'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-DG-02'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-DG-03'; FailStatus = 'Fail'; FailCount = 1 }
        @{ Id = 'VK-DG-04'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-DG-05'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-DG-06'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-DG-07'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-INT-01'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-INT-02'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-INT-03'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-INT-04'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-INT-05'; FailStatus = 'Warn'; FailCount = 1 }
        @{ Id = 'VK-INT-06'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-ARC-01'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-ARC-02'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-ARC-03'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-ARC-04'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-ARC-05'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-ARC-06'; FailStatus = 'Fail'; FailCount = 4 }
        @{ Id = 'VK-ARC-07'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-NPI-01'; FailStatus = 'Fail'; FailCount = 4 }
        @{ Id = 'VK-NPI-02'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-NPI-03'; FailStatus = 'Fail'; FailCount = 1 }
        @{ Id = 'VK-NPI-04'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-NPI-05'; FailStatus = 'Warn'; FailCount = 3 }
        @{ Id = 'VK-NPI-06'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-NPI-07'; FailStatus = 'Warn'; FailCount = 1 }
        @{ Id = 'VK-NPI-08'; FailStatus = 'Fail'; FailCount = 1 }
        @{ Id = 'VK-NPI-09'; FailStatus = 'Fail'; FailCount = 3 }
    )
}

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    $script:PassCtx = Get-TestContext 'pass' -IncludePreview
    $script:FailCtx = Get-TestContext 'fail' -IncludePreview
}

Describe '<Id>' -ForEach $Cases {
    BeforeAll {
        $script:Pass = Invoke-VkCheck -CheckId $Id -Context $PassCtx
        $script:Fail = Invoke-VkCheck -CheckId $Id -Context $FailCtx
    }
    It 'passes on the pass fixture with a count of 0' {
        $Pass.Status | Should -Be 'Pass' -Because $Pass.Message
        $Pass.Count | Should -Be 0
    }
    It 'gives <FailStatus> with a count of <FailCount> on the fail fixture' {
        $Fail.Status | Should -Be $FailStatus -Because $Fail.Message
        $Fail.Count | Should -Be $FailCount
        @($Fail.Details | Where-Object Severity -ne 'Info').Count | Should -Be $FailCount
    }
    It 'returns the result shape, with evidence: the query or source and a timestamp' {
        foreach ($r in $Pass, $Fail) {
            $r.CheckId | Should -Be $Id
            $r.Track | Should -Be $Id.Split('-')[1]
            @('Pass', 'Fail', 'Warn', 'NotApplicable', 'Error') | Should -Contain $r.Status
            @($r.Evidence.Queries).Count | Should -BeGreaterThan 0
            $r.Evidence.CollectedAtUtc | Should -Match '^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$'
            $r.Evidence.Mode | Should -Be 'Fixture'
        }
    }
    It 'gives every detail row the same columns' {
        foreach ($row in @($Fail.Details)) { @($row.PSObject.Properties.Name) | Should -Be @('Severity', 'Object', 'ObjectId', 'Issue', 'Detail') }
    }
}

Describe 'What the checks find' {
    It 'VK-HR-01 names the uncorrelated users and ignores an exception with no owner' {
        $r = Invoke-VkCheck -CheckId 'VK-HR-01' -Context $FailCtx
        @($r.Details.Object | Sort-Object) | Should -Be @('dave@contoso.example', 'frank@contoso.example', 'svcbreak@contoso.example')
        ($r.Details | Where-Object Object -eq 'svcbreak@contoso.example').Issue | Should -Match 'names no owner'
    }
    It 'VK-HR-05 separates misses outside the 3-day catch-up from those inside it' {
        $r = Invoke-VkCheck -CheckId 'VK-HR-05' -Context $FailCtx
        @($r.Details | Where-Object Severity -eq 'Finding').Count | Should -Be 2
        ($r.Details | Where-Object Severity -eq 'Warn').Object | Should -Be 'dave@contoso.example'
    }
    It 'VK-DG-03 marks its Graph call as beta, read-only evaluation' {
        (Get-VkCheckCatalog -CheckId 'VK-DG-03').Stage | Should -Be 'beta'
        (Invoke-VkCheck -CheckId 'VK-DG-03' -Context $FailCtx).Message | Should -Match 'beta'
    }
    It 'VK-DG-05 hands back the counts of this run as the next snapshot' {
        $r = Invoke-VkCheck -CheckId 'VK-DG-05' -Context $FailCtx
        $r.Artifacts.Snapshot.groups.Count | Should -BeGreaterThan 0
    }
    It 'VK-ARC-06 reports each kind of role problem' {
        $issues = (Invoke-VkCheck -CheckId 'VK-ARC-06' -Context $FailCtx).Details.Issue -join "`n"
        foreach ($p in 'Owner held outside', 'Contributor held outside', 'not PIM-eligible', 'no open wave', 'Individual user') { $issues | Should -Match $p }
    }
    It 'VK-ARC-07 takes the owner from the CMDB, then the ConfigOwner tag, and warns when there is none' {
        $r = Invoke-VkCheck -CheckId 'VK-ARC-07' -Context $FailCtx
        @(@($r.Details | Where-Object Severity -eq 'Finding').Object | Sort-Object) | Should -Be @('srv-exp01', 'srv-web01')
        ($r.Details | Where-Object Severity -eq 'Warn').Object | Should -Be 'srv-old01'
    }
    It 'VK-INT-06 flags out-of-support platforms and warns on limited ones' {
        $r = Invoke-VkCheck -CheckId 'VK-INT-06' -Context $FailCtx
        @(@($r.Details | Where-Object Severity -eq 'Finding').Object | Sort-Object) | Should -Be @('IPHONE-OLD', 'PC-OLD')
        ($r.Details | Where-Object Severity -eq 'Warn').Object | Should -Be 'PC-W10'
    }
}

Describe 'Optional preview check VK-NPI-09' {
    It 'is not selected by default' {
        @((Get-VkCheckCatalog).Id) | Should -Not -Contain 'VK-NPI-09'
        @((Get-VkCheckCatalog -IncludeOptional).Id) | Should -Contain 'VK-NPI-09'
        $c = Get-VkCheckCatalog -CheckId 'VK-NPI-09'
        $c.Optional | Should -BeTrue
        $c.Preview | Should -BeTrue
    }
    It 'is NotApplicable without -IncludePreview' {
        (Invoke-VkCheck -CheckId 'VK-NPI-09' -Context (Get-TestContext 'fail')).Status | Should -Be 'NotApplicable'
    }
    It 'is NotApplicable in the US Government clouds, where the report is not documented' {
        $ctx = Get-VkRunContext -FixturePath (Join-Path $global:VkTestFixtureRoot 'fail') -AsOf '2026-10-29T00:00:00Z' -Cloud gcchigh -IncludePreview
        (Invoke-VkCheck -CheckId 'VK-NPI-09' -Context $ctx).Message | Should -Match 'L4 or L5'
    }
}

Describe 'The catalog' {
    It 'implements every check ID in the guides list, one function each, named after the ID' {
        $ids = @('VK-HR-01', 'VK-HR-02', 'VK-HR-03', 'VK-HR-04', 'VK-HR-05', 'VK-HR-06', 'VK-DG-01', 'VK-DG-02', 'VK-DG-03', 'VK-DG-04', 'VK-DG-05', 'VK-DG-06', 'VK-DG-07',
            'VK-INT-01', 'VK-INT-02', 'VK-INT-03', 'VK-INT-04', 'VK-INT-05', 'VK-INT-06', 'VK-ARC-01', 'VK-ARC-02', 'VK-ARC-03', 'VK-ARC-04', 'VK-ARC-05', 'VK-ARC-06', 'VK-ARC-07',
            'VK-NPI-01', 'VK-NPI-02', 'VK-NPI-03', 'VK-NPI-04', 'VK-NPI-05', 'VK-NPI-06', 'VK-NPI-07', 'VK-NPI-08', 'VK-NPI-09')
        $cat = @(Get-VkCheckCatalog -IncludeOptional)
        @($cat.Id) | Should -Be $ids
        foreach ($c in $cat) {
            Get-Command -Module ValidationKit -Name $c.Function | Should -Not -BeNullOrEmpty
            @($c.Learn).Count | Should -BeGreaterThan 0
            (@($c.GraphPermissions).Count + [int][bool]$c.AzureRole + [int][bool]$c.DelegatedRole) | Should -BeGreaterThan 0
        }
        (Get-VkCheckCatalog -CheckId 'VK-HR-01').Function | Should -Be 'Invoke-VkHr01'
    }
    It 'lists every check in the README permissions table' {
        $readme = Get-Content -Raw (Join-Path $KitRoot 'README.md')
        foreach ($c in Get-VkCheckCatalog -IncludeOptional) { $readme | Should -Match ([regex]::Escape("| $($c.Id) |")) }
    }
    It 'asks only for read permissions' {
        $all = @(Get-VkCheckCatalog -IncludeOptional | ForEach-Object { $_.GraphPermissions }) | Sort-Object -Unique
        @($all | Where-Object { $_ -match 'ReadWrite|\.Write|AccessAsUser|\.Manage|FullControl' }) | Should -BeNullOrEmpty
    }
    It 'reports a missing fixture as Error, never as Pass' {
        $empty = Join-Path $TestDrive 'empty'
        $null = New-Item -ItemType Directory -Path $empty
        $r = Invoke-VkCheck -CheckId 'VK-HR-04' -Context (Get-VkRunContext -FixturePath $empty -AsOf '2026-10-29T00:00:00Z')
        $r.Status | Should -Be 'Error'
        $r.Message | Should -Match 'users.json'
    }
    It 'rejects an unknown option and an unknown check ID' {
        { Get-VkRunContext -Option @{ NoSuchOption = 1 } } | Should -Throw '*Unknown option*'
        { Get-VkCheckCatalog -CheckId 'VK-XX-99' } | Should -Throw '*Unknown check ID*'
    }
}
