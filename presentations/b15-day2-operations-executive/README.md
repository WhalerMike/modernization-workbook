# Book 15 — Compliance Automation & Day-2 Operations: executive briefing

**Deck name: B15_Day2_Operations_Executive.** This is the 30-minute, decision-centered Why / What / Who / How briefing for [Book 15](../../docs/books/b15-day2-operations/index.md), built with the shared kit in [`../_build/`](../_build/README.md). It's for the CIO, service owners, help desk and operations leads, and the CISO. Each of the sixteen content slides before the close ends with a bar that names the decision, who owns it and when it's needed, and the closing slide gathers them into one table. It has no configuration detail. This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `B15_Day2_Operations_Executive.pptx` | The deck: eighteen narrated slides (the title, sixteen decision slides and the closing decisions table), then a backup section with the full source list |
| `narration.json` | What the narration voice says on each slide before "Backup", one `{slide, title, say}` entry per slide. It's a short spoken version, about 1,980 words or 13 minutes; the speaker notes carry the full detail for a 30-minute live delivery |
| `build.js` | Slide content and speaker notes. Rebuild with the commands below |

The narration audio, the captions and the self-running narrated deck aren't built yet. Make them with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base B15_Day2_Operations_Executive` on a machine with PowerPoint.

## How it differs from the other Book 15 decks

- **The [15-minute deck](../b15-day2-operations/README.md)** walks the operating model once. This briefing spends its time on the decisions after cutover: who owns each one, when it's needed, and what it changes for support and operations.
- **The [technical deep dive](../b15-day2-operations-technical/README.md)** carries the mechanics (roles and scopes in Entra ID, the Temporary Access Pass, catalog items, Graph surfaces, CMDB duplicates, per-cloud collectors). This deck names them only where a decision depends on them.
- **Added here:** judging each wave on day two, funding the operating layer, the coordination contract as a buying test, the desk's health measures and the staffing decision behind them, the change advisory board's limits, buy-before-build for the compliance applications, and the harnesses that check the automation itself.

## What the briefing covers

| Part | Slides | Book 15 source |
|---|---|---|
| **Why** | The estate is judged on day two; an authenticator reset hands over the account; day-two volume is where controls erode | Chapters 01, 02, 03 |
| **What** | The coordination contract; one front door routed by authority; the help desk executes and never decides; two approvers on high-risk tasks; an authorization verdict before SaaS consent; the CMDB as a reconciled projection; one control-automation loop on every cloud | Chapters 02 to 09 |
| **Who** | Decisions away from the keyboard and one owner per artifact; measuring day-two health and staffing the desk; the change advisory board | Chapters 07, 10 |
| **How** | System evidence first and the attestation loop; buy the native compliance applications first; the runbook and the harnesses; the decisions, their owners and their timing | Chapters 11, 12 |

Eleven slides reuse committed diagrams from `docs/images/diagrams/b15-day2-operations/png/`. Each one's alt text is the `fig-alt` from the chapter that shows it, and `build.js` reads that text from the chapter at build time.

## Sources and labels

Every fact on the slides comes from a footnoted chapter of Book 15. Each slide's notes end with a `Workbook:` line naming the chapter and section, each content slide has a short Sources line, and the backup section lists the sources in full. The briefing keeps the book's labels:

- Product and platform statements are dated observations as of October 21–22, 2026: ServiceNow's applications and its Government Community Cloud listing (FedRAMP Certified, Class D, High), Defender for Cloud's ServiceNow integration (not available in Azure Government), AWS Audit Manager's maintenance mode (from April 30, 2026) and the VCF 9.1 compliance change. A partner's FedRAMP-indicator application is labeled a vendor announcement, not a verified capability.
- The program's own design is labeled as design: the coordination contract, the verification ladder's defaults, the service levels, the high-risk task list, the attestation loop and its POA&M rules, the runbook cadence and the harnesses.
- The book's corrections are kept: FedRAMP's Key Security Indicators bind providers, not agencies; at Moderate the harnesses are CA-2 and CA-7 evidence, not SI-6, which is High only.
- Decision owners come from Chapter 10's responsibility matrix and artifact-ownership table. Three owners are the program's model and the notes say so: the CIO for the wave go/no-go, for artifact ownership across the estate, and for build-or-buy (as a scope and funding decision). Where the book gives no date, the "When" column names the event that triggers the decision, as design guidance.

The timing cue at the start of each slide's notes comes from the spoken words at about 142 words a minute: about 4,140 words, or 29 minutes. `build.js` works the cue out, so it stays right when the notes change.

## Build (Git Bash)

```bash
cd presentations/b15-day2-operations-executive
source /c/tmp/deckenv.sh
node build.js B15_Day2_Operations_Executive.pptx
python "$VALIDATE" B15_Day2_Operations_Executive.pptx
python ../_build/a11y_check.py B15_Day2_Operations_Executive.pptx
```

`build.js` prints a line starting with `!` when it estimates that text may overflow its box, when an image runs into the decision bar, when a title is over 58 characters or repeated, when a Sources line is over 185 characters, or when a `narration.json` title doesn't match its slide. A clean build prints none.
