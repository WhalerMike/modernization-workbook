# Book 09 — Network & Transport: executive briefing

The 30-minute, decision-centered Why / What / Who / How briefing for [Book 09](../../docs/books/b09-network/index.md), built with the shared kit in [`../_build/`](../_build/README.md). Deck name: **B09_Network_Executive**. It's the executive companion to the 15-minute deck in [`../b09-network/`](../b09-network/README.md). This folder sits outside `docs/`, so the site doesn't render it.

Audience: the CIO, the CISO, network program executives and budget owners. The deck covers what TIC 3.0 actually requires (as republished in September 2026), the long interim between legacy transport and SASE, where to invest and in what order, field-office WAN transformation, network access control, who owns which decision, and the external deadlines and the risk of not acting. Every decision slide carries a strip that states the decision, its owner and when it's needed. It has no configuration detail.

| File | Use |
|---|---|
| `B09_Network_Executive.pptx` | The deck: sixteen narrated slides, then a backup section with the full source list |
| `B09_Network_Executive_Narration_Script.md` | The narration text, for practice (written by `../_build/narrate.py`) |
| `narration_B09_Network_Executive/` | Per-slide audio, durations, sentence timings and WebVTT captions |
| `B09_Network_Executive_Narrated.vtt` | One caption track for the whole narration, for the MP4 (written by `../_build/captions.py`) |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |

```bash
source /c/tmp/deckenv.sh
node presentations/b09-network-executive/build.js presentations/b09-network-executive/B09_Network_Executive.pptx
python presentations/_build/narrate.py presentations/b09-network-executive/B09_Network_Executive.pptx
python presentations/_build/captions.py presentations/b09-network-executive/B09_Network_Executive.pptx
python presentations/_build/a11y_check.py presentations/b09-network-executive/B09_Network_Executive.pptx
```

`../_build/build_narrated.ps1` builds the self-running narrated copy and the MP4. It needs PowerPoint, so run it yourself; it isn't part of this build.

Every fact on the slides comes from a footnoted chapter of Book 09. Each slide's notes end with the chapter (`Workbook: Book 09, Chapter …`), each slide carries a short `Sources:` line, and the backup section lists the primary sources in full. The field-office figures are the planning assumptions Chapter 11 labels as assumptions, not quotes. The timing cue at the start of each slide's notes is worked out by `build.js` from the spoken words at about 142 words a minute, so it stays right when the notes are edited.
