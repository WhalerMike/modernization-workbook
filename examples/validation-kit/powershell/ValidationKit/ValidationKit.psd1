@{
    RootModule        = 'ValidationKit.psm1'
    ModuleVersion     = '0.1.0'
    GUID              = '4f8f3c3e-5c55-4d55-9a3e-2b6f0b0c7a11'
    Author            = 'Federal Modernization Workbook'
    Description       = 'Read-only validation checks for the track implementation guides (HR, dynamic groups, Intune, Azure Arc, non-person identities, sync, Conditional Access personas, PIV binding). Illustrative: tested against fixtures, not a live tenant.'
    PowerShellVersion = '5.1'
    CompatiblePSEditions = @('Desktop', 'Core')
    FunctionsToExport = @(
        'Get-VkCheckCatalog', 'Get-VkRequiredScope', 'Invoke-VkCheck', 'Get-VkRunContext', 'Connect-VkGraph', 'Connect-VkAzure', 'Write-VkRunOutput',
        'Invoke-VkHr01', 'Invoke-VkHr02', 'Invoke-VkHr03', 'Invoke-VkHr04', 'Invoke-VkHr05', 'Invoke-VkHr06', 'Invoke-VkHr07',
        'Invoke-VkDg01', 'Invoke-VkDg02', 'Invoke-VkDg03', 'Invoke-VkDg04', 'Invoke-VkDg05', 'Invoke-VkDg06', 'Invoke-VkDg07',
        'Invoke-VkInt01', 'Invoke-VkInt02', 'Invoke-VkInt03', 'Invoke-VkInt04', 'Invoke-VkInt05', 'Invoke-VkInt06', 'Invoke-VkInt07',
        'Invoke-VkArc01', 'Invoke-VkArc02', 'Invoke-VkArc03', 'Invoke-VkArc04', 'Invoke-VkArc05', 'Invoke-VkArc06', 'Invoke-VkArc07',
        'Invoke-VkNpi01', 'Invoke-VkNpi02', 'Invoke-VkNpi03', 'Invoke-VkNpi04', 'Invoke-VkNpi05', 'Invoke-VkNpi06', 'Invoke-VkNpi07', 'Invoke-VkNpi08', 'Invoke-VkNpi09',
        'Invoke-VkSync01', 'Invoke-VkSync02', 'Invoke-VkSync03', 'Invoke-VkCa01', 'Invoke-VkPiv01'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
}
