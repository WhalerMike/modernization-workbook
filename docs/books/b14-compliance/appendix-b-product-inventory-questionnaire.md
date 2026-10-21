---
title: "Appendix B — Product Inventory Questionnaire"
description: "A fill-in template for scoping the Federal Modernization Program: the products and services the agency already runs, what each one is, how it is certified or accredited, where it is deployed and which workbook book it feeds, with a scope rule for cloud dependencies and a flag list that becomes the procurement and boundary agenda."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Product Inventory Questionnaire

*You can't claim an inherited control from a product until you know you run it, which offering you run, and how it is authorized.*

::: {.callout-note}
## In this appendix
A questionnaire the agency fills in about the products and services it already operates, so the program can be scoped against what is really in place. It explains how to complete it, sets out the scope rule the program applies to every cloud dependency, gives the discovery tables grouped by the workbook book each answer feeds, and ends with the flag list that turns gaps into decisions.
:::

::: {.callout-important}
## A discovery instrument, not a decision
A completed questionnaire is a record of what the agency runs. It isn't a procurement decision, an authorization or a control-inheritance claim. Product names in the tables are examples of each category, not recommendations, and a product's certification status changes: check every status on the FedRAMP Marketplace when the decision is made, not when the questionnaire was filled in.
:::

## Why the questionnaire comes first

The program can't choose how its platforms coordinate, or claim that a control is inherited from a provider, without first knowing what is already deployed and how each piece is authorized. Agencies usually run more tools than any one team can list, and a plan built on an assumed estate reaches assessment with controls nobody can evidence. The questionnaire makes the estate explicit before the design starts. Its answers seed the component and system inventories ([Book 13, Chapter 03](../b13-governance/03-one-authoritative-record.md)) and the external-services record behind SA-9 ([Appendix A](appendix-a-control-crosswalk.md)).

The questionnaire ships empty on purpose. A pre-filled list answers the questions before the reader has looked at the estate, and the reader's own estate is the point. An agency that completes it keeps the filled copy with its own program records, not in a shared or published document.

## How to complete it

For each category in the discovery tables, fill the four working columns:

