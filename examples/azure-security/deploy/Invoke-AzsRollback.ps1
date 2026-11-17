#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the rollback of the security initiative: -Mode DoNotEnforce (back to audit) or -Mode Delete (remove
    the assignment). Sends the command only with -Apply and -ApprovedSha256 equal to the plan's hash.
.EXAMPLE
    ./deploy/Invoke-AzsRollback.ps1 -SettingsPath settings.test.json -Mode DoNotEnforce -OutputPath <output-root>/rollback
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][ValidateSet('DoNotEnforce', 'Delete')][string]$Mode,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Apply, [string]$ApprovedSha256, [switch]$Fixture)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'AzsDeploy.psm1') -Force
$r = New-AzsRollbackPlan -SettingsPath $SettingsPath -OutputPath $OutputPath -Mode $Mode -AsOf $AsOf -Apply:$Apply -ApprovedSha256 $ApprovedSha256 -Fixture:$Fixture
if ($r.Applied) { Write-Host 'Applied: 1 command sent; results.json records it' }
else {
    Get-Content (Join-Path $OutputPath 'plan.txt') | ForEach-Object { Write-Host $_ }
    Write-Host ("Plan SHA-256: {0}" -f $r.Sha256)
    Write-Host 'Dry run: nothing was sent.'
}
