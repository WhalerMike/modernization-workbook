# Verification — Chapter 07, Evidence Over Attestation

Checked October 21, 2026 by writer W4. Sources: `docs/executive-governance/ch06-evidence-over-attestation/index.md` (856 words), `docs/architecture/evidence-chain.md` (1,149 words) and `docs/executive-briefs/evidence-fabric-overview.md` (373 words). All three are archived after the book is built and aren't linked. Determinism properties, the bundle lifecycle and canonical serialization are already carried by Chapter 05 (W3), so this chapter links them instead of repeating them; the evidence record's fields and join key are in Book 12 Ch02, CA-7 metrics and retention in Book 12 Ch12, and the worked ScubaGear trace in Book 11 Ch09. Control text comes from NIST's OSCAL catalog (SP 800-53 Rev. 5, release 5.2.0). SP 800-53A and SP 800-37 were read from the NIST PDFs. FedRAMP rules were read on fedramp.gov/2026. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Attestation is a person signing a condition at a moment; necessary for accountability; not reproducible, not continuous, not re-executable | Two artifacts | restated-as-design | Source ch06 (program argument) |
| 2 | Evidence primary, attestation the accountability wrapper | Two artifacts | restated-as-design | Source ch06; labeled as the program's position |
| 3 | 800-53A methods: examine, interview, test | Federal guidance | verified | SP 800-53A Rev. 5, App. C |
| 4 | 800-53A desired-state specification strategy; lockout 3 vs 5 example; "security-related information generated from ISCM activities is equivalent to security control assessment results"; three prerequisites; automated tools use the test method, supplementable by interview/examine/manual test | Federal guidance | verified (new) | SP 800-53A Rev. 5, App. F and footnote 64 |
| 5 | 800-37: a comparable report from a management and reporting tool constitutes the assessment report | Federal guidance | verified (new) | SP 800-37 Rev. 2, footnote 108 |
| 6 | 800-37: automated tools may not cover every control; manual assessments fill gaps | Federal guidance; what doesn't change | verified (new) | SP 800-37 Rev. 2, App. F, "Information Generation, Collection, and Independence Requirements" |
| 7 | FedRAMP IVV-IAS-VIM: assessors verify implemented measures match documented; note "don't simply review documentation or screenshots" | Federal guidance | verified (new) | fedramp.gov/2026 IVV ruleset |
| 8 | FedRAMP IVV-CSO-USR: providers may use representative samples; note that services with effective automation can persistently verify most measures and don't need sampling | Federal guidance | verified (new) | fedramp.gov/2026 IVV ruleset |
| 9 | FedRAMP CPO-CSX-CPM: 20x packages maintained with automation as changes occur; Class A every 3 months (SHOULD) to Class D every week; note says no persistent human review expected | Federal guidance | verified (new) | fedramp.gov/2026 Certification Package Overview |
| 10 | KSI-SVC-VRI: use cryptographic methods to validate integrity of machine-based information resources | Federal guidance | verified (new) | fedramp.gov/2026 Key Security Indicators |
| 11 | FedRAMP rules govern cloud offerings, providers and assessors, not agencies' own systems | Federal guidance | verified | Settled fact (Book 10 Ch03, Book 12 Ch12); fedramp.gov/2026 structure |
| 12 | Four-stage chain: capture, normalize, assemble and seal, emit | Evidence chain | restated-as-design | Source evidence-chain.md, evidence-fabric brief |
| 13 | Adapters declare mission and boundary so captured events carry source classification | Evidence chain | restated-as-design | Source evidence-chain.md stage 1 |
| 14 | OSCAL models: SSP, component definition, assessment results, POA&M (periodic or continuous assessment) | Evidence chain | verified | NIST OSCAL "Layers and Models Reference" |
| 15 | Source: outputs include "KSI dashboard artifacts" | Evidence chain | restated-as-design | Not carried as a separate artifact; KSIs bind providers (settled fact). Ch05 already lists indicator reports |
| 16 | Drift findings and remediation contracts enter the chain as claims | Evidence chain | restated-as-design | Source ch06/evidence-chain "drift-coupled"; Ch06 remediation contract |
| 17 | Provenance envelope fields (claim_id … signature) | Provenance envelope | restated-as-design / corrected | Source envelope (program design). Two fields added: `previous_step_hash` in each transformation step and `signer_certificate` separate from `signature` (see 18, 19) |
| 18 | Source: `signature: "{mTLS certificate thumbprint}"` | Provenance envelope | corrected | A thumbprint is a client-computed hash of the certificate (SHA-1 for the .NET property) and "does not physically exist in the certificate"; it identifies, it doesn't sign. Microsoft Learn, X509Certificate2.Thumbprint |
| 19 | Source: transformation_chain is append-only, cannot be removed or reordered | Provenance envelope; integrity | corrected | Restated: append-only is checkable only if each step binds the previous step's hash (design addition) |
| 20 | source_classification authoritative / derived / synthesized, verifiable by re-running the adapter | Provenance envelope | restated-as-design | Source ch06, evidence-chain.md. "Synthesized" defined as program-produced (defaults, inference): design reading |
| 21 | Re-execution producing a different chain is a provenance drift finding | Provenance envelope | restated-as-design | Source; mapped to Ch06's five-class model |
| 22 | Hash changes on any byte change; bundle hash over claim hashes gives a tamper-evident tree | Integrity | restated-as-design | Source evidence-chain.md (design); hash property is general cryptography, no product claim |
| 23 | OSCAL back-matter resource links can carry hashes "for verification and change detection"; SHA-2 and SHA-3 algorithms listed | Integrity | verified (new) | OSCAL Reference v1.2.3, catalog JSON definitions |
| 24 | A hash doesn't show who produced data | Integrity | restated-as-design | General reasoning; contrast with FIPS 186-5 |
| 25 | FIPS 186-5: signatures detect unauthorized modification and authenticate the signatory | Integrity | verified (new) | FIPS 186-5 abstract (Feb 3, 2023) |
| 26 | Canonical serialization needed for reproducible hashes | Integrity | verified (linked) | Carried by Ch05 (RFC 8785 cited there); linked, not repeated |
| 27 | AU-9, AU-9(3), AU-10, SI-7, SR-4 text | Integrity | verified (new) | SP 800-53 Rev. 5 catalog 5.2.0 |
| 28 | M-26-14 maturity model: logs "encrypted in transit and at rest, and regularly hashed for veracity" | Integrity | verified | M-26-14 App. C (also used by Book 12 Ch02) |
| 29 | Four assessor properties: re-execution, per-claim classification, tamper-evident lineage, drift-coupled scope | Assessor | restated-as-design | Source ch06 and evidence-chain.md. 800-53A method column added (program reading) |
| 30 | Source: "A 3PAO assessing an FMP-anchored package" | Assessor | corrected | Generalized to "an assessor": 3PAO is FedRAMP's term for cloud service assessments; an agency system's assessor is the control assessor (SP 800-37). Program name removed |
| 31 | 800-53A reuse considerations: changing conditions, time elapsed, independence; coordinated with and approved by users; date and type documented | Assessor | verified (new) | SP 800-53A Rev. 5 §3.2.3.5 |
| 32 | Assessor should perform the re-run for independence | Assessor | restated-as-design | Program reading of 800-53A §3.2.3.5 |
| 33 | Source: byte-identical bundle; 3PAO re-runs months later without the operator | Assessor; Ch05 link | restated-as-design | Carried in Ch05; here linked, with the dependency on archived inputs and toolchain stated in limits |
| 34 | Attestation moves to rule/record change layer; audit-prep cost drops | What changes | restated-as-design | Source ch06 operator section. "ADR layer" translated to "changes to the rules and the record" |
| 35 | Source: "team does not have to preserve point-in-time bundles indefinitely" | What changes | corrected | Restated with the condition that inputs must be retained per the records schedule (consistent with Ch05) |
| 36 | AO still authorizes; only the AO accepts residual risk | What doesn't change | verified | Settled fact, Book 01 Ch09 |
| 37 | Some controls (policy approval, training, physical, contract) remain attestations | What doesn't change | restated-as-design | Program reading, anchored to SP 800-37 App. F (row 6) |
| 38 | Interval evidence (ScubaGear) deterministic per interval, not continuous; continuous capture target state | Limits | restated-as-design | Source ch06 limits, evidence-chain maturity table; consistent with Book 11 Ch09 |
| 39 | Signing with agency-issued certificates design-only | Limits | restated-as-design | Source maturity table ("DESIGN-ONLY") |
| 40 | Source maturity table: envelope schema, bundle schema, OSCAL generators "SHIPPED" | Limits | removed | Internal ship status of the program's tooling with internal schema names; not carried as a table. Ch05 and Ch06 state build status where it matters |
| 41 | Source: two-tier storage Active ≤ 90 days, Archive 3–7 years; countersignature; correlation engine | — | removed | Design detail of storage tiers; retention is Book 12 Ch12's subject and is governed by M-26-14 and the records schedule there. Linked instead |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ch06 "In this chapter" | Opening; "Two artifacts, two questions" | — |
| ch06 "What attestation is and is not" | "Two artifacts, two questions" | — |
| ch06 "At a glance" table | Attestation and evidence table (expanded) | — |
| ch06 "What 'evidence' means in canon" | "The provenance envelope" | Internal profile ID dropped |
| ch06 "What changes for the assessor" | "What an assessor can verify" | — |
| ch06 "What changes for the operator" | "What changes, and what doesn't" | — |
| ch06 "What does not change" | "What changes, and what doesn't" | "Canon stewards … ADRs" translated to people owning the rules |
| ch06 "Honest limits" | "Honest limits" | — |
| ch06 "Key takeaways" | "Key takeaways" | Rewritten |
| ch06 "Continue the series" / "Related documents" | Continue-the-book callout | Old series links not carried |
| evidence-chain intro and figures (four-stage, intake, hash tree, write side) | "The evidence chain"; figures ch07-evidence-chain and ch07-integrity-layers | Old PNG/SVGs replaced by house-style sources; intake and write-side figures not redrawn (internal component names) |
| evidence-chain "Four-stage pipeline" | "The evidence chain, from source to package" | "Truth Fabric" / "Canonical State Store" names dropped |
| evidence-chain "Provenance envelope" | "The provenance envelope" | Corrected (claims log 17–19) |
| evidence-chain "Determinism guarantees" | Linked to Ch05 "How the pipeline keeps determinism" | Already carried by Ch05 |
| evidence-chain "What ships today" | "Honest limits" | Ship table removed (claims log 40) |
| evidence-chain "What this means for an ATO package" | "What an assessor can verify" | — |
| evidence-fabric "Provenance chain" | "The evidence chain" | — |
| evidence-fabric "Determinism and reproducibility" | Linked to Ch05 | Already carried |
| evidence-fabric "Cryptographic anchoring and signing posture" | "Integrity: what each mechanism proves" | — |
| evidence-fabric "Evidence outputs available today" | Stage 4 of the chain | KSI dashboards not listed separately (claims log 15) |
| evidence-fabric "Maturity and current-state honesty" | "Honest limits" | — |
| evidence-fabric "Where to go deeper" | Links to Ch05, Ch11, Book 11 Ch09, Book 12 Ch02/Ch12 | — |
