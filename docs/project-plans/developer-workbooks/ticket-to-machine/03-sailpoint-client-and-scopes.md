---
title: "Chapter 03 — The SailPoint Client and Its Scopes"
description: "The SailPoint half of the kit's shared client: ISC tokens by client credentials or a personal access token, Search with searchAfter paging, the Accounts API with limit and offset, and the Microsoft Graph reads the re-read and drift clients make. Declare the ISC and Graph calls with their least-privileged scope or permission, compare an API client's granted scopes with what each task needs, and keep the workflow-creation scope off the clients that read; with labs against fixtures and a SailPoint sandbox tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-ticket-to-machine
part: How
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: c20d6570000440b54efb3f3215c19b1cd38b761560676c0ec6d2d9b99c34e7f4
last-reviewed: 2026-11-01
---
# Chapter 03 — The SailPoint Client and Its Scopes

*An identity governance API client that can read every identity is already a sensitive account. One that can also change them is a second administrator nobody named.*

::: {.callout-note}
## In this chapter
How the kit's clients authenticate to SailPoint Identity Security Cloud (ISC) and read identities and accounts, how they read Microsoft Graph, and the scopes each task needs. You add the ISC and Graph rows to [Chapter 02](02-servicenow-client-and-least-privilege.md)'s call list and use `kit_calls.py --granted` to compare an API client's scopes, or an app registration's Graph permissions, with that list. The workflow-creation scope gets its own client, because none of the kit's clients needs it. Lab 1 runs on a laptop; Lab 2 creates the API clients in a SailPoint sandbox tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can say which ISC scope and which Graph permission each kit component needs, what a client-credentials token can't do in ISC, and prove from a test and a comparison that the drift and re-read clients hold read scopes only.

**Audience.** Developers and identity engineers who own the SailPoint side, and the ISSO who approves API clients. You should read Python. You don't need a tenant until Lab 2.

## The code: `examples/servicenow-sailpoint`

### What exists

`clients/python/kit_common.py`:

- **The base URL.** `https://{tenant}.api.identitynow.com`, or `SAILPOINT_API_BASE` for any other domain. A tenant with a vanity URL finds its API details at `https://{tenant}.api.identitynow.com/oauth/info`.[^ttm03-auth]
- **The token.** `isc_headers` uses a token from a vault if one is set; otherwise the client-credentials grant at `/oauth/token`. A personal access token's client ID and secret work the same way.[^ttm03-auth]
- **Search.** `isc_search_all` posts to `/v3/search` sorted on `id` and pages with `searchAfter`, the way SailPoint documents for paging past 10,000 results.[^ttm03-search]
- **Lists.** `isc_list_all` pages `/v3/accounts` with `limit` and `offset`, 250 at a time, which is the API's default and maximum.[^ttm03-limit]
- **Graph.** `graph_headers` gets a token by client credentials with a certificate assertion (a secret only as a fallback) from the cloud's own authority, and `graph_get_all` follows `@odata.nextLink`. `GRAPH_CLOUD` is `Global` for worldwide and GCC.[^ttm03-deployments]

What each client reads is in the implementation example: the drift client reads ISC identities (accounts nested on each) and uncorrelated accounts, and Graph users and, optionally, the directory audit; the re-read client reads one account (`GET /v3/accounts/{id}`), one identity (Search, `id:"..."`) or one Graph user. ISC Search has no `accounts` index, which is why a single account is re-read through the Accounts API.[^ttm03-index]

### What this chapter adds

The ISC and Graph rows of `config/calls.json`:

| Call | Tasks | Least privilege | Source |
|---|---|---|---|
| `POST /oauth/token` (ISC) | drift, reread | An API client, or a personal access token for a least-privileged user | [^ttm03-auth] |
| `POST /v3/search` | drift, reread | `sp:search:read` | [^ttm03-search] |
| `GET /v3/accounts` | drift | `idn:accounts:read` | [^ttm03-accounts] |
| `GET /v3/accounts/{id}` | reread | `idn:accounts:read` | [^ttm03-account] |
| `POST /v2025/workflows` | workflows | `sp:workflow:manage` | [^ttm03-workflows] |
| `GET /v1.0/users` (Graph) | drift | `User.Read.All` (application) | [^ttm03-users] |
| `GET /v1.0/users/{id}` (Graph) | reread | `User.Read.All` (application) | [^ttm03-user-get] |
| `GET /v1.0/auditLogs/directoryAudits` (Graph) | drift, optional | `AuditLog.Read.All` (application) | [^ttm03-audit] |

