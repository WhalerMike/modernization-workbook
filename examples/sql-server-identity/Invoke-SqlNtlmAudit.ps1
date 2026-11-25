#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 06. Finds the patterns that make SQL Server connections use NTLM (Book 06, Chapter 14 and Runbook
    R06): missing, misplaced and duplicate SPNs, remote NTLM sessions, linked-server passthrough and clients
    that aren't domain-joined. Writes the setspn commands that would fix the SPNs to spn-fixes.txt, for review.
.PARAMETER AuditPath
    The audit snapshot JSON (service accounts, ports and connection samples).
.PARAMETER EstatePath
    The estate inventory JSON (host names).
.PARAMETER NtlmPath
    A folder holding spns.json, linked-servers.json and clients.json.
.PARAMETER OutputPath
    The folder for ntlm.csv, ntlm.json, spn-fixes.txt and manifest.json.
.EXAMPLE
    ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath out/ntlm
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$AuditPath, [Parameter(Mandatory)][string]$EstatePath, [Parameter(Mandatory)][string]$NtlmPath,
      [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$audit = Read-SqlJson $AuditPath
$spns = Read-SqlJson (Join-Path $NtlmPath 'spns.json')
$ls = Read-SqlJson (Join-Path $NtlmPath 'linked-servers.json')
$cl = Read-SqlJson (Join-Path $NtlmPath 'clients.json')
$rows = @(Get-SqlNtlmFinding -Audit $audit -Estate (Read-SqlJson $EstatePath) -Spns $spns.spns -LinkedServers $ls.linkedServers -Clients $cl.clients)
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
$fixes = Join-Path $OutputPath 'spn-fixes.txt'
$lines = @('# Review each line; run with Domain Admin rights in a change window. Nothing here has run.') +
    @($rows | Where-Object { $_.Fix -like 'setspn*' } | ForEach-Object { $_.Fix -split '; ' })
Write-SqlText -Path $fixes -Text (($lines -join "`n") + "`n")
Complete-SqlRun -Rows $rows -Name ntlm -Step NTLM -OutputPath $OutputPath -AsOf $audit.asOf -Extra $fixes -Show Instance, Pattern, Effect
Write-Host "SPN fixes to review: $($lines.Count - 1), in $($fixes.Replace('\', '/'))"
