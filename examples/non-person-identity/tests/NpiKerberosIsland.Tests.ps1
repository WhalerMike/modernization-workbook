#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 06: the Kerberos accounts (gMSAs, dMSAs and the island), the plan and its separate write
# path, against Chapter 01's register of the fictional estate and the fake Active Directory.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Estate = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Krb = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch06/ad-kerberos.json')).Path
    $script:Inputs = Join-Path $PSScriptRoot 'fixtures/ch06/inputs'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-krb-{0}" -f [guid]::NewGuid())
    $script:InvRun = Join-Path $script:Tmp 'inventory'
    $null = & (Join-Path $script:Root 'Invoke-NpiInventory.ps1') -Cloud gcc -FixturePath $script:Estate -OutputPath $script:InvRun
    $script:Register = Import-NpiKrbRegister -RunPath $script:InvRun
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Tenant = $script:Register.Manifest.tenantId
    $script:Domain = 'corp.contoso.example'
    function New-TestFake([string]$KrbPath = $script:Krb, [switch]$AllowWrite) { New-NpiKrbFixtureAdInvoker -EstatePath $script:Estate -KerberosPath $KrbPath -AllowWrite:$AllowWrite }
    function New-TestKrb([scriptblock]$Mutate) {
        # A copy of ad-kerberos.json changed by $Mutate (a hashtable), for one test.
        $j = Get-Content $script:Krb -Raw | ConvertFrom-Json -AsHashtable -Depth 50
        & $Mutate $j
        $p = Join-Path $script:Tmp ("krb-{0}.json" -f [guid]::NewGuid()); New-Item -ItemType Directory -Force $script:Tmp | Out-Null
        [IO.File]::WriteAllText($p, ($j | ConvertTo-Json -Depth 50)); $p
    }
    function Get-TestInputs([scriptblock]$Mutate) {
        $i = Import-NpiKrbInput -InputPath $script:Inputs
        if ($Mutate) { & $Mutate $i }
        $i
    }
    function Invoke-TestCheck($Inputs = (Get-TestInputs), [string]$KrbPath = $script:Krb, [object[]]$Rows = $script:Register.Rows) {
        $fake = New-TestFake -KrbPath $KrbPath
        $reader = New-NpiKrbReader -AdInvoke $fake.Invoke
        $state = Read-NpiKrbDomain -Reader $reader -Rows $Rows -Dispositions $Inputs.Dispositions -Domain $script:Domain -AsOf $script:AsOf
        $r = Test-NpiKerberosIsland -Rows $Rows -Domain $state -Inputs $Inputs -AsOf $script:AsOf -DomainName $script:Domain -Cloud gcc -TenantId $script:Tenant -RegisterSha256 $script:Register.Sha256
        $r | Add-Member -NotePropertyName Fake -NotePropertyValue $fake -PassThru | Add-Member -NotePropertyName Reader -NotePropertyValue $reader -PassThru
    }
    function Set-Row($Inputs, [string]$Name, [hashtable]$Values) { $row = @($Inputs.Dispositions | Where-Object SamAccountName -EQ $Name)[0]; foreach ($k in $Values.Keys) { $row.$k = $Values[$k] } }
    function Save-TestPlan($Plan) {
        New-Item -ItemType Directory -Force $script:Tmp | Out-Null
        $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid())
        Write-NpiJson -Path $p -Value $Plan
        [pscustomobject]@{ Path = $p; Sha = Get-NpiFileHash -Path $p }
    }
    function New-TestWriter([string]$KrbPath = $script:Krb) { $f = New-TestFake -KrbPath $KrbPath -AllowWrite; [pscustomobject]@{ Fake = $f; Writer = (New-NpiKrbWriter -TenantId $script:Tenant -Domain $script:Domain -AdInvoke $f.Invoke) } }
    $script:Run = Invoke-TestCheck
    function Get-Rule([string]$Rule) { @($script:Run.Findings | Where-Object Rule -EQ $Rule) }
    function Get-Act([string]$Account) { @($script:Run.Plan.actions | Where-Object Account -EQ $Account) }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The call list (config/calls-ch06.json)' {
    It 'every task''s declared rights are exactly the union of its calls' {
        $list = Get-NpiKrbCallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            @($list.tasks[$task].adRights | Sort-Object) | Should -Be @($calls | ForEach-Object { $_.adRight } | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].graphPermissions) | Should -Be @(@($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions }) | Sort-Object -Unique) -Because "task $task"
            @($list.tasks[$task].azureRoles) | Should -Be @(@($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole }) | Sort-Object -Unique) -Because "task $task"
        }
    }
    It 'the read task runs only Get-AD* cmdlets; the write task never removes, uninstalls, undoes or resets' {
        $list = Get-NpiKrbCallList
        foreach ($c in @($list.calls | Where-Object { $_.tasks -contains 'kerberos-island' })) { $c.cmdlet | Should -Match '^Get-AD'; $c.method | Should -Be 'READ' }
        foreach ($c in $list.calls) { $c.cmdlet | Should -Not -Match '^(Remove|Uninstall|Undo|Reset|Clear)-' }
        foreach ($c in @($list.calls | Where-Object method -EQ 'WRITE')) { @($c.allowedParams).Count | Should -BeGreaterThan 0; $c.tasks | Should -Be @('kerberos-apply') }
    }
    It 'every call names a Learn page and a stage, and the call ids don''t collide with calls.json' {
        $ours = Get-NpiKrbCall
        foreach ($c in $ours) { $c.learn | Should -Match '^https://learn\.microsoft\.com/'; $c.stage | Should -Not -BeNullOrEmpty }
        $theirs = @((Get-NpiCallList).calls.id) + @((Get-NpiCallList).tasks.Keys)
        foreach ($id in @($ours.id) + @((Get-NpiKrbCallList).tasks.Keys)) { $theirs | Should -Not -Contain $id }
    }
    It 'the KDS read is a delegated read of the root key container, not the default read' {
        (Get-NpiKrbRequiredRight -Task kerberos-island).AdRights | Should -HaveCount 2
        (Get-NpiKrbCall -Id krb-kds-root-keys)[0].adRight | Should -Match 'never msKds-RootKeyData'
    }
    It 'a write task can''t have a reader, and the reader refuses an undeclared or non-Get call' {
        { New-NpiKrbReader -Task kerberos-apply -AdInvoke { } } | Should -Throw '*New-NpiKrbWriter*'
        $r = New-NpiKrbReader -AdInvoke { }
        { Invoke-NpiKrbAdRead -Client $r -CallId 'krb-new-gmsa' } | Should -Throw '*Undeclared*'
        $bad = [pscustomobject]@{ Task = 'x'; Calls = @(@{ id = 'w'; method = 'READ'; cmdlet = 'Set-ADServiceAccount' }); AdInvoke = { }; Evidence = [Collections.Generic.List[object]]::new() }
        { Invoke-NpiKrbAdRead -Client $bad -CallId 'w' } | Should -Throw '*only declared Get-AD*'
    }
}

