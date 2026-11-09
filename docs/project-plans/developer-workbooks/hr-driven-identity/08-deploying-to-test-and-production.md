---
title: "Chapter 08 — Deploying to a Test Tenant, Then to Production"
description: "The runbook that takes the kit from each chapter's non-production step to a live test environment (an Oracle HCM test pod with synthetic workers and an Entra test tenant), then to the production HR feed and tenant: one settings file per environment with no secrets, a pre-flight check of licenses, PIM roles, the writer register and the provisioning apps, a staged enable with scoping filters and workflows on demand, a smoke test with a synthetic joiner, mover and leaver, the evidence the ISSO keeps, go/no-go criteria, first-week monitoring and a rehearsed rollback, every step a command block linked to the guide's gate."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 8
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 1f924a0e927da38597f0d2e4b4e5f76bb45ead95f3db17b8b8ebe03e7e418cc4
last-reviewed: 2026-11-07
---
# Chapter 08 — Deploying to a Test Tenant, Then to Production

*Seven chapters built the code and tried it against fixtures and a test tenant. This one runs it, in order, against a live test environment and then production, with nothing left to work out on the day.*

::: {.callout-important appearance="default"}
## Status: not run against a live tenant
Nobody has run this runbook against a live tenant, a live HR pod or production. The commands are exact, and the scripts they call are tested against fixtures: every output shown below was produced in fixture mode on November 2, 2026. What a live tenant returns at each step is written as an **expected result**, an expectation from Microsoft Learn and Oracle's documentation, not an observation. Run Stage 1 in full, and keep its evidence, before any of it reaches production.
:::

::: {.callout-note}
## In this chapter
The order of work for the guide's [seven gates](../../../books/guides/hr-driven-identity-implementation.md#the-path-on-one-page) on real systems, as a runbook. You start with the roles, approvals and change record, then one settings file per environment, so the same commands run against test and production. A pre-flight check proves everything is ready and nothing is running. **Stage 1** deploys to the HR test pod and the Entra test tenant, enables in stages, runs a smoke test with three synthetic workers, runs four earlier chapters' test tenant checks, keeps the evidence and rehearses the rollback. The go/no-go criteria decide promotion. **Stage 2** repeats the same commands against the production feed and tenant, enables by scope, watches the first week against the drift metrics, and keeps a rollback ready. The code is new in [`examples/hr-lifecycle/deploy`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hr-lifecycle/deploy).
:::

## Goal and audience

**Goal.** By the end of this chapter you can take the kit from each chapter's non-production step to a live test environment and then to production, run every step as a copy-paste command or an exact admin center path, show for each step which gate it fulfils, and hand the ISSO the evidence each stage leaves.

**Audience.** The identity engineers who operate the change, the HR pod administrator who loads the synthetic workers, the change owner who signs the go/no-go, and the ISSO who keeps the evidence. You should have run Lab 1 and Lab 2 of Chapters 01 to 07 first; this chapter doesn't re-teach them.

## What this chapter adds

Every earlier chapter ends with a step in a test tenant and a way to back it out. None of them says what order to run the whole lifecycle in, how to change environments without editing commands, how to prove a deployment is ready before anything starts, or what to check once real records flow. The guide's gates give the order and each gate's rollback in prose. This chapter makes them a runbook, and adds five scripts where a command needed code the kit lacked.

| Need | Where it was | What this chapter adds | Pinned by |
|---|---|---|---|
| One set of commands for test and production | Each lab names a test tenant in its commands | `deploy/settings.example.json` and `deploy_settings.py`: one file per environment, a secret check (DS-01 to DS-05), and `get` for one value | `test_the_template_is_all_placeholders_and_the_fixture_is_clean`, `test_a_secret_in_the_settings_is_refused` |
| Ready but not running | Not checked anywhere | `preflight.py`: licenses, PIM eligibility, the writer register, both provisioning jobs paused, every workflow's schedule off, and for production the test evidence (PF-01 to PF-06) | `test_preflight_finds_a_running_job_a_schedule_a_missing_role_and_short_licenses`, `test_production_preflight_needs_clean_test_evidence` |
| A joiner, a mover and a leaver end to end | Chapter 03 measures readiness; Chapter 06 measures timing | `smoke_test.py`: the synthetic workers' extract per phase, and a check of the directory, the workflows and the provisioning logs against any extract (SM-01 to SM-07) | `test_the_smoke_check_finds_each_kind_of_failure` |
| A rollback someone can rehearse | The guide's rollback table, in prose | `rollback.py`: the reviewed Graph PowerShell in the table's order, a dry run by default, and a verify (RB-01, RB-02) | `test_the_rollback_plan_pauses_and_unschedules_but_never_restarts_or_disables` |
| Evidence that each step met its requirements | The guide's per-gate tables name what the ISSO keeps | `evidence.py`: a hashed record per scripted step with its controls and KSI IDs, and a check of a stage's records (EV-01 to EV-04) | `test_each_step_writes_a_hashed_record_with_its_requirements`, `test_the_go_no_go_evidence_check` |

The kit still never writes to a tenant. Changes go through Microsoft's Graph PowerShell cmdlets, run by an operator who has activated a role through PIM, or through the admin center paths given here; the scripts read and check. The runbook's 25 tests, in `deploy/tests`, and the kit's 57 pass under Python 3.10 or later with no package beyond pytest, no tenant and no network.

## Requirements, KSIs and the evidence each step leaves

Every scripted step in this runbook names the federal requirements it helps meet and leaves a record that proves it ran. Each step group below ends with a table: the requirement, what the step does for it, the FedRAMP 20x Key Security Indicator it aligns to, and the file or output the ISSO keeps.

