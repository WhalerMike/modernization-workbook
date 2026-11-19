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
    It 'has one tab per daily check, ten in all, with unique ids' {
        $ids = @($script:Manifest.tabs | ForEach-Object { $_.id })
        $ids.Count | Should -Be 10
        @($ids | Sort-Object -Unique).Count | Should -Be 10
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
        @(Get-DcTab).Count | Should -Be 10
        (Get-DcTab -Id 'entra-health').Kind | Should -Be 'link-out'
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
        $q.Count | Should -Be 10
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
    It 'puts the not-evidence banner on the render' {
        $o = Join-Path $TestDrive 'r3'
        $null = Invoke-DcRender -FixturePath (Join-Path $script:Kit 'tests/fixtures/day2') -AsOf '2026-11-17T07:30:00Z' -OutputPath $o
        [IO.File]::ReadAllText((Join-Path $o 'render.md')) | Should -Match ([regex]::Escape($script:Manifest.banner))
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
