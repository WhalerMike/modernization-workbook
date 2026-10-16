# The Adapter Model

**Bringing tools and control planes into a canonical governance surface without absorbing their idiosyncrasies**

The adapter is the substrate’s mechanism for bringing tools and control planes into a canonical governance surface without absorbing their idiosyncrasies into the authoritative source.

## The dual-axis taxonomy

Every adapter declares two attributes:

- **Class**: modernization or conformance.
  - Modernization adapters are change-making. They mutate state in pursuit of a target architecture.
  - Conformance adapters are read-only. They observe state and emit canonical claims; they do not mutate.
- **Mission-class**: one of identity, telemetry, policy, enforcement, or integration. Each adapter belongs to exactly one mission class.

The cross-product yields a 2×5 matrix. Every adapter lands in exactly one cell.

## Why two registries

The two registries reflect a substrate invariant: conformance adapters must not mutate state. The separation is enforced by file, not by field, so a reviewer can verify the invariant before reading a single line of adapter code.

| | Conformance adapter | Modernization adapter |
|---|---------------------|-----------------------|
| Behavior | Observes state, emits canonical claims | Mutates state toward a target architecture |
| Authoritative-source mutation | Never | Governed by canonical change records |

## Canon invariants every adapter inherits

| Invariant | Meaning |
|-----------|---------|
| Boundary | Adapter operates within the declared authorization boundary (or a named exception) |
| Authoritative-source mutation | Conformance never mutates; modernization mutations are governed |
| Certificate-anchored | Claims are certificate-anchored |
| Object-identity-only | Identity claims resolve to identity-plane objects, not to opaque strings |

These are schema-validated on every change.

## Adapter retirement

Adapters do not vanish; they retire. An adapter that is no longer maintained or whose target capability has been superseded transitions through deprecated → retired states with explicit successor pointers. References to retired adapters surface as provenance drift.

This allows the substrate to evolve without forcing a forklift upgrade: retirement is a substrate transition, not a removal.

## What changes for an authorizing official

- Per-adapter evidence trail identifiable by class × mission-class.
- Conformance / modernization separation in the package. Read-only assessor evidence is structurally distinct from change-making evidence.
- Canon invariants verifiable by inspection.
- Retirement traceability. A retired adapter’s evidence remains reproducible from archived state.

## Key takeaways

- Adapters are the substrate’s tool-integration mechanism.
- The dual-axis taxonomy is canonical and enforced.
- Two registries reflect a substrate invariant about mutation authority.
- Four invariants apply to every adapter regardless of vendor.
- Retirement is a governed substrate transition, not a removal.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
