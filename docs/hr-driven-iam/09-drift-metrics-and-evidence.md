---
title: "Chapter 09 — Drift, Metrics and Evidence"
description: "The lifecycle metrics an event-driven pipeline makes measurable, the classes of drift between HR and the directory and how to detect each one, the evidence each lifecycle event leaves, and what the architecture contributes to NIST SP 800-53 Rev. 5 AC-2, AC-2(1), PS-4, PS-5, IA-4 and SI-12 — and what the agency still has to supply."
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
Six lifecycle metrics. The drift classes between the HR record and the directory, and the signal for each. What evidence each event leaves. The control-support mapping for AC-2, PS-4, PS-5, IA-4 and SI-12.
:::

## The measured lifecycle

An event-driven lifecycle is also a measured one: every interval from event to action is a number.

| Metric | Definition | What it evidences |
|---|---|---|
| Separation-to-block interval | HR effective date and time → account disabled and sessions revoked (Chapter 07, steps 1–2) | PS-4: logical access disabled within the defined period, continuously |
| Separation-to-revocation interval | HR effective date and time → last confirmed revocation in the leaver sequence (Chapter 07, step 4) | PS-4: credentials and access revoked, with exceptions and how they closed |
| Transfer-to-review interval | Transfer effective date → completion of the review on residual access | PS-5: review initiated within the defined period |
| Joiner readiness rate | Share of new hires whose account, licenses and baseline access exist at start of day one | AC-2 automation working in the creation direction |
| Correlation coverage | Share of enabled accounts that resolve to a current worker record by the correlation key (Chapter 03) | The orphan population, as a query instead of a hunt |
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

Keep the evidence outside the directory, in the agency's log store, for the retention period the records schedule sets: the account itself is disposed of under the account-disposition rule (Chapter 06), and the evidence has to outlive it.

## Control support: NIST SP 800-53 Rev. 5

The architecture implements mechanisms and produces evidence for these controls. It doesn't satisfy any of them on its own: each also needs agency policy, organization-defined parameters, procedures, and assessment. The last column is what the agency still has to supply.

| Control | Architecture contribution | Evidence produced | Residual requirements |
|---|---|---|---|
| **AC-2** Account Management | Every account traces to a worker record; creation, change and disablement follow hire, transfer and separation events; authorizations resolve to attribute, rule and record | Provenance records, provisioning logs, rule definitions, access-review decisions | Account types and conditions of membership; account managers; the organization-defined periods; accounts outside the HR population (non-person, emergency, shared) |
| **AC-2(1)** Automated System Account Management | Provisioning and Lifecycle Workflows run the account lifecycle from effective-dated HR events | Workflow run history, per task; provisioning logs | Automation for applications not integrated with enterprise identity services |
| **PS-4** Personnel Termination | The separation record starts the leaver sequence on the effective date; the block and the revocations are timestamped and reconciled | Separation-to-block and separation-to-revocation intervals; CMS and Intune records; exceptions | The organization-defined time period; exit interviews, property return, and notification of personnel; separations HR records late |
| **PS-5** Personnel Transfer | The mover event re-derives access and starts a review of residual access | Transfer-to-review interval; review decisions | Review of logical and physical access needs; the organization-defined actions and time period |
| **IA-4** Identifier Management | One enterprise person key with mapped source, affiliation and directory keys, preserved across rehire and conversion (Chapter 03); worker type available as the IA-4(4) status characteristic | Correlation coverage; identifier mapping records | The identifier decision; authorization to assign identifiers; the reuse-prevention period; identifiers for non-person entities |
| **SI-12** Information Management and Retention | Lineage for governed identity facts, from the HR record through middleware provenance to each consumer | Provenance records retained in the agency's log store | Records schedules, legal holds, and disposition for each category of record; privacy requirements for workforce data |

: What the architecture contributes to account-management and personnel-security controls {.striped .hover}

The agency's full requirements mapping should separate binding authorities (OMB M-19-17, FIPS 201-3, the agency's own policy) from implementation guidance (the FICAM Identity Lifecycle Management Playbook, CISA's Zero Trust Maturity Model), and record for each control the organization-defined parameters, inherited controls, residual procedures, evidence, and validation status. The compliance treatment of the same controls is in [Federal Compliance Vol I Book 04](../compliance/Vol_I_Book_04_HRIT_Identity_Org_SSOT.md).

::: {.callout-tip}
## Continue the series
[← Previous: Chapter 08 — From Attributes to Access](08-from-attributes-to-access.md) · [Index](index.md) · [Next: Chapter 10 — Execution Plan →](10-execution-plan.md)
:::
