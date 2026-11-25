#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04. Judges a parallel run against Runbook R05's exit criteria, login by login: the Entra
    principal is seen connecting, no remote NTLM remains, and nothing arrives only on the legacy login.
    Read-only: it reports readiness and never disables a login.
.PARAMETER AuditPath
    An audit snapshot taken during or at the end of the parallel run.
.PARAMETER Instance
    The instance, as the audit names it.
.PARAMETER MappingPath
    The mapping CSV the login plan used.
.PARAMETER OutputPath
    The folder for parallel.csv, parallel.json and manifest.json.
.EXAMPLE
    ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/parallel
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$AuditPath, [Parameter(Mandatory)][string]$Instance, [Parameter(Mandatory)][string]$MappingPath,
      [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$audit = Read-SqlJson $AuditPath
$i = @($audit.instances | Where-Object { $_.name -eq $Instance })
if (-not $i.Count) { throw "No instance '$Instance' in $AuditPath." }
$rows = @(Test-SqlParallelRun -Instance $i[0] -Mapping (Import-Csv -LiteralPath $MappingPath))
Complete-SqlRun -Rows $rows -Name parallel -Step PARALLEL -OutputPath $OutputPath -AsOf $audit.asOf -Show Legacy, Entra, LegacySessions, EntraSessions, Ready, Why
$ready = @($rows | Where-Object Ready).Count
Write-Host "Cutover-ready: $ready of $($rows.Count)$(if ($ready -eq $rows.Count) { ': every exit criterion met' } else { ': keep the parallel run going' })"
