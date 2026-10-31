#!/usr/bin/env python3
"""The decks and narration audio that live on an edition's Release, not in git.

Every deck (`presentations/<folder>/<Name>.pptx`, plain and narrated) and every
folder of narration audio (`presentations/<folder>/narration_<Base>/*.mp3`) is
built on a workstation and published as an asset of the current edition's
GitHub Release: each deck as itself, each audio folder as one zip,
`<Base>_narration_audio.zip` (a Release holds at most 1,000 assets). Git keeps
the sources: build.js, narration.json, the sentence timings, the caption
tracks and the scripts. data/deck-assets.json lists every such file, the asset
that holds it, its size and sha256, and the edition it was published in.

    python scripts/deck_assets.py pack --out DIR          # copy the decks, zip the audio, list them
    python scripts/deck_assets.py verify EDITION          # the Release holds every file, byte for byte
    python scripts/deck_assets.py fetch presentations/b02-identity   # put a folder's decks and audio back
    python scripts/deck_assets.py fetch --all
    python scripts/deck_assets.py links                   # point every deck link at the current edition
    python scripts/deck_assets.py links --check           # exit 1 on a deck link that would 404

`scripts/cut_edition.py --decks` runs pack, uploads, runs verify (which records
the edition in data/deck-assets.json) and then links. Fetch the decks and
audio before rebuilding a deck, so the narration isn't regenerated
(presentations/_build/README.md), and before cutting the next edition, so it
carries every deck.

The link check fails on a Markdown link to a deck path in the repository
(the file isn't published any more) and on a link to an edition's Release
file that isn't in that edition's recorded file list (data/edition-assets/).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRES = ROOT / "presentations"
MANIFEST = ROOT / "data" / "deck-assets.json"
ASSETS = ROOT / "data" / "edition-assets"
REPO = "WhalerMike/modernization-workbook"
DOWNLOAD = f"https://github.com/{REPO}/releases/download"
BLOB = re.compile(rf"https://github\.com/{re.escape(REPO)}/(?:blob|raw)/[^/]+/(presentations/.+\.pptx)")
RELEASE = re.compile(rf"{re.escape(DOWNLOAD)}/(edition-[^/)\s]+)/([^/)\s]+)")
DECK_LINK = re.compile(r"\]\(([^)\s]+\.pptx)\)")
# Fixed zip timestamps, so packing the same audio twice gives the same bytes.
ZIP_TIME = (2026, 1, 1, 0, 0, 0)


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"edition": None, "files": []}


def save(manifest: dict) -> None:
    manifest["files"].sort(key=lambda f: f["path"])
    MANIFEST.write_bytes((json.dumps(manifest, indent=1) + "\n").encode("utf-8"))


def by_path() -> dict[str, str]:
    """Repository path of each deck -> its asset name."""
    return {f["path"]: f["asset"] for f in load()["files"]}


def url(path: str) -> str | None:
    """The Release URL of a deck (`presentations/<folder>/<Name>.pptx`), or None if it isn't published."""
    manifest = load()
    asset = {f["path"]: f["asset"] for f in manifest["files"]}.get(path)
    return f"{DOWNLOAD}/{manifest['edition']}/{asset}" if asset and manifest.get("edition") else None


# ------------------------------------------------------------------ pack

def local_decks() -> list[Path]:
    return sorted(p for p in PRES.glob("*/*.pptx") if not p.name.startswith("~$"))


def local_audio() -> list[Path]:
    return sorted(d for d in PRES.glob("*/narration_*") if d.is_dir() and any(d.glob("*.mp3")))


def zip_name(folder: Path) -> str:
    return folder.name[len("narration_"):] + "_narration_audio.zip"


