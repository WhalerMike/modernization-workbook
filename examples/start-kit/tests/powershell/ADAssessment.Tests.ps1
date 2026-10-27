BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPSqlEstate') -Force
    Register-KitAdMocks -ModuleName FMPADAssessment
    Register-KitAdMocks -ModuleName FMPSqlEstate
    Register-KitSqlMocks
    Mock -ModuleName FMPADAssessment Get-FMPCAEditFlags { "EditFlags REG_DWORD = 15014e`n    EDITF_ATTRIBUTESUBJECTALTNAME2 -- 40000 (262144)" }

    $run = Join-Path $TestDrive 'run'
    $steps = @(Invoke-FMPADAssessment -OutputPath $run -Tier B -AsOf $FMPAsOf)
    $null = Invoke-FMPSqlEstateDiscovery -OutputPath $run -TargetServers 'app01.contoso.example' -ProbeNetwork -QueryInstances -AsOf $FMPAsOf
    $summary = Get-FMPStartKitSummary -RunPath $run
    $root = Join-Path $run 'contoso.example'
    $child = Join-Path $run 'child.contoso.example'
    # Parenthesized so a JSON array is enumerated in Windows PowerShell 5.1 too.
    function Read-Out([string]$Path) { (Get-Content -Raw -Path $Path | ConvertFrom-Json) | ForEach-Object { $_ } }
}

Describe 'The orchestrated assessment' {
    It 'runs every collector without a failure' {
        @($steps | Where-Object Status -ne 'Completed') | ForEach-Object { "$($_.Step): $($_.Error)" } | Should -BeNullOrEmpty
        $steps.Count | Should -Be 21
    }
    It 'writes Appendix B''s layout per domain' {
        foreach ($f in 'Forest\ForestTopology.json', 'Domains\DomainControllers.json', 'OUs\OUHierarchy.json', 'OUs\OUTreeVisual.txt',
            'GPOs\GPOInventory.json', 'GPOs\GPOSettings\31b2f340-016d-11d2-945f-00c04fb984f9.xml', 'DNS\DNSInventory.json', 'PKI\PKISecurityReport.json',
            'Objects\ComputerInventory.json', 'Objects\UserInventory.json', 'Objects\ServiceAccounts.csv', 'Trusts\TrustMap.json',
            'Schema\SchemaExtensions.json', 'DHCP\DHCPInventory.json', 'Kerberos\KerberosSpnMap.json', 'Ldap\LdapBindings.json') {
            Join-Path $root $f | Should -Exist
        }
        Join-Path $child 'Objects\UserInventory.json' | Should -Exist
    }
}

