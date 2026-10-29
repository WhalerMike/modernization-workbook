# Attribute-Driven Migration to Entra ID — technical deep dive

**Deck name: Attribute_Driven_Migration_Technical.** The 55-minute technical presentation for the companion guide [Attribute-Driven Migration from Active Directory to Microsoft Entra ID](../../docs/books/guides/attribute-driven-migration.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for identity engineers, Entra and AD administrators, Intune and Azure platform owners, PKI and credential teams, and ISSOs: the people who write the attributes, the rules and policies that read them, and the evidence that shows they were true. This folder sits outside `docs/`, so the site doesn't render it.

The deck runs about 55 minutes live: an orientation, then four modules of 5 to 18 minutes. Each module opens with a divider slide, so the deck can be watched in parts:

| Module | Covers | Guide stages | Main chapters |
|---|---|---|---|
| Orientation | Title; why the attributes now decide | — | Book 01 Ch 04 |
| 1. The model | What the OU tree encoded, placement versus attributes, the stage map, reading the tree | 0 | Book 01 Ch 04; Book 02 Ch 06–10 |
| 2. Sourcing and proving attributes | HR as the authority, Federal HR 2.0 and API-driven inbound provisioning, contractors and other writers, the canonical schema and its single writer, proof, sync | 1–3 | Book 03 Ch 03–07, 12, 13; Book 02 Ch 09 |
| 3. Attributes to mechanisms | Dynamic groups, administrative units, Conditional Access, Intune; devices, Arc servers, service principals, custom security attributes, the object-type crosswalk; PIV and CAC binding and `certificateUserIds` | 4–6 | Book 02 Ch 05; Book 03 Ch 09–10; Book 04 Ch 03; Book 05 Ch 08–09; Book 06 Ch 16–17, R07; Book 07 Ch 06–07 |
| 4. Running it | The worked mover example, the phased cutover, drift, the limits, the checklist and decisions | 7–8 | Book 00 Ch 09; Book 03 Ch 08, 11, App C; Book 02 Ch 10 |

| File | Use |
|---|---|
| `Attribute_Driven_Migration_Technical.pptx` | The deck: 34 narrated slides (title, orientation, four module dividers, 27 content slides and a closing decisions slide), then a backup section with the full source lists, one slide per module |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", in the conversational style: each slide's intent and its one or two highpoints, opening with why the slide matters and ending with a lead-in to the next (about 3,120 words, about 21 minutes) |
| `build.js` | Slide content and full speaker notes; rebuild with the commands in `../_build/README.md` |

The narrated edition (`Attribute_Driven_Migration_Technical_Narrated.pptx`, its practice script, captions and per-slide audio) is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and isn't in this folder yet. `narrate.py` speaks `narration.json` rather than the notes, and stops if an entry's title doesn't match its slide.

The speaker notes are the live script: about 7,800 words, each note carrying its timing cue at 142 words a minute and ending with the `Workbook: Attribute-Driven Migration guide, Stage N …` reference and the chapter sections it draws on. `build.js` prints the words and minutes per module and the diagrams it placed. It also refuses a slide title longer than 58 characters or used twice, a Sources line longer than 185 characters, and diagram alt text that names an agency. It sizes each text panel to its contents when no height is given, and warns when a table, panel, callout or diagram is likely to overflow or a panel is left mostly empty. With `FIT=1` it prints each table's, panel's, callout's and diagram's estimated bottom edge.

## How it goes deeper than the guide's own summary

- **The model as a contract.** The four jobs the OU tree did, the mechanism that replaces each, and the nine stages with one decider and one gate apiece, from the two responsibility matrices.
- **The attribute supply chain.** The authority map and the enterprise person key; Federal HR 2.0's facts and what OPM leaves to the agency; API-driven inbound provisioning, the middleware's five duties and the two landing zones; the writers for every fact HR doesn't supply; the coded carriers and the single-writer rule; the Stage 2 proof and the Stage 3 sync traps.
- **Every object type, not just users.** Dynamic groups, administrative units, Conditional Access personas and Intune targeting; then Intune and Entra devices, Arc servers through Azure Resource Manager, service principals and custom security attributes, which attribute store each mechanism can read, and the object-type crosswalk of stores, writers and consumers.
- **PIV and CAC binding as an attribute.** Username bindings and affinity, authentication strength, who can write `certificateUserIds` for cloud-only and synced users, and where the binding comes from.
- **Running it.** One analyst through a nature-of-action 721 mover event, attribute-defined waves and the sole-source cutover gate, the two drift comparisons, the limits and the checklist.

## Labels and sourcing

Every fact on the slides comes from the guide or a chapter it links to. Each slide's notes end with the guide's stage and the chapter sections they draw on, each content slide carries a short Sources line, and the four backup slides list the sources in full. Microsoft product facts carry the Microsoft Learn page the guide footnotes; all were opened on October 29, 2026. The program's own design is labeled design guidance: the responsibility model and deciders, the stage gates, the attribute slots and code placeholders, the four choices that make the Core HCM switch a source swap, manual attribute stewardship as a temporary source, the checklist, and the post-AD `certificateUserIds` write.

Preview features carry their stage and date: the `memberOf` preview ends on November 3, 2026 (Microsoft's page still said so on October 29), hire date is readable in rules only in preview, and the Intune `operatingSystemVersion` filter property is in preview. Government-cloud items are stated as the guide states them: dynamic administrative units are global-cloud only (GCC yes; GCC High and DoD no); whether user source-of-authority transfer is available in GCC is open; Microsoft's `certificateUserIds` page names Entra Connect only and doesn't document Cloud Sync. The PIV pilot in which the card management system writes `certificateUserIds` through Graph after AD is shown as unverified, open as workbook issue #130.

The deck uses the guide's corrected positions where it disagrees with a chapter: Lifecycle Workflows allow 100 workflows per tenant (Book 02 Chapter 10 says 50); Book 05's sample writes device extension attributes with `Device.ReadWrite.All` as a delegated scope, which isn't the delegated permission Microsoft lists; and for Intune, Microsoft's emphasis is assignment filters where they meet the need, with dynamic device groups kept for extension-attribute targeting. Federal HR 2.0's schedule is Book 03's, dated October 20, 2026, to be confirmed with the HR 2.0 program office. The chapters' rule fragments and scripts are described, not reproduced.

The diagrams are the committed PNG renders for the chapters the guide links to, in `docs/images/diagrams/<book>/png/`: Books 00, 01, 02, 03, 04 and 05. Each one's alt text is read at build time from the chapter's own `fig-alt`, and the build stops if a PNG is missing. The deck draws no new diagrams.
