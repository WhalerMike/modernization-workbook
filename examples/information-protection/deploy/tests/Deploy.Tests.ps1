#Requires -Version 7.1
# Pester 5: the runbook's preflight and scheduled run (Chapter 09), with fake modules and a fixture runner.
BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../../powershell/InformationProtection/InformationProtection.psm1') -Force
    $script:Fx = Join-Path $PSScriptRoot '../../tests/fixtures'
    function script:Settings([string]$Environment) {
        $s = Read-IpSettings -Path (Join-Path $Fx 'settings.lab.json'); $s.environment = $Environment; $s.outputRoot = (Join-Path $TestDrive 'root'); $s
    }
    $script:Good = @([pscustomobject]@{ Name = 'ExchangeOnlineManagement'; Version = '3.10.1' }, [pscustomobject]@{ Name = 'AIPService'; Version = '3.1.0.0' })
    $script:AsOf = '2026-11-24T15:00:00Z'
    function script:Row($run, $id) { @($run.Rows | Where-Object Id -EQ $id)[0] }
}

Describe 'Preflight' -Tag ch09 {
    It 'passes in test with the right modules' {
        $r = Test-IpPreflight -Settings (Settings test) -OutputPath (Join-Path $TestDrive 'pf') -AsOf $AsOf -Modules $Good -PowerShellVersion '7.6.0'
        $r.Result | Should -Be 'Pass'
    }
    It 'fails module 3.10 on PowerShell 7.4' {
        $r = Test-IpPreflight -Settings (Settings test) -OutputPath (Join-Path $TestDrive 'pf2') -AsOf $AsOf -Modules $Good -PowerShellVersion '7.4.6'
        (Row $r 'PF-02').Detail | Should -Match '7.6'
    }
    It 'fails an AIPService too old for PowerShell 7' {
        $m = @($Good[0], [pscustomobject]@{ Name = 'AIPService'; Version = '2.0.0.0' })
        $r = Test-IpPreflight -Settings (Settings test) -OutputPath (Join-Path $TestDrive 'pf3') -AsOf $AsOf -Modules $m -PowerShellVersion '7.6.0'
        (Row $r 'PF-03').Status | Should -Be 'Fail'
    }
    It 'checks the app-only certificate and organization' {
        $s = Settings test; $s.app = @{ appId = '11111111-1111-4111-8111-111111111111'; certificateThumbprint = 'ABC'; organization = 'contoso.example' }
        $r = Test-IpPreflight -Settings $s -OutputPath (Join-Path $TestDrive 'pf4') -AsOf $AsOf -Modules $Good -PowerShellVersion '7.6.0' -FindCertificate { $true }
        (Row $r 'PF-04').Detail | Should -Match 'onmicrosoft'
    }
    It 'holds production without the test stage''s go/no-go' {
        $r = Test-IpPreflight -Settings (Settings production) -OutputPath (Join-Path $TestDrive 'pf5') -AsOf $AsOf -Modules $Good -PowerShellVersion '7.6.0'
        (Row $r 'PF-06').Status | Should -Be 'Fail'
    }
}

Describe 'Scheduled run' -Tag ch09 {
    It 'runs preflight, the export and every check, and records them' {
        $s = Settings test; $s.baselinePath = (Join-Path $Fx 'snapshots/2026-10-24')
        $ev = Join-Path $TestDrive 'ev'
        $r = Invoke-IpScheduledRun -Settings $s -Runner (New-IpFixtureRunner -Path (Join-Path $Fx 'tenant')) -RunRoot (Join-Path $TestDrive 'run') -EvidencePath $ev -ChangeRecord 'CHG-TEST-1' -AsOf $AsOf -PreflightOverrides @{ Modules = $Good; PowerShellVersion = [version]'7.6.0' }
        $r.Result | Should -Be 'Pass'
        @($r.Checks | ForEach-Object Task) | Should -Contain 'drift'
        @(Test-IpEvidence -EvidencePath $ev | Where-Object Status -EQ 'Fail').Count | Should -Be 0
        @(Get-ChildItem (Join-Path $ev 'records')).Count | Should -Be 12  # preflight, export, nine checks, the summary
    }
    It 'stops after a failed preflight' {
        $r = Invoke-IpScheduledRun -Settings (Settings test) -Runner (New-IpFixtureRunner -Path (Join-Path $Fx 'tenant')) -RunRoot (Join-Path $TestDrive 'run2') -EvidencePath (Join-Path $TestDrive 'ev2') -ChangeRecord 'CHG-TEST-2' -AsOf $AsOf -PreflightOverrides @{ Modules = @(); PowerShellVersion = [version]'7.6.0' }
        $r.Result | Should -Be 'Stopped'
    }
    It 'refuses the lab environment' {
        { Invoke-IpScheduledRun -Settings (Settings lab) -Runner (New-IpFixtureRunner -Path (Join-Path $Fx 'tenant')) -RunRoot (Join-Path $TestDrive 'r3') -EvidencePath (Join-Path $TestDrive 'e3') -ChangeRecord 'x' } | Should -Throw '*test or production*'
    }
}
