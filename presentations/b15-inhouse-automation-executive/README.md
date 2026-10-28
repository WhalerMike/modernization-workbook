# Book 15 — Building Day-Two Automation In-House: an Executive Briefing

A nine-minute narrated executive briefing on one topic, drawn from [Book 15, Chapter 13](../../docs/books/b15-day2-operations/13-building-day-two-automation-in-house.md), built with the shared kit in [`../_build/`](../_build/README.md). Deck name: **B15_InHouse_Automation_Executive**. This folder sits outside `docs/`, so the site doesn't render it.

Audience: a branch chief or other manager deciding whether to let existing staff build the day-two compliance application on the ServiceNow instance the agency already owns, when there's no funding for the platform's compliance modules or a commercial identity-governance product. The deck covers the problem (day-two work that leaves no evidence), why the funded options are closed, the no-cost path and what it doesn't replace, AI-assisted development and its guardrails, sandbox to production with two gates, the standards behind the path, who does what, the evidence it produces, the honest limits, and the ask: a small pilot in a developer instance. The wider Book 15 decisions are in the [Book 15 executive briefing](../b15-day2-operations-executive/); this deck doesn't repeat them.

| File | Use |
|---|---|
| `B15_InHouse_Automation_Executive.pptx` | The deck: twelve narrated slides, then a backup section with the full source list |
| `B15_InHouse_Automation_Executive_Narrated.pptx` | The same deck with narration on every slide and embedded captions, set to play by itself |
| `B15_InHouse_Automation_Executive_Narrated.vtt` | Captions for the MP4 |
| `B15_InHouse_Automation_Executive_Narration_Script.md` | The narration as text |
| `B15_InHouse_Automation_Executive_poster.png` | The video's poster frame (the title slide) |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |
| `narration.js` | The spoken narration, one entry per narrated slide, keyed by its exact title |

The MP4 (`B15_InHouse_Automation_Executive_Narrated.mp4`, 1080p, and `B15_InHouse_Automation_Executive_720p.mp4`) is too large for the repository; like the other narrated videos it belongs on the videos release.

```bash
cd presentations/b15-inhouse-automation-executive
source /c/tmp/deckenv.sh
node build.js B15_InHouse_Automation_Executive.pptx
python "$VALIDATE" B15_InHouse_Automation_Executive.pptx
python ../_build/narrate.py B15_InHouse_Automation_Executive.pptx
python ../_build/captions.py B15_InHouse_Automation_Executive.pptx
python ../_build/a11y_check.py B15_InHouse_Automation_Executive.pptx
```

Then, with PowerPoint closed, `../_build/build_narrated.ps1 -Dir <absolute path to this folder> -Base B15_InHouse_Automation_Executive -Video` makes the narrated deck and the 1080p MP4. The 720p copy and the poster are made from it with `ffmpeg`.

Every fact comes from a footnoted chapter: Book 15, Chapter 13, with Chapters 03, 10 and 11, Book 13 Chapter 10 and Book 04 Chapter 09. The pilot's scope, owner and next gate are labeled design guidance. The deck names no agency and works for any agency; it names ServiceNow and SailPoint only because they are the platforms the workbook's examples use, and endorses neither.