- **In use?** Yes, no, or planned. "No" is an answer: an empty category is often a gap the program has to fill.
- **Product and offering.** The product and the specific offering or edition the agency runs. The edition matters: a vendor's government offering and its commercial offering are different services with different certifications.
- **FedRAMP status.** For a cloud service, the Marketplace status, certification class and FedRAMP ID (see [Recording FedRAMP status](#recording-fedramp-status)). For on-premises equipment or software, write "not a cloud service" and record how it is accredited instead.
- **Surface.** Where it is deployed: a cloud platform, network equipment, an operating system, or across several of them.

The **Feeds** column is pre-filled. It names the workbook book, and the chapter where one fits, that uses the answer, and the controls in [Appendix A](appendix-a-control-crosswalk.md) the product is most likely to evidence. Anything that fails the scope rule goes on the [flag list](#flags-and-gaps).

## The scope rule for cloud dependencies

FedRAMP covers cloud products and services that create, collect, process, store or maintain federal information on behalf of an agency, with listed exceptions, and agencies must promote the use of FedRAMP Certified services when a use is within that scope. Only the agency can decide whether a given use case falls within it.[^aB-scope] The 2026 rules certify services in classes: Class B covers the former Li-SaaS and Low baselines, Class C the Moderate baseline and Class D the High baseline.[^aB-ntc0004] A class describes what FedRAMP assessed. It doesn't replace the agency's own security categorization or risk decision, and agencies may use a certification package to authorize a service at any security category they deem appropriate under the Risk Management Framework.[^aB-use][^aB-ntc0004]

The program's design turns that into one rule: name the security categorization of the system the dependency serves, then give every in-boundary dependency one of these dispositions.

| Situation | Disposition (program design) |
|---|---|
| A cloud service, FedRAMP Certified at a class that matches the system's categorization | In scope. Record the FedRAMP ID, class and listing date. |
| A cloud service certified at a higher class than the system needs | In scope. Record the class; the agency's authorization still documents its own use, configuration and integrations.[^aB-use] |
| A cloud service certified at a lower class than the system's categorization | Flag. The authorizing official decides whether the certification package supports this use; record the decision, or find an offering certified at the matching class. |
| A cloud service in an implementation or in-process status, not yet certified | Flag. Record the status and its date; plan as though certification may not arrive on time. |
| A cloud service with no FedRAMP status, where the agency has determined the use is within FedRAMP's scope | Flag. Find a certified edition or offering, or replace the service. |
| A cloud service the agency has determined is outside FedRAMP's scope | Record the scope determination and who made it. The service is still assessed in the agency's own authorization. |
| On-premises equipment or software, not a cloud service | Not a FedRAMP item. Assess it inside the agency's own authorization. Record whether its cryptographic modules hold current NIST Cryptographic Module Validation Program certificates (new validations are made against FIPS 140-3)[^aB-cmvp] and which configuration baseline it is held to ([Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md)). |

Two more rules from FedRAMP apply once a service is in use. Agencies must complete the authorization to operate process for the systems that use a certified service, and must notify FedRAMP after authorizing the use of a service within FedRAMP's scope.[^aB-agu] The questionnaire is where both start: it says which services need an authorization decision and which decisions need a notification.

### Selection: preference is earned by coverage, not ownership

Where the agency already holds an enterprise agreement, that vendor's product is a natural first candidate for a role. The program's design treats it as the default only when it reaches every surface the role has to coordinate, across cloud platforms, network equipment and operating systems, at the required class. Where it covers only its own vendor's surfaces, or can't reach a surface at all, the product that coordinates the whole estate at the required class is the better choice. A license already paid for isn't, by itself, a reason to leave a surface uncovered.

## Recording FedRAMP status

Check each cloud service on the FedRAMP Marketplace.[^aB-marketplace] The same data is published in machine-readable form, and the fields to copy into the questionnaire are the service's FedRAMP ID, its status, its certification class and its impact level as listed.[^aB-products] Statuses on the Marketplace on October 21, 2026 were FedRAMP Certified, Initial Implementation, FedRAMP In Process, Agency Authorization In Process and Legacy FedRAMP Ready; only the first is a certification.[^aB-products] Record the date you checked, because the answer changes.

## The discovery tables

### Platforms, identity and transport

| Category | Example products | In use? | Product and offering | FedRAMP status | Surface | Feeds |
|---|---|---|---|---|---|---|
| Cloud platforms | Microsoft Azure Government and Microsoft 365 GCC, AWS GovCloud, Oracle Cloud Infrastructure, Google Cloud, VMware-based private cloud | | | | | [Book 10](../b10-cloud-boundary/index.md); all families |
| Naming and addressing (DNS, DHCP, IPAM) | Infoblox, BlueCat, NetBox | | | | | [Book 08](../b08-ddi/index.md); SC-20, SC-21, SC-22, CM-8 |
| Certificates and PKI | Active Directory Certificate Services, Entrust, DigiCert, Venafi | | | | | [Book 07](../b07-pki/index.md); SC-17, IA-5(2) |
| HR system of record | Oracle HCM, Workday, SAP SuccessFactors | | | | | [Book 03](../b03-hr-identity/index.md); AC-2, IA-4, PS-4, PS-5 |
| Directory and identity provider | Microsoft Entra ID, on-premises Active Directory, Okta, Ping Identity | | | | | [Book 02](../b02-identity/index.md); IA-2, IA-5 |
| Identity governance | Microsoft Entra ID Governance, SailPoint, Saviynt | | | | | [Book 04, Chapter 09](../b04-access/09-access-governance.md); AC-2 |
| Network equipment | Cisco, Palo Alto Networks, Juniper, Fortinet, Arista | | | | Network equipment | [Book 09](../b09-network/index.md); SC-7, AC-4 |
| Network access control | Cisco ISE, Aruba ClearPass, Juniper Mist | | | | Network equipment | [Book 09, Chapter 07](../b09-network/07-network-access-control.md); IA-3, AC-20 |
| SD-WAN and SASE | Cisco Catalyst SD-WAN, Prisma SASE, Zscaler, Netskope | | | | Cross-platform | [Book 09, Chapter 05](../b09-network/05-sd-wan-sase-and-governed-transport.md); SC-8, SC-7(8) |
| Network performance and observability | Riverbed, ThousandEyes, Kentik, SolarWinds | | | | Cross-platform | [Book 09](../b09-network/index.md), [Book 12](../b12-security-operations/index.md); SI-4, CA-7 |
| Contact center and unified communications | Amazon Connect, Microsoft Teams Phone | | | | Cloud platform | [Book 09, Chapter 12](../b09-network/12-microsoft-365-traffic.md) |

### Devices and data platform

| Category | Example products | In use? | Product and offering | FedRAMP status | Surface | Feeds |
|---|---|---|---|---|---|---|
| Endpoint and server management | Microsoft Intune, Azure Arc, Microsoft Configuration Manager, Jamf | | | | Operating system | [Book 05](../b05-devices/index.md); CM-2, CM-6, AC-19 |
| Database platforms | SQL Server, Oracle Database, PostgreSQL, Azure SQL, Amazon RDS | | | | Cloud platform or operating system | [Book 06](../b06-data-platform/index.md); CM-8, PM-5 |
| Database authentication | Azure Arc with Microsoft Entra authentication for SQL Server, cloud IAM database authentication | | | | Cross-platform | [Book 06](../b06-data-platform/index.md); IA-2, IA-9 |

### Security operations

| Category | Example products | In use? | Product and offering | FedRAMP status | Surface | Feeds |
|---|---|---|---|---|---|---|
| Privileged access | Microsoft Entra Privileged Identity Management, CyberArk, BeyondTrust, Delinea | | | | Cross-platform | [Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md); AC-6, AC-6(5) |
| Vulnerability assessment | Microsoft Defender Vulnerability Management, Tenable, Qualys, Rapid7, Amazon Inspector | | | | Cross-platform | [Book 12, Chapter 06](../b12-security-operations/06-vulnerability-management.md); RA-5 |
| Patch and systems management | Intune, Azure Update Manager, AWS Systems Manager, OCI OS Management Hub, VMware vSphere Lifecycle Manager, Red Hat Satellite and Ansible, Tanium, BigFix, Ivanti | | | | Operating system or cross-platform | [Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md); SI-2, SI-2(2) |
| Cloud posture (CSPM, CNAPP) | Microsoft Defender for Cloud, Wiz, Prisma Cloud, Orca | | | | Cloud platform | [Book 12, Chapter 08](../b12-security-operations/08-cloud-native-posture.md); CM-6, CM-7 |
| Container platforms and image scanning | AKS, EKS, OKE, OpenShift | | | | Cloud platform | [Book 12, Chapter 08](../b12-security-operations/08-cloud-native-posture.md); SA-11 |
| Data protection and classification | Microsoft Purview, Amazon Macie, Symantec DLP | | | | Cloud platform | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md); AC-4, SC-28 |
| Key management and HSM | Azure Key Vault, AWS KMS, OCI Vault, Thales, Entrust | | | | Cloud platform | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md); SC-12, SC-13 |
| SIEM | Microsoft Sentinel, Splunk, Elastic, Google Security Operations, IBM QRadar | | | | Cross-platform | [Book 12, Chapter 05](../b12-security-operations/05-from-log-warehouse-to-detection.md); AU-6, SI-4 |
| Extended and endpoint detection and response | Microsoft Defender XDR, Cortex XDR, CrowdStrike Falcon | | | | Operating system or cross-platform | [Book 12, Chapter 05](../b12-security-operations/05-from-log-warehouse-to-detection.md); SI-3, SI-4 |
| Security orchestration and response | Sentinel with Logic Apps, Cortex XSOAR, Splunk SOAR, ServiceNow Security Operations | | | | Cross-platform | [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md); IR-4 |

### Governance, coordination and assurance

| Category | Example products | In use? | Product and offering | FedRAMP status | Surface | Feeds |
|---|---|---|---|---|---|---|
| IT service management and workflow | ServiceNow, BMC Helix, Jira Service Management | | | | Cloud platform | [Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md); CM-3 |
| Configuration management database and discovery | ServiceNow Discovery and Service Graph, native cloud inventory services | | | | Cross-platform | [Book 13, Chapter 03](../b13-governance/03-one-authoritative-record.md); CM-8, reconciled to IPAM |
| In-boundary connectors to cloud APIs | ServiceNow MID Server, other agent or gateway components | | | | Cross-platform | [Book 13, Chapter 08](../b13-governance/08-the-adapter-model.md); AC-6, CA-3 |
| Microsoft 365 and Entra control assessment | CISA ScubaGear, Microsoft Graph, Microsoft Purview | | | | Cloud platform | [Book 11](../b11-zero-trust/index.md); CM-6, CA-7 |
| Cloud control assessment | Azure Policy, Defender for Cloud, AWS Config | | | | Cloud platform | [Book 12, Chapter 08](../b12-security-operations/08-cloud-native-posture.md); CM-6, CA-7 |
| Infrastructure as code | Terraform, OpenTofu, Bicep, CI pipelines such as GitHub Actions | | | | Cross-platform | [Book 10, Chapter 06](../b10-cloud-boundary/06-ipam-and-network-as-code.md); CM-2, CM-3 |
| Governance, risk and compliance; OSCAL | ServiceNow IRM, Xacta, eMASS, OSCAL-capable tools | | | | Cross-platform | [Chapter 11](11-the-authorization-package.md); CA-2, CA-5, CA-7 |
| Backup and disaster recovery | Azure Site Recovery, AWS Backup, Veeam, Commvault, Cohesity | | | | Cross-platform | [Chapter 06](06-contingency-and-continuity.md); CP-9, CP-10 |
| Supply chain and SBOM tooling | Syft, Grype, Anchore, Snyk | | | | Cross-platform | [Chapter 07](07-supply-chain-risk-management.md); SR-3, SR-11 |
| Documentation and collaboration | Confluence, SharePoint, ServiceNow Knowledge | | | | Cloud platform | [Chapter 05](05-program-management-controls.md); PM-1 |
| Security awareness and training platforms | Learning management systems, phishing-simulation services | | | | Cloud platform | [Chapter 09](09-training-and-awareness-controls.md); AT-2, AT-4 |

FedRAMP's rules require agencies to make sure their governance, risk, compliance and inventory tools can produce and ingest machine-readable artifacts in the formats FedRAMP identifies, including at least OSCAL JSON.[^aB-agu] Answer that row with the tool's OSCAL capability, not just its name.

## Flags and gaps

Roll up everything that failed the scope rule, and every category with no product at all. This list becomes the agenda for procurement and boundary decisions. The rows below are illustrative patterns, not findings about any product.

| Item | Category | Issue | Action |
|---|---|---|---|
| *(example)* An observability service | Network performance | Certified at Class D only; system is categorized Moderate | Record the class; document the use in the system's authorization |
| *(example)* A WAN appliance | Network equipment | On-premises equipment, not a cloud service | Assess in the agency's authorization; record module validation and configuration baseline |
| *(example)* A collaboration tool | Documentation | Agency uses the commercial edition; only the government edition is certified | Move to the certified edition or replace |
| *(example)* No product | Backup and disaster recovery | No product covers the hybrid estate | Raise as a CP gap ([Chapter 06](06-contingency-and-continuity.md)) |
| *(add rows as discovery proceeds)* | | | |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Control Crosswalk](appendix-a-control-crosswalk.md) · [Book index](index.md)
:::

