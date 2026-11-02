# Ticket-to-Machine learning path, Module 4: Sources and the Starting Drift

**Deck name: Training_TTM_Module_4.** The narrated deck for [Ticket-to-Machine, Module 4: Sources and the Starting Drift](../../docs/training/ticket-to-machine/04-sources-and-starting-drift.md), in the [Ticket-to-Machine learning path](../../docs/training/ticket-to-machine/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, two **Try it** slides with the real Lab 1 commands and output, Lab 2, where agencies are with the government-cloud differences, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why each drift needs a number before a ticket; learning objectives and prerequisites |
| Concepts | Gate 3's six steps; Book 03's drift classes and what the kit computes; the reconciliation's inputs, stable finding IDs and outputs; run over run (new, persisting, resolved, and the refusal); the dangers of a nightly run |
| Lab | Try it: Lab 1 steps 1 and 2 (day one, Erin's and Carol's rows) and steps 3 to 6 (the comparison, and the refusal without the audit); Lab 2 in a test tenant and a SailPoint sandbox (not run by the authors) |
| Where agencies are | GCC and GCC High endpoints, Native Change Detection in the ISC FedRAMP environment, and the interim path |
| Check and summary | Validating Gate 3; the federal requirement (AC-2, CA-7, CM-8 by inference; SI-4) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_TTM_Module_4.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_TTM_Module_4_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_TTM_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_TTM_Module_4/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes. It uses the Microsoft Automation decks' helpers, [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js), and sets this path's title slide and document title itself |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ttm-module-4/build.js presentations/training-ttm-module-4/Training_TTM_Module_4.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units and the pages they send the learner to, which isn't spoken. Every fact on a slide comes from the module page, the pages it links (its [verification log](../../docs/training/ticket-to-machine/_verification/index.md) says the module adds no facts of its own), or the code and fixtures in [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md); the deck adds none. The people in the output are the kit's fictional fixtures. The **Try it** output is what the commands printed on November 2, 2026, run exactly as the module gives them in a copy of the kit outside the repository (Python 3.14.3). It is trimmed where the slides say so: the long commands are wrapped (the one-line Python script across three lines, the others with `\`), day one's summary JSON is folded to two lines with the not-computed reasons elided, the two day-two runs are summarized in comments, the refusal's error is wrapped, and step 1's test count is quoted under the panel. The module's labels carry over: inference.
