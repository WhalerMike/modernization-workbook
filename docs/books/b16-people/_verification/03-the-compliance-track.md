# Verification — Chapter 03, The Compliance Track

Writer W2. Source: `docs/compliance/Vol_V_Book_01_Compliance_Track.md` (all sections). Primary sources opened October 22, 2026: NIST RMF "About the RMF" and "RMF Online Introductory Courses" pages; SP 800-37 Rev. 2 publication page and PDF (text extracted locally; §2 seven steps, Tables 6 and 8, Tasks A-1 to A-6, R-1 to R-5, M-1 to M-7, and the A-6 discussion sentence on accepted deficiencies); SP 800-53A Rev. 5 and SP 800-137 publication pages; NIST OSCAL "Learn" and "Layers and Models" pages; FedRAMP NTC-0004, NTC-0014, "Key Security Indicators" ruleset reference, "Agency Use" and "Collaborative Continuous Monitoring" rule pages; CISA BOD 26-04; NICCS NICE Framework work role listing (Components v2.2.0); ISC2 CGRC page; ISACA CISA page. Settled facts read in Book 14 Chapters 01, 02, 03, 09, 10 and 11 and linked, not re-derived.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Track audience: ISSOs, ISSMs, compliance staff, assessors, AOs | Opening; Who the track is for | restated-as-design | Source "Audience"; roles per Book 14 Ch10 |
| 2 | NICE Framework Components v2.2.0; OG work roles Security Control Assessment, Systems Authorization, Systems Security Management, Privacy Compliance, Cybersecurity Policy and Planning, Technology Program Auditing | Who the track is for | verified | NICCS NICE Framework listing |
| 3 | Mapping ISSO→Systems Security Management, assessor→Security Control Assessment, AO staff→Systems Authorization | Who the track is for | restated-as-design | — |
| 4 | Module parts (Read/Controls/Practice/Checkpoint/Outcome) | How each module is built | restated-as-design | Source "How to Read This Track" (Read/Controls/Evaluate/Checkpoint; Evaluate dropped, see #24) |
| 5 | Closure claims are self-assessment pending independent assessment and AO acceptance | Callout | restated-as-design | Source advisory note |
| 6 | RMF seven steps: Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor | Module 0 | verified | NIST About the RMF |
| 7 | SP 800-37 Rev. 2: preparatory step plus six main steps, all seven essential | Module 0 | verified | SP 800-37 Rev. 2 §2 text |
| 8 | AGU-USE-ABU "Agencies MUST complete the Authorization to Operate process..."; AGU-AGC-GRC machine-readable tools | Module 0 | verified | FedRAMP Agency Use |
| 9 | NTC-0004: Class C includes current Moderate; B Low and LI-SaaS; D High; A pilot | Module 0 | verified | NTC-0004 (Feb 25, 2026) |
| 10 | NIST Moderate vs FedRAMP Class C diverge | Module 0 | verified (settled; linked) | Book 14 Ch03 |
| 11 | 46 KSIs in ten themes; Cybersecurity Education to Service Configuration | Module 0; corrections | verified | FedRAMP KSI page |
| 12 | KSIs bind providers; agency obligations through its ATO and CA-7 | Module 0; corrections | verified (settled; linked) | Book 13 Ch11, Book 14 Ch03 |
| 13 | Source A0: "Class A pipeline opens Aug 3 2026; CR26 mandatory Jan 1 2027; no new Rev5 after June 11 2027" | Module 0 | carried by link only (Book 14 Ch02 verified these) | Book 14 Ch02 |
| 14 | Source: BOD 26-04 "VDR/VER deadline December 7, 2026" | Corrections | corrected: Dec 7 is BOD 26-04 Phase III (180 days from June 10) and, separately, FedRAMP's VDR/VER provider rules mandatory date | BOD 26-04; NTC-0014 |
| 15 | Source: BOD 26-04 tied to SBOM | Corrections | corrected: directive doesn't mention SBOMs | BOD 26-04 |
| 16 | Eight evidence areas | Modules 1–8 | restated-as-design (labelled as the program's design, not a federal structure) | Source slot model |
| 17 | Anchor controls per area (IA-2, IA-5, AC-2, AC-6; CM-8; SC-7, SC-8, AC-4; CA-7, SI-4, AU-6, RA-5; CM-8, IA-3, SI-2; CM-2, CM-3, SR, PM; CP-2/3/4; AT-2/3/4, IR-2, CP-3) | Table | restated-as-design (anchors chosen by the program; baseline membership deferred to Book 14 App A); control IDs exist in SP 800-53 Rev. 5 | Source modules; Book 14 App A |
| 18 | IA-2 needs event evidence (sign-in/risk logs), not policy export | Module 1 | restated-as-design (argument from IA-2's subject; source Closure Necessity box) | Source A1 |
| 19 | Naming/addressing plane as CM-8 anchor and join key | Module 2 | restated-as-design; linked Book 12 Ch02 | Source A2 |
| 20 | Circuit closes no control; customer-owned edge is agency part of SC-7 | Module 3 | restated-as-design; linked Book 09 Ch02 | Source A3 |
| 21 | Remediation timelines per BOD 26-04 | Module 4 | linked (settled, Book 14 Ch02) | Book 14 Ch02 |
| 22 | PM controls sit outside every system baseline | Module 6 | verified (settled; linked) | Book 14 Ch05 / Ch03 |
| 23 | Zero-finding tabletop not evidence of resilience | Module 7 | restated-as-design | Source A7 |
| 24 | KSI category per slot (KSI-IAM, KSI-PIY, KSI-CNA, KSI-MLA, KSI-CMT, KSI-RPL, KSI-CED) | Source A1–A8 | removed: indicators bind providers and several assignments don't match FedRAMP's own control mappings (Book 14 Ch03) | Book 14 Ch03 |
| 25 | "KSI-022", "KSI-001..010 ScuBA-attestable", "29 internal KSI rules", "KSI-011–014 activated" | Source throughout | removed (internal rule set and IDs; KSI-022 doesn't exist — training indicator is KSI-CED-RAT) | FedRAMP KSI page |
| 26 | ≥95% completion threshold | Module 8; corrections | restated-as-design (program's suggested threshold, per Book 14 Ch09) | Book 14 Ch09 |
| 27 | Aggregate completion doesn't evidence AT-4 alone; per-person record | Module 8 | restated-as-design; consistent with Book 14 Ch09 | Book 14 Ch09 |
| 28 | Task R-1 assemble package; R-4 authorization decision | Module 9 | verified | SP 800-37 Rev. 2 Table 8 / task text |
| 29 | Task A-6 prepare POA&M from findings and recommendations | Module 9 | verified | SP 800-37 Rev. 2 |
| 30 | "entries are not necessary when deficiencies are accepted by the authorizing official as residual risk" | Module 9 | verified (quote) | SP 800-37 Rev. 2, A-6 discussion |
| 31 | Governed exception with expiry | Module 9 | restated-as-design (Book 14 Ch11) | Book 14 Ch11 |
| 32 | Source capstone/B8: zero-item POA&M as target | Module 9; corrections | corrected (Book 14 Ch11 position) | Book 14 Ch11 |
| 33 | SP 800-53A Rev. 5, Jan 2022; release 5.2.0 | Module 9 | verified | CSRC SP 800-53A page |
| 34 | SP 800-137 ISCM guide, Sept 2011 | Module 9 | verified | CSRC SP 800-137 page |
| 35 | Monitor tasks M-1 to M-7 names | Module 9 | verified | SP 800-37 Rev. 2 Table (Monitor) |
| 36 | OCR every 3 months; agencies MUST review (CCM-AGM-ROR); AGU says SHOULD | Module 9 | verified | FedRAMP CCM and AGU pages |
| 37 | OSCAL assessment layer = assessment plan, assessment results, POA&M; control layer catalog/profile; implementation SSP/component definition | Module 9 | verified | OSCAL Layers and Models |
| 38 | Capstone: eight-area continuous-monitoring narrative | Capstone | restated-as-design | Source capstone |
| 39 | Source pass mark (every slot level 2+, three at level 3) | Capstone | not carried; deferred to Chapter 05's rubric (W3) to avoid contradiction | — |
| 40 | Track as gate readiness | Order and pairing | restated-as-design; consistent with brief (training part of each gate) | Book 01 Ch12 |
| 41 | NIST four free self-guided RMF courses, no registration (800-37, 800-53, 800-53A, 800-53B) | Outside learning | verified | NIST RMF courses page |
| 42 | OSCAL tutorials (catalog, profile, component definition, proof of compliance) | Outside learning | verified | OSCAL Learn |
| 43 | ISC2 CGRC: seven domains (scope through compliance maintenance), two years' experience | Outside learning | verified (page doesn't name RMF or former CAP name, so neither claimed) | ISC2 CGRC |
| 44 | ISACA CISA: auditing, monitoring and assessing IT and business systems | Outside learning | verified (experience years not stated on page, so not claimed) | ISACA CISA |
| 45 | FedRAMP training courses (e.g., ISSO course) | Outside learning | removed: fedramp.gov/rev5/training returned 404; couldn't confirm current offerings | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, draft-proposal callout, Date Code, author | — | Not carried: classification/draft stamps and agency shortcode are banned |
| What This Document Addresses — purpose, "conformance tooling measures drift, can't author one" | Opening prose ("tracing" skill); Module 0 point 4 | Internal counts (29 rules, 10 ScuBA-attestable, 19 workforce-bound) dropped |
| What This Document Addresses — Audience | Who the track is for (table, expanded to AOs and system owners) | 3PAO folded into "control assessor" |
| Closure claims advisory note | Callout "Closure claims in training are practice" | — |
| How to Read This Track — Read/Controls/Evaluate/Checkpoint | How each module is built | "Evaluate" (KSI category) dropped, see claim 24; prerequisites and outcomes added |
| How to Read — CLI block (`<engine> ksi evaluate`, `oscal ksi-ar`, `oscal generate`) | — | Not carried: engine-specific commands and internal catalog name; replaced by "generated assessment-results export" in the capstone |
| Closure Necessity — track not checklist | Opening prose; "The discipline" paragraphs | Capitalized doctrine name dropped |
| Module A0 — Orientation | Module 0 (expanded: RMF, who owes proof, two facts, indicators, clock) | Volume coordinates replaced by workbook book links; "truth planes / enforcement planes" model dropped as internal vocabulary |
| Module A1 — Identity | Module 1 | Volume coordinates → Books 02/03/04/06/07; KSI-IAM dropped |
| Module A2 — Addressing | Module 2 | "sixteen controls" count dropped; KSI-PIY dropped; "pending adapter mapping refresh" internal status dropped |
| Module A3 — Network | Module 3 | "DIA fixes nothing / Theme B / Theme F" doctrine names dropped; argument kept |
| Module A4 — Telemetry | Module 4 | Product names (Defender VM, Sentinel) generalized; evidence-fabric content linked to Book 12 Ch02 |
| Module A5 — Endpoint | Module 5 | PT-family entry moved to the privacy pointer in the roles table (Book 14 Ch08) |
| Module A6 — Security config & change | Module 6 | KSI-011–014 and SBOM/VDR/VER "activation" story removed (internal + wrong instrument); supply chain points to Book 14 Ch07 |
| Module A7 — Continuity | Module 7 | — |
| Module A8 — Training | Module 8 | KSI-022/KSI-CED-RAT as agency requirement corrected; LMS JSON export detail left to Book 14 Ch09 and Ch10 of this book |
| The Capstone — Eight-Slot Walk | The capstone | Pass levels deferred to Chapter 05 |
| The Eight Evidence Slots table | Modules 1–8 table (re-based on books and taught-in chapters) | "Tool-attestable alone?" column dropped (rests on internal rule numbering) |
| Series Context — Vol V Book 01 | Opening prose; Order and pairing; links to Ch04, Ch05, Ch06 | Volume numbering dropped |
| Closing italic colophon | Callout and corrections section | Internal KSI decomposition statement dropped |
| (new) Module 9 — package, POA&M, ConMon | Module 9 | Added: source spread this across A0 checkpoint and capstone; brief asks for POA&M and continuous monitoring explicitly |
| (new) Outside learning; What changed | Two sections | Added per brief (external courses as examples; corrections) |
