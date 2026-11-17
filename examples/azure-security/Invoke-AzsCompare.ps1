#Requires -Version 7.1
<#
.SYNOPSIS
    Compares two runs of Invoke-AzsCheck.ps1 (two -Area all folders, or two folders of one area) by finding
    fingerprint and writes drift.json, drift.md and a manifest: per area, what is new, what was fixed and
    what is still open. Info rows are left out.
.EXAMPLE
    ./Invoke-AzsCompare.ps1 -Before out/week1 -After out/week2 -OutputPath out/drift -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$Before, [Parameter(Mandatory)][string]$After, [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')))
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/AzureSecurity/AzureSecurity.psm1') -Force
$r = Compare-AzsRun -Before $Before -After $After -OutputPath $OutputPath -AsOf $AsOf
foreach ($k in $r.Areas.Keys) { Write-Host ('{0,-9} new {1,2}  fixed {2,2}  still open {3,3}' -f $k, @($r.Areas[$k].new).Count, @($r.Areas[$k].fixed).Count, $r.Areas[$k].stillOpen) }
Write-Host ("Total:    new {0,2}  fixed {1,2}  still open {2,3}. Written to {3}: drift.json, drift.md" -f $r.Totals.new, $r.Totals.fixed, $r.Totals.stillOpen, $OutputPath)
