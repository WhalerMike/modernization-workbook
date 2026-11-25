#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 02. The authentication audit: each instance's login census by type, its findings (sa, usable SQL
    logins, mixed mode, a mode that changed without a restart, the service account) and its first-pass
    Arc-eligibility category (Book 06, Chapter 07 and Runbook R03).
.DESCRIPTION
    Reads an audit snapshot: the fixture in Lab 1, or one Export-SqlAuditSnapshot.ps1 writes from your test
    instance in Lab 2. Read-only.
.PARAMETER AuditPath
    The audit snapshot JSON.
.PARAMETER OutputPath
    The folder for census.csv/json, findings.csv/json and manifest.json.
.EXAMPLE
    ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath out/audit
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$AuditPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$audit = Read-SqlJson $AuditPath
$census = @($audit.instances | ForEach-Object { Get-SqlLoginCensus -Instance $_ })
$censusFiles = Write-SqlOutput -Rows $census -OutputPath $OutputPath -Name census
($census | Format-Table -AutoSize | Out-String -Width 160).TrimEnd() | Write-Host
Write-Host ''
$findings = @($audit.instances | ForEach-Object { Get-SqlAuthFinding -Instance $_ } | Where-Object { $_.Severity -ne 'info' -or $_.Finding -eq 'Arc-eligibility' })
Complete-SqlRun -Rows $findings -Name findings -Step AUDIT -OutputPath $OutputPath -AsOf $audit.asOf -Extra $censusFiles -Show Instance, Severity, Finding, Detail
