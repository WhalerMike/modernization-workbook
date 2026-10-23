# Verification — Appendix B, Platform Host Interface Reference

Checked October 21, 2026 by writer W5. Source: `docs/whitepapers/git-server-interfaces-whitepaper.md` (6,100 words, v1.3). Gitea facts checked against docs.gitea.com (config cheat sheet, CLI, reverse proxies, Windows service, webhooks, signing, protected branches, repo mirror) and Gitea's API definition (`https://gitea.com/swagger.v1.json`, version 29.0.0+dev). Microsoft facts via the Microsoft Learn MCP tools. Marketplace from products.json (`last_change` 2026-10-21T05:02:15Z).

The source had no flattened code to restore; it described configuration in tables. The appendix adds five illustrative blocks (web.config, app.ini, `add-ldap`, `add-oauth`, gMSA service registration, mirror creation), built only from documented options, behind the illustrative-configuration warning. `contoso` host names kept (already clearly example names). Internal canon IDs (ADR numbers, FMP_163/167/171, file paths of the build guide and adapter spec) dropped from prose; they point to documents outside the workbook.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows Server 2025 host, Gitea on 127.0.0.1:3000 behind IIS | Overview, A.1 | verified | Gitea Reverse Proxies (IIS example to 127.0.0.1:3000); Book 01 Ch03 |
| 2 | IIS ARR + URL Rewrite reverse proxy; WebSocket feature; don't decode URI; disable ARR reverse host rewrite; full chain cert | A.1 | verified (new detail) | Gitea Reverse Proxies |
| 3 | Headers `X-Forwarded-For`, `X-Forwarded-Host` injected | A.1 | corrected | Gitea documents passing `Host` and `X-Forwarded-Proto`; table states those |
| 4 | HSTS max-age=31536000; includeSubDomains | A.1 | verified | Learn, IIS 10.0 v1709 HSTS (native `<hsts>`, includeSubDomains attribute) |
| 5 | `maxAllowedContentLength = 524288000` (500 MB) | A.1 | verified + context | Learn requestLimits: default 30,000,000 bytes |
| 6 | IIS W3C logs in `%SystemDrive%\inetpub\logs\LogFiles\` | A.1, D.5 | verified | Learn, Collect IIS logs (default `C:\inetpub\logs\LogFiles\W3SVC1`) |
| 7 | Logs "rolled daily" | D.5 | corrected | Daily is the default; Microsoft recommends hourly for AMA collection |
| 8 | SSH: `DISABLE_SSH = false`, `SSH_LISTEN_PORT = 2222` | A.2 | corrected | Built-in server also needs `START_SSH_SERVER = true` (default false) — cheat sheet |
| 9 | SSH keys via `POST /api/v1/user/keys` | A.2 | verified | Gitea API |
| 10 | `DISABLE_REGISTRATION = true`, `REQUIRE_SIGNIN_VIEW = true` | A.3 | verified | Cheat sheet (defaults true / false) |
| 11 | Hooks edited in browser at Settings → Webhooks → Git Hooks | A.3 | corrected | Git hook editing exists only with `DISABLE_GIT_HOOKS=false` (default true), which Gitea warns allows arbitrary code; program keeps default and deploys hooks via build |
| 12 | `POST /api/v1/admin/sources` registers LDAP and OIDC sources | A.4, B.1, B.2 | corrected | No such path in the API definition; use `gitea admin auth add-ldap/add-oauth` (CLI docs) |
| 13 | `/orgs` POST, `/repos/migrate` POST, `/orgs/{org}/teams` GET, `/admin/users` GET, `/repos/{owner}/{repo}/hooks` | A.4 | verified | Gitea API |
| 14 | Token auth header `token <PAT>`; `prohibit_login` on PATCH admin user | A.4, B.2 | verified (new) | Gitea API |
| 15 | `LFS_START_SERVER = true`; LFS on same listener | A.5 | verified | Cheat sheet (default false) |
| 16 | HttpPlatformHandler, `%HTTP_PLATFORM_PORT%`, `forwardWindowsAuthToken` | A.6 | verified + detail | Learn HttpPlatformHandler reference (header `X-IIS-WindowsAuthToken`, process closes handle, default false) |
| 17 | Program API contract (uvicorn, run.py, header list, logging) | A.6 | restated-as-design | Program files; not externally checkable |
| 18 | LDAPS source with bind DN, scoped base, admin filter; account created at first sign-in | B.1 | verified | CLI docs (required options list) |
| 19 | "Group memberships are synced on each sign-in" (LDAP) | B.1 | corrected | Restated: LDAP user sync via `cron.sync_external_users` (enabled, @midnight, UPDATE_EXISTING disables users missing from source) |
| 20 | "the dynamic group IT-INF-PLATFORM-CanonStewards" as LDAP admin filter | B.1 | corrected (wording) | AD has no dynamic groups; restated as an LDAP filter on the stewards group |
| 21 | OIDC app reg: AzureADMyOrg, callback `/user/oauth2/EntraID/callback`, groups optional claim | B.2 | restated-as-design | Program build; callback pattern consistent with source name |
| 22 | Scopes `openid profile email groups` | B.2 | corrected | `groups` is not a scope; groups come from the groups claim configuration (Learn optional claims / group claims) |
| 23 | Groups claim carries security-group memberships mapped to teams | B.2 | verified + corrected | Default values are object IDs; sAMAccountName / display-name options; overage at 200 for JWT; "Groups assigned to the application" recommended (Learn) |
| 24 | Gitea OIDC group mapping options (`--group-claim-name`, `--admin-group`, `--group-team-map`, `--group-team-map-removal`) | B.2 | verified | CLI docs. JSON shape of the team map not documented there; flagged in text |
| 25 | JML change reaches Gitea "within roughly fifteen minutes" | B.2; Group governance | corrected | Learn: dynamic membership usually a few hours, can exceed 24 h; plus directory sync; plus Gitea maps only at sign-in (no OAuth background sync in cheat sheet) |
| 26 | Leaver keeps PATs/SSH keys until account disabled | B.2 | restated-as-design | Consequence of #25; mitigation is program design (direct disable) |
| 27 | Dynamic groups require Entra ID P1 | B.2 | verified (new) | Learn, Create or update a dynamic membership group |
| 28 | Host is hybrid Entra joined (device object) | B.4 | corrected | Learn hybrid-join plan: supported Windows Server 2016/2019/2022; 2025 not listed. Attributes move to Arc tags (Book 01 Ch03) |
| 29 | Device extensionAttributes cloud-mastered; synced user onPremisesExtensionAttributes read-only in Graph | B.4 | verified | Learn, onPremisesExtensionAttributes resource type |
| 30 | Gitea service runs as gMSA | B.4, E.2 | verified (supportability) | Learn, Manage gMSA (SCM services, app pools, scheduled tasks); Gitea default is local system |
| 31 | Arc managed identity, local endpoint localhost:40342 | B.4 | verified (new) | Learn, managed identity on Arc servers |
| 32 | Only admins and "Hybrid agent extension applications" members can get tokens | B.4, E.2 | verified (new) | Learn, Arc identity and authorization |
| 33 | GPG validation via gpg4win 4.3.x in pre-receive | B.5 | corrected | Gitea natively verifies GPG/SSH signatures (no expiry/revocation checks) and branch protection "Require signed commits" rejects unsigned/unverifiable pushes; current Gpg4win 5.1.1 (2026-09-23) |
| 34 | Arc endpoints: his, guestconfiguration, management.azure.com for "resource updates, extension installs" | C.1 | corrected | Learn network requirements: management.azure.com only at connect/disconnect; Entra ID, guestnotificationservice, servicebus endpoints also always required |
| 35 | Arc projection lets Azure Policy and Defender for Servers Plan 2 reach the host | C.1, C.2 | verified | Book 05 Ch09 (settled) |
| 36 | "Guest Configuration" | C.2 | corrected (name) | Machine configuration (formerly Guest Configuration) — Book 05 Ch09 |
| 37 | Intune `windows10CompliancePolicy` on the host; 8 signals to events.data.microsoft.com | C.2 | corrected / removed | Intune supported platforms exclude Windows Server (Learn; Book 05 Ch09); plane removed and replaced by machine configuration and Defender |
| 38 | AMA as Arc extension `AzureMonitorWindowsAgent` | C.3 | verified | Book 05; Learn Arc AMA troubleshooting |
| 39 | AMA endpoints `*.ods.opinsights.azure.com` / `*.oms.opinsights.azure.com` | C.3 | corrected | Learn proxy settings (AMA bypass list): handler.control.monitor, ods, monitoring, DCE ingest; no oms |
| 40 | IIS log collection limits (W3C, no circular logging, X-Forwarded-For unsupported, rollover timing) | C.3 | verified (new) | Learn, Collect IIS logs |
| 41 | `gitea dump` single archive backup | C.4 | verified | CLI docs |
| 42 | Backup to Blob with Arc managed identity, 30-day retention, SQLite VSS path, RPO 24 h / RTO 4 h, hot standby | C.4 | restated-as-design | Program design |
| 43 | Arc, Monitor/Log Analytics, Policy guest configuration, Blob in Azure public FedRAMP High audit scope | Family C intro | verified (new) | Learn, Azure services compliance scope (Feb 2026) |
| 44 | Azure Commercial Cloud Class D (High); M365 GCC Class C | Family C intro | verified | products.json (F1209051525, MSO365MT) |
| 45 | GCC tenant uses Entra ID in Azure public | Boundary table | verified (new) | Learn, Planning identity for Azure Government applications (FAQ) |
| 46 | Boundary table: on-prem planes, Entra and Intune "GCC-Moderate" | Boundary table | corrected | On-prem = agency's own boundary; Entra = Azure public; Intune row removed |
| 47 | Pre-receive / update / post-receive invoked by git-receive-pack on push | D.1, F.1 | verified (new) | git-scm githooks |
| 48 | Hook rules table | D.1 | restated-as-design | Program rules; `classification`/`boundary` front-matter fields dropped (the program removed classification and boundary stamps) |
| 49 | Gitea protected branches: push allowlist, approvals, status checks, signed commits | D.1, B.5 | verified (new) | Gitea Protected branches |
| 50 | Webhooks HMAC-SHA256 signed | D.2 | verified | Gitea Webhooks (`X-Gitea-Signature`, `X-Hub-Signature-256`, custom Authorization header, manual redelivery) |
| 51 | Failed webhooks retried with exponential backoff | D.2 | corrected | Gitea docs describe manual redelivery only; automatic retry not documented |
| 52 | `repository_dispatch` to GitHub via webhook | D.2 | corrected | GitHub endpoint needs its own body and a token (classic: `repo` scope); Gitea webhook types don't include it; moved to post-receive/relay and egress allowlist |
| 53 | Drift reporter "runs under the Arc service principal" | D.3 | corrected | Scheduled task runs as the gMSA (gMSA supports scheduled tasks) and uses the Arc managed identity token |
| 54 | Drift taxonomy, SLA tickets, Phase 14 under validation | D.3, Group governance | restated-as-design | Program |
| 55 | Conformance adapter outputs; maps CA-7, CM-8, AU-2, AU-6, SI-4 | D.4 | restated-as-design | Program; control IDs exist in SP 800-53 Rev 5 |
| 56 | PowerShell 7.4 administrative shell | E.1 | corrected | Learn lifecycle: 7.6 LTS (EOS Nov 14, 2028); 7.4 EOS Nov 10, 2026 |
| 57 | Execution policy AllSigned at user scope | E.1 | corrected | Learn about_Execution_Policies: Process/CurrentUser user-settable; Group Policy not overridable; 5.1 and 7 separate settings |
| 58 | AppLocker publisher allowlist + WDAC UMCI | E.1 | corrected (name, emphasis) | Learn: App Control for Business (formerly WDAC) preferred; AppLocker security fixes only |
| 59 | `gitea service install` | E.2 | corrected | No such command (CLI docs); register with `sc.exe` (Gitea Windows service docs) |
| 60 | `gitea generate secret` for JWT / internal token | E.2 | verified | CLI docs (INTERNAL_TOKEN, JWT_SECRET, SECRET_KEY) |
| 61 | Delayed start; absolute SQLite path recommended | E.2, E.4 | verified (new) | Gitea Windows service docs |
| 62 | gMSA `sc.exe config obj= ... password= ""` | E.2 | unverifiable (syntax) | gMSA support for SCM services verified; the empty-password `sc.exe` form is common practice but not on an opened Microsoft page. Kept in an illustrative block |
| 63 | `Install-ADServiceAccount`, `Test-ADServiceAccount` | E.2 | verified (existence) | Learn (Service Fabric gMSA example uses both) |
| 64 | "Web Server (IIS) Tools RSAT group membership on the gMSA" for adapter read access | E.3 | restated | No such group verified; restated as a scoped group membership |
| 65 | Pull mirror via `/repos/migrate`, `mirror_interval = 15m0s` | F.1 | verified + context | API (MigrateRepoOptions: mirror, mirror_interval); MIN_INTERVAL 10m, DEFAULT 8h (cheat sheet) |
| 66 | Mirrored commits "verified by the same hook chain" | F.1 | corrected | Receive hooks run on push only (githooks); pull mirrors read-only (Gitea forum answer, from search results). Promotion-by-push design added |
| 67 | Database profiles (PostgreSQL / SQLite) | F.2 | verified (DB types) / restated-as-design | Cheat sheet DB_TYPE values; profiles are program design |
| 68 | Supply-chain host list, pinned SHA-256 | F.3 | restated-as-design | Program manifest |
| 69 | Inbound ports and WinRM 5986 | Inbound posture | restated-as-design | Program; 5986 is WinRM HTTPS |
| 70 | NIST SP 800-53 Rev 5 control IDs | Control crosswalk | verified (citation) | csrc.nist.gov (Rev 5, release 5.2.0 Aug 27, 2025); mapping is program's |
| 71 | Intune row CM-6, SI-2, SI-7 | Control crosswalk | corrected | Intune row removed; CM-6 to machine configuration, SI-2 via Update Manager (Book 05) |
| 72 | Group names NCR-IT-InfraOps-* vs IT-INF-PLATFORM-* | Group governance | corrected (consistency) | Source used two sets; one set chosen |
| 73 | "Microsoft additionally warns against keying dynamic-group rules on attributes writable elsewhere" | Group governance | removed | Not found on an opened Microsoft page; the one-writer mitigation kept as program design |
| 74 | KSI families (CA-7, CM-8, AU-2/AU-6, SI-4, RECIP v0.6.0) | Group governance | restated-as-design | Program library; RECIP family and version dropped (cross-link target is another book's chapter, not needed here) |
| 75 | Azure DevOps Server "retired post-2020" | Other options | corrected | Learn release notes: Azure DevOps Server RTW Dec 9, 2025 |
| 76 | Azure DevOps Services / GitHub SaaS "excluded by boundary" | Other options | corrected / restated-as-design | GitHub Enterprise Cloud Class B (LI-SaaS), GitLab Dedicated for Government Class C (products.json); exclusion restated as program design |
| 77 | GHES Linux appliance; GitLab/Bitbucket heavier footprint | Other options | restated-as-design | Program assessment |
| 78 | Option A delta table | Other options | restated-as-design | Program |
| 79 | Review fix, Oct 21, 2026: "a pull mirror is read-only, updated only by its sync" rested on a Gitea forum answer | F.1 Mirror | verified (primary source replaced forum) | The docs page doesn't state read-only (re-checked <https://docs.gitea.com/usage/repo-mirror>: the repository "gets mirrored periodically" and **Synchronize Now** forces a sync). Opened Gitea source at commit 0948aed: `routers/web/repo/githttp.go` L202-205 answers a non-pull HTTP request to a mirror with 403 "mirror repository is read-only," <https://github.com/go-gitea/gitea/blob/0948aed411afbcac956c3c9a76cadf5260c6452f/routers/web/repo/githttp.go#L202-L205>; `routers/private/serv.go` L171-175 refuses SSH write access, "Mirror Repository %s is read-only," <https://github.com/go-gitea/gitea/blob/0948aed411afbcac956c3c9a76cadf5260c6452f/routers/private/serv.go#L171-L175>. Forum citation removed; new note [^aB-gitea-mirror-ro] asks for a test push on the host's version. |
| 80 | Review fix 2, Oct 21, 2026 (revision-history trim): all "the earlier version said/listed/used..." asides in families A to F and the alternatives table (inventory note, SSH settings, hook editing, `/admin/sources`, OIDC scopes and four-points lead-in, propagation time, device object, Gpg4win, `management.azure.com`, Intune plane, AMA endpoints, webhook retries and dispatch, PowerShell 7.4, execution policy, `gitea service install`, mirror hook chain, "GCC-Moderate" labels, control mapping, group names, Azure DevOps Server) | Throughout | wording-only | Each restated as current guidance; a short clause kept where it corrects a common assumption (`groups` isn't a scope; Azure DevOps Server wasn't retired after 2020; no hybrid join for Windows Server 2025). Every fact in the rewritten sentences was already footnoted and is unchanged; the old wording is recorded here as revision history. No new note. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, canon-source/derived-from | — | Internal provenance; not published |
| Problem, solution, ask | What this reference covers (closed-list position); Closing position | Ask about the v1.3/v1.5 build-guide currency gap dropped (internal canon housekeeping) |
| Scope callout (Option A/B) | What this reference covers; Other options | |
| Executive summary + family table | The six families at a glance | Intune and hybrid-join planes removed (#28, #37); PostgreSQL/SQLite moved to F.2 |
| Provenance note | — | Internal canon-currency note; not reader-facing |
| Canonical claim | What this reference covers | |
| §1.1 One host, six families | What this reference covers; E.1 (application control) | Tier 0 posture details defer to Book 01 Ch03 |
| §1.2 Single substrate authority / DR | C.4 (recovery targets, hot standby) | Architecture argument lives in Book 01 Ch03, linked |
| §2.1 HTTPS Smart HTTP | A.1 (table + web.config) | Header list corrected (#3) |
| §2.2 SSH + callout "Why two transports?" | A.2 (+ app.ini) | Config corrected (#8) |
| §2.3 Web UI | A.3 | Hook-editing claim corrected (#11) |
| §2.4 REST API + table | A.4 | `/admin/sources` removed (#12); leaver endpoint added |
| §2.5 LFS | A.5 | |
| §2.6 Optional FastAPI plane | A.6 | Source file/line references dropped |
| §3.1 AD LDAPS | B.1 (+ add-ldap block) | Sync behavior corrected (#19) |
| §3.2 Entra OIDC | B.2 (+ add-oauth block) | Scopes, claim values, overage, timing corrected (#22–#25) |
| §3.3 Kerberos/NTLM for FastAPI | B.3 | |
| §3.4 Hybrid Entra device join | B.4 | Corrected (#28); attribute distinction kept (#29) |
| §3.5 GPG | B.5 | Corrected (#33) |
| §3.6 Identity matrix | B.6 | Arc row restated (#53) |
| §4.1 Azure Arc | C.1 | Endpoints corrected (#34) |
| §4.2 Azure Policy + Guest Configuration | C.2 | Name updated (#36) |
| §4.3 Intune compliance attestation | C.2 (as a correction) | Plane removed (#37) |
| §4.4 Azure Monitor Agent | C.3 | Endpoints corrected (#39); IIS collection details added |
| §4.5 Azure Blob backup | C.4 | |
| §5.1 Server-side hooks + table | D.1 | Front-matter fields trimmed (#48); push-only behavior added (#47) |
| §5.2 Webhooks | D.2 | Retry and dispatch corrected (#51, #52) |
| §5.3 FMP_163 drift reporter | D.3 | Identity corrected (#53); internal doc IDs dropped |
| §5.4 Conformance adapter | D.4 | Internal spec paths dropped |
| §5.5 IIS W3C logs | D.5 | Rollover corrected (#7) |
| §6.1 PowerShell 7.4 | E.1 | Version and execution policy corrected (#56, #57) |
| §6.2 Gitea CLI | E.2 (+ service block) | `service install` corrected (#59) |
| §6.3 IIS Manager/appcmd | E.3 | RSAT-group claim restated (#64) |
| §6.4 Storage + table | E.4 | |
| §7.1 GitHub pull mirror | F.1 (+ mirror block) | Hook-chain claim corrected (#66) |
| §7.2 Relational backend | F.2 | |
| §7.3 Build-time supply chain | F.3 | |
| §8.1 Boundary table | Boundary and egress posture | Corrected (#46); FedRAMP-scope facts added (#43–#45) |
| §8.2 Egress allowlist | Runtime egress allowlist | api.github.com added (#52) |
| §8.3 Inbound posture | Inbound posture | |
| §9.1 NIST crosswalk | Control crosswalk | Intune row replaced (#71) |
| §9.2 Group governance | Group governance | Names unified (#72); timing corrected (#25); Microsoft warning removed (#73); hybrid-sync-trap link replaced by Book 03 Ch08 link |
| §9.3 KSIs | Group governance (closing paragraph) | RECIP family dropped (#74) |
| §10 Disposition vs other options | Other repository options | ADO Server and SaaS corrected (#75, #76) |
| §11 Closing position | Closing position | |
| Appendix A — Provenance table | — | Internal repository paths and canon IDs; not reader-facing |
| Appendix B — Option A delta | Other options → The CGI option's smaller surface | |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (capi) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-capi |
