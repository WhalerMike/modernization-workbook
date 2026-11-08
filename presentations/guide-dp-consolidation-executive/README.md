# Content Delivery Modernization (DP Consolidation): executive decision deck

**Deck name: Guide_DP_Consolidation_Executive.** An eight-minute narrated decision briefing for a CIO, a budget officer and an endpoint lead who are weighing a refresh of Configuration Manager distribution point hardware. It is built from [Chapter 11 — Field Office WAN Transformation](../../docs/books/b09-network/11-field-office-wan-transformation.md), a worked case whose every cost is a planning estimate, and it closes with a follow-on slide on standard application packaging with PSAppDeployToolkit, so content behaves the same whether Configuration Manager or Intune delivers it. The last slide links the decision guide (`docs/books/guides/dp-consolidation.md`) and the project plan (`docs/project-plans/content-delivery.md`). It is built with the shared kit in [`../_build/`](../_build/README.md) and the helpers of the Book 09 SD-WAN executive deck. This folder sits outside `docs/`, so the site doesn't render it.

| # | Slide |
|---|---|
| 1 | Content Delivery Modernization (DP Consolidation) |
| 2 | The decision: refresh 1,500 servers, or consolidate? |
| 3 | Questions to answer before any money moves |
| 4 | Capacity and timing: 24 needed, and a shrinking tier |
| 5 | Three options compared: refresh, consolidate, retire |
| 6 | The target: 12 hubs and 24 distribution points |
| 7 | Keeping content local without a branch server |
| 8 | A gate, not a date: retiring the last server |
| 9 | What it costs: about $10 million in Year 1 |
| 10 | Five years out, and the one number that decides it |
| 11 | The roadmap: hubs first, offices at renewal |
| 12 | Risks, and the assumptions to check first |
| 13 | Next: one standard package for ConfigMgr and Intune |
| 14 | The ask: defer, decompose, validate, fund Phase 0 |

Then **Backup** and **Sources behind this briefing** (not narrated).

| File | Use |
|---|---|
| `Guide_DP_Consolidation_Executive.pptx` | The deck: 14 narrated slides, then a backup section with the full source list |
| `build.js` | Slide content and speaker notes (each with a Detail block that names its chapter) |
| `narration.js` | The spoken narration, one entry per narrated slide, keyed by the exact slide title; the build fails if an entry has no slide |
| `add_links.py` | Puts back the three links of this deck (the toolkit's site, the decision guide, the project plan) after `link_sources.py`, which clears every hyperlink it doesn't write |

## Sources

Book 09, Chapter 11 for every figure and the five gates; Microsoft Learn (Configuration Manager size and scale, servicing, co-management workloads, peer cache, Delivery Optimization, Connected Cache; Win32 app management in Intune) for the platform facts; the PSAppDeployToolkit site for the packaging slide. The packaging claim that one package behaves the same under both tools is labeled design guidance. Facts as of October 2026.

## Build

```bash
cd presentations/guide-dp-consolidation-executive
source /c/tmp/deckenv.sh
node build.js Guide_DP_Consolidation_Executive.pptx
python ../_build/link_sources.py Guide_DP_Consolidation_Executive.pptx
python add_links.py Guide_DP_Consolidation_Executive.pptx
python ../_build/a11y_check.py Guide_DP_Consolidation_Executive.pptx
```

The narrated edition is made later with `../_build/narrate.py`, `../_build/captions.py` and `../_build/build_narrated.ps1 -Base Guide_DP_Consolidation_Executive`.
