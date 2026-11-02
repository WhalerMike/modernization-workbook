# Ticket-to-Machine learning path, Module 7: Evidence for the ISSO

**Deck name: Training_TTM_Module_7.** The narrated deck for [Ticket-to-Machine, Module 7: Evidence for the ISSO](../../docs/training/ticket-to-machine/07-evidence-for-the-isso.md), in the [Ticket-to-Machine learning path](../../docs/training/ticket-to-machine/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, two **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why ticket history doesn't prove the month; learning objectives and prerequisites |
| Concepts | Gate 7's tempo, the five measures and how Gate 7 is validated, Book 13's evidence record field by field, the export's four checks, the package and its chain, window adherence and the five fictional records, and the dangers |
| Lab | Try it: Lab 1 steps 1 to 3 (the tests, October's export and the verified package) and steps 4 to 6 (November's chain and a removed record); Lab 2 in a ServiceNow developer instance (not run by the authors) |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary and the end of the path |

| File | Use |
|---|---|
| `Training_TTM_Module_7.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_TTM_Module_7_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_TTM_Module_7_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_TTM_Module_7/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes, with the Ticket-to-Machine title slide |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ttm-module-7/build.js presentations/training-ttm-module-7/Training_TTM_Module_7.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the guide and workbook sections it sends you to read (the example guide's Gate 7 and "Evidence," and the developer workbook's Chapter 07), the path's verification log, or the code and fixtures in [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run in a copy of the kit outside the repository: long commands are wrapped; the one-line Python command that prints three fields, and its output, are trimmed to the first field; November's export lines that repeat October's are trimmed; and the `chain_previous` line is read from November's `manifest.json`. The module's labels carry over: design guidance (where the manifest is kept, and signing) and illustrative code. The example code is tested against fixtures, not proven against a live tenant.
