#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 06: the Kerberos accounts (gMSAs, dMSAs and the island), the plan and its separate write
# path, against Chapter 01's register of the fictional estate, Chapter 03's decisions on it and the
# fake Active Directory.

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
    # Chapter 03's run holds the owners' D-NP3 dispositions this chapter reads (and Chapter 02's, which it needs).
    $script:OwnRun = Join-Path $script:Tmp 'ownership'
    $null = & (Join-Path $script:Root 'Invoke-NpiOwnership.ps1') -Cloud gcc -RegisterRun $script:InvRun -FixturePath $script:Estate -InputPath (Join-Path $PSScriptRoot 'fixtures/inputs') -OutputPath $script:OwnRun
    $script:MatRun = Join-Path $script:Tmp 'matrix'
    $script:Dates = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/ch03/inputs/program-dates.json')).Path
    $null = & (Join-Path $script:Root 'Invoke-NpiMatrix.ps1') -Cloud gcc -RegisterRun $script:InvRun -OwnershipRun $script:OwnRun -InputPath (Join-Path $PSScriptRoot 'fixtures/ch03/inputs') -FixturePath $script:Estate -SkuFixturePath (Join-Path $PSScriptRoot 'fixtures/ch03/subscribed-skus.json') -OutputPath $script:MatRun
    $script:Matrix = Import-NpiKrbMatrixRun -RunPath $script:MatRun -RegisterSha256 $script:Register.Sha256
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
        $i = Import-NpiKrbInput -InputPath $script:Inputs -MatrixRun $script:Matrix -ProgramDatesPath $script:Dates
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
    It 'refuses a register that changed since Chapter 01, or Chapter 03''s run for another register or with changed decisions; reads its vocabulary and acceptance' {
        $copy = Join-Path $script:Tmp 'tampered'; Copy-Item -Recurse $script:InvRun $copy
        Add-Content -LiteralPath (Join-Path $copy 'register.json') -Value ' '
        { Import-NpiKrbRegister -RunPath $copy } | Should -Throw '*doesn''t match its manifest*'
        { Import-NpiKrbMatrixRun -RunPath $script:MatRun -RegisterSha256 ('0' * 64) } | Should -Throw '*run Chapter 03 on this register*'
        $copy = Join-Path $script:Tmp 'matrix-tampered'; Copy-Item -Recurse $script:MatRun $copy
        Add-Content -LiteralPath (Join-Path $copy 'decisions.json') -Value ' '
        { Import-NpiKrbMatrixRun -RunPath $copy -RegisterSha256 $script:Register.Sha256 } | Should -Throw '*doesn''t match its manifest*'
        $i = Get-TestInputs
        $w = @($i.Dispositions | Where-Object SamAccountName -EQ 'svc-webfront')[0]
        $w.Disposition | Should -Be 'KeepKerberos'
        $w.AoAcceptedBy | Should -Be 'ao@contoso.example'
        (Get-NpiKrbPath $w) | Should -Be 'Island'
        $h = @($i.Dispositions | Where-Object SamAccountName -EQ 'svc-hrsync')[0]
        "$($h.Disposition) $($h.Target) $($h.NewAccount)" | Should -Be 'Replatform dMSA dmsa-hrsync$'
        (Get-NpiKrbPath $h) | Should -Be 'Convert'
        (Get-NpiKrbPath ([pscustomobject]@{ Disposition = 'Replatform'; Target = 'ManagedIdentity' })) | Should -Be 'WorkloadIdentity'
        (Get-NpiKrbPath ([pscustomobject]@{ Disposition = 'Convert'; Target = 'gMSA' })) | Should -Be ''
        $i.Hashes.Keys | Should -Be @('decisions.json', 'kerberos-replatform.csv', 'password-retrievers.json', 'ad-standard.json', 'program-dates.json')
        $i.AdStandard.ServiceAccountOu | Should -Be 'OU=Service Accounts,DC=corp,DC=contoso,DC=example'
        $i.AdStandard.HoldingOu | Should -Be 'OU=Disabled Service Accounts,DC=corp,DC=contoso,DC=example'
        $i.AdStandard.PasswordIntervalDays | Should -Be 30
        "$($h.RequestId) $($h.ChangeRecord)" | Should -Be 'SP-REQ-0001041 CHG0031041'
    }
    It 'reads the one program-dates file Chapter 03''s run read, refuses any other, and refuses an end state that isn''t AdRetired or KerberosIsland, with no default' {
        $dir = Join-Path $script:Tmp ("dates-{0}" -f [guid]::NewGuid()); New-Item -ItemType Directory -Force $dir | Out-Null
        $other = Join-Path $dir 'program-dates.json'
        $e = Get-Content $script:Dates -Raw | ConvertFrom-Json -AsHashtable; $e.d08LegacyAuthEndDate = '2027-12-31'
        [IO.File]::WriteAllText($other, ($e | ConvertTo-Json -Depth 10))
        { Import-NpiKrbInput -InputPath $script:Inputs -MatrixRun $script:Matrix -ProgramDatesPath $other } | Should -Throw '*not the*Chapter 03''s run read*'
        (Get-TestInputs).ProgramDates.d08LegacyAuthEndDate | Should -Be '2027-06-30'
        $dir = Join-Path $script:Tmp ("in-{0}" -f [guid]::NewGuid()); New-Item -ItemType Directory -Force $dir | Out-Null
        $dates = Join-Path $dir 'program-dates.json'
        $e = Get-Content $script:Dates -Raw | ConvertFrom-Json -AsHashtable; $e.d11.decision = 'Undecided'
        [IO.File]::WriteAllText($dates, ($e | ConvertTo-Json -Depth 10))
        $m = [pscustomobject]@{ Decisions = $script:Matrix.Decisions; Sha256 = $script:Matrix.Sha256; Manifest = @{ inputs = @{ 'program-dates.json' = (Get-NpiFileHash -Path $dates) } } }
        { Import-NpiKrbInput -InputPath $script:Inputs -MatrixRun $m -ProgramDatesPath $dates } | Should -Throw '*AdRetired or KerberosIsland*'
        Remove-Item $dates
        { Import-NpiKrbInput -InputPath $script:Inputs -MatrixRun $m -ProgramDatesPath $dates } | Should -Throw '*Missing reviewed input*'
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
    It 'NPI-KRB-02: a Kerberos account with no disposition in Chapter 03''s decisions gets no action but a finding' {
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
    It 'an MSA is upgraded to a new gMSA in the service-account OU, with its retriever group, AES256, the password interval and its request' {
        $a = (Get-Act 'msa-print01$')[0]
        $a.Action | Should -Be 'CreateGmsa'
        $a.Params.Name | Should -Be 'gmsa-print'
        $a.Params.DNSHostName | Should -Be 'gmsa-print.corp.contoso.example'
        $a.Params.Path | Should -Be 'OU=Service Accounts,DC=corp,DC=contoso,DC=example'
        @($a.Params.PrincipalsAllowedToRetrieveManagedPassword) | Should -Be @('CN=DL-gMSA-print-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
        $a.Params.KerberosEncryptionType | Should -Be 'AES256'
        $a.Params.ManagedPasswordIntervalInDays | Should -Be 30
        "$($a.RunBy) $($a.RequestId) $($a.ChangeRecord)" | Should -Be 'pipeline SP-REQ-0001043 CHG0031043'
        @($a.Controls) | Should -Be @('AC-6', 'IA-5', 'CM-3')
        @($a.Ksis) | Should -Be @('KSI-IAM-ELP', 'KSI-CMT-LMC')
    }
    It 'WD-154: a gMSA for an account with no SPN is outbound-only, unless the owner records why not; one that takes over SPNs never is' {
        $a = (Get-Act 'msa-print01$')[0]
        $a.Params.RestrictToOutboundAuthenticationOnly | Should -BeTrue
        $a.Reason | Should -Match 'Outbound-only: msa-print01\$ holds no SPN'
        (Get-Act 'svc-intranet')[0].Params.Contains('RestrictToOutboundAuthenticationOnly') | Should -BeFalse
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ OutboundOnlyReason = 'The print vendor''s console authenticates to the task' } })
        $b = @($r.Plan.actions | Where-Object Account -EQ 'msa-print01$')[0]
        $b.Params.Contains('RestrictToOutboundAuthenticationOnly') | Should -BeFalse
        $b.Reason | Should -Match 'Not outbound-only: The print vendor''s console'
    }
    It 'an IIS application pool''s account gets a gMSA whose retriever is its DL-gMSA-<app>-Hosts group' {
        (Get-Act 'svc-intranet')[0].Params.PrincipalsAllowedToRetrieveManagedPassword | Should -Be 'CN=DL-gMSA-intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example'
    }
    It 'WD-159: a planned name that isn''t gmsa-<app> or dmsa-<app> in lowercase, or is longer than 15 characters, blocks the plan (NPI-KRB-04)' {
        foreach ($bad in 'svc-print2$', 'GMSA-Print$', 'gmsa_print$', 'dmsa-print$', 'gmsa-printservice01$') {
            $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ NewAccount = $bad }; $x.Retrievers[$bad] = @('CN=DL-gMSA-print-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example') })
            @($r.Plan.actions | Where-Object Account -EQ 'msa-print01$')[0].Action | Should -Be 'Blocked' -Because $bad
            @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'msa-print01$' })[0].Issue | Should -Match 'name standard|15 characters' -Because $bad
        }
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ NewAccount = 'gmsa-hrsync$' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'svc-hrsync' })[0].Issue | Should -Match 'a dMSA is dmsa-<app>'
    }
    It 'WD-160: a planned gMSA whose reviewed retriever is a computer, or more than one entry, isn''t planned (NPI-KRB-03)' {
        $cases = @{ 'a computer' = @('CN=PRINT01,OU=Servers,DC=corp,DC=contoso,DC=example'); 'two groups' = @('CN=DL-gMSA-print-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example', 'CN=DL-gMSA-web-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example') }
        foreach ($k in $cases.Keys) {
            $list = $cases[$k]
            $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Retrievers['gmsa-print$'] = $list })
            @($r.Plan.actions | Where-Object Account -EQ 'msa-print01$')[0].Action | Should -Be 'Blocked' -Because $k
            @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-03' -and $_.ObjectKey -eq 'msa-print01$' }) | Should -HaveCount 1 -Because $k
            @($r.Reconciliation.Account) | Should -Not -Contain 'gmsa-print$'
        }
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
            @((Test-NpiKerberosIsland -Rows $script:Register.Rows -Domain $st -Inputs $Inputs -AsOf $script:AsOf -DomainName $script:Domain -Cloud gcc -TenantId $script:Tenant).Plan.actions | Where-Object Account -EQ 'msa-print01$')
        }
        (& $check (Get-TestInputs))[0].Action | Should -Be 'AwaitHostChange'
        (& $check (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ HostChangedOn = '2026-10-15' } }))[0].Action | Should -Be 'AwaitParallelRun'
        $acts = & $check (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ HostChangedOn = '2026-09-15' } })
        # WD-168: the disable and the move to the holding OU, in the same plan, both by objectGUID and both the pipeline's.
        @($acts.Action) | Should -Be @('DisableSuperseded', 'MoveSuperseded')
        $acts[0].Cmdlet | Should -Be 'Disable-ADAccount'
        $acts[0].Params.Identity | Should -Be 'ad000000-0000-4000-8000-000000000021'
        $acts[1].Cmdlet | Should -Be 'Move-ADObject'
        $acts[1].Params.Identity | Should -Be 'ad000000-0000-4000-8000-000000000021'
        $acts[1].Params.TargetPath | Should -Be 'OU=Disabled Service Accounts,DC=corp,DC=contoso,DC=example'
        $acts[1].Before | Should -Be 'CN=msa-print01,CN=Managed Service Accounts,DC=corp,DC=contoso,DC=example'
        @($acts.RunBy | Sort-Object -Unique) | Should -Be @('pipeline')
        @($acts | ForEach-Object { "$($_.RequestId) $($_.ChangeRecord)" } | Sort-Object -Unique) | Should -Be @('SP-REQ-0001043 CHG0031043')
        @($acts[1].Controls) | Should -Be @('AC-2(3)')
        # Already disabled but still in its OU: only the move; disabled and in the holding OU: nothing to send.
        & $w.Fake.Invoke 'Disable-ADAccount' @{ Identity = 'ad000000-0000-4000-8000-000000000021' }
        [IO.File]::WriteAllText($est, ($w.Fake.Estate | ConvertTo-Json -Depth 50))
        @((& $check (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ HostChangedOn = '2026-09-15' } })).Action) | Should -Be @('MoveSuperseded')
        & $w.Fake.Invoke 'Move-ADObject' @{ Identity = 'ad000000-0000-4000-8000-000000000021'; TargetPath = 'OU=Disabled Service Accounts,DC=corp,DC=contoso,DC=example' }
        [IO.File]::WriteAllText($est, ($w.Fake.Estate | ConvertTo-Json -Depth 50))
        @((& $check (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ HostChangedOn = '2026-09-15' } })).Action) | Should -Be @('Superseded')
    }
    It 'WD-168: -Apply disables the old account, moves it to the holding OU and re-reads both; it''s never deleted' {
        $w = New-TestWriter
        & $w.Fake.Invoke 'New-ADServiceAccount' @{ Name = 'gmsa-intranet'; DNSHostName = 'gmsa-intranet.corp.contoso.example'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=DL-gMSA-intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example'); KerberosEncryptionType = 'AES256' }
        $est = Join-Path $script:Tmp ("estate-{0}.json" -f [guid]::NewGuid()); [IO.File]::WriteAllText($est, ($w.Fake.Estate | ConvertTo-Json -Depth 50))
        $f = New-NpiKrbFixtureAdInvoker -EstatePath $est -KerberosPath $script:Krb -AllowWrite
        $i = Get-TestInputs { param($x) Set-Row $x 'svc-intranet' @{ HostChangedOn = '2026-09-01' } }
        $st = Read-NpiKrbDomain -Reader (New-NpiKrbReader -AdInvoke $f.Invoke) -Rows $script:Register.Rows -Dispositions $i.Dispositions -Domain $script:Domain -AsOf $script:AsOf
        $plan = (Test-NpiKerberosIsland -Rows $script:Register.Rows -Domain $st -Inputs $i -AsOf $script:AsOf -DomainName $script:Domain -Cloud gcc -TenantId $script:Tenant).Plan
        @($plan.actions | Where-Object Account -EQ 'svc-intranet').Action | Should -Be @('DisableSuperseded', 'MoveSuperseded')
        $saved = Save-TestPlan $plan
        $writer = New-NpiKrbWriter -TenantId $script:Tenant -Domain $script:Domain -AdInvoke $f.Invoke
        $run = Invoke-NpiKrbPlan -PlanPath $saved.Path -ApprovedSha256 $saved.Sha -Writer $writer -AsOf $script:AsOf -RunAs Pipeline -Apply
        $mine = @($run.Results | Where-Object Account -EQ 'svc-intranet')
        @($mine | ForEach-Object { "$($_.Action)=$($_.Outcome)/$($_.Verified)" }) | Should -Be @('DisableSuperseded=Sent/True', 'MoveSuperseded=Sent/True')
        $old = @($f.Estate.ad.objects | Where-Object SamAccountName -EQ 'svc-intranet')[0]
        ([int64]$old.UserAccountControl -band 2) | Should -Be 2
        $old.DistinguishedName | Should -Be 'CN=svc-intranet,OU=Disabled Service Accounts,DC=corp,DC=contoso,DC=example'
        @($f.Calls | Where-Object { $_.Cmdlet -match '^(Remove|Uninstall|Undo|Reset|Clear)-' }) | Should -HaveCount 0
        # Run again: nothing left to send.
        $again = Invoke-NpiKrbPlan -PlanPath $saved.Path -ApprovedSha256 $saved.Sha -Writer $writer -AsOf $script:AsOf -RunAs Pipeline -Apply
        @($again.Results | Where-Object Account -EQ 'svc-intranet').Detail | Should -Be @('Already disabled', 'Already in the holding OU')
    }
}

