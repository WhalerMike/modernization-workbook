#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 08. Lists the certificates SQL Server depends on, by Book 06, Chapter 22's classes, and says
    which an enterprise AD CS CA issued (moved to the issuer Book 07 assigns before that CA is retired) and
    which expire inside the warning window. Read-only.
.PARAMETER CertsPath
    The certificate inventory JSON (Runbook R10's reads, saved).
.PARAMETER OutputPath
    The folder for certificates.csv, certificates.json and manifest.json.
.EXAMPLE
    ./Invoke-SqlCertDependency.ps1 -CertsPath tests/fixtures/certs/certs.json -OutputPath out/certs
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$CertsPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$certs = Read-SqlJson $CertsPath
$rows = @(Get-SqlCertificateDependency -Certs $certs)
Complete-SqlRun -Rows $rows -Name certificates -Step CERTS -OutputPath $OutputPath -AsOf $certs.asOf -Show Instance, Class, ADCS, ExpiresInDays, Warning
Write-Host "Blocking an AD CS decommission: $(@($rows | Where-Object ADCS -eq 'yes').Count) of $($rows.Count)"
