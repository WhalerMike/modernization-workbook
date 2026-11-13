#Requires -Version 7.1
# Pester 5: live mode without a tenant. Every command a live call would run, the cloud guard, paging and
# the refusal of unverified calls, against stand-in runners: nothing is started and nothing is sent.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/ProviderNotices/ProviderNotices.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:S = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    function script:Gov {
        $g = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
        $g.providers.azure.cloud = 'AzureUSGovernment'; $g.providers.m365.cloud = 'gcc'
        $g.providers.oci.realm = 'oc2'; $g.providers.oci.region = 'us-langley-1'; $g.providers.aws.partition = 'aws-us-gov'
        $g
    }
}
AfterAll { $null = Set-PnRunner -Native { param($Tool, $Arguments) $o = & $Tool @Arguments 2>&1; @{ ExitCode = $LASTEXITCODE; Output = (@($o) -join "`n") } } }

Describe 'The live commands' {
    It 'runs the Resource Graph query with az, scoped to the subscriptions, 1,000 rows a page' {
        $c = Get-PnLiveCommand -CallId azure-service-health-events -Settings $S
        $c.Tool | Should -Be 'az'
        $c.Arguments[0..1] | Should -Be @('graph', 'query')
        $c.Arguments | Should -Contain '--first'
        $c.Arguments[$c.Arguments.IndexOf('--first') + 1] | Should -Be '1000'
        $c.Arguments[$c.Arguments.IndexOf('--subscriptions') + 1] | Should -Be '00000000-0000-0000-0000-00000000aa01'
        $q = $c.Arguments[$c.Arguments.IndexOf('-q') + 1]
        $q | Should -Match "^ServiceHealthResources \| where type =~ 'Microsoft.ResourceHealth/events'"
        $q | Should -Match "eventType in \('HealthAdvisory', 'SecurityAdvisory', 'PlannedMaintenance'\) and impactMitigationTime > now\(\)"
        $q | Should -Match 'eventSubType = tostring\(properties.EventSubType\)'
    }
    It 'uses Learn''s impacted-resources query as published' {
        $q = Get-PnAzureQuery -Name impacted
        $q | Should -Match ([regex]::Escape("extend TrackingId = split(split(id, '/events/', 1)[0], '/impactedResources', 0)[0]"))
        $q | Should -Match ([regex]::Escape('project subscriptionId, TrackingId, resourceName= p.resourceName, resourceGroup=p.resourceGroup, resourceType=p.targetResourceType, details = p, id'))
    }
    It 'scopes to a management group instead when one is set' {
        $m = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $m.providers.azure.managementGroup = 'mg-example'
        $c = Get-PnLiveCommand -CallId azure-impacted-resources -Settings $m
        $c.Arguments | Should -Contain '--management-groups'
        $c.Arguments | Should -Not -Contain '--subscriptions'
    }
    It 'sends Graph calls to the cloud''s own host: <Cloud>' -ForEach @(
        @{ Cloud = 'gcc'; Uri = 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages' }
        @{ Cloud = 'global'; Uri = 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages' }
    ) {
        $x = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $x.providers.m365.cloud = $Cloud
        (Get-PnLiveCommand -CallId m365-messages -Settings $x).Uri | Should -Be $Uri
    }
    It 'refuses a next link on another host' {
        { Get-PnLiveCommand -CallId m365-issues -Settings $S -Arguments @{ nextLink = 'https://example.invalid/v1.0/admin/serviceAnnouncement/issues?$skip=100' } } | Should -Throw '*Refusing*'
    }
    It 'lists OCI announcements for the tenancy, latest in each chain, in the settings region' {
        $c = Get-PnLiveCommand -CallId oci-announcements-list -Settings $S
        ($c.Arguments -join ' ') | Should -Be 'announce announcements list --compartment-id ocid1.tenancy.oc1..aaaaaaaaexampletenancy --all --should-show-only-latest-in-chain true --region us-ashburn-1 --output json'
        ((Get-PnLiveCommand -CallId oci-announcement-get -Settings $S -Arguments @{ key = 'ocid1.announcement.oc1..x' }).Arguments -join ' ') | Should -Match '^announce announcements get --announcement-id ocid1.announcement.oc1..x'
    }
    It 'calls the AWS Health endpoint region of the partition: <Partition>' -ForEach @(
        @{ Partition = 'aws'; Region = 'us-east-1' }
        @{ Partition = 'aws-us-gov'; Region = 'us-gov-west-1' }
    ) {
        $x = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $x.providers.aws.partition = $Partition
        $c = Get-PnLiveCommand -CallId aws-describe-events -Settings $x
        $c.Arguments[$c.Arguments.IndexOf('--region') + 1] | Should -Be $Region
        $c.Arguments | Should -Contain '{"eventStatusCodes":["open","upcoming"]}'
    }
    It 'refuses more than 10 ARNs in one details call' {
        { Get-PnLiveCommand -CallId aws-describe-event-details -Settings $S -Arguments @{ arns = @(1..11 | ForEach-Object { "arn:$_" }) } } | Should -Throw '*1 to 10*'
    }
    It 'lists Google project events with gcloud' {
        ((Get-PnLiveCommand -CallId google-events -Settings $S).Arguments -join ' ') | Should -Be 'service-health events list --project=contoso-example-prod --location=global --format=json'
    }
}

Describe 'The cloud guard' {
    It 'refuses Azure CLI signed in to another cloud' {
        $null = Set-PnRunner -Native { param($Tool, $Arguments) @{ ExitCode = 0; Output = 'AzureCloud' } }
        { Assert-PnLiveContext -Provider azure -Settings (Gov) } | Should -Throw "*not 'AzureUSGovernment'*"
        { Assert-PnLiveContext -Provider azure -Settings $S } | Should -Not -Throw
    }
    It 'refuses a Graph session in another environment, or none' {
        $null = Set-PnRunner -GraphContext { @{ Environment = 'Other'; TenantId = '00000000-0000-0000-0000-0000000000c0' } }
        { Assert-PnLiveContext -Provider m365 -Settings $S } | Should -Throw "*not 'Global'*"
        $null = Set-PnRunner -GraphContext { @{ Environment = 'Global'; TenantId = '00000000-0000-0000-0000-0000000000c0' } }
        { Assert-PnLiveContext -Provider m365 -Settings $S } | Should -Not -Throw
        $null = Set-PnRunner -GraphContext { $null }
        { Assert-PnLiveContext -Provider m365 -Settings $S } | Should -Throw '*Connect-MgGraph -Environment Global*'
    }
    It 'refuses a Graph session in another tenant' {
        $null = Set-PnRunner -GraphContext { @{ Environment = 'Global'; TenantId = 'ffffffff-0000-0000-0000-000000000000' } }
        { Assert-PnLiveContext -Provider m365 -Settings $S } | Should -Throw '*not 00000000-0000-0000-0000-0000000000c0*'
    }
    It 'refuses an AWS caller outside the partition' {
        $null = Set-PnRunner -Native { param($Tool, $Arguments) @{ ExitCode = 0; Output = 'arn:aws:iam::111122223333:user/example' } }
        { Assert-PnLiveContext -Provider aws -Settings (Gov) } | Should -Throw '*partition aws-us-gov*'
        { Assert-PnLiveContext -Provider aws -Settings $S } | Should -Not -Throw
    }
    It 'refuses an OCI region outside the realm' {
        $x = Gov; $x.providers.oci.region = 'us-ashburn-1'
        { Assert-PnLiveContext -Provider oci -Settings $x } | Should -Throw '*isn''t in realm oc2*'
        $y = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $y.providers.oci.region = 'us-luke-1'
        { Assert-PnLiveContext -Provider oci -Settings $y } | Should -Throw '*in realm oc2, not oc1*'
    }
}

Describe 'The live invoker' {
    It 'follows Resource Graph skip tokens until the last page' {
        $script:pages = [Collections.Generic.List[string]]::new()
        $null = Set-PnRunner -Native {
            param($Tool, $Arguments)
            if ($Arguments[0] -eq 'cloud') { return @{ ExitCode = 0; Output = 'AzureCloud' } }
            $i = $Arguments.IndexOf('--skip-token')
            $tok = if ($i -ge 0) { $Arguments[$i + 1] } else { '' }
            $script:pages.Add($tok)
            $out = if (-not $tok) { '{"count":1,"data":[{"trackingId":"A"}],"skip_token":"t2"}' } else { '{"count":1,"data":[{"trackingId":"B"}],"skip_token":null}' }
            @{ ExitCode = 0; Output = $out }
        }
        $r = Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $S) -CallId azure-service-health-events
        @($r.data).Count | Should -Be 2
        @($script:pages) | Should -Be @('', 't2')
    }
    It 'follows Graph''s @odata.nextLink' {
        $null = Set-PnRunner -GraphContext { @{ Environment = 'Global'; TenantId = '' } } -Graph {
            param($Uri)
            if ($Uri -notmatch 'skip') { @{ value = @(@{ id = 'MC1' }); '@odata.nextLink' = 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages?$skip=100' } }
            else { @{ value = @(@{ id = 'MC2' }) } }
        }
        $r = Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $S) -CallId m365-messages
        @($r.value | ForEach-Object { $_.id }) | Should -Be @('MC1', 'MC2')
    }
    It 'checks the cloud once per provider before the first call' {
        $script:n = 0
        $null = Set-PnRunner -Native { param($Tool, $Arguments) if ($Arguments[0] -eq 'cloud') { $script:n++; return @{ ExitCode = 0; Output = 'AzureCloud' } }; @{ ExitCode = 0; Output = '{"data":[]}' } }
        $inv = New-PnLiveInvoker -Settings $S
        $null = Invoke-PnCall -Invoker $inv -CallId azure-service-health-events
        $null = Invoke-PnCall -Invoker $inv -CallId azure-impacted-resources
        $script:n | Should -Be 1
    }
    It 'refuses a call marked unverified unless -AllowUnverified' {
        $x = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $x.providers.google.organization = '123'
        $null = Set-PnRunner -Native { param($Tool, $Arguments) @{ ExitCode = 0; Output = '[]' } }
        { Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $x) -CallId google-organization-events } | Should -Throw '*isn''t verified*'
        { Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $x -AllowUnverified) -CallId google-organization-events } | Should -Not -Throw
    }
    It 'surfaces a tool''s failure, such as the AWS support-plan error' {
        $null = Set-PnRunner -Native { param($Tool, $Arguments) if ($Arguments[0] -eq 'sts') { return @{ ExitCode = 0; Output = 'arn:aws:iam::111122223333:user/x' } }; @{ ExitCode = 254; Output = 'An error occurred (SubscriptionRequiredException)' } }
        { Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $S) -CallId aws-describe-events } | Should -Throw '*SubscriptionRequiredException*'
    }
    It 'collects a provider end to end through stand-in tools' {
        $day1 = Join-Path $Kit 'tests/fixtures/day1/google/events.json'
        $null = Set-PnRunner -Native { param($Tool, $Arguments) @{ ExitCode = 0; Output = (Get-Content -Raw $day1) } }.GetNewClosure()
        $r = Get-PnProviderNotice -Provider google -Settings $S -Invoker (New-PnLiveInvoker -Settings $S) -AsOf '2026-11-09T12:00:00Z'
        $r.Notices.Count | Should -Be 2
    }
}

