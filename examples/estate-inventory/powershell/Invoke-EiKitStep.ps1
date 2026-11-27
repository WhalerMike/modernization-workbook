#Requires -Version 7.1
<#
.SYNOPSIS
    One cloud step of the estate inventory, in its own PowerShell 7 process: sign in (app-only,
    unless -Fixture), run the kit's script unchanged at this script's scope, and write the step's
    result to -ResultPath. Invoke-EstateInventory.ps1 starts it; it isn't meant to be run by hand.
.EXAMPLE
    # What Invoke-EiKitProcess runs for the privileged access step of a fixture run.
    ./powershell/Invoke-EiKitStep.ps1 -SettingsPath config/settings.fixture.json -Step privileged-access `
        -RunPath C:\FMWLabs\results\estate-inventory\<run> -ResultPath C:\FMWLabs\results\estate-inventory\<run>\logs\privileged-access.result.json -Fixture
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][ValidateSet('non-person-identity', 'privileged-access', 'validation-kit')][string]$Step,
    [Parameter(Mandatory)][string]$RunPath,
    [Parameter(Mandatory)][string]$ResultPath,
    [switch]$Fixture,
    [string]$StartKitRun
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'EstateInventory/EstateInventory.psm1') -Force
$result = $null
try {
    $settings = Read-EiSettings -Path $SettingsPath -Fixture:$Fixture
    $session = $null
    if (-not $Fixture) {
        $session = Connect-EiCloud -Settings $settings -NeedAzure:(Test-EiNeedsAzure -Settings $settings -Step $Step)
        Write-Output "Signed in: app $($session.GraphApp) ($($session.AuthType)), Azure: $($session.Azure)"
    }
    $plan = Get-EiKitPlan -Settings $settings -Step $Step -RunPath $RunPath -Fixture:$Fixture -StartKitRun $StartKitRun
    $returned = foreach ($call in $plan.Calls) {
        $a = $call.Arguments
        Write-Output "Running $($call.Script)"
        & $call.Script @a
    }
    foreach ($o in $returned) { if ($o -is [string]) { Write-Output $o } }
    $result = Complete-EiKitStep -Plan $plan -RunPath $RunPath -Returned @($returned)
    $result['session'] = $session
} catch {
    $result = @{ status = 'Error'; detail = "$($_.Exception.Message)" }
    Write-Output "ERROR: $($_.Exception.Message)"
}
$result.Remove('_eiResult')
$result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ResultPath -Encoding utf8
if ($result['status'] -eq 'Error') { exit 1 }
exit 0