Describe 'The inputs' {
    It 'refuses a register that changed since Chapter 01' {
        $copy = Join-Path $script:Tmp 'tampered'; Copy-Item -Recurse $script:InvRun $copy
        Add-Content -LiteralPath (Join-Path $copy 'register.json') -Value ' '
        { Import-NpiKrbRegister -RunPath $copy } | Should -Throw '*doesn''t match its manifest*'
    }
    It 'refuses an end state that isn''t AdRetired or KerberosIsland, and has no default' {
        $dir = Join-Path $script:Tmp ("in-{0}" -f [guid]::NewGuid()); Copy-Item -Recurse $script:Inputs $dir
        $e = Get-Content (Join-Path $dir 'end-state.json') -Raw | ConvertFrom-Json -AsHashtable; $e.d11.decision = 'Undecided'
        [IO.File]::WriteAllText((Join-Path $dir 'end-state.json'), ($e | ConvertTo-Json -Depth 10))
        { Import-NpiKrbInput -InputPath $dir } | Should -Throw '*AdRetired or KerberosIsland*'
        Remove-Item (Join-Path $dir 'end-state.json')
        { Import-NpiKrbInput -InputPath $dir } | Should -Throw '*Missing reviewed input*'
    }
}

Describe 'The KDS root key, read-only' {
    It 'reads only that a key exists and when it became usable, never the key data' {
        $c = @($script:Run.Fake.Calls | Where-Object Cmdlet -EQ 'Get-ADObject')
        $c | Should -HaveCount 1
        @($c[0].Params.Properties) | Should -Be @('msKds-UseStartTime', 'msKds-CreateTime')
        $c[0].Params.SearchBase | Should -Be 'CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,CN=Configuration,DC=corp,DC=contoso,DC=example'
        $script:Run.Plan.kds | Should -Be 'Ready'
    }
    It 'NPI-KRB-01: no root key blocks every gMSA and dMSA creation, and the code never creates one' {
        $p = New-TestKrb { param($j) $j.kdsRootKeys = @() }
        $r = Invoke-TestCheck -KrbPath $p
        (@($r.Findings | Where-Object Rule -EQ 'NPI-KRB-01'))[0].Severity | Should -Be 'Finding'
        @($r.Plan.actions | Where-Object { $_.Action -in 'CreateGmsa', 'CreateDmsa' }) | Should -HaveCount 0
        @($r.Plan.actions | Where-Object { $_.Action -eq 'Blocked' -and $_.Reason -like 'KDS root key Missing*' }) | Should -HaveCount 2
        @(Get-NpiKrbCall | Where-Object cmdlet -Like '*Kds*') | Should -HaveCount 0
    }
    It 'NPI-KRB-01 Warn: a key usable less than 10 hours ago waits for replication' {
        $p = New-TestKrb { param($j) $j.kdsRootKeys[0]['msKds-UseStartTime'] = '2026-10-30T06:00:00Z' }
        $r = Invoke-TestCheck -KrbPath $p
        (@($r.Findings | Where-Object Rule -EQ 'NPI-KRB-01'))[0].Severity | Should -Be 'Warn'
        $r.Plan.kds | Should -Be 'Replicating'
    }
}

