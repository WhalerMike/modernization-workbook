# Building Help Desk Automation (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/help-desk-automation/`. Files and folders starting with `_` aren't rendered. The workbook index (`index.md`) holds the outline; write chapters with the file names below. This workbook is the code-first companion to the kit `examples/help-desk-automation`, which scripts the eight everyday help desk and audit tasks of Book 15, Chapter 12 (`docs/books/b15-day2-operations/12-the-day-two-runbook.md`). There is no implementation guide: Book 15, Chapter 12 holds the procedure, and decisions WD-181 (the scheduled read-only jobs on the platform host), WD-182 (the request pipeline) and WD-183 (the platform host's Active Directory exception) hold where each part runs and as which identity.

| File | Title | Book 15, Chapter 12 task | Code |
|---|---|---|---|
| `01-the-typed-change.md` | Chapter 01 — The Typed Change | 5. Running a script for a requester | `New-HtTypedChangePlan`, `Invoke-HtTypedChange`, `Get-HtSha256`; `config/typed-changes.json` |
| `02-the-consent-request-review.md` | Chapter 02 — The Consent Request Review | 3. Admin consent | `Get-HtPendingConsentRequest`; `config/consent-review.json` |
| `03-scheduled-checks-sync-roles-and-logs.md` | Chapter 03 — Scheduled Checks: Synchronization, Roles and Log Forwarding | 6, 7 and 8 | `Invoke-HtSyncCheck`, `Invoke-HtRoleReview`, `Test-HtLogForwarding`; `config/sync-check.json`, `role-register.json`, `log-forwarding.json`; `deploy/eventlog-dcr.json`, `Invoke-HtScheduledRun.ps1`, `Register-HtScheduledJobs.ps1` |
| `04-requests-in-servicenow-and-sailpoint.md` | Chapter 04 — Requests In: ServiceNow Catalog Items and the SailPoint Approval | 1, 2, 4 and 5, the front door | `servicenow/`, `sailpoint/access-profiles.json`, `config/request-items.json` |
| `05-the-request-pipeline-and-the-one-time-secret.md` | Chapter 05 — The Request Pipeline and the One-Time Secret | 1, 2, 4 and 5, the actuation | `Connect-HtRequestSystems`, `Invoke-HtRequestQueue`; `deploy/Invoke-HtRequestPipeline.ps1`, `Register-HtRequestPipeline.ps1` |
| `06-deploying-to-test-and-production.md` | Chapter 06 — Deploying to Test and Production | All eight | `deploy/`: both settings templates, both run scripts, both registration scripts, the data collection rule |

## Link, don't repeat

- Book 15, Chapter 12 holds the eight tasks, their governed procedure and the controls each supports. Link the task's heading; don't restate the procedure.
- *Building Ticket-to-Machine* already teaches the ServiceNow client and its least privilege (Chapter 02), the SailPoint client and its scopes (Chapter 03) and the re-read rule (Chapter 05), and the Ticket-to-Machine learning path teaches them as training. Chapters 04 and 05 link those and add only what this kit does differently.
- The Permissions by Run page (`docs/reference/permissions-by-run.md`) lists every run's permissions from `config/calls.json`. Chapters show `Get-HtRequiredPermission`'s output and link the page; they don't keep a second table of permissions.
- The platform host guide (`docs/books/guides/platform-host-implementation.md`) and Book 10, Appendix B build and describe the host. Chapter 06 links them for the host itself and covers only the help desk jobs and the pipeline on it.
- The Ticket-to-Machine topic page (`docs/topics/ticket-to-machine.md`) is where this workbook is listed.

## Every chapter has

Chapter 06 is the exception: a runbook, not a task. It has no heading with "Lab 1" or "Lab 2" (`scripts/kit_captures.py` and `scripts/generate_labs.py` key on those headings); every step is a command block, its fixture outputs are labeled with the date they were captured, and its live results are written as expected results. It has a `## Stage 1: test` heading, which the training path's Module 6 Lab 2 links. It keeps the verified facts, dangers, checklist, footnotes and verification log the others have.

Chapters 01 to 05 have: In this chapter; goal and audience; start with the documentation (what Microsoft Learn, ServiceNow or SailPoint gives you and what it leaves to you, as a table whose rows the kit's tests pin); the code; an Illustrative code callout; Lab 1 on the fixtures with no tenant, every step an exact command whose output `python scripts/kit_captures.py ht` captured; Lab 2 in a test tenant, instance or SailPoint sandbox, its placeholders listed once at the top, with a scripted back-out step, marked not run by the authors; verified facts; federal requirements and evidence (what the output proves, the requirement it supports, the KSI it aligns to, who keeps it); dangers with the guard for each; a checklist; Continue the book; footnotes.

## Rules

- Front matter as in Chapter 01, with `doc-type: workbook-chapter`, `family: dw-help-desk-automation`, `part: How`, `series-order: N` and `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`.
- No "Book NN" in this workbook's own name or title. No narrated chapter tour until the chapter is approved.
- **The vendor's own documentation, Microsoft Learn first.** Cite Learn for every Microsoft fact, ServiceNow's documentation for ServiceNow and SailPoint's (developer.sailpoint.com, documentation.sailpoint.com or its published API specification) for SailPoint. Reuse footnotes other pages already verified, with their read date and where they were carried from. Never invent an endpoint, permission or field; what couldn't be verified stays *not yet specified* and goes in the chapter's verification log.
- **GCC Moderate only.** The estate is Microsoft 365 GCC with commercial Azure: `graph.microsoft.com`, `management.azure.com`, `Connect-MgGraph -Environment Global`. Name no other government cloud. A comparison of cloud platforms, if one is needed, covers Oracle Cloud Infrastructure.
- **Where it runs.** WD-181: the four read-only jobs run as Windows scheduled tasks under `gmsa-fmpassess$` and sign in as the help desk audit reader app. WD-182: the request pipeline runs under its own gMSA (an example name is `gmsa-fmphelpdesk$`), never the assessment gMSA, and signs in as the help desk request worker app. WD-183 covers both gMSAs as part of the host's one Active Directory exception. Say "the agency's system access management tool", never an acronym or product name for it.
- **Claims.** The kit's evidence *supports* a control; it never satisfies or meets one. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report them. Use only the controls and KSIs `config/requirements.json` lists for each step.
- **Labs.** Every step is an exact copy-paste command in a fenced `powershell` block, run in PowerShell 7.1 or later from `examples/help-desk-automation` (the module declares `#Requires -Version 7.1`; it is a Graph and Azure kit). Values the reader supplies are `<placeholders>` listed once at the top of the lab; expected output follows. Prose says why and what to look for, never what to type. Every fixture command passes `-AsOf`, so the output doesn't depend on the day or the machine's time zone. Avoid output that depends on the console's width: pipe tables to `Out-String -Width 200`.
- Footnote keys are unique in this workbook: `[^htNN-key]` in Chapter NN, `[^hti-key]` on the index. Access dates read "(read November 27, 2026)", or the original date of a footnote carried from another page.
- Never name an agency, a real server, tenant ID or hostname. Use the fixtures' fictional `contoso.example` values and `CONTOSO\` account names.
- Keep LF line endings. Each chapter keeps `_verification/<file-stem>.md`: a claims log and a carry-forward ledger.
