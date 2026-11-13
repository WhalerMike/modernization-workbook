# Companion guide — Azure Security Engineering

**Deck name: Guide_Azure_Security.** The narrated deck for the companion guide [Azure Security Engineering](../../docs/books/guides/azure-security-implementation.md), built with the shared kit in [`../_build/`](../_build/README.md) and the companion-guide slide helpers in [`../attribute-driven-migration-technical-part-1/slides.js`](../attribute-driven-migration-technical-part-1/slides.js). It's for platform owners, operators, security monitors, policy owners and the ISSOs who review the evidence. **The guide is a draft awaiting the editor's review**; the title slide and its narration say so, and the deck is rechecked after that review. The guide's developer workbook and training path are planned. This folder sits outside `docs/`, so the site doesn't render it.

| Part | Slides | Guide sections |
|---|---|---|
| Why | Title (draft notice); a landing zone isn't a defense; what the books design and what the guide engineers | Opening statement; How to read this guide; The track at a glance; Where each topic is covered |
| What | The ten steps on one page; commercial Azure for a GCC tenant and what differs in Azure Government; the same controls on AWS, Google Cloud and Oracle Cloud Infrastructure | The path on one page; Government-cloud availability; The same controls on AWS, Google Cloud and Oracle Cloud |
| Who | Eligible roles and the RACI | Prerequisites (roles); RACI |
| How | Steps 1 and 2 (baseline, exposure inventory); DDoS; WAF; Front Door and Application Gateway; Azure Firewall; Private Link and DNS; Key Vault; policy and drift; operations, metrics and requirements; dangers, what couldn't be verified and what comes next | Steps 1 to 10; Metrics; Federal requirements and KSIs; Dangers; What couldn't be verified; The guide's pieces |

| File | Use |
|---|---|
| `Guide_Azure_Security.pptx` | The deck: 17 narrated slides (the title and 16 content slides in Why, What, Who and How order), then a backup section with the sources |
| `Guide_Azure_Security_Narrated.vtt` | The video's caption track. Added by the export step once the MP4 is on the videos release: adding it here lists the video on the Watch page (`scripts/generate_video_manifest.py`) |
| `Guide_Azure_Security_Narrated_sources.json` | The slide sources as links, through the [Source Register](../../docs/reference/source-register.md), for the Watch page and the YouTube description (`link_sources.py` on the narrated deck, at the export step) |
| `Guide_Azure_Security_Narration_Script.md` | The spoken narration, slide by slide (about 2,400 words) |
| `narration_Guide_Azure_Security/` | `durations.json`, `sentences.json` and the per-slide caption tracks (the MP3s go on the edition's Release, not in git) |
| `build.js` | The slides and their notes |

The plain and narrated decks join the next edition's Release; until then, build them from this folder. The video runs about 16 minutes.

Build (Git Bash): `source /c/tmp/deckenv.sh`, then `FIT=1 node presentations/guide-azure-security/build.js presentations/guide-azure-security/Guide_Azure_Security.pptx`. Then `link_sources.py`, `narrate.py` and `captions.py`, and on a workstation where PowerPoint is free, `qa_export.ps1`, `build_narrated.ps1` and `export_mp4.ps1`, as in the kit's README. The build runs the shared checks: title length and uniqueness, Sources length, and overflow warnings, including the code panels' width and height.

## Notes and sourcing

Each slide's speaker notes are the narration, then a `Workbook:` reference to the guide's sections, which isn't spoken. The narration names each source by its original (Microsoft Learn page titles, NIST, FedRAMP, AWS, Google Cloud and Oracle documentation) and each workbook book or guide by its title, and spells out the acronyms the voice would misread. Every fact on a slide comes from the guide, which footnotes each one to the page it was read from on November 11, 2026 (the claims are in the guide's [verification log](../../docs/books/guides/_verification/azure-security-implementation.md)); the deck adds none. The commands on the slides are the guide's, with its placeholders; some are shortened (a resource ID as `<pip-resource-id>`, a scope as `<mg-scope>`) and long ones are continued PowerShell-style with a backtick. The guide's labels carry over: the goal, the cadence, the RACI and the metrics are design guidance, and the deck says a step *supports* a control, as the guide does. The audience is a GCC tenant paired with commercial Azure; Azure Government appears as the guide's notes. Nothing in the guide was run against a subscription; every command is unrun by the authors.
