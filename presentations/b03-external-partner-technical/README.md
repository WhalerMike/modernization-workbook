# Book 03 — External Partner Identity: technical deep dive

**Deck name: B03_External_Partner_Technical.** The Why / What / Who / How deep dive for [Book 03, Chapter 15 — External Partner Identity](../../docs/books/b03-hr-identity/15-external-partner-identity.md), its [Microsoft Entra partner access profile (Book 04, Appendix C)](../../docs/books/b04-access/appendix-c-partner-access-profile-entra.md) and the [Partner Identity Record (Book 03, Appendix D)](../../docs/books/b03-hr-identity/appendix-d-partner-identity-record.md), for identity engineers, Conditional Access owners, ISSOs and the identity governance office. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the executive briefing in [`../b03-external-partner-executive/`](../b03-external-partner-executive/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B03_External_Partner_Technical.pptx` | The deck: fourteen narrated slides (the title and thirteen content slides), then a backup section with the sources |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide; `build.js` copies it into the speaker notes, and `../_build/narrate.py` speaks it and stops if a title doesn't match the slide |
| `build.js` | Slide content; rebuild with the commands below |
| `B03_External_Partner_Technical_Narration_Script.md`, `B03_External_Partner_Technical_Narrated.vtt`, `narration_B03_External_Partner_Technical/` | The practice script, the caption track and the per-slide timings and captions |

## What the deep dive covers

| Part | Slides | Source |
|---|---|---|
| **Why** | Access because someone asked, never because it exists | Chapter 15; Book 04, Appendix C |
| **What** | Three assurance scales (SP 800-63-4, SP 800-63C-4); the default route through a connected organization and an access package; cross-tenant access settings; one partner list in five Conditional Access policies; cross-tenant synchronization as an exception, and how a sync relationship ends | Chapter 15; Book 04, Appendix C |
| **Who** | Who does the work, partner and agency | Chapter 15 |
| **How** | The partner identity record; validation tests T0 to T10; monitoring and drift; requirements, KSIs and evidence; the government-cloud check and what isn't verified | Appendix D; Book 04, Appendix C |

## Sources and labels

Every Microsoft fact comes from the Microsoft Learn pages Book 04 Appendix C footnotes (accessed November 6, 2026), each linked through its row in the Source Register. Profile values, alerts and the control mapping are the book's **design guidance**. The validation tests were checked against the Microsoft Graph PowerShell reference but **haven't been run against a tenant**, as the profile says. Cross-cloud synchronization's support level, the FedRAMP boundary rules, the retention schedules for agreements and reviews and the SP 800-63C-4 planning note are **not verified**. The narration names books by their titles.

## Build

```bash
cd presentations/b03-external-partner-technical
source /c/tmp/deckenv.sh
node build.js B03_External_Partner_Technical.pptx
python ../_build/narrate.py B03_External_Partner_Technical.pptx
python ../_build/captions.py B03_External_Partner_Technical.pptx
python ../_build/link_sources.py B03_External_Partner_Technical.pptx
python ../_build/a11y_check.py B03_External_Partner_Technical.pptx
```

Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again. The narrated edition and the MP4 come from `../_build/build_narrated.ps1 -Base B03_External_Partner_Technical` and `../_build/export_mp4.ps1`, which need PowerPoint.
