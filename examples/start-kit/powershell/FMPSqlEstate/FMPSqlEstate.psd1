@{
    RootModule        = 'FMPSqlEstate.psm1'
    ModuleVersion     = '1.1.0'
    GUID              = '51617e34-58dc-4fed-8468-7214e9ff0ddd'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Read-only SQL Server estate discovery: SPN, directory and network signals fused into one counted inventory, with an optional SELECT-only T-SQL pass. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    # ActiveDirectory is checked at run time, not required here, so the module imports for
    # offline review and for the fixture tests on a host without RSAT.
    FunctionsToExport = @(
        'Get-FMPSqlQueryCatalog', 'Test-FMPSelectOnly', 'Get-FMPSqlConnectionString', 'Get-FMPSqlSessionCounter', 'Get-FMPSqlVersionName',
        'ConvertFrom-FMPSqlSpn', 'Get-FMPSqlSpnInstance', 'Get-FMPSqlDirectoryCandidate', 'ConvertFrom-FMPSqlBrowserResponse',
        'Find-FMPSqlBrowserInstance', 'Get-FMPSqlInstanceDetail', 'Get-FMPSqlClassification', 'Merge-FMPSqlEstate',
        'Get-FMPSqlEstateSummary', 'Invoke-FMPSqlEstateDiscovery'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('SQLServer', 'Assessment', 'ReadOnly') } }
}
