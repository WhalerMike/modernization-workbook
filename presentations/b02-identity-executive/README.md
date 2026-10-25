# Book 02 — Identity & Directory: executive briefing

**Deck name: B02_Identity_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 02](../../docs/books/b02-identity/index.md), for the CIO, the CISO, the identity program lead and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b02-identity/`](../b02-identity/README.md) and the technical deep dive in [`../b02-identity-technical/`](../b02-identity-technical/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B02_Identity_Executive.pptx` | The deck: eighteen narrated slides (the title and seventeen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,100 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B02_Identity_Executive` builds the self-running edition.

## How it differs from the 15-minute deck

- **Decision-centered.** Fifteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 06), its adapter and retirement rules (Chapter 04), its delegation design (Chapter 05) and its build and playbook chapters (Chapters 07, 09 and 10). One context slide ends with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No PowerShell, sync rules, Conditional Access policy IDs, membership-rule syntax or PIM settings; the technical deep dive and Chapters 05, 08, 09 and 10 carry those.
- **More of the What, the Who and the sequence.** Separate slides for the dated platform clocks, placement versus attributes, what Conditional Access can't see, the eleven-type dependency surface, delegation without organizational units, the full responsibility matrix, the gaps between Microsoft's tools, the phishing-resistant roadmap, the gated playbook, the six conditions for retiring Active Directory, and the evidence bundle.

## What the briefing covers

| Part | Slides | Book 02 source |
|---|---|---|
| **Why** | The access decision has moved to identity; AD isn't retiring but the dates are set; lift-and-shift copies the risk | Chapters 01, 02, 03, 09 |
| **What** | Placement becomes attributes; Kerberos and NTLM never reach Conditional Access; the eleven-type hidden surface; delegation without OUs | Chapters 02 to 05 |
| **Who** | One decider per decision; who decides what; who owns the gaps between the tools | Chapter 06 |
| **How** | Read-only discovery; building the target; phishing-resistant sign-in; the eleven-phase playbook; retiring AD last; evidence; the decisions | Chapters 04, 07, 09, 10, 11 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 02; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: the responsibility matrix, the adapter model and its priorities, the retirement criteria, the delegation tiers, the phase gates and every duration (including the 43–68 week playbook and the 12–18 week authentication roadmap) are **program design and planning estimates**, not federal or Microsoft requirements; the reference deployment is a **framing pattern**, not a real engagement; and Microsoft product statements are as the book checked them on October 20–21, 2026. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b02-identity/png/`](../../docs/images/diagrams/b02-identity/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,300 words, about 30 minutes live). The build prints a `!` warning for any title over 58 characters, a Sources line over 170 characters, text that may overflow its box, or a narration title that doesn't match the slide.

## Build

```bash
cd presentations/b02-identity-executive
source /c/tmp/deckenv.sh
node build.js B02_Identity_Executive.pptx
python "$VALIDATE" B02_Identity_Executive.pptx
python ../_build/a11y_check.py B02_Identity_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B02_Identity_Executive.pptx` and then `python ../_build/captions.py B02_Identity_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
