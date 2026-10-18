---
title: "SASE Modernization Spec"
subtitle: "Secure Access Service Edge governance specification"
doc-type: modernization-spec
audience: [Customer, Architect, Assessor]
canon-source: "src/fmp/canon/modernization-registry.yaml"
canon-reference:
  - "docs/customer-documents/architecture-series/six-plane-architecture.qmd"
  - "docs/customer-documents/architecture-series/boundary-impact-model.qmd"
derived-from: "fmp canon"
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-11-22
---

# SASE Modernization Spec


## Scope

Cross-adapter specification for Secure Access Service Edge (SASE)
modernization under the Federal Modernization Program substrate. SASE replaces perimeter-and-VPN
remote access with identity-driven, network-overlay security delivered
as a converged service. This spec defines the substrate contract that
SASE adapters must honor: identity-derived addressing, certificate-
anchored overlay, and canonical claim emission for access decisions.

## Substrate contract

SASE adapters span the Identity, Network, Addressing, and Security &
Compliance planes (per
Six-Plane Architecture).
They inherit:

- **Identity-derived access** — every access decision consumes
  identity claims as authoritative input; SASE PDPs do not maintain
  parallel identity authority.
- **Certificate-anchored overlay** — the network overlay binds to
  certificates from the identity plane, not to per-device IPSec PSKs
  or location-based trust.
- **Decision-record emission** — every access decision is a canonical
  claim with the full provenance envelope.

## Adapter shape

SASE adapters declare:

- `mission-class`: `enforcement` (PDP/PEP role) or `integration`
  (CASB / SWG / DLP integration role).
- `class`: `modernization` (replacing legacy VPN / perimeter) or
  `conformance` (observing SASE-vendor policy state).
- `gcc-boundary` per adapter — most SASE vendor services require
  careful boundary treatment.

## Integration shape

```yaml
provenance:
  ...
sase_decision:
  pdp_id: "{sase_policy_decision_point}"
  decision: "permit | deny | escalate"
  identity_context: "{issuer_identity}"
  resource_scope: "{application_id | url | dns_name}"
  network_overlay: "{overlay_id}"
  certificate_thumbprint: "{cert_id}"
  policy_refs:
    - "{canon_policy_id}"
  evaluation_timestamp: ISO8601
```

## Control mapping

Maps onto:

- **NIST 800-207** Zero Trust Architecture (SASE is one realization).
- **NIST 800-53** AC, SC, IA families.
- **FedRAMP CR26** access-control and boundary controls.
- **CISA ZTMM** Networks and Applications & Workloads pillars.

## Drift considerations

- **`DRIFT-IDENTITY`** — SASE PDP receives an unresolvable identity
  claim; halt + alert (P1).
- **`DRIFT-AUTHZ`** — decision recorded outside the consent envelope.
- **`DRIFT-PROVENANCE`** — overlay certificate fails to bind to
  identity-plane object.
- **`DRIFT-SCHEMA`** — vendor policy schema diverges from canonical
  shape.

## Honest limits

- SASE vendor maturity in GCC-Moderate varies. Programs may need
  compensating-mechanism declarations for vendor features unavailable
  in-boundary.
- Certificate-anchored overlay requires the agency PKI to issue
  certificates bound to identity-plane objects. Programs without
  identity-bound certificate issuance cannot fully realize the
  spec.
- Some SASE vendor PDPs do not emit decision records natively; the
  adapter shape may require synthesis from logs, with explicit
  `source_classification: derived` per claim.

## Validation pairing

Pairs with the
SASE Validation Suite.

## Related documents

- Modernization Specs Index
- Architecture Series — Six-Plane Architecture
- [Architecture Series — Boundary Impact Model](../../architecture/boundary-impact-model.md)
- Modernization Registry (canon)
