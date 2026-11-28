# Verification — Learning path: Application Modernization

Files: `docs/training/application-modernization/index.md` and its eight modules, `01-the-contract-and-the-schema.md` to `08-shutting-down-a-retired-application.md`.
Example code: `examples/app-modernization`, downloaded as `app-modernization.zip`; for Module 8, `examples/app-retirement`, downloaded as `app-retirement.zip`.
Verified: 2026-11-24; Module 8 added 2026-11-27

Method:
- The path adds no new facts. Every fact a module states is carried by link from Book 18 and the developer workbook *Building Application Modernization* (Chapters 01 to 07), and relies on those pages' own verification logs and footnotes. New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- Each module's Lab 1 steps are its chapter's Lab 1 steps, copied by script from the chapter (commands unchanged), so the chapter's captures in `data/kit-captures/am/` are their output, run on November 24, 2026 with `scripts/kit_captures.py am` (Windows 11, PowerShell 7.6, Java 21.0.10, Node.js 24.14.1).
- **Get the code** was run as printed, with the Downloads folder replaced by a scratch folder: the zip built by `scripts/build_start_kit_zip.py --kit app-modernization`, `Expand-Archive`, `Unblock-File`, and the Module 6 check, which printed `PassedCount` 26 and `FailedCount` 0. Module 3's Java lab (`./mvnw -q -pl migration test "-Dtest=LabReportsTest"`, then the truncation summary) was also run from the unzipped folder and matched the chapter's capture.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Each knowledge-check answer links the section or lab step that teaches it; the answer was checked against that text.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.
- Claim wording: the records *support* the controls; the assessor decides them. KSIs are written as indicators for cloud service providers that the agency lines its evidence up with. Only the control-to-KSI pairs in the kit's `config/requirements.json` appear.

## Module 8 (November 27, 2026)

- Carried from workbook Chapter 08 and its log (`_verification/08-shutting-down-a-retired-application.md`): every fact, the requirement and KSI table (the kit's `config/requirements.json`, with KSI-CMT-LMC listed but not paired with a control, as the chapter holds it), and the Lab 2 pointer, not run.
- Lab 1's steps 1, 2, 6, 7 and 8 were run as printed from the zip built by `scripts/build_start_kit_zip.py --kit app-retirement` (flat, no top-level folder), unzipped into a scratch folder with `Expand-Archive` and `Unblock-File`, with `$Run` in a scratch folder: the plan, the findings, the manifest's matches, the edit found, and 15 Pester tests passing, matching `data/kit-captures/am/08-*.txt` apart from the run folder in `OutputPath`. Steps 3 to 5 show the chapter's captured output (`08-3` to `08-5`), whose commands differ only in the results folder.
- The expected output of steps 1 and 4 shows `OutputPath` with the reader's run folder as `<run>`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | What each lab needs (Java 21, Node.js 24, PowerShell 7.4 or later, Pester 5) | Path; each module | carried | Workbook Chapters 01 to 07, Lab 1 |
| 2 | Each Lab 2's environment, never production, and its back-out; not run by the authors | Every module | carried | Workbook Chapters 01 to 07, Lab 2 |
| 3 | Each module's requirement and KSI table | Every module's introduction | carried | Each chapter's Federal requirements and evidence; `config/requirements.json` |
| 4 | The zip's folder, `Downloads\app-modernization\app-modernization` | Get the code | verified by building and unzipping the zip | `scripts/build_start_kit_zip.py` |
| 5 | The check prints `PassedCount` 26, `FailedCount` 0 | Get the code | verified by running it from the unzipped zip | `data/kit-captures/am/06-10.txt` |
| 6 | Revised 508 Standards' alteration; automated testing can't decide conformance | Module 5 | carried | Workbook Chapter 05; Book 18, Chapter 06 |
| 7 | AADSTS50105 for an unassigned user; test with the affected identity | Modules 6 and 7 | carried | Workbook Chapter 06; Book 18, Appendix A |
| 8 | The six gates, the plan, the manifest, PowerShell 7.1 or later and Pester 5 | Module 8; path | carried | Workbook Chapter 08; Book 18, Appendix B; the kit's README |

## Review gate

`review-status: pending` on Module 8. The other pages carry the owner's approval of November 25; this change edits the path index and Module 7's Next line, so both return to review. Not approved here.
