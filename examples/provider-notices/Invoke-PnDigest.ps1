#Requires -Version 7.1
<#
.SYNOPSIS
    Writes the weekly digest of a collection: open notices by provider and kind, action required with
    its due date and owner, maintenance and changes starting soon, what is new and what closed. Writes
    digest.md, digest.csv and manifest.json. Reads only.
.EXAMPLE
    ./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$NoticesPath,
    [Parameter(Mandatory)][string]$StatePath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [int]$Days = 7,
    [int]$UpcomingDays = 30
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ProviderNotices/ProviderNotices.psm1') -Force

$d = New-PnDigest -NoticesPath $NoticesPath -StatePath $StatePath -OutputPath $OutputPath -AsOf $AsOf -Days $Days -UpcomingDays $UpcomingDays
Write-Host ("Digest: {0} open, {1} need action, {2} starting in the next {3} days, {4} new, {5} closed or no longer listed" -f $d.Open, $d.ActionRequired, $d.Upcoming, $UpcomingDays, $d.New, $d.Closed)
Write-Host ("Written to {0}: digest.md, digest.csv, manifest.json" -f $OutputPath)
