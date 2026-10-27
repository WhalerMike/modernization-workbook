BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') -Force
    Register-KitAdMocks -ModuleName FMPSqlEstate
    Register-KitSqlMocks
    function Find-Row($Rows, $Server, $Instance) { @($Rows | Where-Object { $_.ServerName -eq $Server -and $_.InstanceName -eq $Instance })[0] }
}

Describe 'Parsing' {
    It 'reads the three MSSQLSvc SPN forms' {
        $p = ConvertFrom-FMPSqlSpn 'MSSQLSvc/SQL01.contoso.example:1433'
        $p.Host | Should -Be 'sql01.contoso.example'
        $p.Port | Should -Be 1433
        $p.InstanceName | Should -BeNullOrEmpty
        (ConvertFrom-FMPSqlSpn 'MSSQLSvc/csql01.child.contoso.example:Sales').InstanceName | Should -Be 'SALES'
        (ConvertFrom-FMPSqlSpn 'MSSQLSvc/sql01.contoso.example').InstanceName | Should -Be 'MSSQLSERVER'
        ConvertFrom-FMPSqlSpn 'HTTP/web.contoso.example' | Should -BeNullOrEmpty
    }
    It 'parses a SQL Browser reply with two instances and a named pipe' {
        $text = $FMPSqlFix.browser.'sql02.contoso.example'
        $bytes = [byte[]](@(0x05, ($text.Length % 256), [math]::Floor($text.Length / 256)) + [System.Text.Encoding]::ASCII.GetBytes($text))
        $r = @(ConvertFrom-FMPSqlBrowserResponse -Bytes $bytes -QueriedHost 'SQL02.contoso.example')
        $r | Should -HaveCount 2
        $r[0].Host | Should -Be 'sql02.contoso.example'
        $r[1].InstanceName | Should -Be 'REPORTS'
        $r[1].Port | Should -Be 50123
        $r[0].Version | Should -Be '15.0.2000.5'
    }
    It 'ignores a reply that is not an SVR_RESP' {
        ConvertFrom-FMPSqlBrowserResponse -Bytes ([byte[]](0x04, 0x01, 0x00, 0x41)) -QueriedHost 'x' | Should -BeNullOrEmpty
    }
    It 'names SQL Server versions, including 2008 R2' {
        Get-FMPSqlVersionName '16.0.4135.4' | Should -Be '2022'
        Get-FMPSqlVersionName '10.50.6000.34' | Should -Be '2008 R2'
        Get-FMPSqlVersionName '17.0.1000.7' | Should -Be '2025'
        Get-FMPSqlVersionName $null | Should -Be 'Unknown'
    }
}

Describe 'SELECT-only guard' {
    It 'accepts every statement in the query catalog' {
        foreach ($q in (Get-FMPSqlQueryCatalog).Values) { Test-FMPSelectOnly -Query $q | Should -BeTrue }
    }
    It 'rejects <Case>' -ForEach @(
        @{ Case = 'an UPDATE'; Sql = 'UPDATE sys.databases SET name = 1' }
        @{ Case = 'a second statement'; Sql = 'SELECT 1; DROP TABLE t' }
        @{ Case = 'SELECT INTO'; Sql = 'SELECT * INTO dbo.copy FROM sys.databases' }
        @{ Case = 'EXEC'; Sql = 'EXEC sp_configure' }
        @{ Case = 'a system procedure in a SELECT'; Sql = 'SELECT * FROM OPENQUERY(x, ''y'')' }
        @{ Case = 'an extended procedure'; Sql = 'SELECT xp_cmdshell' }
        @{ Case = 'a keyword hidden after a comment'; Sql = "SELECT 1 /* harmless */`nDELETE FROM t" }
        @{ Case = 'a CTE that writes'; Sql = 'WITH c AS (SELECT 1 AS a) DELETE FROM c' }
        @{ Case = 'GRANT'; Sql = 'GRANT VIEW SERVER STATE TO x' }
        @{ Case = 'DECLARE'; Sql = 'DECLARE @a int' }
    ) {
        Test-FMPSelectOnly -Query $Sql | Should -BeFalse
    }
    It 'does not mistake a keyword inside a string or a column name for a statement' {
        Test-FMPSelectOnly -Query "SELECT last_user_update, 'DROP TABLE x' AS label FROM sys.dm_db_index_usage_stats" | Should -BeTrue
    }
    It 'builds a read-intent, Windows-integrated connection string' {
        $cs = Get-FMPSqlConnectionString -ServerName 'sql01.contoso.example' -Port 1433
        $cs | Should -Match 'ApplicationIntent=ReadOnly'
        $cs | Should -Match 'Integrated Security=SSPI'
        $cs | Should -Match 'TrustServerCertificate=False'
        $cs | Should -Not -Match 'Password'
        Get-FMPSqlConnectionString -ServerName 'h' -InstanceName 'SALES' | Should -Match 'Server=h\\SALES;'
    }
}

