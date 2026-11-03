# Attribute-Driven Migration learning path, Module 7: Extend Lifecycle Workflows

**Deck name: Training_ADM_Module_7.** The narrated deck for [Module 7: Extend Lifecycle Workflows](../../docs/training/attribute-driven-migration/07-lifecycle-workflows-extensions.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the rest of a leaver needs a custom task extension; learning objectives and prerequisites |
| Concepts | Where the extensions sit, Book 03's three rules and Learn's contract; what Learn's Logic App definition leaves to you; one Logic App per integration in four steps, and the registry; lint, run, build and check, authorization and the leaver order |
| Lab | Try it: Lab 1 steps 1 to 8: Learn's definition linted and run for GCC High and worldwide, the program's definition linted and run through failures and repeat deliveries, the build and the Azure Government refusal, the read-back checks and WX-03, and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2, PS-4, CM-3(2), CM-2, CM-6, AC-3, AC-6, and AU-12 in Lab 2), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_7.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_7_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_7_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_ADM_Module_7/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 14 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-7/build.js presentations/training-adm-module-7/Training_ADM_Module_7.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 05](../../docs/books/b19-developer-workbook/05-lifecycle-workflows-custom-extensions.md), or the code, configuration and fixtures in [`examples/lifecycle-extensions`](../../examples/lifecycle-extensions/README.md); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with Python 3.14.3 in a scratch copy of `examples/lifecycle-extensions` and `examples/third_party` (which holds the pinned Learn page), outside the repository; it matches the module page and the captures in `data/kit-captures/adm` (05-1 to 05-13), including the Azure Government refusal in step 5. Long commands are wrapped with a trailing backslash or shortened, and the output is trimmed, with "..." marking each cut; step 4 shows each run's last two lines joined on one line, as the slide says. The module's labels carry over: design guidance where the module says so. The example code is illustrative and tested against fakes, not against a production tenant.
