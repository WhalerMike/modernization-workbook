---
title: "Chapter 10 — Deploying to Test and Production"
description: "The runbook that takes the Attribute-Driven Migration kits past the chapters' test-tenant steps: one settings file per stage with no secrets, pre-flight checks, a live test stage in an Entra test tenant, an Azure test subscription with Arc-enabled test servers and a test AD forest, a go/no-go record, then production in waves, with a smoke test, first-week drift monitoring, rollback and the evidence the ISSO keeps at each stage. Every step is a command block or an exact admin center path, tied to the implementation guide's gate it fulfils."
doc-type: workbook-chapter
audience: [Technical]
family: b19-developer-workbook
book: B19
part: How
series-order: 10
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---
# Chapter 10 — Deploying to Test and Production

*A lab proves the code. A runbook proves the change: the same commands, against a test environment and then production, with the evidence and the way back written down before anyone starts.*

::: {.callout-note}
## In this chapter
The deployment runbook for everything Chapters 01 to 09 build. Each chapter ends with a short step in a test tenant. This chapter takes the kits from there to a **live test stage** (an Entra test tenant, an Azure test subscription with Arc-enabled test servers, and a test AD forest) and then to **production**. One settings file per stage holds every value the commands read, and no secrets: the same commands run against both stages. Four small scripts in `examples/drift-pipeline/deploy` do what the kits didn't: a pre-flight check, a smoke test that says go or no-go, and a rollback that records each change and writes its undo, newest first. Each step names the [implementation guide](../guides/attribute-driven-migration-implementation.md) gate it fulfils.
:::

::: {.callout-important}
## Status: held for review, not run against a live tenant
This page is new and waits for the owner's review. **Nobody has run this runbook against a live tenant, subscription or forest.** The four deploy scripts are tested against fixtures and a fake command runner (37 tests), and their dry-run output below is real, from November 2, 2026. Every other command comes from the kits' own chapters, the kits' code or Microsoft Learn, and the results given after each step are **expectations**, not observations. Run the test stage in full, and keep its evidence, before any step touches production.
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

## Placeholders {#placeholders}

The commands in this chapter contain only these placeholders. Everything else comes from the settings file.

| Placeholder | What to put there |
|---|---|
| `<settings-file>` | The path to this stage's settings file: `test.json` in the test stage, `production.json` in production ([below](#one-environment-settings-file)) |
| `<wave-id>` | Production only: the `id` of the wave you're deploying, from the `waves` list in `production.json` |

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
| Lifecycle Workflows Administrator | Creates the workflow in the admin center and runs it on demand[^c10-lcw-create][^c10-lcw-activate] |
| Domain administrator in the AD forest | Imports and links the GPOs; Learn says linking needs Link GPOs permission, which by default only domain and enterprise administrators hold[^c10-newgplink] |
| Platform engineer | Runs the Azure, machine configuration, Ansible and pipeline steps |
| CISO | Approves promotion to production with identity engineering (guide: CISO decides the control requirements and every drift finding) |
| ISSO | Receives each stage's evidence package and keeps it |

### Approvals and the change record

Each stage has its own change record; its ID goes in the settings file as `change_record`, and every recorded change and every piece of evidence carries it. The test stage needs the change manager's approval of the window. Production needs the CISO's and identity engineering's approvals, recorded by reference in `production.json` (`promotion.approvals`), and the pre-flight check refuses to pass without both (*design guidance*: the guide makes the CISO the gate owner of Gates 2 and 4 to 9, and identity engineering the decider of each wave's go or no-go).

### Made before the runbook starts

These exist before the first command, and their IDs go into the settings file. Each is made the way its chapter shows; the runbook only reads them.

