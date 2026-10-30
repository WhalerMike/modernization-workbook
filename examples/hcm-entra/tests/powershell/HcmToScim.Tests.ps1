#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Unit tests for HcmToScim.psm1 against the same fixtures the Python tests use. No network calls:
# Invoke-HcmBulkUpload is exercised with a fake poster. Illustrative: unit-tested against fixtures,
# not proven against live tenants.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath '../..')
    $script:Fx = Join-Path -Path $script:Kit -ChildPath 'tests/fixtures'
    Import-Module (Join-Path -Path $script:Kit -ChildPath 'powershell/HcmToScim.psm1') -Force
    $script:Ext = 'urn:ietf:params:scim:schemas:extension:contoso:1.0:User'
    $script:Ent = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'
    $script:AsOf = [datetime]'2026-10-25'
    $script:Endpoint = 'https://graph.microsoft.com/v1.0/servicePrincipals/00000000-0000-0000-0000-000000000000/synchronization/jobs/API2AAD.abc.def/bulkUpload'

    function Get-TestInput {
        $map = Get-HcmMapping -Path (Join-Path $script:Kit 'config/mapping.json')
        $cfg = Get-HcmSettings -Path (Join-Path $script:Kit 'config/settings.example.json')
        $rows = @(Import-Csv -LiteralPath (Join-Path $script:Fx 'hcm_extract_sample.csv') -Encoding utf8)
        return @{ Map = $map; Cfg = $cfg; Rows = $rows }
    }
    function Invoke-TestConvert([hashtable]$Override = @{}) {
        $in = Get-TestInput
        foreach ($k in $Override.Keys) { $in.Cfg[$k] = $Override[$k] }
        return Convert-HcmExtract -Rows $in.Rows -Mapping $in.Map -Settings $in.Cfg -AsOf $script:AsOf
    }
    function Get-Op($Result, [string]$Key) {
        foreach ($b in $Result.Batches) { foreach ($op in $b.Operations) { if ($op.data.externalId -eq $Key) { return $op.data } } }
    }
    function Get-Outcome($Result, [string]$Key) { @($Result.Outcomes | Where-Object { $_.PersonKey -eq $Key }) }
}

