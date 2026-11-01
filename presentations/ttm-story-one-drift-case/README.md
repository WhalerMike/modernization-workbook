# Building Ticket-to-Machine — One Drift Case, End to End: narrated story deck

**Deck name: TTM_Story_One_Drift_Case.** A narrated story deck for the developer workbook [*Building Ticket-to-Machine*](../../docs/project-plans/developer-workbooks/ticket-to-machine/index.md). Instead of one chapter at a time, it teaches the whole workbook through one case followed end to end: Erin Example (E1004), a fictional employee in the kit's own fixtures, whose department drifts between HR, Entra ID and SailPoint. It is built with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) and the deeper dive's code-panel helper, on the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

## The case

Every value on the slides comes from [`examples/servicenow-sailpoint/tests/fixtures`](../../examples/servicenow-sailpoint/tests/fixtures), and every command is a workbook chapter's Lab 1 command, re-run on November 1, 2026, with the output it printed (trimmed where the slide says so).

| Scene | What happens to Erin's record | Loop step and gate | Chapter | Try it (Lab 1) | Fixture |
|---|---|---|---|---|---|
| Opening | The cast and the stakes; the route through the loop | — | Index, 01 | — | `hr_extract.csv`, `graph_users.json`, `isc_identities.json`, `entra_audit.json` |
| 1 The drift run | Day one finds four findings for E1004: Entra department and manager, ISC manager, and the help desk's unauthorized write on Department | 1–2, G3 | 06 | `identity_drift.py` day one | the above |
| 2 The typed task | Each finding becomes a typed, clocked task; the mover workflow keys on the attribute | 3, G4 | 01, 04 | `finding_contract.py --from-drift`; `workflow_payload.py` (identity attributes changed) | `events/identity-attributes-changed.json` (Erin's identity) |
| 3 Least privilege | Who may read, raise, close and export her record | 3 and 5, G1 | 02, 03 | `kit_calls.py --granted` (a manage scope; `itil`) | `config/calls.json` |
| 4 One writer | Why her department keeps drifting: two writers on `department` | Pass 2, G2 | 08 | `writer_check.py` | `writers/` (fictional exports, not Erin's tenant) |
| 5 Actuation | The fix on the native surface, as the guide describes it; the kit's Pass 1 doesn't actuate | 4, G5 | — | `workflow_payload.py` (provisioning completed) | `events/provisioning-completed.json` (Alice's, the kit's only signal fixture) |
| 6 The re-read | Day two: Entra resolved, ISC new; `IDF0001004` (Erin's ISC identity) verifies; a stale read reopens | 5, G6 | 05, 06 | `drift_compare.py`; `reread_verification.py` offline | `hr_extract_day2.csv`, `reread/` |
| 7 Evidence | Her re-read's evidence hash; the hash-chained package the ISSO verifies | 5, G7 | 07 | `evidence_export.py`, `--verify-dir`, a tamper | `evidence/closed_records.json` (five other fictional records) |
| Close | Lab 2 in your own developer instance and sandbox (no hosted sandbox); the workbook, the tours, the learning path and the guide's deck | — | 01–08 | — | — |

Each scene has a story slide (the beat, the code that handles it, and the federal requirement from the example guide's gate), a **Try it** slide and a one-question **check** slide. The check's answer opens the next slide's narration and is in the check slide's notes.

## Files

| File | Use |
|---|---|
| `TTM_Story_One_Drift_Case.pptx` | The deck: 25 narrated slides (the title, two opening slides, three per scene and a closing slide), then a backup section with two source lists |
| `TTM_Story_One_Drift_Case_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped |
| `TTM_Story_One_Drift_Case_Narrated.mp4` | The video, for the videos release (not uploaded yet) |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 3,030 words), written by `build.js` |
| `TTM_Story_One_Drift_Case_Narration_Script.md` | The spoken narration, slide by slide |
| `build.js` | The slides, the narration, and the speaker notes |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/ttm-story-one-drift-case/build.js presentations/ttm-story-one-drift-case/TTM_Story_One_Drift_Case.pptx`. Then `narrate.py`, `captions.py`, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

The speaker notes are the live script: each has a timing cue at 142 words a minute, the narration, a Detail part with the full facts behind the slide (every Lab 1 output in full, the fixture values, the gate's requirements), and a `Workbook:` reference to the chapter and guide sections. The build runs the shared helpers' checks (title length and uniqueness, Sources length, overflow warnings), a width and height check on every code panel, and a neutrality check on every slide and note.

## Labels and sourcing

Every fact comes from the workbook's eight chapters, the example guide [Ticket-to-Machine on ServiceNow and SailPoint](../../docs/books/guides/ttm-servicenow-sailpoint.md), Book 13's Chapter 10 and Appendix B, the [learning path](../../docs/training/ticket-to-machine/index.md), or the kit. The deck adds no external facts. The kit's fixtures are separate fictional files written for different chapters; the deck strings them into one story and says on each slide which fixture a value comes from, including where a lab's fixture isn't Erin's. Scene 5 describes actuation as the guide does, because the kit's Pass 1 doesn't actuate. Code on the story slides is excerpted, and marked "simplified" where it is shortened.

Design guidance is labeled as the workbook labels it: Book 13's tempo, the custom ServiceNow roles, the separate workflow client, the re-read grace period, the hash chain and package, and one writer per attribute. The example code is illustrative and fixture-tested, not proven against a live ServiceNow instance or SailPoint tenant.
