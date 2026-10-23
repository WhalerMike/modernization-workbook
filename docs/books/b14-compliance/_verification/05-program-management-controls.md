# Verification — Chapter 05, Program Management Controls

Writer W3. Sources: `docs/compliance/Vol_IV_Book_00_Governance_Assurance_Overview.md` and `docs/compliance/Vol_IV_Book_03_Program_Management_Governance.md` (both archived after the build; not linked). Primary sources opened October 21, 2026: the SP 800-53 Rev. 5 OSCAL catalog 5.2.0 (last modified May 11, 2026) and the Low, Moderate and High OSCAL baseline profiles (usnistgov/oscal-content, parsed locally); the SP 800-53B PDF (Table 3-13); FedRAMP's Full Rev5 Control Reference, Program Management page; the FedRAMP machine-readable ruleset `fedramp-consolidated-rules.json` v2026.10.13.01 (GitHub FedRAMP/rules); OMB Circular A-130 PDF; 44 U.S.C. §3554 (Cornell LII); SP 800-37 Rev. 2 PDF; SP 800-39 PDF; SP 800-161 Rev. 1 CSRC page; CISA BOD 26-04 page; CISA Federal Incident Notification Guidelines; CIS MS-ISAC page; Microsoft Learn Azure Resource Graph starter samples and query-language pages.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PM family "deployed organization-wide," "not associated with security control baselines," "independent of any system impact level," implemented at organization level | Opening | verified | SP 800-53B §3.13, Table 3-13 |
| 2 | FedRAMP 2026 reference lists 37 PM controls/enhancements and no class for any | Opening; tables | verified (no "FedRAMP Rev5 Baselines" string on the PM page; every PM control "does not have additional FedRAMP guidance or FedRAMP-assigned parameter values") | FedRAMP PM control page |
| 3 | "FedRAMP 20x Authorization requires" PM artifacts | Opening | corrected (requirement comes from FISMA, A-130, SP 800-53; FedRAMP assigns no PM control to providers) | As 1–2; A-130 |
| 4 | A-130: develop and maintain an ISPP documenting PM and common controls | Opening; PM-1 | verified | A-130 App. I §4.c(1); §10.a definition 41 |
| 5 | "Closure Necessity — PM family": PM closes through documents signed by officials, not network technology | Opening | restated-as-design (doctrine name dropped; idea stated plainly; linked Ch04) | — |
| 6 | Control statements PM-1, 2, 4, 5, 5(1), 6, 7, 9, 10, 11, 14, 15, 30, 30(1), 31 | Table; sections | verified (paraphrased from OSCAL 5.2.0; none in any NIST baseline) | OSCAL catalog and profiles |
| 7 | "Together these artifacts close nine NIST PM controls" | Source intro | restated (chapter covers thirteen as assigned; "closes" replaced by what each asks and the evidence) | — |
| 8 | PM-30 + SBOM pipeline "seeds KSI-SCR coverage (KSI-015, KSI-016)" | PM-30 | corrected (KSI-SCR-MIT and KSI-SCR-MON list no PM controls; KSIs bind providers; internal KSI numbers dropped) | FedRAMP ruleset JSON |
| 9 | ISPP owned by SAISO, reviewed annually or after major change | PM-1 | restated-as-design (PM-1(b) leaves frequency and events to the organization) | OSCAL PM-1 |
| 10 | Six-section ISPP template | PM-1 | restated-as-design (content mapped to PM-1 and A-130) | — |
| 11 | PM-3 resources in capital planning | PM-1 table | verified | OSCAL PM-3 |
| 12 | FISMA 2014, 44 U.S.C. §3551 | PM-1 authorities | corrected/verified (chapter 35, subchapter II, beginning at §3551) | Cornell LII §3554 page context |
| 13 | "FedRAMP 20x Authorization Framework (GSA, 2026)" | PM-1 authorities | corrected (FedRAMP Consolidated Rules for 2026 under M-24-15; link Book 10 Ch03) | Book 10 Ch03 |
| 14 | "CISA BOD 26-04 (SBOM/VDR/VER, effective Dec 7, 2026)" | PM-1 authorities | corrected (BOD 26-04 is *Prioritizing Security Updates Based on Risk*, June 10, 2026, revokes BOD 19-02 and 22-01; no mention of SBOM/VDR/VEX; Phase III within 180 days = Dec 7, 2026; FedRAMP VDR rules same day per Book 12 Ch06) | CISA BOD 26-04 page |
| 15 | EO 14028 in authorities list | PM-1 | removed (not needed for the PM-1 argument; supply chain authorities left to Ch07) | — |
| 16 | Objective: "KSI scores meeting the FedRAMP 20x Authorize threshold across all 10 KSI themes" | PM-1 objectives | corrected (KSIs bind providers; agency reviews OCRs; restated as maintaining authorizations and reviewing providers' reports) | Book 12 Ch12; Book 13 Ch11 |
| 17 | Objective: "Satisfy BOD 26-04 SBOM/VDR/VER requirement by Dec 7, 2026" | PM-1 objectives | corrected (see #14) | CISA BOD 26-04 |
| 18 | Objectives naming citizen benefit payments/PII | PM-1 | restated (agency-specific wording removed) | — |
| 19 | PM-2 text; FISMA §3554(a)(3)(A) designating a SAISO; A-130: CIO designates SAISO | PM-2 | verified | OSCAL PM-2; Cornell §3554; A-130 §5.f(2)(a) |
| 20 | "FedRAMP 20x requires named individuals in security leadership roles" | PM-2 | corrected (no such FedRAMP rule found; named individuals are the PM-2/PM-10 evidence under the program's design) | FedRAMP PM page |
| 21 | PM-10 text; SP 800-37 Task P-1 role assignment, primary: head of agency, CIO, SAOP | PM-10 | verified | OSCAL PM-10; SP 800-37 §3.1 P-1 |
| 22 | AO and CISO must be agency employees | PM-2 | verified (SP 800-37 App. D: AO and SAISO roles "inherent U.S. Government function," "government personnel only"; SAISO may be called CISO) | SP 800-37 App. D |
| 23 | AO is the only official who can accept risk; decision not delegable to the designated representative | PM-2 | verified | SP 800-37 App. D |
| 24 | ISSO may be a contractor with documented oversight | PM-2 | restated-as-design (SP 800-37 doesn't reserve the role) | — |
| 25 | "The 3PAO must be FedRAMP-recognized" | PM-2 | corrected (FedRAMP-recognized assessors certify providers; agency selects its own assessors under CA-2; CA-2(1) in Moderate and High) | OSCAL CA-2(1) and baselines |
| 26 | RACI matrix | PM-2 | restated-as-design (rows updated: BOD 26-04 row becomes vulnerability remediation reporting; KSI monitoring row becomes OCR review) | — |
| 27 | PM-9 text; SP 800-37 Task P-2 with risk tolerance, head of agency primary | PM-9 | verified | OSCAL PM-9; SP 800-37 P-2 |
| 28 | SP 800-39 tiers mapped "Tier 1: framing; Tier 2: assessment; Tier 3: response" | PM-9 | corrected (four components frame/assess/respond/monitor at each of three tiers: organization, mission/business process, information system) | SP 800-39 Ch. 2 |
| 29 | Four risk responses: mitigate, transfer, accept, avoid | PM-9 | corrected (SP 800-39 lists five: accepting, avoiding, mitigating, sharing, transferring) | SP 800-39 Ch. 2 |
| 30 | Risk appetite statement with category tolerances (agency-specific) | PM-9 | restated-as-design (agency references removed; example values) | — |
| 31 | Scoring matrix 1–4/5–9/10–15/16–25 with 90/30/15-day POA&M windows | PM-9 | restated-as-design (not federal; KEV timelines under BOD 26-04 govern KEV items) | CISA BOD 26-04 |
| 32 | Risk register maintained in the POA&M tracker; reviewed monthly/quarterly | PM-9 | restated (register vs POA&M distinction per Book 13 Ch12; cadence not repeated) | Book 13 Ch12 |
| 33 | PM-4 text; FISMA §3554(b)(6) remedial action process; A-130 POA&M use and availability to OMB, DHS, IGs, GAO; FedRAMP no class | PM-4 | verified | OSCAL PM-4; Cornell §3554; A-130 App. I §4.c(15); FedRAMP PM page |
| 34 | PM-5 requires "a current, complete inventory of all system components within the authorization boundary" | PM-5 | corrected (PM-5 is an inventory of organizational systems; component inventory is CM-8, in L M H) | OSCAL PM-5, CM-8 |
| 35 | "FedRAMP 20x additionally requires that the inventory be machine-readable and kept in sync" | PM-5 | corrected (KSI-PIY-GIV binds providers and maps to CM-8, not PM-5) | FedRAMP ruleset JSON |
| 36 | A-130 inventory requirement | PM-5 | verified (major information systems, holdings, dissemination products; separate PII systems inventory) | A-130 §5.a(1)(a) |
| 37 | SP 800-37 Task P-18 register the system | PM-5 | verified | SP 800-37 §3.1 P-18 |
| 38 | Three-layer inventory: Resource Graph + Logic App daily; SBOM (Syft, CycloneDX 1.6); Entra; monthly reconciliation; 30-day POA&M rule; weekly privileged account review | PM-5 | restated-as-design (tool names and versions left to Ch07; Logic App and weekly review not carried) | — |
| 39 | Azure Resource Graph `Resources` table, `project`, `order by` | PM-5 code | verified; query extended with a system-id tag (program design) | Microsoft Learn ARG samples and query language |
| 40 | Identity evidence "satisfies CM-8(2) automated inventory maintenance" | PM-5 | removed (not supported by the sources opened; identity inventory linked to Book 02 and Book 12 Ch03) | — |
| 41 | PM-11 text; SP 800-37 P-8 | PM-11 | verified | OSCAL PM-11; SP 800-37 P-8 |
| 42 | Mission function table (agency-specific function names) with RTO/RPO | PM-11 | restated (agency-specific names removed; values marked illustrative; tied to Ch06 BIA) | — |
| 43 | PM-7 text; A-130 EA requirement and incorporate security/privacy into EA; SP 800-37 P-16 | PM-7 | verified | OSCAL PM-7; A-130 §5.a(2), App. I §4.b(5); SP 800-37 P-16 |
| 44 | Five architecture review gates; PTA and categorization before design | PM-7 | restated-as-design | — |
| 45 | EA artifacts referencing volume numbers (TAD, Purview/CMK, network books) | PM-7 | removed (internal volume identifiers) | — |
| 46 | KSI-PIY-RSD lists PM-7 among related controls | PM-7 | verified | FedRAMP ruleset JSON |
| 47 | PM-6 and PM-31 text; SP 800-37 P-7 owned by senior accountable official for risk management; FedRAMP no class for PM-31 | PM-6/PM-31 | verified | OSCAL; SP 800-37 P-7; FedRAMP PM page |
| 48 | Monitoring dimensions mapped to KSI themes (endpoint → KSI-PIY, vulnerability → KSI-MLA, etc.) | PM-31 | corrected (KSI labels dropped: indicators bind providers; PIY is Policy and Inventory, not endpoints); dimensions and cadences restated-as-design | FedRAMP ruleset JSON |
| 49 | Sentinel workbook names per dimension | PM-31 | removed (product detail belongs to Book 12; replaced with links) | — |
| 50 | PM-14 text | PM-14 | verified | OSCAL PM-14 |
| 51 | Testing at least annually | PM-14 | verified ("with a frequency depending on risk, but no less than annually") | Cornell §3554(b)(5) |
| 52 | Annual 3PAO assessment | PM-14 | corrected (independent assessor per CA-2/CA-2(1); "3PAO" is the provider construct) | OSCAL CA-2(1) |
| 53 | Annual penetration test | PM-14 | restated-as-design; CA-8 noted as NIST High only | OSCAL CA-8 and baselines |
| 54 | Semi-annual IR tabletop; quarterly baseline review; per-merge SBOM scan; continuous scanning | PM-14 | restated-as-design | — |
| 55 | Annual contingency plan test | PM-14 | verified/linked (exercise level per SP 800-34; Ch06) | Ch06 |
| 56 | Training table (role-based, FedRAMP procedures, IR, SBOM, privacy) | PM-14 | restated (summarized; AT controls in Ch09, Book 16 planned) | — |
| 57 | PM-15 text | PM-15 | verified | OSCAL PM-15 |
| 58 | Contacts ir@cisa.dhs.gov, kev@cisa.dhs.gov, info@fedramp.gov | PM-15 | corrected (email addresses removed; federal incidents reported through CISA Incident Reporting Form within one hour of identification by the top-level CSIRT, SOC or IT department) | CISA Federal Incident Notification Guidelines |
| 59 | MS-ISAC "active member" for a federal agency | PM-15 | corrected (MS-ISAC serves SLTT governments; member-funded model in 2025) | CIS MS-ISAC page |
| 60 | IT-ISAC, CISA PSIRT feeds, MSRC RSS, NVD daily pull, CSA, ACT-IAC, ISACA | PM-15 | restated (generalized to four contact groups; named industry groups dropped to examples) | — |
| 61 | PM-30 text; A-130 SCRM plans per SP 800-161 | PM-30 | verified | OSCAL PM-30; A-130 App. I §4.c(4) |
| 62 | SP 800-161r1 | PM-30 | verified/updated (May 2022, updated Nov 1, 2024) | CSRC SP 800-161r1 page |
| 63 | Charter implements "EO 14028 §4(c), and FedRAMP 20x KSI-SCR" | PM-30 | removed/corrected (KSIs bind providers; EO detail left to Ch07) | FedRAMP ruleset JSON |
| 64 | SCRM organization chart and roles | PM-30 | restated-as-design (converted to a role table) | — |
| 65 | Five SCRM risk categories with SR controls and evidence | PM-30 | not carried here (duplicates Ch07's scope) | — |
| 66 | Assessment triggers: annual, new procurement, CVE/KEV, SBOM diff | PM-30 | restated-as-design | — |
| 67 | Supplier requirements (SBOM within 30/15 days, PSIRT 24h, notify 72h, VEX within 30 days, audit rights) | PM-30 | not carried here (contract terms belong to Ch07) | — |
| 68 | "SBOM/VDR/VEX mandated by EO 14028 §4 and SP 800-161 — not BOD 26-04" and "FedRAMP VDR/VER (NTC-0014) and BOD 26-04 timelines both Dec 7, 2026" | PM-30 | partly carried (BOD 26-04 not an SBOM directive; Dec 7 date verified for BOD 26-04 Phase III and per Book 12 Ch06 for FedRAMP VDR); EO mandate claim left to Ch07 | CISA BOD 26-04; Book 12 Ch06 |
| 69 | "SCRM program satisfies all three BOD 26-04 tiers" | PM-30 | corrected (BOD 26-04 has no SBOM/VDR/VEX tiers) | CISA BOD 26-04 |
| 70 | Governance cadence row "BOD 26-04 submission check (Oct 1)" | PM-30 | removed (the directive sets no such submission) | CISA BOD 26-04 |
| 71 | Charter approval signatures; signed charter is the PM-30 artifact | PM-30 | restated-as-design | — |
| 72 | Traceability matrix "✅ Template provided" | Appendix A | not carried (replaced by the at-a-glance table and design/requirement table) | — |
| 73 | Requirement/design table rows | Final table | verified / restated-as-design per row | As cited |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol IV Book 00 — front matter, internal banner, draft-proposal box, Date Code | — | Internal production metadata and agency shortcodes; not carried |
| Vol IV Book 00 — Volume Purpose | Opening ("no product closes a PM control"; closure by artifact) and thesis | Volume-numbered framing dropped; the "configured control without a signed artifact is an open finding" lesson carried into Ch05 opening and Ch06 opening |
| Vol IV Book 00 — Books in This Volume (table) | — | Volume structure is Ch12's subject (series as a map); not repeated |
| Vol IV Book 00 — How This Volume Fits the Program | — | Capstone/evidence-fabric framing belongs to Ch11 and Ch12; FedRAMP 20x "requires" framing corrected in opening |
| Vol IV Book 00 — Where This Volume's Evidence Lands (Vol X) | — | Governance-platform integration is covered in Book 13 Ch11 and Ch12 of this book |
| Vol IV Book 03 — front matter, banner, draft box | — | Internal metadata; not carried |
| Vol IV Book 03 — What This Document Addresses | Opening; "The controls at a glance" | Artifact list kept; "nine controls" and KSI-015/016 claims corrected |
| Vol IV Book 03 — Why PM Controls Gate Authorization | Opening; PM-1 and PM-9 sections | KSI "outcomes" framing corrected (KSIs bind providers) |
| Vol IV Book 03 — PM Controls Closed by This Document (table) | "The controls at a glance" table | Expanded to the thirteen assigned controls |
| Vol IV Book 03 — Closure Necessity — PM family (callout) | Opening | Doctrine name dropped; idea stated plainly |
| Vol IV Book 03 — ISPP Document Template; Section Outline 1–4 | PM-1 section (six-section template; authorities and objectives corrections) | Fillable blockquotes condensed into a table; budget table reduced to the resources row with PM-3 |
| Vol IV Book 03 — Enterprise Architecture Integration (PM-7) | PM-7 section (five gates) | Volume-numbered EA artifact list removed |
| Vol IV Book 03 — Mission and Business Process Definition (PM-11) | PM-11 section (generic register table) | Agency-specific function names removed |
| Vol IV Book 03 — Program Leadership and Accountability (PM-2): role definitions, RACI, fillable note | PM-2/PM-10 section (role matrix; corrections on AO/SAISO, ISSO, 3PAO) | Role-definition table folded into the matrix; broken figure fragment (line 268) dropped |
| Vol IV Book 03 — System Inventory Framework (PM-5): requirements, automation layers, KQL, inventory template | PM-5 section (PM-5 vs CM-8 correction; three layers; corrected KQL) | Component template table not carried (CM-8 detail) |
| Vol IV Book 03 — Risk Management Strategy (PM-9): framework, risk appetite, register format, scoring, responses | PM-9 section | Tier mapping and response list corrected; register columns not repeated (Book 13 Ch12) |
| Vol IV Book 03 — Testing, Training, and Monitoring Plan (PM-14): framework, testing schedule, training requirements, continuous monitoring program | PM-14 section (schedule); PM-6/PM-31 section (monitoring dimensions) | Training table summarized and linked to Ch09/Book 16; KSI and Sentinel columns dropped |
| Vol IV Book 03 — Security Contact Registry (PM-15): government, ISAC, industry contacts | PM-15 section (four groups) | Email addresses and MS-ISAC membership corrected |
| Vol IV Book 03 — SCRM Governance Charter (PM-30): purpose, structure, risk categories, assessment process, supplier requirements, EO 14028 evidence posture, cadence, approval | PM-30 section (governance shape, triggers, corrections) | Risk categories, supplier contract terms and evidence tiers go to Ch07 (W4's chapter); BOD 26-04 tier and submission claims corrected |
| Vol IV Book 03 — Appendix A, PM Control Traceability Matrix | "The controls at a glance"; requirement/design table | Status checkmarks not carried |
| Vol IV Book 03 — Appendix B, Integration with Compliance Technical Series | Cross-links throughout (Book 02, 05, 12, 13; Ch06–Ch09) | Volume/book identifiers replaced by workbook links |

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A-130 §5.a(2): EA with baseline, target, transition plan aligned to IRM Strategic Plan | PM-11, PM-7 | verified (quoted) | OMB Circular A-130 §5.a(2) |
| 2 | Program's assessment, target and phase plan are the EA's three parts | PM-11, PM-7 | restated-as-design | B00 App. C |
