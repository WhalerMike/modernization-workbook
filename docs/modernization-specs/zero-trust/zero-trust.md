---
title: "Zero Trust Modernization Spec"
subtitle: "Zero trust implementation governance specification"
doc-type: modernization-spec
audience: [Customer, Architect, Assessor]
canon-source: "src/fmp/canon/adr/adr-008-zero-trust-identity.md"
canon-reference:
  - "docs/customer-documents/whitepapers/zero-trust-governance-whitepaper.qmd"
  - "docs/customer-documents/executive-briefs/zero-trust-overview.qmd"
derived-from: "fmp canon"
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-11-22
---

# Zero Trust Modernization Spec


## Scope

Cross-adapter specification for Zero Trust modernization under the
The Federal Modernization Program substrate. Covers ZTMM pillar mapping, identity-as-root-namespace
posture, runtime policy decision/enforcement, and the canonical claim
emissions ZT adapters must produce. The companion narrative is the
[Zero Trust Governance Whitepaper](../../whitepapers/zero-trust-governance-whitepaper.md).

## Substrate contract

Zero Trust adapters span all five ZTMM pillars but inherit the
substrate's identity-first posture per
the program decision:

- **Identity is the root namespace.** Devices, addresses, workloads,
  and data classifications are *named* via identity; they do not
  carry parallel naming systems.
- **Decisions are computed, not assigned.** Policy decision points
  (PDP) consume identity claims plus context; access is the result,
  not a stored attribute.
- **Evidence is per-claim.** Each ZT decision emits a canonical claim
  with the full provenance envelope.

## Pillar coverage

| Pillar | the Federal Modernization Program contribution | Adapters |
|---|---|---|
| Identity | Identity-plane SSOT | `entra-id`, `active-directory`, `piv-usaccess` |
| Devices | Device claims via provenance envelope | `intune`, `azure-arc` |
| Networks | Identity-derived addressing | `bluecat-address-manager`, `infoblox` |
| Apps & Workloads | Adapter taxonomy + KSI mappings | adapter fleet (broad) |
| Data | Provenance envelope on every claim | evidence chain |

## Integration shape

ZT adapters emit a decision-record claim shape:

```yaml
provenance:
  ...
zt_decision:
  pdp_id: "{policy_decision_point}"
  decision: "permit | deny | escalate"
  identity_context: "{issuer_identity}"
  resource_scope: "{resource_id}"
  policy_refs:
    - "{canon_policy_id}"
  evaluation_timestamp: ISO8601
```

Decisions are auditable per-claim; aggregations (e.g. ZTMM dashboards)
are derived from these claims, not authored independently.

## Control mapping

Maps onto:

- **NIST 800-207** Zero Trust Architecture core tenets.
- **CISA ZTMM** five pillars (Identity, Devices, Networks,
  Applications & Workloads, Data) and four maturity stages.
- **NIST 800-53** AC, IA, AU, SI families.
- **OMB M-22-09** federal Zero Trust strategy.

KSI bindings live under `src/fmp/rules/ksi/iam/` plus pillar-specific
locations.

## Drift considerations

- **`DRIFT-IDENTITY`** — issuer cannot resolve; halt and alert per
  ZTMM "deny by default" posture.
- **`DRIFT-AUTHZ`** — decision recorded outside consent envelope;
  P1/P2 depending on liveness.
- **`DRIFT-SEMANTIC`** — pillar state structurally valid but
  semantically stale (e.g. policy refers to retired role).
- **`DRIFT-PROVENANCE`** — cross-pillar correlation chain broken.

## Operational tempo

ZT decisions are P1-sensitive: a decision emitted with broken
provenance must halt immediately. The substrate's tempo
(P1 immediate / P2 1hr / P3 24hr / P4 72hr) applies; ZT operations
typically focus on the P1/P2 envelope.

## Honest limits

- Optimal ZTMM maturity requires continuous, automated, cross-pillar
  policy evaluation. The substrate ships the canonical fabric that
  makes this tractable; per-pillar runtime maturity varies by
  adapter.
- Some ZT analytics that commercial M365 customers consume as
  platform features are unavailable in GCC-Moderate (per the
  [Boundary Impact Model](../../architecture/boundary-impact-model.md)).
  Compensating-enforcement adapters fill the gaps; the spec does not
  paper over them.
- Decision-record retention is canonical (per adapter
  `retention-years` field); programs operating beyond that need
  archival outside the substrate.

## Validation pairing

Pairs with the
Zero Trust Validation Suite.

## Related documents

- Modernization Specs Index
- [Whitepaper: Zero Trust Governance](../../whitepapers/zero-trust-governance-whitepaper.md)
- [Executive Brief: Zero Trust Overview](../../executive-briefs/zero-trust-overview.md)
- the program decision: Zero Trust Identity
