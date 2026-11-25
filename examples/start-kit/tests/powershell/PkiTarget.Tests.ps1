# The target-PKI and device-certificate checks of the PKI and Certificates learning path, Modules 3
# and 4: each CA's CRL and AIA locations (Get-FMPCAPublicationReview, Book 07 Chapter 04) and strong
# certificate mapping (Get-FMPCertificateMappingReport, Chapter 06), on the fictional snapshots.
# Nothing here reads a directory, a CA or an event log: the stubs throw if anything tries.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
    Mock -ModuleName FMPADAssessment Get-FMPCAEditFlags { throw 'certutil must not run on a snapshot' }
    Mock -ModuleName FMPADAssessment Get-FMPCAAuditFilter { throw 'certutil must not run on a snapshot' }
    # Get-WinEvent doesn't exist outside Windows; Pester can only mock a command that does.
    if (-not (Get-Command -Name Get-WinEvent -ErrorAction SilentlyContinue)) {
        function global:Get-WinEvent { param($ComputerName, $MaxEvents, $FilterHashtable) throw 'Stub Get-WinEvent was called without a mock.' }
    }
    Mock -ModuleName FMPADAssessment Get-WinEvent { throw 'no event log on a snapshot' }

    $script:PubRun = Join-Path $TestDrive 'pub'
    Get-FMPCAPublicationReview -OutputPath $PubRun -PkiDataPath (Join-Path $FixturePath 'pki-contoso.json')
    $script:PubDir = Join-Path $PubRun 'contoso.example\PKI'
    $script:Pub = Get-Content -Raw (Join-Path $PubDir 'CAPublication.json') | ConvertFrom-Json

    $script:MapRun = Join-Path $TestDrive 'map'
    Get-FMPCertificateMappingReport -OutputPath $MapRun -MappingDataPath (Join-Path $FixturePath 'cert-mapping-contoso.json')
    $script:MapDir = Join-Path $MapRun 'contoso.example\PKI'
    $script:Map = Get-Content -Raw (Join-Path $MapDir 'CertificateMapping.json') | ConvertFrom-Json
}

Describe 'Publication URLs from certutil -getreg' {
    It 'reads index, flags and URL, and skips the flag names certutil prints under each' {
        $text = "  CRLPublicationURLs REG_MULTI_SZ =`n    0: 65:C:\Windows\system32\CertSrv\CertEnroll\%3%8%9.crl`n    CSURL_SERVERPUBLISH -- 1`n    CSURL_SERVERPUBLISHDELTA -- 40 (64)`n`n    1: 6:http://pki.contoso.example/crl/%3%8%9.crl`n    CSURL_ADDTOCERTCDP -- 2`n"
        $r = @(InModuleScope FMPADAssessment -Parameters @{ T = $text } { param($T) ConvertFrom-FMPPublicationUrls -Text $T -Kind CDP })
        $r.Count | Should -Be 2
        $r[0].Scheme | Should -Be 'local'
        $r[0].Publishes | Should -BeTrue
        $r[0].InIssuedCertificates | Should -BeFalse
        $r[1].Scheme | Should -Be 'http'
        $r[1].InIssuedCertificates | Should -BeTrue
    }
    It 'marks an AIA URL with flag 0x20 as the OCSP location' {
        $r = @(InModuleScope FMPADAssessment { ConvertFrom-FMPPublicationUrls -Text '    3: 32:http://ocsp.contoso.example/ocsp' -Kind AIA })
        $r[0].Ocsp | Should -BeTrue
        $r[0].InIssuedCertificates | Should -BeFalse
    }
    It 'returns nothing for nothing' {
        @(InModuleScope FMPADAssessment { ConvertFrom-FMPPublicationUrls -Text $null -Kind CDP }).Count | Should -Be 0
    }
}

Describe 'The CA publication review on a snapshot' {
    It 'writes the review and the URL list under the snapshot''s domain' {
        Join-Path $PubDir 'CAPublication.json' | Should -Exist
        @(Import-Csv (Join-Path $PubDir 'CAPublicationUrls.csv')).Count | Should -Be 12
    }
    It 'flags the CA whose issued certificates carry no HTTP CRL or AIA location' {
        @($Pub.Findings | ForEach-Object { "$($_.Finding) $($_.CAName)" }) |
            Should -Be @('NO-HTTP-CDP Contoso Issuing CA 1', 'NO-HTTP-AIA Contoso Issuing CA 1')
    }
    It 'lists the locations that go into each CA''s certificates' {
        $ca2 = $Pub.CertificationAuthorities | Where-Object CAName -eq 'Contoso Issuing CA 2'
        @($ca2.CdpInCertificates) | Should -Contain 'http://pki.contoso.example/crl/%3%8%9.crl'
        @($ca2.AiaInCertificates).Count | Should -Be 2
        $ca2.KeySize | Should -Be 2048
        $ca2.SignatureAlgorithm | Should -Be 'sha256RSA'
    }
    It 'flags an HTTP location on the CA server itself, a short key, SHA-1 and an unreadable CA' {
        $snap = Get-Content -Raw (Join-Path $FixturePath 'pki-contoso.json') | ConvertFrom-Json
        $snap.cas[0].crlPublicationUrls = "    0: 6:http://%1/CertEnroll/%3%8%9.crl`n"
        $snap.cas[0].caCertPublicationUrls = "    0: 2:http://%1/CertEnroll/%1_%3%4.crt`n"
        $snap.cas[1].crlPublicationUrls = $null
        $p = Join-Path $TestDrive 'edge.json'
        $snap | ConvertTo-Json -Depth 10 | Set-Content -Path $p -Encoding UTF8
        Get-FMPCAPublicationReview -OutputPath (Join-Path $TestDrive 'edge') -PkiDataPath $p
        $f = (Get-Content -Raw (Join-Path $TestDrive 'edge\contoso.example\PKI\CAPublication.json') | ConvertFrom-Json).Findings
        @($f | Where-Object Finding -eq 'HTTP-ON-CA-HOST').Count | Should -Be 2
        @($f | Where-Object Finding -eq 'CA-UNREADABLE').CAName | Should -Be 'Contoso Issuing CA 2'
    }
}

