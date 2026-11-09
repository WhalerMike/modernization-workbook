# Verification — Chapter 01, The Notice Record and Azure Service Health

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `schema/notice.schema.json`, `New-PnNotice`, `Test-PnNotice`, `Get-PnNoticeFingerprint`, `Get-PnAzureQuery`, `ConvertTo-PnAzureNotice`, `deploy/New-PnAlertPolicy.ps1`. No code changed for this chapter. Provider facts are the guide's, read on Microsoft Learn through the Microsoft Learn documentation service on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`, rows 1 to 11); this chapter re-reads none of them and cites the same pages. New facts read on November 9, 2026 with the Microsoft Learn MCP tools: Service Health alerts are activity log alerts; `az monitor activity-log alert list --resource-group`; `az policy remediation show --name`.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is `data/kit-captures/pn/01-*.txt` and the images `captures/01-*.png`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Learn's Resource Graph samples: all active events, health advisories, retirements (`EventSubType` `Retirement`), planned maintenance; Azure Government portal links | Start with; Verified facts | carried (guide row 1–3) | `pn01-arg-samples` |
| 2 | Impacted-resources query | Start with; Verified facts | carried (guide row 5) | `pn01-arg-impacted` |
| 3 | Reader on a subscription views its Service Health events | Start with; Verified facts | carried (guide row 6) | `pn01-sub-tenant` |
| 4 | Security advisories' sensitive fields need Service Health Security Reader; Reader and Monitoring Reader can't | Start with; Dangers | carried (guide row 7) | `pn01-sec-elevated` |
| 5 | Built-in policy `98903777-…`; MG or subscription scope; remediation; default resources; hand edits overwritten | Start with; The alert policy; Lab 2 step 5 | carried (guide row 8) | `pn01-policy` |
| 6 | `--mi-system-assigned`, `--location`, `--role`, `--identity-scope`; roles granted automatically only through the portal; `az policy remediation create`/`show` | The alert policy; Lab 2 | carried (guide row 9); `show` read Nov 9 | `pn01-remediate` |
| 7 | Service Health alerts are activity log alerts; `az monitor activity-log alert list --resource-group` | Lab 2 step 5; Verified facts | verified Nov 9 (Learn: "Resource Health alerts and Service Health alerts are activity log alerts", repeated on several "Monitor <service>" pages; CLI reference) | `pn01-alert-types` |
| 8 | `az cloud set --name AzureUSGovernment`; `management.usgovcloudapi.net` | Verified facts | carried (guide row 10) | `pn01-gov-cli` |
| 9 | The record's fields, fingerprint and validation | The code | read in the kit's source and tests | kit |
| 10 | Kind mapping and the action rule for Azure | The code | read in `ConvertTo-PnAzureNotice` | kit |
| 11 | Lab 1 outputs (permissions, query, 5 notices from 6 rows, the table, the retirement record, 0 changed fingerprints, the plan and its SHA-256, the fixture-mode refusal, 26 tests passed) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/01-*.txt` |
| 12 | Lab 2 behavior (counts agree; empty summary without the elevated role; remediation creates the alert rule; rollback removes the assignment) | Lab 2 | not run against a subscription | — |

## Not yet specified (carried from the guide)

N1 column schema and `LastUpdateTime` format; N2 redaction in Resource Graph; N3 explicit Azure Government statement; N4 `az graph query` output keys; N5 the policy's parameter names (the alert resource type is now partly answered: Learn says Service Health alerts are activity log alerts; the policy page still doesn't name the type it creates).

## Federal requirements and evidence

Six rows, each a Lab step or a file the kit writes. Controls and KSIs are the pairs in `config/requirements.json` (the guide's rows 33–38); no new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide, G1 (steps, requirements, government cloud, interim path, rollback) | Start with; Labs; Verified facts; Federal requirements | The interim path (Learn's query by hand) is Lab 2 step 3's cross-check |
| Guide, track at a glance (kinds) | The record | — |

## Review gate

`review-status: pending`. Not approved here.
