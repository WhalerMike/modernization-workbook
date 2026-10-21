# B14 Federal Compliance & Authorization — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b14` (branch `book/b14-compliance`). Book folder: `docs/books/b14-compliance/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b14-compliance`, `book: B14`; diagram sources go in
`docs/images/diagrams/b14-compliance/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b14-compliance/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices),
rendered as chapter endnotes. The site is the **Federal Modernization Workbook**; the program is "the Federal
Modernization Program". Today is 2026-10-21.

**Hard rules:** never write "UIAO" or any other engine/product name for the program; never name a specific agency (the
sources contain Quarto shortcodes like `{{< meta agency.short >}}` — never carry them; write "the agency"); every
external claim independently researched against a primary source you actually opened and endnoted; never send personal
data (email addresses, names) to any website, including in HTTP headers; the workbook is guidance, not policy — say
"requires" only with a cited requirement and label program design as design; keep line endings as found (check with
Python byte counts); defensive content only.

**Translate the sources' internal vocabulary** (as in Book 13): "canon"/"substrate"/"accreditation substrate" → "the
authoritative record" / "the governance platform"; drop internal IDs (ADR-nnn, UIAO_nnn, "Theme F", volume/book numbers
used as identifiers in prose — describe the content instead); doctrine names in capitals ("Closure Necessity Doctrine",
"Closure Provenance Doctrine", "Vendor Currency Doctrine", "MACD-R Lifecycle Doctrine") → state the idea plainly
("a control closes only when the mechanism that closes it exists and its proof is recorded"; "a vendor roadmap is not a
commitment"). The program's own counts ("29 internal KSI rules", "10 of 29", "22-book journey") are internal and dated:
drop them or restate as the program's own design without numbers. Product names appear only as examples.

**Re-verify every date and deadline in the sources.** Many are stale. Settled already in published books (read, link,
don't contradict):
- **FedRAMP 2026:** services are "certified" in Classes A–D; the Consolidated Rules launched June 25, 2026, become
  mandatory January 1, 2027, and no new Rev5 applications are accepted after June 11, 2027 (Book 00 Ch01, Book 10 Ch03);
  the 2026 Key Security Indicators (46 in 10 themes) bind cloud service providers, not agencies; agencies review each
  provider's quarterly Ongoing Certification Report (rule CCM-AGM-ROR says MUST; AGU-USE-ROR says SHOULD — the program
  follows MUST) ([Book 12 Ch12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md),
  [Book 13 Ch11](../b13-governance/11-reciprocity-and-one-authorization.md)). FedRAMP's vulnerability rules (VDR, VER)
  become mandatory December 7, 2026 (Book 12 Ch06).
- **Authorization:** no "three-year ATO" rule exists — FISMA requires at least annual testing; OMB Circular A-130 directs
  ongoing authorization; SP 800-37 Rev. 2 risk acceptance can't be delegated; each agency issues its own ATO/ATU or joins a
  joint authorization (CA-6(2)); M-24-15 (FedRAMP Board, presumption of adequacy) is in force
  ([Book 13 Ch01, Ch11](../b13-governance/index.md)).
- **Baselines:** cite NIST SP 800-53B baseline and FedRAMP class membership as separate facts (e.g. AU-10 and AU-12(1)
  NIST High only; CM-5(1) NIST High but FedRAMP Classes C and D) — [Book 13 App A](../b13-governance/appendix-a-requirements-mapping.md).
- **Directives and memos:** BOD 26-04 (June 10, 2026) revoked BOD 22-01 and 19-02; BOD 25-01 (SCuBA); M-26-14 (May 22,
  2026) rescinded M-21-31; M-26-05 (January 23, 2026) rescinded M-22-18 and M-23-16 — SBOM attestation is now an agency
  choice through contract terms, while the software inventory stays mandatory (verify on whitehouse.gov). CISA incident
  notification: within one hour of identification by the top-level CSIRT, SOC or IT department.
- **Evidence:** the evidence contract (asset identity plus time) is [Book 12 Ch02](../b12-security-operations/02-the-evidence-contract.md);
  evidence over attestation, the drift model and governance roles are [Book 13](../b13-governance/index.md). Link them;
  Book 14 is the compliance and authorization view.
- **Program:** phases and gates G0–G5 [Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md); decision rights
  [Book 01 Ch09](../b01-transformation-arc/09-who-leads-the-transformation.md), [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md),
  [Book 13 Ch09](../b13-governance/09-who-governs.md); the authorizing official alone accepts residual risk.
- Book links: `../bNN-folder/index.md` for B00–B13 (… b12-security-operations, b13-governance). Planned books B15–B17:
  name them, link `../index.md`. Book 16 (People: Training & Education) will carry training in depth; Ch09 here covers
  the AT controls and evidence.
- Federal Compliance volumes that are **not** this book's sources (Vol I–III, V–X) stay in the repository: link them on
  GitHub as `https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/<file>.md` where useful.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/whitepapers/federal-compliance-for-moderate-agencies.md`, `docs/compliance/Vol_0_Book_00a_Executive_Brief.md` | 4,460 | Ch01 |
