# Verification — Appendix A, Requirements Mapping

Writer W6. Sources: the control-closure and authorities tables of Vol III Books 02, 03, 06 and 07 and Vol VI Books 07 and 08, plus the federal documents listed below. Control identifiers, titles and statements were extracted from NIST's SP 800-53 Rev. 5 OSCAL catalog (version 5.2.0, last modified May 11, 2026) with a local script, and cross-checked against the CSRC publication page (release 5.2.0 planning note). NIST baseline membership was read from NIST's OSCAL Low, Moderate and High baseline profiles. FedRAMP class membership was read from the "FedRAMP Rev5 Baselines" listing on each control in FedRAMP's 2026 Full Rev5 Control Reference (family pages AU, CA, CM, IR, RA, SC, SI). All opened October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | All 49 control IDs and titles in the tables | Control tables | verified | OSCAL catalog 5.2.0 |
| 2 | Short statements of what each control asks | Control tables | verified (summarized from the statement text printed for each control) | OSCAL catalog 5.2.0 |
| 3 | NIST baselines: e.g., AU-12(1) H only; AU-6(4), SI-2(3), SI-4(16), CA-7(3), PM-31, PM-6 in no baseline; AU-6(5), AU-10 H only | Control tables | verified | NIST OSCAL baseline profiles |
| 4 | FedRAMP 2026 Rev5 classes: AU-6(4), AU-6(5), AU-10, AU-12(1) Class D only; SI-2(3), SI-4(16) C and D; CA-7(3) none | Control tables | verified | FedRAMP Full Rev5 Control Reference |
| 5 | CA-05 shows no FedRAMP class listing | CA table | verified (as displayed on the page; flagged as an observation, not a policy statement) | FedRAMP AU/CA family page |
| 6 | Microsoft 365 GCC certified Class C, Moderate | How to read | verified (via Book 10's Marketplace footnote) | Book 10 Ch08 |
| 7 | M-26-14 rows | Mandates | verified | M-26-14 |
| 8 | BOD 26-04 phases, revocations, CDM reporting, tagging | Mandates | verified | BOD 26-04 |
| 9 | KEV catalog entries carry due date and forensic-triage flag; JSON/CSV feeds; inclusion criteria unchanged | Mandates | verified | KEV catalog page; BOD 26-04 |
| 10 | BOD 23-01 7/14 days, 72 hours, October 3, 2022 | Mandates | verified | BOD 23-01 page |
| 11 | BOD 25-01 reporting continuous or at least quarterly | Mandates | verified | BOD 25-01 Implementation Guidance |
| 12 | TIC 3.0 Guidebook v1.2 rows | Mandates | verified | TIC 3.0 Guidebook §4, §9, §10, §11, §13 |
| 13 | CISA one-hour notification | Mandates | verified | CISA Federal Incident Notification Guidelines |
| 14 | FedRAMP 2026: mandatory Jan 1, 2027; 46 KSIs/10 themes; OCR review MUST; OCR every 3 months; VDR graded timeframes | Mandates | verified | FedRAMP timeline, KSI, CCM, VDR pages |
| 15 | GRS 3.2 items and revision status | Mandates | verified | GRS 3.2; NARA status page |
| 16 | SP 800-61r3 April 2025, CSF 2.0 profile, supersedes r2 | Mandates | verified | SP 800-61r3 front matter |
| 17 | SP 800-53A examine/interview/test | Mandates | verified | SP 800-53A r5 |
| 18 | BOD 22-01 revoked by BOD 26-04 | Cited-but-not table | corrected (source called it in force in places) | BOD 26-04 |
| 19 | Source's 14-day KEV internet-facing tier "at least as tight" | Cited-but-not table | corrected | BOD 26-04 Table 1 rows 1–4 |
| 20 | 12+18 months, EL0–EL3 are M-21-31's | Cited-but-not table | corrected | M-26-14 (rescinds M-21-31) |
| 21 | Source "FedRAMP Moderate" gate for AU-12(1), SI-4(16) (and AU-6(4)) | Cited-but-not table | corrected | NIST profiles; FedRAMP control reference |
| 22 | KSI automation querying Sentinel | Cited-but-not table | corrected | FedRAMP KSI page |
| 23 | SOC is not an RMF role | Cited-but-not table | verified | SP 800-37r2 App. D |
| 24 | Data lake tier doesn't meet "searchable" for detection sources | Cited-but-not table | verified (Microsoft statement) + restated-as-design (program rule) | M-26-14 fn. 6; Learn Sentinel tiers and ingestion guidance |
| 25 | Chapter assignments for Chapters 02, 06–09, 11 | Control tables | restated-as-design | Assigned from the brief's chapter list and the source volumes those chapters consume; confirm against final chapter text |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol III Book 07, authorities table (AU-3, AU-6(1), AU-12, AU-12(1), CA-7, SI-4(16)) | AU, CA, SI tables | "Accreditation gate: FedRAMP Moderate" corrected per baseline columns; "Tool-attestable?" and "Evidence slot" columns are series-internal and not carried |
| Vol III Book 06, NIST control closure table (AU-6, AU-6(1), AU-6(4), AU-7, AU-8, AU-11, SI-4, SI-4(2), SI-4(4), SI-4(7), IR-4, IR-6, IR-8) | AU, SI, IR tables | SI-4(7) not carried (out of the brief's list; Chapter 11 owns automated response); "OMB M-24-04" attribution for 1-hour reporting replaced with CISA's guidelines |
| Vol III Book 02, NIST control closure table (RA-5, RA-5(2), RA-5(5), SI-2, SI-2(2), SI-5, CM-7, CM-7(1)) | RA, SI, CM tables | CM-7(1) not carried (detail for Chapter 07); BOD 26-04 SLA wording corrected |
| Vol III Book 03, authorities table (CM-8, RA-5, CM-2, CM-6, SI-2, SI-2(2), SI-2(3)) | CM, RA, SI tables | KSI column not carried (series-internal mapping) |
| Vol VI Book 07, controls operationalized (CA-7, AU-6(1), AU-12(1), CA-5) | CA, AU tables | — |
| Vol VI Book 08, controls operationalized (CA-2, CA-7(3), CM-6, SI-4) | CA, CM, SI tables | — |
| Brief: SC-7 telemetry | SC table and note | Boundary design is Book 09/10's |
| Brief: M-26-14, BOD 25-01, KEV directive, TIC telemetry | Mandates table | — |
