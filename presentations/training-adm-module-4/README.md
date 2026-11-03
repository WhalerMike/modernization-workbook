# Attribute-Driven Migration learning path, Module 4: Move Group Policy as code

**Deck name: Training_ADM_Module_4.** The narrated deck for [Module 4: Move Group Policy as code](../../docs/training/attribute-driven-migration/04-group-policy-as-code.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why Group Policy has to move as code (Gates 0, 5 and 8); learning objectives and prerequisites |
| Concepts | Where the code sits: one owner per setting, build unassigned, and what Learn says about Group Policy analytics; what Microsoft's import sample leaves to you; VK-INT-07 per GPO and the move plan's dispositions per setting; one file per policy and the linter (GPC-01 to GPC-10); diff, then create, and why the sync never sends PATCH or DELETE |
| Lab | Try it: Lab 1 steps 1 to 8: the gate, Microsoft's sample run twice, the eleven-row plan, the GPC-08 lint row, the dry run and apply, the sync record, the `usgov` refusal, the Drift that stops the apply, and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (CM-2, CA-7, CM-6, CM-3, AC-6, SA-11, SR-3), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_4.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_4_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 2,200 words) |
| `narration_Training_ADM_Module_4/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 14 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-4/build.js presentations/training-adm-module-4/Training_ADM_Module_4.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 06](../../docs/books/b19-developer-workbook/06-group-policy-as-code.md), or the code, configuration and fixtures in [`examples/group-policy-as-code`](../../examples/group-policy-as-code/README.md) and `examples/validation-kit`; the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with PowerShell 7.6.9 in a scratch copy of `examples/group-policy-as-code`, `examples/validation-kit` and `examples/third_party`, outside the repository. Every step ran offline, step 2 and the second apply in step 6 included, and the output matches the module page and the captures in `data/kit-captures/adm` (06-1 to 06-10). Table headers are dropped, long commands are wrapped with a trailing backslash or shortened, and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance where the module says so. The example code is illustrative and tested against fixtures, not against a production tenant.
