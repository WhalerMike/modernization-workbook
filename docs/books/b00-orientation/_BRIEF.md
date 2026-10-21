# B00 Orientation & Program — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b00` (branch `book/b00-orientation`). Book folder: `docs/books/b00-orientation/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b00-orientation`, `book: B00`; diagram sources go in
`docs/images/diagrams/b00-orientation/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b00-orientation/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices).
The site is the **Federal Modernization Workbook**: use that name wherever the workbook is named. The program is "the
Federal Modernization Program". **Never write "UIAO"** or any other engine or product name for the program, and never
name a specific agency (no SSA / Social Security Administration). Today is 2026-10-21.

Book 00 is the front door of the workbook. It answers **"Why modernize, and why now?"** Its argument: federal IT
estates still run on a twenty-year-old client/server model whose governance was implicit in Active Directory; federal
policy (Zero Trust, cloud-configuration baselines, logging, FedRAMP's 2026 rules) and vendor lifecycles now set external
clocks; so modernization has to be run as one governed program, with a charter, principles, a phased plan with gates,
clear decision rights and a portfolio of complementary projects. Book 00 orients the reader (how the workbook is built,
verified and organized into books) and sets out that program; the other books carry each domain in depth.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/executive-briefs/modernization-overview.md` | 730 | Ch01 |
| `docs/case-studies/federal-modernization-case-study.md`, `docs/case-studies/federal-modernization.md` (framing pattern) | 1,100 | Ch01, App B |
| `docs/HOW-TO-USE.md`, `docs/whitepapers/reading-guide.md` (reference only, not archived), `docs/books/index.md` (read only) | 2,200 | Ch02 |
| `PROJECT-CHARTER.md` (repo root; not archived) | 960 | Ch03 |
| `docs/PRINCIPLES.md` | 2,090 | Ch04 |
| `PROJECT-PLAN.md` (repo root; not archived), `docs/project-management/master-project-plan.md` (short twin) | 1,970 | Ch05 |
| `docs/projects/README.md` (read the seven charters' first sections too; they belong to other books, link them on GitHub) | 170 | Ch06 |
| `docs/operational-guides/program-management/master-project-plan.md` (12,500 words: phases 0–6, gates, RACI, 23 assessment deliverables, risk register, control traceability) | 12,500 | Ch05, Ch07–Ch10, App A |

Write each chapter fresh from the sources, keeping the author's argument and terms; verify every external claim and
record in your carry-forward ledger where each source section went. The master plan is `aspirational: true` and was
written for one platform design (Gitea on Windows Server 2025 behind IIS): present that as the program's reference
design, not as the only option, and label anything illustrative. Sources marked "ILLUSTRATIVE" stay labelled as such.
Case studies are framing patterns, not real engagements; keep that honesty.

## Settled facts in published books (read, link, don't contradict)

- **Roadmap and gates — Book 01 is canonical.** [Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md) sets
  seven phases and six gates: Phase 0 Pre-flight (platform host, assessment, repository) → G0 Ready to Plan; Phase 1
  Foundation → G1 Foundation Complete; Phase 2 Pilot division → G2 Pilot Clean; Phase 3 General rollout → G3 Rollout
  Complete; Phase 4 Legacy retirement → G4 Legacy Quiet; Phase 5 AD DS retirement → G5 AD Retired; Phase 6 Steady state.
  The master plan numbers its phases differently (0 platform, 1 assessment, 2 design, 3 pilot, 4 rollout, 5 cutover, 6
  steady state). **Use Book 01's phases and gates**, and give one mapping table (master-plan phase → Book 01 phase and
  gate) in Chapter 05. Gate owners and RACI: [Book 01 Ch09](../b01-transformation-arc/09-who-leads-the-transformation.md)
  (steward clears G0, G1, G4 and co-signs G2; sponsor with steering committee G3; sponsor and CIO G5). Don't contradict it.
- Transformation engine (Analyze → Plan → Deliver, validation and authorization gates, actuation ladder L0–L4 with L3
  gated actuation as the default ceiling): [Book 01 Ch11](../b01-transformation-arc/11-analysis-plan-delivery.md).
  Assessment: [Book 01 Ch10](../b01-transformation-arc/10-analyzing-the-estate.md), [Book 02 Ch07–08](../b02-identity/index.md).
  Platform host: [Book 01 Ch03](../b01-transformation-arc/03-platform-foundation.md), [Book 10 App B](../b10-cloud-boundary/appendix-b-platform-host-interfaces.md).
- M-22-09 has no "§4"; CISA's Zero Trust Maturity Model v2.0 is guidance, not requirements; neither FedRAMP nor M-22-09
  requires a maturity stage ([Book 11 Ch03](../b11-zero-trust/03-what-the-mandates-require.md)). BOD 25-01 covers cloud
  tenant configuration, not on-premises AD ([Book 11 Ch04](../b11-zero-trust/04-scuba-and-bod-25-01.md)).
- M-26-14 (May 22, 2026) rescinded M-21-31; CLAW = Comprehensive Log Aggregation Warehouse. FedRAMP 2026: services are
  "certified" in Classes A–D; the Consolidated Rules launched June 25, 2026 ([Book 10 Ch03](../b10-cloud-boundary/03-what-changed-at-fedramp.md)).
- HR-driven identity: [Book 03](../b03-hr-identity/index.md); the canonical extensionAttribute map is Book 03 Ch06.
- Book links: `../bNN-folder/index.md` for B01–B11 (folders: b01-transformation-arc, b02-identity, b03-hr-identity,
  b04-access, b05-devices, b06-data-platform, b07-pki, b08-ddi, b09-network, b10-cloud-boundary, b11-zero-trust).
  Planned books B12–B17 have no pages yet: name them, link `../index.md`.
- Principles (Ch04): each of the fifteen principles should name the book and chapter that carries it in depth.

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 00 — Orientation & Program (editor) | editor |
| `01-why-modernize-now.md` | Why | Chapter 01 — Why Modernize, and Why Now | W1 |
| `02-how-to-use-this-workbook.md` | Why | Chapter 02 — How to Use This Workbook | W1 |
| `03-the-charter.md` | What | Chapter 03 — The Program Charter | W2 |
| `04-the-principles.md` | What | Chapter 04 — The Modernization Principles | W2 |
| `05-the-program-plan.md` | What | Chapter 05 — The Program Plan: Phases and Gates | W3 |
| `06-the-project-portfolio.md` | What | Chapter 06 — The Complementary Projects | W3 |
| `07-who-runs-the-program.md` | Who | Chapter 07 — Who Runs the Program | W3 |
| `08-pre-flight-and-assessment.md` | How | Chapter 08 — Pre-Flight: Platform and Assessment | W4 |
| `09-design-pilot-and-rollout.md` | How | Chapter 09 — Design, Pilot and Rollout | W4 |
| `10-retirement-steady-state-and-success.md` | How | Chapter 10 — Retirement, Steady State and Measuring Success | W5 |
| `appendix-a-risk-register-and-traceability.md` | Appendix | Appendix A — Risk Register and Control Traceability | W5 |
| `appendix-b-engagement-archetype.md` | Appendix | Appendix B — The Engagement Archetype (Illustrative) | W5 |

Appendix series-order 90, 91. Reading order: index → 01 … 10 → A → B.
