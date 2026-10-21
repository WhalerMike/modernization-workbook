# Book 15 — Compliance Automation & Day-2 Operations: presentation

The 15-minute Why / What / Who / How briefing for [Book 15](../../docs/books/b15-day2-operations/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. The audience is CIOs, service desk and operations leads, and ISSOs.

| File | Use |
|---|---|
| `B15_Day2_Operations.pptx` | The deck: thirteen narrated slides (the title and twelve content slides), then a backup section with the full source list |
| `B15_Day2_Operations_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B15_Day2_Operations/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B15_Day2_Operations_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B15_Day2_Operations_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 15; each slide's notes name the chapter, and the last slide lists the primary sources. Vendor and federal facts were checked by the book's chapters against their sources on October 21, 2026, and vendor capabilities change by release, so recheck them before a plan rests on one. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
