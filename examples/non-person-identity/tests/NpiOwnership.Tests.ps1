#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Chapter 02: the ownership check over Chapter 01's register, the orphan rule as a dry-run plan,
# and the separate write path, against the fictional estate served by the fakes.

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '../powershell/NpiOwnership/NpiOwnership.psm1') -Force
    $script:Root = Join-Path $PSScriptRoot '..'
    $script:Fixture = (Resolve-Path (Join-Path $PSScriptRoot 'fixtures/estate.json')).Path
    $script:Inputs = Join-Path $PSScriptRoot 'fixtures/inputs'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("npi-own-{0}" -f [guid]::NewGuid())
    $script:InvRun = Join-Path $script:Tmp 'inventory'
    $null = & (Join-Path $script:Root 'Invoke-NpiInventory.ps1') -Cloud gcc -FixturePath $script:Fixture -OutputPath $script:InvRun
    $script:Register = Import-NpiRegister -RunPath $script:InvRun
    $script:AsOf = [datetime]::Parse('2026-10-30T12:00:00Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal)
    $script:TenantId = $script:Register.Manifest.tenantId
    function New-TestReader { $fake = New-NpiFixtureInvoker -Path $script:Fixture; [pscustomobject]@{ Fake = $fake; Reader = (New-NpiReader -Cloud gcc -Task ownership -Invoke $fake.Invoke) } }
    function Get-TestOwnership([object[]]$Rows = $script:Register.Rows) {
        $t = New-TestReader
        Test-NpiOwnership -Reader $t.Reader -Rows $Rows -ApplicationOwners (Import-NpiInput (Join-Path $script:Inputs 'application-owners.csv')) -ServiceRecords (Import-NpiInput (Join-Path $script:Inputs 'service-records.csv'))
    }
    function Get-TestPlan([object[]]$Confirmations = (Import-NpiInput (Join-Path $script:Inputs 'igo-confirmations.csv')), [object[]]$Claims = (Import-NpiInput (Join-Path $script:Inputs 'owner-claims.csv')), [object[]]$Rows = $script:Register.Rows) {
        $own = Get-TestOwnership -Rows $Rows
        $t = New-TestReader
        New-NpiOrphanPlan -Reader $t.Reader -Ownership $own -Rows $Rows -AsOf $script:AsOf -Cloud gcc -TenantId $script:TenantId -RegisterSha256 $script:Register.Sha256 -Confirmations $Confirmations -Claims $Claims
    }
    function Save-TestPlan($Plan) {
        $p = Join-Path $script:Tmp ("plan-{0}.json" -f [guid]::NewGuid())
        Write-NpiJson -Path $p -Value $Plan
        [pscustomobject]@{ Path = $p; Sha = Get-NpiFileHash -Path $p }
    }
    function New-TestWriter {
        $fake = New-NpiFixtureInvoker -Path $script:Fixture -AllowWrite
        $ad = New-NpiFixtureAdInvoker -Path $script:Fixture -AllowWrite
        [pscustomobject]@{ Fake = $fake; Ad = $ad; Writer = (New-NpiWriter -Cloud gcc -TenantId $script:TenantId -Invoke $fake.Invoke -AdInvoke $ad.Invoke) }
    }
    $script:Own = Get-TestOwnership
    $script:Plan = Get-TestPlan
    function Get-Own([string]$Rule) { @($script:Own.Findings | Where-Object Rule -EQ $Rule) }
    function Get-Act([string]$Name, [string]$Action) { @($script:Plan.actions | Where-Object { $_.Name -eq $Name -and (-not $Action -or $_.Action -eq $Action) }) }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The register from Chapter 01' {
    It 'is checked against its manifest before it''s used' {
        $copy = Join-Path $script:Tmp 'tampered'
        Copy-Item -Recurse $script:InvRun $copy
        Add-Content -LiteralPath (Join-Path $copy 'register.json') -Value ' '
        { Import-NpiRegister -RunPath $copy } | Should -Throw '*doesn''t match its manifest*'
    }
    It 'the ownership task reads only users, with User.Read.All' {
        (Get-NpiRequiredPermission -Task ownership).GraphPermissions | Should -Be @('User.Read.All')
        $t = New-TestReader
        $null = Test-NpiOwnership -Reader $t.Reader -Rows $script:Register.Rows -ApplicationOwners (Import-NpiInput (Join-Path $script:Inputs 'application-owners.csv'))
        @($t.Fake.Calls | Where-Object { $_.Method -ne 'GET' -or $_.Uri -notmatch '/v1\.0/users/' }).Count | Should -Be 0
    }
}