The Accounts endpoints accept `idn:accounts:read` or `idn:accounts:manage`; the call list names the read scope, and the comparison flags `manage` as extra. Creating workflows needs `sp:workflow:manage`; no client in the kit creates them, so that scope belongs to a separate client used once, by hand or by a reviewed pipeline, and then removed (*design guidance*).

`kit_calls.py --system isc --granted "..."` compares the scopes an API client was given with what a task needs; `--system graph` does the same for an app registration's application permissions. `--required-only` leaves out optional calls, so an app registration without `AuditLog.Read.All` still passes for a drift run that doesn't read the audit.

### The tests

[Chapter 02](02-servicenow-client-and-least-privilege.md)'s `test_kit_calls.py` covers the ISC and Graph calls too: the drift client and the re-read client run against a fake session, and every request they make must match an ISC or Graph row for their task. It also asserts that no task asks ISC or Graph for a scope ending in `:manage` or `ReadWrite.All`, except workflow creation. The kit's original ISC tests in `test_kit_common.py` (token by client credentials, token from a vault, Search paging, list paging) pass unchanged.

::: {.callout-important}
## Illustrative code
The commands below run against a fake session. They show what the code asks for, not that an ISC tenant answers a client-credentials token with data rather than 403. Run Lab 2 in a sandbox tenant first.
:::

## Lab 1: fixtures, no tenant

Work in `examples/servicenow-sailpoint`, with Python 3.10 or later, `pytest` and `requests`.

1. **Run the ISC client tests:**

   ```bash
   python -m pytest tests/python/test_kit_common.py -q -k isc
   ```

   `4 passed, 15 deselected`.

2. **List what the drift client needs from ISC:**

   ```bash
   python clients/python/kit_calls.py --task drift --system isc
   ```

   ```text
   Task drift: identity_drift.py: read Graph users, the Entra audit, ISC identities and uncorrelated accounts

   isc
     POST   /oauth/token                                               API client (client credentials) or a personal access token
     POST   /v3/search                                                 sp:search:read
     GET    /v3/accounts                                               idn:accounts:read
     needs: idn:accounts:read, sp:search:read
   ```

3. **Catch a manage scope on a read client:**

   ```bash
   python clients/python/kit_calls.py --task drift --system isc --granted "sp:search:read,idn:accounts:read,idn:accounts:manage"
   ```

   `missing: none`, `extra:   idn:accounts:manage`, `Least privilege does not hold: fix the grant.`, exit 1.

4. **Keep the workflow scope on its own client.** Check the drift client's scopes against the workflow task:

   ```bash
   python clients/python/kit_calls.py --task workflows --system isc --granted "sp:search:read,idn:accounts:read"
   ```

   `missing: sp:workflow:manage`, `extra:   idn:accounts:read, sp:search:read`, exit 1: the two jobs need two clients.

5. **Check the Graph app registration,** first for a drift run that reads the audit, then for one that doesn't:

   ```bash
   python clients/python/kit_calls.py --task drift --system graph --granted "User.Read.All"
   python clients/python/kit_calls.py --task drift --system graph --required-only --granted "User.Read.All"
   ```

   The first reports `missing: AuditLog.Read.All` and exits 1; the second reports `Least privilege holds.` and exits 0.

## Lab 2: a SailPoint sandbox tenant

Not run by the authors. Use a SailPoint sandbox tenant, never production. How an agency gets one is between it and SailPoint; the public documentation doesn't say (research gaps, row 21).

1. **Find the API base.** Open `https://<tenant>.api.identitynow.com/oauth/info`, or use your vanity domain's, and set `SAILPOINT_API_BASE` if it isn't the default.[^ttm03-auth]
2. **Create two API clients.** A reader with `sp:search:read` and `idn:accounts:read`, for the drift and re-read clients; a workflow client with `sp:workflow:manage`, used only to create the three workflows. Compare each with `kit_calls.py --granted`.
3. **Try the reader.** With its token in `SAILPOINT_ACCESS_TOKEN`, run the drift client against the sandbox with `--skip-graph`. SailPoint warns that client-credentials tokens have no user context and that calling most admin APIs with one often returns 403.[^ttm03-auth] If Search or Accounts returns 403, use a personal access token for a dedicated user at the lowest user level those endpoints list (for Accounts: `ORG_ADMIN`, `SOURCE_ADMIN`, `SOURCE_SUBADMIN` or `HELPDESK`), and record which one worked.[^ttm03-account][^ttm03-search]
4. **Check the employee ID attribute.** Search one identity and find where your HR key lives (`employeeNumber` or `attributes.employeeId`); set `ISC_EMPLOYEE_ID_ATTRIBUTE` to match.
5. **Back it out.** Delete both API clients (or the personal access tokens and the dedicated user), and delete anything the drift run wrote under `out`.

