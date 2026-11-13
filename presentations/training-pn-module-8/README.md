# Provider Notices learning path, Module 8: Digest, evidence and go/no-go

**Deck name: Training_PN_Module_8.** The narrated deck for [Provider Notices, Module 8: Digest, evidence and go/no-go](../../docs/training/provider-notices/08-digest-evidence-and-go-no-go.md), in the Provider Notices learning path ([Training](../../docs/training/provider-notices/index.md)). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts the module sends the learner to, three **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and its evidence, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the digest and the evidence, and where the digest belongs; learning objectives and prerequisites |
| Concepts | The digest's five sections; what the guide names and what the kit adds; the evidence record and what a stage needs; the promotion go/no-go and the dangers it guards |
| Lab | Try it: Lab 1 steps 1 to 9: the second week's digest, three runs recorded, the chain and the test stage checked (failing `PRE` and `RUN`, as it should), a recorded file edited and caught, the whole test suite; Lab 2 on a test environment's runs (not run by the authors) |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary |

| File | Use |
|---|---|
| `Training_PN_Module_8.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_PN_Module_8_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_PN_Module_8_Narration_Script.md` | The spoken narration, slide by slide (about 2,200 words) |
| `narration_Training_PN_Module_8/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes; the path's setup is [`../training-pn-module-1/pn.js`](../training-pn-module-1/pn.js) |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page says so once the video is on the videos Release.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-pn-module-8/build.js presentations/training-pn-module-8/Training_PN_Module_8.pptx`. Then `narrate.py`, `captions.py` and `link_sources.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the sections of workbook Chapters 07 and 08, the guide's Step 7 and Evidence, and Book 15, Chapter 14 that the page sends the learner to (and their footnotes), or the code and fixtures in [`examples/provider-notices`](../../examples/provider-notices/README.md); the deck adds none. The **Try it** output is what the commands printed on November 12, 2026 in a scratch copy of the kit (the same output the page shows), wrapped and trimmed where the slide says so. The module's labels carry over: design guidance and not yet specified. The example code is illustrative and tested against fixtures, not run against a live tenant.
