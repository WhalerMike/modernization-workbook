# Verification — Learning path: HR-Driven Identity in Microsoft Entra ID

Files: `docs/training/hr-driven-identity/index.md` and its seven modules, `01-one-writer-per-state.md` to `07-drift-and-evidence.md`.
Verified: 2026-11-01

Method:
- The path adds no new facts. Every fact a module states is carried by link from the HR-driven identity implementation guide, the developer workbook *Building HR-Driven Identity* (Chapters 01 to 07), Book 03, Book 07, Book 19, the ADM implementation guide or `examples/hr-lifecycle/README.md`, and relies on those pages' own verification logs. New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Every Lab 1 command in the modules was run on November 1, 2026 (Windows 11, Python 3.14.3 with pytest, Git Bash) in a scratch copy of `examples/hr-lifecycle`, `examples/hcm-entra` and `examples/drift-pipeline`, and its output compared with the workbook chapter's Lab 1. All matched. `examples/drift-pipeline`'s suite was run in the repository: 142 passed. Nothing was sent to a tenant.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Lab 1 needs Python 3.10 or later and the standard library; the test step needs pytest | Path: What you need for the labs | carried | `examples/hr-lifecycle/README.md`; each chapter's Lab 1 runs `python -m pytest` |
| 2 | Lab 2 needs a worldwide or GCC test tenant, never production, and ID Governance trial or test licenses where workflows, entitlement management or reviews are used | Path; Modules 3, 4 | carried | Workbook Chapters 01 to 07, Lab 2 |
| 3 | The Lab 2 steps weren't run by the authors | Path; every module | carried | Workbook Chapters 01 to 07, Lab 2 |
| 4 | The workbook has no hosted sandbox | Path | design (statement about the workbook itself) | — |
| 5 | Each gate's federal requirements | Every module's introduction | carried | The guide's Gate 1 to 7 requirements tables; workbook chapters' Federal requirements and evidence |
| 6 | Each Lab 1 command's expected output | Every module's Lab 1 | carried and re-run | Workbook Chapters 01 to 07, Lab 1; re-run November 1, 2026 |
| 7 | A tool refuses to write into an output folder that already holds a `manifest.json` | Module 7, Lab 1 step 1; Module 6, Lab 1 step 5 | observed in the re-run; carried | Chapter 01's output-folder row (`test_output_is_written_once_with_a_hash_per_file`); re-run November 1, 2026 |
| 8 | The deck series for the guide is planned | Path | carried | Workbook index, pieces table |

## Found during the re-run

- Workbook Chapter 06's Lab 1 says to keep `out/ch06` for Chapter 07, but Chapter 07's Lab 1, step 1 writes `out/ch06` again, and the tool refuses a folder that already holds a manifest (`error: out\ch06 already holds a manifest.json; write each run to a new folder`). The modules tell the learner to delete `out` first. The workbook chapters weren't changed.
- `contractor_source.py extract` exits 2 on the fixture (Chapter 02 doesn't state its exit code), and `joiner_workflows.py plan` exits 2 on a run with one Warn and no Finding (Chapter 03 doesn't state it). The modules don't state either code.
