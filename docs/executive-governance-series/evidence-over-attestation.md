# Evidence over Attestation

**Inverting which artifact is primary**

Attestation is a human signing that something is true. Evidence is a machine-verifiable artifact showing that it is. The substrate treats evidence as the primary artifact and attestation as a supplemental layer rather than the other way around.

## What attestation is and is not

An attestation is a person (or a designated body) signing that, at a moment, a system is in a stated condition. It is necessary for some purposes — accountability, formal authorization, legal liability — and the substrate does not eliminate it.

What attestation is not:
- A reproducible verification of substrate truth.
- A continuous signal between attestation events.
- A hash-bound proof an assessor can re-execute.

Treating attestation as the primary artifact pushes those three properties out of the package. The substrate inverts the priority: machine evidence is primary, attestation is the human review wrapper on top.

| | Attestation | Evidence |
|---|-------------|----------|
| What it is | A human signing that something is true | A machine-verifiable artifact showing it is |
| Temporal scope | Point-in-time | Continuous between events |
| Verification | Re-read | Re-execute and hash-check |
| Role | Human accountability wrapper | Primary artifact |

## What evidence means

Every claim carries a full provenance envelope: claim identifier, issuer identity, source classification, extraction timestamp and method, transformation chain, lineage hash, schema version, signature.

Two structural properties matter:
1. Source classification is canonical. A claim is authoritative, derived, or synthesized. The classification is verifiable by re-executing the component.
2. Transformation chain is append-only. Once a step is recorded and signed, it cannot be removed or reordered.

> An assessor can re-execute and verify; an attestation can only be re-read. That is the whole of the inversion.

## What changes for the assessor

- Independent re-execution.
- Per-claim source classification.
- Tamper-evident lineage.
- Drift-coupled remediation.

Attestations remain in the package. They are no longer the primary verification surface.

## What changes for the operator

- Evidence is regenerable.
- Attestation work shrinks. Humans attest at the authoritative-source-change layer, not per-control-per-cycle.
- Audit-prep cost drops. Bundles assemble deterministically.

## What does not change

- Authorizing officials still authorize. The substrate emits evidence; it does not replace judgment.
- Authoritative-source stewards still author the source. Determinism is faithful to the source, not a check on it.
- Humans still review evidence at audit boundaries. The review becomes a higher-leverage activity.

## Key takeaways

- Attestation and evidence are different artifacts; the substrate inverts which is primary.
- The provenance envelope makes evidence reproducibly verifiable in a way attestations cannot be.
- For the assessor, verification becomes a re-run.
- For the operator, audit-prep cost drops; authoritative-source-change discipline becomes the primary review surface.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