Describe 'dMSAs: Windows Server 2025 delegated MSA migration' {
    It 'creates the dMSA first, then starts the migration with the account''s distinguished name' {
        $i = Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ NewAccount = 'dmsa-hrsync2$'; MigrationStartedOn = '' } }
        $r = Invoke-TestCheck -Inputs $i
        $a = @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0]
        $a.Action | Should -Be 'CreateDmsa'
        $a.Params.CreateDelegatedServiceAccount | Should -BeTrue
        $a.Params.Path | Should -Be 'OU=Service Accounts,DC=corp,DC=contoso,DC=example'
        # The dMSA steps need Domain Admins (Learn): a person sends them, never the pipeline.
        $a.RunBy | Should -Be 'person'
        $p = New-TestKrb { param($j) $j.serviceAccountState = @{} }
        $r2 = Invoke-TestCheck -KrbPath $p -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ MigrationStartedOn = '' } })
        $s = @($r2.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0]
        $s.Action | Should -Be 'StartDmsaMigration'
        $s.Params.SupersededAccount | Should -Be 'CN=svc-hrsync,OU=Service Accounts,DC=corp,DC=contoso,DC=example'
    }
    It 'completes only 30 days after the start (Learn: at least 14, 28 recommended; the program waits 30)' {
        (Get-Act 'svc-hrsync')[0].Action | Should -Be 'CompleteDmsaMigration'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ MigrationStartedOn = '2026-10-10' } })
        $a = @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0]
        $a.Action | Should -Be 'AwaitMigrationWindow'
        $a.Reason | Should -Match '2026-11-09'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-hrsync' @{ MigrationStartedOn = '' } })
        @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0].Action | Should -Be 'AwaitMigrationWindow'
    }
    It 'NPI-KRB-04: unconstrained delegation, an MSA, a host or a domain without Windows Server 2025 block a dMSA' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-webfront' @{ Disposition = 'Replatform'; Target = 'dMSA'; NewAccount = 'dmsa-webfront$'; Workload = 'IisAppPool'; Hosts = 'WEB03'; SpnOwnerUpn = 'web.owner@contoso.example'; EndDate = '2027-06-30' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'svc-webfront' })[0].Issue | Should -Match 'unconstrained delegation'
        @($r.Reconciliation.Account) | Should -Not -Contain 'dmsa-webfront$'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ Target = 'dMSA'; NewAccount = 'dmsa-print$' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'msa-print01$' })[0].Issue | Should -Match "MSA or gMSA can't be migrated.*PRINT01 runs Windows Server 2019"
        $p = New-TestKrb { param($j) foreach ($dc in $j.domainControllers) { $dc.OperatingSystem = 'Windows Server 2022 Datacenter' } }
        $r = Invoke-TestCheck -KrbPath $p
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'svc-hrsync' })[0].Issue | Should -Match 'no Windows Server 2025 domain controller'
    }
    It 'one dMSA per service account, and a gMSA can''t be converted again' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-webfront' @{ Disposition = 'Replatform'; Target = 'dMSA'; NewAccount = 'dmsa-hrsync$'; Hosts = 'WEB03' }; Set-Row $x 'gmsa-web$' @{ Disposition = 'Replatform'; Target = 'dMSA'; NewAccount = 'dmsa-web$' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'svc-hrsync' })[0].Issue | Should -Match 'more than one account'
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'gmsa-web$' })[0].Issue | Should -Match "already a gMSA"
    }
}

