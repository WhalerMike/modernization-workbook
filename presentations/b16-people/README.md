# Book 16 — People: Training & Education: presentation

The 15-minute Why / What / Who / How briefing for [Book 16](../../docs/books/b16-people/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. The audience is CIOs and CISOs, chief human capital officers and training leads, ISSOs, and help desk leads.

| File | Use |
|---|---|
| `B16_People.pptx` | The deck: fourteen narrated slides (the title and thirteen content slides), then a backup section with the full source list |
| `B16_People_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B16_People/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B16_People_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B16_People_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 16; each slide's notes name the chapter, and the last slide lists the primary sources. Federal, NIST, Microsoft and vendor facts were checked by the book's chapters against their sources on October 21–22, 2026. Certification names, exams and lab offerings change often, so recheck them before a plan rests on one. Thresholds, credentials, lab tiers and wave timings on the slides are the program's design, as the book labels them, not federal requirements. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
