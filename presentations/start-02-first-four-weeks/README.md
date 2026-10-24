# Start series, Episode 2 — The First Four Weeks

**Deck name: Start_02_First_Four_Weeks.** A six-minute narrated executive briefing in the Start series that begins with [Start Here](../start-here/) (Episode 1). It covers what Phase 0, the four-week pre-flight, actually produces: the entry conditions, the platform host, the read-only assessment of the estate and its provenance, seeding the repository, least-privilege access for the program itself, owners and classified findings, Gate G0 "Ready to Plan" and what leadership holds at week four. It's written for executives and program leads, in plain language, and is built with the shared kit in [`../_build/`](../_build/README.md) and the helpers of Episode 1's `build.js`. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Start_02_First_Four_Weeks.pptx` | The deck: 11 narrated slides, then a backup section with the full source list |
| `build.js` | Slide content and speaker notes (each with a Detail block that names its chapter) |
| `narration.js` | The spoken narration, one entry per narrated slide, keyed by the exact slide title; the build fails if an entry has no slide |

## Slides

| # | Title |
|---|---|
| 1 | The First Four Weeks: What Phase 0 Produces |
| 2 | Four weeks, one goal, one exit |
| 3 | Day one: three entry conditions |
| 4 | The platform host: where every decision is written down |
| 5 | Reading the estate without changing it |
| 6 | What the assessment inventories |
| 7 | Provenance, and seeding the repository |
| 8 | Least privilege for the program's own access |
| 9 | Owners named, findings classified |
| 10 | Gate G0, Ready to Plan: the checklist |
| 11 | What leadership sees at week four |

Then **Backup** and **Sources behind this briefing** (not narrated). The last slide points to Episode 3 of the series.

## Sources

Book 01, Chapters 03 (platform foundation), 10 (analyzing the estate) and 12 (Phase 0, Gate G0); Book 00, Chapters 01, 03 (charter roles) and 08 (pre-flight sequence, finding classes, the G0 checklist). Every fact on the slides comes from a footnoted chapter; each slide carries a short Sources line and its notes name the chapter. Facts as of October 2026. The narration runs about 940 words, just under 6 minutes at 160 words a minute.

## Build

```bash
cd presentations/start-02-first-four-weeks
source /c/tmp/deckenv.sh
node build.js Start_02_First_Four_Weeks.pptx
python "$VALIDATE" Start_02_First_Four_Weeks.pptx
python ../_build/a11y_check.py Start_02_First_Four_Weeks.pptx
```

The narrated edition is made later with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base Start_02_First_Four_Weeks`.
