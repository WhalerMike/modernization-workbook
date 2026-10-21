---
title: "Appendix A — Control Crosswalk"
description: "The NIST SP 800-53 Rev. 5 controls the Federal Modernization Program addresses, family by family: each control's identifier and title, its NIST SP 800-53B baselines and its FedRAMP 2026 class membership as separate facts, the workbook book and chapter that carries it, and whether the program's design closes it, partly closes it or leaves it open."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Control Crosswalk

*A crosswalk row says where a control is built and whether its proof exists, not that an assessor has accepted either.*

::: {.callout-note}
## In this appendix
The reverse index for [Chapter 03](03-the-baseline-and-the-crosswalk.md): for every NIST SP 800-53 Rev. 5 control the program addresses, its title, the NIST SP 800-53B baselines that select it, the FedRAMP 2026 classes whose Rev5 baselines include it, the workbook chapter that builds or operates it, and its status in the program's design. Then what the crosswalk shows when the columns are read together, where it corrects its source, and the sources it was checked against.
:::

::: {.callout-important}
## A coverage index, not a compliance claim
A row here points to the chapter that treats a control as its subject. It doesn't claim the control is satisfied, inherited or shared on any system; that depends on the system's boundary and on the assessor's determination, and the authorizing official alone accepts residual risk. The status column is the program's design, not an assessment result. Control identifiers, titles, baselines and class memberships were checked on October 21, 2026.
:::

## How to read the crosswalk

