#Requires -Version 5.1
#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Builds a lab platform host on a disposable Windows Server 2025 machine: IIS with URL Rewrite and ARR in front of
    Gitea (single-host SQLite profile), a self-signed certificate, the firewall, an organization with a pull mirror
    and a webhook, and one backup. Lab only: it changes the machine it runs on. The read-only check is
    Get-PhWindowsSnapshot.ps1, Get-PhGiteaSnapshot.ps1 and Test-PhInterfaces.ps1.
.DESCRIPTION
    Follows the guide's steps in their lab form: M-001 (folders, ACLs, firewall, TLS 1.0 and 1.1 off), M-002 (IIS,
    the extensions, Gitea as a service, the reverse proxy), M-005 (organization, teams, pull mirror), M-006 (a
    webhook and branch protection), then the nightly backup's first run. There's no domain and no tenant, so the
    directory and Entra sign-in steps (M-003, M-004) and Azure Arc (M-007) are not built; the check reports Arc
    as NotChecked. Every download is checked against manifest/release-manifest.json first.

    Writes C:\FMPLab\state\lab-admin.txt (the lab administrator's generated password) and
    C:\FMPLab\state\check-token.txt (a read:admin,read:repository token for the check), readable only by
    Administrators and SYSTEM. Throw the machine away afterwards.
.EXAMPLE
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\lab\Build-PhLabHost.ps1
#>
[CmdletBinding()]
param(
    [string]$SettingsPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'config/settings.lab.json'),
    [string]$ManifestPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'manifest/release-manifest.json'),
    [string]$Root = 'C:\FMPLab',
    [string]$UpstreamUrl = 'https://github.com/octocat/Hello-World.git'
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'powershell/PlatformHost/PlatformHost.psm1') -Force
$settings = Read-PhJson -Path $SettingsPath
$manifest = Read-PhJson -Path $ManifestPath
$hostName = $settings.expected.hostName
$site = $settings.host.site
$gitea = Join-Path $Root 'Gitea\gitea.exe'
$config = Join-Path $Root 'Gitea\custom\conf\app.ini'
function Step([string]$m) { "`n== $m" }
function Get-Pin([string]$id) { @($manifest.components | Where-Object { $_.id -eq $id })[0] }
function Get-Pinned([string]$id, [string]$dest) {
    $pin = Get-Pin $id
    Invoke-WebRequest -Uri $pin.url -OutFile $dest -UseBasicParsing
    $hash = Get-PhFileHash -Path $dest
    $sig = $null
    if ($pin.PSObject.Properties['signer']) {
        $sig = Get-AuthenticodeSignature -FilePath $dest
        if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch "O=$([regex]::Escape($pin.signer))") { throw "$($pin.name): signature $($sig.Status), signer $($sig.SignerCertificate.Subject)" }
    }
    if ($pin.sha256 -and $hash -ne $pin.sha256) { throw "$($pin.name): SHA-256 $hash isn't the pinned $($pin.sha256)" }
    $how = $(if ($pin.sha256) { 'matches the manifest' } else { 'no hash pinned yet: record it in the manifest' })
    "  $($pin.name) $($pin.version): SHA-256 $hash ($how)$(if ($sig) { "; signature $($sig.Status), $($sig.SignerCertificate.Subject.Split(',')[0])" })"
}
function Invoke-Gitea([string[]]$GiteaArgs) {
    # Run the CLI as the service does: same config, same work path.
    $out = & $gitea --config $config --work-path (Join-Path $Root 'Gitea') @GiteaArgs 2>&1
    if ($LASTEXITCODE -ne 0) { throw "gitea $($GiteaArgs -join ' ') failed: $out" }
    $out
}
function Set-PhAcl([string]$Path) {
    # Owner-only: inheritance off, Administrators and SYSTEM full control, nothing for Users.
    icacls $Path /inheritance:r /grant:r 'BUILTIN\Administrators:(OI)(CI)F' 'NT AUTHORITY\SYSTEM:(OI)(CI)F' | Out-Null
}

