---
title: "Appendix A — Requirements Mapping: Pillars, Controls and Books"
description: "A compliance-enabling map, not a compliance claim: CISA's Zero Trust Maturity Model pillars and cross-cutting capabilities, OMB M-22-09's objectives and actions, the adjacent binding instruments and the NIST SP 800-53 controls a Zero Trust program asserts, each with what it actually asks, where Book 11 addresses it, the workbook book that closes it and the evidence it calls for; then the requirements that are cited but don't exist, and the sources."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b11-zero-trust
book: B11
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Requirements Mapping: Pillars, Controls and Books

*A maturity model, a memorandum and a control catalog ask different things; a map is only useful if it keeps them apart.*

::: {.callout-note}
## In this appendix
CISA's Zero Trust Maturity Model pillars and cross-cutting capabilities, OMB M-22-09's objectives and actions, the adjacent binding instruments, and the NIST SP 800-53 controls a Zero Trust program asserts. For each: what the source asks, where this book addresses it, the workbook book that closes it, and the evidence an assessor can expect. Then the requirements that are cited but don't exist, notes on reading the controls, and the source list.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse the workbook's design and evidence in its own Zero Trust implementation plan and system security plans. It doesn't claim that following the workbook satisfies any requirement or control. CISA's Zero Trust Maturity Model is a guide, not a set of requirements; M-22-09 sets actions, not a maturity stage; and no federal document defines a Zero Trust score ([Chapter 03](03-what-the-mandates-require.md)). Control selection, implementation statements and assessment belong to the agency and its assessors. Requirement wording is summarized; the cited documents govern. Every source in this appendix was checked on October 21, 2026.
:::

## How to read the tables

- **Addressed in** names the Book 11 chapters that discuss the requirement. Book 11 is about assessing and governing the whole agency's Zero Trust posture, so it mostly addresses how a requirement is evidenced and scored, not how it's built.
- **Closed by** names the workbook book whose design produces the capability. Where no workbook book designs it, the row says so.
- **Evidence** is what an assessor can expect to see, drawn from the closing book.

## Zero Trust Maturity Model pillars and cross-cutting capabilities

The model's five pillars and three cross-cutting capabilities, with the functions Version 2.0 lists for each.[^aA-ztmm] Stage text is quoted only where it's often misread.

