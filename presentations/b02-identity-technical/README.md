# Book 02 — Identity & Directory: technical deep dive

The 50-minute technical presentation for [Book 02](../../docs/books/b02-identity/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b02-identity/`](../b02-identity/README.md), for the architects and engineers who run the migration. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules of 8 to 14 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why identity matters; what the migration has to move | 01–04 (recap) |
| 1 — Assessing the forest | 1. Read-only discovery | 07 |
| | 2. Assessing the forest | 08, Appendices B–C |
| 2 — Building the target and migrating | 3. Building the Entra ID target | 09, Appendix C |
| | 4. Migrating, governing and proving it | 10, 11 |

| File | Use |
|---|---|
| `B02_Identity_Technical.pptx` | The deck: 28 narrated slides, then a backup section with the full source lists |
| `B02_Identity_Technical_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `build_narrated.ps1`) |
| `B02_Identity_Technical_Narration_Script.md` | The narration text, for practice |
| `narration_B02_Identity_Technical/` | Per-slide audio, durations and captions |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 02; each slide's notes name the chapter, each slide carries a short Sources line, and the two backup slides list the primary sources in full. The slides show tables, flows and decision matrices; the code stays in the chapters and appendices.

`build.js` computes each slide's timing cue from its word count (142 words a minute) and warns when a table or panel is likely to overflow.
