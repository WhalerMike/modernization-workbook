# Defender XDR learning path, Module 1: Architecture, access and onboarding

**Deck name: Training_XDR_Module_1.** The narrated deck for [Module 1: Architecture, access and onboarding](../../docs/training/defender-xdr/01-architecture-access-and-onboarding.md), in the learning path [*Defender XDR Engineering and Operations*](../../docs/training/defender-xdr/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, the lab, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md), the path's helpers in [`../training-xdr-module-1/shared.js`](../training-xdr-module-1/shared.js) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a license is not a defended endpoint; learning objectives and prerequisites |
| Concepts | Components, two boundaries and one control plane per setting; what each government cloud has, GCC first; roles through PIM and the read path; onboarding by management plane, ring by ring; sensor health |
| Lab | Lab 2 steps 1 to 6 in a test tenant, never production (the path has no Lab 1; Lab 2 not run by the authors) |
| Check and summary | The federal requirement (AC-2, AC-6, AU-9 (4), CM-8, SI-4, OMB M-22-09) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_XDR_Module_1.pptx` | The deck: 13 narrated slides (the title and 12 content slides), then a backup section with the sources |
| `Training_XDR_Module_1_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_XDR_Module_1_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`; written once the narrated deck exists) |
| `Training_XDR_Module_1_Narration_Script.md` | The spoken narration, slide by slide (about 2,190 words) |
| `narration_Training_XDR_Module_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition, and the module page links the video once it is on the videos Release. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-xdr-module-1/build.js presentations/training-xdr-module-1/Training_XDR_Module_1.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original (Microsoft Learn's Defender for Endpoint, Defender XDR, Defender for Identity, Defender for Cloud Apps, Security Exposure Management and Microsoft Graph security API pages; NIST; OMB) and each workbook book by its title, and spells out the acronyms the voice would misread. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/defender-xdr/_verification/learning-path.md), the [Defender XDR implementation guide](../../docs/books/guides/defender-xdr-implementation.md)'s Steps 1 and 2 and the sections the module sends the learner to (and the sources the guide footnotes, read November 11, 2026), or the book chapters the guide links; the deck adds none. The guide has no kit, so no slide shows kit output; Lab 2's commands are the page's, with its placeholders, shortened or wrapped where a slide says so, and the authors haven't run them. The baseline is Microsoft 365 GCC; GCC High and DoD appear as side notes. The module's labels carry over: risk-based recommended for the program's design, Lab 2 not run by the authors, and evidence that *supports* a control, which the assessor decides. Windows clients and Windows Server only.
