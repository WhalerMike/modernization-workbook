# Verification — Chapter 12, Evidence, Metrics and Continuous Monitoring

Writer W6. Sources: `docs/compliance/Vol_III_Book_07_Multi_Cloud_Evidence_Fabric.md` (continuous-monitoring pipeline, controls closed, KSI alignment), `docs/modernization-specs/telemetry.md` (archived; not linked), `docs/compliance/Vol_VI_Book_07_Evidence_ConMon_Pipeline.md`, and the evidence sections of Vol III Books 02 (continuous monitoring record, KSI alignment), 03 (KSI alignment), 04 (feeding the evidence fabric, KSI alignment), 05 (KSI alignment), 06 (assessor evidence standard, MTTD, KSI alignment) and Vol VI Book 08 (telemetry completeness). Handoff from the Chapter 05 writer: retention tiers and immutable storage. Coordinator addition: TIC 3.0 Program Guidebook v1.2. All sources opened October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SP 800-137 ISCM definition; status determined by org-established metrics | What ConMon asks | verified | SP 800-137 §1 |
| 2 | CA-7 items a–g (metrics, frequencies, ongoing assessments, monitoring, correlation, response, reporting) | Same | verified | SP 800-53r5 CA-7, OSCAL 5.2.0 |
| 3 | PM-31 same at organization level | Same | verified | SP 800-53r5 PM-31 |
| 4 | Monitor-step task responsibilities M-1–M-6 | Same | verified | SP 800-37r2 §3.7 |
| 5 | Tool-generated report can constitute assessment/posture report; metrics and dashboards consolidate data | Same | verified | SP 800-37r2 fn. 108, 109; Task M-6 discussion |
| 6 | Pipeline stages: emit, normalize, correlate, bind, report from source; respond added | Pipeline | restated-as-design (source design; respond stage is program addition) | Vol III Book 07; Vol VI Book 07 |
| 7 | AU-12(1), SI-4(16), CA-5 statements | Pipeline | verified | SP 800-53r5, OSCAL 5.2.0 |
| 8 | OSCAL models for assessment results and POA&M | Pipeline | verified (via Book 11 Ch09, which cites NIST OSCAL) | Book 11 Ch09 |
| 9 | Three honest limits (emitters, asset ID, package reflects evidence present) | Pipeline | restated-as-design | Vol VI Book 07 "Honest Limits" |
| 10 | Posture report frequency at org discretion, "not so frequently..."; minimum content summarizes changes | Who receives what | verified | SP 800-37r2 Task M-5 discussion |
| 11 | BOD 26-04: automate KEV status via CDM or report bi-weekly; tag internet-reachable assets; report every 7 days if not automated | Who receives what | verified | BOD 26-04 Required Actions |
| 12 | SP 800-53A methods examine/interview/test; CA-07 objects; AU-06 "records of actions taken in response..." | Assessor | verified | SP 800-53A r5 §2, CA-07 and AU-06 procedures |
| 13 | Assessor questions table | Assessor | restated-as-design | — |
| 14 | M-26-14 maturity: five elements, levels 0–4, lowest watermark, report % of systems per level | Metric set | verified | M-26-14 "Measuring Maturity," App. C fn. 8 |
| 15 | Levels 1/2/3 within 120/180/320 days of LRA | Metric set | verified | M-26-14 Agency Actions |
| 16 | Appendix C level thresholds (70/80/90/95; 50/80/90/95; <50, 50–70, ≥70, ≥95; retention; log management) | Metric table | verified | M-26-14 App. C (table extracted with PyMuPDF) |
| 17 | Tension: App. B 6 months searchable vs App. C Level 3 3 months searchable | Metric set | verified (observation from the memo text) | M-26-14 App. B item 1; App. C |
| 18 | Level 1 called "Initial" in App. C and "Basic" in Agency Actions | Metric set | verified | M-26-14 |
| 19 | App. B item 5 eleven activities a–k ending "generating appropriate automated alerts" | Detection coverage | verified | M-26-14 App. B |
| 20 | AU-5 alert on logging process failure | Telemetry completeness | verified | SP 800-53r5 AU-5 |
| 21 | Source "PatchComplianceRate" = 1 − open breached/total findings | KEV metric | corrected (metric redefined on closures and overdue items; program design) | Vol III Book 02 script and summary JSON |
| 22 | SI-2(3) measure time identification→remediation; benchmarks | KEV metric | verified | SP 800-53r5 SI-2(3) |
| 23 | BOD 26-04 Table 1: KEV rows 3 days (± forensic triage) or 14 days; four variables; clock starts at KEV addition or agency CDM identification, whichever first | KEV metric | verified | BOD 26-04 Appendix A, Table 1 image (read directly) and text |
| 24 | Phase III within 180 days of June 10, 2026 = December 7, 2026 | KEV metric | restated-as-design (program arithmetic, labeled) | BOD 26-04 |
| 25 | Source "BOD 26-04 and the KEV Catalog" label; KEV "BOD 22-01" | Throughout | corrected | BOD 26-04 revokes 22-01 and 19-02 |
| 26 | SecurityIncident: new row per update; arg_max; triage = FirstModifiedTime − CreatedTime; closure = ClosedTime − CreatedTime; columns used | Code | verified | Learn "Use incident metrics..."; SecurityIncident table reference |
| 27 | Analytics retention up to 2 years; total retention up to 12 years; search jobs for long-term data | Code; tiers | verified | Learn "Manage data retention..." |
| 28 | "Searchable" and "retrievable" definitions | Code; tiers | verified | M-26-14 App. B fn. 6, 7 |
| 29 | Mapping searchable→analytics retention, retrievable→total retention | Code | restated-as-design | — |
| 30 | `Get-AzOperationalInsightsTable` parameters; PSTable `RetentionInDays`, `TotalRetentionInDays`, `Plan`, `TableName` | Code | verified | Learn cmdlet page; PSTable API pages; New-AzOperationalInsightsTable output example |
| 31 | Basic/Auxiliary have only total retention settable | Code | verified | Learn "Manage data retention..." |
| 32 | Table plans: Analytics 30 days default (90 for Sentinel) to 2 years; Basic 30-day query; Auxiliary queryable for total retention up to 12 years; alerts stop on move to Auxiliary; one plan switch per table per week | Tiers | verified | Learn "Azure Monitor Logs overview" (table plans); "Tables in Azure Monitor Logs"; "Configure a table plan" |
| 33 | Sentinel data lake tier: limits on analytics rules, hunting, parsers, watchlists, workbooks, playbooks; no data export; analytics tier mirrored to lake | Tiers | verified | Learn "Manage data tiers and retention in Microsoft Sentinel" |
| 34 | Logs only in data lake tier generate no alerts; keep time-sensitive sources in analytics tier | Tiers | verified | Learn "Microsoft Sentinel data lake direct ingestion guidance" (also Chapter 01) |
| 35 | Workspace data can't be altered but can be purged; export to immutable storage; export rules continuous | Tiers | verified | Learn "Log Analytics data export rules"; Well-Architected Log Analytics guide |
| 36 | Blob immutability: time-based retention and legal hold behaviors | Tiers | verified | Learn "Store business-critical blob data with immutable storage" |
| 37 | Data lake can't purge specific records; retains even if deleted at source; Basic/Auxiliary can't purge personal data | Tiers | verified | Learn "Microsoft Sentinel data connectors" (data lake considerations); "Query data in Basic and Auxiliary tables" |
| 38 | Four tier design rules | Tiers | restated-as-design | — |
| 39 | Source: AU-11 "3-year WORM Blob with legal hold ... meet NARA GRS 3.2 minimum" | Not carried as stated | corrected | GRS 3.2 items 035/036 cite M-21-31 and are under revision; retention is a records decision (Chapter 10) |
| 40 | SCuBA mapping limited to FedRAMP High baseline controls | ScubaGear | verified | ScubaGear v1.8.0 mappings.md |
| 41 | BOD 25-01 reporting: CISA-hosted ScubaConnect; self-hosted with CLAW/TALON at least quarterly; CyberScope quarterly | ScubaGear | verified | BOD 25-01 Implementation Guidance |
| 42 | Interval evidence; drift to AO | ScubaGear | verified (link to Book 11 Ch09/Ch10) | Book 11 |
| 43 | TIC: eliminates TIC FISMA metrics and manual TCV, replaced by automated metric collection via CDM, continuous vs point-in-time | TIC | verified | TIC 3.0 Guidebook v1.2 §4 ("Automated and Streamlined Verification") — note: the coordinator cited §9; the passage is in §4, while §9 carries the M-19-26 responsibility shift |
| 44 | TIC doesn't replace telemetry requirements; information cycle; CLAW and C-CIRA | TIC | verified | TIC 3.0 Guidebook v1.2 §10, §10.1, §13 |
| 45 | Consolidated Rules: launched June 24, 2026; early adoption July 4; mandatory January 1, 2027 | KSIs | verified | FedRAMP Important Dates; KSI changelog |
| 46 | 46 KSIs in ten themes (names) | KSIs | verified | FedRAMP KSI page (46 unique IDs counted); Trigrams page |
| 47 | "Persistently" definition | KSIs | verified | FedRAMP Definitions FRD-PER |
| 48 | KSI-MLA-OSM/RVL/LET/EVC/ALA, INR-RIR/RPI/AAR, PIY-GIV statements and related controls | KSI table | verified | FedRAMP KSI page |
| 49 | Source: "FedRAMP 20x KSI pipeline" for agency evidence; automation queries SecurityAlert/SecurityIncident; zero enabled rules fails KSI-MLA check | KSIs | corrected (KSIs bind providers; no query specified) | FedRAMP KSI page |
| 50 | Agencies MUST review each OCR (CCM-AGM-ROR); providers supply OCR every 3 months with listed contents | KSIs | verified | FedRAMP CCM page |
| 51 | VDR: graded timeframes by PAIN, reachability, exploitability; providers SHOULD NOT deploy new resources with KEVs | KSIs | verified | FedRAMP VDR page (VDR-TFR-PVR, VDR-CSO-AKE) |
| 52 | Control mappings updated October 13, 2026 | KSIs | verified | KSI changelog entries |
| 53 | Source KSI theme mappings (CM-8→PIY, SI-2→SVC/MLA, CNA for Purview) | Not carried | removed (program's own mapping table; FedRAMP's per-KSI mappings used instead) | — |
| 54 | Ongoing authorization uses continuous monitoring results | Closing a finding | verified | SP 800-37r2 Task M-6 |
| 55 | Reporting rhythm table | Rhythm | restated-as-design | — |
| 56 | Source MTTD table "days to never" vs "minutes" | Not carried here | Chapter 05 carries it as planning estimates | — |
| 57 | Source "assessors will typically request a 90-day or 180-day compliance record" | Assessor | restated-as-design (90-day series is the program's choice) | — |
| 58 | Source "≥95% PatchComplianceRate" target | Not carried | removed (operational target defined on the corrected metric is left to the agency) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol III Book 07, front matter, Draft Proposal box, Date Code, provisional-position and Series Context boxes | — | Stamps and internal series labels dropped per brief |
| Vol III Book 07, "What This Document Addresses" | Opening; pipeline | Substance carried; five-stack framing is Chapter 02's |
| Vol III Book 07, "What this book is not" | Opening (boundary with Chapters 05/11 and Book 14) | — |
| Vol III Book 07, "The Evidence Contract (AU-3)" | Pipeline normalize stage; link to Chapter 02 | Field table carried by Chapter 02 |
| Vol III Book 07, "The Join Key (AU-12(1))" | Pipeline correlate stage | Detail carried by Chapter 02 |
| Vol III Book 07, "Realizations" (Sentinel, Splunk, ServiceNow, CDM, KSI/OSCAL) | Who receives what (CDM, OSCAL) | Vendor dual-SIEM and ServiceNow selection not carried: agency-specific procurement; Marketplace authorizations not re-verified |
| Vol III Book 07, "The Continuous-Monitoring Pipeline (CA-7)" | The continuous-monitoring pipeline | M-26-14 description corrected to the memo's own maturity model; SP 800-137 cited |
| Vol III Book 07, control closure table | Pipeline stage table; Appendix A | "FedRAMP Moderate" gate for AU-12(1) and SI-4(16) corrected in Appendix A |
| Vol III Book 07, "FedRAMP 20x KSI Alignment" | FedRAMP's Key Security Indicators | Corrected: KSIs bind providers |
| Vol III Book 07, "Realization Selection Status" | — | Procurement status, agency-specific |
| Vol III Book 07, References | Footnotes | Splunk and ServiceNow Marketplace links not carried (not used) |
| `modernization-specs/telemetry.md` (archived) | Pipeline (telemetry as control input; drift findings first-class; reproducible evidence) | Not linked (archived per brief) |
| Vol VI Book 07, "The Evidence Contract" JSON record | Chapter 02 carries the record | Not duplicated |
| Vol VI Book 07, "Deployable Artifacts" | Pipeline stage table ("Where it's built") | — |
| Vol VI Book 07, "The Pipeline" (collect, correlate, bind, emit) | Pipeline | Respond stage added |
| Vol VI Book 07, "Closure Necessity" | Opening thesis; pipeline | — |
| Vol VI Book 07, "Controls Operationalized" (CA-7, AU-6(1), AU-12(1), CA-5) | Pipeline table; Appendix A | — |
| Vol VI Book 07, "Honest Limits" | Pipeline, three limits | — |
| Vol VI Book 08, "The Three Harnesses" and telemetry-completeness KQL | Metric set (telemetry completeness, detection efficacy) | KQL not reproduced: Chapter 05 carries a corrected freshness query (the source's used `now` without parentheses) |
| Vol III Book 02, "What FedRAMP Assessors Check" (third question) | What an assessor verifies (RA-5, SI-2(3) row) | Detail in Chapter 06 |
| Vol III Book 02, "Continuous Monitoring Record" (daily summary JSON, blob archive, 90-day trend, workbook) | KEV metric (corrected); assessor table | Scripts belong to Chapter 06 |
| Vol III Book 02, "FedRAMP 20x KSI Alignment" (RA-5, SI-2, SI-5 KSIs; evidence package) | KEV metric; KSI section | "RA-5 KSI" and "SI-2 KSI" names are not FedRAMP indicators; removed |
| Vol III Book 03, "FedRAMP 20x KSI Alignment" | KSI section | Theme mappings removed (see claim 53) |
| Vol III Book 04, "Feeding the Evidence Fabric"; "FedRAMP 20x KSI Alignment" | Pipeline emit stage; configuration conformance metric | KSI mappings removed |
| Vol III Book 05, "FedRAMP 20x Key Security Indicator Alignment" | Tiers (immutable copies, audit integrity) | KSI-CNA mapping for Purview removed |
| Vol III Book 06, "The FedRAMP Assessor Evidence Standard" | What an assessor verifies (AU-6 row) | Full text in Chapter 05 |
| Vol III Book 06, "Mean Time to Detect" | MTTD metric (link to Chapter 05) | — |
| Vol III Book 06, "AU-11 Retention Architecture" (three-tier, WORM 1,095 days, GRS 3.2 minimum) | Retention tiers and tamper-protected copies | Specific day counts not carried; GRS framing corrected |
| Vol III Book 06, "FedRAMP 20x KSI Alignment" | KSI section | Automation claims corrected |

## Consistency fixes from the deck review (2026-10-21)

| # | Change | Verdict | Source |
|---|---|---|---|
| D1 | Ch06's `WithinDeadlinePct` reframed as an internal working signal; reported remediation = closures within timeline + overdue (Ch12) | design consistency | — |
| D2 | Ch12 KEV timeline sentence no longer implies triage for every total-impact KEV; defers to Ch06's full BOD 26-04 table | corrected (consistency) | BOD 26-04 table as reproduced in Ch06 |
| D3 | Retention-tier decision assigned to security engineering (decider) with CISO and SOC consulted, matching Ch10's matrix | design consistency | — |
| D4 | Ch02 cross-reference: DLP alert-tuning decision → SOC under Ch10; Ch09 for DLP policies | wording | — |
| D5 | CISA one-hour clock: identified by top-level CSIRT, SOC or IT department (Ch10, App A) | corrected | https://www.cisa.gov/federal-incident-notification-guidelines (opened Oct 21, 2026) |
| D6 | Ch05: the two Microsoft pages disagree on Defender XDR connector availability in DoD; stated explicitly | clarified | existing [^c05-feature], [^c05-govfeat] |
