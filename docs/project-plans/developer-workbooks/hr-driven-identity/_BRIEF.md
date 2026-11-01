# Building HR-Driven Identity (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/hr-driven-identity/`. Files and folders starting with `_` aren't rendered. The workbook index (`index.md`) holds the outline; write chapters with the file names below. This workbook is the code-first companion to the implementation guide `docs/books/guides/hr-driven-identity-implementation.md` (seven gates) and the project plan `docs/project-plans/identity-lifecycle.md` (generated from `data/project-plans/identity-lifecycle.yaml`; never edit the page).

| File | Title | Gate | Code |
|---|---|---|---|
| `01-the-writer-register-as-code.md` | Chapter 01 — The Writer Register as Code | G1 Writers | `examples/hr-lifecycle`: `writer_register.py`, `config/writer-register.json` |
| `02-contractor-sources-and-end-dates.md` | Chapter 02 — Contractor Sources and Enforced End Dates | G2 Sources | `contractor_source.py`, `config/contractor-rules.json`; the SCIM requests are `examples/hcm-entra`'s |
| `03-joiner-workflows-as-code.md` | Chapter 03 — Joiner Workflows as Code and the Temporary Access Pass Bridge | G3 Joiners | `joiner_workflows.py`, `config/workflows/` |
| `04-access-from-attributes-and-the-mover-review.md` | Chapter 04 — Access from Attributes and the Mover's Residual Review | G4 Access and movers | `access_assignment.py`, `config/access/` |
| `05-certificate-based-authentication-checks.md` | Chapter 05 — Certificate-Based Authentication Checks | G5 Credentials | `cba_check.py`, `config/cba-expected.json` |
| `06-separation-timing.md` | Chapter 06 — Separation Timing from the Logs | G6 Separation | `separation_timing.py`, `config/separation.json` |
| `07-lifecycle-drift-and-evidence.md` | Chapter 07 — Lifecycle Drift, Metrics and Evidence | G7 Drift and evidence | `lifecycle_drift.py`, `config/drift.json`; `examples/drift-pipeline/python/hr_evidence.py` |

## Link, don't repeat

Book 19 already builds the middleware (Ch01), the Graph client pattern (Ch02), validation kit checks (Ch03), dynamic rules as code (Ch04), Lifecycle Workflows custom task extensions and the leaver order check (Ch05) and the drift pipeline (Ch09). *Building Privileged Access* builds PIM and reviews of privileged roles. A chapter links to them and builds only what its gate needs that they don't. It links Book 03 for the design and the guide for the steps, and doesn't restate either.

## Every chapter has

In this chapter; goal and audience; Start with Microsoft's procedure (what Learn gives, what it leaves to you, as a gap table whose rows are pinned by tests); the code (what exists, what the chapter adds, the tests); an Illustrative code callout; Lab 1 against fixtures with no tenant (every command run before its expected output is written); Lab 2 in a test tenant with a back-out step, marked not run by the authors; a verified facts table (endpoint, least-privileged permission, US Government availability, release stage) with the places Learn's pages differ; Federal requirements and evidence (the gate and requirement, what the ISSO keeps; link the guide's gate table and the federal framework crosswalk, don't restate); dangers with the guard for each; a checklist; Continue the book; footnotes.

## Rules

- Front matter as in the index, with `doc-type: workbook-chapter`, `family: dw-hr-driven-identity`, `part: How`, `series-order: N` and `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`. Any change to an approved page sends it back to the weekly review list.
- No "Book NN" in this workbook's own name or title. No narrated chapter tour until the chapter is approved.
- **Microsoft Learn first.** Cite Learn for every Microsoft fact, found with the Microsoft Learn MCP tools, and follow Learn's wording for names and limits. When two Learn pages disagree, cite both and follow the stricter. Never invent an endpoint, permission, task ID or kit check name; what couldn't be verified goes in the chapter's verification log and, where it matters to a reader, in the chapter.
- **Microsoft's own samples before our code.** Pin a Microsoft sample under `examples/third_party/` (with `snapshot.json`, `SNAPSHOT.md` and a source-watch feed) only if a chapter actually runs one. None of the seven does.
- **The estate.** Microsoft 365 GCC (Moderate) with commercial Azure; GCC High and DoD have separate hosts. Code takes an explicit cloud name and has no default. Any cloud comparison covers AWS, Azure and Oracle Cloud Infrastructure.
- **Least privilege per call.** Every call is declared in `config/calls.json` with its least-privileged permission and its Learn page; a test keeps each task's permissions equal to the union of its calls. The kit only reads; changes are request bodies for review, sent with Microsoft's Graph PowerShell cmdlets or the reviewed pipeline.
- Footnote keys are unique in this workbook: `[^hwNN-key]` in Chapter NN, `[^hwi-key]` on the index. Access dates read "(read November 1, 2026)".
- Never name an agency. Use the fictional `contoso.example` tenant, documentation IP ranges and invented object IDs.
- Federal scope: FedRAMP Moderate civilian (CISA SCuBA under BOD 25-01, NIST SP 800-53 Rev. 5 Moderate, SP 800-63, FIPS 201-3, OMB M-22-09).
- Keep LF line endings in new files; keep an existing file's line endings when you edit it.
- Each chapter keeps `_verification/<file-stem>.md`: a claims log and a carry-forward ledger.
