# Book 01 — The Transformation Arc: executive briefing

**Deck name: B01_Transformation_Arc_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 01](../../docs/books/b01-transformation-arc/index.md), for executive sponsors, CIOs, CISOs and authorizing officials. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b01-transformation-arc/`](../b01-transformation-arc/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B01_Transformation_Arc_Executive.pptx` | The deck: nineteen narrated slides (the title and eighteen content slides), then a backup section with the full source list and a slide-to-chapter map |
| `B01_Transformation_Arc_Executive_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B01_Transformation_Arc_Executive/` | Per-slide audio, durations, sentence timings and caption tracks (`narrate.py`, `captions.py`) |
| `B01_Transformation_Arc_Executive_Narrated.vtt` | One caption track for the narrated video (written by `../_build/captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

The self-running `B01_Transformation_Arc_Executive_Narrated.pptx` (and an MP4) can be built from these files with `../_build/build_narrated.ps1 -Base B01_Transformation_Arc_Executive`.

## What the briefing covers

| Part | Slides | Book 01 source |
|---|---|---|
| **Why** | Every mandate assumes a foundation never built; Active Directory was the governance nobody wrote down; five things must be true first | Chapters 01, 02 |
| **What** | One decision-level slide each for the platform, identity, policy, network services, compute and the access plane | Chapters 03–08 |
| **Who** | Instruments versus orchestra; one decider per decision; three decisions that land on the wrong desk | Chapter 09 |
| **How** | Analyzing the estate; the analyze–plan–deliver cycle and its actuation ceiling; the seven-phase roadmap; gates, rollback triggers and gate authority; the external clocks; the decisions and where to start | Chapters 10, 11, 12 |

## How it differs from the 15-minute deck

- **Decision-centered.** Each decision slide ends with a bar that states the decision, its owner and when it's needed, taken from the book's decision matrix (Chapter 09) and its gates and phase entry criteria (Chapter 12). The closing slide gathers them into one table. One slide (the five prerequisites) carries a callout instead, because the book assigns no owner to it.
- **No configuration detail.** No attribute names, PowerShell versions, policy numbers, plan formats or baseline IDs; the 15-minute deck and the book's chapters carry those.
- **More of the Who and How.** Separate slides for the decisions that land on the wrong desk (legacy-authentication end dates, help desk identity checks, records retention), gate authority and rollback, and the external clocks the roadmap runs against.

Every fact on the slides comes from a footnoted chapter of Book 01; each slide's notes end with the chapter they draw on, each slide carries a short Sources line, and the backup slides list the primary sources. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute (about 4,230 words, just under 30 minutes), so it stays right when the notes are edited.

## Build

```bash
source /c/tmp/deckenv.sh
node presentations/b01-transformation-arc-executive/build.js presentations/b01-transformation-arc-executive/B01_Transformation_Arc_Executive.pptx
python "$VALIDATE" presentations/b01-transformation-arc-executive/B01_Transformation_Arc_Executive.pptx
python presentations/_build/a11y_check.py presentations/b01-transformation-arc-executive/B01_Transformation_Arc_Executive.pptx
python presentations/_build/narrate.py presentations/b01-transformation-arc-executive/B01_Transformation_Arc_Executive.pptx
python presentations/_build/captions.py presentations/b01-transformation-arc-executive/B01_Transformation_Arc_Executive.pptx
```

Delete a slide's MP3 after changing its notes, so `narrate.py` records it again.
