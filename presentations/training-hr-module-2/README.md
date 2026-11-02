# HR-Driven Identity learning path, Module 2: Run contractors from their own source

**Deck name: Training_HR_Module_2.** The narrated deck for [Module 2: Run contractors from their own source](../../docs/training/hr-driven-identity/02-contractor-sources.md), in the [HR-Driven Identity learning path](../../docs/training/hr-driven-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a contractor's end date keeps access alive; learning objectives and prerequisites |
| Concepts | The guide's order (measure, settle, then the leaver); the earliest end and its conditions; the source checks (CS) and the reconciliation's rules (CR); the extract through the HR middleware, and the sponsor review |
| Lab | Try it: Lab 1 steps 1 to 7: the reconciliation's read, the extract, the nine decisions, the SCIM requests, the reconciliation's findings, the sponsor review settings and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2, PS-7, IA-4(4), OMB M-22-09) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_HR_Module_2.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_HR_Module_2_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_HR_Module_2_Narration_Script.md` | The spoken narration, slide by slide (about 1,950 words) |
| `narration_Training_HR_Module_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-hr-module-2/build.js presentations/training-hr-module-2/Training_HR_Module_2.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/hr-driven-identity/_verification/learning-path.md), or the code, configuration and fixtures in [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md) and [`examples/hcm-entra`](../../examples/hcm-entra/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run with Python 3.14.3 in a scratch copy of `examples/`, outside the repository. Long commands are wrapped with a trailing backslash; the extract's last line and one reconciliation finding are trimmed, with "..." marking each cut; and the sponsor review JSON is trimmed and reflowed onto fewer lines, as the slides say. The extract's exit code of 2 is what the run printed; the verification log notes the module doesn't state it. The module's labels carry over: the grace and recertification periods are design guidance, and the requestor's manager as reviewer is among what the kit lists as unconfirmed. The example code is illustrative and tested against fixtures, not proven against a live tenant.
