@{
    RootModule        = 'FMPServerService.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = '3d6f5f0e-8b1a-4c57-9d3e-2a7c1b9e4f60'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Read-only server-to-service inventory: Win32_Service over CIM (WS-Management, then DCOM) per server, with each service''s logon account, and the servers that could not be read. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    FunctionsToExport = @('ConvertTo-FMPServiceAccount', 'Get-FMPServerList', 'Read-FMPServerService', 'Get-FMPServerServiceInventory')
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('Services', 'Assessment', 'ReadOnly') } }
}
