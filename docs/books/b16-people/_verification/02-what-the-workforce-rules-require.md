# Verification — Chapter 02, What Federal Workforce Rules Require

Writer W1. No source pages: new research from primary sources, opened October 22, 2026. Federal PDFs and data files downloaded with curl (generic user agent, no identifying headers) into a scratch folder and read as extracted text (pypdf) or parsed locally (JSON, eCFR XML, govinfo HTML). Web pages read with WebFetch. No personal data sent to any site.

Notes on access:

- **eCFR**: the human page redirected to a bot-check; the eCFR versioner API (`/api/versioner/v1/full/2026-10-01/title-5.xml?part=930&subpart=C`) returned the official text.
- **DoD issuances**: `www.esd.whs.mil` and `public.cyber.mil` did not resolve from this machine (DNS failure); `dodcio.defense.gov` returned 403. DoDD 8140.01 and DoDM 8140.03 were read from the Internet Archive's copies of the official esd.whs.mil URLs (`web.archive.org/web/2026id_/…`). Both footnotes cite the official URL and say so. The editor may want to re-check both PDFs on esd.whs.mil for any later change notice.
- **NICE current-versions page date**: the page reads "CURRENT VERSION: 2.2.0 (April 28, 2025)"; NIST's news release, the v2.2.0 summary of changes and the change log all date v2.2.0 to April 28, 2026. The chapter uses 2026 and doesn't repeat the page's date.
- **NICE v2.2.0 summary**: its first page says v2.2.0 "replaces v2.0.0 as the authoritative catalog"; the change log calls it a minor update after v2.1.0. The chapter says only that v2.2.0 is current and a minor update.
- **Counts** in the NICE paragraph were made by parsing NIST's v2.2.0 JSON file (`documents[0].version = "2.2.0"`): 5 category, 42 work_role, 11 competency_area, 962 task, 693 knowledge, 556 skill, 40 opm_code elements; work-role-to-code relationships via `relationships` (type "projection").

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FISMA (a)(4): trained personnel sufficient to assist in complying | FISMA | verified | 44 U.S.C. § 3554 (Cornell) |
| 2 | FISMA (a)(3): delegation to CIO; (a)(3)(D) training and overseeing personnel with significant responsibilities | FISMA; owners table | verified | Same |
| 3 | FISMA (a)(3)(A)(ii): SAISO "possess professional qualifications, including training and experience…" | FISMA; owners table | verified | Same |
| 4 | FISMA (b)(4): awareness training for personnel "including contractors and other users" | FISMA | verified | Same |
| 5 | "Sufficient" measured against changed work; help desk/HR taking on security responsibilities are training-plan findings | FISMA | restated-as-design | — |
| 6 | 5 CFR 930.301: plan; identify employees with significant responsibilities; role-specific training per NIST | OPM's rule | verified | eCFR versioner, subpart C, as of 2026-10-01 |
| 7 | 930.301(a)(1)–(5) audiences and training content (quotes: "employees, contractors, students, guest researchers, visitors"; "e.g., system and network administrators, and system/application security officers") | OPM audience table | verified | Same |
| 8 | Mapping of 930.301 audiences to workbook roles (right-hand column) | Same | restated-as-design | Labeled "the program's mapping, not OPM's" |
| 9 | 930.301(b) before access; (c) refresher frequency agency-set by sensitivity; (d) significant change / new position (quoted) | OPM's rule; what the rules don't require | verified | Same |
| 10 | 930.301 dates from June 14, 2004 (69 FR 32836); authority 5 U.S.C. 4118, Pub. L. 107-347; stale NIST URL in text | OPM's rule | verified | eCFR subpart C header and text; Book 14 Ch09 settled fact (never amended) |
| 11 | A-130 App. I §4.h items (mandatory programs; test knowledge level; role-based before access) | A-130 | verified | A-130 PDF |
| 12 | A-130 §5.c(1): CHCO, CIO, CAO and SAOP develop competency requirements for information resources staff (quoted) and maintain workforce planning (three purposes, "in a rapidly developing IT environment") | A-130; owners table | verified | A-130 PDF, Main Body §5.c |
| 13 | A-130 §5.c(2) "the appropriate knowledge and skills"; evaluate executive-level workforce; §5.c(3) "track performance of workforce development training, including cross-functional training, rotational development and assignments" | A-130 | verified | Same |
| 14 | A-130 §5.c(6): SAOP involved in privacy hiring, training, professional development | A-130; owners table | verified | Same |
| 15 | A-130 §6.g: OPM analyzes IT workforce needs, identifies training needs, oversees curricula, assesses IT training | A-130; owners table | verified | A-130 PDF, §6.g |
| 16 | Competency requirements as joint HR/CIO job; modernization's new competencies feed workforce plan | A-130 | restated-as-design | — |
| 17 | 15 U.S.C. 7443(a): NIST coordinates national cybersecurity awareness and education program, incl. items (6) skill gaps, (7) "cybersecurity education, training, and workforce development", (10) forecast federal workforce needs | NICE | verified | 15 U.S.C. § 7443 (Cornell); 15 U.S.C. 7451 is a "Transferred" stub pointing here |
| 18 | The Act ties coding to the NICE initiative by name (definition, § 302(3)) | NICE | verified | Pub. L. 114-113 div. N title III § 302(3), § 303(a)(2) |
| 19 | SP 800-181 Rev. 1, November 2020, final, supersedes SP 800-181 (2017) | NICE | verified | CSRC publication page |
| 20 | Rev. 1 deprecated categories/specialty areas; skill and ability merged into skill; lists moved to separately maintained artifacts | NICE | verified | SP 800-181r1 PDF, Section 1 summary of changes |
| 21 | Tasks describe the work; K&S describe the learner; competencies assessable via tests, labs, interviews; work roles = grouping of work someone is responsible for; "Work Role names are not synonymous with job titles"; not occupations | NICE | verified | SP 800-181r1 §§2.1, 3.3, 3.4 |
| 22 | Components maintained in the NICE Framework Resource Center | NICE | verified | CSRC page planning note (June 26, 2025); current-versions page |
| 23 | Current components v2.2.0, April 28, 2026 | NICE | verified | NIST news release; v2.2.0 summary; change log (see date note above) |
| 24 | v2.2.0 counts: 5 categories, 42 work roles, 11 competency areas, 962 tasks, 693 knowledge, 556 skills; five category names | NICE | verified | v2.2.0 JSON, parsed |
| 25 | v2.0.0, March 5, 2025, major update; removed Cyberspace Effects and Cyberspace Intelligence, maintained in DoD's DCWF; titles 10 and 50; NICE intended for broad use | NICE; DoD contrast | verified | v2.0.0 Summary of Changes PDF; change log |
| 26 | v2.1.0, December 3, 2025: Cybercrime Investigation revised, AI Security competency updated | NICE | verified | Change log |
| 27 | v2.2.0: added C-SCRM work role OG-WRL-017; Cryptography (NF-COM-006) and DevSecOps (NF-COM-008) competency areas updated with K&S statements; minor update | NICE | verified | v2.2.0 summary PDF; news release said "added" competency areas — summary PDF says "Updated"; chapter follows the PDF ("published knowledge and skill statements for") |
| 28 | Current-versions page lists companion resources (CSF crosswalk) against earlier versions | NICE | verified | Current-versions page (crosswalk v2.0.0; translations v1.0.0) |
| 29 | Record the components version used for curriculum mapping | NICE | restated-as-design | — |
| 30 | Work role identifiers and OPM codes in the mapping table | Work roles table | verified | v2.2.0 JSON relationships (e.g., IO-WRL-005→451, OG-WRL-014→722, OG-WRL-013→611, PD-WRL-001→511) |
| 31 | Mapping of workbook roles to NICE work roles | Work roles table | restated-as-design | Labeled program design |
| 32 | OG-WRL-017, DD-WRL-009 and PD-WRL-005 have no OPM code in v2.2.0 | Work roles | verified | v2.2.0 JSON (no work_role→opm_code relationship for those three) |
| 33 | SP 800-50r1: NICE identifies K&S for tasks of work roles for staff needing additional training; NICE as complementary tool for identifying who needs more training; SP 800-16 content moved into SP 800-50r1 or SP 800-181r1 | Work roles | verified | SP 800-50r1 PDF, Introduction and §1.6 |
| 34 | The Act: Title III of Division N, Pub. L. 114-113, December 18, 2015, 129 Stat. 2975–2977; 5 U.S.C. 301 note | The Act | verified | govinfo PLAW-114publ113 HTML; Cornell 5 U.S.C. 301 note |
| 35 | § 303(a) identify positions "that require the performance of cybersecurity or other cyber-related functions" and assign codes | The Act | verified | Same |
| 36 | § 303(b)(1)(A) OPM with NIST, 180 days; (B) civilian procedures, 9 months; (C) DoD noncivilian, 18 months | The Act | verified | Same |
| 37 | § 303(b)(1)(D) baseline report: % holding appropriate certifications; readiness of others; mitigation strategy | The Act; what the rules don't require | verified | Same |
| 38 | § 303(b)(1)(E) agency procedures within 3 months; (b)(2) assignment within 1 year | The Act | verified | Same |
| 39 | § 304 critical need annually "through 2022"; OPM guidance on acute and emerging shortages | The Act | verified | Same; Cornell note shows the text as amended by Pub. L. 116-283 § 9401(g)(4)(A) still reads "through 2022" |
| 40 | § 305 GAO monitoring and report | The Act | verified | Same |
| 41 | Coding requirement has no end date | The Act | verified | § 303 contains no sunset (only § 304 has "through 2022") |
| 42 | OPM January 4, 2017 memo instructions (Coding Structure and Guide to Data Standards; CIO staff, managers, HR/classification partner; annotate PDs of encumbered and authorized funded vacant positions; three-digit codes replacing two-digit; beyond GS-2210 (quoted); 000 vs 100–999; up to three codes, most critical first; EHRI) | OPM implementation | verified | OPM memo PDF |
| 43 | OPM April 11, 2022 update: codes align to each NICE work role; may code to current or previous work roles "in perpetuity" (quoted); GAO directed non-000 for GS-2210, not an OPM rule | OPM implementation | verified | OPM memo PDF (sfs.opm.gov), Attachment 1 items 2–3 |
| 44 | OPM Interpretive Guidance for Cybersecurity Positions, October 2018, still the listed edition | OPM implementation | verified | OPM reference-materials page; guidance PDF cover (October 11, 2018) |
| 45 | GAO-19-144, March 12, 2019: 22 of 24 agencies; 15,779 GS-2210 positions with non-IT code (~19%); 63 of 120 sampled at six agencies mismatched; causes; weakens workforce planning data | How well it has worked | verified | GAO product page |
| 46 | Three uses of codes (roster input; link to a track; review trigger at gates) | What the program does | restated-as-design | Labeled design; "Nothing in the sources requires a review at that moment" |
| 47 | No civilian source in the chapter requires a particular certification; the Act asked for a percentage report | What the rules don't require | verified (scoped) | § 303(b)(1)(D); scoped to "the civilian sources in this chapter" — a negative claim limited to what was read |
| 48 | Only "annual" in these sources is 930.301's awareness floor | Same | verified (scoped) | 930.301(a)(1), (c); SP 800-53 frequencies are organization-defined (Book 14 Ch09 claim 20) |
| 49 | SP 800-181r1 competency examples "in part, all together, or not at all" | Same | verified | SP 800-181r1 §3.3 |
| 50 | DoDD 8140.01 effective October 5, 2020; implements §§ 303–304 of the Act; DCWF authoritative reference and foundation for baseline qualifications | DoD contrast | verified | DoDD 8140.01 PDF (Internet Archive copy of official URL) |
| 51 | DoDM 8140.03 effective February 15, 2023; applies to DoD components and personnel in DCWF-coded positions incl. service members, civilians, "personnel who provide contracted services"; contractors fully qualified; incorporates and cancels DoD 8570.01-M | DoD contrast | verified | DoDM 8140.03 PDF (Internet Archive copy), cover, §§1.1–1.2 |
| 52 | DoDM 8140.03 model: foundational (one of education, training, personnel certification; experience within limits) + residential; CPD ≥ 20 hours/year; basic/intermediate/advanced proficiency, no connection to rank or grade | DoD contrast | verified | DoDM 8140.03 §3.2, §3.3 |
| 53 | Civilian sources set no per-role qualification standard; borrow DoD's idea as design; don't cite 8140 as a civilian requirement | DoD contrast | restated-as-design (scoped) | — |
| 54 | Owners table (agency head, CIO, CHCO, SAISO, SAOP, HR/CIO staff/managers, OPM, NIST) | Who owns which part | verified | Footnoted per row |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none) — chapter is new research per the B16 brief | — | — |
