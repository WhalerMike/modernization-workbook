#Requires -Version 7.1
# Pester 5: the common notice record, its JSON schema, the fingerprint, and the collection run.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/ProviderNotices/ProviderNotices.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Schema = Join-Path $Kit 'schema/notice.schema.json'
    $script:Settings = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json')
    $script:Out = Join-Path $TestDrive 'day1'
    $script:Run = Invoke-PnCollection -Settings $Settings -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/day1')) -OutputPath $Out -AsOf '2026-11-09T12:00:00Z'
    function script:Sample { New-PnNotice -Provider aws -Cloud aws -SourceId 'arn:x' -Kind maintenance -Status open -Title 'T' -Summary 'S' -WindowStart '2026-12-01T00:00:00Z' -FirstSeen '2026-11-09T12:00:00Z' }
}

Describe 'The notice record' {
    It 'passes the schema rules for every notice from every provider' {
        foreach ($n in $Run.Notices) { @(Test-PnNotice -Notice $n) | Should -BeNullOrEmpty -Because $n.noticeId }
        @($Run.Notices | ForEach-Object provider | Sort-Object -Unique) | Should -Be @('aws', 'azure', 'google', 'm365', 'oci')
    }
    It 'validates against schema/notice.schema.json with Test-Json where PowerShell has a 2020-12 validator' -Skip:($PSVersionTable.PSVersion -lt [version]'7.4') {
        $notices = (Get-Content -Raw (Join-Path $Out 'notices.json') | ConvertFrom-Json).notices
        foreach ($n in $notices) { ($n | ConvertTo-Json -Depth 10) | Test-Json -SchemaFile $Schema | Should -BeTrue -Because $n.noticeId }
    }
    It 'fails the schema for a wrong kind, a local time and a missing field' -Skip:($PSVersionTable.PSVersion -lt [version]'7.4') {
        $n = Sample
        $bad = [ordered]@{}; foreach ($k in $n.Keys) { $bad[$k] = $n[$k] }
        $bad.kind = 'outage'
        ($bad | ConvertTo-Json) | Test-Json -SchemaFile $Schema -ErrorAction SilentlyContinue | Should -BeFalse
        $bad.kind = 'maintenance'; $bad.windowStart = '2026-12-01 00:00'
        ($bad | ConvertTo-Json) | Test-Json -SchemaFile $Schema -ErrorAction SilentlyContinue | Should -BeFalse
        $bad.windowStart = $null; $bad.Remove('sourceRef')
        ($bad | ConvertTo-Json) | Test-Json -SchemaFile $Schema -ErrorAction SilentlyContinue | Should -BeFalse
    }
    It 'reports the same problems in code (Test-PnNotice)' {
        $n = Sample
        $n.kind = 'outage'; (Test-PnNotice -Notice $n) -join ';' | Should -Match "kind 'outage'"
        $n = Sample; $n.windowEnd = '2026-12-01 00:00'; (Test-PnNotice -Notice $n) -join ';' | Should -Match 'windowEnd'
        $n = Sample; $n.Remove('sourceRef'); (Test-PnNotice -Notice $n) | Should -Contain 'missing sourceRef'
        $n = Sample; $n.extra = 1; (Test-PnNotice -Notice $n) | Should -Contain 'unexpected extra'
    }
    It 'lists the same required fields in the schema and in New-PnNotice' {
        $schema = Get-Content -Raw $Schema | ConvertFrom-Json
        @((Sample).Keys) | Sort-Object | Should -Be (@($schema.required) | Sort-Object)
        @($schema.properties.PSObject.Properties.Name) | Sort-Object | Should -Be (@($schema.required) | Sort-Object)
        @($schema.properties.kind.enum) | Should -Be @('maintenance', 'retirement', 'advisory', 'security', 'change', 'incident')
    }
    It 'holds no agency data: only the provider''s fields and fictional IDs' {
        $text = Get-Content -Raw (Join-Path $Out 'notices.json')
        $text | Should -Not -Match 'assignmentGroup|approverRole'
    }
}

Describe 'The fingerprint' {
    It 'ignores firstSeen, so a re-read of the same notice matches' {
        $a = Sample
        $b = New-PnNotice -Provider aws -Cloud aws -SourceId 'arn:x' -Kind maintenance -Status open -Title 'T' -Summary 'S' -WindowStart '2026-12-01T00:00:00Z' -FirstSeen '2026-11-16T12:00:00Z'
        $b.fingerprint | Should -Be $a.fingerprint
    }
    It 'changes when the provider changes the notice' {
        $b = New-PnNotice -Provider aws -Cloud aws -SourceId 'arn:x' -Kind maintenance -Status open -Title 'T' -Summary 'S' -WindowStart '2026-12-08T00:00:00Z' -FirstSeen '2026-11-09T12:00:00Z'
        $b.fingerprint | Should -Not -Be (Sample).fingerprint
    }
    It 'is checked by Test-PnNotice' { $n = Sample; $n.title = 'Edited'; (Test-PnNotice -Notice $n) | Should -Contain 'fingerprint does not match the record' }
}

