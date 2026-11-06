---
title: "Appendix F — Prepare-Step Templates"
description: "Fill-in templates, each with a Copilot prompt, for three Prepare tasks in NIST SP 800-37 Rev. 2: the risk management strategy and risk tolerance statement (Task P-2), the system-level risk assessment (Task P-14), and impact-level prioritization of systems that share an impact level (Task P-6), with a scoring worksheet whose factors are labeled design guidance and a list of what stays the agency's decision."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b14-compliance
book: B14
part: Appendix
series-order: 95
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix F — Prepare-Step Templates

*The workbook can supply the shape of these documents. It cannot supply the numbers, the tolerance or the signature, because those are the agency's.*

::: {.callout-note}
## In this appendix
Three neutral templates for the Prepare step of the Risk Management Framework: the risk management strategy with its risk tolerance statement (P-2), the system-level risk assessment (P-14) and a way to prioritize systems that share an impact level (P-6). Each has a structure to fill in, the NIST text it rests on, who decides, and a prompt the reader can paste into the agency's own Copilot at work. A table at the end lists what stays the agency's decision.
:::

::: {.callout-important}
## Templates, not decisions
Nothing here is a risk tolerance, a score weight or an approval. A completed template is a draft until the official named for the task signs it. The values in the examples are placeholders. The workbook is guidance, not policy, and says "requires" only where a source it cites does.
:::

::: {.callout-warning}
## Work stays at work
The prompts are written so that the reader pastes them into the agency's approved Copilot together with the agency's own documents, at work. Don't put agency system names, findings, risk ratings or architecture details into any public tool or into this workbook. Treat every output as a draft for a person to check against the source documents.
:::

## Where the three tasks sit

SP 800-37 Rev. 2 groups the Prepare tasks into an organization level and a system level.[^aC-37] These three are the ones where the organization or the system owner has to write something no product can write.

