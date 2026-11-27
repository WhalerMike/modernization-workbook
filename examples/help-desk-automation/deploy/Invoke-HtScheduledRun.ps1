#Requires -Version 7.1
<#
.SYNOPSIS
    The one script the platform host's scheduled tasks run: signs in as the help desk audit reader app and runs one read-only job into a dated run folder.
.DESCRIPTION
    -Job sync (the morning synchronization check), consent (the pending admin consent requests), roles (the
    custom role review) or logs (the event-log forwarding check). Signs in with the reader app's certificate
    file from the credential folder (WD-180, WD-181): Connect-MgGraph -Certificate for Graph, and
    Connect-AzAccount with the same certificate for the log check. Writes <runsPath>/<job>/<yyyy-MM-ddTHHmmssZ>/
    and, for sync, compares with the previous run. Exits 2 when a job has findings, so the scheduler's history
    shows it; each finding becomes a ticket (the next part of the kit routes them to ServiceNow).
    Read only: the reader app holds no write permission.
.EXAMPLE
    ./deploy/Invoke-HtScheduledRun.ps1 -Job sync -SettingsPath D:\HelpDeskAutomation\settings.json
.EXAMPLE
    ./deploy/Invoke-HtScheduledRun.ps1 -Job consent -SettingsPath tests/fixtures/settings.fixture.json -FixturePath tests/fixtures
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('sync', 'consent', 'roles', 'logs')][string]$Job,
    [Parameter(Mandatory)][string]$SettingsPath,
    [string]$FixturePath,
    [datetime]$AsOf = (Get-Date).ToUniversalTime()
)
$ErrorActionPreference = 'Stop'
$kit = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $kit 'powershell/HelpDeskAutomation/HelpDeskAutomation.psm1') -Force
$s = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
$bad = @($s.Keys | Where-Object { $_ -match 'secret|password|apikey|privatekey' })
if ($bad) { throw "Settings hold a secret-like key ($($bad -join ', ')); the reader app signs in with a certificate file." }
if (-not $FixturePath) {
    $ph = @($s.GetEnumerator() | Where-Object { $_.Value -is [string] -and $_.Value -match '<[^>]+>' } | ForEach-Object Key)
    if ($ph) { throw "Fill in the settings first: $($ph -join ', ')." }
    $cert = [Security.Cryptography.X509Certificates.X509Certificate2]::new($s.certificatePath, [string]$null, [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
    if (-not $cert.HasPrivateKey) { throw "The certificate file $($s.certificatePath) holds no private key." }
    if ($Job -eq 'logs') {
        Connect-AzAccount -ServicePrincipal -Tenant $s.tenantId -ApplicationId $s.clientId -CertificatePath $s.certificatePath -Subscription $s.subscriptionId | Out-Null
    } else {
        Connect-MgGraph -Environment Global -TenantId $s.tenantId -ClientId $s.clientId -Certificate $cert -NoWelcome | Out-Null
    }
}
$stamp = $AsOf.ToUniversalTime().ToString("yyyy-MM-dd'T'HHmmss'Z'")
$jobRoot = Join-Path $s.runsPath $Job
$out = Join-Path $jobRoot $stamp
$cfg = { param($name) if (-not $s.configPath) { return $null }; $p = Join-Path $s.configPath "$name.json"; if (Test-Path $p) { $p } else { $null } }
$common = @{ OutputPath = $out; AsOf = $AsOf }
if ($FixturePath) { $common.FixturePath = $FixturePath }
$r = switch ($Job) {
    'sync' {
        $prev = Get-ChildItem -Directory $jobRoot -ErrorAction SilentlyContinue | Where-Object Name -lt $stamp | Sort-Object Name | Select-Object -Last 1
        Invoke-HtSyncCheck @common -SettingsPath (& $cfg 'sync-check') -PreviousPath $(if ($prev) { $prev.FullName } else { $null })
    }
    'consent' { Get-HtPendingConsentRequest @common -ReviewPath (& $cfg 'consent-review') }
    'roles'   { Invoke-HtRoleReview @common -RegisterPath (& $cfg 'role-register') }
    'logs'    { Test-HtLogForwarding @common -SettingsPath (& $cfg 'log-forwarding') }
}
$r
if ($r.Findings -gt 0) { exit 2 }