Describe 'PrincipalsAllowedToRetrieveManagedPassword as reviewed data' {
    It 'NPI-KRB-03: AD differing from the reviewed list plans a SetRetrievers with the list as read, and the request that approved it' {
        @(Get-Rule 'NPI-KRB-03').ObjectKey | Should -Be @('gmsa-ops$', 'gmsa-web$')
        $a = @(Get-Act 'gmsa-web$' | Where-Object Action -EQ 'SetRetrievers')[0]
        @($a.Params.PrincipalsAllowedToRetrieveManagedPassword) | Should -Be @('CN=DL-gMSA-web-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
        @($a.Before) | Should -HaveCount 2
        "$($a.RunBy) $($a.RequestId) $($a.ChangeRecord)" | Should -Be 'pipeline SP-REQ-0001044 CHG0031044'
        @($a.Controls) | Should -Be @('AC-6'); @($a.Ksis) | Should -Be @('KSI-IAM-ELP')
    }
    It 'WD-160: an existing gMSA''s reviewed list that is a computer, or more than one entry, is a finding with no write; a dMSA keeps the hosts it learned' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Retrievers['gmsa-web$'] = @('CN=WEB01,OU=Servers,DC=corp,DC=contoso,DC=example', 'CN=WEB02,OU=Servers,DC=corp,DC=contoso,DC=example', 'CN=WEB03,OU=Servers,DC=corp,DC=contoso,DC=example') })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-03' -and $_.ObjectKey -eq 'gmsa-web$' })[0].Issue | Should -Match 'breaks the retriever rule.*3 reviewed retrievers'
        @($r.Plan.actions | Where-Object { $_.Account -eq 'gmsa-web$' -and $_.Action -eq 'SetRetrievers' }) | Should -HaveCount 0
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Retrievers['gmsa-ops$'] = @('CN=OPS01,OU=Servers,DC=corp,DC=contoso,DC=example') })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-03' -and $_.ObjectKey -eq 'gmsa-ops$' })[0].Issue | Should -Match 'never a computer account'
        # A completed dMSA whose hosts AD learned (HR01, a computer) matches its reviewed list: no finding.
        $p = New-TestKrb { param($j) $j.serviceAccountState['dmsa-hrsync$']['msDS-DelegatedMSAState'] = 2 }
        $r = Invoke-TestCheck -KrbPath $p
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-03' -and $_.ObjectKey -eq 'dmsa-hrsync$' }) | Should -HaveCount 0
    }
    It 'an account missing from the reviewed data, or an empty list, is a finding with no write' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Retrievers.Remove('gmsa-ops$'); $x.Retrievers['gmsa-web$'] = @() })
        @($r.Findings | Where-Object Rule -EQ 'NPI-KRB-03').Issue -join ' ' | Should -Match 'No reviewed.*empty|empty.*No reviewed'
        @($r.Plan.actions | Where-Object Action -EQ 'SetRetrievers') | Should -HaveCount 0
    }
}

