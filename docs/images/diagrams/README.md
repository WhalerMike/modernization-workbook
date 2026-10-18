# Generated diagrams (house style)

Every series outside the SQL Server narrative keeps its figures here, one
folder per series. The figures are generated from sources with the shared
renderer, `scripts/diagrams/render.py`, which uses the same code, palette and
type as the SQL Server narrative diagrams (`docs/images/sql-server/diagrams/`).
Edit a source, re-render, and commit the source together with its rendered
files. Don't edit `svg/` or `png/` by hand.

| Folder | Contents | Used by |
|---|---|---|
| `<series>/src/` | One source per diagram (`*.flow.yaml`, `*.seq.yaml`, or `*.dot`) | `scripts/diagrams/render.py` |
| `<series>/svg/` | Web rendering, text converted to outlines so it needs no web font | The site pages (`![caption](…/svg/NAME.svg){fig-alt="…"}`) |
| `<series>/png/` | 2x rendering on white, tagged 192 dpi | The Word bundles: `scripts/build_bundles.py` embeds `png/NAME.png` in place of `svg/NAME.svg` |

## Rendering

```bash
python3 scripts/diagrams/render.py                          # every series in this folder
python3 scripts/diagrams/render.py ssot-network-physics     # one or more series
python3 scripts/diagrams/render.py --only ch03-propagation-floor   # named diagrams
python3 scripts/diagrams/render.py --dir docs/images/sql-server/diagrams   # any folder with src/
python3 scripts/diagrams/render.py --sheet /tmp/sheet.png   # also write a contact sheet
```

The script deletes outputs whose source no longer exists, and warns when a
diagram is wider than 800 px (wider figures are scaled down in Word until the
text is hard to read). The site build doesn't run it; it uses the committed
`svg/` and `png/` files.

Requirements: Graphviz (`dot`), `rsvg-convert` (`librsvg2-bin`), `pdftocairo`
(`poppler-utils`), Python 3 with PyYAML and Pillow, and the fonts **Inter** and
**IBM Plex Mono** installed so `fc-list` finds them.

## Source kinds

- **`*.flow.yaml`**: boxes and arrows, converted to Graphviz. Node kinds are
  `card` (optional `tag`, `title`, `body`, `foot`), `pill`, `text`, `table` and
  `point`. Clusters can be nested; `order` lists pin left-to-right order. A body
  line starting with `=` has no bullet; `` `code` `` is set in IBM Plex Mono.
- **`*.seq.yaml`**: sequence diagrams (participants, numbered steps, frames, notes).
- **`*.dot`**: hand-written Graphviz for anything the two above can't express.

## Style

The palette and type sizes are defined once at the top of the renderer. Never
override them in a source.

| Tone | Stroke | Fill | Meaning |
|---|---|---|---|
| blue | `#2563EB` | `#EFF6FF` | Microsoft Entra ID, tokens, the target path |
| green | `#059669` | `#ECFDF5` | Satisfied, recommended, done |
| amber | `#D97706` | `#FFFBEB` | Interim, conditional, needs a decision |
| red | `#DC2626` | `#FEF2F2` | Legacy risk, blocked, fails |
| slate | `#64748B` | `#F8FAFC` | Active Directory, neutral infrastructure |
| violet | `#7C3AED` | `#F5F3FF` | Monitoring, governance, delegation |

Every diagram has a white background and no title inside the image; the
caption carries the title.

## Naming and placement

- Folder: the series' folder name under `docs/` (for example
  `ssot-network-physics`). File names follow `series-00-topic` for an index or
  landing page and `chNN-topic` (or the page's own stem) for a chapter.
- Each figure is inserted with a one-sentence caption, which also becomes the
  Word caption, and a longer `fig-alt` describing what the diagram shows.
- Diagrams state only what the page itself argues or what the vendor
  documents. No organization-specific names; the environment is the commercial
  Microsoft cloud at FedRAMP Moderate.
