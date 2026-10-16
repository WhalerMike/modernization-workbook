# Why Governance Fails

**The four structural failure modes of federal governance**

Federal IT governance fails for structural reasons, not for lack of effort. This chapter names the failure modes — fragmented identity context, uncorrelated telemetry, point-in-time evidence, and tool-shaped policy — and explains why each is a substrate problem rather than a tool problem.

## The four structural failure modes

### Fragmented identity context
Identity claims live in a primary directory but are consumed by every other plane — addressing, network, telemetry, security, compliance — and each consumer holds its own freshness assumption. The same identity may be “current” in one plane and “stale” in another at the same instant. Cross-plane decisions degrade to lowest-common-denominator attestation because there is no canonical resolution moment.

### Uncorrelated telemetry
Each tool emits telemetry in its own shape. Combining the streams into a single control narrative is a manual exercise repeated at every audit cycle. The combination is not reproducible from raw telemetry plus the authoritative source — it is reproducible only from the combination itself, which is never shipped as a primary artifact.

### Point-in-time evidence
Authorization packages capture a snapshot at the moment of assembly. Between assemblies, drift is invisible to the package. Re-assembly is a re-engineered exercise rather than a deterministic regeneration.

### Tool-shaped policy
Policy intent gets recorded in the tool that enforces it. Move the tool, lose the policy. Replace the vendor, re-author the policy. Migrate to a new platform, re-discover the policy from a thousand configuration files. The intent never had a canonical home, so it cannot survive a substrate transition.

| Failure mode | Looks like a… | Actually requires (substrate-level) |
|--------------|----------------|-------------------------------------|
| Fragmented identity context | directory problem | Canonical resolution rules that cross all planes |
| Uncorrelated telemetry | SIEM problem | A canonical claim shape every component emits before the SIEM |
| Point-in-time evidence | GRC-tool problem | Deterministic regeneration from the authoritative source plus telemetry |
| Tool-shaped policy | policy-engine problem | Separating policy intent, mapping, and enforcement |

## Why more tooling cannot fix it

Each failure mode looks like a tooling gap. None of them is. The identity-context problem is not solved by a better directory; it is solved by canonical resolution rules that cross all planes. The telemetry-correlation problem is not solved by a better SIEM; it is solved by a canonical claim shape that every component emits before it hits a SIEM. The evidence problem is not solved by a better GRC tool; it is solved by deterministic regeneration from the authoritative source plus telemetry. The policy-shape problem is not solved by a better policy engine; it is solved by separating policy intent from policy mapping from policy enforcement.

> The common factor: every fix lives below the tooling layer. Without a substrate, the program rebuilds the same fixes per tool, per migration, per audit cycle.

## What this chapter does not claim

It does not claim agencies are unsophisticated. The teams running federal modernization programs are typically capable and well-resourced. The failure modes here are not personnel failures — they are structural properties of an environment that has tooling but lacks a substrate.

It also does not claim any particular product is the only possible substrate. It claims that some substrate is required, and that the four failure modes above are the diagnostic list a program can use to assess whether its current substrate is sufficient.

## Key takeaways

- Federal governance failure is structural, not procedural.
- Four failure modes recur: fragmented identity, uncorrelated telemetry, point-in-time evidence, tool-shaped policy.
- Each failure mode lives below the tooling layer; tooling cannot fix any of them.
- A substrate is required.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
