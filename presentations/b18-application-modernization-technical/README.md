# Book 18 — Application Modernization: technical deep dive

**Deck name: B18_Application_Modernization_Technical.** The 50-minute technical presentation for [Book 18](../../docs/books/b18-application-modernization/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It goes a level deeper than a briefing. It's for enterprise and solution architects, application and data engineers, DBAs and ISSOs: the people who decide what each legacy application becomes, build the ones that change, move their data off DB2 and Oracle, and assemble the evidence the authorizing official reads. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 50 to 55 minutes live, in two parts split into four modules of 9 to 16 minutes. Each module opens with a divider slide, so the deck can be watched in parts:

| Part | Module | Chapters |
|---|---|---|
| Orientation | Title; why modernization is a portfolio, not a rewrite | 01 |
| 1 — Deciding and designing | 1. The portfolio and the triage | 01, 02 |
| | 2. The target architecture and the data | 03, 04 |
| 2 — Governing and running | 3. AI, compliance and governance | 05, 06, 07 |
| | 4. Reference implementation, frameworks and waves; decisions | 08, 09, 10 |

| File | Use |
|---|---|
| `B18_Application_Modernization_Technical.pptx` | The deck: 34 narrated slides (title, orientation, four module dividers, 27 content slides and a closing decisions slide), then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, with a lead-in to the next slide (about 3,000 words, about 20 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`B18_Application_Modernization_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,900 words, each note carrying its timing cue at 142 words a minute and ending with the `Workbook: Book 18, Chapter NN …` reference it draws on. `build.js` prints the words and minutes per module. It also refuses a slide title longer than 58 characters or used twice, and a Sources line longer than 185 characters. It sizes each text panel to its contents when no height is given, and warns when a table, panel, callout or diagram is likely to overflow or a panel is left mostly empty. With `FIT=1` it prints each table's, panel's, callout's and diagram's estimated bottom edge.

## How it goes deeper than a briefing

- **The triage mechanics.** The six dispositions in rising order of cost and risk, and how they line up with AWS's 7 Rs and the Microsoft Cloud Adoption Framework. The six criteria and the data each is scored from. The two axes, the 1-to-5 scores and the measured, attested and assumed confidence flags. The seven-rule decision table, first match wins, with rule 7's deep study. Owner review, the decision record and calibration on 30 to 50 known applications.
- **The reference architecture's components.** Each layer and the program's choice, with versions and support windows as of October 28, 2026: Java 25 LTS, the Spring Boot generations table, React, Node.js only where it fits, OpenAPI contracts first, OCI images on Kubernetes and twelve-factor configuration. The strangler-fig stages and feasibility questions, and the NIST SP 800-204 and SP 800-190 references.
- **The data move.** Choosing PostgreSQL or SQL Server, the type mappings that convert silently and wrongly, packages and emulation schemas, the conversion tools and their limits, the three validation checks and their blind spots, the three cut-over strategies, change data capture, and why the application never dual-writes.
- **AI, controls and gates.** The four places AI fits, the provider-neutral model interface, and the agent guardrails with the propose-don't-write pattern. Where the SP 800-53 families land in the life cycle and the evidence each leaves; the SSDF after M-26-05; the events that reopen privacy and records work. The review board's decision rights and the four gates with the controls each evidences.
- **The implementation, the frameworks and the waves.** What the reference implementation in `examples/app-modernization` contains, what its tests prove and what they don't. The TOGAF ADM phase and Zachman cell for each chapter and artifact. The waves on the program's phases and gates G0 to G5, move groups, the modernization factory, metrics and funding.

## Labels and sourcing

Every fact on the slides comes from a footnoted chapter of Book 18. Each slide's notes end with the chapter they draw on, each content slide carries a short Sources line, and the four backup slides list the primary sources in full. The program's own design is labeled program design or design guidance on the slide, and federal requirements are labeled as requirements, as the book does. That design covers the six dispositions as a vocabulary, the scored rubric with its axes, weights, flags, thresholds and decision rules, the calibration, the technology choices, the three-check validation and the coexistence rules, the agent guardrails and the model interface, the evidence mapping for each control family, the review board's membership and decision rights, the four gates, the wave sizes and the factory.

Product versions and support windows (Java, Spring Boot, Node.js, React, OpenAPI, Kubernetes, PostgreSQL, SQL Server) and the status of the migration and AI tools are stated as of the book's check dates, October 28–29, 2026. Vendors and products appear as examples, not endorsements. The TOGAF and Zachman mappings are the program's reading; neither publisher has reviewed them. The reference implementation is illustrative: its tests pass against a real PostgreSQL engine, but it hasn't been run against a real DB2 or Oracle database, its containers weren't started, and its agent ran only against a stub model. The deck describes the code and doesn't reproduce it.

The diagrams are the committed PNG renders in `docs/images/diagrams/b18-application-modernization/png/`. Each one's alt text is read at build time from the chapter's own `fig-alt`. The deck draws no new diagrams.
