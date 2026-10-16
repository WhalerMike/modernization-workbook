# Identity Lifecycle & Provisioning — Project Plan

## 1. Overview

This plan describes how the Identity Lifecycle & Provisioning project will move from manual or semi-automated identity changes to a governed path in which every joiner, mover, leaver, and non-human identity event originates from an authoritative source, carries an authorization, executes under least privilege, closes with provenance, and emits evidence.

It follows the approach in the project charter: Designate origins → Normalize attributes → Pilot joiner/mover/leaver → Extend to privileged access → Institutionalize review.

## 2. Guiding Constraints

- The HR system (or designated equivalent) is the authoritative origin for human organizational placement.
- The directory is the system of record for identity, not for organizational truth.
- Access is driven by attributes; manual group membership is an exception.
- Elevated privilege is time-bounded and scoped.
- Every change closes with provenance; evidence is a byproduct of the change path.

## 3. Phases

### Phase 0 — Charter and Alignment
**Objective:** Confirm scope, stakeholders, and the authoritative origin.

**Key activities**
- Review and accept the project charter.
- Confirm the HR system (or equivalent) as the authoritative origin for human lifecycle events.
- Identify owners for non-human identity classes in scope.
- Agree on evidence and provenance expectations.

**Deliverables**
- Accepted charter.
- Stakeholder and role list.
- Named authoritative origins per identity class.

**Exit criteria**
- Leadership can state which system is authoritative for human lifecycle events and who owns each non-human class.

### Phase 1 — Attribute Normalization
**Objective:** Ensure the attributes that drive access are populated and consistent.

**Key activities**
- Inventory the organizational attributes required for dynamic membership and administrative-unit scoping.
- Compare HR source values to directory values; classify discrepancies as drift.
- Populate missing attributes for the pilot population.
- Document the match key between the HR person identifier and the directory employee identifier.

**Deliverables**
- Attribute inventory and codebook (or reference to the existing codebook).
- Drift findings for the pilot population.
- Match-key confirmation.

**Exit criteria**
- Pilot population attributes are populated and reconcilable to the authoritative source.

### Phase 2 — Pilot Joiner / Mover / Leaver
**Objective:** Execute the five-clause path for a limited population and validate evidence.

**Key activities**
- Select a pilot population (recommended: one business unit or a controlled set of roles).
- Implement joiner, mover, and leaver flows that originate from the HR source.
- Require authorization, least-privilege execution, and provenance closure.
- Emit evidence for each change.
- Detect and classify any drift that appears.

**Deliverables**
- Operational joiner/mover/leaver flows for the pilot.
- Provenance records and evidence package.
- Lessons-learned summary.

**Exit criteria**
- At least one full joiner, one mover, and one leaver have been executed with provenance and evidence.

### Phase 3 — Privileged Access and Just-in-Time Elevation
**Objective:** Reduce standing privilege for at least one administrative role class.

**Key activities**
- Inventory standing administrative privilege in the pilot scope.
- Introduce just-in-time elevation for one privileged role class.
- Document break-glass procedures and exclude break-glass accounts from standard policy.
- Begin reducing standing privilege for the targeted class.

**Deliverables**
- Just-in-time elevation procedure.
- Break-glass account inventory and governance notes.
- Standing-privilege reduction report.

**Exit criteria**
- Just-in-time elevation is available and has been used for the targeted role class; standing privilege for that class is measurably reduced.

### Phase 4 — Access Certification and Steady-State Drift Detection
**Objective:** Institutionalize review and continuous detection of identity drift.

**Key activities**
- Define the access certification cadence and scope (privileged and high-blast-radius entitlements first).
- Execute the first certification cycle.
- Stand up or refine continuous drift detection between the authoritative source and the directory.
- Transition ownership to steady-state operations.

**Deliverables**
- Access certification procedure and first-cycle results.
- Operational drift detection for identity attributes.
- Residual-risk and ownership transfer notes.

**Exit criteria**
- First certification cycle is complete; drift detection is operational; ownership has transferred.

## 4. Domain Workstreams (Summary)

| Domain | Primary Focus | Suggested Position |
|--------|---------------|--------------------|
| Human lifecycle | Joiner, mover, leaver from HR source | Phase 2 |
| Attribute model | Dynamic membership and administrative-unit scoping | Phase 1 |
| Privileged access | Just-in-time elevation and standing-privilege reduction | Phase 3 |
| Non-human identity | Service accounts, application registrations, device owners | Parallel with Phase 2–3 |
| Access certification | Review cadence for high-risk entitlements | Phase 4 |

## 5. Governance and Decision Rights

- Sponsor approves source-of-truth designation, major scope changes, and residual risk acceptance.
- Project lead owns sequencing and cross-domain dependencies.
- Domain leads own flow design, evidence readiness, and domain-specific residual risks.

## 6. Risks and Mitigations (Selected)

| Risk | Mitigation |
|------|------------|
| Incomplete HR data | Attribute normalization phase before any access changes; pilot limited to well-populated populations |
| Legacy service accounts cannot move to managed identity | Inventory and owner assignment first; managed identity as a later wave |
| Resistance to just-in-time elevation | Pilot one role class; document break-glass; measure reduction rather than mandate elimination |
| Non-human identities lack owners | Require owner assignment as an entry criterion for lifecycle controls |

## 7. Success Measures (Project Level)

- Authoritative origins designated and documented.
- Pilot joiner/mover/leaver flows executed with provenance and evidence.
- Attribute-driven access operational for the pilot; residual manual membership inventoried.
- Just-in-time elevation available and standing privilege reduced for at least one role class.
- First access certification cycle complete.
- Drift detection operational between the authoritative source and the directory.

## 8. Immediate Next Actions

1. Review and accept this plan against the project charter.
2. Confirm the authoritative origin for human identity lifecycle events.
3. Inventory non-human identity classes and name owners.
4. Define the pilot population.
5. Document the attribute facets that will drive dynamic membership.

---

*This plan is a project artifact. It incorporates the modernization concepts of authoritative origin, attribute-driven structure, explicit drift, and controlled evidence-producing change. It contains no internal architectural decision record identifiers.*
