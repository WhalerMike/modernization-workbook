#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Non-Person Identity learning path, Module 15: your first gMSA, for a new workload. Chapter 12's request check
# and Chapter 06's one-account plan (New-NpiKrbGmsaPlan) on three requests for new workloads that replace no
# account (tests/fixtures/m15), dry-run against the fictional forest before and after its KDS root key exists.
# No domain, tenant or network. The file sits outside tests/, as Chapter 13's suite does, because Chapters 01 to
# 10's Lab 1 runs `Invoke-Pester -Path tests` and prints the count; tests/test_first_gmsa.py runs it in CI.

BeforeAll {
    $script:Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    Import-Module (Join-Path $script:Root 'powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-m15-{0}" -f [guid]::NewGuid())
    $script:Fix = Join-Path $script:Root 'tests/fixtures'
    $script:AsOf = [datetime]'2026-11-20'
    $out = Join-Path $script:Tmp 'first-gmsa'
    $null = & (Join-Path $script:Root 'Invoke-NpiGmsaStandard.ps1') -InputPath (Join-Path $script:Fix 'm15/inputs') -StandardPath (Join-Path $script:Fix 'ch12/standard.json') -OutputPath $out -AsOf $script:AsOf
    $script:Checks = Get-Content (Join-Path $out 'request-check.json') -Raw | ConvertFrom-Json
    $script:Findings = @(Get-Content (Join-Path $out 'findings.json') -Raw | ConvertFrom-Json)
    $script:Rows = @(Import-Csv (Join-Path $out 'kerberos-replatform.csv'))
    $script:Retrievers = Get-Content (Join-Path $out 'password-retrievers.json') -Raw | ConvertFrom-Json -AsHashtable
    $tenant = 'c0ffee00-0000-4000-8000-000000000001'
    $script:NewPlan = {
        param([string]$Name, [string]$App, [string]$Req, [string]$Chg, [string]$Reason = '')
        New-NpiKrbGmsaPlan -Name $Name -RetrieverGroupDn "CN=DL-gMSA-$App-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example" -AdStandardPath (Join-Path $script:Fix 'ch06/inputs/ad-standard.json') `
            -RequestId $Req -ChangeRecord $Chg -TenantId $tenant -Domain 'corp.contoso.example' -Cloud gcc -AsOf $script:AsOf -Workload "the $App service" -OutboundOnlyReason $Reason
    }
    $script:Plan = & $script:NewPlan 'gmsa-timesheet$' 'timesheet' 'REQ-2026-0301' 'CHG0041301'
    $planDir = Join-Path $script:Tmp 'plan'
    $null = Export-NpiKrbRun -OutputPath $planDir -Task kerberos-apply -Cloud gcc -Mode Plan -TenantId $tenant -Domain 'corp.contoso.example' -AsOf '2026-11-20' -Files @{ 'kerberos-plan.json' = $script:Plan }
    $script:PlanPath = Join-Path $planDir 'kerberos-plan.json'
    $sha = (Get-FileHash $script:PlanPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $script:DryRun = {
        param([string]$KerberosFixture, [string]$Sub)
        $o = Join-Path $script:Tmp $Sub
        $null = & (Join-Path $script:Root 'Invoke-NpiKerberosIslandAction.ps1') -PlanPath $script:PlanPath -ApprovedSha256 $sha -RunAs Pipeline -FixturePath (Join-Path $script:Fix 'estate.json') -KerberosFixturePath $KerberosFixture -OutputPath $o -AsOf $script:AsOf
        @(Get-Content (Join-Path $o 'results.json') -Raw | ConvertFrom-Json)
    }
}

AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'Module 15: a new gMSA for a new workload' {
    It 'passes the two requests that follow the standard and holds the one that does not' {
        @($script:Checks | Where-Object Passed | ForEach-Object RequestId) | Should -Be @('REQ-2026-0301', 'REQ-2026-0302')
        ($script:Checks | Where-Object RequestId -EQ 'REQ-2026-0303').Passed | Should -BeFalse
    }
    It 'holds REQ-2026-0303 for its 19-character name and its single owner' {
        @($script:Findings | ForEach-Object Rule | Sort-Object) | Should -Be @('NPI-STD-03', 'NPI-STD-04')
        ($script:Findings | Where-Object Rule -EQ 'NPI-STD-03').Issue | Should -Match '19 characters'
    }
    It 'hands Chapter 06 rows that replace no account: SamAccountName is the new gMSA itself' {
        $script:Rows.Count | Should -Be 2
        foreach ($r in $script:Rows) { $r.SamAccountName | Should -Be $r.NewAccount }
    }
    It 'gives each new gMSA its own DL-gMSA-<app>-Hosts retriever group' {
        $script:Retrievers.accounts['gmsa-timesheet$'] | Should -Be @('CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
        $script:Retrievers.requests['gmsa-visitor$'].changeRecord | Should -Be 'CHG0041302'
    }
    It 'plans the gMSA with the standard settings: the OU, AES256, 30 days, outbound-only with no SPN' {
        $p = $script:Plan.actions[0].Params
        $p.Path | Should -Be 'OU=Service Accounts,DC=corp,DC=contoso,DC=example'
        $p.KerberosEncryptionType | Should -Be 'AES256'
        $p.ManagedPasswordIntervalInDays | Should -Be 30
        $p.RestrictToOutboundAuthenticationOnly | Should -BeTrue
        $script:Plan.actions[0].RunBy | Should -Be 'pipeline'
    }
    It 'leaves outbound-only off for a gMSA that will hold an SPN, with the reason in the plan' {
        $v = & $script:NewPlan 'gmsa-visitor$' 'visitor' 'REQ-2026-0302' 'CHG0041302' 'holds the SPN HTTP/visitor.corp.contoso.example'
        $v.actions[0].Params.Contains('RestrictToOutboundAuthenticationOnly') | Should -BeFalse
    }
    It 'refuses a name that breaks the standard, before any plan exists' {
        { & $script:NewPlan 'gmsa-kioskreporting$' 'kioskreporting' 'REQ-2026-0303' 'CHG0041303' } | Should -Throw '*15 characters or fewer*'
    }
    It 'skips the create in a forest with no KDS root key yet' {
        $r = & $script:DryRun (Join-Path $script:Fix 'm15/ad-kerberos-no-kds-key.json') 'before-setup'
        $r[0].Outcome | Should -Be 'Skipped'
        $r[0].Detail | Should -Be 'KDS root key Missing'
    }
    It 'would send New-ADServiceAccount, as the pipeline, once the forest has a key old enough' {
        $r = & $script:DryRun (Join-Path $script:Fix 'ch06/ad-kerberos.json') 'after-setup'
        $r[0].Outcome | Should -Be 'WouldSend'
        $r[0].Cmdlet | Should -Be 'New-ADServiceAccount'
    }
}