| Pillar or capability (ZTMM v2.0) | What the model describes | Addressed in | Closed by | Evidence |
|---|---|---|---|---|
| Identity: Authentication, Identity Stores, Risk Assessments, Access Management | Advanced: begin authenticating all identity with phishing-resistant MFA, "including initial implementation of passwordless MFA via FIDO2 or PIV"; Optimal: continuous validation, "not just when access is initially granted." Identity stores consolidated and integrated across partners and environments; just-in-time, just-enough access at Optimal[^aA-ztmm] | Ch 03, Ch 04, Ch 05, Ch 06 | [Book 02](../b02-identity/index.md); [Book 03](../b03-hr-identity/index.md); [Book 04](../b04-access/index.md); [Book 07](../b07-pki/index.md) for PIV and certificates | Directory consolidation record; authentication strength policies and sign-in logs; PIM role settings and activation history; ScubaGear identity results |
| Devices: Policy Enforcement and Compliance Monitoring, Asset and Supply Chain Risk Management, Resource Access, Device Threat Protection | Devices include servers, networking equipment and cloud and virtual assets; Optimal is "a comprehensive, at- or near-real-time view of all assets across vendors and service providers"[^aA-ztmm] | Ch 05, Ch 06, Ch 09 | [Book 05](../b05-devices/index.md); [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) for servers | Reconciled device inventory across Intune, Arc, cloud accounts and hypervisor hosts; compliance policy results; EDR coverage report |
| Networks: Network Segmentation, Network Traffic Management, Traffic Encryption, Network Resilience | Traditional: "large perimeter/macro-segmentation" and "bulk traffic VPN tunnels"; Optimal: distributed micro-perimeters and micro-segmentation around application profiles[^aA-ztmm] | Ch 03, Ch 06 | [Book 09](../b09-network/index.md); [Book 08](../b08-ddi/index.md) for DNS | Isolation plan; segmentation and flow policy per platform; encrypted DNS and HTTPS configuration |
| Applications and Workloads: Application Access, Application Threat Protections, Accessible Applications, Secure Application Development and Deployment Workflow, Application Security Testing | Contextual, per-request authorization; applications available over public networks to authorized users; immutable workloads and automated testing at Optimal[^aA-ztmm] | Ch 03, Ch 05 | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md); [Book 06](../b06-data-platform/index.md) for SQL Server workloads | Application registration inventory; Conditional Access coverage of applications; testing and disclosure program records |
| Data: Data Inventory Management, Data Categorization, Data Availability, Data Access, Data Encryption | Inventory, categorize and label data; protect it at rest and in transit; detect and stop exfiltration[^aA-ztmm] | Ch 03, Ch 05 | Not designed in the workbook; the Zero Trust Assessment's data findings ([Chapter 05](05-two-assessment-tools.md)) are an input until it is | Data categorization scheme; labeling and DLP policy; access audit records for cloud data |
| Visibility and Analytics | Observable artifacts from enterprise-wide environments inform policy decisions and response; Optimal: centralized dynamic monitoring and advanced analysis of logs and events. The model doesn't address "specifics for logging"[^aA-ztmm] | Ch 06, Ch 09, Ch 10 | M-26-14 logging (below); [Book 09](../b09-network/index.md) for network telemetry | Log source inventory per estate; the agency logging plan; SIEM ingestion of assessment output |
| Automation and Orchestration | Automated tools and workflows across products and services, with oversight; Optimal: orchestration that responds dynamically to changing requirements[^aA-ztmm] | Ch 09, Ch 10 | [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) | Policy-as-code repositories; automated drift detection and remediation records |
| Governance | Definition and enforcement of cybersecurity policies, procedures and processes within and across pillars; Optimal: enterprise-wide policies fully automated with continuous enforcement[^aA-ztmm] | Ch 02, Ch 07, Ch 08, Ch 10 | Book 11; [Book 01](../b01-transformation-arc/index.md) for the program arc | Named posture owner; finding register with owners, deadlines and closure records; POA&M |

## OMB M-22-09 objectives and actions

