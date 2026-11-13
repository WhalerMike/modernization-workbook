# Building Provider Notices — One Retirement Notice, End to End: narrated story deck

**Deck name: PN_Story_One_Retirement_Notice.** A narrated story deck for the developer workbook [*Building Provider Notices*](../../docs/project-plans/developer-workbooks/provider-notices/index.md). Instead of one chapter at a time, it teaches the whole workbook through one case followed end to end: `azure:RT5J-6KL`, "Retirement: Basic SKU public IP addresses", a fictional Azure Service Health retirement in the kit's own fixtures. It is built with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) and the deeper dive's code-panel helper, on the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

Every chapter of the workbook is a draft awaiting the owner's review; the title slide and the opening narration say so.

## The case

Every value on the slides comes from [`examples/provider-notices/tests/fixtures`](../../examples/provider-notices/tests/fixtures) (`day1` and `day2`, fictional), and every terminal panel is a workbook chapter's Lab 1 command with the output it printed, read at build time from [`data/kit-captures/pn/`](../../data/kit-captures/pn) (trimmed where the slide says so).

| Scene | What happens to the notice | Chapter | Try it (Lab 1 captures) |
|---|---|---|---|
| Opening | The case and the notice's path through the eight chapters | Index | — |
| 1 One record | Azure says retirement; the kit makes a record, action required by its own stated rule | 01 | `01-3`, `01-4`, `01-5` |
| 2 Microsoft 365 | The same question asked of the message center, where Microsoft says the date in its own field; the Graph host for GCC | 02 | `02-2`, `02-4`, `02-5` |
| 3 Oracle Cloud | Oracle says it in the announcement type; its realms and its own flag | 03 | `03-2`, `03-4` |
| 4 AWS | AWS flags some retirements, the kit's rule the rest; the support plan | 04 | `04-2`, `04-5` |
| 5 Google Cloud | Personalized Service Health has incidents only, so no retirement at all | 05 | `05-2`, `05-3`, `05-5` |
| 6 An owner | `RT5J-6KL` gets an owner and a Ticket-to-Machine typed task; a re-run writes nothing | 06 | `06-5`, `06-6` |
| 7 Digest and evidence | The digest for owners, the hash chain for the ISSO, and a tampered file found | 07 | `07-3`, `07-5`, `07-8` |
| 8 Test, then production | The runbook takes the loop live, test first; its dry run on the fixtures as the page prints it | 08 | The page's fixture dry run (Chapter 08 has no Lab 1) |
| Close | Lab 2 in your own test environment; the workbook, the tours, the learning path and the guide's decks | 01–08 | — |

Each scene has a story slide (the beat, the code that handles it, and the federal requirement from the guide's gate), a **Try it** slide and a one-question **check** slide. The check's answer opens the next slide's narration and is in the check slide's notes. Scenes 2 to 5 follow the same question (who says this needs action, and by when?) through the other providers' own fixture notices, because a notice comes from one provider; each slide says which fixture a value comes from.

## Files

| File | Use |
|---|---|
| `PN_Story_One_Retirement_Notice.pptx` | The deck: 27 narrated slides (the title, one opening slide, three per scene and a closing slide), then a backup section with two source lists |
| `PN_Story_One_Retirement_Notice_Narrated.pptx` | The self-running edition: narration audio and a caption track on every slide, backup section dropped |
| `PN_Story_One_Retirement_Notice_Narrated.mp4` | The video, for the videos release (not uploaded yet) |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,250 words), written by `build.js` |
| `PN_Story_One_Retirement_Notice_Narration_Script.md` | The spoken narration, slide by slide |
| `build.js` | The slides, the narration, and the speaker notes |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/pn-story-one-retirement-notice/build.js presentations/pn-story-one-retirement-notice/PN_Story_One_Retirement_Notice.pptx`. Then `narrate.py`, `captions.py`, `link_sources.py`, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README.

The speaker notes carry the narration and a Detail part with the full facts behind the slide (every Lab 1 output in full, the fixture values, the gate's requirements), and a `Workbook:` reference to the chapter and guide sections. The build checks title length and uniqueness, the Sources length, every code panel's width and height, narration length, and neutrality on every slide and note, and refuses a book named by number in the narration.

## Labels and sourcing

Every fact comes from the workbook's eight chapters, the guide [Provider Notices: An Implementation Guide](../../docs/books/guides/provider-notices-implementation.md), the [learning path](../../docs/training/provider-notices/index.md), or the kit. The deck adds no external facts; provider facts are the ones the chapters footnote (read November 9, 2026). The kit's action rules, its routing and the mapping of outputs to KSIs are design guidance, labeled as the workbook labels them. The example code is illustrative and fixture-tested, not proven against a live tenant, account, tenancy or project.
