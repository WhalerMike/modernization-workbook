#Requires -Version 7.1
# A change to an existing managed service account: Chapter 12's check of a RequestKind Change, and Chapter 06's
# change plan (New-NpiKrbChangePlan) through the same hashed write path. Kept outside tests/ so the count that
# Chapters 01 to 10's Lab 1 prints (Invoke-Pester -Path tests) doesn't change; tests/test_msa_change.py runs it.
BeforeAll {
    $script:Kit = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    Import-Module (Join-Path $script:Kit 'powershell/NpiKerberosIsland/NpiKerberosIsland.psm1') -Force
    Import-Module (Join-Path $script:Kit 'powershell/NpiGmsaStandard/NpiGmsaStandard.psm1') -Force
    $script:F = Join-Path $script:Kit 'tests/fixtures/ch06/change'
    $script:Std = Join-Path $script:Kit 'tests/fixtures/ch06/inputs/ad-standard.json'
    $script:Dates = Join-Path $script:Kit 'tests/fixtures/ch03/inputs/program-dates.json'
    $script:Tenant = 'c0ffee00-0000-4000-8000-000000000001'
    $script:AsOf = [datetime]::Parse('2026-11-28T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-chg-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force $script:Tmp | Out-Null
    function Get-Req([string]$Id) { Join-Path $script:F "requests/$Id.json" }
    function New-Fake([switch]$Write) { New-NpiKrbFixtureAdInvoker -EstatePath (Join-Path $script:F 'estate.json') -KerberosPath (Join-Path $script:F 'ad-kerberos.json') -AllowWrite:$Write }
    function New-Plan([string]$RequestPath, $Fake = (New-Fake)) {
        New-NpiKrbChangePlan -RequestPath $RequestPath -AdStandardPath $script:Std -Reader (New-NpiKrbReader -AdInvoke $Fake.Invoke) -TenantId $script:Tenant -Domain corp.contoso.example -Cloud gcc -AsOf $script:AsOf -ProgramDatesPath $script:Dates
    }
    function Save-Plan($Plan) { $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid()); Write-NpiJson -Path $p -Value $Plan; [pscustomobject]@{ Path = $p; Sha = (Get-NpiFileHash -Path $p) } }
    function Edit-Req([string]$Id, [scriptblock]$Change) {
        $q = Get-Content (Get-Req $Id) -Raw | ConvertFrom-Json -AsHashtable; & $Change $q
        $p = Join-Path $script:Tmp ("$Id-{0}.json" -f [guid]::NewGuid()); [IO.File]::WriteAllText($p, ($q | ConvertTo-Json -Depth 5)); $p
    }
    function Invoke-Apply($Plan, [string]$RunAs, $Fake) {
        $s = Save-Plan $Plan
        $w = New-NpiKrbWriter -TenantId $script:Tenant -Domain corp.contoso.example -AdInvoke $Fake.Invoke
        Invoke-NpiKrbPlan -PlanPath $s.Path -ApprovedSha256 $s.Sha -Writer $w -AsOf $script:AsOf.AddHours(1) -RunAs $RunAs -Apply
    }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The calls a change uses (config/calls-ch06.json)' {
    It 'declares each change write for kerberos-apply, run by a person while WD-185 is a draft, with its controls and KSIs' {
        foreach ($id in 'krb-set-retriever-hosts', 'krb-set-dmsa-retrievers', 'krb-add-spn', 'krb-remove-spn', 'krb-set-tags') {
            $c = (Get-NpiKrbCall -Id $id)[0]
            $c.method | Should -Be 'WRITE' -Because $id
            $c.runBy | Should -Be 'person' -Because $id
            @($c.tasks) | Should -Be @('kerberos-apply') -Because $id
            @($c.controls).Count | Should -BeGreaterThan 0 -Because $id
            @($c.ksis).Count | Should -BeGreaterThan 0 -Because $id
        }
        "$((Get-NpiKrbCall -Id krb-add-spn)[0].cmdlet) $(@((Get-NpiKrbCall -Id krb-add-spn)[0].allowedParams) -join ',')" | Should -Be 'setspn S,Account'
        "$((Get-NpiKrbCall -Id krb-remove-spn)[0].cmdlet) $(@((Get-NpiKrbCall -Id krb-remove-spn)[0].allowedParams) -join ',')" | Should -Be 'setspn D,Account'
        (Get-NpiKrbCall -Id krb-retriever-group)[0].cmdlet | Should -Be 'Get-ADGroup'
    }
    It 'still never declares a Remove- cmdlet or Add-ADGroupMember' {
        $all = @((Get-NpiKrbCall -Task kerberos-apply).cmdlet | Sort-Object -Unique)
        @($all | Where-Object { $_ -match '^(Remove|Uninstall|Undo|Reset|Clear)-' }) | Should -HaveCount 0
        $all | Should -Not -Contain 'Add-ADGroupMember'
    }
    It 'each task declares exactly the union of its calls'' rights' {
        foreach ($t in 'kerberos-island', 'kerberos-apply') {
            @((Get-NpiKrbTask -Task $t).adRights | Sort-Object) | Should -Be @((Get-NpiKrbRequiredRight -Task $t).AdRights) -Because $t
        }
    }
}

