# Verification — Learning path: Ticket-to-Machine on ServiceNow and SailPoint

Files: `docs/training/ticket-to-machine/index.md` and the seven module pages beside it
Example code: `examples/servicenow-sailpoint`
Verified: 2026-11-01

Method:
- The path adds no factual claims of its own. Every fact a module states is on a page it links: the example guide `docs/books/guides/ttm-servicenow-sailpoint.md`, the developer workbook `docs/project-plans/developer-workbooks/ticket-to-machine/`, the implementation example `docs/books/guides/snow-sailpoint-integration-kit.md`, and Book 13, Chapter 10 and Appendix B. Those pages' own verification logs carry the sources.
- Each knowledge-check answer was checked against the section its answer links.
- Every Lab 1 command was run from `examples/servicenow-sailpoint` on 2026-11-01 with Python 3.14.3 and Node.js 24.14.1, in the order the modules give them, and the expected output on each page is what the command printed.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Lab 1 commands and expected output, Modules 1 to 7 | Each module, Unit "Exercise: Lab 1" | verified (re-run 2026-11-01) | The kit, run locally |
| 2 | The re-read client doesn't create the folder for `--out-json`; Module 6, step 3 makes `out` first | Module 6, Lab 1, step 3 | verified (re-run 2026-11-01: without the folder, the command raised `FileNotFoundError` after printing its results) | `clients/python/reread_verification.py` |
| 3 | Lab 2 steps, prerequisites and back-out | Each module, Unit "Exercise: Lab 2" | not verified: not run by the authors, as the workbook marks them | The workbook chapter's Lab 2 |
| 4 | Unit and path times | Each module; the path index | design (estimates) | — |

*For project use.*
