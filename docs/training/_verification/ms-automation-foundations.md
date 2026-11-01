# Verification — Microsoft Automation, Module 1: Graph and Azure Foundations (training module)

File: `docs/training/ms-automation-foundations.md`
Example code: `examples/ms-automation/python/graphkit.py`, `examples/ms-automation/graph-calls.json` and the cloud and call functions in `examples/ms-automation/powershell/FmwGraph.psm1`
Verified: 2026-11-01 (restructure into the learning-path form, and the additions below)

Method:
- The page's existing facts were checked against Microsoft Learn and the ScubaGear baseline on 2026-10-25; their footnotes carry that date and were not changed. This log covers what the November 1 restructure added.
- New Microsoft facts were read on 2026-11-01 with the Microsoft Learn tools (`microsoft_docs_search`). Each carries a footnote "read November 1, 2026".
- Federal requirements are carried by link to Book 02, Appendix A (BOD 25-01 and the SCuBA baselines; the NIST SP 800-53 control mapping) and the federal framework crosswalk, not restated.
- Every Lab 1 command was run from `examples/ms-automation` on 2026-11-01 with Python 3.14.3, PowerShell 7.6.9 and Pester 5.5.0, and the expected output on the page is what it printed.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **not verified** (not run, or not stated as fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Azure Government's roadmap lists Workload Identities as generally available at FedRAMP High, DoD IL4 and IL5 | Unit 6, availability table | verified | m1-wigov |
| 2 | With a managed identity as an app's federated credential, the audience is `api://AzureADTokenExchange` (global service) or `api://AzureADTokenExchangeUSGov` (Entra ID for US Government) | Unit 6, availability table | verified | m1-ficaud |
| 3 | Availability rows for hosts, app registration and Graph Explorer | Unit 6 | verified (restates the page's existing, footnoted Unit 2 facts) | m1-deploy |
| 4 | Interim paths: rewrite AzureAD and MSOnline scripts on Graph PowerShell; certificate on premises, then a managed identity on Arc; a new app registration for a GCC High move | Unit 6 | design (labelled); each step's facts are footnoted | m1-aadps, m1-mgmig, m1-appinst, m1-arcmi, m1-deploy |
| 5 | BOD 25-01 requires the SCuBA assessment tools and continuous reporting; the AC-6, IA-5 and CA-7 mapping | Unit 1, federal requirement; Unit 10 | verified in Book 02, Appendix A (linked, not re-checked) | internal |
| 6 | Lab 1 commands and output: endpoints, unknown cloud, permissions for `stale-users`, undeclared call, host refusal, pattern tests (9 passed, 11 deselected), PowerShell cloud and call checks, full suites (70 passed; Pester 44 passed) | Unit 7 | verified (run 2026-11-01) | the kit, run locally |
| 7 | PowerShell `Get-FmwCloud` accepts any case (`ValidateSet`) and refuses `usgov` | Unit 7, step 6 | verified (run 2026-11-01) | the kit, run locally |
| 8 | Lab 2 steps and back-out | Unit 8 | not verified: not run by the authors; they point to Book 19, Chapter 02, Lab 2 | Book 19, Chapter 02 |
| 9 | Knowledge-check answers | Unit 9 | verified against the sections each answer links | the page |
| 10 | Unit and module times | Each unit | design (estimates) | — |

*For project use.*
