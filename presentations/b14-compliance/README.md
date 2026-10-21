# Book 14 — Federal Compliance & Authorization: presentation

The 15-minute Why / What / Who / How briefing for [Book 14](../../docs/books/b14-compliance/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. The audience is authorizing officials, ISSOs and CIOs.

| File | Use |
|---|---|
| `B14_Compliance.pptx` | The deck: thirteen narrated slides (the title and twelve content slides), then a backup section with the full source list |
| `B14_Compliance_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B14_Compliance/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B14_Compliance_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B14_Compliance_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 14; each slide's notes name the chapter, and the last slide lists the primary sources. Dates were checked against their issuing documents on October 21, 2026; those marked with an asterisk are counted from a stated period. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
