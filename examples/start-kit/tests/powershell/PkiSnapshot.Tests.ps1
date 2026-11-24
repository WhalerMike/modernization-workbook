# The PKI assessment on a snapshot file (tests\fixtures\pki-contoso.json), the template
# classification from Book 07 Appendix B, the audit filter, and the finding-level comparison
# between two runs. Nothing here reads a directory or a CA: the stubs throw if anything tries.
BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelpers.ps1')
    Import-Module (Join-Path (Join-Path $KitRoot 'powershell') 'FMPADAssessment') -Force
    $script:Snap = Join-Path $FixturePath 'pki-contoso.json'
    Mock -ModuleName FMPADAssessment Get-FMPCAEditFlags { throw 'certutil must not run on a snapshot' }
    Mock -ModuleName FMPADAssessment Get-FMPCAAuditFilter { throw 'certutil must not run on a snapshot' }

    $script:Run = Join-Path $TestDrive 'run1'
    Get-FMPPKIAssessment -OutputPath $Run -PkiDataPath $Snap
    $script:PkiDir = Join-Path $Run 'contoso.example\PKI'
    function Read-Out([string]$Path) { (Get-Content -Raw -Path $Path | ConvertFrom-Json) | ForEach-Object { $_ } }
    $script:Inv = Get-Content -Raw (Join-Path $PkiDir 'PKIInventory.json') | ConvertFrom-Json
    $script:Findings = @(Read-Out (Join-Path $PkiDir 'PKISecurityReport.json'))
}

Describe 'The assessment on a snapshot' {
    It 'writes the inventory, the findings and each CA certificate under the snapshot''s domain' {
        foreach ($f in 'PKIInventory.json', 'PKISecurityReport.json', 'Contoso_Issuing_CA_1.cer', 'Contoso_Issuing_CA_2.cer') {
            Join-Path $PkiDir $f | Should -Exist
        }
    }
    It 'reads each CA certificate from base64: issuer, expiry in UTC, key size' {
        $ca1 = $Inv.CertificationAuthorities | Where-Object CAName -eq 'Contoso Issuing CA 1'
        $ca1.CertIssuer | Should -Match '^CN=Contoso Root CA'
        # Windows PowerShell 5.1 reads the value as a string, PowerShell 7 as a date.
        ([datetime]$ca1.NotAfter).ToUniversalTime() | Should -Be ([datetime]::new(2027, 3, 1, 0, 0, 0, [DateTimeKind]::Utc))
        $ca1.KeySize | Should -Be 2048
    }
    It 'records each CA''s audit filter from the snapshot' {
        ($Inv.CertificationAuthorities | Where-Object CAName -eq 'Contoso Issuing CA 1').AuditFilter | Should -Be 0
        ($Inv.CertificationAuthorities | Where-Object CAName -eq 'Contoso Issuing CA 2').AuditFilter | Should -Be 127
    }
    It 'keeps every template''s EKUs as a list' {
        $k = $Inv.CertificateTemplates | Where-Object Name -eq 'KerberosAuthentication'
        @($k.EKU) | Should -Contain '1.3.6.1.5.2.3.5'
        @($k.EKU).Count | Should -Be 4
        @($Inv.CertificateTemplates).Count | Should -Be 15
        @($Inv.CertificateTemplates | Where-Object { -not $_.Published }).Name | Sort-Object | Should -Be @('DomainController', 'EFSRecovery', 'SubCA')
    }
    It 'lists the CDP and AIA objects' {
        @($Inv.CDPObjects).Count | Should -Be 3
        @($Inv.AIAObjects).Name | Should -Contain 'Contoso Root CA'
    }
    It 'finds ESC1, ESC2, ESC4 and ESC6, and nothing on the default templates' {
        @($Findings | ForEach-Object { "$($_.Finding) $($_.Template)" } | Sort-Object) | Should -Be @(
            'ESC1 Web Server Legacy', 'ESC2 Legacy Any Purpose', 'ESC4 Contoso SCEP (NDES)', 'ESC6 N/A (ca01.contoso.example\Contoso Issuing CA 1)')
    }
    It 'refuses a snapshot without a domain' {
        $bad = Join-Path $TestDrive 'bad.json'
        Set-Content -Path $bad -Value '{ "cas": [] }'
        { Get-FMPPKIAssessment -OutputPath (Join-Path $TestDrive 'bad') -PkiDataPath $bad } | Should -Throw '*no ''domain''*'
    }
}

