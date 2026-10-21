# Verification — Chapter 11, The Authorization Package and Continuous Monitoring

Writer W6. Sources: `docs/compliance/Vol_IV_Book_06_Authorization_Package_ConMon.md`, `docs/compliance/Evidence_Contract_Spec.md`, `docs/program/test-plans.md` (archived after the build; not linked). Primary sources opened October 21, 2026: NIST SP 800-37 Rev. 2 PDF (text extracted with pypdf), NIST SP 800-137 PDF (pypdf), SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog and the LOW/MODERATE/HIGH baseline profiles (usnistgov/oscal-content, read with Python), CSRC SP 800-53A Rev. 5 page, OSCAL "Layers and Models" page, OSCAL release v1.2.3 (GitHub release API and the POA&M, assessment-results and assessment-plan JSON schemas), OSCAL-Reference POA&M JSON outline, 44 U.S.C. § 3554 (Cornell LII), OMB A-130 PDF (pypdf), OMB M-26-05 PDF (pypdf), FedRAMP timeline page, FedRAMP launch post of June 25, 2026, FedRAMP Collaborative Continuous Monitoring page, FedRAMP Agency Use rules page, FedRAMP NTC-0014, CISA BOD 26-04 page, Microsoft Learn Secure Score and Compliance Manager FAQ pages, and the metaschema-framework oscal-cli README. The illustrative POA&M generator was run on the sample findings and its output validated against `oscal_poam_schema.json` v1.2.3 with jsonschema 4.26 plus the `regex` module (0 errors).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Agencies must complete their own ATO process before using a certified service | Opening | verified | FedRAMP AGU-USE-ABU |
| 2 | Package = security and privacy plans, assessment reports, POA&M, executive summary; version and change control | What the package contains | verified | SP 800-37r2 Task R-1 |
| 3 | Task numbers and responsibilities: S-6, A-2, A-4, A-6, R-1, R-4 | Package table | verified | SP 800-37r2 §3.3–3.6 |
| 4 | Package may be generated from a tool; NIST encourages maximal automation; automated reports under ongoing authorization | Four details | verified | SP 800-37r2 R-1 and fn. 94, 97 |
| 5 | A comparable report constitutes the assessment report/package | Four details | verified | SP 800-37r2 fn. 92, 96 |
| 6 | Risk acceptance can't be delegated | Four details | verified | SP 800-37r2 Task R-4 |
| 7 | Decision conveys termination date or time-driven authorization frequency | Four details | verified | SP 800-37r2 Task R-4 discussion |
| 8 | Agency notifies FedRAMP with the ATO letter (not package submission) | Package section | verified (via Book 13 Ch11, AGU-AGC-NAA) | Book 13 Ch11 |
| 9 | Source: "nothing in this package is submitted to the FedRAMP PMO" | Package section | corrected (package not submitted, but the ATO letter is) | AGU-AGC-NAA via Book 13 Ch11 |
| 10 | OSCAL three layers and their models; assessment-layer description | OSCAL section | verified | OSCAL layers page |
| 11 | OSCAL 1.2.3 is current, published Aug 7, 2026 | OSCAL section | verified | GitHub release API |
| 12 | AP requires import-ssp; AR requires import-ap; POA&M import-ssp optional, system-id alternative; POA&M required = uuid, metadata, poam-items | OSCAL table and text | verified | OSCAL 1.2.3 schemas |
| 13 | Source: POA&M imports the AP | OSCAL section | corrected | OSCAL 1.2.3 POA&M schema |
| 14 | Source: "OSCAL 1.0.4 documents" | — | corrected (current release 1.2.3; code targets 1.2.3) | OSCAL release |
| 15 | Agency GRC tools must produce and ingest OSCAL/JSON | OSCAL section | verified | FedRAMP AGU-AGC-GRC |
| 16 | CA-2 plan elements, AO approval, report | Assessment plan | verified | SP 800-53r5 5.2.0 catalog |
| 17 | Assessment plans reflect assessment type; automation for continuous monitoring | Assessment plan | verified | SP 800-37r2 Task A-2 |
| 18 | 800-53A examine/interview/test objects for CA-5 | Assessment plan | verified | 5.2.0 catalog (carries 800-53A procedures); CSRC 800-53A page |
| 19 | CA-2(1) and CA-7(1) in Moderate baseline | Independence | verified | 5.2.0 MODERATE profile |
| 20 | Self-assessment verdicts advisory pending independent SCA | Independence | verified (source's own notice); restated as program position | Source |
| 21 | Agency may but needn't use a FedRAMP-recognized assessor for its own system | Independence | restated-as-design (no requirement found; SP 800-37 leaves assessor selection to the organization, Task A-1) | SP 800-37r2 A-1 |
| 22 | Test-plan catalog rules; four CI gate categories | Test plans | restated-as-design | Source (test-plans.md) |
| 23 | AR results/findings structure; objective status state satisfied/not-satisfied, reason pass/fail/other | Assessment results | verified | OSCAL 1.2.3 AR schema |
| 24 | Source: finding state `other` | Assessment results | corrected (other is a reason) | OSCAL 1.2.3 AR schema |
| 25 | SP 800-37: reports cover findings for controls within/inherited; ongoing auth presents deficiencies | Assessment results | verified | SP 800-37r2 A-4, R-1 |
| 26 | Source: "29/29 satisfied" and CR26 19/46 mapping | Assessment results | restated (counts dropped; "fewer than half" kept as the source's own reconciliation) | Source |
| 27 | CA-5 text | POA&M | verified | 5.2.0 catalog |
| 28 | A-6 POA&M contents; AO review; "entries are not necessary when deficiencies are accepted"; audit trail in automated tool | POA&M | verified | SP 800-37r2 Task A-6 |
| 29 | Disposition vocabulary (actionable drift, governed exception, lapsed acceptance); no item always satisfied | POA&M | restated-as-design | Evidence contract spec |
| 30 | OSCAL risk status values | POA&M | verified | OSCAL 1.2.3 schema |
| 31 | Disposition-to-status mapping | POA&M | restated-as-design | — |
| 32 | Source: zero-item POA&M is the correct target state | POA&M | corrected (restated as a prompt to check coverage; program design) | — |
| 33 | Illustrative generator output validates against 1.2.3 POA&M schema | Code | verified (run locally) | OSCAL 1.2.3 schema |
| 34 | OSCAL schemas use `\p{L}`-style patterns Python `re` rejects | Code | verified (observed error, `bad escape \p`) | Local run |
| 35 | CA-7 elements; CA-7(4) in all three baselines | Continuous monitoring | verified | 5.2.0 catalog and profiles |
| 36 | SP 800-137 six steps; manual-plus-automated quote; all controls regularly assessed | Continuous monitoring | verified | SP 800-137 Exec Summary |
| 37 | Monthly/quarterly/semi-annual/annual cadence table | Cadence | restated-as-design | Source §3 |
| 38 | FISMA: testing no less than annually | Cadence | verified | 44 U.S.C. § 3554(b)(5) |
| 39 | CA-7(3) text; not in any NIST baseline | Cadence | verified | 5.2.0 catalog and profiles |
| 40 | Source: CA-7(3), RA-3, SA-15 "closed" by this volume | Cadence | restated (CA-7(3) adopted as design; SA-15 claim about the engine's own CI dropped as internal) | — |
| 41 | Evidence freshness by category | Freshness | restated-as-design | Source §6.2 |
| 42 | Evidence contract: three inputs, two outputs, five invariants | Contract | restated-as-design | Evidence contract spec |
| 43 | No three-year ATO rule; periods agency-set | Ongoing authorization | verified (settled) | Book 13 Ch01; brief |
| 44 | A-130 transition to ongoing authorization; reauthorize time/event-driven | Ongoing authorization | verified | A-130 App. I §4.d items 3–4 |
| 45 | SP 800-37 definition of ongoing authorization; termination date can be eliminated; frequency replaces date | Ongoing authorization | verified | SP 800-37r2 App. F; R-4 discussion |
| 46 | Monitor task names M-2 to M-6 | Ongoing authorization | verified | SP 800-37r2 §3.7 table |
| 47 | Consolidated Rules launched June 25, 2026 | FedRAMP | verified (announcement post June 25; FedRAMP changelog records June 24 as "official launch") | FedRAMP launch post; CCM changelog |
| 48 | Mandatory Jan 1, 2027; no new Rev5 applications after June 11, 2027 | FedRAMP | verified | FedRAMP timeline |
| 49 | Class pipelines are for providers | FedRAMP | verified | FedRAMP timeline |
| 50 | OCR every 3 months and its eight content items | FedRAMP | verified | CCM-OCR-AVL |
| 51 | Quarterly Review MUST at Classes C and D, SHOULD B, MAY A | FedRAMP | verified | CCM-QTR-MTG |
| 52 | VDR/VER mandatory Dec 7, 2026; grace to March 7, 2027 under corrective action plan | FedRAMP | verified | NTC-0014 |
| 53 | CCM-AGM-ROR MUST; AGU-USE-ROR SHOULD; program follows MUST | FedRAMP | verified | CCM page; Agency Use page |
| 54 | CCM-AGM-CSC; AGU-USE-DSO designate senior official | FedRAMP | verified | CCM page; Agency Use page |
| 55 | AGU-USE-NFC must notify FedRAMP of serious concerns | FedRAMP | verified | Agency Use page |
| 56 | KSIs bind providers | FedRAMP | verified (settled) | Book 12 Ch12; Book 13 Ch11 |
| 57 | Source: BOD 26-04 requires SBOMs, VDR/VER filed with CISA by email, annual SBOM certification | Correction section | corrected (BOD 26-04 doesn't mention SBOM/VEX; VDR/VER are FedRAMP provider rules) | BOD 26-04 page; NTC-0014 |
| 58 | M-26-05 date; rescinds M-22-18 and M-23-16; inventory stays; SBOM by contract on request | Correction section | verified | M-26-05 PDF |
| 59 | Secure Score definition; "risk accepted" earns no points | Vendor scores | verified | Microsoft Learn |
| 60 | Compliance Manager FAQ: high score isn't full compliance | Vendor scores | verified | Microsoft Learn |
| 61 | Source: Microsoft365DSC comparison and Compliance Manager "no OSCAL output, no expiry math" | Vendor scores | removed (not verified; not needed) | — |
| 62 | Source authorization timeline (AO review Nov–Dec 2026, ATO Q1 2027) | — | removed (agency-specific plan dates) | — |
| 63 | Source: CISA submission address and subject line format | — | removed (not in BOD 26-04) | — |
| 64 | oscal-cli exact validate syntax | Code | removed (README gives no exact subcommand; chapter uses schema validation in Python instead) | oscal-cli README |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol IV Book 06 front matter, draft banner, Date Code | — | Not carried (stamps; agency shortcodes) |
| Preface (capstone, consuming agency, four deliverables, controls closed) | Opening; package section | Book counts and "twenty-two books" dropped; "nothing submitted to PMO" corrected |
| §1.1 Series summary and control coverage table | — | Moved to Chapter 12 (the map); counts dropped |
| §1.1 Self-assessment notice and KSI-count reconciliation | Independence; assessment results | Numbers dropped; the self-assessment and partial-yardstick point kept |
| §1.2 KSI scorecard and closure-necessity pointer | Assessment results | Scorecard dropped (internal, dated); matrix belongs to Ch04/Ch12 |
| Package architecture figure (fig-alt fragment) | New diagram ch11-package-and-models | Old PNG not reused |
| §2.1 Bundle architecture (AP, AR, POA&M; UUID links) | OSCAL section | POA&M import corrected |
| §2.2 Generating the bundle (engine command) | Illustrative code | Engine command replaced by engine-neutral, validated generator |
| §2.3 AP structure by KSI theme and evidence slot | — | Not carried (internal rule IDs and slots; the indicator vocabulary is in Book 12 Ch12) |
| §2.4 AR finding structure | Assessment results | State `other` corrected |
| §2.5 POA&M status (zero items) | POA&M section | Corrected: zero isn't the target |
| §3.1 ConMon framework (CA-7) | Continuous monitoring | Re-stated from the control text |
| ConMon cadence figure (fig-alt fragment) | Cadence table | Old PNG not reused |
| §3.2 Monthly activities | Cadence table | Tool and engine names dropped; ScubaGear role kept via Book 11 link |
| §3.2 Drift disposition pipeline (product name), verdict JSON | POA&M disposition table; illustrative findings JSON | The program tool's name dropped; JSON reshaped to the evidence-contract record |
| §3.2 Why not Secure Score or Compliance Manager | Vendor scores section | Re-verified on Microsoft Learn; Microsoft365DSC row removed |
| §3.3–3.5 Quarterly, semi-annual, annual activities | Cadence table | "BOD 26-04 SBOM annual certification" removed (doesn't exist) |
| §3.6 Trend analyses (CA-7(3)) | Cadence, trend paragraph | Noted not in any NIST baseline; adopted as design |
| §4.1 Package components | Package table; OSCAL table | "Evidence book series as DOCX" and VDR row dropped |
| §4.2 Authorization timeline | FedRAMP section | Provider pipeline dates kept as provider-only; agency plan dates removed |
| §4.3 AO checklist | "What the authorizing official should find" | Rewritten without internal counts and the false BOD 26-04 item |
| §5.1–5.2 BOD 26-04 VDR/VER submission, SBOM pipeline, syft/grype/vexctl script | Correction section | Corrected; SBOM pipeline belongs to Chapter 07 |
| §5.3 AT-4 evidence currency script | — | Training evidence is Chapter 09; freshness rule kept in the freshness table |
| §6.1 Post-authorization data flow | Evidence contract rules; Book 12 Ch12 link | Engine-specific flow dropped |
| §6.2 Evidence freshness by slot | Freshness table | Slot IDs replaced by category names |
| §6.3 SIEM dashboard workbooks | — | Not carried (Book 12 Ch12 covers metrics and dashboards) |
| §6.4 Roles (CA-7(1)) | Cadence table owners; Book 13 Ch09 link | — |
| §7.1 Risk register mapping | POA&M section (risk status) | Internal statement about 29 rules dropped |
| §7.2 Residual risks outside KSI evaluation | Chapter 12 residual risk | Moved |
| §8.1 Pre-decision checklist | AO checklist | Engine commands and internal paths dropped |
| §8.2 Decision package procedure (bash) | Illustrative code (generator plus validation) | Engine-specific commands and agency file names dropped |
| §9 Controls closed table | Package, assessment, POA&M, continuous monitoring sections | SA-15 (engine CI) dropped as internal |
| Appendix A AR findings summary | — | Not carried (internal rule list) |
| Closing disclaimer | — | Not carried |
| Evidence Contract §0 Why | Continuous monitoring, contract subsection | — |
| Evidence Contract §1–4 Inputs (spine, slots, cadence/dispositions) | Contract subsection; POA&M dispositions | "Spine" → control map in the authoritative record; slot IDs → categories |
| Evidence Contract §5–6 Outputs (OSCAL bundle, ConMon stream) | Contract subsection | — |
| Evidence Contract §7 Five invariants | Contract subsection | — |
| Evidence Contract §8 KSI-count reconciliation | Assessment results; Chapter 12 residual risk | Counts dropped |
| Evidence Contract §9 What this buys | Contract subsection (fifth rule) | — |
| test-plans.md: catalog purpose and three entry rules | Test plans | — |
| test-plans.md: what runs in CI | Test plans | — |
| test-plans.md: companion pages | — | Not carried (links to archived pages) |
