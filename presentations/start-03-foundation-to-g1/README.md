# Start series, Episode 3 — Foundation to Gate G1

**Deck name: Start_03_Foundation_to_G1.** A six-minute narrated executive briefing in the Start series that begins with [Start Here](../start-here/) (Episode 1). It covers Phase 1, weeks 5 to 8, in practice: enterprise dynamic groups and administrative units, the Conditional Access baseline and emergency access accounts, the first HR-to-cloud feed for a foundation scope, IPAM for Tier 0, pilot servers on Azure Arc, each Gate G1 criterion and how it is measured from data, and what can go wrong. It's written for executives and program leads, in plain language, and is built with the shared kit in [`../_build/`](../_build/README.md) and the helpers of Episode 1's `build.js`. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Start_03_Foundation_to_G1.pptx` | The deck: 10 narrated slides, then a backup section with the full source list |
| `build.js` | Slide content and speaker notes (each with a Detail block that names its chapter) |
| `narration.js` | The spoken narration, one entry per narrated slide, keyed by the exact slide title; the build fails if an entry has no slide |

## Slides

| # | Title |
|---|---|
| 1 | Foundation to Gate G1: Weeks Five to Eight |
| 2 | Five workstreams, one foundation |
| 3 | Groups and administrative units: scope from attributes |
| 4 | The Conditional Access baseline, report-only first |
| 5 | Emergency access: the one standing exception |
| 6 | The first HR feed, for a foundation scope |
| 7 | Address management for Tier 0, Arc for pilot servers |
| 8 | Gate G1 is measured from data, not signature |
| 9 | What can go wrong in weeks five to eight |
| 10 | What leadership sees at Gate G1 |

Then **Backup** and **Sources behind this briefing** (not narrated). The last slide points to Episode 4 of the series.

## Sources

Book 01, Chapters 06 and 12 (Phase 1, Gate G1, failure modes, rollback triggers); Book 00, Chapter 09 (Phase 1 and the G1 checklist); Book 02, Chapter 05; Book 03, Chapter 12; Book 04, Chapters 02, 03, 04 and 07; Book 05, Chapter 09; Book 08, Chapter 07. Every fact on the slides comes from a footnoted chapter; each slide carries a short Sources line and its notes name the chapter. Facts as of October 2026. The narration runs about 880 words, about 5.5 minutes at 160 words a minute.

## Build

```bash
cd presentations/start-03-foundation-to-g1
source /c/tmp/deckenv.sh
node build.js Start_03_Foundation_to_G1.pptx
python "$VALIDATE" Start_03_Foundation_to_G1.pptx
python ../_build/a11y_check.py Start_03_Foundation_to_G1.pptx
```

The narrated edition is made later with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base Start_03_Foundation_to_G1`.
