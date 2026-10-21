# Verification — Chapter 10, Who Owns Compliance

Writer W5. New chapter; no source pages were assigned. Kept consistent with Book 00 Ch07 (decision table, risk acceptance by the AO, steward and gates), Book 01 Ch09 (program-wide matrix: CISO decides control requirements and evidence; AO accepts residual risk), Book 10 Ch08 (security category AO decides, system owner does; CISO decides and ISSO does provider-report review), Book 12 Ch10 (SOC as common control provider; system owner decides remediation; AO alone accepts), Book 13 Ch09 (AO's role, exceptions split, register, records officer, steward), and this book's Ch05 (PM-2/PM-10 role template; ISSO may be a contractor as design; CIO approves SCRM charter, SAISO owns strategy; CA-2(1) independence) and Ch09 (training ownership). All primary sources opened October 21, 2026, as extracted text from downloaded PDFs (curl, generic user agent) or law.cornell.edu; SP 800-53 text from the release 5.2.0 OSCAL catalog.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Head of agency responsible for protections commensurate with risk; delegates to CIO; SAISO designation with primary-duty, qualification and office criteria; training and overseeing significant-responsibility personnel | Where the roles come from | verified | 44 U.S.C. § 3554(a)(1)(A), (a)(3)(A)–(D) |
| 2 | A-130: designate SAOP; ensure CIO designates SAISO | Same | verified | A-130 §5.f.1(b), §5.f.2(a); note 25 |
| 3 | A-130: designate senior federal officials to authorize systems and common controls; only federal personnel as AO; AO has budgetary oversight or mission responsibility; accountable for privacy risk; consider SAOP input; SAOP reviews PII packages; head of agency decides on impasse; CIO or SAOP as co-AO | Same; matrix; separations | verified | A-130 App. I §4.d.1, §5.f |
| 4 | SP 800-37 App. D role list; conflicts-of-interest footnote | Same | verified | SP 800-37r2 App. D intro, fn 112–113 |
| 5 | Every RMF task has primary responsibility | Opening; Same | verified | SP 800-37r2 Ch. 3 task tables |
| 6 | PM-2, PM-19, PM-29, PM-10, CA-6 statements | Same | verified | OSCAL 5.2.0 |
| 7 | Evidence for appointment controls is a signed appointment with a name | Same | restated-as-design | Consistent with Ch05 |
| 8 | SP 800-34 ISCP Coordinator: "generally falls under the auspice of"; "typically a functional or resource manager"; develops strategy; manages development and execution; every federal system must have a contingency plan | Where; contingency coordinator | verified | SP 800-34r1 Ch. 3 intro |
| 9 | Sample policy statement: coordinator documents plan and reviews annually; coordinator designs test plan; record of changes | Contingency coordinator | verified | SP 800-34r1 §3.1, §3.5.1, §3.6 |
| 10 | 41 U.S.C. 1326(a)–(b): head of agency responsible for SCRM; strategy, life cycle integration, information sharing per FASC, reporting | Where; SCRM lead | verified | law.cornell.edu 41 U.S.C. § 1326 |
| 11 | SP 800-161r1 C-SCRM PMO: composition; "may include or report to a dedicated executive-level official"; services incl. chairing groups, supplier assessments, risk register, drafting strategy | SCRM lead | verified | SP 800-161r1-upd1 §2.3.5 |
| 12 | Head of agency P-2; SAORM leads risk executive; risk executive forms ("a risk board, executive steering committee, executive leadership council"); P-7 | Head of agency | verified | SP 800-37r2 App. D; tasks P-2, P-7 |
| 13 | P-1 primary: head of agency, CIO, SAOP | Head of agency | verified | Task P-1 |
| 14 | Head of agency or SAORM names each AO | Head of agency; matrix | restated-as-design | Built on A-130 §4.d.1 and P-1 |
| 15 | CIO duties; resource allocation with AOs; coordination with SAOP for PII; CIO may be AO/co-AO | CIO | verified | SP 800-37r2 App. D, CIO |
| 16 | SAISO definition; liaison; may be called CISO; may serve as AODR or security control assessor | CISO | verified | SP 800-37r2 App. D, SAISO |
| 17 | P-5 primary SAISO and SAOP | CISO | verified | Task P-5 |
| 18 | CISO decides control requirements, owns training policy, SCRM strategy, provider-report review | CISO | restated-as-design | Book 01 Ch09, Ch09, Ch05, Book 10 Ch08 |
| 19 | CISO as AODR or assessor only with written no-conflict rationale | CISO | restated-as-design | Grounded in SP 800-37 fn 113 |
| 20 | SAOP eight duties; retains responsibility when independent assessor used | SAOP | verified | SP 800-37r2 App. D, SAOP; Common Control Provider; Control Assessor |
| 21 | AO "only organizational official who can accept…"; approves plans, MOAs, POA&Ms; significant change; government personnel only | AO | verified | SP 800-37r2 App. D, AO |
| 22 | AO/AODR primary for C-3, S-6, A-1, A-2, R-2, R-3, R-5; AO alone R-4, M-6 | AO; path | verified | Task tables |
| 23 | AO sets assessor independence | AO; assessor | verified | SP 800-37r2 App. D, Control Assessor |
| 24 | AODR can do everything except the authorization decision ("the acceptance of risk") | AO | verified | SP 800-37r2 App. D, AODR |
| 25 | AODR prepares, AO signs every acceptance | AO | restated-as-design | Book 13 Ch09 |
| 26 | System owner definition and duties; may be called program manager or business/asset owner | System owner | verified | SP 800-37r2 App. D, System Owner, fn 121 |
| 27 | System owner is primary on more RMF tasks than any other role | System owner | verified | Count of primary-responsibility lines in task tables (System Owner 23; Common Control Provider 13; Authorizing Official 11) |
| 28 | System security officer duties (posture, principal advisor, day-to-day ops incl. training and incident handling, plans, change control and impact analysis); privacy officer; may be combined | ISSO | verified | SP 800-37r2 App. D, System Security or Privacy Officer |
| 29 | ISSM not an RMF role; fn 124 security manager | ISSO/ISSM | verified | SP 800-37r2 fn 124 |
| 30 | SP 800-50r1 example policy: ISSM may waive suspension; submits plans and reports | ISSO/ISSM | verified | SP 800-50r1 §2.2.1 |
| 31 | ISSM portfolio duties | ISSO/ISSM | restated-as-design | — |
| 32 | ISSO not reserved to government; contractor with oversight | ISSO/ISSM; table | restated-as-design | Ch05; SP 800-37 lists no restriction |
| 33 | Control assessor duties; does not assess inherited controls at system level | Assessor | verified | SP 800-37r2 App. D, Control Assessor |
| 34 | CA-2(1) and CA-7(1) Moderate and High | Assessor | verified | OSCAL 53B Moderate/High profiles |
| 35 | CA-2(1) discussion: impartiality definition; internal or contracted; AO decides including contracting influence; review by independent experts in small organizations | Assessor; path; separations | verified | OSCAL CA-2(1) guidance |
| 36 | FedRAMP 3PAO is for providers; agency selects own assessors | Assessor | verified | Consistent with Ch05 correction |
| 37 | Common control provider duties; plans go to inheriting owners after AO approval; SAOP designates common privacy controls | Common control providers | verified | SP 800-37r2 App. D, Common Control Provider |
| 38 | SOC, platform teams, governance platform as common control providers | Same | restated-as-design | Book 12 Ch10, Book 13 Ch09 |
| 39 | CP-2 a.3 and a.7 | Contingency coordinator | verified | OSCAL CP-2 |
| 40 | Coordinator named per system, accountable to system owner who approves plan | Same | restated-as-design | — |
| 41 | SCRM lead role; acquisition with contracting officer and liaison | SCRM lead | restated-as-design | Ch05 charter |
| 42 | Information owner gives requirements to system owners | Roles that keep the record | verified | SP 800-37r2 App. D, Information Owner or Steward; C-2 |
| 43 | Six roles inherent government functions (AO, CIO, risk executive, SAORM, SAISO, SAOP) | Who must be government | verified | SP 800-37r2 App. D |
| 44 | AODR and system owner as government officials | Same | restated-as-design | Not stated in SP 800-37 |
| 45 | C-3 primary: AO/AODR and SAOP | Path; matrix comments | verified | Task C-3 |
| 46 | A-6 primary system owner, CCP; AO approves POA&Ms | Path; matrix | verified | Task A-6; App. D, AO |
| 47 | R-1 primary includes SAOP for PII systems | Matrix | verified | Task R-1, fn 95 |
| 48 | M-5 primary: system owner, CCP, SAISO, SAOP | Matrix | verified | Task M-5 |
| 49 | Responsibility matrix rows and assignments | Matrix | restated-as-design | Consistent with the Who chapters listed above |
| 50 | AO not the system owner for the same system | Separations | restated-as-design | Grounded in SP 800-37 fn 113 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (No source pages assigned; new chapter) | — | The training-program RACI in the Chapter 09 source (ISSO, ISSM, HR/training coordinator, SOC lead, COR, supervisors) was reconciled here and in Chapter 09's "Who owns the training evidence" |
