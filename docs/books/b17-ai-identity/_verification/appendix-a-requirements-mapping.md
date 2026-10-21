# Verification log — Appendix A, Requirements Mapping: AI Rules to Identity Controls

Writer W5, October 21, 2026. Method: as for Chapter 10. NIST baselines were computed by parsing the `include-controls` lists of the release 5.2.0 OSCAL Low, Moderate, High and Privacy baseline profiles; FedRAMP 2026 classes by parsing the "FedRAMP Rev5 Baselines" line of each control on the FedRAMP Full Rev5 Control Reference family pages (AC, AT, AU, CA, CM, IA, PL, PM, PS, PT, RA, SA, SC, SI, SR), with IA-02, IA-08, IA-09, RA-08, PM-05, PM-05(01), CA-05, SR-06, AU-06 and AC-02(12) re-checked by hand. Control statements were summarized from the 5.2.0 OSCAL catalog. M-25-21 section numbers were checked against the PDF's structure (3(a) Agency Governance Roles and Bodies; 3(b) Agency Governance Responsibilities; 4(a) Determining High-Impact AI; 4(b) minimum practices; 6 presumed high-impact purposes). M-25-22 section numbers likewise (2 Scope; 3 Agency-Level Requirements; 4 AI Acquisition Lifecycle Guidance, with 4(d) Selection and Award and 4(e) Contract Administration).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21 rescinds and replaces M-24-10; applies to executive agencies incl. independent regulatory agencies | M-25-21 intro | verified | M-25-21 Overview, Scope |
| 2 | IC not required to implement high-impact practices; DoD and IC excepted from inventory | M-25-21 intro | verified | M-25-21 fn 25; §3(b)(v); table of actions |
| 3 | No later OMB memo through M-26-19 replaces M-25-21 | M-25-21 intro | verified (index read; M-26-10 and M-26-14 checked for AI content) | OMB memoranda index |
| 4 | CAIO within 60 days; item E maintain inventory; item F centrally track high-impact | M-25-21 table | verified | §3(a)(i) |
| 5 | CFO Act AI governance board within 90 days | M-25-21 table | verified | §3(a)(ii); table of actions |
| 6 | Lowest-appropriate-level risk acceptance; separate from system authorization | M-25-21 table | verified | §3(b)(i), fn 21, 22 |
| 7 | Compliance plans; 270-day policy update; GenAI policy "should"; inventory | M-25-21 table | verified | §3(b)(ii)–(v), fn 11 |
| 8 | High-impact determination and presumed categories | M-25-21 table | verified | §4(a), §6 |
| 9 | 365 days; discontinue non-compliant; pilot conditions; waivers | M-25-21 table | verified | §4(a)(i)–(iv) |
| 10 | Seven practices, content | Practices table | verified | §4(b)(i)–(vii) |
| 11 | Nine `hi_*` fields report status | Practices note | verified | Data dictionary cols 28–36 |
| 12 | M-25-22 applicability to future contracts; NSS exclusion | M-25-22 intro | verified | M-25-22 §2(c)–(d) |
| 13 | ATO before deployment | M-25-22 table | verified | §4(e)(i) |
| 14 | Contract term E (monitoring), term G (new-feature notice, "should consider") | M-25-22 table | verified | §4(d) |
| 15 | Operate-and-monitor components remain available; data handling | M-25-22 table | verified | §3(e)(ii)–(iii) |
| 16 | AI RMF 1.0 January 26, 2023; four functions; GOVERN cross-cutting | AI RMF | verified | NIST AI RMF page; AI 100-1 Fig. 5 |
| 17 | AI RMF being revised under the AI Action Plan; no revised version published | AI RMF | verified (NIST page) | nist.gov AI RMF page |
| 18 | AI 600-1 July 26, 2024; twelve risks incl. information security and value chain | AI RMF | verified | AI 600-1 §2; NIST page |
| 19 | Subcategory summaries (GOVERN 1.6, 1.7, 2.1, 3.2, 6.1; MAP 3.5, 4.2; MEASURE 2.7; MANAGE 2.4, 3.1, 4.1) | AI RMF table | verified | AI 100-1 Tables 1–4 |
| 20 | Every NIST baseline value in the control tables | Control tables | verified (computed) | OSCAL profiles 5.2.0 |
| 21 | Every FedRAMP class value in the control tables | Control tables | verified (parsed per control) | FedRAMP 2026 control reference |
| 22 | AC-2(12) NIST H vs FedRAMP C D; CM-8(4) NIST H vs FedRAMP D | How to read | verified | As above |
| 23 | Control statement summaries | Control tables | verified | 5.2.0 OSCAL catalog |
| 24 | "Identity control" column | All tables | restated-as-design | — |
| 25 | A-130, FISMA, SP 800-37 tasks | Other sources | verified | As in Ch10 log |
| 26 | 2025 inventory counts; no 2026 repository | Other sources | verified | README; GitHub org listing (last push May 14, 2026) |
| 27 | M-26-04 scope (LLMs procured), December 11, 2025 | Other sources | verified | M-26-04 PDF |
| 28 | EO 14434 content | Other sources | verified | Federal Register |
| 29 | COSAiS/COSIS status | Other sources | verified | CSRC project page |
| 30 | BOD 23-01, CDM | Other sources | verified | As in Ch09 log |
| 31 | CISA *Careful Adoption of Agentic AI Services*, May 1, 2026, joint with partners | Other sources | verified | cisa.gov page; CISA GovDelivery bulletin |
| 32 | FedRAMP AI prioritization | Other sources | verified | fedramp.gov/ai |
| 33 | Corrections table rows | Corrections | verified | Sources cited per row |
| 34 | FedRAMP 2026 KSIs | — | not carried | KSIs bind providers; the appendix maps agency controls (consistent with Book 10 Ch03, Book 13 App A) |
| 35 | EO 14409 (June 2, 2026), "Promoting Advanced Artificial Intelligence Innovation and Security" | — | not carried | Read in full; tasks CNSS, DoW, CISA BODs and frontier-model benchmarking; no agency AI identity or inventory duty |

## Carry-forward ledger

The appendix has no assigned source page of its own; it draws on the brief's "new research" row for federal AI rules and NIST AI RMF.

| Source page § | Went to | Or why not carried |
|---|---|---|
| governed-path.md — OSCAL evidence control table | Appendix A corrections table; control tables | Errors corrected (PT-2, AR-2, CA-8, SI-7) |
| central-deployment.md — CDM analogy; BOD 23-01 | Appendix A "Other federal sources"; corrections table | CDM description corrected |
| whitepaper — M-25-21 requirements; companion memoranda | Appendix A M-25-21 and M-25-22 tables | Competitive framing dropped |
| (new research) federal AI rules, NIST AI RMF, SP 800-53 baselines, FedRAMP classes, COSIS, EO 14434 | Appendix A tables | — |
