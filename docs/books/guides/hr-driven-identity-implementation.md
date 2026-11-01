---
title: "HR-Driven Identity: An Implementation Guide"
description: "A gated guide for running the HR-driven identity lifecycle in Microsoft Entra ID once the HR pipeline exists: who writes each account state and attribute, employee and contractor sources, joiner workflows and day-one access, access packages assigned from HR attributes with reviews of what remains after a move, PIV and CAC certificate binding tied to HR events, separation timing and deprovisioning, and drift, reconciliation and evidence. Each gate states the federal requirement it meets, the evidence an ISSO keeps, each feature's availability in GCC and GCC High, an interim path, and the validation kit check that proves it. It links Book 03 for the design and hands the pipeline build to the Oracle HCM guide."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 03"
last-reviewed: 2026-11-01
---

# HR-Driven Identity: An Implementation Guide

*The pipeline makes the account exist; this guide makes the HR record decide everything that happens to it after that, and proves it did.*

::: {.callout-note}
## In this guide
How an agency makes its HR system of record decide who exists in Microsoft Entra ID and what they can reach, as gated steps an operator can run. First, how to read the guide and what it hands to other pages, where agencies start, the track at a glance, prerequisites and the path on one page. Then seven gates: fix who writes each account state and attribute; bring employees and contractors in from their sources; make joiners ready on day one; assign access from attributes and review what a move leaves behind; bind PIV and CAC credentials to HR events; time separations and deprovisioning; and keep the record true with drift checks and evidence. Each gate carries its federal requirements and the evidence an ISSO keeps, each feature's availability in GCC and GCC High, an interim path, a **Validate** step and rollback. Then the dangers, the evidence, rollback, a checklist and what couldn't be verified.
:::

## How to read this guide

[Book 03](../b03-hr-identity/index.md) holds the design: why HR is the source of authority, the attribute authority map, the canonical schema, joiner, mover and leaver, credentials, access, drift and the phase model. This guide doesn't restate it. Each step says what to do, links the chapter that explains why, and adds only what the chapters don't give: the order of work in the tenant, the federal requirement and the ISSO's evidence per gate, and what's available in a government cloud.

