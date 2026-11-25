#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09. Compares two audit runs and lists the drift Book 06, Chapter 20 treats as a regression: a
    new usable Windows or SQL login outside the exception registry, sa re-enabled, SQL authentication
    accepted again, remote NTLM back, or an Entra login removed.
.PARAMETER BeforePath
    The earlier audit snapshot JSON.
.PARAMETER AfterPath
    The later audit snapshot JSON.
.PARAMETER ExceptionsPath
    The exception registry JSON.
.PARAMETER BeforeArcPath
    Optional: the Arc snapshot taken with the earlier run. With -AfterArcPath, an instance that falls out of
    Arc Category 1 is drift too (Runbook R09).
.PARAMETER AfterArcPath
    Optional: the Arc snapshot taken with the later run.
.PARAMETER OutputPath
    The folder for drift.csv, drift.json and manifest.json.
.EXAMPLE
    ./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -AfterPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -OutputPath out/drift
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$BeforePath, [Parameter(Mandatory)][string]$AfterPath, [Parameter(Mandatory)][string]$ExceptionsPath,
      [Parameter(Mandatory)][string]$OutputPath, [string]$BeforeArcPath, [string]$AfterArcPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$after = Read-SqlJson $AfterPath
$arcArgs = @{}
if ($BeforeArcPath -and $AfterArcPath) { $arcArgs = @{ BeforeArc = Read-SqlJson $BeforeArcPath; AfterArc = Read-SqlJson $AfterArcPath } }
$rows = @(Compare-SqlAuditRun -Before (Read-SqlJson $BeforePath) -After $after -Exceptions (Read-SqlJson $ExceptionsPath).exceptions @arcArgs)
Complete-SqlRun -Rows $rows -Name drift -Step DRIFT -OutputPath $OutputPath -AsOf $after.asOf -Show Instance, Drift, Detail
if ($rows.Count) { Write-Host "Drift is a compliance finding: open a task for each row (Building Ticket-to-Machine routes it)." }
