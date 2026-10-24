# Start series, Episode 4 — Making the Case at Your Agency

**Deck name: Start_04_Making_the_Case.** A six-minute narrated executive briefing in the Start series that begins with [Start Here](../start-here/) (Episode 1). It covers turning the case into a one-page ask: the four local numbers (Windows Server 2016 count, contractors outside HR, time to revoke a leaver's access, Federal HR 2.0 wave), a pitch for each decider (CIO, CISO, chief human capital officer, authorizing official), the decision with an owner and a date, the charter roles, and what to bring to the meeting. It's written for executives and program leads, in plain language, and is built with the shared kit in [`../_build/`](../_build/README.md) and the helpers of Episode 1's `build.js`. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Start_04_Making_the_Case.pptx` | The deck: 10 narrated slides, then a backup section with the full source list |
| `build.js` | Slide content and speaker notes (each with a Detail block that names its chapter) |
| `narration.js` | The spoken narration, one entry per narrated slide, keyed by the exact slide title; the build fails if an entry has no slide |

## Slides

| # | Title |
|---|---|
| 1 | Making the Case at Your Agency |
| 2 | One page, one decision |
| 3 | Four local numbers that make it real |
| 4 | For the CIO: the clocks and the cost |
| 5 | For the CISO: leavers and account findings |
| 6 | For the CHCO: HR 2.0 and the contractor source |
| 7 | For the authorizing official: evidence over attestation |
| 8 | The decision: an owner, a date and a first gate |
| 9 | Charter roles: who signs what |
| 10 | What to bring to the meeting |

Then **Backup** and **Sources behind this briefing** (not narrated). The last slide points back to the [Start Here](../../docs/start-here.md) page and the books.

## Sources

Book 00, Chapters 01 (clocks) and 03 (charter roles); Book 01, Chapters 09 (who leads; decision rights; sponsor questions) and 12 (Where to start); Book 03, Chapters 02 (orphan timeline; AC-2 and PS-5), 03 (Federal HR 2.0) and 12 (leaver first). The one-page framing, the four local numbers and the per-decider pitches are labeled design guidance on the slides. Every fact on the slides comes from a footnoted chapter; each slide carries a short Sources line and its notes name the chapter. Facts as of October 2026. The narration runs about 880 words, about 5.5 minutes at 160 words a minute.

## Build

```bash
cd presentations/start-04-making-the-case
source /c/tmp/deckenv.sh
node build.js Start_04_Making_the_Case.pptx
python "$VALIDATE" Start_04_Making_the_Case.pptx
python ../_build/a11y_check.py Start_04_Making_the_Case.pptx
```

The narrated edition is made later with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base Start_04_Making_the_Case`.