Describe 'Times and text' {
    It 'converts <In> to <Out>' -ForEach @(
        @{ In = '2026-11-09T12:00:00Z'; Out = '2026-11-09T12:00:00Z' }
        @{ In = '2026-11-09T07:00:00-05:00'; Out = '2026-11-09T12:00:00Z' }
        @{ In = '2026-11-09T12:00:00.1234567Z'; Out = '2026-11-09T12:00:00Z' }
        @{ In = 1589077890.53; Out = '2020-05-10T02:31:30Z' }
        @{ In = 1762689600000; Out = '2025-11-09T12:00:00Z' }
        @{ In = 'Thu, 27 Aug 2026 13:19:03 GMT'; Out = '2026-08-27T13:19:03Z' }
    ) { ConvertTo-PnUtc $In | Should -Be $Out }
    It 'returns null for nothing and throws on a non-time' {
        ConvertTo-PnUtc $null | Should -BeNullOrEmpty
        { ConvertTo-PnUtc 'next Tuesday' } | Should -Throw '*Not a time*'
    }
    It 'caps the summary at 2,000 characters' {
        $n = New-PnNotice -Provider aws -Cloud aws -SourceId 'a' -Kind advisory -Status open -Title 'T' -Summary ('x' * 5000) -FirstSeen '2026-11-09T12:00:00Z'
        $n.summary.Length | Should -Be 2000
        @(Test-PnNotice -Notice $n) | Should -BeNullOrEmpty
    }
}

Describe 'The collection run' {
    It 'writes notices.json, notices.csv, raw/ per provider and a manifest' {
        foreach ($f in 'notices.json', 'notices.csv', 'manifest.json', 'raw/azure.json', 'raw/m365.json', 'raw/oci.json', 'raw/aws.json', 'raw/google.json') { Test-Path (Join-Path $Out $f) | Should -BeTrue -Because $f }
    }
    It 'counts 22 notices on day 1' { @($Run.Notices).Count | Should -Be 22 }
    It 'records every call with its permission and every file''s hash in the manifest' {
        $m = Read-PnJson (Join-Path $Out 'manifest.json')
        $m.task | Should -Be 'collect'
        $m.mode | Should -Be 'Fixture'
        @($m.calls).Count | Should -Be 11
        (@($m.calls | Where-Object { $_.id -eq 'm365-messages' })[0].permissions) | Should -Be @('ServiceMessage.Read.All')
        $m.files['notices.json'] | Should -Be (Get-PnFileHash -Path (Join-Path $Out 'notices.json'))
        (Test-PnRunFolder -Path $Out).Ok | Should -BeTrue
    }
    It 'is byte-for-byte repeatable for the same fixtures and time' {
        $again = Join-Path $TestDrive 'again'
        $null = Invoke-PnCollection -Settings $Settings -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/day1')) -OutputPath $again -AsOf '2026-11-09T12:00:00Z'
        Get-PnFileHash -Path (Join-Path $again 'notices.json') | Should -Be (Get-PnFileHash -Path (Join-Path $Out 'notices.json'))
    }
    It 'collects only the providers asked for, and refuses one the settings disable' {
        $one = Invoke-PnCollection -Settings $Settings -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/day1')) -OutputPath (Join-Path $TestDrive 'oci') -AsOf '2026-11-09T12:00:00Z' -Provider oci
        @($one.Providers.Keys) | Should -Be @('oci')
        $s = Read-PnSettings -Path (Join-Path $Kit 'tests/fixtures/settings.lab.json'); $s.providers.aws.enabled = $false
        { Invoke-PnCollection -Settings $s -Invoker (New-PnFixtureInvoker -Path (Join-Path $Kit 'tests/fixtures/day1')) -OutputPath (Join-Path $TestDrive 'x') -AsOf '2026-11-09T12:00:00Z' -Provider aws } | Should -Throw '*isn''t enabled*'
    }
}

Describe 'The settings file' {
    It 'refuses a secret-like value' {
        $p = Join-Path $TestDrive 's.json'
        '{"environment":"test","providers":{},"routing":{"clientSecret":"abc123"}}' | Set-Content $p
        { Read-PnSettings -Path $p } | Should -Throw '*secret-like*'
    }
    It 'refuses a placeholder left in an enabled provider' {
        $p = Join-Path $TestDrive 'p.json'
        '{"environment":"test","providers":{"aws":{"enabled":true,"partition":"aws","accountId":"<account-id>"}}}' | Set-Content $p
        { Read-PnSettings -Path $p } | Should -Throw '*placeholder*'
    }
    It 'accepts the template''s placeholders in a disabled provider' {
        $p = Join-Path $TestDrive 'd.json'
        '{"environment":"test","providers":{"aws":{"enabled":false,"partition":"aws","accountId":"<account-id>"}}}' | Set-Content $p
        (Read-PnSettings -Path $p).environment | Should -Be 'test'
    }
}
