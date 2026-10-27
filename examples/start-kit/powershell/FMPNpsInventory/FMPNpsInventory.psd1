@{
    RootModule        = 'FMPNpsInventory.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = '7c3e9a41-2b6d-4f1e-9d85-0a4c6e2b7f13'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Read-only RADIUS and NPS inventory: NPS servers, RADIUS clients, network and connection request policies, the AD groups and certificates each policy authorizes against, and the KB5040268 hardening state. Shared secrets are never written. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    # ActiveDirectory is checked at run time, not required here, so the module imports for
    # offline review of configuration exports and for the fixture tests on a host without RSAT.
    FunctionsToExport = @(
        'ConvertFrom-FMPNpsConfig', 'ConvertFrom-FMPNpsConstraint', 'Get-FMPNpsServer', 'Get-FMPNpsHardeningEvent',
        'Get-FMPNpsFinding', 'Invoke-FMPNpsInventory'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('NPS', 'RADIUS', 'Assessment', 'ReadOnly') } }
}
