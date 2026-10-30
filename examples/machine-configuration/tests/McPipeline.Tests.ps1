#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Unit tests for McPipeline.psm1 against fixtures. Needs neither the GuestConfiguration module nor
# Azure: packages are zipped in TestDrive, and the policy fixtures are definitions
# New-GuestConfigurationPolicy 4.12.0 wrote, with the package hash replaced by a placeholder.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path $PSScriptRoot '..')
    $script:Fx = Join-Path $script:Kit 'tests/fixtures'
    $script:Pinned = Join-Path $script:Kit '../third_party/guest-configuration-samples/package-samples/.example-project'
    Import-Module (Join-Path $script:Kit 'powershell/McPipeline.psm1') -Force
    $script:Name = 'TlsServerProtocols_1.0.0'
    $script:Audit = Get-McReleaseEntry -Path (Join-Path $script:Kit 'config/releases.json') -Name 'TlsServerProtocols'
    $script:Now = [datetimeoffset]'2026-10-30T00:00:00Z'

    function New-TestPackage {
        param(
            [string]$Name = $script:Name,
            [string]$Type = 'Audit',
            [string]$ModuleVersion = '2.12.0.0',
            [switch]$NoModule,
            [switch]$DirtyMof,
            [switch]$NoMof
        )
        $dir = Join-Path $TestDrive ([guid]::NewGuid().Guid)
        New-Item -ItemType Directory -Path $dir | Out-Null
        if (-not $NoMof) {
            if ($DirtyMof) { Copy-Item (Join-Path $script:Fx 'mof/compiled-a.mof') (Join-Path $dir "$Name.mof") }
            else { ConvertTo-McCleanMof -Path (Join-Path $script:Fx 'mof/compiled-a.mof') -Destination (Join-Path $dir "$Name.mof") | Out-Null }
        }
        Set-Content -LiteralPath (Join-Path $dir "$Name.metaconfig.json") -Value (@{ Version = '1.0.0'; Type = $Type } | ConvertTo-Json)
        if (-not $NoModule) {
            $m = New-Item -ItemType Directory -Path (Join-Path $dir 'Modules/PSDscResources') -Force
            Set-Content -LiteralPath (Join-Path $m 'PSDscResources.psd1') -Value "@{`n# Version number of this module.`nmoduleVersion = '$ModuleVersion'`n}"
        }
        $zip = Join-Path $TestDrive "$Name-$([guid]::NewGuid().Guid.Substring(0, 8)).zip"
        [IO.Compression.ZipFile]::CreateFromDirectory($dir, $zip)
        $final = Join-Path (Split-Path $zip) ([guid]::NewGuid().Guid)
        New-Item -ItemType Directory -Path $final | Out-Null
        $target = Join-Path $final "$Name.zip"
        Move-Item $zip $target
        $target
    }

    function New-TestPolicy {
        param([string]$Fixture = 'audit.json', [string]$PackagePath, [scriptblock]$Edit)
        $text = Get-Content -LiteralPath (Join-Path $script:Fx "policy/$Fixture") -Raw
        $text = $text.Replace('{{PACKAGE_SHA256}}', (Get-McFileSha256 -Path $PackagePath).ToUpperInvariant())
        if ($Edit) { $text = & $Edit $text }
        $out = Join-Path $TestDrive "$([guid]::NewGuid().Guid).json"
        Set-Content -LiteralPath $out -Value $text -NoNewline
        $out
    }

    function Get-Rules($Findings) { @($Findings | ForEach-Object { "$($_.Severity):$($_.Rule)" }) }
}

