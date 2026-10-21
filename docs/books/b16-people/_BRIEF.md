# B16 People: Training & Education — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b16` (branch `book/b16-people`). Book folder: `docs/books/b16-people/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md`. Replace its B02
specifics with this book's: front matter `family: b16-people`, `book: B16`; diagram sources go in
`docs/images/diagrams/b16-people/src/chNN-short-name.flow.yaml`, referenced as
`../../images/diagrams/b16-people/svg/chNN-short-name.svg`. Footnote keys `[^cNN-key]` (`[^aX-key]` in appendices),
rendered as chapter endnotes. The site is the **Federal Modernization Workbook**; the program is "the Federal
Modernization Program". Today is 2026-10-22.

**Hard rules:** never write "UIAO" or any other engine/product name for the program; never name a specific agency (never
carry Quarto shortcodes like `{{< meta agency.short >}}`); every external claim independently researched against a
primary source you actually opened and endnoted; never send personal data (email addresses, names) to any website,
including in HTTP headers; guidance, not policy — "requires" only with a cited requirement, program design labeled as
design; keep line endings as found (Python byte counts); defensive content only — no phishing lures impersonating real
federal senders (SP 800-50 Rev. 1 guidance). **Translate internal vocabulary** as in Books 13–15 (no "canon",
"substrate", internal IDs, capitalized doctrine names, internal counts). Training vendors and certifications may be named
as examples, never endorsed; verify each on its own site.

Book 16 answers **"Why do people — not tools — close the gap?"** Its argument: every book before this one changes what
people do — the help desk verifies before it resets, owners approve access, stewards keep the record, ISSOs assemble
evidence, users sign in differently. Tools enforce, but people run the modernized estate, and a program that trains last
pays twice. Training is also a control (AT-2, AT-3, AT-4, IR-2, CP-3) with evidence, a workforce requirement (FISMA, OPM's
5 CFR 930.301, the NICE Framework, federal cyber workforce coding), and a readiness measure the program can track.

## Settled facts in published books (read, link, don't contradict)

- **Training controls and evidence:** [Book 14 Ch09](../b14-compliance/09-training-and-awareness-controls.md) carries the
  AT family, IR-2/CP-3, 5 CFR 930.301 (June 14, 2004, never amended), NIST SP 800-50 Rev. 1 (September 2024, final;
  replaced SP 800-50 and SP 800-16; SP 800-16 withdrawn September 12, 2024), training records as evidence, and the
  four training populations. **Link it; Book 16 is the people view — curricula, tracks, labs, certification, readiness —
  not a second controls chapter.** Phishing exercises: non-punitive, legal review, no impersonation of federal senders.
- **Roles:** help-desk authority and identity verification ([Book 15 Ch03, Ch04, Ch10](../b15-day2-operations/index.md));
  governance roles ([Book 13 Ch09](../b13-governance/09-who-governs.md)); compliance roles ([Book 14 Ch10](../b14-compliance/10-who-owns-compliance.md));
  program decision rights ([Book 01 Ch09](../b01-transformation-arc/09-who-leads-the-transformation.md), [Book 00 Ch07](../b00-orientation/07-who-runs-the-program.md)).
- **Program:** phases and gates G0–G5 ([Book 01 Ch12](../b01-transformation-arc/12-migration-roadmap.md)); training is
  part of each gate's readiness. Principle 13 (education, training and test plans) is in [Book 00 Ch04](../b00-orientation/04-the-principles.md#principle-13).
- Book links: `../bNN-folder/index.md` for B00–B15 (b15-day2-operations is in the same release as this book: link it
  by that path). B17 AI Identity Governance is planned: name it, link `../index.md`.

## Sources (archived after the book is built — never link to them)

| Source | Words | Feeds |
|---|---|---|
| `docs/compliance/Vol_V_Book_00_Training_Certification_Overview.md`, `docs/compliance/training-index.md`, `docs/program/education.md`, `docs/program/training.md` | 3,550 | Ch01, Ch09 |
| (new research) federal workforce requirements: FISMA, 5 CFR 930.301, NICE Framework (NIST SP 800-181 Rev. 1 and the current NICE Framework components), OPM cybersecurity workforce coding, the Federal Cybersecurity Workforce Assessment Act, DoD 8140 only as a contrast | — | Ch02 |
| `docs/compliance/Vol_V_Book_01_Compliance_Track.md` | 3,140 | Ch03 |
| `docs/compliance/Vol_V_Book_02_Implementation_Track.md` | 2,230 | Ch04 |
| `docs/compliance/Vol_V_Book_03_Assessment_Certification.md` | 2,340 | Ch05 |
| `docs/compliance/Vol_V_Book_04_Vendor_Training_Lab_Environments.md` | 2,280 | Ch06 |
| `docs/operational-guides/end-user-training.md` | 6,050 | Ch07 |

## Chapter list (exact file names)

| File | Part | Title | Writer |
|---|---|---|---|
| `index.md` | — | Book 16 — People: Training & Education (editor) | editor |
| `01-people-close-the-gap.md` | Why | Chapter 01 — People, Not Tools, Close the Gap | W1 |
| `02-what-the-workforce-rules-require.md` | Why | Chapter 02 — What Federal Workforce Rules Require | W1 |
| `03-the-compliance-track.md` | What | Chapter 03 — The Compliance Track | W2 |
| `04-the-implementation-track.md` | What | Chapter 04 — The Implementation Track | W2 |
| `05-assessment-and-certification.md` | What | Chapter 05 — Assessment and Certification | W3 |
| `06-vendor-training-and-labs.md` | What | Chapter 06 — Vendor Training and Lab Environments | W3 |
| `07-end-user-training.md` | What | Chapter 07 — End-User Training for the Modernized Estate | W4 |
| `08-who-owns-workforce-readiness.md` | Who | Chapter 08 — Who Owns Workforce Readiness (**new**) | W4 |
| `09-building-and-running-the-curriculum.md` | How | Chapter 09 — Building and Running the Curriculum | W5 |
| `10-measuring-readiness.md` | How | Chapter 10 — Measuring Readiness and Evidencing It | W5 |
| `appendix-a-curriculum-map.md` | Appendix | Appendix A — The Curriculum Map: Role, Book and Track | W5 |

Appendix series-order 90. Reading order: index → 01 … 10 → A.
