# Data Platform and SQL Server Identity learning path, Module 9: Closure, Drift and Evidence

**Deck name: Training_DP_Module_9.** The narrated deck for [Module 9: Closure, Drift and Evidence](../../docs/training/data-platform/09-closure-drift-and-evidence.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the module page's Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why closure is a record that keeps coming back clean, not a one-time action; learning objectives and prerequisites |
| Concepts | The five closure conditions; the closure record's eleven fields (`met`, `NOT MET`, `external`), the exception registry, the two places the record is narrower than the book's field set, and "ready for the assessor", never "closed"; drift as a compliance finding, Arc going offline and a mode change not yet restarted |
| Lab | Try it: Lab 1 steps 1 to 8 on the kit's day-1 and day-30 fixtures: day 30 projected onto the closure conditions, SQLPRD01's record and the exception registry, the record without the registry or the Arc snapshot, the day-1 to day-30 drift comparison, the drift manifest, the tests and the runs; Lab 2, the weekly scheduled run against a test instance (not run by the authors) |
| Check and summary | The federal requirement (CA-7, CM-6, AC-2) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_DP_Module_9.pptx` | The deck: 15 narrated slides (the title and 14 content slides), then a backup section with the sources |
| `Training_DP_Module_9_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_9_Narration_Script.md` | The spoken narration, slide by slide (about 1,800 words) |
| `narration_Training_DP_Module_9/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-9/build.js presentations/training-dp-module-9/Training_DP_Module_9.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (NIST, FedRAMP) or by its title (*Data Platform: SQL Server Identity*, *Building SQL Server Identity*) and spells out the acronyms the voice would misread (S A, M F A, C A seven, C M six, K S I, S H A two fifty-six). Every fact on a slide comes from the module page, workbook [Chapter 09](../../docs/project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md), the data platform book's [Chapter 20](../../docs/books/b06-data-platform/20-the-closure-condition.md) and [Chapter 21](../../docs/books/b06-data-platform/21-what-done-looks-like.md) and [Runbook R09](../../docs/books/b06-data-platform/r09-continuous-monitoring-and-closure.md) that the module sends the learner to, or the code and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/) (`Invoke-SqlClosure.ps1`, `Compare-SqlAuditRun.ps1`, `powershell/SqlIdentity`, `tests/fixtures`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, and the kit's `C:/FMWLabs/results/...` paths are shortened to `$Run`, as the slides say. The chapter's labels carry over: a record with nothing `NOT MET` is "ready for the assessor", never "closed"; Lab 2 hasn't been run by the authors.
