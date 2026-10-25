# Book 11 — Zero Trust & Assessment: technical deep dive

The 50-minute technical presentation for [Book 11](../../docs/books/b11-zero-trust/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b11-zero-trust/`](../b11-zero-trust/README.md) and the executive briefing for CISOs and authorizing officials in [`../b11-zero-trust-executive/`](../b11-zero-trust-executive/README.md), and goes underneath them, for the security engineers and assessors who run ScubaGear and the Zero Trust Assessment, read their output and turn it into evidence. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 50 minutes live, in two parts of about 25 minutes each, split into four modules of 10 to 16 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why the worst failures sat beneath any one tool | 01, 06 (incidents) |
| 1 — The target and the tools | 1. A whole-agency property, governance principles and what the mandates require | 01, 02, 03 |
| | 2. SCuBA and BOD 25-01, the two assessment tools, and beyond Microsoft 365 | 04, 05, 06 |
| 2 — Owning and running the assessment | 3. Who owns Zero Trust, and close before you assess | 07, 08 |
| | 4. Running the assessment, evidence not verdicts, and the requirements map; decisions | 09, 10, Appendix A |

| File | Use |
|---|---|
| `B11_Zero_Trust_Technical.pptx` | The deck: 32 narrated slides, then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 2,800 words, about 20 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B11_Zero_Trust_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,500 words, each note carrying its timing cue at 142 words a minute, and `build.js` prints the words and minutes per module. `build.js` also refuses a slide title longer than 58 characters or used twice, warns when a table, panel, flow step, callout or diagram is likely to overflow, when a panel has much more room than its text needs, or when a Sources line runs past 185 characters, and with `FIT=1` prints each table's and diagram's estimated bottom edge.

Every fact on the slides comes from a footnoted chapter of Book 11; each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The program's own recommendations (identity as the root namespace, gated enforcement, the role model and responsibility matrix, the six-phase sequence and the three responses to a finding, the adapter and claim envelope, the drift classes, and the scoring method) are labeled design guidance, and readings between sources are labeled inference, as the book does. The book's illustrative material stays labeled: the earlier 47 percent overlap figure and the worked trace from a policy result to an OSCAL observation. The slides show tables, flows and decision matrices; the commands stay in Chapter 09, which marks them illustrative and untested against production. The one figure not stated in the book is the 134 total on the mandatory-list slide, which is the sum of the chapter's per-product baseline counts.

The twelve diagrams on the slides are the committed PNG renders in `docs/images/diagrams/b11-zero-trust/png/`; `build.js` reads each one's alt text from the `fig-alt` attribute in the chapter that shows it, so the deck and the book describe each figure the same way.
