#Requires -Version 5.1
<#
.SYNOPSIS
    Reads the platform host's Windows side and writes snapshot-windows.json: listeners, firewall, the 443
    certificate and TLS protocol settings, the IIS reverse proxy and its log, Gitea's app.ini (secrets reduced to
    '<set>'), the gitea service, folder ACLs, gitea.exe's SHA-256, the newest backup and the Azure Arc agent.
    Read-only: it changes nothing on the host.
.DESCRIPTION
    Runs in Windows PowerShell 5.1 on the host, as a member of the local Administrators group (IIS keeps its
    configuration in applicationHost.config, which only administrators and SYSTEM can read). The settings file
    names the site, the paths and the service; see config/settings.lab.json and config/settings.template.json.
.EXAMPLE
    powershell.exe -NoProfile -File .\Get-PhWindowsSnapshot.ps1 -SettingsPath .\config\settings.lab.json -OutputPath C:\FMWLabs\results\ph\snapshot-windows.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/PlatformHost/PlatformHost.psm1') -Force
$settings = Read-PhJson -Path $SettingsPath
$h = $settings.host

function Get-Value($o, $n) { $p = $o.PSObject.Properties[$n]; if ($p) { $p.Value } }
function Get-AttrText($element, [string]$name) {
    # Microsoft.Web.Administration returns an enum attribute as its number; give its name, as the schema spells it.
    $a = $element.Attributes[$name]
    if ($null -eq $a) { return '' }
    $v = $a.Value
    if ($a.Schema -and $a.Schema.Type -eq 'enum') { $e = @($a.Schema.GetEnumValues() | Where-Object { $_.Value -eq [int]$v })[0]; if ($e) { return "$($e.Name)" } }
    "$v"
}

# Listeners, with the owning process name (System is http.sys, which serves IIS).
$procs = @{}
foreach ($p in Get-Process) { $procs[[int]$p.Id] = $p.ProcessName }
$listeners = @(Get-NetTCPConnection -State Listen | Sort-Object LocalPort, LocalAddress | ForEach-Object {
        [ordered]@{ address = "$($_.LocalAddress)"; port = [int]$_.LocalPort; pid = [int]$_.OwningProcess; process = "$($procs[[int]$_.OwningProcess])" }
    })

$profiles = @(Get-NetFirewallProfile | Sort-Object Name | ForEach-Object {
        [ordered]@{ name = "$($_.Name)"; enabled = ("$($_.Enabled)" -eq 'True'); defaultInboundAction = "$($_.DefaultInboundAction)" }
    })
$rules = @(Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayGroup -eq $h.firewallGroup } | ForEach-Object {
            $pf = $_ | Get-NetFirewallPortFilter
            [ordered]@{ name = "$($_.DisplayName)"; protocol = "$($pf.Protocol)"; localPort = "$($pf.LocalPort)" }
        })

# IIS through Microsoft.Web.Administration, which reports effective values, defaults included.
[void][Reflection.Assembly]::LoadFrom("$env:windir\System32\inetsrv\Microsoft.Web.Administration.dll")
$sm = New-Object Microsoft.Web.Administration.ServerManager
$site = $sm.Sites[$h.site]
if ($null -eq $site) { throw "IIS site '$($h.site)' not found" }
$https = @($site.Bindings | Where-Object { $_.Protocol -eq 'https' -and $_.EndPoint.Port -eq 443 })[0]
$tls = $null
if ($https -and $https.CertificateHash) {
    $thumb = (($https.CertificateHash | ForEach-Object { $_.ToString('X2') }) -join '')
    $cert = Get-Item -LiteralPath "Cert:\LocalMachine\$($https.CertificateStoreName)\$thumb"
    $protocols = [ordered]@{}
    foreach ($proto in @('TLS 1.0', 'TLS 1.1', 'TLS 1.2', 'TLS 1.3')) {
        $k = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\$proto\Server"
        $v = $null
        if (Test-Path -LiteralPath $k) { $v = Get-Value (Get-ItemProperty -LiteralPath $k) 'Enabled' }
        $protocols[$proto] = $(if ($null -eq $v) { 'default' } elseif ([int]$v -eq 0) { 'disabled' } else { 'enabled' })
    }
    $tls = [ordered]@{
        thumbprint = $thumb; subject = $cert.Subject; issuer = $cert.Issuer; selfSigned = ($cert.Subject -eq $cert.Issuer)
        notAfter = $cert.NotAfter.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); keyAlgorithm = $cert.PublicKey.Oid.FriendlyName
        keySize = $(if ($cert.PublicKey.Key) { $cert.PublicKey.Key.KeySize } else { 0 }); dnsNames = @($cert.DnsNameList | ForEach-Object { "$($_.Unicode)" })
        sslFlags = "$($https.SslFlags)"; protocols = $protocols
    }
}
$web = $sm.GetWebConfiguration($h.site)
$rulesSection = $web.GetSection('system.webServer/rewrite/rules')
$rewrite = @(foreach ($rule in $rulesSection.GetCollection()) {
        $action = $rule.GetChildElement('action'); $match = $rule.GetChildElement('match')
        [ordered]@{ name = "$($rule['name'])"; stopProcessing = [bool]$rule['stopProcessing']; matchUrl = "$($match['url'])"; actionType = (Get-AttrText $action 'type'); actionUrl = "$($action['url'])" }
    })
