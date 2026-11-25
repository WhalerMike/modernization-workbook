# Building SQL Server Identity (developer workbook) — plan and chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/sql-server-identity/`. Files and folders starting with `_` aren't rendered. This workbook is the code-first companion to [Book 06 — Data Platform: SQL Server Identity](../../../books/b06-data-platform/index.md). Book 06 has no separate implementation guide: its ten runbooks (R01 to R10) are the step-by-step guide, and the topic hub records that as "not needed". Written November 24, 2026, after Mike's go-ahead to fill the Data Platform and SQL Server gaps in the Topics gap matrix ("Fill in the gap matrix"), phase 1 of 2: the workbook and kit. Phase 2, the learning path and its labs, is a separate PR.

## What already exists (searched origin/main, November 24, 2026)

- **Book 06** (23 chapters, appendices A to C, runbooks R01 to R10) holds the design, the Learn-cited facts and the procedures. Every chapter here links to the chapter and runbook it rests on and doesn't restate them.
- **The runbooks' program scripts** (`Spec3-D1.8`, `Get-SQLServerAuthAudit`, the `FMPSqlServerMigration` module, `New-FMPEntraLoginMapping`, `Test-FMPLoginParallelRun`) exist only as text in `archive/b06-data-platform/`, not as code in `examples/`. This workbook's kit is new code that does the same jobs on fixtures; it doesn't claim to be those scripts.
- **The Start Kit** (`examples/start-kit/powershell/FMPSqlEstate`) finds SQL Server instances from SPNs, directory objects and the Browser service, and its README states the read rights (Tier A, Tier B). Chapter 01 starts from its output and links it; it doesn't rebuild discovery.
- **Microsoft Automation, Module 4** (`docs/training/ms-automation-arc.md`) teaches Azure Resource Graph reads of Arc-enabled SQL Server. Chapter 03 links it for the Graph client and paging.
- **Building Non-Person Identity** tags SQL Server service accounts and hands them to the Data Platform project (its Chapters 01, 02, 03 and 06); the [service account guide](../../../books/guides/service-account-migration.md) gives the method. Chapter 02 reports the engine's service account and says so; it doesn't convert it.
- **Building Privileged Access** owns PIM for the `sysadmin` group and emergency access. Chapter 05 links it.
- **Building Ticket-to-Machine** routes drift as typed tasks. Chapter 09 links it.
- **Book 07** owns the certificate lifecycle platform and the AD CS decommission. Chapter 08 links it.
- **The SQL Server inventory permissions research** (side-session note, Nov 13) found the read rights gap the Start Kit README fills; `Export-SqlAuditSnapshot.ps1` states the same rights.
- **Nothing conflicting**: no SQL Server developer workbook, kit or learning path existed. DP consolidation (`examples/dp-consolidation`) is Configuration Manager distribution points, not data platform.

## The kit: `examples/sql-server-identity` (new)

PowerShell 7.1 and Pester 5 (90 tests), one module (`powershell/SqlIdentity`), pure functions, entry scripts that write CSV, JSON and `manifest.json` (controls and KSIs from `config/requirements.json`, SHA-256 of each file with LF line endings). `deploy/` holds the runbook's scripts; nothing changes an instance without `-Apply` and the approved hash. Two live exporters (`Export-SqlAuditSnapshot.ps1`, SELECT only; `Export-SqlArcSnapshot.ps1`, Resource Graph, Reader) write snapshots in the fixtures' shape for Lab 2. Fixtures: one fictional estate for `contoso.example` (eight instances), audit snapshots on day 1 and day 30, Arc results, groups, SPNs, linked servers, clients, application configurations, certificates, an exception registry, a login mapping.

## Chapters

