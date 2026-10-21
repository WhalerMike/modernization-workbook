# B11 Zero Trust & Assessment — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b11` (branch `book/b11-zero-trust`). Book folder: `docs/books/b11-zero-trust/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b11-zero-trust`, `book: B11`; diagram sources go in
`docs/images/diagrams/b11-zero-trust/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b11-zero-trust/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices).
The site is the **Federal Modernization Workbook**: use that name wherever the workbook is named.

Book 11 answers **"Why is Zero Trust a whole-agency property, not a product?"** Its argument: Zero Trust maturity is a
property of the whole agency (identity, devices, networks, applications and data across every cloud, on-premises and
virtualized estate), not something one tool or one tenant score can certify; a whole-agency score needs one naming and
identity plane; CISA's Zero Trust Maturity Model and OMB M-22-09 set the target; SCuBA/BOD 25-01 sets the Microsoft 365
baseline; close BOD 25-01 findings before assessing, so the assessment measures the target state rather than known
gaps; and assessment tools (ScubaGear, Microsoft's Zero Trust Assessment) are evidence inputs, not verdicts.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/whitepapers/zero-trust-whole-agency-unification.md` | 2,920 | Ch01, Ch06 |
| `docs/executive-briefs/zero-trust-overview.md` (+ its image `docs/images/executive-briefs/zero-trust-overview-image-01-…png`) | 360 | Ch01 |
| `docs/whitepapers/zero-trust-governance-principles.md`, `docs/whitepapers/zero-trust-governance-whitepaper.md` | 2,820 | Ch02, Ch10 |
| `docs/modernization-specs/zero-trust.md` | 175 | Ch03 |
| `docs/whitepapers/bod-25-01-close-before-assess.md` (figure `docs/images/whitepapers/bod-25-01-close-before-assess-diagram-01-six-phase-sequence.svg`) | 2,800 | Ch04, Ch08 |
| `docs/whitepapers/zta-scuba-relationship.md` | 1,270 | Ch05 |
| `docs/whitepapers/scubagear-integration-whitepaper.md` | 2,710 | Ch09 |
| `docs/operational-guides/zero-trust-assessment/index.md` and its short twin `docs/operational-guides/zero-trust-assessment.md` | 1,440 | Ch09, Ch10 |

Write each chapter fresh from the sources, keeping the author's argument and terms; verify every external claim and
record in your carry-forward ledger where each source section went. Sections marked "ILLUSTRATIVE — replace before
external release" in the sources must stay clearly labelled as illustrative (or be replaced with verified figures).
Replace source figures with house-style diagram sources.

## Facts already settled in published books (read, link, don't contradict)

- CISA's Zero Trust Maturity Model (v2.0) is a guide, not a set of requirements; it names phishing-resistant MFA
  (FIDO2 or PIV) at the Advanced stage, not certificate-based authentication specifically. M-22-09 has no "§4"; its
  requirements include users logging into applications rather than networks and phishing-resistant MFA for staff,
  contractors and partners. Neither FedRAMP nor M-22-09 requires a particular maturity stage. (Book 01 Ch08, App A.)
- BOD 25-01 (SCuBA) covers cloud tenant configuration (Microsoft 365 and other covered products), not on-premises AD or
  NTLM. M-26-14 rescinded M-21-31 (logging). CLAW = Comprehensive Log Aggregation Warehouse. TIC 3.0 documents were
  republished September 2026 (Book 09 Ch03).
- Conditional Access is Book 04's library (CA001–CA038, CA090); token protection and continuous access evaluation are
  in Book 04 and Book 09 Ch06. FedRAMP 2026: services certified in Classes A–D.
- Link: Book 04 `../b04-access/index.md`, Book 09 `../b09-network/index.md`, Book 05 `../b05-devices/index.md`,
  Book 02 `../b02-identity/index.md`, Book 01 `../b01-transformation-arc/index.md`, Book 10
  `../b10-cloud-boundary/index.md` (on another branch; link by that path).

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 11 — Zero Trust & Assessment (editor) | editor |
| `01-a-whole-agency-property.md` | Why | Chapter 01 — Zero Trust Is a Whole-Agency Property | W1 |
| `02-governance-principles.md` | Why | Chapter 02 — Governance Principles for Zero Trust | W1 |
| `03-what-the-mandates-require.md` | What | Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require | W2 |
| `04-scuba-and-bod-25-01.md` | What | Chapter 04 — SCuBA and BOD 25-01 | W3 |
| `05-two-assessment-tools.md` | What | Chapter 05 — ScubaGear and Microsoft's Zero Trust Assessment | W3 |
| `06-beyond-microsoft-365.md` | What | Chapter 06 — Beyond Microsoft 365: Networks, Other Clouds and Virtualized Estates | W2 |
| `07-who-owns-zero-trust.md` | Who | Chapter 07 — Who Owns Zero Trust (**new**) | W4 |
| `08-close-before-you-assess.md` | How | Chapter 08 — Close Before You Assess | W3 |
| `09-running-the-assessment.md` | How | Chapter 09 — Running the Assessment and Ingesting the Evidence | W4 |
| `10-evidence-not-verdicts.md` | How | Chapter 10 — Evidence, Not Verdicts: From Findings to a Program | W4 |
| `appendix-a-requirements-mapping.md` | Appendix | Appendix A — Requirements Mapping: Pillars, Controls and Books | W2 |

Appendix series-order 90. Reading order: index → 01 … 10 → A.