def pack(out: Path) -> list[Path]:
    old = load()
    decks, audio = local_decks(), local_audio()
    have = {rel(p) for p in decks} | {rel(d) for d in audio}
    missing = [f["path"] for f in old["files"] if f["path"] not in have]
    if missing:
        raise SystemExit(f"deck_assets: {len(missing)} published files aren't here (run `fetch --all` first, or "
                         f"remove them from data/deck-assets.json if they are retired): " + ", ".join(missing[:5]))
    out.mkdir(parents=True, exist_ok=True)
    files, written, names = [], [], {}
    for deck in decks:
        names.setdefault(deck.name, []).append(rel(deck))
        target = out / deck.name
        shutil.copyfile(deck, target)
        files.append({"path": rel(deck), "asset": deck.name, "size": target.stat().st_size, "sha256": sha256(target)})
        written.append(target)
    for folder in audio:
        name = zip_name(folder)
        names.setdefault(name, []).append(rel(folder))
        target = out / name
        mp3s = sorted(folder.glob("*.mp3"))
        with zipfile.ZipFile(target, "w", zipfile.ZIP_STORED) as z:   # MP3s don't compress
            for mp3 in mp3s:
                info = zipfile.ZipInfo(f"{folder.name}/{mp3.name}", ZIP_TIME)
                info.external_attr = 0o644 << 16
                z.writestr(info, mp3.read_bytes())
        files.append({"path": rel(folder), "asset": name, "size": target.stat().st_size, "sha256": sha256(target),
                      "members": len(mp3s)})
        written.append(target)
    clash = {n: p for n, p in names.items() if len(p) > 1}
    if clash:
        raise SystemExit("deck_assets: two files would share one asset name: " + json.dumps(clash))
    save({"edition": old.get("edition"), "files": files})
    print(f"deck_assets: {len(decks)} decks and {len(audio)} audio zips in {out}, listed in data/deck-assets.json")
    return written


# ---------------------------------------------------------------- verify

def verify(edition: str) -> None:
    """Every listed file is on the Release with the same size and sha256; then record the edition."""
    view = json.loads(subprocess.run(["gh", "release", "view", edition, "--repo", REPO, "--json", "assets"],
                                     check=True, capture_output=True, text=True, encoding="utf-8").stdout)
    on_release = {a["name"]: a for a in view["assets"]}
    manifest = load()
    bad = []
    for f in manifest["files"]:
        a = on_release.get(f["asset"])
        if a is None:
            bad.append(f"{f['asset']}: not on the Release")
        elif a["size"] != f["size"]:
            bad.append(f"{f['asset']}: {a['size']} bytes on the Release, {f['size']} packed")
        elif a.get("digest") and a["digest"] != f"sha256:{f['sha256']}":
            bad.append(f"{f['asset']}: the Release's sha256 differs")
        elif not a.get("digest"):
            bad.append(f"{f['asset']}: the Release reports no digest to compare")
    if bad:
        raise SystemExit(f"deck_assets: {edition} doesn't hold the packed files:\n  " + "\n  ".join(bad))
    manifest["edition"] = edition
    save(manifest)
    print(f"deck_assets: all {len(manifest['files'])} files are on {edition} (size and sha256); recorded")


# ----------------------------------------------------------------- fetch

