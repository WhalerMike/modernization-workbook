# B03 HR-Driven Identity — chapter-editor brief (shared by every editor)

Repo worktree: `C:\Users\whale\git\mwb-b03` (branch `book/b03-hr-identity`). Book folder:
`docs/books/b03-hr-identity/`. Files and folders starting with `_` are not rendered.

**Read the general workbook book rules first and follow them:** `docs/books/_book-writer-brief.md`
(style, program name, agency-neutral rule, footnote format, diagram house style, verification side file,
boundaries, final report). This brief only states what is different for Book 03.

## What's different: these chapters already exist

Book 03 is the former HR-Driven Identity series, already moved into this folder and renumbered so the book
reads Why / What / Who / How. The prose is recent and deliberate (the author revised it this week). Your job is
to **verify and upgrade it in place, not to rewrite it**:

1. **Verify every external factual claim** on the internet and footnote it, exactly as the general brief says
   (Microsoft Learn MCP tools for Microsoft claims; primary sources such as opm.gov, whitehouse.gov, nist.gov,
   csrc.nist.gov, cisa.gov, idmanagement.gov, gsa.gov for federal claims). Keep existing footnotes that are
   correct; re-open each one you keep to confirm the URL works and supports the sentence; fix broken ones.
   Federal HR 2.0 facts (the December 10, 2025 OMB/OPM memo, the Oracle Core HCM award, wave membership and
   dates) change quickly — verify them as of today, 2026-10-20, and never name specific agencies (use a neutral
   pointer to the source for wave membership).
2. **Correct** wrong or stale claims and footnote the correction; record every change in the claims log.
3. **Keep the author's argument, structure, examples and terms.** Edit sentences only where a fact was wrong,
   a claim needs restating as program design, or the text breaks the style rules. Don't cut sections; if
   something must go, log it in the carry-forward ledger with the reason.
4. **Make the styling consistent with Book 02**: front matter (`doc-type: workbook-chapter`,
   `family: b03-hr-identity`, `book: B03`, `part: Why|What|Who|How|Appendix`, `series-order`,
   `lifecycle_review: 2027-04-01`), the italic thesis line, the "In this chapter" callout, the closing
   "Continue the book" callout (`[← Previous …](file) · [Book index](index.md) · [Next … →](file)`),
   footnotes at the very bottom with `[^cNN-key]` keys (`[^aA-key]` in appendices). Remove any "Status — Draft"
   banners inside chapters (the index carries status).
5. **Diagrams.** Each chapter keeps its existing diagrams; their sources are in
   `docs/images/diagrams/b03-hr-identity/src/` and were renamed to the new chapter numbers (for example
   `ch08-personnel-action-lifecycle`). The chapter pages already reference `../../images/diagrams/b03-hr-identity/svg/<name>.svg`.
   If a chapter has no diagram, add one source. Fix a diagram source only if it states a fact you found wrong.
   Don't render.
6. Verification side file: `docs/books/b03-hr-identity/_verification/<file-stem>.md` (claims log +
   carry-forward ledger, as in the general brief). For existing chapters the ledger records each section as
   "kept", "edited" (what changed) or "removed" (why).

## The book's chapter list (exact file names)

| File | Part | Title |
|---|---|---|
| `index.md` | — | Book 03 — HR-Driven Identity (editor) |
| `01-overview-and-applicability.md` | Why | Chapter 01 — Overview and Applicability |
| `02-why-hr-is-the-source-of-authority.md` | Why | Chapter 02 — Why HR Is the Source of Authority |
| `03-federal-hr-2-0.md` | Why | Chapter 03 — Federal HR 2.0 and the Core HCM Platform |
| `04-attribute-authority.md` | What | Chapter 04 — Attribute Authority |
| `05-the-provisioning-pipeline.md` | What | Chapter 05 — Provisioning Services |
| `06-canonical-attribute-schema.md` | What | Chapter 06 — The Canonical Workforce Identity Model |
| `07-who-owns-workforce-identity.md` | Who | Chapter 07 — Who Owns Workforce Identity (**new**) |
| `08-joiner-mover-leaver.md` | How | Chapter 08 — Joiner, Mover, Leaver |
| `09-credentials-and-certificates.md` | How | Chapter 09 — Credentials and Certificates Across Joiner, Mover, Leaver |
| `10-from-attributes-to-access.md` | How | Chapter 10 — From Attributes to Access |
| `11-drift-metrics-and-evidence.md` | How | Chapter 11 — Drift, Metrics and Evidence |
| `12-execution-plan.md` | How | Chapter 12 — Execution Plan |
| `13-reference-deployment.md` | How | Chapter 13 — Reference Deployment (Illustrative) |
| `appendix-a-lifecycle-rules.md` | Appendix | Appendix A — Lifecycle Rules |
| `appendix-b-security-and-privacy.md` | Appendix | Appendix B — Security and Privacy Assessment |
| `appendix-c-acceptance-and-cutover.md` | Appendix | Appendix C — Acceptance and Cutover |

Chapter numbers in the text have already been renumbered; check any you touch. Related books: Book 02 is
`../b02-identity/index.md` (the directory migration this book builds on). Pages outside the books are linked
relative to this folder (`../../projects/identity-lifecycle-charter.md`,
`../../compliance/Vol_I_Book_04_HRIT_Identity_Org_SSOT.md`).
