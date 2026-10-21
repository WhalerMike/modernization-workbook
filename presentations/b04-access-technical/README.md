# Book 04 — Access & Privilege: technical deep dive

**Deck name:** `B04_Access_Technical`

The 50-minute technical session for [Book 04](../../docs/books/b04-access/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It is the companion to the 15-minute briefing in [`../b04-access/`](../b04-access/README.md): that deck makes the argument, this one walks identity engineers, architects and assessors through how it is built and proved. This folder sits outside `docs/`, so the site doesn't render it.

## Structure

A two-slide orientation, then five modules of about ten minutes. Each module opens with a divider slide listing its slides and their Why / What / Who / How part, so the narrated edition can be watched in parts.

| Section | Slides | Chapters |
|---|---|---|
| Orientation | Title; every access decision is a policy decision; how Conditional Access computes the decision | 01, 03 |
| Module 1 — The Conditional Access policy library | Numbering and prerequisites; personas; the five waves (CA001–CA038, CA090); BOD 25-01 | 03, 07, Appendix A |
| Module 2 — Rollout, exclusions and break-glass | Rollout gates; report-only results and rollback; governed exclusions; break-glass; monitoring and drift | 02, 03, 04, 07 |
| Module 3 — PIM self-request with approval | The activation gate; controls by tier; build order, authentication context and protected actions; approvers, alerts and records | 04, 08, Appendix B |
| Module 4 — Access governance | Access packages; reviews; Lifecycle Workflows and guests | 08, 09, Appendix B |
| Module 5 — Access as code and evidence | Tool coverage; change control and drift; what the assessor reads; close | 08, 10 |
| Backup (not narrated) | Policy index CA001–CA090; full source lists | 07; all |

28 narrated slides, about 6,900 words of narration (about 49 minutes at 142 words a minute; each note carries its timing cue). Code, JSON and queries stay in the chapters; the slides carry tables, flows and decision matrices.

## Files

| File | Use |
|---|---|
| `B04_Access_Technical.pptx` | The deck: 28 narrated slides, then a backup section with the policy index and the full source list |
| `B04_Access_Technical_Narration_Script.md` | The narration text, for practice |
| `narration_B04_Access_Technical/` | Per-slide audio, durations, sentence timings and WebVTT captions |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

Every fact on the slides comes from a footnoted chapter of Book 04; each slide's notes name the chapter and each slide carries a short sources line. Where chapters give different values for the same setting, the deck follows the more specific source (for privileged-role review cadence, Chapter 08 and Appendix B, which state that they govern where they differ from earlier tables).

The self-running edition (`B04_Access_Technical_Narrated.pptx`, and an optional MP4) is produced with `../_build/build_narrated.ps1 -Base B04_Access_Technical`, which needs PowerPoint closed.
