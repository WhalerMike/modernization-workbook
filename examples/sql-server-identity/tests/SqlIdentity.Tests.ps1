#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
# Unit tests for the SQL Server identity kit, on the fictional contoso.example fixtures.
#     Invoke-Pester ./tests

BeforeAll {
    $script:Kit = Split-Path $PSScriptRoot -Parent
    Import-Module (Join-Path $Kit 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
    $script:Fx = Join-Path $PSScriptRoot 'fixtures'
    $script:Estate = Read-SqlJson (Join-Path $Fx 'estate/estate.json')
    $script:Day1 = Read-SqlJson (Join-Path $Fx 'audit-day1/audit.json')
    $script:Day30 = Read-SqlJson (Join-Path $Fx 'audit-day30/audit.json')
    $script:Arc = Read-SqlJson (Join-Path $Fx 'arc/arc.json')
    $script:Exc = (Read-SqlJson (Join-Path $Fx 'audit-day30/exceptions.json')).exceptions
    $script:Map = Import-Csv (Join-Path $Fx 'mapping/sqlprd01-mapping.csv')
    function script:Row($rows, $instance) { @($rows | Where-Object Instance -eq $instance)[0] }
}

Describe 'Get-SqlMajorVersion' {
    It 'maps product versions to release years' {
        Get-SqlMajorVersion '16.0.4135.4' | Should -Be 2022
        Get-SqlMajorVersion '17.0.1000.7' | Should -Be 2025
        Get-SqlMajorVersion '12.0.6449.1' | Should -Be 2014
        Get-SqlMajorVersion $null | Should -BeNullOrEmpty
    }
}

Describe 'Chapter 01: Get-SqlEstateClassification' {
    BeforeAll { $script:C = @(Get-SqlEstateClassification -Estate $Estate) }
    It 'classifies every instance' { $C.Count | Should -Be 8 }
    It 'retains a supported, used instance' { (Row $C SQLPRD01).Classification | Should -Be 'retain' }
    It 'consolidates a pre-2022 instance onto a shared target' { (Row $C SQLLEG03).Classification | Should -Be 'consolidate'; (Row $C SQLLEG03).Target | Should -Be 'shared' }
    It 'retires an instance whose every database is a zombie' { (Row $C SQLOLD05).Classification | Should -Be 'retire'; (Row $C SQLOLD05).EntersMigration | Should -Be 'no' }
    It 'keeps a vendor-locked instance in place' { (Row $C SQLFCI04).Classification | Should -Be 'retain' }
    It 'sends a collation conflict to a dedicated target' { (Row $C SQLLEG07).Target | Should -Be 'dedicated' }
    It 'never retains an instance it knows nothing about' { (Row $C SQLDEV08).Classification | Should -Be 'review' }
    It 'retires sooner with a lower zombie threshold' {
        $e = $Estate | ConvertTo-Json -Depth 8 | ConvertFrom-Json
        $e.instances[2].databases[0].lastAccessDays = 30
        (Row @(Get-SqlEstateClassification -Estate $e -ZombieDays 20) SQLLEG03).Classification | Should -Be 'retire'
    }
}

Describe 'Chapter 02: the authentication audit' {
    It 'counts usable logins by type, leaving out built-in principals' {
        $c = Get-SqlLoginCensus -Instance $Day1.instances[0]
        $c.U | Should -Be 1; $c.G | Should -Be 2; $c.S | Should -Be 2; $c.Usable | Should -Be 5
    }
    It 'flags an enabled sa as the highest-priority finding' {
        $f = @(Get-SqlAuthFinding -Instance $Day1.instances[0])
        ($f | Where-Object Finding -eq 'sa enabled').Severity | Should -Be 'highest'
    }
    It 'flags a usable SQL login as critical, but not a disabled sa' {
        $f = @(Get-SqlAuthFinding -Instance $Day1.instances[0])
        @($f | Where-Object { $_.Severity -eq 'critical' }).Detail | Should -Match 'payroll_report'
        @(Get-SqlAuthFinding -Instance $Day1.instances[1] | Where-Object Finding -like 'sa*').Count | Should -Be 0
    }
    It 'reports a built-in service account separately from a user account' {
        $i = $Day1.instances[0] | ConvertTo-Json -Depth 6 | ConvertFrom-Json; $i.serviceAccount = 'NT AUTHORITY\NETWORK SERVICE'
        (@(Get-SqlAuthFinding -Instance $i | Where-Object Finding -eq 'Service account')[0]).Detail | Should -Match 'built-in account'
    }
    It 'catches a mode changed without a restart' {
        @(Get-SqlAuthFinding -Instance $Day1.instances[0] | Where-Object Finding -eq 'Mode anomaly').Count | Should -Be 1
    }
    It 'puts a failover cluster instance in Category 3 before Arc is checked' {
        (@(Get-SqlAuthFinding -Instance $Day1.instances[2]) | Where-Object Finding -eq 'Arc-eligibility').Detail | Should -Match 'Category 3'
    }
}

Describe 'Chapter 03: Get-SqlArcCategory' {
    BeforeAll { $script:A = @(Get-SqlArcCategory -Audit $Day1 -Arc $Arc) }
    It 'gives Category 1 when the agent, extension and Entra configuration are all present' { (Row $A SQLPRD01).Category | Should -Be 1 }
    It 'gives Category 2 when Arc is missing' { (Row $A SQLPRD02).Category | Should -Be 2; (Row $A SQLPRD02).Next | Should -Match 'agent not installed' }
    It 'keeps a failover cluster instance in Category 3' { (Row $A SQLFCI04).Category | Should -Be 3 }
    It 'refuses results from any cloud but AzureCloud' {
        $bad = $Arc | ConvertTo-Json -Depth 6 | ConvertFrom-Json; $bad.environment = 'AzureUSGovernment'
        { Get-SqlArcCategory -Audit $Day1 -Arc $bad } | Should -Throw '*AzureCloud*'
    }
    It 'treats an unconfirmed Entra setting as not configured' {
        $u = $Arc | ConvertTo-Json -Depth 6 | ConvertFrom-Json; $u.sqlInstances[0].entraAuthentication.configured = $null
        (Row @(Get-SqlArcCategory -Audit $Day1 -Arc $u) SQLPRD01).Category | Should -Be 2
    }
}

Describe 'Chapter 04: the login plan and the parallel run' {
    BeforeAll { $script:P = New-SqlLoginPlan -Instance $Day1.instances[0] -Mapping $Map }
    It 'creates each Entra principal once, idempotently' {
        @($P.Create | Where-Object { $_ -match 'CREATE LOGIN \[SQL-Payroll-Users\]' }).Count | Should -Be 1
        @($P.Create | Where-Object { $_ -match '^IF NOT EXISTS' }).Count | Should -Be @($P.Create | Where-Object { $_ -match 'CREATE (LOGIN|USER)' }).Count
    }
    It 'mirrors server and database roles onto the Entra principals' {
        $P.Create | Should -Contain 'ALTER SERVER ROLE [sysadmin] ADD MEMBER [SQL-DBA-Admins];'
        $P.Create | Should -Contain 'ALTER ROLE [db_executor] ADD MEMBER [payroll-web-mi];'
    }
    It 'disables, never drops, and rolls back by enabling' {
        ($P.Cutover -join "`n") | Should -Not -Match 'DROP (LOGIN|USER)'
        @($P.Cutover | Where-Object { $_ -match 'ALTER LOGIN .* DISABLE' }).Count | Should -Be 2
        @($P.Rollback | Where-Object { $_ -match 'ENABLE;' }).Count | Should -Be 2
    }
    It 'denies CONNECT SQL to a Windows group instead of disabling it, and grants it back' {
        $P.Cutover | Should -Contain 'DENY CONNECT SQL TO [CONTOSO\PayrollUsers];  -- group: superseded by SQL-Payroll-Users'
        $P.Rollback | Should -Contain 'GRANT CONNECT SQL TO [CONTOSO\SQL-Admins];'
        $P.Cutover | Should -Contain 'ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\SQL-Admins];  -- DENY doesn''t bind sysadmin members'
        $P.Rollback | Should -Contain 'ALTER SERVER ROLE [sysadmin] ADD MEMBER [CONTOSO\SQL-Admins];'
        ($P.Cutover -join "`n") | Should -Not -Match 'ALTER LOGIN \[CONTOSO\\(PayrollUsers|SQL-Admins)\]'
    }
    It 'warns when a principal would hold more than one role, or sysadmin' {
        ($P.Warnings -join "`n") | Should -Match 'SQL-Payroll-Users would hold 3 database roles'
        ($P.Warnings -join "`n") | Should -Match 'SQL-DBA-Admins would hold db_owner or sysadmin'
    }
    It 'leaves sa and built-in principals out' { ($P.Create + $P.Cutover) -join "`n" | Should -Not -Match '\[sa\]|NT SERVICE' }
    It 'writes an unmapped login as UNRESOLVED instead of guessing' {
        $partial = @($Map | Where-Object WindowsLogin -ne 'payroll_report')
        $p2 = New-SqlLoginPlan -Instance $Day1.instances[0] -Mapping $partial
        $p2.Unresolved | Should -Be @('payroll_report')
        ($p2.Create -join "`n") | Should -Match '-- UNRESOLVED: payroll_report'
    }
    It 'escapes names in literals and identifiers' {
        $i = [pscustomobject]@{ name = 'X'; logins = @([pscustomobject]@{ name = "CONTOSO\o'brien]"; type = 'U'; isDisabled = $false; hasConnectSql = $true; serverRoles = @(); isSa = $false }); databases = @() }
        $p3 = New-SqlLoginPlan -Instance $i -Mapping @([pscustomobject]@{ WindowsLogin = "CONTOSO\o'brien]"; EntraPrincipal = "o'brien]@contoso.example" })
        ($p3.Create -join "`n") | Should -Match "N'o''brien\]@contoso.example'"
        ($p3.Create -join "`n") | Should -Match '\[o''brien\]\]@contoso.example\]'
    }
    It 'is not ready on day 1 and ready on day 30' {
        @(Test-SqlParallelRun -Instance $Day1.instances[0] -Mapping $Map | Where-Object Ready).Count | Should -Be 0
        @(Test-SqlParallelRun -Instance $Day30.instances[0] -Mapping $Map | Where-Object Ready).Count | Should -Be 4
    }
    It 'reports a login already disabled or denied as cut over' {
        @(Test-SqlParallelRun -Instance $Day30.instances[0] -Mapping $Map | Where-Object Why -like 'already cut over*').Count | Should -Be 4
    }
    It 'leaves local sessions out of the NTLM count' {
        $r = @(Test-SqlParallelRun -Instance $Day1.instances[0] -Mapping $Map | Where-Object Legacy -eq 'CONTOSO\SQL-Admins')[0]
        $r.LegacySessions | Should -Be 0
    }
}

Describe 'Chapter 05: Get-SqlGroupPattern' {
    BeforeAll { $script:G = @(Get-SqlGroupPattern -Groups (Read-SqlJson (Join-Path $Fx 'groups/groups.json')).groups) }
    It 'finds all four patterns' { @($G.Pattern | Sort-Object -Unique) | Should -Be @(1, 2, 3, 4) }
    It 'writes the dynamic rule on the HR organization code, enabled members only' {
        $t = (@($G | Where-Object Group -eq 'CONTOSO\PayrollUsers')[0]).Target
        $t | Should -Match 'extensionAttribute10'; $t | Should -Match 'accountEnabled -eq true'; $t | Should -Match 'userType -eq "Member"'
    }
    It 'puts a privileged role under PIM' { (@($G | Where-Object Group -eq 'CONTOSO\SQL-Admins')[0]).Target | Should -Match 'PIM' }
    It 'flags nesting' { (@($G | Where-Object Group -eq 'CONTOSO\HR-Analysts')[0]).Flags | Should -Match 'flatten' }
}

Describe 'Chapter 06: Get-SqlNtlmFinding' {
    BeforeAll {
        $script:N = @(Get-SqlNtlmFinding -Audit $Day1 -Estate $Estate -Spns (Read-SqlJson (Join-Path $Fx 'ntlm/spns.json')).spns `
            -LinkedServers (Read-SqlJson (Join-Path $Fx 'ntlm/linked-servers.json')).linkedServers -Clients (Read-SqlJson (Join-Path $Fx 'ntlm/clients.json')).clients)
    }
    It 'finds a missing SPN and writes setspn -S for the service account' { (@($N | Where-Object Pattern -eq 'Missing SPN')[0]).Fix | Should -Be 'setspn -S MSSQLSvc/sqlprd02.contoso.example:1433 CONTOSO\svc-sqlprd02' }
    It 'finds an SPN on the wrong account' { @($N | Where-Object Pattern -eq 'SPN on the wrong account').Instance | Should -Be 'SQLFCI04' }
    It 'finds a duplicate and removes it from the account that does not run the service' { (@($N | Where-Object Pattern -eq 'Duplicate SPN')[0]).Fix | Should -Be 'setspn -D MSSQLSvc/sqlprd06.contoso.example:1433 CONTOSO\SQLPRD06$' }
    It 'finds linked-server passthrough and non-domain clients' {
        @($N | Where-Object Pattern -eq 'Linked-server passthrough').Count | Should -Be 1
        @($N | Where-Object Pattern -eq 'Non-domain-joined client').Count | Should -Be 1
    }
    It 'expects the computer account to hold the SPN for a virtual service account' {
        $a = $Day1 | ConvertTo-Json -Depth 8 | ConvertFrom-Json
        $a.instances[1].serviceAccount = 'NT SERVICE\MSSQLSERVER'
        $spns = @([pscustomobject]@{ spn = 'MSSQLSvc/sqlprd02.contoso.example:1433'; account = 'CONTOSO\SQLPRD02$' })
        @(Get-SqlNtlmFinding -Audit $a -Estate $Estate -Spns $spns | Where-Object { $_.Instance -eq 'SQLPRD02' -and $_.Pattern -like '*SPN*' }).Count | Should -Be 0
    }
    It 'takes an empty SPN list' { { Get-SqlNtlmFinding -Audit $Day1 -Estate $Estate -Spns @() } | Should -Not -Throw }
    It 'raises nothing for a correct SPN' { @($N | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Pattern -like '*SPN*' }).Count | Should -Be 0 }
}

Describe 'Chapter 07: connection strings' {
    BeforeAll { $script:S = @(Find-SqlConnectionString -Path (Join-Path $Fx 'apps')) }
    It 'parses the authentication of a string' {
        (ConvertFrom-SqlConnectionString 'Server=s;Integrated Security=SSPI').Authentication | Should -Be 'windows'
        (ConvertFrom-SqlConnectionString 'Server=s;User ID=u;Password=p').Authentication | Should -Be 'sql-password'
        (ConvertFrom-SqlConnectionString 'Server=s;Authentication=Active Directory Default').Authentication | Should -Be 'entra'
    }
    It 'never returns a password' {
        ($S | ForEach-Object Masked) -join "`n" | Should -Not -Match 'Fict1onal'
        (ConvertFrom-SqlConnectionString 'Server=s;PWD=secret;UID=u').Masked | Should -Be 'Server=s;PWD=********;UID=u'
    }
    It 'finds every string, including the DSN' { $S.Count | Should -Be 5 }
    It 'puts a current Microsoft.Data.SqlClient on Arc in column A with the managed identity' {
        $r = @($S | Where-Object File -eq 'payroll-web/web.config')[0]
        $r.Column | Should -Be 'A'; $r.Target | Should -Be 'Authentication=Active Directory Managed Identity'
    }
    It 'suggests a service principal, not a managed identity, off Arc' {
        $tmp = Join-Path $TestDrive 'sp/y'; New-Item -ItemType Directory -Force $tmp | Out-Null
        Set-Content (Join-Path $tmp 'app.json') '{ "application": "y", "driver": "Microsoft.Data.SqlClient", "driverVersion": "5.2.2", "host": "on-premises", "vendor": false }'
        Set-Content (Join-Path $tmp 'a.config') '<add connectionString="Server=s;Integrated Security=SSPI" />'
        (@(Find-SqlConnectionString -Path (Join-Path $TestDrive 'sp'))[0]).Target | Should -Match '^Authentication=Active Directory Service Principal'
    }
    It 'marks a driver with no Entra path B and a vendor application C' {
        (@($S | Where-Object Application -eq 'claims-batch')[0]).Column | Should -Be 'B'
        (@($S | Where-Object Application -eq 'reports-odbc')[0]).Column | Should -Be 'B'
        (@($S | Where-Object Application -eq 'vendor-hr')[0]).Column | Should -Be 'C'
    }
    It 'reports a deprecated Entra password mode' {
        $tmp = Join-Path $TestDrive 'apps/x'; New-Item -ItemType Directory -Force $tmp | Out-Null
        Set-Content (Join-Path $tmp 'app.json') '{ "application": "x", "driver": "Microsoft.Data.SqlClient", "driverVersion": "5.2.2", "host": "on-premises", "vendor": false }'
        Set-Content (Join-Path $tmp 'a.config') '<add connectionString="Server=s;Authentication=Active Directory Password;User ID=u;Password=p" />'
        (@(Find-SqlConnectionString -Path (Join-Path $TestDrive 'apps'))[0]).Finding | Should -Be 'Deprecated Entra password mode'
    }
}

Describe 'Chapter 08: Get-SqlCertificateDependency' {
    BeforeAll { $script:K = @(Get-SqlCertificateDependency -Certs (Read-SqlJson (Join-Path $Fx 'certs/certs.json'))) }
    It 'names each class' { @($K.Class | Sort-Object -Unique).Count | Should -Be 4 }
    It 'finds the AD CS certificates' { @($K | Where-Object ADCS -eq 'yes').Count | Should -Be 4 }
    It 'warns inside the window' { (@($K | Where-Object Subject -eq 'CN=claims-signing')[0]).Warning | Should -Match '90 days' }
}

Describe 'Chapter 09: closure and drift' {
    BeforeAll { $script:R = @(Get-SqlClosureRecord -Audit $Day30 -Exceptions $Exc -Arc $Arc) }
    It 'meets every field it can show for the migrated instance' { @($R | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Status -eq 'NOT MET' }).Count | Should -Be 0 }
    It 'leaves the external fields external' { @($R | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Status -eq 'external' }).Count | Should -Be 2 }
    It 'needs Disable SQL Authentication on SQL Server 2025' {
        (@($R | Where-Object { $_.Instance -eq 'SQLPRD06' -and $_.Condition -eq '2 SQL logins refused' })[0]).Status | Should -Be 'NOT MET'
    }
    It 'does not count the break-glass group in the exception registry' {
        (@($R | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Condition -eq '1 No usable Windows login' })[0]).Status | Should -Be 'met'
    }
    It 'never assumes Disable SQL Authentication when SQL Server 2025 does not report it' {
        $a = $Day30 | ConvertTo-Json -Depth 8 | ConvertFrom-Json
        $a.instances[3].isExternalAuthenticationOnly = $null
        (@(Get-SqlClosureRecord -Audit $a | Where-Object { $_.Instance -eq 'SQLPRD06' -and $_.Condition -eq '2 SQL logins refused' })[0]).Status | Should -Be 'NOT MET'
    }
    It 'reports an instance that fell out of Arc Category 1 as drift' {
        $after = $Arc | ConvertTo-Json -Depth 6 | ConvertFrom-Json; $after.machines[0].status = 'Disconnected'
        @(Compare-SqlAuditRun -Before $Day1 -After $Day30 -Exceptions $Exc -BeforeArc $Arc -AfterArc $after | Where-Object Drift -eq 'Arc regressed').Instance | Should -Be 'SQLPRD01'
    }
    It 'ignores an expired exception' {
        $old = @([pscustomobject]@{ instance = '*'; login = 'CONTOSO\SQL-BreakGlass'; expires = '2026-01-01' })
        (@(Get-SqlClosureRecord -Audit $Day30 -Exceptions $old | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Condition -eq '1 No usable Windows login' })[0]).Status | Should -Be 'NOT MET'
    }
    It 'reports a new sysadmin Windows login as drift, but not an excepted one' {
        $d = @(Compare-SqlAuditRun -Before $Day1 -After $Day30 -Exceptions $Exc)
        $d.Count | Should -Be 1
        $d[0].Detail | Should -Match 'CONTOSO\\jdoe'
    }
}

