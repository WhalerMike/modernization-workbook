# Data Platform and SQL Server Identity learning path, Module 7: The Application Chain

**Deck name: Training_DP_Module_7.** The narrated deck for [Module 7: The Application Chain](../../docs/training/data-platform/07-the-application-chain.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the module page's own Lab 1 commands and expected output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the engine is only half the chain; learning objectives and prerequisites |
| Concepts | The database axis and the column the scan sets (A, B, C, done, review; column D only by the owner); what Microsoft gives you: the Entra modes by driver family and release, the deprecated password mode, the Arc token rule; the connection-string change and the three gates in front of it; the chapter's dangers and the guard against each |
| Lab | Try it: Lab 1 steps 1 to 7, the connection scan on the kit's four fictional applications: the scan, the masked strings, a deprecated password-mode string, the driver table, the manifest, the tests and the run list; Lab 2, one column-A test application changed behind the three gates (not run by the authors) |
| Check and summary | The federal requirement (IA-5 and CM-6, with KSI-IAM-SNU and KSI-SVC-ACM) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_DP_Module_7.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_DP_Module_7_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_7_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_DP_Module_7/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-7/build.js presentations/training-dp-module-7/Training_DP_Module_7.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP) or by its title (*Data Platform: SQL Server Identity*, *Building SQL Server Identity*), and spells out the acronyms the voice would misread (O D B C, O L E D B, J D B C, I I S, M F A, K S I, I S S O, I A five, C M six, U T C). Every fact on a slide comes from the module page, workbook [Chapter 07](../../docs/project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md), the Book 06 chapters it links ([Chapter 18](../../docs/books/b06-data-platform/18-the-four-class-pattern-for-applications.md) and [Chapter 19](../../docs/books/b06-data-platform/19-connection-string-migration.md)) and [Runbook R08](../../docs/books/b06-data-platform/r08-application-chain-and-connection-strings.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`Invoke-SqlConnectionScan.ps1`, `config/drivers.json`, `tests/fixtures/apps`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut and long `C:/FMWLabs/results/...` paths shortened to `$Run`, as the slides say. The scan's target is advice, not a change, and it never sets column D; Lab 2 hasn't been run by the authors.
