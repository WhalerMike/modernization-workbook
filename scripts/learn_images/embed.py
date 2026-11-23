"""Insert pinned Microsoft Learn images into pages as credited figures.

    python scripts/learn_images/embed.py pinned-picks.json

Reads the picks pin.py wrote back (--out): guide, insert_after, pinned, caption, alt,
learn_url, learn_title. Each figure goes after the paragraph (or, for a heading, after the
first paragraph under it) that `insert_after` names, with the credit in its caption:

    ![Caption. Image: Microsoft Learn, [Title](url), CC BY 4.0.](rel/path.png){#fig-learn-... fig-alt="..."}

A figure already on the page (same image path) is skipped, so the script can be rerun.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LIST = re.compile(r"^\s*(\d+\.|[-*+])\s")


def figure(page: Path, p: dict) -> str:
    rel = os.path.relpath(ROOT / p["pinned"], page.parent).replace(os.sep, "/")
    fid = "fig-learn-" + re.sub(r"[^a-z0-9]+", "-", Path(p["pinned"]).stem.lower()).strip("-")
    cap = html.unescape(p["caption"]).strip().rstrip(".")
    alt = html.unescape(p["alt"]).replace('"', "'").replace("\n", " ").strip()
    return f'![{cap}. Image: Microsoft Learn, [{p["learn_title"]}]({p["learn_url"]}), CC BY 4.0.]({rel}){{#{fid} fig-alt="{alt}"}}'


def where(lines: list[str], key: str) -> int:
    key = html.unescape(key).strip()
    hit = next((i for i, l in enumerate(lines) if l.strip() == key), None)
    if hit is None:
        hit = next((i for i, l in enumerate(lines) if l.strip() and l.strip().startswith(key[:60])), None)
    if hit is None:
        raise LookupError(key)
    i = hit
    if lines[i].lstrip().startswith("#"):
        i += 1
        while i < len(lines) and not lines[i].strip():
            i += 1
    in_list = bool(LIST.match(lines[i])) or lines[i].startswith((" ", "\t"))
    fence = False
    while i < len(lines):
        if lines[i].lstrip().startswith("```"):
            fence = not fence
        if not lines[i].strip() and not fence:
            if not in_list:
                break
            # Inside a list: keep going through its continuation lines and later items.
            j = i
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and (lines[j].startswith((" ", "\t")) or LIST.match(lines[j])):
                i = j
                continue
            break
        i += 1
    return i


def main(path: str) -> int:
    picks = json.loads(Path(path).read_text(encoding="utf-8"))
    by_page: dict[str, list[dict]] = {}
    for p in picks:
        by_page.setdefault(p["guide"], []).append(p)
    bad = 0
    for guide, items in by_page.items():
        page = ROOT / guide
        raw = page.read_bytes().decode("utf-8")
        nl = "\r\n" if "\r\n" in raw else "\n"
        lines = raw.split(nl)
        for p in reversed(items):  # bottom-up keeps earlier positions valid when two share a spot
            if Path(p["pinned"]).name in raw and p["pinned"].split("/")[-2] in raw:
                continue
            try:
                at = where(lines, p["insert_after"])
            except LookupError:
                print(f"NOT PLACED {guide}: {p['insert_after'][:70]!r}"); bad += 1; continue
            lines[at:at] = ["", figure(page, p)]
        page.write_bytes(nl.join(lines).encode("utf-8"))
        print(f"{guide}: {len(items)} figure(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
