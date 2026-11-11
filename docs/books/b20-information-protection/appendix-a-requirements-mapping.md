---
title: "Appendix A — Requirements Mapping: Controls, KSIs and Chapters"
description: "A compliance-enabling map, not a compliance claim: the NIST SP 800-53 Rev. 5 controls Book 20's chapters support, with what each control asks, the chapters that address it, the book that owns the rest and the evidence an assessor can expect; CISA's Zero Trust Maturity Model Data pillar functions; OMB M-22-09's data actions and the binding instruments beside them; FedRAMP's 2026 Key Security Indicators used as an evidence vocabulary; the closure-map rows the book carries; and the sources."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
part: Appendix
series-order: 90
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---

# Appendix A — Requirements Mapping: Controls, KSIs and Chapters

*A label, a DLP rule and an audit retention policy each contribute evidence to a control; none of them is the control, and the map has to keep the contribution and the judgment apart.*

::: {.callout-note}
## In this appendix
The NIST SP 800-53 Rev. 5 controls Book 20 supports, with what each asks, where the book addresses it, which book carries the rest and the evidence an assessor can expect. CISA's Zero Trust Maturity Model Data pillar, OMB M-22-09's data actions and the instruments beside them. FedRAMP's 2026 Key Security Indicators, used as a vocabulary for the evidence. The closure-map rows the book carries. Then the sources.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse Book 20's design and evidence in its own system security plans and assessment packages. It doesn't claim that following the book satisfies any requirement or control. Control selection, the organization-defined parameters, implementation statements and assessment belong to the agency and its assessors, and only the assessor or authorizing official decides whether a control is satisfied. Requirement wording is summarized; the cited documents govern. Every source was checked on November 11, 2026.
:::

## How to read the tables

- **Book 20** names the chapters whose procedures produce evidence for the requirement.
- **Also carried by** names the workbook book that owns the rest of it, so the map doesn't double-count: a control that Book 20 touches only for Purview usually has its main implementation elsewhere.
- **Evidence** is what an assessor can expect, drawn from the chapters' evidence checklists and the [evidence catalog](12-operations-and-evidence.md#evidence-catalog).

The book's conventions (five control states, authority labels, evidence checklist) are in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md). A license or cloud feature the tenant lacks is a dependency recorded in a decision record, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

## NIST SP 800-53 Rev. 5 controls

Control titles and what they ask are summarized from the Rev. 5 catalog (release 5.2.0).[^aA-53]

