# Book 03 — HR-Driven Identity: technical deep dive

The 50-minute technical presentation for [Book 03](../../docs/books/b03-hr-identity/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b03-hr-identity/`](../b03-hr-identity/README.md) and the talk set in [`../hr-driven-identity-interview/`](../hr-driven-identity-interview/README.md), and goes underneath them, for identity engineers, HR systems integrators and ICAM architects. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules of 10 to 17 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; this is the HR track (what it moves, how you know, what other books cover); why a token can't prove the claim is true; the architecture, the authority boundaries and the principles | 01–02 (recap) |
| 1 — The data and the pipe | 1. Attribute authority and the canonical schema | 04, 06 |
| | 2. The provisioning pipeline | 03, 05; Appendix B (service identity) |
| 2 — Lifecycle, access and evidence | 3. Lifecycle, credentials and access | 08, 09, 10; Appendix A |
| | 4. Evidence, ownership and the execution plan | 07, 11, 12; Appendix C; Book 01, Ch 12 (Gate G1) |

| File | Use |
|---|---|
| `B03_HR_Identity_Technical.pptx` | The deck: 32 narrated slides (title, three orientation slides, four module dividers, 23 content slides and a closing decisions slide), then a backup section with the full source lists, one slide per module, and the federal requirements' full citations |
| `narration.json` | What the voice says on each narrated slide: the slide's intent and its one or two highpoints, in plain language, with a lead-in to the next slide (about 3,090 words, about 22 minutes). `narrate.py` speaks it instead of the speaker notes and stops if a title doesn't match its slide |
| `B03_HR_Identity_Technical_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built separately by `build_narrated.ps1`; not yet generated) |
| `B03_HR_Identity_Technical_Narration_Script.md` | The narration text, for practice (written by `narrate.py` when the audio is made) |
| `narration_B03_HR_Identity_Technical/` | Per-slide audio, durations and captions (made by `narrate.py` and `captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The speaker notes carry the full detail for a live presenter: about 8,000 words, about 56 minutes at 142 words a minute, which a live presenter trims to about 50. Each note carries its timing cue and ends with the chapter it draws on, and `build.js` prints the words and minutes per module. The narrated edition is generated separately from `narration.json` and runs about 21 minutes.

Every fact on the slides comes from a footnoted chapter of Book 03 (and, for Gate G1, Book 01, Chapter 12 and Book 00, Chapter 09); each content slide carries a short Sources line, and the backup slides list the primary sources in full, with a slide of full citations for the federal requirements. Vendor and federal facts were checked by the book's chapters against their sources on October 20–21, 2026. Federal HR 2.0 program facts, Microsoft limits and government-cloud availability change, so recheck them before a plan rests on one. The program's own recommendations (the identifier decision, extension-attribute slots 4–15, the writer rules, the drift severities, the phase-gate thresholds, the responsibility matrix, the contractor one-authority-per-fact model, and the card management system writing `certificateUserIds` through Microsoft Graph after AD) are labeled design guidance or proposed starting criteria on the slides, as the book labels them program design; the NOA-to-identity-event table is the book's proposed interpretation, not an OPM rule. The contractor source of authority is presented as the open Phase 1 decision the book leaves to the agency. The slides show tables, flows, checklists and decision matrices; configuration detail stays in the chapters. Diagrams are the book's committed PNGs from `docs/images/diagrams/b03-hr-identity/png/`, each with alt text.

`build.js` enforces titles of at most 58 characters, unique across the deck, and Sources lines of at most 185 characters (it throws otherwise). It computes each slide's timing cue from its word count and warns when a table, panel, flow, fact box or callout is likely to overflow; run it with `FIT=1` to print each table's estimated bottom edge.