Describe 'The island list (NP3.6) and the SPN retirement hand-off (P4.6)' {
    It 'lists every account that stays on Kerberos under the name it will have, with its SPNs' {
        @($script:Run.IslandList.Account) | Should -Be @('dmsa-hrsync$', 'gmsa-intranet$', 'gmsa-ops$', 'gmsa-print$', 'gmsa-web$', 'svc-webfront')
        @($script:Run.IslandList | Where-Object Account -EQ 'dmsa-hrsync$')[0].Spns | Should -Be 'HTTP/hrapp.corp.contoso.example'
    }
    It 'NPI-KRB-05 and NPI-KRB-06: an SPN owner where Chapter 03 needs one, an end date within its bound, or not ready' {
        @(Get-Rule 'NPI-KRB-05').ObjectKey | Sort-Object | Should -Be @('svc-intranet', 'svc-webfront')
        @(Get-Rule 'NPI-KRB-06').ObjectKey | Sort-Object | Should -Be @('svc-intranet')
        @($script:Run.IslandList | Where-Object ReadyForP46).Account | Should -Be @('dmsa-hrsync$', 'gmsa-ops$', 'gmsa-print$', 'gmsa-web$')
        $script:Run.HandoffReady | Should -BeFalse
        # WD-165, as in Chapter 03: every account that stays ends by the island's end of life where D11 keeps one
        # (the fixture's, 2028-06-30), else by G5. D08 bounds no end date, a KeepKerberos account's included.
        @($script:Run.IslandList.EndBound | Sort-Object -Unique) | Should -Be @('IslandEOL')
        # gmsa-web$ ends 2027-08-31 and svc-webfront, kept on Kerberos, 2027-12-31: after D08 (2027-06-30), within the island's end of life.
        @($script:Run.IslandList | Where-Object Account -EQ 'gmsa-web$')[0].WithinBound | Should -BeTrue
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-webfront' @{ EndDate = '2027-12-31' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-06' -and $_.ObjectKey -eq 'svc-webfront' }).Count | Should -Be 0
        @($r.IslandList | Where-Object Account -EQ 'svc-webfront')[0].WithinBound | Should -BeTrue
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'gmsa-web$' @{ EndDate = '2028-07-31' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-06' -and $_.ObjectKey -eq 'gmsa-web$' }).Issue | Should -Match "after the island's end of life 2028-06-30"
        # Where D11 retires AD, the bound is G5 (2027-09-30) for every account that stays.
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.ProgramDates.d11.decision = 'AdRetired'; Set-Row $x 'svc-webfront' @{ EndDate = '2027-10-31' } })
        @($r.IslandList.EndBound | Sort-Object -Unique) | Should -Be @('G5')
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-06' -and $_.ObjectKey -eq 'svc-webfront' }).Issue | Should -Match 'after G5'
        # An SPN owner only for a KeepKerberos account or one with SPNs: gmsa-ops$ is kept with no SPNs and needs none; gmsa-web$ has SPNs.
        @($script:Run.IslandList | Where-Object Account -EQ 'gmsa-ops$')[0].ReadyForP46 | Should -BeTrue
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'gmsa-web$' @{ SpnOwnerUpn = '' } })
        @($r.Findings | Where-Object Rule -EQ 'NPI-KRB-05').ObjectKey | Should -Contain 'gmsa-web$'
        @($r.IslandList | Where-Object Account -EQ 'gmsa-web$')[0].ReadyForP46 | Should -BeFalse
    }
    It 'with no G5 date where D11 retires AD, nothing can be handed off' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.ProgramDates.d11.decision = 'AdRetired'; $x.ProgramDates.g5AdRetired = $null })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-06' -and $_.Severity -eq 'Warn' }).Count | Should -BeGreaterThan 0
        $r.HandoffReady | Should -BeFalse
    }
    It 'is ready once every account that needs one has an SPN owner and every end date is within its bound' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-intranet' @{ SpnOwnerUpn = 'intranet.owner@contoso.example'; EndDate = '2027-03-31' }; Set-Row $x 'svc-webfront' @{ SpnOwnerUpn = 'web.owner@contoso.example' } })
        $r.HandoffReady | Should -BeTrue
        # Chapter 03's acceptance travels with an account kept on Kerberos: without it, it isn't ready.
        @($script:Run.IslandList | Where-Object Account -EQ 'svc-webfront')[0].AoAcceptedBy | Should -Be 'ao@contoso.example'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-webfront' @{ SpnOwnerUpn = 'web.owner@contoso.example'; AoAcceptedBy = '' } })
        @($r.IslandList | Where-Object Account -EQ 'svc-webfront')[0].ReadyForP46 | Should -BeFalse
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'svc-webfront' @{ SpnOwnerUpn = 'web.owner@contoso.example' } })
        @($r.IslandList | Where-Object Account -EQ 'svc-webfront')[0].ReadyForP46 | Should -BeTrue
    }
}

