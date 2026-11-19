# Daily Checks Dashboard learning path, Module 1: One workbook, one tab per daily check

**Deck name: Training_DC_Module_1.** The narrated deck for [Module 1: One workbook, one tab per daily check](../../docs/training/daily-checks-dashboard/01-one-workbook-one-tab-per-check.md), in the learning path [*The Daily Checks on One Dashboard*](../../docs/training/daily-checks-dashboard/index.md): the objectives, the units, Lab 1 with the kit's real output, Lab 2, the federal requirement, a knowledge check and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md): the slides and notes are data in `build.js`, laid out by [`../_build/devwb.js`](../_build/devwb.js) in page mode. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Training_DC_Module_1.pptx` | The deck: the narrated slides in Why, What, Who and How order, then a backup section with the footnotes in full |
| `Training_DC_Module_1_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped (built by the export step) |
| `Training_DC_Module_1_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_DC_Module_1_Narration_Script.md` | The spoken narration, slide by slide |
| `narration_Training_DC_Module_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides, the spoken narration (`say`), the presenter detail (`detail`) and the footnotes each slide cites (`cite`) |

The plain and narrated decks and the MP4 join the next edition's Release; until then, build them from this folder.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `DATECODE="YYYY-MM-DD HH:MM ET" node presentations/training-dc-module-1/build.js`, with the Eastern time taken from PowerShell. Then `narrate.py`, `captions.py` and `link_sources.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

## Notes and sourcing

Each slide's speaker notes have four parts: the narration (the only part spoken), a Detail part for a presenter, the footnotes the slide relies on, in full, and the sections it draws on. Every fact comes from the module page and the guide and the sources they footnote (Microsoft Learn, read November 18, 2026); the deck adds none. The narration names each source by its original and each book by its title. Lab slides show what the kit really printed on its fictional fixtures (`data/kit-captures/dc/`); Lab 2 steps say the authors haven't run them. The pages' labels carry over: design guidance, preview stages, *not yet specified* for GCC where Learn is silent, and evidence that *supports* a control, which the assessor decides. The workbook is a view, not evidence, and every deck says so.

The title slide carries the Date Code of the build and the page's review status. The decks were built on November 18, 2026 from the draft pages, before their review; if a page changes, its deck is rebuilt and re-recorded.
