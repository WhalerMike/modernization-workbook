---
title: "Chapter 06 — Joiner, Mover, Leaver"
description: "The five lifecycle events and the identity actions each one causes; who creates accounts (provisioning) and who acts on them (Lifecycle Workflows); triggers, schedules and built-in tasks; emergency termination, rehire, conversion and deletion."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 6
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 06 — Joiner, Mover, Leaver

*Nobody requests an account for a new hire. The hire causes it.*

::: {.callout-note}
## In this chapter
The five events a worker record goes through and what each one causes in the directory. The division of labor between inbound provisioning and Lifecycle Workflows. Triggers, schedules and built-in tasks. Emergency termination, rehire, conversion and deletion. The leaver sequence itself, including credentials, is in Chapter 07.
:::

## The lifecycle is an event stream

Joiner, mover and leaver, plus the two transitions estates forget until they hurt, **rehire** and **conversion** (contractor to employee), are the five state changes a worker record goes through. Each is recorded in the HR system as an effective-dated event, and each maps to a fixed set of identity actions:

| HR event | Recorded fact | Identity actions derived from it |
|---|---|---|
| **Joiner** | Future-dated hire: worker record and assignment created | Account created ahead of the start date by provisioning; licenses and baseline access derived from attributes; credential enrollment queued for day one (Chapter 07) |
| **Mover** | Assignment change: new position, organization, location or supervisor | Attributes re-stamped; dynamic memberships re-evaluated, so the old organization's access leaves as the new one's arrives; access review on what remains (PS-5); approvals follow the new supervisor of record |
| **Leaver** | Effective-dated separation | The leaver sequence of Chapter 07: immediately block logical access, then reconcile credentials, devices, entitlements, application access, and later disposition — one workflow, one evidence trail (PS-4) |
| **Rehire** | Returning worker matched to the prior worker record | Prior identifier re-linked; the person resumes an identity rather than getting a second one (IA-4) |
| **Conversion** | Worker type changes; affiliation continuous | Same identifier, access re-derived from the new worker type; no duplicate identity |

: The five lifecycle events and the identity actions they cause {.striped .hover}

The property that matters is the direction of causation. Nobody *remembers* to disable a leaver; the separation record causes the disablement, on the effective date. Tickets survive only for exceptions, and every exception is visible as a deviation from a computed baseline.

## Who does what: provisioning and Lifecycle Workflows

Two Microsoft services share the work, and the boundary between them is easy to blur:

- **Inbound provisioning creates and updates accounts.** It creates the user, keeps attributes current, and enables or disables the account from the HR status (Chapter 04).[^c06-lcw-tasks]
- **Lifecycle Workflows act on users who already exist.** Microsoft describes them as automating the routine processes *around* HR-driven provisioning: while HR provisioning manages creation and attribute updates, workflows run additional tasks.[^c06-lcw-tasks] A workflow is a set of tasks plus execution conditions: a scope (who) and a trigger (when).[^c06-lcw-overview]

A workflow never creates the account. A page that says "Lifecycle Workflows provision the new hire" has the boundary wrong.

### Triggers and schedule

Lifecycle Workflows support four scheduled trigger types — time-based attribute, attribute change, group membership change, and sign-in inactivity — plus on-demand only.[^c06-lcw-conditions] The time-based trigger reads `employeeHireDate`, `employeeLeaveDateTime` or `createdDateTime`, with an offset of up to 365 days before or after.[^c06-lcw-conditions] Scheduled workflows run every 3 hours by default; the interval can be set from 1 to 24 hours.[^c06-lcw-schedule] Just before processing, the engine re-evaluates each user and skips anyone who no longer meets the conditions.[^c06-lcw-conditions]

That schedule matters for evidence: a leaver workflow keyed to `employeeLeaveDateTime` runs at the first scheduled pass after the date, so the separation-to-revocation interval (Chapter 09) includes the schedule interval. Set the leaver workflow's interval with that in mind.

### Built-in tasks by stage

| Stage | Built-in tasks (selection) |
|---|---|
| Joiner | Send welcome email; generate a Temporary Access Pass and send it to the manager; request an access package assignment; assign licenses; add to groups and Teams; enable the account |
| Mover | Notify the manager of the move; request or remove access package assignments; add to or remove from selected groups; update user attributes |
| Leaver | Disable the account; remove from all groups and all Teams; remove all access package assignments and cancel pending requests; remove licenses; **revoke all refresh tokens**; delete the user |
| Any stage | Run a custom task extension (a call out to an Azure Logic App) |

