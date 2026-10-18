---
title: "Chapter 09 — Drift, Metrics and Evidence"
description: "The lifecycle metrics an event-driven pipeline makes measurable, the classes of drift between HR and the directory and how to detect each one, the evidence each lifecycle event leaves, and how the architecture closes NIST SP 800-53 Rev 5 AC-2, AC-2(1), PS-4, PS-5, IA-4 and SI-12."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 9
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 09 — Drift, Metrics and Evidence

*An architecture that can't measure its own revocation latency is asserting PS-4 on faith.*

::: {.callout-note}
## In this chapter
Five lifecycle metrics. The drift classes between the HR record and the directory, and the signal for each. What evidence each event leaves. The control-closure argument for AC-2, PS-4, PS-5, IA-4 and SI-12.
:::

## The measured lifecycle

An event-driven lifecycle is also a measured one: every interval from event to action is a number.

| Metric | Definition | What it evidences |
|---|---|---|
| Separation-to-revocation interval | HR effective date and time → last step of the leaver sequence (Chapter 07) | PS-4: access disabled within the defined period, continuously |
| Transfer-to-review interval | Transfer effective date → completion of the review on residual access | PS-5: review initiated within the defined period |
| Joiner readiness rate | Share of new hires whose account, licenses and baseline access exist at start of day one | AC-2 automation working in the creation direction |
| Correlation coverage | Share of enabled accounts that resolve to a current worker record by `employeeId` | The orphan population, as a query instead of a hunt |
| Derivation purity | Share of access-granting memberships computed by rule rather than assigned by hand | How much of the estate still runs on fragments |

: Lifecycle metrics {.striped .hover}

None of these numbers exists in a ticket-driven estate, because the events they measure aren't recorded as events. Two inputs shape the first metric and belong in its definition: the Lifecycle Workflows schedule interval (Chapter 06) and the CRL publication interval of the PIV issuing CA (Chapter 07).

## Drift between HR and the directory

Drift is any difference between what the HR record says and what the directory holds. Each class has a detection signal and a default severity:

| Drift class | Example | Detection signal | Severity |
|---|---|---|---|
| Missing identity | A worker record with no account after a provisioning cycle | Set difference: active HR records without a matching `employeeId` | High |
| Stale access | An enabled account for a separated worker | Same `employeeId`: terminated in HR, enabled in Entra or AD | High |
| Orphan account | An enabled account that matches no worker record | Enabled accounts with no or unknown `employeeId` | High |
| Attribute drift | A department, code or manager value that differs from HR | Field-by-field comparison of the canonical schema (Chapter 05) | Medium |
| Unauthorized write | A write to an HR-mastered attribute by a principal other than the provisioning service | Entra audit log and AD change auditing, filtered on the attributes of Chapter 05 and `certificateUserIds` / `altSecurityIdentities` | High |
| Credential drift | A valid PIV binding, derived credential or device certificate for a separated worker | CMS status and Intune certificate reports joined on the worker | High |
| Schema drift | A record that fails validation in the middleware | The middleware's validation output (Chapter 04) | Medium |

: Drift classes and how to detect them {.striped .hover}

The provisioning logs are the first source for most of these: the API client already reads them for each record's result (Chapter 04). The rest are joins between the HR extract, the directory and the CMS, on the one identifier they share.

In the first month of a new pipeline, expect a burst of high-severity findings: leavers the old manual process hadn't caught up with, and orphan accounts from earlier connectors that the canonical pipeline can now see. That burst is the measurement working, not the pipeline failing.

## The evidence each event leaves

| Event | Evidence |
|---|---|
| Any HR event | The middleware's provenance record: source event ID, payload hash, derivation inputs, outcome (Chapter 04) |
| Provisioning | The provisioning log entry for the record |
| Joiner, mover, leaver | Lifecycle Workflows run history, per task |
| Leaver credentials | Intune device action records; the CMS revocation record and the CRL that published it (Chapter 07) |
| Access | Group membership changes and the rule that produced them; access-review decisions |

: Evidence by event {.striped .hover}

Keep the evidence outside the directory, in the agency's log store, for the retention period the records schedule sets: the account itself is deleted after retention (Chapter 06), and the evidence has to outlive it.

## Control closure: NIST SP 800-53 Rev 5

| Control | Without this architecture | With it | Why nothing else closes it |
|---|---|---|---|
| **AC-2** Account Management | Accounts created, changed and disabled by ticket; authorizations undocumented or encoded in group names; alignment with personnel processes exists as a memo | Every account traces to a worker record; creation, change and disablement follow hire, transfer and separation events; authorizations resolve to attribute, rule and record | Alignment with personnel processes presumes a machine-readable personnel record to align to. Employment facts originate in HR; nothing downstream can generate them, only copy them late |
| **AC-2(1)** Automated System Account Management | No automation, or automation wired to the directory, which automates stale data | Provisioning and Lifecycle Workflows run the account lifecycle from effective-dated HR events, with provenance per action | Automation is as correct as its input. The only authoritative input for existence, status and placement is the system of record |
| **PS-4** Personnel Termination | Termination by email and checklist; access removed days or weeks late, system by system | The separation record starts the leaver sequence on the effective date, with a timestamp per step; the separation-to-revocation interval is a reported metric | The clock starts at an event only HR records. Termination isn't visible on the network, and an absence of sign-ins looks like leave |
| **PS-5** Personnel Transfer | Transfers invisible to the directory; access accumulates across reassignments | The mover event re-derives access and starts a review of the residual within the defined period | The formal transfer action is an HR record. To the directory, the transferred person is the same account on the same laptop |
| **IA-4** Identifier Management | Identifiers minted per system; conversions and rehires create duplicates; reuse prevention unenforceable | One identifier per person from the worker record, carried by every account and preserved across rehire and conversion; worker type available as the IA-4(4) status characteristic | Non-reuse and rehire correlation need durable memory of persons. Directories track accounts and forget them at deletion |
| **SI-12** Information Management and Retention | The same fact in five stores with five values and no lineage | One authoritative source per data type, with lineage from the HR record through middleware provenance to each consumer | Lineage can't be reconstructed from copies; it has to be emitted where the data originates and flows |

: How the architecture closes the account-management controls {.striped .hover}

The full requirements mapping, including OMB M-19-17, the FICAM ILM Playbook and CISA's Zero Trust Maturity Model, is Appendix A. The compliance treatment of the same controls is in [Federal Compliance Vol I Book 04](../compliance/Vol_I_Book_04_HRIT_Identity_Org_SSOT.md).

::: {.callout-tip}
## Continue the series
[← Previous: Chapter 08 — From Attributes to Access](08-from-attributes-to-access.md) · [Index](index.md) · [Next: Chapter 10 — Execution Plan →](10-execution-plan.md)
:::
