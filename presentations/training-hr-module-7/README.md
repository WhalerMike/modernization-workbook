# HR-Driven Identity learning path, Module 7: Find lifecycle drift and file the evidence

**Deck name: Training_HR_Module_7.** The narrated deck for [HR-Driven Identity, Module 7: Find lifecycle drift and file the evidence](../../docs/training/hr-driven-identity/07-drift-and-evidence.md), the last module in the [HR-Driven Identity learning path](../../docs/training/hr-driven-identity/index.md) (Gate G7 Drift and evidence). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why accounts drift and why the record must last; learning objectives and prerequisites |
| Concepts | What the evidence has to show, the guide's Step 7 (Unit 1); the drift classes LD-01 to LD-08; the six metrics; the run folder; the package, the chain and the period (Unit 2) |
| Lab | Try it: Lab 1 steps 1 and 2 (rebuild the inputs, the first run), step 3 (the findings), steps 4 and 5 (two chained packages, verify, `sha256sum`) and steps 6 and 7 (the period and its Gate 7 criteria); Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary and the end of the path |

| File | Use |
|---|---|
| `Training_HR_Module_7.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_HR_Module_7_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_HR_Module_7_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_HR_Module_7/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-hr-module-7/build.js presentations/training-hr-module-7/Training_HR_Module_7.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/hr-driven-identity/_verification/learning-path.md), or the code and fixtures in [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md) (`lifecycle_drift.py`, `config/drift.json`, `tests/fixtures/ch01` to `ch07`) and [`examples/drift-pipeline`](../../examples/drift-pipeline/README.md) (`hr_evidence.py`); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run in a scratch copy of `examples/` with Python 3.14.3, and it is trimmed where the slide says so: step 1's five commands shortened with `...` (the full commands are on the module page), step 2's command wrapped with `\` and its last output line left off, step 3's twenty lines set in two columns with four LD-07 lines summarized, step 5's hashes shortened with `...` and its six `OK` lines set in two columns, and step 6's `period-summary.md` shown as a table of its Gate 7 criteria. The module's labels carry over: the control mapping is design guidance, and the metric thresholds are the program's starting values. Names and keys in the fixtures are fictional. The example code is illustrative and tested against fixtures, not proven against a live tenant.
