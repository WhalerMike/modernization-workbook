# HR-Driven Identity — implementation, Part 1: writers, sources and joiners

**Deck name: HR_Driven_Identity_Implementation_Part_1.** Part 1 of the two-part deck series on [HR-Driven Identity: An Implementation Guide](../../docs/books/guides/hr-driven-identity-implementation.md), at the level of its gates, with the developer workbook [*Building HR-Driven Identity*](../../docs/project-plans/developer-workbooks/hr-driven-identity/index.md) and its kit [`examples/hr-lifecycle`](../../examples/hr-lifecycle/README.md). It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The series follows the guide's seven gates. For each gate it gives what done means, the steps, the commands from the workbook chapter's Lab 1 (fixtures, no tenant), the federal requirement and the evidence the ISSO keeps, government-cloud availability as the guide states it, the interim path and the rollback. Part 1 covers G1–G3; [Part 2](../hr-driven-identity-implementation-part-2/README.md) covers G4–G7.

| Module | Covers | Gate and plan tasks | Main sources |
|---|---|---|---|
| Orientation | Title; the seven gates on one page (done when, validate with, plan tasks); the prerequisites, licenses and roles, and where the parts run (HR on Oracle Cloud Infrastructure, the automation in Azure) | — | Guide, "The path on one page," "Prerequisites," "Where agencies start" |
| G1 — Writers | The lifecycle rows of the writer register (writer and backstop per transition); the versioned scope filter, the other write paths and the saved audit queries, with sync as a writer until AD retires; `writer_register.py check` and `scan` and how to read WS-01, WS-02 and WS-04; requirement, evidence, availability, rollback | G1; I1.2, I1.4 | Guide, Step 1; workbook Chapter 01 |
| G2 — Sources | Employees from the live feed and contractors from their own source (decision D-I3), the six questions and the canonical mapping; the contractor leaver first and the earliest end, with the lab's decisions; `contractor_source.py extract`, the middleware's dry run, `reconcile` and `review`; requirement, evidence, availability, rollback | G2; D-I3, I5.2 | Guide, Step 2; contractor evaluation; workbook Chapter 02 |
| G3 — Joiners | Few workflows scoped by code, Learn's two ceilings (50 and 100), the tenant schedule and execution limits; the Temporary Access Pass bridge and day-one access by package; `joiner_workflows.py lint`, `plan` and `readiness`; requirement, evidence, availability (TAP in GCC High not confirmed), rollback | G3; I2.3, I4.3 | Guide, Step 3; workbook Chapter 03 |
| Close | What each gate leaves in the evidence file and what Part 2 reads from it; the workbook and the [learning path](../../docs/training/hr-driven-identity/index.md) (seven modules, one per gate) | Into G4 | Guide, "Evidence"; Steps 4–7 |

| File | Use |
|---|---|
| `HR_Driven_Identity_Implementation_Part_1.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with three source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,380 words, about 15 minutes of audio) |
| `HR_Driven_Identity_Implementation_Part_1_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_HR_Driven_Identity_Implementation_Part_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the ADM deeper dive's code panel (Consolas, 10.5 pt, on a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/hr-driven-identity-implementation-part-1/build.js presentations/hr-driven-identity-implementation-part-1/HR_Driven_Identity_Implementation_Part_1.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and the MP4 by `export_mp4.ps1`.

The speaker notes are the live script: about 3,700 words, about 26 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks (title length and uniqueness, Sources length, overflow warnings) and the deeper dive's width and height check on every code panel. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command and output comes from the implementation guide, a page it links, the developer workbook's Chapters 01–03, or the code, configuration and fixtures under `examples/hr-lifecycle` and `examples/hcm-entra`. The deck adds no external facts; Microsoft Learn facts are the ones the guide footnotes (read November 1, 2026). Lab output is the workbook's, from fictional `contoso.example` fixtures; where a command or its output is shortened on a slide, the panel's label says so. The kit's code is illustrative and fixture-tested, not run against a production tenant.

These parts are design guidance or inference and are labeled that way: the lifecycle rows' writer and backstop choices; the quarterly OU ACL review; the workflow budget of 50; the sponsor's grace period and the review's bi-annual cycle and remove-on-no-response; the rehire path for the Temporary Access Pass (inference).
