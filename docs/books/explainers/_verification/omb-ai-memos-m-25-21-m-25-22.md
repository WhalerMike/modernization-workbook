# Verification — Governing and Buying AI Under M-25-21 and M-25-22 (research)

File: `docs/books/explainers/omb-ai-memos-m-25-21-m-25-22.md`
Verified: 2026-10-30

Method:
- Primary sources read 2026-10-30:
  - the M-25-21 and M-25-22 PDFs on whitehouse.gov, text extracted with pypdf;
  - OMB's memoranda list;
  - GSA's "Procuring SI solutions" and "SI guidance and resources" pages;
  - NIST's OSCAL Rev. 5 catalog and Moderate baseline profile, parsed for control titles and baseline membership.
- The M-25-22 PDF is a scanned document with an OCR text layer. Section 3's lettering (which starts at "b") and Appendix I were checked against rendered page images (pages 4 and 13).
- Dates in "Every date, counted" are day counts from April 3, 2025, computed here. The 365-day date (April 3, 2026) matches Book 17's verified log, which takes it from OMB's 2025 reporting guidance.
- Absence claims (no OMB template found; no GSA guide listed) rest on the pages as read 2026-10-30 and on web searches the same day.
- No personal data was sent to any site.

Verdicts: **verified** (the source says it); **computed** (arithmetic on a verified day count); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **absence** (not found on the named pages).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21 rescinds and replaces M-24-10; M-25-22 rescinds and replaces M-24-18; both dated April 3, 2025 | Intro | verified | omb-m2521 (Overview); omb-m2522 (§1) |
| 2 | OMB's list runs to M-27-01 (Oct 23, 2026); no memo amends or rescinds M-25-21 or M-25-22; M-26-04 is the only later AI memo | Answer in brief; table | verified (titles); absence (no amending title) | omb-memos |
| 3 | AI in Government Act §104(c)–(d) is the basis for compliance plans | Where the memos sit | verified | omb-m2521 §3(b)(ii) |
| 4 | Advancing American AI Act §7224(d) directs the acquisition guidance; §7225 requires the inventory | Where the memos sit | verified | omb-m2522 §2 and fn 2; omb-m2521 fn 20 |
| 5 | M-25-22's cross-functional team must identify risks to the nine EO 13960 principles; the CAIO Council advances the EO 13960 principles | Where the memos sit; lifecycle | verified | omb-m2522 §4(a)(i); omb-m2521 §3(c)(i) |
| 6 | Both memos cite EO 14179 for buy-American AI | Where the memos sit | verified | omb-m2522 §3(c); omb-m2521 §2(c) |
| 7 | Neither memo covers AI in national security systems; M-25-22 excludes the IC; the M-25-21 §4(a)–(b) practices don't bind the IC | Where the memos sit | verified | omb-m2522 §2(a), (d); omb-m2521 §1(c), §4 |
| 8 | Deadlines: CAIO 60 days; board 90; CAIO Council 90; strategy 180; compliance plan 180 then every two years until 2036; policies and generative AI policy 270; practices 365; Council sunsets after five years | Every date | verified (day counts); computed (dates) | omb-m2521 §§2(a), 3(a)–(c), 4(a)(i) |
| 9 | M-25-22: applies to solicitations on or after 180 days and to options exercised after 180 days; procedures updated in 270 days; Appendix I lists GSA guide plan (100 days), full compliance (180, §2(c)), IP standardization (200), GSA repository (200) | Every date | verified; computed (dates) | omb-m2522 §2(c), §3(b), Appendix I (page image) |
| 10 | A compliance plan is also due within 180 days of any update to M-25-21 | Every date | verified | omb-m2521 §3(b)(ii) |
| 11 | CAIO grade (SES/ST/SL at CFO Act agencies; GS-14+ elsewhere); may be an existing CIO, CDO or CTO with significant AI expertise; engages with the Deputy Secretary; notify OMB within 30 days of a change | CAIO | verified | omb-m2521 §3(a)(i) |
| 12 | CAIO responsibilities A–J as summarized | CAIO | verified | omb-m2521 §3(a)(i)(A)–(J) |
| 13 | Waiver authority not delegable; pilots need CAIO certification (delegability not stated) | CAIO | verified | omb-m2521 §4(a)(i)–(ii) |
| 14 | Board: Deputy Secretary chair, CAIO vice-chair; required and "when relevant" representation; external experts; existing bodies allowed | Board | verified | omb-m2521 §3(a)(ii) |
| 15 | Strategy contents (i) and (ii)(A)–(G); use-case element excludes DoD and the IC; FOIA-protected information can be left out; the authorization and continuous-monitoring footnote | Strategy | verified | omb-m2521 §2(a), fns 9 and 11 |
| 16 | That footnote points at existing CA-6 and CA-7 work | Strategy | inference | — |
| 17 | Compliance plan: plan or "no covered AI" determination, posted publicly; covers updates to internal principles; OMB templates promised | Compliance plan | verified | omb-m2521 §3(b)(ii), fn 23 |
| 18 | Recheck a 2025 "no covered AI" determination before 2027 | Compliance plan | inference (labelled program reading) | — |
| 19 | Policy areas to update and the "less data, less compute, more explainable" sentence | Policies | verified | omb-m2521 §3(b)(iii)–(iv) |
| 20 | Sharing code, models and weights; open-source release where practicable; four exceptions A–D; data assets; model disclosure risk | Sharing | verified | omb-m2521 §2(b)(i)–(iii) |
| 21 | High-impact process: written notice to the CAIO for presumed-category non-determinations; CAIO may reverse; human oversight doesn't remove high-impact status; streamline similar approvals; public summaries | High-impact | verified | omb-m2521 §3(a)(i)(F), §4(a), §4(a)(iv) |
| 22 | Covered AI per the Advancing American AI Act; common-commercial-product exclusion and the two-part test; word-processor examples; incidental contractor use and research exclusions | What it covers | verified | omb-m2522 §2(b) |
| 23 | Section 3 lettering starts at (b); internal cross-references don't always match the body | Agency-level | verified (page image p. 4; Appendix I p. 13) | omb-m2522 |
| 24 | Agency-level requirements 3(b)–(e), (h), and the five-point IP and data process | Agency-level | verified | omb-m2522 §3(b)–(e), (h) |
| 25 | Lifecycle must/should split for 4(a)–(f), including demos on agency networks, performance-based techniques, OMB "play books," high-impact disclosure in solicitations, testing proposals, ATO before deployment, sunset criteria, closeout | Lifecycle | verified | omb-m2522 §4(a)–(f), fn 14 |
| 26 | Contract terms A–G, including "quarterly or biannual" monitoring, vendor-inaccessible evaluation data, no prohibition on internal disclosure of vendor testing | Contract terms | verified | omb-m2522 §4(d) Contract Terms |
| 27 | Lock-in evaluation criteria in the footnote | Contract terms | verified | omb-m2522 fn 25 |
| 28 | SA-4, SA-9, SA-11, SR-5, SR-6, RA-3, CA-6 and CA-7: titles as given, all in the Moderate baseline | Moderate baseline | verified | omb-80053 |
| 29 | The mapping of M-25-22 requirements to those controls | Moderate baseline | design (labelled) | — |
| 30 | No workbook page cites M-24-10 or M-24-18 as current | What this changed | verified (repository grep 2026-10-30) | — |
| 31 | GSA's public AI pages (updated Oct 16 and Oct 21, 2026) cite M-25-22 but list no acquisition guide under it; the repository is executive-branch-only | Honest limits | absence; verified (repository scope) | omb-gsa-proc, omb-gsa-res; omb-m2522 §3(g) |
| 32 | OMB's strategy and compliance-plan templates not found on OMB's public pages | Honest limits | absence | web search 2026-10-30 |