| Control | What it asks | Book 20 | Also carried by | Evidence |
|---|---|---|---|---|
| RA-2 Security Categorization | Categorize the system and its information; document and approve the result | [Ch 01](01-data-inventory-and-classification.md) | [Book 14, Appendix F](../b14-compliance/appendix-f-categorization-walkthrough.md) | Class register with each class's authority; the FIPS 199 categorization each class lives under |
| CM-12 Information Location | Identify and document where specified information is processed and stored, and the users who have access | [Ch 01](01-data-inventory-and-classification.md), [Ch 09](09-auto-labeling-and-sensitive-information-types.md) | [Book 06](../b06-data-platform/index.md) for databases | Dated content explorer inventory by class and location |
| PM-5(1) Inventory of Personally Identifiable Information | Maintain an inventory of systems, components or programs that process PII | [Ch 01](01-data-inventory-and-classification.md) | [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md) | Inventory of PII-bearing classes and locations |
| AC-16 Security and Privacy Attributes | Associate security and privacy attributes with information and keep them with it | [Ch 02](02-sensitivity-label-architecture.md), [Ch 03](03-label-publication-and-defaults.md), [Ch 09](09-auto-labeling-and-sensitive-information-types.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) | Label export; labeled sample; auto-labeling simulation and results |
| MP-3 Media Marking | Mark media with distribution limitations, handling caveats and applicable security markings | [Ch 02](02-sensitivity-label-architecture.md), [Ch 03](03-label-publication-and-defaults.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) for the CUI banner | Label content-marking settings; labeled sample showing the banner |
| AC-3 Access Enforcement | Enforce approved authorizations | [Ch 04](04-teams-groups-and-sharepoint-containers.md), [Ch 05](05-rights-management-and-recovery.md), [Ch 07](07-sharepoint-and-onedrive.md) | [Book 04](../b04-access/index.md) | Container label settings; encryption rights per label; site label report |
| AC-4 Information Flow Enforcement | Enforce approved authorizations for controlling the flow of information within and between systems | [Ch 06](06-exchange-message-encryption.md), [Ch 08](08-dlp-and-endpoint-controls.md) | [Book 09](../b09-network/index.md) for network flows | DLP policy export; mail flow rule export; DLP match and override records |
| AC-21 Information Sharing | Help users decide whether a sharing partner's authorizations match the information's restrictions | [Ch 04](04-teams-groups-and-sharepoint-containers.md), [Ch 06](06-exchange-message-encryption.md) | [Book 03, Chapter 15](../b03-hr-identity/15-external-partner-identity.md) | Container sharing settings; default sharing link; external-send policy tips |
| AC-5 Separation of Duties | Identify and document duties to separate and support them with access authorizations | [Ch 05](05-rights-management-and-recovery.md), [Ch 10](10-audit-insider-risk-and-communication-compliance.md), [Ch 12](12-operations-and-evidence.md) | [Book 04](../b04-access/index.md) | Purview role group membership; RACI; super user recovery approvals |
| AC-6 Least Privilege | Allow only the access users and processes need | [Ch 05](05-rights-management-and-recovery.md), [Ch 11](11-ai-data-security.md) | [Book 04](../b04-access/index.md), [Book 17](../b17-ai-identity/index.md) | Super user feature off at rest; PIM activation records; oversharing assessment results |
| SC-8 Transmission Confidentiality and Integrity | Protect the confidentiality and integrity of transmitted information | [Ch 06](06-exchange-message-encryption.md) | [Book 09](../b09-network/index.md) | Encrypted test message and the rule that encrypted it |
| SC-12 Cryptographic Key Establishment and Management | Establish and manage cryptographic keys under defined requirements | [Ch 05](05-rights-management-and-recovery.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#keys-the-agency-controls), [Book 07](../b07-pki/index.md) | Tenant key decision; Rights Management configuration export |
| SC-13 Cryptographic Protection | Implement the types of cryptography the organization requires | [Ch 05](05-rights-management-and-recovery.md), [Ch 06](06-exchange-message-encryption.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) | Encryption settings per label; message encryption configuration |
| SC-28 Protection of Information at Rest | Protect the confidentiality and integrity of information at rest | [Ch 05](05-rights-management-and-recovery.md), [Ch 07](07-sharepoint-and-onedrive.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md), [Book 06](../b06-data-platform/index.md) | Labels that encrypt; decryption-continuity test |
| MP-7 Media Use | Restrict or prohibit the use of types of media on systems | [Ch 08](08-dlp-and-endpoint-controls.md) | [Book 05](../b05-devices/index.md) | Endpoint DLP removable-media rule; audit of blocked copies |
| SI-4 System Monitoring | Monitor for attacks and unauthorized activity and provide information to defined roles | [Ch 08](08-dlp-and-endpoint-controls.md), [Ch 10](10-audit-insider-risk-and-communication-compliance.md), [Ch 11](11-ai-data-security.md) | [Book 12](../b12-security-operations/index.md) | DLP alerts; insider risk alerts; AI activity in activity explorer |
| AU-2 Event Logging; AU-12 Audit Record Generation | Identify the events to log; generate audit records for them | [Ch 10](10-audit-insider-risk-and-communication-compliance.md) | [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md) | Audit ingestion on; record types in the event list; searchable synthetic events |
| AU-6 Audit Record Review, Analysis, and Reporting | Review and analyze audit records and report findings | [Ch 10](10-audit-insider-risk-and-communication-compliance.md), [Ch 12](12-operations-and-evidence.md) | [Book 12](../b12-security-operations/index.md) | Review records; routing to the log platform |
| AU-11 Audit Record Retention | Retain audit records for a defined period | [Ch 10](10-audit-insider-risk-and-communication-compliance.md) | [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md) | Audit retention policy export |
| PM-12 Insider Threat Program | Implement an insider threat program with a cross-discipline team | [Ch 10](10-audit-insider-risk-and-communication-compliance.md) | [Book 14](../b14-compliance/index.md) | Insider risk charter; policy and role configuration; case handling records |
| CM-3 Configuration Change Control | Review, approve, document and monitor configuration-controlled changes | [Ch 12](12-operations-and-evidence.md), and the Enforcement step of every How section | [Book 13](../b13-governance/index.md) | Change records; dated configuration baseline exports |
| CA-7 Continuous Monitoring | A continuous monitoring strategy with metrics and assessment frequencies | [Ch 12](12-operations-and-evidence.md) | [Book 12, Chapter 12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md), [Book 13](../b13-governance/index.md) | The metrics in Chapter 12, at their cadence; drift results |
| IR-4 Incident Handling | Handle incidents through preparation, detection and analysis, containment, eradication and recovery | [Ch 08](08-dlp-and-endpoint-controls.md), [Ch 12](12-operations-and-evidence.md) | [Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md), [Book 15](../b15-day2-operations/index.md) | Data-incident runbook; DLP incident records |
| AT-2 Literacy Training and Awareness | Provide security and privacy literacy training | [Ch 03](03-label-publication-and-defaults.md) (help link) | [Book 16](../b16-people/index.md) | Training page linked from the label menu; completion records |

: NIST SP 800-53 Rev. 5 controls Book 20 supports {.striped .hover}

## CISA Zero Trust Maturity Model: the Data pillar

The model's Data pillar has five functions and three cross-cutting capabilities.[^aA-ztmm]

| Function | Book 20 | Also carried by | Evidence |
|---|---|---|---|
| Data Inventory Management | [Ch 01](01-data-inventory-and-classification.md), [Ch 09](09-auto-labeling-and-sensitive-information-types.md) | [Book 06](../b06-data-platform/index.md) | Content explorer inventory; class register |
| Data Categorization | [Ch 01](01-data-inventory-and-classification.md) to [Ch 03](03-label-publication-and-defaults.md), [Ch 09](09-auto-labeling-and-sensitive-information-types.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) | Labels, defaults and auto-labeling results |
| Data Availability | [Ch 05](05-rights-management-and-recovery.md) (decryption continuity) | [Book 14, Chapter 06](../b14-compliance/06-contingency-and-continuity.md) | Decryption-continuity test |
| Data Access | [Ch 04](04-teams-groups-and-sharepoint-containers.md), [Ch 07](07-sharepoint-and-onedrive.md), [Ch 08](08-dlp-and-endpoint-controls.md), [Ch 11](11-ai-data-security.md) | [Book 04](../b04-access/index.md) | Container settings; DLP; Copilot and AI controls |
| Data Encryption | [Ch 05](05-rights-management-and-recovery.md), [Ch 06](06-exchange-message-encryption.md) | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) | Encrypting labels; message encryption |
| Visibility and Analytics (cross-cutting) | [Ch 10](10-audit-insider-risk-and-communication-compliance.md), [Ch 12](12-operations-and-evidence.md) | [Book 12](../b12-security-operations/index.md) | Audit routing; metrics |
| Automation and Orchestration (cross-cutting) | [Ch 09](09-auto-labeling-and-sensitive-information-types.md), [Ch 12](12-operations-and-evidence.md) | [Book 13](../b13-governance/index.md) | Auto-labeling; configuration as code and drift checks |
| Governance (cross-cutting) | [Ch 01](01-data-inventory-and-classification.md), [Ch 12](12-operations-and-evidence.md) | [Book 11](../b11-zero-trust/index.md) | Decision records; RACI; closure-chain entries |

