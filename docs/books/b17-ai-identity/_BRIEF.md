# B17 AI Identity Governance — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b17` (branch `book/b17-ai-identity`). Book folder: `docs/books/b17-ai-identity/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b17-ai-identity`, `book: B17`; diagram sources go in
`docs/images/diagrams/b17-ai-identity/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b17-ai-identity/svg/chNN-short-name.svg`. Diagrams no wider than 800 px. Footnote keys `[^cNN-key]`
(`[^aX-key]` in appendices), rendered as chapter endnotes. The site is the **Federal Modernization Workbook**; the program
is "the Federal Modernization Program". Today is 2026-10-22. This is the last book in the series.

**Hard rules:** never write "UIAO", "FMP" or any other engine/product name for the program; never name a specific agency
(never carry Quarto shortcodes like `{{< meta agency.short >}}`); every external claim independently researched against a
primary source you actually opened and endnoted; never send personal data (email addresses, names) to any website,
including in HTTP headers — use a generic User-Agent; don't circumvent bot protection (if a site blocks you, record it in
the verification log as "manual check" and use another primary source such as the Federal Register or the PDF on
whitehouse.gov); guidance, not policy — "requires" only with a cited requirement, program design labeled as design;
keep line endings as found (Python byte counts); defensive content only. AI vendors and products may be named as examples,
never endorsed; verify each feature on the vendor's own documentation, including **its availability and release stage
(preview or generally available) in the government clouds (GCC, GCC High, DoD, Azure Government)** — say so plainly when
a feature is commercial-only or preview.

**Translate internal vocabulary** as in Books 13–16: no "canon", "substrate", "doctrine", internal IDs (ADR-nnn, UIAO_nnn,
FMP_196, Spec4-AI-D1.1, "Book 21 Chapter 2"), drift-class codes like `DRIFT-COMPLIANCE::ai-agentic-ungoverned` (say "a
high-priority finding: an agentic AI system with no governed identity"), "L4 actuator" (say "an AI system that can act,
not just answer"), and no internal counts. **The whitepaper source is a solicitation-readiness brief: keep its verified
substance (what M-25-21 requires and doesn't; the inventory fields read as identity obligations; the inventory cannot
evidence all seven practices) and drop all competitive framing — win probability, evaluators, submission moves, demo
surface, product coverage ledgers.** The runnable kit script (`Invoke-AIInventoryScan.ps1`) is not in the repository:
describe the scan as the program's method, and any code as illustrative (warning callout before the first block).

Book 17 answers **"Why do AI agents need identities and owners?"** Its argument: AI systems — and above all agents that
can act, call tools and change data — sign in with credentials, hold permissions and touch records like any other
identity, but most were deployed outside the identity program. They have no owner of record, no organizational
placement, no credential lifecycle and no leaver process. The federal AI use-case inventory lists them but has no
identity fields. Governing AI is, in large part, identity governance applied to a new kind of principal: every AI system
gets an identity record, an accountable human owner, least-privilege credentials without stored secrets, monitoring and
drift detection, a lifecycle that ends, and evidence the authorizing official can rely on. AI systems use the agency's
existing authorization process; there is no AI-specific ATO.

## Settled facts in published books (read, link, don't contradict — and report any you find stale)

- **Workload identities:** managed identities, workload identity federation, certificates only where neither applies;
  Conditional Access for workload identities needs Workload ID Premium and covers single-tenant service principals
  ([Book 02 Ch09](../b02-identity/09-building-the-entra-target.md), [Book 04 Ch05](../b04-access/05-applications-and-workload-identities.md)).
- **Agent identities in Conditional Access:** [Book 04 Ch03](../b04-access/03-the-conditional-access-model.md) says agent
  identity targets are preview and support only Block, and the program doesn't build on preview targets; [Book 02 App A](../b02-identity/appendix-a-federal-requirements-crosswalk.md)
  says confirm availability in the agency's cloud. **Re-verify the current status of Microsoft Entra Agent ID (agent
  identities, agent identity blueprints, agent users, sponsors/owners, Conditional Access and ID Protection for agents,
  ID Governance for agents) on Microsoft Learn as of today, including government-cloud availability.** If Book 04's
  statement is now stale, write the current fact with a note and report the stale line to the editor in your final
  message.
- **Application consent:** SCuBA MS.AAD.5.2v1 "User consent to applications SHALL be restricted" ([Book 04 Ch05](../b04-access/05-applications-and-workload-identities.md));
  SaaS and OAuth integration governance is [Book 15 Ch06](../b15-day2-operations/06-saas-integration-governance.md).