Describe 'Reconciliation with the provisional end state (NP7.3, D11, G5)' {
    It 'every gMSA and dMSA, existing or planned, has an outcome' {
        @($script:Run.Reconciliation | ForEach-Object { "$($_.Account)=$($_.Outcome)" }) | Should -Be @('dmsa-hrsync$=OnIslandList', 'gmsa-ops$=OnIslandList', 'gmsa-sql$=HandedOff', 'gmsa-web$=OnIslandList', 'gmsa-intranet$=Unreconciled', 'gmsa-print$=OnIslandList')
    }
    It 'NPI-KRB-07: an island account past the island''s end of life' {
        (Get-Rule 'NPI-KRB-07').ObjectKey | Should -Be 'gmsa-intranet$'
    }
    It 'NPI-KRB-07: when D11 retires AD, an island account past G5 loses its credential at demotion' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.ProgramDates.d11.decision = 'AdRetired'; Set-Row $x 'gmsa-web$' @{ EndDate = '2027-12-31' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-07' -and $_.ObjectKey -eq 'gmsa-web$' })[0].Issue | Should -Match 'loses its credential at domain controller demotion'
    }
    It 'NPI-KRB-07: a gMSA with no destination, or a workload identity move after G5' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) $x.Dispositions = @($x.Dispositions | Where-Object SamAccountName -NE 'gmsa-web$'); Set-Row $x 'gmsa-ops$' @{ Disposition = 'Replatform'; Target = 'ManagedIdentity'; Reference = 'Chapter 05: user-assigned managed identity mi-ops-automation'; EndDate = '2027-12-31' } })
        @($r.Reconciliation | Where-Object Outcome -EQ 'Unreconciled').Account | Should -Contain 'gmsa-web$'
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-07' -and $_.ObjectKey -eq 'gmsa-ops$' })[0].Issue | Should -Match 'after G5'
        # A gMSA re-platformed to a workload identity moves in Chapter 05, and needs the identity named.
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'gmsa-ops$' @{ Disposition = 'Replatform'; Target = 'ManagedIdentity'; Reference = 'Chapter 05: user-assigned managed identity mi-ops-automation'; EndDate = '2027-03-31' } })
        @($r.Plan.actions | Where-Object Account -EQ 'gmsa-ops$')[0].Action | Should -Be 'MovesToWorkloadIdentity'
        @($r.Reconciliation | Where-Object Account -EQ 'gmsa-ops$')[0].Outcome | Should -Be 'MovesToWorkloadIdentity'
        @($r.IslandList.Account) | Should -Not -Contain 'gmsa-ops$'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'gmsa-ops$' @{ Disposition = 'Replatform'; Target = 'ManagedIdentity'; EndDate = '2027-03-31' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-02' -and $_.ObjectKey -eq 'gmsa-ops$' })[0].Issue | Should -Match 'needs a Reference'
    }
    It 'a conversion with no row in kerberos-replatform.csv is blocked, not guessed' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ NewAccount = '' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-04' -and $_.ObjectKey -eq 'msa-print01$' })[0].Issue | Should -Match 'no row in kerberos-replatform.csv'
    }
}

