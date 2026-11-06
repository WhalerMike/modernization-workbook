---
title: "Appendix E — Security Impact Analysis Template"
description: "A fill-in template for the security and privacy impact analysis that control CM-4 requires before a change is implemented, with the significant-change decision path that connects it to Risk Management Framework Task M-1 and to event-driven authorization, a Copilot prompt that drafts the analysis from a change request, and a statement of what the workbook kits do and don't supply."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 94
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix E — Security Impact Analysis Template

*Most changes are handled by continuous monitoring. A few change the system enough that the authorizing official has to look again. The impact analysis is how the agency tells them apart before the change is made.*

::: {.callout-note}
## In this appendix
What NIST requires, in SP 800-53 control CM-4 and in the Risk Management Framework's Monitor step, when a system changes. A template for the impact analysis, the significant-change decision path that follows from it, a Copilot prompt that drafts the analysis from a change request, and what the workbook's kits supply and don't.
:::

::: {.callout-important}
## Design guidance where NIST leaves the choice to the agency
NIST defines a significant change only as "a change that is likely to substantively affect the security or privacy posture of a system," and tells each organization to set its own criteria. The criteria table and the decision path below are the Federal Modernization Program's design, marked *(design)*. They are defaults to adapt, not federal requirements. The authorizing official, not the analyst and not this book, decides whether a change triggers an authorization action.
:::

## What NIST asks

**CM-4, Impact Analyses.** The control reads: "Analyze changes to the system to determine potential security and privacy impacts prior to change implementation." Its guidance says the people who do it have "the necessary skills and technical expertise," and that the analysis includes reviewing security and privacy plans, policies and procedures to understand control requirements; reviewing design documentation and operational procedures to see how a change might affect the controls; reviewing the effect on supply chain partners; determining how a change creates new privacy risks; and risk assessments "to understand the impact of the changes and determine if additional controls are required." CM-4 is in the NIST Low, Moderate and High baselines.[^aE-sp80053]

Two enhancements extend it. CM-4(1) requires analysis "in a separate test environment before implementation in an operational environment" and is in the High baseline. CM-4(2) requires, after changes, verifying "that the impacted controls are implemented correctly, operating as intended, and producing the desired outcome," and is in the Moderate and High baselines.[^aE-sp80053][^aE-baselines] CM-3 sits beside it: configuration-controlled changes are approved or disapproved "with explicit consideration for security and privacy impact analyses."[^aE-sp80053]

**Task M-1.** NIST SP 800-37 Rev. 2 states it as "Monitor the information system and its environment of operation for changes that impact the security and privacy posture of the system." The expected outputs are updated security and privacy plans, updated plans of action and milestones, and updated assessment reports. The primary responsibility is the system owner or common control provider, the senior agency information security officer and the senior agency official for privacy. The discussion adds that changes by external providers "can be difficult to detect," and that organizations monitor for unauthorized changes, analyze their root cause, and also monitor for authorized changes that affect the privacy posture.[^aE-sp80037]

**Significant changes.** SP 800-37 Appendix F lists event-driven triggers for ongoing authorization or reauthorization, including "significant changes to the system, common controls, or the environments of operation." Its examples of significant system changes include a new or upgraded operating system, middleware or application; modified ports, protocols or services; new or upgraded hardware; modified processing of information including PII; modified cryptographic modules or services; changed information types; and modified security and privacy controls. The examples "are only significant when they represent a change that is likely to affect the security and privacy posture." NIST adds that "risk assessment results or the results from an impact analysis may be used to determine if changes … are significant," that an authorization action targets "only the specific controls affected by the changes," reusing earlier assessment results, and that "most changes … can be handled through the continuous monitoring program and ongoing authorization."[^aE-sp80037]

## The decision path *(design)*