Describe 'The dispositions' {
    It 'scopes enabled traditional accounts with an SPN, MSAs, gMSAs and dMSAs' {
        @(Get-NpiKrbScope -Rows $script:Register.Rows).Name | Sort-Object | Should -Be @('dmsa-hrsync$', 'gmsa-ops$', 'gmsa-sql$', 'gmsa-web$', 'msa-print01$', 'svc-hrsync', 'svc-intranet', 'svc-sqlprod', 'svc-webfront')
    }
    It 'NPI-KRB-02: a Kerberos account with no disposition gets no action but a finding' {
        $i = Get-TestInputs { param($x) $x.Dispositions = @($x.Dispositions | Where-Object SamAccountName -NE 'gmsa-web$') }
        $r = Invoke-TestCheck -Inputs $i
        (@($r.Findings | Where-Object Rule -EQ 'NPI-KRB-02')).ObjectKey | Should -Be 'gmsa-web$'
        (@($r.Plan.actions | Where-Object Account -EQ 'gmsa-web$' | Where-Object Action -NE 'SetRetrievers'))[0].Action | Should -Be 'AwaitDisposition'
    }
    It 'NPI-KRB-09: SQL Server accounts are handed to the Data Platform plan' {
        @(Get-Rule 'NPI-KRB-09').ObjectKey | Sort-Object | Should -Be @('gmsa-sql$', 'svc-sqlprod')
        (Get-Act 'svc-sqlprod')[0].Action | Should -Be 'HandedOff'
    }
    It 'NPI-KRB-08: a managed service account in a privileged group is reported' {
        (Get-Rule 'NPI-KRB-08').ObjectKey | Should -Be 'gmsa-ops$'
    }
}

