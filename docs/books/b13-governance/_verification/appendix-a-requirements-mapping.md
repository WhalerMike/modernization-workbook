# Verification — Appendix A, Requirements Mapping

Writer W7. Sources: control mentions across every Book 13 source page (grep of all source files for 800-53 identifiers, KSI families, OSCAL, M-24-15 and FISMA), Appendix E of `docs/whitepapers/ticket-to-machine-appendices.md`, the plane-to-control table in `docs/compliance/Vol_X_Book_00_Governance_Substrate_Integration_Overview.md`, and the control IDs cited by the twelve Book 13 chapters as written on October 21, 2026 (grep of each chapter file, used to fill "Carried in").

Method, all on October 21, 2026: control identifiers and titles were checked against two NIST sources, the CSRC Cybersecurity and Privacy Reference Tool export for SP_800_53_5_2_0 (csrc.nist.gov, JSON export) and the OSCAL catalog 5.2.0 (last modified May 11, 2026); statements were summarized from the OSCAL statement text printed for each control. NIST baseline membership was read from NIST's OSCAL Low, Moderate and High baseline profiles. FedRAMP class membership was read separately from the "FedRAMP Rev5 Baselines" line on each control in FedRAMP's 2026 Full Rev5 Control Reference (family pages AC, AU, CA, CM, CP, IA, PM, RA, SA, SC, SI, SR). KSI mappings were computed from the "Related SP 800-53 Controls" line of each of the 46 indicators on FedRAMP's KSI page. Per the coordinator's instruction, NIST and FedRAMP membership are in separate columns for every control.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | IDs and titles of all 50 controls in the tables | Control tables | verified | CSRC CPRT export 5.2.0; OSCAL catalog |
| 2 | Short statement of what each control asks | Control tables | verified (summarized from OSCAL statement text) | OSCAL catalog |
| 3 | NIST baselines per control, e.g. CM-3 M H; CM-3(1), CM-5(1), CM-6(1), CM-6(2), AU-9(3), AU-10 H only; CM-3(2), SI-2(2), CA-7(1), AC-5 M H; PM-4, PM-10, PM-31, SR-4, CA-7(6), CM-3(3), CM-3(5), CM-5(4), CA-6(1), CA-6(2), SI-2(5), AU-14 none | Control tables | verified | NIST OSCAL baseline profiles |
| 4 | FedRAMP classes per control, e.g. CM-3 C D; CM-5(1), CM-6(1), CM-3(2), SI-2(2) C D; CM-3(1), CM-6(2), AU-9(3), AU-10 D only; CA-5 and the "none" set show no class listing | Control tables | verified | FedRAMP Full Rev5 Control Reference |
| 5 | KSI indicators citing each control (as of the Oct 13, 2026 mapping update) | Indicators column | verified | FedRAMP KSI page |
| 6 | 46 KSIs in ten themes, theme names | Mandates | verified | FedRAMP KSI page |
| 7 | Evidence-plane pairs and their indicators; all pairs in FedRAMP Class C; AC-4, IA-3, SC-8 NIST M H | Planes table | verified (pairs are program design from the Vol X source; indicator column corrected) | KSI page; control reference; NIST profiles |
| 8 | SP 800-37 tasks P-7, S-5, A-5, A-6, R-1 to R-5, M-1 to M-7 and names | Mandates | verified | SP 800-37r2 §3 and task summaries |
| 9 | Reciprocity definition; ATU issued by customer AO with same responsibility, only after a valid ATO; joint and type authorizations; denial, terms, conditions, termination date | Mandates, exposure, cited-but-not | verified | SP 800-37r2 §1.1, App. B, App. F |
| 10 | SP 800-137 definition (quoted), six steps, manual-plus-automated | Mandates | verified | SP 800-137 Executive Summary, Ch. 3 |
| 11 | A-130 App. I §4.d items 1–5 | Mandates, exposure | verified | OMB A-130 |
| 12 | M-24-15 date, presumption of adequacy and how it is overcome, OSCAL, machine-readable, change-process monitoring | Mandates | verified | M-24-15 §IV.a, §V, §VI |
| 13 | FedRAMP 2026 dates: July 4, 2026 optional; Jan 1, 2027 mandatory; June 11, 2027 end of new Rev5 | Mandates | verified | FedRAMP Important Dates |
| 14 | AGU rules: policy aligned to M-24-15, ATO before use, notify after authorization, OSCAL/JSON GRC tools, no extra requirements, notify concerns likely to rescind ATO | Mandates, exposure | verified | FedRAMP Agency Use page |
| 15 | OCR every 3 months; CCM-AGM-ROR MUST vs AGU-USE-ROR SHOULD | Mandates, cited-but-not | verified (discrepancy is on fedramp.gov itself) | FedRAMP CCM and AGU pages |
| 16 | SCN types and routine recurring exemption; auditable evaluation records | Mandates | verified | FedRAMP SCN page |
| 17 | VDR timeframes by class: D 12 h–192 d, C 2–192 d, A/B 4–192 d; SHOULD for providers; KEV per BOD 26-04 | Mandates, cited-but-not | corrected (source said 4 to 192 days) | FedRAMP VDR page |
| 18 | BOD 25-01 date, required actions and deadlines, AO risk acceptance for deviations, BOD as compulsory direction under 44 U.S.C. § 3554(a)(1)(B)(ii) | Mandates, exposure, cited-but-not | verified; source's five-obligation framing corrected | BOD 25-01 page |
| 19 | BOD 26-04 revocations and Phases I–III | Mandates, cited-but-not | verified; source's Aug 7 policy date corrected | BOD 26-04 page |
| 20 | CM-5(1), CM-6(1) "Moderate" | Cited-but-not | corrected: NIST High only; FedRAMP C D | NIST profiles; FedRAMP reference |
| 21 | Source KSI bindings for SI-2, RA-5, CA-2, CA-5, IA-5(2), SC-17 | Cited-but-not | corrected | FedRAMP KSI page |
| 22 | KSI-RECIP-001..008 are FedRAMP indicators | Cited-but-not | corrected (program's own checks) | FedRAMP KSI page |
| 23 | One ATO covers all consuming agencies | Cited-but-not | corrected | SP 800-37 App. F; M-24-15; AGU-USE-ABU |
| 24 | KSI-CMT-RMV "wherever reasonable" | Cited-but-not | verified | FedRAMP KSI page |
| 25 | "None of the documents cited sets a monetary penalty for an agency" | Exposure | restated-as-design (scoped to the documents read, not a general legal claim) | the documents listed |
| 26 | Source's E.4 rows on IG findings, material weakness, FedRAMP suspension | Exposure | removed (not verified in a primary source opened for this appendix) | — |
| 27 | Indicator membership for the Vol X plane table (source: KSI-CNA for AC-4, KSI-PIY for IA-3, KSI-CED for continuity) | Planes table | corrected | FedRAMP KSI page |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Appendices source, App E intro | Appendix A intro and how-to-read | — |
| App E.1 control table (CM-6, RA-5, SI-2, AC-2/3/6, CA-2/5/7, IA-5(2), SC-17) | Appendix A control tables, with titles re-verified and KSI column corrected | — |
| App E.1 "Not tool-attestable alone" | Appendix B, coordination loop (as program assessment) | Tool-attestable flags from the platform books are internal markings |
| App E.1 automation enhancements CM-3(2), CM-5(1), CM-6(1), SI-2(2) | Appendix A how-to-read and cited-but-not table | Corrected baseline claim |
| App E.2 evidence emission, KSI families, CMT-RMV/VTD/RVP, VDR clock, cadence | Appendix A mandates (KSI, CCM, VDR rows), cited-but-not (RMV, VDR) | Internal pipeline references dropped |
| App E.3 BOD 25-01 attribution note | Not carried | The workbook already attributes BODs to CISA throughout; no confusion to correct |
| App E.3 BOD 25-01 table and row-5 argument | Appendix A mandates row and cited-but-not row | Corrected to the directive's actual required actions |
| App E.3 BOD 26-04 | Appendix A mandates and cited-but-not | Internal decision status ("PROPOSED") dropped |
| App E.4 exposure table | Appendix A "What non-compliance exposes" | IG/material-weakness and FedRAMP suspension rows not verified; removed |
| App E.4 honest shape, currency caveat | Appendix A exposure closing paragraph; compliance-enabling callout | — |
| Vol X Book 00, plane/control/KSI table | Appendix A planes table | KSI column corrected |
| Vol X Book 00, SOC 2 crosswalk (CC6, CC7, CC8) | Not carried | Outside the federal scope of this appendix; Book 14 uses that volume |
| Reciprocity brief: M-24-15, FISMA legal basis, KSI-RECIP, one-ATO claim | Appendix A M-24-15 rows, cited-but-not rows | Program CLI and cadence SLAs belong to Chapter 11 |
| KSI conformance brief: KSI corpus sits above 800-53 | Appendix A how-to-read (indicators column) | Rule counts and CLI belong to Chapter 11 |
| Other source pages (control mentions only) | Appendix A control tables | — |
