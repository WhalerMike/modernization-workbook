@{
    RootModule        = 'FMPAttributeSurvey.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = '5c0e7a3d-91b4-4f26-a8d3-2e6b7f1c4a90'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Attribute survey and wave lists: fill rate and value quality of the Attribute-Driven Migration attributes across every domain tree of the forest, read through the Global Catalog with a per-domain read for what it does not hold, and migration waves built from those attributes with every exclusion explained. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    FunctionsToExport = @('Get-FMPGlobalCatalogAttributeSet', 'Get-FMPAttributeSurvey', 'Get-FMPWaveList')
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('ActiveDirectory', 'Attributes', 'GlobalCatalog', 'Waves', 'ReadOnly') } }
}
