# Data Platform and SQL Server Identity learning path, Module 1: The Estate and the Consolidation Gate

**Deck name: Training_DP_Module_1.** The narrated deck for [Module 1: The Estate and the Consolidation Gate](../../docs/training/data-platform/01-the-estate-and-the-consolidation-gate.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the count comes before any login moves; learning objectives and prerequisites |
| Concepts | Finding the estate: the three kinds of sprawl and discovery; what the inventory must capture; the rights each depth of discovery needs (Runbook R02, Step 1); the three lenses (utilization, version, dependencies) and the reset usage counters; the classifier's first pass and the recorded constraints |
| Lab | Try it: Lab 1 steps 1 to 7, the kit's classifier on the fictional eight-instance estate: the run and its classes, the manifest and `Test-SqlManifest`, the two instances that don't enter the migration (SQLOLD05, SQLDEV08), a file changed by hand, the tests and the run list; Lab 2, the Start Kit's discovery and the classifier on a test domain (not run by the authors) |
| Check and summary | The federal requirement (CM-8, KSI-PIY-GIV; Runbook R02's AC-6, CM-8, CM-8(1) and IA-5 mappings) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_DP_Module_1.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_DP_Module_1_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_1_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_DP_Module_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-1/build.js presentations/training-dp-module-1/Training_DP_Module_1.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP), names the book by its title, *Data Platform: SQL Server Identity*, and the workbook by its title, *Building SQL Server Identity*, and spells out the acronyms and instance names the voice would misread (S P N, S S I S, U D P, C M eight, K S I, "sequel P R D oh one"). Every fact on a slide comes from the module page, the chapters of *Data Platform: SQL Server Identity* and [Runbook R02](../../docs/books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md) that it links, workbook [Chapter 01](../../docs/project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md), or the code and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`Invoke-SqlEstate.ps1`, `powershell/SqlIdentity`, `tests/fixtures/estate`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, as the slides say. Lab 2 hasn't been run by the authors.
