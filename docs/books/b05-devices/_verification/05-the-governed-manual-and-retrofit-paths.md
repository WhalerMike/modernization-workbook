# Verification — Chapter 05, The Governed, Manual and Retrofit Paths

Checked October 20, 2026. Sources: `docs/operational-guides/intune-arc-modernization/` (index, README,
governed-path, manual-path, intune-arc-governed-path, intune-arc-manual-path, intune-arc-retrofit-path) and
`docs/guides/device-and-server-modernization/` (README, governed-and-retrofit-paths, manual-path). The two
manual-path pages are near-duplicates (the guides copy is a de-branded rewrite) and were consolidated; the three
short `intune-arc-*` twins were folded into the fuller pages.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The program is an active reconciliation control plane; governs, doesn't sit inline | One end state | restated-as-design | Program definition (source index/governed-path) |
| 2 | Provider-incorporation table (Entra, Intune, Azure Policy/Arc, AD roles) | One end state | restated-as-design | Program design; runtime roles are standard product functions |
| 3 | Four phases Observe/Onboard/Harden/Watch | What every path shares | restated-as-design | Program runbook; matches endpoint-device-plan.md |
| 4 | Budget ≥2 weeks assessment; skipping assessment is "the single most common cause of failed modernization" | Rules | restated-as-design | Reworded as the program's observation; no external statistic |
| 5 | Microsoft's stale-Arc cleanup script uses a -WhatIf pass | Rules | verified | Learn, Uninstall the Connected Machine agent (Remove stale server resources) |
| 6 | Report-only CA is evaluated and logged but not enforced | Rules; CA baseline | verified | Learn, Analyze Conditional Access policy impact |
| 7 | ≥2 cloud-only emergency accounts; exclude from blocking CA; report-only needs no exclusion | Rules; CA baseline | verified | Learn, Manage emergency access accounts |
| 8 | Source: break-glass accounts use "long unique passwords" | CA baseline | corrected | Learn emergency access: .onmicrosoft.com, phishing-resistant FIDO2/CBA, alerts, validate every 90 days |
| 9 | Source: Intune requires "M365 E3 minimum" | Licensing | corrected | Learn, Intune licensing: three plans (Plan 1 base); usually via M365 E3/E5/E7 bundles |
| 10 | Enforcing compliance needs Intune + Entra ID P1/P2 | Licensing | verified | Learn, Intune planning guide Step 3 |
| 11 | Risk-based CA requires Entra ID P2 | Licensing | verified | Learn, Require MFA for elevated sign-in risk |
| 12 | Source: "E5 adds Defender for Endpoint P2" | Licensing | corrected | Learn planning guide: Defender for Endpoint included in M365 E5 (plan tier not stated there; dropped "P2") |
| 13 | Source: "Arc connectivity is free; extensions incur cost" | Licensing | corrected | Learn, Azure Arc overview Pricing: control-plane functions free; Azure services used on Arc servers billed |
| 14 | Machine configuration/Update Manager/Change Tracking included with SA or PAYG after attestation; else purchased | Licensing | verified | Learn, Windows Server Management enabled by Azure Arc (Billing) |
| 15 | Defender for Servers Plan 2 / Defender for SQL on machines need Arc for on-prem | Licensing; SQL | verified | Learn, Protect servers with Defender for Servers; Enable Defender for SQL Servers on Machines |
| 16 | Source: endpoints via "Intune Administrator (via PIM)" | Roles | corrected | Learn, Intune RBAC overview: don't use Intune Administrator for day-to-day; use built-in/custom Intune roles |
| 17 | Azure Connected Machine Onboarding: create/read only, no extensions/delete; assign to onboarding SP | Roles; Arc | verified | Learn, Arc security — Identity and authorization |
| 18 | Conditional Access Administrator, Hybrid Identity Administrator exist and scope | Roles | verified | Learn, Microsoft Entra built-in roles |
| 19 | NTLMv1 audit via logon success auditing, Event ID 4624 | Phase 1 | verified | Learn, Audit use of NTLMv1 on a DC |
| 20 | Restrict NTLM audit policies log would-be-blocked requests in NTLM Operational log | Phase 1 | verified | Learn, Policy CSP LocalPoliciesSecurityOptions (RestrictNTLM_AuditIncomingNTLMTraffic) |
| 21 | setspn -L / -Q / -X; forest-wide duplicate search slow | Phase 1 | verified | Learn, KDC_ERR_S_PRINCIPAL_UNKNOWN / NOT_UNIQUE |
| 22 | CMA outbound TCP 443; connections outbound | Arc | verified | Learn, Connected Machine agent network requirements |
| 23 | Arc server = Microsoft.HybridCompute/machines resource; machine configuration targets it | Arc | verified | Learn, Machine Configuration prerequisites |
| 24 | Arc servers get a system-assigned managed identity | Arc | verified | Learn, Identity and access management with Arc-enabled servers |
| 25 | Arc servers run non-domain-joined in the target | Arc | restated-as-design | Program target architecture |
| 26 | Onboarding SP with Azure Connected Machine Onboarding scoped to landing zone | Arc | verified | Learn, Connect machines at scale using Group Policy |
| 27 | Onboarding credential needed only at connect; server stays connected if it expires | Arc | verified | Learn, Arc Planning and deployment guidance (security-onboarding) |
| 28 | Source: "retrieve SP secret from Key Vault at runtime" | Arc warning | corrected | Learn security-onboarding: prefer certificates, config file, GPO method encrypts config for computer accounts; Key Vault runtime retrieval not documented for onboarding (Arc baseline says Key Vault secret store integration not supported for this service) |
| 29 | Tags are plain text; don't store secrets | Arc | verified | Learn security-onboarding |
| 30 | Source: "Guest Configuration initiative" | Arc baseline | corrected | Learn: now Azure machine configuration (formerly Azure Policy Guest Configuration) |
| 31 | Built-in policy "Windows machines should meet requirements of the Azure compute security baseline" | Arc baseline | verified | Learn, Azure Policy built-ins for Arc-enabled servers |
| 32 | Defender for Servers Plan 2 drives MCSB OS baseline recommendations | Arc baseline | verified | Learn, Install the Azure machine configuration extension (Defender for Cloud) |
| 33 | Tag taxonomy list | Arc | restated-as-design | Program convention |
| 34 | GPO-triggered enrollment for hybrid joined devices: no user interaction; recommended where not using ConfigMgr; Entra join recommended with Autopilot | Intune | verified | Learn, Step 5 – Enroll devices in Intune |
| 35 | GPO path "Enable automatic MDM enrollment using default Microsoft Entra credentials" | Intune | verified | Learn, Enroll a Windows device automatically using Group Policy |
| 36 | dsregcmd /status AzureAdJoined YES, DomainJoined YES | Intune | verified | Learn, Troubleshooting GPO-based auto-enrollment |
| 37 | Source: "MDMUrl set" in dsregcmd check | Intune | removed | Not in the verified troubleshooting text; dropped |
| 38 | Intune LAPS backs up to Entra or AD, rotates on schedule | Intune | verified | Learn, Intune support for Windows LAPS |
| 39 | Source profile specifics (XTS-AES-256, signature age ≤3 days, "CIS-L1 equivalent") | Intune | restated-as-design | Kept as the program's baseline order without vendor-claim specifics; cipher strength and signature age removed as unverified tunables |
| 40 | Mark device noncompliant schedule 0–365 days; CA acts after | Intune | verified | Learn, Configure actions for noncompliant devices |
| 41 | Source: GPO/Intune overlap is "last-writer-wins" | GPO conflict | corrected | Learn: GP wins over MDM by default (enroll-via-GP page); MDMWinsOverGP applies only to Policy CSP; race condition otherwise (ControlPolicyConflict CSP) |
| 42 | WHfB in PassportForWork CSP; mixing GPO and CSP leaves CSP unapplied until GP cleared | GPO conflict | verified | Learn, Configure Windows Hello for Business |
| 43 | Source: NTLM "most-exploited authentication weakness" (relay, PtH, PetitPotam) | NTLM | removed | Superlative unverified; replaced by Microsoft deprecation facts |
| 44 | Source: federal NTLM elimination deadline 2027-04-01, FedRAMP Notice 0009 | NTLM | removed | fedramp.gov Notice 0009 is "Initial Outcome from RFC-0024 Rev5 Machine-Readable Packages" (2026-03-25), not NTLM; no FedRAMP NTLM deadline found; source URL /20x/notice-0009/ returns 404 |
| 45 | NTLM all versions deprecated; Negotiate; NTLMv1 removed 24H2 / WS2025 | NTLM | verified | Learn, Deprecated features for Windows client |
| 46 | Source: LmCompatibilityLevel 5 = "DC refuses LM & NTLM" = block all | NTLM table | corrected | Learn, How to enable NTLM 2 authentication: level 5 refuses LM and NTLM(v1), accepts NTLMv2; level 4 refuses LM only; blocking is done by Restrict NTLM policies |
| 47 | Seven NTLM policies; DC/server/client roles; exception lists for client and DC | NTLM table | verified | Learn, Status code 0x32 and you can't join a domain |
| 48 | LAN Manager level and Restrict NTLM are Policy CSP settings (deliverable by Intune) | NTLM | verified | Learn, Policy CSP LocalPoliciesSecurityOptions |
| 49 | CA can't block on-prem NTLM; blocks legacy auth to cloud apps | NTLM | verified | Consistent with Book 02 Ch03 (Learn CA overview/on-prem SSO); stated without new footnote, report-only and CA docs cover legacy-client blocking |
| 50 | Source: "a duplicate SPN … silently falls back to NTLM" | SPN | corrected | Learn SSPI-context FAQ: missing SPN → NTLM fallback; KDC page: duplicates → KDC_ERR_PRINCIPAL_NOT_UNIQUE; gMSA page: one owner per SPN |
| 51 | klist purge, sys.dm_exec_connections auth_scheme = KERBEROS | SPN | verified | Learn, Register an SPN for Kerberos connections; gMSA troubleshooting |
| 52 | SQL hardening checklist items (xp_cmdshell, OLE, CLR, cross-DB chaining, DB Mail XPs, sa) | SQL | restated-as-design | Program audit checklist |
| 53 | Entra auth for SQL 2022+ is a separate track | SQL | restated-as-design | Program scoping; linked to SQL Server narrative |
| 54 | CA baseline policy set | CA | restated-as-design | Program baseline; Book 04 owns design |
| 55 | Arc rollback: remove extensions first; azcmagent disconnect deletes resource and resets agent | Rollback | verified | Learn, Uninstall the Connected Machine agent; azcmagent disconnect |
| 56 | Source: NTLM rollback "revert LmCompatibilityLevel to 3" | Rollback | corrected | Follows from #46: the blocking control is Restrict NTLM; relax it to audit or add an exception |
| 57 | Actuation ladder L0–L4, federal L3 ceiling, approval check behavior | Governed | restated-as-design | Program design |
| 58 | Intune Multi Admin Approval: protected resources list; requester can't self-approve; GA/Intune Admin still need approver; applies to Graph app-auth | Governed | verified | Learn, Use access policies to require multi admin approval |
| 59 | Six-phase drift loop, dry-run default | Governed | restated-as-design | Program design |
| 60 | Kit script names (Invoke-ArcOnboarding.ps1 etc.) | Governed | restated-as-design | Program companion kit, not shipped in workbook; flagged in text as not Microsoft cmdlets |
| 61 | CR26: 46 KSIs, 10 themes; named KSI titles | Governed | verified | fedramp.gov, Key Security Indicators (Consolidated Rules for 2026) |
| 62 | Source: CR26 "mandatory for all FedRAMP stakeholders from 2027-01-01" | Governed | corrected | fedramp.gov FedRAMP Certification: initial certification 2026-07-04; maintaining ongoing certification 2027-01-01; rules apply to cloud service offerings |
| 63 | KSI → kit evidence mapping | Governed | restated-as-design | Program claim, labeled as such |
| 64 | Source: "FedRAMP Moderate scope … P2, PIV-only, FIPS, extended retention belong to a FedRAMP High posture" | Governed | restated-as-design | Kept as the kit's deliberate scope boundary; the claim that these "belong to High" removed (unverified, and FIPS-validated crypto is not High-only) |
| 65 | Retrofit steps 1–6; no re-enrollment | Retrofit | restated-as-design | Program design |
| 66 | Choosing table; "larger than a few hundred devices" threshold | Choose | restated-as-design | Program guidance |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| intune-arc index — intro (OrgMod workstream, platforms named) | Opening; One end state | "OrgMod" hub name dropped (not linked in this book) |
| intune-arc index — "runnable two ways" | Three paths; diagram | — |
| intune-arc index — "Download the runnable kit" callout | Governed path, kit note | Download link not carried: kit isn't published with the workbook |
| intune-arc index — The pages table | — | Navigation only, superseded by chapter structure |
| intune-arc index — How the two paths relate | Opening; manual/governed sections | — |
| intune-arc index — Terminology | One end state; Terms used | Expansion of the program acronym not carried (program-name rule) |
| intune-arc README — three-path table + intune-arc-paths.svg | Three paths diagram (ch05-three-paths) | Old SVG replaced with house-style diagram |
| intune-arc-governed-path (short twin) — all sections | Governed path; outcomes list | Consolidated into the fuller governed-path content |
| intune-arc-manual-path (short twin) — Purpose, Phases, Operating rules, Bottom line | Four phases; Rules; Manual path | Consolidated |
| intune-arc-retrofit-path — Purpose, Why this works, Steps, Bottom line | Retrofit path (all six steps) | — |
| governed-path — "What the program is" callout | One end state | Rejected expansions of the acronym not carried (program-name rule) |
| governed-path §1 control plane governs | The rule all three obey | — |
| governed-path §2 providers incorporated | Provider table | — |
| governed-path §3 actuation ladder | The actuation ladder; diagram ch05-actuation-ladder | — |
| governed-path §4 reconciliation loop | The reconciliation loop | — |
| governed-path §5 mapping draft model to canon | Mapping the source's model | "Canon"/ADR references dropped |
| governed-path §6 running the governed path (code) | Reconciliation loop code block | Flagged as kit, not Microsoft cmdlets |
| governed-path §7 outcomes | What the governed path adds | — |
| governed-path §8 rollback (two layers) | Rolling back the governed path; shared Rollback | NTLM back-out corrected |
| governed-path §9 L3 ceiling callout | Actuation ladder prose | — |
| governed-path §9 FedRAMP Moderate scope callout | Kit scope paragraph | "Belongs to High" claim removed |
| governed-path §9 FedRAMP 20x KSI callout | KSI table and exclusions | Dates corrected |
| manual-path (both copies) intro | The manual path | — |
| manual-path §0 phases and run order (+ Install-Module block) | Four phases | Install-Module line dropped: module list belongs to the kit |
| manual-path §1 prerequisites, licensing, roles, baseline scripts | Prerequisites; Phase 1 | Licensing and roles corrected; kit audit script calls replaced with real tools (setspn, event 4624) |
| manual-path §2 Arc onboarding, non-domain-joined callout, SP secret warning, tag taxonomy | Phase 2 Arc | Secret guidance corrected to Microsoft's |
| manual-path §3 Intune enrollment, profiles, compliance, GPO conflict | Phase 2 Intune; GPO conflict callout | Conflict rule corrected; GPO Migration Triage tool mention dropped (not in workbook) — Chapter 08 owns triage |
| manual-path §4 NTLM elimination, staged table, enforcement-layer callout | Phase 3 NTLM | Table corrected; FedRAMP deadline removed |
| manual-path §5 SPN audit and repair | Phase 3 SPN | Duplicate-SPN behavior corrected |
| manual-path §6 SQL hardening + separate-track note | Phase 3 SQL | — |
| manual-path §7 CA baseline + break-glass | Phase 3 CA | Break-glass guidance corrected |
| manual-path §8 monitoring and drift | Phase 4 Watch | — |
| manual-path §9 rollback | Rollback | NTLM back-out corrected; Arc extension removal added |
| manual-path §10 what you must configure | What you must configure | — |
| guides README — pages table, how paths relate, terminology (organizational attributes) | Terms used; opening | — |
| guides governed-and-retrofit — Overview | Opening | — |
| guides governed-and-retrofit — Governed path rules (7) + when to use | Governed path bullets; How to choose | — |
| guides governed-and-retrofit — Retrofit path rules + when to use | When the estate can't leave the domain yet | Re-scoped: "retrofit" reserved for governance-after-the-fact per book plan; domain-bound rules kept as a cross-path constraint |
| guides governed-and-retrofit — Relationship to manual path | How to choose (closing) | — |
| guides governed-and-retrofit — Key risks | Key risks on every path | — |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed; LAN Manager level 5 kept as a common mistake | Endpoint role; SYSVOL secret; overlap; NTLM staging; SPN; emergency accounts; terms table; retrofit | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- The source runbooks put "Intune Administrator through PIM" on the endpoint line.
- The source runbook's staging table treated LAN Manager level 5 as "block all NTLM".
- The source runbook said a duplicate SPN falls back to NTLM silently.
- The source runbook protected emergency accounts with long unique passwords.
- A source draft described the governed path as five products (table header was "Source draft term").
- An earlier version of these guides used "retrofit" for domain-bound devices.
