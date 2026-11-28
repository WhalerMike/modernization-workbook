@{
    RootModule           = 'FmpEnvironment.psm1'
    ModuleVersion        = '1.0.0'
    GUID                 = '6c2b8f4e-1d7a-4e93-a5c0-8f3e2d9b7a41'
    Author               = 'Federal Modernization Workbook'
    Description          = 'Reads the estate inventory''s EnvironmentProfile.json and hands its values to the labs, after checking its age, its label, its manifest''s SHA-256 and SHA256SUMS. Reads files only. Illustrative; tested against fixtures.'
    PowerShellVersion    = '5.1'
    CompatiblePSEditions = @('Desktop', 'Core')
    FunctionsToExport    = @('Import-FmpEnvironment', 'Get-FmpEnvironmentValue', 'Get-FmpEnvironmentPlaceholder', 'Expand-FmpPlaceholder')
    CmdletsToExport      = @()
    VariablesToExport    = @()
    AliasesToExport      = @()
    PrivateData          = @{ PSData = @{ Tags = @('Inventory', 'Labs', 'ReadOnly') } }
}
