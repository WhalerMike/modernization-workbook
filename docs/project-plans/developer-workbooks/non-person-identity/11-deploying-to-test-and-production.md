---
title: "Chapter 11 — Deploying to Test and Production"
description: "A deployment runbook that takes the kit from the non-production environment of each chapter's second lab to a live test environment (an Entra test tenant, an Azure test subscription and an Active Directory test forest), then to production: one environment settings file with no secrets, a read-only preflight with the licenses, roles and VK-NPI baseline, a safe deployment order (inventory and owners, the app management policy scoped to a pilot, a federated credential and managed identity run in parallel with the old secret, a gMSA on a test host, Conditional Access for workload identities report-only), a smoke test with a synthetic service principal and service account, the evidence, a rehearsed rollback, the promotion go/no-go criteria, then production with a change record, a staged enable by ring, first-week drift monitoring and a rollback, every step a copy-paste command linked to the implementation guide's gate. Nobody has run it against a live tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-non-person-identity
part: How
series-order: 11
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: approved
reviewed-sha256: f817ea266f643ca6f1b23b48d4d0b718e2a9ec482f5b7e94580a6218ca89cc7b
last-reviewed: 2026-11-07
---
# Chapter 11 — Deploying to Test and Production

*Each chapter's second lab proves one piece in a non-production tenant. A deployment proves them together, in the order that can be undone, against an environment someone depends on.*

::: {.callout-note}
## In this chapter
The runbook that takes the kit from the second lab of Chapters 01 to 10 to a live test environment, then to production. It is one ordered set of copy-paste commands, run twice: once against an Entra test tenant, an Azure test subscription and an Active Directory test forest, and again, unchanged, against the production tenant, subscriptions and forest. Only the environment settings file changes between the two. You prepare the change record and the settings file, run a read-only preflight, deploy in a safe order (inventory and owners, the app management policy scoped to a pilot, a federated credential and a managed identity beside the old secret, a gMSA on a test host, Conditional Access for workload identities report-only), run a smoke test with a synthetic service principal and service account, file the evidence and rehearse the rollback. Then you check the go/no-go criteria and repeat the run in production, enabling Conditional Access ring by ring and watching the first week with the drift run. Each step names the [implementation guide](../../../books/guides/non-person-identity-implementation.md)'s gate it fulfils. Each step has a table of the federal requirements it helps meet, the FedRAMP 20x KSI it aligns to and the evidence the ISSO keeps, and the kit writes that evidence as it runs. The chapter adds a preflight, a smoke test, a rollback and two evidence scripts to `examples/non-person-identity/deploy`, each with a fixture mode and tests.
:::

::: {.callout-important}
## Status: a runbook nobody has run against a live tenant
This chapter is new and approved, and it has no narrated tour yet. Nobody has run it against a live tenant, subscription or forest. The commands that call Microsoft Graph, Azure and Active Directory follow Microsoft Learn and the earlier chapters' code, and the kit's new scripts have been run only in fixture mode, against a fictional test and production tenant served by a fake. Every live result below is labeled **Expected**: it is what the code and Learn say should happen, not something anyone has seen. The output labeled **Dry run, November 2, 2026** is real: the kit's scripts printed it on that date, on the kit's fixtures.
:::

## Goal and audience

**Goal.** By the end of this chapter you can deploy the non-person identity kit to a live test environment and then to production, with a change record, an approval at each write, a smoke test whose expected result is written down before you run it, evidence the ISSO can check with a hash, and a rollback you have rehearsed. You can say, for each step, which of the guide's six gates (G1 to G6) it moves forward.

**Audience.** The identity engineer and the Conditional Access administrator who run the deployment, the server and Active Directory engineer who installs the gMSA, the change manager who opens the change record, the application owner of the pilot workload, and the ISSO who receives the evidence. You should have run Lab 1 of Chapters 01 to 10, and at least the second lab of Chapters 01, 04, 05, 06 and 08 in a non-production tenant.

## What the runbook depends on

**The guide's gates.** The [implementation guide](../../../books/guides/non-person-identity-implementation.md#the-path-on-one-page) sets six gates: G1 inventory, G2 decision, G3 credential rules, G4 least privilege, G5 conversion and G6 lifecycle, each with a **Validate** step that names the read-only VK-NPI checks. This runbook doesn't decide anything the gates decide. It deploys the controls that let each gate pass, in an order chosen so that each step can be undone before the next one depends on it. *Design guidance.*

**The two environments.** The live test stage is an Entra test tenant, an Azure test subscription and an Active Directory test forest, with the same licenses as production and fictional or copied workloads. Production is the program's tenant, subscriptions and forest. They are separate tenants, so nothing the test stage does can reach production, and the production preflight refuses to start unless the test stage's smoke test passed in another tenant (PF-11).

**The safe order.** The order follows the guide's steps and what Learn says each control can and can't break:

1. **Inventory and owners** read only (G1).
2. **The app management policy**, scoped first to a pilot application and the synthetic one. Learn documents a restriction applied to a specific application through a custom policy, and a tenant-wide restriction that applies only to applications created after a date; it documents no report-only mode for these policies.[^np11-amp-configure] [^np11-amp-overview] Neither policy blocks token issuance for an existing application: only a create or update that breaks the policy is refused,[^np11-amp-overview] so an existing secret keeps working while the pilot runs.
3. **A federated credential and a managed identity on the pilot workload**, run in parallel with the old secret for the guide's 30 days ([Step 5](../../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run)).
4. **A gMSA on a test host**, after the KDS root key has replicated.
5. **Conditional Access for workload identities in report-only mode.** Learn lets a workload identity policy be saved in report-only mode to estimate its effect, and shows the result in the service principal sign-in logs.[^np11-wid]

The policies that can block a sign-in come last, and only in report-only mode in the test stage; in production they are enabled ring by ring, after a reviewed sign-in summary.

### Which cloud, for these steps

