#Requires -Version 7.1
# Pester 5: the settings, the export and each check against the fixtures (Chapters 01 to 07).
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/InformationProtection/InformationProtection.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Fx = Join-Path $Kit 'tests/fixtures'
    $script:S = Read-IpSettings -Path (Join-Path $Fx 'settings.lab.json')
    $script:Nov = Join-Path $Fx 'snapshots/2026-11-24'
    $script:Oct = Join-Path $Fx 'snapshots/2026-10-24'
    $script:AsOf = '2026-11-24T15:00:00Z'
    function script:Row($run, $id) { @($run.Rows | Where-Object Id -EQ $id)[0] }
}

Describe 'Settings and clouds' -Tag ch01 {
    It 'reads the lab settings and resolves inputs against the settings file' {
        $S.cloud | Should -Be 'gcc'
        Test-Path -LiteralPath $S.inputs.plan | Should -BeTrue
    }
    It 'refuses a cloud other than gcc or commercial' {
        $p = Join-Path $TestDrive 's.json'
        (Get-Content -Raw (Join-Path $Fx 'settings.lab.json')) -replace '"gcc"', '"elsewhere"' | Set-Content -LiteralPath $p
        { Read-IpSettings -Path $p } | Should -Throw '*Use gcc or commercial*'
    }
    It 'refuses a settings file with a placeholder tenant' {
        $p = Join-Path $TestDrive 't.json'
        (Get-Content -Raw (Join-Path $Fx 'settings.lab.json')) -replace '00000000-0000-4000-8000-0000000000c0', '<tenant-id>' | Set-Content -LiteralPath $p
        { Read-IpSettings -Path $p } | Should -Throw '*tenantId*'
    }
    It 'parses a policy''s Settings strings' {
        $h = ConvertFrom-IpSettingList @('[Mandatory, true]', '[defaultlabelid, abc]')
        $h.mandatory | Should -Be 'true'
        $h.defaultlabelid | Should -Be 'abc'
    }
}

Describe 'The declared reads' -Tag ch01, ch02 {
    It 'declares only read cmdlets' {
        foreach ($c in Get-IpCall) { $c.cmdlet | Should -Match '^(Get|Export)-' }
    }
    It 'gives every read a shell, a file, a role and a Learn page' {
        foreach ($c in Get-IpCall) {
            $c.shell | Should -BeIn @('scc', 'exo', 'aip')
            $c.file | Should -Match '\.json$'
            $c.role | Should -Not -BeNullOrEmpty
            $c.doc | Should -Match '^https://learn\.microsoft\.com/'
        }
    }
    It 'keeps Book 20, Chapter 12''s baseline file names' {
        $f = @(Get-IpCall | ForEach-Object file)
        foreach ($n in 'labels.json', 'label-policies.json', 'autolabel-policies.json', 'autolabel-rules.json', 'dlp-policies.json', 'dlp-rules.json', 'irm-configuration.json', 'audit-status.json', 'aipservice-configuration.json') { $f | Should -Contain $n }
    }
}

Describe 'The export (fixture tenant)' -Tag ch02 {
    BeforeAll {
        $script:Runner = New-IpFixtureRunner -Path (Join-Path $Fx 'tenant')
        $script:Ex = Export-IpBaseline -Settings $S -Runner $Runner -OutputPath (Join-Path $TestDrive 'snap') -AsOf '2026-11-24T08:00:00Z'
    }
    It 'connects one shell at a time and disconnects each' {
        $l = @($Runner.Log | Where-Object { $_ -like 'connect *' -or $_ -like 'disconnect *' })
        $l | Should -Be @('connect scc', 'disconnect scc', 'connect exo', 'disconnect exo', 'connect aip', 'disconnect aip')
    }
    It 'writes every declared file and a manifest with the tenant' {
        foreach ($c in Get-IpCall) { Test-Path (Join-Path $Ex.OutputPath $c.file) | Should -BeTrue }
        (Read-IpJson -Path (Join-Path $Ex.OutputPath 'manifest.json')).tenantId | Should -Be $S.tenantId
    }
    It 'reads the same items as the committed November snapshot' {
        foreach ($c in Get-IpCall) { @(Read-IpJson -Path (Join-Path $Ex.OutputPath $c.file)).Count | Should -Be @(Read-IpJson -Path (Join-Path $Nov $c.file)).Count -Because $c.file }
    }
    It 'counts only sensitive information types the tenant has' {
        @((Read-IpJson -Path (Join-Path $Ex.OutputPath 'content-explorer.json')) | ForEach-Object tagName) | Should -Not -Contain 'Federal Tax Account Number'
    }
    It 'skips an optional read that the settings turn off, and says so' {
        $s2 = Read-IpSettings -Path (Join-Path $Fx 'settings.lab.json'); $s2.reads.rightsManagement = $false
        $r = Export-IpBaseline -Settings $s2 -Runner (New-IpFixtureRunner -Path (Join-Path $Fx 'tenant')) -OutputPath (Join-Path $TestDrive 'snap2') -AsOf '2026-11-24T08:00:00Z'
        @($r.Reads | Where-Object id -EQ 'aipConfiguration')[0].status | Should -BeLike 'skipped*'
        Test-Path (Join-Path $r.OutputPath 'aipservice-configuration.json') | Should -BeFalse
    }
}

