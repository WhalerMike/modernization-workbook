#Requires -Version 7.1
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
# Invoke-Pester -Path tests -Output Detailed   (from examples/estate-inventory; no forest, no tenant)

BeforeAll {
    $kit = Split-Path -Parent $PSScriptRoot
    $script:Entry = Join-Path $kit 'Invoke-EstateInventory.ps1'
    $script:Pwsh = (Get-Process -Id $PID).Path
    Import-Module (Join-Path $kit 'powershell/EstateInventory/EstateInventory.psm1') -Force

    function New-TestSettings([hashtable]$Settings) {
        $dir = Join-Path $TestDrive ([guid]::NewGuid().ToString('n').Substring(0, 8))
        $null = New-Item -ItemType Directory -Path $dir
        if (-not $Settings.ContainsKey('outputRoot')) { $Settings.outputRoot = 'runs' }
        $path = Join-Path $dir 'settings.json'
        $Settings | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $path
        $path
    }
    function Invoke-Entry([string]$SettingsPath, [switch]$Fixture) {
        $a = @('-NoProfile', '-NonInteractive', '-File', $script:Entry, '-SettingsPath', $SettingsPath)
        if ($Fixture) { $a += '-Fixture' }
        $out = & $script:Pwsh @a 2>&1
        [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = @($out | ForEach-Object { "$_" }) }
    }
    function Get-Runs([string]$SettingsPath) {
        @(Get-ChildItem -LiteralPath (Join-Path (Split-Path -Parent $SettingsPath) 'runs') -Directory -ErrorAction SilentlyContinue | Sort-Object Name)
    }
}

