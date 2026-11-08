# Book 03 — External Partner Identity: executive briefing

**Deck name: B03_External_Partner_Executive.** The decision-centered Why / What / Who / How briefing for [Book 03, Chapter 15 — External Partner Identity](../../docs/books/b03-hr-identity/15-external-partner-identity.md), for the CIO, the CISO, the business owners of programs shared with partners, the privacy officer and the authorizing official. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the technical deep dive in [`../b03-external-partner-technical/`](../b03-external-partner-technical/README.md); the book-wide decks are [`../b03-hr-identity/`](../b03-hr-identity/README.md), [`../b03-hr-identity-executive/`](../b03-hr-identity-executive/README.md) and [`../b03-hr-identity-technical/`](../b03-hr-identity-technical/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B03_External_Partner_Executive.pptx` | The deck: twelve narrated slides (the title and eleven content slides), then a backup section with the sources |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide; `build.js` copies it into the speaker notes, and `../_build/narrate.py` speaks it and stops if a title doesn't match the slide |
| `build.js` | Slide content; rebuild with the commands below |
| `B03_External_Partner_Executive_Narration_Script.md`, `B03_External_Partner_Executive_Narrated.vtt`, `narration_B03_External_Partner_Executive/` | The practice script, the caption track and the per-slide timings and captions |

## What the briefing covers

| Part | Slides | Source |
|---|---|---|
| **Why** | Many who sign in work for someone else; authority splits in two | Chapter 15 |
| **What** | The class and its borders; Guest by default; the standard in nine control areas | Chapter 15; Book 04, Appendix C; Appendix D |
| **Who** | One decider per row: the business owner, the sponsor, the IGO, the authorizing official's required consult | Chapter 15 |
| **How** | Assurance per transaction; the route in; privacy, records and redress; eleven readiness checks; the decisions to make | Chapter 15; Book 04, Appendix C |

## Sources and labels

Every fact comes from the footnoted pages: Book 03 Chapter 15 and Appendix D, and Book 04 Appendix C, all drafts from November 6, 2026. The responsibility table, the standard, the route, Guest by default and the readiness checks are the book's **design guidance**; the agency business owner's title is provisional; and the chapter's "not verified" items (FedRAMP boundary rules, retention for agreements and reviews, the SP 800-63C-4 planning note, cross-cloud sync's support level) stay unverified on the slides. Microsoft facts cite Microsoft Learn through the Source Register. No configuration detail: the technical deep dive carries it. The narration names books by their titles.

## Build

```bash
cd presentations/b03-external-partner-executive
source /c/tmp/deckenv.sh
node build.js B03_External_Partner_Executive.pptx
python ../_build/narrate.py B03_External_Partner_Executive.pptx
python ../_build/captions.py B03_External_Partner_Executive.pptx
python ../_build/link_sources.py B03_External_Partner_Executive.pptx
python ../_build/a11y_check.py B03_External_Partner_Executive.pptx
```

Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again. The narrated edition and the MP4 come from `../_build/build_narrated.ps1 -Base B03_External_Partner_Executive` and `../_build/export_mp4.ps1`, which need PowerPoint.
