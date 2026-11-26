#Requires -Version 7.6
<#
.SYNOPSIS
    Reads Gitea through its REST API and writes snapshot-gitea.json: the version, whether an anonymous read is
    refused, system and repository webhooks (their URLs, never their secrets), pull mirrors and when each last
    synced, and the site administrators. Read-only: every call is a GET.
.DESCRIPTION
    Runs in PowerShell 7.6. The token is a Gitea access token with the read:admin and read:repository scopes,
    taken from the environment variable the settings file names (in production, put it there from the secret
    store just before the run, for example with Get-Secret). Calls go to the public URL through IIS, so the check
    also proves the reverse proxy answers.
.EXAMPLE
    pwsh -NoProfile -File ./Get-PhGiteaSnapshot.ps1 -SettingsPath ./config/settings.lab.json -OutputPath C:\FMWLabs\results\ph\snapshot-gitea.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PlatformHost/PlatformHost.psm1') -Force
$settings = Read-PhJson -Path $SettingsPath
$g = $settings.gitea
$base = $g.baseUrl.TrimEnd('/')
$token = [Environment]::GetEnvironmentVariable($g.tokenVariable)
if (-not $token) { throw "Set `$env:$($g.tokenVariable) to a Gitea token with read:admin and read:repository first." }
$common = @{ SkipCertificateCheck = [bool]$g.skipCertificateCheck; TimeoutSec = 30 }
$auth = @{ Authorization = "token $token" }

function Get-PhApi([string]$Path) {
    $out = @(); $page = 1
    do {
        $sep = $(if ($Path.Contains('?')) { '&' } else { '?' })
        $batch = @(Invoke-RestMethod -Uri "$base/api/v1$Path$($sep)limit=50&page=$page" -Headers $auth @common)
        $out += $batch; $page++
    } while ($batch.Count -eq 50)
    $out
}

# An anonymous read must be refused (REQUIRE_SIGNIN_VIEW = true answers 403).
$anon = Invoke-WebRequest -Uri "$base/api/v1/version" -SkipHttpErrorCheck @common
$version = (Invoke-RestMethod -Uri "$base/api/v1/version" -Headers $auth @common).version

$hooks = @()
foreach ($h in @(Get-PhApi '/admin/hooks')) { $hooks += [ordered]@{ scope = 'system'; id = $h.id; type = $h.type; url = $h.config.url; active = [bool]$h.active; events = @($h.events) } }
$repos = @(Get-PhApi '/repos/search' | ForEach-Object { $_.data })
$mirrors = @()
foreach ($r in $repos) {
    foreach ($h in @(Invoke-RestMethod -Uri "$base/api/v1/repos/$($r.full_name)/hooks" -Headers $auth @common)) {
        $hooks += [ordered]@{ scope = $r.full_name; id = $h.id; type = $h.type; url = $h.config.url; active = [bool]$h.active; events = @($h.events) }
    }
    if ($r.mirror) {
        $mirrors += [ordered]@{ fullName = $r.full_name; interval = $r.mirror_interval; mirrorUpdated = $(if ($r.mirror_updated) { ([DateTime]$r.mirror_updated).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') } else { '' }) }
    }
}
$admins = @(Get-PhApi '/admin/users' | Where-Object { $_.is_admin } | ForEach-Object { [ordered]@{ login = $_.login; prohibitLogin = [bool]$_.prohibit_login; sourceId = $_.source_id } })

$snapshot = [ordered]@{
    schema = 'fmp-ph-snapshot-gitea/1'
    takenAt = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    baseUrl = $base
    edition = "PowerShell $($PSVersionTable.PSVersion)"
    version = "$version"
    anonymousStatus = [int]$anon.StatusCode
    repositories = $repos.Count
    webhooks = $hooks; mirrors = $mirrors; admins = $admins
}
Write-PhJson -Path $OutputPath -Value $snapshot
"Wrote $OutputPath"
"  Gitea $version at $base; anonymous read answered $([int]$anon.StatusCode)"
"  $($repos.Count) repositories, $($mirrors.Count) mirror(s), $($hooks.Count) webhook(s), $($admins.Count) administrator(s)"