Describe 'A fixture run (Lab 1)' {
    BeforeAll {
        $script:Settings = New-TestSettings @{ cloud = 'gcc'; 'validation-kit' = @{ tracks = @('NPI', 'CA', 'DG') } }
        $script:Result = Invoke-Entry -SettingsPath $script:Settings -Fixture
        $script:Run = (Get-Runs $script:Settings)[0].FullName
        $script:Manifest = Get-Content -LiteralPath (Join-Path $script:Run 'EstateInventoryManifest.json') -Raw | ConvertFrom-Json
    }
    It 'exits 0' { $script:Result.ExitCode | Should -Be 0 }
    It 'names the run folder by the UTC time' { Split-Path -Leaf $script:Run | Should -Match '^\d{4}-\d{2}-\d{2}T\d{6}Z$' }
    It 'records the Start Kit run and passes the three cloud kits' {
        ($script:Manifest.steps | ForEach-Object { "$($_.step)=$($_.status)" }) -join ' ' |
            Should -Be 'start-kit=Recorded non-person-identity=Pass privileged-access=Pass validation-kit=Pass'
    }
    It 'hashes each kit''s own manifest' {
        foreach ($s in $script:Manifest.steps) { @($s.kitManifests | Where-Object sha256).Count | Should -BeGreaterThan 0 -Because $s.step }
    }
    It 'gives each step its controls and KSIs' {
        ($script:Manifest.steps | Where-Object step -EQ 'privileged-access').ksi | Should -Be @('KSI-IAM-AAM', 'KSI-IAM-ELP')
        $script:Manifest.manifest.controls | Should -Contain 'AU-9'
    }
    It 'passes its own integrity check' { Test-EiRun -Path $script:Run | Should -BeNullOrEmpty }
    It 'finds a file changed after the run' {
        $copy = Join-Path $TestDrive 'tampered'
        Copy-Item -LiteralPath $script:Run -Destination $copy -Recurse
        Add-Content -LiteralPath (Join-Path $copy 'privileged-access/inventory.csv') -Value 'x'
        Test-EiRun -Path $copy | Should -Contain 'Changed: privileged-access/inventory.csv'
    }
    It 'writes an environment profile that matches its schema' {
        $json = Get-Content -LiteralPath (Join-Path $script:Run 'EnvironmentProfile.json') -Raw
        Test-Json -Json $json -SchemaFile (Join-Path (Split-Path -Parent $PSScriptRoot) 'config/environment-profile.schema.json') | Should -BeTrue
        $script:Manifest.environmentProfile.path | Should -Be 'EnvironmentProfile.json'
        $script:Manifest.environmentProfile.ksi | Should -Be @('KSI-PIY-GIV')
    }
    It 'takes the forest from the Start Kit''s recorded run, and names the file' {
        $p = Get-Content -LiteralPath (Join-Path $script:Run 'EnvironmentProfile.json') -Raw | ConvertFrom-Json
        $p.provenance.label | Should -Be 'fixture'
        $p.fields.'ad.forestRootDomain'.value | Should -Be 'contoso.example'
        $p.fields.'ad.forestRootDomain'.sources[0].file | Should -Be 'start-kit/recorded-run-nov/contoso.example/Forest/ForestTopology.json'
        $p.fields.'ad.rootDomain.pdcEmulator'.value | Should -Be 'dc01.contoso.example'
        @($p.fields.'ad.domainControllers'.value.hostName) | Should -Be @('cdc01.child.contoso.example', 'dc01.contoso.example', 'dc02.contoso.example')
        @($p.fields.'ad.trusts'.value.name) | Should -Contain 'partner.example'
        @($p.fields.'azure.subscriptionIds'.value) | Should -Be @('11111111-1111-4111-8111-111111111111')
        $p.fields.graphEnvironment.value | Should -Be 'Global'
        $p.fields.azureEnvironment.value | Should -Be 'AzureCloud'
    }
    It 'shows the kits'' fixture tenants as a conflict instead of picking one' {
        $p = Get-Content -LiteralPath (Join-Path $script:Run 'EnvironmentProfile.json') -Raw | ConvertFrom-Json
        $p.fields.tenantId.status | Should -Be 'conflict'
        $p.fields.tenantId.value | Should -BeNullOrEmpty
        @($p.fields.tenantId.sources.step) | Should -Be @('non-person-identity', 'validation-kit')
    }
    It 'reads only files in the run folder, and holds no user, address or SID' {
        $p = Get-Content -LiteralPath (Join-Path $script:Run 'EnvironmentProfile.json') -Raw
        $doc = $p | ConvertFrom-Json
        foreach ($s in $doc.provenance.sources) { Join-Path $script:Run $s.file | Should -Exist; $s.file | Should -Not -Match '\\' }
        $p | Should -Not -Match '@'
        $p | Should -Not -Match '\b10\.\d+\.\d+\.\d+\b'
        $p | Should -Not -Match 'S-1-5-21'
    }
    It 'hashes the manifest, and SHA256SUMS covers the profile' {
        $doc = Get-Content -LiteralPath (Join-Path $script:Run 'EnvironmentProfile.json') -Raw | ConvertFrom-Json
        $doc.provenance.manifestSha256 | Should -Be (Get-FileHash -LiteralPath (Join-Path $script:Run 'EstateInventoryManifest.json') -Algorithm SHA256).Hash.ToLowerInvariant()
        Get-Content -LiteralPath (Join-Path $script:Run 'SHA256SUMS') | Should -Contain ('{0}  EnvironmentProfile.json' -f (Get-FileHash -LiteralPath (Join-Path $script:Run 'EnvironmentProfile.json') -Algorithm SHA256).Hash.ToLowerInvariant())
    }
    It 'prints the profile line' {
        ($script:Result.Output -join "`n") | Should -Match 'environment-profile\s+fixture\s+EnvironmentProfile\.json: 18 filled, 1 in conflict, 0 not collected'
    }
    It 'is accepted by the loader as a fixture profile, and refused as a test one' {
        Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'powershell/FmpEnvironment/FmpEnvironment.psd1') -Force
        { Import-FmpEnvironment -Path $script:Run } | Should -Throw '*labelled ''fixture''*'
        (Import-FmpEnvironment -Path $script:Run -Expect fixture).Conflict | Should -Be @('tenantId')
        Get-FmpEnvironmentValue '<test-domain>' | Should -Be 'contoso.example'
    }
    It 'is read the same by the loader in Windows PowerShell 5.1' -Skip:(-not $IsWindows) {
        $module = Join-Path (Split-Path -Parent $PSScriptRoot) 'powershell/FmpEnvironment/FmpEnvironment.psd1'
        $cmd = "`$ErrorActionPreference = 'Stop'; Import-Module '$module'; `$null = Import-FmpEnvironment -Path '$($script:Run)' -Expect fixture; " +
            "'{0}|{1}|{2}' -f `$PSVersionTable.PSEdition, (Get-FmpEnvironmentValue '<test-dc>'), (Expand-FmpPlaceholder 'Get-ADDomain -Server <test-domain>')"
        $out = & (Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe') -NoProfile -NonInteractive -Command $cmd
        "$out" | Should -Be 'Desktop|dc01.contoso.example|Get-ADDomain -Server contoso.example'
    }
    It 'keeps both runs when run again' {
        $again = Invoke-Entry -SettingsPath $script:Settings -Fixture
        $again.ExitCode | Should -Be 0
        (Get-Runs $script:Settings).Count | Should -Be 2
    }
}

