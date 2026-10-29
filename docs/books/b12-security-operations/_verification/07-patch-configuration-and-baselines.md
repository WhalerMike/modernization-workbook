# Verification — Chapter 07, Patch, Configuration and Hardening Baselines

Checked October 21, 2026 by writer W4. Sources: `docs/compliance/Vol_III_Book_03_Patch_Systems_Management.md` (Date Code 2026-07-19; 3,502 words) and `docs/compliance/Vol_VI_Book_06_Configuration_Baselines_Hardening.md` (Date Code 2026-07-09; 1,028 words). Microsoft facts were checked through the Microsoft Learn MCP tools; AWS facts on docs.aws.amazon.com; Oracle on docs.oracle.com; VMware on techdocs.broadcom.com; Red Hat on docs.redhat.com; CISA and FedRAMP pages fetched directly; NIST control text from the OSCAL SP 800-53 Rev. 5 catalog, release 5.2.0. The FedRAMP Key Security Indicators page was downloaded and its indicator IDs and control mappings extracted as text.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Actuation is platform-native; governance is unified" | Opening | restated-as-design | Program doctrine; doctrine name dropped |
| 2 | SI-2 a–d text | Shared-responsibility line | verified | SP 800-53 r5.2.0 |
| 3 | BOD 26-04 guidance: IaaS full agency responsibility; PaaS and SaaS splits; provider must report outstanding vulnerabilities | Shared-responsibility line | verified | BOD 26-04 implementation guidance |
| 4 | Service-model table and scoping rule | Shared-responsibility line | restated-as-design | Grounded in claim 3 |
| 5 | FedRAMP VDR/VER mandatory Dec 7, 2026 | Shared-responsibility line | verified | FedRAMP NTC-0014 |
| 6 | CM-8 a.1–a.3 quoted | CM-8 precondition | verified | SP 800-53 r5.2.0 |
| 7 | BOD 23-01 7-day discovery, 14-day enumeration | CM-8 precondition | verified | BOD 23-01 page |
| 8 | KSI-PIY-GIV text and CM-8 mapping | CM-8 precondition; controls | verified | FedRAMP KSI page (20x Class C) |
| 9 | Source: "This is the CISA BOD 23-01 obligation" (one join key) | CM-8 precondition | restated-as-design | BOD 23-01 requires discovery and enumeration, not a single join key |
| 10 | Handoff contract (one priority queue; per-CSP scanner is a source) | Handoff | restated-as-design | — |
| 11 | Update Manager: Windows/Linux in Azure, on-premises, other clouds; maintenance windows; on-demand; periodic assessment every 24 hours; dynamic scoping; Arc, SQL Server enabled by Arc, VMware via Arc | Actuation | verified | Update Manager overview |
| 12 | Hotpatch on Arc WS2025 Datacenter/Standard; reboot only for baseline about every three months | Actuation | verified | Cloud-native patch management with Arc |
| 13 | Arc-enabled hotpatch for WS2025 at no extra cost | Actuation | verified | Enable Hotpatch for Arc-enabled servers |
| 14 | Azure Local patching through Update Manager | Actuation matrix | verified | What's new in Azure Update Manager (Nov 2023) |
| 15 | Update ring policies support Pro, Pro Education, Enterprise, Education, IoT Enterprise (not Windows Server) | Actuation | verified | Manage Windows Update ring policies |
| 16 | Expedite policies bypass deferrals for eligible security updates | Actuation | verified | Expedite policies for Windows quality updates |
| 17 | Source matrix: "WUfB / Autopatch; MECM/WSUS (legacy)" for Windows; "Intune" for macOS/mobile | Actuation matrix | corrected | Servers use Update Manager; clients Intune; WUfB "production ring" for DCs was a category error |
| 18 | SSM Patch Manager: EC2, edge, on-premises, VMs; Windows Server, Linux, macOS; Scan / Scan and install; patch policies, maintenance windows, Patch now; no major version upgrades; AWS doesn't test patches; publisher severity, not CVSS; point-in-time snapshot; compliant ≠ secure; Security Hub integration; S3 reports | Actuation; record | verified | Patch Manager user guide |
| 19 | Source: SSM Patch Manager not listed for macOS (matrix "—") | Actuation matrix | corrected | Patch Manager supports macOS |
| 20 | Kernel Live Patching on Amazon Linux 2 | Live patching | verified | Patch Manager user guide (topic list) |
| 21 | Source: "EC2 Image Builder (golden AMI)" in the hypervisor/firmware column | Actuation matrix | corrected | Image Builder builds guest images; the EC2 hypervisor is provider-patched. Not carried |
| 22 | OS Management Hub: updates and patches for OCI, private data centers, supported third-party clouds | Actuation | verified | OS Management Hub home |
| 23 | Ksplice: kernel patches without reboot on OCI; glibc and OpenSSL on Oracle Linux; in memory; doesn't replace package updates | Actuation; live patching | verified | Ksplice docs |
| 24 | Source: "Ksplice is a genuine capability difference" (implied unique) | Live patching | corrected | Hotpatch (WS2025 via Arc) and Kernel Live Patching (AL2) also exist; none removes the baseline |
| 25 | Source: "Autonomous DB — self-patching" | Actuation matrix | not carried | Not verified in this pass; generalized to "provider-patched" managed services |
| 26 | vLCM images update software and firmware in one operation; hardware support manager plug-in | Actuation | verified | Broadcom vSphere 8.0 firmware updates page |
| 27 | Source: "Workspace ONE" for VMware Windows/Linux/macOS | Actuation matrix | not carried | Client endpoint product outside this chapter; vendor/branding not verified |
| 28 | Satellite 6.19: content import and lifecycle, host package management, provisioning | Actuation | verified | Red Hat Satellite docs |
| 29 | Ansible Automation Platform as configuration/remediation actuation | Actuation; config state | restated (product role, no feature claim) | — |
| 30 | Hypervisor/firmware column has no cross-platform tool | Actuation | restated-as-design | Supported by claims 26 and Book 11 Ch06 |
| 31 | Unified record fields and mapping to Chapter 02 | Record | restated-as-design | Chapter 02 contract fields read from the chapter file |
| 32 | Update Manager results in ARG PatchAssessmentResources / PatchInstallationResources for Compute and HybridCompute | Record | verified | ARG query language, Resource Graph tables |
| 33 | Machine configuration compliance in guestconfigurationresources with per-setting reasons | Record; drift export | verified | View machine configuration compliance; ARG guest configuration samples |
| 34 | SSM EventBridge "Configuration Compliance State Change" (compliant / non_compliant); State Manager association state change events | Record; RHEL on AWS | verified | EventBridge event reference for Systems Manager |
| 35 | Inspector scans EC2, ECR images, Lambda; publishes to EventBridge and Security Hub; auto-closes remediated findings | Record; RHEL on AWS | verified | What is Amazon Inspector? |
| 36 | SI-2(2), SI-2(3) text | Record | verified | SP 800-53 r5.2.0 |
| 37 | Source: record "flows into CISA CDM" and "FedRAMP 20x KSI pipeline" | Record | restated | CDM link kept via Ch06/Ch12; KSIs reframed as provider indicators used as a model |
| 38 | CM-2 and CM-6 text ("most restrictive mode consistent with operational requirements") | Configuration state | verified | SP 800-53 r5.2.0 |
| 39 | Machine configuration (formerly Guest Configuration) audits/sets OS settings through DSC, scoped by Azure resource scope | Configuration state | verified | Remediation options; Book 05 Ch09 |
| 40 | State Manager definition; associations; runs SSM documents, MOF, Ansible, Chef | Configuration state | verified | State Manager user guide |
| 41 | Source: "VMware Aria Automation" as desired-state mechanism | Configuration state | not carried | Not verified in this pass |
| 42 | KSI-SVC-ACM and KSI-MLA-EVC text | Configuration state; controls | verified | FedRAMP KSI page |
| 43 | CM-6(1) and CM-6(2) text | Baseline lifecycle | verified | SP 800-53 r5.2.0 |
| 44 | Lifecycle table (author, assign, detect, reconcile) | Baseline lifecycle | restated-as-design | From Vol VI Book 06 |
| 45 | SCuBA binding under BOD 25-01 | Baseline lifecycle | verified (settled in Book 11) | Book 11 Ch04 |
| 46 | NIST National Checklist Program hosts some (mainly federal) checklists and links others | Baseline lifecycle | verified | NCP page |
| 47 | Azure compute security baselines as built-ins | Baseline lifecycle | verified (settled in Book 05 Ch09) | Book 05 Ch09 |
| 48 | Assignment types Audit, ApplyAndMonitor (default), ApplyAndAutoCorrect and their behavior | Machine configuration | verified | Assignment resources; Remediation options |
| 49 | AutoCorrect: "no way to report when a drift was automatically corrected" | Machine configuration | verified | Remediation options |
| 50 | Source YAML `enforcementMode: AuditThenRemediate` | Machine configuration | corrected | No such mode; restated as rollout sequence |
| 51 | Baseline YAML is the program's format | Machine configuration | restated-as-design | Labelled as not a Microsoft schema |
| 52 | Source rule IDs 2.3.1.1 and 18.9.x | Machine configuration | unverifiable | CIS benchmark is licensed content; IDs replaced with placeholders and a verify note |
| 53 | Drift-export KQL (based on Microsoft sample) | Machine configuration | verified (structure follows the published sample; `lastComplianceStatusChecked` dropped as unverified) | ARG guest configuration samples |
| 54 | Disconnected Arc server keeps guest assignments 14 days | Machine configuration | verified (settled in Book 05 Ch09) | Book 05 Ch09 |
| 55 | Deployment sequence and honest limits | Deployment; limits | restated-as-design | From Vol VI Book 06 |
| 56 | Overlay trade (Tanium, BigFix, Ivanti) | Overlay | restated-as-design | No authorization claim; Marketplace check |
| 57 | Source: native stacks "each FedRAMP-authorized CSP capabilities" | Accreditation | restated | Verify each at procurement (Book 10); not asserted |
| 58 | Source: customer-operated stacks accredited via "DISA STIG hardening, FIPS 140-3 validated modules" | Accreditation | restated-as-design | Kept as "agency-operated components, hardened and evidenced" without asserting product validations |
| 59 | CA-3 text | Accreditation | verified | SP 800-53 r5.2.0 |
| 60 | Hybrid agent = documented external connection | Accreditation | restated-as-design | — |
| 61 | Source "Phase 5 — The RedHat-on-AWS Estate Lands Here"; quote "VMs are currently RedHat in AWS..." | RHEL on AWS | restated | Phase label and internal quote dropped; three invariants and contract kept as design |
| 62 | Source: Satellite/AAP callbacks via "IntegrationHub via the in-boundary MID" | RHEL on AWS | restated-as-design | Generalized to "coordination layer's inbound integration" |
| 63 | Red Hat Insights excluded until authorization review | RHEL on AWS | restated-as-design | — |
| 64 | Source authorities table: SI-2(3) "BOD 26-04 four-variable model"; RA-5 "handoff from Book 11" | Controls | corrected | Book reference was a stale cross-reference; four factors verified in Ch06 |
| 65 | Source KSI mapping (SI-2 → KSI-SVC, KSI-MLA; CM-2/CM-6 → KSI-CMT; CM-8 → KSI-PIY) | Controls | corrected | 2026 KSIs: SVC-ACM, MLA-EVC, PIY-GIV, CMT-VTD (maps SI-02, CM-06(02)), SVC-EIS (maps SI-02(02)); vulnerability timeframes in VDR rules |
| 66 | KSIs written for providers, used as a model | Controls | restated-as-design | — |
| 67 | Source: "Generated from the series compliance spine ... render_authorities_table.py" | Controls | not carried | Internal tooling note |
| 68 | CM-6 discussion: common secure configurations can come from product developers, vendors, federal agencies, consortia and others; the agency chooses (no STIG requirement) | Baseline lifecycle | verified 2026-10-29 (Moderate-civilian sweep; coordinator fact pack) | SP 800-53 Rev. 5 OSCAL catalog |
| 69 | SCuBA covers Microsoft 365 and Google Workspace only | Baseline lifecycle | verified 2026-10-29 | CISA SCuBA project page |
| 70 | NCP checklists typically created by IT vendors for their own products; SP 800-70 Rev. 5 (May 2026) | Baseline lifecycle | verified 2026-10-29 | SP 800-70 Rev. 5; NIST NCP page |
| 71 | CIS Benchmarks list RHEL 9 3.0.0, Windows Server 2022 5.1.0 and 2025 2.1.0, Cisco IOS XE 17.x 2.2.1, AWS Foundations 7.1.0 | Baseline lifecycle | verified 2026-10-29 | CIS Benchmarks list |
| 72 | Source/earlier text "DISA STIGs and CIS Benchmarks are the usual sources"; lifecycle table, figure ch07-baseline-lifecycle and limits naming STIG | Baseline lifecycle; diagram | restated 2026-10-29: CIS, NCP and vendor guides are the civilian sources; STIG kept once as optional High-only reference; diagram box now "SCuBA, CIS, agency CM-6" | Brief (Moderate civilian, not DoD) |

