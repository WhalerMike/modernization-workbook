# Non-Person Identity learning path, Module 11: Deploy to test, then production

**Deck name: Training_NPI_Module_11.** The narrated deck for [Module 11: Deploy to test, then production](../../docs/training/non-person-identity/11-deploying-to-test-and-production.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why a deployment proves what each Lab 2 can't; learning objectives and prerequisites; Chapter 11 held for review and not run against a live tenant |
| Concepts | The safe order; before you start (PIM roles, approvals, the change record); the settings file's four rules; the five deploy scripts; the stages and the promotion (PF-11, the nine go/no-go rows) |
| Lab | Try it: Lab 1 steps 1 to 10, the dry run: the template refused and the test preflight, the smoke test, the rollback planned, refused and dry-run, production's preflight, the evidence check's NO-GO and the deploy tests; Lab 2, the live test stage then production (not run by anyone) |
| Check and summary | The federal requirement (CM-3, CM-5, AC-5, IA-5, IA-9, AC-6, CA-7, CM-2, CM-4(2), AC-2, CM-8, IA-4, AU-2, AU-12, AU-9 and CP-10) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_NPI_Module_11.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_NPI_Module_11_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_NPI_Module_11_Narration_Script.md` | The spoken narration, slide by slide (about 2,200 words) |
| `narration_Training_NPI_Module_11/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-11/build.js presentations/training-npi-module-11/Training_NPI_Module_11.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/non-person-identity/_verification/learning-path.md), the guide and workbook sections the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) (deploy/NpiDeploy.psm1 and its five scripts, deploy/settings.template.json, deploy/tests, tests/fixtures/deploy); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with PowerShell 7 and Pester 5 in a scratch copy of `examples/non-person-identity`, outside the repository. Long commands are trimmed, and output is trimmed and reflowed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance, Chapter 11 held for review, and Lab 2 not run by anyone. The deploy scripts are illustrative: tested against fictional tenants served by a fake, never run against a live tenant or forest. Step 10's deploy tests printed 55 passed in a new PowerShell session, and 54 passed, 1 failed in the same session as steps 1 to 9 (one test reads the exit code step 8 leaves); the module page now says to run step 10 in a new session.
