# B13 Governance, Drift & Evidence — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b13` (branch `book/b13-governance`). Book folder: `docs/books/b13-governance/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b13-governance`, `book: B13`; diagram sources go in
`docs/images/diagrams/b13-governance/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b13-governance/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices),
rendered as chapter endnotes. The site is the **Federal Modernization Workbook**; the program is "the Federal
Modernization Program". Today is 2026-10-21.

**Hard rules:** never write "UIAO" or any other engine/product name for the program; never name a specific agency; every
external claim independently researched against a primary source you actually opened and endnoted; never send personal
data (email addresses, names) to any website, including in HTTP headers; the workbook is guidance, not policy — say
"requires" only with a cited requirement and label program design as design; keep line endings as found (check with
Python byte counts, not grep); defensive content only.

**Translate the sources' internal vocabulary.** These sources use internal engine terms heavily. Do not carry them:
- "canon", "the canon", "canonical" (as a noun for the program's record) → "the authoritative record", "the governed
  repository" or "the program's source of truth" (ordinary uses like "canonical form" of data are fine);
- "substrate", "governance substrate" → "the governance platform" or "the program's tooling";
- internal decision-record and document IDs (ADR-nnn, UIAO_nnn, "Vol X", theme letters) → drop them; say what was decided;
- "Governance OS", "adapter registry" as proper names → plain descriptions ("the governance platform", "the list of
  adapters the program maintains").
The ideas stay; the branding goes. The transformation engine's stages and actuation ladder are described generically in
[Book 01 Ch11](../b01-transformation-arc/11-analysis-plan-delivery.md) — use its terms (Analyze, Plan, Deliver; L0–L4
with L3 gated actuation as the default ceiling).

Book 13 answers **"Why does compliance decay the day after the audit?"** Its argument: point-in-time assessment measures a
moment, and the estate starts drifting the next morning; governance that doesn't decay needs one authoritative record (a
single source of truth), every change to that record controlled and provenanced, rules that evaluate deterministically,
continuous drift detection that compares actual state to the record, evidence produced by the systems rather than
attestation produced by people, adapters that translate each platform into the same evidence, and a tempo where routine
remediation is a ticket to a machine rather than a ticket to a human. Done that way, one body of evidence can support
reciprocity and continuous authorization instead of re-assessing the same controls system by system.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/executive-governance/ch01-why-governance-fails/index.md`, `ch02-compliance-paradox/index.md` | 1,640 | Ch01 |
| `docs/executive-governance/ch03-drift-as-primary-threat/index.md`, `docs/executive-briefs/drift-engine-overview.md` | 1,290 | Ch02 |
| `docs/architecture/single-source-of-truth.md`, `docs/architecture/architecture-series/six-plane-architecture.md`, `docs/architecture/index.md`, `docs/reference-architecture/index.md` (framework landing) | 3,040 | Ch03 |
| `docs/architecture/change-control-and-provenance.md` | 700 | Ch04 |
| `docs/architecture/three-layer-rule-model.md` (+ its condensed twin in `architecture-series/`), `docs/executive-governance/ch04-deterministic-governance/index.md` | 2,610 | Ch05 |
| `docs/architecture/drift-engine.md` (+ condensed twin in `architecture-series/`) | 1,510 | Ch06 |
| `docs/executive-governance/ch06-evidence-over-attestation/index.md`, `docs/architecture/evidence-chain.md`, `docs/executive-briefs/evidence-fabric-overview.md` | 2,280 | Ch07 |
| `docs/executive-governance/ch05-adapter-model/index.md`, `docs/executive-briefs/adapter-ecosystem-overview.md` | 1,750 | Ch08 |
| `docs/executive-governance/index.md`, `docs/whitepapers/modernization-governance-whitepaper.md` | 2,150 | Ch01, Ch09 |
| `docs/executive-governance/ch07-operational-tempo/index.md`, `docs/whitepapers/ticket-to-machine-not-ticket-to-human.md` | 1,390 | Ch10 |
| `docs/whitepapers/ticket-to-machine-appendices.md` | 4,840 | App B |
| `docs/executive-briefs/reciprocity-single-ato-overview.md`, `docs/executive-briefs/ksi-conformance-overview.md` | 1,330 | Ch11 |
| `docs/executive-governance/ch08-governance-at-scale/index.md`, `docs/projects/continuous-monitoring-charter.md`, `continuous-monitoring-plan.md`, `docs/architecture/continuous-monitoring-strategy.md`, `gap-closure-register.md`, `governance-platform-coverage-gap-doctrine.md` | 2,380 | Ch12 |
| `docs/compliance/Vol_X_Book_00_Governance_Substrate_Integration_Overview.md` | 2,200 | Ch11, Ch12 — **stays** in the repository (Book 14 uses it too): link on GitHub as `https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/<file>.md` |