Describe 'The one-page summary' {
    It 'counts <Item>' -ForEach @(
        @{ Item = 'Domains'; Expected = 2 }
        @{ Item = 'DomainControllers'; Expected = 3 }
        @{ Item = 'Trusts'; Expected = 2 }
        @{ Item = 'ExternalTrusts'; Expected = 1 }
        @{ Item = 'OUs'; Expected = 4 }
        @{ Item = 'GPOs'; Expected = 4 }
        @{ Item = 'Users'; Expected = 8 }
        @{ Item = 'EnabledUsers'; Expected = 7 }
        @{ Item = 'Groups'; Expected = 7 }
        @{ Item = 'Computers'; Expected = 12 }
        @{ Item = 'Servers'; Expected = 9 }
        @{ Item = 'ServiceAccounts'; Expected = 5 }
        @{ Item = 'SPNs'; Expected = 15 }
        @{ Item = 'DuplicateSPNs'; Expected = 1 }
        @{ Item = 'DNSZones'; Expected = 5 }
        @{ Item = 'DHCPServers'; Expected = 2 }
        @{ Item = 'DHCPScopes'; Expected = 2 }
        @{ Item = 'CertificationAuthorities'; Expected = 1 }
        @{ Item = 'CertificateTemplates'; Expected = 5 }
        @{ Item = 'PublishedTemplates'; Expected = 3 }
        @{ Item = 'SQLInstances'; Expected = 6 }
        @{ Item = 'UnconstrainedDelegationHosts'; Expected = 1 }
        @{ Item = 'UnconstrainedDelegationAccounts'; Expected = 1 }
        @{ Item = 'PrivilegedDelegable'; Expected = 1 }
        @{ Item = 'SQLUnconstrainedDelegation'; Expected = 2 }
        @{ Item = 'SQLHosts'; Expected = 5 }
    ) {
        $summary.Counts[$Item] | Should -Be $Expected
    }
    It 'breaks computers down by operating system' {
        $summary.ComputersByOS['Windows Server 2019 Standard'] | Should -Be 3
        $summary.ComputersByOS['Windows 11 Enterprise'] | Should -Be 2
    }
    It 'names the schema version' {
        $summary.Counts.SchemaVersion | Should -Be '88 (Windows Server 2019 or 2022)'
    }
    It 'writes a Markdown page and JSON' {
        $md = Get-Content -Raw (Join-Path $run 'Summary\StartKitSummary.md')
        $md | Should -Match '\| SQL Server instances \| 6 \|'
        $md | Should -Match '\| Domain controllers \| 3 \|'
        $md | Should -Match '## SQL Server instances by version'
        Join-Path $run 'Summary\StartKitSummary.json' | Should -Exist
    }
    It 'reports a missing source as not collected, never as zero' {
        $empty = Join-Path $TestDrive 'empty'
        $s = Get-FMPStartKitSummary -RunPath $empty
        $s.Counts.Users | Should -Be 'not collected'
        $s.Counts.SQLInstances | Should -Be 'not collected'
        $s.Counts.UnconstrainedDelegationHosts | Should -Be 'not collected'
        $s.Counts.SQLUnconstrainedDelegation | Should -Be 'not collected'
    }
}

