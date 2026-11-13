# Provider Notices learning path, Module 9: Deploying to test and production (optional)

**Deck name: Training_PN_Module_9.** The narrated deck for [Provider Notices, Module 9: Deploying to test and production (optional)](../../docs/training/provider-notices/09-deploying-to-test-and-production.md), the last module of the Provider Notices learning path ([Training](../../docs/training/provider-notices/index.md)). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts the module sends the learner to, three **Try it** slides with the real Lab 1 dry-run commands and output, Lab 2, the federal requirement and its evidence, a two-question knowledge check, and the summary that ends the path. The runbook it teaches, workbook Chapter 08, hasn't been run against a live tenant, account, tenancy or project; the deck says so on its title and Why slides. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title and the runbook's status; one set of commands run twice, in an order where each step can be undone; learning objectives and prerequisites |
| Concepts | The settings file and the kit's gated writes; the pre-flight, PF-01 to PF-07; Stage 1, test, in nine steps; the promotion go/no-go and production's dry-run week |
| Lab | Try it: Lab 1 steps 1 to 11, the dry run on fixtures: the template refused, the test pre-flight and weekly run, the test stage's evidence passing, production's pre-flight with PF-07, the alert and rollback plans, and an unapproved hash refused; Lab 2, the test stage then production (not run by anyone yet) |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary |

| File | Use |
|---|---|
| `Training_PN_Module_9.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_PN_Module_9_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_PN_Module_9_Narration_Script.md` | The spoken narration, slide by slide (about 2,200 words) |
| `narration_Training_PN_Module_9/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes; the path's setup is [`../training-pn-module-1/pn.js`](../training-pn-module-1/pn.js) |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page says so once the video is on the videos Release.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-pn-module-9/build.js presentations/training-pn-module-9/Training_PN_Module_9.pptx`. Then `narrate.py`, `captions.py` and `link_sources.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the sections of workbook Chapter 08 that the page sends the learner to (and their footnotes), or the code and fixtures in [`examples/provider-notices`](../../examples/provider-notices/README.md); the deck adds none. The **Try it** output is what the dry run printed on November 12, 2026 on Windows in a scratch copy of the kit (the same output the page shows), trimmed where the slide says so. The runbook's live results are labeled Expected on the page; the deck shows none of them as seen. The example code is illustrative and tested against fixtures, not run against a live tenant.