Describe 'The checks find the fixtures'' faults' {
    It 'access: a role holder not in the register, and an overdue review' -Tag ch01 {
        $r = Invoke-IpAccess -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'access') -AsOf $AsOf
        (Row $r 'ROLE-02').Detail | Should -Match 'extra.person'
        (Row $r 'ROLE-01').Status | Should -Be 'Warn'
        (Row $r 'ACC-02').Status | Should -Be 'Pass'
    }
    It 'inventory: a type the tenant lacks, and a class without an owner' -Tag ch03 {
        $r = Invoke-IpInventory -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'inv') -AsOf $AsOf
        (Row $r 'INV-02').Detail | Should -Match 'Federal Tax Account Number'
        (Row $r 'INV-03').Detail | Should -Match 'no owner'
        (Row $r 'INV-01').Detail | Should -Match '5576 item'
    }
    It 'labels: a person in the rights, guests on the CUI Specified site label, an unplanned label, a missing label in the policy' -Tag ch04 {
        $r = Invoke-IpLabels -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'labels') -AsOf $AsOf
        (Row $r 'LBL-05').Detail | Should -Match 'j.doe'
        (Row $r 'LBL-08').Detail | Should -Match 'AllowAccessToGuestUsers'
        (Row $r 'LBL-EXTRA').Detail | Should -Match 'Confidential \(legacy\)'
        (Row $r 'POL-01').Detail | Should -Match 'missing label\(s\): CUI Specified site'
        (Row $r 'POL-02').Status | Should -Be 'Pass'
        @($r.Rows | Where-Object Status -EQ 'Fail').Count | Should -Be 4
    }
    It 'labels: resolves a default label setting by GUID' -Tag ch04 {
        $r = Invoke-IpLabels -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'labels2') -AsOf $AsOf
        (Row $r 'POL-01').Detail | Should -Not -Match 'defaultlabelid'
    }
    It 'protection: the super user feature on with a standing super user, social sign-in on, a rule still in audit' -Tag ch05 {
        $r = Invoke-IpProtection -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'prot') -AsOf $AsOf
        (Row $r 'RMS-02').Status | Should -Be 'Fail'
        (Row $r 'RMS-03').Detail | Should -Match 'recovery.operator'
        (Row $r 'OME-01').Detail | Should -Match 'SocialIdSignIn'
        (Row $r 'MFR-02').Detail | Should -Match 'Mode Audit'
        (Row $r 'IRM-01').Status | Should -Be 'Pass'
    }
    It 'protection: says plainly when Rights Management wasn''t read' -Tag ch05 {
        $snap = Join-Path $TestDrive 'norms'; Copy-Item -Recurse $Nov $snap; Remove-Item (Join-Path $snap 'aipservice-configuration.json')
        $r = Invoke-IpProtection -Settings $S -SnapshotPath $snap -OutputPath (Join-Path $TestDrive 'prot2') -AsOf $AsOf
        (Row $r 'RMS-01').Status | Should -Be 'Info'
    }
    It 'dlp: a retired policy back in simulation, and an expired exception still in a rule' -Tag ch06 {
        $r = Invoke-IpDlp -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'dlp') -AsOf $AsOf
        (Row $r 'DLP-02').Detail | Should -Match 'retired'
        (Row $r 'EXC-02').Detail | Should -Match 'EXC-002 expired'
        (Row $r 'EXC-EXPIRED').Status | Should -Be 'Fail'
        (Row $r 'DLP-04').Status | Should -Be 'Pass'
    }
    It 'dlp: an exception with no register entry fails' -Tag ch06 {
        $snap = Join-Path $TestDrive 'dlpx'; Copy-Item -Recurse $Nov $snap
        $f = Join-Path $snap 'dlp-rules.json'; (Get-Content -Raw $f) -replace 'oldpartner.example', 'unknown.example' | Set-Content $f
        $r = Invoke-IpDlp -Settings $S -SnapshotPath $snap -OutputPath (Join-Path $TestDrive 'dlp2') -AsOf $AsOf
        (Row $r 'EXC-02').Detail | Should -Match 'no entry in the exception register'
    }
    It 'autolabel: a policy labeling while the plan has it in simulation' -Tag ch06 {
        $r = Invoke-IpAutoLabel -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'auto') -AsOf $AsOf
        (Row $r 'AUTO-02').Detail | Should -Match 'without the approval'
        (Row $r 'SIT-01').Status | Should -Be 'Pass'
    }
    It 'audit: ingestion on, retention as planned, one synthetic event late' -Tag ch07 {
        $r = Invoke-IpAudit -Settings $S -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'aud') -AsOf $AsOf -SyntheticPath (Join-Path $Fx 'synthetic/2026-11-24.json')
        (Row $r 'AUD-01').Status | Should -Be 'Pass'
        (Row $r 'RET-01').Status | Should -Be 'Pass'
        (Row $r 'SYN-02').Detail | Should -Match '5.5 h'
        (Row $r 'SYN-03').Status | Should -Be 'Pass'
    }
    It 'audit: fails when ingestion is off' -Tag ch07 {
        $snap = Join-Path $TestDrive 'audoff'; Copy-Item -Recurse $Nov $snap
        '[{"UnifiedAuditLogIngestionEnabled": false}]' | Set-Content (Join-Path $snap 'audit-status.json')
        $r = Invoke-IpAudit -Settings $S -SnapshotPath $snap -OutputPath (Join-Path $TestDrive 'aud2') -AsOf $AsOf
        (Row $r 'AUD-01').Status | Should -Be 'Fail'
    }
    It 'the synthetic search writes the test record' -Tag ch07 {
        $o = Join-Path $TestDrive 'syn.json'
        $r = Search-IpSyntheticEvent -Settings $S -Runner (New-IpFixtureRunner -Path (Join-Path $Fx 'tenant')) -UserId 'test.user@contoso.example' -StartedAt '2026-11-24T09:00:00Z' -OutputPath $o -AsOf $AsOf
        $r.Events | Should -Be 3
        (Read-IpJson -Path $o).startedAt | Should -Be '2026-11-24T09:00:00Z'
    }
}

