#Requires -Version 7.1
# Pester 5: the deployment runbook's scripts in fixture mode: preflight, the scheduled run, the Service Health
# alert policy plan, rollback, the sender and the go/no-go evidence. Nothing is sent; nothing is applied.
BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
    Import-Module (Join-Path $Kit 'deploy/PnDeploy.psm1') -Force
    $script:Fx = Join-Path $Kit 'deploy/tests/fixtures'
    function script:Settings([string]$Name, [string]$Root) {
        $s = Read-PnSettings -Path (Join-Path $Fx "settings.$Name.json")
        $s.outputRoot = $Root; $s.routing.path = Join-Path $Kit 'config/routing.json'
        $s
    }
    function script:SaveSettings($s, [string]$Path) { $c = [ordered]@{}; foreach ($k in $s.Keys) { if ($k -ne '_sha256') { $c[$k] = $s[$k] } }; Write-PnJson -Path $Path -Value $c; $Path }
    $script:TestRoot = Join-Path $TestDrive 'test'
    $script:ProdRoot = Join-Path $TestDrive 'prod'
    $script:TestSettings = SaveSettings (Settings test $TestRoot) (Join-Path $TestDrive 'settings.test.json')
    $script:ProdSettings = SaveSettings (Settings production $ProdRoot) (Join-Path $TestDrive 'settings.production.json')
    Push-Location $Kit
}
AfterAll { Pop-Location }

Describe 'Preflight' {
    It 'passes every check for the test environment, and writes a run the evidence step accepts' {
        $out = Join-Path $TestRoot 'preflight'
        & (Join-Path $Kit 'deploy/Test-PnPreflight.ps1') -SettingsPath $TestSettings -Stage test -FixturePath (Join-Path $Fx 'environment-test.json') -OutputPath $out -AsOf '2026-11-09T12:00:00Z' 6>$null
        $r = (Read-PnJson (Join-Path $out 'results.json')).results
        (@($r | Where-Object { $_.status -ne 'Pass' } | ForEach-Object { "$($_.id) $($_.status): $($_.detail)" }) -join '; ') | Should -BeNullOrEmpty
        @($r).Count | Should -Be 14
        (Write-PnEvidence -EvidencePath (Join-Path $TestRoot 'evidence') -RunPath $out -AsOf '2026-11-09T12:00:00Z').Steps | Should -Contain 'PRE'
    }
    It 'fails a provider whose tool is missing, whose session is in another cloud, or whose contacts aren''t named' {
        $s = Settings test (Join-Path $TestDrive 'pf')
        $s.providers.aws.enabled = $true; $s.providers.aws.accountId = '111122223333'
        $s.providers.oci.noticeContacts = @()
        $inv = Use-PnDeployFixture -Path (Join-Path $Fx 'environment-test.json')
        $r = Invoke-PnPreflight -Settings $s -Stage test -Invoker $inv
        ($r | Where-Object Id -EQ 'PF-02-aws').Status | Should -Be 'Fail'
        ($r | Where-Object Id -EQ 'PF-03-aws').Status | Should -Be 'Fail'
        ($r | Where-Object Id -EQ 'PF-05-oci').Detail | Should -Match 'SR-8'
    }
    It 'fails when the settings file names another stage' {
        $inv = Use-PnDeployFixture -Path (Join-Path $Fx 'environment-test.json')
        ((Invoke-PnPreflight -Settings (Settings test $TestRoot) -Stage production -Invoker $inv) | Where-Object Id -EQ 'PF-01').Detail | Should -Match "not 'production'"
    }
    It 'fails sending without an endpoint and token variable' {
        $s = Settings test $TestRoot; $s.routing.send = $true
        $inv = Use-PnDeployFixture -Path (Join-Path $Fx 'environment-test.json')
        ((Invoke-PnPreflight -Settings $s -Stage test -Invoker $inv) | Where-Object Id -EQ 'PF-01').Status | Should -Be 'Fail'
    }
    It 'in production, needs the test stage''s evidence' {
        $inv = Use-PnDeployFixture -Path (Join-Path $Fx 'environment-production.json')
        ((Invoke-PnPreflight -Settings (Settings production $ProdRoot) -Stage production -Invoker $inv) | Where-Object Id -EQ 'PF-07').Status | Should -Be 'Fail'
    }
}

