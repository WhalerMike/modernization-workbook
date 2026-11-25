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

Describe 'Reading what the DNS collector writes' {
    BeforeAll {
        $script:OnWindows = $PSVersionTable.PSEdition -eq 'Desktop' -or $IsWindows
        if ($OnWindows) {
            Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
            Register-KitAdMocks -ModuleName FMPADAssessment
            $script:Live = Join-Path $TestDrive 'collected'
            Get-FMPDNSAssessment -OutputPath $Live -Domain 'contoso.example' -DnsServer 'dc01.contoso.example', 'dc02.contoso.example' -AsOf $FMPAsOf
        }
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
