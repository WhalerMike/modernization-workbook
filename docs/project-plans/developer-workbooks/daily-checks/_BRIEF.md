# Building the Daily Checks Workbook (developer workbook) — plan and chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/daily-checks/`. Files and folders starting with `_` aren't rendered. This workbook is the code-first companion to the [Daily Checks Dashboard implementation guide](../../../books/guides/daily-checks-dashboard-implementation.md) (draft, review pending) and its learning path, `docs/training/daily-checks-dashboard/` (two modules). Written November 18, 2026, after Mike asked "Can any of the Daily Checks be put onto a Dashboard?" and, on the design below, "Build it, and document it please."

## What already exists (searched origin/main, November 18, 2026)

- **The daily checks themselves** are [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md): the cadence table's four Daily rows, the by-family table's Daily column, task 6 (the morning synchronization probe), task 7 (event-log handling), and "Entra Health monitoring and recommendations". This workbook reads them; it doesn't restate them.
- **Already cited there:** the Sentinel *Data collection health monitoring* workbook and `SentinelHealth` (footnote `c12-sentinel-health`); the telemetry-completeness KQL (the harness section). Entra workbook templates are in [Book 02, Chapter 10](../../../books/b02-identity/10-migrating-and-governing.md). Book 12, Chapter 06 sends the vulnerability summary to a Log Analytics custom table through the Logs Ingestion API; this kit uses the same API for the sync probe's table.
- **The position to keep:** [Book 12, Chapter 12](../../../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md) ("A dashboard is a picture of the evidence") and [Book 15, Chapter 11](../../../books/b15-day2-operations/11-attestation-and-the-compliance-app.md) ("a test that reads a dashboard tile is a screenshot with a schedule"). The workbook is a view. The evidence stays in stored records and tracked tasks. Every page, tab and deck says so, and the kit refuses to record a rendered view as evidence.
- **Nothing conflicting:** no daily-checks dashboard, no workbook JSON template and no kit for Book 15, Chapter 12 existed. `docs/compliance/Vol_III_Book_02_Vulnerability_Management.md` (legacy reference volume) describes an Azure Monitor workbook over the retired HTTP Data Collector API; Book 12, Chapter 06 already supersedes it with the Logs Ingestion API, which this kit follows. Book 05, Chapter 10 states the Intune export timing (daily, up to 48 hours) and the "don't hard-code compliance state strings" pitfall; the devices tab follows both.

## The design (accepted by Mike, November 18, 2026)

One Azure Monitor workbook, "Daily checks", saved against the Sentinel Log Analytics workspace, one tab per daily check. Where a check's data isn't in Log Analytics, the tab is a link out to the built-in portal page, with the click path. Held as a JSON gallery template in the kit, deployed by an ARM template (Bicep source kept beside it) with a what-if dry run first, validated against a manifest, and rendered from fixtures so Lab 1 needs no tenant. Book 15, Chapter 12 links it. Not counted as evidence.

## Tabs, sources and GCC (verified on Learn, November 18, 2026; the guide's table is the home)

