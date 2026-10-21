# Federal Compliance Series - Moderate — Volume IX: Day-2 Operations

**Volume purpose — extending the coordination layer from compliance drift to the governed day-2 catalog**

## Draft posture

This document is a draft proposal. It has not been reviewed or approved by the agency CIO Office, the Office of Information Security, or organizational leadership.

## Volume purpose

Volume VII established the coordination layer for control-compliance drift. Volume IX extends that same layer to day-2 operations — the governed catalog for the common helpdesk tasks, the landing-zone front door, application-registration governance, and telephony. Where Volume VII asks “is this control drifting?”, Volume IX asks “is this operator request governed, least-privilege, and evidenced?” — the same coordination discipline, applied to the work a service desk does every day.

## The day-2 discipline

Four rules govern every catalog item:

1. **Typed, control-mapped request.** No day-2 action is a free-text ticket or a portal click; it is a catalog item bound to the control it satisfies.
2. **The approval gate the control requires.** A password reset is identity-verified; a conditional-access exception needs a security approver; a privileged group is time-bound and reviewed. The gate is a property of the control, not a workflow convenience.
3. **In-boundary actuation; never standing admin.** The connector holds scoped, logged, individually-approved write — never blanket tenant administration.
4. **Audited and reconciled.** Every action emits a change/approval record reconciled to the naming-plane-keyed configuration management database.

## Books in this volume

| Book | Title | Focus |
|------|-------|-------|
| Book 00 | Volume Overview | The day-2 coordination discipline |
| Book 01 | Helpdesk & ITSM Catalog | Joiner/mover/leaver, password/multi-factor reset, unlock, group/license, guest invite |
| Book 02 | Landing Zone Front Door | Catalog request → change-controlled infrastructure-as-code → configuration management database reconcile |
| Book 03 | App Registration Governance | Request → scoped consent → secret/certificate lifecycle → attestation |
| Book 04 | Telephony Catalog | Number/calling-policy catalog |
| Book 05 | SaaS Integration Governance | Software-as-a-service provisioning gated on a recorded authorization |
| Book 06 | Identity & Access Governance | Event-driven joiner/mover/leaver from the human-resources source of truth, access-certification campaigns |

## Closure necessity

Volume IX does not re-close the identity and configuration mechanisms earlier volumes establish. Its necessity is operational: the highest-frequency changes to the estate are day-2 requests, and if they are not governed, approved, least-privilege, and evidenced, they are the largest continuous source of control erosion an assessor will find. This volume makes routine operations produce the evidence the authorization package needs.

## How this volume fits the program

Volume IX depends on Volume I’s naming plane, Volume VII’s coordination pattern, and Volume VI’s landing-zone and identity-as-code artifacts. It produces the audited, control-mapped operational record that the attestation volume lifts into the Key Security Indicator feed. Truth is separated from enforcement: naming and addressing and the human-resources source of truth remain the truth planes; the day-2 catalog is a coordination/enforcement plane on top of them.

## Where evidence lands

The binding of this volume’s closures and evidence to a governance substrate is optional and separable. The volume stands complete at FedRAMP Moderate with no substrate engagement at all. Adopting a substrate adds machine-checked scoring and drift-gating on top of what is already closed, and can be adopted later — or never — without rework.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
