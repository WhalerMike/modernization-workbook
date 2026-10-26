# Verification — Chapter 06, Contingency Planning and Business Continuity

Writer W3. Source: `docs/compliance/Vol_IV_Book_01_Business_Continuity.md` (archived after the build; not linked). Primary sources opened October 21, 2026: the SP 800-53 Rev. 5 OSCAL catalog 5.2.0 and Low/Moderate/High baseline profiles (parsed locally); FedRAMP Full Rev5 Control Reference, Contingency Planning page, and Rev5 Control Guidance page; the FedRAMP ruleset JSON v2026.10.13.01; NIST SP 800-34 Rev. 1 PDF (text extracted) and its CSRC page; OMB Circular A-130 PDF; 44 U.S.C. §3554 (Cornell LII); CISA Federal Incident Notification Guidelines; CISA Telecommunications Service Priority page; Microsoft Learn pages on SQL Server availability groups, Microsoft 365 Multi-Geo, Microsoft 365 data resiliency (overview, Exchange Online, SharePoint/OneDrive, data corruption), Microsoft 365 Backup, Graph PowerShell device management cmdlets, Graph national cloud endpoints and Connect-MgGraph, Az.Storage cmdlets, Log Analytics workspace replication and Azure Monitor Logs reliability, Microsoft Sentinel BCDR, Azure region pairs, Azure regions list, Azure Backup security overview and best practices, Azure Site Recovery overview and test failover; AWS pages on Amazon Connect (Connect Customer) Global Resiliency, Route 53 DNS failover, the Get-R53HealthCheckList and Get-R53HealthCheckStatus cmdlet references, AWS Backup and AWS Elastic Disaster Recovery; Oracle OCI Full Stack DR "Overview of Disaster Recovery Plans"; Broadcom KB 313905.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CP-2 satisfied by an approved, distributed, tested, updated plan, not by infrastructure | Opening | verified (CP-2 a–h text) | OSCAL CP-2 |
| 2 | FISMA requires continuity plans and procedures | Opening | verified (§3554(b)(8)) | Cornell §3554 |
| 3 | A-130: develop and test contingency plans; recover to a known state | Opening | verified | A-130 App. I §4.g |
| 4 | Infrastructure built in prior volumes (DDI Grid, SD-WAN, SQL AG geo-DR, break-glass, SIEM) | Opening | restated (volume numbers replaced with workbook book links; claims about each book checked against the books: Book 02 emergency access accounts, Book 06 availability groups, Book 12 tamper-protected log copies) | Workbook books |
| 5 | CP baseline membership table (CP-1 … CP-10(2)) | Baseline table | verified (NIST from OSCAL profiles; FedRAMP classes from the 2026 CP page) | OSCAL; FedRAMP CP page |
| 6 | CP-5 withdrawn | Baseline table | verified | OSCAL (status withdrawn) |
| 7 | "CP-1 policy and procedures is an agency-level artifact out of scope" | Baseline table | corrected (CP-1 in L M H and B C D; policy level is a selection: organization, mission or system) | OSCAL CP-1; FedRAMP CP page |
| 8 | CP-6, CP-7, CP-8 begin at Moderate | Baseline table | verified | OSCAL profiles; FedRAMP CP page |
| 9 | CP-4(2), CP-9(2), CP-9(5) High only (Class D) | Baseline table | verified | OSCAL profiles; FedRAMP CP page |
| 10 | FedRAMP parameters only on CP-2(3) and CP-10(4), both deferring to SLAs; no CP-4 or CP-9 values | Baseline table | verified | FedRAMP CP page; Rev5 Control Guidance page |
| 11 | "Confirm the FedRAMP-defined CP-4 test type... at Moderate, tabletop exercises are generally accepted as the minimum" | Testing | corrected (FedRAMP defines none; SP 800-34 recommends a functional exercise with restore from backup for Moderate) | FedRAMP CP page; SP 800-34 §3.5 |
| 12 | SP 800-34 Rev. 1 current edition (May 2010, updated Nov 11, 2010) | Planning process | verified (no Rev. 2 on the CSRC page) | CSRC SP 800-34r1 page |
| 13 | Seven-step planning process | Planning process | verified | SP 800-34 Ch. 1 and Ch. 3 |
| 14 | Related plans (BCP, COOP, crisis communications, cyber IR, DRP, OEP) | Planning process | verified | SP 800-34 §2.2; A-130 fn. 88 |
| 15 | BIA three steps | BIA | verified | SP 800-34 §3.2 |
| 16 | MTD, RTO, RPO definitions; RTO normally shorter than MTD; RPO not part of MTD | BIA | verified (quoted) | SP 800-34 §3.2 |
| 17 | POA&M when RTO can't meet an inflexible MTD | BIA | verified | SP 800-34 §3.2 |
| 18 | MEF-supporting systems must meet MTD of 12 hours or less per FCD-1 | BIA | verified (as SP 800-34 fn. 19 states it; FCD-1 itself not opened) | SP 800-34 §3.2 fn. 19 |
| 19 | Work Recovery Time; RTO + WRT < MTD | BIA | restated-as-design (term not in SP 800-34; the guide's equivalent wording quoted) | SP 800-34 §3.2 |
| 20 | Five-step BIA method, interview questions, transaction-rate analysis, dependency mapping | BIA | restated-as-design | — |
| 21 | BIA example table | BIA | restated-as-design (illustrative values; "emergency services coordination" example generalized to a contact center) | — |
| 22 | Mission owner signs; MTD not adjusted to fit RTO | BIA callout | restated-as-design (with SP 800-34 POA&M link) | SP 800-34 §3.2 |
| 23 | SP 800-34 plan structure: Introduction, ConOps, Activation/Notification, Recovery, Reconstitution, appendices | Plan sections | verified (five components: supporting information, three phases, appendices) | SP 800-34 Ch. 4 |
| 24 | Seven working sections | Plan sections | restated-as-design | — |
| 25 | Plan approved by AO; re-approval after Sections 3–5 change | Section 1 | restated-as-design (CP-2 a.7 leaves approvers to the organization) | OSCAL CP-2 |
| 26 | Recovery priorities, assumptions | Section 2 | restated-as-design | — |
| 27 | Keep personal phone numbers out of the plan body | Section 2 | carried; tied to CP-2(h) protection | OSCAL CP-2 |
| 28 | Roles: CPC, recovery leads, management team, vendor directory, external stakeholders | Section 3 | restated-as-design | — |
| 29 | Activation thresholds, decision authority, notification timetable | Section 4 | restated-as-design | — |
| 30 | Notify CISA "within the required reporting window" | Section 4 | verified/specified (one hour of identification by top-level CSIRT, SOC or IT department) | CISA guidelines |
| 31 | CP-2(c) coordinate with incident handling | Section 4 | verified | OSCAL CP-2 |
| 32 | Component recovery summary table with durations and criteria | Section 5 | restated-as-design (durations to come from tests; MFA-bypass criterion replaced with logged and reviewed emergency use) | — |
| 33 | SD-WAN "3–5 minutes (automatic); all spoke sites show active BGP via backup DIA" | Section 5 | restated (BGP detail dropped; record observed time) | — |
| 34 | Manual workaround for the contact center | Section 5 | restated-as-design | — |
| 35 | Reconstitution decision, failback order, data sync before failback, validation checklist, deactivation, AAR in 5 days, updates in 30 | Section 6 | restated-as-design; CP-10 known state and CP-10(2) verified; SP 800-34 validation data/functionality testing verified | OSCAL CP-10; SP 800-34 §4.4 |
| 36 | Annual review and triggers; ISSO owns review; distribution | Section 7 | restated-as-design; SP 800-34 review guidance and CP-2(f) verified | SP 800-34 §3.6; OSCAL CP-2 |
| 37 | CP-6 and CP-6(1) text | CP-6 | verified | OSCAL |
| 38 | CP-9, CP-9(1), CP-9(8) text | CP-9 | verified | OSCAL |
| 39 | A replica is not a backup (corruption and ransomware replicate) | CP-6/CP-9 | restated-as-design (supported by Microsoft's own lagged-copy and backup guidance) | Microsoft Learn Exchange resiliency |
| 40 | Synchronous replica RPO near zero; async lag "under 60 seconds and bounded by the configurable maximum replication lag setting" | Databases | corrected (no such AG setting documented; Microsoft: gap typically small, can become substantial; async failover is forced with possible data loss) | Microsoft Learn AG availability modes and failover modes |
| 41 | CP-6(1) requires a different region, not an availability zone | Databases | restated (CP-6(1) asks for sufficient separation "to reduce susceptibility to the same threats"; FedRAMP CP-7(1) guidance lets the provider decide, noting separation matters less for cyber attack) | OSCAL; FedRAMP CP page |
| 42 | Azure Backup: isolated vault storage, immutable vaults, soft delete 14–180 days, MUA with Resource Guard | Databases | verified | Microsoft Learn Azure Backup security overview; best practices |
| 43 | "Multi-geo data residency configuration replicates content to a secondary geo location"; verify multi-geo for CP-6 | Microsoft 365 | corrected (Multi-Geo is a data-residency add-on placing data in chosen geographies; not replication; US is one geography) | Microsoft Learn Multi-Geo overview |
| 44 | "Microsoft's SLA defines the replication commitment" | Microsoft 365 | removed (replaced with documented resiliency architecture) | — |
| 45 | Exchange DAG copies across datacenters in the same territory, at least three, lagged copy | Microsoft 365 | verified | Microsoft Learn Exchange Online data resiliency |
| 46 | SharePoint/OneDrive files written simultaneously to primary and secondary region | Microsoft 365 | verified | Microsoft Learn SharePoint/OneDrive data resiliency |
| 47 | Microsoft backs up only system documentation; most data loss from customer actions | Microsoft 365 | verified | Microsoft Learn data corruption; data resiliency overview |
| 48 | Microsoft 365 Backup available for GCC | Microsoft 365 | verified | Microsoft Learn Microsoft 365 Backup overview |
| 49 | Inherited resiliency documented in provider package | Microsoft 365 | restated-as-design (link Book 10 Ch11) | — |
| 50 | Export device management policies via Graph, `Get-MgDeviceManagementDeviceCompliancePolicy`, scope `DeviceManagementConfiguration.Read.All` | Config baselines code | verified; script extended with `Get-MgDeviceManagementDeviceConfiguration` and `-All` | Microsoft Learn cmdlet references |
| 51 | GCC uses graph.microsoft.com; GCC High graph.microsoft.us via `-Environment USGov` | Config baselines | verified | Microsoft Learn Graph deployments; Connect-MgGraph |
| 52 | "Upload to secondary Key Vault storage"; "store in a secondary region Key Vault" | Config baselines | corrected (Key Vault holds secrets, keys, certificates; script writes to a storage account) | Microsoft Learn Az.Storage cmdlets |
| 53 | `New-AzStorageContext -UseConnectedAccount`, `Set-AzStorageBlobContent -File -Container -Blob -Context -Force` | Config baselines code | verified | Microsoft Learn Az.Storage references |
| 54 | The two cmdlets don't cover every Intune policy type (settings catalog via another resource) | Config baselines | restated (stated as a check for the reader; settings catalog resource not separately verified) | — |
| 55 | Arc extension packages and baselines in a secondary-region storage account; application catalog available from secondary region | Config baselines | not carried (unverified product claims; Book 05 linked) | — |
| 56 | "Geo-redundant Log Analytics workspace" as CP-9 evidence | Audit logs | corrected (workspace replication is paid, manual switchover, listed commercial region groups only; Sentinel guidance for US government clouds: two workspaces) | Microsoft Learn workspace replication; Sentinel BCDR |
| 57 | Annual CP-6 restore test procedure | Testing the storage site | restated-as-design; tied to CP-9(1) | OSCAL CP-9(1) |
| 58 | CP-7 text and enhancements; FedRAMP CP-7(1) guidance | CP-7 | verified | OSCAL; FedRAMP CP page |
| 59 | "The CSP's FedRAMP ATO covers both regions, satisfying the requirement for a formally authorized alternate processing environment" | CP-7 | corrected (to be verified per service and per agency authorization, not assumed) | — |
| 60 | Region pair doesn't by itself provide DR; Microsoft-managed GRS failover only in catastrophic situations | CP-7 | verified | Microsoft Learn region pairs |
| 61 | "Region pair selected per CSP disaster recovery guidance"; Azure Government region pairs | CP-7 | not carried as specific pairs (Azure regions list covers public cloud only; reader pointed to Book 10) | Microsoft Learn regions list |
| 62 | Documented RTO from the last DR test, not design estimates | CP-7 | restated-as-design | — |
| 63 | ASR replication, recovery plans, non-disruptive test failover | CP-7 | verified | Microsoft Learn ASR overview; test failover |
| 64 | CP-7(3) priority of service "typically addressed through the FedRAMP authorization" | CP-7 | removed (unsupported) | — |
| 65 | Amazon Connect failover "uses DNS-based health checks with automatic routing policy changes" | Contact center | corrected (Global Resiliency: replica instance, traffic distribution group, 10% increments; limited commercial region pairs; access via SA/TAM; monthly testing recommended; current docs call it Connect Customer Global Resiliency) | AWS Connect admin guide |
| 66 | Route 53 health checks and failover routing for web endpoints | Contact center | verified | AWS Route 53 DNS failover |
| 67 | Script used `Get-R53HealthCheck -Region` to list checks and `$Status.HealthCheckObservations` | Contact center code | corrected (`Get-R53HealthCheckList` lists; `Get-R53HealthCheckStatus -HealthCheckId` returns HealthCheckObservation collection; module AWS.Tools.Route53) | AWS cmdlet references |
| 68 | CP-8, CP-8(1)(a)(b) including TSP, CP-8(2) text | CP-8 | verified | OSCAL |
| 69 | TSP is an FCC program managed by CISA for NS/EP organizations, prioritizing provisioning and restoration | CP-8 | verified | CISA TSP page |
| 70 | SD-WAN overlay supplies CP-8 resumption; two circuits alone resume nothing; brownout blindness of dual-homing | CP-8 | restated-as-design (attributed to the program; Book 09 Ch05 linked); "Closure Necessity" doctrine name dropped | Book 09 Ch05 |
| 71 | Per-class steering "completes in under a second," BFD liveness | CP-8 | removed as a stated fact (vendor-dependent); replaced with "record observed thresholds and cutover" | — |
| 72 | Circuit inventory with 99.9% / 99.5% SLAs | CP-8 | restated (placeholders; SLA percentages not carried) | — |
| 73 | SD-WAN orchestrator REST scripts (two) | CP-8 code | restated (one script, explicitly placeholder API; flagged in warning callout) | — |
| 74 | CP-4 text | Testing | verified | OSCAL CP-4 |
| 75 | SP 800-34 TT&E by impact level (tabletop low; functional with restore from backup moderate; full-scale with failover high) | Testing | verified (quoted) | SP 800-34 §3.5 |
| 76 | Year 1 tabletop / Year 2 functional / Year 3 full cycle | Testing | corrected and restated-as-design (functional exercise each year for Moderate after a first-year tabletop) | SP 800-34 §3.5 |
| 77 | Moderate template attests testing at least annually | Testing | verified | SP 800-34 App. A.2 |
| 78 | Assessors request plan, test evidence, training evidence; four test artifacts | Testing | restated-as-design; tied to CP-2(e), (g) and CP-4(b), (c) | OSCAL |
| 79 | Assessors suspicious of clean results; deliberate complications | Testing | restated-as-design | — |
| 80 | Ransomware tabletop scenario, agenda, metrics | Tabletop | carried as program material; IR-first point added (link Book 12 Ch11) | — |
| 81 | AAR template and findings tracker | AAR | carried (finding IDs generalized) | — |
| 82 | CP-3 text; tabletop covers annual training; onboarding must be added | Training | verified; SP 800-34 training guidance quoted | OSCAL CP-3; SP 800-34 §3.5.2 |
| 83 | Multi-cloud: Azure Backup + ASR; AWS Backup + Elastic Disaster Recovery; OCI Full Stack DR; VMware SRM / vSphere Replication | Multi-cloud | verified/updated (VMware Live Site Recovery, formerly SRM; Live Recovery now VCF Protection and Recovery per Broadcom KB; vSphere Replication not carried) | Microsoft Learn; AWS docs; Oracle docs; Broadcom KB 313905 |
| 84 | "Management-Plane Coordination Doctrine"; Multi-Cloud Evidence Fabric | Multi-cloud | restated-as-design (doctrine and fabric names dropped; evidence contract linked) | Book 12 Ch02 |
| 85 | CP-4/CP-9/10 metrics "roll up through the fabric to CISA CDM and the continuity KSIs" | Multi-cloud | removed (no source for CDM continuity rollup; KSIs bind providers) | — |
| 86 | Series integration table (volume → capability → CP contribution) | — | not carried as a table (volume identifiers; contributions folded into the opening and sections with book links) | — |
| 87 | KSI-RPL (Recovery Planning) and KSI-INR alignment | KSI section | verified/corrected (four RPL indicators ABO, ARP, RRO, TRC with statements and control mappings; bind providers; dashboard question kept as program design) | FedRAMP ruleset JSON |
| 88 | Control closure table | Controls and evidence | restated (condensed; corrected per rows above) | As cited |
| 89 | Requirement/design table | Final table | verified / restated-as-design per row | As cited |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, internal banner, draft-proposal box, Date Code | — | Internal metadata and agency shortcodes; not carried |
| What This Document Addresses | Opening | Volume numbers replaced with book links; CP-1 scope corrected |
| Technology Without a Plan Fails CP-2 — What Assessors Actually Check | Opening; Testing (four artifacts) | — |
| What a DR Runbook Is and Is Not | Opening; "The plan, section by section" and diagram | — |
| BIA Methodology — Purpose and Scope (MTD, RTO, RPO, WRT) | "The business impact analysis" | WRT restated as program design |
| Conducting the BIA — Steps 1–5, interview questions, BIA table | "The business impact analysis" (five steps; table) | Example generalized |
| BIA Values Require Mission-Owner Signature (callout) | Callout in BIA section | — |
| CP-2 Contingency Plan Document Structure (intro) | "The plan, section by section" intro | Mapped to SP 800-34's five components |
| Section 1: Introduction (1.1–1.6) | Section 1 | Record-of-changes table summarized |
| Section 2: Concept of Operations (2.1–2.4) | Section 2 | — |
| Section 3: Roles and Responsibilities (3.1–3.5) | Section 3 | Vendor table summarized in prose |
| Section 4: Activation and Notification (4.1–4.4) | Section 4 | Notification steps tabulated; CISA timing specified |
| Section 5: Recovery Procedures (5.1–5.3, appendix cross-references) | Section 5 | Volume cross-references replaced with descriptions |
| Section 6: Reconstitution (6.1–6.5) | Section 6 | — |
| Section 7: Plan Maintenance (7.1–7.3) | Section 7 | — |
| Alternate Storage Site (CP-6) — What CP-6 Requires | CP-6/CP-9 section | — |
| Structured Data (Database Tier) | "Databases" | Replication-lag claim corrected; backup behind replica added |
| Unstructured Data (Files, Collaboration Content) | "Microsoft 365 content" | Multi-Geo claim corrected |
| Application Binaries and Configuration Baselines (with PowerShell) | "Configuration baselines" (corrected script) | Arc and app-catalog claims not carried |
| Validating CP-6 Compliance | "Testing the storage site" | — |
| Alternate Processing Site (CP-7) — Cloud-Native Workloads | CP-7 section | ATO-covers-both-regions and CP-7(3) claims corrected/removed |
| SQL Server Alternate Processing | CP-7 section (one paragraph) | — |
| Network and SD-WAN Alternate Processing (with PowerShell) | CP-8 section | Circuit-status script merged into the single placeholder path-quality script |
| Amazon Connect Multi-Region Failover (with PowerShell) | "The contact center" (corrected mechanism and script) | — |
| Telecommunications Service Redundancy (CP-8) — Requirements | CP-8 section | TSP added from CP-8(1)(b) |
| SD-WAN Dual Underlay as CP-8 Implementation; Closure Necessity callout; path-quality PowerShell | CP-8 section | Doctrine name dropped; sub-second claim removed |
| CP-8 Documentation Block for CP-2 | CP-8 circuit inventory and documentation list | SLA percentages not carried |
| Contingency Plan Testing (CP-4) — What FedRAMP Assessors Expect | Testing section | Tabletop-at-Moderate claim corrected |
| Annual Test Cycle | Testing section | Corrected to SP 800-34 levels |
| Tabletop Exercise: Ransomware Scenario (scenario, objectives, agenda, metrics) | "A ransomware tabletop" | IR coordination point added |
| After-Action Report Template | "The after-action report" | — |
| Multi-Cloud Continuity and Disaster Recovery | "More than one cloud" | VMware name updated; CDM rollup removed |
| Integration with the Volume I, II, and III Books (table and note) | Opening; Section 5 appendices; cross-links | Volume identifiers dropped |
| NIST SP 800-53 Rev 5 Control Closure (table) | "The controls and their evidence" | Condensed and corrected |
| FedRAMP 20x Key Security Indicator Alignment (callout) | "FedRAMP's recovery planning indicators" | Corrected to the 2026 indicator IDs and provider scope |

## Source watch, October 26, 2026

Re-checked after the weekly source watch (issue #160) reported a change in a cited source. Checked October 26, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| `c06-oci`: the Oracle page moved; same title ("Overview of Disaster Recovery Plans") and the same DR-plan-as-automated-runbook statement at the new address | URL updated |