| File | Title | Book 06 | Kit | Step |
|---|---|---|---|---|
| `01-the-estate-and-the-consolidation-gate.md` | Chapter 01 — The Estate and the Consolidation Gate | Ch 03 to 06, R02 | `Invoke-SqlEstate.ps1`, `Get-SqlEstateClassification` | ESTATE |
| `02-the-authentication-audit.md` | Chapter 02 — The Authentication Audit | Ch 07 to 08, R03 | `Invoke-SqlAuthAudit.ps1`, `Get-SqlLoginCensus`, `Get-SqlAuthFinding`, `Export-SqlAuditSnapshot.ps1` | AUDIT |
| `03-arc-and-the-engines-identity.md` | Chapter 03 — Arc and the Engine's Identity | Ch 09 to 10, R04 | `Invoke-SqlArcCheck.ps1`, `Get-SqlArcCategory`, `Export-SqlArcSnapshot.ps1` | ARC |
| `04-entra-logins-and-the-parallel-run.md` | Chapter 04 — Entra Logins and the Parallel Run | Ch 11 to 12, R05 | `New-SqlLoginPlan.ps1`, `Test-SqlParallelRun.ps1` | LOGINS, PARALLEL |
| `05-groups-roles-and-the-perimeter.md` | Chapter 05 — Groups, Roles and the Perimeter | Ch 16 to 17, R07 | `Invoke-SqlGroupMap.ps1`, `Get-SqlGroupPattern` | GROUPS |
| `06-ntlm-and-the-spns.md` | Chapter 06 — NTLM and the SPNs | Ch 14 to 15, R06 | `Invoke-SqlNtlmAudit.ps1`, `Get-SqlNtlmFinding` | NTLM |
| `07-the-application-chain.md` | Chapter 07 — The Application Chain | Ch 18 to 19, R08 | `Invoke-SqlConnectionScan.ps1`, `Find-SqlConnectionString` | CONN |
| `08-ad-cs-dependencies.md` | Chapter 08 — AD CS Dependencies | Ch 22, R10 | `Invoke-SqlCertDependency.ps1`, `Get-SqlCertificateDependency` | CERTS |
| `09-closure-drift-and-evidence.md` | Chapter 09 — Closure, Drift and Evidence | Ch 20 to 21, R09 | `Invoke-SqlClosure.ps1`, `Compare-SqlAuditRun.ps1` | CLOSURE, DRIFT |
| `10-deploying-to-test-and-production.md` | Chapter 10 — Deploying to Test and Production | R05, App B | `deploy/` | PRE, PLAN, DEPLOY, RB, EVIDENCE |

## Rules

- Front matter: `doc-type: workbook-chapter`, `audience: [Technical]`, `family: dw-sql-server-identity`, `part: How`, `series-order: N`, `status: draft`, `lifecycle: active`, `tiers_adopted: []`, `lifecycle_review: 2027-05-01`, `review-status: pending` (never approve; Mike approves).
- Sections in this order: In this chapter (callout), Goal and audience, Start with Microsoft's documentation (What Microsoft gives you / What it leaves to you), The code, Illustrative code (callout), Lab 1: fixtures, no tenant, Lab 2: a test instance (labeled not run by the authors, with a back-out step), Verified facts, Federal requirements and evidence, Dangers, Checklist, Continue the book. Chapter 10 is a runbook with no Lab 1 or Lab 2 heading.
- Learn first, every Microsoft claim footnoted with the page and the date read (`[^sqNN-key]`; `[^sqwi-key]` on the index). Reuse Book 06's Learn citations where they hold; re-read the page and give today's date.
- Exact command blocks in every lab (```powershell), run from `examples/sql-server-identity` (say "Work in `examples/sql-server-identity`"), placeholders listed once at the top of Lab 2, expected output in a ```text block copied from a real run. Lab 1 is captured by `scripts/kit_captures.py sql`.
- A requirements table per chapter, worded "supports" (CONTRIBUTING, claim language), with the controls and KSIs from `config/requirements.json` only.
- No agency names; `contoso.example` only; GCC (Moderate) with commercial Azure (`AzureCloud`, WD-028 and WD-085) only.
- Each chapter keeps `_verification/<file>.md`: every external claim, its source, the date read, and the result. Open questions go to `_verification/research-gaps.md`.

## Narrated decks (not built in this PR)

PowerPoint automation runs one session at a time, and other sessions are working, so no decks or videos are built here. Planned, per CONTRIBUTING and WD-102: one narrated chapter tour per chapter (ten, `DW_SQL_NN_*`, devwb.js layout, Lab 1 slides from the captures), and one story deck that follows SQLPRD01 from the estate inventory through the parallel run to its closure record, with the SQLPRD06 drift on day 30.
