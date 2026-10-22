# Verification — Chapter 07 (Who Runs the Program)

File covered: `07-who-runs-the-program.md`.
Diagram source: `docs/images/diagrams/b00-orientation/src/ch07-governance-structure.flow.yaml`.
All sources opened on October 21, 2026. NIST SP 800-37 Rev. 2, M-22-09 and M-19-17 PDFs were downloaded and read as extracted text; the Gitea documentation through WebFetch. Book 01 Chapter 09 was read in full and is linked rather than repeated.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three role vocabularies (charter/plan, master plan, Book 01) and their mapping | §Three vocabularies | verified (source-internal) | Charter §9; short plan §5; master plan §2.1; Book 01 Ch09 |
| 2 | Master plan names no AO, app owners, HR or records officer | §Three vocabularies | verified (source-internal) | Master plan §2.1, App C |
| 3 | AO is the only official who can accept security and privacy risk; AO designated representative can't make the authorization decision | §Who decides what | verified | SP 800-37 Rev. 2, App. D |
| 4 | Master plan: risk acceptance by security lead + steward jointly | Decision table | corrected | SP 800-37 Rev. 2, App. D (AO only) |
| 5 | Short plan: sponsor approves acceptance of residual risk | §Who decides what | corrected | SP 800-37 Rev. 2, App. D; Book 01 Ch09 |
| 6 | Master plan: steward is decision authority at every gate | Decision table; §Gate review | corrected | Book 01 Ch09 and Ch12 gate authority |
| 7 | Master plan: budget/license by steward + organizational leadership | Decision table | corrected (to sponsor and CIO, steward prepares) | Book 01 Ch09 matrix (scope, funding: sponsor decides) |
| 8 | Control requirements decided by CISO; CA design to them | Decision table; RACI | restated-as-design (consistent with Book 01 Ch09) | Book 01 Ch09 matrix |
| 9 | 48-hour review period for decision records | Decision table | restated-as-design (illustrative) | Master plan §2.2 |
| 10 | Workstream RACI assignments | §Workstream RACI | verified (source-internal), with "decided above" column added | Master plan App C; Book 01 Ch09 matrix |
| 11 | Attribute meaning decided by HR | RACI | restated-as-design | Book 01 Ch09 matrix; Book 03 Ch07 |
| 12 | Records officer consulted before decommissioning DCs, AD FS, sync | RACI note | verified by link | Book 01 Ch09 (GRS 3.2, 36 CFR 1220.34 footnoted there) |
| 13 | Meeting rhythm (daily, weekly, biweekly, gate 90 min; weekday rhythm; monthly gate review; two red weeks escalate) | §The rhythm | verified (source-internal) | Master plan §2.3; Book 01 Ch12 cadence |
| 14 | Gate review agenda, checklist, five criteria, three decision outcomes | §The gate review | verified (source-internal) | Master plan App D |
| 15 | Gate criteria evaluated from repository and drift data | §The gate review | verified | Book 01 Ch12 |
| 16 | Branch strategy, naming convention, status lifecycle | §Repository | restated-as-design | Master plan §2.4 |
| 17 | Gitea protected branches: required approvals, push/merge allowlists, required status checks, block on requested changes, prevent admin bypass | §Repository | verified | Gitea docs, "Protected Branches" |
| 18 | 5.5 FTE people estimate by role | §People | restated-as-design (illustrative) | Master plan §12.3 |
| 19 | Estimate omits app owners, help desk, HR, records, CISO/AO time | §People | restated-as-design | Book 01 Ch09 roles |
| 20 | Cross-train two per workstream | §People | restated-as-design | Master plan R-013 |
| 21 | AO is inherently governmental, government personnel only | §Keeping the roles apart | verified | SP 800-37 Rev. 2, App. D |
| 22 | Avoid conflicts of interest when one person holds multiple RMF roles | §Keeping the roles apart | verified | SP 800-37 Rev. 2, footnote 113 |
| 23 | Decide/act separation; gated actuation | §Keeping the roles apart | verified by link | Book 01 Ch11 |
| 24 | M-22-09: zero trust strategy implementation lead within 30 days; "entire C-suite" aligned | §Federal roles | verified | M-22-09 §III (introduction) |
| 25 | M-19-17: integrated agency-wide ICAM office, team or governance structure | §Federal roles | verified | M-19-17, Governance item 1 |
| 26 | Neither memo says who decides when a forest retires | §Federal roles | restated-as-design | Same; consistent with Book 01 Ch09 |
| 27 | Projects report into program governance; identity charter decision rights | §Complementary projects | verified (source-internal) | Identity charter §9; all charters §9 |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Charter §9 Governance and ownership (sponsor, lead, domain leads, decision rights) | Ch07 §Three vocabularies; §Who decides what | The rest of the charter is Ch03 (W2) |
| Short plan §5 Governance and decision rights (four bullets) | Ch07 §Who decides what | Residual-risk bullet corrected |
| Reference twin: Governance bullets | Ch07 §Who decides what; §The gate review | — |
| Master plan §2.1 Roles and responsibilities | Ch07 §Three vocabularies (table) | Per-role technology lists summarized |
| Master plan §2.2 Decision framework | Ch07 §Who decides what (table, corrected) | — |
| Master plan §2.3 Communication cadence | Ch07 §The rhythm | — |
| Master plan §2.4 Artifact management (branches, naming, status lifecycle) | Ch07 §The repository as the program's memory | Example branch names not carried |
| Master plan §12.3 People requirements | Ch07 §The people the program needs | — |
| Master plan R-013 key personnel risk | Ch07 §People (mitigation) | Full register is App A (W5) |
| Master plan App C RACI matrix | Ch07 §The workstream RACI (relabeled phases, added decider column) | — |
| Master plan App D Phase gate review template | Ch07 §The gate review | Blank form fields (date, attendees, paths) described, not reproduced |
| Book 01 Ch09 (program-wide decision matrix, roles) | Linked throughout | Not duplicated, per brief |

## Cross-chapter consistency pass

Checked October 21, 2026. Book 00's chapters were reconciled with each other; each external fact touched was re-opened on its primary source.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| X1 | Plan review and approval: the steward approves (plans are governance artifacts whose status is the steward's per the decision matrix); the steering committee reviews only | Workstream RACI | corrected (was "Steering committee approves"); Ch07 decision matrix made canonical; Ch08 step 5 and Ch09 Phase 1 aligned | Internal: Ch07 roles table (steering committee reviews drift trend and gate readiness) and decision matrix (governance artifacts: steward) |