[Chapter 11](11-the-authorization-package.md#ongoing-authorization) says an authorizing official can stop signing a dated decision only if the package stays current, and its cadence keeps the package current for ordinary change. It doesn't set out what happens when a change is not ordinary. This appendix does.

1. **Every proposed change gets a short analysis** before approval (CM-4, template sections 1 to 4). A change that touches nothing in the criteria table is recorded as routine, with the reason, and goes through configuration change control (CM-3).
2. **A change that meets any criterion** goes to section 5 for the significance decision, made by the system owner with the information system security officer and the privacy officer, and reviewed by the senior agency information security officer.
3. **If the change is not significant:** implement it, verify the impacted controls afterward (CM-4(2) where in the baseline), and fold it into the monthly cadence: updated plan, regenerated assessment results and POA&M ([Chapter 11](11-the-authorization-package.md#the-cadence)). This is Task M-1's expected output.
4. **If the change is significant, or the analysis can't tell:** notify the authorizing official before implementation. The official decides whether to start an authorization action. If so, the next plan is a targeted assessment of the affected controls ([Appendix C](appendix-c-security-assessment-plan-template.md), type "targeted assessment after a significant change"), the report is [Appendix D](appendix-d-security-assessment-report-template.md), and unaccepted deficiencies go to the POA&M.
5. **An emergency change** may be implemented first. The analysis is completed afterward, within a stated time *(design: two business days)*, and the record says it was after the fact.

## The template

### 1. The change

| Field | Entry |
|---|---|
| Change request reference | [ ] |
| System and environment affected | [ ] |
| Description of the change (what, where, when, who implements it) | [ ] |
| Made by the agency, or by an external provider? (provider changes: attach the notice) | [ ] |
| Emergency change? | [yes / no] |

### 2. What the change touches

| Question | Answer | Basis (document or evidence reviewed) |
|---|---|---|
| Controls whose implementation could be affected | [list] | [security plan section] |
| Information types or the way PII is processed | [unchanged / changed: how] | [ ] |
| Boundary, ports, protocols, services, interconnections | [ ] | [ ] |
| Cryptographic modules or services | [ ] | [ ] |
| Inherited controls and provider dependencies | [ ] | [ ] |
| Supply chain partners or components | [ ] | [ ] |

### 3. Impact on security and privacy

For each affected control: how the change could weaken it, whether the weakening is mitigated, and whether a new control or a changed implementation is needed. State new privacy risks to individuals separately.

| Control | Effect (none / weakens / strengthens / replaces) | Mitigation or new control needed | Residual impact (low / moderate / high) *(design scale)* |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

### 4. Testing and verification

| Item | Entry |
|---|---|
| Test environment used before implementation (required by CM-4(1) where it is in the baseline; otherwise record why none) | [ ] |
| Test plan or evidence source for each impacted control | [catalog entry] |
| Post-implementation verification of impacted controls (CM-4(2)) | [who, when, method] |
| Rollback plan | [ ] |

### 5. Significance decision *(design criteria)*

Answer each question. A "yes" to any makes the change significant unless the analysis records why it is not.

| Criterion | Yes / no | Note |
|---|---|---|
| Does it change the security categorization or the information types processed? | | |
| Does it change the authorization boundary, or add an interconnection? | | |
| Does it change ports, protocols or services exposed outside the boundary? | | |
| Does it replace or materially upgrade an operating system, middleware, application or hardware platform in the boundary? | | |
| Does it change how PII is collected, used or shared, or require a privacy notice change? | | |
| Does it change a cryptographic module or service? | | |
| Does it remove, replace or weaken a security or privacy control, or change who implements it? | | |
| Does it change the environment of operation: facility, mission function, a provider's service or a governing requirement? | | |
| Does the residual impact in section 3 reach "high" for any control? | | |

| Decision | Entry |
|---|---|
| Significant? | [yes / no / cannot tell (treat as yes)] |
| Reasoning in two sentences | [ ] |
| Documents to update (security plan, privacy plan, POA&M, risk register) | [ ] |
| Authorizing official notified (name, date) | [ ] |
| Authorizing official's direction (continue under monitoring / targeted assessment / reauthorization / other) | [ ] |

### 6. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Analyst | [ ] | | |
| System owner | [ ] | | |
| Information system security officer, privacy officer | [ ] | | |
| Change authority (CM-3) | [ ] | | |

## Draft it with Copilot

Use this at work, in a Copilot service the agency has approved for the system's information. Paste the change request and the relevant security plan sections. The analyst reviews and owns the result; the prompt never decides significance.

```text
You are helping a federal system owner draft a security and privacy impact analysis
under NIST SP 800-53 Rev. 5 control CM-4, for use with NIST SP 800-37 Rev. 2 Task M-1.

Inputs (attached or pasted below): the change request, and the sections of the
system security plan and privacy plan that describe the affected components.

Produce sections 1 The change, 2 What the change touches, 3 Impact on security and
privacy, 4 Testing and verification, and for section 5 a table of the criteria with
a proposed yes or no and the sentence from the inputs that supports each answer.

Rules:
- Use only the inputs. Where an input is missing, write "[NEEDED: <what>]". Do not
  invent controls, components, tests or dates.
- Name each control the change could affect by its SP 800-53 identifier, and say
  why, citing the security plan section.
- Treat privacy impact separately from security impact.
- Do not decide that the change is or is not significant. Propose answers, mark any
  answer you are less than sure of as "UNCERTAIN", and say that an uncertain answer
  is treated as yes.
- Do not recommend approving or rejecting the change.
- After the draft, list the questions a reviewer should ask the change owner.
```

## What the workbook kits supply, and what they don't

| Supplies | Doesn't supply |
|---|---|
| A template, the criteria table and the decision path above, and the draft prompt | The agency's own significance criteria. NIST tells each organization to set them; the table here is a starting point. |
| Control-to-chapter mapping to find which controls a change could touch ([Appendix A](appendix-a-control-crosswalk.md)) | The change-control process, the change authority or the test environment. Those are the agency's CM-3 and CM-4(1) implementation. |
| Validation-kit checks to run before and after a change, so the verification step in section 4 has recorded evidence | Detection of changes made by an external provider. Task M-1 notes these are hard to detect; the agency reads provider notices ([Chapter 11](11-the-authorization-package.md#what-fedramps-2026-rules-expect)). |
| Drift-pipeline findings that surface unauthorized or unrecorded change against the authoritative record, which feed M-1 | The authorizing official's decision to start an authorization action. |

The kits' outputs are illustrative and tested against fixtures, not against a live agency tenant.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix D — Security Assessment Report Template](appendix-d-security-assessment-report-template.md) · [Book index](index.md) · [Next: Appendix F — Categorization Walk-Through](appendix-f-categorization-walkthrough.md)
:::

[^aE-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CM-3, CM-4, CM-4(1) and CM-4(2); text read from the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 6, 2026).
[^aE-baselines]: National Institute of Standards and Technology, SP 800-53B control baselines, release 5.2.0 OSCAL profiles (CM-4 in Low, Moderate and High; CM-4(1) in High; CM-4(2) in Moderate and High), <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Nov 6, 2026).
[^aE-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, §3.7, Task M-1 (task statement, expected outputs, primary responsibility and discussion), and Appendix F, "Event-Driven Triggers and Significant Changes," <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Nov 6, 2026).