Describe 'Evidence' {
    It 'hashes with LF line endings, whatever the file has' {
        $a = Join-Path $TestDrive 'a.txt'; $b = Join-Path $TestDrive 'b.txt'
        [IO.File]::WriteAllText($a, "x`r`ny`r`n"); [IO.File]::WriteAllText($b, "x`ny`n")
        Get-SqlFileHash $a | Should -Be (Get-SqlFileHash $b)
    }
    It 'records controls and KSIs in the manifest and catches a changed file' {
        $out = Join-Path $TestDrive 'run'
        $files = Write-SqlOutput -Rows @([pscustomobject]@{ A = 1 }) -OutputPath $out -Name t
        Write-SqlManifest -Step ESTATE -OutputPath $out -Files $files -AsOf 2026-11-20 | Out-Null
        $m = Read-SqlJson (Join-Path $out 'manifest.json')
        $m.controls | Should -Contain 'CM-8'; $m.ksis | Should -Contain 'KSI-PIY-GIV'
        @(Test-SqlManifest -OutputPath $out | Where-Object { -not $_.Match }).Count | Should -Be 0
        Add-Content (Join-Path $out 't.csv') 'tampered'
        @(Test-SqlManifest -OutputPath $out | Where-Object { -not $_.Match }).Count | Should -Be 1
    }
    It 'every step names controls, and every KSI it names is one the kit pairs' {
        $req = Get-SqlKitConfig requirements
        foreach ($p in $req.steps.PSObject.Properties) { @($p.Value.controls).Count | Should -BeGreaterThan 0 -Because $p.Name }
        foreach ($stage in 'test', 'production') { foreach ($s in $req.stages.$stage) { $req.steps.$s | Should -Not -BeNullOrEmpty -Because "$stage needs $s" } }
    }
    It 'chains records and refuses a stage with a step missing' {
        $chain = Join-Path $TestDrive 'chain.jsonl'
        $runs = foreach ($step in 'PRE', 'AUDIT', 'ARC', 'PLAN', 'DEPLOY', 'PARALLEL') {
            $o = Join-Path $TestDrive "r-$step"; $f = Write-SqlOutput -Rows @([pscustomobject]@{ S = $step }) -OutputPath $o -Name x
            $mode = if ($step -eq 'DEPLOY') { 'applied' } else { 'read-only' }
            Write-SqlManifest -Step $step -OutputPath $o -Files $f -AsOf 2026-11-20 -Mode $mode | Out-Null; $o
        }
        { Add-SqlEvidenceRecord -Stage test -Instance SQLPRD01 -RunPaths $runs[0..4] -ChainPath $chain -AsOf 2026-11-20 } | Should -Throw '*PARALLEL*'
        $r1 = Add-SqlEvidenceRecord -Stage test -Instance SQLPRD01 -RunPaths $runs -ChainPath $chain -AsOf 2026-11-20
        $r2 = Add-SqlEvidenceRecord -Stage test -Instance SQLPRD01 -RunPaths $runs -ChainPath $chain -AsOf 2026-11-21
        $r2.Previous | Should -Be $r1.Record
    }
    It 'refuses to seal a dry-run deployment unless it is a rehearsal' {
        $chain = Join-Path $TestDrive 'chain2.jsonl'
        $runs = foreach ($step in 'PRE', 'AUDIT', 'ARC', 'PLAN', 'DEPLOY', 'PARALLEL') {
            $o = Join-Path $TestDrive "d-$step"; $f = Write-SqlOutput -Rows @([pscustomobject]@{ S = $step }) -OutputPath $o -Name x
            $mode = if ($step -eq 'DEPLOY') { 'dry run' } else { 'read-only' }
            Write-SqlManifest -Step $step -OutputPath $o -Files $f -AsOf 2026-11-20 -Mode $mode | Out-Null; $o
        }
        { Add-SqlEvidenceRecord -Stage test -Instance SQLPRD01 -RunPaths $runs -ChainPath $chain -AsOf 2026-11-20 } | Should -Throw '*Rehearsal*'
        (Add-SqlEvidenceRecord -Stage test -Instance SQLPRD01 -RunPaths $runs -ChainPath $chain -AsOf 2026-11-20 -Rehearsal).Stage | Should -Be 'test (rehearsal)'
        (@(Get-Content $chain)[-1] | ConvertFrom-Json).rehearsal | Should -BeTrue
    }
}

