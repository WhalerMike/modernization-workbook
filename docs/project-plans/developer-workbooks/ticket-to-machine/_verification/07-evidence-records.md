# Verification — Chapter 07, Evidence Records for Book 13 and the ISSO

New material. Code: `clients/python/evidence_export.py` (new); `tests/python/test_evidence_export.py` (new, 8 tests); `tests/fixtures/evidence/closed_records.json` (new, generated with the kit's own `canonical_json` and `sha256_hex`, then one record's evidence edited on purpose); the `sn-table-list-evidence` row in `config/calls.json`. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: ServiceNow, Table API; SailPoint's OpenAPI specification v3, `Index.yaml`; FedRAMP Marketplace; NIST SP 800-53B Moderate profile 5.2.0 (AU-9, CA-7 and CM-3 are in it; AU-10 and CM-5(1) aren't).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Book 13's evidence record fields | What this chapter adds | carried forward | Book 13, Appendix B |
| 2 | The evidence export is a Pass 2 item | In this chapter | verified | implementation example, Planned for Pass 2 |
| 3 | Window adherence as closures inside the window over closures judged | What this chapter adds | carried forward | Book 13, Chapter 10; Book 12, Chapter 12 |
| 4 | Lab 1 outputs, including both chain heads and the tamper report | Lab 1 | verified by running the commands | local run |
| 5 | AU-10 and CM-5(1) aren't in the Moderate baseline | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 6 | The hash chain is design guidance, as in the other developer workbooks | Facts | restated-as-design | Building Privileged Access, Chapter 08 |
| 7 | Lab 2 | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Implementation example, evidence export (Pass 2) | The ServiceNow half is built | The SailPoint events half waits: event retention is unverified (example guide); research gaps, row 62 |
| Example guide, event retention unverified | What couldn't be verified | — |

## Requirements and KSI pass, November 2, 2026

The federal requirements table gained a KSI column and a row for every Lab 1 and Lab 2 step and every file the kit's code writes for this chapter. Every row names the command or file that is the evidence.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | KSI IDs used: KSI-CMT-LMC, KSI-MLA-EVC, KSI-MLA-OSM, KSI-SCR-MIT, KSI-IAM-ELP, KSI-IAM-JIT, KSI-IAM-SNU. Each row's KSI is an indicator whose "Related SP 800-53 Controls" include that row's control | Federal requirements table | verified: FedRAMP's Key Security Indicators page read November 2, 2026 (46 indicators; the related-controls lists match Book 13, Appendix A and Book 14, Chapter 03, read October 21, 2026). No ID is new to the repository | FedRAMP, Key Security Indicators |
| K2 | AC-2, AC-5, AC-6 and SA-11 added to the Moderate footnote's list | Federal requirements footnote | verified against the SP 800-53B Moderate OSCAL profile, release 5.2.0, read November 2, 2026; the footnote keeps its November 1 date for the controls first listed | NIST OSCAL Moderate profile |
| K3 | KSIs are FedRAMP 20x indicators for cloud providers; the agency lines its evidence up with them and doesn't report them | Sentence under the table | restated from Book 00, Appendix B | Book 00, Appendix B |
| K4 | RA-7, CA-5, AU-14 and CM-4 (base control) are cited by no indicator; rows that rest on them, on the program's tempo or on lab clean-up say "None" | Federal requirements table | verified | FedRAMP, Key Security Indicators |
