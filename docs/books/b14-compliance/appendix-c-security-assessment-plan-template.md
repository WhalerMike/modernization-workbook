---
title: "Appendix C — Security Assessment Plan Template"
description: "A fill-in template for the security and privacy assessment plan the Risk Management Framework asks for in Task A-2: scope, methods, depth and coverage, independence, schedule, rules of engagement and approval, with a Copilot prompt that drafts it from the security plan and a statement of what the workbook kits do and don't supply."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Security Assessment Plan Template

*An assessment plan is the agreement, made before anyone tests anything, about what will be examined, how deeply, by whom, and what counts as a result.*

::: {.callout-note}
## In this appendix
A template for the assessment plan (SAP) that [Chapter 11](11-the-authorization-package.md#the-assessment-plan-and-the-test-plans) describes. It states what NIST requires of the plan, gives the sections to fill in with a worked pattern for each, offers a Copilot prompt to draft the first version from the system's security plan, and ends with what the workbook's kits supply toward it and what they leave to the assessor and the agency.
:::

::: {.callout-important}
## A template, not an approved plan
The plan becomes real only when the control assessor has written it for the system and the authorizing official, or the official's designated representative, has approved it. Values marked *(design)* are the Federal Modernization Program's own design choices, offered as defaults; they are not federal requirements and the agency may set them differently. Keep the filled copy with the agency's own program records, not in a shared or published document.
:::

## What NIST asks of the plan

The Risk Management Framework's Assess step has one task for the plan. NIST SP 800-37 Rev. 2, Task A-2, reads: "Develop, review, and approve plans to assess implemented controls." Its expected output is "Security and privacy assessment plans approved by the authorizing official." The primary responsibility is shared by the authorizing official or the official's designated representative and the control assessor.[^aC-sp80037]

The task's discussion says what the plan holds. Control assessors develop it from the implementation information in the security and privacy plans, the program management control documentation and the common control documentation. It may be one integrated security and privacy plan. It "delineates roles and responsibilities for control assessment," and it provides "the objectives for control assessments and specific assessment procedures for each control." The plan reflects the type of assessment being conducted, and the authorizing official reviews it so that it is consistent with the organization's objectives, employs "procedures, methods, techniques, tools, and automation" for continuous monitoring, and is cost-effective. Where an external provider supplies controls, the organization "can request security and privacy assessment plans and assessments results or evidence from the provider."[^aC-sp80037]

SP 800-53 Rev. 5 control CA-2 adds the content list: the controls and control enhancements under assessment, the assessment procedures used to determine effectiveness, and the assessment environment, assessment team, and assessment roles and responsibilities, with the plan reviewed and approved by the authorizing official or designated representative before the assessment is conducted.[^aC-sp80053] CA-2(1) asks for independent assessors or assessment teams; it is in the NIST Moderate and High baselines, not Low.[^aC-baselines]

SP 800-53A Rev. 5 supplies the method. Section 3.2 says the assessor determines which controls are assessed, selects the procedures, tailors them ("select appropriate assessment methods and objects, and assign depth and coverage attribute values"), develops procedures for requirements the catalog doesn't cover, optimizes to reduce duplicated effort, and finalizes the plan and obtains approval. The methods are examine, interview and test. Depth and coverage each take the values basic, focused or comprehensive.[^aC-sp80053a]

## How the plan connects to the rest of Chapter 11

| Chapter 11 element | Where it lands in this template |
|---|---|
| The package's four linked records ([What the package contains](11-the-authorization-package.md#what-the-package-contains)) | Section 1 names the security plan the assessment plan imports. In OSCAL the Assessment Plan model's link to the system security plan is required. |
| The catalog of test plans, with a pass signal for every plan ([The assessment plan and the test plans](11-the-authorization-package.md#the-assessment-plan-and-the-test-plans)) | Section 5 cites test plans by their catalog entry. A plan that has no catalog entry can't be cited. |
| Independence ([same section](11-the-authorization-package.md#the-assessment-plan-and-the-test-plans)) | Section 4 records who assesses and whether they are independent of the system's team. |
| Assessment results and the report ([Assessment results](11-the-authorization-package.md#assessment-results)) | Section 7 fixes the report's format before testing starts. [Appendix D](appendix-d-security-assessment-report-template.md) is the matching report. |
| POA&M dispositions ([The plan of action and milestones](11-the-authorization-package.md#the-plan-of-action-and-milestones)) | Section 8 says how a finding becomes a POA&M item or a governed exception. |

## The template

Copy the headings below into the agency's document. Replace every bracketed prompt. Delete the italic guidance when the section is complete.

### 1. Identification

| Field | Entry |
|---|---|
| System name and identifier | [ ] |
| Security categorization (confidentiality, integrity, availability) | [ ] |
| Security plan and privacy plan assessed (title, version, date) | [ ] |
| Type of assessment | [initial authorization / reauthorization / targeted assessment after a significant change / annual assessment under continuous monitoring / post-remediation / common control] |
| Plan version, author, date | [ ] |

*The type matters: SP 800-37 says the plan "reflect[s] the type of assessment the organization is conducting," and lists, among others, assessments supporting authorization or reauthorization, program management control assessments, continuous monitoring and assessments after remediation.*[^aC-sp80037]

### 2. Purpose and scope

State why the assessment is happening and what it covers. List the system boundary, the environments in scope (production, and any test environment the controls are evidenced from), the sites, and what is out of scope with the reason. For a partial assessment, name the controls chosen and why. SP 800-53A notes that after an authorization, "targeted assessments may be necessary when changes are made," with the focus "on the controls that may have been affected by the change."[^aC-sp80053a]

### 3. Controls and objectives under assessment

One row per control or enhancement. The baseline column records the NIST baseline membership and, separately, any additional requirement (for example from a FedRAMP class) so the two aren't conflated ([Appendix A](appendix-a-control-crosswalk.md)).

| Control | Source of the requirement | Implemented by (system, inherited, hybrid) | Provider assessment relied on? | Included? Reason |
|---|---|---|---|---|
| [AC-2] | [NIST Moderate baseline] | [ ] | [ ] | [ ] |

*Controls inherited from a provider are assessed for the agency's own part and for how the agency uses the provider's service. The provider's certification is evidence the assessor reads, not a substitute for the agency's assessment ([Chapter 11](11-the-authorization-package.md)).*

### 4. Assessment team, roles and independence

| Role | Name or organization | Independent of the system's team? | Responsibility |
|---|---|---|---|
| Authorizing official or designated representative | [ ] | n/a | Approves this plan |
| Control assessor (lead) | [ ] | [yes / no, and why that is acceptable] | Writes and executes the plan |
| System owner | [ ] | no | Provides access and documentation |
| System security officer, system privacy officer | [ ] | no | Supports the assessment |
| Common control provider | [ ] | n/a | Supplies inherited-control evidence |

*Where CA-2(1) is in the baseline, the plan states how independence is achieved. A self-assessment run by the system's own team, however automated, is a different kind of assessment from an independent one; label it as such ([Chapter 11](11-the-authorization-package.md#the-assessment-plan-and-the-test-plans)). Nothing requires an agency to engage a FedRAMP-recognized assessment organization for its own system.*

### 5. Methods, objects, depth and coverage

Select assessment procedures from SP 800-53A for each control in section 3, then tailor.

| Control | Objective (SP 800-53A) | Method (examine, interview, test) | Objects | Depth | Coverage | Test plan or evidence source |
|---|---|---|---|---|---|---|
| [CM-6] | [ ] | [test] | [configuration baselines; the tenant] | [focused] | [focused] | [catalog entry; scheduled baseline run] |

Default depth and coverage *(design)*: basic for Low-impact inherited controls, focused for Moderate, comprehensive for the controls the authorizing official names as high risk. SP 800-53A ties these values to "the assurance requirements specified by the organization"; the defaults above are the program's, not NIST's.[^aC-sp80053a]

*Cite each test plan by its name in the program's catalog, with its pass signal. A test with no pass signal can't be scored. Automated results are evidence the assessor uses; the assessor decides what they show.*

### 6. Assessment environment, schedule and rules of engagement

| Item | Entry |
|---|---|
| Environment tested (production or a copy) | [ ] |
| Access the assessor needs, by account, role and time window | [ ] |
| Testing that could disrupt service, and the approval needed first | [ ] |
| Data handling: where evidence is stored, who can read it, retention | [ ] |
| Schedule (kickoff, evidence request, testing, draft report, final report) | [ ] |
| Escalation if the assessor finds an active compromise | [Hand to incident response at once; do not wait for the report] |

### 7. Reporting

State the report format and the finding scale before testing. SP 800-53A Appendix E expects each determination statement to result in "satisfied" or "other than satisfied," and a report that lists the controls assessed with their overall status. Name the interim reports expected and who receives the executive summary. See [Appendix D](appendix-d-security-assessment-report-template.md).

### 8. After the assessment

Say how each "other than satisfied" finding is handled: a POA&M item with owner and dates, a governed exception that rests on an in-date acceptance by the authorizing official, or immediate remediation and reassessment (Task A-5). The disposition vocabulary is in [Chapter 11](11-the-authorization-package.md#the-plan-of-action-and-milestones).

### 9. Approval

| Role | Name | Decision (approved / approved with changes / returned) | Date |
|---|---|---|---|
| Control assessor | [ ] | | |
| Authorizing official or designated representative | [ ] | | |

## Draft it with Copilot

Use this at work, in a Copilot service the agency has approved for the system's information. The prompt needs the security plan and the control list as input; paste only what the approved service is cleared to see. Review every line of what it returns: Copilot drafts, the assessor decides.

```text
You are helping a federal control assessor draft a security and privacy assessment
plan under NIST SP 800-37 Rev. 2 Task A-2, CA-2 in NIST SP 800-53 Rev. 5, and
NIST SP 800-53A Rev. 5.

Inputs (attached or pasted below): the system security plan, the list of controls
to assess, the type of assessment, the schedule, and the roles.

Produce the plan in these sections: 1 Identification, 2 Purpose and scope,
3 Controls and objectives, 4 Team, roles and independence, 5 Methods, objects,
depth and coverage, 6 Environment, schedule and rules of engagement, 7 Reporting,
8 After the assessment, 9 Approval.

Rules:
- Use only the inputs. Where an input is missing, write "[NEEDED: <what>]". Do not invent
  names, dates, tool names, test results or control implementations.
- For section 5, use the SP 800-53A assessment methods examine, interview and test,
  and depth and coverage values basic, focused or comprehensive. Give one row per
  control. Flag any control for which the inputs don't say how it is implemented.
- Separate NIST baseline membership from any other source of a requirement.
- State in section 4 whether the assessor is independent of the system team, using
  only what the inputs say.
- After the draft, list the five weakest or least supported statements so a human
  can check them first.
```

## What the workbook kits supply, and what they don't

| Supplies | Doesn't supply |
|---|---|
| A plan template and the draft prompt above | An assessor. Independence is a staffing and contract decision the agency makes. |
| The control-to-chapter map for choosing controls ([Appendix A](appendix-a-control-crosswalk.md)) | Control selection for the agency's system. The security plan is the agency's. |
| Read-only checks in the validation kit whose results carry the queries made, the time of each and the permissions used, so a result can be cited as an object of examination in section 5 | A catalog of the agency's test plans. The catalog is a program-design practice ([Chapter 11](11-the-authorization-package.md#the-assessment-plan-and-the-test-plans)); the agency writes its own entries. |
| Drift findings with dispositions, from the drift pipeline, as ongoing-assessment evidence | An OSCAL Assessment Plan file. No kit generates one; the model and its links are described in [Chapter 11](11-the-authorization-package.md#one-oscal-model-per-artifact). |
| | Approval. Only the authorizing official or designated representative approves the plan. |

The kits' outputs are illustrative and tested against fixtures, not against a live agency tenant; each kit's own page says so.

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Product Inventory Questionnaire](appendix-b-product-inventory-questionnaire.md) · [Next: Appendix D — Security Assessment Report Template →](appendix-d-security-assessment-report-template.md) · [Book index](index.md)
:::

[^aC-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, §3.5, Task A-2 (task statement, expected outputs, primary responsibility and discussion), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Nov 6, 2026).
[^aC-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CA-2 and CA-2(1); text read from the release 5.2.0 OSCAL catalog, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 6, 2026).
[^aC-sp80053a]: National Institute of Standards and Technology, SP 800-53A Rev. 5, *Assessing Security and Privacy Controls in Information Systems and Organizations*, January 2022, §2.4 (assessment methods; depth and coverage attributes) and §3.2, Develop Security and Privacy Assessment Plans (§3.2.1 and §3.2.2), <https://csrc.nist.gov/pubs/sp/800/53/a/r5/final>; PDF at <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53Ar5.pdf> (accessed Nov 6, 2026).
[^aC-baselines]: National Institute of Standards and Technology, SP 800-53B control baselines, release 5.2.0 OSCAL profiles (CA-2 in Low, Moderate and High; CA-2(1) in Moderate and High), <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Nov 6, 2026).
