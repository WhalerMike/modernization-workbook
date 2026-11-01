# Verification — Chapter 06, Compliance by Design

## Sources opened

All opened October 28, 2026: OMB Circular A-130 (2016 revision) PDF, text extracted locally and read at §5.a(1)–(2), §5.d(5), §5.f(1), §5.h, Appendix I §1 and §4.b, and Appendix II §4; CSRC SP 800-53 Rev. 5 publication page (release 5.2.0 note); NIST SP 800-53 Rev. 5 OSCAL catalog JSON from the usnistgov/oscal-content repository (metadata version 5.2.0), read for family and control titles; OMB M-26-05 PDF; CSRC SSDF publications page and SP 800-218 Rev. 1 initial public draft page; SP 800-218 Version 1.1 PDF, read at Section 2 and Table 1; OMB M-25-05 PDF, read at Sections 1 and 2. Framework status (M-26-05, Federal Data Strategy, FEAF v2) follows `docs/reference/federal-framework-crosswalk.md`, checked October 23, 2026, and was re-confirmed for M-26-05 on the memo itself. An attempt to open 44 U.S.C. §3520 on govinfo.gov and uscode.house.gov returned "not found" errors; the chief data officer claim is cited to M-25-05 instead. Authorization facts are Book 14's settled facts and are linked, not restated.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A-130 §5.a(1)(c)(i): consider security, privacy, records, transparency and supply chain "throughout the system development life cycle" | Opening | verified (quote) | A-130 |
| 2 | A-130 App. I §1: integrate security and privacy into EA, SDLC, systems engineering and acquisition | Opening | verified (quote); section corrected from §2 to §1 during drafting | A-130 App. I |
| 3 | A-130 §5.a(1)(c)(ii) and fn 8: plan for systems that "cannot be appropriately protected or secured," high priority for upgrade, replacement or retirement; includes unsupported components | Legacy | verified (quote) | A-130 |
| 4 | A-130 App. I §4.b(3): plan and budget to upgrade, replace or retire | Legacy | verified | A-130 App. I |
| 5 | SA-22 Unsupported System Components | Legacy; table | verified | 800-53 5.2.0 catalog |
| 6 | Retained apps with unsupported components carry compensating controls, risk acceptance and review date | Legacy | restated-as-design | — |
| 7 | SP 800-53 Rev. 5 release 5.2.0, Aug 27, 2025; added SA-15(13), SA-24, SI-2(7); revised SI-7(12) | Controls | verified | CSRC page; titles from catalog (Logging Syntax; Design for Cyber Resiliency; Root Cause Analysis) |
| 8 | Family names and control titles in the control table | Control table | verified | 800-53 5.2.0 catalog |
| 9 | Evidence and placement columns | Control table | restated-as-design | — |
| 10 | Migration validation as SI-7 evidence; cut-over as CM-3/CM-4 | Controls | restated-as-design | — |
| 11 | M-26-05, Jan 23, 2026, rescinds M-22-18 and M-23-16 | SSDF | verified | M-26-05 |
| 12 | Draft wording "M-22-18 had required software producers to attest" | SSDF | corrected to the memo's own framing (the attestation form was developed under M-22-18) | M-26-05 |
| 13 | Agencies "shall continue to maintain a complete inventory of software and hardware"; may use the attestation form; may require SBOM on request; cloud: SBOM of runtime production environment; references SP 800-218 | SSDF | verified (quote) | M-26-05 and fn 1 |
| 14 | SP 800-218 v1.1 final Feb 3, 2022; Rev. 1 (v1.2) IPD Dec 17, 2025; comments closed Jan 30, 2026; no final as of October 2026 | SSDF | verified (publications page last updated Oct 6, 2026) | CSRC |
| 15 | Four SSDF practice groups PO, PS, PW, RV | SSDF | verified | SP 800-218 §2 |
| 16 | PO.3.3, PS.3.2, PW.1.3, PW.7, PW.8, RV.1, RV.3 content | SSDF table | verified (paraphrased) | SP 800-218 Table 1 |
| 17 | Draft 1.2 adds new practice groups (seen in a search summary of a NIST slide deck) | — | not carried (source not opened) | — |
| 18 | Pipeline column of SSDF table | SSDF table | restated-as-design | — |
| 19 | SP 800-218A for model trainers | SSDF | verified | CSRC SSDF publications |
| 20 | A-130 privacy: Privacy Act and SORNs; PIAs "when developing, procuring, or using IT, in accordance with the E-Government Act"; minimization; PII system inventory | Privacy | verified (quote) | A-130 §5.f(1)(d)–(e), (g), (i); §5.a(1)(a)(ii) |
| 21 | App. II §4: SAOP review "should begin at the earliest planning" | Privacy | verified (quote) | A-130 App. II |
| 22 | Modernization events that reopen privacy work; synthetic or masked test data | Privacy | restated-as-design | — |
| 23 | Evidence Act Pub. L. 115-435 established CDOs | Data governance | verified via M-25-05 (fn 1 and its description of Title II governance) | M-25-05 |
| 24 | M-25-05, Jan 15, 2025: open by default, comprehensive data inventory, open data plan; CDOs with data governance body implement; rescinds M-13-13 | Data governance | verified | M-25-05 |
| 25 | M-25-05: agencies "must take appropriate steps ... when initiating new information collections or IT investments" | Data governance | verified (quote) | M-25-05 §2(b) |
| 26 | Federal Data Strategy being retired | Data governance | settled fact, linked to the framework-status research page | Crosswalk |
| 27 | A-130 §5.d(5)(d): records functions incorporated into design through decommissioning; §5.h(1) SAORM; §5.f(1)(h) PII records per NARA schedules | Records | verified (quote) | A-130 |
| 28 | Retire dispositions and history-dropping migrations go to the records officer | Records | restated-as-design | — |
| 29 | A-130 §5.a(2) EA quote: baseline, target, transition plan; plans for upgrades, replacements, disposition | EA | verified (quote) | A-130 |
| 30 | PM-7 Enterprise Architecture | EA | verified | 800-53 5.2.0 catalog |
| 31 | FEAF v2 historical | EA | settled fact, linked to framework-status page | Crosswalk |
| 32 | Ongoing authorization; AO alone accepts residual risk | Evidence | settled fact in Book 14; linked, not re-cited | Book 14 |
