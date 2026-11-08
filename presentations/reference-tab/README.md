# The Reference Tab: presentation

**Deck name: Reference_Tab.** A 12-slide narrated briefing (about ten minutes) on why each page of the [Reference tab](../../docs/reference/index.md) matters: the Command Reference, the Federal Framework Crosswalk, the RMF Map, the M-19-17 and FICAM Crosswalk, the Microsoft Practice Crosswalk and the Source Register. It's built with the shared kit in [`../_build/`](../_build/README.md). This folder is outside `docs/`, so the site doesn't render it.

| File | Use |
|---|---|
| `Reference_Tab.pptx` | The deck: twelve narrated slides, then a backup section with the sources |
| `narration.json` | The spoken narration, one `{slide, title, say}` entry per narrated slide; `build.js` copies it into the speaker notes, and `../_build/narrate.py` speaks it and stops if a title doesn't match the slide |
| `build.js` | Slide content; rebuild with the commands below |
| `Reference_Tab_Narration_Script.md`, `Reference_Tab_Narrated.vtt`, `narration_Reference_Tab/` | The practice script, the caption track and the per-slide audio timings and captions, from `narrate.py` and `captions.py` |

## What it covers

| Part | Slides |
|---|---|
| **Why** | Why a Reference tab: run it, prove it, trust it |
| **What** | The six pages at a glance, then one slide each, and how they fit together |
| **Who** | Where to start, by role |
| **How** | How the pages stay honest: read not counted, status and review date, gaps on the page; the Word editions and the Reference Set |

## Numbers to recheck before a rebuild

The slides quote the pages as they stood on November 8, 2026. Recheck each before rebuilding:

- Command Reference: 694 commands in 16 kits (47 PowerShell scripts, 599 module functions, 48 Python tools), from `python scripts/command_reference.py`.
- RMF Map: 25 Covered, 13 Partial, 9 Partial by design, 0 Not covered, across 47 tasks.
- M-19-17 and FICAM Crosswalk: 15 Strong, 20 Partial, 5 Gap, 2 Out of scope, across the 42 rows of its section-by-section and FICAM-services tables (the nine identity-area rows are a summary and aren't counted).
- Microsoft Practice Crosswalk: 33 practices.
- Source Register: 540 rows (`data/source-register.json`).
- Page statuses: Federal Framework Crosswalk, RMF Map, and M-19-17 and FICAM Crosswalk in review; Microsoft Practice Crosswalk draft; Source Register approved by its owner.

## Build

```bash
cd presentations/reference-tab
source /c/tmp/deckenv.sh
node build.js Reference_Tab.pptx
python ../_build/narrate.py Reference_Tab.pptx
python ../_build/captions.py Reference_Tab.pptx
python ../_build/link_sources.py Reference_Tab.pptx
python ../_build/a11y_check.py Reference_Tab.pptx
```

Delete a slide's MP3 after changing its entry in `narration.json`, so `narrate.py` records it again. The narrated edition and the MP4 come from `../_build/build_narrated.ps1 -Base Reference_Tab` and `../_build/export_mp4.ps1`, which need PowerPoint; then run `link_sources.py` on `Reference_Tab_Narrated.pptx` to write its `_sources.json`.
