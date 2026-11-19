#Requires -Version 7.1
# Pester 5. No subscription, no network and no az: a stand-in runner answers every az call.

BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/DailyChecks/DailyChecks.psm1') -Force
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    function script:New-Settings([string]$Env, [hashtable]$Change = @{}) {
        $s = Read-DcJson -Path (Join-Path $script:Fx "settings.$Env.json")
        foreach ($k in 'outputRoot', 'evidencePath', 'testEvidencePath') { $s[$k] = $s[$k].Replace('SCRATCH', $TestDrive.Replace('\', '/')) }
        foreach ($k in $Change.Keys) { $s[$k] = $Change[$k] }
        $p = Join-Path $TestDrive "settings.$Env.$([guid]::NewGuid().ToString('n').Substring(0, 6)).json"
        Write-DcJson -Path $p -Value $s
        $p
    }
    # Some workstations keep a git repository in the home folder, which puts the test drive inside one; PF-03
    # is right to fail there, so the tests that expect a clean preflight leave PF-03 out when that's the case.
    $d = [IO.DirectoryInfo]::new([IO.Path]::GetFullPath($TestDrive)); $script:DriveInRepo = $false
    while ($d) { if (Test-Path -LiteralPath (Join-Path $d.FullName '.git')) { $script:DriveInRepo = $true }; $d = $d.Parent }
    $script:Calls = [Collections.Generic.List[string]]::new()
    $script:Account = '{"tenantId":"aaaabbbb-0000-cccc-1111-dddd2222eeee","id":"aaaa0a0a-bb1b-cc2c-dd3d-eeeeee4e4e4e"}'
    Set-DcRunner {
        param($Arguments)
        $script:Calls.Add(($Arguments -join ' '))
        switch -Wildcard ($Arguments -join ' ') {
            'account show*' { $script:Account }
            'cloud show*' { '{"name":"AzureCloud"}' }
            'deployment group what-if*' { [IO.File]::ReadAllText((Join-Path $script:Fx 'whatif-create.json')) }
            'deployment group create*' { '{"properties":{"provisioningState":"Succeeded"}}' }
            'monitor log-analytics query*' { '[{"LastSeen":"2026-11-16T07:20:00Z","Records":"12"}]' }
            default { throw "unexpected az call: $($Arguments -join ' ')" }
        }
    }
}

AfterAll { Set-DcRunner $null }

Describe 'Settings' {
    It 'keeps the template free of IDs: the ARM and Bicep files declare the same resource and parameters' {
        $arm = Read-DcJson -Path (Join-Path $script:Kit 'deploy/main.json')
        $bicep = [IO.File]::ReadAllText((Join-Path $script:Kit 'deploy/main.bicep'))
        $r = @($arm.resources)[0]
        $bicep | Should -Match ([regex]::Escape("'$($r.type)@$($r.apiVersion)'"))
        foreach ($p in $arm.parameters.Keys) { $bicep | Should -Match "param $p string" }
        $r.kind | Should -Be 'shared'
        $r.name | Should -Not -Match 'newGuid'
    }
    It 'refuses a settings file with placeholders left' {
        { Read-DcSettings -Path (Join-Path $script:Kit 'deploy/settings.template.json') } | Should -Throw '*placeholders*'
    }
    It 'refuses any cloud but AzureCloud' {
        { Read-DcSettings -Path (New-Settings test @{ cloud = 'AzureChinaCloud' }) } | Should -Throw '*commercial Azure only*'
    }
    It 'needs two or more emergency access accounts' {
        { Read-DcSettings -Path (New-Settings test @{ emergencyAccessObjectIds = @('00aa00aa-bb11-cc22-dd33-44ee44ee44ee') }) } | Should -Throw '*two or more*'
    }
}

Describe 'Preflight' {
    It 'passes PF-01 to PF-06 for test, signed in to the right tenant' {
        @(Test-DcPreflight -SettingsPath (New-Settings test) -Live | Where-Object { $_.Status -eq 'Fail' -and -not ($script:DriveInRepo -and $_.Check -eq 'PF-03') }) | Should -BeNullOrEmpty
    }
    It 'fails PF-04 when az is in another tenant' {
        $script:Account = '{"tenantId":"ffffffff-0000-cccc-1111-dddd2222eeee","id":"aaaa0a0a-bb1b-cc2c-dd3d-eeeeee4e4e4e"}'
        try { (@(Test-DcPreflight -SettingsPath (New-Settings test) -Live | Where-Object Check -EQ 'PF-04')[0]).Status | Should -Be 'Fail' }
        finally { $script:Account = '{"tenantId":"aaaabbbb-0000-cccc-1111-dddd2222eeee","id":"aaaa0a0a-bb1b-cc2c-dd3d-eeeeee4e4e4e"}' }
    }
    It 'fails PF-03 when output is inside a repository' {
        (@(Test-DcPreflight -SettingsPath (New-Settings test @{ outputRoot = $script:Kit }) | Where-Object Check -EQ 'PF-03')[0]).Status | Should -Be 'Fail'
    }
    It 'fails PF-06 in production without the test stage evidence' {
        (@(Test-DcPreflight -SettingsPath (New-Settings production) | Where-Object Check -EQ 'PF-06')[0]).Status | Should -Be 'Fail'
    }
}

Describe 'Plan, what-if and deploy' {
    BeforeAll {
        $script:Settings = New-Settings test
        $script:PlanDir = Join-Path $TestDrive 'plan'
        $script:Plan = New-DcDeploymentPlan -SettingsPath $script:Settings -OutputPath $script:PlanDir -AsOf '2026-11-16T08:00:00Z' -RunWhatIf -ChangeRecord 'CHG-0002'
    }
    It 'puts the workspace and the emergency access IDs in the parameters, not the template' {
        $p = Read-DcJson -Path (Join-Path $script:PlanDir 'parameters.json')
        $sd = $p.parameters.serializedData.value
        $sd | Should -Match 'law-contoso-test'
        $ea = @((ConvertFrom-DcJsonText -Text $sd).items | Where-Object { $_.type -eq 9 } | ForEach-Object { @($_.content.parameters) } | Where-Object { $_.name -eq 'EmergencyAccessIds' })[0]
        $ea.value | Should -Be '"00aa00aa-bb11-cc22-dd33-44ee44ee44ee", "11bb11bb-cc22-dd33-ee44-55ff55ff55ff"'
        [IO.File]::ReadAllText((Join-Path $script:Kit 'workbook/daily-checks.workbook.json')) | Should -Not -Match '00aa00aa'
    }
    It 'runs what-if read-only and records one Create' {
        $script:Plan.Mode | Should -Be 'Live'
        @($script:Plan.Changes | ForEach-Object { $_.changeType }) | Should -Be @('Create')
        @($script:Calls | Where-Object { $_ -like 'deployment group create*' }) | Should -BeNullOrEmpty
    }
    It 'writes the same plan twice for the same input' {
        $b = Join-Path $TestDrive 'plan-b'
        $x = New-DcDeploymentPlan -SettingsPath $script:Settings -OutputPath $b -AsOf '2026-11-16T08:00:00Z' -WhatIfResultPath (Join-Path $script:Fx 'whatif-create.json') -ChangeRecord 'CHG-0002'
        Get-DcFileHash -Path (Join-Path $b 'parameters.json') | Should -Be (Get-DcFileHash -Path (Join-Path $script:PlanDir 'parameters.json'))
        $x.Mode | Should -Be 'Fixture'
    }
    It 'changes nothing without -Apply' {
        $r = Invoke-DcDeploy -PlanPath $script:PlanDir -ApprovedSha256 $script:Plan.Sha256 -OutputPath (Join-Path $TestDrive 'dry') -AsOf '2026-11-16T08:05:00Z'
        $r.Applied | Should -BeFalse
        Join-Path $TestDrive 'dry' | Should -Not -Exist
    }
    It 'refuses a hash that is not the approved one' {
        { Invoke-DcDeploy -PlanPath $script:PlanDir -ApprovedSha256 ('0' * 64) -OutputPath (Join-Path $TestDrive 'x') -AsOf '2026-11-16T08:05:00Z' -Apply } | Should -Throw '*not the approved*'
    }
    It 'refuses a plan whose what-if shows a Delete' {
        $d = Join-Path $TestDrive 'plan-del'
        $x = New-DcDeploymentPlan -SettingsPath $script:Settings -OutputPath $d -AsOf '2026-11-16T08:00:00Z' -WhatIfResultPath (Join-Path $script:Fx 'whatif-delete.json')
        { Invoke-DcDeploy -PlanPath $d -ApprovedSha256 $x.Sha256 -OutputPath (Join-Path $TestDrive 'x') -AsOf '2026-11-16T08:05:00Z' } | Should -Throw '*Delete*'
    }
    It 'refuses a plan with no what-if' {
        $d = Join-Path $TestDrive 'plan-dry'
        $x = New-DcDeploymentPlan -SettingsPath $script:Settings -OutputPath $d -AsOf '2026-11-16T08:00:00Z'
        { Invoke-DcDeploy -PlanPath $d -ApprovedSha256 $x.Sha256 -OutputPath (Join-Path $TestDrive 'x') -AsOf '2026-11-16T08:05:00Z' } | Should -Throw '*no what-if*'
    }
    It 'deploys with -Apply and the approved hash, and the record passes' {
        $o = Join-Path $TestDrive 'deploy'
        $r = Invoke-DcDeploy -PlanPath $script:PlanDir -ApprovedSha256 $script:Plan.Sha256 -OutputPath $o -AsOf '2026-11-16T08:10:00Z' -Apply
        $r.Applied | Should -BeTrue
        (Test-DcRunFolder -Path $o).Ok | Should -BeTrue
        @($script:Calls | Where-Object { $_ -like 'deployment group create*' }).Count | Should -Be 1
    }
}

Describe 'Reachability, rollback and the test stage' {
    It 'reports every table Late or Missing on the day-1 fixture as it is' {
        $rows = @(Test-DcReachability -SettingsPath (New-Settings test) -FixturePath (Join-Path $script:Kit 'tests/fixtures/reach-day1.json') -OutputPath (Join-Path $TestDrive 'reach1') -AsOf '2026-11-16T07:30:00Z')
        (@($rows | Where-Object Table -EQ 'SigninLogs')[0]).State | Should -Be 'Late'
        (@($rows | Where-Object Table -EQ 'SentinelHealth')[0]).State | Should -Be 'Missing'
        (@($rows | Where-Object Table -EQ 'CommonSecurityLog')[0]).State | Should -Be 'Delivering'
    }
    It 'plans the rollback without running anything' {
        $before = $script:Calls.Count
        $r = New-DcRollbackPlan -SettingsPath (New-Settings test) -OutputPath (Join-Path $TestDrive 'rb') -AsOf '2026-11-16T09:00:00Z'
        $r.find | Should -Match 'az resource list'
        $script:Calls.Count | Should -Be $before
    }
    It 'passes the test stage with a live record for every step' {
        $s = New-Settings test
        $ev = Join-Path $TestDrive 'evidence-stage'
        $pre = Join-Path $TestDrive 'st-pre'; $val = Join-Path $TestDrive 'st-val'; $pl = Join-Path $TestDrive 'st-plan'; $dep = Join-Path $TestDrive 'st-dep'; $re = Join-Path $TestDrive 'st-reach'
        $null = Test-DcPreflight -SettingsPath $s -OutputPath $pre -AsOf '2026-11-16T07:00:00Z' -Live
        $null = Invoke-DcValidate -TemplatePath (Join-Path $script:Kit 'workbook/daily-checks.workbook.json') -OutputPath $val -AsOf '2026-11-16T07:01:00Z' -Environment test
        $x = New-DcDeploymentPlan -SettingsPath $s -OutputPath $pl -AsOf '2026-11-16T07:02:00Z' -RunWhatIf
        $null = Invoke-DcDeploy -PlanPath $pl -ApprovedSha256 $x.Sha256 -OutputPath $dep -AsOf '2026-11-16T07:03:00Z' -Apply
        $null = Test-DcReachability -SettingsPath $s -OutputPath $re -AsOf '2026-11-16T07:30:00Z'
        foreach ($p in $pre, $val, $pl, $dep, $re) { $null = Write-DcEvidence -EvidencePath $ev -RunPath $p -AsOf '2026-11-16T07:40:00Z' }
        $rows = @(Test-DcEvidence -EvidencePath $ev -Stage test)
        @($rows | Where-Object { $_.Check -in 'STEP-VALIDATE', 'STEP-PLAN', 'STEP-DEPLOY', 'STEP-REACH' -and $_.Status -eq 'Pass' }).Count | Should -Be 4
        if (-not $script:DriveInRepo) { (@($rows | Where-Object Check -EQ 'STEP-PRE')[0]).Status | Should -Be 'Pass' }
    }
}
