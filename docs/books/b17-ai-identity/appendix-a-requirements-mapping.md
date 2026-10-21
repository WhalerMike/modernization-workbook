---
title: "Appendix A — Requirements Mapping: AI Rules to Identity Controls"
description: "A compliance-enabling map, not a compliance claim: the duties in OMB M-25-21 and M-25-22, the NIST AI Risk Management Framework functions and subcategories, and the NIST SP 800-53 Rev. 5 controls that govern an AI system's identity, each mapped to the identity control the program uses and the Book 17 chapter that carries it, with NIST baseline and FedRAMP 2026 class membership given as separate facts; then the other federal sources the book relies on, and the requirements the source material cited that don't say what was claimed."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b17-ai-identity
book: B17
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Requirements Mapping: AI Rules to Identity Controls

*Most of what federal rules ask of an AI system is asked of an identity first; the controls already exist, and the work is applying them to a principal that isn't a person.*

::: {.callout-note}
## In this appendix
The duties OMB M-25-21 places on agencies, from the Chief AI Officer to the seven high-impact practices, and the acquisition terms in M-25-22, each mapped to the identity control the program uses and the chapter that carries it. The NIST AI Risk Management Framework's four functions and the subcategories that concern identity. The NIST SP 800-53 Rev. 5 controls that govern an AI system's identity, with their NIST SP 800-53B baselines and FedRAMP 2026 classes. Then the other federal sources the book relies on, the claims in the source material that the requirements don't support, and the source list.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency use the book's design in its own AI governance, security plans and authorization packages. It doesn't claim that following the book satisfies any requirement or control. Control selection, implementation statements and assessment belong to the agency and its assessors; the official who accepts risk for an AI use case and the authorizing official who accepts risk for the system are the only people who accept it. Requirement wording is summarized; the cited documents govern. The "identity control" column is the program's design, not federal text. Every source was checked on October 21, 2026.
:::

## How to read the tables

- **Requirement** is summarized from the cited document, with its section number. Where a requirement uses "must," the summary does too; where it uses "should" or "encouraged," so does the summary.
- **Identity control** is what the program does to meet or evidence the requirement for an AI system's identity. It is design.
- **Carried in** names the Book 17 chapters that design or evidence it, by file name. **Other books** names workbook books that build part of it.
- **NIST SP 800-53B** gives the NIST baselines that include a control (L, M, H), read from NIST's OSCAL baseline profiles, with P where the control is also in the privacy baseline.[^aA-53b] **FedRAMP 2026** gives the FedRAMP Rev5 classes whose baselines include it (B, C, D), read from the "FedRAMP Rev5 Baselines" line on each control in FedRAMP's 2026 control reference.[^aA-fedramp-controls] The two are separate facts and don't always agree: AC-2(12) is NIST High only but FedRAMP Classes C and D; CM-8(4) is NIST High only and FedRAMP Class D only. "Required at Moderate" means nothing until it says which: an agency system categorized Moderate uses the NIST baseline its categorization selects, and a FedRAMP Class C service uses FedRAMP's. FedRAMP's classes bind cloud service providers, not agencies ([Book 10, Chapter 03](../b10-cloud-boundary/03-what-changed-at-fedramp.md)).
- Control identifiers, titles and statements are from SP 800-53 Rev. 5, release 5.2.0.[^aA-53]

## OMB M-25-21: agency duties

M-25-21, *Accelerating Federal Use of AI through Innovation, Governance, and Public Trust* (April 3, 2025), rescinded and replaced M-24-10.[^aA-m2521] It applies to executive branch agencies, including independent regulatory agencies; elements of the Intelligence Community aren't required to implement the high-impact practices, and the Department of Defense and the Intelligence Community are excepted from the inventory.[^aA-m2521] No later OMB memorandum through M-26-19 replaces it.[^aA-omb-memos]

