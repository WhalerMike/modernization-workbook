# Non-Person Identity learning path, Module 13: Run the managed service account standard

**Deck name: Training_NPI_Module_13.** The narrated deck for [Module 13: Run the managed service account standard](../../docs/training/non-person-identity/13-the-managed-service-account-standard.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why one standard for every managed service account (SailPoint approves, ServiceNow records, Microsoft's tools create and enforce); learning objectives and prerequisites |
| Concepts | Who does what, and what each system never does; the standard's settings; machines run the steps, people decide (AC-2(1), AC-2(3), AC-2(4), KSI-IAM-AAM, CISA's Zero Trust Maturity Model); the steps S1 to S11 |
| Lab | Try it: Lab 1 steps 1 to 6, Chapter 12's checks on the kit's fixtures: the run, the findings and `gmsa-ops$`, the inputs handed to Chapter 06, the certifications and ServiceNow findings, the retirement list and the cleanup; Lab 2, the same checks on a test domain's exports (not run by the authors) |
| Check and summary | The federal requirement (AC-2, IA-4, CM-8, AC-6, AC-6(7) and AC-2(3)) and evidence; two knowledge-check questions with answers; the summary and the next step |

| File | Use |
|---|---|
| `Training_NPI_Module_13.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_NPI_Module_13_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_NPI_Module_13_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_NPI_Module_13/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narration was recorded on November 21, 2026 from the module as approved. The MP4, the narrated deck and the plain deck aren't on a Release yet. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-13/build.js presentations/training-npi-module-13/Training_NPI_Module_13.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the companion guide's [managed service account standard](../../docs/books/guides/service-account-migration.md#msa-standard) and workbook [Chapter 12](../../docs/project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) (`Invoke-NpiGmsaStandard.ps1`, `powershell/NpiGmsaStandard`, `tests/fixtures/ch12`); the deck adds none. The **Try it** output is the kit's captures of Chapter 12's Lab 1, [`data/kit-captures/npi/12-1.txt`](../../data/kit-captures/npi/12-1.txt) to `12-5.txt` and `12-8.txt`, written by `scripts/kit_captures.py` on the fictional fixtures with `-AsOf 2026-11-20`. Long commands and output are trimmed, wrapped and reflowed, with "..." marking each cut, as the slides say. The module's labels carry over: the standard is design guidance, the products' export field names aren't specified, so the kit reads its own import formats, and Lab 2 hasn't been run by the authors. Approval is SailPoint, reached through the agency's system access management tool; the deck names no agency.