Describe 'gMSAs: MSAs upgraded, traditional accounts moved' {
    It 'an MSA is upgraded to a new gMSA with its reviewed retrievers and AES256' {
        $a = (Get-Act 'msa-print01$')[0]
        $a.Action | Should -Be 'CreateGmsa'
        $a.Params.Name | Should -Be 'gmsa-print'
        $a.Params.DNSHostName | Should -Be 'gmsa-print.corp.contoso.example'
        @($a.Params.PrincipalsAllowedToRetrieveManagedPassword) | Should -Be @('CN=PRINT01,OU=Servers,DC=corp,DC=contoso,DC=example')
        $a.Params.KerberosEncryptionType | Should -Be 'AES256'
    }
    It 'an IIS application pool''s account gets a gMSA whose retrievers are a group' {
        (Get-Act 'svc-intranet')[0].Params.PrincipalsAllowedToRetrieveManagedPassword | Should -Be 'CN=GG-gMSA-Intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example'
    }
    It 'a gMSA with no reviewed retrievers is blocked, not created open' {
        $i = Get-TestInputs { param($x) $x.Retrievers.Remove('gmsa-print$') }
        $r = Invoke-TestCheck -Inputs $i
        (@($r.Plan.actions | Where-Object Account -EQ 'msa-print01$'))[0].Action | Should -Be 'Blocked'
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'msa-print01$' }) | Should -HaveCount 1
    }
    It 'after the gMSA exists: wait for the host change, then the 30-day parallel run, then disable the old account (never delete)' {
        $p = New-TestKrb { param($j) }
        $w = New-TestWriter
        & $w.Fake.Invoke 'New-ADServiceAccount' @{ Name = 'gmsa-print'; DNSHostName = 'gmsa-print.corp.contoso.example'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=PRINT01,OU=Servers,DC=corp,DC=contoso,DC=example'); KerberosEncryptionType = 'AES256' }
        $est = Join-Path $script:Tmp ("estate-{0}.json" -f [guid]::NewGuid()); [IO.File]::WriteAllText($est, ($w.Fake.Estate | ConvertTo-Json -Depth 50))
        $check = {
            param($Inputs)
            $f = New-NpiKrbFixtureAdInvoker -EstatePath $est -KerberosPath $p
            $rd = New-NpiKrbReader -AdInvoke $f.Invoke
            $st = Read-NpiKrbDomain -Reader $rd -Rows $script:Register.Rows -Dispositions $Inputs.Dispositions -Domain $script:Domain -AsOf $script:AsOf
            (@((Test-NpiKerberosIsland -Rows $script:Register.Rows -Domain $st -Inputs $Inputs -AsOf $script:AsOf -DomainName $script:Domain -Cloud gcc -TenantId $script:Tenant).Plan.actions | Where-Object Account -EQ 'msa-print01$'))[0]
        }
        (& $check (Get-TestInputs)).Action | Should -Be 'AwaitHostChange'
        (& $check (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ HostChangedOn = '2026-10-15' } })).Action | Should -Be 'AwaitParallelRun'
        $a = & $check (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ HostChangedOn = '2026-09-15' } })
        $a.Action | Should -Be 'DisableSuperseded'
        $a.Cmdlet | Should -Be 'Disable-ADAccount'
        $a.Params.Identity | Should -Be 'ad000000-0000-4000-8000-000000000021'
    }
}

