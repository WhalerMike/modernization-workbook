# Change Control and Provenance Doctrine

**Every operational change travels an authorized path that originates from a single source of truth and closes with evidence**

## The five-clause path

Every operational change in the estate — every **Move, Add, Change, Deletion, and Reset (MACD-R)** — travels five clauses, and an operation that skips one is unauthorized by construction:

1. **It originates with the single source of truth.** Work is created by divergence between the source of truth and the estate — a joiner in the HR system of record, a control gap against the compliance baseline, a migration wave in the modernization plan. A task with no single-source-of-truth origin is an ad-hoc assertion: nothing authoritative asked for it, so nothing authoritative can attest it.

2. **It carries an authoritative authorization in the path.** The approval resolves from the authority model, not from whoever is nearby: the owner and approver derive from the same source of truth that originated the work, and any pre-authorized lanes are standing authorizations — recorded grants with scope and expiry, never the absence of approval.

3. **It executes under least privilege, elevated just-in-time.** The executing actor — human or automation — activates a time-boxed, scoped role at execution and holds no standing privilege. The activation record is part of the operation’s evidence, binding *who could act* to *what was done*.

4. **It closes with provenance.** No closure counts unless it carries its proof. The closing update carries the verification payload that justified it — the probe result, the posture query, the re-test output — with a timestamp and the identity of the checking mechanism. A closure record without a verification payload does not validate.

5. **It emits verified, secured evidence — automatically.** The closure record, integrity-protected and carrying its lineage (originating record, authorization, just-in-time activation, verification payload), flows into the continuous-monitoring stream with no human assembly. Evidence a person compiles arrives late and unverifiable; evidence the lifecycle emits arrives continuously and carries its own chain of custody.

The five clauses are one chain: **single-source-of-truth-originated → authoritatively authorized → least-privilege executed → provenance-closed → evidence-emitted back to the reporting plane**.

## Closure Provenance Doctrine

No closure counts unless it carries its proof.

A remediation task, a daily operational check, a plan-of-action milestone, or a control test closed by a human clicking “complete” — with no machine-readable verification attached to the closing record — is prose, not evidence. It asserts that work happened; it proves nothing an assessor can consume.

### Three requirements

1. **Every closure carries provenance.** The closing update carries the verification payload that justified it, with a timestamp and the identity of the checking mechanism. The close *is* the contract: a closure record without a verification payload does not validate.

2. **Human-only closure is an exception state, not a path.** It remains possible — operations need an escape hatch — but it is visibly flagged, counted separately, and never silently aggregated into control tests, continuous-monitoring evidence, or service-level attainment. An attestation pipeline that cannot distinguish probe-backed closures from attested-only ones attests fiction.

3. **Reports are derivations, never compilations.** Every report in the coordination plane — continuous-monitoring roll-ups, plan-of-action aging, patch service-level attainment, evidence feeds — is derived from the closure stream by a generator that can be re-run and diffed. A report that cannot be regenerated from closure records is an artifact of effort, not of state.

## Non-human class sources of truth

The non-human classes that a modernization moves have designated sources of truth of their own:

- **Devices** originate in the asset-lifecycle registry. Device-management enrollment is enforcement, not truth.
- **Declared infrastructure** originates in the infrastructure-as-code repository.
- **Every item migrated must carry a human owner** resolvable in the HR source of truth. An ownerless item is an orphan finding before it is a migration candidate.

## Application at migration scale

A migration wave is a batch of Moves originated by the modernization plan’s source of truth, each executed under a just-in-time role and each emitting per-object closure evidence. This is how a migration stays an audited operation instead of a weekend of standing administrative rights.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
