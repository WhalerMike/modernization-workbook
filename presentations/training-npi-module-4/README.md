# Non-Person Identity learning path, Module 4: Set the credential rules

**Deck name: Training_NPI_Module_4.** The narrated deck for [Module 4: Set the credential rules](../../docs/training/non-person-identity/04-credential-rules.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why the tenant enforces part of the rules and code does the rest; learning objectives and prerequisites |
| Concepts | The guide's Step 3; the two kinds of policy and how an exception overrides; the policy diff and plan (NPI-POL-01 to -06); rotation from approval to removal (NPI-ROT-01 to -07); the bodies the write path allows |
| Lab | Try it: Lab 1 steps 1 to 10: the permissions and the policy diff, the policy plan's dry run, apply and refused hash, the rotation plan and its run, and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (IA-5, IA-5(2), SC-12, SC-17, CM-3, CM-5, CM-6, AC-6 and SCuBA MS.AAD.5.5v1 to 5.7v1) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_NPI_Module_4.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_NPI_Module_4_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_NPI_Module_4_Narration_Script.md` | The spoken narration, slide by slide (about 2,100 words) |
| `narration_Training_NPI_Module_4/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-4/build.js presentations/training-npi-module-4/Training_NPI_Module_4.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/non-person-identity/_verification/learning-path.md), the guide and workbook sections the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) (Invoke-NpiCredentialPolicy.ps1, Invoke-NpiRotation.ps1, Invoke-NpiCredentialAction.ps1, powershell/NpiCredentialPolicy, tests/fixtures/ch04); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with PowerShell 7 and Pester 5 in a scratch copy of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, outside the repository. Long commands are wrapped with a trailing backslash, and output is trimmed, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance, and Lab 2 not run by the authors. The example code is illustrative and tested against fixtures, not proven against a live tenant.