**What this guide adds.** Book 03 designs the lifecycle, and three pages build parts of it. [Building Book 03's HR Pipeline](hcm-entra-implementation.md) builds the feed from Oracle Fusion Cloud HCM into Entra ID: the middleware, the provisioning apps and shadow mode. [Attribute-Driven Migration: An Implementation Guide](attribute-driven-migration-implementation.md) builds the attribute foundation every track shares: the slot register, the proof that values are true, the group library, PIV binding coverage and attribute drift. Neither runs the lifecycle that happens to a person *after* the account exists. Nobody says, as gates, how to name one writer for each account state, how to run contractors from a source other than HR, how to assign access packages from HR attributes and review what a move leaves behind, how to tie a card's issuance and revocation to HR events, how to prove a separation blocked access in time, or what an ISSO files at each step. That's this guide.

| This guide owns | Handed to |
|---|---|
| One writer per account-state transition, and the lifecycle rows of the register | The slot register itself: [ADM implementation guide, Gate 1](attribute-driven-migration-implementation.md#gate-1-schema-and-slots) |
| Running the employee and contractor sources as lifecycle inputs | The feed, middleware and provisioning apps: [Building Book 03's HR Pipeline, Part 1](hcm-entra-implementation.md#part-1-the-entra-side); the contractor source decision: [the contractor evaluation](../../evaluations/oracle-contingent-worker-contractor-source.md#part-6-recommendation) |
| Joiner, mover and leaver workflows as tenant configuration, with their guardrails and evidence | The design: [Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md); the workflow sequences on the Oracle feed: [the pipeline guide](hcm-entra-implementation.md#the-sequences) |
| Access packages assigned from attributes, and residual-access reviews | Dynamic group rules and units: [ADM implementation guide, Gate 4](attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units) |
| Credential events tied to HR events, CBA configuration | Binding coverage and affinity: [ADM implementation guide, Gate 6](attribute-driven-migration-implementation.md#gate-6-piv-and-cac-binding) |
| Separation timing, lifecycle metrics, lifecycle drift classes | Attribute drift and the nightly comparison: [ADM implementation guide, Gate 9](attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true) |
| — | The schedule: the [Identity Lifecycle & Provisioning plan](../../project-plans/identity-lifecycle.md) |

: What this guide owns, and what it hands off {.striped .hover}

**Where the facts come from.** Facts carried from the books and guides rely on their own verification logs. Facts they don't carry were checked against Microsoft Learn and federal primary sources on November 1, 2026, and are footnoted; the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/hr-driven-identity-implementation.md) lists them. *(Design guidance)* marks the program's recommendations; *(inference)* marks a conclusion the sources support but don't state. The audience is a civilian agency at FedRAMP Moderate. The federal configuration authorities are CISA (the SCuBA baselines under BOD 25-01), NIST SP 800-53 Rev. 5 at Moderate, NIST SP 800-63 and FIPS 201-3; the [federal framework crosswalk](../../reference/federal-framework-crosswalk.md) lists every federal source the books cite.

**The validation kit.** Each **Validate** step names the read-only [validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) checks that prove part of the gate, and says "no kit check yet" where none exists. The checks read Microsoft Graph or an export and change nothing. They're fixture-tested, not proven against a live tenant. The code a gate needs beyond the kit, such as the writer scan, contractor end dates, workflows and policies as code, the CBA checks and separation timing, is in the developer workbook [*Building HR-Driven Identity*](../../project-plans/developer-workbooks/hr-driven-identity/index.md).

## Where agencies start {#where-agencies-start}

This guide assumes the starting state below *(design guidance: the common case, not a survey)*. Where yours differs, the gates still apply; the interim paths change.

| Area | Assumed starting state | What this guide does with it |
|---|---|---|
| Directory | On-premises Active Directory, synced to Entra ID; accounts created by help desk tickets or scripts from an HR extract; OU placement drives policy | Keeps AD as a landing zone until each population is cloud-mastered; closes the manual paths gate by gate |
| HR system | A legacy HR system now, moving to Federal HR 2.0's Oracle Fusion Cloud HCM in the agency's wave ([Book 03, Chapter 03](../b03-hr-identity/03-federal-hr-2-0.md)) | Runs the lifecycle against whichever source the pipeline reads; the source swap changes the feed, not these gates |
| Contractors | Outside HR, on COR spreadsheets, a suitability register or the PIV sponsorship records ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#contractors-and-vendors-the-population-hrit-doesnt-cover)) | Gives them a source and an enforced end date in Gate 2 |
| Credentials | PIV or CAC cards from the card management system, bound in AD through `altSecurityIdentities` and synced | Ties issuance and revocation to HR events in Gate 5 |
| Tenant | Microsoft 365 GCC, where Entra ID runs in Microsoft's commercial cloud; some agencies in GCC High, on Azure Government[^hri-gov-identity] ([Book 14, Chapter 03](../b14-compliance/03-the-baseline-and-the-crosswalk.md#two-facts-not-one)) | Checks each feature in both, per gate |
| Licensing | Entra ID P1 everywhere; Entra ID Governance not yet bought, or bought for a pilot | Names the gates that need Governance; gives an interim path for each |

: The starting state this guide assumes {.striped .hover}

**How government-cloud availability is checked.** Learn's feature availability page lists what Entra ID offers in Azure for US Government, which GCC High uses; it marks certificate-based authentication, Conditional Access, dynamic groups, access reviews, entitlement management, Privileged Identity Management, Lifecycle Workflows and API-driven inbound provisioning as available, and says Entra ID Governance is available in GCC, GCC High and DoD.[^hri-feat] Learn publishes no separate Entra table for GCC, because GCC tenants use the commercial Entra service.[^hri-gov-identity] So, in each gate, a GCC row reads "commercial service" unless Learn says otherwise *(inference)*, and a GCC High row cites the Azure Government table. Each gate's table lists only the features that gate uses. All were read on November 1, 2026.

**Where the parts run.** The HR platform runs on Oracle Cloud Infrastructure ([HR 2.0 governance explainer](../explainers/hr2-shared-governance-fedramp-boundary.md#oracles-hr-platform-today)). The lifecycle's own automation runs in Azure: a Lifecycle Workflows custom task extension calls an Azure Logic App on the consumption plan, and Learn names no other target.[^hri-lcw-ext] Applications an agency hosts on AWS or Oracle Cloud get lifecycle changes only through the access Entra ID grants them, by provisioning or federation, which this guide doesn't build; what the pipeline must resolve across Oracle, Azure, AWS and on-premises is in [DNS for HR-Driven Identity Across Clouds](../explainers/hr-identity-dns.md).

## The track at a glance

**Source of truth.** HR for employees; for contractors, one authority per fact, hung on a federal sponsor mastered in HR ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#one-fact-one-authority)). The identity platform stays authoritative for credentials, sessions and policy ([Book 03, Chapter 04](../b03-hr-identity/04-attribute-authority.md#system-of-record-versus-identity-provider)). OMB M-22-09 describes the same split: enterprise identity systems keep the metadata about a user current by drawing on systems such as human resources, contract management and personnel security.[^hri-m2209]

**Done when** *(design guidance, from Book 03's Phase 4 and 6 gates)*:

- every account traces to a worker record or a contractor record, through one key;
- every create, change, enable, disable and delete comes from an HR or contractor event, by a named writer;
- every entitlement resolves to a rule, an attribute and a record, and a move leaves nothing unreviewed;
- every separation blocks access within the approved interval, revokes the credential, and leaves evidence an assessor can read.

## Prerequisites {#prerequisites}

- **The pipeline, live for the foundation scope.** The Identity Lifecycle plan's Gate 3: the HR feed live, shadow differences explained, zero unmatched creations ([pipeline guide, build phases](hcm-entra-implementation.md#build-phases-mapped-to-book-03)).
- **The attribute foundation.** The [ADM implementation guide's](attribute-driven-migration-implementation.md) Gates 1 and 2: the slot register signed and the attributes proven on the pilot. This guide doesn't re-decide them.
- **The decisions Book 03 puts in Phase 1.** The enterprise person key, the authority map, the worker-type taxonomy and code lists, the privacy basis ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-1-attribute-authority-and-schema); plan decisions D-I1 and D-I2, task I0.4).
- **Licenses.** API-driven inbound provisioning needs Entra ID P1. Lifecycle Workflows, entitlement management and access reviews need Entra ID Governance (or the Entra Suite) for the member users they govern, including reviewers, though some entitlement-management and review capabilities still run under P2.[^hri-lic] Automatic assignment policies need Governance or the Entra Suite.[^hri-auto]
- **Roles, through PIM.** Lifecycle Workflows Administrator for workflows and custom task extensions; Identity Governance Administrator for automatic assignment policies, which catalog owners and access package managers can't create;[^hri-auto] Authentication Policy Administrator for certificate-based authentication and its CRLs.[^hri-crl] A custom task extension also needs Logic App Contributor, Contributor or Owner on the Logic App; Logic App Operator isn't enough.[^hri-lcw-ext] Put Lifecycle Workflows Administrator behind approval, because an on-demand run ignores a workflow's scope ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#guardrails-at-agency-scale)).
- **Logs leaving Entra ID.** Audit, sign-in and provisioning logs routed to the agency's SIEM or a storage account before the first gate, because Entra's own retention is short and not retroactive ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

## The path on one page

| Gate | Done when | Validate with | Plan tasks |
|---|---|---|---|
| [G1 Writers](#step-1-name-one-writer-for-every-state-and-attribute) | Every account-state transition and HR attribute has one recorded writer; other write paths removed | VK-HR-04, VK-HR-07; no kit check for writers yet | I1.2, I1.4 |
| [G2 Sources](#step-2-bring-in-employees-and-contractors-from-their-sources) | Employees from HR; contractors from a named source with an enforced earliest end | VK-HR-01, VK-HR-07; no kit check for contractor end dates yet | D-I3, I5.2 |
| [G3 Joiners](#step-3-make-joiners-ready-on-day-one) | Pre-hire and day-one workflows run with limits; day-one readiness measured | VK-HR-05, VK-HR-06 | I2.3, I4.3 |
| [G4 Access and movers](#step-4-assign-access-from-attributes-and-review-what-a-move-leaves) | Department access by automatic assignment; requests approved by the supervisor of record; residual access reviewed after a move | VK-DG-05, VK-HR-03; no kit check for assignment policies yet | I4.4, I4.5 |
| [G5 Credentials](#step-5-bind-credentials-to-hr-events) | CBA trusts the issuing CAs with CRLs; issuance and revocation follow HR and contractor events | VK-PIV-01; no kit check for CBA settings yet | I1.6 |
| [G6 Separation](#step-6-time-separations-and-deprovisioning) | The leaver blocks first, revokes in parallel, reconciles and disposes last; intervals measured | VK-HR-05, VK-HR-06 | I4.1, I4.2, I4.6 |
| [G7 Drift and evidence](#step-7-keep-the-record-true-and-file-the-evidence) | Lifecycle drift classes found and closed at the source; metrics on the ConMon cadence | VK-HR-01, 03, 04, 07; VK-DG-05 | IG5, then Book 03 Phase 6 |

: The seven gates of HR-driven identity {.striped .hover}

The [Identity Lifecycle & Provisioning plan](../../project-plans/identity-lifecycle.md) schedules this work with owners and decide-by weeks. Book 03's [phase model](../b03-hr-identity/12-execution-plan.md) is the source of every gate's threshold; the thresholds are proposed starting criteria the agency approves or replaces.

## Step 1: Name one writer for every state and attribute {#step-1-name-one-writer-for-every-state-and-attribute}

A rule that reads an attribute hands the access decision to whoever can write it ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#writers)). Account state is the same: the pipeline's `active` value and Lifecycle Workflows' enable, disable and delete tasks can both write it, for cloud and synced users alike ([Book 03, Chapter 04](../b03-hr-identity/04-attribute-authority.md#operating-rules)).

**Prerequisites.** The signed slot register ([ADM Gate 1](attribute-driven-migration-implementation.md#gate-1-schema-and-slots)) and the authority map (plan task I1.2).

**Steps.**

1. **Add the lifecycle rows to the register.** For each transition, name the writer and the backstop *(design guidance, from Book 03, Chapter 08)*:

    | Transition or value | Writer | Backstop |
    |---|---|---|
    | Account created | Inbound provisioning, from the HR or contractor record | None: nothing else creates workforce accounts |
    | Enabled at hire | The pipeline's `active` true on the hire date, or the day-one workflow's enable task: pick one | The other, recorded as backstop |
    | Disabled at separation | The pipeline's `active` false, no later than the leaver workflow's first run | The leaver workflow's disable task |
    | Re-enabled on a cancelled separation | The pipeline, re-deriving from the corrected record ([Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md#rescinded-offers-and-cancellations)) | None |
    | Deleted at disposition | The post-separation workflow's delete task; never `/bulkUpload` | None |
    | `employeeHireDate`, `employeeLeaveDateTime` | Inbound provisioning only | None |
    | `manager` | Inbound provisioning; HR, not IT, writes a new supervisor ([Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md#manager-links)) | None |
    | `certificateUserIds` or `altSecurityIdentities` | The card management system integration (Gate 5) | None |

    : Lifecycle rows for the writer register {.striped .hover}

2. **Write the scope filter down and version it.** Which records provision at all, including leave, secondment and pre-hire lookahead; the directory-side filter matches the middleware's ([Appendix A, Scope](../b03-hr-identity/appendix-a-lifecycle-rules.md#scope)). Leave isn't a leaver ([Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md#leave-is-not-a-leaver)).
3. **Remove the other write paths.** Help desk, self-service and Exchange-admin writes to the slots and the date carriers; in AD, the ACLs on the target OUs ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#writers)). Book 03 notes that whoever can write `altSecurityIdentities` in AD decides which certificate signs in as which synced user ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#binding-the-piv-certificate-to-the-entra-user)); that path goes on the list too.
4. **Write the audit query for each protected value.** The unauthorized-write drift class reads the Entra audit log and AD change auditing for writes by anything but the named writer ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory)). Save the query now; Gate 7 runs it.

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| NIST SP 800-53 AC-2 (account types, conditions of membership, account managers) and IA-4 (identifier management), both in the Moderate baseline[^hri-nist-mod] | The signed register with the lifecycle rows; the scope filter, versioned |
| AU-6 (audit record review) for writes outside the named writer | The saved audit queries and the AD auditing settings |
| The privacy basis for the feed (Privacy Act; the agency's SORNs and PIA) | The privacy office's determination for each flow ([Book 03, Appendix B](../b03-hr-identity/appendix-b-security-and-privacy.md#the-privacy-basis)) |

: Gate 1 requirements and evidence. The control mapping is Book 03's ([Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#control-support-nist-sp-800-53-rev.-5)) {.striped .hover}

**Government-cloud availability.** User and group management, dynamic groups and directory synchronization (Connect Sync and cloud sync): commercial service in GCC; available in Azure Government for GCC High.[^hri-feat]

**Interim path.** Until AD retires, sync is a writer too: for synced users the extension slots are AD-mastered and read-only in Entra ID ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#design-rules)). Record the provisioning agent's gMSA as the AD-side writer and review the OU ACLs every quarter until the population is cloud-mastered *(design guidance)*.

::: {.callout-important}
## Validate (G1 Writers)
- **VK-HR-04** reports zero duplicate `employeeId` values, and **VK-HR-07** reports the fill rate of the key, worker type, manager and coded slots against the threshold. Both measure the values, not the writers.
- No kit check reads who can write. The evidence is the delegation export, the OU ACL review and a clean run of the saved audit queries over the pilot's last 30 days.
- Gate owner: the ICAM governance body, with the data architect.
:::

**Rollback.** A writer change is a register change, signed like the original. A removed write permission comes back only by recorded change with an end date.

## Step 2: Bring in employees and contractors from their sources {#step-2-bring-in-employees-and-contractors-from-their-sources}

Employees come from HR through the pipeline. Contractors aren't in Federal HR 2.0's scope and need their own source, mapped into the same canonical record ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#contractors-and-vendors-the-population-hrit-doesnt-cover)).

**Prerequisites.** Gate 1. The contractor source decision (plan decision D-I3), informed by the [evaluation's recommendation](../../evaluations/oracle-contingent-worker-contractor-source.md#part-6-recommendation): an agency-owned contractor system of record now, with the Oracle contingent worker as a later source swap.

**Steps.**

1. **Employees: run the lifecycle against the live feed.** The pipeline guide builds the apps and the sequences. This gate checks only that the feed reads hires and separations by published date, so pre-hire and pre-separation workflows have time to run ([pipeline guide, the two decisions](hcm-entra-implementation.md#the-two-decisions-to-make-first)).
2. **Contractors: measure before changing anything.** Reconcile the register, the card management system and the contractor accounts in both directories, read only, on the enterprise person key. Report orphans and expired engagements ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#sequence-start-with-what-already-exists); [evaluation, phase 0](../../evaluations/oracle-contingent-worker-contractor-source.md#the-phased-path)).
3. **Settle the six questions with the register's owner**: owner, content, freshness, privacy basis, join key and coverage ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#before-a-register-becomes-an-authority)).
4. **Ship the contractor leaver first.** The middleware computes the earliest end (contract end capped by completion date, suitability withdrawn, card terminated, sponsor gone past the grace period, sponsor recertification missed) and sends the leave date and `active` false itself ([Appendix A, Contractor leavers](../b03-hr-identity/appendix-a-lifecycle-rules.md#contractor-leavers)). Then the joiner, with the sponsorship request as its output.
5. **Map contractors into the canonical record.** Worker type code `CTR`, the sponsor as `manager`, organization from the sponsor, and a contract reference ([evaluation, mapping](../../evaluations/oracle-contingent-worker-contractor-source.md#mapping-into-the-canonical-schema)). The contractor source gets its own API-driven provisioning app through the same middleware.
6. **Recertify sponsors with a review.** An access review on the contractor access package, with **Manager** as reviewer (the sponsor) and a named fallback reviewer; Learn offers monthly, quarterly, bi-annual and annual frequencies, and a no-response default of no change, remove access or take recommendations.[^hri-ar-ap] Bi-annual matches Book 03's example 180-day recertification; set no-response to remove access, so a missed recertification ends access as the earliest-end rule says *(design guidance)*.

**Pending proof.** The contractor PIV path is the program's design and hasn't yet been validated in practice; the criteria for Proved are in the evaluation's [Status and review](../../evaluations/oracle-contingent-worker-contractor-source.md#status-and-review).

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| AC-2 and PS-7 (external personnel security), in the Moderate baseline[^hri-nist-mod] | The contractor source decision record; the read-only reconciliation report; end-date-to-block intervals for contractors ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#control-support-nist-sp-800-53-rev.-5)) |
| IA-4(4) (identify each individual by status, such as contractor) | The worker type code on every account, from the source record |
| OMB M-22-09: enterprise identity draws on HR, contract management and personnel security[^hri-m2209]; OMB M-19-17 for the agency's ICAM governance ([contractor evaluation, decisions](../../evaluations/oracle-contingent-worker-contractor-source.md#decisions-and-owners)) | The authority-per-fact table, signed by the governance body |
| The Privacy Act basis for each contractor record flow | The privacy office's determination for the register and the card system ([Book 03, Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md#before-a-register-becomes-an-authority)) |

: Gate 2 requirements and evidence {.striped .hover}

**Government-cloud availability.** API-driven inbound provisioning, and provisioning-agent registration for a US Government tenant, are listed as available in Azure Government. HR-driven provisioning as a row is marked "Partial," with a pointer to the HR provisioning apps table, where the API-driven app is listed as available.[^hri-feat] In GCC, the commercial service. Access reviews: available in Azure Government; commercial service in GCC.[^hri-feat]

**Interim path.** Until the contractor source can feed the middleware, keep contractors on the governed exception path: each account carries the contract end date as `employeeLeaveDateTime`, so the leaver workflow still fires, and the sponsor review in step 6 runs on it *(design guidance)*. Retire the COR spreadsheets as a source of truth even before the replacement is automated ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-1-attribute-authority-and-schema)).

::: {.callout-important}
## Validate (G2 Sources)
- **VK-HR-01** lists enabled member users with no `employeeId`, excluding exceptions with an owner; contractors without a key show here. **VK-HR-07** reports the worker type fill rate.
- No kit check reads contractor end dates. The evidence is the reconciliation report (step 2), re-run after the contractor leaver ships, with zero enabled contractor accounts past their earliest end.
- Gate owner: the ICAM governance body; the contractor source's owner signs the authority table.
:::

**Rollback.** Pause the contractor provisioning app (a paused job keeps its state); contractors return to the exception path while the cause is fixed. The read-only reconciliation needs no rollback.

## Step 3: Make joiners ready on day one {#step-3-make-joiners-ready-on-day-one}

The account exists, disabled, before day one, because the pipeline sent it early ([Book 03, Appendix C](../b03-hr-identity/appendix-c-acceptance-and-cutover.md#acceptance)). This gate makes everything else ready by the start of the first day and measures it.

**Prerequisites.** Gate 2 for the population. Entra ID Governance licenses. The tenant's Temporary Access Pass policy enabled.

**Steps.**

1. **Build few workflows, scoped by code.** A pre-hire, a day-one, a mover, a leaver, a post-leaver, and the rehire and conversion workflows, scoped by the coded attributes, never one per organization ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#guardrails-at-agency-scale)). Learn gives two different tenant ceilings: the licensing page says 50 workflows, the service limits page says 100, with 25 tasks per workflow, 100 custom task extensions and five administrative scopes per workflow.[^hri-lic][^hri-limits] Budget to 50 until Microsoft reconciles them *(design guidance)*.
2. **Set the trigger times and the tenant schedule.** The hire date's time portion early in the day; the tenant schedule runs every 3 hours by default and can be set from 1 to 24.[^hri-lcw-time][^hri-lcw-api] Set it once, with the leaver in mind, because every workflow shares it ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#triggers-and-schedule)).
3. **Bridge to the card with a Temporary Access Pass.** The pre-hire workflow's built-in task generates a pass and emails it to the manager. It uses the hire date as the pass's start time, needs the manager and the manager's mail populated, and works only for a user with no other authentication methods, sign-ins or Entra role assignments.[^hri-tap-task] Learn recommends a 24-hour maximum lifetime for a pass sent to a new hire; the tenant policy allows 10 minutes to 30 days and can force one-time use.[^hri-lcw-time][^hri-tap] A rehire whose old account kept its methods doesn't qualify, so the rehire workflow needs its own path *(inference)*.
4. **Give baseline access by package, not by group add.** The day-one workflow requests the onboarding package; department access comes from automatic assignment (Gate 4). Never add a new hire directly to an application group ([Book 04, Chapter 09](../b04-access/09-access-governance.md#lifecycle-workflows-at-the-access-level)).
5. **Set execution limits on every scheduled workflow** a little above normal weekly volume, so an anomaly quarantines and a normal week doesn't ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#guardrails-at-agency-scale)).
6. **Measure day-one readiness**: the share of new hires whose account, licenses and baseline access exist at the start of day one ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-measured-lifecycle)).

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| AC-2(1) (automated system account management), Moderate baseline[^hri-nist-mod] | Workflow definitions and versions; run history exported past Entra's 30-day view ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)) |
| IA-5 (authenticator management): the initial authenticator is time-limited and goes to an accountable person | The TAP policy export (lifetime, one-time use) and the task's arguments |
| OMB M-22-09: phishing-resistant MFA for agency staff, contractors and partners[^hri-m2209] | The bridge ends when the card is bound (Gate 5); accounts still on a pass past the agreed window are a finding |

: Gate 3 requirements and evidence {.striped .hover}

**Government-cloud availability.** Lifecycle Workflows and entitlement management: available in Azure Government; commercial service in GCC.[^hri-feat] Learn's Azure Government table has no row for Temporary Access Pass; its availability in GCC High wasn't confirmed (see [What couldn't be verified](#what-couldnt-be-verified)).

**Interim path.** Before Governance is licensed, the pipeline creates the account disabled and enables it on the hire date as the single writer; the help desk issues the pass under a written procedure, and the onboarding access comes from dynamic groups ([ADM Gate 4](attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units)) *(design guidance)*.

::: {.callout-important}
## Validate (G3 Joiners)
- **VK-HR-05** reports users whose hire date is in the past with no processing record: late HR data or a missed catch-up window. **VK-HR-06** reports whether execution limits are set and the workflow count against the ceiling. The kit's ceiling is 100; hold it to 50 (step 1).
- The pre-hire and day-one runs' history for the pilot's last hire cohort, and the day-one readiness rate against the approved threshold.
- Gate owner: identity engineering, with HR for the timeliness of hire entries.
:::

**Rollback.** Disable the workflow's schedule; it keeps its versions. Joiners fall back to the interim path.

## Step 4: Assign access from attributes and review what a move leaves {#step-4-assign-access-from-attributes-and-review-what-a-move-leaves}

Dynamic groups carry rule-decided access ([ADM Gate 4](attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units)). Access packages carry what a rule can't decide alone, with approvals that route to the supervisor of record, and reviews of what remains ([Book 03, Chapter 10](../b03-hr-identity/10-from-attributes-to-access.md#access-packages-and-access-reviews)).

**Prerequisites.** Gate 3. The code lists owned by HR. The dynamic group library designed.

**Steps.**

1. **Department packages by automatic assignment.** An automatic assignment policy assigns the package to everyone matching a rule on user attributes, and removes it when they stop matching. The rule uses the dynamic membership properties, including the extension attributes, and covers at most 15,000 users per policy.[^hri-auto] Write it on the coded slots with the guards ([Book 03, Chapter 10](../b03-hr-identity/10-from-attributes-to-access.md#rule-patterns)).
2. **One automatic policy per package.** Learn supports more than one only if no user ever matches two or moves from one to another; otherwise users can lose access. Entitlement management creates a hidden dynamic group per policy; don't modify it or reuse it.[^hri-auto]
3. **No `memberOf` in any rule.** From November 3, 2026, an automatic assignment policy whose rule uses `memberOf` is quarantined: it stays, but adds and removes nothing until the operator is removed. Learn publishes a read-only script to find them.[^hri-auto] Run it now.
4. **Set a grace period for movers.** A policy can keep access for a set time after a user leaves scope.[^hri-auto] Book 04 keeps a handover grace for standard access and zero for Tier 1 and privileged access ([Book 04, Chapter 09](../b04-access/09-access-governance.md#lifecycle-workflows-at-the-access-level)).
5. **Request policies route to the manager.** **Manager as approver**, with a fallback approver for users with no manager ([Book 03, Chapter 10](../b03-hr-identity/10-from-attributes-to-access.md#access-packages-and-access-reviews)).
6. **The mover workflow reviews the residual.** An attribute-change workflow on the organization code removes the old department's packages, requests the new one, and starts a review of everything held outside packages ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#mover)). Measure the transfer-to-review interval.
7. **Privileged access stays out of rules.** HR attributes decide who may *request* eligibility through a package; the role is activated through PIM ([Book 03, Chapter 10](../b03-hr-identity/10-from-attributes-to-access.md#where-dynamic-membership-stops)).
8. **Plan a reorganization as a mass mover**: rehearse, let the execution limit quarantine it, release after checking against HR ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#guardrails-at-agency-scale)).

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| AC-2 (authorize access on organization-defined attributes), AC-6 (least privilege), AC-5 (separation of duties), Moderate baseline[^hri-nist-mod] | Assignment policy exports with their rules; the separation-of-duties settings ([Book 04, Chapter 09](../b04-access/09-access-governance.md#separation-of-duties)) |
| PS-5 (personnel transfer) | Transfer-to-review intervals; the residual-review decisions |
| AC-2 account review | Access review results, exported before the 30-day history window closes ([Book 04, Chapter 09](../b04-access/09-access-governance.md#how-the-program-evidences-reviews)) |
| CISA SCuBA MS.AAD.7.5v1: highly privileged roles provisioned only through a privileged access management system (BOD 25-01 required)[^hri-bod] | PIM eligibility through packages; no standing role from a rule |

: Gate 4 requirements and evidence {.striped .hover}

**Government-cloud availability.** Entitlement management, access reviews, PIM and dynamic groups: available in Azure Government; commercial service in GCC.[^hri-feat] **Not available in GCC High:** administrative units with dynamic membership rules exist only in the global Azure cloud, not in specialized clouds such as Azure Government.[^hri-au-dyn] GCC tenants, on the commercial service, have them.

**Interim path.** In GCC High, use assigned administrative units whose membership a scheduled job sets from the same rule the dynamic group uses, and compare the two in Gate 7 *(design guidance)*. Before Governance is licensed, department access stays on dynamic groups; packages and automatic assignment wait.

::: {.callout-important}
## Validate (G4 Access and movers)
- **VK-DG-05**, against a snapshot taken before a test move, shows exactly the expected membership changes; **VK-HR-03** reconciles counts per organization code with the HR export.
- No kit check reads automatic assignment policies yet. The evidence is the policy export, the `memberOf` scan's output with zero rows, and the mover workflow's run history for the test user.
- Gate owner: the CISO. This gate and the cross-track mover proof ([ADM Gate 7](attribute-driven-migration-implementation.md#gate-7-prove-a-mover-across-the-tracks)) can share one test move.
:::

**Rollback.** Remove the automatic policy; Learn's checkboxes control whether assignments are removed. Keep the dynamic group that carried the access until the package has run clean for a full cycle *(design guidance)*.

## Step 5: Bind credentials to HR events {#step-5-bind-credentials-to-hr-events}

A PIV card without the binding to the account is a badge. The binding identifies one certificate, so a reissue changes it and the card management system has to rewrite it ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#binding-the-piv-certificate-to-the-entra-user)). Coverage and affinity are [ADM Gate 6](attribute-driven-migration-implementation.md#gate-6-piv-and-cac-binding)'s; this gate ties the credential's lifecycle to the person's.

**Prerequisites.** The issuing CAs' CRL sizes checked (plan task I1.6). ADM Gate 6's affinity decision.

**Steps.**

1. **Trust the issuing CAs, each with a CRL.** Without a configured CRL, Entra doesn't check revocation. A CRL must download within 10 seconds and stay under 20 MB for interactive sign-in in the commercial service (GCC) or 45 MB in Azure Government (GCC High); the service-side limits are 65 MB and 150 MB. If Entra can't download a configured CRL, CBA fails for that CA's certificates, so host CRLs on highly available endpoints; Learn recommends HTTP.[^hri-crl]
2. **Require phishing-resistant strength.** Raise PIV certificates to multifactor by issuer or policy OID and require the phishing-resistant authentication strength ([Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md#authentication-strengths)).
3. **Make issuance an HR or contractor event's output.** No card request without a joiner record and a sponsor; the card system writes the binding at issuance and removes it at revocation ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#the-contractor-piv-path)).
4. **End the bridge.** When the binding lands, the Temporary Access Pass from Gate 3 is no longer needed; record the proofing level as data ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#assurance-as-data)).
5. **Feed the card system's events back.** Termination, revocation, suspension and expiry, keyed on the enterprise person key. For contractors a termination or expiry ends the engagement; for employees it's credential drift, never a leaver ([Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md#contractor-leavers)).
6. **Handle the mover that reissues.** A legal name change rewrites the binding; a move that ends eligibility is a leaver for the credential ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#mover-usually-nothing-sometimes-a-reissue)).

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| IA-2(12) (acceptance of PIV credentials) and IA-5(2) (public key-based authentication), Moderate baseline[^hri-nist-mod] | The CBA configuration export: trusted CAs, CRL settings, binding rules, required affinity |
| CISA SCuBA MS.AAD.3.1v1 (phishing-resistant MFA for all users) and MS.AAD.3.6v1 (for highly privileged roles), BOD 25-01 required[^hri-bod] | The ScubaGear report; the authentication strength policy |
| FIPS 201-3: issuance only after a proper authority authorizes it; termination and reissuance rules ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#the-canonical-leaver-sequence)) | The card system's issuance and revocation records, joined to the HR or contractor event |
| NIST SP 800-63-4 (proofing and authentication assurance) | Proofing level and authenticator assurance as attributes, per person |

: Gate 5 requirements and evidence {.striped .hover}

**Government-cloud availability.** Certificate-based authentication and Conditional Access: available in Azure Government; commercial service in GCC. The CRL size limits differ by cloud (step 1).[^hri-feat][^hri-crl]

**Interim path.** After AD retires, who writes `certificateUserIds` for cloud-mastered users is an open pilot: Microsoft documents neither the permission a workload needs nor the write's behavior ([ADM Gate 6](attribute-driven-migration-implementation.md#gate-6-piv-and-cac-binding)). Until it closes, keep the binding in `altSecurityIdentities`, synced by Entra Connect, for every population still synced.

::: {.callout-important}
## Validate (G5 Credentials)
- **VK-PIV-01** reports pilot card holders with no binding or only low-affinity values, by account, never by value.
- No kit check reads the CBA configuration or the CRL. The evidence is the configuration export, each CA's CRL size and download time against the cloud's limits, and a revoked test certificate refused at sign-in after the next CRL publication.
- Gate owner: the CISO, with the PIV and credentialing office.
:::

**Rollback.** Required affinity back to its previous value; a CA exempted from CRL validation only while its CRL is fixed, with an end date. Binding values are restored from the card system, never edited in the directory.

## Step 6: Time separations and deprovisioning {#step-6-time-separations-and-deprovisioning}

The leaver blocks first, then revokes credentials, devices and access in parallel, reconciles, and disposes of the object last ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#the-canonical-leaver-sequence)). This gate configures that order and proves the timing.

**Prerequisites.** Gates 1, 3 and 5. The Intune and card-system custom task extensions built ([Book 19, Chapter 05](../b19-developer-workbook/05-lifecycle-workflows-custom-extensions.md); [examples/lifecycle-extensions](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/lifecycle-extensions)).

**Steps.**

1. **Order the leaver workflow as the sequence.** Disable and revoke refresh tokens first; then one custom task, **Launch and wait**, that starts the Intune retire or wipe and the card revocation and reports both; then the removals. Delete goes in a separate post-separation workflow ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#running-it-from-lifecycle-workflows)). A custom task extension's wait can be set from 30 minutes to 3 hours; past it the task fails.[^hri-limits][^hri-lcw-ext] Route that failure to a high-priority exception, not a retry loop.
2. **Time the leave date late in the day**, and size the tenant schedule so the block lands within the approved interval; the interval includes the schedule ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#triggers-and-schedule)).
3. **Coordinate the two writers.** The pipeline sends `active` false no later than the leaver workflow's first run, so a later re-send can't undo the disable ([pipeline guide, sequences](hcm-entra-implementation.md#the-sequences)).
4. **Build the emergency path.** Out-of-band block at once, then the on-demand workflow running the same sequence, never a shorter one; on-demand runs are a change, behind PIM approval ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#emergency-termination)).
5. **Catch late separations.** A separation entered more than three days after its effective date misses the scheduled trigger; report them and run them on demand ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#triggers-and-schedule)).
6. **Verify the block by reading it back.** A disabled account with unrevoked sessions, or a failed card revocation, is an incident. Privileged leavers need their own verified path, because the disable task doesn't support users with role assignments ([Appendix A, Partial leavers](../b03-hr-identity/appendix-a-lifecycle-rules.md#partial-leavers)).
7. **Dispose last, under the disposition rule.** Retire or wipe devices before deleting the user; for synced users the delete happens in AD ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#deletion)).
8. **Reach the other tracks.** The leaver hands sponsored service accounts and agents to the non-person track ([non-person guide, Step 6](non-person-identity-implementation.md#step-6-run-the-lifecycle); [Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#one-leaver-reaches-four-tracks)).
9. **Run the acceptance rows**: separation, leave without pay, cancelled separation, conversion ([Book 03, Appendix C](../b03-hr-identity/appendix-c-acceptance-and-cutover.md#acceptance)).

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| PS-4 (personnel termination): access disabled within the organization-defined period, authenticators revoked; AC-2(3) (disable accounts); both Moderate[^hri-nist-mod] | Separation-to-block and separation-to-revocation intervals per leaver; the workflow run, the Intune action records, the card system's revocation record and the CRL that published it ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#what-the-evidence-must-show)) |
| PS-7 for contractors | End-date-to-block intervals |
| FIPS 201-3: a card that can't be collected is terminated within 18 hours of notification ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#the-canonical-leaver-sequence)) | The notice timestamp and the revocation timestamp |
| AC-2(13) (disable accounts for high-risk individuals), Moderate[^hri-nist-mod] | The emergency path's runs, logged as changes, with the out-of-band actions |

: Gate 6 requirements and evidence {.striped .hover}

**Government-cloud availability.** Lifecycle Workflows and PIM: available in Azure Government; commercial service in GCC.[^hri-feat] Custom task extensions have no row of their own. A GCC tenant is a commercial Entra tenant, and an Azure Government subscription trusts only an Azure Government directory,[^hri-gov-identity] so the Logic App for a GCC tenant's extension most likely sits in a commercial Azure subscription linked to that tenant *(inference; see [What couldn't be verified](#what-couldnt-be-verified))*.

**Interim path.** Until the custom task extensions exist, the leaver runs its built-in tasks and a leaver checklist with a named owner per row covers the card, the devices and the other tracks; the separation-to-revocation interval measures how long it takes ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#one-leaver-reaches-four-tracks)).

::: {.callout-important}
## Validate (G6 Separation)
- **VK-HR-05** reports users whose leave date is in the past with no processing record: the late separations step 5 must have run on demand. **VK-HR-06** confirms execution limits on the leaver workflows.
- The leaver runs for a full pay-period cycle on the covered population: zero missed leavers, separation-to-block within the approved threshold, and every exception closed through an alternate path ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#phase-4-lifecycle-automation-and-attribute-derived-access)).
- Gate owner: security, which owns the leaver path end to end.
:::

**Rollback.** A cancelled separation re-enables from the corrected record, with evidence; manually granted access comes back only by request and review ([Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md#rescinded-offers-and-cancellations)). A deleted cloud user can be restored for 30 days ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#deletion)).

## Step 7: Keep the record true and file the evidence {#step-7-keep-the-record-true-and-file-the-evidence}

Attribute drift is ADM Gate 9's. This gate adds the lifecycle classes, the metrics and the evidence file.

**Prerequisites.** Gates 1 to 6 on the pilot. Logs leaving Entra ID.

**Steps.**

1. **Run the lifecycle drift classes**: missing identity, stale access, orphan account, unauthorized write (Gate 1's queries), credential drift and contractor credential drift ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory)). Send findings to the same queue as [ADM Gate 9](attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true).
2. **Fix at the source.** Each finding goes to the owner of the fact and comes back through the pipeline, never as a directory edit ([identity maintenance explainer](../explainers/identity-maintenance.md#the-fixes-that-still-happen)).
3. **Report the six metrics** on the continuous monitoring cadence, with thresholds the agency sets ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-measured-lifecycle)).
4. **Prove the sole source, then close the ticket path.** Seven days of provisioning logs against the directory audit log, per population ([Book 03, Appendix C](../b03-hr-identity/appendix-c-acceptance-and-cutover.md#proving-hr-is-the-sole-source)).
5. **Keep the evidence outside the directory**, for the records schedule's period, because the account is disposed of and the evidence has to outlive it ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

**Federal requirements and evidence.**

| Requirement | What the ISSO keeps |
|---|---|
| CA-7 (continuous monitoring: system-level metrics), Moderate[^hri-nist-mod] | The six metrics per reporting period, with thresholds |
| AU-6 and AU-11 (review and retention of audit records), SI-12 | The log export configuration; findings with closure at the source; retention set to the records schedule |
| BOD 25-01 continuous reporting ([Book 02, Appendix A](../b02-identity/appendix-a-federal-requirements-crosswalk.md#cisa-bod-25-01-and-the-scuba-baselines)) | ScubaGear results for the identity policies in Gates 4 and 5 |

: Gate 7 requirements and evidence {.striped .hover}

**Government-cloud availability.** Basic and advanced security and usage reports, and SIEM connectivity: available in Azure Government; commercial service in GCC.[^hri-feat]

**Interim path.** Before the SIEM takes identity logs, route them to a storage account from day one; logs that expired before export can't be recovered ([Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

::: {.callout-important}
## Validate (G7 Drift and evidence)
- On the drift cadence: **VK-HR-01** and **VK-HR-04** (uncorrelated accounts and duplicate keys), **VK-HR-03** (counts against HR), **VK-HR-07** (fill and value rules) and **VK-DG-05** (membership change over the threshold), with the [HCM correlation tool](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra#correlate-hr-with-the-directories) for record-by-record drift.
- No kit check reads credential drift or the metrics. The evidence is the card system and Intune reports joined on the person, and the metrics report.
- Gate owner: the CISO. Recurring.
:::

**Rollback.** None. This is the standing loop.

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **`memberOf` in an assignment rule** | From November 3, 2026, the policy is quarantined and stops adding and removing assignments[^hri-auto] | Learn's read-only scan; rebuild on coded slots (Gate 4) |
| **Overlapping automatic policies** | A user in two policies, or moving between them, can lose access[^hri-auto] | One automatic policy per package |
| **On-demand runs** | They ignore scope and execution limits ([Book 03, Chapter 08](../b03-hr-identity/08-joiner-mover-leaver.md#guardrails-at-agency-scale)) | PIM approval, a second person, logged as a change |
| **Late HR entry** | Past three days, the scheduled trigger skips the user | VK-HR-05; on-demand catch-up; HR timeliness as a control |
| **Two writers of account state** | A late `active` true undoes the workflow's disable | Gate 1's register; the pipeline sends false first |
| **The pass that never arrives** | The TAP task fails for a user with existing methods, sign-ins or role assignments[^hri-tap-task] | A separate rehire path; the help desk procedure as backstop |
| **Unreachable CRL** | CBA fails for every certificate from that CA[^hri-crl] | Highly available HTTP endpoints; monitor download time and size |
| **Deleting before retiring devices** | Device certificates stay valid on hardware not recovered ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md#device-certificates-intune-and-microsoft-cloud-pki)) | Dispose last; delete in a separate workflow |
| **Trusted contractor end dates** | A spreadsheet's end date nobody updates keeps access alive | The middleware's earliest-end rule; sponsor review with remove-on-no-response |
| **The workflow ceiling** | Learn gives 50 and 100 on two pages[^hri-lic][^hri-limits] | Budget to 50 |

: Dangers in HR-driven identity {.striped .hover}

## Evidence {#evidence}

Each gate's table names what the ISSO keeps. Together they make one file per population:

- the register with its lifecycle rows, the scope filter and the audit queries (G1);
- the source decisions, the authority-per-fact table, the reconciliation reports and the privacy determinations (G2);
- workflow definitions, versions and exported run history; the TAP policy (G3, G6);
- assignment policy exports, review results and transfer-to-review intervals (G4);
- the CBA configuration, CRL measurements and card-system records joined to events (G5);
- separation-to-block and separation-to-revocation intervals, exceptions and their closure (G6);
- drift findings with closure at the source, the six metrics and the sole-source proof (G7).

Book 03's [control support table](../b03-hr-identity/11-drift-metrics-and-evidence.md#control-support-nist-sp-800-53-rev.-5) says what each control still needs from the agency, and the companion guide's [federal requirements](attribute-driven-migration.md#federal-requirements) map the evidence across the four tracks. File every kit run with its date, tenant and check version.

## Rollback

| Gate | Rollback |
|---|---|
| G1 Writers | A signed register change; a removed permission restored by recorded change with an end date |
| G2 Sources | Pause the contractor app; contractors back on the exception path |
| G3 Joiners | Disable the workflow's schedule; interim path |
| G4 Access and movers | Remove the automatic policy; keep the dynamic group until the package runs clean |
| G5 Credentials | Required affinity back; time-boxed CRL exemption; bindings restored from the card system |
| G6 Separation | Re-derive from the corrected record; restore within 30 days |
| G7 Drift | Standing loop: fix at the source |

: Rollback by gate {.striped .hover}

## Checklist

- [ ] Lifecycle rows in the writer register; scope filter versioned; other write paths removed; audit queries saved (G1)
- [ ] Employee feed reading by published date; contractor source named, its leaver shipped first, sponsors recertified with remove-on-no-response (G2)
- [ ] Few workflows scoped by code, execution limits set, budget held to 50; TAP bridge; day-one readiness measured (G3)
- [ ] Department packages by automatic assignment; no `memberOf`; manager approval with fallback; residual review after a move (G4)
- [ ] CBA with a CRL for every issuing CA, sized to the cloud's limits; phishing-resistant strength; issuance and revocation from events (G5)
- [ ] Leaver blocks first, reconciles, disposes last; emergency and late-separation paths; a pay-period cycle with zero missed leavers (G6)
- [ ] Lifecycle drift classes in the queue; six metrics reported; sole-source proof; logs kept outside the directory (G7)

## What couldn't be verified {#what-couldnt-be-verified}

- **Temporary Access Pass in GCC High.** Learn's Azure Government availability table has no row for it, or for the Lifecycle Workflows task that issues it.
- **The workflow ceiling.** Learn's licensing page says 50 workflows; its service limits page says 100. The validation kit uses 100.
- **Where a GCC tenant's custom task extension can run.** No Learn page says whether the Logic App may sit in an Azure Government subscription. The guide's reading, a commercial subscription linked to the tenant, is an inference from the identity planning page.
- **A separate GCC table.** Learn lists Azure Government availability only; GCC availability here follows from GCC using the commercial Entra service, except Entra ID Governance, which Learn names for GCC directly.
- **The writer of `certificateUserIds` after AD**, for cloud-mastered users ([ADM Gate 6](attribute-driven-migration-implementation.md#gate-6-piv-and-cac-binding)).
- **The card system's event interface and the contractor PIV path**, pending proof ([Book 03, Chapter 12](../b03-hr-identity/12-execution-plan.md#open-verification-register)).
- **NIST control text.** Today's check confirmed that each control cited is in the Moderate baseline; the control text relies on Book 03's log.
- **Tenant behavior.** Nothing in this guide was run in a tenant; the kit checks are fixture-tested.

## Back to the books

[Book 03](../b03-hr-identity/index.md) · [Building Book 03's HR Pipeline](hcm-entra-implementation.md) · [Attribute-Driven Migration: An Implementation Guide](attribute-driven-migration-implementation.md) · [Attribute-Driven Migration guide](attribute-driven-migration.md#four-tracks) · [Identity Lifecycle & Provisioning plan](../../project-plans/identity-lifecycle.md) · [Contractors as Oracle Contingent Workers](../../evaluations/oracle-contingent-worker-contractor-source.md) · [Identity maintenance](../explainers/identity-maintenance.md) · [Book 04, Chapter 09](../b04-access/09-access-governance.md) · [Book 02, Appendix A](../b02-identity/appendix-a-federal-requirements-crosswalk.md) · [Non-person identity guide](non-person-identity-implementation.md) · [Building HR-Driven Identity](../../project-plans/developer-workbooks/hr-driven-identity/index.md) (the developer workbook)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/hr-driven-identity-implementation.md).

<!-- revisions:end -->

[^hri-feat]: Microsoft Learn, "Microsoft Entra feature availability" (Azure for US Government: certificate-based authentication, Conditional Access, dynamic groups, directory synchronization, access reviews, entitlement management, PIM, Lifecycle Workflows, basic and advanced reports and SIEM connectivity available; HR-driven provisioning partial; API-driven inbound provisioning and provisioning agent registration for a US Government tenant available; Entra ID Governance available in GCC, GCC High and DoD), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026).
[^hri-gov-identity]: Microsoft Learn, "Planning identity for Azure Government applications," Frequently asked questions ("Why does Office 365 GCC use Microsoft Entra Public?"; an Azure Government subscription can't be associated with a directory in Microsoft Entra Public), <https://learn.microsoft.com/azure/azure-government/documentation-government-plan-identity> (read November 1, 2026).
[^hri-lic]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals" (API-driven provisioning from P1; entitlement management, access reviews and Lifecycle Workflows need ID Governance for member users, some capabilities under P2; Lifecycle Workflows up to 50 workflows and 100 custom task extensions), <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (read November 1, 2026).
[^hri-limits]: Microsoft Learn, "Microsoft Entra ID Governance service limits," Lifecycle Workflows (100 workflows, 25 tasks per workflow, 100 custom task extensions, schedule 1 to 24 hours, 10 users per on-demand selection, custom task extension timeout 30 minutes to 3 hours, 5 administrative scopes per workflow) and Entitlement Management (15,000 assignments per automatic assignment policy), <https://learn.microsoft.com/entra/id-governance/governance-service-limits> (read November 1, 2026).
[^hri-auto]: Microsoft Learn, "Configure an automatic assignment policy for an access package in entitlement management" (rule on supported and extension attributes; assignments added and removed automatically; one policy per package unless scopes never overlap; hidden dynamic group per policy; grace period after leaving scope; at most 15,000 identities; ID Governance or Entra Suite; Identity Governance Administrator, not catalog owners or access package managers; `memberOf` policies quarantined from November 3, 2026, with a read-only scan), <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-auto-assignment-policy> (read November 1, 2026).
[^hri-ar-ap]: Microsoft Learn, "Create an access review of an access package in entitlement management" (frequency annually, bi-annually, quarterly or monthly; Manager as reviewer with a fallback; if reviewers don't respond: no change, remove access or take recommendations; ID Governance licenses), <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-reviews-create> (read November 1, 2026).
[^hri-tap-task]: Microsoft Learn, "Lifecycle Workflow built-in tasks," "Generate Temporary Access Pass and send via email to user's manager" (hire date as the pass's start time; manager and manager's mail required; TAP policy enabled; the user must have no other authentication methods, sign-ins or Entra role assignments), <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-tasks> (read November 1, 2026).
[^hri-tap]: Microsoft Learn, "Configure Temporary Access Pass to register passwordless authentication methods," "Enable the Temporary Access Pass policy" (lifetime 10 minutes to 43,200 minutes; one-time use enforceable for the tenant), <https://learn.microsoft.com/entra/identity/authentication/howto-authentication-temporary-access-pass> (read November 1, 2026).
[^hri-lcw-time]: Microsoft Learn, "How to synchronize attributes for Lifecycle workflows," "Importance of time" (hire time early in the day, leave time late; the tenant schedule, default 3 hours, can delay a run; 24-hour maximum TAP lifetime for new hires), <https://learn.microsoft.com/entra/id-governance/how-to-lifecycle-workflow-sync-attributes> (read November 1, 2026).
[^hri-lcw-api]: Microsoft Learn, "Overview of Lifecycle Workflows APIs" (workflow versions instead of in-place updates; one tenant-wide schedule, default every three hours, settable from 1 to 24 hours), <https://learn.microsoft.com/graph/api/resources/identitygovernance-lifecycleworkflows-overview?view=graph-rest-1.0> (read November 1, 2026).
[^hri-lcw-ext]: Microsoft Learn, "Lifecycle Workflows custom task extension" (custom task extensions call Azure Logic Apps; a consumption Logic App; Logic App Contributor, Contributor or Owner, not Logic App Operator; launch and wait fails when no response arrives in the configured time; response authorized by the system-assigned managed identity by default), <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-extensibility> (read November 1, 2026).
[^hri-crl]: Microsoft Learn, "Microsoft Entra certificate-based authentication Certificate Revocation List (CRL)" (no CRL configured, no revocation check; one CRL endpoint, HTTP recommended; interactive limit 20 MB public and 45 MB Azure US Government, 10-second download; service limits 65 MB and 150 MB; CBA fails if a configured CRL can't be downloaded; Authentication Policy Administrator configures CRLs), <https://learn.microsoft.com/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> (read November 1, 2026).
[^hri-au-dyn]: Microsoft Learn, "Manage users or devices for an administrative unit with rules for dynamic membership groups," Prerequisites ("Global Azure cloud (not available in specialized clouds, such as Azure Government...)"), <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> (read November 1, 2026).
[^hri-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, section A, Identity (actions: centralized identity management; phishing-resistant MFA for agency staff, contractors and partners; enterprise identity systems draw on human resources, contract management and personnel security systems), pages 5 and 6, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (read November 1, 2026).
[^hri-bod]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," Microsoft Entra ID policies MS.AAD.3.1v1, MS.AAD.3.6v1 and MS.AAD.7.5v1, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (read November 1, 2026).
[^hri-nist-mod]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, OSCAL profile (AC-2, AC-2(1), AC-2(3), AC-2(13), AC-5, AC-6, AU-6, AU-11, CA-7, IA-2(12), IA-4, IA-4(4), IA-5(2), PS-4, PS-5, PS-7 and SI-12 all included), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (read November 1, 2026). Control text: SP 800-53 Rev. 5, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>, as checked for [Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#control-support-nist-sp-800-53-rev.-5).