Describe 'Certificate mapping forms (KB5014754)' {
    It 'names <Value> as <Form>, <Strength>' -ForEach @(
        @{ Value = 'X509:<I>DC=example,DC=contoso,CN=CA<SR>1200000a11'; Form = 'X509IssuerSerialNumber'; Strength = 'Strong' }
        @{ Value = 'X509:<SKI>5c3e9a1f'; Form = 'X509SKI'; Strength = 'Strong' }
        @{ Value = 'X509:<SHA1-PUKEY>9f2b'; Form = 'X509SHA1PublicKey'; Strength = 'Strong' }
        @{ Value = 'X509:<I>DC=example,DC=contoso,CN=CA<S>CN=Bob'; Form = 'X509IssuerSubject'; Strength = 'Weak' }
        @{ Value = 'X509:<S>CN=Bob'; Form = 'X509SubjectOnly'; Strength = 'Weak' }
        @{ Value = 'X509:<RFC822>bob@contoso.example'; Form = 'X509RFC822'; Strength = 'Weak' }
        @{ Value = 'Kerberos:bob@PARTNER.EXAMPLE'; Form = 'Kerberos'; Strength = 'Not a certificate' }
    ) {
        $r = InModuleScope FMPADAssessment -Parameters @{ V = $Value } { param($V) ConvertTo-FMPMappingForm -Value $V }
        $r.Form | Should -Be $Form
        $r.Strength | Should -Be $Strength
    }
}

Describe 'KDC strong-mapping events' {
    It 'reads event <Id> on <Os> as <Meaning>' -ForEach @(
        @{ Id = 39; Os = 'Windows Server 2022 Datacenter'; Meaning = 'No strong mapping' }
        @{ Id = 41; Os = 'Windows Server 2019 Standard'; Meaning = 'SID extension does not match the account' }
        @{ Id = 41; Os = 'Windows Server 2008 R2 Enterprise'; Meaning = 'No strong mapping' }
        @{ Id = 49; Os = 'Windows Server 2008 R2 Enterprise'; Meaning = 'SID extension does not match the account' }
    ) {
        InModuleScope FMPADAssessment -Parameters @{ I = $Id; O = $Os } { param($I, $O) Get-FMPKdcMappingMeaning -Id $I -OperatingSystem $O } | Should -Be $Meaning
    }
    It 'ignores IDs 48 and 49 on later versions, where they mean something else' {
        InModuleScope FMPADAssessment { Get-FMPKdcMappingMeaning -Id 48 -OperatingSystem 'Windows Server 2022 Datacenter' } | Should -BeNullOrEmpty
    }
}

Describe 'The certificate mapping report on a snapshot' {
    It 'writes the report, the mappings and the events' {
        foreach ($f in 'CertificateMapping.json', 'AccountMappings.csv', 'KdcMappingEvents.csv') { Join-Path $MapDir $f | Should -Exist }
        @(Import-Csv (Join-Path $MapDir 'AccountMappings.csv')).Count | Should -Be 7
    }
    It 'counts accounts with a strong mapping and those with weak ones only' {
        $Map.Summary.AccountsWithCertificateMappings | Should -Be 5
        $Map.Summary.StrongMapping | Should -Be 2
        $Map.Summary.WeakOnly | Should -Be 3
    }
    It 'treats one strong mapping as enough, and leaves Kerberos mappings out' {
        ($Map.Accounts | Where-Object Account -eq 'dave').StrongMapping | Should -BeTrue
        @($Map.Accounts | Where-Object Account -eq 'svc-legacy').Count | Should -Be 0
    }
    It 'flags each weak-only account and each KDC event' {
        @($Map.Findings | Where-Object Finding -eq 'WEAK-ONLY' | ForEach-Object Subject) | Should -Be @('bob', 'carol', 'KIOSK01$')
        @($Map.Findings | Where-Object Finding -eq 'KDC-EVENT' | ForEach-Object Subject) | Should -Be @('CONTOSO\bob', 'CONTOSO\erin', 'CONTOSO\frank')
    }
    It 'reads the user and thumbprint from each event, with the time in UTC' {
        $e = @(Import-Csv (Join-Path $MapDir 'KdcMappingEvents.csv'))
        $e[0].User | Should -Be 'CONTOSO\bob'
        $e[0].CertificateThumbprint | Should -Be '3f7a2c9e1b5d8f0a4c6e2b9d7f1a3c5e8b0d2f4a'
        $e[0].TimeCreated | Should -Be '2026-11-18T14:02:11.0000000Z'
        $e[2].Meaning | Should -Be 'SID extension does not match the account'
    }
    It 'lists the CAs in the NTAuth store' {
        @($Map.NTAuth | ForEach-Object Subject) | Should -Be @('CN=Contoso Issuing CA 1, DC=contoso, DC=example', 'CN=Contoso Issuing CA 2, DC=contoso, DC=example')
    }
}

