# Verification — Chapter 03, The SailPoint Client and Its Scopes

New material. Code: the ISC and Graph rows of `config/calls.json` (Chapter 02's file); no new module. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: SailPoint Developer, Authentication; SailPoint's OpenAPI specification (`sailpoint-oss/api-specs`, `main` at commit `7f6741e95922782829ba8c2d20b4da0340cef430`, November 1, 2026): `idn/v3/paths/search-post.yaml`, `idn/v3/schemas/search/Index.yaml`, `idn/v3/paths/accounts.yaml`, `idn/v3/paths/account.yaml`, `idn/v3/parameters/limit.yaml`, `idn/v2025/paths/workflows/workflows.yaml`. Microsoft Learn, through the Learn MCP tools: Get a user; List users; List manager; List directoryAudits; Microsoft Graph national cloud deployments. FedRAMP Marketplace.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Token URL; grants; personal access tokens, up to 10; `/oauth/info` for vanity URLs | What exists; facts; Lab 2 | verified | SailPoint, Authentication |
| 2 | Client credentials: no user context; most admin APIs often 403 | Lab 2; facts | verified | same |
| 3 | The access token is a JWT; the example has a `scope` claim | Facts | verified | same |
| 4 | Search scope, user levels, `searchAfter` past 10,000 | Facts | verified | `search-post.yaml` |
| 5 | Index list; no `accounts` index | What exists; facts | verified | `Index.yaml` |
| 6 | Accounts list and get: scopes, user levels, `uncorrelated` with `eq`, limit 250 | Facts | verified | `accounts.yaml`, `account.yaml`, `limit.yaml` |
| 7 | Create workflow `sp:workflow:manage`; list read or manage | Facts | verified | `workflows.yaml` (v2025) |
| 8 | `User.Read.All` least for list and get; Get a user available in L4 and L5 | Facts | verified | Learn, List users; Get a user |
| 9 | `AuditLog.Read.All` least; L4 and L5 | Facts | verified | Learn, List directoryAudits |
| 10 | List manager: application not supported; `$expand=manager` shown | Facts | verified | Learn, List manager |
| 11 | GCC uses worldwide Graph | Facts | verified | Learn, deployments |
| 12 | A separate workflow client, removed after use | What this chapter adds | restated-as-design (labeled) | — |
| 13 | Lab 1 outputs (4 passed, 15 deselected; the listing; `manage` extra; the workflow check; the two Graph runs) | Lab 1 | verified by running the commands | local run |
| 14 | Lab 2 steps | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Kit verify list, items 6, 8, 9, 14 and 19 | What couldn't be verified; Lab 2 | — |
| Implementation example, permissions table | `config/calls.json` | — |
