# Book deck build kit

One shared kit so every workbook book's 15-minute presentation has the same look, structure and narration. Each book keeps only its own `build.js` (the slide content and speaker notes) in `presentations/<book>/`.

| File | What it does |
|---|---|
| `lib.js` | Theme (Cambria / Calibri; navy, teal, amber and red ink on white), the Title and Content layouts, and the helpers every deck uses: Why / What / Who / How tags, cards, icons, callouts, tables, a sources line |
| `bg_title.png`, `bg_content.png`, `bg.py` | Slide backgrounds (`bg.py` regenerates them) |
| `icons/`, `icons.js` | White-on-transparent Font Awesome icons placed on colored circles (`icons.js` regenerates them; needs `react`, `react-dom`, `react-icons`, `sharp`) |
| `narrate.py` | Speaker notes → one neural-voice MP3 per slide (edge-tts), `durations.json`, and a practice script. Stops at a slide titled "Backup". Applies the spoken-form fixes in `PHON` (acronyms) to the audio only |
| `build_narrated.ps1` | Copies the deck, embeds each slide's audio, sets slide timings, drops the backup slides, and can export an MP4 (PowerPoint on Windows) |

## Build a book's deck

```powershell
$env:NODE_PATH = (npm root -g)          # pptxgenjs installed globally
$env:SKILL = "<path to the pptx skill>" # or $env:APPLY_THEME = "<path>\apply_theme.js"
node presentations/b02-identity/build.js presentations/b02-identity/B02_Identity.pptx
python presentations/_build/narrate.py presentations/b02-identity/B02_Identity.pptx
powershell -File presentations/_build/build_narrated.ps1 -Dir presentations/b02-identity -Base B02_Identity   # add -Video for an MP4
```

Python needs `edge-tts`, `mutagen` and `python-pptx`. Narration is regenerated only for slides whose MP3 is missing, so delete a slide's MP3 after changing its notes.

## Rules for every deck

- Four parts, always in this order and color: **Why** (red), **What** (navy), **Who** (teal), **How** (amber). About nine narrated slides at 90–110 seconds each, for 15 minutes.
- Every fact on a slide must come from a footnoted chapter of the book. The notes end with `Workbook: Book NN, Chapter …` and a slide carries a short `Sources:` line; the backup section lists the sources in full.
- White backgrounds only. No agency names: decks are agency-agnostic like the rest of the workbook.
