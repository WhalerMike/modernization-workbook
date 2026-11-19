#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the rollback and runs nothing: the read-only command that finds the workbook by its display name,
    the delete that removes it, and (with -PreviousPlanPath) the redeploy of the previous approved plan.
    Deleting the workbook removes a view only. Writes rollback.json and a hashed manifest.json.
.EXAMPLE
    ./deploy/Invoke-DcRollback.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/rollback
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [string]$PreviousPlanPath = '')
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/DailyChecks/DailyChecks.psm1') -Force
$r = New-DcRollbackPlan -SettingsPath $SettingsPath -OutputPath $OutputPath -AsOf $AsOf -PreviousPlanPath $PreviousPlanPath
Write-Host "Find:   $($r.find)"
Write-Host "Delete: $($r.delete)"
if ($r.redeployPrevious) { Write-Host "Or:     $($r.redeployPrevious)" }
Write-Host $r.note
