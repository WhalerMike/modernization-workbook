#!/usr/bin/env python3
"""Build the video manifest and the video library from the narrated decks.

Every narrated deck in presentations/<folder>/ has a caption track,
<Name>_Narrated.vtt, and an MP4 of the same name attached to the videos
release (too large for the repository or GitHub Pages). This script pairs
them and writes:

  docs/presentations/videos.json          read by the Watch page's player and
                                          by the fmw-video shortcode
  docs/presentations/_video-library.md    the library table on the Watch page

Each video also names the page it is built from (the first docs/ page its
folder README links, or a PAGES entry) and every kit under examples/ that the
deck or that page links, so the Watch page can send a viewer to the chapter
and its code.

The browser streams each MP4 from the release; the caption tracks are
published with the site, because a <track> must come from the page's own
origin. A video that is also on the workbook's YouTube channel carries its
YouTube ID (from data/youtube-ids.json), and the players embed it from
youtube-nocookie.com instead, keeping the MP4 as the download. Each video
also lists its slides as chapters, so the players can jump to any slide.

The narrated decks are on the current edition's Release, not in git
(scripts/deck_assets.py), so each video's "deck" is that Release URL, and the
chapters, read from the narrated deck's slide timings when the deck is here,
are kept in data/video-chapters.json for builds without the decks (CI).

    python scripts/generate_video_manifest.py            # write both files
    python scripts/generate_video_manifest.py --check    # exit 1 if either is stale
    python scripts/generate_video_manifest.py --verify   # also confirm every MP4 is on the release (needs gh),
                                                        and refresh data/video-durations.json from the MP4 headers
"""

from __future__ import annotations

import argparse
import json
import posixpath
import re
import struct
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import deck_assets  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
PRES = ROOT / "presentations"
OUT_JSON = ROOT / "docs" / "presentations" / "videos.json"
OUT_LIB = ROOT / "docs" / "presentations" / "_video-library.md"
# Each video's true length in seconds, read from its MP4 header by --verify.
# The caption track ends before the closing slides, so it undercounts.
DURATIONS = ROOT / "data" / "video-durations.json"
# Workbook video id -> YouTube video id, for the videos on the channel.
YOUTUBE = ROOT / "data" / "youtube-ids.json"
# Workbook video id -> chapters, from the narrated decks when they were last here.
CHAPTERS = ROOT / "data" / "video-chapters.json"
REPO = "WhalerMike/modernization-workbook"
RELEASE = "videos-2026-10-23"
BASE = f"https://github.com/{REPO}/releases/download/{RELEASE}"
GH = f"https://github.com/{REPO}/blob/main"

# Titles the folder README doesn't give, or gives once for several videos.
TITLES = {
    "Start_Here_Narrated": "Start Here: Where Modernization Begins",
    "HR_Driven_Identity_Exec_AnyAgency_Narrated": "HR-Driven Identity: interview talk, executive cut",
    "HR_Driven_Identity_AnyAgency_Narrated": "HR-Driven Identity: interview talk, detailed deck",
    "HR_Driven_Identity_Contractor_Source_AnyAgency_Narrated": "HR-Driven Identity: who is authoritative for a contractor",
}

