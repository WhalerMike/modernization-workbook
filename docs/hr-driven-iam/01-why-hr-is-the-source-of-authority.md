---
title: "Chapter 01 — Why HR Is the Source of Authority"
description: "Fragmented identity truth, the orphaned account as its structural output, the federal frames that require a designated source, why the usual patches fail, and the division of labor between what HR provides and what identity architecture must add."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
aliases:
  - /docs/architecture/hrit-identity-organizational-ssot.html
---

# Chapter 01 — Why HR Is the Source of Authority

*A token proves that an assertion was signed. It can't prove the assertion describes a real, current employee with a real, current role.*

::: {.callout-note}
## In this chapter
Where identity truth lives today and why it contradicts itself. Why orphaned accounts are the guaranteed output of that design rather than an operational lapse. The federal frames that require a designated source. Why cleanup, directory mastery, and reviews can't substitute for one. What HR provides and what identity architecture has to add.
:::

## What the claims in a token assert

An access token carries claims: an identifier, group memberships, role assignments. Those claims are projections of upstream facts. This person is employed; this person holds this position; this person reports to this supervisor; this person's affiliation ended on this date. If the upstream facts are stale, scattered, or unrecorded, the whole cryptographic apparatus notarizes fiction.

## The fragmented truth problem

### Where identity truth lives today

Ask a federal estate three questions — *who works here, what do they do, and who do they report to* — and no single system answers. The answers are distributed across:

- **Regional Active Directory OU trees**, each built when compute was regional, each drifted through decades of reorganizations, ad-hoc container moves, and administrator judgment calls. The OU estate was originally a downstream projection of organizational truth; nobody maintained the projection, and the source it projected was never machine-readable to begin with.
- **Per-system account stores.** Every application old enough to predate federation keeps its own user table: database logins, mainframe RACF profiles, contact-center agent rosters, badge systems. Each is a private, unsynchronized opinion about who exists.
- **Spreadsheets and email.** The onboarding tracker, the contractor roster, the separation checklist — operational documents that carry authoritative-grade decisions (who gets an account, when access ends) with none of the properties of an authoritative source: no schema, no lineage, no events, no audit.
- **Drawings.** The organizational chart itself lives in Visio and briefing slides. It is read by humans, cited in memos, and queryable by absolutely no policy engine anywhere in the enterprise.

Each fragment is *locally* maintained and *globally* wrong. The regional OU tree knows an account exists but not whether its owner is still employed. The application user table knows a login works but not what position justified it. The spreadsheet knows a contractor started but is a copy the moment it is saved. Fragmented truth is not partial truth — it is contradiction with no arbiter, because no fragment is designated to win.

### The visible symptom: orphaned accounts

The measurable consequence is the orphaned account: an enabled credential whose human justification has ended. Every audit finds them; every remediation sweep removes a batch; every year they return — because sweeps treat the symptom. An orphaned account is not an administrator's mistake. It is the *structurally guaranteed output* of an architecture in which the system that knows a person left (HR) and the systems that must act on it (directory, applications, badge, VPN, database) share no event channel. The information exists on day zero; it arrives — by ticket, by email, by quarterly review, or by audit finding — days to months later, or never. No amount of process discipline closes a gap whose cause is the absence of a wire.

The anatomy is worth one concrete timeline, because it shows *where the information is* at every point during the gap:

| Day | What the HR System Knows | What the Fragments Know | Exposure |
|---|---|---|---|
| −14 | Separation recorded, effective day 0 | Nothing — no fragment subscribes to HR events | None yet; the fact exists and is actionable |
| 0 | Separation effective | Directory: account enabled. Applications: logins valid. Badge: active | Credentials of a former worker are fully live |
| +3 | Unchanged | Supervisor emails a ticket; the directory account is disabled; nine application accounts are not | Partial: the fragments deprovision independently, in whatever order tickets are worked |
| +45 | Unchanged | A quarterly review flags two of the nine; nobody is sure who owns the rest | The finding is now aging toward an audit |
| +180 | Unchanged | A penetration test authenticates to a case system with an orphaned service-desk account | The gap is now an incident narrative |

