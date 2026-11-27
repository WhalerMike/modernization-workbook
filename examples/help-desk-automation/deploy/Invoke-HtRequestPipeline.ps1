#Requires -Version 7.1
<#
.SYNOPSIS
    The scheduled task the request pipeline runs every few minutes on the platform host (WD-182): signs in as the request worker app, to ServiceNow and to SailPoint, and works the approved queue.
.DESCRIPTION
    Runs under the pipeline's own gMSA, never the assessment gMSA. Signs in to Graph as the help desk request
    worker app with its certificate file, and to ServiceNow and SailPoint with OAuth client credentials whose
    secrets are in environment variables for this account (Connect-HtRequestSystems). Then
    Invoke-HtRequestQueue -Apply into a dated run folder. -DryRun checks the queue and changes nothing.
.EXAMPLE
    ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -DryRun
.EXAMPLE
    ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json -FixturePath tests/fixtures -DryRun
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$SettingsPath, [switch]$DryRun, [string]$FixturePath, [datetime]$AsOf = (Get-Date).ToUniversalTime())
$ErrorActionPreference = 'Stop'
$kit = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $kit 'powershell/HelpDeskAutomation/HelpDeskAutomation.psm1') -Force
$s = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
$bad = @($s.Keys | Where-Object { $_ -match 'secret$|password|apikey|privatekey' })
if ($bad) { throw "Settings hold a secret-like key ($($bad -join ', ')); secrets stay in the environment variables the settings name." }
if (-not $FixturePath) {
    $cert = [Security.Cryptography.X509Certificates.X509Certificate2]::new($s.certificatePath, [string]$null, [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
    Connect-MgGraph -Environment Global -TenantId $s.tenantId -ClientId $s.clientId -Certificate $cert -NoWelcome | Out-Null
    Connect-HtRequestSystems -Settings $s
}
$out = Join-Path $s.runsPath $AsOf.ToUniversalTime().ToString("yyyy-MM-dd'T'HHmmss'Z'")
$items = if ($s.configPath -and (Test-Path (Join-Path $s.configPath 'request-items.json'))) { Join-Path $s.configPath 'request-items.json' } else { $null }
$r = Invoke-HtRequestQueue -OutputPath $out -Apply:(-not $DryRun) -FixturePath $FixturePath -ItemsPath $items -AsOf $AsOf
$r | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 200 | Write-Host
if (@($r | Where-Object State -eq 'failed').Count) { exit 2 }
