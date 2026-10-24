# Book 09 — SD-WAN: technical deep dive

The 50-minute SD-WAN technical presentation for [Book 09](../../docs/books/b09-network/index.md), built with the shared kit in [`../_build/`](../_build/README.md). The Book 09 technical deck in [`../b09-network-technical/`](../b09-network-technical/README.md) covers SD-WAN as one module among four; this deck stays on SD-WAN throughout and goes a level deeper, for the engineers and architects who design, secure and evidence a branch fabric. It doesn't repeat that deck's slides. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; three layers and one question; the order of operations | 02, 05, 13 |
| 1 — Transport and the branch edge | 1. Transport physics, and what SD-WAN can fix | 01, 02, 05 |
| | 2. The branch edge and TIC 3.0 | 02, 03, 05, 08, 12, Appendix A |
| 2 — Governing and transforming | 3. Securing and governing the fabric | 02, 05, 06, 08 |
| | 4. The field-office transformation | 10, 11, 13 |

| File | Use |
|---|---|
| `B09_SDWAN_Technical.pptx` | The deck: 31 narrated slides, then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,800 words, about 20 minutes); `narrate.py` speaks this instead of the speaker notes and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (audio folder, captions and practice script) is generated separately with `narrate.py`, `captions.py` and `build_narrated.ps1`; it isn't in this folder yet.

The speaker notes carry the full detail for a live presenter: about 7,600 words, about 53 minutes at 142 words a minute, so a session of roughly 50 minutes live. Each note carries its timing cue, and `build.js` prints the words and minutes per module. The narration is shorter and conversational: it gives each slide's intent and one or two highpoints and leaves the detail to the notes.

Every fact on the slides comes from a footnoted chapter of Book 09; each slide's notes end by naming the chapter, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The book's labels are kept: program positions (the egress-pattern choice, the narrow Optimize exemption, device-side tenant restrictions as a cutover precondition, the step-zero control set, the branch design rules, the roadmap) are design guidance; phase inversion is the book's inference; the governed path is marked as a proposal, not a ratified direction; and the field-office sizing and cost figures are illustrative planning estimates with their assumptions labeled, not quotes. Vendor names appear only where the book uses them (the 2026 emergency directive, and the documented forward-error-correction example); the field-office bill of materials is described, as in the book, as one vendor's line used as a costable example. Content is defensive only.

Eleven diagrams are reused from the committed set in `docs/images/diagrams/b09-network/png/` (`ch01-propagation-floor`, `ch02-branch-edge`, `ch05-path-classes`, `ch05-governor-attack-surface`, `ch05-overlay-tunnel`, `ch08-branch-architectures`, `ch10-refresh-fork`, `ch11-hub-content-tier`, `ch11-retirement-gates`, `ch12-optimize-exemption-paths`, `ch13-paired-branch`), placed at their PNG aspect ratio with the chapters' full alt text. `build.js` throws if a slide title is longer than 58 characters or repeated, or if a Sources line is longer than 185 characters, and warns when a table, panel or callout is likely to overflow or a panel has more than 0.6 in of slack; run it with `FIT=1` to print each table's, panel's and image's estimated bottom edge.
