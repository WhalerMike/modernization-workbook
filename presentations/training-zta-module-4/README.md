# Zero Trust Assessment learning path, Module 4: Reconcile, re-run and keep the evidence

**Deck name: Training_ZTA_Module_4.** The narrated deck for [Module 4: Reconcile, re-run and keep the evidence](../../docs/training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md), in the learning path [*The Zero Trust Assessment as Evidence*](../../docs/training/zero-trust-assessment/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, the lab, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. The module page is a draft awaiting the editor's review; at the editor's choice, the title slide and narration carry no draft notice. It is built with the shared kit in [`../_build/`](../_build/README.md), the path's helpers in [`../training-zta-module-1/shared.js`](../training-zta-module-1/shared.js) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why one run is a reading and a program needs three things; learning objectives and prerequisites |
| Concepts | Comparing runs and "no longer evaluated"; reconciling through the setting and the control with ScubaGear and AWS Security Hub CSPM; one posture tool per platform, OCI and Google Cloud included; the cadence and the evidence package |
| Lab | Try it: Lab 1 steps 1 to 6: compare Module 3's two runs, seal the second and check the package, then break the seal on purpose; Lab 2, a second run in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (CA-7, AU-9, AU-11, CA-5) and evidence; two knowledge-check questions with answers; the summary of the path |

| File | Use |
|---|---|
| `Training_ZTA_Module_4.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ZTA_Module_4_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ZTA_Module_4_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`) |
| `Training_ZTA_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 1,800 words) |
| `narration_Training_ZTA_Module_4/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page links the video once it is on the videos Release. The narration runs about 11 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-zta-module-4/build.js presentations/training-zta-module-4/Training_ZTA_Module_4.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original (Microsoft Learn, the tool's own source and guide at release 3.1.0, CISA, AWS, NIST) and each workbook book by its title. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/zero-trust-assessment/_verification/learning-path.md), the [Zero Trust Assessment implementation guide](../../docs/books/guides/zero-trust-assessment-implementation.md)'s steps the module sends the learner to (and the sources the guide footnotes, read November 11, 2026), the Book 11 chapters it links, or the code, configuration and fixtures in [`examples/zta-results`](../../examples/zta-results/README.md); the deck adds none. The **Try it** output is what the commands printed on November 12, 2026, run with PowerShell 7.6 in a scratch copy of `examples/zta-results` after Module 3's Lab 1, outside the repository: the same output the page shows (printed there on November 11). Lines left out are named in the slide's label, and "…" shortens a command. The module's labels carry over: design guidance, Lab 2 not run by the authors, and evidence that *supports* a control, which the assessor decides. The kit is illustrative and tested against fictional fixtures, not proven against a live tenant.