Describe 'Every script parses' {
    It '<_>' -ForEach @(Get-ChildItem (Split-Path $PSScriptRoot -Parent) -Recurse -Include *.ps1, *.psm1 | Where-Object FullName -notmatch '[\/]out[\/]' | ForEach-Object FullName) {
        $errors = $null; [System.Management.Automation.Language.Parser]::ParseFile($_, [ref]$null, [ref]$errors) | Out-Null
        $errors | Should -BeNullOrEmpty
    }
}

Describe 'Entry scripts and the runbook (dry runs on the fixtures)' {
    BeforeAll {
        $script:Out = Join-Path $TestDrive 'out'
        Push-Location $Kit
    }
    AfterAll { Pop-Location }
    It 'writes the same estate files on every run' {
        & ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath (Join-Path $Out 'e1') 6>$null
        & ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath (Join-Path $Out 'e2') 6>$null
        (Get-Content -Raw (Join-Path $Out 'e1/manifest.json')) | Should -Be (Get-Content -Raw (Join-Path $Out 'e2/manifest.json'))
    }
    It 'writes relative to the PowerShell location, not the process folder' {
        $here = Join-Path $TestDrive 'cd-test'; New-Item -ItemType Directory -Force $here | Out-Null
        Push-Location $here
        try { & (Join-Path $Kit 'Invoke-SqlEstate.ps1') -EstatePath (Join-Path $Kit 'tests/fixtures/estate/estate.json') -OutputPath out/estate 6>$null }
        finally { Pop-Location }
        Test-Path (Join-Path $here 'out/estate/manifest.json') | Should -BeTrue
    }
    It 'refuses to deploy a plan whose hash was not approved' {
        & ./deploy/New-SqlDeploymentPlan.ps1 -SettingsPath deploy/settings.test.example.json -OutputPath (Join-Path $Out 'plan') 6>$null
        { & ./deploy/Invoke-SqlDeploy.ps1 -PlanPath (Join-Path $Out 'plan') -Phase create -ApprovedHash ('0' * 64) -OutputPath (Join-Path $Out 'deploy') 6>$null } | Should -Throw '*Refused*'
    }
    It 'dry-runs an approved plan without connecting' {
        $h = (Read-SqlJson (Join-Path $Out 'plan/plan.json')).phases.cutover.sha256
        & ./deploy/Invoke-SqlDeploy.ps1 -PlanPath (Join-Path $Out 'plan') -Phase cutover -ApprovedHash $h -OutputPath (Join-Path $Out 'deploy') 6>$null
        (Read-SqlJson (Join-Path $Out 'deploy/manifest.json')).mode | Should -Be 'dry run'
    }
    It 'fails production preflight until the test stage is sealed' {
        $s = Read-SqlJson deploy/settings.production.example.json
        $s.chainPath = (Join-Path $Out 'empty/chain.jsonl')
        $p = Join-Path $Out 'prod.json'; $s | ConvertTo-Json | Set-Content $p
        & pwsh -NoProfile -File ./deploy/Test-SqlPreflight.ps1 -SettingsPath $p -OutputPath (Join-Path $Out 'pre') | Out-Null
        $LASTEXITCODE | Should -Be 1
        (Read-SqlJson (Join-Path $Out 'pre/preflight.json') | Where-Object Check -eq 'PF-06').Result | Should -Be 'FAIL'
    }
}
