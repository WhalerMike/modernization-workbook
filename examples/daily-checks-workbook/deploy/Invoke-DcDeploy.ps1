#Requires -Version 7.1
<#
.SYNOPSIS
    Deploys an approved plan. Refuses a plan folder that changed, a plan.json whose SHA-256 isn't the approved
    one, a plan whose what-if wasn't run or shows a Delete, and (with -Apply) a plan not made against the live
    environment. Without -Apply it prints the create command and changes nothing.
.EXAMPLE
    ./deploy/Invoke-DcDeploy.ps1 -PlanPath <output-folder>/plan -ApprovedSha256 <plan-sha256> -OutputPath <output-folder>/deploy -Apply
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)][string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Apply)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/DailyChecks/DailyChecks.psm1') -Force
$r = Invoke-DcDeploy -PlanPath $PlanPath -ApprovedSha256 $ApprovedSha256 -OutputPath $OutputPath -AsOf $AsOf -Apply:$Apply
Write-Host $r.Detail
Write-Host "Command: $($r.Command)"
