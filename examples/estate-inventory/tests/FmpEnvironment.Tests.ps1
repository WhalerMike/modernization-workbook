#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
# Invoke-Pester -Path tests/FmpEnvironment.Tests.ps1   (from examples/estate-inventory)
# The environment profile loader, in Windows PowerShell 5.1 and PowerShell 7. Each test seals a
# copy of tests/fixtures/environment-profile: it writes the profile's manifest SHA-256 and time
# and the run's SHA256SUMS, as the estate inventory does, then changes what the test needs.

BeforeAll {
    $kit = Split-Path -Parent $PSScriptRoot
    $script:ModulePath = Join-Path $kit 'powershell/FmpEnvironment/FmpEnvironment.psd1'
    $script:Fixture = Join-Path $PSScriptRoot 'fixtures/environment-profile'
    Import-Module $script:ModulePath -Force

    function Get-TestSha256([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }

    # A run folder like the estate inventory's: the manifest, the profile that hashes it, SHA256SUMS.
    function New-SealedRun {
        param([datetime]$Generated = [datetime]::UtcNow, [string]$Label = 'test', [scriptblock]$Edit)
        $dir = Join-Path $TestDrive ([guid]::NewGuid().ToString('n').Substring(0, 8))
        Copy-Item -LiteralPath $script:Fixture -Destination $dir -Recurse
        $profilePath = Join-Path $dir 'EnvironmentProfile.json'
        $doc = Get-Content -LiteralPath $profilePath -Raw | ConvertFrom-Json
        $doc.provenance.manifestSha256 = Get-TestSha256 (Join-Path $dir 'EstateInventoryManifest.json')
        $doc.provenance.generatedUtc = $Generated.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        $doc.provenance.label = $Label
        if ($Edit) { & $Edit $doc }
        $doc | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $profilePath -Encoding UTF8
        $sums = foreach ($n in 'EnvironmentProfile.json', 'EstateInventoryManifest.json') { '{0}  {1}' -f (Get-TestSha256 (Join-Path $dir $n)), $n }
        Set-Content -LiteralPath (Join-Path $dir 'SHA256SUMS') -Value $sums -Encoding UTF8
        $dir
    }
}

Describe 'The module' {
    It 'declares both editions and Windows PowerShell 5.1' {
        $m = Import-PowerShellDataFile -Path $script:ModulePath
        $m.CompatiblePSEditions | Should -Be @('Desktop', 'Core')
        $m.PowerShellVersion | Should -Be '5.1'
    }
    It 'refuses to hand out a value before a profile is loaded' {
        Import-Module $script:ModulePath -Force
        { Get-FmpEnvironmentValue '<test-domain>' } | Should -Throw '*No environment profile is loaded*'
    }
}

Describe 'A profile it accepts' {
    BeforeAll {
        Import-Module $script:ModulePath -Force
        $script:Summary = Import-FmpEnvironment -Path (New-SealedRun)
    }
    It 'returns the run, its label, its age and what it filled' {
        $script:Summary.RunId | Should -Be '2026-11-29T020000Z'
        $script:Summary.Label | Should -Be 'test'
        $script:Summary.AgeDays | Should -BeLessThan 0.1
        $script:Summary.Filled | Should -Be 13
        $script:Summary.NotCollected | Should -Be @('ad.trusts')
    }
    It 'gives a value by field name and by placeholder, with or without the angle brackets' {
        Get-FmpEnvironmentValue ad.forestRootDomain | Should -Be 'contoso.example'
        Get-FmpEnvironmentValue '<test-domain>' | Should -Be 'contoso.example'
        Get-FmpEnvironmentValue test-dc | Should -Be 'dc01.contoso.example'
        Get-FmpEnvironmentValue '<tenant-id>' | Should -Be '0c0ffee0-0000-4000-8000-00000000c0de'
        Get-FmpEnvironmentValue '<test-mg-id>' | Should -Be 'contoso-test'
        Get-FmpEnvironmentValue '<cloud>' | Should -Be 'gcc'
        Get-FmpEnvironmentValue graphEnvironment | Should -Be 'Global'
    }
    It 'gives a list one item at a time' {
        @(Get-FmpEnvironmentValue ad.domains) | Should -Be @('contoso.example')
        @(Get-FmpEnvironmentValue ad.domainControllers)[0].site | Should -Be 'HQ'
    }
    It 'refuses a one-value placeholder when the run saw several' {
        { Get-FmpEnvironmentValue '<subscription-id>' } | Should -Throw '*takes one value, and the run saw 2*'
        @(Get-FmpEnvironmentValue azure.subscriptionIds).Count | Should -Be 2
    }
    It 'refuses a field no kit collected, and says why' {
        { Get-FmpEnvironmentValue ad.trusts } | Should -Throw '*No kit collected ad.trusts*TrustMap.json*'
    }
    It 'refuses a name it doesn''t know' {
        { Get-FmpEnvironmentValue '<test-user-upn>' } | Should -Throw '*can''t fill ''<test-user-upn>''*'
    }
    It 'lists every placeholder with its value or why not, and the file it came from' {
        $rows = @(Get-FmpEnvironmentPlaceholder)
        ($rows | Where-Object Placeholder -EQ '<test-domain>').Value | Should -Be 'contoso.example'
        ($rows | Where-Object Placeholder -EQ '<test-domain>').From | Should -Match '^start-kit/.+/Forest/ForestTopology\.json$'
        ($rows | Where-Object Placeholder -EQ '<subscription-id>').Status | Should -Be 'several values'
        @($rows | Where-Object Status -EQ 'ok').Count | Should -Be 12
    }
    It 'fills a lab command and leaves, with a warning, the placeholders it doesn''t know' {
        $out = Expand-FmpPlaceholder 'Get-ADUser -Identity <test-account> -Server <test-dc>; Get-ADDomain -Server <test-domain>' -WarningVariable w 3>$null
        $out | Should -Be 'Get-ADUser -Identity <test-account> -Server dc01.contoso.example; Get-ADDomain -Server contoso.example'
        "$w" | Should -Match '<test-account>'
    }
    It 'refuses to fill a command when a placeholder it knows has several values' {
        { Expand-FmpPlaceholder 'Set-AzContext -Subscription <subscription-id>' } | Should -Throw '*takes one value*'
    }
}

Describe 'Profiles it refuses' {
    BeforeEach { Import-Module $script:ModulePath -Force }
    It 'refuses a profile older than -MaxAgeDays, and accepts it with a larger limit' {
        $run = New-SealedRun -Generated ([datetime]::UtcNow.AddDays(-10))
        { Import-FmpEnvironment -Path $run } | Should -Throw '*days old*the limit is 8 days*'
        (Import-FmpEnvironment -Path $run -MaxAgeDays 14).AgeDays | Should -BeGreaterThan 9.9
    }
    It 'checks the age against -Now' {
        $run = New-SealedRun -Generated ([datetime]'2026-11-29T02:14:00Z')
        { Import-FmpEnvironment -Path $run -Now ([datetime]'2026-12-08T02:15:00Z') } | Should -Throw '*days old*'
        (Import-FmpEnvironment -Path $run -Now ([datetime]'2026-12-01T02:14:00Z')).AgeDays | Should -Be 2
    }
    It 'refuses a profile whose manifest changed after the run' {
        $run = New-SealedRun
        Add-Content -LiteralPath (Join-Path $run 'EstateInventoryManifest.json') -Value ' '
        { Import-FmpEnvironment -Path $run } | Should -Throw '*EstateInventoryManifest.json has SHA-256*not the*'
    }
    It 'refuses a profile edited after the run' {
        $run = New-SealedRun
        $p = Join-Path $run 'EnvironmentProfile.json'
        Set-Content -LiteralPath $p -Value ((Get-Content -LiteralPath $p -Raw).Replace('dc01.contoso.example', 'dc09.contoso.example')) -Encoding UTF8
        { Import-FmpEnvironment -Path $run } | Should -Throw '*EnvironmentProfile.json changed after the run*'
    }
    It 'refuses a run with no SHA256SUMS' {
        $run = New-SealedRun
        Remove-Item -LiteralPath (Join-Path $run 'SHA256SUMS')
        { Import-FmpEnvironment -Path $run } | Should -Throw '*No SHA256SUMS*'
    }
    It 'refuses a production profile for a lab, and an unlabelled one' {
        { Import-FmpEnvironment -Path (New-SealedRun -Label production) } | Should -Throw '*labelled ''production'', not ''test''*never production*'
        { Import-FmpEnvironment -Path (New-SealedRun -Label unlabelled) } | Should -Throw '*Set environmentLabel*'
        (Import-FmpEnvironment -Path (New-SealedRun -Label production) -Expect production).Label | Should -Be 'production'
    }
    It 'refuses a fixture profile unless the lab expects one' {
        { Import-FmpEnvironment -Path (New-SealedRun -Label fixture) } | Should -Throw '*values are fictional*'
    }
    It 'keeps nothing from a profile it refused' {
        try { Import-FmpEnvironment -Path (New-SealedRun -Label production) } catch { }
        { Get-FmpEnvironmentValue '<test-domain>' } | Should -Throw '*No environment profile is loaded*'
    }
    It 'refuses to fill from a field the kits disagree on, and names both files' {
        $run = New-SealedRun -Edit {
            param($doc)
            $t = $doc.fields.tenantId
            $t.status = 'conflict'
            $t.value = $null
            $t.sources[1].value = '99999999-9999-4999-8999-999999999999'
            $t | Add-Member -NotePropertyName reason -NotePropertyValue 'The sources disagree.'
        }
        $null = Import-FmpEnvironment -Path $run
        { Get-FmpEnvironmentValue '<tenant-id>' } | Should -Throw '*kits disagree on tenantId*non-person-identity/contoso.example/manifest.json*privileged-access/manifest.json*'
        { Expand-FmpPlaceholder 'Connect-MgGraph -TenantId <tenant-id>' } | Should -Throw '*kits disagree*'
        (Get-FmpEnvironmentPlaceholder | Where-Object Placeholder -EQ '<tenant-id>').Status | Should -Be 'conflict'
    }
}
