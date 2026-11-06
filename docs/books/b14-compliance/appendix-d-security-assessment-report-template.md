---
title: "Appendix D — Security Assessment Report Template"
description: "A fill-in template for the security and privacy assessment report the Risk Management Framework asks for in Task A-4: the elements SP 800-53A expects, a findings table, an executive summary and the hand-off to the plan of action and milestones, with a Copilot prompt that drafts the report from the assessor's records and a statement of what the workbook kits do and don't supply."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 93
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix D — Security Assessment Report Template

*The report is the authorizing official's view of what the assessor found. It states what was measured, what was found, and what the assessor recommends, and it leaves the decision to the official.*

::: {.callout-note}
## In this appendix
A template for the assessment report (SAR) that [Chapter 11](11-the-authorization-package.md#assessment-results) describes. It states what NIST requires of the report, gives the sections to fill in, offers a Copilot prompt to draft the first version from the assessor's own records, and ends with what the workbook's kits supply toward it and what they leave to the assessor.
:::

::: {.callout-important}
## The assessor writes the findings
A draft produced by a tool is not an assessment. The control assessor determines every finding, and the report is the assessor's document. Values marked *(design)* are the Federal Modernization Program's own design choices, not federal requirements. Keep the filled copy with the agency's own program records, not in a shared or published document.
:::

## What NIST asks of the report

NIST SP 800-37 Rev. 2, Task A-4, reads: "Prepare the assessment reports documenting the findings and recommendations from the control assessments." The expected output is "Completed security and privacy assessment reports detailing the assessor findings and recommendations," and the primary responsibility is the control assessor. The discussion says the reports are "key documents in the system or common control authorization package," include information "necessary to determine the effectiveness of the controls implemented within or inherited by the information system," and may be a single integrated security and privacy report. Results obtained during the system life cycle go into interim reports that feed the final one, and an organization may add an executive summary with "a synopsis of the assessment, findings, and the recommendations for addressing deficiencies." A footnote adds that a comparable report that meets the requirements "would itself constitute the assessment report."[^aD-sp80037]

SP 800-53A Rev. 5, Appendix E, gives the key elements: system name; security categorization; sites assessed and assessment dates; the assessor's name or identification; previous assessment results, if reused; the control designator; selected assessment methods and objects; depth and coverage values; the finding summary ("satisfied" or "other than satisfied"); assessor comments on weaknesses or deficiencies; and assessor recommendations. Each determination statement results in satisfied or other than satisfied. The appendix expects a summary listing all controls assessed with the overall status of each, says organizations "are not restricted to the specific template format," and says the rationale for each determination is part of the report, while "the complete set of records" produced is retained for the audit trail but "likely not included in the report."[^aD-sp80053a]

The control behind the report is CA-2: it asks for "a control assessment report that documents the results of the assessment" and for the results to be provided to defined individuals or roles.[^aD-sp80053]

## How the report connects to the rest of Chapter 11

| Chapter 11 element | Where it lands in this template |
|---|---|
| The assessment plan the report answers to ([Appendix C](appendix-c-security-assessment-plan-template.md)) | Section 2 states every departure from the approved plan. |
| Findings carry evidence, source and freshness ([Assessment results](11-the-authorization-package.md#assessment-results)) | Section 5's table has columns for each, so a finding without an observation is visibly an assertion. |
| Stating what was measured and what wasn't | Section 3, coverage statement. A clean result against a partial yardstick says the yardstick is partial. |
| POA&M dispositions ([The plan of action and milestones](11-the-authorization-package.md#the-plan-of-action-and-milestones)) | Section 6 proposes a disposition for each "other than satisfied" finding. The system owner builds the POA&M (Task A-6), the authorizing official decides. |
| OSCAL Assessment Results model ([One OSCAL model per artifact](11-the-authorization-package.md#one-oscal-model-per-artifact)) | Each finding's state and reason map to the model's objective status. See the note under section 5. |

## The template

### 1. Identification

| Field | Entry |
|---|---|
| System name and identifier | [ ] |
| Security categorization | [ ] |
| Assessment plan (title, version, approval date) | [ ] |
| Type of assessment | [as in the plan] |
| Sites and environments assessed; assessment dates | [ ] |
| Assessor name or identification; independence statement | [ ] |
| Previous assessment results reused (which controls, from when, why still valid) | [ ] |
| Report version and date | [ ] |

### 2. Summary of the assessment

Two paragraphs: what was assessed and how, and any departure from the approved plan (a control not tested, a method changed, access denied) with the reason. A departure the assessor doesn't state is a finding about the report.

### 3. Coverage statement

| Question | Answer |
|---|---|
| Controls in the security plan | [n] |
| Controls assessed in this assessment | [n] |
| Controls not assessed, and why (reused, inherited and not yet evidenced, out of scope) | [list] |
| Evidence the assessor relied on from automated sources, and what the sources measure | [list] |
| What the automated sources do not measure | [list] |

### 4. Control summary

| Control | Determination statements | Satisfied | Other than satisfied | Overall |
|---|---|---|---|---|
| [CM-6] | [n] | [n] | [n] | [satisfied / other than satisfied] |

### 5. Findings

One row for each "other than satisfied" determination. SP 800-53A also expects the satisfied determinations to be recorded; list them in the working file, summarize them in section 4.

| ID | Control and objective | Method and objects | Finding | Evidence (observation reference, how made, when collected, asset) | Evidence source *(design)* | Fresh until *(design)* | Assessor comment | Recommendation |
|---|---|---|---|---|---|---|---|---|
| [F-001] | [CM-6a.01] | [test: tenant baseline run] | [other than satisfied] | [ ] | [configuration scanner / program-built record / manual review] | [ ] | [ ] | [ ] |

*In OSCAL's Assessment Results model a finding's objective status takes a state of satisfied or not-satisfied, with an optional reason of pass, fail or other. SP 800-53A's "other than satisfied" corresponds to the not-satisfied state.*[^aD-oscal]

### 6. Proposed dispositions

| Finding ID | Proposed disposition | Why | Owner (proposed) | Target date (proposed) |
|---|---|---|---|---|
| [F-001] | [POA&M item / request for the authorizing official's acceptance as a governed exception / remediate and reassess now] | [ ] | [ ] | [ ] |

*The assessor recommends; the system owner prepares the plan of action and milestones; only the authorizing official accepts residual risk, and that can't be delegated. Task A-6 says entries aren't necessary for deficiencies the official accepts as residual risk, but the deficiencies stay documented in this report.*[^aD-sp80037a6]

### 7. Executive summary

A page for the authorizing official: the system and the assessment type; the number of controls assessed and of findings; the three to five findings that most affect the risk decision, in plain language; what the assessor could not assess; and the recommendation. No finding appears here that isn't in section 5.

### 8. Signature

| Role | Name | Date |
|---|---|---|
| Control assessor | [ ] | |

## Draft it with Copilot

Use this at work, in a Copilot service the agency has approved for the system's information. The input is the assessor's own working records. The prompt drafts wording and checks structure; it doesn't determine findings.

```text
You are helping a federal control assessor assemble a security and privacy
assessment report under NIST SP 800-37 Rev. 2 Task A-4 and NIST SP 800-53A Rev. 5
Appendix E.

Inputs (attached or pasted below): the approved assessment plan, and the assessor's
working records: for each determination statement, the finding already decided by
the assessor (satisfied or other than satisfied), the evidence references, and the
assessor's notes.

Produce sections 1 Identification, 2 Summary, 3 Coverage statement, 4 Control
summary, 5 Findings table, 6 Proposed dispositions, 7 Executive summary.

Rules:
- Do not decide, change or soften any finding. Copy each finding exactly as given.
- Use only the inputs. Where an input is missing, write "[NEEDED: <what>]". Do not
  invent evidence, dates, asset names or control implementations.
- In section 5, mark any finding that has no evidence reference as
  "ASSERTION - no observation".
- In section 3, list every control in the plan that has no recorded finding.
- Write the executive summary in plain language for an authorizing official. It may
  repeat only findings that appear in section 5.
- Do not state that the system is or is not ready to be authorized.
- After the draft, list every place where the inputs disagree with the approved plan.
```

## What the workbook kits supply, and what they don't

| Supplies | Doesn't supply |
|---|---|
| A report template and the assembly prompt above | The findings. The control assessor determines them. |
| Validation-kit results whose evidence block records each query, its time and the permissions used, which fill the evidence columns of section 5 | Independent assessment. A kit result is evidence the assessor weighs, not an assessor's finding ([Chapter 11](11-the-authorization-package.md#the-assessment-plan-and-the-test-plans)). |
| Drift-pipeline findings with dispositions (actionable drift, governed exception, lapsed acceptance) that feed section 6 | The authorizing official's acceptance of any exception. |
| The POA&M lifecycle and an illustrative OSCAL POA&M builder in [Chapter 11](11-the-authorization-package.md#illustrative-code) for the step after this report | An OSCAL Assessment Results file. No kit generates one from a kit run; the report stays a document until the agency builds that step. |

The kits' outputs are illustrative and tested against fixtures, not against a live agency tenant.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix C — Security Assessment Plan Template](appendix-c-security-assessment-plan-template.md) · [Next: Appendix E — Security Impact Analysis Template →](appendix-e-security-impact-analysis-template.md) · [Book index](index.md)
:::

[^aD-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, §3.5, Task A-4 (task statement, expected outputs, primary responsibility, discussion and footnote 92), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Nov 6, 2026).
[^aD-sp80037a6]: National Institute of Standards and Technology, SP 800-37 Rev. 2, §3.5, Task A-6 (discussion of plan of action and milestones entries and accepted deficiencies), same document as above (accessed Nov 6, 2026).
[^aD-sp80053a]: National Institute of Standards and Technology, SP 800-53A Rev. 5, *Assessing Security and Privacy Controls in Information Systems and Organizations*, January 2022, Appendix E, Assessment Reports ("Key Elements for Assessment Reporting," "The Assessment Findings" and footnotes 60 and 61), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53Ar5.pdf> (accessed Nov 6, 2026).
[^aD-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, control CA-2, text read from the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 6, 2026).
[^aD-oscal]: National Institute of Standards and Technology, OSCAL release v1.2.3, `oscal_assessment-results_schema.json` (objective status state and reason), <https://github.com/usnistgov/OSCAL/releases/tag/v1.2.3>; as read in [Chapter 11](11-the-authorization-package.md#assessment-results) (accessed Oct 21, 2026).