$limits = $web.GetSection('system.webServer/security/requestFiltering').GetChildElement('requestLimits')
$apphost = $sm.GetApplicationHostConfiguration()
$proxy = $null
try { $proxy = $apphost.GetSection('system.webServer/proxy') } catch { $proxy = $null }
$hsts = $site.GetChildElement('hsts')
$logFile = $site.LogFile
$wsFeature = Get-WindowsFeature -Name Web-WebSockets -ErrorAction SilentlyContinue
$iis = [ordered]@{
    site = $site.Name; siteId = [int]$site.Id; state = "$($site.State)"
    rewriteRules = $rewrite; useOriginalURLEncoding = [bool]$rulesSection['useOriginalURLEncoding']
    proxyEnabled = $(if ($proxy) { [bool]$proxy['enabled'] } else { $false })
    reverseRewriteHostInResponseHeaders = $(if ($proxy) { [bool]$proxy['reverseRewriteHostInResponseHeaders'] } else { $true })
    maxAllowedContentLength = [long]$limits['maxAllowedContentLength']
    hstsEnabled = [bool]$hsts['enabled']; hstsMaxAge = [long]$hsts['max-age']; hstsIncludeSubDomains = [bool]$hsts['includeSubDomains']
    webSockets = [bool]($wsFeature -and $wsFeature.Installed)
    log = [ordered]@{ format = "$($logFile.LogFormat)"; period = "$($logFile.Period)"; directory = [Environment]::ExpandEnvironmentVariables($logFile.Directory); fields = "$($logFile.LogExtFileFlags)" -replace '\s', '' }
}

# Gitea's app.ini, secrets reduced to '<set>'.
$ini = ConvertFrom-PhIni -Text ([IO.File]::ReadAllText($h.appIni))

# The service, from the Service Control Manager.
$svc = Get-CimInstance -ClassName Win32_Service -Filter "Name='$($h.service)'"
$service = $null
if ($svc) {
    $delayed = Get-Value (Get-ItemProperty -LiteralPath "HKLM:\SYSTEM\CurrentControlSet\Services\$($h.service)") 'DelayedAutostart'
    $service = [ordered]@{ name = $svc.Name; startName = $svc.StartName; startMode = $svc.StartMode; state = $svc.State; delayedAutoStart = ([int]$delayed -eq 1); pathName = $svc.PathName }
}

# ACLs on the governed folders: explicit and inherited allow and deny entries.
$acls = @(foreach ($p in @($settings.expected.governedPaths)) {
        if (-not (Test-Path -LiteralPath $p)) { [ordered]@{ path = $p; exists = $false; access = @() }; continue }
        $acl = Get-Acl -LiteralPath $p
        [ordered]@{ path = $p; exists = $true; owner = "$($acl.Owner)"; access = @($acl.Access | ForEach-Object {
                    [ordered]@{ identity = "$($_.IdentityReference)"; rights = "$($_.FileSystemRights)"; type = "$($_.AccessControlType)"; inherited = [bool]$_.IsInherited }
                }) }
    })

$binaries = [ordered]@{ giteaPath = $h.giteaExe; giteaSha256 = $(if (Test-Path -LiteralPath $h.giteaExe) { Get-PhFileHash -Path $h.giteaExe } else { '' }) }

$newest = @(Get-ChildItem -LiteralPath $settings.expected.backupPath -Filter $h.backupPattern -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending)[0]
$backup = [ordered]@{ path = $settings.expected.backupPath; newest = $(if ($newest) { $newest.Name } else { '' }); newestTime = $(if ($newest) { $newest.LastWriteTimeUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') } else { '' }); bytes = $(if ($newest) { $newest.Length } else { 0 }) }

# Azure Arc: azcmagent show --json, when the agent is installed.
$arc = [ordered]@{ installed = $false }
$agent = Get-Command azcmagent -ErrorAction SilentlyContinue
if ($agent) {
    $j = (& $agent.Source show --json) | Out-String | ConvertFrom-Json
    $arc = [ordered]@{ installed = $true; status = "$(Get-Value $j 'status')"; resourceName = "$(Get-Value $j 'resourceName')"; lastHeartbeat = "$(Get-Value $j 'lastHeartbeat')" }
}

$os = Get-CimInstance -ClassName Win32_OperatingSystem
$snapshot = [ordered]@{
    schema = 'fmp-ph-snapshot-windows/1'
    takenAt = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    computer = $env:COMPUTERNAME
    os = [ordered]@{ caption = $os.Caption; version = $os.Version; build = [int]$os.BuildNumber }
    edition = "Windows PowerShell $($PSVersionTable.PSVersion)"
    listeners = $listeners; firewallProfiles = $profiles; firewallRules = $rules
    tls = $tls; iis = $iis; appIni = $ini; service = $service; acls = $acls; binaries = $binaries; backup = $backup; arc = $arc
}
Write-PhJson -Path $OutputPath -Value $snapshot
"Wrote $OutputPath"
"  $($listeners.Count) listeners, $($profiles.Count) firewall profiles, $($rules.Count) allow rules in '$($h.firewallGroup)'"
"  site $($iis.site): $($rewrite.Count) rewrite rule(s), certificate $(if ($tls) { $tls.subject } else { 'none' })"
"  service $($h.service): $(if ($service) { "$($service.startName), $($service.state)" } else { 'not found' })"
"  $($acls.Count) folders, backup $(if ($newest) { $newest.Name } else { 'none' }), Arc agent $(if ($arc.installed) { $arc.status } else { 'not installed' })"