Describe 'The scheduled run' {
    BeforeAll {
        # TestDrive is cleaned after each Describe, so the stage's preflight is run and recorded again here.
        $pre = Join-Path $TestRoot 'preflight'
        & (Join-Path $Kit 'deploy/Test-PnPreflight.ps1') -SettingsPath $TestSettings -Stage test -FixturePath (Join-Path $Fx 'environment-test.json') -OutputPath $pre -AsOf '2026-11-09T11:00:00Z' 6>$null
        $null = Write-PnEvidence -EvidencePath (Join-Path $TestRoot 'evidence') -RunPath $pre -AsOf '2026-11-09T11:00:00Z'
        & (Join-Path $Kit 'deploy/Invoke-PnScheduledRun.ps1') -SettingsPath $TestSettings -FixturePath (Join-Path $Kit 'tests/fixtures/day1') -AsOf '2026-11-09T12:00:00Z' 6>$null
        & (Join-Path $Kit 'deploy/Invoke-PnScheduledRun.ps1') -SettingsPath $TestSettings -FixturePath (Join-Path $Kit 'tests/fixtures/day2') -AsOf '2026-11-16T12:00:00Z' -Send 6>$null
    }
    It 'writes collect, route, digest and its own run under a time-stamped folder' {
        foreach ($f in 'collect/notices.json', 'route/tasks.json', 'digest/digest.md', 'scheduled-run/results.json') { Test-Path (Join-Path $TestRoot "runs/20261116T120000Z/$f") | Should -BeTrue -Because $f }
    }
    It 'keeps the routing state across runs, so day 2 only updates' {
        $t = Read-PnJson (Join-Path $TestRoot 'runs/20261116T120000Z/route/tasks.json')
        @($t.payloads | Where-Object { $_.action -eq 'create' }).Count | Should -Be 1
        $t.dryRun | Should -BeTrue -Because 'fixture mode never sends, even with -Send'
    }
    It 'records every step as evidence, and the test stage''s go/no-go passes' {
        @(Test-PnEvidence -EvidencePath (Join-Path $TestRoot 'evidence') -Stage test | Where-Object Status -NE 'Pass') | Should -BeNullOrEmpty
    }
}

Describe 'Service Health alerts with Azure Policy' {
    BeforeAll {
        $script:Alerts = Join-Path $ProdRoot 'alerts'
        & (Join-Path $Kit 'deploy/New-PnAlertPolicy.ps1') -SettingsPath $ProdSettings -FixturePath (Join-Path $Fx 'environment-production.json') -OutputPath $Alerts -AsOf '2026-11-16T12:00:00Z' 6>$null
        $script:Plan = Read-PnJson (Join-Path $Alerts 'plan.json')
    }
    It 'assigns the built-in definition Learn names, with a system-assigned identity and its role' {
        $a = @($Plan.steps[0].arguments)
        ($a -join ' ') | Should -Match '^policy assignment create --name pn-service-health-alerts'
        $a[$a.IndexOf('--policy') + 1] | Should -Be '98903777-a9f6-47f5-90a9-acaf62ab01a8'
        $a | Should -Contain '--mi-system-assigned'
        $a[$a.IndexOf('--role') + 1] | Should -Be '/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-00000000e001'
        $a[$a.IndexOf('--identity-scope') + 1] | Should -Be '/providers/Microsoft.Management/managementGroups/mg-contoso-example'
    }
    It 'starts a remediation task at the management group' {
        $a = @($Plan.steps[1].arguments)
        ($a -join ' ') | Should -Match '^policy remediation create'
        $a[$a.IndexOf('--management-group') + 1] | Should -Be 'mg-contoso-example'
    }
    It 'changes nothing: every step is WouldApply' {
        @((Read-PnJson (Join-Path $Alerts 'results.json')).results | ForEach-Object { $_.status } | Sort-Object -Unique) | Should -Be @('WouldApply')
    }
    It 'refuses a resource group scope, which the policy doesn''t support' {
        $s = Settings production $ProdRoot; $s.azurePolicy.scope = '/subscriptions/x/resourceGroups/rg'
        $null = Use-PnDeployFixture -Path (Join-Path $Fx 'environment-production.json')
        { New-PnAlertPlan -Settings $s -OutputPath (Join-Path $TestDrive 'rg') } | Should -Throw '*resource group scope*'
    }
    It 'refuses a definition whose name doesn''t match' {
        $f = Read-PnJson (Join-Path $Fx 'environment-production.json'); $f.policyDefinition.displayName = 'Something else'; $f.readsFrom = Join-Path $Kit 'tests/fixtures/day2'
        $p = Join-Path $TestDrive 'env-bad.json'; Write-PnJson -Path $p -Value $f
        $null = Use-PnDeployFixture -Path $p
        { New-PnAlertPlan -Settings (Settings production $ProdRoot) -OutputPath (Join-Path $TestDrive 'bad') } | Should -Throw "*not 'Configure subscriptions*"
    }
    It 'applies only with the plan''s approved SHA-256' {
        { Invoke-PnPlanSteps -PlanPath (Join-Path $Alerts 'plan.json') -Apply -ApprovedSha256 ('0' * 64) } | Should -Throw '*must match*'
    }
    It 'runs the steps in order when the hash matches (stand-in az)' {
        $ran = [Collections.Generic.List[string]]::new()
        $null = Set-PnRunner -Native { param($Tool, $Arguments) $ran.Add("$Tool $($Arguments[0..2] -join ' ')"); @{ ExitCode = 0; Output = '{}' } }.GetNewClosure()
        $p = Join-Path $Alerts 'plan.json'
        $r = Invoke-PnPlanSteps -PlanPath $p -Apply -ApprovedSha256 (Get-PnFileHash -Path $p)
        @($r | ForEach-Object Status) | Should -Be @('Applied', 'Applied')
        @($ran) | Should -Be @('az policy assignment create', 'az policy remediation create')
    }
    It 'stops at the first failing step' {
        $null = Set-PnRunner -Native { param($Tool, $Arguments) @{ ExitCode = 1; Output = 'AuthorizationFailed' } }
        $p = Join-Path $Alerts 'plan.json'
        $r = @(Invoke-PnPlanSteps -PlanPath $p -Apply -ApprovedSha256 (Get-PnFileHash -Path $p))
        $r.Count | Should -Be 1; $r[0].Status | Should -Be 'Error'
    }
    It 'fixture mode never applies' {
        { & (Join-Path $Kit 'deploy/New-PnAlertPolicy.ps1') -SettingsPath $ProdSettings -FixturePath (Join-Path $Fx 'environment-production.json') -OutputPath (Join-Path $TestDrive 'nope') -Apply -ApprovedSha256 x } | Should -Throw '*never applies*'
    }
}