: Lifecycle Workflows built-in tasks by stage[^c06-lcw-tasks] {.striped .hover}

No built-in task revokes a certificate or a PIV credential, or retires a device. Those steps go through a custom task extension or a separate process (Chapter 07).

## Joiner

Provisioning creates the account ahead of the start date from the future-dated hire. A pre-hire workflow runs a set number of days before `employeeHireDate` (for example, generate a Temporary Access Pass and send it to the manager), and a day-one workflow runs on the date (enable the account, assign licenses, add baseline groups). Microsoft recommends a 24-hour maximum lifetime for a Temporary Access Pass sent to a new hire, so that it hasn't expired in another time zone.[^c06-lcw-sync] Day-one readiness (account, licenses and baseline access in place at start of day) is a metric, not a hope (Chapter 09).

## Mover

The mover event re-stamps attributes through provisioning; dynamic memberships re-evaluate on their own (Chapter 08). An attribute-change workflow scoped to `department` or the organization code can notify the manager and start a review of what's left. Old access that came from a dynamic group goes away when the rule stops matching; old access that came from an access package or a direct assignment doesn't, which is why the review on the residual is a control, not a courtesy.

## Leaver

The separation record sets `employeeLeaveDateTime` through provisioning, and the leaver workflows run against it: a pre-separation workflow (notify the manager), a last-day workflow, and a post-separation workflow that deletes the user after the retention period. The order of the steps, and the credential and device steps that the built-in tasks don't cover, are Chapter 07's subject.

### Emergency termination

Some separations can't wait for the schedule. Microsoft's **Real-time employee termination** template is an on-demand workflow; its tutorial removes the user from all groups and all Teams and deletes the account.[^c06-lcw-offboard-portal] For an agency, use the template as the starting point for an on-demand workflow that runs the *same* sequence as the scheduled leaver workflow (Chapter 07), not a shorter one. The trigger is human; the execution and the evidence are identical.

## Rehire and conversion

- **Rehire.** The returning worker is matched to the prior worker record by person number, and the provisioning match on `employeeId` re-links the existing account if it still exists. If the account was deleted, the new account carries the same `employeeId`; the identifier history lives in the HR record, not the directory.
- **Conversion.** A contractor-to-employee change is an attribute change on the same person, not a leaver plus a joiner. `employeeType` and the worker-type code change; access re-derives; the identifier stays.

## Deletion

Disable on the separation date; delete or anonymize only under the approved account-disposition rule; retain each category of HR record, authorization record, audit evidence, and security log under its applicable schedule and legal-hold requirements, from a post-separation workflow. A deleted Entra user can be restored for 30 days, after which it is permanently deleted;[^c06-deleted-users] retention for audit and records purposes has to be met by the logs and the HR record, not by keeping the account.


::: {.callout-tip}
## Continue the series
[← Previous: Chapter 05 — The Canonical Workforce Identity Model](05-canonical-attribute-schema.md) · [Index](index.md) · [Next: Chapter 07 — Credentials and Certificates Across Joiner, Mover, Leaver →](07-credentials-and-certificates.md)
:::

[^c06-lcw-tasks]: Microsoft Learn, "Lifecycle Workflows tasks and definitions," <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-tasks> (accessed Oct 19, 2026).
[^c06-lcw-overview]: Microsoft Learn, "What are lifecycle workflows?," <https://learn.microsoft.com/en-us/entra/id-governance/what-are-lifecycle-workflows> (accessed Oct 19, 2026).
[^c06-lcw-conditions]: Microsoft Learn, "Lifecycle workflow execution conditions and scheduling," <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-execution-conditions> (accessed Oct 19, 2026).
[^c06-lcw-schedule]: Microsoft Learn, "Customize a workflow schedule," <https://learn.microsoft.com/en-us/entra/id-governance/customize-workflow-schedule> (accessed Oct 19, 2026).
[^c06-lcw-sync]: Microsoft Learn, "How to synchronize attributes for Lifecycle Workflows," <https://learn.microsoft.com/en-us/entra/id-governance/how-to-lifecycle-workflow-sync-attributes> (accessed Oct 19, 2026).
[^c06-lcw-offboard-portal]: Microsoft Learn, "Execute employee termination tasks by using lifecycle workflows" (the Real-time employee termination template), <https://learn.microsoft.com/en-us/entra/id-governance/tutorial-offboard-custom-workflow-portal> (accessed Oct 19, 2026).
[^c06-deleted-users]: Microsoft Learn, "Restore or remove a recently deleted user," <https://learn.microsoft.com/en-us/entra/fundamentals/users-restore> (accessed Oct 19, 2026).