Describe 'Cross-implementation parity with the Python client' {
    It 'produces the same batch hash as the Python fixture' {
        $r = Invoke-TestConvert
        $expected = (Get-Content -LiteralPath (Join-Path $script:Fx 'expected_batch_sha256.txt') -Raw).Trim()
        $r.Batches.Count | Should -Be 1
        Get-HcmSha256 $r.Batches[0] | Should -Be $expected
    }
    It 'produces the same per-record statuses and payload hashes' {
        $r = Invoke-TestConvert
        $expected = Get-Content -LiteralPath (Join-Path $script:Fx 'expected_records.json') -Raw | ConvertFrom-Json
        $report = Get-HcmReport -Result $r
        $report.records.Count | Should -Be $expected.Count
        for ($i = 0; $i -lt $expected.Count; $i++) {
            $report.records[$i].person_key | Should -Be $expected[$i].person_key
            $report.records[$i].status | Should -Be $expected[$i].status
            $report.records[$i].leaver | Should -Be $expected[$i].leaver
            $report.records[$i].payload_sha256 | Should -Be $expected[$i].payload_sha256
        }
    }
    It 'produces the same provenance manifest hash as the Python fixture' {
        $r = Invoke-TestConvert
        $expected = (Get-Content -LiteralPath (Join-Path $script:Fx 'expected_provenance_sha256.txt') -Raw).Trim()
        $manifest = Get-HcmProvenance -Result $r -AsOf $script:AsOf -ExtractSha256 ('a' * 64) -MappingSha256 ('b' * 64)
        Get-HcmSha256 $manifest | Should -Be $expected
    }
    It 'canonicalizes like Python json.dumps(sort_keys, compact, ensure_ascii=False)' {
        ConvertTo-HcmCanonicalJson ([ordered]@{ b = 1; a = @($true, $null, "J`u{00E9}`n`"q`"") }) |
            Should -Be ('{"a":[true,null,"J' + [char]0xE9 + '\n\"q\""],"b":1}')
    }
}

Describe 'Mapping (Book 03, Chapter 06)' {
    It 'maps core, enterprise and extension attributes' {
        $r = Invoke-TestConvert
        $a = Get-Op $r '100001'
        $a.active | Should -BeFalse   # pre-start: disabled until the hire date (Appendix C)
        $a.name.givenName | Should -Be 'Avery'
        $a[$script:Ent].manager.value | Should -Be '100000'
        $a[$script:Ext].workerTypeCode | Should -Be 'EMP'
        $a[$script:Ext].orgCode | Should -Be 'ORG-100'
        $a[$script:Ext].HireDate | Should -Be '2026-11-02T10:00:00Z'
        $a[$script:Ext].Contains('TermDate') | Should -BeFalse
    }
    It 'maps a contractor to CTR with its end date' {
        $s = Get-Op (Invoke-TestConvert) '100004'
        $s[$script:Ext].workerType | Should -Be 'Contractor'
        $s[$script:Ext].TermDate | Should -Be '2027-01-01T04:00:00Z'
    }
    It 'uses a row offset over the default and keeps UTF-8 names' {
        $j = Get-Op (Invoke-TestConvert) '100002'
        $j[$script:Ext].HireDate | Should -Be '2019-06-17T13:00:00Z'
        $j.displayName | Should -Be "Jos$([char]0xE9) Ram$([char]0xED)rez"
    }
    It 'never sends email' {
        $r = Invoke-TestConvert
        foreach ($b in $r.Batches) { foreach ($op in $b.Operations) { $op.data.Contains('emails') | Should -BeFalse } }
    }
}

Describe 'Lifecycle rules (Book 03, Appendix A)' {
    It 'puts leavers first and sets them inactive' {
        $r = Invoke-TestConvert
        $keys = @($r.Batches[0].Operations | ForEach-Object { $_.bulkId })
        $keys[0..2] | Should -Be @('100003', '100008', '100013')
        (Get-Op $r '100013').active | Should -BeFalse
    }
    It 'orders managers before reports' {
        $keys = @((Invoke-TestConvert).Batches[0].Operations | ForEach-Object { $_.bulkId })
        $keys.IndexOf('100000') | Should -BeLessThan $keys.IndexOf('100001')
        $keys.IndexOf('100001') | Should -BeLessThan $keys.IndexOf('100002')
    }
    It 'sends a pre-start record disabled without counting it as a leaver' {
        $r = Invoke-TestConvert
        $o = Get-Outcome $r '100001'
        $o.Operation.data.active | Should -BeFalse
        $o.IsLeaver | Should -BeFalse
        ($o.Warnings -join ' ') | Should -Match 'pre-start'
        $r.Disables | Should -Be 3
    }
    It 'enables the record on the hire date, or always when the rule is off' {
        $in = Get-TestInput
        $r = Convert-HcmExtract -Rows $in.Rows -Mapping $in.Map -Settings $in.Cfg -AsOf ([datetime]'2026-11-02')
        (Get-Op $r '100001').active | Should -BeTrue
        (Get-Op (Invoke-TestConvert -Override @{ prestart_disabled = $false }) '100001').active | Should -BeTrue
    }
    It 'keeps a nonpay status active (leave is not a leaver)' {
        $r = Invoke-TestConvert
        (Get-Op $r '100005').active | Should -BeTrue
        ((Get-Outcome $r '100005').Warnings -join ' ') | Should -Match 'leave is not a leaver'
    }
    It 'lets a separation win over a same-run mover' {
        $r = Invoke-TestConvert
        @((Get-Outcome $r '100008') | ForEach-Object Status | Sort-Object) | Should -Be @('ready', 'superseded')
    }
    It 'flags a manager who is separating without blocking the joiner' {
        $o = Get-Outcome (Invoke-TestConvert) '100011'
        $o.Status | Should -Be 'ready'
        ($o.Warnings -join ' ') | Should -Match 'manager is separating'
    }
    It 'flags a late separation for the on-demand path' {
        $r = Invoke-TestConvert
        ((Get-Outcome $r '100013').Warnings -join ' ') | Should -Match 'on demand'
        (Get-Outcome $r '100003').Warnings.Count | Should -Be 0
    }
    It 'fails closed: <Key> is quarantined for "<Fragment>"' -ForEach @(
        @{ Key = '100006'; Fragment = 'pending worker' }
        @{ Key = '100007'; Fragment = 'unknown worker type' }
        @{ Key = '(missing)'; Fragment = 'PersonNumber is empty' }
        @{ Key = '12345678901234567'; Fragment = 'at most 16 characters' }
        @{ Key = '100009'; Fragment = 'own manager' }
        @{ Key = '100010'; Fragment = 'no termination date' }
        @{ Key = '100014'; Fragment = 'longer than 64' }
        @{ Key = '100015'; Fragment = 'approved code list' }
        @{ Key = '100016'; Fragment = "isn't a code" }
    ) {
        $o = Get-Outcome (Invoke-TestConvert) $Key
        $o.Status | Should -Be 'quarantined'
        $o.Operation | Should -BeNullOrEmpty
        ($o.Reasons -join ' | ') | Should -BeLike "*$Fragment*"
    }
    It 'keeps the unchanged HR record in the quarantine entry' {
        $q = @(Get-HcmQuarantineEntry -Result (Invoke-TestConvert))
        $q.Count | Should -Be 9
        $q[0].hr_record.WorkerType | Should -Be 'P'
    }
    It 'keeps names and payloads out of the operational report' {
        $text = Get-HcmReport -Result (Invoke-TestConvert) | ConvertTo-Json -Depth 8
        foreach ($n in 'Avery', 'morgan.lee', 'Program Analyst') { $text | Should -Not -Match $n }
    }
}

Describe 'Guards (Book 03, Appendix B)' {
    It 'holds a run whose disables exceed the threshold' {
        $r = Invoke-TestConvert -Override @{ max_disables_per_run = 2 }
        $r.Held | Should -BeTrue
        $r.HoldReason | Should -Match 'max_disables_per_run'
    }
    It 'never builds a batch larger than 50' {
        $in = Get-TestInput
        $t = $in.Rows | Where-Object PersonNumber -eq '100001'
        $many = foreach ($i in 0..119) { $c = $t.PSObject.Copy(); $c.PersonNumber = '2{0:D5}' -f $i; $c.ManagerPersonNumber = ''; $c }
        $r = Convert-HcmExtract -Rows @($many) -Mapping $in.Map -Settings $in.Cfg -AsOf $script:AsOf
        @($r.Batches | ForEach-Object { $_.Operations.Count }) | Should -Be @(50, 50, 20)
    }
    It 'refuses settings that look like secrets' {
        { Test-HcmSettings -Settings @{ client_secret = 'x' } } | Should -Throw '*secret*'
    }
    It 'refuses pacing faster than the documented limit' {
        { Test-HcmSettings -Settings @{ min_seconds_between_calls = 0.05 } } | Should -Throw '*0.125*'
    }
    It 'allows only Graph bulkUpload endpoints' -ForEach @(
        @{ Url = 'https://graph.microsoft.us/beta/servicePrincipals/00000000-0000-0000-0000-000000000000/synchronization/jobs/API2AD.abc/bulkUpload'; Ok = $true }
        @{ Url = 'http://graph.microsoft.com/v1.0/servicePrincipals/00000000-0000-0000-0000-000000000000/synchronization/jobs/x/bulkUpload'; Ok = $false }
        @{ Url = 'https://example.com/v1.0/servicePrincipals/00000000-0000-0000-0000-000000000000/synchronization/jobs/x/bulkUpload'; Ok = $false }
        @{ Url = 'https://graph.microsoft.com/v1.0/users'; Ok = $false }
    ) {
        if ($Ok) { Test-HcmEndpoint -Endpoint $Url | Should -Be $Url } else { { Test-HcmEndpoint -Endpoint $Url } | Should -Throw }
    }
}

Describe 'Invoke-HcmBulkUpload with a fake poster' {
    BeforeEach {
        $script:Calls = [System.Collections.Generic.List[object]]::new()
        $script:Sleeps = [System.Collections.Generic.List[double]]::new()
    }
    It 'posts application/scim+json and records the provisioning-logs location' {
        $r = Invoke-TestConvert
        $cfg = (Get-TestInput).Cfg
        $poster = { param($u, $b, $h) $script:Calls.Add(@{ Uri = $u; Headers = $h; Body = [System.Text.Encoding]::UTF8.GetString($b) }); [pscustomobject]@{ Status = 202; Headers = @{ Location = 'https://graph.microsoft.com/v1.0/auditLogs/provisioning/?$filter=x' } } }
        $out = Invoke-HcmBulkUpload -Batches $r.Batches -Endpoint $script:Endpoint -Token 'test-token' -Settings $cfg -Poster $poster -Sleeper { param($s) $script:Sleeps.Add($s) }
        $script:Calls.Count | Should -Be 1
        $script:Calls[0].Headers['Content-Type'] | Should -Be 'application/scim+json'
        $script:Calls[0].Headers.Authorization | Should -Be 'Bearer test-token'
        $script:Calls[0].Body | Should -Be (ConvertTo-HcmCanonicalJson $r.Batches[0])
        $out[0].status | Should -Be 202
        $out[0].provisioning_logs | Should -Match 'auditLogs/provisioning'
        $script:Sleeps | Should -Be @(0.15)
    }
    It 'honors Retry-After on 429' {
        $r = Invoke-TestConvert
        $script:Queue = [System.Collections.Generic.Queue[object]]::new()
        $script:Queue.Enqueue([pscustomobject]@{ Status = 429; Headers = @{ 'Retry-After' = '7' } })
        $script:Queue.Enqueue([pscustomobject]@{ Status = 202; Headers = @{} })
        $out = Invoke-HcmBulkUpload -Batches $r.Batches -Endpoint $script:Endpoint -Token 't' -Settings (Get-TestInput).Cfg -Poster { param($u, $b, $h) $script:Queue.Dequeue() } -Sleeper { param($s) $script:Sleeps.Add($s) }
        $script:Sleeps[0] | Should -Be 7
        $out[0].attempts | Should -Be 2
    }
    It 'stops on the first failure' {
        $in = Get-TestInput
        $t = $in.Rows | Where-Object PersonNumber -eq '100001'
        $many = foreach ($i in 0..59) { $c = $t.PSObject.Copy(); $c.PersonNumber = '3{0:D5}' -f $i; $c.ManagerPersonNumber = ''; $c }
        $r = Convert-HcmExtract -Rows @($many) -Mapping $in.Map -Settings $in.Cfg -AsOf $script:AsOf
        $out = Invoke-HcmBulkUpload -Batches $r.Batches -Endpoint $script:Endpoint -Token 't' -Settings $in.Cfg -Poster { param($u, $b, $h) [pscustomobject]@{ Status = 403; Headers = @{} } } -Sleeper { param($s) }
        @($out).Count | Should -Be 1
        $out[0].status | Should -Be 403
    }
    It 'refuses a bad endpoint before sending anything' {
        $r = Invoke-TestConvert
        { Invoke-HcmBulkUpload -Batches $r.Batches -Endpoint 'https://example.com/bulkUpload' -Token 't' -Settings (Get-TestInput).Cfg -Poster { throw 'must not post' } -Sleeper { param($s) } } | Should -Throw '*endpoint*'
    }
}

Describe 'Invoke-HcmToScim.ps1 wrapper' {
    It 'dry run writes the files, exits 2 for quarantined records and sends nothing' {
        $out = Join-Path ([IO.Path]::GetTempPath()) ("hcm-" + [guid]::NewGuid())
        try {
            $env:HCM_ENTRA_BEARER_TOKEN = $null
            & pwsh -NoProfile -File (Join-Path $script:Kit 'powershell/Invoke-HcmToScim.ps1') -Extract (Join-Path $script:Fx 'hcm_extract_sample.csv') -AsOf 2026-10-25 -Out $out | Out-Null
            $LASTEXITCODE | Should -Be 2
            Test-Path (Join-Path $out 'bulk-request-001.json') | Should -BeTrue
            Test-Path (Join-Path $out 'validation-report.json') | Should -BeTrue
            $manifest = Get-Content -LiteralPath (Join-Path $out 'provenance.json') -Raw | ConvertFrom-Json
            $manifest.extract_sha256 | Should -Be (Get-HcmFileSha256 (Join-Path $script:Fx 'hcm_extract_sample.csv'))
            $manifest.quarantined.Count | Should -Be 9
            Test-Path (Join-Path $out 'apply-results.json') | Should -BeFalse
        } finally { Remove-Item -LiteralPath $out -Recurse -Force -ErrorAction SilentlyContinue }
    }
    It 'exits 1 for -Apply without a token' {
        $out = Join-Path ([IO.Path]::GetTempPath()) ("hcm-" + [guid]::NewGuid())
        try {
            $env:HCM_ENTRA_BEARER_TOKEN = $null
            & pwsh -NoProfile -File (Join-Path $script:Kit 'powershell/Invoke-HcmToScim.ps1') -Extract (Join-Path $script:Fx 'hcm_extract_sample.csv') -AsOf 2026-10-25 -Out $out -Apply 2>$null | Out-Null
            $LASTEXITCODE | Should -Be 1
        } finally { Remove-Item -LiteralPath $out -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
