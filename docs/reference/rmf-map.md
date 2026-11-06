---
title: "RMF Map"
subtitle: "The Risk Management Framework, step by step, across the books: each NIST SP 800-37 Rev. 2 task, where the workbook treats it, the evidence it produces, and where the workbook has nothing"
description: "Research under review: a map of the seven NIST Risk Management Framework steps and their 47 tasks onto the Federal Modernization Workbook's books and chapters, with the evidence each produces, the kits that generate it, and an honest list of what the workbook doesn't cover. For ISSOs, control assessors and authorizing officials."
research-status: in review
research-type: reference
research-book: "Books 00–18"
date-modified: 2026-11-06
last-reviewed: 2026-11-06
---

# RMF Map {.unnumbered}

An ISSO, a control assessor or an authorizing official reads the workbook with one question: where is the Risk Management Framework, and what does each step leave behind? The books answer it, but chapter by chapter. This page puts the answer in one place. For each of the seven steps of NIST SP 800-37 Rev. 2 it lists the tasks, the outputs NIST names, where the workbook treats each one, the evidence the program and its kits produce, and where the workbook has nothing.[^sp80037]

It builds on the [Federal Framework Crosswalk](federal-framework-crosswalk.md), which scores every book against the RMF as a whole; the [M-19-17 and FICAM Crosswalk](m-19-17-ficam-crosswalk.md) does the same job for identity.

::: {.callout-important}
## FISMA isn't a level

