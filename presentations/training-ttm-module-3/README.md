# Ticket-to-Machine learning path, Module 3: One Writer per Attribute

**Deck name: Training_TTM_Module_3.** The narrated deck for [Ticket-to-Machine, Module 3: One Writer per Attribute](../../docs/training/ticket-to-machine/03-one-writer-per-attribute.md), in the [Ticket-to-Machine learning path](../../docs/training/ticket-to-machine/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, two **Try it** slides with the real Lab 1 commands and output, Lab 2, where agencies are with the government-cloud availability, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why drift that comes back means two writers; learning objectives and prerequisites |
| Concepts | The two gaps Gate 2 closes; the two writer patterns ("not both"); one approver system per class and the lane table (inference); what `writer_check.py` reads; Finding, Warn and Info, the alias list and the directory name; what the check guards against and misses |
| Lab | Try it: Lab 1 steps 1 to 3 (the two writers, then the alias) and steps 4 and 5 (the directory guard, the two reads); Lab 2 on exports from a test tenant and a SailPoint sandbox (not run by the authors) |
| Where agencies are | The HR feed's starting state, Gate 2's availability in Azure for US Government and GCC, and the interim path |
| Check and summary | The federal requirement (AC-5, CM-3, AC-2, Book 13's L4 acceptance; CM-6, CM-4, CA-7, SI-4) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_TTM_Module_3.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_TTM_Module_3_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_TTM_Module_3_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_TTM_Module_3/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes. It uses the Microsoft Automation decks' helpers, [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js), and sets this path's title slide and document title itself |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ttm-module-3/build.js presentations/training-ttm-module-3/Training_TTM_Module_3.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units and the pages they send the learner to, which isn't spoken. Every fact on a slide comes from the module page, the pages it links (its [verification log](../../docs/training/ticket-to-machine/_verification/index.md) says the module adds no facts of its own), or the code and fixtures in [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run exactly as the module gives them in a copy of the kit outside the repository (Python 3.14.3). It is trimmed where the slides say so: the long commands are wrapped with `\`, one Warn line and the `kit_calls.py` task description end in "...", the alias run shows only its summary and the new Finding, the blank lines and the `needs:` lines of the permission listing are left out, and step 1's test count is quoted under the panel. The module's labels carry over: design guidance and inference.
