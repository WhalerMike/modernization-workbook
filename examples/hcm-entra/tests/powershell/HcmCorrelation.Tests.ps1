#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Unit tests for HcmCorrelation.psm1 against the same correlation fixtures and expected files the
# Python tests use, so both clients give the same answer. Read-only: no network, no tenant.
# Illustrative: unit-tested against fixtures, not proven against live tenants.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath '../..')
    $script:Fx = Join-Path -Path $script:Kit -ChildPath 'tests/fixtures'
    $script:Cf = Join-Path -Path $script:Fx -ChildPath 'correlation'
    Import-Module (Join-Path -Path $script:Kit -ChildPath 'powershell/HcmToScim.psm1') -Force
    Import-Module (Join-Path -Path $script:Kit -ChildPath 'powershell/HcmCorrelation.psm1') -Force
    $script:Extract = Join-Path $script:Fx 'hcm_extract_sample.csv'
    $script:Ad = Join-Path $script:Cf 'ad-user-export.csv'
    $script:Entra = Join-Path $script:Cf 'entra-users.json'

    function Invoke-TestJoin([switch]$NoEntra) {
        $map = Get-HcmMapping -Path (Join-Path $script:Kit 'config/mapping.json')
        $entra = if ($NoEntra) { $null } else { @(Read-HcmEntraExport -Path $script:Entra) }
        Invoke-HcmCorrelationJoin -HrRows @(Import-Csv -LiteralPath $script:Extract -Encoding utf8) -AdRows @(Import-Csv -LiteralPath $script:Ad -Encoding utf8) -EntraUsers $entra -Mapping $map
    }
    # Both sides through JSON and back, keys sorted, so the comparison is about content, not types or order.
    function ConvertTo-Comparable($Value) {
        $parsed = ConvertTo-Json -InputObject $Value -Depth 20 | ConvertFrom-Json -AsHashtable -NoEnumerate
        ConvertTo-Json -InputObject (Get-Sorted $parsed) -Depth 20 -Compress
    }
    function Get-Sorted($Value) {
        if ($Value -is [System.Collections.IDictionary]) {
            $o = [ordered]@{}
            foreach ($k in @($Value.Keys | Sort-Object -CaseSensitive)) { $o[$k] = Get-Sorted $Value[$k] }
            return $o
        }
        if ($Value -is [System.Collections.IList]) { return , @($Value | ForEach-Object { Get-Sorted $_ }) }
        $Value
    }
    function Get-Record($Result, [string]$Key) { @($Result.records | Where-Object { $_.person_key -eq $Key })[0] }
    $script:Result = Invoke-TestJoin
}

Describe 'The same answer as the Python client' {
    It 'gives the shared expected report' {
        $report = Get-HcmCorrelationReport -Result $script:Result -AsOf ([datetime]'2026-10-25') -Inputs @{}
        $report.Remove('inputs')
        $expected = Get-Content -Raw -Encoding utf8 (Join-Path $script:Cf 'expected_correlation_report.json') | ConvertFrom-Json -AsHashtable
        ConvertTo-Comparable $report | Should -Be (ConvertTo-Comparable $expected)
    }
    It 'gives the shared expected quarantine' {
        $expected = Get-Content -Raw -Encoding utf8 (Join-Path $script:Cf 'expected_correlation_quarantine.json') | ConvertFrom-Json -AsHashtable -NoEnumerate
        ConvertTo-Comparable @($script:Result.quarantine) | Should -Be (ConvertTo-Comparable $expected)
    }
}

Describe 'The join' {
    It 'gives <Key> the status <Status>' -ForEach @(
        @{ Key = '100000'; Status = 'matched' }
        @{ Key = '100002'; Status = 'matched_with_conflicts' }
        @{ Key = '100006'; Status = 'hr_only' }
        @{ Key = '100008'; Status = 'duplicate_key' }
        @{ Key = '100010'; Status = 'hr_only_inactive' }
        @{ Key = '200001'; Status = 'directory_only' }
        @{ Key = '200002'; Status = 'directory_only_disabled' }
        @{ Key = '300001'; Status = 'directory_only' }
    ) {
        (Get-Record $script:Result $Key).status | Should -Be $Status
    }
    It 'names the side and the field of each conflict' {
        (Get-Record $script:Result '100004').conflicts | Should -Be @('ad.worker_type_code', 'ad.worker_type')
        (Get-Record $script:Result '100003').reasons | Should -Contain 'HR status INACTIVE, but the AD account is enabled'
    }
    It 'joins AD only when no Entra export is given' {
        $r = Invoke-TestJoin -NoEntra
        $r.totals.entra_accounts | Should -BeNullOrEmpty
        (Get-Record $r '100014').status | Should -Be 'hr_only'
    }
}

Describe 'Invoke-HcmCorrelation.ps1' {
    It 'writes both files, keeps names out of the report and exits 2 with a quarantine' {
        $out = Join-Path $TestDrive 'out'
        & pwsh -NoProfile -File (Join-Path $script:Kit 'powershell/Invoke-HcmCorrelation.ps1') -Extract $script:Extract -Ad $script:Ad -Entra $script:Entra -AsOf 2026-10-25 -Out $out | Out-Null
        $LASTEXITCODE | Should -Be 2
        $text = Get-Content -Raw -Encoding utf8 (Join-Path $out 'correlation-report.json')
        foreach ($name in 'Morgan', 'José', '@contoso.example', 'ORG-100') { $text | Should -Not -Match ([regex]::Escape($name)) }
        $report = $text | ConvertFrom-Json
        $report.inputs.entra_sha256 | Should -Be (Get-HcmFileSha256 $script:Entra)
        @(Get-Content -Raw -Encoding utf8 (Join-Path $out 'correlation-quarantine.json') | ConvertFrom-Json).Count | Should -Be $report.totals.quarantined
    }
    It 'exits 1 on a missing file' {
        & pwsh -NoProfile -File (Join-Path $script:Kit 'powershell/Invoke-HcmCorrelation.ps1') -Extract (Join-Path $TestDrive 'missing.csv') -Ad $script:Ad -Out (Join-Path $TestDrive 'x') 2>$null | Out-Null
        $LASTEXITCODE | Should -Be 1
    }
}
