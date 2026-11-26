---
title: "The Platform Host: An Implementation Guide"
description: "An implementation guide for building the program's one governed server, Gitea behind IIS on Windows Server 2025, and proving its interfaces. The PowerShell-first runbook that Book 01, Chapter 03 calls for: the access request, the release manifest, one step per build milestone (M-001 to M-007), the nightly backup and cold restore, a short note on the optional hot standby, and a read-only interface check that tests the host against Book 10, Appendix B's closed list of interfaces and records each run as evidence. The steps a disposable lab can prove were run on Windows Server 2025, and the guide shows their real output."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 00"
review-status: pending
---
# The Platform Host: An Implementation Guide

*A host that holds the program's source of truth should be built from a list and checked against the same list.*

::: {.callout-note}
## In this guide
How an agency on Microsoft 365 GCC (Moderate) builds the program's platform host, Gitea behind IIS on one Windows Server 2025 machine, and keeps proving that the host talks only to what it should. First, how to read the guide, where each part of the host is already described, what the lab could and couldn't prove, and the prerequisites as one access request and one release manifest. Then one step per build milestone, M-001 to M-007, followed by the nightly backup and the cold restore, a short note on the optional hot standby, and the read-only interface check with its evidence. Then the federal requirements and KSIs, the RACI, the dangers, the implementation checklist and what couldn't be verified.
:::

::: {.callout-tip}
## Code, labs and training
**Code:** the kit [`examples/platform-host`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/platform-host) holds the read-only interface check (two collectors and the check, PH-01 to PH-12), the settings files, the release manifest, the evidence records and a script that builds a disposable lab host. The `Platform host lab` workflow builds that lab host on a fresh Windows Server 2025 machine and runs the check against it; every output block in this guide marked *lab output* comes from that run.
**Labs, a learning path and a narrated deck** for this guide aren't written yet. The [Platform Host topic](../../topics/platform-host.md) lists them as needed.
:::

## How to read this guide {#how-to-read}

**Where this guide sits.** The host is already described in three places, and this guide doesn't repeat them. [Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md) explains why the program has one governed server and what it does; it says the build procedures belong in a separate PowerShell-first runbook, which is this guide. [Book 00, Chapter 08](../b00-orientation/08-pre-flight-and-assessment.md#seven-build-milestones) sets the seven build milestones, M-001 to M-007, with their owners and gate criteria; the steps below follow them one for one. [Book 10, Appendix B](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md) lists every interface the finished host has, in six families (A to F), with illustrative configuration; the steps link to its sections instead of copying them. The two decisions behind the design are WD-177 (the reference design) and WD-178 (the standby model) in the [decision register](../../about/decision-register.md#wd-177).

**What this guide adds.** The commands for each milestone, in order; the federal requirement and KSI each step supports and the evidence it leaves; and the read-only interface check that Appendix B's conformance adapter (D.4) describes, built as a kit and run against a real Windows Server 2025 host.

**Which shell.** The workbook keeps Windows PowerShell 5.1 for on-premises administration and PowerShell 7 for cloud and API work. On this host that means Windows PowerShell 5.1 for the Windows feature, IIS, firewall, service and Active Directory steps, and PowerShell 7.6 for Gitea's REST API, Microsoft Graph and Azure. Each command block names its shell. PowerShell 7.6 is the current Long-Term Servicing release, supported to November 14, 2028; 7.4 and 7.5 reached end of support on November 10, 2026.[^phg-pslife]

