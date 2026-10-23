# Book 15 — Compliance Automation & Day-2 Operations: technical deep dive

The 50-minute technical presentation for [Book 15](../../docs/books/b15-day2-operations/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b15-day2-operations/`](../b15-day2-operations/README.md), for help desk leads, cloud services and platform engineers, and the people who automate controls. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules of 10 to 14 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why a reset can hand over the account; three questions, the coordination contract and the operating rules | 01–02 (recap) |
| 1 — The front door and the authority | 1. Intake, triage and routing | 03 |
| | 2. Help desk authority in Entra ID | 04, Appendix A |
| 2 — Catalogs, records and controls | 3. Catalogs, SaaS and the CMDB | 05, 06, 07 |
| | 4. Control automation and who runs it | 08, 09, 10 |

| File | Use |
|---|---|
| `B15_Day2_Operations_Technical.pptx` | The deck: 29 narrated slides (title, two orientation slides, four module dividers, 21 content slides and a closing decisions slide), then a backup section with the full source lists, one slide per module |
| `narration.json` | What the voice says on each narrated slide: the slide's intent and its one or two highpoints, in plain language, with a lead-in to the next slide (about 3,000 words, about 21 minutes). `narrate.py` speaks it instead of the speaker notes and stops if a title doesn't match its slide |
| `B15_Day2_Operations_Technical_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built separately by `build_narrated.ps1`) |
| `B15_Day2_Operations_Technical_Narration_Script.md` | The narration text, for practice (written by `narrate.py` when the audio is made) |
| `narration_B15_Day2_Operations_Technical/` | Per-slide audio, durations and captions (made by `narrate.py` and `captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The speaker notes carry the full detail for a live presenter: about 7,400 words, about 52 minutes at 142 words a minute. Each note carries its timing cue, and `build.js` prints the words and minutes per module. The narrated edition is generated separately from `narration.json` and runs about 21 minutes.

Every fact on the slides comes from a footnoted chapter of Book 15; each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. Vendor and federal facts were checked by the book's chapters against their sources on October 21–22, 2026, and vendor capabilities and government-cloud availability change by release, so recheck them before a plan rests on one. The program's own recommendations (the verification ladder, approval gates, the two-approver tasks, the SaaS verdict threshold, service levels and the responsibility matrix) are labeled design guidance on the slides, as the book labels them program design. The slides show tables, flows, checklists and decision matrices; the scripts and commands stay in the chapters and Appendix A, which mark them as illustrative and untested against a production tenant. Diagrams are the book's committed PNGs from `docs/images/diagrams/b15-day2-operations/png/`, each with alt text.

`build.js` enforces titles of at most 58 characters, unique across the deck, and Sources lines of at most 185 characters (it throws otherwise). It computes each slide's timing cue from its word count and warns when a table, panel, flow, fact box or callout is likely to overflow; run it with `FIT=1` to print each table's estimated bottom edge.
