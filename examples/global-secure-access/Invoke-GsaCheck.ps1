#Requires -Version 7.1
<#
.SYNOPSIS
    Checks a collection against the guide's steps for the areas named, with the agency's own records from an inputs
    folder (decision records, the architecture record, the exception register, client records, the TLS record, the
    ring record). Prints each finding and writes findings.json, findings.csv and a manifest. Reads files only.
    Exit code 0 unless -FailOnFinding and a check fails.
.EXAMPLE
    ./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-decision -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('decision', 'baseline', 'client', 'traffic', 'compliant-network', 'tenant-restrictions', 'private-access', 'internet-access', 'tls', 'telemetry')][string[]]$Area,
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$CollectionPath,
    [Parameter(Mandatory)][string]$InputsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [switch]$FailOnFinding
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/GlobalSecureAccess/GlobalSecureAccess.psm1') -Force

$s = Read-GsaSettings -Path $SettingsPath
$f = @(Invoke-GsaChecks -Area $Area -CollectionPath $CollectionPath -InputsPath $InputsPath -Settings $s -OutputPath $OutputPath -AsOf $AsOf)
foreach ($x in $f) { Write-Host ('{0,-11} {1,-4}  {2}: {3}' -f $x.Id, $x.Status, $x.Object, $x.Detail) }
Write-Host ''
$by = $f | Group-Object Status | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }
Write-Host ("{0}: {1} checks ({2}). Written to {3}: findings.json, findings.csv, manifest.json" -f ($Area -join ', '), $f.Count, ($by -join ', '), $OutputPath)
if ($FailOnFinding -and @($f | Where-Object Status -EQ 'Fail').Count) { exit 1 }