**Where the facts come from.** Product facts were read on Microsoft Learn, in Gitea's documentation and in Gitea's source at the release the manifest pins, on November 26, 2026, with the date in each note. Facts Appendix B already verified are cited by link to its section. The [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/platform-host-implementation.md) lists each claim and its source. Where a source is silent the guide says *not yet specified* and lists it under [What couldn't be verified](#what-couldnt-be-verified). The program's own positions are labeled *Design guidance*.

**The starting state the guide assumes.** A civilian agency at FedRAMP Moderate on Microsoft 365 GCC (Moderate), whose Entra ID tenant runs in Azure public;[^phg-gcc-entra] an Active Directory forest with an enterprise certification authority; a privileged access workstation path for Tier 0 administration ([Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md)); the managed service account standard (WD-159 and WD-173 to WD-176) in use; and the egress allowlist owned by the proxy and firewall team. Names use the fictional `contoso`.

### What the lab proved, and what it couldn't {#what-the-lab-proved}

The kit's lab runs on a GitHub-hosted runner, a fresh Windows Server 2025 Datacenter machine that is thrown away after each run. It builds the host's single-host profile (SQLite, no database server) from the pinned manifest, runs the interface check in both shells, smoke-tests a clone and a push through IIS, then opens a second listener on purpose and shows the check finding it.

```text
PowerShell 7: 7.6.10
Windows PowerShell: 5.1.26100.33822
Microsoft Windows Server 2025 Datacenter 10.0.26100
git version 2.56.1.windows.1
```

The runner has no domain and no Entra tenant. So the lab runs Gitea as Local System with a self-signed certificate, and it can't run M-003 (directory sign-in), M-004 (Entra sign-in) or M-007 (Azure Arc), the gMSA steps, or the PostgreSQL profile. Those steps are written from Learn and Gitea's documentation and marked *not run in the lab*.

## The host at a glance {#at-a-glance}

| Part | Value | Where it's described |
|---|---|---|
| Server | Windows Server 2025 Standard, 4 vCPU, 8 GB RAM, 100 GB SSD, domain-joined in its own OU | [Book 00, Chapter 08](../b00-orientation/08-pre-flight-and-assessment.md#seven-build-milestones), M-001 |
| Front door | IIS site `FMPReverseProxy` on 443 with URL Rewrite and ARR; one rule to `http://127.0.0.1:3000` | [Appendix B, A.1](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#a.1-https-git-over-smart-http-tcp-443) |
| Gitea | Windows service `gitea`, bound to loopback, its own SSH server on 2222 | [Appendix B, A.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#a.2-ssh-git-transport-tcp-2222), [E.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#e.2-gitea-cli-and-the-service) |
| Service account | gMSA `CORP\gmsa-fmpgitea$`, retriever group `DL-gMSA-fmpgitea-Hosts` | [Appendix B, B.4](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#b.4-the-hosts-own-identities); WD-159, WD-173 |
| Database | PostgreSQL `fmp_gitea` (full production) or embedded SQLite (single host) | [Appendix B, F.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#f.2-database-postgresql-or-embedded-sqlite) |
| Sign-in | Active Directory over LDAPS, Entra ID over OpenID Connect | [Appendix B, B.1, B.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#family-b-identity-and-authentication) |
| Cloud management | Azure Arc, machine configuration, Azure Monitor Agent, Blob backup, in commercial Azure as a documented exception | [Appendix B, family C](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#family-c-cloud-management-plane) |
| Recovery | Cold standby by default: 24-hour recovery point, 4-hour recovery time | WD-178 |

## GCC Moderate fit {#gcc-fit}

The host itself is on premises, inside the agency's own authorization boundary, so it isn't a cloud service with a GCC listing. Two of its planes reach Microsoft's clouds. Entra ID sign-in uses the tenant the agency's Microsoft 365 GCC (Moderate) subscription is paired with, which runs in Azure public.[^phg-gcc-entra] Azure Arc, Azure Monitor and Blob storage run in commercial Azure, which the program records as a documented exception with a risk acceptance ([Book 10, Chapter 09](../b10-cloud-boundary/09-equivalents-and-exceptions.md); [Appendix B, family C](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#family-c-cloud-management-plane)). The host reports no Intune compliance, because Intune doesn't support Windows Server ([Appendix B, C.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#c.2-azure-policy-and-machine-configuration)).

## Prerequisites: the access request {#prerequisites}

**Owner:** the infrastructure lead, who submits it with the change record. **Authority:** *Design guidance*, built on the sources in each row's note.

The build needs the items below. They are the same ones the steps name, collected so the request goes in once.

| # | Item | From | For | Step |
|---|---|---|---|---|
| 1 | A virtual machine or server at Book 00's size, Windows Server 2025 Standard, and a computer object in the host's own OU | Infrastructure | The host | M-001 |
| 2 | The gMSA `gmsa-fmpgitea`, requested through SailPoint and created by the pipeline, with the host in `DL-gMSA-fmpgitea-Hosts` | Identity (the managed service account standard, WD-159, WD-173, WD-174) | The Gitea service, the backup task and the check | M-001 |
| 3 | A TLS certificate for `git.fmp.corp.contoso.com` from the enterprise CA, RSA 4096, renewed by the certificate lifecycle platform | PKI ([Book 07](../b07-pki/index.md); [Appendix B, certificates](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#certificates-and-the-clm-platform)) | 443 | M-002 |
| 4 | The runtime egress allowlist and the host's proxy | Proxy and firewall team ([Appendix B, runtime egress allowlist](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#runtime-egress-allowlist)) | Mirror, Arc, Monitor, Graph | Before M-001 |
| 5 | The PostgreSQL database `fmp_gitea` and its account (full-production profile only) | Database team | Gitea's metadata | M-002 |
| 6 | A read-only LDAP bind account and LDAPS on the domain controllers | Identity | Directory sign-in | M-003 |
| 7 | An Entra app registration for Gitea, its groups claim, and a Conditional Access policy requiring MFA for it | Identity (Application Administrator; Conditional Access Administrator) | Entra sign-in | M-004 |
| 8 | The upstream repository URL and the stewards, contributors and readers groups | Program steward | The organization and the mirror | M-005 |
| 9 | The hook bodies, signed with the program's code-signing certificate | Program steward, CISO's CA ([Appendix B, D.1](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#d.1-server-side-git-hooks)) | Governance hooks | M-006 |
| 10 | An Arc onboarding service principal with the Azure Connected Machine Onboarding role on `rg-fmp-governance`, and Book 05's tag values | Platform engineering | Azure Arc | M-007 |
| 11 | The storage account `stfmpgovernance`, container `gitea-backups`, with a role assignment for the host's Arc managed identity | Platform engineering | Backup | Backup |

## The release manifest {#release-manifest}

**Owner:** the infrastructure lead. **Authority:** *Design guidance* ([Appendix B, F.3](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#f.3-build-time-supply-chain)).

Every binary the build downloads is pinned to a URL and a SHA-256 in the kit's [`manifest/release-manifest.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/platform-host/manifest/release-manifest.json). The manifest is the upgrade's change record: a new version means a new manifest, reviewed like any other change.

| Component | Version | Where the hash comes from |
|---|---|---|
| Gitea (`gitea-28.4.0-windows-amd64.exe`) | 28.4.0, released November 15, 2026 | The `.sha256` file Gitea publishes with the release[^phg-gitea-release] |
| Git for Windows (Gitea needs `git.exe` on the PATH) | 2.56.1, released November 10, 2026 | The release notes[^phg-git-release] |
| IIS URL Rewrite 2.1 (x64) | 2.1 | Microsoft publishes no hash; recorded from the lab's download after a valid Microsoft Authenticode signature[^phg-urlrewrite] |
| IIS Application Request Routing 3.0 (x64) | 3.0 | As URL Rewrite[^phg-arr] |

Before installing anything, check the download against the manifest. In Windows PowerShell 5.1 on the host:

```powershell
$f = 'D:\Downloads\gitea-28.4.0-windows-amd64.exe'
(Get-FileHash -Algorithm SHA256 -LiteralPath $f).Hash.ToLower()
Get-AuthenticodeSignature -FilePath 'D:\Downloads\rewrite_amd64_en-US.msi' | Select-Object Status, @{n='Signer';e={$_.SignerCertificate.Subject}}
```

The first line prints the hash to compare with the manifest; the second prints `Valid` and the signer for a signed installer.[^phg-authenticode] The lab build refuses a file whose hash or signer differs (*lab output*, the download lines):

```text
  IIS URL Rewrite 2.1 (x64) 2.1: SHA-256 37342ff2f585f263f34f48e9de59eb1051d61015a8e967dbde4075716230a32a (matches the manifest); signature Valid, CN=Microsoft Corporation
  IIS Application Request Routing 3.0 (x64) 3.0: SHA-256 fb61fdb7101795a34d5129cb37eee43ab675c7ed76ba3a3b23b039d8c90c2a4b (matches the manifest); signature Valid, CN=Microsoft Corporation
  Gitea 28.4.0: SHA-256 f67cfc9179dbcf43d730622df5006ee2fa64f626422c734cea89af50f7ad7cc3 (matches the manifest)
```

An agency with an internal artifact mirror substitutes its own URLs and keeps the hashes.

## Step 1 (M-001): Provision and harden the server {#step-1}

**Owner:** infrastructure lead. **Authority:** *Microsoft-documented* for the commands; *Design guidance* for the paths, ACLs and ports.

1. **Provision.** A VM or server at Book 00's size. Windows Server 2025 needs a 1.4 GHz 64-bit processor with SSE4.2 and POPCNT, 2 GB of RAM and 32 GB of disk at minimum;[^phg-hw] Book 00's size leaves room for the repositories, the LFS store and a day of backups.
2. **Join the domain, in the host's own OU.** In Windows PowerShell 5.1, as a local administrator, with a credential that may join computers to that OU:[^phg-addcomputer]

   ```powershell
   Add-Computer -DomainName corp.contoso.com -OUPath 'OU=PlatformHost,OU=Tier0,DC=corp,DC=contoso,DC=com' -NewName FMP-GIT01 -Credential (Get-Credential) -Restart
   ```

3. **Apply the hardening baseline and patch.** The agency's Windows Server 2025 baseline by Group Policy, then current updates. The audit categories the Azure Monitor Agent forwards later (logon and logoff, object access, privilege use, system, account management, policy change) are set here ([Appendix B, C.3](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#c.3-azure-monitor-agent)).
4. **Install and test the gMSA.** The pipeline creates `gmsa-fmpgitea` with the host in its retriever group (WD-173); the host only installs and tests it, with the Active Directory module from the Remote Server Administration Tools. Learn's RSAT page lists the tools with `Get-WindowsFeature -Name RSAT*` and installs the AD tools as `RSAT-AD-Tools`;[^phg-rsat][^phg-gmsa]

   ```powershell
   Get-WindowsFeature -Name RSAT-AD*
   Install-WindowsFeature -Name RSAT-AD-Tools -IncludeAllSubFeature
   Install-ADServiceAccount -Identity 'gmsa-fmpgitea$'
   Test-ADServiceAccount -Identity 'gmsa-fmpgitea$'
   ```

   `Test-ADServiceAccount` prints `True` when the host can retrieve the password. *Not run in the lab* (no domain).
5. **Create the folders, owned by the gMSA and nobody broad.** Inheritance off; Administrators and SYSTEM full control; the gMSA Modify:

   ```powershell
   foreach ($p in 'D:\Gitea', 'D:\Gitea\custom\conf', 'D:\Gitea\data', 'D:\Gitea\log', 'D:\GitRepos', 'E:\Backups\Staging') { New-Item -ItemType Directory -Force -Path $p | Out-Null }
   foreach ($p in 'D:\Gitea', 'D:\GitRepos', 'E:\Backups\Staging') {
       icacls $p /inheritance:r /grant:r 'BUILTIN\Administrators:(OI)(CI)F' 'NT AUTHORITY\SYSTEM:(OI)(CI)F' 'CORP\gmsa-fmpgitea$:(OI)(CI)M'
   }
   ```

6. **TLS 1.0 and 1.1 off, explicitly.** Windows Server 2025 has them off by default; the `Enabled` value of 0 makes the setting visible to the check and to an assessor:[^phg-tls]

   ```powershell
   foreach ($proto in 'TLS 1.0', 'TLS 1.1') {
       $k = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\$proto\Server"
       New-Item -Path $k -Force | Out-Null
       New-ItemProperty -Path $k -Name Enabled -Value 0 -PropertyType DWord -Force | Out-Null
   }
   ```

7. **The firewall: two published ports, everything else blocked.** WinRM over HTTPS on 5986 from the Tier 0 admin subnet only ([Appendix B, inbound posture](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#inbound-posture)):

   ```powershell
   New-NetFirewallRule -DisplayName 'Platform host HTTPS (443)' -Group 'Platform host' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -RemoteAddress Intranet
   New-NetFirewallRule -DisplayName 'Platform host Gitea SSH (2222)' -Group 'Platform host' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 2222 -RemoteAddress Intranet
   New-NetFirewallRule -DisplayName 'Platform host WinRM HTTPS (5986)' -Group 'Platform host' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5986 -RemoteAddress 10.1.20.0/24
   Set-NetFirewallProfile -Profile Domain, Private, Public -Enabled True -DefaultInboundAction Block
   ```

8. **The proxy, at machine scope,** so Git and PowerShell use the same one (the Arc agent gets its own setting in Step 7, which Learn prefers for it):[^phg-envvar][^phg-arc-proxy]

   ```powershell
   [Environment]::SetEnvironmentVariable('HTTPS_PROXY', 'http://proxy.corp.contoso.com:8080', 'Machine')
   [Environment]::SetEnvironmentVariable('NO_PROXY', 'localhost,127.0.0.1,.corp.contoso.com', 'Machine')
   ```

The lab ran items 5 to 7 in their lab form (*lab output*):

```text
== M-001 (lab): folders, ACLs, firewall, TLS protocols
  C:\FMPLab: Gitea, GitRepos, Backups and state readable only by Administrators and SYSTEM
  TLS 1.0 and 1.1 server Enabled = 0 (Windows Server 2025 has them off already; the value makes it explicit)
  Firewall: every profile on, inbound blocked by default; allow 443 and 2222
  OpenSSH Server (sshd) was running: stopped and disabled, so nothing answers on 22
  hosts: git.fmp.lab.contoso.test -> 127.0.0.1
```

**Validate.** The host is online, domain-joined, hardened and current (Book 00's gate). The interface check's PH-02 (firewall), PH-03 (TLS protocols) and PH-08 (folder ACLs) pass once Step 2 has put Gitea and IIS on top.

## Step 2 (M-002): IIS, Gitea and the reverse proxy {#step-2}

**Owner:** infrastructure lead. **Authority:** *Microsoft-documented* and *Gitea-documented* for the commands; *Design guidance* for the values ([Appendix B, A.1, A.2, E.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#family-a-client-and-operator-transport)).

1. **IIS, with the WebSocket Protocol.** Gitea's real-time updates use a WebSocket, which ARR can proxy only when the WebSocket Protocol role service is installed.[^phg-gitea-proxy] In Windows PowerShell 5.1:[^phg-features]

   ```powershell
   Install-WindowsFeature -Name Web-Server, Web-WebSockets, Web-Http-Logging, Web-Filtering, Web-Scripting-Tools
   ```

   On Desktop Experience, add `Web-Mgmt-Console` for IIS Manager; it isn't available on Server Core.[^phg-features]
2. **URL Rewrite, then ARR,** from the manifest, after the hash and signature check above. ARR needs URL Rewrite installed first.[^phg-arr]

   ```powershell
   Start-Process msiexec.exe -ArgumentList '/i', 'D:\Downloads\rewrite_amd64_en-US.msi', '/qn', '/norestart' -Wait
   Start-Process msiexec.exe -ArgumentList '/i', 'D:\Downloads\requestRouter_amd64.msi', '/qn', '/norestart' -Wait
   ```

3. **Git for Windows** from the manifest, so `git.exe` is on the PATH for Gitea.
4. **Gitea's configuration.** Copy `gitea.exe` to `D:\Gitea`, generate the three secrets with `gitea generate secret` (`SECRET_KEY`, `INTERNAL_TOKEN`, `JWT_SECRET`),[^phg-gitea-cli] and write `D:\Gitea\custom\conf\app.ini` with Appendix B's values ([A.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#a.2-ssh-git-transport-tcp-2222)): `HTTP_ADDR = 127.0.0.1`, `HTTP_PORT = 3000`, `START_SSH_SERVER = true` on 2222, `DISABLE_REGISTRATION = true`, `REQUIRE_SIGNIN_VIEW = true`, `INSTALL_LOCK = true`, `DISABLE_GIT_HOOKS = true`, and `RUN_USER = gmsa-fmpgitea$`. The `[database]` section names PostgreSQL in full production, or `DB_TYPE = sqlite3` with an absolute `PATH` in the single-host profile, as Gitea recommends for a Windows service.[^phg-gitea-winsvc] The lab's `Build-PhLabHost.ps1` writes the whole file and is the worked example. `app.ini` holds the secrets and, in full production, the database password, so the folder's ACL from Step 1 is what protects them.
5. **Create the database schema, then register the service under the gMSA.** Gitea's Windows guidance registers the service with `sc.exe` and suggests a delayed start on a loaded system.[^phg-gitea-winsvc]

   ```powershell
   & D:\Gitea\gitea.exe --config D:\Gitea\custom\conf\app.ini --work-path D:\Gitea migrate
   sc.exe create gitea start= auto binPath= '"D:\Gitea\gitea.exe" web --config "D:\Gitea\custom\conf\app.ini"'
   sc.exe config gitea start= delayed-auto
   sc.exe config gitea obj= 'CORP\gmsa-fmpgitea$' password= ''
   Start-Service gitea
   ```

   Learn supports running a service as a gMSA through the Service Control Manager; the empty `password=` for a gMSA isn't on Learn, and the lab couldn't test it (no domain).[^phg-gmsa][^phg-sc] The lab ran the service as Local System, Gitea's default, with `RUN_USER` set to the computer name followed by `$` as Gitea's guidance says for that account.[^phg-gitea-winsvc] Gitea doesn't check `RUN_USER` against the running account on Windows, so nothing but the interface check (PH-07) notices if the two disagree.[^phg-gitea-runuser]
6. **The reverse proxy site.** Stop the Default Web Site, so nothing answers on 80; create `FMPReverseProxy` on 443 with the enterprise certificate (SNI), and put Gitea's IIS settings in its `web.config`: one catch-all, stop-processing rule to `http://127.0.0.1:3000{UNENCODED_URL}`, `useOriginalURLEncoding="false"` on the rules, `requestPathInvalidCharacters=""`, cleared request-filtering lists, and the request size from Appendix B.[^phg-gitea-proxy] The lab script's `web.config` is the worked example. Then, at server level, turn on ARR's proxy and turn off its reverse rewrite of the host in response headers (Gitea's documentation asks for both, in ARR's Server Proxy Settings; the configuration attributes below are the ones IIS writes for those boxes, read back in the lab), and set HSTS and an hourly W3C log on the site:[^phg-hsts][^phg-logfile]

   ```powershell
   Import-Module WebAdministration
   Stop-Website -Name 'Default Web Site'
   Set-ItemProperty 'IIS:\Sites\Default Web Site' -Name serverAutoStart -Value $false
   New-Website -Name FMPReverseProxy -PhysicalPath D:\inetpub\FMPReverseProxy -Port 443 -Ssl -HostHeader git.fmp.corp.contoso.com -SslFlags 1
   (Get-WebBinding -Name FMPReverseProxy -Protocol https).AddSslCertificate('<certificate thumbprint>', 'My')
   $pp = 'MACHINE/WEBROOT/APPHOST'
   Set-WebConfigurationProperty -PSPath $pp -Filter 'system.webServer/proxy' -Name enabled -Value $true
   Set-WebConfigurationProperty -PSPath $pp -Filter 'system.webServer/proxy' -Name reverseRewriteHostInResponseHeaders -Value $false
   Add-WebConfigurationProperty -PSPath $pp -Filter 'system.webServer/rewrite/allowedServerVariables' -Name '.' -Value @{ name = 'HTTP_X_FORWARDED_PROTO' }
   $sf = "system.applicationHost/sites/site[@name='FMPReverseProxy']"
   Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/hsts" -Name enabled -Value $true
   Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/hsts" -Name max-age -Value 31536000
   Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/hsts" -Name includeSubDomains -Value $true
   Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/logFile" -Name period -Value Hourly
   Set-WebConfigurationProperty -PSPath $pp -Filter "$sf/logFile" -Name logExtFileFlags -Value 'Date,Time,ClientIP,UserName,ServerIP,Method,UriStem,UriQuery,HttpStatus,Win32Status,TimeTaken,ServerPort,UserAgent,HttpSubStatus,Host,BytesSent,BytesRecv'
   ```

   Hourly rollover is what the Azure Monitor Agent needs to send the log more than once a day ([Appendix B, C.3](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#c.3-azure-monitor-agent)). `Host`, `BytesSent` and `BytesRecv` aren't in IIS's default field list.[^phg-logfile]

The lab built the same in its lab form (*lab output*):

```text
== M-002 (lab): IIS, URL Rewrite, ARR
  Install-WindowsFeature Web-Server, Web-WebSockets, Web-Http-Logging, Web-Filtering, Web-Scripting-Tools: Success
  IIS URL Rewrite 2.1 (x64) 2.1: SHA-256 37342ff2f585f263f34f48e9de59eb1051d61015a8e967dbde4075716230a32a (matches the manifest); signature Valid, CN=Microsoft Corporation
  IIS Application Request Routing 3.0 (x64) 3.0: SHA-256 fb61fdb7101795a34d5129cb37eee43ab675c7ed76ba3a3b23b039d8c90c2a4b (matches the manifest); signature Valid, CN=Microsoft Corporation
  URL Rewrite and ARR installed
== M-002 (lab): Gitea as a Windows service (SQLite profile)
  git: git version 2.56.1.windows.1
  Gitea 28.4.0: SHA-256 f67cfc9179dbcf43d730622df5006ee2fa64f626422c734cea89af50f7ad7cc3 (matches the manifest)
  app.ini written (53 lines; secrets generated by gitea generate secret)
  database created: C:\FMPLab\Gitea\data\gitea.db
Waiting for service 'gitea (gitea)' to start...
Waiting for service 'gitea (gitea)' to start...
Waiting for service 'gitea (gitea)' to start...
  service gitea: running as LocalSystem, delayed automatic start; /api/healthz answers 200
== M-002 (lab): the reverse proxy site
  site FMPReverseProxy on 443 (git.fmp.lab.contoso.test), certificate 80FAFE3ED3DF... RSA 4096; ARR proxy on, no host rewrite; HSTS; hourly W3C log
  https://git.fmp.lab.contoso.test/api/healthz through IIS: 200
```

**Validate.** Book 00's gate: clone, push and pull over HTTPS from a workstation. The lab's smoke test clones through IIS, pushes a branch, is refused a direct push to the protected `main` (Step 6), and reads Gitea's SSH host key on 2222 (*lab output*; the TLS warning is the lab's self-signed certificate):

```text
Cloning into 'canon'...
warning: ----------------- SECURITY WARNING ----------------
warning: | TLS certificate verification has been disabled! |
warning: ---------------------------------------------------
warning: HTTPS connections may not be secure. See https://aka.ms/gcm/tlsverify for more information.
Switched to a new branch 'feature/smoke-test'
[feature/smoke-test 618d7b6] Smoke test through IIS
remote:
remote: Create a new pull request for 'feature/smoke-test':
remote:   https://git.fmp.lab.contoso.test/fmp/canon/pulls/new/feature/smoke-test
remote:
To https://git.fmp.lab.contoso.test/fmp/canon.git
 * [new branch]      feature/smoke-test -> feature/smoke-test
main is protected: a direct push is refused
[main 1196897] Direct push to main
remote:
remote: error:
remote: error: Internal Server Error (no message for end users)
remote: error:
To https://git.fmp.lab.contoso.test/fmp/canon.git
 ! [remote rejected] main -> main (pre-receive hook declined)
error: failed to push some refs to 'https://git.fmp.lab.contoso.test/fmp/canon.git'
SSH host key on 2222:
[git.fmp.lab.contoso.test]:2222 ssh-rsa
[git.fmp.lab.contoso.test]:2222 ssh-ed25519
```

The refusal reaches the client as "Internal Server Error (no message for end users)". Gitea's own log on the host says why: `main` requires signed commits and the smoke test's commit isn't signed (*lab output*, the matching lines of `gitea.log`):

```text
2026/11/26 05:52:58 .../hook_verification.go:42:verifyCommits() [E] Unable to check commits from 20db0586f1b66d91ffa5bb22f581c7b911804d03 to 11968973faaaa4b467207f23e517259f96484c1a in <Repository 1:fmp/canon>: Unverified commit: 11968973faaaa4b467207f23e517259f96484c1a
2026/11/26 05:52:58 .../private/hook_pre_receive.go:180:preReceiveBranch() [E] Internal error: Unable to check commits from 20db0586f1b66d91ffa5bb22f581c7b911804d03 to 11968973faaaa4b467207f23e517259f96484c1a: Unverified commit: 11968973faaaa4b467207f23e517259f96484c1a
2026/11/26 05:52:58 HTTPRequest [I] router: completed POST /api/internal/hook/pre-receive/fmp/canon for 127.0.0.1:0, 500 Internal Server Error in 205.0ms @ private/hook_pre_receive.go:76(private.HookPreReceive)
```

So a contributor refused for an unsigned commit sees a server error, not the reason. Tell contributors to sign before their first push, and read Gitea's log, not the client's message, when a push to a protected branch fails.

## Step 3 (M-003): Directory sign-in over LDAPS {#step-3}

**Owner:** identity lead. **Authority:** *Gitea-documented* for the commands; *Design guidance* for the values. *Not run in the lab* (no domain).

1. **The bind account.** A read-only account that can search the governed Users OU and nothing else. Gitea binds with a distinguished name and a password, so this one stays a user account kept under the managed service account standard's rules for accounts that can't be converted (WD-159).
2. **Register the source with the Gitea CLI,** under the service identity, as [Appendix B, B.1](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#b.1-active-directory-over-ldaps-outbound-tcp-636) shows (`gitea admin auth add-ldap`, LDAPS on 636, the stewards group as the admin filter, `--synchronize-users`). There's no REST endpoint for authentication sources.[^phg-gitea-cli] Passing the bind password on the command line exposes it to anyone who can read process arguments, so run it once, from the signed runbook.
3. **List what was registered:**

   ```powershell
   & D:\Gitea\gitea.exe --config D:\Gitea\custom\conf\app.ini --work-path D:\Gitea admin auth list
   ```

**Validate.** Book 00's gate: an administrator, a contributor and a read-only account each sign in, and the stewards group holds the administrator role.

## Step 4 (M-004): Entra ID sign-in over OpenID Connect {#step-4}

**Owner:** identity lead. **Authority:** *Microsoft-documented* for the app registration; *Gitea-documented* for the source. *Not run in the lab* (no tenant).

1. **Register the application** in the agency's tenant, single-tenant, with Gitea's callback as the redirect URI and the groups claim limited to the groups assigned to the application, which Microsoft recommends for large organizations ([Appendix B, B.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#b.2-entra-id-over-openid-connect)). In PowerShell 7.6, signed in as a Cloud Application Administrator (or an Application Developer, for an application they own) with the `Application.ReadWrite.All` scope; `ApplicationGroup` is the value that sends only the groups assigned to the application:[^phg-newmgapp][^phg-manifest]

   ```powershell
   Connect-MgGraph -Scopes 'Application.ReadWrite.All' -NoWelcome
   $app = New-MgApplication -DisplayName 'Platform host (Gitea)' -SignInAudience AzureADMyOrg `
       -Web @{ RedirectUris = @('https://git.fmp.corp.contoso.com/user/oauth2/EntraID/callback') } `
       -GroupMembershipClaims ApplicationGroup
   $sp = New-MgServicePrincipal -AppId $app.AppId -AppRoleAssignmentRequired
   $cred = Add-MgApplicationPassword -ApplicationId $app.Id -BodyParameter @{ passwordCredential = @{ displayName = 'gitea-oidc'; endDateTime = (Get-Date).AddDays(180) } }
   Set-Secret -Name 'fmp-gitea-oidc' -Secret $cred.SecretText
   $app.AppId
   ```

   `-AppRoleAssignmentRequired` sets the service principal's `appRoleAssignmentRequired`, so only users and groups assigned to the application can sign in to it; assign the stewards, contributors and readers groups. The secret's text is returned once, so it goes straight to the secret store.[^phg-addpassword]
2. **Register the source** with `gitea admin auth add-oauth`, keyed by the groups' object IDs, as Appendix B, B.2 shows; its four cautions (groups isn't a scope, object IDs, overage, mapping only at sign-in) hold here.
3. **Require MFA** for the application with a Conditional Access policy, from the program's policy set in [Book 04](../b04-access/index.md): Learn's "Require MFA for all users" policy, with its target resources narrowed to this application.[^phg-ca]

**Validate.** Book 00's gate: Entra sign-in works, the MFA prompt appears, and an existing directory account links to the Entra identity.

## Step 5 (M-005): Organization, teams and the upstream mirror {#step-5}

**Owner:** program steward. **Authority:** *Gitea-documented* for the API; *Design guidance* for the names.

Through Gitea's REST API with a token that has `write:organization` and `write:repository`, in PowerShell 7.6 ([Appendix B, A.4, F.1](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#f.1-github-upstream-pull-mirror)):

```powershell
$base = 'https://git.fmp.corp.contoso.com/api/v1'
$h = @{ Authorization = "token $(Get-Secret -Name 'fmp-gitea-admin-pat' -AsPlainText)" }
Invoke-RestMethod -Method Post -Uri "$base/orgs" -Headers $h -ContentType 'application/json' -Body (@{ username = 'fmp'; visibility = 'private' } | ConvertTo-Json)
foreach ($t in @(@{ name = 'Stewards'; permission = 'admin' }, @{ name = 'Contributors'; permission = 'write' }, @{ name = 'Readers'; permission = 'read' })) {
    Invoke-RestMethod -Method Post -Uri "$base/orgs/fmp/teams" -Headers $h -ContentType 'application/json' -Body (@{ name = $t.name; permission = $t.permission; units = @('repo.code', 'repo.pulls', 'repo.issues') } | ConvertTo-Json)
}
Invoke-RestMethod -Method Post -Uri "$base/repos/migrate" -Headers $h -ContentType 'application/json' -Body (@{ clone_addr = 'https://github.com/example-org/fmp.git'; repo_owner = 'fmp'; repo_name = 'fmp-upstream'; service = 'git'; mirror = $true; mirror_interval = '15m0s'; private = $true } | ConvertTo-Json)
```

The mirror is a quarantine copy: its syncs never pass through the receive hooks, so canon moves into the authoritative repository only by a push or merged pull request from it ([Appendix B, F.1](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#f.1-github-upstream-pull-mirror)). The lab mirrored a small public repository the same way (*lab output*):

```text
== M-005 (lab): administrator, organization, teams, pull mirror
  lab-admin created; tokens lab-build (write) and interface-check (read:admin,read:repository)
  organization fmp; teams Stewards, Contributors, Readers; repository fmp/canon; pull mirror fmp/fmp-upstream from https://github.com/octocat/Hello-World.git (15m)
```

**Validate.** Book 00's gate: all branches, tags and history match the upstream. The interface check's PH-10 then watches the mirror's last sync against the 24-hour threshold.

## Step 6 (M-006): Governance hooks, branch protection and webhooks {#step-6}

**Owner:** program steward. **Authority:** *Gitea-documented* for branch protection and webhooks; *Design guidance* for the hook rules.

1. **Branch protection first.** Gitea's protected branches carry most of [Appendix B, D.1](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#d.1-server-side-git-hooks)'s rules natively (who may push, required approvals, required status checks, signed commits). In PowerShell 7.6, with the token from Step 5:

   ```powershell
   Invoke-RestMethod -Method Post -Uri "$base/repos/fmp/canon/branch_protections" -Headers $h -ContentType 'application/json' -Body (@{ rule_name = 'main'; enable_push = $false; require_signed_commits = $true; required_approvals = 1 } | ConvertTo-Json)
   ```

2. **The hook bodies,** signed, deployed to each bare repository's `hooks` folder by the signed build, only for the rules Gitea can't express (marking checks, front matter, path-based signing). `DISABLE_GIT_HOOKS = true` stays: hooks aren't edited in the browser.
3. **Webhooks, each with a secret,** to the receivers on the settings file's list only (the drift engine, the documentation build):

   ```powershell
   $secret = Get-Secret -Name 'fmp-webhook-drift' -AsPlainText
   Invoke-RestMethod -Method Post -Uri "$base/repos/fmp/canon/hooks" -Headers $h -ContentType 'application/json' -Body (@{ type = 'gitea'; active = $true; events = @('push'); config = @{ url = 'https://drift.fmp.corp.contoso.com/hooks/gitea'; content_type = 'json'; secret = $secret } } | ConvertTo-Json -Depth 4)
   ```

   Gitea sends `X-Gitea-Signature`, the hex HMAC-SHA256 of the raw body keyed with that secret.[^phg-webhooks] A receiver checks it before acting; the kit's module has the check:

   ```powershell
   Import-Module .\powershell\PlatformHost\PlatformHost.psm1
   Test-PhWebhookSignature -Body $rawBody -Secret $secret -Signature $request.Headers['X-Gitea-Signature']
   ```

   Gitea's `[webhook] ALLOWED_HOST_LIST` limits where deliveries may go; set it to the receivers' domain.

The lab protected `main` and added one webhook (*lab output*):

```text
== M-006 (lab): branch protection and a webhook
  main protected (no direct push, signed commits, one approval); webhook to drift.fmp.lab.contoso.test
```

**Validate.** Book 00's gate: a known-good push is accepted, a known-bad one (an unsigned commit, a marking) is refused, and the test results are committed. The smoke test in Step 2 shows the direct push to `main` refused.

## Step 7 (M-007): Azure Arc {#step-7}

**Owner:** infrastructure lead. **Authority:** *Microsoft-documented*. *Not run in the lab* (no tenant). M-007 may finish in Phase 1, by G1 ([Book 00, Chapter 08](../b00-orientation/08-pre-flight-and-assessment.md#seven-build-milestones)).

1. **Onboard with the service principal,** to commercial Azure (`AzureCloud`), into `rg-fmp-governance`, with [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md#resource-groups-and-tags)'s tags. In Windows PowerShell 5.1 on the host, after installing the Connected Machine agent:[^phg-arc-connect]

   ```powershell
   & "$env:ProgramW6432\AzureConnectedMachineAgent\azcmagent.exe" connect `
       --service-principal-id '<application ID>' --service-principal-secret (Get-Secret -Name 'fmp-arc-onboarding' -AsPlainText) `
       --tenant-id '<tenant ID>' --subscription-id '<subscription ID>' --resource-group rg-fmp-governance --location '<region>' `
       --cloud AzureCloud --resource-name FMP-GIT01 `
       --tags 'Environment=Production,Workload=GitServer,Criticality=High,Owner=<owner>,CostCenter=<cost center>,PatchGroup=<group>,ArcOnboardedDate=<yyyy-mm-dd>'
   & "$env:ProgramW6432\AzureConnectedMachineAgent\azcmagent.exe" config set proxy.url 'http://proxy.corp.contoso.com:8080'
   & "$env:ProgramW6432\AzureConnectedMachineAgent\azcmagent.exe" show
   ```

2. **Let the gMSA ask for managed identity tokens** for the backup and drift tasks, by adding it to **Hybrid agent extension applications** ([Appendix B, B.4](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#b.4-the-hosts-own-identities)).
3. **Assign machine configuration** for Windows Server 2025 and the Azure Monitor Agent's data collection rules, as Book 05, Chapter 09 describes.

**Validate.** Book 00's gate: heartbeat confirmed, policies assigned and compliant. The check's PH-12 reads `azcmagent show --json` and reports the agent's status; the production settings require it.

## The nightly backup and the cold restore {#backup-and-restore}

**Owner:** infrastructure lead; the database team for PostgreSQL. **Authority:** *Gitea-documented* for the dump and restore; WD-178 for the targets.

WD-178 makes a cold standby the default: a 24-hour recovery point and a 4-hour recovery time.

1. **The nightly job.** A scheduled task under the gMSA stops Gitea, runs `gitea dump` (Gitea's single archive of the repositories, the data folder, the configuration and a database dump), starts Gitea again, and ships the archive to Blob (full production) or to the local and SMB targets (single host), with 30-day retention ([Appendix B, C.4](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#c.4-azure-blob-backup-target)). Gitea's documentation says to shut Gitea down while the backup runs.[^phg-gitea-backup] The dump command, in Windows PowerShell 5.1:

   ```powershell
   Stop-Service gitea
   & D:\Gitea\gitea.exe --config D:\Gitea\custom\conf\app.ini --work-path D:\Gitea dump --file "E:\Backups\Staging\gitea-dump-$((Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')).zip" --type zip
   Start-Service gitea
   ```

   The lab ran it once (*lab output*):

   ```text
   == Nightly backup (lab): gitea dump
     gitea-dump-20261126T055238Z.zip: 21723 KB; Gitea stopped for the dump and started again

   Lab host built: https://git.fmp.lab.contoso.test (Gitea 28.4.0, SQLite). Throw the machine away when you're done.
   ```

2. **The restore.** Gitea has no restore command; its documentation gives the steps by hand:[^phg-gitea-backup] on the standby (or a rebuilt host from Steps 1 and 2), unzip the dump; put `app.ini`, the data folder, the log folder and the repositories back in their paths; give the gMSA its ownership back; import the database dump (`gitea-db.sql`) into PostgreSQL, or put the SQLite file back; start Gitea; run `gitea admin regenerate hooks`; and run `gitea doctor check` if anything looks wrong.
3. **Test it.** A restore that hasn't been tried isn't a recovery time. Restore to the standby at least once a year and after each Gitea upgrade, time it against the 4 hours, and keep the record with the check's evidence.

**Validate.** The check's PH-11 finds the newest dump inside the recovery point; the restore test's record shows the time.

## The optional hot standby {#hot-standby}

**Authority:** WD-178; *Design guidance*. Not built in this guide.

WD-178 allows a hot standby where the agency asks for more than a 24-hour recovery point: a second host kept close to the first, with failover gated by a witness so only one node ever accepts commits. Active-active isn't allowed: two writers would break the program's one-authoritative-record rule ([Book 13, Chapter 03](../b13-governance/03-one-authoritative-record.md)). A hot standby is a decision to record before it's built, with its own design for how the repositories and the database stay in step, what the witness is, and how a failover is tested. Until that decision exists, the standby is cold, built from Steps 1 and 2 and restored from the nightly dump.

## Step 8: The interface check, and its evidence {#step-8}

**Owner:** infrastructure lead runs it; the ISSO keeps the evidence. **Authority:** *Design guidance* (Appendix B's closed list, D.4).

The check is the conformance adapter of [Appendix B, D.4](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#d.4-conformance-adapter), built in part: it reads the host, never changes it, and reports anything off the list as a finding. It covers service health and the TLS inventory; the repository inventory and the IIS access summaries are still designs.

| Check | What it compares | Appendix B |
|---|---|---|
| PH-01 | Gitea listens on `127.0.0.1:3000` and 2222 only; something answers on 443; nothing on 80 or 22 | A.1, A.2 |
| PH-02 | Every firewall profile on, inbound blocked by default, allow rules for 443 and 2222 | Inbound posture |
| PH-03 | The 443 certificate's key size, expiry, name and issuer; TLS 1.0 and 1.1 off | A.1 |
| PH-04 | One catch-all, stop-processing rule to loopback; URL encoding kept; ARR on without host rewrite; request size; HSTS; WebSockets | A.1 |
| PH-05 | W3C log on a local drive, hourly, with the required fields | D.5, C.3 |
| PH-06 | The `app.ini` settings in the settings file; secrets present but never read | A.2, A.3, A.5 |
| PH-07 | The `gitea` service's account, start mode and state; `RUN_USER` agrees | B.4, E.2 |
| PH-08 | No broad principal can write to the data, repository or backup folders; the service account can | E.4 |
| PH-09 | `gitea.exe`'s SHA-256 and the running version are the manifest's | F.3 |
| PH-10 | Anonymous API reads refused; webhooks only to listed receivers over HTTPS; mirrors synced within 24 hours; few administrators | A.3, A.4, D.2, F.1 |
| PH-11 | The newest backup is inside the recovery point | C.4 |
| PH-12 | The Azure Arc agent is connected | C.1 |

1. **Fill the settings file** from the kit's `config/settings.template.json`, at work: the host name, paths, the gMSA, the webhook receivers. The kit's `copilot-prompts.md` has a prompt for it.
2. **Take the Windows snapshot,** in Windows PowerShell 5.1, as a member of the local Administrators group (IIS keeps its configuration where only administrators and SYSTEM can read it):

   ```powershell
   Set-Location D:\Kits\platform-host
   $Run = "D:\Evidence\platform-host\run\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
   .\Get-PhWindowsSnapshot.ps1 -SettingsPath .\config\settings.production.json -OutputPath "$Run\snapshot-windows.json"
   ```

   The lab's run (*lab output*):

   ```text
   Wrote C:\FMWLabs\results\platform-host\run\snapshot-windows.json
     41 listeners, 3 firewall profiles, 2 allow rules in 'Platform host'
     site FMPReverseProxy: 1 rewrite rule(s), certificate CN=git.fmp.lab.contoso.test
     service gitea: LocalSystem, Running
     3 folders, backup gitea-dump-20261126T055238Z.zip, Arc agent not installed
   ```

3. **Take the Gitea snapshot,** in PowerShell 7.6, with a token that has only `read:admin,read:repository`, from the secret store. Every call is a GET, through IIS, so the snapshot also proves the front door answers:

   ```powershell
   Set-Location D:\Kits\platform-host
   $env:PH_GITEA_TOKEN = Get-Secret -Name 'fmp-gitea-check' -AsPlainText
   ./Get-PhGiteaSnapshot.ps1 -SettingsPath ./config/settings.production.json -OutputPath "$Run\snapshot-gitea.json"
   Remove-Item Env:\PH_GITEA_TOKEN
   ```

   The lab's run (*lab output*):

   ```text
   Wrote C:\FMWLabs\results\platform-host\run\snapshot-gitea.json
     Gitea 28.4.0 at https://git.fmp.lab.contoso.test; anonymous read answered 403
     2 repositories, 1 mirror(s), 1 webhook(s), 1 administrator(s)
   ```

4. **Run the check and record it,** in either shell; it reads only the snapshots:

   ```powershell
   .\Test-PhInterfaces.ps1 -SettingsPath .\config\settings.production.json -RunPath $Run -EvidencePath D:\Evidence\platform-host\evidence
   ```

   The lab's run in Windows PowerShell 5.1 (*lab output*). PH-12 is *NotChecked* because the lab settings don't require Arc:

   ```text
   PH-01  Pass        gitea on 127.0.0.1:3000 and port 2222 (and loopback only: 127.0.0.1:52992); 443 answers; nothing on 80 or 22
   PH-02  Pass        3 profiles on, inbound blocked by default; allow rules for 443 and 2222
   PH-03  Pass        CN=git.fmp.lab.contoso.test, RSA 4096, expires 2027-12-28; TLS 1.0 and 1.1 off
   PH-04  Pass        one stop-processing rule to http://127.0.0.1:3000; ARR on, no host rewrite; 524288000 bytes; HSTS on; WebSockets
   PH-05  Pass        W3C, hourly, 17 required fields, C:\inetpub\logs\LogFiles
   PH-06  Pass        16 settings as expected
   PH-07  Pass        LocalSystem, running, automatic (delayed); RUN_USER runnervmbpeip$
   PH-08  Pass        3 folders: no write for Everyone, BUILTIN\Users, NT AUTHORITY\Authenticated Users; NT AUTHORITY\SYSTEM has Modify
   PH-09  Pass        gitea.exe is the pinned 28.4.0 (SHA-256 f67cfc9179db...)
   PH-10  Pass        anonymous read refused (403); 1 webhook to listed hosts; 1 mirror synced within 24 h; 1 administrator
   PH-11  Pass        gitea-dump-20261126T055238Z.zip, 0.0 hours old (recovery point 24 h)
   PH-12  NotChecked  the Connected Machine agent is not installed; this settings file does not require it (M-007 may finish in Phase 1)
   11 pass, 0 findings, 1 not checked
   Record 1: Pass (0 findings)
   Controls: AC-3, AC-6, AU-12, AU-2, CA-7, CM-2, CM-6, CM-7, CM-8, CP-10, CP-9, IA-5, SC-12, SC-7, SC-8, SI-4, SI-7
   KSIs:     KSI-CNA-MAT, KSI-CNA-RNT, KSI-IAM-ELP, KSI-IAM-SNU, KSI-MLA-EVC, KSI-MLA-LET, KSI-PIY-GIV, KSI-RPL-ABO, KSI-SVC-ACM, KSI-SVC-ASM, KSI-SVC-SIN, KSI-SVC-VRI
   exit 0
   ```

   The same snapshots in PowerShell 7.6 give the same rows (*lab output*):

   ```text
   PH-01  Pass        gitea on 127.0.0.1:3000 and port 2222 (and loopback only: 127.0.0.1:52992); 443 answers; nothing on 80 or 22
   PH-02  Pass        3 profiles on, inbound blocked by default; allow rules for 443 and 2222
   PH-03  Pass        CN=git.fmp.lab.contoso.test, RSA 4096, expires 2027-12-28; TLS 1.0 and 1.1 off
   PH-04  Pass        one stop-processing rule to http://127.0.0.1:3000; ARR on, no host rewrite; 524288000 bytes; HSTS on; WebSockets
   PH-05  Pass        W3C, hourly, 17 required fields, C:\inetpub\logs\LogFiles
   PH-06  Pass        16 settings as expected
   PH-07  Pass        LocalSystem, running, automatic (delayed); RUN_USER runnervmbpeip$
   PH-08  Pass        3 folders: no write for Everyone, BUILTIN\Users, NT AUTHORITY\Authenticated Users; NT AUTHORITY\SYSTEM has Modify
   PH-09  Pass        gitea.exe is the pinned 28.4.0 (SHA-256 f67cfc9179db...)
   PH-10  Pass        anonymous read refused (403); 1 webhook to listed hosts; 1 mirror synced within 24 h; 1 administrator
   PH-11  Pass        gitea-dump-20261126T055238Z.zip, 0.0 hours old (recovery point 24 h)
   PH-12  NotChecked  the Connected Machine agent is not installed; this settings file does not require it (M-007 may finish in Phase 1)
   11 pass, 0 findings, 1 not checked
   exit 0
   ```

5. **See a finding.** The lab then starts the Default Web Site, which listens on port 80, takes a new Windows snapshot and runs the check again. PH-01 reports it, and the check exits 1 (*lab output*):

   ```text
   Default Web Site started
   PH-01  Finding     something listens on port 80
   PH-02  Pass        3 profiles on, inbound blocked by default; allow rules for 443 and 2222
   PH-03  Pass        CN=git.fmp.lab.contoso.test, RSA 4096, expires 2027-12-28; TLS 1.0 and 1.1 off
   PH-04  Pass        one stop-processing rule to http://127.0.0.1:3000; ARR on, no host rewrite; 524288000 bytes; HSTS on; WebSockets
   PH-05  Pass        W3C, hourly, 17 required fields, C:\inetpub\logs\LogFiles
   PH-06  Pass        16 settings as expected
   PH-07  Pass        LocalSystem, running, automatic (delayed); RUN_USER runnervmbpeip$
   PH-08  Pass        3 folders: no write for Everyone, BUILTIN\Users, NT AUTHORITY\Authenticated Users; NT AUTHORITY\SYSTEM has Modify
   PH-09  Pass        gitea.exe is the pinned 28.4.0 (SHA-256 f67cfc9179db...)
   PH-10  Pass        anonymous read refused (403); 1 webhook to listed hosts; 1 mirror synced within 24 h; 1 administrator
   PH-11  Pass        gitea-dump-20261126T055238Z.zip, 0.0 hours old (recovery point 24 h)
   PH-12  NotChecked  the Connected Machine agent is not installed; this settings file does not require it (M-007 may finish in Phase 1)
   10 pass, 1 finding, 1 not checked
   exit 1
   Default Web Site stopped
   ```

6. **Schedule it daily,** as a task under the Gitea gMSA, the account Appendix B already gives the backup and drift tasks. The account needs Read on `%windir%\System32\inetsrv\config` for the IIS part, granted by the change record, not administrator rights ([Appendix B, E.3](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#e.3-iis-management)). Learn lists scheduled tasks among what a gMSA can run but gives no steps;[^phg-gmsa] the common practice, not on Learn, is a principal with the gMSA and the `Password` logon type, which `New-ScheduledTaskPrincipal` accepts:[^phg-schtask]

   ```powershell
   $action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument '-NoProfile -File D:\Kits\platform-host\deploy\Invoke-PhDailyCheck.ps1'
   $trigger = New-ScheduledTaskTrigger -Daily -At 6:15am
   $principal = New-ScheduledTaskPrincipal -UserId 'CORP\gmsa-fmpgitea$' -LogonType Password
   Register-ScheduledTask -TaskName 'Platform host interface check' -Action $action -Trigger $trigger -Principal $principal
   ```

   The wrapper script named here (`Invoke-PhDailyCheck.ps1`) isn't in the kit yet: it runs items 2 to 4 with the production settings and raises a ticket on exit code 1. *Not run in the lab.*
7. **Check the evidence folder.** Each record lists the checks, their controls and KSIs, every file's SHA-256 and the hash of the record before it; `Test-PhEvidence` verifies the folder (*lab output*):

   ```text
   SUMS   Pass     4 files match SHA256SUMS
   CHAIN  Pass     1 records, chain unbroken
   ```

## Federal requirements and KSIs, by step {#requirements}

The steps build the controls Appendix B's [control crosswalk](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#control-crosswalk) names; the check produces the evidence for them. Each control-to-KSI pair reuses one another kit's requirements file already uses, as the kit's `config/requirements.json` lists.

| Step | What the evidence shows | NIST SP 800-53 Rev 5 | KSIs |
|---|---|---|---|
| M-001, PH-02 | Two published ports; every profile blocks inbound by default | SC-7, CM-7 | KSI-CNA-MAT, KSI-CNA-RNT |
| M-002, PH-01 | Gitea only on loopback and 2222; nothing on 80 | CM-7, SC-7 | KSI-CNA-RNT, KSI-CNA-MAT |
| M-001, M-002, PH-03 | Enterprise certificate, RSA 4096, in date; TLS 1.0 and 1.1 off | SC-8, SC-12 | KSI-SVC-SIN, KSI-SVC-ASM |
| M-002, PH-04 | The reverse proxy as configured: one rule, no host rewrite, HSTS | CM-6, SC-8 | KSI-SVC-ACM, KSI-SVC-SIN |
| M-002, PH-05 | The W3C log, hourly, with the fields the evidence needs | AU-2, AU-12 | KSI-MLA-LET |
| M-002, PH-06 | Gitea's settings as approved; sign-in required; registration closed | CM-6, AC-3 | KSI-SVC-ACM, KSI-IAM-ELP |
| M-001, M-002, PH-07 | The service runs as the gMSA, not a person | AC-6, IA-5 | KSI-IAM-ELP, KSI-IAM-SNU |
| M-001, PH-08 | Only the gMSA and administrators can write the data | AC-3, AC-6 | KSI-IAM-ELP |
| Release manifest, PH-09 | The running binary is the pinned one | CM-2, SI-7 | KSI-SVC-ACM, KSI-SVC-VRI |
| M-005, M-006, PH-10 | Anonymous reads refused; webhooks to listed receivers; mirror fresh | AC-3, CA-7, SI-4 | KSI-IAM-ELP, KSI-MLA-EVC, KSI-MLA-LET |
| Backup, PH-11 | The newest dump is inside the recovery point | CP-9, CP-10 | KSI-RPL-ABO |
| M-007, PH-12 | The host is in Arc's inventory and connected | CM-8, CA-7 | KSI-PIY-GIV, KSI-MLA-EVC |
| Evidence | Records hashed and chained | AU-9 | KSI-MLA-OSM |

The records support these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with what its providers report against them and doesn't report KSIs itself.

**Where agencies are.** *Design guidance, from the program's experience:* a repository server is usually built once by hand and then left, its configuration known only to whoever built it, and its interfaces found by an assessor rather than listed by the owner. The guide's order (manifest first, then milestones, then a daily check against the list) is meant to replace that with a build anyone can repeat and a record of every day since.

## RACI {#raci}

R = does it; A = accountable; C = consulted; I = informed. The owners are Book 00, Chapter 08's.

| Activity | Infrastructure lead | Identity lead | Program steward | Proxy and firewall team | ISSO |
|---|---|---|---|---|---|
| Access request and manifest | A, R | C | C | C | I |
| M-001 server, gMSA, folders, firewall | A, R | R (gMSA) | I | C (egress) | I |
| M-002 IIS, Gitea, reverse proxy | A, R | I | C | I | I |
| M-003, M-004 directory and Entra sign-in | C | A, R | C | I | I |
| M-005, M-006 organization, mirror, hooks, webhooks | C | I | A, R | C (mirror egress) | I |
| M-007 Azure Arc | A, R | I | I | C (Arc endpoints) | I |
| Backup and restore test | A, R | I | I | I | C |
| Daily interface check and evidence | R | I | I | I | A |

## Dangers and how to avoid them {#dangers}

| Danger | What happens | The guard |
|---|---|---|
| Gitea bound to every address | Port 3000 answers on the network, behind no TLS and no IIS log | `HTTP_ADDR = 127.0.0.1`; PH-01 |
| ARR rewrites the host in response headers | Redirects send browsers to `127.0.0.1:3000` | Turn it off (Gitea's documentation); PH-04 |
| The proxy decodes the URL | A path with an encoded `%2F` breaks or reaches the wrong file | `{UNENCODED_URL}` and `useOriginalURLEncoding="false"`; PH-04 |
| Browser-edited hooks | Anyone with the Git Hook privilege runs code on a Tier 0 host | `DISABLE_GIT_HOOKS = true`; PH-06 |
| `RUN_USER` and the service account disagree | Gitea doesn't notice on Windows; the configuration says one account and the service runs as another | PH-07 compares them |
| The bind password in process arguments | Anyone who can list processes on the host reads it | Run `add-ldap` once, from the signed runbook |
| Groups overage in the Entra token | A user in more than 200 groups gets no groups claim and no Gitea role | Groups assigned to the application only ([Appendix B, B.2](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md#b.2-entra-id-over-openid-connect)) |
| The mirror taken as canon | Upstream commits skip the hooks and branch protection | The mirror is a quarantine copy; canon moves only by a reviewed push; PH-10 watches its freshness |
| A webhook to an unlisted receiver | Repository events leave the boundary | `ALLOWED_HOST_LIST`; PH-10 |
| A backup taken while Gitea runs | The archive's database and repositories disagree | Stop the service for the dump; test the restore |
| An unpinned binary | An upgrade or a tampered download goes in unnoticed | The manifest's hashes and signers; PH-09 |
| An unsigned commit refused with a server error | A contributor sees "Internal Server Error" and reports an outage | Sign commits before the first push; Gitea's log names the unverified commit (Step 2) |
| A self-signed certificate left in production | Clients learn to skip certificate checks | The production settings refuse it; PH-03 |
| A second writer | A hot standby that takes commits splits the record | Witness-gated failover only, after a recorded decision (WD-178) |

## Implementation checklist {#checklist}

- [ ] The access request is approved and the egress allowlist is in place before M-001.
- [ ] Every download matches the release manifest's SHA-256 (and signer, for Microsoft's installers).
- [ ] The host is domain-joined in its own OU, hardened, patched, and `Test-ADServiceAccount` returns `True` for `gmsa-fmpgitea$`.
- [ ] `D:\Gitea`, `D:\GitRepos` and the backup folder give no write to broad principals.
- [ ] TLS 1.0 and 1.1 are off; the firewall publishes 443 and 2222 to the agency network and 5986 to the admin subnet only.
- [ ] Gitea runs as the gMSA, bound to loopback, with `RUN_USER` naming the same account.
- [ ] IIS has one rewrite rule, ARR without host rewrite, HSTS, the enterprise certificate and an hourly W3C log; nothing answers on 80.
- [ ] Directory and Entra sign-in work, and the Entra application requires assignment and MFA.
- [ ] The organization, teams and mirror exist; `main` is protected; webhooks go only to listed receivers, each with a secret.
- [ ] The host is in Arc with Book 05's tags, machine configuration assigned.
- [ ] The nightly dump runs and a restore has been timed against 4 hours.
- [ ] The interface check runs daily, has no findings, and its evidence folder passes `Test-PhEvidence`.

## What couldn't be verified {#what-couldnt-be-verified}

- **A gMSA as Gitea's service account and as the check's task principal.** Learn supports both, but gives neither the `sc.exe` form with an empty password nor the scheduled task's `Password` logon type for a gMSA; both are common practice. The lab has no domain, so the service ran as Local System. A test host in the agency's forest confirms them.
- **`RSAT-AD-PowerShell` as a feature name:** Learn names `RSAT-AD-Tools`; Step 1 lists the features on the host before installing.
- **The ARR configuration attributes** (`system.webServer/proxy` `enabled` and `reverseRewriteHostInResponseHeaders`): Learn documents only the IIS Manager boxes; the attribute names are the ones the lab wrote and read back.
- **`useOriginalURLEncoding`:** in Gitea's IIS example, not in Learn's URL Rewrite reference.
- **A non-administrator reading IIS's configuration** for the scheduled check: the lab ran as an administrator; the Read grant on `inetsrv\config` is design guidance until a test host confirms it.
- **Steps 3, 4 and 7, and the PostgreSQL profile:** written from Learn and Gitea's documentation, not run (no domain, tenant or database server in the lab).
- **Gitea's extra loopback listener.** In every lab run Gitea also listened on one loopback port in Windows' dynamic range (a different port each run), which its log doesn't mention. It isn't reachable from the network, so PH-01 notes it rather than failing; what Gitea uses it for is not yet specified.
- **`azcmagent show --json`'s field names:** Learn documents `status` and `lastHeartbeat`; the resource name's field isn't listed, so PH-12 reports what the agent prints.
- **The restore time:** the lab took a dump but didn't restore it; the 4-hour recovery time is WD-178's target until the agency's own test.

## Back to the books

- [Book 01, Chapter 03: The Platform Foundation](../b01-transformation-arc/03-platform-foundation.md)
- [Book 00, Chapter 08: Pre-Flight: Platform and Assessment](../b00-orientation/08-pre-flight-and-assessment.md)
- [Book 10, Appendix B: Platform Host Interface Reference](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md)
- [Book 13, Chapter 03: One Authoritative Record](../b13-governance/03-one-authoritative-record.md)
- [Book 05, Chapter 09: Servers under Azure Arc](../b05-devices/09-servers-under-azure-arc.md)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/platform-host-implementation.md).

<!-- revisions:end -->

[^phg-pslife]: Microsoft Learn, "PowerShell Support Lifecycle," <https://learn.microsoft.com/powershell/scripting/install/powershell-support-lifecycle> (accessed Nov 26, 2026). 7.6 LTS released March 18, 2026, supported to November 14, 2028; 7.4 and 7.5 ended November 10, 2026.
[^phg-gcc-entra]: Microsoft Learn, "Cloud feature availability for US Government customers," section "Microsoft 365 integration," <https://learn.microsoft.com/azure/security/fundamentals/feature-availability#microsoft-365-integration> (accessed Nov 15, 2026, as cited in Book 10, Appendix B).
[^phg-gitea-release]: Gitea, release v28.4.0 (November 15, 2026), asset `gitea-28.4.0-windows-amd64.exe.sha256`, <https://github.com/go-gitea/gitea/releases/tag/v28.4.0> (accessed Nov 26, 2026).
[^phg-git-release]: Git for Windows, release v2.56.1.windows.1 (November 10, 2026), release notes' SHA-256 table, <https://github.com/git-for-windows/git/releases/tag/v2.56.1.windows.1> (accessed Nov 26, 2026).
[^phg-urlrewrite]: IIS.net, "URL Rewrite," download links for version 2.1, <https://www.iis.net/downloads/microsoft/url-rewrite> (accessed Nov 26, 2026).
[^phg-arr]: IIS.net, "Application Request Routing," download link for version 3.0 and the note to install URL Rewrite first, <https://www.iis.net/downloads/microsoft/application-request-routing> (accessed Nov 26, 2026).
[^phg-authenticode]: Microsoft Learn, "Get-AuthenticodeSignature," <https://learn.microsoft.com/powershell/module/microsoft.powershell.security/get-authenticodesignature> (accessed Nov 26, 2026).
[^phg-hw]: Microsoft Learn, "Hardware requirements for Windows Server," <https://learn.microsoft.com/windows-server/get-started/hardware-requirements> (accessed Nov 26, 2026).
[^phg-addcomputer]: Microsoft Learn, "Add-Computer" (Microsoft.PowerShell.Management, Windows PowerShell 5.1), <https://learn.microsoft.com/powershell/module/microsoft.powershell.management/add-computer?view=powershell-5.1> (accessed Nov 26, 2026).
[^phg-gmsa]: Microsoft Learn, "Manage group Managed Service Accounts," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts>, and "New-ADServiceAccount," <https://learn.microsoft.com/powershell/module/activedirectory/new-adserviceaccount> (both accessed Nov 26, 2026).
[^phg-tls]: Microsoft Learn, "Transport Layer Security (TLS) registry settings," <https://learn.microsoft.com/windows-server/security/tls/tls-registry-settings>, and "TLS 1.0 and TLS 1.1 deprecation in Windows," <https://learn.microsoft.com/windows/win32/secauthn/tls-10-11-deprecation-in-windows> (both accessed Nov 26, 2026).
[^phg-envvar]: Microsoft Learn, "Environment.SetEnvironmentVariable Method" (.NET), <https://learn.microsoft.com/dotnet/api/system.environment.setenvironmentvariable> (accessed Nov 26, 2026).
[^phg-features]: Microsoft Learn, "Roles, Role Services, and Features included in Windows Server - Server Core," <https://learn.microsoft.com/windows-server/administration/server-core/server-core-roles-and-services>, and "Web Socket `<webSocket>`," <https://learn.microsoft.com/iis/configuration/system.webserver/websocket> (both accessed Nov 26, 2026).
[^phg-gitea-proxy]: Gitea Documentation, "Reverse Proxies," IIS section, <https://docs.gitea.com/administration/reverse-proxies> (accessed Nov 26, 2026).
[^phg-gitea-cli]: Gitea Documentation, "Gitea Command Line" (`generate secret`, `admin user`, `admin auth`, `dump`), <https://docs.gitea.com/administration/command-line> (accessed Nov 26, 2026).
[^phg-gitea-winsvc]: Gitea Documentation, "Register as a Windows Service," <https://docs.gitea.com/installation/windows-service> (accessed Nov 26, 2026).
[^phg-sc]: Microsoft Learn, "sc.exe config," <https://learn.microsoft.com/windows-server/administration/windows-commands/sc-config> (accessed Nov 26, 2026).
[^phg-gitea-runuser]: Gitea source code, tag v28.4.0, `modules/setting/setting.go`, `IsRunUserMatchCurrentUser` ("This check is ignored under Windows"), <https://github.com/go-gitea/gitea/blob/v28.4.0/modules/setting/setting.go> (accessed Nov 26, 2026).
[^phg-hsts]: Microsoft Learn, "HSTS `<hsts>`," <https://learn.microsoft.com/iis/configuration/system.applicationhost/sites/site/hsts> (accessed Nov 26, 2026).
[^phg-logfile]: Microsoft Learn, "Log Files for a Web Site `<logFile>`," <https://learn.microsoft.com/iis/configuration/system.applicationhost/sites/sitedefaults/logfile/> (accessed Nov 26, 2026).
[^phg-newmgapp]: Microsoft Learn, "application resource type" (`groupMembershipClaims`), <https://learn.microsoft.com/graph/api/resources/application>, and "New-MgApplication," <https://learn.microsoft.com/powershell/module/microsoft.graph.applications/new-mgapplication> (both accessed Nov 26, 2026).
[^phg-rsat]: Microsoft Learn, "Remote Server Administration Tools," Windows Server section (`Get-WindowsFeature -Name RSAT*`, `RSAT-AD-Tools`), <https://learn.microsoft.com/windows-server/administration/install-remote-server-administration-tools> (accessed Nov 26, 2026).
[^phg-arc-proxy]: Microsoft Learn, "Manage and maintain Azure Connected Machine agent proxy settings," <https://learn.microsoft.com/azure/azure-arc/servers/manage-agent-proxy-settings> (accessed Nov 26, 2026). The agent's own `proxy.url` setting is preferred over the `HTTPS_PROXY` variable and needs no service restart.
[^phg-manifest]: Microsoft Learn, "Microsoft Graph app manifest (Microsoft Entra ID)," `groupMembershipClaims` (`None`, `SecurityGroup`, `ApplicationGroup`, `DirectoryRole`, `All`), <https://learn.microsoft.com/entra/identity-platform/reference-microsoft-graph-app-manifest> (accessed Nov 26, 2026).
[^phg-addpassword]: Microsoft Learn, "application: addPassword" and "servicePrincipal resource type" (`appRoleAssignmentRequired`), <https://learn.microsoft.com/graph/api/application-addpassword> and <https://learn.microsoft.com/graph/api/resources/serviceprincipal> (both accessed Nov 26, 2026).
[^phg-ca]: Microsoft Learn, "Require MFA for all users with Conditional Access," <https://learn.microsoft.com/entra/identity/conditional-access/policy-all-users-mfa-strength> (accessed Nov 26, 2026).
[^phg-arc-connect]: Microsoft Learn, "Connect hybrid machines to Azure at scale" (service principal onboarding), <https://learn.microsoft.com/azure/azure-arc/servers/onboard-service-principal>, and "azcmagent connect," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-connect> (both accessed Nov 26, 2026).
[^phg-gitea-backup]: Gitea Documentation, "Backup and Restore," <https://docs.gitea.com/administration/backup-and-restore> (accessed Nov 26, 2026).
[^phg-webhooks]: Gitea Documentation, "Webhooks," <https://docs.gitea.com/usage/webhooks> (accessed Nov 26, 2026).
[^phg-schtask]: Microsoft Learn, "New-ScheduledTaskPrincipal," <https://learn.microsoft.com/powershell/module/scheduledtasks/new-scheduledtaskprincipal> (accessed Nov 26, 2026).
