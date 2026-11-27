---
title: "Ticket-to-Machine, Module 2: The Boundary and Least Privilege"
subtitle: "Confirm what runs where, then prove every integration identity holds exactly what its calls need"
description: "Module 2 of the Ticket-to-Machine learning path. You confirm the authorization boundary and the integration identities, then use the kit's call list and kit_calls.py to compare ServiceNow roles, ISC scopes and Graph permissions with what each task needs. Guide Gate 1; workbook Chapters 02 and 03."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 2
date-modified: 2026-11-01
review-status: approved
reviewed-sha256: b8c925551c1c2ad669948bc9c828142941fe3d4b6c3cdb1ebf8e50afe8093bf0
last-reviewed: 2026-11-25
---
# Ticket-to-Machine, Module 2: The Boundary and Least Privilege {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 2 of 7 · 60 minutes · Guide [Gate 1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary) · Workbook [Chapter 02](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md) and [Chapter 03](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_TTM_Module_2.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_TTM_Module_2_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_TTM_Module_2_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ttm-module-2/Training_TTM_Module_2_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ttm-module-2/Training_TTM_Module_2_Narrated.vtt).

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Before any call is made, you need to know which actions run from a vendor's cloud, and which non-person identities make them. Then each identity must hold exactly what its calls need. An administrator who grants `itil` "to make it work" has given the integration every ITSM table; an API client with a manage scope can change accounts if its token is stolen. In this module you confirm the boundary on paper and make privilege something a test can check.

