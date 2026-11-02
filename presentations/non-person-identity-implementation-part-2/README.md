# Non-Person Identity — implementation, Part 2: privilege, conversion and lifecycle

**Deck name: Non_Person_Identity_Implementation_Part_2.** Part 2 of the two-part deck series on [Non-Person Identity: An Implementation Guide](../../docs/books/guides/non-person-identity-implementation.md), at the level of its gates, with the developer workbook [*Building Non-Person Identity*](../../docs/project-plans/developer-workbooks/non-person-identity/index.md), its kit [`examples/non-person-identity`](../../examples/non-person-identity/README.md) and the drift pipeline's `npi_evidence.py`. It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

[Part 1](../non-person-identity-implementation-part-1/README.md) covers G1–G3. This part covers G4–G6, in the same form: what done means, the steps, the workbook's Lab 1 commands and the kit's real output, the federal requirement and evidence, government-cloud availability as the guide and workbook state it, the interim path and the rollback. Then the guide's SQL Server and AI agents sections, and the track's evidence and rollback.

| Module | Covers | Gate and validate with | Main sources |
|---|---|---|---|
| Orientation | Title; G4–G6 on one page (done when, validate with, rollback) and the track's done-when | — | Guide, "The path on one page," "The track at a glance," "Rollback" |
| G4 — Least privilege | Graph permissions by type, directory roles (control-plane assets, time-bound), Azure roles at the resource, custom security attributes, workload Conditional Access and its limits, the tiered approval for new grants; Chapter 07's sweep and hand-off, Chapter 08's plan and sign-in summary by ring; requirement, evidence, availability (Workload ID Premium through the account manager), interim path, rollback | G4; VK-NPI-04, 05, 07 | Guide, Step 4; workbook Chapters 07 and 08 |
| G5 — Conversion | Build the target, owners and rotation, the 30-day parallel run, disable never delete, record the result; Chapter 05's token exchange tests and parallel runs, Chapter 06's Kerberos plan, island list and reconciliation; requirement, evidence, availability, the Kerberos island interim, rollback | G5; VK-NPI-03, 06 | Guide, Step 5; workbook Chapters 05 and 06 |
| G6 — Lifecycle | Owner change, orphans (Book 04's 30-day policy), inactivity, owner reviews; disable first, then delete, by identity type; Chapter 10's drift run, review cycle, chained packages and period; requirement, evidence, availability (sign-in activity report, beta, global only), rollback | G6; VK-NPI-01, 02, 08, 09 | Guide, Step 6; workbook Chapter 10 |
| SQL Server and AI agents | The engine's account, the instance's Entra identity, application principals and the parallel run, two dangers; sponsors and blueprints, gated creation, credentials, expiry as the review, availability by cloud, Chapter 09's check | — | Guide, "SQL Server service and application principals," "AI agents"; workbook Chapter 09 |
| Evidence and rollback | The track's evidence, the SCuBA MS.AAD.5.5–5.7 and 9.1 rows, and the rollback by step | — | Guide, "Evidence," "Rollback" |
| Close | Five dangers to keep in view, and where to go next: Part 1, the workbook's Chapters 05–10 and the [Labs page](../../docs/training/labs.md#npi) (there is no learning path for this track yet) | — | Guide, "Dangers," "Checklist," "Back to the books" |

| File | Use |
|---|---|
| `Non_Person_Identity_Implementation_Part_2.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with three source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,330 words, about 15 minutes of audio) |
| `Non_Person_Identity_Implementation_Part_2_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_Non_Person_Identity_Implementation_Part_2/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the HR-Driven Identity Part 2 deck's code panel (Consolas, 10 pt, on a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/non-person-identity-implementation-part-2/build.js presentations/non-person-identity-implementation-part-2/Non_Person_Identity_Implementation_Part_2.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and the MP4 by `export_mp4.ps1`.

The speaker notes are the live script: about 4,600 words, about 32 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks (title length and uniqueness, Sources length, overflow warnings) and the code panel's width and height check. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command and output comes from the implementation guide, a page it links, the developer workbook's Chapters 05–10, or the code, configuration and fixtures under `examples/non-person-identity` and `examples/drift-pipeline`. The deck adds no external facts; Microsoft Learn and CISA facts are the ones the guide or the workbook footnotes (read October 29–31, 2026). Output on a slide is the kit's own, verbatim from the Lab 1 captures in [`data/kit-captures/npi/`](../../data/kit-captures/npi/) (07-4, 07-5, 08-5, 08-6, 05-3, 05-6, 06-4, 10-4, 10-5, 10-9 and 09-5), run on fictional `contoso.example` fixtures; where a command is wrapped or shortened, or its output trimmed, the panel's label says so. The kit's code is illustrative and fixture-tested, not run against a production tenant or domain.

The guide's evidence table maps the whole track; the deck places each row at the gate that produces it, and says so in the notes. These parts are design guidance or preview and are labeled that way: the track's done-when; the quarterly owner review and the 90-day idle threshold; the Kerberos island interim; plan approval by SHA-256 and the seven-day plan age; one policy per ring and the 14-day window; the control mapping in the period summary; the isPrivileged label, the service principal sign-in activity report and agent Conditional Access and agent risk (preview).
