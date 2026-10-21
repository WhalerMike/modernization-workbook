# Book 00 — Orientation & Program: presentation

The 15-minute Why / What / Who / How briefing for [Book 00](../../docs/books/b00-orientation/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. Audience: executives and sponsors.

| File | Use |
|---|---|
| `B00_Orientation.pptx` | The deck: thirteen narrated slides (the title and twelve content slides), then a backup section with the full source list |
| `B00_Orientation_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `../_build/build_narrated.ps1`) |
| `B00_Orientation_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B00_Orientation/` | Per-slide audio, durations and caption tracks |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 00; each slide's notes name the chapter, and the last slide lists the primary sources. The title slide's notes carry the book's "guidance, not federal policy" point. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
