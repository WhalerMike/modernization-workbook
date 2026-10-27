BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPNpsInventory') -Force
    Register-KitNpsMocks
    $script:Xml = Get-Content -Raw -Path $FMPNpsConfigPath
    $script:Key = [byte[]](1..32)
    $script:Secrets = @([regex]::Matches($Xml, '<(?:Accounting_)?Shared_Secret[^>]*>([^<]+)<') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
}

Describe 'Parsing an NPS configuration' {
    BeforeAll {
        $script:P = ConvertFrom-FMPNpsConfig -Xml $Xml -Server 'nps01.contoso.example' -Key $Key -Thumbprints '1F4E8C2A9B3D7E6F5A1C0B9D8E7F6A5B4C3D2E1F', 'AA00BB11CC22DD33EE44FF5566778899AABBCCDD'
        function Get-Policy($Name) { @($P.NetworkPolicies + $P.ConnectionRequestPolicies | Where-Object Name -eq $Name)[0] }
    }
    It 'finds every collection' {
        $P.ParseStatus | Should -Be 'Read'
        $P.Clients | Should -HaveCount 3
        $P.NetworkPolicies | Should -HaveCount 4
        $P.ConnectionRequestPolicies | Should -HaveCount 2
        $P.RemoteServers | Should -HaveCount 1
    }
    It 'reads a RADIUS client without keeping its secret' {
        $c = @($P.Clients | Where-Object Name -eq 'sw-core')[0]
        $c.Address | Should -Be '10.0.10.2'
        $c.Vendor | Should -Be 'Cisco'
        $c.Enabled | Should -BeTrue
        $c.RequireMessageAuthenticator | Should -BeFalse
        $c.SecretLength | Should -Be 13
        ($c | ConvertTo-Json) | Should -Not -Match 'FIXTURE'
    }
    It 'gives clients that share a secret the same fingerprint, and others a different one' {
        $f = @{}; foreach ($c in $P.Clients) { $f[$c.Name] = $c.SecretFingerprint }
        $f.wlc01 | Should -Be $f.vpn01
        $f.wlc01 | Should -Not -Be $f.'sw-core'
    }
    It 'keys the fingerprint on the run, so another run cannot match it' {
        $other = ConvertFrom-FMPNpsConfig -Xml $Xml -Server 'x' -Key ([byte[]](32..63))
        @($other.Clients)[0].SecretFingerprint | Should -Not -Be @($P.Clients)[0].SecretFingerprint
    }
    It 'reads a network policy: order, access, groups, connection type, methods and certificate' {
        $w = Get-Policy 'Wireless EAP-TLS'
        $w.Order | Should -Be 1
        $w.Access | Should -Be 'Grant'
        $w.GroupSids | Should -Be @('S-1-5-21-1000-1000-1000-1201')
        $w.ConnectionTypes | Should -Be @('Wireless 802.11')
        $w.AuthMethods | Should -Be @('EAP')
        $w.EapTypes | Should -Be @('EAP-TLS')
        $w.ServerCertificates | Should -Be @('1F4E8C2A9B3D7E6F5A1C0B9D8E7F6A5B4C3D2E1F')
        $w.WeakAuthMethods | Should -BeNullOrEmpty
    }
    It 'reads several groups from one condition, across domains' {
        (Get-Policy 'Wired 802.1X').GroupSids | Should -HaveCount 3
        (Get-Policy 'Wired 802.1X').ConnectionTypes | Should -Be @('Ethernet (wired 802.1X)')
        (Get-Policy 'Wired 802.1X').AuthMethods | Should -Be @('PEAP', 'EAP')
    }
    It 'flags PAP on a granting policy as weak' {
        (Get-Policy 'VPN legacy').WeakAuthMethods | Should -Be @('PAP')
        (Get-Policy 'Deny everyone else').Access | Should -Be 'Deny'
    }
    It 'reads where a connection request policy forwards' {
        $c = Get-Policy 'Partner realm'
        $c.Kind | Should -Be 'ConnectionRequest'
        $c.AuthProvider | Should -Be 'RADIUS proxy'
        $c.ForwardTo | Should -Be 'Partner RADIUS'
        (Get-Policy 'Use Windows authentication for all users').AuthProvider | Should -Be 'Windows'
    }
    It 'reads a remote RADIUS server and its group' {
        $r = @($P.RemoteServers)[0]
        $r.Group | Should -Be 'Partner RADIUS'
        $r.Address | Should -Be '198.51.100.20'
        $r.AuthenticationPort | Should -Be 1812
        $r.SecretLength | Should -BeGreaterOrEqual 32
    }
    It 'says so when a file has none of the known collections' {
        $n = ConvertFrom-FMPNpsConfig -Xml '<Root><Children><Something><Children><Other/></Children></Something></Children></Root>' -Server 'x' -Key $Key
        $n.ParseStatus | Should -Be 'NoKnownSections'
        $n.ElementsFound | Should -Contain 'Other'
    }
    It 'reads NAS port types it has no label for by number' {
        (ConvertFrom-FMPNpsConstraint 'MATCH("NAS-Port-Type=^17$")').PortTypes | Should -Be @('NAS-Port-Type 17')
    }
}

