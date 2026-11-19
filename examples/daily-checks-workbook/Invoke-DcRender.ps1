#Requires -Version 7.1
<#
.SYNOPSIS
    Prints what each tab of the workbook would show, from saved query results (fixtures), with no tenant:
    ATTENTION, CLEAR, STALE (a source the tab depends on is past its freshness limit, so an empty queue proves
    nothing), NO DATA or LINK-OUT. Writes render.json and render.md to OutputPath. The render is a picture for
    the lab; it is never evidence, and Invoke-DcEvidence.ps1 refuses it.
.EXAMPLE
    ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z -OutputPath out/day1
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$FixturePath, [Parameter(Mandatory)][string]$AsOf, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DailyChecks/DailyChecks.psm1') -Force
$r = Invoke-DcRender -FixturePath $FixturePath -AsOf $AsOf -OutputPath $OutputPath
$r | Format-Table @{ n = 'Tab'; e = { $_.Title } }, Status, Detail -AutoSize -Wrap | Out-String -Width 150 | Write-Host
Write-Host "Written to $OutputPath`: render.json, render.md (a view, not evidence)"
