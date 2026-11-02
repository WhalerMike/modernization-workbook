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

## Requirements and KSI pass, November 2, 2026

The federal requirements table gained a KSI column and a row for every Lab 1 and Lab 2 step and every file the kit's code writes for this chapter. Every row names the command or file that is the evidence.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | KSI IDs used: KSI-IAM-SUS, KSI-IAM-AAM, KSI-IAM-ELP, KSI-IAM-SNU, KSI-MLA-EVC, KSI-MLA-RVL, KSI-SCR-MIT, KSI-CMT-LMC. Each row's KSI is an indicator whose "Related SP 800-53 Controls" include that row's control | Federal requirements table | verified: FedRAMP's Key Security Indicators page read November 2, 2026 (46 indicators; the related-controls lists match Book 13, Appendix A and Book 14, Chapter 03, read October 21, 2026). No ID is new to the repository | FedRAMP, Key Security Indicators |
| K2 | AC-2(3), AC-6, CM-3 and SA-11 added to the Moderate footnote's list | Federal requirements footnote | verified against the SP 800-53B Moderate OSCAL profile, release 5.2.0, read November 2, 2026; the footnote keeps its November 1 date for the controls first listed | NIST OSCAL Moderate profile |
| K3 | KSIs are FedRAMP 20x indicators for cloud providers; the agency lines its evidence up with them and doesn't report them | Sentence under the table | restated from Book 00, Appendix B | Book 00, Appendix B |
| K4 | RA-7, CA-5, AU-14 and CM-4 (base control) are cited by no indicator; rows that rest on them, on the program's tempo or on lab clean-up say "None" | Federal requirements table | verified | FedRAMP, Key Security Indicators |
