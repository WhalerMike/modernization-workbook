# Book 14 — Federal Compliance & Authorization: executive briefing

**Deck name: B14_Compliance_Executive.** This is the 30-minute executive version of the Why / What / Who / How briefing for [Book 14](../../docs/books/b14-compliance/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for authorizing officials, the CISO and CIO, ISSOs, the privacy officer and program managers. It centers on decisions: each of the seventeen decision slides ends with a bar that names the decision, who owns it and when it's needed, and the closing slide gathers them into one table. It has no configuration detail. The [15-minute deck](../b14-compliance/README.md) and the book's chapters cover the mechanics. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B14_Compliance_Executive.pptx` | The deck: nineteen narrated slides (the title and eighteen content slides), then a backup section with the full source list |
| `narration.json` | What the narration voice says on each slide before "Backup", one `{slide, title, say}` entry per slide. It's a short spoken version, about 2,190 words or 15 minutes; the speaker notes carry the full detail for a 30-minute live delivery |
| `build.js` | Slide content and speaker notes. Rebuild with the commands below |

The narration audio, the captions and the self-running narrated deck aren't built yet. Make them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B14_Compliance_Executive` on a machine with PowerPoint.

## What the briefing covers

| Part | Slides | Book 14 source |
|---|---|---|
| **Why** | Promise and proof, and who owes which proof; what "Moderate" commits you to; annual testing as the floor, and tools as confirmation; the federal clock; standing directives and support dates | Chapters 01, 02 |
| **What** | The baseline and the crosswalk; closure with proof; program management; contingency; supply chain; privacy; training | Chapters 03 to 09; Appendices A, B |
| **Who** | One decider per row; the authorization path and the separations that keep it honest | Chapter 10 |
| **How** | The package as four linked records; continuous monitoring and ongoing authorization; the residual risk the AO must see; the decisions, their owners and their timing | Chapters 11, 12 |

Thirteen slides reuse committed diagrams from `docs/images/diagrams/b14-compliance/png/`. Each one's alt text is the `fig-alt` from the chapter that shows it, and `build.js` reads that text from the chapter at build time.

Every fact on the slides comes from a footnoted chapter of Book 14. Each slide's notes name the chapter, each content slide has a short Sources line, and the backup section lists the sources in full. The briefing keeps the book's labels:

- Dates are as of October 21, 2026, when the book checked them. An asterisk marks a date the program counted from a stated period.
- The program's own recommendations are labeled as design. These include the two closure tests, the six-phase sequence, the dated register, the dispositions and the monitoring cadence.
- Decision owners come from the responsibility matrix in Chapter 10 and from each chapter's ownership table. Where an owner or a "when" is the program's own model and not a federal assignment, the notes say so.

The timing cue at the start of each slide's notes comes from the spoken words at about 142 words a minute. That's about 4,500 words, or 32 minutes. `build.js` works the cue out, so it stays right when the notes change.

## Build (Git Bash)

```bash
cd presentations/b14-compliance-executive
source /c/tmp/deckenv.sh
node build.js B14_Compliance_Executive.pptx
python "$VALIDATE" B14_Compliance_Executive.pptx
python ../_build/a11y_check.py B14_Compliance_Executive.pptx
```

`build.js` prints a line starting with `!` when it estimates that text may overflow its box, when an image runs into the decision bar, when a Sources line is too long, or when a `narration.json` title doesn't match its slide. A clean build prints none.