Describe 'Template classification' {
    BeforeAll { $script:Rows = @(Get-FMPTemplateClassification -OutputPath $Run -Domain 'contoso.example') }
    It 'writes TemplateClassification.csv with one row per template' {
        Join-Path $PkiDir 'TemplateClassification.csv' | Should -Exist
        @(Import-Csv (Join-Path $PkiDir 'TemplateClassification.csv')).Count | Should -Be 15
    }
    It 'gives a default template Appendix B''s starting class: <Template> is <Class>' -ForEach @(
        @{ Template = 'User'; Class = 'MIGRATE' }
        @{ Template = 'KerberosAuthentication'; Class = 'BRIDGE' }
        @{ Template = 'WebServer'; Class = 'RETAIN' }
        @{ Template = 'EFS'; Class = 'RETIRE' }
    ) {
        $r = $Rows | Where-Object Template -eq $Template
        $r.StartingClass | Should -Be $Class
        $r.Status | Should -Be 'Owner confirms'
        $r.Owner | Should -BeNullOrEmpty
    }
    It 'leaves every custom template to its owner' {
        @($Rows | Where-Object Status -eq 'Owner classifies').Template | Sort-Object |
            Should -Be @('ContosoSCEP', 'ContosoVPNUser', 'LegacyAnyPurpose', 'WebServerLegacy')
    }
    It 'matches every row of the matrix to an AD CS default template name' {
        $m = @(Import-Csv (Join-Path $KitRoot 'powershell\FMPADAssessment\TemplateMatrix.csv'))
        $m.Count | Should -Be 27
        @($m | Where-Object { -not $_.Class -or -not $_.Target }) | Should -BeNullOrEmpty
    }
    It 'needs the inventory first' {
        { Get-FMPTemplateClassification -OutputPath (Join-Path $TestDrive 'empty') -Domain 'contoso.example' } | Should -Throw '*Run Get-FMPPKIAssessment first*'
    }
}

Describe 'The audit filter' {
    It 'reads <Text> as <Value>' -ForEach @(
        @{ Text = '  AuditFilter REG_DWORD = 7f (127)'; Value = 127 }
        @{ Text = '  AuditFilter REG_DWORD = 0'; Value = 0 }
        @{ Text = '  AuditFilter REG_DWORD = 3'; Value = 3 }
    ) {
        InModuleScope FMPADAssessment -Parameters @{ T = $Text } { param($T) ConvertFrom-FMPAuditFilter -Text $T } | Should -Be $Value
    }
    It 'returns nothing for output it can''t read' {
        InModuleScope FMPADAssessment { ConvertFrom-FMPAuditFilter -Text 'CertUtil: The system cannot find the file specified.' } | Should -BeNullOrEmpty
    }
}

Describe 'Comparing two runs finding by finding' {
    It 'names the findings a remediation closed' {
        $fixed = Get-Content -Raw $Snap | ConvertFrom-Json
        ($fixed.templates | Where-Object cn -eq 'WebServerLegacy').'msPKI-Certificate-Name-Flag' = 0
        $fixed.cas[0].editFlags = $fixed.cas[1].editFlags
        $fixedPath = Join-Path $TestDrive 'pki-fixed.json'
        $fixed | ConvertTo-Json -Depth 10 | Set-Content -Path $fixedPath
        $run2 = Join-Path $TestDrive 'run2'
        Get-FMPPKIAssessment -OutputPath $run2 -PkiDataPath $fixedPath
        $d = @(Compare-FMPAssessments -BaselinePath (Join-Path $Run 'contoso.example') -CurrentPath (Join-Path $run2 'contoso.example') |
            Where-Object File -eq 'PKI\PKISecurityReport.json')
        $d.Status | Should -Be 'Changed'
        @($d.Removed) | Should -Be @('ESC1 | Web Server Legacy', 'ESC6 | N/A (ca01.contoso.example\Contoso Issuing CA 1)')
        @($d.Added) | Should -BeNullOrEmpty
    }
}
