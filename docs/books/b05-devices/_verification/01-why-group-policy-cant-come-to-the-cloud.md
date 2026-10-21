# Verification — Chapter 01 — Why Group Policy Can't Come to the Cloud

File covered: `01-why-group-policy-cant-come-to-the-cloud.md`.
Diagram sources: `docs/images/diagrams/b05-devices/src/ch01-implicit-policy-machinery.flow.yaml`, `ch01-precedence-vs-assignment.flow.yaml`.
All Microsoft sources opened (fetch or search excerpt) through the Microsoft Learn MCP tools on October 20, 2026.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Traditional Group Policy enforcement isn't possible with cloud-native (Entra-joined) endpoints | §Governance that came free | verified | Learn, "High level planning guide to move to cloud-native endpoints" |
| 2 | GPO processing order local, site, domain, OU parent→child; later overrides earlier; closest container wins | §What GP did, table | verified | Learn, "Group Policy processing" |
| 3 | Inheritance cumulative; enforced links can't be overridden; block inheritance stops higher policy except enforced | table | verified | Learn, "Group Policy processing" |
| 4 | Lowest link order has precedence among GPOs on one container | table | verified | Learn, "Group Policy processing" |
| 5 | Loopback merge/replace; for kiosks, classrooms, labs, RDS | table | verified | Learn, "Group Policy processing" (Loopback section) |
| 6 | Security filtering requires Read + Apply Group Policy | table | verified | Learn, "Group Policy scope" |
| 7 | WMI filter evaluated on target computer; one filter per GPO | table | verified | Learn, "Group Policy processing" (Filtering) |
| 8 | Scripts run at startup/shutdown and logon/logoff only | table | verified | Learn, "Group Policy processing" |
| 9 | GPP extensions process items top to bottom with item-level targeting; multiple drive map items per GPO | table | verified | Learn, "Group Policy processing" (GPP CSE section) |
| 10 | Refresh every 90 min + up to 30 min random offset; computer at startup, user at logon | table | verified | Learn, "Group Policy processing" |
| 11 | Group Policy Modeling/Results show winning GPO and precedence | table | verified | Learn, "Group Policy Modeling and Group Policy Results" |
| 12 | Linking GPOs/link order/block inheritance requires modify on container; by default only Domain/Enterprise Admins | table | verified | Learn, "Group Policy Management Console" |
| 13 | AD governs by placement, Entra by attributes | §What GP did | restated-as-design | Program argument; links Book 02 Ch02 |
| 14 | Intune doesn't apply LSDOU; policies assigned to users and groups; "mind shift" | §No tree | verified | Learn, "Known issues and limitations with cloud-native endpoints" |
| 15 | Two Intune config policies conflicting: shown in Intune, resolve manually | §No tree | verified | Learn, "Common questions… policies and profiles" (Conflicts) |
| 16 | Two conflicting configuration profiles: setting isn't applied | §No tree | verified | Learn, "Walkthrough - Create an Intune settings catalog policy…" |
| 17 | Compliance: most restrictive; compliance over configuration for same setting | §No tree | verified | Learn, "Common questions… policies and profiles" |
| 18 | Source (library): "Configuration profiles: last write wins" | §Running both | corrected | Intune reports the conflict and the setting may not apply (#15–16) |
| 19 | Source (library): "Endpoint security policies take precedence over configuration profiles" | §No tree | corrected | Learn, "Manage device security with endpoint security policies": all policy types have equal priority |
| 20 | Smallest group scope + filters; dynamic device groups need processing time | equivalents table | verified | Learn, "Assign policies in Microsoft Intune" |
| 21 | Assignment filters evaluated at enrollment/check-in; 200 per tenant; 3,072 characters | equivalents table | verified | Learn, "Use assignment filters…" |
| 22 | Device-group-assigned ADMX settings apply to any user who signs in (loopback analogue) | equivalents table | verified | Learn, "Import custom ADMX and ADML administrative templates…" |
| 23 | Custom ADMX import is public preview; combo box unsupported | equivalents table | verified | Learn, same |
| 24 | Platform scripts run once unless script/policy changes; 30-minute timeout | equivalents table | verified | Learn, "Use PowerShell scripts on Windows devices in Intune" |
| 25 | Remediations rerun every 24 hours | equivalents table | verified | Learn, "Remediations" |
| 26 | No built-in solution for mapped drives; move to Teams/SharePoint/OneDrive; scripts as fallback | equivalents table | verified | Learn, "Tutorial: Set up cloud-native Windows endpoints" |
| 27 | Intune maintenance sync about every 8 hours; at most one per 6.5 hours; change notifications immediate to a few hours; reports can lag | equivalents table | verified | Learn, "Common questions… policies and profiles" (Policy refresh intervals) |
| 28 | Imported GPOs visible only to admins sharing the scope tag | equivalents table | verified | Learn, "Import and analyze your on-premises GPOs using Group Policy analytics" |
| 29 | GP analytics: imports XML, MDM Support %, deprecated/unsupported, migrate to settings catalog | §GP analytics | verified | Learn, Group Policy analytics |
| 30 | Parses Policy, PassportForWork, BitLocker, Firewall, AppLocker CSPs and GPP; 4 MB limit; English-only non-ADMX known issue | §GP analytics | verified | Learn, Group Policy analytics |
| 31 | Migrate is best effort; AppLocker/firewall go to endpoint security; alternate settings; failures; conflicts must be resolved | §GP analytics | verified | Learn, "Create a Settings Catalog policy using your imported GPOs" |
| 32 | Source: "typically 30–60% of settings have a direct Intune equivalent" | §GP analytics | removed | No Microsoft source publishes a figure; chapter says the program quotes none and directs readers to measure |
| 33 | Microsoft: migrating GPO settings to MDM isn't preferred; don't lift and shift; assess mandatory settings | §GP analytics | verified | Learn, "Tutorial: Set up cloud-native Windows endpoints," Phase 4 |
| 34 | Regenerate, not copy | §GP analytics | restated-as-design | Program methodology (library page) |
| 35 | `Invoke-GpoMigrationTriage` classifies GPOs onto Intune/Arc planes | §GP analytics | restated-as-design | Program tool; name confirmed in `docs/substrate/platform-tooling/invoke-gpo-migration-triage.md` |
| 36 | Hybrid devices can use GPO, Intune or both; combination adds overhead | §Running both | verified | Learn, "Microsoft Entra joined vs. Hybrid Microsoft Entra joined" |
| 37 | Since Windows 10 1709, GP takes precedence over MDM for the same policy | §Running both | verified | Learn, "Enroll a Windows device automatically using Group Policy" |
| 38 | MDMWinsOverGP applies only to Policy CSP; other CSPs (Defender) race | §Running both | verified | Learn, "Policy CSP - ControlPolicyConflict" |
| 39 | WHfB in PassportForWork CSP; mixing GPO+CSP leaves CSP settings unapplied until GP cleared | §Running both | verified | Learn, "Configure Windows Hello for Business" |
| 40 | Source: coexistence is "last writer wins" | §Running both | corrected | Rewritten per #37–39 |
| 41 | Co-management seven workloads; device configuration switch also moves resource access and Endpoint Protection | §Running both | verified | Learn, "Co-management workloads" |
| 42 | Governance gaps table (targeting, SSOT, coverage, drift, delegation, timing, portability) | §Gaps | restated-as-design | Program analysis consolidating both gap pages |
| 43 | Migration progress slow, multi-year, long hybrid period, blockers, federal slower (source framed as "2025–2026 practitioner reality") | §How the move goes | restated-as-design | Presented as the program's planning pattern, not external statistics |
| 44 | Book 02, Book 04, C2H Ch05 cross-references | various | verified | Paths checked against `_BRIEF.md` |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| reference-architecture/gpo-cloud-governance-gaps.md — "Why this page exists" callout | Ch01 opening and §Gaps intro | Links to the archived "Federal Modernization Program vs Microsoft Native Tools" page not carried (no stable book target) |
| — "The short answer" | Ch01 §Governance that came free; §Gaps closing paragraph | — |
| — "What is lost or significantly weakened" table | Ch01 §Gaps table (merged with twin's table) | "~30–60% direct equivalents" cell removed (unverifiable) |
| — "Granular, deterministic targeting and inheritance" | Ch01 §What GP did; §No tree; gaps table row 1–2 | — |
| — "Fine-grained control over legacy and complex settings" | Ch01 §GP analytics | 30–60% figure removed |
| — "Triage the surface" callout (`Invoke-GpoMigrationTriage`) | Ch01 §GP analytics (linked to substrate tool page and Ch07) | — |
| — "Visibility, troubleshooting, and drift detection" | Ch01 equivalents table (RSoP row); gaps table drift row | `DRIFT-*` finding naming left to Ch10 |
| — "Delegation, auditing, and change management" | Ch01 equivalents table (GPMC row); gaps table; link to B02 Ch05 and Ch06 | — |
| — "Predictable, low-latency policy enforcement" | Ch01 equivalents table (refresh row); gaps table timing row | — |
| — "How the GPO migration is actually going" | Ch01 §How the move actually goes | Restated as program planning pattern |
| — "Sourcing note" callout | Ch01 §GP analytics (program quotes no figure) | — |
| — "Bottom line" | Ch01 §How the move goes, closing paragraph; "Why in five sentences" callout | — |
| — "Where to go next" | Continue-the-book links and inline links | Links to archived pages dropped |
| architecture/gpo-to-cloud-governance-gaps.md (short twin) — all sections | Consolidated into Ch01 §Gaps (its six-row table merged; "single source of truth" and "portability" rows added) | Duplicate prose of the fuller page not repeated |
| libraries/gpo-sunset-principles.md — Purpose; "Three related but distinct programs" | Not carried here | Belongs to Ch04/Ch07 (onboarding vs sunset distinction); flagged to editor |
| — "Seven-phase shape" | Not carried here | How-part content for Ch07; flagged to editor |
| — "Co-management decision matrix" | Ch01 §Running both (workload facts, verified) | Phase-by-phase matrix belongs to Ch07/Ch08; flagged to editor |
| — "Policy assignment strategy" (include/exclude/filters) | Ch01 equivalents table (assignment, filters rows) | Detailed strategy belongs to Ch08 |
| — "Assignment precedence" | Ch01 §No tree and §Running both | Two of three rules corrected (#18, #19) |
| — "Regenerate, not copy" | Ch01 §GP analytics | — |
| — "Conflict note" | Ch01 §Running both | Reworded with verified GP/MDM precedence |
| — "Full library" | Not carried | Pointer to source repository; Appendix A holds the crosswalk |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Source-correction narration trimmed; common misconceptions kept as one clause | GPO coverage figure; coexistence | restated | unchanged footnotes |

### Revision history moved out of the chapter body

The body now states the guidance directly. These were the earlier positions it used to narrate:

- The workbook's source pages quoted 30 to 60 percent of settings with a direct Intune equivalent.
- The source pages described coexistence as "last writer wins".
