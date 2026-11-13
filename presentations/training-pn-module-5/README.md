# Provider Notices learning path, Module 5: AWS Health and the support plan

**Deck name: Training_PN_Module_5.** The narrated deck for [Provider Notices, Module 5: AWS Health and the support plan](../../docs/training/provider-notices/05-aws-health-and-the-support-plan.md), in the Provider Notices learning path ([Training](../../docs/training/provider-notices/index.md)). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts the module sends the learner to, three **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and its evidence, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; where AWS's notices go today and the support-plan condition; learning objectives and prerequisites |
| Concepts | Gate G4: the three read actions, then collect; event categories to kinds, with `actionability` kept apart from the kit's rule; batching ten ARNs at a time, each partition's endpoint, GovCloud and the interim path |
| Lab | Try it: Lab 1 steps 1 to 8: the three permissions and two partitions, collect and read the five events and who said act, the GovCloud request and eleven ARNs refused, the tests; Lab 2 in a test account with a support plan (not run by the authors) |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary |

| File | Use |
|---|---|
| `Training_PN_Module_5.pptx` | The deck: 13 narrated slides (the title and 12 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_PN_Module_5_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_PN_Module_5_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_PN_Module_5/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes, built with the path's shared setup, [`../training-pn-module-1/pn.js`](../training-pn-module-1/pn.js) |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page says so once the video is on the videos Release.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-pn-module-5/build.js presentations/training-pn-module-5/Training_PN_Module_5.pptx`. Then `narrate.py`, `captions.py` and `link_sources.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the sections of the guide's Step 4, workbook Chapter 04 and Book 15, Chapter 14 that the page sends the learner to (and their footnotes), or the code and fixtures in [`examples/provider-notices`](../../examples/provider-notices/README.md); the deck adds none. The **Try it** output is what the commands printed on November 12, 2026 in a scratch copy of the kit (the same output the page shows), wrapped and trimmed where the slide says so. The module's labels carry over: design guidance and not yet specified. The example code is illustrative and tested against fixtures, not run against a live tenant.
