# Attribute-Driven Migration to Entra ID — technical deep dive, Part 1: the model and the HR track

**Deck name: Attribute_Driven_Migration_Technical_Part_1.** Part 1 of the two-part technical presentation for the companion guide [Attribute-Driven Migration from Active Directory to Microsoft Entra ID](../../docs/books/guides/attribute-driven-migration.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for identity engineers, Entra and AD administrators, Intune and Azure platform owners, PKI and credential teams, and ISSOs. This folder sits outside `docs/`, so the site doesn't render it.

The deep dive is split by **track**, so each video follows one population. The forest's identities move on four tracks: HR for people, Intune for end-user devices, Azure Arc for servers, and the non-person track for service accounts, service principals, managed and workload identities and AI agents. Part 1 is the model and the HR track. [Part 2](../attribute-driven-migration-technical-part-2/README.md) is devices, servers, non-person identities and running the migration.

| Module | Covers | Guide stages | Main chapters |
|---|---|---|---|
| Orientation | Title; why the attributes now decide | — | Book 01 Ch 04 |
| 1. The model | What the OU tree encoded; the four tracks; what the migration accomplishes and the federal requirements each track satisfies; the attributes primer (AD versus Entra ID, the mapping, the attribute stores); the stage map; Stage 0 | 0 | Book 01 Ch 04; Book 02 Ch 06–10, App A; Book 03 Ch 06, 12; Book 05 Ch 08–10; Book 17 Ch 05 |
| 2. The HR track: sourcing and proving | HR as the authority, Federal HR 2.0 and API-driven inbound provisioning, contractors and other writers, the canonical schema and its single writer, proof, sync | 1–3 | Book 03 Ch 03–07, 12, 13; Book 02 Ch 09 |
| 3. HR-track mechanisms | Dynamic user groups, administrative units, Conditional Access personas; the dangers of dynamic user groups; dynamic-membership limits and latency; the HR-track decisions; what's in Part 2 | 4–6 | Book 01 Ch 04; Book 02 Ch 05; Book 03 Ch 06, 10; Book 04 Ch 03; Book 06 Ch 16–17, R07 |

| File | Use |
|---|---|
| `Attribute_Driven_Migration_Technical_Part_1.pptx` | The deck: 28 narrated slides (title, orientation, three module dividers, 21 content slides, the HR-track decisions and "What's in Part 2"), then a backup section with Part 1's source lists and "Federal requirements: full citations" |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its highpoints, opening with why the slide matters and ending with a lead-in to the next; the last slide ends with what Part 2 covers (about 2,520 words, about 17 minutes) |
| `build.js` | Picks Part 1's slides, in order, and adds its own title, dividers, decisions and close |
| `slides.js` | The shared slide builders and helpers for both parts; [Part 2's `build.js`](../attribute-driven-migration-technical-part-2/build.js) requires it from here |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/attribute-driven-migration-technical-part-1/build.js presentations/attribute-driven-migration-technical-part-1/Attribute_Driven_Migration_Technical_Part_1.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`; `narrate.py` speaks `narration.json` and stops if an entry's title doesn't match its slide.

The speaker notes are the live script (about 7,900 words, about 55 minutes), each with its timing cue at 142 words a minute and a closing `Workbook:` reference to the guide section and chapters. The build refuses a slide title over 58 characters or used twice, a Sources line over 185 characters, and diagram alt text that names an agency, and warns when a table, panel, callout or diagram may overflow; with `FIT=1` it prints each one's estimated bottom edge.

## Labels and sourcing

Every fact comes from the guide or a chapter it links to. Each content slide carries a short Sources line, the notes name the chapter sections, and the backup lists the sources in full, with "Federal requirements: full citations" as the endnotes for every requirement a slide names. Microsoft product facts carry the Microsoft Learn page the guide footnotes, opened on October 29, 2026. The program's own design is labeled design guidance: the four-track model and the success criteria, the responsibility model and deciders, the stage gates, the attribute slots and code placeholders, and the checklist. The federal mapping is the guide's, which reuses only mappings the books make; the authorizing official decides whether a control is satisfied. PS-7 and IA-8 for contractors are left out because no book supports them, and M-21-31 appears only as rescinded by M-26-14.

Preview features carry their stage and date: the `memberOf` preview ends on November 3, 2026, and hire date is readable in rules only in preview. Government-cloud items are stated as the guide states them: dynamic administrative units are global-cloud only (GCC yes; GCC High and DoD no). Federal HR 2.0's schedule is Book 03's, dated October 20, 2026, to be confirmed with the HR 2.0 program office.

The diagrams are the committed PNG renders in `docs/images/diagrams/<book>/png/`; each one's alt text is read at build time from the chapter's `fig-alt`.
