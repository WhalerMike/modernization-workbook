# SQL Server narrative diagrams

The figures in the SQL Server Identity Transformation narrative
(`docs/case-studies/sql-server-narrative/`) are generated from the sources in
this folder. Edit a source, re-render, and commit the source together with
its rendered files. Don't edit `svg/` or `png/` by hand.

| Folder | Contents | Used by |
|---|---|---|
| `src/` | One source per diagram (`*.flow.yaml`, `*.seq.yaml`, or `*.dot`) | `render.py` |
| `svg/` | Web rendering. Text is converted to outlines, with each glyph defined once, so it looks the same in every browser and needs no web font. | The site pages (`![caption](…/svg/NAME.svg){fig-alt="…"}`) |
| `png/` | 2x rendering on white, tagged 192 dpi | The Word bundles: `scripts/build_bundles.py` embeds `png/NAME.png` in place of `svg/NAME.svg` |

## Rendering

```bash
python3 docs/images/sql-server/diagrams/render.py                 # every diagram
python3 docs/images/sql-server/diagrams/render.py book-05-ch01-parallel-run   # one or more by name
python3 docs/images/sql-server/diagrams/render.py --sheet /tmp/sheet.png      # also write a contact sheet
```

The script deletes outputs whose source no longer exists. It warns when a
diagram is wider than 800 px, because wider figures get scaled down in Word
until the text is too small to read.

### Requirements

- Graphviz (`dot`)
- `rsvg-convert` (Debian or Ubuntu package `librsvg2-bin`)
- `pdftocairo` (package `poppler-utils`), used for the sequence diagrams
- Python 3 with PyYAML and Pillow
- The fonts **Inter** and **IBM Plex Mono**, installed so that `fc-list` finds them.
  Text is measured with Pillow to wrap it, so the same fonts have to be present
  when you render.

The site build doesn't run `render.py`. It uses the committed `svg/` and `png/` files.

## Source kinds

- **`*.flow.yaml`**: boxes and arrows, converted to Graphviz. Node kinds are
  `card` (with optional `tag`, `title`, `body`, `foot`), `pill`, `text`,
  `table` and `point`. Clusters can be nested, and the `order` lists pin the
  left-to-right order of nodes. A body line that starts with `=` is
  printed without a bullet, and `` `code` `` spans are set in IBM Plex Mono.
- **`*.seq.yaml`**: sequence diagrams (participants, numbered steps,
  self-messages, frames and notes), drawn directly as SVG.
- **`*.dot`**: hand-written Graphviz, for anything the two above can't express.

## Style

The palette, fonts and type sizes are defined once at the top of
`render.py`. Never override them in an individual source.

| Tone | Stroke | Fill | Meaning |
|---|---|---|---|
| blue | `#2563EB` | `#EFF6FF` | Microsoft Entra ID, tokens, the target path |
| green | `#059669` | `#ECFDF5` | Satisfied, recommended, done |
| amber | `#D97706` | `#FFFBEB` | Interim, conditional, needs a decision |
| red | `#DC2626` | `#FEF2F2` | Legacy risk, blocked, fails |
| slate | `#64748B` | `#F8FAFC` | Active Directory, neutral infrastructure |
| violet | `#7C3AED` | `#F5F3FF` | Monitoring, governance, delegation |

Every diagram has a white background. Titles are 15 pt bold Inter, and
body text is 13 pt or 12 pt.

## Naming and placement

- File names follow `book-NN[-chNN]-topic` or `series-NN-topic` and match the
  page that uses them (`book-04-ch01-…` goes on `Book_04_CPT_01.md`).
- Each figure is inserted with a one-sentence caption, which also becomes the
  Word caption, and a longer `fig-alt` that describes what the diagram shows.
- Diagrams state only what Microsoft documents or what the page itself
  argues. They don't contain organization-specific names, and they assume the
  commercial Microsoft cloud at FedRAMP Moderate.
