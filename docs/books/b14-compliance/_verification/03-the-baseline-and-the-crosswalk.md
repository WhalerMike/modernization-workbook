# Verification — Chapter 03, The Control Baseline and the Crosswalk

Writer W2. Sources: `docs/compliance/Vol_0_Book_02_Control_Crosswalk.md` (Date Code 2026-07-19 20:10 ET) and `docs/compliance/Vol_0_Book_01_Product_Inventory_Questionnaire.md` (Date Code 2026-07-18 00:33 ET).

Method, all on October 21, 2026. The 149 crosswalk rows were parsed from the source table. Identifiers and titles were checked against the CSRC Cybersecurity and Privacy Reference Tool export for SP_800_53_5_2_0 (all 149 present; titles match except capitalization and the crosswalk's practice of prefixing an enhancement with the base control's title) and against the OSCAL catalog 5.2.0 (none withdrawn). Note: two direct downloads of the CSRC export endpoint from this session were truncated by the server; the complete export file used for the check was downloaded from the same CSRC endpoint earlier the same day in the shared session scratchpad, and its document metadata (SP_800_53_5_2_0, version 5.2.0) was confirmed. NIST baseline membership was computed from the OSCAL Low, Moderate, High and Privacy baseline profiles (5.2.0, last modified May 11, 2026). FedRAMP class membership was parsed from the "FedRAMP Rev5 Baselines" line on all twenty family pages of FedRAMP's 2026 Full Rev5 Control Reference. Indicator citations were computed from the "Related SP 800-53 Controls" of all 46 indicators on FedRAMP's KSI page. Marketplace data from `products.json`. Per-volume and per-book counts were recomputed from the parsed rows.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SP 800-53B: three security baselines plus a privacy baseline applied irrespective of impact level | Two facts | verified | csrc SP 800-53B page (abstract) and PDF |
| 2 | NIST Moderate baseline = 287 controls and enhancements | Two facts | verified (new) | NIST OSCAL Moderate profile 5.2.0 |
| 3 | Release 5.2.0 of 800-53B changed no baselines | Two facts | verified | csrc SP 800-53B planning note Aug 27, 2025 |
| 4 | CR26 launched June 25, 2026; offerings "FedRAMP Certified" in Classes A–D | Two facts | verified | FedRAMP launch blog June 25, 2026; NTC-0004 |
| 5 | NTC-0004 quote "Class C will include the current Moderate baseline"; Class D High | Two facts | verified | fedramp.gov/notices/0004 |
| 6 | FedRAMP Class C lists 322 controls and enhancements | Two facts | verified (new) | FedRAMP Full Rev5 Control Reference, all 20 families |
| 7 | M-24-15 fn 7: FedRAMP follows SP 800-37 "but the control baselines used have been specifically tailored for cloud offerings" | Two facts | verified (new) | M-24-15 PDF |
| 8 | Class C includes 36 controls not in NIST Moderate; NIST Moderate has 1 not listed for Class C (CA-5) | Two facts | verified (new) | computed from profiles and FedRAMP pages |
| 9 | AU-10, AU-12(1), SC-12(1): NIST H only, FedRAMP D; CM-5(1) NIST H, FedRAMP C D; SI-2(3), SI-4(16) no NIST baseline, FedRAMP C D; AU-6(4) no NIST baseline, FedRAMP D; SC-8, SC-8(1) NIST M H, FedRAMP B C D; CA-5 NIST L M H, no FedRAMP class line | Divergence table | verified | NIST profiles; FedRAMP pages (CA-05, AU-06(04), SI-04(16), SI-02(03) spot-checked in page text) |
| 10 | CA-5 gap "looks like an omission on the page"; program keeps a POA&M | Divergence table note | restated-as-design | — |
| 11 | PM family: "implemented at the organization level and are not directed at individual information systems"; PM-1 deployed organization-wide, not associated with security baselines, independent of impact level | Outside both | verified | SP 800-53B Table 3-13 |
| 12 | PT-1–PT-5, PT-7 and AT-3(5) are in the privacy baseline | Outside both | verified (new) | NIST OSCAL Privacy profile |
| 13 | FedRAMP lists no class for the PM and PT controls the series indexes | Outside both | verified | FedRAMP PM and PT pages |
| 14 | Crosswalk build rules (first-class treatment only; NIST titles; enhancement rows; implementation rows; training volume AT-2/AT-3 only; coordination volumes not second closure) | How built | restated-as-design | Source "How This Crosswalk Was Built" |
| 15 | 149 identifiers and titles exist in SP 800-53 5.2.0, none withdrawn | How built | verified | CSRC CPRT export; OSCAL catalog |
| 16 | Only CM-5, AC-2(3), AC-2(4), SA-9(2) appear solely in coordination volumes | How built | verified (recomputed) | crosswalk rows |
| 17 | Generated slice vs hand-maintained superset; back-fill queue | Superset | restated-as-design; internal counts (106 closures, 21 of 72 books, 53 controls, 13 of 106 tests, 96 not closed) dropped per brief | — |
| 18 | 149 distinct controls in 18 families | Coverage | verified (recomputed) | crosswalk rows |
| 19 | Per-volume counts I 41, II 22, III 54, IV 54, V 2, VI 38, VIII 6 | Coverage | verified (recomputed) | crosswalk rows |
| 20 | Vol VII = 12, Vol IX = 10 | Coverage | corrected: 9 and 16 | recomputed from rows; source's own prose attributes AC-2(3), AC-2(4), SA-9(2) to Vol VII while the table indexes them under Vol IX Bk 05 |
| 21 | Source prose "series total moved from 146 to 149" with three additions while four new controls are named | Coverage | removed (internal history, internally inconsistent) | — |
| 22 | 293 book-to-control pointers; top 12 books account for 136; per-book lists | Coverage by book | verified (new, recomputed) | crosswalk rows |
| 23 | 94 of 149 controls treated in exactly one book | Coverage by book | verified (new) | crosswalk rows |
| 24 | Crosswalk indexes 121 of 287 NIST Moderate and 122 of 322 FedRAMP Class C | Not covered | verified (new) | computed |
| 25 | All 18 security families' -1 controls in Moderate; only SR-1 indexed | Not covered | verified (new) | computed |
| 26 | PE 18 and MA 9 Moderate controls, none indexed | Not covered | verified (new) | computed |
| 27 | 75 Moderate enhancements not indexed, mostly AC (13), CM (11), IA (10) | Not covered | verified (new) | computed |
| 28 | Source KSI labels (KSI-IAM, KSI-MLA, KSI-022 …) | KSI view | corrected: FedRAMP publishes 46 indicators in ten themes with three-part IDs; no KSI-022; training controls cited by KSI-CED-RAT | FedRAMP KSI page |
| 29 | Mappings revised October 13, 2026 | KSI view | verified | FedRAMP KSI page changelogs |
| 30 | 118 of 149 cited by at least one indicator; per-theme counts and indicator lists | KSI view | verified (new, computed) | FedRAMP KSI page |
| 31 | AC-4, AC-17 cited by IAM indicators; CA-3 by KSI-SCR-MON; SI-2 by KSI-CMT-VTD; SI-2(2) by KSI-SVC-EIS; CA-5, CA-6, MP, PM, PT cited by none | KSI view | corrected (source assigned CNA, PIY, MLA/SVC) | FedRAMP KSI page |
| 32 | FedRAMP 20x asks "cloud service providers to demonstrate desired security capabilities"; indicators give measurable validation | Indicators bind providers | verified | FedRAMP providers KSI page |
| 33 | KSIs bind providers, not agencies | Indicators bind providers | verified (settled in workbook) | Book 10 Ch03, linked |
| 34 | AGU-USE-ABU (agencies MUST complete ATO); AGU-AGC-GRC (OSCAL JSON) | Indicators bind providers | verified | FedRAMP Agency Use page |
| 35 | OCR review: CCM-AGM-ROR MUST vs AGU-USE-ROR SHOULD; follow MUST | Indicators bind providers | verified (AGU-USE-ROR text read; CCM per settled Book 12/13) | FedRAMP Agency Use page; Book 12 Ch12, Book 13 Ch11 |
| 36 | Questionnaire purpose, organization, working columns, Maps-to column | Questionnaire | verified against source; restated-as-design | Source §1, §4 |
| 37 | Marketplace dataset fields status, cert_class, impact_level; 781 listings; statuses listed | Questionnaire | verified (new) | products.json (last change Oct 21, 2026) |
| 38 | FedRAMP Ready submissions stopped after July 28, 2026 | Questionnaire | verified | FedRAMP Important Dates |
| 39 | Source note: CR26 public preview May 4, 2026 | Questionnaire | removed (not needed; launch date cited instead) | — |
| 40 | Class D-only = flag | Scope rule | corrected: usable; M-24-15 presumption "at or below" the impact level; NTC-0004 agencies may use a package at any category they deem appropriate | M-24-15 §IV.a; NTC-0004 |
| 41 | On-prem gear not a FedRAMP item | Scope rule | verified | FedRAMP "Scope of FedRAMP" (cloud computing products and services) |
| 42 | Source: on-prem gear accredited via NIAP CC + DISA STIG + FIPS 140-3 + DoDIN APL | Scope rule | not carried here; pointed to Appendix B (W7 verifies the instrument list) | — |
| 43 | Uncertified commercial SaaS "not eligible" | Scope rule | corrected/restated-as-design: agencies must promote certified services within scope; some uses are out of scope; program treats it as an AO decision | FedRAMP Scope page |
| 44 | Questionnaire ships empty; incumbent-suite preference earned, not automatic | Questionnaire | restated-as-design (agency name and Microsoft EA specifics removed) | Source §2 note, §3 |
| 45 | Source flags list naming specific products and their FedRAMP classes (Riverbed, Confluence, ServiceNow, Prisma Cloud) | Questionnaire | not carried in the chapter (agency-edition content, dated vendor status; Appendix B owns the instrument) | — |
| 46 | Five-step use sequence | Using the two together | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Crosswalk front matter, internal banner, draft-proposal box (agency shortcode, team name, Date Code) | — | Internal stamps and agency shortcode; never carried |
| Crosswalk "Purpose" | Ch03 "How the crosswalk was built" (three jobs) | Volume VII–IX new-control note kept as the four coordination-only controls |
| Crosswalk "Maintenance status" box | Ch03 "A hand-maintained superset and a generated slice" | Script/workflow file names and internal counts dropped (internal, dated) |
| Crosswalk "How This Crosswalk Was Built" (bullets) | Ch03 "How the crosswalk was built" | Spine, claim→evidence→test counts dropped; principle kept |
| Crosswalk "Addressed here is a coverage pointer" note | Ch03 callout "A pointer, not an inheritance claim" | — |
| Crosswalk "Master Control Crosswalk" table (149 rows) | Appendix A (W7) holds the condensed table; Ch03 uses it for the recounts, divergence table and indicator view | Not reproduced in the chapter (appendix owns it) |
| † coordination-only footnote | Ch03 "Coordination is not a second closure" bullet | — |
| Crosswalk "Control Coverage by Volume" | Ch03 volume table (recounted; VII and IX corrected) | "146 to 149" history removed |
| Crosswalk "FedRAMP 20x KSI View" and its paragraph | Ch03 "The FedRAMP 2026 indicator view" (recomputed against the 46 published indicators) | Old theme-level labels and KSI-022 replaced |
| Crosswalk "Notes and Caveats" | Ch03 build rules (enhancement rows, multiple books intentional) and "Repeat" step | Regeneration instruction is internal tooling |
| Crosswalk "Appendix — Controls Addressed but Not Yet Closed in the Spine" (96 rows, by family) | Ch03 superset paragraph ("claimed in prose, not yet proven"); "What the index doesn't cover" quantifies the baseline gap the appendix said couldn't be enumerated | Internal counts dropped per brief; the per-control queue is internal state |
| Questionnaire front matter, banner, draft box | — | Internal stamps; never carried |
| Questionnaire §1 Purpose and How to Use (two editions) | Ch03 "The product inventory questionnaire"; "ships empty" rule | Edition mechanics and agency shortcode not carried |
| Questionnaire §2 Scope rule and dispositions table | Ch03 dispositions table (corrected) | Agency-edition hard rule generalized to "the boundary's level" |
| Questionnaire §2 FedRAMP nomenclature note | Ch03 "Two facts" (classes, launch) and Marketplace paragraph | May 4 preview date not needed |
| Questionnaire §2 Selection principle (Microsoft-suite preference earned) | Ch03, generalized to "incumbent suite" | Agency EA reference and product examples dropped |
| Questionnaire §3 Pre-filled inventory | Ch03 "ships empty" | — |
| Questionnaire §4 discovery tables (Vols I–IV, VII–IX) and Vol V/VI note | Ch03 category list and working columns; full tables in Appendix B (W7) | — |
| Questionnaire §5 Flags & Gaps Summary | Ch03 "flags-and-gaps list" and use step 2 | Named-product rows not carried (dated vendor status) |
| Questionnaire §6 References — FedRAMP status sources | Ch03 Marketplace footnote | Vendor press-release links not carried; Marketplace is the authority |
