#Requires -Version 7.1
<#
.SYNOPSIS
    Plans the workbook's deployment for one environment and creates nothing: validates the template, writes
    parameters.json (this environment's workspace and parameter values), the what-if and create commands, and
    plan.json, and prints the SHA-256 to approve. -RunWhatIf runs az deployment group what-if (read-only) and
    summarizes the change types; -WhatIfResultPath reads a saved what-if result instead (the lab).
.EXAMPLE
    ./deploy/New-DcDeploymentPlan.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/plan -RunWhatIf -ChangeRecord <change-record-id>
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][string]$OutputPath, [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [switch]$RunWhatIf, [string]$WhatIfResultPath, [string]$ChangeRecord = '')
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../powershell/DailyChecks/DailyChecks.psm1') -Force
$p = @{ SettingsPath = $SettingsPath; OutputPath = $OutputPath; AsOf = $AsOf; RunWhatIf = $RunWhatIf; ChangeRecord = $ChangeRecord }
if ($WhatIfResultPath) { $p.WhatIfResultPath = $WhatIfResultPath }
$r = New-DcDeploymentPlan @p
Write-Host "Plan ($($r.Mode)): $($r.Plan.Replace('\', '/'))"
if ($r.Changes.Count) { foreach ($c in $r.Changes) { Write-Host ("  what-if: {0,-8} {1}" -f $c.changeType, $c.resourceId) } } else { Write-Host '  what-if: not run (add -RunWhatIf)' }
Write-Host "Create command: $($r.CreateCommand)"
Write-Host "Approve with:   -ApprovedSha256 $($r.Sha256)"
