# Building Non-Person Identity, Chapter 10 — Drift and Evidence for the ISSO: narrated tour

**Deck name: DW_NPI_10_Drift_Evidence.** A narrated tour of [Chapter 10 — Drift and Evidence for the ISSO](../../docs/project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md) in the developer workbook *Building Non-Person Identity*. It is built with the shared kit in [`../_build/`](../_build/README.md): the slides and notes are data in `build.js`, laid out by [`../_build/devwb.js`](../_build/devwb.js). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `DW_NPI_10_Drift_Evidence.pptx` | The deck: 17 narrated slides (the title and 16 content slides in Why, What, Who and How order), then a backup section with the chapter's footnotes in full |
| `DW_NPI_10_Drift_Evidence_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped |
| `DW_NPI_10_Drift_Evidence_Narrated.mp4` | The video, about 11 minutes, on the [videos release](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_NPI_10_Drift_Evidence_Narrated.mp4) |
| `DW_NPI_10_Drift_Evidence_Narrated.vtt` | The video's caption track |
| `DW_NPI_10_Drift_Evidence_Narration_Script.md` | The spoken narration, slide by slide (about 1,628 words) |
| `build.js` | The slides, the spoken narration (`say`), the presenter detail (`detail`) and the chapter footnotes each slide cites (`cite`) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `DATECODE="YYYY-MM-DD HH:MM ET" node presentations/dw-npi-10-drift-evidence/build.js`, with the Eastern time taken from PowerShell. Then `narrate.py`, `captions.py`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README; `qa_export.ps1` checks the layout through PowerPoint.

## Notes and sourcing

Each slide's speaker notes have three parts: the narration (the only part spoken), a Detail part with the chapter's full content for a presenter, and the chapter footnotes the slide relies on, in full, ending with the chapter sections it draws on. Every fact comes from the chapter; the deck adds none. The chapter's own labels carry over: design guidance, preview and beta stages, and points not confirmed. The example code is illustrative and tested against fixtures, not proven against a production tenant.

The title slide carries the Date Code of the build and the chapter's review status. The tour was recorded on October 31, 2026 from the chapter as approved at the review gate; if the chapter changes, the tour is rebuilt and re-recorded.
