# Verification — Chapter 08, GPO to Intune Policy Migration

Checked October 20, 2026. Source: `docs/operational-guides/target-surface/intune-policy-templates.md` ("GPO Sunset Program", ~10,000 words), sections 1–9 and Appendices A–C. Section 10 (monitoring and drift) and Appendix D (compliance mapping, GCC boundary) went to Chapter 10. The 50-row translation reference and CSP table were consolidated with Appendix A (written by the Chapter 07 writer), per the coordinator; Chapter 08 keeps the policy IDs and points there. Policy ownership aligned with Appendix A: Defender settings in ES-001, BitLocker (including startup authentication) in ES-002, firewall in ES-003, LAPS in ES-006; SC-002, SC-006, SC-007 and SC-008 retired. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows 10 end of support Oct 14, 2025; "allowed" version in Intune | Intro | verified (added) | intune filters ref-device-properties note |
| 2 | Intune doesn't manage Windows Server; security settings management reaches non-enrolled devices incl. Server 2025 | Intro; CP-004 | corrected (source enrolled Server 2025 in Intune via Arc) | ref-supported-platforms; security-settings-management |
| 3 | Seven-phase durations (2–3, 1–2, 3–4, 2–3, 4–6, 8–12, 2–4 weeks; ~34 weeks) | Phase table | restated-as-design (mapped onto Chapter 07's seven phases) | program reference plan |
| 4 | `Get-GPOReport` XML is the shape Group Policy analytics imports; GPA shows CSP and OMA-URI | Phase 1 | verified | import-group-policy-analytics |
| 5 | Sliders Configuration Manager / Pilot Intune / Intune; device syncs MDM policy when a workload switches | Phase 2 | verified | how-to-switch-workloads |
| 6 | Grace period is the Mark noncompliant schedule, 0–365 days | Phase 4; compliance | verified; corrected (source used hours) | configure-noncompliance-actions |
| 7 | Switching device configuration also moves Endpoint Protection and resource access | Phase 5 | verified; corrected wave order (source moved device config before EP) | comanage workloads |
| 8 | Block inheritance on migrated OUs | Phase 6 | restated-as-design (program doesn't; disables links instead) | program design |
| 9 | 90-day disabled retention before deletion | Phase 7 | restated-as-design | program design |
| 10 | Pilot Intune doesn't remove policy on unassignment | Rollback | verified | how-to-switch-workloads |
| 11 | Moving a workload back leaves Windows/Office at later version | Rollback | verified | comanage workloads |
| 12 | Compliance precedence over configuration; most restrictive between compliance policies; config conflicts manual | Policy types | verified; corrected ("last write wins", "ES wins") | troubleshoot-device-profiles; endpoint-security-policies |
| 13 | Device extensionAttribute1–15 usable in dynamic rules, must be written via Graph | Attribute schema | verified | groups-dynamic-membership |
| 14 | Schema numbering (4/5/6 vs 11/12/13) | Attribute schema | corrected (source inconsistent; standardized on 11/12/13 used by its own rules) | program design |
| 15 | Assignment filters can't use extension attributes; property list | Assignment strategy; filters | corrected (source filtered on extensionAttribute11/13) | filters ref-device-properties |
| 16 | Filter deviceTrustType values differ from Entra rule values | Filter examples | verified (added) | filters ref-device-properties; groups-dynamic-membership |
| 17 | Scope tags table | Scope tags | restated-as-design | program design |
| 18 | Co-management decision criteria and 12-month timing | Authority per workload | restated-as-design | program design |
| 19 | Windows noncompliance actions: mark, email, retire list; no remote lock or push for Windows; retire list doesn't retire | Compliance intro | verified; corrected (source used push notifications, "retire device", "block access") | configure-noncompliance-actions |
| 20 | BitLocker/Secure Boot/code integrity measured via DHA at boot | Compliance intro | verified | ref-windows-settings (compliance) |
| 21 | Windows 11 23H2 Ent/Edu end Nov 10, 2026; 24H2 build 26100 to Oct 12, 2027; 25H2 build 26200 | CP-001 | verified; corrected min OS (source 19045/22631) | windows11-release-information |
| 22 | Credential Guard, NIS, cloud protection aren't Windows compliance settings; machine risk score is | CP-002 | corrected | ref-windows-settings (compliance) |
| 23 | CP-003 Windows 10 21H2 floor; BitLocker optional | CP-003 | corrected (unsupported OS; personal devices get AP-002) | program design; release info |
| 24 | Server compliance via Intune (CP-004) | CP-004 | corrected (moved to Chapter 09 server baseline) | ref-supported-platforms; security-settings-management |
| 25 | Security settings management unavailable if MDE entitlement only via Defender for Servers | CP-004 | verified (added) | security-settings-management |
| 26 | "Shared device mode" compliance setting; "block access" action | CP-005 | removed (don't exist for Windows compliance) | ref-windows-settings; configure-noncompliance-actions |
| 27 | Account lockout via DeviceLock AccountLockoutPolicy string; Win11 22H2+KB5053657 / 24H2 | SC-001 | corrected (source CSP MaxDevicePasswordFailedAttempts) | policy-csp-devicelock |
| 28 | Audit logon CSP `AccountLogonLogoff_AuditLogon` | Translation note | corrected (source `AccountLogon_AuditLogon`) | policy-csp-audit (CSP page fetched) |
| 29 | Security options CSP names | SC-001 | verified | policy-csp-localpoliciessecurityoptions (fetched) |
| 30 | Logon banner text | SC-001 | restated-as-design (placeholder; org's approved notice) | — |
| 31 | Cloud block level values; extended timeout max 50 s | ES-001 | verified | policy-csp-defender |
| 32 | SubmitSamplesConsent 1 = safe, 3 = all | ES-001 | corrected (source table said "all", JSON sent 1) | policy-csp-defender |
| 33 | Twelve ASR GUIDs correct | ES-005 | verified | ASR rules reference |
| 34 | Added vulnerable-driver and WMI-persistence rules (standard protection) | ES-005 | verified (added) | ASR rules reference |
| 35 | PSExec/WMI rule vs Configuration Manager; LSASS rule moot with LSA protection/Credential Guard; LSASS audit noise; cloud protection dependency | ES-005 | verified (added) | ASR rules reference |
| 36 | IE11 not on Windows 11; IE mode supported through at least 2029 | SC-003 | verified (added) | IE lifecycle FAQ; Essential Eight app hardening |
| 37 | Edge settings | SC-003 | restated-as-design (portal URL generalized) | program design |
| 38 | KFM doesn't work while Folder Redirection points elsewhere; network share needs Migration Manager first; pacing 1,000/day, 4,000/week | SC-004 | corrected (source said KFM moves share contents) | redirect-known-folders |
| 39 | Update ring ranges: quality deferral 0–30, deadlines 2–30, grace 0–7 | SC-005 | verified | ref-update-ring-settings |
| 40 | "Windows Update client policies" naming | SC-005 | verified | update management overview; WU client policies integration page |
| 41 | DO download mode 1 = peering behind same NAT | SC-005 | verified | policy-csp-deliveryoptimization |
| 42 | Silent BitLocker can't require TPM PIN/startup key | ES-002 | corrected (source combined silent + TPM+PIN for all) | encrypt-bitlocker-windows |
| 43 | Recovery keys auto-escrow to Entra on silent enablement, needs Entra join | ES-002 | verified | encrypt-bitlocker-windows |
| 44 | Public profile outbound conflict (Allow vs Block) | ES-003 | restated-as-design (resolved: Block) | program design |
| 45 | GPA can't migrate firewall rules or AppLocker | ES-003 | verified | migrate-group-policy (fetched) |
| 46 | LAPS post-auth delay 0–24 h, default 24; actions | ES-006 LAPS | verified; program value 8 h is design | laps-management-policy-settings; LAPS CSP |
| 47 | Intune LAPS backs up to Entra or AD; automatic account management on 24H2+ | ES-006 LAPS | verified | intune laps overview |
| 48 | Tamper protection via Intune needs MDE onboarding; not supported co-managed | ES-001 | verified (added) | antivirus prerequisites; tamper-protection-overview |
| 49 | EDR policy: package type + sample sharing; telemetry frequency deprecated | ES-004 | verified; corrected (AIR, live response, web filtering are Defender-portal settings) | configure-integration; ref-edr-settings |
| 50 | Credential Guard needs Enterprise/Education; default-on from 22H2 without UEFI lock | ES-006 | verified (added) | windows-licensing; credential-guard overview |
| 51 | Windows MAM: Edge only, unmanaged devices only | AP-001/002 | corrected (source applied AP-001 "with enrollment" to Windows Office apps) | app protection ref-settings-windows |
| 52 | AP settings values | AP-001/002 | restated-as-design | program design |
| 53 | GCC uses graph.microsoft.com; GCC High graph.microsoft.us; DoD dod-graph.microsoft.us | Templates | verified | graph deployments |
| 54 | Intune GCC = commercial instance | Templates | verified | intune government-service |
| 55 | v1.0 windows10CompliancePolicy lacks tpmRequired, firewall, Defender properties; beta has them | Graph | corrected (source posted beta-only properties to v1.0) | Graph v1.0 and beta resource pages |
| 56 | scheduledActionsForRule required; actionType values | Graph | verified; corrected (source PowerShell omitted it) | Graph resource; deviceComplianceActionItem |
| 57 | configurationPolicies is beta; templateReference for ES policies | Graph | verified | create deviceManagementConfigurationPolicy (beta) |
| 58 | deviceManagement/intents beta only, legacy | Graph | verified; source example removed | deviceManagementIntent (beta fallback) |
| 59 | `windows10GeneralConfiguration` is the older device restrictions type | Graph | restated-as-design (inference from resource name; not footnoted) | — |
| 60 | Update-MgDevice writes extensionAttributes | Templates | verified | dynamic membership page links device-update; Update-MgBetaDevice example |
| 61 | Workload waves use the program's division waves as rings; each workload can have its own pilot collection; the Intune setting switches the workload for every co-managed device | Phase 5 | verified (added Oct 25, 2026, to reconcile with Book 00 Ch 09's division waves) | how-to-switch-workloads |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| templates — opening "About this program" callout (three programs) | Ch 08 intro (links Ch 07, Ch 04, CS2HC Ch 05) | Twin of Ch 07's scope distinction; not repeated |
| templates — title block, classification/boundary line, version, author, audience | — | Stamps and metadata not carried per brief |
| templates — Document Purpose box | In this chapter | — |
| templates — Table of contents | — | Replaced by chapter headings |
| templates — 1.1 Purpose | Intro | — |
| templates — 1.2 Scope | Intro (Windows 11; Windows 10 EOS; Server not enrollable) | Windows 10 22H2 scope corrected |
| templates — 1.3 Related deliverables table | Inline links (Ch 07, Ch 10, Book 04) | Deliverable names not carried |
| templates — 1.4 Extension attribute schema | The device attribute schema | Numbering corrected |
| templates — 2.1 Policy types | Policy types | — |
| templates — 2.2 Assignment strategy + precedence box | Assignment strategy; Policy types (conflict rules) | Precedence box corrected |
| templates — 2.3 Scope tags | Scope tags | SC-002 dropped from FMP-Global |
| templates — 2.4 Filters | Assignment filter examples | Rewritten (extension attributes unsupported) |
| templates — 2.5 Co-management workload table + conflict box | Linked to Ch 07 (owns slider/coexistence) | Duplicated in Ch 07 |
| templates — 3.1–3.5 CP-001..CP-005 | Compliance policies | CP-004 recast as server baseline → Ch 09 |
| templates — 3.6 Compliance summary matrix | Compliance summary | — |
| templates — 4.1 SC-001 (lockout, audit, user rights, security options, firewall baseline) | SC-001; firewall rows → ES-003 | — |
| templates — 4.2 SC-002 Defender (core, scan, ASR) | ES-001 (core, scan); ES-005 (ASR GUIDs) | SC-002 ID retired (aligns with App A) |
| templates — 4.3 SC-003 Edge | SC-003 | — |
| templates — 4.4 SC-004 OneDrive + migration note | SC-004 + callout | Note corrected |
| templates — 4.5 SC-005 WUfB | SC-005; ring detail → Ch 10 | — |
| templates — 4.6 SC-006 BitLocker | ES-002 | SC-006 retired |
| templates — 4.7 SC-007 Firewall | ES-003 | SC-007 retired |
| templates — 4.8 SC-008 LAPS | ES-006 (LAPS subsection) | SC-008 retired |
| templates — 4.9 SC-009 RDP | SC-009 | — |
| templates — 4.10 SC-010 user experience | SC-010 | — |
| templates — 5.1 ES-001 + exclusion hygiene box | ES-001 + warning callout | — |
| templates — 5.2 ES-002 | ES-002 | — |
| templates — 5.3 ES-003 | ES-003 | — |
| templates — 5.4 ES-004 | ES-004; Defender-portal settings → Ch 10 | — |
| templates — 5.5 ES-005 | ES-005 | — |
| templates — 5.6 ES-006 | ES-006 | — |
| templates — 6.1 AP-001 | AP-001 (retargeted to iOS/Android) | — |
| templates — 6.2 AP-002 | AP-002 | — |
| templates — 7 Semantic translation reference (50 rows) + callout | Appendix A (owned by Ch 07 writer); pointer section in Ch 08 | Duplicated in Appendix A |
| templates — 8.1–8.4 dynamic group PowerShell | Dynamic group and filter templates (restored, looped) | — |
| templates — 8.5 Graph REST group example | The same group through the Graph REST API | — |
| templates — GCC-Moderate endpoint note | Dynamic group templates intro | — |
| templates — 9 Deployment methodology, phases 1–7 | The seven phases at working level | Mapped onto Ch 07's phase names |
| templates — 9 Timeline summary | Phase table; 34-week note | — |
| templates — 10.1–10.6 Monitoring, conflicts, drift, KQL, alerting | Chapter 10 | See Ch 10 ledger |
| templates — App A A.1–A.5 CSP references | Appendix A (CSP paths); corrections summarized in Ch 08 | Duplicated in Appendix A |
| templates — App A A.6 custom OMA-URI template | Pointer paragraph; Appendix A | Duplicated in Appendix A |
| templates — App B B.1 CP-001 JSON | Microsoft Graph templates (beta, corrected) | — |
| templates — App B B.2 SC-002 settings catalog JSON | "ES-001's Defender settings as a configuration policy" | Sample consent value aligned |
| templates — App B B.3 ES-005 intents JSON | — | Removed: legacy beta intents API, placeholder template ID |
| templates — App B B.4 Graph SDK PowerShell | Creating policies with the Graph PowerShell SDK (corrected) | — |
| templates — App C C.1 workload comparison | Appendix A workload comparison; recommendations in Ch 08 timing table | Comparison duplicated in Appendix A |
| templates — App C C.2 decision criteria | Choosing the authority per workload | — |
| templates — App C C.3 timeline | Choosing the authority per workload | — |
| templates — App D D.1–D.3 | Chapter 10 | — |
| templates — GCC feature parity box; footer | Chapter 10 boundary table; footer dropped | — |

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: device schema table is the device half of the program attribute map (Book 03 Ch 06); added `PAW` to device role (`extensionAttribute12`) values for Book 04's CA025; user-attribute link now the program map. Diagram source `ch08-targeting-layers.flow.yaml` checked, already consistent, no change. |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed throughout; "last write wins" and "endpoint security wins" kept as common beliefs | Scope; sequencing; conflicts; attributes; filters; compliance; profiles; KFM; update ring; ES policies; ASR; LAPS; app protection; Graph payloads | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- Minimum OS: the source set Windows 10 22H2 and Windows 11 23H2, allowed 21H2 for older hardware, and used `10.0.19045` in the payload.
- The source plan moved device configuration before Endpoint Protection and blocked inheritance on migrated OUs.
- The source used two attribute numberings, filters on extensionAttribute11/13, hour-based noncompliance schedules and a region rule matching `EASTUS` against `East`.
- The source listed Credential Guard, network inspection and cloud-delivered protection as compliance settings; made BitLocker optional for personal devices; defined CP-004 for Windows Server through Arc; used a "shared device mode" compliance setting and a "block access" action.
- The source defined SC-002, SC-006, SC-007 and SC-008 duplicating Endpoint security policies, with conflicting public-profile outbound defaults.
- The source mapped lockout to `MaxDevicePasswordFailedAttempts`; said Known Folder Move carries redirected folders; used a 30-day deferral and a 48-hour auto-restart setting; sent all samples in its table but safe samples in its JSON; combined silent BitLocker with TPM+PIN; listed four non-EDR settings in the EDR policy; had twelve ASR GUIDs; used a 24-hour LAPS delay and targeted Windows Server 2025; wrote AP-001 for enrolled Windows.
- The source labelled the Tier 1 group "Azure Arc–enrolled servers"; posted beta-only compliance settings to v1.0; used `deviceManagement/intents`; its script omitted the scheduled action and created SC-001 as `windows10GeneralConfiguration`.

## Revision 2026-10-29 — companion-guide reconciliation

Findings D2 and D5 in the attribute-driven migration guide's verification log (`docs/books/guides/_verification/attribute-driven-migration.md`). Sources opened on Oct 29, 2026 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim | Source (accessed 2026-10-29) | Old text | New text |
|---|---|---|---|---|
| G1 | Permission for writing device extension attributes. The sample is delegated, matching the chapter's other `Connect-MgGraph -Scopes` scripts | c08-device-update <https://learn.microsoft.com/graph/api/device-update?view=graph-rest-1.0>, Permissions: delegated least privilege `Directory.AccessAsUser.All`; application `Device.ReadWrite.All` (higher: `Directory.ReadWrite.All`); Intune Administrator the least-privileged supported role; app-only and non-Windows calls update only `extensionAttributes` | Sample: "# Requires Device.ReadWrite.All. $deviceObjectId is the Entra device object ID, not the device ID." / "Connect-MgGraph -Scopes 'Device.ReadWrite.All'"; prose: "Dynamic rules can only match values that exist on the device object, so the provisioning process writes them first." | Sample: "# Delegated: sign in as at least Intune Administrator. $deviceObjectId is the Entra device object ID, not the device ID." / "Connect-MgGraph -Scopes 'Directory.AccessAsUser.All'"; prose adds: "The sample is a delegated call, like the other scripts in this chapter: the least-privileged delegated permission for updating a device is `Directory.AccessAsUser.All`, and the signed-in administrator needs at least the Intune Administrator role. `Device.ReadWrite.All` is the application permission, for an unattended provisioning service running app-only; app-only calls can update only `extensionAttributes`, which is all this sample writes.[^c08-device-update]" |
| G2 | Intune targeting: filters on user groups or All devices for time-sensitive assignment; filters instead of dynamic groups for filter-visible properties; avoid dynamic device groups as exclusions; dynamic device groups kept where rules read extension attributes | c08-intune-assign <https://learn.microsoft.com/intune/device-configuration/assign-device-profile>, "Principles of including and excluding groups" and its Tip; extension attributes absent from c08-filters (ref-device-properties) | Device attribute schema: "Every policy is assigned to dynamic device groups built from attributes, which replaces OU-linked GPO scoping." Assignment strategy: no latency guidance | "By default each policy is assigned to dynamic device groups built from attributes, which replaces OU-linked GPO scoping; the exception for time-sensitive assignment is under [Assignment strategy](#assignment-strategy)." New paragraph after the assignment-strategy bullets: "Dynamic device groups take processing time … The program follows that guidance where a target depends only on Intune device properties. It keeps dynamic device groups where the rule has to read the device extension attributes (tier, role, environment, region and department), because filters can't.[^c08-intune-assign]" |
| G3 | `operatingSystemVersion` assignment-filter property status | c08-filters <https://learn.microsoft.com/intune/fundamentals/filters/ref-device-properties> (live page carries no preview note for the property and calls `osVersion` deprecated); Intune "What's new," week of August 25, 2026 (service release 2608): "The `operatingSystemVersion` property in assignment filters is now generally available" <https://learn.microsoft.com/intune/whats-new/> | Property listed without a status label | unchanged: the property is generally available, so no preview label added. The guide's "in preview" was the stale statement and is corrected there |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Sources opened on Oct 29, 2026 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| T1 | Chapter is the Intune track; it moves computer-configuration settings; the user half moves with people; servers take the Arc track | New paragraph after the opening | restated-as-design (series framing) | Shared framing |
| T2 | Device attribute source is device provisioning and the procurement or asset record, not HR | Device attribute schema | restated-as-design | Ch03, Ch04 |
| T3 | A device membership rule can't use the user attributes of the device owner; device rules reference only device attributes | Device attribute schema | verified | c08-dynamic, "Manage rules for dynamic membership groups in Microsoft Entra ID," section "Considerations for dynamic membership groups," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> |
| T4 | A dynamic group's security depends on who can write the attributes its rule reads ("Security consideration: Evaluate attribute write permissions before using them in dynamic group rules") | Device attribute schema | verified | same page and section |
| T5 | Footnote c08-dynamic extended to cite "Considerations for dynamic membership groups" and the re-check date | Notes | updated | same page |
| T6 | Link to the guide's `#dynamic-group-dangers` | Device attribute schema | open: the anchor didn't exist in the guide when this was written; the guide's owner is adding it | guide |
