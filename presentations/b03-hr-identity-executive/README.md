# Book 03 — HR-Driven Identity: executive briefing

**Deck name: B03_HR_Identity_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 03](../../docs/books/b03-hr-identity/index.md), for the CIO, the Chief Human Capital Officer and HR leadership, the CISO, the privacy officer and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b03-hr-identity/`](../b03-hr-identity/README.md) and the technical deep dive in [`../b03-hr-identity-technical/`](../b03-hr-identity-technical/README.md). The Start series (`../start-here/` and its episodes) and the [interview set](../hr-driven-identity-interview/README.md) cover the program on-ramp and the case in fifteen minutes; this deck doesn't repeat them. This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B03_HR_Identity_Executive.pptx` | The deck: eighteen narrated slides (the title and seventeen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,100 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B03_HR_Identity_Executive` builds the self-running edition.

## How it differs from the 15-minute deck

- **Decision-centered.** Fifteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 07), its execution plan and gates (Chapter 12), its cutover rules (Appendix C) and, for Gate G1, the program roadmap (Book 00, Chapter 09; Book 01, Chapter 12). One context slide ends with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No attribute mappings, extension-attribute slots, SCIM payloads, `/bulkUpload` limits, workflow task lists or `certificateUserIds` formats; the technical deep dive and Chapters 05, 06, 08 and 09 carry those.
- **More of the What, the Who and the decisions only leadership can make.** Separate slides for the Federal HR 2.0 window, the authority map, the enterprise person key, OPM's standards as the contract, the pipeline at decision level, the full responsibility matrix, the privacy and PIV clocks, the contractor source decision (left open, as the book leaves it), Gate G1's HR feed, per-population cutover and the six lifecycle metrics.

## What the briefing covers

| Part | Slides | Book 03 source |
|---|---|---|
| **Why** | Access now runs on employee data; why orphans keep coming back; the Federal HR 2.0 window | Chapters 01, 02, 03 |
| **What** | The attribute authority map; one person, one key; OPM's standards as the contract; the provisioning pipeline | Chapters 04, 05, 06 |
| **Who** | Owners, users and guards; who decides what; the privacy and PIV clocks | Chapter 07, Appendix B |
| **How** | Joiner, mover, leaver by code; block first and reconcile credentials; the contractor source; seven gated phases and Gate G1; cutover per population; six metrics; the decisions | Chapters 06, 08, 09, 11, 12, Appendix C; Book 00 Ch 09 and Book 01 Ch 12 for Gate G1 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 03 (or, for Gate G1, Book 00 Chapter 09 and Book 01 Chapter 12); each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: the responsibility matrix, the nature-of-action interpretation, the drift severities and every gate threshold (99% correlation, zero missed leavers across a pay-period cycle, the seven-day sole-source proof) are **program design and proposed starting criteria** for the agency to approve or replace; the orphan timeline and the reference deployment are **illustrative patterns**; Federal HR 2.0 program facts are **as of October 20, 2026** and change; and the **contractor source of authority is an open decision** for the agency. Where the book gives no date for a decision, the "When" column names the phase or event that triggers it, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b03-hr-identity/png/`](../../docs/images/diagrams/b03-hr-identity/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,500 words, a little over 30 minutes live). The build prints a `!` warning for any title over 58 characters, a Sources line over 170 characters, text that may overflow its box, or a narration title that doesn't match the slide.

## Build

```bash
cd presentations/b03-hr-identity-executive
source /c/tmp/deckenv.sh
node build.js B03_HR_Identity_Executive.pptx
python "$VALIDATE" B03_HR_Identity_Executive.pptx
python ../_build/a11y_check.py B03_HR_Identity_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B03_HR_Identity_Executive.pptx` and then `python ../_build/captions.py B03_HR_Identity_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