Describe 'The ownership rule' {
    It 'two enabled member owners pass' {
        @($script:Own.Findings | Where-Object { $_.Object -like 'Payroll Export*' -or $_.Object -like 'Deploy Bot*' }).Count | Should -Be 0
    }
    It 'NPI-OWN-01: no valid human owner makes an orphan candidate' {
        @(Get-Own 'NPI-OWN-01').Object | Sort-Object | Should -Be @('Legacy Reports (AppRegistration)', 'Old SAML Connector (LegacyServicePrincipal)')
    }
    It 'NPI-OWN-02: one valid human owner isn''t enough' {
        @(Get-Own 'NPI-OWN-02').Object | Sort-Object | Should -Be @('Build Pipeline (AppRegistration)', 'HR Connector (AppRegistration)', 'Mail Automation (AppRegistration)', 'Vendor Portal (AppRegistration)')
    }
    It 'NPI-OWN-03 to NPI-OWN-05: a service principal, a guest and a disabled user don''t count' {
        (Get-Own 'NPI-OWN-03').Object | Should -Be 'Build Pipeline (AppRegistration)'
        (Get-Own 'NPI-OWN-04').Object | Should -Be 'Vendor Portal (AppRegistration)'
        (Get-Own 'NPI-OWN-05').Object | Should -Be 'Mail Automation (AppRegistration)'
    }
    It 'NPI-OWN-06 and NPI-OWN-07: the service-management reference must name an active record' {
        @(Get-Own 'NPI-OWN-06').Object | Should -Contain 'HR Connector (AppRegistration)'
        $o7 = @(Get-Own 'NPI-OWN-07')
        ($o7 | Where-Object Object -Like 'Build Pipeline*').Issue | Should -Match "isn't a record key"
        ($o7 | Where-Object Object -Like 'Vendor Portal*').Issue | Should -Match 'Retired'
        ($o7 | Where-Object Object -Like 'svc-ldapbind*').Issue | Should -Match 'names no record'
    }
    It 'NPI-OWN-08: an AD service account needs an enabled application owner from the owners file' {
        @(Get-Own 'NPI-OWN-08').Object | Sort-Object | Should -Be @('gmsa-ops$ (gMSA)', 'sa-printsvc (Traditional)', 'svc-backup (Traditional)', 'svc-oldftp (Traditional)', 'svc-reports (Traditional)')
        (Get-Own 'NPI-OWN-08' | Where-Object Object -Like 'svc-backup*').Issue | Should -Match 'frank@contoso\.example is disabled'
    }
    It 'NPI-OWN-09: an account found only by a password that never expires is confirmed first' {
        (Get-Own 'NPI-OWN-09').Object | Should -Be 'jdoe (Traditional)'
        @($script:Own.Identities.Name) | Should -Not -Contain 'jdoe'
    }
    It 'leaves out what isn''t the owner rule''s: managed identities, external apps, service principals of own apps' {
        foreach ($n in 'vm-batch01', 'id-deploy', 'Partner CRM') { @($script:Own.Identities.Name) | Should -Not -Contain $n }
        @($script:Own.Identities | Where-Object Type -EQ 'ServicePrincipal').Count | Should -Be 0
    }
    It 'finding IDs are stable: the rule and the identity' {
        $again = Get-TestOwnership
        ($again.Findings.Id | Sort-Object) | Should -Be ($script:Own.Findings.Id | Sort-Object)
        foreach ($f in $script:Own.Findings) { $f.Id | Should -Be "$($f.Rule):$($f.ObjectKey)" }
    }
    It 'records the AI sponsor fields for Chapter 09 without checking them' {
        $ai = @($script:Own.AiSponsorFields)
        @($ai.Name | Sort-Object) | Should -Be @('Benefits Agent Blueprint', 'Benefits Q&A Agent')
        $ai[0].PSObject.Properties.Name | Should -Be @('IdentityId', 'Name', 'Type', 'FederalSponsor', 'SponsoringGroup', 'TechnicalOwner', 'InventoryRecord', 'Status')
        $ai[0].Status | Should -Match 'Chapter 09'
    }
}

