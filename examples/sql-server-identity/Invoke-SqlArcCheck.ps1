#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 03. Joins the audit to Azure Resource Graph results and settles each instance's Arc-eligibility
    category: 1 (ready for Entra logins), 2 (eligible, deploy Arc first) or 3 (upgrade or re-platform first).
.DESCRIPTION
    Reads the Arc snapshot (the fixture in Lab 1, or Export-SqlArcSnapshot.ps1's output in Lab 2) and refuses
    results from any cloud but AzureCloud, which a GCC (Moderate) tenant's Arc resources use (WD-028). Read-only.
.PARAMETER AuditPath
    The audit snapshot JSON.
.PARAMETER ArcPath
    The Arc snapshot JSON.
.PARAMETER OutputPath
    The folder for arc.csv, arc.json and manifest.json.
.EXAMPLE
    ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath out/arc
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$AuditPath, [Parameter(Mandatory)][string]$ArcPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$audit = Read-SqlJson $AuditPath
$arc = Read-SqlJson $ArcPath
$rows = @(Get-SqlArcCategory -Audit $audit -Arc $arc)
Complete-SqlRun -Rows $rows -Name arc -Step ARC -OutputPath $OutputPath -AsOf $arc.asOf -Show Instance, Version, Agent, Extension, Entra, Category, Next
