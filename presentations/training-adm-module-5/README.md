# Attribute-Driven Migration learning path, Module 5: Build machine configuration packages

**Deck name: Training_ADM_Module_5.** The narrated deck for [Module 5: Build machine configuration packages](../../docs/training/attribute-driven-migration/05-machine-configuration.md), in the [Attribute-Driven Migration learning path](../../docs/training/attribute-driven-migration/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the Lab 1 commands and their results, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a package needs a checked build (Gate 5); learning objectives and prerequisites |
| Concepts | A package, a policy definition and a guest assignment, and the three case-sensitive assignment types; what Learn's cmdlets leave to you; the release registry; the MOF cleaner, the package check (7 rules) and the definition check (9 rules); the provenance manifest and its two kinds of hash |
| Lab | Try it: Lab 1 steps 1 to 7: Learn's steps by hand and what the checks say about them, Microsoft's pinned sample, the checked build and its matching MOF hashes, the registry broken three ways, and the tests; Lab 2 in a test subscription (not run by the authors) |
| Check and summary | The federal requirement (SR-3, SA-10, SA-11, CM-3(2), SI-7, CM-2, CM-6, and AC-6 and IA-5 in Lab 2), the KSIs and the evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_ADM_Module_5.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_ADM_Module_5_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_ADM_Module_5_Narration_Script.md` | The spoken narration, slide by slide (about 2,150 words) |
| `narration_Training_ADM_Module_5/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 14 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-adm-module-5/build.js presentations/training-adm-module-5/Training_ADM_Module_5.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/attribute-driven-migration/_verification/learning-path.md), [Book 19, Chapter 07](../../docs/books/b19-developer-workbook/07-machine-configuration-packages.md), or the code, configuration and fixtures in [`examples/machine-configuration`](../../examples/machine-configuration/README.md); the deck adds none.

**The Lab 1 results aren't re-run.** Step 1 downloads three pinned modules from the PowerShell Gallery, which wasn't done for this deck, and there are no captures for Chapter 07. So the **Try it** slides show each command with the result Chapter 07's Lab 1 text gives, and their label says so, as the verification log does for this module (claim 5). Two checks need none of those modules, and were re-run on November 3, 2026 with PowerShell 7.6.9 in a scratch copy of `examples/machine-configuration` and `examples/third_party`, outside the repository: `Test-McMofText` on Microsoft's published MOF printed nothing, and `Invoke-Pester ./tests` without `MC_MODULE_PATH` gave 49 passed and 16 skipped, both as the chapter says. Long commands are wrapped with a trailing backslash or shortened, as the slides say. The module's labels carry over: design guidance where the module says so. The example code is illustrative and tested against fixtures, not against a production subscription.
