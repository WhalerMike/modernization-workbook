# Zero Trust Assessment learning path, Module 3: From results to a closure register

**Deck name: Training_ZTA_Module_3.** The narrated deck for [Module 3: From results to a closure register](../../docs/training/zero-trust-assessment/03-from-results-to-a-closure-register.md), in the learning path [*The Zero Trust Assessment as Evidence*](../../docs/training/zero-trust-assessment/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, the lab, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. The module page is a draft awaiting the editor's review, and the title slide and narration say so. It is built with the shared kit in [`../_build/`](../_build/README.md), the path's helpers in [`../training-zta-module-1/shared.js`](../training-zta-module-1/shared.js) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title (with the draft notice); why "17 failed" can't be acted on; learning objectives and prerequisites |
| Concepts | Normalize and dispose; one register entry per finding and who decides closure; routing each finding family to its remediation page, and unrouted findings; weighing and exceptions |
| Lab | Try it: Lab 1 steps 1 to 6: normalize the first run and read its dispositions, write the register, then the second run with a review and two exceptions; Lab 2 on your test tenant's export (not run by the authors) |
| Check and summary | The federal requirement (CA-2, CA-7, CM-6, CA-5, RA-7) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ZTA_Module_3.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ZTA_Module_3_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ZTA_Module_3_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`) |
| `Training_ZTA_Module_3_Narration_Script.md` | The spoken narration, slide by slide (about 1,750 words) |
| `narration_Training_ZTA_Module_3/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page links the video once it is on the videos Release. The narration runs about 11 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-zta-module-3/build.js presentations/training-zta-module-3/Training_ZTA_Module_3.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original (Microsoft Learn, the tool's own source and guide at release 3.1.0, CISA, AWS, NIST) and each workbook book by its title. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/zero-trust-assessment/_verification/learning-path.md), the [Zero Trust Assessment implementation guide](../../docs/books/guides/zero-trust-assessment-implementation.md)'s steps the module sends the learner to (and the sources the guide footnotes, read November 11, 2026), the Book 11 chapters it links, or the code, configuration and fixtures in [`examples/zta-results`](../../examples/zta-results/README.md); the deck adds none. The **Try it** output is what the commands printed on November 12, 2026, run with PowerShell 7.6 in a scratch copy of `examples/zta-results`, outside the repository: the same output the page shows (printed there on November 11). Lines and text left out are marked with "…", or named in the slide's label. The module's labels carry over: design guidance, Lab 2 not run by the authors, and evidence that *supports* a control, which the assessor decides. The kit is illustrative and tested against fictional fixtures, not proven against a live tenant.
