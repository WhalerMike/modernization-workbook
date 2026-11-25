#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10. Rolls back a cutover by re-enabling the disabled Windows users and SQL logins and granting
    CONNECT SQL back to the denied Windows groups (the plan's rollback.sql). Without -Apply it is a dry run. The Entra logins stay: both paths work again at once.
.PARAMETER PlanPath
    The plan folder New-SqlDeploymentPlan.ps1 wrote.
.PARAMETER ApprovedHash
    The SHA-256 approved for rollback.sql.
.PARAMETER Apply
    Run it. Without this switch nothing connects to SQL Server.
.PARAMETER AccessToken
    With -Apply: a Microsoft Entra access token for https://database.windows.net/, as a string or a SecureString.
.PARAMETER OutputPath
    The folder for rollback.csv, rollback.json and manifest.json.
.EXAMPLE
    ./deploy/Invoke-SqlRollback.ps1 -PlanPath out/test/plan -ApprovedHash <hash> -OutputPath out/test/rollback
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedHash, [switch]$Apply, [object]$AccessToken,
      [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/SqlIdentity/SqlIdentity.psd1') -Force
$plan = Read-SqlJson (Join-Path $PlanPath 'plan.json')
$file = Join-Path $PlanPath $plan.phases.rollback.file
$now = Get-SqlFileHash $file
if ($now -ne $ApprovedHash.ToLowerInvariant()) { throw "Refused: rollback.sql hashes to $now, not the approved $ApprovedHash." }
$statements = @(Get-Content -LiteralPath $file | Where-Object { $_ -match '^\s*(ALTER LOGIN|GRANT CONNECT SQL|ALTER SERVER ROLE)' })
if (-not $Apply) {
    Write-Host "Dry run: hash matches. Would run $($statements.Count) statements to restore the logins on $($plan.server):"
    $statements | ForEach-Object { Write-Host "  $($_.Trim())" }
    $result = 'dry run'
} else {
    if (-not $AccessToken) { throw '-Apply needs -AccessToken.' }
    Import-Module SqlServer
    if ($AccessToken -is [securestring]) { $AccessToken = ConvertFrom-SecureString -SecureString $AccessToken -AsPlainText }
    Invoke-Sqlcmd -ServerInstance $plan.server -InputFile $file -AccessToken $AccessToken -Encrypt Mandatory -ErrorAction Stop
    $result = 'applied'
}
$row = [pscustomobject]@{ Environment = $plan.environment; Instance = $plan.instance; Statements = $statements.Count; Sha256 = $now; Result = $result }
Complete-SqlRun -Rows @($row) -Name rollback -Step RB -OutputPath $OutputPath -AsOf $plan.asOf -Mode $result -Show Environment, Instance, Statements, Result
