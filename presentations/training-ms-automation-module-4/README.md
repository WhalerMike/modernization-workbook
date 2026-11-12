# Microsoft Automation learning path, Module 4: Azure Arc through Azure Resource Manager and Resource Graph

**Deck name: Training_MS_Automation_Module_4.** The narrated deck for [Microsoft Automation, Module 4: Azure Arc through Azure Resource Manager and Resource Graph](../../docs/training/ms-automation-arc.md), in the Microsoft Automation learning path ([Training](../../docs/training/index.md#microsoft-automation-learning-path)). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, a **Try it** slide with the real Lab 1 command and output, Lab 2, where agencies are with the government-cloud differences, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the server estate needs its own evidence, and the workbook's server standard; learning objectives and prerequisites |
| Concepts | Resource Manager versus Graph; Resource Graph's four traps, paging and throttling; machines, extensions and SQL Server; policy enforcement and product lifecycle; the five checks |
| Lab | Try it: Lab 1 steps 3 and 7: `lifecycle` on the Arc fixture, trimmed, and a Resource Graph query with no scope; Lab 2 in a test subscription with Reader only (not run by the authors) |
| Where agencies are | The starting state, GCC on commercial Azure and the interim paths; what differs in Azure Government for GCC High and DoD |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary |

| File | Use |
|---|---|
| `Training_MS_Automation_Module_4.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_MS_Automation_Module_4_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_MS_Automation_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 2,350 words) |
| `narration_Training_MS_Automation_Module_4/` | `durations.json` and `sentences.json` (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page says so once the video is on the videos Release. The narration runs about 16 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-ms-automation-module-4/build.js presentations/training-ms-automation-module-4/Training_MS_Automation_Module_4.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, its footnotes and verification log, or the code and fixtures in [`examples/ms-automation`](../../examples/ms-automation/README.md); the deck adds none. The **Try it** output is what the command printed on November 12, 2026, evaluated as of November 3, 2026 (the same output the page shows), trimmed where the slide says so. The module's labels carry over: design guidance, inference and unverified. The example code is illustrative and tested against fixtures, not proven against a live subscription.