Describe 'Chapter 12 checks a change request (NPI-STD-09) and hands it on as the request itself' {
    BeforeAll {
        $script:Ch12Std = Import-NpiStdStandard -Path (Join-Path $script:Kit 'tests/fixtures/ch12/standard.json')
        function Get-Wrapped([string]$Path) { [pscustomobject]@{ File = "requests/$(Split-Path -Leaf $Path)"; Request = (Get-Content $Path -Raw | ConvertFrom-Json -AsHashtable) } }
    }
    It 'every fixture change passes, gets no Chapter 06 row and is listed under Changes; changes to one account aren''t a name clash' {
        $reqs = @(Get-ChildItem (Join-Path $script:F 'requests') -Filter *.json | Sort-Object Name | ForEach-Object { Get-Wrapped $_.FullName })
        $r = Test-NpiStdRequest -Requests $reqs -Standard $script:Ch12Std -AsOf 2026-11-27
        @($r.Findings | Where-Object Severity -EQ 'Finding') | Should -HaveCount 0
        @($r.Replatform) | Should -HaveCount 0
        @($r.Retrievers.Keys) | Should -HaveCount 0
        @($r.Changes.ChangeType) | Should -Be @('AddHost', 'RemoveHost', 'AddSpn', 'RemoveSpn', 'Tier', 'EndDate', 'AddHost')
    }
    It 'refuses an unknown change type, a host change with no items, and an end date on an account that isn''t kept on Kerberos' {
        $a = Edit-Req 'REQ-2026-0406' { param($q) $q.changeType = 'Owner' }
        $b = Edit-Req 'REQ-2026-0407' { param($q) $q.changeItems = @() }
        $c = Edit-Req 'REQ-2026-0411' { param($q) $q.entraTarget = 'ManagedIdentity' }
        $r = Test-NpiStdRequest -Requests @((Get-Wrapped $a), (Get-Wrapped $b), (Get-Wrapped $c)) -Standard $script:Ch12Std -AsOf 2026-11-27
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-09') | Should -HaveCount 3
        @($r.Changes) | Should -HaveCount 0
    }
}