| `docs/compliance/Vol_0_Book_00_Executive_Summary.md` (23,000-word compendium: the federal clock, the functional planes, the closure and vendor-currency doctrines, the KSI closure matrix, residual risk, and per-volume summaries) | 23,010 | Ch02 (clock), Ch04 (doctrines), Ch12 (map, residual risk) |
| `docs/compliance/Vol_0_Book_02_Control_Crosswalk.md`, `Vol_0_Book_01_Product_Inventory_Questionnaire.md` | 7,920 | Ch03, App A, App B |
| `docs/compliance/Vol_IV_Book_00_Governance_Assurance_Overview.md`, `Vol_IV_Book_03_Program_Management_Governance.md` | 5,130 | Ch05 |
| `docs/compliance/Vol_IV_Book_01_Business_Continuity.md` | 9,780 | Ch06 |
| `docs/compliance/Vol_IV_Book_02_Supply_Chain_Risk_Management.md`, `docs/projects/supply-chain-charter.md`, `supply-chain-plan.md` | 4,360 | Ch07 |
| `docs/compliance/Vol_IV_Book_04_PII_Processing_Transparency.md` | 6,150 | Ch08 |
| `docs/compliance/Vol_IV_Book_05_Cybersecurity_Training_Awareness.md` | 5,840 | Ch09 |
| `docs/compliance/Vol_IV_Book_06_Authorization_Package_ConMon.md`, `docs/compliance/Evidence_Contract_Spec.md`, `docs/program/test-plans.md` | 7,350 | Ch11 |
| `docs/compliance/federal-compliance-series-moderate/` (volume summaries vol-i … vol-x, README, executive brief/summary twins, books/ lists), `docs/compliance/federal-compliance-series-moderate-overview.md`, `docs/compliance/federal-compliance-series-overview.md` | ~8,000 | Ch12 |

Write each chapter fresh from the sources, keeping the author's argument. Restore code into fenced blocks with the
illustrative-code warning callout before the first one; verify every cmdlet, API and file format (OSCAL, SBOM formats
SPDX/CycloneDX, VEX) on its primary source.

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 14 — Federal Compliance & Authorization (editor) | editor |
| `01-proof-not-a-promise.md` | Why | Chapter 01 — Proof, Not a Promise | W1 |
| `02-the-federal-clock.md` | Why | Chapter 02 — The Federal Clock | W1 |
| `03-the-baseline-and-the-crosswalk.md` | What | Chapter 03 — The Control Baseline and the Crosswalk | W2 |
| `04-closure-with-proof.md` | What | Chapter 04 — Closure: A Control Closes Only With Its Proof | W2 |
| `05-program-management-controls.md` | What | Chapter 05 — Program Management Controls | W3 |
| `06-contingency-and-continuity.md` | What | Chapter 06 — Contingency Planning and Business Continuity | W3 |
| `07-supply-chain-risk-management.md` | What | Chapter 07 — Supply Chain Risk Management | W4 |
| `08-privacy-pii-processing.md` | What | Chapter 08 — Privacy: PII Processing and Transparency | W4 |
| `09-training-and-awareness-controls.md` | What | Chapter 09 — Training and Awareness Controls | W5 |
| `10-who-owns-compliance.md` | Who | Chapter 10 — Who Owns Compliance (**new**) | W5 |
| `11-the-authorization-package.md` | How | Chapter 11 — The Authorization Package and Continuous Monitoring | W6 |
| `12-the-series-as-a-map.md` | How | Chapter 12 — The Series as a Map: Which Volume and Book Closes Each Control | W6 |
| `appendix-a-control-crosswalk.md` | Appendix | Appendix A — Control Crosswalk | W7 |
| `appendix-b-product-inventory-questionnaire.md` | Appendix | Appendix B — Product Inventory Questionnaire | W7 |

Appendix series-order 90, 91. Reading order: index → 01 … 12 → A → B.