Write each chapter fresh from the sources, keeping the author's argument. Case studies and examples are framing patterns,
not real engagements; keep that honesty. Restore code into fenced blocks with the illustrative-code warning callout before
the first one.

## Settled facts in published books (read, link, don't contradict)

- **Principles:** single source of truth, change control and provenance, drift detection and the other principles are in
  [Book 00 Ch04](../b00-orientation/04-the-principles.md) (anchors `#principle-1` … `#principle-15`); the drift
  categories Format / Value / Orphan / Phantom there are scoped to attribute values. Other books' drift classes:
  [Book 02 Ch05 and Ch11](../b02-identity/index.md) (DRIFT-SCHEMA, -SEMANTIC, -PROVENANCE, -AUTHZ, -IDENTITY; severity from
  drift class plus whether the claim is in active use), [Book 03 Ch11](../b03-hr-identity/index.md). Reconcile, don't
  invent a fourth taxonomy: present the program's drift model once and map the books' class names to it.
- **Engine and ladder:** [Book 01 Ch11](../b01-transformation-arc/11-analysis-plan-delivery.md); phases and gates G0–G5:
  [Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md); decision rights:
  [Book 01 Ch09](../b01-transformation-arc/09-who-leads-the-transformation.md), [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md).
  The authorizing official alone accepts residual risk.
- **Evidence and monitoring:** the evidence contract (asset identity plus time) is [Book 12 Ch02](../b12-security-operations/02-the-evidence-contract.md);
  CA-7 continuous monitoring, metrics and retention are [Book 12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md).
  Link these; Book 13 is the governance view, not a second SOC book.
- **FedRAMP 2026:** services certified in Classes A–D; the 2026 Key Security Indicators (46 in 10 themes) bind cloud
  service providers, not agencies; agencies review each provider's quarterly Ongoing Certification Report
  ([Book 10 Ch03](../b10-cloud-boundary/03-what-changed-at-fedramp.md), [Book 12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md)).
  Verify anything you add on fedramp.gov. Reciprocity: verify what OMB (M-24-15) and FedRAMP actually say about reuse of
  authorizations; label anything beyond that as program design.
- **Logging:** M-26-14 (May 22, 2026) rescinded M-21-31. **Vulnerabilities:** BOD 26-04 (June 10, 2026) revoked BOD 22-01
  and 19-02.
- Book links: `../bNN-folder/index.md` for B00–B12 (… b11-zero-trust, b12-security-operations). Planned books B14–B17:
  name them, link `../index.md`.

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 13 — Governance, Drift & Evidence (editor) | editor |
| `01-why-governance-decays.md` | Why | Chapter 01 — Why Compliance Decays the Day After the Audit | W1 |
| `02-drift-is-the-primary-threat.md` | Why | Chapter 02 — Drift Is the Primary Threat | W1 |
| `03-one-authoritative-record.md` | What | Chapter 03 — One Authoritative Record: Single Source of Truth and the Six Planes | W2 |
| `04-change-control-and-provenance.md` | What | Chapter 04 — Change Control and Provenance | W2 |
| `05-deterministic-governance.md` | What | Chapter 05 — Deterministic Governance: The Three-Layer Rule Model | W3 |
| `06-the-drift-engine.md` | What | Chapter 06 — The Drift Engine | W3 |
| `07-evidence-over-attestation.md` | What | Chapter 07 — Evidence Over Attestation | W4 |
| `08-the-adapter-model.md` | What | Chapter 08 — The Adapter Model | W4 |
| `09-who-governs.md` | Who | Chapter 09 — Who Governs (**new**) | W5 |
| `10-ticket-to-machine.md` | How | Chapter 10 — Operational Tempo: Ticket to Machine, Not Ticket to Human | W5 |
| `11-reciprocity-and-one-authorization.md` | How | Chapter 11 — Reciprocity, Indicators and One Authorization | W6 |
| `12-governance-at-scale.md` | How | Chapter 12 — Governance at Scale and the Continuous-Monitoring Program | W6 |
| `appendix-a-requirements-mapping.md` | Appendix | Appendix A — Requirements Mapping: Controls, Mandates and Books | W7 |
| `appendix-b-ticket-to-machine-reference.md` | Appendix | Appendix B — Ticket-to-Machine Reference | W7 |

Appendix series-order 90, 91. Reading order: index → 01 … 12 → A → B.