Describe 'The orphan rule as a plan (D-N2)' {
    It 'nothing is disabled until the identity governance officer confirms' {
        (Get-Act 'svc-oldftp' 'AwaitConfirmation').Count | Should -Be 1
        (Get-Act 'Old SAML Connector').Action | Should -Be 'AwaitConfirmation'
        $none = Get-TestPlan -Confirmations @()
        @($none.actions | Where-Object { $_.Write -and $_.Action -eq 'Disable' }).Count | Should -Be 0
    }
    It 'a confirmed orphan is disabled, never deleted: accountEnabled false, or Disable-ADAccount' {
        (Get-Act 'Legacy Reports' 'Disable').Body.accountEnabled | Should -BeFalse
        (Get-Act 'Legacy Reports' 'Disable').Target | Should -Be 'https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000003'
        (Get-Act 'svc-backup' 'Disable').Target | Should -Be 'Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000003'
        @($script:Plan.actions.Method | Where-Object { $_ -in 'DELETE', 'PUT' }).Count | Should -Be 0
    }
    It 'records the 30-day claim window, from the disable' {
        (Get-Act 'svc-backup' 'Disable').ClaimWindowEnds | Should -Be '30 days after the disable is applied'
        (Get-Act 'sa-printsvc').Action | Should -Be 'ClaimWindowOpen'
        (Get-Act 'sa-printsvc').ClaimWindowEnds | Should -Be '2026-11-15'
    }
    It 'after the window closes with no claim, a retirement candidate, with no write' {
        $a = Get-Act 'svc-reports'
        $a.Action | Should -Be 'RetirementCandidate'
        $a.Write | Should -BeFalse
        $a.Reason | Should -Match 'never deletes'
    }
    It 'a dated exception holds until it ends; an expired one needs a new decision' {
        (Get-Act 'gmsa-ops$').Action | Should -Be 'Exception'
        $c = @(Import-NpiInput (Join-Path $script:Inputs 'igo-confirmations.csv') | ForEach-Object { if ($_.IdentityId -like '*000000000024') { $_.ExceptionEnds = '2026-10-01' }; $_ })
        (@((Get-TestPlan -Confirmations $c).actions | Where-Object Name -EQ 'gmsa-ops$')[0]).Action | Should -Be 'ExceptionExpired'
    }
    It 'an account recorded as disabled but enabled again is reported, not silently disabled' {
        $c = @(Import-NpiInput (Join-Path $script:Inputs 'igo-confirmations.csv') | ForEach-Object { if ($_.IdentityId -like '*000000000003' -and $_.IdentityId -like 'ad:*') { $_.DisabledOn = '2026-10-29' }; $_ })
        (@((Get-TestPlan -Confirmations $c).actions | Where-Object Name -EQ 'svc-backup')[0]).Action | Should -Be 'ReEnabledOutsideRule'
    }
    It 'SQL Server accounts go to the Data Platform plan, not the orphan rule' {
        $t = New-TestReader
        $owners = @(Import-NpiInput (Join-Path $script:Inputs 'application-owners.csv') | Where-Object SamAccountName -NE 'svc-ldapbind')
        $own = Test-NpiOwnership -Reader $t.Reader -Rows $script:Register.Rows -ApplicationOwners $owners -ServiceRecords (Import-NpiInput (Join-Path $script:Inputs 'service-records.csv'))
        $plan = New-NpiOrphanPlan -Reader $t.Reader -Ownership $own -Rows $script:Register.Rows -AsOf $script:AsOf -Cloud gcc -TenantId $script:TenantId -Confirmations @([pscustomobject]@{ IdentityId = 'ad:ad000000-0000-4000-8000-000000000008'; Decision = 'Disable'; ConfirmedBy = 'igo@contoso.example'; ConfirmedOn = '2026-10-29'; DisabledOn = ''; ExceptionEnds = '' })
        $a = @($plan.actions | Where-Object Name -EQ 'svc-ldapbind')
        $a.Action | Should -Be 'HandedOff'
        $a.Write | Should -BeFalse
    }
    It 'a claim adds an enabled member as owner; a guest nominee is refused; AD claims go to the owners file' {
        $add = Get-Act 'HR Connector' 'AddOwner'
        $add.Body.'@odata.id' | Should -Be 'https://graph.microsoft.com/v1.0/directoryObjects/5a000000-0000-4000-8000-000000000007'
        (Get-Act 'Build Pipeline').Action | Should -Be 'NomineeRefused'
        (Get-Act 'Build Pipeline').Reason | Should -Match 'guest'
        (Get-Act 'svc-oldftp' 'RecordOwner').Write | Should -BeFalse
    }
    It 'the plan is deterministic for the same inputs, so its SHA-256 can be approved' {
        (Save-TestPlan (Get-TestPlan)).Sha | Should -Be (Save-TestPlan $script:Plan).Sha
    }
}

