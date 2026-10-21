# Book 10 — Cloud Boundary & Landing Zone: presentation

The 15-minute Why / What / Who / How briefing for [Book 10](../../docs/books/b10-cloud-boundary/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B10_Cloud_Boundary.pptx` | The deck: fifteen narrated slides, then a backup section with the full source list |
| `B10_Cloud_Boundary_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `../_build/build_narrated.ps1`) |
| `B10_Cloud_Boundary_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B10_Cloud_Boundary/` | Per-slide audio and durations |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 10; each slide's notes name the chapter, and the last slide lists the primary sources. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
