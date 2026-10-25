# Book 10 — Cloud Boundary & Landing Zone: technical deep dive

The 50-minute technical presentation for [Book 10](../../docs/books/b10-cloud-boundary/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It goes deeper than the 15-minute briefing in [`../b10-cloud-boundary/`](../b10-cloud-boundary/README.md) and the executive briefing in [`../b10-cloud-boundary-executive/`](../b10-cloud-boundary-executive/README.md). It's for the cloud and platform engineers who build the landing zone, and the ISSOs who evidence what it contains. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 50 minutes live, in two parts of about 25 minutes each. Each part has two modules of 12 to 15 minutes, and each module opens with a divider slide so it can be watched on its own:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why the license is not the boundary | 01 (recap) |
| 1 — The boundary and what it removes | 1. Why the boundary decides: three checks, the invisible boundary, FedRAMP 2026 | 01, 02, 03 |
| | 2. GCC, the gap and three responses: exclusions, equivalents, exceptions, the alternative path | 04, 09, 10 |
| 2 — Building it and owning it | 3. Landing zone and front door: policy, AWS and GovCloud, IPAM, network as code | 05, 06, 07 |
| | 4. Who owns it, and the package: owners, the boundary record, narratives, provider asks; decisions | 08, 11, Appendix A |

| File | Use |
|---|---|
| `B10_Cloud_Boundary_Technical.pptx` | The deck: 32 narrated slides, then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 2,860 words, about 20 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B10_Cloud_Boundary_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,600 words, each note carrying its timing cue at 142 words a minute, and `build.js` prints the words and minutes per module. `build.js` also refuses a slide title longer than 58 characters or used twice, and a Sources line longer than 185 characters. It warns when a table, panel, note box, callout or diagram is likely to overflow, or when a panel is much taller than its text. Panels and note boxes are sized to their content. With `FIT=1` it prints each table's estimated bottom edge.

Every fact on the slides comes from a footnoted chapter of Book 10. Each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. Marketplace and documentation status is given as of the book's read date, October 21, 2026. The program's own recommendations are labeled design guidance: the four impact dimensions and the boundary probe, the register fields, the adapter contract, the CMDB requirements, the five network modules, the provisioning loop, the responsibility matrix and the boundary record. Readings between sources are labeled inference, such as the reading of the second, same-named GCC package at Class D, as the book does. The public collaboration-suite example is described without naming the departments involved. The slides show tables, diagrams and checklists. The Bicep, policy and configuration samples stay in the chapters, which mark them as illustrative and untested against production. The fifteen diagrams on the slides are the committed PNG renders in `docs/images/diagrams/b10-cloud-boundary/png/`, and each one's alt text is read from its chapter's `fig-alt` at build time.
