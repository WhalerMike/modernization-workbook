# Attribute-Driven Migration learning path, Module 1: Send HR records through a middleware that fails closed

**Deck name: Training_ADM_Module_1.** The narrated deck for [Module 1: Send HR records through a middleware that fails closed](../../docs/training/attribute-driven-migration/01-the-hr-middleware.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the middleware is where a record is first checked; learning objectives and prerequisites |
| Concepts | What the middleware owns and what the provisioning service owns, and what a 202 means; what Microsoft's CSV2SCIM sample leaves to you; fail closed and the quarantine; sending the whole record, ordering and the mass-disable hold; the provenance manifest and why `bulkId` is the person key |
| Lab | Try it: Lab 1 steps 1 to 8: the run and its quarantine, the provenance hash and the identical rerun, the broken row, the held run and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (SI-10, AC-2, IA-4, CM-3, AU-3, SA-11, SR-3, and AC-6, IA-5 and AU-6 in Lab 2), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_1.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_1_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_1_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_ADM_Module_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-1/build.js presentations/training-adm-module-1/Training_ADM_Module_1.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 01](../../docs/books/b19-developer-workbook/01-the-hr-to-entra-middleware.md), or the code, configuration and fixtures in [`examples/hcm-entra`](../../examples/hcm-entra/README.md); the deck adds none. The narration names the original source the chapter footnotes for each fact (Microsoft Learn pages, Microsoft's CSV2SCIM sample, NIST SP 800-53, FedRAMP's Key Security Indicators), and says plainly where a rule is the kit's design or this workbook's guidance. The **Try it** output is what the commands printed on November 3, 2026, run with Python 3.14.3 in a scratch copy of `examples/hcm-entra`, outside the repository; it matches the module page and the captures in `data/kit-captures/adm` (01-2 to 01-8). Long commands are wrapped with a trailing backslash or shortened, and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance where the module says so. The example code is illustrative and tested against fixtures, not against a production tenant.
