# FMPDdiReadiness: the DNS, DHCP and IPAM readiness checks of Book 08, on the files the DNS and DHCP
# collectors write. The fixture run (tests/fixtures/ddi/run-2026-11-20/contoso.example) is a fictional
# domain in the shape Get-FMPDNSAssessment and Get-FMPDHCPInventory write; the last Describe runs the
# real collector under the kit's mocks and reads its output, so the two can't drift apart.

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPDdiReadiness') -Force
    $script:Run = Join-Path (Join-Path (Join-Path $FixturePath 'ddi') 'run-2026-11-20') 'contoso.example'
    function Copy-Run([string]$To) {
        foreach ($area in 'DNS', 'DHCP') {
            $dir = Join-Path $To $area
            $null = New-Item -ItemType Directory -Path $dir -Force
            Get-ChildItem -Path (Join-Path $Run $area) -File | Copy-Item -Destination $dir
        }
    }
}

Describe 'Reading a run' {
    It 'loads the four collector files of one domain' {
        $r = Read-FMPDdiRun -Path $Run
        $r.Domain | Should -Be 'contoso.example'
        $r.Missing | Should -BeNullOrEmpty
        @($r.DnsInventory.Zones).Count | Should -Be 12
        @($r.DhcpInventory.Servers).Count | Should -Be 2
    }
    It 'says which files are missing instead of failing' {
        $d = Join-Path (Join-Path $TestDrive 'dns-only') 'contoso.example'
        Copy-Run $d
        Remove-Item -Recurse -Path (Join-Path $d 'DHCP')
        (Read-FMPDdiRun -Path $d).Missing | Should -Be @('DHCP\DHCPInventory.json')
    }
    It 'refuses a folder that is not there' {
        { Read-FMPDdiRun -Path (Join-Path $TestDrive 'nowhere') } | Should -Throw '*No run folder*'
    }
}