Describe 'Collector results' {
    It 'classifies delegation four ways and keeps domain controllers identifiable' {
        $d = @(Import-Csv (Join-Path $root 'Objects\DelegationReport.csv'))
        ($d | Where-Object Name -eq 'OLD01').DelegationType | Should -Be 'Unconstrained'
        ($d | Where-Object Name -eq 'SQL02').DelegationType | Should -Be 'Constrained (protocol transition)'
        ($d | Where-Object Name -eq 'APP01').DelegationType | Should -Be 'Resource-based (inbound)'
        ($d | Where-Object Name -eq 'DC01').IsDomainController | Should -Be 'True'
    }
    It 'classifies delegation on user and service accounts, and marks SQL Server service accounts' {
        $d = @(Import-Csv (Join-Path $root 'Objects\UserDelegationReport.csv'))
        $d.SamAccountName | Sort-Object | Should -Be @('svc-sql01', 'svc-web')
        $sql = $d | Where-Object SamAccountName -eq 'svc-sql01'
        $sql.DelegationType | Should -Be 'Unconstrained'
        $sql.IsSqlServiceAccount | Should -Be 'True'
        ($d | Where-Object SamAccountName -eq 'svc-web').DelegationType | Should -Be 'Constrained (protocol transition)'
        ($d | Where-Object SamAccountName -eq 'svc-web').DelegationTargets | Should -Be 'MSSQLSvc/sql01.contoso.example:1433'
    }
    It 'lists privileged users whose credentials can be delegated, and not the sensitive ones' {
        @(Import-Csv (Join-Path $root 'Objects\PrivilegedDelegable.csv')).SamAccountName | Should -Be @('Administrator')
        @(Import-Csv (Join-Path $child 'Objects\PrivilegedDelegable.csv')) | Should -HaveCount 0
    }
    It 'flags SQL Server instances whose host or service account has unconstrained delegation' {
        $u = @(Import-Csv (Join-Path $run 'SQL\SqlUnconstrainedDelegation.csv'))
        ($u | Where-Object ServerName -eq 'old01.contoso.example').UnconstrainedOn | Should -Be 'host'
        ($u | Where-Object ServerName -eq 'sql01.contoso.example').UnconstrainedOn | Should -Be 'service account'
        $u | Should -HaveCount 2
        $md = Get-Content -Raw (Join-Path $run 'Summary\StartKitSummary.md')
        $md | Should -Match '## Unconstrained delegation \(domain controllers excluded\)'
        $md | Should -Match '\| OLD01 \| Computer \| yes \|'
        $md | Should -Match '\| svc-sql01 \| Account \| yes \|'
        $md | Should -Not -Match '\| DC01 \|'
    }
    It 'finds stale computers by both logon and password age' {
        @(Import-Csv (Join-Path $root 'Objects\StaleComputers.csv')).Name | Should -Be @('OLD01', 'WS002')
    }
    It 'finds an orphaned adminCount through recursive membership' {
        $a = @(Import-Csv (Join-Path $root 'Objects\AdminCountReport.csv'))
        ($a | Where-Object SamAccountName -eq 'asmith').OrphanedAdminCount | Should -Be 'True'
        ($a | Where-Object SamAccountName -eq 'Administrator').OrphanedAdminCount | Should -Be 'False'
    }
    It 'finds circular group nesting' {
        @((Read-Out (Join-Path $root 'Objects\CircularGroups.json')).Group) | Sort-Object | Should -Be @('App-A', 'App-B')
    }
    It 'flags ESC1, ESC4 and ESC6, and not the safe templates' {
        $f = @(Read-Out (Join-Path $root 'PKI\PKISecurityReport.json'))
        ($f | Where-Object Finding -eq 'ESC1').Template | Should -Be 'Web Server Legacy'
        ($f | Where-Object Finding -eq 'ESC4').Template | Should -Be 'Vulnerable ACL'
        @($f | Where-Object Finding -eq 'ESC6') | Should -HaveCount 1
        @($f | Where-Object { $_.Template -in 'User', 'Computer', 'Subordinate Certification Authority' }) | Should -HaveCount 0
    }
    It 'decodes trust attributes and direction' {
        $t = @((Read-Out (Join-Path $root 'Trusts\TrustMap.json')).Trusts | Where-Object Name -eq 'partner.example')[0]
        $t.TrustAttributes | Should -Be @('ForestTransitive')
        $t.Access | Should -Be 'Users in partner.example can reach resources in contoso.example'
        $t.Posture | Should -Be 'Standard'
    }
    It 'records DNS server settings it cannot read, and still inventories zones' {
        $dns = Read-Out (Join-Path $root 'DNS\DNSInventory.json')
        $dns.Scavenging.NotReadable | Should -BeTrue
        @($dns.Zones).ZoneName | Should -Contain 'contoso.example'
        $dns.ConditionalForwarders | Should -Be @('partner.example')
        $health = Read-Out (Join-Path $root 'DNS\DNSHealthReport.json')
        @($health.ZonesByServer | Where-Object DnsServer -eq 'dc02.contoso.example')[0].Error | Should -Match 'RPC'
        $rec = @(Read-Out (Join-Path $root 'DNS\DNSRecordInventory.json') | Where-Object ZoneName -eq 'contoso.example')[0]
        @($rec.StaleRecords).HostName | Should -Be @('ws002')
    }
    It 'counts only real GPO conflicts (named settings), and finds the empty GPO' {
        $c = @(Read-Out (Join-Path $root 'GPOs\GPOConflicts.json'))
        $c | Should -HaveCount 1
        $c[0].SettingKey | Should -Be 'Computer|Policy|Turn off Autoplay'
        $c[0].DifferentState | Should -BeTrue
        @(Read-Out (Join-Path $root 'GPOs\GPOEmpty.json')).GPOName | Should -Be @('Empty Policy')
        (@(Read-Out (Join-Path $root 'GPOs\GPOLinks.json')) | Where-Object GPOName -eq 'Workstation Baseline').SiteLinked | Should -BeTrue
    }
    It 'finds third-party and product schema extensions' {
        $s = Read-Out (Join-Path $root 'Schema\SchemaExtensions.json')
        $s.SchemaVersion | Should -Be 88
        $s.NonMicrosoftCount | Should -Be 2
        @($s.NonMicrosoft).Name | Should -Contain 'contosoEmployeeBadge'
        $s.KnownProducts.Exchange | Should -Be 1
        $s.KnownProducts.'Windows LAPS' | Should -Be 1
    }
    It 'reads DHCP where it can and records the server it cannot' {
        $d = Read-Out (Join-Path $root 'DHCP\DHCPInventory.json')
        $d.ReadableServerCount | Should -Be 1
        $d.ReservationCount | Should -Be 1
        @($d.Servers | Where-Object Server -eq 'dhcp02.contoso.example')[0].Error | Should -Match 'denied'
    }
    It 'maps SPNs forest-wide with duplicates and orphans' {
        $k = Read-Out (Join-Path $root 'Kerberos\KerberosSpnMap.json')
        @(Import-Csv (Join-Path $root 'Kerberos\SpnDuplicates.csv')).Spn | Should -Be @('HTTP/web.contoso.example')
        $orphans = @(Import-Csv (Join-Path $root 'Kerberos\SpnOrphans.csv'))
        $orphans.Account | Sort-Object -Unique | Should -Be @('krbtgt', 'OLD01$')
        @($k.ByServiceClass | Where-Object ServiceClass -eq 'MSSQLSvc')[0].SpnCount | Should -Be 5
    }
    It 'groups unsigned and clear-text LDAP binds by client' {
        $l = Read-Out (Join-Path $root 'Ldap\LdapBindings.json')
        $l.ClientCount | Should -Be 2
        $top = @($l.Clients)[0]
        $top.ClientAddress | Should -Be '10.0.5.40'
        $top.BindType | Should -Be 'Simple bind without TLS'
        $top.Count | Should -Be 2
        @($l.Clients | Where-Object Identity -eq 'CONTOSO\jdoe')[0].ClientAddress | Should -Be 'fe80::1'
        @($l.DomainControllers | Where-Object DomainController -eq 'dc02.contoso.example')[0].Readable | Should -BeFalse
        (Read-Out (Join-Path $child 'Ldap\LdapBindings.json')).DomainControllers[0].Readable | Should -BeTrue
    }
    It 'keeps only non-inherited, non-built-in OU delegations' {
        $d = @(Read-Out (Join-Path $root 'OUs\OUDelegations.json'))
        @($d[0].Delegations).IdentityReference | Should -Be @('CONTOSO\Helpdesk')
    }
}

