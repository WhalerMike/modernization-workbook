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

### Where new work goes: one home per type

The workbook follows Microsoft Learn's content types. Every page is one type, and each type has one home:

| Type | Learn equivalent | Home | What it holds |
|---|---|---|---|
| Book chapter | Overview and concepts | `docs/books/bNN-*/` | The vendor-neutral narrative: why, what, and the design. Book 19 is the code companion: a developer workbook built on `examples/` |
| Explainer | Concept article | `docs/books/explainers/` | One concept in plain language, vendor-neutral, serving one or more books |
| Implementation guide | How-to guide | `docs/books/guides/` | How to build a book's design, as gates with steps, a **Validate** step, rollback and evidence; may name products |
| Evaluation | Technology choices | `docs/evaluations/` | A product or platform judged against a book's requirements, with the evidence for and against |
| Training | Learning path | `docs/training/` | Modules that teach a skill in order, built from existing guides, decks and labs |
| Reference | Reference | `docs/reference/` | Lookup tables: commands, crosswalks, mappings |
| Project plan / developer workbook | (none) | `docs/project-plans/` | A schedule of a guide's gates, and the code workbooks for its tracks |
| Deck and video | Shows | `presentations/` and the Presentations page | Presentations of a book or guide |

Four rules keep this from sprawling:

1. **A page doesn't change type or home.** If its type was wrong, fix it once, with an alias for the old address; don't move it back and forth.
2. **Link, don't repeat.** A guide links to the book chapter that explains a concept instead of restating it; a training module links to guide sections, decks and labs instead of rewriting them. New text says only what nothing else already says.
3. **One deck series per guide**, at the level of its gates. A book may have its own executive and technical decks; a guide does not add further tiers. A developer workbook may add a narrated story deck that follows one case through its chapters, and one narrated tour per chapter.
4. **New guides fill a real gap.** Before starting one, name the book chapters it builds on and the step-by-step work they don't already give.

### An implementation guide is finished when it has all four pieces

1. **The guide**, in gates, carrying the two layers below.
2. **One narrated deck series** at the level of its gates.
3. **A developer workbook** in `docs/project-plans/developer-workbooks/` (Book 19 for the Attribute-Driven Migration): chapters built on tested code in `examples/`, each with **Lab 1** on fixtures with no tenant, **Lab 2** in a test tenant or instance with a way to back it out, the verified facts, dangers and a checklist. It links to chapters other workbooks already teach instead of rebuilding them.
4. **A training path** in `docs/training/`: modules in order, each pointing to the guide sections, decks and workbook labs it uses, with a short knowledge check. The only new writing is the path, the module framing and the questions.

Until all four exist, the guide's "pieces" table names the missing ones as planned.

### What every implementation guide and training module must carry

Microsoft Learn says how to do something on the current commercial service. It doesn't say what a federal agency must do and prove, or how to get there from where most agencies are. Every implementation guide, and every training module, carries both:

- **Federal requirements and evidence.** For each gate or module: the requirement it meets (an OMB memorandum, a CISA directive or binding operational directive, a NIST SP 800-53 control at Moderate, NIST SP 800-63, FedRAMP) and the evidence an ISSO keeps to show it was met. Link the [federal framework crosswalk](docs/reference/federal-framework-crosswalk.md) or the book's requirements appendix rather than restating them.
- **Where agencies are.** The starting state the guide assumes (for example, Active Directory with OU-based policy, an on-premises HR system, a government cloud tenant), a **government-cloud availability** check for each feature it relies on, citing Learn's GCC, GCC High or national cloud availability page with the date it was read, and an **interim path** where a feature isn't available yet or a legacy system has to stay.

Cite Microsoft Learn first for how a Microsoft feature works, and federal primary sources for what is required. Any comparison of cloud platforms covers AWS, Azure and Oracle Cloud Infrastructure.

### Status labels

