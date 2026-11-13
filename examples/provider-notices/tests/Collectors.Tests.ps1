#Requires -Version 7.1
# Pester 5: each provider's collector in fixture mode, and the shapes each normalizer accepts.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/ProviderNotices/ProviderNotices.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Settings = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    $script:Day1 = Join-Path $Kit 'tests/fixtures/day1'
    $script:AsOf = '2026-11-09T12:00:00Z'
    function script:Collect([string]$Provider, [string]$Path = $Day1) {
        Get-PnProviderNotice -Provider $Provider -Settings $Settings -Invoker (New-PnFixtureInvoker -Path $Path) -AsOf $AsOf
    }
    function script:ById($r, $id) { @($r.Notices | Where-Object { $_.noticeId -eq $id })[0] }
}

Describe 'Azure Service Health' {
    BeforeAll { $script:r = Collect azure }
    It 'reads both queries and nothing else' { $r.Calls | Should -Be @('azure-service-health-events', 'azure-impacted-resources') }
    It 'merges the rows of one event across subscriptions into one notice' {
        @($r.Notices | Where-Object { $_.sourceId -eq 'AB1C-2DE' }).Count | Should -Be 1
        @($r.Notices).Count | Should -Be 5
    }
    It 'maps each EventType, and a HealthAdvisory with EventSubType Retirement to a retirement' {
        (ById $r 'azure:AB1C-2DE').kind | Should -Be 'incident'
        (ById $r 'azure:PM3F-4GH').kind | Should -Be 'maintenance'
        (ById $r 'azure:RT5J-6KL').kind | Should -Be 'retirement'
        (ById $r 'azure:SA7M-8NP').kind | Should -Be 'security'
        (ById $r 'azure:HA9Q-0RS').kind | Should -Be 'advisory'
    }
    It 'makes a retirement action required, due at the advisory end time, by the kit rule' {
        $n = ById $r 'azure:RT5J-6KL'
        $n.actionRequired | Should -BeTrue
        $n.actionRequiredBy | Should -Be '2027-09-30T00:00:00Z'
        $n.actionBasis | Should -BeLike 'rule:*'
    }
    It 'joins impacted resources by tracking ID' {
        (ById $r 'azure:PM3F-4GH').resources | Should -Be @('/subscriptions/00000000-0000-0000-0000-00000000aa01/resourcegroups/rg-data/providers/microsoft.compute/virtualmachines/vm-db01')
        (ById $r 'azure:HA9Q-0RS').resources.Count | Should -Be 0
    }
    It 'reads services and regions from the Impact column' {
        (ById $r 'azure:HA9Q-0RS').regions | Should -Be @('East US', 'East US 2')
        (ById $r 'azure:HA9Q-0RS').services | Should -Be @('Storage')
    }
    It 'points the source at the cloud''s own Resource Manager host' {
        (ById $r 'azure:SA7M-8NP').sourceUrl | Should -BeLike 'https://management.azure.com/subscriptions/*/providers/Microsoft.ResourceHealth/events/SA7M-8NP?api-version=2025-05-01'
        $gov = ConvertTo-PnAzureNotice -Events (Read-PnJson "$Day1/azure/service-health-events.json") -Impacted @{ data = @() } -Cloud AzureUSGovernment -AsOf $AsOf
        $gov.Notices[0].sourceUrl | Should -BeLike 'https://management.usgovcloudapi.net/*'
    }
    It 'leaves out a type it doesn''t map (Billing) and counts it' {
        $rows = @{ data = @(@{ subscriptionId = 's'; trackingId = 'BL1'; eventType = 'Billing'; status = 'Active'; description = 'Price change' }) }
        $x = ConvertTo-PnAzureNotice -Events $rows -Impacted @{ data = @() } -Cloud AzureCloud -AsOf $AsOf
        $x.Notices.Count | Should -Be 0
        $x.Skipped | Should -Be 1
    }
    It 'refuses an unknown cloud' { { ConvertTo-PnAzureNotice -Events @{ data = @() } -Impacted @{ data = @() } -Cloud AzureChina -AsOf $AsOf } | Should -Throw '*Unknown azure cloud*' }
}

