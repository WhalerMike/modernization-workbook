#Requires -Version 7.1
<#
.SYNOPSIS
    Lists the workbook's tabs: one per daily check in the operator runbook, with its kind (a workbook tab or
    a link out to the portal that holds the data), how well it fits a workbook, and the tables it reads.
    With -Id, shows one tab in full: its daily check, link-outs with their click paths, GCC note and action.
.EXAMPLE
    ./Show-DcManifest.ps1
.EXAMPLE
    ./Show-DcManifest.ps1 -Id entra-health
#>
[CmdletBinding()]
param([string]$Id)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DailyChecks/DailyChecks.psm1') -Force
if ($Id) {
    $t = @((Get-DcManifest).tabs | Where-Object { $_.id -eq $Id })
    if (-not $t.Count) { throw "No tab '$Id'." }
    $t = $t[0]
    Write-Host "$($t.title) ($($t.id)): $($t.kind), fit $($t.fit)"
    Write-Host "Daily check: $($t.check)"
    Write-Host "Tables:      $(if (@($t.tables).Count) { @($t.tables) -join ', ' } else { 'none (link-out)' })"
    foreach ($l in $t.linkOuts) { Write-Host "Link-out:    $($l.name): $($l.url) > $($l.path)" }
    Write-Host "GCC:         $($t.gcc)"
    Write-Host "Action:      $($t.action)"
    return
}
Get-DcTab | Format-Table Id, Kind, Fit, Queries, Tables -AutoSize -Wrap | Out-String -Width 160 | Write-Host
