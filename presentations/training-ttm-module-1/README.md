# Ticket-to-Machine learning path, Module 1: The Loop and the Typed Task

**Deck name: Training_TTM_Module_1.** The narrated deck for [Ticket-to-Machine, Module 1: The Loop and the Typed Task](../../docs/training/ticket-to-machine/01-the-loop-and-the-typed-task.md), in the [Ticket-to-Machine learning path](../../docs/training/ticket-to-machine/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, two **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a ticket marked "done" isn't a record; learning objectives and prerequisites |
| Concepts | The loop's five steps; where the kit sits in Pass 1; the products at each step and the four gaps; the identity finding's data contract; what the Scripted REST resource does; severity and tempo; `finding_contract.py` and the vacuous intended state |
| Lab | Try it: Lab 1 step 2 (five sample payloads) and steps 1, 3 and 4 (every payload the drift client would post); Lab 2 in a ServiceNow Personal Developer Instance (not run by the authors) |
| Check and summary | The federal requirement (Gate 4: CM-3, RA-7, CA-7, AC-5) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_TTM_Module_1.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_TTM_Module_1_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_TTM_Module_1_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_TTM_Module_1/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes. It uses the Microsoft Automation decks' helpers, [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js), and sets this path's title slide and document title itself |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ttm-module-1/build.js presentations/training-ttm-module-1/Training_TTM_Module_1.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units and the pages they send the learner to, which isn't spoken. Every fact on a slide comes from the module page, the pages it links (its [verification log](../../docs/training/ticket-to-machine/_verification/index.md) says the module adds no facts of its own), or the code and fixtures in [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run exactly as the module gives them in a copy of the kit outside the repository (Python 3.14.3, Node.js 24.14.1). It is trimmed where the slides say so: two long lines on the samples slide end in "...", the payload check shows 5 of its 15 lines, the drift client's summary is left out, its long command is wrapped with `\`, and step 3's Node output is quoted in a line under the panel. The module's labels carry over: design guidance and program design. The example code is illustrative and tested against fixtures, not proven against a live instance.
