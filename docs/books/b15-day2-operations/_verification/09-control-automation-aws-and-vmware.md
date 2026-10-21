# Verification — Chapter 09, Control Compliance Automation: AWS and VMware

Writer W6. Sources: `docs/compliance/Vol_VII_Book_06_AWS_Control_Compliance_Automation.md` and `docs/compliance/Vol_VII_Book_07_VMware_Control_Compliance_Automation.md` (whole pages). Kept consistent with Chapter 08 (loop, routes, BOD 26-04 clock, ServiceNow overlap), Book 12 Ch02 (evidence contract, join key), Ch07 (Patch Manager cautions, platform-native actuation, vLCM firmware), Ch08 (customer-operated VMware has no FedRAMP certification; AWS Config and Security Hub CSPM FedRAMP listings already checked there against the Marketplace dataset), Book 13 Ch10 (declared exception through a recorded privileged session), Book 10 Ch09 (feature register).

All sources opened October 21, 2026: AWS pages (docs.aws.amazon.com, aws.amazon.com What's New) and Broadcom pages (techdocs.broadcom.com, blogs.vmware.com) through WebFetch; ServiceNow pages through WebFetch. No FedRAMP status is stated in this chapter beyond Book 12 Ch08's (linked), so no new Marketplace lookup was needed. No personal data sent to any site.

Internal vocabulary translated: "Closure Necessity" callouts, "Authorities Closed Here" spine table, "Management-Plane Coordination Doctrine", "Vendor Currency Doctrine", "reconcile-exception queue", "Vol III/VI/VII Book NN", "Task 5", "Operator Runbook" task numbers, "cross-cloud whitepaper §4/§11", `{{< meta agency.short >}}` and the CR26 mirror/SHA discussion removed or replaced with links to published Book 12/13 chapters. The source's long "second-source citation review" notes and provenance passes (internal editorial history) are not carried.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Same five-step loop on every platform | Opening | restated-as-design | Chapter 08; Book 13 Ch10 |
| 2 | Customer-operated software has no FedRAMP certification; posture evidence is the agency's | Opening | verified via published Book 12 Ch08 (linked) | Book 12 Ch08 |
| 3 | Conformance pack definition (quoted); YAML template | Config | verified | AWS Config DG, Conformance Packs |
| 4 | Sample templates include FedRAMP Low/Moderate/High (2 parts) and NIST 800-53 rev 5 | Config | verified | AWS Config DG, sample templates |
| 5 | Conformance packs and organization deployment supported in both GovCloud Regions | Config | verified | AWS Config DG, Region support tables |
| 6 | Templates not designed to ensure compliance; check rule availability by Region (quoted) | Config | verified | AWS Config DG, sample templates |
| 7 | FedRAMP (Moderate) pack aligns to "a subset of the FedRAMP controls"; page doesn't state revision | Config | verified (intro and disclaimer read; full control table not read) | AWS Config DG, FedRAMP(Moderate) |
| 8 | Use the NIST 800-53 rev 5 pack as primary for a Rev. 5 system | Config | restated-as-design | — |
| 9 | Advanced queries export CI as CSV/JSON; `get-resource-config-history` for history | Config | verified | AWS Audit Manager availability change page (export section) |
| 10 | `get-conformance-pack-compliance-details`: filters, rule/resource fields under EvaluationResultQualifier, ConfigRuleInvokedTime, ResultRecordedTime | Config, code | verified | AWS CLI reference |
| 11 | Remediation via SSM Automation documents, manual or auto; Region list includes both GovCloud Regions | Config | verified | AWS Config DG, Remediation |
| 12 | GovCloud user guide: "SSM documents for AWS Config remediation actions are not available" | Config | verified; flagged as a conflict with #11 (source said remediation is available in GovCloud without caveat) | AWS GovCloud UG, AWS Config |
| 13 | Security Hub renamed Security Hub CSPM; FSBP and NIST standards; GuardDuty, Inspector, Macie findings; ASFF | Security Hub | verified | Security Hub UG, Introduction to Security Hub CSPM |
| 14 | NIST 800-53 Rev. 5 standard supports a subset; no manual checks; Config resource recording required | Security Hub | verified | Security Hub UG, NIST SP 800-53 Rev 5 |
| 15 | Security Hub CSPM endpoints in both GovCloud Regions | Security Hub | verified | AWS General Reference, sechub |
| 16 | Standards available in all Regions where CSPM is (except Control Tower and Tagging standards) | Security Hub | verified | Security Hub UG, Regional limits |
| 17 | No backfill; Region-scoped (source caution) | Security Hub | verified (quote) | Security Hub UG, Introduction |
| 18 | Finding retention 90 days after last update or creation | Security Hub | verified (new; not in source) | AWS General Reference, sechub quotas |
| 19 | Passed control findings auto-set to RESOLVED; reset to NEW on failure | Security Hub | verified (new) | Security Hub API Reference, AwsSecurityFindingFilters (WorkflowStatus) |
| 20 | GovCloud: cross-Region aggregation only between GovCloud Regions; integration lists (AWS services; ServiceNow ITSM among third-party) | Security Hub | verified | Security Hub UG, Regional limits; GovCloud UG, Security Hub CSPM |
| 21 | Source: "Patch Manager can also forward compliance data to Security Hub CSPM" | Security Hub | corrected for GovCloud: Patch Manager not in the GovCloud AWS-service integration list | Security Hub UG, Regional limits |
| 22 | New AWS Security Hub available in both GovCloud Regions, March 30, 2026 | Security Hub | verified | AWS What's New |
| 23 | New Security Hub GovCloud differences: no third-party integrations, no automation rules for integrations, no cost estimator, usage page, Extended plan, network scanning | Security Hub | verified | GovCloud UG, AWS Security Hub |
| 24 | New Security Hub ServiceNow ITSM integration creates incidents/problems | Routes | verified | Security Hub UG, Integrations for ServiceNow |
| 25 | Patch Manager point-in-time snapshot; baseline compliance ≠ secure | Patch Manager | verified via published Book 12 Ch07 (linked) | Book 12 Ch07 |
| 26 | Audit Manager maintenance mode from April 30, 2026; no new accounts/Regions/orgs; no new frameworks or versions | Audit Manager | verified — correction to brief and earlier program drafts | Audit Manager UG, availability change |
| 27 | Audit Manager endpoints: commercial Regions only, no GovCloud | Audit Manager | verified — correction | AWS General Reference, audit-manager |
| 28 | Audit Manager FedRAMP framework is r4; Moderate 36 automated / 289 manual / 17 control sets; not intended to verify compliance | Audit Manager | verified | Audit Manager UG, FedRAMP Security Baseline Controls r4 |
| 29 | AWS recommends conformance packs and partner solutions; evidence retained two years; enable evidence finder before disabling | Audit Manager | verified | Audit Manager UG, availability change |
| 30 | AWS Service Management Connector: no new customers from March 31, 2026; end of support March 31, 2027; migration options | Routes | verified — new, not in source | SMC AG, end of support; Security Hub CSPM in ServiceNow page banner |
| 31 | EventBridge can push finding changes | Routes | verified | Security Hub UG, Introduction (EventBridge integration); SMC configuration page |
| 32 | VMware: hypervisor/firmware column has no cross-platform tool | VMware | verified via published Book 12 Ch07 (linked) | Book 12 Ch07 |
| 33 | No provider publishes a FedRAMP/800-53 mapping for agency-operated VCF | VMware | restated-as-design (observation from the 9.1 benchmark list, #39) | Broadcom TechDocs 9.1 |
| 34 | vSphere Configuration Profiles: desired config JSON with schema; compliance check; drift; remediation after pre-check | VMware | verified | Broadcom TechDocs vSphere 9.0, Configuration Profiles |
| 35 | Requires image-managed cluster, ESX 8.0 U1+, vCenter 9.0+; Host Profiles for baseline clusters; switch "is permanent" | VMware | verified (source said "superseding Host Profiles" without the conditions) | Same |
| 36 | vLCM: baselines deprecated for upgrades in 9.0; baselines only for patching 8.x and third-party software; images required for 8.0+ update/upgrade | VMware | verified; source's "deprecated starting with vSphere 8.0, removal later" restated to the 9.0 documentation's wording | Broadcom TechDocs vSphere 9.0, vLCM baselines and images |
| 37 | VCF Operations formerly Aria Operations | VMware | verified | Broadcom Knowledge Base article 441149 |
| 38 | VCF 9.0 compliance: scorecards on alert definitions; SDDC benchmarks (vSphere, vSAN, NSX SCGs); regulatory benchmarks DISA, FISMA, HIPAA, ISO, PCI DSS, CIS, NIST 800-171, NIST 800-53 R5; slated for deprecation | VMware | verified | Broadcom TechDocs VCF 9.0, Measuring Compliance of Objects |
| 39 | VCF 9.1: Compliance Benchmarks deprecated; Security Posture Management with SCG, PCI DSS v4.0.1 for VCF, VCF 9 General Controls; remediation for supported rules; CSV export and control-level reports; no 800-53 or DISA listed | VMware | verified — correction: source described VCF Operations compliance benchmarks as current | Broadcom TechDocs VCF 9.1 (regulatory benchmark page; SPM page) |
| 40 | VMware Advanced Cyber Compliance: Nov 3, 2025; advanced service; Salt-powered desired state; automated remediation of critical threats | VMware | verified; source's "continuous compliance enforcement on top of VCF Operations" restated to the blog's wording | VMware Cloud Foundation Blog |
| 41 | VCF 9.x STIG content in Readiness Guide status; DISA STIG for 9.1 in progress; InSpec/Cinc audit; Ansible and VCF.PowerCLI remediation; SAF CLI to CKL | VMware | verified (new; replaces Book 12 Ch08's STIG reference with current status) | VMware Cloud Foundation Blog, July 14, 2026 |
| 42 | Source: NSX Distributed Firewall rule hygiene via VCF Operations for Networks; DFW requires NSX Advanced edition or higher | VMware | removed: not verified on current Broadcom documentation in this pass; network segmentation evidence belongs to Book 09 | — |
| 43 | Source: VCF Operations Management Pack for ServiceNow and VCF Automation ITSM plugin integrate CMDB/Day-2 | VMware routes | corrected/qualified: the official management pack page found (Aria Operations for Integrations 8.4) pulls ServiceNow CMDB CIs into Aria Operations; no current page sending compliance results to ServiceNow found; VCF Automation plugin seen only as a store listing in search results, not relied on | Broadcom TechDocs, Management Pack for ServiceNow 8.4 |
| 44 | Source: no orchestrator runs a signed script against vCenter under a service identity | VMware | corrected/narrowed: Configuration Profiles and SPM remediate natively for supported settings, and Broadcom's Ansible/PowerCLI content can run under an orchestrator; declared-exception path kept for the remainder (Book 13 Ch10) | Broadcom TechDocs; VCF blog (#41) |
| 45 | Source: CyberArk PSM as the compensating control | VMware | restated generically as "proxied, recorded privileged session" per Book 13 Ch10; product not named (no product claim made) | Book 13 Ch10 |
| 46 | Source: KSI-CMT-RMV/VTD/LMC/RVP text, crosswalks, CM-5(1)/CM-6(1)/SI-2(2) Moderate selection, rejected citations | VMware | not carried: KSIs bind providers (settled fact); change-control controls and baselines are covered in Book 13 Ch10 (which notes CM-3(1), CM-6(1) are NIST High-only); the source's internal review history isn't reader content | Brief settled facts; Book 13 Ch10 |
| 47 | Source: "KSI-shaped, not KSI-met" | VMware | carried as one sentence (agencies model evidence on KSIs, don't meet them) | Brief settled facts; Book 12 Ch07 |
| 48 | Source: PAIN-rating table in AWS and VMware books | Patch Manager | corrected as in Chapter 08 (provider rules; agency clock is BOD 26-04); not reproduced | Chapter 08 footnotes (FedRAMP VDR, BOD 26-04) |
| 49 | Field mapping table (source, observed_at per platform) | One contract | restated-as-design; time fields per #10, #19 | — |
| 50 | ServiceNow CAM and Configuration Compliance overlap | Overlap | verified in Chapter 08 (linked) | Chapter 08 footnotes |
| 51 | `aws securityhub get-findings` filters ComplianceStatus, RecordState; output fields Id, Compliance.SecurityControlId, Resources, Severity.Label, Workflow.Status, UpdatedAt | Code | verified for filters (API reference); output field names per ASFF (ComplianceSecurityControlId filter confirms the control ID field) | Security Hub API Reference, AwsSecurityFindingFilters; AWS CLI get-findings |
| 52 | Hybrid-activated nodes governed at guest OS only (like Arc) | Honest limits | restated-as-design (source bound); consistent with Book 12 Ch07 matrix | Book 12 Ch07 |
| 53 | Source: Security Hub CSPM cross-account/Region aggregation and third-party integrations "a later follow-up" | — | not carried (internal roadmap) | — |
| 54 | Source: OCI reconciling into the same queue later | — | not carried (internal roadmap); OCI covered in Book 12 Ch07/Ch08 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| AWS — What This Document Addresses | Opening; AWS sections | CM-2 registration bookkeeping not carried |
| AWS — Control engines table | AWS sections | — |
| AWS — SSM hybrid activation bound note | Honest limits (guest-OS bound) | OCI follow-up and doctrine name not carried |
| AWS — Control Engine 1: AWS Config | AWS Config and conformance packs | GovCloud remediation statement corrected (#12) |
| AWS — Control Engine 2: Security Hub CSPM | Security Hub CSPM, and the new Security Hub | Extended with GovCloud integration list, retention, new Security Hub |
| AWS — Security Hub doesn't backfill caution | Security Hub CSPM bullets | — |
| AWS — Control Engine 3: Patch Manager | Systems Manager Patch Manager (short, linked to Book 12 Ch07) | Duplicates Book 12 Ch07 |
| AWS — PAIN-rating note | Patch Manager paragraph; Chapter 08 clock | Corrected; table not reproduced |
| AWS — Scan is not remediation note | Book 12 Ch07 link | Duplicate |
| AWS — CA-7 roll-up | One contract, four platforms; control map | — |
| AWS — Closure Necessity callout | Opening | Doctrine name dropped |
| AWS — Authorities Closed Here | Control map | KSI and spine columns not carried |
| AWS — Honest Limits | Honest limits | Region-scoping bullet folded into GovCloud bullet |
| AWS — Cross-References, Provenance, References | Inline links; footnotes | Internal IDs dropped |
| VMware — What This Document Addresses | Opening; VMware section | — |
| VMware — Control engines table | VMware subsections | NSX DFW engine removed (#42) |
| VMware — Virtualization-layer bound note | VMware intro point 1; honest limits | Doctrine name dropped |
| VMware — Control Engine 1: Configuration Profiles | Configuration: vSphere Configuration Profiles | Conditions added (#35) |
| VMware — Control Engine 2: VCF Operations + NSX DFW | Compliance posture: VCF Operations; Advanced Cyber Compliance | Updated for 9.1 (#39); DFW removed |
| VMware — Control Engine 3: vLCM | Patching: vSphere Lifecycle Manager images | — |
| VMware — PAIN note | Chapter 08 clock | Corrected |
| VMware — Baseline patching retiring caution | Patching subsection (cluster on baselines tracked as a finding) | — |
| VMware — Manual, out-of-band actuation (intro, approval/execution split, property table, AC-5 note, Moderate-baseline note) | When no machine reaches the surface; Book 13 Ch10 link | Derivation and baseline analysis covered by Book 13 Ch10; not duplicated |
| VMware — Second-source citation review note | — | Internal editorial history |
| VMware — Detector emailing a human caution | When no machine reaches the surface (first sentence); Book 13 Ch10 | — |
| VMware — The compliant pattern (items 1–4) | When no machine reaches the surface | PSM named product generalized (#45); RVP/KSI booking not carried (#46) |
| VMware — KSI-shaped, not KSI-met | One sentence in the same section | — |
| VMware — KSI text verification note and caution | — | Internal mirror/verification history; KSIs bind providers |
| VMware — CA-7 roll-up | One contract, four platforms | — |
| VMware — Closure Necessity callout | Opening | Doctrine name dropped |
| VMware — Authorities Closed Here | Control map | — |
| VMware — Honest Limits | Honest limits | NSX licensing and KSI bullets removed (#42, #46) |
| VMware — Cross-References | Inline links | Internal IDs dropped |
| VMware — Provenance (four passes) | — | Internal editorial history |
| VMware — References | Footnotes (re-verified) | Internal file references dropped |
| (new) | AWS Audit Manager section; AWS routes table and SMC end of support; STIG content for VCF 9; VMware routes; one-contract table; illustrative AWS reads | Required by the brief or found while verifying |
