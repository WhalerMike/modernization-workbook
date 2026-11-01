# HR-Driven Identity — implementation, Part 2: access, credentials, separation and drift

**Deck name: HR_Driven_Identity_Implementation_Part_2.** Part 2 of the two-part deck series on [HR-Driven Identity: An Implementation Guide](../../docs/books/guides/hr-driven-identity-implementation.md), at the level of its gates, with the developer workbook [*Building HR-Driven Identity*](../../docs/project-plans/developer-workbooks/hr-driven-identity/index.md), its kit [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md) and the drift pipeline's `hr_evidence.py`. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

[Part 1](../hr-driven-identity-implementation-part-1/README.md) covers G1–G3. This part covers G4–G7, in the same form: what done means, the steps, the workbook's Lab 1 commands and output, the federal requirement and evidence, government-cloud availability as the guide states it, the interim path and the rollback.

| Module | Covers | Gate and plan tasks | Main sources |
|---|---|---|---|
| Orientation | Title; G4–G7 on one page (done when, validate with, plan tasks, rollback) and the track's done-when | — | Guide, "The path on one page," "Rollback," "The track at a glance" |
| G4 — Access and movers | Automatic assignment (15,000 per policy, one policy per package, the `memberOf` quarantine from November 3, 2026, the grace period); manager approval with a fallback, the mover's residual review, privilege through PIM, a reorganization as a mass mover; `access_assignment.py lint`, `memberof-scan` and `residual`; requirement, evidence, availability (dynamic administrative units not in GCC High), rollback | G4; I4.4, I4.5 | Guide, Step 4; workbook Chapter 04 |
| G5 — Credentials | Trusted CAs each with a CRL, the CRL limits by cloud, phishing-resistant strength; issuance, the end of the bridge, card events and the reissuing mover; `cba_check.py measure` and `check` for GCC and GCC High; requirement, evidence, availability, rollback | G5; I1.6 | Guide, Step 5; workbook Chapter 05 |
| G6 — Separation | The canonical leaver order (block, Launch and wait, removals, read back, delete last), timing, the emergency and late paths, privileged leavers; `separation_timing.py measure` and three stories from the fixture; requirement, evidence, availability (the custom task extension's Logic App, inference), rollback | G6; I4.1, I4.2, I4.6 | Guide, Step 6; workbook Chapter 06 |
| G7 — Drift and evidence | The lifecycle drift classes, the six metrics from the lab's run, the sole-source proof; `lifecycle_drift.py run` and `hr_evidence.py package` and `period`, with the requirements and Validate | G7; IG5 | Guide, Step 7; workbook Chapter 07 |
| Close | The evidence file per population and where to go next: the workbook and the [learning path](../../docs/training/hr-driven-identity/index.md) (seven modules, one per gate) | — | Guide, "Evidence," "Back to the books" |

| File | Use |
|---|---|
| `HR_Driven_Identity_Implementation_Part_2.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with three source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,330 words, about 15 minutes of audio) |
| `HR_Driven_Identity_Implementation_Part_2_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_HR_Driven_Identity_Implementation_Part_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the ADM deeper dive's code panel (Consolas, 10–10.5 pt, on a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/hr-driven-identity-implementation-part-2/build.js presentations/hr-driven-identity-implementation-part-2/HR_Driven_Identity_Implementation_Part_2.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and the MP4 by `export_mp4.ps1`.

The speaker notes are the live script: about 4,000 words, about 28 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks (title length and uniqueness, Sources length, overflow warnings) and the deeper dive's width and height check on every code panel. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command and output comes from the implementation guide, a page it links, the developer workbook's Chapters 04–07, or the code, configuration and fixtures under `examples/hr-lifecycle` and `examples/drift-pipeline`. The deck adds no external facts; Microsoft Learn, CISA and NIST facts are the ones the guide footnotes (read November 1, 2026). Lab output is the workbook's, from fictional `contoso.example` fixtures; where a command or its output is shortened on a slide, the panel's label says so. The kit's code is illustrative and fixture-tested, not run against a production tenant.

These parts are design guidance or inference and are labeled that way: the 14-day grace warning and the program's ten-day review window; the GCC High assigned-unit interim; the separation and metric thresholds (samples the agency replaces); the control mapping in the period summary; running the CRL measurement from the internet-facing path; and the location of a GCC tenant's Logic App (inference).
