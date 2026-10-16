# Governance at Scale

**Scaling across adapters, programs, and authorization boundaries**

Substrate-level governance has to scale across hundreds of adapters, thousands of controls, multiple authorization boundaries, and many concurrent modernization programs without devolving into per-program exceptions.

## What stays small

Three substrate properties are deliberately kept small at scale:

1. **The authoritative source.** Schemas, decision records, and numbered governance documents. Adding a document requires allocation and (for doctrinal changes) a formal decision. The substrate is designed so the authoritative source does not linearly inflate with the program.
2. **The drift taxonomy.** Five classes, not fifty. Severity is four levels, not twelve. Adding a class would require a formal decision and substrate-wide schema migration.
3. **The interface surface.** New commands live under existing domains; no flat top-level commands. The interface shape is invariant under feature growth.

These three are the substrate’s stability anchors.

## What is allowed to grow

1. **Adapters.** New adapters land in the appropriate registry with schema validation. The registries are append-only at the structural level (retirement is a state, not a deletion).
2. **Policy mappings.** Control-to-rule bindings and adapter-to-mission-class declarations grow with the substrate’s coverage of an agency’s tool stack.
3. **Evidence emissions.** Authorization artifacts, dashboard entries, and drift findings grow continuously as the substrate runs.

Growth is structural: each new entry conforms to the canonical schema, is validated continuously, and inherits the substrate’s invariants automatically.

## Multi-program scaling

A substrate hosting many concurrent programs scales by:
- Per-program artifacts under shared schemas.
- Per-program adapter registration. New adapters declare their class × mission-class and inherit the invariants.
- Per-program drift findings. Findings are scoped per program but emitted into the same canonical taxonomy.

> Three programs, three programs’ worth of evidence — but one substrate, one taxonomy, one continuous-integration surface.

## The boundary multiplicity problem

Federal agencies operate across multiple authorization boundaries. The substrate scales across boundaries by treating each as a first-class canonical object rather than as an implicit assumption. Adding a new boundary is a substrate transition, not a runtime flag — and it ships with its authorizing decision.

## What does not scale automatically

- Authoritative-source authoring. Authoring quality source is human work. The substrate scales the consumption of the source, not its production.
- Adapter implementation. Each new tool requires an adapter; the substrate provides the contract, but vendors and agencies provide the per-tool code.
- Cross-program human review. Authoritative-source-change decisions scale by governance discipline, not by tooling.

## Key takeaways

- Scaling holds the authoritative source small while letting adapters and mappings grow.
- Multi-program scaling reuses one substrate, one taxonomy, one continuous-integration surface.
- Boundaries are first-class canonical objects, not implicit assumptions.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
