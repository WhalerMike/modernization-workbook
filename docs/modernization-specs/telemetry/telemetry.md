---
title: "Telemetry Modernization Spec"
subtitle: "Telemetry pipeline governance specification"
doc-type: modernization-spec
audience: [Customer, Architect, Assessor]
canon-source: "docs/docs/15_ProvenanceProfile.qmd"
canon-reference:
  - "src/fmp/canon/adr/adr-006-evidence-determinism.md"
  - "src/fmp/canon/adr/adr-016-evidence-bundle-lifecycle.md"
  - "docs/customer-documents/architecture-series/evidence-chain.qmd"
derived-from: "fmp canon"
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-11-22
---

# Telemetry Modernization Spec


## Scope

Cross-adapter specification for telemetry modernization under the
The Federal Modernization Program substrate. Covers the canonical claim shape, provenance envelope
requirements, evidence pipeline integration, and the determinism
guarantees telemetry adapters must honor. This spec is the substrate
contract every telemetry-emitting adapter inherits, regardless of
mission-class.

## Substrate contract

Every telemetry-emitting adapter inherits:

- **`mission-class: telemetry`** (or telemetry as secondary concern).
- **Provenance envelope per FMP_PP_001** — every claim carries the
  full envelope (claim_id, issuer_identity, source_classification,
  extraction_timestamp, transformation_chain, lineage_hash,
  schema_version, signature).
- **Determinism per the program decision** — no silent drops, append-only, ordered,
  idempotent.
- **Lifecycle per the program decision** — assemble → seal → submit → close.
- **`evidence-class`** — `point-in-time` or `interval` declared in
  the adapter registry entry.
- **`retention-years`** — canonical, not operator-chosen.

## Adapters in scope (Phase 1+)

| Adapter | Mission | Notes |
|---|---|---|
| `scubagear` | policy (telemetry-emitting) | Interval evidence; M365 SCuBA |
| `vuln-scan` | telemetry | Vulnerability state observer |
| `patch-state` | telemetry | Patch state observer |
| `stig-compliance` | policy (telemetry-emitting) | STIG baseline evaluation |
| `azure-arc` | telemetry | Hybrid management telemetry |
| `intune` | telemetry (configuration) | Endpoint configuration claims |

The list expands as new telemetry adapters register.

## Integration shape

Canonical claim emission shape:

```yaml
provenance:
  claim_id: "urn:fmp:claim:{domain}:{event_type}:{uuid}"
  issuer_identity: "{adapter_runtime_identity}"
  source_system: "{system_name}:{version}"
  source_classification: "authoritative | derived | synthesized"
  extraction_timestamp: ISO8601
  extraction_method: "api | batch | stream | manual"
  transformation_chain: [...]
  lineage_hash: "{SHA-256}"
  schema_version: "1.0"
  signature: "{mTLS thumbprint}"
event:
  event_type: "{canonical_event_kind}"
  observed_at: ISO8601
  payload:
    {schema-validated event body}
```

Adapters that produce telemetry without this envelope cannot register;
the schema gate rejects the entry.

## Control mapping

Maps onto:

- **NIST 800-53** AU (Audit & Accountability), SI (System & Information
  Integrity).
- **FedRAMP CR26** continuous monitoring controls.
- **OMB M-26-14** federal log retention (six months actively searchable, one year retrievable; rescinded M-21-31 on 22 May 2026).

KSI bindings under `src/fmp/rules/ksi/monitoring-logging/`.

## Drift considerations

- **`DRIFT-PROVENANCE`** — telemetry's primary drift surface;
  envelope chain breakage is `P1`/`P2` depending on liveness.
- **`DRIFT-SCHEMA`** — event payload structure mismatch; `P2` typical.
- **`DRIFT-SEMANTIC`** — event meaning stale (e.g. retired field
  still emitted); `P3`/`P4`.

## Operational tempo

Telemetry adapters are continuous-emission by design (where the
adapter's `evidence-class` is `interval`, "continuous" means "every
interval without gap"). Gaps in expected emission cadence are
themselves drift findings.

## Honest limits

- Continuous event-time capture across all adapters is target state.
  Adapters today operate in interval mode (e.g. ScubaGear) or
  continuous mode depending on implementation maturity.
- Cryptographic signing with agency-issued certificates is design-
  only across the fleet; the envelope reserves the field, but
  end-to-end signing is engineering ahead.
- Telemetry retention is canonical (per adapter); programs needing
  longer retention archive outside the substrate.

## Validation pairing

Pairs with the
Telemetry Validation Suite.

## Related documents

- Modernization Specs Index
- Architecture Series — Evidence Chain
- Provenance Profile (canon)
- the program decision: Evidence Determinism
- the program decision: Evidence Bundle Lifecycle