# Videos whose folder README links an index (or no page) first: the page each one is built from.
PAGES = {
    "start-here": "docs/start-here.md",
    "start-02-first-four-weeks": "docs/start-here.md",
    "start-03-foundation-to-g1": "docs/start-here.md",
    "research-cyberark-clm": "docs/books/guides/cyberark-certificate-lifecycle.md",
    "research-infoblox-impl": "docs/books/guides/infoblox-nios-implementation.md",
    "research-ddi-requirements": "docs/books/explainers/ddi-platform-requirements.md",
    "research-device-naming": "docs/books/explainers/device-naming-after-ad.md",
    "research-hr-identity-dns": "docs/books/explainers/hr-identity-dns.md",
    "research-hybrid-credentials": "docs/books/explainers/hybrid-credentials.md",
    "research-infoblox-ddi": "docs/evaluations/infoblox-ddi-federal.md",
    "research-trinzic-multicloud": "docs/evaluations/trinzic-multicloud-ddi.md",
}
EXAMPLES = ROOT / "examples"
# The zip the site rebuilds on every deploy for a kit (.github/workflows/quarto-pages.yml): its own,
# or the workbook bundle it is the main kit of (build_start_kit_zip.BUNDLES).
KIT_ZIPS = {"start-kit": "start-kit.zip", "copilot-agent-pack": "copilot-agent-pack.zip",
            "app-modernization": "app-modernization.zip", "ansible": "ansible-examples.zip",
            "validation-kit": "validation-kit.zip", "cisco-sdwan": "cisco-sdwan.zip",
            "servicenow-sailpoint": "ticket-to-machine-code.zip", "hr-lifecycle": "hr-driven-identity-code.zip",
            "privileged-access": "privileged-access-code.zip", "non-person-identity": "non-person-identity-code.zip",
            "ms-automation": "microsoft-automation-code.zip"}
KIT_REF = re.compile(r"examples/([A-Za-z0-9_-]+)")

GROUPS = [
    ("start", "The Start series"),
    ("book", "Book presentations and briefings"),
    ("research", "Research"),
    ("developer", "Developer workbook chapter tours"),
    ("training", "Training: learning path modules"),
    ("interview", "HR-driven identity interview set"),
]


def group_of(folder: str) -> str:
    if folder.startswith("start"):
        return "start"
    if folder.startswith("research-"):
        return "research"
    if folder.startswith("hr-driven") and not folder.startswith("hr-driven-identity-implementation"):
        return "interview"   # the talk set; the implementation guide's deck series is a book presentation
    if folder.startswith("dw-"):
        return "developer"
    if folder.startswith("training-"):
        return "training"
    return "book"


def title_of(vid: str, folder: Path) -> str:
    if vid in TITLES:
        return TITLES[vid]
    readme = folder / "README.md"
    if readme.exists():
        for line in readme.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                return line[2:].strip()
    raise SystemExit(f"video manifest: no title for {vid}: add a README heading or a TITLES entry")


def page_of(folder: Path) -> str | None:
    """The docs page a video is built from, as a path from the repository root."""
    if folder.name in PAGES:
        page = PAGES[folder.name]
    else:
        readme = folder / "README.md"
        m = re.search(r"\]\(\.\./\.\./(docs/[^)#\s]+\.(?:md|qmd))", readme.read_text(encoding="utf-8")) if readme.exists() else None
        if not m:
            return None
        page = m.group(1)
    if not (ROOT / page).exists():
        raise SystemExit(f"video manifest: {folder.name} is built from {page}, which doesn't exist")
    return page


def kits_of(folder: Path, page: str | None) -> list[dict]:
    """Every kit under examples/ that the deck's sources or its page link, in order of first mention."""
    text = "".join(f.read_text(encoding="utf-8") for f in sorted(folder.glob("*.js")))
    text += "".join(f.read_text(encoding="utf-8") for f in sorted(folder.glob("*_Narration_Script.md")))
    if page:
        text += (ROOT / page).read_text(encoding="utf-8")
    names = [n for n in dict.fromkeys(KIT_REF.findall(text)) if n != "third_party" and (EXAMPLES / n).is_dir()]
    return [{"name": n, "url": f"https://github.com/{REPO}/tree/main/examples/{n}",
             "zip": f"downloads/{KIT_ZIPS[n]}" if n in KIT_ZIPS else None} for n in names]


def minutes_of(vtt: Path) -> int:
    ends = re.findall(r"--> (\d+):(\d+):(\d+)[.,](\d+)", vtt.read_text(encoding="utf-8"))
    if not ends:
        raise SystemExit(f"video manifest: {vtt} has no cues")
    h, m, s, _ = (int(x) for x in ends[-1])
    return max(1, round((h * 3600 + m * 60 + s) / 60))


