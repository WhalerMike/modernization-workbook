# The daily checks as one Azure Monitor workbook

The kit behind the [Daily Checks Dashboard implementation guide](../../docs/books/guides/daily-checks-dashboard-implementation.md) and its developer workbook, [*Building the Daily Checks Workbook*](../../docs/project-plans/developer-workbooks/daily-checks/index.md). It puts the daily checks of the operator runbook ([Book 15, Chapter 12](../../docs/books/b15-day2-operations/12-the-day-two-runbook.md)) on one Azure Monitor workbook in the Sentinel Log Analytics workspace, one tab per check, and keeps that workbook as reviewed code.

- **A view, not evidence.** The workbook shows the checks; it proves nothing. The evidence is the record each check writes (the probe's result, the alert, the closed task) and the kit's own records of the template, the deployment and the reachability check. `Invoke-DcEvidence.ps1` refuses a rendered view.
- **One tab per daily check.** Ten tabs (`config/manifest.json`). Where a check's data isn't in Log Analytics (Entra Health, the ITSM task queue) the tab links out to the portal that holds it, with the click path.
- **Template as code.** `workbook/daily-checks.workbook.json` is the gallery template, built from the manifest and `queries/*.kql`. The validator checks it, or a copy exported from the portal's Advanced Editor, against the manifest: one tab per check, each query's tables and look-back, the workspace parameter, the not-evidence banner and link-outs, and no IDs, addresses or secrets.
- **No tenant for Lab 1.** The renderer applies each tab's rule to saved query results and prints what the tab would show. A tab whose source is past its freshness limit shows STALE, never CLEAR.
- **Plan, what-if, then deploy.** `deploy/` writes the ARM parameters (the workspace and the emergency access object IDs come from the settings file, never the template), runs `az deployment group what-if`, and deploys only with `-Apply` and the plan's approved SHA-256. Commercial Azure (`AzureCloud`) only: Microsoft 365 GCC (Moderate) pairs with it.
- **Illustrative.** Tested against a fictional `contoso.example` workspace, not deployed to a live subscription.

## Layout

```
Show-DcManifest.ps1             list the tabs, or one tab in full (-Id)
New-DcWorkbookTemplate.ps1      build the template from the manifest and queries; -Check compares
Test-DcWorkbook.ps1             validate a template (DC-V-01 to -10); -OutputPath records the run
Invoke-DcRender.ps1             what each tab would show, from fixtures (a picture, never evidence)
Invoke-DcEvidence.ps1           record a run folder as evidence; -Check verifies the folder and a stage
config/manifest.json            the tabs: daily check, kind, fit, tables, queries, link-outs, GCC, render rule
config/requirements.json        each step's SP 800-53 controls and KSIs, and each stage's steps
queries/*.kql                   one file per query (read-only KQL)
workbook/daily-checks.workbook.json   the gallery template (Notebook/1.0)
powershell/DailyChecks/         the module
deploy/                         main.json and main.bicep, settings template, preflight, plan, deploy, rollback, reachability
tests/                          Pester 5; fixtures: day1 and day2 query results, an edited export, reachability answers
copilot-prompts.md              prompts for Microsoft 365 Copilot Chat, to fill the settings at work
```

## Tabs

| Tab | Daily check | Kind | Tables | Fit |
|---|---|---|---|---|
| `telemetry` | Telemetry completeness, network sources included | Workbook | the expected tables; `SentinelHealth` | Strong |
| `sync` | Synchronization and service-health probe | Workbook + link-out | `DailySyncProbe_CL` | Strong |
| `entra-health` | Entra Health alerts | Link-out | none | Link-out |
| `risk` | Risky-user and risky-sign-in triage | Workbook | `AADRiskyUsers`, `SigninLogs` | Strong |
| `emergency-access` | Emergency access alert reviewed | Workbook | `SigninLogs` | Strong |
| `devices` | Noncompliant-device queue | Workbook + link-out | `IntuneDeviceComplianceOrg` | Good |
| `grants` | Consent, role or grant with no ticket | Workbook | `AuditLogs` | Partial: the ticket match stays in the ITSM tool |
| `data` | DLP and label-change alerts | Workbook | `SecurityAlert` | Good |
| `tasks` | Catalog and remediation tasks | Link-out | none | Weak: the ITSM tool's own dashboards |
| `log-review` | Log review findings | Workbook | `SecurityIncident` | Partial: the queue only |

The guide gives each tab's sources, verified on Microsoft Learn, and their GCC availability.

## Lab 1: fixtures, no tenant

From `examples/daily-checks-workbook`, in PowerShell 7 with Pester 5:

```powershell
./Show-DcManifest.ps1
./Test-DcWorkbook.ps1
./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json
./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z -OutputPath out/day1
./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day2 -AsOf 2026-11-17T07:30:00Z -OutputPath out/day2
./deploy/New-DcDeploymentPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -OutputPath out/plan -AsOf 2026-11-16T08:00:00Z -WhatIfResultPath deploy/tests/fixtures/whatif-create.json
```

On day 1 the Entra diagnostic setting has stopped overnight and the sync probe didn't run: the telemetry tab shows three dark tables and a failing connector, and the risk, emergency access, grants and sync tabs show STALE, not CLEAR. On day 2 the sources are back and the queues show what they were hiding. The exported copy fails four checks. Each chapter of the workbook runs its part of this, step by step, with the output it prints.

## Lab 2 and deployment

Lab 2 (each chapter's) and the runbook (Chapter 04) use a test subscription and workspace, signed in with `az login` to commercial Azure. The deployer needs Workbook Contributor and `Microsoft.Resources/deployments/*` on the resource group (what-if has the same permission requirements as a deployment); the reachability check needs Log Analytics Reader on the workspace and the Azure CLI's `log-analytics` extension. `<settings-file>` is your copy of `deploy/settings.template.json` with every placeholder filled; keep it, and `<output-folder>`, outside any repository.

```
deploy/settings.template.json       the settings file: copy per environment, fill every <placeholder>; no secrets
deploy/Test-DcPreflight.ps1         PF-01 to PF-06
deploy/New-DcDeploymentPlan.ps1     parameters, what-if (-RunWhatIf), the create command and the SHA-256 to approve
deploy/Invoke-DcDeploy.ps1          deploys only with -Apply and the approved SHA-256; refuses a Delete
deploy/Invoke-DcRollback.ps1        plans the rollback (find, delete, or redeploy the previous plan); runs nothing
deploy/Test-DcReachability.ps1      read-only: each tab's tables, newest record and count, against its limit
deploy/main.json, main.bicep        the Microsoft.Insights/workbooks resource (2023-06-01); the kit deploys main.json
```

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | KSIs | What the ISSO keeps |
|---|---|---|---|
| Validate the template | CM-2, CM-3 | KSI-SVC-ACM, KSI-CMT-LMC | `results.json`, the template's SHA-256 |
| Preflight | AC-6, CM-6 | KSI-IAM-ELP, KSI-SVC-ACM | `results.json` |
| Plan and what-if | CM-3, CM-4 | KSI-CMT-LMC, KSI-CMT-RVP | `plan.json`, `parameters.json`, `whatif.json` |
| Deploy | CM-3, CM-2 | KSI-CMT-LMC, KSI-SVC-ACM | `result.json`, the approved plan |
| Reachability | CA-7, SI-4 | KSI-MLA-EVC, KSI-MLA-LET | `reach.json` |
| Rollback plan | CM-3, CP-2 | KSI-CMT-LMC, KSI-RPL-ARP | `rollback.json` |
| Evidence | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | `records/`, `records.csv`, `SHA256SUMS` |

Every control-to-KSI pair reuses one the [Azure security kit](../azure-security/config/requirements.json) verified. The records support these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with what its providers report against them and doesn't report KSIs itself. The rendered view is never on this list.

## Your workspace stays at work

The settings file, plans and evidence name the agency's tenant, subscription, workspace and emergency access accounts: run the kit at work, keep its output on agency storage, and never put it in a public or personal repository. [`copilot-prompts.md`](copilot-prompts.md) has prompts for Microsoft 365 Copilot Chat to help fill the settings there.

## Run the tests

```powershell
Invoke-Pester -Path tests
Invoke-Pester -Path deploy/tests
```

33 tests in `tests` and 19 in `deploy/tests`; no tenant, no network, and no `az` started (a stand-in answers the deploy tests).
