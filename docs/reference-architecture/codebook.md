---
title: "the organizational-attribute model Codebook"
subtitle: "Model C — 15-facet multi-attribute identity surface"
date: 2026-05-24
format:
  html:
    toc: true
    toc-depth: 3
  docx:
    toc: true
lifecycle: aspirational
lifecycle_review: 2026-11-22
aliases:
  - /customer-documents/reference-architecture/codebook.html
---

{{< lifecycle-banner >}}

> **Model C — 15-facet multi-attribute (per the program decision).** The Model A composite-hyphen path (`extensionAttribute1: ORG-FIN-AP-EAST`) is retired. The executable canon is [`codebook.yaml`] (`schema_version: 2.1.0` — Hybrid-C+Path per the program decision); the canon narrative is [FMP_151]( modernization program_151_the organizational-attribute model_Codebook.md) v4.1. <!-- orgpath-slot-allow: names the retired Model A binding in order to declare it retired -->

## Why This Is the Most Important Document in the Suite

Every other artifact in the OrgTree suite depends on the the organizational-attribute model Codebook:

- **Dynamic groups** ([FMP_152]( modernization program_152_Dynamic_Group_Library.md)) compose membership rules from facet predicates (`attr2 -eq "IT" and attr3 -eq "CyberOps"`)
- **Administrative Units** ([FMP_154]( modernization program_154_Delegation_Matrix_AUs_Roles.md)) scope delegation boundaries via facet tuples
- **Drift detection** ([FMP_163]( modernization program_163_Drift_Detection_Engine_Specification.md)) validates every slot's value against its facet's enumeration independently
- **Conditional Access** policies target groups built from facet compositions
- **License assignment** maps `CostCenter` facet values to M365 SKUs
- **Lifecycle automation** triggers off `HireDate` / `TermDate` typed facets

If the codebook is wrong, everything downstream is wrong. If the codebook is not governed, nothing downstream is governed.

## The Format

Model C decomposes the organizational-attribute model into **15 facets**, each carried by one `onPremisesExtensionAttribute` slot:

- **Slots 1–10** are canonical named facets (assignments fixed by the program decision; rebinding requires a superseding ADR)
- **Slots 11–13** carry the tenant-extension facets declared by the program decision — AdminTier, DeviceType and Environment; **slot 14** remains reserved for tenant-specific extension (declare facet semantics via governed PR before populating)
- **Slot 15** carries the **derived canonical the organizational-attribute model** (inheritance layer, the program decision): `Region=NCR|Department=IT|Division=CyberOps|` — recomputed from the hierarchy facets, trailing `|` always present, never hand-authored

Dynamic group rules, AU memberships, and CA targeting compose facets via standard boolean operators rather than text-parsing a single composite string. Per-facet validation means a drift finding on one slot (e.g., unknown `Region`) is independent of validation on every other slot.

See [Where OrgTree & the organizational-attribute model Data Lives](../architecture/where-data-lives.md) for the storage model (Codebook in Git → Entra `extensionAttribute1`–`15` slots → HR authority).

![the organizational-attribute model Model C slot map. Fifteen facets, each occupying one Entra ID onPremisesExtensionAttribute slot, arranged in three groups. The hierarchy facets on slots 1 to 3 — Region, Department, Division — are highlighted and marked as the only facets that compose the path. The governance facets on slots 4 to 13 — Role, CostCenter, Classification, HireDate, TermDate, ClearanceLevel, AccountType, AdminTier, DeviceType, Environment — are available to boolean composition only. Slot 14 is reserved for a tenant-declared facet pending a governed PR. An arrow labelled "composed in order" runs from the hierarchy group down to a dark band showing slot 15, the derived the organizational-attribute model, carrying the literal value Region=NCR|Department=IT|Division=CyberOps| with its trailing delimiter. Footnotes state that composition truncates at the first unpopulated hierarchy facet and that a stored value differing from the recomputation is flagged DRIFT-SEMANTIC::derived-path.](../images/reference-architecture/codebook-image-01-model-c-slot-map.svg){width="100%"}

## Canonical Attribute Assignments

