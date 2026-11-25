#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 09. Projects an audit run onto Book 06, Chapter 20's closure record: the five conditions, field
    by field, per instance, each met, NOT MET or external (evidenced by telemetry the audit points at).
.PARAMETER AuditPath
    The audit snapshot JSON.
.PARAMETER ExceptionsPath
    The exception registry JSON (the break-glass group and any dated exceptions).
.PARAMETER ArcPath
    The Arc snapshot JSON, for condition 4. Without it, condition 4 is external.
.PARAMETER OutputPath
    The folder for closure.csv, closure.json and manifest.json.
.EXAMPLE
    ./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -ArcPath tests/fixtures/arc/arc.json -OutputPath out/closure
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$AuditPath, [Parameter(Mandatory)][string]$ExceptionsPath, [string]$ArcPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$audit = Read-SqlJson $AuditPath
$exc = (Read-SqlJson $ExceptionsPath).exceptions
$arc = if ($ArcPath) { Read-SqlJson $ArcPath } else { $null }
$rows = @(Get-SqlClosureRecord -Audit $audit -Exceptions $exc -Arc $arc)
$byInstance = $rows | Group-Object Instance | ForEach-Object {
    $notMet = @($_.Group | Where-Object Status -eq 'NOT MET').Count
    [pscustomobject]@{ Instance = $_.Name; Met = @($_.Group | Where-Object Status -eq 'met').Count; NotMet = $notMet
        External = @($_.Group | Where-Object Status -eq 'external').Count
        Record = if ($notMet) { 'open' } else { 'ready for the assessor, with the external evidence' } }
}
($byInstance | Format-Table -AutoSize | Out-String -Width 160).TrimEnd() | Write-Host
Write-Host ''
$open = @($rows | Where-Object Status -eq 'NOT MET')
Write-Host 'Conditions not met:'
Complete-SqlRun -Rows $rows -Name closure -Step CLOSURE -OutputPath $OutputPath -AsOf $audit.asOf -Show Instance, Condition, Status -DisplayRows $open