Describe 'First-pass gate (Runbook R02)' {
    It 'retires an instance idle past the threshold only when uptime covers it' {
        (Get-FMPSqlClassification -Major 15 -EngineStartTime '2025-06-14' -AsOf $FMPAsOf).Classification | Should -Be 'retire'
        (Get-FMPSqlClassification -Major 15 -EngineStartTime '2026-10-01' -AsOf $FMPAsOf).Classification | Should -Be 'consolidate'
    }
    It 'retains 2022 and later, and sends an unknown version to review' {
        (Get-FMPSqlClassification -Major 16 -AsOf $FMPAsOf).Classification | Should -Be 'retain'
        (Get-FMPSqlClassification -Major $null -AsOf $FMPAsOf).Classification | Should -Be 'review'
    }
}

Describe 'Estate discovery against the fictional forest' {
    BeforeAll {
        $out = Join-Path $TestDrive 'run'
        $result = Invoke-FMPSqlEstateDiscovery -OutputPath $out -TargetServers 'app01.contoso.example' -ProbeNetwork -QueryInstances -AsOf $FMPAsOf
        $rows = $result.Instances
    }
    It 'counts six instances on five hosts' {
        $result.Summary.InstanceCount | Should -Be 6
        $result.Summary.HostCount | Should -Be 5
    }
    It 'deduplicates an instance that every signal saw' {
        $r = Find-Row $rows 'sql01.contoso.example' 'MSSQLSERVER'
        $r.DiscoveryMethod | Should -Be 'SPN;Directory;Network'
        $r.SourcesAgree | Should -Be 'Yes'
        $r.Port | Should -Be 1433
        @($r.SPNRegistration) | Should -HaveCount 2
    }
    It 'joins a port-only SPN to the instance listening on that port' {
        $r = Find-Row $rows 'sql02.contoso.example' 'MSSQLSERVER'
        $r.SpnSeen | Should -BeTrue
        $r.DirectorySeen | Should -BeTrue
        $r.ServiceAccount | Should -Be 'gmsa-sql02$'
    }
    It 'says which signals missed an instance' {
        (Find-Row $rows 'sql02.contoso.example' 'REPORTS').SourceNotes | Should -Be 'Not found by SPN'
        (Find-Row $rows 'app01.contoso.example' 'SQLEXPRESS').SourceNotes | Should -Be 'Not found by SPN, Directory'
        (Find-Row $rows 'old01.contoso.example' 'MSSQLSERVER').SourceNotes | Should -Be 'Not found by Directory, Network'
        $result.Summary.BySourcesAgree.Yes | Should -Be 3
        $result.Summary.BySourcesAgree.No | Should -Be 3
    }
    It 'reports a directory candidate no other signal confirms, without counting it' {
        @($result.CandidateHosts).Host | Should -Be 'sqltest01.contoso.example'
        $result.Summary.CandidateHostsWithoutInstance | Should -Be 1
    }
    It 'counts by version, edition, domain and authentication mode' {
        $s = $result.Summary
        $s.ByVersion.'2022' | Should -Be 1
        $s.ByVersion.'2019' | Should -Be 2
        $s.ByVersion.'2016' | Should -Be 1
        $s.ByVersion.'2017' | Should -Be 1
        $s.ByVersion.Unknown | Should -Be 1
        $s.ByEdition.'Standard Edition (64-bit)' | Should -Be 2
        $s.ByEdition.Unknown | Should -Be 2
        $s.ByDomain.'contoso.example' | Should -Be 5
        $s.ByDomain.'child.contoso.example' | Should -Be 1
        $s.ByAuthenticationMode.Windows | Should -Be 2
        $s.ByAuthenticationMode.Mixed | Should -Be 2
        $s.ByAuthenticationMode.'Query Failed' | Should -Be 2
    }
    It 'reads logins by type, databases, last use and linked servers' {
        $r = Find-Row $rows 'csql01.child.contoso.example' 'SALES'
        $r.SqlLoginCount | Should -Be 2
        $r.WindowsLoginCount | Should -Be 1
        $r.LinkedServerCount | Should -Be 1
        $r.UserDatabaseCount | Should -Be 1
        (Find-Row $rows 'sql02.contoso.example' 'MSSQLSERVER').SaEnabled | Should -BeTrue
    }
    It 'applies the gate' {
        (Find-Row $rows 'sql01.contoso.example' 'MSSQLSERVER').Classification | Should -Be 'retain'
        (Find-Row $rows 'sql02.contoso.example' 'MSSQLSERVER').Classification | Should -Be 'retire'
        (Find-Row $rows 'sql02.contoso.example' 'REPORTS').Classification | Should -Be 'consolidate'
        (Find-Row $rows 'old01.contoso.example' 'MSSQLSERVER').Classification | Should -Be 'review'
    }
    It 'writes the CSV and JSON outputs under -OutputPath only' {
        $sql = Join-Path $out 'SQL'
        foreach ($f in 'SqlEstate.csv', 'SqlEstate.json', 'SqlEstateSummary.json', 'SqlSignals.json', 'SqlServiceAccounts.csv', 'SqlLogins.csv', 'SqlDatabases.csv', 'SqlLinkedServers.csv') {
            Join-Path $sql $f | Should -Exist
        }
        $csv = @(Import-Csv (Join-Path $sql 'SqlEstate.csv'))
        $csv | Should -HaveCount 6
        $csv[0].PSObject.Properties.Name | Should -Contain 'SourcesAgree'
        $doc = Get-Content -Raw (Join-Path $sql 'SqlEstate.json') | ConvertFrom-Json
        @($doc.InstanceAudits) | Should -HaveCount 6
        @($doc.InstanceAudits | Where-Object { $_.ServerName -eq 'sql02.contoso.example' -and $_.InstanceName -eq 'MSSQLSERVER' })[0].SQLLogins | Should -Contain 'app_user'
        @(Import-Csv (Join-Path $sql 'SqlLogins.csv')).LoginType | Should -Contain 'WINDOWS_GROUP'
    }
    It 'records a failed connection instead of stopping' {
        (Find-Row $rows 'old01.contoso.example' 'MSSQLSERVER').QueryStatus | Should -Be 'Query Failed'
    }
}

