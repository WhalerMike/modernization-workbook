#Requires -Version 7.1
<#
.SYNOPSIS
    Writes the decommission plan for a retired or replaced application at its current gate, and exits 2 when a finding blocks it.
.DESCRIPTION
    Read only. Reads the application's footprint file (and, with -ReadEntra after Connect-MgGraph, its Entra ID
    sign-in state and last sign-in), checks the six shutdown gates of Book 18, Appendix B and writes plan.md,
    plan.json, findings.json and manifest.json under -OutputPath.
.EXAMPLE
    ./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire -AsOf 2026-12-10
.EXAMPLE
    ./Invoke-ArtPlan.ps1 -FootprintPath .\grants-footprint.json -OutputPath .\retire-plan -ReadEntra
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$FootprintPath, [Parameter(Mandatory)][string]$OutputPath, [switch]$ReadEntra, [datetime]$AsOf = (Get-Date).ToUniversalTime())
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/AppRetirement/AppRetirement.psm1') -Force
$r = New-ArtDecommissionPlan -FootprintPath $FootprintPath -OutputPath $OutputPath -ReadEntra:$ReadEntra -AsOf $AsOf
$r
if ($r.Findings -gt 0) { exit 2 }
