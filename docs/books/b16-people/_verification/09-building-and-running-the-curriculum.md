# Verification — Chapter 09, Building and Running the Curriculum

Writer W5. Sources: `docs/compliance/training-index.md` (2,333 words), `docs/program/education.md` (259), `docs/program/training.md` (250), and the parts of `docs/compliance/Vol_V_Book_00_Training_Certification_Overview.md` (864) that concern running the program (the rest feeds W1's Chapter 01). All primary sources opened October 21, 2026. NIST PDFs downloaded with curl (generic user agent, no identifying headers) and read as extracted text (pypdf); CFR text read from the eCFR versioner API (with compression) for 5 CFR 930.301 and part 410; SP 800-53 control text read from the release 5.2.0 OSCAL catalog; Microsoft claims from the Microsoft Learn search tool; the Revised 508 Standards read on access-board.gov. Published workbook chapters (Books 00, 01, 13, 14, 15) read for the facts they settle; nothing here contradicts them.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 5 CFR 930.301(d): training "whenever there is a significant change in the agency information system environment or procedures or when an employee enters a new position that requires additional role-specific training" | Start from the roadmap | verified | eCFR 930.301 as of 2026-10-01 |
| 2 | AT-2 a.2 and AT-3 a.2: training "when required by system changes" | Same | verified | OSCAL 5.2.0 catalog |
| 3 | SP 800-50r1 life cycle: four phases, may occur in sequence or simultaneously | Same | verified | SP 800-50r1 §1.3 |
| 4 | SP 800-50r1: one primary calendar, may be automated in an LMS, aligned with "major IT releases" | Same | verified | SP 800-50r1 §4.5 |
| 5 | Planning rule: no gate without training dates, no wave without a training window | Same | restated-as-design | — |
| 6 | Seven phases, six gates G0–G5, gate names and authorities | Phase table | verified | Book 01 Ch12 (published) |
| 7 | Who is trained in each phase and what | Phase table | restated-as-design | Roles from Book 00 Ch07, Book 01 Ch09 |
| 8 | A-130: role-based training "before authorizing access" or "performing assigned duties" | Phase 1 comment | verified | A-130 App. I §4.h item 5 |
| 9 | Book 15 Ch04 gives technicians roles that can reset credentials and issue TAPs | Phase 1 comment | verified | Book 15 Ch04 (same release) |
| 10 | No technician made eligible before training and verification check recorded | Phase 1 comment | restated-as-design | — |
| 11 | Six education ideas; education vs training distinction | Orientation | verified | Book 00 Principle 13 (published) |
| 12 | Three orientation formats (90-minute, self-serve, 45-minute auditor briefing) | Orientation | restated-as-design | Source `education.md` formats |
| 13 | User-facing wave cadence 60/45/30/15/7/1 days from Microsoft guidance | Just-in-time | verified (by link) | Book 16 Ch07 (W4), which cites Microsoft Learn |
| 14 | Training-side milestones per wave | Just-in-time table | restated-as-design | — |
| 15 | Microsoft: pilot users representing personas, not just admins; measure registration with Authentication Methods Activity; gather feedback; communications per persona group | Just-in-time | verified | Learn, "Plan a phishing-resistant passwordless authentication deployment" |
| 16 | Microsoft: as help desk ticket volume rises, "slow down the pace of your deployments, user communications, and enforcement actions" | Just-in-time | verified | Same page, "Monitor help desk ticket volume" |
| 17 | SP 800-50r1: communications plan per element (purpose, audience, tracking, consequences, delivery, accommodations, dates); consequences noted in LMS course description | Rules | verified | SP 800-50r1 §4.3 |
| 18 | SP 800-50r1: labor relations stakeholders; human capital may "initiate labor relations and union negotiations" about mandatory training | Rules | verified | SP 800-50r1 §2.11 |
| 19 | Revised 508 Standards E205.3 lists "educational or training materials" and "a survey questionnaire" as agency official communication | Rules | verified | access-board.gov/ict, E205.3 items 6 and 8 |
| 20 | SP 800-50r1: content for on-site/remote staff, contractors, guests, and adaptive technology such as screen readers | Rules | verified | SP 800-50r1 §4.1.1 |
| 21 | SP 800-128: notify stakeholders incl. help desk "especially if the change implementation requires a service interruption or alters the functionality of the system"; "user and help desk training may be required" | Rules | verified | SP 800-128 §3.3.2 (extracted text) |
| 22 | Service desk lead on the CAB | Rules | verified | Book 15 Ch10 |
| 23 | Three-level cascade, two instructors per module, teach-back qualification, champions explain and route only | Train-the-trainer | restated-as-design | Cross-training rule from Book 00 Ch07 |
| 24 | SP 800-50r1: SMEs determine "the task, knowledge, and skill requirements of the roles", identify gaps, guide development | Train-the-trainer | verified | SP 800-50r1 §4 |
| 25 | SP 800-50r1 instructor evaluation: anonymous feedback, observation by instructional designers or supervisors, advance notice, summarized feedback; instructors report on accuracy, ease, adequacy, relevance and timeliness | Train-the-trainer | verified | SP 800-50r1 §5.2.3.1, §5.2.3.2 |
| 26 | SP 800-50r1: learner testing "for all new CPLP elements prior to implementation" | Train-the-trainer | verified | SP 800-50r1 §4.1.6 |
| 27 | AT-2 c / AT-3 b: update content at a frequency "and following" defined events | Currency | verified | OSCAL 5.2.0 |
| 28 | SP 800-50r1 (quoting SP 800-53 discussion): events that precipitate updates include audit findings, incidents, changes in laws etc. | Currency | verified | SP 800-50r1 §2.5.1 |
| 29 | Module-to-chapter provenance, scheduled source check, versioned revisions | Currency | restated-as-design | Workbook's source-watch pattern described generically, not linked |
| 30 | AT-2 d / AT-3 c: incorporate lessons learned from incidents or breaches | Currency | verified | OSCAL 5.2.0 |
| 31 | Book 17 AI Identity Governance planned | Currency | verified | Workbook index (`docs/books/index.md`) |
| 32 | 5 CFR 410.601(a)–(c): maintain records of training plans, expenditures and activities; submit through "the OPM Governmentwide Electronic Data Collection System"; schedule of records under NARA rules | LMS records | verified | eCFR part 410 as of 2026-10-01 |
| 33 | AT-4: "document and monitor"; retain individual records for a defined period | LMS records | verified | OSCAL 5.2.0 |
| 34 | SP 800-50r1: LMS should track registration, attendance, completion; non-LMS elements tracked | LMS records | verified | SP 800-50r1 §4.4 |
| 35 | Completion record fields | LMS records | restated-as-design | — |
| 36 | SP 800-50r1: course titles and numbers "unique, differentiated" | LMS records | verified | SP 800-50r1 §4.3 |
| 37 | SP 800-50r1: training records "are often part of employment or contract records"; manage LMS and reporting risks | LMS records | verified | SP 800-50r1 §2.4.1 |
| 38 | CORs accountable for contractor completion | LMS records | verified | Book 14 Ch09 |
| 39 | 5 CFR 410.201(d)(4): assess "periodically, but not less often than annually"; 410.202: evaluate training programs annually | Annual cycle | verified | eCFR part 410 |

## Corrections to the sources

- The source program structure set a FedRAMP 20x timeline in orientation ("Class A opens August 3, 2026; 20x mandatory January 2027; BOD 26-04 VDR/VER due December 7, 2026"). Those dates bind cloud providers' certification, not the agency's migration (Book 01 Ch12, Book 14 Ch02). Not carried; orientation points to Book 14 Ch02 through the curriculum map.
- The source said training "is not a certification" and described Contributor and Operator tracks tied to the governance tooling. Book 16 uses the compliance and implementation tracks; Principle 13's two-track statement is linked, not restated.
- The source's capstones ran an engine CLI (`<engine> ksi evaluate`, `oscal ksi-ar`) against "eight evidence slots." Engine-specific and internal vocabulary; not carried here (assessment is Chapter 05's).

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| training-index: "Two academies on this site" callout | — | Site-navigation note about a separate engine academy; engine-specific |
| training-index: "Not part of the governance engine" callout | — | Engine positioning; internal vocabulary; not workbook content |
| training-index: "Living program — expansion expected" | Ch09, keeping the curriculum current | Restated as the currency process |
| training-index: What this program is (two tracks, audiences, outcomes, vendor catalog) | Chapters 03, 04, 06 (W2, W3) | Tracks and vendor catalog belong to those chapters |
| training-index: Relationship to governance engines | — | Engine positioning; not carried |
| training-index: Provenance status warning | — | Internal provenance note about the compliance series |
| training-index: The 20-book corpus table (books, slots, KSI categories) | Appendix A (roles to workbook chapters) | Replaced by the role-to-chapter map over the workbook's own books; internal slot/KSI numbering not carried |
| training-index: Program structure (orientation, pick a track, vendor training, capstone) | Ch09, orientation and phase table; Chapters 03–06 | Orientation carried; FedRAMP dates not carried (see corrections) |
| training-index: Core Compliance Pathway (nine-book spine) | Appendix A | Replaced by role-specific reading lists |
| training-index: The `<engine>` token / tooling stack | — | Engine-specific CLI; not carried |
| training-index: Completion criteria | Chapter 05 (W3); Ch10 readiness per role | Assessment design is Chapter 05's |
| training-index: Expansion roadmap | Ch09, keeping the curriculum current | Internal change history not carried; the forward process is |
| training-index: Next | — | Navigation |
| education.md: The learning arc (six ideas) | Ch09, orientation | Carried (as published in Book 00 Principle 13) |
| education.md: Formats (90-minute, self-serve, 45-minute auditor briefing) | Ch09, orientation | Carried as design |
| education.md: Companion pages | — | Navigation |
| training.md: One program, two tracks (Contributor/Operator) | — | Superseded by the compliance and implementation tracks (Chapters 03, 04); Principle 13 linked |
| training.md: Assessment | Chapter 05 (W3) | Not this chapter's ground |
| training.md: Companion pages | — | Navigation |
| Vol V Book 00: Volume Purpose | Chapter 01 (W1) | Argument chapter; internal counts (29 rules, 10 attestable) not carried |
| Vol V Book 00: Books in This Volume | Book 16 chapter structure | Replaced by Chapters 03–06 |
| Vol V Book 00: Relationship to Vol IV Book 05 | Book 14 Ch09 link (Ch09 in-chapter note) | The controls/people division is the brief's settled split |
| Vol V Book 00: How This Volume Fits the Program (records feed the package) | Ch09, LMS records; Ch10, training records as evidence | Internal plane vocabulary not carried |
| Vol V Book 00: Where This Volume's Evidence Lands — Volume X | — | Internal binding layer; not workbook content |
