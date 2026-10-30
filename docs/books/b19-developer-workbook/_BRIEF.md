# B19 Developer Workbook — chapter-writer brief

Book folder: `docs/books/b19-developer-workbook/`. Files and folders starting with `_` aren't rendered. The book index (`index.md`) holds the full outline; write chapters with the file names below.

| File | Title | Code |
|---|---|---|
| `01-the-hr-to-entra-middleware.md` | Chapter 01 — The HR-to-Entra Middleware | `examples/hcm-entra` (written) |
| `02-graph-clients-for-government-clouds.md` | Chapter 02 — Graph Clients for the Government Clouds | `examples/ms-automation` |
| `03-writing-a-validation-kit-check.md` | Chapter 03 — Writing a Validation Kit Check | `examples/validation-kit` (written) |
| `04-dynamic-rules-as-code.md` | Chapter 04 — Dynamic Rules as Code | `examples/validation-kit` (DG checks) |
| `05-lifecycle-workflows-custom-extensions.md` | Chapter 05 — Lifecycle Workflows Custom Extensions | new example |
| `06-group-policy-as-code.md` | Chapter 06 — Moving Group Policy as Code | `examples/validation-kit` (VK-INT-07) |
| `07-machine-configuration-packages.md` | Chapter 07 — Machine Configuration Packages | new example |
| `08-ansible-beside-arc.md` | Chapter 08 — Ansible Beside Arc | `examples/ansible` |
| `09-drift-pipelines-and-evidence.md` | Chapter 09 — Drift Pipelines and Evidence to the ISSO | the kits' run outputs |

## Every chapter has

Goal and audience; the code (what it builds on, what the chapter adds, the tests); Lab 1 against fixtures with no tenant; Lab 2 in a test tenant with a back-out step; a verified facts table (endpoint, least-privileged permission, role, US Government cloud availability, release stage); dangers with the guard for each; a checklist. Run every lab command before writing its expected output.

## Rules

- Front matter as in Chapter 01, including `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`. Any change to an approved page sends it back to the weekly review list.
- No narrated chapter tour until the chapter is approved.
- Every new external claim cites Microsoft Learn (or a workbook chapter) first, with an access date. Footnote keys are unique in the book: `[^cNN-key]`, `[^i-key]` on the index.
- Label the program's own positions *Design guidance*. Give every preview or beta feature its stage.
- Never name an agency. Use the fictional `contoso.example` tenant in fixtures.
- Code changes come with tests in the example's own suite, and both language clients stay in step where an example has two.
- Keep LF line endings in new files; keep an existing file's line endings when you edit it.
- Each chapter keeps `_verification/<file-stem>.md`: a claims log and a carry-forward ledger. Open research questions go in `_verification/research-gaps.md`.
