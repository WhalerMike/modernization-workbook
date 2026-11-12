# Companion guide — Zero Trust Assessment: An Implementation Guide

**Deck name: Guide_Zero_Trust_Assessment.** The narrated deck for the companion guide [Zero Trust Assessment: An Implementation Guide](../../docs/books/guides/zero-trust-assessment-implementation.md), built with the shared kit in [`../_build/`](../_build/README.md) and the companion-guide slide helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js). It's for assessment operators, pillar owners, the Zero Trust program lead and the ISSOs who review the evidence. It teaches the same guide as the learning path [*The Zero Trust Assessment as Evidence*](../../docs/training/zero-trust-assessment/index.md). This folder sits outside `docs/`, so the site doesn't render it.

| Part | Slides | Guide sections |
|---|---|---|
| Why | Title; a score isn't a verdict; what the tool checks and the four things it isn't; run it alongside ScubaGear, never instead | Opening statement; How to read this guide; The track at a glance; Step 1; Book 11, Chapter 05 |
| What | The ten steps on one page; government-cloud availability, where Learn is silent and where it differs from the tool | The path on one page; Government-cloud availability |
| Who | Consent once as a consent administrator, run as an eligible reader; the RACI | Step 3; RACI |
| How | The host and the protected output folder; connecting in each cloud; the run and its hashes; statuses and the taxonomy; the closure register; reconciling with ScubaGear and Security Hub CSPM; re-run, compare and seal; dangers, what couldn't be verified, where the training path starts | Steps 2, 4 to 10; Dangers; What couldn't be verified; Labs for this guide |

| File | Use |
|---|---|
| `Guide_Zero_Trust_Assessment.pptx` | The deck: 15 narrated slides (the title and 14 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Guide_Zero_Trust_Assessment_Narrated.vtt` | The video's caption track. Committed once the MP4 is on the videos release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Guide_Zero_Trust_Assessment_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py`) |
| `Guide_Zero_Trust_Assessment_Narration_Script.md` | The spoken narration, slide by slide (about 2,200 words) |
| `narration_Guide_Zero_Trust_Assessment/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The plain and narrated decks join the next edition's Release; until then, build them from this folder. The video runs about 15 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/guide-zero-trust-assessment/build.js presentations/guide-zero-trust-assessment/Guide_Zero_Trust_Assessment.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panels' width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the guide's sections, which isn't spoken. The narration names each source by its original (Microsoft Learn, the tool's own source and guide at release 3.1.0, CISA, AWS, NIST) and each workbook book by its title, and spells out the acronyms the voice would misread (B O D, G C C, D O D, I S S O). Every fact on a slide comes from the guide, which footnotes each one to the page it was read from on November 11, 2026 (the claims are in the guide's [verification log](../../docs/books/guides/_verification/zero-trust-assessment-implementation.md)), or from [Book 11, Chapter 05](../../docs/books/b11-zero-trust/05-two-assessment-tools.md), which the guide links for ScubaGear and BOD 25-01; the deck adds none. The commands on the slides are the guide's, with its placeholders; long ones are continued PowerShell-style with a backtick. The guide's labels carry over: the decision record, the RACI, the cadence, the status mapping for Security Hub CSPM and the KSI mapping are design guidance, and the deck says evidence *supports* a requirement, as the guide does. Nothing was run against a tenant for the guide: the results kit is tested on fictional fixtures, as the learning path's Lab 1 shows, and every tenant command is unrun by the authors.
