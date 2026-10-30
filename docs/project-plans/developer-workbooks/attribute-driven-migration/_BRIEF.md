# Building the Attribute-Driven Migration (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/attribute-driven-migration/`. Files and folders starting with `_` aren't rendered. The workbook index (`index.md`) holds the full outline; write chapters with the file names below.

| File | Title | Code |
|---|---|---|
| `01-the-hr-to-entra-middleware.md` | Chapter 01 — The HR-to-Entra Middleware | `examples/hcm-entra` (written) |
| `02-graph-clients-for-government-clouds.md` | Chapter 02 — Graph Clients for the Government Clouds | `examples/ms-automation` |
| `03-writing-a-validation-kit-check.md` | Chapter 03 — Writing a Validation Kit Check | `examples/validation-kit` (written) |
| `04-dynamic-rules-as-code.md` | Chapter 04 — Dynamic Rules as Code | `examples/dynamic-rules` (written) |
| `05-lifecycle-workflows-custom-extensions.md` | Chapter 05 — Lifecycle Workflows Custom Extensions | new example |
| `06-group-policy-as-code.md` | Chapter 06 — Moving Group Policy as Code | `examples/validation-kit` (VK-INT-07) |
| `07-machine-configuration-packages.md` | Chapter 07 — Machine Configuration Packages | `examples/machine-configuration` (written) |
| `08-ansible-beside-arc.md` | Chapter 08 — Ansible Beside Arc | `examples/ansible` |
| `09-drift-pipelines-and-evidence.md` | Chapter 09 — Drift Pipelines and Evidence to the ISSO | the kits' run outputs |

## Every chapter has

Goal and audience; the code (what it builds on, what the chapter adds, the tests); Lab 1 against fixtures with no tenant; Lab 2 in a test tenant with a back-out step; a verified facts table (endpoint, least-privileged permission, role, US Government cloud availability, release stage); dangers with the guard for each; a checklist. Run every lab command before writing its expected output.

## Rules

- Front matter as in Chapter 01, including `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`. Any change to an approved page sends it back to the weekly review list.
- No narrated chapter tour until the chapter is approved.
- **Microsoft Learn first, and as much of it as possible.** For anything about a Microsoft product, API, cmdlet, permission, limit or migration step, cite Microsoft Learn (learn.microsoft.com), found with the Microsoft Learn MCP tools. Prefer Learn's own procedures, commands and code samples over writing new ones, and follow Learn's wording for names and limits. Use a non-Learn source (GitHub samples, Arc Jumpstart, blogs, Q&A answers) only when Learn has nothing, say so in the verification log, and replace it once Learn covers the point. When two Learn pages disagree, cite both and follow the stricter.
- **Microsoft's own samples before our code.** When Microsoft publishes a sample for the task (Learn tutorials usually link one), start the chapter from it, run it in Lab 1, and build our code only for what it leaves out, with a table of the gaps and tests that pin them. Keep a pinned, unmodified copy under `examples/third_party/<name>/` with `snapshot.json` (upstream repository, path, commit, dates, license, per-file SHA-256) and `SNAPSHOT.md`, add a `github_commits` feed for its upstream path in `data/source-watch/feeds.json`, and update the copy only in a reviewed pull request. Link Learn pages; don't copy their text.
- Every new external claim cites Microsoft Learn (or a workbook chapter) first, with an access date. Footnote keys are unique in the workbook: `[^cNN-key]`, `[^i-key]` on the index.
- Label the program's own positions *Design guidance*. Give every preview or beta feature its stage.
- Never name an agency. Use the fictional `contoso.example` tenant in fixtures.
- Code changes come with tests in the example's own suite, and both language clients stay in step where an example has two.
- Keep LF line endings in new files; keep an existing file's line endings when you edit it.
- Each chapter keeps `_verification/<file-stem>.md`: a claims log and a carry-forward ledger. Open research questions go in `_verification/research-gaps.md`.
