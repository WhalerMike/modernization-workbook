# Book 17 — AI Identity Governance: executive briefing

**Deck name: B17_AI_Identity_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 17](../../docs/books/b17-ai-identity/index.md), for the CIO, the CISO, the Chief AI Officer, authorizing officials, the privacy officer and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b17-ai-identity/`](../b17-ai-identity/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B17_AI_Identity_Executive.pptx` | The deck: eighteen narrated slides (the title and seventeen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,100 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B17_AI_Identity_Executive` builds the self-running edition.

## How it differs from the 15-minute deck

- **Decision-centered.** Thirteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 08), its findings and severities (Chapter 07) and its leadership lists (Chapters 01 and 02). Three context slides end with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No Graph permissions, PowerShell, policy settings or OSCAL fragments; the 15-minute deck and Chapters 05, 06 and 09 carry those.
- **More of the What and the Who.** Separate slides for the rule set, the two signatures for high-impact AI, release stage and government-cloud availability, the full responsibility matrix, the central scan and its limits, and the three AI clocks beside FISMA.

## What the briefing covers

| Part | Slides | Book 17 source |
|---|---|---|
| **Why** | An agent that acts is an account; AI arrived outside the identity program; the controls already apply | Chapters 01, 07 |
| **What** | The rule set and what it doesn't do; two signatures for high-impact AI; the inventory as a seed list; kinds of AI identity and what each cloud has; sponsors and the lifecycle; credentials and least privilege; monitoring, drift and shadow AI | Chapters 02 to 07 |
| **Who** | Two decision tracks on one AI system; who decides what | Chapter 08 |
| **How** | The inventory scan; the central model and what it can't close; evidence for the authorizing official; the cadence and the AI overlays; the decisions | Chapters 09, 10 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 17; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: the governance model (sponsor rules, severities, the ten-business-day confirmation window, the scan, IA-9 tailoring) is **program design**, not a federal requirement; the central scan is a **program proposal**; and every product release stage and government-cloud statement is a **dated observation** as of October 21–22, 2026. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b17-ai-identity/png/`](../../docs/images/diagrams/b17-ai-identity/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,400 words, a little over 30 minutes live). The build prints a `!` warning for any title over 58 characters, a Sources line over 170 characters, text that may overflow its box, or a narration title that doesn't match the slide.

## Build

```bash
cd presentations/b17-ai-identity-executive
source /c/tmp/deckenv.sh
node build.js B17_AI_Identity_Executive.pptx
python "$VALIDATE" B17_AI_Identity_Executive.pptx
python ../_build/a11y_check.py B17_AI_Identity_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B17_AI_Identity_Executive.pptx` and then `python ../_build/captions.py B17_AI_Identity_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
