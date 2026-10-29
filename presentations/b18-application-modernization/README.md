# Book 18 — Application Modernization: presentation

The 15-minute Why / What / Who / How briefing for [Book 18](../../docs/books/b18-application-modernization/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. The audience is CIOs and portfolio owners, enterprise and solution architects, database and data teams, AI and application teams, ISSOs, privacy officers and authorizing officials.

| File | Use |
|---|---|
| `B18_Application_Modernization.pptx` | The deck: thirteen narrated slides (the title and twelve content slides), then a backup section with the full source lists |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide; `../_build/narrate.py` speaks it instead of the speaker notes, which keep the fuller detail for a live delivery |
| `B18_Application_Modernization_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B18_Application_Modernization/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B18_Application_Modernization_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B18_Application_Modernization_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 18; each slide's notes name the chapter, and the backup slides list the primary sources. Federal, GAO, NIST, CISA and vendor facts were checked by the book's chapters against their sources on October 28–29, 2026. Product versions and support windows move by the month: Java 25 is the current long-term support release, Spring Boot 4.1 is current and 4.0 loses open-source support at the end of 2026, Node.js 26 enters long-term support on October 28, 2026, and the migration tools' versions, AI features and Region availability change with each release, so recheck each before a plan rests on it. The six dispositions, the scored rubric, the target stack, the three-check data validation, the agent guardrails, the four gates, the waves and the factory are the program's design, as the book labels them, not federal requirements; what federal policy requires is an enterprise architecture with a baseline, a target and a transition plan, a disposition for legacy systems, and delivery in useful segments. The reference implementation is illustrative: its tests pass against a real PostgreSQL engine, but it hasn't been run against a real DB2 or Oracle database, a real model, or in production. Vendors and products are named as examples, not endorsements. Diagrams are the book's committed PNGs, with alt text read from each chapter's figure description at build time. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