## Carry-forward ledger

### Vol III Book 03 — Patch & Systems Management

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, Draft Proposal box, Date Code | — | Internal stamps; dropped |
| Provisional position box (temporary series slot) | — | Internal numbering note |
| Series Context box | Opening paragraphs | Plane number and doctrine name dropped |
| What This Document Addresses (question and answer) | Opening; diagram ch07-native-actuation-one-record | Platform list generalized (no agency) |
| The Shared-Responsibility Line Is the SI-2 Scoping Rule | "The shared-responsibility line is the SI-2 scoping rule" | Grounded in BOD 26-04 guidance |
| Scanner ≠ Remediation — the Handoff | "The scanner is not remediation: the handoff"; also Ch06 closing section | — |
| Actuation Is Platform-Native (matrix + two properties) | "Actuation is platform-native" | Matrix corrected (claims 17, 19, 21, 25, 27); Ksplice property corrected (claim 24) |
| Governance Is Unified — the Evidence Contract (fields) | "Governance is unified: the record" | Fields extended and mapped to Chapter 02 |
| The Join Key Is Authoritative Asset Identity — CM-8 Is the Precondition | "CM-8 is the precondition for SI-2 at scale" | BOD 23-01 attribution corrected (claim 9) |
| Configuration State, Not Just Patch Level | "Configuration state, not just patch level" | Aria dropped (claim 41) |
| The Cross-CSP Overlay Decision | "The cross-cloud overlay decision" | Added high-value-target note (design) |
| The Accreditation Substrate (Theme F) | "Accreditation and the boundary" | Theme label dropped; CA-3 grounding added |
| Phase 5 — The RedHat-on-AWS Estate Lands Here (invariants) | "Extending the contract to a second cloud: Red Hat on AWS" | Phase label, internal quote and volume numbers dropped |
| The 5.1 emission contract | Same section, emission table | Numbering dropped; ServiceNow-specific path generalized (claim 62) |
| The Insights decision | Same section, last paragraph | — |
| The 5.2 assessment feed — Inspector | Same section, assessment paragraph | Inspector facts verified (claim 35) |
| Closure Necessity — Remediation Has No Substitute | "Closure necessity: remediation has no substitute" | Merged with Vol VI closure necessity |
| NIST Control Closure — Authorities Closed Here (generated table) | "Controls and indicators" | Generated-table columns (evidence slot, tool-attestable) not carried; GitHub link to the volume |
| FedRAMP 20x KSI Alignment | "Controls and indicators", KSI paragraph | Corrected (claim 65) |
| Stack Selection Status note | "Accreditation and the boundary"; "The cross-cloud overlay decision" | Marketplace verification kept |
| References table | Footnotes (each re-opened) | Workspace ONE and Aria references not used |

