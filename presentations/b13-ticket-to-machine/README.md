# Book 13 — Ticket-to-Machine Reference: narrated reference deck

A narrated walk through [Book 13, Appendix B — Ticket-to-Machine Reference](../../docs/books/b13-governance/appendix-b-ticket-to-machine-reference.md), with the argument it supports from [Chapter 10 — Operational Tempo: Ticket to Machine, Not Ticket to Human](../../docs/books/b13-governance/10-ticket-to-machine.md). It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute Book 13 briefing in [`../b13-governance/`](../b13-governance/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B13_Ticket_to_Machine.pptx` | The deck: 17 narrated slides (the title, 15 reference slides and a closing slide), then a backup section with the full source list |
| `narration.js` | What the voice says on each narrated slide, keyed by the slide's exact title: the slide's intent and one or two highpoints, with a lead-in to the next slide (about 1,700 words, about 10 minutes). `build.js` stops if a slide has no narration or a narration entry has no slide |
| `build.js` | Slide content and speaker notes |

The narrated slides cover the coordination loop, the five-clause request chain, the five lanes, change classes and their lanes (two slides, opened by Chapter 10's six tests), drift classes and their default lanes, severity and tempo, the five leadership measures, the evidence record, the four worked examples (two slides), the certificate exception, one front door for detection tools, the failure modes from the reference implementation review, and what to decide.

Each slide's speaker notes start with a timing cue and the spoken narration, then a `Detail:` block with the full content for a live presenter, and end with the section of the appendix or chapter they draw on (`Workbook: Book 13, Appendix B, …`). Each content slide carries a short Sources line, and the last slide lists the primary sources. As the appendix labels them, the lanes, ladder ceilings, severities and response windows are the program's design, not federal requirements, and the slides that show them say so; the four worked examples are illustrative, with invented identifiers. Diagrams are Chapter 10's committed PNGs from `docs/images/diagrams/b13-governance/png/`, each with alt text from the chapter's figure.

## Build

```bash
cd presentations/b13-ticket-to-machine
source /c/tmp/deckenv.sh          # NODE_PATH, APPLY_THEME, VALIDATE
node build.js B13_Ticket_to_Machine.pptx
python "$VALIDATE" B13_Ticket_to_Machine.pptx
python ../_build/a11y_check.py B13_Ticket_to_Machine.pptx
```

`build.js` enforces titles of at most 58 characters, unique across the deck, and Sources lines of at most 185 characters. It prints the spoken words per slide and warns (lines starting with `!`) when a table, panel, flow, fact box or callout is likely to overflow; run it with `FIT=1` to print each element's estimated fit. The narrated edition (audio, captions, self-running deck) is made separately with `../_build/narrate.py`, `captions.py` and `build_narrated.ps1`.
