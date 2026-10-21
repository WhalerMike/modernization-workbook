# Verification log — Chapter 10, Evidence and Authorization for AI Systems

Writer W5, October 21, 2026. Method: M-25-21 and M-25-22 PDFs from whitehouse.gov (pdftotext); OMB memoranda index (through M-26-19); the 2025 inventory's data dictionary and reporting guidance; SP 800-37 Rev. 2 and Circular A-130 PDFs; 44 U.S.C. § 3554 on Cornell LII; the SP 800-53 Rev. 5.2.0 OSCAL catalog and Low/Moderate/High/Privacy baseline profiles from `usnistgov/oscal-content` (parsed locally); FedRAMP 2026 Full Rev5 Control Reference family pages (parsed per control); OSCAL v1.2.3 release metadata from the GitHub API and the 1.2.3 SSP JSON schema; NIST AI 100-1 PDF and NIST's AI RMF page; NIST CSRC project page `csrc.nist.gov/projects/cosis` (the old `cosais` URL now serves the same page); Federal Register API and full text for EO 14434 and EO 14409; FedRAMP's AI page; CISA's agentic AI guidance page. The OSCAL JSON fragment was validated against the `system-user` and `system-component` definitions of the 1.2.3 SSP schema with `jsonschema` (Unicode patterns routed through `regex`): 0 errors each.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21: AI systems continue to follow A-130 ATO requirements (fn 29) | No AI-specific ATO | verified | M-25-21 fn 29 |
| 2 | AI use-case risk acceptance "is separate from, and does not supersede" system authorization (fn 22) | No AI-specific ATO | verified | M-25-21 fn 22 |
| 3 | Update authorization and conmon processes "to better address the needs of AI applications" (fn 11); 270-day policy update naming "continuous authorizations for AI" | No AI-specific ATO | verified | M-25-21 fn 11, §3(b)(iii) |
| 4 | M-25-22 §4(e)(i): AI operated as an information system must receive an ATO before deployment | No AI-specific ATO | verified (quoted) | M-25-22 |
| 5 | AO risk acceptance cannot be delegated | No AI-specific ATO | verified (quoted) | SP 800-37 Rev. 2, Task R-4 discussion |
| 6 | `have_ato` wording ("itself has … or is part of another system that has an ATO") | No AI-specific ATO | verified | Data dictionary col 19 |
| 7 | FedRAMP AI Prioritization Initiative: Aug 2025–Apr 2026, closed to new entrants, five criteria incl. SSO, SCIM, RBAC, 20x within two months | No AI-specific ATO | verified | fedramp.gov/ai |
| 8 | Prioritization didn't create a lighter agency path | No AI-specific ATO | restated-as-design (page silent; agency authorization of use is Book 13/14's settled fact, linked) | fedramp.gov/ai; Book 13 Ch11 |
| 9 | Placement table (inside a system / own system / certified service) | Where the AI sits | restated-as-design | — |
| 10 | Task P-18 registration; Task M-7 disposal strategy | Where the AI sits | verified (quoted) | SP 800-37 Rev. 2 |
| 11 | Five evidence areas and their artifacts | Evidence table | restated-as-design | — |
| 12 | AC-2, CM-8, CM-8(4), IA-9 statement quotations | Evidence notes | verified | SP 800-53 5.2.0 OSCAL catalog |
| 13 | IA-9 in no NIST baseline; FedRAMP 2026 lists no class | Evidence notes | verified | OSCAL baseline profiles; FedRAMP IA family page |
| 14 | PM-5 in no NIST (L/M/H) baseline | Evidence notes | verified | OSCAL profiles |
| 15 | CM-8(4) NIST High only; FedRAMP Class D only | Overlays section | verified | OSCAL profiles; FedRAMP CM page |
| 16 | PT-2/AR-2 correction (already made in Ch07) | Evidence notes | verified | OSCAL catalog (PT-2 title; no AR family) |
| 17 | Seven practices and their content; 365 days; "be prepared to report them to OMB"; discontinue non-compliant | High-impact practices | verified | M-25-21 §4(a)(i), §4(b) |
| 18 | Nine `hi_*` fields; status not evidence | High-impact practices | verified (consistent with Ch03, W2) | Data dictionary cols 28–36 |
| 19 | Practice-to-evidence table and identity contribution | High-impact practices | restated-as-design | — |
| 20 | Waivers: written, system-specific; annual certification; report within 30 days; public summaries by April 3, 2026 | High-impact practices | verified | M-25-21 §4(a)(ii)–(iv); guidance §2 |
| 21 | Pilot exemption conditions | High-impact practices | verified | M-25-21 §4(a)(i) |
| 22 | Inventory at least annually; 2025 deadlines | Cadence | verified | M-25-21 §3(b)(v); guidance §1 |
| 23 | Compliance plans 180 days, every two years until 2036 | Cadence | verified | M-25-21 §3(b)(ii) and table of actions |
| 24 | 180-day mark end of September 2025; next plans 2027 | Cadence | verified (arithmetic from April 3, 2025) | — |
| 25 | FISMA no less than annually | Cadence | verified | 44 U.S.C. § 3554(b)(5) |
| 26 | A-130 ongoing authorization when eligible and approved; time- or event-driven reauthorization | Cadence | verified | A-130 App. I §4.d items 3–4 |
| 27 | Source: the compliance plan "is the one most often missed" | Cadence | removed (unverifiable) | — |
| 28 | Vintage-to-component-status mapping; new agentic AI as event-driven review | Cadence | restated-as-design | — |
| 29 | AI RMF GOVERN 1.6, GOVERN 1.7, MANAGE 4.1 wording; RMF voluntary | Cadence | verified | NIST AI 100-1 Tables 1, 4 |
| 30 | OSCAL 1.2.3 published August 7, 2026 | OSCAL | verified | GitHub API releases (v1.2.3 2026-08-07) |
| 31 | SSP `system-implementation` has `users`, `components`, `inventory-items`; component required fields; `type` values incl. `software`, `service`; `status.state` values; user `role-ids`, `authorized-privileges` with `functions-performed` | OSCAL | verified | oscal_ssp_schema.json (1.2.3) |
| 32 | AI-identity-to-OSCAL mapping | OSCAL | restated-as-design | — |
| 33 | COSAiS concept paper August 14, 2025; annotated outline (predictive AI) January 8, 2026; feedback by February 13, 2026; five use cases | Overlays | verified | CSRC project page |
| 34 | No public draft overlay as of October 21, 2026 | Overlays | verified (project page lists none) | CSRC project page |
| 35 | Renamed COSIS on October 20, 2026, citing EO 14434 | Overlays | verified | CSRC project page |
| 36 | EO 14434 (Sept 29, 2026; 91 FR 63129): use "Super Intelligence"/"SI" in non-statutory documents to the maximum extent permitted by law; earlier documents unaltered; same statutory definition | Overlays | verified | Federal Register full text |
| 37 | CISA's agentic guidance page now says "agentic super intelligence (SI) systems"; published May 1, 2026 | Overlays | verified | cisa.gov page |
| 38 | Tailoring recommendation (IA-9, AC-2/IA-5 parameters, CM-8(4) at Moderate, AU-6) | Overlays | restated-as-design | — |
| 39 | Source: OSCAL evidence mapping "CA-8 (penetration testing prep)", "AR-2", "PT-2 (PIA)", "SI-7" | — | corrected (in Ch07; referenced here) | OSCAL catalog |
| 40 | Source: ODR-compatible evidence payload via `ScanResult.to_json` | — | removed (internal implementation, not in repo) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| governed-path.md — intro (drift engine, reciprocity model, continuous loop) | Ch07 (drift); Ch10 cadence | Product framing dropped |
| governed-path.md — Prerequisites (substrate, adapter slots, SailPoint) | — | Product/vendor activation steps; not carried |
| governed-path.md — "What the governed path adds" table | Ch09 (report, remediation, vintage comparison); Ch07 (shadow AI) | Registry-specific rows generalized |
| governed-path.md — Activation, Options A and B (CLI, Python) | — | Code not in repository; product commands; not carried |
| governed-path.md — Drift engine integration | Ch07 (W4) | — |
| governed-path.md — ATO reciprocity cross-walk | Ch10 "No AI-specific ATO" and placement table; Ch03 (W2) on `have_ato` | Reciprocity-registry matching restated as ISSO reconciliation; single-ATO claim for a specific HR platform not carried (unverified, agency-specific) |
| governed-path.md — Annual inventory refresh cycle | Ch10 cadence; Ch09 annual refresh | 13-month staleness kept as design (Ch07/Ch09) |
| governed-path.md — OSCAL evidence output and control table | Ch10 OSCAL section; Ch07 mapping | Control errors corrected (PT-2, AR-2, CA-8, SI-7) |
| governed-path.md — "Offering this to OMB" callout | — | Advocacy and internal draft path; not carried |
| governed-path.md — Normative references | — | Internal IDs; not carried |
| whitepaper — "What M-25-21 actually requires" (practices, inventory, compliance plans, CAIO; no AI-specific ATO) | Ch10 sections 1, 5, 6 (Ch02 owns the full treatment) | — |
| whitepaper — "inventory's `hi_*` fields can't evidence all seven" | Ch10 high-impact section, in corrected form | Stale: 2025 dictionary has fields for all seven; the point survives as status-not-evidence |
| whitepaper — companion memoranda (M-25-22, M-26-04) | Ch10 (M-25-22 §4(e)(i)); Appendix A | — |
| whitepaper — coverage ledger, strengths, gaps, three moves, bottom line | — | Competitive and solicitation framing; dropped per brief |
