# Attribute-Driven Migration learning path, Module 8: Run the drift pipeline and hand over the evidence

**Deck name: Training_ADM_Module_8.** The narrated deck for [Module 8: Run the drift pipeline and hand over the evidence](../../docs/training/attribute-driven-migration/08-drift-and-evidence.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why Gate 9; learning objectives and prerequisites |
| Concepts | Where the pipeline sits (change, not drift; a failed read is unverified); what Learn's sample workflows leave to you; the comparison and its results; findings without names and the chained evidence package |
| Lab | Try it: Lab 1 steps 1 to 10: the workflow lint and the cloud hosts, the baseline and the next day, the drafted findings and the chained package, the edit and the swapped runs that are refused, and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (CA-7, CM-2, SI-4, AU-6, AU-9, SI-7, CM-3, SA-10, AC-6, and IA-5 in Lab 2), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_8.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_8_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_8_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_ADM_Module_8/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 14 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-8/build.js presentations/training-adm-module-8/Training_ADM_Module_8.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 09](../../docs/books/b19-developer-workbook/09-drift-pipelines-and-evidence.md), or the code, configuration and fixtures in [`examples/drift-pipeline`](../../examples/drift-pipeline/README.md); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with Python 3.14.3 and PyYAML 6.0.3 in a scratch copy of `examples` (the drift pipeline with the `third_party` and `hr-lifecycle` folders its tests read), outside the repository; it matches the module page and the captures in `data/kit-captures/adm` (09-1 to 09-12). On Windows the two paths the scripts echo print with backslashes; the slides show them with forward slashes, as the page and the captures do. Long commands are wrapped with a trailing backslash or shortened, and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance where the module says so. The example code is illustrative and tested against fixtures; the sample workflow has never run against Azure.