: The orphan timeline — the fact exists on day −14; the fragments learn it by accident {.striped .hover}

Nothing in that timeline is a failure of diligence. It is the *wiring diagram working as built*: a system that records the truth, five systems that need it, and no channel between them. The same anatomy produces the quieter failures: the transferred employee who keeps the old division's access for years (the access-accretion problem PS-5 exists to stop), the contractor converted to staff who now has two identities, the rehired annuitant with three.

## The statutory frame

Two federal frames make the fix a mandate rather than a preference. The **Evidence Act (2018)** and the Federal Data Strategy require that agency data trace to a single authoritative system of record for each data type, with documented lineage from source to decision. The **FICAM Architecture** requires that every governed identity carry a complete, authoritative set of identity attributes *derived from authoritative sources such as HR systems*. Neither frame is satisfied by cleaning the fragments. Both are satisfied only by designating the source — and for facts about people and organizational placement, the only candidate system that records hire, position, reporting line, and separation *as a matter of business authority* is the human capital system.

## Why this can't be patched

Three remediation strategies are regularly proposed to fix fragmented identity truth without designating a source. Each fails for a structural reason:

- **"Clean up the directory."** A directory-hygiene project produces a correct *snapshot* with no event source behind it. Drift resumes the day the project ends, because hires, transfers, and separations keep happening in a system the directory still cannot hear. Cleanup is a measurement, not a source.
- **"Make the directory the master."** Elevating the directory to authority inverts causation. Employment facts would then have to be *entered into* the directory by administrators — that is, by tickets — which re-creates the ticket queue as the source of truth, now with a grander title and still with no effective dating, no positions, no supervisory hierarchy, and no business authority behind any entry. Nothing that happens inside a directory *is* a hire or a separation. The directory can hold truth; it cannot originate it.
- **"Review our way to correctness."** Quarterly access reviews sample state; they cannot observe transitions. A review that runs ninety days after a separation certifies an orphan for a quarter, and a reviewer confronted with four hundred entitlements approves them in bulk — the rubber-stamp failure mode every assessor recognizes. Reviews are AC-2(j)'s verification layer and this architecture keeps them, sharper (Chapter 08); but a detective control needs a truth to detect drift *from*, and reviews cannot manufacture the truth they check against.

Every patch preserves the premise — that identity truth can be maintained where it is consumed rather than where it originates — and the premise is the defect. The remediation is not a cleaner copy; it is a designated origin with an event feed.

## What HR provides, and what identity architecture must add

The HR system of record supplies the authoritative origin:

- Authoritative employment status (joiner, mover, leaver)
- Organizational attributes (department, division, location, employee type)
- A consistent feed shape across agencies once Federal HR 2.0 consolidation completes

Identity architecture supplies everything that turns that origin into access:

- A canonical schema that normalizes HR attributes for directory consumption (Chapter 05)
- Joiner/mover/leaver workflows that act only on HR events (Chapter 06)
- Credential and certificate lifecycle tied to the same events (Chapter 07)
- Population of the attributes policy reads, so that targeting stays deterministic (Chapter 08)
- Drift detection between HR state and directory state, and evidence that account-management controls can be continuously verified (Chapter 09)

The identity architecture doesn't depend on the platform being Oracle Fusion Cloud HCM. It depends on the HR system remaining the authoritative source and on the feed being normalizable to a canonical schema. Neither half is sufficient alone.

::: {.callout-tip}
## Continue the series
[← Previous: Chapter 00 — Overview and Applicability](00-overview-and-applicability.md) · [Index](index.md) · [Next: Chapter 02 — Federal HR 2.0 →](02-federal-hr-2-0.md)
:::
