# Verification — Chapter 07, Who Owns Zero Trust

Writer W4. New chapter (no direct source page); built on the pattern of Book 09 Chapter 09, with role content drawn from the governance principles paper's ask list, the whole-agency unification paper (§3, "agency-level ownership cannot be delegated to any CSP tool"), the ScubaGear integration paper (§7, drift to the AO) and the Zero Trust Assessment guide (output handling). All sources opened October 21, 2026. Federal documents read as PDFs (pdftotext) or HTML; Microsoft and CISA tool documentation read from GitHub at the pinned tags.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ZTMM: adoption needs senior leadership, IT staff, data and system owners, users; move stove-piped staff into coordinated strategy with agency-wide buy-in | Opening | verified | ZTMM v2.0 §4 |
| 2 | M-22-09: whole "C-suite" aligned; zero trust strategy implementation lead within 30 days | Opening; program lead | verified | M-22-09 §II/§III intro |
| 3 | ZTMM does not address risk acceptance (among others) | Why the posture needs an owner | verified | ZTMM v2.0 §5 (scope paragraph) |
| 4 | ZTMM "general guide," not strict requirements | Same | verified | ZTMM v2.0 §5 |
| 5 | AO only official who can accept risk; approves POA&Ms; determines significant change; inherent government function | Same; AO role | verified | SP 800-37r2 App. D |
| 6 | AO designated representative can't accept risk | AO role | verified | SP 800-37r2 App. D |
| 7 | AO determines degree of assessor independence | AO role; assessors | verified | SP 800-37r2 App. D, "Control Assessor" |
| 8 | ScubaGear: omissions only if approved in risk management process; omissions and incorrect marks can create blind spots | Decision rights | verified | ScubaGear v1.8.0 configuration.md |
| 9 | BOD 25-01: AOs may accept risk for deviations; agencies identify and explain deviations when reporting | Decision rights; AO; matrix comment | verified | BOD 25-01 page |
| 10 | CIO designates SAISO, maintains policy, reports to agency head; CIO and AOs allocate resources | CIO role | verified | SP 800-37r2 App. D |
| 11 | CISO = SAISO, carries out CIO security responsibilities, liaison to AOs, system owners, CCPs, SSOs | CISO role | verified | SP 800-37r2 App. D |
| 12 | ZTA report and export folder contain sensitive info threat actors could use; share only with authorized personnel | CISO role | verified | Learn ZTA get-started |
| 13 | Source said "both tools' documentation" says this | CISO role | corrected | Only Microsoft's ZTA docs say it; ScubaGear handling stated as the program's rule |
| 14 | System security officer role (plans, change impact) | ISSO | verified | SP 800-37r2 App. D |
| 15 | M-22-09 organizes goals by CISA's five pillars and three cross-cutting themes | Pillar owners | verified | M-22-09 §III intro |
| 16 | Common control provider responsibilities incl. POA&Ms for deficient common controls | Pillar owners | verified | SP 800-37r2 App. D |
| 17 | M-26-14 rescinded M-21-31; logs readily available to top-level SOC; logs identify identity used and privilege-level changes | SecOps; roles note | verified | M-26-14 body and App. B items 2, 5(a), 5(d) |
| 18 | BOD 25-01: deploy SCuBA tools; report continuously or quarterly in machine-readable format | Assessment operators | verified | BOD 25-01 required action 2 |
| 19 | Three reporting routes: CyberScope quarterly, CISA-hosted ScubaConnect, agency-hosted ScubaConnect at least quarterly | Assessment operators | verified | BOD 25-01 implementation guidance |
| 20 | Control assessor role definition | Assessors | verified | SP 800-37r2 App. D |
| 21 | SP 800-53 CA-2(1), CA-7(1) independent assessors | Assessors | verified | SP 800-53r5 OSCAL catalog 5.2.0 |
| 22 | ZTA outputs may contain tenant configuration and personal information | Privacy/records | verified | ZTA PowerShell guide, Prerequisites |
| 23 | ScubaGear roles: Global Reader for most products; Power Platform Administrator with "Power Apps for Office 365" license | Roles table | verified | ScubaGear v1.8.0 interactive.md |
| 24 | ZTA roles: Global Reader (Graph), Security Reader (protection policies), SharePoint Administrator, Azure Reader; consent via Cloud App Admin/App Admin/PRA; high-privilege account for consent only | Roles table and note | verified | ZTA PowerShell guide, Permissions and roles |
| 25 | Learn get-started: Global Admin consent, later runs as Global Reader (and lists four roles in prerequisites) | Roles note | verified; inconsistency recorded | Learn ZTA get-started; program follows the repository guide |
| 26 | ZTA telemetry on by default, carries tenant ID, `-DisableTelemetry` | Roles note | verified (new) | ZTA PowerShell guide, Data handling and telemetry |
| 27 | ZTMM Governance definition "within and across pillars" | Pillar table | verified | ZTMM v2.0 §5 |
| 28 | SCuBA/ZTA overlap mostly Entra; both stop at Microsoft's platform | Why the posture needs an owner | restated-as-design | Settled in Ch05/Ch06; linked, not re-footnoted |
| 29 | Program lead, score definition, correlation owner, Tier-0 plane, approval-by-expiry rule, matrix, roles tables | Throughout | restated-as-design | Program's recommended model |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Governance principles: Ask ("name a cross-pillar correlation owner"; "assign agency-level ZT ownership separate from any CSP"; "time-box privileged access") | Ch07 "Why the posture needs its own owner," program lead role, roles table; Ch10 "this quarter" | — |
| Governance principles: Leadership takeaway (own and assess at agency level; tools don't substitute for authority) | Ch07 opening and native-tool matrix row | — |
| Whole-agency unification §3 "agency-level ownership cannot be delegated to any CSP's tool" | Ch07 "Why the posture needs its own owner" | Argument itself is Ch01/Ch06 (W1, W2) |
| Whole-agency unification §2 fourth fact (unification layer is highest-value target; privileged controls, own telemetry, blast radius) | Ch07 identity-plane owner role | Full argument in Ch06 (W2) |
| ScubaGear integration §7.2 (exceptions in canon) and §7.4 (drift to AO) | Ch07 matrix rows and comments; detail in Ch10 | — |
| ZTA assessment guide: Controlled-data callout; first run Global Admin, later Global Reader | Ch07 CISO role, roles table and notes (corrected to the repository guide's narrower roles) | — |
| Book 09 Ch09 pattern (roles, D/R/C matrix, comments, owner table, roles-in-systems, what changes) | Ch07 structure | — |