Describe 'Release registry' {
    It 'loads the shipped registry entry with a fixed GUID and a case-correct mode' {
        $script:Audit.mode | Should -BeExactly 'Audit'
        $script:Audit.policyId | Should -Match '^[0-9a-f-]{36}$'
        $script:Audit.name | Should -Be 'TlsServerProtocols'
    }
    It 'refuses a mode in the wrong case (Learn: the mode is case sensitive)' {
        $p = Join-Path $TestDrive 'bad-mode.json'
        @{ configurations = @{ X = @{ policyId = [guid]::NewGuid().Guid; platform = 'Windows'; mode = 'applyAndAutoCorrect'; published = '0.0.0'; identity = 'system' } } } |
            ConvertTo-Json -Depth 5 | Set-Content $p
        { Get-McReleaseEntry -Path $p -Name X } | Should -Throw '*case sensitive*'
    }
    It 'refuses a policy ID that is not a GUID' {
        $p = Join-Path $TestDrive 'bad-id.json'
        @{ configurations = @{ X = @{ policyId = 'my-policy'; platform = 'Windows'; mode = 'Audit'; published = '0.0.0'; identity = 'system' } } } |
            ConvertTo-Json -Depth 5 | Set-Content $p
        { Get-McReleaseEntry -Path $p -Name X } | Should -Throw '*GUID*'
    }
    It 'maps policy modes to package types' {
        Get-McPackageType -Mode 'Audit' | Should -Be 'Audit'
        Get-McPackageType -Mode 'ApplyAndMonitor' | Should -Be 'AuditAndSet'
        Get-McPackageType -Mode 'ApplyAndAutoCorrect' | Should -Be 'AuditAndSet'
    }
}

Describe 'ConvertTo-McCleanMof' {
    BeforeAll {
        $script:CleanA = ConvertTo-McCleanMof -Path (Join-Path $script:Fx 'mof/compiled-a.mof') -Destination (Join-Path $TestDrive 'a.mof')
        $script:CleanB = ConvertTo-McCleanMof -Path (Join-Path $script:Fx 'mof/compiled-b.mof') -Destination (Join-Path $TestDrive 'b.mof')
        $script:CleanText = Get-Content -LiteralPath $script:CleanA.FullName -Raw
    }
    It 'the two compiled fixtures list properties in different orders' {
        (Get-Content (Join-Path $script:Fx 'mof/compiled-a.mof') -Raw) -replace '\s', '' |
            Should -Not -Be ((Get-Content (Join-Path $script:Fx 'mof/compiled-b.mof') -Raw) -replace '\s', '')
    }
    It 'gives the same bytes for both, so the MOF hash is repeatable' {
        Get-McFileSha256 $script:CleanA.FullName | Should -Be (Get-McFileSha256 $script:CleanB.FullName)
    }
    It 'gives the same bytes from CRLF input' {
        $crlf = Join-Path $TestDrive 'crlf.mof'
        [IO.File]::WriteAllText($crlf, ((Get-Content (Join-Path $script:Fx 'mof/compiled-a.mof') -Raw) -replace "`n", "`r`n"))
        $c = ConvertTo-McCleanMof -Path $crlf -Destination (Join-Path $TestDrive 'crlf-clean.mof')
        Get-McFileSha256 $c.FullName | Should -Be (Get-McFileSha256 $script:CleanA.FullName)
    }
    It 'removes the user, host and date the compiler recorded' {
        $script:CleanText | Should -Not -Match 'builder|BUILD01|GenerationDate|GenerationHost|Author|@TargetNode'
    }
    It 'keeps SourceInfo as ::line::column::resource, without the build path' {
        $script:CleanText | Should -Match 'SourceInfo = "::9::9::Registry";'
        $script:CleanText | Should -Not -Match 'build\\\\src'
    }
    It 'keeps every instance and value' {
        ([regex]::Matches($script:CleanText, 'instance of ')).Count | Should -Be 3
        $script:CleanText | Should -Match 'Key = "HKEY_LOCAL_MACHINE\\\\SYSTEM\\\\CurrentControlSet\\\\Control\\\\SecurityProviders\\\\SCHANNEL\\\\Protocols\\\\TLS 1.1\\\\Server";'
        $script:CleanText | Should -Match 'ValueData = \{"0"\};'
        $script:CleanText | Should -Match 'CompatibleVersionAdditionalProperties = \{"Omi_BaseResource:ConfigurationName"\};'
    }
    It 'writes LF line endings and no byte-order mark' {
        $bytes = [IO.File]::ReadAllBytes($script:CleanA.FullName)
        $bytes[0] | Should -Not -Be 0xEF
        [Text.Encoding]::UTF8.GetString($bytes) | Should -Not -Match "`r"
    }
    It 'reads the modules the MOF imports' {
        $m = @(Get-McMofModules -Text $script:CleanText)
        $m.Count | Should -Be 1
        $m[0].Name | Should -Be 'PSDscResources'
        $m[0].Version | Should -Be '2.12.0.0'
    }
}

