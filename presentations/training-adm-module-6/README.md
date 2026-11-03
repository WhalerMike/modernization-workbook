# Attribute-Driven Migration learning path, Module 6: Onboard servers with Ansible beside Arc

**Deck name: Training_ADM_Module_6.** The narrated deck for [Module 6: Onboard servers with Ansible beside Arc](../../docs/training/attribute-driven-migration/06-ansible-beside-arc.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the Lab 1 commands and their results, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the onboarding run is where owners are read; learning objectives and prerequisites |
| Concepts | One owner for configuration and one for patching, and who reads each tag; which Azure a GCC estate's servers go to; what Microsoft's `azure_arc` role leaves to you; the CMDB inventory and its three fail-closed rules; the wave plan and onboarding in check mode |
| Lab | Try it: Lab 1 steps 1 to 7: what the CMDB becomes and the role in check mode, the wave 0 plan and dry run, the broken CMDB copies and the tests; Lab 2 in a test subscription (not run by the authors) |
| Check and summary | The federal requirement (CM-8, CM-3, CM-4, CM-3(2), SR-3, SA-10, and AC-6, IA-5, CM-8(1) and CA-7 in Lab 2), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_6.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_6_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_6_Narration_Script.md` | The spoken narration, slide by slide (about 2,350 words) |
| `narration_Training_ADM_Module_6/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 16 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-6/build.js presentations/training-adm-module-6/Training_ADM_Module_6.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 08](../../docs/books/b19-developer-workbook/08-ansible-beside-arc.md), or the code, configuration and fixtures in [`examples/ansible`](../../examples/ansible/README.md); the deck adds none.

**The Try it results are not a fresh run.** Lab 1 installs Ansible collections from Galaxy and needs a Linux control node, so its Ansible steps were not re-run for this deck: the lines marked `->` are the expected results from Chapter 08's Lab 1 text, as the verification log records for this module (claim 6: carried, not re-run), and the slides say so. Two checks that run on Windows were re-run on November 3, 2026, with Python 3.14.3 in a scratch copy of `examples/ansible` and `examples/third_party`, outside the repository, and are shown as printed: the `updatemanager` copy (`line 3: unknown patch_owner 'updatemanager'`, exit 1) and `python -m pytest examples/ansible/tests` (`74 passed, 16 skipped`). Long commands are shortened, with "..." marking each cut. The module's labels carry over: design guidance where the module says so. The example code is illustrative and tested against fixtures, not against a production estate.
