"""Pin Microsoft Learn images into docs/images/learn/, unmodified, with their license.

Learn's documentation, images included, is licensed Creative Commons Attribution 4.0
International (CC BY 4.0) in its public GitHub repositories (MicrosoftDocs/*). The workbook
reuses a Learn image only as a pinned, byte-for-byte copy from one commit, credited under the
figure, so the image keeps its own license (not the workbook's CC BY-NC-ND 4.0).

    python scripts/learn_images/pin.py picks.json            # pin and write manifests
    python scripts/learn_images/pin.py picks.json --feeds    # also add a watch feed per image

picks.json is a list of objects with: learn_url, learn_title, repo (public, e.g.
MicrosoftDocs/entra-docs), image_path (repo-relative). One folder per Learn page:
docs/images/learn/<slug>/ with the images, the repository's LICENSE and snapshot.json, the
same manifest examples/third_party uses (scripts/tests/test_third_party_snapshots.py checks
both). Every file's git blob hash is checked against the upstream tree before it is written.

Uses the GitHub CLI (`gh api`), signed in. Never edit a pinned file: re-pin from a newer
commit in a reviewed pull request.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "docs" / "images" / "learn"
FEEDS = ROOT / "data" / "source-watch" / "feeds.json"
LICENSE_NAMES = ("LICENSE", "LICENSE.md", "LICENSE.txt")


def gh(path: str) -> object:
    out = subprocess.run(["gh", "api", path], capture_output=True, text=True, encoding="utf-8")
    if out.returncode:
        raise SystemExit(f"gh api {path}: {out.stderr.strip()}")
    return json.loads(out.stdout)


def blob_sha(body: bytes) -> str:
    return hashlib.sha1(b"blob %d\0" % len(body) + body).hexdigest()


def fetch(repo: str, path: str, ref: str) -> tuple[bytes, str]:
    """The file's bytes at ref, checked against the upstream blob hash."""
    meta = gh(f"repos/{repo}/contents/{path}?ref={ref}")
    if meta.get("content") and meta.get("encoding") == "base64":
        body = base64.b64decode(meta["content"])
    else:  # over 1 MB: the blob API
        body = base64.b64decode(gh(f"repos/{repo}/git/blobs/{meta['sha']}")["content"])
    if blob_sha(body) != meta["sha"]:
        raise SystemExit(f"{repo}/{path}@{ref}: bytes don't match the upstream blob hash")
    return body, meta["sha"]


def slug(url: str) -> str:
    parts = [p for p in urlsplit(url).path.strip("/").split("/") if p and not re.match(r"^[a-z]{2}-[a-z]{2}$", p)]
    return re.sub(r"[^a-z0-9-]+", "-", "-".join(parts[-3:]).lower()).strip("-")


def last_change(repo: str, path: str, ref: str) -> tuple[str, str]:
    c = gh(f"repos/{repo}/commits?path={path}&sha={ref}&per_page=1")
    return (c[0]["sha"], c[0]["commit"]["committer"]["date"][:10]) if c else ("", "")


