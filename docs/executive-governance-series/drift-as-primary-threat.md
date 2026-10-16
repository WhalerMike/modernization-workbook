# Drift as the Primary Threat

**Silent divergence between declared state and observed runtime**

In a substrate-anchored governance model, drift is the single largest threat vector. Not phishing, not supply chain, not insider risk — those are concerns the substrate helps surface, but the governance threat is the one most agencies track least: silent divergence between declared authoritative state and observed runtime.

## Why drift is the primary threat

1. **It is continuous.** Drift accumulates every time a configuration changes, a component version updates, a schema evolves, or an identity is provisioned. Other threats are events; drift is a persistent gradient.
2. **It is silent.** Without explicit detection, drift has no operational signal. The substrate continues to report the declared state while runtime reality diverges.
3. **It is the surface other threats exploit.** A phishing attack succeeds because drift opened a permission path. A supply-chain compromise propagates because drift hid the canonical version. An insider acts because drift attenuated the consent envelope.

> The fix is not “watch for the events” — it is to make drift itself a first-class signal so the events have nowhere to hide.

## The five-class taxonomy

| Class | What it means |
|-------|---------------|
| Schema | Claim structure no longer matches authoritative schema |
| Semantic | Structure valid; meaning is stale or inconsistent |
| Provenance | Provenance envelope incomplete or chain broken |
| Authorization | Action emitted outside authorized consent envelope |
| Identity | Issuer cannot be resolved to a verified identity object |

Each class corresponds to a distinct failure mode that requires a distinct remediation contract. Collapsing them into “configuration drift” loses the ability to assign deterministic severity.

## From taxonomy to operational discipline

1. **Detect deterministically.** Continuous integration emits schema and provenance findings. Runtime components emit semantic, authorization, and identity findings as they execute.
2. **Classify deterministically.** Severity is a pure function of class plus liveness — operators do not triage.
3. **Remediate via contract.** Every drift event emits a remediation contract that flows into the canonical evidence chain.
4. **Treat findings as evidence.** Drift findings are not a parallel log; they are first-class artifacts in the authorization package.

## What changes for the SOC

| Severity | Typical class | Response |
|----------|---------------|----------|
| P1 | Authorization or identity drift | Halt and alert immediately |
| P2 | High-severity drift | Auto-remediate when deterministic; otherwise escalate within an hour |
| P3 / P4 | Medium / low drift | Queue for auto-remediation within 24 / 72 hours |

The SOC’s work shifts from “find drift” to “tune the classifier and respond to escalations.” Most drift is auto-remediated by the component that detected it; only the human-judgment subset reaches the SOC.

## What changes for the authorizing official

- Visibility between audits.
- Deterministic severity.
- Per-finding evidence with hash-verifiable provenance.
- Trend analysis as a measurable property of program health.

## Honest limits

- Schema and provenance drift can ship in continuous integration today; semantic, authorization, and identity drift detection at runtime is partial.
- Auto-remediation is bounded to deterministic fixes. Drift that requires human judgment escalates.
- The substrate detects drift against the authoritative source. If that source is silently wrong, the substrate will faithfully report no drift.

## Key takeaways

- Drift is the primary governance threat, not a secondary concern.
- The five-class taxonomy is canonical and deterministic.
- The discipline is detect → classify → remediate via contract → emit as evidence.
- For the authorizing official, drift findings are a continuous signal between audits.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
