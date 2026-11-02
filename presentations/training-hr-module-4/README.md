# HR-Driven Identity learning path, Module 4: Assign access from attributes and review what a move leaves

**Deck name: Training_HR_Module_4.** The narrated deck for [Module 4: Assign access from attributes and review what a move leaves](../../docs/training/hr-driven-identity/04-access-and-movers.md), in the [HR-Driven Identity learning path](../../docs/training/hr-driven-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the GCC High gap and privileged access, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a rule on the organization code isn't enough; learning objectives and prerequisites |
| Concepts | The guide's six rules for Gate 4 and the memberOf quarantine; the program's three policy files; the lint (AA-01 to AA-09); the mover's residual review and its classes |
| Lab | Try it: Lab 1 steps 1 to 6: the reads, the clean lint, the broken lint, the memberOf scan, one mover's residual and the tests; Lab 2 in a test tenant (not run by the authors) |
| Government clouds and privilege | The GCC High gap (administrative units with dynamic membership rules); privileged access kept out of rules (AA-09, SCuBA MS.AAD.7.5v1) |
| Check and summary | The federal requirement (AC-2, AC-6, AC-5, PS-5, MS.AAD.7.5v1) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_HR_Module_4.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_HR_Module_4_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_HR_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_HR_Module_4/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-hr-module-4/build.js presentations/training-hr-module-4/Training_HR_Module_4.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/hr-driven-identity/_verification/learning-path.md), or the code, configuration and fixtures in [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run with Python 3.14.3 in a scratch copy of `examples/hr-lifecycle`, outside the repository. Long commands are wrapped with a trailing backslash, and the broken lint's seven findings are trimmed to the three the module names, with "..." marking the cuts, as the slides say. The residual classes on the concept slide are the `residual.json` that Lab 1's step 5 writes. The module's labels carry over: the 14-day grace ceiling and the 10-day review target are design guidance. The example code is illustrative and tested against fixtures, not proven against a live tenant.