: CISA ZTMM v2.0 Data pillar functions and cross-cutting capabilities {.striped .hover}

## OMB M-22-09 and the instruments beside it

| Instrument | What it asks | Book 20 | Also carried by | Evidence |
|---|---|---|---|---|
| OMB M-22-09, Data (§III.E) | Initial automation of data categorization and security responses; audit of access to data in commercial cloud; comprehensive logging[^aA-m2209] | Ch 01 to 03, 09 and 10 | [Book 11, Appendix A](../b11-zero-trust/appendix-a-requirements-mapping.md) | Categorization scheme; auto-labeling; audit retention and routing |
| 32 CFR Part 2002 (CUI) | Mark and safeguard CUI under the CUI Registry's categories; CUI Basic at no less than moderate confidentiality[^aA-cfr2002] | Ch 01 to 03 | [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) | Class register; label markings; labeled sample |
| OMB M-26-14 (logging, which rescinded M-21-31) | Event monitoring, threat hunting, investigation and response under the agency's logging plan[^aA-m2614] | Ch 10 | [Book 12](../b12-security-operations/index.md) | Purview audit sources in the logging plan |
| CISA BOD 25-01 | Microsoft 365 tenants configured to the SCuBA baselines' required policies, with deviations documented[^aA-bod2501] | Ch 06, Ch 08, Ch 10 (the Purview and Exchange settings the baselines assess) | [Book 11, Chapter 04](../b11-zero-trust/04-scuba-and-bod-25-01.md) | ScubaGear results for the Purview and Exchange baselines; deviation records |

: Federal instruments {.striped .hover}

## FedRAMP's 2026 Key Security Indicators as an evidence vocabulary

FedRAMP's indicators are written for cloud service providers. As in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#alignment-with-fedramps-key-security-indicators), the program borrows them as a vocabulary for its own evidence; the mapping is the program's design, not FedRAMP's.[^aA-ksi]

