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
| 6 | Device preparation vs Autopilot feature comparison (registration, hybrid join, modes, Windows 10, 10 apps/scripts, ESP vs device group, GCCH/DoD, DFCI) | Windows comparison table | verified | device-preparation/compare |
| 7 | Device preparation is a re-architecture; less feature-rich initially | Windows section | verified | device-preparation/faq |
| 8 | Intune has no separate GCC instance; GCC uses commercial service; classic Autopilot not available in GCC High/DoD | Which one, in a GCC tenant | verified | Intune government service overview |
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
| 19 | Rename by org structure during device prep listed as planned (GCC High/DoD) | Naming | verified | Intune government service overview |
| 20 | Prefix + %SERIAL% convention; position not in name | Naming | restated-as-design | program convention |
| 21 | ESP two phases; default ESP doesn't show progress; Microsoft recommends custom ESP | ESP | verified | Autopilot user-driven ESP tutorial |
| 22 | Max 51 ESP profiles; blocking list filters tracking, doesn't assign | ESP | verified | Set up the Enrollment Status Page |
| 23 | Device prep: only selected apps/scripts in OOBE; policies synced but not tracked | ESP | verified | device-preparation/overview |
| 24 | Compliance setting recommendation (Not compliant); Windows compliance items | Baseline | verified | Intune compliance overview; M365 Business Premium device guidance |
| 25 | Machine risk score compliance setting | Baseline | verified | Intune Windows compliance settings |
| 26 | Security baselines: Windows 10 and later (25H2 latest), MDE baseline; profiles don't auto-update; overlapping defaults | Baseline | verified | Intune security baselines overview; Intune what's new (2603) |
| 27 | Corporate-owned automatic for ADE, Autopilot, KME, Android Enterprise corporate, Google zero-touch | Other platforms | verified | Identify devices as corporate-owned |
| 28 | Intune Linux: Ubuntu Desktop 24.04/26.04 LTS, RHEL 9/10 | Other platforms; exception B | verified (source said "GA but limited") | Intune supported platforms |
| 29 | DFCI needs classic Autopilot; planned for GCC High/DoD | Other platforms | verified | device-preparation/compare; Intune government service |
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