| Requirement | Section | Identity control | Carried in | Other books |
|---|---|---|---|---|
| Retain or designate a Chief AI Officer within 60 days, who among other duties must maintain the agency's AI use case inventory and centrally track high-impact use cases and determinations | 3(a)(i), items E and F | The inventory is the seed list for AI identity records; each record carries the inventory use case ID | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 08](08-who-owns-ai-identity.md) | [Book 14, Chapter 04](../b14-compliance/04-closure-with-proof.md) |
| CFO Act agencies convene an AI governance board within 90 days | 3(a)(ii) | Decision rights for AI identity policy sit with the board; the board doesn't accept system risk | [Ch 08](08-who-owns-ai-identity.md) | [Book 13, Chapter 09](../b13-governance/09-who-governs.md) |
| Enable trained, accountable officials at the lowest appropriate level to identify, assess, mitigate and accept risk for AI use cases; that process is separate from, and doesn't supersede, system authorization | 3(b)(i), footnotes 21 and 22 | The identity record names the risk acceptor and the system's authorizing official as different fields | [Ch 02](02-what-federal-ai-rules-require.md), [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 10](10-evidence-and-authorization.md) | [Book 14](../b14-compliance/index.md) |
| Submit and post a compliance plan within 180 days and every two years until 2036, or a written determination that the agency doesn't use covered AI | 3(b)(ii) | The plan cites the identity program's coverage; individual systems are evidenced in their packages | [Ch 10](10-evidence-and-authorization.md) | — |
| Update internal policies on IT infrastructure, data, cybersecurity (including system authorizations, continuous monitoring and continuous authorizations for AI) and privacy within 270 days; agencies should update authorization and monitoring processes for AI's needs | 3(b)(iii), footnote 11 | AI identities are written into account management, authenticator and audit policy as a principal type | [Ch 06](06-credentials-and-least-privilege.md), [Ch 10](10-evidence-and-authorization.md) | [Book 04](../b04-access/index.md) |
| Agencies should develop a generative AI acceptable-use policy within 270 days | 3(b)(iv) | Consent and sanctioned-service policy for generative AI services; unsanctioned use is a finding | [Ch 06](06-credentials-and-least-privilege.md), [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 15, Chapter 06](../b15-day2-operations/06-saas-integration-governance.md) |
| Inventory AI use cases at least annually, submit to OMB and post publicly; encouraged to update the public version continuously | 3(b)(v) | The inventory scan and the vintage comparison; retirement starts the leaver process | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 09](09-running-the-inventory-scan.md) | — |
| For AI systems, continue to follow the A-130 authorization to operate requirements | Footnote 29 | AI goes through the existing authorization; its identity evidence goes in the package | [Ch 02](02-what-federal-ai-rules-require.md), [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) |
| Determine and document whether each use case is high-impact; presumed high-impact categories need a written determination to the contrary | 4(a), Section 6 | High-impact status is a field on the identity record and raises scan priority | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 09](09-running-the-inventory-scan.md) | — |
| Within 365 days, document implementation of the minimum practices for high-impact AI; discontinue non-compliant high-impact AI | 4(a)(i) | Disabling the AI system's identities is the discontinuation mechanism; the disable is tested | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 10](10-evidence-and-authorization.md) | — |
| Pilots are exempt from the practices only if limited in scale and duration and certified by the Chief AI Officer, with the certification tracked centrally | 4(a)(i) | The pilot certification's end date is the identity's access review date; recorded as a governed exception | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 10](10-evidence-and-authorization.md) | — |
| Chief AI Officer waivers: written, system-specific; certified annually; reported to OMB within 30 days; tracked centrally; publicly summarized | 4(a)(ii)–(iv) | Each waiver is a governed exception with an expiry in the POA&M | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) |

### The seven minimum practices for high-impact AI

| Practice | Section | Identity control | Carried in |
|---|---|---|---|
| Pre-deployment testing, with alternative methods where the agency lacks access to code, models or data | 4(b)(i) | Tests run under the production identity and permissions | [Ch 10](10-evidence-and-authorization.md) |
| AI impact assessment before deployment, including an independent review and the signature of the individual accepting the risk | 4(b)(ii) | The identity record names the risk acceptor | [Ch 02](02-what-federal-ai-rules-require.md), [Ch 05](05-owners-sponsors-and-lifecycle.md) |
| Ongoing monitoring for performance and adverse impacts, designed to detect changes to the system and its context | 4(b)(iii) | Sign-in, audit and risk monitoring of the AI system's own identities; drift findings | [Ch 07](07-monitoring-drift-and-shadow-ai.md) |
| Sufficient, periodic training and assessment for operators | 4(b)(iv) | The record names the operators' group; training completion is checked against its members | [Ch 03](03-the-inventory-as-an-identity-source.md); [Book 16](../b16-people/index.md) |
| Human oversight, intervention and accountability, with a fail-safe where practicable | 4(b)(v) | Named people who can disable the identity; a tested disable | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 08](08-who-owns-ai-identity.md) |
| Timely human review and appeal for affected individuals | 4(b)(vi) | None directly; the record points to where appeal records are kept | [Ch 10](10-evidence-and-authorization.md) |
| Feedback from end users and the public | 4(b)(vii) | None directly; the record points to the feedback channel | [Ch 10](10-evidence-and-authorization.md) |

The 2025 inventory reports a status for each practice in its nine `hi_*` fields; none of those fields is evidence of the practice.[^aA-dictionary]

## OMB M-25-22: acquisition terms that touch identity

