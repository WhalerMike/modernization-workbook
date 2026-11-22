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
| 2 | The re-read client creates the folder for `--out-json` itself; Module 6, step 3 needs no separate step to make `out` | Module 6, Lab 1, step 3 | verified (re-run 2026-11-02: in a fresh copy of the kit, the command wrote `out/reread.json` with no `out` folder present beforehand) | `clients/python/reread_verification.py` |
| 3 | Lab 2 steps, prerequisites and back-out | Each module, Unit "Exercise: Lab 2" | not verified: not run by the authors, as the workbook marks them | The workbook chapter's Lab 2 |
| 4 | Unit and path times | Each module; the path index | design (estimates) | — |

*For project use.*

## Decision of Nov 8, 2026

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| 5 | The link text "change classes and their lanes" now reads "operation classes and their lanes", matching Book 13 Appendix B; the anchor is unchanged | Module 3, resources list | wording only, no source change | Book 13 Appendix B |

## Figures, November 22, 2026

Each figure is reused from the page named in its caption and carries that page's own verification; the caption restates what the figure shows, and was checked against this module's text.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 6 | Figure `b13-governance/ttm-snow-sailpoint` (reused): the loop on ServiceNow and SailPoint, closed by the re-read | Module 1, Unit 2 | carried | The ServiceNow and SailPoint guide and its log |
| 7 | Figure `b03-hr-identity/ch07-attribute-ownership-chain` (reused): one writer, consumers read, corrections upstream | Module 3, Unit 2 | carried | Book 03, Chapter 07 and its log |
| 8 | Figure `b13-governance/ch02-drift-sources` (reused): five drift sources, silent until a scheduled comparison | Module 4, Unit 2 | carried | Book 13, Chapter 02 and its log |
| 9 | Figure `b13-governance/ch10-ticket-to-machine` (reused): ticket to a human against ticket to a machine; re-read verifies | Module 6, Unit 2 | carried | Book 13, Chapter 10 and its log |
| 10 | Figure `b13-governance/ch10-tempo-paths` (reused): severity window, approver by class ceiling, one closure record | Module 7, Unit 2 | carried | Book 13, Chapter 10 and its log |
| 11 | Figure `guides/snow-sailpoint-kit-pipeline` (reused): three workflows, one front door, close on the re-read | Module 5, Unit 2 | carried | The ServiceNow and SailPoint kit guide and its log |