Describe 'dMSAs: Windows Server 2025 delegated MSA migration' {
    It 'creates the dMSA first, then starts the migration with the account''s distinguished name' {
        $i = Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ NewAccount = 'dmsa-hrsync2$'; MigrationStartedOn = '' } }
        $r = Invoke-TestCheck -Inputs $i
        $a = @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0]
        $a.Action | Should -Be 'CreateDmsa'
        $a.Params.CreateDelegatedServiceAccount | Should -BeTrue
        $p = New-TestKrb { param($j) $j.serviceAccountState = @{} }
        $r2 = Invoke-TestCheck -KrbPath $p -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ MigrationStartedOn = '' } })
        $s = @($r2.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0]
        $s.Action | Should -Be 'StartDmsaMigration'
        $s.Params.SupersededAccount | Should -Be 'CN=svc-hrsync,OU=Service Accounts,DC=corp,DC=contoso,DC=example'
    }
    It 'completes only 28 days after the start (Learn: at least 14, 28 recommended)' {
        (Get-Act 'svc-hrsync')[0].Action | Should -Be 'CompleteDmsaMigration'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ MigrationStartedOn = '2026-10-10' } })
        $a = @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0]
        $a.Action | Should -Be 'AwaitMigrationWindow'
        $a.Reason | Should -Match '2026-11-07'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ MigrationStartedOn = '' } })
        @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0].Action | Should -Be 'AwaitMigrationWindow'
    }
    It 'NPI-KRB-04: unconstrained delegation, an MSA, a host or a domain without Windows Server 2025 block a dMSA' {
        (Get-Rule 'NPI-KRB-04').Issue | Should -Match 'unconstrained delegation'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ Target = 'dMSA'; NewAccount = 'dmsa-print$' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'msa-print01$' })[0].Issue | Should -Match "MSA or gMSA can't be migrated.*PRINT01 runs Windows Server 2019"
        $p = New-TestKrb { param($j) foreach ($dc in $j.domainControllers) { $dc.OperatingSystem = 'Windows Server 2022 Datacenter' } }
        $r = Invoke-TestCheck -KrbPath $p
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'svc-hrsync' })[0].Issue | Should -Match 'no Windows Server 2025 domain controller'
    }
    It 'one dMSA per service account, and a gMSA can''t be converted again' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-webfront' @{ NewAccount = 'dmsa-hrsync$' }; Set-Row $x 'gmsa-web$' @{ Disposition = 'Convert'; Target = 'dMSA'; NewAccount = 'dmsa-web$' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'svc-hrsync' })[0].Issue | Should -Match 'more than one account'
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'gmsa-web$' })[0].Issue | Should -Match "already a gMSA"
    }
}

Describe 'PrincipalsAllowedToRetrieveManagedPassword as reviewed data' {
    It 'NPI-KRB-03: AD differing from the reviewed list plans a SetRetrievers with the list as read' {
        (Get-Rule 'NPI-KRB-03').ObjectKey | Should -Be 'gmsa-web$'
        $a = @(Get-Act 'gmsa-web$' | Where-Object Action -EQ 'SetRetrievers')[0]
        @($a.Params.PrincipalsAllowedToRetrieveManagedPassword) | Should -HaveCount 3
        @($a.Before) | Should -HaveCount 2
    }
    It 'an account missing from the reviewed data, or an empty list, is a finding with no write' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Retrievers.Remove('gmsa-ops$'); $x.Retrievers['gmsa-web$'] = @() })
        @($r.Findings | Where-Object Rule -EQ 'NPI-KRB-03').Issue -join ' ' | Should -Match 'No reviewed.*empty|empty.*No reviewed'
        @($r.Plan.actions | Where-Object Action -EQ 'SetRetrievers') | Should -HaveCount 0
    }
}

