#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 07. Scans application configuration for SQL Server connection strings, reports stored
    passwords (masked), and places each string on Book 06, Chapter 18's database axis: A (configuration
    only), B (driver or code change), C (vendor-dependent), or done (Entra already), with its target mode
    from Chapter 19's driver table. Read-only; never prints a password.
.PARAMETER Path
    A folder with one subfolder per application, each with its configuration files and an app.json.
.PARAMETER AsOf
    The date of the scan (yyyy-MM-dd), recorded in the manifest.
.PARAMETER OutputPath
    The folder for connections.csv, connections.json and manifest.json.
.EXAMPLE
    ./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath out/connections -AsOf 2026-11-20
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$rows = @(Find-SqlConnectionString -Path $Path)
Complete-SqlRun -Rows $rows -Name connections -Step CONN -OutputPath $OutputPath -AsOf $AsOf -Show Application, File, Finding, Driver, Column, Target -Width 200
$stored = @($rows | Where-Object Finding -eq 'Stored password').Count
Write-Host "Stored passwords: $stored. Column A (configuration only): $(@($rows | Where-Object Column -eq 'A').Count)."