FISMA is a statute. It requires each agency to run an agency-wide information security program, with testing "no less than annually," and gives the agency head, the CIO and the senior agency information security officer their duties.[^fisma] It defines no impact levels. "FISMA Moderate" is shorthand for three separate facts: the system's FIPS 199 categorization rates confidentiality, integrity and availability;[^fips199] FIPS 200's high-water mark makes the system moderate when at least one is moderate and none is high;[^fips200] and the SP 800-53B moderate baseline was then selected and tailored. A FedRAMP certification class is a fourth fact, about a provider's service, not the agency's system. [Book 14, Chapter 01](../books/b14-compliance/01-proof-not-a-promise.md#what-moderate-means) traces all of them.
:::

## How to read this map

- **Task names** are NIST's, from SP 800-37 Rev. 2, Chapter 3 and Appendix D, read November 2, 2026; chapter links and anchors re-checked November 6, 2026.[^sp80037] The organization-level Prepare tasks are P-1 to P-7 and the system-level ones P-8 to P-18; the other steps run C-1 to C-3, S-1 to S-6, I-1 and I-2, A-1 to A-6, R-1 to R-5 and M-1 to M-7.
- **Coverage** is judged from what the chapters actually say:
  - **Covered**: the chapter tells the reader what the task requires, who does it, and what evidence shows it done.
  - **Partial**: the requirement is explained, but the workbook stops short of the artifact, or treats only part of the task.
  - **Not covered**: nothing in the books does the task.
- **Evidence** names the artifact an assessor would read. Where a kit in the repository's [`examples`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples) folder produces it, the kit is named. Every kit is illustrative: tested against fixtures, not proven against a production tenant.
- **Design guidance** is marked as such. The cadences, dispositions and freshness limits in Book 14 are the program's design, not a federal requirement; the books say so where they set them.

## The steps at a glance

The RMF runs top to bottom once, then loops through Monitor. A significant change can send a system back to an earlier step.

| Step | NIST's purpose for the step | Tasks | Main outputs | Deepest treatment in the workbook | Coverage |
|---|---|---|---|---|---|
| **1. Prepare** ↓ | "Essential activities to prepare the organization to manage security and privacy risks" | P-1 to P-18 | Roles, risk management strategy, tailored baselines, common controls, continuous monitoring strategy, authorization boundary, information types, requirements | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) and [Ch 10](../books/b14-compliance/10-who-owns-compliance.md); [Book 10](../books/b10-cloud-boundary/index.md) for the boundary | Partial |
| **2. Categorize** ↓ | "Categorize the system and information processed, stored, and transmitted based on an impact analysis" | C-1 to C-3 | System description; FIPS 199 categorization using SP 800-60; approval | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#what-moderate-means) | Partial |
| **3. Select** ↓ | "Select the set of NIST SP 800-53 controls to protect the system based on risk assessment(s)" | S-1 to S-6 | Selected and tailored baseline; common, hybrid and system-specific allocation; security and privacy plans with implementation statements; system monitoring strategy | [Book 14, Ch 03](../books/b14-compliance/03-the-baseline-and-the-crosswalk.md) and [Ch 10](../books/b14-compliance/10-who-owns-compliance.md); every book's requirements-mapping appendix | Covered |
| **4. Implement** ↓ | "Implement the controls and document how controls are deployed" | I-1, I-2 | Controls in place; as-implemented record | Books 02 to 12, 15, 17 and 18; [Book 13, Ch 04](../books/b13-governance/04-change-control-and-provenance.md) | Covered |
| **5. Assess** ↓ | "Assess to determine if the controls are in place, operating as intended, and producing the desired results" | A-1 to A-6 | Assessment plan (SAP), assessment report (SAR), remediation, POA&M | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md) | Partial |
| **6. Authorize** ↓ | "Senior official makes a risk-based decision to authorize the system (to operate)" | R-1 to R-5 | Authorization package, risk determination, risk response, authorization decision, reporting | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md); [Book 13, Ch 09](../books/b13-governance/09-who-governs.md#the-authorizing-officials-role) | Covered |
| **7. Monitor** ↻ | "Continuously monitor control implementation and risks to the system" | M-1 to M-7 | Change and significant-change analysis, ongoing assessments, package updates, reporting, ongoing authorization, disposal | [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md); [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#continuous-monitoring) | Covered |

Purposes are quoted from NIST's RMF overview page.[^rmfpage]

## Step 1 — Prepare

Prepare is the step SP 800-37 Rev. 2 added, and the one the workbook treats least evenly. The organization-level tasks are where an agency's own policy lives, and a workbook can explain them but not write them.

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| P-1 Risk Management Roles | Key roles identified and assigned | [Book 14, Ch 10](../books/b14-compliance/10-who-owns-compliance.md) (each role, who must be a government official, the responsibility matrix); the Who chapters of Books [02](../books/b02-identity/06-who-owns-the-migration.md), [03](../books/b03-hr-identity/07-who-owns-workforce-identity.md), [10](../books/b10-cloud-boundary/08-who-owns-the-boundary.md), [12](../books/b12-security-operations/10-who-runs-security-operations.md) and [13](../books/b13-governance/09-who-governs.md); [Book 16, Ch 03](../books/b16-people/03-the-compliance-track.md) trains the roles | Responsibility matrices (design guidance); PM-2, PM-10, PM-29 appointments are the agency's | Covered |
| P-2 Risk Management Strategy | Strategy and risk tolerance | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) explains PM-9 | None: the strategy and the tolerance are the agency's. The workbook supplies no template | Partial |
| P-3 Risk Assessment—Organization | Organization-wide risk assessment | [Book 00, Appendix A](../books/b00-orientation/appendix-a-risk-register-and-traceability.md) gives the program's risk register as an RA-3 input | The program risk register. It's a program's risks, not the agency's organization-wide assessment | Partial |
| P-4 Organizationally-Tailored Control Baselines and Cybersecurity Framework Profiles | Tailored baselines or CSF Profiles | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md) (SP 800-53B moderate baseline, 287 controls and enhancements in release 5.2.0) and [Ch 03](../books/b14-compliance/03-the-baseline-and-the-crosswalk.md); [Book 14, Appendix A](../books/b14-compliance/appendix-a-control-crosswalk.md); [Book 00, Ch 02](../books/b00-orientation/02-how-to-use-this-workbook.md) maps the CSF Functions to the books | The control crosswalk and its generated slice. No CSF Organizational Profile | Partial |
| P-5 Common Control Identification | Common controls published for inheritance | [Book 14, Ch 10](../books/b14-compliance/10-who-owns-compliance.md) (common control providers; P-5 in the matrix); [Book 12, Ch 10](../books/b12-security-operations/10-who-runs-security-operations.md#the-soc-is-a-common-control-provider); [Book 13, Ch 11](../books/b13-governance/11-reciprocity-and-one-authorization.md) (one package for a shared service) | Common control provider plans and assessment results, passed to inheriting system owners | Covered |
| P-6 Impact-Level Prioritization | Systems with the same impact level prioritized | — | — | **Not covered** |
| P-7 Continuous Monitoring Strategy—Organization | Organization-wide ISCM strategy | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) (PM-6, PM-31); [Book 13, Ch 12](../books/b13-governance/12-governance-at-scale.md) (the monitoring program as a chartered project) | The program's charter, cadence and metric set (design guidance) | Covered |
| P-8 Mission or Business Focus | Missions and processes the system supports | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) (PM-11); [Book 18, Ch 02](../books/b18-application-modernization/02-triaging-the-portfolio.md) (portfolio triage) | Evidence maps: [`examples/evidence-maps`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/evidence-maps) rank master records by what depends on them | Partial |
| P-9 System Stakeholders | Stakeholders identified | [Book 00, Ch 07](../books/b00-orientation/07-who-runs-the-program.md); the Who chapters above | Charter and responsibility matrices | Partial |
| P-10 Asset Identification | Assets that need protection | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) (PM-5 inventory); [Book 02, Ch 07](../books/b02-identity/07-read-only-discovery.md) and [Ch 08](../books/b02-identity/08-assessing-the-forest.md); [Book 06, Ch 04](../books/b06-data-platform/04-the-estate-inventory.md) (the database estate inventory, including which databases hold PII); [Book 05, Ch 10](../books/b05-devices/10-operating-and-evidencing-the-fleet.md) (device inventory reconciliation) | Kit runs with manifests: the [Start Kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit) forest assessment, the [non-person identity](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity) register, the [privileged access](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/privileged-access) inventory | Covered |
| P-11 Authorization Boundary | Boundary determined | [Book 10](../books/b10-cloud-boundary/index.md), especially [Ch 11](../books/b10-cloud-boundary/11-the-authorization-package.md) (the boundary as one artifact); [Book 13, Ch 12](../books/b13-governance/12-governance-at-scale.md) (boundaries as governed objects) | The boundary record in the package | Covered |
| P-12 Information Types | Information types identified | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md) quotes A-130's requirement to categorize under FIPS 199 and SP 800-60; [Book 12, Ch 09](../books/b12-security-operations/09-data-protection-and-classification.md) classifies data | Data classification labels. No SP 800-60 information-type list for any system | Partial |
| P-13 Information Life Cycle | Life cycle of each information type | [Book 14, Ch 08](../books/b14-compliance/08-privacy-pii-processing.md) (the PII data-flow map); [Book 18, Ch 06](../books/b18-application-modernization/06-compliance-by-design.md) (records from design to decommissioning) | The PII data-flow register (template) | Partial |
| P-14 Risk Assessment—System | System-level risk assessment | [Book 00, Appendix A](../books/b00-orientation/appendix-a-risk-register-and-traceability.md) explains RA-3 | None at system level | Partial |
| P-15 Requirements Definition | Security and privacy requirements defined | The requirements-mapping appendices, for example [Book 13, Appendix A](../books/b13-governance/appendix-a-requirements-mapping.md), [Book 11, Appendix A](../books/b11-zero-trust/appendix-a-requirements-mapping.md), [Book 12, Appendix A](../books/b12-security-operations/appendix-a-requirements-mapping.md) and [Book 17, Appendix A](../books/b17-ai-identity/appendix-a-requirements-mapping.md); [Book 14, Ch 03](../books/b14-compliance/03-the-baseline-and-the-crosswalk.md) | Requirement rows, each tied to a control and an evidence item | Covered |
| P-16 Enterprise Architecture | Placement in the EA | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) (PM-7); [Book 18, Ch 09](../books/b18-application-modernization/09-togaf-and-zachman.md) | Baseline, target and transition plan per A-130 §5.a(2) | Covered |
| P-17 Requirements Allocation | Requirements allocated to system and environment | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#who-owes-which-proof) (provider versus agency) and [Ch 03](../books/b14-compliance/03-the-baseline-and-the-crosswalk.md) | Crosswalk rows marked provider, agency or shared | Partial |
| P-18 System Registration | System registered | [Book 14, Ch 05](../books/b14-compliance/05-program-management-controls.md) (PM-5 system inventory) | Inventory entry; registration itself is an agency process | Partial |

