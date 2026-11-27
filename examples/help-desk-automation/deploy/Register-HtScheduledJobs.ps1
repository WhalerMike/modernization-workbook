#Requires -Version 7.1
<#
.SYNOPSIS
    Registers the four read-only help desk jobs as Windows scheduled tasks under the assessment gMSA on the platform host. A dry run unless -Apply.
.DESCRIPTION
    WD-181: every scheduled read-only assessment runs as a Windows scheduled task under gmsa-fmpassess$, and
    signs in to Graph and Azure as its own reader app. Without -Apply it prints the tasks it would register
    and changes nothing. With -Apply it registers them with Task Scheduler's own cmdlets (the task principal
    is the gMSA, LogonType Password, so no password is stored), as the estate inventory and Provider Notices
    runbooks do. Run it as a host administrator, after the gMSA is installed on the host.
      FMW Help Desk - Sync check        daily 06:30
      FMW Help Desk - Consent requests  daily 07:00
      FMW Help Desk - Log forwarding    daily 07:15
      FMW Help Desk - Role review       weekly, Monday 07:30
.EXAMPLE
    ./deploy/Register-HtScheduledJobs.ps1 -SettingsPath D:\HelpDeskAutomation\settings.json
.EXAMPLE
    ./deploy/Register-HtScheduledJobs.ps1 -SettingsPath D:\HelpDeskAutomation\settings.json -Apply
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [switch]$Apply)
$ErrorActionPreference = 'Stop'
$s = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
if ($s.runAs -notmatch '^[^\\]+\\[^\\]+\$$') { throw "runAs must be a gMSA as DOMAIN\name$ (WD-181), not '$($s.runAs)'." }
$script = Join-Path $s.kitPath 'deploy/Invoke-HtScheduledRun.ps1'
$jobs = @(
    @{ Name = 'FMW Help Desk - Sync check'; Job = 'sync'; Trigger = { New-ScheduledTaskTrigger -Daily -At '06:30' }; When = 'daily 06:30' }
    @{ Name = 'FMW Help Desk - Consent requests'; Job = 'consent'; Trigger = { New-ScheduledTaskTrigger -Daily -At '07:00' }; When = 'daily 07:00' }
    @{ Name = 'FMW Help Desk - Log forwarding'; Job = 'logs'; Trigger = { New-ScheduledTaskTrigger -Daily -At '07:15' }; When = 'daily 07:15' }
    @{ Name = 'FMW Help Desk - Role review'; Job = 'roles'; Trigger = { New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At '07:30' }; When = 'weekly, Monday 07:30' }
)
foreach ($j in $jobs) {
    $arg = "-NoProfile -NonInteractive -File `"$script`" -Job $($j.Job) -SettingsPath `"$SettingsPath`""
    if (-not $Apply) { [pscustomobject]@{ Task = $j.Name; When = $j.When; RunAs = $s.runAs; Runs = "pwsh.exe $arg"; Registered = $false }; continue }
    $action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument $arg
    $principal = New-ScheduledTaskPrincipal -UserId $s.runAs -LogonType Password
    Register-ScheduledTask -TaskName $j.Name -TaskPath '\FMW\' -Action $action -Trigger (& $j.Trigger) -Principal $principal -Force | Out-Null
    [pscustomobject]@{ Task = $j.Name; When = $j.When; RunAs = $s.runAs; Runs = "pwsh.exe $arg"; Registered = $true }
}
