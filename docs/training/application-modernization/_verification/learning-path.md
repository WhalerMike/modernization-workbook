# Verification — Learning path: Application Modernization

Files: `docs/training/application-modernization/index.md` and its seven modules, `01-the-contract-and-the-schema.md` to `07-the-evidence-pack.md`.
Example code: `examples/app-modernization`, downloaded as `app-modernization.zip`.
Verified: 2026-11-24

Method:
- The path adds no new facts. Every fact a module states is carried by link from Book 18 and the developer workbook *Building Application Modernization* (Chapters 01 to 07), and relies on those pages' own verification logs and footnotes. New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- Each module's Lab 1 steps are its chapter's Lab 1 steps, copied by script from the chapter (commands unchanged), so the chapter's captures in `data/kit-captures/am/` are their output, run on November 24, 2026 with `scripts/kit_captures.py am` (Windows 11, PowerShell 7.6, Java 21.0.10, Node.js 24.14.1).
- **Get the code** was run as printed, with the Downloads folder replaced by a scratch folder: the zip built by `scripts/build_start_kit_zip.py --kit app-modernization`, `Expand-Archive`, `Unblock-File`, and the Module 6 check, which printed `PassedCount` 26 and `FailedCount` 0. Module 3's Java lab (`./mvnw -q -pl migration test "-Dtest=LabReportsTest"`, then the truncation summary) was also run from the unzipped folder and matched the chapter's capture.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Each knowledge-check answer links the section or lab step that teaches it; the answer was checked against that text.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.
- Claim wording: the records *support* the controls; the assessor decides them. KSIs are written as indicators for cloud service providers that the agency lines its evidence up with. Only the control-to-KSI pairs in the kit's `config/requirements.json` appear.

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

## Review gate

`review-status: pending` on all eight pages. Not approved here.
