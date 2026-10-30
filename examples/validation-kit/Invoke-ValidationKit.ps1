#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the validation kit: the read-only checks behind the "Validate" step at every gate of
    the track implementation guides, with CSV and JSON results, a one-page summary and a
    provenance manifest.

.DESCRIPTION
    Selects checks by -Track and -CheckId (all of them by default), then either reads saved data
    from -FixturePath (no tenant needed) or signs in and reads the tenant:
      - Microsoft Graph with Connect-MgGraph, delegated with the least-privileged read scopes
        the selected checks need, or app-only with a certificate or a managed identity;
      - Azure Resource Graph with Connect-AzAccount, for the Arc track and VK-NPI-07;
      - Active Directory with the RSAT module, for VK-NPI-06, unless -SkipAD.
    Optional preview checks (VK-NPI-09) run only with -IncludePreview, or when named in -CheckId
    together with -IncludePreview. Every Graph call is a GET, except VK-DG-03's read-only beta rule evaluation. Nothing is
    written to the tenant, Azure or AD; every file goes under -OutputPath\<run-id>.

    Illustrative: unit-tested against fixtures, not proven against a live tenant.

.EXAMPLE
    .\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -FixturePath .\tests\fixtures\fail -Option @{ BaselineAssignmentName = 'server-baseline' }

    Runs every check against the fictional "fail" fixture tenant.

.EXAMPLE
    .\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track HR, DG -InputPath D:\Inputs

    Signs in to the worldwide (GCC) Graph with the delegated scopes the HR and dynamic-group
    checks need, and reads the HR export, exceptions and rule tests from D:\Inputs.

.EXAMPLE
    .\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track ARC -Option @{ BaselineAssignmentName = 'arc-baseline'; Subscriptions = @('<subscription-id>') }
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OutputPath,
    [ValidateSet('HR', 'DG', 'INT', 'ARC', 'NPI', 'SYNC', 'CA', 'PIV')][string[]]$Track,
    [string[]]$CheckId,
    # Saved data: <FixturePath>\<name>.json per data set. No sign-in.
    [string]$FixturePath,
    # Folder with the input files (exceptions.csv, hr-export.csv, cmdb.csv, ...). Defaults to -FixturePath.
    [string]$InputPath,
    [ValidateSet('gcc', 'global', 'gcchigh', 'dod')][string]$Cloud = 'gcc',
    [string]$TenantId,
    # App-only sign-in with a certificate (Graph and Azure permissions come from the app's grants).
    [string]$ClientId,
    [string]$CertificateThumbprint,
    [switch]$ManagedIdentity,
    # Already signed in (Connect-MgGraph and Connect-AzAccount run beforehand).
    [switch]$SkipConnect,
    [switch]$SkipAD,
    # Also read settings catalog policies (beta) in VK-INT-04 and VK-INT-05, and run VK-INT-07 (Group Policy analytics, beta).
    [switch]$IncludeBeta,
    # Also run the optional preview checks (VK-NPI-09, beta), which are off by default.
    [switch]$IncludePreview,
    # Evaluate as of this time instead of now (fixtures use 2026-10-29).
    $AsOf,
    # Threshold and input overrides, for example @{ StaleDays = 60; BaselineAssignmentName = 'arc-baseline' }.
    [hashtable]$Option = @{}
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Module -Name ValidationKit)) { Import-Module (Join-Path (Join-Path (Join-Path $PSScriptRoot 'powershell') 'ValidationKit') 'ValidationKit.psd1') }

$start = Get-Date
$checks = @(Get-VkCheckCatalog -Track $Track -CheckId $CheckId -IncludeOptional:$IncludePreview)
if ($checks.Count -eq 0) { throw 'No checks selected.' }
$context = Get-VkRunContext -FixturePath $FixturePath -InputPath $InputPath -AsOf $AsOf -Cloud $Cloud -Option $Option -SkipAD:$SkipAD -IncludeBeta:$IncludeBeta -IncludePreview:$IncludePreview
$scopes = @(Get-VkRequiredScope -Checks $checks)

if ($context.Mode -eq 'Live' -and -not $SkipConnect) {
    $graphChecks = @($checks | Where-Object { @($_.GraphPermissions).Count -gt 0 })
    if ($graphChecks.Count -gt 0) {
        if ($ManagedIdentity) { Connect-VkGraph -Cloud $Cloud -Identity }
        elseif ($ClientId) { Connect-VkGraph -Cloud $Cloud -TenantId $TenantId -ClientId $ClientId -CertificateThumbprint $CertificateThumbprint }
        else { Connect-VkGraph -Cloud $Cloud -TenantId $TenantId -Scopes $scopes }
    }
    if (@($checks | Where-Object { $_.AzureRole }).Count -gt 0) {
        Connect-VkAzure -Cloud $Cloud -TenantId $TenantId -Identity:$ManagedIdentity
    }
}
Write-Host ("Validation kit ({0}, read-only): {1} check(s). Graph scopes: {2}" -f $context.Mode, $checks.Count, $(if ($scopes) { $scopes -join ' ' } else { 'none' }))

$results = foreach ($c in $checks) {
    $r = Invoke-VkCheck -CheckId $c.Id -Context $context
    Write-Host ('  {0,-10} {1,-13} {2,5}  {3}' -f $r.CheckId, $r.Status, $r.Count, $r.Title)
    $r
}

$parameters = @{
    Track = @($Track); CheckId = @($CheckId); Fixture = [bool]$FixturePath; InputPath = [bool]$InputPath; Cloud = $Cloud
    AppOnly = [bool]($ClientId -or $ManagedIdentity); SkipConnect = [bool]$SkipConnect; SkipAD = [bool]$SkipAD; IncludeBeta = [bool]$IncludeBeta; IncludePreview = [bool]$IncludePreview
    OptionKeys = @($Option.Keys | Sort-Object)
}
$out = Write-VkRunOutput -OutputPath $OutputPath -StartTime $start -Context $context -Results @($results) -Parameters $parameters -RequestedScopes $scopes
Write-Host ("Done: {0} files under {1}. Summary: {2}" -f $out.FileCount, $out.RunPath, $out.Summary)
$results
