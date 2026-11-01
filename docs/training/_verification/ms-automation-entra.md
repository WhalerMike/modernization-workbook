# Verification — Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph (training module)

File: `docs/training/ms-automation-entra.md`
Example code: `examples/ms-automation/python/entra_tasks.py`, the Entra ID functions in `examples/ms-automation/powershell/FmwGraph.psm1`, and `examples/ms-automation/tests/fixtures/` (`users.json`, `ca.json`, `pim.json`, `apps.json`, `mfa.json`)
Verified: 2026-11-01 (restructure into the learning-path form, and the additions below)

Method:
- The page's existing facts were checked against Microsoft Learn and the ScubaGear baseline on 2026-10-25; their footnotes carry that date and were not changed. This log covers what the November 1 restructure added.
- New Microsoft facts were read on 2026-11-01 with the Microsoft Learn tools (`microsoft_docs_search`). Each carries a footnote "read November 1, 2026".
- Which ScubaGear policies BOD 25-01 makes mandatory, and the NIST SP 800-53 mapping, are carried by link to Book 02, Appendix A, not restated.
- Every Lab 1 command was run from `examples/ms-automation` on 2026-11-01 with Python 3.14.3, PowerShell 7.6.9 and Pester 5.5.0, and the expected output on the page is what it printed.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **not verified** (not run, or not stated as fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Trusted IPs isn't supported in Azure Government; use Conditional Access policies with named locations | Unit 6 | verified | m2-trustedips |
| 2 | So in GCC High or DoD, the named locations `ca-export` writes are where network-based MFA exceptions live | Unit 6 | inference from claim 1 and the page's named-locations read | m2-trustedips, m2-nlist |
| 3 | MS.AAD.1.1v1, 2.1v1, 2.3v1, 3.1v1, 3.6v1, 7.1v1 and 7.4v1 are BOD 25-01 mandatory policies | Unit 1, federal requirement | verified in Book 02, Appendix A (linked, not re-checked) | internal |
| 4 | Interim paths: schedule `mfa-registration`; move permanent assignments to eligible; replace secrets; route logs first | Unit 6 | design (labelled) | — |
| 5 | Lab 1 commands and output for the five checks in Python, two in PowerShell, and the Entra tests (20 passed) | Unit 8 | verified (run 2026-11-01) | the kit, run locally |
| 6 | `pim-report --role` adds to Global Administrator, which is always included | Unit 8, step 3 | verified (code: `action="append"` with Global Administrator as the default; run output) | `python/entra_tasks.py` |
| 7 | `stale-users` uses the later of the interactive and non-interactive dates, and skips disabled accounts, guests and accounts younger than the window | Unit 8, step 1 | verified (code and fixture) | `python/entra_tasks.py`, `tests/fixtures/users.json` |
| 8 | `mfa-registration` counts members only | Unit 8, step 5 | verified (code) | `python/entra_tasks.py` |
| 9 | Lab 2 permission lists per check | Unit 9 | verified (`permissions_for(load_calls(task))`, run 2026-11-01) | `graph-calls.json` |
| 10 | Lab 2 steps and back-out | Unit 9 | not verified: not run by the authors | — |
| 11 | Knowledge-check answers | Unit 10 | verified against the sections each answer links | the page |
| 12 | Unit and module times | Each unit | design (estimates) | — |

*For project use.*