## Step 2 — Categorize

The workbook explains categorization well and does none. It assumes a moderate system and says why; it never walks one system's information types through SP 800-60.

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| C-1 System Description | System characteristics documented | [Book 10, Ch 11](../books/b10-cloud-boundary/11-the-authorization-package.md) (the system description and boundary rows of the package) | Boundary record; the SSP's system characteristics | Partial |
| C-2 Security Categorization | FIPS 199 categorization, using SP 800-60 for information types | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#fips-199-an-impact-level-per-security-objective) (FIPS 199, FIPS 200's high-water mark, A-130's rule that PII systems are generally moderate or high for confidentiality); [Book 16, Ch 03](../books/b16-people/03-the-compliance-track.md#module-0) teaches it | None generated. **SP 800-60 information-type mapping: not covered.** SP 800-60 Vol. 1 Rev. 1 (August 2008) is the current final[^sp80060] | Partial |
| C-3 Security Categorization Review and Approval | Categorization approved by the AO or designated representative | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md) (RA-2 requires the AO's approval) | The approval is the agency's record | Partial |

## Step 3 — Select

Selection is where the workbook is deepest after authorization. Every book ends in a requirements mapping, and Book 14 says who owns each part of a control.

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| S-1 Control Selection | Baseline selected | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#sp-800-53b-the-moderate-baseline) and [Ch 03](../books/b14-compliance/03-the-baseline-and-the-crosswalk.md) | The control crosswalk ([Book 14, Appendix A](../books/b14-compliance/appendix-a-control-crosswalk.md)) | Covered |
| S-2 Control Tailoring | Tailored controls, with the rationale | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md) (tailoring under SP 800-53B and SP 800-37); parameter values are set chapter by chapter, for example [Book 14, Ch 06](../books/b14-compliance/06-contingency-and-continuity.md) and [Ch 09](../books/b14-compliance/09-training-and-awareness-controls.md); compensating controls in [Book 13, Ch 12](../books/b13-governance/12-governance-at-scale.md#three-ways-a-gap-closes) | No single tailored baseline with every organization-defined parameter value | Partial |
| S-3 Control Allocation | Common, hybrid and system-specific controls allocated | [Book 14, Ch 10](../books/b14-compliance/10-who-owns-compliance.md) (inherited controls aren't reassessed at system level; the assessor assesses only the system's part of a hybrid control); [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#what-the-agency-inherits-from-the-provider); [Book 13, Ch 11](../books/b13-governance/11-reciprocity-and-one-authorization.md) | Inheritance recorded in the SSP and the crosswalk | Covered |
| S-4 Documentation of Planned Control Implementations | Security and privacy plans with implementation statements | Implementation statements in the requirements-mapping appendices of Books [06](../books/b06-data-platform/appendix-a-requirements-mapping.md), [08](../books/b08-ddi/appendix-b-requirements-mapping.md), [09](../books/b09-network/appendix-b-requirements-mapping.md), [11](../books/b11-zero-trust/appendix-a-requirements-mapping.md), [12](../books/b12-security-operations/appendix-a-requirements-mapping.md), [13](../books/b13-governance/appendix-a-requirements-mapping.md) and [17](../books/b17-ai-identity/appendix-a-requirements-mapping.md); [Book 10, Ch 11](../books/b10-cloud-boundary/11-the-authorization-package.md) (writing control narratives at the boundary); [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#one-oscal-model-per-artifact) (the OSCAL SSP model) | Implementation statements as text, which is why the mark is Covered. **Generation is not covered:** no kit generates an SSP, in OSCAL or otherwise | Covered |
| S-5 Continuous Monitoring Strategy—System | System monitoring strategy | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-cadence) (the cadence and freshness limits, design guidance); [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md#the-metric-set) | The cadence table and metric set | Covered |
| S-6 Plan Review and Approval | Plans approved by the AO or designated representative | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#what-the-package-contains) | Approval record (agency) | Partial |

## Step 4 — Implement

Implementation is what most of the workbook is. The RMF question for an assessor is narrower: is there a record of what was actually built, and does it match the plan?

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| I-1 Control Implementation | Controls in place | The technical books: identity ([02](../books/b02-identity/index.md), [03](../books/b03-hr-identity/index.md), [04](../books/b04-access/index.md)), devices ([05](../books/b05-devices/index.md)), data ([06](../books/b06-data-platform/index.md)), PKI ([07](../books/b07-pki/index.md)), DDI ([08](../books/b08-ddi/index.md)), network ([09](../books/b09-network/index.md)), boundary ([10](../books/b10-cloud-boundary/index.md)), zero trust ([11](../books/b11-zero-trust/index.md)), security operations ([12](../books/b12-security-operations/index.md)), day two ([15](../books/b15-day2-operations/index.md)), AI identity ([17](../books/b17-ai-identity/index.md)), applications ([18](../books/b18-application-modernization/index.md)) | Configuration exports and kit runs, each with a manifest | Covered |
| I-2 Update Control Implementation | As-implemented state documented | [Book 13, Ch 04](../books/b13-governance/04-change-control-and-provenance.md) (provenance for every state change); [Book 04, Ch 10](../books/b04-access/10-access-as-code-and-evidence.md) (access as code); [Book 13, Ch 10](../books/b13-governance/10-ticket-to-machine.md) | The repository history; the Ticket-to-Machine kit's chained evidence record per scripted step ([`examples/servicenow-sailpoint`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint)) | Covered |

## Step 5 — Assess

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| A-1 Assessor Selection | Assessor with the needed independence | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-assessment-plan-and-the-test-plans) (CA-2(1) independence; a self-assessment isn't the independent assessment); [Book 14, Ch 10](../books/b14-compliance/10-who-owns-compliance.md) (the assessor; the CISO doesn't assess the CISO's common controls) | Assessor designation (agency) | Covered |
| A-2 Assessment Plan (SAP) | SAP developed, reviewed and approved | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-assessment-plan-and-the-test-plans) (what CA-2 requires; the test plan catalog; the OSCAL Assessment Plan model) | The test plan catalog, each plan with a pass signal (design guidance). No SAP template | Partial |
| A-3 Control Assessments | Controls assessed | [Book 11, Ch 09](../books/b11-zero-trust/09-running-the-assessment.md) and [Ch 10](../books/b11-zero-trust/10-evidence-not-verdicts.md) (configuration assessment with ScubaGear and the Zero Trust Assessment); [Book 13, Ch 07](../books/b13-governance/07-evidence-over-attestation.md) (what an assessor can verify) | [Validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) runs: each check's mode, every query, the time, the permissions, and a manifest. These are self-assessment evidence the assessor weighs, not the assessment | Partial |
| A-4 Assessment Reports (SAR) | SAR with findings and recommendations | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#assessment-results) (what the results must state, the OSCAL Assessment Results model) | No SAR template; no kit writes OSCAL Assessment Results | Partial |
| A-5 Remediation Actions | Initial remediation and reassessment | [Book 14, Ch 04](../books/b14-compliance/04-closure-with-proof.md) (a control closes only with its proof); [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md#closing-a-finding) | Re-test evidence; the [drift pipeline](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/drift-pipeline)'s comparison of a run with the last | Covered |
| A-6 Plan of Action and Milestones | POA&M | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-plan-of-action-and-milestones) (A-6's contents, the three dispositions, OSCAL risk status) and [Ch 05](../books/b14-compliance/05-program-management-controls.md) (PM-4); [Book 11, Ch 10](../books/b11-zero-trust/10-evidence-not-verdicts.md) (from findings to POA&M) | Illustrative OSCAL POA&M code in Book 14, Ch 11. The kits open findings, not POA&M entries | Covered |

## Step 6 — Authorize

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| R-1 Authorization Package | Package assembled and submitted | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#what-the-package-contains); [Book 10, Ch 11](../books/b10-cloud-boundary/11-the-authorization-package.md); [Book 17, Ch 10](../books/b17-ai-identity/10-evidence-and-authorization.md) (AI in the package) | SSP, SAP, SAR, POA&M and executive summary. The drift pipeline's package (`EVIDENCE-MANIFEST.json`, `SHA256SUMS`) is an evidence bundle for the ISSO, not an authorization package | Covered |
| R-2 Risk Analysis and Determination | Risk determination | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#what-the-authorizing-official-should-find) (the AO's checklist); [Book 13, Ch 09](../books/b13-governance/09-who-governs.md#the-authorizing-officials-role) | The determination is the AO's | Partial |
| R-3 Risk Response | Course of action for each risk | [Book 13, Ch 09](../books/b13-governance/09-who-governs.md) (who accepts exceptions); [Book 13, Ch 12](../books/b13-governance/12-governance-at-scale.md#three-ways-a-gap-closes) (configuration, compensating control or acceptance) | Governed exceptions with an acceptance reference and an expiry (design guidance) | Covered |
| R-4 Authorization Decision | Decision, with terms, a termination date or a review frequency; **risk acceptance**, which can't be delegated | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#what-the-package-contains); [Book 13, Ch 09](../books/b13-governance/09-who-governs.md#the-authorizing-officials-role) | The signed decision (agency). Everything the program automates stops short of it | Covered |
| R-5 Authorization Reporting | Decision and significant deficiencies reported | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#what-the-package-contains) and [Book 13, Ch 11](../books/b13-governance/11-reciprocity-and-one-authorization.md) (notifying FedRAMP after authorizing use of a certified service) | The notice with the authorization letter. Internal reporting of the decision to agency officials isn't described | Partial |

## Step 7 — Monitor

| Task | Output NIST names | Where the workbook treats it | Evidence | Coverage |
|---|---|---|---|---|
| M-1 System and Environment Changes | Changes monitored; **significant-change analysis** | [Book 10, Ch 11](../books/b10-cloud-boundary/11-the-authorization-package.md#keeping-the-package-current) (provider change notices under FedRAMP's Significant Change Notification rules; the AO decides whether a change is significant, using SP 800-37's definition); [Book 13, Ch 09](../books/b13-governance/09-who-governs.md) (significant change goes to the AO's designated representative); [Book 13, Ch 04](../books/b13-governance/04-change-control-and-provenance.md) (five change classes) | Drift reports from the drift pipeline (`drift-report.json`, `drift-summary.md`); provider notice review records. A CM-4 security impact analysis template isn't provided | Covered |
| M-2 Ongoing Assessments | Control effectiveness assessed on the ISCM schedule | [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md); [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-cadence) | Scheduled validation kit runs; the HR lifecycle package (`hr_evidence.py`); the non-person identity drift run (`Invoke-NpiDriftRun.ps1`); the privileged access evidence run (`Invoke-PaEvidenceRun.ps1`) | Covered |
| M-3 Ongoing Risk Response | Findings analyzed and responded to | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-plan-of-action-and-milestones) (actionable drift, governed exception, lapsed acceptance) | Dispositions on each finding (design guidance) | Covered |
| M-4 Authorization Package Updates | Plans, reports and POA&M updated | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-cadence) (monthly regeneration, design guidance); [Book 10, Ch 11](../books/b10-cloud-boundary/11-the-authorization-package.md#keeping-the-package-current) | Regenerated results and POA&M (described, not generated by a kit) | Partial |
| M-5 Security and Privacy Reporting | Posture reported to the AO and officials | [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md#the-reporting-rhythm); [Book 13, Ch 09](../books/b13-governance/09-who-governs.md) (cadence) | Monthly posture report to the AO (design guidance) | Covered |
| M-6 Ongoing Authorization | Risk reviewed at agreed frequencies; **ongoing authorization** | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#ongoing-authorization) (A-130's direction to transition; SP 800-37's conditions for removing the termination date); [Book 13, Ch 01](../books/b13-governance/01-why-governance-decays.md) (no federal three-year rule) | The review record at each frequency | Covered |
| M-7 System Disposal | Disposal strategy executed | [Book 00, Ch 10](../books/b00-orientation/10-retirement-steady-state-and-success.md) (records before hardware: the decommissioning checklist); [Book 07, Ch 08](../books/b07-pki/08-lifecycle-monitoring-and-decommissioning.md) | Decommissioning checklist with records disposition | Covered |

## What the kits produce, and what they don't

The kits are where the workbook's evidence is real output rather than description. They line up with the RMF like this:

| Kit | What it writes | RMF tasks it supports |
|---|---|---|
| [Start Kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit) | Forest, attribute and wave inventories | P-10, P-11 |
| [Evidence maps](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/evidence-maps) | A dependency map with a generated summary; outside exchanges and their agreement terms | P-8, P-12 (partly) |
| [Validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) | Check results with the evidence behind each, and `ValidationManifest.json` | A-3, M-2 |
| [Drift pipeline](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/drift-pipeline) | `drift-report.json`, `drift-summary.md`, draft findings, and an evidence package with `EVIDENCE-MANIFEST.json` and `SHA256SUMS` | A-5, M-1, M-2 |
| [Privileged access](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/privileged-access) | Privileged inventory with tiers and findings; emergency access checks | P-10, A-3, M-2 |
| [Non-person identity](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity) | The register, ownership findings, least-privilege checks, drift against an approved baseline | P-10, A-3, M-2 |
| [HR lifecycle](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hr-lifecycle) | Lifecycle runs, packaged by the drift pipeline's `hr_evidence.py` | A-3, M-2 |
| [Ticket-to-Machine](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint) | Closed findings as evidence records with a hash chain; a chained record per scripted step | I-2, A-5 |

**What none of them produces: OSCAL.** No kit writes an OSCAL system security plan, assessment plan, assessment results or POA&M. Book 14, Chapter 11 describes those models and gives illustrative POA&M code; turning kit output into them is the agency's work, or its governance tool's.

## Not covered, in one list

- **P-6, impact-level prioritization** of systems that share an impact level.
- **SP 800-60 information-type mapping** for any system (P-12, C-2). The workbook explains FIPS 199 and assumes moderate; it doesn't categorize.
- **The agency's own risk management strategy and risk tolerance** (P-2), and **system-level risk assessments** (P-14). The workbook explains both and supplies neither.
- **Templates for the SAP and the SAR** (A-2, A-4), and **generation of any OSCAL package artifact** (S-4, A-4, A-6, M-4) by the kits.
- **A CM-4 security impact analysis template** for significant-change analysis (M-1). The decision path is covered; the analysis artifact isn't.
- **Internal reporting of the authorization decision** (R-5) beyond the FedRAMP notice.
- **A CSF Organizational Profile** (P-4). The books map the CSF Functions, not a Profile.

## Status and review

**In review.** The task names and step purposes were read at csrc.nist.gov on November 2, 2026; every coverage mark comes from reading the chapter it links. On November 6, 2026 the page was rechecked against the changes merged since November 2: every link and anchor resolves (`scripts/check_rmf_map.py --check`), the 287-control figure for release 5.2.0 still matches Book 14, Chapters 01 and 03, and no coverage judgment changed (S-4's mark is now plain Covered, with the generation gap stated in its evidence cell). Book 14 Appendix A has no PM-18 or PM-19 rows and still lists PM-7 as open; neither changes a mark here. The page stays in review: to move it to **Proved**, a reviewer confirms the marks against the books. Corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

[^sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, Chapter 3 (§3.1 Prepare, §3.2 Categorize, §3.3 Select, §3.4 Implement, §3.5 Assess, §3.6 Authorize, §3.7 Monitor; Tasks P-1 to M-7), Appendix D (task summary table with short task names) and Appendix F (ongoing authorization; event-driven triggers and significant changes), <https://csrc.nist.gov/pubs/sp/800/37/r2/final>; PDF <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Nov 2, 2026). The publication page lists no newer revision.
[^rmfpage]: National Institute of Standards and Technology, Computer Security Resource Center, "About the RMF" (step names and purposes), <https://csrc.nist.gov/projects/risk-management/about-rmf> (accessed Nov 2, 2026).
[^fisma]: 44 U.S.C. §3554 (2023 edition), Federal agency responsibilities, (a)(1), (a)(3) and (b), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap35-subchapII-sec3554.htm> (accessed Nov 2, 2026).
[^fips199]: National Institute of Standards and Technology, FIPS 199, *Standards for Security Categorization of Federal Information and Information Systems*, February 2004, <https://csrc.nist.gov/pubs/fips/199/final> (accessed Nov 2, 2026).
[^fips200]: National Institute of Standards and Technology, FIPS 200, *Minimum Security Requirements for Federal Information and Information Systems*, March 2006, <https://csrc.nist.gov/pubs/fips/200/final> (accessed Nov 2, 2026).
[^sp80060]: National Institute of Standards and Technology, SP 800-60 Vol. 1 Rev. 1, *Guide for Mapping Types of Information and Information Systems to Security Categories*, August 2008, <https://csrc.nist.gov/pubs/sp/800/60/v1/r1/final> (accessed Nov 2, 2026). OMB Circular A-130, Appendix I §4.a, requires categorization "in accordance with FIPS Publication 199 and NIST SP 800-60," <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Nov 2, 2026).
