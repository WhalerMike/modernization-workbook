#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
# Microsoft's CSV2SCIM sample (pinned in examples/third_party/csv2scim) run offline on this example's
# fixture, beside this example's client: what the baseline sends, and what this client adds on top.
# CSV2SCIM is only used in its payload-generation mode here, which reads the CSV and makes no calls.
# developer workbook Building the Attribute-Driven Migration, Chapter 01.

BeforeAll {
    $script:Kit = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath '../..')
    $script:Fx = Join-Path -Path $script:Kit -ChildPath 'tests/fixtures/hcm_extract_sample.csv'
    $script:Csv2Scim = Join-Path -Path $script:Kit -ChildPath '../third_party/csv2scim/src/CSV2SCIM.ps1'
    $script:Ext = 'urn:ietf:params:scim:schemas:extension:contoso:1.0:User'
    $map = Import-PowerShellDataFile -Path (Join-Path $script:Kit 'config/csv2scim/AttributeMapping.psd1')
    $script:MapValid = & $script:Csv2Scim -Path $script:Fx -AttributeMapping $map -ValidateAttributeMapping
    $json = & $script:Csv2Scim -Path $script:Fx -AttributeMapping $map -ScimSchemaNamespace $script:Ext
    $script:Baseline = @(($json -join [Environment]::NewLine) | ConvertFrom-Json)
    $script:BaseOps = @($script:Baseline | ForEach-Object { $_.Operations })

    Import-Module (Join-Path $script:Kit 'powershell/HcmToScim.psm1') -Force
    $cfg = Get-HcmSettings -Path (Join-Path $script:Kit 'config/settings.example.json')
    $hmap = Get-HcmMapping -Path (Join-Path $script:Kit 'config/mapping.json')
    $rows = @(Import-Csv -LiteralPath $script:Fx -Encoding utf8)
    $script:Ours = Convert-HcmExtract -Rows $rows -Mapping $hmap -Settings $cfg -AsOf ([datetime]'2026-10-25')
}

Describe 'The CSV2SCIM baseline on this fixture' {
    It 'accepts this example''s attribute mapping as valid SCIM' {
        $script:MapValid | Should -BeTrue
    }
    It 'sends every row: one operation per CSV row, nothing refused' {
        $script:BaseOps.Count | Should -Be 19
    }
    It 'sends the rows this client quarantines, active' {
        $quarantined = @($script:Ours.Outcomes | Where-Object Status -eq 'quarantined' | ForEach-Object PersonKey)
        $quarantined.Count | Should -Be 9
        $pending = $script:BaseOps | Where-Object { $_.data.externalId -eq '100006' }
        $pending.data.active | Should -BeTrue
        $pending.data.$($script:Ext).WorkerType | Should -Be 'P'
    }
    It 'sends a duplicate person twice and a blank key' {
        @($script:BaseOps | Where-Object { $_.data.externalId -eq '100008' }).Count | Should -Be 2
        @($script:BaseOps | Where-Object { [string]::IsNullOrEmpty($_.data.externalId) }).Count | Should -Be 1
    }
    It 'keeps file order, so the leaver is not sent first' {
        $script:BaseOps[0].data.active | Should -BeTrue
        $script:Ours.Batches[0].Operations[0].data.active | Should -BeFalse
    }
    It 'sends a future hire active; this client sends it disabled until the hire date' {
        ($script:BaseOps | Where-Object { $_.data.externalId -eq '100001' }).data.active | Should -BeTrue
        (@($script:Ours.Outcomes | Where-Object PersonKey -eq '100001')[0].Operation.data.active) | Should -BeFalse
    }
    It 'uses a random bulkId, so the same input never gives the same batch hash' {
        $script:BaseOps[0].bulkId | Should -Match '^[0-9a-f]{8}-[0-9a-f]{4}-'
        $script:Ours.Batches[0].Operations[0].bulkId | Should -Be $script:Ours.Batches[0].Operations[0].data.externalId
    }
}