M-25-22, *Driving Efficient Acquisition of Artificial Intelligence in Government* (April 3, 2025), applies to contracts awarded under solicitations issued 180 days or more after the memo, and to options exercised after that date; it doesn't apply to AI acquired as a component of a national security system.[^aA-m2522]

| Requirement | Section | Identity control | Carried in | Other books |
|---|---|---|---|---|
| AI systems and services operated as an information system by or on behalf of an agency must receive an authorization to operate before deployment | 4(e)(i) | No production identity is issued to an AI system before its authorization | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) |
| Contracts must let the agency regularly monitor and evaluate performance, risks and effectiveness | 4(d), contract term E | The agency's monitoring covers the vendor-operated identities in its tenant | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 15, Chapter 06](../b15-day2-operations/06-saas-integration-governance.md) |
| Agencies should consider requiring vendors to notify them before integrating new AI features into delivered systems | 4(d), contract term G | A new AI feature that brings a new identity or permission is a change through the pipeline | [Ch 06](06-credentials-and-least-privilege.md), [Ch 07](07-monitoring-drift-and-shadow-ai.md) | — |
| Components needed to operate and monitor the AI system remain available to the agency for as long as necessary; data handling limited to the contract's purposes | 3(e)(ii)–(iii) | Logs for the AI system's identities stay in the agency's own monitoring, not only the vendor's | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md) |

## NIST AI Risk Management Framework

The AI RMF 1.0 (NIST AI 100-1, January 26, 2023) is voluntary. Its core has four functions: GOVERN, MAP, MEASURE and MANAGE, with GOVERN "a cross-cutting function to inform and be infused throughout the other three."[^aA-airmf][^aA-airmf-page] NIST says the framework is being revised as part of the White House AI Action Plan; no revised version had been published as of October 21, 2026.[^aA-airmf-page] The Generative AI Profile (NIST AI 600-1, July 26, 2024) applies it to generative AI and lists twelve risks, including information security and value chain and component integration.[^aA-ai600]

| Subcategory | What it says, in short | Identity control | Carried in |
|---|---|---|---|
| GOVERN 1.6 | Mechanisms are in place to inventory AI systems, resourced according to risk priorities | The use-case inventory joined to identity records | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 09](09-running-the-inventory-scan.md) |
| GOVERN 1.7 | Processes exist to decommission and phase out AI systems safely | The leaver process for AI identities | [Ch 05](05-owners-sponsors-and-lifecycle.md) |
| GOVERN 2.1 | Roles, responsibilities and lines of communication for AI risk are documented and clear | Sponsor, technical owner, risk acceptor and authorizing official named per system | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 08](08-who-owns-ai-identity.md) |
| GOVERN 3.2 | Policies define and differentiate roles for human-AI configurations and oversight | Delegated versus autonomous access recorded per identity | [Ch 04](04-kinds-of-ai-identity.md) |
| GOVERN 6.1 | Policies address AI risks from third-party entities | Vendor-created identities and consent grants governed as the agency's | [Ch 06](06-credentials-and-least-privilege.md) |
| MAP 3.5 | Processes for human oversight are defined, assessed and documented | Who can disable the identity, recorded and tested | [Ch 05](05-owners-sponsors-and-lifecycle.md) |
| MAP 4.2 | Internal risk controls for components, including third-party AI technologies, are identified and documented | Each AI component's identities listed in the security plan | [Ch 10](10-evidence-and-authorization.md) |
| MEASURE 2.7 | AI system security and resilience are evaluated and documented | Credential and permission evidence in the assessment | [Ch 06](06-credentials-and-least-privilege.md), [Ch 10](10-evidence-and-authorization.md) |
| MANAGE 2.4 | Mechanisms and assigned responsibilities exist to supersede, disengage or deactivate AI systems that behave outside intended use | Disable rights on the identity; a tested disable | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 07](07-monitoring-drift-and-shadow-ai.md) |
| MANAGE 3.1 | Risks from third-party resources are monitored and controls applied | Monitoring of vendor-operated identities in the tenant | [Ch 07](07-monitoring-drift-and-shadow-ai.md) |
| MANAGE 4.1 | Post-deployment monitoring plans include input capture, appeal and override, decommissioning, incident response, recovery and change management | Identity monitoring and the leaver process in the continuous monitoring strategy | [Ch 07](07-monitoring-drift-and-shadow-ai.md), [Ch 10](10-evidence-and-authorization.md) |

## NIST SP 800-53 Rev. 5 controls

### Account management and access (AC)

