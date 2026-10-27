# Book 08 — DNS, DHCP & IPAM: executive briefing

**Deck name: B08_DDI_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 08](../../docs/books/b08-ddi/index.md), for the CIO, the CISO, the network and infrastructure lead and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b08-ddi/`](../b08-ddi/README.md) and the technical deep dive in [`../b08-ddi-technical/`](../b08-ddi-technical/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B08_DDI_Executive.pptx` | The deck: nineteen narrated slides (the title and eighteen content slides), then a backup section with the full source list |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,070 words, roughly 13 minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

The narration audio, the captions and the self-running narrated deck aren't built yet. Make them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B08_DDI_Executive` on a machine with PowerPoint.

## How it differs from the 15-minute deck

- **Decision-centered.** Sixteen content slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 09), the five configuration decisions (Chapter 08), the migration gates (Chapter 10) and Chapter 01's ask. One context slide ends with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No cmdlets, forwarding targets, ports, record types or zone names; the technical deep dive and Chapters 04, 05, 07 and 10 carry those.
- **More of the What and the Who.** Separate slides for the encrypted-DNS and Protective DNS requirements, the M-26-14 logging plan, DNSSEC and certificate dependencies, IPAM as the address authority, the platform and source-of-truth decision, the responsibility matrix and the record-change classes, and the decommissioning gates sequenced against Active Directory retirement.

## What the briefing covers

| Part | Slides | Book 08 source |
|---|---|---|
| **Why** | DNS now decides far more than an address; split-brain across platforms with no shared state; encrypted and Protective DNS; logging, DNSSEC and IPv6 | Chapters 01, 02, 03, 05, 11 |
| **What** | Leaving AD DNS; where queries slip past policy; certificates and tokens; IPAM as the address record; the five configuration decisions; the platform and source-of-truth decision | Chapters 04 to 08, 12 |
| **Who** | One decider per decision; the responsibility matrix; the three record-change classes | Chapter 09 |
| **How** | Six phases closed by evidence; decommissioning by gate against AD retirement; operating and measuring the plane; cost and residual risk; the decisions | Chapters 10, 11, 12 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 08; each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept:

- **Program design, not federal requirement:** the responsibility matrix and its owners, the record-change classes, the Phase 5 gates (30 days of locator-record resolution, 90 days of parallel operation), the planning estimates, the DNSSEC position on internal zones, and the cloud-native judgment for smaller agencies.
- **Dated observations:** FedRAMP Marketplace status and Azure list prices as of October 20, 2026; the vendor press release is labeled third-party, as the book labels it, and the certification date comes from the Marketplace.
- **Computed date:** the M-26-14 logging plan date (November 18, 2026) is the book's own count from CISA's August 20, 2026 publication, and is marked with an asterisk.
- **Inference:** "Now" for the encrypted-DNS decision reads M-22-09's FY24 planning target as past. The book names no owner for reporting resolution-path consistency; the deck assigns it to the DNS/DDI team as the program's model and says so. Other undated "When" entries name the event that triggers the decision, as design guidance.

The diagrams are the committed PNGs in [`docs/images/diagrams/b08-ddi/png/`](../../docs/images/diagrams/b08-ddi/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,400 words, a little over 30 minutes live). The build prints a `!` warning for text that may overflow its box, a Sources line over 185 characters, or a narration title that doesn't match the slide, and stops on a title over 58 characters or a duplicate title.

## Build

```bash
cd presentations/b08-ddi-executive
source /c/tmp/deckenv.sh
node build.js B08_DDI_Executive.pptx
python "$VALIDATE" B08_DDI_Executive.pptx
python ../_build/a11y_check.py B08_DDI_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B08_DDI_Executive.pptx` and then `python ../_build/captions.py B08_DDI_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
