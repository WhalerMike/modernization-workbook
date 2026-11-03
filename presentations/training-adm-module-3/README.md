# Attribute-Driven Migration learning path, Module 3: Keep dynamic rules as code

**Deck name: Training_ADM_Module_3.** The narrated deck for [Module 3: Keep dynamic rules as code](../../docs/training/attribute-driven-migration/03-dynamic-rules-as-code.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a dynamic rule is access policy; learning objectives and prerequisites |
| Concepts | The two guards, the coded slots and the engine's limits; what Learn's incident samples leave to you; one file per group and the offline evaluator; the linter (DR-01 to DR-11), the shadow diff and the pause manifest |
| Lab | Try it: Lab 1 steps 1 to 6: Learn's samples against a fake tenant (the held group resumed, GCCHigh to the worldwide host), the program's rule pattern table linted, a rule evaluated, the pull request check, a broken rule and the 70 tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2, AC-3, CM-3, CM-4, CM-3(2), SA-11, SR-3, and AC-6 in Lab 2), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_3.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_3_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_3_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_ADM_Module_3/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-3/build.js presentations/training-adm-module-3/Training_ADM_Module_3.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 04](../../docs/books/b19-developer-workbook/04-dynamic-rules-as-code.md), or the code, rules and fixtures in [`examples/dynamic-rules`](../../examples/dynamic-rules/README.md); the deck adds none. The narration names the original source the chapter footnotes for each fact (Microsoft Learn pages, NIST SP 800-53, FedRAMP's Key Security Indicators), and says plainly where a rule is the kit's design or this workbook's guidance. The **Try it** output is what the commands printed on November 3, 2026, run with PowerShell 7.6.9 in a scratch copy of `examples/dynamic-rules`, the pinned Learn pages in `examples/third_party/dynamic-membership-samples` and Book 03 (one test reads its rule table), committed to a throwaway Git repository outside this one because steps 4 and 5 compare the library with `HEAD`; it matches the module page and the captures in `data/kit-captures/adm` (04-1 to 04-9). Long commands are shortened or wrapped, and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance where the module says so. The example code is illustrative: tested against fixtures and a fake tenant, and the evaluator follows Learn's syntax page but isn't the service.
