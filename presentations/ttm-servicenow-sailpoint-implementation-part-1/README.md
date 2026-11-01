# Ticket-to-Machine on ServiceNow and SailPoint — implementation, Part 1: boundary, writers, sources and the front door

**Deck name: TTM_ServiceNow_SailPoint_Implementation_Part_1.** Part 1 of the two-part deck series on [Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide](../../docs/books/guides/ttm-servicenow-sailpoint.md), at the level of its gates, with the developer workbook [*Building Ticket-to-Machine*](../../docs/project-plans/developer-workbooks/ticket-to-machine/index.md) and the integration kit [`examples/servicenow-sailpoint`](../../examples/servicenow-sailpoint/README.md). It's an example, not a recommendation or an endorsement: other products can fill the same slots. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The series follows the guide's seven gates. For each gate it gives what done means, the steps, the commands from the workbook's Lab 1 (fixtures and mocked responses, no tenant) where the workbook has them, the federal requirement and the evidence the ISSO keeps, each product's FedRAMP status and the Entra features in GCC and GCC High as the guide states them, the interim path and the rollback. Part 1 covers G1–G4; [Part 2](../ttm-servicenow-sailpoint-implementation-part-2/README.md) covers G5–G7. The narrated overview of the guide's earlier version stays in [`../research-ttm-servicenow-sailpoint/`](../research-ttm-servicenow-sailpoint/README.md).

| Module | Covers | Gate and gap | Main sources |
|---|---|---|---|
| Orientation | Title; the seven gates on one page (done when, gap, validate with); the loop on the two products and the four gaps | — | Guide, "The path on one page," "The loop at a glance" |
| G1 — Boundary | Each offering's FedRAMP status (Marketplace, read November 1, 2026), what's inside the authorization, the Human Fabric naming, vendor-cloud actions, the government Store, the subscriptions; the four integration identities and `kit_calls.py` catching grants that are too wide; requirement, evidence, why ISC, interim path, Validate | G1 | Guide, Step 1 and "Prerequisites"; workbook Chapters 02 and 03 |
| G2 — Writers and approvers | One writer per attribute (the two patterns), one approver system per authority class, timeouts that never approve; the lanes on these products (inference); `writer_check.py` with aliases and the directory-name guard; requirement, evidence, availability, interim path | G2; gaps 2 and 4 | Guide, Step 2; workbook Chapter 08 |
| G3 — Sources and starting drift | Aggregate HR, connect Entra ID and AD (GCC High endpoints), correlate on `employeeId`, Native Change Detection, the baseline; `identity_drift.py` day one and day two and `drift_compare.py`; requirement, evidence, availability, interim path | G3 | Guide, Step 3; workbook Chapter 06 |
| G4 — Front door | The finding table and Scripted REST endpoint, one workflow per trigger, the catalog and Service Desk apps, routing and the tempo; `finding_contract.py` and `workflow_payload.py` with Chapter 04's two fixes; requirement, evidence (the CM-3(1) note), availability, interim path | G4 | Guide, Step 4; workbook Chapters 01 and 04 |
| Close | What each gate leaves in the record and what Part 2 reads from it; the workbook and the learning path | Into G5 | Guide, Steps 1–7; "How to read this guide" |

| File | Use |
|---|---|
| `TTM_ServiceNow_SailPoint_Implementation_Part_1.pptx` | The deck: 17 narrated slides (the title and 16 content slides), then a backup section with three source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,320 words, about 15 minutes of audio) |
| `TTM_ServiceNow_SailPoint_Implementation_Part_1_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_TTM_ServiceNow_SailPoint_Implementation_Part_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the ADM deeper dive's code panel (Consolas, 10–10.5 pt, on a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/ttm-servicenow-sailpoint-implementation-part-1/build.js presentations/ttm-servicenow-sailpoint-implementation-part-1/TTM_ServiceNow_SailPoint_Implementation_Part_1.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and the MP4 by `export_mp4.ps1`.

The speaker notes are the live script: about 4,400 words, about 31 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks (title length and uniqueness, Sources length, overflow warnings) and the deeper dive's width and height check on every code panel. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command and output comes from the guide, a page it links, the developer workbook's Chapters 01–04, 06 and 08, or the code, fixtures and tests under `examples/servicenow-sailpoint`. The deck adds no external facts. Product and FedRAMP facts are the vendors' own statements and the Marketplace data as the guide footnotes them, with the dates it gives. Lab output is the workbook's, from fictional fixtures; where a command or its output is shortened on a slide, the panel's label says so. The kit's tests run against mocked responses and prove logic, not the live integration.

These parts are design guidance or inference and are labeled that way: the two writer patterns and the approver split; the lanes on these products and the CM-8 reading (inference); the integration identities' owners and sponsors; the custom roles split by task; a separate client for workflow creation. Naming the products isn't an endorsement by the program or any agency.
