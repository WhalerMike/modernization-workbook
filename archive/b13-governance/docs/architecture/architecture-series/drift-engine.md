# Drift Engine

**How drift is detected and remediated**

Drift is treated as a first-class operational signal, not as an exception. The Drift Engine classifies, prioritizes, and remediates the gap between declared authoritative state and observed runtime reality.

## Five-class taxonomy

| Class | Meaning | Detection surface |
|-------|---------|-------------------|
| Schema | Claim structure no longer matches authoritative schema | Continuous integration |
| Semantic | Structure valid, meaning stale or inconsistent | Runtime |
| Provenance | Provenance envelope incomplete, invalid, or chain broken | Continuous integration + runtime |
| Authorization | Claim transmitted outside authorized envelope | Runtime |
| Identity | Issuer cannot be resolved to a verified identity object | Runtime |

Five is the right number because each class corresponds to a distinct failure mode that requires a distinct remediation contract. Collapsing them loses the ability to assign severity and service-level agreement deterministically.

## Severity model

| Severity | When | Auto-remediate? | SLA |
|----------|------|-----------------|-----|
| P1 (critical) | Active-use claim with provenance or identity drift | No — halt + alert | Immediate |
| P2 (high) | Live schema or semantic drift | Yes, if deterministic | 1 hour |
| P3 (medium) | Drift in dormant or historical claim | Yes | 24 hours |
| P4 (low) | Style or metadata drift, no semantic impact | Yes | 72 hours |

Severity is computed deterministically from the drift class plus the liveness of the affected claim — it is not a judgment call.

## Detection surfaces

### Continuous integration (shipped)
Verifies that declared structures exist and that every referenced document resolves to a real artifact.

### Runtime (target / partial)
Semantic, authorization, and identity detection. Every drift event emits a remediation contract:

```
remediation_contract:
  drift_class: "DRIFT-*"
  severity: "P1|P2|P3|P4"
  detection_timestamp: ISO8601
  auto_remediated: true | false
  remediation_action: "halt | fix | flag | log"
  remediation_evidence: "{commit | audit_record}"
  escalation_path: "named role"
```

## Why this is different from a config-drift tool

1. **Authoritative-origin-anchored, not snapshot-anchored.** Drift is measured against a versioned document, not against an arbitrary “last-known-good” snapshot. The same version always yields the same expected state.
2. **Five-class taxonomy with deterministic severity.** Operators do not triage drift findings; severity is a pure function of class plus liveness.
3. **Remediation contracts are first-class evidence.** Every remediation emits an evidence record that flows into the authorization artifacts. There is no parallel “drift log” disconnected from the package.

## What this means for an authorization package

A drift finding carries a canonical class, a severity computed deterministically, a remediation contract with timestamps and signed evidence, and an escalation path that lands at a named role. Reviewers can re-execute the detection rather than trust a snapshot.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