Describe 'Microsoft 365 service communications' {
    BeforeAll { $script:r = Collect m365 }
    It 'reads messages, issues and health overviews' { $r.Calls | Should -Be @('m365-messages', 'm365-issues', 'm365-health-overviews') }
    It 'treats a post tagged Retirement as a retirement, with the provider''s action date' {
        $n = ById $r 'm365:MC900001'
        $n.kind | Should -Be 'retirement'
        $n.actionRequiredBy | Should -Be '2027-01-31T08:00:00Z'
        $n.actionBasis | Should -Be 'provider: actionRequiredByDateTime'
    }
    It 'matches category values case-insensitively (Learn''s samples use PascalCase)' {
        (ById $r 'm365:MC900003').kind | Should -Be 'change'
        (ById $r 'm365:MC900003').actionBasis | Should -Be 'rule: Message center category preventOrFixIssue'
        (ById $r 'm365:MC900002').kind | Should -Be 'advisory'
        (ById $r 'm365:MC900002').actionRequired | Should -BeFalse
    }
    It 'strips the HTML body to plain text' { (ById $r 'm365:MC900001').summary | Should -Be "We're retiring Basic authentication for SMTP AUTH. Move applications to OAuth before January 31, 2027." }
    It 'maps issues: incident open, resolved advisory closed' {
        (ById $r 'm365:EX900101').kind | Should -Be 'incident'
        (ById $r 'm365:EX900101').status | Should -Be 'open'
        (ById $r 'm365:TM900102').status | Should -Be 'closed'
    }
    It 'builds source URLs on the cloud''s Graph host' {
        (ById $r 'm365:MC900001').sourceUrl | Should -Be 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages/MC900001'
    }
    It 'closes a post whose end date has passed' {
        $m = @{ value = @(@{ id = 'MC1'; title = 'Old'; category = 'stayInformed'; endDateTime = '2026-01-01T00:00:00Z'; lastModifiedDateTime = '2025-12-01T00:00:00Z' }) }
        (ConvertTo-PnM365Notice -Messages $m -Issues @{ value = @() } -Cloud gcc -AsOf $AsOf).Notices[0].status | Should -Be 'closed'
    }
}

Describe 'Oracle Cloud Infrastructure announcements' {
    BeforeAll { $script:r = Collect oci }
    It 'lists, then reads each announcement''s details' {
        $r.Calls[0] | Should -Be 'oci-announcements-list'
        @($r.Calls | Where-Object { $_ -eq 'oci-announcement-get' }).Count | Should -Be 4
    }
    It 'maps announcementType' {
        (ById $r 'oci:chain-example-01').kind | Should -Be 'maintenance'
        (ById $r 'oci:chain-example-02').kind | Should -Be 'change'
        (ById $r 'oci:chain-example-03').kind | Should -Be 'advisory'
        (ById $r 'oci:chain-example-04').kind | Should -Be 'incident'
        (ById $r 'oci:chain-example-04').status | Should -Be 'closed'
    }
    It 'reads the window and ACTION_REQUIRED_BY from the time fields' {
        (ById $r 'oci:chain-example-01').windowStart | Should -Be '2026-11-22T04:00:00Z'
        (ById $r 'oci:chain-example-01').windowEnd | Should -Be '2026-11-22T08:00:00Z'
        (ById $r 'oci:chain-example-02').actionRequiredBy | Should -Be '2026-12-15T00:00:00Z'
        (ById $r 'oci:chain-example-02').actionBasis | Should -Be 'provider: announcementType ACTION_REQUIRED'
    }
    It 'takes affected resources and the description from GetAnnouncement' {
        (ById $r 'oci:chain-example-01').resources | Should -Be @('ocid1.dbsystem.oc1.iad.exampledb01')
        (ById $r 'oci:chain-example-01').summary | Should -BeLike 'The database systems listed below*'
    }
    It 'keeps only the latest announcement in a chain' {
        $d2 = Collect oci (Join-Path $Kit 'tests/fixtures/day2')
        $n = ById $d2 'oci:chain-example-01'
        @($d2.Notices | Where-Object { $_.noticeId -eq 'oci:chain-example-01' }).Count | Should -Be 1
        $n.windowStart | Should -Be '2026-11-29T04:00:00Z'
        $n.providerSeverity | Should -Be 'EMERGENCY_MAINTENANCE_RESCHEDULED'
    }
    It 'accepts the OCI CLI''s kebab-case keys as well as the API''s camelCase' {
        $kebab = @{ data = @{ items = @(@{ id = 'ocid1.announcement.oc1..k'; summary = 'Kebab'; 'announcement-type' = 'SCHEDULED_MAINTENANCE'; 'lifecycle-state' = 'ACTIVE'
                        'time-one-type' = 'START_TIME'; 'time-one-value' = '2026-12-01T00:00:00Z'; 'affected-regions' = @('us-ashburn-1'); services = @('Compute'); 'time-updated' = '2026-11-01T00:00:00Z' }) } }
        $n = (ConvertTo-PnOciNotice -List $kebab -Realm oc1 -Region us-ashburn-1 -AsOf $AsOf).Notices[0]
        $n.kind | Should -Be 'maintenance'
        $n.windowStart | Should -Be '2026-12-01T00:00:00Z'
        $n.regions | Should -Be @('us-ashburn-1')
    }
    It 'uses the realm''s domain, and refuses a realm it doesn''t know' {
        $l = Read-PnJson "$Day1/oci/announcements.json"
        (ConvertTo-PnOciNotice -List $l -Realm oc2 -Region us-langley-1 -AsOf $AsOf).Notices[0].sourceUrl | Should -BeLike 'https://announcements.us-langley-1.oraclegovcloud.com/20180904/announcements/*'
        { ConvertTo-PnOciNotice -List $l -Realm oc9 -Region x -AsOf $AsOf } | Should -Throw '*Unknown oci cloud*'
    }
}

