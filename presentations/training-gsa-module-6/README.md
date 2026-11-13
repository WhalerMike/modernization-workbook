# Global Secure Access learning path, Module 6: Rings, rollback and the evidence package

**Deck name: Training_GSA_Module_6.** The narrated deck for [Module 6: Rings, rollback and the evidence package](../../docs/training/global-secure-access/06-rings-rollback-and-the-evidence-package.md), in the learning path [*Global Secure Access as the Identity-Aware Network*](../../docs/training/global-secure-access/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, the lab, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It covers guide Steps 11 and 12 (evidence) of [Global Secure Access & Zero Trust Network Engineering: An Implementation Guide](../../docs/books/guides/global-secure-access-implementation.md). It is built with the shared kit in [`../_build/`](../_build/README.md), the path's helpers in [`../training-gsa-module-1/shared.js`](../training-gsa-module-1/shared.js) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why: a pilot becomes a migration, then evidence; learning objectives and prerequisites |
| Concepts | Four rings and their exit criteria; coexistence with the VPN, DirectAccess, a proxy and a third-party SSE, and branch parity; the RACI and who decides closure; five states and five kinds of evidence; the metrics and the rollback order |
| Lab | Lab 2 steps 1 to 12 in a test tenant, never production (the path has no Lab 1; Lab 2 not run by the authors), rolling the test tenant back in the guide's order |
| Check and summary | The federal requirement (CM-3, CM-4, CP-2; AU-2, AU-6, AU-12, SI-4) and evidence; two knowledge-check questions with answers; the summary |

| File | Use |
|---|---|
| `Training_GSA_Module_6.pptx` | The deck: 13 narrated slides (the title and 12 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_GSA_Module_6_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_GSA_Module_6_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`) |
| `Training_GSA_Module_6_Narration_Script.md` | The spoken narration, slide by slide (about 1,800 words) |
| `narration_Training_GSA_Module_6/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page links the video once it is on the videos Release. The narration runs about 11 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-gsa-module-6/build.js presentations/training-gsa-module-6/Training_GSA_Module_6.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original (Microsoft Learn's Global Secure Access and Microsoft Graph pages, CISA's TIC 3.0 use cases, NIST, OMB, fedramp.gov) and each workbook book by its title. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/global-secure-access/_verification/learning-path.md), or the implementation guide's sections the module sends the learner to (and the sources the guide footnotes, read November 11, 2026); the deck adds none. The guide has no kit, so no slide shows kit output; the lab slides show the module's Lab 2 commands, abbreviated, with the guide's placeholders, and say the authors haven't run them. Availability is stated for GCC only. The module's labels carry over: design guidance, Lab 2 not run by the authors, and evidence that *supports* a control, which the assessor decides.
