# Companion guide — Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities

**Deck name: Guide_Service_Account_Migration.** The narrated deck for the companion guide [Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities](../../docs/books/guides/service-account-migration.md), built with the shared kit in [`../_build/`](../_build/README.md) and the companion-guide slide helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js). It's for Active Directory and identity engineers, application owners and the ISSOs who review their evidence. It teaches the same guide as [Module 12](../../docs/training/non-person-identity/12-service-account-migration.md) of the Non-Person Identity learning path. This folder sits outside `docs/`, so the site doesn't render it.

| Part | Slides | Guide sections |
|---|---|---|
| Why | Title; the password nobody changes (user accounts as services, Kerberoasting, how Learn finds them) | In this guide; the comparison table; Migration A, step A1 |
| What | The twelve kinds of service identity compared; what can move to Microsoft Entra ID and what can't, with the special cases | The kinds of service identity compared; Migration C, "What can't move"; Special cases |
| Who | The decision path and its dispositions; the program's rules; requirements, KSIs and evidence | The decision path; The program's rules; Federal requirements and evidence |
| How | Migration A (two slides, with the outbound-only default and the delegated create right), Migration B, Migration C; sending mail from a gMSA workload; dangers; where the kit and the labs take over | Migrations A to C; Sending mail from a gMSA workload (M1 to M4); Dangers; Questions for the program owner (WD-154); Checklist; the developer workbook's Chapters 03, 05, 06 and 07 |

| File | Use |
|---|---|
| `Guide_Service_Account_Migration.pptx` | The deck: 14 narrated slides (the title and 13 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Guide_Service_Account_Migration_Narrated.vtt` | The video's caption track. Committed once the MP4 is on the videos release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Guide_Service_Account_Migration_Narration_Script.md` | The spoken narration, slide by slide (about 2,750 words) |
| `narration_Guide_Service_Account_Migration/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The plain and narrated decks join the next edition's Release; until then, build them from this folder. The video runs about 18 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/guide-service-account-migration/build.js presentations/guide-service-account-migration/Guide_Service_Account_Migration.pptx`. Then `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panels' width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the guide's sections, which isn't spoken. The narration names each source by its original, Microsoft Learn, and spells out the acronyms the voice would misread (G M S A, D M S A, K D S, S P N, I S S O). Every fact on a slide comes from the guide, which footnotes each one to the Microsoft Learn page it was read from on November 9, 2026, or for the mail section and the gMSA decisions on November 11, 2026 (the pages and their dates are in the guide's [verification log](../../docs/books/guides/_verification/service-account-migration.md)), or from the Non-Person Identity developer workbook chapters the guide links; the deck adds none. The commands on the slides are the guide's, which are Learn's, with the guide's placeholders; long ones are continued PowerShell-style with a backtick. The guide's labels carry over: the program's rules, the 30-day parallel run, the decision path's dispositions and the KSI mapping are design guidance; and the deck says evidence *supports* a requirement, as the guide does. The commands weren't run against a domain or a tenant for the guide; the Learn procedures run against stand-ins in the kit's tests, as Module 12's lab shows.