- **The requirements** are NIST SP 800-53 Rev. 5 controls at the system's Moderate baseline,[^hw08-nist][^hw08-nist-cm] OMB M-22-09[^hw08-m2209] and CISA BOD 25-01's SCuBA policies[^hw08-bod] where they apply, and FedRAMP's rule for agency use of certified cloud services: the agency completes the ATO for its own system that uses them (AGU-USE-ABU).[^hw08-agu] The controls per gate are the guide's [requirement tables](../../../books/guides/hr-driven-identity-implementation.md#the-path-on-one-page); the change-control controls (CM-3, CM-3(2), CM-4(2), CM-5, CM-6) and AU-9 come from [Book 13, Appendix A](../../../books/b13-governance/appendix-a-requirements-mapping.md).
- **Key Security Indicators belong to the providers.** KSIs are FedRAMP 20x indicators for cloud service providers.[^hw08-ksi] The agency authorizes its own system and lines its evidence up with what its providers report against KSIs; it doesn't report KSIs itself ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The KSI column says which indicator a step's evidence sits beside. Each pairing follows the control-to-KSI mapping in Book 13, Appendix A, or Book 04, Chapter 10's indicator table; the two pairings neither gives are marked *(design guidance)*.
- **The evidence is produced, not just named.** `preflight.py`, `smoke_test.py`, `rollback.py` and `deploy_settings.py` (`check`, `record-workflows`) each write an evidence record for the step: a JSON file with the time in UTC, the environment, tenant, cloud, mode and change record, the exact command, the result and its counts, the output folder and the SHA-256 of its manifest, and the control and KSI IDs. They go to `out/evidence` by default and to `"$EVIDENCE/records"` in this runbook, with `evidence-index.csv` (one row per record) and `SHA256SUMS` over the folder, so `sha256sum -c` checks it, as Chapter 07's packages do. `evidence.py check` reads the folder and passes only when every step a stage needs has a record that passed, for that stage, whose output folder still has the manifest it was recorded with (EV-01 to EV-04). That check is a go/no-go criterion.

The records a fixture-mode run of the whole test stage wrote on November 2, 2026, and the check over them (the KSI lists as `evidence.py` has them since November 9, 2026):

```text
$ ls out/evidence
SHA256SUMS
evidence-index.csv
preflight-20261102T122224Z.json
rollback-plan-20261102T122239Z.json
rollback-verify-20261102T122241Z.json
settings-check-20261102T122220Z.json
smoke-joiner-20261102T122235Z.json
smoke-leaver-20261102T122238Z.json
smoke-mover-20261102T122236Z.json
workflows-recorded-20261102T122221Z.json
$ python deploy/evidence.py check --stage test
EV-01 Info    preflight-20261102T122224Z.json: passed at 2026-11-02T12:22:24Z: preflight (AC-2, AC-5, AC-6, CM-3(2), CM-6; KSI-IAM-JIT, KSI-IAM-ELP, KSI-CMT-VTD, KSI-MLA-EVC)
EV-01 Info    rollback-plan-20261102T122239Z.json: passed at 2026-11-02T12:22:39Z: rollback-plan (CM-3, CM-5; KSI-CMT-RMV, KSI-CMT-RVP, KSI-IAM-JIT)
EV-01 Info    rollback-verify-20261102T122241Z.json: passed at 2026-11-02T12:22:41Z: rollback-verify (CM-3, CM-4(2); KSI-CMT-LMC, KSI-CMT-VTD)
EV-01 Info    settings-check-20261102T122220Z.json: passed at 2026-11-02T12:22:20Z: settings-check (CM-3, CM-6, IA-5; KSI-SVC-ACM, KSI-SVC-ASM, KSI-CMT-LMC)
EV-01 Info    smoke-joiner-20261102T122235Z.json: passed at 2026-11-02T12:22:35Z: smoke-joiner (AC-2, AC-2(1), IA-4(4), IA-5, CM-4(2); KSI-IAM-AAM, KSI-IAM-JIT, KSI-IAM-APM, KSI-CMT-VTD)
EV-01 Info    smoke-leaver-20261102T122238Z.json: passed at 2026-11-02T12:22:38Z: smoke-leaver (PS-4, AC-2(3), CM-4(2); KSI-IAM-ELP, KSI-IAM-AAM, KSI-IAM-JIT, KSI-IAM-SUS, KSI-CMT-VTD)
EV-01 Info    smoke-mover-20261102T122236Z.json: passed at 2026-11-02T12:22:36Z: smoke-mover (AC-2, AC-6, PS-5, CM-4(2); KSI-IAM-AAM, KSI-IAM-ELP, KSI-CMT-VTD)
EV-01 Info    workflows-recorded-20261102T122221Z.json: passed at 2026-11-02T12:22:21Z: workflows-recorded (AC-2(1), CM-3; KSI-IAM-JIT, KSI-CMT-RMV, KSI-CMT-LMC)
Evidence for the test stage in out/evidence: 0 Finding, 0 Warn, 8 Info
```

One record, the leaver phase's (fixture mode, November 2, 2026; its `ksi` list as of November 9, 2026):

```text
{
  "changeRecord": "CHG-0001-TEST",
  "cloud": "gcc",
  "command": "python deploy/smoke_test.py check --settings out/settings.test.json --extract out/ch08/extract-leaver/smoke-extract.csv --previous-extract out/ch08/extract-mover/smoke-extract.csv --phase leaver --as-of 2026-11-11 --since 2026-11-11T00:00:00Z --mode fixture --fixture deploy/tests/fixtures/smoke/leaver --out out/ch08/smoke-leaver",
  "counts": {"Finding": 0, "Info": 0, "Warn": 0},
  "environment": "test",
  "gate": "G6",
  "ksi": ["KSI-IAM-ELP", "KSI-IAM-AAM", "KSI-IAM-JIT", "KSI-IAM-SUS", "KSI-CMT-VTD"],
  "mode": "fixture",
  "output": "out/ch08/smoke-leaver",
  "outputManifestSha256": "59fabd734e99371e83bdad572972e1eb7e3131d1ae92bcd057d56cbafee5a778",
  "requirements": {
    "nist80053": ["PS-4", "AC-2(3)", "CM-4(2)"],
    "other": []
  },
  "result": "pass",
  "rules": [],
  "schema": "fmp-hrlc-evidence/1",
  "step": "smoke-leaver",
  "tenantId": "00000000-0000-4000-8000-0000000c0de8",
  "timestamp": "2026-11-02T12:22:38Z"
}
```

The record is shown with its short lists folded onto one line; the file has one value per line. Steps that are admin center actions, or Graph PowerShell run by an operator, leave the evidence the tables name (an audit log entry, a PIM activation, the change record) rather than a record of their own.

## Before you start

### Roles

| Role | Who | What they do in this runbook |
|---|---|---|
| Change owner | The identity program's release manager | Opens the change record, chairs the go/no-go, signs promotion |
| Operator | An identity engineer | Runs every command; activates roles through PIM for the steps that change the tenant |
| Second operator | Another identity engineer | Reviews each body, script and settings file before it's run; witnesses every on-demand run and the rollback |
| HR pod administrator | The HR platform team, on Oracle Cloud Infrastructure | Loads and changes the synthetic workers in the HCM test pod; never in production |
| ISSO | The system's information system security officer | Receives each stage's evidence; accepts the test stage before promotion |

The second-operator rule and the role split are *design guidance*. The directory roles behind them are the guide's [prerequisites](../../../books/guides/hr-driven-identity-implementation.md#prerequisites): Lifecycle Workflows Administrator for workflows, Identity Governance Administrator for automatic assignment policies, Authentication Policy Administrator for certificate-based authentication, and, from the [pipeline guide](../../../books/guides/hcm-entra-implementation.md), Application Administrator for the provisioning apps, each held as a PIM eligibility, not a standing assignment. The test stage's rollback also removes the synthetic accounts, which takes User Administrator.[^hw08-delete] Activate a role in the admin center under **ID Governance** > **Privileged Identity Management** > **My roles** > **Microsoft Entra roles**, then **Activate** on the role.[^hw08-pim]

### Approvals and the change record

| Stage | Approval before it starts | Recorded in |
|---|---|---|
| Stage 1, live test | The change owner and the ISSO agree the test tenant, the HR test pod and the synthetic person numbers | The test change record |
| Promotion | The go/no-go criteria below, all met, signed by the change owner; the ISSO accepts the test evidence | The production change record |
| Stage 2, production | The production change record approved by the change board, with the window, the first scope and the rollback plan attached | The production change record |

The change record's ID goes into the settings file (`changeRecord`), and every script writes it into its output manifest, so each piece of evidence names the change it belongs to. A production settings file without one fails DS-04.

### What you need on the operator's workstation

Python 3.10 or later, the Azure CLI, OpenSSL, Git Bash (on Windows) for the bash blocks and PowerShell 7 with the Microsoft Graph PowerShell modules for the PowerShell blocks. Work in `examples/hr-lifecycle` of a clone of this repository. The bash blocks keep their variables between steps, so run one stage in one terminal; the PowerShell blocks do the same in one PowerShell 7 window.

### Placeholders

Every value that differs between environments lives in the settings file, and the commands read it from there. The placeholders below appear once, in `deploy/settings.example.json`, and you replace each in your copy; the last six rows are the only placeholders in the commands themselves.

| Placeholder | What it is | Where to find it |
|---|---|---|
| `<test-or-production>` | `test` or `production` | Your choice per file |
| `<cloud>` | `gcc`, `gcchigh` or `dod` | The tenant's cloud: Microsoft 365 GCC uses the worldwide Graph host; GCC High and DoD have their own[^hw08-deployments] |
| `<tenant-id>` | The test tenant's ID (`<test-tenant-id>`) in `settings.test.json`, the production tenant's (`<production-tenant-id>`) in `settings.production.json` | **Entra ID** > **Overview** |
| `<change-record-id>` | The change record's ID | The change system |
| `<hcm-pod-host>`, `<hcm-integration-user>`, `<hcm-assertion-key-name>` | The HCM pod, its integration user and the name of the key that signs its JWT assertion | The HR platform team |
| `<key-vault-name>`, `<uploader-cert-name>`, `<reader-cert-name>` | The key vault and the names of the two integration identities' certificates in it | The key vault's **Certificates** page |
| `<uploader-app-id>`, `<reader-app-id>` | The application (client) IDs of the identity that sends to `/bulkUpload` and the read-only identity the scripts use | **Entra ID** > **App registrations** > the app > **Overview** |
| `<employee-app-sp-id>`, `<employee-job-id>`, `<contractor-app-sp-id>`, `<contractor-job-id>` | The two API-driven provisioning apps' service principal and job IDs | The **Provisioning API Endpoint** on each app's **Provisioning** > **Overview** page, which holds both IDs[^hw08-config] |
| `<prehire-workflow-id>` and the other workflow IDs | The six workflows' IDs | Filled by `record-workflows` when Stage 1 creates them |
| `<evidence-storage-account>`, `<evidence-container>` | Where the evidence is kept outside the directory | Chapter 07's evidence store |
| `<p1-sku-part-number>`, `<governance-sku-part-number>` and the seat counts | The `skuPartNumber` of the Entra ID P1 and Entra ID Governance subscriptions, and the seats the scope needs | The `subscribed-skus.json` the pre-flight exports, or the licensing page Learn links from the subscribedSkus API[^hw08-skus] |
| `<person-number-pattern>` | A regular expression for the synthetic person numbers in test (`99[0-9]{4}`); empty in production | The HR pod administrator reserves the range |
| `<first-department-code>` | The first production scope's organization code | The rollout plan |
| `<start-date>` | The smoke test's first day, `yyyy-mm-dd`; the next two days follow from it | The test change record |
| `<policy-id>` | An automatic assignment policy's ID, as `New-MgEntitlementManagementAssignmentPolicy` returns it | Chapter 04's test tenant steps |
| `<production-extract-csv>` | The path of the day's HCM extract for the production scope, in `examples/hcm-entra`'s layout | The HCM integration's output |
| `<today>`, `<yesterday>` | Production dates, `yyyy-mm-dd` | The calendar |
| `<pki-id>` | The test tenant's PKI container ID | The list the first command of Stage 1's Chapter 05 check prints |

## One environment settings file

**Gate:** all seven. The guide's gates run once per environment; this file is the only thing that changes between them.

1. **Copy the template for each environment, and fill it.** Replace every placeholder from the table above. The file holds names and IDs only.

   ```bash
   cp deploy/settings.example.json deploy/settings.test.json
   cp deploy/settings.example.json deploy/settings.production.json
   ```

   Both copies are ignored by git in this repository (`.gitignore`); keep them in the agency's own reviewed configuration repository *(design guidance)*.

2. **Check each file.** The check refuses any key that looks like a secret (the same pattern `examples/hcm-entra` refuses), any value that looks like a token, a private key or a certificate, any placeholder left in, an unknown environment or cloud, a production file without a change record, and a missing provisioning or workflow ID:

   ```bash
   python deploy/deploy_settings.py check --settings deploy/settings.test.json --evidence-dir evidence/test/records
   ```

   The template itself fails, as it should. Fixture mode, run on November 2, 2026:

   ```text
   $ python deploy/deploy_settings.py check --settings deploy/settings.example.json
   ...
   DS-03 Finding cloud: unknown cloud '<cloud>'; expected gcc, gcchigh or dod
   DS-03 Finding environment: environment must be test or production, not '<test-or-production>'
   Settings settings.example.json (<test-or-production>, <cloud>): 32 Finding, 0 Warn, 0 Info
   $ python deploy/deploy_settings.py check --settings deploy/tests/fixtures/settings.test.json
   Settings settings.test.json (test, gcc): 0 Finding, 0 Warn, 0 Info
   ```

   Until Stage 1 creates the workflows, the test file fails DS-02 and DS-05 for the six workflow IDs alone; that is expected.

3. **Open a session for the stage.** These lines set the environment, make a private folder for the session, sign the operator in to read the key vault, convert the two integration identities' certificates to the PEM form the Azure CLI signs in with (Learn's procedure for a certificate held in Key Vault),[^hw08-azlogin] and define two helpers: `cfg` prints one value from the settings file, and `hrlc_token` signs in as an integration identity with its certificate and prints a Microsoft Graph token for the tenant's cloud.[^hw08-azgov] For Stage 2, run the same block with `SETTINGS=deploy/settings.production.json`:

   ```bash
   SETTINGS=deploy/settings.test.json
   cfg() { python deploy/deploy_settings.py get --settings "$SETTINGS" "$1"; }
   EVIDENCE=evidence/$(cfg environment)
   mkdir -p "$EVIDENCE"
   RUNBOOK_TMP=$(mktemp -d) && chmod 700 "$RUNBOOK_TMP"
   az cloud set --name "$(cfg azureCloud)"
   az login --tenant "$(cfg tenantId)" --output none
   for who in uploader reader; do
     az keyvault secret download --vault-name "$(cfg identities.keyVault)" --name "$(cfg identities.$who.certificateName)" \
         --file "$RUNBOOK_TMP/$who.pfx" --encoding base64
     openssl pkcs12 -in "$RUNBOOK_TMP/$who.pfx" -passin pass: -passout pass: -out "$RUNBOOK_TMP/$who.pem" -nodes
     rm "$RUNBOOK_TMP/$who.pfx"
   done
   hrlc_token() {
     az login --service-principal --username "$(cfg identities.$1.appId)" --certificate "$RUNBOOK_TMP/$1.pem" \
         --tenant "$(cfg tenantId)" --allow-no-subscriptions --output none
     az account get-access-token --resource "$(cfg graphResource)" --query accessToken --output tsv
   }
   ```

   A token from `az account get-access-token` lasts at most 60 minutes;[^hw08-azlogin] each step below asks for a fresh one. The PEM files live only in the session folder, which the last step of each stage deletes. In the reviewed pipeline, the same token comes from the pipeline's federated credential instead, with no certificate on disk ([Book 19, Chapter 09](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md)) *(design guidance)*.

4. **Open the PowerShell 7 window for the stage**, for the steps that change the tenant. It reads the same settings file:

   ```powershell
   $SETTINGS = 'deploy/settings.test.json'
   $S = Get-Content $SETTINGS -Raw | ConvertFrom-Json
   $MgEnv = @{ gcc = 'Global'; gcchigh = 'USGov'; dod = 'USGovDoD' }[$S.cloud]
   $EVIDENCE = "evidence/$($S.environment)"
   ```

   `Global`, `USGov` and `USGovDoD` are Graph PowerShell's names for the three clouds.[^hw08-mgenv]

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-6, configuration settings | One reviewed settings file per environment; `check` refuses a placeholder, an unknown cloud or a missing ID | KSI-SVC-ACM | `settings-check-*.json`; the settings file's SHA-256 in every later manifest |
| IA-5, authenticator management for the integration identities | Refuses any secret in the file; certificates stay in the key vault and reach the session as PEM files deleted at its end | KSI-SVC-ASM *(design guidance: the crosswalk pairs IA-5(2) with it)* | `settings-check-*.json` with no DS-01; the key vault's access log |
| CM-3, configuration change control | The change record's ID is in the file, and in every manifest and record | KSI-CMT-LMC | Every record's `changeRecord`; the change record |
| FedRAMP AGU-USE-ABU, agency use of certified cloud services | The file names the cloud (`gcc`, `gcchigh`, `dod`) whose providers' authorizations the system's package relies on | — (an agency rule, not an indicator) | The system's ATO package listing the providers' authorizations |

: One environment settings file: requirements, KSIs and evidence {.striped .hover}

## Pre-flight checks

**Gates:** the guide's [prerequisites](../../../books/guides/hr-driven-identity-implementation.md#prerequisites), G1 (the register) and the starting state of G2, G3 and G6.

1. **Give the reader identity its permissions.** It needs exactly the GET calls of the deploy tasks in `config/calls.json`, and those of the chapters whose checks you run in Stage 2's monitoring. Print them:

   ```bash
   python python/graph_export.py --task deploy-preflight --list
   python python/graph_export.py --task deploy-job --list
   python python/graph_export.py --task deploy-smoke --list
   python python/graph_export.py --task drift-read --list
   ```

   In the admin center: **Entra ID** > **App registrations** > the reader app > **API permissions** > **Add a permission** > **Microsoft Graph** > **Application permissions**, add each permission printed, then **Grant admin consent**.[^hw08-perms] The sync job read takes `Synchronization.Read.All`: Learn ranks `Application.ReadWrite.OwnedBy` least privileged for that GET, but it can write, and the kit takes no write permission.[^hw08-jobget]

2. **Set the provisioning apps' safety settings** in the admin center, on each of the two API-driven apps: **Entra ID** > **Enterprise apps** > the app > **Provisioning** > **Edit provisioning** > **Settings**, enter the **Notification Email** (without it the job quarantines when it starts), select **Prevent accidental deletions**, enter a threshold, and **Save**.[^hw08-config][^hw08-accdel] Then on the same page under **Mappings**, open the user mapping and, under **Target Object Actions**, clear **Delete**: `/bulkUpload` doesn't delete users, and Microsoft advises turning the action off.[^hw08-faq]