Describe 'AWS Health' {
    BeforeAll { $script:r = Collect aws }
    It 'reads events, then details and affected entities' { $r.Calls | Should -Be @('aws-describe-events', 'aws-describe-event-details', 'aws-describe-affected-entities') }
    It 'maps eventTypeCategory, retirement codes and the SECURITY persona' {
        $k = @{}; foreach ($n in $r.Notices) { $k[$n.title] = $n.kind }
        $k['EC2: Instance retirement scheduled'] | Should -Be 'retirement'
        $k['RDS: Maintenance scheduled'] | Should -Be 'maintenance'
        $k['LAMBDA: Planned lifecycle event'] | Should -Be 'retirement'
        $k['IAM: Security notification'] | Should -Be 'security'
        $k['S3: Operational issue'] | Should -Be 'incident'
    }
    It 'converts epoch seconds to UTC' {
        $n = @($r.Notices | Where-Object { $_.title -eq 'RDS: Maintenance scheduled' })[0]
        $n.windowStart | Should -Be '2026-11-23T06:00:00Z'
        $n.windowEnd | Should -Be '2026-11-23T07:00:00Z'
    }
    It 'uses actionability as the provider''s flag, and the kit rule for a retirement without it' {
        $ec2 = @($r.Notices | Where-Object { $_.title -like 'EC2*' })[0]
        $ec2.actionBasis | Should -Be 'provider: actionability ACTION_REQUIRED'
        $ec2.actionRequiredBy | Should -Be '2026-12-01T00:00:00Z'
        $lambda = @($r.Notices | Where-Object { $_.title -like 'LAMBDA*' })[0]
        $lambda.actionBasis | Should -BeLike 'rule:*'
        $rds = @($r.Notices | Where-Object { $_.title -like 'RDS*' })[0]
        $rds.actionRequired | Should -BeFalse
    }
    It 'takes the description and the affected entities' {
        $ec2 = @($r.Notices | Where-Object { $_.title -like 'EC2*' })[0]
        $ec2.summary | Should -BeLike 'EC2 has detected degradation*'
        $ec2.resources | Should -Be @('arn:aws:ec2:us-east-1:111122223333:instance/i-0abc1234example')
        $ec2.sourceUrl | Should -BeNullOrEmpty
    }
    It 'asks for details and entities in batches of at most 10 ARNs' {
        $events = @{ events = @(1..23 | ForEach-Object { @{ arn = "arn:aws:health:us-east-1::event/EC2/AWS_EC2_X/AWS_EC2_X_$_"; service = 'EC2'; eventTypeCode = 'AWS_EC2_X'; eventTypeCategory = 'issue'; region = 'us-east-1'; startTime = 1.7e9; statusCode = 'open' } }) }
        $sizes = [Collections.Generic.List[int]]::new()
        $inv = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[string]]::new(); Script = {
                param($id, $a)
                if ($id -eq 'aws-describe-events') { return $events }
                $sizes.Add(@($a.arns).Count)
                if ($id -eq 'aws-describe-event-details') { return @{ successfulSet = @(); failedSet = @() } }
                @{ entities = @() } }.GetNewClosure() }
        $x = Get-PnProviderNotice -Provider aws -Settings $Settings -Invoker $inv -AsOf $AsOf
        $x.Notices.Count | Should -Be 23
        @($sizes) | Should -Be @(10, 10, 10, 10, 3, 3)
    }
}

