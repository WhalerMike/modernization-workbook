---
title: "Chapter 09 — Deploying to Test and Production"
description: "The deployment runbook: take the kit from a developer instance to a ServiceNow sub-production instance and a SailPoint sandbox tenant, then to the production instance in ServiceNow's Government Community Cloud and the production ISC tenant. One settings file per environment and no secret in it; pre-flight checks for Gate 1, OAuth client credentials and least privilege; the application installed by the vendor's documented method; the ISC workflows created disabled, test-run and enabled in stages; a smoke test with a synthetic worker and the expected result of each step; promotion criteria, first-week monitoring, rollback and the evidence the ISSO keeps. Every step is a command or an exact menu path, and nobody has yet run it against a live tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-ticket-to-machine
part: How
series-order: 9
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 09 — Deploying to Test and Production

*A runbook is not a description of a deployment. It is the deployment, written down before it happens, so the second run is the same as the first.*

::: {.callout-note}
## In this chapter
The runbook that takes the kit past the developer instance. Stage 1 deploys it to a ServiceNow sub-production instance and a SailPoint Identity Security Cloud (ISC) sandbox tenant, enables it in stages, smoke-tests it with a synthetic worker and rehearses the rollback. Stage 2 repeats the same commands against the production instance in ServiceNow's Government Community Cloud and the production ISC tenant, under a change record, and adds the schedules and a week of monitoring. One settings file per environment carries everything that differs; the commands don't change. New scripts in the kit's `deploy/` folder do the checks, and each step names the gate of the [example guide](../../../books/guides/ttm-servicenow-sailpoint.md) it fulfils.
:::

::: {.callout-important}
## Status: a runbook nobody has run on a live tenant
This chapter has not been run against a live ServiceNow instance or SailPoint tenant, by the authors or anyone else. The scripts in `deploy/` were run on November 2, 2026 against the kit's fictional fixtures, and that output is shown below with its date. Every "expect" in Stage 1 and Stage 2 is what the kit's code and the vendors' documentation say should happen, not something anyone has seen happen. Run Stage 1 completely, and keep its evidence, before trusting any step of Stage 2.
:::

## Goal and audience

**Goal.** By the end of this chapter you can deploy the kit to a test environment, prove it works with a synthetic worker, roll it back, decide whether it may go to production, and then deploy the same version to production and watch its first week, leaving a folder of evidence at every stage.

