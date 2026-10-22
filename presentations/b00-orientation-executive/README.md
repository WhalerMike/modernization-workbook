# Book 00 — Orientation & Program: executive briefing

**Deck name: B00_Orientation_Executive.** The 30-minute executive version of the Why / What / Who / How briefing for [Book 00](../../docs/books/b00-orientation/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's written for executive sponsors, CIOs, CISOs and program executives, and it centers on decisions: every decision slide carries a bar that names the decision, who owns it and when it's needed. It has no configuration detail; the [15-minute deck](../b00-orientation/README.md) and the book's Chapters 08 to 10 carry the milestones and checklists. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B00_Orientation_Executive.pptx` | The deck: twenty narrated slides (the title and nineteen content slides), then a backup section with the full source list and a slide-to-chapter map |
| `B00_Orientation_Executive_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B00_Orientation_Executive/` | Per-slide audio, durations, sentence timings and WebVTT captions (`narrate.py`, `captions.py`) |
| `B00_Orientation_Executive_Narrated.vtt` | Whole-briefing captions, for an MP4 (written by `../_build/captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

The narration files are produced by the narration step and aren't in the folder until it runs. The self-running `B00_Orientation_Executive_Narrated.pptx` (and an MP4) can then be built with `../_build/build_narrated.ps1 -Base B00_Orientation_Executive`.

## How it differs from the 15-minute deck

- **Decision-centered.** Each decision slide ends with a bar that states the decision, its owner and when it's needed, taken from the book's decision rights (Chapter 07, with the gate owners Book 01 sets), the charter's next steps (Chapter 03) and the plan's first five actions (Chapter 05). The closing slide gathers them into one table.
- **No configuration detail.** No milestone IDs, platform build steps, file names or scripts; the 15-minute deck and Chapters 08 to 10 carry those.
- **More of the What and Who.** Separate slides for the federal clocks and the vendor clocks, the success criteria, the workstreams and critical path, the three decisions the source plans misplaced, the people estimate, and the risk register.

## What the briefing covers

| Part | Slides | Book 00 source |
|---|---|---|
| **Why** | The governance the directory supplied; federal policy dates; vendor support dates; what the clocks don't require, and why one program | Chapters 01, 03 and 07; Appendix A |
| **What** | The charter; six success criteria and their gates; fifteen principles; seven phases and six gates; five workstreams and the critical path; seven complementary projects | Chapters 03 to 06 and 10 |
| **Who** | One decider per row; three decisions on the wrong desk; the people and the rhythm | Chapter 07, with 03 and 08; Appendix A |
| **How** | Pre-flight and G0; foundation and pilot; rollout and retirement; steady state and the scorecard; the risk register; the decisions, owners and dates | Chapters 07 to 10; Appendix A |

Every fact on the slides comes from a footnoted chapter of Book 00, including the cross-book facts it states (Book 01's phases, gates and gate owners); each slide's notes name the chapter, each slide carries a short Sources line, and the backup section lists the sources in full. The M-26-14 deadlines on the Why slides are the program's arithmetic from the Logging Reference Architecture's publication date, as Chapter 01 says, not dates OMB published. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute (about 4,290 words, just over 30 minutes), so it stays right when the notes are edited.

## Build

```bash
source /c/tmp/deckenv.sh
node presentations/b00-orientation-executive/build.js presentations/b00-orientation-executive/B00_Orientation_Executive.pptx
python presentations/_build/a11y_check.py presentations/b00-orientation-executive/B00_Orientation_Executive.pptx
python presentations/_build/narrate.py presentations/b00-orientation-executive/B00_Orientation_Executive.pptx
python presentations/_build/captions.py presentations/b00-orientation-executive/B00_Orientation_Executive.pptx
```

Delete a slide's MP3 after changing its notes, so `narrate.py` records it again.
