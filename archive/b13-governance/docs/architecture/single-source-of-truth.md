# Single Source of Truth (SSOT)

**The authoritative origin for every identity, addressing, enforcement, telemetry, and governance claim**

The single source of truth is the authoritative origin for every identity, addressing, enforcement, telemetry, and governance object handled by the modernization framework. All other representations are **provenance-anchored pointers**, not copies.

It is the foundation of governed operations, the root of the provenance chain, and the baseline against which every drift class is evaluated.

## Scope

This document defines what the single source of truth **is**, where it **lives**, and how runtime systems are allowed to **consume** it. It does not enumerate every artifact — that inventory lives in the project’s document registry.

## Topology

The authoritative layout places governance artifacts in a version-controlled repository:

| Surface | Role |
|---------|------|
| Governance documents | Single source of truth — policies, plans, evidence |
| Schemas | Schema authority |
| Rules | Consumer rules and validation logic |

The repository is the single source of truth. Runtime systems read from it; they do not write to it except through a governed change process.

## Consumer rule

Runtime code **must** resolve governance artifacts through a stable, package-relative mechanism. This guarantees:

- Artifacts are addressable from any working directory inside the installed system.
- Artifacts survive installation and deployment.
- Artifacts are **read-only at runtime** — the only writers are the governed change process (reviewed pull request) and explicitly designated tooling.

Hardcoded absolute paths and sibling-checkout fallbacks are forbidden outside test fixtures.

## Provenance chain

Every artifact the system produces cites the governance document and version it was derived from:

- Derived artifacts (reports, exports, evidence packets) carry a `provenance` block with `source`, `version`, `derived_at`, and `derived_by`.
- Documents classified as derived require provenance; documents classified as authoritative origins do not derive from anything and are leaves of the chain.
- Cryptographic anchoring uses a content hash over the claim content.

## Drift baseline

Drift is evaluated against the single source of truth:

| Class | Means |
|-------|-------|
| **Schema drift** | Declared structure or registry-cited document does not exist |
| **Semantic drift** | Content changed in a way that weakens a policy invariant |
| **Provenance drift** | A document cites a path that does not resolve |
| **Authorization drift** | Role assignments, delegation scopes, or privilege claims diverge from the authoritative source |
| **Identity drift** | Identity objects cannot be reconciled to the authoritative organizational attributes |
| **Single-source-of-truth contention** | A write is directed at a demoted instance after the single-source-of-truth roster has been ratified |

Severities range from critical to low. A continuous-integration gate fires on any critical finding against the authoritative content.

## Change process

Every modification to the authoritative repository must:

1. Update the document registry.
2. For doctrinal changes (supersession, retirement, scope shift), add a reviewed decision record.
3. Pass governance review before merge.

Direct commits without a reviewed decision record are a governance drift signal.

## Why it matters

Without a single source of truth, every system holds a slightly different copy of the same claim. Over time those copies diverge, and no one can say which is authoritative. With a single source of truth, every other system holds a pointer that can be validated, refreshed, or retired. Drift becomes detectable. Provenance becomes reconstructible. Auditors can ask “what was the authoritative value on this date?” and receive a machine-readable answer.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
