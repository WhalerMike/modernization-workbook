#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 01. Classifies every SQL Server instance in an estate inventory retain, consolidate, retire or
    review (Book 06, Chapter 06 and Runbook R02), and writes the classification with its evidence manifest.
.DESCRIPTION
    Reads the estate inventory (the fixture in Lab 1; in Lab 2, the inventory you build from the Start Kit's
    SQL Server discovery and the T-SQL inventory pass). Read-only: it changes nothing anywhere.
.PARAMETER EstatePath
    The estate inventory JSON.
.PARAMETER OutputPath
    The folder for estate.csv, estate.json and manifest.json.
.PARAMETER ZombieDays
    Days without a connection after which a database counts as a zombie (default 400, from config/thresholds.json).
.EXAMPLE
    ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath out/estate
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$EstatePath, [Parameter(Mandatory)][string]$OutputPath, [int]$ZombieDays = 0)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$estate = Read-SqlJson $EstatePath
$p = @{ Estate = $estate }; if ($ZombieDays) { $p.ZombieDays = $ZombieDays }
$rows = @(Get-SqlEstateClassification @p)
Complete-SqlRun -Rows $rows -Name estate -Step ESTATE -OutputPath $OutputPath -AsOf $estate.asOf -Show Instance, Version, Classification, Target, EntersMigration, Reason
$counts = $rows | Group-Object Classification | Sort-Object Name | ForEach-Object { "$($_.Name) $($_.Count)" }
Write-Host "Denominator: $($rows.Count) instances ($($counts -join ', '))"