Describe 'Rollback' {
    BeforeAll {
        $script:Rb = Join-Path $ProdRoot 'rollback'
        & (Join-Path $Kit 'deploy/Invoke-PnRollback.ps1') -SettingsPath $ProdSettings -OutputPath $Rb -AsOf '2026-11-16T12:00:00Z' 6>$null
        $script:RbPlan = Read-PnJson (Join-Path $Rb 'plan.json')
    }
    It 'reverses the deployment: the schedule, then the policy assignment' {
        @($RbPlan.steps | ForEach-Object { $_.id }) | Should -Be @('RB-01', 'RB-02', 'RB-03')
        (@($RbPlan.steps[1].arguments) -join ' ') | Should -Be 'policy assignment delete --name pn-service-health-alerts --scope /providers/Microsoft.Management/managementGroups/mg-contoso-example'
    }
    It 'leaves the remediation''s resources to the change record, and keeps the kit''s state and evidence' {
        $RbPlan.steps[2].kind | Should -Be 'manual'
        $RbPlan.keeps | Should -Match 'evidence are kept'
    }
    It 'is a dry run and records evidence for the RB step' {
        @((Read-PnJson (Join-Path $Rb 'results.json')).results | ForEach-Object { $_.status } | Sort-Object -Unique) | Should -Be @('Manual', 'WouldApply')
        (Write-PnEvidence -EvidencePath (Join-Path $TestDrive 'ev-rb') -RunPath $Rb -AsOf '2026-11-16T12:00:00Z').Controls | Should -Contain 'CP-2'
    }
}

Describe 'The ServiceNow sender' {
    It 'posts JSON with the token from the named environment variable, and returns the sys_id' {
        $seen = @{}
        $send = New-PnServiceNowSender -Settings (Settings production $ProdRoot) -Post { param($Uri, $Headers, $Body) $seen.Uri = $Uri; $seen.Auth = $Headers.Authorization; $seen.Body = $Body; [pscustomobject]@{ result = [pscustomobject]@{ sys_id = 'abc123' } } }.GetNewClosure()
        $env:PN_SERVICENOW_TOKEN = 'test-token-value'
        try { & $send @{ dedupe_key = 'azure|X' } | Should -Be 'abc123' } finally { Remove-Item Env:PN_SERVICENOW_TOKEN }
        $seen.Uri | Should -Be 'https://instance.contoso.example/api/x_example/provider_notices'
        $seen.Auth | Should -Be 'Bearer test-token-value'
        $seen.Body | Should -Be '{"dedupe_key":"azure|X"}'
    }
    It 'refuses to send without a token, or to a non-https endpoint' {
        $send = New-PnServiceNowSender -Settings (Settings production $ProdRoot) -Post { 'x' }
        { & $send @{} } | Should -Throw '*holds no token*'
        $s = Settings production $ProdRoot; $s.routing.endpoint = 'http://instance.contoso.example/x'
        { New-PnServiceNowSender -Settings $s } | Should -Throw '*https*'
    }
}

Describe 'The settings template' {
    It 'has a placeholder for every value an agency fills, and no secret' {
        $t = Get-Content -Raw (Join-Path $Kit 'deploy/settings.template.json')
        foreach ($p in '<tenant-id>', '<tenancy-ocid>', '<subscription-id>', '<change-record>', '<servicenow-endpoint-url>') { $t | Should -Match ([regex]::Escape($p)) }
        { Read-PnSettings -Path (Join-Path $Kit 'deploy/settings.template.json') } | Should -Throw '*placeholder*'
    }
}
