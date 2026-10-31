# Attribute-Driven Migration to Entra ID — deeper dive implementation, Part 1: reading the tree to flowing attributes

**Deck name: Attribute_Driven_Migration_Deeper_Dive_Part_1.** Part 1 of the three-part deeper dive on [Attribute-Driven Migration: An Implementation Guide](../../docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.md) and its [project plan](../../data/project-plans/attribute-driven-migration.yaml). It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The deeper dive goes below the two-part [technical deep dive](../attribute-driven-migration-technical-part-1/README.md). It covers the working detail an engineer runs: commands and their parameters, attribute slots, validation checks and how to read their output, the SCIM record, sync mappings, and rollback. Part 1 covers Gates 0–3 and adds a current-state baseline. Part 2 covers Gates 4–6, and Part 3 covers Gates 7–9.

| Module | Covers | Gates and plan tasks | Main sources |
|---|---|---|---|
| Orientation | Title; Gates 0–3 on one page (done when, validate with, plan tasks, rollback); the worked person key | — | Implementation guide, "The path on one page," "Rollback at a glance" |
| Current-state baseline | Tracing real joiner, mover and leaver events, and asking for "the last one you did" (design guidance); where each baseline number comes from: the Start Kit, VK-HR-01 to 04 against an HR export, the group-change audit, and HR separation date against disable date; the 30-day audit-log retention trap | Before Gate 0 | Book 03 Ch 08, 11; Start Kit and validation kit READMEs |
| Gate 0 — Read the tree | `Invoke-FMPStartKit.ps1` at Tier A, then Tier B, `Compare-FMPAssessments` and the run folder; the per-group decision, the OU-to-unit map and track tags; traps, VK-INT-07 (Group Policy analytics, beta) for the GPO split and the VK-NPI-06 handoff; "What the overview simplified" (design guidance) | A0.1–A0.4, AG0 | Implementation guide, Gate 0; Book 02 Ch 07–09 |
| Gate 1 — Schema and slots | The user slot register (`employeeId`, `extensionAttribute1`–`15`); store order (D-A1), one writer per slot (A1.3), other tracks' authorities (A1.4); VK-HR-01 and 04 by `-CheckId`; rollback | A1.1–A1.4, D-A1, D-A2, AG1 | Book 03 Ch 06; companion guide, attribute stores |
| Gate 2 — Prove the attributes | `Invoke-ValidationKit.ps1 -Track HR, DG -InputPath …` with `exceptions.csv` and `hr-export.csv`; reading a failing check from the kit's fixture; threshold (D-A3), removing writers (A2.2), routing logs out (A2.3) | A2.1–A2.3, D-A3, AG2 | Validation kit README and `Checks/HR.ps1`; Book 03 Ch 06, 11, 12 |
| Gate 3 — Map through sync | Landing zones and engine choice; date, slot 7 and DoNotSync mappings with Book 02's expression; the `/bulkUpload` record from `examples/hcm-entra`; soft and hard match and the April 7, 2027 Connect Sync deadline; VK-SYNC-01 (`-Track SYNC` with `ad-slot-export.csv`, slot values on a sample) beside the reconciliation report, which still covers the sync configuration; rollback | A3.1, AG3 | Book 02 Ch 09, 10; Book 03 Ch 05, 12; validation kit `Checks/SYNC.ps1`; research page "Building Book 03's HR Pipeline" |
| Close | What each gate leaves in Git and what Part 2 reads from it | Into Gate 4 | Implementation guide, Evidence; Gate 4 prerequisites |

| File | Use |
|---|---|
| `Attribute_Driven_Migration_Deeper_Dive_Part_1.pptx` | The deck: 17 narrated slides (the title and 16 content slides), then a backup section with three source lists |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,330 words, about 16 minutes) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and adds a code-panel helper (Consolas, 10.5–11 pt, on a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/attribute-driven-migration-deeper-dive-part-1/build.js presentations/attribute-driven-migration-deeper-dive-part-1/Attribute_Driven_Migration_Deeper_Dive_Part_1.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`.

The speaker notes are the live script: about 4,700 words, about 33 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks: title length and uniqueness, Sources length, neutrality, and overflow warnings. It adds one more: a width and height check on every code panel. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command, payload and rule comes from the implementation guide, the companion guide, a chapter they cite, the HCM research page, or the code and READMEs under `examples/`. The deck adds no external facts. The validation kit output on the "failing check" slide comes from the kit's fictional `fail` fixture, laid out as rows; it isn't a verbatim console capture. The SCIM record is one operation from `examples/hcm-entra/tests/fixtures/expected_bulk_request.json`, trimmed and with the name fields elided. The AD date-conversion expression is labeled an inference, as the example's README labels it.

These parts are design guidance and are labeled that way: the baseline's 90-day sampling window and its "show me the last one you did" rule; the "What the overview simplified" slide; the correlation threshold's starting point; and slots 4–9 and 15 of the program attribute map. The example code is illustrative and fixture-tested, not proven against a live tenant.
