# Verification — Chapter 10, Deploying to Test and Production

New material; it replaces no workbook page. The owner asked for a runbook that takes the kits from each chapter's test-tenant step to a live test environment and then production, in exact commands. Code (new): `examples/drift-pipeline/deploy/` — `adm_deploy.py` (the settings file: load, refuse secrets and placeholders, derive per-cloud values, print `ADM_*` variables), `preflight.py` (PF-01 to PF-16; live probes only with `--live`), `smoke_test.py` (SM-01 to SM-13), `rollback.py` (record, plan; never runs anything), `environment.example.json` (the template); `deploy/tests/test_deploy.py` and `deploy/tests/fixtures/test.json` and `production.json` (fictional `contoso.example`). The deploy tests are their own suite, under `deploy/tests`, so the kit's `tests` suite stays at the 142 tests that Chapter 09 and the other workbooks' labs state; `scripts/run_example_tests.py` now finds suites under `deploy/tests` as well as `tests`. The drift pipeline kit was chosen because it already reads every other kit's output (the validation kit run and the three provenance files) and is standard-library Python with a pytest suite in the repository's test runner.

**Nobody has run the runbook against a live tenant, subscription or forest.** The page says so in its Status callout, and every result after a live command is written as an expectation.

Test results on November 2, 2026, Windows 11, Python 3.14.3, pytest 9.0.2: `python -m pytest deploy/tests -q` 46 passed (37 before the owner's requirements-and-evidence addition the same day); `python -m pytest tests -q` 142 passed (unchanged); `python scripts/run_example_tests.py --list` shows `drift-pipeline: tests (pytest), deploy/tests (pytest)`. The live probes are tested with a fake runner; the rollback scripts are written and read back by the tests, not executed.

Dry-run output in the chapter: produced on November 2, 2026 by the commands exactly as printed, in Git Bash on Windows from `examples/drift-pipeline`, with `MSYS_NO_PATHCONV=1` (Git Bash otherwise rewrote the `/subscriptions/...` argument to a Windows path in a first run, which is why the chapter's bash setup exports it). The smoke report's hash differs on every run because the report records when it ran; the chapter says so.

Microsoft Learn pages opened on November 2, 2026 through the Microsoft Learn MCP tools: Sign into Azure with a service principal using the Azure CLI; Use an Azure service principal with certificate-based authentication; Sign in to Azure PowerShell non-interactively; Create an Azure service principal with Azure PowerShell; Connect-MgGraph; Use app-only authentication with the Microsoft Graph PowerShell SDK; az account get-access-token; Get-AzAccessToken; Managing Storage in the Azure independent clouds using PowerShell; Develop with Storage API on Azure Government; Configure API-driven inbound provisioning app; Enable accidental deletions prevention; synchronizationJob: pause; Suspend-MgServicePrincipalSynchronizationJob; Manage provisioning object connections (pause before delete); Create group; group: evaluateDynamicMembership; Create a lifecycle workflow; Create workflow (Graph); workflow resource type; New-MgIdentityGovernanceLifecycleWorkflow; workflow: activate; Run a workflow on-demand; Initialize-MgIdentityGovernanceLifecycleWorkflow; the three Lifecycle Workflows API tutorials (check status, schedule); Check the status of a workflow; Import-GPO; New-GPLink; Set-GPLink; Assign policies in Microsoft Intune; Remediation options for machine configuration; How to create custom machine configuration policy definitions (fetched in full); How to create a Machine Configuration Assignment using the Azure REST API; Azure Policy assignment structure (identity); Remediate non-compliant resources with Azure Policy; Azure Policy remediation task structure; New-AzPolicyAssignment; Start-AzPolicyComplianceScan; Get compliance data of Azure resources; Quickstart: policy assignment with Azure PowerShell; Tutorial: adding user assigned managed identities (Start-AzPolicyRemediation); Connect machines to Azure Arc at scale with Ansible; Machine.IdentityPrincipalId (Az.ConnectedMachine); Store business-critical blob data with immutable storage; Configure immutability policies for containers; az storage container immutability-policy (lock, show, extend).

**Non-Learn sources.** None new. The arc-jumpstart page Learn's search returned for machine configuration assignments wasn't used; the chapter cites Learn's own pages for the same commands.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `az login --service-principal --username --certificate --tenant`; PEM with key and certificate; PKCS#12 doesn't work; certificate auth recommended | Settings; sign-in; identities | verified | Learn, Azure CLI service principal pages |
| 2 | `Connect-AzAccount -ServicePrincipal -ApplicationId -Tenant -CertificateThumbprint`; certificate from the local store | Sign-in | verified | Learn, non-interactive sign-in |
| 3 | `Connect-MgGraph -ClientId -TenantId -CertificateThumbprint`, `-Environment`, `-NoWelcome`, `-LoginHint`; `Get-MgContext` AuthType AppOnly | Sign-in; step 3b | verified | Learn, Connect-MgGraph; app-only page |
| 4 | `az account get-access-token --resource` | Step 2c | verified | Learn, az account |
| 5 | Graph hosts per cloud; GCC on worldwide endpoints | Settings; step 2c; Verified facts | verified (reread) | Learn, national cloud deployments |
| 6 | Storage suffix `core.windows.net` / `core.usgovcloudapi.net` | Settings; `adm_deploy.py` | verified | Learn, independent clouds storage page |
| 7 | `SynchronizationData-User.Upload` / `.OwnedBy` | Identities | carried forward from Chapter 01 and reread | Learn, Perform bulkUpload |
| 8 | Notification email mandatory, empty quarantines the job; Start provisioning puts the job in listen mode | Step 2b | verified | Learn, Configure API-driven inbound provisioning app |
| 9 | Accidental deletions: admin center path, Application Administrator, threshold, notification | Step 2b | verified | Learn, accidental deletions page |
| 10 | Pause a synchronization job; state persisted; Synchronization.ReadWrite.All or Application.ReadWrite.OwnedBy | Rollback; identities | verified | Learn, synchronizationJob: pause; Suspend-Mg… |
| 11 | Provisioning logs need AuditLog.Read.All and Directory.Read.All | Step 2c; identities | carried forward from Chapter 01 (Learn, accessed Oct 30, 2026); not reread | Learn, List provisioningObjectSummary |
| 12 | Create group: delegated Group.ReadWrite.All, application Group.Create | Step 3b | verified | Learn, Create group |
| 13 | evaluateDynamicMembership: beta, delegated only, application not supported | Step 3c; roles | verified (reread) | Learn, evaluateDynamicMembership |
| 14 | Admin center workflow path; a new workflow is disabled by default | Step 4a | verified | Learn, Create a lifecycle workflow (fetched in full) |
| 15 | Graph `isEnabled` optional, default true | Step 4a | verified | Learn, workflow resource type |
| 16 | activate: workflow must be enabled; conditions ignored; LifecycleWorkflows-Workflow.Activate; Lifecycle Workflows Administrator; real-time termination on demand only; national clouds | Steps 4c, waves | verified | Learn, workflow: activate; Run a workflow on-demand |
| 17 | `userProcessingResults` for run results | Step 4c | verified | Learn, LCW API tutorials |
| 18 | `Update-MgIdentityGovernanceLifecycleWorkflow` with isEnabled and isSchedulingEnabled; engine checks every three hours, 1 to 24 | Steps 4c, waves | verified | Learn, LCW API tutorials (PowerShell snippet; schedule section) |
| 19 | Workflow create/update permission LifecycleWorkflows-Workflow.ReadWrite.All | Identities | verified | Learn, New-MgIdentityGovernanceLifecycleWorkflow |
| 20 | Import-GPO parameters; New-GPLink, Set-GPLink `-LinkEnabled Yes|No`, `-WhatIf`; Link GPOs permission | Step 5 | verified | Learn, GroupPolicy module pages |
| 21 | Intune assignment admin center path | Step 5c | verified | Learn, Assign policies in Microsoft Intune |
| 22 | Machine configuration assignment types and their behavior; case sensitive | Step 6 | verified (reread) | Learn, remediation options |
| 23 | New-AzPolicyDefinition; Resource Policy Contributor; system-assigned identity with Storage Blob Data Reader and anonymous access off; version and contentUri change per release | Step 6 | verified (fetched in full) | Learn, create policy definition |
| 24 | DINE assignment needs an identity and location; roles granted by hand outside the portal; changing a definition doesn't update the assignment | Step 6d | verified | Learn, assignment structure; remediate resources |
| 25 | Start-AzPolicyComplianceScan, Get-AzPolicyState, Start-AzPolicyRemediation | Step 6 | verified | Learn, cmdlet and quickstart pages |
| 26 | Removing an assignment removes its guest assignments | Production rollback table | carried forward from Chapter 07 (accessed Oct 30, 2026); not reread | Learn, machine configuration assignments |
| 27 | Arc with Ansible: Azure Connected Machine Onboarding at subscription or RG scope; resource providers; MSI recommended; `az connectedmachine show --query identity.principalId`, `az vm show …` | Step 7a; step 6b | verified (reread) | Learn, Connect machines at scale with Ansible |
| 28 | Immutable storage: lock typically within 24 hours; locked can't be deleted or shortened; CLI lock with ETag | Tenant-wide 7; rollback | verified (reread) | Learn, immutable storage overview; container policies; CLI reference |
| 29 | Federated credential issuer, subject and audience | Step 8 | carried forward from Chapter 09 (accessed Oct 30, 2026); not reread | Learn, create trust |
| 30 | Three identities; one delegated step; test before production with separate tenants; promotion approvals by CISO and identity engineering; roll back at the end of the test stage; ApplyAndAutoCorrect left for later; plan a reverse configuration; when to roll back a wave | Throughout | restated-as-design (labeled) | — |
| 31 | The kits' commands, outputs and exit codes (hcm_to_scim, Invoke-ValidationKit, FmwGraph, DynamicRules, lcwext, Invoke-GpcSync, Invoke-McBuild, the Ansible playbooks, drift_pipeline) | Stage 1 | verified by reading each kit's code and README and its chapter; not run live | the kits; Chapters 01 to 09 |
| 32 | Deploy scripts' dry-run output, including the evidence records, the evidence check and `sha256sum -c` | Try the scripts | verified by running the commands as printed, November 2, 2026 | local run |
| 33 | Each requirement row's controls (SP 800-53 Rev. 5, all in the Moderate baseline) and the KSI IDs aligned to them | Requirements tables; `deploy/requirements.json` | carried forward: control-to-KSI pairs from Book 13, Appendix A (FedRAMP's related-control lists, accessed Oct 21, 2026), AC-2 to KSI-IAM-AAM and AU-2 to KSI-MLA-LET and IA-5 (non-user) to KSI-IAM-SNU from Book 02, Chapter 10; baselines from Book 13, Appendix A. No new KSI ID; a test pins the set | Book 13, Appendix A; Book 02, Chapter 10; Book 04, Chapter 10 |
| 34 | KSIs are provider indicators; the agency lines its evidence up and doesn't report them | Requirements section | carried forward | Book 00, Appendix B; FedRAMP KSI page as cited there |
| 35 | M-22-09 device inventory and signal; BOD 25-01 required SCuBA policies; GCC at FedRAMP Moderate; FedRAMP agency use | Requirements section; rows R-GPO-2, R-BL-2, R-PR-1 | carried forward from the companion guide's footnotes (accessed Oct 20 and 21, 2026); not reread | Attribute-Driven Migration guide; Book 13, Appendix A |

## Commands not confirmed on a Learn page

These appear in the runbook's commands. Each is a standard parameter or cmdlet, but no page opened on November 2, 2026 showed it, so a live test-stage run must confirm it before production:

- `az login … --allow-no-subscriptions` (step 2c), for the provisioning identity, which holds no Azure role.
- `az storage container immutability-policy create --period` (step 8) and `az storage container immutability-policy delete --if-match` (the rollback's unlocked-policy step). Learn's CLI page showed `lock`, `show` and `extend`.
- `az role assignment create --assignee-object-id --assignee-principal-type --query id`, and `az role assignment delete --ids` (steps 6b, 6d, 7a; rollback).
- `az policy assignment show --query identity.principalId` (step 6d).
- `az storage blob list … --query "sort_by(…, &properties.creationTime)"` and `az storage blob download-batch --pattern` (first-week monitoring).
- `Update-AzTag -Operation Merge` (step 6b).
- `Get-GPInheritance -Target -Domain` and its `GpoLinks` property (step 5's evidence command).
- `Update-MgGroup -MembershipRuleProcessingState`, `Remove-MgGroup` (step 3d; rollback): the property values are Chapter 04's verified facts; the cmdlet names follow the Graph PowerShell SDK's naming and Chapter 04's test-tenant step.
- `Remove-MgIdentityGovernanceLifecycleWorkflow` and `Remove-AzPolicyDefinition -Force` (test-stage rollback).
- The **Real-time employee termination** template name and its default tasks in the admin center (step 4a): Learn's activate page names the template; the admin center's template list wasn't opened.
- The Graph `$filter=displayName eq` on workflows (step 4b): Learn's resource page says `displayName` supports `$filter` (`eq`, `ne`).

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Implementation guide: prerequisites, deciders, gates 2 to 9, rollback at a glance | Before you start; every step's gate line; promotion criteria; production rollback table; step-to-gate map | Gates 0, 1 and 6 have no deployment step: reading the tree and signing the schema come before any kit runs, and PIV binding belongs to the card management system ([guide, Gate 6](../../guides/attribute-driven-migration-implementation.md#gate-6-piv-and-cac-binding)) |
| Chapter 01, test-tenant steps | Step 2 | CSV2SCIM's schema step stays a prerequisite (worldwide or GCC only) |
| Chapter 02 | Sign-in; the Conditional Access export in step 1 | — |
| Chapter 03 | The reader identity's scopes; the smoke test reads the kit's manifest | — |
| Chapter 04, test-tenant steps 1 to 4 | Step 3 | The incident drill (step 5) stays in Chapter 04 |
| Chapter 05, test-tenant steps 1 to 6 | Prerequisites (extension) and step 4 | The failure-path drill is a promotion criterion, run as Chapter 05 shows |
| Chapter 06, test-tenant steps | Step 5 | The Migrate comparison stays in Chapter 06 |
| Chapter 07, test-tenant steps | Step 6 | Signing stays Learn's procedure, unwrapped (Chapter 07) |
| Chapter 08, test-tenant steps | Step 7 | — |
| Chapter 09, test-tenant steps | Step 8; first-week monitoring; evidence package | Signing the evidence package stays open (research-gaps.md row 22) |
| Index outline | The chapter; the index's chapter table gains row 10 | — |
| The owner's requirement (November 2, 2026): requirements and KSIs per step, evidence produced, promotion on a passing evidence check | `deploy/requirements.json`, `deploy/evidence.py`, a table per step, step 12, promotion criterion 0 | The guide itself has no per-gate requirement tables; its companion guide's federal requirements table and Book 13, Appendix A supplied the controls |

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language): the page now says what the mechanism supports or provides evidence for, not that it satisfies a control or requirement. No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| a requirements table: the requirement it meets, | a requirements table: the requirement it supports, | no source change |
