@{
    RootModule        = 'SqlIdentity.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = '6f3e2a71-5c1d-4b8e-9a42-0d7c1e5b3f90'
    Author            = 'Federal Modernization Workbook'
    Description       = 'SQL Server identity: the functions behind Building SQL Server Identity (Book 06). Read-only; illustrative.'
    PowerShellVersion = '7.1'
    FunctionsToExport = @('Get-SqlKitConfig', 'Read-SqlJson', 'Get-SqlMajorVersion', 'Get-SqlEstateClassification', 'Get-SqlLoginCensus',
        'Get-SqlAuthFinding', 'Get-SqlArcCategory', 'New-SqlLoginPlan', 'Test-SqlParallelRun', 'Get-SqlGroupPattern', 'Get-SqlNtlmFinding',
        'ConvertFrom-SqlConnectionString', 'Find-SqlConnectionString', 'Get-SqlCertificateDependency', 'Get-SqlClosureRecord', 'Compare-SqlAuditRun',
        'Get-SqlFileHash', 'Write-SqlText', 'Write-SqlOutput', 'Write-SqlManifest', 'Test-SqlManifest', 'Add-SqlEvidenceRecord', 'Complete-SqlRun')
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
}
