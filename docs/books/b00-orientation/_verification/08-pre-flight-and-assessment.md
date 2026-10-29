# Verification — Chapter 08, Pre-Flight: Platform and Assessment

Writer: W4. Source: `docs/operational-guides/program-management/master-project-plan.md` (the master plan; `aspirational: true`), sections 2.4, 3 and 4, plus the dependency, sprint, glossary and appendix material that bears on Phase 0. Book 01 Chapters 03, 10 and 12, Book 10 Appendix B and Book 03 Chapter 06 read as settled facts. All checks October 21, 2026.

Alignment note: Chapter 05 (W3) places plan generation and approval (master plan weeks 7–8) and pre-pilot readiness (week 9) after G0, and the platform host's Arc connection in Book 01's Phase 1. This chapter follows that: G0 = platform host operational, assessment committed (M-008 to M-010), no open priority-one findings; M-011, M-012 and M-013 are G1 evidence (Chapter 09); M-007 must finish by G1.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows Server 2025 is the current LTSC; available 2024-11-01; mainstream to 2029-11-13; extended to 2034-11-14 | Platform host | verified | Microsoft Learn, Windows Server release information |
| 2 | Gitea runs as a Windows service (`sc.exe`, `web` command, `app.ini`) | Platform host | verified | Gitea docs, Register as a Windows Service |
| 3 | IIS reverse proxy for Gitea uses URL Rewrite and ARR, backend 127.0.0.1:3000 | Platform host | verified | Gitea docs, Reverse Proxies |
| 4 | Gitea supports PostgreSQL (and MySQL, MSSQL, SQLite) | Platform host | verified | Gitea Configuration Cheat Sheet |
| 5 | Gitea on Windows Server 2025 behind IIS as "the" platform | Platform host | restated-as-design: the program's reference design, not the only option (Book 10 App B compares options) | Brief; Book 10 App B |
| 6 | Server sizing 4 vCPU / 8 GB / 100 GB | M-001 | restated-as-design (master plan's sizing) | — |
| 7 | "CIS Level 1 hardened" | M-001 | verified and qualified: CIS publishes a Windows Server 2025 benchmark (v2.1.0, Sept 2026); Level 1 member-server/DC profiles listed for v1.0.0; or the agency's mandated baseline | CIS benchmarks page; CIS Sept 2026 update (search results) |
| 8 | Registering Gitea needs Entra ID Global Admin | M-004 | corrected: least-privileged role is Cloud Application Administrator (create enterprise app); Application Developer when registration is restricted | Microsoft Learn, Least privileged roles by task |
| 9 | CA policy report-only initially, yet "MFA enforced" exit criterion | M-004 | corrected sequencing: Microsoft recommends ≥1 week report-only before enforcement; enforce before G0 | Microsoft Learn, Plan a CA deployment |
| 10 | "Guest Configuration" policies on Arc | M-007 | corrected: renamed Azure machine configuration; agent built into the Connected Machine agent | Microsoft Learn, Arc cloud-native governance; Machine configuration prerequisites |
| 11 | PowerShell 7.x | M-001 / assessment | corrected: PowerShell 7.6 LTS to 2028-11-14; 7.4 ends 2026-11-10 | Microsoft Learn, PowerShell Support Lifecycle |
| 12 | Gitea LDAP (BindDN) and OIDC sources; redirect URI pattern | M-003, M-004 | verified | Gitea docs, Authentication |
| 13 | pre-receive, update, post-receive hooks | Repository conventions | verified (invoked by git-receive-pack, i.e., on push) | git-scm githooks |
| 14 | Custom Git hooks disabled by default in Gitea | Repository conventions | verified (added) | Gitea Cheat Sheet, `DISABLE_GIT_HOOKS` default true |
| 15 | Branch protection via update hook | Repository conventions | corrected/qualified: Gitea protected branches natively provide push allowlists, approvals, status checks, signed commits, force-push ban | Gitea docs, Protected branches |
| 16 | Hook rejects "FOUO" markings | Repository conventions | corrected: FOUO is a legacy marking superseded by CUI; match CUI markings and keep matching legacy ones | NARA CUI FAQ |
| 17 | Mirrored commits governed by hooks; post-receive validates mirror timestamp (R-018) | Repository conventions | corrected: pull mirror updates by fetch, receive hooks run only on push; mirror is a quarantine copy; drift reporter checks last sync | git-scm githooks; Book 10 App B F.1 (settled) |
| 18 | Mirror default interval 8h, minimum 10m; can't convert existing repo to pull mirror | Repository conventions | verified (added) | Gitea Cheat Sheet; Gitea Repository Mirror |
| 19 | Branch strategy, naming convention, status lifecycle | Repository conventions | restated-as-design | — |
| 20 | Assessment run layout `assessments/<run-id>/` | Repository conventions | restated per Book 01 Ch10 (settled), replacing master plan's `assessments/readonly|full/{domain}/{timestamp}/` | Book 01 Ch10 |
| 21 | RSAT on Windows 11 as Features on Demand | Step 1 | verified (added; capability name) | Microsoft Learn, Install and manage RSAT |
| 22 | Read-only orchestrator captures "approximately 87%" of value; remaining 13% delegated | Step 1 | restated-as-design (program estimate); Book 01 Ch10 shows default read is broad | Book 01 Ch10 (settled) |
| 23 | Delegation: "DNS zone read, PKI CA Admin read, deleted objects read, GPO backup rights" | Step 2 | corrected/narrowed: DNS server settings and CA database via Tier B; never CA administrator role; GPO read only where filtering hides a GPO | Book 01 Ch10 (settled) |
| 24 | `Backup-GPO -All` backs up all GPOs | Step 2 | verified | Microsoft Learn, Backup-GPO |
| 25 | Deleted objects in "AD recycled objects container" | Step 2 | corrected: Deleted Objects container; default visible only to System/Administrators; delegate LCRP with dsacls; retention = tombstone lifetime (+ deleted-object lifetime with Recycle Bin) | Microsoft Learn, Let nonadministrators view deleted objects container |
| 26 | ESC1–ESC8 | Step 3 | corrected: named patterns extend beyond ESC8 (MDI covers ESC1, ESC4, ESC8, ESC15 among others) | Microsoft Learn, Security assessment: Certificates |
| 27 | Defender for Identity findings via Secure Score | Step 3 | verified (categories; license; CA assessments need sensor on AD CS) | Microsoft Learn, MDI security posture assessments |
| 28 | PingCastle / Purple Knight import | Step 3 | restated generically ("third-party AD assessment tools the agency already runs"); product names not verified, not carried | — |
| 29 | Privileged access audit items (AdminCount, Kerberoastable, AS-REP, PNE, >90 days) | Step 3 | restated-as-design (audit scope); techniques defined in master plan glossary | — |
| 30 | Severity classes and deadlines | Step 3 | restated-as-design, mapped to gates; Critical tightened to "closed or AO-accepted by G0" per Book 01 G0 | Book 01 Ch12, Ch09 (settled) |
| 31 | Eight plans and their classifications | Step 4 | restated-as-design, with corrections linked: hybrid join as waypoint; servers to Arc (Intune doesn't manage Windows Server); dMSA path; locator zones last; Cloud PKI only for Intune-enrolled devices; attribute authority from HR | Book 05 Ch02/09; Book 01 Ch10; Book 08 Ch10; Book 07 App B; Book 03 Ch06 (settled) |
| 32 | FMP assessment functions (`Export-FMP*`, `Test-FMPReadAccess`, etc.) | Domains table | restated-as-design: program's planned module set (master plan §13 lists them as work to build) | — |
| 33 | 12 domains vs Book 01's 11 streams; missing DHCP, LDAP/SPN map, transaction profiles | Twelve domains | restated-as-design (program requires the union) | Book 01 Ch10 (settled) |
| 34 | 23 deliverables = 15 assessment + 8 plans | Deliverables | verified by count against master plan §4.3 | Source |
| 35 | G0 authority: steward, backup sponsor; steering committee reviews | G0 | verified against settled facts | Book 01 Ch12, Ch09 |
| 36 | Destroy assessment workstation after Phase 1 (R-021) | Deliverables | restated: rebuild or retire after initial assessment; continuous re-assessment from the platform host at Tier A | Book 01 Ch10 (settled) |
| 37 | Week counts (3 weeks platform, 6 weeks assessment) | Where pre-flight sits | restated-as-design (illustrative), set beside Book 01's four-week Phase 0 | Book 01 Ch12 |

| 38 | Addition, Oct 25, 2026: G0 checklist gains a Direction group: a provisional target end state, and the no-new-AD-dependency rule in the change process | G0 | verified against settled facts | Book 01 Ch12 Phase 0 (Microsoft Learn sources there); Book 13 Ch04 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, document ID/classification/boundary table | — | Not carried: classification and boundary stamps are not used in the workbook; document ID is archival |
| Companion document corpus (12 documents) | — | Not carried: the companion guides are now books (linked in place); listing archived titles would point at archived pages |
| §1 Executive summary, core principle "Assessment before action" | Ch08 "Where pre-flight sits" | Pillars, 48 milestones, 52 weeks, timeline table → Ch05 (W3) |
| §1 Diagram FMP-MPP-D001 (Gantt) | — | Ch05 (W3) territory; replaced by house-style diagrams |
| §2.1–2.3 Roles, decision framework, cadence | — | Ch07 (W3) |
| §2.4 Artifact management: branches, naming, status lifecycle | Ch08 "Repository conventions" | — |
| §3 Phase 0 objective and reference documents | Ch08 "The platform host" | Reference-document list not carried (archived companions) |
| §3.1 Milestone table M-001–M-007 | Ch08 "Seven build milestones" (table kept, corrected) | — |
| §3.2 Task breakdowns T-001.1–T-007.4 | Ch08 milestone table, "Key tasks" column; build detail via Book 10 App B | Hours, per-task dependencies and companion § references not carried (program-level view; companion guides archived) |
| §3.3 Phase 0 exit criteria checklist | Ch08 "Platform checklist" (kept, corrected) and G0 checklist | — |
| §4 Critical-phase callout; reference documents | Ch08 "The read-only assessment" | Reference list not carried |
| §4.1 Assessment scope table (12 domains) | Ch08 "Twelve domains" (kept, plus Book 01 stream column) | Companion § references replaced by Book 01 stream mapping |
| §4.2 Week 4 tasks T-4.1–T-4.6, M-008 | Ch08 Step 1 | Hours not carried |
| §4.2 Week 5 tasks T-5.1–T-5.6, M-009 | Ch08 Step 2 | Hours not carried |
| §4.2 Week 6 tasks T-6.1–T-6.7, M-010 | Ch08 Step 3 and finding-class table | — |
| §4.2 Week 7 plans T-7.1–T-7.8, M-011 | Ch08 Step 4, eight-plans table (kept, corrected) | — |
| §4.2 Week 8 review T-8.1–T-8.5, M-012 | Ch08 Step 5 | Hours not carried |
| §4.2 Week 9 pre-pilot T-9.1–T-9.7, M-013 | Ch09 "Foundation build and pre-pilot readiness" | Moved: builds in the target tenant (Phase 1) |
| §4.3 Assessment deliverables summary (23 rows) | Ch08 "The twenty-three deliverables" (kept, with Book 01 layout column) | — |
| §5–§7 Phases 2–4 | Ch09 | — |
| §8–§9 Cutover, steady state | Ch10 (W5) | — |
| §10 Risk register | Appendix A (W5) | R-001, R-002, R-018, R-019, R-021 reflected in Ch08 text |
| §11 Dependency table, critical path, parallelizable milestones | Ch08 (Phase 0 parallelism and critical path sentence) | Full table and critical path → Ch05 (W3) |
| §11 Diagrams D002, D003 | — | Replaced by house-style diagrams in Ch05/Ch08/Ch09 |
| §12 Budget and resources | — | Ch05 (W3) |
| §13 Copilot Code next steps, sprints, module architecture | Ch08 (functions named as "planned module set") | Sprint plan and module tree not carried: build backlog for a tool, not program guidance; tool name not used |
| §14 Follow-on document roadmap | — | Not carried: superseded by the books |
| §15 Companion cross-reference matrix | — | Not carried: companions archived; books linked instead |
| Appendix A milestone register (M-001–M-013) | Ch08 milestone table and steps | Status column (all PLANNED) not carried |
| Appendix B assessment calendar | Ch08 five steps (sequence preserved) | Week-by-week Gantt grid not carried; sequence is in the step order |
| Appendix C RACI | — | Ch07 (W3) |
| Appendix D gate review template | Ch08 links Ch05 | Assumed carried by Ch05 (W3); flagged to editor |
| Appendix E glossary | Terms used in place (ARR, LDAPS, OIDC, PAW, RSAT, AS-REP, Kerberoasting) | Glossary itself not carried; site glossary is the editor's |
| Compliance amendment (PL-2, RA-3) | — | Appendix A (W5) |

## Cross-chapter consistency pass

Checked October 21, 2026. Book 00's chapters were reconciled with each other; each external fact touched was re-opened on its primary source.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| X1 | Steward approves each plan; steering committee review is an input, not a signature | Step 5 | clarified; aligned with Ch07 and Ch09 | Internal: Ch07 decision matrix |
| X2 | Assessment workstation sanitized under SP 800-88 Rev. 2 (was "rebuilt or retired") | The twenty-three deliverables | corrected; aligned with Appendix A R-021 | csrc.nist.gov SP 800-88 r2 final page (Date Published September 2025; history 09/26/25 Final; supersedes Rev. 1, 12/17/2014; no withdrawal or successor listed), fetched Oct 21, 2026 |
| X3 | RADIUS/NPS inventoried separately from Book 01's eleven streams; charter criterion 1 requires all eleven dependency types (incl. RADIUS) by G0; G0 checklist item added | Twelve domains; Gate G0; takeaway 4 | gap closed | Internal: B01 Ch10 "The eleven ingestion streams"; B00 Ch03 criterion 1; B00 Ch04 principle 4; B09 Ch07 "The RADIUS server is the Active Directory dependency" and inventory step (line 208) |

## Start Kit link, October 27, 2026

The workbook now ships a read-only implementation of the assessment. Checked October 27, 2026; no personal data sent to any site.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| S1 | Added a "Start Kit" column naming the kit's collector for each of the twelve domains, and the download and GitHub links; the planned `FMP` names stay specifications | Twelve domains | added | examples/start-kit (PR in this change); tests/powershell, 118 Pester tests passing on Windows PowerShell 5.1 and PowerShell 7, Oct 27, 2026 |
| S2 | Added that the kit covers DHCP, the Kerberos SPN map, LDAP binding events and the SQL Server count, and that transaction profiles and RADIUS/NPS remain separate work | Twelve domains, paragraph after the table | added | Same; README "What it counts" and "Known limits" |
| S3 | Step 1: `Invoke-FMPStartKit.ps1` runs `Test-FMPReadAccess` and the orchestrator, writes a summary of counts and drafts the delegation request | Step 1 | added | Same; `tests/powershell/StartKit.Tests.ps1`, `ADAssessment.Tests.ps1` (pre-flight) |

## Start Kit RADIUS and NPS inventory, October 27, 2026

The Start Kit gained a read-only RADIUS and NPS collector. Microsoft sources opened October 27, 2026: KB5040268 (events 4418 to 4421, requireMsgAuth and limitProxyState), the NPS SDO attribute pages (NP-Authentication-Type, NP-Allowed-EAP-Type, Auth-Provider-Type, Auth-Provider-Name), "Setting Up the Extension DLLs" (AuthSrv\Parameters) and "Export an NPS Configuration for Import on Another Server". No personal data sent to any site.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| N1 | S2's "RADIUS/NPS remain separate work" replaced: the kit inventories RADIUS and NPS with `Invoke-FMPNpsInventory`; transaction profiles remain separate | Twelve domains, paragraph after the table | corrected | examples/start-kit (PR in this change); tests/powershell, 152 Pester tests passing on Windows PowerShell 5.1 and PowerShell 7, Oct 27, 2026; README "How it inventories RADIUS and NPS" |
| N2 | G0 checklist RADIUS item names the kit's output (`NPS\PolicyGroups.csv` and companions) | Gate G0 | added | Same; `tests/powershell/NpsInventory.Tests.ps1` |

## Start Kit transaction profiles, October 29, 2026

The Start Kit gained transaction profiling. Microsoft source opened October 29, 2026: sys.dm_exec_connections (Transact-SQL), for the num_reads and connect_time columns and the VIEW SERVER STATE / VIEW SERVER PERFORMANCE STATE requirement. No personal data sent to any site.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| T1 | N1's "transaction profiles remain separate" replaced: the kit builds them with `Invoke-FMPTransactionProfile` from a team-supplied catalog and measured round trips; budgets and target round-trip times stated as program inputs | Twelve domains, paragraph after the table | corrected | examples/start-kit (PR in this change); tests/powershell, 197 Pester tests passing on Windows PowerShell 5.1 and PowerShell 7, Oct 29, 2026; README "How it builds transaction profiles" |
| T2 | G0 checklist transaction-profile item links Book 01 Ch10 and names the kit's output (`transaction-profiles\`, `SeparationGate.csv`) | Gate G0 | added | Same; `tests/powershell/TransactionProfile.Tests.ps1` |