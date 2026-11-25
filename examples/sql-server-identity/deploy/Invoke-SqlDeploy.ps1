#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10. Runs one phase (create or cutover) of an approved plan. Without -Apply it is a dry run: it
    checks the hash and prints what it would run. With -Apply it runs the phase's T-SQL on the plan's
    server with Invoke-Sqlcmd (SqlServer module), signed in as the deployer's own Entra account, encrypted.
.DESCRIPTION
    Refuses when the phase file's SHA-256 doesn't match -ApprovedHash, so nothing unreviewed runs. Never
    drops a login: the cutover disables users and SQL logins and denies CONNECT SQL to Windows groups
    (taking a group out of sysadmin first), and Invoke-SqlRollback.ps1 restores them. Not run against a live
    instance by the workbook's authors.
.PARAMETER PlanPath
    The plan folder New-SqlDeploymentPlan.ps1 wrote.
.PARAMETER Phase
    create or cutover.
.PARAMETER ApprovedHash
    The SHA-256 the approver approved for this phase's file.
.PARAMETER Apply
    Run it. Without this switch nothing connects to SQL Server.
.PARAMETER AccessToken
    With -Apply: a Microsoft Entra access token for https://database.windows.net/, as a string or the
    SecureString newer Get-AzAccessToken returns (Invoke-Sqlcmd -AccessToken).
.PARAMETER OutputPath
    The folder for deploy.csv, deploy.json and manifest.json.
.EXAMPLE
    ./deploy/Invoke-SqlDeploy.ps1 -PlanPath out/test/plan -Phase create -ApprovedHash <hash> -OutputPath out/test/deploy
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][ValidateSet('create', 'cutover')][string]$Phase,
      [Parameter(Mandatory)][string]$ApprovedHash, [switch]$Apply, [object]$AccessToken, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/SqlIdentity/SqlIdentity.psd1') -Force
$plan = Read-SqlJson (Join-Path $PlanPath 'plan.json')
$file = Join-Path $PlanPath $plan.phases.$Phase.file
$now = Get-SqlFileHash $file
if ($now -ne $ApprovedHash.ToLowerInvariant()) { throw "Refused: $($plan.phases.$Phase.file) hashes to $now, not the approved $ApprovedHash. Re-plan and re-approve." }
$statements = @(Get-Content -LiteralPath $file | Where-Object { $_ -match '^\s*(CREATE|ALTER|DENY|GRANT)' })
if (-not $Apply) {
    Write-Host "Dry run: hash matches. Would run $($statements.Count) statements on $($plan.server) ($($plan.environment)):"
    $statements | ForEach-Object { Write-Host "  $($_.Trim())" }
    $result = 'dry run'
} else {
    if (-not (Get-Module -ListAvailable SqlServer)) { throw 'The SqlServer module is needed for -Apply (Install-Module SqlServer).' }
    if (-not $AccessToken) { throw '-Apply needs -AccessToken: an Entra token for https://database.windows.net/ for the deployer.' }
    Import-Module SqlServer
    if ($AccessToken -is [securestring]) { $AccessToken = ConvertFrom-SecureString -SecureString $AccessToken -AsPlainText }
    Invoke-Sqlcmd -ServerInstance $plan.server -InputFile $file -AccessToken $AccessToken -Encrypt Mandatory -ErrorAction Stop
    $result = 'applied'
}
$row = [pscustomobject]@{ Environment = $plan.environment; Instance = $plan.instance; Phase = $Phase; Statements = $statements.Count; Sha256 = $now; Result = $result }
Complete-SqlRun -Rows @($row) -Name deploy -Step DEPLOY -OutputPath $OutputPath -AsOf $plan.asOf -Mode $result -Show Environment, Instance, Phase, Statements, Result
