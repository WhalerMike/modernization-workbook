#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Drift reconciliation against the shared fixtures (the same ones the Python tests use).

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath '../..')
    $script:Fx = Join-Path -Path $script:Kit -ChildPath 'tests/fixtures'
    Import-Module (Join-Path -Path $script:Kit -ChildPath 'clients/powershell/IdentityKit.psm1') -Force

    function Read-Fixture([string]$Name) {
        $data = Get-Content -LiteralPath (Join-Path $script:Fx $Name) -Raw | ConvertFrom-Json
        if ($data -isnot [array] -and $null -ne $data.value) { return , @($data.value) }
        return , @($data)
    }
    function Invoke-Drift([switch]$NoAudit) {
        $opt = Get-Content -LiteralPath (Join-Path -Path $script:Fx -ChildPath 'drift_options.json') -Raw | ConvertFrom-Json -AsHashtable
        $splat = @{
            Hr              = (Import-KitHrCsv -Path (Join-Path -Path $script:Fx -ChildPath 'hr_extract.csv'))
            GraphUsers      = (Read-Fixture 'graph_users.json')
            IscIdentities   = (Read-Fixture 'isc_identities.json')
            IscUncorrelated = (Read-Fixture 'isc_uncorrelated_accounts.json')
            Options         = $opt
            DetectedAt      = '2026-10-24T12:00:00Z'
        }
        if (-not $NoAudit) { $splat.EntraAudit = (Read-Fixture 'entra_audit.json') }
        return Get-KitIdentityDriftFinding @splat
    }
    function Get-Key($f) { '{0}|{1}|{2}|{3}' -f $f.drift_class, $f.system, $f.employee_id, $f.attribute }
}

Describe 'Get-KitIdentityDriftFinding' {
    It 'matches the expected findings fixture' {
        $expected = @((Read-Fixture 'expected_findings.json') | ForEach-Object { Get-Key $_ } | Sort-Object)
        $actual = @((Invoke-Drift).findings | ForEach-Object { Get-Key $_ } | Sort-Object)
        $actual | Should -Be $expected
    }
    It 'produces the same finding ids as the Python client' {
        $ids = [string[]]@((Invoke-Drift).findings | ForEach-Object { $_.finding_id })
        [Array]::Sort($ids, [StringComparer]::Ordinal)
        $expected = [string[]]((Read-Fixture 'expected_finding_ids.json') | ForEach-Object { $_ })
        ($ids -join ',') | Should -Be ($expected -join ',')
    }
    It 'covers every computable class' {
        $classes = @((Invoke-Drift).findings | ForEach-Object { $_.drift_class } | Sort-Object -Unique)
        $classes | Should -Be @('attribute_drift', 'missing_identity', 'orphan_account', 'stale_access', 'unauthorized_write')
    }
    It 'uses Book 03 default severities and the design-guidance priority mapping' {
        $map = @{ High = 'P2'; Medium = 'P3' }
        foreach ($f in (Invoke-Drift).findings) { $f.priority | Should -Be $map[$f.severity] }
        @((Invoke-Drift).findings | Where-Object { $_.drift_class -eq 'attribute_drift' -and $_.severity -ne 'Medium' }).Count | Should -Be 0
    }
    It 'reports unauthorized_write as not computed without an audit extract' {
        $r = Invoke-Drift -NoAudit
        $r.not_computed.Contains('unauthorized_write') | Should -BeTrue
        $r.not_computed.Contains('credential_drift') | Should -BeTrue
        @($r.findings | Where-Object { $_.drift_class -eq 'unauthorized_write' }).Count | Should -Be 0
    }
    It 'excludes the allowed writer, guests and the authoritative source' {
        $f = (Invoke-Drift).findings
        @($f | Where-Object { $_.evidence.audit_id -eq 'audit-0002' }).Count | Should -Be 0
        @($f | Where-Object { $_.object_name -like '*#EXT#*' }).Count | Should -Be 0
        @($f | Where-Object { $_.evidence.source -eq 'Core HCM' }).Count | Should -Be 0
    }
}

Describe 'Outputs and push' {
    It 'writes JSON and CSV' {
        $r = Invoke-Drift
        $json = Join-Path -Path $TestDrive -ChildPath 'o.json'
        $csv = Join-Path -Path $TestDrive -ChildPath 'o.csv'
        Export-KitDriftResult -Result $r -JsonPath $json -CsvPath $csv
        (Get-Content -LiteralPath $json -Raw | ConvertFrom-Json).findings.Count | Should -Be 12
        $rows = @(Import-Csv -LiteralPath $csv)
        $rows.Count | Should -Be 12
        { $rows[0].evidence | ConvertFrom-Json } | Should -Not -Throw
    }
    It 'maps a finding to the ServiceNow data contract' {
        $stale = (Invoke-Drift).findings | Where-Object { $_.drift_class -eq 'stale_access' -and $_.system -eq 'isc' } | Select-Object -First 1
        $p = ConvertTo-KitServiceNowPayload -Finding $stale
        $p.kind | Should -Be 'finding'
        $p.system | Should -Be 'isc_account'
        $p.intended_state.disabled | Should -BeTrue
        $p.severity | Should -Be 'P2'
    }
    It 'is a dry run unless -Apply' {
        Mock Invoke-RestMethod -ModuleName IdentityKit { [pscustomobject]@{ result = @{ sys_id = 'abc'; deduplicated = $false } } }
        $f = @((Invoke-Drift).findings | Select-Object -First 2)
        $cfg = @{ SN_INSTANCE = 'contoso'; SN_FINDING_API_PATH = '/api/x/f' }
        $dry = @(Send-KitFindingToServiceNow -Finding $f -Config $cfg -InformationAction SilentlyContinue)
        $dry.action | Should -Be @('dry-run', 'dry-run')
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -Times 0
        $posted = @(Send-KitFindingToServiceNow -Finding $f -Config $cfg -Apply)
        $posted[0].sys_id | Should -Be 'abc'
        Should -Invoke Invoke-RestMethod -ModuleName IdentityKit -Times 2 -ParameterFilter { $Uri -eq 'https://contoso.service-now.com/api/x/f' -and $Method -eq 'POST' }
    }
}

Describe 'Get-IdentityDrift.ps1' {
    It 'runs offline from saved exports' {
        $out = Join-Path -Path $TestDrive -ChildPath 'r.json'
        $script = Join-Path -Path $script:Kit -ChildPath 'clients/powershell/Get-IdentityDrift.ps1'
        $params = @{
            HrCsv             = (Join-Path -Path $script:Fx -ChildPath 'hr_extract.csv')
            GraphUsersJson    = (Join-Path -Path $script:Fx -ChildPath 'graph_users.json')
            IscIdentitiesJson = (Join-Path -Path $script:Fx -ChildPath 'isc_identities.json')
            IscAccountsJson   = (Join-Path -Path $script:Fx -ChildPath 'isc_uncorrelated_accounts.json')
            OutJson           = $out
            OutCsv            = (Join-Path -Path $TestDrive -ChildPath 'r.csv')
        }
        $summary = & $script @params
        $summary.not_computed.Contains('unauthorized_write') | Should -BeTrue
        Test-Path -LiteralPath $out | Should -BeTrue
    }
}