Describe 'The call list' {
    It 'names a tool, an operation, least-privileged permissions and a documentation page for every call' {
        foreach ($c in Get-PnCall) {
            $c.tool | Should -BeIn @('az', 'graph', 'oci', 'aws', 'gcloud')
            @($c.permissions).Count | Should -BeGreaterThan 0 -Because $c.id
            $c.doc | Should -Match '^https://(learn\.microsoft\.com|docs\.oracle\.com|docs\.aws\.amazon\.com|docs\.cloud\.google\.com)/'
            $c.permissionDoc | Should -Match '^https://'
            if (-not $c.verified) { $c.unverified | Should -Not -BeNullOrEmpty -Because $c.id }
        }
    }
    It 'has a live command for every call' {
        $x = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $x.providers.google.organization = '123'
        foreach ($c in Get-PnCall) { { Get-PnLiveCommand -CallId $c.id -Settings $x -Arguments @{ key = 'k'; arns = @('a') } } | Should -Not -Throw -Because $c.id }
    }
    It 'prints a provider''s permissions' {
        (Get-PnRequiredPermission -Provider m365 | ForEach-Object Permissions) | Should -Be @('ServiceMessage.Read.All', 'ServiceHealth.Read.All', 'ServiceHealth.Read.All')
    }
}
