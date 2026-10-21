# Book deck build kit

One shared kit so every Federal Modernization Workbook book's 15-minute presentation has the same look, structure, narration and accessibility. Each book keeps only its own `build.js` (the slide content and speaker notes) in `presentations/<book>/`.

| File | What it does |
|---|---|
| `lib.js` | Theme (Cambria / Calibri; navy, teal, amber and red ink on white), the Title and Content layouts, and the helpers every deck uses: Why / What / Who / How tags, cards, icons, callouts, tables, a sources line. Every title slide carries the presenter (Michael F. Stratton) and the not-an-official-publication disclaimer; `save()` runs the accessibility pass |
| `bg_title.png`, `bg_content.png`, `bg.py` | Slide backgrounds (`bg.py` regenerates them) |
| `icons/`, `icons.js` | White-on-transparent Font Awesome icons placed on colored circles (`icons.js` regenerates them; needs `react`, `react-dom`, `react-icons`, `sharp`) |
| `narrate.py` | Speaker notes → one neural-voice MP3 per slide (edge-tts), `durations.json`, `sentences.json` (sentence timings, for captions) and a practice script. Stops at a slide titled "Backup". Applies the spoken-form fixes in `PHON` (acronyms) to the audio only |
| `captions.py` | WebVTT captions from the practice script and the sentence timings: `narration_<Base>/slideNN.vtt` (one track per slide, embedded in the narrated deck) and `<Base>_Narrated.vtt` (one track for the MP4) |
| `vtt_split.py` | For a deck that already has a whole-video `.vtt`: cuts it into the per-slide tracks |
| `build_narrated.ps1` | Copies the deck, embeds each slide's audio, sets slide timings, drops the backup slides, embeds the captions (through `a11y_fix.py`), and can export an MP4 (PowerPoint on Windows) |
| `a11y_fix.py` | The accessibility pass, run on every built deck: author and presenter name, decorative marking for icons and textless shapes, table header rows, alt text on narration audio, and (with `--captions`) PowerPoint closed-caption tracks |
| `a11y_check.py` | Checks every deck (or the ones named) against the rules below; exits 1 on any problem |

## Build a book's deck

```powershell
$env:NODE_PATH = (npm root -g)          # pptxgenjs installed globally
$env:SKILL = "<path to the pptx skill>" # or $env:APPLY_THEME = "<path>\apply_theme.js"
node presentations/b02-identity/build.js presentations/b02-identity/B02_Identity.pptx
python presentations/_build/narrate.py presentations/b02-identity/B02_Identity.pptx
python presentations/_build/captions.py presentations/b02-identity/B02_Identity.pptx
powershell -File presentations/_build/build_narrated.ps1 -Dir (Resolve-Path presentations/b02-identity) -Base B02_Identity   # add -Video for an MP4
python presentations/_build/a11y_check.py
```

Python needs `edge-tts`, `mutagen`, `python-pptx` and `lxml`. Narration is regenerated only for slides whose MP3 is missing or has no sentence timings, so delete a slide's MP3 after changing its notes. `build_narrated.ps1` refuses to start while PowerPoint is open (it would attach to that window and close it), and needs the deck folder as an absolute path.

## Accessibility (Section 508 / WCAG 2.1 AA)

Every deck, plain and narrated, is built to pass PowerPoint's Accessibility Checker, and `a11y_check.py` enforces it:

- **Captions.** Each narrated slide's audio carries an embedded WebVTT closed-caption track (MS-PPTX §2.1.3 Track part, `p173:tracksInfo`). In the slide show, turn captions on from the media controls' captions button. Each MP4 ships with `<Base>_Narrated.vtt`, which video players and Stream/SharePoint load as closed captions.
- **Transcript.** `<Base>_Narration_Script.md` is the full text of the narration, and every slide's speaker notes carry it too.
- **Structure.** Every slide has a unique title in the title placeholder, first in reading order. Tables mark their header row. Decks have sections, a document title and an author.
- **Alternative text.** Icons, cards and other textless shapes are marked decorative; their meaning is in the text beside them. Narration audio has alt text. Anything that carries meaning on its own gets a real description.
- **Contrast and size.** Text meets 4.5:1 against white (3:1 for large text); nothing is smaller than 10 pt. Color is never the only signal: the Why / What / Who / How tags carry their words.
- **Language.** All text is tagged en-US, so screen readers pronounce it correctly.

## Rules for every deck

- Four parts, always in this order and color: **Why** (red), **What** (navy), **Who** (teal), **How** (amber). About nine to thirteen narrated slides, for 15 minutes.
- Every fact on a slide must come from a footnoted chapter of the book. The notes end with `Workbook: Book NN, Chapter …` and a slide carries a short `Sources:` line; the backup section lists the sources in full.
- White backgrounds only. No agency names: decks are agency-agnostic like the rest of the workbook.