Describe 'Signals off' {
    It 'without a network probe, only the SPN and directory signals count toward agreement' {
        $r = Invoke-FMPSqlEstateDiscovery -OutputPath (Join-Path $TestDrive 'nonet') -AsOf $FMPAsOf
        $r.Summary.InstanceCount | Should -Be 4
        (Find-Row $r.Instances 'sql01.contoso.example' 'MSSQLSERVER').SourcesAgree | Should -Be 'Yes'
        Should -Invoke -CommandName Invoke-FMPUdpQuery -ModuleName FMPSqlEstate -Times 0 -Exactly -Scope It
    }
    It 'uses dbatools only when asked and installed' {
        Mock -ModuleName FMPSqlEstate Test-FMPCommand { $true } -ParameterFilter { $Name -eq 'Find-DbaInstance' }
        Mock -ModuleName FMPSqlEstate Find-DbaInstance { @([pscustomobject]@{ ComputerName = 'SQL01.contoso.example'; InstanceName = 'MSSQLSERVER'; Port = 1433 }) }
        $r = @(Find-FMPSqlBrowserInstance -ComputerName 'sql01.contoso.example' -UseDbatools)
        $r[0].Method | Should -Be 'dbatools Find-DbaInstance'
        Should -Invoke -CommandName Invoke-FMPUdpQuery -ModuleName FMPSqlEstate -Times 0 -Exactly -Scope It
    }
}
