---
title: "Integrating ServiceNow and SailPoint: An Implementation Example (Pass 1)"
subtitle: "Three identity builds behind the Ticket-to-Machine example: drift events become typed findings, findings close only on a re-read, and a read-only reconciliation measures Book 03's drift classes"
description: "Research draft: an illustrative integration kit for ServiceNow and SailPoint Identity Security Cloud, with an ISC workflow that raises identity findings through a ServiceNow Scripted REST API, a business rule and re-read clients that close a finding only on evidence, and a read-only drift reconciliation of an HR extract, Microsoft Graph and ISC. Unit-tested against mocked responses, not yet proven against live tenants."
research-status: draft
research-type: implementation guide
research-book: "Books 03, 13, 15"
date-modified: 2026-10-24
---

# Integrating ServiceNow and SailPoint: An Implementation Example (Pass 1) {.unnumbered}

::: {.callout-note}
## An example, not an endorsement
This page explains a kit of scripts that implements part of [Ticket-to-Machine on ServiceNow and SailPoint](ttm-servicenow-sailpoint.md), which is itself an example of the vendor-neutral [Book 13, Appendix B](../books/b13-governance/appendix-b-ticket-to-machine-reference.md). Other products can fill the same slots. The code is **illustrative: unit-tested against mocked responses, not yet proven against live tenants**. Vendor and API facts are from each vendor's documentation, opened on October 24, 2026, and footnoted. Statements marked *(inference)* or *(design guidance)* are the program's.
:::

**The kit:** [examples/servicenow-sailpoint on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint). Its README has the setup steps, the configuration, the permissions and a list of what to verify in your own tenant.

## What Pass 1 builds

The example page found that the two products, used as shipped, leave the loop's last step to a ticket status, and that turning SailPoint's drift events into ServiceNow tasks is a build, not a packaged app. Pass 1 builds those pieces for identity, and only identity:

| Build | Loop step | What it does |
|---|---|---|
| 1. Drift-to-task | 2 Detect drift, 3 Raise a typed task | SailPoint ISC event triggers start ISC workflows whose HTTP Request step posts to a ServiceNow Scripted REST API, which creates a typed **identity finding** with an owner, a priority and a due date |
| 2. Re-read before close | 5 Close with evidence (**Gap 1**) | A business rule turns any close into *Awaiting verification*; a client re-reads the account, identity or user and closes the record with the evidence, or reopens it |
| 3. Drift reconciliation | 1 Test, 2 Detect drift | A read-only client joins the HR extract, Microsoft Graph and ISC on `employeeId` and reports Book 03's drift classes as JSON and CSV |

Pass 1 doesn't actuate anything. The fix itself, the change record that authorizes it, and signing the closure record are later passes.

## Architecture

