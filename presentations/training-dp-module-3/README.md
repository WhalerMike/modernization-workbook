# Data Platform and SQL Server Identity learning path, Module 3: Arc and the Engine's Identity

**Deck name: Training_DP_Module_3.** The narrated deck for [Module 3: Arc and the Engine's Identity](../../docs/training/data-platform/03-arc-and-the-engines-identity.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why no Arc means no Entra login; learning objectives and prerequisites |
| Concepts | What Arc gives the engine (the agent's managed identity; the app registration on SQL Server 2022 and the managed identity on 2025); the two layers and the cloud a GCC (Moderate) tenant uses, `AzureCloud`; the deployment sequence and the verification gate; how the kit settles the category; what Microsoft Learn leaves to you and the kit adds |
| Lab | Try it: Lab 1 steps 1 to 7, the kit's Arc check on the fictional snapshot: the machines, the categories, the manifest, a snapshot from an unrecorded cloud refused, an unconfirmed Entra setting, the tests and the run list; Lab 2, a Resource Graph snapshot of a test subscription, settled before and after the Entra setting is confirmed (not run by the authors) |
| Check and summary | The federal requirement (CM-8, CM-6, IA-5; KSI-PIY-GIV, KSI-SVC-ACM, KSI-IAM-SNU) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_DP_Module_3.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_DP_Module_3_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_3_Narration_Script.md` | The spoken narration, slide by slide (about 1,800 words) |
| `narration_Training_DP_Module_3/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-3/build.js presentations/training-dp-module-3/Training_DP_Module_3.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP), names the book by its title, *Data Platform: SQL Server Identity*, and the workbook by its title, *Building SQL Server Identity*, and spells out the acronyms and instance names the voice would misread (G C C, O S, C M eight, C M six, I A five, K S I, "sequel P R D oh one"). Every fact on a slide comes from the module page, the chapters of *Data Platform: SQL Server Identity* and [Runbook R04](../../docs/books/b06-data-platform/r04-arc-deployment-and-managed-identity.md) that it links, workbook [Chapter 03](../../docs/project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md), or the code and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`Invoke-SqlArcCheck.ps1`, `powershell/SqlIdentity`, `tests/fixtures/arc`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, as the slides say. Lab 2 hasn't been run by the authors.
