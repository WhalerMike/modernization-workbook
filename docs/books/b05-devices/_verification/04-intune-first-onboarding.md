# Verification — Chapter 04, Intune-First Onboarding

Sources: `docs/reference-architecture/intune-first.md` (all sections) and its short twin `docs/architecture/intune-first-onboarding.md` (all sections), consolidated. Windows mechanics the assignment asked for (device preparation, enrollment restrictions, naming, group tags, ESP, baselines) added from Microsoft Learn. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Hybrid join is an interim step to Entra join | What Intune-first means | verified | Entra device identity overview |
| 2 | Five pillars, three failure modes, attribute priority order, five phases, intake fields, 14/5-day latency target | Doctrine sections | restated-as-design | program doctrine |
| 3 | Pillar 4 "Arc + Intune Settings Catalog for servers" | Five pillars | corrected (Intune doesn't support Windows Server; servers via Azure Policy machine configuration; Intune endpoint security reaches servers only via MDE security settings management) | Intune supported platforms; MDE security settings management |
| 4 | Phase 3 output "pre-staged Entra ID device object placeholder" | Five-phase process | corrected (Autopilot registration creates the Entra object automatically; phase 3 confirms it) | Autopilot registration overview |
| 5 | Windows annex: "Windows Autopilot Device Preparation (v2)" with Group Tag as carrier | Windows section; platforms table | corrected (device preparation has no registration and no group tag; devices join a device group at enrollment; carrier = mapping table). Recommendation restated as design: classic Autopilot default in GCC | device-preparation/compare; device-preparation/overview |
| 6 | Device preparation vs Autopilot feature comparison (registration, hybrid join, modes, Windows 10, 10 apps/scripts, ESP vs device group, DFCI) | Windows comparison table | verified | device-preparation/compare |
| 7 | Device preparation is a re-architecture; less feature-rich initially | Windows section | verified | device-preparation/faq |
| 8 | Intune has no separate GCC instance; GCC uses commercial service | Which one, in a GCC tenant | verified | Intune government service overview |
| 9 | Device prep OS requirements (24H2; 23H2/22H2 with KB5035942; media April 2024+); auto-enrollment; first user needs Entra join permission | Which one | verified | device-preparation/requirements |
| 10 | OEM/reseller registration requires Global Administrator consent; Microsoft recommends least privilege elsewhere | Registration and group tags | verified | Autopilot OEM registration |
| 11 | Manual registration intended mainly for testing/evaluation | Registration and group tags | verified | Autopilot manual registration |
| 12 | Group tag → `[OrderID]`; `[PurchaseOrderId]`; `[ZTDid]` rule syntax | Registration and group tags | verified | HoloLens Autopilot page; groups-dynamic-membership |
| 13 | Group tag carries an org-node code, not a department name; `ORG-0420` example | Registration and group tags | restated-as-design | program convention |
| 14 | Dynamic groups need Entra ID P1 per member | (draft) | removed (not re-verified for devices in this pass) | — |
| 15 | Personal-device platform restriction; Autopilot enrollments authorized as corporate | Enrollment restrictions | verified | Intune enrollment restrictions |
| 16 | Device-prep devices blocked by personal restriction unless corporate identifiers or device association | Enrollment restrictions | verified | Identify devices as corporate-owned; device-preparation overview |
| 17 | Allow personal Windows enrollment only for groups that need it | Enrollment restrictions | verified | troubleshoot-windows-work-school |
| 18 | Name template ≤15 chars, letters/numbers/hyphens, not all numbers; %SERIAL%, %RAND:x% | Naming | verified | Autopilot user-driven profile tutorial |
| 20 | Prefix + %SERIAL% convention; position not in name | Naming | restated-as-design | program convention |
| 21 | ESP two phases; default ESP doesn't show progress; Microsoft recommends custom ESP | ESP | verified | Autopilot user-driven ESP tutorial |
| 22 | Max 51 ESP profiles; blocking list filters tracking, doesn't assign | ESP | verified | Set up the Enrollment Status Page |
| 23 | Device prep: only selected apps/scripts in OOBE; policies synced but not tracked | ESP | verified | device-preparation/overview |
| 24 | Compliance setting recommendation (Not compliant); Windows compliance items | Baseline | verified | Intune compliance overview; M365 Business Premium device guidance |
| 25 | Machine risk score compliance setting | Baseline | verified | Intune Windows compliance settings |
| 26 | Security baselines: Windows 10 and later (25H2 latest), MDE baseline; profiles don't auto-update; overlapping defaults | Baseline | verified | Intune security baselines overview; Intune what's new (2603) |
| 27 | Corporate-owned automatic for ADE, Autopilot, KME, Android Enterprise corporate, Google zero-touch | Other platforms | verified | Identify devices as corporate-owned |
| 28 | Intune Linux: Ubuntu Desktop 24.04/26.04 LTS, RHEL 9/10 | Other platforms; exception B | verified (source said "GA but limited") | Intune supported platforms |
| 29 | DFCI needs classic Autopilot | Other platforms | verified | device-preparation/compare |
| 30 | Surface row: named resellers (CDW, Insight, Connection), Pluton attestation on specific models | Other platforms | removed (vendor positioning; unverified) | — |
| 31 | Exception C: Server 2019/2022 can't use AADLoginForWindows (source cited a program decision) | Exception paths | verified and re-sourced (Arc Entra sign-in requires Server 2025+ with Desktop Experience) | howto-arc-sign-in-windows |
| 32 | Five drift classes; HMAC-signed evidence; control-family mapping | Validation | restated-as-design (control IDs verified as NIST SP 800-53 Rev 5 controls; mapping is the program's assertion) | NIST SP 800-53 Rev 5 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| intune-first.md front matter / subtitle | Ch04 thesis line | |
| intune-first.md "Scope: net-new devices only" callout | Ch04 scope callout | Links re-pointed to Ch07/Ch08 (archived target-surface page not linked) |
| What "Intune-First" Means | Ch04 "What Intune-first means" | |
| Why This Canon Exists (three failure modes) | Ch04 "Why the doctrine exists" | `intune-native/` sub-adapter slot detail dropped (internal repo structure) |
| The Five Doctrine Pillars | Ch04 "The five pillars" | Pillar 4 corrected |
| The Three Documented Exception Paths | Ch04 "The three exception paths" | Exception B/C re-sourced |
| The Five-Phase Onboarding Process (table, latency target) | Ch04 "The five-phase process" + figure `ch04-five-phases` | Phase 3 output corrected |
| Procurement is the First Governance Step (intake fields) | Ch04 "Procurement intake fields" | JSON path `governance/procurement/orders/{PO}.json` generalized to "structured record in the governance repository" |
| Per-Platform Onboarding Annexes | Ch04 "Other platforms" table | Annex file paths dropped (internal monorepo); Windows row corrected; Surface reseller/Pluton detail removed; server row → Ch09 |
| Validation, Drift Classes, and Evidence | Ch04 "Validation, drift classes and evidence" | Evidence path generalized; production detail → Ch10 |
| Source Files (`src/fmp/...`, ADR anchor) | — | Internal monorepo paths; not useful in the public workbook |
| Related (Directory Migration, program decisions) | Ch04 links to Book 02 Ch04 and Ch02 | Unnamed "program decision" references dropped |
| intune-first-onboarding.md Purpose | Ch04 "What Intune-first means" / "Where the organizational assignment comes from" | |
| intune-first-onboarding.md Priority order for attribute assignment | Ch04 "Where the organizational assignment comes from" | Consolidated |
| intune-first-onboarding.md Five phases (Procure/Carrier/Validate/Enroll/Verify) | Ch04 five-phase section (noted as the same flow) | Consolidated into fuller table |
| intune-first-onboarding.md Devices without a procurement record | Ch04 "Devices without a procurement record" | |
| intune-first-onboarding.md Bottom line | Ch04 "Where the organizational assignment comes from" (unpositioned marker keeps rules deterministic) | |
| (new) Autopilot vs device preparation, GCC availability, registration, group tags, enrollment restrictions, naming, ESP, baseline | Ch04 Windows and baseline sections | Added per assignment |
| (new) Assignment-carrier figure | `ch04-assignment-carrier` | |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Exception path D added: Windows endpoints that can't enroll; compliant-device grant needs Entra registration plus Intune (or partner MDM on Windows) enrollment | The four exception paths; Path D under the compliant-device policies | verified | c04-ca-grant <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-grant#require-device-to-be-marked-as-compliant> |
| R2 | Path D: Defender for Endpoint security settings management for unenrolled devices; registers the device in Entra; not on non-persistent VDI or 32-bit Windows | Path D | verified | c04-mde-ssm <https://learn.microsoft.com/intune/device-security/microsoft-defender/security-settings-management> |
| R3 | Path D: named exclusion group paired with a deviceId NotIn device filter (Microsoft's specific-accounts-on-specific-devices pattern; negative operators match unregistered devices); exclusions used sparingly | Path D | verified; group name, 90-day review and isolation-first order are design | c04-ca-filter <https://learn.microsoft.com/entra/identity/conditional-access/concept-condition-filters-for-devices>; c04-ca-plan <https://learn.microsoft.com/entra/identity/conditional-access/plan-conditional-access#roll-back-policies> |
| R4 | Source-correction narration trimmed | Pillar 4; phase 3; Surface row; exception C | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- Pillar 4 was corrected from a source that paired Arc with the Intune Settings Catalog for servers.
- The source described a pre-staged Entra ID device object placeholder as a phase 3 output.
- The source's Surface row named specific resellers and firmware features (dropped as vendor positioning).
- Exception C was restated from a source that cited a program decision.

## Editor update, October 22, 2026

| Claim | Result | Source |
|---|---|---|
| Device preparation has no registration, so it has no carrier | qualified: device association (added Aug 27, 2026) binds a device to the tenant before enrollment, marks it corporate-owned and enables device-targeted policy and naming; it starts from device-exported data uploaded one device per CSV, so it is an admin-side binding, not a vendor carrier. Recommendation unchanged. | Microsoft Learn: device association overview; device preparation What's new |
| Device preparation naming | added: Apply device name template, up to 63 characters, associated devices only | Microsoft Learn: device preparation policy, Configuration settings |

## Consistency read, November 8, 2026

| Claim | Result | Source |
|---|---|---|
| Path D step 3 listed "a named owner, a written justification" twice | corrected: the duplicated phrase removed; no fact change | This page |

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported changes in the device preparation overview, requirements and policy tutorial. Checked November 9, 2026.

| Claim | Result | Source |
|---|---|---|
| Requirements: Windows 11 24H2, or 23H2/22H2 with KB5035942 (media dated April 2024 or later); Entra automatic enrollment; first user allowed to join devices | re-verified, no change | c04-ap-dp-req |
| Name template up to 63 characters, only for associated devices | re-verified, no change | c04-ap-dp-name |

## Source watch, November 9, 2026 (issue #299)

Re-checked after the weekly source watch (issue #299, week of November 2, 2026) reported a change in a cited source. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| Device preparation app limit is 25 managed apps (raised January 30, 2026), scripts still 10; the overview no longer gives the numbers (Microsoft Learn: Compare Windows Autopilot device preparation and Windows Autopilot; device preparation What's new) | corrected: "up to 10 of each" now "up to 25 apps and 10 PowerShell scripts", cited to the comparison page; comparison table row now "More than 25 apps or 10 PowerShell scripts" |

## Zero Trust closure update, November 11, 2026 (B05-04)

Instruction B05-04 (enrollment) of the Zero Trust Assessment closure update. Added the section "Enrollment controls, from automatic enrollment to decommissioning" in the How-section template of Book 00, Appendix D, with the control states, authority labels, assessment mapping, evidence checklist and a read-only reconciliation script. Microsoft Learn read with the Learn search and fetch tools on Nov 11, 2026. Three existing footnotes (government service, enrollment restrictions, corporate identifiers) were rechecked and carry the recheck date.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | MDM user scope Some/All; a user in both MDM and WIP scope enrolls on corporate, not on personal devices | Enrollment controls | verified | Learn, "Set up automatic enrollment for Windows devices" | Nov 11, 2026 |
| 2 | Automatic MDM enrollment is a premium Microsoft Entra feature (P1) | Prerequisites | verified | Learn, "Step 4 - Set up automatic enrollment for Windows devices" | Nov 11, 2026 |
| 3 | Enrollment restrictions aren't security features; best-effort barrier | What each control does | verified | Learn, "What are enrollment restrictions?" | Nov 11, 2026 |
| 4 | Platform restriction roles: Intune Administrator; others read-only | Prerequisites | verified | Learn, "Create device platform restrictions" | Nov 11, 2026 |
| 5 | Device limit restriction roles; edits apply to new enrollments only; priority | Prerequisites; Rollback | verified | Learn, "Create device limit restrictions in Intune" | Nov 11, 2026 |
| 6 | Default device limit can be raised to at most 15; DEM accounts and the device cap | What each control does; Exclusions | verified | Learn troubleshooting, "Windows user is not authorized to enroll"; "Troubleshooting device enrollment in Intune" | Nov 11, 2026 |
| 7 | Ownership by enrollment path table | Ownership classification | verified | Learn, "Identify devices as corporate-owned" | Nov 11, 2026 |
| 8 | Windows corporate identifiers apply only at enrollment; User Enrollment can't use identifiers | Ownership classification | verified | same | Nov 11, 2026 |
| 9 | CSV format, 5,000 rows or 5 MB, one identifier type per file, no header | Enforcement | verified | same | Nov 11, 2026 |
| 10 | Microsoft's command for manufacturer, model and serial | Enforcement | verified (Microsoft's command reused) | same, section "Resources" | Nov 11, 2026 |
| 11 | Deleting an identifier doesn't change ownership; corporate-to-personal deletes app inventory within 7 days | Rollback | verified | same | Nov 11, 2026 |
| 12 | Enrollment failure reason "Enrollment restriction not met"; identifier statuses | Pilot; Telemetry | verified | same | Nov 11, 2026 |
| 13 | GCC availability: GCC is the commercial Intune instance; enrollment features and Autopilot available | Prerequisites | verified | Learn, Intune service description for US Government (https://learn.microsoft.com/intune/fundamentals/government-service) | Nov 11, 2026 |
| 14 | importedDeviceIdentities Graph beta endpoint, permission, national clouds, properties | Evidence | verified | Graph beta reference, "List importedDeviceIdentities"; "importedDeviceIdentity resource type" | Nov 11, 2026 |
| 15 | managedDeviceOwnerType values unknown, company, personal | Evidence | verified | Graph v1.0, "managedDevice resource type" | Nov 11, 2026 |
| 16 | windowsAutopilotDeviceIdentities v1.0 list | Evidence | verified (endpoint already used by the book's Intune track guide) | Graph v1.0, "List windowsAutopilotDeviceIdentities" | Nov 11, 2026 |
| 17 | Ownership table, pilot criteria, 90-day line, exception register, owners | Enrollment controls | restated-as-design | program design | Nov 11, 2026 |
