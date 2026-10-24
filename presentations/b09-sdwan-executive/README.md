# Book 09 — The Field-Office WAN Case: SD-WAN for Executives

A seven-minute narrated executive business case for field-office SD-WAN, drawn from [Book 09, Chapter 11](../../docs/books/b09-network/11-field-office-wan-transformation.md), built with the shared kit in [`../_build/`](../_build/README.md). Deck name: **B09_SDWAN_Executive**. This folder sits outside `docs/`, so the site doesn't render it.

Audience: the CIO, budget owners and network program executives deciding whether to fund a per-office distribution point refresh or a network program instead. The deck makes one investment case: the circuit is the problem, not the content. It covers the problem, what SD-WAN can and can't fix (the speed-of-light floor), the 12-hub, 24-distribution-point target, Year 1 capital, the steady-state and five-year position and its sensitivity to current MPLS cost, what TIC 3.0 asks of the branch edge and why the controller is secured first, the roadmap, the five retirement gates, the risks and assumptions, and the decision to ask for. The wider TIC 3.0 and network decisions are in the [Book 09 executive briefing](../b09-network-executive/README.md); this deck doesn't repeat them.

| File | Use |
|---|---|
| `B09_SDWAN_Executive.pptx` | The deck: twelve narrated slides, then a backup section with the full source list |
| `build.js` | Slide content and speaker notes; rebuild with the commands below |
| `narration.js` | The spoken narration, one entry per narrated slide, keyed by its exact title |

```bash
cd presentations/b09-sdwan-executive
source /c/tmp/deckenv.sh
node build.js B09_SDWAN_Executive.pptx
python "$VALIDATE" B09_SDWAN_Executive.pptx
python ../_build/a11y_check.py B09_SDWAN_Executive.pptx
```

`build.js` stops if a slide has no narration, if a narration entry has no slide, if two titles match, or if a title runs over 58 characters, and it warns (`!`) when text may overflow its box or a `Sources:` line runs over 185 characters. Each slide's notes carry the spoken text with a timing cue (worked out at about 160 words a minute), a `Detail:` block with the chapter's figures and quotations, and the chapter sources. `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1` make the audio, captions and narrated copy; the last needs PowerPoint, so run it yourself.

Every fact comes from a footnoted chapter of Book 09: Chapters 01, 03, 05, 10, 11 and 13. Chapter 11's cost figures are its own planning estimates, not quotes, and the slides keep them labeled as assumptions; the owner and timing on the decision slide are labeled design guidance. The diagrams are the committed Book 09 figures, with alt text from their `fig-alt`.
