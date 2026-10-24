# ServiceNow + SailPoint ISC integration kit (Pass 1: identity)

> **Status: illustrative. Unit-tested against mocked responses, not yet proven against live tenants.**
> This is an example of one way to build the [Ticket-to-Machine loop](../../docs/books/b13-governance/appendix-b-ticket-to-machine-reference.md) on two named products. It is not an endorsement of either product, and no agency has adopted it. Product and API facts were checked against vendor documentation on October 24, 2026; the explanation, with sources, is the research page [Integrating ServiceNow and SailPoint: An Implementation Example (Pass 1)](../../docs/research/snow-sailpoint-integration-kit.md).

It implements three builds from the example page [Ticket-to-Machine on ServiceNow and SailPoint](../../docs/research/ttm-servicenow-sailpoint.md):

| Build | Loop step (Book 13) | Gap it closes | Files |
|---|---|---|---|
| 1. Drift-to-task | 2 Detect drift, 3 Raise a typed task | Drift events become owned, clocked records (the build the example page calls *design guidance*) | `sailpoint/workflows/drift-to-servicenow.json`, `servicenow/scripted-rest-identity-finding.js` |
| 2. Re-read before close | 5 Close with evidence | **Gap 1**: a ticket status isn't a re-read | `servicenow/business-rule-await-verification.js`, `clients/*/reread_verification.py`, `Invoke-ReReadVerification.ps1` |
| 3. Drift reconciliation (read-only) | 1 Test, 2 Detect drift | Book 03's drift classes, measured by a join on `employeeId` | `clients/*/identity_drift.py`, `Get-IdentityDrift.ps1` |

```
examples/servicenow-sailpoint/
  README.md
  config/config.example.json            placeholders only; the loader refuses secrets in a file
  sailpoint/workflows/drift-to-servicenow.json
  servicenow/scripted-rest-identity-finding.js
  servicenow/business-rule-await-verification.js
  clients/python/kit_common.py           config, tokens, retries, paging
  clients/python/identity_drift.py       build 3
  clients/python/reread_verification.py  build 2
  clients/powershell/IdentityKit.psm1    the same pieces in PowerShell 7
  clients/powershell/Get-IdentityDrift.ps1
  clients/powershell/Invoke-ReReadVerification.ps1
  tests/fixtures/                        HR CSV, Graph, ISC and Entra audit samples, expected results
  tests/python/                          pytest, mocked HTTP
  tests/powershell/                      Pester 5, mocked Invoke-RestMethod
  tests/servicenow/                      node:test, stubbed Glide APIs
```

## How the pieces fit

