# Book 12 — Security Operations & Telemetry: technical deep dive

The 50-minute technical presentation for [Book 12](../../docs/books/b12-security-operations/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b12-security-operations/`](../b12-security-operations/README.md), for the SOC engineers, detection engineers and security architects who make every plane emit evidence, turn it into detections and close findings with proof. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 50 minutes live, in two parts of about 25 minutes each, split into four modules of 12 to 14 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why a coverage gap looks like quiet | 01 (recap) |
| 1 — Evidence and detection | 1. The evidence contract and identity telemetry | 02, 03 |
| | 2. Platform and Microsoft 365 telemetry to detection | 04, 05 |
| 2 — Findings and who acts on them | 3. Vulnerability, patch, baselines and cloud posture | 06, 07, 08 |
| | 4. Data protection and who runs security operations; decisions | 09, 10 |

| File | Use |
|---|---|
| `B12_Security_Operations_Technical.pptx` | The deck: 32 narrated slides, then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 2,900 words, about 20 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B12_Security_Operations_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,700 words, each note carrying its timing cue at 142 words a minute, and `build.js` prints the words and minutes per module. `build.js` also refuses a slide title longer than 58 characters or used twice, warns when a table, panel, flow step or diagram is likely to overflow or a Sources line runs past 185 characters, and with `FIT=1` prints each table's estimated bottom edge.

Every fact on the slides comes from a footnoted chapter of Book 12; each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The program's own recommendations (the evidence contract's fields, the identity tiers, the remediation-clock defaults, the division of labor with Defender XDR, the DLP baseline, the label taxonomy and the responsibility matrix) are labeled design guidance, and readings between sources are labeled inference, as the book does. The content is defensive only. The slides show tables, flows, checklists and decision matrices; the queries, templates and scripts stay in the chapters, which mark them as illustrative and untested against production. The three diagrams on the slides are the committed PNG renders in `docs/images/diagrams/b12-security-operations/png/`.