### Vol VI Book 06 — Configuration Baselines & Hardening

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, Draft Proposal box, Date Code | — | Internal stamps; dropped |
| Series Context box | "The baseline lifecycle" opening | Volume/book numbering dropped |
| What This Document Addresses | "The baseline lifecycle" opening paragraph | — |
| The Baseline Lifecycle (table) | "The baseline lifecycle" table; diagram ch07-baseline-lifecycle | — |
| Deployable Artifacts (table) | "Configuration state, not just patch level" (mechanisms per platform); baseline sources paragraph | GCP OS Config and Chef/Puppet substitutions not carried (not in the program's estate; not verified) |
| Illustrative artifact — machine-config baseline with drift export (YAML) | "Azure machine configuration and the drift export" (corrected YAML + ARG drift query) | Mode corrected (claim 50); rule IDs placeholdered (claim 52) |
| SCuBA conformance packs paragraph | "Deployment sequence", SCuBA paragraph | — |
| Deployment (four steps) | "Deployment sequence" | — |
| Closure Necessity — an unenforced baseline is not a baseline | "The baseline lifecycle" opening; "Closure necessity" | — |
| Controls Operationalized | "Controls and indicators" | CM-7 left to the volume (host hardening roles) |
| Honest Limits | "Honest limits" | — |
| Cross-References (Vol III, VI-07, VI-08) | Chapter 02, Chapter 12 links | Volume numbers dropped; test-harness book not linked |
| Provenance | Warning callout and the "program's own format" statement | — |
