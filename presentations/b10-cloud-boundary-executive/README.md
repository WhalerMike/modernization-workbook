# Book 10 — Cloud Boundary & Landing Zone: executive briefing

**Deck name: B10_Cloud_Boundary_Executive.** The 30-minute executive version of the Why / What / Who / How briefing for [Book 10](../../docs/books/b10-cloud-boundary/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's written for authorizing officials, ISSOs, CIOs and CISOs, and it centers on decisions: every decision slide carries a bar that names the decision, who owns it and when it's needed. It has no configuration detail; the [15-minute deck](../b10-cloud-boundary/README.md) and the book's Chapters 05 to 07 carry the landing-zone mechanics. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B10_Cloud_Boundary_Executive.pptx` | The deck: sixteen narrated slides, then a backup section with the full source list and a slide-to-chapter map |
| `B10_Cloud_Boundary_Executive_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B10_Cloud_Boundary_Executive/` | Per-slide audio, durations, sentence timings and WebVTT captions (`narrate.py`, `captions.py`) |
| `B10_Cloud_Boundary_Executive_Narrated.vtt` | Whole-briefing captions, for an MP4 (written by `../_build/captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The self-running `B10_Cloud_Boundary_Executive_Narrated.pptx` (and an MP4) can be built from these files with `../_build/build_narrated.ps1 -Base B10_Cloud_Boundary_Executive`.

## What the briefing covers

| Part | Slides | Book 10 source |
|---|---|---|
| **Why** | Three checks, three owners; why the gap stays invisible, and the example corrected | Chapters 01, 02 |
| **What** | FedRAMP 2026 (certified services, Classes A–D, the dates); "the boundary" as four obligations; change notification and evidence as a feed; GCC's published exclusions; why a higher class won't restore a feature | Chapters 03, 04 |
| **Who** | One decider per row; five decisions that look like engineering | Chapter 08 (with 05 and 07) |
| **How** | Three honest responses; exceptions and the rules' limits; the alternative path; what to ask a provider for; evidencing the boundary in the package; five decisions and the next step | Chapters 09, 10, 11; Appendix A |

Every fact on the slides comes from a footnoted chapter of Book 10; each slide's notes name the chapter, and the backup section lists the sources in full. One date comes from outside Book 10: the announcement of the Consolidated Rules for 2026 on June 25, 2026, which [Book 01, Chapter 12](../../docs/books/b01-transformation-arc/12-migration-roadmap.md) footnotes. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
