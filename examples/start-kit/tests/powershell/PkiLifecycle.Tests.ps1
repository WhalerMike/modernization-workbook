# The coexistence and lifecycle checks of the PKI and Certificates learning path, Modules 5 and 6:
# CRL freshness and size (Get-FMPCrlReport, Book 07 Chapters 07 and 08) and what each CA's database
# still holds (Get-FMPIssuedCertificateReport, Chapter 08's decommissioning steps), on the fictional
# CRLs in tests\fixtures\crl and certutil -view exports in tests\fixtures\issued-certificates.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
    $script:CrlDir = Join-Path $FixturePath 'crl'
    $script:IssuedDir = Join-Path $FixturePath 'issued-certificates'
    $script:AsOf = [datetime]::new(2026, 11, 20, 12, 0, 0, [DateTimeKind]::Utc)

    Get-FMPCrlReport -OutputPath (Join-Path $TestDrive 'crl') -Path (Join-Path $CrlDir '*.crl') -AsOf $AsOf
    $script:Crl = Get-Content -Raw (Join-Path $TestDrive 'crl\CRL\CrlReport.json') | ConvertFrom-Json

    Get-FMPIssuedCertificateReport -OutputPath (Join-Path $TestDrive 'issued') -Domain contoso.example -ExportFolder $IssuedDir -AsOf $AsOf `
        -FinalCrlPath (Join-Path $CrlDir 'Contoso Issuing CA 1.crl')
    $script:IssuedDirOut = Join-Path $TestDrive 'issued\contoso.example\PKI'
    $script:Issued = Get-Content -Raw (Join-Path $IssuedDirOut 'IssuedCertificates.json') | ConvertFrom-Json
}

Describe 'Reading a CRL' {
    It 'reads the issuer, this and next update, the revoked entries and the delta flag' {
        $c = InModuleScope FMPADAssessment -Parameters @{ P = (Join-Path $CrlDir 'Contoso Issuing CA 1.crl') } {
            param($P) ConvertFrom-FMPCrl -Bytes ([System.IO.File]::ReadAllBytes($P)) }
        $c.Issuer | Should -Be 'CN=Contoso Issuing CA 1, DC=contoso, DC=example'
        $c.ThisUpdate | Should -Be ([datetime]::new(2026, 11, 13, 12, 0, 0, [DateTimeKind]::Utc))
        $c.NextUpdate | Should -Be ([datetime]::new(2026, 11, 21, 0, 0, 0, [DateTimeKind]::Utc))
        $c.RevokedCount | Should -Be 2
        $c.Delta | Should -BeFalse
    }
    It 'reads a CRL with no revoked entries' {
        $c = InModuleScope FMPADAssessment -Parameters @{ P = (Join-Path $CrlDir 'Contoso Root CA.crl') } {
            param($P) ConvertFrom-FMPCrl -Bytes ([System.IO.File]::ReadAllBytes($P)) }
        $c.RevokedCount | Should -Be 0
        $c.NextUpdate.Year | Should -Be 2027
    }
    It 'reads a PEM CRL' {
        $der = [System.IO.File]::ReadAllBytes((Join-Path $CrlDir 'Contoso Issuing CA 2.crl'))
        $pem = "-----BEGIN X509 CRL-----`n" + [Convert]::ToBase64String($der, 'InsertLineBreaks') + "`n-----END X509 CRL-----`n"
        $c = InModuleScope FMPADAssessment -Parameters @{ B = [System.Text.Encoding]::ASCII.GetBytes($pem) } { param($B) ConvertFrom-FMPCrl -Bytes $B }
        $c.Issuer | Should -Be 'CN=Contoso Issuing CA 2, DC=contoso, DC=example'
    }
    It 'refuses a file that isn''t a CRL' {
        { InModuleScope FMPADAssessment { ConvertFrom-FMPCrl -Bytes ([byte[]](0x04, 0x02, 0x00, 0x00)) } } | Should -Throw
    }
}

