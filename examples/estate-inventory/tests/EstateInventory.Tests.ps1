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
}
