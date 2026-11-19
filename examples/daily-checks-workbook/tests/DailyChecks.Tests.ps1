#Requires -Version 7.1
# Pester 5. No tenant, no network, no az: the renderer reads fixtures and the validator reads files.

BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/DailyChecks/DailyChecks.psm1') -Force
    $script:Template = Join-Path $script:Kit 'workbook/daily-checks.workbook.json'
    $script:Manifest = Get-DcManifest
    $script:Day1 = @(Get-DcRender -FixturePath (Join-Path $script:Kit 'tests/fixtures/day1') -AsOf '2026-11-16T07:30:00Z')
    $script:Day2 = @(Get-DcRender -FixturePath (Join-Path $script:Kit 'tests/fixtures/day2') -AsOf '2026-11-17T07:30:00Z')
    function script:Status($rows, $tab) { @($rows | Where-Object Tab -EQ $tab)[0].Status }
}

Describe 'Chapter 01: the manifest' {
    It 'has one tab per daily check, twelve in all, with unique ids' {
        $ids = @($script:Manifest.tabs | ForEach-Object { $_.id })
        $ids.Count | Should -Be 12
        @($ids | Sort-Object -Unique).Count | Should -Be 12
    }
    It 'gives every tab a daily check, a GCC note, an action and at least one link-out' {
        foreach ($t in $script:Manifest.tabs) {
            $t.check | Should -Not -BeNullOrEmpty
            $t.gcc | Should -Not -BeNullOrEmpty
            $t.action | Should -Not -BeNullOrEmpty
            @($t.linkOuts).Count | Should -BeGreaterThan 0
        }
    }
    It 'gives link-out tabs no tables or queries, and workbook tabs both' {
        foreach ($t in $script:Manifest.tabs) {
            if ($t.kind -eq 'link-out') { @($t.tables).Count | Should -Be 0; @($t.queries).Count | Should -Be 0 }
            else { @($t.tables).Count | Should -BeGreaterThan 0; @($t.queries).Count | Should -BeGreaterThan 0 }
        }
    }
    It 'has a query file for every query' {
        foreach ($q in @($script:Manifest.tabs | ForEach-Object { $_.queries })) { Join-Path $script:Kit "queries/$($q.file)" | Should -Exist }
    }
    It 'expects every table a workbook tab reads, except SentinelHealth (event-driven)' {
        $expected = @($script:Manifest.expectedTables | ForEach-Object { $_.table })
        $read = @($script:Manifest.tabs | ForEach-Object { $_.tables } | Sort-Object -Unique | Where-Object { $_ -ne 'SentinelHealth' })
        @($read | Where-Object { $_ -notin $expected }) | Should -BeNullOrEmpty
    }
    It 'links out only to commercial portals on the allow list, or to a parameter' {
        foreach ($l in @($script:Manifest.tabs | ForEach-Object { $_.linkOuts })) {
            if ($l.url -like '{*}') { continue }
            ([uri]$l.url).Host | Should -BeIn $script:Manifest.allowedHosts
        }
    }
    It 'lists the tabs with Get-DcTab' {
        @(Get-DcTab).Count | Should -Be 12
        (Get-DcTab -Id 'entra-health').Kind | Should -Be 'link-out'
    }
    It 'reads the servers, the domain controllers and the admin changes from the tables Learn names' {
        @((Get-DcTab -Id 'sync').Tables -split ', ') | Should -Be @('DailySyncProbe_CL', 'Event', 'Heartbeat')
        @((Get-DcTab -Id 'active-directory').Tables -split ', ') | Should -Be @('Heartbeat', 'DcReplicationProbe_CL', 'SecurityEvent', 'Event', 'SecurityAlert')
        @((Get-DcTab -Id 'admin-changes').Tables -split ', ') | Should -Be @('AuditLogs', 'AzureActivity')
    }
    It 'keeps consents and Entra role assignments on the grants tab only' {
        $admin = [IO.File]::ReadAllText((Join-Path $script:Kit 'queries/admin-1.kql'))
        foreach ($a in 'Consent to application', 'Add member to role', 'Add eligible member to role') { $admin | Should -Not -Match ([regex]::Escape("`"$a`"")) }
    }
    It 'names the servers and domain controllers in the settings, never in a query' {
        foreach ($f in 'sync-2.kql', 'sync-3.kql', 'ad-1.kql', 'ad-3.kql', 'ad-4.kql') { [IO.File]::ReadAllText((Join-Path $script:Kit "queries/$f")) | Should -Not -Match 'contoso' }
        $p = Join-Path $TestDrive 'nodc.json'
        $j = Read-DcJson -Path (Join-Path $script:Kit 'tests/fixtures/settings.lab.json'); $j.domainControllers = @()
        Write-DcJson -Path $p -Value $j
        { Read-DcSettings -Path $p } | Should -Throw '*domainControllers*'
    }
}

Describe 'Chapter 02: the template and its validator' {
    It 'is the build of the manifest and the queries' {
        [IO.File]::ReadAllText($script:Template) | Should -Be ((ConvertTo-DcJson (New-DcTemplate)) + "`n")
    }
    It 'passes every check' {
        @(Test-DcTemplate -Path $script:Template | Where-Object Status -EQ 'Fail') | Should -BeNullOrEmpty
    }
    It 'runs all ten checks' {
        @(Test-DcTemplate -Path $script:Template | ForEach-Object Check | Sort-Object -Unique).Count | Should -Be 10
    }
    It 'scopes every query to the {Workspace} parameter' {
        $wb = Read-DcJson -Path $script:Template
        $q = @($wb.items | Where-Object { $_.type -eq 12 } | ForEach-Object { @($_.content.items) } | Where-Object { $_.type -eq 3 })
        $q.Count | Should -Be 19
        foreach ($i in $q) { @($i.content.crossComponentResources) | Should -Be @('{Workspace}') }
    }
    It 'finds the four edits in the exported copy' {
        $f = @(Test-DcTemplate -Path (Join-Path $script:Kit 'tests/fixtures/exported/edited.workbook.json') | Where-Object Status -EQ 'Fail')
        ($f | ForEach-Object { "$($_.Check) $($_.Tab)" }) | Should -Be @('DC-V-05 risk', 'DC-V-04 devices', 'DC-V-06 grants', 'DC-V-10 ')
    }
    It 'fails a tab whose query reads a table the manifest does not declare for it' {
        $wb = Read-DcJson -Path $script:Template
        $g = @($wb.items | Where-Object { $_.type -eq 12 -and $_.conditionalVisibility.value -eq 'grants' })[0]
        @($g.content.items | Where-Object { $_.type -eq 3 })[0].content.query += "`n| join kind=leftouter (SigninLogs | where TimeGenerated > ago(1d)) on CorrelationId"
        $p = Join-Path $TestDrive 'extra.json'; Write-DcJson -Path $p -Value $wb
        (@(Test-DcTemplate -Path $p | Where-Object { $_.Check -eq 'DC-V-03' -and $_.Tab -eq 'grants' })[0]).Detail | Should -Match 'undeclared SigninLogs'
    }
    It 'fails a telemetry list that drifts from the manifest' {
        $raw = [IO.File]::ReadAllText($script:Template).Replace('\"CommonSecurityLog\", 60', '\"CommonSecurityLog\", 600')
        $p = Join-Path $TestDrive 'sla.json'; [IO.File]::WriteAllText($p, $raw)
        (@(Test-DcTemplate -Path $p | Where-Object Check -EQ 'DC-V-09')[0]).Status | Should -Be 'Fail'
    }
    It 'fails a link to a host outside the allow list' {
        $raw = [IO.File]::ReadAllText($script:Template).Replace('https://purview.microsoft.com', 'https://purview.example.net')
        $p = Join-Path $TestDrive 'host.json'; [IO.File]::WriteAllText($p, $raw)
        $f = @(Test-DcTemplate -Path $p | Where-Object { $_.Check -eq 'DC-V-07' -and $_.Status -eq 'Fail' })
        $f.Count | Should -Be 2
    }
    It 'fails a file that is not a gallery template' {
        $p = Join-Path $TestDrive 'arm.json'; [IO.File]::WriteAllText($p, '{"$schema":"x","resources":[]}')
        (@(Test-DcTemplate -Path $p))[0].Status | Should -Be 'Fail'
    }
    It 'writes a hashed validate folder' {
        $o = Join-Path $TestDrive 'validate'
        $null = Invoke-DcValidate -TemplatePath $script:Template -OutputPath $o -AsOf '2026-11-16T07:05:00Z'
        (Test-DcRunFolder -Path $o).Ok | Should -BeTrue
        (Read-DcJson -Path (Join-Path $o 'manifest.json')).templateSha256 | Should -Be (Get-DcFileHash -Path $script:Template)
    }
}

Describe 'Chapter 03: what each tab would show' {
    It 'shows the dark sources and the failing connector on day 1' {
        (Status $script:Day1 'telemetry') | Should -Be 'ATTENTION'
        @($script:Day1 | Where-Object Tab -EQ 'telemetry')[0].Flagged | Should -Be 4
    }
    It 'never shows CLEAR over a stale source: risk and emergency access are STALE on day 1' {
        (Status $script:Day1 'risk') | Should -Be 'STALE'
        (Status $script:Day1 'emergency-access') | Should -Be 'STALE'
    }
    It 'shows the missed probe as STALE, not the old compliant verdict' {
        (Status $script:Day1 'sync') | Should -Be 'STALE'
    }
    It 'says rows over a stale source may be incomplete' {
        @($script:Day1 | Where-Object Tab -EQ 'grants')[0].Detail | Should -Match 'may be incomplete'
    }
    It 'shows the link-out tabs as LINK-OUT' {
        (Status $script:Day1 'entra-health') | Should -Be 'LINK-OUT'
        (Status $script:Day1 'tasks') | Should -Be 'LINK-OUT'
    }
    It 'shows what the empty queues were hiding on day 2' {
        (Status $script:Day2 'telemetry') | Should -Be 'CLEAR'
        (Status $script:Day2 'risk') | Should -Be 'ATTENTION'
        (Status $script:Day2 'emergency-access') | Should -Be 'ATTENTION'
        (Status $script:Day2 'sync') | Should -Be 'ATTENTION'
    }
    It 'shows CLEAR only when the sources are fresh' {
        (Status $script:Day2 'grants') | Should -Be 'CLEAR'
        (Status $script:Day2 'data') | Should -Be 'CLEAR'
    }
    It 'shows NO DATA when a tab has no result at all' {
        $d = Join-Path $TestDrive 'empty'; New-Item -ItemType Directory -Path $d | Out-Null
        (Status @(Get-DcRender -FixturePath $d -AsOf '2026-11-16T07:30:00Z') 'devices') | Should -Be 'NO DATA'
    }
    It 'writes the same render twice (no clock, no culture)' {
        $a = Join-Path $TestDrive 'r1'; $b = Join-Path $TestDrive 'r2'
        $fx = Join-Path $script:Kit 'tests/fixtures/day1'
        $null = Invoke-DcRender -FixturePath $fx -AsOf '2026-11-16T07:30:00Z' -OutputPath $a
        $c = [Globalization.CultureInfo]::CurrentCulture
        try {
            [Globalization.CultureInfo]::CurrentCulture = [Globalization.CultureInfo]::GetCultureInfo('de-DE')
            $null = Invoke-DcRender -FixturePath $fx -AsOf '2026-11-16T07:30:00Z' -OutputPath $b
        } finally { [Globalization.CultureInfo]::CurrentCulture = $c }
        Get-DcFileHash -Path (Join-Path $b 'render.json') | Should -Be (Get-DcFileHash -Path (Join-Path $a 'render.json'))
    }
    It 'shows the silent domain controller, its failing links and the KCC error on day 1' {
        (Status $script:Day1 'active-directory') | Should -Be 'ATTENTION'
        @($script:Day1 | Where-Object Tab -EQ 'active-directory')[0].Flagged | Should -Be 4
    }
    It 'shows the Active Directory tab CLEAR on day 2 only because its sources are fresh' {
        (Status $script:Day2 'active-directory') | Should -Be 'CLEAR'
    }
    It 'never shows CLEAR over dark domain controller security events' {
        $d = Join-Path $TestDrive 'ad-dark'; New-Item -ItemType Directory -Path $d | Out-Null
        $j = Read-DcJson -Path (Join-Path $script:Kit 'tests/fixtures/day2/active-directory.json')
        $j.sources.SecurityEvent = '2026-11-16T21:40:00Z'
        Write-DcJson -Path (Join-Path $d 'active-directory.json') -Value $j
        $r = @(Get-DcRender -FixturePath $d -AsOf '2026-11-17T07:30:00Z' | Where-Object Tab -EQ 'active-directory')[0]
        $r.Status | Should -Be 'STALE'
        $r.Detail | Should -Match 'SecurityEvent 590 min old'
    }
    It 'shows admin changes STALE while AuditLogs is dark, and each one to match to a ticket the next day' {
        (Status $script:Day1 'admin-changes') | Should -Be 'STALE'
        (Status $script:Day2 'admin-changes') | Should -Be 'ATTENTION'
        @($script:Day2 | Where-Object Tab -EQ 'admin-changes')[0].Flagged | Should -Be 5
    }
    It 'flags a synchronization server with no backup event, never reads it as fine' {
        @($script:Day2 | Where-Object Tab -EQ 'sync')[0].Flagged | Should -Be 2
    }
    It 'puts the not-evidence banner on the render' {
        $o = Join-Path $TestDrive 'r3'
        $null = Invoke-DcRender -FixturePath (Join-Path $script:Kit 'tests/fixtures/day2') -AsOf '2026-11-17T07:30:00Z' -OutputPath $o
        [IO.File]::ReadAllText((Join-Path $o 'render.md')) | Should -Match ([regex]::Escape($script:Manifest.banner))
    }
}

Describe 'Chapter 03: the replication probe' {
    BeforeAll {
        $script:Csv1 = Join-Path $script:Kit 'tests/fixtures/repl/showrepl-day1.csv'
        $script:Lab = Join-Path $script:Kit 'tests/fixtures/settings.lab.json'
    }
    AfterEach { Set-DcRunner $null }
    It 'reads repadmin /showrepl /csv into one record per link, failing where the last status is not 0' {
        $r = @(ConvertFrom-DcRepadminCsv -Text ([IO.File]::ReadAllText($script:Csv1)) -AsOf '2026-11-16T06:00:00Z')
        $r.Count | Should -Be 4
        @($r | Where-Object { $_.Verdict -eq 'failing' } | ForEach-Object { "$($_.DestinationDc)<-$($_.SourceDc)" }) | Should -Be @('CTX-DC-01<-CTX-DC-03', 'CTX-DC-02<-CTX-DC-03')
        $r[0].LastFailureUtc | Should -Be ''
    }
    It 'turns the host''s local time into UTC' {
        $r = @(ConvertFrom-DcRepadminCsv -Text ([IO.File]::ReadAllText($script:Csv1)) -AsOf '2026-11-16T06:00:00Z' -TimeZoneId 'Etc/GMT+5')
        $r[0].LastSuccessUtc | Should -Be '2026-11-16T10:45:12Z'
    }
    It 'refuses text that is not repadmin output' {
        { ConvertFrom-DcRepadminCsv -Text "a,b`n1,2" -AsOf '2026-11-16T06:00:00Z' } | Should -Throw '*Not repadmin*'
    }
    It 'sends only with -Send, to the rule the settings name, through the Logs Ingestion API' {
        $script:Sent = [Collections.Generic.List[string]]::new()
        Set-DcRunner { param($Arguments) $script:Sent.Add(($Arguments -join ' ')); '' }
        $null = Invoke-DcReplicationProbe -SettingsPath $script:Lab -InputPath $script:Csv1 -OutputPath (Join-Path $TestDrive 'p0') -AsOf '2026-11-16T06:00:00Z'
        $script:Sent.Count | Should -Be 0
        $x = Invoke-DcReplicationProbe -SettingsPath $script:Lab -InputPath $script:Csv1 -OutputPath (Join-Path $TestDrive 'p1') -AsOf '2026-11-16T06:00:00Z' -Send
        $x.Sent | Should -BeTrue
        $script:Sent[0] | Should -Match '^rest --method post --url https://dcr-contoso-repl\.eastus2-1\.ingest\.monitor\.azure\.com/dataCollectionRules/dcr-0+/streams/Custom-DcReplicationProbe_CL\?api-version=2023-01-01 --resource https://monitor\.azure\.com '
    }
    It 'records a probe run as evidence with CA-7 and SI-4, and a failing link as a failing record' {
        $o = Join-Path $TestDrive 'p2'
        $null = Invoke-DcReplicationProbe -SettingsPath $script:Lab -InputPath $script:Csv1 -OutputPath $o -AsOf '2026-11-16T06:00:00Z'
        $e = Write-DcEvidence -EvidencePath (Join-Path $TestDrive 'ev-probe') -RunPath $o -AsOf '2026-11-16T06:01:00Z'
        $e.Steps | Should -Be @('PROBE', 'EVIDENCE')
        $e.Controls | Should -Be @('AU-9', 'CA-7', 'SI-4')
        $e.Result | Should -Be 'Fail'
    }
    It 'writes the same records twice (no clock, no culture)' {
        $a = Join-Path $TestDrive 'p3'; $b = Join-Path $TestDrive 'p4'
        $null = Invoke-DcReplicationProbe -SettingsPath $script:Lab -InputPath $script:Csv1 -OutputPath $a -AsOf '2026-11-16T06:00:00Z'
        $c = [Globalization.CultureInfo]::CurrentCulture
        try {
            [Globalization.CultureInfo]::CurrentCulture = [Globalization.CultureInfo]::GetCultureInfo('de-DE')
            $null = Invoke-DcReplicationProbe -SettingsPath $script:Lab -InputPath $script:Csv1 -OutputPath $b -AsOf '2026-11-16T06:00:00Z'
        } finally { [Globalization.CultureInfo]::CurrentCulture = $c }
        Get-DcFileHash -Path (Join-Path $b 'probe.json') | Should -Be (Get-DcFileHash -Path (Join-Path $a 'probe.json'))
    }
}

Describe 'Evidence' {
    BeforeAll {
        $script:Ev = Join-Path $TestDrive 'evidence'
        $script:Val = Join-Path $TestDrive 'ev-validate'
        $null = Invoke-DcValidate -TemplatePath $script:Template -OutputPath $script:Val -AsOf '2026-11-16T07:05:00Z'
    }
    It 'refuses a render folder: the view is not evidence' {
        $o = Join-Path $TestDrive 'ev-render'
        $null = Invoke-DcRender -FixturePath (Join-Path $script:Kit 'tests/fixtures/day1') -AsOf '2026-11-16T07:30:00Z' -OutputPath $o
        { Write-DcEvidence -EvidencePath $script:Ev -RunPath $o -AsOf '2026-11-16T07:31:00Z' } | Should -Throw '*not evidence*'
    }
    It 'records a validation with its controls and KSIs' {
        $e = Write-DcEvidence -EvidencePath $script:Ev -RunPath $script:Val -AsOf '2026-11-16T07:06:00Z'
        $e.Steps | Should -Be @('VALIDATE', 'EVIDENCE')
        $e.Controls | Should -Be @('AU-9', 'CA-7', 'CM-2', 'CM-3')
        $e.Ksis | Should -Contain 'KSI-CMT-LMC'
    }
    It 'chains records and checks them' {
        $null = Write-DcEvidence -EvidencePath $script:Ev -RunPath $script:Val -AsOf '2026-11-16T07:07:00Z'
        @(Test-DcEvidence -EvidencePath $script:Ev | Where-Object Status -EQ 'Fail') | Should -BeNullOrEmpty
        (Read-DcJson -Path (Join-Path $script:Ev 'records/0002-validate.json')).previousRecordSha256 | Should -Be (Get-DcFileHash -Path (Join-Path $script:Ev 'records/0001-validate.json'))
    }
    It 'notices a changed file' {
        Add-Content -Path (Join-Path $script:Ev 'runs/0001-validate/results.json') -Value ' '
        (@(Test-DcEvidence -EvidencePath $script:Ev | Where-Object Check -EQ 'SUMS')[0]).Status | Should -Be 'Fail'
    }
    It 'never counts fixture records toward a stage' {
        $d = Join-Path $TestDrive 'ev2'
        $null = Write-DcEvidence -EvidencePath $d -RunPath $script:Val -AsOf '2026-11-16T07:08:00Z'
        (@(Test-DcEvidence -EvidencePath $d -Stage test | Where-Object Check -EQ 'STEP-VALIDATE')[0]).Status | Should -Be 'Fail'
    }
    It 'maps every step to controls and KSIs the requirements file defines' {
        $req = Get-DcRequirements
        foreach ($k in $req.steps.Keys) {
            foreach ($c in $req.steps[$k].controls) { $req.controls.Contains($c) | Should -BeTrue }
            @($req.steps[$k].ksis).Count | Should -BeGreaterThan 0
        }
    }
}