Describe 'The departure register (Book 08, Chapter 10)' {
    BeforeAll { $script:R = Get-FMPDnsDepartureRegister -Path $Run }

    It 'has one row per zone, plus dynamic registration' {
        $R.Rows | Should -HaveCount 13
        @($R.Rows | Where-Object Risk -eq 'High').Count | Should -Be 2
        @($R.Rows | Where-Object Risk -eq 'Medium').Count | Should -Be 5
        @($R.Rows | Where-Object Risk -eq 'Low').Count | Should -Be 6
    }
    It 'sorts each zone into the chapter''s component' -ForEach @(
        @{ Zone = '_msdcs.contoso.example'; Component = 'AD locator records'; Risk = 'High' }
        @{ Zone = 'secure.contoso.example'; Component = 'DNSSEC-signed zone'; Risk = 'High' }
        @{ Zone = 'contoso.example'; Component = 'AD-integrated zone, internal'; Risk = 'Medium' }
        @{ Zone = 'GlobalNames'; Component = 'GlobalNames zone'; Risk = 'Medium' }
        @{ Zone = '10.in-addr.arpa'; Component = 'Reverse lookup zone'; Risk = 'Medium' }
        @{ Zone = 'apps.contoso.example'; Component = 'File-backed primary'; Risk = 'Low' }
        @{ Zone = 'legacy.contoso.example'; Component = 'Secondary zone'; Risk = 'Low' }
        @{ Zone = 'partner.example'; Component = 'Stub zone or conditional forwarder'; Risk = 'Low' }
        @{ Zone = 'hr.contoso.example'; Component = 'Stub zone or conditional forwarder'; Risk = 'Low' }
    ) {
        $row = @($R.Rows | Where-Object Zone -eq $Zone)[0]
        $row.Component | Should -Be $Component
        $row.Risk | Should -Be $Risk
    }
    It 'gives each row the chapter''s target, Azure equivalent and method' {
        $row = @($R.Rows | Where-Object Zone -eq '_msdcs.contoso.example')[0]
        $row.Target | Should -Match 'accepts domain controller registration'
        $row.AzureEquivalent | Should -Be 'None'
        $row.Method | Should -Match 'Forward the AD namespaces'
    }
    It 'makes a zone named as external a High-risk public zone' {
        $x = Get-FMPDnsDepartureRegister -Path $Run -ExternalZone 'contoso.example'
        $row = @($x.Rows | Where-Object Zone -eq 'contoso.example')[0]
        $row.Component | Should -Be 'AD-integrated zone, external'
        $row.Risk | Should -Be 'High'
    }
    It 'notes stale records, forwarding targets, secondaries and zones missing from a DNS server' {
        @($R.Rows | Where-Object Zone -eq 'contoso.example')[0].Notes | Should -Match '^4 stale records'
        @($R.Rows | Where-Object Zone -eq 'oldvendor.example')[0].Notes | Should -Match 'Conditional forwarder to 198\.51\.100\.53'
        @($R.Rows | Where-Object Zone -eq 'hr.contoso.example')[0].Notes | Should -Match '^Stub zone to 10\.20\.0\.10'
        @($R.Rows | Where-Object Zone -eq 'legacy.contoso.example')[0].Notes | Should -Be 'Primary: 10.9.0.53'
        @($R.Rows | Where-Object Zone -eq '16.172.in-addr.arpa')[0].Notes | Should -Be 'Not on dc03.contoso.example'
    }
    It 'does not call a server-local zone missing from the other servers' {
        @($R.Rows | Where-Object Zone -eq 'apps.contoso.example')[0].Notes | Should -BeNullOrEmpty
    }
    It 'lists the zones that take dynamic updates, nonsecure ones included' {
        $row = @($R.Rows | Where-Object Component -eq 'Dynamic registration')[0]
        $row.Notes | Should -Match '16\.172\.in-addr\.arpa \(NonsecureAndSecure\)'
        $row.Notes | Should -Not -Match 'GlobalNames'
    }
    It 'reports the Phase 1 findings' {
        $items = @($R.Findings | ForEach-Object { $_.Item })
        $items | Should -Contain '_kpasswd._tcp.contoso.example'
        $items | Should -Contain 'dc02.contoso.example'
        $items | Should -Contain 'Aging and scavenging'
        $items | Should -Contain 'Stale records'
        $items | Should -Contain 'Duplicate host name'
        $items | Should -Contain 'Server-level forwarders'
        @($R.Findings | Where-Object Item -eq 'Stale records')[0].Finding | Should -Be '6 records older than 90 days'
        @($R.Findings | Where-Object Item -eq 'Duplicate host name')[0].Finding | Should -Match 'ws131\.contoso\.example \(10\.0\.5\.131, 10\.0\.5\.140\)'
    }
    It 'says scavenging was not read, rather than off, when the server settings could not be read' {
        $d = Join-Path (Join-Path $TestDrive 'noscav') 'contoso.example'
        Copy-Run $d
        $p = Join-Path (Join-Path $d 'DNS') 'DNSInventory.json'
        $j = Get-Content -Raw $p | ConvertFrom-Json
        $j.Scavenging = [pscustomobject]@{ NotReadable = $true; Error = 'Access is denied.' }
        ($j | ConvertTo-Json -Depth 8) | Set-Content -Path $p -Encoding UTF8
        $f = @((Get-FMPDnsDepartureRegister -Path $d).Findings | Where-Object Item -eq 'Aging and scavenging')[0]
        $f.Finding | Should -Match '^Not read'
    }
    It 'writes nothing without -OutputPath' {
        $R.Written | Should -BeNullOrEmpty
    }
    It 'writes the register and its findings under -OutputPath only' {
        $out = Join-Path $TestDrive 'out'
        $w = Get-FMPDnsDepartureRegister -Path $Run -OutputPath $out
        $w.Written | Should -HaveCount 2
        $csv = Join-Path (Join-Path (Join-Path $out 'contoso.example') 'DDI') 'DepartureRegister.csv'
        @(Import-Csv $csv) | Should -HaveCount 13
        (Get-Content -Raw (Join-Path (Split-Path -Parent $csv) 'DepartureRegister.json') | ConvertFrom-Json).Findings.Count | Should -Be 6
    }
    It 'refuses a run without the DNS inventory' {
        $d = Join-Path (Join-Path $TestDrive 'nodns') 'contoso.example'
        $null = New-Item -ItemType Directory -Path (Join-Path $d 'DHCP') -Force
        { Get-FMPDnsDepartureRegister -Path $d } | Should -Throw '*Get-FMPDNSAssessment*'
    }
}