| Slot | Facet | Kind | Sample values |
|---|---|---|---|
| `extensionAttribute1` | **Region** | enumerated | `NCR`, `WESTUS`, `EASTUS`, `EMEA`, `APAC`, `LATAM` |
| `extensionAttribute2` | **Department** | enumerated | `IT`, `HR`, `Finance`, `Legal`, `Engineering`, `Sales` |
| `extensionAttribute3` | **Division** | enumerated | `CyberOps`, `InfraOps`, `AppDev`, `GRC`, `Cloud` |
| `extensionAttribute4` | **Role** | enumerated | `Analyst`, `Engineer`, `Manager`, `Director`, `CISO` |
| `extensionAttribute5` | **CostCenter** | enumerated | `CC-4100`, `CC-5200`, `CC-8300` |
| `extensionAttribute6` | **Classification** | enumerated | `Employee`, `Contractor`, `Intern`, `Executive` |
| `extensionAttribute7` | **HireDate** | typed (ISO date) | `2024-01-15` |
| `extensionAttribute8` | **TermDate** | typed (ISO date, allow_empty) | `2030-12-31` or `""` for active |
| `extensionAttribute9` | **ClearanceLevel** | enumerated | `None`, `PublicTrust`, `Secret`, `TopSecret`, `TS_SCI` |
| `extensionAttribute10` | **AccountType** | enumerated | `Standard`, `Privileged`, `Service`, `SharedMailbox`, `Guest`, `Vendor` |
| `extensionAttribute11` | **AdminTier** | enumerated | `Tier0`, `Tier1`, `Tier2` — blast radius, orthogonal to Role (the program decision) |
| `extensionAttribute12` | **DeviceType** | enumerated | `Workstation`, `Kiosk`, `Server`, `GitServer` (the program decision) |
| `extensionAttribute13` | **Environment** | enumerated | `Production`, `Staging`, `Dev` (the program decision) |
| `extensionAttribute14` | **Reserved** | reserved | The last tenant-claimable slot; declare facet semantics via a governed PR before populating |
| `extensionAttribute15` | **the organizational-attribute model** (derived) | typed | `Region=NCR\|Department=IT\|Division=CyberOps\|` — recomputed from the hierarchy facets, never hand-authored (the program decision) |

## Facet Kinds

