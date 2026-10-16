# Dynamic Group Library

Patterns for composing policy and access from governed attributes.

## Purpose

Dynamic groups replace OU-based targeting. Membership is computed from attribute values rather than manual assignment. This document catalogs common rule patterns and the governance requirements that keep them deterministic.

## Rule patterns

| Pattern | Example rule | Use |
|---------|--------------|-----|
| Single facet | `department -eq "Finance"` | Department-scoped policy |
| Boolean combination | `department -eq "Finance" -and location -eq "HQ"` | Intersection targeting |
| Hierarchy roll-up | `division -in ("IT","Security")` | Broader inclusion |
| Exclusion | `department -eq "Finance" -and employeeType -ne "Contractor"` | Refined population |
| Device class | `deviceCategory -eq "Workstation" -and complianceState -eq "Compliant"` | Device policy |

## Governance requirements

- Attribute values must come from a canonical source.
- Enumeration lists must be controlled.
- Empty or malformed values must be detectable as drift.
- Group membership changes must be explainable from the attributes, not from manual edits.

## Bottom line

Dynamic groups are only as reliable as the attributes that feed them. A governed attribute model is what makes the shift from OU targeting to dynamic targeting auditable.

---

*Cleaned extraction for project use.*
