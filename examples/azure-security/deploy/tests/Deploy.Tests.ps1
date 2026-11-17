#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
BeforeAll {
    $script:Deploy = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Kit = (Resolve-Path (Join-Path $script:Deploy '..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/AzureSecurity/AzureSecurity.psm1') -Force
    Import-Module (Join-Path $script:Deploy 'AzsDeploy.psm1') -Force
    $script:Week1 = Join-Path $script:Kit 'tests/fixtures/week1'
    $script:Week2 = Join-Path $script:Kit 'tests/fixtures/week2'
    function New-StageSettings {
        param([string]$Env = 'test', [hashtable]$Change = @{})
        $s = Get-Content (Join-Path $PSScriptRoot "fixtures/settings.$Env.json") -Raw | ConvertFrom-Json -AsHashtable
        $root = Join-Path $TestDrive ([guid]::NewGuid().ToString('n').Substring(0, 8))
        $s.outputRoot = Join-Path $root 'runs'; $s.evidencePath = Join-Path $root 'evidence'
        if ($Env -eq 'production') { $s.testEvidencePath = Join-Path $root 'test-evidence' }
        foreach ($k in $Change.Keys) { $s[$k] = $Change[$k] }
        $p = Join-Path $root "settings.$Env.json"
        New-Item -ItemType Directory -Force -Path $root | Out-Null
        $s | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $p
        $p
    }
}

Describe 'Deploy: settings' {
    It 'reads a filled test settings file and refuses a secret, a missing value or a bad environment' {
        (Read-AzsDeploySettings -Path (New-StageSettings)).environment | Should -Be 'test'
        { Read-AzsDeploySettings -Path (New-StageSettings -Change @{ clientSecret = 'x' }) } | Should -Throw '*names a secret*'
        { Read-AzsDeploySettings -Path (New-StageSettings -Change @{ location = '' }) } | Should -Throw "*no 'location'*"
        { Read-AzsDeploySettings -Path (New-StageSettings -Change @{ environment = 'lab' }) } | Should -Throw '*test or production*'
    }
    It 'keeps the template full of placeholders, so it can never run as is' {
        { Read-AzsDeploySettings -Path (Join-Path $script:Deploy 'settings.template.json') } | Should -Throw '*placeholder*'
    }
}

Describe 'Deploy: preflight' {
    It 'passes the offline checks for the test stage and skips the live ones' {
        $rows = Test-AzsPreflight -SettingsPath (New-StageSettings) -OutputPath (Join-Path $TestDrive 'pre') -AsOf 2026-11-16T12:00:00Z
        @($rows | ForEach-Object { "$($_.check)=$($_.status)" }) | Should -Be @('PF-01=Pass', 'PF-02=Pass', $(if (Test-AzsInRepository -Path $TestDrive) { 'PF-03=Warn' } else { 'PF-03=Pass' }), 'PF-04=Skipped', 'PF-05=Skipped', 'PF-06=Warn', 'PF-07=Skipped')
        Join-Path $TestDrive 'pre/results.json' | Should -Exist
    }
    It 'refuses an output root inside the repository the kit runs from' {
        $rows = Test-AzsPreflight -SettingsPath (New-StageSettings -Change @{ outputRoot = (Join-Path $script:Kit 'out/runs') }) -OutputPath (Join-Path $TestDrive 'pre2')
        ($rows | Where-Object check -EQ 'PF-03').status | Should -Be 'Fail'
    }
    It 'blocks production until the test stage has passing live evidence' {
        $p = New-StageSettings -Env production
        (Test-AzsPreflight -SettingsPath $p -OutputPath (Join-Path $TestDrive 'pre3') | Where-Object check -EQ 'PF-07').status | Should -Be 'Fail'
        $s = Read-AzsDeploySettings -Path $p
        # A live-mode run of every test-stage step, made from fixtures with the manifest's mode set to Live.
        $req = Get-AzsRequirements
        $inv = New-AzsFixtureInvoker -Path $script:Week1
        $run = Join-Path $TestDrive 'live-run'
        foreach ($a in 'baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy') { $null = Invoke-AzsCheck -Area $a -Settings $s -Invoker $inv -AsOf 2026-11-09T12:00:00Z -OutputPath (Join-Path $run $a) }
        $null = Get-AzsMetric -RunPath $run -OutputPath (Join-Path $run 'metrics') -AsOf 2026-11-09T12:00:00Z
        $null = Write-AzsManifest -OutputPath $run -Task scheduled-run -AsOf 2026-11-09T12:00:00Z -Mode Live -Environment test -Extra @{ areas = @('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy'); compared = $false }
        $null = Write-AzsEvidence -EvidencePath $s.testEvidencePath -RunPath $run -AsOf 2026-11-09T12:00:00Z
        $pre = Join-Path $TestDrive 'live-pre'; New-Item -ItemType Directory -Force -Path $pre | Out-Null
        Set-Content -Path (Join-Path $pre 'results.json') -Value '[]'
        $null = Write-AzsManifest -OutputPath $pre -Task preflight -AsOf 2026-11-09T12:00:00Z -Mode Live -Environment test
        $null = Write-AzsEvidence -EvidencePath $s.testEvidencePath -RunPath $pre -AsOf 2026-11-09T12:00:00Z
        (Test-AzsPreflight -SettingsPath $p -OutputPath (Join-Path $TestDrive 'pre4') | Where-Object check -EQ 'PF-07').status | Should -Be 'Pass'
        $req.stages.test.Count | Should -Be 12
    }
    It 'runs the live checks through az when asked, and fails a wrong cloud' {
        $old = Set-AzsRunner -Az { param($Arguments) if ($Arguments -contains 'cloud') { @{ ExitCode = 0; Output = 'AzureCloud' } } elseif ($Arguments -contains 'account') { @{ ExitCode = 0; Output = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } } else { @{ ExitCode = 0; Output = '{"data":[{"subscriptionId":"s","name":"n"}]}' } } }
        try { $rows = Test-AzsPreflight -SettingsPath (New-StageSettings) -OutputPath (Join-Path $TestDrive 'pre5') -Live -AllowUnverified }
        finally { $null = Set-AzsRunner -Az $old }
        @($rows | Where-Object { $_.check -in 'PF-04', 'PF-05', 'PF-06' } | ForEach-Object status) | Should -Be @('Pass', 'Pass', 'Pass')
        $old = Set-AzsRunner -Az { param($Arguments) @{ ExitCode = 0; Output = 'AzureChinaCloud' } }
        try { $rows = Test-AzsPreflight -SettingsPath (New-StageSettings) -OutputPath (Join-Path $TestDrive 'pre6') -Live }
        finally { $null = Set-AzsRunner -Az $old }
        ($rows | Where-Object check -EQ 'PF-04').status | Should -Be 'Fail'
    }
}

Describe 'Deploy: the scheduled run' {
    It 'runs every area, compares with last week, computes the metrics and records evidence' {
        $p = New-StageSettings
        $r1 = Invoke-AzsScheduledRun -SettingsPath $p -FixturePath $script:Week1 -AsOf 2026-11-09T12:00:00Z
        $r1.Previous | Should -BeNullOrEmpty
        $r1.Evidence.Steps | Should -Contain 'RUN'
        $r2 = Invoke-AzsScheduledRun -SettingsPath $p -FixturePath $script:Week2 -AsOf 2026-11-16T12:00:00Z
        Split-Path -Leaf $r2.Previous | Should -Be 'run-2026-11-09'
        $r2.Drift.fixed | Should -BeGreaterThan 0
        $r2.Evidence.Steps | Should -Contain 'DRIFT'
        $r2.Evidence.Sequence | Should -Be 2
        Join-Path $r2.Run 'exposure/register.csv' | Should -Exist
        ((Read-AzsJson -Path (Join-Path $r2.Run 'exposure/findings.json')) | Where-Object rule -EQ 'AZS-EX-03').name | Should -Be 'pip-new-api'
        $s = Read-AzsDeploySettings -Path $p
        @(Test-AzsEvidence -EvidencePath $s.evidencePath | Where-Object Status -EQ 'Fail').Count | Should -Be 0
        ((Test-AzsEvidence -EvidencePath $s.evidencePath -Stage test) | Where-Object Check -EQ 'STEP-RUN').Status | Should -Be 'Fail'
    }
}

Describe 'Deploy: the policy plan and the rollback' {
    It 'plans the assignment in DoNotEnforce with the settings'' role, and sends nothing' {
        $p = New-StageSettings
        $old = Set-AzsRunner -Az { throw 'az was started' }
        try {
            $patch = Join-Path $TestDrive 'w-no-sec'; Copy-Item -Recurse $script:Week1 $patch
            $a = Get-Content (Join-Path $patch 'arg-policy-assignments.json') -Raw | ConvertFrom-Json -AsHashtable
            $a.data = @($a.data | Where-Object name -NE 'azs-security'); $a | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $patch 'arg-policy-assignments.json')
            $r = New-AzsPolicyPlan -SettingsPath $p -FixturePath $patch -OutputPath (Join-Path $TestDrive 'plan') -AsOf 2026-11-16T12:00:00Z
        } finally { $null = Set-AzsRunner -Az $old }
        $r.Commands | Should -Be 1
        $r.Sha256 | Should -Match '^[0-9a-f]{64}$'
        $txt = Get-Content (Join-Path $TestDrive 'plan/plan.txt') -Raw
        $txt | Should -Match 'az policy assignment create --name azs-security --policy-set-definition azs-security-set --scope /providers/Microsoft.Management/managementGroups/contoso --enforcement-mode DoNotEnforce --mi-system-assigned --location eastus2 --role Network Contributor'
    }
    It 'plans nothing when the assignment exists, and refuses -Apply in fixture mode' {
        $p = New-StageSettings
        (New-AzsPolicyPlan -SettingsPath $p -FixturePath $script:Week1 -OutputPath (Join-Path $TestDrive 'plan2')).Commands | Should -Be 0
        { New-AzsPolicyPlan -SettingsPath $p -FixturePath $script:Week1 -OutputPath (Join-Path $TestDrive 'plan2') -Apply -ApprovedSha256 x } | Should -Throw '*fixture mode*'
    }
    It 'applies only with the approved SHA-256, sending exactly the planned command' {
        $p = New-StageSettings
        $script:sent = [Collections.Generic.List[string]]::new()
        $old = Set-AzsRunner -Az { param($Arguments)
            if ($Arguments[0] -eq 'graph') { return @{ ExitCode = 0; Output = '{"data":[]}' } }
            $script:sent.Add(($Arguments -join ' ')); @{ ExitCode = 0; Output = '{"id":"ok"}' } }
        try {
            $s = Read-AzsDeploySettings -Path $p
            $plan = Join-Path $TestDrive 'plan3'
            $inv = New-AzsLiveInvoker -Settings $s -SkipContextCheck
            $r = New-AzsPolicyPlan -SettingsPath $p -OutputPath $plan -FixturePath $script:Week1 -AsOf 2026-11-16T12:00:00Z
            # Rewrite the plan as a live plan would (no existing assignment), then approve its hash.
            $j = Get-Content (Join-Path $plan 'plan.json') -Raw | ConvertFrom-Json -AsHashtable
            $j.commands = @(@{ why = 'w'; args = @('policy', 'assignment', 'create', '--name', 'azs-security') }); $j | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $plan 'plan.json')
            $sha = (Get-FileHash (Join-Path $plan 'plan.json') -Algorithm SHA256).Hash.ToLowerInvariant()
            Mock -ModuleName AzsDeploy New-AzsFixtureInvoker { New-AzsLiveInvoker -Settings (Read-AzsDeploySettings -Path $p) -SkipContextCheck }
            { New-AzsPolicyPlan -SettingsPath $p -OutputPath $plan -FixturePath $script:Week1 -Apply -ApprovedSha256 ('0' * 64) } | Should -Throw "*not the approved*"
            $a = New-AzsPolicyPlan -SettingsPath $p -OutputPath $plan -FixturePath $script:Week1 -Apply -ApprovedSha256 $sha
        } finally { $null = Set-AzsRunner -Az $old }
        $a.Applied | Should -BeTrue
        @($script:sent) | Should -Be @('policy assignment create --name azs-security')
        Join-Path $plan 'results.json' | Should -Exist
    }
    It 'plans the rollback to audit, or the removal' {
        $p = New-StageSettings
        $r = New-AzsRollbackPlan -SettingsPath $p -Mode DoNotEnforce -OutputPath (Join-Path $TestDrive 'rb') -Fixture
        (Get-Content (Join-Path $TestDrive 'rb/plan.txt'))[-1] | Should -Be 'az policy assignment update --name azs-security --scope /providers/Microsoft.Management/managementGroups/contoso --enforcement-mode DoNotEnforce'
        $null = New-AzsRollbackPlan -SettingsPath $p -Mode Delete -OutputPath (Join-Path $TestDrive 'rb2') -Fixture
        (Get-Content (Join-Path $TestDrive 'rb2/plan.txt'))[-1] | Should -Be 'az policy assignment delete --name azs-security --scope /providers/Microsoft.Management/managementGroups/contoso'
        { New-AzsRollbackPlan -SettingsPath $p -Mode Delete -OutputPath (Join-Path $TestDrive 'rb2') -Fixture -Apply -ApprovedSha256 $r.Sha256 } | Should -Throw '*fixture mode*'
        (Read-AzsJson -Path (Join-Path $TestDrive 'rb/manifest.json')).task | Should -Be 'rollback'
    }
}
