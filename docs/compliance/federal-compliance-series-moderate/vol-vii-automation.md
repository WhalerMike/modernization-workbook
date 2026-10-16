# Federal Compliance Series - Moderate — Volume VII: Automation

**Volume purpose — the coordination layer**

## Draft posture

This document is a draft proposal. It has not been reviewed or approved by the agency CIO Office, the Office of Information Security, or organizational leadership.

## Volume purpose

Volumes I–IV establish the architecture. Volume V covers training. Volume VI carries the deployable infrastructure-as-code, detection, and evidence artifacts. Volume VII is the coordination layer: the workflow, configuration management database, and governance-risk-compliance automation that turns control state into tracked tasks, reviewable change, machine-readable evidence, and authorization-package input. Where Volume VI deploys a control as code, Volume VII operates it — routing drift to an owner, gating change, and rolling posture up into the continuous-monitoring package.

## The coordination doctrine

1. **Actuation is platform-native and non-negotiable.** The workflow platform does not patch a virtual machine, flip a conditional access policy, or rewrite a policy assignment as its primary job. It orchestrates who does, when, under what approval, and with what evidence.
2. **Governance and evidence are unified.** Every native surface emits its control state into one workflow-and-evidence system so that a single compliance picture, an approval trail, and an authorization-package feed exist.

**Doctrine guardrail — the configuration management database reconciles to the naming plane; it does not replace it.** The configuration management database is a workflow projection of asset state, reconciled to the authoritative naming and addressing identity. Naming and addressing and the human-resources source of truth remain the truth planes; the configuration management database and the workflow are enforcement/coordination planes — depended on for routing and evidence, never for truth.

## Books in this volume

| Book | Title | Role |
|------|-------|------|
| Book 00 | Volume Overview | The coordination doctrine |
| Book 01 | CMDB Reconciliation & Asset Identity | Reconcile to the naming plane |
| Book 02 | Cloud SaaS Control Compliance Automation | Drift → change/incident/attestation tasks |
| Book 03 | Cloud IaaS/PaaS Control Compliance Automation | Policy and update management → remediation tasks |
| Book 04 | Control Attestation, Evidence & Key Security Indicator | Control tests → structured package |
| Book 05 | The Compliance App | Deployable artifact |
| Book 06 | Additional cloud control compliance automation | Additional cloud surfaces |
| Book 07 | Virtualization control compliance automation | Virtualization surfaces |

## Boundary discipline

- The coordination platform holds a higher authorization than the boundary it coordinates; the direction of the delta is conservative.
- Any callout that reaches an agency surface runs through a connector registered inside the authorization boundary.
- Least-privilege service identity. The platform reaches cloud services through a scoped, auditable identity with only the permissions the coordination role needs.

## Platform optionality

What this volume requires is the coordination contract, not a product: drift routed to a named owner, change gated by an approval record, actuation under least-privilege service identity, and machine-readable evidence emitted for the authorization package — with the configuration-management-database-reconciles-to-naming-plane guardrail holding throughout. The recommended platform is one realization of that contract. An agency on a different stack satisfies the same contract by another authorized workflow platform or a composed pipeline, so long as all four contract properties and the reconciliation guardrail demonstrably hold.

## Closure necessity

Volume VII does not claim to close controls the architecture and implementation volumes already close. Its necessity is of the same kind Volume VI carries, one plane further out: a control-closure claim with no owner, no change gate, no service-level agreement clock, and no evidence feed is not an operating control — it is a hope.

## Where evidence lands

The binding of this volume’s closures and evidence to a governance substrate is optional and separable. The volume stands complete at FedRAMP Moderate with no substrate engagement at all. Adopting a substrate adds machine-checked scoring and drift-gating on top of what is already closed, and can be adopted later — or never — without rework.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