1. SailPoint ISC fires an event: **Native Change Account Updated** (an account changed outside ISC: provenance drift), **Identity Attributes Changed** (an authoritative-source attribute changed: attribute drift, usually a mover) or **Provisioning Action Completed**.
2. An ISC workflow with an **HTTP Request** step posts the event to a ServiceNow **Scripted REST API**.
3. The script validates the payload, maps severity to priority and a due date, de-duplicates against open findings, and creates a `u_identity_finding` record with an **intended state**. A provisioning event is a *closure signal*: it moves matching findings to **Awaiting verification**. It never closes them.
4. A **business rule** turns any attempt to close a finding (or a ticket SailPoint's Service Desk integration opened) into *Awaiting verification*, unless the update carries re-read evidence and comes from the verifier account.
5. The **re-read client** reads each waiting record, re-reads the account, identity or user from its system of record, and closes the record with the evidence, or reopens it with a note.
6. Separately, the **drift client** joins the HR extract, Microsoft Graph and ISC on `employeeId`, writes findings to JSON and CSV, and can post them to the same endpoint.

## The identity finding: data contract

The Scripted REST resource accepts this JSON (`POST /api/x_example_idkit/identity_findings/finding`; the namespace is a placeholder for your scoped application's).

| Field | Required | Meaning |
|---|---|---|
| `kind` | no (default `finding`) | `finding` or `closure_signal` |
| `source` | yes | `sailpoint-isc` or `drift-reconciliation` |
| `drift_class` | yes | `missing_identity`, `stale_access`, `orphan_account`, `attribute_drift`, `unauthorized_write`, `credential_drift`, `schema_drift` (Book 03, Chapter 11) |
| `severity` | no | `P1`–`P4`; defaults by class (Book 03 High → P2, Medium → P3, *design guidance*) |
| `system` | no | `isc_account`, `isc_identity` or `entra_user`; says where the re-read happens |
| `account_id`, `identity_id`, `subject_id`, `employee_id` | one of them | The subject; de-duplication uses the first present |
| `native_identity`, `source_id`, `source_name` | no | The account on its source |
| `attribute`, `expected_value`, `observed_value` | no | What differs |
| `intended_state` | no | What the re-read must find, for example `{"disabled": true}`, `{"attributes": {"department": "Finance"}}`, `{"entitlements_absent": [{"attribute": "memberOf", "value": "CN=..."}]}`, `{"exists": false}`. Derived from the event when absent (a native change is reverted; an attribute change is kept) |
| `origin` | yes | Trigger ID and workflow, or the drift finding ID and checker |
| `detected_at`, `evidence` | no | When, and the raw facts |
| `single_value_changes`, `entitlement_changes`, `changes` | no | Raw ISC event fields; the script derives `intended_state` from them |

A `closure_signal` carries `recipient_id`, `account_requests` (each with `source.id` and `provisioningResult`), `tracking_number` and `errors`.

Responses: `201` with `sys_id`, `number`, `priority` on insert; `200` with `deduplicated: true` and the existing `sys_id` when an active finding has the same (source, subject, class); `400` with the reason on a validation failure.

**Severity and tempo** (Book 13 Appendix B; *program design, not a federal requirement*): P1 immediate, P2 1 hour, P3 24 hours, P4 72 hours. The script sets `priority` 1–4 and `due_date` = now + the window.

## ServiceNow setup (Personal Developer Instance first)

We can't export an update set from a document, so the table is described here. Create it in a scoped application (placeholder scope `x_example_idkit`).

**Table `u_identity_finding`, extends Task** (inherits `number`, `state`, `priority`, `due_date`, `short_description`, `assignment_group`, `assigned_to`, `work_notes`, `close_notes`, `active`, approvals):

| Field | Type | Book 13 evidence-record field it carries |
|---|---|---|
| `u_source` | String (40) | Origin |
| `u_drift_class` | Choice (the seven classes) | Origin (the finding's type) |
| `u_severity` | Choice P1–P4 | Owner and clock |
| `u_system` | Choice `isc_account`, `isc_identity`, `entra_user` | Result (where the re-read happens) |
| `u_subject_id`, `u_account_id`, `u_identity_id`, `u_employee_id` | String (100) | Origin |
| `u_native_identity` | String (512) | Origin |
| `u_source_id`, `u_source_name` | String (100) | Origin |
| `u_attribute` | String (255) | Origin |
| `u_expected_value`, `u_observed_value` | String (4000) | Origin |
| `u_intended_state` | String (4000), JSON | Result (what the re-read must show) |
| `u_origin` | String (4000), JSON | Origin |
| `u_dedupe_key` | String (512), indexed | — |
| `u_occurrences` | Integer | — |
| `u_detected_at`, `u_last_seen`, `u_awaiting_since` | Date/Time | Owner and clock |
| `u_evidence` | String (4000), JSON | Result: re-read query, time, result hash, checker |
| `u_evidence_hash` | String (64) | Closure |
| `u_verified_at` | Date/Time | Result |
| `u_raw_event` | String (4000) | Origin |

Approval, executing identity and "what ran" stay with the change or catalog record that actuated the fix; link it from the finding (*design guidance*). Pass 1 doesn't actuate.

**State values.** Add a state choice **Awaiting verification** (the kit assumes value `18`; set `SN_STATE_AWAITING_VERIFICATION` and the system property if yours differs). Closed Complete is `3` and reopened is `1` by default on Task tables; check yours.

**Scripted REST API.** System Web Services → Scripted REST APIs → New: name `identity_findings`; one resource, `POST /finding`, script = `servicenow/scripted-rest-identity-finding.js`. Require authentication and an ACL (type `REST_Endpoint`) granting a role such as `x_example_idkit.finding_writer` to the ISC workflow's integration user. Creating Scripted REST APIs needs `web_service_admin`; calling them doesn't.

**Business rule.** On `u_identity_finding`: before, update, order 1000, condition `current.state.changes()`, script = `servicenow/business-rule-await-verification.js`. Optionally add the same rule on `incident` and `sc_req_item` for tickets SailPoint's Service Desk integration opens. Then create these system properties:

| Property | Value |
|---|---|
| `x_example_idkit.state.awaiting_verification` | `18` (your value) |
| `x_example_idkit.verifier_user` | the `user_name` the re-read client authenticates as |
| `x_example_idkit.exception_role` | the role allowed to cancel with a close note (declared-exception lane) |
| `x_example_idkit.sdim_user_sys_id` | `sys_id` of the Service Desk integration's user (only for incident/sc_req_item) |
| `x_example_idkit.closed_states.<table>`, `x_example_idkit.cancel_states.<table>` | override the defaults in the script if your states differ |

**Inbound authentication.** Either:
- **OAuth client credentials**: Machine Identity Console → Inbound integrations → New integration → *OAuth - Client credential grant* (Zurich); request a token with `POST https://<instance>.service-now.com/oauth_token.do`, `grant_type=client_credentials`. Give each client its own integration user and only the roles below. Older releases enable the grant with a system property; see the verify list.
- **Basic** (developer instances only): a dedicated integration user with the same roles.

## SailPoint ISC setup (sandbox tenant first)

1. Turn on **Native Change Detection** on each source you want watched (source configuration, or the NCD configuration API).
2. Create an API client (or a personal access token for a least-privileged user) with the scopes below.
3. Edit `sailpoint/workflows/drift-to-servicenow.json`: replace the owner, the ServiceNow URL and the `REPLACE-IN-THE-UI` placeholders (enter credentials in the workflow editor, never in the file). Create each workflow through the Workflows API (`POST /v2025/workflows` in SailPoint's v2025 specification; the developer site now lists the same operation as `POST /workflows/v1`) or import it in the UI. Workflows can't be created enabled; enable them after a test run.
4. **Before relying on it**, build one HTTP Request step by hand in the workflow editor, export the workflow, and compare its attribute names with the file (see the verify list).

## Configuration

Environment variables (or a JSON file passed with `--config` / `-ConfigPath` for the non-secret ones; the loader refuses secrets in a file):

| Variable | Used by | Notes |
|---|---|---|
| `SAILPOINT_TENANT` | all | `https://{tenant}.api.identitynow.com` |
| `SAILPOINT_API_BASE` | all | override the base URL (vanity or other domains) |
| `SAILPOINT_CLIENT_ID`, `SAILPOINT_CLIENT_SECRET` | all | client credentials at `/oauth/token` |
| `SAILPOINT_ACCESS_TOKEN` | all | a token from your vault instead of a secret |
| `SN_INSTANCE` or `SN_BASE_URL` | re-read, drift push | `https://{instance}.service-now.com` |
| `SN_CLIENT_ID`, `SN_CLIENT_SECRET` | re-read, drift push | OAuth client credentials |
| `SN_USERNAME`, `SN_PASSWORD` | re-read, drift push | basic, developer instances only |
| `SN_ACCESS_TOKEN` | re-read, drift push | a token from your vault |
| `SN_FINDING_API_PATH`, `SN_FINDING_TABLE` | re-read, drift push | defaults match this README |
| `SN_STATE_AWAITING_VERIFICATION`, `SN_STATE_CLOSED`, `SN_STATE_REOPENED` | re-read | `18`, `3`, `1` |
| `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID` | drift, re-read of `entra_user` | app registration |
| `GRAPH_CERT_PATH` (PEM with key) or `GRAPH_CERT_THUMBPRINT` (PowerShell, `Cert:\CurrentUser\My`) | same | **preferred**: certificate client assertion |
| `GRAPH_CLIENT_SECRET` | same | fallback only |
| `GRAPH_ACCESS_TOKEN` | same | a token from your vault |
| `GRAPH_CLOUD` | same | `Global` (worldwide **and GCC**), `USGov` (GCC High: `graph.microsoft.us`), `USGovDoD` (`dod-graph.microsoft.us`) |
| `ISC_EMPLOYEE_ID_ATTRIBUTE` | drift | the identity attribute holding the HR key; default `employeeNumber` |
| `ISC_AUTHORITATIVE_SOURCES` | drift | comma-separated source names to ignore for stale access (the HR source) |
| `ALLOWED_WRITER_APP_IDS` | drift | appIds allowed to write HR-mastered attributes (your provisioning service) |

Python certificate auth needs the optional `cryptography` package; without it, use `GRAPH_ACCESS_TOKEN` or the secret fallback. Everything else is standard library plus `requests`.

## Least-privilege permissions

| Component | System | Permission | Why |
|---|---|---|---|
| Workflows (build 1) | ISC | `sp:workflow:manage` (to create them) | Workflows API, create workflow |
| Workflows (build 1) | ServiceNow | a custom role on the Scripted REST ACL, create on `u_identity_finding` | post findings |
| Drift client (build 3) | Microsoft Graph | `User.Read.All` (application) | list users with `employeeId`, `department`, `accountEnabled`, manager |
| Drift client (build 3) | Microsoft Graph | `AuditLog.Read.All` (application), optional | `directoryAudits`, for unauthorized writes |
| Drift client (build 3) | ISC | `sp:search:read`, `idn:accounts:read` | identities search; uncorrelated accounts |
| Drift client, `--push-to-servicenow` | ServiceNow | the finding-writer role | post findings |
| Re-read client (build 2) | ServiceNow | read and write on `u_identity_finding`, create on `sys_attachment` (custom role, for example `x_example_idkit.verifier`) | list, close or reopen, attach evidence |
| Re-read client (build 2) | ISC | `idn:accounts:read`, `sp:search:read` | `GET /v3/accounts/{id}`; identities search |
| Re-read client (build 2) | Microsoft Graph | `User.Read.All` | `GET /users/{id}` |
| Business rule | ServiceNow | the verifier account named in `x_example_idkit.verifier_user` | only it can close with evidence |

Nothing in Pass 1 needs write access to Entra ID, Active Directory or ISC. ISC notes that a client-credentials token carries no user context, so some APIs may return 403; a personal access token for a least-privileged user is the alternative (see the verify list).

## Run it (developer environment)

Use a ServiceNow Personal Developer Instance and a SailPoint sandbox tenant, never production first.

```powershell
# PowerShell 7 (read-only by default)
$env:SAILPOINT_TENANT = 'example'; $env:SN_INSTANCE = 'contoso'   # secrets from your vault, not shown
./clients/powershell/Get-IdentityDrift.ps1 -HrCsv ./hr.csv -ConfigPath ./config/config.example.json -IncludeAuditSince 2026-10-17T00:00:00Z
./clients/powershell/Invoke-ReReadVerification.ps1 -ConfigPath ./config/config.example.json            # dry run
./clients/powershell/Invoke-ReReadVerification.ps1 -ConfigPath ./config/config.example.json -Apply -WhatIf
```

```bash
# Python 3.10+ (read-only by default)
python clients/python/identity_drift.py --hr-csv hr.csv --config config/config.example.json --include-audit 2026-10-17T00:00:00Z
python clients/python/reread_verification.py --config config/config.example.json            # dry run
python clients/python/reread_verification.py --config config/config.example.json --apply
```

Offline runs: pass saved exports with `--graph-users-json`, `--isc-identities-json`, `--isc-accounts-json`, `--entra-audit-json` (PowerShell: `-GraphUsersJson`, and so on). The fixtures in `tests/fixtures/` show the shapes.

**HR extract columns:** `employeeId` (required, the join key), `status` (required: `Active`, `Leave` count as active; `Terminated`, `Separated`, `Inactive`, `Retired` as separated), `department`, `managerEmployeeId`, `displayName`, `email`. Other columns are ignored.

**Drift classes computed:** missing identity, stale access, orphan account, attribute drift (department and manager), and unauthorized write only when an Entra audit extract is supplied or fetched; otherwise it's listed under `not_computed`. Credential drift (card system, Intune) and schema drift (middleware validation) are always listed as not computed.

## Tests

```bash
python -m pytest examples/servicenow-sailpoint/tests/python -q
node --test examples/servicenow-sailpoint/tests/servicenow/servicenow_scripts.test.js
node --check examples/servicenow-sailpoint/servicenow/scripted-rest-identity-finding.js
python -m json.tool examples/servicenow-sailpoint/sailpoint/workflows/drift-to-servicenow.json
```

```powershell
pwsh -NoProfile -Command "Import-Module Pester -MinimumVersion 5.0; Invoke-Pester -Path examples/servicenow-sailpoint/tests/powershell -Output Detailed"
pwsh -NoProfile -Command "Invoke-ScriptAnalyzer -Path examples/servicenow-sailpoint -Recurse"
```

Both clients run the same fixtures and must produce the same findings and the same finding IDs (`tests/fixtures/expected_findings.json`, `expected_finding_ids.json`). The ServiceNow tests run the two scripts in Node with stubbed `GlideRecord`, `GlideDateTime`, `gs` and `sn_ws_err`; they test the logic, not ServiceNow.

## Safety

- **Read-only by default.** The clients print what they would do; only `--apply` / `-Apply` writes, and only to ServiceNow. `-WhatIf` previews an `-Apply` run.
- **No secrets in code or files.** Secrets come from environment variables or a vault-fed token; the config loader refuses a secret key in a file. The workflow file carries placeholders; enter credentials in the workflow editor's sensitive fields.
- **Test tenant first.** A Personal Developer Instance and a SailPoint sandbox, with synthetic data like the fixtures.
- **Closure only from a re-read.** The business rule, not the client, enforces it: a person can't close a finding by setting the state.
- **Placeholders.** `contoso`, `example`, `x_example_idkit` and the GUIDs in the fixtures are invented.

## Verify in your tenant

These couldn't be confirmed from public documentation on October 24, 2026. Check each before relying on the kit.

1. **Native Change Account Updated trigger ID.** The file uses `idn:native-change-account-updated`. SailPoint's published trigger table lists `idn:identity-attributes-changed` and `idn:post-provisioning` but not the native-change triggers. List the triggers in your tenant (workflow library triggers API, or the workflow editor) and use the ID it shows.
2. **HTTP Request step attribute names.** SailPoint documents the step's UI fields (Authentication Type, Request URL, Method, Request Content Type, Request Headers, Request Body, OAuth 2.0 client-credentials options), not its JSON. The file's `sp:http`, `method`, `url`, `requestContentType`, `authenticationType: "OAuth"`, `oAuthTokenUrl`, `oAuthClientId`, `oAuthClientSecret`, `oAuthCredentialLocation` and `jsonRequestBody` follow commonly exported workflows; export a hand-built step and correct the file.
3. **JSONPath inside the request body.** The file uses `"field.$": "$.account.id"` keys, the convention SailPoint's published workflow example uses for action attributes (`recipientId.$: $.identity.id`). Confirm that the HTTP step resolves `.$` keys inside `jsonRequestBody`, and whether your tenant's trigger input is at `$` or `$.trigger`.
4. **Trigger filter.** `filter.$` with `$.changes[?(@.attribute == 'department')]` follows SailPoint's schema example; test it with a sample event.
5. **`provisioningResult` values.** The sample shows `SUCCESS`; the script also accepts `COMMITTED`. Check what your sources report.
6. **ISC API domain** for your tenant, especially a FedRAMP tenant: set `SAILPOINT_API_BASE` from your tenant's `/oauth/info`; the authentication page documents only `{tenant}.api.identitynow.com`.
7. **Search has no `accounts` index.** The v3 Search index list is `accessprofiles`, `accountactivities`, `entitlements`, `events`, `identities`, `roles`, `workflowsummaries`. The kit reads accounts nested on identities, and re-reads a single account with `GET /v3/accounts/{id}`. Confirm the `id:"..."` query syntax in your tenant.
8. **Token context and user levels.** Client-credentials tokens have no user context; some APIs may return 403. Search lists user levels such as `ORG_ADMIN`, `REPORT_ADMIN` and `SOURCE_ADMIN` for user tokens. Choose the least-privileged option that works.
9. **HR key in ISC.** Which identity attribute holds `employeeId` (`employeeNumber` is a top-level search field; yours may be `attributes.employeeId`).
10. **ServiceNow inbound client credentials** on your release: the Zurich pages document the Machine Identity Console path and the `oauth_token.do` request (`grant_type=client_credentials`, form-encoded); the Xanadu page documents a system property (`glide.oauth.inbound.client.credential.grant_type.enabled`, false by default) and an OAuth Application User field. Which applies to your instance wasn't confirmed. Confirm which identity `gs.getUserName()` returns for an OAuth client-credentials call, because the business rule compares it with `x_example_idkit.verifier_user`.
11. **State values** on your tables (the custom Awaiting verification value, closed and cancelled values for `u_identity_finding`, `incident`, `sc_req_item`).
12. **How to recognize a Service Desk integration ticket.** The rule assumes `opened_by` is the integration's user; your configuration may use a correlation field instead.
13. **REST roles.** Table API, Attachment API and Scripted REST ACLs; whether your instance enforces REST API access policies that need extra roles.
14. **Graph manager expansion under application permissions.** `GET /users?$expand=manager($select=id,employeeId)` with `User.Read.All`; Microsoft's "List manager" page lists application permissions as not supported for that endpoint. If your tenant rejects the expansion, fetch managers per user.
15. **Entra audit shape.** The drift client looks for `activityDisplayName` = `Update user` and `modifiedProperties` display names such as `Department` and `EmployeeId`. Check against your tenant's audit entries.
16. **Certificate assertion algorithm.** Microsoft's certificate-credentials page now says `PS256`; test the token request in your cloud.
17. **Freshness of ISC reads.** An ISC account reflects the last aggregation. The re-read client treats an account not modified since the record started waiting as *pending* for `--grace-hours` (default 24), then as a mismatch. Tune it to your aggregation schedule.
18. **Reachability.** ISC workflows call out from SailPoint's cloud, so the ServiceNow endpoint must be reachable from it (*inference*).
19. **FedRAMP feature parity.** Whether Workflows, Native Change Detection and the HTTP Request step are available in the ISC FedRAMP environment; ask SailPoint.

## Not in Pass 1

Actuation (the fix itself), the change record that authorizes it, signing the closure record, credential and schema drift, and the Book 13 lanes beyond identity. Each needs its own proof in a lab before this example moves past *illustrative*.
