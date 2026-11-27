# Data Platform and SQL Server Identity learning path, Module 4: Entra logins and the parallel run

**Deck name: Training_DP_Module_4.** The narrated deck for [Module 4: Entra Logins and the Parallel Run](../../docs/training/data-platform/04-entra-logins-and-the-parallel-run.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the old login stays on until the new one is proven (a wrong mapping locks people out, a dropped login can't be rolled back); learning objectives and prerequisites |
| Concepts | The three Entra principal types a `FROM EXTERNAL PROVIDER` login maps to and their login types (`E`, `X`); the kit's login plan, its `UNRESOLVED` lines and its one-group-one-role warnings; the parallel run's order and exit criteria, the cutover (disable, or `DENY CONNECT SQL` for a Windows group), the rollback and the `sa` account |
| Lab | Try it: Lab 1 steps 1 to 9 on the kit's fixtures: SQLPRD01's login plan, the cutover and the rollback, an unmapped login, the parallel-run judge on day 1 and day 30, the manifest, the re-hash, the tests and the list of runs; Lab 2, one mapping on a test instance (not run by the authors) |
| Check and summary | The federal requirement (AC-2, CM-3, CM-4, IA-2, CA-7) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_DP_Module_4.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_DP_Module_4_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 1,850 words) |
| `narration_Training_DP_Module_4/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-4/build.js presentations/training-dp-module-4/Training_DP_Module_4.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP) and names the book by its title, *Data Platform: SQL Server Identity*, and the workbook as *Building SQL Server Identity*; it spells out the acronyms the voice would misread (A C two, C M three, C M four, I A two, C A seven, K S I, S A, D B A) and says SQLPRD01 as "sequel P R D oh one". Every fact on a slide comes from the module page, workbook [Chapter 04](../../docs/project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md) and [Runbook R05](../../docs/books/b06-data-platform/r05-login-migration-and-parallel-run.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`New-SqlLoginPlan.ps1`, `Test-SqlParallelRun.ps1`, `config/requirements.json`, `tests/fixtures`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, as the slides say. Lab 2 hasn't been run by the authors.
