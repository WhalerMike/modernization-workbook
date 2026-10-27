@{
    RootModule        = 'FMPADAssessment.psm1'
    ModuleVersion     = '1.2.0'
    GUID              = 'a780184d-7086-4cb0-9a1f-f70c94f6123a'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Read-only Active Directory forest assessment (Book 02 Appendix B, packaged) with the Book 00 and Book 01 additions: schema extensions, DHCP, the Kerberos SPN map, LDAP binding events, a read-access pre-flight and a one-page summary. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    # Appendix B listed ActiveDirectory and GroupPolicy here. The kit checks each RSAT module
    # when the collector that needs it runs, so one missing module fails one collector and the
    # module still imports for offline review and the fixture tests.
    FunctionsToExport = @(
        'Test-FMPPrerequisites', 'Test-FMPReadAccess', 'Get-FMPForestTopology', 'Get-FMPOUHierarchy', 'Get-FMPGPOInventory',
        'Export-FMPGPOSettings', 'Get-FMPDNSAssessment', 'Get-FMPPKIAssessment', 'Get-FMPComputerInventory',
        'Get-FMPUserInventory', 'Get-FMPGroupInventory', 'Get-FMPTrustMap', 'Get-FMPSchemaExtensions', 'Get-FMPDHCPInventory',
        'Get-FMPKerberosSpnMap', 'Get-FMPLdapBindingEvent', 'Invoke-FMPADAssessment', 'Compare-FMPAssessments',
        'Get-FMPStartKitSummary'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('ActiveDirectory', 'Assessment', 'ReadOnly') } }
}
