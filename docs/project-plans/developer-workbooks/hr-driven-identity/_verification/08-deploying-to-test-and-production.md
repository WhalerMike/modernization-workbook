# Verification — Chapter 08, Deploying to a Test Tenant, Then to Production

New material; it replaces no workbook page. Code: `examples/hr-lifecycle/deploy/` (new): `deploy_settings.py`, `preflight.py`, `smoke_test.py`, `rollback.py`, `settings.example.json`, `smoke-workers.json`; three GET-only tasks in `config/calls.json` (`deploy-preflight`, `deploy-job`, `deploy-smoke`); `tests/test_deploy.py` (19 tests) and `tests/fixtures/ch08` (fictional settings for a test and a production tenant, pre-flight exports, and smoke exports for the joiner, mover and leaver phases); the kit README's new section; `.gitignore` (`evidence/`, the environment settings files). `examples/hcm-entra` is unchanged: the runbook calls `hcm_to_scim.py` with a settings file `deploy_settings.py middleware` writes. No Microsoft sample is pinned: Learn publishes no runbook or sample for promoting an HR-driven lifecycle from a test tenant to production.

Test results on November 2, 2026, Windows 11, Python 3.14.3 with pytest: `examples/hr-lifecycle` 76 passed (the 19 in `test_deploy.py` among them); `examples/drift-pipeline` 142 passed (run because `hr-lifecycle` changed). No tenant, no network.

Every fixture-mode output in the chapter was produced on November 2, 2026 by running the commands in `examples/hr-lifecycle` against `tests/fixtures/ch08`, with `out/ch08/...` in place of `"$EVIDENCE/..."` and fixture mode in place of tenant mode, and pasted; `out` was deleted afterwards. `rollback.ps1`'s dry run was run with PowerShell 7 (`pwsh -NoProfile -File`), which printed the commands and changed nothing. `hcm_to_scim.py` was run without `--apply`. Nothing was sent to a tenant, an HR pod or a storage account. **The runbook has not been run against a live tenant**; every live result in the chapter is labeled an expected result.

