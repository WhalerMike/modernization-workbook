#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04. Writes one instance's login migration as reviewable T-SQL (Book 06, Runbook R05): the Entra
    logins and database users to create, the cutover that disables the superseded users and SQL logins and
    denies CONNECT SQL to the superseded Windows groups (never dropping anything), and the rollback that
    restores them. Prints a warning for each principal that breaks Book 06's one group, one role. Executes
    nothing.
.PARAMETER AuditPath
    The audit snapshot JSON.
.PARAMETER Instance
    The instance to plan, as the audit names it.
.PARAMETER MappingPath
    The reviewed mapping CSV: WindowsLogin, EntraPrincipal, EntraType, Note.
.PARAMETER OutputPath
    The folder for <instance>-create.sql, -cutover.sql, -rollback.sql, plan.csv/json and manifest.json.
.EXAMPLE
    ./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/logins
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$AuditPath, [Parameter(Mandatory)][string]$Instance, [Parameter(Mandatory)][string]$MappingPath,
      [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/SqlIdentity/SqlIdentity.psd1') -Force
$audit = Read-SqlJson $AuditPath
$i = @($audit.instances | Where-Object { $_.name -eq $Instance })
if (-not $i.Count) { throw "No instance '$Instance' in $AuditPath." }
$plan = New-SqlLoginPlan -Instance $i[0] -Mapping (Import-Csv -LiteralPath $MappingPath)
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
$stem = $Instance.ToLowerInvariant()
$sql = foreach ($part in 'Create', 'Cutover', 'Rollback') {
    $f = Join-Path $OutputPath "$stem-$($part.ToLowerInvariant()).sql"
    Write-SqlText -Path $f -Text ((@($plan.$part) -join "`n") + "`n"); $f
}
Get-Content -LiteralPath $sql[0] | Write-Host
Write-Host ''
$summary = [pscustomobject]@{ Instance = $plan.Instance; MappedLogins = $plan.Mapped; EntraPrincipals = $plan.Principals
    Unresolved = if ($plan.Unresolved.Count) { $plan.Unresolved -join ', ' } else { 'none' }; CreateSha256 = (Get-SqlFileHash $sql[0]) }
Complete-SqlRun -Rows @($summary) -Name plan -Step LOGINS -OutputPath $OutputPath -AsOf $audit.asOf -Extra $sql -Mode 'dry run' -Show Instance, MappedLogins, EntraPrincipals, Unresolved
Write-Host "Create script SHA-256: $($summary.CreateSha256)"
foreach ($w in $plan.Warnings) { Write-Host "Warning: $w" }
