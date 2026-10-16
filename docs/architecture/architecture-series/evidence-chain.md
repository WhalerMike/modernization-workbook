# Evidence Chain

**Turning telemetry into assessor-ready evidence with traceable provenance**

The evidence chain turns runtime telemetry into assessor-ready compliance artifacts with traceable provenance at every step. The chain is deterministic: same inputs, same authoritative version, same evidence bundle.

## Four-stage pipeline

1. **Telemetry event capture** — components at the system boundary emit structured events. Each event carries authoritative source classification from the moment of emission.
2. **Canonical claim normalization** — every event is wrapped in a provenance envelope. This is the chain’s structural backbone.
3. **Evidence bundle assembly + sealing** — claims are grouped into bundles (assemble → seal → submit → close). Bundles enforce hash-bearing provenance at item and bundle scope.
4. **Structured artifact emission** — sealed bundles feed the pipeline that emits authorization artifacts, with every field traceable back to the originating claim.

## Provenance envelope

Every claim carries:

```
provenance:
  claim_id: "urn:claim:{domain}:{claim_type}:{uuid}"
  issuer_identity: "{identity_object_id}"
  source_system: "{system_name}:{version}"
  source_classification: "authoritative | derived | synthesized"
  extraction_timestamp: ISO8601
  extraction_method: "api | batch | stream | manual"
  transformation_chain: [ ... ]
  lineage_hash: "{SHA-256 of source record}"
  schema_version: "1.0"
  signature: "{certificate thumbprint}"
```

Three properties matter for review:
1. **Source classification is canonical.** A claim is authoritative, derived, or synthesized — and a reviewer can verify the classification by re-executing the component.
2. **Transformation chain is append-only.** Once a step is recorded and signed, it cannot be removed or reordered.
3. **Lineage hash is per-claim.** Every claim hashes its source record at extraction time. The bundle hash is computed over those hashes, giving a tamper-evident tree.

## Determinism guarantees

- **No silent drops.** Every input event is either accepted, rejected with reason, or queued — never silently lost.
- **Append-only writes.** Evidence storage is immutable; updates are new records that supersede prior ones with explicit provenance.
- **Ordered records.** Replays produce identical ordering.
- **Idempotent ingestion.** Re-ingesting the same source record twice yields the same canonical claim, not a duplicate.

The operational consequence: the same authoritative version processing the same input bundle always produces a byte-identical evidence bundle. A reviewer can re-run the assembly months later and verify the bundle hash matches the original.

## What this means for an authorization package

1. **Independent re-execution.** The bundle can be regenerated from the authoritative source and source data without the original operator’s involvement.
2. **Per-claim source classification.** Authoritative claims are distinguished from derived claims at the field level, not in narrative prose.
3. **Tamper-evident lineage.** The hash tree binds every claim to a source record; modification anywhere in the chain breaks the bundle hash.
4. **Drift-coupled.** A provenance drift finding directly identifies the affected claim(s) in the evidence bundle, so remediation is scoped.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
