#!/usr/bin/env python3
"""Build downloads/start-kit.zip from examples/start-kit.

Book 00 Chapter 08 and Book 06 Runbook R02 link the Start Kit as a download. This packs
the folder as it is in the repository, scripts, README, fixtures and tests, under a top-level
start-kit/ folder. The archive is reproducible: entries are sorted, timestamps fixed and
line endings left as committed, so the same commit always gives the same bytes.

Usage: python3 scripts/build_start_kit_zip.py [--out _site/downloads]
Default output directory: _site/downloads (the site's /downloads/ URL).
Standard library only.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
KIT = REPO / "examples" / "start-kit"
NAME = "start-kit.zip"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)
SKIP_PARTS = {"__pycache__", ".pytest_cache"}
# Windows can't create these names, so a file called one would break extraction there.
RESERVED = {"con", "prn", "aux", "nul"} | {f"com{i}" for i in range(1, 10)} | {f"lpt{i}" for i in range(1, 10)}


def kit_files() -> list[Path]:
    files = []
    for path in sorted(KIT.rglob("*")):
        if not path.is_file() or SKIP_PARTS.intersection(path.parts):
            continue
        for part in path.relative_to(KIT).parts:
            if part.split(".")[0].lower() in RESERVED:
                raise SystemExit(f"Reserved Windows file name in the kit: {path.relative_to(REPO)}")
        files.append(path)
    return files


def build(out_dir: Path) -> Path:
    files = kit_files()
    if not files:
        raise SystemExit(f"No files under {KIT.relative_to(REPO)}")
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / NAME
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in files:
            info = zipfile.ZipInfo("start-kit/" + path.relative_to(KIT).as_posix(), date_time=FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, path.read_bytes())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    print(f"Start Kit: {len(files)} files -> {target} (sha256 {digest})")
    return target


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=REPO / "_site" / "downloads", help="output directory")
    args = parser.parse_args(argv)
    build(args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
