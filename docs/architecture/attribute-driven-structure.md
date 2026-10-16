# Attribute-Driven Structure

**Reconstructing hierarchical governance inside a flat directory**

## The problem

When the hierarchical model of Active Directory was replaced by a flat directory, the identity problem was solved but the governance problem was broken.

Active Directory’s organizational-unit tree was never just a folder structure. It was:

- **A delegation model** — organizational-unit-level permissions defined who could manage what
- **A policy inheritance engine** — Group Policy Objects cascaded through the tree
- **An operational boundary** — each organizational unit represented a unit of accountability
- **A security scope** — group membership, resource access, and trust relationships traced back to organizational-unit placement

A flat directory has none of this by default. It gives you a flat list of objects with powerful tools — dynamic groups, administrative units, Conditional Access policies — but no framework for how to use them to replace what the organizational-unit tree was doing.

## The approach

The core mechanism is a set of **coded organizational attributes** — deterministic, attribute-encoded organizational hierarchy that reconstructs the governance model inside the flat directory. Instead of organizational-unit placement, governance relationships are encoded in user extension attributes using a structured codebook.

**Example:** An employee in the Finance department, Budget division, East region would carry structured values such as:

`extensionAttribute1: FIN-BUD-EAST`

This single set of attributes drives:

- **Dynamic group membership** — automatically placed in groups keyed to the attributes
- **Administrative unit scoping** — managed by the corresponding delegation boundary
- **Conditional Access targeting** — policies applied via group membership, not manual assignment
- **License assignment** — governed by attribute-to-SKU mapping rules
- **Drift detection** — any mismatch between the HR source and the attribute values is flagged

## Three composition patterns for dynamic groups

Every dynamic group rule uses one of three patterns built from per-attribute predicates:

| Pattern | Operator | Use Case | Example |
|---------|----------|----------|---------|
| **Single-attribute** | equals / in | All users carrying a value (or a value set) in one attribute | `(department -eq "IT")` |
| **Multi-attribute AND** | and | Users matching every clause across multiple attributes | `(department -eq "IT") and (division -eq "CyberOps")` |
| **Multi-attribute OR / set** | or / in | Cross-cutting groupings (multiple departments, role tiers, clearance bands) | `(department -in ["IT","Engineering"])` |

## Five drift categories

Drift detection classifies every anomaly into exactly one of five categories:

| Category | Definition | Example |
|----------|------------|---------|
| **Schema Drift** | The structure of a governance artifact has changed | A dynamic group rule references an attribute not in the codebook |
| **Value Drift** | An attribute value does not match the canonical source | User’s attributes say one department but the HR system says another |
| **Hierarchy Drift** | Parent-child governance relationships are broken | An administrative unit references an attribute segment that no longer exists in the codebook |
| **Orphan Drift** | An object exists in the tenant but has no canonical governance anchor | A security group exists that is not in the dynamic group library |
| **Phantom Drift** | A canonical artifact references an object that does not exist in the tenant | The codebook defines an attribute segment with zero matching users |

## Governance rules for dynamic groups

1. **No manual members** — groups in the library are dynamic-only.
2. **One rule per group** — no multi-rule groups; split into separate groups.
3. **Deterministic naming** — name derives from attribute(s) + value(s) + purpose suffix.
4. **Single-attribute preferred** — multi-attribute compositions only when the cross-attribute selection is operationally distinct.
5. **Governed changes only** — additions and modifications follow a reviewed workflow.

## Related layers

A complete attribute-driven structure includes:

- **Codebook** — the master encoding scheme, valid values, hierarchy rules, and validation.
- **Dynamic group library** — membership rules keyed to attribute segments.
- **Attribute mapping** — translation from hierarchical distinguished names to flat attributes.
- **Delegation matrix** — administrative units and role assignments scoped by attributes.
- **Drift detection** — continuous comparison of the authoritative source against live state.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
