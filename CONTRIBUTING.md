# Contributing and Governance

This repository is a living project. Content is accepted when it meets the quality bar below and fits the existing structure.

## Quality bar

- No internal branding, product-family names, or document identifiers
- Language usable by an external program team or leadership audience
- Placed under a logical path in `docs/`
- Short note at the bottom: "Cleaned extraction for project use." or equivalent
- Diagrams use white-background style where practical; SVG preferred

## How to propose a change

1. Open an issue or pull request describing the change and the section it belongs to.
2. For new material, indicate whether it is a cleaned extraction or original content.
3. Update the relevant section README and the root README index if the change adds a new entry point.

## Checking a pull request

A full site render takes most of an hour, so pull requests get a tiered check instead: `scripts/check_changed.py`, which the **Pull request checks** workflow (`.github/workflows/pr-checks.yml`) runs on every pull request to `main`. It compares the branch with its base and picks one of three tiers.

| Tier | When | What runs |
|---|---|---|
| **FULL** | `_quarto.yml`; anything in `assets/`, `docs/filters/`, `_extensions/` or `docs/_*`; a `_metadata.yml`; a file a published page pulls in with the `include` shortcode; `scripts/generate_*.py`, `write_redirects.py`, `redirects.yml`, `build_bundles.py`, `bundles.yml` or `bundle-filter.lua`; the deploy workflow; a page with a `listing:` (each book's `index.md`); `docs/presentations/videos.json`; a published page renamed or deleted; or more than 25 published pages affected | The deploy workflow's build without the deploy: site map, DOCX and HTML render, every Word bundle and kit zip, then the link, footnote, redirect and video-manifest checks |
| **CHANGED** | Published pages changed, directly or through an image they embed | Site map; render only those pages to HTML; check their links and `#anchors`, and links from anywhere in `docs/` to their headings; check footnotes; build only the Word bundles that contain them; validate the redirect map |
| **NONE** | Nothing the site publishes changed, for example only deck binaries, example code or unpublished notes | Only the checks below |

Whatever the tier, the changed files also select: the deck accessibility check (`presentations/_build/a11y_check.py`) for changed decks, a kit zip build for a changed `examples/` kit, the video manifest and project plan staleness checks, the authorities-table check (`scripts/render_authorities_table.py --check`, for the spine or a `docs/compliance/` page), the evidence-map check (`scripts/check_evidence_maps.py --check`, for a map in `examples/evidence-maps/` or its schema), the agency-neutrality check (`scripts/check_neutrality.py`, on every changed text file, or on every file when the term list, the baseline or the checker changes), and the script's unit tests (`scripts/tests/`).

Two of those also run weekly on all of `main`, in the **Weekly gates** workflow (`.github/workflows/weekly-gates.yml`, Mondays after Source watch): the neutrality check over every file, which catches a direct push, and the evidence maps judged at today's date, so a stale link or an agreement term coming due is reported without anyone editing the map. Findings go to one open issue, "Weekly gates: findings," which is closed when a run comes back clean.

- **Agency neutrality.** The terms are stored as salted hashes in `data/neutrality-terms.txt`, so the list doesn't name them; add one with `python scripts/check_neutrality.py --add` (it reads the term from stdin). A hit reports the file and line, never the words, because logs and issues on this repository are public. A line that has to stay, such as an old redirect alias, goes in `data/neutrality-baseline.txt` by a reviewed change; that list only shrinks.
- **Evidence maps.** A map follows `data/schemas/evidence-map.schema.json` and the rules in [Book 18, Chapter 02](docs/books/b18-application-modernization/02-triaging-the-portfolio.md). Its `<map>.summary.md` is generated: edit the map and run `python scripts/check_evidence_maps.py`.

What the link and footnote checks look for:

- **Links**: every relative link must reach a file that exists, a page the site publishes (not an unpublished `.md`; link those on GitHub), a redirect, or a download the build makes (`downloads/<bundle>.docx`, `downloads/<kit>.zip`). Every `#anchor` must match a heading id (as Quarto generates it) or an explicit `{#id}` on the target page.
- **Footnotes**: no note referenced but undefined, or defined twice; and note names unique across each Word bundle, because the bundle joins its pages into one document. A note defined but never referenced is a warning.

In the FULL tier the link and footnote checks cover every published page, but only problems on pages the change touched, or links to them, fail the run; the rest are listed as warnings.

Run it locally before opening a pull request (Python 3.10+ with PyYAML, and Quarto on `PATH`):

```bash
python scripts/check_changed.py --dry-run     # the tier, the reason and the plan
python scripts/check_changed.py               # run it (against origin/main)
python scripts/check_changed.py --base origin/main --force-full
python -m unittest discover -s scripts/tests  # the tier rules' tests
```

Locally the changed files include uncommitted edits to tracked files (`--committed-only` leaves them out; `--include-untracked` adds new files). `--files a.md b.svg` (or `--files @list.txt`) plans for a given file list, `--max-pages N` moves the FULL threshold, and `--skip-docx` drops the slow per-page DOCX render from a local FULL run. A CHANGED run renders into `_site/` and puts back the books table that the pre-render step rewrites, so it leaves no edits behind. Run `git fetch origin main` first so the comparison is against the current `main`.

## Versioning

- Major structural changes (new series, renamed sections) are noted in `STATUS.md`.
- Individual documents carry a short provenance note; full history is in git.

## Deferred material

Full catalogs and individual compliance books remain in source materials. Extract only when a specific pattern is needed for the workbook.

---

*For project use.*
