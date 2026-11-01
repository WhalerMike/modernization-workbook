# Verification — Chapter 05, The Re-read Rule

New material. Code: `clients/python/reread_verification.py` (the offline mode, `--records-json`, `--observations-json` and `--now`; the `is_checkable` guard; `offline_reader`); `tests/python/test_reread_offline.py` (new, 6 tests); `tests/fixtures/reread/` (new). The original nine re-read tests and the six business-rule tests pass unchanged. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: SailPoint, SDIM: Best Practices; ServiceNow, Table API; Attachment API; SailPoint's OpenAPI specification v3, `account.yaml` and `search-post.yaml`; Microsoft Learn, Get a user; NIST SP 800-53B Moderate profile 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The SDIM status mapping decides when ISC treats the task as complete | What exists; facts | verified | SailPoint, SDIM: Best Practices |
| 2 | Business rule behavior (redirect, verifier with evidence, exception cancel, SDIM tickets) | What exists; Lab 1, step 4 | verified by its node tests | kit code |
| 3 | The client skipped `{}` but would have verified `{"attributes": {}}` | What exists | verified by reading the pre-change code and `compare` | kit code |
| 4 | Get a user returns 404 for a missing user | Facts | verified | Learn, Get a user |
| 5 | The 24-hour grace period is design guidance | What exists | restated-as-design | implementation example |
| 6 | AC-5, CA-7, CM-3 at Moderate | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 7 | Lab 1 outputs (15 passed; six outcomes at noon; two mismatches a day later; node 6) | Lab 1 | verified by running the commands | local run |
| 8 | Lab 2 | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Kit verify list, items 10, 12 and 17 | What couldn't be verified; Lab 2, step 3 | — |
| Implementation example, Build 2 | Linked | — |
