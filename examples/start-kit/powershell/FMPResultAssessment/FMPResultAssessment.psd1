@{
    RootModule        = 'FMPResultAssessment.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = '8c2e4b71-5f3a-4d09-b6e1-7a9d0c3f2e58'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Assesses a finished Start Kit run from its files: findings by severity, top risks, duplicate and orphan SPNs, service accounts without hosts or owners, and the changes since an earlier run, as Markdown, CSV and JSON. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    FunctionsToExport = @('Get-FMPAssessmentRule', 'Get-FMPRunAssessment', 'Compare-FMPRunAssessment', 'Invoke-FMPResultAssessment')
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('Assessment', 'Report', 'ReadOnly') } }
}
