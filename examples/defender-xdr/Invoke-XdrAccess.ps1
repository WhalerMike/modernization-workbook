#Requires -Version 7.1
<#
.SYNOPSIS
    Gate 1: checks the cloud and Graph host the settings name, makes a first read of incidents, compares the
    Defender unified RBAC role export with the program's role design, and lists the permissions each kit task
    needs. Writes a run folder with a manifest. Reads only.
.EXAMPLE
    ./Invoke-XdrAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/access -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$RoleExportPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o'))
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DefenderXdr/DefenderXdr.psm1') -Force
$s = Read-XdrSettings -Path $SettingsPath
$r = Invoke-XdrAccessCheck -Settings $s -Invoker (Resolve-XdrInvoker -Settings $s -FixturePath $FixturePath) -OutputPath $OutputPath -AsOf $AsOf -RoleExportPath $RoleExportPath
$r.Rows | Format-Table Id, Status, Subject, Detail -AutoSize -Wrap | Out-Host
Write-Host ("Access: {0} checks, {1} failed. Written to {2}: results.csv, results.json, permissions.csv, raw/, manifest.json" -f $r.Rows.Count, $r.Failed, $OutputPath)
