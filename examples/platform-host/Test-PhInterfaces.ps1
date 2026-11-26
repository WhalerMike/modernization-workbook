#Requires -Version 5.1
<#
.SYNOPSIS
    The platform host's read-only interface check: compares the snapshots with the settings file and the release
    manifest, prints one line per check (PH-01 to PH-12: Pass, Finding or NotChecked), writes results.json and,
    with -EvidencePath, records the run as evidence with its SP 800-53 controls and FedRAMP 20x KSIs.
.DESCRIPTION
    Reads only the snapshot files, so it runs in Windows PowerShell 5.1 or PowerShell 7, on the host or anywhere
    the snapshots are copied. Exits 1 when any check has a finding, so a scheduled task can raise it.
.EXAMPLE
    powershell.exe -NoProfile -File .\Test-PhInterfaces.ps1 -SettingsPath .\config\settings.lab.json -RunPath C:\FMWLabs\results\ph -EvidencePath C:\FMWLabs\results\ph-evidence
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$RunPath,
    [string]$ManifestPath,
    [string]$EvidencePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')),
    [string]$ChangeRecord = ''
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PlatformHost/PlatformHost.psm1') -Force
# Windows PowerShell 5.1 leaves $PSScriptRoot empty in a param block's defaults under -File, so defaults are set here.
if (-not $ManifestPath) { $ManifestPath = Join-Path $PSScriptRoot 'manifest/release-manifest.json' }
$settings = Read-PhJson -Path $SettingsPath
$windows = Read-PhJson -Path (Join-Path $RunPath 'snapshot-windows.json')
$giteaPath = Join-Path $RunPath 'snapshot-gitea.json'
$gitea = $(if (Test-Path -LiteralPath $giteaPath) { Read-PhJson -Path $giteaPath } else { $null })
$manifest = Read-PhJson -Path $ManifestPath
$rows = Test-PhSnapshot -Settings $settings -Windows $windows -Gitea $gitea -Manifest $manifest -AsOf $AsOf
Write-PhJson -Path (Join-Path $RunPath 'results.json') -Value ([ordered]@{ schema = 'fmp-ph-results/1'; checkedAt = $AsOf; environment = $settings.environment; computer = $windows.computer; rows = $rows })
Format-PhRows -Rows $rows
if ($EvidencePath) {
    $e = Write-PhEvidence -EvidencePath $EvidencePath -RunPath $RunPath -AsOf $AsOf -Environment $settings.environment -ChangeRecord $ChangeRecord
    "Record {0}: {1} ({2} findings)" -f $e.Sequence, $e.Result, $e.Findings
    "Controls: {0}" -f ($e.Controls -join ', ')
    "KSIs:     {0}" -f ($e.Ksis -join ', ')
}
if (@($rows | Where-Object Status -EQ 'Finding').Count) { exit 1 }
