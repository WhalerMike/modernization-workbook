# Ticket-to-Machine on ServiceNow and SailPoint: narrated research deck

A narrated walk through the research example [Ticket-to-Machine on ServiceNow and SailPoint: An Example](../../docs/books/guides/ttm-servicenow-sailpoint.md), the vendor-named companion to the vendor-neutral [Book 13, Appendix B — Ticket-to-Machine Reference](../../docs/books/b13-governance/appendix-b-ticket-to-machine-reference.md) (narrated in [`../b13-ticket-to-machine/`](../b13-ticket-to-machine/README.md)) and the draft [Keeping Identity Correct After HR Becomes the Source](../../docs/books/explainers/identity-maintenance.md). It's an example, not a recommendation or an endorsement: other products can fill the same slots. It's built with the shared kit in [`../_build/`](../_build/README.md). This folder sits outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Research_TTM_ServiceNow_SailPoint.pptx` | The deck: 13 narrated slides (the title, 11 content slides and a closing slide), then a backup section with what couldn't be verified and the full source list |
| `narration.js` | What the voice says on each narrated slide, keyed by the slide's exact title: the slide's intent and one or two highpoints, with a lead-in to the next slide (about 1,470 words, about 10 minutes). `build.js` stops if a slide has no narration or a narration entry has no slide |
| `build.js` | Slide content and speaker notes |

The narrated slides cover why the example names products, the two products and their FedRAMP status (with why Identity Security Cloud rather than IdentityIQ, and the Human Fabric naming caution), the diagram, how the products hand work to each other, the loop step by step, the lanes on these products, the four gaps (two slides), the identity fixes on these products (two slides), federal availability and cautions, and what to verify, decide and read next.

Each slide's speaker notes start with a timing cue and the spoken narration, then a `Detail:` block with the full content for a live presenter, and end with the section of the page they draw on. Each content slide carries a short Sources line naming the page's footnote sources; the backup slides list what the page couldn't verify and every source (SailPoint, ServiceNow, Microsoft Learn and FedRAMP Marketplace data, all opened October 24, 2026). The page's labels are kept: product facts are the vendors' own statements, and mappings marked *(inference)* or *(design guidance)* are the program's. The diagram is the page's committed PNG, `docs/images/diagrams/b13-governance/png/ttm-snow-sailpoint.png`, with the page's figure alt text.

## Build

```bash
cd presentations/research-ttm-servicenow-sailpoint
source /c/tmp/deckenv.sh          # NODE_PATH, APPLY_THEME, VALIDATE
node build.js Research_TTM_ServiceNow_SailPoint.pptx
python "$VALIDATE" Research_TTM_ServiceNow_SailPoint.pptx
python ../_build/a11y_check.py Research_TTM_ServiceNow_SailPoint.pptx
```

`build.js` enforces titles of at most 58 characters, unique across the deck, and Sources lines of at most 185 characters. It prints the spoken words per slide and warns (lines starting with `!`) when a table, panel, flow, fact box or callout is likely to overflow; run it with `FIT=1` to print each element's estimated fit. The narrated edition (audio, captions, self-running deck) is made separately with `../_build/narrate.py`, `captions.py` and `build_narrated.ps1`.
