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
        @{ Id = 'VK-HR-07'; FailStatus = 'Fail'; FailCount = 10 }
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
        @{ Id = 'VK-SYNC-01'; FailStatus = 'Fail'; FailCount = 3 }
        @{ Id = 'VK-SYNC-02'; FailStatus = 'Fail'; FailCount = 2 }
        @{ Id = 'VK-SYNC-03'; FailStatus = 'Fail'; FailCount = 5 }
        @{ Id = 'VK-CA-01'; FailStatus = 'Fail'; FailCount = 4 }
        @{ Id = 'VK-PIV-01'; FailStatus = 'Fail'; FailCount = 3 }
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
    It 'VK-SYNC-01 reports a missing key, a duplicate key and a slot that differs' {
        $r = Invoke-VkCheck -CheckId 'VK-SYNC-01' -Context $FailCtx
        @($r.Details.Object | Sort-Object) | Should -Be @('E1002', 'E9999', 'erin@contoso.example')
        ($r.Details | Where-Object Object -eq 'erin@contoso.example').Detail | Should -Match 'extensionAttribute10=ORG-C -> \(blank\)'
    }
    It 'VK-SYNC-03 joins on the SID and reports each way AD and Entra ID part' {
        $r = Invoke-VkCheck -CheckId 'VK-SYNC-03' -Context $FailCtx
        $f = @($r.Details | Where-Object Severity -eq 'Finding')
        ($f | Where-Object Object -eq 'bob@contoso.example').Detail | Should -Match 'Department=ORG-A -> ORG-B; extensionAttribute10=ORG-B -> ORG-A'
        ($f | Where-Object Object -eq 'ghost@contoso.example').Issue | Should -Match 'no Entra user carries its SID'
        ($f | Where-Object Object -eq 'frank@contoso.example').Issue | Should -Match 'no longer syncs'
        ($f | Where-Object Object -eq 'svcbreak@contoso.example').Issue | Should -Match 'Marked DoNotSync'
        ($f | Where-Object Object -eq 'erin@contoso.example').Issue | Should -Match 'isn''t in the export'
        ($r.Details | Where-Object Severity -eq 'Info').Issue | Should -Match '1 synced user\(s\) from domains the export doesn''t cover'
    }
    It 'VK-SYNC-03 limits the scope to the named domains' {
        $ctx = Get-TestContext 'fail' -Option @{ SyncScopeDomains = @('field.contoso.example') }
        $r = Invoke-VkCheck -CheckId 'VK-SYNC-03' -Context $ctx
        @($r.Details | Where-Object Object -eq 'ghost@contoso.example') | Should -BeNullOrEmpty
        $r.Message | Should -Match '^0 AD user\(s\) in scope'
    }
    It 'VK-SYNC-03 is NotApplicable without the AD export' {
        $ctx = Get-TestContext 'fail' -Option @{ AdUserExportFile = 'no-such-file.csv' }
        (Invoke-VkCheck -CheckId 'VK-SYNC-03' -Context $ctx).Status | Should -Be 'NotApplicable'
    }
    It 'VK-HR-07 reports the fill rates under the threshold and every value-quality rule' {
        $r = Invoke-VkCheck -CheckId 'VK-HR-07' -Context $FailCtx
        @(($r.Details | Where-Object { $_.Severity -eq 'Finding' -and $_.Issue -like 'Fill rate*' }).Object | Sort-Object) | Should -Be @('employeeId', 'employeeType', 'extensionAttribute10', 'extensionAttribute12')
        ($r.Details | Where-Object Object -eq 'employeeId').Detail | Should -Match 'Populated=4; Population=7'
        ($r.Details | Where-Object Object -eq 'bob@contoso.example').Issue | Should -Match 'employeeType has leading or trailing whitespace'
        ($r.Details | Where-Object Object -eq 'dave@contoso.example').Issue | Should -Match 'mail is held by another'
        ($r.Details | Where-Object Object -eq 'erin@contoso.example').Issue | Should -Match 'manager''s account is disabled'
        ($r.Details | Where-Object Object -eq 'frank@contoso.example').Issue | Should -Match 'ORG-C'' isn''t on the code list'
        ($r.Details | Where-Object Object -eq 'svcbreak@contoso.example').Issue | Should -Match 'manager has no employeeId'
        @($r.Details.Object) | Should -Not -Contain 'breakglass@contoso.example'
    }
    It 'VK-HR-07 checks the key format when KeyPattern is set' {
        $r = Invoke-VkCheck -CheckId 'VK-HR-07' -Context (Get-TestContext 'pass' -Option @{ KeyPattern = '^E\d{4}$' })
        $r.Status | Should -Be 'Pass'
        $r = Invoke-VkCheck -CheckId 'VK-HR-07' -Context (Get-TestContext 'pass' -Option @{ KeyPattern = '^MP\d{7}$' })
        @($r.Details | Where-Object Issue -like '*doesn''t match*').Count | Should -Be 3
    }
    It 'VK-HR-07 warns, and still measures the rest, when managers can''t be read' {
        $empty = Join-Path $TestDrive 'nomgr'
        $null = New-Item -ItemType Directory -Path $empty
        Copy-Item (Join-Path $VkTestFixtureRoot 'pass\users.json') $empty
        $r = Invoke-VkCheck -CheckId 'VK-HR-07' -Context (Get-VkRunContext -FixturePath $empty -AsOf '2026-10-29T00:00:00Z')
        $r.Status | Should -Not -Be 'Error'
        ($r.Details | Where-Object Severity -eq 'Warn').Object | Should -Be 'manager'
        @($r.Details | Where-Object { $_.Object -eq 'manager' -and $_.Issue -like 'Fill rate*' }) | Should -BeNullOrEmpty
        @($r.Details | Where-Object { $_.Object -eq 'employeeId' -and $_.Issue -like 'Fill rate*' }) | Should -Not -BeNullOrEmpty
    }
    It 'VK-HR-01 and VK-HR-04 run on one wave from the Start Kit''s waves.csv' {
        $w1 = Get-TestContext 'fail' -Option @{ WaveId = 'W1' }
        $r = Invoke-VkCheck -CheckId 'VK-HR-01' -Context $w1
        @($r.Details.Object | Sort-Object) | Should -Be @('dave@contoso.example', 'frank@contoso.example')
        $r.Message | Should -Match 'wave W1: 3 of its 3 user\(s\) found in Entra ID'
        (Invoke-VkCheck -CheckId 'VK-HR-04' -Context $w1).Count | Should -Be 0
        (Invoke-VkCheck -CheckId 'VK-HR-04' -Context (Get-TestContext 'fail' -Option @{ WaveId = 'W2' })).Count | Should -Be 1
    }
    It 'VK-HR-02, VK-HR-03 and VK-HR-07 run on one wave' {
        $w1 = Get-TestContext 'fail' -Option @{ WaveId = 'W1' }
        @((Invoke-VkCheck -CheckId 'VK-HR-02' -Context $w1).Details.Object) | Should -Be @('dave@contoso.example')
        @((Invoke-VkCheck -CheckId 'VK-HR-03' -Context $w1).Details.Object | Sort-Object) | Should -Be @('ORG-A', 'ORG-B', 'ORG-C')
        (Invoke-VkCheck -CheckId 'VK-HR-07' -Context $w1).Message | Should -Match '^3 enabled member'
    }
    It 'reports a wave with no users, or no wave file, as an error, never as the whole tenant' {
        (Invoke-VkCheck -CheckId 'VK-HR-01' -Context (Get-TestContext 'fail' -Option @{ WaveId = 'W9' })).Status | Should -Be 'Error'
        (Invoke-VkCheck -CheckId 'VK-HR-01' -Context (Get-TestContext 'pass' -Option @{ WaveId = 'W1' })).Status | Should -Be 'Error'
        $r = Invoke-VkCheck -CheckId 'VK-HR-01' -Context (Get-TestContext 'fail' -Option @{ WaveId = 'W3' })
        $r.Status | Should -Be 'Pass'
        $r.Message | Should -Match '0 of its 1 user'
    }
    It 'VK-CA-01 reports the missing exclusion, the unpaired grant and both policies on an ungoverned group, and skips Off and workload policies' {
        $r = Invoke-VkCheck -CheckId 'VK-CA-01' -Context $FailCtx
        ($r.Details | Where-Object Issue -like 'Emergency-access*').ObjectId | Should -Be 'ca-users'
        ($r.Details | Where-Object Issue -like 'Grant with no paired block*').ObjectId | Should -Be 'ca-payroll-grant'
        @(($r.Details | Where-Object Issue -like '*governed-group list').ObjectId | Sort-Object) | Should -Be @('ca-portal-block', 'ca-portal-grant')
        @($r.Details.ObjectId) | Should -Not -Contain 'ca-old-draft'
        @($r.Details.ObjectId) | Should -Not -Contain 'ca-block-workload-identities-off-network'
    }
    It 'VK-CA-01 is NotApplicable without the governed-group list' {
        $ctx = Get-TestContext 'fail' -Option @{ GovernedGroupsFile = 'no-such-file.csv' }
        (Invoke-VkCheck -CheckId 'VK-CA-01' -Context $ctx).Status | Should -Be 'NotApplicable'
    }
    It 'VK-PIV-01 names accounts and binding types, never a certificate value' {
        $r = Invoke-VkCheck -CheckId 'VK-PIV-01' -Context $FailCtx
        @($r.Details.Object | Sort-Object) | Should -Be @('bob@contoso.example', 'carol@contoso.example', 'dave@contoso.example')
        ($r.Details | Where-Object Object -eq 'bob@contoso.example').Detail | Should -Match 'Types=IssuerAndSubject,PrincipalName'
        ($r.Details | Where-Object Object -eq 'carol@contoso.example').Issue | Should -Match 'altSecurityIdentities'
        foreach ($row in $r.Details) { "$($row.Issue) $($row.Detail)" | Should -Not -Match 'X509:' }
    }
    It 'VK-PIV-01 treats low-affinity-only values as context when RequiredAffinity is Low' {
        $ctx = Get-TestContext 'fail' -Option @{ RequiredAffinity = 'Low' }
        (Invoke-VkCheck -CheckId 'VK-PIV-01' -Context $ctx).Count | Should -Be 2
    }
}

