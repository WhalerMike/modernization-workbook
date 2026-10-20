# Verification — Chapter 07, The GPO Sunset Program

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three distinct efforts: Intune-first onboarding, GPO sunset, regenerate-not-copy | Opening | restated-as-design | Program decision (Intune-First scope disambiguation) |
| 2 | Microsoft: lift-and-shift of GP isn't preferred; assessing every setting impractical; identify mandatory settings, gaps are blockers | Opening | verified | c07-cloud-native |
| 3 | Seven-phase table and exit conditions | Program at a glance | restated-as-design | Source sunset program |
| 4 | Alternative seven-phase shape described coexistence as "last writer wins" | Program at a glance | corrected: Policy CSP settings GP wins unless MDMWinsOverGP; other CSPs race | c07-mdmwins |
| 5 | Duration "months, not weeks" | Program at a glance | restated-as-design | — |
| 6 | Get-GPOReport reports details, links, security filtering, WMI filtering, delegation, computer/user config; XML/HTML; -All/-Guid | Step 1, code | verified | c07-getgporeport |
| 7 | `Get-GPO -All`, `Get-GPOReport -Guid -ReportType Xml -Path` | Code | verified (cmdlet syntax, ByGUID parameter set) | c07-getgporeport |
| 8 | `Invoke-GpoMigrationTriage.ps1`: two classifiers (OU OS predominance, OU name heuristic), Intune vs Azure Arc | Step 1 | restated-as-design (program tooling; named, not linked, per editor) | Program tooling page (substrate, unlinked) |
| 9 | GPA columns: MDM support %, unknown settings, targeted in AD, last imported; per-setting category, value, scope, min OS, CSP, OMA-URI | Step 1 | verified | c07-gpa |
| 10 | Readiness statuses Ready for migration / Not supported / Deprecated | Step 1 | verified | c07-gpa |
| 11 | 4 MB per GPO; Unicode encoding | Step 1 limits | verified | c07-gpa |
| 12 | GPA parses Policy, PassportForWork, BitLocker, Firewall, AppLocker CSPs and GPP | Step 1 limits | verified | c07-gpa |
| 13 | Only non-ADMX English settings supported | Step 1 limits | verified | c07-gpa |
| 14 | Scope tags govern visibility of imports | Step 1 limits | verified | c07-gpa |
| 15 | Mapping updates without reimport; ~20 min report refresh | Step 1 limits | verified | c07-gpa |
| 16 | Migrate is best effort; alternate settings; failures in notifications; firewall rules and AppLocker can't migrate; conflicts detected early | Step 1 | verified | c07-gpa-migrate |
| 17 | Microsoft tip: don't include all GP settings without review | Step 1 | verified | c07-gpa-migrate |
| 18 | Source sunset phase 2 "Intune policy ignored while workload on SCCM" | Coexistence | corrected/restated: Configuration Manager keeps managing unswitched workloads; Pilot Intune doesn't remove on unassignment; no tattoo removal while device configuration is on Configuration Manager | c07-comanage, c07-switch, c07-tattoo |
| 19 | Classification tags table | Step 2 | restated-as-design | Source parse-crosswalk |
| 20 | Four questions; dispositions | Step 2 | restated-as-design | Source sunset program (translation philosophy) |
| 21 | Compliance evaluates resulting state | Step 2 | verified | c07-es |
| 22 | Settings catalog: thousands of settings generated from CSPs; built-in ADMX, no OMA-URI | Landing zones | verified | c07-settings-catalog, c07-admx-catalog |
| 23 | Administrative Templates profile type deprecated/read-only since 2412 | Landing zones | verified (added) | c07-admx-catalog |
| 24 | ADMX import preview; 20 files, 1 MB, one ADML, en-us only, dependencies first | Landing zones | verified (added) | c07-admx-import |
| 25 | Endpoint security policy areas; best practice endpoint security OR baselines for same settings | Landing zones | verified | c07-es |
| 26 | Remediations licensing (Windows Enterprise E3/E5, Education A3/A5, VDA); 200 script packages | Landing zones | verified | c07-remediations |
| 27 | Platform scripts: run once, 30-minute timeout, rerun only on change | Landing zones | verified | c07-scripts |
| 28 | Crosswalk is a semantic translation reference, not prescription | Step 3 | restated-as-design | Source templates page |
| 29 | GP applied LSDOU; Intune has no hierarchy | Step 3 | verified | c07-tutorial-gp |
| 30 | Decision record fields; feeds Ch08 and CA library | Step 4 | restated-as-design | Source parse-crosswalk |
| 31 | Policy carries population, setting table, mapping, verification | Step 4 | restated-as-design | Source sunset program |
| 32 | Assignment strategy: include dynamic groups, exclude break-glass/staging, filters | Assignment strategy | restated-as-design; filter mechanics verified | c07-filters |
| 33 | Principles page: filters "evaluated after group membership" | Assignment strategy | corrected: filters applied on top of a group assignment and evaluated at enrollment/check-in | c07-filters |
| 34 | Dynamic group processing delay; filters for time-sensitive targeting | Assignment strategy | verified (added) | c07-assign |
| 35 | Filters can't be used for CA or licensing | Assignment strategy | verified (added) | c07-targeting |
| 36 | 200 filters per tenant | Assignment strategy | verified (added) | c07-filters |
| 37 | Seven co-management workloads; none must move; ConfigMgr keeps unswitched | One authority | verified | c07-comanage |
| 38 | Slider positions Configuration Manager / Pilot Intune / Intune | One authority | verified | c07-switch |
| 39 | Co-management phase matrix (four workloads) | One authority | restated-as-design | Source principles page |
| 40 | Device configuration carries resource access and Endpoint Protection; settings catalog controlled by device configuration slider | One authority | verified (added) | c07-comanage |
| 41 | Resource access unsupported from 2203; slider mandated to Intune from 2403 | One authority | verified (added) | c07-comanage |
| 42 | Pilot Intune doesn't remove policy on unassignment | One authority | verified (added) | c07-switch |
| 43 | ConfigMgr baseline can apply to co-managed clients after device config moves | One authority | verified (added) | c07-comanage |
| 44 | Compliance vs compliance: most restrictive | Coexistence | verified | c07-conflicts |
| 45 | Compliance setting takes precedence over configuration | Coexistence | verified (added) | c07-conflicts |
| 46 | Principles page: configuration profiles "last write wins" | Coexistence | corrected: conflict reported, setting may not apply, manual resolution | c07-conflicts, c07-es-manage |
| 47 | Principles page/templates: "Endpoint security takes precedence over configuration profiles" | Coexistence | corrected: all policy types equal priority | c07-es-manage |
| 48 | MDMWinsOverGP: Policy CSP only; GP wins by default; race condition otherwise; not Defender CSP | Coexistence | verified | c07-mdmwins |
| 49 | WHfB: don't mix GPO and CSP; MDMWinsOverGP doesn't apply | Coexistence | verified | c07-whfb |
| 50 | IgnoreWindowsUpdateGroupPolicies recommended; Windows 11 24H2 with KB5101684+ | Coexistence | verified (added) | c07-update-csp |
| 51 | Freeze GPOs under change control | Freezing | restated-as-design | — |
| 52 | Backup-GPO backs up one/all GPOs to existing directory | Freezing, code | verified | c07-backupgpo |
| 53 | Set-GPLink -LinkEnabled No/Yes; -Name, -Target | Freezing, code | verified | c07-setgplink |
| 54 | Disable, retain 90 days, then archive and delete | Freezing | restated-as-design (program reference plan) | Source templates page phase 7 |
| 55 | GPP don't remove settings unless "Remove this item when it is no longer applied" | Freezing | verified (added) | c07-gpp |
| 56 | Intune doesn't tattoo-remove while device configuration workload is on ConfigMgr | Freezing | verified (added) | c07-tattoo |
| 57 | Source phase 7 "Block inheritance on migrated OUs" | Freezing | removed: disabling links per population is reversible and scoped; block inheritance also blocks GPOs the program still relies on (exceptions, security baselines on the OU) | — |
| 58 | End-state conditions | End state | restated-as-design | — |
| 59 | Entra-joined, non-domain-joined devices receive no domain GPOs | End state | restated (linked to Ch01, which carries the footnoted fact) | Ch01 c01-planning |
| 60 | Methodology principles | Principles | restated-as-design | Source sunset program, principles page |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| operational-guides/gpo-sunset-program.md — Purpose | Opening prose; thesis | — |
| gpo-sunset-program.md — Scope distinction | Opening "three related but distinct efforts" list | — |
| gpo-sunset-program.md — Seven-phase sequence (table, duration note) | "The program at a glance" | Durations detail left to Ch08 |
| gpo-sunset-program.md — Policy families | "The landing zones" table; Step 2 configuration vs compliance | Compliance policies linked to Book 04 |
| gpo-sunset-program.md — Each policy should include | Step 4, last paragraph | — |
| gpo-sunset-program.md — Coexistence caution | "One authority per workload"; coexistence table last row | "Intune policy ignored" restated with verified co-management behavior |
| gpo-sunset-program.md — Translation philosophy (four questions) | Step 2 four questions; Step 3 | Reordered into the disposition tree |
| gpo-sunset-program.md — Bottom line | Thesis; principle 8 | — |
| operational-guides/gpo-modernization-parse-crosswalk.md — Purpose | Step 1 opening | — |
| parse-crosswalk — Steps 1–5 (parse, classify, crosswalk, decide, sequence) | Steps 1–5 of the chapter, one section each | — |
| parse-crosswalk — Classification guidance table | Step 2 table | — |
| parse-crosswalk — Output (decision record) | Step 4 | — |
| libraries/gpo-sunset-principles.md — Purpose | Opening | — |
| gpo-sunset-principles.md — Three related but distinct programs | Opening numbered list (all three named) | Per editor note |
| gpo-sunset-principles.md — Seven-phase shape (illustrative) | "The program at a glance", paragraph after the table | Consolidated with the sunset program's table; "last-writer-wins monitoring" corrected; per editor note |
| gpo-sunset-principles.md — Co-management decision matrix | "One authority per workload" table | Per editor note; workload facts added |
| gpo-sunset-principles.md — Policy assignment strategy | Step 5 "Assignment strategy" | Per editor note; filter behavior corrected and verified |
| gpo-sunset-principles.md — Assignment precedence | Coexistence table | Two of three rules corrected |
| gpo-sunset-principles.md — Regenerate, not copy | Step 3; principle 1; Appendix A "How to use" | — |
| gpo-sunset-principles.md — Conflict note | Coexistence table; principle 3 | — |
| gpo-sunset-principles.md — Full library pointer | Appendix A (crosswalk); Ch08 (library) | Pointer replaced by book links |
| intune-policy-templates.md — "About this program" callout | Opening list | Crosswalk tables went to Appendix A; the rest is Ch08's |
| intune-policy-templates.md — Phase 7 GPO sunset (unlink, disable, 90 days, archive) | "Freezing and unlinking GPOs" | Block-inheritance step removed (see claim 57); phase mechanics otherwise Ch08 |
