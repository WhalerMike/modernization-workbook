# Verification — Chapter 05 (The Program Plan: Phases and Gates)

File covered: `05-the-program-plan.md`.
Diagram sources: `docs/images/diagrams/b00-orientation/src/ch05-phase-mapping.flow.yaml`, `ch05-workstreams.flow.yaml`.
All sources opened on October 21, 2026. Microsoft Learn pages were fetched or searched through the Microsoft Learn MCP tools; the FedRAMP timeline page through WebFetch. Book 01 Chapter 12 (canonical phases and gates) and Chapter 09 (gate owners) were read in full before writing.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Book 01's seven phases and six gates are canonical; names and gate labels | §One plan; §Seven phases; figure | verified | Book 01 Ch12 (settled fact per brief) |
| 2 | Gate owners: steward G0, G1, G4, co-signs G2; sponsor + steering committee G3; sponsor + CIO G5 | §Seven phases | verified | Book 01 Ch09 and Ch12 |
| 3 | Master plan: 48 milestones, illustrative 52 weeks, every transition gated by review, approval and commit | §One plan | verified (source-internal) | Master plan §1 |
| 4 | Master plan phase numbering 0 platform, 1 assessment, 2 design, 3 pilot, 4 scale, 5 cutover, 6 steady state, with weeks | Mapping table | verified (source-internal) | Master plan timeline summary |
| 5 | Master plan's cutover keeps AD for authentication; no AD DS retirement phase | Mapping table; §Mapping | verified (source-internal) | Master plan §8.2 item 13 ("AD remains for auth") and §8.1 |
| 6 | Master plan's 52 weeks don't include AD DS retirement; Book 01's do (Phase 5, weeks 45–48), steady state at week 49 | §Mapping | verified | Master plan timeline; Book 01 Ch12 |
| 7 | Reference design: Gitea on Windows Server 2025 behind IIS, AD and Entra sign-in; not the only option | §One plan | restated-as-design | Brief instruction; master plan §3 |
| 8 | Five guiding constraints | §Constraints | restated-as-design | Short project plan §2 |
| 9 | "Assessment before action" principle | §Constraints | restated-as-design | Master plan §1 core principle |
| 10 | Parallel workstreams; sequential execution roughly doubles duration | §Workstreams | verified | Book 01 Ch12 (linked) |
| 11 | Pillars-to-workstreams alignment; policy and access plane have no pillar | §Workstreams | restated-as-design | Master plan §1 (five pillars) vs Book 01 Ch12 workstream table |
| 12 | Critical path and parallelizable milestones | §Critical path | verified (source-internal), restated in Book 01 phases | Master plan §11.2 |
| 13 | PKI depends on identity: CBA needs synced, mapped objects | §Critical path | verified (source-internal); consistent with Book 07 Ch07 | Master plan §11.2 key dependency |
| 14 | Conditional Access requires Entra ID P1 | License table | verified | Learn, "Microsoft Entra licensing" |
| 15 | PIM requires Entra ID P2 or Entra ID Governance | License table | verified | Learn, "Microsoft Entra licensing" (PIM section) |
| 16 | Risk-based Conditional Access / ID Protection requires P2 | License table | verified | Learn, "Microsoft Entra licensing" (CA, ID Protection) |
| 17 | Master plan: access reviews require P2 | License table | corrected | Learn, "Microsoft Entra licensing": access reviews for member users require Entra ID Governance; some capabilities operate with P2 |
| 18 | Lifecycle Workflows require Entra ID Governance | License table | verified | Learn, "Microsoft Entra licensing" |
| 19 | HR-driven provisioning available with P1 | License table | verified | Learn, "Microsoft Entra licensing" (Provisioning table) |
| 20 | Cloud PKI requires a subscription in addition to Intune Plan 1 or 2 (Intune Suite or standalone add-on) | License table | verified | Learn, "Overview of Microsoft Cloud PKI"; "Use Microsoft Intune Suite add-on capabilities" |
| 21 | From July 2026 Microsoft 365 E5 and E7 include Cloud PKI | License table; takeaways | verified (corrects master plan's "Intune Suite" only) | Learn, "Microsoft Intune planning guide," Step 3 |
| 22 | Defender for Identity licensing: M365 E5/G5, EMS E5, standalone | License table | verified | Learn, "Microsoft Defender service description"; "Defender for Identity for US Government offerings" |
| 23 | Azure Arc management services at no extra cost with Windows Server SA or pay-as-you-go; other servers pay as they go | License table | verified | Learn, "Modernize server management from Configuration Manager to Azure Arc" |
| 24 | DNS Private Resolver inbound and outbound endpoints, each in a dedicated subnet | License table | verified | Learn, "What is Azure DNS Private Resolver?" |
| 25 | Master plan dollar figures (VM, resolver, storage) | §Licenses | removed | Brief: avoid exact prices; not verified |
| 26 | Government-cloud feature availability lags commercial | §Licenses | verified by link | Book 10 Ch04 (linked, not re-footnoted) |
| 27 | Reference infrastructure sizes (4 vCPU, 8 GB, 100 GB; temporary PAW) | §Infrastructure | restated-as-design (illustrative) | Master plan §12.2 |
| 28 | FedRAMP Consolidated Rules mandatory January 1, 2027; new Rev5 applications end June 11, 2027 | §External clocks | verified | FedRAMP, "Important Dates for the Consolidated Rules for 2026" |
| 29 | FedRAMP certifies providers; agency authorizes its own systems | §External clocks | verified by link | Book 01 Ch12 (footnoted there to FedRAMP "Using a FedRAMP Certified Cloud Service") |
| 30 | Six project-level success measures; mapping of each to gates | §Success | restated-as-design | Short project plan §7; gate mapping is the chapter's synthesis |
| 31 | Five immediate next actions | §First five actions | restated-as-design | Short project plan §8 |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Short project plan §1 Overview (current to target state; approach verbs; phases with objectives, deliverables, entry/exit) | Ch05 §One plan, three altitudes | — |
| Short plan §2 Guiding constraints | Ch05 §The constraints every phase obeys | — |
| Short plan §3 Phase 0 Charter and alignment (activities, deliverables, exit) | Ch05 §Seven phases (entry work of Phase 0); mapping table | Supporting-material links not carried (they point at chapters the book links directly) |
| Short plan §3 Phase 1 Current-state assessment | Ch05 mapping table; detail to Ch08 (W4) | Activity list duplicates Ch08 and Book 01 Ch10 |
| Short plan §3 Phase 2 Target architecture definition | Ch05 mapping table; Ch09 (W4) | Drift taxonomy detail lives in Book 01 Ch11 |
| Short plan §3 Phase 3 Domain playbooks and wave planning | Ch05 mapping table; Ch09 (W4) | — |
| Short plan §3 Phase 4 Pilot / first wave | Ch05 mapping table; Ch09 (W4) | — |
| Short plan §3 Phase 5 Progressive rollout and steady-state governance; exit criteria | Ch05 mapping table and §How success is measured (closure conditions) | — |
| Short plan §4 Domain workstreams table | Ch05 §Five workstreams (table, with pillar and book columns added) | — |
| Short plan §5 Governance and decision rights | Ch07 §Who decides what | — |
| Short plan §6 Risks and mitigations | Ch05 §Risks that shape the plan | Full register is App A (W5) |
| Short plan §7 Success measures | Ch05 §How success is measured | — |
| Short plan §8 Immediate next actions | Ch05 §The first five actions | — |
| Short plan footer (no decision-record identifiers) | Ch05 success measure 6 | — |
| Reference twin: Purpose | Ch05 §One plan (the "one-page reference structure") | — |
| Reference twin: Phases table (0–5 with typical gates) | Ch05 §One plan; mapping logic | Not given its own column: its phases are a subset of the short plan's and the brief asks for one mapping table |
| Reference twin: Deliverables per phase | Ch05 mapping table (deliverables per master-plan phase) | Duplicates master plan |
| Reference twin: Governance (sponsor and owner, change control, risk review, gate evidence) | Ch07 §Who decides what; §The gate review | — |
| Master plan front matter and document-control block (ID, classification, boundary, draft status, companion-document corpus) | — | Classification/boundary stamps and internal document identifiers are not carried (style rules); companion documents are archived sources |
| Master plan §1 Executive summary (five pillars, seven phases, 48 milestones, 52 weeks, assessment-before-action, 23 deliverables, eight plans) | Ch05 §One plan; §Constraints; §Workstreams | 23 deliverables / twelve domains detail to Ch08 (W4) |
| Master plan Program timeline summary | Ch05 mapping table | — |
| Master plan Gantt and phase-transition diagram placeholders (D001, D003) | Replaced by ch05-phase-mapping house-style diagram | Old placeholders not reused |
| Master plan §2.1–2.4 Governance structure | Ch07 | — |
| Master plan §3–§9 phase detail (milestones, tasks, exit checklists, pilot criteria, rollback, scaling risks, cutover checklist, steady-state operations, SLAs) | Summarized in Ch05 mapping table; detail to Ch08–Ch10 (W4, W5) | Owned by other writers |
| Master plan §10 Risk register | App A (W5); five headline risks in Ch05 §Risks | — |
| Master plan §11 Dependency map, milestone dependency table, critical path, parallelizable milestones | Ch05 §The critical path; ch05-workstreams diagram | Milestone-by-milestone dependency table not reproduced; summarized in Book 01 phases |
| Master plan §12.1 License requirements | Ch05 §Licenses (corrected) | Prices removed |
| Master plan §12.2 Infrastructure requirements | Ch05 §Infrastructure | Prices removed |
| Master plan §12.3 People requirements | Ch07 §The people the program needs | — |
| Master plan §13 Next-step sprints and module architecture | Ch08 (W4) | Tool-specific build backlog for one agent; module names are W4's |
| Master plan §14 Follow-on document roadmap | Ch05 §Infrastructure (replication guide only) | Remaining follow-on documents are internal backlog |
| Master plan §15 Companion document matrix | — | Points to archived companion documents |
| Master plan App A Milestone register | Ch08–Ch10 (W4, W5) | — |
| Master plan App B Assessment calendar | Ch08 (W4) | — |
| Master plan App C RACI | Ch07 §The workstream RACI | — |
| Master plan App D Gate review template | Ch07 §The gate review | — |
| Master plan App E Glossary | — | Glossary terms are defined in the books that use them; its expansion of the program acronym is not carried (naming rule) |
| Master plan Compliance amendment (PL-2 traceability, RA-3 register) | App A (W5) | — |
