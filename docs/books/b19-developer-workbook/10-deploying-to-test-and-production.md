---
title: "Chapter 10 — Deploying to Test and Production"
description: "The runbook that takes the Attribute-Driven Migration kits past the chapters' test-tenant steps: one settings file per stage with no secrets, pre-flight checks, a live test stage in an Entra test tenant, an Azure test subscription with Arc-enabled test servers and a test AD forest, a go/no-go record, then production in waves, with a smoke test, first-week drift monitoring, rollback and the evidence the ISSO keeps at each stage. Every step is a command block or an exact admin center path, tied to the implementation guide's gate it fulfils."
doc-type: workbook-chapter
audience: [Technical]
family: b19-developer-workbook
book: B19
part: How
series-order: 10
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: approved
reviewed-sha256: 937c26506f832f840f376e132449a875d577ccca58acde11aa6be4ad66781a75
last-reviewed: 2026-11-09
---
# Chapter 10 — Deploying to Test and Production

*A lab proves the code. A runbook proves the change: the same commands, against a test environment and then production, with the evidence and the way back written down before anyone starts.*

::: {.callout-note}
## In this chapter
The deployment runbook for everything Chapters 01 to 09 build. Each chapter ends with a short step in a test tenant. This chapter takes the kits from there to a **live test stage** (an Entra test tenant, an Azure test subscription with Arc-enabled test servers, and a test AD forest) and then to **production**. One settings file per stage holds every value the commands read, and no secrets: the same commands run against both stages. Five small scripts in `examples/drift-pipeline/deploy` do what the kits didn't: a pre-flight check, a smoke test that says go or no-go, a rollback that records each change and writes its undo, newest first, and an evidence record for every step that names the federal requirements and FedRAMP 20x Key Security Indicators it supports. Each step names the [implementation guide](../guides/attribute-driven-migration-implementation.md) gate it fulfils.
:::

::: {.callout-important}
## Status: approved, not run against a live tenant
The owner approved this page on November 3, 2026. **Nobody has run this runbook against a live tenant, subscription or forest.** The five deploy scripts are tested against fixtures and a fake command runner (46 tests), and their dry-run output below is real, from November 2, 2026. Every other command comes from the kits' own chapters, the kits' code or Microsoft Learn, and the results given after each step are **expectations**, not observations. Run the test stage in full, and keep its evidence, before any step touches production.
:::

## Goal and audience

**Goal.** By the end of this chapter you can deploy the Attribute-Driven Migration's software to a test environment and then to production without working anything out on the day: each step is a command block to paste or an admin center path to follow, each change is recorded with its rollback, and the ISSO receives the evidence for each stage. You can say for each step which gate in the implementation guide it serves.

**Audience.** The platform engineers and identity engineers who run the change, the change manager who schedules it, and the ISSO who keeps its evidence. You should have run the earlier chapters' fixture labs and test-tenant steps; this chapter doesn't teach the kits again.

## What this runbook adds to the chapters

Every chapter's test-tenant step changes the smallest thing it can, by hand, and backs it out. That proves one kit in isolation. A deployment is different in four ways, and this runbook handles each one.

| A chapter's test-tenant step | This runbook |
|---|---|
| One kit at a time, values typed into the commands | All nine kits in a safe order; every value comes from one settings file per stage |
| Signs in however is convenient in a test tenant | Three identities with a certificate each (the drift pipeline with a federated credential), least privilege per step, one named delegated step where Learn allows nothing else |
| Backs out what it made, then stops | Records every change as it is made, and writes the rollback from the record, newest first |
| Ends in the test tenant | A go/no-go record that production's pre-flight check verifies, then production in waves, then a week of drift monitoring |

The order is the guide's: prove the attributes before anything trusts them, build groups and workflows disabled or paused, target by attribute, cut over by wave, then keep the attributes true ([the path on one page](../guides/attribute-driven-migration-implementation.md#the-path-on-one-page)). The [step-to-gate map](#step-to-gate-map) at the end lists every step against its gate.

## Requirements, KSIs and evidence {#requirements-ksis-and-evidence}

