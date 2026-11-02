# Non-Person Identity — implementation, Part 1: inventory, decisions and credential rules

**Deck name: Non_Person_Identity_Implementation_Part_1.** Part 1 of the two-part deck series on [Non-Person Identity: An Implementation Guide](../../docs/books/guides/non-person-identity-implementation.md), at the level of its gates, with the developer workbook [*Building Non-Person Identity*](../../docs/project-plans/developer-workbooks/non-person-identity/index.md) and its kit [`examples/non-person-identity`](../../examples/non-person-identity/README.md). It is built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

The series follows the guide's six gates. For each gate it gives what done means, the steps, the commands from the workbook chapter's Lab 1 (fixtures, no tenant) with the kit's real output, the federal requirement and the evidence the ISSO keeps, government-cloud availability as the guide and the workbook state it, the interim path and the rollback. Part 1 covers G1–G3; [Part 2](../non-person-identity-implementation-part-2/README.md) covers G4–G6, SQL Server's principals, AI agents, the evidence and rollback.

| Module | Covers | Gate and workbook chapters | Main sources |
|---|---|---|---|
| Orientation | Title; the six gates on one page (done when, validate with), and how the workbook's plan gates map to them; the record each identity joins to, the roles, the licenses and GCC | — | Guide, "The track at a glance," "Prerequisites," "The path on one page" |
| G1 — Inventory | Every kind of non-person identity (AD accounts, MSAs, gMSAs, dMSAs, app registrations, service principals by type, managed identities, federated credentials, AI agents); the join to a record, two human owners and a federal sponsor; `Invoke-NpiInventory.ps1` and the HIGH-risk rows; `Invoke-NpiOwnership.ps1` and the orphan plan; requirement, evidence, availability, rollback | G1; Chapters 01 and 02 | Guide, Step 1; workbook Chapters 01–02 |
| G2 — Decision | The five targets from Book 02's matrix, high-risk first, the gMSA prerequisite; `Invoke-NpiMatrix.ps1`: proposal, disposition and waves kept apart, and why Gate 2 isn't met; requirement (inference), evidence, availability, interim path (keep on Kerberos with an end date), rollback | G2; Chapter 03 | Guide, Step 2; workbook Chapter 03 |
| G3 — Credential rules | The tenant's app management policy (no new secrets, 180-day certificates) and the policy diff; the two rotation numbers and SCuBA MS.AAD.5.5v1 to 5.7v1; the vault, the upload, secrets by exception, AD-side and federated credentials; `Invoke-NpiCredentialPolicy.ps1` and `Invoke-NpiRotation.ps1`; requirement, evidence, availability, rollback | G3; Chapter 04 | Guide, Step 3; workbook Chapter 04 |
| Close | What each gate leaves in the evidence file and what Part 2 reads from it; the workbook's Chapters 01–04 and their narrated tours | Into G4 | Guide, "Evidence," "Rollback"; Steps 4–6 |

| File | Use |
|---|---|
| `Non_Person_Identity_Implementation_Part_1.pptx` | The deck: 16 narrated slides (the title and 15 content slides), then a backup section with three source lists. Not in git: it goes on the next edition's Release |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per slide before "Backup" (about 2,490 words, about 15.5 minutes of audio) |
| `Non_Person_Identity_Implementation_Part_1_Narration_Script.md` | The narration as a transcript (written by `narrate.py`) |
| `narration_Non_Person_Identity_Implementation_Part_1/` | `durations.json`, `sentences.json` and the per-slide caption tracks `slideNN.vtt` (the MP3s are not in git) |
| `build.js` | Builds the deck with the shared helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js), and the ADM deeper dive's code panel (Consolas, 10.5 pt, on a light panel). Every terminal line is read from `data/kit-captures/npi/` at build time |

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/non-person-identity-implementation-part-1/build.js presentations/non-person-identity-implementation-part-1/Non_Person_Identity_Implementation_Part_1.pptx`. The narrated edition is generated separately by `narrate.py`, `captions.py` and `build_narrated.ps1`, and the MP4 by `export_mp4.ps1`.

The speaker notes are the live script: about 4,250 words, about 30 minutes. Each note has a timing cue at 142 words a minute and ends with a `Workbook:` reference. The build runs the technical deep dive's checks (title length and uniqueness, Sources length, overflow warnings) and the deeper dive's width and height check on every code panel. `FIT=1` prints the estimated bottom edge of each element.

## Labels and sourcing

Every fact, command and output comes from the implementation guide, a page it links, the developer workbook's Chapters 01–04, or the code, configuration and fixtures under `examples/non-person-identity`. The deck adds no external facts; Microsoft Learn facts are the ones the guide footnotes (read October 29, 2026) or the workbook chapters footnote (read October 30, 2026). Terminal output is the kit's own, from the Lab 1 captures in [`data/kit-captures/npi/`](../../data/kit-captures/npi) (fictional `contoso.example` fixtures), read by `build.js` so a slide can't drift from the capture; where a panel leaves out lines or a command, cuts a long line with "…", wraps a long line or continues a long command with a PowerShell backtick, its label says so. The kit's code is illustrative and fixture-tested, not run against a production tenant or domain.

These parts are design guidance or inference and are labeled that way: the system inventory as this track's master; the federal sponsor for every non-person identity; the CMDB owner's sign-off on the join; the risk rule and the candidate targets; the mapping of the workbook's plan gates onto the guide's gates (inference); which evidence rows G2 feeds (inference); the 60-day renewal window and the 7-day overlap; password never expires removed or carried with a dated exception.