Describe 'Beta check VK-INT-07 (Group Policy analytics)' {
    BeforeAll {
        $script:BetaPass = Get-VkRunContext -FixturePath (Join-Path $global:VkTestFixtureRoot 'pass') -AsOf '2026-10-29T00:00:00Z' -IncludeBeta
        $script:BetaFail = Get-VkRunContext -FixturePath (Join-Path $global:VkTestFixtureRoot 'fail') -AsOf '2026-10-29T00:00:00Z' -IncludeBeta
    }
    It 'is NotApplicable without -IncludeBeta' {
        (Invoke-VkCheck -CheckId 'VK-INT-07' -Context $FailCtx).Status | Should -Be 'NotApplicable'
    }
    It 'passes on the pass fixture, listing each imported GPO as context' {
        $r = Invoke-VkCheck -CheckId 'VK-INT-07' -Context $BetaPass
        $r.Status | Should -Be 'Pass' -Because $r.Message
        $r.Count | Should -Be 0
        @($r.Details | Where-Object Severity -eq 'Info').Count | Should -Be 2
    }
    It 'flags targeted GPOs that are not complete, warns on notApplicable, and reports an in-scope GPO never imported' {
        $r = Invoke-VkCheck -CheckId 'VK-INT-07' -Context $BetaFail
        $r.Status | Should -Be 'Fail'
        $r.Count | Should -Be 4
        @(($r.Details | Where-Object Severity -eq 'Finding').Object | Sort-Object) | Should -Be @('Workstation-Drive-Maps', 'Workstation-Printers', 'Workstation-Scripts')
        ($r.Details | Where-Object Severity -eq 'Warn').Object | Should -Be 'Workstation-Empty'
        ($r.Details | Where-Object Object -eq 'Workstation-Drive-Maps').Detail | Should -Match 'UnsupportedExtensions=2'
        $r.Evidence.Stage | Should -Match 'beta'
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

Describe 'Optional check VK-SYNC-02 (developer workbook Building the Attribute-Driven Migration, Chapter 03)' {
    It 'is not selected by default, because its live read needs Global Administrator' {
        @((Get-VkCheckCatalog).Id) | Should -Not -Contain 'VK-SYNC-02'
        $c = Get-VkCheckCatalog -CheckId 'VK-SYNC-02'
        $c.Optional | Should -BeTrue
        $c.DelegatedRole | Should -Match 'Global Administrator'
    }
    It 'reports soft match on UPN as Info, not as a finding' {
        $r = Invoke-VkCheck -CheckId 'VK-SYNC-02' -Context $FailCtx
        @($r.Details | Where-Object Severity -eq 'Info').Count | Should -Be 1
        @($r.Details | Where-Object Severity -eq 'Finding').Issue | Should -Contain 'Soft match is not blocked'
    }
    It 'downgrades to Warn while an approved matching window is open, and fails once it closes' {
        $fx = Join-Path $global:VkTestFixtureRoot 'fail'
        $open = Get-VkRunContext -FixturePath $fx -AsOf '2026-10-29T00:00:00Z' -Option @{ MatchWindowOpenUntil = '2026-10-31' }
        $r = Invoke-VkCheck -CheckId 'VK-SYNC-02' -Context $open
        $r.Status | Should -Be 'Warn'
        $r.Message | Should -Match '2026-10-31'
        $closed = Get-VkRunContext -FixturePath $fx -AsOf '2026-11-01T00:00:00Z' -Option @{ MatchWindowOpenUntil = '2026-10-31' }
        (Invoke-VkCheck -CheckId 'VK-SYNC-02' -Context $closed).Status | Should -Be 'Fail'
    }
    It 'prefers an administrator''s export over a live read' {
        $in = Join-Path $TestDrive 'sync-in'
        $null = New-Item -ItemType Directory -Path $in
        [System.IO.File]::WriteAllText((Join-Path $in 'onprem-sync-export.json'),
            '{"value":[{"id":"x","features":{"blockSoftMatchEnabled":true,"blockCloudObjectTakeoverThroughHardMatchEnabled":false}}]}')
        $ctx = Get-VkRunContext -FixturePath (Join-Path $global:VkTestFixtureRoot 'pass') -InputPath $in -AsOf '2026-10-29T00:00:00Z'
        $r = Invoke-VkCheck -CheckId 'VK-SYNC-02' -Context $ctx
        $r.Count | Should -Be 1
        @($r.Evidence.Queries.Source) | Should -Contain 'Input'
    }
    It 'is NotApplicable when the tenant has no synchronization object' {
        $empty = Join-Path $TestDrive 'nosync'
        $null = New-Item -ItemType Directory -Path $empty
        [System.IO.File]::WriteAllText((Join-Path $empty 'onPremisesSynchronization.json'), '[]')
        (Invoke-VkCheck -CheckId 'VK-SYNC-02' -Context (Get-VkRunContext -FixturePath $empty -AsOf '2026-10-29T00:00:00Z')).Status | Should -Be 'NotApplicable'
    }
}

Describe 'The catalog' {
    It 'implements every check ID in the guides list, one function each, named after the ID' {
        $ids = @('VK-HR-01', 'VK-HR-02', 'VK-HR-03', 'VK-HR-04', 'VK-HR-05', 'VK-HR-06', 'VK-HR-07', 'VK-DG-01', 'VK-DG-02', 'VK-DG-03', 'VK-DG-04', 'VK-DG-05', 'VK-DG-06', 'VK-DG-07',
            'VK-INT-01', 'VK-INT-02', 'VK-INT-03', 'VK-INT-04', 'VK-INT-05', 'VK-INT-06', 'VK-INT-07', 'VK-ARC-01', 'VK-ARC-02', 'VK-ARC-03', 'VK-ARC-04', 'VK-ARC-05', 'VK-ARC-06', 'VK-ARC-07',
            'VK-NPI-01', 'VK-NPI-02', 'VK-NPI-03', 'VK-NPI-04', 'VK-NPI-05', 'VK-NPI-06', 'VK-NPI-07', 'VK-NPI-08', 'VK-NPI-09',
            'VK-SYNC-01', 'VK-SYNC-02', 'VK-SYNC-03', 'VK-CA-01', 'VK-PIV-01')
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