[^aB-scope]: FedRAMP, "Scope of FedRAMP," *FedRAMP Consolidated Rules for 2026*, quoting OMB Memorandum M-24-15, <https://www.fedramp.gov/2026/scope/> (accessed Oct 21, 2026).
[^aB-ntc0004]: FedRAMP, Notice NTC-0004, *Initial Outcome from RFC-0020 FedRAMP Authorization Designations*, February 25, 2026, <https://www.fedramp.gov/notices/0004/> (accessed Oct 21, 2026).
[^aB-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^aB-cmvp]: National Institute of Standards and Technology, Cryptographic Module Validation Program, project page ("FIPS 140-3 validations are currently being accepted"; FIPS 140-2 validated modules accepted through September 21, 2026, then moved to the Historical list), <https://csrc.nist.gov/projects/cryptographic-module-validation-program> (accessed Oct 21, 2026).
[^aB-agu]: FedRAMP, "Agency Use of FedRAMP Certified Cloud Services," *FedRAMP Consolidated Rules for 2026*, rules AGU-USE-ABU, AGU-AGC-NAA and AGU-AGC-GRC, <https://www.fedramp.gov/2026/reference/agency-use/> (accessed Oct 21, 2026).
[^aB-marketplace]: FedRAMP Marketplace, products, <https://www.fedramp.gov/marketplace/products/> (accessed Oct 21, 2026).
[^aB-products]: FedRAMP Marketplace product data, <https://www.fedramp.gov/marketplace/products.json>, produced by the General Services Administration, dataset last changed October 21, 2026; fields `fedramp_id`, `status`, `cert_class` and `impact_level` (accessed Oct 21, 2026).