Describe 'The CRL report' {
    It 'lists each CRL with the hours left at -AsOf' {
        @($Crl.Crls).Count | Should -Be 3
        ($Crl.Crls | Where-Object File -eq 'Contoso Issuing CA 1.crl').HoursToNextUpdate | Should -Be 12
        ($Crl.Crls | Where-Object File -eq 'Contoso Issuing CA 2.crl').HoursToNextUpdate | Should -Be 120
    }
    It 'flags only the CRL close to its next update' {
        @($Crl.Findings | ForEach-Object { "$($_.Finding) $($_.File)" }) | Should -Be @('CRL-NEAR-NEXT Contoso Issuing CA 1.crl')
    }
    It 'flags an expired CRL, an oversized one and a file it can''t read' {
        $bad = Join-Path $TestDrive 'bad'
        New-Item -ItemType Directory -Path $bad | Out-Null
        Copy-Item (Join-Path $CrlDir 'Contoso Issuing CA 2.crl') $bad
        Set-Content -Path (Join-Path $bad 'notes.crl') -Value 'not a CRL'
        Get-FMPCrlReport -OutputPath (Join-Path $TestDrive 'late') -Path (Join-Path $bad '*.crl') -AsOf ([datetime]'2026-12-01T00:00:00Z') -MaxBytes 100
        $f = (Get-Content -Raw (Join-Path $TestDrive 'late\CRL\CrlReport.json') | ConvertFrom-Json).Findings
        @($f | ForEach-Object Finding | Sort-Object) | Should -Be @('CRL-EXPIRED', 'CRL-TOO-LARGE', 'CRL-UNREADABLE')
    }
}

Describe 'The issued certificate report' {
    It 'counts unexpired and soon-expiring certificates per CA' {
        $ca1 = $Issued.CertificationAuthorities | Where-Object CAName -eq 'Contoso Issuing CA 1'
        $ca1.Issued | Should -Be 6
        $ca1.Unexpired | Should -Be 5
        $ca1.ExpiringWithinWindow | Should -Be 2
        ([datetime]$ca1.LastExpiry).ToUniversalTime().ToString('yyyy-MM-dd') | Should -Be '2027-11-02'
    }
    It 'breaks the unexpired certificates down by template' {
        $t = @(Import-Csv (Join-Path $IssuedDirOut 'IssuedCertificatesByTemplate.csv'))
        $t.Count | Should -Be 7
        ($t | Where-Object { $_.CAName -eq 'Contoso Issuing CA 1' -and $_.Template -eq 'Machine' }).Unexpired | Should -Be 2
    }
    It 'flags a final CRL that ends before the last certificate does, only for the CA it names' {
        @($Issued.Findings | Where-Object Finding -eq 'FINAL-CRL-SHORT').CAName | Should -Be 'Contoso Issuing CA 1'
    }
    It 'flags every CA that still holds unexpired certificates' {
        @($Issued.Findings | Where-Object Finding -eq 'UNEXPIRED' | ForEach-Object CAName) | Should -Be @('Contoso Issuing CA 1', 'Contoso Issuing CA 2')
        ($Issued.Findings | Where-Object { $_.Finding -eq 'EXPIRING' -and $_.CAName -eq 'Contoso Issuing CA 2' }).Detail | Should -Be '1 certificate expires within 60 days.'
    }
    It 'reads schema column names and a template shown as an OID and its name' {
        $d = Join-Path $TestDrive 'schema'
        New-Item -ItemType Directory -Path $d | Out-Null
        @('"RequestID","RequesterName","CertificateTemplate","NotAfter"', '"7","CONTOSO\eve","1.3.6.1.4.1.311.21.8.1.2 ContosoVPNUser","1/15/2027 12:00 PM"') |
            Set-Content -Path (Join-Path $d 'Old CA.csv')
        Get-FMPIssuedCertificateReport -OutputPath (Join-Path $TestDrive 'schema-out') -Domain contoso.example -ExportFolder $d -AsOf $AsOf
        $t = Import-Csv (Join-Path $TestDrive 'schema-out\contoso.example\PKI\IssuedCertificatesByTemplate.csv')
        $t.Template | Should -Be 'ContosoVPNUser'
    }
}