Step 'M-001 (lab): folders, ACLs, firewall, TLS protocols'
foreach ($d in 'Gitea\custom\conf', 'Gitea\data', 'Gitea\log', 'GitRepos', 'Backups', 'state', 'downloads', 'inetpub\FMPReverseProxy') { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }
foreach ($d in 'Gitea', 'GitRepos', 'Backups', 'state') { Set-PhAcl (Join-Path $Root $d) }
"  ${Root}: Gitea, GitRepos, Backups and state readable only by Administrators and SYSTEM"
foreach ($proto in 'TLS 1.0', 'TLS 1.1') {
    $k = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\$proto\Server"
    New-Item -Path $k -Force | Out-Null
    New-ItemProperty -Path $k -Name Enabled -Value 0 -PropertyType DWord -Force | Out-Null
}
"  TLS 1.0 and 1.1 server Enabled = 0 (Windows Server 2025 has them off already; the value makes it explicit)"
foreach ($p in @(@{ n = 'Platform host HTTPS (443)'; port = 443 }, @{ n = "Platform host Gitea SSH ($($settings.expected.giteaSshPort))"; port = [int]$settings.expected.giteaSshPort })) {
    Get-NetFirewallRule -DisplayName $p.n -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName $p.n -Group $settings.host.firewallGroup -Direction Inbound -Action Allow -Protocol TCP -LocalPort $p.port | Out-Null
}
Set-NetFirewallProfile -Profile Domain, Private, Public -Enabled True -DefaultInboundAction Block
"  Firewall: every profile on, inbound blocked by default; allow 443 and $($settings.expected.giteaSshPort)"
Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "`n127.0.0.1 $hostName"
"  hosts: $hostName -> 127.0.0.1"

Step 'M-002 (lab): IIS, URL Rewrite, ARR'
$features = 'Web-Server', 'Web-WebSockets', 'Web-Http-Logging', 'Web-Filtering', 'Web-Scripting-Tools'
$r = Install-WindowsFeature -Name $features
"  Install-WindowsFeature $($features -join ', '): $($r.ExitCode)"
Get-Pinned 'urlrewrite' (Join-Path $Root 'downloads\rewrite_amd64_en-US.msi')
Start-Process msiexec.exe -ArgumentList '/i', (Join-Path $Root 'downloads\rewrite_amd64_en-US.msi'), '/qn', '/norestart' -Wait
Get-Pinned 'arr' (Join-Path $Root 'downloads\requestRouter_amd64.msi')
Start-Process msiexec.exe -ArgumentList '/i', (Join-Path $Root 'downloads\requestRouter_amd64.msi'), '/qn', '/norestart' -Wait
"  URL Rewrite and ARR installed"

Step 'M-002 (lab): Gitea as a Windows service (SQLite profile)'
$gitPath = (Get-Command git.exe -ErrorAction SilentlyContinue).Source
if (-not $gitPath) { throw 'git.exe is not on the PATH: install Git for Windows from the manifest first.' }
"  git: $((& git --version))"
Get-Pinned 'gitea' $gitea
$secret = { param($kind) (Invoke-Gitea @('generate', 'secret', $kind) | Select-Object -Last 1).ToString().Trim() }
$ini = @"
APP_NAME = Platform host (lab)
RUN_USER = $($env:COMPUTERNAME)$
RUN_MODE = prod
WORK_PATH = $($Root -replace '\\','/')/Gitea

[server]
PROTOCOL = http
HTTP_ADDR = 127.0.0.1
HTTP_PORT = $($settings.expected.giteaHttpPort)
DOMAIN = $hostName
ROOT_URL = https://$hostName/
DISABLE_SSH = false
START_SSH_SERVER = true
SSH_DOMAIN = $hostName
SSH_PORT = $($settings.expected.giteaSshPort)
SSH_LISTEN_PORT = $($settings.expected.giteaSshPort)
LFS_START_SERVER = true
OFFLINE_MODE = true
APP_DATA_PATH = $($Root -replace '\\','/')/Gitea/data

[database]
DB_TYPE = sqlite3
PATH = $($Root -replace '\\','/')/Gitea/data/gitea.db

[repository]
ROOT = $($Root -replace '\\','/')/GitRepos

[lfs]
PATH = $($Root -replace '\\','/')/Gitea/data/lfs

[service]
DISABLE_REGISTRATION = true
REQUIRE_SIGNIN_VIEW = true

[security]
INSTALL_LOCK = true
DISABLE_GIT_HOOKS = true
SECRET_KEY = $(& $secret 'SECRET_KEY')
INTERNAL_TOKEN = $(& $secret 'INTERNAL_TOKEN')

