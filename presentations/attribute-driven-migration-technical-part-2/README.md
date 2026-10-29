# Attribute-Driven Migration to Entra ID — technical deep dive, Part 2: devices, servers, non-person identities, and running it

**Deck name: Attribute_Driven_Migration_Technical_Part_2.** Part 2 of the two-part technical presentation for the companion guide [Attribute-Driven Migration from Active Directory to Microsoft Entra ID](../../docs/books/guides/attribute-driven-migration.md), built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The deep dive is split by **track**. [Part 1](../attribute-driven-migration-technical-part-1/README.md) is the model and the HR track. Part 2 takes the Intune track (end-user devices), the Azure Arc track (servers) and the non-person track (service accounts, service principals, managed and workload identities, AI agents), then runs the migration. It opens with a recap of the four tracks and a reduced copy of Part 1's store table.

| Module | Covers | Guide stages | Main chapters |
|---|---|---|---|
| Orientation | Title; recap of the four tracks and the attribute stores | — | Guide, "Four tracks," "Attributes" |
| 1. The Intune and Arc tracks | What Intune covers; Intune targeting; devices and how device attributes are written; dynamic device group dangers; what Azure Arc covers; Arc servers through Azure Resource Manager; devices neither tool covers (four tiers, CM-8) | 4–6 | Book 05 Ch 02–04, 08–10; Book 09 Ch 07, 09; Book 12 Ch 01 |
| 2. The non-person track and PIV | Service accounts, MSAs and gMSAs; workload identities and AI agents; service principals and custom security attributes; the object-type crosswalk; PIV and CAC binding and `certificateUserIds` | 4–6 | Book 02 Ch 06, 09, 10; Book 17 Ch 04–06; Book 03 Ch 09; Book 04 Ch 03, 05, 06; Book 07 Ch 06–07 |
| 3. Running it | The worked mover example, the phased cutover, drift; the limits of administrative units and Lifecycle Workflows, what could break at this estate's size, what still needs AD; the checklist and decisions for every track | 7–8 | Book 00 Ch 09–10; Book 02 Ch 05, 10; Book 03 Ch 05, 08, 11, 12, App C; Book 05 Ch 08; Book 06 Ch 16, App A |

| File | Use |
|---|---|
| `Attribute_Driven_Migration_Technical_Part_2.pptx` | The deck: 28 narrated slides (title, recap, three module dividers, 22 content slides and the closing decisions slide), then a backup section with Part 2's source lists and "Federal requirements: full citations" for the requirements Part 2's slides name |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup", opening by recapping Part 1 (about 2,590 words, about 17 minutes) |
| `build.js` | Picks Part 2's slides from the shared builders in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js) and adds its own title, recap and dividers |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/attribute-driven-migration-technical-part-2/build.js presentations/attribute-driven-migration-technical-part-2/Attribute_Driven_Migration_Technical_Part_2.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`.

The speaker notes are the live script (about 8,300 words, about 58 minutes), each with its timing cue at 142 words a minute and a closing `Workbook:` reference. The build's checks are Part 1's (title length and uniqueness, Sources length, neutral alt text, overflow warnings; `FIT=1` prints estimated bottom edges).

## Labels and sourcing

Every fact comes from the guide or a chapter it links to; Microsoft product facts carry the Microsoft Learn page the guide footnotes, opened on October 29, 2026. The Intune and Arc coverage tables use only the platforms the guide verified, and mark the entries that are the program's reading (ESXi hosts take no agent; sealed appliances aren't covered). Design guidance is labeled: the four-tier strategy for devices neither tool covers, the non-person owner and sponsor rules, the dynamic-group dangers' responses, the Lifecycle Workflows risk table, the limit responses, the checklist and the decisions.

The deck states the guide's corrected positions: Lifecycle Workflows allow 100 workflows per tenant (Book 02 Chapter 10 said 50); the custom task extension timeout differs between two Microsoft pages, so the guide doesn't pick one; Book 05's device-attribute sample connects with the delegated `Directory.AccessAsUser.All`; and Intune's emphasis is assignment filters where they meet the need, with dynamic device groups kept for extension-attribute targeting. Government-cloud items are as the guide states them: Agent ID has no Azure Government feature-list entry, and whether user source-of-authority transfer is available in GCC is open. The PIV pilot in which the card management system writes `certificateUserIds` after AD is unverified, open as workbook issue #130.
