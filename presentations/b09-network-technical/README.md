# Book 09 — Network & Transport: technical deep dive

The 50-minute technical presentation for [Book 09](../../docs/books/b09-network/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's the companion to the 15-minute briefing in [`../b09-network/`](../b09-network/README.md) and the executive briefing in [`../b09-network-executive/`](../b09-network-executive/README.md), for the network engineers and architects who move branches off hairpinned transport without a compliance regression. This folder sits outside `docs/`, so the site doesn't render it.

The deck has two parts of about 25 minutes each, split into four modules of 11 to 13 minutes, each opened by a divider slide so it can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; the floor, the pipe and the governor; the order of operations | 01–02 (recap), 09, 13 |
| 1 — Policy and transport | 1. TIC 3.0 in practice, and token security | 03, 04 |
| | 2. Governed transport and legacy protocols | 05, 06 |
| 2 — Access and architecture | 3. Network access control after AD | 07 |
| | 4. Reference architecture and ownership | 08, 09, 13, Appendices A–B |

| File | Use |
|---|---|
| `B09_Network_Technical.pptx` | The deck: 32 narrated slides, then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,950 words, about 21 minutes); `narrate.py` speaks this instead of the speaker notes and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B09_Network_Technical_Narrated.pptx`, its audio folder, captions and practice script) is generated separately with `narrate.py`, `captions.py` and `build_narrated.ps1`; it isn't in this folder yet.

The speaker notes carry the full detail for a live presenter: about 7,350 words, about 52 minutes at 142 words a minute, so a session of roughly 50 minutes live. Each note carries its timing cue, and `build.js` prints the words and minutes per module. The narration is shorter and conversational: it gives each slide's intent and one or two highpoints and leaves the detail to the notes.

Every fact on the slides comes from a footnoted chapter of Book 09; each slide's notes end by naming the chapter, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. Program positions (the MTIPS exit criterion, EAP-TLS everywhere, the policy tiers, VLAN examples and session timers, the rollout phases, the responsibility matrix) are labeled design guidance, and the book's inferences (for example, the RADIUS server certificate handling in the CLM platform) are labeled inference, as the chapters label them. The governed-path material is marked as a proposal, not a ratified direction. Content is defensive only. The slides show tables, flows and decision matrices; configuration examples stay in the chapters, which mark them as illustrative.

Two diagrams are reused from the committed set in `docs/images/diagrams/b09-network/png/` (`ch06-round-trip-decomposition`, `ch07-admission-decision`), placed at their PNG aspect ratio with full alt text. `build.js` throws if a slide title is longer than 58 characters or repeated, or if a Sources line is longer than 185 characters, and warns when a table or panel is likely to overflow; run it with `FIT=1` to print each table's estimated bottom edge.
