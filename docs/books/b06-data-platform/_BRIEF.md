# B06 Data Platform: SQL Server Identity — chapter-editor brief

Repo worktree: `C:\Users\whale\git\mwb-b06` (branch `book/b06-data-platform`). Book folder:
`docs/books/b06-data-platform/`. Files and folders starting with `_` are not rendered.

**Read the general workbook book rules first and follow them:** `docs/books/_book-writer-brief.md` (style, program
name, agency-neutral rule, footnote format and verification, diagram house style, verification side file, boundaries,
final report). This brief states what is different for Book 06.

Book 06 answers **"Why is the database where legacy authentication hides?"**

## What's different: these pages already exist

Book 06 is the former **SQL Server Identity Transformation** narrative series (11 "books" of chapters) and its
**Implementation Companion** (10 runbook books), already copied into this folder with new file names. The prose is
deliberate and recent. Your job is to **verify and upgrade it in place, not rewrite it** — exactly as for Book 03:

1. **Verify every external factual claim** on the internet and footnote it (Microsoft Learn MCP tools for SQL Server,
   Azure Arc, Entra ID, Windows authentication, Kerberos/NTLM, AD CS and Cloud PKI claims; primary federal sources for
   policy). Keep correct existing footnotes, re-open each one, and fix broken ones. Pay special attention to dates and
   deadlines (the series has a "2027 milestone" — establish exactly what, if anything, external is due in 2027, and
   restate as program design whatever isn't an external requirement), SQL Server version support, and NTLM status.
2. **Correct** wrong or stale claims and footnote the correction; record every change in the claims log.
3. **Keep the author's argument, structure, examples and terms.** Don't cut sections; if something must go, log it.
4. **Renumber references.** The text still says "Book 04", "Book_06" etc. Replace them with the new chapter numbers
   using this map (and fix any link you touch):

   | Old | New |
   |---|---|
   | Book 01 | Chapters 01–02 |
   | Book 02 | Chapters 03–06 |
   | Book 03 | Chapters 07–08 |
   | Book 04 | Chapters 09–10 |
   | Book 05 | Chapters 11–12 |
   | Book 06 | Chapters 14–15 |
   | Book 07 | Chapters 16–17 |
   | Book 08 | Chapters 18–19 |
   | Book 09 | Chapters 20–21 |
   | Book 10 | Chapter 22 |
   | Book 11 | Chapter 23 |
   | Implementation Book NN | Runbook RNN (file `rNN-*.md`) |
   | Appendix A / B / Applicability | Appendix A / B / C |

   A specific chapter reference such as "Book 02, Chapter 3" becomes "Chapter 05".
5. **The short "Book_NN" front pages** (`docs/case-studies/sql-server-narrative/Book_NN.md`, about 220 words each) are
   being archived. Carry the substance of each one into the **first chapter of its part** (for example Book_02's front
   page into Chapter 03) as an opening paragraph or callout, and log it.
6. **Consistent styling with Books 02–05**: front matter (`doc-type: workbook-chapter`, `family: b06-data-platform`,
   `book: B06`, `part:` and `series-order:` are already set — keep them; set `lifecycle_review: 2027-04-01`), a chapter
   title of the form `Chapter NN — Title` (runbooks: `Runbook RNN — Title`; appendices: `Appendix X — Title`) in both
   `title:` and the H1, the italic thesis line, the "In this chapter" callout, the closing "Continue the book" callout
   (`[← Previous …](file) · [Book index](index.md) · [Next … →](file)`, following the reading order below), footnotes
   at the very bottom with `[^cNN-key]` keys (`[^rNN-key]` in runbooks, `[^aX-key]` in appendices). Remove "Status —
   Draft" banners inside pages.
7. **Diagrams** stay in `docs/images/sql-server/diagrams/` (sources in `src/`); keep their references. Fix a source
   only if it states a fact you found wrong (the editor renders). Don't add new diagram folders.
8. Verification side file: `docs/books/b06-data-platform/_verification/<file-stem>.md` (claims log + carry-forward
   ledger with each section "kept", "edited" or "removed").
9. Links to the implementation companion's per-book Word files (`…/Book_NN.docx`) don't exist on the site; replace
   them with a link to the runbook page.

## Reading order (Previous / Next follow this)

index → 01 … 12 → 13 (new: Who Owns the Data Platform) → 14 … 23 → R01 … R10 → Appendix A → B → C.

| File | Part | Title |
|---|---|---|
| `01-what-windows-authentication-actually-is.md` | Why | Chapter 01 — What Windows Authentication Actually Is |
| `02-why-the-inheritance-must-end.md` | Why | Chapter 02 — Why the Inheritance Must End |
| `03-the-shape-of-twenty-years.md` | Why | Chapter 03 — The Shape of Twenty Years |
| `04-the-estate-inventory.md` | Why | Chapter 04 — The Estate Inventory |
| `05-rationalization.md` | Why | Chapter 05 — Rationalization: Utilization, Versions and Dependencies |
| `06-retain-consolidate-retire.md` | Why | Chapter 06 — The Retain, Consolidate, Retire Decision |
| `07-the-authentication-audit.md` | What | Chapter 07 — The Authentication Audit |
| `08-reading-the-audit.md` | What | Chapter 08 — Reading the Audit: Classification and Triage |
| `09-what-arc-provides-to-sql-server.md` | What | Chapter 09 — What Arc Provides to SQL Server |
| `10-arc-deployment-sequencing.md` | What | Chapter 10 — Arc Deployment Sequencing for SQL Server Hosts |
| `11-three-principal-types.md` | What | Chapter 11 — Three Principal Types: User, Group, Service Principal |
| `12-the-engine-authentication-decision.md` | What | Chapter 12 — What the Engine-Authentication Decision Settles |
| `13-who-owns-the-data-platform.md` | Who | Chapter 13 — Who Owns the Data Platform (**new**) |
| `14-ntlm-and-the-patterns-that-generate-it.md` | How | Chapter 14 — NTLMv1, NTLMv2 and the Patterns That Generate NTLM |
| `15-the-three-phases-of-ntlm-elimination.md` | How | Chapter 15 — The Three Phases of NTLM Elimination for SQL Server |
| `16-groups-roles-and-membership.md` | How | Chapter 16 — Groups, Roles and How Membership Reaches the Engine |
| `17-dynamic-membership-delegation-and-privilege.md` | How | Chapter 17 — Dynamic Membership, Delegation and Privileged Access |
| `18-the-four-class-pattern-for-applications.md` | How | Chapter 18 — The Four-Class Pattern Applied to SQL-Consuming Applications |
| `19-connection-string-migration.md` | How | Chapter 19 — Connection String Migration: The Last Mile |
| `20-the-closure-condition.md` | How | Chapter 20 — The Closure Condition |
| `21-what-done-looks-like.md` | How | Chapter 21 — What Done Looks Like |
| `22-where-sql-server-touches-adcs.md` | How | Chapter 22 — Where SQL Server Touches AD CS |
| `23-epilogue-the-platform-question.md` | How | Chapter 23 — Epilogue: The Platform Question |
| `r01-…` … `r10-…` | How | Runbook R01 … R10 — (keep each implementation book's own title) |
| `appendix-a-requirements-mapping.md` | Appendix | Appendix A — Requirements Mapping |
| `appendix-b-ato-kit.md` | Appendix | Appendix B — Security-Approval (ATO) Kit |
| `appendix-c-applicability.md` | Appendix | Appendix C — Applicability |

Related books, linked by these paths: Book 02 `../b02-identity/index.md` (Chapter 11 there is a reference deployment
that points to this series), Book 04 `../b04-access/index.md` (Conditional Access, PIM), Book 05
`../b05-devices/index.md` (Arc for servers — stay consistent with its Chapter 09 `../b05-devices/09-servers-under-azure-arc.md`).
Pages that stay in place: the Federal Compliance Vol II books (`../../compliance/Vol_II_Book_01_…`, `_02_…`, `_03_…`)
and the Data Platform project (`../../projects/data-platform-charter.md`, `data-platform-plan.md`).
