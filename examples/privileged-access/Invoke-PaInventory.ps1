#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 01: read the privileged inventory (Entra roles, PIM eligibility, Azure RBAC), classify
    it by tier, report the findings, and write the run with a manifest. Read-only.
.EXAMPLE
    # Lab 1: the fictional tenant, no sign-in.
    ./Invoke-PaInventory.ps1 -FixturePath tests/fixtures/tenant.json -OutputPath out/inventory `
        -AzureScope /subscriptions/11111111-1111-4111-8111-111111111111 -ExceptionsPath tests/fixtures/inputs/exceptions.csv
.EXAMPLE
    # Live, GCC with commercial Azure: sign in first with the task's scopes and Reader.
    Connect-MgGraph -Environment Global -Scopes (Get-PaRequiredPermission -Task inventory).GraphPermissions
    Connect-AzAccount -Environment AzureCloud
    ./Invoke-PaInventory.ps1 -Cloud gcc -OutputPath out/inventory -AzureScope /subscriptions/<id> -ExceptionsPath exceptions.csv -TenantId <tenant-id>
#>
[CmdletBinding()]
param(
    [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud = 'gcc',
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string[]]$AzureScope = @(),
    [string]$ExceptionsPath,
    [string[]]$ControlPlaneSubscriptionId = @(),
    [string]$TierMapPath,
    [string]$TenantId
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force

$map = if ($TierMapPath) { Get-PaTierMap -Path $TierMapPath } else { Get-PaTierMap }
if ($ControlPlaneSubscriptionId) { $map.azureControlPlaneSubscriptions.ids = @($ControlPlaneSubscriptionId) }

if ($FixturePath) {
    $invoke = (New-PaFixtureInvoker -Path $FixturePath -Cloud $Cloud).Invoke
    $mode = 'Fixture'
} else {
    $invoke = New-PaLiveInvoker -Cloud $Cloud -SkipAzure:($AzureScope.Count -eq 0)
    $mode = 'Live'
}
$reader = New-PaReader -Cloud $Cloud -Task inventory -Invoke $invoke
$inventory = Get-PaPrivilegedInventory -Reader $reader -AzureScope $AzureScope -TierMap $map
$findings = Test-PaInventory -Inventory $inventory -Exceptions (Import-PaExceptions -Path $ExceptionsPath)

$null = Export-PaRun -OutputPath $OutputPath -Task inventory -Cloud $Cloud -Mode $mode -TenantId $TenantId -Evidence $inventory.Evidence -Files @{
    'inventory.json' = @($inventory.Rows)
    'inventory.csv'  = @($inventory.Rows)
    'findings.json'  = @($findings)
}

$byTier = $inventory.Rows | Where-Object Via -EQ 'Direct' | Group-Object Plane, Tier | Sort-Object Name | ForEach-Object { "$($_.Values -join ' ')=$($_.Count)" }
Write-Output ("Assignments: {0} rows ({1})" -f @($inventory.Rows).Count, ($byTier -join ', '))
Write-Output ("Findings: {0} Finding, {1} Warn, {2} Info" -f @($findings | Where-Object Severity -EQ 'Finding').Count, @($findings | Where-Object Severity -EQ 'Warn').Count, @($findings | Where-Object Severity -EQ 'Info').Count)
Write-Output "Written to $OutputPath (manifest.json lists every request and file hash)"
