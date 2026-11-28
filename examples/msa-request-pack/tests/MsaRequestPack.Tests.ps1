#Requires -Version 7.1
# The request pack's checker: the worked examples pass, and each pack check and Chapter 12 check fires.
BeforeAll {
    $script:Pack = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $script:Script = Join-Path $script:Pack 'Test-MsaRequest.ps1'
    $script:Tmp = Join-Path ([IO.Path]::GetTempPath()) ("msa-pack-{0}" -f [guid]::NewGuid())
    New-Item -ItemType Directory -Force $script:Tmp | Out-Null
    $script:Examples = @(Import-Csv (Join-Path $script:Pack 'examples.csv'))
    function Invoke-Check([object[]]$Rows) {
        $csv = Join-Path $script:Tmp ("in-{0}.csv" -f [guid]::NewGuid())
        $Rows | Export-Csv -LiteralPath $csv -NoTypeInformation -UseQuotes AsNeeded
        $out = Join-Path $script:Tmp ("out-{0}" -f [guid]::NewGuid())
        $null = & pwsh -NoProfile -File $script:Script -Path $csv -OutputPath $out -AsOf 2026-11-25 *>&1
        [pscustomobject]@{ Exit = $LASTEXITCODE; Out = $out; Findings = @(Get-Content (Join-Path $out 'findings.json') -Raw | ConvertFrom-Json) }
    }
    function Copy-Row([int]$i) { $script:Examples[$i] | Select-Object * }
}
AfterAll { Remove-Item -Recurse -Force $script:Tmp -ErrorAction SilentlyContinue }

Describe 'The worked examples' {
    It 'all twelve pass (five new or migration requests, seven changes), and each gets its request, AD description and Entra attributes' {
        $r = Invoke-Check $script:Examples
        $r.Exit | Should -Be 0
        $r.Findings.Count | Should -Be 0
        foreach ($e in $script:Examples) {
            foreach ($f in 'request.json', 'ad-description.txt', 'entra-tags.json', 'entra-custom-security-attributes.json') { Join-Path $r.Out $e.RequestId $f | Should -Exist }
        }
        Get-Content (Join-Path $r.Out 'REQ-2026-0403' 'ad-description.txt') -Raw | Should -Match '^SystemId=SYS-0233; Owner1=hrdb.dba@contoso.example; .*EntraTarget=KeepKerberos; Request=REQ-2026-0403; Change=PENDING'
        $csa = Get-Content (Join-Path $r.Out 'REQ-2026-0402' 'entra-custom-security-attributes.json') -Raw | ConvertFrom-Json -AsHashtable
        $csa.customSecurityAttributes.NonPersonIdentity.'@odata.type' | Should -Be '#Microsoft.DirectoryServices.CustomSecurityAttributeValue'
        $csa.customSecurityAttributes.NonPersonIdentity.EntraTarget | Should -Be 'AppRegistrationFederated'
        $t = Get-Content (Join-Path $r.Out 'REQ-2026-0402' 'entra-tags.json') -Raw | ConvertFrom-Json -AsHashtable
        $t.servicePrincipal.tags | Should -HaveCount 7
        $t.servicePrincipal.tags | Should -Contain 'npi:EntraTarget=AppRegistrationFederated'
        $t.servicePrincipal.notes | Should -Match '; Request=REQ-2026-0402; Change=PENDING$'
        $t.azureResourceTags.Keys | Should -HaveCount 7
        $q = Get-Content (Join-Path $r.Out 'REQ-2026-0403' 'request.json') -Raw | ConvertFrom-Json
        $q.proposedName | Should -Be 'gmsa-hrdb-sql$'
        $q.status | Should -Be 'SUBMITTED'
    }
}

Describe 'Chapter 12''s request check, before approval' {
    It 'refuses a role outside the list and a capital in the app short name (NPI-STD-03), and skips NPI-STD-01 and -02' {
        $a = Copy-Row 0; $a.Role = 'api'
        $b = Copy-Row 1; $b.AppShortName = 'Payroll'
        $r = Invoke-Check @($a, $b)
        $r.Exit | Should -Be 1
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-03').ObjectKey | Sort-Object | Should -Be @('REQ-2026-0401', 'REQ-2026-0402')
        @($r.Findings | Where-Object Rule -In 'NPI-STD-01', 'NPI-STD-02').Count | Should -Be 0
    }
    It 'refuses a name over 15 characters' {
        $a = Copy-Row 0; $a.AppShortName = 'visitorbadges'; $a.Role = 'web'
        (Invoke-Check @($a)).Findings[0].Issue | Should -Match '22 characters'
    }
}