Describe 'The island list (N3.6) and the SPN retirement hand-off (P4.6)' {
    It 'lists every account that stays on Kerberos under the name it will have, with its SPNs' {
        @($script:Run.IslandList.Account) | Should -Be @('dmsa-hrsync$', 'gmsa-intranet$', 'gmsa-print$', 'gmsa-web$', 'svc-webfront')
        @($script:Run.IslandList | Where-Object Account -EQ 'dmsa-hrsync$')[0].Spns | Should -Be 'HTTP/hrapp.corp.contoso.example'
    }
    It 'NPI-KRB-05 and NPI-KRB-06: an SPN owner and an end date within D08, or not ready' {
        (Get-Rule 'NPI-KRB-05').ObjectKey | Should -Be 'svc-intranet'
        @(Get-Rule 'NPI-KRB-06').ObjectKey | Sort-Object | Should -Be @('gmsa-web$', 'svc-intranet')
        @($script:Run.IslandList | Where-Object ReadyForP46).Account | Should -Be @('dmsa-hrsync$', 'gmsa-print$', 'svc-webfront')
        $script:Run.HandoffReady | Should -BeFalse
    }
    It 'with no D08 date, nothing can be handed off' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.EndState.d08.kerberosEndDate = $null })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-06' -and $_.Severity -eq 'Warn' }).Count | Should -BeGreaterThan 0
        $r.HandoffReady | Should -BeFalse
    }
    It 'is ready once every account has an owner and an end date within D08' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-intranet' @{ SpnOwnerUpn = 'intranet.owner@contoso.example'; EndDate = '2027-03-31' }; Set-Row $x 'gmsa-web$' @{ EndDate = '2027-06-30' } })
        $r.HandoffReady | Should -BeTrue
    }
}

Describe 'Reconciliation with the provisional end state (N7.3, D11, G5)' {
    It 'every gMSA and dMSA, existing or planned, has an outcome' {
        @($script:Run.Reconciliation | ForEach-Object { "$($_.Account)=$($_.Outcome)" }) | Should -Be @('dmsa-hrsync$=OnIslandList', 'gmsa-ops$=MovesToWorkloadIdentity', 'gmsa-sql$=HandedOff', 'gmsa-web$=OnIslandList', 'gmsa-intranet$=Unreconciled', 'gmsa-print$=OnIslandList')
    }
    It 'NPI-KRB-07: an island account past the island''s end of life' {
        (Get-Rule 'NPI-KRB-07').ObjectKey | Should -Be 'gmsa-intranet$'
    }
    It 'NPI-KRB-07: when D11 retires AD, an island account past G5 loses its credential at demotion' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.EndState.d11.decision = 'AdRetired'; Set-Row $x 'gmsa-web$' @{ EndDate = '2027-12-31' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-07' -and $_.ObjectKey -eq 'gmsa-web$' })[0].Issue | Should -Match 'loses its credential at domain controller demotion'
    }
    It 'NPI-KRB-07: a gMSA with no destination, or a workload identity move after G5' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Dispositions = @($x.Dispositions | Where-Object SamAccountName -NE 'gmsa-web$'); Set-Row $x 'gmsa-ops$' @{ EndDate = '2027-12-31' } })
        @($r.Reconciliation | Where-Object Outcome -EQ 'Unreconciled').Account | Should -Contain 'gmsa-web$'
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-07' -and $_.ObjectKey -eq 'gmsa-ops$' })[0].Issue | Should -Match 'after G5'
    }
    It 'a blocked conversion plans no new account to reconcile' {
        @($script:Run.Reconciliation.Account) | Should -Not -Contain 'dmsa-webfront$'
    }
}

Describe 'The plan' {
    It 'nothing in the check writes, and every read is a declared Get-AD* call' {
        foreach ($c in $script:Run.Fake.Calls) { $c.Cmdlet | Should -Match '^Get-AD' }
        @($script:Run.Reader.Evidence.Call | Sort-Object -Unique) | Should -Be @('krb-domain-controllers', 'krb-host-computers', 'krb-kds-root-keys', 'krb-service-accounts', 'krb-superseded-user')
    }
    It 'has four writes for the fixture, and the same inputs give the same plan, byte for byte' {
        @($script:Run.Plan.actions | Where-Object Write).Action | Sort-Object | Should -Be @('CompleteDmsaMigration', 'CreateGmsa', 'CreateGmsa', 'SetRetrievers')
        (Save-TestPlan $script:Run.Plan).Sha | Should -Be (Save-TestPlan (Invoke-TestCheck).Plan).Sha
    }
    It 'no action deletes, and every action has a stable ID' {
        foreach ($a in $script:Run.Plan.actions) { "$($a.Cmdlet)" | Should -Not -Match '^(Remove|Uninstall|Undo|Reset)-'; $a.ActionId | Should -Be "$($a.Action):$($a.Account)" }
    }
}

