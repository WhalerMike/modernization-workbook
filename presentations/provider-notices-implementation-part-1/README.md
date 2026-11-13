# Provider Notices — implementation, Part 1: collecting what four providers publish

**Deck name: Provider_Notices_Implementation_Part_1.** Part 1 of the two-part deck series on [Provider Notices: An Implementation Guide](../../docs/books/guides/provider-notices-implementation.md), at the level of its gates, with the developer workbook [*Building Provider Notices*](../../docs/project-plans/developer-workbooks/provider-notices/index.md) and its kit [`examples/provider-notices`](../../examples/provider-notices/README.md). It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The guide is a draft awaiting the owner's review; the title slide and the opening narration say so. The series follows the guide's seven gates. For each gate it gives the steps, the commands from the workbook chapter's Lab 1 (fixtures, no tenant) with the kit's real output, the federal requirement and the evidence the ISSO keeps, government-cloud availability as the guide states it (GCC first; GCC High, DoD and the other providers' government regions as short notes), the interim path and the rollback. Part 1 covers the orientation and G1–G4; [Part 2](../provider-notices-implementation-part-2/README.md) covers G5–G7, control states, dangers, evidence, rollback and the checklist.

| Module | Covers | Gate and workbook chapters | Main sources |
|---|---|---|---|
| Orientation | Title (draft notice); why notices go unread, owned by no one; the six kinds from five providers' types; the five providers compared, Oracle Cloud included; prerequisites (decisions, a change process, one reader each); the seven gates on one page | — | Guide, "How to read this guide," "The track at a glance," "The five providers compared," "Prerequisites," "The path on one page" |
| G1 — Azure Service Health | Resource Graph and the least-privileged reader; the five fixture notices; the Service Health alert policy as a plan with a hash; requirement, evidence, availability, rollback | G1; Chapter 01 | Guide, Step 1; workbook Chapter 01 |
| G2 — Microsoft 365 | Message center and service health through the Graph service communications API; the worldwide Graph host for GCC; a provider's action date against a kit rule | G2; Chapter 02 | Guide, Step 2; workbook Chapter 02 |
| G3 — Oracle Cloud Infrastructure | Announcements, chains and the latest in a chain; resources named; the US Government Cloud realms | G3; Chapter 03 | Guide, Step 3; workbook Chapter 03 |
| G4 — AWS Health | The support plan the API needs; who said action is required (AWS's flag or the kit's rule); GovCloud | G4; Chapter 04 | Guide, Step 4; workbook Chapter 04 |
| Close | What G1–G4 leave in the evidence file, and what Part 2 reads from it | Into G5 | Guide, "Evidence"; Steps 5–7 |

| File | Use |
|---|---|
| `Provider_Notices_Implementation_Part_1.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with two source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,240 words), written by `build.js` |
| `Provider_Notices_Implementation_Part_1_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_Provider_Notices_Implementation_Part_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the NPI implementation series' code panel. Every terminal line is read from `data/kit-captures/pn/` at build time |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/provider-notices-implementation-part-1/build.js presentations/provider-notices-implementation-part-1/Provider_Notices_Implementation_Part_1.pptx`. Then `narrate.py`, `captions.py` and `link_sources.py`; the narrated edition comes from `build_narrated.ps1`, and the MP4 from `export_mp4.ps1`.

## Labels and sourcing

Every fact, command and output comes from the implementation guide, a page it links, the developer workbook's Chapters 01–04, or the code, configuration and fixtures under `examples/provider-notices`. The deck adds no external facts; provider facts are the ones the guide and the chapters footnote (read November 9, 2026). Terminal output is the kit's own, from the Lab 1 captures in [`data/kit-captures/pn/`](../../data/kit-captures/pn) (fictional fixtures), read by `build.js` so a slide can't drift from the capture; where a panel leaves out lines or cuts a long line, its label says so. The kit's code is illustrative and fixture-tested, not run against a production tenant, account, tenancy or project. The kit's action rules, the routing and the mapping of outputs to KSIs are design guidance, labeled that way.
