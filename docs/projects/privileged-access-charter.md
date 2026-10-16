# Privileged Access & Administrative Identity — Project Charter

## 1. Purpose

Treat administrative identity as the root of the root: time-box privileged access, eliminate standing administrative privilege where feasible, and ensure every privileged action is authorized, least-privilege, and evidenced.

## 2. Problem Statement

Administrative access is still largely standing. Privileged roles are granted permanently. Service accounts and application registrations hold broad permissions. Break-glass accounts are undocumented. The result is:

- A compromised administrative identity grants persistent access.
- No reliable answer to “who elevated, for what, and for how long?”
- Separation of duties is procedural rather than enforced.
- Non-human privileged identities lack owners and lifecycle.

## 3. Objectives

1. Inventory standing administrative privilege and classify it by blast radius.
2. Introduce just-in-time elevation for at least one high-risk role class.
3. Reduce standing privilege for that class; document residual standing privilege with rationale.
4. Govern break-glass accounts: identify, exclude from standard policy, and test.
5. Assign owners and lifecycle to non-human privileged identities.
6. Enforce separation of duties for high-risk changes (requester ≠ approver).
7. Emit evidence for every privileged elevation and administrative change.

## 4. Scope

### In Scope
- Standing administrative privilege inventory and reduction.
- Just-in-time elevation for privileged roles.
- Break-glass account governance.
- Non-human privileged identity ownership and lifecycle.
- Separation of duties for high-risk changes.
- Evidence emission for privileged actions.

### Out of Scope (Initial Phase)
- Full elimination of all standing privilege.
- Privileged access management for every application tier.
- Physical or facilities privileged access.

## 5. Guiding Principles

- **Administrative identity is the root of the root.** It requires controls of its own.
- **Just-in-time, not standing.** Elevated rights exist only for the duration and scope of a governed change.
- **Break-glass is governed.** It is identified, excluded, and tested—not an unwritten exception.
- **Separation of duties is enforced.** Requester and approver are distinct for high-risk changes.
- **Non-human identities have owners.** Every privileged service account or application registration resolves to a human owner.
- **No elevation without evidence.** Every privileged action produces a provenance record.

## 6. Success Criteria

- Standing administrative privilege inventoried and classified by blast radius.
- Just-in-time elevation available and used for at least one high-risk role class.
- Standing privilege for that class measurably reduced; residual documented.
- Break-glass accounts identified, excluded, and tested.
- Non-human privileged identities in scope have named owners.
- Separation of duties enforced for at least one high-risk change class.
- Evidence available for privileged elevations in the pilot.

## 7. High-Level Approach

1. **Inventory** — Catalog standing administrative privilege and non-human privileged identities.
2. **Elevate just-in-time** — Introduce just-in-time elevation for one role class.
3. **Reduce** — Remove standing privilege for that class where safe; document residual.
4. **Govern exceptions** — Identify and test break-glass; assign owners to non-human identities.
5. **Evidence** — Emit provenance for every elevation and high-risk change.

## 8. Risks and Assumptions

### Key Risks
- Operational resistance to just-in-time elevation for critical roles.
- Legacy systems require standing service accounts that cannot be converted immediately.
- Break-glass accounts are unknown or shared.
- Separation of duties conflicts with small-team operations.

### Assumptions
- A privileged identity management or equivalent elevation mechanism is available or can be introduced.
- Stakeholders accept that standing administrative privilege is a residual risk to be reduced, not a permanent design.

## 9. Governance and Ownership

- Project sponsor: (to be named)
- Project lead: (to be named)
- Domain leads: Privileged Roles, Non-Human Identity, Break-Glass, Separation of Duties

## 10. Next Steps

- Inventory standing administrative roles and non-human privileged identities.
- Identify the first role class for just-in-time elevation.
- Locate and document break-glass accounts.
- Define separation-of-duties rules for one high-risk change class.
- Establish evidence expectations for elevations.

---

*This charter describes a privileged access and administrative identity project. It deliberately omits internal architectural decision records and document identifiers.*
