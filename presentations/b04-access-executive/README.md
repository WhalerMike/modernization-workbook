# Book 04 — Access & Privilege: executive briefing

**Deck name: B04_Access_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 04](../../docs/books/b04-access/index.md), for the CISO, the CIO, the identity governance officer and authorizing officials. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b04-access/`](../b04-access/README.md) and the technical deep dive in [`../b04-access-technical/`](../b04-access-technical/). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B04_Access_Executive.pptx` | The deck: nineteen narrated slides (the title, seventeen content slides and the decisions table), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,200 words, roughly 14 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B04_Access_Executive` builds the self-running edition.

## How it differs from the 15-minute deck

- **Decision-centered.** Fifteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix and exception rules (Chapter 06), the Book 02, Chapter 06 assignment that Chapter 06 keeps (the CISO's control requirements and privileged-role mapping, the authorizing official's residual risk, the sponsor and CIO's funding), and the chapters' design rules. Two context slides end with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No policy JSON, Graph calls, PowerShell or per-role settings; the technical deep dive, Chapters 07, 08 and 10 and both appendices carry those.
- **More of the What and the Who.** Separate slides for the BOD 25-01 mapping, phishing-resistant MFA as the end state, Microsoft-managed policies, the privilege tiers, the four things that can undo the PIM gate, break-glass, application risk tiers, applications as identities, and the full decision map with the exception clock.

## What the briefing covers

| Part | Slides | Book 04 source |
|---|---|---|
| **Why** | Every access decision is a policy decision; membership and location decide once; standing privilege is an open door; what least privilege requires | Chapters 01, 02 |
| **What** | The Conditional Access baseline and BOD 25-01; phishing-resistant MFA; policy pairs and Microsoft-managed policies; privilege tiers; PIM approval from outside the tier; what can undo the gate; break-glass | Chapters 03, 04, 07, 08 |
| **Who** | Deciding isn't doing; application risk tiers; applications as identities; who decides what, and exceptions | Chapters 05, 06 |
| **How** | Packages, reviews and expiry; access as code and its evidence; the decisions | Chapters 09, 10 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 04 (and, for decision owners, Book 02, Chapter 06); each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: the privilege tiers, activation durations, approver design, application risk tiers, approval chains, review cadences, readiness gates and retention periods are **program design**, a starting posture each agency adapts, not federal requirements; product statements are as the book checked them on **October 20, 2026**. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b04-access/png/`](../../docs/images/diagrams/b04-access/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,600 words, a little over 30 minutes live). The build prints a `!` warning for a Sources line over 170 characters, text or a table cell that may overflow its box, a panel or table that runs into the decision bar, or a narration title that doesn't match the slide, and stops on a title over 58 characters.

## Build

```bash
cd presentations/b04-access-executive
source /c/tmp/deckenv.sh
node build.js B04_Access_Executive.pptx
python "$VALIDATE" B04_Access_Executive.pptx
python ../_build/a11y_check.py B04_Access_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B04_Access_Executive.pptx` and then `python ../_build/captions.py B04_Access_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