- **Control and title.** Identifiers and titles are from SP 800-53 Rev. 5, release 5.2.0, which NIST issued on August 27, 2025.[^aA-53] Every identifier and title was checked against the release 5.2.0 export of NIST's Cybersecurity and Privacy Reference Tool on CSRC and against NIST's OSCAL catalog for the same release.[^aA-cprt] Enhancements carry the enhancement's own title; the parent control is the row above or the base identifier.
- **NIST SP 800-53B.** The NIST baselines that select the control: L, M and H for the Low, Moderate and High security baselines, and "Privacy" for the privacy baseline, which applies to systems whatever their impact level.[^aA-53b] Release 5.2.0 of SP 800-53B made no changes to the baselines.[^aA-53b] Membership was read from NIST's OSCAL baseline profiles and cross-checked against the CSRC export; the two agree for every row.[^aA-cprt][^aA-profiles]
- **FedRAMP 2026 class.** The FedRAMP Rev5 certification classes whose baselines include the control (B, C or D), read from the "FedRAMP Rev5 Baselines" line on each control in FedRAMP's Full Rev5 Control Reference.[^aA-fedramp-controls] FedRAMP's February 2026 notice set Class B to include the former Li-SaaS and Low baselines, Class C the Moderate baseline and Class D the High baseline.[^aA-ntc0004] "None" means the reference shows no class for that control. Keep this column apart from the NIST one: they often disagree, and the difference matters ([What the crosswalk shows](#what-the-crosswalk-shows)).
- **Workbook chapter.** The chapter in Books 00 to 13 where the program builds, configures or operates the control, written as book and chapter (B12 Ch07 is Book 12, Chapter 07). A dash means no book from 00 to 13 carries it; the family's Book 14 chapter, named above each table, describes what the agency has to establish.
- **Status (design).** The program's own design position, in three values:
  - **Closed**: a workbook chapter builds the mechanism, and the program's design records a machine-checked proof for it in the authoritative record. A control closes only when the mechanism exists and its proof is recorded ([Chapter 04](04-closure-with-proof.md)).
  - **Partly closed**: one half is in place. Usually a workbook chapter builds the mechanism, but the program doesn't yet record a proof for the control; the claim rests on the chapter's prose and the evidence it describes.
  - **Open**: the program describes the control, in Book 14 or in the Federal Compliance volumes, but no workbook book from 00 to 13 builds its mechanism and no proof is recorded. Most open rows are policies, plans and program-level functions the agency has to establish itself.

The program's design moves a row from partly closed to closed by recording its proof, not by writing more about it. Treat every status as dated: a closed row reopens when its evidence stops arriving ([Book 13, Chapter 07](../b13-governance/07-evidence-over-attestation.md)).

## What the crosswalk shows

Read the columns together and four patterns stand out.

**NIST baseline and FedRAMP class are different facts.** FedRAMP's class baselines add to NIST's, so a control can be in a FedRAMP class without being in the matching NIST baseline:[^aA-53b][^aA-fedramp-controls]

| Control | NIST SP 800-53B | FedRAMP 2026 class | What it means |
|---|---|---|---|
| SC-8, SC-8(1), SC-28 | M H | B C D | FedRAMP asks a Class B service for transmission and at-rest protection that NIST's Low baseline doesn't select |
| SI-2(3), SI-4(16) | none | C D | Remediation timeframes and correlated monitoring are FedRAMP additions at Class C; an agency system categorized Moderate selects neither unless the agency tailors them in |
| AU-6(4) | none | D | Central review and analysis is a FedRAMP High addition |
| AU-12(1), SC-12(1) | H | D | Both are High-only in both schemes; neither is a Moderate requirement |
| AU-10 | H | D | Non-repudiation is High-only in both; the program builds it anyway, as provenance for the record ([Book 13, Chapter 04](../b13-governance/04-change-control-and-provenance.md)) |
| CA-5 | L M H | none | NIST selects the plan of action and milestones at every level; FedRAMP's reference lists no class for it |

The last row reports what the reference shows; it isn't a reason to drop a POA&M. For an agency system, the NIST baseline its categorization selects is the starting point, and FedRAMP's class tells the agency what was assessed in a provider's service.[^aA-agency-use]

**Some controls the program addresses are in no baseline.** AT-2(1), AT-3(3), CA-7(3), IA-3(1), IA-9 and SI-4(7) are in neither NIST's nor FedRAMP's baselines.[^aA-53b][^aA-fedramp-controls] The program addresses them because they name exactly what it builds. An agency that wants them in its plan has to tailor them in, and shouldn't cite them as baseline requirements.

**Program management and privacy controls sit outside the class baselines.** None of the PM or PT controls here carries a FedRAMP class, and the PM and PT family pages in FedRAMP's reference show no class line at all.[^aA-fedramp-controls] On the NIST side, the PT controls and PM-7, PM-9, PM-11 and PM-14 are in the privacy baseline only, and the other PM controls are in no baseline.[^aA-53b] These are the agency's own obligations: no cloud provider's certification can supply them.

**The open rows cluster in the governance families.** Contingency planning, program management, PII processing and transparency, supply chain risk management and awareness and training are almost entirely open, because no infrastructure book builds a contingency plan, a supplier agreement or a training record. That's why this book carries them: [Chapter 05](05-program-management-controls.md) to [Chapter 09](09-training-and-awareness-controls.md) describe what the agency has to establish and what evidence each control should leave. The technical families are mostly closed or partly closed, and the partly closed rows are the program's own queue: each needs its proof recorded, not more design.

## Control tables by family

### Access Control (AC)

Built in the identity and access books. Joiner, mover and leaver events drive account management from the HR record ([Book 03](../b03-hr-identity/index.md)); privilege, separation of duties and session controls are Conditional Access and Privileged Identity Management design ([Book 04](../b04-access/index.md)); remote access and information flow are network design ([Book 09](../b09-network/index.md)). Book 14's view: [Chapter 03](03-the-baseline-and-the-crosswalk.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| AC-2 | Account Management | L M H | B C D | [B03 Ch08](../b03-hr-identity/08-joiner-mover-leaver.md), [B04 Ch09](../b04-access/09-access-governance.md), [B04 Ch10](../b04-access/10-access-as-code-and-evidence.md) | Closed |
| AC-2(1) | Automated System Account Management | M H | C D | [B03 Ch05](../b03-hr-identity/05-the-provisioning-pipeline.md), [B03 Ch11](../b03-hr-identity/11-drift-metrics-and-evidence.md) | Closed |
| AC-2(3) | Disable Accounts | M H | C D | [B03 Ch08](../b03-hr-identity/08-joiner-mover-leaver.md) | Closed |
| AC-2(4) | Automated Audit Actions | M H | C D | [B04 Ch10](../b04-access/10-access-as-code-and-evidence.md) | Closed |
| AC-2(13) | Disable Accounts for High-risk Individuals | M H | C D | [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Partly closed |
| AC-3 | Access Enforcement | L M H | B C D | [B04 Ch03](../b04-access/03-the-conditional-access-model.md), [B04 Ch10](../b04-access/10-access-as-code-and-evidence.md) | Closed |
| AC-4 | Information Flow Enforcement | M H | C D | [B09 Ch03](../b09-network/03-what-tic-3-requires.md), [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Closed |
| AC-5 | Separation of Duties | M H | C D | [B04 Ch02](../b04-access/02-why-standing-privilege-fails.md), [B04 Ch09](../b04-access/09-access-governance.md) | Closed |
| AC-6 | Least Privilege | M H | C D | [B04 Ch02](../b04-access/02-why-standing-privilege-fails.md), [B04 Ch10](../b04-access/10-access-as-code-and-evidence.md) | Closed |
| AC-6(1) | Authorize Access to Security Functions | M H | C D | [B04 Ch04](../b04-access/04-privileged-roles-and-tiers.md) | Partly closed |
| AC-6(2) | Non-privileged Access for Nonsecurity Functions | M H | C D | [B04 Ch04](../b04-access/04-privileged-roles-and-tiers.md) | Partly closed |
| AC-6(5) | Privileged Accounts | M H | C D | [B04 Ch04](../b04-access/04-privileged-roles-and-tiers.md), [B04 Ch08](../b04-access/08-pim-self-request-with-approval.md) | Partly closed |
| AC-6(9) | Log Use of Privileged Functions | M H | C D | [B04 Ch08](../b04-access/08-pim-self-request-with-approval.md) | Partly closed |
| AC-6(10) | Prohibit Non-privileged Users from Executing Privileged Functions | M H | C D | [B04 Ch04](../b04-access/04-privileged-roles-and-tiers.md), [B04 Ch08](../b04-access/08-pim-self-request-with-approval.md) | Partly closed |
| AC-7 | Unsuccessful Logon Attempts | L M H | B C D | [B04 Ch07](../b04-access/07-the-conditional-access-policy-library.md) | Partly closed |
| AC-11 | Device Lock | M H | C D | [B05 Ch10](../b05-devices/10-operating-and-evidencing-the-fleet.md) | Partly closed |
| AC-12 | Session Termination | M H | C D | [B04 Ch07](../b04-access/07-the-conditional-access-policy-library.md), [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Partly closed |
| AC-17 | Remote Access | L M H | B C D | [B09 Ch03](../b09-network/03-what-tic-3-requires.md) | Closed |
| AC-19 | Access Control for Mobile Devices | L M H | B C D | [B05 Ch04](../b05-devices/04-intune-first-onboarding.md) | Closed |
| AC-20 | Use of External Systems | L M H | B C D | [B09 Ch07](../b09-network/07-network-access-control.md) | Closed |

### Awareness and Training (AT)

No infrastructure book builds a training program. [Chapter 09](09-training-and-awareness-controls.md) covers the AT controls and the evidence they should leave; Book 16, People: Training & Education (planned, see the [workbook index](../index.md)), will carry training in depth.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| AT-2 | Literacy Training and Awareness | L M H, Privacy | B C D | — | Open |
| AT-2(1) | Practical Exercises | none | none | — | Open |
| AT-2(2) | Insider Threat | L M H | B C D | — | Open |
| AT-3 | Role-based Training | L M H, Privacy | B C D | — | Open |
| AT-3(3) | Practical Exercises | none | none | — | Open |
| AT-3(5) | Processing Personally Identifiable Information | Privacy only | none | — | Open |
| AT-4 | Training Records | L M H, Privacy | B C D | — | Open |

### Audit and Accountability (AU)

The evidence contract and the security operations pipeline carry the logging controls ([Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md)); provenance and the protection of the record are governance design ([Book 13](../b13-governance/index.md)). Book 14's view: [Chapter 11](11-the-authorization-package.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| AU-2 | Event Logging | L M H, Privacy | B C D | [B12 Ch03](../b12-security-operations/03-identity-telemetry.md), [B12 Ch04](../b12-security-operations/04-platform-and-m365-telemetry.md) | Closed |
| AU-3 | Content of Audit Records | L M H | B C D | [B12 Ch02](../b12-security-operations/02-the-evidence-contract.md) | Closed |
| AU-6 | Audit Record Review, Analysis, and Reporting | L M H | B C D | [B12 Ch05](../b12-security-operations/05-from-log-warehouse-to-detection.md) | Closed |
| AU-6(1) | Automated Process Integration | M H | C D | [B12 Ch02](../b12-security-operations/02-the-evidence-contract.md), [B12 Ch05](../b12-security-operations/05-from-log-warehouse-to-detection.md) | Closed |
| AU-6(4) | Central Review and Analysis | none | D | [B12 Ch05](../b12-security-operations/05-from-log-warehouse-to-detection.md) | Partly closed |
| AU-7 | Audit Record Reduction and Report Generation | M H | C D | [B12 Ch05](../b12-security-operations/05-from-log-warehouse-to-detection.md) | Partly closed |
| AU-8 | Time Stamps | L M H | B C D | [B12 Ch02](../b12-security-operations/02-the-evidence-contract.md) | Partly closed |
| AU-9 | Protection of Audit Information | L M H | B C D | [B13 Ch07](../b13-governance/07-evidence-over-attestation.md), [B12 Ch10](../b12-security-operations/10-who-runs-security-operations.md) | Partly closed |
| AU-10 | Non-repudiation | H | D | [B13 Ch04](../b13-governance/04-change-control-and-provenance.md), [B13 Ch07](../b13-governance/07-evidence-over-attestation.md) | Partly closed |
| AU-11 | Audit Record Retention | L M H, Privacy | B C D | [B04 Ch08](../b04-access/08-pim-self-request-with-approval.md), [B12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md) | Partly closed |
| AU-12 | Audit Record Generation | L M H | B C D | [B12 Ch01](../b12-security-operations/01-you-cant-defend-what-you-cant-see.md), [B12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md) | Closed |
| AU-12(1) | System-wide and Time-correlated Audit Trail | H | D | [B12 Ch02](../b12-security-operations/02-the-evidence-contract.md) | Closed |

### Assessment, Authorization, and Monitoring (CA)

Continuous monitoring is built in Book 12 and governed in Book 13; the authorization decision itself is the authorizing official's. Book 14's view: [Chapter 11](11-the-authorization-package.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| CA-2 | Control Assessments | L M H, Privacy | B C D | [B13 Ch07](../b13-governance/07-evidence-over-attestation.md), [B11 Ch10](../b11-zero-trust/10-evidence-not-verdicts.md) | Closed |
| CA-3 | Information Exchange | L M H | B C D | [B10 Ch11](../b10-cloud-boundary/11-the-authorization-package.md) | Closed |
| CA-5 | Plan of Action and Milestones | L M H, Privacy | none | [B12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md), [B13 Ch09](../b13-governance/09-who-governs.md) | Closed |
| CA-6 | Authorization | L M H, Privacy | B C D | [B13 Ch11](../b13-governance/11-reciprocity-and-one-authorization.md) | Partly closed |
| CA-7 | Continuous Monitoring | L M H, Privacy | B C D | [B12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md), [B13 Ch02](../b13-governance/02-drift-is-the-primary-threat.md) | Closed |
| CA-7(1) | Independent Assessment | M H | C D | [B13 Ch05](../b13-governance/05-deterministic-governance.md) | Partly closed |
| CA-7(3) | Trend Analyses | none | none | [B12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md) | Partly closed |

### Configuration Management (CM)

One authoritative baseline, every change to it controlled, and the estate compared against it: [Book 13, Chapters 03 and 04](../b13-governance/index.md) carry the design, and [Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md) the baselines and patching. The component inventory is the join key for every other family ([Book 10, Chapter 06](../b10-cloud-boundary/06-ipam-and-network-as-code.md)). Book 14's view: [Chapter 04](04-closure-with-proof.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| CM-2 | Baseline Configuration | L M H | B C D | [B12 Ch07](../b12-security-operations/07-patch-configuration-and-baselines.md), [B13 Ch03](../b13-governance/03-one-authoritative-record.md) | Closed |
| CM-3 | Configuration Change Control | M H | C D | [B13 Ch04](../b13-governance/04-change-control-and-provenance.md), [B10 Ch07](../b10-cloud-boundary/07-the-front-door.md) | Closed |
| CM-5 | Access Restrictions for Change | L M H | B C D | [B13 Ch04](../b13-governance/04-change-control-and-provenance.md), [B10 Ch07](../b10-cloud-boundary/07-the-front-door.md) | Closed |
| CM-6 | Configuration Settings | L M H | B C D | [B12 Ch07](../b12-security-operations/07-patch-configuration-and-baselines.md), [B12 Ch08](../b12-security-operations/08-cloud-native-posture.md) | Closed |
| CM-7 | Least Functionality | L M H | B C D | [B12 Ch08](../b12-security-operations/08-cloud-native-posture.md) | Closed |
| CM-7(1) | Periodic Review | M H | C D | [B12 Ch08](../b12-security-operations/08-cloud-native-posture.md) | Partly closed |
| CM-8 | System Component Inventory | L M H | B C D | [B10 Ch06](../b10-cloud-boundary/06-ipam-and-network-as-code.md), [B12 Ch07](../b12-security-operations/07-patch-configuration-and-baselines.md) | Closed |

### Contingency Planning (CP)

Apart from the telecommunications controls, which the network book designs, the contingency family is open in the program's design. [Chapter 06](06-contingency-and-continuity.md) describes the plan, the testing and the alternate sites the agency has to establish.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| CP-2 | Contingency Plan | L M H | B C D | — | Open |
| CP-2(1) | Coordinate with Related Plans | M H | C D | — | Open |
| CP-2(8) | Identify Critical Assets | M H | C D | — | Open |
| CP-3 | Contingency Training | L M H | B C D | — | Open |
| CP-4 | Contingency Plan Testing | L M H | B C D | — | Open |
| CP-4(1) | Coordinate with Related Plans | M H | C D | — | Open |
| CP-6 | Alternate Storage Site | M H | C D | — | Open |
| CP-6(1) | Separation from Primary Site | M H | C D | — | Open |
| CP-7 | Alternate Processing Site | M H | C D | — | Open |
| CP-7(1) | Separation from Primary Site | M H | C D | — | Open |
| CP-7(3) | Priority of Service | M H | C D | — | Open |
| CP-8 | Telecommunications Services | M H | C D | [B09 Ch02](../b09-network/02-transport-is-physics-control-is-compliance.md), [B09 Ch03](../b09-network/03-what-tic-3-requires.md) | Partly closed |
| CP-8(1) | Priority of Service Provisions | M H | C D | [B09 Ch03](../b09-network/03-what-tic-3-requires.md) | Partly closed |
| CP-9 | System Backup | L M H | B C D | — | Open |
| CP-10 | System Recovery and Reconstitution | L M H | B C D | — | Open |

### Identification and Authentication (IA)

Built in the identity, access, device, certificate and data platform books. Book 14's view: [Chapter 03](03-the-baseline-and-the-crosswalk.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| IA-2 | Identification and Authentication (Organizational Users) | L M H | B C D | [B02 Ch10](../b02-identity/10-migrating-and-governing.md), [B04 Ch10](../b04-access/10-access-as-code-and-evidence.md) | Closed |
| IA-2(1) | Multi-factor Authentication to Privileged Accounts | L M H | B C D | [B04 Ch07](../b04-access/07-the-conditional-access-policy-library.md) | Partly closed |
| IA-2(2) | Multi-factor Authentication to Non-privileged Accounts | L M H | B C D | [B04 Ch07](../b04-access/07-the-conditional-access-policy-library.md) | Partly closed |
| IA-3 | Device Identification and Authentication | M H | C D | [B05 Ch04](../b05-devices/04-intune-first-onboarding.md), [B09 Ch07](../b09-network/07-network-access-control.md) | Closed |
| IA-3(1) | Cryptographic Bidirectional Authentication | none | none | [B09 Ch07](../b09-network/07-network-access-control.md) | Partly closed |
| IA-4 | Identifier Management | L M H | B C D | [B03 Ch04](../b03-hr-identity/04-attribute-authority.md), [B03 Ch08](../b03-hr-identity/08-joiner-mover-leaver.md) | Closed |
| IA-5 | Authenticator Management | L M H | B C D | [B02 Ch10](../b02-identity/10-migrating-and-governing.md) | Closed |
| IA-5(1) | Password-based Authentication | L M H | B C D | [B02 Ch10](../b02-identity/10-migrating-and-governing.md) | Partly closed |
| IA-5(2) | Public Key-based Authentication | M H | C D | [B07 Ch08](../b07-pki/08-lifecycle-monitoring-and-decommissioning.md) | Closed |
| IA-9 | Service Identification and Authentication | none | none | [B06 Ch09](../b06-data-platform/09-what-arc-provides-to-sql-server.md), [B06 Ch10](../b06-data-platform/10-arc-deployment-sequencing.md) | Partly closed |
| IA-11 | Re-authentication | L M H | B C D | [B04 Ch07](../b04-access/07-the-conditional-access-policy-library.md) | Partly closed |

### Incident Response (IR)

Incident handling, reporting and the response plan are security operations design ([Book 12, Chapter 11](../b12-security-operations/11-detection-engineering-and-response.md)). Incident response training is covered in [Chapter 09](09-training-and-awareness-controls.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| IR-2 | Incident Response Training | L M H, Privacy | B C D | — | Open |
| IR-4 | Incident Handling | L M H, Privacy | B C D | [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Partly closed |
| IR-6 | Incident Reporting | L M H, Privacy | B C D | [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Partly closed |
| IR-8 | Incident Response Plan | L M H, Privacy | B C D | [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Partly closed |

### Media Protection (MP)

Treated as data protection and classification in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md). Physical media handling stays with the agency.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| MP-2 | Media Access | L M H | B C D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |
| MP-3 | Media Marking | M H | C D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |
| MP-4 | Media Storage | M H | C D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |
| MP-5 | Media Transport | M H | C D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |

### Planning (PL)

The program's security and privacy architecture is set by its principles ([Book 00, Chapter 04](../b00-orientation/04-the-principles.md)) and its platform foundation ([Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md)). The system-level architecture in each security plan is the agency's. Book 14's view: [Chapter 03](03-the-baseline-and-the-crosswalk.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| PL-8 | Security and Privacy Architectures | M H, Privacy | B C D | [B00 Ch04](../b00-orientation/04-the-principles.md), [B01 Ch03](../b01-transformation-arc/03-platform-foundation.md) | Partly closed |

### Program Management (PM)

Program management controls are organization-wide, not system-level. [Chapter 05](05-program-management-controls.md) covers them, and [Chapter 07](07-supply-chain-risk-management.md) covers PM-30 with the supply chain family.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| PM-1 | Information Security Program Plan | none | none | — | Open |
| PM-2 | Information Security Program Leadership Role | none | none | — | Open |
| PM-5 | System Inventory | none | none | [B06 Ch04](../b06-data-platform/04-the-estate-inventory.md) | Partly closed |
| PM-7 | Enterprise Architecture | Privacy only | none | — | Open |
| PM-9 | Risk Management Strategy | Privacy only | none | — | Open |
| PM-11 | Mission and Business Process Definition | Privacy only | none | — | Open |
| PM-14 | Testing, Training, and Monitoring | Privacy only | none | — | Open |
| PM-15 | Security and Privacy Groups and Associations | none | none | — | Open |
| PM-30 | Supply Chain Risk Management Strategy | none | none | — | Open |

### Personnel Security (PS)

Termination and transfer are leaver and mover events driven by the HR record ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md)).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| PS-4 | Personnel Termination | L M H | B C D | [B03 Ch08](../b03-hr-identity/08-joiner-mover-leaver.md) | Closed |
| PS-5 | Personnel Transfer | L M H | B C D | [B03 Ch08](../b03-hr-identity/08-joiner-mover-leaver.md) | Closed |

### Personally Identifiable Information Processing and Transparency (PT)

The PT family is open in the program's design: no infrastructure book establishes the authority to process, the purposes, consent or notice. [Chapter 08](08-privacy-pii-processing.md) describes what the agency's privacy program has to put in place; [Book 03, Appendix B](../b03-hr-identity/appendix-b-security-and-privacy.md) applies the same questions to the HR-to-identity data flow.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| PT-1 | Policy and Procedures | Privacy only | none | — | Open |
| PT-2 | Authority to Process Personally Identifiable Information | Privacy only | none | — | Open |
| PT-3 | Personally Identifiable Information Processing Purposes | Privacy only | none | — | Open |
| PT-4 | Consent | Privacy only | none | — | Open |
| PT-5 | Privacy Notice | Privacy only | none | — | Open |
| PT-7 | Specific Categories of Personally Identifiable Information | Privacy only | none | — | Open |

### Risk Assessment (RA)

Vulnerability monitoring is built in [Book 12, Chapter 06](../b12-security-operations/06-vulnerability-management.md). RA-3 is carried at program level by the risk register in [Book 00, Appendix A](../b00-orientation/appendix-a-risk-register-and-traceability.md); a system-level risk assessment is the agency's, and Book 14's view is [Chapter 11](11-the-authorization-package.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| RA-3 | Risk Assessment | L M H, Privacy | B C D | [B00 App A](../b00-orientation/appendix-a-risk-register-and-traceability.md) | Partly closed |
| RA-5 | Vulnerability Monitoring and Scanning | L M H | B C D | [B12 Ch06](../b12-security-operations/06-vulnerability-management.md) | Closed |
| RA-5(2) | Update Vulnerabilities to Be Scanned | L M H | B C D | [B12 Ch06](../b12-security-operations/06-vulnerability-management.md) | Partly closed |
| RA-5(5) | Privileged Access | M H | C D | [B12 Ch06](../b12-security-operations/06-vulnerability-management.md) | Partly closed |

### System and Services Acquisition (SA)

External services are governed through the boundary and the adapter model ([Book 10](../b10-cloud-boundary/index.md), [Book 13, Chapter 08](../b13-governance/08-the-adapter-model.md)). Supplier-side risk is covered in [Chapter 07](07-supply-chain-risk-management.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| SA-8 | Security and Privacy Engineering Principles | L M H | B C D | [B01 Ch10](../b01-transformation-arc/10-analyzing-the-estate.md), [B01 Ch12](../b01-transformation-arc/12-migration-roadmap.md) | Partly closed |
| SA-9 | External System Services | L M H, Privacy | B C D | [B10 Ch11](../b10-cloud-boundary/11-the-authorization-package.md), [B13 Ch08](../b13-governance/08-the-adapter-model.md) | Closed |
| SA-9(2) | Identification of Functions, Ports, Protocols, and Services | M H | C D | [B09 Ch12](../b09-network/12-microsoft-365-traffic.md) | Closed |
| SA-11 | Developer Testing and Evaluation | M H, Privacy | C D | [B12 Ch08](../b12-security-operations/08-cloud-native-posture.md) | Closed |
| SA-15 | Development Process, Standards, and Tools | M H | C D | — | Open |

### System and Communications Protection (SC)

The network, naming, certificate and data protection books carry the family ([Book 08](../b08-ddi/index.md), [Book 07](../b07-pki/index.md), [Book 09](../b09-network/index.md), [Book 12](../b12-security-operations/index.md)). SC-5 is carried only as a resiliency condition in the network book's exemption instruments.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| SC-5 | Denial-of-service Protection | L M H | B C D | [B09 App A](../b09-network/appendix-a-optimize-exemption-instruments.md) | Partly closed |
| SC-7 | Boundary Protection | L M H | B C D | [B09 Ch02](../b09-network/02-transport-is-physics-control-is-compliance.md), [B12 Ch08](../b12-security-operations/08-cloud-native-posture.md) | Closed |
| SC-7(3) | Access Points | M H | C D | [B09 Ch07](../b09-network/07-network-access-control.md) | Partly closed |
| SC-7(5) | Deny by Default — Allow by Exception | M H | C D | [B09 Ch05](../b09-network/05-sd-wan-sase-and-governed-transport.md), [B09 Ch07](../b09-network/07-network-access-control.md) | Partly closed |
| SC-7(7) | Split Tunneling for Remote Devices | M H | C D | [B09 Ch12](../b09-network/12-microsoft-365-traffic.md) | Partly closed |
| SC-7(8) | Route Traffic to Authenticated Proxy Servers | M H | C D | [B09 Ch03](../b09-network/03-what-tic-3-requires.md) | Closed |
| SC-8 | Transmission Confidentiality and Integrity | M H | B C D | [B09 Ch02](../b09-network/02-transport-is-physics-control-is-compliance.md), [B09 Ch03](../b09-network/03-what-tic-3-requires.md) | Closed |
| SC-8(1) | Cryptographic Protection | M H | B C D | [B09 Ch03](../b09-network/03-what-tic-3-requires.md) | Closed |
| SC-12 | Cryptographic Key Establishment and Management | L M H | B C D | [B07 Ch08](../b07-pki/08-lifecycle-monitoring-and-decommissioning.md), [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |
| SC-12(1) | Availability | H | D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |
| SC-13 | Cryptographic Protection | L M H | B C D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |
| SC-17 | Public Key Infrastructure Certificates | M H | C D | [B07 Ch05](../b07-pki/05-who-owns-the-certificate-estate.md), [B07 Ch08](../b07-pki/08-lifecycle-monitoring-and-decommissioning.md) | Closed |
| SC-20 | Secure Name/Address Resolution Service (Authoritative Source) | L M H | B C D | [B08 Ch03](../b08-ddi/03-federal-requirements.md), [B08 Ch06](../b08-ddi/06-dns-identity-and-dnssec.md) | Closed |
| SC-21 | Secure Name/Address Resolution Service (Recursive or Caching Resolver) | L M H | B C D | [B08 Ch03](../b08-ddi/03-federal-requirements.md), [B08 Ch06](../b08-ddi/06-dns-identity-and-dnssec.md) | Closed |
| SC-22 | Architecture and Provisioning for Name/Address Resolution Service | L M H | B C D | [B08 Ch03](../b08-ddi/03-federal-requirements.md), [B08 Ch08](../b08-ddi/08-reference-architecture.md) | Closed |
| SC-28 | Protection of Information at Rest | M H | B C D | [B12 Ch09](../b12-security-operations/09-data-protection-and-classification.md) | Partly closed |

### System and Information Integrity (SI)

Flaw remediation, malicious code protection and monitoring are security operations design ([Book 12](../b12-security-operations/index.md)); information retention for identity records is in [Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md).

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| SI-2 | Flaw Remediation | L M H | B C D | [B12 Ch07](../b12-security-operations/07-patch-configuration-and-baselines.md), [B05 Ch10](../b05-devices/10-operating-and-evidencing-the-fleet.md) | Closed |
| SI-2(2) | Automated Flaw Remediation Status | M H | C D | [B12 Ch07](../b12-security-operations/07-patch-configuration-and-baselines.md), [B13 Ch10](../b13-governance/10-ticket-to-machine.md) | Closed |
| SI-2(3) | Time to Remediate Flaws and Benchmarks for Corrective Actions | none | C D | [B12 Ch06](../b12-security-operations/06-vulnerability-management.md) | Closed |
| SI-3 | Malicious Code Protection | L M H | B C D | [B12 Ch08](../b12-security-operations/08-cloud-native-posture.md), [B09 Ch02](../b09-network/02-transport-is-physics-control-is-compliance.md) | Closed |
| SI-4 | System Monitoring | L M H | B C D | [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Closed |
| SI-4(2) | Automated Tools and Mechanisms for Real-time Analysis | M H | C D | [B12 Ch05](../b12-security-operations/05-from-log-warehouse-to-detection.md) | Partly closed |
| SI-4(4) | Inbound and Outbound Communications Traffic | M H | C D | [B12 Ch05](../b12-security-operations/05-from-log-warehouse-to-detection.md) | Partly closed |
| SI-4(7) | Automated Response to Suspicious Events | none | none | [B12 Ch11](../b12-security-operations/11-detection-engineering-and-response.md) | Partly closed |
| SI-4(16) | Correlate Monitoring Information | none | C D | [B12 Ch02](../b12-security-operations/02-the-evidence-contract.md) | Closed |
| SI-5 | Security Alerts, Advisories, and Directives | L M H | B C D | [B12 Ch06](../b12-security-operations/06-vulnerability-management.md) | Partly closed |
| SI-12 | Information Management and Retention | L M H, Privacy | B C D | [B03 Ch11](../b03-hr-identity/11-drift-metrics-and-evidence.md) | Closed |

### Supply Chain Risk Management (SR)

The supply chain family is open or partly closed. Supplier assessment is touched where zero trust assessment extends to services beyond Microsoft 365 ([Book 11, Chapter 06](../b11-zero-trust/06-beyond-microsoft-365.md)), but the plan, the acquisition terms, notification agreements and component authenticity are the agency's to establish. [Chapter 07](07-supply-chain-risk-management.md) covers them.

| Control | Title | NIST SP 800-53B | FedRAMP 2026 class | Workbook chapter | Status (design) |
|---|---|---|---|---|---|
| SR-1 | Policy and Procedures | L M H | B C D | — | Open |
| SR-2 | Supply Chain Risk Management Plan | L M H | B C D | — | Open |
| SR-3 | Supply Chain Controls and Processes | L M H | B C D | [B11 Ch06](../b11-zero-trust/06-beyond-microsoft-365.md) | Partly closed |
| SR-5 | Acquisition Strategies, Tools, and Methods | L M H | B C D | — | Open |
| SR-6 | Supplier Assessments and Reviews | M H | C D | [B11 Ch06](../b11-zero-trust/06-beyond-microsoft-365.md) | Partly closed |
| SR-8 | Notification Agreements | L M H | B C D | — | Open |
| SR-10 | Inspection of Systems or Components | L M H | B C D | — | Open |
| SR-11 | Component Authenticity | L M H | B C D | — | Open |

## Where this appendix corrects its source

The control-by-control mapping behind this appendix was drafted in July 2026, against FedRAMP's 20x pilot vocabulary and a book-and-volume layout that the workbook has since replaced.

| Source said | What the record shows |
|---|---|
| Each control maps to a "FedRAMP 20x KSI" such as KSI-IAM, KSI-MLA or KSI-022 | FedRAMP's 2026 Key Security Indicators are 46 outcome statements in ten themes, each with its own identifier (for example KSI-CED-RAT for reviewing training) and its own list of related controls; no indicator is numbered KSI-022, and a theme prefix such as KSI-IAM names a group, not an indicator.[^aA-ksi] The indicators bind cloud service providers seeking certification, not agencies. This appendix drops the column; [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md) maps the governance controls to the current indicators. |
| A control is "addressed" when a volume or book of the compliance series treats it | The index now names the workbook chapter that builds the control, and says separately whether the program's design records its proof. Many rows the source listed as addressed have no build chapter; they are open here. |
| Control titles as written in each volume | Every title was rechecked against release 5.2.0. The source's titles were right in substance; capitalization now follows NIST's, for example "Multi-factor," "Re-authentication" and "Denial-of-service Protection."[^aA-cprt] |
| Baseline position not stated | Both NIST baselines and FedRAMP classes are given for every row, as separate columns. |

## Sources

Every source below was opened on October 21, 2026.

- NIST, SP 800-53 Rev. 5, release 5.2.0. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
- NIST, Cybersecurity and Privacy Reference Tool, SP 800-53 release 5.2.0 export. <https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_2_0/home>
- NIST, SP 800-53B, release 5.2.0. <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final>
- NIST, OSCAL catalog and Low, Moderate, High and Privacy baseline profiles for SP 800-53 Rev. 5. <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json>
- FedRAMP, Full Rev5 Control Reference. <https://www.fedramp.gov/2026/reference/controls/>
- FedRAMP, Notice NTC-0004. <https://www.fedramp.gov/notices/0004/>
- FedRAMP, Key Security Indicators. <https://www.fedramp.gov/2026/reference/key-security-indicators/>
- FedRAMP, Using a FedRAMP Certified Cloud Service. <https://www.fedramp.gov/2026/agencies/use/>

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 12 — The Series as a Map](12-the-series-as-a-map.md) · [Book index](index.md) · [Next: Appendix B — Product Inventory Questionnaire →](appendix-b-product-inventory-questionnaire.md)
:::

[^aA-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020 (includes updates as of December 10, 2020), planning note of August 27, 2025 announcing release 5.2.0, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 21, 2026).
[^aA-cprt]: National Institute of Standards and Technology, Cybersecurity and Privacy Reference Tool, SP_800_53_5_2_0 JSON export (control and enhancement titles, and security and privacy baseline relationships), <https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_2_0/home>; titles cross-checked against the OSCAL catalog, version 5.2.0, last modified May 11, 2026, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (both accessed Oct 21, 2026).
[^aA-53b]: National Institute of Standards and Technology, SP 800-53B, *Control Baselines for Information Systems and Organizations*, September 2020 (includes updates as of December 10, 2020), abstract and planning note of August 27, 2025 (release 5.2.0, "no changes to the baselines"), <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final> (accessed Oct 21, 2026).
[^aA-profiles]: National Institute of Standards and Technology, OSCAL baseline profiles `NIST_SP-800-53_rev5_LOW-baseline_profile.json`, `_MODERATE-`, `_HIGH-` and `_PRIVACY-baseline_profile.json`, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Oct 21, 2026).
[^aA-fedramp-controls]: FedRAMP, "Full Rev5 Control Reference," *FedRAMP Consolidated Rules for 2026*, built from the NIST SP 800-53 Rev. 5.2.0 OSCAL catalog; family pages for AC, AT, AU, CA, CM, CP, IA, IR, MP, PL, PM, PS, PT, RA, SA, SC, SI and SR, "FedRAMP Rev5 Baselines" line on each control, <https://www.fedramp.gov/2026/reference/controls/> (accessed Oct 21, 2026).
[^aA-ntc0004]: FedRAMP, Notice NTC-0004, *Initial Outcome from RFC-0020 FedRAMP Authorization Designations*, February 25, 2026, <https://www.fedramp.gov/notices/0004/> (accessed Oct 21, 2026).
[^aA-agency-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^aA-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, indicator identifiers, themes and "Related SP 800-53 Controls," including the control mapping updates of October 13, 2026, <https://www.fedramp.gov/2026/reference/key-security-indicators/> (accessed Oct 21, 2026).
