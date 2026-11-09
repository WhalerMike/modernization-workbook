# Verification — Chapter 09, Deploying to Test and Production

New material. Code: `deploy/` (new: `deploy_common.py`, `preflight.py`, `render_workflows.py`, `smoke_test.py`, `rollback.py`, `record.py`, `step_evidence.py`, `environment.example.json`); `tests/python/test_deploy.py` (new, 32 tests); `tests/fixtures/deploy/` (fictional settings for both stages and saved responses, new); `config/calls.json` (tasks `deploy-check`, `smoke-raise`, `workflow-test`; calls `isc-workflows-list`, `isc-workflow-patch`, `isc-workflow-test`, `isc-workflow-execution`); the kit README (the deployment section, permissions rows, verify-list items 20 to 24). Tests on November 2, 2026: `python -m pytest examples/servicenow-sailpoint/tests/python -q`, 139 passed; the chapter's printed output was produced by running each command shown, that day, from `examples/servicenow-sailpoint`.

Nothing in Stage 1 or Stage 2 has been run against a live instance or tenant. The chapter says so in its Status callout and states every live result as an expectation.

Vendor pages opened on November 2, 2026:

- FedRAMP Marketplace data, `products.json` (meta `last_change` 2026-11-01T05:02:56Z): F1305072116 and FR2001938710A.
- SailPoint: "Identity for government and critical infrastructure"; Developer "Authentication"; "Managing API Keys and Personal Access Tokens"; "Managing Native Change Detection"; "Loading Account Data"; "Workflow Actions" (HTTP Request authentication types; the page gives no JSON attribute names and no menu path to the editor). OpenAPI specification at commit `5a6ea75` (2026-11-02): root `sailpoint-api.v2025.yaml` (servers, the workflow paths), `v2025/paths/workflows/workflows.yaml`, `workflow.yaml`, `workflow-test.yaml`, `workflow-execution.yaml`, `workflow-executions.yaml`, `v2025/schemas/workflows/WorkflowBody.yaml`, `Workflow.yaml`, `WorkflowExecution.yaml`.
- ServiceNow: "Client credentials grant workflow" (Zurich, October 8, 2026); "Get started with update sets" (Zurich); "ServiceNow application repository" (Zurich); "Install an application from the application repository" (Zurich); "Publish an app from App Engine Studio when linked to source control" (Zurich); "Legacy - Roll back, back out, and uninstall" (Australia, March 12, 2026; the page served in Portuguese, the claims were read from it); "Add a system property" (Zurich; the Australia page also opened); "Business Rule API - ServiceNow Fluent" (Zurich); "Create a change request" (Zurich). Searched and not found as a Zurich page: "Roll back an application" (the Washington DC and Zurich addresses returned not found); a Zurich procedure for "Publish to My Application Repository" outside App Engine Studio (only Xanadu and an Australia page in Portuguese); a vendor page giving the business rules menu path.
- Microsoft Learn, through the Learn MCP tools: "How to create, invite, and delete users"; "Add or update a user's profile information and settings in the Microsoft Entra admin center"; "Microsoft Graph national cloud deployments".
- FedRAMP, "Key Security Indicators" (2026 reference page): 46 indicators; the related SP 800-53 controls of KSI-IAM-ELP, IAM-SNU, IAM-JIT, IAM-APM, CMT-LMC, CMT-RMV, CMT-RVP, CMT-VTD, MLA-EVC, MLA-OSM, MLA-LET, SCR-MIT, PIY-GIV, SVC-ACM, RPL-ARP, RPL-TRC and INR-RIR read; latest changelog October 13, 2026. Every KSI in the chapter is one Book 13, Appendix A or Book 02, Chapter 10 already cites, and each pair was checked against that indicator's related controls.
- Reused without re-reading, with their original access dates: OMB M-22-09 section III.A and CISA BOD 25-01 required configurations, as cited in Book 01, Chapter 04.
- NIST SP 800-53B Moderate baseline OSCAL profile 5.2.0 (last modified 2026-10-22): AC-2, AC-5, AC-6, AU-6, AU-9, AU-12, CA-7, CM-3, CM-3(2), CM-3(4), CM-4, CM-4(2), CM-5, CM-6, CP-10, IA-5, SA-9, SA-10 present.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Both FedRAMP listings: IDs, status, impact level, path, authorization date | Pre-flight 1; facts | verified | Marketplace data |
| 2 | SailPoint's FedRAMP ISC: AWS GovCloud, modules listed, no unavailable-features list, NCD and HTTP Request step not named | Pre-flight 2; facts | verified | SailPoint FedRAMP page |
| 3 | ServiceNow client-credentials token request | Pre-flight 3; facts | verified | Client credentials grant workflow |
| 4 | Machine Identity Console path | Pre-flight 3 | carried forward, linked to Chapter 02, not re-read | Chapter 02 |
| 5 | ISC API client and personal access token paths; least scopes guidance | Pre-flight 3; roles table | verified | Managing API Keys and PATs |
| 6 | ISC token URL; `/oauth/info` for vanity domains | Pre-flight 3; facts | verified | SailPoint Authentication |
| 7 | Update sets not meant for installing applications | Step 1.1; facts | verified | Get started with update sets |
| 8 | App Engine Studio publish path, commit, tag, publish; `admin` | Step 1.1; facts | verified | Publish an app from App Engine Studio |
| 9 | Install path, version selection; `admin` | Step 1.1; Stage 2; facts | verified | Install an application from the application repository |
| 10 | Repository: entitlement default; not for self-hosted; Federal Store sign-in route | Facts; couldn't verify | verified | ServiceNow application repository |
| 11 | `sys_properties.list`; `admin` | Step 1.1; facts | verified | Add a system property |
| 12 | Business rule `active` meaning; `sys_script` | Step 1.8; facts | verified | Business Rule API - ServiceNow Fluent |
| 13 | Application rollback removes code, tables, files; data needs a restore; source-control installs not recorded | Step 1.8; Stage 2; facts | verified on a legacy Australia page; Zurich steps not found (verify list 23) | Legacy - Roll back, back out, and uninstall |
| 14 | Change request path, types, roles | Before you start; facts | verified | Create a change request |
| 15 | A normal change fits a first deployment | Before you start | design guidance, from the guide's lane table | example guide, Gate 2 |
| 16 | NCD menu path, recommendation, aggregate after saving | Step 1.2; facts | verified | Managing Native Change Detection |
| 17 | Aggregation menu path | Step 1.2; Step 1.6; facts | verified | Loading Account Data |
| 18 | Workflows created disabled | Step 1.3; facts | verified | `WorkflowBody.yaml` |
| 19 | List, create, patch workflows: paths and scopes; JSON Patch on `/enabled`; v2025 server | Steps 1.3, 1.5, 1.8; calls.json; facts | verified | `workflows.yaml`, `workflow.yaml`, root spec |
| 20 | Test workflow: must be disabled; scope; `ORG_ADMIN`; live run; execution ID | Roles; Step 1.4; calls.json; facts | verified | `workflow-test.yaml` |
| 21 | Get execution: scopes, `ORG_ADMIN`, 90 days, status values | Step 1.4; Stage 2 step 8; calls.json; facts | verified | `workflow-execution.yaml`, `WorkflowExecution.yaml` |
| 22 | `executionCount` and `failureCount` on a workflow | `preflight.py` (code, not prose) | verified | `Workflow.yaml` |
| 23 | Entra create-user path, Account enabled, User Administrator | Before you start; facts | verified | Learn, create users |
| 24 | Entra edit-properties path, Job information, User Administrator | Step 1.6; facts | verified | Learn, user profile |
| 25 | GCC uses worldwide Graph | Facts | verified | Learn, national cloud deployments |
| 26 | Moderate baseline controls | Evidence; federal requirements | verified | OSCAL profile 5.2.0 |
| 27 | CP-10 read for the integration | Evidence; federal requirements | inference | — |
| 28 | Rollback disables intake and keeps records | Step 1.8 | carried forward from the guide's rollback table; not uninstalling is design guidance | example guide |
| 29 | The scripts' printed output | The code | verified by running the commands on November 2, 2026 | local run |
| 30 | Every Stage 1 and Stage 2 "expect" | Stages 1 and 2 | not run; expectations from the kit's code and the vendor pages | — |
| 31 | The workflow secret accepted in `oAuthClientSecret` through the API | Step 1.3 | not verified (research gaps, row 83) | — |
| 32 | ISC attribute names matching `department` | Step 1.6 | not verified, inference (research gaps, row 82) | — |
| 33 | KSIs are providers' indicators; the agency lines its evidence up and doesn't report them | Requirements callout | carried forward | Book 00, Appendix B |
| 34 | Each control-to-KSI pair in the requirement tables and `step_evidence.py` | Requirement tables; facts | verified: the KSI's related controls include the control (IA-5 for non-user accounts to KSI-IAM-SNU follows Book 02, Chapter 10; SNU's own list has IA-5(2) and AC-2) | FedRAMP KSI page |
| 35 | M-22-09 phishing-resistant MFA for staff; KSI-IAM-APM | Pre-flight and production tables | carried forward from Book 01, Chapter 04 (accessed October 21, 2026); the APM alignment follows Book 02, Chapter 10 (IA-2) | M-22-09 |
| 36 | BOD 25-01: the runbook changes no tenant setting the required configurations cover; KSI-MLA-EVC | Step 1.6 and production tables | inference | BOD 25-01 required configurations, as cited in Book 01, Chapter 04 |
| 37 | CP-10 to KSI-RPL-ARP and KSI-RPL-TRC | Step 1.8 and production tables | verified pair; CP-10 for the integration is inference | FedRAMP KSI page; Book 13, Appendix A |
| 38 | The step evidence records and the completeness check's output | The code | verified by running the commands on November 2, 2026 | local run |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Example guide: G1 to G7, prerequisites (environments, roles), rollback table | Every step's gate link; Before you start; Step 1.8; Stage 2 step 9 | The guide's interim paths stay in the guide; the runbook links Gate 4's |
| Example guide: G1 steps 1, 2, 6 | Pre-flight 1 to 3 | Steps 3 to 5 (product naming, vendor-cloud data flows, government Store) are records, not commands; left to the Gate 1 record |
| Chapter 02: roles split by task, Machine Identity Console, basic authentication for developer instances only | Roles table; pre-flight 3 and 4 | — |
| Chapter 03: ISC API clients, personal access token for user-level endpoints | Roles table; workflow tester | — |
| Chapter 05: re-read client, grace period | Step 1.6; Stage 2 steps 7 and 8 | — |
| Chapter 07: evidence export and verifier | Step 1.7 | — |
| Chapter 08: one writer per attribute | Step 1.6 note on inbound provisioning | — |
| Kit README: ServiceNow setup, system properties, verify list | Before you start; Step 1.1; couldn't verify | The table definition stays in the README |
| Searched but not used: SailPoint developer-forum posts on the HTTP Request step's OAuth secret | — | Not vendor documentation; the question went to research gaps, row 83 |

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499) reported changes in cited sources. Checked November 9, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| FedRAMP Marketplace `products.json` (`last_change` 2026-11-09T05:06:48Z) now nests listings under `data.Products`, reports `impact_level` as `Unknown` and leaves `fedramp_auth` and `cert_date` empty for all 791 listings. Pre-flight 1's command failed against it (`TypeError` on `d['data']`) | Command rewritten to read `data.Products` (or a top-level list), print `cert_class`, and take the certification date from the listing's event log; run against the November 9 data, it prints `F1305072116 Government Community Cloud FedRAMP Certified Class D JAB 2019-08-12` and `FR2001938710A SailPoint Identity Security Cloud FedRAMP Certified Class C Agency 2024-06-05`. Expected output, facts rows and footnote `ttm09-fedramp` updated (row 1) |
| SailPoint OpenAPI v2025 `workflows.yaml` at commit `2a1f293` (2026-11-03): `listWorkflows` and `createWorkflow` now carry `x-sailpoint-userLevels: ORG_ADMIN`; scopes unchanged; new basic-mode trigger filter (`mode`, `filterDefinition`) is optional, so the kit's `filter.$` triggers stay valid | Facts row and footnote `ttm09-wf-spec` add the user level (row 19). The workflow administrator is an API client, so no step changes |
