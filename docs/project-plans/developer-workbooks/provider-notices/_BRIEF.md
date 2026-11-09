# Building Provider Notices (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/provider-notices/`. Files and folders starting with `_` aren't rendered. The workbook index (`index.md`) holds the outline; write chapters with the file names below. This workbook is the code-first companion to the implementation guide `docs/books/guides/provider-notices-implementation.md` (seven gates) and its kit `examples/provider-notices` (phase 1, PR #523). Owner approval of the capability: November 9, 2026.

| File | Title | Gate | Code |
|---|---|---|---|
| `01-the-notice-record-and-azure-service-health.md` | Chapter 01 — The Notice Record and Azure Service Health | G1 Azure | `schema/notice.schema.json`; `New-PnNotice`, `Test-PnNotice`, `ConvertTo-PnAzureNotice`, `Get-PnAzureQuery`; `deploy/New-PnAlertPolicy.ps1` |
| `02-microsoft-365-message-center-and-service-health.md` | Chapter 02 — Microsoft 365 Message Center and Service Health | G2 Microsoft 365 | `ConvertTo-PnM365Notice`; the Graph calls in `config/calls.json` |
| `03-oracle-cloud-infrastructure-announcements.md` | Chapter 03 — Oracle Cloud Infrastructure Announcements | G3 OCI | `ConvertTo-PnOciNotice`; the realm table in `Get-PnCloud` |
| `04-aws-health.md` | Chapter 04 — AWS Health | G4 AWS | `ConvertTo-PnAwsNotice`; the partition table |
| `05-google-cloud-personalized-service-health.md` | Chapter 05 — Google Cloud Personalized Service Health | G5 Google Cloud | `ConvertTo-PnGoogleNotice` |
| `06-routing-to-owners-and-ticket-to-machine-tasks.md` | Chapter 06 — Routing to Owners and Ticket-to-Machine Tasks | G6 Routing | `Invoke-PnRoute.ps1`; `Read-PnRouting`, `Resolve-PnRoute`, `New-PnTaskPayload`, `Invoke-PnRouting`; `config/routing.json`; `templates/` |
| `07-the-weekly-digest-and-evidence.md` | Chapter 07 — The Weekly Digest and Evidence | G7 Digest and evidence | `Invoke-PnDigest.ps1`, `Invoke-PnEvidence.ps1`; `config/requirements.json` |
| `08-deploying-to-test-and-production.md` | Chapter 08 — Deploying to Test and Production | G1 to G7, in order | `deploy/`: `settings.template.json`, `Test-PnPreflight.ps1`, `Invoke-PnScheduledRun.ps1`, `New-PnAlertPolicy.ps1`, `Invoke-PnRollback.ps1`, `PnDeploy.psm1` |

## Link, don't repeat

The guide holds the steps, the comparison of the five providers and the gate-by-gate evidence; the chapters link it and don't restate it. Book 13, Chapter 10 and Appendix B hold the Ticket-to-Machine pattern; *Building Ticket-to-Machine* builds the receiving side. Book 15, Chapter 03 holds today's email routing. A Book 15 chapter on provider notices is being written separately; link it from the index once it is on main.

## Every chapter has

Chapter 08 is the exception: a runbook, not a gate. It has no heading with "Lab 1" or "Lab 2" (`scripts/kit_captures.py` and `scripts/generate_labs.py` key on those headings); every step is a command block, its outputs come from fixture mode labeled with the date, and its live results are written as expected results. It keeps the verified facts, dangers, checklist, footnotes and verification log the others have.

Chapters 01 to 07 have: In this chapter; goal and audience; start with the provider's documentation (what it gives, what it leaves to you, as a gap table whose rows the kit's tests pin); the code; an Illustrative code callout; Lab 1 against fixtures with no tenant, every step an exact command whose output `python scripts/kit_captures.py pn` captured; Lab 2 in a test tenant, account, tenancy or project, its placeholders listed once at the top, with a back-out step, marked not run by the authors; verified facts; federal requirements and evidence (what the output proves, the requirement it supports, the KSI it aligns to, who keeps it); dangers with the guard for each; a checklist; Continue the book; footnotes.

## Rules

- Front matter as in Chapter 01, with `doc-type: workbook-chapter`, `family: dw-provider-notices`, `part: How`, `series-order: N` and `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`.
- No "Book NN" in this workbook's own name or title. No narrated chapter tour until the chapter is approved.
- **The provider's own documentation, Microsoft Learn first.** Cite Learn for every Microsoft fact (found with the Microsoft Learn MCP tools), docs.oracle.com for OCI, docs.aws.amazon.com for AWS and docs.cloud.google.com for Google Cloud. Reuse the guide's verified facts and its footnote URLs. Never invent an endpoint, permission or field; what couldn't be verified stays *not yet specified*, as the guide's list has it.
- **Every cloud comparison covers Oracle Cloud Infrastructure.** An agency's HR platform may run on OCI; say so generically.
- **Claims.** The kit's evidence *supports* a control; it never satisfies or meets one. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report them. Use only the control-to-KSI pairs in the kit's `config/requirements.json`, which the guide verified.
- **Labs.** Every step is an exact copy-paste command in a fenced `powershell` block, run from `examples/provider-notices`; values the reader supplies are `<placeholders>` listed once at the top of the lab; expected output follows. Prose says why and what to look for, never what to type. Avoid commands whose output depends on the machine (culture-formatted dates from `ConvertFrom-Json`, console width): read CSVs with `Import-Csv`, or JSON with the kit's `Read-PnJson`.
- Footnote keys are unique in this workbook: `[^pnNN-key]` in Chapter NN, `[^pni-key]` on the index. Access dates read "(read November 9, 2026)".
- Never name an agency, a real server, tenant ID or hostname. Use the fixtures' fictional `contoso.example` values and AWS's documentation account `111122223333`.
- Keep LF line endings. Each chapter keeps `_verification/<file-stem>.md`: a claims log and a carry-forward ledger.
