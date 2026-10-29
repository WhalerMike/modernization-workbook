#Requires -Version 5.1
<#
.SYNOPSIS
    Validation kit: read-only checks that prove each gate in the track implementation guides.
    One function per check ID (VK-HR-01 is Invoke-VkHr01), each returning CheckId, Track,
    Status (Pass, Fail, Warn, NotApplicable or Error), Count, Details and Evidence.

.DESCRIPTION
    Illustrative: unit-tested against fixtures, not proven against a live tenant.
    Windows PowerShell 5.1 and PowerShell 7.
#>


$here = $PSScriptRoot
. (Join-Path (Join-Path $here 'Private') 'Core.ps1')
. (Join-Path (Join-Path $here 'Private') 'Catalog.ps1')
foreach ($track in 'HR', 'DG', 'INT', 'ARC', 'NPI') {
    . (Join-Path (Join-Path $here 'Checks') "$track.ps1")
}

$checkFunctions = @($script:VkCatalog | ForEach-Object { Get-VkFunctionName $_.Id })
Export-ModuleMember -Function (@(
        'Get-VkCheckCatalog', 'Get-VkRequiredScope', 'Invoke-VkCheck', 'Get-VkRunContext',
        'Connect-VkGraph', 'Connect-VkAzure', 'Write-VkRunOutput'
    ) + $checkFunctions)