| Control | Title | What it asks, in short | NIST SP 800-53B | FedRAMP 2026 | Identity control | Carried in | Other books |
|---|---|---|---|---|---|---|---|
| AC-2 | Account Management | Define account types; assign account managers; require approval to create accounts; create, modify, disable and remove accounts by policy; monitor use; align with personnel termination and transfer | L M H | B C D | Agent and workload identities as a defined account type, each with a sponsor; sponsor leaving triggers the AI identity's mover or leaver path | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 07](07-monitoring-drift-and-shadow-ai.md), [Ch 10](10-evidence-and-authorization.md) | [Book 03](../b03-hr-identity/index.md) |
| AC-2(1) | Automated System Account Management | Support account management with automated mechanisms | M H | C D | Identity governance platform manages AI identities' access packages and expiry | [Ch 05](05-owners-sponsors-and-lifecycle.md) | [Book 04, Chapter 09](../b04-access/09-access-governance.md) |
| AC-2(3) | Disable Accounts | Disable accounts that have expired, are no longer associated with a user, violate policy or are inactive | M H | C D | Expiry is the review; retired and orphaned AI identities are disabled | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 09](09-running-the-inventory-scan.md) | — |
| AC-2(4) | Automated Audit Actions | Automatically audit account creation, modification, enabling, disabling and removal | M H | C D | Directory audit logs for AI identity changes; changes outside the pipeline are findings | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md) |
| AC-2(12) | Account Monitoring for Atypical Usage | Monitor accounts for defined atypical usage and report it | H | C D | Risk detection for workload and agent identities | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md) |
| AC-3 | Access Enforcement | Enforce approved authorizations for logical access | L M H | B C D | Conditional Access and resource-level authorization for AI identities | [Ch 06](06-credentials-and-least-privilege.md) | [Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md) |
| AC-6 | Least Privilege | Allow only the access users, or processes acting on their behalf, need for assigned tasks | M H | C D | Least-privilege application and delegated permissions; access mode chosen first | [Ch 06](06-credentials-and-least-privilege.md) | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md) |
| AC-6(5) | Privileged Accounts | Restrict privileged accounts to defined personnel or roles | M H | C D | No standing privileged roles for AI identities | [Ch 06](06-credentials-and-least-privilege.md) | [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md) |
| AC-6(7) | Review of User Privileges | Review privileges at a defined frequency and remove what isn't needed | M H | C D | Permission review at each access package expiry | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 10](10-evidence-and-authorization.md) | [Book 04, Chapter 09](../b04-access/09-access-governance.md) |
| AC-6(9) | Log Use of Privileged Functions | Log the execution of privileged functions | M H | C D | Audit coverage for any privileged action an AI identity takes | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | — |

### Identification and authentication (IA)

| Control | Title | What it asks, in short | NIST SP 800-53B | FedRAMP 2026 | Identity control | Carried in | Other books |
|---|---|---|---|---|---|---|---|
| IA-2 | Identification and Authentication (Organizational Users) | Uniquely identify and authenticate organizational users and associate that identification with processes acting on their behalf | L M H | B C D | An agent acting on behalf of a user carries that user's identity; the delegation is recorded | [Ch 04](04-kinds-of-ai-identity.md) | [Book 04](../b04-access/index.md) |
| IA-4 | Identifier Management | Authorize, select and assign identifiers for individuals, groups, roles, services or devices; prevent reuse | L M H | B C D | Each AI identity has its own identifier, joined to the inventory use case ID; IDs not reused | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 05](05-owners-sponsors-and-lifecycle.md) | — |
| IA-5 | Authenticator Management | Verify identity at distribution; sufficient strength; procedures for lost, compromised and revoked authenticators; change or refresh on schedule; protect authenticator content | L M H | B C D | Managed identities and federation first, certificates only where neither applies; no stored client secrets | [Ch 06](06-credentials-and-least-privilege.md) | [Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md), [Book 07](../b07-pki/index.md) |
| IA-5(2) | Public Key-based Authentication | Protect the private key; map the authenticated identity to the account; validate certificate paths | M H | C D | Certificate credentials for AI identities where certificates are used | [Ch 06](06-credentials-and-least-privilege.md) | [Book 07](../b07-pki/index.md) |
| IA-8 | Identification and Authentication (Non-organizational Users) | Uniquely identify and authenticate non-organizational users or processes acting on their behalf | L M H | B C D | Agents acting for members of the public or external partners | [Ch 04](04-kinds-of-ai-identity.md) | — |
| IA-9 | Service Identification and Authentication | Uniquely identify and authenticate defined services and applications before communicating with devices, users or other services | none | none | Tailored in for any system containing an AI system that calls services with its own identity | [Ch 06](06-credentials-and-least-privilege.md), [Ch 10](10-evidence-and-authorization.md) | — |

### Audit, monitoring and assessment (AU, CA, SI)

