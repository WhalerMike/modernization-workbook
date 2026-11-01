# Verification — Chapter 07, Lifecycle Drift, Metrics and Evidence

New material; it replaces no workbook page. Code: `examples/hr-lifecycle/python/lifecycle_drift.py`, `config/drift.json`, the fixtures in `tests/fixtures/ch07` and the `test_drift_*` tests in `tests/test_credentials_separation_drift.py`; `examples/drift-pipeline/python/hr_evidence.py` and `tests/test_hr_evidence.py` (new, beside `pa_evidence.py` and `npi_evidence.py`, which are unchanged); the drift pipeline README's new section; `scripts/run_example_tests.py` (`hr-lifecycle` added to `ALSO`). No Microsoft sample is pinned: Learn publishes no sample that computes lifecycle metrics or drift classes.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: `examples/hr-lifecycle` 57 passed (this chapter's four `test_drift_*` tests among them); `examples/drift-pipeline` 142 passed (this chapter's six in `test_hr_evidence.py`). No tenant, no network.

Lab 1 was run on November 1, 2026 in a scratch copy of both kits, exactly as written; the outputs in the chapter are pasted from that run. Lab 2 was not run.

**Why this start.** The gate's facts that Microsoft owns (log retention, log routing, report availability) are carried from Book 03, Chapter 11 and the HR-driven identity guide's log, both read against Learn. The drift classes, metrics and severities are Book 03's design. The nearest working code is the program's own drift pipeline (Book 19, Chapter 09), so the chapter starts there.

Pages relied on: Book 03, Chapter 11 (drift classes, the measured lifecycle, the evidence each event leaves, control support); Book 03, Appendix C (proving HR is the sole source); the HR-driven identity implementation guide, Step 7 and its verification log; Book 19, Chapters 01, 02 and 09; the ADM implementation guide, Gate 9; `examples/validation-kit/README.md` (VK-HR-05 permissions, the exceptions file).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Drift classes, detection signals and default severities; severities are the program's | What the evidence has to show; drift classes | carried | Book 03, Chapter 11 |
| 2 | The six metrics and their definitions; choosing metrics and thresholds is the agency's CA-7 decision | Metrics | carried | Book 03, Chapter 11 |
| 3 | Audit logs 30 days with P1 or P2, 7 with Free, not retroactive; provisioning 30 days premium, 7 Free; LCW history viewable up to 30 days | What the evidence has to show; verified facts | carried | Book 03, Chapter 11 (Learn, Microsoft Entra data retention and related pages) |
| 4 | Reports and SIEM connectivity available in Azure Government | Which cloud; verified facts | carried | HR-driven identity guide log (Learn, feature availability, read November 1, 2026) |
| 5 | Graph hosts per cloud | Which cloud | carried | Book 19, Chapter 02 (Learn, national cloud deployments) |
| 6 | Users with `employeeLeaveDateTime`: `User.Read.All` and `User-LifeCycleInfo.Read.All` | Verified facts; `config/calls.json` drift-read | carried | Validation kit README, VK-HR-05 |
| 7 | Learn has no sample for lifecycle metrics or drift classes | Start with | searched-not-found (no Learn page found that computes them); restated as the reason for the start | — |
| 8 | Attribute drift is ADM Gate 9; schema drift is the middleware's output | What the evidence has to show | carried | ADM implementation guide; Book 19, Chapter 01; Book 03, Chapter 11 |
| 9 | Gate 7 requirements CA-7, AU-6, AU-11, SI-12, BOD 25-01 continuous reporting | Federal requirements | carried | HR-driven identity guide, Gate 7 table |
| 10 | Control mapping AC-2, AU-6, PS-4, PS-5, CA-7 to rules and metrics | The package, the chain and the period | restated-as-design (labeled); follows Book 03's control support table | — |
| 11 | Sole-source proof: seven days of provisioning logs against the audit log | Period; Gate 7 criteria | carried | Book 03, Appendix C; guide Step 7 |
| 12 | Thresholds in `config/drift.json`, credential drift from the card system only, immutable container, `--previous-manifest` each run | Code; Lab 2; differences | restated-as-design (labeled) | — |
| 13 | Lab 1 outputs (chapter outputs; run metrics; 14 Finding, 6 Warn; package hashes; verify; period; 57 and 142 tests) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 14 | Lab 2 behavior (export, scheduled run, container, coverage gap on a skipped day) | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide Step 7, steps 1 to 5 | What the evidence has to show; the code; Lab 2 | Step 4's sole-source proof isn't computed; the period reports it as not decided by this code |
| Guide Step 7, credential drift from card system and Intune reports | Differences paragraph | The Intune join is left to the agency's Intune report |
| Book 03, Chapter 11, attribute and schema drift | Linked, not built | Owned by ADM Gate 9 and the middleware |
| Book 03, Chapter 11, Account Discovery (orphans past the directory) | Not carried | Orphans in target applications are outside this run |
| Book 19, Chapter 09, the workflow and sign-in | Lab 2, step 4 | Reused, not repeated |
| Privileged Access, Chapter 08 and Non-Person Identity, Chapter 10 | Pattern for `hr_evidence.py` | Their modules are unchanged |
