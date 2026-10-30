# Building Privileged Access (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/privileged-access/`. Files and folders starting with `_` aren't rendered. The workbook index (`index.md`) holds the full outline; write chapters with the file names below. This workbook is the code-first companion to the project plan `docs/project-plans/privileged-access.md` (generated from `data/project-plans/privileged-access.yaml`; never edit the page) and to Book 04, Chapters 04 to 10 and Appendix B.

| File | Title | Code |
|---|---|---|
| `01-privileged-inventory-as-code.md` | Chapter 01 — Privileged Inventory as Code | `examples/privileged-access` (written) |
| `02-emergency-access-as-code.md` | Chapter 02 — Emergency Access Accounts as Code | `examples/privileged-access` (written) |
| `03-conditional-access-for-administrators.md` | Chapter 03 — Conditional Access for Administrators and the Activation Gate | `examples/validation-kit` (VK-CA-01), new code |
| `04-pim-for-entra-roles-as-code.md` | Chapter 04 — PIM for Microsoft Entra Roles as Code | new code |
| `05-pim-for-groups.md` | Chapter 05 — PIM for Groups and the PRV Groups | new code |
| `06-pim-for-azure-resources.md` | Chapter 06 — PIM for Azure Resources | new code |
| `07-access-reviews-of-privileged-roles.md` | Chapter 07 — Access Reviews of Privileged Roles | new code |
| `08-evidence-and-drift.md` | Chapter 08 — Evidence and Drift for the ISSO | `examples/drift-pipeline` (extend only in its own reviewed change) |

## Every chapter has

In this chapter; goal and audience; the context the code depends on; Start with Microsoft's sample (what it gives, the pinned copy, what it leaves to you, as a gap table whose every row is pinned by a test); the code (what it builds on, what the chapter adds, the tests); an Illustrative code callout; Lab 1 against fixtures with no tenant; Lab 2 in a test tenant with a back-out step; a verified facts table (endpoint, least-privileged permission, role, US Government cloud availability, release stage) with the places Learn's pages differ; dangers with the guard for each; a checklist; Continue the book; footnotes. Run every lab command before writing its expected output.

## Rules

- Front matter as in Chapter 01, including `family: dw-privileged-access` and `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`. Any change to an approved page sends it back to the weekly review list.
- No "Book NN" in this workbook's own name or title. No narrated chapter tour until the chapter is approved.
- **Microsoft Learn first, and as much of it as possible.** For anything about a Microsoft product, API, cmdlet, permission, limit or procedure, cite Microsoft Learn (learn.microsoft.com), found with the Microsoft Learn MCP tools. Prefer Learn's own procedures, commands and code samples over writing new ones, and follow Learn's wording for names and limits. Use a non-Learn source only when Learn has nothing, say so in the verification log, and replace it once Learn covers the point. When two Learn pages disagree, cite both and follow the stricter.
- **Microsoft's own samples before our code.** When Microsoft publishes a sample for the task (Learn pages and tutorials, `microsoftgraph/*`, `Azure-Samples/*`), start the chapter from it, run it offline against fakes in Lab 1 (never against a real tenant), and build our code only for what it leaves out, with a table of the gaps and tests that pin them. Keep a pinned, unmodified copy under `examples/third_party/<name>/` with `snapshot.json` (upstream repository, path, commit, dates, license, per-file SHA-256, checked against the upstream git blob hashes) and `SNAPSHOT.md`, add a `github_commits` feed for its upstream path to `data/source-watch/feeds.json` with `"books": ["DW"]`, and update the copy only in a reviewed pull request. When the sample lives only inside a Learn page, pin the page's source from `MicrosoftDocs/*`. Link Learn pages; don't copy their text.
- **The estate.** Microsoft 365 GCC (Moderate) with commercial Azure: `login.microsoftonline.com`, `graph.microsoft.com`, `management.azure.com`. GCC High and DoD have separate hosts. Say so where endpoints matter, and give each feature's US Government availability and its release stage (preview or beta) from Learn. Code takes an explicit cloud name and has no default.
- **Least privilege per call.** Every call is declared in the example's call list with its least-privileged permission (or Azure role) and the Learn page that states it; a test keeps each task's permissions equal to the union of its calls. Reads use GET only; writes are a separate, reviewed path with a dry run.
- Every new external claim cites Microsoft Learn (or a workbook chapter) with an access date. Footnote keys are unique in this workbook: `[^paNN-key]` in Chapter NN, `[^pai-key]` on the index.
- Label the program's own positions *Design guidance*. Give every preview or beta feature its stage.
- Never name an agency. Use the fictional `contoso.example` tenant (initial domain `contosoexample.onmicrosoft.com`) in fixtures, documentation IP ranges, and invented object IDs.
- Code changes come with tests in the example's own suite (Pester 5 under `pwsh`, or pytest). If a chapter touches `examples/validation-kit`, keep the change additive: new check files and new catalog entries.
- Keep LF line endings in new files; keep an existing file's line endings when you edit it.
- Each chapter keeps `_verification/<file-stem>.md`: a claims log and a carry-forward ledger. Open research questions go in `_verification/research-gaps.md`.