**The federal requirement.** The guide's [Gate 1 requirements and evidence table](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary) maps the boundary to NIST SP 800-53 SA-9, CA-3, IA-5 and AC-6 and to FedRAMP authorization. The chapters' tables map the call list to AC-6, AC-2, AC-5 and CM-3: see [Chapter 02](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#federal-requirements-and-evidence) and [Chapter 03](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#federal-requirements-and-evidence). Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't.

### Learning objectives

In this module, you'll:

- Explain what Gate 1 records about each product's authorization and each vendor-cloud action.
- Describe the ServiceNow roles the kit uses, and why they are split by task.
- Describe the ISC scopes and Graph permissions each task needs, and why the workflow scope gets its own client.
- Verify a grant against the call list, and catch a grant that is too wide.

### Prerequisites

- [Module 1](01-the-loop-and-the-typed-task.md).
- For the Graph rows, [Microsoft Automation, Module 1: permissions](../ms-automation-foundations.md#permissions).

## Unit 2: The authorization boundary

*8 minutes*

Gate 1 records and decides; it builds nothing. You confirm each product's FedRAMP status on the Marketplace, ask the vendor in writing what's inside the authorization, record which actions run from a vendor's cloud as data flows, and register the integration identities (the two connections and the seven the kit runs) with a certificate or federated credential, never a long-lived secret. Read:

- The guide's [Gate 1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary): its steps, its availability table and its interim path.
- The guide's [prerequisites](../../books/guides/ttm-servicenow-sailpoint.md#prerequisites), for the integration identities.
- The guide's [Validate (G1 Boundary)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g1-boundary) step, which names the validation-kit checks and the manual record.

## Unit 3: ServiceNow roles, split by task

*10 minutes*

`config/calls.json` lists every HTTP call a Python client makes, the task that makes it, the least privilege it needs and the vendor page that says so. A test runs the clients against a fake HTTP session and fails on any call the file doesn't declare. The ServiceNow roles are custom roles split by task: a finding writer, a verifier and an evidence reader. Read:

- [Chapter 02: what exists](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#what-exists), for the token order, paging and retries.
- [Chapter 02: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#what-this-chapter-adds), for the call list and why each role exists.
- [Chapter 02: dangers](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#dangers).

## Unit 4: ISC scopes and Graph permissions

*10 minutes*

The drift and re-read clients need read scopes only. Creating the ISC workflows needs a manage scope that no client in the kit uses, so it belongs to a separate client used once. The Graph app registration needs `User.Read.All`, and `AuditLog.Read.All` only if the run reads the audit. Read:

- [Chapter 03: what exists](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#what-exists), including what a client-credentials token can't do in ISC.
- [Chapter 03: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#what-this-chapter-adds), for the ISC and Graph rows and `--required-only`.
- The implementation example's [permissions](../../books/guides/snow-sailpoint-integration-kit.md#permissions).

## Unit 5: Exercise: Lab 1 (fixtures, no tenant)

*22 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\ticket-to-machine-code\servicenow-sailpoint

# Step 1
python -m pytest -q -p no:cacheprovider tests/python/test_kit_calls.py

# Step 2
python clients/python/kit_calls.py --task reread --system servicenow

# Step 3
python clients/python/kit_calls.py --task reread --system servicenow --granted "x_example_idkit.verifier,itil"

# Step 4
python clients/python/kit_calls.py --task evidence --system servicenow --granted "x_example_idkit.verifier"

# Step 5
python -m pytest -q -p no:cacheprovider tests/python/test_kit_common.py -k "sn_ or retry or paging or base_urls"

# Step 6
python -m pytest -q -p no:cacheprovider tests/python/test_kit_common.py -k isc

# Step 7
python clients/python/kit_calls.py --task drift --system isc

# Step 8
python clients/python/kit_calls.py --task drift --system isc --granted "sp:search:read,idn:accounts:read,idn:accounts:manage"

# Step 9
python clients/python/kit_calls.py --task workflows --system isc --granted "sp:search:read,idn:accounts:read"

# Step 10
python clients/python/kit_calls.py --task drift --system graph --granted "User.Read.All"
python clients/python/kit_calls.py --task drift --system graph --required-only --granted "User.Read.All"
```

:::

<!-- labs:end -->

You prove every call is declared, then compare grants with the call list for ServiceNow, ISC and Graph. [Chapter 02, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-1-fixtures-no-tenant) and [Chapter 03, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-1-fixtures-no-tenant) explain each result.

Every step runs in PowerShell 7, the Python commands included, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\ticket-to-machine-code\servicenow-sailpoint
```

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/ticket-to-machine-code/servicenow-sailpoint`; every step runs the same there. In a clone of the repository, use the `examples` folder of the same name.

**Part A: ServiceNow (Chapter 02)**

1. Prove every call is declared.

   ```powershell
   python -m pytest -q -p no:cacheprovider tests/python/test_kit_calls.py
   ```

   Expected: a line of 9 dots, then `9 passed in` and the time the run took, which differs from run to run.

2. List what the re-read client needs on ServiceNow.

   ```powershell
   python clients/python/kit_calls.py --task reread --system servicenow
   ```

   Expected output:

   ```text
   Task reread: reread_verification.py: list waiting findings, re-read each subject, close or reopen with evidence

   servicenow
     POST   /oauth_token.do                                            an inbound OAuth client (client credentials) with its own integration user
     GET    /api/now/table/u_identity_finding                          x_example_idkit.verifier (read on u_identity_finding)
     PATCH  /api/now/table/u_identity_finding/{sys_id}                 x_example_idkit.verifier (write on u_identity_finding)
     POST   /api/now/attachment/file                                   x_example_idkit.verifier (create on sys_attachment)
     needs: x_example_idkit.verifier
   ```

3. Catch a grant that is too wide: an administrator gave the verifier `itil` as well.

   ```powershell
   python clients/python/kit_calls.py --task reread --system servicenow --granted "x_example_idkit.verifier,itil"
   ```

   Expected output (the command exits 1):

   ```text
   Task reread: reread_verification.py: list waiting findings, re-read each subject, close or reopen with evidence

   servicenow
     POST   /oauth_token.do                                            an inbound OAuth client (client credentials) with its own integration user
     GET    /api/now/table/u_identity_finding                          x_example_idkit.verifier (read on u_identity_finding)
     PATCH  /api/now/table/u_identity_finding/{sys_id}                 x_example_idkit.verifier (write on u_identity_finding)
     POST   /api/now/attachment/file                                   x_example_idkit.verifier (create on sys_attachment)
     needs: x_example_idkit.verifier

   missing: none
   extra:   itil
   Least privilege does not hold: fix the grant.
   ```

4. Catch the evidence export reusing the verifier's role.

   ```powershell
   python clients/python/kit_calls.py --task evidence --system servicenow --granted "x_example_idkit.verifier"
   ```

   Expected output (the command exits 1):

   ```text
   Task evidence: evidence_export.py: read closed findings for the evidence export

   servicenow
     POST   /oauth_token.do                                            an inbound OAuth client (client credentials) with its own integration user
     GET    /api/now/table/u_identity_finding                          x_example_idkit.evidence_reader (read only on u_identity_finding)
     needs: x_example_idkit.evidence_reader

   missing: x_example_idkit.evidence_reader
   extra:   x_example_idkit.verifier
   Least privilege does not hold: fix the grant.
   ```

5. Run the original ServiceNow client tests.

   ```powershell
   python -m pytest -q -p no:cacheprovider tests/python/test_kit_common.py -k "sn_ or retry or paging or base_urls"
   ```

   Expected: a line of 7 dots, then `7 passed, 10 deselected in` and the time the run took.

**Part B: ISC and Graph (Chapter 03)**

6. Run the ISC client tests.

   ```powershell
   python -m pytest -q -p no:cacheprovider tests/python/test_kit_common.py -k isc
   ```

   Expected: a line of 4 dots, then `4 passed, 13 deselected in` and the time the run took.

7. List what the drift client needs from ISC.

   ```powershell
   python clients/python/kit_calls.py --task drift --system isc
   ```

   Expected output:

   ```text
   Task drift: identity_drift.py: read Graph users, the Entra audit, ISC identities and uncorrelated accounts

   isc
     POST   /oauth/token                                               API client (client credentials) or a personal access token
     POST   /v3/search                                                 sp:search:read
     GET    /v3/accounts                                               idn:accounts:read
     needs: idn:accounts:read, sp:search:read
   ```

8. Catch a manage scope on a read client.

   ```powershell
   python clients/python/kit_calls.py --task drift --system isc --granted "sp:search:read,idn:accounts:read,idn:accounts:manage"
   ```

   Expected output (the command exits 1):

   ```text
   Task drift: identity_drift.py: read Graph users, the Entra audit, ISC identities and uncorrelated accounts

   isc
     POST   /oauth/token                                               API client (client credentials) or a personal access token
     POST   /v3/search                                                 sp:search:read
     GET    /v3/accounts                                               idn:accounts:read
     needs: idn:accounts:read, sp:search:read

   missing: none
   extra:   idn:accounts:manage
   Least privilege does not hold: fix the grant.
   ```

9. Check the drift client's scopes against the workflow task.

   ```powershell
   python clients/python/kit_calls.py --task workflows --system isc --granted "sp:search:read,idn:accounts:read"
   ```

   Expected output (the command exits 1):

   ```text
   Task workflows: create the three ISC workflows from sailpoint/workflows/drift-to-servicenow.json (by hand or a pipeline; no client in the kit makes this call)

   isc
     POST   /v2025/workflows                                           sp:workflow:manage
     needs: sp:workflow:manage

   missing: sp:workflow:manage
   extra:   idn:accounts:read, sp:search:read
   Least privilege does not hold: fix the grant.
   ```

   The two jobs need two clients.

10. Check the Graph app registration, first for a drift run that reads the audit, then for one that doesn't.

    ```powershell
    python clients/python/kit_calls.py --task drift --system graph --granted "User.Read.All"
    python clients/python/kit_calls.py --task drift --system graph --required-only --granted "User.Read.All"
    ```

    Expected output, the first command's (it exits 1) and then the second's (it exits 0):

    ```text
    Task drift: identity_drift.py: read Graph users, the Entra audit, ISC identities and uncorrelated accounts

    graph
      POST   /{tenant}/oauth2/v2.0/token                                app registration with a certificate (client credentials)
      GET    /v1.0/users                                                User.Read.All
      GET    /v1.0/auditLogs/directoryAudits                            AuditLog.Read.All (optional)
      needs: AuditLog.Read.All, User.Read.All

    missing: AuditLog.Read.All
    extra:   none
    Least privilege does not hold: fix the grant.
    Task drift: identity_drift.py: read Graph users, the Entra audit, ISC identities and uncorrelated accounts

    graph
      POST   /{tenant}/oauth2/v2.0/token                                app registration with a certificate (client credentials)
      GET    /v1.0/users                                                User.Read.All
      GET    /v1.0/auditLogs/directoryAudits                            AuditLog.Read.All (optional)
      needs: AuditLog.Read.All, User.Read.All

    missing: none
    extra:   none
    Least privilege holds.
    ```

    The first reports `missing: AuditLog.Read.All`; the second, with `--required-only`, reports `Least privilege holds.`

**Check your work:** for any kit task, you can list the permissions it needs on each system and show whether a grant matches.

## Unit 6: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

<!-- labs:begin module-lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-2-commands collapse="false" title="The Lab 2 commands, against your test environment"}
Every command in the 2 chapters' labs, chapter by chapter, in order, against your test environment, never production.

Replace each `<placeholder>` with your test environment's value.

The chapter's steps say what each command does and what to look for.

**[Chapter 02, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-2-a-servicenow-developer-instance)**

```bash
# Step 2: Create one integration user per role
export SN_ADMIN="<admin-user>:<admin-password>"
export SN_TABLE="https://<instance>.service-now.com/api/now/table"
for pair in "<verifier-user>=x_example_idkit.verifier" "<reader-user>=x_example_idkit.evidence_reader"; do
  user="${pair%%=*}"; role="${pair#*=}"
  USER_ID=$(curl -s -u "$SN_ADMIN" -H "Content-Type: application/json" -H "Accept: application/json" -X POST --data "{\"user_name\": \"$user\", \"first_name\": \"Lab\", \"last_name\": \"$role\", \"web_service_access_only\": \"true\"}" "$SN_TABLE/sys_user" | python -c "import json,sys; print(json.load(sys.stdin)['result']['sys_id'])")
  ROLE_ID=$(curl -s -u "$SN_ADMIN" -H "Accept: application/json" "$SN_TABLE/sys_user_role?sysparm_query=name=$role&sysparm_fields=sys_id" | python -c "import json,sys; print(json.load(sys.stdin)['result'][0]['sys_id'])")
  curl -s -o /dev/null -w "$user gets $role: HTTP %{http_code}\n" -u "$SN_ADMIN" -H "Content-Type: application/json" -H "Accept: application/json" -X POST --data "{\"user\": \"$USER_ID\", \"role\": \"$ROLE_ID\"}" "$SN_TABLE/sys_user_has_role"
done
curl -s -u "$SN_ADMIN" -H "Accept: application/json" "$SN_TABLE/sys_user_has_role?sysparm_query=user.user_nameIN<writer-user>,<verifier-user>,<reader-user>&sysparm_fields=user.user_name,role.name"
unset SN_ADMIN SN_TABLE USER_ID ROLE_ID

# Step 3: Compare each user's roles
python clients/python/kit_calls.py --task drift-push --system servicenow --granted "<writer-roles>"
python clients/python/kit_calls.py --task reread --system servicenow --granted "<verifier-roles>"
python clients/python/kit_calls.py --task evidence --system servicenow --granted "<reader-roles>"

# Step 4: Exercise each user
export SN_ACCESS_TOKEN=$(curl -s -X POST "https://<instance>.service-now.com/oauth_token.do" -d grant_type=client_credentials -d client_id="<verifier-client-id>" -d client_secret="<verifier-client-secret>" | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
curl -s -H "Authorization: Bearer $SN_ACCESS_TOKEN" -H "Accept: application/json" "https://<instance>.service-now.com/api/now/table/u_identity_finding?sysparm_limit=5"

# Step 4: Exercise each user
export SN_ACCESS_TOKEN=$(curl -s -X POST "https://<instance>.service-now.com/oauth_token.do" -d grant_type=client_credentials -d client_id="<reader-client-id>" -d client_secret="<reader-client-secret>" | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
curl -s -w "\nHTTP %{http_code}\n" -X PATCH -H "Authorization: Bearer $SN_ACCESS_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" --data '{"work_notes": "lab: evidence reader write test"}' "https://<instance>.service-now.com/api/now/table/u_identity_finding/<sys_id>"

# Step 5: Back it out
unset SN_ACCESS_TOKEN
```

Steps with no command, done in the portal or by hand as the chapter's step says:

- **Step 1:** Create three custom roles

**[Chapter 03, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-2-a-sailpoint-sandbox-tenant)**

```bash
# Step 1: Find the API base
curl -s "https://<tenant>.api.identitynow.com/oauth/info"

# Step 1: Find the API base
export SAILPOINT_API_BASE="https://<tenant>.api.identitynow.com"

# Step 2: Create two API clients
python clients/python/kit_calls.py --task drift --system isc --granted "<reader-scopes>"
python clients/python/kit_calls.py --task workflows --system isc --granted "<workflow-scopes>"

# Step 3: Try the reader
export SAILPOINT_ACCESS_TOKEN=$(curl -s -X POST "$SAILPOINT_API_BASE/oauth/token" -d grant_type=client_credentials -d client_id="<reader-client-id>" -d client_secret="<reader-client-secret>" | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --skip-graph --out-json out/sandbox.json --out-csv out/sandbox.csv

# Step 3: Try the reader
export SAILPOINT_ACCESS_TOKEN=$(curl -s -X POST "$SAILPOINT_API_BASE/oauth/token" -d grant_type=client_credentials -d client_id="<pat-client-id>" -d client_secret="<pat-client-secret>" | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --skip-graph --out-json out/sandbox.json --out-csv out/sandbox.csv

# Step 4: Check the employee ID attribute
curl -s -X POST "$SAILPOINT_API_BASE/v3/search?limit=1" -H "Authorization: Bearer $SAILPOINT_ACCESS_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" --data '{"indices": ["identities"], "query": {"query": "*"}}'

# Step 4: Check the employee ID attribute
export ISC_EMPLOYEE_ID_ATTRIBUTE="<employee-id-attribute>"

# Step 5: Back it out
rm -rf out
unset SAILPOINT_ACCESS_TOKEN
```
:::

<!-- labs:end -->

- **ServiceNow:** in your Personal Developer Instance, create the three custom roles, one integration user and one OAuth client-credentials integration per role, compare each user's roles with the kit's call list, and confirm the evidence reader can't patch a record. Follow [Chapter 02, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-2-a-servicenow-developer-instance). **Back it out** with its step 5: delete the OAuth integrations, users and roles, and revoke any saved token.
- **SailPoint:** in an ISC sandbox tenant, create a reader API client and a separate workflow client, compare each with the call list, and try the reader. Follow [Chapter 03, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-2-a-sailpoint-sandbox-tenant). **Back it out** with its step 5: delete both API clients (or the personal access tokens and the dedicated user) and anything under `out`.
- **You need:** the developer instance from Module 1's Lab 2 and a SailPoint sandbox tenant.

## Unit 7: Knowledge check

*5 minutes*

1. `kit_calls.py --task reread --system servicenow --granted "x_example_idkit.verifier,itil"` reports `extra:   itil`. What does that mean?
   a. The grant is fine; extra roles are ignored.
   b. Least privilege doesn't hold: the grant is wider than the task needs, and the command exits 1.
   c. The verifier role is missing.

2. Why does the evidence export get its own `x_example_idkit.evidence_reader` role instead of reusing the verifier's?
   a. The verifier role can't read `u_identity_finding`.
   b. With the verifier's role, the export could also close findings; the reader can't change a record it's about to hash.
   c. ServiceNow allows only one integration user per role.

3. Which ISC scope belongs on a separate client that is used once and then removed?
   a. `sp:search:read`
   b. `idn:accounts:read`
   c. `sp:workflow:manage`

4. Gate 1 asks you to record which actions run from a vendor's cloud. Why?
   a. Book 15 prefers execution through a connector inside the boundary, so each vendor-cloud action is a recorded data flow.
   b. Vendor-cloud actions can't be used at FedRAMP Moderate.
   c. The FedRAMP Marketplace requires the agency to list them.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** `--granted` exits 1 on anything missing or extra. See [Chapter 02, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-1-fixtures-no-tenant).
2. **b.** Roles are split by task so the reader can't change what it hashes. See [Chapter 02: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#what-this-chapter-adds).
3. **c.** No client in the kit creates workflows, so that scope gets its own client. See [Chapter 03: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#what-this-chapter-adds).
4. **a.** Each vendor-cloud action becomes a recorded data flow. See step 4 of the guide's [Gate 1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary).
:::

## Unit 8: Summary

*2 minutes*

You confirmed what Gate 1 records, learned the roles, scopes and permissions each kit task needs, and caught three kinds of over-wide grant on a laptop.

**Evidence an ISSO keeps from this module:** the Marketplace listings with the date read, the vendor's written answers, the data-flow record and the identity register (Gate 1); `config/calls.json` and its test, and the `kit_calls.py --granted` output kept with each access approval (Chapters 02 and 03). Before shipping, work through the [Chapter 02 checklist](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#checklist) and the [Chapter 03 checklist](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 1](01-the-loop-and-the-typed-task.md) · [Learning path](index.md) · [Next: Module 3, One writer per attribute →](03-one-writer-per-attribute.md)
:::
