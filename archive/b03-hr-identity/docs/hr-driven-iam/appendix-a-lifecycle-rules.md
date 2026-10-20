---
title: "Appendix A — Lifecycle Rules"
description: "The rules that keep HR-driven lifecycle automation safe: scope, leave versus leaver, event precedence, rescinded offers, cancellations, partial leavers, the quarantine contract, manager links, rehire and conversion."
doc-type: hr-driven-iam-chapter
audience: [Technical, Customer]
family: hr-driven-iam
series-order: 20
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Appendix A — Lifecycle Rules

*Automation is only as safe as the rules for the cases nobody planned for.*

::: {.callout-note}
## In this appendix
Which records are in scope. Why leave is not a leaver. What wins when two events land together. Rescinded offers, cancellations and partial leavers. The quarantine contract. Manager links, rehire and conversion.
:::

## Scope

A scope filter decides which HR records provision at all. Write it down, version it, and treat a change to it as a change to access policy:

- **Included:** covered worker types in an active, pre-hire or leave status, within a lookahead limit for future-dated hires.
- **Excluded:** test and training records, historical records, populations without an approved lifecycle owner, and named individuals on a governed exclusion list with a reason and an expiry.
- **Every exclusion leaves evidence:** the record, the rule that excluded it, and the version of the filter in force. A record that silently fails to provision is a missing identity (Chapter 09).
- **The directory-side filter matches the middleware filter.** If Entra provisioning scoping and the middleware disagree, the difference is drift.

## Leave is not a leaver

Furlough, leave without pay, suspension and similar nonpay or nonduty statuses (the 4xx nature-of-action family, Chapter 06) keep the person. The account stays, a status is stamped, and policy — Conditional Access, access packages — restricts what it can do. Return to duty (the 2xx family) lifts the restrictions. Details and secondments are movers, not leavers. Treating any of these as a separation locks out people who are still employed and destroys their access history.

## Precedence

When two personnel actions for one person land in the same processing cycle, order them by effective date and then apply these rules:

![Event precedence: a separation wins; a worker-type change is applied before a mover; nonpay status restricts but never disables as a leaver; corrections and cancellations re-derive from the corrected record.](../images/diagrams/hr-driven-iam/svg/appa-event-precedence.svg){fig-alt="A vertical sequence of five boxes. Events for one person in one cycle, ordered by effective date, then by the rules below. Rule 1, red: separation present? The leaver wins; pending mover and conversion changes are dropped and logged. Rule 2, blue: worker type changed? Apply the conversion first, then evaluate the mover. Rule 3, amber: nonpay or nonduty status? Restrict; never disable as a leaver. Rule 4, violet: correction or cancellation? Re-derive from the corrected record; reverse with evidence."}

## Rescinded offers and cancellations

- **A rescinded offer cleans up.** An account created before day one for a hire that never happens is disabled and disposed of on a short retention, with the cancellation recorded as its reason.
- **A cancelled action reverses with evidence.** A cancellation or correction (nature-of-action 001/002) re-derives the person's state from the corrected record. A cancelled separation re-enables what the separation disabled; it does not restore manually granted access without review.

## Partial leavers

A leaver whose sign-in is disabled but whose sessions were not revoked — or whose PIV revocation failed — is a security incident, not a backlog item. The leaver run records every step; a rerun resumes from the first incomplete step; and the block steps (disable, revoke sessions) are verified by reading the account back, not assumed from a successful call (Chapter 07).

## The quarantine contract

Records that fail validation, or actions that fail permanently, go to a quarantine with a defined contract:

- every entry carries a failure reason, an unchanged copy of the HR record, and the attempted payload;
- nothing in quarantine resolves itself — a person decides, and the decision is recorded;
- each failure class has a service level and an escalation path, with separation-related failures at the top;
- a resolved entry is re-injected through the normal path, never applied by hand to the directory;
- "won't fix" is an audited decision with an owner and a reason.

## Manager links

The `manager` relationship carries approvals, reviews and org charts (Chapter 08), so its integrity rules are explicit:

- an unresolved manager reference never blocks a joiner — the account is created and the link is resolved when the supervisor's record arrives;
- a manager reference that points at a separated person is a finding;
- when a supervisor separates, their direct reports are handed back to HR for reassignment. HR, not IT, writes the new supervisor.

## Rehire and conversion

- **Rehire** re-links the returning person to their prior identity through the enterprise person key (Chapter 03). Manually granted access is not restored; it is requested again and reviewed.
- **Conversion** keeps the person and the key and re-derives every attribute from the new worker type. Manually assigned access tied to the old worker type is removed, privileged roles are reviewed, and a conversion from employee to contractor is treated as a risk case with a mandatory review.

::: {.callout-tip}
## Continue the series
[← Previous: Chapter 11 — Reference Deployment](11-reference-deployment.md) · [Index](index.md) · [Next: Appendix B — Security and Privacy Assessment →](appendix-b-security-and-privacy.md)
:::
