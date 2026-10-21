# Verification — Chapter 04, The Modernization Principles

Source: `docs/PRINCIPLES.md`. Writer W2. Checked 2026-10-21.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Synced users' extensionAttributes are on-premises mastered, read-only in cloud | P1, P3 | verified | Microsoft Graph, onPremisesExtensionAttributes (`[^c04-extattr]`) |
| 2 | Closure provenance doctrine; human-only closure is an exception | P2 | restated-as-design | Program doctrine |
| 3 | PIM eligible/time-bound/approval-based activation | P2, P14 | verified | MS Learn, What is PIM (`[^c04-pim]`) |
| 4 | AUs can't be nested; users and devices by dynamic rule, groups not | P3 | verified | MS Learn, Administrative units (`[^c04-au]`) |
| 5 | CA can target any group type including dynamic | P3 | verified | MS Learn, CA users and groups (`[^c04-ca-users]`) |
| 6 | Dynamic groups recommended for group-based licensing | P3 | verified | MS Learn, Learn about groups (`[^c04-groups]`) |
| 7 | Eleven AD dependency categories; six migration phases | P4 | verified (internal) | Book 02 Ch04 |
| 8 | Certificate auto-enrollment via GPO, enterprise CA in AD | P4 | verified | MS Learn, NPS auto-enrollment (`[^c04-autoenroll]`) |
| 9 | NPS uses AD DS as account database | P4 | verified | MS Learn, NPS overview (`[^c04-nps]`) |
| 10 | LDAP-bind applications stop working | P4 | restated-as-design | Self-evident consequence; Book 02 Ch04 adapter matrix |
| 11 | Eight core concepts | P5 | restated-as-design | Labelled as design positions |
| 12 | Hybrid join via SCP or GPO-pushed registry values | P6 | verified | MS Learn, hybrid join targeted deployment (`[^c04-hybrid-control]`) |
| 13 | Hybrid join not an end state; reset needed to Entra join | P6 | verified | MS Learn, Entra join types (`[^c04-join-types]`) |
| 14 | Governed path seven steps; eighth (exit plan) | P6 | restated-as-design | Program design; eighth step from Book 05 Ch02 |
| 15 | NTLM audit-only settings log what a block would deny | P7 | verified | MS Learn, Policy CSP LocalPoliciesSecurityOptions (`[^c04-ntlm-audit]`) |
| 16 | Reducing NTLM needs knowledge of app requirements; apps may still use NTLM | P7 | verified | MS Learn, NTLM overview (`[^c04-ntlm]`) |
| 17 | SP secret in GPO startup script readable through SYSVOL | P7 | verified (internal) | Book 05 Ch09 (footnoted there) |
| 18 | Exclude emergency access accounts from CA | P7, P9 | verified | MS Learn, Plan a CA deployment (`[^c04-ca-plan]`) |
| 19 | Domain unjoin separately sequenced from Arc onboarding | P7 | verified (internal) | Book 05 Ch09 |
| 20 | Match on employeeId; extensionAttributes can't be matching attribute | P8 | verified | MS Learn, Troubleshoot HR user update issues (`[^c04-hr-match]`) |
| 21 | "Match key populated before first full sync", one master per attribute, cutover is config change | P8 | restated-as-design | Program operating rules; consistent with Book 03 Ch04 |
| 22 | All applicable CA policies must be satisfied; block stops enforcement; grant controls require all by default; session controls after grants; report-only evaluated only in phase 1 | P9 | verified | MS Learn, Build a CA policy (`[^c04-ca-policies]`) |
| 23 | Exclude overrides include within a policy | P9 | verified; nuance added | MS Learn, CA users and groups (`[^c04-ca-users]`); source "exclusions are absolute" narrowed to "within a policy" |
| 24 | "Session controls are additive" | P9 | corrected (wording) | Restated as "session controls from every applicable policy apply"; strictest experienced is a consequence, per Book 04 Ch03 |
| 25 | Unpopulated attributes cause policy bypass | P9 | restated-as-design | Logical consequence of dynamic-group targeting |
| 26 | Compliance vs compliance: most restrictive | P10 | verified | MS Learn, Intune troubleshoot profiles (`[^c04-intune-conflicts]`) |
| 27 | Configuration profiles: "last write wins" | P10 | corrected | Conflicts are flagged and must be resolved manually (`[^c04-es-conflicts]`); matches Book 05 Ch07 correction |
| 28 | Endpoint security takes precedence over configuration profiles | P10 | corrected | Equal sources; conflict requires manual resolution (`[^c04-es-conflicts]`) |
| 29 | GPO vs MDM: last writer wins | P10 | corrected | GP wins unless MDMWinsOverGP=1, Policy CSP only; race condition elsewhere (`[^c04-mdmwins]`) |
| 30 | Drift loop six phases; Format/Value/Orphan/Phantom categories and severities | P11 | restated-as-design | Program defaults; scoped to attribute values so it doesn't contradict Book 03 Ch11 or Book 02 Ch05 classes |
| 31 | Arc-enabled SQL Server supports Entra auth from SQL Server 2022; managed identity removes secrets | P12 | verified | MS Learn, SQL Server enabled by Azure Arc (`[^c04-arc-sql]`) |
| 32 | Negotiate falls back to NTLM when SPN not found; sign-in usually succeeds | P12 | verified | MS Learn, Cannot generate SSPI context (`[^c04-sspi]`) |
| 33 | Education, training tracks, test-plan catalog | P13 | restated-as-design | Program design; home is planned B16 |
| 34 | ZTMM v2.0, April 2023: five pillars, three cross-cutting capabilities, four stages | P14 | verified | CISA ZTMM v2.0 PDF, text extracted (`[^c04-ztmm]`) |
| 35 | Tool-per-pillar programs stall at Initial or low Advanced | P14 | restated-as-design | Labelled as the program's observation (as Book 11 Ch02 treats it) |
| 36 | M-22-09 requires phishing-resistant MFA for staff, contractors, partners | P14 | verified | M-22-09 §III.A, PDF text extracted (`[^c04-m2209]`) |
| 37 | "Short token lifetimes are required" / "short-lived tokens" | P14, P15 | corrected | Microsoft found reduced lifetimes degrade UX/reliability without removing risk; CAE revokes on events, tokens up to 28 h (`[^c04-cae]`) |
| 38 | No maturity stage required by ZTMM or M-22-09 | P14 | verified (internal) | Book 11 Ch03 (settled fact) |
| 39 | NIST SP 800-207: data plane and control plane logically separate | P15 | verified | NIST SP 800-207 §3.4.1 item 5, PDF text extracted (`[^c04-sp800207]`) |
| 40 | Book 01 states principle 4 as "govern actively" | P15 | verified (internal) | Book 01 Ch12 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Intro paragraph and overview figure (principles-00-overview) | "How to read the principles" and new figure `ch04-principles-map` | Old figure replaced by house-style source with a "Carried in" column |
| §1 Single Source of Truth (four bullets, topology figure) | Principle 1 | Old principles-01 figure not reused; topology covered by `ch04-record-and-enforcer` |
| §2 Change Control and Provenance (MACD-R five clauses, Closure Provenance Doctrine, figure) | Principle 2 | principles-02 figure not reused (Book 01 Ch02/Ch11 carry the lifecycle) |
| §3 Attribute-Driven Structure | Principle 3 | — |
| §4 Directory Migration — The Hidden Surface (eleven categories, three silent failures, six phases) | Principle 4 | — |
| §5 Eight Core Concepts table | Principle 5 table | — |
| §6 Hybrid Join Without Governance (ungoverned vs governed, seven steps) | Principle 6 | Eighth step from Book 05 added |
| §7 Device and Server Modernization (four phases, four rules) | Principle 7 | — |
| §8 HR-Driven Lifecycle (five operating rules) | Principle 8 | — |
| §9 Conditional Access Principles (five rules, four operating rules) | Principle 9 | Session-control and exclusion wording tightened |
| §10 GPO Sunset Principles (three programs, assignment precedence, conflict rule) | Principle 10 | Precedence rules corrected in a table |
| §11 Drift Detection (loop, four categories, figure) | Principle 11 and `ch04-record-and-enforcer` | principles-11 figure not reused |
| §12 SQL Server Identity Transformation (destination, precondition, three states) | Principle 12 | — |
| §13 Education, Training, and Test Plans | Principle 13 | — |
| §14 Zero Trust Governance Principles (framing, five principles) | Principle 14 | "Short token lifetimes" corrected under P15 |
| §15 Modernization Journey Principles (five, record vs enforcer) | Principle 15 | "Short-lived tokens" corrected |
| Closing note (no internal branding) | Not carried | Editorial note, not content |