| Indicator | FedRAMP's title | Book 20 evidence |
|---|---|---|
| KSI-SVC-SIN | Securing Information | Encrypting labels, message encryption, DLP enforcement records (Ch 05, 06, 08) |
| KSI-SVC-ASM | Automating Secret Management | Tenant key decision and Rights Management configuration (Ch 05) |
| KSI-SVC-RUD | Removing Unwanted Data | Spill handling for CUI found where it doesn't belong (Ch 08, Ch 12) |
| KSI-SVC-ACM | Automating Configuration Management | Labels, policies and DLP held as code with dated exports (Ch 02, 03, 12) |
| KSI-PIY-GIV | Generating Inventories | Content explorer inventory (Ch 01) |
| KSI-MLA-LET | Logging Event Types | Label, DLP, encryption and AI record types in the event list (Ch 10) |
| KSI-MLA-OSM | Operating SIEM Capability | Purview audit routed to the log platform (Ch 10; Book 12) |
| KSI-MLA-RVL | Reviewing Logs | Monthly label, DLP override and mismatch reviews (Ch 03, 04, 08) |
| KSI-CMT-LMC | Logging Changes | Purview configuration changes in the audit log and change records (Ch 12) |
| KSI-IAM-JIT | Authorizing Just-in-Time | Super user recovery through PIM (Ch 05) |
| KSI-IAM-ELP | Ensuring Least Privilege | Purview role groups; content explorer viewer roles (Ch 01, Ch 10) |
| KSI-INR-RIR | Reviewing Incident Response Procedures | Data-incident runbook reviews (Ch 12) |
| KSI-CED-RAT | Reviewing All Training | Label and encrypted-mail training ([Book 16](../b16-people/index.md)) |

: FedRAMP 2026 indicators used as an evidence vocabulary (program's design) {.striped .hover}

## The closure-map rows Book 20 carries

The Zero Trust Assessment closure update maps finding families to books. Book 20 carries these three, and each is ready for closure when every applicable control state has evidence; the authorizing official or assessor decides ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)).

| Row | Finding family | Chapters | Minimum evidence |
|---|---|---|---|
| CM-12 | No labels, defaults or containers | [Ch 02](02-sensitivity-label-architecture.md), [Ch 03](03-label-publication-and-defaults.md), [Ch 04](04-teams-groups-and-sharepoint-containers.md) | Policy export (label policies with their settings, container labels) and a labeled sample (file, email and container) |
| CM-13 | Rights Management / mail encryption | [Ch 05](05-rights-management-and-recovery.md), [Ch 06](06-exchange-message-encryption.md) | An encrypted test (decryption-continuity and message-encryption tests) and the transport-rule export |
| CM-14 (Book 20's part) | Audit and visibility gaps | [Ch 10](10-audit-insider-risk-and-communication-compliance.md), [Ch 12](12-operations-and-evidence.md) | Searchable synthetic events: a label applied and removed, and a DLP match, found by audit search and in the log platform |

: Closure-map rows carried by Book 20 {.striped .hover}

## Sources

- NIST SP 800-53 Rev. 5, release 5.2.0 OSCAL catalog. <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5>
- CISA, *Zero Trust Maturity Model*, Version 2.0, April 2023. <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf>
- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022. <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026. <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>
- CISA BOD 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024. <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services>
- 32 CFR Part 2002, *Controlled Unclassified Information*. <https://www.ecfr.gov/current/title-32/subtitle-B/chapter-XX/part-2002>
- FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*. <https://fedramp.gov/2026/reference/key-security-indicators/>

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 12 — Operations and Evidence](12-operations-and-evidence.md) · [Book index](index.md)
:::

[^aA-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, release 5.2.0, OSCAL catalog (controls RA-2, CM-12, PM-5(1), AC-16, MP-3, AC-3, AC-4, AC-21, AC-5, AC-6, SC-8, SC-12, SC-13, SC-28, MP-7, SI-4, AU-2, AU-6, AU-11, AU-12, PM-12, CM-3, CA-7, IR-4, AT-2), <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Nov 11, 2026).
[^aA-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §5.5 (Data) and §5.6 (Cross-Cutting Capabilities), <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Nov 11, 2026).
[^aA-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III.E, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Nov 11, 2026).
[^aA-cfr2002]: 32 CFR Part 2002, *Controlled Unclassified Information*, §2002.14(g) and §2002.20, as in effect October 1, 2026, <https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-32.xml?part=2002> (accessed Nov 11, 2026).
[^aA-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Nov 11, 2026).
[^aA-bod2501]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Nov 11, 2026).
[^aA-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026* (indicator titles; control mappings updated October 13, 2026), <https://fedramp.gov/2026/reference/key-security-indicators/> (accessed Nov 11, 2026).