| Control | Title | What it asks, in short | NIST SP 800-53B | FedRAMP 2026 | Identity control | Carried in | Other books |
|---|---|---|---|---|---|---|---|
| AU-2 | Event Logging | Identify loggable events, select those to log, and justify the selection | L M H P | B C D | AI identity sign-ins, token issuance and permission changes are selected events | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md) |
| AU-6 | Audit Record Review, Analysis, and Reporting | Review and analyze audit records at a defined frequency for unusual activity; report findings | L M H | B C D | AI identities' logs in the review scope, with named reviewers | [Ch 07](07-monitoring-drift-and-shadow-ai.md), [Ch 10](10-evidence-and-authorization.md) | [Book 12](../b12-security-operations/index.md) |
| AU-6(1) | Automated Process Integration | Integrate review, analysis and reporting with automated mechanisms | M H | C D | AI identity findings flow into the one finding queue | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md) |
| AU-12 | Audit Record Generation | Generate audit records for the defined events on defined components | L M H | B C D | Every AI identity produces sign-in and audit records; static API keys outside the directory don't, and are a finding | [Ch 06](06-credentials-and-least-privilege.md), [Ch 07](07-monitoring-drift-and-shadow-ai.md) | — |
| CA-5 | Plan of Action and Milestones | Document planned remediation; update from assessments, audits and monitoring | L M H P | none listed | Open AI identity findings, waivers and pilot certifications as POA&M items or governed exceptions | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) |
| CA-6 | Authorization | Assign authorizing officials; authorize before operation; update authorizations at a defined frequency | L M H P | B C D | AI systems authorized in the existing process; no identity before authorization | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) |
| CA-7 | Continuous Monitoring | A system-level monitoring strategy with metrics, frequencies, ongoing assessment, response and reporting | L M H P | B C D | AI identity evidence in the monitoring stream; vintage comparison as an event | [Ch 07](07-monitoring-drift-and-shadow-ai.md), [Ch 10](10-evidence-and-authorization.md) | [Book 12, Chapter 12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md) |
| SI-4 | System Monitoring | Monitor to detect attacks and unauthorized connections; identify unauthorized use; analyze events | L M H | B C D | Detection of shadow AI services and anomalous agent activity | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md) |

### Inventory, risk, privacy and planning (CM, PM, RA, PL, AT)

| Control | Title | What it asks, in short | NIST SP 800-53B | FedRAMP 2026 | Identity control | Carried in | Other books |
|---|---|---|---|---|---|---|---|
| CM-8 | System Component Inventory | An inventory that accurately reflects the system, includes every component, has no duplicates, and carries accountability information | L M H | B C D | Each inventoried AI system resolves to components in a system's component inventory | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 10](10-evidence-and-authorization.md) | [Book 15, Chapter 07](../b15-day2-operations/07-the-cmdb-and-asset-identity.md) |
| CM-8(3) | Automated Unauthorized Component Detection | Detect unauthorized components automatically and act on them | M H | C D | Shadow AI discovery from the directory, consent grants and network | [Ch 07](07-monitoring-drift-and-shadow-ai.md) | — |
| CM-8(4) | Accountability Information | Identify the individuals responsible and accountable for administering components | H | D | Sponsor and technical owner on every AI component; adopted at Moderate by design | [Ch 05](05-owners-sponsors-and-lifecycle.md), [Ch 10](10-evidence-and-authorization.md) | — |
| PM-5 | System Inventory | Develop and update an inventory of organizational systems | none | none | The AI use-case inventory is joined to, not substituted for, the system inventory | [Ch 09](09-running-the-inventory-scan.md), [Ch 10](10-evidence-and-authorization.md) | — |
| PM-5(1) | Inventory of Personally Identifiable Information | Maintain an inventory of systems, applications and projects that process PII | P | none | The inventory's `has_pii` answer checked against the privacy office's register | [Ch 09](09-running-the-inventory-scan.md) | [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) |
| RA-3 | Risk Assessment | Assess risk, including from external parties, and update it | L M H P | B C D | The system risk assessment covers its AI identities' permissions | [Ch 10](10-evidence-and-authorization.md) | — |
| RA-8 | Privacy Impact Assessments | Conduct PIAs before developing or procuring IT that processes PII | P | none | PII with no PIA located is a finding routed to the privacy officer | [Ch 07](07-monitoring-drift-and-shadow-ai.md), [Ch 09](09-running-the-inventory-scan.md) | [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) |
| PL-2 | System Security and Privacy Plans | Plans that describe the system, its components and its controls | L M H P | B C D | AI components and identities in the security plan, in OSCAL | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) |
| AT-3 | Role-based Training | Role-based training before access and at a defined frequency | L M H P | B C D | Operators of high-impact AI trained; completion checked against the operators' group | [Ch 10](10-evidence-and-authorization.md) | [Book 16](../b16-people/index.md) |

### External services and supply chain (SA, SR)

