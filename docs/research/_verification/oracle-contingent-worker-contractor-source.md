# Verification — Contractors as Oracle Contingent Workers (research)

File: `docs/research/oracle-contingent-worker-contractor-source.md`
Verified: 2026-10-29

Method:
- Oracle and Microsoft pages were fetched on 2026-10-29. The load-bearing Oracle, Microsoft and SailPoint quotes were re-checked against the raw HTML: Work Relationships, Worker Types, Person Types, Assignments, the Oracle HCM provisioning tutorial and the NERM profile-management source.
- The memo, solicitation Amendment 4, both Q&A sets, the pricing spreadsheet and Oracle's Fusion Service Descriptions were downloaded, and their full text was extracted and searched. The memo's two image-only appendices were checked visually.
- SORNs were read in Federal Register full text. PIAs, IG reports, FIPS 201-3, SP 800-79-2, M-19-17, M-05-24, FICAM pages, FAR, FPDS help and the USAspending dictionary were read in the downloaded or loaded document.
- Absence claims ("doesn't appear") rest on full-text search of the extracted text.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **not verified** (listed under "What couldn't be verified" and not stated as fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Contingent worker = "A nonemployee, for example, contract worker or temporary worker"; employee, nonworker and pending worker definitions | Part 1 table | verified (raw HTML) | cw-ora-wr |
| 2 | WorkerType E/C/P/N in REST | Part 1 | verified | cw-ora-rest |
| 3 | System person types fixed; user person types configurable | Part 1 | verified (raw HTML) | cw-ora-pt |
| 4 | Don't mix the four person types in one person security profile | Part 1 | verified (raw HTML) | cw-ora-pt |
| 5 | Assignments expose SystemPersonType and UserPersonType | Part 1 | verified | cw-ora-rest-asg |
| 6 | Feed samples use EMP and PWK | Part 1 | verified (carried from the HCM implementation guide's check of 2026-10-25) | cw-ora-ems |
| 7 | Multiple work relationships of multiple types at once | Part 1 | verified (raw HTML) | cw-ora-wt |
| 8 | Only one primary work relationship; the primary's worker type applies | Part 1 | verified (raw HTML) | cw-ora-wr, cw-ora-wt |
| 9 | Assignment numbers prefixed E, C, N, P | Part 1 | verified | cw-ora-asg |
| 10 | Same assignment resource: department, job, position, location, managers, business unit, projected dates | Part 1 | verified | cw-ora-rest-asg, cw-ora-create |
| 11 | Redwood Add a Contingent Worker carries all Hire an Employee attributes | Part 1 | verified | cw-ora-24a |
| 12 | REST create with WorkerType "C" | Part 1 table | verified | cw-ora-create |
| 13 | HDL: worker type C, ADD_CWK_WORK_RELATION, VendorId, VendorSiteId, ProjectedStartDate, ProjectedEndDate | Part 1 table | verified (METADATA lines) | cw-ora-hdl |
| 14 | Attribute names PoHeaderId, PoLineId, VendorSiteCode, ProjectedAssignmentEnd | — | not verified; **not used** on the page | — |
| 15 | Renew Contingent Worker and Add Contingent Work Relationship are named actions | Part 1 table | verified (named only) | cw-ora-convert |
| 16 | 26B Change Worker Type: conversions both ways; no terminate-and-recreate; no legal employer change; cancel reactivates | Part 1 | verified | cw-ora-cwt |
| 17 | No Fusion page for Procurement → contingent worker; PO linkage documented only for E-Business Suite | Part 1, What couldn't be verified | verified as a search result (absence); the EBS page cited only to locate the linkage | cw-ora-ebs |
| 18 | Projected end date "for information purposes only and have no effect on application processing" | Findings, Part 1 | verified (raw HTML) | cw-ora-asg |
| 19 | Termination via HDL flag + ActualTerminationDate; assignments inactive; supervisor relationship end-dated | Part 1 | verified | cw-ora-hdl-term |
| 20 | Pipeline, not Oracle, must enforce the end date | Findings | inference (labelled) | — |
| 21 | No Oracle statement of employee-only modules; payment methods extended to contingent workers in 25A | Part 1 | verified (25A); absence noted | cw-ora-25a |
| 22 | Feeds triggered only for employee, contingent worker and pending worker | Part 1 | verified | cw-ora-feeds, cw-ora-ems |
| 23 | Termination context PeriodType, WorkerType, conditional ActualTerminationDate; appears on the effective date | Part 1 | verified | cw-ora-ems |
| 24 | empassignment needs the period-of-service ID for CWKAssignmentDEO | Part 1 | verified | cw-ora-ems |
| 25 | PERIOD_TYPE E/C/N | Part 1 | verified (attribute page; table page didn't load) | cw-ora-pos |
| 26 | Person number kept through conversion | Part 1 | inference (labelled); implied by the pending-worker example | cw-ora-ems, cw-ora-cwt |
| 27 | MS tutorial: no contingent-worker text; scoping filters to skip irrelevant records; mover "full-time to contractor or vice-versa" | Part 1 | verified (raw HTML) | cw-ms-tut |
| 28 | MS tutorial sample maps userType from WorkerType | Findings, Part 1 | verified (raw HTML) | cw-ms-tut |
| 29 | Member = employee "in the organization's payroll"; move internal non-employees to B2B guest | Part 1 | verified | cw-ms-b2b |
| 30 | employeeType "Employee, Contractor, Consultant, or Vendor" | Findings | verified | cw-ms-user |
| 31 | userType mapping is a trap; keep contractors as members on purpose | Findings, Part 1 | inference and design (labelled) | — |
| 32 | Three separate provisioning apps, one per identity type | Part 1 | verified | cw-ms-faq |
| 33 | Separate app to set only the manager of contractors reporting to employees | Part 1 | verified | cw-ms-plan |
| 34 | LCW scope supports employeeType eq/ne/in; leaver templates on employeeLeaveDateTime | Part 1, Part 6 | verified | cw-ms-lcw-rule, cw-ms-lcw-tmpl |
| 35 | Memo: military and IC excluded initially; employee functions; no "contractor", "contingent", "non-employee" | Part 2 | verified (full text + appendix images) | cw-memo |
| 36 | PWS §2: "system of record for approximately 2 million Executive Branch civilian employees"; USPS and IC excluded | Part 2 | verified | cw-pws-scope |
| 37 | No "contingent", "non-employee", "worker type", "volunteer" in Amd 4 and Q&A | Findings | verified (full-text search) | cw-pws-scope, cw-qa1 |
| 38 | Q&A: "2 million employee licenses"; user roles list | Part 2 | verified | cw-qa1 |
| 39 | OPM award release: "approximately two million US Executive Branch civilian employees" | Part 2 | verified | cw-opm-award |
| 40 | "affiliate type" in Req. 21 (p. 61, also p. 64), undefined | Part 2 | verified | cw-pws-affiliate |
| 41 | Wave 1 FY2026, Wave 2 FY2027, adoption by FY2028; go-live intent July 4, 2027 | Part 2 | verified; agency wave lists deliberately not reproduced | cw-memo, cw-pws-config |
| 42 | Agencies pause own Core HCM; exceptions from OMB and OPM Directors | Part 2 | verified | cw-memo |
| 43 | Agency configuration in scope; extensions are configuration; common federal baseline | Part 2 | verified | cw-pws-config |
| 44 | Contractors in the shared instance would be a baseline change needing program agreement | Part 2 | inference (labelled) | — |
| 45 | Steering Committee approves agency integrations | Part 2 | verified (carried from the HCM implementation guide's 2026-10-25 check; linked, not footnoted) | he-pws-appb |
| 46 | CLIN 0003 "Licensing and Sustainment for 2 million employees", PEPY; "licenses for all users", all-inclusive | Part 2 | verified | cw-pws-clin |
| 47 | Hosted Employee includes agents, contractors and consultants tracked by the programs; counted by headcount; HCM Base B85800 | Findings, Part 2 | verified (PDF text, p. 19, p. 94) | cw-ora-sd |
| 48 | No separate contingent-worker metric | Part 2 | verified (glossary and price list search) | cw-ora-sd |
| 49 | Whether OPM's contract overrides the Hosted Employee metric | Part 2 | not verified (contract not public); stated as an open question | — |
| 50 | OPM/GOVT-1: contract employees "may also be covered"; 2023 notice changed routine uses only | Part 2 | verified | cw-govt1, cw-govt1-2023 |
| 51 | GSA/GOVT-7 covers employees, contractors, consultants, volunteers | Part 2 | verified | cw-govt7 |
| 52 | No Core HCM SORN or PIA found; PIA is a deliverable | Part 2 | verified (search, as of 2026-10-29); PWS 5.1(7) verified | cw-pws-pia |
| 53 | A-108 significant change when access substantially increases; contractor-operated system deemed agency-maintained | Part 2 | verified (§6); application to contractors labelled inference | cw-a108 |
| 54 | DOIAccess "authoritative data source for DOI contractor personnel"; sponsors; COR data from the financial system; separation and invalid-sponsor reports | Part 3 | verified (PIA text) | cw-doi-access |
| 55 | GCIMS "An authoritative source of identities for Active Directory, Google mail, and other GSA systems"; contract start and end dates; HR feed departing employees only; twice-yearly reverification | Part 3 | verified (PIA text); PIA approval expired 2026-01-11, noted in the footnote by its approval date | cw-gsa-gcims |
| 56 | GCIMS sponsor role | — | not verified (non-.gov source); **not used** | — |
| 57 | NASA IdMAX: Human Capital authoritative for civil servants; affiliation includes contractor | Part 3 | verified; "contractors by implication" labelled | cw-nasa-idmax |
| 58 | DHS PIV/IDMS: provisioning and de-provisioning on card status | Part 3, Part 5 | verified (PIA text, dated Oct 20, 2015; file name says 2018) | cw-dhs-idms |
| 59 | USAccess: "Initial information regarding a PIV applicant is provided through an agency sponsor"; record for a contractor's assignment | Part 3, Part 5 | verified (FHFA-hosted copy of the GSA PIA) | cw-usaccess |
| 60 | No agency uses FPDS/SAM directly as an identity authority | Part 3 | verified as a search result (absence) | — |
| 61 | IRS: Contractor Management and Contingent Worker modules in Treasury's HR system; COR initiates separation | Part 3 | verified (TIGTA background) | cw-tigta |
| 62 | DOE MyIdentity "is not the authoritative source for the privacy data" | Part 3 | verified | cw-doe-saviynt |
| 63 | NERM "an authoritative source of your non-employee identity data"; sponsor; time-bound assignments | Part 3 | verified (raw HTML for the source page; glossary via fetch) | cw-nerm |
| 64 | No agency source documents a federal NERM deployment | Part 3 | verified as a search result (absence) | — |
| 65 | EPA ePACS: HR, COR, grant or project officer initiates the badge request | Part 3, Part 5 | verified | cw-epa-epacs |
| 66 | NIH NED | — | not verified (HTTP 403); **not used** | — |
| 67 | TIGTA: 1,821 (10 percent) should have been separated; some still had network access | Part 3 | verified | cw-tigta |
| 68 | DOT OIG ZA2023030 quote | Part 3 | verified (oversight.gov summary); counts from secondary sources not used | cw-dot-oig |
| 69 | DHS OIG-23-04 quote | Part 3 | verified (summary); figures not used | cw-dhs-oig-23 |
| 70 | DOE-OIG-21-12: 39 percent not updated | Part 3 | verified (PDF) | cw-doe-oig |
| 71 | DHS OIG-26-28: 15 percent of contractor accounts not disabled in time | Part 3 | verified (summary) | cw-dhs-oig-26 |
| 72 | HR-module pattern failed the same way; control is comparison against an ongoing contract | Part 3 | inference (labelled) | cw-tigta |
| 73 | AC-2(h), (l) and PS-7(d) text | Part 3 | verified (OSCAL catalog 5.2.0) | cw-sp80053 |
| 74 | FIPS 201-3 §2.1 "proper authority"; §2.9.4 contractor trigger and 18 hours; §2.9.1 new FASC-N and UUID on reissue | Parts 3–5 | verified | cw-fips201 |
| 75 | SP 800-79-2 §2.3 sponsorship and adjudication can't be outsourced | Part 3 | verified | cw-sp80079 |
| 76 | FAR 4.1301(c) designated official; 52.204-9(b) return upon contract completion or termination | Part 3, Part 5 | verified (acquisition.gov, 2026-10-29); FAR overhaul effect not checked | cw-far41301, cw-far52049 |
| 77 | M-19-17 quotes | Part 3 | verified | cw-m1917 |
| 78 | FICAM ILM playbook v1.4: HR "sole driver"; silent on contractors outside HR | Findings, Part 3 | verified (quote); silence is a search result | cw-ilm |
| 79 | FICAM Architecture v3.3 services | Part 3 | verified | cw-arch |
| 80 | FPDS start, current completion and ultimate completion definitions | Part 3 | verified | cw-fpds |
| 81 | USAspending mapping; "does not change to reflect a closeout date" | Part 3 | verified | cw-usasp |
| 82 | Contract dates are a ceiling, not the end date | Part 3 | inference and design (labelled) | — |
| 83 | Options tables (Part 4) | Part 4 | design, built on claims 1–82; cited cells verified as above | — |
| 84 | Contractor PIV path: three links | Part 5 | design (labelled), grounded in 58, 59, 65, 70, 73–76 | — |
| 85 | Recommendation, phases, source swap, mapping, decisions | Part 6 | design (labelled) | — |
| 86 | Book 04 Internals persona is extensionAttribute11 in {EMP, CTR} | Part 6 | verified (Book 04 Ch03) | internal |

## Not carried

- The wave lists in the memo's Appendix A name agencies. Only the wave years are given, so the page names no agency outside its cited sources.
- Facts from press or secondary sources weren't used: DOT and DHS OIG counts, and the GCIMS sponsor role.