Describe 'New-NpiKrbChangePlan: one plan per approved change' {
    It 'AddHost on a gMSA: Set-ADGroup -Replace on its one retriever group with every host after the change, then the host install' {
        $p = New-Plan (Get-Req 'REQ-2026-0406')
        $w = @($p.actions | Where-Object Write)
        $w | Should -HaveCount 1
        $w[0].Action | Should -Be 'SetRetrieverHosts'
        $w[0].Cmdlet | Should -Be 'Set-ADGroup'
        $w[0].RunBy | Should -Be 'person'
        $w[0].Params.Identity | Should -Be 'CN=DL-gMSA-payroll-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example'
        @($w[0].Params.Replace.member) | Should -Be @('CN=PAY01,OU=Servers,DC=corp,DC=contoso,DC=example', 'CN=PAY02,OU=Servers,DC=corp,DC=contoso,DC=example', 'CN=PAY03,OU=Servers,DC=corp,DC=contoso,DC=example')
        @($w[0].Before) | Should -HaveCount 2
        "$($w[0].RequestId) $($w[0].ChangeRecord)" | Should -Be 'REQ-2026-0406 CHG0041206'
        @($p.actions | Where-Object Action -EQ 'AwaitHostInstall').Reason | Should -Match 'Install-ADServiceAccount gmsa-payroll\$'
        $p.change.changeType | Should -Be 'AddHost'
    }
    It 'RemoveHost: the group without the host, then a person uninstalls it; never the last host' {
        $p = New-Plan (Get-Req 'REQ-2026-0407')
        @(@($p.actions | Where-Object Write)[0].Params.Replace.member) | Should -Be @('CN=PAY01,OU=Servers,DC=corp,DC=contoso,DC=example')
        @($p.actions | Where-Object Action -EQ 'AwaitHostUninstall').Reason | Should -Match 'Uninstall-ADServiceAccount gmsa-payroll\$ on PAY02'
        $last = Edit-Req 'REQ-2026-0407' { param($q) $q.hosts = @(); $q.changeItems = @('PAY01', 'PAY02') }
        { New-Plan $last } | Should -Throw '*no host: retire the account*'
    }
    It 'AddHost on a dMSA: its retrievers are its hosts, set by a person' {
        $w = @((New-Plan (Get-Req 'REQ-2026-0412')).actions | Where-Object Write)
        $w[0].Action | Should -Be 'SetDmsaRetrievers'
        $w[0].Cmdlet | Should -Be 'Set-ADServiceAccount'
        @($w[0].Params.PrincipalsAllowedToRetrieveManagedPassword) | Should -HaveCount 2
    }
    It 'AddSpn and RemoveSpn: setspn -S and setspn -D, one action per SPN' {
        $a = @((New-Plan (Get-Req 'REQ-2026-0408')).actions | Where-Object Write)[0]
        "$($a.Cmdlet) -S $($a.Params.S) $($a.Params.Account)" | Should -Be 'setspn -S HTTP/payroll-api.corp.contoso.example gmsa-payroll$'
        $d = @((New-Plan (Get-Req 'REQ-2026-0409')).actions | Where-Object Write)[0]
        "$($d.Cmdlet) -D $($d.Params.D) $($d.Params.Account)" | Should -Be 'setspn -D HTTP/payroll-old.corp.contoso.example gmsa-payroll$'
    }
    It 'Tier: the tags rewritten with the new tier, naming this request and change (WD-175)' {
        $w = @((New-Plan (Get-Req 'REQ-2026-0410')).actions | Where-Object Write)[0]
        $w.Action | Should -Be 'RewriteTags'
        $w.Params.Description | Should -Be 'SystemId=SYS-0412; Owner1=payroll.owner@contoso.example; Owner2=payroll.backup@contoso.example; Sponsor=finance.sponsor@contoso.example; Environment=prod; Tier=R1; EntraTarget=AppRegistrationFederated; Request=REQ-2026-0410; Change=CHG0041210'
        $w.Before | Should -Match 'Tier=R2; .*Request=REQ-2026-0402'
    }
    It 'EndDate: the tags name the change, Chapter 03 records the date, and the date is bounded by the island''s end of life' {
        $p = New-Plan (Get-Req 'REQ-2026-0411')
        @($p.actions.Action) | Should -Be @('RecordEndDate', 'RewriteTags')
        @($p.actions | Where-Object Write)[0].Params.Description | Should -Match 'Tier=R1; EntraTarget=KeepKerberos; Request=REQ-2026-0411; Change=CHG0041211$'
        $p.inputs.Keys | Should -Contain 'program-dates.json'
        $late = Edit-Req 'REQ-2026-0411' { param($q) $q.endDate = '2028-12-31' }
        { New-Plan $late } | Should -Throw "*after the island's end of life (2028-06-30)*"
    }
    It 'the same request and AD give the same plan, byte for byte' {
        (Save-Plan (New-Plan (Get-Req 'REQ-2026-0406'))).Sha | Should -Be (Save-Plan (New-Plan (Get-Req 'REQ-2026-0406'))).Sha
    }
}