def fetch(folders: list[str], every: bool, force: bool) -> None:
    manifest = load()
    edition = manifest.get("edition") or sys.exit("deck_assets: data/deck-assets.json names no edition yet")
    wanted = [f for f in manifest["files"]
              if every or any(f["path"] == x.rstrip("/") or f["path"].startswith(x.rstrip("/") + "/") for x in folders)]
    if not wanted:
        raise SystemExit("deck_assets: nothing listed under " + ", ".join(folders))
    cache = ROOT / "_deck-cache"
    cache.mkdir(exist_ok=True)
    for f in wanted:
        target = ROOT / f["path"]
        if target.exists() and not force and not f["asset"].endswith(".zip"):
            continue
        part = cache / f["asset"]
        if not (part.exists() and sha256(part) == f["sha256"]):
            req = urllib.request.Request(f"{DOWNLOAD}/{edition}/{f['asset']}",
                                         headers={"User-Agent": "FederalModernizationWorkbook-DeckAssets/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r, part.open("wb") as fh:
                shutil.copyfileobj(r, fh)
            if sha256(part) != f["sha256"]:
                raise SystemExit(f"deck_assets: {f['asset']} from {edition} doesn't match data/deck-assets.json")
        if f["asset"].endswith(".zip"):
            with zipfile.ZipFile(part) as z:
                for member in z.namelist():
                    out = target.parent / member
                    if out.exists() and not force:
                        continue
                    out.parent.mkdir(parents=True, exist_ok=True)
                    out.write_bytes(z.read(member))
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(part, target)
    print(f"deck_assets: {len(wanted)} files from {edition} in place (downloads kept in _deck-cache/)")


# ----------------------------------------------------------------- links

def pages() -> list[Path]:
    out = subprocess.run(["git", "ls-files", "*.md", "*.qmd"], cwd=ROOT, check=True, capture_output=True,
                         text=True, encoding="utf-8").stdout.split()
    return [ROOT / p for p in out if not p.startswith(("_site/", "archive/"))]


def target_path(page: Path, target: str) -> str | None:
    """The repository path a deck link points at, or None if it isn't a deck in presentations/."""
    m = BLOB.fullmatch(target)
    if m:
        return m.group(1)
    if "://" in target:
        return None
    path = posixpath.normpath(posixpath.join(rel(page.parent), target.split("#")[0]))
    return path if path.startswith("presentations/") else None


def links(check: bool) -> int:
    manifest = load()
    edition = manifest.get("edition")
    names = {f["path"]: f["asset"] for f in manifest["files"]}
    by_asset = {f["asset"] for f in manifest["files"]}
    recorded = {p.stem: {a["name"] for a in json.loads(p.read_text(encoding="utf-8"))} for p in ASSETS.glob("*.json")}
    problems, changed = [], 0
    for page in pages():
        text = page.read_bytes().decode("utf-8")
        new = text

        def fix(m: re.Match) -> str:
            target = m.group(1)
            path = target_path(page, target)
            if path is not None and path in names and edition:
                return f"]({DOWNLOAD}/{edition}/{names[path]})"
            r = RELEASE.fullmatch(target)
            if r and edition and r.group(1) != edition and r.group(2) in by_asset:
                return f"]({DOWNLOAD}/{edition}/{r.group(2)})"
            return m.group(0)

        if not check:
            new = DECK_LINK.sub(fix, text)
        for m in DECK_LINK.finditer(new):
            target = m.group(1)
            line = new.count("\n", 0, m.start()) + 1
            path = target_path(page, target)
            if path is not None and not (ROOT / path).exists():
                problems.append(f"{rel(page)}:{line}: {target} isn't in the repository; link the edition's Release")
            elif path is not None and path in names:
                problems.append(f"{rel(page)}:{line}: {target} is published on the Release; run deck_assets.py links")
            r = RELEASE.fullmatch(target)
            if r and r.group(2) not in recorded.get(r.group(1), set()):
                problems.append(f"{rel(page)}:{line}: {r.group(2)} isn't in data/edition-assets/{r.group(1)}.json")
        if new != text:
            page.write_bytes(new.encode("utf-8"))
            changed += 1
    if not check:
        print(f"deck_assets: deck links on {changed} pages now point at {edition}")
    for p in problems:
        print(p, file=sys.stderr)
    if problems:
        print(f"deck_assets: {len(problems)} deck links would 404", file=sys.stderr)
    return 1 if problems else 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pack")
    p.add_argument("--out", type=Path, required=True)
    v = sub.add_parser("verify")
    v.add_argument("edition")
    f = sub.add_parser("fetch")
    f.add_argument("folders", nargs="*")
    f.add_argument("--all", action="store_true")
    f.add_argument("--force", action="store_true", help="overwrite files that are already here")
    lk = sub.add_parser("links")
    lk.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)
    if args.cmd == "pack":
        pack(args.out)
    elif args.cmd == "verify":
        verify(args.edition)
    elif args.cmd == "fetch":
        if not args.folders and not args.all:
            ap.error("name a folder, or --all")
        fetch(args.folders, args.all, args.force)
    else:
        return links(args.check)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