| Control | Title | What it asks, in short | NIST SP 800-53B | FedRAMP 2026 | Identity control | Carried in | Other books |
|---|---|---|---|---|---|---|---|
| SA-4 | Acquisition Process | Put security and privacy requirements, documentation requirements and responsibilities in acquisition contracts | L M H P | B C D | Contracts for AI services state how the service's identities are created, credentialed and logged in the agency's tenant | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 07](../b14-compliance/07-supply-chain-risk-management.md) |
| SA-9 | External System Services | Require providers to comply with agency requirements; define oversight roles; monitor provider compliance | L M H P | B C D | AI services the agency uses are authorized through the SaaS gate; their tenant identities are governed by the agency | [Ch 06](06-credentials-and-least-privilege.md), [Ch 10](10-evidence-and-authorization.md) | [Book 15, Chapter 06](../b15-day2-operations/06-saas-integration-governance.md) |
| SA-9(2) | Identification of Functions, Ports, Protocols, and Services | Require providers to identify the functions, ports, protocols and services the external service uses | M H | C D | The permissions and APIs an AI service uses are declared before consent | [Ch 06](06-credentials-and-least-privilege.md) | — |
| SR-2 | Supply Chain Risk Management Plan | A plan for supply chain risk across the system's life | L M H | B C D | Third-party models and AI services in the plan | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 07](../b14-compliance/07-supply-chain-risk-management.md) |
| SR-3 | Supply Chain Controls and Processes | Processes to identify and address supply chain weaknesses; documented controls | L M H | B C D | Vendor-created identities reviewed as a supply chain element | [Ch 06](06-credentials-and-least-privilege.md) | [Book 14, Chapter 07](../b14-compliance/07-supply-chain-risk-management.md) |
| SR-5 | Acquisition Strategies, Tools, and Methods | Use acquisition strategies and contract tools to address supply chain risk | L M H | B C D | M-25-22's contract terms for monitoring and new-feature notice | [Ch 10](10-evidence-and-authorization.md) | — |
| SR-6 | Supplier Assessments and Reviews | Assess and review supplier risk at a defined frequency | M H | C D | Review of each AI vendor's identity and logging practices | [Ch 10](10-evidence-and-authorization.md) | [Book 14, Chapter 07](../b14-compliance/07-supply-chain-risk-management.md) |

## Other federal sources the book relies on

| Source | What it says that matters here | Status on October 21, 2026 | Carried in |
|---|---|---|---|
| OMB Circular A-130, Appendix I | Authorize systems before operation; transition to ongoing authorization when eligible and approved; reauthorize on a time- or event-driven basis[^aA-a130] | In force | [Ch 10](10-evidence-and-authorization.md) |
| FISMA, 44 U.S.C. § 3554(b)(5) | Testing and evaluation of security effectiveness no less than annually[^aA-fisma] | In force | [Ch 10](10-evidence-and-authorization.md) |
| NIST SP 800-37 Rev. 2 | Task P-18 system registration; Task R-4 risk acceptance can't be delegated; Task M-7 system disposal[^aA-sp80037] | In force | [Ch 10](10-evidence-and-authorization.md) |
| OMB 2025 AI reporting guidance and inventory | Annual inventory; 2025 deadlines December 22, 2025 and January 28, 2026; waiver reporting; 3,611 individually reported use cases, 1,818 deployed or piloted, 445 high-impact as of April 13, 2026[^aA-guidance][^aA-repo] | Current cycle; no 2026 repository as of this date | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 09](09-running-the-inventory-scan.md) |
| OMB M-26-04 | Unbiased AI principles for large language models the agency procures (December 11, 2025)[^aA-m2604] | In force | [Ch 02](02-what-federal-ai-rules-require.md) |
| Executive Order 14434 | Agencies use "Super Intelligence" and "SI" in place of "Artificial Intelligence" and "AI" in non-statutory documents, to the extent law permits; earlier documents unchanged; same underlying definition[^aA-eo14434] | Signed September 29, 2026 | [Ch 10](10-evidence-and-authorization.md) |
| NIST SP 800-53 overlays for AI systems (COSAiS, renamed COSIS) | Five proposed use cases; concept paper August 14, 2025; annotated outline for predictive AI January 8, 2026; renamed October 20, 2026[^aA-cosis] | No public draft overlay | [Ch 10](10-evidence-and-authorization.md) |
| CISA, BOD 23-01 | Asset discovery every 7 days and vulnerability enumeration every 14 days for networked assets; excludes ephemeral assets and third-party SaaS[^aA-bod2301] | In force | [Ch 09](09-running-the-inventory-scan.md) |
| CISA, CDM program | Tools, integration services and dashboards delivered to agencies; agency dashboards push summary data to the Federal Dashboard[^aA-cdm] | In force | [Ch 09](09-running-the-inventory-scan.md) |
| CISA and partners, *Careful Adoption of Agentic AI Services* | Joint guidance on adopting agentic AI, published May 1, 2026[^aA-cisa-agentic] | Guidance, not a requirement | [Ch 06](06-credentials-and-least-privilege.md), [Ch 07](07-monitoring-drift-and-shadow-ai.md) |
| FedRAMP 2025 AI Prioritization Initiative | Prioritized certification of conversational AI services meeting five criteria; August 2025 to April 2026[^aA-fr-ai] | Closed to new entrants | [Ch 10](10-evidence-and-authorization.md) |