Describe 'Test-McMofText' {
    It 'flags build-host data and the absolute path in a compiled MOF' {
        $f = Test-McMofText -Text (Get-Content (Join-Path $script:Fx 'mof/compiled-a.mof') -Raw)
        (Get-Rules $f) | Should -Contain 'Finding:MC-PKG-04'
        @($f | Where-Object Rule -EQ 'MC-PKG-04').Count | Should -Be 2
    }
    It "passes Microsoft's pinned sample MOF, which carries no host data" {
        Test-McMofText -Text (Get-Content (Join-Path $script:Pinned 'AdministratorsGroupMembers.mof') -Raw) | Should -BeNullOrEmpty
    }
    It 'flags <Case>' -ForEach @(
        @{ Case = 'a password property'; Line = ' Password = "P@ssw0rd!";' }
        @{ Case = 'a run-as credential'; Line = ' PsDscRunAsCredential = $MSFT_Credential1ref;' }
        @{ Case = 'an embedded credential instance'; Line = 'instance of MSFT_Credential as $MSFT_Credential1ref' }
        @{ Case = 'a SAS signature'; Line = ' Uri = "https://x.blob.core.windows.net/c/f?sv=2022&sig=abcdefghijklmnop";' }
        @{ Case = 'a storage account key'; Line = ' Conn = "DefaultEndpointsProtocol=https;AccountKey=abc";' }
        @{ Case = 'a private key'; Line = ' Pem = "-----BEGIN RSA PRIVATE KEY-----";' }
    ) {
        (Get-Rules (Test-McMofText -Text $Line)) | Should -Contain 'Finding:MC-PKG-05'
    }
    It 'does not flag the Registry resource Key property' {
        Test-McMofText -Text ' Key = "HKEY_LOCAL_MACHINE\\SOFTWARE";' | Should -BeNullOrEmpty
    }
}

Describe 'Test-McPackage' {
    It 'passes a clean, versioned package with its module' {
        Test-McPackage -Path (New-TestPackage) -Name $script:Name -ExpectedType Audit | Should -BeNullOrEmpty
    }
    It '<Case>' -ForEach @(
        @{ Case = 'flags a package type the mode does not need'; Make = @{ Type = 'AuditAndSet' }; Expected = 'Finding:MC-PKG-02' }
        @{ Case = 'flags a module the MOF needs but the package lacks'; Make = @{ NoModule = $true }; Expected = 'Finding:MC-PKG-06' }
        @{ Case = 'flags a module at another version'; Make = @{ ModuleVersion = '2.11.0.0' }; Expected = 'Finding:MC-PKG-06' }
        @{ Case = 'flags a MOF with build-host data'; Make = @{ DirtyMof = $true }; Expected = 'Finding:MC-PKG-04' }
        @{ Case = 'flags a package with no MOF'; Make = @{ NoMof = $true }; Expected = 'Finding:MC-PKG-01' }
    ) {
        $zip = New-TestPackage @Make
        (Get-Rules (Test-McPackage -Path $zip -Name $script:Name -ExpectedType Audit)) | Should -Contain $Expected
    }
    It 'warns when the package name carries no version' {
        $zip = New-TestPackage -Name 'TlsServerProtocols'
        (Get-Rules (Test-McPackage -Path $zip -Name 'TlsServerProtocols' -ExpectedType Audit)) | Should -Be @('Warn:MC-PKG-07')
    }
    It "flags a package over Learn's 100 MB limit" {
        InModuleScope McPipeline { $script:McMaxUncompressedBytes = 100 }
        try {
            (Get-Rules (Test-McPackage -Path (New-TestPackage) -Name $script:Name -ExpectedType Audit)) | Should -Contain 'Finding:MC-PKG-03'
        } finally { InModuleScope McPipeline { $script:McMaxUncompressedBytes = 100MB } }
    }
}

