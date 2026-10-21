# Verification — Chapter 09, Training and Awareness Controls

Writer W5. Source: `docs/compliance/Vol_IV_Book_05_Cybersecurity_Training_Awareness.md` (5,840 words). All primary sources opened October 21, 2026. Federal PDFs downloaded with curl (generic user agent, no identifying headers) and read as extracted text (pypdf); SP 800-53 control text and baselines read from NIST's release 5.2.0 OSCAL catalog and the Low, Moderate, High and privacy baseline profiles; FedRAMP class membership read from the 2026 Rev5 control reference family pages; CFR and U.S. Code text read on law.cornell.edu, with the eCFR versioner API used for the 5 CFR 930 source note. Microsoft claims checked with the Microsoft Learn tools and the Graph permissions reference page. The dni.gov 2024 NITTF guide and FEMA's 2024 continuity directive returned block pages and were not used.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FISMA: program includes security awareness training for personnel "including contractors and other users"; agency head ensures trained personnel; CIO delegation includes training and overseeing personnel with significant responsibilities | What federal law requires; role-based training | verified | 44 U.S.C. § 3554(a)(3)(D), (a)(4), (b)(4) |
| 2 | A-130 App. I §4.h: mandatory agency-wide programs; consistent with OMB/NIST/OPM; test knowledge level; role-based training before access; rules of behavior with consequences, read and agreed | What federal law requires | verified | A-130 PDF, App. I §4.h items 1–7 |
| 3 | PL-4 asks for documented acknowledgment before access | Same | verified | SP 800-53r5 PL-4, OSCAL 5.2.0 |
| 4 | 5 CFR 930.301 text: plan; significant responsibilities role-specific training per NIST; all users annually incl. "employees, contractors, students, guest researchers, visitors"; audience categories; new employees before access; refresher frequency agency-set by sensitivity; training on significant change or new role | What federal law requires; AT-2 | verified | law.cornell.edu 5 CFR 930.301 |
| 5 | 930.301 dates from June 14, 2004 (69 FR 32836), unamended; authority Pub. L. 107-347 (FISMA 2002); stale NIST URL | Same | verified | eCFR versioner API (subpart C source note); section version list |
| 6 | SP 800-50 Rev. 1, September 2024, supersedes SP 800-50 (2003) and SP 800-16 | Same | verified | CSRC SP 800-50r1 page; PDF Introduction |
| 7 | SP 800-16 withdrawn September 12, 2024 | Same | verified | CSRC SP 800-16 page |
| 8 | Four-phase CPLP life cycle; privacy foundational; NICE / SP 800-181r1 for work roles; three audience segments | Same | verified | SP 800-50r1 Introduction, §1.3, §2.5 |
| 9 | Source cited SP 800-16 as current | Same | corrected | CSRC SP 800-16 page |
| 10 | M-17-12 breach training before access, include contractors etc.; specialized training for supervisors and HVA staff | What federal law requires; AT-2 modules | verified | M-17-12 §IV |
| 11 | EO 13587, October 7, 2011; Insider Threat Task Force; minimum standards "binding on the executive branch" | Same | verified | govinfo FR-2011-10-13, 76 FR 63811, §6 |
| 12 | NITTF minimum standards: initial and recurring training with documentation; verify all cleared employees completed insider threat awareness | Same | verified | NITTF Minimum Standards checklist (2021 revision), "Employee Training and Awareness" |
| 13 | One insider threat module should serve both AT-2(2) and the insider threat program | Same | restated-as-design | — |
| 14 | Control statements for AT-1, AT-2(1)–(6), AT-3, AT-3(1)–(5), AT-4, AT-6, IR-2(1)–(3), CP-3(1); AT-3(4) and AT-5 withdrawn | Controls table | verified | OSCAL 5.2.0 catalog |
| 15 | NIST baselines: AT-1/2/3/4, IR-2 in L/M/H/Privacy; AT-2(2) L/M/H; AT-2(3) M/H; AT-3(5) Privacy only; AT-2(1), AT-3(3), AT-6 none; IR-2(1),(2) H; IR-2(3) Privacy; CP-3 L/M/H; CP-3(1) H | Controls table | verified | SP 800-53B OSCAL profiles 5.2.0 |
| 16 | FedRAMP classes: AT-1/2/2(2)/3/4 B,C,D; AT-2(3) C,D; AT-2(1), AT-3(3), AT-3(5), AT-6 none; IR-2 B,C,D; IR-2(1),(2) D; IR-2(3) none; CP-3 B,C,D; CP-3(1) D; no FedRAMP-assigned parameter values | Controls table; AT-4 retention | verified | FedRAMP 2026 control reference, AT, IR, CP pages |
| 17 | Source claimed AT-2(1), AT-3(3) closures as baseline requirements | Three corrections | corrected | Same as 15–16 |
| 18 | Source treated AT-3(5) as a Moderate closure | Three corrections | corrected | Privacy baseline only |
| 19 | Source omitted AT-2(3), a Moderate requirement | Three corrections | corrected | SP 800-53B Moderate profile |
| 20 | Neither NIST nor FedRAMP sets "annual" for AT-2/AT-3/IR-2/CP-3; annual floor for awareness comes from 5 CFR 930.301 | Controls; AT-2 | verified | OSCAL params (organization-defined); FedRAMP pages (no assigned values); 5 CFR 930.301(a)(1) |
| 21 | SP 800-50r1 (quoting SP 800-53 AT-2 discussion): subsequent literacy training may be short ad hoc sessions | AT-2 | verified | SP 800-50r1 §2.5.1 |
| 22 | Awareness module list | AT-2 | restated-as-design | Source modules, product names removed |
| 23 | Source "72-hour reporting window" for PII breach | AT-2 | corrected (removed) | M-17-12 §VII.D.1: principal SOC reports to US-CERT per its guidelines; one-hour clock per Book 12 Ch10 |
| 24 | SP 800-50r1 phishing guidance: click/report metrics by role; NIST Phish Scale; legal team; avoid legitimate brands or naming federal organizations; non-punitive; tell employees | AT-2(1) | verified | SP 800-50r1 §2.7.2 |
| 25 | Source scenarios impersonating `.gov`/`.mil` senders | AT-2(1) | corrected | SP 800-50r1 §2.7.2 |
| 26 | Attack simulation training available in GCC, GCC High, DoD (some features missing in GCC High/DoD); G5 / Defender for Office 365 Plan 2 for Government | AT-2(1) | verified | Microsoft Learn, Attack simulation training get started; MDO features service description |
| 27 | Determining significant roles is multi-step, led by CIO/CISO/CPO with HR | AT-3 | verified | SP 800-50r1 §2.5.4 |
| 28 | Six role tiers, examples, frequencies and hours | AT-3 | restated-as-design | Source matrix, product names removed |
| 29 | Roster derived from identity platform, inventory and privacy records | AT-3 | restated-as-design | — |
| 30 | Developer secure delivery track and formats | AT-3 | restated-as-design | Source Dimension 3 |
| 31 | AT-3(5) statement; SP 800-50r1 role-based privacy training should cover SORNs, PIAs, Privacy Act statements | AT-3 | verified | OSCAL AT-3(5); SP 800-50r1 §1.5 footnote 6 |
| 32 | IR-2 and CP-3 statement structure; enhancements H and Class D only | IR-2/CP-3 | verified | OSCAL; 53B profiles; FedRAMP pages |
| 33 | SP 800-34 Rev. 1 May 2010, updated Nov 11, 2010, final; training at least annually; new appointees trained shortly after; "without aid of the actual ISCP document" | IR-2/CP-3 | verified | SP 800-34r1 §3.5.2; CSRC page |
| 34 | SP 800-84 September 2006, final; training vs exercises distinction | IR-2/CP-3 | verified | CSRC SP 800-84 page; SP 800-34r1 §3.5.2 (citing SP 800-84) |
| 35 | SP 800-61 Rev. 3, April 2025, PR.AT-02 R1: role-based training should include incident-related responsibilities | IR-2/CP-3 | verified | SP 800-61r3 Table 2 |
| 36 | Source counted failover tests (Q1, Q2, Q4) as CP-3 | IR-2/CP-3 | corrected | Separated: CP-4 tests vs CP-3 training (CP-3/CP-4 text; SP 800-34 §3.5) |
| 37 | IR/CP cadence table | IR-2/CP-3 | restated-as-design | Source cadence and calendar |
| 38 | CP-2(g), AT-2(d), AT-3(c) incorporate lessons learned | IR-2/CP-3 | verified | OSCAL 5.2.0 |
| 39 | AT-4 statement | AT-4 | verified | OSCAL 5.2.0 |
| 40 | Viva Learning ingests from LMS; LMS "is the ultimate source of content and learner records" | Where the record lives | verified | Microsoft Learn, Add learning management systems for Viva Learning |
| 41 | SP 800-50r1: training records often part of employment/contract records; manage risks of learning data and LMSs | Where the record lives | verified | SP 800-50r1 §2.4.1 |
| 42 | Source's JSON schema (ISSO name field, `ksi_ced_rat_status: PASS`, privileged tier mapped to AT-3(5)) | AT-4 record | corrected | Replaced by illustrative record without names or pass field; AT-3(5) mapped only to data stewards per OSCAL |
| 43 | 95 percent threshold; privileged-tier overdue as finding | AT-4 record | restated-as-design | Source thresholds |
| 44 | PowerShell script uses Import-Csv, Where-Object, Group-Object, Select-Object, Get-FileHash, ConvertTo-Json, Set-Content, Split-Path | AT-4 script | verified | Standard PowerShell cmdlets; no service calls |
| 45 | Employee learning API exists to push LMS content and learner records into Viva Learning | Feeding from M365 | verified | Microsoft Learn, employee learning API overview |
| 46 | List course activities is per user, delegated only, least privileged LearningAssignedCourse.Read.All | Same | verified | Graph "List learningCourseActivities" |
| 47 | `/employeeExperience/learningCourseActivities` documented only for get-by-ID | Same | verified | Graph "Get learningCourseActivity" |
| 48 | `LearningAssignmentReport.Read.All` isn't a Graph permission | Same | corrected | Graph permissions reference (Learning* permissions enumerated) |
| 49 | APIs available in global service only, not US Gov L4/L5 | Same | verified | Graph list/get pages, national cloud table |
| 50 | GCC tenants use global Graph; GCC High can't use these APIs | Same | verified | Same (global vs L4 columns) |
| 51 | GRS 2.6 item 010 covers mandatory training tracking files and attendance records, all workers incl. contractors; destroy at 3 years, longer allowed; infosec training as example | Retention | verified | NARA GRS 2.6, Transmittal 35, May 2024 |
| 52 | Keep derived records as long as the package relies on them | Retention | restated-as-design | — |
| 53 | KSI-CED-RAT statement and related controls | Cloud providers | verified | FedRAMP KSI page |
| 54 | KSIs bind providers; agency reviews Ongoing Certification Reports | Cloud providers | verified | Settled in Book 12 Ch12 / Book 13 Ch11 (linked) |
| 55 | Source's "KSI-022", "29/29 internal rules", "19 of 46 CR26 indicators", "final scaffold KSI" | Cloud providers | removed | Internal program counts (brief) |
| 56 | AT-1 designated official; CIO ensures significant-responsibility personnel trained; system owner ensures users and support personnel trained; SSO duties may include training | Who owns | verified | OSCAL AT-1; SP 800-37r2 App. D |
| 57 | Ownership split (CISO, ISSO, SAOP, insider threat program, training office, HR, records officer, supervisors, CORs) | Who owns | restated-as-design | Consistent with Ch05 role matrix and Ch10 |
| 58 | Source delivery-platform table (DoD Cyber Awareness Challenge/ATCTS, CISA free.cisa.gov, KnowBe4/Proofpoint "FedRAMP Moderate authorized", SANS "FedRAMP-authorized", Viva "Native GCC/GCC High", "M365 E3/E5 included") | — | removed | Not verified; vendor positioning; Viva Learning GCC High claim contradicted by Graph availability |
| 59 | Viva Goals retired Dec 2025, Viva Topics Feb 2025 | — | removed | Not needed; principle restated as design ("a vendor roadmap is not a commitment") |
| 60 | Source "quarterly refreshers are best practice for GCC Moderate" | — | removed | No source; frequency left to agency |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, draft banner, Date Code, internal-distribution banner | — | Internal document furniture; agency shortcodes not carried |
| Scope note (control closure here; academy in Volume V) | Opening; In this chapter | Restated as Book 16 cross-reference ([../index.md]) |
| What This Document Addresses | Opening; In this chapter | Internal KSI counts dropped |
| Why Training Cannot Be Closed by Architecture Alone | Opening paragraphs | Rewritten |
| KSI-CED-RAT four dimensions table | Cloud providers; figure ch09-four-populations | Reframed: indicator binds providers; dimensions adopted as program design |
| Relationship to Vol IV Book 01 and Book 03 (PM-14) | IR-2/CP-3 (link Ch06); Ch05 linked via Ch10 | Volume IDs dropped |
| Controls Closed by This Document | The controls, one by one | Corrected baselines; AT-2(3) added |
| Closure Necessity blockquote | Opening (training closes through records, not configuration) | Doctrine name and volume references dropped |
| Training Program Architecture: Four-Dimension Model | Figure ch09-four-populations | — |
| Program Governance RACI | Who owns the training evidence; Ch10 matrix | Merged with Ch05/Ch10 role model |
| Dimension 1: Program Design (modules table) | AT-2 module table | Product names removed; IR-2(3) noted |
| Delivery Options for GCC Moderate (platform table) | — | Removed: unverified FedRAMP and availability claims; LMS-agnostic principle kept |
| Recommended: Viva Learning | Feeding the record from Microsoft 365 | Corrected: LMS is system of record; Viva is a hub |
| LMS-agnostic evidence contract note | Where the record lives | Kept as design; retirement dates dropped |
| Phishing Simulation (AT-2(1)) | Phishing exercises | Corrected: optional enhancement; SP 800-50r1 conditions; no .gov/.mil impersonation |
| Dimension 2: Role Classification and Training Matrix | Role-based training table | Product names removed; values labeled design |
| Tier 1 Sysadmin curriculum table | Tier 1 row "training focus" | Product-by-product curriculum deferred to Book 16 |
| Tier 3 Developer curriculum | Developers get a secure delivery track | Tool names (Syft, Grype) generalized; BOD 26-04 "D1–D5 SLA" not carried (unverified label) |
| Tier 5 Data Steward (AT-3(5)) | Data stewards get the privacy track | 72-hour breach window removed (corrected) |
| Dimension 3: Developer Security in 20x context | Developers track; supply chain link Ch07 | KSI-PIY-RSD/CR26 internal framing dropped |
| Training Delivery for Developers (formats) | Developers track (formats listed) | — |
| IR Training Cadence | IR/CP cadence table | — |
| IR Scenario Library | — | Not carried: detection scenarios belong to Book 12 Ch11 (linked); product-specific |
| CP-3 Tabletop Exercise Calendar | IR/CP cadence table | Corrected: failover tests are CP-4 |
| After-Action Report Requirements | IR/CP section, AAR paragraph | Kept; routed to Book 13 Ch09 finding process |
| The Machine-Readable Evidence Requirement (four questions) | What the record has to answer | Numerator/denominator added |
| Evidence contract block (Substrate_Signal…) | Where the record lives (Book 12 Ch02 link) | Internal signal name dropped |
| Training Completion Record Schema | Illustrative JSON record | Corrected (see claims 42) |
| Microsoft Viva Learning Integration; Graph API query | Feeding the record from Microsoft 365; PowerShell script | Corrected endpoint/permission/cloud availability; script now reads LMS export |
| Automated Monthly Export | Where the record lives; script | Logic App/Automation specifics not carried; schedule is design |
| NIST Control Closure: AT family table | Controls table | Corrected |
| CP and IR Family Contributions | IR/CP section | — |
| Net New Controls Closed (count 9) | — | Internal count dropped |
| KSI-CED-RAT Activation: evidence contract and PASS thresholds | Record design (threshold as design); Cloud providers | Pass field removed; decision moved to ISSO review |
| KSI-022 Status After this book | — | Internal rule counts dropped (brief) |
| Series Completion Summary table | — | Internal series map; Ch12 owns the map |
| Implementation Checklist (phases 1–4) | — | Program plan detail deferred to Book 16; key steps reflected in record and roster design |
| Document References | Footnotes | SP 800-16 corrected to withdrawn; EO 14028 not used (no training requirement relied on) |
