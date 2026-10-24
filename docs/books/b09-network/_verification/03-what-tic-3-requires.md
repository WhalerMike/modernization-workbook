# Verification — Chapter 03, What TIC 3.0 and Federal Policy Actually Require

Writer W2. All sources opened October 21, 2026. PDFs were downloaded and read as text (pdftotext); NIST control text and baselines were checked in the OSCAL Rev. 5 JSON (catalog version 5.2.0, Low/Moderate/High profiles).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | TIC began 2007 as consolidation; M-08-05 operationalized it | From consolidation | verified | SCC v3.3 §1; M-19-26 rescission list (M-08-05 dated Nov 20, 2007) |
| 2 | MTIPS is a service under GSA EIS | From consolidation | verified | SCC v3.3 §1.1 key terms |
| 3 | M-19-26 (Sep 12, 2019) rescinded M-08-05, M-08-16, M-08-27, M-09-32 | From consolidation | verified | M-19-26 text |
| 4 | TIC 3.0 doesn't require routing through access points if CISA and agency keep situational awareness | From consolidation | verified | CISA SASE guidance v1.0 Preface and §3 |
| 5 | No instrument rescinding M-19-26 found | From consolidation | restated-as-design (negative search result) | Guidebook Sept 2026 still cites M-19-26 as the authority |
| 6 | "Descriptive, not prescriptive"; vendor and technology neutral; obligation to apply compensating controls | From consolidation | verified | Program Guidebook v1.2 guiding principles |
| 7 | TIC document versions (Guidebook 1.2, RA 1.2, SCC 3.3, UCH 1.2, Overlay 1.2, Traditional 1.0, Branch 3.0, Remote User 2.2, Cloud 1.2) | Document set | corrected | Cover pages and revision tables. Sources said versions "could not be verified" and called v1.0's "Branch Office Use Case, Version 3.0" unconfirmed and v1.2 Guidebook "misattributed": both are in fact correct (Branch Office v3.0; Guidebook v1.2, July 2025) |
| 8 | Set republished Sept 2026; only 2026 change was footnote links | Document set | verified | Revision-table note in each document |
| 9 | CISA landing page labels RA, UCH, Overlay as v1.1 while covers read 1.2 | Document set | verified (discrepancy recorded) | Core guidance page vs cover pages |
| 10 | Four use cases; no SASE use case | Document set | verified | Core guidance page |
| 11 | CISA SASE guidance exists: v1.0, June 2026, published June 24, 2026, example approach, vendor-agnostic | Document set | corrected | Sources said the text "could not be retrieved"; retrieved and read |
| 12 | SCC "goals to be achieved, not detailed guidance" | Catalog | verified | SCC §4 |
| 13 | 20 universal capabilities; 12 PEP groups (names) | Catalog | verified | SCC Table 3 identifiers counted; §4.2 group list |
| 14 | Policy enforcement parity at all access points | Catalog | verified | SCC §4 and 3.UNI.PEPAR |
| 15 | No telemetry duration/timeliness requirement; TIC 2.x 24-hour pcap; law/OMB/CISA telemetry still applies | Catalog | verified | SCC §4 |
| 16 | Branch Office: three security patterns, options, web pattern greatest rigor | Catalog | verified | Branch Office UC §3, §6 |
| 17 | Branch Office names SD-WAN only as conveyance example requiring parity on all paths | Catalog | verified | Branch Office UC §7 (Policy Enforcement Parity), §7.2.3 |
| 18 | "Agencies must preserve CISA visibility" | Catalog | verified | Branch Office UC §8 |
| 19 | Circuits in ~90 days vs authorized breakout architecture as critical path | Catalog | restated-as-design | Field office §4.5 (author's analysis); "a quarter" phrasing |
| 20 | M-22-09: "already required to have DNS requests routed through CISA-operated infrastructure" | Binding obligations | verified | M-22-09 "Encrypting DNS traffic" |
| 21 | Encrypted DNS guidance: Protective DNS for all egress; disable root hints; third-party resolvers only from authorized internal servers | Binding obligations | verified | CISA Encrypted DNS Implementation Guidance (May 16, 2024) |
| 22 | 6 U.S.C. § 663 note quote | Binding obligations | verified | Program Guidebook Appendix A |
| 23 | BOD 23-02 device classes, 14 days, preferred PEP option | Binding obligations | verified | BOD 23-02 page |
| 24 | BOD 26-02 date, definition, scope test, exclusions | Binding obligations | corrected | BOD 26-02 page. Source described scope as edge devices "on FCEB networks"; the definition requires boundary location and public-internet accessibility, and excludes OT and FedRAMP-authorized cloud services |
| 25 | BOD 26-02 milestones (3/12/18/24 months) and computed dates | Binding obligations | verified | BOD 26-02 Required Actions; dates computed from Feb 5, 2026 |
| 26 | M-26-15 date, network-infrastructure PQC quote, terminators close to endpoint, Dec 31, 2030, NSS excluded | Binding obligations | verified | M-26-15 text |
| 27 | M-26-15 plan due 120 days = Oct 22, 2026 | Binding obligations | corrected | Source said "approximately October 2026"; computed exact date |
| 28 | EO 14412, June 22, 2026 | Binding obligations | verified | White House presidential action page |
| 29 | SP 800-53 Rev. 5 release 5.2.0, Aug 27, 2025 | Control assertions | verified | CSRC page |
| 30 | Control statements SC-7, SC-7(4) (incl. exception items), SC-7(8), AC-4, AC-17, SI-4, CA-7, CP-8(2), CP-8(3) | Control assertions | verified | OSCAL catalog |
| 31 | Baseline membership in table | Control assertions | verified | OSCAL baseline profiles |
| 32 | CP-8(3) is High only (field-office A.2 claimed CP-8(2)/(3) closure) | Control assertions | corrected | OSCAL Moderate profile omits CP-8(3) |
| 33 | SC-8 closed "by the SD-WAN overlay's circuit-wide IPsec" (field-office A.2) | Control assertions | corrected | Reframed: IPsec overlay is one implementation of SC-8(1); see #36–39 |
| 34 | CISA SASE Appendix A mapping (Networking→SASE, NGFW; DNS→SASE, Protective DNS; Identity→IAM) | Control assertions | verified | SASE guidance Table 2 |
| 35 | ZTMM cross-cutting capabilities; "general guide," not "strict set of requirements" | Control assertions | verified | ZTMM v2.0 §3, §5.6 |
| 36 | SC-8 discussion quote (physical or logical means) | Encryption | verified | OSCAL catalog |
| 37 | SC-8(1) discussion "include TLS and IPSec" | Encryption | verified | OSCAL catalog |
| 38 | SC-13 is selection control; doesn't itself require FIPS validation | Encryption | corrected | Source said validation flows from FIPS 140 under FISMA and FedRAMP policy; restated to what SC-13 text says (discussion lists FIPS-validated cryptography as generally applicable) |
| 39 | SC-8(3) "message headers and routing information"; SC-8(3), SC-8(4) in no baseline | Encryption | verified | OSCAL catalog and profiles (SC-8(2)–(5) all unbaselined) |
| 40 | SC-8(1) assessment objects include alternative physical safeguards | Encryption | verified | OSCAL catalog (merged 800-53A objects) |
| 41 | FedRAMP crypto module policy allows unvalidated second layer | Encryption | removed | Not re-verified; argument stands on the three catalog lines |
| 42 | M-22-09 actions (encrypted DNS, HTTPS for web and API, isolation plan); "two critical and widely used protocols"; "All traffic must be encrypted…" | Encryption | verified | M-22-09 §III.C and introduction |
| 43 | Email encryption explicitly not mandated by M-22-09 | Encryption | removed | M-22-09 action 3 only tasks CISA/FedRAMP to evaluate; dropped as unnecessary |
| 44 | EO 14028 §3(d) quote | Encryption | verified | Federal Register text via govinfo |
| 45 | BOD 18-01 HTTPS/HSTS and STARTTLS, public-facing scope | Encryption | verified | BOD 18-01 page |
| 46 | SP 800-52 Rev. 2 TLS 1.3 by Jan 1, 2024 | Encryption | verified | CSRC abstract (planning note: under review since May 2026) |
| 47 | TLS 1.3 by Jan 2, 2030 | Encryption | corrected | Source attributed to M-26-15; the date originates in EO 14306 §2 (amending EO 14144 §4(f)); M-26-15 repeats it "consistent with Executive Order 14306" |
| 48 | CM-7(1) names FTP; AC-4 export-controlled quote | Encryption | verified | OSCAL catalog |
| 49 | FIPS 140-2 certificates to Historical List Sept 22, 2026; continued use in existing systems | Encryption | verified | NIST FIPS 140-3 Transition Effort page (note: one CMVP page says use through Sept 21) |
| 50 | DDI satisfies internal-resolver half; vendor-resolver trap | DNS | restated-as-design | Derived from #21; links Book 08 Ch03/Ch05 |
| 51 | SASE DNS integration via DoH to Protective DNS supports M-22-09 | DNS | verified | SASE guidance §5.5 |
| 52 | M-26-14 rescinds M-21-31, May 22, 2026 | Logging | verified | M-26-14 text |
| 53 | CEM and THIRF objectives; five-level model scored to lowest watermark | Logging | verified | M-26-14 Prioritization, Appendix C footnote 8 |
| 54 | Retention "six months searchable and one year retrievable" | Logging | corrected | Source stated it as the rule; it is the Level 4 (Optimal) definition. Level 1: 6 months retained/retrievable; Level 2: 12 months; Level 3: 3 months searchable, 12 retrievable |
| 55 | LRA published Aug 20, 2026 | Logging | corrected | Source said "August 2026"; exact date from cisa.gov/logging |
| 56 | Plan and maturity deadlines (90/120/180/320 days) and computed dates | Logging | verified | M-26-14 action table, read row by row; dates computed |
| 57 | Minimum log list includes source/destination addresses, protocols, ports, session attributes | Logging | verified | M-26-14 Appendix B item 5(b) |
| 58 | TIC doesn't replace telemetry requirements; SCC doesn't detail telemetry | Telemetry | verified | Program Guidebook §10 |
| 59 | E1E from MTIPS sensors stops at SASE transition; CLAW; three-way coordination quote | Telemetry | verified | SASE guidance §5.5 |
| 60 | CLAW expansion | Telemetry | corrected | Sources: "Cloud Log Aggregation Warehouse" (and Branch Edge Gap called "Comprehensive" wrong). CISA: Comprehensive Log Aggregation Warehouse; Guidebook v1.2 changed "Cloud" to "Comprehensive" |
| 61 | C-CIRA formerly NCIRA | Telemetry | verified | Program Guidebook §13 |
| 62 | Don't decommission MTIPS before CLAW parity | Telemetry | restated-as-design | Field office §4.9; program position |
| 63 | FedRAMP agency authorizes own systems; no standalone ATO for a CSO | FedRAMP | verified | fedramp.gov/2026/agencies/use |
| 64 | FedRAMP doesn't constrain routing; "name the control" | FedRAMP | restated-as-design | Use page makes no routing statement; argument is the program's |
| 65 | Notice 0013 removed most parameter values and nearly all guidance; no counts | FedRAMP | verified | NTC-0013 |
| 66 | Rev 4 Moderate 325 / Rev 5 323 controls | FedRAMP | removed | Not needed once "don't cite a count" is the advice |
| 67 | "FedRAMP Certified" current term; Certification Classes A–D | FedRAMP | verified | fedramp.gov/2026/definitions |
| 68 | Class C = Moderate | FedRAMP | verified | Marketplace label "Class C (Moderate)" (MSO365MT) |
| 69 | Early adoption July 4, 2026; mandatory Jan 1, 2027 | FedRAMP | verified | fedramp.gov/2026/timeline |
| 70 | Existing Rev5 authorizations valid to at least Dec 31, 2028 | FedRAMP | corrected | NTC-0013: end date "not finalized but likely no later than 2029"; new Rev5 requests end June 11, 2027 |
| 71 | SSP replaced by Certification Package Overview / POA&Ms retained (Branch Edge Gap §10) | FedRAMP | removed | Not needed for routing argument; not re-verified |
| 72 | INR not available to GCC Moderate | FedRAMP | verified | Microsoft Learn INR page (linked to Book 08 App C, not footnoted here) |
| 73 | M-22-09 operative; deadlines end of FY 2024; no successor | Currency | verified / restated | M-22-09 text (FY24); cited as current by SASE guidance (June 2026) and Guidebook (Sept 2026); no successor found by search |
| 74 | EO 14028 "as amended by EO 14306" | Currency | corrected | EO 14306 amends EO 13694 and EO 14144 (title and §§1–2), not EO 14028; strikes Section 5 of EO 14144 (verified) |
| 75 | BOD 26-04 June 10, 2026, revokes 22-01 and 19-02; four variables | Currency | verified | BOD 26-04 page |
| 76 | BOD 26-04 "one of five remediation windows" | Currency | removed | Table 1 is an image; count not confirmable |
| 77 | BOD 26-04 policy update due Aug 7, 2026 | Currency | corrected | 60 days from June 10 = Aug 9, 2026 (Phase II); Phase III Dec 7, 2026 verified |
| 78 | ED 26-03 Cisco SD-WAN, Feb 26, 2026 | Currency | corrected | Original issued Feb 25, 2026; V1 March 11, 2026; syslog to CISA via CLAW |
| 79 | Networx expired May 31, 2026; WITS 3 Feb 28, 2026 | Currency | verified | GSA Legacy IT contracts |
| 80 | 214 agencies transitioned as of July 31, 2026 | Currency | corrected | GSA EIS Transition: 219 agencies as of Aug 31, 2026 |
| 81 | EIS first option period runs to July 31, 2027 | Currency | verified | GSA EIS page (OP1 8/01/22–7/31/27; OP2 to 7/30/32) |
| 82 | DoD ZT Strategy: 91 target-level activities, 61 advanced, by end of FY 2027 | DoD contrast | verified (third-party) | DefenseScoop; strategy PDF returned HTTP 403 |
| 83 | DoD strategy doesn't mandate specific technologies (quoted in source) | DoD contrast | corrected | Exact quote unverifiable; restated with Breaking Defense paraphrase (third-party) |
| 84 | Thunderdome includes SD-WAN, SASE; DISA procurement not a mandate | DoD contrast | removed | Only vendor press releases found |
| 85 | No federal instrument names SASE or SD-WAN as required (M-22-09, M-26-14, M-26-15, ZTMM checked) | Throughout | verified | Text search of each PDF: zero hits for SD-WAN/SASE |
| 86 | M-25-04, M-26-05, DoD strategy also don't name SASE/SD-WAN | Throughout | removed | Not individually re-checked |
| 87 | 2.3: TIC FAQ says EIS provides SD-WAN options | — | removed | Not needed; procurement detail goes to Ch09 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Branch Edge Gap §2.1 What TIC 3.0 changed | Ch03 "From consolidation to capabilities" | Access-point reduction figures already omitted by the source |
| Branch Edge Gap §2.2 Current TIC 3.0 document set | Ch03 "The document set, read from the cover pages" (versions now verified) | — |
| Branch Edge Gap §2.3 What TIC 3.0 requires, stated precisely | Ch03 "From consolidation…" and "What the catalog and the Branch Office use case require"; App B "Requirements that are cited but don't exist" (non-existent SASE Roadmap) | TIC FAQ EIS/SD-WAN availability sentence not carried (Ch09 owns acquisition) |
| Branch Edge Gap §2.4 The honest version of the argument | Ch03 "The control assertions an agency makes…" (evidence argument) | — |
| Branch Edge Gap §2.5 Policy currency | Ch03 "Policy currency, October 2026" and "Logging and CISA telemetry" | — |
| Branch Edge Gap §2.6 FedRAMP does not constrain routing | Ch03 "FedRAMP does not constrain routing" | Rev 4/Rev 5 control counts dropped (#66) |
| Branch Edge Gap §10 Sources and verification status | Ch03 footnotes; App B sources and "cited but don't exist"; this log | Kerberos, CAE, hybrid join, SP 800-63B-4 items belong to Ch04/Ch06; LEO/EINSTEIN cautions to Ch02 |
| Long Interim §3.1 TIC 3.0 is technology-neutral | Ch03 "From consolidation…", "The document set…" | — |
| Long Interim §3.2 Nothing else names SASE or SD-WAN | Ch03 intro and "Technology-neutral…"; App B "cited but don't exist"; M-22-09 network actions in "Encryption" | Unchecked instruments dropped (#86) |
| Long Interim §3.3 Technology-neutral is not requirement-free | Ch03 "Technology-neutral is not requirement-free" (all four obligations) | — |
| Long Interim §3.4 The DoD contrast | Ch03 "The DoD contrast, correctly drawn" | Thunderdome removed (#84) |
| Long Interim §3.5 FedRAMP does not constrain routing | Ch03 "FedRAMP does not constrain routing" | Duplicate of BEG §2.6; merged |
| Long Interim §3.6 Your own control assertions | Ch03 "The control assertions…" table | — |
| Long Interim §4.1 What is required | Ch03 "What is required" | — |
| Long Interim §4.2 What is not required | Ch03 "What isn't required" | FedRAMP crypto-policy line removed (#41) |
| Long Interim §4.3 What this means in practice | Ch03 "What isn't required" closing paragraphs | — |
| Long Interim §4.4 Where encryption is load-bearing | Ch03 "Where encryption is load-bearing" | — |
| Long Interim §4.5 DNS and DDI | Ch03 "DNS: what satisfies the Protective DNS obligation" (condensed; links Book 08 Ch03 and Ch05) | DDI detail owned by Book 08 |
| Long Interim §4.6 One date inside this quarter | Ch03 last paragraph of "Where encryption is load-bearing" | — |
| Long Interim §10 Sources | Ch03 footnotes and App B source list | Microsoft ExpressRoute, contract-pricing and cost-evidence sources belong to Ch10/Ch12/Ch13 |
| Field office §4.5 Security and TIC 3.0 | Ch03 end of "What the catalog and the Branch Office use case require" (critical path), linking Ch11 | Hub-first accreditation sequencing left to Ch11 |
| Field office §4.8 Compliance drivers independent of cost | Ch03 "The control assertions…" (with corrections #32, #33) | Cost framing left to Ch11 |
| Field office §4.9 CLAW and Protective DNS replace MTIPS | Ch03 "CISA telemetry: CLAW and Protective DNS replace the MTIPS sensors" and diagram ch03-telemetry-continuity; DNS via DoH in "DNS" section | Phase-numbered exit criteria left to Ch11 |
| Field office A.2 Control-by-control detail | Ch03 "The control assertions…" (SC-7(4), SC-8, AC-4, SI-3/SI-4/AU-12, CP-8 corrected; ZTMM cross-cutting) | BOD 25-01 "sequencing lesson" not carried: BOD 25-01 governs Microsoft 365 configuration, not networks (the source says so); the remediate-before-assess point belongs to Ch13 |

## Consistency notes for the editor

- **M-21-31 is rescinded.** Book 08 Chapter 03, Book 08 Appendix B and Book 02 Chapter 11 still present M-21-31 (EL1 passive DNS, EL0–EL3 tiers) as current. This chapter states the rescission once and notes that earlier books describe logging under M-21-31. Those books need an update.
- Book 08 Chapter 03 calls TIC SCC v3.3 "published September 2026"; that is the republication date. The v3.3 content is dated July 2025 in its revision table. Not contradictory, just imprecise.
- Diagram sources: `docs/images/diagrams/b09-network/src/ch03-obligation-layers.flow.yaml`, `ch03-telemetry-continuity.flow.yaml`. Neither reused a `src-*` file, so no `src-` copy was deleted.

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | DoD Zero Trust Strategy citation (line 223, footnote `[^c03-dod-ds]`) left on DefenseScoop | The DoD contrast | unchanged | WebFetch of <https://dodcio.defense.gov/Portals/0/Documents/Library/DoD-ZTStrategy.pdf> returned HTTP 403 on 2026-10-21 |

**Manual check needed:** the editor should open the DoD Zero Trust Strategy PDF on dodcio.defense.gov in a browser, confirm the 91 target-level and 61 advanced-level activities and the FY 2027 target, then add it as the primary citation and keep DefenseScoop as corroboration. No unopened URL was cited.

| R-DoD | DoD Zero Trust Strategy: 91 target / 152 total activities, FY 2027 | §DoD counterexample | verified (official source added) | DOD News, June 4, 2024, https://www.war.gov/News/News-Stories/Article/Article/3795170/new-overlays-provide-guide-on-path-to-zero-trust/ (opened in browser Oct 21, 2026); 61 advanced = 152 − 91; strategy PDF downloads only. DefenseScoop kept as secondary. |

## Revision 2026-10-21 — TIC 3.0 Program Guidebook (v1.2, September 2026), read in full

Source: CISA, *TIC 3.0 Core Guidance Volume 1: Program Guidebook*, Version 1.2, September 2026 (27 pp., read page by page from the published PDF, https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Program_Guidebook_September_2026_47.pdf).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| G1 | Five security objectives and their descriptions; agency discretion; independent, not order of operations; map to CSF 2.0's six functions | new section | verified (added) | Guidebook §5, Table 3, p. 6 |
| G2 | M-19-26 retired TCV; compliance responsibility moves to the agency (quoted); automated metric collection via CDM replaces TIC FISMA metrics and manual TCV; non-FedRAMP vendor = agency assesses and authorizes | new section | verified (added) | Guidebook §4 p. 5, §9 pp. 11–12 |
| G3 | Four-step TIC information cycle | new section | verified (added) | Guidebook §10.1 and Figure 5, pp. 12–13 |
| G4 | TIC delegates' role; TICAP (NOC and SOC); Multi-Service TICAP or MTIPS; EIS managed-security-service model | new section | verified (added) | Guidebook §11–12, pp. 13–14 |
| G5 | Telemetry guide is the *CISA Cloud Interface Reference Architecture* (C-CIRA, formerly NCIRA), two volumes, for providing cloud security information to CLAW | §Logging and CISA telemetry | corrected (was "CLAW Cloud Interface Reference Architecture (formerly the NCPS …)") | Guidebook §13 "TIC and EINSTEIN", p. 16 |
| G6 | Revision history v1.2 July 2025 changed "Cloud" to "Comprehensive" for CLAW | §Logging (existing) | re-verified | Guidebook Table 1, p. ii |
| G7 | Note: §4 says "seven strategic goals" but lists six (Boundary-Focused; Descriptive, Not Prescriptive; Risk-Based; Environment-Agnostic; Dynamic and Readily Adaptable; Automated and Streamlined Verification); the chapter doesn't state a count | — | noted | Guidebook §4, pp. 4–5 |
| G8 | Revision-history aside in "The document set" reworded to a plain statement | §The document set | wording-only | — |

## Addition, October 24, 2026: SD-WAN platform and Cisco implementation research

Applied from the two research briefs behind the workbook's SD-WAN platform deep dive and Cisco Catalyst SD-WAN implementation guide. Each claim was checked against the primary source on October 24, 2026; every new or changed sentence carries its own footnote.

| # | Claim | Where | Verdict | Source note |
|---|---|---|---|---|
| 1 | ED 26-03 issued February 25, 2026, actions superseded by V1 on March 11, 2026; required SD-WAN syslog to CISA through CLAW | Policy-currency table, ED 26-03 row | confirmed (no change) | `[^c03-ed2603]` |
| 2 | Nine Cisco Catalyst SD-WAN CVEs added to KEV during 2026, newest September 30, 2026; the directive's sequence is a standing posture | Policy-currency table, ED 26-03 row | added | `[^c03-kev2026]` (KEV JSON, catalog 2026.10.23) |