Until it is reviewed and proved, a page carries `research-status` (`draft`, `in review`, `proved`, `published`) and `last-reviewed` in its front matter, and a claims log at `_verification/<page>.md` beside it. The banner filter (`assets/research-banner.lua`) labels the page, and the weekly source watch checks its sources and its review date. What each status means, and what moves a page to the next, is in [Status labels for guides, explainers, evaluations and training](docs/about/sources-and-verification.md#status-labels).

## Checking a pull request

A full site render takes most of an hour, so pull requests get a tiered check instead: `scripts/check_changed.py`, which the **Pull request checks** workflow (`.github/workflows/pr-checks.yml`) runs on every pull request to `main`. It compares the branch with its base and picks one of three tiers.

| Tier | When | What runs |
|---|---|---|
| **FULL** | `_quarto.yml`; anything in `assets/`, `docs/filters/`, `_extensions/` or `docs/_*`; a `_metadata.yml`; a file a published page pulls in with the `include` shortcode; `scripts/generate_*.py`, `write_redirects.py`, `redirects.yml`, `build_bundles.py`, `bundles.yml` or `bundle-filter.lua`; the deploy workflow; a page with a `listing:` (each book's `index.md`); `docs/presentations/videos.json`; a published page renamed or deleted; or more than 25 published pages affected | The deploy workflow's build without the deploy: site map, DOCX and HTML render, every Word bundle and kit zip, then the link, footnote, redirect and video-manifest checks |
| **CHANGED** | Published pages changed, directly or through an image they embed | Site map; render only those pages to HTML; check their links and `#anchors`, and links from anywhere in `docs/` to their headings; check footnotes; build only the Word bundles that contain them; validate the redirect map |
| **NONE** | Nothing the site publishes changed, for example only deck binaries, example code or unpublished notes | Only the checks below |

Whatever the tier, the changed files also select: the deck accessibility check (`presentations/_build/a11y_check.py`) for changed decks, a kit zip build for a changed `examples/` kit, the kit's own test suites for a changed `examples/` kit that has a `tests/` folder (`scripts/run_example_tests.py`: Pester and pytest, on Linux; every kit's when the runner or the workflow changes; the drift pipeline's too when `non-person-identity` or `privileged-access` changes, because its tests read their evidence runs), the video manifest and project plan staleness checks, the authorities-table check (`scripts/render_authorities_table.py --check`, for the spine or a `docs/compliance/` page), the evidence-map check (`scripts/check_evidence_maps.py --check`, for a map in `examples/evidence-maps/` or its schema), the command-help check (`scripts/command_reference.py --check`, for changed example code), the agency-neutrality check (`scripts/check_neutrality.py`, on every changed text file, or on every file when the term list, the baseline or the checker changes), and the script's unit tests (`scripts/tests/`).

Two of those also run weekly on all of `main`, in the **Weekly gates** workflow (`.github/workflows/weekly-gates.yml`, Mondays after Source watch): the neutrality check over every file, which catches a direct push, and the evidence maps judged at today's date, so a stale link or an agreement term coming due is reported without anyone editing the map. Findings go to one open issue, "Weekly gates: findings," which is closed when a run comes back clean.

- **Agency neutrality.** The terms are stored as salted hashes in `data/neutrality-terms.txt`, so the list doesn't name them; add one with `python scripts/check_neutrality.py --add` (it reads the term from stdin). A hit reports the file and line, never the words, because logs and issues on this repository are public. A line that has to stay, such as an old redirect alias, goes in `data/neutrality-baseline.txt` by a reviewed change; that list only shrinks.
- **Evidence maps.** A map follows `data/schemas/evidence-map.schema.json` and the rules in [Book 18, Chapter 02](docs/books/b18-application-modernization/02-triaging-the-portfolio.md). Its `<map>.summary.md` is generated: edit the map and run `python scripts/check_evidence_maps.py`.

What the link and footnote checks look for:

- **Links**: every relative link must reach a file that exists, a page the site publishes (not an unpublished `.md`; link those on GitHub), a redirect, or a download the build makes (`downloads/<bundle>.docx`, `downloads/<kit>.zip`). Every `#anchor` must match a heading id (as Quarto generates it) or an explicit `{#id}` on the target page.
- **Footnotes**: no note referenced but undefined, or defined twice; and note names unique across each Word bundle, because the bundle joins its pages into one document. A note defined but never referenced is a warning.

In the FULL tier the link and footnote checks cover every published page, but only problems on pages the change touched, or links to them, fail the run; the rest are listed as warnings.

When the check renders pages (the CHANGED and FULL tiers), the run keeps them for 7 days as the `rendered-pages` artifact, without the Word bundles and kit zips, and its summary links the download and lists the pages. Unzip it and open a page in a browser to see the change as the site will show it, without rendering locally.

Run it locally before opening a pull request (Python 3.10+ with PyYAML, and Quarto on `PATH`):

```bash
python scripts/check_changed.py --dry-run     # the tier, the reason and the plan
python scripts/check_changed.py               # run it (against origin/main)
python scripts/check_changed.py --base origin/main --force-full
python -m unittest discover -s scripts/tests  # the tier rules' tests
python scripts/run_example_tests.py --list    # the example kits' test suites
python scripts/run_example_tests.py privileged-access   # one kit's suites (needs pwsh with Pester 5, pytest)
```

Locally the changed files include uncommitted edits to tracked files (`--committed-only` leaves them out; `--include-untracked` adds new files). `--files a.md b.svg` (or `--files @list.txt`) plans for a given file list, `--max-pages N` moves the FULL threshold, and `--skip-docx` drops the slow per-page DOCX render from a local FULL run. A CHANGED run renders into `_site/` and puts back the books table that the pre-render step rewrites, so it leaves no edits behind. Run `git fetch origin main` first so the comparison is against the current `main`.

## Help for example commands

Every command in `examples/` needs help, because the [Command Reference](docs/reference/commands.md) is built from it on every deploy:

- **A PowerShell function a module exports, or a script:** comment-based help with a `.SYNOPSIS` and at least one `.EXAMPLE`. Put a function's help just inside its body, before `param`, and a script's at the top of the file. `Get-Help <command> -Full` and `<command> -?` then show it.
- **A Python tool** (a file with `if __name__ == "__main__"`): a module docstring whose first line is the synopsis and which contains at least one line that runs the tool (`python tool.py --fixture ...`). Use argparse, so `--help` works.

`python scripts/command_reference.py --missing [--kit <kit>]` lists what's missing; the pull request checks fail while anything is. Files under a kit's `tests` folder and the pinned samples in `examples/third_party` aren't commands. Run `python scripts/command_reference.py` to build the page body locally before a render.

## Versioning

- Major structural changes (new series, renamed sections) are noted in `STATUS.md`.
- Individual documents carry a short provenance note; full history is in git.
- Published states of the workbook are kept as **editions**, below.

## Editions and the archive

The site always shows `main`. An **edition** is a fixed state of it: a git tag `edition-YYYY.MM`, named for the month it is cut (a second cut in the same month is `edition-YYYY.MM.N`), and a GitHub Release on that tag holding the edition's built files. Large binaries belong on Releases, not in git: each asset can be up to 2 GiB, a Release holds up to 1,000 assets, and Releases don't count toward the repository's size.

| What | Where |
|---|---|
| The record of every edition: date, summary, and the changes to each book, guide and developer workbook | `data/editions.yml` (hand-edited after the cut script drafts it) |
| Each edition's file list | `data/edition-assets/<edition>.json` (written by the cut script from the Release) |
| Each book's version and revision history | The "Version and revision history" section at the end of the book's `index.md` (each guide's page, each developer workbook's `index.md`), generated |
| Every edition and its files, and the other releases (kits, video sets) | The [Archive](docs/about/archive.md) page, generated |
| The files themselves | The edition's Release: `https://github.com/WhalerMike/modernization-workbook/releases/tag/<edition>` |

A book is version 1.0 in the first edition it appears in, and one step up (1.1, 1.2) in each later edition that changes it. To start a new major version, set `version: "2.0"` on the book's entry in that edition. `scripts/generate_revisions.py` writes the history sections and the Archive from the record; never edit between the `revisions:start` / `revisions:end` or `archive:start` / `archive:end` comments. A developer workbook's pages, its implementation guide among them, all count as changes to that workbook. The review gate (`scripts/source_watch/review_gate.py`) leaves the generated history section out of a gated page's hash, as it does the narrated-tour block, so a new edition doesn't send approved pages back for review; any edit outside the markers still does. Its `--check` runs in the pull request checks whenever the record, a carrying page or the Archive changes (and in the FULL tier): it fails on a stale section, an edition id or date out of order, a book the record names that doesn't exist, or an edition with no tag.

### Cutting an edition

From a clean checkout of `main`, with the GitHub CLI signed in:

```bash
git fetch origin main --tags
python scripts/cut_edition.py edition-2026.10 --summary "One or two sentences on this edition." --dry-run
python scripts/cut_edition.py edition-2026.10 --summary "One or two sentences on this edition." --asset "<folder>/*.pptx" --asset "<folder>/*.zip"
```

1. The dry run prints the drafted entry: for each book, guide and developer workbook, the subjects of the pull requests merged since the previous edition that touched its folder, its diagrams or its decks. Nothing changes.
2. The real run creates the Release, and the tag with it, on `origin/main`, not marked as the repository's latest release (the kit releases keep that label). It uploads the `--asset` files, writes the entry into `data/editions.yml` and the file list into `data/edition-assets/`, and regenerates the history sections and the Archive. It never deletes or replaces a release asset.
3. Publishing the Release starts the **Edition files** workflow (`.github/workflows/edition.yml`). It builds the Word editions and kit zips from the tagged commit and attaches them. To rerun it, use **Run workflow** with the tag; it skips files already on the Release.
4. When the workflow finishes, run `python scripts/cut_edition.py --refresh-assets edition-2026.10` to record the Word editions too.
5. Edit the drafted change lines in `data/editions.yml` if they need it (one short line each), run `python scripts/generate_revisions.py`, and open a pull request with `data/editions.yml`, `data/edition-assets/` and the regenerated pages.

**Decks and narration audio.** The built decks and the narration MP3s are not in git; each edition's Release carries them, and `data/deck-assets.json` lists them (see [presentations/_build/README.md](presentations/_build/README.md)). Cut an edition with `--decks` after `python scripts/deck_assets.py fetch --all`, so it carries every deck: it packs them, uploads them, checks the Release holds each file byte for byte (`deck_assets.py verify`), and points every deck link at the new edition (`deck_assets.py links`). The pull request checks run `deck_assets.py links --check`, which fails on a link to a deck path in the repository or to a Release file not in that edition's recorded list.

An edition is never changed after it is published. A correction goes in the next edition, or a reissue in the same month (`edition-2026.10.1`). Deleting a Release or an asset needs the maintainer's explicit approval.

The repository's history still holds every deck and narration file committed before they moved to Releases. Rewriting history to drop them is written up, as an option only, in [`docs/project-management/history-rewrite-option.md`](docs/project-management/history-rewrite-option.md).

## Deferred material

Full catalogs and individual compliance books remain in source materials. Extract only when a specific pattern is needed for the workbook.

---

*For project use.*
