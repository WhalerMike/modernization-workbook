# The platform host's interface check

The kit behind [The Platform Host: An Implementation Guide](../../docs/books/guides/platform-host-implementation.md). The platform host is the program's one governed server: Gitea behind IIS on Windows Server 2025 (WD-177), with a cold standby by default (WD-178). [Book 10, Appendix B](../../docs/books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md) lists every conversation the host may have and says the list is closed: anything off it is a finding. This kit checks the host against that list, read-only, and records each run as evidence.

- **Read-only.** The collectors read the host and write snapshots; the check compares the snapshots with a settings file and the release manifest. Nothing changes on the host. Secrets in `app.ini` reach a snapshot only as `<set>`.
- **Two editions, as the workbook splits them.** `Get-PhWindowsSnapshot.ps1` runs in Windows PowerShell 5.1 (IIS, the firewall, the service, ACLs). `Get-PhGiteaSnapshot.ps1` runs in PowerShell 7.6 (Gitea's REST API). `Test-PhInterfaces.ps1` reads only the snapshots and runs in either.
- **Twelve checks.** PH-01 to PH-12: listeners, firewall, TLS, the reverse proxy, the IIS log, `app.ini`, the service identity, folder ACLs, the release manifest, Gitea's API (sign-in required, webhook receivers, mirror freshness, administrators), the newest backup and the Azure Arc agent. Each is Pass, Finding or NotChecked, with the reason.
- **Evidence.** With `-EvidencePath`, a run is copied into a numbered folder with a record of its checks, their SP 800-53 Rev 5 controls and FedRAMP 20x KSIs (`config/requirements.json`), every file's SHA-256 and the hash of the record before it. `Test-PhEvidence` verifies the folder.
- **A real lab, no tenant.** `lab/Build-PhLabHost.ps1` builds a disposable lab host (IIS, URL Rewrite, ARR, Gitea with SQLite, a self-signed certificate, an organization with a pull mirror, a webhook and a backup) from the pinned manifest. The `Platform host lab` workflow runs it on a fresh GitHub-hosted Windows Server 2025 runner and runs the check against it; the guide quotes that output. The lab has no domain and no Entra tenant, so directory and Entra sign-in and Azure Arc aren't part of it.
- **Illustrative for production.** `config/settings.template.json` carries the production names from Appendix B (the gMSA `CORP\gmsa-fmpgitea$`, `D:\` paths, PostgreSQL, Arc required). It hasn't been run against a production host.

## Layout

```
Get-PhWindowsSnapshot.ps1     Windows PowerShell 5.1: listeners, firewall, TLS, IIS, app.ini, service, ACLs, hashes, backup, Arc
Get-PhGiteaSnapshot.ps1       PowerShell 7.6: Gitea's version, anonymous refusal, webhooks, mirrors, administrators (GETs only)
Test-PhInterfaces.ps1         the check, PH-01 to PH-12; results.json; -EvidencePath records the run; exits 1 on a finding
config/settings.lab.json      the lab host's expectations (Local System, self-signed, SQLite, Arc not required)
config/settings.template.json production's expectations, to copy and fill
config/requirements.json      each check's SP 800-53 controls and KSIs
manifest/release-manifest.json  every binary the build downloads, with its URL and SHA-256
powershell/PlatformHost/      the module (pure functions; runs in 5.1 and 7 on any platform)
lab/Build-PhLabHost.ps1       builds a lab host on a disposable Windows Server 2025 machine (changes that machine)
tests/                        Pester 5; fixtures/lab holds the lab workflow's own snapshots
copilot-prompts.md            prompts for Microsoft 365 Copilot Chat, to fill the settings file at work
```

## Run the check on a host

On the host, as a member of the local Administrators group (IIS keeps its configuration where only administrators can read it). The token is a Gitea access token with `read:admin,read:repository`, from the secret store:

```powershell
Set-Location D:\Kits\platform-host
$Run = "D:\Evidence\platform-host\run\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
powershell.exe -NoProfile -File .\Get-PhWindowsSnapshot.ps1 -SettingsPath .\config\settings.production.json -OutputPath "$Run\snapshot-windows.json"
$env:PH_GITEA_TOKEN = Get-Secret -Name 'fmp-gitea-check' -AsPlainText
.\Get-PhGiteaSnapshot.ps1 -SettingsPath .\config\settings.production.json -OutputPath "$Run\snapshot-gitea.json"
Remove-Item Env:\PH_GITEA_TOKEN
.\Test-PhInterfaces.ps1 -SettingsPath .\config\settings.production.json -RunPath $Run -EvidencePath D:\Evidence\platform-host\evidence
```

Those lines run in PowerShell 7.6, which starts the 5.1 collector with `powershell.exe`. The guide's last step schedules the same run daily as a task under the Gitea gMSA, the account Appendix B already gives the backup and drift tasks.

## Tests

```powershell
Set-Location examples\platform-host
Invoke-Pester -Path tests
```

The tests use the lab's snapshots, so they run on any machine with Pester 5, in PowerShell 7 or Windows PowerShell 5.1.