Describe 'What New-NpiKrbChangePlan refuses' {
    It 'a request that isn''t approved, has no change record, or isn''t a change' {
        { New-Plan (Edit-Req 'REQ-2026-0406' { param($q) $q.status = 'PENDING' }) } | Should -Throw '*APPROVED*'
        { New-Plan (Edit-Req 'REQ-2026-0406' { param($q) $q.changeRecord = '' }) } | Should -Throw '*change record*'
        { New-Plan (Edit-Req 'REQ-2026-0406' { param($q) $q.requestKind = 'New' }) } | Should -Throw "*isn't Change*"
    }
    It 'an owner change dressed as a tier change, and a tier that doesn''t change' {
        { New-Plan (Edit-Req 'REQ-2026-0410' { param($q) $q.owners = @('someone.else@contoso.example', 'payroll.backup@contoso.example') }) } | Should -Throw '*form 03*'
        { New-Plan (Edit-Req 'REQ-2026-0410' { param($q) $q.riskTier = 'R2' }) } | Should -Throw '*already R2*'
    }
    It 'a request whose list after the change doesn''t match AD with the change applied' {
        { New-Plan (Edit-Req 'REQ-2026-0406' { param($q) $q.hosts = @('PAY01', 'PAY03') }) } | Should -Throw "*aren't AD's retrievers*"
        { New-Plan (Edit-Req 'REQ-2026-0408' { param($q) $q.spns = @('HTTP/payroll-api.corp.contoso.example') }) } | Should -Throw "*aren't AD's SPNs*"
    }
    It 'an SPN already on the account, or not in Learn''s form, and an account that doesn''t exist' {
        { New-Plan (Edit-Req 'REQ-2026-0408' { param($q) $q.changeItems = @('HTTP/payroll.corp.contoso.example') }) } | Should -Throw '*already on gmsa-payroll$*'
        { New-Plan (Edit-Req 'REQ-2026-0408' { param($q) $q.changeItems = @('payroll-api'); $q.spns += 'payroll-api' }) } | Should -Throw "*Learn's*form*"
        { New-Plan (Edit-Req 'REQ-2026-0406' { param($q) $q.proposedName = 'gmsa-payrollx$'; $q.appShortName = 'payrollx' }) } | Should -Throw "*doesn't exist*"
    }
}

