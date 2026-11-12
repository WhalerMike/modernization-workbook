#Requires -Version 7.1
<#
.SYNOPSIS
    Writes the closure register from a normalized run: one entry per finding with Book 11, Chapter 10's
    closure-chain fields, the finding family and the workbook page that remediates it, the evidence that
    shows it is ready for closure, the default priority and any exception with its approval state.
    register.json, register.csv and manifest.json.
.PARAMETER RunPath
    The folder Invoke-ZtaNormalize.ps1 wrote.
.PARAMETER ExceptionsPath
    Optional CSV (testId, approverRole, approvedOn, expires, rationale, compensatingControl) of accepted
    findings. An exception with an expiry is the CISO's; one without is the authorizing official's.
.EXAMPLE
    ./Invoke-ZtaRegister.ps1 -RunPath out/run1 -OutputPath out/run1-register
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$RunPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$ExceptionsPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/ZtaResults/ZtaResults.psm1') -Force
$r = Invoke-ZtaRegister -RunPath $RunPath -OutputPath $OutputPath -ExceptionsPath $ExceptionsPath
Write-Host ("Register: {0} findings  P1 {1}  P2 {2}  P3 {3}  P4 {4}" -f $r.Findings, $r.Buckets.P1, $r.Buckets.P2, $r.Buckets.P3, $r.Buckets.P4)
Write-Host ("Governed exceptions: {0}" -f $r.Governed)
if ($r.Unrouted.Count) { Write-Warning ("Unrouted (assign a family): {0}" -f ($r.Unrouted -join ', ')) }
if ($r.ExceptionProblems.Count) { Write-Warning ("Exceptions to fix (lapsed or wrong approver): {0}" -f ($r.ExceptionProblems -join ', ')) }
Write-Host ("Written to {0}: register.json, register.csv, manifest.json" -f $OutputPath)
