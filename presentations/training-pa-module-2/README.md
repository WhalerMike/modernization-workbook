# Privileged Access learning path, Module 2: Emergency access first

**Deck name: Training_PA_Module_2.** The narrated deck for [Module 2: Emergency access first](../../docs/training/privileged-access/02-emergency-access-first.md), in the [Privileged Access learning path](../../docs/training/privileged-access/index.md). It teaches the module the way Microsoft Learn does: the learning objectives, the concepts, **Try it** slides with the real Lab 1 commands and output, Lab 2, the federal requirement and the evidence an ISSO keeps, a two-question knowledge check, and the summary and the next module. It is built with the shared kit in [`../_build/`](../_build/README.md) and the training decks' helpers in [`../training-ms-automation-module-1/shared.js`](../training-ms-automation-module-1/shared.js). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Covers |
|---|---|
| Introduction | Title; why emergency access comes before any setting changes (the documented lockout); learning objectives and prerequisites |
| Concepts | What Learn's standard asks of each emergency account and the rule that checks it (PA-EA-01 to PA-EA-10); PA-EA-08 and report-only policies; the alert's three tables, matched on object IDs |
| Lab | Try it: Lab 1 steps 1 to 7: Learn's queries and the six read permissions, the check, the findings for `ea02` and the policies, five events where Learn's query finds two, the guards and the tests; Lab 2 in a test tenant (not run by the authors) |
| Check and summary | The federal requirement (AC-2, IA-2(1), AC-2(4), AU-6, SI-4, MS.AAD.3.6v1, MS.AAD.7.3v1) and the evidence for Gate 1; two knowledge-check questions with answers; the summary and the next module |

| File | Use |
|---|---|
| `Training_PA_Module_2.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Training_PA_Module_2_Narrated.vtt` | The video's caption track. Held out of git, with the MP4, until both are on a Release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Training_PA_Module_2_Narration_Script.md` | The spoken narration, slide by slide (about 2,200 words) |
| `narration_Training_PA_Module_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s are on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The narrated deck, its MP4 and the plain deck aren't published yet: they come with the next edition. The narration runs about 13 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/training-pa-module-2/build.js presentations/training-pa-module-2/Training_PA_Module_2.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panel's width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the module's units, which isn't spoken. Every fact on a slide comes from the module page, the learning path's [verification log](../../docs/training/privileged-access/_verification/learning-path.md), or the code, configuration and fixtures in [`examples/privileged-access`](../../examples/privileged-access/README.md); the deck adds none. When the narration attributes a fact or a rule, it names the original source the workbook footnotes for it (Microsoft Learn, NIST SP 800-53, CISA's BOD 25-01 and the ScubaGear baseline, OMB, FedRAMP), or says plainly that it is the workbook's design guidance or the kit's behavior; each slide's Sources line and the backup section list those sources. The **Try it** output is what the commands printed on November 3, 2026, run with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of `examples/`, outside the repository; it matched the kit captures in [`data/kit-captures/pa/`](../../data/kit-captures/pa). Long commands are wrapped, and some output is trimmed or shortened, with "..." marking each cut, as the slides say. The example code is illustrative and tested against fixtures and a fake, not run against a production tenant.
