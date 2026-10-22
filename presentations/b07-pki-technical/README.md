# Book 07 — PKI & Certificates: technical deep dive

The 50-minute technical presentation for [Book 07](../../docs/books/b07-pki/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b07-pki/`](../b07-pki/README.md), for the PKI engineers and architects who run the move off AD CS. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules of 10 to 13 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why certificates outlive the migration; what AD CS holds up | 01–02 (recap) |
| 1 — Hardening and the target | 1. Hardening what stays | 03 |
| | 2. The target PKI | 04 |
| 2 — Issuing, migrating and retiring | 3. Device and user certificates | 06, Appendix A.2 |
| | 4. Coexistence, migration, lifecycle and decommissioning | 07, 08, Appendices A–B |

| File | Use |
|---|---|
| `B07_PKI_Technical.pptx` | The deck: 30 narrated slides, then a backup section with the full source lists |
| `B07_PKI_Technical_Narrated.pptx` | Self-running version with the narration embedded and slide timings set (built by `build_narrated.ps1`; not yet generated) |
| `B07_PKI_Technical_Narration_Script.md` | The narration text, for practice (`narrate.py` rewrites it when the audio is made) |
| `narration_B07_PKI_Technical/` | Per-slide audio, durations and captions (made by `narrate.py` and `captions.py`; not yet generated) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

About 7,200 words of narration, about 50 minutes at 142 words a minute; each note carries its timing cue, and `build.js` prints the words and minutes per module.

Every fact on the slides comes from a footnoted chapter of Book 07; each slide's notes name the chapter, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The ESC1–ESC8 material is defensive only, as in Chapter 03: what each misconfiguration is, how to detect it and how to fix it. Ratings, thresholds and durations that are the program's own (the risk-scoring matrix, wave gates and durations, the 30-day rollback window) are labeled as such on the slides. The slides show tables, checklists and decision matrices; the commands stay in the chapters and appendices, which mark them as illustrative.

`build.js` computes each slide's timing cue from its word count (142 words a minute) and warns when a table or panel is likely to overflow; run it with `FIT=1` to print each table's estimated bottom edge.
