# Book 07 — PKI & Certificates: executive briefing

**Deck name: B07_PKI_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 07](../../docs/books/b07-pki/index.md), for the CIO, the CISO, the PKI owner and authorizing officials. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b07-pki/`](../b07-pki/README.md) and the technical deep dive in [`../b07-pki-technical/`](../b07-pki-technical/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B07_PKI_Executive.pptx` | The deck: eighteen narrated slides (the title and seventeen content slides), then a backup section with the source lists |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,000 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B07_PKI_Executive` builds the self-running edition.

## How it differs from the 15-minute deck and the deep dive

- **Decision-centered.** Fourteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix and renewal-ownership table (Chapter 05) and the gates and program rules in Chapters 03, 04, 07 and 08. Two context slides end with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No templates, event IDs, registry values, commands or profile settings; the technical deep dive and the book's appendices carry those.
- **More of the What and the Who.** Separate slides for the shrinking-lifetime schedule, the inventory and its four verdicts, the hardening gate, the four-issuer target, the root-of-trust decision and its CRL, the lifecycle platform decision, PIV and certificate sign-in, renewal ownership, the four permission systems, the six waves, coexistence, monitoring, retirement and the risks.

## What the briefing covers

| Part | Slides | Book 07 source |
|---|---|---|
| **Why** | A certificate keeps working after its directory moves; two clocks; lifetimes shrinking on a fixed schedule | Chapter 01 (with Chapters 05 and 08 for owners) |
| **What** | The inventory and four verdicts; hardening what stays; the four-issuer target; anchoring to the existing root; the lifecycle platform; PIV and certificate sign-in | Chapters 02–06 |
| **Who** | Who decides, and renewal ownership; four permission systems, one access model | Chapter 05 |
| **How** | Six gated waves; coexistence; monitoring and evidence; retiring AD CS; risks; the decisions | Chapters 07, 08 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 07; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The workbook's Research page holds an implementation guide for the lifecycle platform; the deck only points to it and takes its facts from Book 07. The book's labels are kept: the renewals-per-day figures are the book's **arithmetic**; the wave durations and the 99 and 95 percent thresholds are the program's **planning figures**; the hardening gate, the risk ratings, Tier 0, BYOCA signed by the offline root and the self-hosted lifecycle platform are **program design or program decisions**; the NIST post-quantum plan is a **draft**; and the Cloud PKI availability, licensing and FedRAMP Marketplace statements are **dated observations** as of October 2026. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance, and owners marked "program's model" follow Chapter 05's description of the sponsor, CIO and CISO roles rather than a matrix row.

The diagrams are the committed PNGs in [`docs/images/diagrams/b07-pki/png/`](../../docs/images/diagrams/b07-pki/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,500 words, a little over 30 minutes live). The build prints a `!` warning for any title over 58 characters or repeated, a Sources line over 185 characters, text that may overflow its box, an image that runs into the decision bar, or a narration title that doesn't match the slide.

## Build

```bash
cd presentations/b07-pki-executive
source /c/tmp/deckenv.sh
node build.js B07_PKI_Executive.pptx
python "$VALIDATE" B07_PKI_Executive.pptx
python ../_build/a11y_check.py B07_PKI_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B07_PKI_Executive.pptx` and then `python ../_build/captions.py B07_PKI_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