def probe_seconds(url: str, size: int) -> float:
    """Read an MP4's duration from its mvhd box, fetching only the file's tail
    (these MP4s keep the moov box at the end) and then, if needed, its head."""
    tail = 4 * 1024 * 1024
    # Explicit ranges: the release's blob storage refuses suffix ranges ("bytes=-N").
    for rng in (f"bytes={max(0, size - tail)}-{size - 1}", f"bytes=0-{tail - 1}"):
        req = urllib.request.Request(url, headers={"Range": rng, "User-Agent": "FederalModernizationWorkbook-VideoManifest/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        i = data.find(b"mvhd")
        if i >= 0:
            version = data[i + 4]
            if version == 1:
                scale, duration = struct.unpack(">IQ", data[i + 24 : i + 36])
            else:
                scale, duration = struct.unpack(">II", data[i + 16 : i + 24])
            return duration / scale
    raise SystemExit(f"video manifest: no mvhd box found in {url}")


def chapters_of(deck: Path, script: Path) -> list[list] | None:
    """[start second, slide title] for each slide: the narrated deck's advance
    times (what the video export follows) summed, and the script's headings."""
    if not (deck.exists() and script.exists()):
        return None
    with zipfile.ZipFile(deck) as z:
        rels = {
            a["Id"]: a["Target"]
            for m in re.finditer(r"<Relationship [^>]*>", z.read("ppt/_rels/presentation.xml.rels").decode("utf-8"))
            for a in [dict(re.findall(r'(\w+)="([^"]*)"', m.group(0)))]
        }
        order = re.findall(r'<p:sldId [^>]*r:id="(rId\d+)"', z.read("ppt/presentation.xml").decode("utf-8"))
        advances = []
        for rid in order:
            m = re.search(r'advTm="(\d+)"', z.read("ppt/" + rels[rid]).decode("utf-8"))
            if not m:
                raise SystemExit(f"video manifest: {deck.name}: {rels[rid]} has no advance time")
            advances.append(int(m.group(1)) / 1000)
    titles = dict(re.findall(r"^## Slide (\d+) — (.+?)\s*$", script.read_text(encoding="utf-8"), re.M))
    if len(titles) != len(advances):
        raise SystemExit(f"video manifest: {script.name} heads {len(titles)} slides but {deck.name} has {len(advances)}")
    chapters, t = [], 0.0
    for i, adv in enumerate(advances, 1):
        chapters.append([int(t), titles[str(i)]])
        t += adv
    return chapters


def collect() -> list[dict]:
    seconds = json.loads(DURATIONS.read_text(encoding="utf-8")) if DURATIONS.exists() else {}
    youtube = json.loads(YOUTUBE.read_text(encoding="utf-8")) if YOUTUBE.exists() else {}
    cached = json.loads(CHAPTERS.read_text(encoding="utf-8")) if CHAPTERS.exists() else {}
    videos = []
    for vtt in sorted(PRES.glob("*/*_Narrated.vtt")):
        vid = vtt.stem
        folder = vtt.parent
        rel = folder.relative_to(ROOT).as_posix()
        deck = folder / f"{vid}.pptx"
        script = folder / f"{vid[: -len('_Narrated')]}_Narration_Script.md"
        page = page_of(folder)
        videos.append(
            {
                "id": vid,
                "title": title_of(vid, folder),
                "group": group_of(folder.name),
                "minutes": max(1, round(seconds[vid] / 60)) if vid in seconds else minutes_of(vtt),
                "mp4": f"{BASE}/{vid}.mp4",
                "youtube": youtube.get(vid),
                "vtt": f"{rel}/{vtt.name}",
                "deck": deck_assets.url(f"{rel}/{deck.name}"),
                "script": f"{GH}/{rel}/{script.name}" if script.exists() else None,
                "page": page[: page.rindex(".")] + ".html" if page else None,
                "source": page,
                "kits": kits_of(folder, page),
                "chapters": chapters_of(deck, script) if deck.exists() else cached.get(vid),
            }
        )
    unknown = sorted(set(youtube) - {v["id"] for v in videos})
    if unknown:
        raise SystemExit("video manifest: data/youtube-ids.json names unknown videos: " + ", ".join(unknown))
    order = {g: i for i, (g, _) in enumerate(GROUPS)}
    videos.sort(key=lambda v: (order[v["group"]], v["id"] != "Start_Here_Narrated", v["title"].lower()))
    return videos


# The link to a video's source page, by group.
READ = {"start": "Read the page", "book": "Read the page", "research": "Read the page",
        "developer": "Read the chapter", "training": "Read the module", "interview": "Read the page"}


def library(videos: list[dict]) -> str:
    lines = [
        "<!-- Generated by scripts/generate_video_manifest.py. Edit the script or the decks, not this file. -->",
        "",
    ]
    for key, heading in GROUPS:
        rows = [v for v in videos if v["group"] == key]
        if not rows:
            continue
        lines += [f"### {heading}", "", "| Video | Length | Also |", "|---|---|---|"]
        for v in rows:
            extra = []
            if v["page"]:
                extra.append(f"[{READ[v['group']]}]({posixpath.relpath(v['source'], 'docs/presentations')})")
            extra += [f"[Kit: {k['name']}]({k['url']})" for k in v["kits"]]
            extra.append(f"[MP4]({v['mp4']})")
            if v["youtube"]:
                extra.append(f"[YouTube](https://www.youtube.com/watch?v={v['youtube']})")
            if v["deck"]:
                extra.append(f"[Narrated deck]({v['deck']})")
            if v["script"]:
                extra.append(f"[Script]({v['script']})")
            lines.append(f"| [▶ {v['title']}](watch.html?v={v['id']}) | {v['minutes']} min | {' · '.join(extra)} |")
        lines += ["", f": {heading} {{.striped .hover}}", ""]
    return "\n".join(lines)


def verify(videos: list[dict]) -> None:
    assets = json.loads(subprocess.run(
        ["gh", "release", "view", RELEASE, "--repo", REPO, "--json", "assets"],
        check=True, capture_output=True, text=True,
    ).stdout)["assets"]
    sizes = {a["name"]: a["size"] for a in assets}
    missing = [v["id"] for v in videos if f"{v['id']}.mp4" not in sizes]
    if missing:
        raise SystemExit("video manifest: not on the release: " + ", ".join(missing))
    print(f"video manifest: all {len(videos)} MP4s are on {RELEASE}")
    seconds = {v["id"]: round(probe_seconds(v["mp4"], sizes[f"{v['id']}.mp4"]), 1) for v in videos}
    DURATIONS.write_bytes((json.dumps(seconds, indent=1, sort_keys=True) + "\n").encode("utf-8"))
    print(f"video manifest: durations read from {len(seconds)} MP4 headers")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    videos = collect()
    if args.verify:
        verify(videos)
        videos = collect()
    files = {
        OUT_JSON: json.dumps(videos, indent=1, ensure_ascii=False) + "\n",
        OUT_LIB: library(videos),
        CHAPTERS: json.dumps({v["id"]: v["chapters"] for v in videos if v["chapters"]}, indent=1,
                             ensure_ascii=False, sort_keys=True) + "\n",
    }
    stale = [p for p, text in files.items() if not p.exists() or p.read_bytes() != text.encode("utf-8")]
    if args.check:
        if stale:
            print("video manifest: stale: " + ", ".join(p.relative_to(ROOT).as_posix() for p in stale), file=sys.stderr)
            return 1
        return 0
    for p in stale:
        p.write_bytes(files[p].encode("utf-8"))
    print(f"video manifest: {len(videos)} videos, {len(stale)} files written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
