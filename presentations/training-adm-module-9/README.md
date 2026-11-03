# Attribute-Driven Migration learning path, Module 9: Deploy to test, then production

**Deck name: Training_ADM_Module_9.** The narrated deck for [Module 9: Deploy to test, then production](../../docs/training/attribute-driven-migration/09-deploying-to-test-and-production.md), the last module of the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

Book 19, Chapter 10 is held for review, and nobody has run its runbook against a live tenant, subscription or forest. The deck says so on its title and Why slides, and its Lab 1 slides show only the deploy scripts' dry runs on fixtures.

| Part | Covers |
|---|---|
| Introduction | Title; why a deployment isn't nine Lab 2s in a row; learning objectives and prerequisites |
| Concepts | One settings file per stage, no secrets by construction, and the three identities; the live test stage's order; the promotion criteria, production in waves and its rollback rule |
| Lab | Try it: Lab 1 steps 1 to 8: the test stage's pre-flight check, four recorded changes and their rollback plan, the smoke test's no-go, the evidence check and production's refused promotion, and the tests; Lab 2, the live test stage (not run by anyone yet) |
| Check and summary | The federal requirement (CM-3(2), IA-5, AC-6, CM-4(2), CA-7, AU-9, SI-7, CM-3), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the end of the path |

| File | Use |
|---|---|
| `Training_ADM_Module_9.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_9_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_9_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_ADM_Module_9/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-9/build.js presentations/training-adm-module-9/Training_ADM_Module_9.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 10](../../docs/books/b19-developer-workbook/10-deploying-to-test-and-production.md), or the deploy scripts, requirement rows and fixtures in [`examples/drift-pipeline/deploy`](../../examples/drift-pipeline/README.md); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with Python 3.14.3 in a scratch copy of `examples` (the deploy pre-flight check reads all nine kits), outside the repository, from an empty `out` folder; it matches the module page and Chapter 10's dry-run output. The smoke report's and the evidence check's hashes change with each run, because the records carry the time they were written, so the slides don't show them. One Git Bash quirk: Git Bash rewrites the policy assignment's `--name /subscriptions/...` argument into a Windows path before Python sees it, so the rollback plan's `-Scope` printed with a `C:/Program Files/Git` prefix; the slide shows the `/subscriptions/...` scope the chapter prints. Long commands are wrapped with a trailing backslash or shortened, and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance where the module says so.
