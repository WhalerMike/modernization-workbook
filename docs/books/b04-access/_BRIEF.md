# B04 Access & Privilege — chapter-writer brief

Repo worktree: `C:\Users\whale\git\mwb-b04` (branch `book/b04-access`). Book folder: `docs/books/b04-access/`.

**Read the general workbook book rules first and follow them exactly:** `docs/books/_book-writer-brief.md` (style,
program name, agency-neutral rule, footnote format and verification, diagram house style, the verification side file,
boundaries, final report). Replace its B02 specifics with this book's: front matter `family: b04-access`, `book: B04`;
diagram sources go in `docs/images/diagrams/b04-access/src/` and are referenced as
`../../images/diagrams/b04-access/svg/<name>.svg`.

Book 04 answers **"Why is every access decision a policy decision?"** It consolidates the workbook's access-plane
pages (Conditional Access, PIM, privileged access, application access and governance) into one book.

## Relation to the other books — don't duplicate, link

- **Book 02** (`../b02-identity/index.md`) already covers the AD-to-Entra migration, including a Conditional Access
  framework and PIM basics (Chapter 09 `../b02-identity/09-building-the-entra-target.md`), phishing-resistant
  authentication and governance (Chapter 10 `../b02-identity/10-migrating-and-governing.md`), and delegation with
  administrative units (Chapter 05 `../b02-identity/05-delegation-without-ous.md`). Book 04 goes deeper on access and
  privilege; where Book 02 already states a fact, link to it and stay consistent (read the relevant Book 02 sections).
- **Book 03** (HR-driven identity) owns attributes and the joiner/mover/leaver lifecycle; link to
  `../b03-hr-identity/index.md` for those (the folder exists on another branch; link by that path anyway).
- Pages that stay in place and are linked for depth (never archived): the Federal Compliance books
  `../../compliance/Vol_III_Book_01_Privileged_Access_Management.md`, `Vol_VII_Book_08_…`, `Vol_VI_Book_02_…`,
  `Vol_IX_Book_06_…`, `Vol_IX_Book_03_…`; the Help Desk guide
  `../../operational-guides/helpdesk-entra-operations/enterprise-application-access-governance.md`; the project
  `../../projects/privileged-access-charter.md`. You may draw content from them (verified), but link to them rather
  than reproducing long runbooks they already hold.
- Pages being consolidated and archived (never link to them): `docs/operational-guides/access-plane/*`,
  `docs/operational-guides/conditional-access-policy-library.md`, `docs/operational-guides/pim-self-request-approval.md`,
  `docs/libraries/conditional-access-principles.md`. Their substance must be carried into the book.

## Chapter list (exact file names)

| File | Part | Title |
|---|---|---|
| `index.md` | — | Book 04 — Access & Privilege (editor) |
| `01-access-is-a-policy-decision.md` | Why | Chapter 01 — Access Is a Policy Decision |
| `02-why-standing-privilege-fails.md` | Why | Chapter 02 — Why Standing Privilege Fails |
| `03-the-conditional-access-model.md` | What | Chapter 03 — The Conditional Access Model |
| `04-privileged-roles-and-tiers.md` | What | Chapter 04 — Privileged Roles and Tiers |
| `05-applications-and-workload-identities.md` | What | Chapter 05 — Applications and Workload Identities |
| `06-who-decides-access.md` | Who | Chapter 06 — Who Decides Access |
| `07-the-conditional-access-policy-library.md` | How | Chapter 07 — The Conditional Access Policy Library |
| `08-pim-self-request-with-approval.md` | How | Chapter 08 — PIM Self-Request with Approval |
| `09-access-governance.md` | How | Chapter 09 — Access Governance: Packages, Reviews and Lifecycle |
| `10-access-as-code-and-evidence.md` | How | Chapter 10 — Access as Code, and the Evidence It Produces |
| `appendix-a-conditional-access-templates.md` | Appendix | Appendix A — Conditional Access Policy Templates |
| `appendix-b-pim-role-settings.md` | Appendix | Appendix B — PIM Role Settings Reference |

Appendices use series-order 90 and 91.
