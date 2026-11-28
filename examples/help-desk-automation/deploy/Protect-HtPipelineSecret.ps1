#Requires -Version 7.1
<#
.SYNOPSIS
    Puts the ServiceNow or SailPoint secret where only the pipeline's gMSA can read it (WD-184): a file protected with DPAPI in the gMSA's own scope. A dry run unless -Apply.
.DESCRIPTION
    A gMSA never signs in interactively, so a person can't protect a secret as it directly. With -Apply, a Tier 0
    administrator on the platform host types the secret once (Read-Host -AsSecureString). The script protects
    it with DPAPI in the machine's scope to a staging file beside the secret file, registers a one-time
    scheduled task under the settings' runAs gMSA that runs this script with -Complete, starts it and waits.
    As the gMSA, -Complete decrypts the staging file, protects the secret again in the gMSA's own scope
    (Protect-HtSecretFile) into the staging folder, and deletes the staged copy; the gMSA can write only
    there, never beside its certificate. The script then removes the task, moves the protected file to the
    secret file the settings name, resets its access to the credentials folder's, and checks nothing is
    left in staging. The secret is never on disk in
    plain text, never in an environment variable, and never in the settings or the task's arguments.
    Refuses the assessment gMSA and a run-as account that isn't a gMSA, as Register-HtRequestPipeline.ps1 does.
.EXAMPLE
    ./deploy/Protect-HtPipelineSecret.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -System servicenow
.EXAMPLE
    ./deploy/Protect-HtPipelineSecret.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -System sailpoint -Apply
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [Parameter(Mandatory)][ValidateSet('servicenow', 'sailpoint')][string]$System,
      [switch]$Apply, [switch]$Complete)
$ErrorActionPreference = 'Stop'
$kit = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $kit 'powershell/HelpDeskAutomation/HelpDeskAutomation.psm1') -Force
$s = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
if ($s.runAs -notmatch '^[^\\]+\\[^\\]+\$$') { throw "runAs must be a gMSA as DOMAIN\name$ (WD-182), not '$($s.runAs)'." }
if ($s.runAs -match '\\gmsa-fmpassess\$$') { throw 'The request pipeline writes; it never runs as the assessment gMSA (WD-181, WD-182).' }
$target = if ($System -eq 'servicenow') { $s.serviceNowSecretFile } else { $s.iscSecretFile }
if (-not $target) { throw "The settings name no secret file for $System (serviceNowSecretFile, iscSecretFile; WD-184)." }
$stageDir = Join-Path (Split-Path -Parent $target) 'staging'
$stage = Join-Path $stageDir "$System.stage"
$protected = Join-Path $stageDir "$System.secret"
$stageEntropy = [Text.Encoding]::UTF8.GetBytes('FMW help desk staging (WD-184)')
$taskName = "FMW Help Desk - Protect $System secret"

if ($Complete) {
    # Runs as the gMSA, from the one-time task.
    $plain = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($stage), $stageEntropy, [Security.Cryptography.DataProtectionScope]::LocalMachine)
    try {
        $sec = [Net.NetworkCredential]::new('', [Text.Encoding]::UTF8.GetString($plain)).SecurePassword
    } finally { [Array]::Clear($plain, 0, $plain.Length) }
    Protect-HtSecretFile -Path $protected -Secret $sec | Out-Null
    Remove-Item -LiteralPath $stage -Force
    return
}

$plan = [pscustomobject]@{ System = $System; SecretFile = $target; ProtectedFor = $s.runAs; Task = $taskName; Applied = $false; TaskResult = $null }
if (-not $Apply) { return $plan }
if (-not $IsWindows) { throw 'A DPAPI-protected secret file needs Windows (WD-184).' }
$secret = Read-Host -AsSecureString "The $System secret, protected for $($s.runAs)"
$plain = [Text.Encoding]::UTF8.GetBytes([Net.NetworkCredential]::new('', $secret).Password)
try {
    $blob = [Security.Cryptography.ProtectedData]::Protect($plain, $stageEntropy, [Security.Cryptography.DataProtectionScope]::LocalMachine)
} finally { [Array]::Clear($plain, 0, $plain.Length) }
New-Item -ItemType Directory -Force $stageDir | Out-Null
[IO.File]::WriteAllBytes($stage, $blob)
try {
    $arg = "-NoProfile -NonInteractive -File `"$PSCommandPath`" -SettingsPath `"$((Resolve-Path -LiteralPath $SettingsPath).Path)`" -System $System -Complete"
    Register-ScheduledTask -TaskName $taskName -TaskPath '\FMW\' -Action (New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument $arg) `
        -Principal (New-ScheduledTaskPrincipal -UserId $s.runAs -LogonType Password) -Settings (New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5)) -Force | Out-Null
    Start-ScheduledTask -TaskPath '\FMW\' -TaskName $taskName
    $deadline = (Get-Date).AddMinutes(2)
    do { Start-Sleep -Seconds 2; $t = Get-ScheduledTask -TaskPath '\FMW\' -TaskName $taskName } while ($t.State -eq 'Running' -and (Get-Date) -lt $deadline)
    $plan.TaskResult = (Get-ScheduledTaskInfo -TaskPath '\FMW\' -TaskName $taskName).LastTaskResult
} finally {
    Unregister-ScheduledTask -TaskPath '\FMW\' -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Force; throw "The task didn't protect the $System secret as $($s.runAs) (result $($plan.TaskResult)); the staging file is deleted." }
}
if (-not (Test-Path -LiteralPath $protected)) { throw "The task wrote no protected secret (result $($plan.TaskResult))." }
Move-Item -LiteralPath $protected -Destination $target -Force
icacls.exe $target /reset /q | Out-Null
$plan.Applied = $true
$plan
