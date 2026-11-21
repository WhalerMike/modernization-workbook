# Non-Person Identity learning path, Module 8: Convert Kerberos accounts to gMSAs and dMSAs

**Deck name: Training_NPI_Module_8.** The narrated deck for [Module 8: Convert Kerberos accounts to gMSAs and dMSAs](../../docs/training/non-person-identity/08-gmsa-dmsa-and-the-kerberos-island.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why converting a Kerberos account isn't the end; learning objectives and prerequisites |
| Concepts | The gate (the guide's Steps 2, 3 and 5, and the rollback); the four dispositions and the program's rules; the check (NPI-KRB-01 to -10); the plan, one action per account, and who sends each write (the pipeline's gMSA or a person); the island list, the reconciliation and the separate write path |
| Lab | Try it: Lab 1 steps 1 to 10: the register, Learn's procedures and each task's cmdlets, the check and its findings, the plan, the island list and the reconciliation, the dry run as the pipeline, the apply to the fake as the pipeline and as a person, and the refused hash, and the tests; Lab 2 in a test domain (not run by the authors) |
| Check and summary | The federal requirement (IA-5, IA-9, AU-2; the module's evidence table) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_NPI_Module_8.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_NPI_Module_8_Narrated.vtt` | The video's caption track; the Watch page and the module page read it from here, and `scripts/generate_video_manifest.py` lists the video because it is here |
| `Training_NPI_Module_8_Narration_Script.md` | The spoken narration, slide by slide (about 3,230 words) |
| `narration_Training_NPI_Module_8/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The MP4 is on the videos Release, and the [module page](../../docs/training/non-person-identity/08-gmsa-dmsa-and-the-kerberos-island.md) links the video. The narrated deck and the plain deck are on the edition 2026.11.5 Release. The narration runs about 20 minutes. It was re-recorded on November 21, 2026 from the module as approved on November 20, 2026, after the managed service account standard changed the write path; slides whose narration didn't change keep their earlier recording.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-8/build.js presentations/training-npi-module-8/Training_NPI_Module_8.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/non-person-identity/_verification/learning-path.md), the guide's sections and the workbook's [Chapter 06](../../docs/project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md) that the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md); the deck adds none. The **Try it** output is what the commands printed when re-run on November 20, 2026, after the managed service account standard changed the write path, run with PowerShell 7 and Pester 5 in a scratch copy of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, outside the repository. Long lines are wrapped and the output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance for the program's rules and the KSI mapping. The example code is illustrative and tested against fixtures, not proven against a live domain.