## The verified facts

| Item | Value | Source |
|---|---|---|
| ISC token | `POST https://{tenant}.api.identitynow.com/oauth/token`; client credentials, authorization code and refresh token grants; personal access tokens, up to 10 per user | [^ttm03-auth] |
| Client-credentials limits | No user context (`user_id` and `identity_id` unset); most admin APIs often return 403 with such a token | [^ttm03-auth] |
| Access token | A JWT; the example payload carries a `scope` claim | [^ttm03-auth] |
| Search | `POST /v3/search`, `sp:search:read`; `searchAfter` to page past 10,000 records; user levels `ORG_ADMIN`, `CERT_ADMIN`, `REPORT_ADMIN`, `SOURCE_ADMIN`, `SOURCE_SUBADMIN`, `ROLE_ADMIN`, `ROLE_SUBADMIN` | [^ttm03-search] |
| Search indices | `accessprofiles`, `accountactivities`, `entitlements`, `events`, `identities`, `roles`, `workflowsummaries`; no `accounts` index | [^ttm03-index] |
| List accounts | `GET /v3/accounts`, `idn:accounts:read` or `idn:accounts:manage`; `uncorrelated` filter with `eq`; `limit` default and maximum 250 | [^ttm03-accounts] [^ttm03-limit] |
| Get an account | `GET /v3/accounts/{id}`, `idn:accounts:read` or `idn:accounts:manage`; user levels `ORG_ADMIN`, `SOURCE_ADMIN`, `SOURCE_SUBADMIN`, `HELPDESK` | [^ttm03-account] |
| Workflows | Create needs `sp:workflow:manage`; list accepts `sp:workflow:read` or `sp:workflow:manage` | [^ttm03-workflows] |
| Graph: list users, get a user | `User.Read.All` (application), the least privileged for both; Get a user is available in US Government L4 and L5 | [^ttm03-users] [^ttm03-user-get] |
| Graph: list directory audits | `AuditLog.Read.All` (application), least privileged; available in US Government L4 and L5 | [^ttm03-audit] |
| Graph: list manager | Application permissions not supported on `GET /users/{id}/manager`; `GET /users?$expand=manager` documented as a way to get the chain | [^ttm03-manager] |
| GCC endpoints | Microsoft 365 GCC uses `https://graph.microsoft.com`; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us` | [^ttm03-deployments] |
| SailPoint Identity Security Cloud | FedRAMP Certified, Moderate, agency path, authorized June 5, 2024 | [^ttm03-fedramp] |

### What couldn't be verified

- **The API domain of an ISC FedRAMP tenant.** The authentication page documents only `{tenant}.api.identitynow.com` and vanity domains. Kit README verify list, item 6; research gaps, row 22.
- **Whether a client-credentials token gets data from Search and Accounts.** SailPoint says most admin APIs often return 403; it doesn't list which. Verify list, item 8.
- **Whether `$expand=manager` works under an application permission.** Learn's "List manager" page says application permissions aren't supported for that endpoint and shows `$expand=manager` on the users list. Verify list, item 14.
- **Feature parity in the ISC FedRAMP environment** for Search, Workflows and the Accounts API. Ask SailPoint; verify list, item 19.

## Federal requirements and evidence

| What the output proves | Requirement it supports | Who keeps it |
|---|---|---|
| The drift and re-read clients hold read scopes only, and the workflow client holds one scope, removed after use | NIST SP 800-53 AC-6 (least privilege) and AC-2 (account management) at Moderate[^ttm03-moderate] | The `kit_calls.py --granted` output with the API client's approval |
| The Graph app registration holds `User.Read.All` and, only if the audit is read, `AuditLog.Read.All`, with a certificate | AC-6; IA-5 (authenticator management) for the certificate | The app registration's permissions and credential, reviewed with the call list |
| No component of Pass 1 can write to ISC, Entra ID or Active Directory | AC-6; Book 13's rule that the coordination layer never writes the configuration itself | The call list and its test |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A manage scope on a read client | A stolen token can change accounts | `--granted` flags `idn:accounts:manage` as extra |
| The workflow scope left on a standing client | Anyone with that token can add or change workflows that call out of SailPoint | A separate client, used once; the call list shows no client needs it |
| A personal access token for an administrator | The kit runs as `ORG_ADMIN` | A dedicated user at the lowest user level that works, recorded in Lab 2 |
| Offset paging past 10,000 search results | Results stop silently | `searchAfter` sorted on `id`; tested |
| The wrong Graph cloud | Tokens and data from the wrong cloud, or none | `GRAPH_CLOUD` has three values and refuses others; GCC is `Global` |
| A client secret for Graph | A long-lived secret in a pipeline | Certificate assertion first; the secret is a fallback |

## Checklist

- [ ] The ISC reader client holds exactly `sp:search:read` and `idn:accounts:read`.
- [ ] No standing client holds `sp:workflow:manage`; the workflow client was removed after the workflows were created.
- [ ] If a personal access token is used, its user is dedicated and at the lowest user level that works, and that level is recorded.
- [ ] The Graph app registration holds `User.Read.All`, and `AuditLog.Read.All` only if the audit is read, with a certificate credential.
- [ ] `SAILPOINT_API_BASE` is set from the tenant's own `/oauth/info`, not guessed.
- [ ] `test_kit_calls.py` passes, including the no-write-scope assertion.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 02 — The ServiceNow Client and Least Privilege](02-servicenow-client-and-least-privilege.md) · [Workbook index](index.md) · [Next: Chapter 04 — Drift to a Typed Task →](04-drift-to-a-typed-task.md)
:::

[^ttm03-auth]: SailPoint Developer, "Authentication" (token endpoint, grant types, personal access tokens, client-credentials limits, `/oauth/info`, JWT access tokens), <https://developer.sailpoint.com/docs/api/authentication> (read November 1, 2026).
[^ttm03-search]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `searchPost` (`sp:search:read`, user levels, `searchAfter`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/search-post.yaml> (read November 1, 2026, at commit `7f6741e`).
[^ttm03-index]: SailPoint, Identity Security Cloud OpenAPI specification, v3, search `Index` enumeration, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/schemas/search/Index.yaml> (read November 1, 2026).
[^ttm03-accounts]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `listAccounts` (scopes, user levels, filters), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/accounts.yaml> (read November 1, 2026).
[^ttm03-account]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `getAccount` (scopes, user levels), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/account.yaml> (read November 1, 2026).
[^ttm03-limit]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `limit` parameter (default 250, maximum 250), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/parameters/limit.yaml> (read November 1, 2026).
[^ttm03-workflows]: SailPoint, Identity Security Cloud OpenAPI specification, v2025, `createWorkflow` and `listWorkflows`, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/paths/workflows/workflows.yaml> (read November 1, 2026).
[^ttm03-users]: Microsoft Learn, "List users," permissions, <https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0> (read November 1, 2026).
[^ttm03-user-get]: Microsoft Learn, "Get a user," national cloud availability and permissions, <https://learn.microsoft.com/graph/api/user-get?view=graph-rest-1.0> (read November 1, 2026).
[^ttm03-audit]: Microsoft Learn, "List directoryAudits," national cloud availability and permissions, <https://learn.microsoft.com/graph/api/directoryaudit-list?view=graph-rest-1.0> (read November 1, 2026).
[^ttm03-manager]: Microsoft Learn, "List manager," permissions and HTTP request, <https://learn.microsoft.com/graph/api/user-list-manager?view=graph-rest-1.0> (read November 1, 2026).
[^ttm03-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," service root endpoints, <https://learn.microsoft.com/graph/deployments> (read November 1, 2026).
[^ttm03-fedramp]: FedRAMP Marketplace data, <https://www.fedramp.gov/marketplace/products.json> (last change November 1, 2026): SailPoint Identity Security Cloud, FR2001938710A (read November 1, 2026).
[^ttm03-moderate]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, release 5.2.0 OSCAL profile (includes AC-2, AC-6 and IA-5), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (read November 1, 2026).