Microsoft Learn pages opened on November 2, 2026 through the Microsoft Learn MCP tools: Get synchronizationJob; synchronizationStatus resource type; synchronizationJob: pause; Start-MgServicePrincipalSynchronizationJob; Configure API-driven inbound provisioning app; Frequently asked questions about API-driven inbound provisioning; Scoping users or groups to be provisioned with scoping filters; Enable accidental deletions prevention (search excerpts); List subscribedSkus; List roleEligibilitySchedules; Microsoft Entra built-in roles (template IDs, search excerpts); Activate a Microsoft Entra role in PIM; workflow resource type; Update workflow and Update-MgIdentityGovernanceLifecycleWorkflow; workflow: activate; List executionScope; Run a workflow on-demand, Understanding lifecycle workflows, Plan a Lifecycle Workflow deployment and Create a lifecycle workflow (search excerpts); user resource type (search excerpts); Delete a user; Authentication module cmdlets in Microsoft Graph PowerShell; az login, az account get-access-token, Sign into Azure with a service principal, Create a service principal containing a certificate (Key Vault retrieval); Quickstart: Connect to Azure Government with Azure CLI; Configure app permissions for a web API; How to archive Microsoft Entra activity logs to a storage account; az storage blob (upload-batch). Oracle pages opened on November 2, 2026: *Oracle Fusion Cloud HCM Integration with External Entitlement Management Systems*; *REST API for Oracle Fusion Cloud HCM*, "Configure OAuth". Carried: national cloud deployments (Book 19, Chapter 02); feature availability (the guide's log); Perform bulkUpload (Chapter 02); List userProcessingResults (Chapter 06); List provisioningObjectSummary (Chapter 01); Microsoft's Oracle HCM provisioning tutorial (*Building Book 03's HR Pipeline*, read October 25, 2026).

**Why this start.** The guide gives each gate's steps and rollback in prose, and each earlier chapter ends with a test tenant step. Learn gives the pieces a runbook needs (job start, pause and status; scoping filters; workflows on demand before scheduling; the pilot advice) but no runbook. So the chapter starts from the guide's gate order and rollback table and Learn's pilot and on-demand guidance, and adds code only where a step needed a check the kit lacked.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Get synchronizationJob endpoint; application least privileged `Application.ReadWrite.OwnedBy`, higher `Synchronization.Read.All`; US Government L4 and L5 | Pre-flight; verified facts; `config/calls.json` | verified; the kit takes `Synchronization.Read.All` because the "least privileged" one can write (restated, labeled) | Learn, Get synchronizationJob |
| 2 | Status codes `NotConfigured`, `NotRun`, `Active`, `Paused`, `Quarantine`; paused keeps state | Pre-flight; PF-04; RB-01 | verified | Learn, synchronizationStatus |
| 3 | `QuarantineTooManyDeletesThreshold` in `synchronizationJobSettings` | PF-04 Warn | shown in Learn's example response only; **meaning not documented**; treated as a Warn, the admin center step is the control | Learn, Get synchronizationJob |
| 4 | Pause endpoint, state persisted, `Synchronization.ReadWrite.All` delegated, `Suspend-MgServicePrincipalSynchronizationJob` | Rollback | verified | Learn, synchronizationJob: pause |
| 5 | Start continues a paused job, clears quarantine; `Start-MgServicePrincipalSynchronizationJob` | Staged enable; production rollback | verified | Learn, Start-MgServicePrincipalSynchronizationJob |
| 6 | Notification email mandatory or quarantine on start; Start puts the job in listen mode; Restart purges pending payloads; Provision on demand not supported; endpoint on the overview page | Pre-flight; staged enable | verified | Learn, Configure API-driven inbound provisioning app |
| 7 | Scoping filters exclude users from an API-driven app; Delete target action off; soft-deleted users restorable 30 days | Pre-flight; staged enable | verified | Learn, API-driven provisioning FAQ |
| 8 | Scoping filter menu path, AND within a filter and OR across filters, REGEX MATCH and EQUALS operators; a new filter triggers a full sync and out-of-scope users can be disabled | Staged enable; dangers | verified | Learn, scoping filters |
| 9 | `externalId` offered as a source attribute in an API-driven app's scoping filter, and the orgCode extension attribute | Staged enable, both stages | **not verified**: Learn's scoping page shows other apps' attributes; confirmed on the first live run | — |
| 10 | Accidental deletion prevention path (**Edit provisioning** > **Settings**) and `StagedAction`, `StagedDelete` | Pre-flight | verified (search excerpts of the app-provisioning page) | Learn, accidental deletions |
| 11 | subscribedSkus endpoint, `LicenseAssignment.Read.All`, properties | PF-01 | verified | Learn, List subscribedSkus |
| 12 | roleEligibilitySchedules endpoint, `RoleEligibilitySchedule.Read.Directory`, properties | PF-02 | verified | Learn, List roleEligibilitySchedules |
| 13 | Role template IDs (six roles) | `ROLE_TEMPLATES` in `deploy_settings.py` | verified (Microsoft Entra built-in roles, all roles table, search excerpts; User Administrator also in the access reviews tutorial) | Learn |
| 14 | PIM activation path | Before you start | verified | Learn, Activate a Microsoft Entra role in PIM |
| 15 | `isEnabled` allows on-demand runs; `isSchedulingEnabled` can't be true for a disabled workflow | Deploy; staged enable | verified | Learn, workflow resource type |
| 16 | New workflow default: "disabled" (create page) versus "enabled by default" (understanding page) | Deploy; differences | verified that the pages differ; the runbook sets both properties | Learn |
| 17 | `Update-MgIdentityGovernanceLifecycleWorkflow` updates `isEnabled` and `isSchedulingEnabled`; `LifecycleWorkflows-Workflow.ReadWrite.All`; schedule every three hours by default | Staged enable; rollback | verified | Learn |
| 18 | On demand: the workflow must be enabled; up to 10 users; execution conditions not considered; Learn recommends testing on demand and a pilot; `Initialize-MgIdentityGovernanceLifecycleWorkflow`, `LifecycleWorkflows-Workflow.Activate` | Smoke test | verified | Learn, Run a workflow on-demand; workflow: activate; Plan a Lifecycle Workflow deployment |
| 19 | `employeeId` filterable with `eq` | Smoke check (`smoke-user`) | verified (user resource excerpt and the Az model's property description: eq, ne, not, ge, le, in, startsWith) | Learn |
| 20 | `sourceIdentity.id` of a provisioning log entry carries the `externalId` for an API-driven app | SM-06, SM-07 | **not verified**: inference; confirmed on the first live run | — |
| 21 | Delete a user: `User.ReadWrite.All`; User Administrator; restorable 30 days; `Remove-MgUser` | Test rollback | verified | Learn, Delete a user |
| 22 | Graph PowerShell environments `Global`, `USGov`, `USGovDoD` | Session block; `rollback.ps1` | verified | Learn, Authentication module cmdlets |
| 23 | Key Vault certificate to PEM (`az keyvault secret download --encoding base64`, `openssl pkcs12 -nodes`); `az login --service-principal --certificate`; `--allow-no-subscriptions`; token valid at most 60 minutes; `--resource` | Session block | verified | Learn, Azure CLI pages |
| 24 | `az cloud set --name AzureUSGovernment` | Session block (`azureCloud`) | verified | Learn, Connect to Azure Government with Azure CLI |
| 25 | A GCC tenant's key vault sits in a commercial subscription | `AZURE_CLOUD` in `deploy_settings.py` | restated from the guide's inference (labeled in the code comment) | Guide, What couldn't be verified |
| 26 | `az account get-access-token --resource https://graph.microsoft.us` returns a GCC High Graph token | Session block | **not verified** in a GCC High tenant; follows from the national cloud host table | Book 19, Chapter 02 (Learn, national cloud deployments) |
| 27 | Application permissions portal path and Grant admin consent | Pre-flight | verified | Learn, Configure app permissions for a web API |
| 28 | Diagnostic settings path | Pre-flight | verified | Learn, archive activity logs |
| 29 | `az storage blob upload-batch` and `download-batch` flags (`--destination-path`, `--pattern`, `--auth-mode login`) | Capture the evidence; production pre-flight | verified for upload-batch's flags; download-batch's `--pattern` and `--destination` **not opened** on Learn (same reference page, same flag family) | Learn, az storage blob |
| 30 | `az account clear` clears the CLI's accounts | Close the session | **not opened** on Learn on November 2, 2026 | — |
| 31 | `PersonID` varies across environments, use `PersonNumber`; JWT for feeds and SCIM | Stage 1 intro; verified facts | verified | Oracle, entitlement management integration guide |
| 32 | Tokens from the OCI IAM identity domain; Client Credentials only for Spectra; client assertion recommended | Settings template (`hr`); verified facts | verified | Oracle, Configure OAuth |
| 33 | Microsoft's Oracle sequence: five to ten records first, then the full load, then feeds | Stage 2 | carried | *Building Book 03's HR Pipeline* (Learn, Oracle HCM tutorial, read October 25, 2026) |
| 34 | `202 Accepted` with `Location` | Smoke test | carried | Chapter 02 |
| 35 | Roles behind each step | Before you start | carried | Guide, Prerequisites |
| 36 | Roles split, second operator, go/no-go criteria, monitoring decision rules, settings kept in a reviewed repository, scopes only widened | Throughout | restated-as-design (labeled) | — |
| 37 | Fixture-mode outputs (settings check, pre-flight, middleware settings, three extracts, three smoke checks, rollback plan, dry run, verify, production pre-flight with and without evidence) | Chapter | verified by running the commands | local run, November 2, 2026 |
| 38 | Live behavior at every step | Chapter | not run against a tenant; written as expected results | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide, Prerequisites (licenses, roles through PIM, logs out) | Before you start; pre-flight (PF-01, PF-02); diagnostic settings step | — |
| Guide, Rollback table | Both roll back sections; `rollback.py` (G2 pause, G3 and G6 schedules off, G4 policy removal) | G1 (a signed register change) and G5 (CBA settings) aren't automated: their rollbacks are Chapter 01's and Chapter 05's |
| Guide, gate order G1 to G7 | Every step names its gate | — |
| Pipeline guide, testing and cutover (Microsoft's sequence; pause, never Restart) | Stage 2; dangers | — |
| Chapter 03, plan and create | Deploy steps 2 to 4 | Scheduling turned off in the body before create, which Chapter 03's step left to the reader |
| Chapter 04, automatic assignment policies | Linked from Deploy step 5; the ID recorded for rollback | Created with Chapter 04's own test tenant steps |
| Chapter 07, drift run and packages | Capture the evidence; first-week monitoring | Linked, not repeated |
| Book 19, Chapter 09, federated sign-in in the pipeline | The session block's note | The runbook uses an operator session with certificates from the key vault |
| Learn, List executionScope (results only while scheduling is on) | Not carried | The smoke check reads userProcessingResults instead, which work while scheduling is off |