Describe 'The separate write path' {
    BeforeAll { $script:Saved = Save-TestPlan $script:Run.Plan }
    It 'refuses a plan nobody approved, for another tenant or domain, or older than seven days' {
        $w = (New-TestWriter).Writer
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 ('0' * 64) -Writer $w -AsOf $script:AsOf } | Should -Throw '*nobody reviewed*'
        $other = New-NpiKrbWriter -TenantId '00000000-0000-4000-8000-000000000000' -Domain $script:Domain -AdInvoke { }
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $other -AsOf $script:AsOf } | Should -Throw '*for tenant*'
        $dom = New-NpiKrbWriter -TenantId $script:Tenant -Domain 'other.contoso.example' -AdInvoke { }
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $dom -AsOf $script:AsOf } | Should -Throw '*for domain*'
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
    }
    It 'refuses a delete, an undeclared call, a parameter outside the allowed list, or an empty retriever list' {
        $w = (New-TestWriter).Writer
        $base = @{ ActionId = 'x'; Write = $true }
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-new-gmsa'; Cmdlet = 'Remove-ADServiceAccount'; Params = @{ Identity = 'a' } })) } | Should -Throw '*never run*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-remove'; Cmdlet = 'Set-ADServiceAccount'; Params = @{} })) } | Should -Throw '*isn''t declared*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-set-retrievers'; Cmdlet = 'Set-ADServiceAccount'; Params = @{ Identity = 'a'; Enabled = $false; PrincipalsAllowedToRetrieveManagedPassword = @('CN=X,DC=c') } })) } | Should -Throw '*-Enabled isn''t allowed*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-set-retrievers'; Cmdlet = 'Set-ADServiceAccount'; Params = @{ Identity = 'a'; PrincipalsAllowedToRetrieveManagedPassword = @() } })) } | Should -Throw '*empty retriever list*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-new-gmsa'; Cmdlet = 'New-ADServiceAccount'; Params = @{ Name = 'g'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=X,DC=c'); KerberosEncryptionType = 'RC4' } })) } | Should -Throw '*AES256*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-start-migration'; Cmdlet = 'Start-ADServiceAccountMigration'; Params = @{ Identity = 'd$'; SupersededAccount = 'svc-hrsync' } })) } | Should -Throw '*distinguished name*'
    }
    It 'dry run: runs every precheck and sends nothing' {
        $t = New-TestWriter
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf
        @($run.Results.Outcome | Sort-Object -Unique) | Should -Be @('WouldSend')
        @($t.Fake.Calls | Where-Object { $_.Cmdlet -notmatch '^Get-AD' }) | Should -HaveCount 0
    }
    It '-Apply: creates the gMSAs, sets the retrievers, completes the migration and keeps the old account, disabled' {
        $t = New-TestWriter
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -Apply
        @($run.Results.Outcome | Sort-Object -Unique) | Should -Be @('Sent')
        $sas = $t.Fake.Estate.ad.serviceAccounts
        @($sas | Where-Object SamAccountName -In 'gmsa-print$', 'gmsa-intranet$' | ForEach-Object ObjectClass | Sort-Object -Unique) | Should -Be @('msDS-GroupManagedServiceAccount')
        @(@($sas | Where-Object SamAccountName -EQ 'gmsa-web$')[0].PrincipalsAllowedToRetrieveManagedPassword) | Should -HaveCount 3
        $old = @($t.Fake.Estate.ad.objects | Where-Object SamAccountName -EQ 'svc-hrsync')[0]
        ([int64]$old.UserAccountControl -band 2) | Should -Be 2
        @($old.ServicePrincipalName) | Should -HaveCount 0
        @(@($sas | Where-Object SamAccountName -EQ 'dmsa-hrsync$')[0].ServicePrincipalName) | Should -Be @('HTTP/hrapp.corp.contoso.example')
        @($t.Fake.Calls | Where-Object { $_.Cmdlet -match '^(Remove|Uninstall|Undo|Reset)-' }) | Should -HaveCount 0
    }
    It 'skips a write whose precheck no longer holds' {
        $p = New-TestKrb { param($j) $j.serviceAccountState['dmsa-hrsync$']['msDS-DelegatedMSAState'] = 2 }
        $t = New-TestWriter -KrbPath $p
        & $t.Fake.Invoke 'New-ADServiceAccount' @{ Name = 'gmsa-print'; DNSHostName = 'x'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=PRINT01,OU=Servers,DC=corp,DC=contoso,DC=example') } | Out-Null
        & $t.Fake.Invoke 'Set-ADServiceAccount' @{ Identity = 'gmsa-web$'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=WEB01,OU=Servers,DC=corp,DC=contoso,DC=example') } | Out-Null
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -Apply
        @($run.Results | Where-Object Outcome -EQ 'Skipped').Action | Sort-Object | Should -Be @('CompleteDmsaMigration', 'CreateGmsa', 'SetRetrievers')
    }
    It 'the live invoker refuses any cmdlet the task doesn''t declare' {
        $allowed = @((Get-NpiKrbCall -Task kerberos-apply).cmdlet | Sort-Object -Unique)
        $allowed | Should -Not -Contain 'Remove-ADServiceAccount'
        $allowed | Should -Not -Contain 'Add-KdsRootKey'
    }
}

Describe 'The entry scripts' {
    It 'read, plan, dry-run and apply against the fixtures, with manifests' {
        $out = Join-Path $script:Tmp 'kerberos'
        $lines = & (Join-Path $script:Root 'Invoke-NpiKerberosIsland.ps1') -Cloud gcc -RegisterRun $script:InvRun -FixturePath $script:Estate -KerberosFixturePath $script:Krb -InputPath $script:Inputs -OutputPath $out
        $lines[0] | Should -Be 'Kerberos accounts: 9 in scope; KDS root key Ready'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'kerberos-island'
        $m.files.'kerberos-plan.json' | Should -Be (Get-NpiFileHash -Path (Join-Path $out 'kerberos-plan.json'))
        $m.inputs.'end-state.json' | Should -Not -BeNullOrEmpty
        $sha = Get-NpiFileHash -Path (Join-Path $out 'kerberos-plan.json')
        $dry = & (Join-Path $script:Root 'Invoke-NpiKerberosIslandAction.ps1') -PlanPath (Join-Path $out 'kerberos-plan.json') -ApprovedSha256 $sha -FixturePath $script:Estate -KerberosFixturePath $script:Krb -OutputPath (Join-Path $script:Tmp 'dry')
        $dry[0] | Should -Be 'DryRun: 4 WouldSend'
        $app = & (Join-Path $script:Root 'Invoke-NpiKerberosIslandAction.ps1') -PlanPath (Join-Path $out 'kerberos-plan.json') -ApprovedSha256 $sha -FixturePath $script:Estate -KerberosFixturePath $script:Krb -OutputPath (Join-Path $script:Tmp 'apply') -Apply
        $app[0] | Should -Be 'Apply: 4 Sent'
        (Get-Content (Join-Path $script:Tmp 'apply/manifest.json') -Raw | ConvertFrom-Json).planSha256 | Should -Be $sha
    }
    It 'refuses a register read in another cloud' {
        { & (Join-Path $script:Root 'Invoke-NpiKerberosIsland.ps1') -Cloud gcchigh -RegisterRun $script:InvRun -FixturePath $script:Estate -KerberosFixturePath $script:Krb -InputPath $script:Inputs -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw '*not ''gcchigh''*'
    }
}