Describe 'Settings it refuses' {
    It 'refuses a secret' {
        $s = New-TestSettings @{ cloud = 'gcc'; auth = @{ method = 'certificate'; clientId = 'x'; clientSecret = 'never' } }
        $r = Invoke-Entry -SettingsPath $s -Fixture
        $r.ExitCode | Should -Be 1
        ($r.Output -join "`n") | Should -Match 'secret-like setting'
        Get-Runs $s | Should -BeNullOrEmpty
    }
    It 'refuses placeholders in a live run' {
        $s = New-TestSettings @{ cloud = 'gcc'; tenantId = '<tenant-id>'; auth = @{ method = 'certificate'; clientId = '<app-id>'; certificateThumbprint = '<thumbprint>' } }
        $r = Invoke-Entry -SettingsPath $s
        $r.ExitCode | Should -Be 1
        ($r.Output -join "`n") | Should -Match 'placeholders'
    }
    It 'refuses an environment label other than test or production' {
        { Read-EiSettings -Path (New-TestSettings @{ cloud = 'gcc'; environmentLabel = 'staging' }) -Fixture } | Should -Throw '*environmentLabel must be test or production*'
    }
    It 'refuses an unknown cloud' {
        { Read-EiSettings -Path (New-TestSettings @{ cloud = 'gcchigh' }) -Fixture } | Should -Throw '*cloud must be gcc or global*'
    }
}

Describe 'A live run without a forest or a certificate' -Skip:(-not $IsWindows) {
    BeforeAll {
        $stub = Join-Path $PSScriptRoot 'fixtures/stub-start-kit'
        $script:Live = New-TestSettings @{
            cloud = 'gcc'; tenantId = '00000000-0000-4000-8000-000000000000'
            auth = @{ method = 'certificate'; clientId = '11111111-1111-4111-8111-111111111111'; certificateThumbprint = ('0' * 40) }
            kits = @{ 'start-kit' = $stub }
            'start-kit' = @{ tier = 'A'; domain = @('corp.contoso.example', "child.o'brien.example"); skipSql = $true }
            'non-person-identity' = @{ domains = @('corp.contoso.example') }
            'privileged-access' = @{ azureScope = @('/subscriptions/11111111-1111-4111-8111-111111111111') }
        }
        $script:LiveResult = Invoke-Entry -SettingsPath $script:Live
        $script:LiveRun = (Get-Runs $script:Live)[0].FullName
        $script:LiveManifest = Get-Content -LiteralPath (Join-Path $script:LiveRun 'EstateInventoryManifest.json') -Raw | ConvertFrom-Json
    }
    It 'runs the Start Kit in Windows PowerShell 5.1 with the settings'' arguments' {
        $sk = Get-Content -LiteralPath (Join-Path $script:LiveRun 'start-kit/2026-01-01-0000-stub-tierA/AssessmentManifest.json') -Raw | ConvertFrom-Json
        $sk.Edition | Should -Match '^Desktop 5\.1'
        $sk.Arguments.Domain | Should -Be @('corp.contoso.example', "child.o'brien.example")
        $sk.Arguments.Quiet | Should -BeTrue
        $sk.Arguments.SkipSql | Should -BeTrue
        ($script:LiveManifest.steps | Where-Object step -EQ 'start-kit').status | Should -Be 'Pass'
    }
    It 'fails each cloud step on its own when the certificate isn''t there, and still writes the manifest' {
        foreach ($name in 'non-person-identity', 'privileged-access', 'validation-kit') {
            $s = $script:LiveManifest.steps | Where-Object step -EQ $name
            $s.status | Should -Be 'Error' -Because $name
            $s.detail | Should -Match 'No certificate with thumbprint' -Because $name
        }
        $script:LiveResult.ExitCode | Should -Be 2
        Test-EiRun -Path $script:LiveRun | Should -BeNullOrEmpty
    }
    It 'writes a profile of what it could read: no cloud field, since every cloud step failed' {
        $p = Get-Content -LiteralPath (Join-Path $script:LiveRun 'EnvironmentProfile.json') -Raw | ConvertFrom-Json
        $p.provenance.mode | Should -Be 'Live'
        $p.provenance.label | Should -Be 'unlabelled'
        $p.fields.tenantId.status | Should -Be 'notCollected'
        $p.fields.tenantId.reason | Should -Match 'No cloud kit finished'
        $p.fields.'ad.forestName'.status | Should -Be 'notCollected'
    }
}

Describe 'A live run with a certificate file that isn''t there' -Skip:(-not $IsWindows) {
    It 'fails each cloud step on its own and names the file' {
        $s = New-TestSettings @{
            cloud = 'gcc'; tenantId = '00000000-0000-4000-8000-000000000000'
            auth = @{ method = 'certificate'; clientId = '11111111-1111-4111-8111-111111111111'; certificatePath = 'credentials/reader-app.pfx' }
            'start-kit' = @{ enabled = $false }; 'validation-kit' = @{ enabled = $false }
            'non-person-identity' = @{ domains = @('corp.contoso.example') }
        }
        $r = Invoke-Entry -SettingsPath $s
        $r.ExitCode | Should -Be 2
        $m = Get-Content -LiteralPath (Join-Path (Get-Runs $s)[0].FullName 'EstateInventoryManifest.json') -Raw | ConvertFrom-Json
        ($m.steps | ForEach-Object { "$($_.step)=$($_.status)" }) -join ' ' | Should -Be 'non-person-identity=Error privileged-access=Error'
        $m.steps[0].detail | Should -Match 'No certificate file at .*reader-app\.pfx'
    }
}