Describe 'Applying a change plan: the same write path, by its hash' {
    It 'the pipeline refuses every change write (runBy person); a person sends it, and the re-read shows it' {
        $fake = New-Fake -Write
        $p = New-Plan (Get-Req 'REQ-2026-0406') $fake
        (Invoke-Apply $p 'Pipeline' $fake).Results.Outcome | Should -Be @('Refused')
        $run = Invoke-Apply $p 'Person' $fake
        $run.Results.Outcome | Should -Be @('Sent')
        $run.Results[0].Verified | Should -BeTrue
        @($fake.Extra.groups | Where-Object Name -EQ 'DL-gMSA-payroll-Hosts')[0].member | Should -Contain 'CN=PAY03,OU=Servers,DC=corp,DC=contoso,DC=example'
        @($fake.Calls | Where-Object Cmdlet -EQ 'Set-ADGroup') | Should -HaveCount 1
    }
    It 'setspn -S, setspn -D and the tag rewrite each land and are verified' {
        foreach ($id in 'REQ-2026-0408', 'REQ-2026-0409', 'REQ-2026-0410') {
            $fake = New-Fake -Write
            $run = Invoke-Apply (New-Plan (Get-Req $id) $fake) 'Person' $fake
            @($run.Results | Where-Object Outcome -EQ 'Sent') | Should -HaveCount 1 -Because $id
            $run.Results[0].Verified | Should -BeTrue -Because $id
        }
        $fake = New-Fake -Write
        $null = Invoke-Apply (New-Plan (Get-Req 'REQ-2026-0410') $fake) 'Person' $fake
        @($fake.Estate.ad.serviceAccounts | Where-Object SamAccountName -EQ 'gmsa-payroll$')[0].Description | Should -Match 'Tier=R1; .*Request=REQ-2026-0410'
    }
    It 'skips a write whose account changed after the plan was read' {
        $fake = New-Fake -Write
        $p = New-Plan (Get-Req 'REQ-2026-0406') $fake
        @($fake.Extra.groups | Where-Object Name -EQ 'DL-gMSA-payroll-Hosts')[0].member = @('CN=PAY01,OU=Servers,DC=corp,DC=contoso,DC=example')
        $run = Invoke-Apply $p 'Person' $fake
        $run.Results.Outcome | Should -Be @('Skipped')
        $run.Results[0].Detail | Should -Match 'changed since the plan was reviewed'
    }
    It 'the fake''s setspn -S refuses an SPN another account holds, as setspn does' {
        $fake = New-Fake -Write
        { & $fake.Invoke 'setspn' @{ S = 'HTTP/reports.corp.contoso.example'; Account = 'gmsa-payroll$' } } | Should -Throw '*Duplicate SPN found*'
    }
    It 'the writer refuses a group that isn''t a retriever group, an empty one, and tags naming another request' {
        $fake = New-Fake -Write
        $w = New-NpiKrbWriter -TenantId $script:Tenant -Domain corp.contoso.example -AdInvoke $fake.Invoke
        $p = New-Plan (Get-Req 'REQ-2026-0406') $fake
        $a = @($p.actions | Where-Object Write)[0]
        $a.Params.Identity = 'CN=Domain Admins,CN=Users,DC=corp,DC=contoso,DC=example'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action $a -Plan $p } | Should -Throw '*retriever group*'
        $a = @((New-Plan (Get-Req 'REQ-2026-0406') $fake).actions | Where-Object Write)[0]; $a.Params.Replace.member = @()
        { Assert-NpiKrbPlannedWrite -Writer $w -Action $a -Plan $p } | Should -Throw '*empty retriever group*'
        $t = @((New-Plan (Get-Req 'REQ-2026-0410') $fake).actions | Where-Object Write)[0]; $t.RequestId = 'REQ-2026-0999'
        { Assert-NpiKrbPlannedWrite -Writer $w -Action $t -Plan $p } | Should -Throw '*tags name request*'
    }
    It 'the entry scripts build the plan and apply it, against the fixtures' {
        $out = Join-Path $script:Tmp 'entry'
        Push-Location $script:Kit
        try {
            $text = & ./Invoke-NpiKerberosChange.ps1 -RequestPath tests/fixtures/ch06/change/requests/REQ-2026-0408.json -AdStandardPath tests/fixtures/ch06/inputs/ad-standard.json -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json -Cloud gcc -TenantId $script:Tenant -Domain corp.contoso.example -FixturePath tests/fixtures/ch06/change/estate.json -KerberosFixturePath tests/fixtures/ch06/change/ad-kerberos.json -AsOf 2026-11-28T12:00:00Z -OutputPath $out
            $text[0] | Should -Match '^REQ-2026-0408 AddSpn on gmsa-payroll\$: 1 write\(s\), SHA-256 [0-9a-f]{64}$'
            Join-Path $out 'manifest.json' | Should -Exist
            $sha = (Get-FileHash -Algorithm SHA256 (Join-Path $out 'change-plan.json')).Hash.ToLowerInvariant()
            $apply = & ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath (Join-Path $out 'change-plan.json') -ApprovedSha256 $sha -RunAs Person -FixturePath tests/fixtures/ch06/change/estate.json -KerberosFixturePath tests/fixtures/ch06/change/ad-kerberos.json -OutputPath (Join-Path $script:Tmp 'entry-apply') -Apply
            $apply[0] | Should -Be 'Apply as Person: 1 Sent'
        } finally { Pop-Location }
    }
}
