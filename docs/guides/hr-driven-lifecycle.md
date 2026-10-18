# HR-Driven Identity Lifecycle

**How to build the HR-driven identity pipeline — joiner, mover, leaver — with the HR system as the authoritative source**

## Why this matters

The HR system is the system of truth for organizational placement. The directory is the system of record for identity. When the two are not continuously reconciled, the directory becomes an accidental system of record, and every downstream system (groups, administrative units, Conditional Access, licensing) drifts from organizational reality.

An HR-driven pipeline restores the correct relationship: every identity originates from HR and is continuously reconciled.

## The pipe, end to end

### Source: the HR system

| Sync | Mechanism | Notes |
|------|-----------|-------|
| Initial / full | Extract → structured file | Full worker population; scoped by filter rules |
| Delta | Event feeds (new hire, assignment, update, termination) | Turn on immediately after initial sync — a gap loses changes |
| Enrichment | REST endpoints | When a feed event needs attributes it does not carry |

**Match key:** a stable HR person identifier ↔ directory employee identifier. The employee identifier must be populated on existing accounts **before** the first full sync — matching is what prevents duplicate identities at go-live.

### Middleware: the transformation layer

The middleware performs four things per event:

1. **Validate** — required attributes present; unknown worker types refused (fail closed).
2. **Sequence and retry** — events are applied in order; failures are handled explicitly. An out-of-order mover/leaver pair is a correctness bug. A failed transform retries and is recorded — never skipped.
3. **Normalize** — construct the provisioning payload, including custom attributes that trigger lifecycle workflows.
4. **Write provenance** — one record per event (source event identifier, payload hash, derivation inputs, outcome). HR-driven provisioning is a closure like any other: no record, no closure.

### Target: two editions

| | Today — hybrid (directory-mastered) | Target — cloud-native |
|---|--------------------------------------|-------------------------|
| Provisioning target | On-premises directory via a provisioning agent; directory synchronization projects to the cloud | Cloud directory directly — no on-premises leg, no sync latency |
| Joiner/mover/leaver automation | Lifecycle workflows on hire and leave dates | Same |
| Cutover | — | A configuration change, not a rebuild: retarget the provisioning application and flip the mode, per population, evidence-gated |

## Attribute crosswalk (illustrative)

| HR field | Provisioning attribute | On-premises directory | Cloud directory | Used for |
|----------|------------------------|-----------------------|-----------------|----------|
| Person number | External / employee number | Employee ID | Employee ID | **Match key**, lifetime identifier |
| Assignment status | Active | Account disabled | Account enabled | Joiner/leaver state |
| Department | Department | Department | Department | Dynamic groups |
| Business unit / division | Division | Division | Division | Organizational structure |
| Manager | Manager | Manager | Manager | Supervisory chain, **approval routing** |
| Job title | Title | Title | Job title | Role-derived entitlements |
| Worker type | User type | (mapped) | Employee type | Employee/contractor branch |
| Effective start date | Hire date | Extension attribute | Hire date | **Joiner workflow trigger** |
| Effective termination date | Term date | Extension attribute | Leave date | **Leaver workflow trigger** |

**Organizational attributes are derived, never hand-set.** The middleware computes them from the HR hierarchy fields. Nothing downstream may edit them in place.

**Approval routing is rebuilt from the manager attribute.** The supervisory chain that was lost when the hierarchical directory was flattened comes back through this feed.

## Phase plan

Each phase ends at a gate. A phase that cannot pass its gate stops the plan, not the standard.

### Phase 0 — Program alignment

- Name the integrated project team and working-group points of contact.
- Inventory integration points, interfacing systems, and data flows — the identity provisioning feed is one of them.
- Identify legacy identity-relevant data to retain; define the preservation strategy for what does not migrate.

**Gate:** integration-point inventory signed by the security authority and submitted to the program team.

### Phase 1 — Schema and mapping

- Canonical HR attribute schema finalized against the HR system’s field names; crosswalk validated against a sandbox extract.
- Worker-type classification taxonomy (employee, contractor, intern, volunteer, vendor, external); each mapped to license, group scope, and retention.
- Unique-identifier and transformation rules.
- Scoping filter rules — which HR records provision at all.

**Gate:** crosswalk and scoping rules validated against a real sandbox extract; match-key population ≥ 99% on the pilot cohort.

### Phase 2 — Middleware build and test

- Build the transform and the provenance writer.
- Configure the API-driven provisioning application; grant least-privilege permissions.
- Define joiner/mover/leaver lifecycle workflows and their date triggers.
- Prove the chain end-to-end in a test tenant.

**Gate:** joiner, mover, and leaver each run end-to-end in the test tenant with a provenance record and a lifecycle workflow firing.

### Phase 3 — Hybrid go-live

- Deploy the provisioning agent pair (high availability, least-privilege rights — never domain administrator).
- Pre-populate the employee identifier on existing accounts; run the initial full sync with scoping filters; reconcile mismatches **before** enabling deltas.
- Enable delta feeds immediately after initial sync; monitoring and alerting.
- Run a pilot cohort (phased, evidence-gated, security-reviewed).

**Gate:** a full joiner/mover/leaver cycle on the pilot cohort closes with evidence — HR event → directory write → cloud projection → day-2 operations — with zero unmatched-record creations.

### Phase 4 — Cloud-native cutover

- Align cutover to the program schedule.
- As populations become cloud-mastered: retarget provisioning from the on-premises application to the cloud application, flip the mode for those populations, and let the cloud-native edition take over — per population, evidence-gated, with the on-premises leg dormant but intact until nothing remains synced.

**Gate:** cloud-mastered populations run full joiner/mover/leaver cloud-native with evidence; no on-premises writes for migrated populations; rollback path tested once.

## Operating rules

- **One master per attribute.** An attribute is authoritative in exactly one plane. Writeback (if used) carries only identity-plane-mastered values to HR for display; it never touches an HR-mastered fact.
- **Writeback is optional.** The core plan stands without it.
- **No manual edits to organizational attributes.** Any IT-originated write is a drift event.
- **Every event produces a provenance record.** No record, no closure.

---

*Cleaned extraction for project use. No internal branding or document identifiers. Specific program names, contract numbers, and agency references have been generalized.*
