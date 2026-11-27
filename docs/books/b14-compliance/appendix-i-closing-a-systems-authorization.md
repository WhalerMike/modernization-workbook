---
title: "Appendix I — Closing a Retired System's Authorization"
description: "The authorization side of retiring a system: NIST SP 800-37 Rev. 2 Task M-7 (System Disposal) as ten closure steps, each with its owner, its output and the control it supports (CA-3, AC-2, MP-6, SR-12, CM-8, PM-5, CA-6), the authorizing official's closing decision, the inventories OMB Circular A-130 requires, a closure record template and a Copilot prompt, and what is requirement and what is design."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 98
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix I — Closing a Retired System's Authorization

*A system can be switched off and still be authorized, inventoried, monitored and connected on paper. Retirement isn't finished until the authorization, the inventories and the agreements say it's gone.*

## In this appendix

The ten steps that close a system's authorization when the system is removed from operation, in the order the work depends on, each with its owner, what it produces and the control it supports. The authorizing official's closing decision. The inventories that have to show the system gone. A closure record template with a Copilot prompt. Where this sits beside the records and sanitization checklist in [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist), and what is requirement and what is design.

## When it applies

Whenever a system leaves operation: an application the portfolio retires or replaces ([Book 18, Chapter 02](../b18-application-modernization/02-triaging-the-portfolio.md)), Active Directory at gate G5, a sync server, an AD FS farm, a certificate authority, a distribution point. NIST's task covers parts of systems too: Task M-7 "also applies to system elements that are removed from operation."[^aI-m7] A component retired inside a system that stays in operation needs steps 5 to 7 and an updated plan, not a closing decision.

## What the sources require

NIST SP 800-37 Rev. 2 makes disposal the last task of the Monitor step. Task M-7: "Implement a system disposal strategy and execute required actions when a system is removed from operation."[^aI-m7]

| From Task M-7 | What it says |
|---|---|
| Expected outputs | "Disposal strategy; updated system component inventory; updated security and privacy plans" |
| Primary responsibility | The system owner |
| Supporting roles | The authorizing official or designated representative, the information owner or steward, the system security and privacy officers, the senior accountable official for risk management, the senior agency information security officer and the senior agency official for privacy |
| What organizations do | Implement the disposal controls ("media sanitization; configuration management and control; component authenticity; and record retention"); update "organizational tracking and management systems (including inventory systems)"; make the posture reports reflect the system's status; notify "users and application owners hosted on the disposed system"; and review and assess "any control inheritance relationships" for impact |
| The inventory | "Organizations removing a system from operation update the inventory of information systems to reflect the removal." |

The controls the steps support, from SP 800-53 Rev. 5:[^aI-sp80053]

| Control | What it asks |
|---|---|
| CA-3 Information Exchange | Approve and manage exchanges with other systems under agreements, and "review and update the agreements" |
| AC-2 Account Management | Manage and remove the system's accounts (Book 02 and Book 04 carry the account procedures) |
| MP-6 Media Sanitization | "Sanitize [organization-defined system media] prior to disposal, release out of organizational control, or release for reuse" |
| SR-12 Component Disposal | Dispose of organization-defined "data, documentation, tools, or system components" with organization-defined techniques |
| CM-8 System Component Inventory | An inventory that "accurately reflects the system" and doesn't account for components "assigned to any other system" |
| PM-5 System Inventory | "Develop and update [organization-defined frequency] an inventory of organizational systems"; NIST notes it's the organization-wide inventory, not the component inventory of CM-8 |
| CA-6 Authorization | The authorizing official "authorizes the system to operate" before operations begin; the closing decision ends that authorization (step 9) |

OMB Circular A-130 requires the inventories: agencies shall "maintain an inventory of the agency's major information systems," the inventory 44 U.S.C. 3505(c) requires, and "an inventory of the agency's information systems that create, collect, use, process, store, maintain, disseminate, disclose, or dispose of PII."[^aI-a130] It defines an authorization to operate as "the official management decision given by a senior Federal official or officials to authorize operation of an information system and to explicitly accept the risk."[^aI-a130] Neither SP 800-37 nor A-130 prescribes a document that ends an authorization; step 9's closing decision is the program's design.

## The ten steps

The order follows dependencies: nothing is sanitized before its records are dealt with, and the inventories change only when the system really is gone.

