# Book 18 — Application Modernization: executive briefing

**Deck name: B18_Application_Modernization_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 18](../../docs/books/b18-application-modernization/index.md), for the CIO, the CTO or chief architect, portfolio and application owners, the CISO, the privacy officer, authorizing officials and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B18_Application_Modernization_Executive.pptx` | The deck: twenty narrated slides (the title and nineteen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,100 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B18_Application_Modernization_Executive` builds the self-running edition.

## How it's built

- **Decision-centered.** Fifteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's decision table and responsibility matrix (Chapter 07), its gate authorities (Chapter 10) and each chapter's "What leadership should take from this" list. Three context slides end with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration or code detail.** No schema mappings, pipeline settings, API definitions or test commands; Chapters 03, 04, 05 and 08 carry those.
- **The whole book.** A slide for each of the portfolio argument, the six dispositions, the triage rubric, the target architecture, the strangler fig, proving the data, coexistence without dual writes, AI with an owner, compliance by design, privacy and records, the review board, the four gates, the reference implementation, TOGAF and Zachman, the waves and their funding.

## What the briefing covers

| Part | Slides | Book 18 source |
|---|---|---|
| **Why** | Most IT money keeps existing systems running; big-bang rewrites fail and policy asks for segments; the application is the unit of decision | Chapter 01 |
| **What** | Six dispositions; the rubric; one target architecture and its upgrade budget; the strangler fig; proving the data; coexistence without dual writes; AI with an owner; compliance carried by the platform; privacy and records at design review | Chapters 02 to 06 |
| **Who** | One decider for every architecture decision; four gates that leave proof | Chapter 07 |
| **How** | The reference implementation and its limits; TOGAF and Zachman; waves on the program's gates; funding and metrics; the decisions | Chapters 08 to 10 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 18; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: the six dispositions, the triage rubric, the technology stack, the gates, the factory and the wave design are **program design**, not federal requirements; every product version, support window and migration-tool capability is a **dated observation** as of October 28–29, 2026; and the reference implementation is **illustrative**, never run against a real DB2 or Oracle database, a real model or production. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance. Federal AI rules are left to Book 17, as the book does.

The diagrams are the committed PNGs in [`docs/images/diagrams/b18-application-modernization/png/`](../../docs/images/diagrams/b18-application-modernization/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,500 words, a little over 30 minutes live). The build prints a `!` warning for any title over 58 characters, a Sources line over 170 characters, text that may overflow its box, or a narration title that doesn't match the slide; `FIT=1` also prints each box's estimated bottom.

## Build

```bash
cd presentations/b18-application-modernization-executive
source /c/tmp/deckenv.sh
node build.js B18_Application_Modernization_Executive.pptx
python "$VALIDATE" B18_Application_Modernization_Executive.pptx
python ../_build/a11y_check.py B18_Application_Modernization_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B18_Application_Modernization_Executive.pptx` and then `python ../_build/captions.py B18_Application_Modernization_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
