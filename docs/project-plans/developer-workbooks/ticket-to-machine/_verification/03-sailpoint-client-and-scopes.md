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
| 8 | `User.Read.All` least for list and get | Facts | verified | Learn, List users; Get a user |
| 9 | `AuditLog.Read.All` least | Facts | verified | Learn, List directoryAudits |
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

## Requirements and KSI pass, November 2, 2026

The federal requirements table gained a KSI column and a row for every Lab 1 and Lab 2 step and every file the kit's code writes for this chapter. Every row names the command or file that is the evidence.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | KSI IDs used: KSI-IAM-ELP, KSI-IAM-SNU, KSI-IAM-APM, KSI-IAM-JIT, KSI-SCR-MIT, KSI-SCR-MON, KSI-PIY-GIV. Each row's KSI is an indicator whose "Related SP 800-53 Controls" include that row's control | Federal requirements table | verified: FedRAMP's Key Security Indicators page read November 2, 2026 (46 indicators; the related-controls lists match Book 13, Appendix A and Book 14, Chapter 03, read October 21, 2026). No ID is new to the repository | FedRAMP, Key Security Indicators |
| K2 | AC-5, CA-3, CM-8, SA-9 and SA-11 added to the Moderate footnote's list | Federal requirements footnote | verified against the SP 800-53B Moderate OSCAL profile, release 5.2.0, read November 2, 2026; the footnote keeps its November 1 date for the controls first listed | NIST OSCAL Moderate profile |
| K3 | KSIs are FedRAMP 20x indicators for cloud providers; the agency lines its evidence up with them and doesn't report them | Sentence under the table | restated from Book 00, Appendix B | Book 00, Appendix B |
| K4 | RA-7, CA-5, AU-14 and CM-4 (base control) are cited by no indicator; rows that rest on them, on the program's tempo or on lab clean-up say "None" | Federal requirements table | verified | FedRAMP, Key Security Indicators |

## Source watch, November 9, 2026

Re-checked after the weekly source watch (issue #499). Checked November 9, 2026.

| Finding | Change |
|---|---|
| SailPoint OpenAPI v2025 `workflows.yaml` at commit `2a1f293` (2026-11-03): `listWorkflows` and `createWorkflow` now name user level `ORG_ADMIN`; scopes unchanged | Facts row and footnote `ttm03-workflows` add the user level (row 7) |
| FedRAMP Marketplace data: SailPoint Identity Security Cloud (FR2001938710A) still FedRAMP Certified, Class C, agency path; the data no longer gives an impact level for any listing | No effect on the facts row (Moderate is the former name of Class C) |
