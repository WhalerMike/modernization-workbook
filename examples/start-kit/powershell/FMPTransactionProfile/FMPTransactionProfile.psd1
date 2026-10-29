@{
    RootModule        = 'FMPTransactionProfile.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = 'b4d2f8e6-3a91-4c57-8e0d-6f1a2c9b5e74'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Transaction profiles: measured round trips per business transaction, from a packet capture export or SELECT-only SQL Server connection counters, costed at the target round-trip time, with the per-application separation gate. Illustrative; unit-tested against fixtures.'
    PowerShellVersion = '5.1'
    FunctionsToExport = @(
        'Get-FMPTransactionCatalog', 'ConvertFrom-FMPPacketCapture', 'Measure-FMPSqlRoundTrip', 'Measure-FMPTcpRoundTrip',
        'Get-FMPTransactionProfile', 'Test-FMPSeparationGate', 'Get-FMPTransactionFinding', 'Invoke-FMPTransactionProfile'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData       = @{ PSData = @{ Tags = @('TransactionProfile', 'Latency', 'Assessment', 'ReadOnly') } }
}
