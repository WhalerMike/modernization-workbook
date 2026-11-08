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

## November 2, 2026 addition: the Section 508 gate

### Sources opened

All opened November 2, 2026: U.S. Access Board, "Information and Communication Technology" (the Revised 508 Standards and 255 Guidelines, including Appendix A to 36 CFR part 1194 and the 2017 final rule preamble), page downloaded and text extracted locally, read at E101.2, E103.4 (Alteration), E202.2–E202.7.2, E205.3, E205.4, E207.2, Chapter 3 (302) and 702.10.1; 29 U.S.C. §794d on law.cornell.edu, read at (a)(1)(A), (a)(1)(B), (a)(2) and (a)(4); OMB M-24-08 PDF from whitehouse.gov, text extracted locally and read in full (§§I–III, Immediate Actions, Appendices A and B); Section508.gov "Laws and Policies" (reviewed October 2026), "Applicability & Conformance Requirements," "Understanding Vendor Claims in Accessibility Conformance Reports" (reviewed September 2023) and "Accessibility Conformance Report (ACR)" (reviewed March 2018); OMB's Memoranda page (2025–2027 memoranda); W3C WCAG 2.0 Recommendation (11 December 2008), downloaded and searched for the success criteria cited; W3C WCAG 2.2 Recommendation (12 December 2024 version), downloaded and searched for the abstract and SC 3.3.7; W3C "Understanding Success Criterion 3.3.8"; Microsoft Learn (MCP search and fetch): "Improve accessibility with multifactor authentication in Microsoft Entra ID," "Configure Temporary Access Pass to register passwordless authentication methods," "Configure your company branding," "CSS template reference guide," "Collect custom user attributes during external tenant sign-up," "Customize browser language for authentication experience," and "U.S. Section 508" (compliance offerings).

### WCAG version check

Asked: do the standards incorporate WCAG 2.0 or a later version? Answer: 2.0. 702.10.1 incorporates "WCAG 2.0, W3C Recommendation, December 11, 2008," applied by E205.4 and E207.2; Section508.gov's applicability page says the standards "incorporate by reference the WCAG 2.0 Level AA Success Criteria"; neither site mentions a rulemaking to adopt 2.1 or 2.2. Footnoted as `c06-wcag-version`.

### Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 33 | §794d(a)(1)(A) comparable access for federal employees, quote; unless undue burden | 508 gate, opening | verified (quote) | 29 U.S.C. §794d |
| 34 | §794d(a)(1)(B) alternative means when undue burden; the statute uses "undue burden," not "fundamental alteration" | Exceptions | verified | 29 U.S.C. §794d |
| 35 | E202.2 legacy ICT not altered on or after January 18, 2018 need not be modified; E103.4 "alteration" definition, quote | Opening | verified (quote) | Revised 508 Standards |
| 36 | A rebuilt front end is an alteration; a rehost keeps the old screens; defects recorded in triage | Opening | restated-as-design | — |
| 37 | E207.2 software UI and content conform to WCAG 2.0 A and AA, quote; E205.4 content; four SC exceptions for non-web documents and software | Standard | verified (quote) | Revised 508 Standards |
| 38 | 302 functional performance criteria (302.1 without vision); E101.2 equivalent facilitation, quote | Standard | verified (quote) | Revised 508 Standards |
| 39 | The floor is WCAG 2.0 AA; no update to 2.1 or 2.2 found | Standard | verified (absence noted on both sites, Nov 2, 2026) | Access Board; Section508.gov |
| 40 | WCAG 2.2 conforming content also conforms to 2.0 and 2.1; W3C advises 2.2, quote; 12 Dec 2024 version, first published 5 Oct 2023 | Standard | verified (quote) | WCAG 2.2 |
| 41 | Build to 2.2 AA, report against 2.0 AA | Standard | restated-as-design | — |
| 42 | M-24-08, Dec 21, 2023; rescinds four older OMB memoranda | M-24-08 | verified | M-24-08 §I |
| 43 | No later rescission found | M-24-08 | verified as far as checked: Section508.gov lists it without a rescission label; OMB's 2025–2027 list has no accessibility memo and no rescission of it. Section508.gov links it on an archived White House domain, while the PDF still resolves on whitehouse.gov | Section508.gov; OMB memoranda page |
| 44 | "must be incorporated ... from the very beginning ..." quote; must ensure conformance when designing or developing | M-24-08 | verified (quote) | M-24-08 §III.C |
| 45 | Test comprehensively before deployment; test with people with disabilities and AT users; monitor after deployment; validate updates | M-24-08 | verified | M-24-08 §III.C |
| 46 | Monitoring across the SDLC incl. EA reviews ... change control, quote; experts as "authoritative decision-makers," quote | M-24-08 | verified (quote) | M-24-08 §III.E, §III.C |
| 47 | Documented processes for 508 in acquisition through maintenance; conformance testing; issues and complaints | M-24-08 | verified | M-24-08 §III.A |
| 48 | CIO leads and appoints the program manager; product managers; IT program and project managers; COR verifies deliverables | M-24-08 | verified | M-24-08 §III.A, Appendix A |
| 49 | Life-cycle table: tasks, evidence, sign-offs | Gate table | restated-as-design (stages follow M-24-08 §III.C and §III.E) | — |
| 50 | Automated with targeted manual testing, quote; "highly context-dependent"; "Automated testing cannot evaluate ...," quote | Testing | verified (quote) | M-24-08 §III.E and fn 31 |
| 51 | Trusted Tester process as manual validation; sampling when resources are short; testers have participated in certified training | Testing | verified | M-24-08 §III.E, §III.F |
| 52 | Prioritization criteria for employee-facing ICT | Testing | verified | M-24-08 §III.E |
| 53 | Automation at Gate 3, manual at Gate 4, full manual test before first release | Testing | restated-as-design | — |
| 54 | Learn's accessible MFA page lists Authenticator (quote), text and voice, FIDO2, Windows Hello for Business, email | Sign-in | verified (quote) | Learn |
| 55 | Text, voice and email codes aren't phishing-resistant; staff must use phishing-resistant authentication | Sign-in | settled fact in Book 16 Ch 07 and Book 15 Ch 03 (SP 800-63B-4); linked, not re-cited | Book 16; Book 15 |
| 56 | TAP lifetime 10 min–30 days, default 1 hour, one-time or multi-use; one-time registration within 10 minutes; quote that the limit doesn't apply to multi-use | Sign-in | verified (quote) | Learn TAP |
| 57 | Multi-use pass sized to the user, inside the CISO's ladder | Sign-in | restated-as-design | — |
| 58 | Branding elements (background, logos, page text, username hint, SSPR link); custom CSS retirement dates | Sign-in | verified | Learn branding; CSS reference |
| 59 | External ID user flows: attributes, required, order, labels, input types; language customization overrides page and error strings | Sign-in | verified | Learn External ID pages |
| 60 | Learn makes no conformance claim for the hosted pages | Sign-in | verified as far as checked: none of the pages opened states a WCAG level for the Entra sign-in pages | Learn |
| 61 | Microsoft publishes ACRs; its Section 508 offering lists "Office 365 and Microsoft Entra sign-in" in scope | Sign-in | verified (quote) | Learn compliance offering |
| 62 | 3.3.8 text, quote; device or OS authentication isn't a cognitive function test; blocking password managers or paste fails | Sign-in | verified (quote) | W3C Understanding 3.3.8 |
| 63 | WCAG 2.0 1.1.1 CAPTCHA alternative forms, quote | Sign-in | verified (quote) | WCAG 2.0 |
| 64 | Forms table: SC numbers, names, levels and gists of 1.3.1, 3.3.2, 3.3.1 (quote), 3.3.3, 3.3.4 (scope), 2.2.1, 4.1.2, 1.4.1; 1.4.4 at 200 percent | Forms; gate table | verified | WCAG 2.0 |
| 65 | Design-rule column | Forms | restated-as-design | — |
| 66 | 3.3.7 Redundant Entry gist | Forms | verified | WCAG 2.2 |
| 67 | FAR 11.002(f) and 39.203 per M-24-08; validate vendor documentation before purchase and after changes; ACR definition; VPAT "a commonly used industry template," quote | Buying | verified (quote) | M-24-08 §III.B, fn 21 |
| 68 | "Partially Supports" means does not conform; "Not Evaluated" quote; buyers should validate where possible | Buying | verified (quote) | Section508.gov understand-claims |
| 69 | ACR design (version and edition, own test, contract terms, filing) | Buying | restated-as-design | — |
| 70 | Book 15 Ch 06 asks for the ACR at SaaS intake | Buying | settled fact per the crosswalk's October 23 additions; linked | Crosswalk |
| 71 | General exceptions E202.2–E202.5 | Exceptions | verified | Revised 508 Standards |
| 72 | E202.6 quotes; E202.6.1 "significant difficulty or expense ..." quote; E202.6.2 documentation "why and to what extent," quote; E202.6.3 alternative means, quote | Exceptions | verified (quote) | Revised 508 Standards |
| 73 | E202.7 best meets, "not commercially available"; E202.7.1 documentation incl. market research, quote; alternative means | Exceptions | verified (quote) | Revised 508 Standards |
| 74 | Exception record contents; no exception without an alternative means and an end date at Gate 4 | Exceptions | restated-as-design | — |
| 75 | M-24-08 asks for a plan for risk assessments and documentation of non-conforming ICT | Exceptions | verified | M-24-08 §III.B |

### Not verified or not carried

- No percentage of failures that automated tools catch is given: no primary source opened on November 2, 2026 states one, so the chapter says only that tools find part of them, in M-24-08's terms.
- The Trusted Tester program's own site wasn't opened; the chapter names the process only as M-24-08 does.
- Microsoft's current ACR for Entra sign-in wasn't read (the reports are on microsoft.com, outside Learn), so the chapter makes no claim about its contents or WCAG version.

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language): the page now says what the mechanism supports or provides evidence for, not that it satisfies a control or requirement. No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| A control an application inherits from the platform is satisfied only if the platform's implementation is a... | A control an application inherits from the platform rests on the platform's implementation, so it holds onl... | no source change |
