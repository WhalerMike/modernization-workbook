# Non-Person Identity learning path, Module 10: Find drift and file the evidence

**Deck name: Training_NPI_Module_10.** The narrated deck for [Module 10: Find drift and file the evidence](../../docs/training/non-person-identity/10-drift-and-evidence.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why every gate's state has to be kept true; learning objectives and prerequisites |
| Concepts | The gate (the guide's Step 6 and Evidence section); one run and the approved baseline; the drift findings (NPI-DRF-01 to -09) and what counts as inside the pipeline; the review cycle and the annual vintage comparison; the package, the chain and the period the ISSO receives |
| Lab | Try it: Lab 1 steps 1 to 11: Microsoft's rule, the permissions, two days of runs, the drift and the vintage, packaging and verifying, the period, breaking it on purpose, and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2(3), AC-6(7), AU-6, CA-7; the module's evidence table) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_NPI_Module_10.pptx` | The deck: 17 narrated slides (the title and 16 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_NPI_Module_10_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_NPI_Module_10_Narration_Script.md` | The spoken narration, slide by slide (about 2,400 words) |
| `narration_Training_NPI_Module_10/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 15 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-10/build.js presentations/training-npi-module-10/Training_NPI_Module_10.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/non-person-identity/_verification/learning-path.md), the guide's sections and the workbook's [Chapter 10](../../docs/project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) and [`examples/drift-pipeline`](../../examples/drift-pipeline/README.md); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, steps 1 to 6 run with PowerShell 7 and Pester 5 in a scratch copy of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, outside the repository; steps 7 to 10 in Git Bash in a scratch copy of `examples/drift-pipeline`; and the pytest suite in the repository, as the verification log did. Long lines are wrapped and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance for the program's rules and the KSI mapping. The example code is illustrative and tested against fixtures, not proven against a live tenant.