- **Lifecycle:** HR-driven joiner/mover/leaver and non-employees ([Book 03](../b03-hr-identity/index.md)); privileged
  access and PIM ([Book 04](../b04-access/index.md)).
- **Monitoring and evidence:** the evidence contract ([Book 12 Ch02](../b12-security-operations/02-the-evidence-contract.md));
  drift model, evidence over attestation ([Book 13](../b13-governance/index.md)).
- **Authorization:** no "three-year ATO" rule; FISMA at least annual testing; ongoing authorization; the authorizing
  official alone accepts residual risk ([Book 14](../b14-compliance/index.md)); FedRAMP 2026 Consolidated Rules (Classes
  A–D; KSIs bind providers, not agencies) ([Book 10 Ch03](../b10-cloud-boundary/03-what-changed-at-fedramp.md)).
- **Training:** M-25-21's human-training practice ties to [Book 16](../b16-people/index.md) (published in the same release
  window; link it by that path).
- **Program:** phases and gates G0–G5 ([Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md)); decision rights
  ([Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md), [Book 13 Ch09](../b13-governance/09-who-governs.md)).
- Book links: `../bNN-folder/index.md` for B00–B16 (b16-people included).

**Re-verify every AI policy fact in the sources; several may be stale.** Check on whitehouse.gov/omb, the Federal
Register and NIST: M-25-21 (date, the high-impact AI minimum practices and their deadline, the inventory, compliance
plans, Chief AI Officer, what it rescinded); M-25-22 (acquisition); M-26-04; any OMB AI memo or executive order issued
since (2026); the current Federal AI Use Case Inventory guidance and its published fields (the GitHub `ombegov`
repository or ai.gov); the count of inventoried use cases (the source's "over 1,800 AI systems" is unverified — use the
published inventory's real number with its year, or drop it); NIST AI RMF 1.0 (AI 100-1) and the Generative AI Profile
(AI 600-1); any NIST control overlays for AI systems (e.g. SP 800-53 "COSAIS" overlays) and their status; CISA AI data
security or AI deployment guidance; FedRAMP's AI prioritization. Get the current state, not what the source says.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/operational-guides/ai-identity-governance/index.md` | 540 | Ch01, Ch03, Ch09 |
| `docs/operational-guides/ai-identity-governance/central-deployment.md` (the central scan, CDM analogy, four tiers, what the scan cannot close) | 1,400 | Ch09 |
| `docs/operational-guides/ai-identity-governance/governed-path.md` (drift integration, reciprocity cross-walk, annual refresh, OSCAL evidence) | 1,000 | Ch07, Ch10 |
| `docs/whitepapers/federal-ai-governance-submission-readiness.md` (what M-25-21 requires and doesn't; inventory fields as identity obligations) | 1,750 | Ch02, Ch03 |
| (new research) federal AI rules and NIST AI RMF | — | Ch02, App A |
| (new research) Microsoft Entra workload and agent identities; AWS and Google equivalents only as brief contrast | — | Ch04, Ch05, Ch06, Ch07 |

Most of this book is new research. Write each chapter fresh, keeping the author's argument.

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 17 — AI Identity Governance (editor) | editor |
| `01-ai-agents-need-identities.md` | Why | Chapter 01 — Why AI Agents Need Identities and Owners | W1 |
| `02-what-federal-ai-rules-require.md` | Why | Chapter 02 — What Federal AI Rules Require, and What They Don't | W1 |
| `03-the-inventory-as-an-identity-source.md` | What | Chapter 03 — The AI Use-Case Inventory as an Identity Source | W2 |
| `04-kinds-of-ai-identity.md` | What | Chapter 04 — Kinds of AI Identity: Workloads, Agents and Delegated Access | W2 |
| `05-owners-sponsors-and-lifecycle.md` | What | Chapter 05 — Owners, Sponsors and the AI Identity Lifecycle | W3 |
| `06-credentials-and-least-privilege.md` | What | Chapter 06 — Credentials, Least Privilege and Access Policy for AI | W3 |
| `07-monitoring-drift-and-shadow-ai.md` | What | Chapter 07 — Monitoring, Drift and Shadow AI | W4 |
| `08-who-owns-ai-identity.md` | Who | Chapter 08 — Who Owns AI Identity Governance (**new**) | W4 |
| `09-running-the-inventory-scan.md` | How | Chapter 09 — Running the Inventory Scan, Agency and Central | W5 |
| `10-evidence-and-authorization.md` | How | Chapter 10 — Evidence and Authorization for AI Systems | W5 |
| `appendix-a-requirements-mapping.md` | Appendix | Appendix A — Requirements Mapping: AI Rules to Identity Controls | W5 |

Appendix series-order 90. Reading order: index → 01 … 10 → A.
