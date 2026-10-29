BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') -Force
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPTransactionProfile') -Force
    $script:Captures = Join-Path $FMPTxPath 'captures'
}

Describe 'Counting round trips in a capture export' {
    It 'counts answered requests and new connections, and the handshake time' {
        $m = ConvertFrom-FMPPacketCapture -Path (Join-Path $Captures 'payroll-submit-baseline.tsv') -ServerAddress 10.0.20.15 -ServerPort 1433 -Application Payroll -Transaction 'Submit timesheet'
        $m.DataTurns | Should -Be 12
        $m.NewConnections | Should -Be 1
        $m.RoundTrips | Should -Be 13
        $m.MeasuredRttMs | Should -Be 0.4
        $m.Method | Should -Be 'PacketCapture'
        $m.Phase | Should -Be 'Baseline'
        $m.Warnings | Should -BeNullOrEmpty
    }
    It 'treats a request or a response split over several packets as one round trip, and ignores other servers' {
        $m = ConvertFrom-FMPPacketCapture -Path (Join-Path $Captures 'payroll-submit-baseline.tsv') -ServerAddress 10.0.20.15 -ServerPort 1433
        $m.Connections | Should -Be 1
        $m.Packets | Should -Be 52
    }
    It 'reads a comma-separated export with True/False flags and no stream numbers' {
        $m = ConvertFrom-FMPPacketCapture -Path (Join-Path $Captures 'payroll-submit-reduced.csv') -ServerAddress 10.0.20.15 -ServerPort 1433 -Phase Reduced
        $m.RoundTrips | Should -Be 4
        $m.Connections | Should -Be 2
        $m.NewConnections | Should -Be 0
        $m.MeasuredRttMs | Should -BeNullOrEmpty
        $m.Warnings | Should -Match 'already open'
    }
    It 'divides by the repetitions in the capture' {
        (ConvertFrom-FMPPacketCapture -Path (Join-Path $Captures 'payroll-submit-reduced.csv') -ServerAddress 10.0.20.15 -ServerPort 1433 -Repetitions 2).RoundTrips | Should -Be 2
    }
    It 'filters to one client when asked' {
        { ConvertFrom-FMPPacketCapture -Path (Join-Path $Captures 'payroll-submit-reduced.csv') -ServerAddress 10.0.20.15 -ServerPort 1433 -ClientAddress 10.9.9.9 } | Should -Throw '*no packets between 10.9.9.9*'
    }
    It 'refuses a file that is not a field export, and names only the file' {
        $bad = Join-Path $TestDrive 'wireshark.csv'
        [System.IO.File]::WriteAllText($bad, "No.,Time,Source,Destination`n1,0.0,a,b`n")
        { ConvertFrom-FMPPacketCapture -Path $bad -ServerAddress 10.0.20.15 -ServerPort 1433 } | Should -Throw '*no column for*'
        { ConvertFrom-FMPPacketCapture -Path (Join-Path $TestDrive 'gone.tsv') -ServerAddress 10.0.20.15 -ServerPort 1433 } | Should -Throw 'gone.tsv was not found.'
    }
}

Describe 'Reading the catalog' {
    BeforeAll { $script:Cat = @(Get-FMPTransactionCatalog -Path (Join-Path $FMPTxPath 'TransactionCatalog.csv')) }
    It 'reads every row and maps the techniques to Book 01''s names' {
        $Cat | Should -HaveCount 6
        $Cat[0].Techniques | Should -Be @('Aggregation', 'Batching')
        $Cat[2].Techniques | Should -Be @('ConnectionPooling')
        $Cat[4].UnknownTechniques | Should -Be @('Sharding')
    }
    It 'resolves capture paths against the catalog folder' {
        $Cat[0].BaselineCapture | Should -Be (Join-Path $Captures 'payroll-submit-baseline.tsv')
    }
    It 'flags a missing budget and a duplicate row' {
        $Cat[4].Problems | Should -Match 'BudgetMs is missing'
        $Cat[5].Duplicate | Should -BeTrue
    }
}

