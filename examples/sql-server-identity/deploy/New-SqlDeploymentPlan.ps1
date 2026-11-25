#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 10. Plans one environment's login migration: writes the create, cutover and rollback T-SQL for the
    instance in the settings, and plan.json with each file's SHA-256. The approver approves those hashes;
    Invoke-SqlDeploy.ps1 runs nothing whose hash differs.
.PARAMETER SettingsPath
    The environment's settings JSON.
.PARAMETER OutputPath
    The folder for the .sql files, plan.json, phases.csv/json and manifest.json.
.EXAMPLE
    ./deploy/New-SqlDeploymentPlan.ps1 -SettingsPath deploy/settings.test.example.json -OutputPath out/test/plan
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/SqlIdentity/SqlIdentity.psd1') -Force
$s = Read-SqlJson $SettingsPath
$audit = Read-SqlJson $s.auditPath
$inst = @($audit.instances | Where-Object { $_.name -eq $s.instance })
if (-not $inst.Count) { throw "No instance '$($s.instance)' in $($s.auditPath)." }
$plan = New-SqlLoginPlan -Instance $inst[0] -Mapping (Import-Csv -LiteralPath $s.mappingPath)
if ($plan.Unresolved.Count) { throw "Unresolved logins: $($plan.Unresolved -join ', '). Map them or record an exception first." }
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
$phases = [ordered]@{}
$files = foreach ($part in 'Create', 'Cutover', 'Rollback') {
    $f = Join-Path $OutputPath "$($part.ToLowerInvariant()).sql"
    Write-SqlText -Path $f -Text ((@($plan.$part) -join "`n") + "`n")
    $phases[$part.ToLowerInvariant()] = [ordered]@{ file = (Split-Path $f -Leaf); statements = @($plan.$part | Where-Object { $_ -match '^\s*(CREATE|ALTER|DENY|GRANT)' }).Count; sha256 = Get-SqlFileHash $f }
    $f
}
$pj = Join-Path $OutputPath 'plan.json'
Write-SqlText -Path $pj -Text ((ConvertTo-Json -Depth 5 -InputObject ([ordered]@{ asOf = $audit.asOf; environment = $s.environment; instance = $s.instance; server = $s.server; approver = $s.approver; phases = $phases })) + "`n")
$rows = foreach ($k in $phases.Keys) { [pscustomobject]@{ Phase = $k; File = $phases[$k].file; Statements = $phases[$k].statements; Sha256 = $phases[$k].sha256 } }
Complete-SqlRun -Rows @($rows) -Name phases -Step PLAN -OutputPath $OutputPath -AsOf $audit.asOf -Extra (@($files) + $pj) -Mode 'dry run' -Show Phase, Statements, Sha256
Write-Host "Approve the create hash, then run: ./deploy/Invoke-SqlDeploy.ps1 -PlanPath $($OutputPath.Replace([char]92, [char]47)) -Phase create -ApprovedHash <hash>"
