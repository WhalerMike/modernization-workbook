# Verification — Chapter 10, Who Runs Day Two

Writer W5. New chapter; no source pages were assigned. Read first and kept consistent with: Book 00 Ch07 (decision table; risk acceptance by the AO; CIO and sponsor own budget), Book 01 Ch09 (program-wide matrix: CISO decides control requirements and the help desk identity-verification procedure, help desk does the work; AO accepts residual risk), Book 04 Ch06 (help desk executes, never decides; cloud services is the escalation tier, not intake; A0–A3 authority levels; IGO decides help desk PAG membership, reviewed quarterly; security ops decides alert triage and incident-driven revocation), Book 12 Ch10 (platform owners and plane table; system owner decides remediation; acting playbooks need CISO approval; DDI team owns the naming plane), Book 13 Ch09 (bounded exception CISO, open-ended AO; L4 class AO decides, CISO R; governance board scope; records officer) and Book 14 Ch10 (significant change AO decides; system owner; separations). Also checked against this book's Chapters 03, 04, 05, 06 and Appendix A as written by other writers: the help desk supervisor approves routine credential tasks (App. A, Ch04), reports conditions to the IGO (Ch03), and Ch04 uses "Tier 0/1/2" for Book 04's privilege tiers, so this chapter calls the support levels "lines", not tiers. Primary sources opened October 21, 2026: SP 800-53 release 5.2.0 OSCAL catalog and SP 800-53B profiles; SP 800-37 Rev. 2 and SP 800-128 as extracted text from nvlpubs PDFs; ServiceNow docs pages; FedRAMP Marketplace `products.json` (meta `last_change` 2026-10-21T16:12Z).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ISSO (system security or privacy officer) maintains posture, often day-to-day operations, "managing and controlling changes to the system, and assessing the security or privacy impact of those changes" | Where the roles come from; ISSO | verified | SP 800-37r2 App. D |
| 2 | AO "only organizational official who can accept…"; approves POA&Ms; decides whether significant changes require reauthorization; inherent government function | Where; AO; separations | verified | SP 800-37r2 App. D |
| 3 | Task M-1 monitors the system and environment for changes | Where | verified | SP 800-37r2 Ch. 3, M-1 |
| 4 | CM-3 a–g; discussion names Configuration Control Boards and Change Advisory Boards | Where; CAB | verified | SP 800-53 5.2.0 CM-3 |
| 5 | CM-3(4) security and privacy representatives; discussion examples (SSOs, SAISOs, SAOPs, SPOs) | Where; CAB | verified | CM-3(4) |
| 6 | CM-5 access restrictions; workflow automation and change windows listed | Where; ITSM team | verified | CM-5 discussion |
| 7 | CM-8(4), CM-8(9) | Where; CMDB owner | verified | OSCAL 5.2.0 |
| 8 | CM-9 "addresses roles, responsibilities…"; CM-9(1) not directly involved in development | Where; separations | verified | CM-9, CM-9(1) |
| 9 | Moderate includes CM-3, CM-3(4), CM-5, CM-8, CM-9; High includes CM-8(4) | Where | verified | SP 800-53B 5.2.0 profiles |
| 10 | SP 800-128 roles: CIO designates SecCM program manager and approves plan; SAISO may be manager and provide CCB staff; AO manages or participates in CCB and makes final determination on change risk; SSO assists, monitors, may serve on CCB; SA implements baselines and assists with impact analysis | Where; CAB | verified | SP 800-128 §2.4 |
| 11 | CCB definition "two or more individuals…"; change request may come from "the end user of the system, a help desk, or from management" | Where | verified | SP 800-128 §2.3.3, §3.3.2 |
| 12 | Pre-approved/exempt changes; approval "usually performed by the CCB"; stakeholders including help desk notified, "especially if…"; help desk training may be required | CAB | verified | SP 800-128 §3.3.2 steps iii, vi, vii |
| 13 | AC-5 statement and discussion quote | Where | verified | AC-5 |
| 14 | Deciding/doing/consulted/owning-an-artifact model | Deciding | restated-as-design | Book 01 model plus program design |
| 15 | Three support lines; cloud services escalation not intake; request landing on cloud services returns to triage | Service desk lines | verified (internal) | Book 04 Ch06; Ch03 |
| 16 | Technicians: no approval authority, no standing role, PIM with justification | Service desk lines | verified (internal) | Book 04 Ch06; Ch04 |
| 17 | Supervisor approves routine credential tasks (with manager), never own ticket, never access, never second approver; quarterly certification; backlog; emergency change; reports to IGO in one business day | Service desk lines | verified (internal) | App. A; Ch03; Ch04 |
| 18 | Staffing decided by CIO or desk management; contractor desk works under model | Service desk lines | restated-as-design | Book 01 Ch09; Book 00 Ch07 |
| 19 | Desk measures and review cadence | Staffing | restated-as-design | Program design |
| 20 | IGO decides tiers, chains, consent outside lowest tier, PAG membership reviewed quarterly; identity engineering builds | Identity operations | verified (internal) | Book 04 Ch06 roles table and review table |
| 21 | Lifecycle events from HR through workflows "in the target model" | Identity operations | restated-as-design | Book 03; Book 04 Ch06 table |
| 22 | Platform owners own runbooks, catalog content, execution; remediate on system owner's schedule; DDI owns naming plane | Platform owners | restated-as-design | Consistent with Book 12 Ch10, Book 13 Ch09, Ch07 |
| 23 | ServiceNow Government Community Cloud: FedRAMP Certified, Class D, impact High | ITSM team | verified | FedRAMP Marketplace products.json, F1305072116 |
| 24 | Certification doesn't authorize agency use | ITSM team | verified (internal) | Book 13 Ch11 |
| 25 | ServiceNow native compliance and continuous-monitoring applications overlap | ITSM team | restated-as-design | Pointer to Ch11, where W7 verifies the products |
| 26 | Managed by Group "identifies the group that manages a CI class" and "might or might not be the same group as repairs an individual CI" | CMDB owner | verified | ServiceNow CSDM Foundation (Zurich) |
| 27 | Data Manager: task per Managed By Group; group approves when required | CMDB owner | verified | ServiceNow "Working with CMDB Data Manager" (Australia) |
| 28 | Standard change pre-authorized, low risk, relatively common, no peer/group/CAB approval; normal needs "assessment, peer or technical approval, and CAB authorization"; emergency goes "directly to the Authorization state for CAB approval" | CAB | verified | ServiceNow "Change types" (Zurich, updated Sep 10, 2026) |
| 29 | CAB workbench: CAB manager schedules, manages meetings and agenda, records notes | CAB | verified | ServiceNow "CAB meeting management using the CAB workbench" (Brazil) |
| 30 | Mapping of change types to the program's tempo; L4 and reauthorization aren't CAB decisions | CAB | restated-as-design | Book 13 Ch09/Ch10; Book 14 Ch10 |
| 31 | CAB membership; CAB doesn't accept risk; separate from governance board | CAB | restated-as-design | Built on CM-3(4), SP 800-128 §2.4; Book 13 Ch09 |
| 32 | Security ops decides alert triage and incident-driven revocation; acting playbook needs CISO approval | Security operations | verified (internal) | Book 04 Ch06 matrix; Book 12 Ch10 |
| 33 | System owner decides remediation; ISSO impact analysis and CAB attendance | System owner and ISSO | restated-as-design | Book 12 Ch10; SP 800-37 ISSO duties |
| 34 | AO's four day-two decisions | AO | restated-as-design | Book 13 Ch09; Book 14 Ch10 |
| 35 | Artifact ownership table and review cadences | Catalog and runbook ownership | restated-as-design | Program design; identity-verification owner per Book 01 Ch09 |
| 36 | Responsibility matrix (32 rows) and row comments | Matrix | restated-as-design | Consistency checked row by row against the chapters above |
| 37 | Separations 1–6 | Keeping the roles apart | restated-as-design | AC-5, CM-5, CM-9(1), SP 800-37 cited where external |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none assigned) | — | New chapter. Role vocabulary drawn from the published Who chapters and this book's Chapters 03–07 and Appendix A; no source page content was carried |
