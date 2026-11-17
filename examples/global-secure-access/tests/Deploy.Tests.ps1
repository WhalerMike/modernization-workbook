#Requires -Version 7.1
# Pester 5: the deployment runbook's scripts (Chapter 09), run as a reader would, against the fixtures.
BeforeAll {
    $script:Kit = Split-Path -Parent $PSScriptRoot
    Import-Module (Join-Path $Kit 'powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    $script:Out = Join-Path ([IO.Path]::GetTempPath()) "gsa-deploy-$([guid]::NewGuid().ToString('N'))"
    Push-Location $Kit
    $null = & ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.test.json -FixturePath tests/fixtures/ring1 -OutputPath "$Out/collect" -AsOf 2026-11-30T12:00:00Z 6>$null
    $null = & ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath "$Out/collect-pilot" -AsOf 2026-11-16T12:00:00Z 6>$null
}
AfterAll { Pop-Location; Remove-Item -Recurse -Force -LiteralPath $Out -ErrorAction SilentlyContinue }

Describe 'Preflight' {
    It 'passes the test stage at ring 1' {
        $global:LASTEXITCODE = 0
        & ./deploy/Test-GsaPreflight.ps1 -SettingsPath tests/fixtures/settings.test.json -Stage test -CollectionPath "$Out/collect" -InputsPath tests/fixtures/ring1/inputs -DesiredPath config/desired.ring1.json -OutputPath "$Out/pre" -AsOf 2026-11-30T12:00:00Z 6>$null
        $LASTEXITCODE | Should -Be 0
        @((Read-GsaJson -Path "$Out/pre/results.json") | Where-Object { $_.Status -eq 'Fail' }).Count | Should -Be 0
    }
    It 'fails a stage whose settings name another environment, and production without the test evidence' {
        $r = @(Invoke-GsaPreflight -Settings (Read-GsaSettings -Path tests/fixtures/settings.test.json) -Stage production -CollectionPath "$Out/collect" -InputsPath tests/fixtures/ring1/inputs -DesiredPath config/desired.ring1.json)
        @($r | Where-Object Status -EQ 'Fail' | ForEach-Object Id) | Should -Be @('PF-01', 'PF-06')
    }
    It 'fails a policy that doesn''t exclude the emergency group (the pilot''s Finance policy)' {
        $r = @(Invoke-GsaPreflight -Settings (Read-GsaSettings -Path tests/fixtures/settings.test.json) -Stage test -CollectionPath "$Out/collect-pilot" -InputsPath tests/fixtures/pilot/inputs -DesiredPath config/desired.lab.json)
        ($r | Where-Object Id -EQ 'PF-03').Detail | Should -Match 'NET-PA-PA-Finance-Device-MFA'
        ($r | Where-Object Id -EQ 'PF-02').Status | Should -Be 'Pass'
    }
}

Describe 'Smoke test' {
    It 'says Go at ring 1' {
        $global:LASTEXITCODE = 0
        & ./deploy/Invoke-GsaSmokeTest.ps1 -SettingsPath tests/fixtures/settings.test.json -CollectionPath "$Out/collect" -InputsPath tests/fixtures/ring1/inputs -OutputPath "$Out/smoke" -AsOf 2026-11-30T12:00:00Z 6>$null
        $LASTEXITCODE | Should -Be 0
        (Read-GsaJson -Path "$Out/smoke/verdict.json").verdict | Should -Be 'Go'
    }
    It 'says No-go for the pilot, with exit code 1' {
        & ./deploy/Invoke-GsaSmokeTest.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath "$Out/collect-pilot" -InputsPath tests/fixtures/pilot/inputs -OutputPath "$Out/smoke-pilot" -AsOf 2026-11-16T12:00:00Z 6>$null
        $LASTEXITCODE | Should -Be 1
        (Read-GsaJson -Path "$Out/smoke-pilot/verdict.json").verdict | Should -Be 'No-go'
    }
}

Describe 'Rollback and the stage''s evidence' {
    It 'plans the rollback as a dry run' {
        & ./deploy/Invoke-GsaRollback.ps1 -SettingsPath tests/fixtures/settings.test.json -CollectionPath "$Out/collect" -OutputPath "$Out/rb" -AsOf 2026-11-30T12:00:00Z 6>$null
        @((Read-GsaJson -Path "$Out/rb/results.json") | Where-Object { $_.Status -eq 'WouldApply' }).Count | Should -Be 4
    }
    It 'refuses to apply a rollback against a fixture collection' {
        { & ./deploy/Invoke-GsaRollback.ps1 -SettingsPath tests/fixtures/settings.test.json -CollectionPath "$Out/collect" -OutputPath "$Out/rb" -Apply -ApprovedSha256 (Get-GsaFileHash "$Out/rb/plan.json") 6>$null } | Should -Throw '*live invoker*'
    }
    It 'passes the test stage once every step has a passing record' {
        $e = "$Out/evidence"
        & ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.test.json -CollectionPath "$Out/collect" -DesiredPath config/desired.ring1.json -OutputPath "$Out/plan" -AsOf 2026-11-30T12:00:00Z 6>$null
        foreach ($run in 'pre', 'collect', 'plan', 'smoke', 'rb') { $null = Write-GsaEvidence -EvidencePath $e -RunPath "$Out/$run" -AsOf 2026-11-30T13:00:00Z }
        @(Test-GsaEvidence -EvidencePath $e -Stage test | Where-Object Status -EQ 'Fail').Count | Should -Be 0
    }
}
