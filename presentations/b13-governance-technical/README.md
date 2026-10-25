# Book 13 — Governance, Drift & Evidence: technical deep dive

The 50-minute technical presentation for [Book 13](../../docs/books/b13-governance/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It goes a level deeper than the 15-minute briefing in [`../b13-governance/`](../b13-governance/README.md), for the governance engineers, platform owners and ISSOs who keep an authoritative record true, build the checks that compare the estate with it, and give an authorizing official evidence they can re-run. It points to the narrated [Ticket-to-Machine reference](../b13-ticket-to-machine/README.md) (Appendix B) for the coordination loop, lanes, tempo and worked examples rather than repeating them. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 50 to 55 minutes live, in two parts, split into four modules of 10 to 16 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why a signed package starts aging at once | 01 |
| 1 — The record and the drift engine | 1. Drift, the record and change control | 02, 03, 04 |
| | 2. Deterministic rules and the drift engine | 05, 06 |
| 2 — Evidence, owners and authorization | 3. Evidence over attestation, and adapters | 07, 08 |
| | 4. Who governs, ticket to machine (brief), reciprocity and scale; decisions | 09, 10, 11, 12 |

| File | Use |
|---|---|
| `B13_Governance_Technical.pptx` | The deck: 32 narrated slides, then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 2,950 words, about 21 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B13_Governance_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,800 words, each note carrying its timing cue at 142 words a minute, and `build.js` prints the words and minutes per module. `build.js` also refuses a slide title longer than 58 characters or used twice and a Sources line longer than 185 characters, sizes each text panel to its contents when no height is given, and warns when a table, panel, callout or diagram is likely to overflow or a panel is left mostly empty; with `FIT=1` it prints each table's, panel's and diagram's estimated bottom edge.

Every fact on the slides comes from a footnoted chapter of Book 13; each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The program's own design (the five drift classes, the six control planes, the five-clause path, the three rule layers, the severities and response windows, the provenance envelope, the adapter contract, the responsibility model, the reciprocity model and the coverage doctrine) is labeled program design or design guidance and federal obligations are labeled as such, as the book does. The YAML records the chapters show are illustrative; the slides describe their shape rather than reproduce them. The diagrams are the committed PNG renders in `docs/images/diagrams/b13-governance/png/`, and each one's alt text is read at build time from the chapter's own `fig-alt`.
