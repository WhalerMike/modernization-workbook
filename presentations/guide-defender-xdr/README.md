# Companion guide — Defender XDR Engineering & Operations: An Implementation Guide

**Deck name: Guide_Defender_XDR.** The narrated deck for the companion guide [Defender XDR Engineering & Operations: An Implementation Guide](../../docs/books/guides/defender-xdr-implementation.md), built with the shared kit in [`../_build/`](../_build/README.md) and the companion-guide slide helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js). It's for endpoint engineers, Intune and Defender operators, the SOC, the policy owner and the ISSOs who review the evidence. **The guide is a draft awaiting the editor's review**, and the title slide and its narration say so; rebuild the deck when the review changes the guide. This folder sits outside `docs/`, so the site doesn't render it.

| Part | Slides | Guide sections |
|---|---|---|
| Why | Title (with the draft notice); a license is not a defended endpoint; two boundaries, one control plane per setting | Opening statement; How to read this guide; The track at a glance; Reference architecture |
| What | Government clouds, feature by feature; the ten gates on one page | Government-cloud availability by feature; Prerequisites; The path on one page |
| Who | Unified RBAC roles through PIM, and the RACI | Step 1; Prerequisites (roles); RACI |
| How | Gate 1 roles and the Graph read path; Gate 2 onboarding and sensor health; Gate 3 prevention through audit; Gate 4 Attack Surface Reduction audit, warn, block; Gate 5 exposure management without Exposure Management; Gate 6 incidents; Gate 7 detections as code; Gates 8 and 9 signals and automation; Gate 10 metrics and cadence; dangers, what couldn't be verified, where to go next | Steps 1 to 10; Synthetic events; Metrics; Evidence catalog; Dangers; What couldn't be verified; Back to the books |

| File | Use |
|---|---|
| `Guide_Defender_XDR.pptx` | The deck: 16 narrated slides (the title and 15 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Guide_Defender_XDR_Narrated.vtt` | The video's caption track. Added by the export step once the MP4 is on the videos release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Guide_Defender_XDR_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py` on the narrated deck; added by the export step) |
| `Guide_Defender_XDR_Narration_Script.md` | The spoken narration, slide by slide (about 2,400 words) |
| `narration_Guide_Defender_XDR/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The plain and narrated decks join the next edition's Release; until then, build them from this folder. The video runs about 15 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/guide-defender-xdr/build.js presentations/guide-defender-xdr/Guide_Defender_XDR.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panels' width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the guide's sections, which isn't spoken. The narration names each source by its original (Microsoft Learn's Defender for Endpoint, Defender XDR, Defender for Identity, Defender for Cloud Apps, Security Exposure Management and Microsoft Graph security API pages) and each workbook book by its title, and spells out the acronyms the voice would misread (G C C, D O D, X D R, S O C, I S S O). Every fact on a slide comes from the guide, which footnotes each one to the page it was read from on November 11, 2026 (the claims are in the guide's [verification log](../../docs/books/guides/_verification/defender-xdr-implementation.md)), or from the book chapters the guide links (Book 05, Chapters 06 to 10; Book 12, Chapters 03, 05, 06, 10, 11 and 12; Book 11, Chapter 10); the deck adds none. The baseline is Microsoft 365 GCC; GCC High and DoD appear as side notes where the guide gives them. The commands on the slides are the guide's, with its placeholders; long ones are continued PowerShell-style with a backtick or wrapped, and an `Out-File` tail is dropped where it doesn't fit. The guide's labels carry over: the goal, the rings, the severity table, the RACI and the metrics are the program's design (risk-based recommended), and the deck says evidence *supports* a requirement, as the guide does. Windows clients and Windows Server only. Nothing in the guide was run against a tenant.
