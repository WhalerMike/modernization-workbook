# Verification — Learning path: Privileged Access in Microsoft Entra ID and Azure

Files: `docs/training/privileged-access/index.md` and its eight modules, `01-privileged-inventory.md` to `08-evidence-and-drift.md`.
Example code: `examples/privileged-access`, and `examples/drift-pipeline` for Module 8.
Verified: 2026-11-02

Method:
- The path adds no new facts. Every fact a module states is carried by link from the developer workbook *Building Privileged Access* (`docs/project-plans/developer-workbooks/privileged-access/`, Chapters 01 to 08), the project plan `docs/project-plans/privileged-access.md`, Book 04 (the sections the chapters cite), or the kit's own output, and relies on those pages' verification logs (`docs/project-plans/developer-workbooks/privileged-access/_verification/`). New writing is limited to the path, the module framing, objectives, unit glue, the lockout boxes (which restate the chapters' guards), knowledge-check questions and time estimates.
- No external source was read for this path, and no fact was added beyond what the workbook, the plan and Book 04 already footnote. The modules don't cite FedRAMP's KSI page or any Learn page directly; they carry the chapters' KSI pairs and Learn facts by link.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Every Lab 1 command was run on November 2, 2026 (Windows 11, PowerShell 7.6.9 with Pester 5.9.0, Python 3.14.3 with pytest, Git Bash) in a scratch copy of `examples/privileged-access`, `examples/third_party` and `examples/drift-pipeline`, in the order the modules give them, and its output compared with the kit captures in `data/kit-captures/pa/`. All matched. The expected output on each page is the capture's text. The full Pester suite passed 330; `examples/drift-pipeline`'s pytest suite was run in the repository: 142 passed. Nothing was sent to a tenant.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Lab 1 commands and expected output, Modules 1 to 8 | Each module, "Exercise: Lab 1" | carried and re-run (2026-11-02) | Workbook Chapters 01 to 08, Lab 1; `data/kit-captures/pa/01-1.txt` to `08-14.txt` |
| 2 | Lab 1 needs PowerShell 7.1 or later with Pester 5; Module 8 also Python 3.10 or later with pytest and PyYAML, and `sha256sum` | Path: What you need for the labs; Module 8 | carried | Each chapter's Lab 1 opening paragraph |
| 3 | Later steps in a lab use the module or variables an earlier step loaded (Module 3 step 6 uses `$repo` from step 4; Module 4 uses `$lab` from step 3) | Path; Modules 3, 4, 8 | observed in the re-run | The chapters' Lab 1 commands |
| 4 | The emergency access lockout: approval switched on before the emergency accounts exist locks the agency out; Learn's case of every Global Administrator and Privileged Role Administrator eligible, approval required, no approvers | Path callout; Modules 2 and 4 | carried | Project plan, Critical path; Chapter 02, Why this comes first; Chapter 04, The context the code depends on |
| 5 | The guard each module has against locking people out (PA-EA-01 to 10, PA-CA-01 and the `-Apply` refusal, PA-PIM-01 and 02, `-ActivationGateChecked`, PA-PG-G1, G4 and G6, eligible-first in Azure, PA-AZ-05, PA-AR-06 and E08, Tier 0 incidents in Module 8) | Path callout; each module's lockout box | carried | Chapters 02 to 08, their check and guard tables |
| 6 | Each module's plan phase and tasks | Path module table; each module's header | carried | Workbook index, chapter table ("Plan phase"); project plan, Work breakdown |
| 7 | Each module's requirement table: the control, the KSI and the evidence file | Every module's introduction | carried (a subset of each chapter's rows; no new control, KSI or pairing) | Workbook Chapters 01 to 08, Federal requirements and evidence |
| 8 | KSIs are FedRAMP 20x indicators for providers; the agency doesn't report them | Every module | carried | Workbook chapters' KSI note; Book 00, Appendix B |
| 9 | Lab 2's environment, licenses, permissions and back-out for each module | Each module, "Exercise: Lab 2" | carried; not run | Workbook Chapters 01 to 08, Lab 2 |
| 10 | The workbook's code hasn't been run against a production tenant | Path | carried | Workbook index, status callout |
| 11 | The path was written before the implementation guide; its modules match the guide's gates one for one | Path | design (updated 2026-11-02 when `docs/books/guides/privileged-access-implementation.md` was added: gates G1 to G8 cover the same chapters 01 to 08 as Modules 1 to 8) | — |
| 12 | Eight modules, one per chapter, and why none were merged | Path, "Why eight modules" | design | — |
| 13 | Module and path times | Every module; the path | design (estimates) | — |
| 14 | Narrated decks for the modules are planned | Path | design (the owner's plan; decks come in a separate step) | — |

## Found during the re-run

- Module 8, step 3: on this run, `Invoke-PaEvidenceRun.ps1` printed the output folder as a full Windows path (`Written to C:\...\out\runs\...`), where the capture and the chapter show `out/runs/...` and `<path>/out/runs/...`. The module shows the capture's text and says the line may print the full path.
- Module 8, step 10: on Windows, `pa_evidence.py verify` printed the folder with backslashes (`out\evidence\...`); the capture shows forward slashes. The module shows the capture's text.
- Module 8, step 11: `python -m pytest tests -q` in `examples/drift-pipeline` needs the whole repository. In a scratch copy without `examples/hr-lifecycle`, collection fails on `tests/test_hr_evidence.py` (`No module named 'contractor_source'`). In the repository, 142 passed. The path asks for a copy of the repository.
- Module 8, step 5 adds `cd ../drift-pipeline` before the chapter's commands, so the POSIX steps run from the folder the lab's command list starts in. The chapter says "In `examples/drift-pipeline`" without a command.
- Module 1 and the other modules merge the chapter's last step (`Invoke-Pester -Path tests`) with the cleanup (`Remove-Item -Recurse -Force out`) into one step. Same commands, same order.
- Workbook Chapter 09 (deployment) isn't on `main` on 2026-11-02, so the path doesn't link it.

## Not sourced

Nothing. Where a fact in a draft couldn't be traced to the workbook, the plan or Book 04, it was cut: a distractor naming a Graph permission that none of the sources mention was replaced with one Chapter 04 names.

*For project use.*
