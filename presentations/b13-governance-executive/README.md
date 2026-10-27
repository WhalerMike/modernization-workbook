# Book 13 — Governance, Drift & Evidence: executive briefing

**Deck name: B13_Governance_Executive.** This is the 30-minute, decision-centered Why / What / Who / How briefing for [Book 13](../../docs/books/b13-governance/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for the CIO, the CISO, authorizing officials and the program office. Each of the seventeen content slides before the close ends with a bar that names the decision, who owns it and when it's needed, and the closing slide gathers them into one table. It has no configuration detail. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B13_Governance_Executive.pptx` | The deck: nineteen narrated slides (the title, seventeen decision slides and the closing decisions table), then a backup section with the full source list |
| `narration.json` | What the narration voice says on each slide before "Backup", one `{slide, title, say}` entry per slide. It's a short spoken version, about 2,170 words or 14.5 minutes; the speaker notes carry the full detail for a 30-minute live delivery |
| `build.js` | Slide content and speaker notes. Rebuild with the commands below |

The narration audio, the captions and the self-running narrated deck aren't built yet. Make them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B13_Governance_Executive` on a machine with PowerPoint.

## How it differs from the other Book 13 decks

- **The [15-minute deck](../b13-governance/README.md)** walks the book chapter by chapter. This briefing spends its time on the decisions: who owns them, when they're needed, and what each one changes for the people who sign.
- **The [technical deep dive](../b13-governance-technical/README.md)** carries the mechanics (the five drift classes in detail, the three rule layers, the provenance envelope, hashes and signatures, the adapter contract). This deck names them only where a decision depends on them.
- **The [ticket-to-machine reference](../b13-ticket-to-machine/README.md)** carries the lanes, the change classes, the tempo windows, the leadership measures and the worked examples. This deck keeps one slide on the principle and the authorizing official's L4 decision.
- **Added here:** the gate G0 rule that no Add or Change may create a new Active Directory dependency without a dated exception (Chapter 04), the human-only-closure count, the outside reviewer for classifier changes, the authorizing official's four asks, and the records officer's control of repository history.

## What the briefing covers

| Part | Slides | Book 13 source |
|---|---|---|
| **Why** | Compliance decays the day after the audit; federal policy already points past the snapshot; drift as continuous, silent and the opening for attack | Chapters 01, 02 |
| **What** | One record and one owner per fact; one change path with no second lane; no new Active Directory dependency from gate G0; closure with proof; evidence an assessor can re-run; the drift engine and what it never does | Chapters 03 to 07 |
| **Who** | One decider for every decision; exceptions, bounded and open-ended; the authorizing official's part and the cadence; the record as a federal record | Chapter 09 |
| **How** | Ticket to machine and the L4 decision; reuse by default; ongoing authorization; coverage and the gap register at scale; the decisions, their owners and their timing | Chapters 10, 11, 12 |

Fourteen slides reuse committed diagrams from `docs/images/diagrams/b13-governance/png/`. Each one's alt text is the `fig-alt` from the chapter that shows it, and `build.js` reads that text from the chapter at build time.

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 13. Each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide has a short Sources line, and the backup section lists the sources in full. The briefing keeps the book's labels:

- External claims are as of October 21, 2026, when the book checked them; the Microsoft cloud-first guidance behind the gate G0 rule was read on October 25, 2026.
- The program's own design is labeled as design: the five-clause path, the three closure rules, determinism, the severity windows, the governance board's cadence, the six qualifying tests for a ticket to a machine, and the coverage classes and gap register. The list of what counts as a new Active Directory dependency is the book's design guidance.
- The drift engine's maturity is stated as the book states it for October 2026: schema and provenance detection built, semantic partly built, authorization and identity design only.
- Decision owners come from Chapter 09's responsibility matrix and the chapters' own decision rules. Where the book gives no date for a decision, the "When" column names the event that triggers it, and the notes call it design guidance.

The timing cue at the start of each slide's notes comes from the spoken words at about 142 words a minute: about 4,300 words, or 30 minutes. `build.js` works the cue out, so it stays right when the notes change.

## Build (Git Bash)

```bash
cd presentations/b13-governance-executive
source /c/tmp/deckenv.sh
node build.js B13_Governance_Executive.pptx
python "$VALIDATE" B13_Governance_Executive.pptx
python ../_build/a11y_check.py B13_Governance_Executive.pptx
```

`build.js` prints a line starting with `!` when it estimates that text may overflow its box, when an image runs into the decision bar, when a title is over 58 characters or repeated, when a Sources line is over 185 characters, or when a `narration.json` title doesn't match its slide. A clean build prints none.
