#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 12: the managed service account standard, against the fictional estate's requests,
# SailPoint aggregation, AD read, register, certification decisions and Defender for Identity list
# (tests/fixtures/ch12). No domain, tenant or network.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiGmsaStandard/NpiGmsaStandard.psm1') -Force
    $script:Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Fix = Join-Path $PSScriptRoot 'fixtures/ch12'
    $script:InputPath = Join-Path $script:Fix 'inputs'
    $script:StdPath = Join-Path $script:Fix 'standard.json'
    $script:AsOf = [datetime]'2026-11-20'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-std-{0}" -f [guid]::NewGuid())
    $script:Std = Import-NpiStdStandard -Path $script:StdPath
    $script:In = Import-NpiStdInput -InputPath $script:InputPath
    $script:Run = Invoke-NpiStdRun -Inputs $script:In -Standard $script:Std -AsOf $script:AsOf
    function Get-Rule([string]$Rule) { @($script:Run.Findings | Where-Object Rule -EQ $Rule) }
    function Copy-Inputs {
        # A copy of the input folder for one test to change.
        $d = Join-Path $script:Tmp ("in-{0}" -f [guid]::NewGuid())
        New-Item -ItemType Directory -Force $d | Out-Null
        Copy-Item -Recurse (Join-Path $script:InputPath '*') $d
        $d
    }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The call list (config/calls-ch12.json) and the requirements (config/requirements-ch12.json)' {
    It 'every task''s declared rights are exactly the union of its calls, and the only call is a Get-AD* read' {
        $list = Get-NpiStdCallList
        foreach ($task in $list.tasks.Keys) {
            $calls = @($list.calls | Where-Object { $_.tasks -contains $task })
            $calls.Count | Should -BeGreaterThan 0
            $list.tasks[$task].mode | Should -Be 'read'
            @($list.tasks[$task].adRights | Sort-Object) | Should -Be @($calls | ForEach-Object { $_.adRight } | Sort-Object -Unique)
            @($list.tasks[$task].graphPermissions).Count | Should -Be 0
            @($list.tasks[$task].azureRoles).Count | Should -Be 0
        }
        foreach ($c in $list.calls) { $c.method | Should -Be 'READ'; $c.cmdlet | Should -Match '^Get-AD'; $c.learn | Should -Match '^https://learn\.microsoft\.com/'; $c.stage | Should -Not -BeNullOrEmpty }
    }
    It 'its call and task ids collide with no other chapter''s call list' {
        $ours = Get-NpiStdCallList
        $mine = @($ours.calls.id) + @($ours.tasks.Keys)
        foreach ($file in Get-ChildItem (Join-Path $script:Root 'config') -Filter 'calls*.json' | Where-Object Name -NE 'calls-ch12.json') {
            $other = Get-Content $file.FullName -Raw | ConvertFrom-Json -AsHashtable
            $theirs = @($other.calls | ForEach-Object { $_.id }) + @($other.tasks.Keys)
            foreach ($id in $mine) { $theirs | Should -Not -Contain $id -Because $file.Name }
        }
    }
    It 'every step names controls the catalog maps to KSIs, and evidence files the run writes' {
        $req = Get-NpiStdRequirement
        $req.source.url | Should -Be 'https://www.fedramp.gov/2026/reference/key-security-indicators/'
        $req.steps.Keys | Should -Be @('request-check', 'create-inputs', 'reconciliation', 'certification', 'mdi', 'retirement')
        foreach ($s in $req.steps.Keys) {
            foreach ($c in $req.steps[$s].controls) { $req.controls.ContainsKey($c) | Should -BeTrue -Because "$s $c"; @($req.controls[$c].ksis).Count | Should -BeGreaterThan 0; foreach ($k in $req.controls[$c].ksis) { $k | Should -Match '^KSI-[A-Z]{3}-[A-Z]{3}$' } }
        }
        $req.controls['AC-2'].primaryKsi | Should -Be 'KSI-IAM-SNU'
        $req.controls['IA-4'].ksis | Should -Be @('KSI-IAM-ELP', 'KSI-IAM-JIT')
        $req.controls['AC-2(3)'].ksis | Should -Be @('KSI-IAM-AAM', 'KSI-IAM-JIT', 'KSI-IAM-SUS')
        $req.steps['certification'].controls | Should -Be @('AC-2', 'AC-6(7)')
    }
    It 'the live invoker and the AD export run only the declared Get-ADServiceAccount read' {
        (Get-NpiStdRequiredRight).Cmdlets | Should -Be @('Get-ADServiceAccount')
        $seen = [Collections.Generic.List[string]]::new()
        $fake = { param($Cmdlet, [hashtable]$Params) $seen.Add($Cmdlet); $seen.Add("props:$($Params.Properties -join ',')")
            [pscustomobject]@{ SamAccountName = 'gmsa-intranet$'; ObjectClass = 'msDS-GroupManagedServiceAccount'; Enabled = $true; whenCreated = [datetime]'2026-03-02T15:00:00Z'
                'msDS-ManagedPasswordInterval' = 30; KerberosEncryptionType = 'AES256'; PrincipalsAllowedToRetrieveManagedPassword = @('CN=DL-gMSA-intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
                ServicePrincipalNames = @('HTTP/intranet.corp.contoso.example'); MemberOf = @(); DistinguishedName = 'CN=gmsa-intranet,OU=Service Accounts,DC=corp,DC=contoso,DC=example'; lastLogonTimestamp = [datetime]::Parse('2026-11-19T03:00:00Z').ToFileTimeUtc() }
            [pscustomobject]@{ SamAccountName = 'msa-print01$'; ObjectClass = 'msDS-ManagedServiceAccount' }
        }.GetNewClosure()
        $p = Join-Path $script:Tmp 'ad-read/ad-managed-accounts.json'
        $x = Export-NpiStdAdManagedAccount -AdInvoke $fake -Path $p
        $seen[0] | Should -Be 'Get-ADServiceAccount'
        $seen[1] | Should -Match 'msDS-ManagedAccountPrecededByLink'   # a dMSA's link to the account it superseded
        $seen.Count | Should -Be 2
        @($script:In.Ad | Where-Object { $_.name -eq 'dmsa-hrsync$' })[0].'msDS-ManagedAccountPrecededByLink' | Should -Match '^CN=svc-hrsync,'
        $x.Evidence[0].Call | Should -Be 'std-managed-accounts'
        $rows = @((Get-Content $p -Raw | ConvertFrom-Json -AsHashtable).accounts)
        $rows.Count | Should -Be 1
        $rows[0].name | Should -Be 'gmsa-intranet$'
        (ConvertTo-NpiStdDate $rows[0].lastLogonTimestamp).ToString('o') | Should -Be '2026-11-19T03:00:00.0000000Z'
        $rows[0].ContainsKey('RestrictToOutboundAuthenticationOnly') | Should -BeTrue
        $rows[0].RestrictToOutboundAuthenticationOnly | Should -BeNullOrEmpty
    }
}

