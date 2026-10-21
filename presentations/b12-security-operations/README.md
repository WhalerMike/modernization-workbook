# Book 12 — Security Operations & Telemetry: presentation

The 15-minute Why / What / Who / How briefing for [Book 12](../../docs/books/b12-security-operations/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B12_Security_Operations.pptx` | The deck: fourteen narrated slides (the title and thirteen content slides), then a backup section with the full source list |
| `B12_Security_Operations_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B12_Security_Operations/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B12_Security_Operations_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B12_Security_Operations_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 12; each slide's notes name the chapter, and the last slide lists the primary sources. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