Describe 'The plan' {
    It 'nothing in the check writes, and every read is a declared Get-AD* call' {
        foreach ($c in $script:Run.Fake.Calls) { $c.Cmdlet | Should -Match '^Get-AD' }
        @($script:Run.Reader.Evidence.Call | Sort-Object -Unique) | Should -Be @('krb-domain-controllers', 'krb-host-computers', 'krb-kds-root-keys', 'krb-service-accounts', 'krb-superseded-user')
    }
    It 'has five writes for the fixture, four the pipeline''s and one a person''s, and the same inputs give the same plan, byte for byte' {
        @($script:Run.Plan.actions | Where-Object Write).Action | Sort-Object | Should -Be @('CompleteDmsaMigration', 'CreateGmsa', 'CreateGmsa', 'SetRetrievers', 'SetRetrievers')
        @($script:Run.Plan.actions | Where-Object Write | ForEach-Object { "$($_.Action)=$($_.RunBy)" } | Sort-Object -Unique) | Should -Be @('CompleteDmsaMigration=person', 'CreateGmsa=pipeline', 'SetRetrievers=pipeline')
        $script:Run.Plan.adStandard.holdingOu | Should -Be 'OU=Disabled Service Accounts,DC=corp,DC=contoso,DC=example'
        $script:Run.Plan.pipelineIdentity | Should -Be 'gmsa-msapipe$'
        (Save-TestPlan $script:Run.Plan).Sha | Should -Be (Save-TestPlan (Invoke-TestCheck).Plan).Sha
    }
    It 'NPI-KRB-10: a write with no SailPoint request or no ServiceNow change record is Blocked, not planned' {
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ RequestId = '' }; Set-Row $x 'svc-hrsync' @{ ChangeRecord = '' }; $x.RetrieverRequests.Remove('gmsa-web$') })
        @($r.Findings | Where-Object Rule -EQ 'NPI-KRB-10').ObjectKey | Sort-Object | Should -Be @('gmsa-web$', 'msa-print01$', 'svc-hrsync')
        $a = @($r.Plan.actions | Where-Object Account -EQ 'msa-print01$')[0]
        "$($a.Action) $($a.Write)" | Should -Be 'Blocked False'
        $a.Reason | Should -Match 'CreateGmsa: no approved request'
        @($r.Plan.actions | Where-Object Account -EQ 'svc-hrsync')[0].Reason | Should -Match 'no change record'
        @($r.Plan.actions | Where-Object { $_.Account -eq 'gmsa-web$' -and $_.Write }) | Should -HaveCount 0
        @($r.Plan.actions | Where-Object Write).Action | Sort-Object | Should -Be @('CreateGmsa', 'SetRetrievers')
    }
    It 'WD-175: a create carries the row''s tags as -Description; no tags, or tags naming another change, is Blocked (NPI-KRB-10)' {
        $c = @($script:Run.Plan.actions | Where-Object { $_.Action -eq 'CreateGmsa' })[0]
        $c.Params.Description | Should -Match '^SystemId=SYS-0150; Owner1=print.owner@contoso.example; .*Request=SP-REQ-0001043; Change=CHG0031043$'
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ Tags = '' } })
        @($r.Plan.actions | Where-Object Account -EQ 'msa-print01$')[0].Reason | Should -Match 'no tags'
        @($r.Plan.actions | Where-Object { $_.Account -eq 'msa-print01$' -and $_.Write }) | Should -HaveCount 0
        $r = Invoke-TestCheck -Inputs (Get-TestInputs { param($x) Set-Row $x 'msa-print01$' @{ Tags = 'SystemId=SYS-0150; Owner1=a; Owner2=b; Sponsor=c; Environment=prod; Tier=R3; EntraTarget=KeepKerberos; Request=SP-REQ-0001043; Change=CHG9999999' } })
        @($r.Findings | Where-Object { $_.Rule -eq 'NPI-KRB-10' -and $_.ObjectKey -eq 'msa-print01$' })[0].Issue | Should -Match 'CreateGmsa not planned: tags name change CHG9999999, not CHG0031043'
    }
    It 'no action deletes, and every action has a stable ID' {
        foreach ($a in $script:Run.Plan.actions) { "$($a.Cmdlet)" | Should -Not -Match '^(Remove|Uninstall|Undo|Reset)-'; $a.ActionId | Should -Be "$($a.Action):$($a.Account)" }
    }
}