[oauth2]
JWT_SECRET = $(& $secret 'JWT_SECRET')

[mirror]
MIN_INTERVAL = 10m

[webhook]
ALLOWED_HOST_LIST = *.fmp.lab.contoso.test

[log]
MODE = file
LEVEL = Info
ROOT_PATH = $($Root -replace '\\','/')/Gitea/log
"@
Write-PhText -Path $config -Text $ini
"  app.ini written ($((Get-Content $config).Count) lines; secrets generated by gitea generate secret)"
Invoke-Gitea @('migrate') | Out-Null
"  database created: $Root\Gitea\data\gitea.db"
sc.exe create gitea start= auto binPath= "`"$gitea`" web --config `"$config`"" | Out-Null
sc.exe config gitea start= delayed-auto | Out-Null
Start-Service gitea
$deadline = (Get-Date).AddSeconds(90)
do { Start-Sleep -Seconds 2; $ok = $false; try { $ok = (Invoke-WebRequest -Uri "http://127.0.0.1:$($settings.expected.giteaHttpPort)/api/healthz" -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200 } catch { } } until ($ok -or (Get-Date) -gt $deadline)
if (-not $ok) { throw 'Gitea did not answer /api/healthz within 90 seconds' }
"  service gitea: running as LocalSystem, delayed automatic start; /api/healthz answers 200"

Step 'M-002 (lab): the reverse proxy site'
Import-Module WebAdministration
Stop-Website -Name 'Default Web Site' -ErrorAction SilentlyContinue
Set-ItemProperty 'IIS:\Sites\Default Web Site' -Name serverAutoStart -Value $false -ErrorAction SilentlyContinue
$cert = New-SelfSignedCertificate -DnsName $hostName -CertStoreLocation Cert:\LocalMachine\My -KeyAlgorithm RSA -KeyLength 4096 -NotAfter (Get-Date).AddDays(397) -FriendlyName 'Platform host lab'
$webConfig = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.web>
    <httpRuntime requestPathInvalidCharacters="" />
  </system.web>
  <system.webServer>
    <rewrite>
      <rules useOriginalURLEncoding="false">
        <rule name="ReverseProxyToGitea" stopProcessing="true">
          <match url="(.*)" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
          </serverVariables>
          <action type="Rewrite" url="http://127.0.0.1:3000{UNENCODED_URL}" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="524288000" />
        <hiddenSegments><clear /></hiddenSegments>
        <denyUrlSequences><clear /></denyUrlSequences>
        <fileExtensions allowUnlisted="true"><clear /></fileExtensions>
      </requestFiltering>
    </security>
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
'@
$sitePath = Join-Path $Root "inetpub\$site"
Write-PhText -Path (Join-Path $sitePath 'web.config') -Text $webConfig
New-Website -Name $site -PhysicalPath $sitePath -Port 443 -Ssl -HostHeader $hostName -SslFlags 1 | Out-Null
(Get-WebBinding -Name $site -Protocol https).AddSslCertificate($cert.Thumbprint, 'My')
$pp = 'MACHINE/WEBROOT/APPHOST'
Set-WebConfigurationProperty -PSPath $pp -Filter 'system.webServer/proxy' -Name enabled -Value $true
Set-WebConfigurationProperty -PSPath $pp -Filter 'system.webServer/proxy' -Name reverseRewriteHostInResponseHeaders -Value $false
Add-WebConfigurationProperty -PSPath $pp -Filter 'system.webServer/rewrite/allowedServerVariables' -Name '.' -Value @{ name = 'HTTP_X_FORWARDED_PROTO' }
$sf = "system.applicationHost/sites/site[@name='$site']"
Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/hsts" -Name enabled -Value $true
Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/hsts" -Name max-age -Value 31536000
Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/hsts" -Name includeSubDomains -Value $true
Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/logFile" -Name period -Value Hourly
Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/logFile" -Name logExtFileFlags -Value 'Date,Time,ClientIP,UserName,ServerIP,Method,UriStem,UriQuery,HttpStatus,Win32Status,TimeTaken,ServerPort,UserAgent,HttpSubStatus,Host,BytesSent,BytesRecv'
Start-Website -Name $site
"  site $site on 443 ($hostName), certificate $($cert.Thumbprint.Substring(0,12))… RSA 4096; ARR proxy on, no host rewrite; HSTS; hourly W3C log"
$code = & curl.exe -s -k -o NUL -w '%{http_code}' "https://$hostName/api/healthz"
"  https://$hostName/api/healthz through IIS: $code"

Step 'M-005 (lab): administrator, organization, teams, pull mirror'
$adminPw = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ }) + '!a1'
Invoke-Gitea @('admin', 'user', 'create', '--username', 'lab-admin', '--password', $adminPw, '--email', 'lab-admin@fmp.lab.contoso.test', '--admin', '--must-change-password=false') | Out-Null
Write-PhText -Path (Join-Path $Root 'state\lab-admin.txt') -Text $adminPw
$buildToken = (Invoke-Gitea @('admin', 'user', 'generate-access-token', '--username', 'lab-admin', '--token-name', 'lab-build', '--scopes', 'write:admin,write:organization,write:repository', '--raw') | Select-Object -Last 1).ToString().Trim()
$checkToken = (Invoke-Gitea @('admin', 'user', 'generate-access-token', '--username', 'lab-admin', '--token-name', 'interface-check', '--scopes', 'read:admin,read:repository', '--raw') | Select-Object -Last 1).ToString().Trim()
Write-PhText -Path (Join-Path $Root 'state\check-token.txt') -Text $checkToken
"  lab-admin created; tokens lab-build (write) and interface-check (read:admin,read:repository)"
$api = "http://127.0.0.1:$($settings.expected.giteaHttpPort)/api/v1"
$hdr = @{ Authorization = "token $buildToken" }
function Invoke-Api([string]$Method, [string]$Path, $Body) { Invoke-RestMethod -Method $Method -Uri "$api$Path" -Headers $hdr -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 6) -UseBasicParsing }
Invoke-Api Post '/orgs' @{ username = 'fmp'; visibility = 'private' } | Out-Null
foreach ($t in @(@{ name = 'Stewards'; permission = 'admin' }, @{ name = 'Contributors'; permission = 'write' }, @{ name = 'Readers'; permission = 'read' })) {
    Invoke-Api Post '/orgs/fmp/teams' @{ name = $t.name; permission = $t.permission; units = @('repo.code', 'repo.pulls', 'repo.issues') } | Out-Null
}
Invoke-Api Post '/orgs/fmp/repos' @{ name = 'canon'; private = $true; auto_init = $true; default_branch = 'main' } | Out-Null
$mirror = Invoke-Api Post '/repos/migrate' @{ clone_addr = $UpstreamUrl; repo_owner = 'fmp'; repo_name = 'fmp-upstream'; service = 'git'; mirror = $true; mirror_interval = '15m0s'; private = $true }
"  organization fmp; teams Stewards, Contributors, Readers; repository fmp/canon; pull mirror fmp/fmp-upstream from $UpstreamUrl (15m)"