**Audience.** The developer or platform engineer who runs the deployment, the ServiceNow and SailPoint administrators who make the console changes it names, the change manager, and the ISSO who receives the evidence. You should be at ease in a bash shell. You don't need to understand the kit's internals: [Chapters 01 to 08](index.md#chapters-table) explain them, and this chapter only follows them.

## Before you start {#before-you-start}

### Roles

| Role | What they do in this runbook | What they hold |
|---|---|---|
| Deployer | Runs every command, keeps the evidence folder, owns the change record | Access to the vault holding the integration secrets; no standing administrator role |
| ServiceNow administrator | Installs the application and sets its system properties | `admin` on the instance, for the install and the properties[^ttm09-sn-install][^ttm09-sn-prop] |
| ServiceNow change manager | Approves the production change record | The agency's change approver role |
| SailPoint administrator | Turns on Native Change Detection, starts aggregations, creates the API clients | An ISC administrator able to edit sources and API clients[^ttm09-sp-apikeys] |
| Workflow tester | Holds the personal access token that test-runs a workflow | An `ORG_ADMIN` user, because the test endpoint lists only that user level[^ttm09-wf-test] |
| Entra user administrator | Creates and edits the synthetic worker's Entra account where the HR feed doesn't | User Administrator, the least-privileged role Microsoft lists for those tasks[^ttm09-entra-create][^ttm09-entra-edit] |
| ISSO | Accepts each stage's evidence and the go/no-go decision | — |

Seven integration identities run the kit and these scripts, one per task, as [Chapter 02](02-servicenow-client-and-least-privilege.md) and [Chapter 03](03-sailpoint-client-and-scopes.md) split them. The settings file records each one's client ID and grant; the secrets stay in the vault. The Graph reader, the app registration with a certificate that the drift and re-read clients use ([Chapter 03](03-sailpoint-client-and-scopes.md)), is named by the settings file's `GRAPH_*` keys and needs no secret in the shell.

| Identity | System | Least privilege (from `config/calls.json`) | Used for |
|---|---|---|---|
| `finding_writer` | ServiceNow | `x_example_idkit.finding_writer` | The ISC workflows' posts; `smoke_test.py raise` and `signal` |
| `verifier` | ServiceNow | `x_example_idkit.verifier` | The re-read client |
| `evidence_reader` | ServiceNow | `x_example_idkit.evidence_reader` | The evidence export; pre-flight, smoke checks and rollback checks |
| `isc_reader` | ISC | `sp:search:read`, `idn:accounts:read` | The drift and re-read clients |
| `isc_deploy_checker` | ISC | `sp:workflow:read` | Pre-flight and rollback: list the workflows |
| `isc_workflow_admin` | ISC | `sp:workflow:manage` | Create, enable and disable the workflows |
| `isc_workflow_tester` | ISC | `sp:workflow-execute:external`, `sp:workflow-execution:read` (a personal access token of an `ORG_ADMIN` user) | Test-run a disabled workflow and read the execution |

### Approvals

| Before | Who approves | What they approve |
|---|---|---|
| Stage 1 | The system owner and the ISSO | Deploying to the test environment with a synthetic worker; the seven integration identities (*design guidance*) |
| Stage 2 | The ISSO, then the change manager | The go/no-go criteria met, with Stage 1's evidence; the production change record |
| The production smoke test | The ISSO | A synthetic worker in production, and synthetic findings in the production record that close on a re-read (*design guidance*) |
| Any autonomous lane | The authorizing official | As the guide's [Gate 2](../../../books/guides/ttm-servicenow-sailpoint.md#step-2-decide-the-writers-and-the-approvers) requires; this runbook enables none |

### The change record

Production needs one; the test stage takes one if the agency's practice asks for it (*design guidance*). In the production instance, a person with `itil`, `admin` or `sn_change_write` raises it at **All** > **Change** > **Create New** and chooses **Normal**; ServiceNow offers Normal, Emergency and Standard.[^ttm09-sn-change] A normal change fits a first deployment, because the guide's lane table gives standard changes only to pre-authorized classes ([Gate 2](../../../books/guides/ttm-servicenow-sailpoint.md#step-2-decide-the-writers-and-the-approvers)). Record its number in the settings file's `deploy.change_record`; the pre-flight check fails in production without it, and the smoke test writes it into each synthetic finding's origin.

### What must already be in place

- **The scoped application, built once** on the agency's development instance from the kit README's [ServiceNow setup](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint#servicenow-setup-personal-developer-instance-first): the `u_identity_finding` table, the Scripted REST resource, the business rule, the three custom roles and the system properties, as Chapters 01, 02 and 05 build them in a developer instance. Link it to source control in App Engine Studio.
- **A synthetic worker in each environment** (*design guidance*): a record in the HR source the ISC tenant aggregates, so it has an ISC identity, correlated to an Entra account whose `department` is `Smoke Test`, with sign-in disabled. If that environment's HR feed doesn't create the Entra account, an Entra user administrator creates it at **Entra ID** > **Users** > **New user** > **Create new user**, with **Account enabled** cleared, and sets **Department** under **Job information**.[^ttm09-entra-create] Record its IDs in the settings file's `deploy.synthetic` block.
- **On the deployer's machine:** bash (Git Bash on Windows), `curl`, Python 3.10 or later with `requests` and, for the Graph certificate, `cryptography`; a clone of the repository; the vault.

### Placeholders

Every command below is copy-paste. The settings file holds every value that differs between the environments, so the commands themselves have only these placeholders, listed once:

| Placeholder | Where | What to put |
|---|---|---|
| The `<...>` values in `deploy/environment.example.json` | Your copies, `deploy/environment.test.json` and `deploy/environment.production.json` | Each environment's ServiceNow and ISC addresses, its seven client IDs and grants, the workflow owner, the Gate 1 record, the change record and the synthetic worker's IDs. The pre-flight check fails while any is left |
| `<hr-extract.csv>` | Stage 2, the schedules | The path of the HR extract the drift reconciliation reads in production |
| `<grace-hours>` | Stage 2, the schedules | The re-read client's grace period, tuned to the ISC aggregation schedule ([Gate 6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read), step 4) |

Secrets are never typed into a command: each step prompts for the secret it needs, without echoing it, and you paste it from the vault.

## The code: `examples/servicenow-sailpoint/deploy`

### What exists

The kit's clients, their call list and their tests (Chapters 01 to 08), the three ISC workflows in one file that posts to an example instance, and a README that says what to set up by hand. The guide gives the seven gates and a rollback per gate in prose. Nothing turned those into steps a deployer could run twice and get the same result.

### What this chapter adds

| File | What it does | Runs as |
|---|---|---|
| `deploy/environment.example.json` | The settings template: the kit's own config keys plus a `deploy` block. Placeholders only; the kit's loader refuses a secret key in it | — |
| `deploy/preflight.py` | The settings file, Gate 1 (the Marketplace record, read within 30 days, and SailPoint's written feature confirmation, a FAIL in production), OAuth or a vault token rather than basic authentication, the change record, every identity's grant against `config/calls.json`, an endpoint variable that would override the file, then the finding table and the workflows' state and failure counts. Exits 1 on any FAIL | `evidence_reader`, `isc_deploy_checker` |
| `deploy/render_workflows.py` | One of the three workflows with this environment's ServiceNow URL, owner and client ID, disabled; the secret only from an environment variable, to standard output; and a test input for each workflow built on the synthetic worker | — (reads files) |
| `deploy/smoke_test.py` | `raise`: the synthetic finding posted twice; `signal`: a closure signal; `check`: one synthetic finding read back and its state compared | `finding_writer`; `evidence_reader` for `check` |
| `deploy/rollback.py` | The rollback commands for this environment, with its workflow IDs; and a check that the workflows are disabled and no finding from ISC arrived since | `isc_deploy_checker`, `evidence_reader` |
| `deploy/record.py` | Keeps an ISC response in the evidence folder with any secret field removed, prints its ID, enabled flag or status, and stops on an error | — |
| `deploy/deploy_common.py` | The shared code; run directly, it prints one value from a settings file or a kept response | — |

`config/calls.json` gains three tasks and four calls, each with its least privilege and the SailPoint specification as its source: `deploy-check` (list the workflows, `sp:workflow:read`; read the finding table as the evidence reader), `smoke-raise` (post to the Scripted REST resource as the finding writer), `workflow-test` (`POST /v2025/workflows/{id}/test` and `GET /v2025/workflow-executions/{id}`), and the workflow `PATCH` under the existing `workflows` task.[^ttm09-wf-spec][^ttm09-wf-test][^ttm09-wf-exec] Every script refuses to run when the client ID in the environment isn't the identity its step runs as. Nothing in `deploy/` writes to ISC: the workflow changes are `curl` commands a person runs with the workflow administrator's client, as the README already had it.

### The tests

`tests/python/test_deploy.py`, 28 tests against fictional settings and saved responses in `tests/fixtures/deploy/`: the template's placeholders and the refusal of a secret; that only the settings file differs between the stages; endpoint overrides; each pre-flight check, passing and failing; the rendered workflows and the secret's path; the test inputs; the smoke test's three phases and a wrong state; the wrong integration identity refused; the rollback plan and check; the kept responses; the least privilege of the new tasks; and that every call the scripts make is declared in `config/calls.json` for its task. The kit's whole suite, 135 tests, passes.

::: {.callout-important}
## Illustrative code
The scripts below run on fictional fixtures. They show what each check looks for and what it prints, not that a ServiceNow instance answers in exactly these shapes. The Scripted REST resource's answer, for one, may come inside `result` or at the top level, and the smoke test accepts both (kit README verify list, item 20).
:::

### What the scripts print on the fixtures

Run on November 2, 2026, from `examples/servicenow-sailpoint`, against `tests/fixtures/deploy/`. Nothing here signs in.

```bash
python -m pytest tests/python/test_deploy.py -q
```

```text
............................                                             [100%]
28 passed in 2.78s
```

The pre-flight check on the test stage after the three workflows were created. The WARN is SailPoint's missing written confirmation of the HTTP Request step: the test stage may go on, production may not.

```bash
python deploy/preflight.py --settings tests/fixtures/deploy/environment.test.json --expect-workflows disabled --fixtures tests/fixtures/deploy/preflight.json --today 2026-11-02
```

```text
Preflight: test (settings tests/fixtures/deploy/environment.test.json), 2026-11-02, fixtures
  PASS  G1  settings    no secrets in the file; no placeholders left
  PASS  G1  endpoints   https://contosotest.service-now.com; https://example-sb.api.identitynow.com; no environment variable overrides them
  PASS  G1  marketplace F1305072116 and FR2001938710A recorded 2026-11-02 (0 days ago)
  WARN  G1  features    not confirmed in writing: http_request_step (the test stage may go on; production may not)
  PASS  G1  auth        ServiceNow: OAuth client credentials; ISC: client credentials; no basic-auth variables set
  PASS  G1  change      change record CHG0040101
  PASS  G1  roles       7 integration identities hold exactly what their tasks need
  PASS  G4  instance    GET /api/now/table/u_identity_finding answered as the evidence reader (0 of at most 1 row read)
  PASS  G4  workflows   3 of 3 found; disabled (expected disabled)
  PASS  G4  executions  0 executions, 0 failed
Result: 9 PASS, 1 WARN, 0 FAIL, 0 SKIP: go
```

The same command on production's settings, a week in, with one failed execution to read:

```bash
python deploy/preflight.py --settings tests/fixtures/deploy/environment.production.json --expect-workflows enabled --fixtures tests/fixtures/deploy/preflight-week1.json --today 2026-11-09
```

```text
Preflight: production (settings tests/fixtures/deploy/environment.production.json), 2026-11-09, fixtures
  PASS  G1  settings    no secrets in the file; no placeholders left
  PASS  G1  endpoints   https://contoso.service-now.com; https://example.api.identitynow.com; no environment variable overrides them
  PASS  G1  marketplace F1305072116 and FR2001938710A recorded 2026-11-02 (7 days ago)
  PASS  G1  features    SailPoint confirmed in writing: workflows, native_change_detection, http_request_step (SP-CASE-0000-EXAMPLE-2)
  PASS  G1  auth        ServiceNow: OAuth client credentials; ISC: client credentials; no basic-auth variables set
  PASS  G1  change      change record CHG0040188
  PASS  G1  roles       7 integration identities hold exactly what their tasks need
  PASS  G4  instance    GET /api/now/table/u_identity_finding answered as the evidence reader (1 of at most 1 row read)
  PASS  G4  workflows   3 of 3 found; enabled (expected enabled)
  WARN  G4  executions  56 executions, 1 failed; read the failed executions of: Drift to ServiceNow - identity attributes changed (mover)
Result: 9 PASS, 1 WARN, 0 FAIL, 0 SKIP: go
```

The first workflow rendered for each environment. Only the settings file differs:

```bash
python deploy/render_workflows.py --settings tests/fixtures/deploy/environment.test.json --index 1 --summary
python deploy/render_workflows.py --settings tests/fixtures/deploy/environment.production.json --index 1 --summary
```

```text
workflow 1: Drift to ServiceNow - native change (provenance)
  trigger      idn:native-change-account-updated
  url          https://contosotest.service-now.com/api/x_example_idkit/identity_findings/finding
  token url    https://contosotest.service-now.com/oauth_token.do
  client id    a1b2c3d4e5f60718293a4b5c6d7e8f90
  secret       placeholder (pass --secret-env)
  owner        ttm.owner.example (2c9180000000000000000000000e9001)
  enabled      false
workflow 1: Drift to ServiceNow - native change (provenance)
  trigger      idn:native-change-account-updated
  url          https://contoso.service-now.com/api/x_example_idkit/identity_findings/finding
  token url    https://contoso.service-now.com/oauth_token.do
  client id    f0e1d2c3b4a5968778695a4b3c2d1e0f
  secret       placeholder (pass --secret-env)
  owner        ttm.owner.example (2c9180000000000000000000000e9101)
  enabled      false
```

The smoke test's `raise` without `--apply` posts nothing; with `--apply`, against saved responses, it shows each expectation:

```bash
python deploy/smoke_test.py raise --settings tests/fixtures/deploy/environment.test.json --apply --fixtures tests/fixtures/deploy/smoke.json
python deploy/smoke_test.py signal --settings tests/fixtures/deploy/environment.test.json --apply --expect-moved 2 --fixtures tests/fixtures/deploy/smoke.json
python deploy/smoke_test.py check --settings tests/fixtures/deploy/environment.test.json --finding native --expect awaiting --occurrences 3 --fixtures tests/fixtures/deploy/smoke-check.json
python deploy/smoke_test.py check --settings tests/fixtures/deploy/environment.test.json --finding direct --expect closed --fixtures tests/fixtures/deploy/smoke-closed.json
```

```text
Smoke test raise: test, fixtures
  PASS  payload meets the data contract    key drift-reconciliation|00000000-0000-4000-8000-00000000c501|attribute_drift|department
  PASS  first post creates (201, priority 4) HTTP 201, IDF0001001, priority 4
  PASS  repeat de-duplicates (200, same)   HTTP 200, deduplicated True, occurrences 2
Result: PASS
Smoke test signal: test, fixtures
  PASS  signal moves findings to awaiting  HTTP 200, moved 2 (expected 2)
Result: PASS
Smoke test check: test, fixtures
  PASS  finding native exists              1 record(s) with key sailpoint-isc|2c91800000000000000000000a5001ad|unauthorized_write
  PASS  state is awaiting                  IDF0001000 state 18
  PASS  occurrences 3                      u_occurrences 3
Result: PASS
Smoke test check: test, fixtures
  PASS  finding direct exists              1 record(s) with key drift-reconciliation|00000000-0000-4000-8000-00000000c501|attribute_drift|department
  PASS  state is closed                    IDF0001001 state 3
  PASS  closed with re-read evidence       evidence hash 9b1d5c0e7a3f..., verified 2026-11-02T16:10:00Z
Result: PASS
```

The rollback plan reads the workflows' IDs; the check fails while a workflow is still on, and passes once all three are off and nothing new arrived:

```bash
python deploy/rollback.py --settings tests/fixtures/deploy/environment.test.json --plan --fixtures tests/fixtures/deploy/rollback-plan.json
python deploy/rollback.py --settings tests/fixtures/deploy/environment.test.json --verify --since "2026-11-02 16:30:00" --fixtures tests/fixtures/deploy/rollback-plan.json
python deploy/rollback.py --settings tests/fixtures/deploy/environment.test.json --verify --since "2026-11-02 16:30:00" --fixtures tests/fixtures/deploy/rollback.json
```

```text
Rollback plan: test (tests/fixtures/deploy/environment.test.json)
# 1. Disable the three workflows (G4), as the ISC workflow administrator:
#    Drift to ServiceNow - native change (provenance) (now enabled)
curl -s -X PATCH "https://example-sb.api.identitynow.com/v2025/workflows/wf-0000-0001" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json-patch+json" --data '[{"op": "replace", "path": "/enabled", "value": false}]'
#    Drift to ServiceNow - identity attributes changed (mover) (now enabled)
curl -s -X PATCH "https://example-sb.api.identitynow.com/v2025/workflows/wf-0000-0002" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json-patch+json" --data '[{"op": "replace", "path": "/enabled", "value": false}]'
#    Drift to ServiceNow - provisioning completed (closure signal) (now enabled)
curl -s -X PATCH "https://example-sb.api.identitynow.com/v2025/workflows/wf-0000-0003" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json-patch+json" --data '[{"op": "replace", "path": "/enabled", "value": false}]'
# 2. Stop the scheduled drift and re-read runs (G7) in your job runner.
# 3. Verify, as the deploy checker and the evidence reader:
python deploy/rollback.py --settings tests/fixtures/deploy/environment.test.json --verify --since "<rollback-start-utc>"
Rollback verify: test, fixtures
  FAIL  G4 workflows disabled            3 found, 3 enabled: Drift to ServiceNow - native change (provenance); Drift to ServiceNow - identity attributes changed (mover); Drift to ServiceNow - provisioning completed (closure signal)
  FAIL  G4 no new findings from ISC      1 created after 2026-11-02 16:30:00: IDF0001007
Result: not rolled back
Rollback verify: test, fixtures
  PASS  G4 workflows disabled            3 found, 0 enabled
  PASS  G4 no new findings from ISC      0 created after 2026-11-02 16:30:00
Result: rolled back
```

## One environment settings file {#settings}

Everything that differs between the test stage and production lives in one JSON file per environment: the ServiceNow and ISC addresses, the Graph app registration, each integration identity's client ID and recorded grant, the workflow owner, the Gate 1 record, the change record and the synthetic worker. It never holds a secret: the kit's loader refuses a secret key in a file, as [Chapter 02](02-servicenow-client-and-least-privilege.md) shows, and every secret comes from the vault into an environment variable for the length of one step. Keep both files in the agency's repository, reviewed like code (*design guidance*). The upper-case keys are the kit's own configuration keys, so the same file is the `--config` of the kit's re-read client and evidence export.

1. **Copy the template, once per environment:**

   ```bash
   cd examples/servicenow-sailpoint
   cp deploy/environment.example.json deploy/environment.test.json
   cp deploy/environment.example.json deploy/environment.production.json
   ```

2. **Fill in each copy.** Replace every `<...>`. `deploy.granted` records what each identity was actually granted, as the console shows it, comma-separated; the pre-flight check compares it with what the identity's tasks need. Leave `sailpoint_confirmed` at `false` until SailPoint answers in writing (pre-flight, step 2). Then confirm nothing is left:

   ```bash
   python deploy/preflight.py --settings deploy/environment.test.json --dry-run
   python deploy/preflight.py --settings deploy/environment.production.json --dry-run
   ```

   Expect no `placeholders left` line. The `auth` check fails until a step sets credentials; that's expected here.

3. **Start every session the same way.** Paste this block into a new shell before any step, with the settings file for the stage you're working on. It sets the stage's names from the file, defines `use_role` (clears every credential and endpoint variable), `as_sn` and `as_isc` (set one identity's client ID from the file and prompt for its secret), and `isc_token` (an ISC token for the identity set):

   ```bash
   cd examples/servicenow-sailpoint
   export SETTINGS=deploy/environment.test.json
   export STAGE=$(python deploy/deploy_common.py "$SETTINGS" deploy.environment)
   export ISC=$(python deploy/deploy_common.py "$SETTINGS" SAILPOINT_API_BASE)
   export EVIDENCE=out/evidence/$STAGE
   mkdir -p "$EVIDENCE"
   use_role() { unset SN_CLIENT_ID SN_CLIENT_SECRET SN_ACCESS_TOKEN SN_USERNAME SN_PASSWORD SAILPOINT_CLIENT_ID SAILPOINT_CLIENT_SECRET SAILPOINT_ACCESS_TOKEN SN_INSTANCE SN_BASE_URL SAILPOINT_TENANT SAILPOINT_API_BASE; }
   as_sn() { export SN_CLIENT_ID=$(python deploy/deploy_common.py "$SETTINGS" deploy.clients.$1); read -rsp "ServiceNow client secret for $1, from the vault: " SN_CLIENT_SECRET; echo; export SN_CLIENT_SECRET; }
   as_isc() { export SAILPOINT_CLIENT_ID=$(python deploy/deploy_common.py "$SETTINGS" deploy.clients.$1); read -rsp "ISC client secret for $1, from the vault: " SAILPOINT_CLIENT_SECRET; echo; export SAILPOINT_CLIENT_SECRET; }
   isc_token() { export SAILPOINT_ACCESS_TOKEN=$(curl -s -X POST "$ISC/oauth/token" -d grant_type=client_credentials --data-urlencode client_id="$SAILPOINT_CLIENT_ID" --data-urlencode client_secret="$SAILPOINT_CLIENT_SECRET" | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])"); }
   use_role
   ```

   For Stage 2 the only change is the second line: `export SETTINGS=deploy/environment.production.json`. `out/` is ignored by git; copy the evidence folder to the agency's evidence store at the end of each stage.

## Pre-flight checks {#preflight}

Run these before Stage 1, and again before Stage 2 with the production settings. They fulfil [G1 Boundary](../../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary).

1. **Re-read both FedRAMP listings** on the day (G1, step 1). This prints the two listings from the Marketplace's own data:

   ```bash
   curl -s -o "$EVIDENCE/fedramp-products.json" https://www.fedramp.gov/marketplace/products.json
   python -c "import json,sys; d=json.load(open(sys.argv[1], encoding='utf-8')); print('last change', d['meta']['last_change']); [print(p['fedramp_id'], p['cloud_service_offering'], p['status'], p['impact_level'], p['cert_path'], p['fedramp_auth'][:10]) for p in d['data'] if p['fedramp_id'] in ('F1305072116', 'FR2001938710A')]" "$EVIDENCE/fedramp-products.json"
   ```

   Expect `F1305072116 Government Community Cloud FedRAMP Certified High JAB 2019-08-12` and `FR2001938710A SailPoint Identity Security Cloud FedRAMP Certified Moderate Agency 2024-06-05`, as they read on November 2, 2026.[^ttm09-fedramp] Set `deploy.g1.marketplace_checked_on` to today's date in the settings file.

2. **Record SailPoint's written answer on feature scope** (G1, step 2). SailPoint says its FedRAMP-authorized ISC is hosted in AWS GovCloud and lists the modules it includes, but publishes no list of what isn't available there, and its page doesn't name Native Change Detection or the HTTP Request step.[^ttm09-sp-fedramp] Ask SailPoint in writing whether Workflows, Native Change Detection and the workflow HTTP Request step are in the authorized environment your production tenant runs in. Set each of `deploy.g1.sailpoint_confirmed.workflows`, `native_change_detection` and `http_request_step` to `true` only for a feature the answer confirms, and `deploy.g1.sailpoint_reference` to the answer's case or letter number. The pre-flight check warns in the test stage and fails in production while any is `false`.

3. **Create the integration identities in this environment** (G1, step 6), as [Chapter 02](02-servicenow-client-and-least-privilege.md) and [Chapter 03](03-sailpoint-client-and-scopes.md) describe them:
   - **ServiceNow:** one integration user per role, with only that role, and one inbound OAuth client-credentials integration per user, at the Machine Identity Console path [Chapter 02](02-servicenow-client-and-least-privilege.md) records. The token request is a form post to `/oauth_token.do` with `grant_type=client_credentials`, the client ID and the secret.[^ttm09-sn-cc]
   - **ISC:** four API clients at **Admin** > **Global** > **Security Settings** > **API Management** > **Create API Client**, each with only its scopes from the identities table; SailPoint's guidance is to select only the scopes an application needs.[^ttm09-sp-apikeys] The workflow tester is a personal access token of an `ORG_ADMIN` user: as that user, the user icon > **Preferences** > **Personal Access Tokens** > **New Token**, with the two scopes and an expiry date.[^ttm09-sp-apikeys] SailPoint's token endpoint is `POST https://{tenant}.api.identitynow.com/oauth/token`, and a tenant with a vanity domain finds its API address at `/oauth/info`.[^ttm09-sp-auth]
   - Put each secret in the vault, each client ID in `deploy.clients`, and what each was granted in `deploy.granted`.

4. **Run the pre-flight check** with the two identities it reads as. It refuses basic authentication outside a developer instance, which is the kit's rule (*design guidance*), and every check it makes is in the list at the top of `deploy/preflight.py`:

   ```bash
   use_role; as_sn evidence_reader; as_isc isc_deploy_checker
   python deploy/preflight.py --settings "$SETTINGS" --expect-workflows absent --out-json "$EVIDENCE/preflight-1-before.json"
   use_role
   ```

   Before the application is installed, expect one FAIL, `instance`, because the finding table doesn't exist yet, and `workflows   0 of 3 found; absent (expected absent)`; [Step 1.1](#step-1-1) runs the check again after the install, when it should end `go`. Fix every other FAIL and run it again; don't go on with one.

## Stage 1: the live test {#stage-1}

**Where:** the ServiceNow sub-production instance and the ISC sandbox tenant named in `deploy/environment.test.json`. Start the session block with that file.

### Step 1.1: Install the ServiceNow application ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), [G6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read)) {#step-1-1}

ServiceNow's update set guidance says update sets aren't meant for installing applications, which belong in the application repository or the Store.[^ttm09-sn-us] For a scoped application linked to source control, publishing from App Engine Studio commits the application, tags the version in source control and publishes it to the repository in one action.[^ttm09-sn-aes] The same published version is then installed on the test instance and, after Stage 1, on production, so production gets exactly what was tested (*design guidance*).

1. **Publish the version,** on the development instance, as an administrator: **All** > **App Engine** > **App Engine Studio**; open the application from **My Apps**; select **Publish**; enter the version in `deploy.app.version`, the release notes, and publish to your application repository; select **Continue**.[^ttm09-sn-aes]
2. **Install it,** on the test instance, as an administrator: **All** > **System Applications** > **My Company Applications**; find the application, select the version next to it, and select **Install**.[^ttm09-sn-install]
3. **Set the system properties for this instance,** as an administrator: in the navigation filter, enter `sys_properties.list`, search for each property name, and set its value;[^ttm09-sn-prop] the properties and what each holds are in the [kit README](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint#servicenow-setup-personal-developer-instance-first). `x_example_idkit.verifier_user` is this instance's verifier integration user.
4. **Run the pre-flight check again.** The table now answers:

   ```bash
   use_role; as_sn evidence_reader; as_isc isc_deploy_checker
   python deploy/preflight.py --settings "$SETTINGS" --expect-workflows absent --out-json "$EVIDENCE/preflight-2-installed.json"
   use_role
   ```

   Expect `PASS  G4  instance` and `Result: ... 0 FAIL ...: go`.

The business rule is active from the install, so a person's close becomes *Awaiting verification* before any finding exists ([G6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read)) (*design guidance*).

### Step 1.2: Turn on Native Change Detection ([G3](../../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift)) {#step-1-2}

A console action, by the SailPoint administrator, on the Entra source named in `deploy.synthetic.source_name`: **Admin** > **Connections** > **Sources**; select the source; in **Account Management**, select **Native Change Detection**; turn on **Enable Native Change Detection**; choose the account operations and the attributes to watch, including `department`; select **Save**. SailPoint recommends watching all entitlement attributes for all account operations, notes that its workflow templates need that, and says to run an aggregation afterwards.[^ttm09-ncd] Then start one: on the same source, in **Account Management**, select **Account Aggregation**, then **Start Aggregation** at the top of the page.[^ttm09-agg]

### Step 1.3: Create the three workflows, disabled ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door)) {#step-1-3}

SailPoint creates workflows disabled: its specification says they can't be created enabled.[^ttm09-wf-body] Each workflow posts to ServiceNow as the finding writer, so it needs that client's secret, which goes from the vault to standard output and straight into `curl`, never to a file. `record.py` keeps each response without it.

```bash
use_role; as_isc isc_workflow_admin; isc_token
read -rsp "ServiceNow client secret for finding_writer, from the vault: " SN_WORKFLOW_CLIENT_SECRET; echo; export SN_WORKFLOW_CLIENT_SECRET
for n in 1 2 3; do python deploy/render_workflows.py --settings "$SETTINGS" --index $n --secret-env SN_WORKFLOW_CLIENT_SECRET | curl -s -X POST "$ISC/v2025/workflows" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" --data-binary @- | python deploy/record.py "$EVIDENCE/workflow-$n.json"; done
unset SN_WORKFLOW_CLIENT_SECRET; use_role
```

Expect three lines, `id=... name=Drift to ServiceNow - ... enabled=False`, one per workflow. A line that says `stop and read it`, or a `detailCode`, is SailPoint's error: read the kept file, fix the cause, and delete any workflow that was created before running the loop again. Then check the state:

```bash
use_role; as_sn evidence_reader; as_isc isc_deploy_checker
python deploy/preflight.py --settings "$SETTINGS" --expect-workflows disabled --out-json "$EVIDENCE/preflight-3-created.json"
use_role
```

Expect `PASS  G4  workflows   3 of 3 found; disabled (expected disabled)`.

### Step 1.4: Test-run each workflow while it's disabled ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door)) {#step-1-4}

SailPoint's test endpoint runs a disabled workflow with an input you give it, returns an execution ID, and warns that the run is live.[^ttm09-wf-test] `render_workflows.py --test-input` builds each input from the kit's event fixture with the synthetic worker's IDs, so each finding a test raises has an intended state equal to the worker's baseline, `department` = `Smoke Test`, and a later re-read can verify it. The tester's ISC token and the evidence reader's ServiceNow client are set together, because each test is followed by a read.

1. **Set both identities:**

   ```bash
   use_role; as_isc isc_workflow_tester; isc_token; as_sn evidence_reader
   ```

2. **Test-run the native-change workflow,** then read its execution:

   ```bash
   WF=$(python deploy/deploy_common.py "$EVIDENCE/workflow-1.json" id)
   python deploy/render_workflows.py --settings "$SETTINGS" --test-input 1 | curl -s -X POST "$ISC/v2025/workflows/$WF/test" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" --data-binary @- | python deploy/record.py "$EVIDENCE/test-1.json"
   curl -s "$ISC/v2025/workflow-executions/$(python deploy/deploy_common.py "$EVIDENCE/test-1.json" workflowExecutionId)" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Accept: application/json" | python deploy/record.py "$EVIDENCE/execution-1.json"
   ```

   Expect `workflowExecutionId=...`, then `status=Completed`. The status is one of `Completed`, `Failed`, `Canceled`, `Running` or `Queued`;[^ttm09-wf-exec] while it's `Running` or `Queued`, run the last command again. Then read the finding it raised:

   ```bash
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding native --expect open --occurrences 1 --out-json "$EVIDENCE/check-1-native.json"
   ```

   Expect `PASS` on `finding native exists`, `state is open` and `occurrences 1`. A `Failed` execution, or no finding, means the HTTP Request step didn't reach ServiceNow: check the kit README's verify list, items 2, 3 and 18, before anything else.

3. **Test-run the mover workflow,** and read its finding:

   ```bash
   WF=$(python deploy/deploy_common.py "$EVIDENCE/workflow-2.json" id)
   python deploy/render_workflows.py --settings "$SETTINGS" --test-input 2 | curl -s -X POST "$ISC/v2025/workflows/$WF/test" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" --data-binary @- | python deploy/record.py "$EVIDENCE/test-2.json"
   curl -s "$ISC/v2025/workflow-executions/$(python deploy/deploy_common.py "$EVIDENCE/test-2.json" workflowExecutionId)" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Accept: application/json" | python deploy/record.py "$EVIDENCE/execution-2.json"
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding mover --expect open --occurrences 1 --out-json "$EVIDENCE/check-2-mover.json"
   ```

   Expect `status=Completed`, then `PASS` on all three.

4. **Test-run the closure-signal workflow,** and read the native-change finding again:

   ```bash
   WF=$(python deploy/deploy_common.py "$EVIDENCE/workflow-3.json" id)
   python deploy/render_workflows.py --settings "$SETTINGS" --test-input 3 | curl -s -X POST "$ISC/v2025/workflows/$WF/test" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" --data-binary @- | python deploy/record.py "$EVIDENCE/test-3.json"
   curl -s "$ISC/v2025/workflow-executions/$(python deploy/deploy_common.py "$EVIDENCE/test-3.json" workflowExecutionId)" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Accept: application/json" | python deploy/record.py "$EVIDENCE/execution-3.json"
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding native --expect awaiting --occurrences 1 --out-json "$EVIDENCE/check-3-native.json"
   use_role
   ```

   Expect `status=Completed`, then `state is awaiting`: the signal named the Entra source, and the Scripted REST script moves matching findings to *Awaiting verification*, never to closed. The mover finding stays open, because it carries no source ID for the signal to match.

### Step 1.5: Enable the workflows ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door)) {#step-1-5}

Enabling is a JSON Patch on `/enabled`, with `sp:workflow:manage`.[^ttm09-wf-spec]

```bash
use_role; as_isc isc_workflow_admin; isc_token
for n in 1 2 3; do curl -s -X PATCH "$ISC/v2025/workflows/$(python deploy/deploy_common.py "$EVIDENCE/workflow-$n.json" id)" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json-patch+json" -H "Accept: application/json" --data '[{"op": "replace", "path": "/enabled", "value": true}]' | python deploy/record.py "$EVIDENCE/enable-$n.json"; done
use_role; as_sn evidence_reader; as_isc isc_deploy_checker
python deploy/preflight.py --settings "$SETTINGS" --expect-workflows enabled --out-json "$EVIDENCE/preflight-4-enabled.json"
use_role
```

Expect three `enabled=True` lines, then `3 of 3 found; enabled (expected enabled)`. The re-read client and the drift reconciliation stay unscheduled in Stage 1; they run by hand in the smoke test.

### Step 1.6: Smoke test with the synthetic worker ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), [G6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read), [G7](../../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo)) {#step-1-6}

The smoke test follows three synthetic findings from raised to closed: *direct* (posted by the script, as the drift client would), *native* (raised by the native-change workflow) and *mover* (raised by the mover workflow). Each step below says what to expect.

| Step | What you do | What to expect (an expectation; not yet seen live) |
|---|---|---|
| 1 | `smoke_test.py raise --apply`, as the finding writer | `201`, priority `4`; then `200`, `deduplicated True`, the same record, `occurrences 2` |
| 2 | `smoke_test.py check --finding direct --expect open` | The record is open, `occurrences 2` |
| 3 | Change the worker's department in Entra, aggregate | Native Change Detection fires; the workflow posts; the active native finding de-duplicates: `occurrences 2` |
| 4 | Set the department back, aggregate | The change back is also a native change: `occurrences 3`, still *Awaiting verification* |
| 5 | `smoke_test.py signal --apply --expect-moved 2` | `200`, the direct and mover findings moved to *Awaiting verification* |
| 6 | The re-read client, dry run, then `--apply`, as the verifier | Three lines `verified; would PATCH state=3`; then each record closed with evidence |
| 7 | `smoke_test.py check --expect closed`, for each finding | `state is closed` and `closed with re-read evidence` |

1. **Raise the direct finding,** and read it back:

   ```bash
   use_role; as_sn finding_writer
   python deploy/smoke_test.py raise --settings "$SETTINGS" --apply --run-id "$STAGE-smoke" --out-json "$EVIDENCE/smoke-1-raise.json"
   use_role; as_sn evidence_reader
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding direct --expect open --occurrences 2 --out-json "$EVIDENCE/smoke-2-direct-open.json"
   use_role
   ```

2. **Make a native change.** A console action by the Entra user administrator: **Entra ID** > **Users**; select the synthetic worker; **Edit properties**; **Job information**; set **Department** to `Smoke Test Changed`; **Save**.[^ttm09-entra-edit] Then the SailPoint administrator aggregates the Entra source: **Admin** > **Connections** > **Sources**; the source; **Account Management** > **Account Aggregation** > **Start Aggregation**.[^ttm09-agg] When the aggregation finishes:

   ```bash
   use_role; as_sn evidence_reader
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding native --expect awaiting --occurrences 2 --out-json "$EVIDENCE/smoke-3-native-changed.json"
   use_role
   ```

   If Entra inbound provisioning writes `department` in this environment, it may set the value back on its next cycle; that is the one-writer rule working ([Chapter 08](08-one-writer-per-attribute.md)), and the next step does the same thing by hand.

3. **Set it back.** The same console path, **Department** back to `Smoke Test`, **Save**, and the same aggregation. Then:

   ```bash
   use_role; as_sn evidence_reader
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding native --expect awaiting --occurrences 3 --out-json "$EVIDENCE/smoke-4-native-reverted.json"
   use_role
   ```

4. **Send the closure signal** for the synthetic worker:

   ```bash
   use_role; as_sn finding_writer
   python deploy/smoke_test.py signal --settings "$SETTINGS" --apply --expect-moved 2 --run-id "$STAGE-smoke" --out-json "$EVIDENCE/smoke-5-signal.json"
   use_role
   ```

5. **Re-read, as the verifier.** The re-read client lists every record waiting for verification, re-reads each subject and closes only on a match ([Chapter 05](05-the-re-read-rule.md)). `--grace-hours 0` stops it waiting for an aggregation that has already run. On a new installation the smoke test's three are the only waiting records; stop if the dry run lists any other (*design guidance*). The verifier reads ISC with the reader's API client and Graph with the certificate the settings file names:

   ```bash
   use_role; as_sn verifier; as_isc isc_reader
   python clients/python/reread_verification.py --config "$SETTINGS" --grace-hours 0 --out-json "$EVIDENCE/smoke-6-reread-dry-run.json"
   ```

   Expect three lines, `[dry-run] IDF...: verified; would PATCH state=3`. A `mismatch` line names what differs: fix the worker's data, aggregate, and run it again. Then write the outcomes:

   ```bash
   python clients/python/reread_verification.py --config "$SETTINGS" --grace-hours 0 --apply --out-json "$EVIDENCE/smoke-7-reread-applied.json"
   use_role
   ```

   Expect three lines, `IDF...: verified, record updated`.

6. **Check each finding closed:**

   ```bash
   use_role; as_sn evidence_reader
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding direct --expect closed --out-json "$EVIDENCE/smoke-8-direct-closed.json"
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding native --expect closed --out-json "$EVIDENCE/smoke-8-native-closed.json"
   python deploy/smoke_test.py check --settings "$SETTINGS" --finding mover --expect closed --out-json "$EVIDENCE/smoke-8-mover-closed.json"
   use_role
   ```

   Expect `Result: PASS` three times.

### Step 1.7: Capture the evidence ([G7](../../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo)) {#step-1-7}

Export the closed synthetic findings as Book 13 evidence records ([Chapter 07](07-evidence-records.md)), verify the package, and list what the stage kept:

```bash
use_role; as_sn evidence_reader
python clients/python/evidence_export.py --config "$SETTINGS" --since "$(date -u +%F)" --period "$STAGE-smoke" --out-dir "$EVIDENCE/evidence-package"
python clients/python/evidence_export.py --verify-dir "$EVIDENCE/evidence-package"
use_role
ls -1 "$EVIDENCE"
```

Expect `3 evidence records: 3 closed on a re-read, ...`, then `Package holds: every file matches the manifest and the chain is unbroken.` The listing is the stage's evidence; the [evidence table](#evidence) says what each file proves.

### Step 1.8: Roll back, and prove it ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), [Rollback](../../../books/guides/ttm-servicenow-sailpoint.md#rollback)) {#step-1-8}

Rehearse the rollback in the test stage, so production's is a second run. The guide's rollback for the front door is to disable the workflows and keep the records, and for the re-read to stop the schedules; the records stay. This runbook doesn't uninstall the application: ServiceNow says rolling back an application install removes its code, tables and files, that data lost that way needs a database restore, and that source-control installs aren't recorded for rollback at all.[^ttm09-sn-rollback] The findings and their evidence would go with the tables (*design guidance*).

1. **Note the time, and print the plan** with this environment's workflow IDs:

   ```bash
   export ROLLBACK_START=$(date -u "+%Y-%m-%d %H:%M:%S")
   use_role; as_sn evidence_reader; as_isc isc_deploy_checker
   python deploy/rollback.py --settings "$SETTINGS" --plan | tee "$EVIDENCE/rollback-plan.txt"
   use_role
   ```

2. **Disable the three workflows,** as the workflow administrator:

   ```bash
   use_role; as_isc isc_workflow_admin; isc_token
   for n in 1 2 3; do curl -s -X PATCH "$ISC/v2025/workflows/$(python deploy/deploy_common.py "$EVIDENCE/workflow-$n.json" id)" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json-patch+json" -H "Accept: application/json" --data '[{"op": "replace", "path": "/enabled", "value": false}]' | python deploy/record.py "$EVIDENCE/disable-$n.json"; done
   use_role
   ```

   Expect three `enabled=False` lines. The commands are the same as the plan's.

3. **Verify:**

   ```bash
   use_role; as_sn evidence_reader; as_isc isc_deploy_checker
   python deploy/rollback.py --settings "$SETTINGS" --verify --since "$ROLLBACK_START" --out-json "$EVIDENCE/rollback-verify.json"
   use_role
   ```

   Expect `Result: rolled back`. The time comparison uses the instance's time zone for `sys_created_on` (kit README verify list, item 24).

4. **Re-enable for the soak.** Run [Step 1.5](#step-1-5) again, and leave the test stage running until the go/no-go meeting.

If the business rule itself is at fault, the guide's [Gate 6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read) rollback is to deactivate it: an administrator clears the rule's **Active** flag, which ServiceNow defines as whether the rule is enforced.[^ttm09-sn-br] Closures then lose their evidence until it's back, so record it in the change record.

## Promotion go/no-go {#go-no-go}

The ISSO and the change manager decide on these, with Stage 1's evidence folder in front of them. Every row must hold (*design guidance*).

| Criterion | The evidence that shows it |
|---|---|
| Every pre-flight run in Stage 1 ended `go`, with no FAIL | `preflight-1-before.json` to `preflight-4-enabled.json` |
| SailPoint confirmed in writing that Workflows, Native Change Detection and the HTTP Request step are in the production tenant's authorized environment | `deploy.g1` in `environment.production.json`; the answer itself, filed with the Gate 1 record |
| Each workflow's test run ended `Completed` and raised or moved the finding expected | `execution-1.json` to `execution-3.json`; `check-1-native.json` to `check-3-native.json` |
| The smoke test passed every step, and the three findings closed only on a re-read | `smoke-1-raise.json` to `smoke-8-*-closed.json`; `smoke-7-reread-applied.json` |
| The evidence package verifies | `evidence-package/` and the `--verify-dir` result |
| The rollback was rehearsed and verified | `rollback-plan.txt`, `disable-1.json` to `disable-3.json`, `rollback-verify.json` |
| No workflow execution failed during the soak | A pre-flight run on the day of the meeting: `executions ... 0 failed` |
| Nothing outside the kit's declared calls was granted to make it work | `roles` PASS in every pre-flight; no change to `config/calls.json` without a reviewed pull request |
| The production change record is approved | The change record |

A no-go leaves the test stage running, or rolled back, and names what must change. Any change to the application means a new published version and Stage 1 again from [Step 1.1](#step-1-1).

## Stage 2: production {#stage-2}

**Where:** the production ServiceNow instance in the Government Community Cloud and the production ISC tenant named in `deploy/environment.production.json`. Start a new shell with the session block, and `export SETTINGS=deploy/environment.production.json` on its second line. Every command below is the same as in Stage 1.

1. **The change record** ([G1](../../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary)). Raised and approved as [Before you start](#before-you-start) says, its number in `deploy.change_record`. Work inside its window.
2. **Pre-flight** ([G1](../../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary)). Run the [pre-flight checks](#preflight), steps 1 to 4, with the production settings. In production a missing feature confirmation and a missing change record are FAILs, not warnings.
3. **Install the tested version** ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), [G6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read)). [Step 1.1](#step-1-1), items 2 to 4 only: install the version Stage 1 tested, from **All** > **System Applications** > **My Company Applications**, on the production instance; don't publish a new one. Set the production values of the system properties.
4. **Native Change Detection** ([G3](../../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift)). [Step 1.2](#step-1-2), on the production Entra source.
5. **Workflows, disabled; test-run; enable** ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door)). [Steps 1.3, 1.4 and 1.5](#step-1-3), with the production synthetic worker, after the ISSO's approval for synthetic findings in production.
6. **Smoke test and evidence** ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), [G6](../../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read), [G7](../../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo)). [Steps 1.6 and 1.7](#step-1-6). Stop at the re-read dry run if it lists any record that isn't one of the three.
7. **Schedule the runs** ([G7](../../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo)). Last, and only after the smoke test passed. The agency's job runner runs these two commands from `examples/servicenow-sailpoint`, with the identities' secrets from its own vault integration in the same environment variables: the drift reconciliation daily as the ISC reader and the Graph reader, and the re-read client on the cadence `<grace-hours>` was tuned for, as the verifier and the ISC reader:

   ```bash
   python clients/python/identity_drift.py --hr-csv "<hr-extract.csv>" --config deploy/environment.production.json --out-json "out/runs/drift-$(date -u +%Y%m%dT%H%M%SZ).json" --out-csv "out/runs/drift-$(date -u +%Y%m%dT%H%M%SZ).csv"
   python clients/python/reread_verification.py --config deploy/environment.production.json --apply --grace-hours "<grace-hours>" --out-json "out/runs/reread-$(date -u +%Y%m%dT%H%M%SZ).json"
   ```

   Neither posts drift findings to ServiceNow: the workflows do that. `--push-to-servicenow` stays off unless the guide's [Gate 4 interim path](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) is the agency's choice.
8. **First-week monitoring** ([G7](../../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo)). Once a day for seven days, the deployer runs:

   ```bash
   use_role; as_sn evidence_reader; as_isc isc_deploy_checker
   python deploy/preflight.py --settings "$SETTINGS" --expect-workflows enabled --out-json "$EVIDENCE/week1-$(date -u +%F)-preflight.json"
   use_role; as_sn verifier; as_isc isc_reader
   python clients/python/reread_verification.py --config "$SETTINGS" --out-json "$EVIDENCE/week1-$(date -u +%F)-waiting.json"
   use_role
   ```

   The first shows the workflows still enabled and their failure count; a `WARN  G4  executions` names the workflow whose failed executions to read in ISC, which keeps them for 90 days.[^ttm09-wf-exec] The second is a dry run: it lists every record waiting for verification and what a re-read would do now. Expect the waiting list to empty between runs, and a burst of findings in the first days, which the guide calls the measurement working ([Gate 3](../../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift)). At the end of the week, run [Step 1.7](#step-1-7) with `--period "$STAGE-week1"` and `--since` set to the go-live date, and give the folder to the ISSO.
9. **Rollback** ([G4](../../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), [Rollback](../../../books/guides/ttm-servicenow-sailpoint.md#rollback)). [Step 1.8](#step-1-8), items 1 to 3, and stop the two scheduled runs in the job runner. The application stays installed and every record stays. A fault in the application itself is fixed forward with a corrected version through Stage 1 again, because a source-control install can't be rolled back (*design guidance*).[^ttm09-sn-rollback]

## Evidence the ISSO keeps {#evidence}

Each stage leaves `out/evidence/<stage>/`. Copy it to the agency's evidence store with the change record. The control mappings are the program's, made the way Book 13's [Appendix A](../../../books/b13-governance/appendix-a-requirements-mapping.md) and the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) make them; the authorizing official and assessors decide whether a control is satisfied.

| Files | What they prove | Requirement it supports | Stage |
|---|---|---|---|
| `fedramp-products.json`, `deploy.g1` and SailPoint's written answer | Each product's authorization was read on the day, and the features relied on are inside it | SA-9 External System Services; FedRAMP use of authorized services (G1)[^ttm09-moderate] | Both |
| `preflight-*.json` | Least privilege per identity, OAuth instead of basic authentication, no secret in a file, the change record, the workflow state at each step | AC-6, IA-5, CM-3 (G1, G4)[^ttm09-moderate] | Both |
| `workflow-*.json`, `test-*.json`, `execution-*.json`, `enable-*.json` | What was deployed, that it was tested disabled before it was enabled, and by which identity | CM-3(2) testing, validation and documentation of changes; CM-5 access restrictions for change (G4)[^ttm09-moderate] | Both |
| `check-*.json`, `smoke-*.json` | The front door, de-duplication, the closure signal and the re-read work end to end on a synthetic worker | CM-4(2) verification of controls; CA-7 (G4, G6)[^ttm09-moderate] | Both |
| `evidence-package/` | The synthetic findings as Book 13 evidence records, hash-chained and verified | AU-12; CM-3 records of changes (G7)[^ttm09-moderate] | Both |
| `rollback-plan.txt`, `disable-*.json`, `rollback-verify.json` | The rollback works and was proven | CM-3; CP-10 system recovery and reconstitution, read for the integration *(inference)*[^ttm09-moderate] | Test; production if used |
| The change record and the published application version's source-control tag | Production received the version that was tested, under approval | CM-3, CM-3(4) security representatives, SA-10 developer configuration management[^ttm09-moderate] | Production |
| `week1-*.json` and the week's evidence package | The first week ran within its windows and its failures were read | CA-7, AU-6 (G7)[^ttm09-moderate] | Production |

## The verified facts

| Item | Value | Source |
|---|---|---|
| ServiceNow Government Community Cloud | F1305072116; FedRAMP Certified, High, JAB path, authorized August 12, 2019 | [^ttm09-fedramp] |
| SailPoint Identity Security Cloud | FR2001938710A; FedRAMP Certified, Moderate, agency path, authorized June 5, 2024 | [^ttm09-fedramp] |
| SailPoint's FedRAMP environment | Hosted in AWS GovCloud; modules listed; no list of unavailable features; Native Change Detection and the HTTP Request step not named | [^ttm09-sp-fedramp] |
| ServiceNow client-credentials token | `POST /oauth_token.do`; `grant_type`, `client_id`, `client_secret` required; `scope` optional (Zurich, updated October 8, 2026) | [^ttm09-sn-cc] |
| Publish from App Engine Studio | **All** > **App Engine** > **App Engine Studio** > **Publish**; commits to source control, tags the version, publishes to the repository or the Store; `admin` (Zurich) | [^ttm09-sn-aes] |
| Install from the application repository | **All** > **System Applications** > **My Company Applications**; select a version; **Install**; `admin` (Zurich) | [^ttm09-sn-install] |
| Update sets | Not meant for installing applications; move from development to test to production; preview before commit (Zurich) | [^ttm09-sn-us] |
| Application repository | Company instances entitled by default; not available to self-hosted customers; Federal Store customers sign in through a separate route (Zurich) | [^ttm09-sn-repo] |
| Rolling back an application | A repository install is recorded for rollback; it removes the code, table and file updates; data lost needs a database restore; source-control installs aren't recorded for rollback | [^ttm09-sn-rollback] |
| System properties | `sys_properties.list` in the navigation filter; `admin` (Zurich) | [^ttm09-sn-prop] |
| Business rule `active` | Whether the rule is enforced; rules live in `sys_script` (Zurich) | [^ttm09-sn-br] |
| Change request | **All** > **Change** > **Create New**; Normal, Emergency or Standard; `itil`, `admin` or `sn_change_write` (Zurich) | [^ttm09-sn-change] |
| ISC workflows | `GET /v2025/workflows` (`sp:workflow:read` or `:manage`); `POST` and `PATCH` (`sp:workflow:manage`); JSON Patch on `/enabled` | [^ttm09-wf-spec] |
| Created disabled | "Workflows cannot be created in an enabled state" | [^ttm09-wf-body] |
| Test a workflow | `POST /v2025/workflows/{id}/test`; the workflow must be disabled; `sp:workflow-execute:external`; user level `ORG_ADMIN`; a live run; returns `workflowExecutionId` | [^ttm09-wf-test] |
| Workflow execution | `GET /v2025/workflow-executions/{id}`; `sp:workflow-execution:read` or `sp:workflow:manage`; `ORG_ADMIN`; kept 90 days; `Completed`, `Failed`, `Canceled`, `Running`, `Queued` | [^ttm09-wf-exec] |
| ISC token and API address | `POST https://{tenant}.api.identitynow.com/oauth/token`; client credentials; personal access tokens; `/oauth/info` for a vanity domain | [^ttm09-sp-auth] |
| ISC API clients and tokens | **Admin** > **Global** > **Security Settings** > **API Management**; personal access tokens under the user's **Preferences**; select only the scopes needed | [^ttm09-sp-apikeys] |
| Native Change Detection | **Admin** > **Connections** > **Sources** > source > **Account Management** > **Native Change Detection**; aggregate afterwards | [^ttm09-ncd] |
| Account aggregation | Source > **Account Management** > **Account Aggregation** > **Start Aggregation** | [^ttm09-agg] |
| Entra user, create and edit | **Entra ID** > **Users** > **New user** > **Create new user** (Account enabled can be cleared); select a user > **Edit properties** > **Job information**; User Administrator | [^ttm09-entra-create][^ttm09-entra-edit] |
| GCC endpoints | Microsoft 365 GCC keeps the worldwide `graph.microsoft.com` | [^ttm09-graph] |

### What couldn't be verified

- **That any of this works live.** Nobody has run it against a live instance or tenant. Each "expect" is an expectation.
- **Whether a workflow's OAuth client secret can be set through the API.** SailPoint's workflow pages describe the HTTP Request step's fields in the editor, not in JSON. If ISC doesn't keep a secret sent in `oAuthClientSecret`, enter it in the workflow editor instead (kit README verify list, items 2 and 21; research gaps, row 83).
- **Whether the test endpoint accepts the event shapes as the kit's fixtures give them** for the native-change and provisioning triggers, and whether the trigger input sits at `$` or `$.trigger` (verify list, item 3).
- **The Zurich steps for rolling back an application install.** The page found is a legacy page on a later release; the runbook doesn't rely on it (verify list, item 23).
- **How a Government Community Cloud instance reaches the application repository.** The repository page notes a separate sign-in route for the Federal Store and doesn't address the government cloud; ask ServiceNow before Stage 2 (research gaps, row 81).
- **The production instance's address** in the Government Community Cloud; take it from the instance (verify list, item 22).
- **The ISC account and identity attribute names** the re-read compares with `department`: the smoke test expects them to match Entra's (*inference*; research gaps, row 82).
- **The instance time zone** for `sys_created_on` in the rollback check (research gaps, row 61).
- **The ISC API domain of a FedRAMP tenant** (research gaps, row 22).

## Federal requirements and evidence

| What the runbook proves | Requirement it supports | Who keeps it |
|---|---|---|
| Changes are tested in a test environment before production, and the same version goes to production | NIST SP 800-53 CM-3 and CM-3(2), in the Moderate baseline;[^ttm09-moderate] the guide's [environments prerequisite](../../../books/guides/ttm-servicenow-sailpoint.md#prerequisites) | The deployer, in the evidence folder; the change manager |
| The change is verified after it's made, on a synthetic subject | CM-4 and CM-4(2), Moderate[^ttm09-moderate] | The ISSO, from the smoke test's files |
| Only the declared identities, with their least privilege, make the changes | AC-6, CM-5 and IA-5, Moderate[^ttm09-moderate] | The pre-flight results; the identity register (G1) |
| External services are authorized and their scope is confirmed | SA-9, Moderate;[^ttm09-moderate] FedRAMP | The Gate 1 record |
| The deployment can be undone without losing records | CP-10 read for the integration *(inference)*; CM-3[^ttm09-moderate] | The rollback rehearsal's files |

Book 13 maps the loop's controls in [Appendix A](../../../books/b13-governance/appendix-a-requirements-mapping.md); this chapter adds only the deployment's.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A command meant for test runs against production | Synthetic findings, or a disabled workflow, in the wrong place | One settings file per stage; `STAGE` and the evidence folder named from it; pre-flight fails when an endpoint variable overrides the file |
| A secret in the settings file or the evidence folder | It reaches the repository or the evidence store | The kit's loader refuses a secret key; secrets are prompted for, not typed; `record.py` removes secret fields |
| The wrong identity for a step | A check runs as the writer, or a write as the reader | Every script refuses a client ID that isn't its step's role; `use_role` clears credentials between steps |
| A workflow enabled before it was tested | Bad posts on the first real event | Created disabled by SailPoint; Step 1.4 tests while disabled; pre-flight checks the state at each step |
| A feature outside the authorization used in production | A finding the authorizing official didn't accept | Pre-flight fails in production without SailPoint's written confirmation |
| A rebuilt version in production | Production differs from what was tested | Stage 2 installs the published version Stage 1 tested; it doesn't publish |
| The rollback uninstalls the application | Every finding and its evidence goes with the tables | The rollback disables intake and keeps the records; a fix goes forward |
| The re-read applied to records nobody expected | Real findings closed during a smoke test | The dry run first; stop if it lists anything but the three synthetic findings |
| Basic authentication left on | A password in a pipeline | Pre-flight fails while `SN_USERNAME` or `SN_PASSWORD` is set |
| Failures nobody reads in week one | A broken workflow raises nothing, quietly | Daily pre-flight with execution counts; a WARN names the workflow |

## Checklist

- [ ] Both settings files are filled, reviewed and in the repository, with no secret in either.
- [ ] Each FedRAMP listing was read on the day, and SailPoint's written answer covers Workflows, Native Change Detection and the HTTP Request step before Stage 2.
- [ ] Seven integration identities exist per environment, each with only its role or scopes, recorded in `deploy.granted`, and every pre-flight run shows `roles` PASS.
- [ ] Stage 1 ran in full: install, Native Change Detection, workflows created disabled, test-run, enabled, smoke test, evidence, rollback rehearsed.
- [ ] Every go/no-go criterion holds, and the ISSO and the change manager signed the decision.
- [ ] Production installed the version Stage 1 tested, under an approved normal change.
- [ ] The schedules started only after the production smoke test passed.
- [ ] Seven days of monitoring are in the evidence folder, and the week's evidence package verifies.
- [ ] `tests/python/test_deploy.py` passes.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 08 — One Writer per Attribute](08-one-writer-per-attribute.md) · [Workbook index](index.md)
:::

[^ttm09-fedramp]: FedRAMP Marketplace data, <https://www.fedramp.gov/marketplace/products.json> (last change November 1, 2026): ServiceNow Government Community Cloud (F1305072116: FedRAMP Certified, High, JAB path, authorized August 12, 2019); SailPoint Identity Security Cloud (FR2001938710A: FedRAMP Certified, Moderate, agency path, authorized June 5, 2024) (read November 2, 2026).
[^ttm09-sp-fedramp]: SailPoint, "Identity for government and critical infrastructure" (FedRAMP Moderate ATO; hosted in AWS GovCloud; core modules and advanced capabilities listed; no list of unavailable features; Native Change Detection and the HTTP Request step not mentioned), <https://www.sailpoint.com/solutions/fedramp-isc> (read November 2, 2026).
[^ttm09-sn-cc]: ServiceNow, "Client credentials grant workflow" (Zurich, last updated October 8, 2026: `POST /oauth_token.do`, `grant_type`, `client_id` and `client_secret` required, `scope` optional), <https://www.servicenow.com/docs/r/oJu9n0q6rU~F9UHAnNCt5w/nEdqo82hKBPEeGDqhx~hqw> (read November 2, 2026).
[^ttm09-sn-aes]: ServiceNow, "Publish an app from App Engine Studio when linked to source control" (Zurich, last updated July 31, 2025: role `admin`; **All** > **App Engine** > **App Engine Studio**, the app, **Publish**, version, release notes, repository or Store, **Continue**; commits the application's current state, creates a source control tag and publishes), <https://www.servicenow.com/docs/r/guL1zqmJkV9eywMq_6qu~w/x5QEx_AV7eOC21RMqOqcVw> (read November 2, 2026).
[^ttm09-sn-install]: ServiceNow, "Install an application from the application repository" (Zurich, last updated July 31, 2025: role `admin`; **All** > **System Applications** > **My Company Applications**, find the application, select a version, **Install**), <https://www.servicenow.com/docs/bundle/zurich-application-development/page/build/applications/task/install-app-from-repo.html> (read November 2, 2026).
[^ttm09-sn-us]: ServiceNow, "Get started with update sets" (Zurich, last updated July 31, 2025: update sets aren't meant for installing applications, which use the application repository or the Store; move from development to test to production; preview before committing), <https://www.servicenow.com/docs/r/guL1zqmJkV9eywMq_6qu~w/Dzl1AsfhhtvmdXMY_EBTVA> (read November 2, 2026).
[^ttm09-sn-repo]: ServiceNow, "ServiceNow application repository" (Zurich, last updated July 31, 2025: company instances entitled automatically by default; not available to self-hosted customers; a separate sign-in route for Federal Store customers), <https://www.servicenow.com/docs/r/guL1zqmJkV9eywMq_6qu~w/GPzhZ2fTLeFKG11v0urMJg> (read November 2, 2026).
[^ttm09-sn-rollback]: ServiceNow, "Legacy - Roll back, back out, and uninstall" (Australia, last updated March 12, 2026: an application repository installation is recorded for rollback; a rollback removes all code, table and file updates from the installation; data lost from a bad installation needs a database restore; source control installations aren't recorded for rollback; deleting a scoped application's record destroys its schema and data), <https://www.servicenow.com/docs/r/9Lur8HBNLjdzEcjznSAFzA/h1IBZegfwtLdM9hzQ7ANIw> (read November 2, 2026).
[^ttm09-sn-prop]: ServiceNow, "Add a system property" (Zurich, last updated July 31, 2025: role `admin`; enter `sys_properties.list` in the navigation filter, search for the property, set its value), <https://www.servicenow.com/docs/r/7LhbZn3yz3Q58qhjZoU9iQ/n_jwpkPYhvDkhsR0uXx7XA> (read November 2, 2026).
[^ttm09-sn-br]: ServiceNow, "Business Rule API - ServiceNow Fluent" (Zurich, last updated March 12, 2026: `active`, "Flag that indicates whether the business rule is enabled"; business rules in `sys_script`), <https://www.servicenow.com/docs/r/guL1zqmJkV9eywMq_6qu~w/hFJKYb~~sBTX2m4i~EzS4Q> (read November 2, 2026).
[^ttm09-sn-change]: ServiceNow, "Create a change request" (Zurich, last updated January 30, 2025: roles `itil`, `admin` or `sn_change_write`; **All** > **Change** > **Create New**; Normal, Emergency or Standard), <https://www.servicenow.com/docs/r/MlbQAgTiiiMOLOw9T36wJg/cloAfdFE6aOH0vR3nT28vw> (read November 2, 2026).
[^ttm09-wf-spec]: SailPoint, Identity Security Cloud OpenAPI specification, v2025: `listWorkflows` (`sp:workflow:read` or `sp:workflow:manage`), `createWorkflow` (`sp:workflow:manage`), `patchWorkflow` (`sp:workflow:manage`; JSON Patch, including `/enabled`), and the server `https://{tenant}.api.identitynow.com/v2025`, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/paths/workflows/workflows.yaml>, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/paths/workflows/workflow.yaml> and <https://github.com/sailpoint-oss/api-specs/blob/main/idn/sailpoint-api.v2025.yaml> (read November 2, 2026, at commit `5a6ea75`).
[^ttm09-wf-body]: SailPoint, Identity Security Cloud OpenAPI specification, v2025, `WorkflowBody` ("Workflows cannot be created in an enabled state"), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/schemas/workflows/WorkflowBody.yaml> (read November 2, 2026, at commit `5a6ea75`).
[^ttm09-wf-test]: SailPoint, Identity Security Cloud OpenAPI specification, v2025, `testWorkflow` (the workflow must be disabled; `sp:workflow-execute:external`; user level `ORG_ADMIN`; a live run; returns `workflowExecutionId`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/paths/workflows/workflow-test.yaml> (read November 2, 2026, at commit `5a6ea75`).
[^ttm09-wf-exec]: SailPoint, Identity Security Cloud OpenAPI specification, v2025, `getWorkflowExecution` (`sp:workflow-execution:read` or `sp:workflow:manage`; user level `ORG_ADMIN`; executions kept for up to 90 days) and `WorkflowExecution` (status `Completed`, `Failed`, `Canceled`, `Running`, `Queued`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/paths/workflows/workflow-execution.yaml> and <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/schemas/workflows/WorkflowExecution.yaml> (read November 2, 2026, at commit `5a6ea75`).
[^ttm09-sp-auth]: SailPoint Developer, "Authentication" (`POST https://[tenant].api.identitynow.com/oauth/token`; the client credentials grant; personal access tokens; `/oauth/info` for a tenant with a vanity domain), <https://developer.sailpoint.com/docs/api/authentication> (read November 2, 2026).
[^ttm09-sp-apikeys]: SailPoint, "Managing API Keys and Personal Access Tokens" (**Admin** > **Global** > **Security Settings** > **API Management** > **Create API Client**; personal access tokens under the user icon > **Preferences** > **Personal Access Tokens**; select only the scopes the application needs), <https://documentation.sailpoint.com/saas/help/common/api_keys.html> (read November 2, 2026).
[^ttm09-ncd]: SailPoint, "Managing Native Change Detection" (**Admin** > **Connections** > **Sources**; **Account Management** > **Native Change Detection**; **Enable Native Change Detection**; operations and attributes; all entitlement attributes for all operations recommended and needed by the workflow templates; aggregate after saving), <https://documentation.sailpoint.com/saas/help/sources/native_change_detection.html> (read November 2, 2026).
[^ttm09-agg]: SailPoint, "Loading Account Data" (**Admin** > **Connections** > **Sources**; **Account Management** > **Account Aggregation**; **Start Aggregation**), <https://documentation.sailpoint.com/saas/help/accounts/loading_data.html> (read November 2, 2026).
[^ttm09-entra-create]: Microsoft Learn, "How to create, invite, and delete users" (at least User Administrator; **Entra ID** > **Users** > **New user** > **Create new user**; **Account enabled** checked by default and can be cleared; job information on the Properties tab), <https://learn.microsoft.com/entra/fundamentals/how-to-create-delete-users> (read November 2, 2026).
[^ttm09-entra-edit]: Microsoft Learn, "Add or update a user's profile information and settings in the Microsoft Entra admin center" (at least User Administrator; **Entra ID** > **Users**, select a user, **Edit properties**, the **Job information** category including department, **Save**), <https://learn.microsoft.com/entra/fundamentals/how-to-manage-user-profile-info> (read November 2, 2026).
[^ttm09-graph]: Microsoft Learn, "Microsoft Graph national cloud deployments" (Microsoft 365 GCC continues to use the worldwide endpoints, `https://graph.microsoft.com`), <https://learn.microsoft.com/graph/deployments> (read November 2, 2026).
[^ttm09-moderate]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, release 5.2.0 OSCAL profile (includes AC-6, AU-6, AU-12, CA-7, CM-3, CM-3(2), CM-3(4), CM-4, CM-4(2), CM-5, CP-10, IA-5, SA-9 and SA-10), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (read November 2, 2026).
