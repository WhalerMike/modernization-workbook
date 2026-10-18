# Attribute-Oriented Directory and Identity Model

**Making identity attributes the authoritative driver of access, policy, and governance**

## Problem, solution, ask

**Problem.** Cloud identity platforms are static access-control systems bolted onto dynamic organizations: access is assigned by hand, movers lag behind their organizational changes, permissions accumulate and drift, audit evidence has to be reconstructed from tickets, and HR, IT, and Security each hold a different picture of who someone is.

**Solution.** Make identity attributes the authoritative driver of access, policy, and governance. HR system → directory → directory sync → attributes → dynamic groups → access and policy enforcement. Access recalculates the moment an attribute changes, narrows the moment a attribute narrows, and the attribute-to-access rule set is itself the audit evidence.

**Ask.** Adopt the attribute model as the access-control design and align administrative units to the major organizational segments. Because attribute writes for synced users are directory-mastered, plan the attribute population in the directory and accept the directory-sync interval as the provisioning floor — not zero.

## Architecture overview

HR System → on-premises directory → directory sync → cloud identity attributes → Dynamic Groups → Access & Policy Enforcement

For any synced user, the source of authority for the organizational attributes is the on-premises directory. The attribute stamp happens on-premises and syncs; it is not a cloud-side write. Device attributes are cloud-mastered and are writable through the cloud API. Two consequences follow: the flow carries a directory-sync latency hop, and it takes a hard dependency on the sync engine.

## Core principle

Identity attributes define organizational structure; access is computed, not assigned.

## Dynamic group model

Groups are defined by boolean composition over attribute predicates:

- Single-attribute rules — all principals carrying a value in one attribute
- Multi-attribute AND rules — principals matching every clause across multiple attributes
- Multi-attribute OR / set rules — cross-cutting groupings

## Operational flow

1. HR system updates user data.
2. The attribute values are written to the on-premises directory — the source of authority for any synced user.
3. Directory sync carries the change to the cloud identity platform (this hop has latency).
4. Dynamic groups recalculate membership.
5. Access and policies update automatically.

For a cloud-only user, or for a device, steps 2–3 collapse into a direct cloud write and the latency hop disappears.

## Key benefits

- Access recalculates automatically when an attribute changes.
- Access decisions trace to a specific rule and attribute value.
- Access narrows the moment a attribute value narrows.
- Audit evidence is the attribute-to-access rule set itself.

## Risks and mitigations

- Data quality issues → implement validation pipelines.
- Group sprawl → enforce naming standards and lifecycle management.
- Complexity → apply governance and documentation.
- Delegation gaps → align administrative units with major organizational segments.

## Conclusion

The attribute-oriented model transforms identity systems from static directories into dynamic, attribute-driven control planes. By aligning access with authoritative identity data, organizations achieve greater agility, security, and operational efficiency.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
