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
