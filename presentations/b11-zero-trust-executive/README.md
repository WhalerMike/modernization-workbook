# Book 11 — Zero Trust & Assessment: executive briefing

The 30-minute, decision-centered Why / What / Who / How briefing for [Book 11](../../docs/books/b11-zero-trust/index.md), for the CISO, authorizing officials, the CIO and the Zero Trust implementation lead. It's built with the shared kit in [`../_build/`](../_build/README.md) and sits beside the 15-minute deck in [`../b11-zero-trust/`](../b11-zero-trust/README.md). This folder is outside `docs/`, so the site doesn't render it.

Deck name: **B11_Zero_Trust_Executive**

| File | Use |
|---|---|
| `B11_Zero_Trust_Executive.pptx` | The deck: sixteen narrated slides (the title and fifteen content slides), then a backup section with the full source list |
| `B11_Zero_Trust_Executive_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B11_Zero_Trust_Executive/` | Per-slide audio, durations, sentence timings and caption tracks |
| `B11_Zero_Trust_Executive_Narrated.vtt` | One caption track for the narrated video (written by `../_build/captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands in `../_build/README.md` |

## How it differs from the 15-minute deck

- **Decision-centered.** Each decision slide ends with a bar that states the decision, its owner and when it's needed, taken from the book's responsibility matrix (Chapter 07) and its "this quarter" lists (Chapters 02 and 10). The closing slide gathers them into one table.
- **No configuration detail.** No PowerShell versions, run roles, policy IDs or toolkit commands; the 15-minute deck and Chapter 09 carry those.
- **More of the What.** Separate slides for what M-22-09 still requires, BOD 25-01's six actions and its reporting routes, the two assessment tools, and the estate beyond Microsoft 365.

Every fact on the slides comes from a footnoted chapter of Book 11; each slide's notes name the chapter, each slide carries a short Sources line, and the backup slides list the primary sources. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute (about 4,230 words, just under 30 minutes), so it stays right when the notes are edited.

## Build

```bash
source /c/tmp/deckenv.sh
node presentations/b11-zero-trust-executive/build.js presentations/b11-zero-trust-executive/B11_Zero_Trust_Executive.pptx
python presentations/_build/a11y_check.py presentations/b11-zero-trust-executive/B11_Zero_Trust_Executive.pptx
python presentations/_build/narrate.py presentations/b11-zero-trust-executive/B11_Zero_Trust_Executive.pptx
python presentations/_build/captions.py presentations/b11-zero-trust-executive/B11_Zero_Trust_Executive.pptx
```

Delete a slide's MP3 after changing its notes, so `narrate.py` records it again. The self-running narrated deck is built separately with `../_build/build_narrated.ps1 -Base B11_Zero_Trust_Executive`.
