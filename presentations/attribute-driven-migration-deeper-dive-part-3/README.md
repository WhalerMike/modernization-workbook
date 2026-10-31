# Attribute-Driven Migration to Entra ID — deeper dive implementation, Part 3: proving it, cutting over and keeping it true

**Deck name: Attribute_Driven_Migration_Deeper_Dive_Part_3.** Part 3 of the three-part deeper dive implementation series for the companion guide [Attribute-Driven Migration from Active Directory to Microsoft Entra ID](../../docs/books/guides/attribute-driven-migration.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The deeper dive goes one level below the two-part technical deep dive ([Part 1](../attribute-driven-migration-technical-part-1/README.md), [Part 2](../attribute-driven-migration-technical-part-2/README.md)). It follows the ten gates of [Attribute-Driven Migration: An Implementation Guide](../../docs/project-plans/developer-workbooks/attribute-driven-migration/implementation-guide.md) and the [project plan](../../data/project-plans/attribute-driven-migration.yaml) that schedules them, and it shows working detail: the [validation kit](../../examples/validation-kit/README.md) commands, its input files, what a failing check looks like, and each gate's rollback. Part 1 of the series is Gates 0–3, Part 2 Gates 4–6, and Part 3 Gates 7–9.

| Module | Covers | Gates and plan tasks | Main sources |
|---|---|---|---|
| Orientation | Title; Gates 7 to 9 on one page, with the schedule and the running example | — | Guide, "The path on one page"; project plan, critical path |
| 1. Gate 7: the mover proof | Setting up the proof (test user, VK-DG-05 snapshot, input files, the personnel action); following it through the middleware, provisioning, sync, recompute and the mover workflow; what must not change; Validate and rollback; reading a failing run; the evidence to keep, joined on the person key | Gate 7; A7.1, AG7 | Guide, Gate 7; companion guide, "Worked example"; Book 03 Ch 05, 08, 11; validation kit README and fixtures |
| 2. Gate 8: cut-over and the OU tree | Waves as attribute queries, leaver first; the per-wave gate (signed report, dry run, seven days of sole-source proof, ticket path closed); retargeting provisioning and what still needs AD; Lifecycle Workflows at scale with VK-HR-05 and VK-HR-06; retiring the OU tree and rolling back by re-enabling | Gate 8; A8.1–A8.4, AG8 | Guide, Gate 8; companion guide, Stage 7, Limits; Book 00 Ch 09, 10; Book 03 App C; Book 05 Ch 07, 08 |
| 3. Gate 9 and the close | Drift classes and the two comparisons (D-A8); fix at the source, logs, the limits register; the standing checks per track; where the kits stop; what the overview simplified; decisions, checklist and where to go next | Gate 9; A9.1–A9.3, D-A8, AG9 | Guide, Gate 9, "Where the kits stop," "Checklist"; Book 02 Ch 05, 10; Book 03 Ch 11, 12 |

| File | Use |
|---|---|
| `Attribute_Driven_Migration_Deeper_Dive_Part_3.pptx` | The deck: 17 narrated slides (title, the one-page gate summary and 15 content slides, closing with decisions and the checklist), then a backup section with three source lists. Modules are PowerPoint sections; there are no divider slides |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,310 words, about 16 minutes) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) (not its prebuilt slides), plus a small code-panel helper (Consolas, 10.5–11 pt, in a light panel) |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/attribute-driven-migration-deeper-dive-part-3/build.js presentations/attribute-driven-migration-deeper-dive-part-3/Attribute_Driven_Migration_Deeper_Dive_Part_3.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`.

The speaker notes are the live script (about 4,650 words, about 33 minutes), each with its timing cue at 142 words a minute and a closing `Workbook:` reference. The build's checks are Part 1's (title length and uniqueness, Sources length, overflow warnings; `FIT=1` prints estimated bottom edges), plus a width and height check on each code panel.

## Labels and sourcing

Every fact, command and payload comes from the implementation guide, the companion guide, the chapters they link to, the validation kit (`examples/validation-kit`) or the project plans in `data/project-plans/`. The deck adds no new external facts. Commands are the kit README's; the failing rows are the issue text in the kit's check code, with counts from its fictional `fail` fixture tenant. The kit is illustrative and fixture-tested, not proven against a live tenant.

Design guidance is labeled: the Lifecycle Workflows responses, the what-still-needs-AD responses, the running example's person key, and the "What the overview simplified" slide. The thresholds are stated as proposals: 99% correlation is a proposed starting point that the agency sets through risk governance, and the kit's membership-delta threshold and the 90-day GPO window are defaults. Government-cloud items are as the guide states them: whether user source-of-authority transfer is available in GCC is unverified (Book 03, Chapter 12 open register), and dynamic administrative units are documented for the global cloud, which GCC uses, and not for GCC High or DoD. The person key is "an existing enterprise ID", with `E0042137` as the placeholder value.