Describe 'Measuring from SQL Server connection counters' {
    BeforeAll {
        # Two windows of four snapshots each (first, two polls, last). In the first, connection
        # A makes 10 reads and B opens in the window, makes 9 reads and closes before the end;
        # another host's connection C is ignored. In the second, A makes 8 reads.
        $global:FMPTxSnaps = @(
            @{ A = 100; B = $null; C = 1 }, @{ A = 103; B = 5; C = 50 }, @{ A = 106; B = 9; C = 90 }, @{ A = 110; B = $null; C = 99 },
            @{ A = 110; B = $null; C = 1 }, @{ A = 112; B = $null; C = 2 }, @{ A = 115; B = $null; C = 3 }, @{ A = 118; B = $null; C = 4 })
        $global:FMPTxCall = 0
        $global:FMPTxOpen = 0
        Mock -ModuleName FMPTransactionProfile Get-FMPSqlSessionCounter {
            $s = $global:FMPTxSnaps[$global:FMPTxCall]; $global:FMPTxCall++
            $start = [datetime]'2026-10-27T10:00:00'
            $rows = @([pscustomobject]@{ connection_id = 'a'; connect_time = $start.AddHours(-1); num_reads = $s.A; num_writes = $s.A; host_name = 'APP07'; program_name = 'Payroll Client'; login_name = 'CORP\svc-payroll'; client_net_address = '10.0.30.40' })
            if ($null -ne $s.B) { $rows += [pscustomobject]@{ connection_id = 'b'; connect_time = $start.AddSeconds(1); num_reads = $s.B; num_writes = $s.B; host_name = 'APP07'; program_name = 'Payroll Client'; login_name = 'CORP\svc-payroll'; client_net_address = '10.0.30.40' } }
            $rows += [pscustomobject]@{ connection_id = 'c'; connect_time = $start.AddHours(-2); num_reads = $s.C; num_writes = $s.C; host_name = 'APP09'; program_name = 'Reports'; login_name = 'CORP\svc-rpt'; client_net_address = '10.0.30.41' }
            [pscustomobject]@{ ServerTime = $start; Connections = $rows }
        }
        # Open for two polls, then closed, in each window.
        Mock -ModuleName FMPTransactionProfile Test-FMPTxWindowOpen { $global:FMPTxOpen++; ($global:FMPTxOpen % 3) -ne 0 }
        Mock -ModuleName FMPTransactionProfile Write-Host { }
        $out = Join-Path $TestDrive 'dmv'
        $script:M = Measure-FMPSqlRoundTrip -OutputPath $out -ServerName sql01 -InstanceName HR -Application Payroll -Transaction 'Submit timesheet' `
            -HostName APP07 -Repetitions 2 -DurationSeconds 1 -IntervalMilliseconds 1 -AsOf ([datetime]::SpecifyKind([datetime]'2026-10-27T10:05:00', 'Utc'))
    }
    It 'counts reads on the matching connections, plus one per connection opened in the window' {
        $M.RoundTripsPerRepetition | Should -Be @(20, 8)
        $M.RoundTrips | Should -Be 14
        $M.Windows[0].NewConnections | Should -Be 1
        $M.Method | Should -Be 'SqlDmv'
        $M.Store | Should -Be 'sql01\HR'
    }
    It 'says when a connection closed between polls, and when the repetitions disagree' {
        $M.Windows[0].ClosedDuringWindow | Should -Be 1
        ($M.Warnings -join ' ') | Should -Match 'lower bound'
        ($M.Warnings -join ' ') | Should -Match 'disagree'
    }
    It 'writes the measurement under transaction-profiles\measurements' {
        @(Get-ChildItem -Path (Join-Path $TestDrive 'dmv\transaction-profiles\measurements') -Filter '*.json').Name | Should -Be 'payroll--submit-timesheet--baseline--sqldmv-20261027100500.json'
    }
    It 'refuses to count every session on the instance' {
        { Measure-FMPSqlRoundTrip -OutputPath (Join-Path $TestDrive 'x') -ServerName sql01 -Application a -Transaction b } | Should -Throw '*Name the application*'
    }
    It 'sends only the SQL module''s SELECT' {
        $q = (Get-FMPSqlQueryCatalog).Sessions
        Test-FMPSelectOnly -Query $q | Should -BeTrue
        $q | Should -Match 'sys\.dm_exec_connections'
    }
}

Describe 'Profiles and the separation gate' {
    BeforeAll {
        $script:Out = Join-Path $TestDrive 'run'
        $script:R = Invoke-FMPTransactionProfile -OutputPath $Out -CatalogPath (Join-Path $FMPTxPath 'TransactionCatalog.csv') -MeasurementPath (Join-Path $FMPTxPath 'measurements') -AsOf $FMPAsOf
        function Get-Profile($Txn) { @($R.Profiles | Where-Object Transaction -eq $Txn)[0] }
    }
    It 'profiles every distinct catalog transaction' {
        $R.Profiles | Should -HaveCount 5
    }
    It 'passes a transaction measured within budget after reduction' {
        $p = Get-Profile 'Submit timesheet'
        $p.BaselineRoundTrips | Should -Be 13
        $p.ReducedRoundTrips | Should -Be 4
        $p.RoundTripsAllowed | Should -Be 10
        $p.Status | Should -Be 'Reduced'
        $p.Gate | Should -Be 'Pass'
        $p.ReducedWaitAtTargetMs | Should -Be 120
        $p.CurrentRttMs | Should -Be 0.4
        $p.CurrentRttSource | Should -Be 'PacketCapture handshake'
    }
    It 'passes a declared measurement already within budget' {
        $p = Get-Profile 'Run pay report'
        $p.Status | Should -Be 'WithinBudget'
        $p.BaselineMethod | Should -Be 'APM trace'
        $p.AddedBySeparationMs | Should -Be 177
    }
    It 'blocks an unreduced transaction and says how many round trips to remove' {
        $p = Get-Profile 'Open case'
        $p.Status | Should -Be 'NotReduced'
        $p.RoundTripsAllowed | Should -Be 16
        $p.RoundTripsToRemove | Should -Be 26
        $p.BaselineWaitAtTargetMs | Should -Be 1260
    }
    It 'ignores an estimate, so the transaction is not profiled' {
        $p = Get-Profile 'Search cases'
        $p.Status | Should -Be 'NotProfiled'
        $p.BaselineRoundTrips | Should -BeNullOrEmpty
    }
    It 'blocks a row with no budget' {
        (Get-Profile 'Renew licence').Status | Should -Be 'Incomplete'
    }
    It 'clears an application only when every transaction passes' {
        $g = @{}; foreach ($x in $R.Gate) { $g[$x.Application] = $x }
        $g['Payroll'].Gate | Should -Be 'Pass'
        $g['Case management'].Gate | Should -Be 'Blocked'
        $g['Case management'].BlockedTransactions | Should -Match 'Open case \(NotReduced\)'
        $g['Case management'].MostRoundTripsToRemove | Should -Be 26
        $g['Licensing'].Gate | Should -Be 'Blocked'
    }
    It 'flags what a reviewer must act on' {
        $f = $R.Findings
        @($f | Where-Object { $_.Severity -eq 'High' -and $_.Transaction -eq 'Search cases' }) | Should -HaveCount 1
        @($f | Where-Object Finding -eq 'Round trips entered without a measurement').Transaction | Should -Be 'Search cases'
        @($f | Where-Object Finding -eq 'Connection pooling is the only technique').Transaction | Should -Be 'Open case'
        @($f | Where-Object Finding -eq 'Unknown technique').Detail | Should -Match 'Sharding'
        @($f | Where-Object Finding -eq 'Capture not read').Detail | Should -Be 'Baseline: missing.tsv was not found.'
        @($f | Where-Object Finding -eq 'Listed twice in the catalog') | Should -HaveCount 1
        @($f | Where-Object Finding -like 'Measurement caveat (SqlDmv*').Transaction | Should -Be 'Open case'
    }
    It 'writes the profile files, one file per application, and the capture measurements' {
        $tp = Join-Path $Out 'transaction-profiles'
        foreach ($n in 'TransactionProfiles.csv', 'SeparationGate.csv', 'Measurements.csv', 'TransactionFindings.csv', 'TransactionProfiles.json', 'TransactionSummary.json') { Join-Path $tp $n | Should -Exist }
        @(Get-ChildItem (Join-Path $tp 'applications')).Name | Sort-Object | Should -Be @('case-management.json', 'licensing.json', 'payroll.json')
        @(Get-ChildItem (Join-Path $tp 'measurements')).Name | Sort-Object | Should -Be @('payroll--submit-timesheet--baseline--capture.json', 'payroll--submit-timesheet--reduced--capture.json')
        $s = Get-Content -Raw (Join-Path $tp 'TransactionSummary.json') | ConvertFrom-Json
        $s.ApplicationsPassing | Should -Be 1
        $s.ApplicationsBlocked | Should -Be 2
    }
    It 'writes no folder paths from the assessment host' {
        $all = (Get-ChildItem -Path (Join-Path $Out 'transaction-profiles') -Recurse -File | ForEach-Object { Get-Content -Raw $_.FullName }) -join "`n"
        $all | Should -Not -Match ([regex]::Escape($FMPTxPath))
        $all | Should -Not -Match ([regex]::Escape(($FMPTxPath -replace '\\', '\\')))
    }
    It 'gives the same result when run again into the same folder' {
        $again = Invoke-FMPTransactionProfile -OutputPath $Out -CatalogPath (Join-Path $FMPTxPath 'TransactionCatalog.csv') -MeasurementPath (Join-Path $FMPTxPath 'measurements') -AsOf $FMPAsOf
        $again.Measurements.Count | Should -Be $R.Measurements.Count
    }
    It 'writes a catalog template when there is no catalog' {
        $t = Invoke-FMPTransactionProfile -OutputPath (Join-Path $TestDrive 'empty')
        $t.Summary.Status | Should -Be 'NoCatalog'
        $cols = (Get-Content (Join-Path $TestDrive 'empty\transaction-profiles\TransactionCatalog.template.csv') -TotalCount 1) -replace '"', ''
        $cols | Should -Be 'Application,Transaction,Store,StoreAddress,StorePort,ClientAddress,CurrentRttMs,TargetRttMs,BudgetMs,Techniques,BaselineCapture,ReducedCapture,CaptureRepetitions,BaselineRoundTrips,ReducedRoundTrips,DeclaredMethod,Owner,Notes'
    }
    It 'never names a reserved Windows file' {
        & (Get-Module FMPTransactionProfile) { ConvertTo-FMPTxFileName 'CON' } | Should -Be 'app-con'
        & (Get-Module FMPTransactionProfile) { ConvertTo-FMPTxFileName 'Lpt1.Billing' } | Should -Be 'app-lpt1.billing'
    }
}
