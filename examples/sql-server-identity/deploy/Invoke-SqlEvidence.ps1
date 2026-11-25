#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10. Seals a stage: checks every run folder's manifest still matches its files, then appends one
    record to the evidence chain naming the stage, the instance, its runs and the previous record's hash.
    Refuses a stage missing a step config/requirements.json requires, and a stage whose deployment was a dry
    run unless -Rehearsal is set; production preflight never accepts a rehearsal.
.PARAMETER Stage
    test or production.
.PARAMETER Instance
    The instance the stage changed, as the audit names it.
.PARAMETER Rehearsal
    Seal a practice run whose deployment was a dry run. Preflight's PF-06 ignores rehearsal records.
.PARAMETER RunPaths
    The run folders (each with a manifest.json) that make up the stage.
.PARAMETER ChainPath
    The evidence chain (JSON Lines), created on first use.
.PARAMETER AsOf
    The date the stage is sealed (yyyy-MM-dd).
.EXAMPLE
    ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths out/test/preflight, out/audit, out/arc, out/test/plan, out/test/deploy, out/parallel -ChainPath out/evidence/chain.jsonl -AsOf 2026-12-20 -Rehearsal
#>
[CmdletBinding()]
param([Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage, [Parameter(Mandatory)][string]$Instance,
      [Parameter(Mandatory)][string[]]$RunPaths, [Parameter(Mandatory)][string]$ChainPath, [Parameter(Mandatory)][string]$AsOf, [switch]$Rehearsal)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/SqlIdentity/SqlIdentity.psd1') -Force
$bad = foreach ($r in $RunPaths) { Test-SqlManifest -OutputPath $r | Where-Object { -not $_.Match } | ForEach-Object { "$r/$($_.File)" } }
if ($bad) { throw "Changed since recorded: $($bad -join ', '). Re-run those steps." }
$rec = Add-SqlEvidenceRecord -Stage $Stage -Instance $Instance -RunPaths $RunPaths -ChainPath $ChainPath -AsOf $AsOf -Rehearsal:$Rehearsal
($rec | Format-List | Out-String).Trim() | Write-Host
Write-Host "Sealed the $Stage stage$(if ($Rehearsal) { ' as a rehearsal' }) in $($ChainPath.Replace([char]92, [char]47))"