Describe 'The separate write path' {
    BeforeAll { $script:Saved = Save-TestPlan $script:Run.Plan }
    It 'refuses a plan nobody approved, for another tenant or domain, or older than seven days' {
        $w = (New-TestWriter).Writer
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 ('0' * 64) -Writer $w -AsOf $script:AsOf -RunAs Pipeline } | Should -Throw '*nobody reviewed*'
        $other = New-NpiKrbWriter -TenantId '00000000-0000-4000-8000-000000000000' -Domain $script:Domain -AdInvoke { }
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $other -AsOf $script:AsOf -RunAs Pipeline } | Should -Throw '*for tenant*'
        $dom = New-NpiKrbWriter -TenantId $script:Tenant -Domain 'other.contoso.example' -AdInvoke { }
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $dom -AsOf $script:AsOf -RunAs Pipeline } | Should -Throw '*for domain*'
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w -AsOf $script:AsOf.AddDays(8) -RunAs Pipeline } | Should -Throw '*days old*'
        { Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w -AsOf $script:AsOf -RunAs Robot } | Should -Throw
    }
    It 'refuses a delete, an undeclared call, a parameter outside the allowed list, or an empty retriever list' {
        $w = (New-TestWriter).Writer
        $base = @{ ActionId = 'x'; Write = $true }
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-new-gmsa'; Cmdlet = 'Remove-ADServiceAccount'; Params = @{ Identity = 'a' } })) } | Should -Throw '*never run*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-remove'; Cmdlet = 'Set-ADServiceAccount'; Params = @{} })) } | Should -Throw '*isn''t declared*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-set-retrievers'; Cmdlet = 'Set-ADServiceAccount'; Params = @{ Identity = 'a'; Enabled = $false; PrincipalsAllowedToRetrieveManagedPassword = @('CN=X,DC=c') } })) } | Should -Throw '*-Enabled isn''t allowed*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-set-retrievers'; Cmdlet = 'Set-ADServiceAccount'; Params = @{ Identity = 'a'; PrincipalsAllowedToRetrieveManagedPassword = @() } })) } | Should -Throw '*empty retriever list*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-new-gmsa'; Cmdlet = 'New-ADServiceAccount'; Params = @{ Name = 'g'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=X,DC=c'); KerberosEncryptionType = 'RC4' } })) } | Should -Throw '*AES256*'
        $ok = @{ Call = 'krb-new-dmsa'; Cmdlet = 'New-ADServiceAccount'; RequestId = 'R-1'; ChangeRecord = 'C-1'; Params = @{ Name = 'dmsa-x'; Path = 'OU=S,DC=c'; CreateDelegatedServiceAccount = $true; KerberosEncryptionType = 'AES256' } }
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + $ok)) } | Should -Throw '*-Description: no tags*'
        $ok.Params.Description = 'SystemId=S; Owner1=a; Owner2=b; Sponsor=c; Environment=prod; Tier=R1; EntraTarget=Undecided; Request=R-2; Change=C-1'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + $ok)) } | Should -Throw '*tags name request R-2, not R-1*'
        $ok.Params.Description = $ok.Params.Description.Replace('Request=R-2', 'Request=R-1')
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + $ok)) } | Should -Not -Throw
        { Assert-NpiKrbPlannedWrite -Writer $w -Action ([pscustomobject]($base + @{ Call = 'krb-start-migration'; Cmdlet = 'Start-ADServiceAccountMigration'; Params = @{ Identity = 'd$'; SupersededAccount = 'svc-hrsync' } })) } | Should -Throw '*distinguished name*'
    }
    It 'refuses a gMSA outside the plan''s OU or interval, a move outside its holding OU, and a write with no request or no change record' {
        $w = (New-TestWriter).Writer
        $plan = Get-Content $script:Saved.Path -Raw | ConvertFrom-Json
        $create = @($plan.actions | Where-Object { $_.Action -eq 'CreateGmsa' })[0]
        $copy = { param([hashtable]$Change, [hashtable]$Params) $a = $create | ConvertTo-Json -Depth 10 | ConvertFrom-Json; foreach ($k in $Change.Keys) { $a.$k = $Change[$k] }; foreach ($k in $Params.Keys) { $a.Params.$k = $Params[$k] }; $a }
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{} @{}) -Plan $plan } | Should -Not -Throw
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{} @{ Path = 'OU=Elsewhere,DC=corp,DC=contoso,DC=example' }) -Plan $plan } | Should -Throw '*isn''t the plan''s*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{} @{ Path = 'CN=Managed Service Accounts,DC=corp,DC=contoso,DC=example' }) -Plan $plan } | Should -Throw '*OU''s distinguished name*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{} @{ ManagedPasswordIntervalInDays = 90 }) -Plan $plan } | Should -Throw '*isn''t the plan''s 30*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{} @{ RestrictToOutboundAuthenticationOnly = $false }) -Plan $plan } | Should -Throw '*only as true*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{ RequestId = '' } @{}) -Plan $plan } | Should -Throw '*no approved request*'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action (& $copy @{ ChangeRecord = '' } @{}) -Plan $plan } | Should -Throw '*no change record*'
        $move = [pscustomobject]@{ ActionId = 'm'; Write = $true; Call = 'krb-move-superseded'; Cmdlet = 'Move-ADObject'; RequestId = 'SP-REQ-1'; ChangeRecord = 'CHG1'
            Params = [pscustomobject]@{ Identity = 'ad000000-0000-4000-8000-000000000012'; TargetPath = 'OU=Workstations,DC=corp,DC=contoso,DC=example' } }
        { Assert-NpiKrbPlannedWrite -Writer $w -Action $move -Plan $plan } | Should -Throw '*isn''t the plan''s OU=Disabled Service Accounts*'
        $move.Params.TargetPath = 'OU=Disabled Service Accounts,DC=corp,DC=contoso,DC=example'; $move.Params.Identity = 'svc-intranet'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action $move -Plan $plan } | Should -Throw '*objectGUID*'
    }
    It 'WD-163: the pipeline never sends a person''s step; a person sends a pipeline step only in a test domain' {
        $t = New-TestWriter
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -RunAs Pipeline -Apply
        @($run.Results | ForEach-Object { "$($_.Action)=$($_.Outcome)" } | Sort-Object -Unique) | Should -Be @('CompleteDmsaMigration=Refused', 'CreateGmsa=Sent', 'SetRetrievers=Sent')
        @($t.Fake.Calls.Cmdlet) | Should -Not -Contain 'Complete-ADServiceAccountMigration'
        $p = New-TestWriter
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $p.Writer -AsOf $script:AsOf -RunAs Person -Apply
        @($run.Results | ForEach-Object { "$($_.Action)=$($_.Outcome)" } | Sort-Object -Unique) | Should -Be @('CompleteDmsaMigration=Sent', 'CreateGmsa=Refused', 'SetRetrievers=Refused')
        @($run.Results | Where-Object Outcome -EQ 'Refused')[0].Detail | Should -Match 'only in a test domain'
        @($p.Fake.Calls.Cmdlet) | Should -Not -Contain 'New-ADServiceAccount'
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer (New-TestWriter).Writer -AsOf $script:AsOf -RunAs Person -TestDomain
        @($run.Results.Outcome | Sort-Object -Unique) | Should -Be @('WouldSend')
        $run.TestDomain | Should -BeTrue
    }
    It 'dry run: runs every precheck and sends nothing' {
        $t = New-TestWriter
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -RunAs Pipeline
        @($run.Results | ForEach-Object { "$($_.RunBy)=$($_.Outcome)" } | Sort-Object -Unique) | Should -Be @('person=Refused', 'pipeline=WouldSend')
        @($t.Fake.Calls | Where-Object { $_.Cmdlet -notmatch '^Get-AD' }) | Should -HaveCount 0
    }
    It '-Apply: creates the gMSAs in the service-account OU, sets the retriever groups, completes the migration and keeps the old account, disabled; each write re-read' {
        $t = New-TestWriter
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -RunAs Pipeline -Apply
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -RunAs Person -Apply
        @($run.Results | Where-Object Outcome -EQ 'Sent').Action | Should -Be @('CompleteDmsaMigration')
        @($run.Results | Where-Object Outcome -EQ 'Sent')[0].Verified | Should -BeTrue
        $sas = $t.Fake.Estate.ad.serviceAccounts
        @($sas | Where-Object SamAccountName -In 'gmsa-print$', 'gmsa-intranet$' | ForEach-Object ObjectClass | Sort-Object -Unique) | Should -Be @('msDS-GroupManagedServiceAccount')
        @($sas | Where-Object SamAccountName -In 'gmsa-print$', 'gmsa-intranet$' | ForEach-Object DistinguishedName | Sort-Object) | Should -Be @('CN=gmsa-intranet,OU=Service Accounts,DC=corp,DC=contoso,DC=example', 'CN=gmsa-print,OU=Service Accounts,DC=corp,DC=contoso,DC=example')
        @($sas | Where-Object SamAccountName -EQ 'gmsa-print$')[0].RestrictToOutboundAuthenticationOnly | Should -BeTrue
        @($sas | Where-Object SamAccountName -EQ 'gmsa-intranet$')[0].RestrictToOutboundAuthenticationOnly | Should -BeFalse
        @(@($sas | Where-Object SamAccountName -EQ 'gmsa-web$')[0].PrincipalsAllowedToRetrieveManagedPassword) | Should -Be @('CN=DL-gMSA-web-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
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
        $run = Invoke-NpiKrbPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $t.Writer -AsOf $script:AsOf -RunAs Person -TestDomain -Apply
        @($run.Results | Where-Object Outcome -EQ 'Skipped').Action | Sort-Object | Should -Be @('CompleteDmsaMigration', 'CreateGmsa', 'SetRetrievers')
    }
    It 'the live invoker refuses any cmdlet the task doesn''t declare' {
        $allowed = @((Get-NpiKrbCall -Task kerberos-apply).cmdlet | Sort-Object -Unique)
        $allowed | Should -Not -Contain 'Remove-ADServiceAccount'
        $allowed | Should -Not -Contain 'Remove-ADObject'
        $allowed | Should -Not -Contain 'Add-ADGroupMember'
        $allowed | Should -Not -Contain 'Add-KdsRootKey'
    }
}

