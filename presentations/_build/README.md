# Book deck build kit

One shared kit so every Federal Modernization Workbook book's 15-minute presentation has the same look, structure, narration and accessibility. Each book keeps only its own `build.js` (the slide content and speaker notes) in `presentations/<book>/`.

| File | What it does |
|---|---|
| `lib.js` | Theme (Cambria / Calibri; navy, teal, amber and red ink on white), the Title and Content layouts, and the helpers every deck uses: Why / What / Who / How tags, cards, icons, callouts, tables, a sources line. Every title slide carries the presenter (Michael F. Stratton) and the not-an-official-publication disclaimer; `save()` runs the accessibility pass |
| `bg_title.png`, `bg_content.png`, `bg.py` | Slide backgrounds (`bg.py` regenerates them) |
| `icons/`, `icons.js` | White-on-transparent Font Awesome icons placed on colored circles (`icons.js` regenerates them; needs `react`, `react-dom`, `react-icons`, `sharp`) |
| `narrate.py` | Speaker notes → one neural-voice MP3 per slide (edge-tts), `durations.json`, `sentences.json` (sentence timings, for captions) and a practice script. Stops at a slide titled "Backup". Applies the spoken-form fixes in `PHON` (acronyms) to the audio only. When the deck folder has a `narration.json` (one `{slide, title, say}` entry per narrated slide), the voice speaks that instead of the notes; the title must match the slide's or it stops |
| `captions.py` | WebVTT captions from the practice script and the sentence timings: `narration_<Base>/slideNN.vtt` (one track per slide, embedded in the narrated deck) and `<Base>_Narrated.vtt` (one track for the MP4) |
| `vtt_split.py` | For a deck that already has a whole-video `.vtt`: cuts it into the per-slide tracks |
| `build_narrated.ps1` | Copies the deck, embeds each slide's audio, sets slide timings, drops the backup slides, embeds the captions (through `a11y_fix.py`), and can export an MP4 (PowerPoint on Windows) |
| `a11y_fix.py` | The accessibility pass, run on every built deck: author and presenter name, decorative marking for icons and textless shapes, table header rows, alt text on narration audio, and (with `--captions`) PowerPoint closed-caption tracks |
| `a11y_check.py` | Checks every deck (or the ones named) against the rules below; exits 1 on any problem |
| `devwb.js` | The layout for the developer-workbook chapter tours (`presentations/dw-*/`): each tour's `build.js` passes its slides as data, and `devwb.js` lays them out, fits the text, reads the chapter's front matter and footnotes, and writes the notes (narration, Detail part, the cited footnotes in full) and the backup section. It refuses a deck with a missing part, an unknown footnote name, an over-long title or narration, or an agency or out-of-scope term |
| `qa_export.ps1` | Exports each deck's slides to PNG through PowerPoint and reports text that overflows its box, sits too low or overlaps another box; exits 1 on any problem |
| `export_mp4.ps1` | Exports a narrated deck to MP4 in a fresh PowerPoint, for when `build_narrated.ps1 -Video` stalls |
| `link_tours.py` | Writes each developer-workbook tour's README and links the tours from the chapter pages, the workbook landing pages and the Presentations page, between `tour:begin` / `tour:end` markers |

## Decks and audio live on the edition's Release, not in git

The built decks (`*.pptx`, plain and narrated) and the narration audio (`narration_<Base>/*.mp3`) are not committed. Each edition's GitHub Release carries them: every deck as itself, and each narration folder's MP3s as one zip, `<Base>_narration_audio.zip`. `data/deck-assets.json` lists every file, its asset, its size and sha256, and the edition that holds it. Git keeps everything they are built from: `build.js`, `narration.json`, `durations.json`, `sentences.json`, the caption tracks, the scripts and the READMEs. The site's deck links point at the current edition's Release (`scripts/deck_assets.py links`).

Before rebuilding a deck, put its built files back, so `narrate.py` reuses the existing audio instead of generating it again:

```bash
python scripts/deck_assets.py fetch presentations/b02-identity      # one folder
python scripts/deck_assets.py fetch --all                           # every deck and audio folder (about 715 MB)
```

A new or rebuilt deck reaches the site with the next edition: fetch every deck first (`fetch --all`), so the edition carries them all, then `python scripts/cut_edition.py <edition> --summary "..." --decks` (a correction between monthly editions is a reissue, `edition-YYYY.MM.N`). It uploads the decks and audio zips, checks the Release holds them byte for byte, and points every deck link at the new edition. See "Editions and the archive" in [CONTRIBUTING.md](../../CONTRIBUTING.md).

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

## Build a developer-workbook chapter tour

```bash
source /c/tmp/deckenv.sh                 # NODE_PATH and APPLY_THEME
DATECODE="2026-10-31 10:16 ET" node presentations/dw-pa-02-emergency-access/build.js   # Eastern time from PowerShell
python presentations/_build/narrate.py presentations/dw-pa-02-emergency-access/DW_PA_02_Emergency_Access.pptx
python presentations/_build/captions.py presentations/dw-pa-02-emergency-access/DW_PA_02_Emergency_Access.pptx
powershell -File presentations/_build/qa_export.ps1 -Deck <abs path>\DW_PA_02_Emergency_Access.pptx -Out <folder for PNGs>
powershell -File presentations/_build/build_narrated.ps1 -Dir <abs path>\presentations\dw-pa-02-emergency-access -Base DW_PA_02_Emergency_Access
powershell -File presentations/_build/export_mp4.ps1 -Src <abs path>\DW_PA_02_Emergency_Access_Narrated.pptx -Mp4 <abs path>\DW_PA_02_Emergency_Access_Narrated.mp4
```

Upload the MP4 to the videos release, run `scripts/generate_video_manifest.py --verify` and then without `--verify` (with the narrated deck here, it also refreshes the video's chapters in `data/video-chapters.json`), and finally `presentations/_build/link_tours.py "<recording date>"`. A new tour's deck links point at its folder on GitHub until an edition carries the deck, and a tour whose video isn't on the videos release yet gets no player, Watch or MP4 link, so the link checks pass in between; a workbook recorded on another day takes its own date (`link_tours.py "October 31, 2026" ttm="November 1, 2026"`). A tour runs about eleven minutes: a title slide and about seventeen content slides in Why, What, Who and How order. Rebuild and re-record a tour when its chapter changes.

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
