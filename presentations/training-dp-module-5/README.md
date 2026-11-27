# Data Platform and SQL Server Identity learning path, Module 5: Groups, roles and the perimeter

**Deck name: Training_DP_Module_5.** The narrated deck for [Module 5: Groups, Roles and the Perimeter](../../docs/training/data-platform/05-groups-roles-and-the-perimeter.md), in the [Data Platform and SQL Server Identity learning path](../../docs/training/data-platform/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the groups change keepers, not purpose (the org chart becomes a rule, administrators an assigned group under PIM, a distribution list never a login); learning objectives and prerequisites |
| Concepts | One group, one role, flat by design; the four AD group patterns and the kit's Entra target for each; the attribute as the access control, PIM for privileged groups, and Conditional Access as the perimeter for users |
| Lab | Try it: Lab 1 steps 1 to 6 on the kit's fixtures: the five groups' map, what each group grants and the nested flag, the guard on a privileged dynamic group, the manifest, the tests and the list of runs; Lab 2, the map beside a test tenant's groups, read-only (not run by the authors) |
| Check and summary | The federal requirement (AC-2, AC-6) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_DP_Module_5.pptx` | The deck: 14 narrated slides (the title and 13 content slides), then a backup section with the sources |
| `Training_DP_Module_5_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_DP_Module_5_Narration_Script.md` | The spoken narration, slide by slide (about 1,550 words) |
| `narration_Training_DP_Module_5/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 25, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 10 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-dp-module-5/build.js presentations/training-dp-module-5/Training_DP_Module_5.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP) and names the book by its title, *Data Platform: SQL Server Identity*, and the workbook as *Building SQL Server Identity*; it spells out the acronyms the voice would misread (A C two, A C six, K S I, H R, G C C, N T L M, S P N) and says SQLPRD01 as "sequel P R D oh one". Every fact on a slide comes from the module page, workbook [Chapter 05](../../docs/project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md) and [Runbook R07](../../docs/books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/sql-server-identity`](../../examples/sql-server-identity/README.md) (`Invoke-SqlGroupMap.ps1`, `Get-SqlGroupPattern`, `config/requirements.json`, `tests/fixtures/groups`); the deck adds none. The **Try it** output is the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into `C:\FMWLabs`. Wide output is wrapped and reflowed, with "..." marking cut spacing, as the slides say. Lab 2 hasn't been run by the authors.