| Task | NIST's expected output | Primary responsibility (NIST) | Related controls | Template |
|---|---|---|---|---|
| P-2, Risk Management Strategy | Risk management strategy and statement of risk tolerance, inclusive of security and privacy risk | Head of Agency | PM-9 | [1](#template-1-risk-management-strategy-and-risk-tolerance-p-2) |
| P-6, Impact-Level Prioritization (optional) | Organizational systems prioritized into low-, moderate- and high-impact sub-categories | Senior Accountable Official for Risk Management or Risk Executive (Function) | — (SP 800-37 Rev. 2 names none; checked only the task text) | [3](#template-3-impact-level-prioritization-p-6) |
| P-14, Risk Assessment, System | Security and privacy risk assessment reports | System Owner; System Security Officer; System Privacy Officer | RA-3 | [2](#template-2-system-level-risk-assessment-p-14) |

The roles are those in SP 800-37 Rev. 2's task descriptions, and [Chapter 10](10-who-owns-compliance.md) explains each one and who must be a government official. The control statements are in [Chapter 05](05-program-management-controls.md) (PM-9) and [Book 00, Appendix A](../b00-orientation/appendix-a-risk-register-and-traceability.md) (RA-3).

## Template 1: Risk management strategy and risk tolerance (P-2)

### What the sources say

SP 800-37 Rev. 2 says the strategy "may be composed of a single document, or separate security and privacy risk management documents," and that it "includes an expression of organizational risk tolerance; acceptable risk assessment methodologies and risk response strategies; a process for consistently evaluating security and privacy risks organization-wide; and approaches for monitoring risk over time." It also says the strategy connects the security and privacy programs with the organization's enterprise risk management strategy, and that supply chain considerations belong in it; a separate supply chain strategy document is called a supply chain risk management plan.[^aC-37] Its listed inputs are the mission statement, organizational policies, and the organization's risk assumptions, constraints, priorities and trade-offs.[^aC-37]

SP 800-39 supplies the structure behind those words: risk management has four components (frame, assess, respond, monitor) applied at three tiers (organization, mission and business process, information system), and there are five kinds of risk response (accept, avoid, mitigate, share, transfer).[^aC-39] PM-9 is the control that asks for the strategy and for it to be implemented consistently and reviewed ([Chapter 05](05-program-management-controls.md#the-risk-management-strategy-pm-9)).

### Outline to fill in

| Section | What goes in it | Who decides |
|---|---|---|
| 1. Purpose, scope and form | Which organization the strategy covers; whether security and privacy are one document or two; where the supply chain strategy lives | Head of agency |
| 2. Roles | The named officials: head of agency, risk executive (function) or senior accountable official for risk management, CIO, senior agency information security officer, senior agency official for privacy, with the appointment record for each | Head of agency |
| 3. Risk assumptions, constraints, priorities, trade-offs | The statements the later decisions rest on, each with its basis (mission statement, law, policy, budget) | Head of agency, with the supporting officials |
| 4. Risk tolerance statement | Table below | Head of agency; signed as the agency decides |
| 5. Acceptable risk assessment methodologies | The scales, risk model and approach assessments must use, or the range they may choose from (see Template 2, section 5) | Risk executive (function) |
| 6. Risk response strategies | When each of the five responses is allowed, who may choose it, and what it must record. Risk acceptance for a system stays with its authorizing official | Head of agency |
| 7. Consistent evaluation | How risks from different systems are compared: one scale, one register, one escalation path | Risk executive (function) |
| 8. Monitoring risk over time | What is watched, how often, and what triggers a re-assessment; link to the continuous monitoring strategy (PM-31) | CISO and risk executive (function) |
| 9. Supply chain and privacy | The supply chain risk management strategy or plan (PM-30) and the privacy risk handling; reference, don't restate | Senior agency official for privacy; supply chain risk lead |
| 10. Approval and review | Approver, date, review frequency and the events that force a review (PM-9 asks for a review frequency the organization sets) | Head of agency |

The tolerance table for section 4. The categories are examples of the form that [Chapter 05](05-program-management-controls.md#the-risk-management-strategy-pm-9) shows; replace them with the agency's own.

| Risk category | Tolerance (agency sets) | Basis to record | Response allowed without escalation | Escalates to |
|---|---|---|---|---|
| *(example)* Availability of mission-essential functions | | Business impact analysis | | |
| *(example)* Confidentiality of personally identifiable information | | Statute, policy, public trust | | |
| *(example)* Integrity of payment or case records | | Accuracy, audit trail | | |
| *(example)* Supply chain | | Supply chain strategy | | |
| *(add rows)* | | | | |

### Copilot prompt

```text
You are helping draft a risk management strategy outline for our agency under NIST SP 800-37 Rev. 2 Task P-2 and SP 800-53 control PM-9. Use only the documents I have attached or pasted: our mission statement, enterprise risk management policy, security and privacy policies, and the current security program plan.

Produce a draft outline with these sections: purpose and scope; roles; risk assumptions, constraints, priorities and trade-offs; risk tolerance statement; acceptable risk assessment methodologies; risk response strategies (accept, avoid, mitigate, share, transfer); consistent evaluation across systems; monitoring over time; supply chain and privacy; approval and review.

Rules:
1. For each section, quote or cite the attached document that supports each statement. If no attached document supports it, write "NEEDS AGENCY DECISION" and list the question the head of agency must answer.
2. Do not invent tolerance values, thresholds, review frequencies or names. Leave them blank.
3. List every place our existing documents disagree with each other about risk, with both citations.
4. End with a table of open decisions: decision, who decides, which section it blocks.
```

## Template 2: System-level risk assessment (P-14)

### What the sources say

SP 800-37 Rev. 2 lists the inputs for P-14: assets to be protected; the missions, business functions and processes the system supports; business impact or criticality analyses; stakeholder information; information about interacting systems; provider information; threat information; the data map; system design documentation; Cybersecurity Framework profiles; the risk management strategy; and the organization-level risk assessment results. The expected output is "security and privacy risk assessment reports," and the task is carried out for new systems at initiation and for existing systems during operations, then updated "on an ongoing basis."[^aC-37] NIST says security risk assessment covers threat sources and events, whether and how assets are vulnerable, the likelihood of exploitation and the impact of loss, and that privacy risk assessment is a separate question: the likelihood that processing of personally identifiable information creates an adverse effect on individuals, and the impact on them. NIST also says impacts to the organization are not privacy risks, though they can inform prioritization.[^aC-37]

SP 800-30 Rev. 1 is the guide the task refers to. It divides the work into four steps: prepare for the assessment (Tasks 1-1 to 1-5: purpose, scope, assumptions and constraints, information sources, risk model and analytic approach), conduct it (Tasks 2-1 to 2-6: threat sources, threat events, vulnerabilities and predisposing conditions, likelihood, impact, risk), communicate and share the results (Tasks 3-1 and 3-2), and maintain the assessment (Tasks 4-1 and 4-2).[^aC-30] It says organizations define or tailor their own assessment scales and combining rules, and that those rules should reflect the organization's risk tolerance, so the strategy in Template 1 comes first.[^aC-30] RA-3 is the control that asks for the assessment and for its update ([Book 00, Appendix A](../b00-orientation/appendix-a-risk-register-and-traceability.md#what-pl-2-and-ra-3-ask-for)).

### Using the program risk register as an input

The program register in [Book 00, Appendix A](../b00-orientation/appendix-a-risk-register-and-traceability.md#the-risk-register-ra-3-input) records risks to the modernization. It is an input to the system's assessment, not the assessment: Appendix A says so, and says the live status, review date and residual rating belong in the agency's own register. Carry rows across like this:

| Register column | Goes to | Note |
|---|---|---|
| ID, Risk | Risk row, "register reference" | Keep the program's ID so the two stay traceable |
| Phase | Scope and time frame (section 2 below) | Marks when the risk bites, so the assessment can be re-run at the gate |
| L (likelihood), I (impact) | A starting point for likelihood and impact, re-rated on the agency's scale | The register's scale (likelihood Low to High, impact Low to Critical) is the master plan's, and Appendix A says an agency can re-rate it. SP 800-30 uses five levels, very low to very high, in its qualitative scale; the agency picks its own |
| Mitigation, Owner | Risk response and owner | The response must be one the strategy allows |
| Controls | Controls affected | Cross-check against the system security plan |
| Anything left open past a gate | Plan of action and milestones (CA-5) | Per Appendix A |

### Outline to fill in

| Section | Contents (SP 800-30 task) |
|---|---|
| 1. Purpose | Why the assessment is being done, and what decisions it informs (1-1) |
| 2. Scope | System and boundary, time frame, which parts of the organization are in scope, the phase of the system life cycle (1-2) |
| 3. Assumptions and constraints | Including those inherited from the risk management strategy and from common control providers (1-3) |
| 4. Information sources | System description, data map, business impact analysis, threat information, vulnerability scans, prior assessments, the organization-level assessment, the program register (1-4) |
| 5. Risk model and approach | The scales and combining rules from the strategy, or the ones chosen here with the reason; qualitative, semi-quantitative or quantitative; threat-, asset- or vulnerability-oriented (1-5) |
| 6. Risk rows | Table below (2-1 to 2-6) |
| 7. Privacy risk | A separate section for risk to individuals from the processing of personally identifiable information, prepared with the system privacy officer. NIST points to NIST IR 8062 for a privacy risk model[^aC-37] |
| 8. Communication | Who receives the results, in what form, and which decisions they support, including the authorizing official and the risk executive (function) (3-1, 3-2) |
| 9. Maintenance | Review frequency, the events that trigger an update, what is monitored (4-1, 4-2) |
| 10. Approvals | System owner, system security officer, system privacy officer; review by the authorizing official's designated representative if the agency requires it |

SP 800-30 says its Appendix K gives an exemplary template for a risk assessment report.[^aC-30] **Assumption to confirm:** the layout above follows the structure of SP 800-30's tasks, not Appendix K, which this workbook did not reproduce. Compare the two before the agency adopts either.

Risk rows for section 6. The columns follow the risk factors SP 800-30 names (threat source, threat event, vulnerability and predisposing condition, likelihood, impact, risk); the extra columns are the workbook's design.

| Ref | Threat source | Threat event | Vulnerability or predisposing condition | Likelihood | Impact | Risk level | Response (per strategy) | Owner | Register ref | POA&M ref |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | |

### Copilot prompt

```text
You are helping prepare a system-level risk assessment under NIST SP 800-37 Rev. 2 Task P-14, using NIST SP 800-30 Rev. 1 and SP 800-53 control RA-3. Use only the documents I have attached: the system description and boundary, the data map, the business impact analysis, recent vulnerability scan summaries, the organization's risk management strategy and its risk scales, and the program risk register.

Step 1. Fill in sections 1 to 5 of the outline I will paste next (purpose, scope, assumptions and constraints, information sources, risk model and approach). Use the scales and combining rules in our risk management strategy. If the strategy gives none, say so and propose two options for the system owner to choose from; do not choose.

Step 2. For each risk in the program risk register, create one risk row with these columns: threat source, threat event, vulnerability or predisposing condition, likelihood, impact, risk level, response, owner, register ID, POA&M reference. Re-express the register's likelihood and impact on our scale and show both values. Do not create risks that are not supported by an attached document; mark gaps "NEEDS EVIDENCE".

Step 3. List separately any processing of personally identifiable information, and leave the privacy risk section for the system privacy officer with a list of the facts they need.

Rules: cite the document and section for every statement. Do not state risk acceptance; that belongs to the authorizing official. Output a draft marked "DRAFT, not reviewed".
```

## Template 3: Impact-level prioritization (P-6)

### What the sources say

P-6 is marked optional in SP 800-37 Rev. 2. It is carried out only after systems have been categorized (Task C-1) and the high-water mark applied, so each system is already low, moderate or high impact. An organization that wants more granularity can then prioritize systems within each level. NIST's example splits moderate systems into low-moderate, moderate-moderate and high-moderate, and high-impact systems into low-high, moderate-high and high-high, and says the result helps with control selection and tailoring and with identifying systems that are critical or essential to missions. For the high-impact case it names the factors of complexity, aggregation and system interconnections. It adds that Cybersecurity Framework profiles can help, because their prioritized mission objectives can show that one system matters more than another of the same impact level. Prioritization may call for organizationally tailored baselines for the finer levels, and it can be done at any level of the organization from the categorization data the system owners report.[^aC-37]

**What it is not.** The sub-categories are the agency's internal ordering. They don't change a system's FIPS 199 categorization or its impact level, and they aren't a FedRAMP class. Whether to run the task at all is the agency's choice, since NIST marks it optional.

### Outline to fill in

| Section | Contents | Who decides |
|---|---|---|
| 1. Decision to run P-6 | Why the agency wants finer levels, which impact levels are split, and into how many sub-categories | Risk executive (function) or senior accountable official for risk management |
| 2. Scope | Which systems, taken from the categorization records and the system inventory (PM-5) | Same |
| 3. Factors and scale | The factors used, each with a definition and a scoring rubric (worksheet below) | Same, consulting the supporting roles NIST lists |
| 4. Weights and cut-offs | Weights per factor and the score ranges that map to each sub-category | Agency only |
| 5. Results | The ranked list, with each score and the evidence behind it | System owners supply; the risk executive (function) approves |
| 6. Use | What the ordering changes: sequence of assessments, depth of monitoring, tailored baselines, funding priority | Authorizing officials and CISO, as the agency decides |
| 7. Review | Frequency and events that force a re-score | Agency |

### Scoring worksheet

Score each factor 0 to 3 using a rubric the agency writes for it (0 is the least significant). **The factors are design guidance**, except where the Source column says NIST names it. The worksheet is a way to make the judgment repeatable and show its reasoning. A score is not a risk rating and has no meaning outside the agency's own ranking.

| # | Factor | Source | What to score | Score (0 to 3) | Weight (agency sets) | Evidence |
|---|---|---|---|---|---|---|
| 1 | Mission or business objective supported | NIST: a system tied to a higher-priority objective in a Cybersecurity Framework profile can rank above one at the same impact level | Rank of the objective the system supports, from the agency's profile or mission priorities | | | |
| 2 | Criticality to mission essential functions | NIST: identifying systems critical or essential to missions is a purpose of the task | Position in the business impact analysis | | | |
| 3 | Complexity | NIST names it for high-impact systems | Components, technologies, providers | | | |
| 4 | Aggregation | NIST names it for high-impact systems | Concentration of data or functions that raises the loss from one compromise | | | |
| 5 | Interconnections | NIST names it for high-impact systems | Systems that depend on this one or connect to it | | | |
| 6 | Number of people or other systems affected | Design guidance | Users, public-facing reach, downstream consumers | | | |
| 7 | Volume or sensitivity of personally identifiable information | Design guidance | From the PII inventory (PM-5(1)) | | | |
| 8 | Recovery difficulty | Design guidance | Recovery time objective against what is achievable | | | |
| 9 | Known open risk | Design guidance | Open plan of action and milestones items and assessed risk (Template 2) | | | |
| *(add)* | | | | | | |

Total for a system = sum of (weight × score) for all factors. Divide by the maximum possible (sum of weights × 3) to give a percentage, then apply the agency's cut-offs.

| Sub-category | Score range (agency sets) |
|---|---|
| Lower in the level | |
| Middle of the level | |
| Higher in the level | |

Run the worksheet only within an impact level. A high-scoring moderate system does not become a high-impact system by this method.

### Copilot prompt

```text
You are helping our risk executive prepare an optional impact-level prioritization under NIST SP 800-37 Rev. 2 Task P-6. Use only the attached documents: the system inventory with each system's FIPS 199 impact level, the business impact analysis, the mission priorities or Cybersecurity Framework profile, the PII inventory, and the open plan of action and milestones summary.

1. List the systems for the impact level I name, with the evidence for each of the worksheet factors I paste next. For each factor and system, give a proposed 0 to 3 score using the rubric I provide, and the document and section that supports it. If a rubric or evidence is missing, write "NEEDS INPUT" and stop; do not guess.
2. Do not propose weights or cut-off scores. Compute totals only if I supply weights.
3. Flag any system whose evidence conflicts across documents.
4. State clearly in the output that scores are a draft ordering for the risk executive and do not change any system's categorization.
```

## What stays the agency's decision

| Decision | Template | Decided by (SP 800-37 Rev. 2 unless noted) |
|---|---|---|
| The risk tolerance values, and the statement that contains them | 1 | Head of Agency |
| Whether security and privacy risk are one document or two | 1 | Head of Agency |
| Which risk responses are allowed, and who may choose them | 1 | Head of Agency; risk acceptance for a system stays with its authorizing official |
| The assessment scales, risk model and combining rules | 1, 2 | Risk executive (function), as the strategy sets them |
| Review frequencies and triggers | 1, 2, 3 | Agency |
| Whether to run P-6 at all, the factors, weights and cut-offs | 3 | Senior Accountable Official for Risk Management or Risk Executive (Function) |
| Any approval, signature or acceptance of risk | all | The official named in the task; the authorizing official alone accepts residual risk ([Chapter 10](10-who-owns-compliance.md#the-authorizing-official-and-the-designated-representative)) |

## What is requirement and what is design

| Statement | Status | Basis |
|---|---|---|
| The organization establishes a risk management strategy that includes a risk tolerance determination (P-2); a system-level assessment is conducted and updated (P-14) | NIST guidance | SP 800-37 Rev. 2[^aC-37] |
| The agency has a risk management strategy and does risk assessments | Requirement of the control, where the agency applies SP 800-53 | PM-9 and RA-3, SP 800-53 Rev. 5[^aC-53] |
| P-6 is optional | NIST guidance | SP 800-37 Rev. 2[^aC-37] |
| The section lists of the three outlines | Program design, built from the elements NIST lists | — |
| The mapping from register columns to risk rows | Program design | — |
| The scoring worksheet's scale, formula, and factors 6 to 9 | Program design | — |
| The Copilot prompts | Program design | — |

::: {.callout-tip}
## Continue the book
[← Previous: Appendix E — Security Impact Analysis Template](appendix-e-security-impact-analysis-template.md) · [Book index](index.md)
:::

[^aC-37]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, Chapter 3, Tasks P-2 (including footnote 54), P-6 (including footnotes 61 to 63) and P-14 (including footnotes 67 and 68), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Nov 6, 2026).
[^aC-39]: National Institute of Standards and Technology, SP 800-39, *Managing Information Security Risk: Organization, Mission, and Information System View*, March 2011, Chapter 2 (the four components of risk management, the types of risk response, and the three tiers), <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-39.pdf> (accessed Oct 21, 2026, as cited in Chapter 05).
[^aC-30]: National Institute of Standards and Technology, SP 800-30 Rev. 1, *Guide for Conducting Risk Assessments*, September 2012, Chapter 3 (Tasks 1-1 to 4-2) and Appendices G to I (assessment scales for likelihood, impact and risk), <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf> (accessed Nov 6, 2026).
[^aC-53]: National Institute of Standards and Technology, SP 800-53 Rev. 5, controls PM-9 and RA-3, as checked in [Chapter 05](05-program-management-controls.md) and [Book 00, Appendix A](../b00-orientation/appendix-a-risk-register-and-traceability.md) against release 5.2.0 (accessed Oct 21, 2026); not re-opened for this appendix.
