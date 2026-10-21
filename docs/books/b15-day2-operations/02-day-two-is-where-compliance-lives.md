---
title: "Chapter 02 — Day Two Is Where Compliance Lives or Dies"
description: "Why a control that is designed and deployed still decays unless the day-two work that touches it is routed, authorized and evidenced by automation; what SP 800-53 asks of account, authenticator, change and inventory management and of continuous monitoring; the program's deploy model and coordination contract, with the service management platform coordinating and native tools actuating; and the day-two operating model the rest of the book builds."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b15-day2-operations
book: B15
part: Why
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 02 — Day Two Is Where Compliance Lives or Dies

*A control that is designed, deployed and then run by hand is compliant on the day it is assessed and a little less compliant with every request after.*

::: {.callout-note}
## In this chapter
Why compliance decays through routine operations rather than through dramatic failures, traced through the SP 800-53 controls that day-two work touches most. The three layers a control has to pass through before an assessor can rely on it: designed, deployed as code, and operated with an owner, a gate and an evidence feed. The program's coordination contract, in which the service management platform coordinates the work and native tools make the change, with an honest note on what ServiceNow's own products already cover. And the day-two operating model in outline, with a map of where each part is built in this book.
:::

[Chapter 01](01-the-help-desk-decides.md) argued that a modernized estate is judged at the help desk. This chapter makes the same argument from the other side of the desk: the authorization package. An authorization describes the system as it was assessed. The day after, the help desk resets a few hundred passwords, onboards a dozen people, changes group memberships, grants an application, and fixes a synchronization error. Every one of those changes touches a control. If each is routed, approved, executed under least privilege and recorded, the package stays true. If each is a portal click, the package ages with every click, and the next assessment finds the difference.

That is the sense in which day two is where compliance lives or dies. Controls are rarely defeated by an attack on the control itself. They erode through ordinary, well-meant work that leaves no record the control would recognize. The program's answer isn't more reviewers. It is to make the routine work produce its own evidence, so that operating the estate and proving the estate are the same activity.

