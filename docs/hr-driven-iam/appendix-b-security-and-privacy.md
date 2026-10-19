---
title: "Appendix B — Security and Privacy Assessment"
description: "The data-flow security and privacy assessment for HR-driven identity: routine use and the PIA, attribute minimization, protecting every leg, service identities without secrets, least privilege, and what the logs may hold."
doc-type: hr-driven-iam-chapter
audience: [Technical, Customer]
family: hr-driven-iam
series-order: 21
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Appendix B — Security and Privacy Assessment

*Moving personnel data into a directory is a disclosure. Treat it like one.*

::: {.callout-note}
## In this appendix
The privacy basis for the feed. What to minimize. How each leg is protected. How the service authenticates and what it may never hold. What the logs may contain. The ISSO's review checklist.
:::

![Protecting the data flow: Core HCM sends only what identity decisions read, over TLS under a routine use; the middleware authenticates without secrets and writes with least privilege; operational logs carry the person key and a payload hash, and full payloads go only to an access-controlled audit store.](../images/diagrams/hr-driven-iam/svg/appb-data-flow-protection.svg){fig-alt="Left to right: an amber Core HCM box (system of records under the Privacy Act) connects with a line labelled TLS and routine use to a blue middleware-in-boundary box (managed identity or certificate; no client secrets), which connects with a line labelled TLS and least privilege to a blue Entra ID and AD box (only the attributes a decision reads). Dashed lines from the middleware go to an operational logs box (person key and payload hash only) and a violet audit store box (full payloads, access-controlled, retained by schedule)."}

## The privacy basis

- **Routine use.** The HR system of record is a Privacy Act system of records. Confirm the routine-use basis for disclosure to identity services under the governing system-of-records notices — for general personnel records, OPM/GOVT-1, plus the agency's own — before any attribute flows.
- **Privacy impact assessment.** Update the PIA for the new flow: what moves, where it lands, who can read it, how long it is kept, and which downstream services consume it.
- **Interconnection terms.** Where the HR platform is operated by another agency or a provider, the data-exchange terms cover the identity feed explicitly.

## Minimization

- Send only the attributes an identity decision reads (Chapter 05). If no rule, workflow or required directory field reads it, it doesn't move.
- Prefer codes to narrative: an organization code, not a reorganization memo; a worker-type code, not an appointment description.
- The SSN never moves. The layered identifiers of Chapter 03 exist so that correlation never needs it.
- Writeback to HR, if used, carries only identity-platform values such as work email — never an HR-mastered fact.

## Protecting every leg

| Leg | Protection |
|---|---|
| Core HCM to middleware | TLS; the platform's own authentication; the extract or feed scoped to covered populations |
| Middleware at rest | In the agency's authorization boundary; no PII on workstations, in source repositories or in off-boundary backups |
| Middleware to Entra ID | TLS to Microsoft Graph; a dedicated provisioning app per source |
| Provisioning agent to Active Directory | Outbound-only agent on hardened servers; a group managed service account with rights scoped to the target OUs |
| Logs and evidence | Operational logs hold the person key and a payload hash; full payloads go only to an access-controlled audit store, retained by schedule |

: Protecting each leg of the flow {.striped .hover}

## Service identity and privilege

- **No client secrets.** The middleware authenticates with a managed identity or a certificate, with rotation owned and scheduled.
- **Least privilege.** Grant only the provisioning upload permission and provisioning-log read (Chapter 04). The service never holds tenant-wide user or directory write permissions, and it never deletes users — disposal belongs to the post-separation workflow.
- **Conditional Access** applies to the service principal where supported: expected locations, and alerting on use from anywhere else.
- **Quarterly review** of the service principal's permissions and credentials, recorded as evidence.

## A pause switch

Mis-provisioning at scale — a bad mapping, a reorganization file loaded twice — can disable or re-scope thousands of accounts in one cycle. Keep a documented pause: stop the provisioning job, quarantine the batch, and resume only after review. Detect it, too: a delta far larger than normal for a cycle is held for confirmation before it applies.

## ISSO review checklist

- Routine use confirmed; PIA updated; interconnection terms cover the feed.
- Attribute set minimized and documented against the crosswalk.
- Every leg encrypted; PII absent from operational logs, repositories and workstations.
- Service identities secretless, least-privileged and reviewed.
- Pause and large-delta controls tested.
- Evidence of all of the above retained with the phase-gate record (Chapter 10).

::: {.callout-tip}
## Continue the series
[← Previous: Appendix A — Lifecycle Rules](appendix-a-lifecycle-rules.md) · [Index](index.md) · [Next: Appendix C — Acceptance and Cutover →](appendix-c-acceptance-and-cutover.md)
:::
