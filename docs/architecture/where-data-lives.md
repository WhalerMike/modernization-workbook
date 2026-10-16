# Where Data Lives

**Three-layer storage for organizational attributes: vocabulary in version control, assignment on the directory object, authority in HR**

## The short answer

There is no single registry for organizational attributes. The data lives in **three places at once**, each with a distinct role:

| Layer | Where it lives | What it holds | Role |
|-------|----------------|---------------|------|
| **Vocabulary** | Version-controlled codebook (Git) | The named facets and (for each) a per-facet enumeration or typed pattern | Defines the language |
| **Assignment** | Extension attributes on each principal in the cloud directory | The actual facet values carried by every principal | Carries the runtime data |
| **Authority** | The HR system | The ground-truth organizational structure that drives values | Source of truth |

If the three disagree, the resolution order is **HR → directory → codebook per-facet validation → drift event**. IT never edits the attribute slots by hand.

## Layer 1 — The vocabulary lives in version control

The codebook is a versioned, reviewed document. It declares each named facet independently, with that facet’s slot binding, kind (enumerated or typed), and either an enumeration or a typed validation pattern.

Each entry is a **facet** declaration:

| Field | Notes |
|-------|-------|
| `name` | Stable identifier (for example, `region`, `department`, `hire_date`) |
| `attribute` | The extension-attribute slot the facet binds to (must be unique across facets) |
| `kind` | `enumerated`, `typed`, or `reserved` |
| `enumeration` | (enumerated only) The closed set of valid values |
| `value_pattern` | (typed only) The validation contract for the value |
| `status` | Per-facet lifecycle: active, deprecated, or pending |
| `owner` | Responsible role for the facet’s vocabulary |

Codebook changes follow a reviewed workflow: pull request, validation (schema + slot-uniqueness check), review, merge, and provenance chain.

## Layer 2 — The values live on the directory object

Each principal carries facet values simultaneously, one per slot, on the directory object itself:

| Principal type | Storage surface |
|----------------|-----------------|
| **User** | Extension attributes on the user object |
| **Device** | Extension attributes on the device object |
| **Cloud resource** | Equivalent tags on the resource |
| **Service principal** | Extension attributes on the service principal (when in scope) |

### Example slot mapping

| Slot | Facet | Kind |
|------|-------|------|
| Attribute 1 | Region | enumerated |
| Attribute 2 | Department | enumerated |
| Attribute 3 | Division | enumerated |
| Attribute 4 | Role | enumerated |
| Attribute 5 | Cost center | enumerated |
| Attribute 6 | Classification | enumerated |
| Attribute 7 | Hire date | typed (ISO date) |
| Attribute 8 | Term date | typed (ISO date, allow empty) |
| Attribute 9 | Clearance level | enumerated |
| Attribute 10 | Account type | enumerated |

### Are these attributes pre-defined or assessment-defined?

**The slots are pre-defined. The facet semantics and the per-facet values are assessment-defined.**

- The extension-attribute slots are standard, tenant-wide extensibility attributes that exist out of the box.
- What the framework defines is the *per-slot contract*: each named slot carries a specific facet, validated against that facet’s enumeration or typed pattern. Per-facet validation means a finding on one slot is independent of the other slots.
- The *values* themselves are populated during migration and maintained continuously by HR-driven inbound provisioning.

### Slot-uniqueness invariant

Each extension-attribute slot is claimed by **exactly one** facet. Two facets binding the same slot is a codebook integrity error. A violation surfaces as **Slot Drift** (critical).

## Layer 3 — The authority lives in HR

The cloud directory is the *system of record* for identity. The HR system is the *system of truth* for organizational placement — and it populates all named facet slots.

```
HR system
        │  authoritative organizational assignment — facet values per user
        ▼
Provisioning pipeline (HR-driven inbound provisioning or directory synchronization)
        │  writes the extension attributes per principal
        ▼
Directory object (attributes populated)
        │  read per-facet by dynamic groups, administrative units, Conditional Access, and the drift engine
        ▼
Downstream governance
```

**Operating rule:** The HR system is the authoritative source — IT never manually edits any of the facet values. Any IT-originated write to the attribute slots is itself a drift event under the provenance rules.

## Devices and cloud resources

A user has one storage surface. A computer does not. A computer object decomposes across planes:

| Plane | Object type | Storage |
|-------|-------------|---------|
| **Identity** (clients) | Directory device | Extension attributes on the device |
| **Management** (clients) | Device-management enrollment | Inherited from the directory device’s attributes |
| **Management** (servers) | Hybrid-management machine | Equivalent tags on the resource |
| **Workload** | Service principal / managed identity | Extension attributes on the service principal (when in scope) |

The two storage surfaces that actually carry facet values are the directory extension attributes and the equivalent tags on cloud resources. The other rows inherit from those.

Both surfaces validate against the exact same per-facet codebook. Devices do not get their own drift categories.

## Quick reference

| Question | Answer |
|----------|--------|
| Where is the list of valid region values? | In the codebook |
| Where is a specific user’s region? | On the user’s extension attributes in the directory |
| Who decides what values go into the slots? | The HR system, via inbound provisioning |
| Are the slots defined by the framework? | No — the platform provides them; the framework claims specific slots |
| Is there a database? | No — version control for vocabulary, directory for per-principal values |
| What enforces the per-facet binding? | The drift engine against the codebook |
| What enforces slot uniqueness? | The codebook loader — Slot Drift findings on violation |

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
