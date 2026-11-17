#!/usr/bin/env python3
"""Check the New Look's Microsoft Learn training cards against Learn's catalog.

data/newlook/learn-training.yml lists Learn learning paths, modules,
certifications and Applied Skills. This script downloads Microsoft Learn's
public catalog (https://learn.microsoft.com/api/catalog/) and fails if any
entry's uid isn't in it, or its URL or title differs from the catalog's.

    python scripts/newlook/verify_learn.py            # check (needs the network)
    python scripts/newlook/verify_learn.py --catalog cat.json   # check against a saved copy

Not part of the offline unit tests; run it when the file changes.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data/newlook/learn-training.yml"
API = "https://learn.microsoft.com/api/catalog/?locale=en-us&type=learningPaths,modules,certifications,appliedSkills"


def entries(cfg: dict) -> list[dict]:
    out = [e for cards in (cfg.get("topics") or {}).values() for e in cards]
    out += [e for cards in (cfg.get("pages") or {}).values() for e in cards]
    return out


def strip(url: str) -> str:
    return url.split("?")[0].replace("learn.microsoft.com/en-us/", "learn.microsoft.com/")


def check(cfg: dict, catalog: dict) -> list[str]:
    by_uid = {x["uid"]: x for kind in catalog.values() if isinstance(kind, list) for x in kind}
    problems = []
    for e in entries(cfg):
        x = by_uid.get(e.get("uid"))
        if not x:
            problems.append(f"{e.get('uid')}: not in Learn's catalog")
            continue
        if strip(x["url"]) != e.get("url"):
            problems.append(f"{e['uid']}: URL {e.get('url')} != catalog {strip(x['url'])}")
        if x["title"] != e.get("title"):
            problems.append(f"{e['uid']}: title {e.get('title')!r} != catalog {x['title']!r}")
    return problems


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("--catalog", help="a saved copy of the catalog JSON")
    args = ap.parse_args(argv)
    cfg = yaml.safe_load(DATA.read_text(encoding="utf-8")) or {}
    if args.catalog:
        catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    else:
        req = urllib.request.Request(API, headers={"User-Agent": "catalog-check"})
        with urllib.request.urlopen(req, timeout=120) as r:
            catalog = json.load(r)
    problems = check(cfg, catalog)
    for p in problems:
        print(p, file=sys.stderr)
    print(f"{len(entries(cfg))} entries checked; {len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
