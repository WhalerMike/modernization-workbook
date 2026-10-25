BeforeAll {
    Import-Module (Join-Path $PSScriptRoot '..' '..' 'powershell' 'FmwGraph.psm1') -Force
    $fix = Join-Path $PSScriptRoot '..' 'fixtures'
    function Read-Fixture([string]$Name) {
        Get-Content -Raw -Path (Join-Path $fix "$Name.json") | ConvertFrom-Json -AsHashtable -DateKind String
    }
    function ConvertTo-Canonical($Value) {
        # Sort keys recursively so key order doesn't matter, then compare as JSON text.
        if ($Value -is [System.Collections.IDictionary]) {
            $o = [ordered]@{}
            foreach ($k in ($Value.Keys | Sort-Object { [string]$_ } -CaseSensitive)) { $o[[string]$k] = ConvertTo-Canonical $Value[$k] }
            return $o
        }
        if ($Value -is [System.Collections.IList]) { return , @($Value | ForEach-Object { ConvertTo-Canonical $_ }) }
        $Value
    }
    function Assert-SameJson($Actual, $Expected) {
        (ConvertTo-Canonical $Actual | ConvertTo-Json -Depth 20 -Compress) | Should -BeExactly (ConvertTo-Canonical $Expected | ConvertTo-Json -Depth 20 -Compress)
    }
    $asOf = [datetimeoffset]::new(2026, 10, 25, 0, 0, 0, [timespan]::Zero)
    $expected = Read-Fixture 'expected'
    $pra = 'e8611ab8-c189-46e8-94e1-60213ab1f814'
    $ga = '62e90394-69f5-4237-9190-012177145e10'
}

Describe 'Clouds' {
    It 'maps GCC to the worldwide service and GCC High and DoD to their environments' {
        (Get-FmwCloud gcc).Environment | Should -Be 'Global'
        (Get-FmwCloud gcchigh).Graph | Should -Be 'https://graph.microsoft.us'
        (Get-FmwCloud dod).Environment | Should -Be 'USGovDoD'
    }
}

Describe 'Entra checks match the Python results' {
    It 'stale users' {
        Assert-SameJson (Test-FmwStaleUser -Users (Read-Fixture users).users -AsOf $asOf -Days 90) $expected.staleUsers
    }
    It 'Conditional Access export' {
        $d = Read-Fixture ca
        $x = ConvertTo-FmwCaExport -Policies $d.policies -NamedLocations $d.namedLocations
        Assert-SameJson ([ordered]@{ summary = $x.summary; counts = $x.counts }) $expected.ca
        @($x.policies.Keys) | Should -HaveCount 3
    }
    It 'PIM standing access' {
        $d = Read-Fixture pim
        Assert-SameJson (Test-FmwPim -RoleDefinitions $d.roleDefinitions -Eligibility $d.eligibility -Assignments $d.assignments -PrivilegedRoleIds $ga, $pra) $expected.pim
    }
    It 'PIM fails MS.AAD.7.1v1 with one Global Administrator' {
        $d = Read-Fixture pim
        $r = Test-FmwPim -RoleDefinitions $d.roleDefinitions -Eligibility @($d.eligibility[0]) -Assignments @() -PrivilegedRoleIds $ga
        $r.globalAdministrators | Should -Be 1
        $r.'MS.AAD.7.1v1' | Should -Be 'fail'
    }
    It 'application credentials' {
        Assert-SameJson (Test-FmwAppCredential -Applications (Read-Fixture apps).applications -AsOf $asOf) $expected.appCredentials
    }
    It 'MFA registration' {
        Assert-SameJson (Test-FmwMfaRegistration -Details (Read-Fixture mfa).registrationDetails) $expected.mfa
    }
}

Describe 'Dates' {
    It 'accepts strings, DateTime and DateTimeOffset and writes UTC with Z' {
        Format-FmwUtc (ConvertTo-FmwUtc '2026-07-01T00:00:00Z') | Should -Be '2026-07-01T00:00:00Z'
        Format-FmwUtc (ConvertTo-FmwUtc ([datetime]::SpecifyKind([datetime]'2026-07-01T04:00:00', 'Utc'))) | Should -Be '2026-07-01T04:00:00Z'
        ConvertTo-FmwUtc $null | Should -BeNullOrEmpty
    }
}
