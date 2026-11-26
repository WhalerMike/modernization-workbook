# Verification — Guide: The Platform Host

New guide, written November 26, 2026, with the kit `examples/platform-host`, after the Platform Host topic (Phase 1, PR #815) listed a build guide and a read-only interface check as needed. The workbook owner's instructions for Phase 2, relayed on November 26: PowerShell 5.1 for the IIS and Windows feature steps and 7.6 for Gitea, Arc and Graph; build a local lab host for real kit output; retire `docs/substrate/` and `docs/operational-guides/platform-substrate/` once the guide lands; a short hot standby section only; rename the Gitea gMSA to fit WD-159 and WD-173 and update every page that quotes it. Every Microsoft fact was read on Microsoft Learn; Gitea facts in Gitea's documentation and, where the documentation is silent, in Gitea's source at tag v28.4.0.

## Search before writing (origin/main, November 26, 2026)

Searched `docs/`, `presentations/`, `examples/` and `data/` for *Gitea*, *platform host*, *platform substrate*, *svc-fmp-gitea*, *M-001* to *M-007*, *conformance adapter* and *release manifest*. Found: Book 01, Chapter 03 (why one host; "build procedures belong in a separate PowerShell-first runbook", not written); Book 00, Chapter 08 (the seven milestones); Book 10, Appendix B (the interfaces, illustrative configuration, the conformance adapter as a design); Book 13, Chapter 03; WD-177 and WD-178; the Platform Host topic; plan rows P0.2, P1.9 and X-P02; the Start Kit's note that Gitea isn't in it; and the unpublished `docs/substrate/**` and `docs/operational-guides/platform-substrate/` pages (an operations guide, runbook, disaster recovery playbook, replication note and Arc policy library, never rendered, describing Intune enrolment that Appendix B rules out). No guide, kit, lab or deck covered the build. The guide links the existing pages instead of repeating them; the substrate pages were retired to `archive/b10-cloud-boundary/docs/` with a record (`RETIRED-platform-substrate.md`).

**Conflicts found and settled.** The gMSA name `svc-fmp-gitea$` (Appendix B) didn't fit WD-159 and WD-173; renamed `gmsa-fmpgitea$` on the owner's instruction. Appendix B's "`RUN_USER` must name the same account" overstated Gitea: Gitea skips the check on Windows (claim 12); corrected in Appendix B.

## The lab

The kit's `Platform host lab` workflow runs `lab/Build-PhLabHost.ps1` on a fresh GitHub-hosted `windows-2025` runner (Windows Server 2025 Datacenter 10.0.26100, PowerShell 7.6.10, Windows PowerShell 5.1.26100), then the collectors, the check in both shells, a smoke test, a drift step and the evidence check. The guide's *lab output* blocks are the console files of run 45763809335 (November 26, 2026, commit 9531d66), verbatim, and the kit's test fixtures are that run's snapshots. Four earlier runs that day found and fixed kit bugs (Windows PowerShell 5.1 turning Gitea's log lines into errors, a JSON property with an empty name, enum values read as numbers, dates converted by PowerShell 7, and the queue lock that stays open until Gitea's process exits). This PC couldn't host the lab: no administrator rights, no Hyper-V and no Windows Sandbox. The runner is the clean environment the workbook already uses for script captures (`script-captures.yml`).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PowerShell 7.6 LTS supported to November 14, 2028; 7.4 and 7.5 ended November 10, 2026 | How to read | verified | `phg-pslife` |
| 2 | Gitea 28.4.0 released November 15, 2026, with a published SHA-256; Git for Windows 2.56.1 released November 10, 2026, hash in the release notes | Release manifest | verified (release assets read through the GitHub API) | `phg-gitea-release`, `phg-git-release` |
| 3 | URL Rewrite 2.1 and ARR 3.0 download links; install URL Rewrite before ARR; Microsoft publishes no hash | Release manifest, Step 2 | verified; hashes recorded from the lab's download after a valid Microsoft signature | `phg-urlrewrite`, `phg-arr`, lab run |
| 4 | `Get-AuthenticodeSignature` returns `Status` and `SignerCertificate` | Release manifest | verified | `phg-authenticode` |
| 5 | Windows Server 2025 hardware minimum (1.4 GHz 64-bit with SSE4.2 and POPCNT, 2 GB RAM, 32 GB disk) | Step 1 | verified | `phg-hw` |
| 6 | `Add-Computer -DomainName -OUPath -Credential -Restart` (`-NewName` also exists) | Step 1 | verified | `phg-addcomputer` |
| 7 | `Install-ADServiceAccount`, `Test-ADServiceAccount`; gMSAs run services and scheduled tasks; KDS root key | Step 1, Step 8 | verified; Learn gives no steps for a scheduled task | `phg-gmsa` |
| 8 | AD module feature: Learn names `RSAT-AD-Tools` and `Get-WindowsFeature -Name RSAT*`, not `RSAT-AD-PowerShell` | Step 1 | corrected while writing (the guide lists the features first) | `phg-rsat` |
| 9 | TLS 1.0 and 1.1 off by default on Windows Server 2025; the `Enabled` DWORD under `SCHANNEL\Protocols\<version>\Server`; `DisabledByDefault` no longer documented | Step 1, PH-03 | verified; corrected from a first draft that used `DisabledByDefault` | `phg-tls` |
| 10 | `[Environment]::SetEnvironmentVariable(..., 'Machine')`; the Arc agent's own `proxy.url` setting preferred, no restart | Step 1, Step 7 | verified | `phg-envvar`, `phg-arc-proxy` |
| 11 | Feature names `Web-Server`, `Web-WebSockets`, `Web-Http-Logging`, `Web-Filtering`, `Web-Scripting-Tools`; `Web-Mgmt-Console` not on Server Core | Step 2 | verified; lab installed them (`Success`) | `phg-features`, lab run |
| 12 | Gitea skips the `RUN_USER` check on Windows and drops the domain from the account name | Step 2, PH-07; Appendix B E.2 | verified in source (the documentation doesn't say) | `phg-gitea-runuser` |
| 13 | `sc.exe create` form, Local System with `RUN_USER = <COMPUTERNAME>$`, absolute SQLite path, delayed start | Step 2 | verified; lab ran it | `phg-gitea-winsvc`, lab run |
| 14 | `sc.exe config obj= password=` syntax; `password=` required for any account but LocalSystem; nothing on Learn about an empty password for a gMSA | Step 2 | verified (syntax); empty password: common practice, not on Learn, not run | `phg-sc` |
| 15 | Gitea's IIS guidance: WebSocket Protocol feature, `{UNENCODED_URL}`, `useOriginalURLEncoding="false"`, `requestPathInvalidCharacters=""`, cleared request filtering lists, ARR reverse rewrite of host off, SSL offloading | Step 2, PH-04 | verified; `allowDoubleEscaping` is not in Gitea's guidance and the kit doesn't set it | `phg-gitea-proxy` |
| 16 | ARR's `system.webServer/proxy` `enabled` and `reverseRewriteHostInResponseHeaders` attributes | Step 2, PH-04 | not on Learn (only the IIS Manager boxes); the lab wrote and read them back | lab run |
| 17 | `<hsts>` attributes `enabled`, `max-age`, `includeSubDomains`; IIS 10.0 version 1709 and later | Step 2, PH-04 | verified | `phg-hsts` |
| 18 | `<logFile>` `period` allows `Hourly`; field names; `Host`, `BytesSent`, `BytesRecv` not in the default list | Step 2, PH-05 | verified | `phg-logfile` |
| 19 | `gitea generate secret` takes `INTERNAL_TOKEN`, `JWT_SECRET`, `SECRET_KEY`; `admin user create` flags (`--must-change-password` defaults to true); `generate-access-token --scopes --raw`; scope names | Step 2, lab | verified; lab ran them | `phg-gitea-cli`, lab run |
| 20 | No REST endpoint for authentication sources; `admin auth list` | Step 3 | verified (as Appendix B) | `phg-gitea-cli` |
| 21 | `New-MgApplication` parameters; `groupMembershipClaims` `ApplicationGroup` sends only the groups assigned to the application (manifest page; the Graph page lists fewer values) | Step 4 | verified; `ApplicationGroup` through the cmdlet not tested | `phg-newmgapp`, `phg-manifest` |
| 22 | `Application.ReadWrite.All` for a signed-in user (OwnedBy is app-only); Cloud Application Administrator, or Application Developer for an owned app | Step 4 | verified; corrected from "Application Administrator" | `phg-newmgapp` |
| 23 | `addPassword` returns the secret text once; `appRoleAssignmentRequired` | Step 4 | verified | `phg-addpassword` |
| 24 | Require MFA for all users with Conditional Access (authentication strength), narrowed to one application | Step 4 | verified; no Learn page for a single application | `phg-ca` |
| 25 | Gitea REST: `/version` refused to anonymous callers when `REQUIRE_SIGNIN_VIEW = true` (403); `/admin/hooks`; `/repos/search`; `mirror_updated` | Step 5, PH-10 | verified in source and the API definition; lab answered 403 | `aB-gitea-api` (Appendix B), lab run |
| 26 | `X-Gitea-Signature` is the lowercase hex HMAC-SHA256 of the raw body; `X-Hub-Signature-256` the same with `sha256=` | Step 6 | verified; the kit's tests check both forms | `phg-webhooks` |
| 27 | `azcmagent connect` service-principal options, `--cloud AzureCloud`, `--tags`, `--resource-name`; Azure Connected Machine Onboarding role; Windows Server 2025 supported | Step 7 | verified | `phg-arc-connect` |
| 28 | `azcmagent show --json` keys `status`, `lastHeartbeat`; the resource name's key not documented | PH-12 | verified in part | Learn `azcmagent show` |
| 29 | `gitea dump` options; shut Gitea down during the backup; no restore command; manual restore steps ending with `admin regenerate hooks` and `doctor check` | Backup and restore | verified; lab took a dump (after waiting for the process to exit: the queue's `LOCK` file stays open until it does) | `phg-gitea-backup`, lab run |
| 30 | `New-ScheduledTaskPrincipal -LogonType Password` exists; using it for a gMSA isn't on Learn | Step 8 | verified (parameter); gMSA use is common practice, not run | `phg-schtask` |
| 31 | Cold standby by default, 24-hour recovery point, 4-hour recovery time; opt-in witness-gated hot standby; no active-active | Backup, hot standby | restated-as-design | WD-178 |
| 32 | Control-to-KSI pairs | Requirements | reused (each pair appears in another kit's `requirements.json`) | `examples/platform-host/config/requirements.json` |
