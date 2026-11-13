# Azure Security Engineering learning path, Module 3: The edge and the egress

**Deck name: Training_AZS_Module_3.** The narrated deck for [Module 3: The edge and the egress](../../docs/training/azure-security/03-the-edge-and-the-egress.md), in the learning path [*Azure Security Engineering*](../../docs/training/azure-security/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, the lab, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It covers Steps 5 and 6 of the [Azure Security Engineering implementation guide](../../docs/books/guides/azure-security-implementation.md). It is built with the shared kit in [`../_build/`](../_build/README.md), the path's helpers in [`../training-azs-module-1/shared.js`](../training-azs-module-1/shared.js) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; a WAF around which traffic flows protects nothing; learning objectives and prerequisites |
| Concepts | Front Door, Application Gateway or both; locking the origin with Private Link or the tag and header; TLS, probes and failover; Azure Firewall and the Zero Trust checks; alert first, then deny through a draft; regions to check first in Azure Government, and OCI Network Firewall |
| Lab | Lab 2 steps 1 to 10 in a test subscription: the refused direct request, access restriction, TLS policy, failover (writes, then undone), effective routes, deny modes, the threat-intelligence test and its log row (the module has no Lab 1, because the guide has no kit yet; the lab wasn't run by the authors) |
| Check and summary | The federal requirement (SC-7, SC-8, CP-2, SC-7(5), SI-4) and evidence; two knowledge-check questions with answers; the summary and Module 4 |

| File | Use |
|---|---|
| `Training_AZS_Module_3.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_AZS_Module_3_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_AZS_Module_3_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`) |
| `Training_AZS_Module_3_Narration_Script.md` | The spoken narration, slide by slide (about 1,910 words) |
| `narration_Training_AZS_Module_3/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page links the video once it is on the videos Release. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-azs-module-3/build.js presentations/training-azs-module-3/Training_AZS_Module_3.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original (Microsoft Learn page titles, NIST, FedRAMP, and AWS, Google Cloud and Oracle documentation) and each workbook book or guide by its title. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/azure-security/_verification/learning-path.md), or the [Azure Security Engineering implementation guide](../../docs/books/guides/azure-security-implementation.md)'s sections the module sends the learner to (and the sources the guide footnotes, read November 11, 2026); the deck adds none. The lab's commands are the page's, with its placeholders, some shortened on the slides; the expected results are the guide's Validate statements, and the authors haven't run them. The module's labels carry over: design guidance, the lab not run by the authors, and evidence that *supports* a control, which the assessor decides.