| # | Step | Owner | Output | Supports |
|---|---|---|---|---|
| 1 | **Approve the disposal strategy.** What leaves, when, what replaces it, the records disposition, the dates of each step below | System owner; the authorizing official informed | The disposal strategy (M-7's first output) | Task M-7 |
| 2 | **Notify and review inheritance.** Tell the users, the application owners hosted on the system, and the owners of every system that inherits a control from it; each of those owners assesses the impact on their own plan | System owner | Notices sent; an inheritance impact note from each dependent system | Task M-7 |
| 3 | **End the information exchanges.** Terminate each interconnection security agreement, memorandum or service agreement the system is party to, and remove the connections, firewall rules and trust relationships | System owner with each partner system's owner | Each agreement's termination, dated; the rules removed | CA-3 |
| 4 | **Deal with the records.** The records officer's sign-off, each record class mapped to its disposition authority, records migrated where retention outlives the system | Records officer | The records disposition, as [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist) sets out | Federal records law (Book 00) |
| 5 | **Remove access.** Disable, then remove, the system's user, administrative and service accounts; revoke its certificates; remove its application registrations, service principals and secrets | Identity team | The accounts, certificates and registrations removed, each by its owner's record | AC-2, IA-5 |
| 6 | **Sanitize and dispose.** Sanitize the media and dispose of the components under the agency's procedure | System owner with the asset manager | Sanitization and disposal records, per component | MP-6, SR-12 |
| 7 | **Update the component inventory and the CMDB.** Each component retired or reassigned, none left counted against the system | Asset manager | The CMDB configuration items retired ([Book 15, Chapter 07](../b15-day2-operations/07-the-cmdb-and-asset-identity.md)) | CM-8 |
| 8 | **Close the POA&Ms and stop monitoring.** Each open item closed as retired with the evidence of steps 5 to 7; the system's scans, agents and log sources removed from continuous monitoring | ISSO | The POA&M closed; the monitoring scope updated ([Chapter 11](11-the-authorization-package.md)) | CA-5, CA-7 |
| 9 | **The closing decision.** The authorizing official records that the system no longer operates and that its authorization has ended, on the evidence of steps 1 to 8 | Authorizing official | The closing decision, filed with the final security and privacy plans | CA-6; Task M-7 (updated plans) |
| 10 | **Update the system inventories.** The system's entry in the agency's inventory of information systems and, if it held PII, in the PII inventory, marked retired; privacy compliance documents reviewed by the privacy office ([Chapter 08](08-privacy-pii-processing.md)) | Inventory owner; senior agency official for privacy | The inventories updated | PM-5; OMB A-130 |

Steps 5 to 8 are where a retirement usually stays half done: an account nobody disabled, a certificate that keeps renewing, a POA&M item still open, a scan target that keeps failing. Each leaves evidence a later assessment reads as a live system.

## The closure record

One record per retired system, filed in the repository with the final plans, so the closing decision rests on evidence rather than on a memo alone.

| Field | What it holds |
|---|---|
| System | Name, inventory identifier, impact level |
| Disposal strategy | Its location and approval date (step 1) |
| Notices and inheritance | Who was told, and each dependent system's impact note (step 2) |
| Exchanges ended | Each agreement, its partner and its termination date (step 3) |
| Records | The records officer's sign-off and the disposition authorities (step 4) |
| Access removed | Accounts, certificates and registrations removed, with the change records (step 5) |
| Sanitized and disposed | Per component, the method and the record (step 6) |
| Inventories | The CMDB configuration items retired (step 7); the system and PII inventory entries (step 10) |
| Monitoring and POA&Ms | The POA&M items closed and the monitoring scope change (step 8) |
| Closing decision | The authorizing official, the date and where the decision is filed (step 9) |

### Copilot prompt

Work stays at work: fill this in with your agency's own records and tools, never in a public repository.

> Here is the disposal strategy for a system we're retiring (paste it), and its security plan's list of interconnections, accounts, certificates and components (paste them). Build a closure record with these ten fields: system, disposal strategy, notices and inheritance, exchanges ended, records, access removed, sanitized and disposed, inventories, monitoring and POA&Ms, closing decision. For each field, list what has evidence and what is still open, and name the owner of each open item.

## What the closure supports, and the evidence

| Control or task | Evidence | FedRAMP 20x KSI the evidence lines up with |
|---|---|---|
| Task M-7, CA-6 | The disposal strategy, the final plans and the closing decision | — |
| CA-3 | Each agreement's dated termination | — |
| AC-2, IA-5 | The removal change records | KSI-IAM-AAM |
| MP-6, SR-12 | Sanitization and disposal records | — |
| CM-8, PM-5 | The retired configuration items and inventory entries | KSI-PIY-GIV |
| CA-5, CA-7 | The closed POA&M items and the monitoring scope change | KSI-CMT-LMC |

The evidence supports those controls; the assessor decides them. KSIs are FedRAMP's provider indicators, which an agency lines its own evidence up with.

## What is requirement and what is design

| Statement | Kind |
|---|---|
| Implement a disposal strategy when a system is removed from operation; its outputs are the strategy, an updated component inventory and updated plans; the system owner is primarily responsible | Requirement (SP 800-37 Rev. 2, Task M-7) |
| Notify hosted users and application owners; review inheritance; update the inventory of information systems | Requirement (Task M-7's discussion) |
| Maintain inventories of major information systems and of systems with PII | Requirement (OMB A-130) |
| The ten steps, their order and owners | Design |
| A closing decision by the authorizing official, and the closure record | Design: neither SP 800-37 nor A-130 prescribes a document that ends an authorization |
| The KSI alignment | Design |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix H — Recovering Active Directory During the Hybrid Period](appendix-h-ad-forest-recovery.md) · [Book index](index.md) · [Book 00, Chapter 10 — records before hardware](../b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist) · [RMF Map, Task M-7](../../reference/rmf-map.md)
:::

[^aI-m7]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, §3.7 Task M-7 (System Disposal): task statement, potential inputs, expected outputs, responsibilities and discussion, <https://doi.org/10.6028/NIST.SP.800-37r2> (accessed Nov 27, 2026).
[^aI-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CA-3, CA-6, CM-8, MP-6, PM-5 and SR-12, <https://doi.org/10.6028/NIST.SP.800-53r5> (accessed Nov 27, 2026).
[^aI-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource*, July 2016, §5.a(1)(a) (inventories, with footnote 4 on 44 U.S.C. 3505(c)) and §10.a (definition of "Authorization to Operate"), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Nov 27, 2026).