| Kind | Validation | Used for |
|---|---|---|
| **enumerated** | Value must be in the facet's closed `enumeration` list | 8 of 10 named facets |
| **typed** | Value must match `value_type` + optional `value_pattern` regex; `allow_empty: true` permits empty string | `HireDate`, `TermDate` (dates aren't enumerable) |
| **reserved** | No value accepted until promoted via governed PR | Slot 14 by default |

## Slot Uniqueness Invariant

Each `extensionAttribute` slot is claimed by exactly one facet. The Python loader's `_validate_integrity` step rejects any codebook that declares two facets binding the same slot:

```
Facets 'region' and 'second_facet' both bind to 'extensionAttribute1'.
Each extensionAttribute slot must be claimed by at most one facet.
```

JSON Schema cannot express cross-property uniqueness, so this is loader-enforced after schema validation. Violating the invariant is a **Slot Drift** finding (P1 critical).

## Per-Facet Enumerations (Starter Set)

The shipped codebook ships starter values aligned to federal-IT defaults. Tenants extend each enumeration via governed PRs. The full enumeration lives in [`codebook.yaml`]; excerpts shown here.

### Region (`extensionAttribute1`)

| Value | Description |
|---|---|
| `NCR` | National Capital Region |
| `EASTUS` | Eastern United States |
| `WESTUS` | Western United States |
| `CENTRAL` | Central United States |
| `EMEA` | Europe / Middle East / Africa |
| `APAC` | Asia-Pacific |
| `LATAM` | Latin America |

### Department (`extensionAttribute2`)

| Value | Description |
|---|---|
| `IT` | Information Technology |
| `HR` | Human Resources |
| `Finance` | Finance |
| `Legal` | Legal / Compliance |
| `Engineering` | Engineering |
| `Operations` | Operations |
| `Sales` | Sales / Marketing |
| `Executive` | Executive / Leadership |

### ClearanceLevel (`extensionAttribute9`)

| Value | Description |
|---|---|
| `None` | No clearance required / not applicable |
| `PublicTrust` | Public Trust |
| `Secret` | Secret |
| `TopSecret` | Top Secret |
| `TS_SCI` | Top Secret / Sensitive Compartmented Information |

*(Division, Role, CostCenter, Classification, AccountType enumerations follow the same shape; HireDate / TermDate are typed facets with `value_pattern: "^\d{4}-\d{2}-\d{2}$"`.)*

## Dynamic Group Rules — Boolean Composition

Model C's central operational advantage: dynamic group rules compose facets via boolean operators. The Entra dynamic membership language supports this natively.

### Single-facet groups

| Group | Rule | Captures |
|---|---|---|
| `OrgTree-Department-IT` | `(user.onPremisesExtensionAttributes.extensionAttribute2 -eq "IT")` | All IT users across every region/division/role |
| `OrgTree-Region-NCR` | `(extensionAttribute1 -eq "NCR")` | All National Capital Region users |
| `OrgTree-Classification-Executive` | `(extensionAttribute6 -eq "Executive")` | All Executive-classified principals |

### Multi-facet compositions

| Group | Rule | Use case |
|---|---|---|
| `OrgTree-IT-CyberOps` | `(attr2 -eq "IT") and (attr3 -eq "CyberOps")` | IT/CyberOps division |
| `OrgTree-Privileged-Cleared` | `(attr10 -eq "Privileged") and (attr9 -in ["Secret","TopSecret","TS_SCI"])` | Privileged accounts with clearance |
| `OrgTree-NCR-IT-Managers` | `(attr1 -eq "NCR") and (attr2 -eq "IT") and (attr4 -in ["Manager","Director"])` | NCR IT leadership for meetings / announcements |

### Lifecycle-driven groups

| Group | Rule | Use case |
|---|---|---|
| `OrgTree-Active-Employees` | `(attr8 -eq "")` | Empty TermDate ⇒ active employee |
| `OrgTree-Contractors-In-IT` | `(attr2 -eq "IT") and (attr6 -eq "Contractor")` | Department-scoped contractor view |

Each clause cites a single attribute and validates independently — refactoring a facet enumeration does not require re-parsing rule strings.

## Administrative Unit Mapping

| AU | Membership Rule | Scoped Role | Delegate |
|---|---|---|---|
| `AU-Department-IT` | `attr2 -eq "IT"` | User Administrator | IT Division Lead |
| `AU-IT-CyberOps` | `(attr2 -eq "IT") and (attr3 -eq "CyberOps")` | Helpdesk Administrator | CyberOps Manager |
| `AU-NCR-Privileged` | `(attr1 -eq "NCR") and (attr10 -eq "Privileged")` | Authentication Administrator | NCR PAM Steward |
| `AU-Cleared-TopSecret-Plus` | `attr9 -in ["TopSecret","TS_SCI"]` | Conditional Access Administrator | Personnel Security Office |

Per [FMP_154]( modernization program_154_Delegation_Matrix_AUs_Roles.md), every AU in scope is Restricted Management — Global Administrators cannot manage AU members without explicit AU-scoped role assignment.

## Five Drift Categories (per-facet)

| Category | What Broke | Severity | Auto-Fix? |
|---|---|---|---|
| **Value** | `attr[N]` value not in facet enumeration (enumerated) or doesn't match typed pattern | P2 | No — flag for investigation |
| **Format** | `attr[N]` value violates `value_pattern` regex (typed) | P1 | No — manual correction |
| **Slot** | A facet's `attribute:` was remapped to a different slot without ADR | P1 | No — codebook integrity issue |
| **Orphan** | A facet enumeration value has zero matching principals | P3 | Flag only |
| **Phantom** | A principal carries a deprecated value | P3 | Reassign (when `replaced_by` is set) |

Per-facet classification: a principal with valid Region but unknown Department gets one `DRIFT-SEMANTIC` finding for the Department slot only — the Region facet passes independently. See [Drift Detection Walk-through](drift-walkthrough.md) for worked Model C examples and per-facet payload shapes.

## Implementation Sequence

1. **Finalize** each of the 10 named facet enumerations against your tenant's actual organizational structure
2. **Plan reserved-slot use** — if you need facets beyond the 10 named, draft a governed PR declaring semantics for one or more of slots 11–14 (per the program decision; slot 15 belongs to the derived the organizational-attribute model per the program decision, verify the slot's current value is null tenant-wide before promoting)
3. **Populate** all 10 slots via HR-driven inbound provisioning (HR system → Entra Connect → 10-slot population); IT never manually edits these
4. **Author** dynamic groups starting with single-facet groups, growing to multi-facet compositions as CA targeting matures
5. **Create** Administrative Units mirroring the dynamic group pattern; mark each Restricted Management
6. **Validate** with `uiao orgtree validate codebook` (Python loader) and the per-facet PowerShell flow (see FMP_151 for the validation script)
7. **Enable** drift detection (FMP_163; rebuilt per-facet in the program decision Phase 5+) for continuous per-slot monitoring

## Source

Canonical narrative: [`FMP_151_the organizational-attribute model_Codebook.md`]( modernization program_151_the organizational-attribute model_Codebook.md) v4.0. Executable YAML: [`data/orgpath/codebook.yaml`] `schema_version: 2.0.0`. JSON Schema: [`schemas/orgpath/codebook.schema.json`]. Python loader: [`uiao.modernization.orgtree.codebook`].
