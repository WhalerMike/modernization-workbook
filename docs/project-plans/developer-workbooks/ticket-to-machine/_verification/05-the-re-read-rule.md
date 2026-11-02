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

## Requirements and KSI pass, November 2, 2026

The federal requirements table gained a KSI column and a row for every Lab 1 and Lab 2 step and every file the kit's code writes for this chapter. Every row names the command or file that is the evidence.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | KSI IDs used: KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC, KSI-MLA-LET, KSI-IAM-JIT, KSI-SCR-MIT. Each row's KSI is an indicator whose "Related SP 800-53 Controls" include that row's control | Federal requirements table | verified: FedRAMP's Key Security Indicators page read November 2, 2026 (46 indicators; the related-controls lists match Book 13, Appendix A and Book 14, Chapter 03, read October 21, 2026). No ID is new to the repository | FedRAMP, Key Security Indicators |
| K2 | AU-12, CM-3(2), CM-4(2) and SA-11 added to the Moderate footnote's list | Federal requirements footnote | verified against the SP 800-53B Moderate OSCAL profile, release 5.2.0, read November 2, 2026; the footnote keeps its November 1 date for the controls first listed | NIST OSCAL Moderate profile |
| K3 | KSIs are FedRAMP 20x indicators for cloud providers; the agency lines its evidence up with them and doesn't report them | Sentence under the table | restated from Book 00, Appendix B | Book 00, Appendix B |
| K4 | RA-7, CA-5, AU-14 and CM-4 (base control) are cited by no indicator; rows that rest on them, on the program's tempo or on lab clean-up say "None" | Federal requirements table | verified | FedRAMP, Key Security Indicators |
