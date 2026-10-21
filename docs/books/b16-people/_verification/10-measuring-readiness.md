# Verification — Chapter 10, Measuring Readiness and Evidencing It

Writer W5. Source material: the completion criteria and "training effectiveness record" passages of `docs/compliance/training-index.md` and `docs/compliance/Vol_V_Book_00_Training_Certification_Overview.md`; the rest is new research. All primary sources opened October 21, 2026, by the same methods as the Chapter 09 file (curl with a generic user agent, pypdf text extraction, eCFR API, OSCAL 5.2.0 catalog, Microsoft Learn search, access-board.gov).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A-130: "ensure that measures are in place to test the knowledge level of information system users" | Completion is not competence | verified | A-130 App. I §4.h item 4 |
| 2 | SP 800-50r1: measurements "must go beyond simply achieving compliance"; impact on "workforce capabilities, attitude, and behavioral changes must also be measured" | Same | verified | SP 800-50r1 §2.4.1 |
| 3 | SP 800-50r1 uses the four Kirkpatrick levels (reaction, learning, behavior, results) with the descriptions in the table | Same | verified | SP 800-50r1 §5.2.3.3, Table 3 |
| 4 | Mapping of each level to program measures | Same | restated-as-design | — |
| 5 | SP 800-181r1 (Nov 2020): competencies "a mechanism for organizations to assess learners"; employer-driven, learner-focused, "observable and measurable"; assessments as tests, lab-based demonstration, oral evaluations | Same | verified | SP 800-181r1 §3.3, Figs. 2–3; CSRC page (date) |
| 6 | SP 800-50r1 Level 2: practical assessments that "mimic what will be experienced in the work role"; case studies, virtual labs, demonstrations, scenario exercises | Same | verified | SP 800-50r1 §5.2.3.3 |
| 7 | Competence required for roles where a mistake is a security event | Same | restated-as-design | — |
| 8 | Readiness measures per role group and thresholds | Readiness per role | restated-as-design | Roles from Appendix A; help desk measures from Book 15 Ch10 |
| 9 | Every overdue person in a privileged role is a finding regardless of percentage | Readiness per role | verified | Book 14 Ch09 (program design there) |
| 10 | Leadership measure: describe the path without document numbers | Readiness per role | verified | Book 00 Ch10, delivery measure 8 |
| 11 | Gate authorities and division-level exit | Readiness per gate | verified | Book 01 Ch12 |
| 12 | Readiness criteria per gate | Readiness per gate | restated-as-design | — |
| 13 | Pilot criteria: help desk tickets below 5% of pilot users; satisfaction above 80% positive | G2 row | verified | Book 00 Ch09 (labeled illustrative there and here) |
| 14 | Microsoft: slow deployment, communications and enforcement as ticket volume rises; ramp back as it falls | Readiness per gate; tickets | verified | Learn, phishing-resistant passwordless deployment, "Monitor help desk ticket volume" |
| 15 | SP 800-50r1 end-of-element questions (relevance to work role; three most important things learned) | Surveys | verified | SP 800-50r1 §5.2.3.3 |
| 16 | SP 800-50r1: follow-up questions "three to six months after the learning activity" | Surveys | verified | SP 800-50r1 §5.2.3.3 |
| 17 | SP 800-50r1: attitude surveys among qualitative measures | Surveys | verified | SP 800-50r1 §2.4.1.2 |
| 18 | SP 800-50r1: anonymous feedback; summaries that don't identify individuals | Surveys | verified | SP 800-50r1 §5.2.3.1 |
| 19 | Survey questionnaire is agency official communication under Revised 508 Standards | Surveys | verified | access-board.gov/ict, E205.3 item 6 |
| 20 | Three surveys (end-of-module, post-wave, three-month follow-up) | Surveys | restated-as-design | — |
| 21 | Microsoft: help desk is "an invaluable signal"; track ticket volume | Tickets | verified | Same Learn page |
| 22 | Volume, category and decay reading of tickets | Tickets | restated-as-design | — |
| 23 | Authentication methods activity report: users capable of MFA, passwordless, SSPR; registered by method | Registration | verified | Learn, "Authentication Methods Activity," Registration details |
| 24 | Microsoft uses the report to measure pilot registration before enforcement | Registration | verified | Learn, deployment guide, "Test deployment strategy" step 4 |
| 25 | The report requires Microsoft Entra ID P1 or P2 | Registration | verified | Learn, "Working with the authentication methods usage report API," Licenses |
| 26 | SP 800-50r1 behavior metric example: percentage who changed a behavior, e.g., reported a phishing test | Phishing | verified | SP 800-50r1 §2.4.2 |
| 27 | Phishing exercise rules (legal review, non-punitive, no impersonation) | Phishing | verified (by link) | Book 14 Ch09 |
| 28 | AT-4 evidence record design (roster denominator, hashes, no names, ISSO review) | Training records as evidence | verified (by link) | Book 14 Ch09 |
| 29 | AT-4 "document and monitor" | Same | verified | OSCAL 5.2.0 |
| 30 | AT-6: feedback on training results to defined personnel at a defined frequency; in no NIST or FedRAMP baseline | Same | verified | OSCAL 5.2.0; Book 14 Ch09 controls table |
| 31 | Readiness record adds competence, gate/wave cut, signal trends | Same | restated-as-design | — |
| 32 | SP 800-50r1 assessment report: end of campaign and regularly; attendance, feedback, metrics; "tailored for senior leadership using appropriate language"; review agrees changes, budget, new risks | Reporting | verified | SP 800-50r1 §5.1, §5.2, §5.2.4 |
| 33 | 5 CFR 410.202: evaluate training programs annually | Reporting | verified | eCFR part 410 |
| 34 | Steering committee every two weeks | Reporting | verified | Book 00 Ch07, the rhythm |
| 35 | Quarterly training completion review | Reporting | verified | Book 14 Ch11 continuous monitoring schedule |
| 36 | Report cadence and one-page contents | Reporting | restated-as-design | — |
| 37 | SP 800-50r1 Level 4: "establish baseline metrics"; "it takes time to see the full impact of a learning program" | Baselines | verified | SP 800-50r1 §5.2.3.3 |

## Corrections to the sources

- The sources treated completion of the track capstone and a "training-effectiveness record" as the training evidence, scored by an engine run. The chapter separates completion from demonstrated competence, keeps the evidence record as Book 14 Ch09 defines it, and leaves any pass/fail decision to the ISSO.
- The sources described effectiveness only as a capstone result. SP 800-50r1 asks for reaction, learning, behavior and results measures; the chapter adds the behavior signals (tickets, registration, report rates).

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| training-index: Completion criteria (Track A and Track B) | Ch10, readiness per role (competence column); Chapter 05 | Engine commands and slot walks not carried |
| training-index: Expansion roadmap, "post-implementation KPIs" mention | Ch10, readiness per role and per gate | The KPIs page itself was not a source; measures here are new design |
| Vol V Book 00: training-effectiveness record as the training evidence | Ch10, training records as evidence | Reframed against Book 14 Ch09's AT-4 record |