Describe 'Read-access pre-flight' {
    It 'records what was denied and drafts the delegation request' {
        $checks = @(Test-FMPReadAccess -OutputPath (Join-Path $TestDrive 'pre') -Domain 'contoso.example')
        ($checks | Where-Object Area -eq 'Deleted objects').Status | Should -Be 'Denied'
        @($checks | Where-Object { $_.Area -eq 'DNS' -and $_.Status -eq 'Denied' }) | Should -HaveCount 1
        ($checks | Where-Object Area -eq 'Topology').Status | Should -Be 'Readable'
        $md = Get-Content -Raw (Join-Path $TestDrive 'pre\Preflight\DelegationRequest.md')
        $md | Should -Match 'dsacls'
        $md | Should -Match 'never DnsAdmins|not DnsAdmins|DNS server object'
        $md | Should -Not -Match 'Domain Admin'
    }
}

Describe 'Drift' {
    It 'reports added and removed objects between two runs' {
        $b = Join-Path $TestDrive 'b'; $c = Join-Path $TestDrive 'c'
        foreach ($p in $b, $c) { $null = New-Item -ItemType Directory -Path (Join-Path $p 'Objects') -Force }
        '[{"SID":"S-1"},{"SID":"S-2"}]' | Set-Content (Join-Path $b 'Objects\UserInventory.json')
        '[{"SID":"S-2"},{"SID":"S-3"}]' | Set-Content (Join-Path $c 'Objects\UserInventory.json')
        $d = @(Compare-FMPAssessments -BaselinePath $b -CurrentPath $c | Where-Object File -eq 'Objects\UserInventory.json')[0]
        $d.Added | Should -Be @('S-3')
        $d.Removed | Should -Be @('S-1')
    }
}
