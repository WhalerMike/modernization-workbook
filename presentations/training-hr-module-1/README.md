# HR-Driven Identity learning path, Module 1: Name one writer for every account state

**Deck name: Training_HR_Module_1.** The narrated deck for [Module 1: Name one writer for every account state](../../docs/training/hr-driven-identity/01-one-writer-per-state.md), in the [HR-Driven Identity learning path](../../docs/training/hr-driven-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why two writers on one value is a problem; learning objectives and prerequisites |
| Concepts | The register's lifecycle rows; the four named writers and why a writer is an access decision; the register check (WR-01 to WR-09); the audit-log scan and its saved queries; what the scan can't see (AD writes) and can't confirm (the audit property names) |
| Lab | Try it: Lab 1 steps 1 to 6: the scan's reads, the register check, the October scan, the six findings, one saved query and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2, IA-4, AU-6) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_HR_Module_1.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_HR_Module_1_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_HR_Module_1_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_HR_Module_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-hr-module-1/build.js presentations/training-hr-module-1/Training_HR_Module_1.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/hr-driven-identity/_verification/learning-path.md), or the code, configuration and fixtures in [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run with Python 3.14.3 in a scratch copy of `examples/hr-lifecycle`, outside the repository. Long commands are wrapped with a trailing backslash, and the step 4 findings and the step 5 query are trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance, and the audit property names the kit lists as unconfirmed. The example code is illustrative and tested against fixtures, not proven against a live tenant.