Describe 'The separate write path' {
    BeforeAll { $script:Saved = Save-TestPlan $script:Plan }
    It 'the writer holds the orphan-apply calls only: delegated, Cloud Application Administrator' {
        $t = Get-NpiTask -Task orphan-apply
        $t.mode | Should -Be 'write'; $t.delegatedOnly | Should -BeTrue; $t.delegatedRole | Should -Be 'Cloud Application Administrator'
        (Get-NpiRequiredPermission -Task orphan-apply).Methods | Should -Be @('GET', 'PATCH', 'POST', 'READ', 'WRITE')
    }
    It 'refuses a plan whose SHA-256 isn''t the approved one' {
        $w = New-TestWriter
        { Invoke-NpiOrphanPlan -PlanPath $script:Saved.Path -ApprovedSha256 ('0' * 64) -Writer $w.Writer -AsOf $script:AsOf } | Should -Throw '*nobody reviewed*'
    }
    It 'refuses a plan for another tenant, or older than seven days' {
        $w = New-TestWriter
        $other = New-NpiWriter -Cloud gcc -TenantId '0e0e0e0e-0000-4000-8000-000000000099' -Invoke $w.Fake.Invoke -AdInvoke $w.Ad.Invoke
        { Invoke-NpiOrphanPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $other -AsOf $script:AsOf } | Should -Throw '*is for tenant*'
        { Invoke-NpiOrphanPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf.AddDays(8) } | Should -Throw '*days old*'
    }
    It 'a dry run sends nothing but the prechecks' {
        $w = New-TestWriter
        $run = Invoke-NpiOrphanPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf
        $run.Results.Outcome | Sort-Object -Unique | Should -Be 'WouldSend'
        @($w.Fake.Calls | Where-Object Method -NE 'GET').Count | Should -Be 0
        @($w.Ad.Calls | Where-Object Cmdlet -EQ 'Disable-ADAccount').Count | Should -Be 0
    }
    It '-Apply sends exactly the planned writes, and they land' {
        $w = New-TestWriter
        $run = Invoke-NpiOrphanPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf -Apply
        @($run.Results | Where-Object Outcome -EQ 'Sent').Count | Should -Be @($script:Plan.actions | Where-Object Write).Count
        @($w.Fake.Calls | Where-Object Method -NE 'GET').Method | Sort-Object | Should -Be @('PATCH', 'POST')
        @($w.Fake.Estate.graph.servicePrincipals | Where-Object id -EQ '5b000000-0000-4000-8000-000000000003')[0].accountEnabled | Should -BeFalse
        @($w.Fake.Estate.graph.applicationOwners['0a000000-0000-4000-8000-000000000002']).Count | Should -Be 2
        ([int64](@($w.Ad.Estate.ad.objects | Where-Object SamAccountName -EQ 'svc-backup')[0].UserAccountControl) -band 2) | Should -Be 2
        ($run.Results | Where-Object Action -EQ 'Disable')[0].Detail | Should -Match 'claim window ends 2026-11-29'
    }
    It 'skips a disable when an owner appeared after review' {
        $w = New-TestWriter
        $w.Fake.Estate.graph.applicationOwners['0a000000-0000-4000-8000-000000000003'] = @(@{ '@odata.type' = '#microsoft.graph.user'; id = '5a000000-0000-4000-8000-000000000003' })
        $run = Invoke-NpiOrphanPlan -PlanPath $script:Saved.Path -ApprovedSha256 $script:Saved.Sha -Writer $w.Writer -AsOf $script:AsOf -Apply
        ($run.Results | Where-Object Name -EQ 'Legacy Reports').Outcome | Should -Be 'Skipped'
        @($w.Fake.Calls | Where-Object Method -EQ 'PATCH').Count | Should -Be 0
    }
    It 'refuses a write the call list doesn''t allow: a DELETE, another body, another host' {
        $w = New-TestWriter
        $base = (Get-Act 'Legacy Reports' 'Disable')
        $mk = { param([hashtable]$o) $a = $base.PSObject.Copy(); foreach ($k in $o.Keys) { $a.$k = $o[$k] }; $a }
        { Assert-NpiPlannedWrite -Writer $w.Writer -Action (& $mk @{ Method = 'DELETE' }) } | Should -Throw
        { Assert-NpiPlannedWrite -Writer $w.Writer -Action (& $mk @{ Body = [ordered]@{ accountEnabled = $false; displayName = 'x' } }) } | Should -Throw '*only body allowed*'
        { Assert-NpiPlannedWrite -Writer $w.Writer -Action (& $mk @{ Target = 'https://graph.example.net/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000003' }) } | Should -Throw '*unexpected target*'
        { Assert-NpiPlannedWrite -Writer $w.Writer -Action (& $mk @{ Call = 'graph-sp-delete' }) } | Should -Throw '*isn''t declared*'
    }
}

