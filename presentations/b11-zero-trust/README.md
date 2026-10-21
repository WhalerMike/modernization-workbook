# Book 11 — Zero Trust & Assessment: presentation

The 15-minute Why / What / Who / How briefing for [Book 11](../../docs/books/b11-zero-trust/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B11_Zero_Trust.pptx` | The deck: fourteen narrated slides (the title and thirteen content slides), then a backup section with the full source list |
| `B11_Zero_Trust_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `../_build/build_narrated.ps1`) |
| `B11_Zero_Trust_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B11_Zero_Trust/` | Per-slide audio and durations |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 11; each slide's notes name the chapter, and the last slide lists the primary sources. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