Describe 'The certificate mapping report against a directory' {
    BeforeAll {
        $m = @{ ModuleName = 'FMPADAssessment' }
        Mock @m Get-ADDomainController {
            [pscustomobject]@{ HostName = 'dc01.contoso.example'; OperatingSystem = 'Windows Server 2022 Datacenter' }
            [pscustomobject]@{ HostName = 'dc08.contoso.example'; OperatingSystem = 'Windows Server 2008 R2 Enterprise' }
            [pscustomobject]@{ HostName = 'dc09.contoso.example'; OperatingSystem = 'Windows Server 2019 Standard' }
        }
        Mock @m Get-ADRootDSE { [pscustomobject]@{ configurationNamingContext = 'CN=Configuration,DC=contoso,DC=example' } }
        Mock @m Get-ADObject -ParameterFilter { $LDAPFilter } {
            [pscustomobject]@{ sAMAccountName = 'bob'; objectClass = @('top', 'person', 'organizationalPerson', 'user'); altSecurityIdentities = @('X509:<S>CN=Bob') }
        }
        Mock @m Get-ADObject -ParameterFilter { $Identity } {
            $s = Get-Content -Raw (Join-Path $FixturePath 'cert-mapping-contoso.json') | ConvertFrom-Json
            [pscustomobject]@{ cACertificate = @(, [Convert]::FromBase64String($s.ntAuth[0])) }
        }
        Mock @m Get-WinEvent {
            switch -Wildcard ("$ComputerName") {
                'dc01.*' { [pscustomobject]@{ Id = 39; ProviderName = 'Microsoft-Windows-Kerberos-Key-Distribution-Center'; TimeCreated = [datetime]::new(2026, 11, 20, 8, 0, 0, [DateTimeKind]::Utc); Message = "KDC.`r`nUser: CONTOSOob`r`nCertificate Thumbprint: AA11" } }
                'dc08.*' {
                    [pscustomobject]@{ Id = 41; ProviderName = 'Kdcsvc'; TimeCreated = [datetime]::new(2026, 11, 21, 8, 0, 0, [DateTimeKind]::Utc); Message = "KDC.`r`nUser: CONTOSO\carol" }
                    [pscustomobject]@{ Id = 41; ProviderName = 'Microsoft-Windows-Time-Service'; TimeCreated = [datetime]::new(2026, 11, 21, 9, 0, 0, [DateTimeKind]::Utc); Message = 'Not the KDC.' }
                }
                default { throw 'The RPC server is unavailable.' }
            }
        }
        $script:Live = Join-Path $TestDrive 'live'
        Get-FMPCertificateMappingReport -OutputPath $Live -Domain contoso.example
        $script:LiveDoc = Get-Content -Raw (Join-Path $Live 'contoso.example\PKI\CertificateMapping.json') | ConvertFrom-Json
    }
    It 'reads each account''s mappings and the last object class' {
        ($LiveDoc.Accounts | Where-Object Account -eq 'bob').Forms | Should -Be 'X509SubjectOnly'
        (Import-Csv (Join-Path $Live 'contoso.example\PKI\AccountMappings.csv')).ObjectClass | Should -Be 'user'
    }
    It 'keeps only the KDC''s events, read by each domain controller''s version' {
        $e = @(Import-Csv (Join-Path $Live 'contoso.example\PKI\KdcMappingEvents.csv'))
        $e.Count | Should -Be 2
        ($e | Where-Object DomainController -like 'dc08*').Meaning | Should -Be 'No strong mapping'
        ($e | Where-Object DomainController -like 'dc01*').CertificateThumbprint | Should -Be 'AA11'
    }
    It 'reports a domain controller whose log it can''t read, and the NTAuth store' {
        ($LiveDoc.Findings | Where-Object Finding -eq 'DC-UNREADABLE').Subject | Should -Be 'dc09.contoso.example'
        ($LiveDoc.DomainControllers | Where-Object HostName -eq 'dc09.contoso.example').Readable | Should -BeFalse
        @($LiveDoc.NTAuth).Count | Should -Be 1
    }
}
