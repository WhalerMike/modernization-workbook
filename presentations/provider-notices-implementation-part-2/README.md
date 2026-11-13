# Provider Notices — implementation, Part 2: routing, the digest, evidence and rollback

**Deck name: Provider_Notices_Implementation_Part_2.** Part 2 of the two-part deck series on [Provider Notices: An Implementation Guide](../../docs/books/guides/provider-notices-implementation.md), at the level of its gates, with the developer workbook [*Building Provider Notices*](../../docs/project-plans/developer-workbooks/provider-notices/index.md) and its kit [`examples/provider-notices`](../../examples/provider-notices/README.md). It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The guide is a draft awaiting the owner's review; the title slide and the opening narration say so. The series follows the guide's seven gates. For each gate it gives the steps, the commands from the workbook chapter's Lab 1 (fixtures, no tenant) with the kit's real output, the federal requirement and the evidence the ISSO keeps, government-cloud availability as the guide states it (GCC first; GCC High, DoD and the other providers' government regions as short notes), the interim path and the rollback. [Part 1](../provider-notices-implementation-part-1/README.md) covers the orientation and G1–G4; Part 2 covers G5–G7, then control states and change safety, dangers, evidence by gate, rollback, what couldn't be verified, and the checklist.

| Module | Covers | Gate and workbook chapters | Main sources |
|---|---|---|---|
| Recap | Title (draft notice); where Part 1 left off: one record, five providers, collected from the day-one fixtures | — | Guide, "The track at a glance"; workbook Chapter 06, Lab 1 |
| G5 — Google Cloud | Personalized Service Health, the viewer role, incidents only; two fixture incidents and the one unverified call; Assured Workloads | G5; Chapter 05 | Guide, Step 5; workbook Chapter 05 |
| G6 — Routing | Every notice that needs action to an owner as a Ticket-to-Machine typed task; day one makes twelve tasks, once; a week later and the five clauses; requirement, evidence, interim path, rollback | G6; Chapter 06 | Guide, Step 6; workbook Chapter 06; the Ticket-to-Machine reference |
| G7 — Digest and evidence | Preflight, the weekly run and the go/no-go; the digest and the hash-chained evidence; what the ISSO keeps, and an edited file found | G7; Chapters 07 and 08 | Guide, Step 7; workbook Chapters 07–08 |
| Running it safely | Control states and change safety; dangers; evidence by gate; rollback by gate, and what couldn't be verified | All gates | Guide, "Control states, change safety and assessment mapping," "Dangers," "Evidence," "Rollback," "What couldn't be verified" |
| Close | The guide's checklist; the workbook, its tours and the learning path | — | Guide, "Checklist" |

| File | Use |
|---|---|
| `Provider_Notices_Implementation_Part_2.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with two source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,260 words), written by `build.js` |
| `Provider_Notices_Implementation_Part_2_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_Provider_Notices_Implementation_Part_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the NPI implementation series' code panel. Every terminal line is read from `data/kit-captures/pn/` at build time |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/provider-notices-implementation-part-2/build.js presentations/provider-notices-implementation-part-2/Provider_Notices_Implementation_Part_2.pptx`. Then `narrate.py`, `captions.py` and `link_sources.py`; the narrated edition comes from `build_narrated.ps1`, and the MP4 from `export_mp4.ps1`.

## Labels and sourcing

Every fact, command and output comes from the implementation guide, a page it links, the developer workbook's Chapters 05–08, or the code, configuration and fixtures under `examples/provider-notices`. The deck adds no external facts; provider facts are the ones the guide and the chapters footnote (read November 9, 2026). Terminal output is the kit's own, from the Lab 1 captures in [`data/kit-captures/pn/`](../../data/kit-captures/pn) (fictional fixtures), read by `build.js` so a slide can't drift from the capture; where a panel leaves out lines or cuts a long line, its label says so. The kit's code is illustrative and fixture-tested, not run against a production tenant, account, tenancy or project. The kit's action rules, the routing and the mapping of outputs to KSIs are design guidance, labeled that way.
