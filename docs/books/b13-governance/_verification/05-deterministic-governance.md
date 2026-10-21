# Verification — Chapter 05, Deterministic Governance

Writer W3, 2026-10-21. Sources: `docs/architecture/three-layer-rule-model.md`, its condensed twin
`docs/architecture/architecture-series/three-layer-rule-model.md`, and
`docs/executive-governance/ch04-deterministic-governance/index.md`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Same record version + same inputs → byte-identical evidence | The same inputs | restated-as-design | Program design (source's determinism decision record; ID dropped) |
| 2 | Three properties: reproducibility, provenance, hash-verifiable lineage | Automation is not determinism | restated-as-design | Program design |
| 3 | RFC 8785 JCS gives a canonical JSON representation, deterministic property sorting, for hashing/signing; Informational, June 2020, authors | Automation is not determinism | verified (added) | rfc-editor.org/rfc/rfc8785 and .txt header |
| 4 | Three layers, their contents and change boundaries | Three layers of rules | restated-as-design | Program design; internal paths (`src/.../rules/`, registries, `importlib.resources`) translated to plain descriptions |
| 5 | Dangling mapping → provenance finding, not crash | Layer 2 | restated-as-design | Program design |
| 6 | Enforcement runtime is library-only, no CLI, by design | Layer 3 | restated-as-design | Source states it; internal doc IDs dropped. Writer's rationale softened to "reached through the engine's path" |
| 7 | Only runtime may change observable state; ceiling set by the actuation ladder | Layer 3 | restated-as-design | Linked Book 01 Ch11 (L3 default ceiling) — added to reconcile with the ladder |
| 8 | ScubaGear: PowerShell reads M365 settings, OPA compares against Rego policies written per baselines, outputs HTML/JSON/CSV | Rules as code | verified (added) | github.com/cisagov/ScubaGear README (Step Two quote); version not stated in text (latest release v1.8.0, May 7, 2026, via GitHub API — not used) |
| 9 | OPA "decouples policy decision-making from policy enforcement"; "specify policy as code"; Rego declarative | Rules as code | verified (added) | openpolicyagent.org/docs |
| 10 | Illustrative rule / mapping / finding YAML | Rules as code | restated-as-design | Written new to illustrate the layers; warning callout added; `FMP-` prefix per workbook rules |
| 11 | CM-3 statement incl. quote "with explicit consideration for security and privacy impact analyses"; CM-3(2); CM-4; all Moderate | Reviewing rules | verified (added) | NIST OSCAL Rev. 5 catalog 5.2.0; Moderate profile |
| 12 | Reasons for three layers: cadence, blast radius, attribution | Why three layers | restated-as-design | Program design |
| 13 | Drift class → home layer table | Where drift lives | restated-as-design | Source table; added a "who resolves" column from the source's prose |
| 14 | CM-6 statement incl. quote "monitor and control changes to the configuration settings"; CM-2; CM-2(2); CA-7 — all Moderate; CM-6(1) in High not Moderate | How rules map to controls | verified (added) | OSCAL catalog; Moderate and High profiles checked programmatically |
| 15 | OSCAL three layers and eight models; component definition describes how a component satisfies controls and can be imported into an SSP | How rules map to controls | verified | pages.nist.gov/OSCAL/learn/concepts/layer/ |
| 16 | Program artifacts ↔ OSCAL model correspondence | How rules map to controls | restated-as-design | Labeled "the program's own, not something OSCAL defines" |
| 17 | KSIs bind CSPs not agencies; agencies review quarterly OCR | How rules map to controls | verified (settled fact) | Linked Book 10 Ch03 and Book 12 Ch12 per brief; not re-footnoted |
| 18 | Four emission properties (no silent drops, append-only, ordered, idempotent) | How the pipeline keeps determinism | restated-as-design | Source's determinism decision record; ID dropped; one-line definitions of each added by writer |
| 19 | Bundle lifecycle assemble → seal → submit → close; sealed = immutable; supersession | Same | restated-as-design | Source's bundle-lifecycle decision record; ID dropped |
| 20 | "Constrain every OSCAL emission" (SSP, POA&M, KSI dashboard, component definitions) | Same | restated-as-design | Source stated it as fact; softened to "in the design" — whether the tooling emits OSCAL today was not established |
| 21 | Regenerable evidence, reduced tool lock-in, cheap reconstruction | What changes | restated-as-design | Program design; added note that inputs must still be retained (link Book 12 Ch12) |
| 22 | CA-7(1) independent assessors monitor controls on an ongoing basis | What changes | verified (added) | OSCAL catalog; in Moderate |
| 23 | Only the AO accepts residual risk | What changes | verified (settled fact) | Linked Book 01 Ch09 |
| 24 | Honest limits: faithful to record not a check on it; interval adapters (ScubaGear) deterministic per interval; inputs must be archived | Honest limits | restated-as-design | Source; added fourth limit (pinned toolchain/serialization) as design |
| 25 | Source: "3PAO" independent verification | Throughout | restated-as-design | Generalized to "assessor" |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| three-layer-rule-model.md: front matter, illustration PNG | — | PNG not reused (brief); replaced by `ch05-three-rule-layers` house-style diagram |
| three-layer-rule-model.md: intro (policy-as-config failure) | Three layers of rules | — |
| three-layer-rule-model.md: The three layers (table) | Three layers of rules (table) | Repository paths dropped |
| three-layer-rule-model.md: Layer 1 — Canon | Layer 1: authoritative rules | "Canon", package-data mechanics and consumer-rule name translated |
| three-layer-rule-model.md: Layer 2 — Policy | Layer 2: policy mappings | Registry file names and CI workflow name dropped |
| three-layer-rule-model.md: Layer 3 — Runtime | Layer 3: runtime enforcement | Internal doc IDs and CLI reference dropped; ladder link added |
| three-layer-rule-model.md: How drift maps onto the layers | Where drift lives in the layers | — |
| three-layer-rule-model.md: Why three layers and not two | Why three layers and not two | — |
| three-layer-rule-model.md: What this means for an ATO package | Reviewing rules (per-layer evidence and reviewability); Where drift lives (targeted remediation) | Merged rather than repeated |
| architecture-series twin (all sections) | Same places as the long version | Condensed duplicate; consolidated |
| ch04 deterministic governance: In this chapter | The same inputs, the same evidence | — |
| ch04: What "deterministic" means here + at-a-glance table | Automation is not determinism | Provenance-profile doc reference dropped; linked Ch04 instead |
| ch04: Why determinism is the response to the paradox | What changes for the program ("The audit cycle changes job") | Re-framed; paradox linked via Ch01 |
| ch04: What determinism is the response to in the drift model | How the pipeline keeps determinism (last paragraph) | — |
| ch04: How the substrate enforces it | How the pipeline keeps determinism | Decision-record IDs dropped; OSCAL claim softened (row 20) |
| ch04: What changes for the program | What changes for the program | — |
| ch04: Honest limits | Honest limits | — |
| ch04: Key takeaways | Key takeaways | Rewritten |
| ch04: Continue the series / Related documents | — | Replaced by book navigation; source pages not linked (being archived) |
