<#
.SYNOPSIS
    Step 7: check the application catalog against the packaging standard. For every application, report
    whether its source is wrapped in PSAppDeployToolkit (and which major version), and the action the
    standard asks for. Read-only.
.DESCRIPTION
    Reads the applications table of an inventory run (which already holds each source folder's wrapper,
    when the inventory was given -PackageSourceRoot) and assigns one action per application:
      keep          on PSAppDeployToolkit 4 at or above -MinimumVersion
      update        on PSAppDeployToolkit 4 below -MinimumVersion
      migrate-v3    on PSAppDeployToolkit 3: move to the version 4 template
      wrap          an MSI or another installer with no wrapper
      retire        no installs and no deployments: remove it rather than repackage it
      check-source  source folder not found or not checked
    Writes packaging.csv and a manifest, and prints the counts the plan's packaging gate needs.
.EXAMPLE
    ./Test-DpcPackaging.ps1 -InventoryPath out/inventory -MinimumVersion 4.1.0 -OutputPath out/packaging
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$InventoryPath,
    [version]$MinimumVersion = '4.1.0',
    [string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DpConsolidation/DpConsolidation.psm1') -Force

$apps = Read-DpcRows -RunPath $InventoryPath -Name 'applications'
$rows = foreach ($a in $apps) {
    $action = if ([int]$a.InstallCount -eq 0 -and [int]$a.Deployments -eq 0) { 'retire' }
    elseif ($a.Wrapper -eq 'PSAppDeployToolkit' -and $a.WrapperVersion -like '4*') {
        $v = $null
        if ([version]::TryParse($a.WrapperVersion, [ref]$v) -and $v -ge $MinimumVersion) { 'keep' } else { 'update' }
    }
    elseif ($a.Wrapper -eq 'PSAppDeployToolkit') { 'migrate-v3' }
    elseif ($a.Wrapper -in @('msi-only', 'none')) { 'wrap' }
    else { 'check-source' }
    [pscustomobject]@{ Application = $a.Application; InstallCount = [int]$a.InstallCount; Deployments = [int]$a.Deployments
        Wrapper = $a.Wrapper; WrapperVersion = $a.WrapperVersion; Action = $action }
}
$rows = @($rows | Sort-Object @{ Expression = 'InstallCount'; Descending = $true }, Application)
$run = New-DpcRun -Task packaging -Mode DryRun -OutputPath $OutputPath
Write-DpcEvidence -Run $run -Name 'packaging' -Rows $rows
$counts = @{}; foreach ($g in ($rows | Group-Object Action)) { $counts[$g.Name] = $g.Count }
$null = Complete-DpcRun -Run $run -Summary $counts
$onStandard = @($rows | Where-Object Action -EQ 'keep').Count
$kept = @($rows | Where-Object Action -NE 'retire').Count
Write-Output ("Applications: {0}; to retire: {1}; on the standard (PSAppDeployToolkit {2} or later): {3} of {4} kept" -f $rows.Count, ($rows.Count - $kept), $MinimumVersion, $onStandard, $kept)
Write-Output ("Actions: " + (($rows | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
Write-Output "Repackage in this order (most installed first):"
$rows | Where-Object { $_.Action -in @('wrap', 'migrate-v3', 'update') } | ForEach-Object { Write-Output ("  {0,-26} {1,6} installs  {2}" -f $_.Application, $_.InstallCount, $_.Action) }
Write-Output "Written to $($run.Output)"
