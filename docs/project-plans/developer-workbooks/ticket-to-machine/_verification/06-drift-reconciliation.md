# Verification — Chapter 06, Drift Reconciliation

New material. Code: `clients/python/drift_compare.py` (new); `tests/python/test_drift_compare.py` (new, 4 tests); `tests/fixtures/hr_extract_day2.csv` and `tests/fixtures/config.fixtures.json` (new); `identity_drift.py` now creates its output folders. The original 13 drift tests and the finding IDs shared with the PowerShell client pass unchanged. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: Microsoft Learn, List users; List manager; List directoryAudits; national cloud deployments; SailPoint's OpenAPI specification v3, `search-post.yaml`, `accounts.yaml` and `limit.yaml`; NIST SP 800-53B Moderate profile 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Drift classes and severities | What exists | carried forward from Book 03, Chapter 11 and the implementation example | Book 03 |
| 2 | Finding IDs are stable and shared with PowerShell | What exists | verified by the kit's tests | `expected_finding_ids.json` |
| 3 | The day-two story: 1 new, 11 persisting, 1 resolved | Lab 1 | verified by running the commands | local run |
| 4 | The refusal on different computed classes, exit 2 | Lab 1 | verified | local run |
| 5 | A first-month burst is expected | Illustrative callout | carried forward from the implementation example and Book 03 | — |
| 6 | Graph and ISC facts | Facts | verified | as listed |
| 7 | AC-2, CA-7, SI-4 at Moderate | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 8 | Lab 2 | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Implementation example, Build 3 and proof step 4 | Linked; Lab 2, step 3 | — |
| Kit verify list, items 9, 14 and 15 | What couldn't be verified | — |