The target estate is Microsoft 365 GCC (Moderate) with commercial Azure: `graph.microsoft.com`, `management.azure.com` and `login.microsoftonline.com` ([Chapter 01](01-non-person-identity-inventory-as-code.md#which-cloud-and-which-directory-for-this-read)). The settings file names the cloud, and every command takes the Graph and Azure environment names from the kit's cloud table, so the same command would point at GCC High or DoD hosts for those clouds. This runbook covers `gcc` only. Learn gives a different token-exchange audience for Entra ID for US Government (`api://AzureADTokenExchangeUSGov`),[^np11-mi-trust-app] and Chapter 05's checks accept only `api://AzureADTokenExchange`, so a GCC High or DoD deployment needs that change first (research gaps, row 106).

## Requirements, KSIs and evidence

Each step below ends with a table of the requirements it helps meet, the FedRAMP 20x Key Security Indicator (KSI) it aligns to, and the evidence the ISSO keeps. The requirements are NIST SP 800-53 Rev 5 controls at the system's FedRAMP Moderate baseline, the audience the [implementation guide](../../../books/guides/non-person-identity-implementation.md#evidence) writes for (IA-9 is in no baseline and is tailored in, as the guide says), plus OMB M-22-09[^np11-m2209] and CISA BOD 25-01's SCuBA baselines[^np11-bod2501] where they apply. The control mappings are the guide's evidence table and Book 13's [requirements mapping](../../../books/b13-governance/appendix-a-requirements-mapping.md); the KSI IDs are the ones Book 02, [Chapter 10](../../../books/b02-identity/10-migrating-and-governing.md), Book 04, [Chapter 10](../../../books/b04-access/10-access-as-code-and-evidence.md), Book 13 and Book 14, [Chapter 03](../../../books/b14-compliance/03-the-baseline-and-the-crosswalk.md) already cite, each checked again on FedRAMP's page on November 2, 2026.[^np11-ksi]

**KSIs belong to the cloud providers.** They are FedRAMP's 20x indicators for cloud service providers. The agency authorizes its own system, and its system uses FedRAMP-authorized cloud services (Entra ID, Azure) under the customer responsibilities its system security plan records; it lines its own evidence up with what its providers report against KSIs, and it doesn't report KSIs itself ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). Every alignment below is the program's reading (*Design guidance*); the assessor and the authorizing official decide each control.

| KSI | Name, as FedRAMP gives it | Steps that align to it |
|---|---|---|
| KSI-IAM-SNU | Securing Non-User Authentication | Preflight, 1.1, 1.2, 1.3, 1.4, smoke test |
| KSI-IAM-JIT | Authorizing Just-in-Time | Before you start, preflight |
| KSI-IAM-AAM | Automating Account Management | 1.3, 2.2 |
| KSI-IAM-ELP | Ensuring Least Privilege | Preflight, 1.5, smoke test, 2.3 |
| KSI-PIY-GIV | Generating Inventories | Prepare, 1.1, smoke test |
| KSI-CMT-LMC | Logging Changes | Before you start, 1.2, 2.3, 2.5 |
| KSI-CMT-VTD | Validating Throughout Deployment | Preflight, 1.3, 1.5, promotion |
| KSI-CMT-RMV | Redeploying vs Modifying | 1.8, 2.6 |
| KSI-MLA-EVC | Evaluating Configurations | Preflight, smoke test, 2.5 |
| KSI-MLA-LET | Logging Event Types | Preflight, smoke test |
| KSI-MLA-OSM | Operating SIEM Capability | 1.7 (the evidence folder's integrity) |
| KSI-RPL-ABO | Aligning Backups with Objectives | 1.8, 2.6 (CP-10, as Book 13 maps it) |

**The evidence is produced, not only named.** The kit's catalog, [`config/requirements-ch11.json`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity/config/requirements-ch11.json), holds every mapping. The preflight, the smoke test and the rollback each write an evidence record beside their output, in `<outputRoot>/evidence`: a JSON file with the time, the environment, tenant and change record, the command as typed, the result, each check with the controls, other requirements and KSIs it supports, and the SHA-256 of every run file it covers. For the steps that run an earlier chapter's script, `deploy/Write-NpiDeployEvidence.ps1` copies that script's run folders into the evidence folder, re-hashes every file their manifests list, and writes the step's record. Each record rewrites `SHA256SUMS` over the folder, and `deploy/Test-NpiDeployEvidence.ps1` checks that every requirement row the stage needs has its record, passing, with every hash unchanged: the promotion go/no-go runs it.

## Before you start

### Roles

Every write in this runbook is a person's delegated sign-in, with a role activated through Privileged Identity Management for the change window. The scheduled and read steps sign in as an app with a certificate. Nothing signs in with a secret. *Design guidance*, from the kit's write paths.

| Who | Role, activated through PIM | Steps | Learn |
|---|---|---|---|
| Identity engineer | Cloud Application Administrator and Security Administrator | Prepare, app management policy, federated credentials, smoke test | The app management policy needs Security Administrator plus Cloud Application Administrator or Application Administrator[^np11-amp-configure] |
| Conditional Access administrator | Conditional Access Administrator; Cloud Application Administrator as well for the rollback | Workload Conditional Access, rollback | Creating and updating a workload policy[^np11-wid] [^np11-ca-update] |
| Server and AD engineer | Domain Admins in the stage's forest (test in Stage 1, production in Stage 2), or a delegated right to create gMSAs | gMSA | Creating a gMSA[^np11-gmsa] |
| Reader app (certificate) | Graph application permissions `Application.Read.All`, `AuditLog.Read.All`, `Directory.Read.All`, `Policy.Read.All`, `User.Read.All`, `LicenseAssignment.Read.All`, `RoleManagement.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `Policy.Read.ConditionalAccess`; Reader on the subscription | Inventory, preflight, VK-NPI, Chapter 08's sign-in summary, drift | Each chapter's call list |
| Identity engineer, for the Azure resource group | Managed Identity Contributor on the test or production resource group, activated through PIM for Azure resources | Creating the pilot's managed identity (Step 1.3), signed in to the Azure CLI as a person: every write is a person's, and the deployment identity holds no write role | [Chapter 05](05-workload-identity-federation-and-managed-identities.md#verified-facts) |

Activate a role in the Microsoft Entra admin center: **ID Governance** > **Privileged Identity Management** > **My roles** > **Microsoft Entra roles** > **Activate**, with the change record number as the reason.[^np11-pim]

### Approvals

| Approval | By | Before | Recorded in |
|---|---|---|---|
| The change record for the stage | Change advisory board | Preflight | The change record |
| The settings file for the stage | Identity governance officer | Preflight | Its SHA-256 in the preflight manifest |
| The pilot workload and its 30-day parallel run | The pilot's application owner, named in the settings file's `pilot.ownerUpn`, who is not an operator | Step 1.3 | Chapter 05's cutover log |
| Each plan's SHA-256 (Chapters 04 and 05, the rollback) and Chapter 08's scope file | A reviewer who is not the operator | Each `-Apply` | The plan's manifest; the scope file's review |
| Promotion to production | ISSO and the change advisory board | Stage 2 | The go/no-go record |
| Each production ring's enforcement (D-NP5) | CISO | Step 2.3 | The scope file's enforcement record |

### The change record

Open one change record per stage. It names the stage, the window, the operators, the pilot, the synthetic objects, the rollback plan and the evidence folder. Its number goes into the settings file's `changeRecord`, and every manifest the `deploy/` scripts write repeats it.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3 Configuration Change Control | One approved change record per stage; the settings file reviewed and its SHA-256 recorded | KSI-CMT-LMC | `S0-change-record-approvals-and-settings-file.json` (written by the preflight), with the change record number and the settings file's SHA-256 |
| CM-5 Access Restrictions for Change; AC-6(5) Privileged Accounts | Each write by a named person with a role activated through PIM for the window | KSI-IAM-JIT | PF-06 in `PRE-preflight.json`; PIM's activation audit records |
| AC-5 Separation of Duties | Each plan's SHA-256 approved by someone other than the operator | KSI-IAM-JIT | The approval recorded with each plan's manifest |

## The environment settings file

One JSON file per stage holds every value the commands need: the tenant, the cloud, the identities, the operators, the pilot, the synthetic objects, the policies and the rings. The kit's template is [`deploy/settings.template.json`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity/deploy/settings.template.json); the kit's fixture copies are `tests/fixtures/deploy/settings.test.json` and `settings.production.json`.

The rules, which `Read-NpiDeploySettings` enforces before any command runs (*Design guidance*):

- **No secrets.** A field whose name looks like a secret (`secret`, `password`, `token`, `privateKey`, `pfx`, `connectionString`) or a value that looks like a client secret or a PEM key stops the run. The deployment and reader identities are named by client ID and certificate thumbprint (or federated subject); the private key stays in the operator's certificate store, and `certificatePemPath` names a file the Azure CLI reads, never its content.
- **No placeholders.** A value still shaped like `<tenant-id>` stops the run. The synthetic objects' IDs and the pilot policy's ID stay empty until the Prepare step creates the objects and writes their IDs into the file.
- **An owner who approves, separate from the operators.** `pilot.ownerUpn` names the pilot application's owner, who records the cutover and approves the day-31 disable in Chapter 05's cutover log. The check refuses a file without one, or one that names an operator.
- **The stage it says it is.** The file's `environment` must match the stage the command is told to run.
- **The same commands for both stages.** The commands read every value from the file. Moving from test to production changes the file and nothing else.

### Placeholders

These are the only values you replace in this chapter's commands:

| Placeholder | What it is |
|---|---|
| `<kit-folder>` | Your clone's `examples/non-person-identity` folder |
| `<stage>` | `test` in Stage 1, `production` in Stage 2 |
| `<settings-file>` | That stage's settings file, such as `C:/change/CHG-2026-1102-T/settings.test.json` |
| `<egress-range>` | The pilot's egress range for the workload location policy, in CIDR form (Chapter 08's `NL-WorkloadEgress`) |
| `<microsoft-owner-tenant-id>` | The tenant ID Microsoft's first-party apps report as their owner, as Chapter 08 records it |
| `<oos-object-id>`, `<oos-name>`, `<oos-class>`, `<oos-control>`, `<oos-reviewed-by>`, `<oos-reviewed-on>` | One identity that stays out of the Conditional Access scope (each managed identity and multitenant app in the tenant, including the pilot's managed identity) and the control that covers it, as Chapter 08's `outOfScope` entries have them; without a record for each, Chapter 08's check raises NPI-WCA-06 and the apply refuses to start |
| `<d-np4-outcome>` | The CISO's Workload ID Premium decision (D-NP4), in words, with `<d-np4-by>` and `<d-np4-on>` |
| `<d-np5-by>`, `<d-np5-on>` | Who decided D-NP5 (enforce a ring), and when |
| `<reviewer-upn>` | The reviewer's user principal name: a reviewer who is not the operator, as the Approvals table requires |
| `<sha>` | A plan's SHA-256, as the reviewer passes it back to you |
| `<test-evidence>` | The test stage's smoke-test folder, `<outputRoot>/smoke-final` from the test settings file |
| `<gmsa-name>`, `<netbios-domain>` | On the gMSA test host only, which has no session block: `ad.gmsaName` from the settings file, and the forest's NetBIOS domain name |

### Create and check the file

Copy the template, fill it in, then check it. The check prints every problem at once:

```powershell
Set-Location <kit-folder>
Copy-Item deploy/settings.template.json <settings-file>
Import-Module ./deploy/NpiDeploy.psm1 -Force
Read-NpiDeploySettings -Path <settings-file> -Stage <stage> | Select-Object environment, cloud, tenantId, changeRecord, _sha256
```

**Expected:** one line with the stage, `gcc`, the tenant ID, the change record and the file's SHA-256. On the template itself, the check lists every placeholder, starting with `environment: placeholder <test-or-production> not replaced`.

### Start every session the same way

Open PowerShell 7 and run this block at the start of every sitting. Every later block uses `$s`, `$cloud`, `$graph` and `$out`:

```powershell
Set-Location <kit-folder>
Import-Module ./deploy/NpiDeploy.psm1 -Force
$stage = '<stage>'
$s = Read-NpiDeploySettings -Path <settings-file> -Stage $stage
$cloud = Get-NpiCloud -Cloud $s.cloud
$graph = $cloud.Graph
$out = $s.outputRoot
New-Item -ItemType Directory -Force $out, "$out/evidence" | Out-Null
```

The five sign-ins the steps use. Each step names the one it needs.

**Sign in as the reader app** (reads only):

```powershell
Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
Connect-MgGraph -Environment $cloud.GraphEnvironment -TenantId $s.tenantId -ClientId $s.readerIdentity.clientId -CertificateThumbprint $s.readerIdentity.certificateThumbprint -NoWelcome
Connect-AzAccount -ServicePrincipal -Environment $cloud.AzureEnvironment -Tenant $s.tenantId -ApplicationId $s.readerIdentity.clientId -CertificateThumbprint $s.readerIdentity.certificateThumbprint -Subscription $s.azure.subscriptionId | Out-Null
```

**Sign in as the identity engineer** (delegated, after activating Cloud Application Administrator and Security Administrator):

```powershell
Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
Connect-MgGraph -Environment $cloud.GraphEnvironment -TenantId $s.tenantId -Scopes Application.Read.All, Application.ReadWrite.All, AuditLog.Read.All, Policy.Read.All, Policy.ReadWrite.ApplicationConfiguration -NoWelcome
```

**Sign in as the Conditional Access administrator** (delegated, after activating Conditional Access Administrator):

```powershell
Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
Connect-MgGraph -Environment $cloud.GraphEnvironment -TenantId $s.tenantId -Scopes Application.Read.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess -NoWelcome
```

**Sign in for the rollback** (delegated, one person with Conditional Access Administrator and Cloud Application Administrator activated; list both under that operator's `roles` in the settings file so PF-06 checks them):

```powershell
Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
Connect-MgGraph -Environment $cloud.GraphEnvironment -TenantId $s.tenantId -Scopes Application.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ApplicationConfiguration, Policy.ReadWrite.ConditionalAccess -NoWelcome
```

**Sign in to the Azure CLI as the identity engineer** (a person, with Managed Identity Contributor activated on the resource group):

```powershell
az cloud set --name $s.azure.environment
az login --tenant $s.tenantId
az account set --subscription $s.azure.subscriptionId
```

`Connect-MgGraph` takes a client ID, tenant ID and certificate thumbprint for app-only access,[^np11-connect] which the read-only steps use. The Azure CLI sign-in is a person's: the one Azure write in this runbook, creating the pilot's managed identity, is made by the identity engineer, never by the deployment identity, so Chapter 05's rule that every write is a person's holds. Where the read-only steps run from a pipeline with a federated credential, the pipeline's own sign-in step replaces the app-only sign-in (the Azure Login action, for GitHub Actions).[^np11-oidc]

## The code this chapter adds

The runbook's own code is in [`examples/non-person-identity/deploy`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity/deploy), in PowerShell like the rest of the kit, with its calls declared in `config/calls-ch11.json` and its tests in `deploy/tests/NpiDeploy.Tests.ps1` (Pester 5), which `tests/test_deploy.py` runs in the kit's pytest suite. The file sits outside `tests/` so that the `Invoke-Pester -Path tests` count every chapter's Lab 1 prints doesn't change. Every script has a fixture mode, `-FixturePath`, that serves Graph and Active Directory from a file and sends nothing anywhere. The preflight, smoke test and rollback write their evidence records to `-EvidencePath`, by default an `evidence` folder beside their output folder.

| Script | What it does | Reads | Writes |
|---|---|---|---|
| `Test-NpiDeployPreflight.ps1` | PF-01 to PF-11 below; writes `results.json`, `snapshot.json` (what the rollback restores) and a manifest; exits 1 on any Fail | Graph (8 read permissions), AD (default read) | Nothing |
| `Invoke-NpiDeploySmokeTest.ps1` | ST-01 to ST-07 below, against the synthetic service principal and service account; exits 1 on any Fail | The register run, Graph, AD, `Test-ADServiceAccount` on the gMSA host | One probe expected to be refused: a new secret on the synthetic app. If it isn't refused, the secret is removed at once by its key ID, its value is never kept, and ST-03 fails |
| `Invoke-NpiDeployRollback.ps1` | `-Mode Plan` writes `rollback-plan.json` and prints its SHA-256; `-Mode Apply` checks the approved SHA-256, the tenant and a seven-day age, then dry-runs, or sends with `-Apply` | The policies' current state | PATCH on workload policies and app management policies, `accountEnabled` on the synthetic service principal, `Enable-ADAccount` and `Disable-ADAccount`. Never a delete |
| `Write-NpiDeployEvidence.ps1` | Records a step that ran an earlier chapter's script: copies its run folders under `evidence/runs/<step>/`, re-hashes every file their manifests list (and refuses another tenant's run), and writes the step's record | The run folders | Only the evidence folder |
| `Test-NpiDeployEvidence.ps1` | The go/no-go's evidence check: every requirement row of the stage present and passing, and `SHA256SUMS` matching every file; exits 1 on a gap | The evidence folder | Nothing |

`deploy/tests/NpiDeploy.Tests.ps1` has 55 tests: each task's declaration equals the union of its calls and none is a DELETE; the settings rules; each preflight check failing on a bad tenant (a deployment identity with a secret, no Workload ID Premium, a reader with a ReadWrite permission, an operator with no role, no baseline, a missing gMSA host, production with no test evidence or with evidence from its own tenant); the smoke test's probe sent only to the synthetic app, the removal when a secret gets through, the secret's value absent from every output, a case-only subject difference failing, the wrong Conditional Access state failing; the rollback refusing an unapproved hash, another tenant and an old plan, dry-running with no write, and applying with PATCH and the two AD cmdlets only; the live invoker refusing an app-only sign-in for a write task; and the evidence records: every check and step mapped, only KSI IDs the repository already cites, each record's time, environment, command, result, controls and KSIs, a changed run file or another tenant's run failing the record, and the go/no-go check failing on a missing row, a dry-run rollback, a changed evidence file or the wrong environment.

::: {.callout-warning}
## Illustrative code
The scripts have been run against fictional tenants served by a fake, never against a live tenant or forest. The fixture's error for the refused probe is invented: Learn doesn't give the exact error code an app management policy returns (research gaps, row 101). Review the code and run it in the test stage before it touches production.
:::

### Dry run on the kit's fixtures

Run the three scripts against the fictional test tenant, then the production preflight against the fictional production tenant with the test smoke test as its evidence. Nothing leaves the machine:

```powershell
Set-Location <kit-folder>
./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -BaselinePath tests/fixtures/deploy/vk-baseline.json -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-preflight
./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -RegisterRun tests/fixtures/deploy/register-run -ExpectCaState ReportOnly -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-smoke
./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -SnapshotPath out/dryrun/test-preflight/snapshot.json -To Disabled -IncludeSmokeCleanup -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback
$sha = (Get-FileHash out/dryrun/test-rollback/rollback-plan.json -Algorithm SHA256).Hash.ToLower()
./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -PlanPath out/dryrun/test-rollback/rollback-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback-dry
./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.production.json -Stage production -BaselinePath tests/fixtures/deploy/vk-baseline.json -PromotionEvidencePath out/dryrun/test-smoke -FixturePath tests/fixtures/deploy/tenant-production.json -OutputPath out/dryrun/prod-preflight -EvidencePath out/dryrun/evidence-production
./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -EvidencePath out/dryrun/evidence
```

**Dry run, November 2, 2026** (Windows 11, PowerShell 7.6, the kit's fixtures):

```text
Preflight (Fixture, test, CHG-2026-1102-T): 12 Pass, 1 Warn
  PF-01 Pass   All       Settings file: no secret, no placeholder, this stage: test, gcc, sha256 a1aec69cd4fb
  PF-02 Pass   G3        Deployment identity uses a certificate or federated credential, no secret: 0 secret(s), 1 certificate(s)
  PF-03 Pass   G4        Workload ID Premium, to create or change workload Conditional Access: Workload_Identities_P2, 5 enabled unit(s)
  PF-04 Pass   G6        Entra ID P1 or P2, for the service principal sign-in logs: SPE_E5
  PF-05 Pass   G4        Reader identity holds Graph read permissions only: Application.Read.All, AuditLog.Read.All, Directory.Read.All, Policy.Read.All, User.Read.All
  PF-06 Pass   G4        Operator Identity engineer: roles for app management policy, federated credentials, smoke test: Cloud Application Administrator eligible; Security Administrator eligible
  PF-06 Warn   G4        Operator Conditional Access administrator: roles for workload Conditional Access, rollback: Conditional Access Administrator active
  PF-07 Pass   G1        The pilot app registration exists, single-tenant: Payroll Export, AzureADMyOrg, 1 secret(s)
  PF-07 Pass   G1        The synthetic app registration exists, single-tenant: npi-smoke-test, AzureADMyOrg, 0 secret(s)
  PF-08 Pass   G4        Workload policy CA015-ServiceAccounts-LocationRestriction-Ring1: enabledForReportingButNotEnforced
  PF-08 Pass   G4        Workload policy CA037-WorkloadIdentities-HighRisk-Block-Ring1: enabledForReportingButNotEnforced
  PF-09 Pass   G1-G6     VK-NPI baseline recorded before the change: 01 Fail 4; 02 Fail 2; 03 Fail 1; 04 Fail 3; 05 Warn 3; 06 Fail 2; 07 Warn 1; 08 Fail 1
  PF-10 Pass   G5        gMSA test host and retriever group exist: app-test-01.corp-test.contoso.example; gg-gmsa-hrsync-hosts
Evidence: PRE-preflight.json (Warn)
Evidence: S0-change-record-approvals-and-settings-file.json (Pass)
Result: GO for this stage. File results.json, snapshot.json and manifest.json with the change record.
Smoke test (Fixture, test, Conditional Access expected ReportOnly): 8 Pass
  ST-01 Pass   G1        Synthetic app is in the register with two owners and no secret: OwnerCount 2, Secrets 0, CredentialKind Federated
  ST-02 Pass   G1        Synthetic service account is detected and rated HIGH: Risk HIGH: password never expires
  ST-03 Pass   G3        App management policy refuses a new secret on the synthetic app: refused: Graph returned 400 (BadRequest): (fixture) Refused by the app management policy (real code unverified).
  ST-04 Pass   G5        Synthetic app's federated credential matches the settings exactly: 1 credential(s), 1 exact match(es)
  ST-05 Pass   G4        Workload policy CA015-ServiceAccounts-LocationRestriction-Ring1 assigns the synthetic service principal directly: state enabledForReportingButNotEnforced; assigned directly: True
  ST-05 Pass   G4        Workload policy CA037-WorkloadIdentities-HighRisk-Block-Ring1 assigns the synthetic service principal directly: state enabledForReportingButNotEnforced; assigned directly: True
  ST-06 Pass   G4        Synthetic sign-ins show the workload policies' result (Graph beta): 2 sign-in(s) since 2026-11-01T12:00:00Z; results: reportOnlyFailure, reportOnlyNotApplied
  ST-07 Pass   G5        gMSA test host can retrieve the gMSA's password: Test-ADServiceAccount True; svc-npi-smoke enabled True
Evidence: SMOKE-smoke-test.json (Pass)
Result: PASS. File results.json and manifest.json with the change record.
Rollback plan (test, to Disabled): 7 action(s)
  RB-01 G4      ConditionalAccessState CA015-ServiceAccounts-LocationRestriction-Ring1
  RB-02 G4      ConditionalAccessState CA037-WorkloadIdentities-HighRisk-Block-Ring1
  RB-03 G3      TenantAppPolicyRestore defaultAppManagementPolicy
  RB-04 G3      AppPolicyOff           npi-pilot-block-secrets
  RB-05 G5      AdEnable               svc-payexport
  RB-06 Cleanup SpDisable              synthetic service principal
  RB-07 Cleanup AdDisable              svc-npi-smoke
Plan SHA-256 for the reviewer: 0cb6515f2ee068986f8e097a1f415798757a4dc477d2d91884c987895f873d3d
Rollback DryRun (Fixture, test): 7 WouldApply
  RB-01 WouldApply  ConditionalAccessState CA015-ServiceAccounts-LocationRestriction-Ring1 enabledForReportingButNotEnforced -> disabled
  RB-02 WouldApply  ConditionalAccessState CA037-WorkloadIdentities-HighRisk-Block-Ring1 enabledForReportingButNotEnforced -> disabled
  RB-03 WouldApply  TenantAppPolicyRestore defaultAppManagementPolicy
  RB-04 WouldApply  AppPolicyOff npi-pilot-block-secrets
  RB-05 WouldApply  AdEnable svc-payexport
  RB-06 WouldApply  SpDisable synthetic service principal
  RB-07 WouldApply  AdDisable svc-npi-smoke
Evidence: ROLLBACK-rollback.json (DryRun)
Preflight (Fixture, production, CHG-2026-1116-P): 14 Pass
  PF-01 Pass   All       Settings file: no secret, no placeholder, this stage: production, gcc, sha256 32c7f79976b7
  PF-02 Pass   G3        Deployment identity uses a certificate or federated credential, no secret: 0 secret(s), 1 certificate(s)
  PF-03 Pass   G4        Workload ID Premium, to create or change workload Conditional Access: Workload_Identities_P2, 5 enabled unit(s)
  PF-04 Pass   G6        Entra ID P1 or P2, for the service principal sign-in logs: SPE_E5
  PF-05 Pass   G4        Reader identity holds Graph read permissions only: Application.Read.All, AuditLog.Read.All, Directory.Read.All, Policy.Read.All, User.Read.All
  PF-06 Pass   G4        Operator Identity engineer: roles for app management policy, federated credentials, smoke test: Cloud Application Administrator eligible; Security Administrator eligible
  PF-06 Pass   G4        Operator Conditional Access administrator: roles for workload Conditional Access, rollback: Conditional Access Administrator eligible
  PF-07 Pass   G1        The pilot app registration exists, single-tenant: Payroll Export, AzureADMyOrg, 1 secret(s)
  PF-07 Pass   G1        The synthetic app registration exists, single-tenant: npi-smoke-production, AzureADMyOrg, 0 secret(s)
  PF-08 Pass   G4        Workload policy CA015-ServiceAccounts-LocationRestriction-Ring1: enabledForReportingButNotEnforced
  PF-08 Pass   G4        Workload policy CA037-WorkloadIdentities-HighRisk-Block-Ring1: enabledForReportingButNotEnforced
  PF-09 Pass   G1-G6     VK-NPI baseline recorded before the change: 01 Fail 4; 02 Fail 2; 03 Fail 1; 04 Fail 3; 05 Warn 3; 06 Fail 2; 07 Warn 1; 08 Fail 1
  PF-10 Pass   G5        gMSA test host and retriever group exist: app-prd-01.corp.contoso.example; gg-gmsa-hrsync-hosts
  PF-11 Pass   Promotion Test stage smoke test passed, in another tenant: test, tenant c0ffee00-0000-4000-8000-0000000000e1, 8/8 Pass
Evidence: PRE-preflight.json (Pass)
Evidence: S0-change-record-approvals-and-settings-file.json (Pass)
Result: GO for this stage. File results.json, snapshot.json and manifest.json with the change record.
Evidence for the test stage (CHG-2026-1102-T): 4 of 9 requirement rows present and passing
  PRE       Present          Warn   KSI-CMT-LMC, KSI-CMT-VTD, KSI-IAM-ELP, KSI-IAM-JIT, KSI-IAM-SNU, KSI-MLA-EVC, KSI-MLA-LET, KSI-PIY-GIV
  S0        Present          Pass   KSI-CMT-LMC, KSI-IAM-JIT
  S1.1      Missing                 
  S1.2      Missing                 
  S1.3      Missing                 
  S1.5      Missing                 
  SMOKE     Present          Pass   KSI-IAM-ELP, KSI-IAM-SNU, KSI-MLA-EVC, KSI-MLA-LET, KSI-PIY-GIV
  ROLLBACK  Failing          DryRun KSI-CMT-RMV, KSI-RPL-ABO
  EVIDENCE  Present          Pass   KSI-MLA-OSM
  Gap: S1.1: no S1.1 record: Chapter 01's and Chapter 02's run folders
  Gap: S1.2: no S1.2 record: Chapter 04's policy plan (test) or apply (production) run folder
  Gap: S1.3: no S1.3 record: Chapter 05's plan and apply run folders
  Gap: S1.5: no S1.5 record: Chapter 08's plan and apply run folders
  Gap: ROLLBACK: ROLLBACK-rollback.json
Result: NO-GO on evidence.
```

The evidence check's `NO-GO` is right for a dry run: Steps 1.1 to 1.5 record their own evidence when they run against a tenant, and a dry-run rollback records `DryRun`, which the go/no-go doesn't accept. Each record is a JSON file; the smoke test's begins like this (the dry run's, with its real time):

```json
{
  "schema": "fmp-npi-deploy-evidence/1",
  "step": "SMOKE",
  "title": "Smoke test",
  "recordedAt": "2026-11-02T12:28:29.7390594Z",
  "environment": "test",
  "cloud": "gcc",
  "tenantId": "c0ffee00-0000-4000-8000-0000000000e1",
  "changeRecord": "CHG-2026-1102-T",
  "settingsSha256": "a1aec69cd4fb8efc2050e564790db1c8857d43fb7d92f6abc29827de407af02e",
  "mode": "Fixture",
  "command": "./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -RegisterRun tests/fixtures/deploy/register-run -ExpectCaState ReportOnly -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-smoke",
  "result": "Pass",
  "note": "",
  ...
  "controls": ["AC-2", "AC-3", "AC-6", "AU-12", "AU-2", "CA-7", "CM-8", "IA-4", "IA-5", "IA-9"],
  "other": ["OMB M-22-09 §III.A", "SCuBA MS.AAD.5.5v1 (SHOULD)"],
  "ksis": ["KSI-IAM-ELP", "KSI-IAM-SNU", "KSI-MLA-EVC", "KSI-MLA-LET", "KSI-PIY-GIV"],
  "checks": [ { "id": "ST-01", "status": "Pass", ... } ]
}
```

and `SHA256SUMS` lists every file in the folder, starting with `0c71b3b06453a3776c1934e0f62cf5e7ae51dad18823cfa32a4269c96497976d  PRE-preflight.json`.

The test preflight's one Warn is deliberate: the fixture's Conditional Access administrator holds a standing assignment instead of a PIM-eligible one, which the preflight reports but doesn't block (*Design guidance*). An approved hash other than the plan's stops the rollback before it sends anything:

```text
The plan's SHA-256 is 0cb6515f2ee068986f8e097a1f415798757a4dc477d2d91884c987895f873d3d, not the approved 0000000000000000000000000000000000000000000000000000000000000000. Nothing was sent.
```

Delete the dry run's folder when you're done:

```powershell
Remove-Item -Recurse -Force out/dryrun
```

## Prepare the stage

Run once per stage, after the change record is approved and before the preflight (in Stage 2, with the production file). These steps create the inputs folders, the gMSA's retriever group and the objects the smoke test uses, and write the new IDs into the settings file. Nothing here touches a workload.

1. **Create the inputs folders** the kit's scripts read, with the header row only where a file doesn't exist yet. If Chapter 02's ownership inputs for this tenant already exist, this leaves them as they are:

   ```powershell
   New-Item -ItemType Directory -Force $s.inputs.ownership, (Split-Path $s.inputs.pipelineIdentities) | Out-Null
   foreach ($f in 'application-owners', 'igo-confirmations', 'owner-claims', 'service-records') { $t = Join-Path $s.inputs.ownership "$f.csv"; if (-not (Test-Path $t)) { Get-Content tests/fixtures/inputs/$f.csv -TotalCount 1 | Set-Content $t } }
   if (-not (Test-Path $s.inputs.pipelineIdentities)) { Get-Content tests/fixtures/ch10/inputs/pipeline-identities.csv -TotalCount 1 | Set-Content $s.inputs.pipelineIdentities }
   Get-ChildItem $s.inputs.ownership, $s.inputs.pipelineIdentities | Format-Table Name, Length
   ```

   **Expected:** four ownership files and the pipeline identities file. Empty ones are filled by the identity governance office as Chapters 02 and 10 describe; until they are, Chapter 02 reports every identity's record as missing.

2. **Create the gMSA's retriever group and add the test host** (G5), as a member of Domain Admins or with a delegated right to create groups in the stage's OU:

   ```powershell
   New-ADGroup -Name $s.ad.gmsaRetrieverGroup -GroupScope Global -GroupCategory Security -Server $s.ad.server
   Add-ADGroupMember -Identity $s.ad.gmsaRetrieverGroup -Members "$($s.ad.gmsaTestHost)$" -Server $s.ad.server
   Get-ADGroupMember -Identity $s.ad.gmsaRetrieverGroup -Server $s.ad.server | Select-Object Name, objectClass
   ```

   **Expected:** the test host's computer account, `objectClass computer`. Learn suggests a security group of the hosts allowed to retrieve a gMSA's password.[^np11-gmsa] Restart the test host before Step 1.4, so its new membership takes effect.

3. **Create the synthetic app registration and service principal** (G1, G3). Sign in as the identity engineer. The app gets two owners, a federated credential for the smoke repository and no secret:

   ```powershell
   $app = Invoke-MgGraphRequest -Method POST -Uri "$graph/v1.0/applications" -Body @{ displayName = "npi-smoke-$stage"; signInAudience = 'AzureADMyOrg' } -OutputType Hashtable
   $sp = Invoke-MgGraphRequest -Method POST -Uri "$graph/v1.0/servicePrincipals" -Body @{ appId = $app.appId } -OutputType Hashtable
   foreach ($o in $s.operators) { Invoke-MgGraphRequest -Method POST -Uri "$graph/v1.0/applications/$($app.id)/owners/`$ref" -Body @{ '@odata.id' = "$graph/v1.0/directoryObjects/$($o.objectId)" } }
   Invoke-MgGraphRequest -Method POST -Uri "$graph/v1.0/applications/$($app.id)/federatedIdentityCredentials" -Body @{ name = "npi-smoke-$stage"; issuer = $s.smoke.federatedIssuer; subject = "repo:$($s.smoke.repository):environment:$stage"; audiences = @('api://AzureADTokenExchange') } | Out-Null
   $raw = Get-Content <settings-file> -Raw | ConvertFrom-Json -AsHashtable -Depth 20
   $raw.smoke.appObjectId = $app.id; $raw.smoke.appClientId = $app.appId; $raw.smoke.spObjectId = $sp.id; $raw.smoke.federatedSubject = "repo:$($s.smoke.repository):environment:$stage"
   $raw | ConvertTo-Json -Depth 20 | Set-Content <settings-file>
   ```

   **Expected:** no output. The settings file now holds the synthetic app's object ID, client ID and service principal ID. Each owner is one of the two operators, so the app meets Chapter 02's two-owner rule.

4. **Create the synthetic service account** (G1), on a domain-joined host as an account allowed to create users in the stage's service-account OU. Its password never expires on purpose, so Chapter 01's register must rate it HIGH (ST-02). The password is random and nobody records it: the account never signs in:

   ```powershell
   $bytes = [Security.Cryptography.RandomNumberGenerator]::GetBytes(48)
   $pw = ConvertTo-SecureString ([Convert]::ToBase64String($bytes)) -AsPlainText -Force
   New-ADUser -Name $s.smoke.adAccount -SamAccountName $s.smoke.adAccount -AccountPassword $pw -Enabled $true -PasswordNeverExpires $true -Description "NPI smoke test ($($s.changeRecord)); never signs in" -Server $s.ad.server
   Remove-Variable pw, bytes
   ```

   **Expected:** no output; `Get-ADUser -Identity $s.smoke.adAccount -Server $s.ad.server` shows it enabled. `New-ADUser` sets `-AccountPassword`, `-Enabled` and `-PasswordNeverExpires` as parameters.[^np11-new-aduser]

5. **Create the pilot's app management policy, turned off** (G3). Still as the identity engineer. It blocks new secrets and symmetric keys and caps new certificates at 180 days, the restrictions Chapter 04 holds as the program's policy, and applies to existing apps through its date. It's assigned in Step 1.2:

   ```powershell
   $r = @{ restrictForAppsCreatedAfterDateTime = '2015-01-01T00:00:00Z' }
   $body = @{ displayName = $s.appManagementPolicy.pilotPolicyName; description = "NPI pilot ($($s.changeRecord))"; isEnabled = $false; restrictions = @{
       passwordCredentials = @(@{ restrictionType = 'passwordAddition'; state = 'enabled'; maxLifetime = $null } + $r, @{ restrictionType = 'symmetricKeyAddition'; state = 'enabled'; maxLifetime = $null } + $r)
       keyCredentials = @(@{ restrictionType = 'asymmetricKeyLifetime'; state = 'enabled'; maxLifetime = 'P180D' } + $r) } }
   $pol = Invoke-MgGraphRequest -Method POST -Uri "$graph/v1.0/policies/appManagementPolicies" -Body $body -OutputType Hashtable
   $raw = Get-Content <settings-file> -Raw | ConvertFrom-Json -AsHashtable -Depth 20
   $raw.appManagementPolicy.pilotPolicyId = $pol.id
   $raw | ConvertTo-Json -Depth 20 | Set-Content <settings-file>
   ```

   **Expected:** no output; the settings file holds the policy's ID. The request follows Learn's create sample, and the policy follows [Chapter 04](04-app-management-policies-and-certificate-rotation.md#verified-facts)'s facts.[^np11-amp-post]

6. **Re-read the settings file**, which now holds the new IDs (and so a new SHA-256, which the preflight records):

   ```powershell
   $s = Read-NpiDeploySettings -Path <settings-file> -Stage $stage
   $s.smoke.appObjectId, $s.smoke.spObjectId, $s.appManagementPolicy.pilotPolicyId
   ```

   **Expected:** three GUIDs.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-8 System Component Inventory; IA-4 Identifier Management | The synthetic objects created with their own identifiers, two owners and a record in the change record | KSI-PIY-GIV | PF-07 in `PRE-preflight.json`; ST-01 in `SMOKE-smoke-test.json` |
| IA-5 Authenticator Management | The synthetic app has a federated credential and no secret; the service account's random password is never recorded | KSI-IAM-SNU | PF-07 (0 secrets); ST-03 and ST-04 |

## Pre-flight checks

Run these before each stage, in the session block, after the Prepare step.

1. **Record the VK-NPI baseline** (G1 to G6). Sign in as the reader app, then run the validation kit's non-person identity track, read-only, with the optional preview check:

   ```powershell
   ../validation-kit/Invoke-ValidationKit.ps1 -OutputPath "$out/vk-baseline" -Track NPI -IncludePreview -SkipConnect -TenantId $s.tenantId
   $baseline = (Get-ChildItem "$out/vk-baseline" -Recurse -Filter ValidationResults.json | Sort-Object LastWriteTime | Select-Object -Last 1).FullName
   $baseline
   ```

   **Expected:** one line per check, VK-NPI-01 to VK-NPI-09, each `Pass`, `Fail` or `Warn`, and the path of `ValidationResults.json`. A `Fail` is a baseline, not a blocker: it is what the stage sets out to change. An `Error` is a blocker. `-SkipAD` isn't used, so VK-NPI-06 reads the forest; run it on a domain-joined host. VK-NPI-09 reads a beta API.

2. **Run the preflight** (all gates). Still signed in as the reader app, on a domain-joined host with the ActiveDirectory module. In Stage 2, add `-PromotionEvidencePath <test-evidence>`:

   ```powershell
   ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath <settings-file> -Stage $stage -BaselinePath $baseline -OutputPath "$out/preflight"
   ```

   **Expected:**

   | Check | Gate | Expected result |
   |---|---|---|
   | PF-01 | All | The file is complete for this stage, with its SHA-256 |
   | PF-02 | G3 | The deployment identity's app holds 0 secrets, and the certificate in the settings is on it (or a matching federated credential) |
   | PF-03 | G4 | An enabled Workload ID Premium plan (`AAD_WRKLDID_P1` or `P2`). Learn: the license is needed to create or change a policy scoped to service principals; without it, existing policies keep working but can't be changed[^np11-wid] [^np11-licensing] |
   | PF-04 | G6 | An enabled Entra ID P1 or P2 plan, for the service principal sign-in logs ([Chapter 05](05-workload-identity-federation-and-managed-identities.md#verified-facts)) |
   | PF-05 | G4 | The reader app holds no ReadWrite application permission |
   | PF-06 | G4 | Each operator is eligible for their roles; an active assignment is a Warn[^np11-eligibility] |
   | PF-07 | G1 | The pilot and synthetic app registrations exist and are single-tenant; the synthetic holds no secret |
   | PF-08 | G4 | Each workload policy in the settings exists and isn't enforced; none recorded yet is a Warn (they're created in Step 1.5) |
   | PF-09 | G1–G6 | The VK-NPI baseline has no Error |
   | PF-10 | G5 | The gMSA test host and the retriever group exist |
   | PF-11 | Promotion | Stage 2 only: the test stage's smoke test passed, every check, in another tenant |

   The last line is `Result: GO for this stage` or `Result: NO-GO` with exit code 1. Fix every Fail before the stage starts.

3. **Check the KDS root key** (G5), on a domain controller in the stage's forest, with the delegated read of `msKds-UseStartTime` and `msKds-CreateTime` that [Chapter 06](06-gmsa-dmsa-and-the-kerberos-island.md) grants, not as a Domain Admin: `Get-KdsRootKey` returns the key's value, and Chapter 06 rejects it. A gMSA needs one, and domain controllers wait up to 10 hours after it's created before they allow a gMSA:[^np11-kds]

   ```powershell
   $cfg = (Get-ADRootDSE).configurationNamingContext
   Get-ADObject -SearchBase "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,$cfg" -Filter * -Properties msKds-UseStartTime, msKds-CreateTime | Select-Object Name, msKds-UseStartTime, msKds-CreateTime
   ```

   **Expected:** at least one key whose `msKds-UseStartTime` is more than 10 hours ago. If there is none, create one and wait 10 hours before Step 1.4:

   ```powershell
   Add-KdsRootKey -EffectiveImmediately
   ```

   Learn's backdated key (`-EffectiveTime ((Get-Date).AddHours(-10))`) is for a test environment with one domain controller only;[^np11-kds] don't use it in a forest with more than one.

4. **Check the evidence records** the preflight wrote, in `$out/evidence`:

   ```powershell
   Get-ChildItem "$out/evidence" -Filter *.json | ForEach-Object { $r = Get-Content $_.FullName -Raw | ConvertFrom-Json; '{0}: {1}; KSIs {2}' -f $_.Name, $r.result, ($r.ksis -join ', ') }
   ```

   **Expected:** `PRE-preflight.json` (Pass, or Warn with each Warn understood) and `S0-change-record-approvals-and-settings-file.json` (Pass), each with its KSIs.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3, CM-6 | PF-01: the settings file complete for this stage, with no secret | KSI-CMT-LMC | PF-01 in `PRE-preflight.json` |
| IA-5, IA-5(2), IA-9 | PF-02: the deployment identity signs in with a certificate or federated credential | KSI-IAM-SNU | PF-02 |
| AC-3, AC-6 | PF-03: the license that workload Conditional Access needs | KSI-IAM-ELP | PF-03 |
| AU-2, AU-12 | PF-04: the license the service principal sign-in logs need | KSI-MLA-LET | PF-04 |
| AC-6, AC-6(5) | PF-05: the reader app holds reads only | KSI-IAM-ELP, KSI-IAM-SNU | PF-05 |
| AC-2, AC-5, AC-6(5), CM-5 | PF-06: operators eligible through PIM | KSI-IAM-JIT | PF-06 |
| CM-8, IA-4 | PF-07: the pilot and synthetic objects exist | KSI-PIY-GIV | PF-07 |
| CM-3(2), CM-4(2) | PF-08: workload policies not enforced before the stage | KSI-CMT-VTD | PF-08 |
| CA-7, CM-2 | PF-09: the VK-NPI baseline before the change | KSI-MLA-EVC | PF-09; the validation kit's `ValidationResults.json` under `runs/PRE` |
| IA-5, IA-9 | PF-10 and the KDS root key: the forest can issue a gMSA | KSI-IAM-SNU | PF-10; the start-time read's output filed with the change record |

## Stage 1: live test

Run the session block with `<stage>` set to `test` and the test settings file. Each step names the guide's gate it fulfils.

### Step 1.1: Inventory and owners (G1)

Fulfils [G1 Inventory](../../../books/guides/non-person-identity-implementation.md#step-1-inventory-every-non-person-identity). As the reader app, on a domain-joined host:

```powershell
./Invoke-NpiInventory.ps1 -Cloud $s.cloud -TenantId $s.tenantId -Domain $s.ad.domain -OutputPath "$out/inventory"
./Invoke-NpiOwnership.ps1 -Cloud $s.cloud -RegisterRun "$out/inventory" -InputPath $s.inputs.ownership -OutputPath "$out/ownership"
Import-Csv "$out/inventory/register.csv" | Where-Object { $_.ObjectId -in $s.smoke.appObjectId, $s.pilot.appObjectId -or $_.Name -eq $s.smoke.adAccount } | Format-Table Name, Type, OwnerCount, Secrets, CredentialKind, Risk
Import-Csv "$out/inventory/data-platform-handoff.csv" | Format-Table
```

**Expected:** the register shows the synthetic app with `OwnerCount 2`, `Secrets 0` and `CredentialKind Federated`; the pilot with its one secret; and `svc-npi-smoke` with `Risk HIGH`. Chapter 02's findings list every ownerless identity; none is the synthetic. SQL Server's service and application principals are in `data-platform-handoff.csv`: the guide's [SQL Server section](../../../books/guides/non-person-identity-implementation.md#sql-server) hands them to the Data Platform plan, and this runbook doesn't convert them. The orphan plan Chapter 02 writes is not applied in this runbook.

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S1.1 -RunPath "$out/inventory", "$out/ownership" -EvidencePath "$out/evidence" -Command "Invoke-NpiInventory.ps1; Invoke-NpiOwnership.ps1"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2 Account Management; CM-8; IA-4 | Every non-person identity read into one register, with its owners; the orphans found | KSI-PIY-GIV, KSI-IAM-SNU | `S1.1-inventory-and-owners.json` and `runs/S1.1/` (Chapter 01's register and Chapter 02's findings, re-hashed) |
| OMB M-22-09 §III.A (enterprise-managed identities) | Each workload identity tied to an owner and a record in the enterprise directory | KSI-PIY-GIV | Same |

### Step 1.2: App management policy, scoped to the pilot (G3)

Fulfils part of [G3 Credential rules](../../../books/guides/non-person-identity-implementation.md#step-3-set-the-credential-rules): the restriction on two applications, not the tenant. As the identity engineer:

```powershell
Invoke-MgGraphRequest -Method PATCH -Uri "$graph/v1.0/policies/appManagementPolicies/$($s.appManagementPolicy.pilotPolicyId)" -Body @{ isEnabled = $true }
foreach ($id in $s.pilot.appObjectId, $s.smoke.appObjectId) { Invoke-MgGraphRequest -Method POST -Uri "$graph/v1.0/applications/$id/appManagementPolicies/`$ref" -Body @{ '@odata.id' = "$graph/v1.0/policies/appManagementPolicies/$($s.appManagementPolicy.pilotPolicyId)" } }
(Invoke-MgGraphRequest -Uri "$graph/v1.0/policies/appManagementPolicies/$($s.appManagementPolicy.pilotPolicyId)/appliesTo?`$select=id,displayName").value | Format-Table id, displayName
```

The same in the admin center: **Entra ID** > **Enterprise apps** > **Application policies** > **Block password addition**, status **On**, **Applies to** set to **Select applications**, then **Add applications**.[^np11-amp-configure] Use one or the other: the admin center builds its own custom policy, and an application holds only one.[^np11-amp-overview]

**Expected:** the last command lists the pilot and the synthetic app. Learn documents no report-only mode for app management policies, so the scope is the safety: two applications, and existing credentials keep working, because a policy blocks only the create or update that breaks it.[^np11-amp-configure] [^np11-amp-overview] An app that already has a custom policy refuses the assignment; Learn says to change that policy instead (research gaps, row 103). The tenant-wide policy waits for Stage 2.

Then plan the tenant-wide policy without applying it, so the change Stage 2 makes is reviewed now. Copy Chapter 04's reviewed policy into the path the settings name, and plan, as the reader app:

```powershell
New-Item -ItemType Directory -Force (Split-Path $s.appManagementPolicy.configPath) | Out-Null
Copy-Item config/app-management-policy.json $s.appManagementPolicy.configPath
./Invoke-NpiCredentialPolicy.ps1 -Cloud $s.cloud -RegisterRun "$out/inventory" -ConfigPath $s.appManagementPolicy.configPath -OutputPath "$out/policy-plan"
(Get-FileHash "$out/policy-plan/policy-plan.json" -Algorithm SHA256).Hash.ToLower()
```

**Expected:** Chapter 04's findings and a plan that sets the tenant default policy with the effective date in the copied file; nothing is sent. Hand the hash to the reviewer for Stage 2.

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S1.2 -RunPath "$out/policy-plan" -EvidencePath "$out/evidence" -Command "pilot policy PATCH and appliesTo; Invoke-NpiCredentialPolicy.ps1"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| IA-5 Authenticator Management | New secrets and symmetric keys refused on the pilot and synthetic apps; certificates capped at 180 days | KSI-IAM-SNU | `S1.2-app-management-policy.json` with Chapter 04's plan; ST-03 in the smoke test |
| CM-3, CM-6 | The tenant-wide policy planned and reviewed now, applied in Stage 2 | KSI-CMT-LMC | The policy plan and its approved SHA-256 under `runs/S1.2` |
| CISA SCuBA MS.AAD.5.5v1 to 5.7v1 (SHOULD in ScubaGear 2.0.0, not a BOD 25-01 required configuration, as the guide records) | No app passwords; lifetimes capped | KSI-IAM-SNU | The ScubaGear result the guide files with G3 |

### Step 1.3: Federated credential and managed identity on the pilot, beside the old secret (G5)

Fulfils [G5 Conversion](../../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run) for one workload. The pilot's GitHub workflow moves from its secret to a federated credential, and its Azure-hosted job from the legacy AD account to a user-assigned managed identity. The old secret and the legacy account stay enabled for the 30-day parallel run.

1. **Create the managed identity with the Azure CLI**, signed in as the identity engineer:

   ```powershell
   az identity create --name $s.pilot.managedIdentityName --resource-group $s.azure.resourceGroup --location $s.azure.location --query "{id:id, principalId:principalId, clientId:clientId}" --output json
   ```

   **Expected:** the identity's resource ID, principal ID and client ID.[^np11-uami-cli] The `create` flags are the CLI's own; Learn's pages opened for this chapter show the command group, not these flags (research gaps, row 105).

2. **Write the conversion file** for Chapter 05, from the settings and the pilot's current secret. As the reader app:

   ```powershell
   $old = (Invoke-MgGraphRequest -Uri "$graph/v1.0/applications/$($s.pilot.appObjectId)?`$select=passwordCredentials").passwordCredentials | Select-Object -First 1
   $mi = "/subscriptions/$($s.azure.subscriptionId)/resourceGroups/$($s.azure.resourceGroup)/providers/Microsoft.ManagedIdentity/userAssignedIdentities/$($s.pilot.managedIdentityName)"
   $legacy = Get-ADUser -Identity $s.pilot.legacyAdAccounts[0] -Server $s.ad.server
   $conv = @{ version = 1; tenantId = $s.tenantId; conversions = @(
       @{ id = 'pilot-01'; wave = 1; risk = 'HIGH'; owner = $s.pilot.ownerUpn
          legacy = @{ kind = 'appSecret'; name = "$($s.pilot.name) secret"; applicationObjectId = $s.pilot.appObjectId; keyId = $old.keyId }
          host = @{ description = 'GitHub Actions workflow'; azureHosted = $false; oidcIssuer = $true }
          target = @{ kind = 'federatedCredential'; on = 'application'; applicationObjectId = $s.pilot.appObjectId; credentials = @(@{
              name = "pilot-$stage"; issuer = $s.pilot.federatedIssuer; subject = $s.pilot.federatedSubject; audiences = @('api://AzureADTokenExchange'); description = "Replaces $($old.keyId)"
              workload = @{ platform = 'github'; repository = $s.pilot.repository; entity = 'environment'; value = $stage; subjectFormat = 'name-based' } }) } },
       @{ id = 'pilot-02'; wave = 1; risk = 'HIGH'; owner = $s.pilot.ownerUpn
          legacy = @{ kind = 'adAccount'; name = $legacy.SamAccountName; objectId = "$($legacy.ObjectGUID)" }
          host = @{ description = 'Azure-hosted export job'; azureHosted = $true; oidcIssuer = $false }
          target = @{ kind = 'managedIdentity'; identityType = 'userAssigned'; createIfMissing = $false; location = $s.azure.location; resourceId = $mi; credentials = @() } }) }
   New-Item -ItemType Directory -Force (Split-Path $s.pilot.conversionsPath) | Out-Null
   $conv | ConvertTo-Json -Depth 20 | Set-Content $s.pilot.conversionsPath
   Get-Content tests/fixtures/ch05/cutover-log.csv -TotalCount 1 | Set-Content $s.pilot.cutoverLogPath
   ```

   **Expected:** no output. The file has the two conversions; the cutover log has only its header.

3. **Plan, then apply, through Chapter 05's write path.** Plan as the reader app, hand the hash to the reviewer, then apply as the identity engineer with Azure signed in as the same person:

   ```powershell
   ./Invoke-NpiFederation.ps1 -Cloud $s.cloud -TenantId $s.tenantId -Domain $s.ad.domain -ConversionsPath $s.pilot.conversionsPath -CutoverLogPath $s.pilot.cutoverLogPath -OutputPath "$out/federation"
   Get-Content "$out/federation/findings.json" -Raw | ConvertFrom-Json | Format-Table Rule, Severity, ObjectKey
   (Get-FileHash "$out/federation/plan.json" -Algorithm SHA256).Hash.ToLower()
   ```

   ```powershell
   Connect-AzAccount -Environment $cloud.AzureEnvironment -Tenant $s.tenantId -Subscription $s.azure.subscriptionId | Out-Null
   ./Invoke-NpiFederation.ps1 -Cloud $s.cloud -PlanPath "$out/federation/plan.json" -ApprovedSha256 <sha> -Domain $s.ad.domain -OutputPath "$out/federation-dry"
   ./Invoke-NpiFederation.ps1 -Cloud $s.cloud -PlanPath "$out/federation/plan.json" -ApprovedSha256 <sha> -Domain $s.ad.domain -OutputPath "$out/federation-apply" -Apply
   ```

   **Expected:** the plan creates one federated credential on the pilot app and records the managed identity; the exchange test against the fake passes; the apply sends one write. A wrong subject is accepted at creation and fails only at the exchange, which is why Chapter 05 checks it first ([Chapter 05](05-workload-identity-federation-and-managed-identities.md#what-the-code-depends-on)). The first exchange minutes after creation may fail with `AADSTS70021` while the credential propagates: wait and retry.

4. **Start the parallel run.** The pilot's application owner switches the workflow to the federated credential and the job to the managed identity, then records the cutover:

   ```powershell
   Add-Content $s.pilot.cutoverLogPath "pilot-01,$(Get-Date -Format yyyy-MM-dd),$($s.pilot.ownerUpn),,"
   Add-Content $s.pilot.cutoverLogPath "pilot-02,$(Get-Date -Format yyyy-MM-dd),$($s.pilot.ownerUpn),,"
   ```

   **Expected:** in the test stage, the run lasts as long as the smoke test needs; the 30-day run and the disable belong to production (Step 2.2). The old secret stays on the app: the pilot's app management policy doesn't remove it, and the owner does, in a separate reviewed change made by hand (Chapter 04's write path accepts only certificates), after the run.

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S1.3 -RunPath "$out/federation", "$out/federation-apply" -EvidencePath "$out/evidence" -Command "az identity create; Invoke-NpiFederation.ps1 plan and -Apply"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| IA-5; IA-9 Service Identification and Authentication (tailored in) | The pilot authenticates with a federated credential and a managed identity, no stored secret, after an exchange test | KSI-IAM-SNU | `S1.3-federated-credential-and-managed-identity-parallel-run.json` and `runs/S1.3/` (Chapter 05's plan, exchange tests and apply) |
| CM-3(2), CM-4(2) | The token exchange tested before the cutover | KSI-CMT-VTD | `exchange-tests.json` in Chapter 05's run, re-hashed |
| AC-2(3) Disable Accounts | The legacy account stays enabled through the parallel run and is disabled, never deleted, after it (production, day 31) | KSI-IAM-AAM | The cutover log; the day-31 apply run (Step 2.2) |

### Step 1.4: gMSA on a test host (G5)

Fulfils the AD half of [G5](../../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run). As a member of Domain Admins in the stage's forest, the test forest in Stage 1 and the production forest in Stage 2 (or with a delegated right to create gMSAs), after the KDS root key's 10 hours:

```powershell
New-ADServiceAccount -Name $s.ad.gmsaName -DNSHostName "$($s.ad.gmsaName).$($s.ad.domain)" -PrincipalsAllowedToRetrieveManagedPassword $s.ad.gmsaRetrieverGroup -KerberosEncryptionType AES256 -Server $s.ad.server
Get-ADServiceAccount -Identity $s.ad.gmsaName -Properties PrincipalsAllowedToRetrieveManagedPassword -Server $s.ad.server | Select-Object Name, Enabled, PrincipalsAllowedToRetrieveManagedPassword
```

Then, on the test host (restarted after the Prepare step added it to the retriever group), in an elevated PowerShell window:

```powershell
Install-ADServiceAccount -Identity <gmsa-name>
Test-ADServiceAccount -Identity <gmsa-name>
```

Here `<gmsa-name>` is `ad.gmsaName` from the settings file (the host has no session block). Then set the test service to run as the gMSA: **Services** (`services.msc`) > the service named in `ad.gmsaService` > **Properties** > **Log On** > **This account**: `<netbios-domain>\<gmsa-name>$`, with both password boxes empty > **OK**, then restart the service. The console steps are not on Learn's gMSA page, which says only that services using the Service Control Manager support gMSAs (research gaps, row 105).

**Expected:** `Get-ADServiceAccount` shows the retriever group; `Test-ADServiceAccount` prints `True`; the service starts as the gMSA. A gMSA name must be unique in the forest, not only the domain; the password interval can be set only at creation (30 days by default).[^np11-gmsa] A gMSA used too soon after the root key can fail to retrieve its password on a domain controller the key hasn't reached.[^np11-kds] Chapter 06's plan is the path for converting existing accounts, MSAs and dMSAs in production; this step proves the forest, the host and the service accept a gMSA.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| IA-5, IA-9 | A Kerberos service runs as a gMSA whose password the domain manages | KSI-IAM-SNU | ST-07 in `SMOKE-smoke-test.json`; the `Test-ADServiceAccount` output on the host |

### Step 1.5: Conditional Access for workload identities, report-only (G4)

Fulfils the Conditional Access half of [G4 Least privilege](../../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege). Learn: the policy applies only to single-tenant service principals registered in the tenant, assigned directly (a group containing a service principal isn't enforced for it), with Block as the only grant control, and can be saved report-only.[^np11-wid]

1. **Write the scope file** from Chapter 08's fixture, with the pilot and the synthetic in Ring 1:

   ```powershell
   $sc = Get-Content tests/fixtures/ch08/scope.json -Raw | ConvertFrom-Json -AsHashtable
   $sc.tenantId = $s.tenantId; $sc.cloud = $s.cloud
   $sc.inScope = @(
       @{ objectId = $s.pilot.spObjectId; appId = $s.pilot.appClientId; name = $s.pilot.name; tier = 'Tier1'; servicePrincipalType = 'Application'; signInAudience = 'AzureADMyOrg'; ring = 'Ring1'; record = $s.changeRecord },
       @{ objectId = $s.smoke.spObjectId; appId = $s.smoke.appClientId; name = "npi-smoke-$stage"; tier = 'Tier1'; servicePrincipalType = 'Application'; signInAudience = 'AzureADMyOrg'; ring = 'Ring1'; record = $s.changeRecord })
   $sc.outOfScope = @()
   # One record for each managed identity and multitenant app in the tenant, including the pilot's managed identity from Step 1.3; repeat the line for each
   $sc.outOfScope += @{ objectId = '<oos-object-id>'; name = '<oos-name>'; class = '<oos-class>'; control = '<oos-control>'; reviewedBy = '<oos-reviewed-by>'; reviewedOn = '<oos-reviewed-on>' }
   $sc.egress.ranges = @('<egress-range>')
   $sc.licensing = @{ decision = 'D-NP4'; outcome = '<d-np4-outcome>'; decidedBy = '<d-np4-by>'; decidedOn = '<d-np4-on>' }
   $sc.microsoftOwnerTenantIds = @('<microsoft-owner-tenant-id>')
   New-Item -ItemType Directory -Force (Split-Path $s.conditionalAccess.scopePath) | Out-Null
   $sc | ConvertTo-Json -Depth 10 | Set-Content $s.conditionalAccess.scopePath
   ```

2. **Check, plan and apply**, as the Conditional Access administrator. Chapter 08's script creates every policy report-only, whatever its ring's state:

   ```powershell
   ./Invoke-NpiWorkloadCa.ps1 -Mode Check -ScopePath $s.conditionalAccess.scopePath
   ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -OutputPath "$out/wca-plan"
   ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -OutputPath "$out/wca-apply" -Apply
   ```

3. **Record the new policies' IDs in the settings file**, then re-read it:

   ```powershell
   $pols = (Invoke-MgGraphRequest -Uri "$graph/v1.0/identity/conditionalAccess/policies?`$select=id,displayName,state").value | Where-Object { $_.displayName -match '^CA0(15|37)-' }
   $raw = Get-Content <settings-file> -Raw | ConvertFrom-Json -AsHashtable -Depth 20
   $raw.conditionalAccess.policies = @($pols | ForEach-Object { @{ id = $_.id; name = $_.displayName; ring = $(if ($_.displayName -match '(Ring\d+)') { $Matches[1] } else { $null }) } })
   $raw | ConvertTo-Json -Depth 20 | Set-Content <settings-file>
   $s = Read-NpiDeploySettings -Path <settings-file> -Stage $stage
   $pols | Format-Table displayName, state
   ```

   The same check in the admin center: **Entra ID** > **Conditional Access** > **Policies**, each `CA015-` and `CA037-` policy showing **Report-only**.[^np11-wid]

**Expected:** `Pre-merge check` with no Finding; a plan that creates the egress named location and the Ring 1 policies; the apply sends them; every listed policy is `enabledForReportingButNotEnforced`. The policy is assigned by the service principal's object ID from **Enterprise apps**, not the app registration's.[^np11-wid] AI agent identities stay out of this step: their policies are Chapter 09's, preview and report-only, as the guide's [AI agents section](../../../books/guides/non-person-identity-implementation.md#ai-agents) says.

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S1.5 -RunPath "$out/wca-plan", "$out/wca-apply" -EvidencePath "$out/evidence" -Command "Invoke-NpiWorkloadCa.ps1 -Mode Check, Plan, Plan -Apply"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-3 Access Enforcement; AC-6 Least Privilege | Tier 1 single-tenant service principals assigned directly to workload policies | KSI-IAM-ELP | `S1.5-workload-conditional-access-report-only.json` and `runs/S1.5/` (Chapter 08's plan and apply) |
| CM-3(2), CM-4(2) | Every policy created report-only; enforcement waits for a reviewed sign-in summary | KSI-CMT-VTD | Same; PF-08 and ST-05 |

### Step 1.6: Smoke test

Prove the deployment end to end with objects nobody depends on. Write each expected result down before you run it; the smoke test compares.

1. **Make the synthetic sign in**, twice: once from inside the egress range (a runner on the pilot's network) and once from outside it (a GitHub-hosted runner). Create this workflow as `.github/workflows/npi-smoke.yml` in the smoke repository named in `smoke.repository`, with an environment named `test` (and later `production`) whose variables `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` hold the synthetic app's client ID and the tenant ID:

   ```yaml
   name: npi-smoke
   on:
     workflow_dispatch:
       inputs:
         stage: { required: true, type: choice, options: [test, production] }
         runner: { required: true, type: string, default: ubuntu-latest }
   permissions:
     id-token: write
     contents: read
   jobs:
     sign-in:
       runs-on: ${{ inputs.runner }}
       environment: ${{ inputs.stage }}
       steps:
         - uses: azure/login@v2
           with:
             client-id: ${{ vars.AZURE_CLIENT_ID }}
             tenant-id: ${{ vars.AZURE_TENANT_ID }}
             allow-no-subscriptions: true
   ```

   Then start both runs from the session (the inside run uses the self-hosted runner's label, `npi-egress`, in this fictional estate):

   ```powershell
   gh workflow run npi-smoke.yml --repo $s.smoke.repository -f stage=$stage -f runner=ubuntu-latest
   gh workflow run npi-smoke.yml --repo $s.smoke.repository -f stage=$stage -f runner=npi-egress
   gh run list --repo $s.smoke.repository --workflow npi-smoke.yml --limit 2
   ```

   **Expected:** both runs succeed: the policies are report-only, so nothing is blocked. The Azure Login action's audience defaults to `api://AzureADTokenExchange` in the public clouds.[^np11-oidc] `allow-no-subscriptions` is the action's own input, for an identity with no Azure role; Learn's page doesn't show it (research gaps, row 105).

2. **Read the register again**, as the reader app, so the smoke test sees today's state:

   ```powershell
   ./Invoke-NpiInventory.ps1 -Cloud $s.cloud -TenantId $s.tenantId -Domain $s.ad.domain -OutputPath "$out/inventory-smoke"
   ```

3. **Run the smoke test** on the gMSA test host (it runs `Test-ADServiceAccount` locally), signed in as the identity engineer, at least 15 minutes after the sign-ins so they reach the log (research gaps, row 104):

   ```powershell
   ./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath <settings-file> -Stage $stage -RegisterRun "$out/inventory-smoke" -ExpectCaState ReportOnly -OutputPath "$out/smoke-final"
   ```

**Expected** (not yet observed live):

| Check | Gate | Expected result | Why |
|---|---|---|---|
| ST-01 | G1 | The synthetic app in the register with `OwnerCount 2`, `Secrets 0`, `CredentialKind Federated` | The inventory and the ownership rule see a new app |
| ST-02 | G1 | `svc-npi-smoke` rated `HIGH`, "password never expires" | The inventory flags what the guide's first wave converts |
| ST-03 | G3 | The new secret refused | The pilot policy blocks password addition on the synthetic app.[^np11-amp-overview] If it is accepted, the script removes it by key ID at once and the check fails.[^np11-removepassword] A 401 or 403 also fails: that is a permission problem, not the policy |
| ST-04 | G5 | One federated credential matching issuer, subject and the single audience exactly | Chapter 05's exact, case-sensitive match |
| ST-05 | G4 | Each workload policy `enabledForReportingButNotEnforced`, the synthetic's object ID in `includeServicePrincipals` | Direct assignment, report-only[^np11-wid] |
| ST-06 | G4 | The synthetic's sign-ins show `reportOnlyFailure` for CA015 from the outside run and `reportOnlyNotApplied` from the inside run | Report-only results, returned only with the `Prefer: include-unknown-enum-members` header (Graph beta)[^np11-applied] |
| ST-07 | G5 | `Test-ADServiceAccount True`; the synthetic account enabled | The host can retrieve the gMSA's password[^np11-gmsa] |

The last line is `Result: PASS`, or `Result: FAIL. Stop here and run the rollback.` with exit code 1.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2, CM-8, IA-4; OMB M-22-09 §III.A | ST-01, ST-02: a new app and a risky account appear in the register | KSI-PIY-GIV, KSI-IAM-SNU | `SMOKE-smoke-test.json`, written by the smoke test |
| IA-5; SCuBA MS.AAD.5.5v1 (SHOULD) | ST-03: a new secret refused | KSI-IAM-SNU | Same, ST-03 |
| IA-5, IA-9 | ST-04, ST-07: the federated credential and the gMSA | KSI-IAM-SNU | Same, ST-04 and ST-07 |
| AC-3, AC-6, IA-9 | ST-05: direct assignment, the expected state | KSI-IAM-ELP | Same, ST-05 |
| AU-2, AU-12, CA-7 | ST-06: the sign-ins logged with the policies' result | KSI-MLA-LET, KSI-MLA-EVC | Same, ST-06 |

### Step 1.7: Capture the evidence

The scripts wrote their records as they ran, and each step's `Write-NpiDeployEvidence.ps1` call wrote the rest. Copy the files the operator wrote by hand into the folder, rebuild `SHA256SUMS`, then check the stage's coverage:

```powershell
New-Item -ItemType Directory -Force "$out/evidence/inputs" | Out-Null
Copy-Item <settings-file>, $s.conditionalAccess.scopePath, $s.pilot.conversionsPath, $s.pilot.cutoverLogPath "$out/evidence/inputs/"
Update-NpiDeployEvidenceSums -EvidencePath "$out/evidence"
./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -EvidencePath "$out/evidence"
```

**Expected:** before the rollback, every row `Present` except `ROLLBACK`, which is `Missing` until Step 1.8, so the script ends `Result: NO-GO on evidence.` The ISSO checks the folder independently with `sha256sum -c SHA256SUMS` from a POSIX shell inside it.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AU-9 Protection of Audit Information | Every evidence file hashed in `SHA256SUMS`; any change or unlisted file found | KSI-MLA-OSM | `SHA256SUMS`; the `EVIDENCE` row of `Test-NpiDeployEvidence.ps1` |


### Step 1.8: Roll back the test stage

Rehearse the rollback now, in the test stage, so the production rollback is a command you have run. The guide's [rollback table](../../../books/guides/non-person-identity-implementation.md#rollback) is the model: workload policies off, the policy exception or restore, the legacy account re-enabled and the application's configuration reverted.

1. **Plan the rollback** from the preflight's snapshot (it sends nothing):

   ```powershell
   ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath <settings-file> -Stage $stage -SnapshotPath "$out/preflight/snapshot.json" -To Disabled -OutputPath "$out/rollback"
   ```

   **Expected:** five actions: both workload policies to `disabled`, the tenant default app management policy restored as the preflight found it, the pilot policy turned off and the legacy account re-enabled; and the plan's SHA-256 for the reviewer. The synthetic objects stay, for the re-deployment.

2. **Dry-run, then apply**, signed in for the rollback, on a domain-joined host, with the hash the reviewer passes back:

   ```powershell
   ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath <settings-file> -Stage $stage -PlanPath "$out/rollback/rollback-plan.json" -ApprovedSha256 <sha> -OutputPath "$out/rollback-dry"
   ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath <settings-file> -Stage $stage -PlanPath "$out/rollback/rollback-plan.json" -ApprovedSha256 <sha> -OutputPath "$out/rollback-apply" -Apply
   ```

   **Expected:** the dry run prints `5 WouldApply`; the apply prints `5 Applied`, or `AlreadyDone` for a policy already off. Learn's roll back for workload policies is to delete or disable them;[^np11-wid] the kit only disables. An app management policy turned off stops refusing new secrets at once, and tokens already issued under a workload policy stay valid until they expire (the guide's [dangers](../../../books/guides/non-person-identity-implementation.md#dangers)).

3. **Back out the host and the workload.** On the gMSA test host, set the service back to its previous account (**Services** > the service > **Properties** > **Log On**), then:

   ```powershell
   Uninstall-ADServiceAccount -Identity <gmsa-name>
   ```

   The pilot's owner points the workflow back at its secret and the job back at the legacy account, which the rollback re-enabled. Remove the pilot's federated credential and the managed identity by hand in the test tenant, if the change record says to: the kit never deletes.

4. **Check the rollback** with a fresh baseline and preflight, as the reader app:

   ```powershell
   ../validation-kit/Invoke-ValidationKit.ps1 -OutputPath "$out/vk-after-rollback" -Track NPI -IncludePreview -SkipConnect -TenantId $s.tenantId
   ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath <settings-file> -Stage $stage -BaselinePath (Get-ChildItem "$out/vk-after-rollback" -Recurse -Filter ValidationResults.json | Select-Object -Last 1).FullName -OutputPath "$out/preflight-after-rollback" -EvidencePath "$out/evidence-after-rollback"
   ```

   **Expected:** the VK-NPI statuses match the baseline from the preflight, except VK-NPI-04, which is expected to count the principals of the two disabled policies as uncovered (research gaps, row 107). PF-08 shows each policy `disabled`. The after-rollback records go to their own folder, `$out/evidence-after-rollback`, so they don't replace the deployment's `PRE` record.

5. **Re-deploy.** Repeat Steps 1.2 to 1.7, so the second smoke test is filed as `smoke-final`. That folder is `<test-evidence>` for Stage 2.

6. **Close the synthetic objects** when the test environment is no longer the reference, signed in for the rollback, on a domain-joined host. They are disabled, never deleted by code:

   ```powershell
   Invoke-MgGraphRequest -Method PATCH -Uri "$graph/v1.0/servicePrincipals/$($s.smoke.spObjectId)" -Body @{ accountEnabled = $false }
   Disable-ADAccount -Identity $s.smoke.adAccount -Server $s.ad.server
   ```

   The same with the kit: plan the rollback with `-IncludeSmokeCleanup`, which adds both actions to the plan, as the dry run above shows.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3 Configuration Change Control; CP-10 System Recovery and Reconstitution | The rollback planned from the preflight's snapshot, approved by hash, applied, and the tenant shown back at its starting state | KSI-CMT-RMV, KSI-RPL-ABO | `ROLLBACK-rollback.json` (written by the apply; a dry run records `DryRun`, which the go/no-go doesn't accept); `evidence-after-rollback/PRE-preflight.json` |

## Promotion go/no-go criteria

Production starts only when every row is met and signed. *Design guidance.*

| # | Criterion | Evidence | Signed by |
|---|---|---|---|
| 1 | The test stage's smoke test passed every check, after the rehearsed rollback and re-deployment | `smoke-final/results.json`, all `Pass` | Identity engineer |
| 2 | The rollback was rehearsed and its results filed | `rollback-apply/results.json`, all `Applied` or `AlreadyDone`; the after-rollback preflight | Conditional Access administrator |
| 3 | The evidence folder checks: every hash in `SHA256SUMS` matches | `sha256sum -c SHA256SUMS` output | ISSO |
| 4 | Fourteen days of report-only sign-ins for the pilot reviewed, with no unexpected `reportOnlyFailure` from inside the egress range | Chapter 08's `signin-summary.json` and its SHA-256 | Conditional Access administrator |
| 5 | The tenant-wide app management policy plan reviewed and its SHA-256 approved | `policy-plan/policy-plan.json` and the approval | Identity governance officer |
| 6 | The production settings file reviewed, for a different tenant, with its own operators | Its SHA-256 | Identity governance officer |
| 7 | Production licenses and PIM eligibility in place | A production preflight run before the window, no Fail | Identity engineer |
| 8 | The change record approved, with the window, the Conditional Access rings and the rollback plan | The change record | Change advisory board |
| 9 | Every requirement row for the test stage has its evidence file present and passing, and every hash matches | `Test-NpiDeployEvidence.ps1` for the test stage, exit 0: `Result: every requirement row has its evidence, and every hash matches.` | ISSO |

Check row 9 in a session started with the test settings file:

```powershell
./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage test -EvidencePath "$out/evidence"
```

**Expected:** one `Present` row for each of `PRE`, `S0`, `S1.1`, `S1.2`, `S1.3`, `S1.5`, `SMOKE`, `ROLLBACK` and `EVIDENCE`, with their KSIs, and exit code 0. Any `Missing`, `Failing` or `WrongEnvironment` row is a no-go.

Check rows 1 and 2 from the test evidence with one command:

```powershell
foreach ($f in "$out/smoke-final/results.json", "$out/rollback-apply/results.json") { $r = Get-Content $f -Raw | ConvertFrom-Json; '{0}: {1}' -f $f, (($r | Group-Object Status | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', ') }
```

**Expected:** `8 Pass` for the smoke test and `5 Applied` (or some `AlreadyDone`) for the rollback.

Collect the 14-day summary for row 4, signed in as the reader app (it holds `AuditLog.Read.All` and `Policy.Read.ConditionalAccess`, the permissions Chapter 08 declares for it):

```powershell
./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -From (Get-Date).AddDays(-14).ToUniversalTime() -To (Get-Date).ToUniversalTime() -OutputPath "$out/wca-signins-14d"
```

## Stage 2: production

Start a new session with `<stage>` set to `production` and the production settings file. Every command is the same as in Stage 1.

### Step 2.1: Change record and preflight

Open the production change record, set its number in the settings file's `changeRecord`, then run the **Prepare the stage** and **Pre-flight checks** sections, adding the test evidence to the preflight:

```powershell
./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath <settings-file> -Stage $stage -BaselinePath $baseline -PromotionEvidencePath <test-evidence> -OutputPath "$out/preflight"
```

**Expected:** `Result: GO`, with PF-11 `Pass`: "test, tenant `<test tenant ID>`, 8/8 Pass". PF-11 fails when the evidence is missing, from the production tenant itself, or has any check other than `Pass`.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3(2), CM-4(2) | PF-11: production starts only after the test stage's smoke test passed in another tenant | KSI-CMT-VTD | PF-11 in production's `PRE-preflight.json` |
| The preflight rows, CM-3, CM-5, AC-6(5) | As in the test stage, against the production tenant | As in the test stage | Production's `PRE` and `S0` records |

### Step 2.2: Deploy

Run Steps 1.1 to 1.5 unchanged, in this session. Then apply the tenant-wide app management policy that Step 1.2 planned, with the hash the identity governance officer approved, as the identity engineer:

```powershell
./Invoke-NpiCredentialPolicy.ps1 -Cloud $s.cloud -RegisterRun "$out/inventory" -ConfigPath $s.appManagementPolicy.configPath -OutputPath "$out/policy-plan"
(Get-FileHash "$out/policy-plan/policy-plan.json" -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiCredentialAction.ps1 -Cloud $s.cloud -PlanPath "$out/policy-plan/policy-plan.json" -ApprovedSha256 <sha> -OutputPath "$out/policy-dry"
./Invoke-NpiCredentialAction.ps1 -Cloud $s.cloud -PlanPath "$out/policy-plan/policy-plan.json" -ApprovedSha256 <sha> -OutputPath "$out/policy-apply" -Apply
Invoke-MgGraphRequest -Uri "$graph/v1.0/policies/defaultAppManagementPolicy" | ConvertTo-Json -Depth 10
```

**Expected:** the hash printed by the second line equals the one approved in Stage 1 if nothing in the register or the policy file changed; if it differs, stop and have the new plan reviewed. The tenant default policy then shows the restrictions with the effective date from the policy file, so they bind applications created after it while existing ones are fixed wave by wave ([Chapter 04](04-app-management-policies-and-certificate-rotation.md)).

The pilot's parallel run lasts 30 days in production. On day 31, with the owner's approval in the cutover log, disable the legacy account through Chapter 05's write path, exactly as its second lab's step 6 does, with the paths from the settings file:

```powershell
$log = Import-Csv $s.pilot.cutoverLogPath
($log | Where-Object ConversionId -eq 'pilot-02').DisableApprovedBy = $s.pilot.ownerUpn
$log | Export-Csv $s.pilot.cutoverLogPath -NoTypeInformation -UseQuotes AsNeeded
./Invoke-NpiFederation.ps1 -Cloud $s.cloud -TenantId $s.tenantId -Domain $s.ad.domain -ConversionsPath $s.pilot.conversionsPath -CutoverLogPath $s.pilot.cutoverLogPath -OutputPath "$out/federation-day31"
(Get-FileHash "$out/federation-day31/plan.json" -Algorithm SHA256).Hash.ToLower()
```

Then apply that plan with its approved hash, as in Step 1.3. The legacy account is disabled, never deleted ([G5](../../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run)).

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S1.2 -RunPath "$out/policy-apply" -EvidencePath "$out/evidence" -Command "Invoke-NpiCredentialAction.ps1 -Apply"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2, CM-8, IA-4; IA-5, IA-9; AC-3, AC-6; CM-3, CM-6 | Steps 1.1 to 1.5 in production, each recorded with the same `Write-NpiDeployEvidence.ps1` command | As in Steps 1.1 to 1.5 | Production's `S1.1`, `S1.2` (with `-RunPath "$out/policy-apply"`), `S1.3` and `S1.5` records |
| IA-5; SCuBA MS.AAD.5.5v1 to 5.7v1 (SHOULD) | The tenant-wide app management policy applied | KSI-IAM-SNU, KSI-CMT-LMC | Production's `S1.2` record over `policy-apply`; the ScubaGear result |
| AC-2(3) Disable Accounts | The legacy account disabled on day 31, never deleted | KSI-IAM-AAM | Production's `S1.3` record, re-run with `-RunPath "$out/federation", "$out/federation-apply", "$out/federation-day31"` and the day-31 apply folder |

### Step 2.3: Staged enable by ring {#step-23-staged-enable-by-wave}

Conditional Access is enabled one of Chapter 08's rings at a time, as the settings file's `rings` lists them. For each ring in turn, after its 14 days of report-only sign-ins:

1. **Summarize the ring's sign-ins**, signed in as the reader app, and hand the summary's SHA-256 to the CISO for D-NP5:

   ```powershell
   ./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -From (Get-Date).AddDays(-14).ToUniversalTime() -To (Get-Date).ToUniversalTime() -OutputPath "$out/wca-signins-Ring1"
   ```

2. **Record D-NP5 in the scope file** and enforce the ring, as the Conditional Access administrator:

   ```powershell
   $sha = (Get-FileHash "$out/wca-signins-Ring1/signin-summary.json" -Algorithm SHA256).Hash.ToLower()
   $sc = Get-Content $s.conditionalAccess.scopePath -Raw | ConvertFrom-Json -AsHashtable
   $sc.enforcement = @{ decision = @{ id = 'D-NP5'; outcome = 'Enforce'; decidedBy = '<d-np5-by>'; decidedOn = '<d-np5-on>' }
                        rings = @(@{ ring = 'Ring1'; enforce = $true; signInReview = $sha; reviewedBy = '<reviewer-upn>'; reviewedOn = (Get-Date -Format yyyy-MM-dd) }); exclusions = @() }
   $sc | ConvertTo-Json -Depth 10 | Set-Content $s.conditionalAccess.scopePath
   ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -OutputPath "$out/wca-enforce-Ring1" -Apply -AllowEnforce -SignInSummaryPath "$out/wca-signins-Ring1/signin-summary.json"
   ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -OutputPath "$out/wca-enforce-Ring1-2" -Apply -AllowEnforce -SignInSummaryPath "$out/wca-signins-Ring1/signin-summary.json"
   ```

   **Expected:** the first apply turns CA015 for Ring 1 on and creates anything new report-only; the second turns the rest of Ring 1 on (Chapter 08 creates a policy report-only and enforces it on the next run). For the next ring, repeat with `Ring2` in place of `Ring1`, adding its entry to `rings` beside Ring 1's.

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S2.3 -RunPath "$out/wca-signins-Ring1", "$out/wca-enforce-Ring1", "$out/wca-enforce-Ring1-2" -EvidencePath "$out/evidence" -Command "Invoke-NpiWorkloadCa.ps1 -Mode SignIns; -Apply -AllowEnforce"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-6 Least Privilege; CM-3; CM-4(2) | Each ring enforced only after its reviewed 14-day summary and D-NP5, one ring at a time | KSI-IAM-ELP, KSI-CMT-LMC | `S2.3-staged-enable-by-ring.json` and `runs/S2.3/` (the sign-in summary and the enforce runs) |

### Step 2.4: Smoke test in production

Run Step 1.6 with the production settings, first before any ring is enforced (`-ExpectCaState ReportOnly`), then after each ring, for that ring only:

```powershell
./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath <settings-file> -Stage $stage -RegisterRun "$out/inventory-smoke" -ExpectCaState Enabled -Ring Ring1 -OutputPath "$out/smoke-Ring1"
```

**Expected:** every check `Pass`. ST-05 shows Ring 1's policies `enabled`. ST-06 shows `failure` for CA015 from the outside run, which is now a block: the outside workflow run fails with the message Learn gives, "Access has been blocked due to Conditional Access policies",[^np11-wid] and the inside run succeeds with `notApplied`.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2, CM-8, IA-4, IA-5, IA-9, AC-3, AC-6, AU-2, AU-12, CA-7 | The smoke test's checks in production, before and after each ring | KSI-PIY-GIV, KSI-IAM-SNU, KSI-IAM-ELP, KSI-MLA-LET, KSI-MLA-EVC | Production's `SMOKE-smoke-test.json` (each run replaces it; keep each ring's copy under `runs/SMOKE`) |

### Step 2.5: First-week monitoring with drift

For the seven days after each ring, run Chapter 10's drift run once a day, as the reader app, and the sign-in summary for the enforced rings. The first day writes a baseline candidate; the identity governance officer approves its SHA-256, and each later day compares with it:

```powershell
./Invoke-NpiDriftRun.ps1 -Cloud $s.cloud -TenantId $s.tenantId -Domain $s.ad.domain -InputPath $s.inputs.ownership -OutputPath "$out/drift" -PipelineIdentitiesPath $s.inputs.pipelineIdentities
$first = Get-ChildItem "$out/drift" -Directory | Sort-Object Name | Select-Object -First 1
(Get-FileHash "$($first.FullName)/drift/baseline-candidate.json" -Algorithm SHA256).Hash.ToLower()
```

On each later day:

```powershell
$first = Get-ChildItem "$out/drift" -Directory | Sort-Object Name | Select-Object -First 1
./Invoke-NpiDriftRun.ps1 -Cloud $s.cloud -TenantId $s.tenantId -Domain $s.ad.domain -InputPath $s.inputs.ownership -OutputPath "$out/drift" -PipelineIdentitiesPath $s.inputs.pipelineIdentities -BaselinePath "$($first.FullName)/drift/baseline-candidate.json" -ApprovedBaselineSha256 <sha>
$last = Get-ChildItem "$out/drift" -Directory | Sort-Object Name | Select-Object -Last 1
Get-Content "$($last.FullName)/drift/findings.json" -Raw | ConvertFrom-Json | Format-Table Rule, Severity, ObjectKey
./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud $s.cloud -ScopePath $s.conditionalAccess.scopePath -From (Get-Date).AddDays(-1).ToUniversalTime() -To (Get-Date).ToUniversalTime() -OutputPath "$out/wca-signins-$(Get-Date -Format yyyyMMdd)"
```

**Expected:** no NPI-DRF finding for a credential added outside the pipeline, and no new consent grant; any finding goes to its owner the same day ([Chapter 10](10-drift-and-evidence.md)). In the sign-in summary, a principal with `failure` from inside the egress range means the egress list is wrong: roll the ring back to report-only (Step 2.6) and fix the scope file. Package each day with Chapter 10's evidence pipeline.

Record the step's evidence:

```powershell
./deploy/Write-NpiDeployEvidence.ps1 -SettingsPath <settings-file> -Stage $stage -Step S2.5 -RunPath "$out/drift" -EvidencePath "$out/evidence" -Command "Invoke-NpiDriftRun.ps1, daily for seven days"
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7 Continuous Monitoring; CM-3; AU-6 Audit Record Review | Daily drift against the approved baseline and daily sign-in summaries for the first week | KSI-MLA-EVC, KSI-CMT-LMC | `S2.5-first-week-drift-monitoring.json` and `runs/S2.5/` (Chapter 10's run folders); Chapter 10's packages |

### Step 2.6: Rollback in production

Two levels, both planned from the production preflight's snapshot and applied only with a reviewed hash:

- **One ring back to report-only**, the first response to an unexpected block:

  ```powershell
  ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath <settings-file> -Stage $stage -SnapshotPath "$out/preflight/snapshot.json" -To ReportOnly -Ring Ring1 -OutputPath "$out/rollback-Ring1"
  ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath <settings-file> -Stage $stage -PlanPath "$out/rollback-Ring1/rollback-plan.json" -ApprovedSha256 <sha> -OutputPath "$out/rollback-Ring1-apply" -Apply
  ```

  Then remove the ring from the scope file's `enforcement.rings` so the next Chapter 08 run doesn't enforce it again:

  ```powershell
  $sc = Get-Content $s.conditionalAccess.scopePath -Raw | ConvertFrom-Json -AsHashtable
  $sc.enforcement.rings = @($sc.enforcement.rings | Where-Object { $_.ring -ne 'Ring1' })
  $sc | ConvertTo-Json -Depth 10 | Set-Content $s.conditionalAccess.scopePath
  ```

- **The whole stage**, with Step 1.8's commands and `-To Disabled`, without `-IncludeSmokeCleanup` until the synthetic objects are no longer needed.

**Expected:** the ring rollback has two actions, both to `enabledForReportingButNotEnforced`; the dry-run and apply print them. The guide's [rollback](../../../books/guides/non-person-identity-implementation.md#rollback) for Step 4 is "workload identity policy back to report-only", and for Step 5 "re-enable the legacy account and revert the application's configuration": the full plan does the first and the re-enable; the owner reverts the configuration. Tokens issued before the rollback stay valid for their lifetime.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3; CP-10 | A ring back to report-only, or the whole stage back, by an approved plan; nothing deleted | KSI-CMT-RMV, KSI-RPL-ABO | `ROLLBACK-rollback.json` in production's evidence folder; the rollback run folders |

## Evidence the ISSO keeps

Each stage's evidence folder, `<outputRoot>/evidence`, holds one record per requirement row (`PRE`, `S0`, `S1.1`, `S1.2`, `S1.3`, `S1.5`, `SMOKE`, `ROLLBACK` in test; `S2.3` and `S2.5` as well in production), the run folders they cover under `runs/`, the operator's input files under `inputs/`, and `SHA256SUMS`. The mapping to controls is the guide's ([Evidence](../../../books/guides/non-person-identity-implementation.md#evidence)), with the KSIs above. The table lists what each holds:

| Stage | Record (and what it covers) | What it proves | Gate | Controls | KSIs |
|---|---|---|---|---|---|
| Both | `PRE-preflight.json` (`runs/PRE/`: results, snapshot, manifest) | Licenses, roles, the deployment identity without a secret, the starting state the rollback restores; in production, PF-11 | All | AC-2, AC-3, AC-5, AC-6, AC-6(5), AU-2, AU-12, CA-7, CM-2, CM-3, CM-3(2), CM-4(2), CM-5, CM-6, CM-8, IA-4, IA-5, IA-5(2), IA-9 | KSI-CMT-LMC, KSI-CMT-VTD, KSI-IAM-ELP, KSI-IAM-JIT, KSI-IAM-SNU, KSI-MLA-EVC, KSI-MLA-LET, KSI-PIY-GIV |
| Both | `S0-change-record-approvals-and-settings-file.json` | The change record and the reviewed settings file's SHA-256 | All | CM-3, CM-5 | KSI-CMT-LMC, KSI-IAM-JIT |
| Both | The VK-NPI `ValidationResults.json` (PF-09) | The baseline before the change | G1–G6 | CA-7, CM-2 | KSI-MLA-EVC |
| Both | `S1.1-inventory-and-owners.json` (`runs/S1.1/`) | Every non-person identity and its owners; SQL Server handed off | G1 | AC-2, CM-8, IA-4; M-22-09 §III.A | KSI-PIY-GIV, KSI-IAM-SNU |
| Both | `S1.2-app-management-policy.json` (policy plan in test, apply in production) | The app management policy reviewed, then applied | G3 | IA-5, CM-3, CM-6; SCuBA MS.AAD.5.5v1 to 5.7v1 (SHOULD) | KSI-IAM-SNU, KSI-CMT-LMC |
| Both | `S1.3-federated-credential-and-managed-identity-parallel-run.json` (`runs/S1.3/`), the conversion file and cutover log under `inputs/` | The pilot's federated credential and managed identity, the parallel run and, in production, the day-31 disable | G5 | IA-5, IA-9, AC-2(3) | KSI-IAM-SNU, KSI-IAM-AAM, KSI-CMT-VTD |
| Both | `S1.5-workload-conditional-access-report-only.json` (`runs/S1.5/`), the scope file under `inputs/` | Workload policies created report-only, assigned directly | G4 | AC-3, AC-6, CM-3(2), CM-4(2) | KSI-IAM-ELP, KSI-CMT-VTD |
| Both | `SMOKE-smoke-test.json` (`runs/SMOKE/`) | Every control worked on objects nobody depends on | G1, G3, G4, G5 | AC-2, AC-3, AC-6, AU-2, AU-12, CA-7, CM-8, IA-4, IA-5, IA-9 | KSI-IAM-ELP, KSI-IAM-SNU, KSI-MLA-EVC, KSI-MLA-LET, KSI-PIY-GIV |
| Test | `ROLLBACK-rollback.json` (`runs/ROLLBACK/`); `evidence-after-rollback/` | The rollback was rehearsed and returned the tenant to its starting state | All | CM-3, CP-10 | KSI-CMT-RMV, KSI-RPL-ABO |
| Production | `S2.3-staged-enable-by-ring.json` (sign-in summaries, enforce runs), the D-NP5 record in the scope file | Each ring enforced only after a reviewed 14-day summary | G4 | AC-6, CM-3, CM-4(2) | KSI-IAM-ELP, KSI-CMT-LMC |
| Production | `S2.5-first-week-drift-monitoring.json` (`runs/S2.5/`) and Chapter 10's packages | No unreviewed change after the deployment | G6 | CA-7, CM-3, AU-6 | KSI-MLA-EVC, KSI-CMT-LMC |
| Both | `SHA256SUMS`, checked by `Test-NpiDeployEvidence.ps1` | Nobody edited the evidence afterwards | All | AU-9 | KSI-MLA-OSM |

AU-6, AU-9, CA-7, CM-3 and CP-10 are the program's reading for the smoke test, the evidence folder, the drift runs and the rollback rehearsal, and every KSI alignment is the program's reading (*Design guidance*); the assessor and the authorizing official decide each control.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Workload ID Premium for workload Conditional Access | Required to create or modify policies scoped to service principals; without it, existing policies keep working but can't be modified | — | GA | [^np11-wid] |
| Workload Conditional Access scope | Single-tenant service principals registered in the tenant; not Microsoft or third-party SaaS, multitenant apps or managed identities; assigned directly, not through a group; Block only; report-only or On; roll back by deleting or disabling | — | GA | [^np11-wid] |
| Update a Conditional Access policy | `PATCH /identity/conditionalAccess/policies/{id}`; `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess`; Security Administrator or Conditional Access Administrator | L4 and L5 | v1.0 | [^np11-ca-update] |
| Report-only results in sign-ins | `reportOnlySuccess`, `reportOnlyFailure`, `reportOnlyNotApplied`, `reportOnlyInterrupted`, returned with `Prefer: include-unknown-enum-members` | — | Beta | [^np11-applied] |
| App management policy roles | Security Administrator and Cloud Application Administrator or Application Administrator (or Global Administrator) | — | GA | [^np11-amp-configure] |
| A restriction on specific applications | A custom policy assigned through `appManagementPolicies/$ref`; admin center: **Application policies** > **Select applications**; no report-only mode documented | — | GA | [^np11-amp-configure] |
| What a policy blocks | Only the create or update that violates it; no token issuance for existing apps; one custom policy per app; a custom policy's restriction overrides the tenant default's | — | v1.0 | [^np11-amp-overview] |
| Update a custom app management policy | `PATCH /policies/appManagementPolicies/{id}`; `Policy.ReadWrite.ApplicationConfiguration`; Cloud Application Administrator or Application Administrator | L4 and L5 | v1.0 | [^np11-amp-update] |
| Add and remove a password | `POST /applications/{id}/addPassword` and `/removePassword`; delegated `Application.ReadWrite.All`; the response's `secretText` can't be retrieved later | L4 and L5 | v1.0 | [^np11-addpassword] [^np11-removepassword] |
| PIM-eligible roles | `GET /roleManagement/directory/roleEligibilityScheduleInstances` with `$filter`; `RoleEligibilitySchedule.Read.Directory` | L4 and L5 | v1.0 | [^np11-eligibility] |
| Built-in role template IDs | Cloud Application Administrator `158c047a-…`, Application Administrator `9b895d92-…`, Conditional Access Administrator `b1be1c3e-…`, Security Administrator `194ae4cb-…` | — | — | [^np11-roles] |
| Service plans | Entra ID P1 `AAD_PREMIUM` `41781fb2-…`, P2 `AAD_PREMIUM_P2` `eec0eb4f-…`; Workload ID `AAD_WRKLDID_P1` and `P2` (Chapter 03) | — | — | [^np11-licensing] |
| KDS root key | Domain controllers wait up to 10 hours; `-EffectiveImmediately` adds a key used at once on the target DC only; a backdated key is for a test environment with one DC; restart the KDC on all DCs if the key is re-created | — | — | [^np11-kds] |
| gMSA | `New-ADServiceAccount`, `Install-ADServiceAccount`, `Test-ADServiceAccount`, `Uninstall-ADServiceAccount`; name unique in the forest; interval set only at creation; Domain Admins or a delegated create right | — | — | [^np11-gmsa] |
| PIM activation path | **ID Governance** > **Privileged Identity Management** > **My roles** > **Microsoft Entra roles** > **Activate** | — | GA | [^np11-pim] |
| App-only Graph sign-in | `Connect-MgGraph -ClientId -TenantId -CertificateThumbprint`; `-Environment` names the cloud | — | GA | [^np11-connect] |
| Azure CLI service principal sign-in | `az login --service-principal --username --certificate <pem> --tenant`; the certificate appended to the private key in the PEM | — | GA | [^np11-az-login] |
| User-assigned identity with the CLI | `az identity create`; `az identity federated-credential create --identity-name --name --resource-group --issuer --subject --audiences` (default `api://AzureADTokenExchange`) | — | GA | [^np11-uami-cli] |
| Token-exchange audience by cloud | `api://AzureADTokenExchange` for the global service, `api://AzureADTokenExchangeUSGov` for Entra ID for US Government | Different | GA | [^np11-mi-trust-app] |
| Azure Login action | `audience` defaults to `api://AzureADTokenExchange` in public clouds; `environment` for Azure Government | `AzureUSGovernment` | GA | [^np11-oidc] |
| Create a user | `New-ADUser -AccountPassword -Enabled -PasswordNeverExpires`; not on a read-only DC | — | — | [^np11-new-aduser] |
| FedRAMP 20x KSIs | 46 indicators in ten themes; the twelve above exist with the names given; related controls include AC-2, AC-6(5) and IA-5(2) for KSI-IAM-SNU, CM-3 and CM-4(2) for KSI-CMT-VTD, CA-7 for KSI-MLA-EVC, AU-9 for KSI-MLA-OSM and CP-10 for KSI-RPL-ABO; changelog last dated October 13, 2026 | — | — | [^np11-ksi] |

Facts carried from earlier chapters, not re-read: the federated credential rules and the `AADSTS70021` propagation delay ([Chapter 05](05-workload-identity-federation-and-managed-identities.md#verified-facts)), the sign-in log's P1 or P2 license ([Chapter 05](05-workload-identity-federation-and-managed-identities.md#verified-facts)), the app management policy create and assign requests ([Chapter 04](04-app-management-policies-and-certificate-rotation.md#verified-facts)), the Workload ID service plan IDs ([Chapter 03](03-the-migration-path-matrix-as-code.md#verified-facts)), and the guide's rollback, evidence and deactivation facts.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A secret in the settings file | It travels with the change record and the evidence | `Read-NpiDeploySettings` refuses secret-like names and values; the identities are named by thumbprint or federated subject |
| The test file run against production, or the reverse | Production changed by a test plan | The file's `environment` must match `-Stage`; every plan carries its tenant ID and refuses another; PF-11 refuses evidence from the production tenant itself |
| A tenant-wide policy on day one | Every app's owners blocked from adding a secret they still need | The pilot policy covers two apps; the tenant-wide policy binds only apps created after its date, and waits for Stage 2 |
| An app management policy assumed to be report-only | It blocks at once | Learn documents no report-only mode; the scope is the safety, and the smoke test probes it on the synthetic app only |
| The probe's secret left behind | A live secret on the synthetic app | Removed at once by key ID, ST-03 fails, and the value is never written; the synthetic holds no permission |
| A workload policy enforced before its sign-ins are read | A production workload blocked | Created report-only; enforced only with `-AllowEnforce`, a D-NP5 record and the reviewed summary's SHA-256; one ring at a time |
| A gMSA used before the KDS root key replicates | The service fails to start on some hosts | The preflight's key check; 10 hours; the backdated key only in a one-DC test forest |
| A rollback nobody has run | It fails when it is needed | Rehearsed in Stage 1 and filed; a go/no-go criterion |
| A rollback plan from an old snapshot | It restores a state that no longer exists | Seven days at most; the snapshot's tenant must match; each policy re-read before it is changed |
| A delete in a rollback | The rollback of the rollback is gone | No DELETE is declared; disable, report-only and restore only |
| Disabled isn't revoked | Tokens already issued keep working | Plan for the token lifetime; for an incident, also remove credentials (the guide's dangers) |
| A beta read relied on for the gate | It changes under you | ST-06 reads beta sign-ins and is labeled so; no gate rests on it alone |
| A GCC High or DoD run with the commercial audience | Every token exchange fails | This runbook covers `gcc` only (research gaps, row 106) |

## Checklist

- [ ] The change record is approved, and its number is in the settings file.
- [ ] The settings file passes `Read-NpiDeploySettings` for its stage, holds no secret, and its SHA-256 is in the preflight manifest.
- [ ] The preflight shows GO; every Warn is understood and recorded.
- [ ] The VK-NPI baseline is filed before any change.
- [ ] The pilot app management policy covers only the pilot and the synthetic app in Stage 1.
- [ ] The pilot's old secret and legacy account stay enabled through the parallel run, and are disabled, never deleted, after it.
- [ ] The gMSA was created at least 10 hours after the KDS root key, and `Test-ADServiceAccount` returned True on the host.
- [ ] Every workload policy was created report-only and assigned directly.
- [ ] The smoke test passed every check, and its expected results were written down before it ran.
- [ ] The rollback was rehearsed in test and filed, and the after-rollback preflight matches the starting state.
- [ ] Every go/no-go criterion is signed before production starts.
- [ ] Production rings were enforced one at a time, each after its 14-day summary and D-NP5.
- [ ] The first week's drift runs show no unreviewed change, and their packages are filed.
- [ ] Every evidence folder checks with `sha256sum -c SHA256SUMS`, and `Test-NpiDeployEvidence.ps1` shows every requirement row present and passing for its stage.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Drift and Evidence for the ISSO](10-drift-and-evidence.md) · [Workbook index](index.md)
:::

[^np11-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026* (46 indicators; each indicator's name and related SP 800-53 controls; changelog entries of June 24 and October 13, 2026), <https://www.fedramp.gov/2026/reference/key-security-indicators/> (accessed Nov 2, 2026).
[^np11-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III.A (Identity: enterprise-managed identities), <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 21, 2026, as verified for the Attribute-Driven Migration guide; carried forward, not re-read).
[^np11-bod2501]: Cybersecurity and Infrastructure Security Agency, BOD 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Oct 21, 2026, as verified for Book 11; carried forward, not re-read). Which SCuBA policies it requires is the implementation guide's evidence table.
[^np11-wid]: Microsoft Learn, "Conditional Access for workload identities," overview (license, scope, direct assignment), implementation, roll back, sign-in logs and finding the object ID, <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> (accessed Nov 2, 2026).
[^np11-amp-configure]: Microsoft Learn, "Configure restrictions on how applications can be configured," prerequisites; enable a restriction for all applications; apply a restriction to a specific application, <https://learn.microsoft.com/entra/identity/enterprise-apps/configure-app-management-policies> (accessed Nov 2, 2026).
[^np11-amp-overview]: Microsoft Learn, "Microsoft Entra application management policies API overview" (v1.0), tenant default policy; app management policy for applications and service principals, <https://learn.microsoft.com/graph/api/resources/applicationauthenticationmethodpolicy?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^np11-amp-update]: Microsoft Learn, "Update appManagementPolicy," national clouds, permissions and roles, <https://learn.microsoft.com/graph/api/appmanagementpolicy-update?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^np11-ca-update]: Microsoft Learn, "Update conditionalaccesspolicy," national clouds, permissions and roles, <https://learn.microsoft.com/graph/api/conditionalaccesspolicy-update?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^np11-applied]: Microsoft Learn, "appliedConditionalAccessPolicy resource type" (beta), `result`, <https://learn.microsoft.com/graph/api/resources/appliedconditionalaccesspolicy?view=graph-rest-beta> (accessed Nov 2, 2026).
[^np11-addpassword]: Microsoft Learn, "application: addPassword," national clouds, permissions, response, <https://learn.microsoft.com/graph/api/application-addpassword?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^np11-removepassword]: Microsoft Learn, "application: removePassword," national clouds and permissions, <https://learn.microsoft.com/graph/api/application-removepassword?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^np11-eligibility]: Microsoft Learn, "List roleEligibilityScheduleInstances," national clouds, permissions, query parameters, <https://learn.microsoft.com/graph/api/rbacapplication-list-roleeligibilityscheduleinstances?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^np11-roles]: Microsoft Learn, "Microsoft Entra built-in roles," all roles (template IDs), <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (accessed Nov 2, 2026).
[^np11-licensing]: Microsoft Learn, "Product names and service plan identifiers for licensing," Entra ID P1 and P2 service plans, <https://learn.microsoft.com/entra/identity/users/licensing-service-plan-reference> (accessed Nov 2, 2026; the Workload ID plans as read for Chapter 03 on Oct 30, 2026).
[^np11-kds]: Microsoft Learn, "Create a Key Distribution Service (KDS) root key," <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key> (accessed Nov 2, 2026).
[^np11-gmsa]: Microsoft Learn, "Manage group Managed Service Accounts," prerequisites; create a gMSA; install and uninstall a gMSA, <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts> (accessed Nov 2, 2026).
[^np11-pim]: Microsoft Learn, "Activate a Microsoft Entra role in PIM," activate a role, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-activate-role> (accessed Nov 2, 2026).
[^np11-connect]: Microsoft Learn, "Connect-MgGraph," app-only access with a certificate thumbprint; `-Environment`, <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph?view=graph-powershell-1.0> (accessed Nov 2, 2026).
[^np11-az-login]: Microsoft Learn, "Sign into Azure with a service principal using the Azure CLI," <https://learn.microsoft.com/cli/azure/authenticate-azure-cli-service-principal> (accessed Nov 2, 2026).
[^np11-uami-cli]: Microsoft Learn, "az identity federated-credential" (Azure CLI reference), create, <https://learn.microsoft.com/cli/azure/identity/federated-credential>, and "Configure a user-assigned managed identity to trust an external identity provider," Azure CLI, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity> (both accessed Nov 2, 2026).
[^np11-mi-trust-app]: Microsoft Learn, "Configure an application to trust a managed identity," configure a federated identity credential on an application (audience values by cloud), <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-config-app-trust-managed-identity> (accessed Nov 2, 2026).
[^np11-oidc]: Microsoft Learn, "Use the Azure Login action with OpenID Connect," prerequisites; set up the Azure Login action; Azure Government clouds, <https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect> (accessed Nov 2, 2026).
[^np11-new-aduser]: Microsoft Learn, "New-ADUser," syntax, parameters and notes, <https://learn.microsoft.com/powershell/module/activedirectory/new-aduser> (accessed Nov 2, 2026).
[^np11-amp-post]: Microsoft Learn, "Create appManagementPolicy," permissions, request body, response and example, <https://learn.microsoft.com/graph/api/appmanagementpolicy-post?view=graph-rest-1.0> (accessed Oct 30, 2026, read for Chapter 04; carried forward, not re-read).
