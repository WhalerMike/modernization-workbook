# Book 20 — Information Protection & Microsoft Purview: presentation

The 15-minute Why / What / Who / How briefing for [Book 20](../../docs/books/b20-information-protection/index.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it. The audience is CIOs and CISOs, data owners, records officers and privacy officials, Purview and Microsoft 365 engineers, and ISSOs.

**Draft.** Book 20 is a draft awaiting the editor's review and isn't part of Release 2.0, the baseline edition. The title slide and the narration say so. Rebuild the deck when the book's review changes a page it draws on.

| File | Use |
|---|---|
| `B20_Information_Protection.pptx` | The deck: fourteen narrated slides (the title and thirteen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide; `build.js` puts the same words in each slide's notes and checks each title |
| `B20_Information_Protection_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B20_Information_Protection/` | Per-slide audio, durations, sentence timings and WebVTT caption tracks |
| `B20_Information_Protection_Narrated.vtt` | One caption track for the whole narration (written by `../_build/captions.py`), for an MP4 |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B20_Information_Protection_Narrated.pptx` (and an MP4) is built from these files by `../_build/build_narrated.ps1` on a machine with PowerPoint.

Every fact on the slides comes from a footnoted chapter of Book 20; each slide's notes name the chapter, and the last slide lists the primary sources. The narration names the original sources (Microsoft Learn, NIST, OMB, CISA, 32 CFR Part 2002) and the book by its title. Microsoft 365 GCC is the baseline: each slide that depends on a cloud gives GCC's status first, with GCC High and DoD as side notes. Microsoft Learn, federal and NIST facts were checked by the book's chapters against their sources on November 11, 2026, and government-cloud feature status is subject to change, so recheck each before a plan rests on it. A missing license or cloud feature is a dependency recorded in a decision record, not a failed control. Class registers, label designs, defaults, container settings, DLP outcomes, rings and metrics are the program's design, as the book labels them, not federal requirements, and the evidence supports the controls it maps to; the assessor or authorizing official decides. Windows is the only endpoint platform in scope. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute.
