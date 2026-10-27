# Book 06 — Data Platform: SQL Server Identity: executive briefing

**Deck name: B06_Data_Platform_Executive.** The 30-minute, decision-centered Why / What / Who / How briefing for [Book 06](../../docs/books/b06-data-platform/index.md), for the CIO, the CISO, the data platform owner, application owners and the program's sponsors. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b06-data-platform/`](../b06-data-platform/README.md) and the technical deep dive in [`../b06-data-platform-technical/`](../b06-data-platform-technical/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B06_Data_Platform_Executive.pptx` | The deck: twenty narrated slides (the title and nineteen content slides), then a backup section with the source lists |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide (about 2,200 words, roughly 14½ minutes); `../_build/narrate.py` speaks this instead of the notes, and stops if a title doesn't match the slide |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

`narrate.py` and `captions.py` add the per-slide audio folder, the practice script and the caption track; `../_build/build_narrated.ps1 -Base B06_Data_Platform_Executive` builds the self-running edition.

## How it differs from the 15-minute deck and the deep dive

- **Decision-centered.** Fifteen slides end with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 13) and the decisions the chapters record. Three context slides end with a takeaway instead. The closing slide gathers the decisions into one table.
- **No configuration detail.** No T-SQL, registry values, connection strings, Graph permission names or policy settings; the technical deep dive and Runbooks R01–R10 carry those.
- **More of the What and the Who.** Separate slides for the inventory and the retain, consolidate or retire verdict, the audit's three categories, the five positions of the engine-authentication decision, where the design runs and what it costs, who decides, what DBAs and application owners each own, the privileged steps kept outside the DBA team, the AD CS dependency, the risks and the platform question.

## What the briefing covers

| Part | Slides | Book 06 source |
|---|---|---|
| **Why** | The database is where legacy authentication hides; silent NTLM fallback; three drivers and what is really due in 2027 | Chapters 01, 02, 21 |
| **What** | Counting the estate; the retain, consolidate or retire verdict; the audit's three categories; the target authentication model; the five positions of the engine-authentication decision; where it runs and what it costs | Chapters 03–12, Appendix B |
| **Who** | Access decided in five places; DBAs and application owners; privileged steps outside the DBA team | Chapters 13, 16, 17 |
| **How** | The application chain; NTLM in three phases against the 2027-04-01 block; the AD CS dependency; closure; risks; the platform question; the decisions | Chapters 14, 15, 18–23 |

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 06 (and Appendix B for the leveraged services and licenses); each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide carries a short Sources line, and the backup slides list the primary sources. The book's labels are kept: April 1, 2027 is **the program's own NTLM backstop**, not a Microsoft or federal deadline; the 2027 dates that are external are SQL Server and Windows Server **support dates**; the 400-day zombie threshold, the 30-day observation window and the Windows Server 2019 host floor are **program design**; the engine-authentication decision is recorded as **still proposed**; the forty-versus-110 instance count is the book's **illustration**; and the US Government region and FedRAMP scope statements are **dated observations** (October 20, 2026, and the September 21, 2026 scope page). The roles and the matrix are the program's recommended model. Where the book gives no date for a decision, the "When" column names the event that triggers it, as design guidance. One owner is the deck's own **inference**, and the slide says so: the book records that the Data Platform charter's sponsor and project lead are still to be appointed, but not who appoints them.

The diagrams are the committed PNGs in [`docs/images/sql-server/diagrams/png/`](../../docs/images/sql-server/diagrams/png/); `build.js` reads each one's alt text from the chapter's `fig-alt`, so the two stay in step. The timing cue at the start of each slide's notes is worked out from the spoken words at about 142 words a minute (about 4,600 words, roughly 32 minutes live). The build prints a `!` warning for any title over 58 characters or repeated, a Sources line over 185 characters, text that may overflow its box, an image that runs into the decision bar, or a narration title that doesn't match the slide.

## Build

```bash
cd presentations/b06-data-platform-executive
source /c/tmp/deckenv.sh
node build.js B06_Data_Platform_Executive.pptx
python "$VALIDATE" B06_Data_Platform_Executive.pptx
python ../_build/a11y_check.py B06_Data_Platform_Executive.pptx
```

To record the narration, run `python ../_build/narrate.py B06_Data_Platform_Executive.pptx` and then `python ../_build/captions.py B06_Data_Platform_Executive.pptx`. Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again.
