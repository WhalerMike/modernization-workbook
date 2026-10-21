# Verification — Appendix A, Requirements Mapping

Editor: W5. Sources: the series appendix in place ("Federal Requirements Mapping"); the whitepaper's Federal Framework Alignment table and its other federal citations. Format follows Book 09 Appendix B (and Book 08 Appendix B): requirement, what it asks, where addressed, closing book, evidence; a "cited but don't say" table; control notes; sources. All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | EO 14028 (May 12, 2021) requires agency ZTA plans; M-22-09 builds on them | Mapping | verified | EO 14028 (Federal Register PDF); M-22-09 §III |
| 2 | M-22-09 identity actions (centralized identity, MFA at application layer, phishing-resistant for staff/contractors/partners, option for public, no special-character/rotation rules, device-level signal) | Mapping | verified (source row summarized correctly; device-signal and app-layer items added) | OMB M-22-09 §III.A |
| 3 | M-22-09 devices (complete inventory; EDR to CISA requirements) | Mapping | verified | M-22-09 §III.B |
| 4 | M-22-09 networks: "Encrypt DNS and HTTP traffic where possible; stop relying on network location" | Mapping | corrected wording: encrypted DNS wherever technically supported; HTTPS for all web and API traffic; isolation plan | M-22-09 §III.C |
| 5 | M-22-09 applications: "enterprise identity in front of every application" | Mapping | corrected: treat apps as internet-connected, testing, external vulnerability reports (identity is §III.A) | M-22-09 §III.D |
| 6 | M-22-09 data: categorize data, monitor access | Mapping | verified; enterprise-wide logging added | M-22-09 §III.E |
| 7 | Logging: M-26-14 (May 22, 2026) rescinds M-21-31 | Mapping; cited-but table | verified | OMB M-26-14 |
| 8 | BOD 25-01 scope and dates | Mapping; cited-but table | verified | CISA BOD 25-01 |
| 9 | ZTMM v2.0 five pillars, three cross-cutting capabilities, four stages; "general guide" | Mapping | verified | CISA ZTMM v2.0 §5, §5.6 |
| 10 | Source table "typical maturity movement" per pillar (Traditional → Advanced etc.) | Mapping | removed: an unsourced projection presented as typical; replaced by "the agency's maturity self-assessment" as evidence | — |
| 11 | NIST 800-207 seven tenets (paraphrased table) | Mapping | verified (count and wording checked against §2.1); the per-tenet table was condensed to one row pointing to the chapters | NIST SP 800-207 §2.1 |
| 12 | SP 800-63-4 final July 31, 2025, supersedes 800-63-3 | Mapping | verified (added; whitepaper cited "SP 800-63 Rev 4") | NIST CSRC |
| 13 | Evidence Act: data inventory and CDO; nothing on identity attributes | Mapping; cited-but table | verified (signed January 14, 2019, from search result and congress.gov text) | Pub. L. 115-435 §202 |
| 14 | FedRAMP certifies services; agency authorizes own systems; dates | Mapping; cited-but table | verified | FedRAMP pages |
| 15 | SP 800-53 control names (AC-2, AC-3, AC-6, AC-6(7), AC-17, IA-2(1)(2)(12), IA-5, CM-2, CM-3, CM-6, CM-8, SA-8, SA-22, SC-20/21/22, AU-2, AU-6, AU-12, SI-4, CA-7) | Mapping | verified against OSCAL catalog 5.2.0 | NIST OSCAL |
| 16 | Baseline membership statements | Reading the controls | verified against OSCAL Low/Moderate/High profiles | NIST OSCAL |
| 17 | SA-22 added for end-of-support components | Mapping; reading the controls | verified (title); dates verified in Ch 10 | NIST OSCAL; Microsoft Learn |
| 18 | Whitepaper: "OMB M-22-09 §4" application-layer inspection | Cited-but table | corrected: M-22-09 has no §4 (sections I–III, actions III.A–F) | M-22-09 |
| 19 | Whitepaper: FedRAMP/M-22-09 expect ZTMM Advanced | Cited-but table | corrected | M-22-09; ZTMM |
| 20 | Whitepaper: ZTMM requires CBA as primary at Advanced/Optimal | Cited-but table | corrected: phishing-resistant MFA, passwordless via FIDO2 or PIV at Advanced | ZTMM Table 2 |
| 21 | Whitepaper: BOD 25-01 eliminates NTLM / modern auth throughout | Cited-but table | corrected | BOD 25-01 |
| 22 | Whitepaper: Evidence Act/Federal Data Strategy mandate single SoR for identity attributes | Cited-but table | corrected for the Act; the Federal Data Strategy wasn't separately verified, so it is named only as part of the claim | Pub. L. 115-435 |
| 23 | Whitepaper: machine-readable KSI evidence mandatory for all ConMon Jan 1, 2027 | Cited-but table | corrected | FedRAMP |
| 24 | Whitepaper: "NIST SP 800-37 Rev 2 CA-7" | Cited-but table | corrected: CA-7 is 800-53; 800-37 Rev. 2 is the RMF (December 2018), ending in continuous monitoring | NIST CSRC 800-37 r2 |
| 25 | Whitepaper: TIC Branch Office v1.0 April 2021; Remote User v2.2 and Cloud v1.2 July 2025 | Cited-but table | corrected: all four use cases revised September 2026 (core guidance page revision date September 23, 2026); versions in Book 09 Appendix B | CISA TIC core guidance page |
| 26 | Whitepaper rows: separate truth from enforcement (EO 14028, M-22-09, 800-207 §2) | Cited-but table | corrected to program design consistent with 800-207 | NIST SP 800-207 |
| 27 | Whitepaper rows: SC-20/21 DNS, CM-8 IP inventory, AU-2/12 provenance, SA-8 round trips, A-130 | Mapping | SC/CM/AU/SA rows verified and carried; "FedRAMP Moderate SC-20/21" kept as SP 800-53 controls; OMB Circular A-130 not separately verified, so not cited | — |
| 28 | Source "Gaps to plan for separately" (encrypted DNS, data pillar, 802.1X successors) | Data row; Appendix B | updated: encrypted DNS is Book 08, 802.1X/RADIUS is Book 09 Ch 07; data remains out of scope | Book 08; Book 09 |
| 29 | Old chapter numbers in "Where the series contributes" columns (Ch 00, 01, 02, 03, 09, 10) | Mapping | corrected to new numbering | — |
| 30 | Book 02 Ch 10 says Consolidated Rules "launched June 24, 2026"; FedRAMP's announcement is dated June 25 | — | flagged to the editor; Book 02 not edited | FedRAMP announcement |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Title, subtitle line, compliance-enabling paragraph | H1; italic thesis; "Compliance-enabling, not a compliance claim" callout | — |
| OMB M-22-09 goals table | Mapping table rows (five M-22-09 rows) | Corrected (claims 2–6) |
| CISA ZTMM v2 pillars table | One ZTMM row plus "Closed in" per row | Maturity-movement column removed (claim 10) |
| NIST SP 800-207 tenets table | One 800-207 row; tenets cited via §2.1 | Condensed; the chapter mechanisms are in the mapped chapters |
| NIST SP 800-53 controls table | Seven SP 800-53 rows, with SA-22 and AC-6(7) added | — |
| Gaps to plan for separately | Data row; Appendix B last bullet | Two of three gaps now closed by other books (claim 28) |
| Previous link | "Continue the book" callout (Ch 12 → Appendix B) | — |
| Footnotes (M-22-09, ZTMM, 800-207, 800-53) | Footnotes with section references and access dates | — |
| Whitepaper Federal Framework Alignment table | Mapping table and "cited but don't say" table | Row by row per claims 18–27 |
