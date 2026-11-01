# Microsoft Automation learning path, Module 1: Graph and Azure Foundations

**Deck name: Training_MS_Automation_Module_1.** The narrated deck for [Microsoft Automation, Module 1: Graph and Azure Foundations](../../docs/training/ms-automation-foundations.md), in the Microsoft Automation learning path ([Training](../../docs/training/index.md#microsoft-automation-learning-path)). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, a **Try it** slide with the real Lab 1 command and output, Lab 2, where agencies are with the government-cloud differences, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why it matters; learning objectives and prerequisites |
| Concepts | Clouds and endpoints, signing in as a workload, permissions and tools, the four request patterns and throttling limits |
| Lab | Try it: Lab 1 steps 2 to 5: the unknown cloud, the permissions for `stale-users`, the undeclared call, the host refusal and the pattern tests; Lab 2 in a test tenant (not run by the authors) |
| Where agencies are | The starting state, what differs in GCC High and DoD, and the interim paths |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_MS_Automation_Module_1.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_MS_Automation_Module_1_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_MS_Automation_Module_1_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_MS_Automation_Module_1/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |
| `shared.js` | The helpers all three training decks use: the technical deep dive's [`slides.js`](../attribute-driven-migration-technical-part-1/slides.js) builders, the deeper dive's code panel, and the title, objectives and knowledge-check slides |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page says so. The narration runs about 14 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ms-automation-module-1/build.js presentations/training-ms-automation-module-1/Training_MS_Automation_Module_1.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, its footnotes and verification log, or the code and fixtures in [`examples/ms-automation`](../../examples/ms-automation/README.md); the deck adds none. The **Try it** output is what the command printed on November 1, 2026, trimmed where the slide says so. The module's labels carry over: design guidance, inference and beta. The example code is illustrative and tested against fixtures, not proven against a live tenant.