| Tab | Daily check (Book 15, Ch 12) | Kind | Tables | GCC (Moderate, commercial Azure) |
|---|---|---|---|---|
| `telemetry` | Telemetry completeness, network sources included | Workbook | `SigninLogs`, `AuditLogs`, `AADRiskyUsers`, `SecurityAlert`, `SecurityIncident`, `IntuneDeviceComplianceOrg`, `CommonSecurityLog`, `DailySyncProbe_CL` (expected list); `SentinelHealth` | Available: the workspace is commercial Azure; Sentinel workbooks GA in Azure commercial. The Defender portal's *Data & connectors* Overview tab is preview and commercial cloud only: not assumed |
| `sync` | Synchronization and service-health probe | Workbook + link-out | `DailySyncProbe_CL` (the probe's output through the Logs Ingestion API) | Logs Ingestion API: available. Connect Health (link-out): not yet specified |
| `entra-health` | Entra Health alerts | Link-out | none (portal, email and Graph beta only) | Not yet specified (as Book 15 says) |
| `risk` | Risky-user and risky-sign-in triage | Workbook | `AADRiskyUsers`, `SigninLogs` | Available (Entra diagnostic settings to the commercial workspace) |
| `emergency-access` | Emergency access alert reviewed for any firing | Workbook | `SigninLogs` | Available. The Azure Monitor alert rule is the control; the tab only shows |
| `devices` | Noncompliant-device queue | Workbook + link-out | `IntuneDeviceComplianceOrg` | Available: Intune in GCC is the commercial service instance |
| `grants` | Consent, role or grant with no ticket | Workbook (partial) | `AuditLogs` | Available. The ticket join isn't in the workbook: ITSM data stays in the ITSM tool |
| `data` | DLP and label-change alerts | Workbook | `SecurityAlert` | Available: Defender XDR alerts in `SecurityAlert` are GA for Commercial / GCC |
| `tasks` | Catalog and remediation tasks | Link-out | none (the ITSM tool's own dashboards) | n/a |
| `log-review` | Log review findings | Workbook (queue only) | `SecurityIncident` | Available. The review stays a recorded procedure |

## Chapters

| File | Title | Kit | Module |
|---|---|---|---|
| `01-the-daily-checks-and-where-each-lives.md` | Chapter 01 — The Daily Checks and Where Each One Lives | `config/manifest.json`, `Get-DcTab`, `Show-DcManifest.ps1` | 1 |
| `02-the-workbook-template-and-its-validator.md` | Chapter 02 — The Workbook Template and Its Validator | `workbook/daily-checks.workbook.json`, `New-DcTemplate`, `Test-DcWorkbook.ps1` (DC-V-01 to -10) | 1 |
| `03-what-each-tab-would-show.md` | Chapter 03 — What Each Tab Would Show | `Invoke-DcRender.ps1`, fixtures `day1`/`day2`, `deploy/Test-DcReachability.ps1` (Lab 2) | 2 |
| `04-deploying-to-test-and-production.md` | Chapter 04 — Deploying to Test and Production | `deploy/` (preflight PF-01 to -06, plan and what-if, deploy, rollback), `Invoke-DcEvidence.ps1` | 2 |

## The kit: `examples/daily-checks-workbook` (new)

PowerShell 7.1 and Pester 5, one module (`powershell/DailyChecks`), entry scripts, `deploy/`. The workbook template is built from `config/manifest.json` and `queries/<tab>.kql` by `New-DcTemplate`, and a test keeps the committed template equal to the build. The validator parses any gallery template (the committed one, or one exported from the portal) and checks it against the manifest: one tab per daily check, each query's tables and look-back, the workspace parameter, the not-evidence banner and link-outs on every tab, and no subscription IDs, GUIDs, e-mail addresses or secrets. The renderer applies each tab's manifest rule to fixture query results and prints what the tab would show (ATTENTION, CLEAR, STALE, NO DATA, LINK-OUT); a stale source never renders CLEAR. `deploy/` writes the ARM parameters (the workspace ID and the emergency access object IDs come from the settings file, never the template), the what-if and create commands, and a plan with its SHA-256; nothing is created without `-Apply` and the approved hash. Evidence records (controls and KSIs from `config/requirements.json`) cover the validation, the plan, the deployment, the reachability check and the rollback; a render folder is refused. Fixtures: one fictional workspace for `contoso.example`, read on two mornings (`tests/fixtures/day1` with gaps, `day2` fixed).

## Rules

As the Global Secure Access brief: front matter with `family: dw-daily-checks`, `review-status: pending` (never approve); Learn first, with access dates; exact command blocks in every lab, placeholders listed once; Lab 1 captured by `scripts/kit_captures.py dc`; Lab 2 labeled not run; a requirements table per chapter worded "supports"; footnote keys `[^dcNN-key]`, `[^dcwi-key]` on the index; no agency names; `contoso.example` only; each chapter keeps `_verification/<file>.md`; open questions in `_verification/research-gaps.md`. Chapter 04 is a runbook with no Lab 1 or Lab 2 heading. GCC Moderate and commercial Azure only.
