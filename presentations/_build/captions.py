"""WebVTT captions for a narrated deck, from its narration script and the sentence timings narrate.py recorded.

Usage:  python presentations/_build/captions.py presentations/<book>/<Base>.pptx

Reads, next to the deck:
  <Base>_Narration_Script.md           the written text per slide (what the captions show)
  narration_<Base>/durations.json      seconds per clip
  narration_<Base>/sentences.json      sentence timings per clip ([start s, duration s, spoken text])
Writes:
  narration_<Base>/slideNN.vtt         one caption track per slide, timed from the start of that slide's clip
                                       (embedded in the narrated deck by a11y_fix.py --captions)
  <Base>_Narrated.vtt                  one caption track for the whole narrated video (MP4)

The written text is aligned to what the voice actually said: narrate.py's spoken-form rules are applied to the
script before it is matched to the recorded sentences, so captions show "SASE" while the voice says "sassy".
Timeline for the whole-video track: build_narrated.ps1 advances each slide after its clip plus 1 second.
"""
import ast
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
DECK = Path(sys.argv[1])
BASE = DECK.stem
DIR = DECK.parent
NAR = DIR / f"narration_{BASE}"
GAP = 1.0          # build_narrated.ps1: AdvanceTime = clip + 1.0 s
MAXLEN = 84        # a cue is at most two lines of 42 characters
LINE = 42

# Reuse narrate.py's spoken-form rules, so the written text lines up with what the voice said.
src = (HERE / "narrate.py").read_text(encoding="utf-8")
ns = {"re": re}
for node in ast.parse(src).body:
    if (isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "PHON" for t in node.targets)) or \
       (isinstance(node, ast.FunctionDef) and node.name == "spoken"):
        exec(compile(ast.Module([node], []), "narrate.py", "exec"), ns)
spoken = ns["spoken"]


def norm(t: str) -> str:
    return re.sub(r"[^a-z0-9]", "", t.lower())


def chunks(text: str) -> list[str]:
    """Sentences, with long ones split at a comma, semicolon, colon or dash, else at a word boundary."""
    out = []
    for sent in re.split(r"(?<=[.!?])\s+", text.strip()):
        while len(sent) > MAXLEN:
            if len(sent) <= 2 * MAXLEN:  # two pieces: cut near the middle, at punctuation if one is close
                mid = len(sent) / 2
                puncts = [m.end() for m in re.finditer(r"[,;:]\s|\s—\s|\s–\s", sent) if len(sent) - MAXLEN <= m.end() <= MAXLEN + 1]
                spaces = [m.end() for m in re.finditer(r" ", sent) if len(sent) - MAXLEN <= m.end() <= MAXLEN + 1]
                near = [p for p in puncts if abs(p - mid) < 22]
                cut = min(near or spaces, key=lambda p: abs(p - mid)) if near or spaces else sent.rfind(" ", 0, MAXLEN + 1) + 1
            else:
                cut = max((m.end() for m in re.finditer(r"[,;:]\s|\s—\s|\s–\s", sent[:MAXLEN + 1])), default=0)
                if cut < MAXLEN // 3:
                    cut = sent.rfind(" ", 0, MAXLEN + 1) + 1
            out.append(sent[:cut].strip())
            sent = sent[cut:].strip()
        if sent:
            out.append(sent)
    return out


def wrap(t: str) -> str:
    if len(t) <= LINE:
        return t
    mid = len(t) // 2
    left, right = t.rfind(" ", 0, mid + 1), t.find(" ", mid)
    cut = left if right < 0 or (left >= 0 and mid - left <= right - mid) else right
    return t[:cut] + "\n" + t[cut + 1:]


def stamp(s: float) -> str:
    h, rem = divmod(max(s, 0.0), 3600)
    m, sec = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{sec:06.3f}"


def vtt(cues) -> str:
    out = ["WEBVTT", ""]
    for k, (s, e, t) in enumerate(cues, 1):
        out += [str(k), f"{stamp(s)} --> {stamp(e)}", wrap(t), ""]
    return "\n".join(out)


def tidy(cues):
    """No overlaps; close small gaps so captions don't flicker."""
    for a, b in zip(cues, cues[1:]):
        a[1] = b[0] if b[0] - a[1] < 0.6 else min(a[1] + 0.3, b[0])
    return cues


script = (DIR / f"{BASE}_Narration_Script.md").read_text(encoding="utf-8")
slides = {int(n): body.strip() for n, body in re.findall(r"^## Slide (\d+) — [^\n]*\n(.*?)(?=^## Slide |\Z)", script, re.S | re.M)}
durations = {int(k): v for k, v in json.loads((NAR / "durations.json").read_text(encoding="utf-8")).items()}
timings = {int(k): v for k, v in json.loads((NAR / "sentences.json").read_text(encoding="utf-8")).items()}
missing = sorted(set(durations) - set(timings))
if missing:
    sys.exit(f"no sentence timings for slides {missing}: rerun narrate.py (it re-records clips without timings)")

deck_cues, offset = [], 0.0
for i in sorted(durations):
    text = re.sub(r"\s*\n\s*", " ", slides[i])
    parts = chunks(text)
    sents = timings[i]
    lens = [len(norm(spoken(p))) for p in parts]
    blens = [len(norm(s[2])) for s in sents]
    scale = sum(blens) / sum(lens)
    if not 0.9 < scale < 1.1:
        sys.exit(f"slide {i}: script and recorded sentences differ too much ({scale:.2f}); was the script regenerated?")

    def at(q: float) -> float:  # time (s, within the clip) at normalized character position q
        q *= scale
        for (start, dur, _), n in zip(sents, blens):
            if q <= n:
                return start + dur * (q / n if n else 0)
            q -= n
        return sents[-1][0] + sents[-1][1]

    pos, cues = 0, []
    for p, n in zip(parts, lens):
        cues.append([at(pos), at(pos + n), p])
        pos += n
    tidy(cues)
    cues[-1][1] = max(cues[-1][1], min(durations[i], cues[-1][1] + 0.5))
    (NAR / f"slide{i:02d}.vtt").write_text(vtt(cues), encoding="utf-8")
    deck_cues += [[offset + s, offset + e, t] for s, e, t in cues]
    offset += durations[i] + GAP

tidy(deck_cues)
dst = DIR / f"{BASE}_Narrated.vtt"
dst.write_text(vtt(deck_cues), encoding="utf-8")
print(f"{dst.name}: {len(deck_cues)} cues over {len(durations)} slides, ends {stamp(deck_cues[-1][1])}, video ~{stamp(offset)}")
