#Requires -Version 7.1
<#
.SYNOPSIS
    Registers the request pipeline as a Windows scheduled task under its own gMSA, every five minutes. A dry run unless -Apply.
.DESCRIPTION
    WD-182: the pipeline runs under its own gMSA (an example name is gmsa-fmphelpdesk$), apart from the
    assessment gMSA gmsa-fmpassess$ that runs the read-only jobs (WD-181). Refuses a run-as account that
    isn't a gMSA, or that is the assessment gMSA.
.EXAMPLE
    ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json
.EXAMPLE
    ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -Apply
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [switch]$Apply)
$ErrorActionPreference = 'Stop'
$s = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
if ($s.runAs -notmatch '^[^\\]+\\[^\\]+\$$') { throw "runAs must be a gMSA as DOMAIN\name$ (WD-182), not '$($s.runAs)'." }
if ($s.runAs -match '\\gmsa-fmpassess\$$') { throw 'The request pipeline writes; it never runs as the assessment gMSA (WD-181, WD-182).' }
$script = Join-Path $s.kitPath 'deploy/Invoke-HtRequestPipeline.ps1'
$arg = "-NoProfile -NonInteractive -File `"$script`" -SettingsPath `"$SettingsPath`""
$task = [pscustomobject]@{ Task = 'FMW Help Desk - Request pipeline'; When = 'every 5 minutes'; RunAs = $s.runAs; Runs = "pwsh.exe $arg"; Registered = $false }
if ($Apply) {
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 5)
    $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
    Register-ScheduledTask -TaskName $task.Task -TaskPath '\FMW\' -Action (New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument $arg) -Trigger $trigger -Settings $settings -Principal (New-ScheduledTaskPrincipal -UserId $s.runAs -LogonType Password) -Force | Out-Null
    $task.Registered = $true
}
$task