Describe 'The DHCP edge (Book 08, Chapters 04 and 05)' {
    BeforeAll {
        $script:Observed = Join-Path (Join-Path $FixturePath 'ddi') 'observed-dhcp-servers.csv'
        $script:E = Test-FMPDhcpEdge -Path $Run -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10 -ObservedDhcpServerPath $Observed
        function Get-Finding($Area, $Scope) { @($E.Findings | Where-Object { $_.Area -eq $Area -and ($null -eq $Scope -or $_.Scope -eq $Scope) }) }
    }
    It 'takes a scope''s own option over the server''s' {
        @($E.Scopes | Where-Object ScopeId -eq '10.0.6.0')[0].DnsServers | Should -Be '10.0.0.11'
        @($E.Scopes | Where-Object ScopeId -eq '10.0.5.0')[0].DnsServers | Should -Be '10.0.0.10, 10.0.0.11'
    }
    It 'flags resolvers that are not approved, per scope' {
        $f = Get-Finding 'Option 6' | Where-Object Finding -like '*approved*'
        @($f.Scope) | Should -Be @('10.1.5.0', '10.1.7.0')
        $f[0].Finding | Should -Match '203\.0\.113\.53 \(set on the server\)'
    }
    It 'flags a scope whose servers hand out different resolvers' {
        @(Get-Finding 'Option 6' '10.1.5.0' | Where-Object Finding -like '*different resolvers*').Count | Should -Be 1
    }
    It 'flags a domain that is not a zone, and WPAD' {
        (Get-Finding 'Option 15' '10.1.5.0')[0].Finding | Should -Match 'branch\.contoso\.example'
        (Get-Finding 'Option 252' '10.1.7.0')[0].Finding | Should -Match 'wpad\.oldvendor\.example'
    }
    It 'flags scopes in no failover relationship, and not the one that is' {
        @((Get-Finding 'Failover').Scope) | Should -Be @('10.0.5.0', '10.0.6.0', '10.1.7.0')
    }
    It 'flags registration without an account, partners with different accounts, and name protection off' {
        $r = Get-Finding 'Registration'
        @($r | Where-Object Finding -like 'No dedicated*').Server | Should -Be 'dhcp02.contoso.example'
        @($r | Where-Object Finding -like 'Failover partners*').Scope | Should -Be '10.1.5.0'
        @($r | Where-Object Finding -like 'Name protection off*').Server | Should -Be 'dhcp02.contoso.example'
    }
    It 'flags a DHCP server the network saw that is not authorized' {
        $f = Get-Finding 'Rogue DHCP'
        $f | Should -HaveCount 1
        $f[0].Server | Should -Be '10.0.5.254'
        $f[0].Finding | Should -Match 'hq-acc-03'
    }
    It 'finds no unapproved resolver when every one is approved' {
        $all = Test-FMPDhcpEdge -Path $Run -ApprovedResolver 10.0.0.10, 10.0.0.11, 10.1.0.10, 203.0.113.53
        @($all.Findings | Where-Object Finding -like '*approved*') | Should -BeNullOrEmpty
    }
    It 'writes its findings under -OutputPath only' {
        $out = Join-Path $TestDrive 'edge'
        $w = Test-FMPDhcpEdge -Path $Run -ApprovedResolver 10.0.0.10 -OutputPath $out
        @(Import-Csv $w.Written[0]).Count | Should -Be @($w.Findings).Count
        $w.Written[0] | Should -BeLike "$out*"
    }
    It 'refuses a run without the DHCP inventory' {
        $d = Join-Path (Join-Path $TestDrive 'nodhcp') 'contoso.example'
        Copy-Run $d
        Remove-Item -Recurse -Path (Join-Path $d 'DHCP')
        { Test-FMPDhcpEdge -Path $d -ApprovedResolver 10.0.0.10 } | Should -Throw '*Get-FMPDHCPInventory*'
    }
}

