#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the security initiative's assignment at the intermediate root in DoNotEnforce (guide Step 9) and
    prints the plan's SHA-256. Sends the command only with -Apply and -ApprovedSha256 equal to that hash.
.EXAMPLE
    ./deploy/New-AzsPolicyPlan.ps1 -SettingsPath settings.test.json -OutputPath <output-root>/plan
.EXAMPLE
    ./deploy/New-AzsPolicyPlan.ps1 -SettingsPath settings.test.json -OutputPath <output-root>/plan -Apply -ApprovedSha256 <plan-sha256>
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$FixturePath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')), [switch]$Apply, [string]$ApprovedSha256)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'AzsDeploy.psm1') -Force
$r = New-AzsPolicyPlan -SettingsPath $SettingsPath -OutputPath $OutputPath -FixturePath $FixturePath -AsOf $AsOf -Apply:$Apply -ApprovedSha256 $ApprovedSha256
if ($r.Applied) { Write-Host ("Applied: {0} command sent; results.json records it" -f $r.Commands) }
else {
    Get-Content (Join-Path $OutputPath 'plan.txt') | ForEach-Object { Write-Host $_ }
    Write-Host ("Plan SHA-256: {0}" -f $r.Sha256)
    Write-Host 'Dry run: nothing was sent. Review plan.txt, then rerun with -Apply -ApprovedSha256 <that hash>.'
}
