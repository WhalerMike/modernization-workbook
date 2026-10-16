# Identity Lifecycle & Provisioning — Project Charter

## 1. Purpose

Establish a governed identity lifecycle so that every human and non-human identity originates from an authoritative source, receives only the access its attributes justify, and produces continuous evidence of its state and changes.

The project turns the five-clause change path (originate → authorize → execute under least privilege → close with provenance → emit evidence) into an operational program for joiner, mover, leaver, and non-human identity events.

## 2. Problem Statement

Identity lifecycle is still largely manual or semi-automated. Joiner, mover, and leaver events arrive through tickets, spreadsheets, or local directory changes. Non-human identities (service accounts, application registrations, devices) lack a clear origin. Access accumulates and is rarely reviewed. The result is:

- Orphaned and over-privileged accounts that persist after people leave or roles change.
- No reliable answer to “who authorized this access, and when does it expire?”
- Competing sources of truth for organizational placement and identity attributes.
- Evidence of identity state assembled after the fact rather than produced by the change itself.
- High residual risk in privileged and administrative identities.

## 3. Objectives

1. Designate an authoritative origin for human identity lifecycle events (typically the HR system) and for non-human identity classes.
2. Implement joiner, mover, and leaver flows that originate from that source, carry an authorization, execute under least privilege, and close with provenance.
3. Drive access assignment from organizational attributes rather than manual group membership.
4. Establish just-in-time elevation for privileged roles and eliminate standing administrative privilege where feasible.
5. Produce machine-readable evidence of every lifecycle change for continuous monitoring and access review.
6. Define and operate an access certification cadence for high-risk entitlements.

## 4. Scope

### In Scope
- Human identity lifecycle (joiner, mover, leaver) from the designated HR or equivalent source.
- Non-human identity classes: service accounts, application registrations, and device identities that require an owner and lifecycle.
- Attribute-driven dynamic membership and administrative-unit scoping.
- Just-in-time privileged access elevation and break-glass procedures.
- Access certification / review for privileged and high-blast-radius entitlements.
- Provenance and evidence emission for every lifecycle change.
- Drift detection between the authoritative source and the directory.

### Out of Scope (Initial Phase)
- Full replacement of the existing directory or identity provider.
- Application-level authorization logic inside individual business systems.
- Physical access control systems.
- Organization-specific HR system configuration (the project defines the contract; the adopting organization owns the source system).

## 5. Guiding Principles

- **Authoritative origin.** The HR system (or designated equivalent) is the source of truth for human organizational placement. The directory is the system of record for identity, not for organizational truth.
- **Attributes drive access.** Dynamic groups and administrative units are populated from organizational attributes. Manual group membership is an exception, not the path.
- **Least privilege and just-in-time.** Elevated rights exist only for the duration and scope of a governed change. Standing administrative privilege is minimized.
- **No closure without proof.** Every lifecycle change closes with a provenance record. Human-only “complete” clicks are exception states.
- **Evidence is a byproduct.** Continuous-monitoring evidence is emitted by the change path, not assembled later.
- **Non-human identities have owners.** Every service account, application registration, and device identity resolves to a human owner in the authoritative source.

## 6. Success Criteria

- An authoritative origin is designated and documented for human identity lifecycle events and for each non-human identity class in scope.
- Joiner, mover, and leaver flows are operational for a pilot population and produce provenance records.
- Access for the pilot population is driven by attributes; residual manual group membership is inventoried and declining.
- Just-in-time elevation is available for at least one privileged role class; standing privilege for that class is reduced.
- An access certification cadence is defined and the first review cycle is complete for high-risk entitlements.
- Drift between the authoritative source and the directory is detectable and classified.
- Leadership can describe the lifecycle path, residual risks, and evidence expectations without reference to internal technical decision records.

## 7. High-Level Approach

1. **Designate origins** — Confirm the authoritative source for human lifecycle events and name owners for non-human identity classes.
2. **Normalize attributes** — Ensure the organizational attributes that drive access are populated and consistent between the source and the directory.
3. **Pilot joiner/mover/leaver** — Implement the five-clause path for a limited population and validate evidence emission.
4. **Extend to privileged access** — Introduce just-in-time elevation and begin reducing standing privilege.
5. **Institutionalize review** — Stand up access certification and continuous drift detection against the authoritative origin.

## 8. Risks and Assumptions

### Key Risks
- Incomplete or delayed HR data prevents attribute-driven access from functioning correctly.
- Legacy applications require standing service accounts that cannot be moved to managed identity in the initial phase.
- Organizational resistance to just-in-time elevation for administrative roles.
- Non-human identities lack clear owners, delaying lifecycle controls.

### Assumptions
- An HR system or equivalent exists and can emit joiner, mover, and leaver events.
- The directory supports dynamic groups or equivalent attribute-driven membership.
- Stakeholders accept that organizational truth resides in the HR source, not in the directory.

## 9. Governance and Ownership

- Project sponsor: (to be named)
- Project lead: (to be named)
- Domain leads: Identity Lifecycle, Privileged Access, Access Certification, Non-Human Identity
- Decision rights: Source-of-truth designation and attribute model rest with the project lead and sponsor; domain leads own flow design and evidence readiness.

## 10. Next Steps

- Confirm the authoritative origin for human identity lifecycle events.
- Inventory non-human identity classes and name owners.
- Define the pilot population and success measures for the first joiner/mover/leaver wave.
- Document the attribute facets that will drive dynamic membership.
- Establish the provenance and evidence expectations for every lifecycle change.

---

*This charter describes an identity lifecycle and provisioning project. It deliberately omits internal architectural decision records and document identifiers so that it can be used directly as a project planning artifact.*
