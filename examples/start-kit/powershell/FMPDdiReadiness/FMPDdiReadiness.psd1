@{
    RootModule        = 'FMPDdiReadiness.psm1'
    ModuleVersion     = '1.2.0'
    GUID              = '3d8b6f2e-91c4-4a7d-b5e0-6c2f1a9d4e87'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Read-only DNS, DHCP and IPAM readiness checks on the files the Start Kit''s DNS and DHCP collectors write: the Active Directory DNS departure register of Book 08, Chapter 10, the DHCP edge checks of Chapters 04 and 05, the address plan check of Chapter 07 across IPAM, DHCP, Azure, AWS and OCI, the Phase 5 decommissioning gates of Chapter 10 with a read-only locator record probe, and an index of the evidence for Chapter 11. Reads files and sends DNS queries only; signs in to nothing. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    FunctionsToExport = @('Read-FMPDdiRun', 'Get-FMPDnsDepartureRegister', 'Test-FMPDhcpEdge', 'Test-FMPAddressPlan', 'Test-FMPLocatorResolution',
        'Test-FMPDdiDecommissionGate', 'Get-FMPDdiEvidenceIndex')
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('DNS', 'DHCP', 'IPAM', 'DDI', 'Assessment', 'ReadOnly') } }
}
