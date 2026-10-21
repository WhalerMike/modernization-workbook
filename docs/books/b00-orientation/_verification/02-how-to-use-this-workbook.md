# Verification — Chapter 02, How to Use This Workbook

Checked October 21, 2026 by writer W1. Sources: `docs/HOW-TO-USE.md` (archived after the build), with `docs/whitepapers/reading-guide.md` (reference only, not archived) and `docs/books/index.md` (read only). Workbook structure was read from the repository itself: `docs/books/index.md`, the index pages of Books 02, 04, 10 and 11, `docs/presentations/index.md`, `docs/images/diagrams/README.md`, `scripts/bundles.yml`, `scripts/build_bundles.py`, `scripts/redirects.yml`, `_quarto.yml`, `archive/` and the `_verification/` folders of published books. Most of the chapter describes the workbook itself (internal facts); external claims are few and are footnoted.

Diagram sources: `docs/images/diagrams/b00-orientation/src/ch02-map-of-the-books.flow.yaml`, `ch02-anatomy-of-a-book.flow.yaml`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Eighteen books B00–B17, titles, opening questions, status (B01–B11 draft; B12–B17 planned) | Eighteen books; map table; diagram | verified (internal) | `docs/books/index.md` |
| 2 | Planned books' sources stay unpublished in the repository; chapters link there | Eighteen books | verified (internal) | `docs/books/index.md`; `_quarto.yml` render list |
| 3 | Book 01 is canonical for phases and gates | Eighteen books | verified (internal) | B00 brief |
| 4 | Every book index has Why/What/Who/How table, reading paths, "where this book sits" | Four questions | verified (internal) | B02, B04, B10, B11 index pages |
| 5 | M-26-14 rescinded M-21-31 (May 2026) | Reading a footnote | verified | M-26-14 p. 2 (extracted text) |
| 6 | Footnote format with access date | Reading a footnote | verified (internal) | `_book-writer-brief.md` |
| 7 | Verification files: claims log + carry-forward ledger, verdict set | The verification record | verified (internal) | `_book-writer-brief.md`; `docs/books/b02-identity/_verification/` |
| 8 | `_`-prefixed files not rendered | The verification record | verified (internal) | `_book-writer-brief.md` |
| 9 | Diagrams generated from sources by shared renderer; SVG on site, PNG at 2x in Word | Diagrams | verified (internal) | `docs/images/diagrams/README.md` |
| 10 | Tone meanings; white background; no title in image; caption + fig-alt; chapter authoritative over diagram | Diagrams | verified (internal) | diagrams README; HOW-TO-USE "Diagrams" |
| 11 | Word edition per book, regenerated on every deploy; some books also publish parts separately | Word editions | verified (internal) | `scripts/bundles.yml` (b03, b06 per-part outputs); book index pages |
| 12 | Deck / Narrated / Script / Captions; speaker notes; slides name chapter and sources | Presentations | verified (internal) | `docs/presentations/index.md` |
| 13 | WebVTT is the W3C text format for captions and time-aligned data | Presentations | verified | W3C WebVTT, CR Draft May 20, 2026 |
| 14 | PowerPoint supports WebVTT captions for video and audio on Windows and Mac | Presentations | verified | Microsoft Support, "Add closed captions or subtitles to media in PowerPoint" |
| 15 | Revised 508 Standards incorporate WCAG 2.0 Level A and AA | Presentations | verified | U.S. Access Board ICT standards, E205.4, 702.10.1 |
| 16 | Decks built to meet Section 508 and target WCAG 2.1 AA | Presentations | verified (internal claim of the workbook) | `docs/presentations/index.md` Accessibility |
| 17 | Replaced pages move to `archive/<book>/`; old addresses redirect; redirects listed in `scripts/redirects.yml` | What happened to the earlier pages | verified (internal) | `archive/`; `scripts/redirects.yml`; `scripts/write_redirects.py` |
| 18 | Site publishes only the books and presentations | What happened to the earlier pages | verified (internal) | `_quarto.yml` comment and render list; `docs/books/index.md` |
| 19 | Reading paths by role | Reading paths | restated-as-design (all linked chapters checked to exist) | Book index pages |
| 20 | Five-group book map | Map; diagram | restated-as-design (the program's reading grouping, not an official taxonomy) | — |
| 21 | Issues via GitHub repository | If you find a problem | verified (internal) | `docs/presentations/index.md`; CONTRIBUTING.md |
| 22 | HOW-TO-USE: "Full 60-book compliance series" deferred | Not carried | removed (superseded by the book structure; compliance books become B14 sources) | — |
| 23 | HOW-TO-USE: "STATUS.md excluded from the public site build" | Not carried | removed (repository housekeeping, not reader guidance) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| HOW-TO-USE.md — intro ("cleaned, standalone modernization project") | Ch02 opening | Restated around the books |
| HOW-TO-USE.md — Who this is for | Ch02 Reading paths | Expanded into seven roles |
| HOW-TO-USE.md — Start here (Principles, Charter, Plan, Why hard, Client-Server series) | Ch02 Reading paths (Ch03–05 of this book, B01) | The charter, principles and plan are now B00 Ch03–05; old file links not carried |
| HOW-TO-USE.md — How the material is organized (section table) | Ch02 Eighteen books; Map of the books | Replaced by the book structure; old section links (architecture series, operational guides, whitepapers, compliance overview) not carried because those pages are being archived or are unpublished |
| HOW-TO-USE.md — What is intentionally deferred | — | Superseded: planned books (B12–B17) and their unpublished sources replace the "deferred" list |
| HOW-TO-USE.md — Diagrams | Ch02 Diagrams | Carried and updated (house-style SVG; prose authoritative) |
| HOW-TO-USE.md — Provenance | Ch02 What happened to the earlier pages | Restated (archive and redirects); STATUS.md note not carried |
| reading-guide.md (reference only) — six tracks and reading paths | Ch02 Reading paths (role-based) | Used as reference for path design; track tables not carried (they list whitepapers that are being consolidated into books) |
| reading-guide.md — Problem / Solution / Ask box convention | — | Whitepaper convention, not a book convention; not carried |
| books/index.md (read only) — book table and build description | Ch02 Eighteen books; Map; archive; Word; presentations | Carried; this page is not archived |
