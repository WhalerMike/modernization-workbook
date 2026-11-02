# Verification — 14-privacy-for-workforce-identity.md

New chapter, written November 2, 2026. There is no source page; it builds on the privacy material already in Chapter 04 (disclosure basis), Chapter 06 (the contractor register's privacy basis), Chapter 07 (the privacy office) and Appendix B (the data-flow assessment), and doesn't repeat Appendix B's leg-by-leg protections. Every source below was opened on November 2, 2026. Federal Register document pages were read through govinfo.gov and the Federal Register API (document search for "OPM/GOVT-1" and "GSA/GOVT-7"), not federalregister.gov's HTML pages. The OMB circulars were read from their PDFs, and the SP 800-53 and 800-53B facts from NIST's OSCAL Release 5.2.0 catalog and baseline profiles.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PII defined as information that can distinguish or trace identity alone or combined with linked or linkable information | Which identity data is PII | verified (quoted) | A-130 §10, definition 57 |
| 2 | The identity-data table: which data is PII and why | Which identity data is PII | restated-as-design (applies the A-130 definition; the classification is the program's) | — |
| 3 | System of records: retrieved by name or other identifier | Is the flow covered | verified | 5 U.S.C. §552a(a)(5) |
| 4 | OPM/GOVT-1 covers current and former federal employees; volunteers, grantees and contract employees "may also be covered"; categories include identifying information and OPM's Guide to Data Standards | Is the flow covered | verified (2012 full text) | 77 FR 73694 (Dec 11, 2012) |
| 5 | Records on current employees are located within the employing agency; access, amendment and disclosure delegated to the employing agency | Is the flow covered | verified | 88 FR 56058 (Aug 17, 2023), system location and system manager |
| 6 | GOVT-1 modified August 2023; routine use proposed May 12, 2026, effective June 12, 2026 | Is the flow covered | verified | 88 FR 56058; 91 FR 25937; Federal Register API search for OPM notices citing GOVT-1 (latest OPM notice modifying GOVT-1 is May 12, 2026) |
| 7 | GSA/GOVT-7, HSPD-12 USAccess, covers participating agencies' employees, contractors and others needing long-term access; purposes include logical access | Is the flow covered | verified; limited in the text to agencies that use the shared PIV service | 80 FR 64416 (Oct 23, 2015) |
| 8 | A government-wide SORN binds every agency holding the records, including access and amendment; no duplicate SORN without OMB approval | Is the flow covered | verified | A-108 §6.i |
| 9 | Significant changes include expanded categories of records, combined systems, configuration or access-control changes that substantially increase access, new or expanded routine uses | Open coverage questions table | verified | A-108 §6.b(2), (3), (7), (8) |
| 10 | Whether the directory falls within an existing SORN, which SORN covers contractors | Open coverage questions table | restated-as-design (questions for the privacy office; no answer asserted) | — |
| 11 | New or modified routine use: at least 30 days after Federal Register publication | Is the flow covered; Disclosures | verified | 5 U.S.C. §552a(e)(11); A-108 §6.e, §6.k |
| 12 | §208: PIA before developing or procuring IT that collects, maintains or disseminates identifiable information; CIO or equivalent review; publish if practicable | When a PIA is required | verified | Pub. L. 107-347 §208(b)(1)(A)–(B) |
| 13 | M-03-22 applies PIAs to information about the public; no PIA required for systems with only government personnel and contractors, but OMB "encourages" PIAs for them | When a PIA is required | verified (quoted note 6) | M-03-22 §II.B.3.a and note 6 |
| 14 | A-130 directs a PIA when IT processes PII, absent a §208 exception | When a PIA is required | verified | A-130 Appendix II §5.e |
| 15 | RA-8 is in the privacy baseline, applied at every impact level | When a PIA is required | verified | SP 800-53B abstract; OSCAL privacy baseline profile 5.2.0 |
| 16 | Guest accounts mean the directory holds information about people outside government; program treats the PIA as required | When a PIA is required | restated-as-design | — |
| 17 | M-03-22 §II.B.2 update triggers (merging, internal flow, alteration in character, system management changes, interagency uses, commercial sources, conversions) | Triggers table | verified (names and meanings); the identity-event column is restated-as-design | M-03-22 §II.B.2 |
| 18 | PIA contents and the reviewing official (not the procuring official or the author) | When a PIA is required | verified | M-03-22 §II.C.1.a, §II.C.3.a |
| 19 | Privacy Act "relevant and necessary" | Minimization | verified (quoted) | 5 U.S.C. §552a(e)(1) |
| 20 | FIPPs: Minimization; Purpose Specification and Use Limitation; Access and Amendment | Minimization; Correction | verified | A-130 Appendix II §3 |
| 21 | A-130 inventory of systems that process PII, to reduce PII "to the minimum necessary" | Minimization | verified (quoted) | A-130 §5.a(1)(a)(ii) |
| 22 | Control titles SI-12(1), SA-8(33), PT-3, PM-5(1), SI-12(2), PM-25 | Minimization | verified | OSCAL catalog 5.2.0 |
| 23 | Attribute purpose register, its three rules, synthetic test data on contoso.example | Minimization | restated-as-design | — |
| 24 | Contractor-operated system: agency applies the Act's requirements | Disclosures | verified | 5 U.S.C. §552a(m)(1) |
| 25 | A-108: contractor-operated system deemed maintained by the agency; SORN, routine use for disclosure to the contractor, enforceable clauses; SAOP reviews and approves PII contracts before award | Disclosures; SAOP | verified | A-108 §6.j |
| 26 | Routine use: disclosure outside the maintaining agency, compatible purpose, published | Disclosures | verified | A-108 §6.k; 5 U.S.C. §552a(a)(7), (b)(3) |
| 27 | GOVT-1 (2012 text) routine use jj: disclosure to contractors, grantees or volunteers working for the federal government | Disclosures | verified; text says the current notice must be checked, since later notices modify the routine uses | 77 FR 73694 |
| 28 | A-130: privacy program responsible for contractors and third parties processing PII on the agency's behalf | Disclosures | verified | A-130 Appendix II §5.d |
| 29 | Cloud directory, middleware hosting and SCIM-provisioned SaaS "usually" in the contractor-operated category | Disclosures | restated-as-design (the privacy office decides) | — |
| 30 | Integration register; `lms.contoso.example` example | Disclosures | restated-as-design (fictional) | — |
| 31 | Accounting: date, nature, purpose, recipient name and address; five years or life of record; available on request; (b)(1) and (b)(2) exempt; correction notice to recipients | Accounting; Correction | verified | 5 U.S.C. §552a(c)(1)–(4) |
| 32 | PM-21 Accounting of Disclosures in the privacy baseline | Accounting | verified | OSCAL catalog and privacy profile 5.2.0 |
| 33 | Entra ID audit and sign-in logs kept 7 days (Free) and 30 days (P1/P2) | Accounting | verified | Microsoft Learn, Microsoft Entra data retention |
| 34 | Accounting generated from provisioning events | Accounting | restated-as-design | — |
| 35 | Amendment: acknowledge within 10 working days; correct or refuse; review of refusal within 30 working days | Correction | verified | 5 U.S.C. §552a(d)(2)–(3) |
| 36 | Accuracy, relevance, timeliness and completeness for fairness | Correction | verified | 5 U.S.C. §552a(e)(5) |
| 37 | GOVT-1: current employees contact their current agency to amend records | Correction | verified | 77 FR 73694, contesting record procedure |
| 38 | SI-18 and SI-18(4) in the privacy baseline | Correction | verified | OSCAL privacy profile 5.2.0 |
| 39 | Five-step correction example | Correction | restated-as-design (fictional) | — |
| 40 | The Act's own retention rule is for the accounting | Retention | verified | 5 U.S.C. §552a(c)(2) |
| 41 | GOVT-1 retention: OPF for the period of service; other records under NARA schedules | Retention | verified | 77 FR 73694, retention and disposal |
| 42 | GRS 3.2 items 030 and 031 | Retention | verified | NARA GRS 3.2, Transmittal 33 |
| 43 | SAOP: designation, agency-wide accountability, central policy role, review "at the earliest planning and development stages" | SAOP | verified | A-130 Appendix II §4 |
| 44 | SAOP reviews and approves categorization of PII systems, designates privacy control types, assesses privacy controls before operation; reviews the authorization package; AO must consider the SAOP's input | SAOP | verified | A-130 Appendix II §5.i; Appendix I §5.f |
| 45 | The four things the SAOP signs for this book | SAOP | restated-as-design | — |
| 46 | No PT control in the Moderate baseline; PT is in the privacy baseline, applied irrespective of impact level | NIST SP 800-53 | verified | SP 800-53B abstract; OSCAL MODERATE profile (287 entries, no `pt-`); OSCAL PRIVACY profile |
| 47 | Privacy baseline: 96 controls and enhancements, 43 also in Moderate, 53 only in the privacy baseline; examples on each side | NIST SP 800-53 | verified (computed from the two OSCAL 5.2.0 profiles) | OSCAL profiles, last-modified 2026-10-22 |
| 48 | PT base controls PT-1 to PT-8 plus PT-5(2), PT-6(1), PT-6(2), PT-7(1), PT-7(2) are in the privacy baseline | PT table | verified | OSCAL PRIVACY profile 5.2.0 |
| 49 | Book 14, Chapter 03 says the privacy baseline has "PT-1 to PT-5 and PT-7" | NIST SP 800-53 | verified as an incomplete statement in Book 14 Ch 03 line 57 (PT-6 and PT-8 are also in the profile); noted here, Book 14 not edited | OSCAL PRIVACY profile 5.2.0 |
| 50 | "What the identity engineer does" column of the PT table | PT table | restated-as-design | — |
| 51 | NIST Privacy Framework v1.0, January 16, 2020; five Functions; voluntary; v1.1 is an initial public draft | NIST SP 800-53 | verified | NIST CSWP 01162020; nist.gov/privacy-framework |
| 52 | Mapping of the chapter's registers to Privacy Framework Functions | NIST SP 800-53 | restated-as-design (marked as the program's suggestion) | — |
| 53 | The checklist and its owners | The privacy checklist | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| — (new chapter) | — | No source page. Diagram: none yet. The diagram renderer's toolchain (Graphviz, rsvg-convert, the house fonts) wasn't available in the authoring environment, and a reference to an unrendered SVG would break the page, so the chapter uses tables instead. A source can be added and rendered in a follow-up. |

## Other files changed with this chapter

| File | Change |
|---|---|
| `index.md` | Description and status callout mention Chapter 14; How row lists 14; per-chapter download link for 14 |
| `13-reference-deployment.md` | "Continue the book" Next now points to Chapter 14 |
| `appendix-a-lifecycle-rules.md` | "Continue the book" Previous now points to Chapter 14 |
| `07-who-owns-workforce-identity.md` | One sentence at the end of "The privacy office" pointing to Chapter 14 (no new claim) |
| `_BRIEF.md` | Chapter list row for 14 |
| `scripts/bundles.yml` | Per-chapter Word download `b03-hr-identity-14.docx` (the book bundle already picks the chapter up by its glob) |