Step 'M-006 (lab): branch protection and a webhook'
Invoke-Api Post '/repos/fmp/canon/branch_protections' @{ rule_name = 'main'; enable_push = $false; require_signed_commits = $true; required_approvals = 1 } | Out-Null
Invoke-Api Post '/repos/fmp/canon/hooks' @{ type = 'gitea'; active = $true; events = @('push'); config = @{ url = 'https://drift.fmp.lab.contoso.test/hooks/gitea'; content_type = 'json'; secret = ([guid]::NewGuid().ToString('N')) } } | Out-Null
"  main protected (no direct push, signed commits, one approval); webhook to drift.fmp.lab.contoso.test"

Step 'Nightly backup (lab): gitea dump'
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$dump = Join-Path $Root "Backups\gitea-dump-$stamp.zip"
Stop-Service gitea
Invoke-Gitea @('dump', '--file', $dump, '--type', 'zip', '--tempdir', (Join-Path $Root 'state')) | Out-Null
Start-Service gitea
do { Start-Sleep -Seconds 2; $ok = $false; try { $ok = (Invoke-WebRequest -Uri "http://127.0.0.1:$($settings.expected.giteaHttpPort)/api/healthz" -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200 } catch { } } until ($ok)
"  $(Split-Path -Leaf $dump): $([math]::Round((Get-Item $dump).Length / 1KB)) KB; Gitea stopped for the dump and started again"
"`nLab host built: https://$hostName (Gitea $((Get-Pin 'gitea').version), SQLite). Throw the machine away when you're done."
