# Ticket-to-Machine learning path, Module 2: The Boundary and Least Privilege

**Deck name: Training_TTM_Module_2.** The narrated deck for [Ticket-to-Machine, Module 2: The Boundary and Least Privilege](../../docs/training/ticket-to-machine/02-boundary-and-least-privilege.md), in the [Ticket-to-Machine learning path](../../docs/training/ticket-to-machine/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, two **Try it** slides with the real Lab 1 commands and output, Lab 2, where agencies are on the FedRAMP Marketplace, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why "to make it work" is the wrong grant; learning objectives and prerequisites |
| Concepts | Gate 1's six steps; the four integration identities and the vendor-cloud data flows; the call list and `kit_calls.py`; ServiceNow roles split by task; ISC scopes and Graph permissions per task; what a client-credentials token can't do in ISC |
| Lab | Try it: Lab 1 Part A (an extra `itil` role, a reused verifier role) and Part B (a manage scope, the workflow client, the Graph audit permission); Lab 2 in a ServiceNow developer instance and a SailPoint sandbox (not run by the authors) |
| Where agencies are | The products on the FedRAMP Marketplace (read November 1, 2026) and the interim path |
| Check and summary | The federal requirement (SA-9, FedRAMP, CA-3, IA-5, AC-6, AC-2, AC-5, CM-3) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_TTM_Module_2.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_TTM_Module_2_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_TTM_Module_2_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_TTM_Module_2/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes. It uses the Microsoft Automation decks' helpers, [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js), and sets this path's title slide and document title itself |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ttm-module-2/build.js presentations/training-ttm-module-2/Training_TTM_Module_2.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units and the pages they send the learner to, which isn't spoken. Every fact on a slide comes from the module page, the pages it links (its [verification log](../../docs/training/ticket-to-machine/_verification/index.md) says the module adds no facts of its own), or the code and fixtures in [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run exactly as the module gives them in a copy of the kit outside the repository (Python 3.14.3). It is trimmed where the slides say so: blank lines and the listings' column padding are removed, one long privilege line ends in "...", the evidence task's listing and the Part B listings are cut to the lines that matter, and the test counts for steps 1, 5 and 6 are quoted under the panels. The module's labels carry over: design guidance and inference.
