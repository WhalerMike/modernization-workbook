"""Split a narrated video's WebVTT caption track into one track per slide, for embedding in the narrated deck.

Usage:  python presentations/_build/vtt_split.py <Base>_Narrated.vtt <narration folder>

For decks whose captions were made for the MP4 only (one track for the whole video), this cuts that track at the
slide boundaries the narrated build uses (each slide lasts its clip from durations.json plus 1 second) and writes
<narration folder>/slideNN.vtt with times relative to the start of each slide's clip, ready for a11y_fix.py --captions.
"""
import json
import re
import sys
from pathlib import Path

GAP = 1.0
src, nar = Path(sys.argv[1]), Path(sys.argv[2])
durations = {int(k): v for k, v in json.loads((nar / "durations.json").read_text(encoding="utf-8")).items()}


def secs(t: str) -> float:
    h, m, s = t.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def stamp(s: float) -> str:
    h, rem = divmod(max(s, 0.0), 3600)
    m, sec = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{sec:06.3f}"


cues = []
for block in re.split(r"\n\s*\n", src.read_text(encoding="utf-8").strip()):
    m = re.search(r"(\d+:\d+:[\d.]+)\s*-->\s*(\d+:\d+:[\d.]+)[^\n]*\n(.*)", block, re.S)
    if m:
        cues.append((secs(m.group(1)), secs(m.group(2)), m.group(3).strip()))

start = 0.0
for i in sorted(durations):
    end = start + durations[i] + GAP
    mine = [(a - start, min(b, end) - start, t) for a, b, t in cues if start - 0.05 <= a < end]
    out = ["WEBVTT", ""]
    for k, (a, b, t) in enumerate(mine, 1):
        out += [str(k), f"{stamp(a)} --> {stamp(max(b, a + 0.5))}", t, ""]
    (nar / f"slide{i:02d}.vtt").write_text("\n".join(out), encoding="utf-8")
    print(f"slide {i:2d}: {len(mine)} cues")
    start = end
