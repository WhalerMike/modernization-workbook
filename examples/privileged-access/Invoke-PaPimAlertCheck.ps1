#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 04: the read-only check of the PIM alerts CISA's Microsoft Entra ID baseline asks for.
    Reads the role management policy of each highly privileged role and writes findings.json
    (PA-PIM-10 for MS.AAD.7.7v1, PA-PIM-11 for MS.AAD.7.8v1) and a manifest. Changes nothing:
    the alert recipients are set in the admin center, under each role's Role settings >
    Notifications, and this check reads them back.
.EXAMPLE
    # The fictional tenant, no sign-in: PIM's default notifications, so every role is a Finding.
    ./Invoke-PaPimAlertCheck.ps1 -Cloud gcc -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/pim-alerts
.EXAMPLE
    # Live, GCC: sign in with the one read permission the check needs.
    Connect-MgGraph -Environment Global -Scopes (Get-PaPimRequiredPermission -Task pim-alerts).GraphPermissions
    ./Invoke-PaPimAlertCheck.ps1 -Cloud gcc -TenantId <tenant-id> -OutputPath runs/pim-alerts
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$TenantId
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PrivilegedAccess/PrivilegedAccess.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'powershell/PimEntraRoles/PimEntraRoles.psm1') -Force

if ($FixturePath) { $fake = New-PaPimFixtureInvoker -Path $FixturePath -Cloud $Cloud; $invoke = $fake.Invoke; $mode = 'Fixture' }
else { $invoke = New-PaPimLiveInvoker -Cloud $Cloud; $mode = 'Live' }

$client = New-PaPimClient -Cloud $Cloud -Task pim-alerts -Invoke $invoke
$roles = @(Get-PaPimHighlyPrivilegedRole)
$policies = Get-PaPimRolePolicy -Client $client -RoleTemplateId $roles.RoleTemplateId
$findings = @(Test-PaPimAlertSetting -Policies $policies)
$null = Export-PaPimRun -OutputPath $OutputPath -Task pim-alerts -Cloud $Cloud -Mode $mode -TenantId $TenantId -Evidence $client.Evidence -Files @{ 'findings.json' = $findings }

$n = { param($rule, $sev) @($findings | Where-Object { $_.Rule -eq $rule -and $_.Severity -eq $sev }).Count }
Write-Output ("Assignment alerts (MS.AAD.7.7v1): {0} of {1} highly privileged roles send them to an added recipient" -f (& $n 'PA-PIM-10' 'Info'), $roles.Count)
Write-Output ("Global Administrator activation alert (MS.AAD.7.8v1): {0}" -f $(if ((& $n 'PA-PIM-11' 'Info')) { 'set' } else { 'not set' }))
Write-Output ("{0} Finding, {1} Info" -f @($findings | Where-Object Severity -EQ 'Finding').Count, @($findings | Where-Object Severity -EQ 'Info').Count)
Write-Output "Read only: nothing was sent. Written to $OutputPath (manifest.json lists every request and file hash)"