Describe 'Google Cloud Personalized Service Health' {
    BeforeAll { $script:r = Collect google }
    It 'reads project events by default' { $r.Calls | Should -Be @('google-events') }
    It 'maps every event to an incident, open or closed' {
        (ById $r 'google:projects/contoso-example-prod/locations/global/events/example-incident-01').status | Should -Be 'open'
        (ById $r 'google:projects/contoso-example-prod/locations/global/events/example-incident-02').status | Should -Be 'closed'
        @($r.Notices | Where-Object { $_.kind -ne 'incident' }).Count | Should -Be 0
    }
    It 'summarizes from the latest update when there is no description' {
        (ById $r 'google:projects/contoso-example-prod/locations/global/events/example-incident-01').summary | Should -Be 'A mitigation is rolling out. Error rates are falling.'
    }
    It 'reads products and locations from eventImpacts' {
        $n = ById $r 'google:projects/contoso-example-prod/locations/global/events/example-incident-01'
        $n.services | Should -Be @('Google Cloud SQL'); $n.regions | Should -Be @('us-east4')
        $n.sourceUrl | Should -Be 'https://servicehealth.googleapis.com/v1/projects/contoso-example-prod/locations/global/events/example-incident-01'
    }
    It 'reads organization events when the settings scope is organization' {
        $s = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
        $s.providers.google.scope = 'organization'; $s.providers.google.organization = '123456789012'
        $inv = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[string]]::new(); Script = { param($id, $a) @{ organizationEvents = @() } } }
        (Get-PnProviderNotice -Provider google -Settings $s -Invoker $inv -AsOf $AsOf).Calls | Should -Be @('google-organization-events')
    }
    It 'accepts gcloud''s bare list as well as the REST response' {
        $list = @((Read-PnJson "$Day1/google/events.json").events)
        (ConvertTo-PnGoogleNotice -Events $list -AsOf $AsOf).Notices.Count | Should -Be 2
    }
}

Describe 'The fixture invoker' {
    It 'throws on a call that isn''t declared' { { Invoke-PnCall -Invoker (New-PnFixtureInvoker -Path $Day1) -CallId 'azure-write-something' } | Should -Throw '*isn''t declared*' }
    It 'throws when a fixture file is missing' {
        $empty = Join-Path $TestDrive 'empty'; New-Item -ItemType Directory -Path $empty | Out-Null
        { Invoke-PnCall -Invoker (New-PnFixtureInvoker -Path $empty) -CallId google-events } | Should -Throw '*missing*'
    }
    It 'serves day 1 and day 2 for every declared call except the organization read' {
        foreach ($day in 'day1', 'day2') {
            foreach ($c in (Get-PnCall | Where-Object { $_.id -ne 'google-organization-events' })) {
                Test-Path (Join-Path $Kit "tests/fixtures/$day/$($c.provider)/$($c.fixture)") | Should -BeTrue -Because "$day $($c.id)"
            }
        }
    }
}
