#Requires -Version 7.1
# Pester 5: the runbook's scripts (Chapter 09) in fixture mode: pre-flight, scheduled run, publish, rollback.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../XdrDeploy.psm1') -Force
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    $script:AsOf = '2026-11-16T12:00:00Z'
    function script:Settings([string]$env) {
        $s = Read-XdrSettings -Path (Join-Path $Fx "settings.$env.json")
        $s.outputRoot = Join-Path $TestDrive $env
        $s
    }
    function script:EnvFile([hashtable]$Change) {
        $f = Get-Content (Join-Path $Fx 'environment-test.json') -Raw | ConvertFrom-Json -AsHashtable
        foreach ($k in $Change.Keys) { $f[$k] = $Change[$k] }
        $f.readsFrom = (Resolve-Path (Join-Path $Fx $f.readsFrom)).Path
        $p = Join-Path $TestDrive ("env{0}.json" -f [guid]::NewGuid()); $f | ConvertTo-Json -Depth 10 | Set-Content $p; $p
    }
    $script:T = Settings test
    $script:Inv = Use-XdrDeployFixture -Path (Join-Path $Fx 'environment-test.json')
    $script:Run = Invoke-XdrScheduledRun -Settings $T -Invoker $Inv -RunName '2026-11' -AsOf $AsOf
    $script:PlanPath = Join-Path $Run.RunRoot 'detections/plan.json'
    $script:Sha = Get-XdrFileHash -Path $PlanPath
}

Describe 'Pre-flight' {
    It 'passes PF-01 to PF-06 for the test stage in fixture mode' {
        $r = @(Invoke-XdrPreflight -Settings $T -Stage test -Invoker $Inv)
        @($r | ForEach-Object Id) | Should -Be @('PF-01', 'PF-02', 'PF-03', 'PF-04', 'PF-05', 'PF-06')
        @($r | Where-Object Status -NE 'Pass').Count | Should -Be 0
    }
    It 'fails PF-01 when the settings are for another stage' {
        @(Invoke-XdrPreflight -Settings $T -Stage production -Invoker $Inv | Where-Object Id -EQ 'PF-01')[0].Detail | Should -Match "not 'production'"
    }
    It 'fails PF-03 for a session in another tenant' {
        $i = Use-XdrDeployFixture -Path (EnvFile @{ graphContext = @{ Environment = 'Global'; TenantId = '22222222-2222-2222-2222-222222222222'; Scopes = @() } })
        @(Invoke-XdrPreflight -Settings $T -Stage test -Invoker $i | Where-Object Id -EQ 'PF-03')[0].Status | Should -Be 'Fail'
    }
    It 'fails PF-04 when a needed scope isn''t granted' {
        $i = Use-XdrDeployFixture -Path (EnvFile @{ graphContext = @{ Environment = 'Global'; TenantId = $T.tenantId; Scopes = @('SecurityIncident.Read.All') } })
        @(Invoke-XdrPreflight -Settings $T -Stage test -Invoker $i | Where-Object Id -EQ 'PF-04')[0].Detail | Should -Match 'ThreatHunting.Read.All'
    }
    It 'fails PF-02 when the Graph module is missing' {
        $i = Use-XdrDeployFixture -Path (EnvFile @{ modules = @{ 'Microsoft.Graph.Authentication' = $false } })
        @(Invoke-XdrPreflight -Settings $T -Stage test -Invoker $i | Where-Object Id -EQ 'PF-02')[0].Status | Should -Be 'Fail'
    }
    It 'needs the test stage''s evidence before production' {
        $p = Settings production
        $i = Use-XdrDeployFixture -Path (Join-Path $Fx 'environment-production.json')
        @(Invoke-XdrPreflight -Settings $p -Stage production -Invoker $i | Where-Object Id -EQ 'PF-07')[0].Detail | Should -Match 'TestEvidencePath'
        @(Invoke-XdrPreflight -Settings $p -Stage production -Invoker $i -TestEvidencePath $Run.EvidencePath | Where-Object Id -EQ 'PF-07')[0].Status | Should -Be 'Fail'
    }
}

Describe 'Scheduled run' {
    It 'records every run and its own record' {
        $Run.Record | Should -Be 11
        Test-Path (Join-Path $Run.EvidencePath 'records/0011-scheduled-run.json') | Should -BeTrue
        (Read-XdrJson -Path (Join-Path $Run.EvidencePath 'records/0011-scheduled-run.json')).changeRecord | Should -Be 'CHG-TEST-0001 (example)'
    }
}