Every step below has a requirements table: the requirement it supports, what the step does, the Key Security Indicator it aligns to, and the evidence the ISSO keeps. The requirements are NIST SP 800-53 Rev. 5 controls at the system's baseline,[^c10-sp80053] Moderate for the guide's audience, a civilian agency at FedRAMP Moderate in Microsoft 365 GCC ([guide, how to use it](../guides/attribute-driven-migration-implementation.md#how-to-use-this-guide)); OMB M-22-09[^c10-m2209] and CISA BOD 25-01's required SCuBA configurations[^c10-bod2501] where a step touches them; and FedRAMP's rules for an agency's use of an authorized cloud service.[^c10-fedramp-agency] GCC's FedRAMP Moderate authorization is the provider's, which the agency's own authorization relies on.[^c10-gcc]

**What the KSI column means.** Key Security Indicators are FedRAMP 20x indicators for **cloud service providers**, each with its related SP 800-53 controls.[^c10-ksi] The agency authorizes its own system. It lines its evidence up with what its providers report against the KSIs; it doesn't report KSIs itself ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). The KSI IDs in the tables are the ones this workbook already maps to the same controls: [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md), which reads FedRAMP's related-control lists, [Book 13, Chapter 04](../b13-governance/04-change-control-and-provenance.md), [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) and [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md). No new KSI ID is introduced here.

**The evidence is produced, not only named.** The rows live in [`deploy/requirements.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/drift-pipeline/deploy/requirements.json), and `evidence.py table` prints the tables below from it. Each step leaves an **evidence record** in the stage's `evidence/` folder: a JSON file with the time, the stage, the change record, the command, the result, the SHA-256 of each file it cites, and the controls, mandates and KSI IDs of the step's rows. `preflight.py`, `smoke_test.py` and `rollback.py` write theirs; the other steps end with an `evidence.py add` command. Each write refreshes `evidence/SHA256SUMS`, in the format `sha256sum -c` reads, as the drift pipeline's packager does ([Chapter 09](09-drift-pipelines-and-evidence.md#the-evidence-package)). `evidence.py check` then says whether every row of the stage has a passing record whose files still match, and production's pre-flight check refuses to promote without a passing check from the test stage.

## Placeholders {#placeholders}

The commands in this chapter contain only these placeholders. Everything else comes from the settings file.

| Placeholder | What to put there |
|---|---|
| `<settings-file>` | The path to this stage's settings file: `test.json` in the test stage, `production.json` in production ([below](#one-environment-settings-file)) |
| `<wave-id>` | Production only: the `id` of the wave you're deploying, from the `waves` list in `production.json` |
| `<test-settings-file>` | Production only: the path to the test stage's `test.json` |
| `<test-evidence-dir>` | Production only: the test stage's evidence folder, the value `ADM_EVIDENCE_DIR` had in the test stage |

The settings file itself starts from a template whose values are all placeholders; the [settings section](#one-environment-settings-file) lists them.

## Before you start {#before-you-start}

*Fulfils the guide's [prerequisites](../guides/attribute-driven-migration-implementation.md#prerequisites).*

### Roles

The guide names one decider per decision ([prerequisites](../guides/attribute-driven-migration-implementation.md#prerequisites)). The runbook adds the people who run it.

| Role | In this runbook |
|---|---|
| Change manager | Opens the change record for each stage, schedules the window, and closes the record with the evidence attached |
| Identity engineering lead | Runs the Entra, Graph and HR steps; decides each wave's go or no-go (guide: identity engineering) |
| Groups Administrator (a named person) | Signs in for the one delegated step, rule validation, because Learn lists no application permission for it[^c10-evaluate] |
| Owner of the reader app, or an Application Administrator (a named person) | Adds the drift pipeline's federated credential in step 8; the deploy identity holds no application permission for it |
| Lifecycle Workflows Administrator | Creates the workflow in the admin center and runs it on demand[^c10-lcw-create][^c10-lcw-activate] |
| Domain administrator in the AD forest | Imports and links the GPOs; Learn says linking needs Link GPOs permission, which by default only domain and enterprise administrators hold[^c10-newgplink] |
| Platform engineer | Runs the Azure, machine configuration, Ansible and pipeline steps |
| CISO | Approves promotion to production with identity engineering (guide: CISO decides the control requirements and every drift finding) |
| ISSO | Receives each stage's evidence package and keeps it |

### Approvals and the change record

Each stage has its own change record; its ID goes in the settings file as `change_record`, and every recorded change and every piece of evidence carries it. The test stage needs the change manager's approval of the window. Production needs the CISO's and identity engineering's approvals, recorded by reference in `production.json` (`promotion.approvals`), and the pre-flight check refuses to pass without both (*design guidance*: the guide makes the CISO the gate owner of Gates 2 and 5 to 9, and identity engineering the decider of each wave's go or no-go).

### Made before the runbook starts

These exist before the first command, and their IDs go into the settings file. Each is made the way its chapter shows; the runbook only reads them.

| Object | Made with | Settings key |
|---|---|---|
| Three app registrations, each with a certificate and no client secret: **deploy**, **reader** and **provisioning** | The certificate goes in the operator's protected store (PEM with the key for the Azure CLI, the certificate store for PowerShell). Learn recommends certificate-based authentication for service principals[^c10-azcli-cert] | `identities.*` |
| The API-driven inbound provisioning app, its schema and mappings | [Chapter 01, test-tenant steps 1 to 3](01-the-hr-to-entra-middleware.md#lab-2-test-tenant) | `hcm_entra.*` |
| The custom task extension and its Logic App | [Chapter 05, test-tenant steps 1 to 3](05-lifecycle-workflows-custom-extensions.md#lab-2-test-tenant) | `lifecycle.extension_id` |
| Test users that stand for the rule library's fixture members, and the map of their object IDs (the `$memberIds` table in that step) | [Chapter 04, test-tenant step 3](04-dynamic-rules-as-code.md#lab-2-test-tenant) | `dynamic_rules.member_map` |
| The validation kit's inputs: exceptions, governed and emergency-access groups, shadow pairs, rule tests | The kit's README, as the guide's gates describe | `validation_inputs` |
| A GPO backup of the GPOs moving to Intune, and a test OU in the test forest | `Backup-GPO` in the source forest; the OU by hand | `group_policy.*` |
| A disposable Arc test server (Windows, for the machine configuration package) and a Linux test server, both in the CMDB export | [Chapter 07](07-machine-configuration-packages.md#lab-2-test-subscription-and-a-disposable-server) and [Chapter 08](08-ansible-beside-arc.md) | `machine_configuration.arc_server_name`, `ansible.cmdb_csv` |
| The Ansible control node, an Azure VM or Arc-enabled server with a managed identity | [Chapter 08](08-ansible-beside-arc.md) | — |
| A private repository for the drift pipeline, holding the validation kit and `examples/drift-pipeline` | [Chapter 09, test-tenant step 4](09-drift-pipelines-and-evidence.md#lab-2-test-tenant-and-test-subscription) | `drift.*` |

### The identities and what each may do

*Design guidance:* one identity that can do everything is one credential that can break everything. The runbook uses three, and the person in the delegated step.

| Identity | Signs in with | Granted | Used in |
|---|---|---|---|
| deploy | Certificate | Graph application permissions: `LifecycleWorkflows-Workflow.ReadWrite.All` and `LifecycleWorkflows-Workflow.Activate`,[^c10-lcw-activate][^c10-lcw-create] `DeviceManagementConfiguration.ReadWrite.All` (Chapter 06), `Synchronization.ReadWrite.All` to pause the provisioning job;[^c10-pause] Azure: Resource Policy Contributor on the stage's resource group (Learn's recommended role for policy definitions),[^c10-mc-policy] Storage Blob Data Contributor on the package container, and the right to assign roles to the policy's identity on the resource group | Stage steps that change Entra, Intune and Azure |
| reader | Certificate | The validation kit's read permissions (`Get-VkRequiredScope` prints them; [Chapter 03](03-writing-a-validation-kit-check.md)), `Policy.Read.All` for the Conditional Access export, `AuditLog.Read.All` and `Directory.Read.All` for the provisioning logs,[^c10-provlogs] Reader on the subscription | Baselines, reconciliation, smoke tests |
| provisioning | Certificate | `SynchronizationData-User.Upload` only, or `.OwnedBy` if it owns the provisioning app[^c10-bulkupload] | The HR batches |
| Groups Administrator | Their own sign-in, delegated | `Group.ReadWrite.All` and `User.Read.All` for the session | Creating and validating the dynamic groups |
| App owner or Application Administrator | Their own sign-in, delegated | Ownership of the reader app, or the Application Administrator role | Adding the drift pipeline's federated credential (step 8) |
| The drift pipeline's app | Federated credential, no secret | As [Chapter 09](09-drift-pipelines-and-evidence.md) | The scheduled pipeline |

## One environment settings file {#one-environment-settings-file}

*Supports every gate: it is how the same commands run against both stages.*

Copy the template once per stage, fill it in, and keep the filled-in files with the change record, outside the repository. The template is [`examples/drift-pipeline/deploy/environment.example.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/drift-pipeline/deploy/environment.example.json); every value in it is a placeholder.

| Key | Placeholder in the template | What it holds |
|---|---|---|
| `environment` | `<test-or-production>` | `test` or `production` |
| `cloud` | `<cloud>` | `gcc`, `gcchigh` or `dod`. The guide's audience is usually Microsoft 365 GCC, where Entra ID runs in Microsoft's commercial cloud, so most production files say `gcc` |
| `tenant_id`, `tenant_domain`, `subscription_id`, `location`, `resource_group` | `<tenant-id>`, `<tenant-domain>`, `<subscription-id>`, `<azure-region>`, `<resource-group>` | The stage's tenant, subscription, region and resource group |
| `change_record` | `<change-record-id>` | The stage's change record ID |
| `evidence_dir` | `<evidence-folder>` | Where the stage's evidence goes; the runbook writes under `<evidence_dir>/<environment>/<change_record>` |
| `validation_inputs` | `<validation-inputs-folder>` | The validation kit's input folder |
| `identities.deploy` | `<deploy-app-id>`, `<deploy-cert-thumbprint>`, `<deploy-cert-pem-path>` | The deploy identity's client ID, certificate thumbprint and PEM path |
| `identities.reader` | `<reader-app-id>`, `<reader-cert-thumbprint>` | The reader identity |
| `identities.provisioning` | `<provisioning-app-id>`, `<provisioning-cert-pem-path>` | The HR sender |
| `hcm_entra` | `<provisioning-sp-object-id>`, `<provisioning-job-id>`, `<provisioning-api-endpoint>`, `<hr-extract-path>` | The provisioning app's service principal object ID, its job ID and **Provisioning API Endpoint**, the HR extract; `max_quarantined` (default 0) |
| `dynamic_rules` | `<groups-admin-upn>`, `<member-map-path>` | The Groups Administrator who signs in; the map from fixture member names (`u01`…) to test object IDs |
| `lifecycle` | `<custom-task-extension-id>`, `<leaver-workflow-name>`, `<lcw-test-user-object-id>` | The extension, the name you'll give the workflow, and one test user to run it on |
| `group_policy` | `<ad-domain>`, `<target-ou-dn>`, `<gpo-backup-folder>`, `<gpo-name>`, `<intune-target-group-id>` | The AD domain, the OU (the test OU in the test stage), the GPO backup folder and names, the Intune target group |
| `machine_configuration` | `<mc-storage-account>`, `<mc-container>`, `<arc-server-name>` | Where the package is published, and the Arc test server |
| `ansible` | `<cmdb-export-path>` | The CMDB export the control node reads; `onboarding_wave` (default 0) |
| `drift` | `<github-org>/<github-repo>`, `<github-environment>`, `<evidence-storage-account>`, `<evidence-container>` | The pipeline's repository and environment, and the evidence container |
| `smoke` | — | The validation kit checks that must pass, and those allowed to end unverified: only VK-DG-03, which is delegated only, a documented exception checked by hand at the first live run ([step 9b](#step-9-smoke-test)) |
| `waves`, `promotion` | — | Production only: one entry per wave (OU, Intune group, Arc wave), and the go/no-go record |

**No secrets, by construction.** The loader refuses a key whose name looks like a secret (`secret`, `password`, `token`, `credential`, `private`, `connection_string`, `sas`, and so on) and a value that looks like one (a PEM private key, an account key, a SAS signature), and it refuses any placeholder left unfilled. A certificate path inside the repository fails the pre-flight check. The identities sign in with certificates; Learn says the Azure CLI reads a PEM file with the private key and certificate together, and Azure PowerShell reads the certificate from the local store by thumbprint.[^c10-azcli-cert][^c10-azps-cert]

### Load the settings

Run from the root of your clone of this repository, in the shell the step uses. Do it once per shell, and again after you change shells.

In PowerShell 7:

```powershell
python ./examples/drift-pipeline/deploy/adm_deploy.py env --settings <settings-file> --shell pwsh | Out-String | Invoke-Expression
New-Item -ItemType Directory -Force -Path $env:ADM_EVIDENCE_DIR | Out-Null
```

In a POSIX shell (Git Bash on Windows, or the Linux control node):

```bash
export MSYS_NO_PATHCONV=1
eval "$(python ./examples/drift-pipeline/deploy/adm_deploy.py env --settings <settings-file> --shell bash)"
mkdir -p "$ADM_EVIDENCE_DIR"
```

`MSYS_NO_PATHCONV=1` stops Git Bash from rewriting arguments that start with `/`, such as Azure resource IDs; on Linux it does nothing. In production, add `--wave <wave-id>` to the `env` command for the wave steps. The command prints `ADM_*` variables, including values derived from the cloud: the Graph host, the Azure environment, the Graph PowerShell environment, the blob host and the Arc onboarding playbook. Learn lists a different Graph host for GCC High and DoD, and a different storage suffix in Azure Government.[^c10-graph-clouds][^c10-storage-suffix]

**The machine configuration version.** The package version isn't in the settings file. Steps 9 and 10 read it from `ADM_MC_VERSION`, the version of the build that carries the stage's final mode. Set it once per shell, after the settings are loaded. In the test stage it is `1.1.0`, the apply build of [step 6d](#step-6-machine-configuration-audit-before-apply). In production it is the version in [the production list](#stage-2-production), which must be higher than the registry's `published` value, because the build refuses a version that isn't ([Chapter 07](07-machine-configuration-packages.md)).

```powershell
$env:ADM_MC_VERSION = '1.1.0'   # test stage; production: the version in the Stage 2 list
```

```bash
export ADM_MC_VERSION=1.1.0     # test stage; production: the version in the Stage 2 list
```

A settings file that still holds placeholders is refused. This is the template, on November 2, 2026:

```text
refused: environment.example.json: 41 problem(s): environment is '<test-or-production>'; expected test or production; unknown cloud '<cloud>'; expected one of gcc, gcchigh, dod; 'environment' still holds the placeholder <test-or-production>; 'cloud' still holds the placeholder <cloud>; and 37 more
```

### Sign in

The stage steps say which sign-in they need. In PowerShell 7, for the deploy identity:[^c10-mggraph][^c10-azps-cert][^c10-azcli-cert]

```powershell
Connect-MgGraph -ClientId $env:ADM_DEPLOY_CLIENT_ID -TenantId $env:ADM_TENANT_ID -CertificateThumbprint $env:ADM_DEPLOY_CERT_THUMBPRINT -Environment $env:ADM_MG_ENV -NoWelcome
Connect-AzAccount -ServicePrincipal -ApplicationId $env:ADM_DEPLOY_CLIENT_ID -Tenant $env:ADM_TENANT_ID -CertificateThumbprint $env:ADM_DEPLOY_CERT_THUMBPRINT -Environment $env:ADM_AZ_CLOUD -Subscription $env:ADM_SUBSCRIPTION_ID | Out-Null
az cloud set --name $env:ADM_AZ_CLOUD
az login --service-principal --username $env:ADM_DEPLOY_CLIENT_ID --certificate $env:ADM_DEPLOY_CERT_PEM --tenant $env:ADM_TENANT_ID --output none
az account set --subscription $env:ADM_SUBSCRIPTION_ID
```

For the reader identity, in PowerShell 7:

```powershell
Connect-MgGraph -ClientId $env:ADM_READER_CLIENT_ID -TenantId $env:ADM_TENANT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT -Environment $env:ADM_MG_ENV -NoWelcome
```

**Expect** `Connect-MgGraph` to sign in without a prompt, and `Get-MgContext` to show `AuthType` `AppOnly`, as Learn's app-only page describes.[^c10-mggraph]

## Try the scripts against fixtures first

The deploy scripts run on a laptop against the kits' fixtures, with no tenant. Do this once before the test stage, to see what each one prints. Work in `examples/drift-pipeline`, in a POSIX shell.

```bash
python deploy/preflight.py --settings deploy/tests/fixtures/test.json --other deploy/tests/fixtures/production.json
```

Dry-run output, November 2, 2026:

```text
PASS PF-01  settings schema adm-deploy-settings/1, environment test
PASS PF-02  no secret in the settings file
PASS PF-03  no placeholder left
PASS PF-04  cloud gcc: Graph https://graph.microsoft.com, Azure AzureCloud, Graph PowerShell Global, Arc playbook playbooks/06_arc_onboarding_role.yml
PASS PF-05  certificate files are PEM paths outside the repository
PASS PF-06  9 kits present
PASS PF-07  machine configuration TlsServerProtocols: registry mode Audit, policy ID ca593085-dfcb-425d-ac9c-12870a55bbaa, published 0.0.0
PASS PF-08  Lifecycle Workflows integrations in the registry: cms-revocation
PASS PF-09  test and production use different tenants, subscriptions and identities
PASS PF-10  test stage: no promotion record needed
DRY  PF-16  would check that the deploy certificate file exists: /etc/adm/certs/adm-deploy-test.pem
DRY  PF-16  would check that the provisioning certificate file exists: /etc/adm/certs/adm-provisioning-test.pem
DRY  PF-11  would run: az cloud show --query name -o tsv  (expect AzureCloud)
DRY  PF-12  would run: az account show --query tenantId -o tsv  (expect 11111111-1111-4111-8111-111111111111)
DRY  PF-13  would run: az account show --query id -o tsv  (expect 22222222-2222-4222-8222-222222222201)
DRY  PF-14  would run: az account show --query user.name -o tsv  (expect 33333333-3333-4333-8333-333333333301)
DRY  PF-15  would run: pwsh -NoProfile -Command $m = @('Microsoft.Graph.Authentication','Az.Accounts','Az.Resources','Az.Storage','GuestConfiguration','GroupPolicy') | Where-Object { -not (Get-Module -ListAvailable -Name $_) }; if ($m) { 'missing: ' + ($m -join ', '); exit 1 } else { 'all present' }
preflight: 0 failed, 0 warning(s); dry run (nothing signed in, nothing called)
evidence 001-preflight.json: preflight pass
```

Record four changes the way the stage steps do, then write the rollback:

```bash
S=deploy/tests/fixtures/test.json
python deploy/rollback.py add --settings $S --kind provisioning-job --id API2AAD.00000000000000000000000000000000.44444444-4444-4444-8444-444444444401
python deploy/rollback.py add --settings $S --kind dynamic-group --id 88888888-8888-4888-8888-888888888801 --name "FIN ledger employees"
python deploy/rollback.py add --settings $S --kind gpo-link-created --id FMP-Workstation-Baseline --name "OU=ADM-Test,DC=test,DC=contoso,DC=example"
python deploy/rollback.py add --settings $S --kind policy-assignment --id adm-mc-tls-audit --name /subscriptions/22222222-2222-4222-8222-222222222201/resourceGroups/rg-adm-test
python deploy/rollback.py plan --settings $S
```

Dry-run output, November 2, 2026. Each `add` also writes an evidence record for its step:

```text
recorded provisioning-job API2AAD.00000000000000000000000000000000.44444444-4444-4444-8444-444444444401 in out/deploy-evidence/test/CHG-TEST-0101/deploy-record.json; evidence 002-hr.json
recorded dynamic-group 88888888-8888-4888-8888-888888888801 in out/deploy-evidence/test/CHG-TEST-0101/deploy-record.json; evidence 003-rules.json
recorded gpo-link-created FMP-Workstation-Baseline in out/deploy-evidence/test/CHG-TEST-0101/deploy-record.json; evidence 004-gpo.json
recorded policy-assignment adm-mc-tls-audit in out/deploy-evidence/test/CHG-TEST-0101/deploy-record.json; evidence 005-mc.json
[4] policy-assignment  cloud  Remove-AzPolicyAssignment -Name 'adm-mc-tls-audit' -Scope '/subscriptions/22222222-2222-4222-8222-222222222201/resourceGroups/rg-adm-test'
[3] gpo-link-created   ad     Set-GPLink -Name 'FMP-Workstation-Baseline' -Target 'OU=ADM-Test,DC=test,DC=contoso,DC=example' -LinkEnabled No -Domain 'test.contoso.example'
[2] dynamic-group      cloud  Remove-MgGroup -GroupId '88888888-8888-4888-8888-888888888801'
[1] provisioning-job   cloud  Invoke-MgGraphRequest -Method POST -Uri '/v1.0/servicePrincipals/44444444-4444-4444-8444-444444444401/synchronization/jobs/API2AAD.00000000000000000000000000000000.44444444-4444-4444-8444-444444444401/pause'
rollback plan: 4 step(s), newest first: 3 cloud, 1 ad
wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-cloud.ps1
wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-ad.ps1
wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-manual.md
evidence 006-rollback.json: rollback plan recorded
nothing was run: review the scripts, then run them in a signed-in session
```

Then the smoke test, on the fixture validation kit run and the other kits' fixture provenance:

```bash
E=out/deploy-evidence/test/CHG-TEST-0101
python deploy/smoke_test.py --settings $S --fixture --kit-run tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture \
  --hcm-provenance tests/fixtures/provenance/hcm-entra/provenance.json --dynamic-rules tests/fixtures/provenance/dynamic-rules/check-results.json \
  --mc-provenance tests/fixtures/provenance/machine-configuration/provenance.json --mc-mode Audit --deploy-record $E/deploy-record.json --out $E/smoke
```

Dry-run output, November 2, 2026 (the last line's hash changes with each run, because the report records when it ran):

```text
PASS SM-01  kit run 2026-10-29-0617-fixture-runner-fixture matches its own manifest (read-only)
PASS SM-02  fixture mode: run mode Fixture, tenant not compared
PASS SM-04  run cloud gcc; settings gcc
FAIL SM-05  VK-HR-01 Fail (2 finding(s))
FAIL SM-05  VK-DG-01 Fail (2 finding(s))
FAIL SM-05  VK-CA-01 Fail (1 finding(s))
FAIL SM-06  checks that ended in Error: VK-NPI-03
PASS SM-07  run not held by the mass-disable guard
FAIL SM-08  9 ready, 9 quarantined (limit 0)
PASS SM-09  rule library: 6 rules, 0 finding(s)
PASS SM-10  machine configuration TlsServerProtocols 1.0.0: 0 finding(s)
PASS SM-11  package mode Audit; this stage expects Audit
PASS SM-12  4 change(s) recorded for test/CHG-TEST-0101
PASS SM-13  every change has a rollback
evidence 007-smoke.json: smoke fail, controls CA-7, CM-4(2)
smoke test: NO-GO (5 failed) for test/CHG-TEST-0101, fixture mode; report sha256 201dee948dca0468582c6c63813cc7cb141e6a08c6cb78890e1909117f5759f6
```

The fixtures carry findings on purpose, so the answer is no-go and the exit code is `2`. The smoke test's own evidence record says so; this is it:

```text
{
  "schema": "adm-evidence-record/1",
  "seq": 7,
  "step": "smoke",
  "environment": "test",
  "change_record": "CHG-TEST-0101",
  "tenant_id": "11111111-1111-4111-8111-111111111111",
  "cloud": "gcc",
  "recorded_at": "2026-11-02T12:26:03Z",
  "command": "smoke_test.py --settings deploy/tests/fixtures/test.json --fixture --kit-run tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture --hcm-provenance tests/fixtures/provenance/hcm-entra/provenance.json --dynamic-rules tests/fixtures/provenance/dynamic-rules/check-results.json --mc-provenance tests/fixtures/provenance/machine-configuration/provenance.json --mc-mode Audit --deploy-record out/deploy-evidence/test/CHG-TEST-0101/deploy-record.json --out out/deploy-evidence/test/CHG-TEST-0101/smoke",
  "result": "fail",
  "requirements": [
    "R-SM-1"
  ],
  "controls": [
    "CA-7",
    "CM-4(2)"
  ],
  "ksis": [
    "KSI-CMT-LMC",
    "KSI-CMT-VTD",
    "KSI-MLA-EVC"
  ],
  "mandates": [],
  "files": [
    {
      "path": "smoke/smoke-report.json",
      "name": "smoke-report.json",
      "sha256": "201dee948dca0468582c6c63813cc7cb141e6a08c6cb78890e1909117f5759f6"
    }
  ],
  "details": {
    "fixture": true,
    "failed": 5
  }
}
```

Now check the stage's evidence against the requirement rows, and let `sha256sum` confirm the records:

```bash
python deploy/evidence.py check --settings $S
(cd $E/evidence && sha256sum -c SHA256SUMS)
```

Dry-run output, November 2, 2026 (exit `2`):

```text
OK   R-PF-1   preflight  KSI-CMT-VTD, KSI-CMT-LMC                 001-preflight.json
OK   R-PF-2   preflight  KSI-IAM-SNU, KSI-IAM-ELP                 001-preflight.json
MISS R-BL-1   baseline   KSI-CMT-RMV, KSI-MLA-EVC, KSI-SVC-ACM    -  (no evidence record for this step)
MISS R-BL-2   baseline   KSI-IAM-ELP                              -  (no evidence record for this step)
MISS R-HR-1   hr         KSI-IAM-AAM                              002-hr.json  (only 'recorded' entries: the step has no passing record)
MISS R-HR-2   hr         KSI-CMT-VTD, KSI-PIY-GIV                 002-hr.json  (only 'recorded' entries: the step has no passing record)
MISS R-DG-1   rules      KSI-IAM-AAM, KSI-IAM-ELP, KSI-CMT-VTD    003-rules.json  (only 'recorded' entries: the step has no passing record)
MISS R-LCW-1  lcw        KSI-IAM-AAM                              -  (no evidence record for this step)
MISS R-GPO-1  gpo        KSI-CMT-LMC, KSI-CMT-RMV, KSI-SVC-ACM    004-gpo.json  (only 'recorded' entries: the step has no passing record)
MISS R-GPO-2  gpo        KSI-PIY-GIV                              004-gpo.json  (only 'recorded' entries: the step has no passing record)
MISS R-MC-1   mc         KSI-CMT-RMV, KSI-SVC-ACM, KSI-MLA-EVC    005-mc.json  (only 'recorded' entries: the step has no passing record)
MISS R-MC-2   mc         KSI-SVC-VRI                              005-mc.json  (only 'recorded' entries: the step has no passing record)
MISS R-ARC-1  arc        KSI-PIY-GIV, KSI-IAM-ELP, KSI-CMT-VTD    -  (no evidence record for this step)
MISS R-DR-1   drift      KSI-MLA-EVC, KSI-MLA-LET, KSI-IAM-SNU    -  (no evidence record for this step)
MISS R-SM-1   smoke      KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC    007-smoke.json  (the latest pass/fail record (007-smoke.json) failed; a record came from fixture mode, which proves nothing about the stage)
MISS R-EV-1   package    KSI-MLA-OSM, KSI-SVC-VRI                 -  (no evidence record for this step)
MISS R-RB-1   rollback   KSI-CMT-LMC, KSI-CMT-RVP                 006-rollback.json  (only 'recorded' entries: the step has no passing record)
evidence check: 2 of 17 requirement rows evidenced for test/CHG-TEST-0101; FAIL; evidence-check.json sha256 58c6f757cb292b3b5c78974f872445dc8ace10ac154e531e5e0b71b728d1ec1e
001-preflight.json: OK
002-hr.json: OK
003-rules.json: OK
004-gpo.json: OK
005-mc.json: OK
006-rollback.json: OK
007-smoke.json: OK
```

Only the pre-flight rows have a passing record: the `rollback.py add` entries are `recorded`, which proves a change was written down, not that the step worked, and the smoke record is a failing fixture run. Now ask production's pre-flight check to promote on that report and that check:

```bash
python deploy/preflight.py --settings deploy/tests/fixtures/production.json --other $S --test-smoke-report $E/smoke/smoke-report.json --test-evidence-check $E/evidence-check.json
```

Dry-run output, November 2, 2026, from `PF-09` on:

```text
PASS PF-09  production and test use different tenants, subscriptions and identities
FAIL PF-10  the test smoke report's SHA-256 isn't the one in promotion.test_smoke_report_sha256; the test smoke report is test/fail, not test/pass; the test smoke report ran in fixture mode; promotion needs a live test run; the test evidence check's SHA-256 isn't the one in promotion.test_evidence_check_sha256; the test evidence check is test/fail: 15 requirement row(s) without passing evidence
SKIP PF-11  live probes not run: fix the failures above first
preflight: 1 failed, 0 warning(s); dry run (nothing signed in, nothing called)
evidence 001-preflight.json: preflight fail
```

A fixture report, or a stage with requirement rows unevidenced, can never promote. Last, the tests:

```bash
python -m pytest deploy/tests -q
```

`46 passed` on November 2, 2026 (Windows 11, Python 3.14.3). The deploy scripts keep their own suite, apart from the 142 tests Chapter 09 runs.

## Pre-flight checks {#pre-flight-checks}

*Fulfils the guide's [prerequisites](../guides/attribute-driven-migration-implementation.md#prerequisites): the tools, the identities and the cloud are the ones the change record names.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3(2) Testing, Validation, and Documentation of Changes | Checks the settings, kits, identities and cloud before any change, dry and live | KSI-CMT-VTD, KSI-CMT-LMC | preflight.json (dry and live); the preflight evidence record |
| IA-5 for non-user accounts; AC-6 Least Privilege | Refuses secrets in the settings file; three certificate identities with only what each step needs | KSI-IAM-SNU, KSI-IAM-ELP | preflight.json rows PF-02 and PF-05; the identities' permission grants in the change record |

: Requirements, KSIs and evidence for this step {.striped .hover}

Load the settings and sign in as the deploy identity ([above](#sign-in)), then, in PowerShell 7:

```powershell
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --out $env:ADM_EVIDENCE_DIR
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --live --out "$env:ADM_EVIDENCE_DIR/live"
```

Each run writes its own evidence record (`evidence NNN-preflight.json: preflight pass`). **Expected:** the first run passes `PF-01` to `PF-10` and prints the live probes as `DRY`. The second runs them: the Azure CLI's cloud, tenant, subscription and signed-in identity (`user.name` is the deploy identity's client ID) match the settings, the PowerShell modules are present, and both certificate files exist. Any `FAIL` stops the stage. In production the command also takes `--other`, `--test-smoke-report` and `--test-evidence-check` ([Stage 2](#stage-2-production)).

## Stage 1: live test {#stage-1-live-test}

The test stage deploys every component to the test tenant, the test subscription and the test forest, in an order where nothing grants access before it has been checked. Load `test.json`. Record every change with `rollback.py add` as the step shows: the rollback is only as complete as the record.

| Order | Component | Starts | Guide gate |
|---|---|---|---|
| 1 | Baseline evidence | Read only | [2](../guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), [5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) |
| 2 | HR-to-Entra middleware | Dry run, then five records | [2](../guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), [3](../guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) |
| 3 | Dynamic rules | Created paused, validated, then on | [4](../guides/attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units) |
| 4 | Lifecycle Workflows | Created disabled; one on-demand run | [7](../guides/attribute-driven-migration-implementation.md#gate-7-prove-a-mover-across-the-tracks), [8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| 5 | Group Policy as code | GPOs linked to the test OU; Intune dry run; cut-over drill | [5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions), [8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| 6 | Machine configuration | Audit, then apply and monitor | [5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) (servers) |
| 7 | Ansible beside Arc | Wave plan, check mode, then connect | [5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) (servers), [8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| 8 | Drift pipeline | First run is the baseline | [9](../guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true) |
| 9 | Smoke test, evidence, rollback drill, evidence check | — | All |

### Step 1: baseline evidence before any change

*Gate 2 and Gate 5: the "before" state each gate's evidence compares against.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-2 Baseline Configuration; CA-7 Continuous Monitoring | Records the tenant's state before the change with the read-only validation kit | KSI-CMT-RMV, KSI-MLA-EVC, KSI-SVC-ACM | vk-before run folder and its manifest |
| CISA BOD 25-01 required SCuBA policies; AC-3 Access Enforcement | Exports Conditional Access before the change, so the after export shows the required policies untouched | KSI-IAM-ELP | ca-before export |

: Requirements, KSIs and evidence for this step {.striped .hover}

Sign in as the reader. In PowerShell 7, run the validation kit and export the Conditional Access policies with the automation reference:

```powershell
Set-Location "$env:ADM_EXAMPLES/validation-kit"
./Invoke-ValidationKit.ps1 -OutputPath "$env:ADM_EVIDENCE_DIR/vk-before" -Track HR, DG, CA, ARC -InputPath $env:ADM_VK_INPUTS -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_READER_CLIENT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT -Option @{ Subscriptions = @($env:ADM_SUBSCRIPTION_ID) }
Import-Module "$env:ADM_EXAMPLES/ms-automation/powershell/FmwGraph.psm1"
Connect-FmwGraph -Cloud $env:ADM_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_READER_CLIENT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT
Invoke-FmwEntraTask -Task ca-export -OutDirectory "$env:ADM_EVIDENCE_DIR/ca-before"
```

**Expected:** one run folder under `vk-before` whose `ValidationManifest.json` records the test tenant's ID and mode `Live`; VK-DG-03 ends `Error`, because it is delegated only and this run is app-only ([Chapter 09](09-drift-pipelines-and-evidence.md#the-workflow)), the documented exception that [step 9b](#step-9-smoke-test) checks by hand; one JSON file per Conditional Access policy in `ca-before`. Findings here are the starting point, not a failure.

**Evidence.** In PowerShell 7:

```powershell
Get-ChildItem "$env:ADM_EVIDENCE_DIR/ca-before" -File | Get-FileHash -Algorithm SHA256 | Select-Object Hash, @{ n = 'File'; e = { Split-Path $_.Path -Leaf } } | Export-Csv "$env:ADM_EVIDENCE_DIR/ca-before-sha256.csv" -NoTypeInformation
$manifest = (Get-ChildItem "$env:ADM_EVIDENCE_DIR/vk-before" -Recurse -Filter ValidationManifest.json | Select-Object -First 1).FullName
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step baseline --command "Invoke-ValidationKit.ps1 (vk-before); Invoke-FmwEntraTask ca-export (ca-before)" --result pass --file $manifest --file "$env:ADM_EVIDENCE_DIR/ca-before-sha256.csv"
```

### Step 2: the HR-to-Entra middleware

*Gate 2 (attributes proven) and Gate 3 (attributes flowing).*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2 Account Management | Creates and updates accounts only from HR records, five first, through the middleware's checks | KSI-IAM-AAM | hr-dryrun and batch provenance.json, apply-results.json, the provisioning log extract |
| CM-3(2); CM-8 System Component Inventory | Dry run before sending; every record matched on the person key or quarantined | KSI-CMT-VTD, KSI-PIY-GIV | smoke-hr-dryrun/smoke-report.json (SM-07, SM-08) |

: Requirements, KSIs and evidence for this step {.striped .hover}

**2a. Dry run on the stage's extract.** In a POSIX shell, write the stage's endpoint into the kit's settings and run without `--apply`. Nothing is sent:

```bash
cd "$ADM_EXAMPLES/hcm-entra"
cp config/settings.example.json config/settings.json
python -c "import json, os; p = 'config/settings.json'; s = json.load(open(p)); s['endpoint'] = os.environ['ADM_PROV_ENDPOINT']; json.dump(s, open(p, 'w'), indent=2)"
python python/hcm_to_scim.py --extract "$ADM_HR_EXTRACT" --as-of "$(date -u +%F)" --settings config/settings.json --out "$ADM_EVIDENCE_DIR/hr-dryrun"
python "$ADM_DEPLOY/smoke_test.py" --settings "$ADM_SETTINGS" --hcm-provenance "$ADM_EVIDENCE_DIR/hr-dryrun/provenance.json" --out "$ADM_EVIDENCE_DIR/smoke-hr-dryrun" --step hr
```

**Expected:** the converter exits `0` (`2` means records were quarantined; `3` means the mass-disable hold stopped the run, [Chapter 01](01-the-hr-to-entra-middleware.md)). The smoke test passes `SM-07` and `SM-08`: not held, and no more quarantined records than `max_quarantined`. If it fails, fix the records at the HR source and repeat 2a; don't raise the limit to get through (guide, Gate 2: a wrong value is fixed at the source).

**2b. Start the job with its safety nets.** In the Microsoft Entra admin center, as at least an Application Administrator:[^c10-accidental][^c10-inbound-configure]

1. **Entra ID** > **Enterprise apps** > the provisioning app > **Provisioning** > **Edit provisioning**. Under **Settings**, fill in **Notification Email** (Learn says an empty notification email quarantines the job when it starts), select **Prevent accidental deletions**, enter a deletion threshold, and select **Save**.
2. **Provisioning** > **Overview** > **Start provisioning**, which puts the job in listen mode.

Then record the job, in a POSIX shell:

```bash
python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind provisioning-job --id "$ADM_PROV_JOB_ID"
```

**2c. Send five records, then reconcile.** Sign in as the provisioning identity for a Graph token only, send the extract's first five rows, and record the batch. In a POSIX shell:[^c10-azcli-cert][^c10-gettoken]

```bash
az cloud set --name "$ADM_AZ_CLOUD"
az login --service-principal --username "$ADM_PROVISIONING_CLIENT_ID" --certificate "$ADM_PROVISIONING_CERT_PEM" --tenant "$ADM_TENANT_ID" --allow-no-subscriptions --output none
export HCM_ENTRA_BEARER_TOKEN="$(az account get-access-token --resource "$ADM_GRAPH" --query accessToken --output tsv)"
head -n 6 "$ADM_HR_EXTRACT" > "$ADM_EVIDENCE_DIR/hr-first-five.csv"
python python/hcm_to_scim.py --extract "$ADM_EVIDENCE_DIR/hr-first-five.csv" --as-of "$(date -u +%F)" --settings config/settings.json --out "$ADM_EVIDENCE_DIR/hr-first-five" --apply
python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind hr-batch --id "$ADM_EVIDENCE_DIR/hr-first-five/provenance.json"
unset HCM_ENTRA_BEARER_TOKEN
cat "$ADM_EVIDENCE_DIR/hr-first-five/apply-results.json"
```

The token is requested for the stage's own Graph host (`--resource "$ADM_GRAPH"`), never the Azure CLI's default for the cloud: in DoD the two differ.[^c10-graph-clouds] Then, as the reader in PowerShell 7, save the job's provisioning log entries:

```powershell
Invoke-MgGraphRequest -Method GET -Uri "/v1.0/auditLogs/provisioning?`$filter=jobId eq '$env:ADM_PROV_JOB_ID'&`$top=50" -OutputType Json | Set-Content "$env:ADM_EVIDENCE_DIR/hr-first-five-provisioning-log.json"
```

**Expected:** `apply-results.json` shows one batch with HTTP status `202` and a `Location` header; within a provisioning cycle, the log shows the five people created or updated, matched on the enterprise person key. Learn's provisioning log call needs `AuditLog.Read.All` and `Directory.Read.All`.[^c10-provlogs]

**2d. The rest of the test extract.** Repeat 2c's commands with the whole extract and the output folder `hr-full`, in a POSIX shell:

```bash
az login --service-principal --username "$ADM_PROVISIONING_CLIENT_ID" --certificate "$ADM_PROVISIONING_CERT_PEM" --tenant "$ADM_TENANT_ID" --allow-no-subscriptions --output none
export HCM_ENTRA_BEARER_TOKEN="$(az account get-access-token --resource "$ADM_GRAPH" --query accessToken --output tsv)"
python python/hcm_to_scim.py --extract "$ADM_HR_EXTRACT" --as-of "$(date -u +%F)" --settings config/settings.json --out "$ADM_EVIDENCE_DIR/hr-full" --apply
python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind hr-batch --id "$ADM_EVIDENCE_DIR/hr-full/provenance.json"
unset HCM_ENTRA_BEARER_TOKEN
```

**Expected:** exit `0`. Exit `3` means the run is held: stop, and don't pass `--confirm-large-delta` without identity engineering's decision in the change record.

The smoke test in 2a already wrote a record for this step (pass it `--step hr`, as below, so it counts here). Add the batches. In a POSIX shell, with `pass` only if 2c and 2d gave the expected results, otherwise `fail`:

```bash
python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step hr --command "hcm_to_scim.py --apply (hr-first-five, hr-full)" --result pass \
  --file "$ADM_EVIDENCE_DIR/hr-first-five/apply-results.json" --file "$ADM_EVIDENCE_DIR/hr-full/apply-results.json" \
  --file "$ADM_EVIDENCE_DIR/hr-full/provenance.json" --file "$ADM_EVIDENCE_DIR/hr-first-five-provisioning-log.json"
```

### Step 3: dynamic rules

*Gate 4: every rule on codes with guards, tested before it grants anything.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2; AC-3; CM-3(2) | Groups created paused, every rule tested against named users before processing starts | KSI-IAM-AAM, KSI-IAM-ELP, KSI-CMT-VTD | dr-check-results.json, dr-evaluate-differences.txt (empty) |

: Requirements, KSIs and evidence for this step {.striped .hover}

**3a. Check the library offline.** In PowerShell 7:

```powershell
Set-Location "$env:ADM_EXAMPLES/dynamic-rules"
pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD
Copy-Item ./out/check-results.json "$env:ADM_EVIDENCE_DIR/dr-check-results.json"
```

**Expected:** exit `0` and no Finding ([Chapter 04](04-dynamic-rules-as-code.md)).

**3b. Create the groups paused.** This is the delegated step: the Groups Administrator signs in. Learn lists `Group.ReadWrite.All` as the delegated permission to create a group.[^c10-newgroup] In the same PowerShell session:

```powershell
Connect-MgGraph -Scopes 'Group.ReadWrite.All', 'User.Read.All' -Environment $env:ADM_MG_ENV -TenantId $env:ADM_TENANT_ID -LoginHint $env:ADM_GROUPS_ADMIN_UPN -NoWelcome
Import-Module ./powershell/DynamicRules.psm1
$lib = Get-DrLibrary -Path ./rules
foreach ($r in $lib) {
    $g = New-MgGroup -DisplayName $r.displayName -MailNickname $r.mailNickname -MailEnabled:$false -SecurityEnabled `
        -GroupTypes @('DynamicMembership') -MembershipRule $r.membershipRule -MembershipRuleProcessingState 'Paused'
    python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind dynamic-group --id $g.Id --name $g.DisplayName
}
```

**Expected:** one group per library file, each with processing `Paused`, so nobody is added yet ([Chapter 04](04-dynamic-rules-as-code.md#lab-2-test-tenant)).

**3c. Validate each rule against the named test users before it runs.** Same session. Learn's evaluate call is beta and supports delegated permissions only:[^c10-evaluate]

```powershell
$memberIds = Get-Content $env:ADM_DR_MEMBER_MAP -Raw | ConvertFrom-Json -AsHashtable
$bad = foreach ($r in $lib) { foreach ($test in $r.tests) {
    $body = @{ memberId = $memberIds[$test.member]; membershipRule = $r.membershipRule } | ConvertTo-Json
    $got = (Invoke-MgGraphRequest -Method POST -Uri '/beta/groups/evaluateDynamicMembership' -Body $body -ContentType 'application/json').membershipRuleEvaluationResult
    if ($got -ne $test.expected) { "$($r.file) $($test.member): Graph says $got, expected $($test.expected)" }
} }
@($bad) | Set-Content "$env:ADM_EVIDENCE_DIR/dr-evaluate-differences.txt"
"$(@($bad).Count) difference(s)"
```

**Expected:** `0 difference(s)`. Any difference stops the stage: fix the rule in Git, or the test user's attributes, and repeat 3a to 3c.

**3d. Turn processing on, from the record.** Same session:

```powershell
$ids = ((Get-Content "$env:ADM_EVIDENCE_DIR/deploy-record.json" -Raw | ConvertFrom-Json).entries | Where-Object kind -EQ 'dynamic-group').id
foreach ($id in $ids) { Update-MgGroup -GroupId $id -MembershipRuleProcessingState 'On' }
Disconnect-MgGraph
```

**Expected:** membership fills within hours; Learn says processing can take more than 24 hours ([Chapter 04](04-dynamic-rules-as-code.md#verified-facts)). The groups grant nothing yet: nothing is assigned to them until steps 5 and later.

**Evidence.** In PowerShell 7:

```powershell
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step rules --command "Invoke-DrLibraryCheck.ps1; evaluateDynamicMembership" --result $(if (@($bad).Count -eq 0) { 'pass' } else { 'fail' }) --file "$env:ADM_EVIDENCE_DIR/dr-check-results.json" --file "$env:ADM_EVIDENCE_DIR/dr-evaluate-differences.txt"
```

### Step 4: Lifecycle Workflows, created disabled

*Gate 8 (leaver automation first in every wave) and Gate 7 (the workflow's run history is the mover and leaver evidence).*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2 Account Management (leaver first) | The leaver workflow is created disabled, checked, and run on demand for one user | KSI-IAM-AAM | lcw-workflow.json, lcw-run.json |

: Requirements, KSIs and evidence for this step {.striped .hover}

**4a. Create the workflow in the admin center.** As a Lifecycle Workflows Administrator:[^c10-lcw-create]

1. **ID Governance** > **Lifecycle workflows** > **Create a workflow**, template **Real-time employee termination**.
2. **Basics**: the name in `lifecycle.workflow_name`. **Review tasks**: the template's own tasks remove groups and Teams and delete the account, with no disable or revoke ([Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md)), so remove all of them, including *Delete user*. Then **Add task** in Book 03's leaver order, as [Chapter 05, Lab 2 step 4](05-lifecycle-workflows-custom-extensions.md#lab-2-test-tenant) does: *Disable user account*, then *Revoke all refresh tokens for user*, then **Run a custom task extension**, choosing the extension in `lifecycle.extension_id`.
3. **Review and create**: leave the schedule off, and select **Create**.

Learn says a workflow created in the admin center starts disabled, so that it can be tested on a small audience first, and that workflows from the real-time termination template run on demand only.[^c10-lcw-create][^c10-lcw-activate] Created through Graph instead, `isEnabled` defaults to `true`,[^c10-lcw-resource] which is why this step uses the admin center.

**4b. Read it back and check it.** Sign in as the deploy identity. In PowerShell 7:

```powershell
Set-Location "$env:ADM_EXAMPLES/lifecycle-extensions"
$wf = (Invoke-MgGraphRequest -Method GET -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows?`$filter=displayName eq '$env:ADM_LCW_WORKFLOW_NAME'").value[0]
python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind lcw-workflow --id $wf.id --name $env:ADM_LCW_WORKFLOW_NAME
Invoke-MgGraphRequest -Method GET -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows/$($wf.id)?`$expand=tasks" -OutputType Json | Set-Content "$env:ADM_EVIDENCE_DIR/lcw-workflow.json"
python tools/lcwext.py check-workflow config/integrations.json --name cms-revocation --extension-id $env:ADM_LCW_EXTENSION_ID "$env:ADM_EVIDENCE_DIR/lcw-workflow.json"
"isEnabled=$($wf.isEnabled) isSchedulingEnabled=$($wf.isSchedulingEnabled)"
```

**Expected:** `check-workflow` passes ([Chapter 05](05-lifecycle-workflows-custom-extensions.md)), and the last line prints `isEnabled=False isSchedulingEnabled=False`.

**4c. Run it on demand for one test user.** Learn says a workflow must be enabled to run on demand, and that an on-demand run ignores the workflow's execution conditions.[^c10-lcw-activate] So enable it with scheduling still off, run it for the one test user, and read the result. Same session:

```powershell
Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $wf.id -BodyParameter @{ isEnabled = $true; isSchedulingEnabled = $false }
Invoke-MgGraphRequest -Method POST -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows/$($wf.id)/activate" -Body (@{ subjects = @(@{ id = $env:ADM_LCW_TEST_USER_ID }) } | ConvertTo-Json -Depth 4) -ContentType 'application/json'
Start-Sleep -Seconds 600
Invoke-MgGraphRequest -Method GET -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows/$($wf.id)/userProcessingResults" -OutputType Json | Set-Content "$env:ADM_EVIDENCE_DIR/lcw-run.json"
```

**Expected:** the activate call returns `204 No Content`, and `lcw-run.json` shows one user processing result for the test user, ending `completed`, with the custom task's result from the Logic App ([Chapter 05](05-lifecycle-workflows-custom-extensions.md#lab-2-test-tenant)).[^c10-lcw-activate][^c10-lcw-status] In the test stage, leave scheduling off: production turns it on once, at the first wave.

**Evidence.** In PowerShell 7:

```powershell
$done = ((Get-Content "$env:ADM_EVIDENCE_DIR/lcw-run.json" -Raw | ConvertFrom-Json).value | Where-Object { $_.processingStatus -eq 'completed' }).Count -ge 1
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step lcw --command "lcwext check-workflow; workflow activate" --result $(if ($done) { 'pass' } else { 'fail' }) --file "$env:ADM_EVIDENCE_DIR/lcw-workflow.json" --file "$env:ADM_EVIDENCE_DIR/lcw-run.json"
```

### Step 5: Group Policy as code

*Gate 5 (each setting moved to one owner) and Gate 8 (a wave's GPO links disabled, never deleted).*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-6 Configuration Settings; CM-3 Configuration Change Control | Intune policies from reviewed JSON, dry run first; GPO links disabled, never deleted | KSI-CMT-LMC, KSI-CMT-RMV, KSI-SVC-ACM | gpc-apply/sync-record.json; GPO link states before and after |
| OMB M-22-09 device inventory and device signal | Device settings move to Intune, which holds the managed device inventory | KSI-PIY-GIV | the Intune assignment and the test device's settings |

: Requirements, KSIs and evidence for this step {.striped .hover}

**5a. Link the source GPOs to the test OU.** In the test forest, as a domain administrator, in PowerShell with the GroupPolicy module. `-WhatIf` first, then the real run; Learn documents both cmdlets and `-LinkEnabled`:[^c10-importgpo][^c10-newgplink]

```powershell
Import-Module GroupPolicy
foreach ($g in $env:ADM_GPO_NAMES -split ',') {
    Import-GPO -BackupGpoName $g -Path $env:ADM_GPO_BACKUP_PATH -TargetName $g -CreateIfNeeded -Domain $env:ADM_AD_DOMAIN -WhatIf
    New-GPLink -Name $g -Target $env:ADM_TARGET_OU -LinkEnabled Yes -Domain $env:ADM_AD_DOMAIN -WhatIf
}
```

```powershell
foreach ($g in $env:ADM_GPO_NAMES -split ',') {
    Import-GPO -BackupGpoName $g -Path $env:ADM_GPO_BACKUP_PATH -TargetName $g -CreateIfNeeded -Domain $env:ADM_AD_DOMAIN
    New-GPLink -Name $g -Target $env:ADM_TARGET_OU -LinkEnabled Yes -Domain $env:ADM_AD_DOMAIN
    python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind gpo-link-created --id $g --name $env:ADM_TARGET_OU
}
```

**Expected:** each GPO exists in the test domain with the backup's settings, linked and enabled on the test OU only. This gives the test forest the source state that production has.

**5b. The Intune side: dry run, then create.** Sign in as the deploy identity. In PowerShell 7:

```powershell
Set-Location "$env:ADM_EXAMPLES/group-policy-as-code"
pwsh ./powershell/Invoke-GpcSync.ps1 -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_DEPLOY_CLIENT_ID -CertificateThumbprint $env:ADM_DEPLOY_CERT_THUMBPRINT -WithPlan
pwsh ./powershell/Invoke-GpcSync.ps1 -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_DEPLOY_CLIENT_ID -CertificateThumbprint $env:ADM_DEPLOY_CERT_THUMBPRINT -Apply -OutputPath "$env:ADM_EVIDENCE_DIR/gpc-apply"
foreach ($id in (Get-Content "$env:ADM_EVIDENCE_DIR/gpc-apply/sync-record.json" -Raw | ConvertFrom-Json).Created) {
    python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind intune-policy --id $id
}
```

**Expected:** the dry run lists each library policy as missing and changes nothing; the apply creates only those, unassigned, and `sync-record.json` lists their IDs ([Chapter 06](06-group-policy-as-code.md)).

**5c. Assign the new policies to the test group.** In the Intune admin center, for each policy the apply created: **Devices** > **Manage devices** > **Configuration** > the policy > **Properties** > **Assignments** > **Edit**; under **Included groups**, **Add groups**, the group in `group_policy.intune_group_id`; **Review + Save**, then **Save**.[^c10-intune-assign] In GCC High and DoD, use the government admin center ([Chapter 06](06-group-policy-as-code.md#lab-2-test-tenant)).

**5d. Rehearse the cut-over: disable the test OU's links.** After a test device in the group has checked in and shows the settings, in the test forest:[^c10-setgplink]

```powershell
foreach ($g in $env:ADM_GPO_NAMES -split ',') {
    Set-GPLink -Name $g -Target $env:ADM_TARGET_OU -LinkEnabled No -Domain $env:ADM_AD_DOMAIN
    python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind gpo-link-disabled --id $g --name $env:ADM_TARGET_OU
}
```

**Expected:** each link shows `Enabled : False` and still exists, so re-enabling it is the one-command rollback the guide requires ([Gate 8 rollback](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)). The test device keeps its settings from Intune.

**Evidence.** In PowerShell 7:

```powershell
Get-GPInheritance -Target $env:ADM_TARGET_OU -Domain $env:ADM_AD_DOMAIN | Select-Object -ExpandProperty GpoLinks | Select-Object DisplayName, Enabled, Target | ConvertTo-Json | Set-Content "$env:ADM_EVIDENCE_DIR/gpo-links-after.json"
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step gpo --command "Invoke-GpcSync -Apply; Set-GPLink -LinkEnabled No" --result pass --file "$env:ADM_EVIDENCE_DIR/gpc-apply/sync-record.json" --file "$env:ADM_EVIDENCE_DIR/gpo-links-after.json"
```

### Step 6: machine configuration, audit before apply

*Gate 5 (servers: the convention handed to the Arc track) and Learn's remediation order: audit, then apply and monitor.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-2; CM-2(2) Automation Support; CM-6 | Audit assignment before apply and monitor, from the release registry | KSI-CMT-RMV, KSI-SVC-ACM, KSI-MLA-EVC | both provenance.json files; mc-audit-state.json |
| SI-7 Software, Firmware, and Information Integrity | The published package's hash is the built package's hash | KSI-SVC-VRI | provenance.json package SHA-256 and the guest assignment's contentHash |

: Requirements, KSIs and evidence for this step {.striped .hover}

Learn describes three assignment types: `Audit` reports and changes nothing, `ApplyAndMonitor` applies once and then reports drift without correcting it, and `ApplyAndAutoCorrect` corrects drift at the next evaluation.[^c10-mc-remediation] The runbook goes from the first to the second, and leaves the third as a later, separate decision (*design guidance*).

**6a. Build and publish the audit package.** On the build host, as the deploy identity, in PowerShell 7 with the modules saved as in [Chapter 07](07-machine-configuration-packages.md):

```powershell
Set-Location "$env:ADM_EXAMPLES/machine-configuration"
pwsh ./powershell/Invoke-McBuild.ps1 -Name $env:ADM_MC_NAME -Version 1.0.0 -ContentUri $env:ADM_MC_CONTENT_URI -ModulePath ./mcmods -OutputPath "$env:ADM_EVIDENCE_DIR/mc"
$ctx = New-AzStorageContext -StorageAccountName $env:ADM_MC_STORAGE -UseConnectedAccount
Set-AzStorageBlobContent -Container $env:ADM_MC_CONTAINER -File "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.0.0/$($env:ADM_MC_NAME)_1.0.0.zip" -Blob "$($env:ADM_MC_NAME)_1.0.0.zip" -Context $ctx
$policyId = (Get-Content ./config/releases.json -Raw | ConvertFrom-Json).configurations.$($env:ADM_MC_NAME).policyId
$def = New-AzPolicyDefinition -Name $policyId -Policy (Get-ChildItem "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.0.0/policy/*.json")[0].FullName
python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind policy-definition --id $policyId
```

**Expected:** the build exits `0` and writes `provenance.json` with mode `Audit`; the definition is published under the registry's fixed policy ID ([Chapter 07](07-machine-configuration-packages.md#lab-2-test-subscription-and-a-disposable-server)). Learn recommends Resource Policy Contributor for publishing definitions.[^c10-mc-policy]

**6b. Grant the server's identity read access, tag it, and assign the audit.** The definition uses each machine's system-assigned identity, which needs Storage Blob Data Reader on the storage account, with anonymous blob access off.[^c10-mc-policy] Same session:

```powershell
$scope = "/subscriptions/$env:ADM_SUBSCRIPTION_ID/resourceGroups/$env:ADM_RESOURCE_GROUP"
$serverPrincipal = az connectedmachine show --name $env:ADM_ARC_SERVER --resource-group $env:ADM_RESOURCE_GROUP --query identity.principalId -o tsv
$storageId = az storage account show --name $env:ADM_MC_STORAGE --resource-group $env:ADM_RESOURCE_GROUP --query id -o tsv
$raId = az role assignment create --assignee-object-id $serverPrincipal --assignee-principal-type ServicePrincipal --role 'Storage Blob Data Reader' --scope $storageId --query id -o tsv
python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind role-assignment --id $raId
Update-AzTag -ResourceId (az connectedmachine show --name $env:ADM_ARC_SERVER --resource-group $env:ADM_RESOURCE_GROUP --query id -o tsv) -Tag @{ ConfigOwner = 'ArcMachineConfiguration' } -Operation Merge
New-AzPolicyAssignment -Name 'adm-mc-audit' -PolicyDefinition $def -Scope $scope -PolicyParameterObject @{ IncludeArcMachines = 'true' }
```

This step doesn't record `adm-mc-audit` in the deploy record: step 6d removes it, and the rollback writes a removal for every recorded assignment in a script that stops on the first error, so a record of an assignment that is already gone would stop the drill. If the run stops between 6b and 6d, remove it by hand with the first command of 6d before you roll back. The `ConfigOwner` tag is the owner filter the release registry adds to the definition; an untagged server stays out of scope ([Chapter 07](07-machine-configuration-packages.md)). `az connectedmachine show --query identity.principalId` is Learn's own command for an Arc server's identity.[^c10-arc-ansible]

**6c. Read the audit result.** Same session; Learn's commands for an on-demand scan and the compliance state:[^c10-policy-scan][^c10-policy-state]

```powershell
Start-AzPolicyComplianceScan -ResourceGroupName $env:ADM_RESOURCE_GROUP
Get-AzPolicyState -ResourceGroupName $env:ADM_RESOURCE_GROUP -PolicyAssignmentName 'adm-mc-audit' | Select-Object ResourceId, ComplianceState | ConvertTo-Json | Set-Content "$env:ADM_EVIDENCE_DIR/mc-audit-state.json"
```

**Expected:** after a few evaluation cycles, the test server appears with a compliance state, and the guest assignment's `contentHash` matches the package hash in `provenance.json` ([Chapter 07](07-machine-configuration-packages.md#lab-2-test-subscription-and-a-disposable-server)). Nothing on the server changed.

**6d. Move to apply and monitor.** Changing a definition doesn't update an assignment or give it an identity, and a `deployIfNotExists` assignment needs a managed identity with the definition's roles, granted by hand when you don't use the portal, and a location.[^c10-remediate][^c10-assignment-identity] So remove the audit assignment, set the registry's mode, rebuild under a new version, publish, and assign with an identity. Same session:

```powershell
Remove-AzPolicyAssignment -Name 'adm-mc-audit' -Scope $scope
python -c "import json, os; p = 'config/releases.json'; r = json.load(open(p)); r['configurations'][os.environ['ADM_MC_NAME']]['mode'] = 'ApplyAndMonitor'; json.dump(r, open(p, 'w'), indent=2)"
pwsh ./powershell/Invoke-McBuild.ps1 -Name $env:ADM_MC_NAME -Version 1.1.0 -ContentUri $env:ADM_MC_CONTENT_URI -ModulePath ./mcmods -OutputPath "$env:ADM_EVIDENCE_DIR/mc"
Set-AzStorageBlobContent -Container $env:ADM_MC_CONTAINER -File "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.1.0/$($env:ADM_MC_NAME)_1.1.0.zip" -Blob "$($env:ADM_MC_NAME)_1.1.0.zip" -Context $ctx
$policyFile = (Get-ChildItem "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.1.0/policy/*.json")[0].FullName
$def = New-AzPolicyDefinition -Name $policyId -Policy $policyFile
New-AzPolicyAssignment -Name 'adm-mc-apply' -PolicyDefinition $def -Scope $scope -PolicyParameterObject @{ IncludeArcMachines = 'true' } -IdentityType SystemAssigned -Location $env:ADM_LOCATION | Out-Null
python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind policy-assignment --id adm-mc-apply --name $scope
$paPrincipal = az policy assignment show --name adm-mc-apply --scope $scope --query identity.principalId -o tsv
$paId = az policy assignment show --name adm-mc-apply --scope $scope --query id -o tsv
foreach ($roleId in (Get-Content $policyFile -Raw | ConvertFrom-Json).properties.policyRule.then.details.roleDefinitionIds) {
    $raId = az role assignment create --assignee-object-id $paPrincipal --assignee-principal-type ServicePrincipal --role ($roleId -split '/')[-1] --scope $scope --query id -o tsv
    python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind role-assignment --id $raId
}
Start-Sleep -Seconds 300
Start-AzPolicyRemediation -Name 'adm-mc-apply-remediation' -PolicyAssignmentId $paId
```

**Expected:** the 1.1.0 build passes with mode `ApplyAndMonitor` (`MC-POL-07` checks the effect and assignment type against the registry; [Chapter 07](07-machine-configuration-packages.md)); the remediation task applies the configuration to the test server; the next scan shows it compliant. The registry change stays in the test working copy: production builds from the reviewed registry, after a pull request sets the mode and the published version ([promotion criteria](#promotion-go-no-go-criteria)).[^c10-start-remediation]

**Evidence.** In PowerShell 7:

```powershell
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step mc --command "Invoke-McBuild 1.0.0 (Audit) and 1.1.0 (ApplyAndMonitor); assignments; remediation" --result pass --file "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.0.0/provenance.json" --file "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.1.0/provenance.json" --file "$env:ADM_EVIDENCE_DIR/mc-audit-state.json"
```

### Step 7: Ansible beside Arc, check mode first

*Gate 5 (servers onboard with their owner tags from the CMDB) and Gate 8 (servers move by wave).*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-8; AC-6; CM-3(2) | Servers onboard by wave with both owners' tags, check mode first, the control node holding only the onboarding role | KSI-PIY-GIV, KSI-IAM-ELP, KSI-CMT-VTD | the wave plan, the check-mode and connect output, the role assignment |

: Requirements, KSIs and evidence for this step {.striped .hover}

**7a. Grant the control node the onboarding role, and only that.** Learn names the Azure Connected Machine Onboarding role at subscription or resource group scope, and its own commands to find the control node's identity.[^c10-arc-ansible] As the deploy identity, in a POSIX shell, with the control node's name and resource group as recorded in your CMDB (this example assumes it is an Arc-enabled server in the stage's resource group):

```bash
NODE_PRINCIPAL="$(az connectedmachine show --name "$(hostname)" --resource-group "$ADM_RESOURCE_GROUP" --query identity.principalId -o tsv)"
RA_ID="$(az role assignment create --assignee "$NODE_PRINCIPAL" --role "Azure Connected Machine Onboarding" --scope "/subscriptions/$ADM_SUBSCRIPTION_ID/resourceGroups/$ADM_RESOURCE_GROUP" --query id -o tsv)"
python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind role-assignment --id "$RA_ID"
```

If the control node is an Azure VM, Learn's command is `az vm show --name <vm> --resource-group <rg> --query identity.principalId -o tsv` in place of the first line.[^c10-arc-ansible]

**7b. Plan, then check mode, then connect.** On the control node, in `examples/ansible`. The onboarding playbooks run in check mode unless `confirm_change=true` is passed ([Chapter 08](08-ansible-beside-arc.md)):

```bash
cd "$ADM_EXAMPLES/ansible"
export CMDB_CSV="$ADM_CMDB_CSV"
sed -i "s/^arc_tenant_id: .*/arc_tenant_id: \"$ADM_TENANT_ID\"/; s/^arc_subscription_id: .*/arc_subscription_id: \"$ADM_SUBSCRIPTION_ID\"/; s/^arc_cloud: .*/arc_cloud: $ADM_AZ_CLOUD/" inventory/group_vars/all.yml
ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave="$ADM_ARC_WAVE" | tee "$ADM_EVIDENCE_DIR/arc-plan.txt"
ansible-playbook "$ADM_ARC_PLAYBOOK" -e onboarding_wave="$ADM_ARC_WAVE" | tee "$ADM_EVIDENCE_DIR/arc-check-mode.txt"
```

**Expected:** the wave plan lists the wave's servers with both owners and stops on a production server in a pilot wave, and lists a server with a missing patch owner as blocked, stopping only if the wave has no ready server; the second command, in check mode, reports what it would send and changes nothing on any server ([Chapter 08](08-ansible-beside-arc.md#lab-2-test-subscription-and-a-disposable-server)). Then connect:

```bash
ansible-playbook "$ADM_ARC_PLAYBOOK" -e onboarding_wave="$ADM_ARC_WAVE" -e confirm_change=true | tee "$ADM_EVIDENCE_DIR/arc-connect.txt"
for h in $(python -c "import csv, os; print(' '.join(r['name'] for r in csv.DictReader(open(os.environ['CMDB_CSV'])) if r.get('arc_wave') == os.environ['ADM_ARC_WAVE']))"); do
  python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind arc-server --id "$h"
done
```

**Expected:** the canary host connects first, then the rest in batches; on each server, `azcmagent show` reports `Connected` with the CMDB's `ConfigOwner` and `PatchOwner` tags ([Chapter 08](08-ansible-beside-arc.md)). In GCC High and DoD, `ADM_ARC_PLAYBOOK` is `02_arc_onboarding.yml`, which reads the onboarding service principal's secret from Ansible Vault at run time: Microsoft's role requests its token for commercial Azure only ([Chapter 08](08-ansible-beside-arc.md)), and the pre-flight check warns about it.

**Evidence.** In a POSIX shell:

```bash
python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step arc --command "05_arc_wave_plan; $ADM_ARC_PLAYBOOK (check mode, then confirm_change=true)" --result pass \
  --file "$ADM_EVIDENCE_DIR/arc-plan.txt" --file "$ADM_EVIDENCE_DIR/arc-check-mode.txt" --file "$ADM_EVIDENCE_DIR/arc-connect.txt"
```

### Step 8: the drift pipeline

*Gate 9: drift scans running from the first change.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7; AU-2 Event Logging; IA-5 for non-user accounts | A scheduled read-only comparison, signed in with a federated credential and no secret | KSI-MLA-EVC, KSI-MLA-LET, KSI-IAM-SNU | workflow_lint output; the first evidence package |

: Requirements, KSIs and evidence for this step {.striped .hover}

The deploy identity holds no application permission that lets it add a credential to an app. Learn lets the app's owner or an Application Administrator add one ([Chapter 09](09-drift-pipelines-and-evidence.md)), so the next two commands (the credential and its `rollback.py add` record) are the one named-person step here: the owner of the reader app, or an Application Administrator, signs in with the Azure CLI for them. Everything else in this step runs as the deploy identity. In a POSIX shell, follow [Chapter 09's test-tenant steps](09-drift-pipelines-and-evidence.md#lab-2-test-tenant-and-test-subscription), with the stage's values. Create the federated credential for the stage's GitHub environment:[^c10-fic]

```bash
APP_OBJECT_ID="$(az ad app show --id "$ADM_READER_CLIENT_ID" --query id -o tsv)"
AUDIENCE="$(python "$ADM_EXAMPLES/drift-pipeline/python/drift_pipeline.py" cloud --name "$ADM_CLOUD" | python -c "import json, sys; print(json.load(sys.stdin)['audience'])")"
cat > "$ADM_EVIDENCE_DIR/credential.json" <<EOF
{
  "name": "$ADM_DRIFT_ENV",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:$ADM_DRIFT_REPO:environment:$ADM_DRIFT_ENV",
  "audiences": ["$AUDIENCE"]
}
EOF
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters "$ADM_EVIDENCE_DIR/credential.json"
python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind federated-credential --id "$ADM_DRIFT_ENV" --name "$APP_OBJECT_ID"
```

The pipeline reads the tenant as the reader app, so the credential goes on that app (*design guidance*: the identity that reads the tenant is the one the pipeline signs in as; Chapter 09 makes it read-only). Then create the evidence container with a retention policy, **unlocked** in the test stage, and record it:[^c10-immutable-container]

```bash
az storage container create --account-name "$ADM_EVIDENCE_ACCOUNT" --name "$ADM_EVIDENCE_CONTAINER" --auth-mode login
az storage container immutability-policy create --resource-group "$ADM_RESOURCE_GROUP" --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --period 365
python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind retention-policy --id "$ADM_EVIDENCE_CONTAINER" --name "$ADM_EVIDENCE_ACCOUNT"
```

Then, in the pipeline repository's root, copy and lint the workflow, and set the repository's environment, secrets, variables and labels exactly as [Chapter 09, test-tenant step 4](09-drift-pipelines-and-evidence.md#lab-2-test-tenant-and-test-subscription) lists:

```bash
mkdir -p .github/workflows
cp examples/drift-pipeline/workflow/drift-pipeline.yml .github/workflows/drift.yml
python examples/drift-pipeline/python/workflow_lint.py .github/workflows/drift.yml | tee "$ADM_EVIDENCE_DIR/workflow-lint.txt"
```

Run it once from the repository's **Actions** tab (**workflow_dispatch**). **Expected:** `0 finding(s), 0 warning(s)` from the linter; the first run is the baseline: one evidence package in the container and one summary issue ([Chapter 09](09-drift-pipelines-and-evidence.md)).

**Evidence.** In a POSIX shell:

```bash
python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step drift --command "federated credential; evidence container; workflow_lint; first run" --result pass \
  --file "$ADM_EVIDENCE_DIR/credential.json" --file "$ADM_EVIDENCE_DIR/workflow-lint.txt"
```

### Step 9: smoke test

*Every gate's Validate step, read in one place.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-4(2) Verification of Controls; CA-7 | After the change, the gates' checks are read again and the answer is go or no-go | KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC | smoke/smoke-report.json and vk-after |

: Requirements, KSIs and evidence for this step {.striped .hover}

As the reader, run the validation kit again, then the smoke test on everything the stage wrote. In PowerShell 7:

```powershell
Set-Location "$env:ADM_EXAMPLES/validation-kit"
./Invoke-ValidationKit.ps1 -OutputPath "$env:ADM_EVIDENCE_DIR/vk-after" -Track HR, DG, CA, ARC -InputPath $env:ADM_VK_INPUTS -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_READER_CLIENT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT -Option @{ Subscriptions = @($env:ADM_SUBSCRIPTION_ID) }
$run = (Get-ChildItem "$env:ADM_EVIDENCE_DIR/vk-after" -Directory | Sort-Object Name | Select-Object -Last 1).FullName
python "$env:ADM_DEPLOY/smoke_test.py" --settings $env:ADM_SETTINGS --kit-run $run `
    --hcm-provenance "$env:ADM_EVIDENCE_DIR/hr-full/provenance.json" --dynamic-rules "$env:ADM_EVIDENCE_DIR/dr-check-results.json" `
    --mc-provenance "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_$($env:ADM_MC_VERSION)/provenance.json" --mc-mode ApplyAndMonitor `
    --deploy-record "$env:ADM_EVIDENCE_DIR/deploy-record.json" --out "$env:ADM_EVIDENCE_DIR/smoke"
```

**Expected:** `smoke test: GO (0 failed)`. Every check in `smoke.required_pass` is `Pass`; VK-DG-03 is the only `Error`, and it is listed as allowed unverified, its evidence being step 3c's `0 difference(s)`; the run read the test tenant in mode `Live`; nothing is held or quarantined over the limit; every recorded change has a rollback. The report's SHA-256, on the last line, is part of the go/no-go record for production. The smoke test writes its own evidence record for this step (`evidence NNN-smoke.json: smoke pass`).

**VK-DG-03 is a documented exception.** The smoke test reads an app-only run of the validation kit, and VK-DG-03 can't run app-only: Learn lists no application permission for the evaluate call, so the check needs a person signed in.[^c10-evaluate] An app-only smoke test can't sign in as a person. So `smoke.allowed_unverified` lists VK-DG-03, and only VK-DG-03, and the smoke test's `SM-06` line reads `no unexpected Error (allowed unverified: VK-DG-03)`. A GO therefore says nothing about VK-DG-03. The exception is accepted on one condition: at the first live run, the Groups Administrator runs VK-DG-03 by hand, delegated, and the result is kept as evidence (9b). Step 3c evaluates each library rule against its named test users; 9b runs the kit's own check on the kit's `rule-tests.json`, so the check the smoke test skips has a result of its own. Any other check that ends `Error` still fails `SM-06`.

**9b. First live run only: check VK-DG-03 by hand.** The Groups Administrator signs in, delegated, with the read scopes the check needs, and runs that one check. In PowerShell 7, with the test stage's settings loaded:

```powershell
Set-Location "$env:ADM_EXAMPLES/validation-kit"
Connect-MgGraph -Scopes 'Group.Read.All', 'User.Read.All', 'Device.Read.All' -Environment $env:ADM_MG_ENV -TenantId $env:ADM_TENANT_ID -LoginHint $env:ADM_GROUPS_ADMIN_UPN -NoWelcome
Get-MgContext | Select-Object Account, AuthType, TenantId
./Invoke-ValidationKit.ps1 -OutputPath "$env:ADM_EVIDENCE_DIR/vk-dg03-delegated" -CheckId VK-DG-03 -InputPath $env:ADM_VK_INPUTS -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -SkipConnect
$dg03run = (Get-ChildItem "$env:ADM_EVIDENCE_DIR/vk-dg03-delegated" -Directory | Sort-Object Name | Select-Object -Last 1).FullName
$dg03 = Get-Content "$dg03run/Results/ValidationResults.json" -Raw | ConvertFrom-Json | Where-Object CheckId -EQ 'VK-DG-03'
"$($dg03.CheckId) $($dg03.Status) ($($dg03.Count) finding(s))"
Disconnect-MgGraph
```

**Expected:** `Get-MgContext` shows the Groups Administrator's account, `AuthType` `Delegated` and the test tenant's ID, and the last line is `VK-DG-03 Pass (0 finding(s))`. `Fail` means Graph evaluates a rule test differently from what `rule-tests.json` expects: stop, fix the rule in Git or the test, as in 3c, and run 9b again. `Error` means the session lacks the role or a scope, and `NotApplicable` means `rule-tests.json` isn't in the kit's inputs; either way VK-DG-03 still hasn't been checked, so fix it and run 9b again.

**Evidence.** In the same PowerShell session:

```powershell
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step smoke --command "Invoke-ValidationKit.ps1 -CheckId VK-DG-03, delegated as the Groups Administrator (vk-dg03-delegated)" --result $(if ($dg03.Status -eq 'Pass') { 'pass' } else { 'fail' }) --file "$dg03run/ValidationManifest.json" --file "$dg03run/Results/ValidationResults.json"
```

This is the step's second `smoke` record. `evidence.py check` judges a step by its latest pass or fail record, so a failed hand check fails step 12 and holds promotion until 9b passes.

### Step 10: capture the evidence

*Each gate's Evidence paragraph.*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AU-9; SI-7 | One evidence package with a SHA-256 per file, verified | KSI-MLA-OSM, KSI-SVC-VRI | the package, its SHA256SUMS and the verify output |

: Requirements, KSIs and evidence for this step {.striped .hover}

Package the stage with the drift pipeline's packager, so the ISSO receives one folder with a SHA-256 per file. In a POSIX shell:

```bash
cd "$ADM_EXAMPLES/drift-pipeline"
RUN="$(ls -d "$ADM_EVIDENCE_DIR"/vk-after/*/ | tail -n 1)"
python python/drift_pipeline.py compare --current "$RUN" --out "$ADM_EVIDENCE_DIR/drift"
python python/drift_pipeline.py package --kit-run "$RUN" --diff "$ADM_EVIDENCE_DIR/drift/drift-report.json" \
  --provenance hcm-entra="$ADM_EVIDENCE_DIR/hr-full/provenance.json" \
  --provenance machine-configuration="$ADM_EVIDENCE_DIR/mc/${ADM_MC_NAME}_${ADM_MC_VERSION}/provenance.json" \
  --provenance dynamic-rules="$ADM_EVIDENCE_DIR/dr-check-results.json" --out "$ADM_EVIDENCE_DIR/package"
PKG="$(ls -d "$ADM_EVIDENCE_DIR"/package/*/ | tail -n 1)"
python python/drift_pipeline.py verify "$PKG" | tee "$ADM_EVIDENCE_DIR/package-verify.txt"
python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step package --command "drift_pipeline.py package; verify" --result pass \
  --file "${PKG}EVIDENCE-MANIFEST.json" --file "${PKG}SHA256SUMS" --file "$ADM_EVIDENCE_DIR/package-verify.txt"
```

**Expected:** `verify` passes. Attach the package, `smoke/smoke-report.json`, `deploy-record.json` and the files listed under [Evidence the ISSO keeps](#evidence-the-isso-keeps) to the change record. `quarantine.json` from the HR runs holds personal data: it goes to the access-controlled audit store, not the change record ([Chapter 01](01-the-hr-to-entra-middleware.md)).

### Step 11: roll back

*The guide's [rollback at a glance](../guides/attribute-driven-migration-implementation.md#rollback).*

**Requirements (test and production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3 Configuration Change Control | Every change recorded with its rollback; the rollback written newest first and, in the test stage, run | KSI-CMT-LMC, KSI-CMT-RVP | deploy-record.json, the rollback scripts, the rollback transcripts |

: Requirements, KSIs and evidence for this step {.striped .hover}

Write the rollback from the record. In a POSIX shell:

```bash
python "$ADM_DEPLOY/rollback.py" plan --settings "$ADM_SETTINGS"
```

It writes `rollback-cloud.ps1`, `rollback-ad.ps1` and `rollback-manual.md` in the evidence folder and runs nothing; the [fixture run above](#try-the-scripts-against-fixtures-first) shows the shape. Review them, then run each where it belongs. Cloud steps, in PowerShell 7 on the operator's workstation (the script signs in with the deploy identity's certificate):

```powershell
pwsh -File "$env:ADM_EVIDENCE_DIR/rollback-cloud.ps1" *>&1 | Tee-Object "$env:ADM_EVIDENCE_DIR/rollback-cloud.log"
```

Group Policy steps, on the test forest's administration host:

```powershell
powershell -File "$env:ADM_EVIDENCE_DIR/rollback-ad.ps1" *>&1 | Tee-Object "$env:ADM_EVIDENCE_DIR/rollback-ad.log"
```

Then the steps in `rollback-manual.md`: on each Arc test server, `sudo azcmagent disconnect`, as [Chapter 08](08-ansible-beside-arc.md#lab-2-test-subscription-and-a-disposable-server) shows; and, for the HR batches, Chapter 01's leaver back-out.

**When to roll back in the test stage.** Always, at the end, to prove the rollback works: rebuild the test state from the runbook for the next rehearsal, rather than keeping a test stage that only ever moved forward (*design guidance*). In the test stage the rollback removes what the stage created; it disables the workflow before deleting it, and disables GPO links rather than deleting the GPOs. **Expected:** the next validation kit run matches `vk-before`.

`rollback.py plan` recorded the plan; record the run. In PowerShell 7, with `pass` only if both scripts ended without an error:

```powershell
python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step rollback --command "rollback-cloud.ps1; rollback-ad.ps1; rollback-manual.md" --result pass --file "$env:ADM_EVIDENCE_DIR/rollback-cloud.log" --file "$env:ADM_EVIDENCE_DIR/rollback-ad.log" --file "$env:ADM_EVIDENCE_DIR/deploy-record.json"
```

### Step 12: check the evidence

*Every requirement row of the stage.*

In a POSIX shell:

```bash
python "$ADM_DEPLOY/evidence.py" check --settings "$ADM_SETTINGS"
(cd "$ADM_EVIDENCE_DIR/evidence" && sha256sum -c SHA256SUMS)
```

**Expected:** `17 of 17 requirement rows evidenced for test/<change record>; PASS`, and every record `OK`. It writes `evidence-check.json` beside the evidence folder; its SHA-256 goes into the promotion record. The [fixture run above](#try-the-scripts-against-fixtures-first) shows what a stage with gaps looks like.

## Promotion go/no-go criteria {#promotion-go-no-go-criteria}

*The guide's gate owners decide; the pre-flight check enforces what it can.*

| # | Criterion | Shown by | Enforced by |
|---|---|---|---|
| 0 | Every requirement row for the test stage has its evidence present and passing | `evidence-check.json` (`result: pass`, 17 of 17 rows), and `SHA256SUMS` verifying | Production `PF-10`, with `--test-evidence-check` and `promotion.test_evidence_check_sha256` |
| 1 | The test stage's smoke test is GO, from a live run in the test tenant | `smoke-report.json` (`result: pass`, `fixture: false`, `environment: test`) | Production `PF-10` |
| 2 | Production's settings point at that exact report | `promotion.test_smoke_report_sha256` equals the report's SHA-256 | Production `PF-10` |
| 3 | The CISO and identity engineering approved promotion | `promotion.approvals`, by reference to the change record | Production `PF-10` |
| 4 | Test and production share no tenant, subscription or deploy identity | The two settings files | `PF-09` with `--other` |
| 5 | Rule validation found no difference, and VK-DG-03, checked by hand at the first live run, passed | `dr-evaluate-differences.txt` is empty; the `vk-dg03-delegated` run and its `smoke` record (step 9b) | Review; `evidence.py check` fails a failed 9b record |
| 6 | The workflow's on-demand run completed, and the failure path was drilled as Chapter 05 shows | `lcw-run.json` | Review |
| 7 | The cut-over drill disabled the test OU's links and the test device kept its settings from Intune | Step 5d, the device's settings | Review |
| 8 | Machine configuration ran in audit, then apply and monitor, with no finding; the registry's mode and published version are merged in a reviewed pull request | `mc-audit-state.json`, both `provenance.json` files, the pull request | `PF-07` shows the registry the production build will use |
| 9 | The rollback ran end to end in the test stage, and the validation kit afterwards matched the baseline | The rollback scripts' output, `vk-before`, the post-rollback run | Review |
| 10 | The drift pipeline ran twice, chained, and its packages verify | The two packages in the test container | Review |

Record the go decision in `production.json`. In a POSIX shell, with the test stage's settings loaded:

```bash
sha256sum "$ADM_EVIDENCE_DIR/smoke/smoke-report.json" "$ADM_EVIDENCE_DIR/evidence-check.json"
```

Copy the first hash into `promotion.test_smoke_report_sha256` and the second into `promotion.test_evidence_check_sha256` in `production.json`, and the two approvals' references into `promotion.approvals`.

## Stage 2: production {#stage-2-production}

Production runs the same commands with `production.json`. What changes is the order: the tenant-wide pieces once, then each wave, and the rollback rule is re-enable, never re-create ([guide, Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)).

### The change record and pre-flight

*The guide's prerequisites, and the go/no-go record.*

Open the production change record and put its ID in `production.json`. Load `production.json` without `--wave`, sign in as the deploy identity, and run, in PowerShell 7:

```powershell
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --other <test-settings-file> --test-smoke-report "<test-evidence-dir>/smoke/smoke-report.json" --test-evidence-check "<test-evidence-dir>/evidence-check.json" --out $env:ADM_EVIDENCE_DIR
```

Then the live probes. Production's `PF-10` fails without the test stage's smoke report and evidence check, and a failure skips the live probes, so this run repeats them:

```powershell
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --other <test-settings-file> --test-smoke-report "<test-evidence-dir>/smoke/smoke-report.json" --test-evidence-check "<test-evidence-dir>/evidence-check.json" --live --out "$env:ADM_EVIDENCE_DIR/live"
```

**Expected:** `PF-01` to `PF-16` pass, including `PF-10`: `go/no-go: test smoke report … passed; approvals CISO, Identity engineering`. The passing run writes two evidence records in the production evidence folder, `preflight` and `promotion`, the second citing the test stage's smoke report and evidence check.

**Requirements (production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3 and CM-3(4); AC-5 Separation of Duties; FedRAMP agency use of the cloud service | Promotion only on a live passing test stage, its evidence check, and two approvers; the tenant runs on the provider's FedRAMP authorization | KSI-CMT-RVP, KSI-PIY-RIS | preflight.json PF-10; the test evidence-check.json; the approvals |

: Requirements, KSIs and evidence for this step {.striped .hover}


### Tenant-wide, once

*Gates 2, 4 and 9 for the whole tenant before any wave.*

The requirement tables of steps 1 to 8 apply here as in the test stage, and each step's evidence command runs as written, except step 6, which has its own production command in the list below; the drift step adds the locked retention policy:

**Requirements (production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7; AU-2 Event Logging; IA-5 for non-user accounts | A scheduled read-only comparison, signed in with a federated credential and no secret | KSI-MLA-EVC, KSI-MLA-LET, KSI-IAM-SNU | workflow_lint output; the first evidence package |
| AU-9 Protection of Audit Information | Evidence written once to a container with a locked retention policy | KSI-MLA-OSM | the locked retention policy (az storage container immutability-policy show) |

: Requirements, KSIs and evidence for this step {.striped .hover}

Run these test-stage steps once, with `production.json` loaded and no `--wave`:

1. [Step 1](#step-1-baseline-evidence-before-any-change), the baseline.
2. [Step 2a](#step-2-the-hr-to-entra-middleware), the dry run on the production extract, and [2b](#step-2-the-hr-to-entra-middleware), the job's safety nets. **Don't send yet.**
3. [Step 3](#step-3-dynamic-rules), the dynamic groups: created paused, validated against the production test users in the member map, then on. They grant nothing until a wave assigns them.
4. [Step 4a and 4b](#step-4-lifecycle-workflows-created-disabled), the workflow, created disabled. Run [4c](#step-4-lifecycle-workflows-created-disabled) for the one production test account in `lifecycle.test_user_id`, then disable it again:

   ```powershell
   Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $wf.id -BodyParameter @{ isEnabled = $false; isSchedulingEnabled = $false }
   ```

5. [Step 5b](#step-5-group-policy-as-code), the Intune policies: dry run, then create, unassigned. Skip 5a: production's GPOs already exist and are linked.
6. Machine configuration, from the reviewed registry, which already carries the mode. Production has no audit build, so it skips 6b and 6c and builds once, at one version above the registry's `published` value (the pull request that set the mode set `published` to the test stage's last build; with the test stage's 1.0.0 and 1.1.0, production builds `1.2.0`). Set `ADM_MC_VERSION` to it ([load the settings](#load-the-settings)), then, in PowerShell 7, as the deploy identity with the registry unchanged:

   ```powershell
   Set-Location "$env:ADM_EXAMPLES/machine-configuration"
   $env:ADM_MC_VERSION = '1.2.0'
   $mc = "$($env:ADM_MC_NAME)_$($env:ADM_MC_VERSION)"
   pwsh ./powershell/Invoke-McBuild.ps1 -Name $env:ADM_MC_NAME -Version $env:ADM_MC_VERSION -ContentUri $env:ADM_MC_CONTENT_URI -ModulePath ./mcmods -OutputPath "$env:ADM_EVIDENCE_DIR/mc"
   $ctx = New-AzStorageContext -StorageAccountName $env:ADM_MC_STORAGE -UseConnectedAccount
   Set-AzStorageBlobContent -Container $env:ADM_MC_CONTAINER -File "$env:ADM_EVIDENCE_DIR/mc/$mc/$mc.zip" -Blob "$mc.zip" -Context $ctx
   $policyId = (Get-Content ./config/releases.json -Raw | ConvertFrom-Json).configurations.$($env:ADM_MC_NAME).policyId
   $policyFile = (Get-ChildItem "$env:ADM_EVIDENCE_DIR/mc/$mc/policy/*.json")[0].FullName
   $def = New-AzPolicyDefinition -Name $policyId -Policy $policyFile
   python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind policy-definition --id $policyId
   ```

   Then create the tenant-wide assignment, with its identity and the roles the definition names, as step 6d does. This is the only place production creates the `ApplyAndMonitor` assignment; the waves add servers to its scope and create no assignment:

   ```powershell
   $scope = "/subscriptions/$env:ADM_SUBSCRIPTION_ID/resourceGroups/$env:ADM_RESOURCE_GROUP"
   New-AzPolicyAssignment -Name 'adm-mc-apply' -PolicyDefinition $def -Scope $scope -PolicyParameterObject @{ IncludeArcMachines = 'true' } -IdentityType SystemAssigned -Location $env:ADM_LOCATION | Out-Null
   python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind policy-assignment --id adm-mc-apply --name $scope
   $paPrincipal = az policy assignment show --name adm-mc-apply --scope $scope --query identity.principalId -o tsv
   foreach ($roleId in (Get-Content $policyFile -Raw | ConvertFrom-Json).properties.policyRule.then.details.roleDefinitionIds) {
       $raId = az role assignment create --assignee-object-id $paPrincipal --assignee-principal-type ServicePrincipal --role ($roleId -split '/')[-1] --scope $scope --query id -o tsv
       python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind role-assignment --id $raId
   }
   az policy assignment show --name adm-mc-apply --scope $scope > "$env:ADM_EVIDENCE_DIR/mc-assignment.json"
   python "$env:ADM_DEPLOY/evidence.py" add --settings $env:ADM_SETTINGS --step mc --command "Invoke-McBuild $env:ADM_MC_VERSION (ApplyAndMonitor); definition; assignment adm-mc-apply" --result pass --file "$env:ADM_EVIDENCE_DIR/mc/$mc/provenance.json" --file "$env:ADM_EVIDENCE_DIR/mc-assignment.json"
   ```

   This is production's own `mc` evidence command: it cites the one provenance file and the assignment record that production writes, not the test stage's `_1.0.0` and `_1.1.0` files or `mc-audit-state.json`. Each wave's servers join in [each wave](#each-wave).
7. [Step 8](#step-8-the-drift-pipeline), the drift pipeline, and then lock the evidence container's retention policy. Learn recommends locking within a reasonable time, typically less than 24 hours, and a locked policy can't be deleted or shortened:[^c10-immutable][^c10-immutable-container]

   ```bash
   ETAG="$(az storage container immutability-policy show --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --query etag --output tsv)"
   az storage container immutability-policy lock --resource-group "$ADM_RESOURCE_GROUP" --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --if-match "$ETAG"
   python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind retention-policy --id "$ADM_EVIDENCE_CONTAINER" --name "$ADM_EVIDENCE_ACCOUNT" --note locked
   az storage container immutability-policy show --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" > "$ADM_EVIDENCE_DIR/retention-policy.json"
   python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step drift --command "immutability-policy lock" --result pass --file "$ADM_EVIDENCE_DIR/retention-policy.json"
   ```

### Each wave

*Gate 8: each wave by attribute query, leaver first, drift-clean before the next.*

**Requirements (production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3; AC-2; CM-6 | Each wave by attribute query, leaver first, smoke-tested before the next | KSI-CMT-LMC, KSI-IAM-AAM, KSI-SVC-ACM | smoke-wave-*/smoke-report.json per wave |

: Requirements, KSIs and evidence for this step {.striped .hover}

Load `production.json` with `--wave <wave-id>`. The wave's OU, Intune group and Arc wave replace the defaults. Then, in this order (leaver first, as the guide requires):

1. **The leaver workflow on.** For the first wave only, turn scheduling on. In PowerShell 7, as the deploy identity:

   ```powershell
   $wf = (Invoke-MgGraphRequest -Method GET -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows?`$filter=displayName eq '$env:ADM_LCW_WORKFLOW_NAME'").value[0]
   Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $wf.id -BodyParameter @{ isEnabled = $true; isSchedulingEnabled = $true }
   ```

   Workflows from the real-time termination template run on demand only,[^c10-lcw-activate] so scheduling does nothing for that template; the leaver runs on demand from the HR event. For a scheduled template, Learn says the engine checks every three hours by default.[^c10-lcw-schedule]

2. **HR records for the wave.** [Step 2c](#step-2-the-hr-to-entra-middleware), five records, reconcile; then [2d](#step-2-the-hr-to-entra-middleware) with the wave's extract in `hcm_entra.extract_path`.
3. **Intune for the wave, then the GPO links off.** [Step 5c](#step-5-group-policy-as-code), assigning the policies to the wave's group; after the wave's devices check in, [step 5d](#step-5-group-policy-as-code), which disables the GPO links on the wave's OU and records them as `gpo-link-disabled`.
4. **Servers for the wave.** [Step 7b](#step-7-ansible-beside-arc-check-mode-first): plan, check mode, connect. Then [step 6b](#step-6-machine-configuration-audit-before-apply)'s role assignment and tag for each server the wave connects, so the tenant-wide `adm-mc-apply` assignment made in the Tenant-wide list reaches them. Run only the role assignment and tag lines of 6b: production's assignment already exists, so 6b's `New-AzPolicyAssignment` line is not run.
5. **Smoke test the wave.** [Step 9](#step-9-smoke-test), with `--out "$env:ADM_EVIDENCE_DIR/smoke-wave-$env:ADM_WAVE" --step waves`, so its evidence record counts for the wave row.

**Expected:** each wave's smoke test is GO before the next wave starts. Start with the pilot division, then two or three divisions at a time, each drift-clean before the next ([guide, Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)).

### First-week monitoring with drift

*Gate 8's seven days of sole-source proof, and Gate 9.*

**Requirements (production).**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7; SI-4 System Monitoring | Seven days of chained, verified drift packages per wave | KSI-MLA-EVC, KSI-MLA-RVL | the daily packages and their verify output |

: Requirements, KSIs and evidence for this step {.striped .hover}

For seven days after each wave, every change to the wave's population must trace to an HR event before the ticket path for account creation closes ([guide, Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)). The drift pipeline runs every day on its schedule. Each morning, in a POSIX shell with `production.json` loaded, fetch the newest package, verify it, and read the summary:

```bash
mkdir -p "$ADM_EVIDENCE_DIR/daily"
NEWEST="$(az storage blob list --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --auth-mode login --query "sort_by([?ends_with(name, 'EVIDENCE-MANIFEST.json')], &properties.creationTime)[-1].name" -o tsv)"
PREFIX="${NEWEST%/EVIDENCE-MANIFEST.json}"
az storage blob download-batch --account-name "$ADM_EVIDENCE_ACCOUNT" --source "$ADM_EVIDENCE_CONTAINER" --pattern "$PREFIX/*" --destination "$ADM_EVIDENCE_DIR/daily" --auth-mode login
python "$ADM_EXAMPLES/drift-pipeline/python/drift_pipeline.py" verify "$ADM_EVIDENCE_DIR/daily/$PREFIX"
cat "$ADM_EVIDENCE_DIR/daily/$PREFIX/drift/drift-summary.md"
python "$ADM_EXAMPLES/drift-pipeline/python/drift_pipeline.py" verify "$ADM_EVIDENCE_DIR/daily/$PREFIX" > "$ADM_EVIDENCE_DIR/daily/$PREFIX-verify.txt" && RESULT=pass || RESULT=fail
python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step monitor --command "daily drift package $PREFIX" --result "$RESULT" \
  --file "$ADM_EVIDENCE_DIR/daily/$PREFIX/EVIDENCE-MANIFEST.json" --file "$ADM_EVIDENCE_DIR/daily/$PREFIX-verify.txt"
```

At the end of the week, three rows still have no production record, because the waves' smoke tests count only for the waves row and the production list runs neither a package nor a rollback. With `production.json` loaded and no `--wave`, close them first:

1. **Smoke and package.** Run [step 9](#step-9-smoke-test) once without `--step waves` (its default `--out`), which writes the `smoke` record, skipping 9b, a first-live-run step for the test stage, and then [step 10](#step-10-capture-the-evidence), which writes the `package` record.
2. **Rollback.** Run only `rollback.py plan` from [step 11](#step-11-roll-back) and review the scripts it writes. Don't run them: production's rollback is by wave, on a NO-GO. The row's text says the rollback is run in the test stage, which it was, so for production record the reviewed plan as the passing evidence. In a POSIX shell:

   ```bash
   python "$ADM_DEPLOY/evidence.py" add --settings "$ADM_SETTINGS" --step rollback --command "rollback.py plan; reviewed, not run" --result pass \
     --file "$ADM_EVIDENCE_DIR/rollback-cloud.ps1" --file "$ADM_EVIDENCE_DIR/rollback-ad.ps1" --file "$ADM_EVIDENCE_DIR/rollback-manual.md" --file "$ADM_EVIDENCE_DIR/deploy-record.json"
   ```

Then run [step 12](#step-12-check-the-evidence) with `production.json` loaded: every production row, the promotion, waves and monitoring rows included, should be evidenced, and its `evidence-check.json` goes to the ISSO with the week's packages.

**Expected:** a package for every day, each verifying, each chained to the day before; new findings only where an HR event explains them; VK-DG-05 within the membership-change threshold. A missing day is a break in the chain, and an unexplained new finding opens an issue that the CISO decides (guide, Gate 9: severity and response times are the CISO's). Also read the provisioning logs daily, as [step 2c](#step-2-the-hr-to-entra-middleware) does, and the workflow's run history, as [step 4c](#step-4-lifecycle-workflows-created-disabled) does.

### Roll back in production

*The guide's [rollback at a glance](../guides/attribute-driven-migration-implementation.md#rollback): re-enable, never re-create.*

The commands are the test stage's [step 11](#step-11-roll-back), with `production.json` loaded (with `--wave <wave-id>` to roll back one wave, whose changes are the newest in the record). The script differs because the stage does:

| Change | Test stage rollback | Production rollback |
|---|---|---|
| Provisioning job | Paused | Paused; correct records at the HR source, never in the directory |
| Dynamic group | Deleted | Unassigned: removed from every assignment the wave made, in the admin center; the group and the old group it replaces stay in place (guide, Gate 4) |
| Lifecycle workflow | Disabled, then deleted | Disabled |
| GPO link the stage created | Disabled | Disabled |
| GPO link the stage disabled | Re-enabled | Re-enabled, never re-created (guide, Gates 5 and 8) |
| Intune policy | Deleted | The wave's group removed from its assignments, in the admin center |
| Policy assignment | Removed | Removed. Learn says removing the assignment removes its guest assignments;[^c10-mc-assignments] a configuration already applied by `ApplyAndMonitor` stays on the server until something changes it (*design guidance*: plan a reverse configuration if that matters) |
| Policy definition | Deleted | Kept |
| Arc server | Disconnected | Disconnected |
| Locked retention policy | — | Can't be rolled back, by design: the evidence stays |

**When to roll back a wave.** When its smoke test is NO-GO and the cause can't be fixed at the source within the change window, when an unexplained membership change exceeds the VK-DG-05 threshold, or when a leaver doesn't complete (*design guidance*; the CISO decides drift findings). Roll back the wave, not the tenant: earlier waves that are drift-clean stay.

## Evidence the ISSO keeps {#evidence-the-isso-keeps}

*Each gate's Evidence paragraph in the guide, collected per stage.*

| Stage | Evidence | From step | Guide gate |
|---|---|---|---|
| Both | The settings file (no secrets) and its SHA-256; `preflight.json` (dry and live) | Pre-flight | Prerequisites |
| Both | The validation kit's run folders before and after, each with its own manifest | 1, 9 | 2, 3, 4, 5, 9 |
| Both | The Conditional Access export before the change | 1 | 5 |
| Both | `hr-dryrun/provenance.json` and the batches' `provenance.json` and `apply-results.json`; the provisioning log extracts (keys and statuses only; `quarantine.json` goes to the audit store) | 2 | 2, 3 |
| Both | `dr-check-results.json`, `dr-evaluate-differences.txt` | 3 | 4 |
| Both | `lcw-workflow.json`, `lcw-run.json` | 4 | 7, 8 |
| Both | `gpc-apply/sync-record.json`; the GPO link states before and after | 5 | 5, 8 |
| Both | Both `provenance.json` files, `mc-audit-state.json` | 6 | 5 |
| Both | The wave plan and the playbook runs' output | 7 | 5, 8 |
| Both | `smoke-report.json` (per wave in production) | 9 | All |
| Both | The evidence package and its `verify` result | 10 | All |
| Both | `deploy-record.json` and the rollback scripts written from it | Every step, 11 | Rollback |
| Both | The `evidence/` folder: one record per step with its controls, mandates and KSI IDs, and `SHA256SUMS`; `evidence-check.json` | Every step, 12 | All |
| Test | The rollback drill's output and the post-rollback validation kit run | 11 | Rollback |
| Production | The promotion record: the test smoke report's and evidence check's SHA-256 and the approvals | Promotion | All |
| Production | Seven days of drift packages per wave, chained and verified, and the sole-source report | First week | 8, 9 |
| Production | The locked retention policy on the evidence container | Tenant-wide 7 | 9 |

## Control states and change safety for the runbook {#b19-10-control-states-and-change-safety}

This runbook deploys and enforces: dynamic groups that decide access, a leaver workflow, Intune policies that replace GPOs, machine configuration in apply mode. It already carries most of the workbook's implementation conventions ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)); this section maps them, so an assessor can find each one, and adds the two it leaves implicit, the exclusions and the control states.

**Authority:** as each step's requirements table states: Mandated where a row names a NIST control at the system's baseline, OMB M-22-09 or a BOD 25-01 required configuration; Microsoft-recommended where a step follows a Learn recommendation (certificate sign-in, locking the retention policy); everything marked *design guidance* is risk-based recommended, the program's position.
**Applies:** the guide's audience, a civilian agency in Microsoft 365 GCC ([Requirements, KSIs and evidence](#requirements-ksis-and-evidence)). Environment-dependent: GCC High and DoD use the Graph hosts in [Verified facts](#verified-facts) and the Azure Government storage suffix.

| How-template step | Where this runbook covers it |
|---|---|
| Prerequisites | [Before you start](#before-you-start) and the [pre-flight checks](#pre-flight-checks) |
| Pilot | [Stage 1, the live test](#stage-1-live-test), then the pilot division as the first production wave ([Each wave](#each-wave)) |
| Report-only or audit phase | The dry runs, groups created paused, the workflow created disabled, the Intune policies created unassigned, machine configuration in audit before apply and Ansible in check mode (steps 2 to 7) |
| Enforcement | [Each wave](#each-wave), after the [go/no-go criteria](#promotion-go-no-go-criteria) |
| Rollback | [Step 11](#step-11-roll-back) and [Roll back in production](#roll-back-in-production) |
| Exclusions | The validation kit's inputs name the governed and emergency-access groups ([Made before the runbook starts](#made-before-the-runbook-starts)); the validation kit's VK-CA-01, run in step 1 (`vk-before`) and again in step 9 (`vk-after`), reports any Conditional Access policy that doesn't exclude the emergency-access group, and step 1's Conditional Access export is the record of the exclusions before the change. *Program decision:* emergency access accounts are kept out of every dynamic rule and every wave's population, the program's settled position ([WD-150](../../about/decision-register.md#wd-150)). An enabled account with no worker record is on the validation kit's exception list with an owner, or it is a finding ([guide, Gate 2](../guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes)) |
| Telemetry | The provisioning logs, the workflow's run history and the drift pipeline ([First-week monitoring](#first-week-monitoring-with-drift)) |
| Evidence | [Evidence the ISSO keeps](#evidence-the-isso-keeps) and the checklist below |
| Day-two ownership | The drift pipeline, owned by the platform engineer, with the CISO deciding each finding ([guide, Gate 9](../guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true)) |

**Change safety**

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The test stage: test tenant, test subscription and test forest | `evidence.py check` passes every row; the go/no-go criteria are met |
| 1 | The pilot division, the first production wave | Its smoke test is GO and seven days of drift packages verify |
| 2 | Two or three divisions at a time | The same, wave by wave |
| 3 | The last wave; the OU tree retired | Every wave drift-clean; the sole-source report for the week |

- **Emergency access:** outside every rule and wave; VK-CA-01 in `vk-before` and `vk-after` shows the emergency-access group still excluded from every policy.
- **Change window:** each stage's change record and window ([Approvals and the change record](#approvals-and-the-change-record)).
- **Backout triggers:** [When to roll back a wave](#roll-back-in-production), set before the wave.
- **Post-change validation:** [Step 9, the smoke test](#step-9-smoke-test), after each wave.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | The guide's gates and the settings file | The approved settings file and its SHA-256 |
| Configured | Steps 2 to 8, each created paused, disabled, unassigned or in audit | Each step's evidence record and the files it cites |
| Enforced | Each wave | The wave's smoke report and the deploy record |
| Evidenced | Step 9 and step 12 | `smoke-report.json` per wave and `evidence-check.json` |
| Operated | The drift pipeline from the first week on | The chained, verified daily packages |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**Evidence checklist**

- [ ] **Configuration:** the settings file, the Conditional Access export, the Intune and machine configuration provenance files, kept in the stage's evidence folder
- [ ] **Operational:** the daily drift packages and the provisioning log extracts, in the container with the locked retention policy
- [ ] **Test:** each stage's smoke report and the test stage's rollback drill (expected and observed outcome, date, tester)
- [ ] **Exception:** the validation kit's exception list with owners and dates, and any drift finding the CISO accepted, with approver and expiry
- [ ] **Assessor-ready artifact:** `evidence-check.json` with `SHA256SUMS`, and the evidence package from step 10

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Identity, with Devices for the Intune and machine configuration steps
- **CISA ZTMM pillar:** Identity and Devices
- **Depends on:** HR as the authoritative source ([Book 03](../b03-hr-identity/index.md)); Conditional Access and emergency access ([Book 04](../b04-access/index.md)); the device baselines ([Book 05](../b05-devices/index.md))
- **Attack chain interrupted:** access that outlives a person's job or employment because nothing removed it (Persistence), and configuration that drifts from its baseline unnoticed (Defense Evasion)
:::

## Step-to-gate map {#step-to-gate-map}

| Step | What it does | Guide gate |
|---|---|---|
| Before you start | Roles, approvals, change record, identities | [Prerequisites](../guides/attribute-driven-migration-implementation.md#prerequisites) |
| Pre-flight | Settings, kits, identities, cloud, go/no-go | [Prerequisites](../guides/attribute-driven-migration-implementation.md#prerequisites) |
| 1 | Baseline validation kit run and CA export | [Gate 2](../guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), [Gate 5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) |
| 2 | HR middleware: dry run, job safety nets, five records, the rest | [Gate 2](../guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), [Gate 3](../guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) |
| 3 | Dynamic groups: offline check, paused, validated, on | [Gate 4](../guides/attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units) |
| 4 | Leaver workflow: disabled, checked, one on-demand run | [Gate 7](../guides/attribute-driven-migration-implementation.md#gate-7-prove-a-mover-across-the-tracks), [Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| 5 | GPOs to the test OU; Intune dry run, create, assign; links disabled | [Gate 5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions), [Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| 6 | Machine configuration: audit, then apply and monitor | [Gate 5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) |
| 7 | Arc onboarding: role, plan, check mode, connect | [Gate 5](../guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions), [Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| 8 | Drift pipeline: credential, container, workflow, baseline | [Gate 9](../guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true) |
| 9 | Smoke test | Each gate's Validate step |
| 10 | Evidence package | Each gate's Evidence |
| 11 | Rollback | [Rollback at a glance](../guides/attribute-driven-migration-implementation.md#rollback) |
| 12 | Evidence check | Each gate's Evidence; the promotion criteria |
| Promotion | Go/no-go criteria | Gate owners: CISO, identity engineering |
| Waves | Leaver first, HR, Intune and GPO links, servers, smoke | [Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) |
| First week | Daily drift packages, sole-source proof | [Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree), [Gate 9](../guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true) |

## Verified facts

| Item | Value | Source |
|---|---|---|
| Azure CLI sign-in with a certificate | `az login --service-principal --username <app-id> --certificate <pem> --tenant <tenant>`; the PEM holds the private key and certificate together; PKCS#12 doesn't work; certificate-based authentication recommended | [^c10-azcli-cert] |
| Azure PowerShell sign-in with a certificate | `Connect-AzAccount -ServicePrincipal -ApplicationId -Tenant -CertificateThumbprint`; the certificate is read from the local store | [^c10-azps-cert] |
| Graph PowerShell app-only | `Connect-MgGraph -ClientId -TenantId -CertificateThumbprint`; `Get-MgContext` shows `AuthType` `AppOnly`; `-Environment` and `-LoginHint` are parameters | [^c10-mggraph] |
| Graph token from the Azure CLI | `az account get-access-token --resource <endpoint>` | [^c10-gettoken] |
| Graph hosts | GCC on the worldwide endpoints; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us` | [^c10-graph-clouds] |
| Storage suffix | `core.windows.net` commercial; `core.usgovcloudapi.net` Azure Government | [^c10-storage-suffix] |
| Sending HR records | `SynchronizationData-User.Upload` (application), or `.OwnedBy` | [^c10-bulkupload] |
| Provisioning job safety | Notification email mandatory (empty quarantines the job at start); **Start provisioning** puts the job in listen mode; accidental-deletions prevention with a threshold, set by at least an Application Administrator | [^c10-inbound-configure] [^c10-accidental] |
| Pausing the job | `POST /servicePrincipals/{id}/synchronization/jobs/{jobId}/pause`; state persisted; `Synchronization.ReadWrite.All`, or `Application.ReadWrite.OwnedBy` for an owner | [^c10-pause] |
| Provisioning logs | `AuditLog.Read.All` and `Directory.Read.All` | [^c10-provlogs] |
| Creating a group | Delegated `Group.ReadWrite.All`; application `Group.Create` | [^c10-newgroup] |
| Evaluating a rule | `POST /beta/groups/evaluateDynamicMembership`; delegated only (`User.Read.All` or `Device.Read.All` with a rule); application not supported; beta | [^c10-evaluate] |
| Creating a workflow | Admin center: **ID Governance** > **Lifecycle workflows** > **Create a workflow**; a new workflow is disabled by default; Graph: `isEnabled` optional, default `true`; up to 100 workflows a tenant on the limits page (50 on the licensing page; the program plans for 50, as [Chapter 05](05-lifecycle-workflows-custom-extensions.md) does) | [^c10-lcw-create] [^c10-lcw-resource] |
| Running on demand | `POST …/workflows/{id}/activate` with `subjects`; the workflow must be enabled; conditions ignored; `LifecycleWorkflows-Workflow.Activate`; Lifecycle Workflows Administrator; real-time termination workflows on demand only; global, US Government L4 and L5 | [^c10-lcw-activate] |
| Run results | `GET …/workflows/{id}/userProcessingResults` | [^c10-lcw-status] |
| Scheduling | `isEnabled` and `isSchedulingEnabled` both true; checks every three hours by default, configurable from 1 to 24 | [^c10-lcw-schedule] |
| GPOs | `Import-GPO -BackupGpoName -Path -TargetName -CreateIfNeeded`; `New-GPLink` and `Set-GPLink -LinkEnabled Yes|No`; Link GPOs permission, by default domain and enterprise administrators | [^c10-importgpo] [^c10-newgplink] [^c10-setgplink] |
| Intune assignment | **Devices** > **Manage devices** > **Configuration** > policy > **Properties** > **Assignments** > **Edit** | [^c10-intune-assign] |
| Machine configuration modes | `Audit`, `ApplyAndMonitor` (applied once, drift reported, not corrected), `ApplyAndAutoCorrect`; case sensitive | [^c10-mc-remediation] |
| Machine configuration definitions | `New-AzPolicyDefinition`; Resource Policy Contributor recommended; system-assigned identity downloads the package with Storage Blob Data Reader and anonymous access off | [^c10-mc-policy] |
| Assignments with an identity | `deployIfNotExists` assignments need an identity and a location; roles granted by hand outside the portal; changing a definition doesn't update the assignment | [^c10-assignment-identity] [^c10-remediate] |
| Compliance | `Start-AzPolicyComplianceScan -ResourceGroupName`; `Get-AzPolicyState -ResourceGroupName -PolicyAssignmentName`; remediation with `Start-AzPolicyRemediation` | [^c10-policy-scan] [^c10-policy-state] [^c10-start-remediation] |
| Arc onboarding with Ansible | Azure Connected Machine Onboarding at subscription or resource group scope; `Microsoft.HybridCompute` and `Microsoft.GuestConfiguration` registered; managed identity recommended for production; `az connectedmachine show --query identity.principalId` | [^c10-arc-ansible] |
| Evidence retention | Lock within a reasonable time, typically under 24 hours; a locked policy can't be deleted or shortened; lock with the policy's ETag | [^c10-immutable] [^c10-immutable-container] |
| Federated credential | Issuer `https://token.actions.githubusercontent.com`; environment subject; one audience per cloud | [^c10-fic] |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A secret in the settings file | It travels with the change record and leaks | The loader refuses secret-looking keys and values; certificates and a federated credential only |
| The production file used in the test stage, or the reverse | Test commands change production | Separate tenants, subscriptions and identities, checked by `PF-09`; the live probes compare the signed-in tenant with the file |
| Promotion on a fixture or failing test run | Production starts on evidence that proves nothing | `PF-10`: the report must be live, passing, test-stage, and match the hash in `production.json` |
| A rule that matches the wrong people | Access granted or removed for hundreds at once | Groups created paused; Learn's evaluate call against named users before processing starts |
| A workflow that runs before anyone has tested it | Leavers processed in bulk on the first schedule | Created in the admin center, where it starts disabled; on demand for one user first; scheduling only in production, once, at the first wave |
| A GPO deleted at cut-over | The one-command rollback is gone | Links disabled and recorded as `gpo-link-disabled`; the rollback re-enables |
| Apply before audit | A server changes before anyone knows what the package does there | Audit assignment first; apply and monitor only after its result, as a new version |
| An Ansible run that connects servers by accident | Servers onboard outside the wave | Wave plan, then the playbook's own check mode; `confirm_change=true` only on the third command |
| A DoD token from the wrong Graph host | Calls fail, or go to the wrong cloud | The token is requested for `ADM_GRAPH`, from the settings' cloud |
| Evidence named but never produced | The ISSO receives a list of file names, and the files are missing or changed | Each step writes an evidence record with the cited files' hashes; `evidence.py check` fails a missing, failing, fixture-mode or changed record; promotion needs a passing check |
| A rollback nobody wrote down | The change can't be undone in the window | Every step records its change; the smoke test fails a change with no rollback (`SM-13`) |
| A locked policy in the test stage | The test account can't be deleted until retention ends | Locked only in production; the test stage leaves it unlocked |
| Personal data in the change record | The record is read more widely than the audit store | `quarantine.json` goes to the audit store; the evidence package holds keys and statuses |

## Checklist

- [ ] Both settings files load with no refusal, and live outside the repository with the change records.
- [ ] Pre-flight passes, dry and live, for each stage; production's `PF-10` names the test smoke report and both approvals.
- [ ] Every change in each stage is in `deploy-record.json`, and the rollback plan written from it was reviewed.
- [ ] The test stage's rollback ran end to end, and the validation kit matched the baseline afterwards.
- [ ] Rule validation found no difference; the groups were paused until it did.
- [ ] At the first live run, the Groups Administrator ran VK-DG-03 by hand, delegated, and it passed (step 9b); it is the only check the smoke test allows to end unverified.
- [ ] The workflow started disabled, ran on demand for one user, and was scheduled only in production.
- [ ] GPO links were disabled, never deleted.
- [ ] Machine configuration ran in audit before apply and monitor, and the registry change was merged before production.
- [ ] Each production wave's smoke test was GO before the next wave.
- [ ] Every requirement row has a passing evidence record, for the test stage before promotion and for production at the end of the first week, and `sha256sum -c SHA256SUMS` passes in each evidence folder.
- [ ] Seven days of chained, verified drift packages per wave, and the locked retention policy, are with the ISSO.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 09 — Drift Pipelines and Evidence to the ISSO](09-drift-pipelines-and-evidence.md) · [Workbook index](index.md)
:::

[^c10-azcli-cert]: Microsoft Learn, "Sign into Azure with a service principal using the Azure CLI," <https://learn.microsoft.com/cli/azure/authenticate-azure-cli-service-principal>, and "Use an Azure service principal with certificate-based authentication," <https://learn.microsoft.com/cli/azure/azure-cli-sp-tutorial-3> (accessed Nov 2, 2026).
[^c10-azps-cert]: Microsoft Learn, "Sign in to Azure PowerShell non-interactively for automation scenarios," <https://learn.microsoft.com/powershell/azure/authenticate-noninteractive> (accessed Nov 2, 2026).
[^c10-mggraph]: Microsoft Learn, "Connect-MgGraph," <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph?view=graph-powershell-1.0>, and "Use app-only authentication with the Microsoft Graph PowerShell SDK," <https://learn.microsoft.com/powershell/microsoftgraph/app-only?view=graph-powershell-1.0> (accessed Nov 2, 2026).
[^c10-gettoken]: Microsoft Learn, "az account get-access-token," <https://learn.microsoft.com/cli/azure/account> (accessed Nov 2, 2026).
[^c10-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Nov 2, 2026); the same page Chapter 09 cites.
[^c10-storage-suffix]: Microsoft Learn, "Managing Storage in the Azure independent clouds using PowerShell," section "Endpoint suffix," <https://learn.microsoft.com/azure/storage/common/storage-powershell-independent-clouds> (accessed Nov 2, 2026).
[^c10-bulkupload]: Microsoft Learn, "Perform bulkUpload," <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-post-bulkupload?view=graph-rest-1.0> (accessed Nov 2, 2026); the page Chapter 01 cites.
[^c10-inbound-configure]: Microsoft Learn, "Configure API-driven inbound provisioning app," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-configure-app> (accessed Nov 2, 2026).
[^c10-accidental]: Microsoft Learn, "Enable accidental deletions prevention in the Microsoft Entra provisioning service," <https://learn.microsoft.com/entra/identity/app-provisioning/accidental-deletions> (accessed Nov 2, 2026).
[^c10-pause]: Microsoft Learn, "synchronizationJob: pause," <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-pause?view=graph-rest-1.0>, and "Suspend-MgServicePrincipalSynchronizationJob" (permissions) (accessed Nov 2, 2026).
[^c10-provlogs]: Microsoft Learn, "List provisioningObjectSummary," <https://learn.microsoft.com/graph/api/provisioningobjectsummary-list?view=graph-rest-1.0> (accessed Nov 2, 2026); the page Chapter 01 cites.
[^c10-newgroup]: Microsoft Learn, "Create group," section "Permissions," <https://learn.microsoft.com/graph/api/group-post-groups?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^c10-evaluate]: Microsoft Learn, "group: evaluateDynamicMembership," <https://learn.microsoft.com/graph/api/group-evaluatedynamicmembership?view=graph-rest-beta> (accessed Nov 2, 2026); the page Chapter 04 cites.
[^c10-lcw-create]: Microsoft Learn, "Create a lifecycle workflow," <https://learn.microsoft.com/entra/id-governance/create-lifecycle-workflow>, and "Create workflow" (Graph), <https://learn.microsoft.com/graph/api/identitygovernance-lifecycleworkflowscontainer-post-workflows?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^c10-lcw-resource]: Microsoft Learn, "workflow resource type," section "Properties" (`isEnabled`), <https://learn.microsoft.com/graph/api/resources/identitygovernance-workflow?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^c10-lcw-activate]: Microsoft Learn, "workflow: activate," <https://learn.microsoft.com/graph/api/identitygovernance-workflow-activate?view=graph-rest-1.0>, and "Run a workflow on-demand," <https://learn.microsoft.com/entra/id-governance/on-demand-workflow> (accessed Nov 2, 2026).
[^c10-lcw-status]: Microsoft Learn, "Automate employee offboarding tasks after their last day of work using Lifecycle Workflows APIs," section "Check tasks and workflow status," <https://learn.microsoft.com/graph/tutorial-lifecycle-workflows-scheduled-leaver> (accessed Nov 2, 2026).
[^c10-lcw-schedule]: Microsoft Learn, "Automate employee offboarding tasks after their last day of work using Lifecycle Workflows APIs," section "Schedule the workflow to run automatically," <https://learn.microsoft.com/graph/tutorial-lifecycle-workflows-scheduled-leaver> (accessed Nov 2, 2026).
[^c10-importgpo]: Microsoft Learn, "Import-GPO," <https://learn.microsoft.com/powershell/module/grouppolicy/import-gpo> (accessed Nov 2, 2026).
[^c10-newgplink]: Microsoft Learn, "New-GPLink," <https://learn.microsoft.com/powershell/module/grouppolicy/new-gplink> (accessed Nov 2, 2026).
[^c10-setgplink]: Microsoft Learn, "Set-GPLink," <https://learn.microsoft.com/powershell/module/grouppolicy/set-gplink> (accessed Nov 2, 2026).
[^c10-intune-assign]: Microsoft Learn, "Assign policies in Microsoft Intune," <https://learn.microsoft.com/intune/device-configuration/assign-device-profile> (accessed Nov 2, 2026).
[^c10-mc-remediation]: Microsoft Learn, "Remediation options for machine configuration," <https://learn.microsoft.com/azure/governance/machine-configuration/concepts/remediation-options> (accessed Nov 2, 2026); the page Chapter 07 cites.
[^c10-mc-policy]: Microsoft Learn, "How to create custom machine configuration policy definitions," <https://learn.microsoft.com/azure/governance/machine-configuration/how-to/create-policy-definition> (accessed Nov 2, 2026); the page Chapter 07 cites.
[^c10-mc-assignments]: Microsoft Learn, "Understand machine configuration assignment resources," <https://learn.microsoft.com/azure/governance/machine-configuration/concepts/assignments> (carried forward from Chapter 07, accessed Oct 30, 2026; not reread for this chapter).
[^c10-assignment-identity]: Microsoft Learn, "Azure Policy assignment structure," section "Identity," <https://learn.microsoft.com/azure/governance/policy/concepts/assignment-structure> (accessed Nov 2, 2026).
[^c10-remediate]: Microsoft Learn, "Remediate non-compliant resources with Azure Policy," <https://learn.microsoft.com/azure/governance/policy/how-to/remediate-resources> (accessed Nov 2, 2026).
[^c10-policy-scan]: Microsoft Learn, "Start-AzPolicyComplianceScan," <https://learn.microsoft.com/powershell/module/az.policyinsights/start-azpolicycompliancescan>, and "Get compliance data of Azure resources," <https://learn.microsoft.com/azure/governance/policy/how-to/get-compliance-data> (accessed Nov 2, 2026).
[^c10-policy-state]: Microsoft Learn, "Quickstart: Create a policy assignment to identify non-compliant resources using Azure PowerShell," <https://learn.microsoft.com/azure/governance/policy/assign-policy-powershell> (accessed Nov 2, 2026).
[^c10-start-remediation]: Microsoft Learn, "Tutorial: Adding user assigned managed identities to existing virtual machines or virtual machine scale sets," step using `Start-AzPolicyRemediation`, <https://learn.microsoft.com/azure/governance/policy/tutorials/modify-virtual-machine-identity> (accessed Nov 2, 2026).
[^c10-arc-ansible]: Microsoft Learn, "Connect machines to Azure Arc at scale with Ansible," <https://learn.microsoft.com/azure/azure-arc/servers/onboard-ansible-playbooks> (accessed Nov 2, 2026); the page Chapter 08 cites.
[^c10-immutable]: Microsoft Learn, "Store business-critical blob data with immutable storage in a write once, read many (WORM) state," <https://learn.microsoft.com/azure/storage/blobs/immutable-storage-overview> (accessed Nov 2, 2026); the page Chapter 09 cites.
[^c10-immutable-container]: Microsoft Learn, "Configure immutability policies for containers," <https://learn.microsoft.com/azure/storage/blobs/immutable-policy-configure-container-scope>, and "az storage container immutability-policy," <https://learn.microsoft.com/cli/azure/storage/container/immutability-policy> (accessed Nov 2, 2026).
[^c10-fic]: Microsoft Learn, "Configure an app to trust an external identity provider," <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> (carried forward from Chapter 09, accessed Oct 30, 2026; not reread for this chapter).
[^c10-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020 (updated December 10, 2020; Release 5.2.0, August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026, as verified in the Attribute-Driven Migration companion guide and Book 13, Appendix A, which also gives each control's baseline).
[^c10-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III and §III.A–E, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 21, 2026, as verified in Book 01, Appendix A).
[^c10-bod2501]: Cybersecurity and Infrastructure Security Agency, BOD 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services>, and its required configurations page (accessed Oct 20, 2026, as verified in Book 02, Appendix A).
[^c10-fedramp-agency]: FedRAMP, "Agency Use of FedRAMP Certified Cloud Services," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/reference/agency-use/> (accessed Oct 21, 2026, as listed in Book 13, Appendix A).
[^c10-gcc]: Microsoft Learn, "Plan for Microsoft 365 Government - GCC deployments" (GCC "provides compliance with US government requirements for cloud services, including FedRAMP Moderate"), <https://learn.microsoft.com/microsoftteams/plan-for-government-gcc> (accessed Oct 20, 2026, as verified in Book 03, Chapter 01).
[^c10-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, indicator statements and "Related SP 800-53 Controls," including the control mapping updates of October 13, 2026, <https://www.fedramp.gov/2026/reference/key-security-indicators/> (accessed Oct 21, 2026, as verified in Book 13, Appendix A).
