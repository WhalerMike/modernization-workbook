# HR-Driven Identity learning path, Module 3: Make joiners ready on day one

**Deck name: Training_HR_Module_3.** The narrated deck for [Module 3: Make joiners ready on day one](../../docs/training/hr-driven-identity/03-joiners-and-the-temporary-access-pass.md), in the [HR-Driven Identity learning path](../../docs/training/hr-driven-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the first morning needs workflows as code; learning objectives and prerequisites |
| Concepts | The joiner in the guide (the 50-workflow budget, the Temporary Access Pass, baseline access by package); the six workflow files, scoped on codes; the lint (JW-01 to JW-15); the plan, and the four things a ready hire has |
| Lab | Try it: Lab 1 steps 1 to 6: the reads, the clean lint, the broken lint with the JW-05 warnings, the plan and the refused plan, day-one readiness and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2(1), IA-5, OMB M-22-09) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_HR_Module_3.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_HR_Module_3_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_HR_Module_3_Narration_Script.md` | The spoken narration, slide by slide (about 1,950 words) |
| `narration_Training_HR_Module_3/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-hr-module-3/build.js presentations/training-hr-module-3/Training_HR_Module_3.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/hr-driven-identity/_verification/learning-path.md), or the code, configuration and fixtures in [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run with Python 3.14.3 in a scratch copy of `examples/hr-lifecycle`, outside the repository. Long commands are wrapped with a trailing backslash, and the broken lint's eleven lines are trimmed to seven, with "..." marking the cuts, as the slides say. The module's labels carry over: the 50-workflow budget and the one-time pass are design guidance. The example code is illustrative and tested against fixtures, not proven against a live tenant.