1. **Detect.** ISC fires three events. *Native Change Account Updated* fires when an aggregation finds an account updated outside ISC on a source with Native Change Detection turned on; its input carries the account, the correlated identity, the source and the old and new values.[^sp-ncd][^sp-ncd-help] *Identity Attributes Changed* fires when one or more identity attributes change, and carries only the attributes that changed.[^sp-iac] *Provisioning Action Completed* fires after a provisioning action completes on a source, with each account request's result.[^sp-prov] All three are fire-and-forget triggers.[^sp-triggers]
2. **Raise.** One ISC workflow per trigger. A workflow is a JSON document with a name, an owner, a definition (a start step and a map of steps) and a trigger (type `EVENT` and the trigger's ID); workflows can't be created enabled.[^sp-wf] Its one action is an HTTP Request step, which supports basic, custom-header and OAuth 2.0 client-credentials authentication, JSON bodies, and retries that honor Retry-After.[^sp-http] The step posts to a ServiceNow Scripted REST API resource, a custom endpoint at `/api/<namespace>/<api_id>/<path>` whose access is controlled by authentication and REST_Endpoint ACLs.[^sn-srapi] The resource script reads `request.body.data` and answers with `response.setStatus`, `response.setBody` or `response.setError(new sn_ws_err.BadRequestError(...))`.[^sn-resp][^sn-samples]
3. **Hold the clock.** The script maps the severity to a priority and a due date using the program's tempo, de-duplicates on (source, subject, class) while a finding is open, and stores an **intended state**: what a re-read must find for the finding to close *(design guidance)*.
4. **Close on evidence.** A *before update* business rule watches the state field (`changes()` tells a rule that a field was modified[^sn-ge]) and moves any close to *Awaiting verification*. The re-read client reads waiting records through the Table API (`sysparm_query`, `sysparm_limit`, `sysparm_offset`),[^sn-table] re-reads the subject, and writes the result with a `PATCH` and an evidence file through the Attachment API (`table_name`, `table_sys_id`, `file_name`).[^sn-attach]
5. **Measure.** The drift client reads Microsoft Graph users and, optionally, the Entra audit log, and ISC identities and uncorrelated accounts, then compares each to the HR extract.

## Build 1: drift to a typed task

| ISC trigger | Trigger ID | Finding | Intended state the script derives |
|---|---|---|---|
| Native Change Account Updated | `idn:native-change-account-updated` *(not in SailPoint's published table; verify)* | `unauthorized_write`, on the account | The write reverted: old attribute values back, added entitlements absent, removed ones present |
| Identity Attributes Changed | `idn:identity-attributes-changed`[^sp-triggers] | `attribute_drift`, on the identity | The new authoritative values held |
| Provisioning Action Completed | `idn:post-provisioning`[^sp-triggers] | Closure signal | Moves matching findings to *Awaiting verification*; a failure only adds a work note |

Treating a native change as Book 03's unauthorized write, and an attribute change as attribute drift, is the same *(inference)* the example page makes. Native Change Detection isn't available on every source type: SailPoint excludes Non-Employee Lifecycle Management sources, and SAML just-in-time sources need the API to turn it on.[^sp-ncd-help]

**Severity and tempo.** Book 03 gives each drift class a default severity, High or Medium. The kit puts High at P2 and Medium at P3 on Book 13's scale *(design guidance)*; a finding can carry its own severity. Book 13's tempo sets the due date: P1 immediate, P2 one hour, P3 24 hours, P4 72 hours. Those are the program's windows, not federal requirements. Book 13 also says provenance drift is P1 when the claim is in active use; the workflow can't know that, so a person or a rule raises it *(design guidance)*.

**De-duplication.** A second event for the same source, subject and class, while a finding is open, adds a work note and a counter instead of a new record. Repeated drift on one account is one piece of work.

## The identity finding and Book 13's evidence record

Book 13 says every lane writes the same record shape. This is where an identity finding's fields land in it:

| Book 13 evidence-record field | Identity finding fields | Filled by |
|---|---|---|
| Origin | `u_origin` (trigger ID and workflow, or drift finding ID), `u_drift_class`, `u_source`, the subject and source fields, `u_raw_event` | The Scripted REST script |
| Owner and clock | `assignment_group`, `assigned_to`, `u_severity`, `priority`, `due_date`, `u_detected_at`, `u_awaiting_since` | The script and the business rule |
| Approval | The change or catalog record that authorized the fix, linked from the finding | Later pass |
| Executing identity | The connector or service identity on that record | Later pass |
| What ran | The workflow or artifact version on that record | Later pass |
| Result | `u_intended_state`, `u_evidence` (the re-read query, time, result hash, checker), `u_verified_at` | The re-read client |
| Closure | State Closed with `u_evidence_hash`, `close_notes` and the evidence attachment | The re-read client, allowed by the business rule |

The table extends ServiceNow's Task table, so it inherits the number, state, priority, due date, assignment and work notes. The field list is in the kit's README *(design guidance)*.

## Build 2: the re-read rule

**The rule.** A finding, or a ticket SailPoint's Service Desk integration opened, closes only when a re-read of the target shows the intended state. A person setting the state to Closed moves it to *Awaiting verification* instead. The business rule allows a close only when the same update carries a new evidence hash **and** comes from the verifier account; a named exception approver can still cancel with a close note, which is the declared-exception lane. This is Book 13's fourth clause: "a success response is not closure." It answers Gap 1, where SailPoint's Service Desk best practice treats the mapped ServiceNow status as completion.[^sp-sdim-bp]

**The re-read.** For each waiting record the client reads the subject from its system of record:

| `u_system` | Re-read | Source |
|---|---|---|
| `isc_account` | `GET /v3/accounts/{id}` | ISC Accounts API, scope `idn:accounts:read`[^sp-accounts] |
| `isc_identity` | `POST /v3/search`, `identities` index, `id:"..."` | ISC Search, scope `sp:search:read`[^sp-search] |
| `entra_user` | `GET /v1.0/users/{id}` | Microsoft Graph, `User.Read.All`[^ms-users] |

The ISC Search index list has no `accounts` index; accounts are nested on identity documents, which is why a single account is re-read through the Accounts API.[^sp-search] An ISC read reflects the last aggregation, so if the account hasn't been modified since the record started waiting, the client reports *pending* and waits for a grace period (24 hours by default) before treating it as a mismatch *(design guidance)*. A Graph read is the directory's live state.

**The evidence.** On a match the client writes the query, the check time, a SHA-256 hash of the response, the intended state, the differences (none) and the checker's identity to the record and as a JSON attachment, then closes it. On a mismatch it reopens the record with a work note listing what differs. Both clients are dry runs unless given `--apply` or `-Apply`.

## Build 3: drift reconciliation

The client joins three inputs on `employeeId`: an HR extract (CSV: `employeeId`, `status`, `department`, `managerEmployeeId`, and optional name and email), Microsoft Graph users (`employeeId`, `accountEnabled`, `department`, and the manager's `employeeId` through `$expand=manager`), and ISC identities and accounts from Search plus uncorrelated accounts from the Accounts API (`filters=uncorrelated eq true`).[^ms-users][^sp-search][^sp-accounts]

| Book 03 class | How the client computes it | Book 03 severity |
|---|---|---|
| Missing identity | Active HR record with no Entra user, or no ISC identity, with that `employeeId` | High |
| Stale access | Terminated in HR; Entra account enabled, or an ISC account not disabled (the HR source excluded) | High |
| Orphan account | Enabled member user with no or an unknown `employeeId`; enabled uncorrelated ISC account | High |
| Attribute drift | Department or manager differs from HR | Medium |
| Unauthorized write | An Entra audit "Update user" entry changing an HR-mastered property, by someone other than the provisioning service; **only** when an audit extract is supplied or fetched (`AuditLog.Read.All`)[^ms-audit] | High |
| Credential drift, schema drift | Not computed: they need the card system, Intune and the middleware's validation output | — |

Output is JSON (the findings, and which classes were and weren't computed) and CSV, with each finding's class, severity, priority, system, subject, expected and observed values, and evidence. `--push-to-servicenow` posts them to the same Scripted REST endpoint, and still writes nothing without `--apply`. In a new pipeline's first month, expect a burst of High findings; Book 03 calls that the measurement working.

## Shared client pieces

| Concern | What the clients do | Source |
|---|---|---|
| Configuration | Environment variables, or a JSON file for non-secret settings; a file carrying a secret is refused | *(design guidance)* |
| ISC token | Client credentials at `https://{tenant}.api.identitynow.com/oauth/token`; or a token from a vault. A personal access token's client ID and secret also work; client-credentials tokens carry no user context, so some APIs may return 403 | [^sp-auth] |
| ServiceNow token | `POST /oauth_token.do`, `grant_type=client_credentials`, form-encoded; or basic on a developer instance | [^sn-cc-flow][^sn-oauth-params] |
| Graph token | Client credentials with a certificate-signed assertion (`client_assertion_type` `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, PS256 with an `x5t#S256` header); a client secret only as a fallback | [^ms-cc][^ms-cert] |
| National clouds | Worldwide `graph.microsoft.com` and `login.microsoftonline.com` (also for Microsoft 365 GCC); GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us`; both US Government clouds sign in at `login.microsoftonline.us` | [^ms-deploy] |
| Paging | Graph: follow `@odata.nextLink` as an opaque URL (users: up to 999 per page); ISC Search: `searchAfter` on a sorted field (offset paging stops at 10,000); ISC lists: `limit` and `offset`; ServiceNow: `sysparm_limit` and `sysparm_offset` | [^ms-paging][^ms-users][^sp-search][^sn-table] |
| Throttling | On 429 (and 503), wait the `Retry-After` seconds or date, then retry, up to a limit | [^ms-throttle] |

## Permissions

| Script | System | Least privilege | Source |
|---|---|---|---|
| ISC workflows | ISC | `sp:workflow:manage` to create them | [^sp-wf] |
| Drift client | Microsoft Graph | `User.Read.All` (application); `AuditLog.Read.All` only for unauthorized writes | [^ms-users][^ms-audit] |
| Drift client | ISC | `sp:search:read`, `idn:accounts:read` | [^sp-search][^sp-accounts] |
| Re-read client | ISC, Graph | `idn:accounts:read`, `sp:search:read`; `User.Read.All` | [^sp-accounts][^sp-search][^ms-users] |
| Re-read client | ServiceNow | Read and write on the finding table and create on `sys_attachment`, in a custom role | [^sn-attach][^sn-table] |
| Scripted REST API | ServiceNow | `web_service_admin` to create it; a REST_Endpoint ACL with a custom role to call it | [^sn-srapi] |

Nothing in Pass 1 needs write access to Entra ID, Active Directory or ISC. Microsoft's page for reading a user's manager lists application permissions as not supported for that endpoint, while the users list supports `$expand`; whether `$expand=manager` works under an application permission in your tenant is on the verify list.[^ms-manager][^ms-users]

## How it's tested, and what must still be proven

| Test | What it covers | Result on October 24, 2026 |
|---|---|---|
| pytest, mocked HTTP | Config and secret refusal, endpoints per cloud, token requests, Retry-After, every paging style, the drift classes against fixtures, the re-read outcomes (verified, mismatch, pending, not found, skipped), the workflow file's shape and its fields against the ServiceNow script | 45 passed |
| Pester 5, mocked `Invoke-RestMethod` | The same behaviors in PowerShell, including the same finding IDs as the Python client on the same fixtures | 40 passed |
| node:test, stubbed Glide APIs | Validation, severity to priority and due date, de-duplication, closure signals, and every branch of the business rule | 13 passed |
| PSScriptAnalyzer, default rules | The PowerShell module, scripts and tests | No findings |
| `node --check`, `python -m json.tool` | Syntax of the ServiceNow scripts and the workflow JSON | Pass |

Mocks prove the logic, not the integration. To move this example past *illustrative*, run it in a ServiceNow Personal Developer Instance and a SailPoint sandbox tenant and record:

1. A native change on a test account raising one finding, with the right priority and due date, and a repeat de-duplicating.
2. A person's close turning into *Awaiting verification*, and the re-read client closing it only after the account shows the intended state, with the evidence on the record.
3. A mismatch reopening the record.
4. The drift client's findings on a synthetic HR extract matching a hand count.
5. Each item on the README's verify list resolved: chiefly the native-change trigger ID, the HTTP Request step's JSON attribute names and JSONPath handling, the ServiceNow client-credentials setup on your release, and the identity `gs.getUserName()` returns for an OAuth call.

## Planned for Pass 2

- **One approver per authority class** (gap 2): routing table and catalog variables; ServiceNow approves A0 and A1, SailPoint approves A2 and A3.
- **Change records on demand** (gap 3): a flow that raises a standard, normal or emergency change from the request item by change class.
- **One writer per attribute** (gap 4): a read-only check of SailPoint and Entra provisioning mappings that flags any attribute with two writers.
- **Evidence export:** a nightly bundle of SailPoint events and ServiceNow records in Book 13's evidence shape.
- **Optional: email intake.** An Exchange Online mail-flow rule redirects a team mailbox to the ServiceNow inbound address; an inbound email action turns structured messages ("my information is wrong", "access I don't recognize", "possible unauthorized change") into an unassigned triage record; after triage and any required approval, a ServiceNow flow calls a SailPoint workflow's external trigger (examples in PowerShell and Python). Email starts intake only: it never approves, verifies a person or closes a record (Book 15, Chapter 03).
- Further tasks added as they're defined.

## What couldn't be verified

From public documentation on October 24, 2026: the trigger ID for Native Change Account Updated (SailPoint's trigger table lists the attribute-change and provisioning triggers but not the native-change ones);[^sp-triggers] the HTTP Request step's JSON attribute names (SailPoint documents its user-interface fields);[^sp-http] whether `.$` JSONPath keys resolve inside the step's request body; the values of `provisioningResult` beyond the sample's `SUCCESS`;[^sp-prov] the API domain for an ISC FedRAMP tenant;[^sp-auth] whether `$expand=manager` works with application permissions;[^ms-manager] which ServiceNow client-credentials setup applies on a given release (the Zurich pages document the Machine Identity Console and the token request; the Xanadu page documents a system property that is false by default);[^sn-cc-config][^sn-cc-flow][^sn-cc-xanadu] and whether Workflows and Native Change Detection are available in the ISC FedRAMP environment. SailPoint's workflow and HTTP Request reference pages on the developer site returned "not found" or redirect pages; the workflow JSON shape was read from SailPoint's published OpenAPI specification instead.[^sp-wf]

## Status and review

**Draft.** The code and this page are an example implementation of a vendor-neutral design; they name products to make it concrete, and they aren't an endorsement by any agency. Corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Ticket-to-Machine on ServiceNow and SailPoint](ttm-servicenow-sailpoint.md), [Book 13, Appendix B](../books/b13-governance/appendix-b-ticket-to-machine-reference.md), [Book 03, Chapter 11 — Drift, Metrics and Evidence](../books/b03-hr-identity/11-drift-metrics-and-evidence.md), [Book 15 — Compliance Automation & Day-2 Operations](../books/b15-day2-operations/index.md), and the draft [Keeping Identity Correct After HR Becomes the Source](identity-maintenance.md).

[^sp-auth]: SailPoint Developer, "Authentication" (client-credentials token at `https://[tenant].api.identitynow.com/oauth/token`; personal access tokens and client credentials; finding the tenant's API URL through `/oauth/info`), <https://developer.sailpoint.com/docs/api/authentication>, accessed October 24, 2026.
[^sp-triggers]: SailPoint Developer, "Triggers" (Available Event Triggers table: names, IDs and types, including `idn:identity-attributes-changed` and `idn:post-provisioning`), <https://developer.sailpoint.com/docs/api/triggers>, accessed October 24, 2026.
[^sp-ncd]: SailPoint Developer, "Native Change Account Updated" event trigger (conditions, FIRE_AND_FORGET, example input), <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/native-change-account-updated>, accessed October 24, 2026.
[^sp-ncd-help]: SailPoint, "Managing Native Change Detection," <https://documentation.sailpoint.com/saas/help/sources/native_change_detection.html>, accessed October 24, 2026.
[^sp-iac]: SailPoint Developer, "Identity Attributes Changed" event trigger (example input), <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/identity-attribute-changed>, accessed October 24, 2026.
[^sp-prov]: SailPoint Developer, "Provisioning Completed" event trigger (example input, including `provisioningResult`), <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/provisioning-completed>, accessed October 24, 2026.
[^sp-wf]: SailPoint, Identity Security Cloud OpenAPI specification, v2025: create workflow (`sp:workflow:manage`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/paths/workflows/workflows.yaml>; WorkflowBody ("Workflows cannot be created in an enabled state"), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/schemas/workflows/WorkflowBody.yaml>; WorkflowTrigger and EventAttributes (`id`, `filter.$`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/schemas/workflows/trigger-attributes/EventAttributes.yaml>; and SailPoint Developer, "Create workflow" (`POST /workflows/v1`), <https://developer.sailpoint.com/docs/api/create-workflow-v-1>; all accessed October 24, 2026.
[^sp-http]: SailPoint, "Workflow Actions," section "HTTP Request" (authentication types, method, content types, sensitive headers, Retry-After handling, 90-second timeout), <https://documentation.sailpoint.com/saas/help/workflows/workflow-actions.html>, accessed October 24, 2026.
[^sp-search]: SailPoint, Identity Security Cloud OpenAPI specification, v3: perform search (`sp:search:read`; `searchAfter` to page past 10,000 records; `limit` up to 10,000), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/search-post.yaml>; search indices, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/schemas/search/Index.yaml>; identity document (nested accounts), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/schemas/search/model/identity/IdentityDocument.yaml>; accessed October 24, 2026.
[^sp-accounts]: SailPoint, Identity Security Cloud OpenAPI specification, v3: accounts list (`idn:accounts:read`; filters including `uncorrelated`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/accounts.yaml>, and account details, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/account.yaml>, accessed October 24, 2026.
[^sp-sdim-bp]: SailPoint, "SDIM: Best Practices," <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/best_practices.html> (status mapping decides when a ticket counts as closed), accessed October 24, 2026.
[^sn-srapi]: ServiceNow, "Scripted REST APIs" (Zurich API reference: URL format, authentication and REST_Endpoint ACLs, `web_service_admin`), <https://www.servicenow.com/docs/bundle/zurich-api-reference/page/integrate/custom-web-services/concept/c_CustomWebServices.html>, accessed October 24, 2026.
[^sn-resp]: ServiceNow, "RESTAPIResponse - Scoped, Global" (Zurich: `setStatus`, `setBody`, `setError`), <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/LgljFE1Jag2vsdoa0mJpCA>, accessed October 24, 2026.
[^sn-samples]: ServiceNow, "Scripted REST API example - script samples" (Zurich: `request.body.data`, `sn_ws_err.BadRequestError`, `ServiceError`), <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/3LBPBV8ftJn4eB9hZJy8Cg>, accessed October 24, 2026.
[^sn-table]: ServiceNow, "Table API" (Zurich: `/api/now/table/{tableName}`, `sysparm_query`, `sysparm_limit`, `sysparm_offset`, `sysparm_fields`, PATCH, roles), <https://www.servicenow.com/docs/bundle/zurich-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html>, accessed October 24, 2026.
[^sn-attach]: ServiceNow, "Attachment API" (Zurich: `POST /now/attachment/file` with `table_name`, `table_sys_id`, `file_name`; required roles), <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/lfpHTMPdNaq_xdajhuTwEg>, accessed October 24, 2026.
[^sn-ge]: ServiceNow, "GlideElement - Global" (Zurich: `changes()`, `changesTo()`, previous values in business rules), <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/dn_Ga0HBQ0kbXyXdUHcVKw>, and "GlideDateTime - Scoped" (`addSeconds`), <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/F2MUtxAxGDjJO4slnrcidA>, accessed October 24, 2026.
[^sn-cc-config]: ServiceNow, "Configure an OAuth Client credential grant" (Zurich, updated March 12, 2026: Machine Identity Console path), <https://www.servicenow.com/docs/r/oJu9n0q6rU~F9UHAnNCt5w/Q99KvfsMhpLEyYeY1_o_lw>, accessed October 24, 2026.
[^sn-cc-flow]: ServiceNow, "Client credentials grant workflow" (Zurich, updated October 8, 2026: `POST /oauth_token.do`, `grant_type=client_credentials`), <https://www.servicenow.com/docs/r/oJu9n0q6rU~F9UHAnNCt5w/nEdqo82hKBPEeGDqhx~hqw>, accessed October 24, 2026.
[^sn-oauth-params]: ServiceNow, "OAuth API request parameters" (Zurich: form-encoded token requests to `oauth_token.do`), <https://www.servicenow.com/docs/r/oJu9n0q6rU~F9UHAnNCt5w/S2ZOXPCm1vdGtuATo9Z8cg>, accessed October 24, 2026.
[^sn-cc-xanadu]: ServiceNow, "Client Credentials" (Xanadu: `glide.oauth.inbound.client.credential.grant_type.enabled`, false by default; OAuth Application User), <https://www.servicenow.com/docs/r/xanadu/platform-security/authentication/client-credentials.html>, accessed October 24, 2026.
[^ms-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments>, accessed October 24, 2026.
[^ms-users]: Microsoft Learn, "List users" (permissions; `$expand`, `$select`; default page 100, maximum 999), <https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0>, accessed October 24, 2026.
[^ms-manager]: Microsoft Learn, "List manager," <https://learn.microsoft.com/graph/api/user-list-manager?view=graph-rest-1.0>, accessed October 24, 2026.
[^ms-audit]: Microsoft Learn, "List directoryAudits" (`AuditLog.Read.All`; available in the US Government clouds), <https://learn.microsoft.com/graph/api/directoryaudit-list?view=graph-rest-1.0>, accessed October 24, 2026.
[^ms-cc]: Microsoft Learn, "Microsoft identity platform and the OAuth 2.0 client credentials flow," <https://learn.microsoft.com/entra/identity-platform/v2-oauth2-client-creds-grant-flow>, accessed October 24, 2026.
[^ms-cert]: Microsoft Learn, "Microsoft identity platform application authentication certificate credentials" (assertion format), <https://learn.microsoft.com/entra/identity-platform/certificate-credentials>, accessed October 24, 2026.
[^ms-paging]: Microsoft Learn, "Paging Microsoft Graph data in your app," <https://learn.microsoft.com/graph/paging>, accessed October 24, 2026.
[^ms-throttle]: Microsoft Learn, "Microsoft Graph throttling guidance," <https://learn.microsoft.com/graph/throttling>, accessed October 24, 2026.