Describe 'The request check (NPI-STD-01 to NPI-STD-09)' {
    It 'passes the two good requests and holds the three bad ones' {
        @($script:Run.Requests.Results | Where-Object Passed | ForEach-Object RequestId) | Should -Be @('REQ-2026-0201', 'REQ-2026-0202')
        @($script:Run.Requests.Results | Where-Object { -not $_.Passed } | ForEach-Object RequestId) | Should -Be @('REQ-2026-0203', 'REQ-2026-0204', 'REQ-2026-0205')
    }
    It 'NPI-STD-01 and 02: not approved in SailPoint, no change record' {
        (Get-Rule 'NPI-STD-01').ObjectKey | Should -Be @('REQ-2026-0203')
        (Get-Rule 'NPI-STD-01')[0].Issue | Should -Match 'PENDING'
        (Get-Rule 'NPI-STD-02').ObjectKey | Should -Be @('REQ-2026-0203')
    }
    It 'NPI-STD-01 also catches an APPROVED status with no approver, or an approval dated after the run' {
        $q = @{ requestId = 'X'; status = 'APPROVED'; approvedOn = '2026-11-25'; requestedOn = '2026-11-01'; approvers = @('a@contoso.example') }
        $r = Test-NpiStdRequest -Requests @([pscustomobject]@{ File = 'x.json'; Request = $q }) -Standard $script:Std -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-01').Count | Should -Be 1
        $q.approvedOn = '2026-11-05'; $q.approvers = @()
        $r = Test-NpiStdRequest -Requests @([pscustomobject]@{ File = 'x.json'; Request = $q }) -Standard $script:Std -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-01')[0].Issue | Should -Match 'no approvers'
    }
    It 'NPI-STD-03 to 06: a 16-character name, one owner, a sponsor who is that owner and not a federal employee, a non-DL retriever group' {
        (Get-Rule 'NPI-STD-03').ObjectKey | Should -Be @('REQ-2026-0204')
        (Get-Rule 'NPI-STD-03')[0].Issue | Should -Match '16 characters'
        (Get-Rule 'NPI-STD-04').ObjectKey | Should -Be @('REQ-2026-0204')
        (Get-Rule 'NPI-STD-05')[0].Issue | Should -Match 'federal employee.*also an owner'
        (Get-Rule 'NPI-STD-06').ObjectKey | Should -Be @('REQ-2026-0204')
        (Get-Rule 'NPI-STD-06')[0].Issue | Should -Match 'GG-gMSA-procurement-Hosts'
    }
    It 'NPI-STD-03 refuses a prefix that doesn''t match the type or the app short name' {
        $q = (Get-Content (Join-Path $script:InputPath 'requests/REQ-2026-0201.json') -Raw | ConvertFrom-Json -AsHashtable)
        $q.proposedName = 'dmsa-payroll$'
        $r = Test-NpiStdRequest -Requests @([pscustomobject]@{ File = 'x.json'; Request = $q }) -Standard $script:Std -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-03')[0].Issue | Should -Match 'expected gmsa-payroll'
        $q.proposedName = 'gmsa-payroll-api$'
        $r = Test-NpiStdRequest -Requests @([pscustomobject]@{ File = 'x.json'; Request = $q }) -Standard $script:Std -AsOf $script:AsOf
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-03').Count | Should -Be 1   # 16 characters with the role suffix
        $q.proposedName = 'gmsa-payroll-a$'
        $r = Test-NpiStdRequest -Requests @([pscustomobject]@{ File = 'x.json'; Request = $q }) -Standard $script:Std -AsOf $script:AsOf
        @($r.Findings).Count | Should -Be 0
    }
    It 'NPI-STD-07 to 09: needsSpn with no SPN, a dMSA not run by a person, an unknown risk tier' {
        foreach ($rule in 'NPI-STD-07', 'NPI-STD-08', 'NPI-STD-09') { (Get-Rule $rule).ObjectKey | Should -Be @('REQ-2026-0205') -Because $rule }
        (Get-Rule 'NPI-STD-08')[0].Issue | Should -Match 'runByPerson'
        (Get-Rule 'NPI-STD-09')[0].Issue | Should -Match 'R4'
    }
    It 'writes kerberos-replatform.csv rows with Chapter 06''s exact header and a DL-gMSA-<app>-Hosts retriever per passing request' {
        $csv = ConvertTo-NpiStdReplatformCsv -Rows $script:Run.Requests.Replatform
        ($csv -split "`n")[0] | Should -BeExactly '"SamAccountName","NewAccount","Workload","Hosts","SpnOwnerUpn","EndDate","Reference","HostChangedOn","MigrationStartedOn","OutboundOnlyReason","RequestId","ChangeRecord"'
        (ConvertTo-NpiStdReplatformCsv -Rows @()) | Should -BeExactly (($csv -split "`n")[0] + "`n")
        $rows = @($csv | ConvertFrom-Csv)
        @($rows | ForEach-Object NewAccount) | Should -Be @('dmsa-billing$', 'gmsa-payroll$')
        $p = @($rows | Where-Object NewAccount -EQ 'gmsa-payroll$')[0]
        "$($p.SamAccountName)|$($p.Hosts)|$($p.SpnOwnerUpn)|$($p.RequestId)|$($p.ChangeRecord)" | Should -Be 'svc-payroll|PAY01;PAY02|payroll.owner@contoso.example|REQ-2026-0201|CHG0041201'
        @($rows | Where-Object NewAccount -EQ 'dmsa-billing$')[0].SpnOwnerUpn | Should -Be ''
        $script:Run.Requests.Retrievers['gmsa-payroll$'] | Should -Be @('CN=DL-gMSA-payroll-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
        @($script:Run.Requests.Retrievers.Keys) | Should -Be @('gmsa-payroll$')   # a dMSA learns its hosts during its migration
        $script:Run.Requests.RetrieverRequests['gmsa-payroll$'].requestId | Should -Be 'REQ-2026-0201'
        $script:Run.Requests.RetrieverRequests['gmsa-payroll$'].changeRecord | Should -Be 'CHG0041201'
    }
}

Describe 'SailPoint and Active Directory (NPI-STD-10 to NPI-STD-19)' {
    It 'flags each account for the rule it breaks' {
        $want = [ordered]@{
            'NPI-STD-10' = @('gmsa-ops$'); 'NPI-STD-11' = @('gmsa-web$'); 'NPI-STD-12' = @('gmsa-print$'); 'NPI-STD-13' = @('gmsa-web$'); 'NPI-STD-14' = @('gmsa-web$')
            'NPI-STD-15' = @('gmsa-print$'); 'NPI-STD-16' = @('gmsa-ops$'); 'NPI-STD-17' = @('gmsa-web$'); 'NPI-STD-18' = @('gmsa-ops$'); 'NPI-STD-19' = @('gmsa-sql$')
        }
        foreach ($k in $want.Keys) { @((Get-Rule $k).ObjectKey) | Should -Be $want[$k] -Because $k }
        (Get-Rule 'NPI-STD-16')[0].Issue | Should -Match 'Domain Admins'
        (Get-Rule 'NPI-STD-18')[0].Issue | Should -Match 'Drift'
        @($script:Run.Reconciliation.Rows | Where-Object Account -EQ 'gmsa-intranet$')[0].Owner | Should -Be 'intranet.owner@contoso.example'
    }
    It 'NPI-STD-12 refuses a second group or a DL group outside the group OU' {
        $a = @{ name = 'gmsa-intranet$'; objectClass = 'msDS-GroupManagedServiceAccount'; enabled = $true; 'msDS-ManagedPasswordInterval' = 30; KerberosEncryptionType = @('AES256')
            PrincipalsAllowedToRetrieveManagedPassword = @('CN=DL-gMSA-intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example', 'CN=WEB01,OU=Servers,DC=corp,DC=contoso,DC=example')
            ServicePrincipalNames = @('HTTP/x'); memberOf = @(); distinguishedName = 'CN=gmsa-intranet,OU=Service Accounts,DC=corp,DC=contoso,DC=example'; RestrictToOutboundAuthenticationOnly = $false }
        $r = Test-NpiStdReconciliation -Ad @($a) -SailPoint $script:In.SailPoint -Register $script:In.Register -Standard $script:Std
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-12').Count | Should -Be 1
        $a.PrincipalsAllowedToRetrieveManagedPassword = @('CN=DL-gMSA-intranet-Hosts,OU=Elsewhere,DC=corp,DC=contoso,DC=example')
        $r = Test-NpiStdReconciliation -Ad @($a) -SailPoint $script:In.SailPoint -Register $script:In.Register -Standard $script:Std
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-12').Count | Should -Be 1
        $a.PrincipalsAllowedToRetrieveManagedPassword = @('CN=DL-gMSA-intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
        $r = Test-NpiStdReconciliation -Ad @($a) -SailPoint $script:In.SailPoint -Register $script:In.Register -Standard $script:Std
        @($r.Findings | Where-Object Rule -NE 'NPI-STD-19').Count | Should -Be 0   # 19: the other aggregated accounts aren't in this one-account read
    }
    It 'NPI-STD-12 doesn''t apply to a dMSA, which keeps the hosts it learned' {
        $h = @($script:Run.Reconciliation.Rows | Where-Object Account -EQ 'dmsa-hrsync$')[0]
        $h.Retrievers | Should -Be @('CN=HR01,OU=Servers,DC=corp,DC=contoso,DC=example')
        @($script:Run.Findings | Where-Object { $_.ObjectKey -eq 'dmsa-hrsync$' -and $_.Rule -eq 'NPI-STD-12' }).Count | Should -Be 0
    }
    It 'NPI-STD-15: a recorded reason clears it, and an unknown outbound-only state is a Warn' {
        $print = @($script:In.Ad | Where-Object { $_.name -eq 'gmsa-print$' })
        $r = Test-NpiStdReconciliation -Ad $print -SailPoint $script:In.SailPoint -Register $script:In.Register -Standard $script:Std -OutboundOnlyReasons @{ 'gmsa-print$' = 'Print clients authenticate to it by name' }
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-15').Count | Should -Be 0
        $copy = @{} + $print[0]; $copy.RestrictToOutboundAuthenticationOnly = $null
        $r = Test-NpiStdReconciliation -Ad @($copy) -SailPoint $script:In.SailPoint -Register $script:In.Register -Standard $script:Std
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-15')[0].Severity | Should -Be 'Warn'
    }
}

Describe 'Certification (NPI-STD-20 to NPI-STD-23)' {
    It 'computes due dates by risk tier and skips disabled accounts' {
        $rows = @{}; foreach ($r in $script:Run.Certification.Rows) { $rows[$r.Account] = $r }
        $rows.Keys | Sort-Object | Should -Be @('dmsa-hrsync$', 'gmsa-intranet$', 'gmsa-print$', 'gmsa-web$')
        "$($rows['gmsa-print$'].DueOn) $($rows['gmsa-print$'].Status)" | Should -Be '2026-10-15 Overdue'
        "$($rows['gmsa-intranet$'].DueOn) $($rows['gmsa-intranet$'].Status)" | Should -Be '2026-12-01 DueSoon'
        "$($rows['gmsa-web$'].DueOn) $($rows['gmsa-web$'].Status)" | Should -Be '2027-01-01 Current'
        "$($rows['dmsa-hrsync$'].DueOn) $($rows['dmsa-hrsync$'].Status)" | Should -Be '2026-12-18 DueSoon'   # never certified: from CreatedOn
        (Get-Rule 'NPI-STD-20').ObjectKey | Should -Be @('gmsa-print$')
        @((Get-Rule 'NPI-STD-21').ObjectKey) | Should -Be @('dmsa-hrsync$', 'gmsa-intranet$')
    }
    It 'NPI-STD-22: a REVOKE becomes a stale_access finding in the integration kit''s payload shape' {
        (Get-Rule 'NPI-STD-22').ObjectKey | Should -Be @('gmsa-print$|CAMP-2026-ANNUAL-R3')
        $p = @($script:Run.Certification.ServiceNow | Where-Object drift_class -EQ 'stale_access')
        $p.Count | Should -Be 1
        $p[0].kind | Should -Be 'finding'; $p[0].severity | Should -Be 'P2'; $p[0].system | Should -Be 'isc_account'
        $p[0].account_id | Should -Be '2c9180a0000000000000000000000102'
        $p[0].intended_state.disabled | Should -BeTrue
        $p[0].origin.finding_id | Should -Be 'NPI-STD-22:gmsa-print$|CAMP-2026-ANNUAL-R3'
        # finding_contract.py's rules: a known class, P1 to P4, a subject, an origin, a known system.
        $contract = Get-Content (Join-Path $script:Root '../servicenow-sailpoint/clients/python/finding_contract.py') -Raw
        foreach ($x in $script:Run.Certification.ServiceNow) {
            $contract | Should -Match ('"' + $x.drift_class + '"')
            $contract | Should -Match ('"' + $x.system + '"')
            ($x.PSObject.Properties.Name -contains 'account_id' -or $x.PSObject.Properties.Name -contains 'subject_id') | Should -BeTrue
            $x.origin.finding_id | Should -Not -BeNullOrEmpty
        }
        @($script:Run.Certification.ServiceNow | Where-Object drift_class -EQ 'orphan_account').account_name | Should -Be @('gmsa-web$')
    }
    It 'NPI-STD-23: a decision by someone who isn''t an owner doesn''t count' {
        (Get-Rule 'NPI-STD-23').ObjectKey | Should -Be @('gmsa-web$|CAMP-2026-Q4-R1|comms.sponsor@contoso.example')
        @($script:Run.Certification.Rows | Where-Object Account -EQ 'gmsa-web$')[0].LastCertifiedOn | Should -Be '2026-10-01'
    }
}

Describe 'Defender for Identity (NPI-STD-24 to NPI-STD-26)' {
    It 'flags the user-type service account, the sMSA and what the register doesn''t hold, and only lists a honey token' {
        (Get-Rule 'NPI-STD-24').ObjectKey | Should -Be @('svc-backup')
        (Get-Rule 'NPI-STD-25').ObjectKey | Should -Be @('msa-print01$')
        @((Get-Rule 'NPI-STD-26').ObjectKey) | Should -Be @('gmsa-ops$', 'msa-print01$', 'svc-backup')
        @($script:Run.Findings | Where-Object ObjectKey -EQ 'svc-decoy').Count | Should -Be 0
        @($script:Run.Mdi.Rows | Where-Object AccountName -EQ 'svc-decoy')[0].HoneyToken | Should -BeTrue
    }
}

Describe 'The retirement window (NPI-STD-27 to NPI-STD-29)' {
    It 'lists a DeleteCandidate only after 90 days disabled with no sign-in since, never an account a dMSA superseded, and never deletes' {
        $rows = @{}; foreach ($r in $script:Run.Retirement.Rows) { $rows[$r.SamAccountName] = $r }
        "$($rows['gmsa-legacy$'].Status) $($rows['gmsa-legacy$'].DaysDisabled)" | Should -Be 'DeleteCandidate 111'
        $rows['gmsa-oldfax$'].Status | Should -Be 'Wait'
        $rows['gmsa-oldfax$'].EarliestDeleteOn | Should -Be '2026-12-30'
        $rows['gmsa-batch$'].Status | Should -Be 'SignInSinceDisable'
        $rows['gmsa-report$'].Status | Should -Be 'EnabledInAd'
        (Get-Rule 'NPI-STD-27').ObjectKey | Should -Be @('gmsa-legacy$')
        (Get-Rule 'NPI-STD-28').ObjectKey | Should -Be @('gmsa-batch$')
        @((Get-Rule 'NPI-STD-29') | Where-Object Severity -EQ 'Finding').ObjectKey | Should -Be @('gmsa-report$')
        foreach ($r in $script:Run.Retirement.Rows) { $r.RunBy | Should -Match 'never deletes' }
        # An account a dMSA superseded is never a delete candidate, however long it has been disabled (Learn).
        $asOf = [datetime]::SpecifyKind([datetime]'2026-11-20', 'Utc')
        $reg = @([pscustomobject]@{ SamAccountName = 'svc-hrsync'; DisabledOn = '2026-05-01' }, [pscustomobject]@{ SamAccountName = 'gmsa-legacy$'; DisabledOn = '2026-08-01' })
        $ad = @(@{ name = 'dmsa-hrsync$'; enabled = $true; 'msDS-ManagedAccountPrecededByLink' = 'CN=svc-hrsync,OU=Service Accounts,DC=corp,DC=contoso,DC=example' },
            @{ name = 'gmsa-legacy$'; enabled = $false; lastLogonTimestamp = '2026-07-30T00:00:00Z' })
        $r = Get-NpiStdRetirementList -Register $reg -Ad $ad -AsOf $asOf
        $row = @($r.Rows | Where-Object SamAccountName -EQ 'svc-hrsync')[0]
        "$($row.Status) $($row.DaysDisabled)" | Should -Be 'SupersededByDmsa 203'
        $row.EarliestDeleteOn | Should -BeNullOrEmpty
        $row.RunBy | Should -Match 'dmsa-hrsync\$.*isn''t deleted'
        @($r.Findings | Where-Object ObjectKey -EQ 'svc-hrsync').Count | Should -Be 0
        (@($r.Findings | Where-Object Rule -EQ 'NPI-STD-27')).ObjectKey | Should -Be @('gmsa-legacy$')
        # The same account found from its own attributes, when a read returns it.
        $ad2 = @(@{ name = 'svc-hrsync'; enabled = $false; 'msDS-SupersededManagedServiceAccountLink' = 'CN=dmsa-hrsync,OU=Service Accounts,DC=corp,DC=contoso,DC=example'; 'msDS-SupersededServiceAccountState' = 2 })
        $r2 = Get-NpiStdRetirementList -Register @($reg[0]) -Ad $ad2 -AsOf $asOf
        $r2.Rows[0].Status | Should -Be 'SupersededByDmsa'
        @($r2.Findings).Count | Should -Be 0
        $r3 = Get-NpiStdRetirementList -Register @($reg[0]) -Ad @(@{ name = 'svc-hrsync'; enabled = $false; 'msDS-SupersededAccountState' = 1 }) -AsOf $asOf
        $r3.Rows[0].Status | Should -Be 'SupersededByDmsa'
    }
    It 'at exactly 89 days it waits; disabled in AD with no date in the register is a Warn' {
        $reg = @([pscustomobject]@{ SamAccountName = 'gmsa-oldfax$'; DisabledOn = '2026-08-23' })
        $ad = @(@{ name = 'gmsa-oldfax$'; enabled = $false; lastLogonTimestamp = '2026-08-01T00:00:00Z' }, @{ name = 'gmsa-x$'; enabled = $false; lastLogonTimestamp = $null })
        $r = Get-NpiStdRetirementList -Register $reg -Ad $ad -AsOf ([datetime]::SpecifyKind([datetime]'2026-11-20', 'Utc'))
        @($r.Rows | Where-Object SamAccountName -EQ 'gmsa-oldfax$')[0].Status | Should -Be 'Wait'
        @($r.Rows | Where-Object SamAccountName -EQ 'gmsa-x$')[0].Status | Should -Be 'NoDisabledDate'
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-29')[0].Severity | Should -Be 'Warn'
    }
}

Describe 'Every finding ID' {
    It 'the fixture run raises each of NPI-STD-01 to NPI-STD-29, and nothing else' {
        $ids = 1..29 | ForEach-Object { 'NPI-STD-{0:00}' -f $_ }
        @($script:Run.Findings | ForEach-Object Rule | Sort-Object -Unique) | Should -Be $ids
        foreach ($f in $script:Run.Findings) { $f.Id | Should -Be "$($f.Rule):$($f.ObjectKey)"; $f.Severity | Should -BeIn @('Finding', 'Warn', 'Info') }
    }
}

Describe 'The run folder' {
    BeforeAll {
        $script:OutA = Join-Path $script:Tmp 'run-a'; $script:OutB = Join-Path $script:Tmp 'run-b'
        $null = & (Join-Path $script:Root 'Invoke-NpiGmsaStandard.ps1') -InputPath $script:InputPath -StandardPath $script:StdPath -OutputPath $script:OutA -AsOf 2026-11-20
        $null = & (Join-Path $script:Root 'Invoke-NpiGmsaStandard.ps1') -InputPath $script:InputPath -StandardPath $script:StdPath -OutputPath $script:OutB -AsOf 2026-11-20
        $script:Manifest = Get-Content (Join-Path $script:OutA 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
    }
    It 'writes every file, and the manifest records each output''s and each input''s SHA-256' {
        $names = @('certification.json', 'evidence.json', 'findings.json', 'kerberos-replatform.csv', 'mdi.json', 'password-retrievers.json', 'reconciliation.json', 'request-check.json', 'retirement-list.csv', 'servicenow-findings.json')
        @($script:Manifest.files.Keys | Sort-Object) | Should -Be $names
        foreach ($n in $names) { Get-NpiFileHash -Path (Join-Path $script:OutA $n) | Should -Be $script:Manifest.files[$n] -Because $n }
        $script:Manifest.inputs.Keys | Should -Contain 'requests/REQ-2026-0201.json'
        foreach ($k in 'sailpoint-accounts.csv', 'ad-managed-accounts.json', 'msa-register.csv', 'certification-decisions.csv', 'mdi-service-accounts.csv') { $script:Manifest.inputs[$k] | Should -Be (Get-NpiFileHash -Path (Join-Path $script:InputPath $k)) }
        $script:Manifest.inputs['standard.json'] | Should -Be (Get-NpiFileHash -Path $script:StdPath)
        "$($script:Manifest.task) $($script:Manifest.asOf) $($script:Manifest.moduleVersion) $($script:Manifest.mode)" | Should -Be 'msa-standard 2026-11-20 1.0.0 Files'
    }
    It 'Chapter 06 can read the generated password-retrievers.json the way it reads its own' {
        $doc = Get-Content (Join-Path $script:OutA 'password-retrievers.json') -Raw | ConvertFrom-Json -AsHashtable
        $doc.accounts['gmsa-payroll$'] | Should -Be @('CN=DL-gMSA-payroll-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example')
        $doc.accounts.ContainsKey('dmsa-billing$') | Should -BeFalse
        $doc.requests['gmsa-payroll$'].changeRecord | Should -Be 'CHG0041201'
        (Get-Content (Join-Path $script:OutA 'kerberos-replatform.csv') -TotalCount 1) | Should -BeExactly '"SamAccountName","NewAccount","Workload","Hosts","SpnOwnerUpn","EndDate","Reference","HostChangedOn","MigrationStartedOn","OutboundOnlyReason","RequestId","ChangeRecord"'
    }
    It 'evidence.json has one row per step, control and evidence file, with that file''s SHA-256 and the catalog''s KSIs' {
        $ev = (Get-Content (Join-Path $script:OutA 'evidence.json') -Raw | ConvertFrom-Json -AsHashtable).rows
        $req = Get-NpiStdRequirement
        $expected = 0; foreach ($s in $req.steps.Values) { $expected += @($s.controls).Count * @($s.evidence).Count }
        @($ev).Count | Should -Be $expected
        foreach ($r in $ev) {
            $r.sha256 | Should -Be $script:Manifest.files[$r.evidence]
            @($r.ksi) | Should -Be @($req.controls[$r.control].ksis)
        }
        @($ev | Where-Object { $_.step -eq 'retirement' }).control | Should -Be 'AC-2(3)'
        @($ev | Where-Object { $_.step -eq 'mdi' } | ForEach-Object control | Sort-Object -Unique) | Should -Be @('CA-7', 'SI-4')
    }
    It 'is deterministic: two runs with the same inputs and -AsOf write byte-identical files' {
        foreach ($f in Get-ChildItem $script:OutA -File) { Get-NpiFileHash -Path $f.FullName | Should -Be (Get-NpiFileHash -Path (Join-Path $script:OutB $f.Name)) -Because $f.Name }
    }
    It 'refuses a missing input or a standard file without its OU' {
        $d = Copy-Inputs; Remove-Item (Join-Path $d 'mdi-service-accounts.csv')
        { Import-NpiStdInput -InputPath $d } | Should -Throw '*Missing input*'
        $p = Join-Path $script:Tmp 'std-bad.json'; '{ "domain": "corp.contoso.example", "groupOu": "OU=Groups,DC=corp,DC=contoso,DC=example" }' | Set-Content $p
        { Import-NpiStdStandard -Path $p } | Should -Throw '*serviceAccountOu*'
    }
}