3. **Route the logs out before anything starts** (the guide's prerequisite; [Chapter 07](07-lifecycle-drift-and-evidence.md#what-the-evidence-has-to-show)): **Entra ID** > **Monitoring & health** > **Diagnostic settings** > **+ Add diagnostic setting**, select the audit, sign-in and provisioning log categories, **Archive to a storage account** (or the agency's SIEM), and **Save**.[^hw08-diag]

4. **Run the pre-flight.** It reads the subscriptions, the PIM eligibilities, both provisioning jobs and the workflows, checks the writer register (Chapter 01's WR rules), and writes everything it read into its output folder:

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/preflight.py --settings "$SETTINGS" --mode tenant --out "$EVIDENCE/preflight" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026, and again on November 9, 2026, for the post-separation label (`--mode fixture --fixture deploy/tests/fixtures/preflight`, the test fixture settings):

   ```text
   PF-01 Info    CONTOSO_GOVERNANCE_SAMPLE: 500 enabled, 398 consumed
   PF-01 Info    CONTOSO_P1_SAMPLE: 500 enabled, 412 consumed
   PF-02 Info    Authentication Policy Administrator: 1 eligible through PIM
   PF-02 Info    Identity Governance Administrator: 1 eligible through PIM
   PF-02 Info    Lifecycle Workflows Administrator: 2 eligible through PIM
   PF-02 Info    Application Administrator: 2 eligible through PIM
   PF-02 Info    User Administrator: 1 eligible through PIM
   PF-03 Info    writer-register.json: the writer register passes WR-01 to WR-09
   PF-04 Info    contractor: job is Paused
   PF-04 Info    employee: job is Paused
   PF-05 Info    contractor-leaver: enabled, scheduling off, version 1
   PF-05 Info    day-one: enabled, scheduling off, version 1
   PF-05 Info    leaver: enabled, scheduling off, version 1
   PF-05 Info    mover: enabled, scheduling off, version 1
   PF-05 Info    post-separation: enabled, scheduling off, version 1
   PF-05 Info    pre-hire: enabled, scheduling off, version 1
   Pre-flight test (gcc, fixture): 0 Finding, 0 Warn, 16 Info
   Pre-flight written to out/ch08/preflight
   ```

   **Expected result, live:** before Stage 1 creates the workflows, PF-05 reports each as missing; run the pre-flight again after the deploy step, when it should match the output above. A job reported `NotConfigured` hasn't been saved with its credentials and notification email; `Active` or `Quarantine` means something already started.[^hw08-jobstatus] Each rule and what it reads:

   | Rule | Finding when | Reads |
   |---|---|---|
   | PF-01 | A license in the settings is missing, not `Enabled`, or has fewer enabled units than the scope needs | `GET /subscribedSkus`, `LicenseAssignment.Read.All`[^hw08-skus] |
   | PF-02 | No one holds a PIM eligibility for a role the runbook needs | `GET /roleManagement/directory/roleEligibilitySchedules`, `RoleEligibilitySchedule.Read.Directory`[^hw08-elig], against Learn's role template IDs[^hw08-roles] |
   | PF-03 | The writer register fails Chapter 01's check | `config/writer-register.json` |
   | PF-04 | A provisioning job isn't `Paused` or `NotRun`; a Warn when its settings show no deletion threshold | `GET /servicePrincipals/{id}/synchronization/jobs/{jobId}`, `Synchronization.Read.All`[^hw08-jobget] |
   | PF-05 | A workflow is missing or its schedule is on; a Warn when it's disabled | `GET /identityGovernance/lifecycleWorkflows/workflows`, `LifecycleWorkflows-Workflow.Read.All` |
   | PF-06 | Production only: the test stage's last smoke output is missing, changed since it was written, from another mode, not the leaver phase, or not clean | The test evidence's `manifest.json` |

   The deletion threshold check reads the setting `QuarantineTooManyDeletesThreshold`, which Learn shows in its example response for the job but doesn't describe; it is a Warn, and the admin center step above is the control.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2, account management (G1: one writer per state) | PF-03: the writer register passes WR-01 to WR-09 | KSI-IAM-AAM | `preflight-*.json`; `preflight/findings.json` |
| AC-5 and AC-6, separation of duties and least privilege | PF-02: every runbook role is a PIM eligibility, not a standing assignment; the reader identity holds only GET permissions | KSI-IAM-JIT, KSI-IAM-ELP | `preflight/exports/role-eligibility.json`; the reader app's permission list from `graph_export.py --list` |
| CISA BOD 25-01, MS.AAD.7.5v1: highly privileged roles only through a privileged access management system | PF-02 | KSI-IAM-JIT | The same export; the tenant's ScubaGear report |
| CM-3(2) and CM-6, changes tested and validated; settings verified | PF-04 and PF-05: jobs paused and schedules off before any change; PF-06 gates production on the test evidence | KSI-CMT-VTD, KSI-MLA-EVC | `preflight-*.json` with result `pass` |
| AU-9 and AU-11, with SI-12: audit records protected and kept | Logs routed out before the first send | KSI-MLA-OSM (AU-9, AU-11); none lists SI-12 | The diagnostic setting's name and destination, recorded in the change record |
| FedRAMP AGU-USE-ABU | PF-01: the licensed services the system relies on are present | — | `preflight/exports/subscribed-skus.json` |

: Pre-flight checks: requirements, KSIs and evidence {.striped .hover}

## Stage 1: the live test

The HCM test pod holds four synthetic workers, person numbers 990000 to 990003, from `deploy/smoke-workers.json`: a manager, a joiner, a mover and a leaver, at the fictional employer in the test settings. The Entra test tenant is a separate tenant from production in the same cloud. Use `PersonNumber`, never `PersonID`, as the key: Oracle says `PersonID` "can vary across environments."[^hw08-ora-ems]

### Deploy

**Gates:** G2 (the feed and the contractor source), G3 and G6 (the workflows), G1 (no second writer).

1. **Write the middleware's settings for each provisioning app** from the settings file, into the evidence folder (they hold no secret):

   ```bash
   python deploy/deploy_settings.py middleware --settings "$SETTINGS" --app employee --out "$EVIDENCE/middleware-employee.json"
   python deploy/deploy_settings.py middleware --settings "$SETTINGS" --app contractor --out "$EVIDENCE/middleware-contractor.json"
   ```

   Fixture mode, run on November 2, 2026:

   ```text
   Middleware settings for employee written to out/ch08/middleware-employee.json: https://graph.microsoft.com/v1.0/servicePrincipals/33333333-3333-4333-8333-333333333301/synchronization/jobs/API2AAD.0000000000000000000000000000000a.33333333-3333-4333-8333-333333333301/bulkUpload
   ```

   The middleware's own endpoint check accepts the URL; a test pins that.

2. **Plan the workflows** from `config/workflows` against what the tenant holds, as Chapter 03 does:

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python python/graph_export.py --task joiner-plan --cloud "$(cfg cloud)" --out "$EVIDENCE/exports/joiner"
   python python/joiner_workflows.py plan config/workflows --current "$EVIDENCE/exports/joiner/workflows.json" --out "$EVIDENCE/workflow-plan"
   ```

   **Expected result:** six `create` steps on a first deployment, one per file in `config/workflows`, and `Plan: 0 Finding`.

3. **Create the workflows with scheduling off.** The reviewed bodies carry `isSchedulingEnabled` true, the state each workflow ends in; the staged enable turns it on only after the smoke test. In PowerShell 7, activate Lifecycle Workflows Administrator first, then:

   ```powershell
   Connect-MgGraph -Environment $MgEnv -TenantId $S.tenantId -Scopes 'LifecycleWorkflows-Workflow.ReadWrite.All' -NoWelcome
   $ids = [ordered]@{}
   foreach ($step in (Get-Content "$EVIDENCE/workflow-plan/plan.json" -Raw | ConvertFrom-Json) | Where-Object action -eq 'create') {
       $body = Get-Content (Join-Path "$EVIDENCE/workflow-plan" $step.body) -Raw | ConvertFrom-Json -AsHashtable
       $body.isEnabled = $true
       $body.isSchedulingEnabled = $false
       $w = New-MgIdentityGovernanceLifecycleWorkflow -BodyParameter $body
       $ids[[IO.Path]::GetFileNameWithoutExtension($step.file)] = $w.Id
   }
   $ids | ConvertTo-Json | Set-Content "$EVIDENCE/workflow-ids.json"
   ```

   A workflow with `isEnabled` true and `isSchedulingEnabled` false runs only on demand; scheduling can't be on for a disabled workflow.[^hw08-wf] Learn's pages disagree on the default for a new workflow (one says enabled, another disabled), so the body sets both.[^hw08-lcwplan]

4. **Record the IDs in the settings file, and check it again:**

   ```bash
   python deploy/deploy_settings.py record-workflows --settings "$SETTINGS" --ids "$EVIDENCE/workflow-ids.json" --evidence-dir "$EVIDENCE/records"
   python deploy/deploy_settings.py check --settings "$SETTINGS" --evidence-dir "$EVIDENCE/records"
   ```

   **Expected result:** `Recorded 6 workflow IDs`, then `0 Finding, 0 Warn, 0 Info`.

5. **Run the pre-flight again**, into a new folder. It should now read like the fixture output above, with every workflow `enabled, scheduling off`:

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/preflight.py --settings "$SETTINGS" --mode tenant --out "$EVIDENCE/preflight-after-deploy" --evidence-dir "$EVIDENCE/records"
   ```

   Automatic assignment policies (G4) go in after the smoke test passes, with Chapter 04's [test tenant steps](04-access-from-attributes-and-the-mover-review.md#lab-2-test-tenant). Record each policy's ID so the rollback removes it:

   ```bash
   python -c "import json,sys; p=sys.argv[1]; d=json.load(open(p)); d['automaticAssignmentPolicies'].append(sys.argv[2]); json.dump(d, open(p,'w'), indent=2)" "$SETTINGS" <policy-id>
   ```

   Replace `<policy-id>` with the ID `New-MgEntitlementManagementAssignmentPolicy` returned.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2(1), automated account management (G3, G6) | The workflows are created from the reviewed bodies in `config/workflows`, scheduling off | KSI-IAM-JIT | `workflow-plan/plan.json` and its manifest; `workflow-ids.json`; `workflows-recorded-*.json` |
| CM-3, configuration change control | Created from the repository's files, not edited in the admin center; the IDs go back into the reviewed settings | KSI-CMT-RMV, KSI-CMT-LMC | `workflow-plan/bodies/`; the directory audit log's workflow entries |
| AC-2, PS-7 and IA-4(4) (G2) | The middleware's settings are written from the settings file; worker type comes from the record | KSI-IAM-AAM | `middleware-employee.json`, `middleware-contractor.json` |

: Stage 1 deploy: requirements, KSIs and evidence {.striped .hover}

### Staged enable

**Gates:** G2 (only the synthetic workers flow), G3 and G6 (workflows on demand only).

1. **Scope both provisioning apps to the synthetic workers.** In the admin center, for each app: **Entra ID** > **Enterprise apps** > **All applications** > the app > **Provisioning** > under **Manage**, **Scoping filters** > **Users** > the pencil icon. In **Scope by attribute**, add one clause: attribute `externalId`, operator **REGEX MATCH**, value `99[0-9]{4}`; **Review**, **Save**.[^hw08-scoping] Learn names scoping filters as the way to exclude users from an API-driven app's processing.[^hw08-faq] Saving a new filter starts a full sync, and a user who falls out of scope can be disabled; on a new app with nothing provisioned that touches no one, and in Stage 2 you only ever widen the scope.

2. **Start both jobs.** Activate Application Administrator, then in PowerShell 7:

   ```powershell
   Connect-MgGraph -Environment $MgEnv -TenantId $S.tenantId -Scopes 'Synchronization.ReadWrite.All' -NoWelcome
   foreach ($app in 'employee', 'contractor') {
       Start-MgServicePrincipalSynchronizationJob -ServicePrincipalId $S.provisioning.$app.servicePrincipalId -SynchronizationJobId $S.provisioning.$app.jobId
   }
   ```

   Starting puts an API-driven job in listen mode.[^hw08-config][^hw08-start] **Expected result:** the job's status reads `Active` on the app's **Provisioning** > **Overview** page. Don't use **Restart provisioning**: it purges payloads waiting to be processed.[^hw08-config] *Provision on demand* isn't supported for API-driven apps,[^hw08-config] so the smoke test sends real extracts.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3(2), changes tested before they're finalized | Only the synthetic workers are in scope; workflows run on demand only | KSI-CMT-VTD | The scoping filter, recorded in the change record; `preflight-after-deploy` with every schedule off |
| AC-6 and CM-5, least privilege and access restrictions for change | The operator activates Application Administrator only for the start | KSI-IAM-JIT | The PIM activation audit records |

: Stage 1 staged enable: requirements, KSIs and evidence {.striped .hover}

### Smoke test

**Gates:** G2 (the record arrives, keyed and scoped), G3 (the joiner is ready on day one), G4 (the mover's organization code and mover workflow), G6 (the leaver blocks).

The test runs over three days, one phase a day. `--start` is the joiner phase's date and stays the same for all three; set it, and the two days after it, once:

```bash
START=<start-date>
DAY2=$(python -c "import datetime,sys; print(datetime.date.fromisoformat(sys.argv[1]) + datetime.timedelta(days=1))" "$START")
DAY3=$(python -c "import datetime,sys; print(datetime.date.fromisoformat(sys.argv[1]) + datetime.timedelta(days=2))" "$START")
```

 Each phase writes the synthetic extract, sends it through `examples/hcm-entra` with the uploader's token, runs the phase's workflows on demand (Learn's way to test a workflow on up to 10 users before its schedule is turned on),[^hw08-ondemand][^hw08-lcwplan] and checks the tenant. The fixture outputs below used `START=2026-11-09`.

| Phase | Day | What changes in HR | Expected result in the tenant |
|---|---|---|---|
| Joiner | `--start` | Four active workers; the joiner's hire date is tomorrow | Four accounts; the joiner's is **disabled**, with `employeeHireDate` set; the pre-hire workflow completes for the joiner on demand |
| Mover | start + 1 | The mover moves from `ORG-100` to `ORG-210`; the joiner's hire date is today | The joiner's account is **enabled** by the feed and the day-one workflow completes; the mover's `extensionAttribute10` is `ORG-210` and the mover workflow completes |
| Leaver | start + 2 | The leaver is `INACTIVE` with a termination date of today | The leaver's account is **disabled**, `employeeLeaveDateTime` is set, and the leaver workflow completes |

The HR pod administrator makes the same change in the HCM test pod each day, so the extract the middleware reads in a real run matches; in this runbook the smoke extract is what's sent.

1. **Joiner phase.** Write and send the extract:

   ```bash
   python deploy/smoke_test.py extract --workers deploy/smoke-workers.json --start "$START" --phase joiner --as-of "$START" --out "$EVIDENCE/extract-joiner"
   export HCM_ENTRA_BEARER_TOKEN=$(hrlc_token uploader)
   python ../hcm-entra/python/hcm_to_scim.py --extract "$EVIDENCE/extract-joiner/smoke-extract.csv" --settings "$EVIDENCE/middleware-employee.json" \
       --as-of "$START" --out "$EVIDENCE/scim-joiner" --apply
   ```

   Fixture mode, run on November 2, 2026 (without `--apply`, so nothing was sent):

   ```text
   Smoke extract, joiner phase, as of 2026-11-09: 4 synthetic workers
     990000 ACTIVE   ORG-100  hire 2026-10-10
     990001 ACTIVE   ORG-100  hire 2026-11-10
     990002 ACTIVE   ORG-100  hire 2026-10-20
     990003 ACTIVE   ORG-100  hire 2026-10-20
   Written to out/ch08/extract-joiner/smoke-extract.csv; send it with examples/hcm-entra
   {"counts": {"ready": 4}, "batches": 1, "disables": 0, "held": false, "hold_reason": ""}
   ```

   **Expected result, live:** `apply-results.json` shows one batch with status `202` and a `Location` header that points to the provisioning logs.[^hw08-bulk] Then run the pre-hire workflow on demand for the joiner. Activate Lifecycle Workflows Administrator; the second operator witnesses:

   ```powershell
   Connect-MgGraph -Environment $MgEnv -TenantId $S.tenantId -Scopes 'LifecycleWorkflows-Workflow.ReadWrite.All', 'User.Read.All' -NoWelcome
   $joiner = Get-MgUser -Filter "employeeId eq '990001'" -Property id
   Initialize-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $S.workflows.'pre-hire' -BodyParameter @{ subjects = @(@{ id = $joiner.Id }) }
   ```

   If the pre-hire workflow includes the Temporary Access Pass task, the synthetic manager needs a `mail` value and the joiner no methods or sign-ins, or the task fails ([Chapter 03](03-joiner-workflows-as-code.md)). Then check the tenant:

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/smoke_test.py check --settings "$SETTINGS" --extract "$EVIDENCE/extract-joiner/smoke-extract.csv" \
       --phase joiner --as-of "$START" --since "${START}T00:00:00Z" --mode tenant --out "$EVIDENCE/smoke-joiner" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026 (`--mode fixture --fixture deploy/tests/fixtures/smoke/joiner`):

   ```text
     expect 990000 enabled=true  org=ORG-100  workflows: none
     expect 990001 enabled=false org=ORG-100  workflows: pre-hire
     expect 990002 enabled=true  org=ORG-100  workflows: none
     expect 990003 enabled=true  org=ORG-100  workflows: none
   Smoke joiner, test (gcc, fixture): 0 Finding, 0 Warn, 0 Info
   Smoke evidence written to out/ch08/smoke-joiner
   ```

   If the only rows are SM-07 (no provisioning log entry yet), the provisioning cycle hasn't run: run the same check again later into a new folder, `"$EVIDENCE/smoke-joiner-2"`. Any other row stops the stage.

2. **Mover phase**, the next day:

   ```bash
   python deploy/smoke_test.py extract --workers deploy/smoke-workers.json --start "$START" --phase mover --as-of "$DAY2" --out "$EVIDENCE/extract-mover"
   export HCM_ENTRA_BEARER_TOKEN=$(hrlc_token uploader)
   python ../hcm-entra/python/hcm_to_scim.py --extract "$EVIDENCE/extract-mover/smoke-extract.csv" --settings "$EVIDENCE/middleware-employee.json" \
       --as-of "$DAY2" --out "$EVIDENCE/scim-mover" --apply
   ```

   Run the day-one workflow for the joiner and the mover workflow for the mover, on demand:

   ```powershell
   Connect-MgGraph -Environment $MgEnv -TenantId $S.tenantId -Scopes 'LifecycleWorkflows-Workflow.ReadWrite.All', 'User.Read.All' -NoWelcome
   $joiner = Get-MgUser -Filter "employeeId eq '990001'" -Property id
   $mover = Get-MgUser -Filter "employeeId eq '990002'" -Property id
   Initialize-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $S.workflows.'day-one' -BodyParameter @{ subjects = @(@{ id = $joiner.Id }) }
   Initialize-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $S.workflows.mover -BodyParameter @{ subjects = @(@{ id = $mover.Id }) }
   ```

   Check, with the joiner phase's extract as the previous one so the check finds the move:

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/smoke_test.py check --settings "$SETTINGS" --extract "$EVIDENCE/extract-mover/smoke-extract.csv" \
       --previous-extract "$EVIDENCE/extract-joiner/smoke-extract.csv" --phase mover --as-of "$DAY2" --since "${DAY2}T00:00:00Z" \
       --mode tenant --out "$EVIDENCE/smoke-mover" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026:

   ```text
     expect 990000 enabled=true  org=ORG-100  workflows: none
     expect 990001 enabled=true  org=ORG-100  workflows: day-one
     expect 990002 enabled=true  org=ORG-210  workflows: mover
     expect 990003 enabled=true  org=ORG-100  workflows: none
   Smoke mover, test (gcc, fixture): 0 Finding, 0 Warn, 0 Info
   Smoke evidence written to out/ch08/smoke-mover
   ```

3. **Leaver phase**, the day after:

   ```bash
   python deploy/smoke_test.py extract --workers deploy/smoke-workers.json --start "$START" --phase leaver --as-of "$DAY3" --out "$EVIDENCE/extract-leaver"
   export HCM_ENTRA_BEARER_TOKEN=$(hrlc_token uploader)
   python ../hcm-entra/python/hcm_to_scim.py --extract "$EVIDENCE/extract-leaver/smoke-extract.csv" --settings "$EVIDENCE/middleware-employee.json" \
       --as-of "$DAY3" --out "$EVIDENCE/scim-leaver" --apply
   ```

   Fixture mode, run on November 2, 2026: the middleware counts the separation as a disable, under its hold threshold.

   ```text
     990003 INACTIVE ORG-100  hire 2026-10-20  leave 2026-11-11
   {"counts": {"ready": 4}, "batches": 1, "disables": 1, "held": false, "hold_reason": ""}
   ```

   Run the leaver workflow on demand, then check:

   ```powershell
   Connect-MgGraph -Environment $MgEnv -TenantId $S.tenantId -Scopes 'LifecycleWorkflows-Workflow.ReadWrite.All', 'User.Read.All' -NoWelcome
   $leaver = Get-MgUser -Filter "employeeId eq '990003'" -Property id
   Initialize-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $S.workflows.leaver -BodyParameter @{ subjects = @(@{ id = $leaver.Id }) }
   ```

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/smoke_test.py check --settings "$SETTINGS" --extract "$EVIDENCE/extract-leaver/smoke-extract.csv" \
       --previous-extract "$EVIDENCE/extract-mover/smoke-extract.csv" --phase leaver --as-of "$DAY3" --since "${DAY3}T00:00:00Z" \
       --mode tenant --out "$EVIDENCE/smoke-leaver" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026:

   ```text
     expect 990000 enabled=true  org=ORG-100  workflows: none
     expect 990001 enabled=true  org=ORG-100  workflows: none
     expect 990002 enabled=true  org=ORG-210  workflows: none
     expect 990003 enabled=false org=ORG-100  workflows: leaver
   Smoke leaver, test (gcc, fixture): 0 Finding, 0 Warn, 0 Info
   Smoke evidence written to out/ch08/smoke-leaver
   ```

   **Expected result, live:** the leaver's `employeeLeaveDateTime` may read the next day in UTC, because the middleware adds a late-in-the-day local time and an offset; the check allows that one day.

What each rule means:

| Rule | Severity | Finding when |
|---|---|---|
| SM-01 | Finding | An in-scope worker has no account, or more than one shares the `employeeId` |
| SM-02 | Finding | `accountEnabled` isn't what the HR record says on that date |
| SM-03 | Finding | `employeeHireDate`, `employeeLeaveDateTime` or `extensionAttribute10` doesn't match the record |
| SM-04 | Finding | The workflow the record calls for has no completed run for that worker since `--since` |
| SM-05 | Finding | A workflow processed someone outside the scope since `--since`: the scope leaked |
| SM-06 | Finding | A provisioning log entry for an in-scope worker failed; a Warn for a failure outside the scope |
| SM-07 | Warn | No provisioning log entry for an in-scope worker since `--since` |

The check reads one user per worker by `employeeId` (a filterable property),[^hw08-users] the workflows' `userProcessingResults`,[^hw08-upr] and the provisioning logs filtered by job.[^hw08-prov] It matches a log entry to a worker by `sourceIdentity.id`, which for an API-driven app is expected to carry the `externalId`; confirm it on the first live run (verification log).

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2, AC-2(1) and IA-4(4) (G2, G3) | The joiner's account exists disabled before day one and is enabled on day one, with the worker type from the record | KSI-IAM-AAM (AC-2); KSI-IAM-JIT (AC-2(1)) | `smoke-joiner-*.json`; `smoke-mover-*.json` (the joiner's day one) |
| IA-5, authenticator management (G3: the Temporary Access Pass bridge) | The pre-hire workflow issues the pass to the manager | KSI-IAM-APM | `smoke-joiner-*.json`; the pre-hire run in `exports/results/pre-hire.json` |
| OMB M-22-09: enterprise identity drawn from HR | The account is made and changed only by the HR record through the middleware | KSI-IAM-AAM | The middleware's provenance and apply results; `smoke-joiner-*.json` |
| PS-5 and AC-6 (G4) | The mover's organization code changes and the mover workflow completes | KSI-IAM-AAM, KSI-IAM-ELP | `smoke-mover-*.json` |
| PS-4 and AC-2(3) (G6) | The leaver is disabled, the leave date set, the leaver workflow completed | KSI-IAM-ELP (PS-4); KSI-IAM-AAM (AC-2(3)); KSI-IAM-JIT, KSI-IAM-SUS (both) | `smoke-leaver-*.json` |
| CM-4(2), verification of controls after a change | Each phase is checked from a fresh read of the tenant | KSI-CMT-VTD | The three records, each with its `exports/` |

: Stage 1 smoke test: requirements, KSIs and evidence {.striped .hover}

### Each chapter's test tenant check

**Gates:** G1 (Chapter 01's writer scan), G2 (Chapter 02's reconciliation), G5 (Chapter 05's CBA check), G6 (Chapter 06's timing).

The go/no-go's criterion 4 needs four earlier chapters' test tenant checks, run against this tenant and kept in this stage's evidence folder. Run them after the leaver phase, so the window holds the synthetic workers' writes and the leaver's separation. Prepare each chapter's input files first, as its Lab 2 says, in `examples/hr-lifecycle`: `my-register.json` from [Chapter 01](01-the-writer-register-as-code.md#lab-2-test-tenant), steps 4 and 5; `my-register.csv`, `my-cards.csv` and `my-sponsors.csv` from [Chapter 02](02-contractor-sources-and-end-dates.md#lab-2-test-tenant); `my-crl-urls.txt` and `my-cba-expected.json` from [Chapter 05](05-certificate-based-authentication-checks.md#lab-2-test-tenant), steps 3 and 4; and `my-separation.json`, `my-separations.csv`, `my-leaver-users.json`, `my-card-revocations.csv`, `my-device-actions.csv` and `my-role-holders.csv` from [Chapter 06](06-separation-timing.md#lab-2-test-tenant), steps 3 and 4, with the synthetic leaver, 990003, as the test leaver. The commands below are those labs' export and check steps, with the reader identity's token, the settings file's cloud and `$EVIDENCE` in place of each lab's folders.

1. **Give the reader identity these checks' permissions.** Print them, and add each one with the admin center path in *Pre-flight checks*, step 1:

   ```bash
   python python/graph_export.py --task writers-scan --list
   python python/graph_export.py --task contractor-reconcile --list
   python python/graph_export.py --task cba-read --list
   python python/graph_export.py --task separation-read --list
   ```

2. **Set the window's end, and take a fresh token:**

   ```bash
   NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   ```

3. **Chapter 01: scan the writes since the joiner phase** against your register copy:

   ```bash
   python python/graph_export.py --task writers-scan --cloud "$(cfg cloud)" --param since="${START}T00:00:00Z" --param until="$NOW" --out "$EVIDENCE/exports/ch01"
   python python/writer_register.py scan --register my-register.json --audit "$EVIDENCE/exports/ch01/directory-audits.json" \
       --since "${START}T00:00:00Z" --until "$NOW" --cloud "$(cfg cloud)" --out "$EVIDENCE/ch01"
   ```

4. **Chapter 02: reconcile the test contractors** against the tenant:

   ```bash
   python python/graph_export.py --task contractor-reconcile --cloud "$(cfg cloud)" --out "$EVIDENCE/exports/ch02"
   python python/contractor_source.py reconcile --register my-register.csv --cards my-cards.csv --sponsors my-sponsors.csv \
       --accounts "$EVIDENCE/exports/ch02/contractor-users.json" --rules config/contractor-rules.json --as-of "${NOW%%T*}" \
       --cloud "$(cfg cloud)" --out "$EVIDENCE/ch02"
   ```

5. **Chapter 05: check certificate-based authentication.** List the PKI containers, then export with the container's ID, measure the test CAs' CRLs from outside the agency network, and check:

   ```bash
   curl -s -H "Authorization: Bearer $HRLC_GRAPH_TOKEN" "$(cfg graphResource)/v1.0/directory/publicKeyInfrastructure/certificateBasedAuthConfigurations"
   python python/graph_export.py --task cba-read --cloud "$(cfg cloud)" --param pkiId=<pki-id> --out "$EVIDENCE/exports/cba"
   python python/cba_check.py measure --urls my-crl-urls.txt --out "$EVIDENCE/cba/crl-measurements.csv"
   python python/cba_check.py check --cloud "$(cfg cloud)" --exports "$EVIDENCE/exports/cba" --crl "$EVIDENCE/cba/crl-measurements.csv" \
       --expected my-cba-expected.json --as-of "${NOW%%T*}" --out "$EVIDENCE/cba/check"
   ```

   Replace `<pki-id>` with the `id` the first command prints.

6. **Chapter 06: measure the leaver's separation timing** from the leaver workflow's runs:

   ```bash
   python python/graph_export.py --task separation-read --cloud "$(cfg cloud)" --param since="${START}T00:00:00Z" \
       --param workflowId="$(cfg workflows.leaver)" --out "$EVIDENCE/exports/separation"
   python python/separation_timing.py measure --separations my-separations.csv --users my-leaver-users.json \
       --audits "$EVIDENCE/exports/separation/separation-audits.json" --results "$EVIDENCE/exports/separation/leaver-results.json" \
       --cards my-card-revocations.csv --devices my-device-actions.csv --role-holders my-role-holders.csv \
       --config my-separation.json --as-of "$NOW" --cloud "$(cfg cloud)" --out "$EVIDENCE/separation"
   ```

   Fixture mode, run on November 9, 2026, with each chapter's Lab 1 fixtures in place of the exports and input files (summary lines only). The fixtures hold a deliberate fault for each rule, so every summary shows Findings:

   ```text
   Writers: 5 Finding, 1 Warn, 0 Info
   Written to out/ch08/ch01 (manifest.json lists every file's SHA-256)
   Reconciliation: 7 Finding, 1 Warn, 0 Info
   Written to out/ch08/ch02 (manifest.json lists every file's SHA-256)
   CBA: 5 Finding, 7 Warn, 0 Info
   Separation: 10 Finding, 2 Warn, 0 Info
   ```

   **Expected result, live:** no Finding in any of the four. Chapter 01 shows no WS-01, WS-02 or WS-04 row: every write to the synthetic workers came from a writer in the register. Chapter 02 shows no CR-01. Chapter 05 shows no CB Finding for the test PKI. Chapter 06 measures the synthetic leaver's separation-to-block and separation-to-revocation within the thresholds in `my-separation.json`. A Finding in any of them stops the stage until it's fixed and the check is run again into a new folder.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AU-6; AC-2 for writes by an unnamed writer (G1) | Chapter 01's scan of the window's protected writes against the writer register | KSI-MLA-RVL; KSI-IAM-SUS | `ch01/findings.json` and its manifest; `exports/ch01` |
| AC-2 account review; PS-7, external personnel security (G2) | Chapter 02's reconciliation of the test contractors against the tenant | KSI-IAM-JIT; KSI-SCR-MON | `ch02/findings.json` and its manifest; `exports/ch02` |
| IA-5(2), public key-based authentication; SC-17; CISA SCuBA MS.AAD.3.1v1 and MS.AAD.3.6v1 (G5) | Chapter 05's check of the trusted CAs, their CRLs and the phishing-resistant policy | KSI-IAM-APM, KSI-SVC-ASM; KSI-SVC-ASM; KSI-IAM-APM | `cba/check` and `cba/crl-measurements.csv`; `exports/cba` |
| PS-4 and AC-2(3) (G6) | Chapter 06's separation-to-block and separation-to-revocation for the synthetic leaver | KSI-IAM-ELP (PS-4); KSI-IAM-AAM (AC-2(3)); KSI-IAM-JIT, KSI-IAM-SUS (both) | `separation/intervals.csv`, `summary.json` and `findings.json`, with the manifest |

: Stage 1 test tenant checks: requirements, KSIs and evidence {.striped .hover}

### Capture the evidence

**Gate:** G7 (evidence kept outside the directory).

1. **Run Chapter 07's drift run against the test tenant**, as its [test tenant steps](07-lifecycle-drift-and-evidence.md#lab-2-test-tenant) describe, writing into `"$EVIDENCE/drift"`. **Expected result:** no LD-01 to LD-03 finding for the synthetic workers.

2. **Hash the stage's evidence folder and keep it outside the directory:**

   ```bash
   (cd "$EVIDENCE" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
   (cd "$EVIDENCE" && sha256sum -c SHA256SUMS | tail -3)
   az login --tenant "$(cfg tenantId)" --output none
   az storage blob upload-batch --account-name "$(cfg evidence.storageAccount)" --destination "$(cfg evidence.container)" \
       --destination-path "$(cfg changeRecord)/$(cfg environment)" --source "$EVIDENCE" --auth-mode login
   ```

   `--auth-mode login` uses the operator's Entra sign-in, not a storage key.[^hw08-upload] The container keeps the immutability and retention Chapter 07 set *(design guidance)*.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AU-9, protection of audit information | The stage's folder is hashed and uploaded to the immutable container | KSI-MLA-OSM | `SHA256SUMS`; the container's immutability setting |
| AU-11 and SI-12, retention | Kept for the records schedule's period | KSI-MLA-OSM (AU-11); none lists SI-12 | The container's retention setting |
| CA-7, continuous monitoring (G7) | Chapter 07's drift run over the test tenant | KSI-MLA-EVC | `drift/` with its package |

: Stage 1 evidence capture: requirements, KSIs and evidence {.striped .hover}

### Roll back (rehearsal)

**Gates:** the guide's [rollback table](../../../books/guides/hr-driven-identity-implementation.md#rollback) for G2, G3, G4 and G6.

The rollback is rehearsed in the test stage, in full, before promotion. It pauses both jobs (a paused job keeps its state), turns off every workflow's schedule (the workflows and their versions stay, and the emergency leaver can still run on demand), removes any automatic assignment policy the stage added, and in the test stage only removes the synthetic accounts, which can be restored for 30 days.[^hw08-pause][^hw08-wfupdate][^hw08-delete]

1. **Write the plan** from the leaver phase's smoke output, whose export lists the synthetic accounts. The plan refuses any account whose `employeeId` is outside the synthetic pattern, and refuses to remove accounts at all in production:

   ```bash
   python deploy/rollback.py plan --settings "$SETTINGS" --smoke "$EVIDENCE/smoke-leaver" --out "$EVIDENCE/rollback-plan" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026, and again on November 9, 2026, for the post-separation label, without `--smoke` (the fixture smoke output has no tenant export):

   ```text
     G2  Pause the employee provisioning job (keeps its state)
     G2  Pause the contractor provisioning job (keeps its state)
     G3  Turn off scheduling for the pre-hire workflow (stays enabled for on-demand runs)
     G3  Turn off scheduling for the day-one workflow (stays enabled for on-demand runs)
     G4  Turn off scheduling for the mover workflow (stays enabled for on-demand runs)
     G6  Turn off scheduling for the leaver workflow (stays enabled for on-demand runs)
     G6  Turn off scheduling for the post-separation workflow (stays enabled for on-demand runs)
     G2  Turn off scheduling for the contractor-leaver workflow (stays enabled for on-demand runs)
   Rollback plan, test: 8 steps, Graph scopes Synchronization.ReadWrite.All, LifecycleWorkflows-Workflow.ReadWrite.All
   Written to out/ch08/rollback-plan/rollback.ps1; nothing was sent
   ```

   **Expected result, live:** four more steps, `Remove synthetic account 990000` to `990003`, and `User.ReadWrite.All` in the scopes. If the stage recorded an automatic assignment policy in its settings, there is also one `Remove automatic assignment policy` step for each policy, and `EntitlementManagement.ReadWrite.All` in the scopes.

2. **Dry-run the script**, and have the second operator read every line:

   ```bash
   pwsh -NoProfile -File "$EVIDENCE/rollback-plan/rollback.ps1"
   ```

   Fixture mode, run on November 2, 2026 (first and last lines):

   ```text
   [dry run] G2 Pause the employee provisioning job (keeps its state)
       Suspend-MgServicePrincipalSynchronizationJob -ServicePrincipalId '33333333-3333-4333-8333-333333333301' -SynchronizationJobId 'API2AAD.0000000000000000000000000000000a.33333333-3333-4333-8333-333333333301'
   ...
   [dry run] G2 Turn off scheduling for the contractor-leaver workflow (stays enabled for on-demand runs)
       Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId '44444444-4444-4444-8444-444444444406' -BodyParameter @{ isSchedulingEnabled = $false }
   Dry run: 8 steps, nothing changed. Run again with -Apply to roll back.
   ```

3. **Apply it.** Activate Application Administrator, Lifecycle Workflows Administrator, Identity Governance Administrator (if the plan removes an automatic assignment policy) and, in test, User Administrator; the script signs in with Graph PowerShell for the tenant's cloud:

   ```bash
   pwsh -NoProfile -File "$EVIDENCE/rollback-plan/rollback.ps1" -Apply
   ```

4. **Verify from a fresh read:**

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/rollback.py verify --settings "$SETTINGS" --mode tenant --out "$EVIDENCE/rollback-verify" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026, and again on November 9, 2026, for the post-separation label:

   ```text
   RB-01 Info    contractor: job is Paused
   RB-01 Info    employee: job is Paused
   RB-02 Info    contractor-leaver: scheduling is off
   RB-02 Info    day-one: scheduling is off
   RB-02 Info    leaver: scheduling is off
   RB-02 Info    mover: scheduling is off
   RB-02 Info    post-separation: scheduling is off
   RB-02 Info    pre-hire: scheduling is off
   Rollback verify, test (gcc, fixture): 0 Finding, 0 Warn, 8 Info
   Verification written to out/ch08/rollback-verify
   ```

5. **Close the session.** Hash and upload the evidence folder again (the commands in *Capture the evidence*), then delete the certificates' session copies and sign out of the Azure CLI:

   ```bash
   rm -rf "$RUNBOOK_TMP"
   unset HRLC_GRAPH_TOKEN HCM_ENTRA_BEARER_TOKEN
   az account clear
   ```

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3, configuration change control | A documented, reviewed back-out in the guide's order, dry-run before it's applied | KSI-CMT-RMV, KSI-CMT-RVP | `rollback-plan-*.json`; `rollback.ps1` and its dry-run output |
| CM-5, access restrictions for change | Applied only with activated roles and a second operator | KSI-IAM-JIT | The PIM activation records; the change record's witness entry |
| CM-4(2), verification of controls | The tenant is read again: jobs paused, schedules off | KSI-CMT-VTD, KSI-CMT-LMC | `rollback-verify-*.json` |

: Stage 1 rollback: requirements, KSIs and evidence {.striped .hover}

## Promotion go/no-go

**Gate:** the hand-off between the guide's pilot and production. The criteria are *design guidance*: the agency's change board may add to them, never remove one.

| # | Criterion | Evidence | Gate |
|---|---|---|---|
| 1 | The test pre-flight after deploy has 0 Finding, 0 Warn | `evidence/test/preflight-after-deploy` | Prerequisites, G1 |
| 2 | All three smoke phases have 0 Finding, 0 Warn | `evidence/test/smoke-joiner`, `smoke-mover`, `smoke-leaver` | G2, G3, G4, G6 |
| 3 | The rollback was applied and verified with 0 Finding | `evidence/test/rollback-plan`, `rollback-verify` | Rollback table |
| 4 | Each chapter's test tenant step ran clean: Chapter 01's writer scan, Chapter 02's reconciliation, Chapter 05's CBA check, Chapter 06's timing | `evidence/test/ch01`, `ch02`, `cba/check` and `separation`, from *Each chapter's test tenant check* | G1, G2, G5, G6 |
| 5 | Chapter 07's drift run on the test tenant has no LD-01 to LD-03 for the synthetic workers | `evidence/test/drift` | G7 |
| 6 | The test evidence is uploaded, and `sha256sum -c SHA256SUMS` passes on the uploaded copy | The evidence container | G7 |
| 7 | The ISSO has accepted the test evidence | The production change record | All |
| 8 | The production change record is approved, with the window, the first scope and the rollback plan | The production change record | All |
| 9 | The production pre-flight, with the test evidence, shows no Finding other than PF-05 for the workflows not yet created; after the Stage 2 deploy, its pre-flight has 0 Finding | `evidence/production/preflight`, then `evidence/production/preflight-after-deploy` | All |
| 10 | Every requirement row of the test stage has its evidence present and passing: `evidence.py check --stage test` has 0 Finding | The command's output, kept with the go/no-go record | All |

Criterion 10 is one command over the test stage's records:

```bash
python deploy/evidence.py check --evidence-dir evidence/test/records --stage test
```

It passes only when the settings check, the pre-flight after deploy, the recorded workflows, all three smoke phases, the rollback plan and the rollback verify each have a newest record that passed, for the test environment, and whose output folder is unchanged; a record edited after it was written fails `SHA256SUMS` (EV-04). The table rows that are admin center or PowerShell actions are checked against the change record by the ISSO. Any criterion not met is a no-go; the stage stays in test.

## Stage 2: production

The production HR feed and the production tenant: Microsoft 365 GCC (Moderate) for the target estate, or GCC High where the guide's [starting state](../../../books/guides/hr-driven-identity-implementation.md#where-agencies-start) says so. Only the settings file changes. The synthetic workers never go into the production HR feed; production checks real records in the first scope.

### Change record and pre-flight

**Gates:** prerequisites; PF-06 is the go/no-go's criterion 9.

1. **Open the production session**: the session block in *One environment settings file*, step 3, with `SETTINGS=deploy/settings.production.json`, and the PowerShell block in step 4 with `$SETTINGS = 'deploy/settings.production.json'`. Check the file:

   ```bash
   python deploy/deploy_settings.py check --settings "$SETTINGS" --evidence-dir "$EVIDENCE/records"
   ```

   Until the *Deploy* step below creates the production workflows, this check fails DS-02 and DS-05 for the six workflow IDs alone; that is expected, as in Stage 1.

2. **Run the pre-flight with the test evidence.** Download the test stage's last smoke output from the evidence container first, so the check reads the kept copy:

   ```bash
   az storage blob download-batch --account-name "$(cfg evidence.storageAccount)" --source "$(cfg evidence.container)" \
       --pattern "*/test/smoke-leaver/*" --destination evidence/kept --auth-mode login
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/preflight.py --settings "$SETTINGS" --mode tenant --test-evidence "$(find evidence/kept -type d -path '*/test/smoke-leaver' | head -1)" \
       --out "$EVIDENCE/preflight" --evidence-dir "$EVIDENCE/records"
   ```

   Fixture mode, run on November 2, 2026, first without the test evidence, then with the fixture-mode leaver output:

   ```text
   PF-06 Finding test evidence: production needs the test stage's smoke evidence (--test-evidence)
   Pre-flight production (gcc, fixture): 1 Finding, 0 Warn, 15 Info
   ...
   PF-06 Info    out/ch08/smoke-leaver: the test stage's smoke evidence is clean
   Pre-flight production (gcc, fixture): 0 Finding, 0 Warn, 16 Info
   ```

   Before the production workflows exist, PF-05 reports each as missing, so the live run shows those rows as its only Findings; the 0 Finding result is the pre-flight after the *Deploy* step below. A tenant-mode production run refuses fixture-mode evidence: the modes must match (a test pins that).

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3, configuration change control | The approved production change record's ID is in the settings file and every record | KSI-CMT-LMC, KSI-CMT-RVP | `settings-check-*.json` for production; the change record |
| CM-3(2) | The production pre-flight needs the test stage's clean evidence, from the same mode (PF-06) | KSI-CMT-VTD | `preflight-*.json` with PF-06 Info; criterion 10's output |
| AC-5, AC-6 and BOD 25-01 MS.AAD.7.5v1 | PF-02 in the production tenant | KSI-IAM-JIT, KSI-IAM-ELP | `preflight/exports/role-eligibility.json` |

: Stage 2 change record and pre-flight: requirements, KSIs and evidence {.striped .hover}

### Deploy

**Gates:** G2, G3, G6, G1.

Run the same five deploy steps as Stage 1 (*Deploy*, steps 1 to 5), in the production session; in step 5, add the `--test-evidence` argument from the pre-flight step above, because a production pre-flight without it gives a PF-06 Finding. **Expected result:** six workflows created with scheduling off, the IDs recorded in `deploy/settings.production.json`, and a pre-flight after deploy with 0 Finding. Stage 1's deploy table applies row for row; its evidence is the production session's `workflow-plan`, `workflow-ids.json` and `workflows-recorded-*.json`.

### Staged enable by scope

**Gates:** G2 (one population at a time), G3 and G6 (workflows on schedule only after the scope is clean), G4.

1. **Scope both apps to the first department.** The same admin center path as Stage 1, with one clause: the organization code's attribute (`urn:ietf:params:scim:schemas:extension:contoso:1.0:User:orgCode` in the kit's mapping, or your namespace), operator **EQUALS**, value the settings file's first department code (`ORG-100` in the fixture).[^hw08-scoping] Each later scope is a further scoping filter on the same app: filters combine with OR, so adding one widens the scope. Never narrow a filter in production: a user who falls out of scope can be disabled.[^hw08-scoping]

2. **Start both jobs**, with the PowerShell block of Stage 1's staged enable, step 2.

3. **Send the first scope's records.** The middleware sends the full extract for the scope, as Microsoft's sequence for an Oracle source has it (five to ten records first, then the rest, then the feeds),[^hw08-oracle-seq] with the production extract the HCM integration delivers:

   ```bash
   export HCM_ENTRA_BEARER_TOKEN=$(hrlc_token uploader)
   python ../hcm-entra/python/hcm_to_scim.py --extract <production-extract-csv> --settings "$EVIDENCE/middleware-employee.json" \
       --as-of <today> --out "$EVIDENCE/scim-first-scope" --apply
   ```

   Replace `<production-extract-csv>` with the path of the day's HCM extract for the scope and `<today>` with the date (`yyyy-mm-dd`). The middleware holds the run if disables pass its threshold ([Book 19, Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md)).

4. **Smoke-test the scope.** The check derives every expectation from the same extract and the scope in the settings file, so production uses the same code as test:

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/smoke_test.py check --settings "$SETTINGS" --extract <production-extract-csv> --phase scope \
       --as-of <today> --since <today>T00:00:00Z --mode tenant --out "$EVIDENCE/smoke-first-scope" --evidence-dir "$EVIDENCE/records"
   ```

   **Expected result:** one `expect` line per worker in the first department, 0 Finding; SM-07 Warns only until the cycle has run. Then run each workflow on demand for one worker the day's records call for (at most 10 users per on-demand run),[^hw08-ondemand] and check again into `"$EVIDENCE/smoke-first-scope-2"`.

5. **Turn on the schedules** only when the scope's check is clean. Activate Lifecycle Workflows Administrator:

   ```powershell
   Connect-MgGraph -Environment $MgEnv -TenantId $S.tenantId -Scopes 'LifecycleWorkflows-Workflow.ReadWrite.All' -NoWelcome
   foreach ($key in $S.workflows.PSObject.Properties.Name) {
       Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId $S.workflows.$key -BodyParameter @{ isEnabled = $true; isSchedulingEnabled = $true }
   }
   ```

   The tenant schedule then evaluates every scheduled workflow, every three hours by default.[^hw08-wfupdate] Each workflow's own scope rule (Chapter 03) decides who it runs for; the provisioning scope decides who exists.

6. **Widen the scope** one department at a time, after a clean first week (below): add a scoping filter for the next code, send that scope's records, and repeat steps 4 and 5's checks for it.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-2, AC-2(1), PS-4 and PS-5 (G2 to G6) | Only the first department is in scope, and every worker in it is checked against the day's HR extract | KSI-IAM-AAM (AC-2); KSI-IAM-JIT (AC-2(1), PS-4); KSI-IAM-ELP (PS-4, PS-5); KSI-IAM-SUS (PS-4) | `smoke-scope-*.json` with `smoke-first-scope/expectations.json` |
| OMB M-22-09 | Production accounts come only from the HR feed through the middleware | KSI-IAM-AAM | `scim-first-scope/provenance.json` and `apply-results.json` |
| CM-3(2) and CM-4(2) | Schedules go on only after a clean scope check; scopes are only widened | KSI-CMT-VTD | The `smoke-scope-*.json` record dated before the schedules went on; the audit log's workflow updates |

: Stage 2 staged enable by scope: requirements, KSIs and evidence {.striped .hover}

### First-week monitoring

**Gate:** G7 (the metrics on the continuous monitoring cadence), with G6's timing.

Every day of the first week, the operator runs the drift run and the scope check, and packages both, as Chapter 07 does:

1. **The day's scope check:**

   ```bash
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/smoke_test.py check --settings "$SETTINGS" --extract <production-extract-csv> --phase scope \
       --as-of <today> --since <yesterday>T00:00:00Z --mode tenant --out "$EVIDENCE/monitor/<today>/scope" --evidence-dir "$EVIDENCE/records"
   ```

2. **The day's drift run and package**, with the commands of Chapter 07's [test tenant steps](07-lifecycle-drift-and-evidence.md#lab-2-test-tenant) 1 and 3, `--mode tenant`, the production tenant's ID, and `--out "$EVIDENCE/monitor/<today>/drift"`; then `hr_evidence.py package` with `--previous-manifest` from the day before.

3. **Read the metrics against the thresholds** in `config/drift.json`. The decision rules below are *design guidance*:

   | Signal | Threshold source | Action |
   |---|---|---|
   | SM-05: a workflow ran outside the scope | Any | Roll back now |
   | LD-03: an orphan the pipeline created | Any | Roll back now |
   | SM-02 or LD-02: an account enabled for a separated worker | Any | Fix at the source today; roll back if a second appears |
   | Separation-to-block, 90th percentile (LD-07) | `config/drift.json` | Over threshold two days running: roll back |
   | Joiner readiness rate (LD-07) | `config/drift.json` | Under threshold: hold the next scope |
   | Correlation coverage (LD-07) | `config/drift.json` | Under threshold: hold the next scope |
   | A provisioning job in `Quarantine` | Any | Roll back; read the quarantine reason first |

   **Expected result:** for a clean first scope, no LD-01 to LD-06 for the scope's workers, and every metric that has inputs within its threshold. A metric with no input reads *not measured* (LD-08), never zero ([Chapter 07](07-lifecycle-drift-and-evidence.md#the-metrics)).

4. **Hash and upload the day's folder**, with the commands in Stage 1's *Capture the evidence*, step 2.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7, continuous monitoring (G7) | The six metrics every day against `config/drift.json` | KSI-MLA-EVC | The daily packages and the week's period summary |
| AU-6, audit record review | LD-04 from the audit log; the day's findings read by the operator | KSI-MLA-RVL *(design guidance)* | The daily packages; the review entries in the change record |
| PS-4 (G6) | Separation-to-block and separation-to-revocation, 90th percentile | KSI-IAM-ELP, KSI-IAM-JIT, KSI-IAM-SUS | `metrics.json` in each day's run |
| CISA BOD 25-01, continuous reporting | ScubaGear for the identity policies, as Chapter 07 says | — (not this code) | The ScubaGear results beside the period |
| AU-9 and AU-11 | Each day's folder hashed and uploaded | KSI-MLA-OSM (AU-9) | `SHA256SUMS`; the container |

: Stage 2 first-week monitoring: requirements, KSIs and evidence {.striped .hover}

### Roll back (production)

**Gates:** the guide's rollback table.

The production plan has no `--smoke`: production deletes no account, and never narrows a scope.

1. **Write the plan, dry-run it, and have the second operator read it.** Do this at the start of the window, before any change, so the plan is ready:

   ```bash
   python deploy/rollback.py plan --settings "$SETTINGS" --out "$EVIDENCE/rollback-plan" --evidence-dir "$EVIDENCE/records"
   pwsh -NoProfile -File "$EVIDENCE/rollback-plan/rollback.ps1"
   ```

   Fixture mode, run on November 2, 2026: the same eight steps as the test plan, `Rollback plan, production: 8 steps, Graph scopes Synchronization.ReadWrite.All, LifecycleWorkflows-Workflow.ReadWrite.All`. Rewrite it into a new folder after any change to the settings file (a recorded workflow or policy ID).

2. **If a rollback rule fires, apply it and verify**, with the change owner informed:

   ```bash
   pwsh -NoProfile -File "$EVIDENCE/rollback-plan/rollback.ps1" -Apply
   export HRLC_GRAPH_TOKEN=$(hrlc_token reader)
   python deploy/rollback.py verify --settings "$SETTINGS" --mode tenant --out "$EVIDENCE/rollback-verify" --evidence-dir "$EVIDENCE/records"
   ```

   **Expected result:** RB-01 and RB-02 Info only. The accounts the scope created stay, as their HR records say; workers separated while the jobs are paused are the guide's emergency path: an out-of-band block, then the leaver workflow on demand ([Book 03, Chapter 08](../../../books/b03-hr-identity/08-joiner-mover-leaver.md#emergency-termination)). Resume with `Start-MgServicePrincipalSynchronizationJob`, which continues from where the job paused,[^hw08-start] once the cause is fixed at the source.

3. **Check the production stage's evidence** before the change record closes, and keep the output with it:

   ```bash
   python deploy/evidence.py check --evidence-dir "$EVIDENCE/records" --stage production
   ```

   **Expected result:** EV-01 Info for the settings check, the pre-flight, the recorded workflows, the first scope's check and the rollback plan, and 0 Finding.

4. **Close the session** with Stage 1's step 5 commands.

**Requirements and evidence for this step.**

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3 and CM-5 | The plan is written and dry-run at the start of the window; applied only with activated roles | KSI-CMT-RMV, KSI-CMT-RVP, KSI-IAM-JIT | `rollback-plan-*.json`; the dry-run output; PIM activation records |
| CM-4(2) | If applied, verified from a fresh read | KSI-CMT-VTD, KSI-CMT-LMC | `rollback-verify-*.json` |

: Stage 2 rollback: requirements, KSIs and evidence {.striped .hover}

## Evidence the ISSO keeps

Each folder below is written once by a script, with a `manifest.json` holding a SHA-256 per file, the environment, the tenant ID, the mode and the change record; each stage's folder is hashed into `SHA256SUMS` and kept in the evidence container outside the directory. The gate tables in the guide name the requirement each serves.

| Stage | What | From | Gate and requirement |
|---|---|---|---|
| Both | The evidence records, `evidence-index.csv` and `SHA256SUMS` in `records/` | Every deploy script | Each record names its controls and KSIs; criterion 10 |
| Both | The settings file, its `check` output, and its SHA-256 in every manifest | `deploy_settings.py` | All; ties every output to the change record *(design guidance)* |
| Both | The pre-flight before and after deploy, with what it read | `preflight.py` | Prerequisites; G1 (AC-2) |
| Both | The workflow plan, the bodies sent and the IDs created | `joiner_workflows.py plan`, `workflow-ids.json` | G3 (AC-2(1)) |
| Both | The middleware's settings, validation report, provenance and apply results per send | `examples/hcm-entra` | G2 (AC-2, PS-7, IA-4(4)) |
| Test | The three smoke phases, with their expectations and exports | `smoke_test.py` | G2, G3, G4 (PS-5), G6 (PS-4) |
| Test | The rollback plan, its dry run and the verify | `rollback.py` | The rollback table |
| Test | The ISSO's acceptance and the signed go/no-go | The production change record | Promotion |
| Production | The production pre-flight with PF-06 | `preflight.py` | Promotion |
| Production | Each scope's smoke check, and the day's check through the first week | `smoke_test.py` | G2 to G6 |
| Production | The daily drift packages and the first week's period | Chapter 07's `lifecycle_drift.py` and `hr_evidence.py` | G7 (CA-7, AU-6, AU-11, SI-12) |
| Production | The rollback plan written at the start of the window, and any rollback's verify | `rollback.py` | The rollback table |

Names and personal data stay in the access-controlled store: the exports under each folder's `exports/` hold user principal names and HR dates, as Chapter 07's runs do.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Get synchronizationJob | `GET /servicePrincipals/{id}/synchronization/jobs/{jobId}`; application least privileged `Application.ReadWrite.OwnedBy`, higher `Synchronization.Read.All` | US Government L4 and L5 | v1.0 | [^hw08-jobget] |
| Job status codes | `NotConfigured`, `NotRun`, `Active`, `Paused`, `Quarantine`; paused keeps the job's state | — | v1.0 | [^hw08-jobstatus] |
| Pause and start a job | `POST .../pause` (`Suspend-MgServicePrincipalSynchronizationJob`); start continues a paused job and clears quarantine (`Start-MgServicePrincipalSynchronizationJob`); `Synchronization.ReadWrite.All` delegated | US Government L4 and L5 | v1.0 | [^hw08-pause] [^hw08-start] |
| API-driven app | Notification email mandatory or the job quarantines on start; Restart purges pending payloads; Provision on demand not supported | API-driven inbound provisioning available in Azure Government | GA | [^hw08-config] [^hw08-feat] |
| Scoping filters | Clauses AND, filters OR; saving starts a full sync; out-of-scope users can be disabled | — | GA | [^hw08-scoping] |
| Accidental deletions | **Edit provisioning** > **Settings** > **Prevent accidental deletions**; held objects as `StagedAction` or `StagedDelete` | — | GA | [^hw08-accdel] |
| List subscribedSkus | `GET /subscribedSkus`; `LicenseAssignment.Read.All` | US Government L4 and L5 | v1.0 | [^hw08-skus] |
| List roleEligibilitySchedules | `GET /roleManagement/directory/roleEligibilitySchedules`; `RoleEligibilitySchedule.Read.Directory` | US Government L4 and L5 | v1.0 | [^hw08-elig] |
| Workflow enable and schedule | `isEnabled` true allows on-demand runs; `isSchedulingEnabled` can't be true for a disabled workflow; update with `Update-MgIdentityGovernanceLifecycleWorkflow`, `LifecycleWorkflows-Workflow.ReadWrite.All` | Lifecycle Workflows available in Azure Government | v1.0 | [^hw08-wf] [^hw08-wfupdate] [^hw08-feat] |
| On-demand run | The workflow must be enabled; up to 10 users; runs regardless of execution conditions; `Initialize-MgIdentityGovernanceLifecycleWorkflow`, least privileged `LifecycleWorkflows-Workflow.Activate` | US Government L4 and L5 | v1.0 | [^hw08-ondemand] |
| Delete a user | `User.ReadWrite.All`; User Administrator; restorable for 30 days | US Government L4 and L5 | v1.0 | [^hw08-delete] |
| Graph PowerShell clouds | `Global`, `USGov`, `USGovDoD` | — | — | [^hw08-mgenv] |
| Oracle key and sign-in | `PersonNumber`, not `PersonID`, which varies across environments; JWT for feeds; tokens from the Fusion instance's OCI IAM identity domain; client assertion recommended over a client secret | — | — | [^hw08-ora-ems] [^hw08-ora-oauth] |

Places the sources differ or say nothing, recorded so a later edit doesn't loosen the runbook:

- **The sync job read.** Learn ranks a write permission, `Application.ReadWrite.OwnedBy`, least privileged for a GET; the kit takes the read-only `Synchronization.Read.All`.
- **A new workflow's default state.** One Learn page says new workflows are enabled by default, another that they're disabled for testing; the runbook sets both properties in the body.
- **The deletion threshold setting.** Learn's example response for a job shows `QuarantineTooManyDeletesThreshold` but no page describes it; PF-04 treats its absence as a Warn only.
- **`externalId` as a scoping attribute, and `sourceIdentity.id` in the provisioning logs, for an API-driven app.** Neither is shown on Learn; the first live run confirms both.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A secret in a settings file | A credential in a repository or a ticket | DS-01 refuses secret-shaped keys and values; certificates stay in the key vault |
| Test commands run against production | Synthetic records or test settings in production | One settings file per environment; every manifest records the environment and tenant; production refuses the synthetic accounts' removal |
| A workflow scheduled before it's checked | Every matching user processed on the next run | Bodies created with scheduling off; PF-05; schedules on only after a clean scope |
| On-demand runs outside the scope | Tasks applied to anyone selected, whatever the scope | Run only for named smoke or scope workers, witnessed; SM-05 catches any subject outside the scope |
| Narrowing a scoping filter in production | Users who fall out of scope can be disabled | Production only adds filters; rollback pauses instead |
| **Restart provisioning** | Pending payloads purged | Rollback pauses; never Restart |
| Promotion on a test run with findings | Production inherits a known fault | PF-06 refuses changed, failing or wrong-mode test evidence |
| Removing a real account in rollback | A worker loses access and data | The plan removes only accounts in the smoke export whose `employeeId` matches the synthetic pattern, in test only |
| A stale rollback plan | The script misses a workflow or policy added later | Write the plan at the start of the window and again after any settings change |
| Expired logs | Evidence that can't be recovered | Diagnostic settings before the first send; daily packages |

## Checklist

- [ ] Both settings files pass `check`, hold no secret, and are kept in the agency's reviewed configuration repository.
- [ ] Every role is a PIM eligibility, and the second operator is named for each window.
- [ ] Both provisioning apps have a notification email, accidental-deletion prevention and the **Delete** action off.
- [ ] Logs leave the directory before the first send.
- [ ] The test stage ran all three smoke phases clean, and the rollback was applied and verified.
- [ ] All ten go/no-go criteria are met and signed, with `evidence.py check --stage test` clean.
- [ ] The production rollback plan was written and dry-run at the start of the window.
- [ ] Production scopes were only ever widened, and each widening followed a clean week.
- [ ] Each stage's evidence is hashed, uploaded, and accepted by the ISSO.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — Lifecycle Drift, Metrics and Evidence](07-lifecycle-drift-and-evidence.md) · [Workbook index](index.md)
:::

[^hw08-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 1, 2026; carried from Book 19, Chapter 02).
[^hw08-feat]: Microsoft Learn, "Microsoft Entra feature availability" (Azure for US Government: Lifecycle Workflows and API-driven inbound provisioning available; Entra ID Governance in GCC, GCC High and DoD), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw08-config]: Microsoft Learn, "Configure API-driven inbound provisioning app" (roles; mandatory notification email or quarantine on start; Start, Stop, Restart and Edit provisioning; Provision on demand not supported; the Provisioning API Endpoint), <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-configure-app> (read November 2, 2026).
[^hw08-faq]: Microsoft Learn, "Frequently asked questions about API-driven inbound provisioning" (scoping filters to exclude users; no deletion through `/bulkUpload`; turn off the Delete target action; accidental deletion threshold; soft-deleted Entra users restorable for 30 days), <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-faqs> (read November 2, 2026).
[^hw08-scoping]: Microsoft Learn, "Scoping users or groups to be provisioned with scoping filters in Microsoft Entra ID" (menu path; clauses combine with AND, filters with OR; operators; saving a new filter triggers a full sync and out-of-scope users can be disabled or deprovisioned), <https://learn.microsoft.com/entra/identity/app-provisioning/define-conditional-rules-for-provisioning-user-accounts> (read November 2, 2026).
[^hw08-accdel]: Microsoft Learn, "Enable accidental deletions prevention in the Microsoft Entra provisioning service" (menu path; threshold per cycle; disables count; `StagedAction` and `StagedDelete`), <https://learn.microsoft.com/entra/identity/app-provisioning/accidental-deletions> (read November 2, 2026).
[^hw08-bulk]: Microsoft Learn, "Perform bulkUpload" (`202 Accepted` with a `Location` header to the provisioning logs), <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-post-bulkupload?view=graph-rest-1.0> (read November 1, 2026; carried from Chapter 02).
[^hw08-jobget]: Microsoft Learn, "Get synchronizationJob" (national clouds; application least privileged `Application.ReadWrite.OwnedBy`, higher `Synchronization.Read.All`; the example response's `synchronizationJobSettings`), <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-get?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-jobstatus]: Microsoft Learn, "synchronizationStatus resource type" (status codes and their meaning), <https://learn.microsoft.com/graph/api/resources/synchronization-synchronizationstatus?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-pause]: Microsoft Learn, "synchronizationJob: pause" (state persisted; national clouds; `Synchronization.ReadWrite.All` delegated; `Suspend-MgServicePrincipalSynchronizationJob`), <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-pause?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-start]: Microsoft Learn, "Start-MgServicePrincipalSynchronizationJob" (continues a paused job; clears quarantine; don't call it continuously), <https://learn.microsoft.com/powershell/module/microsoft.graph.applications/start-mgserviceprincipalsynchronizationjob?view=graph-powershell-1.0> (read November 2, 2026).
[^hw08-skus]: Microsoft Learn, "List subscribedSkus" (`LicenseAssignment.Read.All`; national clouds; `skuPartNumber`, `capabilityStatus`, `prepaidUnits`, `consumedUnits`), <https://learn.microsoft.com/graph/api/subscribedsku-list?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-elig]: Microsoft Learn, "List roleEligibilitySchedules" (`RoleEligibilitySchedule.Read.Directory`; national clouds; `roleDefinitionId`, `directoryScopeId`, `status`), <https://learn.microsoft.com/graph/api/rbacapplication-list-roleeligibilityschedules?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-roles]: Microsoft Learn, "Microsoft Entra built-in roles," all roles (template IDs of Application Administrator, Hybrid Identity Administrator, Lifecycle Workflows Administrator, Identity Governance Administrator, Authentication Policy Administrator and User Administrator), <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> (read November 2, 2026).
[^hw08-pim]: Microsoft Learn, "Activate a Microsoft Entra role in PIM," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-activate-role> (read November 2, 2026).
[^hw08-wf]: Microsoft Learn, "workflow resource type" (`isEnabled`: the workflow can run on demand, or on schedule when `isSchedulingEnabled` is true; `isSchedulingEnabled` can't be true for a disabled workflow), <https://learn.microsoft.com/graph/api/resources/identitygovernance-workflow?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-wfupdate]: Microsoft Learn, "Update workflow" and "Update-MgIdentityGovernanceLifecycleWorkflow" (`isEnabled` and `isSchedulingEnabled` updatable; `LifecycleWorkflows-Workflow.ReadWrite.All`), <https://learn.microsoft.com/graph/api/identitygovernance-workflow-update?view=graph-rest-1.0>, and "Understanding lifecycle workflows," scheduling (every three hours by default), <https://learn.microsoft.com/entra/id-governance/understanding-lifecycle-workflows> (read November 2, 2026).
[^hw08-ondemand]: Microsoft Learn, "Run a workflow on-demand" (to test before the scheduled run; up to 10 users; the workflow must be enabled; execution conditions not considered), <https://learn.microsoft.com/entra/id-governance/on-demand-workflow>, and "workflow: activate" (`LifecycleWorkflows-Workflow.Activate`; `Initialize-MgIdentityGovernanceLifecycleWorkflow`), <https://learn.microsoft.com/graph/api/identitygovernance-workflow-activate?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-lcwplan]: Microsoft Learn, "Plan a Lifecycle Workflow deployment" (pilot with a small group or a single test user; test on demand), <https://learn.microsoft.com/entra/id-governance/lifecycle-workflows-deployment>; "Create a lifecycle workflow" ("By default, a newly created workflow is disabled"), <https://learn.microsoft.com/entra/id-governance/create-lifecycle-workflow>; and "Understanding lifecycle workflows" ("newly created workflows are enabled by default"), <https://learn.microsoft.com/entra/id-governance/understanding-lifecycle-workflows> (read November 2, 2026).
[^hw08-users]: Microsoft Learn, "user resource type," `employeeId` (supports `$filter` with `eq`), <https://learn.microsoft.com/graph/api/resources/user?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-upr]: Microsoft Learn, "List userProcessingResults," permissions and national clouds, <https://learn.microsoft.com/graph/api/identitygovernance-workflow-list-userprocessingresults?view=graph-rest-1.0> (read November 1, 2026; carried from Chapter 06).
[^hw08-prov]: Microsoft Learn, "List provisioningObjectSummary," permissions, <https://learn.microsoft.com/graph/api/provisioningobjectsummary-list?view=graph-rest-1.0> (read November 1, 2026; carried from Chapter 01).
[^hw08-delete]: Microsoft Learn, "Delete a user" (`User.ReadWrite.All`; User Administrator or Privileged Authentication Administrator; restorable within 30 days; `Remove-MgUser`), <https://learn.microsoft.com/graph/api/user-delete?view=graph-rest-1.0> (read November 2, 2026).
[^hw08-mgenv]: Microsoft Learn, "Authentication module cmdlets in Microsoft Graph PowerShell," Use Get-MgEnvironment (`Global`, `USGov`, `USGovDoD`), <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands?view=graph-powershell-1.0> (read November 2, 2026).
[^hw08-azlogin]: Microsoft Learn, "Sign into Azure with a service principal using the Azure CLI" and "Create a service principal containing a certificate using Azure CLI," Retrieve a certificate from Azure Key Vault (`az keyvault secret download` with `--encoding base64`, then `openssl pkcs12 ... -nodes`; `az login --service-principal --certificate`), <https://learn.microsoft.com/cli/azure/azure-cli-sp-tutorial-3?view=azure-cli-latest>; and "az account get-access-token" (valid at most 60 minutes), <https://learn.microsoft.com/cli/azure/account?view=azure-cli-latest> (read November 2, 2026).
[^hw08-azgov]: Microsoft Learn, "Quickstart: Connect to Azure Government with Azure CLI" (`az cloud set --name AzureUSGovernment`), <https://learn.microsoft.com/azure/azure-government/documentation-government-get-started-connect-with-cli> (read November 2, 2026).
[^hw08-perms]: Microsoft Learn, "Configure app permissions for a web API," add permissions to access Microsoft Graph (application permissions; Grant admin consent), <https://learn.microsoft.com/entra/identity-platform/quickstart-configure-app-access-web-apis> (read November 2, 2026).
[^hw08-diag]: Microsoft Learn, "How to archive Microsoft Entra activity logs to an Azure storage account" (menu path), <https://learn.microsoft.com/entra/identity/monitoring-health/howto-archive-logs-to-storage-account> (read November 2, 2026).
[^hw08-upload]: Microsoft Learn, "az storage blob," upload-batch and download-batch (`--destination-path`, `--pattern`, `--auth-mode login`), <https://learn.microsoft.com/cli/azure/storage/blob?view=azure-cli-latest> (read November 2, 2026).
[^hw08-ora-ems]: Oracle, *Oracle Fusion Cloud HCM Integration with External Entitlement Management Systems* ("PersonID can vary across environments, so you must use PersonNumber"; "Use JWT to access HCM data feeds and SCIM APIs"), <https://docs.oracle.com/en/applications/fusion-apps/fusion-human-capital-management/hcmintegration/index.html> (read November 2, 2026).
[^hw08-ora-oauth]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Configure OAuth" (tokens from the OCI IAM identity domain of the Fusion instance; Client Credentials only for Spectra services; client assertion recommended over a client secret), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/configure_oauth.html> (read November 2, 2026).
[^hw08-oracle-seq]: Microsoft Learn, "Configure Oracle Human Capital Management (HCM) for automatic user provisioning" (initial sync, then the feeds; five to ten records first), <https://learn.microsoft.com/entra/identity/saas-apps/oracle-hcm-provisioning-tutorial> (read October 25, 2026; carried from *Building Book 03's HR Pipeline*).
[^hw08-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026* (the indicator IDs and names used here: KSI-IAM-AAM, IAM-APM, IAM-ELP, IAM-JIT, IAM-SUS, SCR-MON, CMT-LMC, CMT-RMV, CMT-RVP, CMT-VTD, MLA-EVC, MLA-OSM, MLA-RVL, SVC-ACM, SVC-ASM), <https://www.fedramp.gov/2026/reference/key-security-indicators/> (read November 2, 2026; the same source Book 13, Appendix A and Book 14, Chapter 03 cite).
[^hw08-nist]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, OSCAL profile (AC-2, AC-2(1), AC-2(3), AC-5, AC-6, AU-6, AU-11, CA-7, IA-4(4), PS-4, PS-5, PS-7 and SI-12 included), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (read November 1, 2026; carried from the HR-driven identity implementation guide). IA-5 is carried from the guide's Gate 3 table.
[^hw08-nist-cm]: Book 13, Appendix A, baseline and KSI columns for CM-3, CM-3(2), CM-4(2), CM-5, CM-6 and AU-9, from NIST SP 800-53B and FedRAMP's KSI "Related SP 800-53 Controls" (read October 21, 2026; carried from [Book 13, Appendix A](../../../books/b13-governance/appendix-a-requirements-mapping.md)).
[^hw08-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, section A, Identity (enterprise identity systems draw on human resources, contract management and personnel security systems), <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (read November 1, 2026; carried from the HR-driven identity implementation guide).
[^hw08-bod]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," MS.AAD.7.5v1, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (read November 1, 2026; carried from the HR-driven identity implementation guide).
[^hw08-agu]: FedRAMP, "Agency Use of FedRAMP Certified Cloud Services," *FedRAMP Consolidated Rules for 2026*, AGU-USE-ABU (complete the ATO process for federal information systems that use FedRAMP Certified offerings), <https://www.fedramp.gov/2026/reference/agency-use/> (read October 21, 2026; carried from Book 13, Appendix A and Chapter 11).