Describe 'Who sends each write (WD-163)' {
    It 'every write call names runBy: the pipeline for the gMSA creation, retrievers, disable and move; a person for the dMSA steps' {
        $by = @{}; foreach ($c in @((Get-NpiKrbCall -Task kerberos-apply) | Where-Object { $_.method -eq 'WRITE' })) { $by[$c.id] = $c.runBy }
        @($by.Keys | Where-Object { $by[$_] -eq 'pipeline' } | Sort-Object) | Should -Be @('krb-disable-superseded', 'krb-move-superseded', 'krb-new-gmsa', 'krb-set-retrievers')
        @($by.Keys | Where-Object { $by[$_] -eq 'person' } | Sort-Object) | Should -Be @('krb-complete-migration', 'krb-new-dmsa', 'krb-start-migration')
        $t = Get-NpiKrbTask -Task kerberos-apply
        $t.pipelineIdentity | Should -Be 'gmsa-msapipe$'
        @($t.runAs) | Should -Be @('Pipeline', 'Person')
        $t.ContainsKey('delegatedOnly') | Should -BeFalse
    }
    It 'every write call names the controls it supports and the KSIs it aligns to, and the move is Move-ADObject, never a delete' {
        foreach ($c in @((Get-NpiKrbCall -Task kerberos-apply) | Where-Object { $_.method -eq 'WRITE' })) { @($c.controls).Count | Should -BeGreaterThan 0 -Because $c.id; @($c.ksis).Count | Should -BeGreaterThan 0 -Because $c.id }
        $m = (Get-NpiKrbCall -Id krb-move-superseded)[0]
        "$($m.cmdlet) $(@($m.allowedParams) -join ',')" | Should -Be 'Move-ADObject Identity,TargetPath'
        $m.learn | Should -Be 'https://learn.microsoft.com/powershell/module/activedirectory/move-adobject'
        @((Get-NpiKrbCall -Id krb-new-gmsa)[0].allowedParams) | Should -Contain 'RestrictToOutboundAuthenticationOnly'
    }
    It 'refuses a missing ad-standard.json, a bad OU in it, and a kerberos-replatform.csv without RequestId, ChangeRecord and OutboundOnlyReason' {
        $dir = Join-Path $script:Tmp ("in-{0}" -f [guid]::NewGuid()); Copy-Item -Recurse $script:Inputs $dir
        Remove-Item (Join-Path $dir 'ad-standard.json')
        { Import-NpiKrbInput -InputPath $dir -MatrixRun $script:Matrix -ProgramDatesPath $script:Dates } | Should -Throw '*Missing reviewed input*ad-standard.json*'
        $s = Get-Content (Join-Path $script:Inputs 'ad-standard.json') -Raw | ConvertFrom-Json -AsHashtable; $s.holdingOu = 'CN=Users,DC=corp,DC=contoso,DC=example'
        [IO.File]::WriteAllText((Join-Path $dir 'ad-standard.json'), ($s | ConvertTo-Json))
        { Import-NpiKrbInput -InputPath $dir -MatrixRun $script:Matrix -ProgramDatesPath $script:Dates } | Should -Throw '*holdingOu must be an OU*'
        Copy-Item (Join-Path $script:Inputs 'ad-standard.json') $dir -Force
        $csv = Import-Csv (Join-Path $script:Inputs 'kerberos-replatform.csv') | Select-Object SamAccountName, NewAccount, Workload, Hosts, SpnOwnerUpn, EndDate, Reference, HostChangedOn, MigrationStartedOn
        $csv | Export-Csv -NoTypeInformation (Join-Path $dir 'kerberos-replatform.csv')
        { Import-NpiKrbInput -InputPath $dir -MatrixRun $script:Matrix -ProgramDatesPath $script:Dates } | Should -Throw '*no OutboundOnlyReason, RequestId, ChangeRecord, Tags column*'
    }
}

Describe 'The entry scripts' {
    It 'read, plan, dry-run and apply against the fixtures, the pipeline''s steps and a person''s, with manifests' {
        $out = Join-Path $script:Tmp 'kerberos'
        $lines = & (Join-Path $script:Root 'Invoke-NpiKerberosIsland.ps1') -Cloud gcc -RegisterRun $script:InvRun -MatrixRun $script:MatRun -ProgramDatesPath $script:Dates -FixturePath $script:Estate -KerberosFixturePath $script:Krb -InputPath $script:Inputs -OutputPath $out
        $lines[0] | Should -Be 'Kerberos accounts: 9 in scope; KDS root key Ready'
        $lines[3] | Should -Be 'Run by: 1 person, 4 pipeline'
        $m = Get-Content (Join-Path $out 'manifest.json') -Raw | ConvertFrom-Json
        $m.task | Should -Be 'kerberos-island'
        $m.files.'kerberos-plan.json' | Should -Be (Get-NpiFileHash -Path (Join-Path $out 'kerberos-plan.json'))
        $m.inputs.'program-dates.json' | Should -Be (Get-NpiFileHash -Path $script:Dates)
        $m.inputs.'decisions.json' | Should -Be $script:Matrix.Sha256
        $m.inputs.'ad-standard.json' | Should -Be (Get-NpiFileHash -Path (Join-Path $script:Inputs 'ad-standard.json'))
        $sha = Get-NpiFileHash -Path (Join-Path $out 'kerberos-plan.json')
        $act = { param([string]$Folder, [string]$As, [switch]$Apply) & (Join-Path $script:Root 'Invoke-NpiKerberosIslandAction.ps1') -PlanPath (Join-Path $out 'kerberos-plan.json') -ApprovedSha256 $sha -RunAs $As -FixturePath $script:Estate -KerberosFixturePath $script:Krb -OutputPath (Join-Path $script:Tmp $Folder) -Apply:$Apply }
        (& $act 'dry' Pipeline)[0] | Should -Be 'DryRun as Pipeline: 1 Refused, 4 WouldSend'
        (& $act 'apply' Pipeline -Apply)[0] | Should -Be 'Apply as Pipeline: 1 Refused, 4 Sent'
        (& $act 'apply-person' Person -Apply)[0] | Should -Be 'Apply as Person: 4 Refused, 1 Sent'
        $am = Get-Content (Join-Path $script:Tmp 'apply/manifest.json') -Raw | ConvertFrom-Json
        $am.planSha256 | Should -Be $sha
        $am.runAs | Should -Be 'Pipeline'
        $res = Get-Content (Join-Path $script:Tmp 'apply/results.json') -Raw | ConvertFrom-Json
        @($res | Where-Object Outcome -EQ 'Sent' | ForEach-Object { "$($_.RequestId)/$($_.ChangeRecord)" }) | Should -Not -Contain '/'
    }
    It 'refuses a register read in another cloud' {
        { & (Join-Path $script:Root 'Invoke-NpiKerberosIsland.ps1') -Cloud global -RegisterRun $script:InvRun -MatrixRun $script:MatRun -ProgramDatesPath $script:Dates -FixturePath $script:Estate -KerberosFixturePath $script:Krb -InputPath $script:Inputs -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw '*not ''global''*'
    }
}