![Two estates after the same go-live. Where day-two work is done by hand, each change erodes a control and evidence is assembled before the audit; where it is routed, gated and executed by automation, each change emits its record and the evidence is continuous.](../../images/diagrams/b15-day2-operations/svg/ch02-two-estates-after-go-live.svg){#fig-ch02-two-estates-after-go-live fig-alt="A green card at the top: go-live, the estate is assessed and the package is true. Two columns lead down from it. The red column, labeled run by hand, has three cards: portal clicks on emailed requests, under standing admin; each change leaves no approval or record the control recognizes; evidence assembled before the audit, screenshots and exports, which ages until the next cycle. A dashed red arrow labeled findings leads to a slate card at the bottom. The green column, labeled run by automation, has three cards: typed requests, each routed by the authority it needs; an approval gate, a just-in-time role and an integration action; a closing check and a record, emitted to the evidence pipeline. A solid green arrow labeled continuous evidence leads to the same slate card: the authorizing official and continuous monitoring, CA-7."}

## Compliance decays through routine work

The controls that day-two work touches most are among the most frequently sampled in an assessment, and their text is specific about what has to be true. All of the following are in the moderate baseline of SP 800-53 release 5.2.0.[^c02-sp80053]

| Control | What the catalog asks | How day-two work erodes it when done by hand |
|---|---|---|
| AC-2, Account Management | Approvals by defined roles for requests to create accounts; create, modify, disable and remove accounts according to policy; monitor account use; review accounts on a defined frequency; align account management with personnel termination and transfer | An account created from an email has no approval the control recognizes; a leaver disabled only when someone remembers stays enabled |
| AC-2(4), Automated Audit Actions | Automatically audit account creation, modification, enabling, disabling and removal | A change made outside the audited path, or recorded only in a reply, leaves the audit trail incomplete |
| AC-6, Least Privilege | Allow only the access necessary to accomplish assigned tasks | Routine work done under standing global or portal administrator rights |
| AC-6(9), Log Use of Privileged Functions | Log the execution of privileged functions | Privileged work done through an unlogged session or a pasted script |
| IA-5, Authenticator Management | Verify the identity of the person receiving an authenticator; procedures for lost or compromised authenticators; protect authenticator content from disclosure | A reset on an unverified request; a temporary password sent to the requesting mailbox |
| CM-3, Configuration Change Control | Review and approve configuration-controlled changes; document decisions; retain records; monitor change activity | A change with no change record, no before-and-after state and a "done" reply as its only trace |
| CM-8, System Component Inventory | An inventory that accurately reflects the system, includes all components, has no duplicate accounting, and is reviewed and updated | A subscription or server stood up by hand that never reaches the inventory |
| AU-9, Protection of Audit Information | Protect audit information from unauthorized access, modification and deletion | Logs written to a share that the administrators being audited can edit |

None of these controls asks for automation in so many words, and that matters for an honest reading. At moderate, the catalog asks for automated support in specific places: AC-2(1) requires supporting account management with automated mechanisms, AC-2(4) requires automatic auditing of account actions, and CM-8(1) requires updating the inventory as part of installations and removals. Automated maintenance of the inventory's currency and completeness, CM-8(2), is in the high baseline only, and automation support for monitoring, CA-7(6), is in none of the three baselines.[^c02-baselines]

So the program's emphasis on automation isn't a reading of the moderate baseline as demanding it everywhere. It is a design position about volume. A moderate system has to show, at every assessment and continuously in between, that every account approval, every authenticator issued, every privileged action and every component change met the control. At day-two volume, the program's judgment is that people assembling that record by hand can't keep up, and the record they produce is a reconstruction rather than evidence. Automation is how the moderate requirements stay true at the volume a real help desk runs.

### What continuous monitoring asks for

CA-7, which every baseline includes, is where the decay becomes a compliance problem rather than a hygiene problem. It requires a system-level continuous monitoring strategy with defined metrics, defined frequencies for monitoring and for assessing control effectiveness, ongoing control assessments, correlation and analysis of what the assessments and monitoring produce, response actions to address the results, and reporting of the system's security and privacy status at a defined frequency.[^c02-sp80053] NIST's guideline on information security continuous monitoring, SP 800-137, describes the purpose as providing "visibility into organizational assets, awareness of threats and vulnerabilities, and visibility into the effectiveness of deployed security controls," giving ongoing assurance that controls are aligned with the organization's risk tolerance.[^c02-sp800137]

Day-two work is the largest single input to that visibility. If a reset, a joiner or a group grant emits a record, the monitoring strategy can count, sample and assess it. If it doesn't, the strategy is monitoring a system that changes every day through a channel it can't see. [Book 13, Chapter 01](../b13-governance/01-why-governance-decays.md) sets out why point-in-time assessment against a constantly changing estate fails; this book is about the part of the change that runs through operations.

## Designed, deployed, operated

A control has to pass through three layers before an assessor can rely on it, and the program's guidance maps one body of work to each.

1. **Designed.** An architecture shows that a mechanism is sufficient to close the control, and the system security plan says the control is implemented. On its own this is a design assertion.
2. **Deployed as code.** The mechanism is applied to the estate from source, through a change-controlled pipeline, and emits evidence when it deploys. A closure that isn't deployed as code and emits no evidence can't be exercised by an assessor. A baseline no pipeline enforces doesn't show CM-6, which asks for configuration settings to be implemented and changes to them monitored and controlled; a monitoring platform with no rules doesn't show AU-6, which asks for audit records to be reviewed and analyzed for unusual activity.[^c02-sp80053]
3. **Operated.** The deployed control has an owner, a change gate, a clock and an evidence feed. Drift becomes a task, the task gets an owner, the owner's fix goes through an approval, and the closure produces evidence. A control that is configured but not run this way is, in the program's phrase, a hope rather than an operating control: CM-3 isn't satisfied by good intentions but by an approved, reviewable change record, and CA-7 isn't satisfied by a dashboard nobody acts on.

Each layer depends on the one before and neither later layer re-closes a control the earlier one closed; that would double-count. The second layer makes a closure demonstrable; the third keeps it true. Day-two operations live in the third layer, and this book is mostly about it. [Book 14, Chapter 04](../b14-compliance/04-closure-with-proof.md) sets the rule that no closure counts without its proof.

### The deploy model

Three principles govern the second layer in the program's design, and day-two operations inherit all three.

- **Everything as code, applied through a pipeline.** Landing zones, Conditional Access, data-protection policy, detection rules and playbooks are versioned files applied through a change-controlled pipeline, so the deployed state is reproducible, reviewable and comparable with its intended state. This is the precondition for CM-2 and CM-3 to mean much: CM-2 asks for a current baseline configuration maintained under configuration control, and a baseline that can't be re-derived from source is hard to show as either.[^c02-sp80053]
- **In the boundary by construction.** Every component that processes identity-attributed or behavioral telemetry runs inside the agency's own authorized boundary, and every component a deployment depends on carries an authorization commensurate with the data it handles. The constraint is on where raw telemetry goes, not on whether it can be analyzed. Shipping it to an out-of-scope service for convenience recreates the flow the boundary forbids, as the agency's own finding.
- **Evidence-emitting by default.** A deployment that produces no machine-readable evidence has done half the job. Every deployed mechanism writes to the evidence contract, the normalized record keyed on asset identity plus time that [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md) defines, so the continuous-monitoring pipeline can bind it to the control it closes.

Day-two work applies the same three rules to requests instead of deployments: the request is typed rather than free text, the execution happens inside the boundary through an approved path, and the closure emits evidence. [Book 10, Chapter 07](../b10-cloud-boundary/07-the-front-door.md) shows the same discipline for provisioning a landing zone from a catalog request.

## The coordination contract

The third layer needs a system of record: somewhere a request becomes a task with an owner, an approval trail, a clock and a link to the asset it touches. The program's design divides the management plane in two to provide it.

1. **Actuation is platform-native.** Microsoft 365 is configured through Microsoft Graph, Conditional Access and its secure-baseline tooling; Azure through Azure Policy, Defender for Cloud and Update Manager; the other clouds and the agency's own virtualization estate through their own native services. The coordination platform doesn't patch a machine, flip a Conditional Access policy or rewrite a policy assignment as its main job.
2. **Governance and evidence are unified.** Every native surface reports its control state into one workflow-and-evidence system, so that there is a single compliance picture, a single approval trail and a single feed into the authorization package. The coordination platform orchestrates who acts, when, under what approval, and with what evidence.

The requirement is a contract, not a product. In the program's design it has four properties, and a fifth guardrail holds throughout:

| Property | What it means for day-two work |
|---|---|
| Work routed to a named owner | Every request and every drift finding becomes a task with an owner and a clock |
| Change gated by an approval record | The approval the control requires is recorded before the change, and the approver is never the requester |
| Execution under a least-privilege service identity | The platform reaches each surface through a scoped, auditable identity with only the permissions its role needs, never standing write over the estate it governs |
| Machine-readable evidence emitted | The request, approval, elevation, result and closing check become a record the authorization package can consume |
| Guardrail: the configuration database reconciles to the authoritative inventory | The service management platform's configuration database is a workflow projection of asset state, reconciled to the authoritative asset identity; it is depended on for routing and evidence, never for truth |

The guardrail is what keeps coordination from becoming a second, competing inventory. CM-8 asks for an inventory that accurately reflects the system and includes no duplicate accounting of components.[^c02-sp80053] An estate with two inventories that disagree satisfies neither clause. A configuration database that drifts from the authoritative record is a reconciliation defect, not a new source of truth. [Book 13, Chapter 03](../b13-governance/03-one-authoritative-record.md) sets the one-record rule, and [Chapter 07](07-the-cmdb-and-asset-identity.md) builds the reconciliation. [Book 12, Chapter 07](../b12-security-operations/07-patch-configuration-and-baselines.md#cm-8-is-the-precondition-for-si-2-at-scale) shows why the inventory is the precondition for patching at scale.

### ServiceNow as the reference platform, not a mandatory one

The program's sources build the contract on ServiceNow, because many agencies already run their service desk, configuration database and governance-risk-compliance work there. The workbook names ServiceNow as the platform the sources describe, not as a requirement. An agency on a different stack can satisfy the same contract in either of two ways the program's design recognizes:

- **Another authorized workflow and configuration-database platform,** re-targeting the catalog and the control mappings as data rather than redesigning the loop. Atlassian Government Cloud, for example, is listed on the FedRAMP Marketplace as FedRAMP Certified at Class C (Moderate).[^c02-fr]
- **A composed pipeline on tooling already inside the boundary,** such as work items in an authorized source-control or DevOps service, routing through workflow automation, and security-monitoring automation rules that turn drift into tasks. This is acceptable if all four properties and the guardrail demonstrably hold, and it trades an integrated configuration database and compliance surface for assembly effort.

Substituting the platform changes none of the control claims. What satisfies CM-3 and CA-7 is the operated contract, not the vendor.

### The boundary question

A reviewer is entitled to ask how a coordination platform sits relative to the boundary it coordinates. The FedRAMP Marketplace lists ServiceNow's government offering as Government Community Cloud (F1305072116), FedRAMP Certified at Class D (High).[^c02-fr] (The sources call it "ServiceNow Government Cloud"; the Marketplace name is Government Community Cloud.) Many agencies operate the systems it would coordinate at Moderate.

The direction of that difference is conservative. In the release 5.2.0 baselines every control and enhancement in the moderate baseline is also in the high baseline,[^c02-baselines] so the platform's inheritable controls were assessed at or above the moderate bar. Customer-responsibility controls, including the instance's configuration, the workflow design and the connectors, remain the agency's either way. The program's design is that the agency records this treatment explicitly in its own authorization, either as a documented decision to use a High-certified coordination platform against a moderate system or by choosing a Moderate-certified alternative. The coordination loop is the same either way. Certification status changes; check the Marketplace at procurement, as [Book 10](../b10-cloud-boundary/index.md) explains.

The second boundary rule is about execution. Any call that reaches an agency surface, whether Microsoft Graph, a cloud management API or an address-management grid, runs through a connector inside the boundary so that credentials and execution stay there. In ServiceNow that connector is the MID Server, which ServiceNow describes as an intermediary between the network and the instance: administrators install it on hosts inside the network, and applications use it to communicate with systems in that network and transfer results back through the firewall.[^c02-sn-mid] The service identity the connector uses carries only the read and task permissions its role needs, with any write scoped, logged and individually approved.

### What the platform already ships

An honest account of the design has to say where the platform's own products already cover part of it. ServiceNow sells a Continuous Authorization and Monitoring application that, in its documentation's words, "employs the seven steps defined by the NIST Risk Management Framework," with a workspace for continuously monitoring compliance with the framework; it is a separate subscription that requires activation.[^c02-sn-cam] An agency that owns it already has a place for control assessments, plans of action and authorization tracking, and the program's design should feed it rather than duplicate it. [Chapter 11](11-attestation-and-the-compliance-app.md) sets the program's own compliance application beside ServiceNow's native products and treats the program's design as one option among them.

## The day-two operating rules

The program's lifecycle rule applies to every operation in the estate: it originates with the source of truth, carries an authorization resolved from the authority model, executes under least privilege elevated just in time, closes with provenance, and emits verified evidence automatically. [Book 13, Chapter 04](../b13-governance/04-change-control-and-provenance.md#the-five-clause-path) states the five clauses in full, and [Book 14, Chapter 04](../b14-compliance/04-closure-with-proof.md#every-operation-travels-the-authorized-path) gives their compliance reading. This book adds the day-two reading.

1. **Originate with the source of truth.** An HR joiner, mover or leaver event for a person; the non-human identity registry for a service account; a governed request resolved against the authoritative record for everything else. An email is not a source of truth. The email opens a ticket, and the ticket resolves against the record.
2. **Carry the authorization the control requires.** The approval gate is a property of the control, not a workflow convenience. A password reset is identity-verified; a Conditional Access exception needs a security approver; a privileged group is time-bound and reviewed. Requester and approver are never the same person.
3. **Execute under least privilege, elevated just in time.** A scoped, time-boxed role activated at execution, with execution through the in-boundary connector. Never standing tenant or portal administrator rights for routine work. In Entra ID this is an eligible role assignment in Privileged Identity Management, activated for a limited time with MFA, a justification and, where configured, an approval, and recorded in its audit history.[^c02-ms-pim]
4. **Close with provenance.** The closing record carries the check that proves the state took, not a "done" reply.
5. **Emit the evidence automatically.** The request, approval, elevation, result and closing check become a change record reconciled to the authoritative asset identity, feeding attestation and continuous monitoring. No hand-compiled report.

If any of the five is missing, the program treats the operation as unauthorized by construction. The change to the estate may have been made correctly, but the finished action can't be attested.

### What changes for everyday tasks

The program's runbook applies the rules to the tasks that most often arrive at a service desk in an ungoverned shape. The summary shows the pattern; [Chapter 12](12-the-day-two-runbook.md) gives each task's governed procedure.

| Task | As found | Under the operating rules |
|---|---|---|
| Password reset | Emailed request; standing admin; temporary password sent to the same mailbox | Typed request against the identity record; verification to policy; just-in-time role; credential delivered on a separate channel; closing check |
| Authenticator reset | Emailed request; look up and click; "done" reply | Treated as the highest-risk task: verification to the account's risk tier, second approver for privileged accounts, alert on every reset |
| Admin consent to an application | One operator's judgment that the permissions look reasonable | Authorization status of the external service recorded before consent; scoped grant; approver distinct from requester |
| Creating an account | Ad hoc request; global admin; credentials emailed in clear text | Provisioned from the HR joiner event with derived entitlements; Temporary Access Pass on a separate channel |
| Running a script for a requester | Requester's pasted command run under admin rights | Parameters, not commands: validated inputs to a pre-approved, version-controlled script; before-and-after state recorded |
| Morning synchronization check | Daily interactive logon to directory-sync hosts; errors pasted into an email | Scheduled read-only probe; the report generated from its output; each error a tracked task |
| Event-log handling | Logs written to an administrative file share | Logs forwarded to the central log platform, retained to policy, reviewed on a defined cadence |
| Custom administrative roles | One scoped role, everything else standing admin | Every task under a scoped, just-in-time role with an enumerated permission set and a review cadence |

Every "as found" row is a control eroded a click at a time. Every row on the right is the same task producing the evidence its control needs. No extra work is invented; the routine operation is routed through the path that makes it attestable.

## Where the evidence goes

Day-two evidence has one destination: the agency's own authorization. It feeds the system's continuous monitoring strategy under CA-7, the plan of action and milestones when something fails, and the authorization package an authorizing official relies on. [Book 14, Chapter 11](../b14-compliance/11-the-authorization-package.md) builds the package and its machine-readable form.

One correction to the sources belongs here. They describe day-two evidence as feeding FedRAMP's Key Security Indicators. Those indicators bind cloud service providers, not agencies; [Book 14, Chapter 01](../b14-compliance/01-proof-not-a-promise.md#what-the-agency-inherits-from-the-provider) explains the split. The agency's day-two evidence supports the agency's own monitoring and authorization. Where the agency's records are organized along the same themes as the provider indicators, that is a convenience for reading them side by side, not a reporting obligation.

## The operating model in outline

The rest of this book builds the day-two operating model piece by piece. Its spine is the path a request takes: in through one front door, routed by the authority it needs, executed through a catalog item under a scoped identity, reconciled to the inventory, and closed into evidence. Around that path sit the automation that turns native control state into tasks, the people who run it, and the runbook and tests that prove it works.

![The day-two operating model as a path through this book: intake and routing, help-desk authority, the service catalogs and SaaS integration, the configuration database, control automation on each platform, attestation, and the runbook and validation, with the people who run day two alongside.](../../images/diagrams/b15-day2-operations/svg/ch02-operating-model-map.svg){#fig-ch02-operating-model-map fig-alt="A top-to-bottom path of cards. A slate card: a request, drift finding or HR event. A violet card, Chapter 03: intake, triage and routing, one front door, routed by authority. A blue card, Chapter 04: help-desk authority in Entra ID, scoped roles, just-in-time elevation, the high-risk tasks. A blue card, Chapters 05 and 06: the service catalogs and SaaS integration, typed and control-mapped items, an authorization verdict before consent. A slate card, Chapter 07: the configuration database and asset identity, reconciled to the authoritative inventory. A blue card, Chapters 08 and 09: control automation on Microsoft 365, Azure, AWS and VMware, native state becomes tasks. A green card, Chapter 11: attestation and the compliance application, closures become control evidence. A green card, Chapter 12: the runbook and validation, governed tasks and tests that prove them. To the side, an amber card, Chapter 10: who runs day two, owners, approvers and operators, with dashed lines to the routing and attestation cards."}

| Chapter | The question it answers | What it supplies to the model |
|---|---|---|
| [Chapter 03 — Intake, Triage and Routing](03-intake-triage-and-routing.md) | How does a request get from an email to the right pipeline? | One front door, classification by required authority, and the map of tasks to integration actions |
| [Chapter 04 — Help Desk Authority in Entra ID](04-help-desk-authority-in-entra.md) | What may the help desk do, under which role, and which tasks carry the most risk? | The authority model, eligible-not-active roles, and the high-risk task procedures |
| [Chapter 05 — The Service Catalogs](05-the-service-catalogs.md) | What does a typed, control-mapped request look like for identity and for telephony? | The help-desk and IT service management catalog, and the Teams telephony catalog |
| [Chapter 06 — SaaS Integration Governance](06-saas-integration-governance.md) | How does a new SaaS integration get approved without leaking the boundary? | The application gallery as a governed event, gated on a recorded authorization |
| [Chapter 07 — The CMDB and Asset Identity](07-the-cmdb-and-asset-identity.md) | How does the configuration database know what exists without becoming a second source of truth? | Discovery, reconciliation to authoritative asset identity, and the inventory join key |
| [Chapter 08 — Control Automation: Microsoft 365 and Azure](08-control-automation-m365-and-azure.md) | How does configuration drift on the Microsoft clouds become owned work? | Native posture and policy findings routed as tasks |
| [Chapter 09 — Control Automation: AWS and VMware](09-control-automation-aws-and-vmware.md) | How does the same loop run on AWS and the agency's own virtualization estate? | The same pattern on two more platforms |
| [Chapter 10 — Who Runs Day Two](10-who-runs-day-two.md) | Who owns, approves and operates each part? | Roles, decision rights and cadence for day-two operations |
| [Chapter 11 — Attestation, Evidence and the Compliance Application](11-attestation-and-the-compliance-app.md) | How do closures become control evidence an assessor accepts? | Control tests, attestation, and the compliance application beside the platform's native products |
| [Chapter 12 — The Day-Two Operator Runbook and Validation](12-the-day-two-runbook.md) | What does each everyday task look like when it is governed, and how do we prove the model works? | The governed procedures and the validation tests |

The model rests on decisions other books have already made. [Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md) sets the tempo: routine remediation is a ticket that authorizes a machine, and the person's role stops at approval. [Book 01, Chapter 11](../b01-transformation-arc/11-analysis-plan-delivery.md) sets the actuation ladder, with gated actuation at L3 as the default ceiling. [Book 04](../b04-access/index.md) sets the privileged-access model the help desk works within. This book applies them to the work that arrives at the desk every day.

## Honest limits

- **This is program design, not a federal requirement.** The three layers, the coordination contract and the operating rules are the program's way of meeting the controls at day-two volume. The controls themselves are the requirement; other designs can meet them.
- **Automation doesn't remove judgment.** Verification of a caller, approval of an exception and acceptance of residual risk stay with people. Automation removes the steps that don't need judgment and records the ones that do.
- **Some surfaces stay manual for a long time.** Where no integration action or connector can reach a system, the work is a declared, approved, recorded session, as [Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md#when-no-machine-can-reach-the-surface) describes. That makes the gap visible and bounded, not cheap.
- **The platform's own products move.** ServiceNow's applications, certification status and integration actions change by release. Treat every product statement in this book as a dated observation and check it before it informs a plan.

## What leadership should take from this

1. **Measure compliance where the changes happen.** Most changes to identity and configuration are day-two requests. A monitoring strategy that can't see them is monitoring a different system from the one in production.
2. **Fund the third layer.** A designed and deployed control still decays without an owner, a gate, a clock and an evidence feed. That operating capability is the real cost of staying compliant, and it is mostly automation, not headcount.
3. **Buy the contract, not the product.** Whatever platform coordinates the work has to route to an owner, gate change with an approval record, execute under least privilege, emit machine-readable evidence, and reconcile its inventory to the authoritative one.

[Chapter 03](03-intake-triage-and-routing.md) starts building the model at its front door: how a request is taken in, triaged and routed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 01 — Modernization Succeeds or Fails at the Help Desk](01-the-help-desk-decides.md) · [Book index](index.md) · [Next: Chapter 03 — Intake, Triage and Routing →](03-intake-triage-and-routing.md)
:::

[^c02-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls AC-2, AC-2(4), AC-6, AC-6(9), AU-6, AU-9, CA-7, CM-2, CM-3, CM-6, CM-8 and IA-5, statements and moderate-baseline membership checked against the release 5.2.0 OSCAL catalog and moderate baseline profile, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Oct 21, 2026).
[^c02-baselines]: National Institute of Standards and Technology, SP 800-53 Rev. 5 release 5.2.0 low, moderate and high baseline profiles in OSCAL JSON (`NIST_SP-800-53_rev5_LOW-baseline_profile.json`, `..._MODERATE-baseline_profile.json`, `..._HIGH-baseline_profile.json`); membership of AC-2(1), AC-2(4), CM-8(1), CM-8(2) and CA-7(6), and the comparison of the moderate and high baselines, checked by the program, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Oct 21, 2026).
[^c02-sp800137]: National Institute of Standards and Technology, SP 800-137, *Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations*, September 2011, Abstract, <https://csrc.nist.gov/pubs/sp/800/137/final> (accessed Oct 21, 2026).
[^c02-fr]: FedRAMP Marketplace, `products.json` (meta `last_change` 2026-10-21): ServiceNow Government Community Cloud, F1305072116, FedRAMP Certified, High, Class D; Atlassian Government Cloud, FR2412062433, FedRAMP Certified, Moderate, Class C, <https://www.fedramp.gov/marketplace/products.json> (accessed Oct 21, 2026).
[^c02-sn-mid]: ServiceNow, "Exploring MID Server," product documentation (Australia release), <https://www.servicenow.com/docs/r/ZUQIWHvhWUsSoHqqH5PGGw/DZ_kW9pQY2SE0ol1QsD5ZA> (accessed Oct 21, 2026).
[^c02-sn-cam]: ServiceNow, "Continuous Authorization and Monitoring," product documentation (Zurich release; plugin `com.sn_irm_cont_auth_monitor`, separate subscription), <https://www.servicenow.com/docs/r/DDKNGuzcS_gt6P_P4KM3Dg/KvuARTgnwDh27DBm1_IHoQ> (accessed Oct 21, 2026).
[^c02-ms-pim]: Microsoft Learn, "What is Microsoft Entra Privileged Identity Management?," <https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure> (accessed Oct 21, 2026).
