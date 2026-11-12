#Requires -Version 7.1
<#
.SYNOPSIS
    Compares two normalized Zero Trust Assessment runs by test ID: new, regressed, fixed, still open, and
    no longer evaluated (a finding the tool didn't evaluate this time, which isn't fixed). Refuses runs
    from different tool versions unless -AcceptVersionChange names who reviewed the change and when.
    comparison.json, comparison.md and manifest.json.
.EXAMPLE
    ./Invoke-ZtaCompare.ps1 -PreviousPath out/run1 -CurrentPath out/run2 -OutputPath out/compare
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PreviousPath,
    [Parameter(Mandatory)][string]$CurrentPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AcceptVersionChange
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ZtaResults/ZtaResults.psm1') -Force
$r = Compare-ZtaRun -PreviousPath $PreviousPath -CurrentPath $CurrentPath -OutputPath $OutputPath -AcceptVersionChange $AcceptVersionChange
foreach ($k in $r.Counts.Keys) { Write-Host ('  {0,-20} {1,4}' -f $k, $r.Counts[$k]) }
Write-Host ("Written to {0}: comparison.json, comparison.md, manifest.json" -f $OutputPath)