Describe 'The pack''s own checks' {
    It 'MSA-REQ-01: Migrate needs Supersedes, New mustn''t have it' {
        $a = Copy-Row 1; $a.Supersedes = ''
        $b = Copy-Row 0; $b.Supersedes = 'svc-visitor'
        $r = Invoke-Check @($a, $b)
        @($r.Findings | Where-Object Rule -EQ 'MSA-REQ-01').Count | Should -Be 2
    }
    It 'MSA-REQ-02 warns when a role doesn''t match the workload' {
        $a = Copy-Row 3; $a.Role = 'web'; $a.AppShortName = 'hrdb'
        $r = Invoke-Check @($a)
        @($r.Findings | Where-Object Rule -EQ 'MSA-REQ-02')[0].Severity | Should -Be 'Warn'
    }
    It 'MSA-REQ-03: the same person twice' {
        $a = Copy-Row 0; $a.Owner2 = $a.Owner1
        @((Invoke-Check @($a)).Findings | Where-Object Rule -EQ 'MSA-REQ-03').Count | Should -Be 1
    }
    It 'MSA-REQ-04: KeepKerberos with no end date' {
        $a = Copy-Row 2; $a.EndDate = ''
        @((Invoke-Check @($a)).Findings | Where-Object Rule -EQ 'MSA-REQ-04').Count | Should -Be 1
    }
    It 'MSA-REQ-05: a new dMSA' {
        $a = Copy-Row 4; $a.RequestKind = 'New'; $a.Supersedes = ''
        @((Invoke-Check @($a)).Findings | Where-Object Rule -EQ 'MSA-REQ-05').Count | Should -Be 1
    }
    It 'MSA-REQ-06: a tag value outside its list, or with a separator' {
        $a = Copy-Row 0; $a.Environment = 'Production'
        $b = Copy-Row 1; $b.SystemId = 'SYS-0412;SYS-0413'
        $r = Invoke-Check @($a, $b)
        @($r.Findings | Where-Object Rule -EQ 'MSA-REQ-06').ObjectKey | Sort-Object | Should -Be @('REQ-2026-0401', 'REQ-2026-0402')
    }
}

Describe 'Change requests (RequestKind Change)' {
    It 'writes each change''s type and items into request.json, for Chapter 06''s change plan' {
        $r = Invoke-Check @($script:Examples | Where-Object RequestKind -EQ 'Change')
        $r.Exit | Should -Be 0
        $q = Get-Content (Join-Path $r.Out 'REQ-2026-0406' 'request.json') -Raw | ConvertFrom-Json
        $q.requestKind | Should -Be 'Change'
        $q.changeType | Should -Be 'AddHost'
        @($q.changeItems) | Should -Be @('PAY03')
        @($q.hosts) | Should -Be @('PAY01', 'PAY02', 'PAY03')
        Get-Content (Join-Path $r.Out 'REQ-2026-0410' 'ad-description.txt') -Raw | Should -Match 'Tier=R1; EntraTarget=AppRegistrationFederated; Request=REQ-2026-0410; Change=PENDING'
    }
    It 'MSA-REQ-07: a Change with no known ChangeType, or a ChangeType on a New row' {
        $a = Copy-Row 5; $a.ChangeType = 'Owner'
        $b = Copy-Row 0; $b.ChangeType = 'AddHost'
        $r = Invoke-Check @($a, $b)
        @($r.Findings | Where-Object Rule -EQ 'MSA-REQ-07').ObjectKey | Sort-Object | Should -Be @('REQ-2026-0401', 'REQ-2026-0406')
    }
    It 'MSA-REQ-08: what a change names has to fit the row: an added host in Hosts, a removed one gone, an SPN in the form, no items for Tier' {
        $a = Copy-Row 5; $a.Hosts = 'PAY01;PAY02'
        $b = Copy-Row 6; $b.Hosts = 'PAY01;PAY02'
        $c = Copy-Row 7; $c.ChangeItems = 'payroll-api'; $c.Spns = 'HTTP/payroll.corp.contoso.example;payroll-api'
        $d = Copy-Row 9; $d.ChangeItems = 'R1'
        $e = Copy-Row 10; $e.EntraTarget = 'ManagedIdentity'
        $r = Invoke-Check @($a, $b, $c, $d, $e)
        @($r.Findings | Where-Object Rule -EQ 'MSA-REQ-08').ObjectKey | Sort-Object | Should -Be @('REQ-2026-0406', 'REQ-2026-0407', 'REQ-2026-0408', 'REQ-2026-0410', 'REQ-2026-0411')
    }
    It 'two changes to the same account aren''t a name clash (NPI-STD-03 counts only requests that create one)' {
        $r = Invoke-Check @($script:Examples[1], $script:Examples[5], $script:Examples[6])
        @($r.Findings | Where-Object Rule -EQ 'NPI-STD-03').Count | Should -Be 0
    }
}

Describe 'The name suggester in the checker' {
    It 'a name that breaks the standard is reported with the name it should be' {
        $a = Copy-Row 1; $a.AppShortName = 'Payroll'
        $b = Copy-Row 0; $b.Role = 'api'
        $c = Copy-Row 0; $c.AppShortName = 'visitorbadges'; $c.Role = 'web'; $c.RequestId = 'REQ-2026-0499'
        $r = Invoke-Check @($a, $b, $c)
        $i = @{}; foreach ($f in @($r.Findings | Where-Object Rule -EQ 'NPI-STD-03')) { $i[$f.ObjectKey] = $f.Issue }
        $i['REQ-2026-0402'] | Should -Match 'expected name gmsa-payroll\$ \(Get-MsaNameSuggestion.ps1\)$'
        $i['REQ-2026-0401'] | Should -Match 'expected name gmsa-visitor\$'
        $i['REQ-2026-0499'] | Should -Match 'expected name gmsa-visito-web\$ \(Get-MsaNameSuggestion.ps1\): .*can have 6 characters here'
    }
}

Describe 'The template' {
    It 'request_template.csv has the checker''s columns and no rows' {
        $lines = @(Get-Content (Join-Path $script:Pack 'request_template.csv'))
        $lines.Count | Should -Be 1
        $lines[0] | Should -Be (@(Get-Content (Join-Path $script:Pack 'examples.csv'))[0])
    }
}
