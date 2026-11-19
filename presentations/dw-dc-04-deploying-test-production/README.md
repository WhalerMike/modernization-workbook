# Building the Daily Checks Workbook, Chapter 04 — Deploying to Test and Production: narrated tour

**Deck name: DW_DC_04_Deploying_Test_Production.** A narrated tour of [Chapter 04 — Deploying to Test and Production](../../docs/project-plans/developer-workbooks/daily-checks/04-deploying-to-test-and-production.md), the runbook, in the developer workbook *Building the Daily Checks Workbook*. The chapter has no Lab 1, so its slides show the page's own fixture-mode output, dated November 16, 2026. It is built with the shared kit in [`../_build/`](../_build/README.md): the slides and notes are data in `build.js`, laid out by [`../_build/devwb.js`](../_build/devwb.js). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `DW_DC_04_Deploying_Test_Production.pptx` | The deck: the narrated slides in Why, What, Who and How order, then a backup section with the footnotes in full |
| `DW_DC_04_Deploying_Test_Production_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped (built by the export step) |
| `DW_DC_04_Deploying_Test_Production_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `DW_DC_04_Deploying_Test_Production_Narration_Script.md` | The spoken narration, slide by slide |
| `narration_DW_DC_04_Deploying_Test_Production/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides, the spoken narration (`say`), the presenter detail (`detail`) and the footnotes each slide cites (`cite`) |

The plain and narrated decks and the MP4 join the next edition's Release; until then, build them from this folder.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `DATECODE="YYYY-MM-DD HH:MM ET" node presentations/dw-dc-04-deploying-test-production/build.js`, with the Eastern time taken from PowerShell. Then `narrate.py`, `captions.py` and `link_sources.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

## Notes and sourcing

Each slide's speaker notes have four parts: the narration (the only part spoken), a Detail part for a presenter, the footnotes the slide relies on, in full, and the sections it draws on. Every fact comes from the chapter and the sources they footnote (Microsoft Learn, read November 18, 2026); the deck adds none. The narration names each source by its original and each book by its title. Lab slides show what the kit really printed on its fictional fixtures (`data/kit-captures/dc/`); Lab 2 steps say the authors haven't run them. The pages' labels carry over: design guidance, preview stages, *not yet specified* for GCC where Learn is silent, and evidence that *supports* a control, which the assessor decides. The workbook is a view, not evidence, and every deck says so.

The title slide carries the Date Code of the build and the page's review status. The decks were built on November 18, 2026 from the draft pages, before their review; if a page changes, its deck is rebuilt and re-recorded.
