# The name suggester: the standard's names from a system's fields, in Windows PowerShell 5.1 and PowerShell 7.
# Pester 5. Run it in both: Invoke-Pester -Path tests/MsaNameSuggestion.Tests.ps1 (pwsh, then powershell.exe).
BeforeAll {
    $script:Pack = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Suggest = Join-Path $script:Pack 'Get-MsaNameSuggestion.ps1'
    $script:Forest = Join-Path (Join-Path $PSScriptRoot 'fixtures') 'forest.json'
    function Get-Suggestion { param([hashtable]$P) & $script:Suggest @P -AsObject }
    function Get-Rule { param($S, [string]$Rule) @($S.Findings | Where-Object { $_.Rule -eq $Rule }) }
}

Describe 'Names to the standard (WD-159, WD-160, WD-173, WD-175)' {
    It 'builds the account, its DNS host name, its retriever group, its SPNs, its managed identity and its seven tags' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0233'; AppShortName = 'hrdb'; Role = 'sql'; Environment = 'prod'; Hosts = @('HRSQL01'); ServiceClass = @('MSSQLSvc'); Port = 1433; Region = 'eastus'; Owner1 = 'hrdb.dba@contoso.example'; Owner2 = 'hrdb.backup@contoso.example'; Sponsor = 'hr.sponsor@contoso.example'; Tier = 'R1'; EntraTarget = 'KeepKerberos' }
        $s.AccountName | Should -Be 'gmsa-hrdb-sql$'
        $s.DnsHostName | Should -Be 'gmsa-hrdb-sql.corp.contoso.example'
        $s.RetrieverGroup | Should -Be 'DL-gMSA-hrdb-Hosts'
        $s.Spns | Should -Be 'MSSQLSvc/hrsql01.corp.contoso.example:1433'
        $s.ManagedIdentity | Should -Be 'id-hrdb-prod-eastus-001'
        $s.Tags | Should -Be 'SystemId=SYS-0233; Owner1=hrdb.dba@contoso.example; Owner2=hrdb.backup@contoso.example; Sponsor=hr.sponsor@contoso.example; Environment=prod; Tier=R1; EntraTarget=KeepKerberos'
        $s.Ready | Should -BeTrue
        @($s.Findings).Count | Should -Be 0
    }
    It 'a dMSA has no retriever group: its retrievers are the hosts' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0388'; AppShortName = 'billing'; AccountType = 'dMSA'; Environment = 'prod'; Hosts = @('BILL01') }
        $s.AccountName | Should -Be 'dmsa-billing$'
        $s.RetrieverGroup | Should -Match '^none: a dMSA'
    }
    It 'takes hosts separated by semicolons or commas, and -SpnHost for the name clients use' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0412'; AppShortName = 'payroll'; Environment = 'prod'; Hosts = @('PAY01;PAY02'); ServiceClass = @('HTTP'); SpnHost = @('payroll') }
        $s.Hosts | Should -Be 'PAY01; PAY02'
        $s.Spns | Should -Be 'HTTP/payroll.corp.contoso.example'
    }
    It 'lowercases the short name and the environment, and drops characters the rule doesn''t allow, saying so' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0412'; AppShortName = 'Pay-Roll'; Environment = 'Prod'; Hosts = @('PAY01') }
        $s.AccountName | Should -Be 'gmsa-payroll$'
        (Get-Rule $s 'NAME-CASE')[0].Severity | Should -Be 'Fixed'
        (Get-Rule $s 'NAME-CHARS')[0].Severity | Should -Be 'Fixed'
        (Get-Rule $s 'TAG-ENVIRONMENT')[0].Severity | Should -Be 'Fixed'
        $s.Ready | Should -BeTrue
    }
    It 'refuses a role outside the list, a short name that starts with a digit and an unknown environment' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0001'; AppShortName = '9app'; Role = 'api'; Environment = 'staging'; Hosts = @('H1') }
        @(Get-Rule $s 'NAME-ROLE').Count | Should -Be 1
        @(Get-Rule $s 'NAME-START').Count | Should -Be 1
        @(Get-Rule $s 'TAG-ENVIRONMENT').Count | Should -Be 1
        $s.Ready | Should -BeFalse
    }
    It 'a name over 15 characters is shortened at <app>, as a finding: the short name on the record has to change' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0601'; AppShortName = 'payrollreports'; Role = 'rs'; Environment = 'prod'; Hosts = @('RPT01') }
        $s.AccountName | Should -Be 'gmsa-payroll-rs$'
        ($s.AccountName.TrimEnd('$')).Length | Should -BeLessOrEqual 15
        (Get-Rule $s 'NAME-LENGTH')[0].Issue | Should -Match 'can have 7 characters here'
        $s.Ready | Should -BeFalse
    }
    It 'no hosts is a finding: nothing could retrieve the password' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0517'; AppShortName = 'visitor'; Environment = 'prod' }
        @(Get-Rule $s 'HOSTS').Count | Should -Be 1
    }
}

Describe '-CheckForest: read-only lookups, reported as findings' {
    It 'a taken account name and an SPN another account holds are findings; an existing retriever group is information' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0412'; AppShortName = 'payroll'; Environment = 'prod'; Hosts = @('PAY01'); ServiceClass = @('HTTP'); SpnHost = @('reports'); CheckForest = $true; ForestFixturePath = $script:Forest }
        (Get-Rule $s 'FOREST-NAME')[0].Issue | Should -Match 'no numbering rule'
        (Get-Rule $s 'FOREST-GROUP')[0].Severity | Should -Be 'Info'
        (Get-Rule $s 'FOREST-SPN')[0].Issue | Should -Match 'svc-reports'
        $s.AccountName | Should -Be 'gmsa-payroll$'
        $s.Ready | Should -BeFalse
    }
    It 'a free name raises nothing' {
        $s = Get-Suggestion @{ SystemId = 'SYS-0517'; AppShortName = 'visitor'; Environment = 'prod'; Hosts = @('VIS01'); CheckForest = $true; ForestFixturePath = $script:Forest }
        @($s.Findings).Count | Should -Be 0
        $s.CheckedForest | Should -BeTrue
    }
}

Describe 'The printed form' {
    It 'is fixed labels joined by LF, the same in Windows PowerShell 5.1 and PowerShell 7' {
        $t = & $script:Suggest -SystemId SYS-0233 -AppShortName hrdb -Role sql -Environment prod -Hosts HRSQL01 -ServiceClass MSSQLSvc -Port 1433
        $t | Should -BeOfType [string]
        $t.Contains("`r") | Should -BeFalse
        $lines = $t -split "`n"
        $lines[0] | Should -Be 'AccountName      gmsa-hrdb-sql$'
        $lines[2] | Should -Be 'DnsHostName      gmsa-hrdb-sql.corp.contoso.example'
        $lines[-1] | Should -Be 'Ready            True'
    }
}
