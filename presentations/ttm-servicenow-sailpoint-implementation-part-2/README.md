# Ticket-to-Machine on ServiceNow and SailPoint — implementation, Part 2: actuation, re-read, tempo and evidence

**Deck name: TTM_ServiceNow_SailPoint_Implementation_Part_2.** Part 2 of the two-part deck series on [Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide](../../docs/books/guides/ttm-servicenow-sailpoint.md), at the level of its gates, with the developer workbook [*Building Ticket-to-Machine*](../../docs/project-plans/developer-workbooks/ticket-to-machine/index.md) and the integration kit [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md). It's an example, not a recommendation or an endorsement. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

[Part 1](../ttm-servicenow-sailpoint-implementation-part-1/README.md) covers G1–G4. This part covers G5–G7, in the same form, then the dangers across all seven gates and what moving the guide from Draft to Proved takes.

| Module | Covers | Gate and gap | Main sources |
|---|---|---|---|
| Orientation | Title; G5–G7 on one page (done when, gap, validate with, rollback) | — | Guide, "The path on one page," "Rollback" |
| G5 — Actuation | Connectors for A2 and A3 (sessions revoked on disable), the Entra spoke for A0 and A1 and its gaps, PIM with the ticket number, verifying the person; change records by class and the declared-exception lane; requirement, evidence, availability (the spoke in GCC High unconfirmed), the manual lab, rollback | G5; gap 3 | Guide, Step 5; Book 15, Ch 03 |
| G6 — Re-read | *Awaiting verification* and the business rule on findings and Service Desk tickets, the re-read client and the grace period; `reread_verification.py` offline over six records, a day apart; requirement, evidence, availability, interim path | G6; gap 1 | Guide, Step 6; workbook Chapter 05 |
| G7 — Tempo and evidence | The tempo and the five measures, the schedules and reviews; the identity fixes on these products; `evidence_export.py`, the four checks and the hash chain; requirement, evidence, interim path; the evidence record field by field | G7 | Guide, Step 7 and "Evidence"; workbook Chapter 07 |
| Close | The dangers across the seven gates; the guide's status and what Proved takes; the workbook, the learning path, the kit page | — | Guide, "Dangers," "Status and review," "What couldn't be verified" |

| File | Use |
|---|---|
| `TTM_ServiceNow_SailPoint_Implementation_Part_2.pptx` | The deck: 15 narrated slides (the title and 14 content slides), then a backup section with three source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,320 words, about 14 minutes of audio; the video runs about 15 minutes) |
| `TTM_ServiceNow_SailPoint_Implementation_Part_2_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_TTM_ServiceNow_SailPoint_Implementation_Part_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the ADM deeper dive's code panel (Consolas, 10.5 pt, on a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/ttm-servicenow-sailpoint-implementation-part-2/build.js presentations/ttm-servicenow-sailpoint-implementation-part-2/TTM_ServiceNow_SailPoint_Implementation_Part_2.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and the MP4 by `export_mp4.ps1`.

The speaker notes are the live script: about 3,600 words, about 26 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks (title length and uniqueness, Sources length, overflow warnings) and the deeper dive's width and height check on every code panel. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command and output comes from the guide, a page it links, the developer workbook's Chapters 05–07, or the code, fixtures and tests under `examples/servicenow-sailpoint`. The deck adds no external facts. Product facts are the vendors' own statements as the guide footnotes them, with the dates it gives. Lab output is the workbook's, from fictional fixtures; where output is shortened on a slide, the panel's label says so. The kit's tests run against mocked responses and prove logic, not the live integration; Pass 1 doesn't actuate, so G5 has no automated check.

These parts are design guidance or inference and are labeled that way: the identity fixes on these products and the lanes (inference or design guidance unless the guide cites a source); the re-read grace period of 24 hours; the evidence-record mapping (the program's; assessors decide each control). Naming the products isn't an endorsement by the program or any agency.
