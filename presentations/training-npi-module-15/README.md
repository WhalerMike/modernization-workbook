# Non-Person Identity learning path, Module 15: Your first gMSA: set up the forest, then create a new gMSA

**Deck name: Training_NPI_Module_15.** The narrated deck for [Module 15: Your first gMSA](../../docs/training/non-person-identity/15-your-first-gmsa.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why start from nothing (every other lab starts from an old account); learning objectives and prerequisites |
| Concepts | The forest's one-time setup in order (the KDS root key, the OUs, `DL-gMSA-Creators` and its `dsacls` right, `gmsa-msapipe`); the KDS root key, its 10-hour wait and the single-DC test key; a new gMSA for a new application (S1 to S5, and what it skips); an SPN only when the workload needs one (`setspn -S`) |
| Lab | Try it: Lab 1 steps 1 to 8 on the kit's fixtures: Learn's KDS and gMSA steps on the stand-ins, Chapter 12's request check (two passed, one held), what goes to Chapter 06, Chapter 06's one-account plan, and its dry run before and after the forest has a KDS root key; Lab 2, the setup and the gMSA in a test domain (not run by anyone) |
| Check and summary | The federal requirement (S1, S3, S4 and S5: AC-2, IA-4, CM-8, CM-3, AC-5, AC-6, IA-5, AC-2(1), AC-6(5), CM-6) and evidence; two knowledge-check questions with answers; the summary and the next step, Module 8 |

| File | Use |
|---|---|
| `Training_NPI_Module_15.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with the sources |
| `Training_NPI_Module_15_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_NPI_Module_15_Narration_Script.md` | The spoken narration, slide by slide (about 2,000 words) |
| `narration_Training_NPI_Module_15/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 24, 2026. The MP4 is on the videos Release; the narrated deck and the plain deck join the next edition's Release. The video runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-15/build.js presentations/training-npi-module-15/Training_NPI_Module_15.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. The narration names each source by its original publisher (Microsoft Learn, NIST, FedRAMP) and spells out the acronyms the voice would misread (G M S A, K D S, S P N, O U, A E S). Every fact on a slide comes from the module page, the companion guide's [Set it up once](../../docs/books/guides/service-account-migration.md#msa-standard-setup) and [A new gMSA for a new workload](../../docs/books/guides/service-account-migration.md#msa-standard-new-gmsa) and the steps they link, or the code and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) (`Invoke-NpiGmsaStandard.ps1`, `New-NpiKrbGmsaPlan`, `Invoke-NpiKerberosIslandAction.ps1`, `tests/fixtures/m15`); the deck adds none. The **Try it** output was run on the fictional fixtures with `-AsOf 2026-11-20` and is checked by `tests-m15/NpiFirstGmsa.Tests.ps1` (9 tests). Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, as the slides say. The guide's labels carry over: the `dsacls` delegation is design guidance, the backdated KDS key is for a single-DC test domain only, and Lab 2 hasn't been run by anyone.
