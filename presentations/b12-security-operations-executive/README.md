# Book 12 — Security Operations & Telemetry: executive briefing

**Deck name: B12_Security_Operations_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 12](../../docs/books/b12-security-operations/index.md), for the CISO, the SOC lead, the CIO and authorizing officials. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b12-security-operations/`](../b12-security-operations/README.md) and the technical deep dive in [`../b12-security-operations-technical/`](../b12-security-operations-technical/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B12_Security_Operations_Executive.pptx` | The deck: nineteen narrated slides (the title and eighteen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,080 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

The narration audio, the captions and the self-running narrated deck aren't built yet. Make them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B12_Security_Operations_Executive` on a machine with PowerPoint.

## How it differs from the 15-minute deck

- **Decision-centered.** Sixteen content slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 10), the asks in Chapters 01 and 02, the design rules in Chapters 05, 11 and 12, and the federal clocks the book cites. One context slide ends with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No KQL, table names, connector setup, diagnostic-settings templates or role assignments; the technical deep dive and Chapters 03 to 07 carry those.
- **More of the What and the Who.** Separate slides for M-26-14 and its calendar, the evidence contract and the naming plane, the six planes and their expiring defaults, keeping telemetry flowing through the migration, the SIEM and XDR division of labor, the retention tiers and their two owners, the cost and retention trade-offs, the BOD 26-04 clock, the SOC as a common control provider, the CISA one-hour notification, accepting the risk of what isn't seen, the response ladder and the metric set.

## What the briefing covers

| Part | Slides | Book 12 source |
|---|---|---|
| **Why** | What a dashboard can't show; storing isn't detecting; M-26-14 as the current logging requirement; one evidence contract and one join key | Chapters 01, 02, 05 |
| **What** | Six planes and their owners; telemetry through the migration; the SIEM decision; retention tiers; cost and retention trade-offs; one queue on the BOD 26-04 clock | Chapters 03 to 06, 10, 12 |
| **Who** | The SOC runs the queue; who decides what, and the one-hour notification; accepting the risk of what isn't seen | Chapter 10 |
| **How** | The rule library; the response ladder; evidence an assessor can re-run; the metric set and its rhythm; the decisions | Chapters 11, 12 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 12; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept:

- **The logging requirement, in the book's framing:** OMB M-26-14, issued May 22, 2026, rescinded M-21-31 effective immediately, so M-26-14 is the current memo; the old twelve-months-active, eighteen-months-cold figures were M-21-31's.
- **Program design, not federal requirement:** the evidence contract and the naming plane as its join key, the six planes and their owners, the responsibility matrix, the "monitored only when a rule reads it" rule, the XDR and SIEM division of labor, the retention-tier design rules, the response ladder and its permanently gated classes, the metric set and the reporting rhythm. The "show me an alert from the last 30 days" standard is practitioner experience the program adopts, not a published FedRAMP procedure.
- **Computed dates (asterisk):** November 18, 2026 for the Agency Logging Plan and the Level 1 to 3 dates are the program's arithmetic from CISA's August 20, 2026 Logging Reference Architecture, as Book 00, Chapter 01 counts them; they aren't dates OMB published.
- **Dated observations:** Microsoft Sentinel, Defender and government-cloud availability as of October 21, 2026, including Sentinel's move to the Defender portal after March 31, 2027, and NARA's revision of the GRS 3.2 logging items, in drafting as of October 2026.
- **Inference:** the "Keep telemetry flowing through the migration" slide gathers the book's change-related mechanics (Chapters 03 to 05 and 10) into one list; the book has no single section by that name. Undated "When" entries name the event that triggers the decision, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b12-security-operations/png/`](../../docs/images/diagrams/b12-security-operations/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,500 words, a little under 32 minutes live). The build prints a `!` warning for text that may overflow its box, a Sources line over 185 characters, or a narration title that doesn't match the slide, and stops on a title over 58 characters or a duplicate title.

## Build

```bash
cd presentations/b12-security-operations-executive
source /c/tmp/deckenv.sh
node build.js B12_Security_Operations_Executive.pptx
python "$VALIDATE" B12_Security_Operations_Executive.pptx
python ../_build/a11y_check.py B12_Security_Operations_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B12_Security_Operations_Executive.pptx` and then `python ../_build/captions.py B12_Security_Operations_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
