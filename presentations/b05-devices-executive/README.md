# Book 05 — Devices & Endpoints: executive briefing

**Deck name: B05_Devices_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 05](../../docs/books/b05-devices/index.md), for the CIO, the CISO, the endpoint program lead and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b05-devices/`](../b05-devices/README.md) and the technical deep dive in [`../b05-devices-technical/`](../b05-devices-technical/). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B05_Devices_Executive.pptx` | The deck: nineteen narrated slides (the title, seventeen content slides and the decisions table), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,200 words, roughly 14 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B05_Devices_Executive` builds the self-running edition.

## How it differs from the 15-minute deck

- **Decision-centered.** Fifteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix and role descriptions (Chapter 06), its exception paths (Chapter 04), its sunset rules (Chapter 07) and its support dates (Chapters 08 to 10). Two context slides end with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No CSP paths, Graph templates, PowerShell, policy IDs or per-setting values; the technical deep dive, Chapters 08 and 09 and Appendix A carry those.
- **More of the What and the Who.** Separate slides for the coexistence rules, the hybrid-join loss ledger, one source per device fact, compliance as a fail-closed access signal, the device that can't enroll, the three paths, the full decision map with the three role systems, the support dates that bind the fleet now, and update rings as the patch clock.

## What the briefing covers

| Part | Slides | Book 05 source |
|---|---|---|
| **Why** | Group Policy governed by position; running both isn't safe; hybrid join is a waypoint; what an ungoverned flip loses | Chapters 01, 02 |
| **What** | One source per fact; Intune-first onboarding; compliance as the access signal; the device that can't enroll; three paths to one end state | Chapters 03, 04, 05, 10 |
| **Who** | Deciding isn't doing; who decides what for devices and servers | Chapter 06 |
| **How** | The GPO sunset; seven phases with gates; servers under Azure Arc; the support dates; update rings; running and retiring the fleet; the decisions | Chapters 07 to 10 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 05; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: the Intune-first doctrine and its pillars, the authority rule, the three paths and the actuation ladder, the exception paths' handling, the ring values, the compliance validity window and the 90-day GPO retention are **program design**; the phase durations and the 34-week total are **planning estimates**; product statements and support dates are as the book checked them on **October 20, 2026**. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b05-devices/png/`](../../docs/images/diagrams/b05-devices/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,600 words, a little over 30 minutes live). The build prints a `!` warning for a Sources line over 170 characters, text or a table cell that may overflow its box, a panel or table that runs into the decision bar, or a narration title that doesn't match the slide, and stops on a title over 58 characters.

## Build

```bash
cd presentations/b05-devices-executive
source /c/tmp/deckenv.sh
node build.js B05_Devices_Executive.pptx
python "$VALIDATE" B05_Devices_Executive.pptx
python ../_build/a11y_check.py B05_Devices_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B05_Devices_Executive.pptx` and then `python ../_build/captions.py B05_Devices_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