Describe 'KB5040268 events' {
    It 'counts the events and reads the mode from 4421' {
        $e = Get-FMPNpsHardeningEvent -ComputerName 'nps01.contoso.example' -Since ([datetime]'2026-09-27')
        $e.Event4421 | Should -Be 1
        $e.Event4419 | Should -Be 2
        $e.Mode | Should -Be 'Disable'
    }
    It 'treats "no events" as zero, not as a failure' {
        $e = Get-FMPNpsHardeningEvent -ComputerName 'nps02.contoso.example' -Since ([datetime]'2026-09-27')
        $e.Event4421 | Should -Be 0
        $e.Mode | Should -BeNullOrEmpty
    }
    It 'passes a denied read up to the caller' {
        { Get-FMPNpsHardeningEvent -ComputerName 'rras01.child.contoso.example' -Since ([datetime]'2026-09-27') } | Should -Throw '*denied*'
    }
}

Describe 'Invoke-FMPNpsInventory against the fixture estate' {
    BeforeAll {
        $script:Out = Join-Path $TestDrive 'nps-run'
        $script:R = Invoke-FMPNpsInventory -OutputPath $Out -AsOf $FMPAsOf
        $script:NpsDir = Join-Path $Out 'NPS'
        function Get-Finding($Name) { @($R.Findings | Where-Object Finding -eq $Name) }
    }
    It 'finds the servers in each domain''s RAS and IAS Servers group' {
        @($R.Servers.Server) | Should -Be @('nps01.contoso.example', 'nps02.contoso.example', 'rras01.child.contoso.example')
        @($R.Servers | Where-Object ConfigStatus -eq 'Read') | Should -HaveCount 2
        $rras = @($R.Servers | Where-Object Server -like 'rras01*')[0]
        $rras.Domain | Should -Be 'child.contoso.example'
        $rras.ConfigStatus | Should -Match '^NotReadable: .*denied'
        $rras.EventStatus | Should -Match '^NotReadable'
    }
    It 'counts clients, policies and remote servers on every server it read' {
        $R.Summary.NpsServers | Should -Be 3
        $R.Summary.NpsServersRead | Should -Be 2
        $R.Summary.RadiusClients | Should -Be 6
        $R.Summary.UniqueRadiusClientAddresses | Should -Be 3
        $R.Summary.NetworkPolicies | Should -Be 8
        $R.Summary.ConnectionRequestPolicies | Should -Be 4
        $R.Summary.RemoteRadiusServers | Should -Be 2
    }
    It 'labels shared secrets per run and drops the fingerprint' {
        @($R.Clients | Where-Object { $_.PSObject.Properties['SecretFingerprint'] }) | Should -BeNullOrEmpty
        $labels = @{}; foreach ($c in $R.Clients) { $labels["$($c.Server)|$($c.Name)"] = $c.SecretGroup }
        $labels['nps01.contoso.example|wlc01'] | Should -Be $labels['nps01.contoso.example|vpn01']
        $labels['nps01.contoso.example|wlc01'] | Should -Be $labels['nps02.contoso.example|wlc01']
        $labels['nps01.contoso.example|sw-core'] | Should -Not -Be $labels['nps01.contoso.example|wlc01']
    }
    It 'resolves each policy group through its own domain, and says when it cannot' {
        $pg = Import-Csv (Join-Path $NpsDir 'PolicyGroups.csv')
        @($pg | Where-Object { $_.Server -eq 'nps01.contoso.example' -and $_.GroupSid -eq 'S-1-5-21-2000-2000-2000-1203' })[0].Group | Should -Be 'Child-Wired-Devices'
        @($pg | Where-Object { $_.Server -eq 'nps01.contoso.example' -and $_.GroupSid -eq 'S-1-5-21-2000-2000-2000-1203' })[0].Domain | Should -Be 'child.contoso.example'
        @($pg | Where-Object GroupSid -eq 'S-1-5-21-9999-9999-9999-1100')[0].Status | Should -Be 'Domain outside the assessed forest'
        $R.Summary.AdGroupsReferenced | Should -Be 5
        @($R.Policies | Where-Object Name -eq 'VPN legacy')[0].Groups | Should -Be @('contoso.example\VPN-Users')
    }
    It 'links the policy certificate and reads the extension and events' {
        $cert = @($R.Certificates | Where-Object Thumbprint -eq '1F4E8C2A9B3D7E6F5A1C0B9D8E7F6A5B4C3D2E1F')[0]
        $cert.UsedByPolicy | Should -Be 'Wireless EAP-TLS;Wired 802.1X'
        $nps01 = @($R.Servers | Where-Object Server -eq 'nps01.contoso.example')[0]
        $nps01.MfaExtension | Should -BeTrue
        $nps01.Kb5040268Mode | Should -Be 'Disable'
        @($R.Servers | Where-Object Server -eq 'nps02.contoso.example')[0].Kb5040268Mode | Should -Be 'No event 4421 in the window'
    }
    It 'flags what Book 09 Chapter 07''s rules ask for' {
        @(Get-Finding 'Shared secret shorter than the program minimum') | Should -HaveCount 2
        @(Get-Finding 'Shared secret used by more than one RADIUS client') | Should -HaveCount 1
        (Get-Finding 'Shared secret used by more than one RADIUS client')[0].Detail | Should -Match 'wlc01.*vpn01|vpn01.*wlc01'
        @(Get-Finding 'Message-Authenticator not required') | Should -HaveCount 2
        @(Get-Finding 'Policy allows a weak authentication method') | Should -HaveCount 2
        @(Get-Finding 'KB5040268 protections not enabled') | Should -HaveCount 1
        @(Get-Finding 'Policy certificate expires soon') | Should -HaveCount 1
        @(Get-Finding 'Entra multifactor authentication NPS extension installed') | Should -HaveCount 1
        @(Get-Finding 'Fewer than two NPS servers read') | Should -BeNullOrEmpty
    }
    It 'writes the inventory files' {
        foreach ($f in 'NpsServers.csv', 'RadiusClients.csv', 'NetworkPolicies.csv', 'PolicyGroups.csv', 'RemoteRadiusServers.csv', 'NpsCertificates.csv', 'NpsFindings.csv', 'NpsInventory.json', 'NpsSummary.json') {
            Join-Path $NpsDir $f | Should -Exist
        }
        @(Import-Csv (Join-Path $NpsDir 'NetworkPolicies.csv') | Where-Object Name -eq 'Wired 802.1X')[0].ConnectionTypes | Should -Be 'Ethernet (wired 802.1X)'
    }
    It 'writes no shared secret, in any form, to any file' {
        $Secrets | Should -HaveCount 3
        foreach ($file in Get-ChildItem -Path $Out -Recurse -File) {
            $text = Get-Content -Raw -Path $file.FullName
            foreach ($s in $Secrets) { $text.Contains($s) | Should -BeFalse -Because "$($file.Name) must not hold a secret" }
            $text | Should -Not -Match 'FIXTURE'
            $text | Should -Not -Match 'Fingerprint'
        }
    }
}

Describe 'Offline configuration files' {
    It 'parses an export on disk without touching the directory or any server' {
        $out = Join-Path $TestDrive 'nps-offline'
        $r = Invoke-FMPNpsInventory -OutputPath $out -ConfigPath $FMPNpsConfigPath -SkipDirectory -AsOf $FMPAsOf
        Should -Invoke -ModuleName FMPNpsInventory Get-ADGroupMember -Times 0 -Exactly -Scope It
        Should -Invoke -ModuleName FMPNpsInventory Read-FMPNpsConfigFile -Times 0 -Exactly -Scope It
        @($r.Servers) | Should -HaveCount 1
        @($r.Servers)[0].Server | Should -Be 'nps-ias'
        @($r.Servers)[0].ConfigStatus | Should -Be 'Read'
        $r.Summary.RadiusClients | Should -Be 3
        @($r.Findings | Where-Object Finding -eq 'Fewer than two NPS servers read') | Should -HaveCount 1
        @($r.Policies | Where-Object Name -eq 'Wired 802.1X')[0].Groups | Should -Contain 'S-1-5-21-1000-1000-1000-1202'
    }
}