Describe 'Drift' -Tag ch08 {
    BeforeAll { $script:D = Invoke-IpDrift -Settings $S -BaselinePath $Oct -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'drift') -AsOf $AsOf }
    It 'explains the differences a change ticket covers' {
        @($D.Rows | Where-Object { $_.Status -eq 'Pass' } | ForEach-Object Detail) -join ' ' | Should -Match 'CHG-1042.*CHG-1050'
    }
    It 'fails the unexplained ones, with the super user change at P1' {
        @($D.Rows | Where-Object Status -EQ 'Fail').Count | Should -Be 6
        @($D.Rows | Where-Object { $_.Detail -match '\(P1\)' }).Count | Should -Be 2
        @($D.Rows | Where-Object { $_.Subject -eq 'aipservice-configuration.json: (tenant)' }).Count | Should -Be 2
    }
    It 'finds nothing between an export and itself' {
        $r = Invoke-IpDrift -Settings $S -BaselinePath $Nov -SnapshotPath $Nov -OutputPath (Join-Path $TestDrive 'd0') -AsOf $AsOf
        $r.Rows[0].Id | Should -Be 'DRIFT-00'
    }
    It 'raises a Copilot DLP policy''s change to its own signal' {
        $snap = Join-Path $TestDrive 'cop'; Copy-Item -Recurse $Nov $snap
        $f = Join-Path $snap 'dlp-policies.json'; $j = Read-IpJson -Path $f; ($j | Where-Object Name -EQ 'B20-Copilot-Exclude-CUI-SP').Mode = 'Disable'; Write-IpJson -Path $f -Value $j
        Copy-Item (Join-Path $Nov 'manifest.json') $snap -Force
        $r = Invoke-IpDrift -Settings $S -BaselinePath $Nov -SnapshotPath $snap -OutputPath (Join-Path $TestDrive 'd1') -AsOf $AsOf
        $r.Rows[0].Detail | Should -Match 'Copilot'
    }
}