Describe 'Publish' {
    It 'is a dry run without -Apply' {
        $r = Invoke-XdrPublish -Settings $T -Invoker $Inv -PlanPath $PlanPath -OutputPath (Join-Path $TestDrive 'pub-dry') -AsOf $AsOf
        $r.Applied | Should -BeFalse
        @($r.Results | ForEach-Object { $_.status } | Sort-Object -Unique) | Should -Be @('planned (dry run)')
        $Inv.Calls | Should -Not -Contain 'detection-rule-create'
    }
    It 'refuses -Apply without the approved SHA-256' {
        { Invoke-XdrPublish -Settings $T -Invoker $Inv -PlanPath $PlanPath -OutputPath (Join-Path $TestDrive 'pub-x') -AsOf $AsOf -Apply -ApprovedSha256 ('0' * 64) } | Should -Throw '*approve its hash*'
    }
    It 'refuses a plan for another tenant' {
        $p = Read-XdrJson -Path $PlanPath; $p.tenantId = '33333333-3333-3333-3333-333333333333'
        $f = Join-Path $TestDrive 'other-plan.json'; Write-XdrJson -Path $f -Value $p
        { Invoke-XdrPublish -Settings $T -Invoker $Inv -PlanPath $f -OutputPath (Join-Path $TestDrive 'pub-y') -AsOf $AsOf } | Should -Throw '*not 00000000*'
    }
    It 'refuses a plan made for the portal path' {
        $p = Read-XdrJson -Path $PlanPath; $p.deployVia = 'portal'
        $f = Join-Path $TestDrive 'portal-plan.json'; Write-XdrJson -Path $f -Value $p
        { Invoke-XdrPublish -Settings $T -Invoker $Inv -PlanPath $f -OutputPath (Join-Path $TestDrive 'pub-z') -AsOf $AsOf } | Should -Throw '*portal*'
    }
    It 'sends a POST for the create and a PATCH with only the changed property, through the writer' {
        $script:Sent = [Collections.Generic.List[object]]::new()
        $w = [pscustomobject]@{ Mode = 'Script'; Calls = [Collections.Generic.List[string]]::new(); Script = { param($id, $a, $b) $script:Sent.Add(@{ id = $id; args = $a; body = $b }); @{} } }
        $r = Invoke-XdrPublish -Settings $T -Invoker $w -PlanPath $PlanPath -OutputPath (Join-Path $TestDrive 'pub') -AsOf $AsOf -Apply -ApprovedSha256 $Sha
        $r.Applied | Should -BeTrue
        @($Sent | ForEach-Object { $_.id }) | Should -Be @('detection-rule-create', 'detection-rule-update')
        $Sent[1].args.id | Should -Be 'contoso-office-encoded-powershell'
        @($Sent[1].body.Keys) | Should -Be @('status')
        (Read-XdrJson -Path (Join-Path $TestDrive 'pub/manifest.json')).task | Should -Be 'publish'
    }
}

Describe 'Rollback' {
    BeforeAll {
        $script:Pub = Invoke-XdrPublish -Settings $T -Invoker $Inv -PlanPath $PlanPath -OutputPath (Join-Path $TestDrive 'pub2') -AsOf $AsOf -Apply -ApprovedSha256 $Sha
        $script:RP = New-XdrRollbackPlan -Settings $T -PublishPath (Join-Path $TestDrive 'pub2') -AsrRunPath (Join-Path $Run.RunRoot 'asr') -OutputPath (Join-Path $TestDrive 'rb-plan') -AsOf $AsOf
    }
    It 'disables what the stage created or enabled' {
        @($RP.Plan.actions | ForEach-Object { "$($_.ruleId)/$($_.action)" }) | Should -Be @('contoso-lsass-dump-tool/disable', 'contoso-office-encoded-powershell/disable')
    }
    It 'puts back each ring''s ASR value as it was before the change' {
        Get-Content (Join-Path $TestDrive 'rb-plan/oma-uri/ring1-back.txt') -Raw | Should -Be (Get-Content (Join-Path $Run.RunRoot 'asr/oma-uri/ring1.txt') -Raw)
        @($RP.Plan.asrRings) | Should -Be @('ring0', 'ring1', 'ring2', 'ring3', 'servers')
    }
    It 'applies only with the approved SHA-256, and records the run' {
        $pp = Join-Path $TestDrive 'rb-plan/plan.json'
        { Invoke-XdrRollback -Settings $T -Invoker $Inv -PlanPath $pp -OutputPath (Join-Path $TestDrive 'rb') -AsOf $AsOf -Apply -ApprovedSha256 'x' } | Should -Throw '*approve its hash*'
        $r = Invoke-XdrRollback -Settings $T -Invoker $Inv -PlanPath $pp -OutputPath (Join-Path $TestDrive 'rb') -AsOf $AsOf -Apply -ApprovedSha256 $RP.PlanSha256
        @($r.Results | ForEach-Object { $_.status } | Sort-Object -Unique) | Should -Be @('recorded (fixture mode: nothing sent)')
        (Write-XdrEvidence -EvidencePath $Run.EvidencePath -RunPath (Join-Path $TestDrive 'rb') -AsOf $AsOf).Steps | Should -Contain 'RB'
    }
}
