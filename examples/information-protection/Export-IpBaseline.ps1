#Requires -Version 7.1
<#
.SYNOPSIS
    Exports the Purview configuration baseline of Book 20, Chapter 12 into a snapshot folder with a manifest:
    every read in config/calls.json, one shell at a time (Security & Compliance PowerShell, Exchange Online
    PowerShell, then the AIPService module), read cmdlets only. -ListOnly prints the reads, their shells, roles
    and Learn pages, and connects to nothing. -FixturePath reads a fixture tenant instead of connecting.
    Workbook Ch 02.
.EXAMPLE
    ./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -ListOnly
.EXAMPLE
    ./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/tenant -OutputPath out/snapshot -AsOf 2026-11-24T08:00:00Z
.EXAMPLE
    ./Export-IpBaseline.ps1 -SettingsPath <settings-file> -OutputPath out/test-snapshot
#>
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$OutputPath = ('out/snapshots/{0}' -f [DateTime]::UtcNow.ToString('yyyy-MM-dd')),
    [string]$FixturePath,
    [switch]$ListOnly,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/InformationProtection/InformationProtection.psm1') -Force
$s = Read-IpSettings -Path $SettingsPath
if ($ListOnly) {
    Get-IpRequiredPermission | Format-Table Read, Shell, Cmdlet, File, Role -AutoSize -Wrap | Out-String -Width 200 | Write-Host
    return
}
$runner = if ($FixturePath) { New-IpFixtureRunner -Path $FixturePath } else { New-IpLiveRunner -Settings $s }
$r = Export-IpBaseline -Settings $s -Runner $runner -OutputPath $OutputPath -AsOf $AsOf
foreach ($x in $r.Reads) { Write-Host ('{0,-4} {1,-35} {2,-30} {3}' -f $x.shell, $x.cmdlet, $x.file, $(if ($x.status -eq 'read') { "$($x.count) item(s)" } else { $x.status })) }
Write-Host ("Exported {0} file(s) to {1} ({2} mode, tenant {3})" -f @($r.Reads | Where-Object status -EQ 'read').Count, (Resolve-Path -Relative -LiteralPath $r.OutputPath).Replace('\', '/'), $runner.Mode, $s.tenantDomain)