Describe 'Test-McPolicy' {
    BeforeAll {
        $script:Pkg = New-TestPackage
        $script:Dine = $script:Audit.Clone(); $script:Dine.mode = 'ApplyAndAutoCorrect'
    }
    It 'passes the audit definition New-GuestConfigurationPolicy wrote, with only the Arc reminder' {
        $f = Test-McPolicy -Path (New-TestPolicy -PackagePath $script:Pkg) -PackagePath $script:Pkg -Release $script:Audit -Now $script:Now
        (Get-Rules $f) | Should -Be @('Info:MC-POL-09')
    }
    It 'passes the enforcing definition, which carries the owner tag filter' {
        $f = Test-McPolicy -Path (New-TestPolicy -Fixture 'deploy.json' -PackagePath $script:Pkg) -PackagePath $script:Pkg -Release $script:Dine -Now $script:Now
        (Get-Rules $f) | Should -Be @('Info:MC-POL-09')
    }
    It '<Case>' -ForEach @(
        @{ Case = 'flags a hash that is not the package''s'; Fixture = 'audit.json'; Edit = { param($t) $t -replace '"contentHash": "[0-9A-F]{64}"', ('"contentHash": "' + ('A' * 64) + '"') }; Expected = 'Finding:MC-POL-02' }
        @{ Case = 'flags a stale hash in one deployment block only'; Fixture = 'deploy.json'; Edit = { param($t) $r = [regex]'"contentHash": "[0-9A-F]{64}"'; $r.Replace($t, ('"contentHash": "' + ('B' * 64) + '"'), 1, $t.IndexOf('"resources"')) }; Expected = 'Finding:MC-POL-02' }
        @{ Case = 'flags an HTTP content URI'; Fixture = 'audit.json'; Edit = { param($t) $t.Replace('https://stcontosomc', 'http://stcontosomc') }; Expected = 'Finding:MC-POL-03' }
        @{ Case = 'warns on a short-lived SAS token'; Fixture = 'audit.json'; Edit = { param($t) $t.Replace('TlsServerProtocols_1.0.0.zip"', 'TlsServerProtocols_1.0.0.zip?sv=2022-11-02&se=2026-12-01T00%3A00%3A00Z&sr=b&sp=r&sig=abc"') }; Expected = 'Warn:MC-POL-03' }
        @{ Case = 'flags a SAS token valid for three years, as in Learn''s example'; Fixture = 'audit.json'; Edit = { param($t) $t.Replace('TlsServerProtocols_1.0.0.zip"', 'TlsServerProtocols_1.0.0.zip?sv=2022-11-02&se=2029-10-30T00%3A00%3A00Z&sr=b&sp=r&sig=abc"') }; Expected = 'Finding:MC-POL-03' }
        @{ Case = 'flags a URI that names another package'; Fixture = 'audit.json'; Edit = { param($t) $t.Replace('TlsServerProtocols_1.0.0.zip', 'TlsServerProtocols_0.9.0.zip') }; Expected = 'Finding:MC-POL-04' }
        @{ Case = 'flags a new policy ID'; Fixture = 'audit.json'; Edit = { param($t) $t -replace '"name": "[0-9a-f-]{36}"', '"name": "00000000-0000-0000-0000-000000000001"' }; Expected = 'Finding:MC-POL-05' }
        @{ Case = 'flags a category other than Guest Configuration'; Fixture = 'audit.json'; Edit = { param($t) $t.Replace('"category": "Guest Configuration"', '"category": "General"') }; Expected = 'Finding:MC-POL-01' }
        @{ Case = 'flags an enforcing definition with no owner tag filter'; Fixture = 'deploy.json'; Edit = { param($t) $t.Replace("tags['ConfigOwner']", "tags['Owner']") }; Expected = 'Finding:MC-POL-08' }
    ) {
        $release = if ($Fixture -eq 'deploy.json') { $script:Dine } else { $script:Audit }
        $f = Test-McPolicy -Path (New-TestPolicy -Fixture $Fixture -PackagePath $script:Pkg -Edit $Edit) -PackagePath $script:Pkg -Release $release -Now $script:Now
        (Get-Rules $f) | Should -Contain $Expected
    }
    It 'flags a version that is not greater than the published one' {
        $r = $script:Audit.Clone(); $r.published = '1.0.0'
        (Get-Rules (Test-McPolicy -Path (New-TestPolicy -PackagePath $script:Pkg) -PackagePath $script:Pkg -Release $r -Now $script:Now)) | Should -Contain 'Finding:MC-POL-06'
    }
    It 'flags a definition whose effect does not match the registry mode' {
        (Get-Rules (Test-McPolicy -Path (New-TestPolicy -PackagePath $script:Pkg) -PackagePath $script:Pkg -Release $script:Dine -Now $script:Now)) | Should -Contain 'Finding:MC-POL-07'
        (Get-Rules (Test-McPolicy -Path (New-TestPolicy -Fixture 'deploy.json' -PackagePath $script:Pkg) -PackagePath $script:Pkg -Release $script:Audit -Now $script:Now)) | Should -Contain 'Finding:MC-POL-07'
    }
    It 'flags an assignment type that differs from the registry mode' {
        $r = $script:Audit.Clone(); $r.mode = 'ApplyAndMonitor'
        (Get-Rules (Test-McPolicy -Path (New-TestPolicy -Fixture 'deploy.json' -PackagePath $script:Pkg) -PackagePath $script:Pkg -Release $r -Now $script:Now)) | Should -Contain 'Finding:MC-POL-07'
    }
    It 'flags a user-assigned identity in a definition meant for Arc' {
        $p = New-TestPolicy -PackagePath $script:Pkg -Edit { param($t) $t.Replace('"contentManagedIdentity": "system"', '"contentManagedIdentity": "/subscriptions/0/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mc"') }
        (Get-Rules (Test-McPolicy -Path $p -PackagePath $script:Pkg -Release $script:Audit -Now $script:Now)) | Should -Contain 'Finding:MC-POL-09'
    }
    It 'reads the SAS expiry' {
        (Get-McSasExpiry -Uri 'https://a/b.zip?se=2029-10-30T00%3A00%3A00Z&sig=x').Year | Should -Be 2029
        Get-McSasExpiry -Uri 'https://a/b.zip' | Should -BeNullOrEmpty
    }
}

