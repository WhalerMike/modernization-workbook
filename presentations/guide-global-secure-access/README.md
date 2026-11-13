# Companion guide — Global Secure Access & Zero Trust Network Engineering: An Implementation Guide

**Deck name: Guide_Global_Secure_Access.** The narrated deck for the companion guide [Global Secure Access & Zero Trust Network Engineering: An Implementation Guide](../../docs/books/guides/global-secure-access-implementation.md), built with the shared kit in [`../_build/`](../_build/README.md) and the companion-guide slide helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js). It's for network security and identity engineers, the policy owner, the SOC and the ISSOs who review the evidence. **The guide is a draft awaiting the editor's review**, and the title slide and its narration say so; rebuild the deck when the review changes the guide. This folder sits outside `docs/`, so the site doesn't render it.

| Part | Slides | Guide sections |
|---|---|---|
| Why | Title (with the draft notice); a VPN proves only that a device arrived; TIC 3.0's three remote-user options; beside a third-party SSE, and private apps in AWS, Google Cloud and Oracle Cloud Infrastructure | Opening statement; How to read this guide; Where each topic lives; TIC 3.0 alignment; A brief comparison with other security service edge offerings |
| What | The twelve steps and their run order; government cloud and licensing by feature; the reference architecture | Where each topic lives; Government cloud and licensing, feature by feature; The reference architecture |
| Who | The RACI and the closure decision | RACI |
| How | Steps 1 and 2; Step 3, the client; Steps 4 and 7, Microsoft traffic and the compliant network; Step 5, Internet Access; Steps 6 and 10, private apps and admin paths; Steps 8 and 9, tenant restrictions and TLS inspection; Steps 11 and 12, rings, rollback and telemetry; dangers, what couldn't be verified, where to go next | Steps 1 to 12; Rollback; Dangers; What couldn't be verified; Back to the books |

| File | Use |
|---|---|
| `Guide_Global_Secure_Access.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Guide_Global_Secure_Access_Narrated.vtt` | The video's caption track. Added by the export step once the MP4 is on the videos release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Guide_Global_Secure_Access_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py` on the narrated deck; added by the export step) |
| `Guide_Global_Secure_Access_Narration_Script.md` | The spoken narration, slide by slide (about 2,400 words) |
| `narration_Guide_Global_Secure_Access/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The plain and narrated decks join the next edition's Release; until then, build them from this folder. The video runs about 16 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/guide-global-secure-access/build.js presentations/guide-global-secure-access/Guide_Global_Secure_Access.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panels' width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the guide's sections, which isn't spoken. The narration names each source by its original (Microsoft Learn's Global Secure Access and Microsoft Graph pages, CISA's TIC 3.0 use cases, fedramp.gov) and each workbook book by its title, and spells out the acronyms the voice would misread (G C C, D O D, V P N, T L S, S S E, R D P, I S S O). Every fact on a slide comes from the guide, which footnotes each one to the page it was read from on November 11, 2026 (the claims are in the guide's [verification log](../../docs/books/guides/_verification/global-secure-access-implementation.md)), or from the book chapters the guide links (Book 09, Chapters 03, 05 and 12; Book 04, Chapter 07 and Appendix C; Book 12, Chapter 03); the deck adds none. The baseline is Microsoft 365 GCC: Learn says Global Secure Access is available in GCC and not yet supported in GCC High or DoD, which the deck states once as a side note. The commands on the slides are the guide's, with its placeholders; long ones are continued PowerShell-style with a backtick, and Step 2's export loop and the Conditional Access bodies are summarized in comments. The guide's labels carry over: the run order, the rings, the RACI mapping and the KSI mapping are design guidance, and the deck says evidence *supports* a requirement, as the guide does. Nothing in the guide was run against a tenant, and the Graph network access APIs it uses are beta.
