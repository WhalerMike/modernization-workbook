# Azure Security Engineering learning path, Module 2: DDoS protection and the web application firewall

**Deck name: Training_AZS_Module_2.** The narrated deck for [Module 2: DDoS protection and the web application firewall](../../docs/training/azure-security/02-ddos-protection-and-the-waf.md), in the learning path [*Azure Security Engineering*](../../docs/training/azure-security/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, the lab, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It covers Steps 3 and 4 of the [Azure Security Engineering implementation guide](../../docs/books/guides/azure-security-implementation.md). It is built with the shared kit in [`../_build/`](../_build/README.md), the path's helpers in [`../training-azs-module-1/shared.js`](../training-azs-module-1/shared.js) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; two layers, and a mode that acts; learning objectives and prerequisites |
| Concepts | The three DDoS tiers and what none covers; the plan, linked networks, logs and the attack alert; exercising the response through approved partners; the WAF and what the Zero Trust recommendations check; detection, tuning, prevention and rollback; what to plan for in commercial Azure, and the other clouds |
| Lab | Lab 2 steps 1 to 7 in a test subscription: DDoS state, plan, logs and alert; the WAF policy; a test request the WAF blocks and its log row (the lab wasn't run by the authors). The module's Lab 1 runs the kit on fictional fixtures, in [*Building Azure Security*](../../docs/project-plans/developer-workbooks/azure-security/index.md), Chapters 03 and 04, Lab 1; the deck doesn't repeat it |
| Check and summary | The federal requirement (SC-5, SI-4, SC-7, SI-10) and evidence; two knowledge-check questions with answers; the summary and Module 3 |

| File | Use |
|---|---|
| `Training_AZS_Module_2.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_AZS_Module_2_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_AZS_Module_2_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`) |
| `Training_AZS_Module_2_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_AZS_Module_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The MP4 is on the videos Release, and the [module page](../../docs/training/azure-security/02-ddos-protection-and-the-waf.md) links the video. The narrated deck and the plain deck come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-azs-module-2/build.js presentations/training-azs-module-2/Training_AZS_Module_2.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original (Microsoft Learn page titles, NIST, FedRAMP, and AWS, Google Cloud and Oracle documentation) and each workbook book or guide by its title. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/azure-security/_verification/learning-path.md), or the [Azure Security Engineering implementation guide](../../docs/books/guides/azure-security-implementation.md)'s sections the module sends the learner to (and the sources the guide footnotes, read November 11, 2026); the deck adds none. The lab's commands are the page's, with its placeholders, some shortened on the slides; the expected results are the guide's Validate statements, and the authors haven't run them. The module's labels carry over: design guidance, the lab not run by the authors, and evidence that *supports* a control, which the assessor decides.