## Requirements the source material cited but that don't say what was claimed

| Claim in the source material | What the requirement actually says | Where the book corrects it |
|---|---|---|
| M-25-21 creates an AI-specific authorization to operate, or the inventory's `have_ato` field is a gate | M-25-21 tells agencies to keep following A-130's authorization requirements for AI systems and keeps AI use-case risk acceptance separate from system authorization; the inventory field reports existing posture[^aA-m2521][^aA-dictionary] | [Ch 02](02-what-federal-ai-rules-require.md), [Ch 10](10-evidence-and-authorization.md) |
| The inventory has no fields for human training or public feedback | The 2025 data dictionary has `hi_training_established` and `hi_public_consultation`, among nine `hi_*` fields covering all seven practices; the accurate point is that the fields report status and evidence nothing[^aA-dictionary] | [Ch 03](03-the-inventory-as-an-identity-source.md) |
| "Over 1,800 AI systems" deployed; "1,480 live systems" scanned | The 2025 repository counts 1,818 deployed or piloted *use cases*; 1,480 is the number with a stage recorded in the consolidated file; use cases aren't systems[^aA-repo] | [Ch 03](03-the-inventory-as-an-identity-source.md), [Ch 09](09-running-the-inventory-scan.md) |
| PT-2 is the privacy impact assessment control; AR-2 covers privacy risk assessment | In Rev. 5, PT-2 is Authority to Process Personally Identifiable Information and RA-8 is Privacy Impact Assessments; the AR family was a Rev. 4 privacy appendix and isn't in Rev. 5[^aA-53] | [Ch 07](07-monitoring-drift-and-shadow-ai.md) |
| CA-8 (penetration testing) and SI-7 (software integrity) evidence AI authorization and agentic governance gaps | Neither describes an authorization or identity gap; the relevant controls are CA-6, CA-7, AC-2, IA-4 and IA-9[^aA-53] | [Ch 07](07-monitoring-drift-and-shadow-ai.md) |
| CDM ran discovery centrally against agency data and pushed findings to agencies | CDM delivers tools to agencies; agency dashboards hold object-level data and push summaries to the Federal Dashboard[^aA-cdm] | [Ch 09](09-running-the-inventory-scan.md) |
| IA-9 is covered by the baseline | IA-9 is in no NIST baseline and no FedRAMP 2026 class; it has to be tailored in[^aA-53b][^aA-fedramp-controls] | [Ch 10](10-evidence-and-authorization.md) |

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Evidence and Authorization for AI Systems](10-evidence-and-authorization.md) · [Book index](index.md)
:::

