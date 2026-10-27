# Book 16 — People: Training & Education: executive briefing

**Deck name: B16_People_Executive.** This is the 30-minute, decision-centered Why / What / Who / How briefing for [Book 16](../../docs/books/b16-people/index.md), for the CIO, the chief human capital officer and HR leadership, the CISO, workforce and training leads, and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the [15-minute deck](../b16-people/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B16_People_Executive.pptx` | The deck: twenty narrated slides (the title and nineteen content slides), then a backup section with the full source list |
| `narration.json` | What the narration voice says on each slide before "Backup", one `{slide, title, say}` entry per slide. It's a short spoken version, about 2,190 words or 15 minutes; the speaker notes carry the full detail for a live delivery |
| `build.js` | Slide content and speaker notes. Rebuild with the commands below |

The narration audio, the captions and the self-running narrated deck aren't built yet. Make them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B16_People_Executive` on a machine with PowerPoint.

## How it differs from the 15-minute deck

- **Decision-centered.** Eighteen content slides end with a bar that names the decision, who owns it and when it's needed. The owners come from the responsibility matrix in Chapter 08 and the gate criteria in Chapters 01, 08 and 10. The closing slide gathers the decisions into one table.
- **No configuration detail.** There are no policy settings, exam objectives or lab steps. The 15-minute deck and Chapters 04, 06 and 07 cover those.
- **More of the workforce side.** It has separate slides on position coding and its record, the help desk as the first-trained and most-targeted team, wave pacing, keeping knowledge when people and contracts change, and what the steering committee should see.

## What the briefing covers

| Part | Slides | Book 16 source |
|---|---|---|
| **Why** | Tools enforce and people decide; whose work changes; why training last is paid for twice; what federal workforce rules require and don't; position codes as the roster source | Chapters 01, 02 |
| **What** | Education, then four tracks; the engineers' rule that evidence must land; certification by artifact; labs and government-cloud rehearsal; end-user training; the help desk; wave pacing | Chapters 03 to 07 |
| **Who** | One decider per row; the training lead reports and others decide; the authorizing official's risk call | Chapter 08 |
| **How** | The curriculum on the roadmap; keeping the knowledge (retention and contractors); measuring readiness; the steering committee's view; the decisions, their owners and their timing | Chapters 09, 10 |

Twelve slides reuse committed diagrams from `docs/images/diagrams/b16-people/png/`. Each one's alt text is the `fig-alt` from the chapter that shows it, and `build.js` reads that text from the chapter at build time. No new diagrams were drawn.

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 16. Each slide's notes end with a `Workbook: Book 16, Chapter NN …` line naming the chapter and section, each content slide has a short Sources line, and the backup slides list the primary sources. The briefing keeps the book's labels:

- Federal, NIST, Microsoft and vendor facts were checked by the book on October 21–22, 2026. Microsoft certification status is as of October 22, 2026. Recheck certification names and lab offerings before a plan rests on one.
- The program's own recommendations are labeled as design. These include the gate training criteria, the tracks and their habits, the four-level scale and the two credentials, the lab tiers and the government-tenant rehearsal, the help desk's will-and-won't list, the wave day counts, the separations of roles and the steering committee cadence. Thresholds such as the pilot's ticket and satisfaction figures are illustrative.
- Where the book gives no date for a decision, the "When" column names the event that triggers it, marked "(design)" on the slide and labeled design guidance in the notes.
- Two items are our inference, and the notes say so. The book names no owner for making a credential a condition for privileged roles, so the deck places it with the CISO. And the book has no chapter on retention, so the "keep the knowledge" slide gathers its relevant pieces from Chapters 02, 06, 08 and 09.

The timing cue at the start of each slide's notes comes from the spoken words at about 142 words a minute. That's about 4,750 words, or 33 minutes. `build.js` works the cue out, so it stays right when the notes change.

## Build (Git Bash)

```bash
cd presentations/b16-people-executive
source /c/tmp/deckenv.sh
node build.js B16_People_Executive.pptx
python "$VALIDATE" B16_People_Executive.pptx
python ../_build/a11y_check.py B16_People_Executive.pptx
```

`build.js` prints a line starting with `!` when it estimates that text may overflow its box, when an image runs into the decision bar, when a title is over 58 characters or repeated, when a Sources line is over 185 characters, when a notes reference doesn't start `Book 16, Chapter NN`, or when a `narration.json` title doesn't match its slide. A clean build prints none.