| Object | Made with | Settings key |
|---|---|---|
| Three app registrations, each with a certificate and no client secret: **deploy**, **reader** and **provisioning** | The certificate goes in the operator's protected store (PEM with the key for the Azure CLI, the certificate store for PowerShell). Learn recommends certificate-based authentication for service principals[^c10-azcli-cert] | `identities.*` |
| The API-driven inbound provisioning app, its schema and mappings | [Chapter 01, test-tenant steps 1 to 3](01-the-hr-to-entra-middleware.md#lab-2-test-tenant) | `hcm_entra.*` |
| The custom task extension and its Logic App | [Chapter 05, test-tenant steps 1 to 3](05-lifecycle-workflows-custom-extensions.md#lab-2-test-tenant) | `lifecycle.extension_id` |
| Test users that stand for the rule library's fixture members, and the map of their object IDs | [Chapter 04, test-tenant step 3](04-dynamic-rules-as-code.md#lab-2-test-tenant) | `dynamic_rules.member_map` |
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
| `smoke` | — | The validation kit checks that must pass, and those allowed to end unverified (VK-DG-03, which is delegated only) |
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

Dry-run output of the last command, November 2, 2026:

```text
[4] policy-assignment  cloud  Remove-AzPolicyAssignment -Name 'adm-mc-tls-audit' -Scope '/subscriptions/22222222-2222-4222-8222-222222222201/resourceGroups/rg-adm-test'
[3] gpo-link-created   ad     Set-GPLink -Name 'FMP-Workstation-Baseline' -Target 'OU=ADM-Test,DC=test,DC=contoso,DC=example' -LinkEnabled No -Domain 'test.contoso.example'
[2] dynamic-group      cloud  Remove-MgGroup -GroupId '88888888-8888-4888-8888-888888888801'
[1] provisioning-job   cloud  Invoke-MgGraphRequest -Method POST -Uri '/v1.0/servicePrincipals/44444444-4444-4444-8444-444444444401/synchronization/jobs/API2AAD.00000000000000000000000000000000.44444444-4444-4444-8444-444444444401/pause'
rollback plan: 4 step(s), newest first: 3 cloud, 1 ad
wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-cloud.ps1
wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-ad.ps1
wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-manual.md
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
smoke test: NO-GO (5 failed) for test/CHG-TEST-0101, fixture mode; report sha256 93704ed1265a52fcac91e04d106d503708fa140eeda019eba926ea94cf56159d
```

The fixtures carry findings on purpose, so the answer is no-go and the exit code is `2`. Now ask production's pre-flight check to promote on that report:

```bash
python deploy/preflight.py --settings deploy/tests/fixtures/production.json --other $S --test-smoke-report $E/smoke/smoke-report.json
```

Dry-run output, November 2, 2026, from `PF-09` on:

```text
PASS PF-09  production and test use different tenants, subscriptions and identities
FAIL PF-10  the test smoke report's SHA-256 isn't the one in promotion.test_smoke_report_sha256; the test smoke report is test/fail, not test/pass; the test smoke report ran in fixture mode; promotion needs a live test run
SKIP PF-11  live probes not run: fix the failures above first
preflight: 1 failed, 0 warning(s); dry run (nothing signed in, nothing called)
```

A fixture report can never promote. Last, the tests:

```bash
python -m pytest deploy/tests -q
```

`37 passed` on November 2, 2026 (Windows 11, Python 3.14.3). The deploy scripts keep their own suite, apart from the 142 tests Chapter 09 runs.

## Pre-flight checks {#pre-flight-checks}

*Fulfils the guide's [prerequisites](../guides/attribute-driven-migration-implementation.md#prerequisites): the tools, the identities and the cloud are the ones the change record names.*

Load the settings and sign in as the deploy identity ([above](#sign-in)), then, in PowerShell 7:

```powershell
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --out $env:ADM_EVIDENCE_DIR
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --live --out "$env:ADM_EVIDENCE_DIR/live"
```

**Expected:** the first run passes `PF-01` to `PF-10` and prints the live probes as `DRY`. The second runs them: the Azure CLI's cloud, tenant, subscription and signed-in identity (`user.name` is the deploy identity's client ID) match the settings, the PowerShell modules are present, and both certificate files exist. Any `FAIL` stops the stage. In production the command also takes `--other` and `--test-smoke-report` ([Stage 2](#stage-2-production)).

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
| 9 | Smoke test, evidence, rollback drill | — | All |

### Step 1: baseline evidence before any change

*Gate 2 and Gate 5: the "before" state each gate's evidence compares against.*

Sign in as the reader. In PowerShell 7, run the validation kit and export the Conditional Access policies with the automation reference:

```powershell
Set-Location "$env:ADM_EXAMPLES/validation-kit"
./Invoke-ValidationKit.ps1 -OutputPath "$env:ADM_EVIDENCE_DIR/vk-before" -Track HR, DG, CA, ARC -InputPath $env:ADM_VK_INPUTS -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_READER_CLIENT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT -Option @{ Subscriptions = @($env:ADM_SUBSCRIPTION_ID) }
Import-Module "$env:ADM_EXAMPLES/ms-automation/powershell/FmwGraph.psm1"
Connect-FmwGraph -Cloud $env:ADM_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_READER_CLIENT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT
Invoke-FmwEntraTask -Task ca-export -OutDirectory "$env:ADM_EVIDENCE_DIR/ca-before"
```

**Expected:** one run folder under `vk-before` whose `ValidationManifest.json` records the test tenant's ID and mode `Live`; VK-DG-03 ends `Error`, because it is delegated only and this run is app-only ([Chapter 09](09-drift-pipelines-and-evidence.md#the-workflow)); one JSON file per Conditional Access policy in `ca-before`. Findings here are the starting point, not a failure.

### Step 2: the HR-to-Entra middleware

*Gate 2 (attributes proven) and Gate 3 (attributes flowing).*

**2a. Dry run on the stage's extract.** In a POSIX shell, write the stage's endpoint into the kit's settings and run without `--apply`. Nothing is sent:

```bash
cd "$ADM_EXAMPLES/hcm-entra"
cp config/settings.example.json config/settings.json
python -c "import json, os; p = 'config/settings.json'; s = json.load(open(p)); s['endpoint'] = os.environ['ADM_PROV_ENDPOINT']; json.dump(s, open(p, 'w'), indent=2)"
python python/hcm_to_scim.py --extract "$ADM_HR_EXTRACT" --as-of "$(date -u +%F)" --settings config/settings.json --out "$ADM_EVIDENCE_DIR/hr-dryrun"
python "$ADM_DEPLOY/smoke_test.py" --settings "$ADM_SETTINGS" --hcm-provenance "$ADM_EVIDENCE_DIR/hr-dryrun/provenance.json" --out "$ADM_EVIDENCE_DIR/smoke-hr-dryrun"
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

### Step 3: dynamic rules

*Gate 4: every rule on codes with guards, tested before it grants anything.*

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

### Step 4: Lifecycle Workflows, created disabled

*Gate 8 (leaver automation first in every wave) and Gate 7 (the workflow's run history is the mover and leaver evidence).*

**4a. Create the workflow in the admin center.** As a Lifecycle Workflows Administrator:[^c10-lcw-create]

1. **ID Governance** > **Lifecycle workflows** > **Create a workflow**, template **Real-time employee termination**.
2. **Basics**: the name in `lifecycle.workflow_name`. **Review tasks**: **Add task** > **Run a custom task extension**, and choose the extension in `lifecycle.extension_id`, after the template's own tasks.
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

**Expected:** the activate call returns `204 No Content`, and `lcw-run.json` shows one user processing result for the test user, ending `completed`, with the custom task's result from the Logic App ([Chapter 05](05-lifecycle-workflows-custom-extensions.md#lab-2-test-tenant)).[^c10-lcw-activate][^c10-lcw-status] In the test stage, leave scheduling off: production turns it on per wave.

### Step 5: Group Policy as code

*Gate 5 (each setting moved to one owner) and Gate 8 (a wave's GPO links disabled, never deleted).*

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

### Step 6: machine configuration, audit before apply

*Gate 5 (servers: the convention handed to the Arc track) and Learn's remediation order: audit, then apply and monitor.*

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
python "$env:ADM_DEPLOY/rollback.py" add --settings $env:ADM_SETTINGS --kind policy-assignment --id adm-mc-audit --name $scope
```

The `ConfigOwner` tag is the owner filter the release registry adds to the definition; an untagged server stays out of scope ([Chapter 07](07-machine-configuration-packages.md)). `az connectedmachine show --query identity.principalId` is Learn's own command for an Arc server's identity.[^c10-arc-ansible]

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

### Step 7: Ansible beside Arc, check mode first

*Gate 5 (servers onboard with their owner tags from the CMDB) and Gate 8 (servers move by wave).*

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
ansible-playbook playbooks/05_arc_wave_plan.yml -e onboarding_wave="$ADM_ARC_WAVE"
ansible-playbook "$ADM_ARC_PLAYBOOK" -e onboarding_wave="$ADM_ARC_WAVE"
```

**Expected:** the wave plan lists the wave's servers with both owners and stops on a production server in a pilot wave or a missing patch owner; the second command, in check mode, reports what it would send and changes nothing on any server ([Chapter 08](08-ansible-beside-arc.md#lab-2-test-subscription-and-a-disposable-server)). Then connect:

```bash
ansible-playbook "$ADM_ARC_PLAYBOOK" -e onboarding_wave="$ADM_ARC_WAVE" -e confirm_change=true
for h in $(python -c "import csv, os; print(' '.join(r['hostname'] for r in csv.DictReader(open(os.environ['CMDB_CSV'])) if r.get('arc_wave') == os.environ['ADM_ARC_WAVE']))"); do
  python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind arc-server --id "$h"
done
```

**Expected:** the canary host connects first, then the rest in batches; on each server, `azcmagent show` reports `Connected` with the CMDB's `ConfigOwner` and `PatchOwner` tags ([Chapter 08](08-ansible-beside-arc.md)). In GCC High and DoD, `ADM_ARC_PLAYBOOK` is `02_arc_onboarding.yml`, which reads the onboarding service principal's secret from Ansible Vault at run time: Microsoft's role requests its token for commercial Azure only ([Chapter 08](08-ansible-beside-arc.md)), and the pre-flight check warns about it.

### Step 8: the drift pipeline

*Gate 9: drift scans running from the first change.*

As the deploy identity, in a POSIX shell, follow [Chapter 09's test-tenant steps](09-drift-pipelines-and-evidence.md#lab-2-test-tenant-and-test-subscription), with the stage's values. Create the federated credential for the stage's GitHub environment:[^c10-fic]

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
python examples/drift-pipeline/python/workflow_lint.py .github/workflows/drift.yml
```

Run it once from the repository's **Actions** tab (**workflow_dispatch**). **Expected:** `0 finding(s), 0 warning(s)` from the linter; the first run is the baseline: one evidence package in the container and one summary issue ([Chapter 09](09-drift-pipelines-and-evidence.md)).

### Step 9: smoke test

*Every gate's Validate step, read in one place.*

As the reader, run the validation kit again, then the smoke test on everything the stage wrote. In PowerShell 7:

```powershell
Set-Location "$env:ADM_EXAMPLES/validation-kit"
./Invoke-ValidationKit.ps1 -OutputPath "$env:ADM_EVIDENCE_DIR/vk-after" -Track HR, DG, CA, ARC -InputPath $env:ADM_VK_INPUTS -Cloud $env:ADM_VK_CLOUD -TenantId $env:ADM_TENANT_ID -ClientId $env:ADM_READER_CLIENT_ID -CertificateThumbprint $env:ADM_READER_CERT_THUMBPRINT -Option @{ Subscriptions = @($env:ADM_SUBSCRIPTION_ID) }
$run = (Get-ChildItem "$env:ADM_EVIDENCE_DIR/vk-after" -Directory | Sort-Object Name | Select-Object -Last 1).FullName
python "$env:ADM_DEPLOY/smoke_test.py" --settings $env:ADM_SETTINGS --kit-run $run `
    --hcm-provenance "$env:ADM_EVIDENCE_DIR/hr-full/provenance.json" --dynamic-rules "$env:ADM_EVIDENCE_DIR/dr-check-results.json" `
    --mc-provenance "$env:ADM_EVIDENCE_DIR/mc/$($env:ADM_MC_NAME)_1.1.0/provenance.json" --mc-mode ApplyAndMonitor `
    --deploy-record "$env:ADM_EVIDENCE_DIR/deploy-record.json" --out "$env:ADM_EVIDENCE_DIR/smoke"
```

**Expected:** `smoke test: GO (0 failed)`. Every check in `smoke.required_pass` is `Pass`; VK-DG-03 is the only `Error`, and it is listed as allowed unverified, its evidence being step 3c's `0 difference(s)`; the run read the test tenant in mode `Live`; nothing is held or quarantined over the limit; every recorded change has a rollback. The report's SHA-256, on the last line, is the go/no-go record for production.

### Step 10: capture the evidence

*Each gate's Evidence paragraph.*

Package the stage with the drift pipeline's packager, so the ISSO receives one folder with a SHA-256 per file. In a POSIX shell:

```bash
cd "$ADM_EXAMPLES/drift-pipeline"
RUN="$(ls -d "$ADM_EVIDENCE_DIR"/vk-after/*/ | tail -n 1)"
python python/drift_pipeline.py compare --current "$RUN" --out "$ADM_EVIDENCE_DIR/drift"
python python/drift_pipeline.py package --kit-run "$RUN" --diff "$ADM_EVIDENCE_DIR/drift/drift-report.json" \
  --provenance hcm-entra="$ADM_EVIDENCE_DIR/hr-full/provenance.json" \
  --provenance machine-configuration="$ADM_EVIDENCE_DIR/mc/${ADM_MC_NAME}_1.1.0/provenance.json" \
  --provenance dynamic-rules="$ADM_EVIDENCE_DIR/dr-check-results.json" --out "$ADM_EVIDENCE_DIR/package"
python python/drift_pipeline.py verify "$(ls -d "$ADM_EVIDENCE_DIR"/package/*/ | tail -n 1)"
```

**Expected:** `verify` passes. Attach the package, `smoke/smoke-report.json`, `deploy-record.json` and the files listed under [Evidence the ISSO keeps](#evidence-the-isso-keeps) to the change record. `quarantine.json` from the HR runs holds personal data: it goes to the access-controlled audit store, not the change record ([Chapter 01](01-the-hr-to-entra-middleware.md)).

### Step 11: roll back

*The guide's [rollback at a glance](../guides/attribute-driven-migration-implementation.md#rollback).*

Write the rollback from the record. In a POSIX shell:

```bash
python "$ADM_DEPLOY/rollback.py" plan --settings "$ADM_SETTINGS"
```

It writes `rollback-cloud.ps1`, `rollback-ad.ps1` and `rollback-manual.md` in the evidence folder and runs nothing; the [fixture run above](#try-the-scripts-against-fixtures-first) shows the shape. Review them, then run each where it belongs. Cloud steps, in PowerShell 7 on the operator's workstation (the script signs in with the deploy identity's certificate):

```powershell
pwsh -File "$env:ADM_EVIDENCE_DIR/rollback-cloud.ps1"
```

Group Policy steps, on the test forest's administration host:

```powershell
powershell -File "$env:ADM_EVIDENCE_DIR/rollback-ad.ps1"
```

Then the steps in `rollback-manual.md`: on each Arc test server, `sudo azcmagent disconnect`, as [Chapter 08](08-ansible-beside-arc.md#lab-2-test-subscription-and-a-disposable-server) shows; and, for the HR batches, Chapter 01's leaver back-out.

**When to roll back in the test stage.** Always, at the end, to prove the rollback works: rebuild the test state from the runbook for the next rehearsal, rather than keeping a test stage that only ever moved forward (*design guidance*). In the test stage the rollback removes what the stage created; it disables the workflow before deleting it, and disables GPO links rather than deleting the GPOs. **Expected:** the next validation kit run matches `vk-before`.

## Promotion go/no-go criteria {#promotion-go-no-go-criteria}

*The guide's gate owners decide; the pre-flight check enforces what it can.*

| # | Criterion | Shown by | Enforced by |
|---|---|---|---|
| 1 | The test stage's smoke test is GO, from a live run in the test tenant | `smoke-report.json` (`result: pass`, `fixture: false`, `environment: test`) | Production `PF-10` |
| 2 | Production's settings point at that exact report | `promotion.test_smoke_report_sha256` equals the report's SHA-256 | Production `PF-10` |
| 3 | The CISO and identity engineering approved promotion | `promotion.approvals`, by reference to the change record | Production `PF-10` |
| 4 | Test and production share no tenant, subscription or deploy identity | The two settings files | `PF-09` with `--other` |
| 5 | Rule validation found no difference | `dr-evaluate-differences.txt` is empty | Review |
| 6 | The workflow's on-demand run completed, and the failure path was drilled as Chapter 05 shows | `lcw-run.json` | Review |
| 7 | The cut-over drill disabled the test OU's links and the test device kept its settings from Intune | Step 5d, the device's settings | Review |
| 8 | Machine configuration ran in audit, then apply and monitor, with no finding; the registry's mode and published version are merged in a reviewed pull request | `mc-audit-state.json`, both `provenance.json` files, the pull request | `PF-07` shows the registry the production build will use |
| 9 | The rollback ran end to end in the test stage, and the validation kit afterwards matched the baseline | The rollback scripts' output, `vk-before`, the post-rollback run | Review |
| 10 | The drift pipeline ran twice, chained, and its packages verify | The two packages in the test container | Review |

Record the go decision in `production.json`. In a POSIX shell, with the test stage's settings loaded:

```bash
sha256sum "$ADM_EVIDENCE_DIR/smoke/smoke-report.json"
```

Copy the hash into `promotion.test_smoke_report_sha256` in `production.json`, and the two approvals' references into `promotion.approvals`.

## Stage 2: production {#stage-2-production}

Production runs the same commands with `production.json`. What changes is the order: the tenant-wide pieces once, then each wave, and the rollback rule is re-enable, never re-create ([guide, Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)).

### The change record and pre-flight

*The guide's prerequisites, and the go/no-go record.*

Open the production change record and put its ID in `production.json`. Load `production.json` without `--wave`, sign in as the deploy identity, and run, in PowerShell 7:

```powershell
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --other <settings-file> --test-smoke-report <settings-file> --out $env:ADM_EVIDENCE_DIR
```

Here the first `<settings-file>` is `test.json`, and the second is the test stage's `smoke-report.json`, by its path in the test change record. Then the live probes:

```powershell
python "$env:ADM_DEPLOY/preflight.py" --settings $env:ADM_SETTINGS --live --out "$env:ADM_EVIDENCE_DIR/live"
```

**Expected:** `PF-01` to `PF-16` pass, including `PF-10`: `go/no-go: test smoke report … passed; approvals CISO, Identity engineering`.

### Tenant-wide, once

*Gates 2, 4 and 9 for the whole tenant before any wave.*

Run these test-stage steps once, with `production.json` loaded and no `--wave`:

1. [Step 1](#step-1-baseline-evidence-before-any-change), the baseline.
2. [Step 2a](#step-2-the-hr-to-entra-middleware), the dry run on the production extract, and [2b](#step-2-the-hr-to-entra-middleware), the job's safety nets. **Don't send yet.**
3. [Step 3](#step-3-dynamic-rules), the dynamic groups: created paused, validated against the production test users in the member map, then on. They grant nothing until a wave assigns them.
4. [Step 4a and 4b](#step-4-lifecycle-workflows-created-disabled), the workflow, created disabled. Run [4c](#step-4-lifecycle-workflows-created-disabled) for the one production test account in `lifecycle.test_user_id`, then disable it again:

   ```powershell
   Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $wf.id -BodyParameter @{ isEnabled = $false; isSchedulingEnabled = $false }
   ```

5. [Step 5b](#step-5-group-policy-as-code), the Intune policies: dry run, then create, unassigned. Skip 5a: production's GPOs already exist and are linked.
6. [Step 6a](#step-6-machine-configuration-audit-before-apply), build and publish from the reviewed registry, at the version it names; skip the mode change in 6d, which the registry already carries.
7. [Step 8](#step-8-the-drift-pipeline), the drift pipeline, and then lock the evidence container's retention policy. Learn recommends locking within a reasonable time, typically less than 24 hours, and a locked policy can't be deleted or shortened:[^c10-immutable][^c10-immutable-container]

   ```bash
   ETAG="$(az storage container immutability-policy show --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --query etag --output tsv)"
   az storage container immutability-policy lock --resource-group "$ADM_RESOURCE_GROUP" --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --if-match "$ETAG"
   python "$ADM_DEPLOY/rollback.py" add --settings "$ADM_SETTINGS" --kind retention-policy --id "$ADM_EVIDENCE_CONTAINER" --name "$ADM_EVIDENCE_ACCOUNT" --note locked
   ```

### Each wave

*Gate 8: each wave by attribute query, leaver first, drift-clean before the next.*

Load `production.json` with `--wave <wave-id>`. The wave's OU, Intune group and Arc wave replace the defaults. Then, in this order (leaver first, as the guide requires):

1. **The leaver workflow on.** For the first wave only, turn scheduling on. In PowerShell 7, as the deploy identity:

   ```powershell
   $wf = (Invoke-MgGraphRequest -Method GET -Uri "/v1.0/identityGovernance/lifecycleWorkflows/workflows?`$filter=displayName eq '$env:ADM_LCW_WORKFLOW_NAME'").value[0]
   Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $wf.id -BodyParameter @{ isEnabled = $true; isSchedulingEnabled = $true }
   ```

   Workflows from the real-time termination template run on demand only,[^c10-lcw-activate] so scheduling does nothing for that template; the leaver runs on demand from the HR event. For a scheduled template, Learn says the engine checks every three hours by default.[^c10-lcw-schedule]

2. **HR records for the wave.** [Step 2c](#step-2-the-hr-to-entra-middleware), five records, reconcile; then [2d](#step-2-the-hr-to-entra-middleware) with the wave's extract in `hcm_entra.extract_path`.
3. **Intune for the wave, then the GPO links off.** [Step 5c](#step-5-group-policy-as-code), assigning the policies to the wave's group; after the wave's devices check in, [step 5d](#step-5-group-policy-as-code), which disables the GPO links on the wave's OU and records them as `gpo-link-disabled`.
4. **Servers for the wave.** [Step 7b](#step-7-ansible-beside-arc-check-mode-first): plan, check mode, connect. Then [step 6b](#step-6-machine-configuration-audit-before-apply)'s role assignment and tag for each server the wave connects, so the existing assignment reaches them.
5. **Smoke test the wave.** [Step 9](#step-9-smoke-test), with `--out "$env:ADM_EVIDENCE_DIR/smoke-wave-$env:ADM_WAVE"`.

**Expected:** each wave's smoke test is GO before the next wave starts. Start with the pilot division, then two or three divisions at a time, each drift-clean before the next ([guide, Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)).

### First-week monitoring with drift

*Gate 8's seven days of sole-source proof, and Gate 9.*

For seven days after each wave, every change to the wave's population must trace to an HR event before the ticket path for account creation closes ([guide, Gate 8](../guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree)). The drift pipeline runs every day on its schedule. Each morning, in a POSIX shell with `production.json` loaded, fetch the newest package, verify it, and read the summary:

```bash
mkdir -p "$ADM_EVIDENCE_DIR/daily"
NEWEST="$(az storage blob list --account-name "$ADM_EVIDENCE_ACCOUNT" --container-name "$ADM_EVIDENCE_CONTAINER" --auth-mode login --query "sort_by([?ends_with(name, 'EVIDENCE-MANIFEST.json')], &properties.creationTime)[-1].name" -o tsv)"
PREFIX="${NEWEST%/EVIDENCE-MANIFEST.json}"
az storage blob download-batch --account-name "$ADM_EVIDENCE_ACCOUNT" --source "$ADM_EVIDENCE_CONTAINER" --pattern "$PREFIX/*" --destination "$ADM_EVIDENCE_DIR/daily" --auth-mode login
python "$ADM_EXAMPLES/drift-pipeline/python/drift_pipeline.py" verify "$ADM_EVIDENCE_DIR/daily/$PREFIX"
cat "$ADM_EVIDENCE_DIR/daily/$PREFIX/drift/drift-summary.md"
```

**Expected:** a package for every day, each verifying, each chained to the day before; new findings only where an HR event explains them; VK-DG-05 within the membership-change threshold. A missing day is a break in the chain, and an unexplained new finding opens an issue that the CISO decides (guide, Gate 9: severity and response times are the CISO's). Also read the provisioning logs daily, as [step 2c](#step-2-the-hr-to-entra-middleware) does, and the workflow's run history, as [step 4c](#step-4-lifecycle-workflows-created-disabled) does.

### Roll back in production

*The guide's [rollback at a glance](../guides/attribute-driven-migration-implementation.md#rollback): re-enable, never re-create.*

The commands are the test stage's [step 11](#step-11-roll-back), with `production.json` loaded (with `--wave <wave-id>` to roll back one wave, whose changes are the newest in the record). The script differs because the stage does:

| Change | Test stage rollback | Production rollback |
|---|---|---|
| Provisioning job | Paused | Paused; correct records at the HR source, never in the directory |
| Dynamic group | Deleted | Processing paused; the old group stays in place (guide, Gate 4) |
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
| Test | The rollback drill's output and the post-rollback validation kit run | 11 | Rollback |
| Production | The promotion record: the test smoke report's SHA-256 and the approvals | Promotion | All |
| Production | Seven days of drift packages per wave, chained and verified, and the sole-source report | First week | 8, 9 |
| Production | The locked retention policy on the evidence container | Tenant-wide 7 | 9 |

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
| Creating a workflow | Admin center: **ID Governance** > **Lifecycle workflows** > **Create a workflow**; a new workflow is disabled by default; Graph: `isEnabled` optional, default `true`; up to 100 workflows a tenant | [^c10-lcw-create] [^c10-lcw-resource] |
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
| A workflow that runs before anyone has tested it | Leavers processed in bulk on the first schedule | Created in the admin center, where it starts disabled; on demand for one user first; scheduling only in production, per wave |
| A GPO deleted at cut-over | The one-command rollback is gone | Links disabled and recorded as `gpo-link-disabled`; the rollback re-enables |
| Apply before audit | A server changes before anyone knows what the package does there | Audit assignment first; apply and monitor only after its result, as a new version |
| An Ansible run that connects servers by accident | Servers onboard outside the wave | Wave plan, then the playbook's own check mode; `confirm_change=true` only on the third command |
| A DoD token from the wrong Graph host | Calls fail, or go to the wrong cloud | The token is requested for `ADM_GRAPH`, from the settings' cloud |
| A rollback nobody wrote down | The change can't be undone in the window | Every step records its change; the smoke test fails a change with no rollback (`SM-13`) |
| A locked policy in the test stage | The test account can't be deleted until retention ends | Locked only in production; the test stage leaves it unlocked |
| Personal data in the change record | The record is read more widely than the audit store | `quarantine.json` goes to the audit store; the evidence package holds keys and statuses |

## Checklist

- [ ] Both settings files load with no refusal, and live outside the repository with the change records.
- [ ] Pre-flight passes, dry and live, for each stage; production's `PF-10` names the test smoke report and both approvals.
- [ ] Every change in each stage is in `deploy-record.json`, and the rollback plan written from it was reviewed.
- [ ] The test stage's rollback ran end to end, and the validation kit matched the baseline afterwards.
- [ ] Rule validation found no difference; the groups were paused until it did.
- [ ] The workflow started disabled, ran on demand for one user, and was scheduled only in production.
- [ ] GPO links were disabled, never deleted.
- [ ] Machine configuration ran in audit before apply and monitor, and the registry change was merged before production.
- [ ] Each production wave's smoke test was GO before the next wave.
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