M-22-09's program actions and its five pillar objectives, with the actions summarized from §III.A to §III.E.[^aA-m2209] Its FY 2024 deadlines have passed; it hasn't been rescinded ([Chapter 03](03-what-the-mandates-require.md#reading-m-22-09-in-october-2026)).

| Objective (M-22-09) | What it asks | Addressed in | Closed by | Evidence |
|---|---|---|---|---|
| Program (§III introduction) | A zero trust strategy implementation lead within 30 days; an FY 2022 to FY 2024 implementation plan and budget estimate to OMB and CISA within 60 days; C-suite alignment[^aA-m2209] | Ch 02, Ch 07 | Book 11; [Book 01](../b01-transformation-arc/index.md) | Designation of the lead; the implementation plan with the program's phases in it |
| Identity (§III.A) | Centralized identity management integrated with applications; MFA at the application layer, not the network layer; phishing-resistant MFA for staff, contractors and partners and as an option for the public; no special-character or rotation password policies; at least one device-level signal in authorization[^aA-m2209] | Ch 03, Ch 04, Ch 05 | [Book 02](../b02-identity/index.md); [Book 04](../b04-access/index.md); [Book 07](../b07-pki/index.md) | Authentication strength policies; method registration reports showing SMS, voice, one-time code and push disabled for routine access; password policy settings; device compliance in Conditional Access |
| Devices (§III.B) | Reliable asset inventories through CISA's CDM program; EDR tools that meet CISA's technical requirements, deployed widely, as in M-22-01[^aA-m2209] | Ch 06, Ch 09 | [Book 05](../b05-devices/index.md) | CDM participation; reconciled inventory; EDR coverage by estate |
| Networks (§III.C) | Encrypted DNS wherever technically supported; HTTPS for all web and API traffic; .gov preloading; a zero trust architecture plan for environmental isolation, in consultation with CISA[^aA-m2209] | Ch 03, Ch 06 | [Book 08](../b08-ddi/index.md); [Book 09](../b09-network/index.md) | Resolver and endpoint encrypted DNS configuration; HTTPS enforcement; the isolation plan |
| Applications and Workloads (§III.D) | Dedicated application security testing; independent third-party evaluation; a public vulnerability disclosure program; at least one internal FISMA Moderate application made fully operational over the internet; non-.gov hostnames to CISA and GSA; work toward immutable workloads[^aA-m2209] | Ch 03 | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md) for application access; testing programs aren't designed in the workbook | Testing program records; disclosure policy; the internet-accessible application's authorization |
| Data (§III.E) | Initial automation of data categorization and security responses; audit of access to data encrypted at rest in commercial cloud; comprehensive logging with CISA "as described in OMB Memorandum M-21-31"[^aA-m2209] | Ch 03 | Not designed in the workbook; logging now follows M-26-14 (below) | Categorization scheme; cloud key and data access audit records |

## Adjacent binding instruments

These bind particular surfaces of a Zero Trust program rather than the program as a whole.

| Requirement (source) | What it asks | Addressed in | Closed by | Evidence |
|---|---|---|---|---|
| Zero trust plan (EO 14028 §3(b)(ii)) | Each agency develops a plan to implement zero trust architecture, incorporating NIST's migration steps, with a schedule. §10(k) defines the architecture as applying "throughout all aspects of the infrastructure"[^aA-eo14028] | Ch 01, Ch 03, Ch 06 | Every book | The agency's implementation plan |
| Cloud tenant configuration (CISA BOD 25-01) | For production tenants of products with a final SCuBA baseline: report tenants, deploy SCuBA assessment tools, implement mandatory policies, remediate or document deviations; new tenants meet the baselines before an ATO. Required configurations currently cover Microsoft 365 and Google Workspace, the latter due December 1, 2026[^aA-bod2501][^aA-bod2501-rc] | Ch 04, Ch 05, Ch 08, Ch 09 | [Book 04](../b04-access/index.md) for the Entra ID policies | Tenant inventory submission; ScubaGear and ScubaGoggles results; deviation records with risk acceptance |
| Asset visibility (CISA BOD 23-01) | Automated asset discovery every 7 days; vulnerability enumeration every 14 days across discovered assets, including cloud-operated virtual machines; results to the CDM Agency Dashboard within 72 hours[^aA-bod2301] | Ch 06, Ch 09 | [Book 05](../b05-devices/index.md); [Book 08, Chapter 07](../b08-ddi/07-cloud-private-endpoints-and-ipam.md) | Discovery and enumeration schedules; CDM dashboard coverage by estate |
| Logging (OMB M-26-14, which rescinds M-21-31) | Prioritize continuous event monitoring and threat hunting, investigation, response and forensics; the Logging Reference Architecture "will align with the Zero Trust Maturity Model"[^aA-m2614] | Ch 03, Ch 09, Ch 10 | [Book 09](../b09-network/index.md) for network telemetry; Book 11 for assessment evidence | The agency logging plan; maturity self-assessment per system |
| Cloud service certification (FedRAMP Consolidated Rules for 2026) | FedRAMP certifies the cloud service offering; "each agency still authorizes its own federal information systems" and accepts risk for its use of the service, including the configuration selected and the integrations enabled[^aA-fedramp] | Ch 06 | [Book 10](../b10-cloud-boundary/index.md) | FedRAMP Marketplace listing for each service; the agency's own system authorization and configuration evidence |

## NIST SP 800-53 controls a Zero Trust program asserts

The program's design contract ([Chapter 03](03-what-the-mandates-require.md#the-design-contract-the-program-takes-from-the-mandates)) is meant to close access control, continuous monitoring and incident response controls. These are the controls an agency's Zero Trust evidence most often supports. Titles and wording are from SP 800-53 Rev. 5, release 5.2.0.[^aA-53]

| Control | What it asks | Addressed in | Closed by | Evidence |
|---|---|---|---|---|
| AC-2, AC-2(1) Account Management | Defined account types, account managers, approvals, and automated account management[^aA-53] | Ch 03 | [Book 03](../b03-hr-identity/index.md); [Book 02](../b02-identity/index.md) | Joiner-mover-leaver records; provisioning logs |
| AC-3 Access Enforcement; AC-6 Least Privilege | Enforce approved authorizations; allow only the accesses "necessary to accomplish assigned organizational tasks"[^aA-53] | Ch 03, Ch 06 | [Book 04](../b04-access/index.md) | Conditional Access and role assignment exports; PIM settings |
| AC-4 Information Flow Enforcement; SC-7, SC-7(5) Boundary Protection | Enforce approved information flows; monitor and control external and key internal managed interfaces; deny by default, allow by exception[^aA-53] | Ch 06 | [Book 09](../b09-network/index.md) | Flow and segmentation policy per estate, including cloud and virtualized networks |
| AC-17 Remote Access | Usage restrictions and authorization for each type of remote access[^aA-53] | Ch 03, Ch 06 | [Book 09](../b09-network/index.md); [Book 04](../b04-access/index.md) | Remote access policy; application-layer access logs replacing VPN authentication |
| IA-2, IA-2(1), IA-2(2), IA-2(12) Identification and Authentication | Uniquely identify and authenticate users; MFA for privileged and non-privileged accounts; accept and electronically verify PIV credentials[^aA-53] | Ch 03, Ch 04 | [Book 04](../b04-access/index.md); [Book 07](../b07-pki/index.md) | Authentication methods policy; certificate-based authentication configuration; sign-in logs |
| IA-3 Device Identification and Authentication; IA-5 Authenticator Management | Authenticate devices before connection; manage authenticators[^aA-53] | Ch 03 | [Book 05](../b05-devices/index.md); [Book 07](../b07-pki/index.md) | Device certificates and compliance records |
| CM-2, CM-6 Baseline Configuration and Configuration Settings | Baseline configurations and settings "that reflect the most restrictive mode consistent with operational requirements"[^aA-53] | Ch 04, Ch 05, Ch 08 | [Book 04](../b04-access/index.md); [Book 05](../b05-devices/index.md) | SCuBA baseline results; Intune and Azure Policy compliance; hypervisor hardening results |
| CM-8 System Component Inventory | An inventory that "accurately reflects the system," includes all components and "does not include duplicate accounting of components or components assigned to any other system"[^aA-53] | Ch 06, Ch 09 | [Book 05](../b05-devices/index.md); [Book 08](../b08-ddi/index.md) | One reconciled inventory across network, cloud and hypervisor estates |
| SC-8 Transmission Confidentiality and Integrity; SC-12, SC-13 Cryptography | Protect transmitted information; manage keys; use the cryptography the organization selects[^aA-53] | Ch 03 | [Book 09](../b09-network/index.md); [Book 07](../b07-pki/index.md) | TLS and encrypted DNS configuration; certificate lifecycle records |
| SC-20, SC-21, SC-22 Name/Address Resolution | Data origin authentication and integrity for resolution served and received; fault-tolerant resolution with internal and external role separation[^aA-53] | Ch 06 | [Book 08](../b08-ddi/index.md) | Resolver architecture; DNSSEC and validation configuration; forwarding chain across platforms |
| SC-28 Protection of Information at Rest | Protect specified information at rest[^aA-53] | Ch 03 | Not designed in the workbook beyond platform defaults | Encryption configuration and key access audit |
| RA-2 Security Categorization | Categorize each system and the information it handles[^aA-53] | Ch 03 | Not designed in the workbook | Categorization in each system security plan |
| RA-5, RA-5(11) Vulnerability Monitoring; SI-2 Flaw Remediation | Scan for vulnerabilities; a public reporting channel; remediate flaws[^aA-53] | Ch 06, Ch 08 | [Book 05](../b05-devices/index.md); [Book 09](../b09-network/index.md) | Scan coverage by estate, including hypervisor hosts; disclosure policy; remediation records |
| SI-3 Malicious Code Protection; SI-4 System Monitoring | Malicious code protection; monitor the system to detect attacks and unauthorized use[^aA-53] | Ch 06, Ch 09 | [Book 05](../b05-devices/index.md); [Book 09](../b09-network/index.md) | EDR coverage; hypervisor log forwarding; SIEM detections |
| AU-2, AU-6, AU-12 Audit and Accountability | Identify loggable events; review and analyze audit records; generate audit records[^aA-53] | Ch 09, Ch 10 | [Book 09](../b09-network/index.md); Book 11 | Log source inventory; review records; the logging plan under M-26-14 |
| CA-2 Control Assessments; CA-5 Plan of Action and Milestones; CA-7 Continuous Monitoring | Planned assessments; a POA&M for weaknesses; a continuous monitoring strategy[^aA-53] | Ch 08, Ch 09, Ch 10 | Book 11 | Assessment plan; POA&M entries traced to findings; continuous monitoring reports |
| IR-4 Incident Handling | Preparation, detection and analysis, containment, eradication and recovery[^aA-53] | Ch 10 | Not designed in the workbook; the maturity model doesn't address incident response either[^aA-ztmm] | Incident response plan and records |
| PL-8 Security and Privacy Architectures; SA-8 Engineering Principles | Security architectures reviewed against the enterprise architecture; engineering principles the organization selects[^aA-53] | Ch 03, Ch 06 | [Book 01](../b01-transformation-arc/index.md) | Architecture documentation mapping each policy decision and enforcement point |
| SA-9 External System Services; SR-3, SR-6 Supply Chain | Providers comply with organizational requirements, with defined oversight and ongoing monitoring of their compliance; supply chain controls and supplier reviews[^aA-53] | Ch 06 | [Book 10](../b10-cloud-boundary/index.md) | Provider certification evidence; the agency's configuration evidence for each service |

## Requirements that are cited but don't exist

[Chapter 03](03-what-the-mandates-require.md#requirements-that-are-cited-but-dont-exist) lists the misreadings of M-22-09, the maturity model and SP 800-207 in full. Three more concern scope and tooling.

| Claimed requirement | What the record shows |
|---|---|
| BOD 25-01 covers the agency's infrastructure-as-a-service accounts, network or VMware estate | It covers tenants of products with a published SCuBA baseline; the required configurations list Microsoft 365 and Google Workspace.[^aA-bod2501][^aA-bod2501-rc] |
| A provider's compliance dashboard shows that a control is met | AWS says its NIST SP 800-53 standard supports "a subset" of requirements through automated checks; Microsoft says Azure Policy compliance "is only a partial view of your overall compliance status."[^aA-aws][^aA-azure] |
| A FedRAMP certification covers the agency's use of a cloud service | FedRAMP certifies the service; the agency authorizes its own systems and accepts risk for the configuration selected and the integrations enabled.[^aA-fedramp] |

## Reading the controls

- **Baseline membership.** Every control and enhancement in the table above is in the SP 800-53B Moderate baseline, checked against the OSCAL Moderate profile.[^aA-53b] FedRAMP's Rev. 5 baselines are built on these.
- **CM-8 is per system.** Its no-duplicate-accounting item applies within each system's inventory and across systems. The program reads it, with BOD 23-01 and M-22-09's CDM requirement, as requiring one reconciled inventory across estates ([Chapter 06](06-beyond-microsoft-365.md#one-authoritative-asset-inventory)); that is the program's reading, not the control's wording.
- **No Zero Trust control.** No control, enhancement or discussion text in the release 5.2.0 catalog mentions zero trust.[^aA-53] Zero Trust evidence supports existing controls; it doesn't add a control family.
- **Release.** Identifiers and titles are from SP 800-53 Rev. 5, release 5.2.0.[^aA-53]

## Sources

Every URL below was opened on October 21, 2026. Chapters cite product and incident sources specific to their subject in their own footnotes; those are not repeated here unless a requirement depends on them.

### Primary sources: executive orders, OMB memoranda and CISA directives

- Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021. <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf>
- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022. <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026 (rescinds M-21-31). <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>
- OMB, "Memoranda" index. <https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/>
- CISA, Binding Operational Directive 23-01, *Improving Asset Visibility and Vulnerability Detection on Federal Networks*, October 3, 2022. <https://www.cisa.gov/news-events/directives/bod-23-01-improving-asset-visibility-and-vulnerability-detection-federal-networks>
- CISA, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024. <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services>
- CISA, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations." <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations>

### Primary sources: CISA guidance

- CISA, *Zero Trust Maturity Model*, Version 2.0, April 2023. <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf>
- CISA, "Zero Trust Maturity Model" (landing page, marked archived). <https://www.cisa.gov/zero-trust-maturity-model>
- CISA, "Secure Cloud Business Applications (SCuBA) Project." <https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project>

### Primary sources: NIST

- NIST SP 800-207, *Zero Trust Architecture*, August 2020. <https://csrc.nist.gov/pubs/sp/800/207/final>
- NIST SP 1800-35, *Implementing a Zero Trust Architecture*, June 10, 2025. <https://csrc.nist.gov/pubs/sp/1800/35/final>
- NIST SP 800-53 Rev. 5, release 5.2.0, and the OSCAL Rev. 5 catalog and SP 800-53B baseline profiles. <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5>

### Primary sources: FedRAMP and providers

- FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*. <https://www.fedramp.gov/2026/agencies/use/>
- Amazon Web Services, "NIST SP 800-53 Revision 5 in Security Hub CSPM." <https://docs.aws.amazon.com/securityhub/latest/userguide/standards-reference-nist-800-53.html>
- Microsoft Learn, "Details of the NIST SP 800-53 Rev. 5 Regulatory Compliance built-in initiative." <https://learn.microsoft.com/azure/governance/policy/samples/nist-sp-800-53-r5>

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Evidence, Not Verdicts: From Findings to a Program](10-evidence-not-verdicts.md) · [Book index](index.md)
:::

[^aA-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §5 and §5.1 to §5.6 (Tables 2 to 7), <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Oct 21, 2026).
[^aA-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III and §III.A to §III.E, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 21, 2026).
[^aA-eo14028]: Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021, 86 Fed. Reg. 26633, §3(b)(ii) and §10(k), <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf> (accessed Oct 21, 2026).
[^aA-bod2501]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Oct 21, 2026).
[^aA-bod2501-rc]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (accessed Oct 21, 2026).
[^aA-bod2301]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 23-01, *Improving Asset Visibility and Vulnerability Detection on Federal Networks*, October 3, 2022, <https://www.cisa.gov/news-events/directives/bod-23-01-improving-asset-visibility-and-vulnerability-detection-federal-networks> (accessed Oct 21, 2026).
[^aA-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, Appendix A, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^aA-fedramp]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^aA-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, release 5.2.0, OSCAL catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 21, 2026).
[^aA-53b]: National Institute of Standards and Technology, SP 800-53B, Moderate baseline, OSCAL profile `NIST_SP-800-53_rev5_MODERATE-baseline_profile.json`, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 21, 2026).
[^aA-aws]: Amazon Web Services, "NIST SP 800-53 Revision 5 in Security Hub CSPM," *AWS Security Hub User Guide*, <https://docs.aws.amazon.com/securityhub/latest/userguide/standards-reference-nist-800-53.html> (accessed Oct 21, 2026).
[^aA-azure]: Microsoft Learn, "Details of the NIST SP 800-53 Rev. 5 Regulatory Compliance built-in initiative," <https://learn.microsoft.com/azure/governance/policy/samples/nist-sp-800-53-r5> (accessed Oct 21, 2026).
