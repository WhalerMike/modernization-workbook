# HR-Driven Identity learning path, Module 5: Check certificate-based authentication

**Deck name: Training_HR_Module_5.** The narrated deck for [HR-Driven Identity, Module 5: Check certificate-based authentication](../../docs/training/hr-driven-identity/05-certificate-based-authentication.md), in the [HR-Driven Identity learning path](../../docs/training/hr-driven-identity/index.md) (Gate G5 Credentials). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why revocation is the weak link in card sign-in; learning objectives and prerequisites |
| Concepts | Credentials follow HR events (Unit 1); the CRL limits per cloud; the measurement; the check, CB-01 to CB-13, in two slides (Unit 2) |
| Lab | Try it: Lab 1 steps 1 and 2 (the reads and the CRL measurement), step 3 (the check for GCC) and step 4 (the same tenant for GCC High, and why CB-05 drops away); Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_HR_Module_5.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_HR_Module_5_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_HR_Module_5_Narration_Script.md` | The spoken narration, slide by slide (about 1,900 words) |
| `narration_Training_HR_Module_5/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 12 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-hr-module-5/build.js presentations/training-hr-module-5/Training_HR_Module_5.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, neutrality, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the path's [verification log](../../docs/training/hr-driven-identity/_verification/learning-path.md), or the code and fixtures in [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md) (`cba_check.py`, `config/cba-expected.json`, `tests/fixtures/ch05`); the deck adds none. The **Try it** output is what the commands printed on November 2, 2026, run in a scratch copy of `examples/` with Python 3.14.3, and it is trimmed where the slide says so: one Graph path shortened with `...`, step 3's long finding lines cut with `...` and its last six Warns summarized in one line, step 4 shown to its first two output lines, and the long commands wrapped with `\`. The module's labels carry over: design guidance (the 80 percent warning and the 90-day CA expiry warning). The CA names, thumbprints and OIDs are fictional. The example code is illustrative and tested against fixtures, not proven against a live tenant.