def pin(picks: list[dict], add_feeds: bool) -> None:
    today = dt.date.today().isoformat()
    by_page: dict[str, list[dict]] = {}
    for p in picks:
        by_page.setdefault(p["learn_url"].replace("/en-us/", "/"), []).append(p)
    new_feeds = []
    for url, items in by_page.items():
        repo = items[0]["repo"]
        if any(i["repo"] != repo for i in items):
            raise SystemExit(f"{url}: images from more than one repository")
        name = slug(url)
        folder = DEST / name
        old = json.loads((folder / "snapshot.json").read_text(encoding="utf-8")) if (folder / "snapshot.json").exists() else None
        head = old["commit"] if old else gh(f"repos/{repo}/commits/{gh(f'repos/{repo}')['default_branch']}")["sha"]
        commit_date = gh(f"repos/{repo}/commits/{head}")["commit"]["committer"]["date"][:10]
        folder.mkdir(parents=True, exist_ok=True)
        files = dict(old["files"]) if old else {}
        path_map = dict(old["path_map"]) if old else {}
        lic_name = next((n for n in LICENSE_NAMES if _exists(repo, n, head)), None)
        if not lic_name:
            raise SystemExit(f"{repo}: no LICENSE at the repository root")
        body, _ = fetch(repo, lic_name, head)
        (folder / "LICENSE").write_bytes(body)
        files["LICENSE"] = {"bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
        path_map["LICENSE"] = f"{lic_name} (repository root)"
        lic_text = body.decode("utf-8", "replace")
        readme, _ = fetch(repo, "README.md", head)
        grant = re.search(r"license to the Microsoft documentation and other content in this repository under the \[Creative Commons Attribution 4\.0", readme.decode("utf-8", "replace"))
        if "NonCommercial" in lic_text or not (("Attribution 4.0" in lic_text) or grant):
            raise SystemExit(f"{repo}: neither the root LICENSE nor the README grants CC BY 4.0 for documentation; don't pin")
        lic_note = ("Creative Commons Attribution 4.0 International (LICENSE, copied from the repository root)."
                    if "Attribution 4.0" in lic_text else
                    "Creative Commons Attribution 4.0 International, as the repository's README grants for its documentation; "
                    "the root LICENSE file, copied here, holds the MIT License text, which also permits this reuse.")
        for i in items:
            body, _ = fetch(repo, i["image_path"], head)
            fname = Path(i["image_path"]).name
            if fname in path_map and path_map[fname] != i["image_path"]:
                fname = f"{Path(i['image_path']).parent.name}-{fname}"
            (folder / fname).write_bytes(body)
            files[fname] = {"bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
            path_map[fname] = i["image_path"]
            changed, changed_date = last_change(repo, i["image_path"], head)
            i["pinned"] = f"docs/images/learn/{name}/{fname}"
            i["image_last_changed"] = f"{changed_date} (commit {changed})"
            if add_feeds:
                new_feeds.append({
                    "id": f"learn-image-{name}-{Path(fname).stem}"[:90].lower(),
                    "name": f"Learn image: {i['learn_title']} ({Path(fname).name}, {repo} commits)",
                    "type": "github_commits", "repo": repo, "path": i["image_path"], "books": ["RES"],
                    "source": (f"Commits to the Microsoft Learn image docs/images/learn/{name}/{fname} pins at one commit, "
                               f"shown in the guides. A new commit means: look at the new image; if it changed, re-pin it with "
                               f"scripts/learn_images/pin.py in a reviewed pull request and check the figure's alt text."),
                })
        manifest = {
            "_comment": ("Pinned, unmodified copies of images from a Microsoft Learn page, reused in the workbook under the "
                         "repository's own license (Creative Commons Attribution 4.0 International), credited under each figure. "
                         "Never edit these files: re-pin from a newer upstream commit with scripts/learn_images/pin.py in a "
                         "reviewed pull request. scripts/tests/test_third_party_snapshots.py fails when a file stops matching its hash."),
            "name": f"Learn images: {items[0]['learn_title']}",
            "upstream_repo": f"https://github.com/{repo}",
            "commit": head,
            "commit_date": commit_date,
            "retrieved": old["retrieved"] if old else today,
            "license": lic_note,
            "documented_at": url,
            "path_map": dict(sorted(path_map.items())),
            "files": dict(sorted(files.items())),
        }
        (folder / "snapshot.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
        print(f"pinned {folder.relative_to(ROOT).as_posix()}: {len(items)} image(s) at {head[:10]}")
    if add_feeds and new_feeds:
        data = json.loads(FEEDS.read_text(encoding="utf-8"))
        feeds = data["feeds"] if isinstance(data, dict) else data
        have = {f["id"] for f in feeds}
        added = 0
        for f in new_feeds:
            if f["id"] not in have:
                feeds.append(f); have.add(f["id"]); added += 1
        FEEDS.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
        print(f"feeds: {added} added")


def _exists(repo: str, path: str, ref: str) -> bool:
    out = subprocess.run(["gh", "api", f"repos/{repo}/contents/{path}?ref={ref}", "--silent"], capture_output=True)
    return out.returncode == 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("picks")
    ap.add_argument("--feeds", action="store_true")
    ap.add_argument("--out", help="write the picks back with their pinned paths")
    a = ap.parse_args(argv)
    picks = json.loads(Path(a.picks).read_text(encoding="utf-8"))
    pin(picks, a.feeds)
    if a.out:
        Path(a.out).write_text(json.dumps(picks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