Describe 'The entry scripts' {
    BeforeAll {
        $script:OwnOut = Join-Path $script:Tmp 'ownership'
        $script:Console = & (Join-Path $script:Root 'Invoke-NpiOwnership.ps1') -Cloud gcc -RegisterRun $script:InvRun -FixturePath $script:Fixture -InputPath $script:Inputs -OutputPath $script:OwnOut
    }
    It 'prints the counts Lab 1 shows, and the plan''s SHA-256' {
        $script:Console[0] | Should -Be 'Ownership: 22 identities checked; 7 orphan candidates'
        $script:Console[1] | Should -Be 'Findings: 20 Finding, 3 Warn, 1 Info. AI sponsor fields recorded for Chapter 09: 2'
        $script:Console[2] | Should -Be 'Orphan plan: 10 actions, 3 of them writes (1 AddOwner, 2 Disable); nothing sent'
        $script:Console[3] | Should -Be "Plan SHA-256: $(Get-NpiFileHash -Path (Join-Path $script:OwnOut 'orphan-plan.json'))"
    }
    It 'the manifest records the register''s and the inputs'' SHA-256' {
        $m = Get-Content (Join-Path $script:OwnOut 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
        $m.registerSha256 | Should -Be $script:Register.Sha256
        @($m.inputs.Keys | Sort-Object) | Should -Be @('application-owners.csv', 'igo-confirmations.csv', 'owner-claims.csv', 'service-records.csv')
    }
    It 'refuses a register read in another cloud' {
        { & (Join-Path $script:Root 'Invoke-NpiOwnership.ps1') -Cloud gcchigh -RegisterRun $script:InvRun -FixturePath $script:Fixture -InputPath $script:Inputs -OutputPath (Join-Path $script:Tmp 'x') } | Should -Throw '*not ''gcchigh''*'
    }
}