Describe 'The address plan (Book 08, Chapter 07; Book 10, Chapter 06)' {
    BeforeAll {
        $script:Ipam = Join-Path (Join-Path $FixturePath 'ddi') 'ipam'
        $script:P = Test-FMPAddressPlan -IpamPath (Join-Path $Ipam 'ipam-allocations.csv') -Path $Run `
            -AzureVnetPath (Join-Path $Ipam 'azure-vnets.json') -AwsVpcPath (Join-Path $Ipam 'aws-vpcs.json') -OciVcnPath (Join-Path $Ipam 'oci-vcns.json')
    }
    It 'reads every network from the three clouds and the DHCP scopes, a shared scope once' {
        $P.Networks | Should -HaveCount 14
        @($P.Networks | Where-Object Platform -eq 'On-premises') | Should -HaveCount 4
        @($P.Networks | Where-Object Prefix -eq 'fd12:3456:789a:1::/64')[0].Use | Should -Be 'Azure'
    }
    It 'flags a network outside the plan' {
        $f = @($P.Findings | Where-Object Check -eq 'Outside the plan')
        $f | Should -HaveCount 1
        $f[0].Prefix | Should -Be '100.64.0.0/22'
    }
    It 'flags networks inside another platform''s allocation' {
        @(($P.Findings | Where-Object Check -eq 'Wrong allocation').Network | Sort-Object) | Should -Be @('Azure vnet-app-02', 'OCI vcn-test')
    }
    It 'flags every overlap once' {
        $o = @($P.Findings | Where-Object Check -eq 'Overlap')
        $o | Should -HaveCount 2
        ($o.Finding -join ' ') | Should -Match 'OCI vcn-test'
        ($o.Finding -join ' ') | Should -Match 'DHCP scope Branch clients'
    }
    It 'places each forwarder''s target in the network that holds it' {
        @($P.ForwarderTargets | Where-Object Zone -eq 'blob.core.windows.net')[0].Network | Should -Be 'Azure vnet-hub-westus2'
        @($P.ForwarderTargets | Where-Object Zone -eq 'partner.example')[0].Network | Should -Be 'Outside the address plan'
    }
    It 'tells IPv4 and IPv6 apart, and handles a prefix that is not byte-aligned' {
        $plan = Join-Path $TestDrive 'plan.csv'
        "Prefix,Name,Use`n10.8.0.0/13,Odd,Azure`nfd00::/8,ULA,AWS" | Set-Content -Path $plan -Encoding UTF8
        $az = Join-Path $TestDrive 'az.json'
        '[{"name":"a","addressSpace":{"addressPrefixes":["10.15.255.0/24","10.16.0.0/24","fd00:1::/64"]}}]' | Set-Content -Path $az -Encoding UTF8
        $x = Test-FMPAddressPlan -IpamPath $plan -AzureVnetPath $az
        @($x.Networks | Where-Object Prefix -eq '10.15.255.0/24')[0].Use | Should -Be 'Azure'
        @($x.Findings | Where-Object Prefix -eq '10.16.0.0/24')[0].Check | Should -Be 'Outside the plan'
        @($x.Findings | Where-Object Prefix -eq 'fd00:1::/64')[0].Check | Should -Be 'Wrong allocation'
    }
    It 'refuses a plan with a line that is not a prefix' {
        $bad = Join-Path $TestDrive 'bad.csv'
        "Prefix,Name,Use`n10.0.0.0/33,Bad,Azure" | Set-Content -Path $bad -Encoding UTF8
        { Test-FMPAddressPlan -IpamPath $bad } | Should -Throw '*Not a prefix*'
    }
    It 'writes the plan and its findings under -OutputPath only' {
        $out = Join-Path $TestDrive 'plan-out'
        $null = Test-FMPAddressPlan -IpamPath (Join-Path $Ipam 'ipam-allocations.csv') -AwsVpcPath (Join-Path $Ipam 'aws-vpcs.json') -OutputPath $out
        @(Import-Csv (Join-Path (Join-Path $out 'address-plan') 'AddressPlan.csv')) | Should -HaveCount 3
        @(Import-Csv (Join-Path (Join-Path $out 'address-plan') 'AddressPlanFindings.csv')) | Should -HaveCount 1
    }
}

Describe 'Reading what the DNS collector writes' {
    BeforeAll {
        $script:OnWindows = $PSVersionTable.PSEdition -eq 'Desktop' -or $IsWindows
        if ($OnWindows) {
            Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
            Register-KitAdMocks -ModuleName FMPADAssessment
            $script:Live = Join-Path $TestDrive 'collected'
            Get-FMPDNSAssessment -OutputPath $Live -Domain 'contoso.example' -DnsServer 'dc01.contoso.example', 'dc02.contoso.example' -AsOf $FMPAsOf
            $null = Get-FMPDHCPInventory -OutputPath $Live -Domain 'contoso.example'
        }
    }
    It 'checks the DHCP edge from Get-FMPDHCPInventory''s own output' {
        if (-not $OnWindows) { Set-ItResult -Skipped -Because 'the collectors run only on Windows'; return }
        $x = Test-FMPDhcpEdge -Path (Join-Path $Live 'contoso.example') -ApprovedResolver 10.0.0.10
        @($x.Scopes | Where-Object ScopeId -eq '10.0.6.0')[0].DnsServers | Should -Be '10.0.0.11'
        @($x.Findings | Where-Object Area -eq 'Option 6' | Where-Object Scope -eq '10.0.6.0')[0].Finding | Should -Match '10\.0\.0\.11 \(set on the scope\)'
        @($x.Findings | Where-Object Area -eq 'DHCP servers')[0].Server | Should -Be 'dhcp02.contoso.example'
        @($x.Findings | Where-Object Finding -like 'No dedicated*').Count | Should -Be 1
    }
    It 'builds a register from Get-FMPDNSAssessment''s own output' {
        if (-not $OnWindows) { Set-ItResult -Skipped -Because 'Resolve-DnsName, which the collector calls, exists only on Windows'; return }
        $x = Get-FMPDnsDepartureRegister -Path (Join-Path $Live 'contoso.example')
        @($x.Rows | Where-Object Zone -eq 'contoso.example')[0].Component | Should -Be 'AD-integrated zone, internal'
        @($x.Rows | Where-Object Zone -eq 'partner.example')[0].Notes | Should -Match '192\.0\.2\.53'
        @($x.Rows | Where-Object Zone -eq '_msdcs.contoso.example')[0].Storage | Should -Be 'ForestDnsZones'
        @($x.Findings | Where-Object Item -eq 'dc02.contoso.example')[0].Finding | Should -Match 'RPC'
        @($x.Findings | Where-Object Item -eq 'Aging and scavenging')[0].Finding | Should -Match '^Not read'
    }
}