Describe 'Get-McProvenance' {
    BeforeAll {
        $script:Mof = ConvertTo-McCleanMof -Path (Join-Path $script:Fx 'mof/compiled-b.mof') -Destination (Join-Path $TestDrive 'prov.mof')
        $script:PPkg = New-TestPackage
        $script:PPol = New-TestPolicy -PackagePath $script:PPkg
        $script:Mods = @{ PSDscResources = '2.12.0.0'; GuestConfiguration = '4.12.0'; PSDesiredStateConfiguration = '2.0.7' }
        $script:Prov = Get-McProvenance -Release $script:Audit -Version '1.0.0' -MofPath $script:Mof.FullName -PackagePath $script:PPkg `
            -PolicyPath $script:PPol -Modules $script:Mods -BuiltAt '2026-10-30T00:00:00Z' -Findings @(New-McFinding -Severity Info -Rule 'MC-POL-09' -Issue 'x')
    }
    It 'records what was built, from what, and what shipped' {
        $script:Prov.schema | Should -Be 'fmp-mc-provenance/1'
        $script:Prov.policy_id | Should -Be $script:Audit.policyId
        $script:Prov.mode | Should -Be 'Audit'
        $script:Prov.package.sha256 | Should -Be (Get-McFileSha256 $script:PPkg)
        $script:Prov.policy.sha256 | Should -Be (Get-McFileSha256 $script:PPol)
        $script:Prov.findings.Info | Should -Be 1
        $script:Prov.finding_rules | Should -Be @('Info:MC-POL-09')
    }
    It 'lists module versions in name order' {
        @($script:Prov.modules.Keys) | Should -Be @('GuestConfiguration', 'PSDesiredStateConfiguration', 'PSDscResources')
    }
    It 'records the same MOF hash for either compile order' {
        $other = ConvertTo-McCleanMof -Path (Join-Path $script:Fx 'mof/compiled-a.mof') -Destination (Join-Path $TestDrive 'prov-a.mof')
        $script:Prov.mof.sha256 | Should -Be (Get-McFileSha256 $other.FullName)
    }
}

Describe 'Generated DeployIfNotExists definition' {
    # research-gaps.md row 7: 4.12.0 grants the remediation identity one role,
    # 088ab73d-1256-47ae-bea9-9de8e7131f31, Guest Configuration Resource Contributor. Learn's
    # built-in roles reference doesn't list it; Microsoft's own role tables name it (Chapter 07).
    It 'grants the remediation identity only Guest Configuration Resource Contributor' {
        $def = Get-Content -LiteralPath (Join-Path $script:Fx 'policy/deploy.json') -Raw | ConvertFrom-Json
        $ids = @($def.properties.policyRule.then.details.roleDefinitionIds)
        $ids.Count | Should -Be 1
        $ids[0] | Should -BeExactly '/providers/Microsoft.Authorization/roleDefinitions/088ab73d-1256-47ae-bea9-9de8e7131f31'
    }
}
