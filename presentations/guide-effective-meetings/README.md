# Companion guide — Effective Meetings: narrated deck

**Deck name: Guide_Effective_Meetings.** This is a full, detailed Why / What / Who / How deck for the companion guide [Effective Meetings — Purpose, Agenda, Roles, and Follow-Through](../../docs/books/guides/effective-meetings.md), with Who taken as the roles. It covers every section of the guide in the guide's own order. It's built with the shared kit in [`../_build/`](../_build/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Guide_Effective_Meetings.pptx` | The deck: twenty-two narrated slides (the title and twenty-one content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,200 words, roughly 14 to 15 minutes). `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track. `../_build/build_narrated.ps1 -Base Guide_Effective_Meetings` builds the self-running edition.

## How it differs from the book decks

- **The whole guide, no section skipped.** The guide is short (about 2,100 words), so the deck walks it section by section instead of summarizing. It runs about twenty-two slides rather than the book decks' nine to thirteen.
- **Practice, not decisions.** No slide has a decision bar. Each one ends with a takeaway, a flow or a mock-up taken from the guide.
- **The templates as slides.** The guide's agenda template and its notes-and-action-items template are drawn as tables, field for field, and the one-page checklist is reproduced row for row.

## What the deck covers

| Part | Slides | Guide section |
|---|---|---|
| **Why** | A program runs on its meetings; the habits are old and they work; before, during, after (the guide's figure) | Why meetings matter to a modernization program |
| **What** | Is a meeting needed at all; meet, write it down, or retire it; the three kinds of meeting; don't do the work in the room, and name the shift; the agenda defines the meeting and its end; around the items: purpose, title, timing, headcount | Is a meeting needed at all?; The three kinds of meeting; The agenda: more than a list of topics |
| **Who** | Six roles; who's taking notes, and combining and rotating roles | Roles |
| **How** | The four-phase flow (before → during → close → after, looping to the next agenda); before; start and stay on track; the parking lot and useful notes; the close; after; the agenda template; the notes template; the checklist; further reading | Running the meeting; Templates; One-page checklist; Further reading |

## Sources and labels

Every fact on the slides comes from the guide and its four footnoted sources:

- 18F (GSA), "How to run an efficient meeting" (2016);
- Ploof, UPMC Children's Hospital of Pittsburgh faculty development (2016);
- Recktenwald, Portland State University's meeting toolbox (2018), which draws on Herold's *Meetings Suck*;
- Belludi, *Right Attitudes* (2023), on Grove's course at Intel.

Each content slide carries a short Sources line. Each slide's notes hold three parts: the spoken narration, a Detail part with the guide's full content and which source backs each point, and a closing `Workbook: Companion guide, Effective Meetings — <section>` line. The backup slides list the four references in full, map the sources to each guide section, and list the further reading.

The guide's own working rule (written update, meet, or re-check a recurring meeting quarterly) is labeled **design guidance**, as the guide presents it. The templates and the checklist are the guide's own, and the slides say so. The deck names no agency other than GSA's 18F, which appears only as a cited source.

The one diagram is the guide's committed PNG, [`docs/images/diagrams/guides/png/effective-meetings-lifecycle.png`](../../docs/images/diagrams/guides/png/). `build.js` reads its alt text from the guide's `fig-alt`, so the two stay in step. Everything else is drawn with the kit's shapes, cards and tables:

- the four-phase flow, with its loop back;
- the mini-flows for the two warnings and the parking lot;
- the numbered steps for the before and close phases.

Each slide's notes open with a timing cue, worked out from the spoken words at about 150 words a minute. The build prints a `!` warning in any of these cases:

- a title is over 58 characters;
- a Sources line is over 170 characters;
- text may overflow its box;
- a table cell may wrap past its row;
- a shape runs into the Sources line;
- a narration title doesn't match its slide.

Set `FIT=1` to print every box's measured fit and bottom edge.

## Build

```bash
source /c/tmp/deckenv.sh
# from the repo root
node presentations/guide-effective-meetings/build.js presentations/guide-effective-meetings/Guide_Effective_Meetings.pptx
python "$VALIDATE" presentations/guide-effective-meetings/Guide_Effective_Meetings.pptx
python presentations/_build/a11y_check.py presentations/guide-effective-meetings/Guide_Effective_Meetings.pptx
```

To record the narration, run `python presentations/_build/narrate.py presentations/guide-effective-meetings/Guide_Effective_Meetings.pptx`, then `captions.py` the same way. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
