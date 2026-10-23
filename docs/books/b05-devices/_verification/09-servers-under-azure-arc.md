# Verification — Chapter 09, Servers Under Azure Arc

Sources: `docs/operational-guides/intune-arc-modernization/index.md`; the server parts of `governed-path.md` and `manual-path.md` in that folder; the server parts of `docs/guides/device-and-server-modernization/manual-path.md`. Non-server sections (NTLM, SPN, SQL engine hardening, Conditional Access, workstation enrollment) belong to Chapter 05 (three-path runbook) and are noted below. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Intune doesn't support Windows Server | Opening | verified | Intune supported platforms |
| 2 | Arc server has Azure resource ID, sits in a resource group, managed like Azure VMs | Opening; changes table | verified | Arc servers overview |
| 3 | Arc server has a system-assigned managed identity | Changes table | verified | Arc cloud-native identity-access |
| 4 | Arc outage impairs management only, not workload | Changes table | verified | Connected Machine agent overview |
| 5 | Extensions run with full privileges; Contributor = indirect admin | Changes table; roles | verified | Arc security identity-authorization |
| 6 | Azure is the source of truth for the agent | What Arc changes | verified | Arc security overview |
| 7 | Heartbeat 5 min; Disconnected 15–30 min; Expired after 45 days; credential up to 90 days, renews every 45 | What Arc changes | verified | Arc servers overview |
| 8 | "Arc connectivity is free; extensions incur cost" | Plan cost | restated (linked to Ch05's verified licensing table instead of re-asserting) | Ch05 |
| 9 | WSM by Arc: Update Manager, Change Tracking, Machine Configuration free for WS2012+ with SA/subscription/PAYG; attestation required | Plan cost | verified | Windows Server Management enabled by Azure Arc |
| 10 | Onboarding role can read/create only; Resource Administrator can modify/delete | Roles | verified | Arc security identity-authorization |
| 11 | VM Admin/User Login roles; Owner/Contributor don't confer sign-in | Roles; Entra sign-in | verified | howto-arc-sign-in-windows; ssh-arc-overview |
| 12 | CAF warns Contributor/Owner/Resource Admin delegate root via extensions | Roles | verified | CAF Arc IAM |
| 13 | Outbound TCP 443; service tags incl. AzureFrontDoor.Frontend (April 2026); proxy doesn't add security; private link scope | Network | verified | Arc network requirements (consolidated) |
| 14 | `azcmagent check --location`, `--extensions sql`, `--cloud` values | Network | verified | azcmagent check reference |
| 15 | Dedicated resource group recommendation | Resource groups and tags | verified | CAF Arc automation |
| 16 | Tag taxonomy | Resource groups and tags | restated-as-design | source manual path §2 |
| 17 | Tags stored as plain text | Resource groups and tags | verified | Arc security-onboarding |
| 18 | SQL auto-connect and `ArcSQLServerExtensionDeployment=Disabled` opt-out | Resource groups and tags | verified | Arc deployment options |
| 19 | Golden image / cloning / 429 / force-local-only fix | Images and cloning | verified | Connected Machine agent overview |
| 20 | Onboarding methods list | Choose a method | verified | Arc deployment options |
| 21 | SP used only during onboarding; credential only needed at connect | Create the SP | verified | onboard-service-principal; security-onboarding |
| 22 | `az ad sp create-for-rbac --role "Azure Connected Machine Onboarding" --scopes` | Create the SP | verified (`--create-cert` is a standard az CLI flag; not separately footnoted) | onboard-service-principal |
| 23 | Certificates preferred over secrets (controllable by CA); published examples create 1-year secret | Create the SP | verified | security-onboarding; onboard-service-principal |
| 24 | Creating SP needs app-registration rights or App Admin/Cloud App Admin; role assignment needs Owner/UAA | Create the SP | verified | onboard-service-principal |
| 25 | Stolen credential lets attacker onboard outside servers; private endpoints mitigate | Create the SP | verified | security-onboarding |
| 26 | Source: SP secret in GPO startup script readable via SYSVOL | Protect the credential | restated (kept as warning for hand-built scripts; corrected that Microsoft's GPO method encrypts the config for computer accounts) | security-onboarding |
| 27 | Disable the onboarding GPO after servers connect | Protect the credential | verified | onboard-group-policy-powershell |
| 28 | `azcmagent connect` flags (cert, thumbprint, tenant, subscription, RG, location, cloud, tags); no password-protected certs; resource name fixed | Connect | verified | azcmagent connect reference |
| 29 | Local agent security controls; intended for DCs, payment, strict change control; Custom Script/Run Command run as SYSTEM/root | Lock down | verified | Arc extensions security |
| 30 | `azcmagent config set extensions.allowlist ... --add`; `incomingconnections.enabled false` | Lock down | verified | azcmagent config reference |
| 31 | Machine configuration = formerly Guest Configuration; DSC; scoped by Azure scope not OU | Azure Policy | verified | Arc cloud-native governance-policy |
| 32 | Machine configuration agent native in Connected Machine agent | Azure Policy | verified | Connected Machine agent overview |
| 33 | Built-in baseline definitions; customizable; CIS Linux preview; prerequisite initiative | Azure Policy | verified | Machine configuration deploy baseline |
| 34 | Guest assignments stored 14 days while disconnected | Azure Policy | verified | Connected Machine agent overview |
| 35 | Update Manager: 24-hour periodic assessment, scheduled patching, dynamic scoping by tags | Update Manager | verified | Update Manager FAQ |
| 36 | Update Manager billing and exemptions (ESU, DfS P2 on subscription, SA/PAYG) | Update Manager | verified | Update Manager FAQ |
| 37 | Hotpatch via Arc not subject to WSM licensing rules | Update Manager | verified | WSM overview (billing note) |
| 38 | DfS Plan 1 vs Plan 2 features | Defender for Servers | verified | plan-defender-for-servers-select-plan |
| 39 | Auto-onboards MDE extension to Arc machines; Microsoft recommends P2 | Defender for Servers | verified | onboard-server (MDE) |
| 40 | Direct MDE install → Plan 1 functionality (+ premium MDVM under P2) | Defender for Servers | verified | tutorial-enable-servers-plan |
| 41 | MDE security settings management unavailable if MDE only via DfS; supports WS2012 R2+, not Server Core 2016 and earlier | Defender for Servers | verified | security-settings-management |
| 42 | Source: DfS Plan 2 and Defender for SQL in FedRAMP Moderate scope | Defender for Servers | restated-as-design | program scope |
| 43 | WS2012/R2 ESU ended Oct 13, 2026; licenses deactivated Oct 14 UTC | ESU | verified | prepare-extended-security-updates |
| 44 | WS2016 EoS Jan 12, 2027; ESU to 2030; portal config from Aug 3, 2026; billing Jan 13, 2027; agent 1.62+ | ESU | verified | prepare-extended-security-updates |
| 45 | SQL 2014 ESU to July 2027; SQL 2016 ESU year 1 from July 14, 2026 to July 17, 2029 | ESU | verified (Microsoft pages differ on the exact July 2027 day — July 8 vs July 12 — so the chapter says "July 2027") | SQL ESU FAQ; lifecycle SQL ESU FAQ |
| 46 | ESU purchase requires SA (or SPLA/server subscription); no VDI via Arc, use MAK; reduced endpoints; Allow/None allowlist | ESU | verified | prepare-extended-security-updates; agent release notes archive 1.35 |
| 47 | Entra sign-in: Server 2025+ with Desktop Experience or Win 11 24H2; Azure Global and Government; SMI required; AADLoginForWindows with mdmId; machine becomes Entra joined; not for domain-joined; members of same tenant only; client join requirements; CA not supported | Entra ID sign-in | verified | howto-arc-sign-in-windows |
| 48 | Source implied Server 2025 Arc servers get Conditional Access via Entra join | Entra ID sign-in | corrected (CA not supported with the extension on Arc) | howto-arc-sign-in-windows |
| 49 | `az connectedmachine extension create` with publisher/type | Entra ID sign-in (code) | verified for the Linux form; Windows settings JSON follows the documented ARM template (`settings.mdmId`) | ssh-arc-overview; howto-arc-sign-in-windows |
| 50 | Linux: SSH via Arc, AADSSHLoginForLinux, role scope recommendation, PIM | Linux | verified | ssh-arc-overview |
| 51 | Linux distributions supported for Entra SSH login; Azure Gov | Linux | verified | howto-vm-sign-in-azure-ad-linux |
| 52 | Rollback: remove extensions first; disconnect deletes resource; force-local-only; artifacts remain | Rollback | verified (source said "disconnect then uninstall"; extension-removal step and permission note added) | uninstall-agent; azcmagent disconnect; agent overview |
| 53 | L0–L4 ladder, L3 ceiling, approval references, kit script names and behavior | Manual and governed paths | restated-as-design | program design (governed-path §3, §6) |
| 54 | Agent versions supported within last year; auto-upgrade preview; Resource Health alerts | Monitoring | verified | Connected Machine agent overview |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| index.md intro (OrgMod workstream; platforms already run) | Ch09 opening (platform list implicit) | OrgMod hub framing is Ch05/book index material |
| index.md "runnable two ways"; download-kit callout | Ch09 "The manual and governed server paths" (kit scripts named) | Kit download link not carried: the kit isn't in the public workbook |
| index.md pages table; "How the two paths relate" | Ch05 (three-path comparison) | Linked from Ch09 |
| index.md terminology note (control plane governs) | Ch05 | Covered there; Ch09 links |
| governed-path §1 one rule | Ch05 | Ch09 relies on Ch05; restates "Azure is the source of truth for the agent" |
| governed-path §2 providers table | Ch05 | |
| governed-path §3 actuation ladder | Ch09 server-rung table (+ Ch05 ladder figure) | |
| governed-path §4 reconciliation loop | Ch10 | Monitoring/evidence chapter |
| governed-path §5 draft-term mapping | Ch05 | Not server-specific |
| governed-path §6 running the governed path (Arc onboarding with `-ApprovalRef`) | Ch09 "The manual and governed server paths" | NTLM restriction example → Ch05 |
| governed-path §7 outcomes | Ch09 governed-path paragraph (traceable to approval; evidence) | CA outcome → Ch05/Book 04 |
| governed-path §8 rollback (Arc back-out; governance seam) | Ch09 "Rollback" and governed-path paragraph | Intune/CA/NTLM back-outs → Ch05 |
| governed-path §9 L3 ceiling callout | Ch09 server-rung table | |
| governed-path §9 FedRAMP Moderate scope callout (DfS P2, Defender for SQL) | Ch09 Defender for Servers (program scope) | CA/P2/PIV/FIPS items → Book 04/Ch10 |
| governed-path §9 FedRAMP 20x KSI table (KSI-SVC-ACM etc.) | Ch10 | Evidence chapter; Ch09 points to Ch10. CR26 counts/dates not re-verified here |
| manual-path §0 phases and run order; module install | Ch05 | Ch09 server steps fit Ch05's phases |
| manual-path §1 assessment warning (two weeks) | Ch05 | Not server-specific |
| manual-path §1 licensing | Ch09 "Plan cost by service" (+ Ch05 table) | "Connectivity is free" not re-asserted; Ch05 holds the verified line |
| manual-path §1 roles (Arc onboarding role) | Ch09 "Roles" | Intune/CA/Hybrid Identity roles → Ch05 |
| manual-path §1 baseline scripts | Ch05 | Non-server audits |
| manual-path §2 Arc onboarding (outbound 443, resource type, non-domain-joined note, scripts, SYSVOL warning, tag taxonomy) | Ch09 "What Arc changes", "Before you onboard", "Onboarding" | `agency.gov`-style names replaced with neutral examples |
| manual-path §3 Intune endpoint modernization | Ch05 / Ch08 | Workstations |
| manual-path §4 NTLM; §5 SPN | Ch05 (and Book 02) | Identity hardening, not server onboarding |
| manual-path §6 SQL hardening (Arc-connect SQL hosts; Defender for SQL) | Ch09 tags (SQL auto-connect) and Defender for Servers | Engine hardening checklist → Ch05 |
| manual-path §7 Conditional Access baseline | Ch05 / Book 04 | |
| manual-path §8 monitoring (Arc heartbeat to Log Analytics) | Ch09 "Monitoring the server estate"; Ch10 | |
| manual-path §9 rollback (Arc) | Ch09 "Rollback" | Corrected order (extensions first) |
| manual-path §10 what you must configure (subscription, RG, location/cloud) | Ch09 kit paragraph; `--cloud` values | |
| guides manual-path §1–2 (server parts, de-branded twin) | Consolidated into the above | Duplicate of the operational-guides manual path |
| guides manual-path §3–10 (non-server) | Ch05 | |
| (new) Defender for Servers, Update Manager, WSM, ESU, Entra sign-in, local agent controls | Ch09 sections | Added per assignment |
| (new) Figures | `ch09-arc-management-plane`, `ch09-onboarding-wave` | |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed; Arc sign-in CA assumption kept as a common assumption | Entra ID sign-in section | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- The source material treated Entra ID sign-in on Arc servers as bringing them under workstation Conditional Access.

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (capi) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-capi |
| 3 | CyberArk mechanism (drivers) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-drivers |
