# Verification — Chapter 05, Assessment and Certification

Writer W3. Source: `docs/compliance/Vol_V_Book_03_Assessment_Certification.md` (about 2,400 words). All primary sources opened October 21, 2026. SP 800-53 control statements, withdrawn status and baselines read from NIST's Release 5.2.0 OSCAL catalog and the Low, Moderate and High baseline profiles (usnistgov/oscal-content). NICE Framework work roles, categories, competency areas and OPM code links read from NIST's v2.2.0 JSON components file. SP 800-50 Rev. 1 and OMB A-130 read as extracted PDF text. Microsoft claims checked with the Microsoft Learn tools. ISC2, CompTIA and ISACA claims read on their own sites. No personal data sent to any site; downloads used a generic user agent.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A-130: test the knowledge level of users; role-based training before access | Opening | verified | A-130 App. I §4.h items 4–5 (PDF text) |
| 2 | SP 800-50r1 uses the four Kirkpatrick levels; Level 2 practical assessments that "mimic what will be experienced in the work role"; case studies, virtual cyber labs, scenarios | Opening | verified | SP 800-50r1 §5.2.3.3, Table 3 |
| 3 | NICE Security Control Assessment definition ("independent comprehensive assessments… to determine their overall effectiveness") | Opening | verified | NICE v2.2.0 JSON, OG-WRL-012 |
| 4 | Assessor competency equals what a 3PAO exercises | Opening | restated-as-design | Replaced with NICE work role definition; 3PAO comparison dropped |
| 5 | Four-level scale, pass bar (all ≥2, ≥3 at level 3), "distinguished" outcome | The scale | restated-as-design | — |
| 6 | Level 3 requires a real verdict from a named engine command | The scale | restated-as-design | Engine name and command removed; "the agency's evidence tooling"; freshness rule added to match Ch03 |
| 7 | Common check: gaps name forcing deadline "BOD 26-04 Dec 7 2026; 20x mandatory Jan 1 2027" | Common checks | corrected | Book 14 Ch02 (BOD 26-04 sets agency remediation timelines; SBOM/VDR dates are FedRAMP provider rules); check generalized |
| 8 | Controls by area; all in Moderate except PM family and AT-3(5) | Eight areas | verified | OSCAL 5.2.0 Moderate profile (CM-3, IA-5, SR-family members, AC-2(1), AC-4, AC-5, AC-6, SC-8, IA-3, CP-6/7/8 checked; no PM controls; AT-3(5) not in L/M/H) |
| 9 | IA-2(11) listed in identity slot | Eight areas | corrected | OSCAL: IA-2(11) withdrawn, incorporated into IA-2(6) |
| 10 | AT-2(+1), AT-3(+3) as training-slot controls | Eight areas | corrected | Not in any SP 800-53B baseline (OSCAL profiles); consistent with Book 14 Ch09 |
| 11 | AT-2(3) omitted | Eight areas | corrected | OSCAL Moderate profile selects AT-2(3) |
| 12 | CP-5 withdrawn, incorporated into CP-2 | Eight areas | verified | OSCAL: CP-5 status withdrawn, incorporated-into CP-2 |
| 13 | Slot 2 "16-control closure claim attributed to the roadmap" | Eight areas | removed | Internal count |
| 14 | Slot 6 "BOD 26-04 submission story: SBOM → KSI-011–014 activation" | Eight areas | corrected | Book 14 Ch02 and Ch07; restated as what the agency receives from providers and asks for in contracts |
| 15 | Slot 8 "training-effectiveness-record JSON as KSI-022 evidence contract, ≥95% thresholds" | Eight areas | corrected | Book 14 Ch03 (no KSI-022; training indicator is KSI-CED-RAT); threshold dropped; record per Book 14 Ch09 |
| 16 | Zero-finding AAR scores 0; aggregate-only training stats score 0 | Eight areas | restated-as-design | — |
| 17 | Track B capstone four criteria | Implementation capstone | restated-as-design | Engine command removed |
| 18 | KSI Closure Necessity Matrix: 10 attestable / 19 architecture-bound / 29 total | Reconstruction exam | removed | Internal counts; superseded by FedRAMP's published indicator set (Book 14 Ch03) |
| 19 | FedRAMP 2026: 46 KSIs in ten themes; education indicator "is persistently reviewed"; written about the provider | Reconstruction exam | verified | fedramp.gov 2026 KSI page |
| 20 | KSIs bind providers, not agencies | Reconstruction exam | verified (by link) | Book 14 Ch03 (published) |
| 21 | Exam as reconstruction of tool-attestable vs architecture-dependent split | Reconstruction exam | restated-as-design | — |
| 22 | Two credentials, Practitioner and Assessor, requirements | Two credentials | restated-as-design | Names lower-cased; assessor route aligned with Ch03 (assessors score a capstone, compared with a second assessor) |
| 23 | Credential record closes AT-2/AT-3 and "satisfies KSI-022" | Two credentials | corrected | KSI-022 doesn't exist (Book 14 Ch03); restated as AT-4 record feeding Book 14 Ch09 evidence |
| 24 | SP 800-50r1: learning data heightened sensitivity; manage LMS risks | Two credentials | verified | SP 800-50r1 §2.4.1 |
| 25 | Recertification every 12 months or on procedure change; short practical reassessment | Recertification | restated-as-design | New (source had none) |
| 26 | AT-3: before access, at defined frequency, on system changes; no fixed NIST interval | Recertification | verified | OSCAL AT-3 statement (organization-defined parameters) |
| 27 | SP 800-50r1: role-based staff may need "annual certifications or courses" | Recertification | verified | SP 800-50r1 §2.5.3 |
| 28 | Microsoft role-based/specialty certs expire after one year; free online renewal within six months before expiry; lapsed must re-earn | Recertification; industry table | verified | Microsoft Learn renewal FAQ; Certification process overview |
| 29 | Credential as PIM eligibility condition | Recertification | restated-as-design | — |
| 30 | SP 800-181 Rev. 1, November 2020; "common, consistent lexicon" | NICE | verified | CSRC SP 800-181r1 page |
| 31 | NICE Components v2.2.0, April 28, 2026; new C-SCRM work role | NICE | verified | NIST news release (current-version page prints 2025; noted in footnote) |
| 32 | v2.2.0: 5 categories (names), 42 work roles, 11 competency areas, OPM code links | NICE | verified | NICE v2.2.0 JSON (element counts) |
| 33 | v2.0.0 March 5, 2025 removed Cyberspace Effects and Cyberspace Intelligence; 7→5 categories, 52→41 roles | NICE | verified | NICE v2.0.0 Summary of Changes PDF, Table 1 |
| 34 | Work role names, IDs and OPM codes in the mapping table | NICE table | verified | NICE v2.2.0 JSON relationships |
| 35 | Program role → NICE role mapping | NICE table | restated-as-design | — |
| 36 | SP 800-50r1: managers "encourage them to acquire industry-recognized certifications"; certification attempts as a quantitative measure | Industry certifications | verified | SP 800-50r1 §1.6.4, §2.4.1.1 |
| 37 | Microsoft Applied Skills: scenario-based, interactive lab-based assessment on Learn | Industry table | verified | Microsoft Learn Applied Skills (educator center) |
| 38 | CompTIA Security+: core security functions; valid three years; renew via CE among other methods | Industry table | verified | comptia.org Security+ page; Certification Renewal Policy |
| 39 | CISSP: five years required experience; 120 CPE per three-year cycle | Industry table | verified | isc2.org CISSP page; Member Policies |
| 40 | CGRC: two years experience; 60 CPE per three-year cycle | Industry table | verified | isc2.org CGRC page; Member Policies |
| 41 | ISACA CISA, CISM, CRISC descriptions | Industry table | verified | isaca.org certifications page (CPE figures not stated there; left as "per ISACA's policy") |
| 42 | Industry cert can waive a module, never a capstone; record each credential's own expiry | Industry certifications | restated-as-design | — |
| 43 | Score sheet; "Not yet" resubmission | Score sheet | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, draft-proposal callout, Date Code | — | Not carried: publication stamps and agency shortcode (brief) |
| What This Document Addresses | Opening; "In this chapter" | Internal names (Academy, KSI-CED, Vol coordinates) translated |
| The Scale (Applies to Every Slot) | The scale | Engine command removed; freshness rule added |
| Pass bar | The scale | — |
| Common Checks | Checks that apply to the whole submission | Deadline example corrected and generalized |
| Per-Slot Rubrics: Slot 1 Identity | Eight areas, row 1 | IA-2(11) corrected; volume coordinates mapped to workbook books |
| Slot 2 Addressing | Row 2 | Internal 16-control claim removed; AC-4 moved to network per Ch03 |
| Slot 3 Network | Row 3 | — |
| Slot 4 Telemetry | Row 4 | Product names (Defender VM, Sentinel) generalized; AU-7/AU-8 not carried (not needed for the trace) |
| Slot 5 Endpoint | Row 5 | Product names generalized |
| Slot 6 Security Configuration & Change | Row 6 | BOD 26-04/KSI activation story corrected |
| Slot 7 Continuity | Row 7 | CP-5 note kept |
| Slot 8 Training | Row 8 | KSI-022 and ≥95% threshold corrected/dropped; AT enhancements corrected |
| Scoring the Track A Capstone | Scoring the compliance-track capstone | — |
| Scoring the Track B Capstone (table) | Scoring the implementation-track capstone | Engine command removed |
| KSI Closure Necessity Matrix — the Certification Exam (narrative) | The closure reconstruction exam | Internal 10/19/29 counts removed; tied to FedRAMP's published indicators and the agency crosswalk |
| KSI Closure Necessity Matrix (table) | — | Not carried: internal rule families and counts; superseded by Book 14 Ch03 and Appendix A |
| Certification — Practitioner and Assessor | Two credentials | Assessor route aligned with Ch03 |
| Both credentials feed slot 8 | Two credentials (record paragraph) | KSI-022 corrected to AT-4 record |
| Scoring Sheet | Score sheet | — |
| Series Context — Vol V Book 03 | — | Not carried: internal series map |
| Closing italic note (self-assessed, pending SCA) | — | Not carried: internal framing; chapter labels design vs cited fact throughout |
| (new) Recertification | Recertification | Brief asked for it; program design, grounded in AT-3, SP 800-50r1 and vendor renewal rules |
| (new) Industry certifications and NICE work roles | Industry certifications and the NICE Framework | Brief asked for it; each body verified on its own site |
