# Non-Person Identity learning path, Module 6: Conditional Access for workload identities

**Deck name: Training_NPI_Module_6.** The narrated deck for [Module 6: Conditional Access for workload identities](../../docs/training/non-person-identity/06-conditional-access.md), in the [Non-Person Identity learning path](../../docs/training/non-person-identity/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; the four limits and why the scope matters as much as the policy; learning objectives and prerequisites |
| Concepts | The guide's Step 4d and 4e; CA015, CA037, D-N4, D-N5 and one policy per ring; the pre-merge check (NPI-WCA-01 to -09); the plan's six actions and no delete; enforcement's five conditions and the sign-in reader |
| Lab | Try it: Lab 1 steps 1 to 10: the permissions and two pre-merge checks, the plan, the sign-in summary, applying twice, enforcing Ring 1 and editing one byte, the alert; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (the Conditional Access part of G4) and evidence; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_NPI_Module_6.pptx` | The deck: 17 narrated slides (the title and 16 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_NPI_Module_6_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_NPI_Module_6_Narration_Script.md` | The spoken narration, slide by slide (about 2,300 words) |
| `narration_Training_NPI_Module_6/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 14 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-npi-module-6/build.js presentations/training-npi-module-6/Training_NPI_Module_6.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/non-person-identity/_verification/learning-path.md), the guide and workbook chapter sections the module sends the learner to, or the code, configuration and fixtures in [`examples/non-person-identity`](../../examples/non-person-identity/README.md) (Invoke-NpiWorkloadCa.ps1, powershell/NpiWorkloadCa, workload-ca/ and tests/fixtures/ch08); the deck adds none. The **Try it** output is what the commands printed on November 3, 2026, run with PowerShell 7 and Pester 5 in a scratch copy of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, outside the repository. Long commands are wrapped with a trailing backslash, and step 4's five rows are shown on one line, step 7's script block and step 9's object IDs are trimmed, and step 8 is shown as the three plan lines it prints, with "..." marking each cut, as the slides say. The module's labels carry over: design guidance, and Lab 2 not run by the authors. The example code is illustrative and tested against fixtures, not proven against a live tenant.