[^aA-m2521]: Office of Management and Budget, M-25-21, *Accelerating Federal Use of AI through Innovation, Governance, and Public Trust*, April 3, 2025, Overview and Scope; Sections 3(a)(i)–(ii), 3(b)(i)–(v), 4(a)(i)–(iv), 4(b)(i)–(vii) and 6; footnotes 11, 21, 22, 25 and 29; consolidated table of actions, <https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-21-Accelerating-Federal-Use-of-AI-through-Innovation-Governance-and-Public-Trust.pdf> (accessed Oct 21, 2026).
[^aA-m2522]: Office of Management and Budget, M-25-22, *Driving Efficient Acquisition of Artificial Intelligence in Government*, April 3, 2025, Sections 2(c)–(d), 3(e)(ii)–(iii), 4(d) contract terms E and G, and 4(e)(i), <https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-22-Driving-Efficient-Acquisition-of-Artificial-Intelligence-in-Government.pdf> (accessed Oct 21, 2026).
[^aA-m2604]: Office of Management and Budget, M-26-04, *Increasing Public Trust in Artificial Intelligence Through Unbiased AI Principles*, December 11, 2025, <https://www.whitehouse.gov/wp-content/uploads/2025/12/M-26-04-Increasing-Public-Trust-in-Artificial-Intelligence-Through-Unbiased-AI-Principles-1.pdf> (accessed Oct 21, 2026).
[^aA-omb-memos]: Office of Management and Budget, "Memoranda," list of memoranda through M-26-19, <https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/> (accessed Oct 21, 2026).
[^aA-guidance]: Office of Management and Budget, *Guidance on 2025 Agency Artificial Intelligence Reporting*, Sections 1 and 2, in the 2025 Federal Agency AI Use Case Inventory repository, <https://github.com/ombegov/2025-Federal-Agency-AI-Use-Case-Inventory/tree/main/Reporting%20Instructions> (accessed Oct 21, 2026).
[^aA-repo]: Office of Management and Budget, "2025-Federal-Agency-AI-Use-Case-Inventory," README, Summary as of April 13, 2026, <https://github.com/ombegov/2025-Federal-Agency-AI-Use-Case-Inventory> (accessed Oct 21, 2026).
[^aA-dictionary]: Office of Management and Budget, `Validation/data_dictionary.md`, 2025 Federal Agency AI Use Case Inventory, columns 19 (`have_ato`) and 28–36 (`hi_*`), <https://github.com/ombegov/2025-Federal-Agency-AI-Use-Case-Inventory/blob/main/Validation/data_dictionary.md> (accessed Oct 21, 2026).
[^aA-airmf]: National Institute of Standards and Technology, AI 100-1, *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*, January 2023, Part 2 (Figure 5) and Tables 1–4, <https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf> (accessed Oct 21, 2026).
[^aA-airmf-page]: National Institute of Standards and Technology, "AI Risk Management Framework" (release date of January 26, 2023; revision under the White House AI Action Plan), <https://www.nist.gov/itl/ai-risk-management-framework> (accessed Oct 21, 2026).
[^aA-ai600]: National Institute of Standards and Technology, AI 600-1, *Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile*, July 2024, Section 2, <https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf> (accessed Oct 21, 2026).
[^aA-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, release 5.2.0; identifiers, titles and statements read from the OSCAL catalog (version 5.2.0, last modified May 11, 2026), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Oct 21, 2026).
[^aA-53b]: National Institute of Standards and Technology, SP 800-53B control baselines, release 5.2.0 OSCAL Low, Moderate, High and Privacy baseline profiles, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Oct 21, 2026).
[^aA-fedramp-controls]: FedRAMP, "Full Rev5 Control Reference," *FedRAMP Consolidated Rules for 2026*, family pages for AC, AT, AU, CA, CM, IA, PL, PM, RA, SA, SI and SR ("FedRAMP Rev5 Baselines" per control; CA-05, IA-09, PM-05, PM-05(01) and RA-08 show no class listing), <https://www.fedramp.gov/2026/reference/controls/> (accessed Oct 21, 2026).
[^aA-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource*, July 2016, Appendix I, §4.d, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Oct 21, 2026).
[^aA-fisma]: 44 U.S.C. § 3554(b)(5), <https://www.law.cornell.edu/uscode/text/44/3554> (accessed Oct 21, 2026).
[^aA-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations*, December 2018, Tasks P-18, R-4 and M-7, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Oct 21, 2026).
[^aA-eo14434]: Executive Order 14434 of September 29, 2026, "Inaugurating the Era of Super Intelligence," 91 FR 63129 (October 2, 2026), <https://www.federalregister.gov/documents/2026/10/02/2026-20321/inaugurating-the-era-of-super-intelligence> (accessed Oct 21, 2026).
[^aA-cosis]: National Institute of Standards and Technology, Computer Security Resource Center, "SP 800-53 Control Overlays for Super Intelligence Systems," <https://csrc.nist.gov/projects/cosis> (accessed Oct 21, 2026).
[^aA-bod2301]: Cybersecurity and Infrastructure Security Agency, BOD 23-01, *Improving Asset Visibility and Vulnerability Detection on Federal Networks*, October 3, 2022, <https://www.cisa.gov/news-events/directives/bod-23-01-improving-asset-visibility-and-vulnerability-detection-federal-networks> (accessed Oct 21, 2026).
[^aA-cdm]: Cybersecurity and Infrastructure Security Agency, "CDM Agency and Federal Dashboards," <https://cisa.gov/resources-tools/resources/cdm-agency-and-federal-dashboards>; and "Continuous Diagnostics and Mitigation (CDM) Program," <https://www.cisa.gov/resources-tools/programs/continuous-diagnostics-and-mitigation-cdm-program> (both accessed Oct 21, 2026).
[^aA-cisa-agentic]: Cybersecurity and Infrastructure Security Agency, "Careful Adoption of Agentic AI Services," May 1, 2026, <https://www.cisa.gov/resources-tools/resources/careful-adoption-agentic-ai-services> (accessed Oct 21, 2026).
[^aA-fr-ai]: FedRAMP, "FedRAMP AI," <https://www.fedramp.gov/ai/> (accessed Oct 21, 2026).
