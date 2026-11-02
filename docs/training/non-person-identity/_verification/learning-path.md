# Verification — Learning path: Non-Person Identity in Microsoft Entra ID

Files: `docs/training/non-person-identity/index.md` and its ten modules, `01-inventory.md` to `10-drift-and-evidence.md`.
Example code: `examples/non-person-identity`, and `examples/drift-pipeline` for Module 10.
Verified: 2026-11-02

Method:
- The path adds no new facts. Every fact a module states is carried by link from the non-person identity implementation guide (`docs/books/guides/non-person-identity-implementation.md`) or the developer workbook *Building Non-Person Identity* (Chapters 01 to 10), and relies on those pages' own verification logs and footnotes. New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- Workbook Chapter 11 (the deployment runbook) wasn't on `main` when the path was written, so the path has no module for it and doesn't link it.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Every Lab 1 command in the modules was run on November 2, 2026 (Windows 11, PowerShell 7.6.9 with Pester 5.9.0, Python 3.14.3, Git Bash) in scratch copies of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, in the order the modules give them. The output was compared with the workbook chapter's Lab 1 and with the kit's real output in `data/kit-captures/npi/`. All matched. `examples/drift-pipeline`'s pytest suite was run in the repository: 142 passed. Nothing was sent to a tenant.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Lab 1 needs PowerShell 7.1 or later with Pester 5; Module 10 also needs Python 3.10 or later with pytest and PyYAML, and `sha256sum` | Path: What you need for the labs | carried | The Labs page's rows for Chapters 01 to 10, generated from each chapter's Lab 1 |
| 2 | Lab 2 needs a worldwide or GCC test tenant, never production; some add a subscription, a vault, a test domain or Workload ID Premium | Path; every module's Lab 2 | carried | Workbook Chapters 01 to 10, Lab 2 |
| 3 | The Lab 2 steps weren't run by the authors | Path; every module | carried | Workbook Chapters 01 to 10, Lab 2 |
| 4 | The workbook has no hosted sandbox | Path | design (statement about the workbook itself) | — |
| 5 | Each gate's requirements and KSIs | Every module's introduction | carried | The guide's Validate (G1) to (G6) steps, its AI agents section and its Evidence table |
| 6 | Each module's requirement table: the KSI for each control and the evidence file | Every module's introduction | carried | Workbook Chapters 01 to 10, Federal requirements and evidence |
| 7 | Each Lab 1 command's expected output, Modules 1 to 10 | Every module's Lab 1 | carried and re-run November 2, 2026; matched | Workbook Chapters 01 to 10, Lab 1; `data/kit-captures/npi/` |
| 8 | The full Pester suite passes 513 tests | Every module's last Lab 1 step | carried and re-run | `data/kit-captures/npi/01-7.txt` and the matching captures for each chapter; re-run in a full copy |
| 9 | Modules 2, 4, 8 and 9 add Chapter 01's (and, where the chapter needs it, Chapter 02's) run as step 1, so their step numbers are one ahead of the chapter's; each page says so | Modules 2, 4, 8 and 9, Lab 1 | design (module framing) | The chapters run the same command before their step 1 |
| 10 | In the orphan rule's apply run, the disables record `DisabledOn 2026-10-30` and the claim window ends `2026-11-29` | Module 2, Lab 1 | observed in the re-run; carried | Workbook Chapter 02, Lab 1; `out/orphan-apply/results.json` |
| 11 | CA001 stays `enabled` after the workload Conditional Access apply | Module 6, Lab 1 | observed in the re-run; carried (the chapter says "untouched") | Workbook Chapter 08, Lab 1 |
| 12 | Module 10's step 7 opens a second, POSIX shell at the repository root and runs `cd examples/drift-pipeline` | Module 10, Lab 1 | design (makes the folder change an exact command) | Workbook Chapter 10, Lab 1: steps 7 to 10 run in `examples/drift-pipeline` |
| 13 | Each workbook chapter has a narrated tour, linked from its module | Every module; path | carried | `docs/presentations/index.md`, Building Non-Person Identity chapter tours |
| 14 | The path's order (G4's Chapters 07 and 08 before G5's Chapters 05 and 06) and its ten modules | Path: Modules | design | The guide's gate order; the chapters' Lab 1 lengths |

## Found during the re-run

- The kit's Learn sample tests need `examples/third_party` beside `examples/non-person-identity`, and two `NpiDrift` tests read fixtures from `examples/drift-pipeline`. A learner with a full clone has both. A copy of the kit folder alone fails those tests. The pages don't need to say so, because the labs run in a clone.
- When the refusal in Chapters 04, 06 and 09 of an unapproved plan hash runs in a non-interactive `pwsh -c` session, the refusal ends that session with exit code 1. Pasted line by line, as the labs mean, the shell carries on. The chapters don't state the exit code, and the modules don't either.
- Chapter 10's Lab 1 doesn't say "Work in `examples/...`", because it uses two folders, so the generated command list names no folder. Module 10 keeps that, and adds the `cd` line to step 7.

*For project use.*
