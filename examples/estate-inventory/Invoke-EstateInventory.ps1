#Requires -Version 7.1
<#
.SYNOPSIS
    One unattended, read-only inventory of an AD forest and its Entra ID tenant and Azure estate:
    the Start Kit, the non-person identity inventory, the privileged access inventory and the
    validation kit, in that order, into one dated run folder with a manifest.

.DESCRIPTION
    Reads the settings file, refuses it if it holds a secret (or, for a live run, a placeholder),
    makes <outputRoot>\<UTC yyyy-MM-ddTHHmmssZ>, and runs:

      1. start-kit            Invoke-FMPStartKit.ps1 in Windows PowerShell 5.1, as this account
      2. non-person-identity  Invoke-NpiInventory.ps1, once per domain, with the Start Kit's
                              server-to-service inventory when it wrote one
      3. privileged-access    Invoke-PaInventory.ps1
      4. validation-kit       Invoke-ValidationKit.ps1 on its step's session (-SkipConnect)

    Steps 2 to 4 each run in their own PowerShell 7 process, which signs in to Microsoft Graph
    (and Azure when the step reads it) app-only, with a certificate or a managed identity.

    then writes EstateInventoryManifest.json, EnvironmentProfile.json (the forest, domains,
    domain controllers, sites, trusts, tenant, cloud and Azure scopes the kits read, which
    powershell/FmpEnvironment hands to the labs), Summary.md and SHA256SUMS. A step that fails is
    recorded as Error and the others still run; a failed sign-in fails only its own step.
    Each kit runs its own script unchanged and writes its own manifest of every read.

    Exit code: 0 every step passed (or was recorded from fixtures), 2 a step ended in Error or
    Partial, 1 the settings were refused.

    Illustrative: tested on the kits' fixtures, not run against a live forest or tenant.

.EXAMPLE
    # Lab 1: every kit on its own fixtures, no forest and no tenant.
    ./Invoke-EstateInventory.ps1 -SettingsPath config/settings.fixture.json -Fixture

.EXAMPLE
    # Live, as the scheduled task's account (a gMSA) on a domain-joined Windows Server.
    ./Invoke-EstateInventory.ps1 -SettingsPath D:\EstateInventory\settings.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    # Run every kit on its own fixtures: no sign-in, no forest.
    [switch]$Fixture,
    # Only these steps (default: every step the settings enable).
    [ValidateSet('start-kit', 'non-person-identity', 'privileged-access', 'validation-kit')][string[]]$Step
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/EstateInventory/EstateInventory.psm1') -Force

try { $settings = Read-EiSettings -Path $SettingsPath -Fixture:$Fixture }
catch { Write-Error $_.Exception.Message -ErrorAction Continue; exit 1 }

$mode = if ($Fixture) { 'Fixture' } else { 'Live' }
$run = New-EiRunFolder -OutputRoot $settings['outputRoot']
Write-Output "Estate inventory ($mode, read-only): $($run.Path)"

$wanted = { param($name) (-not $Step -or $name -in $Step) -and (Test-EiStepEnabled -Settings $settings -Step $name) }
$results = [System.Collections.Generic.List[object]]::new()
$startKitRun = $null

if (& $wanted 'start-kit') {
    $r = Invoke-EiStep -Name 'start-kit' -RunPath $run.Path -Action { Invoke-EiStartKit -Settings $settings -RunPath $run.Path -Fixture:$Fixture }
    $results.Add($r)
    if ($r.Output) { $startKitRun = Join-Path $run.Path $r.Output }
}

$cloudSteps = @('non-person-identity', 'privileged-access', 'validation-kit' | Where-Object { & $wanted $_ })
foreach ($name in $cloudSteps) {
    $results.Add((Invoke-EiStep -Name $name -RunPath $run.Path -Action {
                Invoke-EiKitProcess -Settings $settings -Step $name -RunPath $run.Path -Fixture:$Fixture -StartKitRun $startKitRun
            }))
}
$session = @($results | Where-Object { $_.Session } | ForEach-Object { [ordered]@{ step = $_.Step; signIn = $_.Session } })

$null = Write-EiManifest -Settings $settings -Run $run -Results @($results) -Mode $mode -Session $session
foreach ($r in $results) { Write-Output ('  {0,-20} {1,-9} {2}' -f $r.Step, $r.Status, $(if ($r.Detail) { $r.Detail } else { $r.Output })) }
$profilePath = Join-Path $run.Path 'EnvironmentProfile.json'
if (Test-Path -LiteralPath $profilePath) {
    $envProfile = Get-Content -LiteralPath $profilePath -Raw | ConvertFrom-Json
    $counts = Get-EiProfileCount -EnvironmentProfile $envProfile
    Write-Output ('  {0,-20} {1,-9} {2}' -f 'environment-profile', $envProfile.provenance.label, "EnvironmentProfile.json: $($counts.Filled) filled, $($counts.Conflict) in conflict, $($counts.NotCollected) not collected")
    Write-Output "Written to $($run.Path) (EstateInventoryManifest.json, EnvironmentProfile.json, Summary.md, SHA256SUMS)"
} else {
    Write-Output ('  {0,-20} {1,-9} {2}' -f 'environment-profile', 'Error', 'not written; see logs/environment-profile.log')
    Write-Output "Written to $($run.Path) (EstateInventoryManifest.json, Summary.md, SHA256SUMS)"
}
if (@($results | Where-Object Status -In 'Error', 'Partial').Count -or -not (Test-Path -LiteralPath $profilePath)) { exit 2 }
exit 0
